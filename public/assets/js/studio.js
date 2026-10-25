/* Design Studio: eight steps of choices, a live sample website in an iframe (pages/studio-preview.html),
   a plan recommendation, and a Website Design Requirements Document to download, print, copy or send to /api/inquiries.
   Load after i18n.js. Choices are kept in this browser (localStorage) so visitors can come back to them. */
(function () {
  "use strict";
  var root = document.getElementById("studio");
  if (!root) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var me = document.currentScript;
  var lang = (window.I18N && I18N.lang) || "en";
  /* every visible string goes through here: English and Spanish are written inline, Chinese comes from the dictionary */
  var t = function (en, es) { return window.I18N && I18N.pick ? I18N.pick(en, es) : (lang === "es" ? es : en); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var openedAt = Date.now();

  /* ---------- design data ---------- */
  var PALS = {
    ocean: { pri: "#1d4ed8", acc: "#f59e0b", tone: "cool" }, forest: { pri: "#166534", acc: "#e9c46a", tone: "warm" }, terra: { pri: "#c2410c", acc: "#1e3a5f", tone: "warm" },
    gold: { pri: "#c9a227", acc: "#0f172a", tone: "neutral" }, coral: { pri: "#ff5a5f", acc: "#ffd166", tone: "warm" }, signal: { pri: "#111827", acc: "#ff6b00", tone: "neutral" },
    violet: { pri: "#7c3aed", acc: "#34d399", tone: "cool" }, sage: { pri: "#5f7a61", acc: "#d4a373", tone: "warm" }
  };
  var TONES = {
    light: { warm: ["#faf7f2", "#f1ebe2", "#1f1a14", "#6f665b"], cool: ["#f6f8fb", "#eaeef4", "#111827", "#5b6472"], neutral: ["#ffffff", "#f3f3f4", "#18181b", "#6b6b72"] },
    dark: { warm: ["#17130f", "#231d17", "#f6efe6", "#b3a796"], cool: ["#0c111b", "#161e2c", "#eef2f8", "#9aa5b8"], neutral: ["#0b0b0c", "#18181b", "#f4f4f5", "#a1a1aa"] }
  };
  var FONTS = {
    modern: { h: "Inter V", b: "Inter V", w: 750, st: "100%", ls: "-.035em", hn: "Inter", bn: "Inter" },
    grotesk: { h: "Bricolage V", b: "Inter V", w: 800, st: "90%", ls: "-.04em", hn: "Bricolage Grotesque", bn: "Inter" },
    geometric: { h: "Syne V", b: "Manrope V", w: 800, st: "100%", ls: "-.03em", hn: "Syne", bn: "Manrope" },
    editorial: { h: "Fraunces V", b: "Inter V", w: 600, st: "100%", ls: "-.025em", hn: "Fraunces", bn: "Inter" },
    classic: { h: "Cormorant V", b: "Manrope V", w: 500, st: "100%", ls: "-.01em", hn: "Cormorant Garamond", bn: "Manrope" },
    industrial: { h: "Archivo V", b: "Inter V", w: 800, st: "118%", ls: "-.02em", hn: "Archivo Expanded", bn: "Inter" },
    display: { h: "Anton", b: "Inter V", w: 400, st: "100%", ls: "0em", hn: "Anton", bn: "Inter" },
    rounded: { h: "Unbounded V", b: "Manrope V", w: 700, st: "100%", ls: "-.035em", hn: "Unbounded", bn: "Manrope" }
  };
  var STYLES = {
    minimal: { corners: "soft", buttons: "rounded", cards: "outline", deco: "none" }, bold: { corners: "sharp", buttons: "square", cards: "flat", deco: "lines", hsize: "statement" },
    elegant: { corners: "sharp", buttons: "pill", cards: "flat", deco: "none", hsize: "calm" }, playful: { corners: "round", buttons: "pill", cards: "shadow", deco: "blobs" },
    technical: { corners: "sharp", buttons: "square", cards: "outline", deco: "lines" }, premium: { corners: "round", buttons: "pill", cards: "glass", deco: "blobs" }
  };
  /* when a visitor hasn't chosen yet, an industry suggests a palette, fonts and goal */
  var SUGGEST = {
    mfg: { palette: "ocean", font: "industrial", goal: "leads" }, apparel: { palette: "terra", font: "editorial", goal: "leads" }, trading: { palette: "signal", font: "modern", goal: "leads" },
    outdoor: { palette: "forest", font: "grotesk", goal: "shop" }, pet: { palette: "coral", font: "rounded", goal: "shop" }, beauty: { palette: "sage", font: "classic", goal: "shop" }, services: { palette: "violet", font: "modern", goal: "leads" }
  };
  var NAMES = { mfg: "Northfield Machining", apparel: "Loom & Thread", trading: "Harbor Trade Co.", outdoor: "Summit Gear", pet: "Happy Tails", beauty: "Lumen Skin", services: "Clearpath Advisory" };
  var DEF = { name: "", tagline: "", industry: "mfg", goal: "leads", hero: "split", visual: "product", nav: "bar", cols: "3", density: "balanced", mode: "light", palette: "ocean", pri: "#1d4ed8", acc: "#f59e0b",
    font: "industrial", hsize: "bold", hcase: "normal", bsize: "16", style: "minimal", corners: "soft", buttons: "rounded", cards: "outline", deco: "none",
    enter: "rise", hover: "lift", scroll: ["sticky", "counters"], speed: "normal", pages: ["about", "products", "contact"], subs: 12, langs: ["en"], feats: ["form"], geo: "basic" };
  var MULTI = ["scroll", "pages", "langs", "feats"];
  var KEY = "jw-studio-v1";
  var S = JSON.parse(JSON.stringify(DEF)), step = 1, touched = {};
  S.langs = [lang];
  try { var saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved && saved.S) { for (var k in DEF) if (saved.S[k] !== undefined) S[k] = saved.S[k]; step = Math.min(8, Math.max(1, saved.step || 1)); touched = saved.touched || {}; } } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ S: S, step: step, touched: touched })); } catch (e) {} }

  /* ---------- color math ---------- */
  function rgb(hex) { var h = String(hex).replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); var n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function lum(hex) { return rgb(hex).map(function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }).reduce(function (s, c, i) { return s + c * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(hex, to, amt) { var a = rgb(hex), b = rgb(to); return "#" + a.map(function (c, i) { return ("0" + Math.round(c + (b[i] - c) * amt).toString(16)).slice(-2); }).join(""); }
  function onColor(hex) { return ratio(hex, "#ffffff") >= ratio(hex, "#111111") ? "#ffffff" : "#111111"; }
  function colors() {
    var tone = (PALS[S.palette] || PALS.ocean).tone, base = TONES[S.mode === "dark" ? "dark" : "light"][tone];
    var pri = S.pri, i = 0;
    // a brand color that disappears against the background is lifted (dark mode) or deepened (light mode) until it reads
    while (ratio(pri, base[0]) < 2.4 && i++ < 12) pri = mix(pri, S.mode === "dark" ? "#ffffff" : "#000000", 0.12);
    var acc = S.acc; i = 0;
    while (S.mode === "dark" && ratio(acc, base[0]) < 1.8 && i++ < 12) acc = mix(acc, S.mode === "dark" ? "#ffffff" : "#000000", 0.12);
    return { bg: base[0], sf: base[1], ink: base[2], mut: base[3], pri: pri, on: onColor(pri), acc: acc, adjusted: pri.toLowerCase() !== S.pri.toLowerCase() };
  }
  function vars() {
    var c = colors(), f = FONTS[S.font] || FONTS.modern;
    return {
      "--bg": c.bg, "--sf": c.sf, "--ink": c.ink, "--mut": c.mut, "--line": S.mode === "dark" ? "rgba(255,255,255,.13)" : "rgba(0,0,0,.12)", "--pri": c.pri, "--on": c.on, "--acc": c.acc,
      "--r": { sharp: "0px", soft: "10px", round: "22px" }[S.corners], "--rb": { square: "0px", rounded: "10px", pill: "999px" }[S.buttons],
      "--hf": '"' + f.h + '"', "--bf": '"' + f.b + '"', "--hw": String(f.w), "--hst": f.st, "--hls": f.ls,
      "--hsc": { calm: ".82", bold: "1", statement: "1.22" }[S.hsize], "--bs": S.bsize + "px", "--pad": { compact: "64px", balanced: "96px", airy: "136px" }[S.density],
      "--spd": { calm: ".65", normal: "1", lively: "1.6" }[S.speed]
    };
  }

  /* ---------- plan recommendation (matches the plans on the Website Development page) ---------- */
  var PLAN = [{ en: "Basic", es: "Básico", p: "$200", key: "basic" }, { en: "Standard", es: "Estándar", p: "$500", key: "standard" }, { en: "Premium", es: "Premium", p: "$800", key: "premium" }, { en: "Premium + custom quote", es: "Premium + cotización a medida", p: "$800+", key: "premium" }];
  function plan() {
    var main = 1 + S.pages.length, subs = +S.subs, lvl = 0, why = [], add = [];
    var bump = function (l, en, es) { if (l > 0) why.push({ l: l, en: en, es: es }); if (l > lvl) lvl = l; };
    bump(main <= 6 ? 0 : main <= 11 ? 1 : main <= 15 ? 2 : 3, main + " main pages (Basic includes up to 6, Standard 11, Premium 15)", main + " páginas principales (Básico incluye hasta 6, Estándar 11, Premium 15)");
    bump(subs <= 15 ? 0 : subs <= 40 ? 1 : subs <= 75 ? 2 : 3, subs + " subpages (Basic includes up to 15, Standard 40, Premium 75)", subs + " subpáginas (Básico incluye hasta 15, Estándar 40, Premium 75)");
    var F = S.feats;
    if (F.indexOf("form") > -1 || F.indexOf("rfq") > -1) bump(1, "Inquiry forms are included from Standard", "Los formularios de consulta se incluyen desde Estándar");
    if (F.indexOf("cms") > -1 || F.indexOf("filters") > -1 || S.pages.indexOf("news") > -1) bump(1, "A product and news dashboard is included from Standard", "El panel de productos y noticias se incluye desde Estándar");
    if (S.langs.length > 1) bump(1, S.langs.length + " languages: multilingual sites start at Standard", S.langs.length + " idiomas: los sitios multilingües empiezan en Estándar");
    if (F.indexOf("analytics") > -1) bump(1, "Visitor analytics are included from Standard", "La analítica de visitas se incluye desde Estándar");
    if (S.geo === "standard") bump(1, "Standard GEO, with articles on general platforms", "GEO estándar, con artículos en plataformas generales");
    if (S.geo === "advanced") bump(2, "Advanced GEO with keyword analysis is a Premium feature", "El GEO avanzado con análisis de palabras clave es de Premium");
    if (F.indexOf("push") > -1) bump(2, "Instant email alerts are part of Premium", "Las alertas por correo al instante son parte de Premium");
    [["shop", "Online checkout", "Pago en línea"], ["config", "Product configurator", "Configurador de productos"], ["booking", "Online booking", "Reservas en línea"]].forEach(function (x) { if (F.indexOf(x[0]) > -1) add.push(x); });
    if (!why.length) why.push({ l: 0, en: "Up to 6 main pages and 15 subpages, no advanced features: a digital business card site", es: "Hasta 6 páginas principales y 15 subpáginas, sin funciones avanzadas: un sitio tipo tarjeta de presentación digital" });
    return { lvl: lvl, plan: PLAN[lvl], main: main, subs: subs, why: why.filter(function (w) { return w.l === lvl || lvl === 0; }).concat(why.filter(function (w) { return w.l !== lvl && lvl !== 0; })), add: add };
  }

  /* ---------- labels come from the buttons themselves, so they're always in the page's language ---------- */
  function lbl(key, v) { var b = $('[data-key="' + key + '"] [data-v="' + v + '"] b, [data-multi="' + key + '"] [data-v="' + v + '"] b', root); return b ? b.textContent.trim() : v; }
  function lbls(key, arr) { return arr.map(function (v) { return lbl(key, v); }); }
  function bizName() { return S.name.trim() || NAMES[S.industry]; }

  /* ---------- preview ---------- */
  var frame = $("[data-frame]", root), device = $("[data-device]", root), view = $("[data-view]", root), ready = false, queued = false, dev = "desktop";
  try { frame.src = new URL("../../pages/studio-preview.html", me && me.src ? me.src : location.href).href; } catch (e) { frame.src = "pages/studio-preview.html"; }
  frame.addEventListener("load", function () { ready = true; push(); });
  // the site's round cursor can't follow the mouse inside the preview, so it steps aside there
  frame.addEventListener("mouseenter", function () { var c = $(".cursor"); if (c) c.classList.remove("on"); });
  function payload() {
    var o = JSON.parse(JSON.stringify(S)), obj = function (a) { var r = {}; a.forEach(function (x) { r[x] = true; }); return r; };
    o.feats = obj(S.feats); o.pages = obj(S.pages); o.scroll = obj(S.scroll); o.lang = lang; o.vars = vars(); o.name = bizName();
    return o;
  }
  function push() {
    if (!ready || queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; try { frame.contentWindow.StudioPreview.render(payload()); } catch (e) {} });
  }
  var DEV = { desktop: [1280, 0], tablet: [820, 1180], phone: [390, 844] };
  function fit() {
    var W = view.clientWidth - 16, H = view.clientHeight - 6, d = DEV[dev], border = dev === "desktop" ? 0 : 20, chrome = dev === "phone" ? 28 : 34;
    var s = Math.min(1, W / (d[0] + border));
    if (d[1]) s = Math.min(s, H / (d[1] + chrome + border));
    var h = d[1] ? d[1] : Math.max(400, H / s - chrome - border);
    device.className = "ds-device " + dev;
    device.style.width = d[0] + border + "px";
    frame.style.height = h + "px";
    device.style.transform = "scale(" + s + ")";
    device.style.marginBottom = -(h + chrome + border) * (1 - s) + "px";
  }
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe(view); else addEventListener("resize", fit);
  $$("[data-dev]", root).forEach(function (b) { b.addEventListener("click", function () { dev = b.dataset.dev; $$("[data-dev]", root).forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); }); fit(); }); });
  $$("[data-replay]", root).forEach(function (b) { b.addEventListener("click", function () { try { frame.contentWindow.StudioPreview.replay(); } catch (e) {} }); });

  /* ---------- controls ---------- */
  function sync() {
    $$("[data-key]", root).forEach(function (g) { var k = g.dataset.key; $$("button[data-v]", g).forEach(function (b) { b.setAttribute("aria-checked", String(String(S[k]) === b.dataset.v)); }); });
    $$("[data-multi]", root).forEach(function (g) { var k = g.dataset.multi; $$("button[data-v]", g).forEach(function (b) { b.setAttribute("aria-pressed", String(S[k].indexOf(b.dataset.v) > -1)); }); });
    $$("[data-text]", root).forEach(function (i) { if (document.activeElement !== i) i.value = S[i.dataset.text]; });
    $$("[data-color]", root).forEach(function (i) { i.value = S[i.dataset.color]; $('[data-hex="' + i.dataset.color + '"]', root).textContent = S[i.dataset.color].toUpperCase(); });
    $$("[data-range]", root).forEach(function (i) { i.value = S[i.dataset.range]; $('[data-out="' + i.dataset.range + '"]', root).textContent = S[i.dataset.range]; });
    $('[data-text="name"]', root).placeholder = t("e.g. ", "p. ej. ") + NAMES[S.industry];
    var c = colors(), r1 = ratio(c.on, c.pri), r2 = ratio(c.ink, c.bg), mark = function (r) { return r >= 4.5 ? '<span class="ok">✓ AA</span>' : '<span class="warn">' + t("low", "bajo") + "</span>"; };
    $("[data-contrast]", root).innerHTML = t("Contrast: button text ", "Contraste: texto del botón ") + "<b>" + r1.toFixed(1) + ":1</b> " + mark(r1) + " · " + t("body text ", "texto ") + "<b>" + r2.toFixed(1) + ":1</b> " + mark(r2) + (c.adjusted ? "<br>" + t("Your primary color is adjusted to ", "Tu color principal se ajusta a ") + "<b>" + c.pri.toUpperCase() + "</b>" + t(" on this background so it stays visible.", " sobre este fondo para que siga siendo visible.") : "");
    var P = plan(), u = $("[data-url]", root);
    u.textContent = "www." + (bizName().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "") || "yourbrand") + ".com";
    $("[data-planchip]", root).innerHTML = t("Recommended plan: ", "Plan recomendado: ") + "<b>" + t(P.plan.en, P.plan.es) + " · " + P.plan.p + "</b>";
    $("[data-planbox]", root).innerHTML = '<p class="pk">' + t("Recommended plan", "Plan recomendado") + '</p><p class="pn"><span>' + t(P.plan.en, P.plan.es) + "</span><span>" + P.plan.p + '</span></p><p class="cnt"><span><b>' + P.main + "</b> " + t("main pages", "páginas principales") + "</span><span><b>" + P.subs + "</b> " + t("subpages", "subpáginas") + "</span><span><b>" + S.langs.length + "</b> " + t(S.langs.length === 1 ? "language" : "languages", S.langs.length === 1 ? "idioma" : "idiomas") + "</span></p><ul>" + P.why.slice(0, 4).map(function (w) { return "<li>" + t(w.en, w.es) + "</li>"; }).join("") + (P.add.length ? "<li>" + t("Quoted separately: ", "Se cotiza aparte: ") + P.add.map(function (a) { return t(a[1], a[2]); }).join(", ") + "</li>" : "") + '</ul><a href="website-development.html#plans">' + t("Compare the plans", "Compara los planes") + " →</a>";
    if (step === 8) review();
    save();
    push();
  }
  function set(k, v) {
    S[k] = v; touched[k] = true;
    if (k === "industry") ["palette", "font", "goal"].forEach(function (x) { if (!touched[x]) { S[x] = SUGGEST[v][x]; if (x === "palette") { S.pri = PALS[S.palette].pri; S.acc = PALS[S.palette].acc; } } });
    if (k === "palette") { S.pri = PALS[v].pri; S.acc = PALS[v].acc; touched.pri = touched.acc = false; }
    if (k === "style") { var st = STYLES[v]; for (var x in st) S[x] = st[x]; }
    if (k === "goal" || k === "industry") {
      if (S.goal === "shop" && S.industry !== "services") { if (S.feats.indexOf("shop") < 0) S.feats.push("shop"); }
      else S.feats = S.feats.filter(function (f) { return f !== "shop"; });
    }
    sync();
    if (k === "enter" || k === "speed") setTimeout(function () { try { frame.contentWindow.StudioPreview.replay(); } catch (e) {} }, 60);
  }
  /* after a change, the preview scrolls to where that change shows */
  var FOCUS = { reviews: ".revs", form: ".form", rfq: ".form", map: ".map", newsletter: ".nl", config: ".cfg", filters: ".chips", catalog: ".cta", news: ".news", chat: ".ft", cols: ".grid", cards: ".grid", density: ".why", hover: ".grid", counters: ".stats", marquee: ".marq" };
  var TOP = ["industry", "goal", "hero", "visual", "nav", "mode", "palette", "font", "hsize", "hcase", "style", "corners", "buttons", "deco", "langs"];
  function focusPreview(k) {
    var sel = FOCUS[k] || (TOP.indexOf(k) > -1 ? "#site" : null);
    if (sel) setTimeout(function () { try { frame.contentWindow.StudioPreview.scrollTo(sel); } catch (e) {} }, 160);
  }
  root.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-v]");
    if (b) {
      var g = b.closest("[data-key],[data-multi]");
      if (g.dataset.key) { set(g.dataset.key, b.dataset.v); focusPreview(g.dataset.key); }
      else { var k = g.dataset.multi, a = S[k].slice(), i = a.indexOf(b.dataset.v); if (i > -1) a.splice(i, 1); else a.push(b.dataset.v); if (k === "langs" && !a.length) a = [lang]; set(k, a); if (i < 0) focusPreview(FOCUS[b.dataset.v] ? b.dataset.v : k); }
      return;
    }
    var go = e.target.closest("[data-go]"); if (go) return show(+go.dataset.go);
    if (e.target.closest("[data-next]")) return step === 8 ? openDoc() : show(step + 1);
    if (e.target.closest("[data-prev]")) return show(step - 1);
    if (e.target.closest("[data-make]")) return openDoc();
    if (e.target.closest("[data-reset]")) { if (window.confirm(t("Start over and clear all your choices?", "¿Empezar de nuevo y borrar todas tus decisiones?"))) { S = JSON.parse(JSON.stringify(DEF)); S.langs = [lang]; touched = {}; sync(); show(1); } }
  });
  $$("[data-text]", root).forEach(function (i) { i.addEventListener("input", function () { S[i.dataset.text] = i.value.slice(0, +i.maxLength || 60); sync(); }); });
  $$("[data-color]", root).forEach(function (i) { i.addEventListener("input", function () { S[i.dataset.color] = i.value; touched[i.dataset.color] = true; sync(); }); });
  $$("[data-range]", root).forEach(function (i) { i.addEventListener("input", function () { S[i.dataset.range] = +i.value; sync(); }); });

  /* ---------- steps ---------- */
  var steps = $$(".sstep", root), form = $(".ds-form", root);
  function show(n) {
    step = Math.max(1, Math.min(8, n));
    steps.forEach(function (f) { f.hidden = +f.dataset.step !== step; });
    $$(".ds-prog button", root).forEach(function (b) { var k = +b.dataset.go; if (k === step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); b.classList.toggle("done", k < step); });
    var cur = $('.ds-prog [aria-current="step"]', root); if (cur && cur.scrollIntoView) cur.parentNode.parentNode.scrollLeft = cur.offsetLeft - 40;
    $("[data-bar]", root).style.width = step / 8 * 100 + "%";
    $("[data-prev]", root).disabled = step === 1;
    var nx = $("[data-next]", root); nx.innerHTML = (step === 8 ? t("Create document", "Crear documento") : step === 7 ? t("Review", "Revisar") : t("Next", "Siguiente")) + " →";
    form.scrollTop = 0;
    if (innerWidth < 860) { var top = root.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 56); if (scrollY > top + 40) scrollTo({ top: top, behavior: "smooth" }); }
    if (step === 8) review();
    if (step === 6) setTimeout(function () { try { frame.contentWindow.StudioPreview.replay(); } catch (e) {} }, 150);
    save();
  }
  function review() {
    var c = colors(), f = FONTS[S.font], P = plan(), sw = function (h) { return '<i class="csw" style="background:' + h + '"></i>'; };
    var rows = [
      [1, t("Business", "Negocio"), esc(bizName()) + " · " + lbl("industry", S.industry) + " · " + lbl("goal", S.goal)],
      [2, t("Layout", "Diseño"), [lbl("hero", S.hero), lbl("visual", S.visual), lbl("nav", S.nav), S.cols + " " + t("per row", "por fila"), lbl("density", S.density)].join(" · ")],
      [3, t("Colors", "Colores"), sw(c.pri) + sw(c.acc) + sw(c.bg) + " " + lbl("palette", S.palette) + " · " + lbl("mode", S.mode)],
      [4, t("Fonts", "Tipografía"), f.hn + " / " + f.bn + " · " + lbl("hsize", S.hsize) + " · " + lbl("hcase", S.hcase)],
      [5, t("Style", "Estilo"), [lbl("style", S.style), lbl("corners", S.corners), lbl("buttons", S.buttons), lbl("cards", S.cards), lbl("deco", S.deco)].join(" · ")],
      [6, t("Motion", "Animación"), [lbl("enter", S.enter), lbl("hover", S.hover)].concat(lbls("scroll", S.scroll)).concat([lbl("speed", S.speed)]).join(" · ")],
      [7, t("Pages", "Páginas"), P.main + " " + t("main", "principales") + ", " + P.subs + " " + t("subpages", "subpáginas") + " · " + lbls("langs", S.langs).join(", ")],
      [7, t("Features", "Funciones"), lbls("feats", S.feats).join(", ") || "—"],
      [7, t("Plan", "Plan"), "<b>" + t(P.plan.en, P.plan.es) + " · " + P.plan.p + "</b>"]
    ];
    $("[data-review]", root).innerHTML = rows.map(function (r) { return "<div><dt>" + r[1] + "</dt><dd>" + r[2] + '</dd><button type="button" data-go="' + r[0] + '">' + t("Edit", "Editar") + "</button></div>"; }).join("");
  }

  /* ---------- the requirements document ---------- */
  var docEl = $("[data-doc]"), paper = $("[data-paper]"), ref = "", docText = "";
  function makeRef() { var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; }, c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = ""; for (var i = 0; i < 4; i++) r += c[Math.floor(Math.random() * c.length)]; return "DS-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + r; }
  var DESC = {
    hero: { split: ["Headline, text and buttons on the left; a large visual on the right.", "Título, texto y botones a la izquierda; una imagen grande a la derecha."], center: ["Centered headline and buttons, with a wide visual underneath.", "Título y botones centrados, con una imagen amplia debajo."], full: ["A full-width block in the primary brand color, with the headline over it.", "Un bloque de ancho completo en el color principal, con el título encima."], editorial: ["Magazine-style: very large headline, asymmetric grid, tall image.", "Estilo revista: título muy grande, retícula asimétrica e imagen vertical."] },
    visual: { product: ["One hero product on a tinted panel, with short proof points.", "Un producto principal sobre un panel de color, con datos clave."], scene: ["A collage of three products.", "Un collage de tres productos."], abstract: ["Abstract shapes in the brand colors instead of a photo.", "Formas abstractas en los colores de marca en lugar de una foto."], type: ["No image: the headline is the visual.", "Sin imagen: el título es el protagonista."] },
    nav: { bar: ["Logo on the left, menu and button on the right.", "Logo a la izquierda, menú y botón a la derecha."], center: ["Menu on the left, logo centered, button on the right.", "Menú a la izquierda, logo al centro, botón a la derecha."], minimal: ["Logo and a menu button; the menu opens on demand.", "Logo y un botón de menú que se abre al tocarlo."] }
  };
  /* the downloaded document loads the same fonts from Google Fonts, so it looks right outside this site */
  function gfName(n) { return n === "Archivo Expanded" ? "Archivo" : n; }
  function gfLink() {
    var f = FONTS[S.font], fam = [gfName(f.hn), gfName(f.bn)].filter(function (x, i, a) { return a.indexOf(x) === i; });
    var q = fam.map(function (n) { return "family=" + n.replace(/ /g, "+") + (n === "Anton" ? "" : n === "Archivo" ? ":wdth,wght@62..125,400..900" : n === "Cormorant Garamond" ? ":wght@400..700" : ":wght@400..800"); }).join("&");
    return '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + q + '&display=swap">';
  }
  function D(map, v) { var x = DESC[map][v]; return x ? t(x[0], x[1]) : ""; }
  function build() {
    var c = colors(), f = FONTS[S.font], P = plan(), V = vars(), name = bizName(), date = new Date().toLocaleDateString(lang === "es" ? "es-US" : lang === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric" });
    var n = 0, H = function (en, es) { n++; return '<h2><span>' + (n < 10 ? "0" : "") + n + "</span>" + t(en, es) + "</h2>"; };
    var tbl = function (rows) { return "<table>" + rows.map(function (r) { return "<tr><th>" + r[0] + "</th><td>" + r[1] + "</td></tr>"; }).join("") + "</table>"; };
    var sw = function (h) { return '<span class="csw" style="background:' + h + '"></span>'; };
    var roles = [[t("Background", "Fondo"), c.bg], [t("Surface", "Superficie"), c.sf], [t("Text", "Texto"), c.ink], [t("Muted text", "Texto secundario"), c.mut], [t("Primary", "Principal"), c.pri], [t("Button text", "Texto del botón"), c.on], [t("Accent", "Acento"), c.acc]];
    var feats = lbls("feats", S.feats.filter(function (x) { return ["shop", "config", "booking"].indexOf(x) < 0; }));
    var h = "";
    h += '<header class="d-top"><div><p class="d-k">' + t("Website Design Requirements Document", "Documento de requisitos de diseño web") + "</p><h1>" + esc(name) + '</h1><p style="color:#5d636d">' + esc(S.tagline || lbl("industry", S.industry)) + '</p></div><div class="d-meta">' + t("Reference", "Referencia") + " <b>" + ref + "</b><br>" + t("Date", "Fecha") + " <b>" + date + "</b><br>" + t("Prepared with", "Preparado con") + " <b>JIEWEITECH Design Studio</b></div></header>";
    h += H("Project overview", "Resumen del proyecto") + tbl([[t("Business name", "Nombre del negocio"), esc(name) + (S.name.trim() ? "" : " <em>(" + t("sample name", "nombre de ejemplo") + ")</em>")], [t("Industry", "Sector"), lbl("industry", S.industry)], [t("Main goal", "Objetivo principal"), lbl("goal", S.goal)], [t("Tagline", "Eslogan"), esc(S.tagline) || "—"]]);
    h += H("Layout and structure", "Diseño y estructura") + tbl([[t("Homepage hero", "Portada"), "<b>" + lbl("hero", S.hero) + "</b>" + (lang === "zh" ? "：" : ". ") + D("hero", S.hero)], [t("Hero visual", "Imagen principal"), "<b>" + lbl("visual", S.visual) + "</b>" + (lang === "zh" ? "：" : ". ") + D("visual", S.visual)], [t("Navigation", "Navegación"), "<b>" + lbl("nav", S.nav) + "</b>" + (lang === "zh" ? "：" : ". ") + D("nav", S.nav)], [t("Product grid", "Cuadrícula de productos"), S.cols + " " + t("products per row on desktop, 2 on tablets and phones", "productos por fila en escritorio, 2 en tabletas y teléfonos")], [t("Spacing", "Espaciado"), lbl("density", S.density) + " (" + V["--pad"] + " " + t("between sections", "entre secciones") + ")"]]);
    h += H("Color palette", "Paleta de colores") + "<p>" + lbl("palette", S.palette) + " · " + lbl("mode", S.mode) + "</p>" + '<div class="d-pal">' + roles.map(function (r) { return '<div><i style="background:' + r[1] + '"></i><span><b>' + r[0] + "</b>" + r[1].toUpperCase() + "</span></div>"; }).join("") + "</div>" +
      "<p>" + t("Contrast: button text ", "Contraste: texto del botón ") + ratio(c.on, c.pri).toFixed(1) + ":1, " + t("body text ", "texto ") + ratio(c.ink, c.bg).toFixed(1) + ":1 (" + t("WCAG AA needs 4.5:1 for normal text", "WCAG AA pide 4.5:1 para texto normal") + ")." + (c.adjusted ? " " + t("The chosen primary color " + S.pri.toUpperCase() + " is adjusted to " + c.pri.toUpperCase() + " on this background.", "El color principal elegido " + S.pri.toUpperCase() + " se ajusta a " + c.pri.toUpperCase() + " sobre este fondo.") : "") + "</p>";
    h += H("Typography", "Tipografía") + tbl([[t("Headings", "Títulos"), f.hn + " · " + t("weight", "peso") + " " + f.w + (S.hcase === "upper" ? " · " + t("uppercase", "mayúsculas") : "")], [t("Body text", "Texto"), f.bn + " · " + S.bsize + "px"], [t("Heading size", "Tamaño de títulos"), lbl("hsize", S.hsize)]]) +
      '<div class="d-sample" style="font-family:' + esc(V["--bf"] + ',"' + gfName(f.bn) + '",sans-serif') + '"><div style="font-family:' + esc(V["--hf"] + ',"' + gfName(f.hn) + '",sans-serif') + ";font-weight:" + f.w + ";font-stretch:" + f.st + ";letter-spacing:" + f.ls + ";font-size:30px;line-height:1.05" + (S.hcase === "upper" ? ";text-transform:uppercase" : "") + '">' + esc(name) + '</div><p style="margin-top:8px;font-size:' + S.bsize + 'px">' + t("The quick brown fox jumps over the lazy dog. 0123456789", "El veloz murciélago hindú comía feliz cardillo y kiwi. 0123456789") + "</p></div>";
    h += H("Visual style", "Estilo visual") + tbl([[t("Style direction", "Dirección de estilo"), lbl("style", S.style)], [t("Corners", "Esquinas"), lbl("corners", S.corners) + " (" + V["--r"] + ")"], [t("Buttons", "Botones"), lbl("buttons", S.buttons)], [t("Cards", "Tarjetas"), lbl("cards", S.cards)], [t("Background detail", "Detalle de fondo"), lbl("deco", S.deco)]]);
    h += H("Motion and interaction", "Animación e interacción") + tbl([[t("Entrance", "Entrada"), lbl("enter", S.enter)], [t("Hover", "Al pasar el cursor"), lbl("hover", S.hover)], [t("Scroll effects", "Efectos al desplazarse"), lbls("scroll", S.scroll).join(", ") || "—"], [t("Speed", "Velocidad"), lbl("speed", S.speed)]]) + "<p>" + t("Animations are turned off for visitors whose device asks for reduced motion.", "Las animaciones se desactivan para quienes piden menos movimiento en su dispositivo.") + "</p>";
    h += H("Pages and sitemap", "Páginas y mapa del sitio") + "<p><b>" + P.main + " " + t("main pages", "páginas principales") + "</b> (" + t("in the menu", "en el menú") + '):</p><div class="d-tags"><span>' + t("Home", "Inicio") + "</span>" + lbls("pages", S.pages).map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div><p><b>" + P.subs + " " + t("subpages", "subpáginas") + "</b> " + t("for products, services or articles (estimate).", "para productos, servicios o artículos (estimado).") + "</p><p><b>" + t("Languages", "Idiomas") + ":</b> " + lbls("langs", S.langs).join(", ") + "</p>";
    h += H("Features", "Funciones") + (feats.length ? '<ul class="d-list">' + feats.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" : "<p>—</p>") + "<p><b>" + t("AI search (GEO)", "Búsqueda con IA (GEO)") + ":</b> " + lbl("geo", S.geo) + "</p>" + (P.add.length ? "<p><b>" + t("Quoted separately", "Se cotiza aparte") + ":</b> " + P.add.map(function (a) { return t(a[1], a[2]); }).join(", ") + ". " + t("These depend on your products and payment or calendar setup.", "Dependen de tus productos y de tu sistema de pagos o de agenda.") + "</p>" : "");
    h += H("Recommended plan", "Plan recomendado") + '<div class="d-plan"><b class="n">' + t(P.plan.en, P.plan.es) + " · " + P.plan.p + '</b><ul class="d-list">' + P.why.map(function (w) { return "<li>" + t(w.en, w.es) + "</li>"; }).join("") + "</ul><p>" + t("Prices in US dollars. The final quote is confirmed after a short call.", "Precios en dólares estadounidenses. La cotización final se confirma después de una breve llamada.") + "</p></div>";
    h += H("Next steps", "Próximos pasos") + '<ol class="d-list" style="list-style:decimal">' + [t("JIEWEITECH reviews this document and replies within one business day.", "JIEWEITECH revisa este documento y responde en un día hábil."), t("A short call to confirm pages, content, plan and timeline.", "Una llamada breve para confirmar páginas, contenido, plan y plazos."), t("We design the homepage with your real content, using these choices as the starting point.", "Diseñamos la página de inicio con tu contenido real, partiendo de estas decisiones."), t("You review it, we refine it, then we build and launch the site.", "La revisas, la ajustamos y luego construimos y publicamos el sitio.")].map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol>";
    h += '<footer class="d-foot"><span>Jieweitech, Inc. · 3678 Admiralty Way, Suite 503, Marina del Rey, CA 90292 · +1 (510) 628-5269</span><span>' + ref + "</span></footer>";
    // the plain-text version goes into the email to the team and the clipboard
    var L = [];
    L.push(t("WEBSITE DESIGN REQUIREMENTS", "REQUISITOS DE DISEÑO WEB") + " · " + ref, name + (S.tagline ? " · " + S.tagline : ""), "");
    L.push(t("Industry: ", "Sector: ") + lbl("industry", S.industry), t("Goal: ", "Objetivo: ") + lbl("goal", S.goal));
    L.push(t("Layout: ", "Diseño: ") + [lbl("hero", S.hero), lbl("visual", S.visual), lbl("nav", S.nav), S.cols + t(" per row", " por fila"), lbl("density", S.density)].join(", "));
    L.push(t("Colors: ", "Colores: ") + lbl("palette", S.palette) + " (" + lbl("mode", S.mode) + ") " + t("primary ", "principal ") + c.pri.toUpperCase() + ", " + t("accent ", "acento ") + c.acc.toUpperCase() + ", " + t("background ", "fondo ") + c.bg.toUpperCase() + ", " + t("text ", "texto ") + c.ink.toUpperCase());
    L.push(t("Fonts: ", "Tipografía: ") + f.hn + " / " + f.bn + ", " + lbl("hsize", S.hsize) + ", " + lbl("hcase", S.hcase) + ", " + S.bsize + "px");
    L.push(t("Style: ", "Estilo: ") + [lbl("style", S.style), lbl("corners", S.corners), lbl("buttons", S.buttons), lbl("cards", S.cards), lbl("deco", S.deco)].join(", "));
    L.push(t("Motion: ", "Animación: ") + [lbl("enter", S.enter), lbl("hover", S.hover)].concat(lbls("scroll", S.scroll)).concat([lbl("speed", S.speed)]).join(", "));
    L.push(t("Pages: ", "Páginas: ") + P.main + t(" main (", " principales (") + [t("Home", "Inicio")].concat(lbls("pages", S.pages)).join(", ") + "), " + P.subs + t(" subpages", " subpáginas"));
    L.push(t("Languages: ", "Idiomas: ") + lbls("langs", S.langs).join(", "));
    L.push(t("Features: ", "Funciones: ") + (lbls("feats", S.feats).join(", ") || "—"), "GEO: " + lbl("geo", S.geo));
    L.push("", t("Recommended plan: ", "Plan recomendado: ") + t(P.plan.en, P.plan.es) + " (" + P.plan.p + ")");
    P.why.forEach(function (w) { L.push("- " + t(w.en, w.es)); });
    if (P.add.length) L.push(t("Quoted separately: ", "Se cotiza aparte: ") + P.add.map(function (a) { return t(a[1], a[2]); }).join(", "));
    return { html: h, text: L.join("\n") };
  }
  function openDoc() {
    if (!ref) ref = makeRef();
    var d = build(); paper.innerHTML = d.html; docText = d.text;
    docEl.hidden = false; document.documentElement.style.overflow = "hidden"; $(".ds-doc-body", docEl).scrollTop = 0;
    $("[data-close]", docEl).focus();
  }
  function closeDoc() { docEl.hidden = true; document.documentElement.style.overflow = ""; $("[data-make]", root).focus(); }
  docEl.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDoc(); });
  $("[data-close]", docEl).addEventListener("click", closeDoc);
  $("[data-print]", docEl).addEventListener("click", function () { document.body.classList.add("ds-printing"); window.print(); setTimeout(function () { document.body.classList.remove("ds-printing"); }, 500); });
  $("[data-copy]", docEl).addEventListener("click", function () {
    var b = this, done = function () { var o = b.innerHTML; b.textContent = t("Copied ✓", "Copiado ✓"); setTimeout(function () { b.innerHTML = o; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(docText).then(done, fallback); else fallback();
    function fallback() { var ta = document.createElement("textarea"); ta.value = docText; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} ta.remove(); }
  });
  var DOC_CSS = "body{margin:0;background:#eef0f3;font:15px/1.6 Helvetica,Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans SC',sans-serif;color:#16181d}.paper{max-width:860px;margin:30px auto;background:#fff;padding:56px;box-shadow:0 10px 40px rgba(0,0,0,.12)}.d-top{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #16181d;padding-bottom:20px;margin-bottom:26px}.d-k{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#5d636d;margin:0}h1{font-size:38px;line-height:1;margin:8px 0 6px;letter-spacing:-.02em}.d-meta{text-align:right;font-size:12.5px;color:#5d636d;line-height:1.7}.d-meta b{color:#16181d}h2{font-size:17px;margin:30px 0 10px}h2 span{font-size:12px;color:#8a909a;margin-right:10px}p{margin:6px 0;color:#2d3139}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e3e5e9;vertical-align:top}th{width:34%;color:#5d636d;font-weight:600}.d-pal{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin:10px 0}.d-pal div{border:1px solid #e3e5e9;border-radius:8px;overflow:hidden;font-size:11.5px}.d-pal i{display:block;height:46px}.d-pal span{display:block;padding:6px 8px}.d-pal b{display:block}.d-list{padding-left:18px}.d-tags span{display:inline-block;border:1px solid #d6d9df;border-radius:999px;padding:3px 10px;font-size:12.5px;margin:0 6px 6px 0}.d-plan{border:2px solid #16181d;border-radius:10px;padding:16px 18px}.d-plan .n{font-size:22px}.d-sample{border:1px solid #e3e5e9;border-radius:8px;padding:16px}.d-foot{margin-top:36px;padding-top:16px;border-top:1px solid #e3e5e9;font-size:12px;color:#8a909a;display:flex;justify-content:space-between;gap:10px}@media print{body{background:#fff}.paper{box-shadow:none;margin:0;padding:0}}";
  $("[data-download]", docEl).addEventListener("click", function () {
    var fonts = gfLink();
    var html = '<!doctype html>\n<html lang="' + (lang === "zh" ? "zh-Hans" : lang) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(t("Website Design Requirements", "Requisitos de diseño web") + " · " + bizName() + " · " + ref) + "</title>" + fonts + "<style>" + DOC_CSS + '</style></head><body><article class="paper">' + paper.innerHTML + "</article></body></html>";
    var a = document.createElement("a"), slug = bizName().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "website";
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); a.download = t("website-design-requirements-", "requisitos-diseno-web-") + slug + ".html";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });

  /* ---------- send to JIEWEITECH (arrives in the dashboard as a new inquiry) ---------- */
  var send = $("[data-send]", docEl), sf = $("[data-sendform]", docEl), smsg = $(".smsg", docEl), sdone = $(".sdone", docEl);
  $("[data-sendopen]", docEl).addEventListener("click", function () { send.hidden = false; (sdone.hidden ? sf.elements.name : sdone).focus && (sdone.hidden ? sf.elements.name.focus() : null); if (innerWidth < 860) send.scrollIntoView({ behavior: "smooth" }); });
  var EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
  sf.addEventListener("submit", function (e) {
    e.preventDefault();
    var el = sf.elements, bad = null;
    ["name", "email"].forEach(function (n) { var ok = n === "email" ? EMAIL.test(el[n].value.trim()) : !!el[n].value.trim(); el[n].setAttribute("aria-invalid", String(!ok)); if (!ok && !bad) bad = el[n]; });
    if (bad) { smsg.hidden = false; smsg.textContent = I18N.t(bad.name === "email" ? "errEmail" : "errRequired"); bad.focus(); return; }
    var notes = el.notes.value.trim(), P = plan();
    var message = t("Sent from the Design Studio.", "Enviado desde el estudio de diseño.") + (notes ? "\n\n" + t("Notes: ", "Notas: ") + notes : "") + "\n\n" + docText;
    if (message.length > 4990) message = message.slice(0, 4985) + "…";
    var btn = sf.querySelector('button[type="submit"]'), label = btn.innerHTML;
    btn.disabled = true; btn.textContent = I18N.t("sending"); smsg.hidden = true;
    fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({
      name: el.name.value.trim(), email: el.email.value.trim(), company: el.company.value.trim(), phone: el.phone.value.trim(), service: "website-development", plan: P.plan.key, message: message,
      lang: lang, page: location.pathname, referrer: document.referrer, t: String(openedAt), website: el.website.value
    }) }).then(function (r) { return r.json().catch(function () { return { ok: false, error: "server" }; }).then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        btn.disabled = false; btn.innerHTML = label;
        if (res.j && res.j.ok) { sf.hidden = true; sdone.hidden = false; $("[data-sref]", docEl).textContent = res.j.ref || ref; sdone.setAttribute("tabindex", "-1"); sdone.focus(); return; }
        var errs = (res.j && res.j.errors) || {};
        if (errs.email) el.email.setAttribute("aria-invalid", "true");
        if (errs.phone) el.phone.setAttribute("aria-invalid", "true");
        smsg.hidden = false;
        smsg.textContent = I18N.t(res.status === 429 ? "errRate" : errs.email ? "errEmail" : errs.phone ? "errPhone" : res.status === 400 ? "errFix" : "errServer");
      }, function () { btn.disabled = false; btn.innerHTML = label; smsg.hidden = false; smsg.textContent = I18N.t("errNetwork"); });
  });

  /* the homepage-style in-place language switch (unbuilt pages): labels changed, so redraw */
  document.addEventListener("langchange", function (e) { lang = e.detail.lang; sync(); if (!docEl.hidden) openDoc(); });
  sync(); show(step); fit();
})();
