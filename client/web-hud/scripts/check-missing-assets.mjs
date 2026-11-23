import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const texts = {
  "index.html": fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8"),
  "app.js": fs.readFileSync(path.join(PUBLIC, "app.js"), "utf8"),
  "styles.css": fs.readFileSync(path.join(PUBLIC, "styles.css"), "utf8"),
};
const re = /\/stitch-(?:assets|ref)\/[\w./-]+\.(?:png|jpe?g|webp)/g;
const missing = [];
for (const [name, text] of Object.entries(texts)) {
  for (const m of text.matchAll(re)) {
    const u = m[0].split("?")[0];
    const abs = path.join(PUBLIC, u.slice(1));
    if (!fs.existsSync(abs)) missing.push([name, u]);
  }
}
const uniq = [...new Map(missing.map((x) => [x[1] + "@" + x[0], x])).values()];
console.log("missing count", uniq.length);
for (const [f, u] of uniq.slice(0, 60)) console.log(f, u);
