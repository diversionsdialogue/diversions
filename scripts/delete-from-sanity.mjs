/**
 * delete-from-sanity.mjs
 * Verwijdert de Sanity-documenten die horen bij de "verwijderen"-URL's uit de
 * niet-geindexeerd-CSV. Leidt _id af als `${type}-${slug}` (zie transforms.ts:
 * deriveSlug — er is geen los slug-veld, het _id draagt de slug).
 *
 * Bron van waarheid: inventaris.json (bestemming "importeren-naar-sanity") ∩ CSV-URL's.
 *
 * Gebruik:
 *   node scripts/delete-from-sanity.mjs            # DRY-RUN (toont alleen)
 *   node scripts/delete-from-sanity.mjs --execute  # verwijdert echt
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

const ROOT = process.cwd();
const CSV =
  "C:/Users/Gebruiker/Downloads/redirects-niet-geindexeerd-verwijderen - redirects-niet-geindexeerd-verwijderen.csv.csv";

// --- env uit apps/web/.env laden (SANITY_*) ---
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

// --- CSV normaliseren naar paden ---
const csvUrls = fs
  .readFileSync(CSV, "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((l) => l.split(",")[0])
  .map((u) =>
    u.replace(/^https?:\/\/(www\.)?diversions\.nl/, "").replace(/\/$/, ""),
  )
  .map((u) => (u === "" ? "/" : u));
const csvSet = new Set(csvUrls);

// --- inventaris ∩ CSV, alleen importeren-naar-sanity ---
const inv = JSON.parse(fs.readFileSync(path.join(ROOT, "inventaris.json"), "utf8"));
const PREFIX = { post: "post", service: "service", workItem: "workItem" };
const targets = [];
for (const e of inv) {
  if (e.bestemming !== "importeren-naar-sanity") continue;
  if (!csvSet.has(e.oude_url)) continue;
  const prefix = PREFIX[e.sanity_type];
  if (!prefix) {
    console.warn("! onbekend sanity_type:", e.sanity_type, e.oude_url);
    continue;
  }
  // nieuwe_url = /blog|services|work/<slug>  -> slug = laatste segment
  const slug = (e.nieuwe_url || "").split("/").filter(Boolean).pop();
  if (!slug) {
    console.warn("! geen slug af te leiden:", e.oude_url);
    continue;
  }
  targets.push({ id: `${prefix}-${slug}`, type: e.sanity_type, oude_url: e.oude_url, nieuwe_url: e.nieuwe_url });
}

console.log(`Doelen (inventaris ∩ CSV, importeren-naar-sanity): ${targets.length}`);
const byType = targets.reduce((a, t) => ((a[t.type] = (a[t.type] || 0) + 1), a), {});
console.log("per type:", JSON.stringify(byType));

const execute = process.argv.includes("--execute");

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

const run = async () => {
  const ids = targets.map((t) => t.id);
  // Controleer welke daadwerkelijk bestaan
  const existing = await client.fetch(`*[_id in $ids]._id`, { ids });
  const existingSet = new Set(existing);
  const found = targets.filter((t) => existingSet.has(t.id));
  const missing = targets.filter((t) => !existingSet.has(t.id));

  console.log(`\nGevonden in Sanity: ${found.length} / ${targets.length}`);
  if (missing.length) {
    console.log(`\nNIET gevonden (controleer slug/_id):`);
    missing.forEach((t) => console.log(`  - ${t.id}   (${t.oude_url} -> ${t.nieuwe_url})`));
  }

  if (!execute) {
    console.log(`\n[DRY-RUN] Zou ${found.length} documenten verwijderen. Run met --execute om te verwijderen.`);
    found.forEach((t) => console.log(`  x ${t.id}`));
    return;
  }

  console.log(`\n[EXECUTE] Verwijderen van ${found.length} documenten...`);
  let tx = client.transaction();
  for (const t of found) tx = tx.delete(t.id);
  const res = await tx.commit({ visibility: "async" });
  console.log("Klaar. Verwijderd:", res.results?.length ?? found.length);
};

run().catch((e) => {
  console.error("FOUT bij verwijderen:", e.message);
  process.exit(1);
});
