"use strict";
/* Shared lists. The dashboard reads these from /admin/api/meta, so a change here shows up everywhere. */

const SERVICES = {
  "website-development": { en: "Website Development", es: "Desarrollo web" },
  "geo-optimization": { en: "GEO Optimization", es: "Optimización GEO" },
  "standalone-websites": { en: "Standalone Website", es: "Sitio web independiente" },
  "not-sure": { en: "Not sure yet", es: "Aún no lo sé" }
};

const PLANS = {
  "not-sure": { en: "Not sure yet", es: "Aún no lo sé" },
  basic: { en: "Basic ($200)", es: "Básico ($200)" },
  standard: { en: "Standard ($500)", es: "Estándar ($500)" },
  premium: { en: "Premium ($800)", es: "Premium ($800)" }
};

// The sales pipeline, in order. "open" statuses show in the Inbox.
const STATUSES = [
  { id: "new", label: "New", open: true },
  { id: "contacted", label: "Contacted", open: true },
  { id: "discussing", label: "In discussion", open: true },
  { id: "quoted", label: "Quote sent", open: true },
  { id: "won", label: "Won", open: false },
  { id: "lost", label: "Closed / lost", open: false }
];

const PRIORITIES = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" }
];

const LANGS = { en: "English", es: "Español" };

module.exports = {
  SERVICES, PLANS, STATUSES, PRIORITIES, LANGS,
  STATUS_IDS: STATUSES.map((s) => s.id),
  OPEN_STATUS_IDS: STATUSES.filter((s) => s.open).map((s) => s.id),
  PRIORITY_IDS: PRIORITIES.map((p) => p.id)
};
