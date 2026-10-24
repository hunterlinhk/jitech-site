# JIEWEITECH website

The website of Jieweitech, Inc. (an entrance screen, then a homepage whose hero is a wall of monitors), its
inquiry system, and the admin dashboard where the team handles inquiries.

- **Website:** plain HTML, CSS and JavaScript in `public/`, with GSAP vendored. English and Spanish.
- **Server:** Node.js (Express) in `server/`. It serves the website, takes inquiries at `/api/inquiries`,
  and runs the dashboard API.
- **Database:** SQLite, one file in `data/`. Nothing else to install or run.
- **Dashboard:** `/admin`, in `admin/`. No build step.

## Run it on your computer

Needs Node.js 20 or newer.

```bash
npm install
cp .env.example .env          # then set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters)
npm run dev                   # http://localhost:3000, dashboard at http://localhost:3000/admin
```

The first start creates the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and asks for a new password at
first sign-in. Or create accounts from the command line:

```bash
npm run admin:create -- you@jieweitech.com "Your Name"   # asks for a password
npm run admin:reset-password -- you@jieweitech.com        # also unlocks the account and signs it out everywhere
npm run admin:disable-2fa -- you@jieweitech.com           # if someone loses their phone
npm run admin:list
```

`npm test` runs the API checks (inquiries, sign-in, permissions, two-factor codes, export).

## Put it online

It runs anywhere that runs Node.js or Docker and keeps a folder between restarts (for the database):
Fly.io, Railway or Render (with a persistent disk), or any VPS.

1. Set the environment variables from `.env.example` in your host's dashboard. The important ones:
   - `SITE_URL`: the live address, e.g. `https://www.jieweitech.com`. It's used in search-engine tags, the sitemap
     and alert emails, so set it before going live.
   - `NODE_ENV=production`
   - `DATA_DIR`: a persistent volume (the Docker image uses `/data`).
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` for the first account.
   - The `SMTP_…` and `MAIL_FROM` settings, so alerts and confirmation emails go out.
2. Deploy with the `Dockerfile` (`docker compose up -d` on a VPS), or run `npm ci --omit=dev && npm start`.
   `npm start` builds the site into `dist/` and starts the server.
3. Serve it over HTTPS. Most hosts do this for you; on a VPS put Caddy or nginx in front. Keep `TRUST_PROXY=1`
   behind a proxy.
4. Back up the database: `npm run backup` writes a copy to `backups/` (it keeps 30). Run it daily with cron,
   or snapshot the volume.

Health check: `GET /api/health`.

## What's where

| Path | What it is |
| --- | --- |
| `public/index.html` | Entrance screen and homepage (one route, two layers) |
| `public/website-development.html`, `geo-optimization.html`, `standalone-websites.html` | Service pages |
| `public/contact.html` | Contact page and inquiry form |
| `public/privacy.html`, `public/404.html` | Privacy policy and the not-found page |
| `public/assets/css/site.css` | Homepage styles, plus the navigation and footer every page shares |
| `public/assets/css/inner.css` | Styles for the service, contact and privacy pages |
| `public/assets/js/site.js` | Homepage: entrance, monitor wall, intro sequence, full-page scrolling |
| `public/assets/js/i18n.js` | English / Spanish switching |
| `public/assets/js/ui.js` | Every page: the language menu, the round cursor, and where a visit came from |
| `public/assets/js/inner.js` | Service and contact pages: mobile menu, scroll reveals, the inquiry form |
| `public/pages/*.html` | The 13 concept websites shown on the monitors |
| `server/` | The server: `app.js` (routes), `store.js` (database queries), `auth.js` (sign-in), `notify.js` (alerts and emails), `routes/` (the two APIs) |
| `admin/` | The dashboard (`js/app.js`, `js/inquiries.js`, `js/overview.js`, `js/pages.js`) |
| `tools/build.mjs` | Builds `dist/`: Spanish pages, search tags, sitemap. Runs on `npm start` / `npm run dev` |
| `scripts/` | Account commands and the backup |
| `test/` | API tests |
| `dist/` | Built site (generated, not in git) |
| `data/` | The database (not in git) |

## Company details

Jieweitech, Inc. · 3678 Admiralty Way, Suite 503, Marina del Rey, CA 90292, United States · +1 (510) 628-5269.
They appear in the footer of every page, on the contact page, in the privacy policy, in confirmation emails,
and in the structured data search engines read. To change them, edit `company` in `server/config.js` (emails,
structured data, `llms.txt`) and the text in the HTML pages.

## Inquiries

The contact form sends to `POST /api/inquiries`. It works without JavaScript too (the server redirects back
with a thank-you message). Each inquiry gets a reference number like `JW-1001`, shown to the visitor.

Spam protection, without puzzles for real visitors:
- a hidden field that only bots fill in (they get a normal-looking reply and nothing is saved)
- messages sent within 3 seconds of the page opening, or with many links, go to the Spam folder instead of the inbox
- at most 6 messages per network per 10 minutes (30 a day), and 5 per email address per hour

When an inquiry arrives:
- everyone signed in to the dashboard sees it immediately (a pop-up, an optional sound and desktop notification,
  and the unread count in the browser tab)
- team members who keep "Email me about new inquiries" on, plus any addresses under Settings, get an email
- an optional chat alert goes to a Slack, Discord, Teams or Zapier webhook (Settings)
- the visitor gets a confirmation in their language with their reference number (can be turned off in Settings)

Email needs the SMTP settings. Until they're set, alerts appear only in the dashboard and replies open in your own
email; a failed email is noted in the inquiry's activity. To try email locally without sending anything, set
`SMTP_URL=log`: emails are printed in the server log instead.

## The dashboard

At `/admin`. Sign in with your team account.

- **Overview:** today, the last 7 and 30 days, deals won this month, a 14-day chart, the pipeline, what people ask
  for, and what needs attention (unread and follow-ups due).
- **Inbox and views:** Inbox (open inquiries), Unread, Assigned to me, Follow-up due, All, Archived, Spam, plus one
  link per pipeline stage and per tag.
- **Search** across name, company, email, phone, message, notes and tags, or a reference number. Filter by status,
  person, service, priority, language and date; sort; export what you see as a CSV spreadsheet.
- **Each inquiry:** reply by email right in the dashboard (the server sends it from the company address, with a
  greeting and signature in the visitor's language; their answer comes back to your own inbox, and every reply is
  kept in the inquiry), or open the draft in Gmail, Outlook or your mail app instead; call or
  WhatsApp; set the status (New, Contacted, In discussion, Quote sent, Won, Closed / lost), priority, owner,
  follow-up date and tags; write internal notes; see the full history and earlier inquiries from the same email.
- **Bulk actions:** select several to change status, assign, tag, archive, mark read or unread, mark as spam or delete.
- **Shortcuts:** `/` search, `J` / `K` next and previous, `E` archive, `Esc` back to the list.
- **Team** (admins add people; each new person gets a one-time temporary password), **Settings** (alerts and the
  security log), and **Your account** (password, two-factor sign-in, sessions, notifications, light or dark look).

Roles: team members can read and manage every inquiry, add notes and export. Admins can also add people,
delete inquiries and change settings.

### Security

- Passwords are stored as scrypt hashes; at least 10 characters, and common ones are refused.
- Five wrong passwords lock an account for 15 minutes; sign-in attempts are also limited per network.
- Optional two-factor sign-in with any authenticator app.
- Sessions are kept on the server and sent in an HttpOnly, SameSite=Strict cookie (Secure in production). They end
  after 12 hours without activity or 7 days at most. Changing a password signs out every other session.
- Every change needs a CSRF token, and requests from other sites are refused.
- The dashboard has a strict Content Security Policy, can't be framed, and isn't indexed by search engines.
  Visitor text is always shown as text, never as HTML, in the dashboard and in emails, and the CSV export
  neutralises spreadsheet formulas.
- Sign-ins, account changes, exports and deletions are recorded in the security log.

## Languages and search engines

The site is in English and Spanish. Spanish lives in the HTML next to the English
(`<h2 data-es="Lo que hacemos">What we do</h2>`; attributes with `data-attr="aria-label" data-attr-es="…"`),
and text written by scripts is in `STR` in `public/assets/js/i18n.js`. The copy uses friendly, neutral
Latin American Spanish addressed as "tú".

`npm run build` turns that into two sets of pages: English at `/…` and Spanish at `/es/…`, each with the right
language already in the HTML, so search engines index both. Every page gets:
- `canonical` and `hreflang` links (English, Spanish, and English as the default)
- Open Graph tags in its language, with a social preview image
- structured data: the company (with address and phone), the website, the page, each service with its starting
  prices, the FAQs, and breadcrumbs
- plus `sitemap.xml` (with both languages), `robots.txt` (keeps `/admin` and `/api` out) and `llms.txt`,
  a short summary for AI tools. The concept websites on the monitors are marked `noindex`.

Choosing a language opens the matching address (the homepage swaps its text in place so the wall keeps its state,
and updates the address bar). The choice is remembered. A first-time visitor whose browser prefers Spanish gets
Spanish. `?lang=es` or `?lang=en` forces one. Spanish headlines are set slightly smaller and tighter, because
Spanish runs about a fifth longer than English. The concept websites on the monitors stay in English, since they
are design examples.

Opening `public/index.html` without the server still works for previewing the design: languages switch in place,
but the contact form needs the server.

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
`public/index.html` as the `jwMark` symbol: the main shapes take the surrounding text color and the bar takes
`--mark-accent`. `public/assets/img/logo.svg` is the original-color version and `public/assets/img/favicon.svg` the tab icon.
On computers with a mouse or trackpad, the pointer is a small round cursor that grows over anything clickable.

## What we do

The services sit on the left and a picture sits on the right. Hovering a service (or tapping it on a phone)
swaps the picture. The pictures are listed in `SERVICE_IMAGES` at the top of `public/assets/js/site.js`; they are
stand-ins from the concept pages until you add your own.

## The concept pages

Thirteen example websites for the industries we serve: fashion and garment export, pet supplies, outdoor
equipment, industrial manufacturing, wholesale trading and branded online stores. The first four are complete
little sites (catalog, filters, product pages, cart or quote list, checkout or RFQ); the rest are a homepage plus
the one feature that matters most in that industry. All run on plain HTML and JavaScript, with no server.

| Monitor | Page | What it shows |
| --- | --- | --- |
| L1 | Loomline, garment OEM/ODM | Catalog, sample builder (garment, fabric, color, logo, label, packaging), quote list |
| L2 | Atelier Nord, fashion store | Full shop: filters, size guide with fit finder, cart, promo code, checkout |
| L3 | Ferro Precision, CNC machining | Part catalog, instant quote (material, tolerance, finish, quantity), DFM checks |
| T2 | Nocturne, watches | Online store and watch configurator with engraving |
| L4 | Verde Wholesale, produce | Trade quick-order sheet: case pricing, volume tiers, order cutoff timer, delivery day |
| T1 | Wag & Co., pet store | Food finder that portions food by pet, weight and activity, with autoship |
| B5 | PawPro, private-label pet products | Product builder with your logo and packaging, unit price at every quantity, RFQ list |
| T4 | Atlas, outdoor gear | Side-by-side tent comparison |
| R3 | Ridgeline Packworks, OEM backpacks | Pack builder: style, fabric, colors, branding, features, front and back views, pricing |
| B3 | Halden Flow, industrial valves | Valve selector and pipe sizing from process conditions, downloadable datasheet |
| B6 | Meridian Trading, wholesale housewares | Container load planner: fill, weight and freight per unit for 20′, 40′ and 40′ HQ |
| R4 | Kiln, coffee roaster | Subscription builder |
| B2 | Maison Sable, skincare brand | Skincare routine finder |

The shared shop engine is `public/pages/assets/shop.js` (with `shop.css`); products are drawn in code by
`garments.js` and `pets.js`, so the newer pages need no photos.

The photos on T4, B2 and L4 come from [Unsplash](https://unsplash.com/license) (free to use, no attribution required, credited anyway)
and load straight from images.unsplash.com. If one can't load, its block keeps a matching colour tone.
The entrance wall has two separate groups of designs (`SCREENS.left` and `SCREENS.right` in `public/assets/js/site.js`),
so the columns never repeat each other. A tile shows the page's screenshot from `public/assets/img/shots/` when one
exists, and otherwise the live page scaled down. Running `tools/make_shots.py` on a machine with internet
access adds screenshots for the photo pages, and their tiles switch to those automatically after the next build.

## Design Studio

`design-studio.html` lets a visitor design their website in 8 steps (business, layout, colors, fonts, style,
motion, pages and features, review) while a sample website beside the options updates live, on desktop, tablet or
phone sizes. The sample site is `public/pages/studio-preview.html`, drawn from the choices by
`public/assets/js/studio.js`; the page itself is generated with the other inner pages.

At the end it writes a **Website Design Requirements Document** with the layout, color palette (with contrast
checks), fonts, style, motion, sitemap, features and a recommended plan. Visitors can download it, print it or
save it as a PDF, copy it, or send it to you: it arrives in the dashboard as a new Website Development inquiry,
with the plan filled in and the whole specification in the message. Choices are kept in the visitor's browser,
so they can come back to them.

## Performance

The live websites on the wall are the heaviest part of the site, so:

- The 12 wall pages load only once Enter Site is clicked.
- Once the wall is lit, each page plays its opening motion once behind its blue cover, then rests there,
  already drawn, so turning a screen over has nothing new to draw. (Slower computers warm one page at a time.)
- A page animates only while its website is showing and the wall can be seen. It holds still while its screen
  is turning, while the screen is plain blue, when the page is scrolled down, while a preview is open, and when
  the browser tab is in the background.
- Page animations only move and fade things (transforms and opacity), which the graphics card handles.
- **Lite mode** for slower computers: only 4 screens animate at a time, two new ones taking over every
  3 seconds, and the screen under the pointer always plays. It switches on from the start when the browser
  reports 4 or fewer processor cores, 4 GB or less memory, data saver, or no graphics acceleration, and
  later if the wall measures below 45 frames per second (or more than 1 in 10 frames over 50 ms) for two
  3-second windows in a row. The choice lasts for the visit.
- Add `?lite` or `?full` to the address (for example `index.html?full`) to force either mode, e.g. for a demo.

## Accessibility

- A photosensitivity warning with a "Turn effects off" switch sits under Enter Site.
- `prefers-reduced-motion` turns the static, flicker and drift off automatically.
- Any key or scroll skips the intro.
- The inner pages have a "Skip to content" link; form errors are announced and tied to their fields.

## Fonts

Display type is Bricolage Grotesque; navigation and labels use Inter; body text uses the system's Helvetica Neue
or Arial. `hanken-grotesk.woff2` is in `public/assets/fonts/` but isn't used: an error in the stylesheet meant it
never loaded, so the site has always shown Helvetica Neue / Arial for body text. To switch to it, add its
`@font-face` back to the top of `site.css` and put `"Hanken Grotesk Variable"` first in `--font-body`.
All fonts are under the SIL Open Font License.
