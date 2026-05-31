/**
 * apply-geindexeerd.mjs
 * Werkt inventaris.json bij volgens de "geindexeerd-behouden-of-redirect"-CSV.
 *   behouden : redirect_naar = nieuw pad (alleen als != oude pad)  -> 301 URL-pariteit
 *   redirect : bestemming "alleen-redirect", redirect_naar = vertaald EINDtarget
 *              (ketens opgelost), nieuwe_url/sanity_type genullt          -> 301
 *   gone     : bestemming "droppen", gone:true, redirect_naar null,
 *              nieuwe_url/sanity_type genullt                              -> 410
 * Targets worden vertaald van oud WP-pad naar het echte nieuwe pad op de
 * originele inventaris (vóór mutatie), zodat ketens correct oplossen.
 *
 * Gebruik: node scripts/apply-geindexeerd.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INV = path.join(ROOT, "inventaris.json");
const CSV =
  "C:/Users/Gebruiker/Downloads/geindexeerd-behouden-of-redirect - geindexeerd-behouden-of-redirect.csv.csv";
const STAMP = "geindexeerd-opschoning, akkoord gebruiker 2026-05-31";

const norm = (u) =>
  ((u || "").trim().replace(/^https?:\/\/(www\.)?diversions\.nl/i, "") || "/").replace(/\/$/, "") || "/";

const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
const byOld = new Map(inv.map((e) => [norm(e.oude_url), e]));

// vertaal een (oud) target-pad naar het echte nieuwe pad; los 1 niveau keten op
const translate = (target) => {
  const tn = norm(target);
  const e = byOld.get(tn);
  if (e && e.nieuwe_url && norm(e.nieuwe_url) !== tn) return e.nieuwe_url;
  return tn;
};

const rows = fs
  .readFileSync(CSV, "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .filter(Boolean)
  .map((l) => {
    const [url, actie, best] = l.split(",");
    return { oud: norm(url), actie: (actie || "").trim(), target: (best || "").trim() };
  });

const stat = { behouden301: 0, behoudenZelfde: 0, redirect: 0, gone: 0, missing: [] };

for (const r of rows) {
  const e = byOld.get(r.oud);
  if (!e) {
    stat.missing.push(`${r.oud} [${r.actie}]`);
    continue;
  }
  if (r.actie === "behouden") {
    if (e.nieuwe_url && norm(e.nieuwe_url) !== r.oud) {
      e.redirect_naar = e.nieuwe_url;
      e.notities = `301 oud->nieuw (URL-pariteit; ${STAMP}). ${e.notities || ""}`.trim();
      stat.behouden301++;
    } else {
      stat.behoudenZelfde++;
    }
  } else if (r.actie === "redirect") {
    const finalTarget = translate(r.target);
    e.bestemming = "alleen-redirect";
    e.redirect_naar = finalTarget;
    e.nieuwe_url = null;
    e.sanity_type = null;
    e.gone = false;
    e.notities = `VERWIJDERD (${STAMP}); content weg, 301 -> ${finalTarget}. ${e.notities || ""}`.trim();
    stat.redirect++;
  } else if (r.actie === "gone") {
    e.bestemming = "droppen";
    e.gone = true;
    e.redirect_naar = null;
    e.nieuwe_url = null;
    e.sanity_type = null;
    e.notities = `VERWIJDERD (${STAMP}); 410 GONE, geen redirect. ${e.notities || ""}`.trim();
    stat.gone++;
  }
}

fs.writeFileSync(INV, JSON.stringify(inv, null, 2) + "\n");
console.log("inventaris.json bijgewerkt.");
console.log(`behouden 301 (oud->nieuw): ${stat.behouden301}`);
console.log(`behouden zelfde URL (geen redirect): ${stat.behoudenZelfde}`);
console.log(`redirect (301 + content weg): ${stat.redirect}`);
console.log(`gone (410 + content weg): ${stat.gone}`);
if (stat.missing.length) {
  console.log(`\nNiet in inventaris (${stat.missing.length}) — alleen via gen-redirects 'extra' of nginx-thema-regel:`);
  stat.missing.forEach((m) => console.log("  " + m));
}
