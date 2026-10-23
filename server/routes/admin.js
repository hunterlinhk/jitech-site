"use strict";
/* The dashboard API, under /admin/api. Every route needs a signed-in user; changes also need the CSRF token. */
const express = require("express");
const crypto = require("crypto");
const QRCode = require("qrcode");
const C = require("../constants");
const S = require("../security");

const TEMP_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function tempPassword() {
  const groups = [];
  for (let g = 0; g < 4; g++) {
    let s = "";
    for (let i = 0; i < 4; i++) s += TEMP_ALPHABET[crypto.randomInt(TEMP_ALPHABET.length)];
    groups.push(s);
  }
  return groups.join("-");
}

const csvCell = (v) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // keeps spreadsheet apps from running a cell as a formula
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const cleanTags = (tags) => [...new Set([].concat(tags || [])
  .map((t) => String(t).replace(/[\u0000-\u001F,]/g, "").trim().slice(0, 32))
  .filter(Boolean))].slice(0, 12);

/** Checks a PATCH body for an inquiry. Returns [patch, error]. */
function inquiryPatch(body, store) {
  const p = {};
  if (body.status !== undefined) { if (!C.STATUS_IDS.includes(body.status)) return [null, "Unknown status."]; p.status = body.status; }
  if (body.priority !== undefined) { if (!C.PRIORITY_IDS.includes(body.priority)) return [null, "Unknown priority."]; p.priority = body.priority; }
  if (body.assigneeId !== undefined) {
    if (body.assigneeId === null || body.assigneeId === "") p.assigneeId = null;
    else {
      const u = store.users.byId(Number(body.assigneeId));
      if (!u || u.disabled) return [null, "That team member doesn't exist."];
      p.assigneeId = u.id;
    }
  }
  if (body.followUpAt !== undefined) {
    if (body.followUpAt === null || body.followUpAt === "") p.followUpAt = null;
    else if (!DATE.test(body.followUpAt)) return [null, "Follow-up date must look like 2026-11-03."];
    else p.followUpAt = body.followUpAt;
  }
  for (const k of ["archived", "spam", "read"]) if (body[k] !== undefined) p[k] = !!body[k];
  if (body.tags !== undefined) p.tags = cleanTags(body.tags);
  return [p, null];
}

function adminRoutes({ cfg, store, notifier, auth }) {
  const r = express.Router();
  r.use(express.json({ limit: "64kb" }));

  const ok = (res, extra) => res.json(Object.assign({ ok: true }, extra));
  const bad = (res, message, status = 400) => res.status(status).json({ error: "invalid", message });
  const broadcast = (type, payload, by) => notifier.hub.send("inquiry", Object.assign({ type, by }, payload));

  /* ---------- signing in ---------- */
  r.post("/login", auth.login);
  r.post("/login/totp", auth.loginTotp);

  r.use(auth.requireUser, auth.csrf);

  r.post("/logout", auth.logout);

  r.get("/me", (req, res) => {
    res.json({
      user: store.users.publicUser(req.user),
      csrf: req.session.csrf,
      meta: {
        statuses: C.STATUSES, priorities: C.PRIORITIES, services: C.SERVICES, plans: C.PLANS, langs: C.LANGS,
        mailEnabled: notifier.mailEnabled, siteUrl: cfg.siteUrl, company: cfg.company
      }
    });
  });

  r.patch("/me", (req, res) => {
    const b = req.body || {};
    const patch = {};
    if (b.name !== undefined) { const n = String(b.name).trim().slice(0, 80); if (!n) return bad(res, "Enter your name."); patch.name = n; }
    if (b.notifyEmail !== undefined) patch.notifyEmail = !!b.notifyEmail;
    ok(res, { user: store.users.publicUser(store.users.update(req.user.id, patch)) });
  });

  r.post("/me/password", (req, res) => {
    const { current, next } = req.body || {};
    if (!S.verifyPassword(String(current || ""), req.user.password_hash)) return bad(res, "Your current password isn't right.", 403);
    const problem = S.passwordProblem(next, req.user.email);
    if (problem) return bad(res, problem);
    if (S.verifyPassword(String(next), req.user.password_hash)) return bad(res, "Choose a password you haven't used here before.");
    store.users.update(req.user.id, { passwordHash: S.hashPassword(next), mustChange: false });
    auth.revokeUser(req.user.id, req.sessionHash);
    store.audit.add(req.user.id, req.user.email, "password_changed", null, req.ip);
    ok(res);
  });

  r.get("/me/sessions", (req, res) => {
    res.json({ sessions: store.sessions.forUser(req.user.id).map((s) => ({
      current: s.id_hash === req.sessionHash, ip: s.ip, userAgent: s.user_agent, createdAt: s.created_at, lastSeenAt: s.last_seen_at
    })) });
  });
  r.post("/me/sessions/revoke-others", (req, res) => {
    auth.revokeUser(req.user.id, req.sessionHash);
    store.audit.add(req.user.id, req.user.email, "sessions_revoked", null, req.ip);
    ok(res);
  });

  r.post("/me/2fa/setup", async (req, res) => {
    if (!S.verifyPassword(String((req.body || {}).password || ""), req.user.password_hash)) return bad(res, "Your password isn't right.", 403);
    if (req.user.totp_enabled) return bad(res, "Two-factor sign-in is already on.");
    const secret = S.totpSecret();
    store.users.update(req.user.id, { totpSecret: secret, totpEnabled: false, totpLastStep: null });
    const uri = S.totpUri(secret, req.user.email);
    const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220, errorCorrectionLevel: "M" });
    res.json({ secret: secret.replace(/(.{4})/g, "$1 ").trim(), uri, qr });
  });
  r.post("/me/2fa/enable", (req, res) => {
    const u = store.users.byId(req.user.id);
    if (!u.totp_secret || u.totp_enabled) return bad(res, "Start the setup again.");
    const step = S.verifyTotp(u.totp_secret, (req.body || {}).code, null);
    if (step == null) return bad(res, "That code didn't match. Use the newest code in your app.");
    store.users.update(u.id, { totpEnabled: true, totpLastStep: step });
    store.audit.add(u.id, u.email, "2fa_enabled", null, req.ip);
    ok(res);
  });
  r.post("/me/2fa/disable", (req, res) => {
    if (!S.verifyPassword(String((req.body || {}).password || ""), req.user.password_hash)) return bad(res, "Your password isn't right.", 403);
    store.users.update(req.user.id, { totpEnabled: false, totpSecret: null, totpLastStep: null });
    store.audit.add(req.user.id, req.user.email, "2fa_disabled", null, req.ip);
    ok(res);
  });

  /* ---------- everything below needs a non-temporary password ---------- */
  r.use(auth.passwordFresh);

  /* live updates */
  r.get("/events", (req, res) => {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.write("retry: 5000\n\n");
    const off = notifier.hub.add(res, req.user.id);
    req.on("close", off);
  });

  /* ---------- inquiries ---------- */
  r.get("/inquiries", (req, res) => res.json(store.listInquiries(req.query, req.user.id)));

  r.get("/inquiries/counts", (req, res) => {
    const q = req.query;
    const iso = (v) => (typeof v === "string" && !isNaN(Date.parse(v)) ? new Date(v).toISOString() : undefined);
    res.json(store.counts(req.user.id, { today: DATE.test(q.today) ? q.today : undefined, dayStart: iso(q.dayStart), monthStart: iso(q.monthStart) }));
  });

  r.get("/inquiries/export.csv", (req, res) => {
    const rows = store.exportInquiries(req.query, req.user.id);
    const head = ["Reference", "Received (UTC)", "Name", "Company", "Email", "Phone", "Service", "Plan", "Language", "Status", "Priority",
      "Assigned to", "Tags", "Follow-up", "Archived", "Spam", "Page", "UTM source", "UTM medium", "UTM campaign", "Message"];
    const statusLabel = Object.fromEntries(C.STATUSES.map((s) => [s.id, s.label]));
    const lines = [head.map(csvCell).join(",")];
    for (const x of rows) {
      lines.push([store.ref(x.id), x.created_at, x.name, x.company, x.email, x.phone, (C.SERVICES[x.service] || {}).en || x.service,
        (C.PLANS[x.plan] || {}).en || x.plan, C.LANGS[x.lang] || x.lang, statusLabel[x.status] || x.status, x.priority, x.assignee_name,
        x.tags.join("; "), x.follow_up_at, x.archived_at ? "yes" : "", x.spam ? "yes" : "", x.source_page, x.utm_source, x.utm_medium, x.utm_campaign, x.message]
        .map(csvCell).join(","));
    }
    store.audit.add(req.user.id, req.user.email, "export", rows.length + " inquiries", req.ip);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="jieweitech-inquiries-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send("\uFEFF" + lines.join("\r\n"));
  });

  const idParam = (req) => (/^\d+$/.test(req.params.id) ? Number(req.params.id) : store.idFromRef(req.params.id));

  r.get("/inquiries/:id", (req, res) => {
    const id = idParam(req);
    let inq = id && store.inquiryDetail(id);
    if (!inq) return res.status(404).json({ error: "not_found", message: "That inquiry doesn't exist (it may have been deleted)." });
    if (!inq.read && req.query.peek !== "1") {
      store.updateInquiry(id, { read: true }, req.user.id);
      inq.read = true;
      broadcast("updated", { id }, req.user.id);
    }
    res.json(inq);
  });

  r.patch("/inquiries/:id", (req, res) => {
    const id = idParam(req);
    if (!id || !store.getInquiry(id)) return res.status(404).json({ error: "not_found" });
    const [patch, err] = inquiryPatch(req.body || {}, store);
    if (err) return bad(res, err);
    const changes = store.updateInquiry(id, patch, req.user.id);
    broadcast("updated", { id }, req.user.id);
    res.json({ ok: true, changes: changes.length, inquiry: store.inquiryDetail(id) });
  });

  r.post("/inquiries/bulk", (req, res) => {
    const { ids, action, value } = req.body || {};
    const list = [...new Set([].concat(ids || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 500);
    if (!list.length) return bad(res, "Select at least one inquiry.");
    let patch;
    switch (action) {
      case "status": patch = { status: value }; break;
      case "priority": patch = { priority: value }; break;
      case "assign": patch = { assigneeId: value }; break;
      case "archive": patch = { archived: true }; break;
      case "unarchive": patch = { archived: false }; break;
      case "spam": patch = { spam: true }; break;
      case "not_spam": patch = { spam: false }; break;
      case "read": patch = { read: true }; break;
      case "unread": patch = { read: false }; break;
      case "tag": {
        const add = cleanTags([value]);
        if (!add.length) return bad(res, "Enter a tag.");
        let n = 0;
        for (const id of list) { const cur = store.getInquiry(id); if (cur) { store.updateInquiry(id, { tags: [...cur.tags, ...add] }, req.user.id); n++; } }
        broadcast("bulk", { ids: list }, req.user.id);
        return ok(res, { updated: n });
      }
      case "delete": {
        if (req.user.role !== "admin") return res.status(403).json({ error: "admins_only", message: "Only admins can delete inquiries." });
        let n = 0;
        for (const id of list) if (store.deleteInquiry(id)) n++;
        store.audit.add(req.user.id, req.user.email, "inquiries_deleted", list.map(store.ref).join(", "), req.ip);
        broadcast("deleted", { ids: list }, req.user.id);
        return ok(res, { deleted: n });
      }
      default: return bad(res, "Unknown action.");
    }
    const [p, err] = inquiryPatch(patch, store);
    if (err) return bad(res, err);
    let n = 0;
    store.db.transaction(() => { for (const id of list) if (store.updateInquiry(id, p, req.user.id) !== null) n++; })();
    broadcast("bulk", { ids: list }, req.user.id);
    ok(res, { updated: n });
  });

  r.delete("/inquiries/:id", auth.requireAdmin, (req, res) => {
    const id = idParam(req);
    if (!id || !store.deleteInquiry(id)) return res.status(404).json({ error: "not_found" });
    store.audit.add(req.user.id, req.user.email, "inquiries_deleted", store.ref(id), req.ip);
    broadcast("deleted", { ids: [id] }, req.user.id);
    ok(res);
  });

  /* notes */
  r.post("/inquiries/:id/notes", (req, res) => {
    const id = idParam(req);
    if (!id || !store.getInquiry(id)) return res.status(404).json({ error: "not_found" });
    const body = String((req.body || {}).body || "").trim();
    if (!body) return bad(res, "Write something first.");
    if (body.length > 5000) return bad(res, "Notes can be up to 5,000 characters.");
    const note = store.notes.add(id, req.user.id, body);
    broadcast("updated", { id }, req.user.id);
    res.status(201).json(note);
  });
  const noteGuard = (req, res) => {
    const n = store.notes.get(Number(req.params.id));
    if (!n) { res.status(404).json({ error: "not_found" }); return null; }
    if (req.user.role !== "admin" && (!n.user || n.user.id !== req.user.id)) { res.status(403).json({ error: "forbidden", message: "You can only change your own notes." }); return null; }
    return n;
  };
  r.patch("/notes/:id", (req, res) => {
    const n = noteGuard(req, res); if (!n) return;
    const body = String((req.body || {}).body || "").trim();
    if (!body || body.length > 5000) return bad(res, "Notes need 1 to 5,000 characters.");
    const out = store.notes.update(n.id, body);
    broadcast("updated", { id: n.inquiryId }, req.user.id);
    res.json(out);
  });
  r.delete("/notes/:id", (req, res) => {
    const n = noteGuard(req, res); if (!n) return;
    store.notes.remove(n.id);
    broadcast("updated", { id: n.inquiryId }, req.user.id);
    ok(res);
  });

  r.get("/tags", (req, res) => res.json(store.allTags()));

  /* ---------- team ---------- */
  r.get("/users", (req, res) => res.json(store.users.list()));

  r.post("/users", auth.requireAdmin, (req, res) => {
    const b = req.body || {};
    const email = String(b.email || "").trim().toLowerCase();
    const name = String(b.name || "").trim().slice(0, 80);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad(res, "Enter a valid email address.");
    if (!name) return bad(res, "Enter a name.");
    if (store.users.byEmail(email)) return bad(res, "Someone with that email already has an account.");
    const pw = tempPassword();
    const u = store.users.create({ email, name, role: b.role === "admin" ? "admin" : "member", passwordHash: S.hashPassword(pw), mustChange: true });
    store.audit.add(req.user.id, req.user.email, "user_created", `${email} (${u.role})`, req.ip);
    res.status(201).json({ user: store.users.publicUser(u), tempPassword: pw });
  });

  r.patch("/users/:id", auth.requireAdmin, (req, res) => {
    const u = store.users.byId(Number(req.params.id));
    if (!u) return res.status(404).json({ error: "not_found" });
    const b = req.body || {};
    const patch = {};
    if (b.name !== undefined) { const n = String(b.name).trim().slice(0, 80); if (!n) return bad(res, "Enter a name."); patch.name = n; }
    if (b.role !== undefined) {
      if (!["admin", "member"].includes(b.role)) return bad(res, "Unknown role.");
      if (u.role === "admin" && b.role !== "admin" && !u.disabled && store.users.activeAdmins() <= 1) return bad(res, "There must always be at least one admin.");
      patch.role = b.role;
    }
    if (b.disabled !== undefined) {
      if (u.id === req.user.id && b.disabled) return bad(res, "You can't turn off your own account.");
      if (b.disabled && u.role === "admin" && !u.disabled && store.users.activeAdmins() <= 1) return bad(res, "There must always be at least one admin.");
      patch.disabled = !!b.disabled;
    }
    const out = store.users.update(u.id, patch);
    if (patch.disabled) auth.revokeUser(u.id);
    store.audit.add(req.user.id, req.user.email, "user_updated", `${u.email}: ${Object.keys(patch).join(", ")}`, req.ip);
    res.json({ user: store.users.publicUser(out) });
  });

  r.post("/users/:id/reset-password", auth.requireAdmin, (req, res) => {
    const u = store.users.byId(Number(req.params.id));
    if (!u) return res.status(404).json({ error: "not_found" });
    const pw = tempPassword();
    store.users.update(u.id, { passwordHash: S.hashPassword(pw), mustChange: true, failedLogins: 0, lockedUntil: null });
    auth.revokeUser(u.id, u.id === req.user.id ? req.sessionHash : undefined);
    store.audit.add(req.user.id, req.user.email, "password_reset", u.email, req.ip);
    res.json({ tempPassword: pw });
  });

  r.post("/users/:id/reset-2fa", auth.requireAdmin, (req, res) => {
    const u = store.users.byId(Number(req.params.id));
    if (!u) return res.status(404).json({ error: "not_found" });
    store.users.update(u.id, { totpEnabled: false, totpSecret: null, totpLastStep: null });
    store.audit.add(req.user.id, req.user.email, "2fa_reset", u.email, req.ip);
    ok(res);
  });

  /* ---------- settings ---------- */
  r.get("/settings", auth.requireAdmin, (req, res) => res.json({ settings: store.getSettings(), mailEnabled: notifier.mailEnabled }));

  r.put("/settings", auth.requireAdmin, (req, res) => {
    const b = req.body || {};
    const patch = {};
    if (b.notify_emails !== undefined) {
      const list = [...new Set([].concat(b.notify_emails).flatMap((s) => String(s).split(/[,;\s]+/)).map((s) => s.trim().toLowerCase()).filter(Boolean))];
      const badOne = list.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e));
      if (badOne) return bad(res, `"${badOne}" isn't a valid email address.`);
      if (list.length > 20) return bad(res, "Add up to 20 addresses.");
      patch.notify_emails = list;
    }
    if (b.webhook_url !== undefined) {
      const u = String(b.webhook_url || "").trim();
      if (u && !/^https:\/\/[^\s]+$/i.test(u)) return bad(res, "The webhook address must start with https://");
      patch.webhook_url = u;
    }
    if (b.autoreply !== undefined) patch.autoreply = !!b.autoreply;
    if (b.notify_on_spam !== undefined) patch.notify_on_spam = !!b.notify_on_spam;
    const out = store.setSettings(patch);
    store.audit.add(req.user.id, req.user.email, "settings_changed", Object.keys(patch).join(", "), req.ip);
    res.json({ settings: out, mailEnabled: notifier.mailEnabled });
  });

  r.post("/settings/test", auth.requireAdmin, async (req, res) => res.json(await notifier.test(req.user)));

  r.get("/audit", auth.requireAdmin, (req, res) => res.json(store.audit.list(300)));

  r.use((req, res) => res.status(404).json({ error: "not_found" }));
  return r;
}

module.exports = { adminRoutes, tempPassword, csvCell };
