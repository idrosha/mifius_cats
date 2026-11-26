import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const MODES_DIR = path.join(PUBLIC_DIR, "stitch-assets/modes");
const MONSTERS_DIR = path.join(PUBLIC_DIR, "stitch-assets/monsters/battle");

const W = 1408;
const H = 768;

function makeLocationSvg({
  skyTop,
  skyMid,
  skyBot,
  glowColor,
  glowX,
  glowY,
  glowR,
  floorTop,
  floorBot,
  extraSvg,
}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skyTop}"/>
      <stop offset="55%" stop-color="${skyMid}"/>
      <stop offset="100%" stop-color="${skyBot}"/>
    </linearGradient>
    <radialGradient id="glow" cx="${glowX}" cy="${glowY}" r="${glowR}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.85"/>
      <stop offset="45%" stop-color="${glowColor}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${floorTop}"/>
      <stop offset="100%" stop-color="${floorBot}"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="48%" r="65%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.62"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${extraSvg}
  <path d="M0 535 Q704 495 ${W} 535 L${W} ${H} L0 ${H} Z" fill="url(#floor)"/>
  <line x1="0" y1="538" x2="${W}" y2="538" stroke="${glowColor}" stroke-opacity="0.35" stroke-width="3"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
}

const LOCATIONS = [
  {
    file: "dungeon-scarlet-bg.webp",
    // Псарня Алых Колец — crimson gladiatorial pit, iron rings, torches
    svg: makeLocationSvg({
      skyTop: "#1a0709",
      skyMid: "#3b0d14",
      skyBot: "#5c161b",
      glowColor: "#ff5b2e",
      glowX: 704,
      glowY: 360,
      glowR: 520,
      floorTop: "#2b1412",
      floorBot: "#120707",
      extraSvg: `
        <!-- Colosseum arches -->
        <g fill="#22090c" stroke="#6b1d20" stroke-width="4">
          <rect x="60" y="180" width="120" height="370"/>
          <rect x="240" y="150" width="110" height="400"/>
          <rect x="1058" y="150" width="110" height="400"/>
          <rect x="1228" y="180" width="120" height="370"/>
          <path d="M180 260 Q210 190 240 260 L240 550 L180 550 Z" fill="#140406"/>
          <path d="M1168 260 Q1198 190 1228 260 L1228 550 L1168 550 Z" fill="#140406"/>
        </g>
        <!-- Hanging crimson iron rings -->
        <g stroke="#d93829" stroke-width="10" fill="none" opacity="0.82">
          <line x1="460" y1="0" x2="460" y2="170" stroke="#7a2a24" stroke-width="6"/>
          <circle cx="460" cy="220" r="52"/>
          <line x1="704" y1="0" x2="704" y2="120" stroke="#7a2a24" stroke-width="8"/>
          <circle cx="704" cy="195" r="76" stroke="#ff5733" stroke-width="12"/>
          <line x1="948" y1="0" x2="948" y2="170" stroke="#7a2a24" stroke-width="6"/>
          <circle cx="948" cy="220" r="52"/>
        </g>
        <!-- Fire braziers -->
        <g>
          <polygon points="330,520 390,520 375,470 345,470" fill="#2c1614"/>
          <ellipse cx="360" cy="458" rx="28" ry="42" fill="#ff6b2b" opacity="0.85"/>
          <ellipse cx="360" cy="462" rx="14" ry="24" fill="#ffd166" opacity="0.9"/>
          <polygon points="1018,520 1078,520 1063,470 1033,470" fill="#2c1614"/>
          <ellipse cx="1048" cy="458" rx="28" ry="42" fill="#ff6b2b" opacity="0.85"/>
          <ellipse cx="1048" cy="462" rx="14" ry="24" fill="#ffd166" opacity="0.9"/>
        </g>
        <!-- Embers -->
        <g fill="#ff9e44" opacity="0.75">
          <circle cx="420" cy="390" r="4"/><circle cx="540" cy="310" r="3"/><circle cx="670" cy="340" r="5"/>
          <circle cx="820" cy="290" r="3"/><circle cx="910" cy="410" r="4"/><circle cx="1010" cy="340" r="3"/>
        </g>
      `,
    }),
  },
  {
    file: "dungeon-howl-bg.webp",
    // Ледник Воющих — frozen glacier, full moon, ice spires, wolf totems
    svg: makeLocationSvg({
      skyTop: "#081426",
      skyMid: "#132d4c",
      skyBot: "#244e73",
      glowColor: "#7de2ff",
      glowX: 704,
      glowY: 220,
      glowR: 460,
      floorTop: "#1d3d57",
      floorBot: "#0c1b29",
      extraSvg: `
        <!-- Full Moon -->
        <circle cx="704" cy="200" r="108" fill="#dff8ff" opacity="0.9"/>
        <circle cx="704" cy="200" r="138" fill="#7de2ff" opacity="0.22"/>
        <!-- Distant icy peaks -->
        <polygon points="0,540 210,210 420,540" fill="#102940"/>
        <polygon points="280,540 520,250 760,540" fill="#163552"/>
        <polygon points="650,540 930,220 1200,540" fill="#122e47"/>
        <polygon points="980,540 1220,190 1408,540" fill="#0d2236"/>
        <!-- Crystalline frost spires -->
        <g fill="#59c3e8" opacity="0.45">
          <polygon points="150,540 190,280 230,540"/>
          <polygon points="1180,540 1230,260 1280,540"/>
        </g>
        <!-- Glowing wolf totems -->
        <g fill="#1c3952" stroke="#7de2ff" stroke-width="3">
          <rect x="330" y="340" width="44" height="200" rx="6"/>
          <circle cx="352" cy="390" r="10" fill="#7de2ff"/>
          <rect x="1034" y="340" width="44" height="200" rx="6"/>
          <circle cx="1056" cy="390" r="10" fill="#7de2ff"/>
        </g>
        <!-- Snowflakes -->
        <g fill="#e6faff" opacity="0.7">
          <circle cx="260" cy="180" r="3"/><circle cx="480" cy="260" r="4"/><circle cx="590" cy="140" r="2.5"/>
          <circle cx="840" cy="240" r="3.5"/><circle cx="960" cy="150" r="3"/><circle cx="1140" cy="300" r="4"/>
          <circle cx="380" cy="430" r="3"/><circle cx="760" cy="410" r="3.5"/><circle cx="920" cy="450" r="3"/>
        </g>
      `,
    }),
  },
  {
    file: "dungeon-whisper-bg.webp",
    // Склеп Шепчущих — eerie emerald catacombs, stone arches, ghostly mist
    svg: makeLocationSvg({
      skyTop: "#071412",
      skyMid: "#0e2924",
      skyBot: "#153d34",
      glowColor: "#42f5b3",
      glowX: 704,
      glowY: 360,
      glowR: 500,
      floorTop: "#132924",
      floorBot: "#07100e",
      extraSvg: `
        <!-- Gothic stone arches -->
        <g fill="none" stroke="#224a40" stroke-width="18">
          <path d="M120 550 L120 240 Q260 80 400 240 L400 550"/>
          <path d="M480 550 L480 210 Q704 40 928 210 L928 550"/>
          <path d="M1008 550 L1008 240 Q1148 80 1288 240 L1288 550"/>
        </g>
        <!-- Spectral emerald lanterns -->
        <g>
          <line x1="350" y1="150" x2="350" y2="270" stroke="#2f5e52" stroke-width="4"/>
          <circle cx="350" cy="290" r="24" fill="#42f5b3" opacity="0.75"/>
          <circle cx="350" cy="290" r="54" fill="#42f5b3" opacity="0.2"/>
          <line x1="1058" y1="150" x2="1058" y2="270" stroke="#2f5e52" stroke-width="4"/>
          <circle cx="1058" cy="290" r="24" fill="#42f5b3" opacity="0.75"/>
          <circle cx="1058" cy="290" r="54" fill="#42f5b3" opacity="0.2"/>
        </g>
        <!-- Ghostly mist ribbons -->
        <g fill="#42f5b3" opacity="0.16">
          <ellipse cx="420" cy="520" rx="280" ry="36"/>
          <ellipse cx="960" cy="510" rx="310" ry="40"/>
          <ellipse cx="704" cy="480" rx="220" ry="26"/>
        </g>
      `,
    }),
  },
  {
    file: "raid-myaurra-bg.webp",
    // Небесный Двор Мяурры — golden sunlit marble palace in the clouds
    svg: makeLocationSvg({
      skyTop: "#1f1933",
      skyMid: "#5b3b54",
      skyBot: "#c77d4b",
      glowColor: "#ffd86b",
      glowX: 704,
      glowY: 250,
      glowR: 540,
      floorTop: "#523d2d",
      floorBot: "#241911",
      extraSvg: `
        <!-- Radiant solar disk -->
        <circle cx="704" cy="240" r="126" fill="#ffe694" opacity="0.9"/>
        <circle cx="704" cy="240" r="175" fill="#ffb84d" opacity="0.25"/>
        <!-- Marble pillars -->
        <g fill="#d9c6a3" stroke="#997848" stroke-width="4" opacity="0.88">
          <rect x="130" y="130" width="76" height="410"/>
          <rect x="300" y="170" width="64" height="370"/>
          <rect x="1044" y="170" width="64" height="370"/>
          <rect x="1202" y="130" width="76" height="410"/>
        </g>
        <!-- Golden arch & clouds -->
        <path d="M364 260 Q704 60 1044 260" fill="none" stroke="#ffd86b" stroke-width="10" opacity="0.7"/>
        <g fill="#fff0d4" opacity="0.28">
          <ellipse cx="260" cy="470" rx="200" ry="44"/>
          <ellipse cx="1140" cy="470" rx="220" ry="44"/>
        </g>
      `,
    }),
  },
  {
    file: "raid-talass-bg.webp",
    // Бездна Шепчущих Усов — bioluminescent abyssal trench, sunken ruins, beacons
    svg: makeLocationSvg({
      skyTop: "#030b1a",
      skyMid: "#071f38",
      skyBot: "#0c3554",
      glowColor: "#2ef2e8",
      glowX: 704,
      glowY: 320,
      glowR: 540,
      floorTop: "#0b2436",
      floorBot: "#040d17",
      extraSvg: `
        <!-- Sunken coral / stone arches -->
        <g fill="#081c2e" stroke="#1d6678" stroke-width="5">
          <path d="M80 550 Q220 180 390 550 Z"/>
          <path d="M1018 550 Q1188 180 1328 550 Z"/>
        </g>
        <!-- Abyssal glowing beacons -->
        <g>
          <rect x="430" y="290" width="28" height="250" fill="#10344a"/>
          <circle cx="444" cy="275" r="28" fill="#2ef2e8" opacity="0.85"/>
          <circle cx="444" cy="275" r="70" fill="#2ef2e8" opacity="0.2"/>
          <rect x="950" y="290" width="28" height="250" fill="#10344a"/>
          <circle cx="964" cy="275" r="28" fill="#2ef2e8" opacity="0.85"/>
          <circle cx="964" cy="275" r="70" fill="#2ef2e8" opacity="0.2"/>
        </g>
        <!-- Bioluminescent bubbles -->
        <g fill="#6fffe9" opacity="0.55">
          <circle cx="320" cy="220" r="6"/><circle cx="580" cy="180" r="8"/><circle cx="710" cy="310" r="5"/>
          <circle cx="830" cy="210" r="7"/><circle cx="1090" cy="260" r="6"/><circle cx="640" cy="430" r="5"/>
        </g>
      `,
    }),
  },
  {
    file: "raid-vulcan-bg.webp",
    // Пепельный Трон Девяти Хвостов — volcanic obsidian shrine, lava rivers, torii gate
    svg: makeLocationSvg({
      skyTop: "#140608",
      skyMid: "#360d0e",
      skyBot: "#6b1b12",
      glowColor: "#ff621f",
      glowX: 704,
      glowY: 360,
      glowR: 540,
      floorTop: "#240f0d",
      floorBot: "#0f0505",
      extraSvg: `
        <!-- Obsidian volcanic peaks -->
        <polygon points="0,540 260,180 500,540" fill="#1b0909"/>
        <polygon points="908,540 1148,180 1408,540" fill="#1b0909"/>
        <!-- Burning Torii Gate -->
        <g fill="#380c0c" stroke="#ff5e1a" stroke-width="5">
          <rect x="470" y="220" width="44" height="320"/>
          <rect x="894" y="220" width="44" height="320"/>
          <path d="M400 205 Q704 165 1008 205 L990 245 Q704 215 418 245 Z"/>
          <rect x="455" y="280" width="498" height="24"/>
        </g>
        <!-- Glowing lava cracks on floor -->
        <g stroke="#ff7a29" stroke-width="6" opacity="0.85" fill="none">
          <path d="M220 680 L380 610 L520 640"/>
          <path d="M1180 680 L1020 610 L880 640"/>
        </g>
        <!-- Floating ash & embers -->
        <g fill="#ffb347" opacity="0.8">
          <circle cx="380" cy="340" r="4"/><circle cx="560" cy="380" r="5"/><circle cx="704" cy="320" r="4"/>
          <circle cx="860" cy="360" r="5"/><circle cx="1020" cy="310" r="4"/>
        </g>
      `,
    }),
  },
];

async function buildLocations() {
  fs.mkdirSync(MODES_DIR, { recursive: true });
  for (const loc of LOCATIONS) {
    const out = path.join(MODES_DIR, loc.file);
    await sharp(Buffer.from(loc.svg))
      .webp({ quality: 88 })
      .toFile(out);
    console.log("Generated location art:", out);
  }
}

async function buildMissingRaidMonsters() {
  // 1. solar-lion-support-cutout.webp (based on solar-lion-fighter-cutout.webp + golden halo/staff aura)
  const lionSrc = path.join(MONSTERS_DIR, "solar-lion-fighter-cutout.webp");
  const lionMeta = await sharp(lionSrc).metadata();
  const lw = lionMeta.width || 768;
  const lh = lionMeta.height || 768;
  const lionHalo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lw}" height="${lh}">
    <defs>
      <radialGradient id="h" cx="50%" cy="28%" r="36%">
        <stop offset="0%" stop-color="#fff4b8" stop-opacity="0.7"/>
        <stop offset="60%" stop-color="#ffd24d" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#ffd24d" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="${Math.round(lw * 0.5)}" cy="${Math.round(lh * 0.26)}" r="${Math.round(lw * 0.26)}" fill="none" stroke="#ffe17d" stroke-width="10" stroke-opacity="0.75"/>
    <rect width="${lw}" height="${lh}" fill="url(#h)"/>
  </svg>`);
  await sharp(lionSrc)
    .modulate({ brightness: 1.08, saturation: 0.92, hue: 14 })
    .composite([{ input: lionHalo, blend: "screen" }])
    .webp({ quality: 88 })
    .toFile(path.join(MONSTERS_DIR, "solar-lion-support-cutout.webp"));
  console.log("Generated monster cutout: solar-lion-support-cutout.webp");

  // 2. deep-lynx-fighter-cutout.webp (based on deep-lynx-tank-cutout.webp + sharp abyssal blade aura)
  const lynxSrc = path.join(MONSTERS_DIR, "deep-lynx-tank-cutout.webp");
  const lynxMeta = await sharp(lynxSrc).metadata();
  const xw = lynxMeta.width || 768;
  const xh = lynxMeta.height || 768;
  const lynxSlash = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${xw}" height="${xh}">
    <path d="M${Math.round(xw * 0.12)} ${Math.round(xh * 0.65)} Q${Math.round(xw * 0.45)} ${Math.round(xh * 0.28)} ${Math.round(xw * 0.88)} ${Math.round(xh * 0.18)}" fill="none" stroke="#47fff0" stroke-width="14" stroke-linecap="round" stroke-opacity="0.72"/>
    <path d="M${Math.round(xw * 0.18)} ${Math.round(xh * 0.72)} Q${Math.round(xw * 0.52)} ${Math.round(xh * 0.36)} ${Math.round(xw * 0.9)} ${Math.round(xh * 0.28)}" fill="none" stroke="#a6fff8" stroke-width="6" stroke-linecap="round" stroke-opacity="0.8"/>
  </svg>`);
  await sharp(lynxSrc)
    .modulate({ brightness: 1.06, saturation: 1.18, hue: -18 })
    .composite([{ input: lynxSlash, blend: "screen" }])
    .webp({ quality: 88 })
    .toFile(path.join(MONSTERS_DIR, "deep-lynx-fighter-cutout.webp"));
  console.log("Generated monster cutout: deep-lynx-fighter-cutout.webp");

  // 3. kitsune-tank-cutout.webp (based on kitsune-fighter-cutout.webp + volcanic obsidian shield barrier)
  const kitSrc = path.join(MONSTERS_DIR, "kitsune-fighter-cutout.webp");
  const kitMeta = await sharp(kitSrc).metadata();
  const kw = kitMeta.width || 768;
  const kh = kitMeta.height || 768;
  const kitShield = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${kw}" height="${kh}">
    <path d="M${Math.round(kw * 0.2)} ${Math.round(kh * 0.36)} L${Math.round(kw * 0.5)} ${Math.round(kh * 0.24)} L${Math.round(kw * 0.8)} ${Math.round(kh * 0.36)} L${Math.round(kw * 0.74)} ${Math.round(kh * 0.74)} L${Math.round(kw * 0.5)} ${Math.round(kh * 0.88)} L${Math.round(kw * 0.26)} ${Math.round(kh * 0.74)} Z" fill="#ff5b1f" fill-opacity="0.16" stroke="#ff823a" stroke-width="10" stroke-opacity="0.72"/>
  </svg>`);
  await sharp(kitSrc)
    .modulate({ brightness: 0.94, saturation: 1.12, hue: -10 })
    .composite([{ input: kitShield, blend: "screen" }])
    .webp({ quality: 88 })
    .toFile(path.join(MONSTERS_DIR, "kitsune-tank-cutout.webp"));
  console.log("Generated monster cutout: kitsune-tank-cutout.webp");
}

await buildLocations();
await buildMissingRaidMonsters();
console.log("ALL DUNGEON & RAID ASSETS BUILT SUCCESSFULLY.");
