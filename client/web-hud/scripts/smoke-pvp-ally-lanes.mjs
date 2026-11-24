#!/usr/bin/env node
/**
 * Smoke: PvP ally paint L→R = тыл · центр · авангард (D-034).
 * Needs battle/devapi (proxy via HUD or BATTLE_URL).
 * HUD optional: only used as CreatePvP proxy when BATTLE_URL unset.
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

async function createPvP() {
  const team1 = ["shop_tank_wind", "shop_ranger_water", "shop_support_fire"];
  const team2 = ["shop_tank_fire", "shop_fighter_fire", "shop_support_water"];
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

async function main() {
  const appJs = readFileSync(join(ROOT, "public/app.js"), "utf8");
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

  const data = await createPvP();
  const byLane = {};
  for (const u of data.units || []) {
    if (u.side === 0) byLane[u.lane] = u.role;
  }
  assert(byLane[0] === "tank", `sim lane0 want tank, got ${byLane[0]}`);
  assert(byLane[2] === "support", `sim lane2 want support, got ${byLane[2]}`);

  const allies = paintAllies(data.units);
  const foes = paintEnemies(data.units);
  const allyRoles = allies.map((u) => u.role);
  const foeRoles = foes.map((u) => u.role);
  assert(
    allyRoles[0] === "support" && allyRoles[allyRoles.length - 1] === "tank",
    `allies L→R want support…tank, got ${allyRoles.join("·")}`,
  );
  assert(
    foeRoles[0] === "tank" && foeRoles[foeRoles.length - 1] === "support",
    `foes L→R want tank…support, got ${foeRoles.join("·")}`,
  );
  console.log("PASS PvP visual lanes", {
    sim: [0, 1, 2].map((l) => byLane[l]).join("·"),
    alliesLR: allyRoles.join("·"),
    foesLR: foeRoles.join("·"),
  });
}

main().catch((err) => {
  console.error("FAIL", err.message || err);
  process.exit(1);
});
