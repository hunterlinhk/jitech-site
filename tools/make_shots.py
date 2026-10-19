"""Screenshot every page in /pages for the entrance wall (assets/img/shots/<ID>.jpg).

Needs Python with Playwright and Pillow:  pip install playwright pillow && playwright install chromium
Run from the project root while serving it:  python3 -m http.server 8000  then  python3 tools/make_shots.py
"""
import io, os, glob
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BASE = os.environ.get("SITE_URL", "http://localhost:8000/")
OUT = os.path.join(ROOT, "assets", "img", "shots")
os.makedirs(OUT, exist_ok=True)
ids = sorted(os.path.splitext(os.path.basename(f))[0] for f in glob.glob(os.path.join(ROOT, "pages", "*.html")))
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 960, "height": 600})
    for i in ids:
        pg.goto(BASE + "pages/" + i + ".html"); pg.wait_for_timeout(300)
        im = Image.open(io.BytesIO(pg.screenshot())).convert("RGB").resize((720, 450), Image.LANCZOS)
        im.save(os.path.join(OUT, i + ".jpg"), "JPEG", quality=80, optimize=True, progressive=True)
    b.close()
print("shots written:", len(ids))
