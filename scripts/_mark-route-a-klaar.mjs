// One-off helper (convert-agent): set status.convert "todo-route-a" -> "klaar"
// for all 25 route-A pages now that the Astro pages are built. Safe to delete after.
import { readFileSync, writeFileSync } from "node:fs";

const path = new URL("../inventaris.json", import.meta.url);
const data = JSON.parse(readFileSync(path, "utf8"));

let changed = 0;
for (const item of data) {
  if (item?.status?.convert === "todo-route-a") {
    item.status.convert = "klaar";
    changed++;
  }
}

writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Updated ${changed} items to "klaar".`);
