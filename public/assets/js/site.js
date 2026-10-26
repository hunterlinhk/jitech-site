/* ===== Edit here ===== */
var BRAND = "JIEWEITECH";
// Company details live in the footer of each page and in contact.html; the contact form sends to the server (/api/inquiries).
// Pages under /es/ are one folder down, so file paths start from the site root (an absolute address, worked out once).
var ROOT = (function () { try { return new URL(document.documentElement.getAttribute("data-root") || "./", document.baseURI).href; } catch (e) { return document.documentElement.getAttribute("data-root") || ""; } })();
// Images for the "Selected work" section. Missing files show a labeled placeholder.
var SCREEN_DIR = ROOT + "assets/img/shots/";
// Two separate groups, so the two columns never show the same design.
// A design with a screenshot in assets/img/shots shows that; one without shows its live page instead.
var SCREENS = {
  left:  ["T1","L1","B3","R3","B5","L3","T2"],
  right: ["L2","T4","R4","B2","B6","L4"]
};
// Screenshots of the concept pages for the entrance wall (tools/make_shots.py regenerates them).
var SHOT_DIR = ROOT + "assets/img/shots/";
// Entrance wall tile width / height, cycled in order. All landscape.
var RATIOS = [1.6, 1.5, 1.6, 1.45, 1.6, 1.55, 1.5, 1.6];
// The 20 concept pages around the wall (generated; each one is a complete standalone document).
// Each one is a real page in /pages (tools/make_pages.py regenerates them).
var PAGE_DIR = ROOT + "pages/";
var PAGES = [{"id": "L1", "rect": [20, 58, 335, 232], "title": "Loomline · Apparel made to order"}, {"id": "L2", "rect": [20, 244, 308, 373], "title": "Atelier Nord · Clothing made to last"}, {"id": "L3", "rect": [20, 385, 304, 527], "title": "Ferro Precision · CNC parts on demand"}, {"id": "L4", "rect": [20, 541, 305, 688], "title": "Verde Wholesale · Produce for the trade"}, {"id": "T1", "rect": [354, 102, 656, 254], "title": "Wag & Co. · Food and gear for pets"}, {"id": "T2", "rect": [689, 68, 1017, 256], "title": "Nocturne · Time, kept in the dark"}, {"id": "T4", "rect": [1336, 62, 1654, 195], "title": "Atlas · Built for altitude"}, {"id": "R3", "rect": [1349, 372, 1654, 518], "title": "Ridgeline Packworks · Backpacks for your brand"}, {"id": "R4", "rect": [1336, 531, 1654, 645], "title": "Kiln · Roasted slow, poured loud"}, {"id": "B2", "rect": [322, 738, 586, 874], "title": "Maison Sable · Skin, simplified"}, {"id": "B3", "rect": [601, 634, 925, 785], "title": "Halden Flow · Industrial valves"}, {"id": "B5", "rect": [944, 622, 1303, 777], "title": "PawPro · Private-label pet products"}, {"id": "B6", "rect": [950, 793, 1317, 904], "title": "Meridian Trading · Housewares by the container"}];
// Selected-work frames. "crop" zooms into a detail (scale, and the origin in % of the frame).
var HERO = [
  {file:"screen-01.jpg", variant:0, ratio:1.6,  caption:"Design example"},
  {file:"screen-04.jpg", variant:0, ratio:1.25, caption:"Design example, detail", crop:{s:2.2, ox:0, oy:0}, deco:true},
  {file:"screen-02.jpg", variant:2, ratio:1.78, caption:"Design example"},
  {file:"screen-06.jpg", variant:5, ratio:1.5,  caption:"Design example, detail", crop:{s:2, ox:0, oy:0}, deco:true}
];
// "What we do": the image shown on the right while each service is hovered (in the same order as the services).
// These are stand-ins taken from the concept pages; put your own images in assets/img/services/ and list them here.
/* A photo for each service ("photo": fills the frame), or, until one exists, a homepage screenshot shown whole ("shot") */
var SERVICE_IMAGES = [
  {src:ROOT + "assets/img/shots/B6.jpg", alt:"Website development example", kind:"shot"},
  {src:ROOT + "assets/img/shots/L3.jpg", alt:"GEO optimization example", kind:"shot"},
  {src:ROOT + "assets/img/shots/R4.jpg", alt:"Standalone website example", kind:"shot"}
];
var WORK = [
  {file:"T1.jpg", variant:3, ratio:1.6, caption:"Wag & Co.", concept:true},
  {file:"B5.jpg", variant:5, ratio:1.6, caption:"PawPro", concept:true},
  {file:"T2.jpg", variant:2, ratio:1.6, caption:"Nocturne", concept:true},
  {file:"B3.jpg", variant:1, ratio:1.6, caption:"Halden Flow", concept:true}
];
/* ===================== */

(function () {
  "use strict";
  gsap.registerPlugin(ScrollTrigger);

  var REPS = 2, COLUMNS = 2;
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
    cap.className = "cap hfade";
    var setCap = function () { cap.textContent = o.concept ? I18N.t("designConcept") + " · " + o.caption : o.caption; };
    setCap(); document.addEventListener("langchange", setCap);
    if (fig.hasAttribute("data-work")) cap.classList.remove("hfade");
    fig.appendChild(cap);
  }
  q("[data-work]").forEach(function (f) { makeShotFrame(f, WORK[+f.dataset.work]); });

  /* ---------- "What we do": a picture for each service, swapped as the services are hovered ---------- */
  var svcRows = q(".services .row"), svcFrame = $("#svcFrame"), svcNum = $("#svcNum"), svcName = $("#svcName");
  var svcImgs = SERVICE_IMAGES.map(function (o, i) {
    var w = document.createElement("div"); w.className = "svc-img" + (o.kind === "shot" ? " is-shot" : "") + (i === 0 ? " is-on" : "");
    var img = new Image(); img.alt = ""; img.decoding = "async"; img.src = o.src;
    img.onerror = function () { w.classList.add("missing"); w.setAttribute("data-file", o.src); };
    w.appendChild(img); svcFrame.appendChild(w);
    return w;
  });
  var svcCur = 0, svcZ = 2;
  function setService(i, instant) {
    if (i < 0 || i >= svcRows.length || i === svcCur) return;
    var prev = svcCur; svcCur = i;
    svcRows.forEach(function (r, k) { r.classList.toggle("is-active", k === i); });
    svcNum.textContent = svcRows[i].querySelector(".num").textContent;
    svcName.textContent = svcRows[i].querySelector(".name").textContent;
    var w = svcImgs[i % svcImgs.length], img = w && w.querySelector("img");
    if (!w || svcImgs[prev % svcImgs.length] === w) return;
    gsap.killTweensOf([w, img]);
    w.style.zIndex = ++svcZ;
    w.classList.add("is-on");
    if (reduce || instant) { gsap.set(w, { clipPath: "inset(0% 0% 0% 0%)" }); gsap.set(img, { scale: 1 }); }
    else {
      /* the new picture wipes up over the old one and settles from a slight zoom */
      gsap.fromTo(w, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.75, ease: "expo.out" });
      gsap.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 1.1, ease: "expo.out" });
      gsap.fromTo([svcNum, svcName], { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out", stagger: 0.04 });
    }
  }
  svcRows.forEach(function (r, i) {
    r.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" || e.pointerType === "pen") setService(i); });
    r.addEventListener("click", function () { setService(i); });
    r.addEventListener("focusin", function () { setService(i); });
  });
  if (svcRows[0]) svcRows[0].classList.add("is-active");

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
  var liveTiles = [];
  function tile(id, i, dup) {
    var t = document.createElement("div");
    t.className = "tile";
    t.style.setProperty("--r", RATIOS[i % RATIOS.length]);
    if (dup) t.setAttribute("aria-hidden", "true");
    var img = new Image();
    img.alt = dup ? "" : "Website design concept";
    img.decoding = "async";
    /* no screenshot yet: show the page itself, laid out at desktop size and scaled into the tile */
    img.onerror = function () {
      img.remove();
      var f = document.createElement("iframe");
      f.className = "tile-live";
      f.setAttribute("tabindex", "-1"); f.setAttribute("aria-hidden", "true"); f.setAttribute("scrolling", "no");
      f.title = "";
      f.src = PAGE_DIR + id + ".html?wall";
      t.appendChild(f);
      liveTiles.push(t);
      fitLive(t);
    };
    // the build lists the screenshots that exist (data-shots), so missing ones go straight to the live page
    var known = html.getAttribute("data-shots");
    if (known !== null && (" " + known + " ").indexOf(" " + id + " ") < 0) { t.appendChild(img); img.onerror(); return t; }
    img.src = SHOT_DIR + id + ".jpg";
    t.appendChild(img);
    return t;
  }
  function fitLive(t) {
    var f = t.querySelector(".tile-live"), w = t.clientWidth, h = t.clientHeight;
    if (!f || !w) return;
    var s = w / 1440;
    f.style.width = "1440px"; f.style.height = Math.ceil(h / s) + "px";
    f.style.transform = "scale(" + s + ")";
  }
  addEventListener("resize", function () { liveTiles.forEach(fitLive); });
  ["left", "right"].forEach(function (side) {
    var col = document.createElement("div"); col.className = "col";
    var track = document.createElement("div"); track.className = "track";
    for (var rep = 0; rep < REPS; rep++) {
      var set = document.createElement("div"); set.className = "set";
      SCREENS[side].forEach(function (id, i) { set.appendChild(tile(id, i + (side === "right" ? 3 : 0), rep > 0)); });
      track.appendChild(set);
    }
    col.appendChild(track); wall.insertBefore(col, caption);
  });

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
  /* Each page on a monitor gets a desktop-sized window shaped like its screen (1440 wide, or 900 tall for
     squarer screens), then fills the screen from the top. Extreme shapes are clamped and cropped instead. */
  function frameFit(w, h) {
    var a = w / h, fw, fh;
    if (a >= 1.6) { fw = 1440; fh = Math.max(500, Math.round(1440 / a)); }
    else { fh = 900; fw = Math.max(1024, Math.round(900 * a)); }
    var sc = Math.max(w / fw, h / fh);
    return { w: fw, h: fh, s: sc, x: (w - fw * sc) / 2 };
  }
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
  var mons = [], grid = null, world = null, layoutKey = "", skyLogo = null;
  var shownIds = {};   /* which website examples are turned over (kept across layout changes) */
  /* phase: off -> intro -> done */
  var phase = "off", introDone = false, lit = false, calm = reduce;
  var introTl = null, autoTimer = 0;
  try { if (sessionStorage.getItem("fx-off") === "1") calm = true; } catch (e) {}

  function makeFrame(p) {
    var f = document.createElement("iframe");
    f.className = "mon-frame";
    f.setAttribute("tabindex", "-1");
    f.setAttribute("aria-hidden", "true");
    f.setAttribute("scrolling", "no");
    f.setAttribute("title", p.title);
    f.style.width = PAGE_BASE + "px"; f.style.height = Math.round(PAGE_BASE * 0.6) + "px";
    f.style.visibility = "hidden";
    f.dataset.src = PAGE_DIR + p.id + ".html?wall";   /* loaded once the homepage is opened, see loadFrames */
    f.addEventListener("load", function () { if (f.getAttribute("src")) { f._play = null; f._loaded = true; syncFrames(); } });
    return f;
  }

  /* ---------- keeping the wall light ----------
     The pages on the monitors load only once the homepage is opened, and a page animates only while its
     website is showing and the wall can be seen. On slower computers ("lite"), only a few screens animate
     at a time, taking turns, and the one under the pointer always plays.
     Turning a screen over stays smooth because nothing new has to be drawn mid-turn: once the wall is lit,
     each page plays its opening motion once behind its blue cover ("warming"), then rests there, already
     drawn; and a page holds still while its screen turns, starting to move once it has landed. */
  var framesWanted = false, warmNext = 0;
  function warm(f) {
    if (f._warmFrom != null) return;
    var now = performance.now(), start = lite ? Math.max(now, warmNext) : now;   /* slower computers warm one page at a time */
    f._warmFrom = start; f._warmUntil = start + 1500;
    if (lite) warmNext = start + 450;
    if (start > now) setTimeout(syncFrames, start - now + 10);
    setTimeout(syncFrames, f._warmUntil - now + 20);
  }
  function loadFrames() {
    framesWanted = true;
    sites().forEach(function (m) { if (!m.content.getAttribute("src")) m.content.src = m.content.dataset.src; });
  }
  var lite = false, liteForced = null, SPOT_N = 4, spot = [], spotTimer = 0, syncing = false;
  (function () {
    var qs = location.search;
    if (/[?&]lite\b/.test(qs)) liteForced = true; else if (/[?&]full\b/.test(qs)) liteForced = false;
    if (liteForced !== null) { lite = liteForced; return; }
    try { if (sessionStorage.getItem("wall-lite") === "1") { lite = true; return; } } catch (e) {}
    /* early hints: few processor cores, little memory, data saver, or no graphics acceleration */
    var cores = navigator.hardwareConcurrency || 8, mem = navigator.deviceMemory || 8, conn = navigator.connection;
    if (cores <= 4 || mem <= 4 || (conn && conn.saveData) || softwareGL()) lite = true;
  })();
  function softwareGL() {
    try {
      var gl = document.createElement("canvas").getContext("webgl");
      if (!gl) return true;
      var ext = gl.getExtension("WEBGL_debug_renderer_info");
      var r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
      var lose = gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext();
      return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(r);
    } catch (e) { return false; }
  }
  function wallWatched() { return view === "home" && heroVisible && lit && !!pv && pv.hidden && !document.hidden; }
  function syncFrames() {
    if (syncing || !grid) return;
    syncing = true;
    var list = sites(), watched = wallWatched();
    if (lite && watched && !spot.length && list.some(function (m) { return m.revealed; })) rotateSpot(true);
    list.forEach(function (m) {
      var f = m.content, show = m.revealed || m.flipping, ready = !!f._loaded && lit;
      f.style.visibility = show || ready ? "" : "hidden";   /* pages that haven't loaded yet aren't painted */
      if (ready && watched) warm(f);
      var t = performance.now(), warming = f._warmFrom != null && t >= f._warmFrom && t < f._warmUntil;
      var play = !!(f._loaded && watched && !m.flipping && (warming || (m.revealed && (!lite || m === hovered || spot.indexOf(m) > -1))));
      if (f._play === play || !f.contentWindow) return;
      f._play = play;
      try { f.contentWindow.postMessage({ wallPlay: play }, "*"); } catch (e) {}
    });
    syncing = false;
    watchPerf();
  }
  /* the spotlight: every three seconds the two screens that have played longest rest, and two others start */
  function rotateSpot(fill) {
    var pool = sites().filter(function (m) { return m.revealed; });
    spot = spot.filter(function (m) { return pool.indexOf(m) > -1; });
    if (!fill && spot.length >= SPOT_N) spot = spot.slice(2);
    var fresh = shuffle(pool.filter(function (m) { return spot.indexOf(m) < 0; }));
    while (spot.length < Math.min(SPOT_N, pool.length) && fresh.length) spot.push(fresh.shift());
    if (!fill) syncFrames();
  }
  function setLite(on) {
    lite = on;
    try { sessionStorage.setItem("wall-lite", on ? "1" : "0"); } catch (e) {}
    hx.classList.toggle("lite", on);
    if (on && !spotTimer) spotTimer = setInterval(function () { if (wallWatched()) rotateSpot(false); }, 3000);
    syncFrames();
  }
  /* measuring: while the websites are playing, frames per second are counted in 3-second windows.
     Two slow windows in a row (under 45 fps, or more than 1 in 10 frames taking over 50 ms) switch to lite. */
  var perf = { on: false, t0: 0, n: 0, long: 0, last: 0, bad: 0, quietUntil: 0 };
  function measuring() { return !lite && liteForced === null && wallWatched() && sites().some(function (m) { return m.revealed && !m.flipping; }); }
  function watchPerf() {
    if (perf.on || !measuring()) return;
    perf.on = true; perf.bad = 0; perf.quietUntil = performance.now() + 1200;   /* let the flips settle first */
    perf.t0 = perf.last = 0;
    requestAnimationFrame(perfLoop);
  }
  function perfLoop(t) {
    if (!measuring()) { perf.on = false; return; }
    if (t < perf.quietUntil || !perf.t0) { perf.t0 = perf.last = t; perf.n = perf.long = 0; requestAnimationFrame(perfLoop); return; }
    perf.n++; if (t - perf.last > 50) perf.long++; perf.last = t;
    if (t - perf.t0 >= 3000) {
      var fps = perf.n * 1000 / (t - perf.t0), slow = fps < 45 || perf.long > perf.n * 0.1;
      perf.bad = slow ? perf.bad + 1 : 0;
      perf.t0 = t; perf.n = perf.long = 0;
      if (perf.bad >= 2) { perf.on = false; setLite(true); return; }
    }
    requestAnimationFrame(perfLoop);
  }
  document.addEventListener("visibilitychange", syncFrames);

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
      el.setAttribute("aria-label", page.title + " (" + I18N.t("designConcept").toLowerCase() + ")");
    } else {
      content = document.createElement("span");   /* logo screens are windows onto the shared sky behind them */
      el.classList.add("win");
      if (c === 1 && r === 1) {
        /* one keyboard stop for the whole logo wall */
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-pressed", "false");
        el.setAttribute("aria-label", I18N.t("logoKey"));
        el.classList.add("logo-key");
      }
    }
    scr.appendChild(content);
    scr.insertAdjacentHTML("beforeend",
      (ui ? '<span class="hx-ui"><i></i><b></b><b></b><b></b></span>' : "") +
      '<span class="m m-static"></span><span class="m m-text"></span><span class="m m-dim"></span>' +
      '<span class="m m-load"><i></i><b>BUFFERING</b></span><div class="m m-show"></div><span class="m m-fill"></span>' +
      '<span class="m-shade"></span><span class="m-off"></span><span class="m-flash"></span><span class="m-glass"></span>');
    inner.appendChild(scr);
    inner.insertAdjacentHTML("beforeend", '<span class="m-led"></span>');
    el.appendChild(inner);
    var m = { el: el, inner: inner, scr: scr, content: content, kind: kind, page: page, c: c, r: r,
      off: scr.querySelector(".m-off"), flash: scr.querySelector(".m-flash"), stat: scr.querySelector(".m-static"), text: scr.querySelector(".m-text"),
      dim: scr.querySelector(".m-dim"), load: scr.querySelector(".m-load"), fill: scr.querySelector(".m-fill"), big: scr.querySelector(".m-big"),
      show: scr.querySelector(".m-show"), mode: null,
      revealed: kind === "site" && !!shownIds[page.id], ftl: null, flipping: false };
    gsap.set(inner, { transformPerspective: 900 });
    var act = function () {
      if (phase === "off") { powerOn(m, false); return; }
      if (phase !== "done" || !lit) return;
      if (kind === "logo") toggleCases();          /* the logo wall shows or hides every website example */
      else if (!m.revealed) toggleCases(m, true);  /* any plain screen turns them all over, starting from itself */
      else openPage(page, el, m);                  /* a website on show opens, growing to fill the window */
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
    skyLogo = makeSky("sky-logo");
    world.appendChild(skyLogo);
    world.appendChild(grid);
    hxBox.appendChild(world);
    layoutGrid();
    if (framesWanted) loadFrames();
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

  /* ---------- the sky behind the logo ----------
     Each logo wall is one shared layer sitting behind the monitors, and the screens are windows onto it,
     so the picture runs continuously behind the bezels. The water is a seamless strip of soft bands that
     slides sideways with a single GPU transform, so it flows without any jitter between screens. */
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
  /* soft water bands, two identical periods wide, so sliding by one period loops seamlessly */
  function flowUrl(kind, v) {
    var key = "flow-" + kind + v;
    if (waveUrls[key]) return waveUrls[key];
    var seed = (kind === "big" ? 11 : 3) + v * 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var path = function (y, amp, k, ph) {
      var d = "";
      for (var x = -200; x <= 1800; x += 20) {
        var a = x / 800 * Math.PI * 2;
        d += (x === -200 ? "M" : " L") + x + " " + (y + amp * Math.sin(a * k + ph) + amp * 0.35 * Math.sin(a * (k + 1) + ph * 1.7)).toFixed(1);
      }
      return d;
    };
    var out = "", n = kind === "big" ? 5 : 4;
    for (var i = 0; i < n; i++) {
      var y = 40 + (i + rnd() * 0.6) * (320 / n), amp = 14 + rnd() * 26, k = 1 + ((rnd() * 2) | 0), ph = rnd() * 6.28;
      out += '<path d="' + path(y, amp, k, ph) + '" stroke="#fff" stroke-opacity="' + (0.2 + rnd() * 0.2).toFixed(2) + '" stroke-width="' + (18 + rnd() * 26).toFixed(0) + '" fill="none" filter="url(#fb)"/>';
      out += '<path d="' + path(y + 6, amp, k, ph) + '" stroke="#fff" stroke-opacity="' + (0.4 + rnd() * 0.3).toFixed(2) + '" stroke-width="1.6" fill="none" filter="url(#fs)"/>';
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 400" width="2400" height="600" preserveAspectRatio="none"><defs>' +
      '<filter id="fb" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>' +
      '<filter id="fs" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>' + out + "</svg>";
    waveUrls[key] = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    return waveUrls[key];
  }
  function makeSky(cls) {
    var d = document.createElement("div");
    d.className = "hx-sky " + cls;
    d.setAttribute("aria-hidden", "true");
    d.innerHTML = '<img class="sky-base" alt=""><div class="sky-flow"><img class="flow-a" alt=""><img class="flow-b" alt=""></div><svg class="sky-word" preserveAspectRatio="none"></svg>';
    return d;
  }
  function placeSky(el, R, G, kind, sym) {
    el.style.left = (R.x0 - G.left) + "px"; el.style.top = (R.y0 - G.top) + "px";
    el.style.width = R.W + "px"; el.style.height = R.H + "px";
    el.querySelector(".sky-base").src = waveUrl(kind);
    el.querySelector(".flow-a").src = flowUrl(kind, 1);
    el.querySelector(".flow-b").src = flowUrl(kind, 2);
    var svg = el.querySelector(".sky-word");
    svg.setAttribute("viewBox", "0 0 " + R.W + " " + R.H);
    svg.innerHTML = '<use href="#' + sym + '" width="' + R.W + '" height="' + R.H + '"/>';
  }

  function layoutGrid() {
    if (!grid) return;
    var savedBox = hxBox.style.transform, savedWorld = world.style.transform;
    hxBox.style.transform = "none"; world.style.transform = "none";
    var G = grid.getBoundingClientRect();
    /* the logo wall's letters */
    var lg = logos(), U = union(lg), W = U.W, H = U.H;
    var cap = Math.min(0.395 * H, 0.2 * W), fs = cap / 0.727;
    var adv = measureAdvances(fs), N = adv.reduce(function (a, b) { return a + b; }, 0);
    var k = Math.min(1, (0.92 * W) / N), xs = [], acc = (W - k * N) / 2;
    adv.forEach(function (a) { xs.push(acc); acc += a * k; });
    LG = { xs: xs, base: H * 0.645, k: k, H: H, W: W, adv: adv, cap: cap };
    var glyphs = WORD.split("").map(function (ch, i) { return '<text id="wl' + i + '" x="0" y="0" ' + FONT_ATTR + ' font-size="' + fs + '" fill="#050505">' + ch + "</text>"; }).join("");
    var A = union(mons);
    wallDefs.innerHTML =
      '<symbol id="wallArt2" viewBox="0 0 ' + W + " " + H + '" overflow="hidden">' + glyphs + "</symbol>";
    writeLetters();
    placeSky(skyLogo, U, G, "logo", "wallArt2");
    mons.forEach(function (m, i) {
      var b = A.rects[i];
      m.cx = (b.left + b.width / 2 - A.x0) / (A.W / 6); m.cy = (b.top + b.height / 2 - A.y0) / (A.W / 6);
      if (m.kind === "site" && b.width) {
        var fit = m.fit = frameFit(b.width, b.height);
        m.content.style.width = fit.w + "px"; m.content.style.height = fit.h + "px";
        m.content.style.transform = "translateX(" + fit.x + "px) scale(" + fit.s + ")";
      }
    });
    world._A = A; world._G = G; world._U = U;
    hxBox.style.transform = savedBox; world.style.transform = savedWorld;
  }

  /* the flow: two strips per sky, sliding at different speeds; only the visible sky runs */
  var flows = { logo: null, big: null }, heroVisible = true;
  function makeFlow(sky) {
    var a = sky.querySelector(".flow-a"), b = sky.querySelector(".flow-b");
    return [
      gsap.fromTo(a, { xPercent: 0 }, { xPercent: -50, duration: 18, ease: "none", repeat: -1, paused: true, force3D: true }),
      gsap.fromTo(b, { xPercent: -50 }, { xPercent: 0, duration: 29, ease: "none", repeat: -1, paused: true, force3D: true })
    ];
  }
  function startWaves() {
    if (reduce || flows.logo || !grid) return;
    flows.logo = makeFlow(skyLogo);
    syncWaves();
  }
  function stopWaves() {
    ["logo", "big"].forEach(function (k) { if (flows[k]) { flows[k].forEach(function (t) { t.kill(); }); flows[k] = null; } });
  }
  function syncWaves() {
    var showBig = false, showLogo = heroVisible && lit;
    if (flows.logo) flows.logo.forEach(function (t) { t.paused(!showLogo); });
    if (flows.big) flows.big.forEach(function (t) { t.paused(!showBig); });
    hx.classList.toggle("waves-big", showBig); hx.classList.toggle("waves-logo", showLogo);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting && es[0].intersectionRatio > 0.01; syncWaves(); syncFrames(); }, { threshold: [0, 0.02] }).observe(hx.querySelector(".hx-sticky"));
  }

  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('900 100px "Inter Variable"')]).then(function () { layoutGrid(); stopWaves(); if (activated) startWaves(); });

  /* ---------- states ---------- */
  function setFramed(m, on) { m.el.classList.toggle("framed", on); }
  function hideModes(m) { gsap.set([m.stat, m.text, m.dim, m.load, m.show, m.flash, m.fill], { opacity: 0 }); }
  function resetOff(m, op) { m.off.classList.remove("mk-iris", "mk-blinds"); gsap.set(m.off, { opacity: op, clipPath: "none", "--r": "0%", "--b": "0px" }); gsap.set(m.scr, { x: 0 }); gsap.set(m.inner, { rotationY: 0, rotationX: 0, scale: 1 }); }
  function allOff() {
    hx.classList.add("is-off"); hx.classList.remove("is-lit", "blackout");
    mons.forEach(function (m) { setFramed(m, true); resetOff(m, 1); hideModes(m); });
    if (skyLogo) gsap.set(skyLogo, { autoAlpha: 0 });
    letters.forEach(function (L) { L.dy = 0.75; L.o = 0; L.sy = 1; L.s = 1; }); wordShift.x = 0; writeLetters();
    lit = false;
    syncFrames();
  }
  /* lit: the logo wall shows its sky; each outer screen is either the plain blue or its website */
  function allLit() {
    hx.classList.remove("is-off", "blackout"); hx.classList.add("is-lit");
    mons.forEach(function (m) {
      if (m.ftl) { m.ftl.kill(); m.ftl = null; } m.flipping = false;
      setFramed(m, true); resetOff(m, 0); hideModes(m);
      if (m.kind === "site" && !m.revealed) gsap.set(m.fill, { opacity: 1 });
    });
    if (skyLogo) gsap.set(skyLogo, { autoAlpha: 1 });
    letters.forEach(function (L) { L.dy = 0; L.o = 1; L.sy = 1; L.s = 1; }); wordShift.x = 0; writeLetters();
    lit = true;
    syncLogoKey();
    syncFrames();
  }

  /* ---------- what each screen shows while the wall wakes up ----------
     Every screen switches on the same way (an uneven flicker), but each one shows something different. */
  var GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@0123456789ABCDEFXZ";
  function scramble(t, res) {
    var s = "";
    for (var i = 0; i < t.length; i++) s += (t[i] === " " || Math.random() < res) ? t[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    return s;
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function hex(n) { var s = ""; for (var i = 0; i < n; i++) s += ("0" + ((Math.random() * 256) | 0).toString(16)).slice(-2).toUpperCase() + " "; return s; }

  var ERRORS = ["FATAL ERROR 0x0000007B", "KERNEL PANIC - NOT SYNCING", "SEGMENTATION FAULT (CORE DUMPED)", "STACK OVERFLOW AT 0x7FFE0304",
    "PAGE_FAULT_IN_NONPAGED_AREA", "*** STOP: 0x00000050", "DISK READ ERROR", "UNHANDLED EXCEPTION 0xC0000005", "MEMORY_MANAGEMENT",
    "CHECKSUM MISMATCH IN SECTOR 0x3F", "I/O ERROR ON DEVICE 0", "SIGNAL 11 RECEIVED", "BUFFER OVERRUN DETECTED", "ACCESS VIOLATION",
    "WATCHDOG TIMEOUT", "NULL POINTER DEREFERENCE", "DMA TRANSFER FAILED", "INVALID OPCODE AT 0028:C0011E36", "CRC ERROR", "BAD SYSTEM CONFIG"];
  /* black and white only: snow, lost signal, grey test bars, tracking lines, rolling picture, text dumps */
  var TYPES = ["static", "nosig", "gbars", "track", "vhold", "static", "err", "nosig", "boot"];

  var SHOW = {
    err: function (m, h) {
      var n = 26, lines = [];
      for (var i = 0; i < n; i++) lines.push(i % 3 === 2 ? "0x" + ((Math.random() * 0xffffff) | 0).toString(16).toUpperCase() + "  " + hex(18) : pick(ERRORS) + "  " + pick(ERRORS) + "  " + hex(6));
      m.show.style.fontSize = (h / (n + 1)) + "px";
      m.show.innerHTML = lines.map(function (l) { return "<span>" + l + "</span>"; }).join("");
      m._lines = [].slice.call(m.show.children);
      m._lines.forEach(function (s, i) { s._t = lines[i]; });
    },
    gbars: function () {
      var top = ["#ececec", "#c4c4c4", "#9d9d9d", "#787878", "#545454", "#323232", "#141414"].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("");
      var mid = ["#141414", "#0a0a0a", "#545454", "#0a0a0a", "#9d9d9d", "#0a0a0a", "#ececec"].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("");
      m_bars_id = (m_bars_id + 1) % 3;
      return '<div class="bars-roll r' + m_bars_id + '"><div class="bars-top">' + top + '</div><div class="bars-mid">' + mid + '</div>' +
        '<div class="bars-low"><i style="background:#262626"></i><i style="background:#fff"></i><i style="background:#262626"></i><i style="background:#111"></i><i style="background:#000"></i><i style="background:#1a1a1a"></i></div>' +
        '<div class="bars-top">' + top + '</div></div><b class="tear"></b>';
    },
    "static": function () { return '<span class="snow"></span>'; },
    nosig: function (m, h) {
      m.show.style.fontSize = Math.max(7, h / 11) + "px";
      return '<span class="snow faint"></span><span class="ns-osd">AV' + (1 + ((Math.random() * 3) | 0)) + '</span><span class="ns-box">NO SIGNAL</span>';
    },
    vhold: function () { return '<span class="snow roll"></span><span class="vh-bar"></span>'; },
    track: function () { return '<span class="trk"></span><span class="trk-band"></span>'; },
    boot: function (m, h) {
      m.show.style.fontSize = (h / 14) + "px";
      return '<div class="boot"><p>JW-BIOS v4.51 &nbsp;(C) 1994</p><p>CPU : 486DX2-66</p><p>Memory Test : <span class="mem">0K</span></p><p>&nbsp;</p>' +
        '<p>Detecting Primary Master ... None</p><p>Detecting Primary Slave &nbsp;... None</p><p>&nbsp;</p><p>Boot failure.</p><p>Insert system disk and press Enter<u>_</u></p></div>';
    }
  };
  var m_bars_id = 0;
  function buildShow(m) {
    var h = m.scr.clientHeight || 120;
    m.show.removeAttribute("style");
    m._lines = null; m._mem = null; m._pc = null;
    m.show.className = "m m-show s-" + m.mode;
    var html2 = SHOW[m.mode](m, h);
    if (html2 !== undefined) m.show.innerHTML = html2;
    m._mem = m.show.querySelector(".mem");
    m._pc = m.show.querySelector(".pc");
  }
  function assignModes() {
    var deck = [];
    while (deck.length < mons.length) deck = deck.concat(shuffle(TYPES.slice()));
    mons.forEach(function (m, i) { m.mode = deck[i]; buildShow(m); });
  }
  function modeEl(m) { return m.show; }

  var ticker = 0;
  function startTicker() {
    stopTicker();
    var t0 = performance.now();
    ticker = setInterval(function () {
      var el = (performance.now() - t0) / 1000;
      mons.forEach(function (m) {
        if (m._lines) m._lines.forEach(function (s) { if (Math.random() < 0.3) s.textContent = scramble(s._t, 0.25 + Math.random() * 0.6); });
        if (m._mem) { var k = Math.min(16384, Math.round(el * 5200 / 64) * 64); m._mem.textContent = k + "K" + (k >= 16384 ? " OK" : ""); }
        if (m._pc) m._pc.textContent = Math.min(100, Math.floor(m._pc0 + el * 9));
      });
    }, 90);
  }
  function stopTicker() { if (ticker) { clearInterval(ticker); ticker = 0; } }

  /* a screen loses power and comes back, again and again, faster and faster, until the hard cut */
  function flickerOut(T, m, from, cut) {
    var t = from, on = false;
    while (t < cut - 0.02) {
      T.set(m.off, { opacity: on ? 0 : 1 }, t);
      var left = cut - t;
      /* each gap is a share of the time that is left, so the rhythm keeps speeding up */
      t += Math.max(0.022, left * (on ? 0.3 : 0.2) * (0.75 + Math.random() * 0.5));
      on = !on;
    }
    T.set(m.off, { opacity: 0 }, Math.max(from, cut - 0.03));
  }

  /* a monitor turns over like a page: the new face lands on the way back */
  function flip(T, m, s, axis, dir, mid, d1, d2) {
    d1 = d1 || 0.24; d2 = d2 || 0.46;
    var p = axis === "x" ? "rotationX" : "rotationY", a = {}, b = {}, c = {};
    a[p] = 90 * dir; a.duration = d1; a.ease = "power2.in";
    b[p] = -90 * dir; c[p] = 0; c.duration = d2; c.ease = "back.out(1.4)"; c.immediateRender = false;
    T.to(m.inner, a, s);
    mid(s + d1);
    T.fromTo(m.inner, b, c, s + d1);
    return d1 + d2;
  }
  function flipDir(m, o) {
    var dx = m.cx - o.cx, dy = m.cy - o.cy;
    return Math.abs(dx) >= Math.abs(dy) * 1.2 ? { axis: "y", dir: dx >= 0 ? 1 : -1 } : { axis: "x", dir: dy >= 0 ? -1 : 1 };
  }
  function dist(a, b) { return Math.hypot(a.cx - b.cx, a.cy - b.cy); }
  function topLeft(list) { return list.slice().sort(function (a, b) { return (a.cx + a.cy) - (b.cx + b.cy); })[0]; }
  function logoCenter() {
    var lg = logos();
    return lg.reduce(function (a, m) { a.cx += m.cx / lg.length; a.cy += m.cy / lg.length; return a; }, { cx: 0, cy: 0 });
  }

  /* ---------- the website examples: turned over one at a time, or all at once from the logo wall ---------- */
  function flipCase(m, on, delay, f, quick) {
    if (m.ftl) m.ftl.kill();
    var T = gsap.timeline({ delay: delay || 0, onStart: function () { m.flipping = true; syncFrames(); }, onComplete: function () { m.flipping = false; m.ftl = null; syncFrames(); } });
    m.ftl = T;
    if (calm || reduce) { T.to(m.fill, { opacity: on ? 0 : 1, duration: reduce ? 0.01 : quick ? 0.3 : 0.5, ease: "power1.inOut" }); return; }
    gsap.killTweensOf(m.inner, "rotationX,rotationY");
    flip(T, m, 0, f.axis, f.dir, function (t) { T.set(m.fill, { opacity: on ? 0 : 1 }, t); }, quick ? 0.14 : 0, quick ? 0.26 : 0);
  }
  /* from the logo wall: show all, or hide all if they are all showing. From a screen: show all, from that screen. */
  function toggleCases(from, force, quick) {
    var list = sites(), on = force != null ? force : !list.every(function (m) { return m.revealed; }), c = from || logoCenter();
    var each = quick ? 0.025 : from ? 0.035 : 0.06;
    list.sort(function (a, b) { return dist(a, c) - dist(b, c); }).forEach(function (m) {
      if (m.revealed === on) return;
      m.revealed = on;
      if (on) shownIds[m.page.id] = true; else delete shownIds[m.page.id];
      var f = m === from ? { axis: "y", dir: 1 } : flipDir(m, c);
      if (!on) f.dir = -f.dir;   /* they turn back toward the logo */
      flipCase(m, on, dist(m, c) * each, f, quick);
    });
    syncLogoKey();
  }
  function anyRevealed() { return sites().some(function (m) { return m.revealed; }); }
  /* leaving the first page: the website examples turn back into the plain blue wall first */
  function hideCasesBeforeLeaving(go) {
    toggleCases(null, false, true);
    var wait = sites().reduce(function (a, m) { return m.ftl ? Math.max(a, m.ftl.delay() + m.ftl.duration()) : a; }, 0);
    return gsap.delayedCall(wait + 0.02, go);
  }
  function syncLogoKey() {
    var k = grid && grid.querySelector(".logo-key");
    if (k) k.setAttribute("aria-pressed", String(sites().length > 0 && sites().every(function (m) { return m.revealed; })));
  }

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
    /* nobody clicked: it wakes by itself */
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
    if (!introDone) endIntro();
  }

  function powerOn(m, auto) {
    if (phase !== "off") return;
    phase = "intro";
    if (emergeTw) { emergeTw.kill(); emergeTw = null; }
    gsap.set(mons.map(function (x) { return x.inner; }), { opacity: 1 });
    clearTimeout(autoTimer);
    hx.classList.remove("is-off");
    var lg = logos(), st = sites();
    var T = gsap.timeline({ onComplete: endIntro });
    introTl = T;

    if (calm) {
      /* Effects off: no static and no flicker. The logo wall fades up, then the screens around it turn blue. */
      T.set(skyLogo, { autoAlpha: 1 }, 0.3);
      lg.forEach(function (x) { T.to(x.off, { opacity: 0, duration: 1 }, 0.3); });
      T.to(letters, { o: 1, dy: 0, duration: 1, stagger: 0.05, onUpdate: writeLetters }, 1.1);
      T.set(st.map(function (x) { return x.fill; }), { opacity: 1 }, 2.2);
      T.to(st.map(function (x) { return x.off; }), { opacity: 0, duration: 1.2, ease: "power1.inOut" }, 2.2);
      T.to(nav, { autoAlpha: 1, duration: 0.6 }, 2.8);
      return;
    }

    /* 1. Every screen powers up quickly, from dim to bright, into black-and-white static or a lost signal. */
    hx.classList.add("fx-run");
    assignModes();
    startTicker();
    mons.forEach(function (x) {
      var s = (m ? dist(x, m) * 0.035 : 0) + Math.random() * 0.06;
      T.set(x.show, { opacity: 1, filter: "brightness(.35)" }, s);
      T.fromTo(x.off, { opacity: 0.9 }, { opacity: 0, duration: 0.32, ease: "power2.in", immediateRender: false }, s);
      T.to(x.show, { keyframes: [{ filter: "brightness(1.5)", duration: 0.3, ease: "power2.in" }, { filter: "brightness(1)", duration: 0.35, ease: "power1.out" }] }, s);
    });

    /* 2. Each screen starts cutting out at its own moment, black, on, black, faster and faster ... */
    var tCut = 3.3;
    mons.forEach(function (x) { flickerOut(T, x, 1.15 + Math.random() * 1.1, tCut); });

    /* 3. ... then everything cuts to black at once. */
    T.call(function () { hx.classList.add("blackout"); stopTicker(); hx.classList.remove("fx-run"); }, null, tCut);
    T.set(mons.map(function (x) { return x.off; }), { opacity: 1 }, tCut);
    T.set(mons.map(function (x) { return x.show; }), { opacity: 0 }, tCut);

    /* 4. After two seconds of black, the logo wall's screens come on one by one, and the letters pop in. */
    var tLogo = tCut + 2;
    T.call(function () { hx.classList.remove("blackout"); }, null, tLogo - 0.35);
    T.set(skyLogo, { autoAlpha: 1 }, tLogo);
    var lastOn = tLogo;
    shuffle(lg.slice()).forEach(function (x, i) {
      var s = tLogo + i * 0.05 + Math.random() * 0.12;
      T.fromTo(x.flash, { opacity: 0 }, { keyframes: [{ opacity: 0.55, duration: 0.04 }, { opacity: 0, duration: 0.3 }], immediateRender: false }, s);
      T.to(x.off, { opacity: 0, duration: 0.06 }, s);
      lastOn = Math.max(lastOn, s);
    });
    var tWord = lastOn + 0.3;
    T.set(letters, { o: 0, s: 0.55, dy: 0, sy: 1, onComplete: writeLetters }, tLogo);
    letters.forEach(function (L, i) {
      T.to(L, { s: 1, o: 1, duration: 0.5, ease: "back.out(2.2)", onUpdate: writeLetter, onUpdateParams: [i] }, tWord + i * 0.045);
    });

    /* 5. Then the screens around it fade together from black into the logo wall's blue. */
    var tFade = tWord + 0.45 + WORD.length * 0.045;
    T.set(st.map(function (x) { return x.fill; }), { opacity: 1 }, tFade);
    T.to(st.map(function (x) { return x.off; }), { opacity: 0, duration: 1.4, ease: "power1.inOut" }, tFade);
    T.to(nav, { autoAlpha: 1, duration: 0.6 }, tFade + 0.6);
  }

  var activated = false;
  function endIntro() {
    if (introTl) { introTl.kill(); introTl = null; }
    clearTimeout(autoTimer);
    stopTicker();
    hx.classList.remove("fx-run", "blackout");
    removeEventListener("keydown", onSkipInput);
    removeEventListener("wheel", onSkipInput);
    if (emergeTw) { emergeTw.kill(); emergeTw = null; }
    allLit();
    gsap.set(mons.map(function (x) { return x.inner; }), { opacity: 1 });
    gsap.set(mons.map(function (x) { return x.show; }), { clearProps: "filter" });
    gsap.set(nav, { autoAlpha: 1 });
    phase = "done";
    lockIntro(false);
    introDone = true;
    try { sessionStorage.setItem("wall-seen", "1"); } catch (e) {}
    wh.armed = false; wh.last = performance.now(); wh.holdUntil = wh.last + 450;   /* the scroll that skipped the intro should not also turn the page */
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
    if (lite) setLite(true);
  }
  function startGlitches() {
    var next = function () {
      var list = sites().filter(function (m) { return m.revealed && !m.flipping; });
      if (heroVisible && list.length) {
        var m = list[(Math.random() * list.length) | 0];
        idle.push(gsap.timeline().to(m.stat, { opacity: 0.8, duration: 0.05 }).to(m.stat, { opacity: 0, duration: 0.3, ease: "power1.out" }, 0.2));
      }
      idle.push(gsap.delayedCall(2.5 + Math.random() * 3, next));
    };
    idle.push(gsap.delayedCall(3, next));
  }

  /* hover: the screen comes forward a little and wobbles with the pointer; the others dim slightly */
  var hovered = null;
  function bindHover() {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return function () {};
    var hs = sites().map(function (m) {
      var tilt = function (y, x) { if (!m.flipping) gsap.to(m.inner, { rotationY: y, rotationX: x, duration: 0.6, ease: "power3.out", overwrite: "auto" }); };
      var on = function () {
        if (!lit || phase !== "done") return;
        hovered = m; if (lite) syncFrames();
        m.el.classList.add("on"); grid.classList.add("hovering");
        gsap.to(m.inner, { scale: 1.05, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      };
      var move = function (e) {
        if (hovered !== m) return;
        var b = m.el.getBoundingClientRect();
        tilt(((e.clientX - b.left) / b.width - 0.5) * 12, -((e.clientY - b.top) / b.height - 0.5) * 4);
      };
      var off = function () {
        if (hovered === m) { hovered = null; if (lite) syncFrames(); }
        m.el.classList.remove("on"); grid.classList.remove("hovering");
        gsap.to(m.inner, m.flipping ? { scale: 1, duration: 0.45, ease: "power3.out" } : { scale: 1, rotationY: 0, rotationX: 0, duration: 0.45, ease: "power3.out", overwrite: "auto" });
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
      if (m.ftl) m.ftl.progress(1);
      m.el.classList.remove("on");
      gsap.killTweensOf(m.inner);
      gsap.set(m.inner, { scale: 1, rotationX: 0, rotationY: 0 });
    });
    hovered = null;
  }

  var heroMM = gsap.matchMedia();
  heroMM.add({ wide: "(min-aspect-ratio: 1/1)", tall: "(max-aspect-ratio: 1/1)" }, function (ctx) {
    var key = ctx.conditions.wide ? "wide" : "tall";
    if (grid && layoutKey === key) return;
    buildGrid(key);
    if (introDone) { allLit(); activated = false; activate(); }
    else allOff();
    var raf = 0;
    var onResize = function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { releaseHover(); layoutGrid(); });
    };
    addEventListener("resize", onResize);
    return function () {
      removeEventListener("resize", onResize);
      unbindHover(); unbindHover = function () {};
      idle.forEach(function (t) { t.kill(); }); idle = [];
      stopWaves();
      if (introTl || (!introDone && phase !== "off")) { skipIntroSeq(); }
      activated = false;
      if (world) { world.remove(); world = null; grid = null; mons = []; }
    };
  });

  /* ---------- page preview: the screen that was clicked grows until it fills the window ---------- */
  var pv = $("#pv"), pvBar = pv.querySelector(".pv-bar"), pvFrame = null, pvTitle = $("#pvTitle"), pvClose = $("#pvClose");
  var pvFrom = null, pvMon = null, pvTw = null, pvState = { p: 0 };
  function lerp(a, b, t) { return a + (b - a) * t; }
  /* p = 0 sits exactly on the monitor (the page laid out at the monitor's width), p = 1 fills the window */
  function pvDrawer(r, m) {
    var bh = pvBar.offsetHeight, f0 = (m && m.fit) || frameFit(r.width, r.height);
    return function () {
      if (!pvFrame) return;
      var t = pvState.p, W = innerWidth, H = innerHeight;
      var bx = lerp(r.left, 0, t), by = lerp(r.top, bh, t), bw = lerp(r.width, W, t), bhh = lerp(r.height, H - bh, t);
      var cw = lerp(f0.w, W, t), ch = lerp(f0.h, H - bh, t), s = Math.max(bw / cw, bhh / ch);
      pvFrame.style.width = cw + "px"; pvFrame.style.height = ch + "px";
      pvFrame.style.transform = "translate(" + (bx + (bw - cw * s) / 2) + "px," + by + "px) scale(" + s + ")";
      /* the growing screen keeps hard edges, like the monitor it came from */
      pv.style.clipPath = t >= 1 ? "" : "inset(" + lerp(r.top, 0, t) + "px " + (W - bx - bw) + "px " + (H - by - bhh) + "px " + bx + "px)";
    };
  }
  function pvSettle() { pv.classList.remove("pv-anim"); pv.style.clipPath = ""; if (pvFrame) pvFrame.removeAttribute("style"); gsap.set(pvBar, { clearProps: "opacity,visibility" }); }
  function openPage(p, from, m) {
    pvFrom = from; pvMon = m || null;
    pvTitle.textContent = p.title;
    if (pvTw) { pvTw.kill(); pvTw = null; }
    if (pvFrame) pvFrame.remove();
    pvFrame = document.createElement("iframe");
    pvFrame.className = "pv-frame";
    pvFrame.setAttribute("title", p.title);
    pvFrame.src = PAGE_DIR + p.id + ".html";
    pv.appendChild(pvFrame);
    pv.hidden = false;
    html.classList.add("pv-open");
    syncFrames();
    var r = m && m.scr.getBoundingClientRect();
    if (reduce || !r || !r.width) {
      if (!reduce) gsap.fromTo(pv, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" });
      pvClose.focus();
      return;
    }
    pv.classList.add("pv-anim");
    gsap.set(pvBar, { autoAlpha: 0 });
    var draw = pvDrawer(r, m), frame = pvFrame, started = false;
    pvState.p = 0; draw();
    var go = function () {
      if (started || frame !== pvFrame) return;
      started = true;
      pvTw = gsap.to(pvState, { p: 1, duration: 0.7, ease: "power3.inOut", onUpdate: draw,
        onComplete: function () { pvTw = null; pvSettle(); pvClose.focus({ preventScroll: true }); } });
      gsap.to(pvBar, { autoAlpha: 1, duration: 0.3, delay: 0.48, ease: "power1.out" });
    };
    /* start once the page has loaded (it is local, so this is almost instant) */
    frame.addEventListener("load", go, { once: true });
    setTimeout(go, 450);
  }
  function closePage() {
    if (pv.hidden) return;
    var done = function () {
      pvTw = null; pv.hidden = true; pvSettle();
      if (pvFrame) { pvFrame.remove(); pvFrame = null; }
      html.classList.remove("pv-open");
      syncFrames();
      if (pvFrom) pvFrom.focus({ preventScroll: true });
    };
    if (pvTw) { pvTw.kill(); pvTw = null; }
    var r = pvMon && pvMon.el.isConnected && pvMon.scr.getBoundingClientRect();
    if (reduce) { done(); return; }
    if (!r || !r.width || r.bottom < 0 || r.top > innerHeight) { gsap.to(pv, { opacity: 0, duration: 0.3, ease: "power1.in", onComplete: function () { gsap.set(pv, { clearProps: "opacity" }); done(); } }); return; }
    /* and shrinks back into its screen */
    pv.classList.add("pv-anim");
    var draw = pvDrawer(r, pvMon);
    pvState.p = 1; draw();
    gsap.to(pvBar, { autoAlpha: 0, duration: 0.2 });
    pvTw = gsap.to(pvState, { p: 0, duration: 0.65, ease: "power3.inOut", onUpdate: draw, onComplete: done });
  }
  pvClose.addEventListener("click", closePage);
  addEventListener("keydown", function (e) { if (e.key === "Escape") closePage(); });

  /* =====================================================
     FULL-PAGE SCROLLING: one step = one full page
     ===================================================== */
  var snapping = false, snapTarget = null, snapProxy = { y: 0 }, touchY = null;
  /* one wheel or trackpad gesture = one page. A gesture ends after a short pause, or when a fresh swipe
     cuts through the trackpad's momentum; the leftover momentum itself is ignored. */
  var wh = { last: 0, lastAbs: 0, armed: true, acc: 0, lastStep: 0, holdUntil: 0 };
  function pageTop(el) { return el.getBoundingClientRect().top + window.pageYOffset; }
  function stops() {
    var vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    var list = [pageTop(hx)];
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
  /* Every page takes about a second. Scrolling again the same way while a page is turning speeds it up,
     so two scrolls finish in about half a second. */
  var snapTw = null, snapDir = 0, snapBoosts = 0, snapStart = 0, leaveCall = null;
  function snapTo(y, done) {
    var from = window.pageYOffset, top = pageTop(hx);
    if (leaveCall) { leaveCall.kill(); leaveCall = null; }
    snapping = true; snapTarget = y; snapDir = y > from ? 1 : -1; snapBoosts = 0;
    var go = function () {
      leaveCall = null;
      snapStart = performance.now();
      snapProxy.y = window.pageYOffset;
      gsap.killTweensOf(snapProxy);
      /* every page takes about a second; scrolling again the same way hurries it along (see boost) */
      snapTw = gsap.to(snapProxy, {
        y: y, duration: reduce ? 0.01 : 1, ease: "power2.inOut",
        onUpdate: function () { window.scrollTo(0, snapProxy.y); },
        onComplete: function () { snapping = false; snapTarget = null; snapTw = null; if (done) done(); }
      });
    };
    snapTw = null;
    if (from <= top + 2 && y > top + 2 && introDone && anyRevealed() && !reduce) leaveCall = hideCasesBeforeLeaving(go);
    else go();
  }
  function boost() {
    /* scrolling again while the examples turn back: finish them now and go */
    if (leaveCall) { sites().forEach(function (m) { if (m.ftl) m.ftl.progress(1); }); var g = leaveCall; leaveCall = null; g.kill(); g.vars.onComplete(); return; }
    if (!snapTw) return;
    snapBoosts++;
    var left = (snapTw.duration() - snapTw.time()) / snapTw.timeScale();   /* real seconds still to go */
    var spent = (performance.now() - snapStart) / 1000;
    var want = snapBoosts === 1 ? Math.max(0.1, 0.5 - spent) : Math.max(0.08, left / 2);
    if (want < left) snapTw.timeScale(snapTw.timeScale() * left / want);
  }
  function step(dir) {
    /* scrolling again the same way while a page turns hurries it along instead of skipping a page */
    if (snapping && (snapTw || leaveCall) && dir === snapDir) { boost(); return; }
    var list = stops(), y = window.pageYOffset, j = -1;
    if (dir > 0) { for (var i = 0; i < list.length; i++) if (list[i] > y + 2) { j = i; break; } }
    else { for (var k = list.length - 1; k >= 0; k--) if (list[k] < y - 2) { j = k; break; } }
    if (j >= 0) snapTo(list[j]);
  }
  function snapActive() {
    return view === "home" && !busy && !html.classList.contains("intro-lock") && pv.hidden && !menuOpen;
  }
  addEventListener("wheel", function (e) {
    if (!snapActive()) return;
    e.preventDefault();
    var now = performance.now(), gap = now - wh.last;
    var dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1), abs = Math.abs(dy);
    wh.last = now;
    if (gap > 160 || (gap > 70 && abs >= 50)) { wh.armed = true; wh.acc = 0; }   /* a pause, or a separate wheel notch */
    else if (!wh.armed && abs > 18 && abs > wh.lastAbs * 1.7 && now - wh.lastStep > 240) { wh.armed = true; wh.acc = 0; }
    wh.lastAbs = abs;
    if (!wh.armed || now < wh.holdUntil) return;
    wh.acc += dy;
    if (Math.abs(wh.acc) < 24) return;
    var dir = wh.acc > 0 ? 1 : -1;
    wh.armed = false; wh.acc = 0; wh.lastStep = now;
    step(dir);
  }, { passive: false });
  addEventListener("keydown", function (e) {
    if (!snapActive() || e.defaultPrevented) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    var k = e.key, dir = 0;
    if (k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey && !(t.closest && t.closest(".mon, button, a")))) dir = 1;
    else if (k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey)) dir = -1;
    else if (k === "Home") { e.preventDefault(); snapTo(stops()[0]); return; }
    else if (k === "End") { e.preventDefault(); var l = stops(); snapTo(l[l.length - 1]); return; }
    if (!dir) return;
    e.preventDefault();
    step(dir);
  });
  addEventListener("touchstart", function (e) { touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener("touchmove", function (e) { if (snapActive()) e.preventDefault(); }, { passive: false });
  addEventListener("touchend", function (e) {
    if (!snapActive() || touchY == null) return;
    var dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (Math.abs(dy) > 36) step(dy > 0 ? 1 : -1);
  });
  addEventListener("resize", function () {
    fitFoot();
    if (view !== "home" || snapping) return;
    var list = stops(); window.scrollTo(0, list[nearest(list, window.pageYOffset)]);
  });

  /* the round cursor and the language menu live in ui.js, shared with the other pages */

  Promise.race([new Promise(function (res) { addEventListener("load", res, { once: true }); }), new Promise(function (res) { setTimeout(res, 2500); })])
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
    menuBtn.textContent = I18N.t(open ? "close" : "menu");
    html.style.overflow = open ? "hidden" : "";
    if (open) nav.classList.remove("is-hidden");
  }
  menuBtn.addEventListener("click", function () { setMenu(!menuOpen); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) { setMenu(false); menuBtn.focus(); } });
  addEventListener("resize", function () { if (menuOpen && innerWidth >= 900) setMenu(false); });

  function goTo(id) {
    var t = id === "top" ? $("#top") : document.getElementById(id);
    if (!t) return;
    /* a service is shown by going to the "What we do" page with that service picked */
    var sec = t.classList.contains("row") ? t.closest("section") : t;
    if (t.classList.contains("row")) setService(svcRows.indexOf(t), true);
    snapTo(Math.max(0, pageTop(sec)), function () { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); });
  }
  /* the contact page and the footer share the last screen */
  var foot = $(".site-foot");
  function fitFoot() { html.style.setProperty("--foot-h", foot.offsetHeight + "px"); }
  fitFoot();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFoot);
  q("[data-go]", home).forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); if (menuOpen) setMenu(false); goTo(a.dataset.go); });
  });
  q("[data-top]", home).forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); if (menuOpen) setMenu(false); snapTo(0); });
  });
  $("#year").textContent = new Date().getFullYear();

  /* ---------- The transition: homepage is a layer on the same route ---------- */
  function finishEnter() {
    gsap.set([home, stage, veil], { clearProps: "all" });
    html.dataset.view = "home";
    pauseDrift(true);
    stage.inert = true; home.inert = false;
    window.scrollTo(0, 0);
    lastY = 0; nav.classList.remove("is-hidden"); nav.classList.add("on-top");
    main.focus({ preventScroll: true });
    initScroll();
    ScrollTrigger.refresh();
    busy = false;
    syncFrames();
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
    loadFrames();
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
    syncFrames();
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
    if (reduce) { fxToggle.textContent = I18N.t("fxReduced"); fxToggle.disabled = true; fxToggle.setAttribute("aria-pressed", "true"); return; }
    fxToggle.textContent = I18N.t(calm ? "fxOn" : "fxOff");
    fxToggle.setAttribute("aria-pressed", String(calm));
  }
  fxToggle.addEventListener("click", function () {
    calm = !calm;
    try { sessionStorage.setItem("fx-off", calm ? "1" : "0"); } catch (e) {}
    syncFx();
  });
  syncFx();

  /* ---------- switching language: refresh the text that scripts wrote ---------- */
  document.addEventListener("langchange", function () {
    syncFx();
    menuBtn.textContent = I18N.t(menuOpen ? "close" : "menu");
    /* the entrance headline is split into words for its animation, so split the new words too */
    splitWords($("#headline"), "wi");
    if (!reduce) gsap.set(q(".wi", stage), { autoAlpha: 1, yPercent: 0 });
    var row = svcRows[svcCur];
    if (row) { svcNum.textContent = row.querySelector(".num").textContent; svcName.textContent = row.querySelector(".name").textContent; }
    var k = grid && grid.querySelector(".logo-key");
    if (k) k.setAttribute("aria-label", I18N.t("logoKey"));
    sites().forEach(function (m) { m.el.setAttribute("aria-label", m.page.title + " (" + I18N.t("designConcept").toLowerCase() + ")"); });
  });

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
    loadFrames();
    pauseDrift(true);
    var t0 = gsap.timeline(), seen = false;
    try { seen = sessionStorage.getItem("wall-seen") === "1"; } catch (e) {}
    /* coming back from another page of the site: the wall is already on, no intro again */
    if (!introDone && seen) { armIntro(); skipIntroSeq(); }
    else if (!introDone) armIntro();
    else heroReveal(t0, 0.1);
    initScroll();
  }
})();
