"use strict";
/* New-inquiry alerts: live updates in the dashboard, email to the team, an optional chat webhook,
   and an optional confirmation email to the visitor in their language. */
const nodemailer = require("nodemailer");
const C = require("./constants");

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- live updates (Server-Sent Events) ---------- */
class Hub {
  constructor() { this.clients = new Set(); this.timer = null; }
  add(res, userId) {
    const c = { res, userId };
    this.clients.add(c);
    if (!this.timer) this.timer = setInterval(() => this.ping(), 25000);
    return () => { this.clients.delete(c); if (!this.clients.size) { clearInterval(this.timer); this.timer = null; } };
  }
  send(event, data, filter) {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const c of this.clients) if (!filter || filter(c)) { try { c.res.write(msg); } catch (e) { /* closed */ } }
  }
  ping() { for (const c of this.clients) { try { c.res.write(": ping\n\n"); } catch (e) { /* closed */ } } }
  dropUser(userId) { for (const c of [...this.clients]) if (c.userId === userId) { try { c.res.end(); } catch (e) { /* closed */ } this.clients.delete(c); } }
  close() { for (const c of this.clients) { try { c.res.end(); } catch (e) { /* closed */ } } this.clients.clear(); clearInterval(this.timer); this.timer = null; }
}

function createNotifier(cfg, store, log = console) {
  const hub = new Hub();
  let transport = null;
  const outbox = [];   // with SMTP_URL=log, emails are printed instead of sent (for trying things out locally)
  if (cfg.mailEnabled && cfg.smtpUrl === "log") {
    const json = nodemailer.createTransport({ jsonTransport: true });
    transport = { sendMail: async (m) => { const r = await json.sendMail(m); outbox.push(m); log.log(`[email] to ${m.to} · ${m.subject}`); return r; } };
  } else if (cfg.mailEnabled) {
    transport = cfg.smtpUrl
      ? nodemailer.createTransport(cfg.smtpUrl)
      : nodemailer.createTransport({
        host: cfg.smtpHost, port: cfg.smtpPort, secure: cfg.smtpSecure,
        auth: cfg.smtpUser ? { user: cfg.smtpUser, pass: cfg.smtpPass } : undefined
      });
  }
  const from = cfg.mailFrom || (cfg.smtpUser && cfg.smtpUser.includes("@") ? `JIEWEITECH <${cfg.smtpUser}>` : "JIEWEITECH <no-reply@localhost>");
  const adminUrl = (id) => `${cfg.siteUrl}/admin/#/inquiry/${id}`;
  const co = cfg.company;

  async function sendMail(opts) {
    if (!transport) return { skipped: "Email isn't set up (SMTP settings are empty)." };
    return transport.sendMail(Object.assign({ from }, opts));
  }

  function rows(inq) {
    const svc = C.SERVICES[inq.service], plan = C.PLANS[inq.plan];
    return [
      ["Reference", inq.ref], ["Name", inq.name], ["Company", inq.company], ["Email", inq.email], ["Phone", inq.phone],
      ["Service", svc ? svc.en : inq.service], ["Plan", plan ? plan.en : inq.plan], ["Language", C.LANGS[inq.lang] || inq.lang],
      ["Page", inq.sourcePage]
    ].filter((r) => r[1]);
  }

  function teamEmail(inq) {
    const subject = `New inquiry ${inq.ref}: ${inq.name}${inq.company ? " (" + inq.company + ")" : ""}`;
    const text = [subject, "", ...rows(inq).map(([k, v]) => `${k}: ${v}`), "", inq.message, "", "Open in the dashboard: " + adminUrl(inq.id)].join("\n");
    const html = `<!doctype html><html><body style="margin:0;background:#f3f5f9;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0b0d12">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e3e7ee">
<tr><td style="background:#050505;color:#fff;padding:18px 24px;font-weight:800;letter-spacing:.04em">JIEWEITECH <span style="color:#7aa7ff;font-weight:600;letter-spacing:0">· New inquiry</span></td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 4px;font-size:20px">${esc(inq.name)}${inq.company ? ` <span style="color:#5b6472;font-weight:500">· ${esc(inq.company)}</span>` : ""}</h1>
<p style="margin:0 0 18px;color:#5b6472;font-size:14px">${esc(inq.ref)} · ${esc(new Date(inq.createdAt).toUTCString())}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;border-collapse:collapse">
${rows(inq).filter((r) => !["Reference", "Name", "Company"].includes(r[0])).map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#5b6472;width:110px;vertical-align:top">${esc(k)}</td><td style="padding:6px 0">${k === "Email" ? `<a href="mailto:${esc(v)}" style="color:#0b5fff">${esc(v)}</a>` : esc(v)}</td></tr>`).join("")}
</table>
<div style="margin:18px 0 0;padding:16px;background:#f6f8fb;border-radius:10px;font-size:15px;line-height:1.55;white-space:pre-wrap">${esc(inq.message)}</div>
<p style="margin:22px 0 0"><a href="${esc(adminUrl(inq.id))}" style="display:inline-block;background:#0b5fff;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">Open in the dashboard</a></p>
</td></tr></table></td></tr></table></body></html>`;
    return { subject, text, html };
  }

  const AUTO = {
    en: {
      subject: (r) => `We received your message (${r})`,
      hi: (n) => `Hi ${n},`,
      body: "Thanks for contacting JIEWEITECH. We've received your message, and we usually reply within one business day.",
      ref: "Your reference number",
      copy: "Here's a copy of what you sent:",
      sign: "The JIEWEITECH team",
      note: "You're receiving this email because this address was entered on the contact form at"
    },
    es: {
      subject: (r) => `Recibimos tu mensaje (${r})`,
      hi: (n) => `Hola, ${n}:`,
      body: "Gracias por escribir a JIEWEITECH. Recibimos tu mensaje y normalmente respondemos en un día hábil.",
      ref: "Tu número de referencia",
      copy: "Esta es una copia de lo que nos enviaste:",
      sign: "El equipo de JIEWEITECH",
      note: "Recibes este correo porque esta dirección se escribió en el formulario de contacto de"
    },
    zh: {
      subject: (r) => `我们已收到您的信息（${r}）`,
      hi: (n) => `${n}，您好：`,
      body: "感谢您联系 JIEWEITECH。我们已收到您的信息，通常会在一个工作日内回复。",
      ref: "您的参考编号",
      copy: "以下是您发送内容的副本：",
      sign: "JIEWEITECH 团队",
      note: "您收到这封邮件，是因为有人在以下网站的联系表单中填写了这个邮箱地址："
    }
  };
  function customerEmail(inq) {
    const L = AUTO[inq.lang] || AUTO.en;
    const first = String(inq.name).trim().split(/\s+/)[0];
    const sig = [L.sign, co.legalName, co.street, `${co.city}, ${co.region} ${co.postalCode}`, co.phone];
    const text = [L.hi(first), "", L.body, "", `${L.ref}: ${inq.ref}`, "", L.copy, "", inq.message, "", ...sig, "", `${L.note} ${cfg.siteUrl}`].join("\n");
    const html = `<!doctype html><html lang="${inq.lang === "zh" ? "zh-Hans" : inq.lang === "es" ? "es" : "en"}"><body style="margin:0;background:#f3f5f9;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0b0d12">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e3e7ee">
<tr><td style="background:#050505;color:#fff;padding:18px 24px;font-weight:800;letter-spacing:.04em">JIEWEITECH</td></tr>
<tr><td style="padding:26px 24px;font-size:15px;line-height:1.6">
<p style="margin:0 0 12px">${esc(L.hi(first))}</p>
<p style="margin:0 0 18px">${esc(L.body)}</p>
<p style="margin:0 0 18px;padding:12px 16px;background:#eef3ff;border-radius:10px">${esc(L.ref)}: <b>${esc(inq.ref)}</b></p>
<p style="margin:0 0 8px;color:#5b6472;font-size:14px">${esc(L.copy)}</p>
<div style="padding:14px 16px;border-left:3px solid #d5dbe5;color:#3a4250;white-space:pre-wrap;font-size:14px">${esc(inq.message)}</div>
<p style="margin:22px 0 0">${sig.map(esc).join("<br>")}</p>
</td></tr>
<tr><td style="padding:14px 24px 20px;color:#8a93a1;font-size:12px">${esc(L.note)} <a href="${esc(cfg.siteUrl)}" style="color:#8a93a1">${esc(cfg.siteUrl.replace(/^https?:\/\//, ""))}</a>.</td></tr>
</table></td></tr></table></body></html>`;
    return { subject: L.subject(inq.ref), text, html };
  }

  async function postWebhook(url, inq, test) {
    const svc = C.SERVICES[inq.service];
    const line = test
      ? "Test alert from the JIEWEITECH dashboard. If you can see this, alerts are working."
      : `New inquiry ${inq.ref} from ${inq.name}${inq.company ? " (" + inq.company + ")" : ""}${svc ? " · " + svc.en : ""}\n${String(inq.message).slice(0, 280)}\n${adminUrl(inq.id)}`;
    const body = { text: line, content: line, inquiry: test ? undefined : { ref: inq.ref, name: inq.name, company: inq.company, email: inq.email, service: inq.service, url: adminUrl(inq.id) } };
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
      if (!r.ok) throw new Error("The webhook answered " + r.status);
    } finally { clearTimeout(t); }
  }

  function teamRecipients(settings) {
    const set = new Set([...(settings.notify_emails || []), ...store.users.alertRecipients()].map((e) => String(e).toLowerCase()));
    return [...set];
  }

  /** Called after an inquiry is saved. Never throws: a failed alert is logged in the inquiry's history instead. */
  async function inquiryReceived(inq) {
    hub.send("inquiry", { type: "created", id: inq.id, ref: inq.ref, name: inq.name, company: inq.company, service: inq.service, spam: inq.spam });
    const settings = store.getSettings();
    if (inq.spam && !settings.notify_on_spam) return;
    const jobs = [];
    const to = teamRecipients(settings);
    if (to.length && transport) {
      const m = teamEmail(inq);
      jobs.push(sendMail({ to: to.join(", "), replyTo: `${inq.name.replace(/[<>",]/g, "")} <${inq.email}>`, subject: m.subject, text: m.text, html: m.html })
        .then(() => store.addEvent(inq.id, null, "notified", { channel: "email", to: to.length }))
        .catch((e) => { log.error("[notify] team email failed:", e.message); store.addEvent(inq.id, null, "notify_failed", { channel: "email", error: e.message.slice(0, 200) }); }));
    }
    if (settings.webhook_url) {
      jobs.push(postWebhook(settings.webhook_url, inq)
        .then(() => store.addEvent(inq.id, null, "notified", { channel: "webhook" }))
        .catch((e) => { log.error("[notify] webhook failed:", e.message); store.addEvent(inq.id, null, "notify_failed", { channel: "webhook", error: String(e.message).slice(0, 200) }); }));
    }
    if (settings.autoreply && !inq.spam && transport) {
      const m = customerEmail(inq);
      jobs.push(sendMail({ to: inq.email, replyTo: cfg.mailReplyTo || undefined, subject: m.subject, text: m.text, html: m.html })
        .then(() => store.addEvent(inq.id, null, "autoreply", null))
        .catch((e) => { log.error("[notify] confirmation email failed:", e.message); store.addEvent(inq.id, null, "notify_failed", { channel: "confirmation", error: e.message.slice(0, 200) }); }));
    }
    await Promise.allSettled(jobs);
  }

  async function test(user) {
    const settings = store.getSettings();
    const out = { email: null, webhook: null };
    if (!transport) out.email = { ok: false, message: "Email isn't set up yet. Add the SMTP settings on the server (see the README)." };
    else {
      const to = teamRecipients(settings);
      try {
        await sendMail({ to: to.join(", ") || user.email, subject: "JIEWEITECH dashboard: test alert", text: "This is a test alert from the JIEWEITECH dashboard. If you can read this, email alerts are working." });
        out.email = { ok: true, message: "Sent to " + (to.join(", ") || user.email) + "." };
      } catch (e) { out.email = { ok: false, message: e.message }; }
    }
    if (!settings.webhook_url) out.webhook = { ok: false, message: "No webhook address saved." };
    else {
      try { await postWebhook(settings.webhook_url, null, true); out.webhook = { ok: true, message: "The webhook accepted the test message." }; }
      catch (e) { out.webhook = { ok: false, message: e.message }; }
    }
    return out;
  }

  /** A reply written in the dashboard, sent to the customer. Replies from the customer go to the team member who wrote it. */
  function replyEmail(inq, user, subject, body, quote) {
    const es = inq.lang === "es", zh = inq.lang === "zh";
    const wrote = zh ? `${inq.name} 于 ${new Date(inq.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}写道：`
      : es ? `El ${new Date(inq.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}, ${inq.name} escribió:`
      : `On ${new Date(inq.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}, ${inq.name} wrote:`;
    const quoted = quote ? "\n\n" + wrote + "\n" + String(inq.message).split("\n").map((l) => "> " + l).join("\n") : "";
    const html = `<!doctype html><html lang="${zh ? "zh-Hans" : es ? "es" : "en"}"><body style="margin:0;background:#ffffff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0b0d12">
<div style="max-width:620px;padding:24px 20px;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(body)}</div>
${quote ? `<div style="max-width:620px;padding:0 20px 24px;color:#5b6472;font-size:14px;line-height:1.55"><p style="margin:0 0 6px">${esc(wrote)}</p><div style="border-left:3px solid #d5dbe5;padding:2px 0 2px 12px;white-space:pre-wrap">${esc(inq.message)}</div></div>` : ""}
</body></html>`;
    return { subject, text: body + quoted, html };
  }
  async function sendReply(inq, user, { subject, body, quote, copyMe }) {
    if (!transport) throw new Error("Email isn't set up on the server, so replies can't be sent from the dashboard yet.");
    const m = replyEmail(inq, user, subject, body, quote);
    const name = String(user.name).replace(/[<>",]/g, "");
    const fromAddr = (/<([^>]+)>/.exec(from) || [null, from])[1];
    return transport.sendMail({
      from: `${name} · JIEWEITECH <${fromAddr}>`,
      to: `${inq.name.replace(/[<>",]/g, "")} <${inq.email}>`,
      replyTo: `${name} <${user.email}>`,
      bcc: copyMe ? user.email : undefined,
      subject: m.subject, text: m.text, html: m.html,
      headers: { "X-JIEWEITECH-Inquiry": inq.ref }
    });
  }

  return { hub, outbox, inquiryReceived, test, sendReply, replyEmail, get mailEnabled() { return !!transport; }, teamEmail, customerEmail };
}

module.exports = { createNotifier, esc };
