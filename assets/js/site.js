/* ===== Edit here ===== */
var BRAND = "JIEWEITECH";
var CONTACT_EMAIL = "[Contact email]";
// Images for the "Selected work" section. Missing files show a labeled placeholder.
var SCREEN_DIR = "assets/img/shots/";
var SCREENS = ["L1","T1","T2","R3","L4","B2","R4","B5","L2","T4","B6","L3","R1","B3","L5","R5"];
// Screenshots of the concept pages for the entrance wall (tools/make_shots.py regenerates them).
var SHOT_DIR = "assets/img/shots/";
// Entrance wall tile width / height, cycled in order. All landscape.
var RATIOS = [1.6, 1.5, 1.6, 1.45, 1.6, 1.55, 1.5, 1.6];
// The 20 concept pages around the wall (generated; each one is a complete standalone document).
// Each one is a real page in /pages (tools/make_pages.py regenerates them).
var PAGE_DIR = "pages/";
var PAGES = [{"id": "L1", "rect": [20, 58, 335, 232], "title": "Design Drives Business Value"}, {"id": "L2", "rect": [20, 244, 308, 373], "title": "Redefine the Digital Era"}, {"id": "L3", "rect": [20, 385, 304, 527], "title": "Creating Brands for a Better Tomorrow"}, {"id": "L4", "rect": [20, 541, 305, 688], "title": "A New Perspective"}, {"id": "L5", "rect": [20, 706, 304, 868], "title": "From Product to Possibility"}, {"id": "T1", "rect": [354, 102, 656, 254], "title": "Explore New Possibilities"}, {"id": "T2", "rect": [689, 68, 1017, 256], "title": "Crafting Memorable Brands"}, {"id": "T3", "rect": [1036, 96, 1318, 256], "title": "A Simpler Digital World"}, {"id": "T4", "rect": [1336, 62, 1654, 195], "title": "Technology and Humanity"}, {"id": "R1", "rect": [1336, 208, 1531, 355], "title": "Enterprise Digital Partner"}, {"id": "R2", "rect": [1538, 208, 1654, 355], "title": "Design for What's Next"}, {"id": "R3", "rect": [1349, 372, 1654, 518], "title": "Connect the World, Create Innovation"}, {"id": "R4", "rect": [1336, 531, 1654, 645], "title": "Drive Industry Progress"}, {"id": "R5", "rect": [1336, 661, 1654, 880], "title": "Style Never Fades"}, {"id": "B1", "rect": [322, 606, 586, 726], "title": "Building the Future"}, {"id": "B2", "rect": [322, 738, 586, 874], "title": "Premium Web Experiences"}, {"id": "B3", "rect": [601, 634, 925, 785], "title": "Future-Ready Digital Products"}, {"id": "B4", "rect": [612, 801, 935, 903], "title": "Strategy Design Technology"}, {"id": "B5", "rect": [944, 622, 1303, 777], "title": "High-Quality Digital Solutions"}, {"id": "B6", "rect": [950, 793, 1317, 904], "title": "Design Bridges Business and People"}];
// Selected-work frames. "crop" zooms into a detail (scale, and the origin in % of the frame).
var HERO = [
  {file:"screen-01.jpg", variant:0, ratio:1.6,  caption:"Design example"},
  {file:"screen-04.jpg", variant:0, ratio:1.25, caption:"Design example, detail", crop:{s:2.2, ox:0, oy:0}, deco:true},
  {file:"screen-02.jpg", variant:2, ratio:1.78, caption:"Design example"},
  {file:"screen-06.jpg", variant:5, ratio:1.5,  caption:"Design example, detail", crop:{s:2, ox:0, oy:0}, deco:true}
];
var WORK = [
  {file:"T1.jpg", variant:3, ratio:1.6, caption:"Design concept"},
  {file:"R3.jpg", variant:5, ratio:1.6, caption:"Design concept"},
  {file:"T2.jpg", variant:2, ratio:1.6, caption:"Design concept"},
  {file:"B2.jpg", variant:1, ratio:1.6, caption:"Design concept"}
];
/* ===================== */

(function () {
  "use strict";
  gsap.registerPlugin(ScrollTrigger);

  var REPS = 3, COLUMNS = 2;
  var html = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s) { return document.querySelector(s); };
  var q = function (sel, scope) { return gsap.utils.toArray(sel, scope || document); };
  var stage = $("#stage"), home = $("#home"), main = $("#main"), nav = $("#nav");
  var enterBtn = $("#enter"), veil = $("#veil");
  var view = html.dataset.view === "home" ? "home" : "entrance";
  var busy = false, tl = null, stInit = false;
  var skipIntro = reduce || html.dataset.intro === "skip";

  /* ---------- Placeholder layouts: tiny page sketches, replaced by real screenshots ---------- */
  var WF = [
    [[0,0,100,13,"c"],[4,4.5,9,4,"a"],[60,5.5,8,2.2,"b"],[71,5.5,8,2.2,"b"],[82,5.5,8,2.2,"b"],[5,24,56,10,"a"],[5,37,44,10,"a"],[5,50,36,10,"a"],[5,70,32,2.4,"b"],[5,75,28,2.4,"b"],[5,80,30,2.4,"b"],[5,88,15,6,"a"],[58,28,37,62,"d"]],
    [[0,0,100,64,"d"],[4,5,8,4,"e"],[62,6,8,2.2,"f"],[73,6,8,2.2,"f"],[84,6,8,2.2,"f"],[18,24,64,9,"e"],[28,37,44,9,"e"],[41,52,18,6,"e"],[5,72,27,20,"c"],[36.5,72,27,20,"c"],[68,72,27,20,"c"]],
    [[0,0,17,100,"a"],[3,8,8,3,"f"],[3,22,10,2,"f"],[3,29,10,2,"f"],[3,36,10,2,"f"],[3,43,10,2,"f"],[23,8,34,7,"a"],[23,22,72,34,"d"],[23,62,34,2.4,"b"],[23,67,28,2.4,"b"],[60,62,15,2.4,"b"],[23,76,22,18,"c"],[48,76,22,18,"c"],[73,76,22,18,"c"]],
    [[5,6,10,4,"a"],[78,6,17,3,"b"],[5,18,90,24,"a"],[5,46,68,24,"a"],[5,78,13,6,"d"],[5,90,20,2.4,"b"],[40,90,20,2.4,"b"],[75,90,20,2.4,"b"]],
    [[30,7,40,7,"a"],[8,6,10,3,"b"],[82,6,10,3,"b"],[8,22,84,58,"d"],[8,86,26,2.4,"b"],[8,91,18,2.4,"b"],[66,86,26,2.4,"b"]],
    [[5,6,10,4,"a"],[5,20,90,.5,"a"],[5,24,44,9,"a"],[70,26,25,2.4,"b"],[5,40,90,.5,"a"],[5,44,34,9,"a"],[70,46,25,2.4,"b"],[5,60,90,.5,"a"],[5,64,50,9,"a"],[70,66,25,2.4,"b"],[5,80,90,.5,"a"],[5,84,38,9,"a"],[70,86,25,2.4,"b"]]
  ];
  function sketch(v) {
    var el = document.createElement("div");
    el.className = "wf";
    WF[v % WF.length].forEach(function (r) {
      var i = document.createElement("i");
      i.className = "t-" + r[4];
      i.style.cssText = "left:" + r[0] + "%;top:" + r[1] + "%;width:" + r[2] + "%;height:" + r[3] + "%";
      el.appendChild(i);
    });
    return el;
  }

  /* ---------- Homepage frames ---------- */
  function makeShotFrame(fig, o) {
    var shot = document.createElement("div"); shot.className = "shot";
    shot.style.setProperty("--r", o.ratio);
    var inner = document.createElement("div"); inner.className = "shot-inner";
    var crop = document.createElement("div"); crop.className = "crop";
    if (o.crop) { crop.style.transformOrigin = o.crop.ox + "% " + o.crop.oy + "%"; crop.style.transform = "scale(" + o.crop.s + ")"; }
    var ph = sketch(o.variant);
    if (!o.crop) {
      var fn = document.createElement("span"); fn.className = "fn"; fn.textContent = o.file; ph.appendChild(fn);
    }
    if (!o.deco) { ph.setAttribute("role", "img"); ph.setAttribute("aria-label", "Placeholder for " + o.file); }
    crop.appendChild(ph);
    var img = new Image();
    img.alt = o.deco ? "" : "Website design example";
    img.decoding = "async";
    img.onload = function () { ph.remove(); };
    img.onerror = function () { img.remove(); };
    img.src = SCREEN_DIR + o.file;
    crop.appendChild(img);
    inner.appendChild(crop); shot.appendChild(inner); fig.appendChild(shot);
    var cap = document.createElement("figcaption");
    cap.className = "cap hfade"; cap.textContent = o.caption;
    if (fig.hasAttribute("data-work")) cap.classList.remove("hfade");
    fig.appendChild(cap);
  }
  q("[data-work]").forEach(function (f) { makeShotFrame(f, WORK[+f.dataset.work]); });

  /* ---------- Headline word masks ---------- */
  function splitWords(el, cls) {
    Array.from(el.children).forEach(function (line) {
      var words = line.textContent.split(" ");
      line.textContent = "";
      words.forEach(function (w, i) {
        var m = document.createElement("span"); m.className = "w";
        var s = document.createElement("span"); s.className = cls; s.textContent = w;
        m.appendChild(s); line.appendChild(m);
        if (i < words.length - 1) line.appendChild(document.createTextNode(" "));
      });
    });
  }
  splitWords($("#headline"), "wi");

  /* ---------- Brand wordmark in the intro ---------- */
  var word = $("#word");
  Array.from(BRAND).forEach(function (c) {
    var m = document.createElement("span"); m.className = "chm";
    var s = document.createElement("span"); s.className = "ch"; s.textContent = c;
    m.appendChild(s); word.appendChild(m);
  });

  /* ---------- Entrance image wall ---------- */
  var wall = $("#wall"), caption = wall.querySelector(".wall-caption");
  function tile(id, i, dup) {
    var t = document.createElement("div");
    t.className = "tile";
    t.style.setProperty("--r", RATIOS[i % RATIOS.length]);
    if (dup) t.setAttribute("aria-hidden", "true");
    var img = new Image();
    img.alt = dup ? "" : "Website design concept";
    img.decoding = "async";
    img.src = SHOT_DIR + id + ".jpg";
    t.appendChild(img);
    return t;
  }
  for (var c = 0; c < COLUMNS; c++) {
    var col = document.createElement("div"); col.className = "col";
    var track = document.createElement("div"); track.className = "track";
    for (var rep = 0; rep < REPS; rep++) {
      var set = document.createElement("div"); set.className = "set";
      SCREENS.forEach(function (file, i) { if (i % COLUMNS === c) set.appendChild(tile(file, i, rep > 0)); });
      track.appendChild(set);
    }
    col.appendChild(track); wall.insertBefore(col, caption);
  }

  /* Slow endless drift of the wall */
  if (!reduce) {
    var mm = gsap.matchMedia();
    var drift = function (axis) {
      var prop = axis === "y" ? "yPercent" : "xPercent";
      var end = -100 / REPS, durations = [88, 104, 96], offsets = [0.05, 0.4, 0.7];
      q(".track", stage).forEach(function (el, i) {
        if (axis === "x" && i > 1) return;
        var up = i % 2 === 0, from = {}, to = {};
        from[prop] = up ? 0 : end;
        to[prop] = up ? end : 0; to.duration = durations[i % 3]; to.ease = "none"; to.repeat = -1;
        gsap.set(el, from);
        gsap.to(el, to).progress(offsets[i % 3]);
      });
    };
    mm.add("(min-width: 900px)", function () { drift("y"); });
    mm.add("(max-width: 899px)", function () { drift("x"); });
  }
  function pauseDrift(p) {
    q(".track", stage).forEach(function (t) { gsap.getTweensOf(t).forEach(function (tw) { tw.paused(p); }); });
  }

  /* ---------- Entrance choreography (logo intro, then the screen) ---------- */
  function runEntrance() {
    if (reduce) return;
    var etl = gsap.timeline();
    var intro = stage.querySelector(".intro");

    function revealEntrance(at) {
      etl.fromTo(q(".col", stage), { y: function (i) { return i % 2 ? -64 : 64; }, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.08 }, at);
      etl.fromTo(q(".wi", stage), { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.95, ease: "expo.out", stagger: 0.035 }, at + 0.05);
      etl.fromTo(q(".fade", stage), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.08 }, at + 0.35);
    }
    if (skipIntro || !intro) { revealEntrance(0); return; }

    try { sessionStorage.setItem("intro-seen", "1"); } catch (e) {}

    /* 1.6s logo intro, then the plane lifts away over an entrance already in place */
    etl.fromTo(q(".intro .ch", stage), { yPercent: 112 }, { yPercent: 0, duration: 0.7, ease: "expo.out", stagger: 0.045 }, 0);
    etl.fromTo(q(".intro .rule", stage), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.inOut" }, 0.3);
    etl.to(q(".intro .lockup", stage), { y: -20, opacity: 0, duration: 0.35, ease: "power2.in" }, 0.95);
    etl.to(intro, { yPercent: -100, duration: 0.6, ease: "expo.inOut" }, 1.0);
    etl.set(intro, { visibility: "hidden" }, 1.6);
    revealEntrance(1.12);

    function skip() {
      if (etl.time() < 1.6) etl.timeScale(4);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    }
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    etl.eventCallback("onComplete", function () {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    });
  }
  runEntrance();

  /* =====================================================
     HERO: one video wall that fills the screen, held in place for two pages.
     Page 1: the wall powers on.  Page 2: the outer screens lose power and the logo takes over the wall.
     ===================================================== */
  var LAYOUTS = {
    wide: { cols: 12, rows: "minmax(0,1fr) repeat(6, calc((100vw - 2 * var(--gap)) / 24)) minmax(0,1fr)",
      sites: [[1, 3, 1, 1, "L1"], [4, 3, 1, 1, "T1"], [7, 3, 1, 1, "T2"], [10, 3, 1, 1, "R3"],
              [1, 2, 2, 3, "L2"], [1, 2, 5, 3, "L3"], [11, 2, 2, 3, "R4"], [11, 2, 5, 3, "T4"],
              [1, 3, 8, 1, "B3"], [4, 3, 8, 1, "B2"], [7, 3, 8, 1, "B5"], [10, 3, 8, 1, "B6"]],
      logo: { c0: 3, r0: 2, cs: 2, rs: 2 } },
    tall: { cols: 4, rows: "minmax(0,1fr) minmax(0,1fr) repeat(3, calc((100vw - 2 * var(--gap)) / 8)) minmax(0,1fr) minmax(0,1fr)",
      sites: [[1, 2, 1, 1, "T1"], [3, 2, 1, 1, "L1"], [1, 2, 2, 1, "R3"], [3, 2, 2, 1, "T2"],
              [1, 2, 6, 1, "B2"], [3, 2, 6, 1, "L4"], [1, 2, 7, 1, "R4"], [3, 2, 7, 1, "B5"]],
      logo: { c0: 1, r0: 3, cs: 1, rs: 1 } }
  };
  var PAGE_BASE = 960;
  var PAGE_BY_ID = {};
  PAGES.forEach(function (p) { PAGE_BY_ID[p.id] = p; });

  (function () {
    try {
      var c = document.createElement("canvas"); c.width = 160; c.height = 100;
      var x = c.getContext("2d"), im = x.createImageData(160, 100);
      for (var i = 0; i < im.data.length; i += 4) { var v = Math.pow(Math.random(), 1.4) * 220; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0);
      html.style.setProperty("--snow", "url(" + c.toDataURL() + ")");
    } catch (e) {}
  })();

  var hx = $("#top"), hxBox = $("#hxBox"), wallDefs = $("#wallDefs");
  var frameLoads = [];
  var mons = [], grid = null, world = null, layoutKey = "";
  /* phase: off -> intro -> waveWait -> wave -> done */
  var phase = "off", introDone = false, lit = false, calm = reduce;
  var introTl = null, waveTl = null, autoTimer = 0, waveTimer = 0, origin = null;
  try { if (sessionStorage.getItem("fx-off") === "1") calm = true; } catch (e) {}

  function makeFrame(p) {
    var f = document.createElement("iframe");
    f.className = "mon-frame";
    f.setAttribute("tabindex", "-1");
    f.setAttribute("aria-hidden", "true");
    f.setAttribute("scrolling", "no");
    f.setAttribute("title", p.title);
    f.style.width = PAGE_BASE + "px"; f.style.height = Math.round(PAGE_BASE * 0.6) + "px";
    frameLoads.push(new Promise(function (res) { f.addEventListener("load", res, { once: true }); setTimeout(res, 5000); }));
    setTimeout(function () { f.src = PAGE_DIR + p.id + ".html?wall"; }, 0);   /* after it is in the page, so it loads once */
    return f;
  }

  function makeMonitor(kind, page, c, r, ui) {
    var el = document.createElement("div");
    el.className = "mon mon-" + kind;
    var inner = document.createElement("div"); inner.className = "mon-in";
    var scr = document.createElement("div"); scr.className = "mon-scr";
    var content;
    if (kind === "site") {
      content = makeFrame(page);
      el.dataset.id = page.id;
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", page.title + " (design concept)");
    } else {
      content = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      content.setAttribute("preserveAspectRatio", "none");
    }
    if (kind === "logo") scr.insertAdjacentHTML("beforeend", '<div class="m-wave m-logowave"><img alt=""></div>');
    scr.appendChild(content);
    scr.insertAdjacentHTML("beforeend",
      (ui ? '<span class="hx-ui"><i></i><b></b><b></b><b></b></span>' : "") +
      '<span class="m m-static"></span><span class="m m-text"></span><span class="m m-dim"></span>' +
      '<span class="m m-load"><i></i><b>BUFFERING</b></span><span class="m m-fill"></span>' +
      '<div class="m m-big"><div class="m-wave"><img alt=""></div><svg class="m-bigsvg" preserveAspectRatio="none"></svg></div>' +
      '<span class="m-shade"></span><span class="m-off"></span><span class="m-flash"></span><span class="m-glass"></span>');
    inner.appendChild(scr);
    inner.insertAdjacentHTML("beforeend", '<span class="m-led"></span>');
    el.appendChild(inner);
    var m = { el: el, inner: inner, scr: scr, content: content, kind: kind, page: page, c: c, r: r,
      off: scr.querySelector(".m-off"), flash: scr.querySelector(".m-flash"), stat: scr.querySelector(".m-static"), text: scr.querySelector(".m-text"),
      dim: scr.querySelector(".m-dim"), load: scr.querySelector(".m-load"), fill: scr.querySelector(".m-fill"), big: scr.querySelector(".m-big"),
      bigSvg: scr.querySelector(".m-bigsvg"), bigImg: scr.querySelector(".m-big img"), waveImg: kind === "logo" ? scr.querySelector(".m-logowave img") : null, mode: null };
    gsap.set(inner, { transformPerspective: 900 });
    var act = function () {
      if (phase === "off") powerOn(m, false);
      else if (phase === "waveWait") startWave(m);
      else if (lit && !onPage2 && kind === "site") openPage(page, el);
    };
    el.addEventListener("click", act);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
    return m;
  }

  function place(m, col, cspan, row, rspan) {
    m.el.style.gridColumn = col + " / span " + cspan;
    m.el.style.gridRow = row + " / span " + rspan;
  }
  function buildGrid(key) {
    var L = LAYOUTS[key];
    layoutKey = key;
    world = document.createElement("div"); world.className = "hx-world";
    grid = document.createElement("div"); grid.className = "hx-grid";
    grid.style.gridTemplateColumns = "repeat(" + L.cols + ", minmax(0,1fr))";
    grid.style.gridTemplateRows = L.rows;
    mons = [];
    L.sites.forEach(function (s) {
      var m = makeMonitor("site", PAGE_BY_ID[s[4]], 0, 0, false);
      place(m, s[0], s[1], s[2], s[3]);
      grid.appendChild(m.el); mons.push(m);
    });
    for (var tr = 0; tr < 3; tr++) {
      for (var tc = 0; tc < 4; tc++) {
        var m = makeMonitor("logo", null, tc, tr, tr !== 1);
        place(m, L.logo.c0 + tc * L.logo.cs, L.logo.cs, L.logo.r0 + tr * L.logo.rs, L.logo.rs);
        grid.appendChild(m.el); mons.push(m);
      }
    }
    world.appendChild(grid);
    hxBox.appendChild(world);
    layoutGrid();
  }
  function sites() { return mons.filter(function (m) { return m.kind === "site"; }); }
  function logos() { return mons.filter(function (m) { return m.kind === "logo"; }); }

  /* ---------- wordmarks ---------- */
  var WORD = "JIEWEITECH";
  var letters = WORD.split("").map(function () { return { dy: 0, o: 1, sy: 1, s: 1 }; });
  var wordShift = { x: 0 };
  var LG = null;
  var FONT_ATTR = "font-family=\"'Inter Variable', Inter, 'Arial Black', sans-serif\" font-weight=\"900\"";

  function measureAdvances(fs) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg");
    s.setAttribute("width", "0"); s.setAttribute("height", "0");
    s.style.position = "absolute"; s.style.visibility = "hidden";
    document.body.appendChild(s);
    var adv = WORD.split("").map(function (ch) {
      var t = document.createElementNS(ns, "text");
      t.setAttribute("font-family", "'Inter Variable', Inter, 'Arial Black', sans-serif");
      t.setAttribute("font-weight", "900"); t.setAttribute("font-size", fs);
      t.textContent = ch; s.appendChild(t);
      var w = 0; try { w = t.getComputedTextLength(); } catch (e) {}
      return w || fs * 0.62;
    });
    s.remove();
    return adv;
  }
  function writeLetter(i) {
    if (!LG) return;
    var el = wallDefs.querySelector("#wl" + i);
    if (!el) return;
    var L = letters[i], sx = (i % 2 ? 1 : -1) * wordShift.x;
    var cx = LG.xs[i] + LG.adv[i] * LG.k / 2, cy = LG.base - LG.cap / 2, s = L.s == null ? 1 : L.s;
    el.setAttribute("transform", "translate(" + cx + "," + cy + ") scale(" + s + ") translate(" + (-cx) + "," + (-cy) + ") " +
      "translate(" + (LG.xs[i] + sx) + "," + (LG.base + L.dy * LG.H) + ") scale(" + LG.k + "," + L.sy + ")");
    el.setAttribute("opacity", L.o);
  }
  function writeLetters() { for (var i = 0; i < WORD.length; i++) writeLetter(i); }

  function union(list) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    var rects = list.map(function (m) {
      var b = m.scr.getBoundingClientRect();
      x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom);
      return b;
    });
    return { x0: x0, y0: y0, W: Math.max(1, x1 - x0), H: Math.max(1, y1 - y0), rects: rects };
  }

  /* ---------- the moving sky behind the logo ----------
     The waves are drawn once into an image; each screen shows its slice of that image and the slices
     drift together with a GPU-only transform, so the movement costs almost nothing. */
  var waveUrls = {};
  function waveUrl(kind) {
    if (waveUrls[kind]) return waveUrls[kind];
    var art = document.getElementById("wallArt"), defs = art.parentNode.cloneNode(true);
    defs.querySelector("#wallArt").remove();
    var waves = art.innerHTML.replace(/<text[\s\S]*?<\/text>/, "");
    var d = defs.innerHTML;
    if (kind === "big") {
      /* the deeper sky of the reference wall, with brighter silk and a long highlight */
      d = d.replace(/<linearGradient id="wbg"[\s\S]*?<\/linearGradient>/,
        '<linearGradient id="wbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f7fd4"/><stop offset=".45" stop-color="#6fa7e6"/><stop offset="1" stop-color="#b3d3f5"/></linearGradient>');
      waves += '<path d="M430 120 C560 80 700 40 840 -5" stroke="#ffffff" stroke-opacity=".85" stroke-width="2.2" fill="none" filter="url(#wb3)"/>' +
               '<path d="M-20 200 C120 150 260 230 420 190 C560 156 700 200 840 170" stroke="#ffffff" stroke-opacity=".5" stroke-width="14" fill="none" filter="url(#wb8)"/>';
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 823 290" width="1646" height="580" preserveAspectRatio="none"><defs>' + d + "</defs>" + waves + "</svg>";
    waveUrls[kind] = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    return waveUrls[kind];
  }
  var WAVE_PAD = 0.05;   /* the image is a little larger than the wall so it can drift */
  function placeWave(img, b, U, kind) {
    var px = U.W * WAVE_PAD, py = U.H * WAVE_PAD;
    img.src = waveUrl(kind);
    img.style.width = (U.W + 2 * px) + "px"; img.style.height = (U.H + 2 * py) + "px";
    img.style.left = (-(b.left - U.x0) - px) + "px"; img.style.top = (-(b.top - U.y0) - py) + "px";
  }

  function layoutGrid() {
    if (!grid) return;
    var savedBox = hxBox.style.transform; hxBox.style.transform = "none";
    /* the logo wall's letters (the sky is the image layer underneath) */
    var lg = logos(), U = union(lg), W = U.W, H = U.H;
    var cap = Math.min(0.395 * H, 0.2 * W), fs = cap / 0.727;
    var adv = measureAdvances(fs), N = adv.reduce(function (a, b) { return a + b; }, 0);
    var k = Math.min(1, (0.92 * W) / N), xs = [], acc = (W - k * N) / 2;
    adv.forEach(function (a) { xs.push(acc); acc += a * k; });
    LG = { xs: xs, base: H * 0.645, k: k, H: H, W: W, adv: adv, cap: cap };
    var glyphs = WORD.split("").map(function (ch, i) { return '<text id="wl' + i + '" x="0" y="0" ' + FONT_ATTR + ' font-size="' + fs + '" fill="#050505">' + ch + "</text>"; }).join("");
    /* the whole wall as one giant logo, for page 2 (laid out like the reference wall) */
    var A = union(mons), BW = A.W, BH = A.H, bigText;
    if (BH <= BW) {
      var bcap = Math.min(0.34 * BH, 0.19 * BW), bfs = bcap / 0.727, btl = 0.86 * BW;
      bigText = '<text x="' + (BW - btl) / 2 + '" y="' + (BH * 0.42 + bcap / 2) + '" textLength="' + btl + '" lengthAdjust="spacingAndGlyphs" ' + FONT_ATTR + ' font-size="' + bfs + '" fill="#050505">' + WORD + "</text>";
    } else {
      var tcap = Math.min(0.2 * BH, 0.3 * BW), tfs = tcap / 0.727, tl1 = 0.88 * BW, gapY = tcap * 0.28;
      var yA = BH * 0.44 - gapY / 2, yB = yA + tcap + gapY;
      bigText = '<text x="' + (BW - tl1) / 2 + '" y="' + yA + '" textLength="' + tl1 + '" lengthAdjust="spacingAndGlyphs" ' + FONT_ATTR + ' font-size="' + tfs + '" fill="#050505">JIEWEI</text>' +
        '<text x="' + (BW - tl1) / 2 + '" y="' + yB + '" textLength="' + tl1 + '" lengthAdjust="spacingAndGlyphs" ' + FONT_ATTR + ' font-size="' + tfs + '" fill="#050505">TECH</text>';
    }
    /* the reflection on the floor: the big wall upside down, with its bezels */
    var G = grid.getBoundingClientRect(), bezels = "";
    mons.forEach(function (m, i) {
      var b = A.rects[i];
      bezels += '<rect x="' + (b.left - G.left) + '" y="' + (b.top - G.top) + '" width="' + b.width + '" height="' + b.height + '"/>';
    });
    wallDefs.innerHTML =
      '<symbol id="wallArt2" viewBox="0 0 ' + W + " " + H + '" overflow="hidden">' + glyphs + "</symbol>" +
      '<symbol id="wallBig" viewBox="0 0 ' + BW + " " + BH + '" overflow="hidden">' + bigText + "</symbol>" +
      '<symbol id="wallRefl" viewBox="0 0 ' + G.width + " " + G.height + '"><rect width="' + G.width + '" height="' + G.height + '" fill="#000"/>' +
        '<clipPath id="reflClip">' + bezels + '</clipPath>' +
        '<g clip-path="url(#reflClip)"><image href="' + waveUrl("big") + '" x="' + (A.x0 - G.left) + '" y="' + (A.y0 - G.top) + '" width="' + BW + '" height="' + BH + '" preserveAspectRatio="none"/>' +
        '<g transform="translate(' + (A.x0 - G.left) + "," + (A.y0 - G.top) + ')">' + bigText + "</g></g></symbol>";
    writeLetters();
    lg.forEach(function (m, i) {
      var b = U.rects[i];
      m.content.setAttribute("viewBox", (b.left - U.x0) + " " + (b.top - U.y0) + " " + b.width + " " + b.height);
      m.content.innerHTML = '<use href="#wallArt2" width="' + W + '" height="' + H + '"/>';
      placeWave(m.waveImg, b, U, "logo");
    });
    mons.forEach(function (m, i) {
      var b = A.rects[i];
      m.bigSvg.setAttribute("viewBox", (b.left - A.x0) + " " + (b.top - A.y0) + " " + b.width + " " + b.height);
      m.bigSvg.innerHTML = '<use href="#wallBig" width="' + BW + '" height="' + BH + '"/>';
      placeWave(m.bigImg, b, A, "big");
      m.cx = (b.left + b.width / 2 - A.x0) / (BW / 6); m.cy = (b.top + b.height / 2 - A.y0) / (BW / 6);
      if (m.kind === "site" && b.width) {
        m.content.style.height = Math.round(PAGE_BASE * b.height / b.width) + "px";
        m.content.style.transform = "scale(" + (b.width / PAGE_BASE) + ")";
      }
    });
    world._A = A; world._G = G;
    layoutFloor();
    hxBox.style.transform = savedBox;
  }

  /* page 2: the wall lifts a little and a glossy floor appears underneath, like the reference */
  var floor = $("#hxFloor"), P2_SCALE = 0.8;
  function layoutFloor() {
    if (!world || !world._G) return;
    var G = world._G, box = hxBox.getBoundingClientRect(), sticky = floor.parentNode.getBoundingClientRect();
    var top = (box.top - sticky.top) + box.height * P2_SCALE;
    floor.style.top = top + "px";
    var svg = floor.querySelector("svg");
    /* a floor reflection is foreshortened, so the mirrored wall is squashed to fit the floor */
    var w = G.width * P2_SCALE, h = Math.max(40, (sticky.bottom - sticky.top - top)) * 1.25;
    svg.setAttribute("viewBox", "0 0 " + G.width + " " + G.height);
    svg.style.width = w + "px"; svg.style.height = h + "px";
    svg.style.left = ((sticky.width - w) / 2) + "px";
    svg.innerHTML = '<g transform="translate(0,' + G.height + ') scale(1,-1)"><use href="#wallRefl" width="' + G.width + '" height="' + G.height + '"/></g>';
  }

  /* the drift: one slow tween per sky, running only while that sky can be seen */
  var waveLogoTw = null, waveBigTw = null, heroVisible = true;
  function startWaves() {
    if (reduce || waveLogoTw || !grid) return;
    var lgImgs = logos().map(function (m) { return m.waveImg; }), bigImgs = mons.map(function (m) { return m.bigImg; });
    var U = union(logos()), A = world._A || union(mons);
    var mk = function (imgs, W, H) {
      return gsap.timeline({ repeat: -1, yoyo: true, paused: true, defaults: { ease: "sine.inOut" } })
        .fromTo(imgs, { x: W * WAVE_PAD * 0.8, y: -H * WAVE_PAD * 0.25 }, { x: -W * WAVE_PAD * 0.8, y: H * WAVE_PAD * 0.25, duration: 11, force3D: true });
    };
    waveLogoTw = mk(lgImgs, U.W, U.H);
    waveBigTw = mk(bigImgs, A.W, A.H);
    syncWaves();
  }
  function stopWaves() {
    if (waveLogoTw) { waveLogoTw.kill(); waveLogoTw = null; }
    if (waveBigTw) { waveBigTw.kill(); waveBigTw = null; }
  }
  function syncWaves() {
    if (!waveLogoTw) return;
    var showBig = onPage2 && heroVisible, showLogo = !onPage2 && heroVisible;
    waveLogoTw.paused(!showLogo); waveBigTw.paused(!showBig);
    hx.classList.toggle("waves-big", showBig); hx.classList.toggle("waves-logo", showLogo);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; syncWaves(); }).observe(hx.querySelector(".hx-sticky"));
  }

  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('900 100px "Inter Variable"')]).then(function () { layoutGrid(); if (p2) { var on = onPage2; resetPage2(); if (on) page2(true, true); } stopWaves(); if (activated) startWaves(); });

  /* ---------- states ---------- */
  function setFramed(m, on) { m.el.classList.toggle("framed", on); }
  function hideModes(m) { gsap.set([m.stat, m.text, m.dim, m.load, m.flash, m.fill, m.big], { opacity: 0 }); }
  function resetOff(m, op) { m.off.classList.remove("mk-iris", "mk-blinds"); gsap.set(m.off, { opacity: op, clipPath: "none", "--r": "0%", "--b": "0px" }); gsap.set(m.scr, { x: 0 }); gsap.set(m.inner, { rotationY: 0, rotationX: 0, scale: 1 }); }
  function allOff() {
    hx.classList.add("is-off"); hx.classList.remove("is-lit");
    mons.forEach(function (m) { setFramed(m, true); resetOff(m, 1); hideModes(m); });
    letters.forEach(function (L) { L.dy = 0.75; L.o = 0; L.sy = 1; L.s = 1; }); wordShift.x = 0; writeLetters();
    lit = false;
  }
  function allLit() {
    hx.classList.remove("is-off"); hx.classList.add("is-lit");
    mons.forEach(function (m) { setFramed(m, true); resetOff(m, 0); hideModes(m); });
    letters.forEach(function (L) { L.dy = 0; L.o = 1; L.sy = 1; L.s = 1; }); wordShift.x = 0; writeLetters();
    lit = true;
  }

  /* ---------- scrambled text ---------- */
  var GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@0123456789ABCDEFXZ";
  var PHRASES = ["NO SIGNAL", "SIGNAL LOST", "JIEWEITECH", "SYNC 24 DISPLAYS", "LOADING PAGE", "RENDER://WALL", "0x7F3A 0x00C1",
    "CHANNEL 03", "INPUT HDMI-1", "BUFFER 98%", "DESIGN // TECH", "REBOOTING", "TRACKING ERROR", "STANDBY", "CONNECTING", "RETRY 03"];
  function scramble(t, res) {
    var s = "";
    for (var i = 0; i < t.length; i++) s += (t[i] === " " || Math.random() < res) ? t[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    return s;
  }
  var ticker = 0;
  function startTicker() {
    var texts = mons.filter(function (m) { return m.mode === "text"; });
    texts.forEach(function (m, i) {
      m.text.innerHTML = ""; m._lines = [];
      for (var k = 0; k < 7; k++) { var s = document.createElement("span"); s._t = PHRASES[(i * 3 + k) % PHRASES.length]; m.text.appendChild(s); m._lines.push(s); }
    });
    stopTicker();
    ticker = setInterval(function () {
      texts.forEach(function (m) { m._lines.forEach(function (s) { s.textContent = scramble(s._t, Math.random() * 0.7); s.style.opacity = Math.random() < 0.12 ? 0.2 : 1; }); });
    }, 90);
  }
  function stopTicker() { if (ticker) { clearInterval(ticker); ticker = 0; } }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function assignModes() {
    var kinds = ["static", "text", "dim", "load"], weights = [0.34, 0.26, 0.2, 0.2];
    shuffle(mons.map(function (m, i) { return i; })).forEach(function (idx, k) {
      var f = k / mons.length, acc = 0, pick = kinds[0];
      for (var w = 0; w < kinds.length; w++) { acc += weights[w]; if (f < acc) { pick = kinds[w]; break; } }
      mons[idx].mode = pick;
    });
  }
  function modeEl(m) { return { "static": m.stat, text: m.text, dim: m.dim, load: m.load }[m.mode]; }

  /* ---------- nine ways a screen can switch on ---------- */
  var VARIANTS = ["crt", "wipeDown", "flicker", "iris", "fade", "wipeRight", "blinds", "glitch", "wipeUp"];
  function variantDeck(n) { var d = []; while (d.length < n) d = d.concat(shuffle(VARIANTS.slice())); return d; }
  function reveal(T, m, s, v) {
    var off = m.off;
    switch (v) {
      case "crt":
        T.set(m.flash, { opacity: 1, scaleY: 0.02, scaleX: 0.15 }, s);
        T.to(m.flash, { scaleX: 1, duration: 0.12, ease: "power2.out" }, s);
        T.set(off, { opacity: 0 }, s + 0.14);
        T.to(m.flash, { scaleY: 1, opacity: 0, duration: 0.38, ease: "power2.out" }, s + 0.12);
        return 0.5;
      case "wipeDown":
        T.fromTo(off, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(100% 0% 0% 0%)", duration: 0.5, ease: "power2.inOut", immediateRender: false }, s);
        T.set(off, { opacity: 0, clipPath: "none" }, s + 0.5); return 0.5;
      case "wipeUp":
        T.fromTo(off, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.5, ease: "power2.inOut", immediateRender: false }, s);
        T.set(off, { opacity: 0, clipPath: "none" }, s + 0.5); return 0.5;
      case "wipeRight":
        T.fromTo(off, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 100%)", duration: 0.45, ease: "power3.inOut", immediateRender: false }, s);
        T.set(off, { opacity: 0, clipPath: "none" }, s + 0.45); return 0.45;
      case "flicker":
        T.to(off, { keyframes: [{ opacity: 0.4, duration: 0.07 }, { opacity: 0.85, duration: 0.09 }, { opacity: 0.25, duration: 0.07 }, { opacity: 0.6, duration: 0.1 }, { opacity: 0, duration: 0.25 }] }, s);
        return 0.58;
      case "iris":
        T.call(function () { off.classList.add("mk-iris"); }, null, s);
        T.fromTo(off, { "--r": "0%" }, { "--r": "85%", duration: 0.55, ease: "power2.out", immediateRender: false }, s);
        T.call(function () { off.classList.remove("mk-iris"); }, null, s + 0.56);
        T.set(off, { opacity: 0, "--r": "0%" }, s + 0.56); return 0.56;
      case "blinds":
        T.call(function () { off.classList.add("mk-blinds"); }, null, s);
        T.fromTo(off, { "--b": "0px" }, { "--b": "10px", duration: 0.5, ease: "power1.inOut", immediateRender: false }, s);
        T.call(function () { off.classList.remove("mk-blinds"); }, null, s + 0.51);
        T.set(off, { opacity: 0, "--b": "0px" }, s + 0.51); return 0.51;
      case "glitch":
        T.to(off, { keyframes: [{ opacity: 0, duration: 0.04 }, { opacity: 0.75, duration: 0.05 }, { opacity: 0, duration: 0.05 }, { opacity: 0.4, duration: 0.04 }, { opacity: 0, duration: 0.06 }] }, s);
        T.to(m.scr, { keyframes: [{ x: -6, duration: 0.04 }, { x: 5, duration: 0.04 }, { x: -3, duration: 0.05 }, { x: 0, duration: 0.07 }] }, s);
        return 0.25;
      default:
        T.to(off, { opacity: 0, duration: 0.5, ease: "power1.out" }, s); return 0.5;
    }
  }

  /* a monitor flips over like a page: black on the way out, the new face on the way back */
  function flip(T, m, s, axis, dir, mid) {
    var p = axis === "x" ? "rotationX" : "rotationY", a = {}, b = {}, c = {};
    a[p] = 90 * dir; a.duration = 0.26; a.ease = "power2.in";
    b[p] = -90 * dir; c[p] = 0; c.duration = 0.5; c.ease = "back.out(1.4)"; c.immediateRender = false;
    T.to(m.inner, a, s);
    mid(s + 0.26);
    T.fromTo(m.inner, b, c, s + 0.26);
    return 0.76;
  }
  function flipDir(m, o) {
    var dx = m.cx - o.cx, dy = m.cy - o.cy;
    return Math.abs(dx) >= Math.abs(dy) * 1.2 ? { axis: "y", dir: dx >= 0 ? 1 : -1 } : { axis: "x", dir: dy >= 0 ? -1 : 1 };
  }
  function dist(a, b) { return Math.hypot(a.cx - b.cx, a.cy - b.cy); }
  function topLeft(list) { return list.slice().sort(function (a, b) { return (a.cx + a.cy) - (b.cx + b.cy); })[0]; }

  /* ---------- the intro ---------- */
  function lockIntro(on) { html.classList.toggle("intro-lock", on); }

  var emergeTw = null;
  function armIntro() {
    if (introDone) return;
    phase = "off";
    lockIntro(true);
    allOff();
    gsap.set(nav, { autoAlpha: 0 });
    /* the room starts black, then the switched-off monitors emerge one by one */
    if (!reduce) {
      if (emergeTw) emergeTw.kill();
      emergeTw = gsap.fromTo(mons.map(function (m) { return m.inner; }), { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.out", delay: 0.9, stagger: { each: 0.06, from: "random" } });
    }
    clearTimeout(autoTimer);
    /* nobody clicked: it wakes by itself, from the top left */
    autoTimer = setTimeout(function () { if (phase === "off" && view === "home") powerOn(topLeft(mons), true); }, 5000);
    addEventListener("keydown", onSkipInput);
    addEventListener("wheel", onSkipInput, { passive: true });
  }
  function onSkipInput(e) {
    if (e.type === "keydown") {
      if (e.key === "Tab" || e.key === "Shift" || e.key === "Escape") return;
      if ((e.key === "Enter" || e.key === " ") && e.target.closest && e.target.closest(".mon")) return;
    }
    if (view !== "home" || introDone) return;
    skipIntroSeq();
  }
  function skipIntroSeq() {
    if (introTl) { introTl.kill(); introTl = null; }
    if (waveTl) { waveTl.kill(); waveTl = null; }
    if (!introDone) endIntro();
  }

  function powerOn(m, auto) {
    if (phase !== "off") return;
    phase = "intro";
    origin = auto ? null : m;
    if (emergeTw) { emergeTw.kill(); emergeTw = null; }
    gsap.set(mons.map(function (x) { return x.inner; }), { opacity: 1 });
    clearTimeout(autoTimer);
    hx.classList.remove("is-off");
    var lg = logos();
    var T = gsap.timeline();
    introTl = T;

    if (calm) {
      /* Effects off: no static, no flicker. The logo fades up, then the cases follow. */
      lg.forEach(function (x) { T.to(x.off, { opacity: 0, duration: 1 }, 0.3); });
      T.to(letters, { o: 1, dy: 0, duration: 1, stagger: 0.05, onUpdate: writeLetters }, 1.3);
      T.call(armWave, null, 0.3);
      return;
    }

    /* 1. Every screen switches on in its own way, rippling out from the click, into its own state. */
    hx.classList.add("fx-run");
    assignModes();
    startTicker();
    var deck = variantDeck(mons.length);
    mons.forEach(function (x, i) {
      var s = dist(x, m) * 0.11 + Math.random() * 0.06;
      T.set(modeEl(x), { opacity: 1 }, Math.max(0, s - 0.01));
      reveal(T, x, s, deck[i]);
    });
    /* 2. From the outer edge in, one ring a second: each ring flickers unevenly, then switches
          straight to the logo wall's blue. */
    var rings = ringsOf(mons), tRing = 3.0, ringGap = 1.0, flickLen = 0.55;
    rings.forEach(function (ring, k) {
      var s0 = tRing + k * ringGap;
      ring.forEach(function (x) {
        var t = s0 + Math.random() * 0.12, steps = [], n = 4 + ((Math.random() * 4) | 0), used = 0;
        for (var j = 0; j < n; j++) {
          var d = 0.03 + Math.random() * 0.1;
          if (used + d > flickLen - 0.04) break;
          used += d;
          steps.push({ opacity: j % 2 ? 0 : [1, 0.85, 0.55, 1][(Math.random() * 4) | 0], duration: d, ease: "none" });
        }
        steps.push({ opacity: 0, duration: 0.03, ease: "none" });
        T.to(x.fill, { keyframes: steps }, t);
        T.set(x.fill, { opacity: 1 }, s0 + flickLen + 0.06);
        T.set([x.stat, x.text, x.dim, x.load, x.flash], { opacity: 0 }, s0 + flickLen + 0.06);
      });
    });
    var allBlue = tRing + (rings.length - 1) * ringGap + flickLen + 0.06;
    T.call(function () { stopTicker(); hx.classList.remove("fx-run"); mons.forEach(function (x) { gsap.set(x.scr, { x: 0 }); }); }, null, allBlue);

    /* 3. Two seconds after the whole wall has turned blue, the logo arrives: the letters slam
          into the wall one after another, each impact jolts the wall, and the last one lands
          with a flash and a heavier shake. */
    var tLogo = allBlue + 2;
    T.call(armWave, null, tLogo);
    T.set(lg.map(function (x) { return x.fill; }), { opacity: 0 }, tLogo);
    lg.forEach(function (x) { T.fromTo(x.flash, { opacity: 0, scaleX: 1, scaleY: 1 }, { keyframes: [{ opacity: 0.6, duration: 0.04 }, { opacity: 0, duration: 0.35 }] }, tLogo); });
    T.set(letters, { o: 0, s: 3.2, dy: 0, sy: 1, onComplete: writeLetters }, tLogo);
    var order = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
    var hit = 0;
    order.forEach(function (i, k) {
      var s = tLogo + 0.08 + k * 0.085;
      T.to(letters[i], { s: 1, o: 1, duration: 0.26, ease: "power4.in", onUpdate: writeLetter, onUpdateParams: [i] }, s);
      hit = s + 0.26;
    });
    lg.forEach(function (x) { T.fromTo(x.flash, { opacity: 0, scaleX: 1, scaleY: 1 }, { keyframes: [{ opacity: 0.85, duration: 0.04 }, { opacity: 0, duration: 0.7, ease: "power2.out" }] }, hit); });
    sites().forEach(function (x) { T.fromTo(x.flash, { opacity: 0, scaleX: 1, scaleY: 1 }, { keyframes: [{ opacity: 0.45, duration: 0.05 }, { opacity: 0, duration: 0.55, ease: "power2.out" }] }, hit + Math.random() * 0.08); });
  }

  /* rings of monitors from the outer edge in: cluster by normalised distance from the centre */
  function ringsOf(list) {
    var core = list.filter(function (m) { return m.kind === "logo"; });
    var xs = core.map(function (m) { return m.cx; }), ys = core.map(function (m) { return m.cy; });
    var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    var hw = Math.max.apply(null, xs) - cx || 1, hh = Math.max.apply(null, ys) - cy || 1;
    var withD = list.map(function (m) {
      var d = m.kind === "site" ? 2 : Math.max(Math.abs(m.cx - cx) / hw, Math.abs(m.cy - cy) / hh);
      return { m: m, d: d };
    }).sort(function (a, b) { return b.d - a.d; });
    var out = [], last = null;
    withD.forEach(function (o) {
      if (last === null || last - o.d > 0.12) out.push([]);
      out[out.length - 1].push(o.m); last = o.d;
    });
    return out;
  }

  /* 4. Five seconds after the logo lights up, the cases flip on in a wave:
        from the screen that was clicked, or from the top left if nobody clicked.
        Clicking a dark screen during the wait starts the wave right there. */
  function armWave() {
    if (phase !== "intro") return;
    phase = "waveWait";
    clearTimeout(waveTimer);
    waveTimer = setTimeout(function () { startWave(origin || topLeft(sites())); }, 5000);
  }
  function startWave(o) {
    if (phase !== "waveWait") return;
    phase = "wave";
    clearTimeout(waveTimer);
    var list = sites().sort(function (a, b) { return dist(a, o) - dist(b, o); });
    var W = gsap.timeline({ onComplete: endIntro });
    waveTl = W;
    var end = 0;
    list.forEach(function (m) {
      var s = dist(m, o) * 0.13;
      if (calm) { W.to([m.off, m.fill], { opacity: 0, duration: 0.8 }, s); end = Math.max(end, s + 0.8); return; }
      var f = flipDir(m, o);
      end = Math.max(end, s + flip(W, m, s, f.axis, f.dir, function (t) { W.set([m.off, m.fill], { opacity: 0 }, t); }));
    });
    W.to(nav, { autoAlpha: 1, duration: 0.6 }, Math.max(0, end - 0.4));
  }

  var activated = false;
  function endIntro() {
    if (introTl) { introTl.kill(); introTl = null; }
    if (waveTl) { waveTl.kill(); waveTl = null; }
    clearTimeout(autoTimer); clearTimeout(waveTimer);
    stopTicker();
    hx.classList.remove("fx-run");
    removeEventListener("keydown", onSkipInput);
    removeEventListener("wheel", onSkipInput);
    if (emergeTw) { emergeTw.kill(); emergeTw = null; }
    allLit();
    gsap.set(mons.map(function (x) { return x.inner; }), { opacity: 1 });
    gsap.set(nav, { autoAlpha: 1 });
    phase = "done";
    lockIntro(false);
    introDone = true;
    wheelGate = true; lastWheel = performance.now();   /* momentum from a skipping scroll should not flip the page */
    activate();
    ScrollTrigger.refresh();
  }

  function heroReveal(t, at) {
    allLit();
    gsap.set(nav, { autoAlpha: 1 });
    t.fromTo(world, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.out" }, at);
    t.call(activate, null, at + 1.3);
  }

  /* ---------- after the wall is lit ---------- */
  var idle = [], unbindHover = function () {};
  function activate() {
    if (activated || !grid) return;
    activated = true;
    if (!reduce) { unbindHover = bindHover(); startGlitches(); startWaves(); }
  }
  function startGlitches() {
    var list = sites();
    var next = function () {
      if (!onPage2) {
        var m = list[(Math.random() * list.length) | 0];
        idle.push(gsap.timeline().to(m.stat, { opacity: 0.8, duration: 0.05 }).to(m.stat, { opacity: 0, duration: 0.3, ease: "power1.out" }, 0.2));
      }
      idle.push(gsap.delayedCall(2.5 + Math.random() * 3, next));
    };
    idle.push(gsap.delayedCall(3, next));
  }

  /* hover: the case comes forward a little and wobbles with the pointer; the others dim */
  var hovered = null;
  function bindHover() {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return function () {};
    var hs = sites().map(function (m) {
      var tilt = function (y, x) { gsap.to(m.inner, { rotationY: y, rotationX: x, duration: 0.6, ease: "power3.out", overwrite: "auto" }); };
      var on = function () {
        if (!lit || onPage2 || phase !== "done") return;
        hovered = m;
        m.el.classList.add("on"); grid.classList.add("hovering");
        gsap.to(m.inner, { scale: 1.05, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      };
      var move = function (e) {
        if (hovered !== m) return;
        var b = m.el.getBoundingClientRect();
        tilt(((e.clientX - b.left) / b.width - 0.5) * 12, -((e.clientY - b.top) / b.height - 0.5) * 4);
      };
      var off = function () {
        if (hovered === m) hovered = null;
        m.el.classList.remove("on"); grid.classList.remove("hovering");
        gsap.to(m.inner, { scale: 1, rotationY: 0, rotationX: 0, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      };
      m.el.addEventListener("pointerenter", on); m.el.addEventListener("pointermove", move); m.el.addEventListener("pointerleave", off);
      m.el.addEventListener("focus", on); m.el.addEventListener("blur", off);
      return [m, on, move, off];
    });
    return function () {
      hs.forEach(function (h) {
        h[0].el.removeEventListener("pointerenter", h[1]); h[0].el.removeEventListener("pointermove", h[2]); h[0].el.removeEventListener("pointerleave", h[3]);
        h[0].el.removeEventListener("focus", h[1]); h[0].el.removeEventListener("blur", h[3]);
      });
    };
  }
  function releaseHover() {
    if (!grid) return;
    grid.classList.remove("hovering");
    sites().forEach(function (m) {
      m.el.classList.remove("on");
      gsap.killTweensOf(m.inner);
      gsap.set(m.inner, { scale: 1, rotationX: 0, rotationY: 0 });
    });
    hovered = null;
  }

  /* ---------- page 2: the outer screens lose power, the logo takes the whole wall ---------- */
  var onPage2 = false, p2 = null;
  function buildPage2() {
    var T = gsap.timeline({ paused: true });
    var lg = logos();
    var c = lg.reduce(function (a, m) { a.cx += m.cx / lg.length; a.cy += m.cy / lg.length; return a; }, { cx: 0, cy: 0 });
    /* every screen flips over once, from the logo outward, and lands on its slice of the big logo */
    mons.slice().sort(function (a, b) { return dist(a, c) - dist(b, c); }).forEach(function (m) {
      var s = dist(m, c) * 0.06, f = flipDir(m, c);
      flip(T, m, s, f.axis, f.dir, function (t) { T.set(m.big, { opacity: 1 }, t); });
    });
    /* the wall lifts and the glossy floor slides into view */
    T.to(hxBox, { scale: P2_SCALE, duration: 0.85, ease: "power3.inOut", transformOrigin: "50% 0%" }, 0.12);
    T.fromTo(floor, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", immediateRender: false }, 0.35);
    T.call(syncWaves, null, 0.01);
    return T;
  }
  function page2(on, instant) {
    if (!grid || !introDone) return;
    if (on === onPage2 && !instant) return;
    onPage2 = on;
    releaseHover();
    if (!p2) p2 = buildPage2();
    syncWaves();
    if (instant || reduce) { p2.pause(); p2.progress(on ? 1 : 0); return; }
    if (on) p2.timeScale(1).play(); else p2.timeScale(1.6).reverse();
  }
  function resetPage2() {
    if (p2) { p2.pause(); p2.progress(0); p2.kill(); p2 = null; }
    onPage2 = false;
    gsap.set(hxBox, { clearProps: "transform" });
    gsap.set(floor, { autoAlpha: 0 });
  }

  var heroMM = gsap.matchMedia();
  heroMM.add({ wide: "(min-aspect-ratio: 1/1)", tall: "(max-aspect-ratio: 1/1)" }, function (ctx) {
    var key = ctx.conditions.wide ? "wide" : "tall";
    if (grid && layoutKey === key) return;
    var wasP2 = onPage2;
    resetPage2();
    buildGrid(key);
    if (introDone) { allLit(); activated = false; activate(); if (wasP2) page2(true, true); }
    else allOff();
    var raf = 0;
    var onResize = function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { layoutGrid(); }); };
    addEventListener("resize", onResize);
    return function () {
      removeEventListener("resize", onResize);
      unbindHover(); unbindHover = function () {};
      idle.forEach(function (t) { t.kill(); }); idle = [];
      stopWaves();
      if (introTl || waveTl || (!introDone && phase !== "off")) { skipIntroSeq(); }
      activated = false;
      if (world) { world.remove(); world = null; grid = null; mons = []; }
    };
  });

  /* ---------- page preview ---------- */
  var pv = $("#pv"), pvFrame = null, pvTitle = $("#pvTitle"), pvClose = $("#pvClose"), pvFrom = null;
  function openPage(p, from) {
    pvFrom = from;
    pvTitle.textContent = p.title;
    if (pvFrame) pvFrame.remove();
    pvFrame = document.createElement("iframe");
    pvFrame.className = "pv-frame";
    pvFrame.setAttribute("title", p.title);
    pvFrame.src = PAGE_DIR + p.id + ".html";
    pv.appendChild(pvFrame);
    pv.hidden = false;
    html.classList.add("pv-open");
    if (!reduce) gsap.fromTo(pv, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" });
    pvClose.focus();
  }
  function closePage() {
    if (pv.hidden) return;
    var done = function () { pv.hidden = true; if (pvFrame) { pvFrame.remove(); pvFrame = null; } html.classList.remove("pv-open"); if (pvFrom) pvFrom.focus({ preventScroll: true }); };
    if (reduce) done(); else gsap.to(pv, { opacity: 0, scale: 0.98, duration: 0.35, ease: "power2.in", onComplete: done });
  }
  pvClose.addEventListener("click", closePage);
  addEventListener("keydown", function (e) { if (e.key === "Escape") closePage(); });

  /* =====================================================
     FULL-PAGE SCROLLING: one step = one full page
     ===================================================== */
  var snapping = false, wheelGate = false, lastWheel = 0, snapProxy = { y: 0 }, touchY = null;
  function pageTop(el) { return el.getBoundingClientRect().top + window.pageYOffset; }
  function stops() {
    var vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    var list = [pageTop(hx), pageTop(hx) + vh];
    q("main > section:not(.hx), .site-foot", home).forEach(function (sec) {
      var top = pageTop(sec), bottom = top + sec.offsetHeight;
      for (var y = top; y < bottom - vh * 0.3; y += vh) list.push(y);
    });
    list.push(max);
    return list.map(function (y) { return Math.round(Math.max(0, Math.min(max, y))); })
      .sort(function (a, b) { return a - b; })
      .filter(function (y, i, a) { return i === 0 || y - a[i - 1] > 8; });
  }
  function nearest(list, y) {
    var best = 0;
    list.forEach(function (s, i) { if (Math.abs(s - y) < Math.abs(list[best] - y)) best = i; });
    return best;
  }
  function onStop(y) { page2(Math.abs(y - (pageTop(hx) + innerHeight)) < 10); }
  function snapTo(y, done) {
    snapping = true;
    onStop(y);
    snapProxy.y = window.pageYOffset;
    gsap.killTweensOf(snapProxy);
    gsap.to(snapProxy, {
      y: y, duration: reduce ? 0.01 : 0.95, ease: "power3.inOut",
      onUpdate: function () { window.scrollTo(0, snapProxy.y); },
      onComplete: function () { snapping = false; wheelGate = true; if (done) done(); }
    });
  }
  function step(dir) {
    var list = stops(), i = nearest(list, window.pageYOffset), j = Math.max(0, Math.min(list.length - 1, i + dir));
    if (j !== i) snapTo(list[j]);
  }
  function snapActive() {
    return view === "home" && !busy && !html.classList.contains("intro-lock") && pv.hidden && !menuOpen;
  }
  addEventListener("wheel", function (e) {
    if (!snapActive()) return;
    e.preventDefault();
    var now = performance.now(), gap = now - lastWheel;
    lastWheel = now;
    if (snapping) return;
    if (wheelGate) { if (gap < 220) return; wheelGate = false; }   /* let trackpad momentum die out */
    if (Math.abs(e.deltaY) < 3) return;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  addEventListener("keydown", function (e) {
    if (!snapActive() || e.defaultPrevented) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    var k = e.key, dir = 0;
    if (k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey && !(t.closest && t.closest(".mon, button, a")))) dir = 1;
    else if (k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey)) dir = -1;
    else if (k === "Home") { e.preventDefault(); if (!snapping) snapTo(stops()[0]); return; }
    else if (k === "End") { e.preventDefault(); var l = stops(); if (!snapping) snapTo(l[l.length - 1]); return; }
    if (!dir) return;
    e.preventDefault();
    if (!snapping) step(dir);
  });
  addEventListener("touchstart", function (e) { touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener("touchmove", function (e) { if (snapActive()) e.preventDefault(); }, { passive: false });
  addEventListener("touchend", function (e) {
    if (!snapActive() || touchY == null) return;
    var dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (Math.abs(dy) > 40 && !snapping) step(dy > 0 ? 1 : -1);
  });
  addEventListener("resize", function () {
    if (view !== "home" || snapping) return;
    var list = stops(); window.scrollTo(0, list[nearest(list, window.pageYOffset)]);
  });

  Promise.race([Promise.all(frameLoads), new Promise(function (res) { setTimeout(res, 4000); })])
    .then(function () { enterBtn.disabled = false; });

  function initScroll() {
    if (stInit) return;
    stInit = true;
    document.fonts && document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    if (reduce) return;
    q(".work .shot-inner", home).forEach(function (el) {
      gsap.fromTo(el, { scale: 1.12, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    gsap.to(".proc-rule", { scaleX: 1, duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: ".proc-rule", start: "top 92%", once: true } });
  }


  /* ---------- Nav: hide on scroll down, return on scroll up; anchors; mobile menu ---------- */
  var lastY = 0, menu = $("#menu"), menuBtn = $("#menuBtn"), menuOpen = false;
  addEventListener("scroll", function () {
    if (view !== "home" || busy) return;
    var y = window.pageYOffset, d = y - lastY;
    lastY = y;
  }, { passive: true });

  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle("open", open);
    menu.inert = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
    html.style.overflow = open ? "hidden" : "";
    if (open) nav.classList.remove("is-hidden");
  }
  menuBtn.addEventListener("click", function () { setMenu(!menuOpen); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) { setMenu(false); menuBtn.focus(); } });
  addEventListener("resize", function () { if (menuOpen && innerWidth >= 900) setMenu(false); });

  function goTo(id) {
    var t = id === "top" ? $("#top") : document.getElementById(id);
    if (!t) return;
    var y = Math.max(0, pageTop(t) - (t.classList.contains("row") ? nav.offsetHeight : 0));
    snapTo(y, function () { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); });
  }
  q("[data-go]", home).forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); if (menuOpen) setMenu(false); goTo(a.dataset.go); });
  });
  q("[data-top]", home).forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); if (menuOpen) setMenu(false); snapTo(0); });
  });
  $("#mailBtn").href = "mailto:" + CONTACT_EMAIL;
  $("#year").textContent = new Date().getFullYear();

  /* ---------- The transition: homepage is a layer on the same route ---------- */
  function finishEnter() {
    gsap.set([home, stage, veil], { clearProps: "all" });
    html.dataset.view = "home";
    pauseDrift(true);
    stage.inert = true; home.inert = false;
    window.scrollTo(0, 0);
    page2(false, true);
    lastY = 0; nav.classList.remove("is-hidden"); nav.classList.add("on-top");
    main.focus({ preventScroll: true });
    initScroll();
    ScrollTrigger.refresh();
    busy = false;
  }

  /* History entries make Back/Forward work. Some preview frames forbid changing the URL, so fall back gracefully. */
  function pushView(v) {
    try { history.pushState({ view: v }, "", "#" + v); return; } catch (e) {}
    try { history.pushState({ view: v }, ""); } catch (e) {}
  }

  function btnCircle() {
    var b = enterBtn.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
    return { x: x, y: y, r: Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 24 };
  }

  function enterHome(fromHistory) {
    if (busy || view === "home") return;
    busy = true; view = "home";
    if (!fromHistory) pushView("home");
    stage.inert = true; home.inert = true;
    gsap.set([home, stage, veil], { clearProps: "all" });
    html.dataset.view = "entering";
    window.scrollTo(0, 0);
    tl = gsap.timeline({ onComplete: finishEnter });
    if (reduce) {
      tl.fromTo(home, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0);
      tl.to(stage, { opacity: 0, duration: 0.3, ease: "power1.out" }, 0);
    } else {
      /* The dark wall spreads outward from the Enter Site button and swallows the entrance. */
      var c = btnCircle();
      tl.fromTo(home, { clipPath: "circle(0px at " + c.x + "px " + c.y + "px)" }, { clipPath: "circle(" + c.r + "px at " + c.x + "px " + c.y + "px)", duration: 1.2, ease: "power3.inOut" }, 0);
      tl.to(stage, { scale: 0.97, duration: 1.2, ease: "power3.inOut" }, 0);
      tl.to(veil, { opacity: 0.5, duration: 1.2, ease: "power2.out" }, 0);
    }
    /* The homepage arrives dark and waits for a click, the first time. */
    if (!introDone) armIntro();
    else heroReveal(gsap.timeline({ delay: 0.25 }), 0);
  }

  function finishLeave() {
    gsap.set([home, stage, veil], { clearProps: "all" });
    html.dataset.view = "entrance";
    stage.inert = false; home.inert = true;
    pauseDrift(false);
    enterBtn.focus({ preventScroll: true });
    busy = false;
  }

  function leaveHome() {
    if (busy || view !== "home") return;
    clearTimeout(autoTimer);
    if (introTl) skipIntroSeq();
    busy = true; view = "entrance";
    if (menuOpen) setMenu(false);
    var y = window.pageYOffset;
    stage.inert = true; home.inert = true;
    gsap.set([home, stage, veil], { clearProps: "all" });
    /* Keep the page where the visitor left it while it slides away. */
    home.style.setProperty("--shift", -y + "px");
    html.dataset.view = "leaving";
    window.scrollTo(0, 0);
    pauseDrift(false);
    tl = gsap.timeline({ onComplete: function () { home.style.removeProperty("--shift"); finishLeave(); } });
    if (reduce) {
      tl.fromTo(stage, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0);
      tl.to(home, { opacity: 0, duration: 0.3 }, 0);
    } else {
      /* and folds back into the button on the way out */
      var c = btnCircle();
      tl.fromTo(home, { clipPath: "circle(" + c.r + "px at " + c.x + "px " + c.y + "px)" }, { clipPath: "circle(0px at " + c.x + "px " + c.y + "px)", duration: 0.9, ease: "power3.inOut" }, 0);
      tl.fromTo(stage, { scale: 0.97 }, { scale: 1, duration: 0.9, ease: "power3.inOut" }, 0);
      tl.fromTo(veil, { opacity: 0.5 }, { opacity: 0, duration: 0.9, ease: "power2.out" }, 0);
    }
  }

  enterBtn.addEventListener("click", function () { enterHome(false); });

  /* Photosensitivity: effects can be switched off for this visit (always off with reduced motion). */
  var fxToggle = $("#fxToggle");
  function syncFx() {
    if (reduce) { fxToggle.textContent = "Effects are off (reduced motion is on)"; fxToggle.disabled = true; fxToggle.setAttribute("aria-pressed", "true"); return; }
    fxToggle.textContent = calm ? "Effects are off. Turn them back on" : "Turn effects off";
    fxToggle.setAttribute("aria-pressed", String(calm));
  }
  fxToggle.addEventListener("click", function () {
    calm = !calm;
    try { sessionStorage.setItem("fx-off", calm ? "1" : "0"); } catch (e) {}
    syncFx();
  });
  syncFx();

  try { history.scrollRestoration = "manual"; } catch (e) {}
  try { history.replaceState({ view: view }, ""); } catch (e) {}
  addEventListener("popstate", function (e) {
    var v = (e.state && e.state.view) || (location.hash === "#home" ? "home" : "entrance");
    if (busy && tl) tl.progress(1);
    if (v === "home" && view !== "home") enterHome(true);
    else if (v !== "home" && view === "home") leaveHome();
  });

  /* Loaded straight onto the homepage (reload on #home) */
  if (view === "home") {
    stage.inert = true; home.inert = false;
    pauseDrift(true);
    var t0 = gsap.timeline();
    if (!introDone) armIntro();
    else heroReveal(t0, 0.1);
    initScroll();
  }
})();
