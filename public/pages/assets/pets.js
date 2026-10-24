/* Drawings of pet products (and a friendly dog and cat) for the pet supplies demos.
   Pets.draw(kind, { color, accent, text, brand, view, thumb }) -> SVG on a 400 × 400 board */
(function () {
  "use strict";
  var sh = function (hex, amt) {
    var h = String(hex).replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&");
    var n = parseInt(h, 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var f = function (c) { return Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt)))); };
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  };
  var safe = function (t, n) { return String(t || "").slice(0, n || 16).replace(/[&<>"]/g, ""); };
  var uid = 0;
  var paw = function (x, y, s, c) { return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')" fill="' + c + '"><ellipse cx="0" cy="6" rx="9" ry="7.5"/><ellipse cx="-10" cy="-6" rx="4" ry="5"/><ellipse cx="-3.5" cy="-11" rx="4" ry="5"/><ellipse cx="3.5" cy="-11" rx="4" ry="5"/><ellipse cx="10" cy="-6" rx="4" ry="5"/></g>'; };
  var D = {
    foodbag: function (o, id) {
      var c = o.color, a = o.accent || "#fff";
      return '<defs><linearGradient id="fb' + id + '" x1="0" x2="1"><stop offset="0" stop-color="' + sh(c, -0.12) + '"/><stop offset=".4" stop-color="' + sh(c, 0.12) + '"/><stop offset="1" stop-color="' + sh(c, -0.22) + '"/></linearGradient></defs>' +
        '<path d="M110 70 L290 70 L300 330 Q300 352 278 352 L122 352 Q100 352 100 330 Z" fill="url(#fb' + id + ')"/><rect x="104" y="62" width="192" height="22" rx="4" fill="' + sh(c, -0.3) + '"/>' +
        '<path d="M104 72 L296 72" stroke="' + sh(c, 0.3) + '" stroke-width="2" stroke-dasharray="3 4"/>' +
        '<rect x="128" y="120" width="144" height="150" rx="14" fill="' + a + '"/>' + paw(200, 162, 1.6, c) +
        '<text x="200" y="214" text-anchor="middle" font-family="Bricolage V,Arial" font-weight="800" font-size="' + (safe(o.text, 14).length > 9 ? 16 : 22) + '" fill="' + sh(c, -0.35) + '">' + safe(o.text || "WAG", 14) + "</text>" +
        '<text x="200" y="238" text-anchor="middle" font-family="Inter V,Arial" font-weight="600" font-size="11" fill="' + sh(c, -0.2) + '">' + safe(o.sub || "", 26) + "</text>" +
        '<text x="200" y="258" text-anchor="middle" font-family="Inter V,Arial" font-weight="700" font-size="11" fill="' + sh(c, -0.2) + '">' + safe(o.weight || "", 12) + "</text>" +
        '<rect x="150" y="288" width="100" height="40" rx="20" fill="rgba(0,0,0,.18)"/>' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<ellipse cx="' + (166 + i * 14) + '" cy="' + (306 + (i % 2) * 6) + '" rx="6" ry="5" fill="#b9814a"/>'; }).join("");
    },
    treats: function (o, id) {
      var c = o.color;
      return '<rect x="128" y="96" width="144" height="34" rx="8" fill="' + sh(c, -0.25) + '"/><path d="M118 130 L282 130 L272 340 Q270 352 256 352 L144 352 Q130 352 128 340 Z" fill="rgba(255,255,255,.55)" stroke="rgba(0,0,0,.15)"/>' +
        [[160, 300], [196, 316], [236, 298], [176, 268], [220, 270], [200, 240], [160, 230], [240, 232]].map(function (p, i) { return '<path d="M' + (p[0] - 18) + " " + p[1] + " q-8 -10 2 -14 q6 -2 8 4 h16 q2 -6 8 -4 q10 4 2 14 q8 10 -2 14 q-6 2 -8 -4 h-16 q-2 6 -8 4 q-10 -4 -2 -14z" + '" fill="' + (i % 2 ? "#c58a4d" : "#a86a33") + '"/>'; }).join("") +
        '<rect x="140" y="160" width="120" height="44" rx="8" fill="' + c + '"/><text x="200" y="189" text-anchor="middle" font-family="Bricolage V,Arial" font-weight="800" font-size="17" fill="#fff">' + safe(o.text || "TREATS", 12) + "</text>";
    },
    bed: function (o, id) {
      var c = o.color, a = o.accent || sh(c, 0.35);
      return '<ellipse cx="200" cy="262" rx="168" ry="84" fill="' + sh(c, -0.28) + '"/><ellipse cx="200" cy="248" rx="168" ry="84" fill="' + c + '"/><ellipse cx="200" cy="246" rx="122" ry="54" fill="' + sh(c, -0.18) + '"/>' +
        '<ellipse cx="200" cy="254" rx="114" ry="46" fill="' + a + '"/><path d="M110 250 Q200 280 290 250" stroke="' + sh(a, -0.15) + '" stroke-width="2" fill="none"/>' +
        '<path d="M40 236 Q200 140 360 236" stroke="' + sh(c, 0.2) + '" stroke-width="3" fill="none" opacity=".5"/>' + (o.text ? '<text x="200" y="318" text-anchor="middle" font-family="Bricolage V,Arial" font-weight="800" font-size="16" fill="' + sh(c, 0.45) + '">' + safe(o.text, 14) + "</text>" : "");
    },
    collar: function (o, id) {
      var c = o.color, t = safe(o.text, 10);
      return '<ellipse cx="200" cy="190" rx="130" ry="96" fill="none" stroke="' + sh(c, -0.3) + '" stroke-width="34"/><ellipse cx="200" cy="184" rx="130" ry="96" fill="none" stroke="' + c + '" stroke-width="34"/>' +
        '<ellipse cx="200" cy="184" rx="130" ry="96" fill="none" stroke="' + sh(c, 0.3) + '" stroke-width="2" stroke-dasharray="5 5"/>' +
        '<rect x="86" y="150" width="34" height="56" rx="6" fill="#c7cbd0" stroke="#8b9096" stroke-width="3"/><rect x="96" y="160" width="14" height="36" fill="' + c + '"/>' +
        '<circle cx="200" cy="282" r="16" fill="none" stroke="#c7cbd0" stroke-width="6"/>' +
        '<path d="M200 298 m-30 6 q-14 -2 -14 12 q0 12 14 12 h60 q14 0 14 -12 q0 -14 -14 -12 z" fill="' + (o.accent || "#d6b25e") + '" stroke="' + sh(o.accent || "#d6b25e", -0.3) + '" stroke-width="2" transform="translate(0 6)"/>' +
        '<text x="200" y="330" text-anchor="middle" font-family="Bricolage V,Arial" font-weight="800" font-size="' + (t.length > 6 ? 12 : 15) + '" fill="' + sh(o.accent || "#d6b25e", -0.5) + '">' + (t || "MILO") + "</text>";
    },
    tag: function (o, id) {
      var c = o.color || "#d6b25e", t = safe(o.text, 10), ph = safe(o.sub, 16);
      return '<circle cx="200" cy="96" r="20" fill="none" stroke="#b7bcc2" stroke-width="8"/><path d="M110 150 q-46 -6 -46 50 q0 50 46 50 h180 q46 0 46 -50 q0 -56 -46 -50 q-20 -40 -60 -10 h-60 q-40 -30 -60 10z" fill="' + c + '" stroke="' + sh(c, -0.3) + '" stroke-width="3" transform="translate(0 10)"/>' +
        '<circle cx="200" cy="124" r="8" fill="#fff" stroke="' + sh(c, -0.35) + '" stroke-width="2"/>' +
        '<text x="200" y="222" text-anchor="middle" font-family="Bricolage V,Arial" font-weight="800" font-size="' + (t.length > 7 ? 30 : 40) + '" fill="' + sh(c, -0.55) + '">' + (t || "MILO") + "</text>" +
        '<text x="200" y="250" text-anchor="middle" font-family="Inter V,Arial" font-weight="600" font-size="14" fill="' + sh(c, -0.45) + '">' + (ph || "555-0142") + "</text>";
    },
    leash: function (o, id) {
      var c = o.color;
      return '<path d="M120 90 C320 60 340 200 210 210 C80 220 90 330 260 330" fill="none" stroke="' + sh(c, -0.3) + '" stroke-width="22" stroke-linecap="round"/><path d="M120 86 C320 56 340 196 210 206 C80 216 90 326 260 326" fill="none" stroke="' + c + '" stroke-width="18" stroke-linecap="round"/>' +
        '<path d="M120 86 C320 56 340 196 210 206 C80 216 90 326 260 326" fill="none" stroke="' + sh(c, 0.35) + '" stroke-width="2" stroke-dasharray="6 6"/>' +
        '<ellipse cx="96" cy="92" rx="34" ry="20" fill="none" stroke="' + c + '" stroke-width="16"/><rect x="258" y="314" width="34" height="24" rx="6" fill="#b7bcc2"/><path d="M292 326 q26 0 26 22 q0 18 -18 18" fill="none" stroke="#9aa0a6" stroke-width="8"/>';
    },
    ball: function (o, id) {
      var c = o.color;
      return '<defs><radialGradient id="bl' + id + '" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="' + sh(c, 0.35) + '"/><stop offset=".6" stop-color="' + c + '"/><stop offset="1" stop-color="' + sh(c, -0.35) + '"/></radialGradient></defs>' +
        '<circle cx="200" cy="200" r="120" fill="url(#bl' + id + ')"/><path d="M96 140 Q200 200 96 262 M304 140 Q200 200 304 262" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".9"/>' +
        (o.brand ? '<text x="200" y="210" text-anchor="middle" font-family="Bricolage V,Arial" font-weight="800" font-size="22" fill="' + sh(c, -0.45) + '">' + safe(o.brand, 10) + "</text>" : "");
    },
    rope: function (o, id) {
      var c = o.color, a = o.accent || "#f2efe8", s = "";
      for (var i = 0; i < 16; i++) s += '<path d="M' + (96 + i * 13) + " 168 l12 64" + '" stroke="' + (i % 2 ? c : a) + '" stroke-width="13" stroke-linecap="round"/>';
      return '<circle cx="86" cy="200" r="40" fill="' + c + '"/><circle cx="314" cy="200" r="40" fill="' + c + '"/>' + [86, 314].map(function (x) { return '<path d="M' + (x - 30) + " 186 q30 -20 60 0 M" + (x - 30) + " 214 q30 20 60 0" + '" stroke="' + a + '" stroke-width="6" fill="none"/>'; }).join("") + s +
        '<path d="M50 190 l-30 -16 M50 210 l-34 8 M350 190 l30 -16 M350 210 l34 8" stroke="' + a + '" stroke-width="6" stroke-linecap="round"/>';
    },
    bowl: function (o, id) {
      var c = o.color;
      return '<defs><linearGradient id="bw' + id + '" x1="0" x2="1"><stop offset="0" stop-color="' + sh(c, -0.18) + '"/><stop offset=".4" stop-color="' + sh(c, 0.18) + '"/><stop offset="1" stop-color="' + sh(c, -0.3) + '"/></linearGradient></defs>' +
        '<path d="M70 190 L110 300 Q200 330 290 300 L330 190 Z" fill="url(#bw' + id + ')"/><ellipse cx="200" cy="190" rx="130" ry="38" fill="' + sh(c, 0.25) + '"/><ellipse cx="200" cy="194" rx="108" ry="28" fill="' + sh(c, -0.35) + '"/>' +
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return '<ellipse cx="' + (130 + i * 15) + '" cy="' + (192 + (i % 3) * 4) + '" rx="8" ry="6" fill="' + (i % 2 ? "#b9814a" : "#9c6a38") + '"/>'; }).join("") +
        (o.text ? '<text x="200" y="272" text-anchor="middle" font-family="Bricolage V,Arial" font-weight="800" font-size="24" fill="' + sh(c, 0.55) + '">' + safe(o.text, 10) + "</text>" : paw(200, 262, 1.4, sh(c, 0.4)));
    },
    cattree: function (o, id) {
      var c = o.color, sisal = "#c9a77a";
      return '<rect x="90" y="330" width="220" height="24" rx="6" fill="' + sh(c, -0.2) + '"/><rect x="130" y="140" width="22" height="190" fill="' + sisal + '"/><rect x="246" y="210" width="22" height="120" fill="' + sisal + '"/>' +
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { return '<path d="M130 ' + (150 + i * 15) + ' l22 6 M246 ' + (220 + i * 9) + ' l22 5" stroke="' + sh(sisal, -0.25) + '" stroke-width="2"/>'; }).join("") +
        '<rect x="96" y="120" width="96" height="20" rx="5" fill="' + c + '"/><rect x="200" y="180" width="118" height="70" rx="8" fill="' + c + '"/><ellipse cx="259" cy="216" rx="22" ry="20" fill="' + sh(c, -0.45) + '"/><rect x="220" y="260" width="80" height="16" rx="5" fill="' + c + '"/>' +
        '<circle cx="110" cy="166" r="12" fill="' + (o.accent || "#ff7a3d") + '"/><path d="M110 140 L110 154" stroke="#888" stroke-width="2"/>';
    },
    harness: function (o, id) {
      var c = o.color;
      return '<path d="M120 130 Q200 90 280 130 L300 250 Q200 300 100 250 Z" fill="' + c + '"/><path d="M120 130 Q200 90 280 130 L300 250 Q200 300 100 250 Z" fill="none" stroke="' + sh(c, -0.3) + '" stroke-width="6"/><path d="M128 150 Q200 120 272 150" stroke="' + sh(c, 0.35) + '" stroke-width="3" fill="none" stroke-dasharray="5 5"/>' +
        '<path d="M100 250 L70 320 M300 250 L330 320" stroke="' + sh(c, -0.25) + '" stroke-width="18" stroke-linecap="round"/><circle cx="200" cy="112" r="14" fill="none" stroke="#c7cbd0" stroke-width="6"/>' + (o.text ? '<text x="200" y="215" text-anchor="middle" font-family="Bricolage V,Arial" font-weight="800" font-size="22" fill="' + sh(c, 0.6) + '">' + safe(o.text, 10) + "</text>" : "");
    },
    litter: function (o, id) {
      var c = o.color;
      return '<path d="M80 170 L320 170 L300 320 Q298 332 286 332 L114 332 Q102 332 100 320 Z" fill="' + c + '"/><path d="M80 170 Q200 70 320 170 Z" fill="' + sh(c, 0.2) + '"/><ellipse cx="200" cy="248" rx="54" ry="50" fill="' + sh(c, -0.45) + '"/><rect x="70" y="164" width="260" height="14" rx="6" fill="' + sh(c, -0.2) + '"/>';
    },
    dog: function (o, id) {
      var c = o.color || "#d9925a", d = sh(c, -0.3);
      return '<path d="M118 120 Q70 140 84 230 Q96 262 128 238 Q140 180 150 150 Z" fill="' + d + '"/><path d="M282 120 Q330 140 316 230 Q304 262 272 238 Q260 180 250 150 Z" fill="' + d + '"/>' +
        '<ellipse cx="200" cy="190" rx="98" ry="104" fill="' + c + '"/><ellipse cx="200" cy="244" rx="58" ry="44" fill="#f5e6d3"/><ellipse cx="200" cy="216" rx="20" ry="14" fill="#2a1d16"/><path d="M200 230 Q200 254 182 258 M200 230 Q200 254 218 258" stroke="#2a1d16" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="164" cy="170" r="11" fill="#2a1d16"/><circle cx="236" cy="170" r="11" fill="#2a1d16"/><circle cx="167" cy="166" r="3.5" fill="#fff"/><circle cx="239" cy="166" r="3.5" fill="#fff"/>' +
        '<path d="M188 262 Q200 290 212 262" fill="#ef6f6c"/><ellipse cx="146" cy="216" rx="12" ry="7" fill="#f39a8f" opacity=".5"/><ellipse cx="254" cy="216" rx="12" ry="7" fill="#f39a8f" opacity=".5"/>';
    },
    cat: function (o, id) {
      var c = o.color || "#6d6a73", d = sh(c, -0.3);
      return '<path d="M118 150 L128 70 L182 118 Z" fill="' + c + '"/><path d="M282 150 L272 70 L218 118 Z" fill="' + c + '"/><path d="M130 130 L134 92 L166 120 Z" fill="#f2b8b5"/><path d="M270 130 L266 92 L234 120 Z" fill="#f2b8b5"/>' +
        '<ellipse cx="200" cy="196" rx="102" ry="92" fill="' + c + '"/><path d="M168 112 Q200 130 232 112" stroke="' + d + '" stroke-width="6" fill="none"/><ellipse cx="200" cy="240" rx="44" ry="30" fill="' + sh(c, 0.55) + '"/>' +
        '<ellipse cx="164" cy="186" rx="13" ry="16" fill="#e9c94b"/><ellipse cx="236" cy="186" rx="13" ry="16" fill="#e9c94b"/><ellipse cx="164" cy="188" rx="4" ry="12" fill="#1c1a1e"/><ellipse cx="236" cy="188" rx="4" ry="12" fill="#1c1a1e"/>' +
        '<path d="M192 224 L208 224 L200 234 Z" fill="#e88f8f"/><path d="M200 234 Q192 248 182 244 M200 234 Q208 248 218 244" stroke="#3a2f33" stroke-width="3" fill="none"/>' +
        '<path d="M150 236 L96 226 M150 244 L98 250 M250 236 L304 226 M250 244 L302 250" stroke="' + sh(c, 0.6) + '" stroke-width="2.5"/>';
    }
  };
  window.Pets = {
    kinds: Object.keys(D),
    draw: function (kind, o) {
      o = o || {}; o.color = o.color || "#ff7a3d";
      var id = ++uid, body = (D[kind] || D.ball)(o, id);
      var shadow = kind === "dog" || kind === "cat" ? "" : '<ellipse cx="200" cy="' + (kind === "bed" ? 336 : 360) + '" rx="' + (kind === "bed" ? 170 : 130) + '" ry="14" fill="rgba(0,0,0,.12)"/>';
      return '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">' + shadow + body + "</svg>";
    }
  };
})();
