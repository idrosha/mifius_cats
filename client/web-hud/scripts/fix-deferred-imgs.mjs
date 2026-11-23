/**
 * Repair broken self-closing img tags from defer pass + force pve png→webp.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

function walk(dir, pred) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, pred));
    else if (pred(p, e.name)) out.push(p);
  }
  return out;
}

const files = [
  path.join(PUBLIC, "index.html"),
  ...walk(path.join(PUBLIC, "stitch"), (p, n) => n.endsWith(".html")),
];

const pngToWebp = [
  "/stitch-assets/pve-load/chapter-1-iron.png",
  "/stitch-assets/pve-load/chapter-2-frost.png",
  "/stitch-assets/pve-load/chapter-3-crimson-load.png",
  "/stitch-assets/pve-load/chapter-4-plague-load.png",
  "/stitch-assets/pve-load/chapter-5-spectral-load.png",
  "/stitch-assets/pve-fight/ch1-entrance.png",
];

for (const file of files) {
  let text = fs.readFileSync(file, "utf8");
  const before = text;
  // Fix leftover XHTML slash between attributes: `alt="" / decoding=`
  text = text.replace(/"\s*\/\s+(?=(?:decoding|loading|data-mf-src|src|fetchpriority|width|height|class|alt|id)=)/g, '" ');
  for (const from of pngToWebp) {
    const to = from.replace(/\.png$/i, ".webp");
    if (text.includes(from)) text = text.split(from).join(to);
  }
  if (text !== before) {
    fs.writeFileSync(file, text);
    console.log("fixed", path.relative(PUBLIC, file).replace(/\\/g, "/"));
  }
}

const appPath = path.join(PUBLIC, "app.js");
let app = fs.readFileSync(appPath, "utf8");
const appBefore = app;
app = app.replace(/\/stitch-assets\/pve-(load|fight)\/([\w.-]+)\.png/g, "/stitch-assets/pve-$1/$2.webp");
if (app !== appBefore) {
  fs.writeFileSync(appPath, app);
  console.log("fixed app.js");
}
console.log("done");
