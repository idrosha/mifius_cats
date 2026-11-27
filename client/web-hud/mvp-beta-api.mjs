/**
 * Server-authoritative MVP Beta API (D-066 / FULL-SPEC §1.1, §5, §8.3).
 * Handles:
 *  - Server-side daily limits (Free 3 PvE / 5 PvP · Pass ACTIVE 4 PvE / 10 PvP)
 *  - Shop: direct cat purchase + Battle Pass activation; blocks shop gacha_jar (403)
 *  - Battle Pass progress + completion -> 1 random cat via server RNG (crypto.randomInt)
 *  - Daily quests (UTC daily reset, separate from bowls/tickets)
 *  - Cat Rank XP (R1–R8 cap, ×2 with Pass ACTIVE; no account-level XP track)
 *  - Email linking for cross-client sync (TG / Web / Android / iOS)
 *  - 28-day Season leaderboard + prize tiers + soft MMR decay (anti-P2W)
 *  - Replays list & fetch capped at ≤10 per user
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  SHOP_COMMON_COMBAT,
  buildMvpStarterProfile,
  ensureMvpFields,
  findAccountByEmail,
  getAccountById,
  listAllAccounts,
  saveAccountsStore,
} from "./accounts-dev-api.mjs";

const MAX_CAT_RANK = 8;
const CAT_XP_PER_RANK = 100;
const PASS_MAX_LEVEL = 28;
const PASS_XP_PER_LEVEL = 1000;
const REPLAYS_MAX = 10;
const PASS_DURATION_MS = 28 * 24 * 60 * 60 * 1000;

/** Direct cat catalog prices in MIFOUS (fish) or yarn for MVP Beta direct shop. */
const DIRECT_CAT_PRICE_FISH = 150;
const DIRECT_CAT_PRICE_YARN = 100;
const PASS_PRICE_YARN = 0; // Beta / IAP sandbox ack (no store SDK in SSOT)

function readBody(req) {
  return new Promise(async (resolve) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString("utf8");
    if (!raw) return resolve({});
    try {
      resolve(JSON.parse(raw));
    } catch {
      resolve({});
    }
  });
}

function utcDay(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

function loadLiveOps(repoRoot) {
  try {
    const p = path.join(repoRoot, "liveops", "config", "v1", "liveops.json");
    const doc = JSON.parse(fs.readFileSync(p, "utf8"));
    if (process.env.MVP_BETA === "0") {
      doc.feature_flags = { ...(doc.feature_flags || {}), mvp_beta: false };
    } else if (process.env.MVP_BETA === "1") {
      doc.feature_flags = { ...(doc.feature_flags || {}), mvp_beta: true };
    }
    return doc;
  } catch {
    return {
      limits: {
        pve_per_day_free: 3,
        pvp_per_day_free: 5,
        pve_per_day_pass_mvp: 4,
        pvp_per_day_pass_mvp: 10,
        pass_cat_xp_multiplier: 2,
        ads_enabled: false,
        shop_gacha_enabled: false,
        replays_max: 10,
      },
      season: { id: "mvp_beta_s1", duration_days: 28, soft_decay_factor: 0.25, mmr_baseline: 1200, prizes: [] },
      daily_quests: [],
      feature_flags: { mvp_beta: process.env.MVP_BETA !== "0" },
    };
  }
}

function isPassActive(profile, now = Date.now()) {
  return Number(profile?.passActiveUntil || 0) > now;
}

function capsFor(profile, liveOps, now = Date.now()) {
  const lim = liveOps?.limits || {};
  const mvp = !!liveOps?.feature_flags?.mvp_beta;
  const active = isPassActive(profile, now);
  const pveFree = Number.isFinite(lim.pve_per_day_free) ? lim.pve_per_day_free : 3;
  const pvpFree = Number.isFinite(lim.pvp_per_day_free) ? lim.pvp_per_day_free : 5;
  if (!active) return { pve: pveFree, pvp: pvpFree };
  if (mvp) {
    return {
      pve: Number.isFinite(lim.pve_per_day_pass_mvp) ? lim.pve_per_day_pass_mvp : 4,
      pvp: Number.isFinite(lim.pvp_per_day_pass_mvp) ? lim.pvp_per_day_pass_mvp : 10,
    };
  }
  const mul = Number(lim.pass_multiplier || 2);
  return { pve: pveFree * mul, pvp: pvpFree * mul };
}

function ensureDailyReset(acc, liveOps, now = Date.now()) {
  ensureMvpFields(acc);
  const p = acc.profile;
  const day = utcDay(now);
  let changed = false;
  if (p.lastRefillUtcDate !== day) {
    const caps = capsFor(p, liveOps, now);
    p.bowls = caps.pve;
    p.pvpTickets = caps.pvp;
    p.lastRefillUtcDate = day;
    changed = true;
  }
  if (p.dailyQuestDay !== day) {
    p.dailyQuestDay = day;
    p.dailyQuests = {};
    changed = true;
  }
  return changed;
}

function getQuestDefs(liveOps) {
  if (Array.isArray(liveOps?.daily_quests) && liveOps.daily_quests.length) {
    return liveOps.daily_quests;
  }
  return [
    {
      quest_id: "dq_pve_1",
      kind: "pve_battle",
      target: 1,
      reward_fish: 50,
      reward_pass_xp: 200,
      title_ru: "Пройти 1 бой в Мифмире (PvE)",
      title_en: "Complete 1 Mythmir PvE battle",
    },
    {
      quest_id: "dq_pvp_1",
      kind: "pvp_battle",
      target: 1,
      reward_fish: 60,
      reward_pass_xp: 250,
      title_ru: "Сыграть 1 бой на Арене (PvP)",
      title_en: "Play 1 Arena PvP battle",
    },
    {
      quest_id: "dq_practice_1",
      kind: "any_battle",
      target: 2,
      reward_fish: 40,
      reward_pass_xp: 150,
      title_ru: "Сыграть 2 любых боя 3v3",
      title_en: "Play any 2 3v3 battles",
    },
  ];
}

function advanceQuests(acc, liveOps, kind, delta = 1) {
  const defs = getQuestDefs(liveOps);
  const p = acc.profile;
  for (const d of defs) {
    if (d.kind !== kind && d.kind !== "any_battle") continue;
    const cur = p.dailyQuests[d.quest_id] || { progress: 0, claimed: false };
    if (cur.claimed) continue;
    cur.progress = Math.min(d.target, (cur.progress || 0) + delta);
    p.dailyQuests[d.quest_id] = cur;
  }
}

function questSnapshots(acc, liveOps) {
  const defs = getQuestDefs(liveOps);
  const p = acc.profile;
  return defs.map((d) => {
    const st = p.dailyQuests[d.quest_id] || { progress: 0, claimed: false };
    return {
      ...d,
      progress: st.progress || 0,
      claimed: !!st.claimed,
      ready: (st.progress || 0) >= d.target && !st.claimed,
    };
  });
}

function awardPassXp(profile, addXp = 0, addLevels = 0) {
  if (addXp > 0) {
    profile.passXp = (profile.passXp || 0) + addXp;
    while (profile.passLevel < PASS_MAX_LEVEL && profile.passXp >= PASS_XP_PER_LEVEL) {
      profile.passXp -= PASS_XP_PER_LEVEL;
      profile.passLevel += 1;
    }
  }
  if (addLevels > 0) {
    profile.passLevel = Math.min(PASS_MAX_LEVEL, (profile.passLevel || 1) + addLevels);
  }
  if (profile.passLevel >= PASS_MAX_LEVEL) {
    profile.passLevel = PASS_MAX_LEVEL;
    profile.passXp = 0;
  }
}

function awardCatsXp(profile, catIds, baseXp, now = Date.now()) {
  const mult = isPassActive(profile, now) ? 2 : 1;
  const gained = Math.max(0, Math.round(Number(baseXp || 0))) * mult;
  const updated = [];
  const targets = Array.isArray(catIds) && catIds.length
    ? (profile.cats || []).filter((c) => catIds.includes(c.catId) || catIds.includes(c.templateId))
    : (profile.cats || []).slice(0, 3);
  for (const cat of targets) {
    if (!Number.isFinite(cat.level) || cat.level < 1) cat.level = 1;
    if (!Number.isFinite(cat.xp) || cat.xp < 0) cat.xp = 0;
    cat.xp += gained;
    while (cat.level < MAX_CAT_RANK && cat.xp >= cat.level * CAT_XP_PER_RANK) {
      cat.xp -= cat.level * CAT_XP_PER_RANK;
      cat.level += 1;
    }
    if (cat.level >= MAX_CAT_RANK) {
      cat.level = MAX_CAT_RANK;
      cat.xp = 0;
    }
    updated.push({ catId: cat.catId, templateId: cat.templateId, rank: cat.level, xp: cat.xp });
  }
  return { multiplier: mult, gainedPerCat: gained, updated };
}

function softDecayMmr(mmr, baseline = 1200, factor = 0.25) {
  return baseline + Math.round((mmr - baseline) * (1 - factor));
}

function prizeTierFor(rank, rankedWins) {
  if (rank === 1) return "top_1";
  if (rank >= 2 && rank <= 10) return "top_2_10";
  if (rank >= 11 && rank <= 100) return "top_11_100";
  if (rank >= 101 && rank <= 1000) return "top_101_1000";
  if (rankedWins >= 5) return "participation";
  return "none";
}

function buildStatePayload(acc, liveOps, now = Date.now()) {
  const p = acc.profile;
  const caps = capsFor(p, liveOps, now);
  const seasonId = liveOps?.season?.id || "mvp_beta_s1";
  const active = isPassActive(p, now);
  return {
    ok: true,
    mvpBeta: !!liveOps?.feature_flags?.mvp_beta,
    userId: acc.userId,
    login: acc.login,
    linkedEmail: acc.linkedEmail || p.linkedEmail || "",
    tutorialDone: !!p.tutorialDone,
    adsEnabled: false,
    shopGachaEnabled: !liveOps?.feature_flags?.mvp_beta,
    limits: {
      bowls: p.bowls,
      bowlsCap: caps.pve,
      pvpTickets: p.pvpTickets,
      pvpTicketsCap: caps.pvp,
      catXpMultiplier: active ? 2 : 1,
      lastRefillUtcDate: p.lastRefillUtcDate,
    },
    pass: {
      seasonId,
      owned: !!p.passOwned,
      active,
      activeUntil: p.passActiveUntil || 0,
      level: p.passLevel || 1,
      maxLevel: PASS_MAX_LEVEL,
      xp: p.passXp || 0,
      xpPerLevel: PASS_XP_PER_LEVEL,
      finaleReady: (p.passLevel || 1) >= PASS_MAX_LEVEL && p.passFinaleClaimedSeason !== seasonId,
      finaleClaimed: p.passFinaleClaimedSeason === seasonId,
    },
    quests: questSnapshots(acc, liveOps),
    replaysCount: (p.replays || []).length,
    replaysMax: REPLAYS_MAX,
    profile: p,
  };
}

/**
 * @returns {Promise<boolean>} true if handled
 */
export async function handleMvpBetaApi(req, res, send, repoRoot) {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (!u.pathname.startsWith("/api/dev/")) return false;

  const json = (code, body) =>
    send(res, code, body, { "Content-Type": "application/json; charset=utf-8" });

  const liveOps = loadLiveOps(repoRoot);
  const mvpBeta = !!liveOps?.feature_flags?.mvp_beta;

  // --- MVP State Snapshot ---
  if (u.pathname === "/api/dev/mvp/state" && req.method === "GET") {
    const userId = u.searchParams.get("userId") || "";
    const acc = getAccountById(userId);
    if (!acc) {
      if (userId === "local_smoke" || userId === "guest_smoke") {
        const guest = { userId, login: userId, profile: buildMvpStarterProfile(userId, userId) };
        ensureDailyReset(guest, liveOps);
        return json(200, buildStatePayload(guest, liveOps)), true;
      }
      return json(404, { ok: false, error: "unknown_user" }), true;
    }
    if (ensureDailyReset(acc, liveOps)) saveAccountsStore();
    return json(200, buildStatePayload(acc, liveOps)), true;
  }

  // --- Email Link (cross-client sync: TG / Web / Android / iOS) ---
  if (u.pathname === "/api/dev/account/email" && req.method === "POST") {
    const body = await readBody(req);
    const userId = String(body.userId || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const acc = getAccountById(userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return json(400, { ok: false, error: "invalid_email" }), true;
    }
    const existing = findAccountByEmail(email);
    if (existing && existing.userId !== acc.userId) {
      return json(409, { ok: false, error: "email_already_linked" }), true;
    }
    acc.linkedEmail = email;
    acc.profile.linkedEmail = email;
    saveAccountsStore();
    return json(200, { ok: true, userId: acc.userId, linkedEmail: email }), true;
  }

  // --- Tutorial Complete (§5.1 reward: +50 MIFOUS + 1 potion_life; no jar key in MVP Beta) ---
  if (u.pathname === "/api/dev/account/tutorial/complete" && req.method === "POST") {
    const body = await readBody(req);
    const acc = getAccountById(body.userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    ensureDailyReset(acc, liveOps);
    const already = !!acc.profile.tutorialDone;
    if (!already) {
      acc.profile.tutorialDone = true;
      acc.profile.fish = (acc.profile.fish || 0) + 50;
      const life = (acc.profile.potions || []).find((x) => x.potionId === "potion_life");
      if (life) life.count += 1;
      else acc.profile.potions.push({ potionId: "potion_life", count: 1 });
      if (!mvpBeta) acc.profile.jarKey = (acc.profile.jarKey || 0) + 1;
      saveAccountsStore();
    }
    return json(200, {
      ok: true,
      alreadyCompleted: already,
      reward: already ? null : { fish: 50, potion_life: 1 },
      state: buildStatePayload(acc, liveOps),
    }), true;
  }

  // --- Save 3v3 Team Preset ---
  if (u.pathname === "/api/dev/account/preset" && req.method === "POST") {
    const body = await readBody(req);
    const acc = getAccountById(body.userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    const idx = Math.max(0, Math.min(4, Number(body.index || 0) | 0));
    const name = String(body.name || `Отряд ${idx + 1}`).slice(0, 32);
    const catIds = Array.isArray(body.catIds) ? body.catIds.map(String).filter(Boolean).slice(0, 3) : [];
    if (catIds.length !== 3) return json(400, { ok: false, error: "preset_need_3_cats" }), true;
    const owned = new Set((acc.profile.cats || []).map((c) => c.catId));
    if (!catIds.every((id) => owned.has(id))) {
      return json(400, { ok: false, error: "preset_cat_not_owned" }), true;
    }
    if (!Array.isArray(acc.profile.presets)) acc.profile.presets = [];
    acc.profile.presets[idx] = { name, catIds };
    saveAccountsStore();
    return json(200, { ok: true, index: idx, preset: acc.profile.presets[idx], presets: acc.profile.presets }), true;
  }

  // --- Award Cat Rank XP (R1–R8 cap, ×2 with Pass ACTIVE; no account XP) ---
  if (u.pathname === "/api/dev/account/cat-xp" && req.method === "POST") {
    const body = await readBody(req);
    const acc = getAccountById(body.userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    ensureDailyReset(acc, liveOps);
    const resXp = awardCatsXp(acc.profile, body.catIds, Number(body.baseXp || 50));
    saveAccountsStore();
    return json(200, { ok: true, ...resXp, profile: acc.profile }), true;
  }

  // --- Server-Side Daily Limits Spend (3/5 Free · 4/10 Pass ACTIVE) ---
  if (u.pathname === "/api/dev/limits/spend" && req.method === "POST") {
    const body = await readBody(req);
    const acc = getAccountById(body.userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    ensureDailyReset(acc, liveOps);
    const kind = String(body.kind || "pve").toLowerCase();
    const caps = capsFor(acc.profile, liveOps);

    if (kind === "pve") {
      if ((acc.profile.bowls || 0) < 1) {
        return json(429, { ok: false, error: "no_bowls", bowls: 0, bowlsCap: caps.pve }), true;
      }
      acc.profile.bowls -= 1;
      advanceQuests(acc, liveOps, "pve_battle", 1);
      awardPassXp(acc.profile, 150, 0);
      saveAccountsStore();
      return json(200, {
        ok: true,
        kind,
        spent: 1,
        bowls: acc.profile.bowls,
        bowlsCap: caps.pve,
        state: buildStatePayload(acc, liveOps),
      }), true;
    }

    if (kind === "pvp_ranked" || kind === "pvp") {
      if ((acc.profile.pvpTickets || 0) < 1) {
        return json(429, { ok: false, error: "no_pvp_tickets", pvpTickets: 0, pvpTicketsCap: caps.pvp }), true;
      }
      acc.profile.pvpTickets -= 1;
      advanceQuests(acc, liveOps, "pvp_battle", 1);
      awardPassXp(acc.profile, 200, 0);
      saveAccountsStore();
      return json(200, {
        ok: true,
        kind: "pvp_ranked",
        spent: 1,
        pvpTickets: acc.profile.pvpTickets,
        pvpTicketsCap: caps.pvp,
        state: buildStatePayload(acc, liveOps),
      }), true;
    }

    if (kind === "pvp_unranked" || kind === "pvp_friendly" || kind === "practice") {
      advanceQuests(acc, liveOps, kind === "practice" ? "any_battle" : "pvp_battle", 1);
      awardPassXp(acc.profile, 100, 0);
      saveAccountsStore();
      return json(200, {
        ok: true,
        kind,
        spent: 0,
        bowls: acc.profile.bowls,
        pvpTickets: acc.profile.pvpTickets,
        state: buildStatePayload(acc, liveOps),
      }), true;
    }

    return json(400, { ok: false, error: "unknown_limit_kind" }), true;
  }

  // --- Shop: Block shop-gacha / gacha_jar in MVP Beta (D-066) ---
  if ((u.pathname === "/api/dev/shop/open-jar" || u.pathname === "/api/dev/shop/gacha") && req.method === "POST") {
    if (mvpBeta) {
      return json(403, { ok: false, error: "shop_gacha_disabled_in_mvp_beta" }), true;
    }
    return json(501, { ok: false, error: "jar_stub_only" }), true;
  }

  // --- Shop: Direct Cat Purchase ---
  if (u.pathname === "/api/dev/shop/buy-cat" && req.method === "POST") {
    const body = await readBody(req);
    const acc = getAccountById(body.userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    ensureDailyReset(acc, liveOps);

    const templateId = String(body.templateId || "shop_mage_fire").trim();
    const spec = SHOP_COMMON_COMBAT.find((c) => c.templateId === templateId);
    if (!spec) return json(400, { ok: false, error: "unknown_cat_template" }), true;

    const currency = String(body.currency || "fish").toLowerCase();
    if (currency === "yarn") {
      const price = Number(body.priceYarn || DIRECT_CAT_PRICE_YARN);
      if ((acc.profile.yarn || 0) < price) {
        return json(400, { ok: false, error: "insufficient_yarn", need: price, have: acc.profile.yarn || 0 }), true;
      }
      acc.profile.yarn -= price;
    } else {
      const price = Number(body.priceFish || DIRECT_CAT_PRICE_FISH);
      if ((acc.profile.fish || 0) < price) {
        return json(400, { ok: false, error: "insufficient_fish", need: price, have: acc.profile.fish || 0 }), true;
      }
      acc.profile.fish -= price;
    }

    const cat = {
      catId: `${acc.userId}_shop_${Date.now().toString(36)}_${(acc.profile.cats || []).length + 1}`,
      templateId: spec.templateId,
      role: spec.role,
      element: spec.element,
      level: 1,
      xp: 0,
      rarity: "common",
      origin: "shop",
      pendantId: "",
      bowByPart: {},
    };
    acc.profile.cats.push(cat);
    saveAccountsStore();
    return json(200, { ok: true, cat, state: buildStatePayload(acc, liveOps) }), true;
  }

  // --- Shop: Buy / Activate Battle Pass (Pack C: 4 PvE / 10 PvP + ×2 Cat XP + Finale Cat) ---
  if (u.pathname === "/api/dev/shop/buy-pass" && req.method === "POST") {
    const body = await readBody(req);
    const acc = getAccountById(body.userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    ensureDailyReset(acc, liveOps);

    const now = Date.now();
    const wasActive = isPassActive(acc.profile, now);
    const oldCaps = capsFor(acc.profile, liveOps, now);
    if (PASS_PRICE_YARN > 0 && (acc.profile.yarn || 0) < PASS_PRICE_YARN) {
      return json(400, { ok: false, error: "insufficient_yarn" }), true;
    }
    acc.profile.passOwned = true;
    acc.profile.passActiveUntil = now + PASS_DURATION_MS;
    const newCaps = capsFor(acc.profile, liveOps, now);
    if (!wasActive) {
      const addPve = Math.max(0, newCaps.pve - oldCaps.pve);
      const addPvp = Math.max(0, newCaps.pvp - oldCaps.pvp);
      acc.profile.bowls = Math.min(newCaps.pve, (acc.profile.bowls || 0) + addPve);
      acc.profile.pvpTickets = Math.min(newCaps.pvp, (acc.profile.pvpTickets || 0) + addPvp);
    }
    saveAccountsStore();
    return json(200, {
      ok: true,
      activated: true,
      limits: { bowls: acc.profile.bowls, bowlsCap: newCaps.pve, pvpTickets: acc.profile.pvpTickets, pvpTicketsCap: newCaps.pvp },
      state: buildStatePayload(acc, liveOps, now),
    }), true;
  }

  // --- Battle Pass Progress ---
  if (u.pathname === "/api/dev/pass/progress" && req.method === "POST") {
    const body = await readBody(req);
    const acc = getAccountById(body.userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    ensureDailyReset(acc, liveOps);
    awardPassXp(acc.profile, Number(body.addXp || 0), Number(body.addLevels || 0));
    saveAccountsStore();
    return json(200, { ok: true, state: buildStatePayload(acc, liveOps) }), true;
  }

  // --- Battle Pass Completion -> 1 Random Cat (Server RNG, NOT shop gacha_jar, D-066) ---
  if (u.pathname === "/api/dev/pass/complete" && req.method === "POST") {
    const body = await readBody(req);
    const acc = getAccountById(body.userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    ensureDailyReset(acc, liveOps);

    const seasonId = liveOps?.season?.id || "mvp_beta_s1";
    if (acc.profile.passFinaleClaimedSeason === seasonId) {
      return json(409, { ok: false, error: "pass_finale_already_claimed" }), true;
    }
    if ((acc.profile.passLevel || 1) < PASS_MAX_LEVEL) {
      return json(400, {
        ok: false,
        error: "pass_not_completed",
        level: acc.profile.passLevel || 1,
        requiredLevel: PASS_MAX_LEVEL,
      }), true;
    }
    const idx = crypto.randomInt(0, SHOP_COMMON_COMBAT.length);
    const spec = SHOP_COMMON_COMBAT[idx];
    const cat = {
      catId: `${acc.userId}_pass_finale_${seasonId}`,
      templateId: spec.templateId,
      role: spec.role,
      element: spec.element,
      level: 1,
      xp: 0,
      rarity: "rare",
      origin: "pass_finale",
      pendantId: "",
      bowByPart: {},
    };
    acc.profile.cats.push(cat);
    acc.profile.passFinaleClaimedSeason = seasonId;
    saveAccountsStore();
    return json(200, {
      ok: true,
      cat,
      rngSource: "server",
      notShopGacha: true,
      seasonId,
      state: buildStatePayload(acc, liveOps),
    }), true;
  }

  // --- Daily Quests (separate from bowls/tickets) ---
  if (u.pathname === "/api/dev/quests" && req.method === "GET") {
    const acc = getAccountById(u.searchParams.get("userId") || "");
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    if (ensureDailyReset(acc, liveOps)) saveAccountsStore();
    return json(200, {
      ok: true,
      day: acc.profile.dailyQuestDay,
      quests: questSnapshots(acc, liveOps),
    }), true;
  }

  if (u.pathname === "/api/dev/quests/claim" && req.method === "POST") {
    const body = await readBody(req);
    const acc = getAccountById(body.userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    ensureDailyReset(acc, liveOps);
    const questId = String(body.questId || "").trim();
    const def = getQuestDefs(liveOps).find((q) => q.quest_id === questId);
    if (!def) return json(404, { ok: false, error: "unknown_quest" }), true;
    const st = acc.profile.dailyQuests[questId] || { progress: 0, claimed: false };
    if ((st.progress || 0) < def.target) {
      return json(400, { ok: false, error: "quest_not_ready", progress: st.progress || 0, target: def.target }), true;
    }
    if (st.claimed) return json(409, { ok: false, error: "quest_already_claimed" }), true;
    st.claimed = true;
    acc.profile.dailyQuests[questId] = st;
    acc.profile.fish = (acc.profile.fish || 0) + (def.reward_fish || 0);
    awardPassXp(acc.profile, def.reward_pass_xp || 0, 0);
    saveAccountsStore();
    return json(200, {
      ok: true,
      questId,
      reward: { fish: def.reward_fish || 0, passXp: def.reward_pass_xp || 0 },
      state: buildStatePayload(acc, liveOps),
    }), true;
  }

  // --- PvP Match Report (MMR only on ranked; saves replay ≤ 10; awards cat rank XP) ---
  if (u.pathname === "/api/dev/pvp/report" && req.method === "POST") {
    const body = await readBody(req);
    const acc = getAccountById(body.userId);
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    ensureDailyReset(acc, liveOps);

    const mode = String(body.mode || "ranked").toLowerCase();
    const won = !!body.won;
    let mmrDelta = 0;
    if (mode === "ranked") {
      mmrDelta = won ? 25 : -18;
      acc.profile.mmr = Math.max(800, (acc.profile.mmr || 1200) + mmrDelta);
      if (won) acc.profile.rankedWins = (acc.profile.rankedWins || 0) + 1;
      else acc.profile.rankedLosses = (acc.profile.rankedLosses || 0) + 1;
      if (won) {
        acc.profile.fish = (acc.profile.fish || 0) + 25;
        acc.profile.medals = (acc.profile.medals || 0) + 5;
      }
    }

    const battleId = String(body.battleId || `b_${mode}_${Date.now().toString(36)}`);
    const replayEntry = {
      battleId,
      matchId: String(body.matchId || ""),
      mode,
      seed: Number(body.seed || 0),
      result: won ? "p1_win" : "p2_win",
      opponent: String(body.opponent || "Соперник").slice(0, 48),
      frameCount: Array.isArray(body.frames) ? body.frames.length : Math.max(1, Number(body.frameCount || 6)),
      frames: Array.isArray(body.frames) ? body.frames.slice(0, 60) : [{ turn: 1, result: won ? "p1_win" : "p2_win" }],
      ts: Date.now(),
    };
    const filtered = (acc.profile.replays || []).filter((r) => r.battleId !== battleId);
    acc.profile.replays = [replayEntry, ...filtered].slice(0, REPLAYS_MAX);

    const xpRes = awardCatsXp(acc.profile, body.catIds, won ? 45 : 20);
    saveAccountsStore();
    return json(200, {
      ok: true,
      mode,
      won,
      mmr: acc.profile.mmr,
      mmrDelta,
      replaysCount: acc.profile.replays.length,
      replaysMax: REPLAYS_MAX,
      catXp: xpRes,
      state: buildStatePayload(acc, liveOps),
    }), true;
  }

  // --- Replays List & Detail (≤ 10 newest) ---
  if (u.pathname === "/api/dev/replays" && req.method === "GET") {
    const acc = getAccountById(u.searchParams.get("userId") || "");
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    const list = (acc.profile.replays || []).slice(0, REPLAYS_MAX).map(({ frames, ...meta }) => meta);
    return json(200, { ok: true, max: REPLAYS_MAX, replays: list }), true;
  }

  if (u.pathname === "/api/dev/replays/get" && req.method === "GET") {
    const acc = getAccountById(u.searchParams.get("userId") || "");
    const battleId = String(u.searchParams.get("battleId") || "").trim();
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    const item = (acc.profile.replays || []).find((r) => r.battleId === battleId);
    if (!item) return json(404, { ok: false, error: "replay_not_found" }), true;
    return json(200, { ok: true, replay: item }), true;
  }

  // --- Season & Leaderboard (28d, prizes, soft MMR decay, anti-P2W) ---
  if (u.pathname === "/api/dev/season" && req.method === "GET") {
    const userId = String(u.searchParams.get("userId") || "").trim();
    const s = liveOps?.season || {};
    const baseline = Number(s.mmr_baseline || 1200);
    const decay = Number(s.soft_decay_factor ?? 0.25);
    const all = listAllAccounts()
      .map((a) => ({
        userId: a.userId,
        login: a.login,
        mmr: Number(a.profile?.mmr || baseline),
        wins: Number(a.profile?.rankedWins || 0),
        losses: Number(a.profile?.rankedLosses || 0),
        cats: (a.profile?.cats || []).length,
      }))
      .sort((a, b) => b.mmr - a.mmr || b.wins - a.wins || a.login.localeCompare(b.login));

    const leaderboard = all.slice(0, 100).map((row, idx) => ({
      rank: idx + 1,
      ...row,
      winRate: row.wins + row.losses > 0 ? Math.round((row.wins / (row.wins + row.losses)) * 100) : 0,
      prizeTier: prizeTierFor(idx + 1, row.wins),
    }));

    const me = userId ? leaderboard.find((r) => r.userId === userId || r.login === userId) || null : null;
    return json(200, {
      ok: true,
      season: {
        id: s.id || "mvp_beta_s1",
        name_ru: s.name_ru || "Сезон I · MVP Beta",
        name_en: s.name_en || "Season I · MVP Beta",
        durationDays: Number(s.duration_days || 28),
        antiP2W: true,
        softDecayFactor: decay,
        mmrBaseline: baseline,
        prizes: Array.isArray(s.prizes) ? s.prizes : [],
      },
      me: me
        ? {
            ...me,
            nextSeasonMmrPreview: softDecayMmr(me.mmr, baseline, decay),
          }
        : null,
      leaderboard,
    }), true;
  }

  return false;
}
