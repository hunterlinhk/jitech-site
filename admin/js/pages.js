/* Team, Settings and Your account. */
import { h, clear, icon, avatar, ago, fullDate, toast, dialog, confirmBox, copyText } from "./dom.js";
import { get, post, patch, put } from "./api.js";
import { state, setTitle, isAdmin, errorToast, loadUsers, savePrefs, chime, signOut } from "./app.js";

const card = (title, ...body) => h("article", { class: "card" }, title ? h("header", null, h("h3", { text: title })) : null, h("div", { class: "pad" }, body));

/* ---------- team ---------- */
export async function renderTeam(shell) {
  setTitle("Team");
  clear(shell.tools, isAdmin() ? h("button", { class: "btn primary", type: "button", onclick: () => addMember(shell) }, icon("plus", "sm"), "Add a team member") : null);
  const users = await loadUsers();
  const rows = users.map((u) => {
    const acts = [];
    if (isAdmin()) {
      acts.push(h("button", { class: "btn sm", type: "button", onclick: () => resetPw(u, shell) }, "Reset password"));
      if (u.totpEnabled && u.id !== state.user.id) acts.push(h("button", { class: "btn sm", type: "button", onclick: () => reset2fa(u, shell) }, "Turn off 2FA"));
      if (u.id !== state.user.id) {
        const role = h("select", { class: "select sm", "aria-label": "Role for " + u.name }, h("option", { value: "member", text: "Team member" }), h("option", { value: "admin", text: "Admin" }));
        role.value = u.role;
        role.addEventListener("change", async () => {
          try { await patch("/users/" + u.id, { role: role.value }); toast(`${u.name} is now ${role.value === "admin" ? "an admin" : "a team member"}`); renderTeam(shell); }
          catch (e) { errorToast(e); role.value = u.role; }
        });
        acts.unshift(role);
        acts.push(h("button", { class: "btn sm " + (u.disabled ? "" : "danger"), type: "button", onclick: () => toggleUser(u, shell) }, u.disabled ? "Turn on" : "Turn off"));
      }
    }
    return h("tr", null,
      h("td", null, h("div", { class: "u" }, avatar(u.name), h("div", null, h("b", { text: u.name + (u.id === state.user.id ? " (you)" : "") }), h("small", { text: u.email })))),
      h("td", null, u.disabled ? h("span", { class: "pill", text: "Turned off" }) : h("span", { class: "pill" + (u.role === "admin" ? " st st-new" : ""), text: u.role === "admin" ? "Admin" : "Team member" })),
      h("td", { class: "hide-sm" }, u.totpEnabled ? h("span", { class: "pill st st-won", text: "On" }) : h("span", { class: "pill", text: "Off" })),
      h("td", { class: "hide-sm", title: u.lastLoginAt ? fullDate(u.lastLoginAt) : "" }, u.lastLoginAt ? ago(u.lastLoginAt) : "Never"),
      h("td", null, h("div", { class: "acts" }, acts)));
  });
  clear(shell.content, h("div", { class: "page" },
    h("article", { class: "card" }, h("div", { class: "tbl-wrap" }, h("table", { class: "tbl" },
      h("thead", null, h("tr", null, h("th", { text: "Name" }), h("th", { text: "Role" }), h("th", { class: "hide-sm", text: "Two-factor" }), h("th", { class: "hide-sm", text: "Last sign-in" }), h("th"))),
      h("tbody", null, rows)))),
    card("Roles", h("p", { class: "lead", text: "Team members can read and manage every inquiry, add notes and export. Admins can also add people, delete inquiries and change the alert settings." }))));
}

async function addMember(shell) {
  const name = h("input", { class: "input", id: "m-name", required: true, maxlength: "80", autofocus: true });
  const email = h("input", { class: "input", id: "m-email", type: "email", required: true });
  const role = h("select", { class: "select", id: "m-role" }, h("option", { value: "member", text: "Team member" }), h("option", { value: "admin", text: "Admin" }));
  const err = h("p", { class: "err", hidden: true });
  const result = await dialog((done) => h("form", { onsubmit: async (e) => {
    e.preventDefault(); err.hidden = true;
    try { done(await post("/users", { name: name.value, email: email.value, role: role.value })); }
    catch (ex) { err.textContent = ex.message; err.hidden = false; }
  } },
  h("h3", { text: "Add a team member" }), h("p", { text: "They'll get a temporary password to sign in with, and choose their own the first time." }),
  h("div", { class: "field" }, h("label", { class: "fl", for: "m-name" }, "Name"), name),
  h("div", { class: "field" }, h("label", { class: "fl", for: "m-email" }, "Email"), email),
  h("div", { class: "field" }, h("label", { class: "fl", for: "m-role" }, "Role"), role), err,
  h("div", { class: "acts" }, h("button", { class: "btn", type: "button", onclick: () => done(null) }, "Cancel"), h("button", { class: "btn primary", type: "submit" }, "Add"))));
  if (!result) return;
  await showTempPassword(`${result.user.name} can sign in now`, result.user.email, result.tempPassword);
  renderTeam(shell);
}
function showTempPassword(title, email, pw) {
  return dialog((done) => h("form", { onsubmit: (e) => { e.preventDefault(); done(true); } },
    h("h3", { text: title }),
    h("p", { text: `Send these details to them privately (not in a group chat). This password is shown only once; they'll choose a new one when they sign in.` }),
    h("div", { class: "field" }, h("label", { class: "fl" }, "Sign-in page"), h("div", { class: "secret" }, h("code", { text: location.origin + "/admin/" }))),
    h("div", { class: "field" }, h("label", { class: "fl" }, "Email"), h("div", { class: "secret" }, h("code", { text: email }))),
    h("div", { class: "field" }, h("label", { class: "fl" }, "Temporary password"), h("div", { class: "secret" }, h("code", { text: pw }),
      h("button", { class: "btn", type: "button", onclick: () => copyText(`Sign in at ${location.origin}/admin/\nEmail: ${email}\nTemporary password: ${pw}`, "Sign-in details copied") }, icon("copy", "sm"), "Copy all"))),
    h("div", { class: "acts" }, h("button", { class: "btn primary", type: "submit" }, "Done"))));
}
async function resetPw(u, shell) {
  if (!(await confirmBox(`Reset ${u.name}'s password?`, "They'll be signed out everywhere and need the new temporary password to get back in.", { ok: "Reset password" }))) return;
  try { const r = await post(`/users/${u.id}/reset-password`); await showTempPassword(`New temporary password for ${u.name}`, u.email, r.tempPassword); renderTeam(shell); }
  catch (e) { errorToast(e); }
}
async function reset2fa(u, shell) {
  if (!(await confirmBox(`Turn off two-factor sign-in for ${u.name}?`, "Do this only if they've lost their phone. They can set it up again from their account page.", { ok: "Turn off" }))) return;
  try { await post(`/users/${u.id}/reset-2fa`); toast("Two-factor sign-in turned off"); renderTeam(shell); } catch (e) { errorToast(e); }
}
async function toggleUser(u, shell) {
  if (!u.disabled && !(await confirmBox(`Turn off ${u.name}'s account?`, "They'll be signed out right away and can't sign in until an admin turns the account back on. Their notes stay.", { ok: "Turn off", danger: true }))) return;
  try { await patch("/users/" + u.id, { disabled: !u.disabled }); toast(u.disabled ? "Account turned on" : "Account turned off"); renderTeam(shell); } catch (e) { errorToast(e); }
}

/* ---------- settings (admins) ---------- */
export async function renderSettings(shell) {
  setTitle("Settings");
  clear(shell.tools);
  let s, audit;
  try { [s, audit] = await Promise.all([get("/settings"), get("/audit")]); }
  catch (e) { clear(shell.content, h("div", { class: "empty" }, h("h3", { text: "Couldn't load settings" }), h("p", { text: e.message }))); return; }
  const st = s.settings;
  const emails = h("textarea", { class: "textarea", id: "s-emails", rows: 3, placeholder: "sales@yourcompany.com, owner@yourcompany.com" });
  emails.value = (st.notify_emails || []).join(", ");
  const hook = h("input", { class: "input", id: "s-hook", type: "url", placeholder: "https://hooks.slack.com/services/…", value: st.webhook_url || "" });
  const auto = h("input", { type: "checkbox", id: "s-auto", checked: !!st.autoreply });
  const spam = h("input", { type: "checkbox", id: "s-spam", checked: !!st.notify_on_spam });
  const saveBtn = h("button", { class: "btn primary", type: "submit" }, "Save settings");
  const testOut = h("div");
  const form = h("form", { onsubmit: async (e) => {
    e.preventDefault(); saveBtn.disabled = true;
    try { await put("/settings", { notify_emails: emails.value, webhook_url: hook.value, autoreply: auto.checked, notify_on_spam: spam.checked }); toast("Settings saved"); }
    catch (ex) { errorToast(ex, "Couldn't save"); }
    finally { saveBtn.disabled = false; }
  } },
  s.mailEnabled
    ? h("div", { class: "statusline ok" }, icon("check", "sm"), "Email is set up on the server, so alerts and confirmations can be sent.")
    : h("div", { class: "statusline warn" }, icon("spam", "sm"), "Email isn't set up on the server yet, so no emails go out. Add the SMTP settings (see the README) and restart."),
  h("div", { class: "field" }, h("label", { class: "fl", for: "s-emails" }, "Also send new-inquiry alerts to"), emails,
    h("p", { class: "hint", text: "Separate addresses with commas. Team members who keep “Email me about new inquiries” on in their account get alerts too." })),
  h("div", { class: "field" }, h("label", { class: "fl", for: "s-hook" }, "Chat alert (webhook) address"), hook,
    h("p", { class: "hint", text: "Optional. Paste a Slack, Discord, Microsoft Teams or Zapier incoming-webhook address to get a message there for each new inquiry." })),
  h("div", { class: "field" }, h("label", { class: "switch" }, auto, h("span", { text: "Send visitors a confirmation email in their language (English or Spanish), with their reference number" }))),
  h("div", { class: "field" }, h("label", { class: "switch" }, spam, h("span", { text: "Send alerts for messages that look like spam too" }))),
  h("div", { class: "contact-actions" }, saveBtn,
    h("button", { class: "btn", type: "button", onclick: async (e) => {
      const b = e.currentTarget; b.disabled = true;
      try {
        const r = await post("/settings/test");
        clear(testOut, ["email", "webhook"].map((k) => h("div", { class: "statusline " + (r[k].ok ? "ok" : "warn") }, icon(r[k].ok ? "check" : "spam", "sm"), (k === "email" ? "Email: " : "Chat alert: ") + r[k].message)));
      } catch (ex) { errorToast(ex); }
      finally { b.disabled = false; }
    } }, icon("bell", "sm"), "Send a test alert")),
  testOut);

  const label = { login: "Signed in", logout: "Signed out", login_failed: "Failed sign-in", locked: "Account locked", password_changed: "Changed password", password_reset: "Password reset", "2fa_enabled": "Turned on 2FA", "2fa_disabled": "Turned off 2FA", "2fa_reset": "2FA turned off", user_created: "Account created", user_updated: "Account changed", settings_changed: "Settings changed", export: "Exported inquiries", inquiries_deleted: "Deleted inquiries", sessions_revoked: "Signed out other sessions" };
  const log = h("div", { class: "tbl-wrap" }, h("table", { class: "tbl compact" },
    h("thead", null, h("tr", null, h("th", { text: "When" }), h("th", { text: "Who" }), h("th", { text: "What" }), h("th", { class: "hide-sm", text: "Details" }), h("th", { class: "hide-sm", text: "IP address" }))),
    h("tbody", null, audit.slice(0, 120).map((a) => h("tr", null,
      h("td", { title: fullDate(a.created_at), text: ago(a.created_at) }), h("td", { text: a.user_name || a.email || "—" }),
      h("td", { text: label[a.action] || a.action }), h("td", { class: "hide-sm", text: a.detail || "" }), h("td", { class: "hide-sm", text: a.ip || "" }))))));

  clear(shell.content, h("div", { class: "page" },
    card("Alerts", form),
    h("article", { class: "card" }, h("header", null, h("h3", { text: "Security log" })), h("div", { class: "pad" }, h("p", { class: "lead", text: "Sign-ins, account changes, exports and deletions, newest first." })), log)));
}

/* ---------- your account ---------- */
export async function renderAccount(shell) {
  setTitle("Your account");
  clear(shell.tools);
  const u = state.user;

  const name = h("input", { class: "input", id: "a-name", value: u.name, maxlength: "80" });
  const notify = h("input", { type: "checkbox", id: "a-notify", checked: u.notifyEmail });
  const profile = h("form", { onsubmit: async (e) => {
    e.preventDefault();
    try { const r = await patch("/me", { name: name.value, notifyEmail: notify.checked }); state.user = r.user; toast("Saved"); }
    catch (ex) { errorToast(ex); }
  } },
  h("div", { class: "form-grid" },
    h("div", { class: "field" }, h("label", { class: "fl", for: "a-name" }, "Name"), name),
    h("div", { class: "field" }, h("label", { class: "fl" }, "Email"), h("input", { class: "input", value: u.email, disabled: true }))),
  h("div", { class: "field" }, h("label", { class: "switch" }, notify, h("span", { text: "Email me about new inquiries" }))),
  h("button", { class: "btn primary", type: "submit" }, "Save"));

  /* this browser */
  const sound = h("input", { type: "checkbox", checked: state.prefs.sound });
  sound.addEventListener("change", () => { state.prefs.sound = sound.checked; savePrefs(); if (sound.checked) chime(); });
  const desk = h("input", { type: "checkbox", checked: state.prefs.desktop && "Notification" in window && Notification.permission === "granted" });
  desk.addEventListener("change", async () => {
    if (desk.checked) {
      if (!("Notification" in window)) { toast("This browser can't show notifications", { error: true }); desk.checked = false; return; }
      const p = await Notification.requestPermission();
      if (p !== "granted") { toast("Notifications are blocked", { error: true, text: "Allow notifications for this site in your browser settings, then try again." }); desk.checked = false; return; }
    }
    state.prefs.desktop = desk.checked; savePrefs();
  });
  const theme = h("select", { class: "select", id: "a-theme" }, [["system", "Match my device"], ["light", "Light"], ["dark", "Dark"]].map(([v, t]) => h("option", { value: v, text: t })));
  theme.value = state.prefs.theme;
  theme.addEventListener("change", () => { state.prefs.theme = theme.value; savePrefs(); });
  const browser = h("div", null,
    h("p", { class: "lead", text: "These settings only apply to this browser." }),
    h("div", { class: "field" }, h("label", { class: "switch" }, sound, h("span", { text: "Play a sound when a new inquiry arrives" }))),
    h("div", { class: "field" }, h("label", { class: "switch" }, desk, h("span", { text: "Show a desktop notification when this tab is in the background" }))),
    h("div", { class: "field" }, h("label", { class: "fl", for: "a-theme" }, "Appearance"), theme));

  /* password */
  const cur = h("input", { class: "input", type: "password", id: "p-cur", autocomplete: "current-password", required: true });
  const nx = h("input", { class: "input", type: "password", id: "p-new", autocomplete: "new-password", required: true, minlength: "10" });
  const nx2 = h("input", { class: "input", type: "password", id: "p-new2", autocomplete: "new-password", required: true });
  const pw = h("form", { onsubmit: async (e) => {
    e.preventDefault();
    if (nx.value !== nx2.value) return toast("The new passwords don't match", { error: true });
    try { await post("/me/password", { current: cur.value, next: nx.value }); cur.value = nx.value = nx2.value = ""; toast("Password changed", { text: "Your other sessions were signed out." }); }
    catch (ex) { errorToast(ex, "Couldn't change the password"); }
  } },
  h("div", { class: "field" }, h("label", { class: "fl", for: "p-cur" }, "Current password"), cur),
  h("div", { class: "form-grid" },
    h("div", { class: "field" }, h("label", { class: "fl", for: "p-new" }, "New password"), nx),
    h("div", { class: "field" }, h("label", { class: "fl", for: "p-new2" }, "New password again"), nx2)),
  h("p", { class: "hint field", text: "At least 10 characters. A few unrelated words make a strong password that's easy to remember." }),
  h("button", { class: "btn primary", type: "submit" }, "Change password"));

  /* two-factor */
  const twofa = h("div");
  const paint2fa = () => {
    if (state.user.totpEnabled) {
      clear(twofa, h("div", { class: "statusline ok" }, icon("shield", "sm"), "Two-factor sign-in is on. You'll enter a code from your authenticator app each time you sign in."),
        h("button", { class: "btn danger", type: "button", onclick: async () => {
          const p = await askPassword("Turn off two-factor sign-in?", "Enter your password to confirm.");
          if (!p) return;
          try { await post("/me/2fa/disable", { password: p }); state.user.totpEnabled = false; toast("Two-factor sign-in is off"); paint2fa(); } catch (e) { errorToast(e); }
        } }, "Turn off"));
    } else {
      clear(twofa, h("p", { class: "lead", text: "Protect customer data with a second step at sign-in: a 6-digit code from an app such as Google Authenticator, Microsoft Authenticator, 1Password or Authy." }),
        h("button", { class: "btn primary", type: "button", onclick: setup2fa }, icon("shield", "sm"), "Set up two-factor sign-in"));
    }
  };
  async function setup2fa() {
    const p = await askPassword("Set up two-factor sign-in", "Enter your password to start.");
    if (!p) return;
    let r;
    try { r = await post("/me/2fa/setup", { password: p }); } catch (e) { return errorToast(e); }
    const code = h("input", { class: "input code-input", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "7", required: true, "aria-label": "6-digit code" });
    const err = h("p", { class: "err", hidden: true });
    const ok = await dialog((done) => h("form", { onsubmit: async (e) => {
      e.preventDefault(); err.hidden = true;
      try { await post("/me/2fa/enable", { code: code.value }); done(true); }
      catch (ex) { err.textContent = ex.message; err.hidden = false; code.select(); }
    } },
    h("h3", { text: "Scan this code" }),
    h("p", { text: "Open your authenticator app, add an account, and scan the code. Or type the key in by hand." }),
    h("div", { class: "qr" }, h("img", { src: r.qr, alt: "QR code for your authenticator app", width: 180, height: 180 })),
    h("div", { class: "field" }, h("label", { class: "fl" }, "Key"), h("div", { class: "secret" }, h("code", { text: r.secret }))),
    h("div", { class: "field" }, h("label", { class: "fl" }, "Then enter the 6-digit code it shows"), code), err,
    h("div", { class: "acts" }, h("button", { class: "btn", type: "button", onclick: () => done(false) }, "Cancel"), h("button", { class: "btn primary", type: "submit" }, "Turn on"))));
    if (ok) { state.user.totpEnabled = true; toast("Two-factor sign-in is on"); paint2fa(); }
  }
  paint2fa();

  /* sessions */
  const sess = h("div");
  const paintSessions = async () => {
    let list = [];
    try { list = (await get("/me/sessions")).sessions; } catch (e) { /* skip */ }
    clear(sess, h("div", { class: "tbl-wrap" }, h("table", { class: "tbl compact" }, h("tbody", null, list.map((x) => h("tr", null,
      h("td", { text: (x.userAgent || "Unknown browser").replace(/\s*\(.*?\)\s*/g, " ").slice(0, 70) }),
      h("td", { class: "hide-sm", text: x.ip || "" }),
      h("td", { text: x.current ? "This browser" : "Active " + ago(x.lastSeenAt) })))))),
    list.length > 1 ? h("div", { class: "pad" }, h("button", { class: "btn", type: "button", onclick: async () => {
      try { await post("/me/sessions/revoke-others"); toast("Signed out of your other sessions"); paintSessions(); } catch (e) { errorToast(e); }
    } }, "Sign out everywhere else")) : null);
  };
  paintSessions();

  clear(shell.content, h("div", { class: "page" },
    card("Profile", profile), card("This browser", browser), card("Password", pw), card("Two-factor sign-in", twofa),
    h("article", { class: "card" }, h("header", null, h("h3", { text: "Where you're signed in" })), h("div", { class: "pad" }), sess),
    card(null, h("button", { class: "btn", type: "button", onclick: signOut }, icon("logout", "sm"), "Sign out"))));
}

function askPassword(title, text) {
  const pw = h("input", { class: "input", type: "password", autocomplete: "current-password", required: true, autofocus: true, "aria-label": "Password" });
  return dialog((done) => h("form", { onsubmit: (e) => { e.preventDefault(); done(pw.value); } },
    h("h3", { text: title }), h("p", { text }), pw,
    h("div", { class: "acts" }, h("button", { class: "btn", type: "button", onclick: () => done(null) }, "Cancel"), h("button", { class: "btn primary", type: "submit" }, "Continue"))));
}
