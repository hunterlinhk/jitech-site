"use strict";
/* End-to-end checks of the inquiry API and the dashboard API.  Run: npm test */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const config = require("../server/config");
const { createApp } = require("../server/app");
const S = require("../server/security");

const quiet = { log() {}, warn() {}, error() {} };

async function start(extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jw-test-"));
  const cfg = config.build(Object.assign({ DATA_DIR: dir, NODE_ENV: "test", SITE_URL: "https://example.test", FORM_MIN_SECONDS: "0" }, extra));
  cfg.minFillSeconds = Number(extra.FORM_MIN_SECONDS || 0);
  cfg.dbPath = path.join(dir, "test.db");
  cfg.bootstrapEmail = "owner@example.com"; cfg.bootstrapPassword = "Correct-Horse-42";
  const { app, close, store, notifier } = createApp(cfg, { log: quiet });
  const server = await new Promise((res) => { const s = app.listen(0, "127.0.0.1", () => res(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, store, notifier, stop: () => { server.closeAllConnections(); server.close(); close(); fs.rmSync(dir, { recursive: true, force: true }); } };
}

/* a tiny cookie-keeping client */
function client(base) {
  let cookie = "", csrf = "";
  const call = async (method, p, body, headers = {}) => {
    const h = Object.assign({ Accept: "application/json" }, headers);
    if (cookie) h.Cookie = cookie;
    if (body !== undefined) h["Content-Type"] = "application/json";
    if (method !== "GET" && csrf) h["X-CSRF-Token"] = csrf;
    const r = await fetch(base + p, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined, redirect: "manual" });
    const set = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    for (const c of set) { const v = c.split(";")[0]; cookie = v.endsWith("=") ? "" : v; }
    let data = null; const text = await r.text();
    try { data = JSON.parse(text); } catch (e) { data = text; }
    return { status: r.status, data, headers: r.headers };
  };
  return {
    call, get: (p) => call("GET", p), post: (p, b) => call("POST", p, b || {}), patch: (p, b) => call("PATCH", p, b), put: (p, b) => call("PUT", p, b), del: (p) => call("DELETE", p),
    setCsrf: (t) => { csrf = t; }, get cookie() { return cookie; }
  };
}
async function signIn(c, email = "owner@example.com", password = "Correct-Horse-42", next = "Blue-Lantern-Harbor-9") {
  const r = await c.post("/admin/api/login", { email, password });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  c.setCsrf(r.data.csrf);
  const me = await c.get("/admin/api/me");
  if (me.data.user.mustChangePassword) {
    const ch = await c.post("/admin/api/me/password", { current: password, next });
    assert.equal(ch.status, 200, JSON.stringify(ch.data));
  }
  return c;
}
const inquiry = (o = {}) => Object.assign({ name: "Ana Ruiz", email: "ana@example.com", company: "Textiles del Norte", message: "We need a website for our factory.", service: "website-development", lang: "es" }, o);

test("visitor inquiries: validation, saving, honeypot and the no-JavaScript fallback", async () => {
  const t = await start();
  try {
    const c = client(t.base);
    let r = await c.post("/api/inquiries", { name: "", email: "nope", message: "hi" });
    assert.equal(r.status, 400);
    assert.deepEqual(r.data.errors, { name: "required", email: "invalid", message: "too_short" });

    r = await c.post("/api/inquiries", inquiry({ phone: "abc!!" }));
    assert.equal(r.data.errors.phone, "invalid");

    r = await c.post("/api/inquiries", inquiry({ service: "hacking" }));
    assert.equal(r.data.errors.service, "invalid");

    r = await c.post("/api/inquiries", inquiry());
    assert.equal(r.status, 201);
    assert.match(r.data.ref, /^JW-\d+$/);
    const saved = t.store.getInquiry(t.store.idFromRef(r.data.ref));
    assert.equal(saved.lang, "es");
    assert.equal(saved.status, "new");
    assert.equal(saved.spam, false);

    // the hidden honeypot field: looks like success, saves nothing
    const before = t.store.listInquiries({ view: "all" }, 0).total;
    r = await c.post("/api/inquiries", inquiry({ website: "http://spam.example" }));
    assert.equal(r.status, 201);
    assert.equal(t.store.listInquiries({ view: "all" }, 0).total, before);

    // too many links: kept, but filed as spam
    r = await c.post("/api/inquiries", inquiry({ email: "x@example.com", message: "buy http://a.com http://b.com http://c.com http://d.com now" }));
    assert.equal(r.status, 201);
    assert.equal(t.store.getInquiry(t.store.idFromRef(r.data.ref)).spam, true);

    // plain form post (no JavaScript) redirects back to the right language
    const form = await fetch(t.base + "/api/inquiries", { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ name: "Sin JS", email: "nojs@example.com", message: "Mensaje sin JavaScript.", lang: "es" }) });
    assert.equal(form.status, 303);
    assert.match(form.headers.get("location"), /^\/es\/contact\.html\?sent=JW-\d+#form$/);
    const formZh = await fetch(t.base + "/api/inquiries", { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ name: "王小明", email: "wang@example.com", message: "我们想做一个公司网站。", lang: "zh" }) });
    assert.equal(formZh.status, 303);
    assert.match(formZh.headers.get("location"), /^\/zh\/contact\.html\?sent=JW-\d+#form$/);
    const zhRow = t.store.getInquiry(t.store.idFromRef(/sent=(JW-\d+)/.exec(formZh.headers.get("location"))[1]));
    assert.equal(zhRow.lang, "zh");
    // the visitor's confirmation email is in Chinese too
    const mail = t.notifier.customerEmail(zhRow);
    assert.match(mail.subject, /我们已收到您的信息/);
    assert.match(mail.text, /^王小明，您好：/);
    assert.match(mail.html, /<html lang="zh-Hans"/);
    // an unknown language falls back to English
    r = await c.post("/api/inquiries", inquiry({ email: "fr@example.com", lang: "fr" }));
    assert.equal(t.store.getInquiry(t.store.idFromRef(r.data.ref)).lang, "en");

    // posts from another website are refused
    r = await c.call("POST", "/api/inquiries", inquiry(), { Origin: "https://evil.example" });
    assert.equal(r.status, 403);
  } finally { t.stop(); }
});

test("visitor inquiries are rate limited per address", async () => {
  const t = await start();
  try {
    const c = client(t.base);
    const codes = [];
    for (let i = 0; i < 8; i++) codes.push((await c.post("/api/inquiries", inquiry({ email: `p${i}@example.com` }))).status);
    assert.deepEqual(codes.slice(0, 6), [201, 201, 201, 201, 201, 201]);
    assert.equal(codes[7], 429);
  } finally { t.stop(); }
});

test("messages sent faster than a person could type are filed as spam", async () => {
  const t = await start({ FORM_MIN_SECONDS: "3" });
  try {
    const r = await client(t.base).post("/api/inquiries", inquiry({ t: String(Date.now()) }));
    assert.equal(r.status, 201);
    assert.equal(t.store.getInquiry(t.store.idFromRef(r.data.ref)).spamReason, "Sent too quickly after the page opened");
  } finally { t.stop(); }
});

test("dashboard sign-in: temporary password, CSRF, lockout and signing out", async () => {
  const t = await start();
  try {
    const anon = client(t.base);
    assert.equal((await anon.get("/admin/api/inquiries")).status, 401);
    assert.equal((await anon.post("/admin/api/login", { email: "owner@example.com", password: "wrong-password" })).status, 401);
    assert.equal((await anon.post("/admin/api/login", { email: "nobody@example.com", password: "whatever-123" })).status, 401);

    const c = client(t.base);
    const r = await c.post("/admin/api/login", { email: "owner@example.com", password: "Correct-Horse-42" });
    assert.equal(r.status, 200);
    c.setCsrf(r.data.csrf);
    assert.equal((await c.get("/admin/api/inquiries")).status, 403, "temporary password must be changed first");
    assert.equal((await c.post("/admin/api/me/password", { current: "Correct-Horse-42", next: "short" })).status, 400);
    assert.equal((await c.post("/admin/api/me/password", { current: "Correct-Horse-42", next: "Blue-Lantern-Harbor-9" })).status, 200);
    assert.equal((await c.get("/admin/api/inquiries")).status, 200);

    // changes without the CSRF token, or from another site, are refused
    c.setCsrf("");
    assert.equal((await c.put("/admin/api/settings", { autoreply: false })).status, 403);
    c.setCsrf((await c.get("/admin/api/me")).data.csrf);
    assert.equal((await c.call("PUT", "/admin/api/settings", { autoreply: false }, { Origin: "https://evil.example" })).status, 403);
    assert.equal((await c.put("/admin/api/settings", { autoreply: false })).status, 200);

    // five wrong passwords lock the account
    const x = client(t.base);
    for (let i = 0; i < 4; i++) assert.equal((await x.post("/admin/api/login", { email: "owner@example.com", password: "nope-nope-" + i })).status, 401);
    assert.equal((await x.post("/admin/api/login", { email: "owner@example.com", password: "nope-nope-5" })).status, 423);
    assert.equal((await x.post("/admin/api/login", { email: "owner@example.com", password: "Blue-Lantern-Harbor-9" })).status, 423);

    // signing out ends the session
    assert.equal((await c.post("/admin/api/logout")).status, 200);
    assert.equal((await c.get("/admin/api/me")).status, 401);
  } finally { t.stop(); }
});

test("managing inquiries: list, search, update, notes, bulk, export and roles", async () => {
  const t = await start();
  try {
    const v = client(t.base);
    for (const o of [inquiry(), inquiry({ name: "David Chen", email: "dchen@pacific.com", company: "Pacific Fasteners", lang: "en", service: "geo-optimization", message: "=HYPERLINK(\"http://x\") we never show up in ChatGPT" })]) await v.post("/api/inquiries", o);
    const c = await signIn(client(t.base));

    let r = await c.get("/admin/api/inquiries?view=inbox");
    assert.equal(r.data.total, 2);
    r = await c.get("/admin/api/inquiries?view=inbox&q=fasteners");
    assert.equal(r.data.total, 1);
    const id = r.data.items[0].id;
    assert.equal((await c.get("/admin/api/inquiries?q=" + encodeURIComponent(t.store.ref(id)))).data.total, 1, "search by reference number");

    r = await c.get("/admin/api/inquiries/counts?today=2026-01-01");
    assert.equal(r.data.views.unread, 2);
    await c.get("/admin/api/inquiries/" + id); // opening marks it read
    assert.equal((await c.get("/admin/api/inquiries/counts")).data.views.unread, 1);

    r = await c.patch("/admin/api/inquiries/" + id, { status: "quoted", priority: "high", tags: ["GEO", "Priority", "GEO"], followUpAt: "2026-11-03", assigneeId: 1 });
    assert.equal(r.status, 200);
    assert.equal(r.data.inquiry.status, "quoted");
    assert.deepEqual(r.data.inquiry.tags, ["GEO", "Priority"]);
    assert.ok(r.data.inquiry.events.some((e) => e.type === "status" && e.data.to === "quoted"));
    assert.equal((await c.patch("/admin/api/inquiries/" + id, { status: "bogus" })).status, 400);
    assert.equal((await c.patch("/admin/api/inquiries/" + id, { followUpAt: "next week" })).status, 400);

    r = await c.post(`/admin/api/inquiries/${id}/notes`, { body: "Called him, sending a proposal Friday." });
    assert.equal(r.status, 201);
    const noteId = r.data.id;
    assert.equal((await c.get("/admin/api/inquiries?q=proposal")).data.total, 1, "search covers notes");

    r = await c.post("/admin/api/inquiries/bulk", { ids: [id], action: "archive" });
    assert.equal(r.data.updated, 1);
    assert.equal((await c.get("/admin/api/inquiries?view=archived")).data.total, 1);

    // CSV export neutralises spreadsheet formulas
    const csv = await fetch(t.base + "/admin/api/inquiries/export.csv?view=all", { headers: { Cookie: c.cookie } });
    const text = await csv.text();
    assert.match(csv.headers.get("content-type"), /text\/csv/);
    assert.ok(text.includes("'=HYPERLINK"), "formula is escaped");

    // team members can't delete or change settings; admins can
    r = await c.post("/admin/api/users", { name: "Mia", email: "mia@example.com", role: "member" });
    assert.equal(r.status, 201);
    const mia = await signIn(client(t.base), "mia@example.com", r.data.tempPassword, "Mia-Strong-Pass-77");
    assert.equal((await mia.del("/admin/api/inquiries/" + id)).status, 403);
    assert.equal((await mia.get("/admin/api/settings")).status, 403);
    assert.equal((await mia.patch("/admin/api/notes/" + noteId, { body: "edited" })).status, 403, "can't edit someone else's note");
    assert.equal((await mia.get("/admin/api/inquiries?view=all")).status, 200);
    assert.equal((await c.del("/admin/api/inquiries/" + id)).status, 200);

    // the last admin can't be demoted or turned off
    assert.equal((await c.patch("/admin/api/users/1", { role: "member" })).status, 400);
    assert.equal((await c.patch("/admin/api/users/1", { disabled: true })).status, 400);
  } finally { t.stop(); }
});

test("two-factor sign-in", async () => {
  const t = await start();
  try {
    const c = await signIn(client(t.base));
    let r = await c.post("/admin/api/me/2fa/setup", { password: "Blue-Lantern-Harbor-9" });
    assert.equal(r.status, 200);
    const secret = r.data.secret.replace(/\s/g, "");
    assert.match(r.data.qr, /^data:image\/png;base64,/);
    assert.equal((await c.post("/admin/api/me/2fa/enable", { code: "000000" })).status, 400);
    const code = S.hotp(secret, Math.floor(Date.now() / 30000));
    assert.equal((await c.post("/admin/api/me/2fa/enable", { code })).status, 200);

    const x = client(t.base);
    r = await x.post("/admin/api/login", { email: "owner@example.com", password: "Blue-Lantern-Harbor-9" });
    assert.equal(r.data.totp, true);
    assert.equal((await x.post("/admin/api/login/totp", { ticket: r.data.ticket, code: "123456" })).status, 401);
    const next = S.hotp(secret, Math.floor(Date.now() / 30000) + 1); // the same code can't be used twice, so use the next step
    r = await x.post("/admin/api/login/totp", { ticket: r.data.ticket, code: next });
    assert.equal(r.status, 200);
  } finally { t.stop(); }
});

test("the website: pages, Spanish addresses, headers and the dashboard", async () => {
  const t = await start();
  try {
    let r = await fetch(t.base + "/");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-security-policy"), /frame-ancestors 'self'/);
    r = await fetch(t.base + "/index.html", { redirect: "manual" });
    assert.equal(r.status, 301);
    r = await fetch(t.base + "/admin/");
    assert.equal(r.headers.get("x-frame-options"), "DENY");
    assert.match(r.headers.get("x-robots-tag"), /noindex/);
    r = await fetch(t.base + "/does-not-exist");
    assert.equal(r.status, 404);
    if (fs.existsSync(path.join(__dirname, "..", "dist", "es", "index.html"))) {
      r = await fetch(t.base + "/es/contact.html");
      const html = await r.text();
      assert.equal(r.status, 200);
      assert.match(html, /<html lang="es"/);
      assert.match(html, /hreflang="en"/);
      assert.match(html, /hreflang="zh-Hans" href="[^"]*\/zh\/contact\.html"/);
    }
    if (fs.existsSync(path.join(__dirname, "..", "dist", "zh", "index.html"))) {
      r = await fetch(t.base + "/zh/contact.html");
      const html = await r.text();
      assert.equal(r.status, 200);
      assert.match(html, /<html lang="zh-Hans"/);
      assert.match(html, /<title[^>]*>联系我们 \| JIEWEITECH<\/title>/);
      assert.match(html, /name="lang" value="zh"/);
      r = await fetch(t.base + "/zh/does-not-exist");
      assert.equal(r.status, 404);
      assert.match(await r.text(), /这个页面不存在/);
    }
  } finally { t.stop(); }
});

test("the Design Studio page, its preview, and a document sent from it", async () => {
  const t = await start();
  try {
    let r = await fetch(t.base + "/design-studio.html");
    let html = await r.text();
    assert.equal(r.status, 200);
    for (let n = 1; n <= 8; n++) assert.match(html, new RegExp('data-step="' + n + '"'));
    assert.match(html, /assets\/js\/studio\.js/);
    r = await fetch(t.base + "/pages/studio-preview.html");
    assert.equal(r.status, 200);
    assert.match(await r.text(), /StudioPreview/);
    if (fs.existsSync(path.join(__dirname, "..", "dist", "es", "design-studio.html"))) {
      r = await fetch(t.base + "/es/design-studio.html");
      html = await r.text();
      assert.match(html, /<html lang="es"/);
      assert.match(html, /Estudio de diseño/);
    }
    // what studio.js posts when a visitor sends their document
    r = await fetch(t.base + "/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({
      name: "Ana Prueba", email: "ana@example.com", service: "website-development", plan: "standard", lang: "es", page: "/es/design-studio.html",
      message: "Enviado desde el estudio de diseño.\n\nREQUISITOS DE DISEÑO WEB · DS-20261024-ABCD\nPlan recomendado: Estándar ($500)"
    }) });
    const j = await r.json();
    assert.equal(r.status, 201);
    assert.ok(j.ok && j.ref);
    const row = t.store.db.prepare("SELECT service, plan, lang, source_page FROM inquiries ORDER BY id DESC LIMIT 1").get();
    assert.deepEqual(row, { service: "website-development", plan: "standard", lang: "es", source_page: "/es/design-studio.html" });
  } finally { t.stop(); }
});

test("replying to a customer from the dashboard", async () => {
  const t = await start({ SMTP_URL: "log" });
  try {
    await client(t.base).post("/api/inquiries", inquiry());
    const c = await signIn(client(t.base));
    const id = (await c.get("/admin/api/inquiries?view=all")).data.items[0].id;
    assert.equal((await c.post(`/admin/api/inquiries/${id}/reply`, { subject: "", body: "Hi" })).status, 400);
    const r = await c.post(`/admin/api/inquiries/${id}/reply`, { subject: "Re: Tu consulta", body: "Hola, Ana:\n\nGracias.", copyMe: true });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.inquiry.status, "contacted");
    assert.equal(r.data.inquiry.messages.length, 1);
    assert.ok(r.data.inquiry.events.some((e) => e.type === "replied"));
    const sent = t.notifier.outbox.find((m) => m.subject === "Re: Tu consulta");
    assert.ok(sent, "email was sent");
    assert.match(sent.to, /ana@example\.com/);
    assert.match(sent.replyTo, /owner@example\.com/);
    assert.equal(sent.bcc, "owner@example.com");
    assert.match(sent.text, /> We need a website/);
  } finally { t.stop(); }
});

test("replies can't be sent when email isn't set up", async () => {
  const t = await start();
  try {
    await client(t.base).post("/api/inquiries", inquiry());
    const c = await signIn(client(t.base));
    const id = (await c.get("/admin/api/inquiries?view=all")).data.items[0].id;
    assert.equal((await c.post(`/admin/api/inquiries/${id}/reply`, { subject: "Hi", body: "Hello" })).status, 409);
  } finally { t.stop(); }
});
