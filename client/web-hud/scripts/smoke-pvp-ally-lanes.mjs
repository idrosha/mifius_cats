#!/usr/bin/env node
/**
 * Smoke: PvP ally paint L→R = тыл · центр · авангард (D-034).
 * Needs battle/devapi (proxy via HUD or BATTLE_URL).
 * HUD optional: only used as CreatePvP proxy when BATTLE_URL unset.
 *
 * Also guards the collection→CreatePvP double-flip: grant/collection
 * slots are visual; team1 must be sim front→rear before PRACTICE_VISUAL_LANES.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BATTLE = (process.env.BATTLE_URL || process.env.HUD_URL || "http://127.0.0.1:8099").replace(
  /\/$/,
  "",
);
/** Same remap as PRACTICE_VISUAL_LANES / renderPracticeFight / renderPvpFight. */
const VISUAL_LANES = [2, 1, 0];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** Mirror collectionPresetTemplateIds: visual [rear, mid, front] → sim [front, mid, rear]. */
function visualToSim(visual) {
  return [visual[2], visual[1], visual[0]];
}

async function createPvP(team1, team2) {
  const res = await fetch(`${BATTLE}/api/battle/v1/CreatePvP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matchId: `smoke_lanes_${Date.now()}`,
      team1,
      team2,
      seed: 42,
      autoPlay: false,
    }),
  });
  if (!res.ok) throw new Error(`CreatePvP ${res.status}: ${await res.text()}`);
  return res.json();
}

function paintAllies(units) {
  const listBySide = (side) => (units || []).filter((u) => u.side === side);
  return VISUAL_LANES.map((lane) => listBySide(0).find((u) => u.lane === lane)).filter(Boolean);
}

function paintEnemies(units) {
  return (units || []).filter((u) => u.side === 1).slice().sort((a, b) => a.lane - b.lane);
}

function rolesByLane(units, side = 0) {
  const byLane = {};
  for (const u of units || []) {
    if (u.side === side) byLane[u.lane] = u.role;
  }
  return byLane;
}

async function main() {
  const appJs = readFileSync(join(ROOT, "public/app.js"), "utf8");
  const serverJs = readFileSync(join(ROOT, "server.mjs"), "utf8");
  const fnStart = appJs.indexOf("function renderPvpFight()");
  assert(fnStart >= 0, "renderPvpFight missing");
  const slice = appJs.slice(fnStart, fnStart + 2200);
  assert(
    /PRACTICE_VISUAL_LANES\.map\(\(lane\) => listBySide\(0\)/.test(slice),
    "renderPvpFight must remap allies via PRACTICE_VISUAL_LANES (D-034)",
  );
  assert(
    !/side === 0\)\.sort\(\(a, b\) => a\.lane - b\.lane\)/.test(slice),
    "renderPvpFight must not paint allies in raw sim lane order",
  );

  // Grant must seed visual [тыл, центр, авангард] = cats[2], cats[1], cats[0].
  assert(
    /catIds:\s*\[\s*cats\[2\]\.catId\s*,\s*cats\[1\]\.catId\s*,\s*cats\[0\]\.catId\s*\]/.test(serverJs),
    "grantStarterKit must seed collection presets in visual order (cats[2],cats[1],cats[0])",
  );
  assert(
    !/catIds:\s*\[\s*cats\[0\]\.catId\s*,\s*cats\[1\]\.catId\s*,\s*cats\[2\]\.catId\s*\]/.test(serverJs),
    "grantStarterKit must not seed sim order into visual collection slots",
  );
  // pvp-load / VS: ally remapped, foe raw sim (tank nearest VS on both sides).
  const loadStart = appJs.indexOf("function pvpLoadRosters()");
  assert(loadStart >= 0, "pvpLoadRosters missing");
  const loadSlice = appJs.slice(loadStart, loadStart + 900);
  assert(
    /ally:\s*pvpVisualRoster\(state\.pvpSquad\)/.test(loadSlice),
    "pvp-load ally must use pvpVisualRoster (D-034)",
  );
  assert(
    /foe:\s*pvpFoeRoster\(state\.pvpOpponentTeam\)/.test(loadSlice),
    "pvp-load foe must use pvpFoeRoster (raw sim, tank nearest VS)",
  );
  assert(
    !/foe:\s*pvpVisualRoster\(state\.pvpOpponentTeam\)/.test(loadSlice),
    "pvp-load foe must not reuse ally PRACTICE_VISUAL_LANES remap",
  );

  const team2 = ["shop_tank_fire", "shop_fighter_fire", "shop_support_water"];

  // --- Path A: sim-order team1 (correct CreatePvP contract) ---
  const simTeam = ["shop_tank_wind", "shop_ranger_water", "shop_support_fire"];
  const dataSim = await createPvP(simTeam, team2);
  const byLaneSim = rolesByLane(dataSim.units);
  assert(byLaneSim[0] === "tank", `sim lane0 want tank, got ${byLaneSim[0]}`);
  assert(byLaneSim[2] === "support", `sim lane2 want support, got ${byLaneSim[2]}`);
  const alliesSim = paintAllies(dataSim.units);
  const foes = paintEnemies(dataSim.units);
  const allyRolesSim = alliesSim.map((u) => u.role);
  const foeRoles = foes.map((u) => u.role);
  assert(
    allyRolesSim[0] === "support" && allyRolesSim[allyRolesSim.length - 1] === "tank",
    `allies L→R want support…tank, got ${allyRolesSim.join("·")}`,
  );
  assert(
    foeRoles[0] === "tank" && foeRoles[foeRoles.length - 1] === "support",
    `foes L→R want tank…support, got ${foeRoles.join("·")}`,
  );

  // --- Path B: collection visual → sim flip (live PvP from collection) ---
  // Visual slots = support · fighter · tank (тыл · центр · авангард).
  const visualSquad = ["shop_support_water", "shop_fighter_fire", "shop_tank_fire"];
  const fromCollection = visualToSim(visualSquad);
  assert(
    fromCollection.join(",") === "shop_tank_fire,shop_fighter_fire,shop_support_water",
    `collectionPresetTemplateIds mirror want tank·fighter·support, got ${fromCollection.join(",")}`,
  );
  const dataCol = await createPvP(fromCollection, team2);
  const byLaneCol = rolesByLane(dataCol.units);
  assert(byLaneCol[0] === "tank", `collection→sim lane0 want tank, got ${byLaneCol[0]}`);
  assert(byLaneCol[2] === "support", `collection→sim lane2 want support, got ${byLaneCol[2]}`);
  const alliesCol = paintAllies(dataCol.units).map((u) => u.role);
  assert(
    alliesCol[0] === "support" && alliesCol[alliesCol.length - 1] === "tank",
    `collection path allies L→R want support…tank, got ${alliesCol.join("·")}`,
  );

  // --- Path C: double-flip regression (legacy grant sim seed as team1) ---
  // If visual slots were wrongly seeded sim and then flipped again → team1 is visual.
  // Painting that with PRACTICE_VISUAL_LANES puts tank leftmost (the verified bug).
  const legacyDoubleFlipTeam = visualToSim(["shop_tank_fire", "shop_fighter_fire", "shop_support_water"]);
  assert(
    legacyDoubleFlipTeam.join(",") === "shop_support_water,shop_fighter_fire,shop_tank_fire",
    "legacy sim-seed + flip yields visual team1",
  );
  const dataBad = await createPvP(legacyDoubleFlipTeam, team2);
  const alliesBad = paintAllies(dataBad.units).map((u) => u.role);
  assert(
    alliesBad[0] === "tank" && alliesBad[alliesBad.length - 1] === "support",
    `double-flip paint should show tank leftmost (bug shape), got ${alliesBad.join("·")}`,
  );
  // Document: this shape must not be produced by grant→collectionPresetTemplateIds anymore.

  console.log("PASS PvP visual lanes", {
    sim: [0, 1, 2].map((l) => byLaneSim[l]).join("·"),
    alliesLR: allyRolesSim.join("·"),
    foesLR: foeRoles.join("·"),
    collectionLR: alliesCol.join("·"),
    doubleFlipBugShape: alliesBad.join("·"),
  });
}

main().catch((err) => {
  console.error("FAIL", err.message || err);
  process.exit(1);
});
