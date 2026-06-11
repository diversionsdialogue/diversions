/**
 * sanity-strip-meta.mjs
 * Verwijdert HTML-commentaarblokken (<!-- ... -->), waaronder de migratie-
 * CONVERT-META- en IMG-notities, uit de Portable-Text `body` van alle Sanity-
 * documenten. Die blokken horen niet in de content en renderen nu als zichtbare
 * rommel op de pagina's.
 *
 * Logica (blok-niveau, stateful):
 *   - Een blok waarvan de tekst "<!--" bevat opent (of is) een commentaar.
 *     Bevat datzelfde blok ook "-->" => inline commentaar, alleen dit blok weg.
 *     Zo niet => commentaar loopt door; alle volgende blokken weg t/m het blok
 *     dat "-->" bevat.
 *   - Alle overige blokken (inclusief echte lijsten, koppen, image-objecten)
 *     blijven ONGEWIJZIGD.
 *
 * Alleen verwijderen, nooit bestaande blokken bewerken => geen risico op
 * kapotte spans/markDefs.
 *
 * Gebruik:
 *   node scripts/sanity-strip-meta.mjs            # DRY-RUN (toont elk te verwijderen blok)
 *   node scripts/sanity-strip-meta.mjs --execute  # patcht body's in Sanity
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

const ROOT = process.cwd();
const execute = process.argv.includes("--execute");

const env = {};
for (const l of fs.readFileSync(path.join(ROOT, "apps/web/.env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const client = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET || "production",
  apiVersion: env.SANITY_API_VERSION || "2024-01-01",
  token: env.SANITY_TOKEN,
  useCdn: false,
});

const plain = (blk) =>
  blk._type === "block" ? (blk.children || []).map((s) => s.text ?? "").join("") : "";

/**
 * Span-niveau: verwijder alle <!-- ... --> regio's uit de teksten, ook over
 * span- en blokgrenzen heen. Echte content + marks/markDefs blijven behouden.
 * - Een blok dat na het strippen alleen leeg/whitespace overhoudt -> weg.
 * - Een blok met resterende echte tekst -> behouden (met gestripte spans).
 */
function cleanBody(body) {
  const out = [];
  const removed = []; // verwijderde comment-fragmenten (voor het rapport)
  const modified = []; // {voor, na} voor blokken die deels gestript zijn
  let inComment = false;

  for (const blk of body) {
    if (blk._type !== "block") {
      // niet-tekst (bv. image-object): nooit als content weggooien.
      out.push(blk);
      continue;
    }
    const before = plain(blk);
    const newChildren = [];
    for (const span of blk.children || []) {
      if (span._type !== "span" || typeof span.text !== "string") {
        if (!inComment) newChildren.push(span);
        continue;
      }
      const text = span.text;
      let kept = "";
      let i = 0;
      while (i < text.length) {
        if (!inComment) {
          const open = text.indexOf("<!--", i);
          if (open === -1) { kept += text.slice(i); break; }
          kept += text.slice(i, open);
          inComment = true;
          i = open + 4;
        } else {
          const close = text.indexOf("-->", i);
          if (close === -1) { i = text.length; }
          else { inComment = false; i = close + 3; }
        }
      }
      if (kept.length > 0) newChildren.push({ ...span, text: kept });
    }

    const after = newChildren.map((s) => s.text ?? "").join("");
    if (after.trim() === "") {
      // blok bestond volledig uit comment(s)
      if (before.trim() !== "") removed.push(before);
      continue;
    }
    if (after !== before) {
      modified.push({ voor: before, na: after });
      out.push({ ...blk, children: newChildren });
    } else {
      out.push(blk);
    }
  }
  return { out, removed, modified, open: inComment };
}

const run = async () => {
  if (!env.SANITY_PROJECT_ID || !env.SANITY_TOKEN) {
    console.error("FOUT: SANITY_PROJECT_ID/SANITY_TOKEN ontbreekt in apps/web/.env");
    process.exit(1);
  }
  const docs = await client.fetch(`*[defined(body)]{_id, _type, body}`);
  let totalRemoved = 0, totalModified = 0;
  const affected = [];

  for (const d of docs) {
    const { out, removed, modified, open } = cleanBody(d.body);
    if (removed.length === 0 && modified.length === 0) continue;
    affected.push({ id: d._id, type: d._type, before: d.body.length, after: out.length, removed, modified, out, open });
    totalRemoved += removed.length;
    totalModified += modified.length;
  }
  const clip = (t) => JSON.stringify(t.length > 150 ? t.slice(0, 150) + "…" : t);

  console.log(`Documenten met body: ${docs.length} | aangeraakt: ${affected.length} | blokken verwijderd: ${totalRemoved} | blokken deels gestript: ${totalModified}\n`);
  for (const a of affected) {
    console.log(`■ ${a.id} (${a.type})  ${a.before} -> ${a.after} blokken  (-${a.removed.length} weg, ${a.modified.length} gestript)`);
    a.removed.forEach((t) => console.log(`    ✂ weg:      ${clip(t)}`));
    a.modified.forEach((m) => {
      console.log(`    ~ voor:     ${clip(m.voor)}`);
      console.log(`      behouden: ${clip(m.na)}`);
    });
    if (a.open) console.log(`    ⚠ LET OP: niet-afgesloten '<!--' — controleer dit doc handmatig!`);
  }

  if (!execute) {
    console.log(`\n[DRY-RUN] Niets gewijzigd. Controleer hierboven dat alleen meta-/comment-tekst wegvalt, run dan met --execute.`);
    return;
  }

  let tx = client.transaction();
  for (const a of affected) tx = tx.patch(a.id, { set: { body: a.out } });
  const res = await tx.commit({ visibility: "async" });
  console.log(`\n[EXECUTE] ${affected.length} documenten gepatcht (${totalRemoved} blokken verwijderd). Mutaties: ${res.results?.length ?? affected.length}`);
};

run().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
