import fs from "node:fs";

const path = "inventaris.json";
const inv = JSON.parse(fs.readFileSync(path, "utf8"));

let filled = 0;
for (const it of inv) {
  if (
    it.redirect_naar == null &&
    it.bestemming === "importeren-naar-sanity" &&
    it.nieuwe_url &&
    it.nieuwe_url !== it.oude_url
  ) {
    it.redirect_naar = it.nieuwe_url;
    filled++;
  }
}

fs.writeFileSync(path, JSON.stringify(inv, null, 2) + "\n");
console.log(`redirect_naar ingevuld voor ${filled} importeren-naar-sanity items.`);
