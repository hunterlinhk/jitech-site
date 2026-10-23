"use strict";
/* Puts the pieces together: the website (from dist/, built from public/), the inquiry API and the dashboard. */
const fs = require("fs");
const path = require("path");
const express = require("express");
const compression = require("compression");
const { open } = require("./db");
const { createStore } = require("./store");
const { createNotifier } = require("./notify");
const { createAuth } = require("./auth");
const { inquiryRoutes } = require("./routes/inquiries");
const { adminRoutes } = require("./routes/admin");
const S = require("./security");

function trustValue(v) {
  if (v === true || v === false) return v;
  if (/^\d+$/.test(String(v))) return Number(v);
  if (/^(true|false)$/i.test(String(v))) return /^true$/i.test(String(v));
  return String(v);
}

function createApp(cfg, { log = console } = {}) {
  const db = open(cfg.dbPath);
  const store = createStore(db, cfg);
  const notifier = createNotifier(cfg, store, log);
  const auth = createAuth({ cfg, store, notifier });

  // The first admin can come from ADMIN_EMAIL / ADMIN_PASSWORD (handy on hosts without a shell).
  if (store.users.count() === 0 && cfg.bootstrapEmail && cfg.bootstrapPassword) {
    const problem = S.passwordProblem(cfg.bootstrapPassword, cfg.bootstrapEmail);
    if (problem) log.warn("[admin] ADMIN_PASSWORD was not used: " + problem);
    else {
      store.users.create({ email: cfg.bootstrapEmail, name: cfg.bootstrapName, role: "admin", passwordHash: S.hashPassword(cfg.bootstrapPassword), mustChange: true });
      log.log(`[admin] Created the first admin account (${cfg.bootstrapEmail}). You'll be asked to choose a new password at first sign-in.`);
    }
  }

  const siteDir = fs.existsSync(path.join(cfg.root, "dist", "index.html")) ? path.join(cfg.root, "dist") : cfg.publicDir;
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", trustValue(cfg.trustProxy));
  app.set("etag", "strong");

  app.use(compression({ filter: (req, res) => !req.path.endsWith("/events") && compression.filter(req, res) }));

  /* ---------- APIs ---------- */
  app.use("/api", S.publicHeaders(cfg), (req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); }, inquiryRoutes({ cfg, store, notifier, log }));
  app.use("/admin/api", S.adminHeaders, adminRoutes({ cfg, store, notifier, auth }));

  /* ---------- dashboard ---------- */
  app.use((req, res, next) => (req.path === "/admin" ? res.redirect(301, "/admin/") : next()));
  app.use("/admin", S.adminHeaders, express.static(cfg.adminDir, { index: "index.html", etag: true, lastModified: false, dotfiles: "ignore" }));

  /* ---------- website ---------- */
  app.use(S.publicHeaders(cfg));
  // one address per page: /index.html -> /, /es -> /es/
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path !== "/index.html" && req.path !== "/es/index.html" && req.path !== "/es") return next();
    const q = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
    res.redirect(301, (req.path.startsWith("/es") ? "/es/" : "/") + q);
  });
  app.use(express.static(siteDir, {
    index: "index.html",
    extensions: ["html"],
    dotfiles: "ignore",
    etag: true,
    setHeaders(res, file) {
      const req = res.req;
      if (file.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
      else if (req && req.query && req.query.v) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      else if (/[\\/](fonts|vendor)[\\/]/.test(file)) res.setHeader("Cache-Control", "public, max-age=2592000");
      else res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    }
  }));

  /* ---------- not found / errors ---------- */
  app.use((req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "not_found" });
    const page = path.join(siteDir, req.path.startsWith("/es/") ? "es" : "", "404.html");
    res.status(404);
    if (fs.existsSync(page)) { res.setHeader("Cache-Control", "no-cache"); return res.sendFile(page); }
    res.type("text").send("Not found");
  });
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) log.error("[error]", req.method, req.originalUrl, err);
    if (res.headersSent) return;
    if (req.path.startsWith("/api/") || req.path.startsWith("/admin/api/")) {
      return res.status(status).json({ error: status === 400 ? "bad_request" : status === 413 ? "too_large" : "server", message: status < 500 ? "The request couldn't be read." : "Something went wrong on our side." });
    }
    res.status(status).type("text").send(status < 500 ? "Bad request" : "Server error");
  });

  return { app, db, store, notifier, close: () => { notifier.hub.close(); db.close(); } };
}

module.exports = { createApp };
