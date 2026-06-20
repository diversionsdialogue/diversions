/**
 * seed-branche.ts — schrijft ÉÉN branche-service-document naar Sanity vanuit de
 * bijbehorende bron-markdown in apps/web/src/content/services/<slug>.md.
 *
 * Generiek vervolg op seed-branche-communicatie.ts: de slug is een argument,
 * zodat hetzelfde script voor elke branchepagina werkt.
 *
 * Waarom apart i.p.v. `pnpm migrate`? migrate doet createOrReplace op ALLE
 * services en laat slug + categories vallen. Dit script raakt alleen het ene
 * document met _id `service-<slug>`.
 *
 * Gebruik (vanuit scripts/):
 *   npx tsx seed-branche.ts <slug>           # DRY RUN (toont het doc)
 *   NODE_OPTIONS=--use-system-ca npx tsx seed-branche.ts <slug> --live
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

const args = process.argv.slice(2);
const LIVE = args.includes("--live");
const slug = args.find((a) => !a.startsWith("--"));

if (!slug) {
  console.error("❌ Geef een slug mee, bv: npx tsx seed-branche.ts onderzoeksbureau-verenigingen");
  process.exit(1);
}

const MD_PATH = path.join(__dirname, `../apps/web/src/content/services/${slug}.md`);
if (!fs.existsSync(MD_PATH)) {
  console.error(`❌ Bron-md niet gevonden: ${MD_PATH}`);
  process.exit(1);
}

const projectId = process.env.SANITY_PROJECT_ID;
if (!projectId) {
  console.error("❌ SANITY_PROJECT_ID ontbreekt in apps/web/.env");
  process.exit(1);
}

const raw = fs.readFileSync(MD_PATH, "utf-8");
const { data: frontmatter, content } = matter(raw);
const { blocks, log } = markdownToPortableText(content);

const doc = {
  _type: "service",
  _id: `service-${slug}`,
  service: frontmatter.service,
  slug: { _type: "slug", current: slug },
  description: frontmatter.description,
  categories: frontmatter.categories ?? ["branches"],
  body: blocks,
};

console.log(`📄 ${doc._id}`);
console.log(`   service:    ${doc.service}`);
console.log(`   slug:       /services/${slug}`);
console.log(`   categories: ${JSON.stringify(doc.categories)}`);
console.log(`   body:       ${blocks.length} blokken`);
if (log.length) {
  console.log("⚠️  Conversie-aandachtspunten:");
  log.forEach((l) => console.log(`   • ${l}`));
}

if (!LIVE) {
  console.log("🟡 DRY RUN — niets geschreven. Voeg --live toe om te seeden.");
  process.exit(0);
}

if (!process.env.SANITY_TOKEN) {
  console.error("❌ SANITY_TOKEN ontbreekt — vereist voor --live.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

client
  .createOrReplace(doc)
  .then((res) => console.log(`✅ Geschreven naar Sanity: ${res._id}`))
  .catch((err) => {
    console.error("❌ Schrijven mislukt:", err.message);
    process.exit(1);
  });
