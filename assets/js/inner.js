/* The service and contact pages: mobile menu, reveal on scroll, and the contact form. Load after i18n.js and ui.js. */
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

  /* contact form: the site has no server, so the message opens in the visitor's email app, ready to send */
  var form = $("#contactForm");
  if (form) {
    var qs = /[?&]service=([a-z-]+)/.exec(location.search), sel = form.querySelector("#f-service");
    if (qs && sel) [].forEach.call(sel.options, function (o) { if (o.value === qs[1]) sel.value = o.value; });
    var qp = /[?&]plan=([a-z]+)/.exec(location.search), pl = form.querySelector("#f-plan");
    if (qp && pl) [].forEach.call(pl.options, function (o) { if (o.value === qp[1]) pl.value = o.value; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var to = form.getAttribute("data-email");
      var val = function (id) { var el = form.querySelector(id); return el ? el.value.trim() : ""; };
      var txt = function (id) { var el = form.querySelector(id); return el && el.selectedIndex > -1 ? el.options[el.selectedIndex].text : ""; };
      var body = [
        "Name: " + val("#f-name"), "Company: " + val("#f-company"), "Email: " + val("#f-email"), "Phone / WhatsApp: " + val("#f-phone"),
        "Service: " + txt("#f-service"), "Plan: " + txt("#f-plan"), "", val("#f-msg")
      ].join("\n");
      var subject = "Website inquiry" + (val("#f-company") ? " from " + val("#f-company") : "");
      var msg = form.querySelector(".msg");
      if (msg) msg.textContent = I18N.t("sending");
      location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }
})();
