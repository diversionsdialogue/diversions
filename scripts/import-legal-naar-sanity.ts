/**
 * import-legal-naar-sanity.ts
 *
 * Importeert ALLEEN de legal-collectie (apps/web/src/content/legal/*.md) naar
 * Sanity als `legalPage`-documenten, met Portable-Text `body` (zelfde converter
 * als de hoofd-migratie) en het optionele `seo`-object uit de frontmatter.
 *
 * Waarom een apart script en niet `pnpm migrate`? Het volledige migratiescript
 * doet createOrReplace op ÁLLE collecties en zou daarmee de al in Sanity
 * bijgewerkte content (gekoppelde featured images, opgeschoonde body's)
 * overschrijven. Dit script raakt uitsluitend documenten met _id
 * `legalPage-<slug>` (slug = bestandsnaam = root-URL van de pagina).
 *
 * Gebruik:
 *   npx tsx scripts/import-legal-naar-sanity.ts --dry-run   # alleen tonen
 *   npx tsx scripts/import-legal-naar-sanity.ts             # schrijven
 */

import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { markdownToPortableText, resetKeys } from "./markdown-to-portable-text";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, "../apps/web/.env") });

const DRY_RUN = process.argv.includes("--dry-run");
const projectId = process.env.SANITY_PROJECT_ID;
const token = process.env.SANITY_TOKEN;

if (!projectId || (!DRY_RUN && !token)) {
  console.error("FOUT: SANITY_PROJECT_ID/SANITY_TOKEN ontbreekt in apps/web/.env");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
  token,
  useCdn: false,
});

const LEGAL_DIR = path.join(__dirname, "../apps/web/src/content/legal");

async function run() {
  const files = fs.readdirSync(LEGAL_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Legal-bronbestanden: ${files.length} (${DRY_RUN ? "DRY-RUN" : "LIVE"})\n`);

  let tx = client.transaction();
  for (const file of files) {
    const slug = path.basename(file, ".md");
    const raw = fs.readFileSync(path.join(LEGAL_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    resetKeys();
    const { blocks, log } = markdownToPortableText(content);

    const doc = {
      _type: "legalPage",
      _id: `legalPage-${slug}`,
      page: data.page,
      pubDate: new Date(data.pubDate).toISOString().split("T")[0],
      body: blocks,
      ...(data.seo ? { seo: { _type: "seo", ...data.seo } } : {}),
    };

    console.log(`■ ${doc._id}  "${doc.page}"  (${blocks.length} blokken, pubDate ${doc.pubDate})`);
    for (const entry of log) console.log(`    • ${entry}`);

    if (!DRY_RUN) tx = tx.createOrReplace(doc);
  }

  if (DRY_RUN) {
    console.log("\n[DRY-RUN] Niets geschreven.");
    return;
  }
  const res = await tx.commit();
  console.log(`\n[LIVE] ${res.results.length} legalPage-documenten geschreven.`);
}

run().catch((e) => {
  console.error("FOUT:", e.message);
  process.exit(1);
});
