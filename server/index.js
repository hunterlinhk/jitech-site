"use strict";
const config = require("./config");
const { createApp } = require("./app");

const cfg = config.build();
const { app, close, notifier } = createApp(cfg);

const server = app.listen(cfg.port, cfg.host, () => {
  console.log(`JIEWEITECH is running on http://localhost:${cfg.port}  (dashboard: /admin)`);
  console.log(`  database: ${cfg.dbPath}`);
  console.log(`  email alerts: ${notifier.mailEnabled ? "on" : "off (no SMTP settings)"}`);
  if (cfg.production && !process.env.SITE_URL) console.warn("  warning: SITE_URL isn't set, so links in emails and search tags use " + cfg.siteUrl);
});
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

function shutdown(sig) {
  console.log(`\n${sig} received, closing…`);
  close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
