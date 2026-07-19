/**
 * cleanup-comments-sanity.ts
 *
 * Verwijdert achtergebleven HTML-comment-tekst (<!-- CONVERT-META ... -->,
 * <!-- IMG ... -->) uit de body van reeds gemigreerde Sanity-documenten.
 *
 * Oorzaak: de eerste migratie draaide met een converter die HTML-comments NIET
 * stripte, waardoor comment-regels als gewone tekstblokken in Sanity belandden.
 * markdown-to-portable-text.ts is inmiddels gefixt; dit script herstelt de
 * bestaande data.
 *
 * Werkwijze (chirurgisch):
 *  - per content-collectie de bron-md's lezen en de body opnieuw converteren
 *    met de GEFIXTE converter;
 *  - het bijbehorende Sanity-document ophalen (id = `<type>-<slug>`);
 *  - ALLEEN als de huidige body nog comment-resten bevat: het `body`-veld
 *    patchen (set). Andere velden (categories, slug, seo, thumbnail) blijven
 *    onaangeroerd.
 *
 * Gebruik (vanuit scripts/):
 *   npx tsx cleanup-comments-sanity.ts            # DRY RUN
 *   NODE_OPTIONS=--use-system-ca npx tsx cleanup-comments-sanity.ts --live
 */

import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { markdownToPortableText } from "./markdown-to-portable-text";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../apps/web/.env") });

const LIVE = process.argv.includes("--live");
const CONTENT = path.join(__dirname, "../apps/web/src/content");

// collectie-map -> Sanity-documenttype (CLAUDE.md §2)
const COLLECTIONS: Record<string, string> = {
  team: "teamMember",
  work: "workItem",
  services: "service",
  posts: "post",
  legal: "legalPage",
};

const projectId = process.env.SANITY_PROJECT_ID;
if (!projectId) {
  console.error("❌ SANITY_PROJECT_ID ontbreekt in apps/web/.env");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

/** True als een body-array nog HTML-comment-resten bevat. */
function hasCommentResidue(body: any[]): boolean {
  if (!Array.isArray(body)) return false;
  for (const node of body) {
    if (node?._type !== "block") continue;
    const text = (node.children ?? []).map((c: any) => c.text ?? "").join("");
    if (text.includes("<!--") || text.includes("-->")) return true;
  }
  return false;
}

async function run() {
  let scanned = 0;
  let dirty = 0;
  let patched = 0;
  const touched: string[] = [];

  for (const [dir, type] of Object.entries(COLLECTIONS)) {
    const dirPath = path.join(CONTENT, dir);
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const slug = path.basename(file, ".md");
      const id = `${type}-${slug}`;
      const doc = await client.getDocument(id).catch(() => null);
      if (!doc) continue;
      scanned++;

      if (!hasCommentResidue((doc as any).body)) continue;
      dirty++;

      const raw = fs.readFileSync(path.join(dirPath, file), "utf-8");
      const { content } = matter(raw);
      const { blocks } = markdownToPortableText(content);

      // veiligheidscheck: de verse body mag zelf geen comment-resten hebben
      if (hasCommentResidue(blocks)) {
        console.log(`⚠️  ${id}: verse body bevat nog comment-resten — overgeslagen.`);
        continue;
      }

      console.log(
        `🧹 ${id}: comment-resten gevonden → body herzetten (${(doc as any).body.length} → ${blocks.length} blokken)`
      );
      touched.push(id);

      if (LIVE) {
        if (!process.env.SANITY_TOKEN) {
          console.error("❌ SANITY_TOKEN ontbreekt — vereist voor --live.");
          process.exit(1);
        }
        await client.patch(id).set({ body: blocks }).commit();
        patched++;
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Gescand:           ${scanned}`);
  console.log(`Met comment-resten: ${dirty}`);
  console.log(LIVE ? `Gepatcht:          ${patched}` : "DRY RUN — niets geschreven.");
  if (touched.length) {
    console.log("\nDocumenten:");
    touched.forEach((id) => console.log(`  • ${id}`));
  }
}

run().catch((e) => {
  console.error("❌ Mislukt:", e.message);
  process.exit(1);
});
