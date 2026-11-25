#!/usr/bin/env node
/**
 * Smoke: live PvP — two seats join one battle; alternating turns; deadline armed.
 * Needs HUD (proxy) + battle: PORT=8099 node server.mjs + battle-devapi :8081
 */
const HUD = (process.env.HUD_URL || "http://127.0.0.1:8099").replace(/\/$/, "");

const teamA = ["shop_tank_fire", "shop_fighter_fire", "shop_support_water"];
const teamB = ["shop_tank_water", "shop_mage_fire", "shop_support_wind"];

async function post(path, body) {
  const res = await fetch(`${HUD}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(`${path} ${res.status}: ${text}`);
  return data;
}

async function get(path) {
  const res = await fetch(`${HUD}${path}`);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(`${path} ${res.status}: ${text}`);
  return data;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  await post("/api/dev/pvp/mm/leave", { userId: "live_a" });
  await post("/api/dev/pvp/mm/leave", { userId: "live_b" });

  const a1 = await post("/api/dev/pvp/mm/enqueue", {
    userId: "live_a",
    name: "Login1",
    team: teamA,
  });
  assert(a1.status === "waiting", `a waiting: ${JSON.stringify(a1)}`);

  const b1 = await post("/api/dev/pvp/mm/enqueue", {
    userId: "live_b",
    name: "Login2",
    team: teamB,
  });
  assert(b1.status === "matched", `b matched: ${JSON.stringify(b1)}`);
  assert(b1.seat === 1, `b seat 1, got ${b1.seat}`);
  assert(b1.matchId, "b matchId");
  assert(JSON.stringify(b1.team1) === JSON.stringify(teamA), "team1 = A");
  assert(JSON.stringify(b1.team2) === JSON.stringify(teamB), "team2 = B");

  const a2 = await get("/api/dev/pvp/mm?userId=live_a");
  assert(a2.status === "matched" && a2.seat === 0, `a seat0: ${JSON.stringify(a2)}`);
  assert(a2.matchId === b1.matchId, "same matchId");

  const matchId = a2.matchId;
  let seed = 0;
  for (let i = 0; i < matchId.length; i++) seed = (seed * 31 + matchId.charCodeAt(i)) >>> 0;
  if (!seed) seed = 20261104;

  const createBody = (seat) => ({
    matchId,
    team1: teamA,
    team2: teamB,
    seed,
    autoPlay: false,
    humanP2: true,
    turnTimerSec: 30,
    seat,
  });

  const p1 = await post("/api/battle/v1/CreatePvP", createBody(0));
  const p2 = await post("/api/battle/v1/CreatePvP", createBody(1));
  assert(p1.battleId && p1.battleId === p2.battleId, `same battleId ${p1.battleId} vs ${p2.battleId}`);
  assert(p1.active === 0, "P1 starts");
  assert(p1.p2Human === true, "p2Human");
  assert(p1.turnDeadlineUnix > 0, "deadline armed");
  assert(Array.isArray(p1.hand) && p1.hand.length > 0, "seat0 sees hand");
  assert(Array.isArray(p2.hand) && p2.hand.length === 0, "seat1 no hand on P1 turn");

  const afterEnd = await post("/api/battle/v1/SubmitAction", {
    battleId: p1.battleId,
    seat: 0,
    action: { kind: "endTurn" },
  });
  assert(afterEnd.active === 1, `after P1 endTurn active=P2, got ${afterEnd.active}`);

  const poll = await get(
    `/api/battle/v1/GetBattle?battleId=${encodeURIComponent(p1.battleId)}&seat=1`,
  );
  assert(poll.active === 1, "poll seat1 active");
  assert(Array.isArray(poll.hand) && poll.hand.length > 0, "seat1 hand on own turn");
  assert(poll.canEndTurn === true, "seat1 canEndTurn");

  const reject = await fetch(`${HUD}/api/battle/v1/SubmitAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      battleId: p1.battleId,
      seat: 0,
      action: { kind: "endTurn" },
    }),
  });
  assert(reject.status === 400, "seat0 cannot act on P2 turn");

  const p2end = await post("/api/battle/v1/SubmitAction", {
    battleId: p1.battleId,
    seat: 1,
    action: { kind: "endTurn" },
  });
  assert(p2end.active === 0, `after P2 endTurn back to P1, got ${p2end.active}`);

  await post("/api/dev/pvp/mm/leave", { userId: "live_a" });
  await post("/api/dev/pvp/mm/leave", { userId: "live_b" });

  console.log(
    JSON.stringify(
      {
        matchId,
        battleId: p1.battleId,
        turnLeftSec: p1.turnLeftSec,
        afterP1: afterEnd.active,
        afterP2: p2end.active,
      },
      null,
      2,
    ),
  );
  console.log("smoke-pvp-live-sync: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
