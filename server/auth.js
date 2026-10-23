"use strict";
/* Dashboard sign-in: sessions in the database, an HttpOnly cookie, CSRF tokens, lockouts and optional two-factor codes. */
const S = require("./security");
const { now } = require("./db");

function parseCookies(header) {
  const out = {};
  String(header || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i < 0) return;
    const k = p.slice(0, i).trim();
    if (!k || out[k] !== undefined) return;
    try { out[k] = decodeURIComponent(p.slice(i + 1).trim()); } catch (e) { out[k] = p.slice(i + 1).trim(); }
  });
  return out;
}

function createAuth({ cfg, store, notifier }) {
  const COOKIE = cfg.cookieSecure ? "__Host-jw_session" : "jw_session";
  const IDLE_MS = cfg.sessionHours * 3600 * 1000;
  const MAX_MS = cfg.sessionMaxDays * 86400 * 1000;
  const LOCK_AFTER = 5, LOCK_MINUTES = 15;
  const loginIp = new S.RateLimiter(20, 15 * 60 * 1000);
  const pending = new Map(); // two-factor step: ticket -> { userId, exp, tries }
  setInterval(() => {
    loginIp.sweep();
    const t = Date.now();
    for (const [k, v] of pending) if (v.exp < t) pending.delete(k);
    store.sessions.purgeExpired(now());
  }, 5 * 60 * 1000).unref();

  function setCookie(res, value, maxAgeSec) {
    const parts = [`${COOKIE}=${value}`, "Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${maxAgeSec}`];
    if (cfg.cookieSecure) parts.push("Secure");
    res.append("Set-Cookie", parts.join("; "));
  }

  function startSession(req, res, user) {
    const tok = S.token(32);
    const csrf = S.token(24);
    store.sessions.create({
      idHash: S.sha256(tok), userId: user.id, csrf, ip: req.ip, ua: req.get("user-agent"),
      expiresAt: new Date(Date.now() + MAX_MS).toISOString()
    });
    store.users.update(user.id, { failedLogins: 0, lockedUntil: null, lastLoginAt: now() });
    store.audit.add(user.id, user.email, "login", null, req.ip);
    setCookie(res, tok, Math.floor(MAX_MS / 1000));
    return csrf;
  }

  function endSession(req, res) {
    const tok = parseCookies(req.get("cookie"))[COOKIE];
    if (tok) store.sessions.remove(S.sha256(tok));
    setCookie(res, "", 0);
  }

  /** Attaches req.user and req.session, or answers 401. */
  function requireUser(req, res, next) {
    const tok = parseCookies(req.get("cookie"))[COOKIE];
    if (!tok) return res.status(401).json({ error: "signed_out" });
    const idHash = S.sha256(tok);
    const s = store.sessions.get(idHash);
    const t = Date.now();
    if (!s || Date.parse(s.expires_at) < t || Date.parse(s.last_seen_at) + IDLE_MS < t) {
      if (s) store.sessions.remove(idHash);
      setCookie(res, "", 0);
      return res.status(401).json({ error: "signed_out" });
    }
    const user = store.users.byId(s.user_id);
    if (!user || user.disabled) { store.sessions.remove(idHash); return res.status(401).json({ error: "signed_out" }); }
    if (t - Date.parse(s.last_seen_at) > 60000) store.sessions.touch(idHash, new Date(t).toISOString());
    req.user = user; req.session = s; req.sessionHash = idHash;
    next();
  }

  /** Changes need the CSRF token from /me in a header, and a same-site Origin when the browser sends one. */
  function csrf(req, res, next) {
    if (req.method === "GET" || req.method === "HEAD") return next();
    const origin = req.get("origin");
    if (origin) {
      try { if (new URL(origin).host !== req.get("host")) return res.status(403).json({ error: "bad_origin" }); }
      catch (e) { return res.status(403).json({ error: "bad_origin" }); }
    }
    if (!req.session || !S.safeEqual(req.get("x-csrf-token"), req.session.csrf)) return res.status(403).json({ error: "bad_csrf" });
    next();
  }

  /** Until a temporary password is changed, only the account routes work. */
  function passwordFresh(req, res, next) {
    if (req.user.must_change_password) return res.status(403).json({ error: "password_change_required" });
    next();
  }

  const requireAdmin = (req, res, next) => (req.user.role === "admin" ? next() : res.status(403).json({ error: "admins_only" }));

  async function login(req, res) {
    const ip = req.ip;
    if (!req.is("application/json")) return res.status(415).json({ error: "json_only" });
    const origin = req.get("origin");
    if (origin) { try { if (new URL(origin).host !== req.get("host")) return res.status(403).json({ error: "bad_origin" }); } catch (e) { return res.status(403).json({ error: "bad_origin" }); } }
    if (!loginIp.hit(ip)) {
      res.setHeader("Retry-After", String(loginIp.retryAfter(ip)));
      return res.status(429).json({ error: "rate_limited", message: "Too many sign-in attempts from this network. Try again in a few minutes." });
    }
    const email = String((req.body || {}).email || "").trim().slice(0, 254);
    const password = String((req.body || {}).password || "").slice(0, 300);
    const user = email ? store.users.byEmail(email) : null;
    const generic = { error: "invalid", message: "That email and password don't match an account." };
    if (!user || user.disabled) {
      S.verifyPassword(password, S.DUMMY_HASH);
      store.audit.add(null, email, "login_failed", user ? "account disabled" : "unknown email", ip);
      return res.status(401).json(generic);
    }
    if (user.locked_until && Date.parse(user.locked_until) > Date.now()) {
      const mins = Math.ceil((Date.parse(user.locked_until) - Date.now()) / 60000);
      return res.status(423).json({ error: "locked", message: `This account is locked after too many attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}, or ask an admin to reset the password.` });
    }
    if (!S.verifyPassword(password, user.password_hash)) {
      const n = user.failed_logins + 1;
      if (n >= LOCK_AFTER) {
        store.users.update(user.id, { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() });
        store.audit.add(user.id, user.email, "locked", `${LOCK_AFTER} failed attempts`, ip);
        return res.status(423).json({ error: "locked", message: `Too many attempts. This account is locked for ${LOCK_MINUTES} minutes.` });
      }
      store.users.update(user.id, { failedLogins: n });
      store.audit.add(user.id, user.email, "login_failed", "wrong password", ip);
      return res.status(401).json(generic);
    }
    if (user.totp_enabled) {
      const ticket = S.token(24);
      pending.set(ticket, { userId: user.id, exp: Date.now() + 5 * 60000, tries: 0 });
      return res.json({ totp: true, ticket });
    }
    const csrfToken = startSession(req, res, user);
    res.json({ ok: true, csrf: csrfToken });
  }

  function loginTotp(req, res) {
    const { ticket, code } = req.body || {};
    const p = pending.get(String(ticket || ""));
    if (!p || p.exp < Date.now()) { pending.delete(String(ticket || "")); return res.status(401).json({ error: "expired", message: "That sign-in took too long. Start again." }); }
    const user = store.users.byId(p.userId);
    if (!user || user.disabled || !user.totp_enabled) { pending.delete(ticket); return res.status(401).json({ error: "expired", message: "Start again." }); }
    const step = S.verifyTotp(user.totp_secret, code, user.totp_last_step);
    if (step == null) {
      p.tries++;
      store.audit.add(user.id, user.email, "login_failed", "wrong two-factor code", req.ip);
      if (p.tries >= 5) { pending.delete(ticket); return res.status(401).json({ error: "expired", message: "Too many wrong codes. Start again." }); }
      return res.status(401).json({ error: "bad_code", message: "That code didn't work. Check your authenticator app and try the newest code." });
    }
    pending.delete(ticket);
    store.users.update(user.id, { totpLastStep: step });
    const csrfToken = startSession(req, res, user);
    res.json({ ok: true, csrf: csrfToken });
  }

  function logout(req, res) {
    if (req.user) store.audit.add(req.user.id, req.user.email, "logout", null, req.ip);
    endSession(req, res);
    res.json({ ok: true });
  }

  /** Signs a user out everywhere (after a password reset or when an account is disabled). */
  function revokeUser(userId, exceptHash) {
    store.sessions.removeForUser(userId, exceptHash);
    if (!exceptHash) notifier.hub.dropUser(userId);
  }

  return { requireUser, requireAdmin, csrf, passwordFresh, login, loginTotp, logout, revokeUser, COOKIE };
}

module.exports = { createAuth, parseCookies };
