/**
 * export-teksten.mjs
 * Maakt van de Sanity-dataset-export (export.tar.gz -> data.ndjson) een map met
 * LEESBARE TEKSTEN: één Markdown-bestand per document, Portable Text platgeslagen
 * naar markdown. CONVERT-META-commentaarblokken worden weggefilterd.
 *
 * Gebruik: node scripts/export-teksten.mjs <pad-naar-data.ndjson> [uitvoermap]
 *   default uitvoermap: export-teksten/
 */
import fs from "node:fs";
import path from "node:path";

const NDJSON = process.argv[2];
const OUT = process.argv[3] || "export-teksten";
if (!NDJSON || !fs.existsSync(NDJSON)) {
  console.error("Geef het pad naar data.ndjson mee."); process.exit(1);
}

const docs = fs.readFileSync(NDJSON, "utf8").trim().split(/\r?\n/).map((l) => JSON.parse(l));

const slugOf = (d) => (d._id || "").replace(/^drafts\./, "").replace(/^(post|service|workItem|teamMember|legalPage)-/, "") || d._id;

// span-marks toepassen (decorators + links via markDefs)
function renderSpan(span, markDefs) {
  let t = span.text ?? "";
  if (!t) return t;
  const marks = span.marks || [];
  for (const m of marks) {
    const def = markDefs.find((d) => d._key === m);
    if (def && def._type === "link" && def.href) t = `[${t}](${def.href})`;
  }
  if (marks.includes("strong")) t = `**${t}**`;
  if (marks.includes("em")) t = `*${t}*`;
  return t;
}

function blockText(block) {
  return (block.children || []).map((c) => c.text ?? "").join("");
}

function renderBlock(block) {
  if (block._type === "image") return "_(afbeelding)_";
  if (block._type !== "block") return ""; // onbekend objecttype overslaan
  const md = (block.children || []).map((c) => renderSpan(c, block.markDefs || [])).join("");
  if (!md.trim()) return "";
  if (block.listItem === "bullet") return `- ${md}`;
  if (block.listItem === "number") return `1. ${md}`;
  switch (block.style) {
    case "h2": return `## ${md}`;
    case "h3": return `### ${md}`;
    case "h4": return `#### ${md}`;
    case "blockquote": return `> ${md}`;
    default: return md;
  }
}

function bodyToMd(body) {
  if (!Array.isArray(body)) return "";
  const out = [];
  let inComment = false; // CONVERT-META-commentaar loopt over meerdere blokken
  for (const b of body) {
    const raw = b._type === "block" ? blockText(b) : "";
    if (inComment) {
      if (raw.includes("-->")) inComment = false;
      continue;
    }
    if (raw.includes("<!--") || /CONVERT-META/.test(raw)) {
      if (!raw.includes("-->")) inComment = true; // open comment over volgende blokken
      continue; // sla (begin van) het commentaar over
    }
    const line = renderBlock(b);
    if (line === null) continue;
    out.push(line);
  }
  // dubbele lege regels opruimen
  return out.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

const HEADERS = {
  post: (d) => [`# ${d.title ?? "(zonder titel)"}`,
    d.description ? `\n_${d.description}_` : "",
    [d.author && `Auteur: ${d.author}`, d.pubDate && `Datum: ${String(d.pubDate).slice(0,10)}`,
     d.tags?.length && `Tags: ${d.tags.join(", ")}`].filter(Boolean).join(" · ")].filter(Boolean).join("\n"),
  service: (d) => [`# ${d.service ?? "(zonder titel)"}`, d.description ? `\n_${d.description}_` : ""].filter(Boolean).join("\n"),
  workItem: (d) => [`# ${d.work ?? "(zonder titel)"}`,
    [d.client && `Klant: ${d.client}`, d.company && `Bureau: ${d.company}`,
     d.credits?.length && `Credits: ${d.credits.join(", ")}`].filter(Boolean).join(" · ")].filter(Boolean).join("\n"),
  legalPage: (d) => `# ${d.page ?? "(zonder titel)"}`,
  teamMember: (d) => [`# ${d.name ?? "(zonder naam)"}`, d.role ? `_${d.role}_` : "",
    d.intro ? `\n${d.intro}` : ""].filter(Boolean).join("\n"),
};

const TYPEMAP = { post: "blog", service: "diensten", workItem: "cases", legalPage: "juridisch", teamMember: "team" };

let n = 0;
const index = [];
for (const d of docs) {
  const mk = HEADERS[d._type];
  if (!mk) continue; // alleen content-documenttypes
  const folder = path.join(OUT, TYPEMAP[d._type] || d._type);
  fs.mkdirSync(folder, { recursive: true });
  const slug = slugOf(d);
  const md = `${mk(d)}\n\n${bodyToMd(d.body)}\n`;
  const file = path.join(folder, `${slug}.md`);
  fs.writeFileSync(file, md);
  index.push(`- [${TYPEMAP[d._type]}] ${slug} — ${(d.title||d.service||d.work||d.page||d.name||slug)}`);
  n++;
}
fs.writeFileSync(path.join(OUT, "INDEX.md"), `# Inhoud-export (teksten)\n\n${index.sort().join("\n")}\n`);
console.log(`Klaar: ${n} tekstbestanden geschreven naar ${OUT}/`);
