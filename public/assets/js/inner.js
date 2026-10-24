/* The service, contact and privacy pages: mobile menu, reveal on scroll, and the contact form. Load after i18n.js and ui.js. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var html = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) html.classList.add("js");

  /* mobile menu */
  var menu = $("#menu"), btn = $("#menuBtn"), open = false;
  function setMenu(on) {
    open = on;
    menu.classList.toggle("open", on); menu.inert = !on;
    btn.setAttribute("aria-expanded", String(on));
    btn.textContent = I18N.t(on ? "close" : "menu");
    html.style.overflow = on ? "hidden" : "";
  }
  if (menu && btn) {
    btn.addEventListener("click", function () { setMenu(!open); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { setMenu(false); btn.focus(); } });
    addEventListener("resize", function () { if (open && innerWidth >= 900) setMenu(false); });
    document.addEventListener("langchange", function () { btn.textContent = I18N.t(open ? "close" : "menu"); });
  }

  /* reveal on scroll */
  var items = document.querySelectorAll("[data-r]");
  if (reduce || !("IntersectionObserver" in window)) [].forEach.call(items, function (el) { el.classList.add("in"); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    [].forEach.call(items, function (el) { io.observe(el); });
  }

  /* footer year */
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- contact form: sends to /api/inquiries and shows the result in place ----------
     Without JavaScript the form still posts normally and the server redirects back with ?sent= or ?error=. */
  var form = $("#contactForm");
  if (form) {
    var done = $("#formDone"), msg = form.querySelector(".msg"), btn = form.querySelector('button[type="submit"]');
    var field = function (n) { return form.elements[n]; };
    var params = new URLSearchParams(location.search);
    var pre = function (n) { var v = params.get(n), el = field(n); if (v && el) [].forEach.call(el.options, function (o) { if (o.value === v) el.value = v; }); };
    pre("service"); pre("plan");
    field("t").value = String(Date.now());

    var EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
    var PHONE = /^[0-9+().\-\s/extEXT#]{5,40}$/;
    var CODES = { required: "errRequired", invalid: null, too_short: "errShort", too_long: "errLong" };
    function setError(name, code) {
      var el = field(name), box = $("#" + (el && el.id) + "-err");
      if (!el || !box) return;
      if (!code) { el.removeAttribute("aria-invalid"); box.hidden = true; box.textContent = ""; box.removeAttribute("data-code"); return; }
      el.setAttribute("aria-invalid", "true");
      var key = CODES[code] || (name === "email" ? "errEmail" : name === "phone" ? "errPhone" : "errRequired");
      box.setAttribute("data-code", key);
      box.textContent = I18N.t(key); box.hidden = false;
    }
    function check() {
      var e = {}, v = function (n) { return (field(n).value || "").trim(); };
      if (!v("name")) e.name = "required";
      if (!v("email")) e.email = "required"; else if (!EMAIL.test(v("email"))) e.email = "invalid";
      if (v("phone") && !PHONE.test(v("phone"))) e.phone = "invalid";
      if (!v("message")) e.message = "required"; else if (v("message").length < 10) e.message = "too_short";
      return e;
    }
    function showErrors(errs) {
      ["name", "company", "email", "phone", "message"].forEach(function (n) { setError(n, errs[n]); });
      var first = ["name", "company", "email", "phone", "message"].filter(function (n) { return errs[n]; })[0];
      if (first) field(first).focus();
      return !!first;
    }
    function banner(key) {
      if (!key) { msg.hidden = true; msg.textContent = ""; msg.removeAttribute("data-code"); return; }
      msg.setAttribute("data-code", key); msg.textContent = I18N.t(key); msg.hidden = false;
    }
    function busy(on) {
      btn.disabled = on;
      var l = btn.querySelector(".lbl");
      if (on) { l.setAttribute("data-was", l.innerHTML); l.textContent = I18N.t("sending"); }
      else if (l.hasAttribute("data-was")) { l.innerHTML = l.getAttribute("data-was"); l.removeAttribute("data-was"); I18N.apply(btn); }
    }
    function showDone(ref) {
      form.hidden = true; done.hidden = false;
      var r = done.querySelector(".ref");
      if (ref && ref !== "1" && /^JW-\d+$/.test(ref)) { r.hidden = false; r.querySelector("[data-ref]").textContent = ref; } else r.hidden = true;
      done.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      done.focus({ preventScroll: true });
    }
    // live re-check once a field has been flagged
    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") !== "true") return;
      var errs = check(); setError(e.target.name, errs[e.target.name]);
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      banner(null);
      if (showErrors(check())) { banner("errFix"); return; }
      var src = {}; try { src = JSON.parse(sessionStorage.getItem("jw-src") || "{}") || {}; } catch (x) {}
      var data = {};
      [].forEach.call(form.elements, function (el) { if (el.name) data[el.name] = el.value; });
      data.lang = I18N.lang;
      data.page = location.pathname;
      data.referrer = src.referrer || "";
      var utm = src.utm || {};
      ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { if (utm[k]) data[k] = utm[k]; });
      busy(true);
      fetch(form.getAttribute("action"), {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data), credentials: "same-origin"
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) { return { status: res.status, body: body }; });
      }).then(function (r) {
        busy(false);
        if (r.status === 201 && r.body.ok) { form.reset(); showErrors({}); field("t").value = String(Date.now()); showDone(r.body.ref); return; }
        if (r.status === 400 && r.body.errors) { showErrors(r.body.errors); banner("errFix"); return; }
        banner(r.status === 429 ? "errRate" : "errServer");
      }).catch(function () { busy(false); banner("errNetwork"); });
    });
    done.querySelector("[data-again]").addEventListener("click", function () {
      done.hidden = true; form.hidden = false; banner(null);
      field("name").focus();
    });
    document.addEventListener("langchange", function () {
      [].forEach.call(form.querySelectorAll("[data-code]"), function (el) { el.textContent = I18N.t(el.getAttribute("data-code")); });
    });
    // after a no-JavaScript submission
    if (params.get("sent")) showDone(params.get("sent"));
    else if (params.get("error")) banner(params.get("error") === "rate_limited" ? "errRate" : params.get("error") === "invalid" ? "errFix" : "errServer");
  }

  /* ---------- plan finder (website development page) ---------- */
  var finder = document.querySelector("[data-finder]");
  if (finder) {
    var P = {
      basic: { name: ["Basic", "Básico"], price: "$200" },
      standard: { name: ["Standard", "Estándar"], price: "$500" },
      premium: { name: ["Premium", "Premium"], price: "$800" }
    };
    var WHY = {
      p15: ["Up to 15 product or service pages fit in Basic.", "Hasta 15 páginas de productos o servicios caben en Básico."],
      p40: ["16 to 40 product pages need Standard (Basic allows 15).", "De 16 a 40 páginas de producto necesitan Estándar (Básico permite 15)."],
      p75: ["41 to 75 product pages need Premium (Standard allows 40).", "De 41 a 75 páginas de producto necesitan Premium (Estándar permite 40)."],
      p76: ["More than 75 product pages: start with Premium and we'll quote the extra pages.", "Más de 75 páginas de producto: empieza con Premium y te cotizamos las páginas adicionales."],
      inq: ["Inquiry forms and a dashboard for products and news start at Standard.", "Los formularios de consulta y el panel de productos y noticias empiezan en Estándar."],
      noinq: ["Customers reach you by phone and email shown on the site.", "Tus clientes te contactan por el teléfono y el correo que aparecen en el sitio."],
      lang: ["More than one language starts at Standard.", "Varios idiomas empiezan en Estándar."],
      aiMid: ["Standard adds GEO promotion with articles on general online platforms.", "Estándar agrega promoción GEO con artículos en plataformas generales en línea."],
      aiHigh: ["Premium adds keyword analysis, advanced AI search optimization and industry media promotion.", "Premium agrega análisis de palabras clave, optimización avanzada para IA y promoción en medios del sector."],
      aiLow: ["Basic SEO and GEO are included in every plan.", "El SEO y el GEO básicos vienen en todos los planes."]
    };
    var RANK = ["basic", "standard", "premium"];
    var calc = function () {
      var v = function (n) { var el = finder.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ""; };
      var lvl = 0, why = [];
      var pr = v("products");
      if (pr === "15") why.push("p15");
      if (pr === "40") { lvl = Math.max(lvl, 1); why.push("p40"); }
      if (pr === "75") { lvl = 2; why.push("p75"); }
      if (pr === "76") { lvl = 2; why.push("p76"); }
      if (v("inquiries") === "yes") { lvl = Math.max(lvl, 1); why.push("inq"); } else why.push("noinq");
      if (v("langs") === "yes") { lvl = Math.max(lvl, 1); why.push("lang"); }
      var ai = v("ai");
      if (ai === "high") { lvl = 2; why.push("aiHigh"); } else if (ai === "mid") { lvl = Math.max(lvl, 1); why.push("aiMid"); } else why.push("aiLow");
      var id = RANK[lvl], es = I18N.lang === "es" ? 1 : 0;
      finder.querySelector("[data-fname]").textContent = P[id].name[es];
      finder.querySelector("[data-fprice]").textContent = P[id].price + " USD";
      var ul = finder.querySelector("[data-fwhy]");
      ul.textContent = "";
      why.forEach(function (k) { var li = document.createElement("li"); li.textContent = WHY[k][es]; ul.appendChild(li); });
      var cta = finder.querySelector("[data-fcta]");
      cta.setAttribute("href", (cta.getAttribute("href") || "").split("?")[0] + "?service=website-development&plan=" + id);
    };
    finder.addEventListener("change", calc);
    document.addEventListener("langchange", calc);
    calc();
  }
})();
