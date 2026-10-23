"use strict";
/* Passwords, tokens, two-factor codes, rate limits and HTTP security headers. */
const crypto = require("crypto");

/* ---------- passwords (scrypt) ---------- */
const SCRYPT = { N: 32768, r: 8, p: 1, keylen: 64, maxmem: 96 * 1024 * 1024 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(String(password).normalize("NFKC"), salt, SCRYPT.keylen, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

function verifyPassword(password, stored) {
  try {
    const [alg, N, r, p, salt, key] = String(stored).split("$");
    if (alg !== "scrypt") return false;
    const want = Buffer.from(key, "base64");
    const got = crypto.scryptSync(String(password).normalize("NFKC"), Buffer.from(salt, "base64"), want.length, {
      N: Number(N), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem
    });
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  } catch (e) {
    return false;
  }
}

// A hash of a random password, so a login attempt for an unknown email takes as long as a real one.
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString("hex"));

const COMMON = new Set(["password", "password1", "password123", "123456789", "1234567890", "qwertyuiop", "letmein123", "iloveyou12", "jieweitech", "jieweitech1", "admin12345", "welcome123", "changeme123"]);
function passwordProblem(pw, email) {
  pw = String(pw || "");
  if (pw.length < 10) return "Use at least 10 characters.";
  if (pw.length > 200) return "Use 200 characters or fewer.";
  if (COMMON.has(pw.toLowerCase())) return "That password is too common. Choose something less guessable.";
  if (email && pw.toLowerCase().includes(String(email).split("@")[0].toLowerCase()) && String(email).split("@")[0].length > 3) return "Don't include your email name in the password.";
  if (/^(.)\1+$/.test(pw)) return "Avoid repeating a single character.";
  return null;
}

/* ---------- tokens ---------- */
const token = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");
const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
function safeEqual(a, b) {
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/* ---------- two-factor codes (TOTP, RFC 6238: 6 digits, 30 s, SHA-1, works with any authenticator app) ---------- */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(buf) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0; const out = [];
  for (const c of clean) {
    value = (value << 5) | B32.indexOf(c); bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
const totpSecret = () => base32Encode(crypto.randomBytes(20));
function hotp(secret, counter) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", base32Decode(secret)).update(buf).digest();
  const o = h[h.length - 1] & 15;
  const code = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 1e6).padStart(6, "0");
}
/** Returns the matching time step (so it can't be reused), or null. Accepts one step of clock drift either way. */
function verifyTotp(secret, code, lastStep, at = Date.now()) {
  code = String(code || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(code)) return null;
  const step = Math.floor(at / 30000);
  for (const d of [0, -1, 1]) {
    const s = step + d;
    if (lastStep != null && s <= lastStep) continue;
    if (safeEqual(hotp(secret, s), code)) return s;
  }
  return null;
}
function totpUri(secret, email) {
  const label = encodeURIComponent("JIEWEITECH Admin:" + email);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent("JIEWEITECH Admin")}&algorithm=SHA1&digits=6&period=30`;
}

/* ---------- rate limiting (in memory; fine for a single server process) ---------- */
class RateLimiter {
  constructor(limit, windowMs) { this.limit = limit; this.windowMs = windowMs; this.hits = new Map(); }
  _prune(key, t) {
    const arr = (this.hits.get(key) || []).filter((x) => t - x < this.windowMs);
    if (arr.length) this.hits.set(key, arr); else this.hits.delete(key);
    return arr;
  }
  check(key, t = Date.now()) { return this._prune(key, t).length < this.limit; }
  hit(key, t = Date.now()) { const arr = this._prune(key, t); arr.push(t); this.hits.set(key, arr); return arr.length <= this.limit; }
  reset(key) { this.hits.delete(key); }
  retryAfter(key, t = Date.now()) { const arr = this._prune(key, t); return arr.length ? Math.ceil((this.windowMs - (t - arr[0])) / 1000) : 0; }
  sweep() { const t = Date.now(); for (const k of [...this.hits.keys()]) this._prune(k, t); }
}

/* ---------- headers ---------- */
function publicHeaders(cfg) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join("; ");
  return function (req, res, next) {
    res.setHeader("Content-Security-Policy", csp);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    if (cfg.cookieSecure) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  };
}

function adminHeaders(req, res, next) {
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:", "font-src 'self'",
    "connect-src 'self'", "frame-ancestors 'none'", "form-action 'self'", "base-uri 'none'", "object-src 'none'"
  ].join("; "));
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
}

module.exports = {
  hashPassword, verifyPassword, DUMMY_HASH, passwordProblem,
  token, sha256, safeEqual,
  totpSecret, hotp, verifyTotp, totpUri, base32Encode, base32Decode,
  RateLimiter, publicHeaders, adminHeaders
};
