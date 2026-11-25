#!/usr/bin/env node
/**
 * Smoke: /api/dev/pvp/mm enqueue matches two waiters; leave clears own row.
 * HUD must be up: PORT=8099 node server.mjs
 */
const HUD = process.env.HUD_URL || "http://127.0.0.1:8099";

const teamA = ["shop_tank_fire", "shop_fighter_fire", "shop_support_water"];
const teamB = ["shop_tank_water", "shop_mage_fire", "shop_support_wind"];

async function post(path, body) {
  const res = await fetch(`${HUD}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function get(path) {
  const res = await fetch(`${HUD}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  await post("/api/dev/pvp/mm/leave", { userId: "mm_smoke_a" });
  await post("/api/dev/pvp/mm/leave", { userId: "mm_smoke_b" });

  const a1 = await post("/api/dev/pvp/mm/enqueue", {
    userId: "mm_smoke_a",
    name: "Alpha",
    team: teamA,
  });
  if (a1.status !== "waiting") throw new Error(`a1 expected waiting: ${JSON.stringify(a1)}`);

  const b1 = await post("/api/dev/pvp/mm/enqueue", {
    userId: "mm_smoke_b",
    name: "Beta",
    team: teamB,
  });
  if (b1.status !== "matched") throw new Error(`b1 expected matched: ${JSON.stringify(b1)}`);
  if (b1.opponent?.userId !== "mm_smoke_a") throw new Error("b1 opponent wrong");
  if (JSON.stringify(b1.opponent?.team) !== JSON.stringify(teamA)) throw new Error("b1 team wrong");
  if (b1.seat !== 1) throw new Error(`b1 seat want 1 got ${b1.seat}`);
  if (JSON.stringify(b1.team1) !== JSON.stringify(teamA)) throw new Error("b1 team1 wrong");
  if (JSON.stringify(b1.team2) !== JSON.stringify(teamB)) throw new Error("b1 team2 wrong");

  const a2 = await get("/api/dev/pvp/mm?userId=mm_smoke_a");
  if (a2.status !== "matched") throw new Error(`a2 expected matched: ${JSON.stringify(a2)}`);
  if (a2.opponent?.userId !== "mm_smoke_b") throw new Error("a2 opponent wrong");
  if (a2.seat !== 0) throw new Error(`a2 seat want 0 got ${a2.seat}`);
  if (a2.matchId !== b1.matchId) throw new Error("matchId mismatch");

  await post("/api/dev/pvp/mm/leave", { userId: "mm_smoke_a" });
  const a3 = await get("/api/dev/pvp/mm?userId=mm_smoke_a");
  if (a3.status !== "idle") throw new Error(`a3 expected idle: ${JSON.stringify(a3)}`);

  // B still has match until leave
  const b2 = await get("/api/dev/pvp/mm?userId=mm_smoke_b");
  if (b2.status !== "matched") throw new Error(`b2 expected matched still: ${JSON.stringify(b2)}`);
  await post("/api/dev/pvp/mm/leave", { userId: "mm_smoke_b" });

  console.log(JSON.stringify({ a1, b1, a2, a3 }, null, 2));
  console.log("smoke-pvp-mm-queue: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
