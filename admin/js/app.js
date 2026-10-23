/* JIEWEITECH admin dashboard: sign-in, the app shell, routing and live updates. */
import { h, clear, icon, mark, avatar, toast } from "./dom.js";
import { get, post, setCsrf, whenSignedOut, ApiError } from "./api.js";
import { renderInquiries, refreshList, refreshDetail } from "./inquiries.js";
import { renderOverview } from "./overview.js";
import { renderTeam, renderSettings, renderAccount } from "./pages.js";

export const state = {
  user: null, meta: null, counts: null, users: [], tags: [],
  live: false,
  prefs: loadPrefs()
};

const app = document.getElementById("app");

/* ---------- preferences kept in this browser ---------- */
function loadPrefs() {
  const d = { sound: true, desktop: false, theme: "system" };
  try { return Object.assign(d, JSON.parse(localStorage.getItem("jw-admin-prefs") || "{}")); } catch (e) { return d; }
}
export function savePrefs() {
  try { localStorage.setItem("jw-admin-prefs", JSON.stringify(state.prefs)); } catch (e) { /* private mode */ }
  applyTheme();
}
function applyTheme() {
  const t = state.prefs.theme;
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
applyTheme();

/* ---------- helpers other views use ---------- */
export const statusOf = (id) => (state.meta.statuses.find((s) => s.id === id) || { id, label: id });
export const serviceLabel = (id) => (state.meta.services[id] || {}).en || id || "—";
export const planLabel = (id) => (state.meta.plans[id] || {}).en || id || "—";
export const isAdmin = () => state.user && state.user.role === "admin";
export function statusPill(id) { const s = statusOf(id); return h("span", { class: "pill st st-" + s.id }, s.label); }
export function errorToast(e, title = "That didn't work") { toast(title, { error: true, text: e instanceof ApiError || e instanceof Error ? e.message : String(e) }); }

export async function loadCounts() {
  const d = new Date();
  const today = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  try {
    state.counts = await get("/inquiries/counts", { today, dayStart, monthStart });
    paintCounts();
  } catch (e) { /* the next refresh will try again */ }
  return state.counts;
}
export async function loadUsers() { try { state.users = await get("/users"); } catch (e) { /* keep the old list */ } return state.users; }
export async function loadTags() { try { state.tags = await get("/tags"); } catch (e) { /* keep */ } paintTags(); return state.tags; }

/* ---------- routing ---------- */
export function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, qs] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(qs || ""));
  if (parts[0] === "inquiry" && parts[1]) return { name: "inquiries", view: "all", id: parts[1], query };
  if (parts[0] === "inquiries") return { name: "inquiries", view: parts[1] || "inbox", id: parts[2] || null, query };
  if (["overview", "team", "settings", "account"].includes(parts[0])) return { name: parts[0], query };
  return { name: "overview", query };
}
export function go(hash, replace) {
  if (replace) history.replaceState(null, "", hash);
  else history.pushState(null, "", hash);
  route();
}
addEventListener("hashchange", () => route());

let shell = null;
let current = null;
function route() {
  if (!state.user) return;
  const r = parseRoute();
  if (!shell) buildShell();
  shell.root.classList.remove("nav-open");
  const key = r.name === "inquiries" ? "inquiries" : r.name;
  paintNav(r);
  if (key === "inquiries") { renderInquiries(shell, r, current === "inquiries"); }
  else if (key === "overview") renderOverview(shell);
  else if (key === "team") renderTeam(shell);
  else if (key === "settings") { if (isAdmin()) renderSettings(shell); else { go("#/overview", true); return; } }
  else if (key === "account") renderAccount(shell);
  current = key;
}

/* ---------- shell ---------- */
const VIEWS = [
  ["inbox", "Inbox", "inbox"], ["unread", "Unread", "unread"], ["mine", "Assigned to me", "mine"],
  ["followup", "Follow-up due", "followup"], ["all", "All inquiries", "all"], ["archived", "Archived", "archive"], ["spam", "Spam", "spam"]
];
function buildShell() {
  const navLinks = {};
  const link = (href, label, ic, key, extra) => {
    const badge = h("span", { class: "badge", hidden: true });
    const a = h("a", { class: "nv", href }, ic ? icon(ic) : null, extra || null, h("span", { text: label }), badge);
    navLinks[key] = { a, badge };
    return h("li", null, a);
  };
  const statusList = h("ul");
  const tagList = h("ul");
  const liveEl = h("div", { class: "live", title: "Live updates" }, h("i"), h("span", { text: "Connecting…" }));
  const meName = h("b"), meRole = h("span");
  const side = h("aside", { class: "side", "aria-label": "Dashboard" },
    h("div", { class: "brand" }, mark(), h("div", null, "JIEWEITECH", h("small", { text: "Inquiries" }))),
    h("nav", null,
      h("ul", null, link("#/overview", "Overview", "overview", "overview")),
      h("h4", { text: "Inquiries" }),
      h("ul", null, VIEWS.map(([v, label, ic]) => link("#/inquiries/" + v, label, ic, "v:" + v))),
      h("h4", { text: "Pipeline" }),
      statusList,
      h("h4", { text: "Tags", class: "tags-h", hidden: true }),
      tagList,
      h("h4", { text: "Workspace" }),
      h("ul", null, link("#/team", "Team", "team", "team"), isAdmin() ? link("#/settings", "Settings", "settings", "settings") : null, link("#/account", "Your account", "account", "account"))),
    liveEl,
    h("div", { class: "me" }, avatar(state.user.name), h("div", { class: "who" }, meName, meRole),
      h("button", { class: "btn icon", type: "button", title: "Sign out", "aria-label": "Sign out", onclick: signOut }, icon("logout"))));
  meName.textContent = state.user.name; meRole.textContent = state.user.role === "admin" ? "Admin" : "Team member";
  state.meta.statuses.forEach((s) => {
    const li = link("#/inquiries/all?status=" + s.id, s.label, null, "s:" + s.id, h("i", { class: "sdot", style: { "--c": `var(--s-${s.id})` } }));
    statusList.appendChild(li);
  });
  const title = h("span"), count = h("span", { class: "count" });
  const tools = h("div", { class: "tools" });
  const topbar = h("header", { class: "topbar" },
    h("button", { class: "btn icon ghost menu-toggle", type: "button", "aria-label": "Open menu", onclick: () => root.classList.add("nav-open") }, icon("menu")),
    h("h1", null, title, count), h("div", { class: "grow" }), tools);
  const content = h("div", { class: "content", id: "content" });
  const main = h("main", { class: "main" }, topbar, content);
  const scrim = h("div", { class: "scrim", onclick: () => root.classList.remove("nav-open") });
  const root = h("div", { class: "shell" }, side, scrim, main);
  clear(app, root);
  shell = { root, side, main, content, topbar, title, count, tools, navLinks, tagList, live: liveEl };
  paintCounts(); paintTags(); paintLive();
}
export function setTitle(text, countText) {
  shell.title.textContent = text;
  shell.count.textContent = countText || "";
}
function paintNav(r) {
  if (!shell) return;
  const key = r.name === "inquiries" ? (r.query.status ? "s:" + r.query.status : "v:" + r.view) : r.name;
  for (const [k, { a }] of Object.entries(shell.navLinks)) {
    if (k === key) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  }
}
function paintCounts() {
  if (!shell || !state.counts) return;
  const { views, byStatus } = state.counts;
  for (const [k, { badge }] of Object.entries(shell.navLinks)) {
    let n = null;
    if (k.startsWith("v:")) n = views[k.slice(2)];
    if (k.startsWith("s:")) n = byStatus[k.slice(2)];
    if (n == null || (n === 0 && k !== "v:inbox")) { badge.hidden = true; continue; }
    badge.hidden = false; badge.textContent = n > 999 ? "999+" : String(n);
    badge.classList.toggle("hot", k === "v:unread" || k === "v:followup");
  }
  const unread = views.unread;
  document.title = (unread ? `(${unread}) ` : "") + "Inquiries · JIEWEITECH Admin";
}
function paintTags() {
  if (!shell) return;
  const list = (state.tags || []).slice(0, 8);
  shell.side.querySelector(".tags-h").hidden = !list.length;
  clear(shell.tagList, list.map((t) => h("li", null, h("a", { class: "nv", href: "#/inquiries/all?tag=" + encodeURIComponent(t.tag) }, icon("tag"), h("span", { text: t.tag }), h("span", { class: "badge", text: String(t.n) })))));
}
function paintLive() {
  if (!shell) return;
  shell.live.classList.toggle("on", state.live);
  shell.live.querySelector("span").textContent = state.live ? "Live" : "Reconnecting…";
}

/* ---------- live updates ---------- */
let es = null, refreshTimer = null;
function connectLive() {
  if (es) es.close();
  es = new EventSource("/admin/api/events");
  es.addEventListener("open", () => { state.live = true; paintLive(); });
  es.addEventListener("error", () => { state.live = false; paintLive(); });
  es.addEventListener("inquiry", (ev) => {
    let d; try { d = JSON.parse(ev.data); } catch (e) { return; }
    if (d.type === "created") announce(d);
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      loadCounts();
      if (current === "inquiries") refreshList({ quiet: true });
      if (current === "overview") renderOverview(shell, { quiet: true });
      if (d.type !== "created" && d.by !== state.user.id) refreshDetail(d);
      if (d.type === "updated" || d.type === "bulk") loadTags();
    }, 250);
  });
}
function announce(d) {
  if (d.spam) return;
  const who = d.name + (d.company ? " · " + d.company : "");
  toast("New inquiry", { icon: "inbox_in", text: who, action: { label: "Open", run: () => go("#/inquiries/inbox/" + d.id) }, ms: 12000 });
  if (state.prefs.sound) chime();
  if (state.prefs.desktop && "Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
    try {
      const n = new Notification("New inquiry · JIEWEITECH", { body: who, icon: "/assets/img/favicon.svg", tag: "inq-" + d.id });
      n.onclick = () => { window.focus(); go("#/inquiries/inbox/" + d.id); n.close(); };
    } catch (e) { /* some browsers only allow this from a service worker */ }
  }
}
let audio = null;
function chime() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    [[880, 0], [1320, 0.12]].forEach(([f, dt]) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + dt); g.gain.exponentialRampToValueAtTime(0.12, t + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.35);
      o.connect(g).connect(audio.destination); o.start(t + dt); o.stop(t + dt + 0.4);
    });
  } catch (e) { /* no audio */ }
}
export { chime };

/* ---------- signing in ---------- */
function authLayout(card) {
  return h("div", { class: "auth" },
    h("section", { class: "auth-art", "aria-hidden": "true" },
      h("div", { class: "glow" }), mark("big"),
      h("div", { class: "brand" }, mark(), "JIEWEITECH"),
      h("div", null, h("h1", { text: "Every inquiry, in one place." }), h("p", { text: "Read new requests as they arrive, keep track of every conversation, and never lose a lead to a busy inbox." })),
      h("small", { text: "Jieweitech, Inc. · Marina del Rey, California" })),
    h("main", { class: "auth-main" }, h("div", { class: "auth-card" }, h("div", { class: "mobile-brand" }, mark(), "JIEWEITECH"), card)));
}
function renderLogin(message) {
  const err = h("p", { class: "err", role: "alert", hidden: !message, text: message || "" });
  const email = h("input", { class: "input", type: "email", id: "email", autocomplete: "username", required: true, autofocus: true });
  const pw = h("input", { class: "input", type: "password", id: "pw", autocomplete: "current-password", required: true });
  const btn = h("button", { class: "btn primary lg block", type: "submit" }, "Sign in");
  const form = h("form", {
    onsubmit: async (e) => {
      e.preventDefault(); err.hidden = true; btn.disabled = true; btn.textContent = "Signing in…";
      try {
        const r = await post("/login", { email: email.value, password: pw.value });
        if (r.totp) return renderTotp(r.ticket);
        setCsrf(r.csrf); await boot();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; pw.value = ""; pw.focus(); }
      finally { btn.disabled = false; btn.textContent = "Sign in"; }
    }
  },
  h("h2", { text: "Sign in" }), h("p", { class: "sub", text: "Use your JIEWEITECH team account." }),
  h("div", { class: "field" }, h("label", { class: "fl", for: "email" }, "Email"), email),
  h("div", { class: "field" }, h("label", { class: "fl", for: "pw" }, "Password"), pw),
  btn, err,
  h("p", { class: "foot", text: "Forgot your password? Ask an admin to reset it for you. Admins locked out of every account can run npm run admin:reset-password on the server." }));
  clear(app, authLayout(form));
  email.focus();
}
function renderTotp(ticket) {
  const err = h("p", { class: "err", role: "alert", hidden: true });
  const code = h("input", { class: "input code-input", id: "code", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "7", pattern: "[0-9 ]*", required: true, autofocus: true });
  const btn = h("button", { class: "btn primary lg block", type: "submit" }, "Verify");
  const form = h("form", {
    onsubmit: async (e) => {
      e.preventDefault(); err.hidden = true; btn.disabled = true;
      try { const r = await post("/login/totp", { ticket, code: code.value }); setCsrf(r.csrf); await boot(); }
      catch (ex) {
        if (ex.body && ex.body.error === "expired") return renderLogin(ex.message);
        err.textContent = ex.message; err.hidden = false; code.select();
      } finally { btn.disabled = false; }
    }
  },
  h("h2", { text: "Two-step check" }), h("p", { class: "sub", text: "Enter the 6-digit code from your authenticator app." }),
  h("div", { class: "field" }, h("label", { class: "fl", for: "code" }, "Code"), code), btn, err,
  h("p", { class: "foot" }, h("a", { href: "#", onclick: (e) => { e.preventDefault(); renderLogin(); } }, "Back to sign in")));
  clear(app, authLayout(form));
  code.focus();
}
function renderForcedPassword() {
  const err = h("p", { class: "err", role: "alert", hidden: true });
  const cur = h("input", { class: "input", type: "password", id: "cur", autocomplete: "current-password", required: true, autofocus: true });
  const nx = h("input", { class: "input", type: "password", id: "nx", autocomplete: "new-password", required: true, minlength: "10" });
  const nx2 = h("input", { class: "input", type: "password", id: "nx2", autocomplete: "new-password", required: true });
  const btn = h("button", { class: "btn primary lg block", type: "submit" }, "Save and continue");
  const form = h("form", {
    onsubmit: async (e) => {
      e.preventDefault(); err.hidden = true;
      if (nx.value !== nx2.value) { err.textContent = "The new passwords don't match."; err.hidden = false; return; }
      btn.disabled = true;
      try { await post("/me/password", { current: cur.value, next: nx.value }); toast("Password saved"); await boot(); }
      catch (ex) { err.textContent = ex.message; err.hidden = false; }
      finally { btn.disabled = false; }
    }
  },
  h("h2", { text: "Choose your password" }),
  h("p", { class: "sub", text: "You signed in with a temporary password. Pick your own to continue: at least 10 characters, and not one you use anywhere else." }),
  h("div", { class: "field" }, h("label", { class: "fl", for: "cur" }, "Temporary password"), cur),
  h("div", { class: "field" }, h("label", { class: "fl", for: "nx" }, "New password"), nx),
  h("div", { class: "field" }, h("label", { class: "fl", for: "nx2" }, "New password again"), nx2),
  btn, err,
  h("p", { class: "foot" }, h("a", { href: "#", onclick: (e) => { e.preventDefault(); signOut(); } }, "Sign out")));
  clear(app, authLayout(form));
  cur.focus();
}

export async function signOut() {
  try { await post("/logout"); } catch (e) { /* signed out anyway */ }
  location.hash = "";
  teardown();
  renderLogin();
}
function teardown() {
  if (es) { es.close(); es = null; }
  state.user = null; shell = null; current = null;
}
whenSignedOut(() => {
  if (!state.user) return;
  teardown();
  renderLogin("You've been signed out. Sign in again to continue.");
});

async function boot() {
  let me;
  try { me = await get("/me"); }
  catch (e) {
    if (e.status === 401) return renderLogin();
    clear(app, h("div", { class: "empty" }, h("h3", { text: "The dashboard can't reach the server." }), h("p", { text: e.message }),
      h("button", { class: "btn", type: "button", onclick: () => boot() }, "Try again")));
    return;
  }
  setCsrf(me.csrf);
  state.user = me.user; state.meta = me.meta;
  if (me.user.mustChangePassword) return renderForcedPassword();
  shell = null; current = null;
  await Promise.all([loadCounts(), loadUsers(), loadTags()]);
  if (!location.hash || location.hash === "#") history.replaceState(null, "", "#/overview");
  route();
  connectLive();
}

/* keyboard: "/" focuses search */
addEventListener("keydown", (e) => {
  if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !e.metaKey && !e.ctrlKey) {
    const s = document.getElementById("q");
    if (s) { e.preventDefault(); s.focus(); s.select(); }
  }
});
setInterval(() => { if (state.user && document.visibilityState === "visible") loadCounts(); }, 60000);
document.addEventListener("visibilitychange", () => { if (state.user && document.visibilityState === "visible") loadCounts(); });

boot();
