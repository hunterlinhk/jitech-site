"use strict";
/* All settings come from environment variables (see .env.example). A .env file in the project root is read if present. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadDotEnv(path.join(ROOT, ".env"));

const env = process.env;
const bool = (v, d) => (v === undefined || v === "" ? d : /^(1|true|yes|on)$/i.test(v));
const list = (v) => (v || "").split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

function build(overrides = {}) {
  const production = (overrides.NODE_ENV || env.NODE_ENV) === "production";
  const get = (k, d) => (overrides[k] !== undefined ? overrides[k] : env[k] !== undefined && env[k] !== "" ? env[k] : d);
  const siteUrl = String(get("SITE_URL", "https://www.jieweitech.com")).replace(/\/+$/, "");
  const cfg = {
    root: ROOT,
    publicDir: path.join(ROOT, "public"),
    adminDir: path.join(ROOT, "admin"),
    production,
    port: Number(get("PORT", 3000)),
    host: get("HOST", "0.0.0.0"),
    siteUrl,
    dataDir: path.resolve(ROOT, get("DATA_DIR", "data")),
    dbFile: get("DB_FILE", ""),
    trustProxy: get("TRUST_PROXY", production ? "1" : "0"),
    cookieSecure: bool(get("COOKIE_SECURE"), production),
    sessionHours: Number(get("SESSION_HOURS", 12)),
    sessionMaxDays: Number(get("SESSION_MAX_DAYS", 7)),
    // email
    smtpUrl: get("SMTP_URL", ""),
    smtpHost: get("SMTP_HOST", ""),
    smtpPort: Number(get("SMTP_PORT", 587)),
    smtpSecure: bool(get("SMTP_SECURE"), false),
    smtpUser: get("SMTP_USER", ""),
    smtpPass: get("SMTP_PASS", ""),
    mailFrom: get("MAIL_FROM", ""),
    mailReplyTo: get("MAIL_REPLY_TO", ""),
    // first admin, created on boot when there are no users yet
    bootstrapEmail: get("ADMIN_EMAIL", ""),
    bootstrapPassword: get("ADMIN_PASSWORD", ""),
    bootstrapName: get("ADMIN_NAME", "Admin"),
    // defaults for settings that can later be changed in the dashboard
    defaultNotifyEmails: list(get("NOTIFY_EMAILS", "")),
    defaultWebhookUrl: get("WEBHOOK_URL", ""),
    // inquiry form
    allowedOrigins: list(get("ALLOWED_ORIGINS", "")),
    minFillSeconds: Number(get("FORM_MIN_SECONDS", 3)),
    company: {
      legalName: "Jieweitech, Inc.",
      brand: "JIEWEITECH",
      street: "3678 Admiralty Way, Suite 503",
      city: "Marina del Rey",
      region: "CA",
      postalCode: "90292",
      country: "US",
      countryName: "United States",
      phone: "+1 (510) 628-5269",
      phoneE164: "+15106285269"
    }
  };
  cfg.dbPath = cfg.dbFile ? path.resolve(ROOT, cfg.dbFile) : path.join(cfg.dataDir, "jieweitech.db");
  cfg.mailEnabled = !!(cfg.smtpUrl || cfg.smtpHost);
  return cfg;
}

module.exports = { build, ROOT };
