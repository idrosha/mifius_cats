#!/usr/bin/env node
/**
 * Smoke: PvE yard swap тыл↔авангард + CreatePvE team order (sim front→rear).
 * Run with HUD+devapi up: node client/web-hud/scripts/smoke-pve-swap-order.mjs
 */
const BATTLE = process.env.BATTLE_URL || "http://127.0.0.1:8088";

/** Mirror collectionPresetTemplateIds: visual [rear, mid, front] → sim [front, mid, rear]. */
function visualToSim(visual) {
  return [visual[2], visual[1], visual[0]];
}

function swapFrontRear(visual) {
  const next = [...visual];
  const t = next[0];
  next[0] = next[2];
  next[2] = t;
  return next;
}

async function createPvE(team) {
  const res = await fetch(`${BATTLE}/api/battle/v1/CreatePvE`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stageId: "mythmir_1_f1",
      team,
      potions: [],
      seed: 42,
      autoPlay: false,
    }),
  });
  if (!res.ok) throw new Error(`CreatePvE ${res.status}: ${await res.text()}`);
  return res.json();
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  // Screenshot state: tank in тыл, heal in авангард (wrong).
  const wrongVisual = ["shop_tank_fire", "shop_fighter_fire", "shop_support_water"];
  const swapped = swapFrontRear(wrongVisual);
  assert(
    swapped.join(",") === "shop_support_water,shop_fighter_fire,shop_tank_fire",
    `swap visual want support·fighter·tank, got ${swapped.join(",")}`,
  );
  const sim = visualToSim(swapped);
  assert(
    sim.join(",") === "shop_tank_fire,shop_fighter_fire,shop_support_water",
    `sim want tank·fighter·support, got ${sim.join(",")}`,
  );

  const data = await createPvE(sim);
  const tplOf = (u) => {
    if (u.templateId) return u.templateId;
    const m = String(u.id || "").match(/shop_[a-z0-9_]+/);
    return m ? m[0] : u.id;
  };
  const byLane = {};
  for (const u of data?.units || []) {
    if (u.side === 0) byLane[u.lane] = { tpl: tplOf(u), role: u.role };
  }
  assert(byLane[0]?.role === "tank", `lane0 want tank, got ${JSON.stringify(byLane[0])}`);
  assert(byLane[1]?.role === "fighter", `lane1 want fighter, got ${JSON.stringify(byLane[1])}`);
  assert(byLane[2]?.role === "support", `lane2 want support, got ${JSON.stringify(byLane[2])}`);
  assert(byLane[0]?.tpl === "shop_tank_fire", `lane0 tpl want shop_tank_fire, got ${byLane[0]?.tpl}`);
  assert(byLane[2]?.tpl === "shop_support_water", `lane2 tpl want shop_support_water, got ${byLane[2]?.tpl}`);
  console.log(
    "PASS swap→CreatePvE lanes",
    [0, 1, 2].map((l) => `${byLane[l].role}:${byLane[l].tpl}`).join(" · "),
  );
  console.log("visual after swap:", swapped.join(" · "));
  console.log("sim team sent:", sim.join(" · "));
}

main().catch((err) => {
  console.error("FAIL", err.message || err);
  process.exit(1);
});
