#!/usr/bin/env node
/**
 * Vendor Stitch LH3 art into public/stitch-assets and rewrite stitch-src URLs.
 * - aida-public → download (real JPEGs)
 * - /aida/ ephemeral → local stitch-ref fallbacks (screen/ref art)
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
  if (
    ctype.includes("text/html") ||
    buf.slice(0, 15).toString("utf8").includes("<!DOCTYPE") ||
    buf.slice(0, 5).toString("utf8") === "<html"
  ) {
    throw new Error(`HTML not image: ${url}`);
  }
  fs.writeFileSync(dest, buf);
  return buf.length;
}

const urlMap = new Map();

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
    } else {
      console.log(`[${i}/${publicUrls.length}] ${hash} cached`);
    }
    urlMap.set(url, local);
  }
}

/** Prefer pack screen.png / art refs per consuming file */
const SCREEN_FALLBACKS = {
  "hub.html": [
    "/stitch-ref/0268/hub-portals-etalon.png",
    "/stitch-assets/login-hero.png",
    "/stitch-ref/0268/hub.png",
  ],
  "login.html": ["/stitch-assets/login-hero.png", "/stitch-ref/1b5c/login.png"],
  "collection.html": ["/stitch-ref/64d5/cat_portrait.png", "/stitch-ref/0268/collection.png", "/stitch-ref/ba17/pass.png"],
  "armor_sets.html": ["/stitch-ref/0268/gear.png", "/stitch-ref/0268/home.png"],
  "gear.html": ["/stitch-ref/home-keeper/sklad/screen.png", "/stitch-ref/0268/gear.png", "/stitch-ref/0268/home.png"],
  "class_sets.html": ["/stitch-ref/0268/gear.png", "/stitch-ref/64d5/heroes.png"],
  "home.html": ["/stitch-ref/home-keeper/personazh/screen.png", "/stitch-ref/0268/home.png", "/stitch-ref/64d5/cat_portrait.png"],
  "breeding.html": ["/stitch-ref/home-keeper/breeding/token-icon.png", "/stitch-ref/home-keeper/breeding/screen.png"],
  "craft.html": ["/stitch-ref/home-keeper/craft/art-1.png", "/stitch-ref/home-keeper/craft/art-2.png", "/stitch-ref/home-keeper/craft/screen.png"],
  "codex.html": ["/stitch-ref/64d5/heroes.png", "/stitch-ref/0268/hub.png"],
  "heroes.html": ["/stitch-ref/64d5/heroes.png", "/stitch-ref/64d5/cat_portrait.png"],
  "soon_farm.html": ["/stitch-ref/64d5/farm.png", "/stitch-ref/64d5/farm_map.png"],
  "yard.html": ["/stitch-ref/e608/yard.png", "/stitch-ref/e608/arena_interior.png", "/stitch-ref/64d5/cat_portrait.png"],
  "formation.html": ["/stitch-ref/e608/formation.png", "/stitch-ref/e608/battle_poster.png", "/stitch-ref/64d5/cat_portrait.png"],
  "battle.html": ["/stitch-ref/e608/battle.png", "/stitch-ref/e608/arena_interior.png", "/stitch-ref/64d5/cat_portrait.png"],
  "result_win.html": ["/stitch-ref/e608/result_win.png", "/stitch-ref/e608/victory_hall.png", "/stitch-ref/64d5/cat_portrait.png"],
  "boss_dungeon.html": ["/stitch-ref/4da7/boss_dungeon.png", "/stitch-ref/e608/arena_dojo.png", "/stitch-ref/64d5/cat_portrait.png"],
  "boss_raid.html": ["/stitch-ref/4da7/boss_raid.png", "/stitch-ref/e608/battle_poster.png", "/stitch-ref/64d5/cat_portrait.png"],
  "pvp.html": ["/stitch-ref/4da7/pvp.png", "/stitch-ref/e608/arena_dojo.png", "/stitch-ref/64d5/cat_portrait.png"],
  "pvp_load.html": [
    "/stitch-ref/pvp-battles/pvp-load.png",
    "/stitch-ref/pvp-battles/arena-versus.png",
    "/stitch-ref/pvp-battles/arena-ground.png",
    "/stitch-ref/battles-trade-guild-etalons/07-pvp-vs-loading.png",
  ],
  "pvp_fight.html": [
    "/stitch-ref/pvp-battles/arena-colosseum.png",
    "/stitch-ref/pvp-battles/pvp-fight.png",
    "/stitch-ref/e608/arena_interior.png",
  ],
  "pvp_victory.html": [
    "/stitch-ref/pvp-battles/pvp-victory.png",
    "/stitch-ref/e608/victory_hall.png",
    "/stitch-assets/cat-heroes/tank-a.webp",
  ],
  "guild_battle.html": ["/stitch-ref/4da7/guild_battle.png", "/stitch-ref/4da7/guild_fight.png", "/stitch-ref/64d5/cat_portrait.png"],
  "practice.html": ["/stitch-ref/18c7/practice.png", "/stitch-ref/e608/arena_dojo.png", "/stitch-ref/64d5/cat_portrait.png"],
  "practice_fight.html": [
    "/stitch-ref/e608/arena_dojo.png",
    "/stitch-ref/batch3-etalons/12-practice-dojo-fight.png",
    "/stitch-ref/battles-trade-guild-etalons/05-battle-ui.png",
    "/stitch-ref/64d5/cat_portrait.png",
  ],
  "guild.html": ["/stitch-ref/18c7/guild.png", "/stitch-ref/18c7/guild_interior_art.png", "/stitch-ref/64d5/cat_portrait.png"],
  "pass.html": ["/stitch-ref/pass-hearth/icon-1.png", "/stitch-ref/pass-hearth/icon-2.png", "/stitch-ref/pass-hearth/screen.png"],
  "chat_global.html": ["/stitch-ref/ba17/chat.png", "/stitch-ref/ba17/pass_sanctum.png", "/stitch-ref/64d5/cat_portrait.png"],
  "chat_guild.html": ["/stitch-ref/ba17/chat.png", "/stitch-ref/18c7/guild.png", "/stitch-ref/64d5/cat_portrait.png"],
  "chat_friends.html": ["/stitch-ref/ba17/chat.png", "/stitch-ref/0268/home.png", "/stitch-ref/64d5/cat_portrait.png"],
  "tavern.html": [
    "/stitch-ref/17eb/tavern.png",
    "/stitch-assets/tavern/milk-on-ice.jpg",
    "/stitch-ref/trade-painted/tavern-banner.png",
    "/stitch-ref/trade-painted/tavern-art-2.png",
    "/stitch-ref/trade-painted/tavern-art-3.png",
    "/stitch-ref/trade-painted/tavern-art-4.png",
    "/stitch-ref/trade-painted/tavern-art-5.png",
    "/stitch-ref/17eb/tavern_map.png",
    "/stitch-ref/64d5/cat_portrait.png",
  ],
  "shop.html": ["/stitch-ref/17eb/shop.png", "/stitch-ref/17eb/trade_hub.png", "/stitch-ref/64d5/cat_portrait.png"],
  "market.html": [
    "/stitch-ref/17eb/market.png",
    "/stitch-ref/trade-painted/market-screen.png",
    "/stitch-ref/17eb/trade_hub.png",
    "/stitch-ref/64d5/farm.png",
  ],
  "auction.html": [
    "/stitch-ref/17eb/auction.png",
    "/stitch-ref/trade-painted/auction-screen.png",
    "/stitch-ref/17eb/trade_hub.png",
    "/stitch-ref/0268/gear.png",
    "/stitch-ref/64d5/cat_portrait.png",
  ],
  "rating_players.html": ["/stitch-ref/17eb/rating.png", "/stitch-ref/ba17/pass.png", "/stitch-ref/64d5/cat_portrait.png"],
  "rating_guilds.html": ["/stitch-ref/17eb/rating.png", "/stitch-ref/18c7/guild.png", "/stitch-ref/64d5/cat_portrait.png"],
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
      const pubs = [...urlMap.values()];
      local = pubs.length ? pubs[urlMap.size % pubs.length] : "/stitch-ref/0268/hub.png";
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

await vendorPublic();
vendorEphemeral();
rewriteSources();

fs.writeFileSync(
  path.join(OUT, "manifest.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      packs: ["0268", "64d5", "e608", "4da7", "18c7", "ba17", "17eb", "1b5c"],
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
