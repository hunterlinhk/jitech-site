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
| `pages/*.html` | The 13 concept websites shown on the monitors. Each is a complete, original page and opens full screen when a monitor is clicked |
| `pages/assets/` | What the concept pages share: fonts, reset, entrance motion, photo fallbacks |
| `assets/fonts/pages/` | Fonts used by the concept pages (all SIL Open Font License; licenses alongside) |
| `assets/img/shots/*.jpg` | Screenshots of those pages, used on the entrance wall and in "Selected work" |
| `assets/fonts/` | Inter, Bricolage Grotesque, Hanken Grotesk (all SIL Open Font License) |
| `assets/vendor/` | GSAP and ScrollTrigger |
| `tools/make_shots.py` | Regenerates the screenshots after the pages change |

## Common edits

- **Brand name / contact email:** the "Edit here" block at the top of `assets/js/site.js`, plus the text in `index.html`.
- **Which website sits on which monitor:** `LAYOUTS` in `assets/js/site.js` (`wide` for landscape screens, `tall` for portrait).
- **A concept page's text or design:** edit its file in `/pages` directly, then run `tools/make_shots.py` for that page.
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
5. **Clicking any blue screen** turns every outer screen over to show its website, starting from that screen.
   **Clicking the logo wall** does the same from the logo, and clicking it again turns them back to plain blue.
6. **Clicking a website on show** grows that screen until it fills the window; Close shrinks it back.
7. **Scrolling down** goes straight to "What we do". If websites are showing, they first turn back into the
   plain blue wall (about half a second), so the top of the page always comes back as the plain logo wall.

Each monitor gives its page a desktop-sized window shaped like the screen (1440 px wide, or 900 px tall for
squarer screens), then fills the screen from the top, so the page's first screen fits at any window size.

Each logo wall's sky is one shared layer behind the monitors, so the picture runs continuously behind the
bezels. Its water is a seamless strip of soft bands that slides sideways with a GPU transform, and it pauses
when it is off screen.

## Scrolling

Every page below the hero fits the window. One wheel notch, trackpad swipe, key press or touch swipe moves
one page, and every step takes about 1 s. Scrolling
again the same way while a page is moving speeds it up, so two scrolls finish in about 0.5 s. Leftover
trackpad momentum is ignored.

## Logo and cursor

The JIEWEITECH mark is traced from the original artwork, so its shape is exact. It lives once in
`index.html` as the `jwMark` symbol: the main shapes take the surrounding text color and the bar takes
`--mark-accent`. `assets/img/logo.svg` is the original-color version and `assets/img/favicon.svg` the tab icon.
On computers with a mouse or trackpad, the pointer is a small round cursor that grows over anything clickable.

## What we do

The services sit on the left and a picture sits on the right. Hovering a service (or tapping it on a phone)
swaps the picture. The pictures are listed in `SERVICE_IMAGES` at the top of `assets/js/site.js`; they are
stand-ins from the concept pages until you add your own.

## The concept pages

| Monitor | Page | Look |
| --- | --- | --- |
| L1 | Casa Ondina, a hotel on the Amalfi Coast | Full-bleed pool photo, serif title, booking bar |
| T1 | Noon, home solar | Striped poster sun rising over a panel field |
| T2 | Nocturne, a watchmaker | A live watch drawn in code, gold on forest green |
| R3 | Volta, electric cars | Night car photo under huge condensed type |
| L2 | Aurora, an AI ops tool | Moving aurora glow over a product window |
| L3 | Halden & Co., architects | Editorial serif masthead over a framed building |
| R4 | Kiln, a coffee roaster | Playful type, a drawn coffee bag, spinning badge |
| T4 | Atlas, mountain gear | Dawn summit photo with ALTITUDE across it |
| B3 | Ledger, business banking | Floating 3D cards and payment notes |
| B2 | Maison Sable, skincare | Soft split hero with product photo |
| B5 | Sonic Field, a festival | Stretching giant type, equalizer, lineup ticker |
| B6 | Orbital, a launch company | A planet with a satellite in orbit |
| L4 | Verde, grocery delivery | Rotating salad plate with stickers |

Photos come from [Unsplash](https://unsplash.com/license) (free to use, no attribution required, credited anyway)
and load straight from images.unsplash.com. If one can't load, its block keeps a matching colour tone.
The entrance wall has two separate groups of designs (`SCREENS.left` and `SCREENS.right` in `assets/js/site.js`),
so the columns never repeat each other. A tile shows the page's screenshot from `assets/img/shots/` when one
exists, and otherwise the live page scaled down. Running `tools/make_shots.py` on a machine with internet
access adds screenshots for the photo pages, and their tiles switch to those automatically.

## Accessibility

- A photosensitivity warning with a "Turn effects off" switch sits under Enter Site.
- `prefers-reduced-motion` turns the static, flicker and drift off automatically.
- Any key or scroll skips the intro.

## Deploying

It is a static folder, so GitHub Pages, Netlify, Vercel or Cloudflare Pages can serve it as-is.
For GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
