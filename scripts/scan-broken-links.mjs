// Broken-internal-link scan op de gebouwde site (apps/web/dist).
// Draai NA `pnpm build:web`:  node scripts/scan-broken-links.mjs
// Bedoeld voor de finale, geconsolideerde interne-link-pass in de SEO-fase:
// pas verwerken als ALLE keep/drop-, redirect- en opschoonbeslissingen vaststaan.
// Kruisverwijzen met inventaris.json (oude_url -> nieuwe_url / bestemming) om
// te bepalen wat herschreven, gedropt of naar een overzicht geleid moet worden.
import fs from "node:fs";
import path from "node:path";

const DIST = "apps/web/dist";

// collect all built routes (dirs with index.html + standalone .html)
const routes = new Set();
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp);
    else if (e.name.endsWith(".html")) {
      let rel = path.relative(DIST, fp).replaceAll("\\", "/");
      rel = "/" + rel.replace(/index\.html$/, "").replace(/\.html$/, "");
      rel = rel.replace(/\/$/, "") || "/";
      routes.add(rel);
    }
  }
}
walk(DIST);

// collect internal hrefs from every html file
const htmlFiles = [];
function collect(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) collect(fp);
    else if (e.name.endsWith(".html")) htmlFiles.push(fp);
  }
}
collect(DIST);

const broken = new Map(); // href -> set of source files
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, "utf8");
  const re = /href="(\/[^"#?]*)/g;
  let m;
  while ((m = re.exec(html))) {
    let href = m[1].replace(/\/$/, "") || "/";
    // skip assets
    if (href.startsWith("/_astro") || href.startsWith("/img") || href.startsWith("/fonts")) continue;
    if (/\.(png|jpe?g|webp|svg|ico|css|js|xml|txt|pdf|woff2?|json)$/i.test(href)) continue;
    if (!routes.has(href)) {
      if (!broken.has(href)) broken.set(href, new Set());
      broken.get(href).add(path.relative(DIST, f).replaceAll("\\", "/"));
    }
  }
}

console.log("Routes built:", routes.size);
console.log("Broken internal links:", broken.size);
for (const [href, srcs] of [...broken.entries()].sort()) {
  console.log(`  ${href}  <- ${[...srcs].slice(0,3).join(", ")}${srcs.size>3?` (+${srcs.size-3})`:""}`);
}
