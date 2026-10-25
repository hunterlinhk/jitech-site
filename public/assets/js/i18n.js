/* Languages: English is written in the HTML; Spanish sits next to it on the same element.
     <h2 data-es="Spanish text">English text</h2>
   An attribute is translated the same way:  data-attr="aria-label" data-attr-es="…"
   Simplified Chinese lives in one dictionary, assets/js/i18n-zh.js, keyed by the English text (HTML included),
   so the pages don't need a third attribute. Missing entries simply stay in English.
   Text made by scripts lives in STR below, or is passed through I18N.pick(english, spanish).

   Every page also exists at its own Spanish (/es/…) and Chinese (/zh/…) address, built by `npm run build` with
   that language already in place, so search engines index all three. On those built pages, choosing a language opens the matching address;
   the homepage instead swaps its text in place (so the monitor wall keeps its state) and updates the address bar.
   The choice is remembered, and ?lang=es (or en, zh) on any address forces a language. */
(function () {
  "use strict";
  var LANGS = [
    { code: "en", label: "English", short: "EN", html: "en" },
    { code: "es", label: "Español", short: "ES", html: "es" },
    { code: "zh", label: "简体中文", short: "中文", html: "zh-Hans" }
  ];
  var ZH = window.I18N_ZH || {};
  function zh(en) {
    if (en == null) return en;
    var k = String(en).trim();
    if (ZH.hasOwnProperty(k)) return ZH[k];
    var m = /^(\d+)(\s[\s\S]*)$/.exec(k); // "7 main pages (...)" -> "{n} main pages (...)"
    if (m && ZH.hasOwnProperty("{n}" + m[2])) return ZH["{n}" + m[2]].replace("{n}", m[1]);
    return en;
  }
  var PHONE = "+1 (510) 628-5269";
  var STR = {
    menu: { en: "Menu", es: "Menú", zh: "菜单" },
    close: { en: "Close", es: "Cerrar", zh: "关闭" },
    fxOff: { en: "Turn effects off", es: "Desactivar efectos", zh: "关闭特效" },
    fxOn: { en: "Effects are off. Turn them back on", es: "Efectos desactivados. Volver a activarlos", zh: "特效已关闭，点击重新开启" },
    fxReduced: { en: "Effects are off (reduced motion is on)", es: "Efectos desactivados (movimiento reducido activado)", zh: "特效已关闭（系统已开启减少动态效果）" },
    designConcept: { en: "Design concept", es: "Concepto de diseño", zh: "设计概念" },
    logoKey: { en: "JIEWEITECH logo wall: show or hide the website examples", es: "Muro del logotipo de JIEWEITECH: mostrar u ocultar los ejemplos de sitios web", zh: "JIEWEITECH 标志墙：显示或隐藏网站示例" },
    language: { en: "Language", es: "Idioma", zh: "语言" },
    sending: { en: "Sending…", es: "Enviando…", zh: "正在发送…" },
    errRequired: { en: "Please fill this in.", es: "Completa este campo.", zh: "请填写此项。" },
    errEmail: { en: "Enter a valid email address, like name@company.com.", es: "Escribe un correo válido, por ejemplo nombre@empresa.com.", zh: "请输入有效的电子邮箱，例如 name@company.com。" },
    errPhone: { en: "Enter a valid phone number, with the country code if you're outside the US.", es: "Escribe un número de teléfono válido, con el código de país si estás fuera de EE. UU.", zh: "请输入有效的电话号码；如果不在美国，请加上国家代码。" },
    errShort: { en: "Tell us a little more (at least 10 characters).", es: "Cuéntanos un poco más (al menos 10 caracteres).", zh: "请多写一点（至少 10 个字）。" },
    errLong: { en: "That's too long. Please shorten it.", es: "Es demasiado largo. Acórtalo, por favor.", zh: "内容太长了，请删减一些。" },
    errFix: { en: "Please check the fields marked in red.", es: "Revisa los campos marcados en rojo.", zh: "请检查标红的栏目。" },
    errRate: { en: "You've sent several messages in a short time. Please wait a few minutes, or call us at " + PHONE + ".", es: "Enviaste varios mensajes en poco tiempo. Espera unos minutos o llámanos al " + PHONE + ".", zh: "您在短时间内发送了多条信息。请稍等几分钟，或致电 " + PHONE + "。" },
    errServer: { en: "Something went wrong on our side and your message wasn't sent. Please try again, or call us at " + PHONE + ".", es: "Algo falló de nuestro lado y tu mensaje no se envió. Inténtalo de nuevo o llámanos al " + PHONE + ".", zh: "我们这边出了问题，信息没有发送成功。请重试，或致电 " + PHONE + "。" },
    errNetwork: { en: "We couldn't reach our server. Check your connection and try again, or call us at " + PHONE + ".", es: "No pudimos conectar con nuestro servidor. Revisa tu conexión e inténtalo de nuevo, o llámanos al " + PHONE + ".", zh: "无法连接到我们的服务器。请检查网络后重试，或致电 " + PHONE + "。" }
  };
  var codes = LANGS.map(function (l) { return l.code; });
  var html = document.documentElement;
  // the language this address was built in (Spanish pages live under /es/, Chinese under /zh/)
  var pageLang = html.getAttribute("data-page-lang") || "en";
  var built = !!document.querySelector('link[rel="alternate"][hreflang]');

  function pick() {
    var m = /[?&]lang=(en|es|zh)\b/.exec(location.search);
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
    var alt = document.querySelector('link[rel="alternate"][hreflang="' + meta(code).html + '"]');
    if (!alt) return null;
    try {
      var u = new URL(alt.href);
      var search = location.search.replace(/([?&])lang=(en|es|zh)&?/, "$1").replace(/[?&]$/, "");
      return u.pathname + search + location.hash;
    } catch (e) { return null; }
  }
  /* links to the site's own pages point at the current language's folder (absolute, so they stay right after the address changes) */
  var PAGE_LINK = /^(?:\.\/|[a-z0-9-]+\.html)(?:[?#].*)?$/i;
  function relink(root) {
    if (!built) return;
    var a0 = document.querySelector('link[rel="alternate"][hreflang="' + meta(cur).html + '"]');
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
      var en = el.getAttribute("data-en");
      var v = cur === "en" ? en : cur === "zh" ? zh(en) : (el.getAttribute("data-" + cur) || en);
      if (el.innerHTML !== v) el.innerHTML = v;
    }
    var at = root.querySelectorAll("[data-attr]");
    for (var j = 0; j < at.length; j++) {
      var a = at[j], name = a.getAttribute("data-attr");
      if (a.getAttribute("data-attr-en") === null) a.setAttribute("data-attr-en", a.getAttribute(name) || "");
      var aen = a.getAttribute("data-attr-en");
      a.setAttribute(name, cur === "en" ? aen : cur === "zh" ? zh(aen) : (a.getAttribute("data-attr-" + cur) || aen));
    }
    relink(root);
    html.lang = meta(cur).html;
  }
  function t(key) { var s = STR[key]; return s ? (s[cur] || s.en) : key; }
  /* text made by scripts: give the English and the Spanish; Chinese comes from the dictionary */
  function choose(en, es) { return cur === "es" ? (es == null ? en : es) : cur === "zh" ? zh(en) : en; }
  function set(code) {
    if (codes.indexOf(code) < 0 || code === cur) return;
    try { localStorage.setItem("jw-lang", code); } catch (e) {}
    if (built && !swapInPlace) { var to = altUrl(code); if (to) { location.href = to; return; } }
    cur = code;
    apply(document);
    syncUrl();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: code } }));
  }
  window.I18N = { langs: LANGS, t: t, pick: choose, zh: zh, set: set, apply: apply, meta: meta, phone: PHONE, get lang() { return cur; }, get pageLang() { return pageLang; } };
  // opened in the other language than the visitor chose: go to the matching address (built pages only)
  if (built && !swapInPlace && cur !== pageLang) { var to0 = altUrl(cur); if (to0) { location.replace(to0); return; } }
  apply(document);
  syncUrl();
})();
