/* Small DOM helpers. Text always goes in as text (never as HTML), so nothing a visitor typed can run as code. */

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style" && typeof v === "object") { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith("--")) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
      else if (k === "dataset") Object.assign(el.dataset, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k in el && typeof v !== "string" && k !== "list") el[k] = v;
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, String(v));
    }
  }
  add(el, kids);
  return el;
}

export function add(el, kids) {
  for (const k of [].concat(kids)) {
    if (k == null || k === false || k === true) continue;
    if (Array.isArray(k)) add(el, k);
    else el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return el;
}

export function clear(el, ...kids) { el.replaceChildren(); return add(el, kids); }

/* ---------- icons (24px grid, drawn with strokes) ---------- */
const P = {
  overview: "M4 13h6V4H4zM14 20h6v-9h-6zM14 4h6v4h-6zM4 20h6v-3H4z",
  inbox: "M3 13h5l1.5 3h5L16 13h5M5.5 5h13L21 13v6H3v-6z",
  unread: "M4 6h16v12H4zM4 7l8 6 8-6",
  mine: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  followup: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  all: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  archive: "M3 4h18v4H3zM5 8v12h14V8M10 12h4",
  spam: "M12 3l9 16H3zM12 10v4M12 17h.01",
  team: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14a6.5 6.5 0 0 1 3.5 6",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 21a8 8 0 0 0-16 0",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7",
  phone: "M21 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 4.2 2 2 0 0 1 3.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L7 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  reply: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 6 6v5",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  tag: "M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01",
  flag: "M5 21V4M5 4h12l-2 4 2 4H5",
  note: "M5 4h14v12l-4 4H5zM15 20v-4h4M8 9h8M8 13h5",
  plus: "M12 5v14M5 12h14",
  logout: "M15 4h4v16h-4M10 17l5-5-5-5M15 12H3",
  menu: "M4 6h16M4 12h16M4 18h16",
  back: "M15 18l-6-6 6-6",
  chevron: "M9 6l6 6-6 6",
  bell: "M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16zM10 21h4",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  key: "M15 9a4 4 0 1 0-3.9 4.9L8 17v3h3v-2h2v-2l1.1-1.1A4 4 0 0 0 15 9zM15.5 8.5h.01",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18",
  dot: "M12 12h.01",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  undo: "M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  inbox_in: "M12 3v9M8 8l4 4 4-4M3 13h5l1.5 3h5L16 13h5v6H3z"
};
export function icon(name, cls) {
  const ns = "http://www.w3.org/2000/svg";
  const s = document.createElementNS(ns, "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("class", "ic" + (cls ? " " + cls : ""));
  s.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("d", P[name] || P.dot);
  s.appendChild(p);
  return s;
}
export function mark(cls) {
  const ns = "http://www.w3.org/2000/svg";
  const s = document.createElementNS(ns, "svg");
  s.setAttribute("viewBox", "0 0 331.5 392.5");
  s.setAttribute("class", "mk" + (cls ? " " + cls : ""));
  s.setAttribute("aria-hidden", "true");
  const u = document.createElementNS(ns, "use");
  u.setAttribute("href", "#jwMark");
  s.appendChild(u);
  return s;
}

/* ---------- formatting ---------- */
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
export function ago(iso) {
  const t = Date.parse(iso);
  if (!t) return "";
  const s = (t - Date.now()) / 1000;
  const a = Math.abs(s);
  if (a < 45) return "just now";
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (a < 86400 * 7) return rtf.format(Math.round(s / 86400), "day");
  return shortDate(iso);
}
export function shortDate(iso) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" });
}
export function fullDate(iso) {
  return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
export function localDate(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
export function dateLabel(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const today = localDate();
  if (ymd === today) return "Today";
  const diff = Math.round((dt - new Date(today + "T00:00:00")) / 86400000);
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: dt.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}
export const initials = (name) => String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const AV = ["#0b5fff", "#7a3cff", "#008a8a", "#c26a00", "#0a7a47", "#c8221a", "#3b4a63", "#b5267a"];
export function avatar(name, cls) {
  let n = 0;
  for (const c of String(name || "")) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return h("span", { class: "av" + (cls ? " " + cls : ""), title: name, style: { background: AV[n % AV.length] } }, initials(name));
}

/* ---------- toasts ---------- */
export function toast(title, opts = {}) {
  const box = document.getElementById("toasts");
  const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 220); };
  const el = h("div", { class: "toast" + (opts.error ? " err" : "") },
    opts.icon ? icon(opts.icon) : null,
    h("div", { class: "tx" }, h("b", { text: title }), opts.text ? h("span", { text: opts.text }) : null),
    opts.action ? h("button", { class: "btn sm", type: "button", onclick: () => { opts.action.run(); close(); } }, opts.action.label) : null,
    h("button", { class: "x", type: "button", "aria-label": "Dismiss", onclick: close }, icon("x", "sm")));
  box.appendChild(el);
  setTimeout(close, opts.ms || (opts.action ? 9000 : 4200));
  return close;
}

/* ---------- dialogs ---------- */
export function dialog(build, opts = {}) {
  return new Promise((resolve) => {
    const dlg = h("dialog", { class: "dlg" + (opts.wide ? " wide" : "") });
    const done = (v) => { dlg.close(); dlg.remove(); resolve(v); };
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); done(null); });
    dlg.appendChild(build(done));
    document.body.appendChild(dlg);
    dlg.showModal();
    const f = opts.focus || dlg.querySelector("[autofocus], input, textarea, select, button.primary");
    if (f) { f.focus(); if (opts.caret != null && f.setSelectionRange) { f.setSelectionRange(opts.caret, opts.caret); f.scrollTop = 0; } }
  });
}
export function confirmBox(title, text, { ok = "Confirm", danger = false } = {}) {
  return dialog((done) => h("form", { method: "dialog", onsubmit: (e) => { e.preventDefault(); done(true); } },
    h("h3", { text: title }), text ? h("p", { text }) : null,
    h("div", { class: "acts" },
      h("button", { class: "btn", type: "button", onclick: () => done(false) }, "Cancel"),
      h("button", { class: "btn primary" + (danger ? " danger solid" : ""), type: "submit", autofocus: true }, ok))));
}

export async function copyText(text, label = "Copied") {
  try { await navigator.clipboard.writeText(text); toast(label); }
  catch (e) { toast("Couldn't copy", { error: true, text: "Select the text and copy it yourself." }); }
}
