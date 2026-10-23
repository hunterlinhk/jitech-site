"use strict";
/* Makes a consistent copy of the database while the site keeps running:  npm run backup  ->  backups/jieweitech-<time>.db
   Keeps the newest 30 copies. Point BACKUP_DIR somewhere else (another disk, a synced folder) if you like. */
const fs = require("fs");
const path = require("path");
const config = require("../server/config");
const { open } = require("../server/db");

const cfg = config.build();
const dir = path.resolve(cfg.root, process.env.BACKUP_DIR || "backups");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, "jieweitech-" + new Date().toISOString().replace(/[:.]/g, "-") + ".db");
const db = open(cfg.dbPath);
db.backup(file).then(() => {
  db.close();
  const old = fs.readdirSync(dir).filter((f) => /^jieweitech-.*\.db$/.test(f)).sort().reverse().slice(30);
  old.forEach((f) => fs.unlinkSync(path.join(dir, f)));
  console.log("Backup saved: " + file);
}).catch((e) => { console.error("Backup failed:", e.message); process.exit(1); });
