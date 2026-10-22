/* Languages: English is written in the HTML; Spanish sits next to it on the same element.
     <h2 data-es="Spanish text">English text</h2>
   An attribute is translated the same way:  data-attr="aria-label" data-attr-es="…"
   Text made by scripts lives in STR below. The choice is remembered, and ?lang=es (or en) forces one.
   To add another language later: add it to LANGS, add its text to STR, and add data-xx attributes in the HTML. */
(function () {
  "use strict";
  var LANGS = [
    { code: "en", label: "English", short: "EN", html: "en" },
    { code: "es", label: "Español", short: "ES", html: "es" }
  ];
  var STR = {
    menu: { en: "Menu", es: "Menú" },
    close: { en: "Close", es: "Cerrar" },
    fxOff: { en: "Turn effects off", es: "Desactivar efectos" },
    fxOn: { en: "Effects are off. Turn them back on", es: "Efectos desactivados. Volver a activarlos" },
    fxReduced: { en: "Effects are off (reduced motion is on)", es: "Efectos desactivados (movimiento reducido activado)" },
    designConcept: { en: "Design concept", es: "Concepto de diseño" },
    logoKey: { en: "JIEWEITECH logo wall: show or hide the website examples", es: "Muro del logotipo de JIEWEITECH: mostrar u ocultar los ejemplos de sitios web" },
    language: { en: "Language", es: "Idioma" },
    sending: { en: "Opening your email app…", es: "Abriendo tu aplicación de correo…" }
  };
  var codes = LANGS.map(function (l) { return l.code; });
  function pick() {
    var m = /[?&]lang=(en|es)\b/.exec(location.search);
    if (m) return m[1];
    try { var s = localStorage.getItem("jw-lang"); if (codes.indexOf(s) > -1) return s; } catch (e) {}
    var nav = (navigator.languages || [navigator.language || "en"]);
    for (var i = 0; i < nav.length; i++) {
      var c = String(nav[i]).toLowerCase().slice(0, 2);
      if (c === "en") return "en";
      if (codes.indexOf(c) > -1) return c;
    }
    return "en";
  }
  var cur = pick();
  function meta(code) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i]; return LANGS[0]; }
  function apply(root) {
    root = root || document;
    var els = root.querySelectorAll("[data-es]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.getAttribute("data-en") === null) el.setAttribute("data-en", el.innerHTML);
      var v = cur === "en" ? el.getAttribute("data-en") : (el.getAttribute("data-" + cur) || el.getAttribute("data-en"));
      if (el.innerHTML !== v) el.innerHTML = v;
    }
    var at = root.querySelectorAll("[data-attr]");
    for (var j = 0; j < at.length; j++) {
      var a = at[j], name = a.getAttribute("data-attr");
      if (a.getAttribute("data-attr-en") === null) a.setAttribute("data-attr-en", a.getAttribute(name) || "");
      a.setAttribute(name, a.getAttribute("data-attr-" + cur) || a.getAttribute("data-attr-en"));
    }
    document.documentElement.lang = meta(cur).html;
  }
  function t(key) { var s = STR[key]; return s ? (s[cur] || s.en) : key; }
  function set(code) {
    if (codes.indexOf(code) < 0 || code === cur) return;
    cur = code;
    try { localStorage.setItem("jw-lang", code); } catch (e) {}
    apply(document);
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: code } }));
  }
  window.I18N = { langs: LANGS, t: t, set: set, apply: apply, meta: meta, get lang() { return cur; } };
  apply(document);
})();
