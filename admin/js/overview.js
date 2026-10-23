/* Overview: this week's numbers, a 14-day chart, the pipeline, and what needs attention. */
import { h, clear, icon, ago, localDate, dateLabel } from "./dom.js";
import { get } from "./api.js";
import { state, setTitle, statusPill, serviceLabel, loadCounts } from "./app.js";

const NS = "http://www.w3.org/2000/svg";
const s = (tag, attrs, ...kids) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, String(v));
  kids.forEach((k) => el.appendChild(typeof k === "string" ? document.createTextNode(k) : k));
  return el;
};

let seq = 0;
export async function renderOverview(shell, { quiet } = {}) {
  const my = ++seq;
  setTitle("Overview");
  clear(shell.tools, h("a", { class: "btn primary", href: "#/inquiries/inbox" }, icon("inbox", "sm"), "Open inbox"));
  if (!quiet) clear(shell.content, h("div", { class: "ov" }, h("div", { class: "kpis" }, [1, 2, 3, 4].map(() => h("div", { class: "card skel" })))));
  let counts, unread, follow;
  try {
    [counts, unread, follow] = await Promise.all([
      loadCounts(),
      get("/inquiries", { view: "unread", per: 6 }),
      get("/inquiries", { view: "followup", per: 6, sort: "followup" })
    ]);
  } catch (e) {
    if (my === seq) clear(shell.content, h("div", { class: "empty" }, h("h3", { text: "Couldn't load the overview" }), h("p", { text: e.message })));
    return;
  }
  if (my !== seq || !counts) return;
  const { stats, byStatus, byService, recent, views } = counts;

  const kpi = (label, n, sub, href) => h("a", { class: "card kpi", href, style: { color: "inherit", textDecoration: "none" } }, h("span", { text: label }), h("b", { text: n.toLocaleString() }), h("small", { text: sub }));
  const kpis = h("div", { class: "kpis" },
    kpi("New today", stats.today, views.unread ? `${views.unread} unread in total` : "Nothing unread", "#/inquiries/unread"),
    kpi("Last 7 days", stats.week, "Inquiries received", "#/inquiries/all"),
    kpi("Last 30 days", stats.month, "Inquiries received", "#/inquiries/all"),
    kpi("Won this month", stats.wonThisMonth, `${views.inbox} still open`, "#/inquiries/all?status=won"));

  /* 14-day chart, bucketed by the viewer's own calendar days */
  const days = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({ key: localDate(d), d, n: 0 }); }
  const idx = Object.fromEntries(days.map((x, i) => [x.key, i]));
  for (const t of recent) { const k = localDate(new Date(t)); if (k in idx) days[idx[k]].n++; }
  const max = Math.max(1, ...days.map((x) => x.n));
  const W = 700, H = 190, top = 18, bottom = 26, gap = 10, bw = (W - gap * 13) / 14;
  const svg = s("svg", { class: "chart", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Inquiries per day over the last 14 days" },
    s("line", { x1: 0, x2: W, y1: H - bottom + 0.5, y2: H - bottom + 0.5 }));
  days.forEach((x, i) => {
    const bh = x.n ? Math.max(4, ((H - top - bottom) * x.n) / max) : 2;
    const xPos = i * (bw + gap);
    const bar = s("rect", { class: "bar" + (x.n ? "" : " zero"), x: xPos, y: H - bottom - bh, width: bw, height: bh, rx: 4 });
    bar.appendChild(s("title", {}, `${dateLabel(x.key)}: ${x.n} ${x.n === 1 ? "inquiry" : "inquiries"}`));
    svg.appendChild(bar);
    if (x.n) svg.appendChild(s("text", { class: "val", x: xPos + bw / 2, y: H - bottom - bh - 5, "text-anchor": "middle" }, String(x.n)));
    if (i % 2 === 1 || i === 13) svg.appendChild(s("text", { x: xPos + bw / 2, y: H - 8, "text-anchor": "middle" }, i === 13 ? "Today" : x.d.toLocaleDateString("en-US", { month: "short", day: "numeric" })));
  });
  const chart = h("article", { class: "card" }, h("header", null, h("h3", { text: "Last 14 days" })), h("div", { class: "pad" }, svg));

  const totalOpen = Math.max(1, ...Object.values(byStatus));
  const pipe = h("article", { class: "card" }, h("header", null, h("h3", { text: "Pipeline" })), h("div", { class: "pad" },
    h("ul", { class: "pipe" }, state.meta.statuses.map((st) => h("li", null,
      h("a", { href: "#/inquiries/all?status=" + st.id, text: st.label }),
      h("div", { class: "track" }, h("div", { class: "fill", style: { width: (100 * (byStatus[st.id] || 0)) / totalOpen + "%", "--c": `var(--s-${st.id})` } })),
      h("b", { text: String(byStatus[st.id] || 0) }))))));

  const svcMax = Math.max(1, ...byService.map((x) => x.n));
  const services = h("article", { class: "card" }, h("header", null, h("h3", { text: "What people ask for (30 days)" })), h("div", { class: "pad" },
    byService.length ? h("ul", { class: "pipe" }, byService.map((x) => h("li", null, h("a", { href: "#/inquiries/all?service=" + (x.service || ""), text: serviceLabel(x.service) }),
      h("div", { class: "track" }, h("div", { class: "fill", style: { width: (100 * x.n) / svcMax + "%", "--c": "var(--accent)" } })), h("b", { text: String(x.n) }))))
      : h("p", { class: "muted", text: "No inquiries in the last 30 days yet." })));

  const mini = (title, list, emptyText, href, sub) => h("article", { class: "card" },
    h("header", null, h("h3", { text: title }), list.total ? h("a", { href, class: "btn sm ghost" }, "See all " + list.total) : null),
    h("div", { class: "pad" }, list.items.length ? h("ul", { class: "mini" }, list.items.map((x) => h("li", null, h("a", { href: href.split("?")[0] + "/" + x.id },
      statusPill(x.status), h("span", { class: "t", text: x.name + (x.company ? " · " + x.company : "") }), h("small", { text: sub(x) })))))
      : h("p", { class: "muted", text: emptyText })));

  clear(shell.content, h("div", { class: "ov" }, kpis,
    h("div", { class: "ov-grid" },
      h("div", null, chart, mini("Unread", unread, "You've read everything. Nice.", "#/inquiries/unread", (x) => ago(x.createdAt))),
      h("div", null, pipe, services, mini("Follow-ups due", follow, "No follow-ups due today.", "#/inquiries/followup", (x) => dateLabel(x.followUpAt))))));
}
