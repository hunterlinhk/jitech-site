/* Languages: English is written in the HTML; Spanish sits next to it on the same element.
     <h2 data-es="Spanish text">English text</h2>
   An attribute is translated the same way:  data-attr="aria-label" data-attr-es="…"
   Text made by scripts lives in STR below.

   Every page also exists at its own Spanish address (/es/…), built by `npm run build` with the Spanish already
   in place, so search engines index both. On those built pages, choosing a language opens the matching address;
   the homepage instead swaps its text in place (so the monitor wall keeps its state) and updates the address bar.
   The choice is remembered, and ?lang=es (or en) on any address forces a language. */
(function () {
  "use strict";
  var LANGS = [
    { code: "en", label: "English", short: "EN", html: "en" },
    { code: "es", label: "Español", short: "ES", html: "es" }
  ];
  var PHONE = "+1 (510) 628-5269";
  var STR = {
    menu: { en: "Menu", es: "Menú" },
    close: { en: "Close", es: "Cerrar" },
    fxOff: { en: "Turn effects off", es: "Desactivar efectos" },
    fxOn: { en: "Effects are off. Turn them back on", es: "Efectos desactivados. Volver a activarlos" },
    fxReduced: { en: "Effects are off (reduced motion is on)", es: "Efectos desactivados (movimiento reducido activado)" },
    designConcept: { en: "Design concept", es: "Concepto de diseño" },
    logoKey: { en: "JIEWEITECH logo wall: show or hide the website examples", es: "Muro del logotipo de JIEWEITECH: mostrar u ocultar los ejemplos de sitios web" },
    language: { en: "Language", es: "Idioma" },
    sending: { en: "Sending…", es: "Enviando…" },
    errRequired: { en: "Please fill this in.", es: "Completa este campo." },
    errEmail: { en: "Enter a valid email address, like name@company.com.", es: "Escribe un correo válido, por ejemplo nombre@empresa.com." },
    errPhone: { en: "Enter a valid phone number, with the country code if you're outside the US.", es: "Escribe un número de teléfono válido, con el código de país si estás fuera de EE. UU." },
    errShort: { en: "Tell us a little more (at least 10 characters).", es: "Cuéntanos un poco más (al menos 10 caracteres)." },
    errLong: { en: "That's too long. Please shorten it.", es: "Es demasiado largo. Acórtalo, por favor." },
    errFix: { en: "Please check the fields marked in red.", es: "Revisa los campos marcados en rojo." },
    errRate: { en: "You've sent several messages in a short time. Please wait a few minutes, or call us at " + PHONE + ".", es: "Enviaste varios mensajes en poco tiempo. Espera unos minutos o llámanos al " + PHONE + "." },
    errServer: { en: "Something went wrong on our side and your message wasn't sent. Please try again, or call us at " + PHONE + ".", es: "Algo falló de nuestro lado y tu mensaje no se envió. Inténtalo de nuevo o llámanos al " + PHONE + "." },
    errNetwork: { en: "We couldn't reach our server. Check your connection and try again, or call us at " + PHONE + ".", es: "No pudimos conectar con nuestro servidor. Revisa tu conexión e inténtalo de nuevo, o llámanos al " + PHONE + "." }
  };
  var codes = LANGS.map(function (l) { return l.code; });
  var html = document.documentElement;
  // the language this address was built in (Spanish pages live under /es/)
  var pageLang = html.getAttribute("data-page-lang") || "en";
  var built = !!document.querySelector('link[rel="alternate"][hreflang]');

  function pick() {
    var m = /[?&]lang=(en|es)\b/.exec(location.search);
    if (m) return m[1];
    try { var s = localStorage.getItem("jw-lang"); if (codes.indexOf(s) > -1) return s; } catch (e) {}
    if (pageLang !== "en") return pageLang;
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

  // pages that swap language in place rather than opening the other address (the homepage)
  var swapInPlace = html.hasAttribute("data-lang-swap");
  function altUrl(code) {
    var alt = document.querySelector('link[rel="alternate"][hreflang="' + code + '"]');
    if (!alt) return null;
    try {
      var u = new URL(alt.href);
      var search = location.search.replace(/([?&])lang=(en|es)&?/, "$1").replace(/[?&]$/, "");
      return u.pathname + search + location.hash;
    } catch (e) { return null; }
  }
  /* links to the site's own pages point at the current language's folder (absolute, so they stay right after the address changes) */
  var PAGE_LINK = /^(?:\.\/|[a-z0-9-]+\.html)(?:[?#].*)?$/i;
  function relink(root) {
    if (!built) return;
    var a0 = document.querySelector('link[rel="alternate"][hreflang="' + cur + '"]');
    if (!a0) return;
    var dir;
    try { dir = new URL(a0.href).pathname.replace(/[^/]*$/, ""); } catch (e) { return; }
    var as = root.querySelectorAll("a[href]");
    for (var i = 0; i < as.length; i++) {
      var a = as[i], orig = a.getAttribute("data-href");
      if (orig === null) {
        orig = a.getAttribute("href");
        if (!PAGE_LINK.test(orig)) { a.setAttribute("data-href", ""); continue; }
        a.setAttribute("data-href", orig);
      }
      if (!orig) continue;
      var href = dir + orig.replace(/^\.\//, "");
      if (a.getAttribute("href") !== href) a.setAttribute("href", href);
    }
  }
  /* the address bar follows too, so a reload or a shared link opens the same language.
     Changed only after the page has loaded, because relative addresses in the HTML are read against it. */
  function syncUrl() {
    if (!built || !history.replaceState) return;
    var go = function () {
      var to = altUrl(cur);
      if (to && to.split(/[?#]/)[0] !== location.pathname) history.replaceState(history.state, "", to);
    };
    if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
  }

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
    relink(root);
    html.lang = meta(cur).html;
  }
  function t(key) { var s = STR[key]; return s ? (s[cur] || s.en) : key; }
  function set(code) {
    if (codes.indexOf(code) < 0 || code === cur) return;
    try { localStorage.setItem("jw-lang", code); } catch (e) {}
    if (built && !swapInPlace) { var to = altUrl(code); if (to) { location.href = to; return; } }
    cur = code;
    apply(document);
    syncUrl();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: code } }));
  }
  window.I18N = { langs: LANGS, t: t, set: set, apply: apply, meta: meta, phone: PHONE, get lang() { return cur; }, get pageLang() { return pageLang; } };
  // opened in the other language than the visitor chose: go to the matching address (built pages only)
  if (built && !swapInPlace && cur !== pageLang) { var to0 = altUrl(cur); if (to0) { location.replace(to0); return; } }
  apply(document);
  syncUrl();
})();
