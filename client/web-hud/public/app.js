/**
 * Mythfel Web HUD — real Stitch HTML screens + battle/devapi / LiveOps.
 * Visual SSOT = design/stitch-src (built into index). No combat authority on client.
 */

const STARTERS = [
  "starter_tank_stone",
  "starter_fighter_fire",
  "starter_support_water",
];
const YARD_STAGE = "mythmir_1_f1"; // default first fight; campaign selects others
const PRACTICE_STAGE = "practice_dummy_1";
const TUTORIAL_BUDGET_MS = 10 * 60 * 1000;
const CLIENT_REGION = (new URLSearchParams(location.search).get("region") || "RU").toUpperCase();
const GATE_TIP = "Подними ранг в боях";
const PVE_UNLOCK_N = 3;

/** Stitch header data-path → app tab */
const PATH_TO_TAB = {
  "главный-хаб": "hub",
  "бой-3v3": "formation", // 3v3 строй = PvE formation (не рейд)
  "rejd-na-doga": "boss_raid", // легион 12 / рейд на босса
  "рейд-на-дога": "boss_raid",
  "двор-усадьбы": "yard",
  мифмир: "yard",
  коллекция: "collection",
  "лавка-и-маркет": "shop",
  лавка: "shop",
  маркетплейс: "market",
  рынок: "market",
  аукцион: "auction",
  "pvp-арена": "pvp",
  "battle-pass": "pass",
  гильдия: "guild",
  "бой-гильдий": "guild_battle",
  gvg: "guild_battle",
  бой: "formation",
  расстановка: "formation",
  таверна: "tavern",
  пасс: "pass",
  pvp: "pvp",
  ферма: "farm",
  питомник: "breeding",
  скрещивание: "breeding",
  крафт: "craft",
  данжи: "boss_dungeon",
  подземелья: "boss_dungeon",
  рейтинги: "rating_players",
  чат: "chat_global",
  тренировка: "practice",
  "тренировочный-лагерь": "practice",
  кодекс: "codex",
  "кодекс-мифмира": "codex",
  вход: "login",
  регистрация: "login",
};

/**
 * Primary tabs + adaptive subtabs (game HUD IA).
 * Route ids stay stable (yard = Мифмир PvE map).
 */
const NAV = [
  {
    id: "character",
    key: "nav.primary.character",
    tabs: [
      { id: "gear", key: "nav.sub.gear" },
      { id: "home", key: "nav.sub.home", stub: true, gated: true },
      { id: "farm", key: "nav.sub.farm", soon: "farm", gated: true },
      { id: "collection", key: "nav.sub.collection" },
      { id: "craft", key: "nav.sub.craft", gated: true },
      { id: "breeding", key: "nav.sub.breeding", gated: true },
      { id: "codex", key: "nav.sub.codex" },
    ],
  },
  {
    id: "combat",
    key: "nav.primary.combat",
    tabs: [
      { id: "yard", key: "nav.sub.mythmir" },
      { id: "practice", key: "nav.sub.practice" },
      { id: "formation", key: "nav.sub.formation" },
      { id: "pvp", key: "nav.sub.pvp", gated: "pvp" },
      { id: "boss_dungeon", key: "nav.sub.boss_dungeon" },
      { id: "boss_raid", key: "nav.sub.boss_raid", gated: true },
    ],
  },
  {
    id: "trade",
    key: "nav.primary.trade",
    tabs: [
      { id: "tavern", key: "nav.sub.tavern" },
      { id: "shop", key: "nav.sub.shop" },
      { id: "market", key: "nav.sub.market" },
      { id: "auction", key: "nav.sub.auction" },
    ],
  },
  {
    id: "guilds",
    key: "nav.primary.guilds",
    tabs: [
      { id: "guild", key: "nav.sub.guild" },
      { id: "guild_battle", key: "nav.sub.guild_battle", gated: true },
    ],
  },
  {
    id: "chats",
    key: "nav.primary.chats",
    tabs: [
      { id: "chat_global", key: "nav.sub.chat_global" },
      { id: "chat_guild", key: "nav.sub.chat_guild" },
      { id: "chat_friends", key: "nav.sub.chat_friends" },
    ],
  },
  {
    id: "pass",
    key: "nav.primary.pass",
    tabs: [{ id: "pass", key: "nav.sub.pass" }],
  },
  {
    id: "ratings",
    key: "nav.primary.ratings",
    tabs: [
      { id: "rating_players", key: "nav.sub.rating_players" },
      { id: "rating_guilds", key: "nav.sub.rating_guilds" },
    ],
  },
];

/** Flat list kept for verify-nav id: "…" probes */
const TABS = NAV.flatMap((g) => g.tabs.map((t) => ({ ...t, group: g.id }))).concat([
  { id: "hub", key: "hub.tab.hub", group: "hub" },
  { id: "login", key: "nav.sub.login", group: "auth" },
]);

function findNavForTab(tabId) {
  for (const g of NAV) {
    if (g.tabs.some((t) => t.id === tabId)) return g;
  }
  return null;
}

/** Tavern milks — restore ready; buff milks gated (PvE/dungeon only, never ranked PvP). */
const DRINKS = [
  {
    id: "milk_on_ice",
    nameKey: "tavern.drink.milk_on_ice",
    effectKey: "tavern.drink.milk_on_ice.fx",
    price: 20,
    kind: "restore",
    gated: false,
  },
  {
    id: "cream_whisk",
    nameKey: "tavern.drink.cream_whisk",
    effectKey: "tavern.drink.cream_whisk.fx",
    price: 35,
    kind: "buff",
    gated: true,
  },
  {
    id: "moon_milk",
    nameKey: "tavern.drink.moon_milk",
    effectKey: "tavern.drink.moon_milk.fx",
    price: 40,
    kind: "buff",
    gated: true,
  },
  {
    id: "spice_milk",
    nameKey: "tavern.drink.spice_milk",
    effectKey: "tavern.drink.spice_milk.fx",
    price: 40,
    kind: "buff",
    gated: true,
  },
  {
    id: "herbal_milk",
    nameKey: "tavern.drink.herbal_milk",
    effectKey: "tavern.drink.herbal_milk.fx",
    price: 45,
    kind: "buff",
    gated: true,
  },
];

const POTIONS = [
  { id: "stone_skin", nameKey: "tavern.potion.stone", effectKey: "tavern.potion.stone.fx", price: 45 },
  { id: "spark_claw", nameKey: "tavern.potion.spark", effectKey: "tavern.potion.spark.fx", price: 60 },
  { id: "nine_lives", nameKey: "tavern.potion.nine", effectKey: "tavern.potion.nine.fx", price: 80 },
  { id: "cleanse", nameKey: "tavern.potion.cleanse", effectKey: "tavern.potion.cleanse.fx", price: 35 },
];

const MARKET_STOCK = [
  { id: "seed_wheat", name: "Семена пшеницы", price: 15, kind: "seed", gated: false },
  { id: "seed_herb", name: "Семена трав", price: 20, kind: "seed", gated: false },
  { id: "seed_mint", name: "Семена мяты", price: 25, kind: "seed", gated: false },
  { id: "tool_shovel", name: "Лопата", price: 50, kind: "tool", gated: false },
  { id: "tool_axe", name: "Топор", price: 55, kind: "tool", gated: false },
  { id: "tool_pick", name: "Кирка", price: 60, kind: "tool", gated: false },
  { id: "res_wood", name: "Бревно", price: 8, kind: "resource", gated: false },
  { id: "res_ore", name: "Руда", price: 12, kind: "resource", gated: false },
  { id: "craft_herb_bundle", name: "Пучок трав (крафт)", price: 18, kind: "ingredient", gated: false },
  { id: "potion_stone_skin", name: "Зелье каменной шкуры", price: 45, kind: "potion", gated: false },
];

const SHOP_STUB_ROWS = [
  { id: "iap_yarn", label: "IAP · пряжа / донат", detail: "yarn packs", gated: false },
  { id: "pass_buy", label: "Боевой пасс (×2 XP)", detail: "season pass", gated: false },
  { id: "fish_pack_s", label: "Пак рыбок S · 500", detail: "fish coins", gated: false },
  { id: "fish_pack_m", label: "Пак рыбок M · 2000", detail: "fish coins", gated: false },
  { id: "breed_mint", label: "Мята для breeding", detail: "nursery mat", gated: true },
  { id: "breed_milkweed", label: "Молочай для breeding", detail: "nursery mat", gated: true },
  { id: "armor_grey_plate", label: "Стартовая броня · grey R1 plate", detail: "Rank 1", gated: false },
  { id: "armor_grey_pendant", label: "Стартовый кулон · grey R1", detail: "Rank 1", gated: false },
  { id: "battle_coin_gear", label: "Gear за battle coins", detail: "medals → shop", gated: true },
];

/** Codex knowledge base — plain SL facts, no fluff. */
const CODEX_ENTRIES = [
  {
    id: "forms",
    titleRu: "Основные экраны",
    titleEn: "Main screens",
    bodyRu:
      "Вход → Хаб. Персонаж: экипировка, коллекция, кодекс; дом/ферма/крафт/скрещивание — tip «Подними ранг». Бои: Мифмир (карта+миссии), тренировка, строй 3v3, PvP после 3 побед, данжи, рейд. Торговля: таверна / магазин / рынок / аукцион. Гильдии: дом клана + бой гильдий. Пасс и рейтинги — отдельные вкладки.",
    bodyEn:
      "Login → Hub. Character: gear, collection, codex; home/farm/craft/breeding tip «rank up». Combat: Mythmir (map+missions), practice, 3v3 formation, PvP after 3 wins, dungeons, raid. Trade: tavern / shop / market / auction. Guilds: hall + guild battle. Pass and ratings are separate tabs.",
  },
  {
    id: "gather",
    titleRu: "Добыча ресурсов",
    titleEn: "Resource gathering",
    bodyRu:
      "На soft launch глубокая ферма выключена (вкладка «Скоро»). Семена и расходные лопата/топор/кирка покупаются на Рынке (stub). Крафт-ингредиенты и ресурсы можно сбыть на Рынке (NPC) или выставить на Аукцион. Сбор с грядок — post-SL.",
    bodyEn:
      "Deep farm is off on soft launch (Soon tab). Seeds and shovel/axe/pick are Market stubs. Craft ingredients/resources sell via Market NPC or Auction. Crop harvest is post-SL.",
  },
  {
    id: "trade",
    titleRu: "Торговля: магазин / рынок / аукцион / таверна",
    titleEn: "Trade: shop / market / auction / tavern",
    bodyRu:
      "Магазин — студия: IAP/пасс/рыбки, 12 ordinary котов, grey броня, breeding mats. Таверна — только молоко (лёд = HP после боя; бафф-молоко только PvE/данжи, не ranked). Рынок — семена, tools, продажа крафта, quick sell по цене сервера. Аукцион — лоты игроков по своей цене (коты, оружие/броня, ингредиенты); без денег и крипты. Зелья крафтеров — рынок/аукцион, не таверна.",
    bodyEn:
      "Shop — studio: IAP/pass/fish, 12 ordinary cats, grey armor, breeding mats. Tavern — milk only (ice = post-fight HP; buff milk PvE/dungeons only, not ranked). Market — seeds, tools, craft sell, server-price quick sell. Auction — player lots at own price (cats, gear, ingredients); no cash/crypto. Craft potions → market/auction, not tavern.",
  },
  {
    id: "battle",
    titleRu: "Боевая система",
    titleEn: "Battle system",
    bodyRu:
      "Пошаговый 3v3. Три линии: авангард / центр / тыл — не ставь support/ranger/mage вперёд. У каждого кота 4 карты; энергия растёт по ходам (сервер считает урон и награды). Победа — сбить всех врагов. Мифмир: миски. PvP: билеты после 3 побед. Данж «Архипёс»: 3 волны. Молоко-баффы запрещены в ranked.",
    bodyEn:
      "Turn-based 3v3. Three lanes: vanguard / center / rear — do not put support/ranger/mage in front. Four cards per cat; energy scales by turn (server owns damage/rewards). Win by clearing the enemy. Mythmir uses bowls. PvP tickets after 3 wins. Arch-Hound dungeon: 3 waves. Milk buffs banned in ranked.",
  },
  {
    id: "guild_gvg",
    titleRu: "Бой гильдий (GvG)",
    titleEn: "Guild vs guild (GvG)",
    bodyRu:
      "Гильдия vs гильдия: 3–12 котов на сторону. На soft launch есть вход в HUD и правила; полный матчмейкинг и борд 4–12 — tip «Подними ранг» (флаг LiveOps). Размер 3 может идти через текущее ядро 3v3. Клан-босс (1 кот с игрока, общее HP) — отдельно, «Скоро».",
    bodyEn:
      "Guild vs guild: 3–12 cats per side. Soft launch has HUD entry + rules; full matchmaking and 4–12 boards tip «rank up» (LiveOps flag). Size 3 can reuse the 3v3 core. Clan boss (1 cat each, shared HP) is separate Soon content.",
  },
];

const PASS_REWARDS = [
  { lvl: 1, free: "pass.reward.fish_50", gold: "pass.reward.yarn_10" },
  { lvl: 2, free: "pass.reward.scrap", gold: "pass.reward.box_r1" },
  { lvl: 3, free: "pass.reward.bowl", gold: "pass.reward.box_rank" },
  { lvl: 4, free: "pass.reward.ticket", gold: "pass.reward.armor_piece" },
];

const state = {
  locale: "ru",
  loc: {},
  liveOps: null,
  liveOpsMeta: {},
  tab: "hub",
  primary: "combat",
  soon: null,
  battle: null,
  lastResult: null,
  selectedKeep: null,
  tutorial: null,
  logLines: [],
  shopTab: "offers",
  marketTab: "buy",
  wallet: { gold: 0, milk: 0, energy: "0/0", gems: 0 },
  profile: null, // GrantStarterKit smoke (§5.1)
  ownedPotions: [],
  marketLots: [
    { id: "lot_1", name: "craft_herb_bundle", bid: 40, side: "npc", kind: "ingredient" },
    { id: "lot_2", name: "scrap_pile", bid: 25, side: "npc", kind: "resource" },
    { id: "lot_3", name: "res_wood×5", bid: 30, side: "npc", kind: "resource" },
    { id: "lot_4", name: "res_ore×3", bid: 28, side: "npc", kind: "resource" },
    { id: "lot_5", name: "potion_spark_claw", bid: 55, side: "npc", kind: "potion" },
  ],
  auctionLots: [
    { id: "auc_1", name: "shop_tank_stone_a", bid: 900, kind: "cat" },
    { id: "auc_2", name: "shop_fighter_fire_b", bid: 850, kind: "cat" },
    { id: "auc_3", name: "shop_mage_ice_b", bid: 980, kind: "cat" },
    { id: "auc_4", name: "armor_grey_plate", bid: 150, kind: "armor" },
    { id: "auc_5", name: "armor_grey_pendant", bid: 120, kind: "armor" },
    { id: "auc_6", name: "weapon_wood_claw", bid: 200, kind: "weapon" },
    { id: "auc_7", name: "weapon_flint_bow", bid: 260, kind: "weapon" },
    { id: "auc_8", name: "craft_mint_bundle", bid: 70, kind: "ingredient" },
  ],
  codexEntryId: "forms",
  guildBattleSize: 3,
  wireMode: "hub",
  loggedIn: false,
  selectedStageId: YARD_STAGE,
  battleMode: "pve", // pve | practice | boss | guild_demo
  bossWaveIndex: 0,
  campaign: null,
  bossFirst: null,
  progress: {
    pveWins: 0,
    practiceWins: 0,
    clearedFights: {}, // stageId -> true
  },
};

const $ = (id) => document.getElementById(id);

function t(key, fallback = key) {
  const entry = state.loc[key];
  if (!entry) return fallback;
  return entry[state.locale] || entry.ru || entry.en || fallback;
}

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), 2200);
}

function unlockN() {
  const n = state.liveOps?.limits?.pve_unlock_n;
  return typeof n === "number" ? n : PVE_UNLOCK_N;
}

function totalUnlockWins() {
  return (state.progress.pveWins || 0) + (state.progress.practiceWins || 0);
}

function pvpUnlocked() {
  return totalUnlockWins() >= unlockN();
}

function showGateTip(custom) {
  const msg = custom || t("gate.tip.rank", GATE_TIP);
  toast(msg);
  const banner = $("gateTipBanner");
  if (banner) {
    banner.textContent = msg;
    banner.classList.remove("hidden");
  }
}

function persistProgress() {
  try {
    localStorage.setItem("mythfel_sl_progress", JSON.stringify(state.progress));
  } catch (_) {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem("mythfel_sl_progress");
    if (raw) {
      const parsed = JSON.parse(raw);
      state.progress = {
        pveWins: parsed.pveWins || 0,
        practiceWins: parsed.practiceWins || 0,
        clearedFights: parsed.clearedFights || {},
      };
    }
  } catch (_) {}
}

function log(msg, which = "battle") {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  state.logLines.unshift(line);
  if (state.logLines.length > 40) state.logLines.length = 40;
  const el = which === "pvp" ? $("pvpLog") : $("battleLog");
  if (el) el.textContent = state.logLines.slice(0, 12).join("\n");
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(
      typeof data === "string" ? data : data?.error || data?.raw || text || res.statusText,
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return { data, headers: res.headers };
}

async function loadLoc() {
  const { data } = await api("/loc.json");
  state.loc = data || {};
}

async function bootLiveOps() {
  const { data, headers } = await api(`/api/liveops/v1/liveops.json`, {
    headers: { "X-Client-Region": CLIENT_REGION },
  });
  state.liveOps = data;
  state.liveOpsMeta = {
    version: headers.get("X-LiveOps-Version") || data.version || "?",
    sig: headers.get("X-LiveOps-Signature") || "",
    alg: headers.get("X-LiveOps-Signature-Alg") || "",
  };
}

async function checkBattle() {
  const { data } = await api("/api/battle/healthz");
  return data?.ok === true;
}

function featureFlags() {
  return state.liveOps?.feature_flags || {};
}

function logicalViewId() {
  if (state.battle && !state.battle.result) return "viewBattle";
  if (state.battle?.result && state.lastResult) {
    return state.lastResult.result === "p1_win" ? "viewResultWin" : "viewResultLose";
  }
  if (state.soon === "clan_boss" && (state.tab === "guild" || state.tab === "clans")) {
    return "viewSoonClan";
  }
  if (state.soon === "farm" && state.tab === "farm") return "viewSoonFarm";
  if (state.soon === "nursery" && state.tab === "breeding") return "viewSoon";

  const map = {
    hub: "viewHub",
    login: "viewLogin",
    practice: "viewPractice",
    codex: "viewCodex",
    yard: "viewYard",
    formation: "viewFormation",
    boss_dungeon: "viewBossDungeon",
    boss_raid: "viewBossRaid",
    battle: "viewBattle",
    pvp: "viewPvp",
    collection: "viewCollection",
    shop: "viewShop",
    market: "viewMarket",
    tavern: "viewTavern",
    pass: "viewPass",
    gear: "viewGear",
    home: "viewHome",
    craft: "viewCraft",
    breeding: "viewBreeding",
    farm: "viewSoonFarm",
    auction: "viewAuction",
    guild: "viewGuild",
    guild_battle: "viewGuild",
    chat_global: "viewChatGlobal",
    chat_guild: "viewChatGuild",
    chat_friends: "viewChatFriends",
    rating_players: "viewRatingPlayers",
    rating_guilds: "viewRatingGuilds",
  };
  return map[state.tab] || "viewHub";
}

function wireModeFor(viewId) {
  if (viewId === "viewResultWin" || viewId === "viewResultLose" || viewId === "viewResult") {
    return "result";
  }
  if (viewId === "viewSoonFarm" || viewId === "viewSoonClan" || viewId === "viewSoon") {
    return "soon";
  }
  const special = {
    viewBossDungeon: "boss_dungeon",
    viewBossRaid: "boss_raid",
    viewChatGlobal: "chat_global",
    viewChatGuild: "chat_guild",
    viewChatFriends: "chat_friends",
    viewRatingPlayers: "rating_players",
    viewRatingGuilds: "rating_guilds",
  };
  if (special[viewId]) return special[viewId];
  return viewId.replace(/^view/, "").toLowerCase();
}

function showView(id) {
  for (const el of document.querySelectorAll("main > section")) {
    el.classList.toggle("hidden", el.id !== id);
  }
  // Keep logical aliases present for verify-nav probes
  if (id === "viewResultWin" || id === "viewResultLose") {
    $("viewResult")?.classList.add("hidden");
  }
  state.wireMode = wireModeFor(id);
  updateWireDock();
}

function updateWireDock() {
  const mode = state.wireMode;
  for (const el of document.querySelectorAll("#wireDock [data-for]")) {
    const match = el.getAttribute("data-for") === mode;
    el.classList.toggle("wire-hidden", !match);
  }
}

function navigate(tab, { soon = null, clearBattle = true, primary = null, fromGate = false } = {}) {
  if (clearBattle) {
    state.battle = null;
    state.selectedKeep = null;
  }
  // legacy aliases
  if (tab === "clans") tab = "guild";
  if (tab === "more") {
    tab = "farm";
    soon = soon || "farm";
  }
  if (tab === "soon") {
    tab = "farm";
    soon = "farm";
  }
  if (tab === "battle") tab = "formation";

  // Day-1: all forms present. Gated tabs still open, but tip on entry for meta gates.
  const navTab = findNavForTab(tab)?.tabs?.find((x) => x.id === tab) || TABS.find((x) => x.id === tab);
  if (navTab?.gated && tab !== "pvp") {
    showGateTip();
  }
  if (tab === "pvp" && !pvpUnlocked()) {
    showGateTip(t("gate.tip.pvp", "PvP откроется после 3 побед в Мифмире или тренировке"));
  }

  state.tab = tab;
  state.soon = soon;
  // Farm still has Soon art sheet, but form is present (not hidden).
  if (tab === "farm") state.soon = "farm";
  if (tab === "breeding" && !state.soon) state.soon = null;
  if (tab === "guild_battle" && soon == null) state.soon = null;
  if (tab === "guild" && soon == null) state.soon = null;

  const group = findNavForTab(tab);
  state.primary = primary || group?.id || state.primary || "combat";
  // Login chrome: hide nav while on login
  document.body.classList.toggle("mythfel-login", tab === "login");
  renderAll();
}

function renderLocale() {
  const box = $("localeSwitch");
  box.innerHTML = "";
  for (const code of ["ru", "en"]) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = code.toUpperCase();
    b.classList.toggle("active", state.locale === code);
    b.addEventListener("click", () => {
      state.locale = code;
      renderAll();
    });
    box.appendChild(b);
  }
}

function renderCurrency() {
  const set = (id, v) => {
    const el = $(id);
    if (el) el.textContent = String(v);
  };
  const p = state.profile;
  // Prefer §5.1 grant currencies when profile loaded
  set("curGold", p ? p.fish : state.wallet.gold);
  set("curMilk", p ? p.bowls : state.wallet.milk);
  set("curEnergy", p ? `${p.pvpTickets}/5` : state.wallet.energy);
  set("curGems", p ? p.yarn : state.wallet.gems);
  set(
    "brandSub",
    state.locale === "ru" ? "Ур. 1 · Soft Launch" : "Lv. 1 · Soft Launch",
  );
}

/** Apply GrantStarterKit payload (§5.1) — client never invents rewards. */
function applyStarterGrant(profile) {
  state.profile = profile;
  state.ownedPotions = (profile.potions || []).map((x) => x.potionId || x.id);
  state.wallet = {
    gold: profile.fish,
    milk: profile.bowls,
    energy: `${profile.pvpTickets}/5`,
    gems: profile.yarn,
  };
}

function renderTabs() {
  const primaryEl = $("appTabs");
  const subEl = $("appSubTabs");
  const hubTabs = $("hubTabs");
  if (hubTabs) hubTabs.innerHTML = "";

  if (!primaryEl || !subEl) return;

  const battleActive = !!state.battle && !state.battle.result;
  const activeGroup =
    findNavForTab(state.tab) ||
    NAV.find((g) => g.id === state.primary) ||
    NAV.find((g) => g.id === "combat");
  if (state.tab !== "hub") state.primary = activeGroup.id;

  primaryEl.innerHTML = "";
  for (const group of NAV) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t(group.key, group.id);
    b.dataset.primary = group.id;
    b.classList.toggle("active", !battleActive && group.id === state.primary);
    b.addEventListener("click", () => {
      const first = group.tabs[0];
      navigate(first.id, {
        soon: first.soon || null,
        primary: group.id,
      });
    });
    primaryEl.appendChild(b);
  }

  subEl.innerHTML = "";
  for (const tab of activeGroup.tabs) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t(tab.key, tab.id);
    b.dataset.tab = tab.id;
    if (tab.stub) b.classList.add("stub");
    if (tab.soon) b.classList.add("soon");
    if (tab.gated) b.classList.add("gated");
    if (tab.id === "pvp" && !pvpUnlocked()) b.classList.add("locked");
    const active = !battleActive && state.tab === tab.id;
    b.classList.toggle("active", active);
    b.addEventListener("click", () => {
      navigate(tab.id, { soon: tab.soon || null, primary: activeGroup.id });
    });
    subEl.appendChild(b);
  }
}

function starterMeta(id) {
  const map = {
    starter_tank_stone: { role: "tank", element: "stone", lane: "vanguard" },
    starter_fighter_fire: { role: "fighter", element: "fire", lane: "center" },
    starter_support_water: { role: "support", element: "water", lane: "rear" },
    shop_tank_stone_a: { role: "tank", element: "stone", lane: "vanguard" },
    shop_tank_stone_b: { role: "tank", element: "stone", lane: "vanguard" },
    shop_fighter_fire_a: { role: "fighter", element: "fire", lane: "center" },
    shop_fighter_fire_b: { role: "fighter", element: "fire", lane: "center" },
    shop_assassin_bolt_a: { role: "assassin", element: "bolt", lane: "center" },
    shop_assassin_bolt_b: { role: "assassin", element: "bolt", lane: "center" },
    shop_ranger_grass_a: { role: "ranger", element: "grass", lane: "rear" },
    shop_ranger_grass_b: { role: "ranger", element: "grass", lane: "rear" },
    shop_mage_fire_a: { role: "mage", element: "fire", lane: "rear" },
    shop_mage_ice_b: { role: "mage", element: "ice", lane: "rear" },
    shop_support_water_a: { role: "support", element: "water", lane: "rear" },
    shop_support_water_b: { role: "support", element: "water", lane: "rear" },
    starter_farm_grass: { role: "farm", element: "grass", lane: "inventory" },
  };
  return map[id] || { role: "?", element: "?", lane: "?" };
}

function combatStarterIds() {
  const cats = state.profile?.cats || [];
  const combat = cats
    .filter((c) => c.origin === "starter" || STARTERS.includes(c.templateId))
    .map((c) => c.templateId);
  return combat.length ? combat : STARTERS;
}

function renderStarters(intoId) {
  const box = $(intoId);
  if (!box) return;
  box.innerHTML = "";
  const cats = state.profile?.cats || [];
  if (cats.length) {
    for (const c of cats) {
      const m = starterMeta(c.templateId);
      const role = c.role || m.role;
      const element = c.element || m.element;
      const d = document.createElement("div");
      d.className = "tile";
      const origin = c.origin || "?";
      const extra =
        role === "farm"
          ? "farm · inventory · SL no crop"
          : `${role} · ${element} · ${origin}${c.variant ? ` · ${c.variant}` : ""}`;
      d.innerHTML = `<strong>${c.templateId}</strong><div class="meta">${extra}</div>`;
      box.appendChild(d);
    }
    return;
  }
  const ids = combatStarterIds();
  for (const id of ids) {
    const m = starterMeta(id);
    const d = document.createElement("div");
    d.className = "tile";
    d.innerHTML = `<strong>${id}</strong><div class="meta">${m.role} · ${m.element} · ${m.lane}</div>`;
    box.appendChild(d);
  }
}

function softNavigateFromLabel(label) {
  const soft = [
    ["в поход", () => navigate("formation")],
    ["в бой pvp", () => navigate("pvp")],
    ["данж", () => navigate("boss_dungeon")],
    ["подземел", () => navigate("boss_dungeon")],
    ["к рейду", () => navigate("boss_raid")],
    ["рейд", () => navigate("boss_raid")],
    ["легион", () => navigate("boss_raid")],
    ["главный хаб", () => navigate("hub")],
    ["мифмир", () => navigate("yard")],
    ["двор", () => navigate("yard")],
    ["коллекция", () => navigate("collection")],
    ["лавка", () => navigate("shop")],
    ["маркет", () => navigate("market")],
    ["аукцион", () => navigate("auction")],
    ["таверна", () => navigate("tavern")],
    ["pvp", () => navigate("pvp")],
    ["арена", () => navigate("pvp")],
    ["пасс", () => navigate("pass")],
    ["расстанов", () => navigate("formation")],
    ["строй", () => navigate("formation")],
    ["гильдия", () => navigate("guild")],
    ["клан", () => navigate("guild")],
    ["ферма", () => navigate("farm", { soon: "farm" })],
    ["питомник", () => navigate("breeding")],
    ["скрещиван", () => navigate("breeding")],
    ["крафт", () => navigate("craft")],
    ["экипиров", () => navigate("gear")],
    ["чат", () => navigate("chat_global")],
    ["рейтинг", () => navigate("rating_players")],
    ["тренир", () => navigate("practice")],
    ["манекен", () => navigate("practice")],
    ["кодекс", () => navigate("codex")],
    ["вход", () => navigate("login")],
    ["войти", () => { stubLogin({ login: "soft_nav", password: "" }); }],
    ["регистрац", () => { stubLogin({ login: "soft_reg", password: "" }); }],
    ["начать тренир", () => startPractice(false)],
    ["тренировка (манекен)", () => startPractice(false)],
  ];
  const low = label.toLowerCase();
  for (const [needle, fn] of soft) {
    if (low.includes(needle)) {
      fn();
      return true;
    }
  }
  return false;
}

function bindStitchNav(root) {
  if (!root || root.dataset.navBound === "1") return;
  root.dataset.navBound = "1";
  root.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-path], a[href='#'], button");
    if (!a || !root.contains(a)) return;
    const path = (a.getAttribute("data-path") || "").toLowerCase();
    const tab = PATH_TO_TAB[path];
    if (tab) {
      e.preventDefault();
      navigate(tab);
      return;
    }
    const label = (a.textContent || "").trim();
    if (softNavigateFromLabel(label)) {
      e.preventDefault();
    }
  });
}

function bindHubPortals() {
  const root = $("viewHub");
  if (!root || root.dataset.hubPortalsBound === "1") return;
  root.dataset.hubPortalsBound = "1";
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-hub-go]");
    if (!btn) return;
    e.preventDefault();
    navigate(btn.getAttribute("data-hub-go"));
  });
}

function renderHub() {
  $("hubEyebrow").textContent = t("hub.tab.hub", "Главный Хаб");
  $("hubTitle").textContent = t("hub.home.title", "Мифиус");
  $("hubLead").textContent = t("hub.home.lead", "Stitch hub screen");
  const box = $("hubPortals");
  if (box) box.innerHTML = "";
  renderUnlockProgress();
}

function renderYard() {
  $("yardEyebrow").textContent = t("hub.tab.yard");
  $("yardTitle").textContent = t("hub.tab.yard");
  $("yardLead").textContent = `${t("mythmir.mission_list", "Список миссий")} · ${state.selectedStageId}`;
  renderStarters("starterCards");
  renderMythmirMissions();
  renderUnlockProgress();
  const banner = $("tutorialBanner");
  if (state.tutorial) {
    banner.classList.remove("hidden");
    const stepKey =
      state.tutorial.step === "starters"
        ? "tutorial.step.starters"
        : state.tutorial.step === "yard_battle"
          ? "tutorial.step.yard_battle"
          : state.tutorial.step === "victory"
            ? "tutorial.step.victory"
            : "tutorial.step.overtime";
    const elapsed = Math.round((Date.now() - state.tutorial.startedAt) / 1000);
    banner.textContent = `${t(stepKey)} · ${elapsed}s / 600s · ${state.tutorial.complete ? "OK" : ""}`;
    banner.className = `banner ${state.tutorial.complete ? "win" : state.tutorial.failed ? "lose" : "warn"}`;
  } else {
    banner.classList.add("hidden");
  }
}

function renderUnlockProgress() {
  const el = $("unlockProgress");
  if (!el) return;
  const n = unlockN();
  const wins = totalUnlockWins();
  el.textContent = state.locale === "ru"
    ? `К PvP: ${wins}/${n} побед (Мифмир ${state.progress.pveWins} + тренировка ${state.progress.practiceWins})`
    : `PvP unlock: ${wins}/${n} wins (Mythmir ${state.progress.pveWins} + practice ${state.progress.practiceWins})`;
}

function isFightUnlocked(stageIndex, fightIndex) {
  if (stageIndex === 1 && fightIndex === 1) return true;
  const nodes = state.campaign?.nodes || [];
  // sequential: previous fight in same stage, or last fight of previous stage
  if (fightIndex > 1) {
    const prevId = nodes[stageIndex - 1]?.fights?.[fightIndex - 2]?.stageId;
    return !!(prevId && state.progress.clearedFights[prevId]);
  }
  if (stageIndex > 1) {
    const prevStage = nodes[stageIndex - 2];
    const last = prevStage?.fights?.[prevStage.fights.length - 1]?.stageId;
    return !!(last && state.progress.clearedFights[last]);
  }
  return true;
}

function renderMythmirMissions() {
  const box = $("mythmirMissionList");
  if (!box) return;
  box.innerHTML = "";
  const nodes = state.campaign?.nodes || [];
  for (const node of nodes) {
    const head = document.createElement("div");
    head.className = "mission-stage";
    head.innerHTML = `<strong>${node.stageIndex}. ${t(node.title_key, node.title_ru)}</strong>`;
    box.appendChild(head);
    for (const fight of node.fights) {
      const unlocked = isFightUnlocked(node.stageIndex, fight.fightIndex);
      const cleared = !!state.progress.clearedFights[fight.stageId];
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mission-fight" + (fight.stageId === state.selectedStageId ? " active" : "") + (unlocked ? "" : " locked");
      row.textContent = `${node.stageIndex}-${fight.fightIndex} ${fight.label_ru}${cleared ? " ✓" : ""}${unlocked ? "" : " 🔒"}`;
      row.addEventListener("click", () => {
        if (!unlocked) {
          showGateTip();
          return;
        }
        state.selectedStageId = fight.stageId;
        state.battleMode = "pve";
        toast(`${t(fight.label_key, fight.label_ru)}`);
        renderMythmirMissions();
        renderAll();
      });
      box.appendChild(row);
    }
  }
}

function renderBossFirst() {
  const box = $("bossFirstPanel");
  if (!box) return;
  box.innerHTML = "";
  const waves = state.bossFirst?.waves || [
    { wave: 1, stageId: "boss_first_w1", theme: "wave_small_6" },
    { wave: 2, stageId: "boss_first_w2", theme: "wave_pets_10" },
    { wave: 3, stageId: "boss_first_w3", theme: "wave_boss_plus_4" },
  ];
  const hints = ["~6 мелких", "~10 питомцев", "босс + 4"];
  waves.forEach((w, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mission-fight";
    b.textContent = `${t("boss.first.wave", "Волна")} ${w.wave}: ${hints[i] || w.theme}`;
    b.addEventListener("click", () => {
      state.selectedStageId = w.stageId;
      state.battleMode = "boss";
      state.bossWaveIndex = i;
      startYard(false);
    });
    box.appendChild(b);
  });
}

function renderFormation() {
  $("formEyebrow").textContent = t("hub.tab.formation", "Расстановка");
  $("formTitle").textContent = t("formation.title", "Строй отряда 3v3");
  $("formLead").textContent = t(
    "formation.lead",
    "Авангард → Центр → Тыл. Не ставь саппорта/стрелка/мага вперёд — фронт для танка (и мили).",
  );
  const lanes = $("formationLanes");
  if (!lanes) return;
  lanes.innerHTML = "";
  const tip = document.createElement("p");
  tip.className = "meta formation-tip";
  tip.id = "formationRoleTip";
  tip.textContent = t(
    "formation.tip.roles",
    "Подсказка: саппорт и стрелок бьют с любого ряда — береги их в тылу.",
  );
  lanes.appendChild(tip);
  const labels = [
    t("formation.lane.vanguard", "Авангард"),
    t("formation.lane.center", "Центр"),
    t("formation.lane.rear", "Тыл"),
  ];
  STARTERS.forEach((id, i) => {
    const m = starterMeta(id);
    const d = document.createElement("div");
    d.className = "lane-card";
    d.innerHTML = `
      <div class="lane-label">${labels[i]}</div>
      <h3>${id}</h3>
      <div class="meta">${m.role} · ${m.element}</div>
    `;
    lanes.appendChild(d);
  });
  const tray = $("formationPotions");
  tray.innerHTML = "";
  for (const pid of state.ownedPotions) {
    const def = POTIONS.find((p) => p.id === pid);
    const chip = document.createElement("span");
    chip.className = "potion-chip";
    chip.textContent = t(def?.nameKey || pid, pid);
    tray.appendChild(chip);
  }
  if (!state.ownedPotions.length) {
    tray.textContent = t("formation.no_potions", "Нет зелий — рынок у крафтеров");
  }
}

function renderShop() {
  $("shopEyebrow").textContent = t("hub.tab.shop");
  $("shopTitle").textContent = t("hub.tab.shop");
  $("shopLead").textContent = t(
    "shop.lead_channels",
    "IAP · пасс · рыбки · breeding · 12 common · grey armor · battle coins → gear",
  );
  const list = $("offerList");
  if (list) {
    list.innerHTML = "";
    for (const row of SHOP_STUB_ROWS) {
      const li = document.createElement("li");
      li.textContent = `${row.label}${row.gated ? " · gated" : ""}`;
      li.style.cursor = "pointer";
      li.addEventListener("click", () => {
        if (row.gated) showGateTip();
        else toast(state.locale === "ru" ? `${row.label} — stub (сервер)` : `${row.label} — stub`);
      });
      list.appendChild(li);
    }
    const offers = (state.liveOps?.shop?.offers || []).filter((o) => o.kind !== "common_cat");
    for (const o of offers) {
      const li = document.createElement("li");
      li.textContent = `${o.offer_id || o.offerId || "?"} · ${o.kind || "?"}`;
      list.appendChild(li);
    }
  }
  const stubHost = $("shopStubRows");
  if (stubHost) {
    stubHost.innerHTML = "";
    for (const row of SHOP_STUB_ROWS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mission-fight";
      btn.innerHTML = `<strong>${row.label}</strong><div class="meta">${row.detail || ""} · ${row.gated ? "gated" : "stub"}</div>`;
      btn.addEventListener("click", () => {
        if (row.gated) showGateTip();
        else toast(state.locale === "ru" ? `${row.label} — stub` : `${row.label} — stub`);
      });
      stubHost.appendChild(btn);
    }
  }
  const cats = $("shopCommonCats");
  if (!cats) return;
  cats.innerHTML = "";
  const common = (state.liveOps?.shop?.offers || []).filter((o) => o.kind === "common_cat");
  const title = document.createElement("div");
  title.className = "mission-stage";
  title.textContent = t("shop.common_cats", "Обычные коты");
  cats.appendChild(title);
  for (const o of common) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "mission-fight";
    const name = t(`shop.offer.${o.offer_id}`, o.offer_id);
    const deck = (o.deck || []).slice(0, 4).join(", ");
    row.innerHTML = `<strong>${name}</strong><div class="meta">${o.role} · ${o.variant} · ${o.price_fish || "?"} 🐟</div><div class="meta">${deck}</div>`;
    row.addEventListener("click", () => {
      toast(state.locale === "ru" ? `Купить ${name} — stub (сервер авторитетен)` : `Buy ${name} — stub`);
    });
    cats.appendChild(row);
  }
  if (!common.length) {
    const empty = document.createElement("div");
    empty.textContent = state.locale === "ru" ? "Нет common_cat в LiveOps" : "No common_cat offers";
    cats.appendChild(empty);
  }
}

function renderMarket() {
  $("marketEyebrow").textContent = t("hub.tab.market", "Рынок");
  $("marketTitle").textContent = t("market.title", "Рынок Усадьбы");
  $("marketLead").textContent = t(
    "market.lead",
    "Семена · инструменты · ингредиенты/ресурсы · quick sell. Аукцион — отдельно.",
  );
  const list = $("marketList");
  if (list) {
    list.innerHTML = "";
    for (const item of MARKET_STOCK) {
      const li = document.createElement("li");
      li.innerHTML = `<span>${item.name} · ${item.kind} · ${item.price} 🐟${item.gated ? " · gated" : ""}</span>`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wire-btn";
      btn.textContent = t("market.buy", "Купить");
      btn.addEventListener("click", () => {
        if (item.gated) showGateTip();
        else toast(t("market.bought", "Куплено (stub)"));
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
    for (const lot of state.marketLots) {
      const li = document.createElement("li");
      li.innerHTML = `<span>NPC sell · ${lot.name} · ${lot.kind} · ${lot.bid} 🐟</span>`;
      list.appendChild(li);
    }
  }
  const catalog = $("marketCatalog");
  if (catalog) {
    catalog.innerHTML = "";
    const buyTitle = document.createElement("div");
    buyTitle.className = "mission-stage";
    buyTitle.textContent = t("market.catalog.buy", "Купить");
    catalog.appendChild(buyTitle);
    for (const item of MARKET_STOCK) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mission-fight";
      row.innerHTML = `<strong>${item.name}</strong><div class="meta">${item.kind} · ${item.price} 🐟 · ${item.gated ? "gated" : "stub"}</div>`;
      row.addEventListener("click", () => {
        if (item.gated) showGateTip();
        else toast(t("market.bought", "Куплено (stub)"));
      });
      catalog.appendChild(row);
    }
    const sellTitle = document.createElement("div");
    sellTitle.className = "mission-stage";
    sellTitle.textContent = t("market.catalog.sell", "Сбыт крафта / ресурсов (NPC)");
    catalog.appendChild(sellTitle);
    for (const lot of state.marketLots) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mission-fight";
      row.innerHTML = `<strong>${lot.name}</strong><div class="meta">${lot.kind} · sell ${lot.bid} 🐟 · stub</div>`;
      row.addEventListener("click", () => toast(t("market.listed", "Продано NPC (stub)")));
      catalog.appendChild(row);
    }
  }
  const qs = $("marketQuickSell");
  if (qs) {
    qs.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mission-fight";
    btn.innerHTML = `<strong>${t("market.quick_sell", "Quick sell лута")}</strong><div class="meta">gated · серверная цена · без аукциона</div>`;
    btn.addEventListener("click", () => showGateTip(t("market.quick_sell.tip", "Quick sell — подними ранг в боях")));
    qs.appendChild(btn);
  }
}

function fillDrinkHosts(hosts) {
  for (const el of hosts) {
    if (!el) continue;
    el.innerHTML = "";
    for (const d of DRINKS) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile mission-fight";
      const label = t(d.nameKey, d.id === "milk_on_ice" ? "Молоко на льду" : d.id);
      const fx =
        d.kind === "restore"
          ? t("tavern.drink.restore", "post-fight HP")
          : t("tavern.drink.buff", "PvE/dungeon buff · не ranked PvP");
      tile.innerHTML = `<strong>${label}</strong><div class="meta">${fx}${d.gated ? " · gated" : ""} · ${d.price} 🐟</div>`;
      tile.addEventListener("click", () => {
        if (d.gated) {
          showGateTip();
          return;
        }
        toast(
          state.locale === "ru"
            ? "Молоко на льду — HP восстановлены (stub)"
            : "Milk on ice — HP restored (stub)",
        );
      });
      el.appendChild(tile);
    }
  }
}

function renderTavern() {
  $("tavernEyebrow").textContent = t("hub.tab.tavern", "Таверна");
  $("tavernTitle").textContent = t("tavern.title", "Таверна «Усатый Хмель»");
  $("tavernLead").textContent = t(
    "tavern.lead_milk",
    "Молоко на льду = HP после боя. Бафф-молоко — только PvE/данжи. Зелья → рынок/аукцион.",
  );
  const banner = $("tavernMilkBanner");
  if (banner) {
    banner.innerHTML = `<strong class="text-primary">${t("tavern.milk_bar", "Молочный бар")}</strong>
      <span class="text-on-surface-variant text-sm"> — ${t(
        "tavern.milk_bar.lead",
        "лёд = restore; другие молока = PvE/dungeon buff (не ranked). Зелья у крафтеров.",
      )}</span>`;
  }
  fillDrinkHosts([$("drinkList"), $("tavernMilkList")]);
  const pots = $("potionList");
  if (pots) {
    pots.innerHTML = "";
    const tip = document.createElement("div");
    tip.className = "tile";
    tip.textContent = state.locale === "ru" ? "Зелья → Рынок / Аукцион" : "Potions → Market / Auction";
    tip.addEventListener("click", () => navigate("market"));
    pots.appendChild(tip);
  }
}

function renderAuction() {
  const eyebrow = $("auctionEyebrow");
  if (eyebrow) eyebrow.textContent = t("hub.tab.auction", "Аукцион");
  const title = $("auctionTitle");
  if (title) title.textContent = t("auction.title", "Аукцион игроков");
  const lead = $("auctionLead");
  if (lead) {
    lead.textContent = t(
      "auction.lead",
      "Коты · оружие/броня · ингредиенты по своей цене (без крипты).",
    );
  }
  const list = $("auctionList");
  const host = $("auctionListingHost");
  const targets = [list, host].filter(Boolean);
  for (const el of targets) {
    el.innerHTML = "";
    for (const lot of state.auctionLots) {
      if (el.tagName === "UL") {
        const row = document.createElement("li");
        row.innerHTML = `<span>${lot.name} · ${lot.kind} · ${lot.bid} 🐟</span>`;
        row.style.cursor = "pointer";
        row.addEventListener("click", () =>
          toast(state.locale === "ru" ? `Ставка ${lot.name} — stub` : `Bid ${lot.name} — stub`),
        );
        el.appendChild(row);
      } else {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "mission-fight";
        row.innerHTML = `<strong>${lot.name}</strong><div class="meta">${lot.kind} · ${lot.bid} 🐟 · sample stub</div>`;
        row.addEventListener("click", () =>
          toast(state.locale === "ru" ? `Ставка ${lot.name} — stub` : `Bid ${lot.name} — stub`),
        );
        el.appendChild(row);
      }
    }
    if (el.tagName === "UL") {
      const listBtn = document.createElement("li");
      listBtn.style.cursor = "pointer";
      listBtn.innerHTML = `<span>${t("auction.list_stub", "Выставить лот")} · gated</span>`;
      listBtn.addEventListener("click", () => showGateTip());
      el.appendChild(listBtn);
    } else {
      const listBtn = document.createElement("button");
      listBtn.type = "button";
      listBtn.className = "mission-fight";
      listBtn.innerHTML = `<strong>${t("auction.list_stub", "Выставить лот")}</strong><div class="meta">gated · своя цена</div>`;
      listBtn.addEventListener("click", () => showGateTip());
      el.appendChild(listBtn);
    }
  }
}

function renderCodex() {
  const nav = $("codexNavList");
  const article = $("codexArticle");
  if (!nav || !article) return;
  nav.innerHTML = "";
  for (const entry of CODEX_ENTRIES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mission-fight";
    if (entry.id === state.codexEntryId) btn.classList.add("active");
    const title = state.locale === "ru" ? entry.titleRu : entry.titleEn;
    btn.innerHTML = `<strong>${title}</strong>`;
    btn.addEventListener("click", () => {
      state.codexEntryId = entry.id;
      renderCodex();
    });
    nav.appendChild(btn);
  }
  const cur = CODEX_ENTRIES.find((e) => e.id === state.codexEntryId) || CODEX_ENTRIES[0];
  const h = document.createElement("h2");
  h.className = "font-headline text-lg text-primary mb-2";
  h.textContent = state.locale === "ru" ? cur.titleRu : cur.titleEn;
  const p = document.createElement("p");
  p.className = "text-sm text-on-surface-variant leading-relaxed";
  p.textContent = state.locale === "ru" ? cur.bodyRu : cur.bodyEn;
  article.innerHTML = "";
  article.appendChild(h);
  article.appendChild(p);
}

function renderGuild() {
  const host = $("guildBattleHost");
  if (!host) return;
  host.innerHTML = "";
  const title = document.createElement("div");
  title.className = "mission-stage";
  title.textContent = t("guild.battle.title", "Бой гильдий (GvG)");
  host.appendChild(title);
  const lead = document.createElement("p");
  lead.className = "meta mb-2";
  lead.textContent = t(
    "guild.battle.lead",
    "3–12 котов на сторону. Матчмейкинг gated; размер 3 → демо 3v3 на ядре боя.",
  );
  host.appendChild(lead);
  const sizes = document.createElement("div");
  sizes.className = "grid grid-cols-3 gap-2 mb-2";
  for (const n of [3, 6, 12]) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mission-fight";
    if (state.guildBattleSize === n) b.classList.add("ring-1", "ring-primary");
    b.innerHTML = `<strong>${n}</strong><div class="meta">${n === 3 ? "core OK" : "gated"}</div>`;
    b.addEventListener("click", () => {
      state.guildBattleSize = n;
      renderGuild();
    });
    sizes.appendChild(b);
  }
  host.appendChild(sizes);
  const go = document.createElement("button");
  go.type = "button";
  go.className = "mission-fight";
  go.id = "btnGuildBattleStart";
  go.innerHTML = `<strong>${t("guild.battle.start", "В бой гильдий")}</strong><div class="meta">${
    state.guildBattleSize === 3 ? "demo 3v3 · CreatePvE" : "matchmaking gated"
  }</div>`;
  go.addEventListener("click", () => startGuildBattle());
  host.appendChild(go);
  const tip = document.createElement("button");
  tip.type = "button";
  tip.className = "mission-fight";
  tip.innerHTML = `<strong>${t("guild.clan_boss", "Клан-босс")}</strong><div class="meta">Soon · не GvG</div>`;
  tip.addEventListener("click", () => navigate("guild", { soon: "clan_boss" }));
  host.appendChild(tip);
}

function startGuildBattle() {
  const n = state.guildBattleSize || 3;
  if (n !== 3) {
    showGateTip(t("guild.battle.gate", "Бой гильдий 4–12 — подними ранг в боях"));
    return;
  }
  // Reuse 3v3 battle core as GvG size-3 demo (FULL-SPEC §4.5).
  state.battleMode = "guild_demo";
  state.selectedStageId = PRACTICE_STAGE;
  toast(t("guild.battle.demo", "GvG demo 3v3 — ядро боя; матчмейкинг не live"));
  startYard(false);
}

function renderPass() {
  $("passEyebrow").textContent = t("hub.tab.pass", "Пасс");
  $("passTitle").textContent = t("pass.title", "Зов Тёплого Очага");
  $("passLead").textContent = t(
    "pass.lead",
    "×2 XP · боксы по текущему рангу · high ranks ~1 год с пассом.",
  );
  const list = $("passList");
  if (!list) return;
  list.innerHTML = "";
  for (const row of PASS_REWARDS) {
    const li = document.createElement("li");
    li.textContent = `Lv ${row.lvl}: ${t(row.free, row.free)} / ★ ${t(row.gold, row.gold)}`;
    list.appendChild(li);
  }
}

function renderSoon() {
  const sheet = state.soon || "farm";
  const titleKey =
    sheet === "clan_boss"
      ? "hub.soon.clan_boss.title"
      : sheet === "nursery"
        ? "hub.soon.nursery.title"
        : "hub.soon.farm.title";
  $("soonTitle").textContent = t(titleKey);
  $("soonBody").textContent = t("hub.soon.body");
  const links = $("soonLinks");
  if (!links) return;
  links.innerHTML = "";
  const flags = featureFlags();
  const options = [
    ["clan_boss", "hub.soon.clan_boss.title", !flags.clan_boss_gameplay],
    ["farm", "hub.soon.farm.title", !flags.farm_gameplay],
    ["nursery", "hub.soon.nursery.title", !flags.nursery_gameplay],
  ];
  for (const [id, key, show] of options) {
    if (!show) continue;
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t(key);
    b.addEventListener("click", () => {
      state.soon = id;
      state.tab = id === "clan_boss" ? "clans" : "more";
      renderAll();
    });
    links.appendChild(b);
  }
}

function renderResult() {
  const r = state.lastResult;
  const win = r?.result === "p1_win";
  $("resultEyebrow").textContent = t("result.eyebrow", "Итог боя");
  $("resultTitle").textContent = win
    ? t("result.win", "Блестящая победа!")
    : t("result.lose", "Поражение в бою");
  $("resultLead").textContent = `${r?.battleId || "?"} · ${r?.result || "?"}`;
}

function unitCard(u, side) {
  const d = document.createElement("div");
  d.className = `unit ${side}${u.alive ? "" : " dead"}`;
  const pct = u.maxHp > 0 ? Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100)) : 0;
  const statuses = (u.statuses || []).map((s) => s.id).join(", ");
  d.innerHTML = `
    <div class="meta">${u.role} · ${u.element} · L${u.lane}</div>
    <div class="hp">${u.hp}/${u.maxHp}${u.shield ? ` +${u.shield}` : ""}</div>
    <div class="hp-bar"><i style="width:${pct}%"></i></div>
    <div class="meta">${u.id}${statuses ? " · " + statuses : ""}</div>
  `;
  return d;
}

function renderBattle() {
  const diff = state.battle;
  if (!diff) return;
  const local = diff.p1 || {};
  $("battleHeading").textContent = `${diff.battleId || "?"} · T${diff.turn} · seq ${diff.seq}`;
  $("battleStats").innerHTML = `
    <span>⚡ <b>${local.energy ?? 0}</b></span>
    <span>🥛 <b>${local.milkDrops ?? 0}</b> / bursts ${local.milkBursts ?? 0}</span>
    <span>keep <b>${local.keepCost ?? 1}</b></span>
    <span>active <b>P${(diff.active ?? 0) + 1}</b></span>
  `;

  const allies = (diff.units || []).filter((u) => u.side === 0).sort((a, b) => a.lane - b.lane);
  const enemies = (diff.units || []).filter((u) => u.side === 1).sort((a, b) => a.lane - b.lane);
  const ab = $("allyBoard");
  const eb = $("enemyBoard");
  ab.innerHTML = "";
  eb.innerHTML = "";
  for (const u of allies) ab.appendChild(unitCard(u, "ally"));
  for (const u of enemies) eb.appendChild(unitCard(u, "enemy"));

  const hand = $("hand");
  hand.innerHTML = "";
  for (const c of diff.hand || []) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "wire-btn";
    b.disabled = !c.playable || !!diff.result || diff.active !== 0;
    b.innerHTML = `<span class="cost">${c.cost}</span> ${t(c.name_key, c.cardId)}
      <span class="sub">${c.unitId} #${c.handIndex}</span>`;
    b.addEventListener("click", async () => {
      if (state.selectedKeep?.mode) {
        await submitAction({ kind: "keep", unitId: c.unitId, handIndex: c.handIndex });
        state.selectedKeep = null;
        return;
      }
      await submitAction({
        kind: "playCard",
        unitId: c.unitId,
        handIndex: c.handIndex,
        targetId: "",
      });
    });
    hand.appendChild(b);
  }

  $("btnEndTurn").disabled = !diff.canEndTurn || !!diff.result || diff.active !== 0;
  $("btnKeep").disabled = !diff.canKeep || !!diff.result;
  $("btnKeep").textContent = state.selectedKeep?.mode
    ? state.locale === "ru"
      ? "Keep: клик по карте"
      : "Keep: click a card"
    : `Keep (${local.keepCost ?? 1})`;
  $("btnSurrender").disabled = !!diff.result;

  const banner = $("resultBanner");
  if (diff.result) {
    banner.classList.remove("hidden");
    const win = diff.result === "p1_win";
    banner.className = `banner ${win ? "win" : "lose"}`;
    banner.textContent = `${diff.result}${win && state.tutorial ? " · " + t("tutorial.step.victory") : ""}`;
  } else {
    banner.classList.add("hidden");
  }
}

async function applyDiff(diff, note = "") {
  state.battle = diff;
  state.lastResult = null;
  if (note) log(note);
  if (state.tutorial && state.tutorial.step !== "victory") {
    state.tutorial.battleId = diff.battleId;
    state.tutorial.step = "yard_battle";
    if (diff.result === "p1_win") {
      const elapsed = Date.now() - state.tutorial.startedAt;
      if (elapsed > TUTORIAL_BUDGET_MS) {
        state.tutorial.failed = true;
        state.tutorial.step = "overtime";
      } else {
        state.tutorial.complete = true;
        state.tutorial.step = "victory";
        log(`tutorial_step=victory (${Math.round(elapsed / 1000)}s)`);
      }
    }
  }
  if (diff.result) {
    state.lastResult = { battleId: diff.battleId, result: diff.result };
    if (diff.result === "p1_win") {
      if (state.battleMode === "practice") {
        state.progress.practiceWins += 1;
      } else if (state.battleMode === "boss") {
        state.progress.pveWins += 1;
        state.progress.clearedFights[state.selectedStageId] = true;
      } else {
        state.progress.pveWins += 1;
        state.progress.clearedFights[state.selectedStageId] = true;
      }
      persistProgress();
      log(`unlock wins=${totalUnlockWins()}/${unlockN()} mode=${state.battleMode}`);
    }
  }
  renderAll();
}

async function createPvE({ autoPlay = false, seed = 0, stageId = null } = {}) {
  const sid = stageId || state.selectedStageId || YARD_STAGE;
  const { data } = await api("/api/battle/v1/CreatePvE", {
    method: "POST",
    body: JSON.stringify({
      stageId: sid,
      team: STARTERS,
      potions: [],
      seed,
      autoPlay,
    }),
  });
  return data;
}

async function submitAction(action) {
  if (!state.battle?.battleId) return;
  try {
    const { data } = await api("/api/battle/v1/SubmitAction", {
      method: "POST",
      body: JSON.stringify({
        battleId: state.battle.battleId,
        action: {
          kind: action.kind,
          unitId: action.unitId || "",
          handIndex: action.handIndex ?? 0,
          targetId: action.targetId || "",
          potionId: action.potionId || "",
        },
      }),
    });
    await applyDiff(data, `${action.kind}${action.unitId ? " " + action.unitId : ""}`);
  } catch (err) {
    log(`reject ${err.status || ""}: ${err.message}`);
    alert(`Server reject: ${err.message}`);
  }
}

async function startYard(autoPlay = false) {
  try {
    if (!state.battleMode) state.battleMode = "pve";
    const diff = await createPvE({ autoPlay, seed: autoPlay ? 20261104 : 0 });
    await applyDiff(diff, autoPlay ? "CreatePvE autoPlay" : `CreatePvE ${state.selectedStageId}`);
  } catch (err) {
    log(`CreatePvE fail: ${err.message}`);
    alert(err.message);
  }
}

async function startPractice(autoPlay = false) {
  state.battleMode = "practice";
  state.selectedStageId = PRACTICE_STAGE;
  await startYard(autoPlay);
}

async function startTutorial() {
  state.tutorial = {
    startedAt: Date.now(),
    step: "starters",
    complete: false,
    failed: false,
    battleId: null,
  };
  log("tutorial_step=starters");
  try {
    const diff = await createPvE({ autoPlay: false });
    state.tutorial.step = "yard_battle";
    log("tutorial_step=yard_battle");
    await applyDiff(diff, "tutorial CreatePvE");
  } catch (err) {
    alert(err.message);
  }
}

async function refreshReplays() {
  try {
    const { data } = await api("/api/battle/v1/ListReplays?userId=local_smoke");
    const list = $("replayList");
    list.innerHTML = "";
    for (const item of data || []) {
      const li = document.createElement("li");
      li.innerHTML = `<span>${item.battleId} · ${item.result || "?"} · frames ${item.frameCount ?? "?"}</span>`;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wire-btn";
      b.textContent = "Open";
      b.addEventListener("click", async () => {
        const { data: frames } = await api(
          `/api/battle/v1/GetReplay?battleId=${encodeURIComponent(item.battleId)}`,
        );
        log(`replay ${item.battleId}: ${(frames || []).length} frames`, "pvp");
        alert(`Replay ${item.battleId}: ${(frames || []).length} frames`);
      });
      li.appendChild(b);
      list.appendChild(li);
    }
    if (!(data || []).length) {
      const li = document.createElement("li");
      li.textContent =
        state.locale === "ru" ? "Реплеев нет — запусти автобой PvP" : "No replays — run PvP auto";
      list.appendChild(li);
    }
  } catch (err) {
    log(`replays: ${err.message}`, "pvp");
  }
}

async function pvpAuto() {
  if (!pvpUnlocked()) {
    showGateTip(t("gate.tip.pvp", "PvP откроется после 3 побед в Мифмире или тренировке"));
    return;
  }
  try {
    const { data } = await api("/api/battle/v1/CreatePvP", {
      method: "POST",
      body: JSON.stringify({
        matchId: `web_${Date.now()}`,
        team1: STARTERS,
        team2: STARTERS,
        seed: 20261104,
        autoPlay: true,
      }),
    });
    log(`PvP auto ${data.battleId} → ${data.result}`, "pvp");
    await applyDiff(data, `PvP autoPlay ${data.result}`);
    await refreshReplays();
  } catch (err) {
    log(`PvP fail: ${err.message}`, "pvp");
    alert(err.message);
  }
}

function renderAll() {
  renderLocale();
  renderCurrency();
  renderTabs();

  const lo = $("liveopsPill");
  if (state.liveOps) {
    lo.textContent = `LiveOps v${state.liveOpsMeta.version} · ${state.liveOpsMeta.alg || "?"} · ${CLIENT_REGION}`;
    lo.className = "status-pill ok";
  }

  const viewId = logicalViewId();
  showView(viewId);
  bindStitchNav($(viewId));

  if (viewId === "viewBattle" && state.battle && !state.battle.result) {
    renderBattle();
    return;
  }
  if (viewId === "viewResultWin" || viewId === "viewResultLose") {
    renderResult();
    return;
  }
  if (viewId === "viewSoon" || viewId === "viewSoonFarm" || viewId === "viewSoonClan") {
    renderSoon();
    return;
  }

  switch (state.tab) {
    case "hub":
      renderHub();
      bindHubPortals();
      break;
    case "login":
      break;
    case "practice":
      renderUnlockProgress();
      break;
    case "codex":
      renderCodex();
      break;
    case "yard":
      renderYard();
      break;
    case "formation":
      renderFormation();
      break;
    case "boss_dungeon":
      renderBossFirst();
      break;
    case "boss_raid":
      break;
    case "pvp":
      $("pvpEyebrow").textContent = t("hub.tab.pvp");
      $("pvpTitle").textContent = t("hub.tab.pvp");
      renderUnlockProgress();
      break;
    case "collection":
      $("colEyebrow").textContent = t("hub.tab.collection");
      $("colTitle").textContent = t("hub.tab.collection");
      {
        const n = state.profile?.cats?.length || 0;
        $("colLead").textContent =
          state.locale === "ru"
            ? `Тестовый грант soft launch: ${n} котов (3 стартера + 12 shop common ×6 классов + farm). Пресет 3v3 — equal decks.`
            : `Soft-launch test grant: ${n} cats (3 starters + 12 shop common ×6 classes + farm). 3v3 preset — equal decks.`;
      }
      renderStarters("collectionCards");
      break;
    case "shop":
      renderShop();
      break;
    case "market":
      renderMarket();
      break;
    case "tavern":
      renderTavern();
      break;
    case "auction":
      renderAuction();
      break;
    case "pass":
      renderPass();
      break;
    case "farm":
      state.soon = "farm";
      renderSoon();
      break;
    case "guild":
    case "guild_battle":
      renderGuild();
      break;
    default:
      break;
  }
}

/** Soft-launch stub auth — any login/password succeeds; never blocks test flow. */
async function stubLogin({ login = "", password = "" } = {}) {
  const btn = $("submitBtn");
  const originalHtml = btn?.innerHTML;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> <span>Открытие портала...</span>`;
  }
  try {
    const { data } = await api("/api/dev/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    });
    if (data?.profile) applyStarterGrant(data.profile);
    state.loggedIn = true;
    state.session = data?.session || { userId: data?.profile?.userId || "guest_smoke" };
    log(
      `stubAuth ok user=${state.session.userId} cats=${(data?.profile?.cats || []).length}`,
    );
    toast(
      state.locale === "ru"
        ? "Свободный вход — любой логин/пароль"
        : "Free login — any credentials",
    );
    navigate("hub");
  } catch (err) {
    // Still admit on network blip: local grant already loaded at boot.
    console.warn("stub login", err);
    state.loggedIn = true;
    navigate("hub");
  } finally {
    if (btn && originalHtml) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function wireLoginForm() {
  window.mythfelStubLogin = (e) => {
    e?.preventDefault?.();
    const login = $("loginUserInput")?.value || "";
    const password = $("passwordInput")?.value || "";
    stubLogin({ login, password });
  };
  // Social stubs also free-enter
  const root = $("viewLogin");
  if (root && root.dataset.stubSocial !== "1") {
    root.dataset.stubSocial = "1";
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button");
      if (!btn || btn.id === "submitBtn" || btn.id === "tabLogin" || btn.id === "tabRegister") return;
      const label = (btn.textContent || "").toLowerCase();
      if (
        label.includes("telegram") ||
        label.includes("vk") ||
        label.includes("google")
      ) {
        ev.preventDefault();
        stubLogin({ login: `social_${label.trim().split(/\s+/)[0] || "oauth"}`, password: "" });
      }
    });
  }
}

function wireButtons() {
  $("btnBrandHub")?.addEventListener("click", () => navigate("hub"));
  $("btnLoginEnter")?.addEventListener("click", () => {
    stubLogin({
      login: $("loginUserInput")?.value || "wire_dock",
      password: $("passwordInput")?.value || "",
    });
  });
  wireLoginForm();
  $("btnPracticeBattle")?.addEventListener("click", () => startPractice(false));
  $("btnPracticeHub")?.addEventListener("click", () => navigate("hub"));
  $("btnCodexHub")?.addEventListener("click", () => navigate("hub"));
  $("btnBossFirstWave")?.addEventListener("click", () => {
    state.battleMode = "boss";
    state.selectedStageId = state.bossFirst?.waves?.[state.bossWaveIndex]?.stageId || "boss_first_w1";
    startYard(false);
  });
  $("btnTutorial").addEventListener("click", () => {
    state.battleMode = "pve";
    state.selectedStageId = YARD_STAGE;
    startTutorial();
  });
  $("btnYardBattle").addEventListener("click", () => {
    state.battleMode = "pve";
    startYard(false);
  });
  $("btnYardAuto").addEventListener("click", () => {
    state.battleMode = "pve";
    startYard(true);
  });
  $("btnYardToFormation").addEventListener("click", () => navigate("formation"));
  $("btnFormationBattle").addEventListener("click", () => startYard(false));
  $("btnFormationYard").addEventListener("click", () => navigate("yard"));
  $("btnFormationTavern").addEventListener("click", () => navigate("tavern"));
  $("btnBossDungeonRaid")?.addEventListener("click", () => navigate("boss_raid"));
  $("btnBossDungeonHub")?.addEventListener("click", () => navigate("hub"));
  $("btnBossRaidHub")?.addEventListener("click", () => navigate("hub"));
  $("btnBossRaidFormation")?.addEventListener("click", () => navigate("formation"));
  $("btnBossRaidDungeon")?.addEventListener("click", () => navigate("boss_dungeon"));
  $("btnEndTurn").addEventListener("click", () => submitAction({ kind: "endTurn" }));
  $("btnKeep").addEventListener("click", () => {
    if (!state.battle?.canKeep || state.battle?.result) return;
    state.selectedKeep = { mode: true };
    log(state.locale === "ru" ? "Выбери карту для Keep (клик)" : "Click a card to Keep");
    renderBattle();
  });
  $("btnSurrender").addEventListener("click", () => submitAction({ kind: "surrender" }));
  $("btnBackHub").addEventListener("click", () => {
    state.battle = null;
    state.lastResult = null;
    state.selectedKeep = null;
    navigate("hub");
  });
  $("btnResultHub").addEventListener("click", () => {
    state.battle = null;
    state.lastResult = null;
    navigate("hub");
  });
  $("btnResultYard").addEventListener("click", () => {
    state.battle = null;
    state.lastResult = null;
    navigate("yard");
  });
  $("btnResultRetry").addEventListener("click", () => {
    state.battle = null;
    state.lastResult = null;
    startYard(false);
  });
  $("btnResultFormation").addEventListener("click", () => {
    state.battle = null;
    state.lastResult = null;
    navigate("formation");
  });
  $("btnPvpAuto").addEventListener("click", () => pvpAuto());
  $("btnPvpFormation").addEventListener("click", () => navigate("formation"));
  $("btnRefreshReplays").addEventListener("click", () => refreshReplays());
  $("btnColFormation").addEventListener("click", () => navigate("formation"));
  $("btnColForge").addEventListener("click", () => navigate("farm", { soon: "farm" }));
  $("btnGacha1").addEventListener("click", () => toast(t("shop.gacha.stub", "Гача stub")));
  $("btnGacha10").addEventListener("click", () => toast(t("shop.gacha.stub", "Гача stub")));
  $("btnShopToTavern").addEventListener("click", () => navigate("tavern"));
  $("btnSellStarter").addEventListener("click", () => {
    // Legacy wire id: now quick-sell stub (market channel), not auction listing.
    showGateTip(t("market.quick_sell.tip", "Quick sell — подними ранг в боях"));
  });
  $("btnMarketQuickSell")?.addEventListener("click", () => {
    showGateTip(t("market.quick_sell.tip", "Quick sell — подними ранг в боях"));
  });
  $("btnAuctionList")?.addEventListener("click", () => {
    showGateTip(t("auction.list.tip", "Выставление лота — подними ранг в боях"));
  });
  $("btnMarketToShop").addEventListener("click", () => navigate("shop"));
  $("btnMarketToAuction")?.addEventListener("click", () => navigate("auction"));
  $("btnAuctionToMarket")?.addEventListener("click", () => navigate("market"));
  $("btnTavernFormation").addEventListener("click", () => navigate("formation"));
  $("btnTavernHub").addEventListener("click", () => navigate("hub"));
  $("btnPassShop").addEventListener("click", () => navigate("shop"));
  $("btnPassHub").addEventListener("click", () => navigate("hub"));
  $("btnGuildBattle")?.addEventListener("click", () => navigate("guild_battle"));
  $("btnGuildHub")?.addEventListener("click", () => navigate("hub"));
  $("btnSoonHub").addEventListener("click", () => navigate("hub"));
}

async function bootStarterGrant() {
  const { data } = await api("/api/dev/starter", {
    method: "POST",
    body: JSON.stringify({ userId: "local_smoke", testRoster: true }),
  });
  applyStarterGrant(data);
  log(
    `GrantStarterKit ok cats=${(data.cats || []).length} potions=${(data.potions || []).length} fish=${data.fish} testRoster=${!!data.softLaunchTestRoster}`,
  );
}

async function loadCampaign() {
  try {
    const { data } = await api("/content/mythmir_sl.json");
    state.campaign = data;
  } catch (err) {
    console.warn("campaign load", err);
    state.campaign = { nodes: [] };
  }
  try {
    const { data } = await api("/content/boss_first_sl.json");
    state.bossFirst = data;
  } catch (err) {
    state.bossFirst = null;
  }
}

async function main() {
  window.mythfelNavigate = navigate;
  window.mythfelStartYard = startYard;
  window.mythfelStartPractice = startPractice;
  wireButtons();
  showView("viewBoot");
  $("bootMsg").textContent = "Boot → LiveOps fetch…";
  try {
    loadProgress();
    await loadLoc();
    await bootLiveOps();
    await loadCampaign();
    await bootStarterGrant();
    const battleOk = await checkBattle();
    const bp = $("battlePill");
    bp.textContent = battleOk ? "Battle :8081 OK" : "Battle DOWN";
    bp.className = `status-pill ${battleOk ? "ok" : "bad"}`;
    // Boot → Login → Hub (FULL-SPEC §6)
    state.loggedIn = false;
    state.tab = "login";
    state.primary = "combat";
    document.body.classList.add("mythfel-login");
    renderAll();
  } catch (err) {
    $("bootMsg").textContent = `Boot fail: ${err.message}. Подними CDN :8090 и battle :8081 (см. README).`;
    $("liveopsPill").textContent = "LiveOps FAIL";
    $("liveopsPill").className = "status-pill bad";
    console.error(err);
  }
}

main();
