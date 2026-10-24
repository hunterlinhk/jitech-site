"""Screenshot concept pages for the entrance wall and "Selected work" (assets/img/shots/<ID>.jpg).

Needs Python with Playwright and Pillow:  pip install playwright pillow && playwright install chromium
Start the site first (npm run dev, which serves http://localhost:3000), then
    python3 tools/make_shots.py            (every page)
    python3 tools/make_shots.py L1 R3      (only these pages)
Some pages use photos from Unsplash, so run it on a machine that can reach images.unsplash.com.
"""
import io, os, re, sys, glob
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BASE = os.environ.get("SHOTS_BASE", "http://localhost:3000/")
OUT = os.path.join(ROOT, "public", "assets", "img", "shots")
os.makedirs(OUT, exist_ok=True)
# every concept page (named like L1 or B5); helper pages such as the Design Studio preview are skipped
ids = sys.argv[1:] or sorted(n for n in (os.path.splitext(os.path.basename(f))[0] for f in glob.glob(os.path.join(ROOT, "public", "pages", "*.html"))) if re.fullmatch(r"[A-Z]\d", n))
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    for i in ids:
        pg.goto(BASE + "pages/" + i + ".html?wall", wait_until="networkidle")
        pg.wait_for_timeout(2600)   # let the entrance motion settle
        im = Image.open(io.BytesIO(pg.screenshot())).convert("RGB").resize((960, 600), Image.LANCZOS)
        im.save(os.path.join(OUT, i + ".jpg"), "JPEG", quality=82, optimize=True, progressive=True)
        print("shot", i)
    b.close()
