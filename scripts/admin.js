"use strict";
/* Manage dashboard accounts from the command line.
     npm run admin:create -- you@company.com "Your Name"     (asks for a password; first account is always an admin)
     npm run admin:reset-password -- you@company.com
     npm run admin:disable-2fa -- you@company.com
     npm run admin:list
   Add --member to create a team member instead of an admin. */
const readline = require("readline");
const config = require("../server/config");
const { open } = require("../server/db");
const { createStore } = require("../server/store");
const S = require("../server/security");

const cfg = config.build();
const db = open(cfg.dbPath);
const store = createStore(db, cfg);
const [cmd, ...rest] = process.argv.slice(2);
const flags = rest.filter((a) => a.startsWith("--"));
const args = rest.filter((a) => !a.startsWith("--"));

function ask(q, hidden) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => rl.output.write(s.includes(q) ? s : "");
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(a); });
  });
}
async function newPassword(email) {
  if (process.env.NEW_PASSWORD) return process.env.NEW_PASSWORD;
  for (;;) {
    const a = await ask("New password (at least 10 characters): ", true);
    const problem = S.passwordProblem(a, email);
    if (problem) { console.log("  " + problem); continue; }
    const b = await ask("Type it again: ", true);
    if (a !== b) { console.log("  Those didn't match. Try again."); continue; }
    return a;
  }
}
const die = (m) => { console.error(m); process.exit(1); };

(async () => {
  if (cmd === "create") {
    const [email, ...nameParts] = args;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) die('Usage: npm run admin:create -- you@company.com "Your Name"');
    if (store.users.byEmail(email)) die("That email already has an account. Use admin:reset-password instead.");
    const pw = await newPassword(email);
    const problem = S.passwordProblem(pw, email); if (problem) die(problem);
    const role = store.users.count() === 0 || !flags.includes("--member") ? "admin" : "member";
    const u = store.users.create({ email, name: nameParts.join(" ") || email.split("@")[0], role, passwordHash: S.hashPassword(pw), mustChange: false });
    store.audit.add(null, u.email, "user_created", "command line (" + role + ")", null);
    console.log(`Created ${role} account for ${u.email}. Sign in at ${cfg.siteUrl}/admin/`);
  } else if (cmd === "reset-password") {
    const u = store.users.byEmail(args[0] || ""); if (!u) die("No account with that email.");
    const pw = await newPassword(u.email);
    const problem = S.passwordProblem(pw, u.email); if (problem) die(problem);
    store.users.update(u.id, { passwordHash: S.hashPassword(pw), mustChange: false, failedLogins: 0, lockedUntil: null, disabled: false });
    store.sessions.removeForUser(u.id);
    store.audit.add(u.id, u.email, "password_reset", "command line", null);
    console.log("Password changed, account unlocked, and every session signed out.");
  } else if (cmd === "disable-2fa") {
    const u = store.users.byEmail(args[0] || ""); if (!u) die("No account with that email.");
    store.users.update(u.id, { totpEnabled: false, totpSecret: null, totpLastStep: null });
    store.audit.add(u.id, u.email, "2fa_reset", "command line", null);
    console.log("Two-factor sign-in is off for " + u.email + ". They can turn it back on from their account page.");
  } else if (cmd === "list") {
    const list = store.users.list();
    if (!list.length) console.log("No accounts yet. Create one with: npm run admin:create -- you@company.com \"Your Name\"");
    for (const u of list) console.log(`${u.disabled ? "(off) " : ""}${u.email}  ${u.name}  ${u.role}${u.totpEnabled ? "  2FA" : ""}`);
  } else {
    die("Commands: create, reset-password, disable-2fa, list");
  }
  db.close();
})();
