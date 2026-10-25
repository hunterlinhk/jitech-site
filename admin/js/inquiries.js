/* The inquiry list and the detail pane. */
import { h, clear, icon, avatar, ago, fullDate, dateLabel, localDate, toast, dialog, confirmBox, copyText, mark } from "./dom.js";
import { get, post, patch, del } from "./api.js";
import { state, go, setTitle, statusPill, statusOf, serviceLabel, planLabel, isAdmin, errorToast, loadCounts, loadTags } from "./app.js";

const VIEW_TITLES = { inbox: "Inbox", unread: "Unread", mine: "Assigned to me", followup: "Follow-up due", all: "All inquiries", archived: "Archived", spam: "Spam" };
const FILTER_KEYS = ["q", "status", "service", "priority", "assignee", "tag", "lang", "from", "to", "sort", "page"];
const EMPTY = {
  inbox: ["You're all caught up", "New inquiries from the website land here."],
  unread: ["Nothing unread", "Every inquiry has been opened."],
  mine: ["Nothing assigned to you", "Inquiries assigned to you show up here."],
  followup: ["No follow-ups due", "Set a follow-up date on an inquiry and it appears here on that day."],
  all: ["No inquiries yet", "When someone sends the contact form, it shows up here."],
  archived: ["Nothing archived", "Archive an inquiry to clear it from your inbox without deleting it."],
  spam: ["No spam", "Messages that look automated are set aside here."]
};

let L = null;           // DOM for the current list layout
let view = "inbox";
let query = {};
let data = null;        // the current page of results
let openId = null;
let detail = null;      // the open inquiry
const selected = new Set();
let listSeq = 0, detailSeq = 0;

const qs = (extra) => {
  const p = new URLSearchParams();
  const q = Object.assign({}, query, extra || {});
  for (const k of FILTER_KEYS) if (q[k]) p.set(k, q[k]);
  const s = p.toString();
  return s ? "?" + s : "";
};
const listHash = (id) => "#/inquiries/" + view + (id ? "/" + id : "") + qs();

export function renderInquiries(shell, r, sameSection) {
  const nextQuery = {};
  for (const k of FILTER_KEYS) if (r.query[k]) nextQuery[k] = r.query[k];
  const listChanged = !sameSection || !L || r.view !== view || JSON.stringify(nextQuery) !== JSON.stringify(query);
  view = VIEW_TITLES[r.view] ? r.view : "inbox";
  query = nextQuery;
  if (!sameSection || !L || !shell.content.contains(L.split)) build(shell);
  if (listChanged) { selected.clear(); syncFilters(); refreshList(); }
  const id = r.id ? String(r.id) : null;
  if (id !== (openId == null ? null : String(openId)) || !detail) openDetail(id);
  L.split.classList.toggle("has-detail", !!id);
  paintSelection();
}

/* ---------- layout ---------- */
function sel(name, label, options, value) {
  const s = h("select", { class: "select sm", "aria-label": label, name },
    options.map(([v, t]) => h("option", { value: v, text: t })));
  s.value = value || "";
  s.addEventListener("change", () => setFilter(name, s.value));
  return s;
}
function build(shell) {
  const search = h("input", { class: "input", id: "q", type: "search", placeholder: "Search name, company, email, message, notes or JW-number", autocomplete: "off", "aria-label": "Search inquiries" });
  let t;
  search.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => setFilter("q", search.value.trim()), 280); });
  search.addEventListener("keydown", (e) => { if (e.key === "Escape") { search.value = ""; setFilter("q", ""); search.blur(); } });
  const exportBtn = h("a", { class: "btn", href: "#", title: "Download the inquiries in this view as a spreadsheet (CSV)" }, icon("download", "sm"), h("span", { class: "hide-sm", text: "Export" }));
  exportBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const p = new URLSearchParams({ view });
    for (const k of FILTER_KEYS) if (query[k] && k !== "page") p.set(k, query[k]);
    location.href = "/admin/api/inquiries/export.csv?" + p.toString();
  });
  clear(shell.tools, h("div", { class: "search" }, icon("search", "sm"), search, h("span", { class: "kbd", text: "/" })), exportBtn);

  const allBox = h("input", { type: "checkbox", "aria-label": "Select all on this page", title: "Select all on this page" });
  allBox.addEventListener("change", () => { if (!data) return; data.items.forEach((x) => (allBox.checked ? selected.add(x.id) : selected.delete(x.id))); paintRows(); paintSelection(); });
  const userOpts = () => [["", "Anyone"], ["me", "Assigned to me"], ["none", "Unassigned"], ...state.users.filter((u) => !u.disabled).map((u) => [String(u.id), u.name])];
  const filters = h("div", { class: "filters" },
    h("label", { class: "check", title: "Select all" }, allBox),
    sel("status", "Status", [["", "Any status"], ...state.meta.statuses.map((s) => [s.id, s.label])]),
    sel("assignee", "Assigned to", userOpts()),
    h("span", { class: "spacer" }),
    sel("sort", "Sort", [["", "Newest first"], ["oldest", "Oldest first"], ["updated", "Recently updated"], ["priority", "Priority"], ["followup", "Follow-up date"], ["name", "Name"]]),
    h("button", { class: "btn sm", type: "button", onclick: moreFilters }, "More"));
  const chips = h("div", { class: "chips" });
  const bulk = h("div", { class: "bulk", hidden: true });
  const rows = h("div", { class: "rows", role: "list", "aria-label": "Inquiries" });
  const pager = h("div", { class: "pager" });
  const listpane = h("section", { class: "listpane", "aria-label": "Inquiry list" }, filters, chips, bulk, rows, pager);
  const detailEl = h("section", { class: "detail", "aria-label": "Inquiry" });
  const split = h("div", { class: "split" }, listpane, detailEl);
  clear(shell.content, split);
  L = { split, search, filters, chips, bulk, rows, pager, detail: detailEl, allBox };
}

function syncFilters() {
  setTitle(query.status ? statusOf(query.status).label : VIEW_TITLES[view]);
  if (document.activeElement !== L.search) L.search.value = query.q || "";
  for (const s of L.filters.querySelectorAll("select")) s.value = query[s.name] || "";
  const chip = (label, keys) => h("span", { class: "chip" }, label, h("button", { type: "button", "aria-label": "Remove filter " + label, onclick: () => { const p = {}; keys.forEach((k) => (p[k] = "")); setFilters(p); } }, icon("x", "sm")));
  const c = [];
  if (query.q) c.push(chip(`“${query.q}”`, ["q"]));
  if (query.service) c.push(chip(serviceLabel(query.service), ["service"]));
  if (query.priority) c.push(chip("Priority: " + ((state.meta.priorities.find((p) => p.id === query.priority) || {}).label || query.priority), ["priority"]));
  if (query.tag) c.push(chip("Tag: " + query.tag, ["tag"]));
  if (query.lang) c.push(chip("Language: " + (state.meta.langs[query.lang] || query.lang), ["lang"]));
  if (query.from || query.to) c.push(chip("Received " + (query.from ? "from " + dateLabel(query.from.slice(0, 10)) : "") + (query.to ? " to " + dateLabel(query.to.slice(0, 10)) : ""), ["from", "to"]));
  clear(L.chips, c);
}

function setFilter(k, v) { setFilters({ [k]: v }); }
function setFilters(p) {
  for (const [k, v] of Object.entries(p)) { if (v) query[k] = v; else delete query[k]; }
  if (!("page" in p)) delete query.page;
  history.replaceState(null, "", listHash(openId));
  selected.clear();
  syncFilters();
  refreshList();
}

async function moreFilters() {
  const lang = h("select", { class: "select", id: "f-lang" }, h("option", { value: "", text: "Any language" }), Object.entries(state.meta.langs).map(([k, v]) => h("option", { value: k, text: v })));
  lang.value = query.lang || "";
  const from = h("input", { class: "input", type: "date", id: "f-from", value: query.from ? toLocalYmd(query.from) : "" });
  const to = h("input", { class: "input", type: "date", id: "f-to", value: query.to ? toLocalYmd(query.to, -1) : "" });
  const service = h("select", { class: "select", id: "f-service" }, h("option", { value: "", text: "Any service" }), Object.entries(state.meta.services).map(([k, v]) => h("option", { value: k, text: v.en })));
  service.value = query.service || "";
  const priority = h("select", { class: "select", id: "f-priority" }, h("option", { value: "", text: "Any priority" }), state.meta.priorities.map((p) => h("option", { value: p.id, text: p.label })));
  priority.value = query.priority || "";
  const tag = h("input", { class: "input", id: "f-tag", value: query.tag || "", list: "tag-list", placeholder: "Any tag" });
  const dl = h("datalist", { id: "tag-list" }, state.tags.map((t) => h("option", { value: t.tag })));
  const res = await dialog((done) => h("form", { onsubmit: (e) => { e.preventDefault(); done(true); } },
    h("h3", { text: "More filters" }),
    h("div", { class: "form-grid" },
      h("div", { class: "field" }, h("label", { class: "fl", for: "f-service" }, "Service"), service),
      h("div", { class: "field" }, h("label", { class: "fl", for: "f-priority" }, "Priority"), priority)),
    h("div", { class: "field" }, h("label", { class: "fl", for: "f-lang" }, "Language"), lang),
    h("div", { class: "form-grid" },
      h("div", { class: "field" }, h("label", { class: "fl", for: "f-from" }, "Received from"), from),
      h("div", { class: "field" }, h("label", { class: "fl", for: "f-to" }, "Received until"), to)),
    h("div", { class: "field" }, h("label", { class: "fl", for: "f-tag" }, "Tag"), tag, dl),
    h("div", { class: "acts" },
      h("button", { class: "btn", type: "button", onclick: () => done("clear") }, "Clear these"),
      h("button", { class: "btn primary", type: "submit" }, "Apply"))));
  if (!res) return;
  if (res === "clear") return setFilters({ service: "", priority: "", lang: "", from: "", to: "", tag: "" });
  const isoStart = (ymd, addDays = 0) => { if (!ymd) return ""; const [y, m, d] = ymd.split("-").map(Number); return new Date(y, m - 1, d + addDays).toISOString(); };
  setFilters({ service: service.value, priority: priority.value, lang: lang.value, from: isoStart(from.value), to: isoStart(to.value, 1), tag: tag.value.trim() });
}
function toLocalYmd(iso, addDays = 0) { const d = new Date(iso); d.setDate(d.getDate() + addDays); return localDate(d); }

/* ---------- list ---------- */
export async function refreshList({ quiet } = {}) {
  if (!L) return;
  const seq = ++listSeq;
  if (!quiet) clear(L.rows, Array.from({ length: 6 }, () => h("div", { class: "skel" })));
  try {
    const res = await get("/inquiries", Object.assign({ view }, query));
    if (seq !== listSeq) return;
    data = res;
    setTitle(query.status ? statusOf(query.status).label : VIEW_TITLES[view], res.total ? res.total.toLocaleString() : "");
    for (const id of [...selected]) if (!res.items.some((x) => x.id === id)) selected.delete(id);
    paintRows(); paintPager(); paintSelection();
  } catch (e) {
    if (seq !== listSeq) return;
    if (!quiet) clear(L.rows, h("div", { class: "empty" }, icon("spam"), h("h3", { text: "Couldn't load inquiries" }), h("p", { text: e.message }),
      h("button", { class: "btn", type: "button", onclick: () => refreshList() }, "Try again")));
  }
}

function paintRows() {
  if (!data) return;
  if (!data.items.length) {
    const filtered = Object.keys(query).some((k) => k !== "sort");
    const [t, s] = filtered ? ["No matches", "Nothing matches these filters. Try removing one."] : EMPTY[view];
    clear(L.rows, h("div", { class: "empty" }, icon(filtered ? "search" : "inbox"), h("h3", { text: t }), h("p", { text: s }),
      filtered ? h("button", { class: "btn", type: "button", onclick: () => setFilters(Object.fromEntries(FILTER_KEYS.map((k) => [k, ""]))) }, "Clear filters") : null));
    return;
  }
  clear(L.rows, data.items.map(rowEl));
  const cur = L.rows.querySelector('[aria-current="true"]');
  if (cur) cur.scrollIntoView({ block: "nearest" });
}

function rowEl(x) {
  const box = h("input", { type: "checkbox", "aria-label": "Select " + x.name, checked: selected.has(x.id) });
  box.addEventListener("click", (e) => e.stopPropagation());
  box.addEventListener("change", () => { box.checked ? selected.add(x.id) : selected.delete(x.id); paintSelection(); });
  const pr = x.priority !== "normal" ? h("span", { class: "pr pr-" + x.priority }, icon("flag", "sm"), state.meta.priorities.find((p) => p.id === x.priority).label) : null;
  const fu = x.followUpAt ? h("span", { class: "pill", title: "Follow-up" }, icon("calendar", "sm"), dateLabel(x.followUpAt)) : null;
  const a = h("a", {
    class: "row" + (x.read ? "" : " unread"), href: listHash(x.id), role: "listitem", "aria-current": String(String(x.id) === String(openId)), dataset: { id: x.id },
    onclick: (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); go(listHash(x.id)); }
  },
  h("div", { class: "sel" }, box, x.read ? null : h("span", { class: "unread-dot", title: "Unread" })),
  h("div", null,
    h("div", { class: "l1" }, h("span", { class: "nm", text: x.name }), h("span", { class: "co", text: x.company || "" }), h("time", { datetime: x.createdAt, title: fullDate(x.createdAt), text: ago(x.createdAt) })),
    h("p", { class: "sn", text: (x.snippet || "").replace(/\s+/g, " ") }),
    h("div", { class: "meta" }, statusPill(x.status), h("span", { class: "svc", text: serviceLabel(x.service) }), pr, fu,
      x.tags.slice(0, 3).map((t) => h("span", { class: "tag", text: t })),
      x.noteCount ? h("span", { class: "pill", title: x.noteCount + " notes" }, icon("note", "sm"), String(x.noteCount)) : null,
      x.assignee ? avatar(x.assignee.name, "sm") : null)));
  return a;
}

function paintPager() {
  if (!data || data.total <= data.per) { clear(L.pager); L.pager.hidden = true; return; }
  L.pager.hidden = false;
  const start = (data.page - 1) * data.per + 1, end = Math.min(data.total, data.page * data.per);
  clear(L.pager, h("span", { text: `${start.toLocaleString()}–${end.toLocaleString()} of ${data.total.toLocaleString()}` }),
    h("span", null,
      h("button", { class: "btn sm", type: "button", disabled: data.page <= 1, onclick: () => setFilters({ page: String(data.page - 1) }) }, "Previous"), " ",
      h("button", { class: "btn sm", type: "button", disabled: data.page >= data.pages, onclick: () => setFilters({ page: String(data.page + 1) }) }, "Next")));
}

/* ---------- selection and bulk actions ---------- */
function paintSelection() {
  if (!L) return;
  const n = selected.size;
  L.bulk.hidden = !n;
  L.allBox.checked = !!(data && data.items.length && data.items.every((x) => selected.has(x.id)));
  L.allBox.indeterminate = n > 0 && !L.allBox.checked;
  if (!n) return;
  const status = h("select", { class: "select sm", "aria-label": "Set status" }, h("option", { value: "", text: "Set status…" }), state.meta.statuses.map((s) => h("option", { value: s.id, text: s.label })));
  status.addEventListener("change", () => status.value && bulk("status", status.value));
  const assign = h("select", { class: "select sm", "aria-label": "Assign" }, h("option", { value: "", text: "Assign to…" }), h("option", { value: "none", text: "Nobody" }),
    state.users.filter((u) => !u.disabled).map((u) => h("option", { value: String(u.id), text: u.name })));
  assign.addEventListener("change", () => assign.value && bulk("assign", assign.value === "none" ? null : Number(assign.value)));
  const btn = (label, action, ic, extra) => h("button", Object.assign({ class: "btn sm", type: "button", onclick: () => bulk(action) }, extra || {}), ic ? icon(ic, "sm") : null, label);
  clear(L.bulk, h("b", { text: `${n} selected` }), status, assign,
    view === "archived" ? btn("Unarchive", "unarchive", "undo") : btn("Archive", "archive", "archive"),
    btn("Mark read", "read"), btn("Mark unread", "unread"),
    view === "spam" ? btn("Not spam", "not_spam") : btn("Spam", "spam", "spam"),
    h("button", { class: "btn sm", type: "button", onclick: bulkTag }, icon("tag", "sm"), "Tag"),
    isAdmin() ? h("button", { class: "btn sm danger", type: "button", onclick: () => bulk("delete") }, icon("trash", "sm"), "Delete") : null,
    h("button", { class: "btn sm ghost", type: "button", onclick: () => { selected.clear(); paintRows(); paintSelection(); } }, "Clear"));
}
async function bulkTag() {
  const input = h("input", { class: "input", id: "bt", list: "bt-list", required: true, autofocus: true, maxlength: "32" });
  const v = await dialog((done) => h("form", { onsubmit: (e) => { e.preventDefault(); done(input.value.trim()); } },
    h("h3", { text: `Tag ${selected.size} inquir${selected.size === 1 ? "y" : "ies"}` }),
    h("div", { class: "field" }, h("label", { class: "fl", for: "bt" }, "Tag"), input, h("datalist", { id: "bt-list" }, state.tags.map((t) => h("option", { value: t.tag })))),
    h("div", { class: "acts" }, h("button", { class: "btn", type: "button", onclick: () => done(null) }, "Cancel"), h("button", { class: "btn primary", type: "submit" }, "Add tag"))));
  if (v) bulk("tag", v);
}
async function bulk(action, value) {
  const ids = [...selected];
  if (action === "delete") {
    const ok = await confirmBox(`Delete ${ids.length} inquir${ids.length === 1 ? "y" : "ies"}?`, "They'll be removed for good, with their notes and history. Archiving keeps them out of the way without losing anything.", { ok: "Delete", danger: true });
    if (!ok) return;
  }
  try {
    const r = await post("/inquiries/bulk", { ids, action, value });
    selected.clear();
    const n = r.updated != null ? r.updated : r.deleted;
    toast(action === "delete" ? `Deleted ${n}` : `Updated ${n}`, action === "archive" ? { action: { label: "Undo", run: () => post("/inquiries/bulk", { ids, action: "unarchive" }).then(afterChange) } } : {});
    afterChange();
  } catch (e) { errorToast(e); }
}
function afterChange() { refreshList({ quiet: true }); loadCounts(); loadTags(); if (openId) loadDetail(openId, { quiet: true }); }

/* ---------- detail ---------- */
function openDetail(id) {
  openId = id;
  for (const r of L.rows.querySelectorAll(".row")) r.setAttribute("aria-current", String(r.dataset.id === String(id)));
  if (!id) {
    detail = null;
    clear(L.detail, h("div", { class: "detail-empty" }, h("div", null, mark(), h("p", { text: "Select an inquiry to read it." }),
      h("p", null, h("span", { class: "kbd", text: "J" }), " ", h("span", { class: "kbd", text: "K" }), " move between inquiries"))));
    return;
  }
  loadDetail(id);
}

export function refreshDetail(evt) {
  if (!openId || !detail) return;
  const ids = evt.ids || [evt.id];
  if (evt.type === "deleted" && ids.map(String).includes(String(openId))) {
    toast("This inquiry was deleted by someone else");
    go("#/inquiries/" + view + qs(), true);
    return;
  }
  if (ids.map(String).includes(String(detail.id))) loadDetail(openId, { quiet: true });
}

async function loadDetail(id, { quiet } = {}) {
  const seq = ++detailSeq;
  if (!quiet) clear(L.detail, h("div", { class: "dbody" }, h("div", { class: "skel" }), h("div", { class: "skel" })));
  try {
    const d = await get("/inquiries/" + encodeURIComponent(id));
    if (seq !== detailSeq) return;
    const wasUnread = data && data.items.find((x) => String(x.id) === String(d.id) && !x.read);
    detail = d;
    paintDetail(quiet);
    if (wasUnread) { wasUnread.read = true; const r = L.rows.querySelector(`.row[data-id="${d.id}"]`); if (r) { r.classList.remove("unread"); const dot = r.querySelector(".unread-dot"); if (dot) dot.remove(); } loadCounts(); }
  } catch (e) {
    if (seq !== detailSeq) return;
    clear(L.detail, h("div", { class: "detail-empty" }, h("div", null, h("h3", { text: e.status === 404 ? "Inquiry not found" : "Couldn't open this inquiry" }), h("p", { text: e.message }))));
  }
}

function neighbors() {
  if (!data || !detail) return [null, null];
  const i = data.items.findIndex((x) => x.id === detail.id);
  return [i > 0 ? data.items[i - 1] : null, i >= 0 && i < data.items.length - 1 ? data.items[i + 1] : null];
}

async function save(p, msg) {
  try {
    const r = await patch("/inquiries/" + detail.id, p);
    detail = r.inquiry;
    paintDetail(true);
    refreshList({ quiet: true });
    loadCounts();
    if (p.tags) loadTags();
    if (msg) toast(msg.title || msg, msg.undo ? { action: { label: "Undo", run: () => save(msg.undo) } } : {});
    return true;
  } catch (e) { errorToast(e, "Couldn't save"); paintDetail(true); return false; }
}

/* ---------- replying ----------
   Replies are written here and sent by the server, so they work whatever email app (or webmail) the team uses.
   Replies from the customer go straight to the inbox of the person who wrote. */
function draftFor(d) {
  const es = d.lang === "es", zh = d.lang === "zh";
  const first = String(d.name).trim().split(/\s+/)[0];
  const co = state.meta.company || {};
  const site = String(state.meta.siteUrl || "").replace(/^https?:\/\//, "");
  return {
    subject: zh ? `Re: 您向 JIEWEITECH 的咨询（${d.ref}）` : es ? `Re: Tu consulta a JIEWEITECH (${d.ref})` : `Re: Your inquiry to JIEWEITECH (${d.ref})`,
    greeting: zh ? `${first}，您好：\n\n感谢您联系 JIEWEITECH。\n\n` : es ? `Hola, ${first}:\n\nGracias por escribir a JIEWEITECH.\n\n` : `Hi ${first},\n\nThanks for reaching out to JIEWEITECH.\n\n`,
    signature: (zh ? "\n\n祝好！\n" : es ? "\n\nSaludos cordiales,\n" : "\n\nBest regards,\n") + `${state.user.name}\nJIEWEITECH · ${co.legalName || "Jieweitech, Inc."}\n${co.phone || ""}\n${site}`
  };
}
function mailLinks(d, subject, body) {
  const e = encodeURIComponent;
  return {
    app: `mailto:${d.email}?subject=${e(subject)}&body=${e(body)}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${e(d.email)}&su=${e(subject)}&body=${e(body)}`,
    outlook: `https://outlook.office.com/mail/deeplink/compose?to=${e(d.email)}&subject=${e(subject)}&body=${e(body)}`
  };
}
async function openReply(d) {
  const draft = draftFor(d);
  const subject = h("input", { class: "input", id: "r-subject", maxlength: "200", value: draft.subject });
  const body = h("textarea", { class: "textarea", id: "r-body", rows: 12, maxlength: "20000" });
  body.value = draft.greeting + draft.signature;
  const quote = h("input", { type: "checkbox", checked: true });
  const copyMe = h("input", { type: "checkbox" });
  const err = h("p", { class: "err", role: "alert", hidden: true });
  const send = h("button", { class: "btn primary", type: "submit", disabled: !state.meta.mailEnabled }, icon("reply", "sm"), "Send reply");
  const elsewhere = (label, key) => h("a", { class: "btn sm", target: key === "app" ? null : "_blank", rel: "noopener noreferrer",
    onclick: (e) => { e.currentTarget.href = mailLinks(d, subject.value, body.value)[key]; } , href: "#" }, label);
  const sent = await dialog((done) => h("form", { class: "reply-form", onsubmit: async (e) => {
    e.preventDefault(); err.hidden = true;
    send.disabled = true; send.lastChild.textContent = "Sending…";
    try { const r = await post(`/inquiries/${d.id}/reply`, { subject: subject.value, body: body.value, quote: quote.checked, copyMe: copyMe.checked }); done(r); }
    catch (ex) { err.textContent = ex.message; err.hidden = false; send.disabled = false; send.lastChild.textContent = "Send reply"; }
  } },
  h("h3", { text: "Reply to " + d.name }),
  state.meta.mailEnabled
    ? h("p", { text: `Sent to ${d.email} from the company email. When they answer, the reply comes to you at ${state.user.email}.` })
    : h("div", { class: "statusline warn" }, icon("spam", "sm"), "Email isn't set up on the server, so this can't be sent from here. Use one of the buttons below to open it in your own email instead."),
  h("div", { class: "field" }, h("label", { class: "fl", for: "r-subject" }, "Subject"), subject),
  h("div", { class: "field" }, h("label", { class: "fl", for: "r-body" }, "Message"), body),
  h("div", { class: "field" }, h("label", { class: "check" }, quote, h("span", { text: "Include their original message below my reply" }))),
  h("div", { class: "field" }, h("label", { class: "check" }, copyMe, h("span", { text: "Send me a copy" }))),
  err,
  h("div", { class: "acts reply-acts" },
    h("span", { class: "else" }, h("span", { class: "muted", text: "Or open in:" }), elsewhere("Gmail", "gmail"), elsewhere("Outlook", "outlook"), elsewhere("Mail app", "app")),
    h("span", { class: "grow" }),
    h("button", { class: "btn", type: "button", onclick: () => done(null) }, "Cancel"), send)), { wide: true, focus: body, caret: draft.greeting.length });
  if (!sent) return;
  detail = sent.inquiry;
  paintDetail(true);
  refreshList({ quiet: true }); loadCounts();
  toast("Reply sent", { text: d.status === "new" ? "Status changed to Contacted." : "Saved in the inquiry's email history." });
}

function paintDetail(keepComposer) {
  const d = detail;
  const keep = keepComposer && L.detail.querySelector("#note-body");
  const draft = keep ? keep.value : "";
  const activeTab = (L.detail.querySelector('.tabs [aria-selected="true"]') || {}).dataset;
  const scroll = L.detail.scrollTop;
  const [prev, next] = neighbors();

  const head = h("div", { class: "dhead" },
    h("button", { class: "btn icon ghost back", type: "button", "aria-label": "Back to the list", onclick: () => go("#/inquiries/" + view + qs()) }, icon("back")),
    h("button", { class: "btn icon ghost nav-step", type: "button", "aria-label": "Previous inquiry", title: "Previous (K)", disabled: !prev, onclick: () => prev && go(listHash(prev.id), true) }, icon("back")),
    h("button", { class: "btn icon ghost nav-step", type: "button", "aria-label": "Next inquiry", title: "Next (J)", disabled: !next, onclick: () => next && go(listHash(next.id), true) }, icon("chevron")),
    h("span", { class: "grow" }),
    h("button", { class: "btn sm ghost", type: "button", onclick: () => save({ read: false }, "Marked as unread").then(() => go("#/inquiries/" + view + qs())) }, icon("unread", "sm"), h("span", { class: "lbl", text: "Mark unread" })),
    d.archived
      ? h("button", { class: "btn sm", type: "button", onclick: () => save({ archived: false }, "Moved back to the inbox") }, icon("undo", "sm"), h("span", { class: "lbl", text: "Unarchive" }))
      : h("button", { class: "btn sm", type: "button", title: "Archive (E)", onclick: () => archive() }, icon("archive", "sm"), h("span", { class: "lbl", text: "Archive" })),
    d.spam
      ? h("button", { class: "btn sm", type: "button", onclick: () => save({ spam: false }, "Marked as not spam"), title: "Not spam" }, icon("check", "sm"), h("span", { class: "lbl", text: "Not spam" }))
      : h("button", { class: "btn sm ghost", type: "button", onclick: () => save({ spam: true }, { title: "Moved to spam", undo: { spam: false } }) }, icon("spam", "sm"), h("span", { class: "lbl", text: "Spam" })),
    isAdmin() ? h("button", { class: "btn sm ghost icon", type: "button", "aria-label": "Delete", title: "Delete", onclick: removeIt }, icon("trash", "sm")) : null,
    h("button", { class: "btn sm ghost icon", type: "button", "aria-label": "Copy link", title: "Copy a link to this inquiry", onclick: () => copyText(location.origin + "/admin/#/inquiry/" + d.id, "Link copied") }, icon("copy", "sm")));

  const phoneDigits = (d.phone || "").replace(/[^\d+]/g, "");
  const who = h("div", { class: "who" }, avatar(d.name, "lg"),
    h("div", null,
      h("h2", null, d.name, d.company ? h("span", { class: "co", text: " · " + d.company }) : null),
      h("div", { class: "sub" }, h("b", { text: d.ref }), h("span", { text: fullDate(d.createdAt) }), h("span", { class: "pill", text: state.meta.langs[d.lang] || d.lang }))));
  const actions = h("div", { class: "contact-actions" },
    h("button", { class: "btn primary", type: "button", onclick: () => openReply(d) }, icon("reply", "sm"), "Reply by email"),
    d.phone ? h("a", { class: "btn", href: "tel:" + phoneDigits }, icon("phone", "sm"), "Call") : null,
    d.phone && phoneDigits.replace(/\D/g, "").length >= 8 ? h("a", { class: "btn", href: "https://wa.me/" + phoneDigits.replace(/\D/g, ""), target: "_blank", rel: "noopener noreferrer" }, "WhatsApp") : null,
    h("button", { class: "btn", type: "button", onclick: () => copyText(d.email, "Email copied") }, icon("copy", "sm"), "Copy email"));

  const spamNote = d.spam ? h("div", { class: "spam-note" }, icon("spam"), "Marked as spam" + (d.spamReason ? ": " + d.spamReason + "." : ".") + " Alerts weren't sent for it.") : null;

  /* left column */
  const message = h("article", { class: "card" }, h("header", null, h("h3", { text: "Message" })), h("div", { class: "pad" }, h("p", { class: "msg", text: d.message })));
  const noteBody = h("textarea", { class: "textarea", id: "note-body", rows: 3, placeholder: "Add an internal note. Only your team can see it.", maxlength: "5000", "aria-label": "New note" });
  noteBody.value = draft;
  const addBtn = h("button", { class: "btn primary sm", type: "submit" }, "Add note");
  const composer = h("form", { class: "composer", onsubmit: async (e) => {
    e.preventDefault();
    const body = noteBody.value.trim(); if (!body) return noteBody.focus();
    addBtn.disabled = true;
    try { await post(`/inquiries/${d.id}/notes`, { body }); noteBody.value = ""; await loadDetail(d.id, { quiet: true }); refreshList({ quiet: true }); }
    catch (ex) { errorToast(ex, "Couldn't add the note"); }
    finally { addBtn.disabled = false; }
  } }, noteBody, h("div", { class: "row-end" }, h("span", null, h("span", { class: "kbd", text: navigator.platform.includes("Mac") ? "⌘" : "Ctrl" }), " + ", h("span", { class: "kbd", text: "Enter" }), " to add"), addBtn));
  noteBody.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); composer.requestSubmit(); } });
  const notesList = h("ul", { class: "notes" }, [...d.notes].reverse().map(noteEl));
  if (!d.notes.length) notesList.appendChild(h("li", { class: "empty" }, h("p", { text: "No notes yet." })));
  const timeline = h("ul", { class: "timeline" }, [...d.events].reverse().map(eventEl));
  const notesPanel = h("div", { id: "p-notes" }, composer, notesList);
  const actPanel = h("div", { id: "p-act", hidden: true }, timeline);
  const tabBtn = (id, label, n, panel) => h("button", { type: "button", role: "tab", "aria-selected": "false", dataset: { tab: id }, onclick: (e) => {
    for (const b of e.currentTarget.parentNode.children) b.setAttribute("aria-selected", String(b === e.currentTarget));
    notesPanel.hidden = id !== "notes"; actPanel.hidden = id !== "act";
  } }, label, h("span", { class: "n", text: String(n) }));
  const tabs = h("div", { class: "tabs", role: "tablist" }, tabBtn("notes", "Notes", d.notes.length), tabBtn("act", "Activity", d.events.length));
  const work = h("article", { class: "card" }, tabs, notesPanel, actPanel);
  const emails = d.messages && d.messages.length ? h("article", { class: "card" }, h("header", null, h("h3", { text: "Emails sent" }), h("span", { class: "muted", text: String(d.messages.length) })),
    h("ul", { class: "mails" }, [...d.messages].reverse().map((m) => h("li", null,
      h("details", null, h("summary", null, avatar(m.user ? m.user.name : "?", "sm"), h("span", { class: "t" }, h("b", { text: m.subject }), h("small", { text: (m.user ? m.user.name : "Former team member") + " · " + ago(m.createdAt) }))),
        h("p", { class: "nb", text: m.body })))))) : null;
  const which = activeTab && activeTab.tab === "act" ? 1 : 0;
  tabs.children[which].setAttribute("aria-selected", "true");
  notesPanel.hidden = which !== 0; actPanel.hidden = which !== 1;

  /* right column */
  const status = h("select", { class: "select", id: "c-status" }, state.meta.statuses.map((s) => h("option", { value: s.id, text: s.label })));
  status.value = d.status;
  status.addEventListener("change", () => save({ status: status.value }, "Status: " + statusOf(status.value).label));
  const priority = h("select", { class: "select", id: "c-priority" }, state.meta.priorities.map((p) => h("option", { value: p.id, text: p.label })));
  priority.value = d.priority;
  priority.addEventListener("change", () => save({ priority: priority.value }, "Priority: " + priority.selectedOptions[0].text));
  const assignee = h("select", { class: "select", id: "c-assignee" }, h("option", { value: "", text: "Nobody" }),
    state.users.filter((u) => !u.disabled || (d.assignee && d.assignee.id === u.id)).map((u) => h("option", { value: String(u.id), text: u.id === state.user.id ? u.name + " (you)" : u.name })));
  assignee.value = d.assignee ? String(d.assignee.id) : "";
  assignee.addEventListener("change", () => save({ assigneeId: assignee.value ? Number(assignee.value) : null }, assignee.value ? "Assigned to " + assignee.selectedOptions[0].text : "Unassigned"));
  const fu = h("input", { class: "input", type: "date", id: "c-fu", value: d.followUpAt || "" });
  fu.addEventListener("change", () => save({ followUpAt: fu.value || null }, fu.value ? "Follow-up set for " + dateLabel(fu.value) : "Follow-up cleared"));
  const quick = (label, days) => h("button", { class: "btn sm", type: "button", onclick: () => { const t = new Date(); t.setDate(t.getDate() + days); save({ followUpAt: localDate(t) }, "Follow-up set for " + dateLabel(localDate(t))); } }, label);
  const manage = h("article", { class: "card" }, h("header", null, h("h3", { text: "Manage" })), h("div", { class: "pad ctl" },
    h("div", null, h("label", { for: "c-status" }, "Status"), status),
    h("div", { class: "form-grid" },
      h("div", null, h("label", { for: "c-priority" }, "Priority"), priority),
      h("div", null, h("label", { for: "c-assignee" }, "Assigned to"), assignee)),
    h("div", null, h("label", { for: "c-fu" }, "Follow up on"), fu,
      h("div", { class: "contact-actions" }, quick("Tomorrow", 1), quick("In 3 days", 3), quick("Next week", 7),
        d.followUpAt ? h("button", { class: "btn sm ghost", type: "button", onclick: () => save({ followUpAt: null }, "Follow-up cleared") }, "Clear") : null)),
    h("div", null, h("label", { for: "c-tag" }, "Tags"), tagEditor(d))));

  const kv = [["Email", h("a", { href: "mailto:" + d.email, text: d.email })], ["Phone", d.phone ? h("a", { href: "tel:" + phoneDigits, text: d.phone }) : "—"],
    ["Service", serviceLabel(d.service)], ["Plan", d.plan ? planLabel(d.plan) : "—"], ["Language", state.meta.langs[d.lang] || d.lang],
    ["Sent from", d.sourcePage || "—"], ["Came from", d.referrer || "Direct or unknown"]];
  if (d.utm && (d.utm.source || d.utm.medium || d.utm.campaign)) kv.push(["Campaign", [d.utm.source, d.utm.medium, d.utm.campaign].filter(Boolean).join(" / ")]);
  kv.push(["Received", fullDate(d.createdAt)], ["IP address", d.ip || "—"], ["Browser", d.userAgent ? shortUa(d.userAgent) : "—"]);
  const details = h("article", { class: "card" }, h("header", null, h("h3", { text: "Details" })), h("div", { class: "pad" },
    h("dl", { class: "kv" }, kv.map(([k, v]) => [h("dt", { text: k }), h("dd", null, v)]))));
  const related = d.related.length ? h("article", { class: "card" }, h("header", null, h("h3", { text: "Earlier from this email" })), h("div", { class: "pad" },
    h("ul", { class: "related" }, d.related.map((x) => h("li", null, h("a", { href: "#/inquiries/all/" + x.id }, h("span", { class: "ref", text: x.ref }), statusPill(x.status), h("span", { text: serviceLabel(x.service) }), h("span", { class: "grow" }), h("small", { text: ago(x.createdAt) }))))))) : null;

  clear(L.detail, head, h("div", { class: "dbody" }, spamNote, who, actions,
    h("div", { class: "grid2" }, h("div", null, message, emails, work), h("div", null, manage, details, related))));
  if (keepComposer) L.detail.scrollTop = scroll; else L.detail.scrollTop = 0;
  if (keep && document.activeElement === document.body) noteBody.focus();
}

function shortUa(ua) {
  const os = /Windows/.test(ua) ? "Windows" : /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return [br, os].filter(Boolean).join(" on ") || ua.slice(0, 60);
}

function tagEditor(d) {
  const input = h("input", { id: "c-tag", list: "tag-opts", placeholder: d.tags.length ? "" : "Add a tag", maxlength: "32", "aria-label": "Add a tag" });
  const wrap = h("div", { class: "tag-edit", onclick: () => input.focus() },
    d.tags.map((t) => h("span", { class: "tag" }, t, h("button", { type: "button", "aria-label": "Remove tag " + t, onclick: (e) => { e.stopPropagation(); save({ tags: d.tags.filter((x) => x !== t) }); } }, icon("x", "sm")))),
    input, h("datalist", { id: "tag-opts" }, state.tags.filter((t) => !d.tags.includes(t.tag)).map((t) => h("option", { value: t.tag }))));
  const commit = () => { const v = input.value.replace(/,/g, "").trim(); if (v && !d.tags.some((x) => x.toLowerCase() === v.toLowerCase())) save({ tags: [...d.tags, v] }); input.value = ""; };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); }
    else if (e.key === "Backspace" && !input.value && d.tags.length) save({ tags: d.tags.slice(0, -1) });
  });
  input.addEventListener("change", () => { if (state.tags.some((t) => t.tag === input.value)) commit(); });
  return wrap;
}

function noteEl(n) {
  const mine = n.user && n.user.id === state.user.id;
  const canEdit = mine || isAdmin();
  const body = h("p", { class: "nb", text: n.body });
  const li = h("li", null, avatar(n.user ? n.user.name : "?", "sm"), h("div", null,
    h("div", { class: "nh" }, h("b", { text: n.user ? n.user.name : "Former team member" }), h("time", { title: fullDate(n.createdAt), text: ago(n.createdAt) + (n.updatedAt ? " · edited" : "") }),
      canEdit ? h("span", { class: "acts" },
        h("button", { class: "btn sm ghost icon", type: "button", "aria-label": "Edit note", onclick: () => editNote(n, li, body) }, icon("edit", "sm")),
        h("button", { class: "btn sm ghost icon", type: "button", "aria-label": "Delete note", onclick: () => deleteNote(n) }, icon("trash", "sm"))) : null),
    body));
  return li;
}
function editNote(n, li, body) {
  const ta = h("textarea", { class: "textarea", rows: 3, maxlength: "5000", "aria-label": "Edit note" }); ta.value = n.body;
  const form = h("form", { onsubmit: async (e) => {
    e.preventDefault();
    try { await patch("/notes/" + n.id, { body: ta.value }); loadDetail(detail.id, { quiet: true }); }
    catch (ex) { errorToast(ex, "Couldn't save the note"); }
  } }, ta, h("div", { class: "row-end" }, h("span"), h("span", null,
    h("button", { class: "btn sm ghost", type: "button", onclick: () => paintDetail(true) }, "Cancel"), " ",
    h("button", { class: "btn sm primary", type: "submit" }, "Save"))));
  body.replaceWith(form); ta.focus();
}
async function deleteNote(n) {
  if (!(await confirmBox("Delete this note?", "This can't be undone.", { ok: "Delete", danger: true }))) return;
  try { await del("/notes/" + n.id); loadDetail(detail.id, { quiet: true }); refreshList({ quiet: true }); }
  catch (e) { errorToast(e); }
}

function eventEl(e) {
  const by = e.user ? e.user.name : null;
  const B = (t) => h("b", { text: t });
  const st = (id) => statusOf(id).label;
  let ic = "dot", parts, bad = false;
  const d = e.data || {};
  switch (e.type) {
    case "received": ic = "inbox_in"; parts = ["Received from the website", d.spam ? " and flagged as possible spam" + (d.reason ? " (" + d.reason.toLowerCase() + ")" : "") : ""]; break;
    case "status": ic = "flag"; parts = [B(by || "Someone"), " changed the status from ", B(st(d.from)), " to ", B(st(d.to))]; break;
    case "priority": ic = "flag"; parts = [B(by || "Someone"), " set the priority to ", B((state.meta.priorities.find((p) => p.id === d.to) || {}).label || d.to)]; break;
    case "assigned": ic = "user"; parts = d.to ? [B(by || "Someone"), " assigned this to ", B(d.to.name)] : [B(by || "Someone"), " removed the assignee"]; break;
    case "followup": ic = "calendar"; parts = d.date ? [B(by || "Someone"), " set a follow-up for ", B(dateLabel(d.date))] : [B(by || "Someone"), " cleared the follow-up"]; break;
    case "archived": ic = "archive"; parts = [B(by || "Someone"), " archived this"]; break;
    case "unarchived": ic = "undo"; parts = [B(by || "Someone"), " moved this back to the inbox"]; break;
    case "spam": ic = "spam"; parts = [B(by || "Someone"), " marked this as spam"]; break;
    case "not_spam": ic = "check"; parts = [B(by || "Someone"), " marked this as not spam"]; break;
    case "tags": ic = "tag"; parts = [B(by || "Someone"), (d.added && d.added.length ? " added " + d.added.join(", ") : ""), (d.added && d.added.length && d.removed && d.removed.length ? " and" : ""), (d.removed && d.removed.length ? " removed " + d.removed.join(", ") : "")]; break;
    case "notified": ic = "bell"; parts = [d.channel === "email" ? `Email alert sent to the team (${d.to} ${d.to === 1 ? "address" : "addresses"})` : "Chat alert sent"]; break;
    case "replied": ic = "reply"; parts = [B(by || "Someone"), " emailed the customer: ", B(d.subject || "")]; break;
    case "autoreply": ic = "mail"; parts = ["Confirmation email sent to the customer"]; break;
    case "notify_failed": ic = "spam"; bad = true; parts = [`${d.channel === "confirmation" ? "Confirmation email" : d.channel === "reply" ? "Reply" : d.channel === "webhook" ? "Chat alert" : "Email alert"} failed: ${d.error || "unknown error"}`]; break;
    default: parts = [e.type];
  }
  return h("li", { class: bad ? "bad" : "" }, icon(ic, "sm"), h("span", null, parts), h("time", { title: fullDate(e.createdAt), text: ago(e.createdAt) }));
}

async function archive() {
  const [, next] = neighbors();
  const id = detail.id;
  const ok = await save({ archived: true });
  if (!ok) return;
  toast("Archived", { action: { label: "Undo", run: () => patch("/inquiries/" + id, { archived: false }).then(afterChange).catch(errorToast) } });
  if (view !== "archived" && view !== "all") go(next ? listHash(next.id) : "#/inquiries/" + view + qs(), true);
}
async function removeIt() {
  if (!(await confirmBox("Delete this inquiry?", `${detail.ref} from ${detail.name} will be removed for good, with its notes and history. Archive it instead if you might need it later.`, { ok: "Delete", danger: true }))) return;
  try { await del("/inquiries/" + detail.id); toast("Deleted"); go("#/inquiries/" + view + qs(), true); refreshList({ quiet: true }); loadCounts(); }
  catch (e) { errorToast(e); }
}

/* keyboard: J / K to move, E to archive, Escape to close on small screens */
addEventListener("keydown", (e) => {
  if (!L || !document.body.contains(L.split) || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.querySelector("dialog[open]")) return;
  const k = e.key.toLowerCase();
  if (k === "j" || k === "k") {
    if (!data || !data.items.length) return;
    const i = data.items.findIndex((x) => String(x.id) === String(openId));
    const n = i < 0 ? 0 : Math.min(Math.max(i + (k === "j" ? 1 : -1), 0), data.items.length - 1);
    if (data.items[n] && String(data.items[n].id) !== String(openId)) { e.preventDefault(); go(listHash(data.items[n].id), true); }
  } else if (k === "e" && detail && !detail.archived) { e.preventDefault(); archive(); }
  else if (e.key === "Escape" && openId) { go("#/inquiries/" + view + qs()); }
});
