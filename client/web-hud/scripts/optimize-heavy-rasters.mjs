/**
 * Convert remaining heavy HUD rasters → WebP and rewrite public refs.
 * Targets: raid cutouts, kb-v3 armor/items, mode BGs, large root PNGs.
 *
 * Usage: node scripts/optimize-heavy-rasters.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");
const ASSETS = path.join(PUBLIC, "stitch-assets");
const CUTOUT_Q = 82;
const CUTOUT_MAX = 1280;
const OPAQUE_Q = 80;
const OPAQUE_MAX = 1600;
const ICON_Q = 82;
const ICON_MAX = 768;

const report = [];
const rewrites = []; // { from, to } relative to PUBLIC with forward slashes

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function kb(n) {
  return Math.round(n / 1024);
}

function rel(p) {
  return path.relative(PUBLIC, p).replace(/\\/g, "/");
}

async function moveToSrc(absPath) {
  const dir = path.dirname(absPath);
  const srcDir = path.join(dir, "_src");
  ensureDir(srcDir);
  const dest = path.join(srcDir, path.basename(absPath));
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  fs.renameSync(absPath, dest);
  return dest;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function writeFileRetry(dest, buf, attempts = 8) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      try {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
      } catch {
        /* locked */
      }
      fs.writeFileSync(dest, buf);
      return;
    } catch (err) {
      lastErr = err;
      await sleep(80 * (i + 1));
    }
  }
  throw lastErr;
}

async function toWebp(absIn, {
  quality,
  alpha = true,
  maxLong,
  keepSrc = true,
} = {}) {
  if (!fs.existsSync(absIn)) {
    report.push({ skip: rel(absIn), reason: "missing" });
    return null;
  }
  const ext = path.extname(absIn).toLowerCase();
  if (ext === ".webp") {
    report.push({ skip: rel(absIn), reason: "already-webp" });
    return null;
  }
  const outWebp = absIn.replace(/\.(png|jpe?g)$/i, ".webp");
  if (fs.existsSync(outWebp) && fs.statSync(outWebp).mtimeMs >= fs.statSync(absIn).mtimeMs) {
    // Already converted newer/equal — still register rewrite + archive original
    rewrites.push({ from: `/${rel(absIn)}`, to: `/${rel(outWebp)}` });
    if (keepSrc) {
      try {
        await moveToSrc(absIn);
      } catch {
        /* may already be gone */
      }
    }
    report.push({ skip: rel(absIn), reason: "webp-fresh", out: rel(outWebp) });
    return rel(outWebp);
  }

  const before = fs.statSync(absIn).size;
  const meta = await sharp(absIn, { failOn: "none" }).metadata();
  const long = Math.max(meta.width || 0, meta.height || 0);
  let pipeline = sharp(absIn, { failOn: "none" }).rotate();
  if (maxLong && long > maxLong) {
    const landscape = (meta.width || 0) >= (meta.height || 0);
    pipeline = landscape
      ? pipeline.resize({ width: maxLong, withoutEnlargement: true })
      : pipeline.resize({ height: maxLong, withoutEnlargement: true });
  }
  const opts = alpha
    ? { quality, alphaQuality: 90, effort: 6, smartSubsample: true }
    : { quality, alphaQuality: 0, effort: 6, smartSubsample: true };
  const buf = await pipeline.webp(opts).toBuffer();
  await writeFileRetry(outWebp, buf);
  const after = fs.statSync(outWebp).size;
  if (keepSrc) await moveToSrc(absIn);
  const row = {
    kind: alpha ? "cutout" : "opaque",
    file: rel(outWebp),
    wh: `${meta.width}x${meta.height}`,
    beforeKb: kb(before),
    afterKb: kb(after),
  };
  report.push(row);
  rewrites.push({ from: `/${rel(absIn)}`, to: `/${rel(outWebp)}` });
  console.log(`${row.beforeKb}→${row.afterKb} KB  ${row.file}`);
  return row.file;
}

function walk(dir, pred) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "_src" || e.name === "_pre_face_left" || e.name === "_pre_opaque" || e.name === "node_modules") {
        continue;
      }
      out.push(...walk(p, pred));
    } else if (pred(p, e.name)) out.push(p);
  }
  return out;
}

function rewritePublicTree() {
  const targets = [];
  const roots = [
    path.join(PUBLIC, "index.html"),
    path.join(PUBLIC, "app.js"),
    path.join(PUBLIC, "styles.css"),
    path.join(PUBLIC, "codex-topics.js"),
  ];
  for (const f of roots) if (fs.existsSync(f)) targets.push(f);
  for (const f of walk(path.join(PUBLIC, "stitch"), (p, name) => /\.(html|js|css)$/i.test(name))) {
    targets.push(f);
  }

  // Prefer longer paths first so partial collisions don't matter
  const pairs = [...rewrites].sort((a, b) => b.from.length - a.from.length);
  let filesTouched = 0;
  let replacements = 0;
  for (const file of targets) {
    let text = fs.readFileSync(file, "utf8");
    let changed = false;
    for (const { from, to } of pairs) {
      if (!text.includes(from)) continue;
      // Avoid rewriting already-webp or _src archives
      const next = text.split(from).join(to);
      if (next !== text) {
        const n = text.split(from).length - 1;
        replacements += n;
        text = next;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(file, text);
      filesTouched += 1;
    }
  }
  console.log(`rewrote ${replacements} refs in ${filesTouched} files`);
}

async function main() {
  console.log("=== raid / mythic cutouts ===");
  const raidCutouts = [
    "myaurra-pitboss-cutout.png",
    "talass-pitboss-cutout.png",
    "vulcan-pitboss-cutout.png",
    "solar-lion-tank-cutout.png",
    "solar-lion-fighter-cutout.png",
    "kitsune-support-cutout.png",
    "kitsune-fighter-cutout.png",
    "deep-lynx-tank-cutout.png",
    "deep-lynx-support-cutout.png",
  ];
  for (const name of raidCutouts) {
    await toWebp(path.join(ASSETS, "monsters", "battle", name), {
      quality: CUTOUT_Q,
      alpha: true,
      maxLong: CUTOUT_MAX,
    });
  }

  // Archive leftover opaque jpg companions of raid cutouts (not used if webp exists)
  console.log("=== archive raid jpg companions ===");
  for (const name of raidCutouts) {
    const jpg = path.join(ASSETS, "monsters", "battle", name.replace(/\.png$/i, ".jpg"));
    if (fs.existsSync(jpg)) {
      const before = fs.statSync(jpg).size;
      await moveToSrc(jpg);
      report.push({ kind: "archive-jpg", file: rel(jpg), beforeKb: kb(before) });
      console.log(`archived ${kb(before)} KB  ${rel(jpg)}`);
    }
  }

  console.log("=== dojo dummy PNG → prefer existing webp ===");
  for (const name of [
    "dummy-oak-knight.png",
    "dummy-straw-berserk.png",
    "dummy-stone-totem.png",
  ]) {
    const png = path.join(ASSETS, "dojo", "battle", name);
    const webp = png.replace(/\.png$/i, ".webp");
    if (fs.existsSync(webp) && fs.existsSync(png)) {
      rewrites.push({ from: `/${rel(png)}`, to: `/${rel(webp)}` });
      await moveToSrc(png);
      report.push({ kind: "prefer-webp", file: rel(webp), archived: rel(png) });
      console.log(`prefer ${rel(webp)}`);
    } else if (fs.existsSync(png)) {
      await toWebp(png, { quality: CUTOUT_Q, alpha: true, maxLong: CUTOUT_MAX });
    }
  }

  console.log("=== kb-v3 armor / items ===");
  for (const sub of ["armor", "items"]) {
    const dir = path.join(ASSETS, "kb-v3", sub);
    for (const f of walk(dir, (p, name) => /\.png$/i.test(name))) {
      await toWebp(f, { quality: ICON_Q, alpha: true, maxLong: ICON_MAX });
    }
  }

  console.log("=== mode backgrounds ===");
  for (const name of ["raid-lair-bg.jpg", "dungeon-crypt-bg.jpg", "guild-siege-bg.jpg"]) {
    await toWebp(path.join(ASSETS, "modes", name), {
      quality: OPAQUE_Q,
      alpha: false,
      maxLong: OPAQUE_MAX,
    });
  }

  console.log("=== large root / feature PNGs ===");
  const rootHeavy = [
    "trade-square.png",
    "battle-frontiers.png",
    "craft-altar-art.png",
    "character-office.png",
    "character-page.png",
    "character-desk.png",
    "nursery/altar.png",
    "dojo/arena-full.png",
    "attack-cards/chrome/attack_card_chrome.png",
    "pvp-battles/load-bg.png",
    "pvp-battles/teams-bg.png",
    "pvp-battles/fight-bg.png",
    "pvp-battles/victory-bg.png",
  ];
  for (const relPath of rootHeavy) {
    const abs = path.join(ASSETS, relPath);
    if (!fs.existsSync(abs)) continue;
    const alpha = !/bg|arena|frontiers|square|office|page|desk|altar/i.test(path.basename(relPath));
    await toWebp(abs, {
      quality: alpha ? ICON_Q : OPAQUE_Q,
      alpha,
      maxLong: alpha ? ICON_MAX : OPAQUE_MAX,
    });
  }

  // login-bg.png is already webp; ensure HTML/JS refs get rewritten if any leftover
  const loginPng = path.join(ASSETS, "login-bg.png");
  const loginWebp = path.join(ASSETS, "login-bg.webp");
  if (fs.existsSync(loginWebp)) {
    rewrites.push({ from: "/stitch-assets/login-bg.png", to: "/stitch-assets/login-bg.webp" });
  }
  if (fs.existsSync(loginPng)) {
    await toWebp(loginPng, { quality: OPAQUE_Q, alpha: false, maxLong: OPAQUE_MAX });
  }

  console.log("=== rewrite refs ===");
  // Deduplicate rewrites
  const seen = new Set();
  const uniq = [];
  for (const r of rewrites) {
    const k = `${r.from}=>${r.to}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(r);
  }
  rewrites.length = 0;
  rewrites.push(...uniq);
  rewritePublicTree();

  const summaryPath = path.join(__dirname, "optimize-heavy-rasters.report.json");
  fs.writeFileSync(summaryPath, JSON.stringify({ report, rewrites }, null, 2));
  const done = report.filter((r) => r.beforeKb != null && r.afterKb != null);
  const before = done.reduce((s, r) => s + r.beforeKb, 0);
  const after = done.reduce((s, r) => s + r.afterKb, 0);
  console.log(`\nconverted ${done.length} files: ${before} → ${after} KB`);
  console.log(`report → ${summaryPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
