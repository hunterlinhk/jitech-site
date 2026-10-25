"use strict";
/* The public side: POST /api/inquiries (from the contact form, with or without JavaScript). */
const express = require("express");
const C = require("../constants");
const { RateLimiter } = require("../security");

const clean = (v, max) => String(v == null ? "" : v)
  .replace(/\r\n?/g, "\n")
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u2028\u2029\uFEFF]/g, "")
  .trim()
  .slice(0, max + 1);
const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
const PHONE = /^[0-9+().\-\s/extEXT#]{5,40}$/;

/** Returns { data, errors }. Error values are codes the form turns into words in either language. */
function validate(body) {
  const errors = {};
  const line = (v, max) => clean(v, max).replace(/\s+/g, " ");   // one-line fields never carry line breaks (they end up in email headers)
  const d = {
    name: line(body.name, 120),
    company: line(body.company, 160),
    email: line(body.email, 254).toLowerCase(),
    phone: line(body.phone, 40),
    service: clean(body.service, 40) || "not-sure",
    plan: clean(body.plan, 40),
    message: clean(body.message, 5000),
    lang: ["es", "zh"].includes(body.lang) ? body.lang : "en",
    sourcePage: clean(body.page, 200),
    referrer: clean(body.referrer, 500),
    utmSource: clean(body.utm_source, 100),
    utmMedium: clean(body.utm_medium, 100),
    utmCampaign: clean(body.utm_campaign, 100)
  };
  if (!d.name) errors.name = "required";
  else if (d.name.length > 120) errors.name = "too_long";
  if (d.company.length > 160) errors.company = "too_long";
  if (!d.email) errors.email = "required";
  else if (d.email.length > 254 || !EMAIL.test(d.email)) errors.email = "invalid";
  if (d.phone && !PHONE.test(d.phone)) errors.phone = "invalid";
  if (!C.SERVICES[d.service]) errors.service = "invalid";
  if (d.plan && !C.PLANS[d.plan]) errors.plan = "invalid";
  if (!d.message) errors.message = "required";
  else if (d.message.length < 10) errors.message = "too_short";
  else if (d.message.length > 5000) errors.message = "too_long";
  if (d.sourcePage && !d.sourcePage.startsWith("/")) d.sourcePage = "";
  return { data: d, errors };
}

function spamCheck(body, d, cfg) {
  const started = Number(body.t);
  if (started && Date.now() - started < cfg.minFillSeconds * 1000) return "Sent too quickly after the page opened";
  const links = (d.message.match(/https?:\/\/|www\./gi) || []).length;
  if (links > 3) return "Contains many links";
  if (/\[url=|<a\s+href=/i.test(d.message)) return "Contains link markup";
  if (d.name && /https?:\/\/|www\./i.test(d.name)) return "Link in the name field";
  return null;
}

function inquiryRoutes({ cfg, store, notifier, log = console }) {
  const r = express.Router();
  const perIp = new RateLimiter(6, 10 * 60 * 1000);
  const perIpDay = new RateLimiter(30, 24 * 60 * 60 * 1000);
  setInterval(() => { perIp.sweep(); perIpDay.sweep(); }, 10 * 60 * 1000).unref();

  const sameSite = (req) => {
    const origin = req.get("origin");
    if (!origin) return true;
    try {
      const o = new URL(origin);
      if (o.host === req.get("host")) return true;
      return cfg.allowedOrigins.includes(o.origin);
    } catch (e) { return false; }
  };

  // Lets a copy of the site on another domain (listed in ALLOWED_ORIGINS) send the form here.
  r.use("/inquiries", (req, res, next) => {
    const origin = req.get("origin");
    if (origin && cfg.allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Max-Age", "600");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  r.post("/inquiries", express.json({ limit: "24kb" }), express.urlencoded({ extended: false, limit: "24kb" }), async (req, res) => {
    const body = req.body || {};
    const wantsJson = req.is("application/json") || (req.get("accept") || "").includes("application/json");
    const lang = ["es", "zh"].includes(body.lang) ? body.lang : "en";
    const back = (q) => (lang === "en" ? "/contact.html" : "/" + lang + "/contact.html") + "?" + q + "#form";
    const fail = (status, payload) => (wantsJson ? res.status(status).json(Object.assign({ ok: false }, payload)) : res.redirect(303, back("error=" + (payload.error || "invalid"))));

    if (!sameSite(req)) return fail(403, { error: "forbidden" });

    const ip = req.ip;
    if (!perIp.check(ip) || !perIpDay.check(ip)) {
      res.setHeader("Retry-After", String(Math.max(perIp.retryAfter(ip), 60)));
      return fail(429, { error: "rate_limited" });
    }

    // honeypot: a field people never see. Bots that fill it get a normal-looking answer and nothing is saved.
    if (body.website || body.url) {
      perIp.hit(ip);
      return wantsJson ? res.status(201).json({ ok: true, ref: "JW-0000" }) : res.redirect(303, back("sent=1"));
    }

    const { data, errors } = validate(body);
    if (Object.keys(errors).length) return fail(400, { error: "invalid", errors });

    if (store.recentFromEmail(data.email, 60) >= 5) return fail(429, { error: "rate_limited" });

    perIp.hit(ip); perIpDay.hit(ip);
    const reason = spamCheck(body, data, cfg);
    let inq;
    try {
      inq = store.createInquiry(Object.assign(data, {
        ip, userAgent: String(req.get("user-agent") || "").slice(0, 300), spam: !!reason, spamReason: reason
      }));
    } catch (e) {
      log.error("[inquiry] could not save:", e);
      return fail(500, { error: "server" });
    }
    notifier.inquiryReceived(inq).catch((e) => log.error("[inquiry] alert failed:", e));
    if (wantsJson) return res.status(201).json({ ok: true, ref: inq.ref });
    return res.redirect(303, back("sent=" + encodeURIComponent(inq.ref)));
  });

  r.get("/health", (req, res) => {
    try { store.db.prepare("SELECT 1").get(); res.json({ ok: true }); }
    catch (e) { res.status(503).json({ ok: false }); }
  });

  return r;
}

module.exports = { inquiryRoutes, validate, spamCheck };
