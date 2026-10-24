/* Flat-lay garment drawings for the apparel demos.
   Garment.draw(type, hex, { view: 0 front | 1 back | 2 fabric close-up, bg, logo: { text, place, color }, stripe, pattern, thumb })
   Types: tee, longsleeve, polo, crew, hoodie, shirt, bomber, puffer, chino, jogger, legging, shorts, dress, blazer, coat, knit, skirt */
(function () {
  "use strict";
  var sh = function (hex, amt) {
    var h = String(hex).replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&");
    var n = parseInt(h, 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var f = function (c) { return Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt)))); };
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  };
  var lum = function (hex) { var h = String(hex).replace("#", ""); var n = parseInt(h, 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  var uid = 0;

  // body outlines on a 400 x 400 board
  var TOP_SHORT = "M150 92 Q200 116 250 92 L314 116 L350 186 L304 206 L290 176 L292 332 Q200 342 108 332 L110 176 L96 206 L50 186 L86 116 Z";
  var TOP_LONG = "M150 92 Q200 116 250 92 L312 114 L344 192 L362 312 L322 320 L300 210 L292 332 Q200 342 108 332 L100 210 L78 320 L38 312 L56 192 L88 114 Z";
  var SHAPES = {
    tee: TOP_SHORT, polo: TOP_SHORT, longsleeve: TOP_LONG, crew: TOP_LONG, hoodie: TOP_LONG, shirt: TOP_LONG, knit: TOP_LONG,
    bomber: "M148 92 Q200 112 252 92 L316 112 L350 194 L366 304 L326 314 L304 214 L296 316 Q200 330 104 316 L96 214 L74 314 L34 304 L50 194 L84 112 Z",
    puffer: "M146 88 Q200 108 254 88 L322 112 L356 196 L370 306 L328 318 L306 220 L300 326 Q200 342 100 326 L94 220 L72 318 L30 306 L44 196 L78 112 Z",
    blazer: "M146 88 L200 168 L254 88 L314 110 L344 196 L358 318 L320 326 L302 214 L298 338 Q200 346 102 338 L98 214 L80 326 L42 318 L56 196 L86 110 Z",
    coat: "M146 80 L200 160 L254 80 L314 100 L344 190 L360 330 L320 338 L304 210 L304 372 Q200 380 96 372 L96 210 L80 338 L40 330 L56 190 L86 100 Z",
    chino: "M128 70 L272 70 L292 342 L216 342 L200 166 L184 342 L108 342 Z",
    jogger: "M126 70 L274 70 L290 312 Q292 334 270 338 L222 338 Q212 330 212 312 L200 170 L188 312 Q188 330 178 338 L130 338 Q108 334 110 312 Z",
    legging: "M140 66 L260 66 L262 350 L222 350 L201 156 L179 350 L138 350 Z",
    shorts: "M124 110 L276 110 L300 266 L214 280 L200 196 L186 280 L100 266 Z",
    skirt: "M146 90 L254 90 L304 318 Q200 340 96 318 Z",
    dress: "M164 70 Q200 92 236 70 L262 84 L250 150 L250 178 L314 340 Q200 366 86 340 L150 178 L150 150 L138 84 Z"
  };
  function details(type, c, view, id) {
    var d = sh(c, -0.18), dd = sh(c, -0.32), l = sh(c, 0.18), s = "";
    var stitch = 'stroke="' + (lum(c) > 0.55 ? "rgba(0,0,0,.22)" : "rgba(255,255,255,.22)") + '" stroke-width="1.4" stroke-dasharray="4 4" fill="none"';
    var top = /tee|polo|longsleeve|crew|hoodie|shirt|knit|bomber|puffer/.test(type);
    if (top && type !== "shirt") s += '<path d="M112 316 Q200 326 288 316" ' + stitch + "/>";
    if (/longsleeve|crew|hoodie|knit/.test(type)) s += '<path d="M42 300 L80 306 M320 306 L358 300" stroke="' + d + '" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M110 318 Q200 330 290 318" stroke="' + d + '" stroke-width="14" fill="none"/>';
    if (type === "knit") for (var k = 0; k < 9; k++) s += '<path d="M' + (124 + k * 19) + ' 140 L' + (124 + k * 19) + ' 312" stroke="' + d + '" stroke-opacity=".35" stroke-width="2"/>';
    if (type === "tee" || type === "longsleeve" || type === "crew" || type === "knit") s += '<path d="M150 92 Q200 124 250 92" stroke="' + d + '" stroke-width="9" fill="none"/>';
    if (type === "polo") s += '<path d="M150 92 L176 132 L200 108 L224 132 L250 92 Q200 106 150 92 Z" fill="' + l + '" stroke="' + d + '" stroke-width="1.5"/><path d="M200 108 L200 170" stroke="' + d + '" stroke-width="2"/>' + (view === 1 ? "" : '<circle cx="200" cy="130" r="3" fill="' + dd + '"/><circle cx="200" cy="152" r="3" fill="' + dd + '"/>');
    if (type === "hoodie" && view !== 1) s += '<path d="M186 118 L182 196 M214 118 L218 196" stroke="' + l + '" stroke-width="3" stroke-linecap="round"/><path d="M134 236 L266 236 L282 300 L118 300 Z" fill="' + sh(c, -0.08) + '" stroke="' + d + '" stroke-width="1.5"/>';
    if (type === "shirt") s += '<path d="M150 92 L170 132 L200 104 L230 132 L250 92 L200 98 Z" fill="' + l + '" stroke="' + d + '" stroke-width="1.5"/>' + (view === 1 ? '<path d="M120 150 Q200 168 280 150" ' + stitch + "/>" : '<path d="M200 104 L200 336" stroke="' + d + '" stroke-width="2"/>' + [140, 180, 220, 260, 300].map(function (y) { return '<circle cx="207" cy="' + y + '" r="3.2" fill="' + l + '" stroke="' + d + '"/>'; }).join("") + '<path d="M228 150 L264 150 L264 192 L228 192 Z" fill="none" stroke="' + d + '" stroke-width="1.5"/>');
    if (type === "bomber") s += '<path d="M148 92 Q200 118 252 92" stroke="' + d + '" stroke-width="14" fill="none"/><path d="M98 304 Q200 320 302 304" stroke="' + d + '" stroke-width="18" fill="none"/><path d="M38 296 L72 304 M328 304 L362 296" stroke="' + d + '" stroke-width="14" fill="none" stroke-linecap="round"/>' + (view === 1 ? "" : '<path d="M200 104 L200 306" stroke="' + dd + '" stroke-width="4"/><path d="M200 104 L200 306" stroke="' + l + '" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M128 210 L150 262 M272 210 L250 262" stroke="' + dd + '" stroke-width="4" stroke-linecap="round"/>');
    if (type === "puffer") { for (var i = 0; i < 6; i++) s += '<path d="M' + (98 - i) + " " + (130 + i * 34) + " Q200 " + (142 + i * 34) + " " + (302 + i) + " " + (130 + i * 34) + '" stroke="' + d + '" stroke-width="2.5" fill="none"/>'; s += '<path d="M146 88 Q200 70 254 88 L254 108 Q200 124 146 108 Z" fill="' + d + '"/>' + (view === 1 ? "" : '<path d="M200 110 L200 330" stroke="' + dd + '" stroke-width="4"/>'); for (var j = 0; j < 4; j++) s += '<path d="M' + (60 - j * 4) + " " + (200 + j * 30) + " Q80 " + (206 + j * 30) + " " + (96 + j) + " " + (204 + j * 30) + " M" + (340 + j * 4) + " " + (200 + j * 30) + " Q320 " + (206 + j * 30) + " " + (304 - j) + " " + (204 + j * 30) + '" stroke="' + d + '" stroke-width="2" fill="none"/>'; }
    if (type === "blazer" || type === "coat") { var yb = type === "coat" ? 160 : 168; s += '<path d="M146 ' + (yb - 80) + " L200 " + yb + " L176 " + (yb + 40) + " L150 " + (yb - 40) + ' Z" fill="' + d + '"/><path d="M254 ' + (yb - 80) + " L200 " + yb + " L224 " + (yb + 40) + " L250 " + (yb - 40) + ' Z" fill="' + d + '"/>' + (view === 1 ? '<path d="M200 120 L200 ' + (type === "coat" ? 372 : 338) + '" stroke="' + d + '" stroke-width="2"/>' : '<circle cx="190" cy="' + (yb + 70) + '" r="5" fill="' + dd + '"/>' + (type === "coat" ? '<circle cx="190" cy="' + (yb + 130) + '" r="5" fill="' + dd + '"/><circle cx="230" cy="' + (yb + 70) + '" r="5" fill="' + dd + '"/><circle cx="230" cy="' + (yb + 130) + '" r="5" fill="' + dd + '"/>' : "") + '<path d="M122 ' + (yb + 110) + " L162 " + (yb + 106) + " M238 " + (yb + 106) + " L278 " + (yb + 110) + '" stroke="' + dd + '" stroke-width="3"/>'); }
    if (/chino|jogger|legging|shorts/.test(type)) {
      var top2 = type === "shorts" ? 110 : type === "legging" ? 66 : 70;
      s += '<path d="M' + (type === "legging" ? 140 : type === "shorts" ? 124 : 128) + " " + (top2 + 14) + " L" + (type === "legging" ? 260 : type === "shorts" ? 276 : 272) + " " + (top2 + 14) + '" stroke="' + d + '" stroke-width="' + (type === "jogger" || type === "legging" ? 22 : 10) + '"/>';
      if (type === "jogger") s += '<path d="M196 90 Q190 120 182 128 M204 90 Q210 120 218 128" stroke="' + l + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M110 326 L188 326 M212 326 L290 326" stroke="' + d + '" stroke-width="14"/>';
      if (type === "chino" && view !== 1) s += '<path d="M200 84 L200 150" stroke="' + d + '" stroke-width="2"/><path d="M134 98 Q150 120 168 100 M232 100 Q250 120 266 98" stroke="' + d + '" stroke-width="2" fill="none"/>';
      if (type === "chino" && view === 1) s += '<path d="M140 110 L176 110 L176 146 L140 146 Z M224 110 L260 110 L260 146 L224 146 Z" fill="none" stroke="' + d + '" stroke-width="1.6"/>';
      if (type === "shorts") s += '<path d="M104 254 L186 266 M214 266 L296 254" ' + stitch + "/>";
    }
    if (type === "dress") s += '<path d="M164 70 Q200 98 236 70" stroke="' + d + '" stroke-width="5" fill="none"/><path d="M150 168 Q200 178 250 168" stroke="' + d + '" stroke-width="6" fill="none"/><path d="M178 190 L150 336 M222 190 L250 336 M200 192 L200 350" stroke="' + d + '" stroke-opacity=".45" stroke-width="2"/>';
    if (type === "skirt") s += '<path d="M146 104 L254 104" stroke="' + d + '" stroke-width="12"/><path d="M170 112 L140 326 M200 112 L200 336 M230 112 L260 326" stroke="' + d + '" stroke-opacity=".45" stroke-width="2"/>';
    if (view === 1 && top) s += '<rect x="186" y="104" width="28" height="16" rx="2" fill="#f4f1ea" stroke="' + d + '" stroke-width="1"/><path d="M192 112 L208 112" stroke="#999" stroke-width="2"/>';
    return s;
  }
  /* parts that sit behind the body, outside its outline */
  function behind(type, c, view) {
    if (type !== "hoodie") return "";
    var d = sh(c, -0.14), dd = sh(c, -0.34);
    if (view === 1) return '<path d="M146 100 Q136 34 200 26 Q264 34 254 100 Z" fill="' + d + '"/><path d="M200 28 L200 100" stroke="' + dd + '" stroke-width="1.5"/>';
    return '<path d="M142 104 Q132 38 200 28 Q268 38 258 104 Q230 132 200 132 Q170 132 142 104 Z" fill="' + d + '"/><path d="M158 102 Q164 62 200 58 Q236 62 242 102 Q222 122 200 122 Q178 122 158 102 Z" fill="' + dd + '"/>';
  }
  function logoAt(type, logo) {
    if (!logo || !logo.text) return "";
    var t = String(logo.text).slice(0, 14).replace(/[&<>"]/g, ""), c = logo.color || "#fff";
    var pos = { "Left chest": [242, 160, 15], "Center front": [200, 200, 30], "Back": [200, 190, 34], "Sleeve": [322, 168, 13] }[logo.place] || [200, 200, 28];
    if (/chino|jogger|legging|shorts|skirt/.test(type)) pos = [150, 130, 14];
    var fs = Math.max(10, Math.min(pos[2], pos[2] * 10 / Math.max(5, t.length)));
    var rot = logo.place === "Sleeve" ? ' transform="rotate(62 ' + pos[0] + " " + pos[1] + ')"' : "";
    return '<text x="' + pos[0] + '" y="' + pos[1] + '" text-anchor="middle" font-family="Inter V,Arial,sans-serif" font-weight="800" font-size="' + fs + '" fill="' + c + '" letter-spacing=".5"' + rot + (logo.method === "Embroidery" ? ' stroke="' + c + '" stroke-width=".8" stroke-dasharray="1.2 1"' : "") + ">" + t + "</text>";
  }
  function fabric(hex, kind, id) {
    var d = sh(hex, -0.16), l = sh(hex, 0.12), pat = "";
    if (/denim|twill/i.test(kind)) pat = '<path d="M0 12 L12 0 M-3 3 L3 -3 M9 15 L15 9" stroke="' + d + '" stroke-width="3"/>';
    else if (/rib|knit/i.test(kind)) pat = '<path d="M3 0 L3 12 M9 0 L9 12" stroke="' + d + '" stroke-width="3"/>';
    else if (/fleece|terry/i.test(kind)) pat = '<circle cx="3" cy="3" r="2" fill="' + d + '"/><circle cx="9" cy="9" r="2" fill="' + l + '"/>';
    else if (/ripstop|nylon/i.test(kind)) pat = '<path d="M0 0 L12 0 L12 12" stroke="' + d + '" stroke-width="1" fill="none"/>';
    else pat = '<path d="M0 6 L12 6 M6 0 L6 12" stroke="' + d + '" stroke-width=".8"/>';
    return '<pattern id="fab' + id + '" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(' + (/denim|twill/i.test(kind) ? 0 : 0) + ')">' + '<rect width="12" height="12" fill="' + hex + '"/>' + pat + "</pattern>";
  }
  window.Garment = {
    shapes: Object.keys(SHAPES),
    draw: function (type, hex, o) {
      o = o || {}; var id = ++uid, view = o.view || 0, bg = o.bg || "transparent";
      if (view === 2) {
        return '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><defs>' + fabric(hex, o.fabric || "", id) + '<radialGradient id="v' + id + '" cx=".5" cy=".4" r=".8"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient></defs>' +
          '<rect width="400" height="400" fill="url(#fab' + id + ')" transform="scale(2.4)"/><rect width="400" height="400" fill="url(#v' + id + ')"/>' +
          '<path d="M0 300 Q120 270 230 300 T400 290" stroke="' + sh(hex, -0.3) + '" stroke-width="2" stroke-dasharray="7 6" fill="none"/>' +
          (o.fabric ? '<g transform="translate(24 24)"><rect width="' + (o.fabric.length * 8.4 + 30) + '" height="34" rx="17" fill="rgba(255,255,255,.88)"/><text x="15" y="22" font-family="Inter V,Arial" font-size="13" font-weight="700" fill="#222">' + String(o.fabric).replace(/[&<>]/g, "") + "</text></g>" : "") + "</svg>";
      }
      var shape = SHAPES[type] || SHAPES.tee;
      var stripe = o.stripe ? '<path d="M50 230 L350 230" stroke="' + o.stripe + '" stroke-width="16"/><path d="M50 256 L350 256" stroke="' + o.stripe + '" stroke-width="6"/>' : "";
      var flip = view === 1 ? "" : "";
      return '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="c' + id + '"><path d="' + shape + '"/></clipPath>' +
        '<linearGradient id="g' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + sh(hex, 0.1) + '"/><stop offset=".55" stop-color="' + hex + '"/><stop offset="1" stop-color="' + sh(hex, -0.12) + '"/></linearGradient>' +
        (o.fabric ? fabric(hex, o.fabric, id) : "") + "</defs>" +
        (bg !== "transparent" ? '<rect width="400" height="400" fill="' + bg + '"/>' : "") +
        '<ellipse cx="200" cy="' + (type === "coat" ? 384 : 360) + '" rx="150" ry="14" fill="rgba(0,0,0,.12)"/>' +
        '<g transform="translate(0 6)"' + flip + '>' + behind(type, hex, view) + '<path d="' + shape + '" fill="url(#g' + id + ')"/>' +
        '<g clip-path="url(#c' + id + ')">' + (o.fabric && !o.thumb ? '<rect width="400" height="400" fill="url(#fab' + id + ')" opacity=".22"/>' : "") + stripe +
        '<path d="M60 60 L230 60 L120 380 L0 380 Z" fill="#fff" opacity=".07"/>' + details(type, hex, view, id) + logoAt(type, view === 1 ? (o.logo && o.logo.place === "Back" ? o.logo : null) : (o.logo && o.logo.place !== "Back" ? o.logo : null)) + "</g>" +
        '<path d="' + shape + '" fill="none" stroke="' + sh(hex, -0.35) + '" stroke-opacity=".5" stroke-width="1.5"/></g></svg>';
    }
  };
})();
