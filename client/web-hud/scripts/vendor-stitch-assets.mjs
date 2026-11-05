#!/usr/bin/env node
/**
 * Vendor Stitch LH3 art into public/stitch-assets and rewrite stitch-src URLs.
 * - aida-public → download (real JPEGs)
 * - /aida/ ephemeral → local fallbacks (screen/ref art); those URLs return HTML, not images
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "design", "stitch-src");
const OUT = path.join(ROOT, "public", "stitch-assets");
const REF_PUB = path.join(ROOT, "public", "stitch-ref");
const REF_SRC = path.join(ROOT, "design", "stitch-ref");

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(REF_PUB, { recursive: true });

function walkCopy(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, ent.name);
    const b = path.join(to, ent.name);
    if (ent.isDirectory()) walkCopy(a, b);
    else fs.copyFileSync(a, b);
  }
}
walkCopy(REF_SRC, REF_PUB);

const URL_RE = /https:\/\/lh3\.googleusercontent\.com\/(?:aida-public|aida)\/[A-Za-z0-9_\-]+/g;

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".html"));
const urlToFiles = new Map();
for (const file of files) {
  const text = fs.readFileSync(path.join(SRC, file), "utf8");
  for (const u of text.match(URL_RE) || []) {
    if (!urlToFiles.has(u)) urlToFiles.set(u, new Set());
    urlToFiles.get(u).add(file);
  }
}

const publicUrls = [...urlToFiles.keys()].filter((u) => u.includes("/aida-public/"));
const ephemeralUrls = [...urlToFiles.keys()].filter((u) => u.includes("/aida/") && !u.includes("/aida-public/"));

console.log(`found ${publicUrls.length} aida-public + ${ephemeralUrls.length} ephemeral /aida/`);

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ctype = (res.headers.get("content-type") || "").toLowerCase();
  if (ctype.includes("text/html") || buf.slice(0, 15).toString("utf8").includes("<!DOCTYPE") || buf.slice(0, 5).toString("utf8") === "<html") {
    throw new Error(`HTML not image: ${url}`);
  }
  fs.writeFileSync(dest, buf);
  return buf.length;
}

const urlMap = new Map(); // remote → /stitch-assets/...

async function vendorPublic() {
  let i = 0;
  for (const url of publicUrls) {
    i += 1;
    const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 12);
    const name = `${hash}.jpg`;
    const dest = path.join(OUT, name);
    const local = `/stitch-assets/${name}`;
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
      process.stdout.write(`[${i}/${publicUrls.length}] ${hash}… `);
      try {
        const n = await download(url, dest);
        console.log(`${n} B`);
      } catch (err) {
        console.log(`FAIL ${err.message}`);
        continue;
      }
    }
    urlMap.set(url, local);
  }
}

/** Stable fallbacks for ephemeral /aida/ by consuming screen (file → ordered locals). */
const SCREEN_FALLBACKS = {
  "login.html": ["/stitch-assets/login-hero.png"],
  "gear.html": [
    "/stitch-ref/2a9f/gear_bag.png",
    "/stitch-ref/8-9-10/heroes.png",
    "/stitch-ref/8-9-10/equip_tank.png",
    "/stitch-ref/8-9-10/weapon_void.png",
    "/stitch-ref/hub.png",
    "/stitch-ref/3a8d/practice.png",
    "/stitch-ref/940b/breeding.png",
  ],
  "auction.html": [
    "/stitch-ref/940b/breeding.png",
    "/stitch-ref/8-9-10/equip_cards.png",
    "/stitch-ref/8-9-10/equip_tank.png",
    "/stitch-ref/8-9-10/weapon_void.png",
    "/stitch-ref/2a9f/gear_bag.png",
    "/stitch-ref/hub.png",
  ],
  "breeding.html": ["/stitch-ref/940b/breeding.png", "/stitch-ref/3a8d/practice.png"],
  "equip_cards.html": ["/stitch-ref/8-9-10/equip_cards.png", "/stitch-ref/8-9-10/equip_tank.png"],
};

function vendorEphemeral() {
  const perFileCursor = new Map();
  for (const url of ephemeralUrls) {
    const screens = [...urlToFiles.get(url)];
    let local = null;
    for (const screen of screens) {
      const pool = SCREEN_FALLBACKS[screen];
      if (!pool?.length) continue;
      const idx = perFileCursor.get(screen) || 0;
      local = pool[idx % pool.length];
      perFileCursor.set(screen, idx + 1);
      break;
    }
    if (!local) {
      // global pool of already-vendored public art
      const pubs = [...urlMap.values()];
      local = pubs.length ? pubs[urlMap.size % pubs.length] : "/stitch-ref/hub.png";
    }
    urlMap.set(url, local);
    console.log(`ephemeral → ${local}  (${screens.join(",")})`);
  }
}

function rewriteSources() {
  let changedFiles = 0;
  let replacements = 0;
  for (const file of files) {
    let text = fs.readFileSync(path.join(SRC, file), "utf8");
    let n = 0;
    text = text.replace(URL_RE, (u) => {
      const local = urlMap.get(u);
      if (!local) return u;
      n += 1;
      return local;
    });
    if (n) {
      fs.writeFileSync(path.join(SRC, file), text, "utf8");
      changedFiles += 1;
      replacements += n;
      console.log(`rewrote ${file}: ${n}`);
    }
  }
  console.log(`done: ${changedFiles} files, ${replacements} URL rewrites, map=${urlMap.size}`);
}

/** Inject scenic backgrounds into image-less shells that still look flat vs screen.png. */
function injectScenicShells() {
  const patches = [
    {
      file: "yard.html",
      needle:
        'style="background-image: radial-gradient(circle at 50% 50%, rgba(217, 155, 38, 0.15) 0%, transparent 70%), linear-gradient(135deg, #1f1b18 0%, #161310 100%);"',
      replace:
        'style="background-image: linear-gradient(180deg, rgba(22,19,16,0.55) 0%, rgba(22,19,16,0.75) 100%), url(\'/stitch-assets/yard-map-bg.png\'); background-size: cover; background-position: center;"',
    },
    {
      file: "codex.html",
      // after <body …> open — add fixed atmosphere layer inside first main if missing
      needle: '<main class="w-full pt-16 min-h-[calc(100vh-48px)] bg-surface">',
      replace:
        '<main class="w-full pt-16 min-h-[calc(100vh-48px)] bg-surface relative overflow-hidden"><div class="pointer-events-none absolute inset-0 opacity-35" style="background-image:url(\'/stitch-ref/3a8d/codex.png\');background-size:cover;background-position:center;" aria-hidden="true"></div><div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface/70 via-surface/85 to-surface" aria-hidden="true"></div>',
    },
  ];
  for (const p of patches) {
    const fp = path.join(SRC, p.file);
    let t = fs.readFileSync(fp, "utf8");
    if (!t.includes(p.needle)) {
      console.warn(`scenic skip ${p.file}: needle missing`);
      continue;
    }
    if (t.includes(p.replace)) {
      console.log(`scenic already ${p.file}`);
      continue;
    }
    t = t.replace(p.needle, p.replace);
    fs.writeFileSync(fp, t, "utf8");
    console.log(`scenic patched ${p.file}`);
  }
}

await vendorPublic();
vendorEphemeral();
rewriteSources();
injectScenicShells();

fs.writeFileSync(
  path.join(OUT, "manifest.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      mappings: Object.fromEntries(urlMap),
      publicCount: publicUrls.length,
      ephemeralCount: ephemeralUrls.length,
    },
    null,
    2,
  ),
  "utf8",
);
console.log("wrote manifest.json");
