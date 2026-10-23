/* Builds the deployable site in dist/ from public/:
     - every page in English (as written) and in Spanish under /es/, with the Spanish text already in place
     - canonical and hreflang tags, Open Graph tags, and structured data (JSON-LD) for search engines and AI tools
     - sitemap.xml, robots.txt and llms.txt
     - ?v=<hash> on stylesheets and scripts, so browsers can cache them for a long time and still get updates
   Run:  npm run build   (npm start runs it too). Set SITE_URL to the live address, e.g. https://www.jieweitech.com */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import * as cheerio from "cheerio";

const require = createRequire(import.meta.url);
const { build: buildConfig } = require("../server/config.js");
const cfg = buildConfig();
const SITE = cfg.siteUrl;
const CO = cfg.company;
const ROOT = cfg.root;
const SRC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "dist");
const TODAY = new Date().toISOString().slice(0, 10);

const PAGES = [
  { file: "index.html", path: "", priority: "1.0" },
  { file: "website-development.html", path: "website-development.html", priority: "0.9", service: "website-development" },
  { file: "geo-optimization.html", path: "geo-optimization.html", priority: "0.9", service: "geo-optimization" },
  { file: "standalone-websites.html", path: "standalone-websites.html", priority: "0.9", service: "standalone-websites" },
  { file: "contact.html", path: "contact.html", priority: "0.8" },
  { file: "privacy.html", path: "privacy.html", priority: "0.3" },
  { file: "404.html", path: null }
];
const LANGS = {
  en: { dir: "", locale: "en_US", html: "en" },
  es: { dir: "es/", locale: "es_LA", html: "es" }
};
const url = (lang, p) => SITE + "/" + LANGS[lang].dir + p;

/* ---------- copy public/ to dist/ ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true, filter: (f) => !/(^|[\\/])\.(DS_Store|git)/.test(f) });

/* ---------- content hashes for cache busting ---------- */
const hashes = {};
for (const dir of ["assets/css", "assets/js", "assets/vendor"]) {
  for (const f of fs.readdirSync(path.join(SRC, dir))) {
    if (!/\.(css|js)$/.test(f)) continue;
    hashes[dir + "/" + f] = crypto.createHash("sha1").update(fs.readFileSync(path.join(SRC, dir, f))).digest("hex").slice(0, 10);
  }
}

// screenshots that exist, so the homepage doesn't ask for ones that don't
const SHOTS = fs.readdirSync(path.join(SRC, "assets/img/shots")).filter((f) => f.endsWith(".jpg")).map((f) => f.slice(0, -4)).sort();

const SKIP = /^(#|\/|[a-z][a-z0-9+.-]*:|\.\.\/)/i;
function rewriteUrls($, lang) {
  const fix = (v) => {
    if (!v || SKIP.test(v)) return v;
    const [p, rest = ""] = v.split(/(?=[?#])/);
    let out = p;
    if (hashes[p]) out = p + "?v=" + hashes[p];
    if (lang === "es" && /^(assets\/|pages\/|site\.webmanifest$)/.test(p)) out = "../" + out;
    if (p === "index.html") out = "./";
    return out + rest;
  };
  $("[src]").each((_, el) => { $(el).attr("src", fix($(el).attr("src"))); });
  $("link[href], a[href]").each((_, el) => { $(el).attr("href", fix($(el).attr("href"))); });
}

function text($, el) { return $(el).text().replace(/\s+/g, " ").trim(); }

function jsonLd(page, lang, $) {
  const es = lang === "es";
  const org = {
    "@type": "ProfessionalService",
    "@id": SITE + "/#organization",
    name: CO.brand,
    legalName: CO.legalName,
    url: SITE + "/",
    logo: SITE + "/assets/img/logo.png",
    image: SITE + "/assets/img/og-image.jpg",
    telephone: CO.phoneE164,
    address: { "@type": "PostalAddress", streetAddress: CO.street, addressLocality: CO.city, addressRegion: CO.region, postalCode: CO.postalCode, addressCountry: CO.country },
    areaServed: [{ "@type": "City", name: "Los Angeles" }, { "@type": "Country", name: "United States" }, "Worldwide"],
    knowsLanguage: ["en", "es"],
    contactPoint: { "@type": "ContactPoint", contactType: "sales", telephone: CO.phoneE164, availableLanguage: ["English", "Spanish"], url: url(lang, "contact.html") },
    description: es
      ? "Estudio de diseño y desarrollo web en Marina del Rey, California. Sitios web para empresas, optimización para la búsqueda con IA (GEO) y sitios web independientes."
      : "Web design and development studio in Marina del Rey, California. Business websites, optimization for AI-powered search (GEO), and standalone branded websites."
  };
  const graph = [
    org,
    { "@type": "WebSite", "@id": SITE + "/#website", url: SITE + "/", name: CO.brand, publisher: { "@id": org["@id"] }, inLanguage: ["en", "es"] },
    { "@type": page.file === "contact.html" ? "ContactPage" : "WebPage", "@id": url(lang, page.path) + "#webpage", url: url(lang, page.path), name: $("title").text().trim(),
      description: $('meta[name="description"]').attr("content"), inLanguage: lang, isPartOf: { "@id": SITE + "/#website" }, about: { "@id": org["@id"] } }
  ];
  if (page.service) {
    const name = text($, "h1");
    graph.push({ "@type": "Service", name: $("title").text().split("|")[0].trim(), description: $('meta[name="description"]').attr("content"),
      provider: { "@id": org["@id"] }, areaServed: "Worldwide", serviceType: name, url: url(lang, page.path),
      ...(page.service === "website-development" ? { offers: [["Basic", 149], ["Standard", 448], ["Premium", 747]].map(([n, p]) => ({ "@type": "Offer", name: n, price: String(p), priceCurrency: "USD", description: es ? "Precio inicial" : "Starting price" })) } : {}) });
  }
  const faqs = $(".faq details").toArray().map((d) => ({ "@type": "Question", name: text($, $(d).find("summary")), acceptedAnswer: { "@type": "Answer", text: text($, $(d).find("p")) } }));
  if (faqs.length) graph.push({ "@type": "FAQPage", mainEntity: faqs, inLanguage: lang });
  if (page.path) {
    graph.push({ "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: es ? "Inicio" : "Home", item: url(lang, "") },
      { "@type": "ListItem", position: 2, name: $("title").text().split("|")[0].trim(), item: url(lang, page.path) }
    ] });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}

function render(page, lang) {
  const $ = cheerio.load(fs.readFileSync(path.join(SRC, page.file), "utf8"));
  const L = LANGS[lang];
  if (lang !== "en") {
    $("[data-es]").each((_, el) => {
      const $el = $(el);
      if ($el.attr("data-en") === undefined) $el.attr("data-en", $el.html());
      $el.html($el.attr("data-es"));
    });
    $("[data-attr]").each((_, el) => {
      const $el = $(el), name = $el.attr("data-attr");
      if ($el.attr("data-attr-en") === undefined) $el.attr("data-attr-en", $el.attr(name) || "");
      const v = $el.attr("data-attr-es");
      if (v !== undefined) $el.attr(name, v);
    });
    $("html").attr("data-page-lang", lang).attr("data-root", "../");
    $('input[name="lang"]').attr("value", lang);
    $('input[name="page"]').attr("value", "/" + L.dir + page.file);
  }
  $("html").attr("lang", L.html);
  if (page.file === "index.html") $("html").attr("data-shots", SHOTS.join(" "));
  rewriteUrls($, lang);

  const head = $("head");
  head.find('link[rel="canonical"], link[rel="alternate"], meta[property="og:url"], meta[property="og:locale"], meta[property="og:locale:alternate"], script[type="application/ld+json"]').remove();
  $('meta[property="og:image"]').attr("content", SITE + "/assets/img/og-image.jpg");
  const tags = [];
  if (page.path !== null) {
    tags.push(`<link rel="canonical" href="${url(lang, page.path)}">`);
    for (const l of Object.keys(LANGS)) tags.push(`<link rel="alternate" hreflang="${l}" href="${url(l, page.path)}">`);
    tags.push(`<link rel="alternate" hreflang="x-default" href="${url("en", page.path)}">`);
    tags.push(`<meta property="og:url" content="${url(lang, page.path)}">`);
  }
  tags.push(`<meta property="og:locale" content="${L.locale}">`);
  for (const l of Object.keys(LANGS)) if (l !== lang) tags.push(`<meta property="og:locale:alternate" content="${LANGS[l].locale}">`);
  if (page.path !== null) tags.push(`<script type="application/ld+json">${jsonLd(page, lang, $)}</script>`);
  const desc = head.find('meta[name="description"]');
  desc.after("\n" + tags.join("\n"));
  return "<!doctype html>\n" + $.html().replace(/^<!DOCTYPE html>\s*/i, "");
}

let count = 0;
for (const page of PAGES) {
  if (!fs.existsSync(path.join(SRC, page.file))) continue;
  for (const lang of Object.keys(LANGS)) {
    const out = path.join(OUT, LANGS[lang].dir, page.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, render(page, lang));
    count++;
  }
}

/* the concept websites on the monitors are design examples, so keep them out of search results */
for (const f of fs.readdirSync(path.join(OUT, "pages"))) {
  if (!f.endsWith(".html")) continue;
  const p = path.join(OUT, "pages", f);
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/<head>/i, '<head>\n<meta name="robots" content="noindex">'));
}

/* ---------- sitemap, robots, llms ---------- */
const urls = PAGES.filter((p) => p.path !== null).map((p) => Object.keys(LANGS).map((lang) => `  <url>
    <loc>${url(lang, p.path)}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>${p.priority}</priority>
${Object.keys(LANGS).map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l, p.path)}"/>`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${url("en", p.path)}"/>
  </url>`).join("\n")).join("\n");
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`);
fs.writeFileSync(path.join(OUT, "llms.txt"), `# ${CO.brand}

> ${CO.legalName} is a web design and development studio in Marina del Rey, California (Los Angeles). It builds professional business websites, optimizes companies for AI-powered search (GEO), and creates standalone branded websites for exporters and brands. It works in English and Spanish.

- Address: ${CO.street}, ${CO.city}, ${CO.region} ${CO.postalCode}, ${CO.countryName}
- Phone: ${CO.phone}
- Contact form: ${url("en", "contact.html")}

## Services

- [Website Development](${url("en", "website-development.html")}): websites for manufacturers, trading companies and B2B service providers. Plans start at $149 (Basic), $448 (Standard) and $747 (Premium).
- [GEO Optimization](${url("en", "geo-optimization.html")}): helps AI tools such as ChatGPT, Gemini, Perplexity and Google's AI Overviews describe and recommend a business correctly.
- [Standalone Websites](${url("en", "standalone-websites.html")}): branded sites on a company's own domain, built for export and direct inquiries.

## In Spanish

- [Inicio](${url("es", "")})
- [Desarrollo web](${url("es", "website-development.html")})
- [Optimización GEO](${url("es", "geo-optimization.html")})
- [Sitios web independientes](${url("es", "standalone-websites.html")})
- [Contacto](${url("es", "contact.html")})
`);

console.log(`Built ${count} pages into dist/ for ${SITE}${process.env.SITE_URL ? "" : "  (set SITE_URL to change the address)"}`);
