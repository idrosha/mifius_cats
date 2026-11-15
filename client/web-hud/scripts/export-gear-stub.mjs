/** One-shot: dump GEAR_CATALOG_SEED shape from app.js into public/gear-stub.json */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(__dirname, "../public/app.js");
const outPath = path.join(__dirname, "../public/gear-stub.json");
const src = fs.readFileSync(appPath, "utf8");
const start = src.indexOf("gearCatalog: [");
const endMark = "/** Derived from gearCatalog";
const endComment = src.indexOf(endMark);
if (start < 0 || endComment < 0) throw new Error("gearCatalog block not found");
const end = src.lastIndexOf("],", endComment);
if (end < 0) throw new Error("gearCatalog array end not found");
const arrSrc = src.slice(start + "gearCatalog: ".length, end + 1);
const items = vm.runInNewContext(`(${arrSrc})`);
const payload = {
  stub: true,
  cap: 96,
  note: "D-028 HUD stub; battle ignores client gear; Nakama inventory later",
  items,
};
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n");
console.log(`wrote ${items.length} items → ${outPath}`);
