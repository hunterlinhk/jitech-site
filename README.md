# JIEWEITECH website

Static site: an entrance screen, then a homepage whose hero is a wall of monitors.
No build step is needed: it is plain HTML, CSS and JavaScript, with GSAP vendored in `assets/vendor`.

## Run it locally

Any static server works. From this folder:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` straight from disk mostly works, but the monitors load the pages in `/pages`,
so a local server is the reliable way to preview.

## What's where

| Path | What it is |
| --- | --- |
| `index.html` | Entrance screen and homepage (one route, two layers) |
| `assets/css/site.css` | All styles |
| `assets/js/site.js` | Everything that moves: entrance, monitor wall, intro sequence, screen 2, full-page scrolling |
| `pages/*.html` | The 20 concept websites shown on the monitors. Each is a complete page and opens full screen when a monitor is clicked |
| `assets/img/shots/*.jpg` | Screenshots of those pages, used on the entrance wall and in "Selected work" |
| `assets/fonts/` | Inter, Bricolage Grotesque, Hanken Grotesk (all SIL Open Font License) |
| `assets/vendor/` | GSAP and ScrollTrigger |
| `tools/make_pages.py` | Regenerates `/pages` (copy, layouts and the drawn artwork live here) |
| `tools/make_shots.py` | Regenerates the screenshots after the pages change |

## Common edits

- **Brand name / contact email:** the "Edit here" block at the top of `assets/js/site.js`, plus the text in `index.html`.
- **Which website sits on which monitor:** `LAYOUTS` in `assets/js/site.js` (`wide` for landscape screens, `tall` for portrait).
- **A concept page's text or artwork:** edit the `P` list in `tools/make_pages.py`, run it, then run `tools/make_shots.py`.
- **Colors:** CSS variables at the top of `assets/css/site.css`.
- **"What we do" pictures:** `SERVICE_IMAGES` in `assets/js/site.js`.

## The homepage sequence

1. **Enter Site:** the black wall spreads out from the button and switched-off monitors appear one by one.
2. **Clicking a screen** (or waiting 5 s) powers every screen up quickly from dim to bright, in black and white
   only: static, NO SIGNAL, grey test bars, tracking lines, a rolling picture and text dumps.
3. **Each screen starts cutting out at its own moment**: black, on, black, faster and faster, and then the
   whole wall cuts to complete black at once.
4. **After 2 s of black**, the logo wall's screens come on one by one and the JIEWEITECH letters pop in.
   Then the screens around it fade together from black into the logo wall's blue.
5. **Clicking the logo wall** turns every outer screen over to show its website, from the logo outward.
   Clicking it again turns them back to the plain blue.
6. **Clicking a single blue screen** turns just that one over. Clicking it again opens that website.
7. **Scrolling one step** turns every screen over, from the logo outward, into one full-screen logo wall.

Each logo wall's sky is one shared layer behind the monitors, so the picture runs continuously behind the
bezels. Its water is a seamless strip of soft bands that slides sideways with a GPU transform, and it pauses
when it is off screen.

## Scrolling

Every page below the hero fits the window. One wheel notch, trackpad swipe, key press or touch swipe moves
one page. A quick second scroll carries on to the next page at once, and leftover trackpad momentum is ignored.

## What we do

The services sit on the left and a picture sits on the right. Hovering a service (or tapping it on a phone)
swaps the picture. The pictures are listed in `SERVICE_IMAGES` at the top of `assets/js/site.js`; they are
stand-ins from the concept pages until you add your own.

## Accessibility

- A photosensitivity warning with a "Turn effects off" switch sits under Enter Site.
- `prefers-reduced-motion` turns the static, flicker and drift off automatically.
- Any key or scroll skips the intro.

## Deploying

It is a static folder, so GitHub Pages, Netlify, Vercel or Cloudflare Pages can serve it as-is.
For GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
