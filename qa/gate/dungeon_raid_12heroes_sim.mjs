import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CONTENT = path.join(ROOT, "content");
const ASSETS = path.join(ROOT, "client/web-hud/public/stitch-assets");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Load real cat catalog, parts, cards, i18n
const catsArr = readJson(path.join(CONTENT, "cats/shop_common.json"));
const catsById = Object.fromEntries(catsArr.map((c) => [c.templateId, c]));
const partsArr = readJson(path.join(CONTENT, "parts/shop_common.json"));
const partsById = Object.fromEntries(partsArr.map((p) => [p.partId, p]));
const i18n = readJson(path.join(CONTENT, "i18n/ru_en.json"));

const cardsById = {};
for (const f of fs.readdirSync(path.join(CONTENT, "cards"))) {
  if (!f.endsWith(".json")) continue;
  const c = readJson(path.join(CONTENT, "cards", f));
  if (c.cardId) cardsById[c.cardId] = c;
}

// 12-hero party: 3 Tanks, 6 DPS, 3 Supports (4 squads of 3)
const LEGION_12 = [
  ["shop_tank_fire", "shop_fighter_fire", "shop_support_fire"],
  ["shop_tank_water", "shop_fighter_water", "shop_support_water"],
  ["shop_tank_wind", "shop_ranger_wind", "shop_support_wind"],
  ["shop_ranger_fire", "shop_mage_water", "shop_assassin_fire"],
];

function buildCatUnit(tid) {
  const tpl = catsById[tid];
  if (!tpl) throw new Error(`Missing cat template: ${tid}`);
  const deck = [];
  for (const partId of Object.values(tpl.parts || {})) {
    const part = partsById[partId];
    if (part?.cardId && cardsById[part.cardId]) {
      deck.push(cardsById[part.cardId]);
    }
  }
  return {
    id: tid,
    role: tpl.role,
    maxHp: tpl.baseStats.hp,
    hp: tpl.baseStats.hp,
    atk: tpl.baseStats.atk,
    spd: tpl.baseStats.spd,
    shield: 0,
    taunt: 0,
    stun: 0,
    burn: 0,
    bleed: 0,
    poison: 0,
    weak: 0,
    fragile: 0,
    deck,
    cardIdx: 0,
  };
}

function buildEnemyUnit(e) {
  return {
    id: e.templateId,
    role: e.role,
    maxHp: e.baseStats.hp,
    hp: e.baseStats.hp,
    atk: e.baseStats.atk,
    spd: e.baseStats.spd,
    shield: 0,
    taunt: 0,
    stun: 0,
    burn: 0,
    bleed: 0,
    poison: 0,
    weak: 0,
    fragile: 0,
    deck: e.deck || [],
    cardIdx: 0,
  };
}

function pickTarget(opponents, rule) {
  const alive = opponents.filter((u) => u.hp > 0);
  if (!alive.length) return [];
  if (rule === "all_enemies") return alive;
  const taunters = alive.filter((u) => u.taunt > 0);
  if (taunters.length) return [taunters[0]];
  if (rule === "lowest_hp") return [alive.slice().sort((a, b) => a.hp - b.hp)[0]];
  return [alive[0]];
}

function applyCard(actor, card, allies, enemies) {
  if (!card || actor.hp <= 0) return;
  if (card.shield > 0) {
    if (card.targetRule === "ally_lowest_hp") {
      const t = allies.filter((u) => u.hp > 0).sort((a, b) => a.hp - b.hp)[0] || actor;
      t.shield += card.shield;
    } else {
      actor.shield += card.shield;
    }
  }
  const hits = card.hits || (card.atk > 0 ? 1 : 0);
  if (hits > 0 && card.atk > 0) {
    const targets = pickTarget(enemies, card.targetRule || "nearest");
    for (const t of targets) {
      for (let h = 0; h < hits; h++) {
        let dmg = card.atk + Math.floor((actor.atk || 0) * 0.5);
        if (actor.weak > 0) dmg = Math.max(1, Math.floor(dmg * 0.75));
        if (t.fragile > 0) dmg = Math.ceil(dmg * 1.25);
        const pierce = (card.tags || []).includes("pierce");
        if (!pierce && t.shield > 0) {
          const absorbed = Math.min(t.shield, dmg);
          t.shield -= absorbed;
          dmg -= absorbed;
        }
        t.hp = Math.max(0, t.hp - dmg);
      }
      for (const op of card.effectOps || []) {
        if (op.op === "apply_status") {
          if (op.status === "burn") t.burn += op.stacks || 1;
          if (op.status === "bleed") t.bleed += op.stacks || 1;
          if (op.status === "poison") t.poison += op.stacks || 1;
          if (op.status === "weak") t.weak = Math.max(t.weak, op.duration || 1);
          if (op.status === "fragile") t.fragile = Math.max(t.fragile, op.duration || 1);
          if (op.status === "stun") t.stun = Math.max(t.stun, op.duration || 1);
        }
      }
    }
  }
  for (const op of card.effectOps || []) {
    if (op.op === "heal") {
      const t = allies.filter((u) => u.hp > 0).sort((a, b) => a.hp - b.hp)[0] || actor;
      t.hp = Math.min(t.maxHp, t.hp + (op.amount || 5));
    }
    if (op.op === "apply_status" && op.status === "taunt") {
      actor.taunt = Math.max(actor.taunt, op.duration || 2);
    }
  }
}

function tickDot(team) {
  for (const u of team) {
    if (u.hp <= 0) continue;
    const dot = (u.burn > 0 ? 2 : 0) + (u.bleed > 0 ? 2 : 0) + (u.poison > 0 ? u.poison : 0);
    if (dot > 0) u.hp = Math.max(0, u.hp - dot);
    if (u.burn > 0) u.burn--;
    if (u.bleed > 0) u.bleed--;
    if (u.taunt > 0) u.taunt--;
    if (u.weak > 0) u.weak--;
    if (u.fragile > 0) u.fragile--;
    u.shield = Math.floor(u.shield * 0.5);
  }
}

// Simulate a stage with the 12-hero legion (4 squads of 3 cats rotating / relaying)
function simulateStageWithLegion12(stageJson) {
  const enemies = stageJson.enemyTeam.map(buildEnemyUnit);
  let totalTurns = 0;
  let squadsUsed = 0;

  for (let s = 0; s < LEGION_12.length; s++) {
    if (enemies.every((e) => e.hp <= 0)) break;
    squadsUsed++;
    const allies = LEGION_12[s].map(buildCatUnit);

    for (let turn = 1; turn <= 60; turn++) {
      totalTurns++;
      // Allies act (2 cards per turn per alive cat, matching 3-energy + combo pace)
      for (const a of allies) {
        if (a.hp <= 0) continue;
        if (a.stun > 0) {
          a.stun--;
          continue;
        }
        const c1 = a.deck[a.cardIdx % a.deck.length];
        a.cardIdx++;
        applyCard(a, c1, allies, enemies);
        if (enemies.every((e) => e.hp <= 0)) break;
      }
      if (enemies.every((e) => e.hp <= 0)) return { win: true, turns: totalTurns, squadsUsed };

      // Enemies act
      for (const e of enemies) {
        if (e.hp <= 0) continue;
        if (e.stun > 0) {
          e.stun--;
          continue;
        }
        const c1 = e.deck[e.cardIdx % e.deck.length];
        e.cardIdx++;
        applyCard(e, c1, enemies, allies);
        if (allies.every((a) => a.hp <= 0)) break;
      }
      tickDot(allies);
      tickDot(enemies);
      if (enemies.every((e) => e.hp <= 0)) return { win: true, turns: totalTurns, squadsUsed };
      if (allies.every((a) => a.hp <= 0)) break;
    }
  }
  return { win: enemies.every((e) => e.hp <= 0), turns: totalTurns, squadsUsed };
}

// 1. Verify assets
const requiredAssets = [
  "modes/dungeon-scarlet-bg.webp",
  "modes/dungeon-howl-bg.webp",
  "modes/dungeon-whisper-bg.webp",
  "modes/raid-myaurra-bg.webp",
  "modes/raid-talass-bg.webp",
  "modes/raid-vulcan-bg.webp",
  "monsters/battle/solar-lion-support-cutout.webp",
  "monsters/battle/deep-lynx-fighter-cutout.webp",
  "monsters/battle/kitsune-tank-cutout.webp",
];
for (const rel of requiredAssets) {
  const full = path.join(ASSETS, rel);
  if (!fs.existsSync(full)) throw new Error(`Missing required asset: ${rel}`);
}
console.log(`[OK] All ${requiredAssets.length} location & monster assets exist.`);

// 2. Verify 12-hero party composition: 3 Tanks, 6 DPS, 3 Supports
let tanks = 0, dps = 0, supports = 0;
for (const sq of LEGION_12) {
  for (const tid of sq) {
    const r = catsById[tid]?.role;
    if (r === "tank") tanks++;
    else if (r === "support") supports++;
    else dps++;
  }
}
if (tanks !== 3 || dps !== 6 || supports !== 3) {
  throw new Error(`Invalid 12-hero comp: ${tanks}T/${dps}DPS/${supports}S`);
}
console.log(`[OK] 12-hero party verified: ${tanks} Tanks, ${dps} DPS, ${supports} Supports.`);

// 3. Verify all 3 Dungeons + all 3 Raids (every stage, roles, 4 cards, i18n, and 12-hero clear!)
const dungeonsDoc = readJson(path.join(CONTENT, "campaign/dungeons_coop_v1.json"));
const raidsDoc = readJson(path.join(CONTENT, "campaign/raids_sl.json"));

let passed = 0;
let failed = 0;

function checkStage(label, stageId) {
  const stage = readJson(path.join(CONTENT, "stages", `${stageId}.json`));
  for (const e of stage.enemyTeam) {
    if (!e.role) throw new Error(`${stageId}/${e.templateId} missing role`);
    if (!e.deck || e.deck.length < 4) throw new Error(`${stageId}/${e.templateId} has ${e.deck?.length || 0} cards (want 4)`);
    for (const c of e.deck) {
      if (!i18n.ru[c.name_key] || !i18n.en[c.name_key]) {
        throw new Error(`${stageId}/${e.templateId} missing i18n for ${c.name_key}`);
      }
    }
  }
  const res = simulateStageWithLegion12(stage);
  if (res.win) {
    passed++;
    console.log(`  [PASS] ${label} (${stageId}) -> WIN in ${res.turns} turns (squads used: ${res.squadsUsed}/4)`);
  } else {
    failed++;
    console.error(`  [FAIL] ${label} (${stageId}) -> DEFEAT after ${res.turns} turns`);
  }
}

console.log("\n=== 3 DUNGEONS (short + long) ===");
for (const d of dungeonsDoc.dungeons) {
  for (const [pName, pObj] of Object.entries(d.paths)) {
    for (const sid of pObj.nodes) {
      checkStage(`dungeon:${d.id}/${pName}`, sid);
    }
  }
}

console.log("\n=== 3 RAIDS (short + long) ===");
for (const r of raidsDoc.raids) {
  for (const [pName, pObj] of Object.entries(r.paths)) {
    for (const sid of pObj.nodes) {
      checkStage(`raid:${r.raidId}/${pName}`, sid);
    }
  }
}

console.log(`\nSUMMARY: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
