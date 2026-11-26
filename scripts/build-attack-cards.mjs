import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "../client/web-hud/node_modules/sharp/lib/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CARDS_JSON = path.join(ROOT, "client/web-hud/public/data/card-effects.json");
const CAT_HEROES_DIR = path.join(ROOT, "client/web-hud/public/stitch-assets/cat-heroes/battle");
const OUT_ROOT = path.join(ROOT, "client/web-hud/public/stitch-assets/attack-cards");

const W = 480;
const H = 640;

const ROLE_RU = {
  tank: "Танк",
  fighter: "Боец",
  assassin: "Убийца",
  ranger: "Лучник",
  mage: "Маг",
  support: "Поддержка",
};

const PALETTE = {
  fire: {
    bgDark: "#160805",
    bgMid: "#3b1208",
    bgGlow: "#ff6a1a",
    frameOuter: "#2b1208",
    frameMetal: "#c98b43",
    frameMetalLight: "#ffd28a",
    frameMetalDark: "#5e3315",
    accent: "#ff5c1c",
    accentBright: "#ffb347",
    gemTop: "#ff4e1a",
    gemBot: "#6b0f05",
    plaqueBg: "#1b0b07",
    textBoxBg: "#120705",
    badgeBg: "#2e1007",
    badgeStroke: "#ff9b3d",
  },
  water: {
    bgDark: "#06111c",
    bgMid: "#0d2a45",
    bgGlow: "#38b6ff",
    frameOuter: "#0a1c2e",
    frameMetal: "#8eb2cc",
    frameMetalLight: "#e0f4ff",
    frameMetalDark: "#2e4d66",
    accent: "#38b6ff",
    accentBright: "#8be0ff",
    gemTop: "#4fc3ff",
    gemBot: "#0c3c6e",
    plaqueBg: "#0a1826",
    textBoxBg: "#07111c",
    badgeBg: "#0c2238",
    badgeStroke: "#6ed2ff",
  },
  wind: {
    bgDark: "#071712",
    bgMid: "#11382c",
    bgGlow: "#3be39b",
    frameOuter: "#0b241c",
    frameMetal: "#88b8a2",
    frameMetalLight: "#d9ffed",
    frameMetalDark: "#2c5443",
    accent: "#2fd68d",
    accentBright: "#8cffc7",
    gemTop: "#42e8a0",
    gemBot: "#0c4f34",
    plaqueBg: "#0b1f18",
    textBoxBg: "#071410",
    badgeBg: "#0d2b20",
    badgeStroke: "#63f0b3",
  },
};

const ICON_META = [
  { key: "buff", label: "BUFF", color: "#ffd257" },
  { key: "debuff", label: "DEBUFF", color: "#c96eff" },
  { key: "x2", label: "2X", color: "#ff8c38" },
  { key: "crit", label: "CRIT", color: "#ff4747" },
  { key: "pierce", label: "PIERCE", color: "#5cd6ff" },
  { key: "heal", label: "HEAL", color: "#4ef08d" },
  { key: "shield", label: "SHIELD", color: "#69b7ff" },
];

function escXml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, maxChars) {
  const words = String(text || "").trim().split(/\s+/);
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

function iconGlyphSvg(key, cx, cy, color) {
  switch (key) {
    case "buff":
      return `
        <path d="M${cx} ${cy - 10} L${cx + 8} ${cy + 2} L${cx + 3} ${cy + 2} L${cx + 3} ${cy + 10} L${cx - 3} ${cy + 10} L${cx - 3} ${cy + 2} L${cx - 8} ${cy + 2} Z" fill="${color}"/>
      `;
    case "debuff":
      return `
        <circle cx="${cx}" cy="${cy - 2}" r="7.5" fill="${color}"/>
        <rect x="${cx - 4}" y="${cy + 4}" width="8" height="4" rx="1.5" fill="${color}"/>
        <circle cx="${cx - 2.7}" cy="${cy - 2.5}" r="1.8" fill="#120912"/>
        <circle cx="${cx + 2.7}" cy="${cy - 2.5}" r="1.8" fill="#120912"/>
      `;
    case "x2":
      return `
        <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="16" fill="${color}">2×</text>
      `;
    case "crit":
      return `
        <polygon points="${cx},${cy - 11} ${cx + 3},${cy - 3} ${cx + 11},${cy} ${cx + 3},${cy + 3} ${cx},${cy + 11} ${cx - 3},${cy + 3} ${cx - 11},${cy} ${cx - 3},${cy - 3}" fill="${color}"/>
      `;
    case "pierce":
      return `
        <line x1="${cx - 9}" y1="${cy + 9}" x2="${cx + 7}" y2="${cy - 7}" stroke="${color}" stroke-width="2.8" stroke-linecap="round"/>
        <polygon points="${cx + 10},${cy - 10} ${cx + 2},${cy - 8} ${cx + 8},${cy - 2}" fill="${color}"/>
      `;
    case "heal":
      return `
        <path d="M${cx} ${cy + 9} C${cx - 11} ${cy + 1} ${cx - 11} ${cy - 9} ${cx - 4.5} ${cy - 9} C${cx - 1.5} ${cy - 9} ${cx} ${cy - 6.5} ${cx} ${cy - 5} C${cx} ${cy - 6.5} ${cx + 1.5} ${cy - 9} ${cx + 4.5} ${cy - 9} C${cx + 11} ${cy - 9} ${cx + 11} ${cy + 1} ${cx} ${cy + 9} Z" fill="${color}"/>
      `;
    case "shield":
      return `
        <path d="M${cx} ${cy - 10} L${cx + 9} ${cy - 6} L${cx + 8} ${cy + 2} C${cx + 7} ${cy + 7} ${cx + 3} ${cy + 10} ${cx} ${cy + 11} C${cx - 3} ${cy + 10} ${cx - 7} ${cy + 7} ${cx - 8} ${cy + 2} L${cx - 9} ${cy - 6} Z" fill="${color}"/>
      `;
    default:
      return "";
  }
}

function buildActionVfxSvg(card, part, pal) {
  const icons = card.icons || {};
  const atk = Number(card.atk || 0);
  const shield = Number(card.shield || 0);
  const isHeal = !!icons.heal;
  const isCrit = !!icons.crit;
  const isX2 = !!icons.x2 || Number(card.hits || 0) > 1;
  const isPierce = !!icons.pierce;
  const isDebuff = !!icons.debuff;
  const isBuff = !!icons.buff;

  let vfx = "";

  // Subtle radial action glow behind/around cat
  vfx += `
    <defs>
      <radialGradient id="actGlow" cx="50%" cy="46%" r="54%">
        <stop offset="0%" stop-color="${pal.bgGlow}" stop-opacity="0.45"/>
        <stop offset="60%" stop-color="${pal.bgMid}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${pal.bgDark}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="388" height="314" fill="url(#actGlow)"/>
  `;

  // Attack slash / strike arc
  if (atk > 0) {
    vfx += `
      <path d="M 38 258 Q 190 95 352 68" fill="none" stroke="${pal.accentBright}" stroke-width="9" stroke-linecap="round" opacity="0.82"/>
      <path d="M 48 262 Q 195 108 350 78" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
    `;
    if (isX2) {
      vfx += `
        <path d="M 52 72 Q 198 158 348 252" fill="none" stroke="${pal.accentBright}" stroke-width="8" stroke-linecap="round" opacity="0.8"/>
        <path d="M 58 78 Q 200 162 344 246" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
      `;
    }
  }

  // Pierce energy spear
  if (isPierce) {
    vfx += `
      <line x1="28" y1="270" x2="356" y2="54" stroke="#8be8ff" stroke-width="6" stroke-linecap="round" opacity="0.88"/>
      <line x1="28" y1="270" x2="356" y2="54" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
      <polygon points="366,47 338,53 351,71" fill="#ffffff" opacity="0.95"/>
    `;
  }

  // Crit starburst
  if (isCrit) {
    vfx += `
      <g transform="translate(310, 82)" opacity="0.92">
        <polygon points="0,-28 6,-7 28,0 6,7 0,28 -6,7 -28,0 -6,-7" fill="#ffe17d"/>
        <polygon points="0,-16 3,-4 16,0 3,4 0,16 -3,4 -16,0 -3,-4" fill="#ffffff"/>
      </g>
    `;
  }

  // Shield barrier arc
  if (shield > 0) {
    vfx += `
      <ellipse cx="194" cy="166" rx="146" ry="132" fill="none" stroke="#7fd0ff" stroke-width="6" stroke-dasharray="18 8" opacity="0.72"/>
      <ellipse cx="194" cy="166" rx="136" ry="122" fill="none" stroke="#dff6ff" stroke-width="2" opacity="0.65"/>
    `;
  }

  // Heal glow & rising sparkles
  if (isHeal) {
    vfx += `
      <ellipse cx="194" cy="280" rx="145" ry="34" fill="#4ef08d" opacity="0.28"/>
      <g fill="#a6ffca" opacity="0.92">
        <path d="M62 210 h12 v-12 h6 v12 h12 v6 h-12 v12 h-6 v-12 h-12 z"/>
        <path d="M304 118 h10 v-10 h5 v10 h10 v5 h-10 v10 h-5 v-10 h-10 z"/>
        <circle cx="96" cy="112" r="4"/>
        <circle cx="290" cy="212" r="5"/>
        <circle cx="130" cy="70" r="3"/>
      </g>
    `;
  }

  // Debuff toxic/curse orbs
  if (isDebuff) {
    vfx += `
      <g opacity="0.82">
        <circle cx="74" cy="92" r="14" fill="#9c3dff" opacity="0.45"/>
        <circle cx="74" cy="92" r="6" fill="#e5b8ff"/>
        <circle cx="318" cy="228" r="16" fill="#9c3dff" opacity="0.42"/>
        <circle cx="318" cy="228" r="7" fill="#e5b8ff"/>
        <circle cx="98" cy="242" r="9" fill="#b45cff" opacity="0.5"/>
      </g>
    `;
  }

  // Buff rising golden streaks
  if (isBuff && !isHeal) {
    vfx += `
      <g stroke="#ffd966" stroke-linecap="round" opacity="0.75">
        <line x1="68" y1="268" x2="68" y2="178" stroke-width="3.5"/>
        <line x1="320" y1="258" x2="320" y2="162" stroke-width="3.5"/>
        <line x1="94" y1="286" x2="94" y2="218" stroke-width="2.5"/>
        <line x1="296" y1="282" x2="296" y2="212" stroke-width="2.5"/>
      </g>
    `;
  }

  // Part-specific accent (eyes glow, muzzle roar ring, tail whip, etc.)
  if (part === "eyes") {
    vfx += `<circle cx="194" cy="112" r="88" fill="none" stroke="${pal.accentBright}" stroke-width="2.5" opacity="0.45"/>`;
  } else if (part === "muzzle") {
    vfx += `
      <circle cx="194" cy="148" r="58" fill="none" stroke="${pal.accentBright}" stroke-width="3" opacity="0.5"/>
      <circle cx="194" cy="148" r="92" fill="none" stroke="${pal.accent}" stroke-width="2" opacity="0.35"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="388" height="314" viewBox="0 0 388 314">${vfx}</svg>`;
}

function buildBackgroundSvg(pal, part) {
  const cx = part === "tail" ? "65%" : part === "back" ? "35%" : "50%";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="388" height="314" viewBox="0 0 388 314">
    <defs>
      <radialGradient id="bg" cx="${cx}" cy="42%" r="72%">
        <stop offset="0%" stop-color="${pal.bgGlow}" stop-opacity="0.78"/>
        <stop offset="48%" stop-color="${pal.bgMid}" stop-opacity="0.96"/>
        <stop offset="100%" stop-color="${pal.bgDark}" stop-opacity="1"/>
      </radialGradient>
    </defs>
    <rect width="388" height="314" fill="url(#bg)"/>
    <g fill="${pal.accentBright}" opacity="0.55">
      <circle cx="52" cy="64" r="2.2"/>
      <circle cx="334" cy="52" r="2.6"/>
      <circle cx="312" cy="146" r="1.8"/>
      <circle cx="72" cy="230" r="2.4"/>
      <circle cx="348" cy="252" r="2.0"/>
      <circle cx="144" cy="36" r="1.7"/>
      <circle cx="248" cy="42" r="2.1"/>
    </g>
  </svg>`;
}

function buildFrameAndOverlaySvg(card, role, element, pal) {
  const roleLabel = ROLE_RU[role] || role;
  const cost = String(card.cost ?? 1);
  const title = card.title_ru || "";
  const effect = card.effect_ru || "";

  // Active bonus icons ONLY (no empty slots!)
  const activeIcons = ICON_META.filter((m) => card.icons && card.icons[m.key]);

  // Wrap effect text cleanly
  const lines = wrapText(effect, 31).slice(0, 3);
  const fontSize = lines.length >= 3 ? 17 : 19;
  const lineH = lines.length >= 3 ? 22 : 25;
  const textStartY = lines.length === 1 ? 500 : lines.length === 2 ? 488 : 478;

  const effectLinesSvg = lines
    .map(
      (ln, idx) =>
        `<text x="240" y="${textStartY + idx * lineH}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" fill="#f7efe2">${escXml(ln)}</text>`,
    )
    .join("");

  // Active bonus badges centered in bottom bar
  let badgesSvg = "";
  if (activeIcons.length > 0) {
    const badgeW = 58;
    const gap = 10;
    const totalW = activeIcons.length * badgeW + (activeIcons.length - 1) * gap;
    const startX = (W - totalW) / 2;
    const by = 556;
    badgesSvg = activeIcons
      .map((ic, i) => {
        const bx = startX + i * (badgeW + gap);
        const cx = bx + badgeW / 2;
        return `
          <g>
            <rect x="${bx}" y="${by}" width="${badgeW}" height="52" rx="10" fill="${pal.badgeBg}" stroke="${ic.color}" stroke-width="2"/>
            ${iconGlyphSvg(ic.key, cx, by + 20, ic.color)}
            <text x="${cx}" y="${by + 45}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="9.5" letter-spacing="0.5" fill="#f5ede0">${ic.label}</text>
          </g>
        `;
      })
      .join("");
  }

  // Element emblem top-left (purely visual, no text)
  let elemEmblem = "";
  if (element === "fire") {
    elemEmblem = `<path d="M52 29 C58 38 64 43 64 51 C64 59 58 65 52 65 C46 65 40 59 40 51 C40 44 45 40 47 35 C49 39 50 40 52 29 Z" fill="${pal.accentBright}"/>`;
  } else if (element === "water") {
    elemEmblem = `<path d="M52 29 C59 41 64 47 64 53 C64 60 58.6 65 52 65 C45.4 65 40 60 40 53 C40 47 45 41 52 29 Z" fill="${pal.accentBright}"/>`;
  } else {
    elemEmblem = `
      <path d="M38 45 Q52 36 64 43" fill="none" stroke="${pal.accentBright}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M36 53 Q52 46 66 53" fill="none" stroke="${pal.accentBright}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M41 61 Q52 56 61 61" fill="none" stroke="${pal.accentBright}" stroke-width="2.6" stroke-linecap="round"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="metalV" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${pal.frameMetalLight}"/>
        <stop offset="50%" stop-color="${pal.frameMetal}"/>
        <stop offset="100%" stop-color="${pal.frameMetalDark}"/>
      </linearGradient>
      <linearGradient id="gemG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${pal.gemTop}"/>
        <stop offset="100%" stop-color="${pal.gemBot}"/>
      </linearGradient>
      <mask id="artHole">
        <rect width="${W}" height="${H}" fill="white"/>
        <rect x="46" y="84" width="388" height="314" rx="14" fill="black"/>
      </mask>
    </defs>

    <!-- Outer unified card chassis with transparent art window -->
    <g mask="url(#artHole)">
      <rect x="0" y="0" width="${W}" height="${H}" rx="22" fill="${pal.frameOuter}"/>
      <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="18" fill="none" stroke="url(#metalV)" stroke-width="4.5"/>
      <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="14" fill="none" stroke="${pal.frameMetalDark}" stroke-width="2"/>
    </g>

    <!-- Art window inner bevel -->
    <rect x="44" y="82" width="392" height="318" rx="15" fill="none" stroke="url(#metalV)" stroke-width="4"/>

    <!-- Top-left element medallion -->
    <circle cx="52" cy="48" r="26" fill="${pal.plaqueBg}" stroke="url(#metalV)" stroke-width="3.5"/>
    ${elemEmblem}

    <!-- Top-center class plaque -->
    <rect x="108" y="26" width="264" height="42" rx="10" fill="${pal.plaqueBg}" stroke="url(#metalV)" stroke-width="2.5"/>
    <text x="240" y="54" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="22" letter-spacing="1" fill="#f7ebd2">${escXml(roleLabel)}</text>

    <!-- Top-right AP cost gem -->
    <circle cx="428" cy="48" r="26" fill="url(#gemG)" stroke="url(#metalV)" stroke-width="3.5"/>
    <text x="428" y="58" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="29" fill="#ffffff">${escXml(cost)}</text>

    <!-- Title plaque -->
    <rect x="66" y="408" width="348" height="38" rx="9" fill="${pal.plaqueBg}" stroke="url(#metalV)" stroke-width="2.5"/>
    <text x="240" y="434" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="20" fill="#ffe8bc">${escXml(title)}</text>

    <!-- Description box with exact damage/shield/heal numbers -->
    <rect x="34" y="454" width="412" height="90" rx="10" fill="${pal.textBoxBg}" stroke="${pal.frameMetal}" stroke-width="2"/>
    <rect x="40" y="460" width="400" height="78" rx="7" fill="none" stroke="${pal.frameMetalDark}" stroke-width="1"/>
    ${effectLinesSvg}

    <!-- Bottom bar: ONLY active bonus badges (no empty slots, no Mythfel/Elven Fire text) -->
    ${badgesSvg}
  </svg>`;
}

// Crop/position parameters per card part so all 6 cards of a hero look distinct & action-focused
function catTransformForPart(part) {
  switch (part) {
    case "eyes":
      return { scale: 1.42, topOffset: 0.0, leftShift: 0, flop: false };
    case "ears":
      return { scale: 1.32, topOffset: 0.0, leftShift: -10, flop: true };
    case "muzzle":
      return { scale: 1.46, topOffset: 0.0, leftShift: 8, flop: false };
    case "headwear":
      return { scale: 1.24, topOffset: 0.0, leftShift: 0, flop: false };
    case "back":
      return { scale: 1.0, topOffset: 0.0, leftShift: -14, flop: false };
    case "tail":
      return { scale: 0.98, topOffset: 0.0, leftShift: 14, flop: true };
    default:
      return { scale: 1.0, topOffset: 0.0, leftShift: 0, flop: false };
  }
}

async function buildCard(cardId, card) {
  const m = cardId.match(/^card_shop_([a-z]+)_([a-z]+)_(eyes|ears|muzzle|headwear|back|tail)$/);
  if (!m) return false;
  const [, role, element, part] = m;
  const pal = PALETTE[element];
  if (!pal) return false;

  const heroPath = path.join(CAT_HEROES_DIR, `${role}-${element}.webp`);
  if (!fs.existsSync(heroPath)) {
    console.warn("Missing hero art:", heroPath);
    return false;
  }

  const artW = 388;
  const artH = 314;

  // 1. Background
  const bgBuf = await sharp(Buffer.from(buildBackgroundSvg(pal, part))).png().toBuffer();

  // 2. Cat hero sprite cropped/posed for this card's action
  const tf = catTransformForPart(part);
  let catPipe = sharp(heroPath);
  if (tf.flop) catPipe = catPipe.flop();
  const targetH = Math.round(artH * tf.scale);
  const resizedCat = await catPipe
    .resize({ height: targetH, fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });

  const cw = resizedCat.info.width;
  const ch = resizedCat.info.height;
  const desiredLeft = Math.round((artW - cw) / 2 + tf.leftShift);
  const desiredTop = Math.round(-ch * tf.topOffset);

  const srcLeft = Math.max(0, -desiredLeft);
  const srcTop = Math.max(0, -desiredTop);
  const dstLeft = Math.max(0, desiredLeft);
  const dstTop = Math.max(0, desiredTop);
  const cropW = Math.min(cw - srcLeft, artW - dstLeft);
  const cropH = Math.min(ch - srcTop, artH - dstTop);

  const croppedCat = await sharp(resizedCat.data)
    .extract({ left: srcLeft, top: srcTop, width: cropW, height: cropH })
    .png()
    .toBuffer();

  // Composite cat onto art canvas safely
  const artCanvas = await sharp(bgBuf)
    .composite([
      {
        input: croppedCat,
        left: dstLeft,
        top: dstTop,
      },
      {
        input: Buffer.from(buildActionVfxSvg(card, part, pal)),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();

  // 3. Final card: art window + unified colored frame + text + active-only bonus icons
  const frameSvg = Buffer.from(buildFrameAndOverlaySvg(card, role, element, pal));

  const outDir = path.join(OUT_ROOT, `${role}-${element}`);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `attack_shop_${role}_${element}_${part}.webp`);

  const outBuf = await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 10, g: 10, b: 12, alpha: 1 },
    },
  })
    .composite([
      { input: artCanvas, left: 46, top: 84 },
      { input: frameSvg, left: 0, top: 0 },
    ])
    .webp({ quality: 88 })
    .toBuffer();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.writeFileSync(outPath, outBuf);
      break;
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise((r) => setTimeout(r, 180 * (attempt + 1)));
    }
  }

  return true;
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(CARDS_JSON, "utf8"));
  const entries = Object.entries(catalog).filter(([id]) => id.startsWith("card_shop_"));
  let ok = 0;
  for (const [id, card] of entries) {
    if (await buildCard(id, card)) ok++;
  }
  console.log(`Built ${ok}/${entries.length} attack cards.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
