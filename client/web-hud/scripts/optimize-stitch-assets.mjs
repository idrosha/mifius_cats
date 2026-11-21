/**
 * Optimize stitch-assets for soft-launch HUD:
 * - Opaque full-bleed BGs → WebP (no alpha), originals → _src/
 * - Attack-card webp → resize to UI×2, recompress
 * - Optional cat-hero lobby PNGs → WebP (alpha kept)
 *
 * Usage: node scripts/optimize-stitch-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");
const ASSETS = path.join(PUBLIC, "stitch-assets");
const REF = path.join(PUBLIC, "stitch-ref", "e608");

/** Practice hand ~20rem → 2× long side ≈ 640. Cap at 640 (battle 24rem still ≥1.6×). */
const CARD_MAX_LONG = 640;
const CARD_WEBP_QUALITY = 78;
const BG_WEBP_QUALITY = 82;
const HERO_WEBP_QUALITY = 85;
const HERO_MAX_LONG = 1024;

const report = [];

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function kb(n) {
  return Math.round(n / 1024);
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

async function convertOpaqueBg(absPng, { quality = BG_WEBP_QUALITY } = {}) {
  if (!fs.existsSync(absPng)) {
    report.push({ skip: absPng, reason: "missing" });
    return null;
  }
  const before = fs.statSync(absPng).size;
  const meta = await sharp(absPng).metadata();
  const outWebp = absPng.replace(/\.png$/i, ".webp");
  await sharp(absPng)
    .rotate()
    .webp({ quality, alphaQuality: 0, effort: 6, smartSubsample: true })
    .toFile(outWebp);
  const after = fs.statSync(outWebp).size;
  const src = await moveToSrc(absPng);
  const row = {
    kind: "bg",
    file: path.relative(PUBLIC, outWebp).replace(/\\/g, "/"),
    wh: `${meta.width}x${meta.height}`,
    beforeKb: kb(before),
    afterKb: kb(after),
    src: path.relative(PUBLIC, src).replace(/\\/g, "/"),
  };
  report.push(row);
  return row;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function writeFileRetry(dest, buf, attempts = 8) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      try {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
      } catch {
        /* dest may be locked — try overwrite next */
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

async function recompressCard(absWebp) {
  // Read into memory first so sharp never keeps a Windows file lock on absWebp.
  const input = fs.readFileSync(absWebp);
  const before = input.length;
  const meta = await sharp(input, { failOn: "none" }).metadata();
  const long = Math.max(meta.width || 0, meta.height || 0);
  let pipeline = sharp(input, { failOn: "none" }).rotate();
  if (long > CARD_MAX_LONG) {
    const landscape = (meta.width || 0) >= (meta.height || 0);
    pipeline = landscape
      ? pipeline.resize({ width: CARD_MAX_LONG, withoutEnlargement: true })
      : pipeline.resize({ height: CARD_MAX_LONG, withoutEnlargement: true });
  }
  const buf = await pipeline
    .webp({ quality: CARD_WEBP_QUALITY, alphaQuality: 90, effort: 6, smartSubsample: true })
    .toBuffer();
  const after = buf.length;
  const whAfterGuess =
    long > CARD_MAX_LONG
      ? meta.width >= meta.height
        ? `${CARD_MAX_LONG}x${Math.round((meta.height * CARD_MAX_LONG) / meta.width)}`
        : `${Math.round((meta.width * CARD_MAX_LONG) / meta.height)}x${CARD_MAX_LONG}`
      : `${meta.width}x${meta.height}`;

  if (after < before || long > CARD_MAX_LONG) {
    const srcDir = path.join(path.dirname(absWebp), "_src");
    ensureDir(srcDir);
    const bak = path.join(srcDir, path.basename(absWebp));
    if (!fs.existsSync(bak)) fs.writeFileSync(bak, input);
    await writeFileRetry(absWebp, buf);
  }
  const finalSize = fs.existsSync(absWebp) ? fs.statSync(absWebp).size : after;
  let whAfter = whAfterGuess;
  try {
    const meta2 = await sharp(absWebp).metadata();
    whAfter = `${meta2.width}x${meta2.height}`;
  } catch {
    /* keep guess */
  }
  const row = {
    kind: "card",
    file: path.relative(PUBLIC, absWebp).replace(/\\/g, "/"),
    whBefore: `${meta.width}x${meta.height}`,
    whAfter,
    beforeKb: kb(before),
    afterKb: kb(finalSize),
  };
  report.push(row);
  return row;
}

async function convertHeroPng(absPng) {
  if (!fs.existsSync(absPng)) return null;
  const before = fs.statSync(absPng).size;
  const meta = await sharp(absPng).metadata();
  const long = Math.max(meta.width || 0, meta.height || 0);
  let pipeline = sharp(absPng).rotate();
  if (long > HERO_MAX_LONG) {
    const landscape = (meta.width || 0) >= (meta.height || 0);
    pipeline = landscape
      ? pipeline.resize({ width: HERO_MAX_LONG, withoutEnlargement: true })
      : pipeline.resize({ height: HERO_MAX_LONG, withoutEnlargement: true });
  }
  const outWebp = absPng.replace(/\.png$/i, ".webp");
  await pipeline
    .webp({ quality: HERO_WEBP_QUALITY, alphaQuality: 90, effort: 6 })
    .toFile(outWebp);
  const after = fs.statSync(outWebp).size;
  const src = await moveToSrc(absPng);
  const row = {
    kind: "hero",
    file: path.relative(PUBLIC, outWebp).replace(/\\/g, "/"),
    wh: `${meta.width}x${meta.height}`,
    beforeKb: kb(before),
    afterKb: kb(after),
    src: path.relative(PUBLIC, src).replace(/\\/g, "/"),
  };
  report.push(row);
  return row;
}

function walk(dir, pred) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "_src" || e.name === "illust" || e.name === "node_modules") continue;
      out.push(...walk(p, pred));
    } else if (pred(p, e.name)) out.push(p);
  }
  return out;
}

const BG_LIST = [
  path.join(ASSETS, "login-bg.png"),
  path.join(ASSETS, "login-hero.png"),
  path.join(ASSETS, "yard", "map-bg.png"),
  path.join(ASSETS, "yard", "meowkara-mines-bg.png"),
  path.join(ASSETS, "pve-victory", "bg.png"),
  path.join(ASSETS, "dojo", "practice-load-arena.png"),
  path.join(ASSETS, "pvp-load-arena.png"),
  path.join(ASSETS, "pvp-load-design.png"),
  path.join(REF, "arena_dojo.png"),
  path.join(REF, "victory_hall.png"),
  path.join(REF, "arena_interior.png"),
];

async function main() {
  console.log("=== backgrounds ===");
  for (const f of BG_LIST) {
    const r = await convertOpaqueBg(f);
    if (r) console.log(`${r.beforeKb}→${r.afterKb} KB  ${r.file}`);
  }

  console.log("=== attack cards ===");
  const cards = walk(path.join(ASSETS, "attack-cards"), (p, name) =>
    name.endsWith(".webp") && !p.includes(`${path.sep}illust${path.sep}`)
  );
  let cardBefore = 0;
  let cardAfter = 0;
  for (const f of cards) {
    const r = await recompressCard(f);
    cardBefore += r.beforeKb;
    cardAfter += r.afterKb;
  }
  console.log(`cards: ${cards.length} files, ${cardBefore}→${cardAfter} KB`);

  console.log("=== cat-heroes lobby PNG ===");
  const heroes = walk(path.join(ASSETS, "cat-heroes"), (p, name) => {
    if (!name.endsWith(".png")) return false;
    // skip already-webp battle dir and nested
    return path.dirname(p) === path.join(ASSETS, "cat-heroes");
  });
  for (const f of heroes) {
    const r = await convertHeroPng(f);
    if (r) console.log(`${r.beforeKb}→${r.afterKb} KB  ${r.file}`);
  }

  // Practice dummy battle cutouts (heavy PNG used in fight)
  console.log("=== dojo battle dummies ===");
  for (const name of [
    "dummy-oak-knight.png",
    "dummy-straw-berserk.png",
    "dummy-stone-totem.png",
  ]) {
    const f = path.join(ASSETS, "dojo", "battle", name);
    if (!fs.existsSync(f)) continue;
    const before = fs.statSync(f).size;
    const meta = await sharp(f).metadata();
    const out = f.replace(/\.png$/i, ".webp");
    let pipeline = sharp(f).rotate();
    const long = Math.max(meta.width || 0, meta.height || 0);
    if (long > HERO_MAX_LONG) {
      pipeline = pipeline.resize({
        height: HERO_MAX_LONG,
        withoutEnlargement: true,
      });
    }
    await pipeline.webp({ quality: HERO_WEBP_QUALITY, alphaQuality: 90, effort: 6 }).toFile(out);
    const after = fs.statSync(out).size;
    await moveToSrc(f);
    const row = {
      kind: "dummy",
      file: path.relative(PUBLIC, out).replace(/\\/g, "/"),
      beforeKb: kb(before),
      afterKb: kb(after),
    };
    report.push(row);
    console.log(`${row.beforeKb}→${row.afterKb} KB  ${row.file}`);
  }

  const summaryPath = path.join(__dirname, "optimize-stitch-assets.report.json");
  fs.writeFileSync(summaryPath, JSON.stringify(report, null, 2));
  console.log(`\nreport → ${summaryPath}`);

  const bgs = report.filter((r) => r.kind === "bg");
  const bgBefore = bgs.reduce((s, r) => s + r.beforeKb, 0);
  const bgAfter = bgs.reduce((s, r) => s + r.afterKb, 0);
  console.log(`\nBG total: ${bgBefore} → ${bgAfter} KB (×${(bgBefore / Math.max(bgAfter, 1)).toFixed(1)})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
