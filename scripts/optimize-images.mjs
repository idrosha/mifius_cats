#!/usr/bin/env node
/**
 * Reusable asset optimization pipeline for Mythfel Web HUD.
 * - Converts PNG/JPG assets in client/web-hud/public/ to right-sized WebP
 * - Downscales oversized UI icons (e.g., 768x768 kb-v3 icons → 256x256)
 * - Generates 320px WebP thumbnails for hero portraits (stitch-assets/cat-heroes/thumbs/)
 * - Archives replaced originals into _src/ (ignored by server & Dockerfile)
 * - Rewrites all references in public/ HTML, JS, CSS, JSON
 *
 * Usage:
 *   node scripts/optimize-images.mjs [--dry-run] [--no-rewrite]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const PUBLIC = path.join(REPO, "client", "web-hud", "public");

const require = createRequire(import.meta.url);
const sharp = require(path.join(REPO, "client", "web-hud", "node_modules", "sharp"));
// Single-threaded + no libvips cache avoids native crashes on Windows / Node 24
sharp.concurrency(1);
sharp.cache(false);

const DRY_RUN = process.argv.includes("--dry-run");
const NO_REWRITE = process.argv.includes("--no-rewrite");

const SKIP_DIRS = new Set([
  "_src",
  "_pre_face_left",
  "_pre_opaque",
  "prototypes",
  "_tmp_stitch_pvp",
  "node_modules",
  "thumbs",
  "art-raw",
]);

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function relPub(absPath) {
  return toPosix(path.relative(PUBLIC, absPath));
}

function walk(dir, pred) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      out.push(...walk(path.join(dir, ent.name), pred));
    } else {
      const full = path.join(dir, ent.name);
      if (pred(full, ent.name)) out.push(full);
    }
  }
  return out;
}

function moveToSrc(absPath) {
  const dir = path.dirname(absPath);
  const srcDir = path.join(dir, "_src");
  fs.mkdirSync(srcDir, { recursive: true });
  const dest = path.join(srcDir, path.basename(absPath));
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  fs.renameSync(absPath, dest);
}

/** Choose target max dimension & WebP quality by asset role. */
function profileFor(relPath) {
  const r = relPath.toLowerCase();
  if (
    r.startsWith("barn-icons/") ||
    r.startsWith("stitch-assets/barn-icons/") ||
    r.startsWith("stitch-assets/hero-icons/") ||
    r.includes("pass-hearth/icon-") ||
    r.includes("token-icon")
  ) {
    return { maxLong: 224, quality: 84, alphaQuality: 94, kind: "icon" };
  }
  if (r.startsWith("gear-sets/")) {
    return { maxLong: 256, quality: 84, alphaQuality: 94, kind: "gear" };
  }
  if (r.startsWith("stitch-assets/kb-v3/")) {
    return { maxLong: 256, quality: 84, alphaQuality: 94, kind: "kb-icon" };
  }
  if (r.startsWith("stitch-assets/nursery/cribs/") || r.startsWith("stitch-assets/tavern/")) {
    return { maxLong: 960, quality: 80, alphaQuality: 90, kind: "panel" };
  }
  if (r.startsWith("stitch-ref/")) {
    return { maxLong: 1280, quality: 80, alphaQuality: 90, kind: "ref" };
  }
  // Hashed stitch-assets/*.jpg (cards/thumbnails/tiles)
  if (/^stitch-assets\/[0-9a-f]{10,}\.(?:jpe?g|png)$/i.test(r)) {
    return { maxLong: 960, quality: 80, alphaQuality: 90, kind: "stitch-card" };
  }
  return { maxLong: 1280, quality: 82, alphaQuality: 92, kind: "general" };
}

async function convertToWebp(absIn, profile) {
  const before = fs.statSync(absIn).size;
  const outWebp = absIn.replace(/\.(png|jpe?g)$/i, ".webp");
  const relIn = "/" + relPub(absIn);
  const relOut = "/" + relPub(outWebp);

  const meta = await sharp(absIn, { failOn: "none" }).metadata();
  const long = Math.max(meta.width || 0, meta.height || 0);
  let pipe = sharp(absIn, { failOn: "none" }).rotate();
  if (profile.maxLong && long > profile.maxLong) {
    if ((meta.width || 0) >= (meta.height || 0)) {
      pipe = pipe.resize({ width: profile.maxLong, withoutEnlargement: true });
    } else {
      pipe = pipe.resize({ height: profile.maxLong, withoutEnlargement: true });
    }
  }
  const hasAlpha = Boolean(meta.hasAlpha);
  const buf = await pipe
    .webp({
      quality: profile.quality,
      alphaQuality: hasAlpha ? profile.alphaQuality : 0,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();

  if (!DRY_RUN) {
    fs.writeFileSync(outWebp, buf);
    moveToSrc(absIn);
  }
  return { from: relIn, to: relOut, before, after: buf.length, kind: profile.kind };
}

async function downscaleOversizedWebp(absPath, maxLong, quality = 84, alphaQuality = 94) {
  const before = fs.statSync(absPath).size;
  const meta = await sharp(absPath, { failOn: "none" }).metadata();
  const long = Math.max(meta.width || 0, meta.height || 0);
  if (long <= maxLong) return null;

  let pipe = sharp(absPath, { failOn: "none" }).rotate();
  if ((meta.width || 0) >= (meta.height || 0)) {
    pipe = pipe.resize({ width: maxLong, withoutEnlargement: true });
  } else {
    pipe = pipe.resize({ height: maxLong, withoutEnlargement: true });
  }
  const buf = await pipe
    .webp({
      quality,
      alphaQuality: meta.hasAlpha ? alphaQuality : 0,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();

  if (buf.length >= before) return null;
  if (!DRY_RUN) {
    fs.writeFileSync(absPath, buf);
  }
  return { file: relPub(absPath), before, after: buf.length };
}

async function generateHeroThumbs() {
  const heroDir = path.join(PUBLIC, "stitch-assets", "cat-heroes");
  const thumbDir = path.join(heroDir, "thumbs");
  if (!fs.existsSync(heroDir)) return { count: 0, totalBytes: 0 };
  if (!DRY_RUN) fs.mkdirSync(thumbDir, { recursive: true });

  let count = 0;
  let totalBytes = 0;
  for (const name of fs.readdirSync(heroDir)) {
    if (!name.endsWith(".webp")) continue;
    const src = path.join(heroDir, name);
    if (!fs.statSync(src).isFile()) continue;
    const dest = path.join(thumbDir, name);
    if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) {
      totalBytes += fs.statSync(dest).size;
      count++;
      continue;
    }
    const buf = await sharp(src, { failOn: "none" })
      .resize({ width: 320, withoutEnlargement: true })
      .webp({ quality: 80, alphaQuality: 90, effort: 6, smartSubsample: true })
      .toBuffer();
    if (!DRY_RUN) fs.writeFileSync(dest, buf);
    totalBytes += buf.length;
    count++;
  }
  return { count, totalBytes };
}

function rewriteReferences(rewrites) {
  if (NO_REWRITE || DRY_RUN || !rewrites.length) return { filesTouched: 0, replacements: 0 };

  const targets = [];
  for (const name of [
    "index.html",
    "app.js",
    "styles.css",
    "codex-topics.js",
    "gear-catalog-seed.js",
    "gear-stub.json",
    "breeding-stub.json",
    "collection-stub.json",
  ]) {
    const p = path.join(PUBLIC, name);
    if (fs.existsSync(p)) targets.push(p);
  }
  const stitchDir = path.join(PUBLIC, "stitch");
  if (fs.existsSync(stitchDir)) {
    for (const fn of fs.readdirSync(stitchDir)) {
      if (/\.(html|js|css)$/i.test(fn)) targets.push(path.join(stitchDir, fn));
    }
  }

  // Sort longest paths first to avoid partial collisions
  const pairs = [...new Map(rewrites.map((r) => [r.from, r])).values()].sort(
    (a, b) => b.from.length - a.from.length,
  );

  let filesTouched = 0;
  let replacements = 0;
  for (const file of targets) {
    let text = fs.readFileSync(file, "utf8");
    const orig = text;
    for (const { from, to } of pairs) {
      if (text.includes(from)) {
        const parts = text.split(from);
        replacements += parts.length - 1;
        text = parts.join(to);
      }
      // Also handle relative paths without leading slash (e.g. gear-sets/...)
      const fromNoSlash = from.slice(1);
      const toNoSlash = to.slice(1);
      if (text.includes(fromNoSlash)) {
        const parts = text.split(fromNoSlash);
        replacements += parts.length - 1;
        text = parts.join(toNoSlash);
      }
    }
    if (text !== orig) {
      fs.writeFileSync(file, text);
      filesTouched++;
    }
  }
  return { filesTouched, replacements };
}

async function main() {
  console.log(`Mythfel Image Optimizer ${DRY_RUN ? "(DRY RUN)" : ""}`);
  const rasters = walk(PUBLIC, (full, name) => /\.(png|jpe?g)$/i.test(name));
  // Also include gear-sets/thumbs (skipped by default SKIP_DIRS "thumbs")
  const gearThumbsDir = path.join(PUBLIC, "gear-sets", "thumbs");
  if (fs.existsSync(gearThumbsDir)) {
    for (const fn of fs.readdirSync(gearThumbsDir)) {
      if (/\.(png|jpe?g)$/i.test(fn)) {
        rasters.push(path.join(gearThumbsDir, fn));
      }
    }
  }

  console.log(`Found ${rasters.length} PNG/JPG rasters in client/web-hud/public/`);
  const rewrites = [];
  let totalBefore = 0;
  let totalAfter = 0;
  let converted = 0;

  for (const abs of rasters) {
    try {
      const rp = relPub(abs);
      const profile = profileFor(rp);
      const res = await convertToWebp(abs, profile);
      rewrites.push({ from: res.from, to: res.to });
      totalBefore += res.before;
      totalAfter += res.after;
      converted++;
    } catch (err) {
      console.warn("skip", relPub(abs), err.message);
    }
  }
  console.log(
    `Converted ${converted} PNG/JPG → WebP: ${(totalBefore / 1048576).toFixed(2)} MB → ${(totalAfter / 1048576).toFixed(2)} MB (-${totalBefore ? (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1) : 0}%)`,
  );

  // Downscale oversized kb-v3 WebP icons (768x768 → 256x256)
  let kbBefore = 0;
  let kbAfter = 0;
  let kbCount = 0;
  const kbDir = path.join(PUBLIC, "stitch-assets", "kb-v3");
  for (const abs of walk(kbDir, (full, name) => /\.webp$/i.test(name))) {
    const r = await downscaleOversizedWebp(abs, 256, 84, 94);
    if (r) {
      kbBefore += r.before;
      kbAfter += r.after;
      kbCount++;
    }
  }
  if (kbCount) {
    console.log(
      `Downscaled ${kbCount} kb-v3 icons: ${(kbBefore / 1024).toFixed(0)} KB → ${(kbAfter / 1024).toFixed(0)} KB`,
    );
  }

  // Optimize hero attack cards (540x720 ~115 KB → 420x560 WebP ~32-40 KB, crisp text)
  let acBefore = 0;
  let acAfter = 0;
  let acCount = 0;
  const acDir = path.join(PUBLIC, "stitch-assets", "attack-cards");
  if (fs.existsSync(acDir)) {
    for (const abs of walk(acDir, (full, name) => /\.webp$/i.test(name))) {
      const rel = relPub(abs);
      if (rel.includes("/chrome/") || rel.endsWith("/card-back.webp")) continue;
      const r = await downscaleOversizedWebp(abs, 560, 80, 90);
      if (r) {
        acBefore += r.before;
        acAfter += r.after;
        acCount++;
      }
    }
  }
  if (acCount) {
    console.log(
      `Optimized ${acCount} hero attack cards: ${(acBefore / 1048576).toFixed(2)} MB → ${(acAfter / 1048576).toFixed(2)} MB (-${(((acBefore - acAfter) / acBefore) * 100).toFixed(1)}%)`,
    );
  }

  // Generate 320px WebP thumbnails for cat-heroes
  const thumbs = await generateHeroThumbs();
  console.log(
    `Hero thumbnails (320px): ${thumbs.count} files, ${(thumbs.totalBytes / 1024).toFixed(0)} KB total (avg ${thumbs.count ? (thumbs.totalBytes / thumbs.count / 1024).toFixed(1) : 0} KB)`,
  );

  // Rewrite references
  const rw = rewriteReferences(rewrites);
  console.log(`Rewrote ${rw.replacements} references across ${rw.filesTouched} files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
