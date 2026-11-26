import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "../client/web-hud/node_modules/sharp/lib/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CARDS_JSON = path.join(ROOT, "client/web-hud/public/data/card-effects.json");
const CHROME_DIR = path.join(ROOT, "client/web-hud/public/stitch-assets/attack-cards/chrome/elven");
const DEFAULT_ART_DIR = path.join(ROOT, "client/web-hud/public/stitch-assets/attack-cards/art-raw");
const OUT_ROOT = path.join(ROOT, "client/web-hud/public/stitch-assets/attack-cards");

// Native elven chrome resolution is 675x900 (3:4). Output at 540x720 for crisp HUD text + compact webp.
const FRAME_W = 675;
const FRAME_H = 900;
const OUT_W = 540;
const OUT_H = 720;

const ROLE_RU = {
  tank: "Танк",
  fighter: "Боец",
  assassin: "Убийца",
  ranger: "Лучник",
  mage: "Маг",
  support: "Поддержка",
};

const ICON_KEYS = ["buff", "debuff", "x2", "crit", "pierce", "heal", "shield"];

/**
 * Per-element slot geometry measured directly on the approved 675x900 elven frames:
 * - card_frame_fire.webp
 * - card_frame_water.webp
 * - card_frame_wind.webp
 */
const FRAME_SPEC = {
  fire: {
    file: "card_frame_fire.webp",
    floodSeed: [337, 360],
    floodTol: 26,
    classBox: { x: 218, y: 53, w: 239, h: 41, rx: 8, fillTop: "#381b10", fillBot: "#210e07", textFill: "#f6dc9f", shadow: "#000000" },
    costGem: { cx: 587, cy: 78, r: 27, gradTop: "#b82e0d", gradMid: "#6b1204", gradBot: "#2d0702", textFill: "#fff5d8", stroke: "#2b0802" },
    titleBox: { x: 212, y: 623, w: 251, h: 28, rx: 6, fillTop: "#2c160e", fillBot: "#1b0c07", textFill: "#f6dc9f", shadow: "#000000" },
    descBox: { x: 118, y: 672, w: 439, h: 83, rx: 6, fill: "#1f1611", textFill: "#f4e6cc", shadow: "none" },
    badges: {
      centers: [90, 172, 255, 337.5, 420, 502, 584],
      cy: 803.5,
      w: 72,
      h: 65,
      dimFill: "rgba(12, 6, 4, 0.56)",
      glowColor: "#ffad33",
      glowInner: "#ffe799",
    },
  },
  water: {
    file: "card_frame_water.webp",
    floodSeed: [337, 360],
    floodTol: 26,
    classBox: { x: 228, y: 80, w: 219, h: 40, rx: 6, fillTop: "#27333d", fillBot: "#182129", textFill: "#ebf6ff", shadow: "#061018" },
    costGem: { cx: 568, cy: 105, r: 25, gradTop: "#7ad0ff", gradMid: "#2a7ec0", gradBot: "#12426e", textFill: "#ffffff", stroke: "#0c2b48" },
    titleBox: { x: 196, y: 590, w: 283, h: 28, rx: 4, fillTop: "#222e38", fillBot: "#162028", textFill: "#ebf6ff", shadow: "#061018" },
    descBox: { x: 120, y: 632, w: 435, h: 78, rx: 6, fill: "#1d262e", textFill: "#e8f2fa", shadow: "none" },
    badges: {
      centers: [111, 186, 262, 337.5, 413, 488, 564],
      cy: 770,
      w: 66,
      h: 76,
      dimFill: "rgba(8, 16, 26, 0.58)",
      glowColor: "#54d0ff",
      glowInner: "#d4f5ff",
    },
  },
  wind: {
    file: "card_frame_wind.webp",
    floodSeed: [337, 360],
    floodTol: 26,
    classBox: { x: 218, y: 53, w: 239, h: 41, rx: 8, fillTop: "#b1afa4", fillBot: "#939489", textFill: "#ffffff", shadow: "#1b2b23" },
    costGem: { cx: 587, cy: 78, r: 26, gradTop: "#95f2cc", gradMid: "#3da17f", gradBot: "#1d5e49", textFill: "#ffffff", stroke: "#133d2f" },
    titleBox: { x: 212, y: 623, w: 251, h: 28, rx: 6, fillTop: "#a0a095", fillBot: "#878980", textFill: "#ffffff", shadow: "#1b2b23" },
    descBox: { x: 118, y: 672, w: 439, h: 83, rx: 6, fill: "#d5d0c4", textFill: "#17221c", shadow: "none" },
    badges: {
      centers: [90, 172, 255, 337.5, 420, 502, 584],
      cy: 803.5,
      w: 72,
      h: 65,
      dimFill: "rgba(18, 28, 24, 0.52)",
      glowColor: "#4ef5ab",
      glowInner: "#d4ffec",
    },
  },
};

function escXml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, maxChars) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Prepare a frame buffer with its grey placeholder art window knocked out to alpha=0
 * via flood-fill + 2px dilation so the ornate elven corners cleanly overlay the illustration.
 */
async function prepareElementFrame(element) {
  const spec = FRAME_SPEC[element];
  const framePath = path.join(CHROME_DIR, spec.file);
  const { data, info } = await sharp(framePath)
    .resize(FRAME_W, FRAME_H, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;
  const [sx, sy] = spec.floodSeed;
  const tol = spec.floodTol;
  const seedIdx = (sy * W + sx) * 4;
  const r0 = data[seedIdx];
  const g0 = data[seedIdx + 1];
  const b0 = data[seedIdx + 2];

  const mask = new Uint8Array(W * H);
  const stack = [sx, sy];
  mask[sy * W + sx] = 1;

  let minX = W, maxX = 0, minY = H, maxY = 0;
  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      const vi = ny * W + nx;
      if (mask[vi]) continue;
      const pi = vi * 4;
      if (
        Math.abs(data[pi] - r0) <= tol &&
        Math.abs(data[pi + 1] - g0) <= tol &&
        Math.abs(data[pi + 2] - b0) <= tol
      ) {
        mask[vi] = 1;
        stack.push(nx, ny);
      }
    }
  }

  // Dilate mask by 2px to eliminate any anti-aliased grey halo along the inner bevel
  const dilated = new Uint8Array(mask);
  for (let y = Math.max(1, minY - 2); y <= Math.min(H - 2, maxY + 2); y++) {
    for (let x = Math.max(1, minX - 2); x <= Math.min(W - 2, maxX + 2); x++) {
      const vi = y * W + x;
      if (mask[vi]) continue;
      if (
        mask[vi - 1] || mask[vi + 1] || mask[vi - W] || mask[vi + W] ||
        mask[vi - W - 1] || mask[vi - W + 1] || mask[vi + W - 1] || mask[vi + W + 1]
      ) {
        dilated[vi] = 1;
      }
    }
  }

  // Knock out art window pixels to transparent
  for (let i = 0; i < W * H; i++) {
    if (dilated[i]) {
      data[i * 4 + 3] = 0;
    }
  }

  const framePng = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();

  // Pad art box by 6px on each side so the illustration sits slightly behind the ornate frame bevel
  const pad = 6;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const right = Math.min(W - 1, maxX + pad);
  const bottom = Math.min(H - 1, maxY + pad);
  const artRect = {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  };

  return { spec, framePng, artRect };
}

function buildTextAndBadgeOverlaySvg(card, role, spec) {
  const roleLabel = (ROLE_RU[role] || role).toUpperCase();
  const cost = String(card.cost ?? 1);
  const title = String(card.title_ru || "").trim();
  const effect = String(card.effect_ru || "").trim();
  const icons = card.icons || {};

  const cb = spec.classBox;
  const cg = spec.costGem;
  const tb = spec.titleBox;
  const db = spec.descBox;
  const bg = spec.badges;

  // Auto-size class label so "ПОДДЕРЖКА" fits comfortably
  const classFontSize = roleLabel.length >= 9 ? 21 : roleLabel.length >= 7 ? 24 : 27;
  const classCenterX = cb.x + cb.w / 2;
  const classTextY = cb.y + cb.h / 2 + Math.round(classFontSize * 0.36);

  // Auto-size title so 18-char titles fit cleanly without clipping
  const titleFontSize = title.length >= 17 ? 18 : title.length >= 14 ? 20 : 22;
  const titleCenterX = tb.x + tb.w / 2;
  const titleTextY = tb.y + tb.h / 2 + Math.round(titleFontSize * 0.35);

  // Wrap description cleanly into 1-3 lines
  let lines = wrapText(effect, 32);
  if (lines.length > 3) lines = wrapText(effect, 38);
  lines = lines.slice(0, 3);
  const descFontSize = lines.length >= 3 ? 17.5 : lines.length === 2 ? 19.5 : 21;
  const descLineH = lines.length >= 3 ? 23 : 26;
  const descBlockH = (lines.length - 1) * descLineH;
  const descCenterX = db.x + db.w / 2;
  const descStartY = db.y + db.h / 2 - descBlockH / 2 + Math.round(descFontSize * 0.34);

  const descLinesSvg = lines
    .map(
      (ln, i) =>
        `<text x="${descCenterX}" y="${descStartY + i * descLineH}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${descFontSize}" font-weight="600" fill="${db.textFill}">${escXml(ln)}</text>`,
    )
    .join("\n");

  // Badge dimming (inactive) & elemental glow (active) over the 7 elven bottom badges
  const badgeOverlays = ICON_KEYS.map((key, idx) => {
    const cx = bg.centers[idx];
    const cy = bg.cy;
    const hw = bg.w / 2;
    const hh = bg.h / 2;
    const cut = 10;
    // Octagon matching the elven badge silhouette
    const pts = [
      `${cx - hw + cut},${cy - hh}`,
      `${cx + hw - cut},${cy - hh}`,
      `${cx + hw},${cy - hh + cut}`,
      `${cx + hw},${cy + hh - cut}`,
      `${cx + hw - cut},${cy + hh}`,
      `${cx - hw + cut},${cy + hh}`,
      `${cx - hw},${cy + hh - cut}`,
      `${cx - hw},${cy - hh + cut}`,
    ].join(" ");

    if (icons[key]) {
      return `
        <g filter="url(#badgeGlow)">
          <polygon points="${pts}" fill="none" stroke="${bg.glowColor}" stroke-width="3.6"/>
          <polygon points="${pts}" fill="none" stroke="${bg.glowInner}" stroke-width="1.4" opacity="0.9"/>
        </g>
      `;
    }
    return `<polygon points="${pts}" fill="${bg.dimFill}"/>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_W}" height="${FRAME_H}" viewBox="0 0 ${FRAME_W} ${FRAME_H}">
    <defs>
      <linearGradient id="classBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${cb.fillTop}"/>
        <stop offset="100%" stop-color="${cb.fillBot}"/>
      </linearGradient>
      <linearGradient id="titleBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${tb.fillTop}"/>
        <stop offset="100%" stop-color="${tb.fillBot}"/>
      </linearGradient>
      <radialGradient id="costBg" cx="38%" cy="32%" r="68%">
        <stop offset="0%" stop-color="${cg.gradTop}"/>
        <stop offset="55%" stop-color="${cg.gradMid}"/>
        <stop offset="100%" stop-color="${cg.gradBot}"/>
      </radialGradient>
      <filter id="txtShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="${cb.shadow}" flood-opacity="0.85"/>
      </filter>
      <filter id="badgeGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Cleanly cover placeholder CLASS text and draw Russian class name -->
    <rect x="${cb.x}" y="${cb.y}" width="${cb.w}" height="${cb.h}" rx="${cb.rx}" fill="url(#classBg)"/>
    <text x="${classCenterX}" y="${classTextY}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${classFontSize}" letter-spacing="1.2" fill="${cb.textFill}" filter="url(#txtShadow)">${escXml(roleLabel)}</text>

    <!-- Cleanly cover placeholder cost digit and draw actual AP cost -->
    <circle cx="${cg.cx}" cy="${cg.cy}" r="${cg.r}" fill="url(#costBg)"/>
    <text x="${cg.cx}" y="${cg.cy + 14}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="40" fill="${cg.textFill}" stroke="${cg.stroke}" stroke-width="1.2" paint-order="stroke">${escXml(cost)}</text>

    <!-- Cleanly cover placeholder TITLE text and draw Russian card title -->
    <rect x="${tb.x}" y="${tb.y}" width="${tb.w}" height="${tb.h}" rx="${tb.rx}" fill="url(#titleBg)"/>
    <text x="${titleCenterX}" y="${titleTextY}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${titleFontSize}" letter-spacing="0.4" fill="${tb.textFill}" filter="url(#txtShadow)">${escXml(title)}</text>

    <!-- Cleanly cover placeholder lore text and draw actual Russian effect text -->
    <rect x="${db.x}" y="${db.y}" width="${db.w}" height="${db.h}" rx="${db.rx}" fill="${db.fill}"/>
    ${descLinesSvg}

    <!-- Highlight active effect badges, dim inactive ones -->
    ${badgeOverlays}
  </svg>`;
}

function findArtFile(artDir, role, element, part) {
  const candidates = [
    path.join(artDir, `${role}-${element}`, `${part}.png`),
    path.join(artDir, `${role}-${element}`, `${part}.webp`),
    path.join(artDir, `${role}-${element}`, `${part}.jpg`),
    path.join(artDir, `art_${role}_${element}_${part}.png`),
    path.join(artDir, `art_${role}_${element}_${part}.webp`),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function assembleCard({ cardId, card, role, element, part, frameData, artPath, outPath }) {
  const { spec, framePng, artRect } = frameData;

  // Crop illustration with cover centered on the action
  const artBuf = await sharp(artPath)
    .resize(artRect.width, artRect.height, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  const overlayBuf = await sharp(Buffer.from(buildTextAndBadgeOverlaySvg(card, role, spec)))
    .resize(FRAME_W, FRAME_H, { fit: "fill" })
    .png()
    .toBuffer();

  const composedBuf = await sharp({
    create: {
      width: FRAME_W,
      height: FRAME_H,
      channels: 4,
      background: { r: 14, g: 12, b: 12, alpha: 1 },
    },
  })
    .composite([
      { input: artBuf, left: artRect.left, top: artRect.top },
      { input: framePng, left: 0, top: 0 },
      { input: overlayBuf, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  const outBuf = await sharp(composedBuf)
    .resize(OUT_W, OUT_H, { kernel: "lanczos3" })
    .webp({ quality: 90 })
    .toBuffer();

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.writeFileSync(outPath, outBuf);
      break;
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise((r) => setTimeout(r, 180 * (attempt + 1)));
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  let artDir = DEFAULT_ART_DIR;
  let filterPrefix = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--art-dir" && args[i + 1]) artDir = path.resolve(args[++i]);
    if (args[i] === "--only" && args[i + 1]) filterPrefix = args[++i];
  }

  const frames = {
    fire: await prepareElementFrame("fire"),
    water: await prepareElementFrame("water"),
    wind: await prepareElementFrame("wind"),
  };

  const catalog = JSON.parse(fs.readFileSync(CARDS_JSON, "utf8"));
  const entries = Object.entries(catalog).filter(([id]) => {
    if (!id.startsWith("card_shop_")) return false;
    if (filterPrefix && !id.includes(filterPrefix)) return false;
    return true;
  });

  let ok = 0;
  let missing = 0;
  for (const [cardId, card] of entries) {
    const m = cardId.match(/^card_shop_([a-z]+)_([a-z]+)_(eyes|ears|muzzle|headwear|back|tail)$/);
    if (!m) continue;
    const [, role, element, part] = m;
    const frameData = frames[element];
    if (!frameData) continue;

    const artPath = findArtFile(artDir, role, element, part);
    if (!artPath) {
      missing++;
      continue;
    }

    const outPath = path.join(OUT_ROOT, `${role}-${element}`, `attack_shop_${role}_${element}_${part}.webp`);
    await assembleCard({ cardId, card, role, element, part, frameData, artPath, outPath });
    ok++;
  }

  console.log(`Assembled ${ok}/${entries.length} elven attack cards (missing raw art: ${missing}).`);
  if (missing > 0) {
    console.log(`Drop raw illustrations into: ${artDir}/{role}-{element}/{part}.{png,webp,jpg}`);
  }
}

export { prepareElementFrame, assembleCard, FRAME_SPEC };

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
