/**
 * delete-geindexeerd.mjs
 * Verwijdert content voor de "geindexeerd-behouden-of-redirect"-CSV:
 *   - actie "redirect": bronpagina verdwijnt (301 op oude URL komt los in nginx).
 *   - actie "gone":      content verdwijnt (410 op oude URL komt los in nginx).
 * "behouden" raakt nooit content aan.
 *
 * Sanity-docs: _id = `${type}-${slug}` (zie transforms.ts deriveSlug; geen los
 * slug-veld). slug = laatste segment van inventaris.nieuwe_url.
 * Astro-pagina's (bouwen-in-astro): bijbehorend bestand onder apps/web/src/pages.
 *
 * DRAAI VOOR het bijwerken van inventaris.json (nieuwe_url/sanity_type nog intact).
 *
 * Gebruik:
 *   node scripts/delete-geindexeerd.mjs            # DRY-RUN
 *   node scripts/delete-geindexeerd.mjs --execute  # verwijdert echt (Sanity + Astro)
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

const ROOT = process.cwd();
const CSV =
  "C:/Users/Gebruiker/Downloads/geindexeerd-behouden-of-redirect - geindexeerd-behouden-of-redirect.csv.csv";

function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = loadEnv(path.join(ROOT, "apps/web/.env"));

const norm = (u) =>
  ((u || "").trim().replace(/^https?:\/\/(www\.)?diversions\.nl/i, "") || "/").replace(/\/$/, "") || "/";

const rows = fs
  .readFileSync(CSV, "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .filter(Boolean)
  .map((l) => {
    const [url, actie] = l.split(",");
    return { oud: norm(url), actie: (actie || "").trim() };
  })
  .filter((r) => r.actie === "redirect" || r.actie === "gone");

const inv = JSON.parse(fs.readFileSync(path.join(ROOT, "inventaris.json"), "utf8"));
const byOld = new Map(inv.map((e) => [norm(e.oude_url), e]));
const PREFIX = { post: "post", service: "service", workItem: "workItem" };

const sanityTargets = [];
const astroTargets = [];
const skipped = [];

for (const r of rows) {
  const e = byOld.get(r.oud);
  if (!e) {
    skipped.push(`${r.oud} (niet in inventaris)`);
    continue;
  }
  const del = e.bestemming === "droppen" || /VERWIJDERD/i.test(e.notities || "");
  if (del) {
    skipped.push(`${r.oud} (al verwijderd)`);
    continue;
  }
  if (e.bestemming === "importeren-naar-sanity") {
    const prefix = PREFIX[e.sanity_type];
    const slug = (e.nieuwe_url || "").split("/").filter(Boolean).pop();
    if (!prefix || !slug) {
      skipped.push(`${r.oud} (geen _id af te leiden: type=${e.sanity_type} url=${e.nieuwe_url})`);
      continue;
    }
    sanityTargets.push({ id: `${prefix}-${slug}`, type: e.sanity_type, oud: r.oud, actie: r.actie, nieuwe_url: e.nieuwe_url });
  } else if (e.bestemming === "bouwen-in-astro") {
    astroTargets.push({ oud: r.oud, actie: r.actie, nieuwe_url: e.nieuwe_url });
  } else {
    skipped.push(`${r.oud} (bestemming=${e.bestemming})`);
  }
}

console.log(`Te verwijderen — Sanity: ${sanityTargets.length} | Astro: ${astroTargets.length} | overgeslagen: ${skipped.length}`);
const byType = sanityTargets.reduce((a, t) => ((a[t.type] = (a[t.type] || 0) + 1), a), {});
console.log("Sanity per type:", JSON.stringify(byType));

// --- Astro-bestanden lokaliseren ---
const PAGES = path.join(ROOT, "apps/web/src/pages");
function findAstroFile(urlPath) {
  const seg = urlPath.replace(/^\//, "");
  const candidates = [
    path.join(PAGES, `${seg}.astro`),
    path.join(PAGES, seg, "index.astro"),
    path.join(PAGES, `${seg}.md`),
    path.join(PAGES, seg, "index.md"),
  ];
  return candidates.find((c) => fs.existsSync(c)) || null;
}
for (const t of astroTargets) t.file = findAstroFile(t.oud);

console.log("\nAstro-doelen:");
astroTargets.forEach((t) => console.log(`  ${t.actie}  ${t.oud}  -> ${t.file || "!! BESTAND NIET GEVONDEN"}`));
if (skipped.length) {
  console.log("\nOvergeslagen (geen content te verwijderen):");
  skipped.forEach((s) => console.log("  " + s));
}

const execute = process.argv.includes("--execute");

const run = async () => {
  if (!env.SANITY_PROJECT_ID || !env.SANITY_TOKEN) {
    console.error("FOUT: SANITY_PROJECT_ID/SANITY_TOKEN ontbreekt in apps/web/.env");
    process.exit(1);
  }
  const client = createClient({
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET || "production",
    apiVersion: env.SANITY_API_VERSION || "2024-01-01",
    token: env.SANITY_TOKEN,
    useCdn: false,
    perspective: "raw",
  });

  const ids = sanityTargets.map((t) => t.id);
  const existing = new Set(await client.fetch(`*[_id in $ids]._id`, { ids }));
  const found = sanityTargets.filter((t) => existing.has(t.id));
  const missing = sanityTargets.filter((t) => !existing.has(t.id));

  console.log(`\nSanity gevonden: ${found.length} / ${sanityTargets.length}`);
  if (missing.length) {
    console.log("NIET gevonden in Sanity (controleer _id):");
    missing.forEach((t) => console.log(`  - ${t.id}  (${t.oud} -> ${t.nieuwe_url})`));
  }

  if (!execute) {
    console.log(`\n[DRY-RUN] Zou ${found.length} Sanity-docs + ${astroTargets.filter((t) => t.file).length} Astro-bestanden verwijderen. Run met --execute.`);
    found.forEach((t) => console.log(`  x sanity ${t.id}  (${t.actie})`));
    return;
  }

  console.log(`\n[EXECUTE] Sanity: ${found.length} docs verwijderen...`);
  let tx = client.transaction();
  for (const t of found) tx = tx.delete(t.id);
  const res = await tx.commit({ visibility: "async" });
  console.log("Sanity verwijderd:", res.results?.length ?? found.length);

  console.log(`[EXECUTE] Astro-bestanden verwijderen...`);
  for (const t of astroTargets) {
    if (t.file && fs.existsSync(t.file)) {
      fs.rmSync(t.file);
      console.log(`  x ${path.relative(ROOT, t.file)}`);
    }
  }
  console.log("Klaar.");
};

run().catch((e) => {
  console.error("FOUT:", e.message);
  process.exit(1);
});
