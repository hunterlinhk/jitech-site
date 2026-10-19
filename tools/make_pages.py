"""Generate the 20 JIEWEI concept webpages in /pages.

Run from the project root:  python3 tools/make_pages.py
Then refresh the entrance-wall screenshots:  python3 tools/make_shots.py

Each page: nav, hero (matching its card in the reference composition), and three sections below.
Outputs:
  hero/pages/<ID>.html   standalone (font embedded)
  hero/pages.json        [{id, rect, base, title, html(with /*FONT*/ token)}]
"""
import json, math, random, base64, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "pages") + os.sep
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- art helpers
def R(seed): return random.Random(seed)

def svg(inner, view="190 0 630 600", par="xMaxYMid slice", cls="art-svg"):
    return f'<svg class="{cls}" viewBox="{view}" preserveAspectRatio="{par}" aria-hidden="true">{inner}</svg>'

def _stops(stops):
    out = ""
    for t in stops:
        op = f' stop-opacity="{t[2]}"' if len(t) > 2 else ""
        out += f'<stop offset="{t[0]}" stop-color="{t[1]}"{op}/>'
    return out

def lg(id, stops, x1=0, y1=0, x2=1, y2=1):
    return f'<linearGradient id="{id}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{_stops(stops)}</linearGradient>'

def rg(id, stops, cx="50%", cy="50%", r="50%"):
    return f'<radialGradient id="{id}" cx="{cx}" cy="{cy}" r="{r}">{_stops(stops)}</radialGradient>'

BLUR = lambda id, s: f'<filter id="{id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{s}"/></filter>'

def chrome_fold():
    d = "<defs>" + lg("a", [(0, "#ffffff"), (.42, "#d5d8dc"), (.58, "#7f858d"), (.75, "#c9cdd2"), (1, "#f6f7f8")]) \
        + lg("b", [(0, "#1d2024"), (.45, "#5d636b"), (.7, "#d9dce0"), (1, "#ffffff")], 0, 1, 1, 0) \
        + lg("c", [(0, "#e9ebee"), (.5, "#a3a8af"), (1, "#3a3e44")], 0, 0, 0, 1) \
        + lg("e", [(0, "#ffffff", 0), (.5, "#ffffff", .95), (1, "#ffffff", 0)], 0, 0, 1, 0) \
        + BLUR("s", 18) + BLUR("h", 1.2) + "</defs>"
    return svg(d + '<ellipse cx="560" cy="575" rx="300" ry="34" fill="#000" opacity=".14" filter="url(#s)"/>'
               '<path d="M250 540 C330 420 420 260 500 170 L660 95 C620 230 610 360 620 470 Z" fill="url(#a)"/>'
               '<path d="M620 470 C610 360 620 230 660 95 L820 60 L820 520 Z" fill="url(#b)"/>'
               '<path d="M250 540 L620 470 L820 520 L820 620 L300 620 Z" fill="url(#c)"/>'
               '<path d="M500 170 L660 95 L820 60" stroke="url(#e)" stroke-width="3" fill="none" filter="url(#h)"/>'
               '<path d="M620 470 C610 360 620 230 660 95" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none" filter="url(#h)"/>')

def dark_panels(v):
    d = "<defs>" + lg("p", [(0, "#020202"), (.48, "#30343a"), (.52, "#0b0c0e"), (1, "#020202")], 0, 0, 1, .4) \
        + lg("q", [(0, "#0a0a0b"), (1, "#26292e")], 0, 0, 1, 1) \
        + lg("edge", [(0, "#ffffff", 0), (.4, "#e8eef6", .95), (1, "#ffffff", 0)], 0, 0, 0, 1) \
        + lg("blue", [(0, "#0a1a44", 0), (.45, "#4f8dff", 1), (1, "#9cc2ff", 0)], 0, 0, 1, 0) \
        + BLUR("g", 3) + BLUR("G", 14) + "</defs>"
    bg = '<rect width="800" height="600" fill="#030303"/>'
    if v == "l2":
        return svg(view="0 0 800 600", inner=d + bg + '<path d="M430 0 L800 0 L800 600 L600 600 Z" fill="url(#p)"/>'
                   '<path d="M560 70 L720 0 L800 0 L800 600 L700 600 Z" fill="url(#q)" opacity=".9"/>'
                   '<path d="M430 0 L600 600" stroke="url(#edge)" stroke-width="2.5" filter="url(#g)"/>'
                   '<path d="M560 70 L700 600" stroke="url(#edge)" stroke-width="1.5" opacity=".6"/>'
                   '<ellipse cx="640" cy="420" rx="40" ry="90" fill="#fff" opacity=".07" filter="url(#G)"/>')
    if v == "t4":
        return svg(view="0 0 800 600", inner=d + bg + '<path d="M470 600 C500 380 540 120 620 30 C650 0 700 -10 800 -10 L800 600 Z" fill="url(#p)"/>'
                   '<path d="M470 600 C500 380 540 120 620 30 C650 0 700 -10 800 -10" stroke="url(#edge)" stroke-width="3" fill="none" filter="url(#g)"/>'
                   '<path d="M640 600 C650 420 680 220 760 120" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none"/>'
                   '<ellipse cx="700" cy="300" rx="60" ry="200" fill="#9fb4d6" opacity=".08" filter="url(#G)"/>')
    # b3: curved glossy object with a cobalt rim
    return svg(view="0 0 800 600", inner=d + bg + '<path d="M300 620 C360 420 520 290 820 250 L820 620 Z" fill="url(#q)"/>'
               '<path d="M300 620 C360 420 520 290 820 250" stroke="url(#blue)" stroke-width="7" fill="none" filter="url(#g)"/>'
               '<path d="M300 620 C360 420 520 290 820 250" stroke="#bcd6ff" stroke-width="1.5" fill="none" opacity=".8"/>'
               '<path d="M420 620 C470 470 600 380 820 350" stroke="#4f8dff" stroke-opacity=".25" stroke-width="20" fill="none" filter="url(#G)"/>')

def disc():
    d = "<defs>" + lg("d", [(0, "#ffffff"), (.5, "#dadada"), (1, "#7d7d7d")], .2, 0, .8, 1) \
        + lg("w", [(0, "#4a4a4a"), (1, "#0b0b0b")], 0, 0, 1, 1) \
        + rg("pk", [(0, "#555"), (.6, "#151515"), (1, "#000")], "40%", "35%", "60%") + BLUR("s", 16) + "</defs>"
    return svg(d + '<ellipse cx="560" cy="560" rx="230" ry="26" fill="#000" opacity=".12" filter="url(#s)"/>'
               '<circle cx="560" cy="300" r="250" fill="url(#d)"/>'
               '<path d="M560 300 L560 50 A250 250 0 0 1 810 300 Z" fill="url(#w)" opacity=".2"/>'
               '<path d="M560 300 L810 300 A250 250 0 0 1 560 550 Z" fill="#fff" opacity=".35"/>'
               '<ellipse cx="545" cy="355" rx="62" ry="58" fill="url(#pk)"/>'
               '<ellipse cx="530" cy="335" rx="20" ry="10" fill="#fff" opacity=".18"/>'
               '<rect x="240" y="520" width="110" height="80" fill="#0a0a0a"/>')

def spiral():
    d = "<defs>" + lg("s1", [(0, "#ffffff"), (.5, "#bfc3c8"), (1, "#3b3f45")], 0, 0, 1, 1) \
        + lg("s2", [(0, "#2a2d31"), (.5, "#8c9198"), (1, "#f4f5f6")], 0, 1, 1, 0) \
        + lg("s3", [(0, "#f7f8f9"), (1, "#9aa0a7")], 0, 0, 0, 1) + BLUR("b", 16) + "</defs>"
    out = '<ellipse cx="560" cy="585" rx="280" ry="22" fill="#000" opacity=".12" filter="url(#b)"/>'
    arcs = [("s1", 330, 90), ("s2", 290, 70), ("s3", 245, 60), ("s1", 200, 50), ("s2", 150, 44)]
    for i, (g, rr, w) in enumerate(arcs):
        out += f'<path d="M{560-rr} 600 C{560-rr} {600-rr*1.3} {560+rr*.9} {600-rr*1.45} {820} {600-rr*.95}" stroke="url(#{g})" stroke-width="{w}" fill="none"/>'
        out += f'<path d="M{560-rr} 600 C{560-rr} {600-rr*1.3} {560+rr*.9} {600-rr*1.45} {820} {600-rr*.95}" stroke="#fff" stroke-opacity=".55" stroke-width="1.5" fill="none" transform="translate(0,{-w/2})"/>'
    return svg(d + out)

def globe(city=False):
    rnd = R(7 if not city else 11)
    cx, cy, r = (790, 880, 600) if not city else (760, 930, 640)
    d = "<defs>" + rg("sph", [(0, "#2b63c4"), (.35, "#0d2b66"), (.75, "#04122e"), (1, "#01040c")], "38%", "22%", "80%") \
        + BLUR("b4", 4) + BLUR("b24", 26) + BLUR("b1", 1.2) \
        + f'<clipPath id="cl"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>' \
        + '<filter id="tex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.009 0.014" numOctaves="4" seed="4"/>' \
          '<feColorMatrix type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.36  0 0 0 0 0.72  0 0 0 2.2 -1.05"/></filter>' + "</defs>"
    o = '<rect width="800" height="600" fill="#000"/>'
    for _ in range(70):
        o += f'<circle cx="{rnd.uniform(0,800):.0f}" cy="{rnd.uniform(0,600):.0f}" r="{rnd.uniform(.4,1.1):.1f}" fill="#fff" opacity="{rnd.uniform(.15,.6):.2f}"/>'
    o += f'<circle cx="{cx}" cy="{cy}" r="{r+20}" fill="none" stroke="#2f7bff" stroke-width="44" opacity=".38" filter="url(#b24)"/>'
    o += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#sph)"/>'
    o += f'<g clip-path="url(#cl)"><rect x="{cx-r}" y="{cy-r}" width="{2*r}" height="{2*r}" filter="url(#tex)" opacity=".45"/></g>'
    # points on the visible hemisphere, tilted
    pts = []
    for _ in range(150 if not city else 60):
        z = rnd.uniform(.25, 1); t = rnd.uniform(0, 2 * math.pi); s = math.sqrt(1 - z * z)
        x, y = s * math.cos(t), s * math.sin(t)
        px, py = cx + x * r, cy + y * r * .98
        if 0 < px < 820 and -10 < py < 610: pts.append((px, py, z))
    if not city:
        lines = ""
        for i, (x1, y1, z1) in enumerate(pts):
            near = sorted(pts, key=lambda p: (p[0]-x1)**2 + (p[1]-y1)**2)[1:3]
            for (x2, y2, z2) in near:
                lines += f'M{x1:.0f} {y1:.0f}L{x2:.0f} {y2:.0f}'
        o += f'<path d="{lines}" stroke="#8fc0ff" stroke-opacity=".35" stroke-width=".8" fill="none"/>'
        for (x, y, z) in pts:
            o += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{1.2+z*1.4:.1f}" fill="#cfe2ff" opacity="{.4+z*.5:.2f}"/>'
    else:
        lights = ""
        for _ in range(26):
            z = rnd.uniform(.35, 1); t = rnd.uniform(-math.pi * .95, -math.pi * .2); s = math.sqrt(1 - z * z)
            ccx, ccy = cx + s * math.cos(t) * r, cy + s * math.sin(t) * r
            for _ in range(rnd.randint(8, 26)):
                x = ccx + rnd.gauss(0, 14); y = ccy + rnd.gauss(0, 9)
                if (x-cx)**2 + (y-cy)**2 < r*r*.985:
                    lights += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rnd.uniform(.6,1.8):.1f}" fill="{rnd.choice(["#ffd27a","#ffb54d","#fff1c9"])}"/>'
        o += f'<g filter="url(#b1)">{lights}</g><g opacity=".6" filter="url(#b4)">{lights}</g>'
    o += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#9cc8ff" stroke-width="3" filter="url(#b4)"/>'
    o += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#e3f0ff" stroke-width=".8" opacity=".8"/>'
    return svg(d + o, view="0 0 800 600", par="xMaxYMax slice")

def headphones():
    d = "<defs>" + rg("cup", [(0, "#ffffff"), (.55, "#c9ccd0"), (.85, "#8a8f96"), (1, "#5d6168")], "38%", "32%", "70%") \
        + lg("band", [(0, "#f4f5f6"), (.5, "#a9aeb5"), (1, "#3f434a")], 0, 0, 1, 1) \
        + rg("pad", [(0, "#3a3a3a"), (1, "#050505")], "45%", "40%", "60%") + BLUR("s", 18) + BLUR("h", 1.5) + "</defs>"
    return svg(d + '<ellipse cx="600" cy="560" rx="240" ry="26" fill="#000" opacity=".14" filter="url(#s)"/>'
               '<path d="M450 400 C430 160 560 30 700 40 C800 48 840 160 820 300" stroke="url(#band)" stroke-width="42" fill="none" stroke-linecap="round"/>'
               '<path d="M450 400 C430 160 560 30 700 40" stroke="#fff" stroke-opacity=".8" stroke-width="3" fill="none" transform="translate(-14,-6)" filter="url(#h)"/>'
               '<circle cx="745" cy="360" r="120" fill="#6f747b"/>'
               '<circle cx="560" cy="390" r="150" fill="url(#cup)"/>'
               '<circle cx="560" cy="390" r="104" fill="url(#pad)"/>'
               '<circle cx="560" cy="390" r="74" fill="none" stroke="#2a2a2a" stroke-width="6"/>'
               '<ellipse cx="520" cy="345" rx="34" ry="16" fill="#fff" opacity=".14"/>'
               '<circle cx="560" cy="390" r="150" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>')

def paper():
    d = "<defs>" + lg("f1", [(0, "#ffffff"), (1, "#d7d9dc")], 0, 0, 1, 1) + lg("f2", [(0, "#c3c6ca"), (.6, "#f3f4f5"), (1, "#ffffff")], 0, 1, 1, 0) \
        + lg("f3", [(0, "#e6e8ea"), (1, "#9da2a8")], 0, 0, 0, 1) + BLUR("s", 14) + "</defs>"
    return svg(d + '<path d="M380 600 C420 420 520 330 700 300 L820 290 L820 600 Z" fill="#000" opacity=".1" filter="url(#s)"/>'
               '<path d="M360 600 C400 420 500 320 690 280 L820 270 L820 600 Z" fill="url(#f1)"/>'
               '<path d="M520 120 C600 200 640 300 650 440 C700 360 760 300 820 280 L820 100 C720 90 610 95 520 120 Z" fill="url(#f2)"/>'
               '<path d="M650 440 C640 300 600 200 520 120 C560 250 590 360 560 520 Z" fill="url(#f3)"/>'
               '<path d="M700 0 L820 0 L820 160 C780 110 740 60 700 0 Z" fill="#0b0b0b"/>')

def glass_tower():
    d = "<defs>" + lg("sky", [(0, "#a9c8f0"), (.6, "#dbe8f8"), (1, "#f5f8fc")], 0, 0, 0, 1) \
        + lg("lf", [(0, "#1a2c47"), (.5, "#3d5f8f"), (1, "#8fb0d9")], 0, 1, 1, 0) \
        + lg("rf", [(0, "#0d1a2c"), (1, "#2a4a74")], 0, 0, 1, 1) \
        + lg("ref", [(0, "#ffffff", 0), (.5, "#ffffff", .45), (1, "#ffffff", 0)], 0, 0, 1, 0) + "</defs>"
    o = '<rect width="800" height="600" fill="url(#sky)"/>'
    L = [(380, 600), (470, 130)]; M = [(640, 600), (640, 40)]; Rr = [(820, 600), (820, 120)]
    o += f'<path d="M380 600 L470 130 L640 40 L640 600 Z" fill="url(#lf)"/><path d="M640 40 L820 120 L820 600 L640 600 Z" fill="url(#rf)"/>'
    g = ""
    for i in range(1, 12):
        t = i / 12
        g += f'M{380+(470-380)*(1-t):.0f} {600-(600-130)*(1-t):.0f}L640 {600-560*(1-t):.0f}'
    for i in range(1, 9):
        t = i / 9; xb = 380 + 260 * t; xt = 470 + 170 * t; yt = 130 - 90 * t
        g += f'M{xb:.0f} 600L{xt:.0f} {yt:.0f}'
    for i in range(1, 14):
        t = i / 14
        g += f'M640 {600-560*(1-t):.0f}L820 {600-480*(1-t):.0f}'
    o += f'<path d="{g}" stroke="#cfe0f5" stroke-opacity=".45" stroke-width="1" fill="none"/>'
    o += '<path d="M470 130 L560 85 L480 600 L420 600 Z" fill="url(#ref)" opacity=".7"/>'
    for i in range(14):
        o += f'<rect x="{400+i*16}" y="{560-(i%3)*14}" width="9" height="6" fill="#ffc874" opacity=".75"/>'
    return svg(d + o, view="0 0 800 600")

def ribbon(v):
    d = "<defs>" + lg("rb", [(0, "#06236e"), (.35, "#1f5fff"), (.6, "#8db6ff"), (.8, "#e8f0ff"), (1, "#2b62e8")], 0, 0, 1, 1) \
        + lg("rb2", [(0, "#dfeaff"), (.5, "#3b77ff"), (1, "#05164a")], 1, 0, 0, 1) + BLUR("g", 3) + BLUR("G", 22) + "</defs>"
    if v == "loop":
        return svg(d + '<path d="M420 520 C380 330 520 160 690 190 C840 220 830 430 690 460 C560 490 520 360 610 300" stroke="#1f5fff" stroke-opacity=".25" stroke-width="140" fill="none" filter="url(#G)"/>'
                   '<path d="M420 520 C380 330 520 160 690 190 C840 220 830 430 690 460 C560 490 520 360 610 300" stroke="url(#rb)" stroke-width="96" fill="none" stroke-linecap="round"/>'
                   '<path d="M420 520 C380 330 520 160 690 190 C840 220 830 430 690 460" stroke="#fff" stroke-opacity=".75" stroke-width="5" fill="none" filter="url(#g)" transform="translate(-10,-18)"/>'
                   '<path d="M470 560 C430 380 560 230 700 250" stroke="url(#rb2)" stroke-width="40" fill="none" opacity=".8"/>')
    return svg(d + '<rect x="600" y="0" width="200" height="600" fill="#05070c"/>'
               '<path d="M300 560 C420 470 520 260 640 220 C720 190 780 230 830 160" stroke="#1f5fff" stroke-opacity=".3" stroke-width="150" fill="none" filter="url(#G)"/>'
               '<path d="M300 560 C420 470 520 260 640 220 C720 190 780 230 830 160" stroke="url(#rb)" stroke-width="100" fill="none"/>'
               '<path d="M330 600 C450 500 540 330 660 300 C740 280 790 300 830 260" stroke="url(#rb2)" stroke-width="54" fill="none"/>'
               '<path d="M300 560 C420 470 520 260 640 220 C720 190 780 230 830 160" stroke="#fff" stroke-opacity=".8" stroke-width="4" fill="none" filter="url(#g)" transform="translate(-6,-36)"/>')

def monolith():
    d = "<defs>" + lg("l", [(0, "#ffffff"), (1, "#bfc2c6")], 0, 0, 1, 1) + lg("r", [(0, "#4a4d52"), (1, "#121315")], 0, 0, 1, 1) \
        + lg("t", [(0, "#f2f3f4"), (1, "#9a9ea4")]) + BLUR("s", 16) + "</defs>"
    return svg(d + '<rect width="800" height="600" fill="#e9eaec"/>'
               '<ellipse cx="610" cy="590" rx="260" ry="24" fill="#000" opacity=".18" filter="url(#s)"/>'
               '<path d="M450 600 L480 110 L610 40 L610 600 Z" fill="url(#l)"/>'
               '<path d="M610 40 L780 120 L790 600 L610 600 Z" fill="url(#r)"/>'
               '<path d="M480 110 L610 40 L640 30 L520 95 Z" fill="url(#t)"/>'
               '<path d="M610 40 L610 600" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>')

def laptop():
    inner = ('<rect x="372" y="112" width="386" height="250" fill="#f3f4f6"/>'
             '<path d="M520 362 C560 280 620 210 700 160 L758 140 L758 362 Z" fill="url(#lf)"/>'
             '<path d="M600 362 C640 300 690 250 758 220 L758 362 Z" fill="url(#lr)"/>')
    d = "<defs>" + lg("lf", [(0, "#ffffff"), (.5, "#b8bcc2"), (1, "#5d6168")], 0, 0, 1, 1) + lg("lr", [(0, "#2b2e33"), (1, "#c9ccd0")], 0, 1, 1, 0) \
        + lg("base", [(0, "#d6d8db"), (1, "#7d8187")], 0, 0, 0, 1) + BLUR("s", 14) + "</defs>"
    return svg(d + '<ellipse cx="575" cy="470" rx="290" ry="20" fill="#000" opacity=".18" filter="url(#s)"/>'
               '<rect x="360" y="100" width="410" height="275" rx="10" fill="#0d0d0e"/>' + inner +
               '<path d="M318 378 L812 378 L790 402 L340 402 Z" fill="url(#base)"/><rect x="540" y="378" width="70" height="5" rx="2" fill="#9a9ea4"/>')

def portrait(theme):
    face = ("M640 150 C602 156 586 190 588 226 L572 262 L590 272 C588 282 592 289 597 292 "
            "C590 300 592 308 598 313 C598 331 610 346 630 349 C662 351 690 330 700 300 L702 200 Z")
    hair = ("M606 150 C650 98 762 118 772 222 C782 302 760 382 780 460 C790 520 800 560 800 600 L686 600 "
            "C688 520 680 420 676 330 C672 262 662 205 606 150 Z")
    if theme == "dark":
        d = "<defs>" + lg("sk", [(0, "#bdbdbd"), (.5, "#6a6a6a"), (1, "#151515")], 0, 0, 1, 0) \
            + rg("bg", [(0, "#2a2a2a"), (1, "#030303")], "74%", "40%", "42%") + BLUR("rim", 2.2) + BLUR("soft", 10) + "</defs>"
        return svg(d + '<rect width="800" height="600" fill="url(#bg)"/>'
                   '<path d="M640 340 L702 330 L712 430 L650 438 Z" fill="#3a3a3a"/>'
                   f'<path d="{face}" fill="url(#sk)"/>'
                   f'<path d="{face}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" filter="url(#rim)"/>'
                   f'<path d="{hair}" fill="#070707"/>'
                   '<path d="M540 600 C580 500 640 452 704 444 C760 442 800 470 800 500 L800 600 Z" fill="#0b0b0b"/>'
                   '<path d="M540 600 C580 500 640 452 704 444" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none" filter="url(#rim)"/>', view="330 60 470 470")
    d = "<defs>" + lg("coat", [(0, "#232323"), (1, "#000")], 0, 0, 1, 1) + lg("sk", [(0, "#ececec"), (1, "#9a9a9a")], 0, 0, 1, 0) + BLUR("rim", 2) + "</defs>"
    head = ('<path d="M618 196 L652 190 L660 250 L626 256 Z" fill="#a5a5a5"/>'
            '<path d="M640 92 C612 94 598 118 598 140 L588 162 L598 168 C597 176 600 182 604 184 C600 190 602 196 607 199 C608 212 618 222 632 222 C652 222 664 206 666 186 L668 120 Z" fill="url(#sk)"/>'
            '<path d="M628 96 C656 66 708 68 724 106 C740 146 728 200 700 238 C694 208 688 178 672 158 C660 142 646 128 628 122 Z" fill="#060606"/>'
            '<path d="M600 128 C606 96 632 82 664 84 C650 96 640 110 634 126 Z" fill="#060606"/>')
    return svg(d + '<rect width="800" height="600" fill="#fafafa"/>'
               '<path d="M330 600 C400 470 470 360 560 300 C600 274 640 248 690 252 C740 258 770 300 790 360 C810 430 820 520 830 600 Z" fill="url(#coat)"/>'
               '<path d="M330 600 C400 470 470 360 560 300 C520 380 470 470 440 600 Z" fill="#000"/>'
               '<path d="M560 300 C520 380 470 470 440 600" stroke="#fff" stroke-opacity=".22" stroke-width="2" fill="none" filter="url(#rim)"/>'
               + head, view="300 40 520 560")

def halftone():
    poly = [(800,90),(700,55),(610,70),(560,120),(545,190),(515,250),(500,272),(528,292),(528,312),(518,322),(536,338),(530,356),(548,388),(590,412),(630,418),(640,470),(560,560),(520,600),(800,600)]
    def inside(x, y):
        c = False; n = len(poly)
        for i in range(n):
            x1, y1 = poly[i]; x2, y2 = poly[(i+1) % n]
            if (y1 > y) != (y2 > y) and x < (x2-x1)*(y-y1)/(y2-y1) + x1: c = not c
        return c
    rnd = R(5); dots = ""
    step = 9
    for gy in range(0, 600, step):
        for gx in range(380, 800, step):
            x = gx + (step/2 if (gy//step) % 2 else 0)
            if inside(x, gy):
                b = max(0, min(1, 1 - (x-500)/330 + rnd.uniform(-.12,.12)))
                rr = .6 + 3.6*b
                dots += f'<circle cx="{x:.0f}" cy="{gy}" r="{rr:.1f}"/>'
            elif rnd.random() < .05 and gx > 430:
                dots += f'<circle cx="{x:.0f}" cy="{gy}" r=".7" opacity=".5"/>'
    return svg('<rect width="800" height="600" fill="#030303"/>' + f'<g fill="#f2f2f2">{dots}</g>', view="0 0 800 600")

def corner():
    d = "<defs>" + lg("k", [(0, "#3a3d42"), (1, "#050505")], 0, 0, 1, 1) + "</defs>"
    return svg(d + '<path d="M470 40 L800 0 L800 330 L640 330 C600 230 540 130 470 40 Z" fill="url(#k)"/>'
               '<path d="M470 40 C540 130 600 230 640 330" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>', par="xMaxYMin slice")

def gallery():
    d = "<defs>" + lg("k", [(0, "#ececec"), (1, "#7a7a7a")], 0, 0, 1, 1) + lg("w", [(0, "#ffffff"), (1, "#bcbcbc")], 0, 1, 1, 0) + "</defs>"
    return svg(d + '<rect x="420" y="0" width="380" height="600" fill="#060606"/>'
               '<path d="M470 600 L560 120 L640 600 Z" fill="url(#k)" opacity=".85"/>'
               '<path d="M600 600 L800 260 L800 600 Z" fill="url(#w)"/>'
               '<path d="M560 120 L800 40 L800 110 Z" fill="#2a2a2a"/>', par="xMaxYMid slice")

ART = {"chrome": chrome_fold, "disc": disc, "spiral": spiral, "headphones": headphones, "paper": paper, "tower": glass_tower,
       "monolith": monolith, "laptop": laptop, "halftone": halftone, "corner": corner, "gallery": gallery}

def art(name):
    if name.startswith("panels:"): return dark_panels(name.split(":")[1])
    if name.startswith("globe"): return globe(city=name == "globe:city")
    if name.startswith("ribbon:"): return ribbon(name.split(":")[1])
    if name.startswith("portrait:"): return portrait(name.split(":")[1])
    return ART[name]()

# small product/thumbnail tiles drawn in SVG
def thumb(kind, dark=False):
    bg = "#1a1a1a" if dark else "#f1f2f3"
    shapes = {
        "headset": '<rect x="18" y="34" width="64" height="30" rx="12" fill="#e9e9e9"/><rect x="24" y="40" width="52" height="18" rx="8" fill="#111"/>',
        "lens": '<circle cx="50" cy="50" r="28" fill="#0d0d0d"/><circle cx="50" cy="50" r="18" fill="#2c2c2c"/><circle cx="44" cy="44" r="5" fill="#777"/>',
        "speaker": '<rect x="32" y="22" width="36" height="58" rx="10" fill="#fafafa" stroke="#cfcfcf"/><circle cx="50" cy="40" r="7" fill="#d9d9d9"/>',
        "person": '<circle cx="50" cy="30" r="10" fill="#7a7a7a"/><path d="M30 92 C30 60 40 46 50 46 C60 46 70 60 70 92 Z" fill="#141414"/>',
        "vase": '<path d="M42 20 L58 20 L60 34 C70 44 70 70 60 84 L40 84 C30 70 30 44 40 34 Z" fill="#8a6b4e"/>',
        "phone": '<rect x="36" y="16" width="28" height="68" rx="6" fill="#0d0d0d"/>',
        "card": '<rect x="22" y="30" width="56" height="40" rx="4" fill="#fff" stroke="#d0d0d0"/><rect x="28" y="38" width="24" height="4" fill="#bbb"/>',
        "blob": '<path d="M20 80 C30 30 60 20 84 40 L84 80 Z" fill="#0d0d0d"/>',
    }
    return f'<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><rect width="100" height="100" fill="{bg}"/>{shapes[kind]}</svg>'

# ---------------------------------------------------------------- pages
RECTS = {
 "L1":(20,58,335,232),  "L2":(20,244,308,373), "L3":(20,385,304,527), "L4":(20,541,305,688), "L5":(20,706,304,868),
 "T1":(354,102,656,254),"T2":(689,68,1017,256), "T3":(1036,96,1318,256),"T4":(1336,62,1654,195),
 "R1":(1336,208,1531,355),"R2":(1538,208,1654,355),"R3":(1349,372,1654,518),"R4":(1336,531,1654,645),"R5":(1336,661,1654,880),
 "B1":(322,606,586,726),"B2":(322,738,586,874),"B3":(601,634,925,785),"B4":(612,801,935,903),"B5":(944,622,1303,777),"B6":(950,793,1317,904),
}

P = [
 dict(id="L1", theme="light", title=["Design Drives", "Business Value"], sub=["From vision to impact,", "with the power of design."], art="chrome"),
 dict(id="L2", theme="dark", title=["Redefine", "the Digital Era"], sub=["New experience.", "New growth."], art="panels:l2"),
 dict(id="L3", theme="light", title=["Creating Brands", "for a Better Tomorrow"], sub=["Design with purpose.", "People at the center."], art="disc"),
 dict(id="L4", theme="dark", title=["A New", "Perspective"], sub=["Different thinking.", "Bigger possibilities."], art="portrait:dark", strip="products"),
 dict(id="L5", theme="light", title=["From Product", "to Possibility"], sub=["Ideas create new value."], art="spiral"),
 dict(id="T1", theme="dark", layout="full", title=["Explore", "New Possibilities"], sub=["Technology opens a broader world."], art="globe", cta="outline"),
 dict(id="T2", theme="light", title=["Crafting", "Memorable Brands"], sub=["Focus on brand experience", "and long-term value."], art="headphones", strip="services", cta="outline"),
 dict(id="T3", theme="light", title=["A Simpler", "Digital World"], sub=["Less complexity.", "More possibilities."], art="paper"),
 dict(id="T4", theme="dark", title=["Technology", "and Humanity"], sub=["Reimagine everyday life", "through innovation."], art="panels:t4"),
 dict(id="R1", theme="sky", base=700, title=["Enterprise", "Digital Partner"], sub=["Grow together with", "technology."], art="tower", cta="outline"),
 dict(id="R2", theme="light", base=440, layout="compact", title=["Design", "for What's Next"], sub=[], art="corner", strip="mini"),
 dict(id="R3", theme="light", title=["Connect the World,", "Create Innovation"], sub=["Technology brings", "more possibilities."], art="ribbon:wave", cta="outline"),
 dict(id="R4", theme="dark", layout="full", title=["Drive", "Industry Progress"], sub=["With technology,", "towards a better future."], art="globe:city", cta="outline"),
 dict(id="R5", theme="light", title=["Style Never Fades"], sub=["More than style,", "it's an attitude."], art="portrait:light", strip="fashion"),
 dict(id="B1", theme="light", title=["Building", "the Future"], sub=["For forward-thinking", "enterprises."], art="monolith", cta="outline"),
 dict(id="B2", theme="light", title=["Premium", "Web Experiences"], sub=["Design. Technology. Growth."], art="ribbon:loop", cta="outline"),
 dict(id="B3", theme="dark", navtheme="light", title=["Future-Ready", "Digital Products"], sub=["Turn ideas into real products."], art="panels:b3", cta="outline"),
 dict(id="B4", theme="light", layout="side", title=["Strategy", "Design", "Technology"], sub=[], art="gallery", cta="outline"),
 dict(id="B5", theme="light", title=["High-Quality", "Digital Solutions"], sub=["Empower enterprises", "in the digital era."], art="laptop", cta="outline"),
 dict(id="B6", theme="dark", title=["Design", "Bridges Business", "and People"], sub=["Technology creates connection."], art="halftone", cta="outline"),
]

COLS = [
 [("Strategy", "We shape direction before anything is built."), ("Design", "Clear, considered work made to last."), ("Technology", "Built on tools that grow with you.")],
 [("Brand", "Identity systems with a point of view."), ("Product", "Interfaces that feel simple to use."), ("Experience", "Every touchpoint working together.")],
 [("Discover", "We start by listening closely."), ("Create", "Ideas become working prototypes."), ("Deliver", "Launched, measured, refined.")],
]

ICON_SEARCH = '<svg viewBox="0 0 20 20" width="15" height="15"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13 13 L17 17" stroke="currentColor" stroke-width="1.8"/></svg>'
ICON_MENU = '<svg viewBox="0 0 20 20" width="17" height="17"><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.6"/></svg>'

CSS = """
/*FONT*/
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0}
body{font-family:"Inter Variable",Inter,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;color:var(--fg);background:var(--bg);font-size:16px}
:root{--fg:#0b0b0c;--muted:#5d6168;--bg:#fbfbfb;--line:rgba(0,0,0,.08);--accent:#1f5fff}
body.dark{--fg:#f4f5f6;--muted:#a3a8ae;--bg:#030303;--line:rgba(255,255,255,.12)}
body.sky{--bg:#f6f9fd}
a{color:inherit;text-decoration:none}
h1,h2,h3,p{margin:0}
.nav{position:relative;z-index:5;display:flex;align-items:center;gap:2.4vw;height:72px;padding:0 3.4vw;background:var(--bg);border-bottom:1px solid var(--line)}
.nav.light{--fg:#0b0b0c;--muted:#5d6168;--bg:#ffffff;--line:rgba(0,0,0,.08);color:#0b0b0c}
.logo{display:flex;align-items:center;gap:8px;font-weight:800;font-size:18px;letter-spacing:.02em;margin-right:auto}
.logo i{width:17px;height:17px;border-radius:50%;border:4.5px solid currentColor;display:block}
.links{display:flex;gap:2.6vw;font-size:14px;color:var(--muted)}
.links a:hover{color:var(--fg)}
.icons{display:flex;gap:18px;align-items:center;margin-left:3vw}
.hero{position:relative;min-height:calc(100vh - 72px);overflow:hidden;display:flex}
.hero .copy{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;gap:1.6vw;padding:0 5.4vw 2vw;max-width:64%}
.hero h1{font-size:5.6vw;line-height:1.06;font-weight:600;letter-spacing:-.025em}
.hero h1 span{display:block;white-space:nowrap}
.hero .sub{font-size:2.05vw;line-height:1.45;color:var(--muted)}
.hero .sub span{display:block}
.btn{align-self:flex-start;display:inline-flex;align-items:center;gap:.6em;padding:.85em 1.6em;border-radius:999px;font-size:max(12px,1.55vw);font-weight:600;background:var(--fg);color:var(--bg);margin-top:.6vw}
.btn.outline{background:transparent;color:var(--fg);border:1.5px solid currentColor}
.btn svg{width:1em;height:1em}
.art{position:absolute;inset:0 0 0 36%;z-index:1}
.art-svg{width:100%;height:100%;display:block}
.full .art{inset:0}
.full .copy{max-width:60%}
.full::after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(0,0,0,.75),rgba(0,0,0,0) 55%)}
.side{display:grid;grid-template-columns:22% 1fr}
.side .copy{max-width:none;gap:1.4vw;padding-top:3vw}
.side .copy h1{font-size:2vw;font-weight:500;color:var(--muted)}
.side .copy h1 span{margin-bottom:.9vw}
.side .art{inset:0 0 0 46%}
.side .pics{position:absolute;left:24%;top:12%;bottom:12%;width:21%;display:grid;grid-template-columns:1fr 1fr;gap:1.2vw;z-index:2}
.side .pics div{background:#e5e6e8;position:relative;overflow:hidden}
.compact .copy{max-width:72%;justify-content:flex-start;padding-top:14vw}
.compact .copy h1{font-size:8.6vw}
.compact .art{inset:0 0 40% 50%}
.strip{position:absolute;left:0;right:0;bottom:0;z-index:3;display:grid;grid-template-columns:repeat(3,1fr);gap:1.4vw;padding:0 5.4vw 3vw}
.strip .it{display:flex;align-items:center;gap:1vw;font-size:1.05vw;font-weight:600;line-height:1.25}
.strip .ph svg,.strip.products svg,.strip.mini svg{width:100%;height:100%;display:block}
.strip .it>svg.arr{width:1.6vw;height:1.6vw;flex:none}
.strip.products{height:24%;right:38%;padding-bottom:2.4vw}
.strip.products .it{background:#f1f2f3}
.strip.products .it,.strip.products .ph{height:100%}
.strip.services{position:absolute;bottom:2.4vw;left:5.4vw;right:3vw;padding:0;height:14%;gap:1vw}
.strip.services .it{background:#fff;border:1px solid var(--line);padding:0 1.2vw;justify-content:space-between}
.strip.services .ph{width:34%;height:80%}
.strip.fashion{height:24%;background:#fff;border-top:1px solid var(--line);grid-template-columns:1fr 1fr 1.2fr;padding:2vw 5.4vw}
.strip.fashion .ph{height:100%;aspect-ratio:1/1}
.strip.fashion .list{font-size:1.1vw;color:var(--muted);line-height:1.8;display:flex;justify-content:space-between;align-items:center}
.strip.mini{height:22%;padding:0 6vw 6vw;gap:3vw}
.strip.mini .it{height:100%}
.hero.with-strip .copy{padding-bottom:12vw}
.hero.with-strip.fashion-strip .copy{padding-bottom:26vh}
.hero.with-strip.products-strip .copy{padding-bottom:24vh}
/* sections below the hero */
section{padding:9vw 5.4vw}
.intro h2{font-size:3.4vw;line-height:1.12;font-weight:560;letter-spacing:-.02em;max-width:18ch}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:3vw;margin-top:5vw;border-top:1px solid var(--line);padding-top:2.4vw}
.cols h3{font-size:1.4vw;font-weight:600;margin-bottom:.8vw}
.cols p{font-size:1.1vw;line-height:1.55;color:var(--muted)}
.panel{position:relative;height:42vw;overflow:hidden;background:var(--panel,#0b0b0c);margin:0 5.4vw;border-radius:6px}
.panel .art{inset:0}
.cap{display:flex;justify-content:space-between;gap:2vw;margin:1.4vw 5.4vw 0;font-size:1.05vw;color:var(--muted)}
.cta{text-align:left}
.cta h2{font-size:4.4vw;font-weight:560;letter-spacing:-.025em;line-height:1.05;max-width:16ch}
.cta .btn{margin-top:2.4vw}
footer{display:flex;justify-content:space-between;align-items:center;padding:2.6vw 5.4vw;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}
"""

ARROW = '<svg class="arr" viewBox="0 0 16 16"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>'

def strip_html(kind, dark):
    if kind == "products":
        return '<div class="strip products">' + "".join(f'<div class="it">{thumb(k)}</div>' for k in ("headset", "lens", "speaker")) + "</div>"
    if kind == "services":
        items = [("Brand<br>Strategy", None), ("Product<br>Design", "blob"), ("Digital<br>Experience", "phone")]
        return '<div class="strip services">' + "".join(
            f'<div class="it"><span>{t}</span>' + (f'<span class="ph">{thumb(k)}</span>' if k else ARROW) + "</div>" for t, k in items) + "</div>"
    if kind == "fashion":
        return ('<div class="strip fashion"><div class="ph">' + thumb("person") + '</div><div class="ph">' + thumb("person") +
                '</div><div class="list"><span>Fashion<br>Lifestyle<br>Inspiration</span>' + ARROW.replace("<svg", '<svg width="22"') + "</div></div>")
    if kind == "mini":
        return '<div class="strip mini">' + "".join(f'<div class="it">{thumb(k)}</div>' for k in ("vase", "card", "phone")) + "</div>"
    return ""

def page_html(p):
    theme = p["theme"]; dark = theme == "dark"
    body_cls = {"dark": "dark", "sky": "sky"}.get(theme, "")
    layout = p.get("layout", "split")
    navcls = "nav light" if p.get("navtheme") == "light" else "nav"
    nav = (f'<header class="{navcls}"><a class="logo" href="#top"><i></i>JIEWEI</a>'
           '<nav class="links"><a href="#top">Home</a><a href="#solutions">Solutions</a><a href="#about">About</a><a href="#work">Work</a><a href="#contact">Contact</a></nav>'
           f'<div class="icons">{ICON_SEARCH}{ICON_MENU}</div></header>')
    title = "".join(f"<span>{t}</span>" for t in p["title"])
    sub = "".join(f"<span>{s}</span>" for s in p["sub"])
    btn_cls = "btn outline" if p.get("cta") == "outline" else "btn"
    strip = p.get("strip")
    hero_cls = f"hero {layout}" + (f" with-strip {strip}-strip" if strip else "")
    if layout == "side":
        copy = (f'<div class="copy"><h1>{title}</h1><a class="{btn_cls}" href="#contact">Explore {ARROW}</a></div>'
                f'<div class="pics"><div>{thumb("person", True)}</div><div>{thumb("blob")}</div></div>')
    else:
        copy = (f'<div class="copy"><h1>{title}</h1>' + (f'<p class="sub">{sub}</p>' if sub else "") +
                f'<a class="{btn_cls}" href="#contact">Explore {ARROW}</a></div>')
    hero = f'<section class="{hero_cls}" id="top" style="padding:0">{copy}<div class="art">{art(p["art"])}</div>{strip_html(strip, dark) if strip else ""}</section>'
    cols = COLS[hash(p["id"]) % 3 if False else (ord(p["id"][1]) + ord(p["id"][0])) % 3]
    plain = " ".join(p["title"])
    intro = (f'<section class="intro" id="solutions"><h2>{plain}. {(" ".join(p["sub"]) or "Design, technology, and growth, working together.")}</h2>'
             '<div class="cols">' + "".join(f"<div><h3>{h}</h3><p>{t}</p></div>" for h, t in cols) + "</div></section>")
    panel_bg = "#050505" if dark else "#eceef0"
    panel = (f'<div id="work"><div class="panel" style="--panel:{panel_bg}"><div class="art">{art(p["art"])}</div></div>'
             f'<div class="cap"><span>{p["title"][0]}</span><span>Design concept</span></div></div>')
    cta = (f'<section class="cta" id="contact"><h2>Let\'s create what comes next.</h2>'
           f'<a class="btn" href="#top">Get in touch {ARROW}</a></section>')
    foot = '<footer id="about"><span>JIEWEI</span><span>Design concept page</span></footer>'
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>JIEWEI | {plain}</title><style>{CSS}</style></head><body class="{body_cls}">{nav}<main>{hero}{intro}{panel}{cta}</main>{foot}</body></html>')

# Pages share the site's Inter font. On the homepage wall they are loaded with ?wall, which hides scrollbars.
FONT_LINK = ('@font-face{font-family:"Inter Variable";font-style:normal;font-display:swap;font-weight:100 900;'
             'src:url("../assets/fonts/inter.woff2") format("woff2-variations")}\n'
             'html.on-wall{overflow:hidden;scrollbar-width:none}html.on-wall::-webkit-scrollbar{display:none}')
WALL_JS = '<script>if(location.search.indexOf("wall")>-1)document.documentElement.className+=" on-wall"</script>'
for p in P:
    h = page_html(p).replace("/*FONT*/", FONT_LINK).replace("<style>", WALL_JS + "<style>", 1)
    open(OUT + p["id"] + ".html", "w").write(h)
print("pages written:", len(P))
