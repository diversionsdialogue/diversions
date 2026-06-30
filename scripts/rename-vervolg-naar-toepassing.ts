/**
 * rename-vervolg-naar-toepassing.ts
 *
 * Hernoemt de methodiek-stap "Vervolg" -> "Toepassing" (Inzicht, Vertaling, Toepassing)
 * op de 7 dienstpagina's waar de trits voorkomt. Werkt BEIDE bronnen bij:
 *   - de markdown-mirrors in apps/web/src/content/services/
 *   - de Sanity `service`-documenten (published, direct gepatcht)
 *
 * In deze 7 bestanden is elke "Vervolg" de framework-stap (geen "vervolgonderzoek"
 * /"vervolgens"), dus een woord-vervanging (\bVervolg\b) is veilig. Grammaticafix:
 * "een direct Vervolg" -> "een directe Toepassing".
 *
 * Gebruik:
 *   npx tsx scripts/rename-vervolg-naar-toepassing.ts            # alleen md (dry voor Sanity)
 *   NODE_OPTIONS=--use-system-ca npx tsx scripts/rename-vervolg-naar-toepassing.ts --live  # + Sanity
 */
import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../apps/web/.env") });

const LIVE = process.argv.includes("--live");

const SLUGS = [
  "campagne-effectonderzoek",
  "onderzoeksbureau-marketing-communicatie",
  "onderzoeksbureau-goede-doelen",
  "onderzoeksbureau-zorg",
  "onderzoeksbureau-verenigingen",
  "onderzoeksbureau-overheid-non-profit",
  "pretest",
];

/** Pas de woord-vervanging + grammaticafix toe op een stuk tekst. */
function fix(text: string): string {
  let t = text.replace(/\bVervolg\b/g, "Toepassing");
  // "een direct Vervolg" -> "een directe Toepassing" (Toepassing is de-woord)
  t = t.replace(/\bdirect Toepassing\b/g, "directe Toepassing");
  return t;
}

// ---- 1. Markdown-mirrors ----------------------------------------------------
const SERVICES_DIR = path.join(__dirname, "../apps/web/src/content/services");
for (const slug of SLUGS) {
  const full = path.join(SERVICES_DIR, `${slug}.md`);
  if (!fs.existsSync(full)) {
    console.log(`• md ontbreekt: ${slug}.md — overgeslagen.`);
    continue;
  }
  const raw = fs.readFileSync(full, "utf-8");
  const next = fix(raw);
  if (next !== raw) {
    fs.writeFileSync(full, next, "utf-8");
    const n = (raw.match(/\bVervolg\b/g) || []).length;
    console.log(`✓ md ${slug}.md: ${n}× Vervolg -> Toepassing`);
  } else {
    console.log(`· md ${slug}.md: niets te wijzigen`);
  }
}

// ---- 2. Sanity (alleen met --live) ------------------------------------------
if (!LIVE) {
  console.log("\n🟡 md's bijgewerkt. Draai met --live om Sanity te patchen.");
  process.exit(0);
}

const projectId = process.env.SANITY_PROJECT_ID;
if (!projectId || !process.env.SANITY_TOKEN) {
  console.error("❌ SANITY_PROJECT_ID en/of SANITY_TOKEN ontbreekt — vereist voor --live.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

(async () => {
  const docs: Array<{ _id: string; body?: any[] }> = await client.fetch(
    '*[_type=="service" && slug.current in $slugs]{_id, body}',
    { slugs: SLUGS }
  );
  console.log(`\nSanity: ${docs.length} service-documenten gevonden.`);

  for (const doc of docs) {
    if (!Array.isArray(doc.body)) {
      console.log(`· ${doc._id}: geen body-array — overgeslagen.`);
      continue;
    }
    let changed = 0;
    const body = doc.body.map((block: any) => {
      if (block?._type === "block" && Array.isArray(block.children)) {
        block.children = block.children.map((sp: any) => {
          if (typeof sp?.text === "string" && /\bVervolg\b/.test(sp.text)) {
            const nt = fix(sp.text);
            if (nt !== sp.text) changed++;
            return { ...sp, text: nt };
          }
          return sp;
        });
      }
      return block;
    });
    if (changed > 0) {
      await client.patch(doc._id).set({ body }).commit();
      console.log(`✓ Sanity ${doc._id}: ${changed} span(s) gewijzigd`);
    } else {
      console.log(`· Sanity ${doc._id}: niets te wijzigen`);
    }
  }
  console.log("\n✅ Klaar (md + Sanity).");
})().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
