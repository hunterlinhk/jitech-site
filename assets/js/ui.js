/* Shared by every JIEWEITECH page: the language menu and the round cursor. Load after i18n.js. */
(function () {
  "use strict";
  var html = document.documentElement;

  /* ---------- language menu ---------- */
  function initLang(box) {
    var btn = box.querySelector(".lang-btn"), list = box.querySelector(".lang-menu"), label = box.querySelector(".lang-cur");
    var items = [].slice.call(list.querySelectorAll("[data-set-lang]"));
    function sync() {
      var m = I18N.meta(I18N.lang);
      label.textContent = m.short;
      btn.setAttribute("aria-label", I18N.t("language") + ": " + m.label);
      items.forEach(function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-set-lang") === I18N.lang)); });
    }
    function open(on, focusFirst) {
      list.hidden = !on;
      btn.setAttribute("aria-expanded", String(on));
      box.classList.toggle("open", on);
      if (on && focusFirst) (list.querySelector('[aria-checked="true"]') || items[0]).focus();
    }
    btn.addEventListener("click", function () { open(list.hidden, false); });
    btn.addEventListener("keydown", function (e) { if (e.key === "ArrowDown") { e.preventDefault(); open(true, true); } });
    items.forEach(function (b, i) {
      b.addEventListener("click", function () { I18N.set(b.getAttribute("data-set-lang")); open(false); btn.focus(); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus(); }
        else if (e.key === "Escape" || e.key === "Tab") { open(false); if (e.key === "Escape") btn.focus(); }
      });
    });
    document.addEventListener("click", function (e) { if (!box.contains(e.target)) open(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !list.hidden) { open(false); btn.focus(); } });
    document.addEventListener("langchange", sync);
    sync();
  }
  [].forEach.call(document.querySelectorAll("[data-lang]"), initLang);

  /* ---------- a small round cursor (mouse and trackpad only) ---------- */
  if (window.gsap && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var cur = document.createElement("div");
    cur.className = "cursor"; cur.setAttribute("aria-hidden", "true"); cur.innerHTML = "<i></i>";
    document.body.appendChild(cur);
    html.classList.add("has-cursor");
    var curX = gsap.quickTo(cur, "x", { duration: 0.16, ease: "power3.out" }), curY = gsap.quickTo(cur, "y", { duration: 0.16, ease: "power3.out" });
    var HOT = "a, button, [role=button], label, input, select, textarea, summary, .row, .hx.is-off .mon";
    addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (!cur.classList.contains("on")) { gsap.set(cur, { x: e.clientX, y: e.clientY }); cur.classList.add("on"); }
      curX(e.clientX); curY(e.clientY);
      var t = e.target;
      cur.classList.toggle("hot", !!(t && t.closest && t.closest(HOT) && !(t.closest(".hx") && !t.closest(".hx.is-lit, .hx.is-off"))));
    }, { passive: true });
    html.addEventListener("mouseleave", function () { cur.classList.remove("on"); });
    addEventListener("pointerdown", function () { cur.classList.add("down"); });
    addEventListener("pointerup", function () { cur.classList.remove("down"); });
  }
})();
