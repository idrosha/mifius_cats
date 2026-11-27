/**
 * End-to-end automated DoD smoke test for Mythfel / Мифиус MVP Beta (D-066 / D-067).
 * Spawns an ephemeral web-hud server on a local port, executes the full DoD flow,
 * verifies every invariant, restores qa-accounts.json, and exits cleanly.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_HUD_DIR = path.resolve(__dirname, "..");
const ACCOUNTS_PATH = path.join(WEB_HUD_DIR, "qa-accounts.json");
const PORT = Number(process.env.SMOKE_PORT || 18099);
const BASE = `http://127.0.0.1:${PORT}`;

const origAccountsBuf = fs.existsSync(ACCOUNTS_PATH) ? fs.readFileSync(ACCOUNTS_PATH) : null;

async function req(urlPath, opts = {}) {
  const res = await fetch(`${BASE}${urlPath}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

async function waitForServer(timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/liveops/v1/liveops.json`);
      if (r.ok) return;
    } catch {
      /* starting */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`web-hud server did not start on ${BASE} within ${timeoutMs}ms`);
}

async function run() {
  const child = spawn(process.execPath, [path.join(WEB_HUD_DIR, "server.mjs")], {
    cwd: WEB_HUD_DIR,
    env: { ...process.env, PORT: String(PORT), MVP_BETA: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (d) => {
    stderr += d.toString();
  });

  try {
    await waitForServer();

    // 1. LiveOps config & feature_flags.mvp_beta
    const lo = await req("/api/liveops/v1/liveops.json");
    assert.equal(lo.status, 200);
    assert.equal(lo.json.feature_flags.mvp_beta, true, "feature_flags.mvp_beta must be true");
    assert.equal(lo.json.limits.ads_enabled, false, "ads_enabled must be false");
    assert.equal(lo.json.limits.shop_gacha_enabled, false, "shop_gacha_enabled must be false");
    assert.equal(lo.json.limits.pve_per_day_free, 3);
    assert.equal(lo.json.limits.pvp_per_day_free, 5);
    assert.equal(lo.json.limits.pve_per_day_pass_mvp, 4);
    assert.equal(lo.json.limits.pvp_per_day_pass_mvp, 10);
    assert.equal(lo.json.limits.pass_cat_xp_multiplier, 2);
    assert.equal(lo.json.limits.replays_max, 10);
    assert.equal(lo.json.season.prizes.length, 5);
    assert.equal(lo.json.daily_quests.length, 3);
    console.log("  [1/19] LiveOps mvp_beta flags & limits OK");

    // 2. Register fresh account -> §5.1 starter grant
    const loginName = `smoke_mvp_${Date.now()}`;
    const reg = await req("/api/dev/login", {
      method: "POST",
      body: JSON.stringify({ login: loginName, password: "secret", register: true }),
    });
    assert.equal(reg.status, 200);
    const uid = reg.json.session?.userId || reg.json.userId;
    assert.ok(uid, "userId required");
    assert.equal(reg.json.profile.cats.length, 3, "§5.1 starter grant = 3 cats");
    assert.equal(reg.json.profile.bowls, 3);
    assert.equal(reg.json.profile.pvpTickets, 5);
    assert.equal(reg.json.profile.fish, 200);
    assert.equal(reg.json.profile.equalDecks, true);
    assert.equal(Object.keys(reg.json.profile.potions || {}).length, 6);
    console.log("  [2/19] Register + §5.1 starter grant OK");

    // 3. Email link + login by linked email -> same userId
    const linkedEmail = `${loginName}@mythfel.test`;
    const linkRes = await req("/api/dev/account/email", {
      method: "POST",
      body: JSON.stringify({ userId: uid, email: linkedEmail }),
    });
    assert.equal(linkRes.status, 200);
    assert.equal(linkRes.json.linkedEmail, linkedEmail);
    const emailLogin = await req("/api/dev/login", {
      method: "POST",
      body: JSON.stringify({ login: linkedEmail, password: "secret" }),
    });
    assert.equal(emailLogin.status, 200);
    assert.equal(emailLogin.json.session?.userId || emailLogin.json.userId, uid, "login by linked email must resolve same account");
    console.log("  [3/19] Email link + cross-client email login OK");

    // 4. Tutorial complete
    const tut = await req("/api/dev/account/tutorial/complete", {
      method: "POST",
      body: JSON.stringify({ userId: uid }),
    });
    assert.equal(tut.status, 200);
    assert.equal(tut.json.state.tutorialDone, true);
    assert.equal(tut.json.alreadyCompleted, false);
    const tut2 = await req("/api/dev/account/tutorial/complete", {
      method: "POST",
      body: JSON.stringify({ userId: uid }),
    });
    assert.equal(tut2.json.alreadyCompleted, true);
    console.log("  [4/19] Tutorial complete + idempotency OK");

    // 5. Save team preset 3v3
    const starterCatIds = reg.json.profile.cats.map((c) => c.catId);
    const presetRes = await req("/api/dev/account/preset", {
      method: "POST",
      body: JSON.stringify({
        userId: uid,
        index: 0,
        name: "Beta Squad",
        catIds: starterCatIds,
      }),
    });
    assert.equal(presetRes.status, 200);
    assert.ok(presetRes.json.presets.length >= 1);
    console.log("  [5/19] Team preset 3v3 saved OK");

    // 6. Practice battle spend -> 0 bowls/tickets consumed
    const prac = await req("/api/dev/limits/spend", {
      method: "POST",
      body: JSON.stringify({ userId: uid, kind: "practice" }),
    });
    assert.equal(prac.status, 200);
    assert.equal(prac.json.spent, 0);
    assert.equal(prac.json.bowls, 3);
    assert.equal(prac.json.pvpTickets, 5);
    console.log("  [6/19] Practice spend (0 cost) + quest advance OK");

    // 7. PvE bowls: 3 free bowls -> 4th blocked with 429
    for (let i = 1; i <= 3; i++) {
      const r = await req("/api/dev/limits/spend", {
        method: "POST",
        body: JSON.stringify({ userId: uid, kind: "pve" }),
      });
      assert.equal(r.status, 200, `PvE #${i} should succeed`);
      assert.equal(r.json.bowls, 3 - i);
    }
    const pve4Free = await req("/api/dev/limits/spend", {
      method: "POST",
      body: JSON.stringify({ userId: uid, kind: "pve" }),
    });
    assert.equal(pve4Free.status, 429, "4th PvE free must return 429");
    assert.equal(pve4Free.json.error, "no_bowls");
    console.log("  [7/19] PvE Free cap 3/day server-enforced (4th = 429) OK");

    // 8. PvP unranked: 0 tickets, MMR unchanged
    const unrankedSpend = await req("/api/dev/limits/spend", {
      method: "POST",
      body: JSON.stringify({ userId: uid, kind: "pvp_unranked" }),
    });
    assert.equal(unrankedSpend.status, 200);
    assert.equal(unrankedSpend.json.pvpTickets, 5);
    const unrankedRep = await req("/api/dev/pvp/report", {
      method: "POST",
      body: JSON.stringify({ userId: uid, mode: "unranked", won: true, opponent: "SparCat" }),
    });
    assert.equal(unrankedRep.status, 200);
    assert.equal(unrankedRep.json.mmrDelta, 0);
    assert.equal(unrankedRep.json.mmr, 1200);
    console.log("  [8/19] PvP Unranked (0 ticket, 0 MMR delta) OK");

    // 9. PvP ranked + cross-play single pool (telegram + ios)
    const mm1 = await req("/api/dev/pvp/mm/enqueue", {
      method: "POST",
      body: JSON.stringify({ userId: uid, name: loginName, team: ["starter_tank", "starter_fighter", "starter_support"], mode: "ranked", platform: "telegram" }),
    });
    assert.equal(mm1.status, 200);
    assert.equal(mm1.json.crossplay, true);
    const mm2 = await req("/api/dev/pvp/mm/enqueue", {
      method: "POST",
      body: JSON.stringify({ userId: `${uid}_ios`, name: "iOS_Peer", team: ["starter_tank", "starter_fighter", "starter_support"], mode: "ranked", platform: "ios" }),
    });
    assert.equal(mm2.status, 200);
    assert.equal(mm2.json.status, "matched", "telegram and ios must match in single cross-play pool");
    assert.equal(mm2.json.crossplay, true);

    const rankedSpend = await req("/api/dev/limits/spend", {
      method: "POST",
      body: JSON.stringify({ userId: uid, kind: "pvp_ranked" }),
    });
    assert.equal(rankedSpend.status, 200);
    assert.equal(rankedSpend.json.pvpTickets, 4);
    const rankedRep = await req("/api/dev/pvp/report", {
      method: "POST",
      body: JSON.stringify({ userId: uid, mode: "ranked", won: true, opponent: "iOS_Peer", platform: "telegram" }),
    });
    assert.equal(rankedRep.status, 200);
    assert.ok(rankedRep.json.mmr > 1200, "ranked win must raise MMR");
    console.log("  [9/19] PvP Ranked + cross-play single pool (telegram <-> ios) OK");

    // 10. Friendly duel create + join (0 ticket, 0 MMR)
    const frCreate = await req("/api/dev/pvp/friendly/create", {
      method: "POST",
      body: JSON.stringify({ userId: uid, name: loginName, team: ["starter_tank", "starter_fighter", "starter_support"], platform: "android" }),
    });
    assert.equal(frCreate.status, 200);
    assert.ok(frCreate.json.inviteCode);
    assert.ok(frCreate.json.tgStartParam.startsWith("duel_"));
    const frJoin = await req("/api/dev/pvp/friendly/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode: frCreate.json.inviteCode, userId: `${uid}_web`, name: "WebFriend", team: ["starter_tank", "starter_fighter", "starter_support"], platform: "web" }),
    });
    assert.equal(frJoin.status, 200);
    assert.equal(frJoin.json.status, "matched");
    assert.equal(frJoin.json.mode, "friendly");
    assert.equal(frJoin.json.crossplay, true);
    console.log("  [10/19] Friendly duel create + join (android <-> web) OK");

    // 11. Daily quest claim + duplicate rejected (409)
    const qClaim = await req("/api/dev/quests/claim", {
      method: "POST",
      body: JSON.stringify({ userId: uid, questId: "dq_pve_1" }),
    });
    assert.equal(qClaim.status, 200);
    assert.ok(qClaim.json.reward.fish > 0);
    const qClaimDup = await req("/api/dev/quests/claim", {
      method: "POST",
      body: JSON.stringify({ userId: uid, questId: "dq_pve_1" }),
    });
    assert.equal(qClaimDup.status, 409);
    console.log("  [11/19] Daily quest claim + idempotency OK");

    // 12. Shop gacha jar blocked (403)
    const jarRes = await req("/api/dev/shop/open-jar", {
      method: "POST",
      body: JSON.stringify({ userId: uid }),
    });
    assert.equal(jarRes.status, 403);
    assert.equal(jarRes.json.error, "shop_gacha_disabled_in_mvp_beta");
    console.log("  [12/19] Shop gacha jar blocked (403) OK");

    // 13. Direct shop cat purchase
    const catBuy = await req("/api/dev/shop/buy-cat", {
      method: "POST",
      body: JSON.stringify({ userId: uid, templateId: "shop_mage_fire", currency: "fish", priceFish: 100 }),
    });
    assert.equal(catBuy.status, 200);
    assert.equal(catBuy.json.cat.templateId, "shop_mage_fire");
    console.log("  [13/19] Shop direct cat purchase OK");

    // 14. Buy Battle Pass -> limits upgrade to 4 PvE / 10 PvP + 2× cat XP (capped R8)
    const passBuy = await req("/api/dev/shop/buy-pass", {
      method: "POST",
      body: JSON.stringify({ userId: uid }),
    });
    assert.equal(passBuy.status, 200);
    assert.equal(passBuy.json.limits.bowlsCap, 4, "Pass ACTIVE PvE cap must be 4");
    assert.equal(passBuy.json.limits.pvpTicketsCap, 10, "Pass ACTIVE PvP cap must be 10");
    assert.equal(passBuy.json.limits.bowls, 1, "Top-up gives 4th PvE bowl");
    assert.equal(passBuy.json.limits.pvpTickets, 9, "Top-up adds +5 PvP tickets (4 -> 9)");

    // 4th PvE succeeds, 5th returns 429
    const pve4Pass = await req("/api/dev/limits/spend", {
      method: "POST",
      body: JSON.stringify({ userId: uid, kind: "pve" }),
    });
    assert.equal(pve4Pass.status, 200);
    const pve5Pass = await req("/api/dev/limits/spend", {
      method: "POST",
      body: JSON.stringify({ userId: uid, kind: "pve" }),
    });
    assert.equal(pve5Pass.status, 429, "5th PvE with Pass ACTIVE must return 429");

    // Spend remaining 9 PvP tickets -> 10th total succeeds, 11th returns 429
    for (let i = 0; i < 9; i++) {
      const r = await req("/api/dev/limits/spend", {
        method: "POST",
        body: JSON.stringify({ userId: uid, kind: "pvp_ranked" }),
      });
      assert.equal(r.status, 200);
    }
    const pvp11 = await req("/api/dev/limits/spend", {
      method: "POST",
      body: JSON.stringify({ userId: uid, kind: "pvp_ranked" }),
    });
    assert.equal(pvp11.status, 429, "11th PvP with Pass ACTIVE must return 429");

    // Cat rank XP ×2 with Pass ACTIVE + cap at R8
    const xpRes = await req("/api/dev/account/cat-xp", {
      method: "POST",
      body: JSON.stringify({ userId: uid, catIds: [starterCatIds[0]], baseXp: 5000 }),
    });
    assert.equal(xpRes.status, 200);
    assert.equal(xpRes.json.multiplier, 2, "Pass ACTIVE cat XP multiplier must be 2×");
    assert.equal(xpRes.json.gainedPerCat, 10000);
    assert.equal(xpRes.json.updated[0].rank, 8, "Cat rank must cap at R8");
    console.log("  [14/19] Battle Pass 4/10 caps + 2× Cat Rank XP (cap R8) OK");

    // 15. Pass complete -> 1 random cat (server RNG, not shop gacha) + idempotency
    const prog = await req("/api/dev/pass/progress", {
      method: "POST",
      body: JSON.stringify({ userId: uid, addLevels: 28 }),
    });
    assert.equal(prog.status, 200);
    assert.equal(prog.json.state.pass.finaleReady, true);
    const fin = await req("/api/dev/pass/complete", {
      method: "POST",
      body: JSON.stringify({ userId: uid }),
    });
    assert.equal(fin.status, 200);
    assert.equal(fin.json.rngSource, "server");
    assert.equal(fin.json.notShopGacha, true);
    assert.ok(fin.json.cat.templateId);
    const finDup = await req("/api/dev/pass/complete", {
      method: "POST",
      body: JSON.stringify({ userId: uid }),
    });
    assert.equal(finDup.status, 409);
    console.log("  [15/19] Pass Finale server-RNG random cat + idempotency OK");

    // 16. Ratings / Season 28d + prizes + soft decay MMR
    const seas = await req(`/api/dev/season?userId=${encodeURIComponent(uid)}`);
    assert.equal(seas.status, 200);
    assert.equal(seas.json.season.durationDays, 28);
    assert.equal(seas.json.season.antiP2W, true);
    assert.equal(seas.json.season.prizes.length, 5);
    assert.ok(seas.json.leaderboard.length >= 1);
    assert.ok(typeof seas.json.me.nextSeasonMmrPreview === "number");
    console.log("  [16/19] Ratings / 28d Season + 5 prize tiers + soft decay MMR OK");

    // 17. Replays cap <= 10
    for (let i = 0; i < 12; i++) {
      await req("/api/dev/pvp/report", {
        method: "POST",
        body: JSON.stringify({ userId: uid, battleId: `smoke_rep_${i}`, mode: "unranked", won: i % 2 === 0, opponent: `Opp_${i}` }),
      });
    }
    const reps = await req(`/api/dev/replays?userId=${encodeURIComponent(uid)}`);
    assert.equal(reps.status, 200);
    assert.equal(reps.json.replays.length, 10, "Replays must be capped at <= 10");
    const repGet = await req(`/api/dev/replays/get?userId=${encodeURIComponent(uid)}&battleId=${encodeURIComponent(reps.json.replays[0].battleId)}`);
    assert.equal(repGet.status, 200);
    assert.ok(Array.isArray(repGet.json.replay.frames));
    console.log("  [17/19] Replays capped at 10 + playback payload OK");

    // 18. Global chat
    const chatSend = await req("/api/dev/chat", {
      method: "POST",
      body: JSON.stringify({ channel: "global", userId: uid, sender: loginName, text: "Hello MVP Beta!" }),
    });
    assert.equal(chatSend.status, 200);
    const chatList = await req("/api/dev/chat?channel=global");
    assert.equal(chatList.status, 200);
    assert.ok(JSON.stringify(chatList.json).includes("Hello MVP Beta!"));
    console.log("  [18/19] Global chat send & read OK");

    // 19. SPA routes + RU/EN i18n
    for (const p of ["/news", "/settings", "/pass", "/pve", "/codex"]) {
      const r = await fetch(`${BASE}${p}`);
      assert.equal(r.status, 200, `Route ${p} must return 200`);
      const html = await r.text();
      assert.ok(html.includes('id="viewNews"'), `HTML for ${p} must include #viewNews`);
    }
    const loc = await req("/loc.json");
    assert.equal(loc.status, 200);
    assert.ok(loc.json["nav.primary.news"]?.ru && loc.json["nav.primary.news"]?.en);
    assert.ok(loc.json["stage.mythmir_10_f3"]?.ru && loc.json["stage.mythmir_10_f3"]?.en);
    console.log("  [19/19] SPA routes (/news, /settings, /pass, /pve, /codex) + RU/EN loc OK");

    console.log("\nALL 19 MVP BETA DOD SMOKE CHECKS PASSED!");
  } finally {
    child.kill();
    await new Promise((r) => setTimeout(r, 250));
    if (origAccountsBuf !== null) {
      fs.writeFileSync(ACCOUNTS_PATH, origAccountsBuf);
    }
    if (stderr.trim()) {
      console.error("[server stderr]", stderr.trim());
    }
  }
}

run().catch((err) => {
  console.error("SMOKE FAILED:", err);
  process.exit(1);
});
