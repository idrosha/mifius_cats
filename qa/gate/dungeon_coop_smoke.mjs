/**
 * Offline smoke for coop dungeons when `go` is unavailable.
 * Usage: node qa/gate/dungeon_coop_smoke.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

let fail = 0;
function ok(msg) {
  console.log(`PASS  ${msg}`);
}
function bad(msg) {
  fail += 1;
  console.error(`FAIL  ${msg}`);
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function resolveNodes(route, fork = "left") {
  if (!route?.nodes) return [];
  if (!route.forkF2) return route.nodes.slice();
  const side = fork === "right" ? "right" : "left";
  const forkNodes = route.forkF2[side] || [];
  const forkIds = new Set([...(route.forkF2.left || []), ...(route.forkF2.right || [])]);
  const prefix = [];
  for (const sid of route.nodes) {
    if (forkIds.has(sid)) break;
    prefix.push(sid);
  }
  return prefix.concat(forkNodes);
}

const catalogPath = path.join(root, "content", "campaign", "dungeons_coop_v1.json");
const rewardsPath = path.join(root, "content", "campaign", "dungeon_rewards_v1.json");
const raresPath = path.join(root, "content", "items", "dungeon_rares.json");
const doc = readJSON(catalogPath);
const rewards = readJSON(rewardsPath);
const raresDoc = readJSON(raresPath);

if (doc.version >= 3) ok(`catalog version=${doc.version}`);
else bad(`version=${doc.version} want ≥3`);

if (doc.party?.players === 4 && doc.party?.catsPerPlayer === 3 && doc.party?.combat === "3v3") {
  ok("party 4×3 · combat 3v3");
} else bad(`party ${JSON.stringify(doc.party)}`);

if (doc.party?.maxPlayers === 4) ok("maxPlayers=4 (not raid 12)");
else bad(`maxPlayers=${doc.party?.maxPlayers}`);

if (doc.timing?.shortMaxMin === 10 && doc.timing?.longMaxMin === 15) {
  ok("timing short≤10 / long≤15");
} else bad(`timing ${JSON.stringify(doc.timing)}`);

if (doc.starterKeys && Object.keys(doc.starterKeys).length === 3) ok("starterKeys ×3");
else bad("starterKeys missing");

if (Array.isArray(doc.dungeons) && doc.dungeons.length === 3) ok("3 dungeons");
else bad(`dungeons=${doc.dungeons?.length}`);

if (rewards?.bossLoot?.short && rewards?.bossLoot?.long && rewards?.firstClear?.guaranteeRare) {
  ok("rewards tables + firstClear");
} else bad("rewards incomplete");

const rareIds = new Set((raresDoc.items || []).map((x) => x.id));
if (rareIds.size >= 9) ok(`dungeon_rares items=${rareIds.size}`);
else bad(`rares=${rareIds.size}`);

const wantFaction = { scarlet: "red_dogs", howl: "wolves", whisper: "zombies" };
for (const d of doc.dungeons || []) {
  if (wantFaction[d.id] !== d.faction) bad(`${d.id} faction=${d.faction}`);
  else ok(`${d.id} faction=${d.faction}`);

  if (!d.rareItems || d.rareItems.length < 2) bad(`${d.id} rares`);
  else ok(`${d.id} rares=${d.rareItems.length}`);

  for (const r of d.rareItems) {
    if (!rareIds.has(r.id)) bad(`${d.id} rare ${r.id} not in dungeon_rares.json`);
  }

  const short = d.paths?.short;
  const long = d.paths?.long;
  if (!short?.nodes?.length || !long?.nodes?.length) {
    bad(`${d.id} missing paths`);
    continue;
  }
  if (long.nodes.length <= short.nodes.length) bad(`${d.id} long not longer`);
  else ok(`${d.id} long>${short.nodes.length} short nodes`);

  if (!(short.lootMult < long.lootMult)) bad(`${d.id} lootMult`);
  else ok(`${d.id} lootMult short<long`);

  if (!(short.chestTier < long.chestTier)) bad(`${d.id} chestTier`);
  else ok(`${d.id} chestTier short<long`);

  if (!long.forkF2?.left?.length || !long.forkF2?.right?.length) bad(`${d.id} forkF2`);
  else ok(`${d.id} forkF2 left/right`);

  const leftPath = resolveNodes(long, "left");
  const rightPath = resolveNodes(long, "right");
  if (leftPath.join() === rightPath.join()) bad(`${d.id} fork paths identical`);
  else ok(`${d.id} fork resolves differently (${leftPath.length} vs ${rightPath.length})`);

  const bossS = short.nodes[short.nodes.length - 1];
  const bossL = long.nodes[long.nodes.length - 1];
  if (!String(bossS).endsWith("_boss") || String(bossS).endsWith("_boss_long")) {
    bad(`${d.id} short boss id=${bossS}`);
  } else if (!String(bossL).endsWith("_boss_long")) {
    bad(`${d.id} long boss want *_boss_long got ${bossL}`);
  } else ok(`${d.id} short=${bossS} · long=${bossL} (+HP)`);

  for (const [pathName, route] of Object.entries(d.paths)) {
    const variants = pathName === "long" ? ["left", "right"] : [null];
    for (const fork of variants) {
      const nodes = pathName === "long" ? resolveNodes(route, fork) : route.nodes;
      for (const sid of nodes) {
        const stageFile = path.join(root, "content", "stages", `${sid}.json`);
        if (!fs.existsSync(stageFile)) {
          bad(`missing stage ${sid}`);
          continue;
        }
        const st = readJSON(stageFile);
        if (st.stageId !== sid) bad(`${sid} stageId field=${st.stageId}`);
        if (!Array.isArray(st.enemyTeam) || st.enemyTeam.length !== 3) {
          bad(`${sid} enemies=${st.enemyTeam?.length}`);
        }
        const isBoss = /_boss(_long)?$/.test(String(sid));
        if (st.meta?.rareDrop === true && !isBoss) {
          bad(`${sid} rareDrop on mid node`);
        }
        if (isBoss && st.meta?.rareDrop !== true) {
          bad(`${sid} boss missing rareDrop=true`);
        }
      }
      ok(`stages ok ${d.id}/${pathName}${fork ? "/" + fork : ""}`);
    }
  }
}

for (const rel of [
  "client/web-hud/public/content/dungeons_coop_v1.json",
  "client/web-hud/public/content/dungeon_rewards_v1.json",
  "client/web-hud/public/content/dungeon_rares.json",
]) {
  if (fs.existsSync(path.join(root, rel))) ok(`mirrored ${rel}`);
  else bad(`missing ${rel}`);
}

console.log("");
if (fail) {
  console.error(`RESULT FAIL (${fail})`);
  process.exit(1);
}
console.log("RESULT PASS — dungeon coop smoke v3");
process.exit(0);
