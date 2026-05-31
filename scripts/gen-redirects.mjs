import fs from "node:fs";

const inv = JSON.parse(fs.readFileSync("inventaris.json", "utf8"));

function esc(u) {
  return u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const pathRedirects = [];
const goneList = [];
const argPageId = [];
const argP = [];
const otherQs = [];

for (const it of inv) {
  const oud = it.oude_url;
  // 410 GONE: content verwijderd, geen redirect (geindexeerd-opschoning).
  if (it.gone) {
    goneList.push([oud, it.titel]);
    continue;
  }
  let naar = it.redirect_naar;
  if (
    !naar &&
    it.nieuwe_url &&
    it.nieuwe_url !== oud &&
    it.bestemming === "importeren-naar-sanity"
  ) {
    naar = it.nieuwe_url;
  }
  if (!naar) continue;
  if (oud.startsWith("/?page_id=")) {
    argPageId.push([oud.split("=")[1], naar, it.titel]);
    continue;
  }
  if (oud.startsWith("/?p=")) {
    argP.push([oud.split("=")[1], naar, it.titel]);
    continue;
  }
  if (oud.includes("?")) {
    otherQs.push([oud, naar, it.titel]);
    continue;
  }
  if (oud === naar) continue;
  pathRedirects.push([oud, naar, it.titel, it.bestemming]);
}

const extra = [
  // /feed verwijderd: gebruiker liet /feed droppen zonder redirect (404), 2026-05-31.
  [
    "/online-onderzoek-2",
    "/blog/online-onderzoek",
    "LIVE artikel met -2 slug (zie inventaris-notitie)",
  ],
  // /thema/* — oude WP-thema-archieven, niet in inventaris. Targets vertaald naar
  // nieuwe paden (geindexeerd-opschoning 2026-05-31).
  ["/thema/blog", "/blog", "thema-archief blog"],
  ["/thema/blog/journey", "/blog", "thema-archief blog/journey"],
  ["/thema/blog/onderzoek", "/blog", "thema-archief blog/onderzoek"],
  ["/thema/blog/optimalisatie", "/blog", "thema-archief blog/optimalisatie"],
  ["/thema/contact", "/contact", "thema-archief contact"],
  [
    "/thema/fondsenwerving",
    "/services/onderzoeksbureau-fondsenwerving",
    "thema-archief fondsenwerving (keten opgelost)",
  ],
  ["/thema/over-diversions", "/wij-zijn-diversions", "thema-archief over-diversions"],
  // Dedup dubbel diensten-overzicht (sitemap-opschoning 2026-05-31): /services
  // (theme-default) verwijderd; /onze-diensten is canoniek. /services/<slug>-
  // detailroutes blijven bestaan (deze regel matcht alleen exact /services).
  ["/services", "/onze-diensten", "dedup diensten-overzicht -> /onze-diensten"],
];

// 410 GONE buiten inventaris (sitemap-opschoning 2026-05-31): starter-/demo-resten
// die nooit in de WP-export zaten maar wel als route bestonden.
const extraGone = [
  ["/services/web-develpment", "starter-typo-dienst (service-web-develpment)"],
];

let c = "";
c += "# ===========================================================================\n";
c += "# 301-redirects WordPress -> Astro (diversions.nl)\n";
c += "# Gegenereerd uit inventaris.json door de SEO-fase. PLAATSEN IN NGINX OP PLOI.\n";
c += "# NIET in Astro. Let op trailing slashes; rewrites matchen met EN zonder /.\n";
c += "# Plaats de pad-redirects binnen het server { } blok van diversions.nl.\n";
c += "# ===========================================================================\n\n";

c += `# --- Pad-gebaseerde 301-redirects (${pathRedirects.length}) ---\n`;
for (const [oud, naar, titel] of pathRedirects.sort((a, b) =>
  a[0].localeCompare(b[0]),
)) {
  c += `rewrite ^${esc(oud)}/?$ ${naar} permanent;  # ${titel}\n`;
}

c += "\n# --- Extra (handmatig, niet uit inventaris) ---\n";
for (const [oud, naar, titel] of extra) {
  c += `rewrite ^${esc(oud)}/?$ ${naar} permanent;  # ${titel}\n`;
}

const allGone = [...goneList, ...extraGone];
c += `\n# --- 410 GONE (${allGone.length}) — content definitief verwijderd, geen redirect ---\n`;
c += "# Plaats binnen het server { } blok. Matcht met en zonder trailing slash.\n";
for (const [oud, titel] of allGone.sort((a, b) => a[0].localeCompare(b[0]))) {
  c += `location ~ ^${esc(oud)}/?$ { return 410; }  # ${titel}\n`;
}

c += `\n# --- Querystring-drafts ?page_id=NN (${argPageId.length}) — nooit als pretty-URL live ---\n`;
c += "# Alleen concepten met ?page_id-URL (geen verkeer). Optioneel; vereist een map\n";
c += "# op de querystring (rewrite ^/path matcht GEEN ?page_id). Voorbeeld:\n";
c += "#   map $arg_page_id $wp_pageid_redirect {\n";
c += "#       default 0;\n";
for (const [id, naar, titel] of argPageId.sort((a, b) => a[0] - b[0])) {
  c += `#       ${id}  ${naar};  # ${titel}\n`;
}
c += "#   }\n";
c += "#   # in server{}:  if ($wp_pageid_redirect) { return 301 $wp_pageid_redirect; }\n";

c += `\n# --- Querystring-drafts ?p=NN (${argP.length}) — nooit als pretty-URL live ---\n`;
c += "#   map $arg_p $wp_p_redirect {\n";
c += "#       default 0;\n";
for (const [id, naar, titel] of argP.sort((a, b) => a[0] - b[0])) {
  c += `#       ${id}  ${naar};  # ${titel}\n`;
}
c += "#   }\n";
c += "#   # in server{}:  if ($wp_p_redirect) { return 301 $wp_p_redirect; }\n";

if (otherQs.length) {
  c += "\n# --- Overig querystring (te beslissen) ---\n";
  for (const [oud, naar, titel] of otherQs) {
    c += `#   ${oud} -> ${naar}  # ${titel}\n`;
  }
}

fs.writeFileSync("seo-redirects.conf", c);
console.log("seo-redirects.conf geschreven.");
console.log(
  `Pad-redirects: ${pathRedirects.length} | extra: ${extra.length} | 410 GONE: ${allGone.length} (inventaris ${goneList.length} + extra ${extraGone.length}) | ?page_id: ${argPageId.length} | ?p: ${argP.length} | overig: ${otherQs.length}`,
);
