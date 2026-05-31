/**
 * verify-redirects.mjs — controleert seo-redirects.conf tegen de gebouwde site.
 * Flag: 301->404 (target bestaat niet), 301->410 (target is gone), ketens.
 * Draai NA `pnpm build:web` + `node scripts/gen-redirects.mjs`.
 */
import fs from "node:fs";
import path from "node:path";
const DIST = "apps/web/dist";

const routes = new Set();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, e.name);
    if (e.isDirectory()) walk(fp);
    else if (e.name.endsWith(".html")) {
      let r = "/" + path.relative(DIST, fp).replaceAll("\\", "/").replace(/index\.html$/, "").replace(/\.html$/, "");
      r = r.replace(/\/$/, "") || "/";
      routes.add(r);
    }
  }
})(DIST);

const unesc = (s) => s.replace(/\\/g, "");
const conf = fs.readFileSync("seo-redirects.conf", "utf8").split("\n");
const r301 = [];
const g410 = [];
for (const line of conf) {
  let m = line.match(/^rewrite \^(\S+?)\/\?\$ (\S+) permanent;/);
  if (m) { r301.push([unesc(m[1]), m[2]]); continue; }
  m = line.match(/^location ~ \^(\S+?)\/\?\$ \{ return 410; \}/);
  if (m) g410.push(unesc(m[1]));
}
const goneSet = new Set(g410);
const sourceSet = new Set(r301.map(([o]) => o));
const ext = (t) => /^https?:/.test(t);
// paden die als route bestaan maar via andere structuur (overzichten/legal) — bekend goed
const stayPaths = new Set(["/", "/blog", "/contact", "/onze-diensten", "/wij-zijn-diversions", "/cases-overzichtspagina"]);

console.log(`301-redirects: ${r301.length} | 410: ${g410.length} | gebouwde routes: ${routes.size}\n`);
let n404 = 0, n410 = 0, nChain = 0;
for (const [oud, naar] of r301) {
  if (ext(naar)) continue;
  const t = naar.replace(/\/$/, "") || "/";
  if (goneSet.has(t)) { console.log(`  301->410  ${oud} -> ${naar}`); n410++; }
  else if (sourceSet.has(t)) { console.log(`  301->301 (KETEN)  ${oud} -> ${naar}`); nChain++; }
  else if (!routes.has(t) && !stayPaths.has(t)) { console.log(`  301->404  ${oud} -> ${naar}`); n404++; }
}
console.log(`\n301->404: ${n404} | 301->410: ${n410} | ketens: ${nChain}`);

const deletedSlugs = ["conversie-optimalisatie", "heatmaps", "design-sprint", "innovatiebureau", "marketing-automation", "search-console", "wp-rocket", "rich-content", "productlancering"];
console.log("\nSteekproef verwijderde content nog in dist?");
for (const s of deletedSlugs) {
  const hit = [...routes].some((r) => r.endsWith("/" + s));
  console.log(`  ${s}: ${hit ? "!! NOG AANWEZIG" : "weg"}`);
}
