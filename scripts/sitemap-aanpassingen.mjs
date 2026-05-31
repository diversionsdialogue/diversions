/**
 * sitemap-aanpassingen.mjs
 * Sanity-kant van de sitemap-opschoning (akkoord gebruiker 2026-05-31):
 *   1. Verwijder demo/oude docs:
 *        - service-web-develpment  (starter-typo-dienst, 410 op /services/web-develpment)
 *        - post-1                  (Lexington-demo, /blog/1)
 *        - workItem-1              (Lexington-demo, /work/1)
 *        - teamMember-1            (Lexington-demo, /team/1)
 *   2. Verwijder tags "freelancing" en "optimalisatie" uit alle post-docs
 *      (tagpagina's verdwijnen daarmee vanzelf).
 *
 * Gebruik:
 *   node scripts/sitemap-aanpassingen.mjs            # DRY-RUN
 *   node scripts/sitemap-aanpassingen.mjs --execute  # voert echt uit
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

const ROOT = process.cwd();
const DROP_TAGS = ["freelancing", "optimalisatie"];
const DELETE_IDS = [
  "service-web-develpment",
  "post-1",
  "workItem-1",
  "teamMember-1",
];

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

  // 1. Te verwijderen docs (alleen bestaande)
  const existing = new Set(await client.fetch(`*[_id in $ids]._id`, { ids: DELETE_IDS }));
  const toDelete = DELETE_IDS.filter((id) => existing.has(id));
  const missingDel = DELETE_IDS.filter((id) => !existing.has(id));
  console.log(`Verwijderen — gevonden ${toDelete.length}/${DELETE_IDS.length}:`);
  toDelete.forEach((id) => console.log(`  x ${id}`));
  if (missingDel.length) console.log("  (niet aanwezig:", missingDel.join(", "), ")");

  // 2. Posts met te droppen tags
  const tagged = await client.fetch(
    `*[_type == "post" && count((tags[])[@ in $tags]) > 0]{_id, tags}`,
    { tags: DROP_TAGS },
  );
  console.log(`\nPosts met tag(s) ${DROP_TAGS.join("/")}: ${tagged.length}`);
  const patches = tagged
    .filter((p) => !toDelete.includes(p._id)) // niet patchen wat we toch verwijderen
    .map((p) => ({
      id: p._id,
      before: p.tags,
      after: (p.tags || []).filter((t) => !DROP_TAGS.includes(t)),
    }));
  patches.forEach((p) =>
    console.log(`  ~ ${p.id}: [${p.before.join(", ")}] -> [${p.after.join(", ")}]`),
  );

  if (!execute) {
    console.log("\n[DRY-RUN] Niets gewijzigd. Run met --execute.");
    return;
  }

  let tx = client.transaction();
  for (const id of toDelete) tx = tx.delete(id);
  for (const p of patches) tx = tx.patch(p.id, { set: { tags: p.after } });
  const res = await tx.commit({ visibility: "async" });
  console.log(`\n[EXECUTE] Klaar. Mutaties: ${res.results?.length ?? toDelete.length + patches.length}`);
};

run().catch((e) => {
  console.error("FOUT:", e.message);
  process.exit(1);
});
