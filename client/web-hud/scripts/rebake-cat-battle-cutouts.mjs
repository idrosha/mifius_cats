/**
 * Rebake cat-heroes/battle/*.webp: white-studio plates → true RGBA cutouts.
 * 1) Flood-fill studio white from edges (preserve white fur sealed by non-white outline).
 * 2) Punch flat near-white interior holes (leftover studio BG between limbs / in gaps).
 * 3) Soften / decontaminate fringe so white halos don't read as plates in fight HUD.
 *
 * Usage: node scripts/rebake-cat-battle-cutouts.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BATTLE = path.resolve(__dirname, "../public/stitch-assets/cat-heroes/battle");
const BACKUP = path.join(BATTLE, "_pre_rgba");

const WHITE_MIN = 232;
const WHITE_SOFT = 210;
/** Interior hole: flat studio remnant (not textured fur). */
const HOLE_MEAN_MIN = 242;
const HOLE_VAR_MAX = 45;
const HOLE_MIN_PX = 60;

function isStudioWhite(r, g, b) {
  return r >= WHITE_MIN && g >= WHITE_MIN && b >= WHITE_MIN;
}

function softAlpha(r, g, b) {
  const m = Math.min(r, g, b);
  if (m >= WHITE_MIN) return 0;
  if (m <= WHITE_SOFT) return 255;
  const t = (m - WHITE_SOFT) / (WHITE_MIN - WHITE_SOFT);
  return Math.round(255 * (1 - t));
}

function floodMask(data, W, H) {
  const bg = new Uint8Array(W * H);
  const stack = [];
  const visit = (x, y) => {
    const i = y * W + x;
    if (bg[i]) return;
    const o = i * 4;
    if (!isStudioWhite(data[o], data[o + 1], data[o + 2])) return;
    bg[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < W; x++) {
    visit(x, 0);
    visit(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    visit(0, y);
    visit(W - 1, y);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W;
    const y = (i / W) | 0;
    if (x > 0) visit(x - 1, y);
    if (x < W - 1) visit(x + 1, y);
    if (y > 0) visit(x, y - 1);
    if (y < H - 1) visit(x, y + 1);
  }
  return bg;
}

/** Clear sealed flat-white blobs (studio BG trapped between limbs). */
function clearFlatInteriorHoles(data, W, H, bg) {
  const seen = new Uint8Array(W * H);
  let cleared = 0;
  let blobs = 0;
  const nearWhite = (o) => {
    const a = data[o + 3];
    if (a <= 40) return false;
    return data[o] >= 228 && data[o + 1] >= 228 && data[o + 2] >= 228;
  };

  for (let i = 0; i < W * H; i++) {
    if (seen[i] || bg[i] || !nearWhite(i * 4)) continue;
    const q = [i];
    const members = [];
    seen[i] = 1;
    let edge = false;
    let sum = 0;
    let sum2 = 0;
    while (q.length) {
      const p = q.pop();
      members.push(p);
      const x = p % W;
      const y = (p / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) edge = true;
      const o = p * 4;
      const v = data[o];
      sum += v;
      sum2 += v * v;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (seen[ni] || bg[ni] || !nearWhite(ni * 4)) continue;
        seen[ni] = 1;
        q.push(ni);
      }
    }
    const n = members.length;
    const mean = sum / n;
    const vr = sum2 / n - mean * mean;
    if (edge || n < HOLE_MIN_PX || mean < HOLE_MEAN_MIN || vr > HOLE_VAR_MAX) continue;
    blobs++;
    for (const p of members) {
      bg[p] = 1;
      const o = p * 4;
      data[o] = 0;
      data[o + 1] = 0;
      data[o + 2] = 0;
      data[o + 3] = 0;
      cleared++;
    }
  }
  return { cleared, blobs };
}

async function rebakeOne(file) {
  const src = path.join(BATTLE, file);
  fs.mkdirSync(BACKUP, { recursive: true });
  const bak = path.join(BACKUP, file);
  // Prefer existing opaque backup; else snapshot current before rewrite.
  if (!fs.existsSync(bak)) fs.copyFileSync(src, bak);

  const { data, info } = await sharp(bak)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const bg = floodMask(data, W, H);
  const holes = clearFlatInteriorHoles(data, W, H, bg);

  let cleared = 0;
  let soft = 0;
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    let r = data[o];
    let g = data[o + 1];
    let b = data[o + 2];
    if (bg[i]) {
      out[o] = 0;
      out[o + 1] = 0;
      out[o + 2] = 0;
      out[o + 3] = 0;
      cleared++;
      continue;
    }
    const x = i % W;
    const y = (i / W) | 0;
    let touch = 0;
    if (x > 0 && bg[i - 1]) touch++;
    if (x < W - 1 && bg[i + 1]) touch++;
    if (y > 0 && bg[i - W]) touch++;
    if (y < H - 1 && bg[i + W]) touch++;
    // Second-ring fringe: also soften if diagonal/near bg.
    let near = touch;
    if (x > 0 && y > 0 && bg[i - W - 1]) near++;
    if (x < W - 1 && y > 0 && bg[i - W + 1]) near++;
    if (x > 0 && y < H - 1 && bg[i + W - 1]) near++;
    if (x < W - 1 && y < H - 1 && bg[i + W + 1]) near++;
    let a = 255;
    const m = Math.min(r, g, b);
    if ((touch || near) && m > WHITE_SOFT) {
      const t = Math.min(1, (m - WHITE_SOFT) / (WHITE_MIN - WHITE_SOFT));
      const strength = touch ? 0.95 : 0.7;
      a = Math.round(255 * (1 - t * strength));
      const lift = t * (touch ? 0.65 : 0.45);
      const boost = 1 + t * 0.4;
      r = Math.min(255, Math.max(0, Math.round((r - 255 * lift) * boost)));
      g = Math.min(255, Math.max(0, Math.round((g - 255 * lift) * boost)));
      b = Math.min(255, Math.max(0, Math.round((b - 255 * lift) * boost)));
      soft++;
    } else if (touch) {
      const aSoft = softAlpha(r, g, b);
      if (aSoft < 255) {
        a = aSoft;
        soft++;
      }
    }
    out[o] = r;
    out[o + 1] = g;
    out[o + 2] = b;
    out[o + 3] = a;
  }

  const tmp = src.replace(/\.webp$/i, ".rgba-tmp.webp");
  await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 92, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toFile(tmp);
  try {
    fs.renameSync(tmp, src);
  } catch {
    fs.copyFileSync(tmp, src);
    fs.unlinkSync(tmp);
  }

  const corner = [0, W - 1, (H - 1) * W, H * W - 1].map((i) => out[i * 4 + 3]);
  const transPct = ((100 * cleared) / (W * H)).toFixed(1);
  console.log(
    `${file}: cleared=${cleared} (${transPct}%) holes=${holes.blobs}/${holes.cleared}px soft=${soft} cornerA=${corner.join(",")}`,
  );
  return { file, cleared, soft, corner, holes };
}

async function main() {
  const files = fs
    .readdirSync(BATTLE)
    .filter((f) => /\.webp$/i.test(f) && !f.startsWith("_") && !f.includes("tmp"));
  if (!files.length) {
    console.error("No battle webp files found");
    process.exit(1);
  }
  console.log(`Rebaking ${files.length} cat battle cutouts → RGBA (holes+fringe)`);
  const report = [];
  for (const f of files) report.push(await rebakeOne(f));
  const bad = report.filter((r) => r.corner.some((a) => a > 0) || r.cleared < 1000);
  const reportPath = path.join(__dirname, "rebake-cat-battle-cutouts.report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ at: new Date().toISOString(), report }, null, 2),
  );
  if (bad.length) {
    console.error("VERIFY FAIL:", bad.map((b) => b.file).join(", "));
    process.exit(2);
  }
  console.log("OK: all corners transparent, backgrounds cleared.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
