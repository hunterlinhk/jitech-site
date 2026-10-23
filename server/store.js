"use strict";
/* Every database read and write goes through here. */
const { now } = require("./db");
const C = require("./constants");

const REF_OFFSET = 1000;
const ref = (id) => "JW-" + (REF_OFFSET + id);
const idFromRef = (s) => {
  const m = /^\s*jw-?(\d+)\s*$/i.exec(String(s || ""));
  return m ? Number(m[1]) - REF_OFFSET : null;
};
const likeEscape = (s) => String(s).replace(/[\\%_]/g, (c) => "\\" + c);

function createStore(db, cfg) {
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const run = (sql, ...a) => db.prepare(sql).run(...a);

  /* ---------------- settings ---------------- */
  const SETTING_DEFAULTS = {
    notify_emails: cfg.defaultNotifyEmails,
    webhook_url: cfg.defaultWebhookUrl,
    autoreply: true,
    notify_on_spam: false
  };
  function getSettings() {
    const out = { ...SETTING_DEFAULTS };
    for (const r of all("SELECT key, value FROM settings")) {
      try { out[r.key] = JSON.parse(r.value); } catch (e) { /* ignore a broken value */ }
    }
    return out;
  }
  function setSettings(patch) {
    const up = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    db.transaction(() => { for (const [k, v] of Object.entries(patch)) if (k in SETTING_DEFAULTS) up.run(k, JSON.stringify(v)); })();
    return getSettings();
  }

  /* ---------------- users ---------------- */
  const USER_COLS = "id, email, name, role, must_change_password, totp_enabled, notify_email, disabled, last_login_at, created_at";
  const publicUser = (u) => u && ({
    id: u.id, email: u.email, name: u.name, role: u.role,
    mustChangePassword: !!u.must_change_password, totpEnabled: !!u.totp_enabled,
    notifyEmail: !!u.notify_email, disabled: !!u.disabled,
    lastLoginAt: u.last_login_at, createdAt: u.created_at
  });
  const users = {
    count: () => one("SELECT COUNT(*) n FROM users").n,
    byEmail: (email) => one("SELECT * FROM users WHERE email = ?", String(email || "").trim()),
    byId: (id) => one("SELECT * FROM users WHERE id = ?", id),
    list: () => all(`SELECT ${USER_COLS} FROM users ORDER BY disabled, name COLLATE NOCASE`).map(publicUser),
    create({ email, name, role, passwordHash, mustChange }) {
      const r = run("INSERT INTO users (email, name, role, password_hash, must_change_password) VALUES (?, ?, ?, ?, ?)",
        String(email).trim(), String(name).trim(), role === "admin" ? "admin" : "member", passwordHash, mustChange ? 1 : 0);
      return users.byId(r.lastInsertRowid);
    },
    update(id, patch) {
      const map = { name: "name", role: "role", disabled: "disabled", notifyEmail: "notify_email", mustChange: "must_change_password",
        passwordHash: "password_hash", totpSecret: "totp_secret", totpEnabled: "totp_enabled", totpLastStep: "totp_last_step",
        failedLogins: "failed_logins", lockedUntil: "locked_until", lastLoginAt: "last_login_at", email: "email" };
      const sets = [], vals = [];
      for (const [k, col] of Object.entries(map)) {
        if (patch[k] === undefined) continue;
        let v = patch[k];
        if (typeof v === "boolean") v = v ? 1 : 0;
        sets.push(col + " = ?"); vals.push(v);
      }
      if (!sets.length) return users.byId(id);
      sets.push("updated_at = ?"); vals.push(now());
      run(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, ...vals, id);
      return users.byId(id);
    },
    activeAdmins: () => one("SELECT COUNT(*) n FROM users WHERE role = 'admin' AND disabled = 0").n,
    alertRecipients: () => all("SELECT email FROM users WHERE disabled = 0 AND notify_email = 1").map((r) => r.email),
    publicUser
  };

  /* ---------------- sessions ---------------- */
  const sessions = {
    create({ idHash, userId, csrf, ip, ua, expiresAt }) {
      const t = now();
      run("INSERT INTO sessions (id_hash, user_id, csrf, ip, user_agent, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        idHash, userId, csrf, ip || null, (ua || "").slice(0, 300), t, t, expiresAt);
    },
    get: (idHash) => one("SELECT * FROM sessions WHERE id_hash = ?", idHash),
    touch: (idHash, t) => run("UPDATE sessions SET last_seen_at = ? WHERE id_hash = ?", t, idHash),
    remove: (idHash) => run("DELETE FROM sessions WHERE id_hash = ?", idHash),
    removeForUser: (userId, exceptHash) => run("DELETE FROM sessions WHERE user_id = ? AND id_hash IS NOT ?", userId, exceptHash || null),
    forUser: (userId) => all("SELECT id_hash, ip, user_agent, created_at, last_seen_at FROM sessions WHERE user_id = ? ORDER BY last_seen_at DESC", userId),
    purgeExpired: (t) => run("DELETE FROM sessions WHERE expires_at < ?", t)
  };

  /* ---------------- audit log ---------------- */
  const audit = {
    add: (userId, email, action, detail, ip) => run("INSERT INTO audit_log (user_id, email, action, detail, ip) VALUES (?, ?, ?, ?, ?)",
      userId || null, email || null, action, detail ? String(detail).slice(0, 500) : null, ip || null),
    list: (limit = 200) => all("SELECT a.*, u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT ?", limit)
  };

  /* ---------------- inquiries ---------------- */
  function tagsFor(ids) {
    const map = new Map(ids.map((id) => [id, []]));
    if (!ids.length) return map;
    const rows = all(`SELECT inquiry_id, tag FROM inquiry_tags WHERE inquiry_id IN (${ids.map(() => "?").join(",")}) ORDER BY tag`, ...ids);
    for (const r of rows) map.get(r.inquiry_id).push(r.tag);
    return map;
  }

  function shape(r, tags) {
    return {
      id: r.id, ref: ref(r.id), createdAt: r.created_at, updatedAt: r.updated_at,
      name: r.name, company: r.company, email: r.email, phone: r.phone,
      service: r.service, plan: r.plan, lang: r.lang,
      status: r.status, priority: r.priority,
      assignee: r.assignee_id ? { id: r.assignee_id, name: r.assignee_name } : null,
      followUpAt: r.follow_up_at, read: !!r.read_at, archived: !!r.archived_at, spam: !!r.spam, spamReason: r.spam_reason,
      tags: tags || [], noteCount: r.note_count || 0
    };
  }

  function createInquiry(d) {
    const r = run(`INSERT INTO inquiries (name, company, email, phone, service, plan, message, lang, source_page, referrer,
        utm_source, utm_medium, utm_campaign, ip, user_agent, spam, spam_reason)
      VALUES (@name, @company, @email, @phone, @service, @plan, @message, @lang, @source_page, @referrer,
        @utm_source, @utm_medium, @utm_campaign, @ip, @user_agent, @spam, @spam_reason)`, {
      name: d.name, company: d.company || null, email: d.email, phone: d.phone || null, service: d.service || null, plan: d.plan || null,
      message: d.message, lang: d.lang || "en", source_page: d.sourcePage || null, referrer: d.referrer || null,
      utm_source: d.utmSource || null, utm_medium: d.utmMedium || null, utm_campaign: d.utmCampaign || null,
      ip: d.ip || null, user_agent: d.userAgent || null, spam: d.spam ? 1 : 0, spam_reason: d.spamReason || null
    });
    const id = Number(r.lastInsertRowid);
    run("INSERT INTO events (inquiry_id, type, data) VALUES (?, 'received', ?)", id, JSON.stringify({ spam: !!d.spam, reason: d.spamReason || undefined }));
    return getInquiry(id);
  }

  function getInquiry(id) {
    const r = one(`SELECT i.*, u.name AS assignee_name, (SELECT COUNT(*) FROM notes n WHERE n.inquiry_id = i.id) AS note_count
      FROM inquiries i LEFT JOIN users u ON u.id = i.assignee_id WHERE i.id = ?`, id);
    if (!r) return null;
    const out = shape(r, tagsFor([id]).get(id));
    Object.assign(out, {
      message: r.message, sourcePage: r.source_page, referrer: r.referrer,
      utm: { source: r.utm_source, medium: r.utm_medium, campaign: r.utm_campaign },
      ip: r.ip, userAgent: r.user_agent, readAt: r.read_at, archivedAt: r.archived_at
    });
    return out;
  }

  function inquiryDetail(id) {
    const inq = getInquiry(id);
    if (!inq) return null;
    inq.notes = all(`SELECT n.id, n.body, n.created_at, n.updated_at, n.user_id, u.name AS user_name FROM notes n
      LEFT JOIN users u ON u.id = n.user_id WHERE n.inquiry_id = ? ORDER BY n.id`, id)
      .map((n) => ({ id: n.id, body: n.body, createdAt: n.created_at, updatedAt: n.updated_at, user: n.user_id ? { id: n.user_id, name: n.user_name } : null }));
    inq.events = all(`SELECT e.id, e.type, e.data, e.created_at, e.user_id, u.name AS user_name FROM events e
      LEFT JOIN users u ON u.id = e.user_id WHERE e.inquiry_id = ? ORDER BY e.id`, id)
      .map((e) => ({ id: e.id, type: e.type, data: e.data ? JSON.parse(e.data) : null, createdAt: e.created_at, user: e.user_id ? { id: e.user_id, name: e.user_name } : null }));
    inq.related = all(`SELECT id, created_at, status, service FROM inquiries WHERE email = ? COLLATE NOCASE AND id != ? ORDER BY id DESC LIMIT 10`, inq.email, id)
      .map((r) => ({ id: r.id, ref: ref(r.id), createdAt: r.created_at, status: r.status, service: r.service }));
    return inq;
  }

  function where(f, me) {
    const w = [], p = [];
    const view = f.view || "inbox";
    const live = "i.archived_at IS NULL AND i.spam = 0";
    const open = `i.status IN (${C.OPEN_STATUS_IDS.map(() => "?").join(",")})`;
    if (view === "inbox") { w.push(live, open); p.push(...C.OPEN_STATUS_IDS); }
    else if (view === "unread") w.push(live, "i.read_at IS NULL");
    else if (view === "mine") { w.push(live, "i.assignee_id = ?"); p.push(me); }
    else if (view === "followup") { w.push(live, "i.follow_up_at IS NOT NULL", "i.follow_up_at <= ?", open); p.push(f.today || now().slice(0, 10), ...C.OPEN_STATUS_IDS); }
    else if (view === "archived") w.push("i.archived_at IS NOT NULL", "i.spam = 0");
    else if (view === "spam") w.push("i.spam = 1");
    else w.push("i.spam = 0"); // all
    const inList = (col, vals, allowed) => {
      vals = [].concat(vals || []).flatMap((v) => String(v).split(",")).filter((v) => allowed ? allowed.includes(v) : v);
      if (vals.length) { w.push(`${col} IN (${vals.map(() => "?").join(",")})`); p.push(...vals); }
    };
    inList("i.status", f.status, C.STATUS_IDS);
    inList("i.priority", f.priority, C.PRIORITY_IDS);
    inList("i.service", f.service, Object.keys(C.SERVICES));
    inList("i.lang", f.lang, Object.keys(C.LANGS));
    if (f.assignee === "none") w.push("i.assignee_id IS NULL");
    else if (f.assignee === "me") { w.push("i.assignee_id = ?"); p.push(me); }
    else if (f.assignee && /^\d+$/.test(f.assignee)) { w.push("i.assignee_id = ?"); p.push(Number(f.assignee)); }
    if (f.tag) { w.push("EXISTS (SELECT 1 FROM inquiry_tags t WHERE t.inquiry_id = i.id AND t.tag = ?)"); p.push(String(f.tag)); }
    // from / to: an ISO time (the dashboard sends local midnights), or a plain date read as UTC
    const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z)?$/;
    if (f.from && ISO.test(f.from)) { w.push("i.created_at >= ?"); p.push(f.from); }
    if (f.to && ISO.test(f.to)) { w.push(f.to.length === 10 ? "i.created_at < date(?, '+1 day')" : "i.created_at < ?"); p.push(f.to); }
    const q = String(f.q || "").trim().slice(0, 200);
    if (q) {
      const rid = idFromRef(q);
      if (rid) { w.push("i.id = ?"); p.push(rid); }
      else {
        for (const term of q.split(/\s+/).slice(0, 8)) {
          const like = "%" + likeEscape(term) + "%";
          w.push(`(i.name LIKE ? ESCAPE '\\' OR i.company LIKE ? ESCAPE '\\' OR i.email LIKE ? ESCAPE '\\' OR i.phone LIKE ? ESCAPE '\\'
            OR i.message LIKE ? ESCAPE '\\' OR EXISTS (SELECT 1 FROM notes n WHERE n.inquiry_id = i.id AND n.body LIKE ? ESCAPE '\\')
            OR EXISTS (SELECT 1 FROM inquiry_tags t WHERE t.inquiry_id = i.id AND t.tag LIKE ? ESCAPE '\\'))`);
          p.push(like, like, like, like, like, like, like);
        }
      }
    }
    return { sql: w.length ? "WHERE " + w.join(" AND ") : "", params: p };
  }

  const SORTS = {
    newest: "i.created_at DESC, i.id DESC",
    oldest: "i.created_at ASC, i.id ASC",
    updated: "i.updated_at DESC, i.id DESC",
    priority: "CASE i.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, i.created_at DESC",
    followup: "i.follow_up_at IS NULL, i.follow_up_at ASC, i.created_at DESC",
    name: "i.name COLLATE NOCASE ASC"
  };

  function listInquiries(f, me) {
    const { sql, params } = where(f, me);
    const per = Math.min(Math.max(Number(f.per) || 50, 1), 200);
    const page = Math.max(Number(f.page) || 1, 1);
    const total = one(`SELECT COUNT(*) n FROM inquiries i ${sql}`, ...params).n;
    const rows = all(`SELECT i.id, i.created_at, i.updated_at, i.name, i.company, i.email, i.phone, i.service, i.plan, i.lang, i.status,
        i.priority, i.assignee_id, u.name AS assignee_name, i.follow_up_at, i.read_at, i.archived_at, i.spam, i.spam_reason,
        substr(i.message, 1, 220) AS snippet, (SELECT COUNT(*) FROM notes n WHERE n.inquiry_id = i.id) AS note_count
      FROM inquiries i LEFT JOIN users u ON u.id = i.assignee_id ${sql}
      ORDER BY ${SORTS[f.sort] || SORTS.newest} LIMIT ? OFFSET ?`, ...params, per, (page - 1) * per);
    const tags = tagsFor(rows.map((r) => r.id));
    return { total, page, per, pages: Math.max(1, Math.ceil(total / per)), items: rows.map((r) => Object.assign(shape(r, tags.get(r.id)), { snippet: r.snippet })) };
  }

  /** Every inquiry matching a filter, for the CSV export (no paging). */
  function exportInquiries(f, me) {
    const { sql, params } = where(f, me);
    const rows = all(`SELECT i.*, u.name AS assignee_name FROM inquiries i LEFT JOIN users u ON u.id = i.assignee_id ${sql} ORDER BY ${SORTS[f.sort] || SORTS.newest} LIMIT 20000`, ...params);
    const tags = tagsFor(rows.map((r) => r.id));
    return rows.map((r) => Object.assign(r, { tags: tags.get(r.id) }));
  }

  /** Sidebar counts and the overview numbers. Day boundaries come from the dashboard, so they follow the viewer's time zone. */
  function counts(me, o) {
    const today = o.today || now().slice(0, 10);
    const dayStart = o.dayStart || today + "T00:00:00.000Z";
    const monthStart = o.monthStart || today.slice(0, 8) + "01T00:00:00.000Z";
    const back = (days) => new Date(Date.parse(dayStart) - days * 86400000).toISOString();
    const live = "archived_at IS NULL AND spam = 0";
    const open = `status IN (${C.OPEN_STATUS_IDS.map((s) => `'${s}'`).join(",")})`;
    const c = one(`SELECT
        SUM(CASE WHEN ${live} AND ${open} THEN 1 ELSE 0 END) AS inbox,
        SUM(CASE WHEN ${live} AND read_at IS NULL THEN 1 ELSE 0 END) AS unread,
        SUM(CASE WHEN ${live} AND assignee_id = @me THEN 1 ELSE 0 END) AS mine,
        SUM(CASE WHEN ${live} AND ${open} AND follow_up_at IS NOT NULL AND follow_up_at <= @today THEN 1 ELSE 0 END) AS followup,
        SUM(CASE WHEN archived_at IS NOT NULL AND spam = 0 THEN 1 ELSE 0 END) AS archived,
        SUM(CASE WHEN spam = 1 THEN 1 ELSE 0 END) AS spam,
        SUM(CASE WHEN spam = 0 THEN 1 ELSE 0 END) AS "all"
      FROM inquiries`, { me, today });
    for (const k of Object.keys(c)) c[k] = c[k] || 0;
    const byStatus = {};
    for (const s of C.STATUS_IDS) byStatus[s] = 0;
    for (const r of all(`SELECT status, COUNT(*) n FROM inquiries WHERE ${live} GROUP BY status`)) byStatus[r.status] = r.n;
    const stats = one(`SELECT
        SUM(CASE WHEN created_at >= @d0 THEN 1 ELSE 0 END) AS today,
        SUM(CASE WHEN created_at >= @d6 THEN 1 ELSE 0 END) AS week,
        SUM(CASE WHEN created_at >= @d29 THEN 1 ELSE 0 END) AS month
      FROM inquiries WHERE spam = 0`, { d0: dayStart, d6: back(6), d29: back(29) });
    const won = one(`SELECT COUNT(DISTINCT e.inquiry_id) n FROM events e JOIN inquiries i ON i.id = e.inquiry_id
      WHERE e.type = 'status' AND json_extract(e.data, '$.to') = 'won' AND i.status = 'won' AND e.created_at >= ?`, monthStart).n;
    const byService = all(`SELECT service, COUNT(*) n FROM inquiries WHERE spam = 0 AND created_at >= ? GROUP BY service ORDER BY n DESC`, back(29));
    const recent = all(`SELECT created_at FROM inquiries WHERE spam = 0 AND created_at >= ? ORDER BY created_at`, back(13)).map((r) => r.created_at);
    return { views: c, byStatus, stats: { today: stats.today || 0, week: stats.week || 0, month: stats.month || 0, wonThisMonth: won }, byService, recent };
  }

  function addEvent(inquiryId, userId, type, data) {
    run("INSERT INTO events (inquiry_id, user_id, type, data) VALUES (?, ?, ?, ?)", inquiryId, userId || null, type, data ? JSON.stringify(data) : null);
  }

  /** Applies a change and records each part in the activity history. Returns the list of changes made. */
  function updateInquiry(id, patch, userId) {
    const cur = one("SELECT * FROM inquiries WHERE id = ?", id);
    if (!cur) return null;
    const changes = [];
    const sets = [], vals = [];
    const set = (col, v) => { sets.push(col + " = ?"); vals.push(v); };
    const t = now();
    db.transaction(() => {
      if (patch.status !== undefined && patch.status !== cur.status) {
        set("status", patch.status); changes.push(["status", { from: cur.status, to: patch.status }]);
      }
      if (patch.priority !== undefined && patch.priority !== cur.priority) {
        set("priority", patch.priority); changes.push(["priority", { from: cur.priority, to: patch.priority }]);
      }
      if (patch.assigneeId !== undefined && (patch.assigneeId || null) !== (cur.assignee_id || null)) {
        const u = patch.assigneeId ? users.byId(patch.assigneeId) : null;
        set("assignee_id", u ? u.id : null); changes.push(["assigned", { to: u ? { id: u.id, name: u.name } : null }]);
      }
      if (patch.followUpAt !== undefined && (patch.followUpAt || null) !== (cur.follow_up_at || null)) {
        set("follow_up_at", patch.followUpAt || null); changes.push(["followup", { date: patch.followUpAt || null }]);
      }
      if (patch.archived !== undefined && !!patch.archived !== !!cur.archived_at) {
        set("archived_at", patch.archived ? t : null); changes.push([patch.archived ? "archived" : "unarchived", null]);
      }
      if (patch.spam !== undefined && !!patch.spam !== !!cur.spam) {
        set("spam", patch.spam ? 1 : 0); if (!patch.spam) set("spam_reason", null);
        changes.push([patch.spam ? "spam" : "not_spam", null]);
      }
      if (patch.read !== undefined && !!patch.read !== !!cur.read_at) set("read_at", patch.read ? t : null);
      if (patch.tags !== undefined) {
        const before = tagsFor([id]).get(id);
        const after = [...new Set(patch.tags)].sort();
        if (before.join("\u0000").toLowerCase() !== after.join("\u0000").toLowerCase()) {
          run("DELETE FROM inquiry_tags WHERE inquiry_id = ?", id);
          const ins = db.prepare("INSERT OR IGNORE INTO inquiry_tags (inquiry_id, tag) VALUES (?, ?)");
          after.forEach((tag) => ins.run(id, tag));
          changes.push(["tags", { added: after.filter((x) => !before.includes(x)), removed: before.filter((x) => !after.includes(x)) }]);
        }
      }
      const meaningful = changes.length > 0;
      if (meaningful) set("updated_at", t);
      if (sets.length) run(`UPDATE inquiries SET ${sets.join(", ")} WHERE id = ?`, ...vals, id);
      for (const [type, data] of changes) addEvent(id, userId, type, data);
    })();
    return changes;
  }

  function deleteInquiry(id) { return run("DELETE FROM inquiries WHERE id = ?", id).changes > 0; }

  function allTags() { return all("SELECT tag, COUNT(*) n FROM inquiry_tags t JOIN inquiries i ON i.id = t.inquiry_id WHERE i.spam = 0 GROUP BY tag COLLATE NOCASE ORDER BY n DESC, tag LIMIT 200"); }

  /* ---------------- notes ---------------- */
  const notes = {
    add(inquiryId, userId, body) {
      const r = run("INSERT INTO notes (inquiry_id, user_id, body) VALUES (?, ?, ?)", inquiryId, userId, body);
      run("UPDATE inquiries SET updated_at = ? WHERE id = ?", now(), inquiryId);
      return notes.get(Number(r.lastInsertRowid));
    },
    get(id) {
      const n = one("SELECT n.*, u.name AS user_name FROM notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.id = ?", id);
      return n && { id: n.id, inquiryId: n.inquiry_id, body: n.body, createdAt: n.created_at, updatedAt: n.updated_at, user: n.user_id ? { id: n.user_id, name: n.user_name } : null };
    },
    update(id, body) { run("UPDATE notes SET body = ?, updated_at = ? WHERE id = ?", body, now(), id); return notes.get(id); },
    remove(id) { return run("DELETE FROM notes WHERE id = ?", id).changes > 0; }
  };

  /** Recent submissions from the same email, for duplicate detection. */
  const recentFromEmail = (email, minutes) => one(`SELECT COUNT(*) n FROM inquiries WHERE email = ? COLLATE NOCASE AND created_at >= ?`,
    email, new Date(Date.now() - minutes * 60000).toISOString()).n;

  return {
    db, ref, idFromRef,
    getSettings, setSettings, users, sessions, audit, notes,
    createInquiry, getInquiry, inquiryDetail, listInquiries, exportInquiries, counts, updateInquiry, deleteInquiry, addEvent, allTags,
    recentFromEmail
  };
}

module.exports = { createStore, ref, idFromRef };
