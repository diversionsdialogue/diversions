/**
 * optimize-public-images.mjs
 *
 * Zet de rasterafbeeldingen in apps/web/public/img/ om naar AVIF + WebP (+ een
 * compacte fallback voor foto's). Astro optimaliseert public/ NIET zelf, dus dit
 * doen we hier met sharp.
 *
 * - Foto's: schalen naar max 1600px breed, avif + webp + compacte jpg-fallback.
 * - Logo's/portret (alpha): avif + webp, transparantie behouden, origineel als
 *   fallback. Bestanden met spaties krijgen een nette kebab-naam.
 *
 * Draai vanuit apps/web (zodat sharp resolve­t):
 *   node ../../scripts/optimize-public-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
// Draai vanuit apps/web; sharp resolve­t dan uit apps/web/node_modules.
const require = createRequire(path.join(process.cwd(), "package.json"));
const sharp = require("sharp");

const IMG_DIR = path.resolve("public/img");

// base = output-basisnaam (kebab, geen spaties). src = bronbestand.
const PHOTOS = [
  { src: "onderzoeksbureau Diversions1.png", base: "onderzoeksbureau-diversions-1" },
  { src: "onderzoeksbureau Diversions2.png", base: "onderzoeksbureau-diversions-2" },
  { src: "onderzoeksbureau Diversions3.png", base: "onderzoeksbureau-diversions-3" },
  { src: "onderzoeksbureau Diversions4.png", base: "onderzoeksbureau-diversions-4" },
  { src: "about.jpeg", base: "about", maxW: 1400 },
  { src: "hero.png", base: "hero" },
  { src: "blog1.jpeg", base: "blog1", maxW: 1200 },
  { src: "work1.png", base: "work1", maxW: 1200 },
];

const ALPHA = [
  { src: "logo-bnr.png", base: "logo-bnr" },
  { src: "logo-data-insights.png", base: "logo-data-insights" },
  { src: "logo-avg.png", base: "logo-avg" },
  { src: "william-burghout.png", base: "william-burghout", maxW: 480 },
];

const kb = (p) => (fs.existsSync(p) ? Math.round(fs.statSync(p).size / 1024) : 0);

async function photo({ src, base, maxW = 1600 }) {
  const inPath = path.join(IMG_DIR, src);
  if (!fs.existsSync(inPath)) return console.warn(`  ⚠️  ontbreekt: ${src}`);
  const pipe = sharp(inPath).resize({ width: maxW, withoutEnlargement: true });
  await pipe.clone().avif({ quality: 50 }).toFile(path.join(IMG_DIR, `${base}.avif`));
  await pipe.clone().webp({ quality: 72 }).toFile(path.join(IMG_DIR, `${base}.webp`));
  await pipe.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(IMG_DIR, `${base}.jpg`));
  console.log(
    `  ${src} (${kb(inPath)}KB) → ${base}: avif ${kb(path.join(IMG_DIR, base + ".avif"))}KB · webp ${kb(
      path.join(IMG_DIR, base + ".webp")
    )}KB · jpg ${kb(path.join(IMG_DIR, base + ".jpg"))}KB`
  );
}

async function alpha({ src, base, maxW }) {
  const inPath = path.join(IMG_DIR, src);
  if (!fs.existsSync(inPath)) return console.warn(`  ⚠️  ontbreekt: ${src}`);
  let pipe = sharp(inPath);
  if (maxW) pipe = pipe.resize({ width: maxW, withoutEnlargement: true });
  await pipe.clone().avif({ quality: 60 }).toFile(path.join(IMG_DIR, `${base}.avif`));
  await pipe.clone().webp({ quality: 90 }).toFile(path.join(IMG_DIR, `${base}.webp`));
  console.log(
    `  ${src} (${kb(inPath)}KB) → ${base}: avif ${kb(path.join(IMG_DIR, base + ".avif"))}KB · webp ${kb(
      path.join(IMG_DIR, base + ".webp")
    )}KB`
  );
}

console.log("📷 Foto's:");
for (const p of PHOTOS) await photo(p);
console.log("🔖 Logo's / portret:");
for (const a of ALPHA) await alpha(a);
console.log("✅ Klaar.");
