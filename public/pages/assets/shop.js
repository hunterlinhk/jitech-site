/* The shared engine behind the demo websites: catalog with filters, product pages with options,
   a shopping bag with checkout, or an inquiry list with a request-for-quote form.
   Each demo page supplies its own products, product drawings, design and special tools.

   Shop.init({
     name, mode: "shop" | "quote", currency: "USD", products: [...],
     art(product, state) -> SVG markup,      // state: { color, view, text, ... }
     facets: [{ key, label, type: "check" | "swatch" | "range", unit }],
     card(product) -> HTML (optional), detail(product, state) -> HTML (extra block, optional),
     options(product) -> [{ key, label, type: "swatch" | "size" | "select" | "text", values, ... }] (optional),
     views: { name(el, route) },              // extra pages, shown at #/name
     shipping, freeShip, promo, incoterms, files, checkoutExtra, quoteExtra, labels
   })
   Pages: #/ (home), #/shop?cat=…, #/p/<id>, #/checkout, #/quote, and any extra view. */
(function () {
  "use strict";
  var doc = document, html = doc.documentElement;
  var WALL = html.classList.contains("on-wall");
  var S = window.Shop = {};
  var cfg = null, byId = {}, cart = [], route = { name: "home", q: {} };

  /* ---------- helpers ---------- */
  var esc = S.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  S.$ = $; S.$$ = $$;
  S.money = function (n, noCents) {
    var cur = (cfg && cfg.currency) || "USD", sym = { USD: "$", EUR: "€", GBP: "£" }[cur] || "$";
    var v = Number(n || 0);
    return sym + (noCents || (v % 1 === 0 && v >= 100) ? Math.round(v).toLocaleString("en-US") : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };
  /* lighten (amt > 0) or darken (amt < 0) a hex color */
  S.shade = function (hex, amt) {
    var h = String(hex).replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&");
    var n = parseInt(h, 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var f = function (c) { return Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt)))); };
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  };
  S.uid = function (prefix) { return prefix + "-" + (Date.now() % 100000 + 10000 + Math.floor(Math.random() * 900)).toString().slice(-5); };
  S.toast = function (msg) {
    var box = $(".sh-toasts");
    if (!box) { box = doc.createElement("div"); box.className = "sh-toasts"; box.setAttribute("role", "status"); doc.body.appendChild(box); }
    var t = doc.createElement("div"); t.className = "sh-toast"; t.textContent = msg; box.appendChild(t);
    setTimeout(function () { t.classList.add("out"); setTimeout(function () { t.remove(); }, 300); }, 2600);
  };
  S.modal = function (title, body, opts) {
    opts = opts || {};
    var m = doc.createElement("div");
    m.className = "sh-modal" + (opts.wide ? " wide" : "");
    m.innerHTML = '<div class="sh-modal-box" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="sh-modal-head"><h3>' + esc(title) + '</h3><button class="sh-x" aria-label="Close">&times;</button></div><div class="sh-modal-body">' + body + "</div></div>";
    var close = function () { m.classList.remove("on"); setTimeout(function () { m.remove(); }, 250); doc.removeEventListener("keydown", key); };
    var key = function (e) { if (e.key === "Escape") close(); };
    m.addEventListener("click", function (e) { if (e.target === m || e.target.closest(".sh-x")) close(); });
    doc.addEventListener("keydown", key);
    doc.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add("on"); });
    return { el: m, close: close };
  };
  var L = function (key) { return (cfg.labels && cfg.labels[key]) || LABELS[cfg.mode][key] || LABELS.common[key] || key; };
  var LABELS = {
    common: { shop: "Shop", all: "All products", sort: "Sort", filters: "Filters", clear: "Clear all", results: "products", search: "Search products", empty: "Nothing matches these filters.", qty: "Quantity", specs: "Specifications", related: "You may also like", back: "Back" },
    shop: { cart: "Bag", add: "Add to bag", added: "Added to your bag", go: "Checkout", empty_cart: "Your bag is empty.", subtotal: "Subtotal" },
    quote: { cart: "Inquiry list", add: "Add to inquiry list", added: "Added to your inquiry list", go: "Request a quote", empty_cart: "Your inquiry list is empty. Add products to request a quote for several at once.", subtotal: "Estimated value" }
  };

  /* ---------- price ---------- */
  S.unitPrice = function (p, qty, opts) {
    if (opts && opts._unit != null) return opts._unit;
    var price = p.price;
    if (p.tiers) { for (var i = 0; i < p.tiers.length; i++) if (qty >= p.tiers[i][0]) price = p.tiers[i][1]; }
    if (cfg.priceAdjust) price = cfg.priceAdjust(p, price, opts || {}, qty);
    return price;
  };
  S.fromPrice = function (p) { return p.tiers ? p.tiers[p.tiers.length - 1][1] : p.price; };
  function priceLabel(p) {
    if (p.price == null && !p.tiers) return "Price on request";
    if (p.tiers) return "From " + S.money(S.fromPrice(p)) + (p.unit ? " / " + p.unit : "");
    return S.money(p.price) + (p.unit ? " / " + p.unit : "") + (p.was ? ' <s>' + S.money(p.was) + "</s>" : "");
  }
  S.priceLabel = priceLabel;

  /* ---------- the bag / inquiry list ---------- */
  var KEY = function () { return "demo-cart-" + (cfg.id || location.pathname); };
  function loadCart() { try { cart = JSON.parse(sessionStorage.getItem(KEY()) || "[]").filter(function (i) { return byId[i.id]; }); } catch (e) { cart = []; } }
  function saveCart() { try { sessionStorage.setItem(KEY(), JSON.stringify(cart)); } catch (e) {} paintCount(); }
  S.cart = function () { return cart; };
  S.add = function (id, qty, opts, label) {
    var p = byId[id]; if (!p) return;
    qty = Math.max(qty || 1, p.moq || 1);
    var k = id + "|" + JSON.stringify(opts || {});
    var ex = cart.filter(function (i) { return i.key === k; })[0];
    if (ex) ex.qty += qty; else cart.push({ key: k, id: id, qty: qty, opts: opts || {}, label: label || "" });
    saveCart();
    openDrawer();
    S.toast(L("added"));
  };
  S.total = function () { return cart.reduce(function (s, i) { var u = S.unitPrice(byId[i.id], i.qty, i.opts); return s + (u || 0) * i.qty; }, 0); };
  function paintCount() {
    var n = cart.reduce(function (s, i) { return s + (cfg.mode === "quote" ? 1 : i.qty); }, 0);
    $$("[data-cart-count]").forEach(function (el) { el.textContent = n; el.classList.toggle("has", n > 0); });
  }
  var drawer = null;
  function buildDrawer() {
    drawer = doc.createElement("aside");
    drawer.className = "sh-drawer";
    drawer.setAttribute("aria-label", L("cart"));
    drawer.innerHTML = '<div class="sh-drawer-box"><div class="sh-drawer-head"><h3>' + esc(L("cart")) + '</h3><button class="sh-x" aria-label="Close">&times;</button></div><div class="sh-drawer-body"></div><div class="sh-drawer-foot"></div></div>';
    drawer.addEventListener("click", function (e) {
      if (e.target === drawer || e.target.closest(".sh-x")) return closeDrawer();
      var b = e.target.closest("[data-step]");
      if (b) { var it = cart[+b.dataset.i]; var p = byId[it.id]; it.qty = Math.max(p.moq || 1, it.qty + (+b.dataset.step) * (p.step || 1)); saveCart(); paintDrawer(); }
      var r = e.target.closest("[data-remove]");
      if (r) { cart.splice(+r.dataset.remove, 1); saveCart(); paintDrawer(); }
      if (e.target.closest("[data-go]")) { closeDrawer(); location.hash = cfg.mode === "quote" ? "#/quote" : "#/checkout"; }
    });
    drawer.addEventListener("change", function (e) {
      var inp = e.target.closest("[data-qty]");
      if (inp) { var it = cart[+inp.dataset.qty]; var p = byId[it.id]; it.qty = Math.max(p.moq || 1, parseInt(inp.value, 10) || 0); saveCart(); paintDrawer(); }
    });
    doc.body.appendChild(drawer);
  }
  function lineHtml(it, i, editable) {
    var p = byId[it.id], u = S.unitPrice(p, it.qty, it.opts);
    var meta = Object.keys(it.opts).filter(function (k) { return k.charAt(0) !== "_"; }).map(function (k) { return esc(it.opts[k]); }).filter(Boolean).join(" · ");
    var qtyCtl = editable
      ? (cfg.mode === "quote" || (p.moq || 1) > 1
        ? '<label class="sh-q"><input type="number" min="' + (p.moq || 1) + '" step="' + (p.step || 1) + '" value="' + it.qty + '" data-qty="' + i + '" aria-label="Quantity"> ' + esc(p.unit || "pcs") + "</label>"
        : '<span class="sh-step"><button data-step="-1" data-i="' + i + '" aria-label="Less">−</button><b>' + it.qty + '</b><button data-step="1" data-i="' + i + '" aria-label="More">+</button></span>')
      : '<span class="sh-qn">× ' + it.qty.toLocaleString("en-US") + (p.unit && cfg.mode === "quote" ? " " + esc(p.unit) : "") + "</span>";
    return '<li class="sh-line"><div class="sh-line-art">' + cfg.art(p, Object.assign({ thumb: true }, it.opts._state || {})) + '</div><div class="sh-line-info"><b>' + esc(p.name) + "</b>" +
      (meta || it.label ? '<small>' + [meta, esc(it.label)].filter(Boolean).join(" · ") + "</small>" : "") +
      (p.moq > 1 ? '<small class="sh-moq">MOQ ' + p.moq.toLocaleString("en-US") + " " + esc(p.unit || "pcs") + "</small>" : "") +
      '<div class="sh-line-row">' + qtyCtl + (u != null ? '<span class="sh-line-price">' + S.money(u * it.qty) + "</span>" : '<span class="sh-line-price muted">On request</span>') + "</div>" +
      (editable ? '<button class="sh-remove" data-remove="' + i + '">Remove</button>' : "") + "</div></li>";
  }
  function paintDrawer() {
    if (!drawer) return;
    var body = $(".sh-drawer-body", drawer), foot = $(".sh-drawer-foot", drawer);
    if (!cart.length) { body.innerHTML = '<p class="sh-empty">' + esc(L("empty_cart")) + "</p>"; foot.innerHTML = '<a class="sh-btn ghost block" href="#/shop">' + esc(L("shop")) + "</a>"; return; }
    body.innerHTML = '<ul class="sh-lines">' + cart.map(function (it, i) { return lineHtml(it, i, true); }).join("") + "</ul>";
    var sub = S.total(), bar = "";
    if (cfg.mode === "shop" && cfg.freeShip) {
      var left = cfg.freeShip - sub;
      bar = '<div class="sh-ship"><p>' + (left > 0 ? "You're " + S.money(left) + " away from free shipping" : "You've got free shipping") + '</p><i><b style="width:' + Math.min(100, sub / cfg.freeShip * 100) + '%"></b></i></div>';
    }
    foot.innerHTML = bar + '<div class="sh-sub"><span>' + esc(L("subtotal")) + "</span><b>" + S.money(sub) + "</b></div>" +
      (cfg.mode === "quote" ? '<p class="sh-fine">Final prices depend on quantity, options and destination. You\'ll get a formal quote by email.</p>' : '<p class="sh-fine">Shipping and taxes are calculated at checkout.</p>') +
      '<button class="sh-btn block" data-go>' + esc(L("go")) + "</button>";
  }
  function openDrawer() { if (WALL) return; paintDrawer(); drawer.classList.add("on"); }
  function closeDrawer() { drawer.classList.remove("on"); }
  S.openCart = openDrawer;

  /* ---------- routing ---------- */
  function parse() {
    var h = location.hash.replace(/^#\/?/, ""), parts = h.split("?"), path = parts[0].split("/").filter(Boolean), q = {};
    (parts[1] || "").split("&").forEach(function (kv) { if (!kv) return; var a = kv.split("="); var k = decodeURIComponent(a[0]), v = decodeURIComponent((a[1] || "").replace(/\+/g, " ")); (q[k] = q[k] || []).push(v); });
    return { name: path[0] || "home", arg: path[1] ? decodeURIComponent(path[1]) : null, q: q };
  }
  S.go = function (h) { location.hash = h; };
  /* every visit to a view starts from a clean container, so event listeners never pile up */
  function fresh(el) { el.textContent = ""; var d = doc.createElement("div"); d.className = "sh-root"; el.appendChild(d); return d; }
  S.fresh = fresh;
  function show(name) {
    $$("[data-view]").forEach(function (v) { v.hidden = v.getAttribute("data-view") !== name; });
    $$("[data-nav]").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-nav") === name); });
    doc.body.setAttribute("data-route", name);
  }
  function render() {
    route = parse();
    var name = route.name;
    if (name === "p" && !byId[route.arg]) name = "shop";
    var el = $('[data-view="' + name + '"]');
    if (!el) { name = "home"; el = $('[data-view="home"]'); }
    show(name);
    if (name === "shop") renderShop(el);
    else if (name === "p") renderProduct(el, byId[route.arg]);
    else if (name === "checkout") renderCheckout(el);
    else if (name === "quote") renderQuote(el);
    else if (cfg.views && cfg.views[name]) cfg.views[name](el, route);
    if (name !== "home" || route.prev) window.scrollTo(0, 0);
    if (cfg.onRoute) cfg.onRoute(name, route);
  }

  /* ---------- cards ---------- */
  function card(p) {
    if (cfg.card) return cfg.card(p);
    var badge = p.badge ? '<span class="sh-badge">' + esc(p.badge) + "</span>" : "";
    var sw = p.colors && p.colors.length > 1 ? '<span class="sh-dots">' + p.colors.slice(0, 5).map(function (c) { return '<i style="background:' + c.hex + '" title="' + esc(c.name) + '"></i>'; }).join("") + "</span>" : "";
    return '<a class="sh-card" href="#/p/' + p.id + '">' + badge + '<div class="sh-art">' + cfg.art(p, { color: 0 }) + '</div><div class="sh-info">' +
      '<p class="sh-cat">' + esc(p.cat) + "</p><h3>" + esc(p.name) + "</h3>" + (p.blurb ? '<p class="sh-blurb">' + esc(p.blurb) + "</p>" : "") +
      '<p class="sh-price">' + priceLabel(p) + "</p>" + (p.moq > 1 ? '<p class="sh-moq">MOQ ' + p.moq.toLocaleString("en-US") + " " + esc(p.unit || "pcs") + "</p>" : "") + sw + "</div></a>";
  }
  S.card = card;
  function fillSlots(root) {
    $$("[data-products]", root).forEach(function (slot) {
      var f = slot.getAttribute("data-products"), lim = +slot.getAttribute("data-limit") || 99;
      var list = cfg.products.filter(function (p) {
        if (p.hidden) return false;
        if (f === "featured") return p.featured;
        if (f === "all") return true;
        var kv = f.split(":"); var v = p[kv[0]]; return Array.isArray(v) ? v.indexOf(kv[1]) > -1 : v === kv[1];
      }).slice(0, lim);
      slot.innerHTML = list.map(card).join("");
    });
  }
  S.fill = fillSlots;

  /* ---------- catalog ---------- */
  function values(p, key) {
    if (key === "colors") return (p.colors || []).map(function (c) { return c.name; });
    var v = p[key]; return v == null ? [] : Array.isArray(v) ? v : [v];
  }
  function renderShop(el) {
    el = fresh(el);
    var q = route.q, facets = cfg.facets || [{ key: "cat", label: "Category" }];
    var text = (q.q || [""])[0].toLowerCase(), sort = (q.sort || [""])[0];
    var list = cfg.products.filter(function (p) {
      if (p.hidden) return false;
      if (text && (p.name + " " + p.cat + " " + (p.tags || []).join(" ") + " " + (p.blurb || "")).toLowerCase().indexOf(text) < 0) return false;
      return facets.every(function (f) {
        if (f.type === "range") {
          var mx = q[f.key + "_max"] ? +q[f.key + "_max"][0] : null; if (mx == null) return true;
          var v = f.key === "price" ? S.fromPrice(p) : p[f.key]; return v == null || v <= mx;
        }
        var sel = q[f.key]; if (!sel || !sel.length) return true;
        var vs = values(p, f.key); return sel.some(function (s) { return vs.indexOf(s) > -1; });
      });
    });
    var sorters = {
      "price-asc": function (a, b) { return (S.fromPrice(a) || 1e9) - (S.fromPrice(b) || 1e9); },
      "price-desc": function (a, b) { return (S.fromPrice(b) || 0) - (S.fromPrice(a) || 0); },
      name: function (a, b) { return a.name.localeCompare(b.name); },
      "new": function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); }
    };
    if (sorters[sort]) list = list.slice().sort(sorters[sort]);
    var facetHtml = facets.map(function (f) {
      if (f.type === "range") {
        var vals = cfg.products.filter(function (p) { return !p.hidden; }).map(function (p) { return f.key === "price" ? S.fromPrice(p) : p[f.key]; }).filter(function (v) { return v != null; });
        var max = Math.ceil(Math.max.apply(null, vals)), min = Math.floor(Math.min.apply(null, vals)), cur = q[f.key + "_max"] ? +q[f.key + "_max"][0] : max;
        return '<fieldset class="sh-facet"><legend>' + esc(f.label) + '</legend><input type="range" min="' + min + '" max="' + max + '" step="' + (f.step || 1) + '" value="' + cur + '" data-range="' + f.key + '"><p class="sh-range">Up to <b>' + (f.key === "price" ? S.money(cur, true) : cur.toLocaleString("en-US") + " " + esc(f.unit || "")) + "</b></p></fieldset>";
      }
      var all = [];
      cfg.products.forEach(function (p) { if (!p.hidden) values(p, f.key).forEach(function (v) { if (all.indexOf(v) < 0) all.push(v); }); });
      if (f.order) all.sort(function (a, b) { return f.order.indexOf(a) - f.order.indexOf(b); });
      var hexOf = {};
      if (f.type === "swatch") cfg.products.forEach(function (p) { (p.colors || []).forEach(function (c) { hexOf[c.name] = c.hex; }); });
      return '<fieldset class="sh-facet' + (f.type === "swatch" ? " sw" : "") + '"><legend>' + esc(f.label) + "</legend>" + all.map(function (v) {
        var on = (q[f.key] || []).indexOf(v) > -1;
        var n = cfg.products.filter(function (p) { return !p.hidden && values(p, f.key).indexOf(v) > -1; }).length;
        return '<label class="sh-opt"><input type="checkbox" data-facet="' + f.key + '" value="' + esc(v) + '"' + (on ? " checked" : "") + ">" +
          (f.type === "swatch" ? '<i style="background:' + hexOf[v] + '"></i>' : "") + "<span>" + esc(v) + (f.unit ? " " + esc(f.unit) : "") + '</span><em>' + n + "</em></label>";
      }).join("") + "</fieldset>";
    }).join("");
    var active = Object.keys(q).filter(function (k) { return k !== "sort"; }).length > 0;
    var title = q.cat && q.cat.length === 1 ? q.cat[0] : (cfg.shopTitle || L("all"));
    el.innerHTML = '<div class="sh-shop"><div class="sh-shop-head"><div><p class="sh-crumbs"><a href="#/">Home</a> / ' + esc(L("shop")) + "</p><h1>" + esc(title) + '</h1><p class="sh-count">' + list.length + " " + esc(L("results")) + "</p></div>" +
      '<div class="sh-tools"><input type="search" class="sh-search" placeholder="' + esc(L("search")) + '" value="' + esc((q.q || [""])[0]) + '" aria-label="' + esc(L("search")) + '">' +
      '<select class="sh-sort" aria-label="Sort"><option value="">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name</option><option value="new">Newest</option></select>' +
      '<button class="sh-btn ghost sh-ftoggle" type="button">' + esc(L("filters")) + "</button></div></div>" +
      '<div class="sh-shop-body"><aside class="sh-facets">' + facetHtml + (active ? '<button class="sh-clear" type="button">' + esc(L("clear")) + "</button>" : "") + "</aside>" +
      '<div class="sh-grid">' + (list.length ? list.map(card).join("") : '<p class="sh-empty">' + esc(L("empty")) + ' <button class="sh-clear" type="button">' + esc(L("clear")) + "</button></p>") + "</div></div></div>";
    $(".sh-sort", el).value = sort;
    var update = function () {
      var parts = [];
      $$("[data-facet]:checked", el).forEach(function (c) { parts.push(c.dataset.facet + "=" + encodeURIComponent(c.value)); });
      $$("[data-range]", el).forEach(function (r) { if (+r.value < +r.max) parts.push(r.dataset.range + "_max=" + r.value); });
      var s = $(".sh-search", el).value.trim(); if (s) parts.push("q=" + encodeURIComponent(s));
      var so = $(".sh-sort", el).value; if (so) parts.push("sort=" + so);
      history.replaceState(null, "", "#/shop" + (parts.length ? "?" + parts.join("&") : ""));
      var y = window.scrollY; render(); window.scrollTo(0, y);
    };
    var refocus = function () { var s2 = $('[data-view="shop"] .sh-search'); if (s2) { s2.focus(); s2.setSelectionRange(s2.value.length, s2.value.length); } };
    el.addEventListener("change", function (e) { if (!e.target.classList.contains("sh-search")) update(); });
    var t; $(".sh-search", el).addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { update(); refocus(); }, 350); });
    $$("[data-range]", el).forEach(function (r) { r.addEventListener("input", function () { var f = facets.filter(function (x) { return x.key === r.dataset.range; })[0]; r.nextElementSibling.innerHTML = "Up to <b>" + (f.key === "price" ? S.money(+r.value, true) : (+r.value).toLocaleString("en-US") + " " + esc(f.unit || "")) + "</b>"; }); });
    $$(".sh-clear", el).forEach(function (b) { b.addEventListener("click", function () { location.hash = "#/shop"; }); });
    $(".sh-ftoggle", el).addEventListener("click", function () { $(".sh-facets", el).classList.toggle("open"); });
  }

  /* ---------- product page ---------- */
  function optionsFor(p) {
    if (cfg.options) return cfg.options(p) || [];
    var o = [];
    if (p.colors && p.colors.length) o.push({ key: "color", label: "Color", type: "swatch", values: p.colors });
    if (p.sizes) o.push({ key: "size", label: "Size", type: "size", values: p.sizes });
    return o;
  }
  function renderProduct(el, p) {
    el = fresh(el);
    var st = { color: 0, view: 0 }, opts = optionsFor(p);
    opts.forEach(function (o) { if (o.type === "size") st[o.key] = null; else if (o.type === "select") st[o.key] = 0; else if (o.type === "text") st[o.key] = ""; });
    var qty = p.moq || 1;
    var views = p.views || 1;
    var related = cfg.products.filter(function (x) { return !x.hidden && x.id !== p.id && x.cat === p.cat; }).concat(cfg.products.filter(function (x) { return !x.hidden && x.cat !== p.cat; })).slice(0, 4);
    var optHtml = opts.map(function (o) {
      if (o.type === "swatch") return '<div class="sh-optgrp"><p class="sh-optl">' + esc(o.label) + ': <b data-cur="' + o.key + '">' + esc(o.values[0].name) + '</b></p><div class="sh-swatches">' +
        o.values.map(function (c, i) { return '<button type="button" class="sh-sw' + (i === 0 ? " on" : "") + '" data-opt="' + o.key + '" data-i="' + i + '" style="--c:' + c.hex + '" aria-label="' + esc(c.name) + '" title="' + esc(c.name) + '"></button>'; }).join("") + "</div></div>";
      if (o.type === "size") return '<div class="sh-optgrp"><p class="sh-optl">' + esc(o.label) + (o.guide ? ' <button type="button" class="sh-link" data-guide>' + esc(o.guide) + "</button>" : "") + '</p><div class="sh-sizes">' +
        o.values.map(function (s, i) { var out = p.soldOut && p.soldOut.indexOf(s) > -1; return '<button type="button" class="sh-size"' + (out ? " disabled" : "") + ' data-opt="' + o.key + '" data-v="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div></div>";
      if (o.type === "select") return '<div class="sh-optgrp"><label class="sh-optl" for="o-' + o.key + '">' + esc(o.label) + '</label><select id="o-' + o.key + '" class="sh-select" data-opt="' + o.key + '">' +
        o.values.map(function (v, i) { return '<option value="' + i + '">' + esc(typeof v === "string" ? v : v.name + (v.add ? " (+" + S.money(v.add) + ")" : "")) + "</option>"; }).join("") + "</select></div>";
      if (o.type === "text") return '<div class="sh-optgrp"><label class="sh-optl" for="o-' + o.key + '">' + esc(o.label) + '</label><input id="o-' + o.key + '" class="sh-input" data-opt="' + o.key + '" maxlength="' + (o.max || 14) + '" placeholder="' + esc(o.placeholder || "") + '"></div>';
      return "";
    }).join("");
    var tiers = p.tiers ? '<table class="sh-tiers"><thead><tr><th>Quantity</th><th>Unit price</th></tr></thead><tbody>' + p.tiers.map(function (t, i) {
      var next = p.tiers[i + 1]; return '<tr data-tier="' + i + '"><td>' + t[0].toLocaleString("en-US") + (next ? "–" + (next[0] - 1).toLocaleString("en-US") : "+") + " " + esc(p.unit || "pcs") + "</td><td>" + S.money(t[1]) + "</td></tr>";
    }).join("") + "</tbody></table>" : "";
    var specs = p.specs ? '<table class="sh-specs">' + Object.keys(p.specs).map(function (k) { return "<tr><th>" + esc(k) + "</th><td>" + esc(p.specs[k]) + "</td></tr>"; }).join("") + "</table>" : "";
    el.innerHTML = '<div class="sh-pdp"><p class="sh-crumbs"><a href="#/">Home</a> / <a href="#/shop">' + esc(L("shop")) + '</a> / <a href="#/shop?cat=' + encodeURIComponent(p.cat) + '">' + esc(p.cat) + "</a></p>" +
      '<div class="sh-pdp-grid"><div class="sh-gallery"><div class="sh-stage">' + cfg.art(p, st) + "</div>" +
      (views > 1 ? '<div class="sh-thumbs">' + Array.from({ length: views }).map(function (_, i) { return '<button type="button" class="sh-thumb' + (i === 0 ? " on" : "") + '" data-view-i="' + i + '" aria-label="View ' + (i + 1) + '">' + cfg.art(p, Object.assign({}, st, { view: i, thumb: true })) + "</button>"; }).join("") + "</div>" : "") + "</div>" +
      '<div class="sh-buy">' + (p.badge ? '<span class="sh-badge static">' + esc(p.badge) + "</span>" : "") + '<p class="sh-cat">' + esc(p.cat) + (p.sku ? " · " + esc(p.sku) : "") + "</p><h1>" + esc(p.name) + "</h1>" +
      (p.rating ? '<p class="sh-rating" aria-label="Rated ' + p.rating + ' out of 5">' + "★★★★★".slice(0, Math.round(p.rating)) + '<span>' + "★★★★★".slice(Math.round(p.rating)) + "</span> " + p.rating.toFixed(1) + " · " + (p.reviews || 0) + " reviews</p>" : "") +
      '<p class="sh-pprice" data-price></p>' + (p.desc ? '<p class="sh-desc">' + esc(p.desc) + "</p>" : "") +
      optHtml + tiers +
      '<div class="sh-addrow"><div class="sh-qtybox"><button type="button" data-q="-1" aria-label="Less">−</button><input type="number" value="' + qty + '" min="' + (p.moq || 1) + '" step="' + (p.step || 1) + '" aria-label="' + esc(L("qty")) + '" data-qtyin><button type="button" data-q="1" aria-label="More">+</button></div>' +
      '<button type="button" class="sh-btn grow" data-add>' + esc(L("add")) + "</button></div>" +
      (p.moq > 1 ? '<p class="sh-fine">Minimum order ' + p.moq.toLocaleString("en-US") + " " + esc(p.unit || "pcs") + (p.lead ? " · Lead time " + esc(p.lead) : "") + "</p>" : (p.lead ? '<p class="sh-fine">' + esc(p.lead) + "</p>" : "")) +
      '<p class="sh-err" data-err hidden></p>' +
      (cfg.detail ? '<div class="sh-extra">' + cfg.detail(p, st) + "</div>" : "") +
      (p.points ? '<ul class="sh-points">' + p.points.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
      (specs ? '<details class="sh-acc" open><summary>' + esc(L("specs")) + "</summary>" + specs + "</details>" : "") +
      (p.care ? '<details class="sh-acc"><summary>' + esc(p.careTitle || "Details") + "</summary><p>" + esc(p.care) + "</p></details>" : "") +
      "</div></div>" +
      '<section class="sh-related"><h2>' + esc(L("related")) + '</h2><div class="sh-grid four">' + related.map(card).join("") + "</div></section></div>";

    var stage = $(".sh-stage", el), priceEl = $("[data-price]", el), qIn = $("[data-qtyin]", el), err = $("[data-err]", el);
    var paint = function () {
      stage.innerHTML = cfg.art(p, st);
      $$(".sh-thumb", el).forEach(function (t, i) { t.innerHTML = cfg.art(p, Object.assign({}, st, { view: i, thumb: true })); t.classList.toggle("on", i === st.view); });
      var u = S.unitPrice(p, qty, chosen());
      priceEl.innerHTML = u == null ? "Price on request" : S.money(u) + (p.unit ? ' <small>/ ' + esc(p.unit) + "</small>" : "") + (p.was && !p.tiers ? " <s>" + S.money(p.was) + "</s>" : "") + (qty > 1 && u != null ? ' <small class="sh-tot">' + S.money(u * qty) + " total</small>" : "");
      $$("[data-tier]", el).forEach(function (r) { var i = +r.dataset.tier, t = p.tiers[i], n = p.tiers[i + 1]; r.classList.toggle("on", qty >= t[0] && (!n || qty < n[0])); });
      if (cfg.onDetailChange) cfg.onDetailChange(p, st, el, qty);
    };
    var chosen = function () {
      var o = {};
      opts.forEach(function (x) {
        if (x.type === "swatch") o[x.key] = x.values[st[x.key] || 0].name;
        else if (x.type === "select") { var v = x.values[st[x.key] || 0]; o[x.key] = typeof v === "string" ? v : v.name; }
        else if (st[x.key]) o[x.key] = (x.prefix || "") + st[x.key];
      });
      o._state = JSON.parse(JSON.stringify(st));
      return o;
    };
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-opt]");
      if (b && b.tagName === "BUTTON") {
        var k = b.dataset.opt, o = opts.filter(function (x) { return x.key === k; })[0];
        if (o.type === "swatch") { st[k] = +b.dataset.i; if (k === "color") st.color = st[k]; $$('[data-opt="' + k + '"]', el).forEach(function (x) { x.classList.toggle("on", x === b); }); $('[data-cur="' + k + '"]', el).textContent = o.values[st[k]].name; }
        else { st[k] = b.dataset.v; $$('[data-opt="' + k + '"]', el).forEach(function (x) { x.classList.toggle("on", x === b); }); err.hidden = true; }
        paint();
      }
      var t = e.target.closest("[data-view-i]"); if (t) { st.view = +t.dataset.viewI; paint(); }
      var qb = e.target.closest("[data-q]"); if (qb) { qty = Math.max(p.moq || 1, qty + (+qb.dataset.q) * (p.step || 1)); qIn.value = qty; paint(); }
      if (e.target.closest("[data-guide]")) S.modal(optionsFor(p).filter(function (x) { return x.guide; })[0].guide, cfg.sizeGuide ? cfg.sizeGuide(p) : "", { wide: true });
      if (e.target.closest("[data-add]")) {
        var need = opts.filter(function (x) { return x.type === "size" && !st[x.key]; })[0];
        if (need) { err.textContent = "Choose a " + need.label.toLowerCase() + " first."; err.hidden = false; return; }
        var ok = cfg.beforeAdd ? cfg.beforeAdd(p, st, qty) : true;
        if (ok === false) return;
        S.add(p.id, qty, chosen());
      }
    });
    el.addEventListener("input", function (e) {
      var inp = e.target.closest("[data-opt]");
      if (inp && inp.tagName === "INPUT") { st[inp.dataset.opt] = inp.value; paint(); }
      if (inp && inp.tagName === "SELECT") { st[inp.dataset.opt] = +inp.value; paint(); }
      if (e.target === qIn) { qty = Math.max(p.moq || 1, parseInt(qIn.value, 10) || 0); paint(); }
    });
    qIn.addEventListener("blur", function () { qIn.value = qty; });
    paint();
    if (cfg.onDetail) cfg.onDetail(p, st, el, paint);
  }

  /* ---------- checkout (shop) ---------- */
  function summaryHtml() {
    return '<ul class="sh-lines compact">' + cart.map(function (it, i) { return lineHtml(it, i, false); }).join("") + "</ul>";
  }
  function field(id, label, type, extra) { return '<label class="sh-field"><span>' + esc(label) + '</span><input id="' + id + '" name="' + id + '" type="' + (type || "text") + '" ' + (extra == null ? "required" : extra) + "></label>"; }
  S.field = field;
  function renderCheckout(el) {
    el = fresh(el);
    if (!cart.length) { el.innerHTML = '<div class="sh-narrow"><h1>Checkout</h1><p class="sh-empty">' + esc(L("empty_cart")) + '</p><a class="sh-btn" href="#/shop">' + esc(L("shop")) + "</a></div>"; return; }
    var ship = cfg.shipping || [{ id: "std", label: "Standard", eta: "3–5 business days", price: 6 }, { id: "exp", label: "Express", eta: "1–2 business days", price: 18 }];
    var promo = 0, shipSel = ship[0];
    el.innerHTML = '<div class="sh-checkout"><form class="sh-co-form" novalidate><p class="sh-crumbs"><a href="#/shop">' + esc(L("shop")) + "</a> / Checkout</p><h1>Checkout</h1>" +
      '<fieldset><legend>Contact</legend>' + field("co-email", "Email", "email") + "</fieldset>" +
      '<fieldset><legend>' + esc(cfg.addressTitle || "Shipping address") + '</legend><div class="sh-row2">' + field("co-first", "First name") + field("co-last", "Last name") + "</div>" + field("co-addr", "Address") + '<div class="sh-row3">' + field("co-city", "City") + field("co-state", "State") + field("co-zip", "ZIP code") + "</div></fieldset>" +
      (cfg.checkoutExtra ? cfg.checkoutExtra() : "") +
      '<fieldset><legend>' + esc(cfg.shippingTitle || "Delivery") + "</legend>" + ship.map(function (s, i) { return '<label class="sh-radio"><input type="radio" name="ship" value="' + i + '"' + (i === 0 ? " checked" : "") + "><span><b>" + esc(s.label) + "</b><small>" + esc(s.eta) + "</small></span><em>" + (s.price ? S.money(s.price) : "Free") + "</em></label>"; }).join("") + "</fieldset>" +
      '<fieldset><legend>Payment</legend><p class="sh-demo-note">This is a demo store. No payment is taken and nothing is shipped.</p>' + field("co-card", "Card number", "text", 'inputmode="numeric" placeholder="4242 4242 4242 4242" required') + '<div class="sh-row2">' + field("co-exp", "Expiry", "text", 'placeholder="MM / YY" required') + field("co-cvc", "Security code", "text", 'inputmode="numeric" placeholder="123" required') + "</div></fieldset>" +
      '<p class="sh-err" data-err hidden></p><button class="sh-btn block big" type="submit">Place order</button></form>' +
      '<aside class="sh-co-sum"><h3>Order summary</h3>' + summaryHtml() + '<div class="sh-promo"><input placeholder="Promo code" aria-label="Promo code"><button type="button" class="sh-btn ghost">Apply</button></div><p class="sh-promo-msg"></p><dl class="sh-totals"></dl></aside></div>';
    var totals = $(".sh-totals", el);
    var paintTotals = function () {
      var sub = S.total(), shipCost = cfg.freeShip && sub >= cfg.freeShip ? 0 : shipSel.price, disc = sub * promo, tax = (sub - disc) * (cfg.tax || 0);
      totals.innerHTML = "<div><dt>Subtotal</dt><dd>" + S.money(sub) + "</dd></div>" + (disc ? "<div><dt>Discount</dt><dd>−" + S.money(disc) + "</dd></div>" : "") + "<div><dt>Shipping</dt><dd>" + (shipCost ? S.money(shipCost) : "Free") + "</dd></div>" + (tax ? "<div><dt>Estimated tax</dt><dd>" + S.money(tax) + "</dd></div>" : "") + '<div class="tot"><dt>Total</dt><dd>' + S.money(sub - disc + shipCost + tax) + "</dd></div>";
      return sub - disc + shipCost + tax;
    };
    paintTotals();
    el.addEventListener("change", function (e) { if (e.target.name === "ship") { shipSel = ship[+e.target.value]; paintTotals(); } });
    $(".sh-promo button", el).addEventListener("click", function () {
      var code = $(".sh-promo input", el).value.trim().toUpperCase(), msg = $(".sh-promo-msg", el);
      if (cfg.promo && code === cfg.promo.code) { promo = cfg.promo.off; msg.textContent = cfg.promo.label; msg.className = "sh-promo-msg ok"; }
      else { promo = 0; msg.textContent = code ? "That code isn't valid." + (cfg.promo ? " Try " + cfg.promo.code + "." : "") : ""; msg.className = "sh-promo-msg"; }
      paintTotals();
    });
    $(".sh-co-form", el).addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = $$("input[required]", el).filter(function (i) { return !i.value.trim() || (i.type === "email" && !/^\S+@\S+\.\S+$/.test(i.value)); });
      $$("input", el).forEach(function (i) { i.classList.toggle("bad", bad.indexOf(i) > -1); });
      var err = $("[data-err]", el);
      if (bad.length) { err.textContent = "Please fill in the highlighted fields."; err.hidden = false; bad[0].focus(); return; }
      var total = paintTotals(), no = S.uid(cfg.orderPrefix || "ORD"), items = summaryHtml(), mail = $("#co-email", el).value;
      cart = []; saveCart();
      el.innerHTML = '<div class="sh-narrow sh-done"><span class="sh-tick">✓</span><h1>Thank you for your order</h1><p>Order <b>' + no + "</b> · " + S.money(total) + "</p><p>A confirmation would be sent to <b>" + esc(mail) + "</b>. (This is a demo store, so nothing was charged or sent.)</p>" + items + '<a class="sh-btn" href="#/shop">Continue shopping</a></div>';
      window.scrollTo(0, 0);
    });
  }

  /* ---------- request for quote ---------- */
  function renderQuote(el) {
    el = fresh(el);
    var items = cart.length ? summaryHtml() : '<p class="sh-empty">No products added yet. You can still describe what you need below, or <a href="#/shop">browse the catalog</a>.</p>';
    var countries = ["United States", "Mexico", "Canada", "United Kingdom", "Germany", "France", "Spain", "Australia", "Japan", "Brazil", "Chile", "Colombia", "Other"];
    el.innerHTML = '<div class="sh-checkout quote"><form class="sh-co-form" novalidate><p class="sh-crumbs"><a href="#/shop">' + esc(L("shop")) + "</a> / Request a quote</p><h1>" + esc(cfg.quoteTitle || "Request a quote") + "</h1><p class=\"sh-lead\">" + esc(cfg.quoteLead || "Tell us about your order. We reply with prices, lead times and samples within one business day.") + "</p>" +
      '<fieldset><legend>Your company</legend><div class="sh-row2">' + field("q-name", "Your name") + field("q-company", "Company") + '</div><div class="sh-row2">' + field("q-email", "Work email", "email") + field("q-phone", "Phone or WhatsApp", "tel", "") + "</div>" +
      '<label class="sh-field"><span>Country</span><select id="q-country" class="sh-select">' + countries.map(function (c) { return "<option>" + c + "</option>"; }).join("") + "</select></label></fieldset>" +
      (cfg.quoteExtra ? cfg.quoteExtra() : "") +
      '<fieldset><legend>Order details</legend>' + (cfg.incoterms ? '<div class="sh-row2"><label class="sh-field"><span>Shipping terms</span><select class="sh-select" id="q-inc"><option>FOB (port of loading)</option><option>CIF (port of destination)</option><option>DDP (delivered, duties paid)</option><option>EXW (factory)</option><option>Not sure</option></select></label>' + field("q-date", "Target delivery date", "date", "") + "</div>" : "") +
      '<label class="sh-field"><span>Message</span><textarea id="q-msg" rows="4" placeholder="' + esc(cfg.quotePlaceholder || "Quantities, customization, packaging, target price…") + '"></textarea></label>' +
      (cfg.files ? '<label class="sh-file"><input type="file" multiple data-files><span>' + esc(cfg.files) + '</span><small data-filelist>No files chosen</small></label>' : "") + "</fieldset>" +
      '<p class="sh-err" data-err hidden></p><button class="sh-btn block big" type="submit">Send request</button><p class="sh-demo-note">This is a demo website. Requests aren\'t sent anywhere.</p></form>' +
      '<aside class="sh-co-sum"><h3>' + esc(L("cart")) + " (" + cart.length + ")</h3>" + items + (cart.length ? '<dl class="sh-totals"><div class="tot"><dt>Estimated value</dt><dd>' + S.money(S.total()) + "</dd></div></dl>" : "") + "</aside></div>";
    var fi = $("[data-files]", el);
    if (fi) fi.addEventListener("change", function () { $("[data-filelist]", el).textContent = Array.prototype.map.call(fi.files, function (f) { return f.name; }).join(", ") || "No files chosen"; });
    $(".sh-co-form", el).addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = $$("input[required]", el).filter(function (i) { return !i.value.trim() || (i.type === "email" && !/^\S+@\S+\.\S+$/.test(i.value)); });
      $$("input", el).forEach(function (i) { i.classList.toggle("bad", bad.indexOf(i) > -1); });
      var err = $("[data-err]", el);
      if (bad.length) { err.textContent = "Please fill in the highlighted fields."; err.hidden = false; bad[0].focus(); return; }
      var no = S.uid(cfg.rfqPrefix || "RFQ"), n = cart.length, who = $("#q-name", el).value.split(" ")[0], mail = $("#q-email", el).value;
      cart = []; saveCart();
      el.innerHTML = '<div class="sh-narrow sh-done"><span class="sh-tick">✓</span><h1>Thanks, ' + esc(who) + '. Your request is in.</h1><p>Reference <b>' + no + "</b>" + (n ? " · " + n + " product" + (n > 1 ? "s" : "") : "") + "</p><p>Our sales team would reply to <b>" + esc(mail) + "</b> with prices, lead times and sample options within one business day. (This is a demo, so nothing was sent.)</p>" +
        '<ol class="sh-next"><li><b>Quote</b> Prices by quantity, with shipping terms</li><li><b>Samples</b> Pre-production samples for approval</li><li><b>Production</b> With photos and inspection before shipping</li></ol><a class="sh-btn" href="#/shop">Back to the catalog</a></div>';
      window.scrollTo(0, 0);
    });
  }

  /* ---------- start ---------- */
  S.init = function (c) {
    cfg = c; cfg.mode = cfg.mode || "shop";
    cfg.products.forEach(function (p) { byId[p.id] = p; });
    S.products = cfg.products; S.byId = byId; S.cfg = cfg;
    fillSlots(doc);
    $$("[data-cart-label]").forEach(function (el) { el.textContent = L("cart"); });
    if (WALL) { show("home"); return; }
    loadCart(); buildDrawer(); paintCount();
    doc.addEventListener("click", function (e) {
      if (e.target.closest("[data-cart]")) { e.preventDefault(); openDrawer(); }
      var a = e.target.closest('a[href="#"]'); if (a) e.preventDefault();
      var m = e.target.closest("[data-menu]"); if (m) doc.body.classList.toggle("menu-open");
      if (e.target.closest("[data-view] a, nav a")) doc.body.classList.remove("menu-open");
    });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("on")) closeDrawer(); });
    addEventListener("hashchange", render);
    render();
  };
})();
