/**
 * Rewrite public HTML/JS/CSS refs from archived PNG/JPG to sibling WebP.
 * Usage: node scripts/rewrite-to-webp.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");

function walk(dir, fn) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules") continue;
      walk(p, fn);
    } else fn(p, e.name);
  }
}

function pubUrl(abs) {
  return "/" + path.relative(PUBLIC, abs).replace(/\\/g, "/");
}

const rewrites = new Map();

function considerWebp(webpAbs) {
  const dir = path.dirname(webpAbs);
  const base = path.basename(webpAbs, ".webp");
  const srcDir = path.join(dir, "_src");
  for (const ext of [".png", ".jpg", ".jpeg"]) {
    const archived = path.join(srcDir, base + ext);
    const live = path.join(dir, base + ext);
    if (fs.existsSync(archived) || fs.existsSync(live)) {
      rewrites.set(pubUrl(live), pubUrl(webpAbs));
    }
  }
}

for (const root of ["stitch-assets", "stitch-ref"]) {
  walk(path.join(PUBLIC, root), (p, name) => {
    if (name.toLowerCase().endsWith(".webp")) considerWebp(p);
  });
}

// Hard aliases for known broken leftovers
const aliases = [
  ["/stitch-assets/login-bg.png", "/stitch-assets/login-bg.webp"],
  ["/stitch-assets/login-hero.png", "/stitch-assets/login-hero.webp"],
];
for (const [from, to] of aliases) {
  if (fs.existsSync(path.join(PUBLIC, to.slice(1)))) rewrites.set(from, to);
}

const pairs = [...rewrites.entries()].sort((a, b) => b[0].length - a[0].length);
console.log(`rewrite pairs: ${pairs.length}`);

const targets = [];
for (const f of ["index.html", "app.js", "styles.css", "codex-topics.js"]) {
  const p = path.join(PUBLIC, f);
  if (fs.existsSync(p)) targets.push(p);
}
walk(path.join(PUBLIC, "stitch"), (p, name) => {
  if (/\.(html|js|css)$/i.test(name)) targets.push(p);
});

let filesTouched = 0;
let replacements = 0;
const touched = [];
for (const file of targets) {
  let text = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [from, to] of pairs) {
    if (!text.includes(from)) continue;
    const n = text.split(from).length - 1;
    text = text.split(from).join(to);
    replacements += n;
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, text);
    filesTouched += 1;
    touched.push(path.relative(PUBLIC, file).replace(/\\/g, "/"));
  }
}

console.log(`updated ${filesTouched} files, ${replacements} replacements`);
for (const t of touched) console.log(`  ${t}`);
fs.writeFileSync(
  path.join(__dirname, "rewrite-to-webp.report.json"),
  JSON.stringify({ pairs: Object.fromEntries(pairs), filesTouched, replacements, touched }, null, 2),
);
