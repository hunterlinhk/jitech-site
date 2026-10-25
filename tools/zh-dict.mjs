/* Turns i18n/zh.json (English text -> Simplified Chinese) into public/assets/js/i18n-zh.js, which every page loads
   before i18n.js. Run after editing the dictionary:  node tools/zh-dict.mjs   (npm run build runs it too).
   To find text that has no translation yet:          node tools/zh-dict.mjs --missing */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, "i18n/zh.json"), "utf8"));
const clean = {};
for (const [k, v] of Object.entries(dict)) if (v && String(k).trim()) clean[String(k).trim()] = v;
const out = "/* Generated from i18n/zh.json by tools/zh-dict.mjs. Edit the JSON, not this file. */\nwindow.I18N_ZH=" + JSON.stringify(clean) + ";\n";
fs.writeFileSync(path.join(ROOT, "public/assets/js/i18n-zh.js"), out);
if (process.argv.includes("--missing")) {
  const { load } = await import("cheerio");
  const missing = new Set();
  for (const f of fs.readdirSync(path.join(ROOT, "public")).filter((f) => f.endsWith(".html"))) {
    const $ = load(fs.readFileSync(path.join(ROOT, "public", f), "utf8"));
    $("[data-es]").each((_, el) => { const k = $(el).html().trim(); if (!clean[k]) missing.add(k); });
    $("[data-attr]").each((_, el) => { const k = ($(el).attr($(el).attr("data-attr")) || "").trim(); if (k && !clean[k]) missing.add(k); });
  }
  console.log(missing.size ? [...missing].join("\n") : "Every page string has a Chinese translation.");
}
console.log("i18n-zh.js: " + Object.keys(clean).length + " entries");
