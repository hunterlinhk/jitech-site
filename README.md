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

## The homepage sequence

1. **Enter Site:** the black wall spreads out from the button and switched-off monitors appear one by one.
2. **Clicking a screen** (or waiting 5 s) ripples the monitors on into static, scrambled text, lost signal and buffering.
3. **About 3 s later**, the screens switch ring by ring, from the outside in, to the logo wall's blue, each ring after an uneven flicker.
4. **2 s after the wall is blue**, the JIEWEITECH letters slam in.
5. **5 s later**, the cases flip over into the websites, in a wave from the clicked screen (or from the top left).
6. **Scrolling one step** flips every screen into the full-wall logo; the wall lifts and a glossy floor reflects it.

The logo walls' sky drifts slowly. It is a single pre-drawn image moved with GPU transforms, and it pauses when it is off screen.

## Accessibility

- A photosensitivity warning with a "Turn effects off" switch sits under Enter Site.
- `prefers-reduced-motion` turns the static, flicker and drift off automatically.
- Any key or scroll skips the intro.

## Deploying

It is a static folder, so GitHub Pages, Netlify, Vercel or Cloudflare Pages can serve it as-is.
For GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
