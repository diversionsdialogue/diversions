/**
 * Gericht seed-script: voegt ÉÉN service-document toe aan Sanity — de
 * branchepagina "Onderzoeksbureau voor marketing en communicatie".
 *
 * Waarom een apart script i.p.v. `pnpm migrate`?
 *  - migrate-to-sanity.ts doet createOrReplace op ALLE services en laat daarbij
 *    `slug` + `categories` vallen. Dat zou handmatige Studio-edits (tags,
 *    thumbnails, SEO) op de bestaande diensten overschrijven.
 *  - Dit script raakt alleen het document met _id `service-<slug>`.
 *
 * Gebruik (vanuit scripts/):
 *   npx tsx seed-branche-communicatie.ts            # DRY RUN (toont het doc)
 *   npx tsx seed-branche-communicatie.ts --live     # schrijft naar Sanity
 *
 * TLS: draai met system-CA als een lokale proxy/antivirus het certificaat
 * onderschept:  NODE_OPTIONS=--use-system-ca npx tsx ... --live
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

const SLUG = "onderzoeksbureau-marketing-communicatie";
const MD_PATH = path.join(
  __dirname,
  `../apps/web/src/content/services/${SLUG}.md`
);
const LIVE = process.argv.includes("--live");

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || "production";

if (!projectId) {
  console.error("❌ SANITY_PROJECT_ID ontbreekt in apps/web/.env");
  process.exit(1);
}

const raw = fs.readFileSync(MD_PATH, "utf-8");
const { data: frontmatter, content } = matter(raw);
const { blocks, log } = markdownToPortableText(content);

const doc = {
  _type: "service",
  _id: `service-${SLUG}`,
  service: frontmatter.service,
  slug: { _type: "slug", current: SLUG },
  description: frontmatter.description,
  categories: frontmatter.categories ?? ["branches"],
  body: blocks,
};

console.log(`📄 Document: ${doc._id}`);
console.log(`   service:     ${doc.service}`);
console.log(`   slug:        /services/${SLUG}`);
console.log(`   categories:  ${JSON.stringify(doc.categories)}`);
console.log(`   body blokken: ${blocks.length}`);
if (log.length) {
  console.log("\n⚠️  Conversie-aandachtspunten:");
  log.forEach((l) => console.log(`   • ${l}`));
}

if (!LIVE) {
  console.log("\n🟡 DRY RUN — niets geschreven. Draai met --live om te seeden.");
  process.exit(0);
}

if (!process.env.SANITY_TOKEN) {
  console.error("\n❌ SANITY_TOKEN ontbreekt — vereist voor --live.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

client
  .createOrReplace(doc)
  .then((res) => {
    console.log(`\n✅ Geschreven naar Sanity: ${res._id}`);
    console.log("   Open Studio (pnpm dev:studio) om te controleren.");
  })
  .catch((err) => {
    console.error("\n❌ Schrijven mislukt:", err.message);
    process.exit(1);
  });
