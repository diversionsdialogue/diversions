/**
 * migrate-work-statement.ts — migreert de cases naar de nieuwe opzet:
 *  - haalt het `statement` uit de eerste ##-kop van de body
 *  - verwijdert die kop uit de body (geen dubbeling met het statement-veld)
 *  - schrijft de .md bij (frontmatter `statement` + body zonder kop)
 *  - patcht het Sanity-document met { statement, body } (thumbnail e.d. blijft)
 *
 * Gebruik (vanuit scripts/):
 *   npx tsx migrate-work-statement.ts            # alleen de .md's bijwerken (dry voor Sanity)
 *   NODE_OPTIONS=--use-system-ca npx tsx migrate-work-statement.ts --live   # + Sanity patchen
 */
import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { markdownToPortableText } from "./markdown-to-portable-text";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../apps/web/.env") });

const LIVE = process.argv.includes("--live");
const WORK_DIR = path.join(__dirname, "../apps/web/src/content/work");

const projectId = process.env.SANITY_PROJECT_ID;
const client =
  LIVE && projectId
    ? createClient({
        projectId,
        dataset: process.env.SANITY_DATASET || "production",
        apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
        token: process.env.SANITY_TOKEN,
        useCdn: false,
      })
    : null;

if (LIVE && !process.env.SANITY_TOKEN) {
  console.error("❌ SANITY_TOKEN ontbreekt — vereist voor --live.");
  process.exit(1);
}

const files = fs.readdirSync(WORK_DIR).filter((f) => f.endsWith(".md"));

(async () => {
// Sanity-id's wijken soms af van de bestandsnaam → match op het `work`-veld.
const idByWork = new Map<string, string>();
if (LIVE && client) {
  const docs: Array<{ _id: string; work: string }> = await client.fetch(
    '*[_type=="workItem"]{_id, work}'
  );
  docs.forEach((d) => idByWork.set(d.work, d._id));
}

for (const file of files) {
  const slug = path.basename(file, ".md");
  const full = path.join(WORK_DIR, file);
  const raw = fs.readFileSync(full, "utf-8");
  const { data, content } = matter(raw);

  // Eerste ##-kop → statement; daarna die regel uit de body halen.
  let statement: string | undefined = data.statement;
  let body = content;
  const m = content.match(/^##\s+(.+?)\s*$/m);
  if (!statement && m) {
    statement = m[1].trim();
    // verwijder exact die kopregel (en een eventuele direct erop volgende lege regel)
    body = content.replace(new RegExp(`^##\\s+${m[1].replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s*$\\n?\\n?`, "m"), "");
  }

  if (!statement) {
    console.log(`• ${file}: geen ##-kop gevonden, overgeslagen.`);
    continue;
  }

  // .md bijwerken (statement in frontmatter, body zonder kop)
  data.statement = statement;
  const newRaw = matter.stringify(body.replace(/^\n+/, ""), data);
  fs.writeFileSync(full, newRaw, "utf-8");
  console.log(`✓ ${file}: statement = "${statement}"`);

  if (LIVE && client) {
    const docId = idByWork.get(data.work);
    if (!docId) {
      console.log(`  ↳ ⚠️ geen Sanity-doc voor work="${data.work}" — overgeslagen.`);
    } else {
      try {
        const { blocks } = markdownToPortableText(body);
        await client.patch(docId).set({ statement, body: blocks }).commit();
        console.log(`  ↳ Sanity gepatcht (${docId})`);
      } catch (e: any) {
        console.log(`  ↳ ❌ patch mislukt (${docId}): ${e.message}`);
      }
    }
  }
}

console.log(LIVE ? "\n✅ Klaar (md + Sanity)." : "\n🟡 md's bijgewerkt. Draai met --live om Sanity te patchen.");
})().catch((e) => { console.error("❌", e.message); process.exit(1); });
