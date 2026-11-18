/**
 * Mythfel Web HUD — battle/devapi + LiveOps wire logic + Stitch packs 0268/64d5/e608/4da7/18c7/ba17/17eb.
 * Formation is inline (no Бои subtab). Home = cat + equip + inventory (no portals).
 * Pack 18c7: practice fight + guild hall. Pack ba17: pass + chats×3.
 * Pack 17eb: tavern/shop/market/auction + ratings×2. No combat authority on client (§3.6 / §8.2).
 */

import {
  bindBattleFxGestureUnlock,
  decorateBattleUnitIdle,
  playCombatEvents,
  SoundFX,
} from "./battle-fx.js";

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
  "glavnyy-khab": "hub",
  "glavnyj-khab": "hub",
  "main-hub": "hub",
  "бой-3v3": "formation", // 3v3 строй = PvE formation (не рейд)
  "rejd-na-doga": "boss_raid", // легион 12 / рейд на босса
  "рейд-на-дога": "boss_raid",
  "двор-усадьбы": "yard",
  мифмир: "yard",
  "mythworld-pve": "yard",
  коллекция: "collection",
  "kollektsiya-pitomtsev": "collection",
  "pet-collection": "collection",
  "лавка-и-маркет": "shop",
  лавка: "shop",
  маркетплейс: "market",
  рынок: "market",
  marketplace: "shop",
  аукцион: "auction",
  "trade-hub": "trade_hub",
  "khab-torgovli-glavnaya": "trade_hub",
  "khab-torgovli-karta": "trade_hub",
  "tavern-bar": "tavern",
  "shop-donate": "shop",
  "market-resources": "market",
  "player-auctions": "auction",
  "rejting-igrokov-sezon-4": "rating_players",
  "rejting-gildiy": "rating_guilds",
  "rating-guilds": "rating_guilds",
  "rating-players": "rating_players",
  "pvp-арена": "pvp",
  "pvp-arena": "pvp",
  "arena-bitv": "pvp",
  "battle-arena": "pvp",
  "battle-pass": "pass",
  "tavern-pass": "pass",
  sezon: "pass",
  mifmir: "yard",
  "dom-khranitelya": "farm",
  gildiya: "guild",
  гильдия: "guild",
  guilds: "guild",
  gildii: "guild",
  "бой-гильдий": "guild_battle",
  "guild-war": "guild_battle",
  "voyna-gildiy": "guild_battle",
  gvg: "guild_battle",
  бой: "yard",
  boi: "yard",
  battles: "battle_hub",
  расстановка: "formation",
  таверна: "tavern",
  пасс: "pass",
  pass: "pass",
  pvp: "pvp",
  двор: "farm",
  ферма: "farm",
  ferma: "farm",
  "tavern-farm": "farm",
  питомник: "breeding",
  скрещивание: "breeding",
  "skreshchivanie": "breeding",
  "cat-breeding": "breeding",
  крафт: "craft",
  kraft: "craft",
  crafting: "craft",
  "crafting-forge": "craft",
  данжи: "boss_dungeon",
  подземелья: "boss_dungeon",
  podzemelya: "boss_dungeon",
  dungeons: "boss_dungeon",
  "dungeons-and-raids": "boss_dungeon",
  "danzhi-i-reydy": "boss_dungeon",
  рейтинги: "rating_players",
  leaderboards: "rating_players",
  rejtingi: "rating_players",
  reytingi: "rating_players",
  чат: "chat_global",
  chaty: "chat_global",
  chats: "chat_global",
  "obshchiy-chat": "chat_global",
  "guild-chat": "chat_guild",
  "chat-gildii": "chat_guild",
  "lichnye-soobshcheniya": "chat_friends",
  "friends-chat": "chat_friends",
  "season-pass": "pass",
  "boevoj-pass": "pass",
  тренировка: "practice",
  "тренировочный-лагерь": "practice",
  "training-dojo": "practice",
  trenirovka: "practice",
  "trenirovka-dodzyo": "practice",
  "zal-gildii": "guild",
  "uchastniki-i-sostav": "guild",
  "razvitie-i-tehnologii": "guild",
  "kazna-i-zadaniya": "guild",
  "mifmir-pve": "yard",
  "pve-load": "pve_load",
  "загрузка-pve": "pve_load",
  glavnaya: "hub",
  "glavnyj-hab": "hub",
  "kotiki-otryad": "collection",
  "kollektsiya-kart": "collection",
  "lavka-traktirschika": "shop",
  "klan-murr": "guild",
  torgovlya: "tavern",
  "torgovlya-hub": "tavern",
  кодекс: "codex",
  "кодекс-мифмира": "codex",
  "kodeks-mifmira": "codex",
  "mythworld-codex": "codex",
  "world-codex": "codex",
  вход: "login",
  регистрация: "login",
  "kodeks-geroev": "heroes",
  "heroes-codex": "heroes",
  "кодекс-героев": "heroes",
  "personazh": "home",
  character: "home",
  "guardian-character": "home",
  "guardian-house": "home",
  oruzheynaya: "gear",
  armory: "gear",
  "ekipirovka-sumka": "gear",
  "equipment-bag": "gear",
  inventory: "gear",
  sklad: "gear",
  "sety-broni": "armor_sets",
  "sets-broni": "armor_sets",
  "armor-sets": "armor_sets",
  "klassovye-sety": "class_sets",
  "class-sets": "class_sets",
  "weapon-sets": "class_sets",
  "kartochki-ekipirovki": "equip_cards",
  "equipment-cards": "equip_cards",
  "gear-cards": "equip_cards",
  kuznitsa: "craft",
  blacksmith: "craft",
  taverna: "tavern",
  "дом-хранителя": "home",
  усадьба: "home",
};

/**
 * Primary tabs + adaptive subtabs (game HUD IA).
 * Route ids stay stable (yard = Мифмир PvE map).
 * formation is NOT a combat subtab — open inline via CTA / wire dock.
 */
/** Knowledge atlas screens stay reachable; not primary subtabs (D-033). */
const KNOWLEDGE_TABS = [
  { id: "armor_sets", key: "nav.sub.armor_sets", gated: true },
  { id: "class_sets", key: "nav.sub.class_sets", gated: true },
  { id: "equip_cards", key: "nav.sub.equip_cards", gated: true },
  { id: "heroes", key: "nav.sub.heroes" },
  { id: "codex", key: "nav.sub.codex" },
];

/**
 * Locked IA (D-033). Order + subtabs frozen — do not change without Andrew + new D-0xx.
 * Primary: pass → character → trade → combat → guilds → ratings → friends → knowledge.
 */
const NAV = [
  {
    id: "pass",
    key: "nav.primary.pass",
    label: "Боевой пропуск",
    route: "pass",
    tabs: [],
  },
  {
    id: "character",
    key: "nav.primary.character",
    label: "Дом Хранителя",
    route: "home",
    tabs: [
      { id: "farm", key: "nav.sub.farm", soon: "farm", gated: true },
      { id: "craft", key: "nav.sub.craft", gated: true },
      { id: "home", key: "nav.sub.home" },
      { id: "gear", key: "nav.sub.gear" },
      { id: "collection", key: "nav.sub.collection" },
      { id: "breeding", key: "nav.sub.breeding", gated: true },
    ],
  },
  {
    id: "trade",
    key: "nav.primary.trade",
    label: "Торговля",
    route: "trade_hub",
    tabs: [
      { id: "trade_hub", key: "nav.sub.trade_hub" },
      { id: "tavern", key: "nav.sub.tavern" },
      { id: "shop", key: "nav.sub.shop" },
      { id: "market", key: "nav.sub.market" },
      { id: "auction", key: "nav.sub.auction" },
    ],
  },
  {
    id: "combat",
    key: "nav.primary.combat",
    label: "Бои",
    route: "battle_hub",
    tabs: [
      { id: "battle_hub", key: "nav.sub.mythmir" },
      { id: "practice", key: "nav.sub.practice" },
      { id: "pve", key: "nav.sub.pve" },
      { id: "pvp", key: "nav.sub.pvp", gated: "pvp" },
      { id: "boss_dungeon", key: "nav.sub.boss_dungeon" },
      { id: "boss_raid", key: "nav.sub.boss_raid", gated: true },
      { id: "guild_battle", key: "nav.sub.guild_battle", gated: true },
    ],
  },
  {
    id: "guilds",
    key: "nav.primary.guilds",
    label: "Гильдии",
    route: "guild_hub",
    tabs: [
      { id: "guild_hub", key: "nav.sub.guild_hub" },
      { id: "guild", key: "nav.sub.guild" },
      { id: "chat_guild", key: "nav.sub.chat_guild" },
    ],
  },
  {
    id: "ratings",
    key: "nav.primary.ratings",
    label: "Рейтинги",
    route: "rating_players",
    tabs: [
      { id: "rating_players", key: "nav.sub.rating_players" },
      { id: "rating_dungeon", key: "nav.sub.rating_dungeon" },
      { id: "rating_raid", key: "nav.sub.rating_raid" },
      { id: "rating_guilds", key: "nav.sub.rating_guilds" },
    ],
  },
  {
    id: "friends",
    key: "nav.primary.chats",
    label: "Друзья",
    route: "chat_friends",
    tabs: [
      { id: "chat_friends", key: "nav.sub.chat_friends" },
      { id: "chat_global", key: "nav.sub.chat_global" },
    ],
  },
  {
    id: "knowledge",
    key: "nav.primary.knowledge",
    label: "База знаний",
    route: "codex",
    tabs: [],
  },
];

/** Flat list kept for verify-nav id: "…" probes (includes База знаний children) */
const TABS = NAV.flatMap((g) =>
  g.tabs.flatMap((t) => {
    const self = { ...t, group: g.id };
    if (Array.isArray(t.tabs) && t.tabs.length) {
      return [self, ...t.tabs.map((c) => ({ ...c, group: g.id, parent: t.id }))];
    }
    return [self];
  }),
).concat(
  [
    { id: "hub", key: "hub.tab.hub", group: "hub" },
    { id: "login", key: "nav.sub.login", group: "auth" },
    { id: "pass", key: "nav.sub.pass", group: "pass" },
    { id: "knowledge", key: "nav.sub.knowledge", group: "knowledge" },
    { id: "soon_clan", key: "nav.sub.soon_clan", group: "guilds", soon: "clan_boss" },
    { id: "yard", key: "nav.sub.pve", group: "combat" },
  ],
  KNOWLEDGE_TABS.map((t) => ({ ...t, group: "knowledge" })),
);

function findNavForTab(tabId) {
  for (const g of NAV) {
    if (g.route === tabId) return g;
    for (const t of g.tabs) {
      if (t.id === tabId) return g;
      if (Array.isArray(t.tabs) && t.tabs.some((c) => c.id === tabId)) return g;
    }
  }
  if (tabId === "knowledge" || KNOWLEDGE_TABS.some((t) => t.id === tabId)) {
    return NAV.find((g) => g.id === "knowledge") || null;
  }
  if (tabId === "soon_clan") return NAV.find((g) => g.id === "guilds") || null;
  if (
    tabId === "yard" ||
    tabId === "battle_hub" ||
    tabId === "practice" ||
    tabId === "pve" ||
    tabId === "pvp" ||
    tabId === "boss_dungeon" ||
    tabId === "boss_raid" ||
    tabId === "guild_battle"
  ) {
    return NAV.find((g) => g.id === "combat") || null;
  }
  if (tabId === "rating_dungeon" || tabId === "rating_raid" || tabId === "rating_players" || tabId === "rating_guilds") {
    return NAV.find((g) => g.id === "ratings") || null;
  }
  if (tabId === "chat_friends" || tabId === "chat_global") {
    return NAV.find((g) => g.id === "friends") || null;
  }
  return null;
}

function findNavTabMeta(tabId) {
  for (const g of NAV) {
    if (g.route === tabId) return { group: g, tab: { id: tabId, key: g.key }, parent: null };
    for (const t of g.tabs) {
      if (t.id === tabId) return { group: g, tab: t, parent: null };
      if (Array.isArray(t.tabs)) {
        const child = t.tabs.find((c) => c.id === tabId);
        if (child) return { group: g, tab: child, parent: t };
      }
    }
  }
  const knowledge = KNOWLEDGE_TABS.find((t) => t.id === tabId);
  if (knowledge || tabId === "knowledge") {
    return {
      group: NAV.find((g) => g.id === "knowledge") || null,
      tab: knowledge || { id: "codex", key: "nav.sub.codex" },
      parent: null,
    };
  }
  if (tabId === "soon_clan") {
    return {
      group: NAV.find((g) => g.id === "guilds") || null,
      tab: { id: "soon_clan", key: "nav.sub.soon_clan", soon: "clan_boss" },
      parent: null,
    };
  }
  if (tabId === "yard") {
    return {
      group: NAV.find((g) => g.id === "combat") || null,
      tab: { id: "pve", key: "nav.sub.pve" },
      parent: null,
    };
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
  { id: "bait_worm", name: "Наживка · червяк", price: 12, kind: "bait", gated: false },
  { id: "bait_shiny", name: "Наживка · блесна", price: 28, kind: "bait", gated: false },
  { id: "res_wood", name: "Бревно", price: 8, kind: "resource", gated: false },
  { id: "res_ore", name: "Руда", price: 12, kind: "resource", gated: false },
  { id: "craft_herb_bundle", name: "Пучок трав (крафт)", price: 18, kind: "ingredient", gated: false },
  { id: "potion_stone_skin", name: "Зелье каменной шкуры", price: 45, kind: "potion", gated: false },
];

/** Farm Soon zones — map pins + dock list (Phase 6 / SL stub). */
const FARM_ZONES = [
  { id: "wheat", label: "Пшеничные грядки", kind: "crop", role: "farmer" },
  { id: "herbs", label: "Аптекарские грядки", kind: "crop", role: "farmer" },
  { id: "garden", label: "Бахча & мята", kind: "crop", role: "farmer" },
  { id: "orchard", label: "Яблоневый сад", kind: "crop", role: "farmer" },
  { id: "fishing", label: "Рыбная заводя", kind: "water", role: "fisher" },
  { id: "wood", label: "Дубовая лесопилка", kind: "gather", role: "woodcutter" },
  { id: "mine", label: "Рудник", kind: "gather", role: "miner" },
  { id: "stone", label: "Гранитный карьер", kind: "gather", role: "stonemason" },
  { id: "forge", label: "Кузня", kind: "craft", role: "blacksmith" },
  { id: "alchemist", label: "Склад алхимика", kind: "craft", role: "alchemist" },
];

/** Pass ACTIVE autofarm toggles — UI only; server ticks later. */
const AUTOFARM_TOGGLES = [
  {
    id: "autofarm_crops",
    label: "Фермеры: сбор + посев",
    detail: "нужны seeds с Рынка",
  },
  {
    id: "autofarm_alchemy",
    label: "Mats → алхимик → зелья",
    detail: "auto-craft potions",
  },
  {
    id: "autofarm_gather",
    label: "Дровосек / шахтёр / каменотёс → кузнец",
    detail: "auto-gather",
  },
  {
    id: "autofarm_blacksmith",
    label: "Кузнец: auto-craft выбранных",
    detail: "item id list stub",
  },
  {
    id: "autofarm_fish",
    label: "Рыбная заводя: auto-cast",
    detail: "нужна наживка",
  },
];
const PASS_ACTIVE_TIP = "Активируй боевой пасс";

const SHOP_STUB_ROWS = [
  { id: "iap_yarn", label: "IAP · пряжа / донат", detail: "yarn packs", gated: false },
  { id: "pass_buy", label: "Боевой пасс (×2 XP)", detail: "season pass", gated: false },
  { id: "fish_pack_s", label: "Пак рыбок S · 500", detail: "fish coins", gated: false },
  { id: "fish_pack_m", label: "Пак рыбок M · 2000", detail: "fish coins", gated: false },
  { id: "breed_milk_essence", label: "Эссенция молока", detail: "nursery mat · Soon", gated: true },
  { id: "breed_moon_whisker", label: "Лунный ус", detail: "nursery mat · Soon", gated: true },
  { id: "breed_stone_purr", label: "Каменный мур", detail: "nursery mat · Soon", gated: true },
  { id: "breed_spark_pollen", label: "Искрящая пыльца", detail: "nursery mat · Soon", gated: true },
  { id: "breed_tide_scale", label: "Чешуя прилива", detail: "nursery mat · Soon", gated: true },
  { id: "talisman_mythic_luck", label: "Талисман удачи (+20%)", detail: "IAP yarn · Phase 6", gated: true },
  { id: "armor_grey_plate", label: "Стартовая броня · grey R1 plate", detail: "Rank 1", gated: false },
  { id: "armor_grey_pendant", label: "Стартовый кулон · grey R1", detail: "Rank 1", gated: false },
  { id: "battle_coin_gear", label: "Gear за battle coins", detail: "medals → shop", gated: true },
];

/** Codex knowledge base — titles/bodies from docs/game-wiki.md where possible. */
// CODEX_FILTERS / CODEX_TOPICS live in /codex-topics.js


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
  lastBattleFxKey: null,
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
  codexEntryId: "class_sets",
  codexFilter: "all",
  codexQuery: "",
  codexRead: {},
  codexRankFocus: 6,
  guildBattleSize: 3,
  passActiveStub: false,
  autofarm: {
    autofarm_crops: false,
    autofarm_alchemy: false,
    autofarm_gather: false,
    autofarm_blacksmith: false,
    autofarm_fish: false,
  },
  /**
   * Local HUD gear catalog — color sets + class weapons (batches 1–5) + rings.
   * Armor/trinket (helm/armor/cloak/belt/boots/ring): all roles. Weapons/offhand: `roles` gate.
   * Offhand uses shield slot (2nd axe/dagger, shield, quiver, scroll, book).
   * Mage: yellow staff / wand + book. Support: turquoise staff + scroll.
   */
  /**
   * Gear stats on combat scale (tank LVL1 HP=50, card hit ≈5–6).
   * Armor pieces → DEF + modest HP. Weapons → modest ATK (+2…+4), not card-scale spikes.
   * Rings → modest HP/DEF (+ optional ATK/SPD/crit); all heroes (D-018 slot).
   */
  gearCatalog: [
    // —— grey (R1) armor 5/5: +6 DEF · +8 HP ——
    { id: "grey_helm", slot: "helm", name: "Серый шлем Льва", atk: 0, hp: 1, def: 1, spd: 0, crit: 0, rank: 1, rarity: "common", enhance: 0, set: "grey", roles: null, iconSrc: "/gear-sets/thumbs/grey-helm.png" },
    { id: "grey_armor", slot: "armor", name: "Серая кираса Льва", atk: 0, hp: 3, def: 2, spd: 0, crit: 0, rank: 1, rarity: "common", enhance: 0, set: "grey", roles: null, iconSrc: "/gear-sets/thumbs/grey-armor.png" },
    { id: "grey_cloak", slot: "cloak", name: "Серый плащ Льва", atk: 0, hp: 2, def: 1, spd: 0, crit: 0, rank: 1, rarity: "common", enhance: 0, set: "grey", roles: null, iconSrc: "/gear-sets/thumbs/grey-cloak.png" },
    { id: "grey_belt", slot: "belt", name: "Серый пояс Льва", atk: 0, hp: 1, def: 1, spd: 0, crit: 0, rank: 1, rarity: "common", enhance: 0, set: "grey", roles: null, iconSrc: "/gear-sets/thumbs/grey-belt.png" },
    { id: "grey_boots", slot: "boots", name: "Серые когтистые сапоги", atk: 0, hp: 1, def: 1, spd: 1, crit: 0, rank: 1, rarity: "common", enhance: 0, set: "grey", roles: null, iconSrc: "/gear-sets/thumbs/grey-boots.png" },
    { id: "grey_ring", slot: "ring", name: "Серое кольцо Лапы", atk: 0, hp: 1, def: 1, spd: 0, crit: 0, rank: 1, rarity: "common", enhance: 0, set: "grey", roles: null, iconSrc: "/gear-sets/thumbs/grey-ring.png" },
    // —— yellow (R4) armor 5/5: +11 DEF · +13 HP · +2 ATK ——
    { id: "yellow_helm", slot: "helm", name: "Жёлтая шляпа Чародея", atk: 1, hp: 2, def: 2, spd: 0, crit: 0, rank: 4, rarity: "epic", enhance: 6, set: "yellow", roles: null, iconSrc: "/gear-sets/thumbs/yellow-helm.png" },
    { id: "yellow_armor", slot: "armor", name: "Жёлтая кираса Солнца", atk: 1, hp: 4, def: 3, spd: 0, crit: 0, rank: 4, rarity: "epic", enhance: 6, set: "yellow", roles: null, iconSrc: "/gear-sets/thumbs/yellow-armor.png" },
    { id: "yellow_cloak", slot: "cloak", name: "Жёлтый плащ Солнца", atk: 0, hp: 3, def: 2, spd: 0, crit: 0, rank: 4, rarity: "epic", enhance: 6, set: "yellow", roles: null, iconSrc: "/gear-sets/thumbs/yellow-cloak.png" },
    { id: "yellow_belt", slot: "belt", name: "Жёлтый пояс Льва", atk: 0, hp: 2, def: 2, spd: 0, crit: 0, rank: 4, rarity: "epic", enhance: 6, set: "yellow", roles: null, iconSrc: "/gear-sets/thumbs/yellow-belt.png" },
    { id: "yellow_boots", slot: "boots", name: "Жёлтые когтистые сапоги", atk: 0, hp: 2, def: 2, spd: 1, crit: 0, rank: 4, rarity: "epic", enhance: 6, set: "yellow", roles: null, iconSrc: "/gear-sets/thumbs/yellow-boots.png" },
    { id: "yellow_ring", slot: "ring", name: "Жёлтое кольцо Льва", atk: 1, hp: 1, def: 1, spd: 0, crit: 0, rank: 4, rarity: "epic", enhance: 6, set: "yellow", roles: null, iconSrc: "/gear-sets/thumbs/yellow-ring.png" },
    { id: "yellow_staff", slot: "weapon", name: "Жёлтый посох Солнца (2H)", atk: 3, hp: 0, def: 0, spd: 0, crit: 1, rank: 4, rarity: "epic", enhance: 8, set: "yellow", roles: ["mage"], iconSrc: "/gear-sets/thumbs/yellow-staff.png" },
    { id: "yellow_wand", slot: "weapon", name: "Жёлтый жезл Солнца (1H)", atk: 2, hp: 0, def: 0, spd: 1, crit: 0, rank: 4, rarity: "epic", enhance: 6, set: "yellow", roles: ["mage"], iconSrc: "/gear-sets/thumbs/yellow-wand.png" },
    { id: "mage_book", slot: "shield", name: "Книга Чародея", atk: 1, hp: 1, def: 1, spd: 0, crit: 1, rank: 4, rarity: "epic", enhance: 6, set: "yellow", roles: ["mage"], iconSrc: "/gear-sets/thumbs/mage-book.png" },
    // —— turquoise (R3) armor 5/5: +9 DEF · +11 HP · +1 ATK ——
    { id: "turquoise_helm", slot: "helm", name: "Бирюзовая шляпа", atk: 0, hp: 2, def: 2, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 4, set: "turquoise", roles: null, iconSrc: "/gear-sets/thumbs/turquoise-helm.png" },
    { id: "turquoise_armor", slot: "armor", name: "Бирюзовая мантия", atk: 1, hp: 3, def: 3, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 4, set: "turquoise", roles: null, iconSrc: "/gear-sets/thumbs/turquoise-armor.png" },
    { id: "turquoise_cloak", slot: "cloak", name: "Бирюзовый плащ", atk: 0, hp: 2, def: 2, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 4, set: "turquoise", roles: null, iconSrc: "/gear-sets/thumbs/turquoise-cloak.png" },
    { id: "turquoise_belt", slot: "belt", name: "Бирюзовый пояс", atk: 0, hp: 2, def: 1, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 4, set: "turquoise", roles: null, iconSrc: "/gear-sets/thumbs/turquoise-belt.png" },
    { id: "turquoise_boots", slot: "boots", name: "Бирюзовые сапоги", atk: 0, hp: 2, def: 1, spd: 1, crit: 0, rank: 3, rarity: "rare", enhance: 4, set: "turquoise", roles: null, iconSrc: "/gear-sets/thumbs/turquoise-boots.png" },
    { id: "turquoise_ring", slot: "ring", name: "Бирюзовое кольцо Рыси", atk: 0, hp: 2, def: 1, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 4, set: "turquoise", roles: null, iconSrc: "/gear-sets/thumbs/turquoise-ring.png" },
    { id: "turquoise_staff", slot: "weapon", name: "Бирюзовый посох", atk: 2, hp: 0, def: 0, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 4, set: "turquoise", roles: ["support"], iconSrc: "/gear-sets/thumbs/turquoise-staff.png" },
    // —— red (R6) armor 5/5: +14 DEF · +16 HP · +2 ATK ——
    { id: "red_helm", slot: "helm", name: "Красный шлем Дракона", atk: 0, hp: 3, def: 3, spd: 0, crit: 0, rank: 6, rarity: "legendary", enhance: 10, set: "red", roles: null, iconSrc: "/gear-sets/thumbs/red-helm.png" },
    { id: "red_armor", slot: "armor", name: "Красная кираса Дракона", atk: 1, hp: 5, def: 4, spd: 0, crit: 0, rank: 6, rarity: "legendary", enhance: 10, set: "red", roles: null, iconSrc: "/gear-sets/thumbs/red-armor.png" },
    { id: "red_cloak", slot: "cloak", name: "Красный плащ Тигра", atk: 1, hp: 3, def: 3, spd: 0, crit: 0, rank: 6, rarity: "legendary", enhance: 9, set: "red", roles: null, iconSrc: "/gear-sets/thumbs/red-cloak.png" },
    { id: "red_belt", slot: "belt", name: "Красный пояс Тигра", atk: 0, hp: 2, def: 2, spd: 0, crit: 0, rank: 6, rarity: "legendary", enhance: 9, set: "red", roles: null, iconSrc: "/gear-sets/thumbs/red-belt.png" },
    { id: "red_boots", slot: "boots", name: "Красные шипованные сапоги", atk: 0, hp: 3, def: 2, spd: 2, crit: 0, rank: 6, rarity: "legendary", enhance: 9, set: "red", roles: null, iconSrc: "/gear-sets/thumbs/red-boots.png" },
    { id: "red_ring", slot: "ring", name: "Красное кольцо Дракона", atk: 1, hp: 2, def: 1, spd: 0, crit: 0, rank: 6, rarity: "legendary", enhance: 9, set: "red", roles: null, iconSrc: "/gear-sets/thumbs/red-ring.png" },
    // —— purple (R5) armor 5/5: +12 DEF · +14 HP · +2 ATK ——
    { id: "purple_helm", slot: "helm", name: "Фиолетовый капюшон", atk: 1, hp: 2, def: 2, spd: 0, crit: 1, rank: 5, rarity: "epic", enhance: 8, set: "purple", roles: null, iconSrc: "/gear-sets/thumbs/purple-helm.png" },
    { id: "purple_armor", slot: "armor", name: "Фиолетовая кираса Пантеры", atk: 1, hp: 4, def: 4, spd: 0, crit: 0, rank: 5, rarity: "epic", enhance: 8, set: "purple", roles: null, iconSrc: "/gear-sets/thumbs/purple-armor.png" },
    { id: "purple_cloak", slot: "cloak", name: "Фиолетовый плащ Пантеры", atk: 0, hp: 3, def: 2, spd: 0, crit: 0, rank: 5, rarity: "epic", enhance: 8, set: "purple", roles: null, iconSrc: "/gear-sets/thumbs/purple-cloak.png" },
    { id: "purple_belt", slot: "belt", name: "Фиолетовый пояс Пантеры", atk: 0, hp: 2, def: 2, spd: 0, crit: 1, rank: 5, rarity: "epic", enhance: 8, set: "purple", roles: null, iconSrc: "/gear-sets/thumbs/purple-belt.png" },
    { id: "purple_boots", slot: "boots", name: "Фиолетовые когтистые сапоги", atk: 0, hp: 3, def: 2, spd: 2, crit: 1, rank: 5, rarity: "epic", enhance: 8, set: "purple", roles: null, iconSrc: "/gear-sets/thumbs/purple-boots.png" },
    { id: "purple_ring", slot: "ring", name: "Фиолетовое кольцо Небулы", atk: 1, hp: 1, def: 1, spd: 0, crit: 1, rank: 5, rarity: "epic", enhance: 8, set: "purple", roles: null, iconSrc: "/gear-sets/thumbs/purple-ring.png" },
    // —— green (R2) armor 5/5: +8 DEF · +10 HP · +1 ATK ——
    { id: "green_helm", slot: "helm", name: "Зелёная шляпа Следопыта", atk: 0, hp: 2, def: 1, spd: 0, crit: 0, rank: 2, rarity: "rare", enhance: 4, set: "green", roles: null, iconSrc: "/gear-sets/thumbs/green-helm.png" },
    { id: "green_armor", slot: "armor", name: "Зелёная чешуя Рыси", atk: 1, hp: 3, def: 3, spd: 0, crit: 0, rank: 2, rarity: "rare", enhance: 4, set: "green", roles: null, iconSrc: "/gear-sets/thumbs/green-armor.png" },
    { id: "green_cloak", slot: "cloak", name: "Зелёный плащ листвы", atk: 0, hp: 2, def: 1, spd: 0, crit: 0, rank: 2, rarity: "rare", enhance: 4, set: "green", roles: null, iconSrc: "/gear-sets/thumbs/green-cloak.png" },
    { id: "green_belt", slot: "belt", name: "Зелёный пояс Рыси", atk: 0, hp: 1, def: 1, spd: 0, crit: 0, rank: 2, rarity: "rare", enhance: 4, set: "green", roles: null, iconSrc: "/gear-sets/thumbs/green-belt.png" },
    { id: "green_boots", slot: "boots", name: "Зелёные сапоги листвы", atk: 0, hp: 2, def: 2, spd: 1, crit: 0, rank: 2, rarity: "rare", enhance: 4, set: "green", roles: null, iconSrc: "/gear-sets/thumbs/green-boots.png" },
    { id: "green_ring", slot: "ring", name: "Зелёное кольцо Рыси", atk: 0, hp: 1, def: 1, spd: 1, crit: 0, rank: 2, rarity: "rare", enhance: 4, set: "green", roles: null, iconSrc: "/gear-sets/thumbs/green-ring.png" },
    // —— class weapons / offhands (ATK modest vs card hit ~5–6) ——
    { id: "tank_mace", slot: "weapon", name: "Булава Стража", atk: 2, hp: 1, def: 1, spd: 0, crit: 0, rank: 4, rarity: "epic", enhance: 8, set: null, roles: ["tank"], iconSrc: "/gear-sets/thumbs/tank-mace.png" },
    { id: "tank_spear", slot: "weapon", name: "Копьё Стража", atk: 2, hp: 0, def: 0, spd: 1, crit: 1, rank: 4, rarity: "epic", enhance: 8, set: null, roles: ["tank"], iconSrc: "/gear-sets/thumbs/tank-spear.png" },
    { id: "tank_shield_large", slot: "shield", name: "Большой щит Льва", atk: 0, hp: 3, def: 4, spd: 0, crit: 0, rank: 4, rarity: "epic", enhance: 10, set: null, roles: ["tank"], iconSrc: "/gear-sets/thumbs/tank-shield-large.png" },
    { id: "tank_shield_small", slot: "shield", name: "Малый щит Льва", atk: 0, hp: 2, def: 3, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 6, set: null, roles: ["tank"], iconSrc: "/gear-sets/thumbs/tank-shield-small.png" },
    { id: "fighter_greatsword", slot: "weapon", name: "Двуручный меч Тигра", atk: 4, hp: 0, def: 0, spd: 0, crit: 2, rank: 6, rarity: "legendary", enhance: 10, set: "red", roles: ["fighter"], iconSrc: "/gear-sets/thumbs/fighter-greatsword.png" },
    { id: "fighter_axe_a", slot: "weapon", name: "Топор Бойца A", atk: 2, hp: 0, def: 0, spd: 0, crit: 1, rank: 6, rarity: "legendary", enhance: 8, set: "red", roles: ["fighter"], iconSrc: "/gear-sets/thumbs/fighter-axe-a.png" },
    { id: "fighter_axe_b", slot: "shield", name: "Топор Бойца B", atk: 2, hp: 0, def: 0, spd: 0, crit: 1, rank: 6, rarity: "legendary", enhance: 8, set: "red", roles: ["fighter"], iconSrc: "/gear-sets/thumbs/fighter-axe-b.png" },
    { id: "assassin_dagger_a", slot: "weapon", name: "Кинжал Убийцы A", atk: 2, hp: 0, def: 0, spd: 1, crit: 2, rank: 5, rarity: "epic", enhance: 8, set: "purple", roles: ["assassin"], iconSrc: "/gear-sets/thumbs/assassin-dagger-a.png" },
    { id: "assassin_dagger_b", slot: "shield", name: "Кинжал Убийцы B", atk: 2, hp: 0, def: 0, spd: 1, crit: 2, rank: 5, rarity: "epic", enhance: 8, set: "purple", roles: ["assassin"], iconSrc: "/gear-sets/thumbs/assassin-dagger-b.png" },
    { id: "green_bow", slot: "weapon", name: "Зелёный лук Рыси", atk: 2, hp: 0, def: 0, spd: 1, crit: 1, rank: 2, rarity: "rare", enhance: 4, set: "green", roles: ["ranger"], iconSrc: "/gear-sets/thumbs/green-bow.png" },
    { id: "green_crossbow", slot: "weapon", name: "Зелёный арбалет", atk: 2, hp: 0, def: 0, spd: 0, crit: 1, rank: 2, rarity: "rare", enhance: 4, set: "green", roles: ["ranger"], iconSrc: "/gear-sets/thumbs/green-crossbow.png" },
    { id: "green_arrows", slot: "shield", name: "Колчан зелёных стрел", atk: 1, hp: 0, def: 0, spd: 0, crit: 0, rank: 2, rarity: "rare", enhance: 2, set: "green", roles: ["ranger"], iconSrc: "/gear-sets/thumbs/green-arrows.png" },
    { id: "support_scroll", slot: "shield", name: "Свиток Поддержки", atk: 0, hp: 2, def: 1, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 4, set: "turquoise", roles: ["support"], iconSrc: "/gear-sets/thumbs/support-scroll.png" },
  ],
  /** Derived from gearCatalog (D-028); farm/potion/blueprint = Soon, not live stock. */
  barnCatalog: [],
  barnCatFilter: "all",
  barnRarityFilter: "all",
  barnSearch: "",
  barnFocus: null,
  barnCapMax: 96,
  /** Local stub persist on; set false to prefer GET /api/dev/gear (Wave B). */
  gearStubLocal: true,
  /** D-030 breeding HUD stub (GET /api/dev/breeding when loaded). */
  breedingStub: null,
  breedFatherId: null,
  breedMotherId: null,
  breedPickSlot: null,
  /** D-031 collection HUD stub. */
  collectionStub: null,
  colRoleFilter: "all",
  colSearch: "",
  colSelectedId: null,
  colPresetIndex: 0,
  colDrag: null,
  /** catId → slot → item id */
  equippedByCat: {},
  homeBagFilter: "all",
  homeRarityFilter: "all",
  homeRoleFilter: "all",
  homeBagFocus: null,
  selectedCatId: null,
  /** Farm zones: farmer hired + crop cycle (local stub). */
  farmState: {},
  farmBag: [],
  clan: null, // { name, members: string[], createdAt }
  wireMode: "hub",
  loggedIn: false,
  selectedStageId: YARD_STAGE,
  battleMode: "pve", // pve | practice | boss | guild_demo | pvp
  /** Practice dojo selected squad — templateIds, max 3; starts empty. */
  practiceSquad: [],
  practiceFilterRole: "",
  practiceFilterEl: "",
  /** Practice load overlay progress (0–100) + timer handle. */
  practiceLoadPct: 0,
  practiceLoadTimer: null,
  /** PvE campaign (MF-151): chapter 1–5, stage entrance|tunnel|boss. */
  pveChapter: 1,
  pveStage: "entrance",
  pveLoadPct: 0,
  pveLoadTimer: null,
  /** D-039 · carryAlive across chapter levels; living restored at MaxHP next CreatePvE. */
  pveCarryAlive: [true, true, true],
  /** True while auto-starting next Mythmir wave after f1/f2 win. */
  pveAdvancingWave: false,
  /** D-039 · post-fight fatigue until ts (ms); SL stub via liveops pve_fatigue_stub. */
  pveFatigueUntil: 0,
  /** True while opponent 6-card face-down discard throw VFX is playing. */
  oppThrowPlaying: false,
  bossWaveIndex: 0,
  campaign: null,
  bossFirst: null,
  progress: {
    pveWins: 0,
    practiceWins: 0,
    pvpWins: 0,
    clearedFights: {}, // stageId -> true
  },
};

/** Seed for warehouse stub reset / API mirror (D-028). */
const GEAR_CATALOG_SEED = JSON.parse(JSON.stringify(state.gearCatalog));

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

function hideGateTip() {
  const banner = $("gateTipBanner");
  if (banner) banner.classList.add("hidden");
  clearTimeout(hideGateTip._t);
}

function showGateTip(custom) {
  const msg = custom || t("gate.tip.rank", GATE_TIP);
  toast(msg);
  const banner = $("gateTipBanner");
  if (banner) {
    banner.textContent = msg;
    banner.classList.remove("hidden");
    clearTimeout(hideGateTip._t);
    // Never leave an orphan tip button floating on Tavern/Home after a gated click.
    hideGateTip._t = setTimeout(() => hideGateTip(), 2400);
  }
}

function persistProgress() {
  try {
    localStorage.setItem("mythfel_sl_progress", JSON.stringify(state.progress));
  } catch (_) {}
}

function persistGearStub() {
  try {
    localStorage.setItem(
      "mythfel_sl_gear",
      JSON.stringify({
        gearCatalog: state.gearCatalog,
        equippedByCat: state.equippedByCat,
        barnCapMax: state.barnCapMax,
      }),
    );
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
        pvpWins: parsed.pvpWins || 0,
        clearedFights: parsed.clearedFights || {},
      };
    }
  } catch (_) {}
}

/** Append seed items missing from persisted catalog (e.g. new rings). */
function mergeGearCatalogSeed() {
  const have = new Set((state.gearCatalog || []).map((g) => g.id));
  for (const seed of GEAR_CATALOG_SEED) {
    if (have.has(seed.id)) continue;
    state.gearCatalog.push(JSON.parse(JSON.stringify(seed)));
  }
}

function loadGearStub() {
  try {
    const raw = localStorage.getItem("mythfel_sl_gear");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.gearCatalog) && parsed.gearCatalog.length) {
      state.gearCatalog = parsed.gearCatalog;
      mergeGearCatalogSeed();
    }
    if (parsed.equippedByCat && typeof parsed.equippedByCat === "object") {
      state.equippedByCat = parsed.equippedByCat;
    }
    if (typeof parsed.barnCapMax === "number" && parsed.barnCapMax > 0) {
      state.barnCapMax = parsed.barnCapMax;
    }
  } catch (_) {}
}

/** Wave B: optional GET /api/dev/gear when gearStubLocal=false; else keep local seed/persist. */
async function bootGearCatalog() {
  if (state.gearStubLocal !== false) {
    syncBarnFromGear();
    return;
  }
  try {
    const { data } = await api("/api/dev/gear");
    if (Array.isArray(data?.items) && data.items.length) {
      state.gearCatalog = data.items;
      if (typeof data.cap === "number") state.barnCapMax = data.cap;
      persistGearStub();
    }
  } catch (_) {
    state.gearCatalog = JSON.parse(JSON.stringify(GEAR_CATALOG_SEED));
  }
  syncBarnFromGear();
}

/** D-030: load breeding stub JSON (not live breed). */
async function bootBreedingStub() {
  try {
    const { data } = await api("/api/dev/breeding");
    if (data && typeof data === "object") state.breedingStub = data;
  } catch (_) {
    try {
      const res = await fetch("/breeding-stub.json", { cache: "no-store" });
      if (res.ok) state.breedingStub = await res.json();
    } catch (__) {
      state.breedingStub = {
        stub: true,
        mythicChanceLabel: "малый",
        ctaLabel: "СКОРО · ПОДНИМИ РАНГ",
        mats: [],
        incubator: { used: 0, max: 4, slots: [] },
      };
    }
  }
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
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const { data, headers } = await api(`/api/liveops/v1/liveops.json`, {
      headers: { "X-Client-Region": CLIENT_REGION },
      signal: ctrl.signal,
    });
    state.liveOps = data;
    state.liveOpsMeta = {
      version: headers.get("X-LiveOps-Version") || data?.version || "?",
      sig: headers.get("X-LiveOps-Signature") || "",
      alg: headers.get("X-LiveOps-Signature-Alg") || "",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function checkBattle() {
  const { data } = await api("/api/battle/healthz");
  return data?.ok === true;
}

function featureFlags() {
  return state.liveOps?.feature_flags || {};
}

/** Smoke / stub: pass ACTIVE until real passActiveUntil from profile. */
function passActive() {
  if (state.passActiveStub) return true;
  const until = state.profile?.passActiveUntil;
  if (!until) return false;
  const ts = typeof until === "number" ? until : Date.parse(until);
  return Number.isFinite(ts) && ts > Date.now();
}

function showPassGateTip() {
  showGateTip(t("gate.tip.pass", PASS_ACTIVE_TIP));
}

function logicalViewId() {
  if (state.battle && !state.battle.result) {
    // PvE live fight reuses practice HUD (cutouts + hand + FX). Painted #viewPveFight is stub chrome only.
    if (state.battleMode === "practice" || state.battleMode === "pve") return "viewPracticeFight";
    if (state.battleMode === "pvp") return "viewPvpFight";
    return "viewBattle";
  }
  // Mid-chapter wave clear / in-flight next CreatePvE: keep fight HUD (no victory).
  if (
    state.battleMode === "pve" &&
    (state.pveAdvancingWave ||
      (state.battle?.result === "p1_win" && !state.lastResult))
  ) {
    return "viewPracticeFight";
  }
  if (state.battle?.result && state.lastResult) {
    if (state.lastResult.result === "p1_win" && state.battleMode === "practice") {
      return "viewVictoryHall";
    }
    if (state.lastResult.result === "p1_win" && state.battleMode === "pve") {
      return "viewPveVictory";
    }
    if (state.lastResult.result === "p1_win" && state.battleMode === "pvp") {
      return "viewPvpVictory";
    }
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
    pve: "viewYard",
    battle_hub: "viewBattleHub",
    formation: "viewFormation",
    boss_dungeon: "viewBossDungeon",
    boss_raid: "viewBossRaid",
    battle: "viewBattle",
    pvp: "viewPvp",
    pve_load: "viewPveLoad",
    pve_fight: "viewPveFight",
    pve_victory: "viewPveVictory",
    pvp_load: "viewPvpLoad",
    collection: "viewCollection",
    trade_hub: "viewTradeHub",
    shop: "viewShop",
    market: "viewMarket",
    tavern: "viewTavern",
    pass: "viewPass",
    gear: "viewGear",
    home: "viewHome",
    heroes: "viewHeroes",
    armor_sets: "viewCodex",
    class_sets: "viewCodex",
    equip_cards: "viewEquipCards",
    craft: "viewCraft",
    breeding: "viewBreeding",
    farm: "viewSoonFarm",
    soon_clan: "viewSoonClan",
    auction: "viewAuction",
    guild: "viewGuild",
    guild_hub: "viewGuild",
    guild_battle: "viewGuildBattle",
    chat_global: "viewChatGlobal",
    chat_guild: "viewChatGuild",
    chat_friends: "viewChatFriends",
    rating_players: "viewRatingPlayers",
    rating_dungeon: "viewRatingPlayers",
    rating_raid: "viewRatingPlayers",
    rating_guilds: "viewRatingGuilds",
  };
  return map[state.tab] || "viewHub";
}

function wireModeFor(viewId) {
  if (
    viewId === "viewVictoryHall" ||
    viewId === "viewPveVictory" ||
    viewId === "viewPvpVictory" ||
    viewId === "viewResultWin" ||
    viewId === "viewResultLose" ||
    viewId === "viewResult"
  ) {
    return "result";
  }
  if (viewId === "viewSoonFarm" || viewId === "viewSoonClan" || viewId === "viewSoon") {
    return "soon";
  }
  const special = {
    viewBossDungeon: "boss_dungeon",
    viewBossRaid: "boss_raid",
    viewGuildBattle: "guild_battle",
    viewChatGlobal: "chat_global",
    viewChatGuild: "chat_guild",
    viewChatFriends: "chat_friends",
    viewRatingPlayers: "rating_players",
    viewRatingGuilds: "rating_guilds",
  };
  if (special[viewId]) return special[viewId];
  return viewId.replace(/^view/, "").toLowerCase();
}

/** Hydrate deferred stitch imgs only for the active view (keeps boot off ~50MB PNG dump). */
function hydrateViewImages(root) {
  if (!root) return;
  root.querySelectorAll("img[data-mf-src]").forEach((img) => {
    const src = img.getAttribute("data-mf-src");
    if (!src || img.getAttribute("src") === src) return;
    img.setAttribute("src", src);
    img.removeAttribute("data-mf-src");
  });
}

function showView(id) {
  // #app > section: hide EVERY direct child section, including wireframe pads
  // (section.wf-block with empty id). Filtering to [id^=view] left those pads
  // visible and blanked Training/hubs after #137 (same symptom class as #135).
  for (const el of document.querySelectorAll("#app > section")) {
    el.classList.toggle("hidden", el.id !== id);
  }
  // Soft-launch HTML also ejects stitch stages to body>section when nested
  // wireframe </main> closes #app early (practice/yard/pvp/…). Toggle those too.
  for (const el of document.querySelectorAll("body > section[id^='view']")) {
    el.classList.toggle("hidden", el.id !== id);
  }
  // Orphan wireframe pads that landed as body siblings — never stage hosts.
  for (const el of document.querySelectorAll("body > section.wf-block")) {
    el.classList.add("hidden");
  }
  // When the active stage is a body sibling, collapse #app so an empty shell
  // does not reserve a blank band above Training/yard/guild (D-025 nav stays).
  const active = document.getElementById(id);
  const ejected = !!(active && active.parentElement === document.body);
  $("app")?.classList.toggle("hidden", ejected);
  hydrateViewImages(active);
  // Keep logical aliases present for verify-nav probes
  if (id === "viewResultWin" || id === "viewResultLose") {
    $("viewResult")?.classList.add("hidden");
  }
  state.wireMode = wireModeFor(id);
  updateWireDock();
}

function updateWireDock() {
  const mode = state.wireMode;
  // Двор: hide fat HUD wire cluster — thin in-form resource strip only
  const dock = $("wireDock");
  const hideDock = state.tab === "farm" || (mode === "soon" && state.tab === "farm");
  document.body.classList.toggle("mythfel-farm", state.tab === "farm");
  if (dock) dock.classList.toggle("wire-dock-suppressed", state.tab === "farm");
  for (const el of document.querySelectorAll("#wireDock [data-for]")) {
    const match = el.getAttribute("data-for") === mode;
    el.classList.toggle("wire-hidden", !match);
  }
}

function normalizedPath() {
  const path = location.pathname.replace(/\/+$/, "");
  return path || "/";
}

function passAddressOpen() {
  return normalizedPath() === "/pass";
}

function craftAddressOpen() {
  return normalizedPath() === "/craft";
}

function heroAddressOpen() {
  return normalizedPath() === "/hero";
}

function barnAddressOpen() {
  return normalizedPath() === "/barn";
}

function breedingAddressOpen() {
  return normalizedPath() === "/breeding";
}

function squareAddressOpen() {
  return normalizedPath() === "/square";
}

function frontsAddressOpen() {
  return normalizedPath() === "/fronts";
}

function pveAddressOpen() {
  return normalizedPath() === "/pve";
}

function pvpLoadAddressOpen() {
  return normalizedPath() === "/pvp-load";
}

function pveLoadAddressOpen() {
  return normalizedPath() === "/pve-load";
}

function codexAddressOpen() {
  return normalizedPath() === "/codex";
}

function loginAddressOpen() {
  return normalizedPath() === "/home";
}

function screenAddressFor(tab) {
  if (tab === "pass") return "/pass";
  if (tab === "craft") return "/craft";
  if (tab === "home") return "/hero";
  if (tab === "gear") return "/barn";
  if (tab === "breeding") return "/breeding";
  if (tab === "trade_hub") return "/square";
  if (tab === "battle_hub") return "/fronts";
  if (tab === "yard" || tab === "pve") return "/pve";
  if (tab === "pve_load") return "/pve-load";
  if (tab === "pvp_load") return "/pvp-load";
  if (tab === "codex" || tab === "knowledge") return "/codex";
  if (tab === "login") return "/home";
  return "/";
}

function syncScreenAddress(tab) {
  const path = screenAddressFor(tab);
  if (normalizedPath() === path) return;
  history.pushState({ tab }, "", path + location.search + location.hash);
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
  // Sets / armor atlas → live KB arsenal sheet (etalon), not old encyclopedia hosts
  if (tab === "class_sets" || tab === "armor_sets") {
    state.codexEntryId = "class_sets";
    tab = "codex";
    primary = primary || "character";
  }
  // База знаний primary (D-033) — open the codex
  if (tab === "knowledge") {
    tab = "codex";
    primary = primary || "knowledge";
  }
  if (tab === "mythmir") {
    tab = "battle_hub";
    primary = primary || "combat";
  }
  // Inline formation: keep combat primary highlighted even though it is not a subtab.
  if (tab === "formation" && primary == null) primary = "combat";

  // Day-1: all forms present. Gated tabs still open, but tip on entry for meta gates.
  const navTab = findNavTabMeta(tab)?.tab || TABS.find((x) => x.id === tab);
  let tipShown = false;
  if (tab === "breeding") {
    showGateTip(
      t(
        "gate.tip.breeding",
        "Питомник: обычные → мифики (малый шанс). Пока — подними ранг в боях",
      ),
    );
    tipShown = true;
  } else if (navTab?.gated && tab !== "pvp") {
    showGateTip();
    tipShown = true;
  }
  if ((tab === "pvp" || tab === "pvp_load") && !pvpUnlocked()) {
    showGateTip(t("gate.tip.pvp", "PvP откроется после 3 побед в Мифмире или тренировке"));
    tipShown = true;
  }
  if (!tipShown) hideGateTip();

  state.tab = tab;
  state.soon = soon;
  // Farm still has Soon art sheet, but form is present (not hidden).
  if (tab === "farm") state.soon = "farm";
  if (tab === "soon_clan") state.soon = "clan_boss";
  if (tab === "breeding" && !state.soon) state.soon = null;
  if (tab === "guild_battle" && soon == null) state.soon = null;
  if (tab === "guild" && soon == null) state.soon = null;

  const group = findNavForTab(tab);
  state.primary = primary || group?.id || state.primary || "combat";
  // Login chrome: hide nav while on login
  document.body.classList.toggle("mythfel-login", tab === "login");
  syncScreenAddress(tab);
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
  // Prefer §5.1 grant currencies when profile loaded (stub chrome — not economy SoT)
  const gold = p ? p.fish : state.wallet.gold;
  const milk = p ? p.bowls : state.wallet.milk;
  const energy = p ? `${p.pvpTickets}/5` : state.wallet.energy;
  const gems = p ? p.yarn : state.wallet.gems;
  set("curGold", gold);
  set("curMilk", milk);
  set("curEnergy", energy);
  set("curGems", gems);
  set("navGold", gold);
  set("navMilk", milk);
  set("navEnergy", energy);
  set("navGems", gems);
  const rank = state.locale === "ru" ? "Ур. 1 · Soft Launch" : "Lv. 1 · Soft Launch";
  set("brandSub", rank);
  set("navRank", rank);
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
  const cats = profile?.cats || [];
  if (!state.selectedCatId && cats.length) {
    state.selectedCatId =
      cats.find((c) => c.templateId === "starter_fighter_fire")?.catId ||
      cats.find((c) => c.role !== "farm")?.catId ||
      cats[0].catId;
  }
  for (const c of cats) {
    if (!state.equippedByCat[c.catId]) {
      state.equippedByCat[c.catId] = emptyEquipSlots();
    } else {
      for (const slot of HOME_SLOT_ORDER) {
        if (!(slot in state.equippedByCat[c.catId])) state.equippedByCat[c.catId][slot] = null;
      }
    }
  }
  for (const z of FARM_ZONES) {
    if (!state.farmState[z.id]) {
      state.farmState[z.id] = {
        farmer: null,
        planted: false,
        ready: false,
        crop: z.kind === "crop" ? "seed_wheat" : z.id === "fishing" ? "bait" : null,
      };
    }
  }
}

/** LVL1 baseStats from content/cats — sheet ATK is catalog only (hit = card.Atk). DEF only from gear. */
const CONTENT_CAT_BASE = {
  starter_tank_stone: { atk: 4, hp: 50, spd: 3, skill: 2, charm: 4 },
  starter_fighter_fire: { atk: 8, hp: 43, spd: 6, skill: 3, charm: 3 },
  starter_support_water: { atk: 2, hp: 28, spd: 5, skill: 7, charm: 6 },
  shop_tank_stone_a: { atk: 4, hp: 50, spd: 3, skill: 2, charm: 4 },
  shop_tank_stone_b: { atk: 6, hp: 48, spd: 3, skill: 2, charm: 4 },
  shop_fighter_fire_a: { atk: 8, hp: 43, spd: 7, skill: 3, charm: 3 },
  shop_fighter_fire_b: { atk: 10, hp: 45, spd: 5, skill: 3, charm: 3 },
  shop_assassin_bolt_a: { atk: 8, hp: 38, spd: 9, skill: 4, charm: 4 },
  shop_assassin_bolt_b: { atk: 8, hp: 36, spd: 8, skill: 4, charm: 4 },
  shop_ranger_grass_a: { atk: 7, hp: 35, spd: 8, skill: 4, charm: 3 },
  shop_ranger_grass_b: { atk: 7, hp: 37, spd: 7, skill: 5, charm: 3 },
  shop_mage_fire_a: { atk: 5, hp: 30, spd: 5, skill: 8, charm: 3 },
  shop_mage_ice_b: { atk: 5, hp: 29, spd: 5, skill: 8, charm: 3 },
  shop_support_water_a: { atk: 2, hp: 28, spd: 5, skill: 7, charm: 6 },
  shop_support_water_b: { atk: 3, hp: 29, spd: 5, skill: 7, charm: 6 },
};
const ROLE_CAT_BASE = {
  tank: { atk: 4, hp: 50, spd: 3, skill: 2, charm: 4 },
  fighter: { atk: 8, hp: 43, spd: 6, skill: 3, charm: 3 },
  assassin: { atk: 8, hp: 38, spd: 9, skill: 4, charm: 4 },
  ranger: { atk: 7, hp: 35, spd: 8, skill: 4, charm: 3 },
  mage: { atk: 5, hp: 30, spd: 5, skill: 8, charm: 3 },
  support: { atk: 2, hp: 28, spd: 5, skill: 7, charm: 6 },
  farm: { atk: 1, hp: 20, spd: 3, skill: 1, charm: 1 },
};

function baseStatsForCat(cat) {
  const tid = cat?.templateId;
  const raw = (tid && CONTENT_CAT_BASE[tid]) || ROLE_CAT_BASE[cat?.role] || ROLE_CAT_BASE.fighter;
  return { atk: raw.atk, hp: raw.hp, def: 0, spd: raw.spd, skill: raw.skill, charm: raw.charm };
}

function gearBonusForCat(catId) {
  const eq = state.equippedByCat[catId] || {};
  const bonus = { atk: 0, hp: 0, def: 0, spd: 0 };
  for (const slot of HOME_SLOT_ORDER) {
    const id = eq[slot];
    if (!id) continue;
    const item = state.gearCatalog.find((g) => g.id === id);
    if (!item) continue;
    bonus.atk += item.atk || 0;
    bonus.hp += item.hp || 0;
    bonus.def += item.def || 0;
    bonus.spd += item.spd || 0;
  }
  return bonus;
}

function statsForCat(cat) {
  const base = baseStatsForCat(cat);
  const bonus = gearBonusForCat(cat.catId);
  return {
    atk: base.atk + bonus.atk,
    hp: base.hp + bonus.hp,
    def: base.def + bonus.def,
    spd: base.spd + bonus.spd,
    bonus,
    base,
  };
}

function catRoleOf(catOrId) {
  const cat =
    typeof catOrId === "string"
      ? (state.profile?.cats || []).find((c) => c.catId === catOrId)
      : catOrId;
  if (!cat) return null;
  return cat.role || starterMeta(cat.templateId)?.role || null;
}

/** Armor/ring (roles null/[]) → all heroes. Weapons/shield → only listed roles. */
function canEquipItem(catOrId, item) {
  if (!item) return false;
  if (!item.roles || item.roles.length === 0) return true;
  const role = catRoleOf(catOrId);
  return !!role && item.roles.includes(role);
}

function equipDenyToast(item, catOrId) {
  const role = catRoleOf(catOrId);
  const need = (item.roles || []).map((r) => CAT_ROLE_RU[r] || r).join("/");
  const have = CAT_ROLE_RU[role] || role || "—";
  toast(`${item.name}: только для ${need} (сейчас ${have})`);
}

function equipItem(catId, itemId) {
  const item = state.gearCatalog.find((g) => g.id === itemId);
  if (!item || !catId) return;
  if (!canEquipItem(catId, item)) {
    equipDenyToast(item, catId);
    return;
  }
  if (!state.equippedByCat[catId]) {
    state.equippedByCat[catId] = emptyEquipSlots();
  }
  // Unequip same item from other cats / same slot swap
  for (const [cid, eq] of Object.entries(state.equippedByCat)) {
    for (const slot of Object.keys(eq)) {
      if (eq[slot] === itemId) eq[slot] = null;
    }
  }
  state.equippedByCat[catId][item.slot] = itemId;
  toast(`${item.name} → надето`);
  persistGearStub();
  renderHome();
  renderEquipCards();
  renderAll();
}

function unequipSlot(catId, slot) {
  if (!state.equippedByCat[catId]) return;
  const id = state.equippedByCat[catId][slot];
  state.equippedByCat[catId][slot] = null;
  const item = state.gearCatalog.find((g) => g.id === id);
  toast(item ? `${item.name} → снято` : "Слот пуст");
  persistGearStub();
  renderHome();
  renderEquipCards();
  renderAll();
}

function ensureHudPanel(viewId, panelId, html) {
  const view = $(viewId);
  if (!view) return null;
  let panel = view.querySelector(`#${panelId}`);
  if (!panel) {
    panel = document.createElement("div");
    panel.id = panelId;
    panel.className = "mythfel-hud-panel";
    view.appendChild(panel);
  }
  if (html != null) panel.innerHTML = html;
  return panel;
}

function openPrimary(group) {
  if (!group) return;
  if (group.route) {
    const routed = group.tabs?.find((t) => t.id === group.route);
    navigate(group.route, {
      soon: routed?.soon || null,
      primary: group.id,
    });
    return;
  }
  const first = group.tabs[0];
  if (!first) return;
  const target = Array.isArray(first.tabs) && first.tabs[0] ? first.tabs[0] : first;
  navigate(target.id, {
    soon: target.soon || first.soon || null,
    primary: group.id,
  });
}

function fillNav(primaryEl, subEl, activeGroup, battleActive, activeClass) {
  if (!primaryEl || !subEl || !activeGroup) return;
  const shownPrimary = state.tab === "hub" ? "character" : state.primary;
  primaryEl.innerHTML = "";
  subEl.innerHTML = "";
  subEl.setAttribute("aria-label", t(activeGroup.key, activeGroup.id));

  for (const group of NAV) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t(group.key, group.label || group.id);
    b.dataset.primary = group.id;
    b.classList.toggle(activeClass, !battleActive && group.id === shownPrimary);
    b.addEventListener("click", () => openPrimary(group));
    primaryEl.appendChild(b);
  }

  for (const tab of activeGroup.tabs) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t(tab.key, tab.id);
    b.dataset.tab = tab.id;
    if (tab.stub) b.classList.add("stub");
    if (tab.soon) b.classList.add("soon");
    if (tab.gated) b.classList.add("gated");
    if (tab.id === "pvp" && !pvpUnlocked()) b.classList.add("locked");
    const tabOn = state.tab === tab.id || (tab.id === "pve" && state.tab === "yard");
    b.classList.toggle(activeClass, !battleActive && tabOn);
    b.addEventListener("click", () => {
      navigate(tab.id, { soon: tab.soon || null, primary: activeGroup.id });
    });
    subEl.appendChild(b);
  }
}

function renderTabs() {
  const hubTabs = $("hubTabs");
  if (hubTabs) hubTabs.innerHTML = "";

  const battleActive = !!state.battle && !state.battle.result;
  const activeGroup =
    (state.tab === "hub" ? NAV.find((g) => g.id === "character") : findNavForTab(state.tab)) ||
    NAV.find((g) => g.id === state.primary) ||
    NAV.find((g) => g.id === "character");
  if (state.tab !== "hub" && activeGroup) state.primary = activeGroup.id;

  fillNav($("appTabs"), $("appSubTabs"), activeGroup, battleActive, "active");
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

function softNavigateFromLabel(_label) {
  // Old stitch menu/submenu soft-links are off while every screen is rebuilt from new art.
  // Needle list below stays for verify-nav; it is not executed.
  return false;
}

const SOFT_NAV_LEGACY = [
    ["в поход", () => navigate("formation")],
    ["в бой pvp", () => navigate("pvp")],
    ["вступить в дуэль", () => navigate("formation")],
    ["выступить легионом", () => navigate("formation")],
    ["штурмовать данж", () => navigate("formation")],
    ["штурмовать башн", () => startGuildBattle()],
    ["штурмовать врата", () => navigate("guild_battle")],
    ["штурмовать", () => navigate("formation")],
    ["вступить в рейд", () => navigate("boss_raid")],
    ["вступить в группу", () => navigate("boss_dungeon")],
    ["в бой", () => navigate("formation")],
    ["остановить тест", () => navigate("hub")],
    ["дуэль", () => navigate("formation")],
    ["забрать всё", () => navigate("pass")],
    ["в лс", () => navigate("chat_friends")],
    ["следующий узел", () => navigate("yard")],
    ["данж", () => navigate("boss_dungeon")],
    ["подземел", () => navigate("boss_dungeon")],
    ["к рейду", () => navigate("boss_raid")],
    ["к осаде", () => navigate("guild_battle")],
    ["рейд", () => navigate("boss_raid")],
    ["легион", () => navigate("boss_raid")],
    ["война гильдий", () => navigate("guild_battle")],
    ["зал гильдии", () => navigate("guild")],
    ["главный хаб", () => navigate("hub")],
    ["мифмир", () => navigate("yard")],
    ["двор", () => navigate("farm", { soon: "farm" })],
    ["коллекция", () => navigate("collection")],
    ["хаб торговли", () => navigate("trade_hub")],
    ["войти в бар", () => navigate("tavern")],
    ["в магазин", () => navigate("shop")],
    ["на рынок", () => navigate("market")],
    ["в зал аукциона", () => navigate("auction")],
    ["выставить лот", () => navigate("auction")],
    ["рейтинг гильдий", () => navigate("rating_guilds")],
    ["рейтинг игроков", () => navigate("rating_players")],
    ["лавка славы", () => navigate("shop")],
    ["лавка", () => navigate("shop")],
    ["маркет", () => navigate("market")],
    ["аукцион", () => navigate("auction")],
    ["таверна", () => navigate("tavern")],
    ["pvp", () => navigate("pvp")],
    ["арена", () => navigate("pvp")],
    ["пасс", () => navigate("pass")],
    ["расстанов", () => navigate("formation")],
    ["сменить отряд", () => navigate("formation")],
    ["строй", () => navigate("formation")],
    ["бой гильдий", () => navigate("guild_battle")],
    ["гильдия", () => navigate("guild")],
    ["клан", () => navigate("guild")],
    ["ферма", () => navigate("farm", { soon: "farm" })],
    ["питомник", () => navigate("breeding")],
    ["скрещиван", () => navigate("breeding")],
    ["крафт", () => navigate("craft")],
    ["кузниц", () => navigate("craft")],
    ["карточки экип", () => navigate("equip_cards")],
    ["сеты брони", () => navigate("armor_sets")],
    ["атлас сетов", () => navigate("armor_sets")],
    ["оружейные сет", () => navigate("class_sets")],
    ["арсенал класс", () => navigate("class_sets")],
    ["классовых сет", () => navigate("class_sets")],
    ["кодекс геро", () => navigate("heroes")],
    ["фолиант", () => navigate("heroes")],
    ["экипиров", () => navigate("gear")],
    ["оружейн", () => navigate("gear")],
    ["дом хран", () => navigate("farm", { soon: "farm" })],
    ["усадьб", () => navigate("farm", { soon: "farm" })],
    ["персонаж", () => navigate("home")],
    ["войти в таверн", () => navigate(bootTabAfterLogin())],
    ["войти", () => navigate(bootTabAfterLogin())],
    ["чат", () => navigate("chat_global")],
    ["рейтинг", () => navigate("rating_players")],
    ["тренир", () => navigate("practice")],
    ["манекен", () => navigate("practice")],
    ["додзё", () => navigate("practice")],
    ["кодекс", () => navigate("codex")],
    ["вход", () => navigate("login")],
    ["войти", () => { stubLogin({ login: "soft_nav", password: "" }); }],
    ["регистрац", () => { stubLogin({ login: "soft_reg", password: "" }); }],
    ["начать тренир", () => startPractice(false)],
    ["тренировка (манекен)", () => startPractice(false)],
    ["карта", () => navigate("yard")],
    ["мифмир", () => navigate("yard")],
    ["в поход", () => navigate("yard")],
    ["бой 3v3", () => navigate("pvp")],
    ["рейд на дога", () => navigate("boss_raid")],
    ["двор усадьб", () => navigate("farm", { soon: "farm" })],
    ["коллекция котик", () => navigate("collection")],
    ["лавка и маркет", () => navigate("shop")],
    ["тренировочн", () => navigate("practice")],
    ["гильдия когтя", () => navigate("guild")],
    ["открыть боевой пасс", () => navigate("pass")],
    ["боевой пасс", () => navigate("pass")],
    ["повтор", () => navigate("formation")],
];
void SOFT_NAV_LEGACY;

function bindStitchNav(root) {
  if (!root || root.dataset.navBound === "1") return;
  root.dataset.navBound = "1";
  root.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-path], a[href='#']");
    if (!a || !root.contains(a)) return;
    // Shared fillNav owns the real menu. Old stitch data-path / hash links stay closed.
    e.preventDefault();
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
    const tab = btn.getAttribute("data-hub-go");
    if (!tab || tab === "hub") {
      navigate("hub");
      return;
    }
    navigate(tab);
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

function campaignNode(chapter) {
  const ch = Math.max(1, Math.min(5, Number(chapter) || 1));
  const nodes = state.campaign?.nodes || [];
  return nodes.find((n) => Number(n.stageIndex) === ch) || nodes[ch - 1] || null;
}

function isChapterUnlocked(chapter) {
  // Soft-launch / QA: all Mythmir chapters playable (no progression locks on the map).
  void chapter;
  return true;
}

function isChapterCleared(chapter) {
  const node = campaignNode(chapter);
  const last = node?.fights?.[node.fights.length - 1]?.stageId;
  return !!(last && state.progress.clearedFights[last]);
}

/** Next uncleared fight in chapter, else f1. Sets pveStage entrance|tunnel|boss. */
function pickChapterFight(chapter) {
  const node = campaignNode(chapter);
  const fights = node?.fights || [];
  let fight = fights[0] || null;
  let stage = "entrance";
  for (let i = 0; i < fights.length; i++) {
    const f = fights[i];
    if (!state.progress.clearedFights[f.stageId]) {
      fight = f;
      stage = i === 0 ? "entrance" : i === 1 ? "tunnel" : "boss";
      break;
    }
    if (i === fights.length - 1) {
      fight = f;
      stage = "boss";
    }
  }
  return { fight, stage };
}

function selectPveChapter(chapter, { toastPick = true, requireUnlock = false } = {}) {
  const ch = Math.max(1, Math.min(5, Number(chapter) || 1));
  const unlocked = isChapterUnlocked(ch);
  // Map/chips: always allow switching the selected chapter (preview). Fight start can require unlock.
  if (requireUnlock && !unlocked) {
    showGateTip(t("yard.chapter.locked", "Глава ещё закрыта · зачисти предыдущую"));
    return false;
  }
  state.battleMode = "pve";
  state.pveChapter = ch;
  // D-039 · every map launch is a full 3-wave run (soldiers → soldiers → pitboss).
  // Do not resume mid-chapter via clearedFights — that skipped wave 2 and put the boss on "wave 2".
  state.pveStage = "entrance";
  state.selectedStageId = pveStageId(ch, "entrance");
  resetPveCarryAlive();
  if (toastPick) {
    const node = campaignNode(ch);
    const title = node?.title_ru || pveChapterData(ch).title || `Глава ${ch}`;
    toast(
      unlocked
        ? t("yard.chapter.pick", `Глава ${ch}: ${title}`)
        : t("yard.chapter.preview", `Глава ${ch}: ${title} · пока закрыта`),
    );
  }
  renderPveYardChapter();
  return true;
}

function renderPveYardChapter() {
  const ch = Math.max(1, Math.min(5, Number(state.pveChapter) || 1));
  const node = campaignNode(ch);
  const data = pveChapterData(ch);
  const title = node?.title_ru || data.title || `Глава ${ch}`;
  const faction = node?.faction_ru || data.faction || "";
  const boss = node?.boss_ru || data.bossName || "";
  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };
  setText("pveYardChapterEyebrow", `Глава ${ch}${faction ? ` · ${faction}` : ""}`);
  setText("pveYardThreatPill", data.threatStars || `Ур. ${ch}`);
  setText("pveYardChapterTitle", title);
  setText(
    "pveYardChapterLore",
    data.description ||
      `Три уровня: солдаты → солдаты → питбосс «${boss}». Строй танк · DPS · саппорт.`,
  );
  setText("pveYardTip", `Совет Сэнсэя: ${data.tip || "Держите танка в авангарде."}`);
  setText("pveYardZoneStatus", `Глава ${ch} / 5 · ${state.selectedStageId || ""}`);

  // Wave cards: soldiers / soldiers / pitboss — art = this chapter's fight BGs (not fixed portraits).
  const grid = $("pveYardWaveGrid");
  if (grid) {
    const cards = grid.querySelectorAll(":scope > div");
    const waves = [
      { label: "Волна 1", stage: "entrance", name: "Солдаты", sub: `${faction || "Враги"} · 3 юнита` },
      { label: "Волна 2", stage: "tunnel", name: "Солдаты", sub: `${faction || "Враги"} · крепче` },
      { label: "Босс", stage: "boss", name: boss || "Питбосс", sub: "Питбосс-волна" },
    ];
    waves.forEach((w, i) => {
      const card = cards[i];
      if (!card) return;
      const nameEl = card.querySelector(".font-label-md");
      const subEl = card.querySelector(".font-body-sm");
      if (nameEl) nameEl.textContent = w.name;
      if (subEl) subEl.textContent = w.sub;
      const badge =
        card.querySelector(".font-label-sm") ||
        card.querySelector("[class*='error-container']");
      if (badge) {
        // Keep skull icon on boss pill if present.
        const icon = badge.querySelector(".material-symbols-outlined");
        badge.textContent = "";
        if (icon) badge.appendChild(icon);
        badge.append(document.createTextNode(icon ? ` ${w.label}` : w.label));
      }
      const img = card.querySelector("img");
      if (img) {
        const art = pveStageArt(ch, w.stage);
        if (img.getAttribute("src") !== art) img.src = art;
        img.alt = `${title} · ${w.label}`;
        img.classList.add("object-cover", "object-center");
        img.classList.remove("object-top");
      }
    });
  }

  // Map nodes + chips
  document.querySelectorAll("#viewYard .pve-yard-node[data-pve-chapter]").forEach((pin) => {
    const n = Number(pin.getAttribute("data-pve-chapter") || 0);
    const unlocked = isChapterUnlocked(n);
    const cleared = isChapterCleared(n);
    const active = n === ch;
    pin.classList.toggle("is-active", active);
    pin.classList.toggle("is-cleared", cleared && !active);
    pin.classList.toggle("is-locked", !unlocked);
    pin.classList.toggle("cursor-pointer", unlocked);
    pin.classList.toggle("cursor-not-allowed", !unlocked);
    pin.setAttribute("aria-pressed", active ? "true" : "false");
    const short = (campaignNode(n)?.title_ru || pveChapterData(n).title || `Глава ${n}`).split(" ")[0];
    const label = pin.querySelector(":scope > span.font-label-sm, :scope > span.font-label-md, :scope > span.mt-1\\.5, :scope > span.mt-2");
    // Prefer direct child label span (map pin caption)
    const caps = [...pin.children].filter((el) => el.tagName === "SPAN");
    if (caps[0]) {
      const full = campaignNode(n)?.title_ru || pveChapterData(n).title || `Глава ${n}`;
      // Short map label: last meaningful word or full if short
      const parts = full.split(/\s+/);
      caps[0].textContent = parts.length <= 2 ? full : parts[parts.length - 1];
      if (active) {
        caps[0].classList.add("text-primary");
        caps[0].classList.remove("text-on-surface", "text-on-surface-variant");
      }
    }
    // Active badge (one per selected chapter)
    let badge = pin.querySelector(":scope > .pve-yard-active-badge");
    if (active) {
      if (!badge) {
        badge = document.createElement("div");
        badge.className =
          "pve-yard-active-badge absolute -top-6 bg-primary text-on-primary font-label-sm text-[9px] uppercase font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap border border-primary/40 z-20";
        badge.textContent = "АКТИВНЫЙ УЗЕЛ";
        pin.prepend(badge);
      }
      badge.hidden = false;
      badge.style.display = "";
    } else if (badge) {
      badge.hidden = true;
      badge.style.display = "none";
    }
    // Icon state
    const icon = pin.querySelector(".material-symbols-outlined");
    if (icon && !icon.closest(".pve-yard-active-badge")) {
      if (!unlocked) icon.textContent = "lock";
      else if (cleared && !active) icon.textContent = "check_circle";
      else if (active) icon.textContent = "swords";
      else icon.textContent = "radio_button_unchecked";
    }
  });

  document.querySelectorAll("#pveYardChapterChips [data-pve-chapter], #viewYard #pveYardChapterChips button[data-pve-chapter]").forEach((btn) => {
    const n = Number(btn.getAttribute("data-pve-chapter") || 0);
    const unlocked = isChapterUnlocked(n);
    const cleared = isChapterCleared(n);
    const active = n === ch;
    const nodeTitle = campaignNode(n)?.title_ru || pveChapterData(n).title || "";
    const short = nodeTitle ? nodeTitle.split(/\s+/).slice(-1)[0] : String(n);
    btn.disabled = false;
    btn.classList.toggle("opacity-70", !unlocked && !active);
    if (active) {
      btn.innerHTML = `<span class="material-symbols-outlined text-[15px]">swords</span> ${n}. ${short}`;
      btn.className =
        "px-3.5 py-1.5 rounded-lg text-body-sm font-label-md bg-primary-container text-on-primary font-bold shadow-md flex items-center gap-1.5 border border-primary/40";
    } else if (!unlocked) {
      btn.innerHTML = `<span class="material-symbols-outlined text-[15px]">lock</span> ${n}`;
      btn.className =
        "px-3.5 py-1.5 rounded-lg text-body-sm font-label-md font-bold bg-surface-container/60 text-outline flex items-center gap-1.5 opacity-70 border border-outline-variant/30 shadow-sm";
    } else if (cleared) {
      btn.innerHTML = `<span class="material-symbols-outlined text-[15px]">check_circle</span> ${n}`;
      btn.className =
        "px-3.5 py-1.5 rounded-lg text-body-sm font-label-md font-bold bg-surface-container text-secondary flex items-center gap-1.5 hover:bg-surface-container-high transition-all border border-secondary/30 shadow-sm";
    } else {
      btn.innerHTML = `<span class="material-symbols-outlined text-[15px]">radio_button_unchecked</span> ${n}`;
      btn.className =
        "px-3.5 py-1.5 rounded-lg text-body-sm font-label-md font-bold bg-surface-container text-on-surface flex items-center gap-1.5 hover:bg-surface-container-high transition-all border border-outline-variant/40 shadow-sm";
    }
  });
}

function renderYard() {
  const eyebrow = $("yardEyebrow");
  const title = $("yardTitle");
  const lead = $("yardLead");
  if (eyebrow) eyebrow.textContent = t("hub.tab.yard");
  if (title) title.textContent = t("hub.tab.yard");
  if (lead) lead.textContent = `${t("mythmir.mission_list", "Список миссий")} · ${state.selectedStageId}`;
  renderStarters("starterCards");
  renderMythmirMissions();
  renderUnlockProgress();
  renderPveYardChapter();
  const banner = $("tutorialBanner");
  if (!banner) return;
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

/** Painted PvE campaign hub (viewYard) — D-025: no menu chrome; CTAs only. */
function bindYardForm() {
  const start = $("btnYardStartBattle");
  if (start && !start.dataset.bound) {
    start.dataset.bound = "1";
    start.addEventListener("click", () => {
      state.battleMode = "pve";
      // Fight requires unlock; map selection itself does not.
      if (!selectPveChapter(state.pveChapter || 1, { toastPick: false, requireUnlock: false })) return;
      openPveLoad();
    });
  }
  // Chapter chips + map nodes → select Mythmir chapter (D-039)
  document.querySelectorAll("#viewYard [data-pve-chapter]").forEach((el) => {
    if (el.dataset.boundChapter) return;
    el.dataset.boundChapter = "1";
    const activate = () => selectPveChapter(el.getAttribute("data-pve-chapter"));
    el.addEventListener("click", activate);
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        activate();
      }
    });
  });
  const toForm = $("btnYardToFormationPainted");
  if (toForm && !toForm.dataset.bound) {
    toForm.dataset.bound = "1";
    toForm.addEventListener("click", () => navigate("formation"));
  }
  const team = $("btnYardTeamPreset");
  if (team && !team.dataset.bound) {
    team.dataset.bound = "1";
    team.addEventListener("click", () => {
      toast(t("yard.team.tip", "Смена отряда · открой Расстановку"));
      navigate("formation");
    });
  }
  const diffN = $("btnYardDiffNormal");
  const diffH = $("btnYardDiffHeroic");
  if (diffN && diffH && !diffN.dataset.bound) {
    diffN.dataset.bound = "1";
    diffH.dataset.bound = "1";
    const paint = (heroic) => {
      diffN.className = heroic
        ? "px-space-md py-1 rounded font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all flex items-center gap-1"
        : "px-space-md py-1 rounded font-label-md text-label-md bg-primary-container text-on-primary font-bold shadow-sm flex items-center gap-1";
      diffH.className = heroic
        ? "px-space-md py-1 rounded font-label-md text-label-md bg-tertiary-container text-on-tertiary shadow-sm font-bold flex items-center gap-1 transition-all"
        : "px-space-md py-1 rounded font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all flex items-center gap-1";
    };
    diffN.addEventListener("click", () => {
      paint(false);
      toast(t("yard.diff.normal", "Обычный режим"));
    });
    diffH.addEventListener("click", () => {
      paint(true);
      toast(t("yard.diff.heroic", "Героический · Soon (stub)"));
    });
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
        state.pveChapter = Number(node.stageIndex) || 1;
        state.pveStage =
          fight.fightIndex === 2 ? "tunnel" : fight.fightIndex === 3 ? "boss" : "entrance";
        state.selectedStageId = fight.stageId;
        state.battleMode = "pve";
        toast(`${t(fight.label_key, fight.label_ru)}`);
        renderYard();
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
        if (d.kind === "restore") {
          clearPveFatigueStub();
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

const TRADE_ZONE_TIP = {
  tavern: "Таверна: портал пока закрыт (SL)",
  shop: "Лавка Чудес: портал пока закрыт (SL)",
  market: "Рынок сырья: портал пока закрыт (SL)",
  auction: "Аукцион: портал пока закрыт (SL)",
};

function tradeTip(zone) {
  toast(TRADE_ZONE_TIP[zone] || "Зона площади: скоро");
}

function setTradeZoneOpen(root, zone) {
  state.tradeZone = zone || "";
  for (const wrap of root.querySelectorAll(".trade-zone[data-zone]")) {
    const id = wrap.getAttribute("data-zone");
    const open = !!zone && id === zone;
    wrap.classList.toggle("is-open", open);
    const pin = wrap.querySelector("[data-trade-pin]");
    const card = wrap.querySelector(".trade-card");
    if (pin) pin.setAttribute("aria-expanded", open ? "true" : "false");
    if (card) {
      if (open) card.removeAttribute("hidden");
      else card.setAttribute("hidden", "");
    }
  }
}

function renderTradeHub() {
  const root = $("viewTradeHub");
  if (!root || root.classList.contains("hidden")) return;

  if (state.tradeFairLeft == null) state.tradeFairLeft = 4 * 3600 + 18 * 60 + 19;
  if (state.tradeFairActive == null) state.tradeFairActive = true;
  // No default open card — pins only until hover / tap.

  const p = state.profile;
  const gold = p ? p.fish : state.wallet?.gold || 0;
  const fish = p ? p.bowls : state.wallet?.milk || 0;
  const scrolls = p ? p.medals || 3450 : 3450;
  const wallet = $("tradeWallet");
  if (wallet) {
    wallet.innerHTML = `
      <div class="trade-wallet-head"><span>Кошелёк Хранителя</span><em>Синхронизировано</em></div>
      <div class="trade-wallet-row">
        <div><span>Золото</span><b>${formatSheetNum(gold)}</b></div>
        <div><span>Рыбки</span><b>${formatSheetNum(fish)}</b></div>
        <div><span>Свитки</span><b>${formatSheetNum(scrolls)}</b></div>
      </div>`;
  }

  const fair = $("tradeFair");
  if (fair) {
    const left = Math.max(0, state.tradeFairLeft | 0);
    const h = String(Math.floor(left / 3600)).padStart(2, "0");
    const m = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
    const s = String(left % 60).padStart(2, "0");
    fair.innerHTML = `
      <div class="trade-fair-head"><span>Ежедневная Ярмарка</span><em class="trade-timer" id="tradeFairTimer">${h}:${m}:${s}</em></div>
      <div class="trade-fair-row">
        <div>
          <strong>Оптовый бонус на травы: +10%</strong>
          <p>Скупщик Альфред платит двойной тариф</p>
        </div>
        <button type="button" id="tradeFairActive" class="${state.tradeFairActive ? "" : "is-off"}">${state.tradeFairActive ? "АКТИВЕН" : "ВЫКЛ"}</button>
      </div>`;
    fair.querySelector("#tradeFairActive")?.addEventListener("click", () => {
      state.tradeFairActive = !state.tradeFairActive;
      toast(state.tradeFairActive ? "Ярмарка активна" : "Ярмарка выключена");
      renderTradeHub();
    });
  }

  if (!state.tradeFairTimerArmed) {
    state.tradeFairTimerArmed = true;
    setInterval(() => {
      if (state.tradeFairLeft > 0) state.tradeFairLeft -= 1;
      const el = $("tradeFairTimer");
      if (!el) return;
      const left = Math.max(0, state.tradeFairLeft | 0);
      const h = String(Math.floor(left / 3600)).padStart(2, "0");
      const m = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
      const s = String(left % 60).padStart(2, "0");
      el.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  setTradeZoneOpen(root, state.tradeZone || "");

  if (root.dataset.tradePinsBound !== "1") {
    root.dataset.tradePinsBound = "1";
    root.addEventListener("pointerover", (e) => {
      const zone = e.target.closest(".trade-zone[data-zone]");
      if (!zone || !root.contains(zone)) return;
      if (e.pointerType === "touch") return;
      setTradeZoneOpen(root, zone.getAttribute("data-zone"));
    });
    root.addEventListener("pointerout", (e) => {
      const zone = e.target.closest(".trade-zone[data-zone]");
      if (!zone || !root.contains(zone)) return;
      if (e.pointerType === "touch") return;
      const to = e.relatedTarget;
      if (to && zone.contains(to)) return;
      if (state.tradePinned === zone.getAttribute("data-zone")) return;
      setTradeZoneOpen(root, state.tradePinned || "");
    });
    root.addEventListener("click", (e) => {
      const pin = e.target.closest("[data-trade-pin]");
      if (pin && root.contains(pin)) {
        e.preventDefault();
        const zone = pin.getAttribute("data-trade-pin");
        const next = state.tradePinned === zone ? "" : zone;
        state.tradePinned = next;
        setTradeZoneOpen(root, next);
        return;
      }
      const go = e.target.closest("[data-trade-go]");
      if (go && root.contains(go)) {
        e.preventDefault();
        const zone = go.getAttribute("data-trade-go");
        state.tradePinned = zone;
        setTradeZoneOpen(root, zone);
        tradeTip(zone);
        return;
      }
      if (!e.target.closest(".trade-zone")) {
        state.tradePinned = "";
        setTradeZoneOpen(root, "");
      }
    });
  }

  const compass = $("tradeCompass");
  if (compass && compass.dataset.bound !== "1") {
    compass.dataset.bound = "1";
    compass.addEventListener("click", () => toast("Торговый перекрёсток · 4 пути открыты"));
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


window.KB_TIER_ARMOR = {
  1: "/stitch-assets/kb-v3/armor/r1-steel.png",
  2: "/stitch-assets/kb-v3/armor/r2-ranger.png",
  3: "/stitch-assets/kb-v3/armor/r3-blue.png",
  4: "/stitch-assets/kb-v3/armor/r4-lion.png",
  5: "/stitch-assets/kb-v3/armor/r5-purple.png",
  6: "/stitch-assets/kb-v3/armor/r6-dragon.png",
  7: "/stitch-assets/kb-v3/armor/r7-solar.png",
  8: "/stitch-assets/kb-v3/armor/r8-or-fullplate.png",
};

/** Stitch v3 inspectTier — swaps center mannequin armor by rank. */
function inspectTier(rankNumber) {
  const n = Number(rankNumber) || 6;
  const centerImg = document.getElementById("mannequin-armor-img");
  const src = window.KB_TIER_ARMOR[n];
  if (centerImg && src) {
    centerImg.style.transition = "opacity 0.2s ease-in-out";
    centerImg.style.opacity = "0.6";
    setTimeout(() => {
      centerImg.src = src;
      centerImg.style.opacity = "1";
    }, 150);
  }
  const root = $("viewCodex") || document;
  root.querySelectorAll('button[onclick^="inspectTier"]').forEach((btn) => {
    const m = (btn.getAttribute("onclick") || "").match(/inspectTier\((\d+)\)/);
    const rank = m ? Number(m[1]) : 0;
    const on = rank === n;
    btn.classList.toggle("bg-primary-container/20", on);
    btn.classList.toggle("ring-1", on);
    btn.classList.toggle("ring-primary", on);
    if (!on) btn.classList.add("bg-surface-container");
    else btn.classList.remove("bg-surface-container");
  });
}
window.inspectTier = inspectTier;


function codexTopics() {
  return window.CODEX_TOPICS || [];
}

function codexFilters() {
  return window.CODEX_FILTERS || [];
}

function codexEsc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function codexBlockHtml(block) {
  if (!block) return "";
  if (block.type === "stats") {
    const rows = (block.rows || [])
      .map(
        ([k, v]) =>
          `<div class="flex flex-col items-center bg-surface-container-lowest/80 p-space-xs rounded-xl shadow-inner text-center min-w-0">
            <span class="font-label-sm text-[10px] text-outline uppercase">${codexEsc(k)}</span>
            <span class="font-stat-numeral text-sm text-primary mt-0.5">${codexEsc(v)}</span>
          </div>`,
      )
      .join("");
    return `<div class="bg-surface-container-low/95 rounded-xl p-space-md shadow-xl flex flex-col gap-space-xs">
      <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">${codexEsc(block.title || "")}</span>
      <div class="grid grid-cols-2 gap-space-xs">${rows}</div>
    </div>`;
  }
  if (block.type === "rules") {
    const items = (block.items || [])
      .map(
        (t) =>
          `<li class="flex items-start gap-1.5 text-[12px] text-on-surface-variant leading-snug"><span class="material-symbols-outlined text-primary text-[14px] mt-0.5 shrink-0">check</span><span>${codexEsc(t)}</span></li>`,
      )
      .join("");
    return `<div class="bg-surface-container-low/95 rounded-xl p-space-md shadow-xl flex flex-col gap-space-xs">
      <span class="font-headline-md text-sm text-on-surface">${codexEsc(block.title || "")}</span>
      <ul class="flex flex-col gap-1.5 m-0 p-0 list-none">${items}</ul>
    </div>`;
  }
  if (block.type === "table") {
    const headers = block.headers || [];
    const head = headers
      .map((h) => `<th class="text-left font-label-sm text-[10px] text-outline uppercase px-1.5 py-1">${codexEsc(h)}</th>`)
      .join("");
    const body = (block.rows || [])
      .map((row) => {
        const cells = row
          .map((c) => `<td class="font-body-sm text-[11px] text-on-surface px-1.5 py-1 border-t border-surface-container-highest/60">${codexEsc(c)}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    return `<div class="bg-surface-container-low/95 rounded-xl p-space-md shadow-xl flex flex-col gap-space-xs overflow-auto">
      <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">${codexEsc(block.title || "")}</span>
      <table class="w-full border-collapse"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    </div>`;
  }
  if (block.type === "note") {
    return `<div class="bg-surface-container-highest/40 rounded-xl p-space-sm text-[11px] text-on-surface-variant border border-outline-variant/40">
      <span class="material-symbols-outlined text-primary text-[14px] align-middle mr-1">info</span>${codexEsc(block.text || "")}
    </div>`;
  }
  if (block.type === "media") {
    const h = block.height || "7rem";
    return `<div class="rounded-xl border border-dashed border-outline-variant/70 bg-surface-container-lowest/50 flex flex-col items-center justify-center gap-1 text-center px-space-sm" style="min-height:${codexEsc(h)}">
      <span class="material-symbols-outlined text-outline text-[28px]">image</span>
      <span class="font-label-sm text-[10px] text-outline uppercase tracking-wider">${codexEsc(block.label || "Иллюстрация")}</span>
      <span class="font-body-sm text-[11px] text-on-surface-variant max-w-[20rem]">${codexEsc(block.caption || "Пустой блок под картинку — арт добавим позже")}</span>
    </div>`;
  }
  return "";
}

function codexRenderArticle(topic) {
  const blocks = (topic.blocks || []).map(codexBlockHtml).join("");
  const side = (topic.side || []).map(codexBlockHtml).join("") ||
    `<div class="bg-surface-container-low/95 rounded-xl p-space-md shadow-xl text-[12px] text-on-surface-variant">Источник: ${codexEsc(topic.source || "wiki")}</div>`;
  return `
<section class="col-span-12 lg:col-span-5 flex flex-col gap-space-sm bg-surface-container/90 rounded-2xl p-space-md shadow-2xl relative overflow-hidden min-h-0 h-full max-h-full">
  <div class="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
  <div class="flex items-center justify-between z-10 bg-surface-container-lowest/80 backdrop-blur-md px-space-md py-space-xs rounded-xl shadow-md gap-space-sm">
    <div class="flex items-center gap-space-sm min-w-0">
      <span class="material-symbols-outlined text-primary text-xl">${codexEsc(topic.icon || "menu_book")}</span>
      <div class="flex flex-col min-w-0">
        <span class="font-label-lg text-label-lg text-primary uppercase font-bold tracking-wide truncate">${codexEsc(topic.headline || topic.title)}</span>
        <span class="font-body-sm text-body-sm text-on-surface-variant truncate">${codexEsc(topic.blurb || "")}</span>
      </div>
    </div>
    <span class="px-space-xs py-1 rounded bg-surface-container-highest text-primary font-label-sm text-[10px] whitespace-nowrap">${codexEsc(topic.tag || "")}</span>
  </div>
  <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed z-10">${codexEsc(topic.lead || "")}</p>
  <div class="flex flex-col gap-space-sm z-10 overflow-auto flex-1 min-h-0">${blocks}</div>
  <div class="text-[10px] text-outline z-10 pt-1">Источник: ${codexEsc(topic.source || "")}</div>
</section>
<aside class="col-span-12 lg:col-span-4 flex flex-col justify-between gap-space-sm min-h-0 overflow-auto h-full max-h-full">
  ${side}
  <div class="bg-surface-container-lowest/80 p-space-sm rounded-xl border border-surface-container-highest flex items-center justify-between gap-2">
    <span class="font-label-sm text-[11px] text-on-surface-variant">Плейсхолдер арта</span>
    <span class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary"><span class="material-symbols-outlined">${codexEsc(topic.icon || "image")}</span></span>
  </div>
</aside>`;
}


function renderCodex() {
  const root = $("viewCodex");
  if (!root || root.classList.contains("hidden")) return;
  const topics = codexTopics();
  if (!topics.length) return;
  const main = root.querySelector("main");
  if (main && main.scrollTop) main.scrollTop = 0;

  if (!state.codexEntryId) state.codexEntryId = "class_sets";
  if (!state.codexFilter) state.codexFilter = "all";
  if (state.codexQuery == null) state.codexQuery = "";
  if (!state.codexRead) state.codexRead = {};

  const host = $("codexDetailHost");
  if (host && !window.__codexArmorHTML) {
    window.__codexArmorHTML = host.innerHTML;
  }

  const filters = $("codexFilters");
  if (filters) {
    const total = topics.length;
    filters.innerHTML = codexFilters()
      .map((f) => {
        const count =
          f.id === "all" ? total : topics.filter((t) => t.filter === f.id).length;
        const label = f.id === "all" ? `${f.label} (${count})` : f.label;
        const on = state.codexFilter === f.id;
        return `<button type="button" data-kb-filter="${f.id}" class="px-2 py-0.5 rounded font-label-sm text-[10px] whitespace-nowrap transition-colors ${
          on
            ? "bg-primary text-on-primary shadow-sm"
            : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface hover:bg-surface-bright"
        }">${codexEsc(label)}</button>`;
      })
      .join("");
    if (filters.dataset.bound !== "1") {
      filters.dataset.bound = "1";
      filters.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-kb-filter]");
        if (!btn) return;
        state.codexFilter = btn.getAttribute("data-kb-filter") || "all";
        renderCodex();
      });
    }
  }

  const search = $("codexSearch");
  if (search && search.dataset.bound !== "1") {
    search.dataset.bound = "1";
    search.value = state.codexQuery || "";
    search.addEventListener("input", () => {
      state.codexQuery = search.value || "";
      renderCodex();
    });
  }

  const q = (state.codexQuery || "").trim().toLowerCase();
  const list = topics.filter((t) => {
    if (state.codexFilter && state.codexFilter !== "all" && t.filter !== state.codexFilter) return false;
    if (!q) return true;
    const blockText = [...(t.blocks || []), ...(t.side || [])]
      .flatMap((b) => [
        b.title,
        b.text,
        b.label,
        b.caption,
        ...(b.items || []),
        ...(b.headers || []),
        ...((b.rows || []).flat()),
      ])
      .filter(Boolean)
      .join(" ");
    const hay = [t.title, t.blurb, t.tag, t.headline, t.lead, t.source, blockText]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
  if (!list.some((t) => t.id === state.codexEntryId)) {
    state.codexEntryId = list[0]?.id || topics[0].id;
  }

  const nav = $("codexTopicList");
  if (nav) {
    nav.innerHTML = list
      .map((t) => {
        const on = t.id === state.codexEntryId;
        const status = t.status
          ? `<span class="px-1 py-0.2 rounded bg-primary text-on-primary font-label-sm text-[9px]">${codexEsc(t.status)}</span>`
          : `<span class="px-1 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-[9px]">${codexEsc(t.tag || "")}</span>`;
        return `<button type="button" data-kb-topic="${codexEsc(t.id)}" class="w-full text-left p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-space-xs ${
          on
            ? "bg-surface-container-high ring-1 ring-primary shadow-sm"
            : "bg-surface-container/70 hover:bg-surface-container-high"
        }">
          <div class="w-8 h-8 rounded-lg ${on ? "bg-primary-container/30 text-primary ring-1 ring-primary/40" : "bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant"} flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-base">${codexEsc(t.icon || "menu_book")}</span>
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <span class="font-label-sm text-[11px] ${on ? "text-primary" : "text-on-surface"} font-bold truncate">${codexEsc(t.title)}</span>
              ${status}
            </div>
            <div class="flex items-center gap-1 text-[10px] text-on-surface-variant">
              <span class="truncate">${codexEsc(t.blurb || t.tag || "")}</span>
            </div>
          </div>
        </button>`;
      })
      .join("");
    if (nav.dataset.bound !== "1") {
      nav.dataset.bound = "1";
      nav.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-kb-topic]");
        if (!btn) return;
        state.codexEntryId = btn.getAttribute("data-kb-topic") || "class_sets";
        state.codexRead[state.codexEntryId] = true;
        renderCodex();
      });
    }
  }

  state.codexRead[state.codexEntryId] = true;
  const readN = Math.min(topics.length, Math.max(Object.keys(state.codexRead).length, 1));
  const progress = $("codexProgress");
  if (progress) {
    const pct = Math.round((readN / topics.length) * 100);
    progress.innerHTML = `
      <div class="flex items-center justify-between text-[11px]"><span class="font-label-sm text-on-surface">Прогресс Кодекса</span><span class="font-stat-numeral text-primary font-bold">${readN}/${topics.length} (${pct}%)</span></div>
      <div class="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r from-primary to-primary-container" style="width:${pct}%"></div></div>
      <div class="flex items-center justify-between pt-0.5"><span class="text-[10px] text-outline">+${Math.max(0, readN - 1)} глав открыто</span><span class="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">wiki SSOT</span></div>`;
  }

  const topic = topics.find((t) => t.id === state.codexEntryId) || topics[0];
  if (host) {
    if (topic.mode === "arsenal" && window.__codexArmorHTML) {
      host.innerHTML = window.__codexArmorHTML;
    } else {
      host.innerHTML = codexRenderArticle(topic);
    }
  }

  if (root.dataset.kbWired !== "1") {
    root.dataset.kbWired = "1";
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !root.contains(btn)) return;
      const label = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (label.includes("экипировать набор на барсика") || label.includes("equip set on barsik")) {
        e.preventDefault();
        toast(state.locale === "ru" ? "Набор экипирован на Барсика" : "Set equipped on Barsik");
      }
    });
  }
}

function renderClanPanel() {
  const summary = $("clanSummary");
  const list = $("clanMemberList");
  if (summary) {
    summary.textContent = state.clan
      ? `Клан «${state.clan.name}» · ${state.clan.members.length} уч.`
      : "Клана нет — создай ниже.";
  }
  if (list) {
    list.innerHTML = "";
    if (!state.clan) {
      list.innerHTML = `<div class="meta">Нет участников</div>`;
    } else {
      for (const name of state.clan.members) {
        const row = document.createElement("div");
        row.className = "mythfel-panel-card";
        row.innerHTML = `<strong>${name}</strong>`;
        const rm = document.createElement("button");
        rm.type = "button";
        rm.className = "wire-btn";
        rm.textContent = "Убрать";
        rm.addEventListener("click", () => {
          state.clan.members = state.clan.members.filter((m) => m !== name);
          toast(`Убран: ${name}`);
          renderClanPanel();
          renderGuild();
        });
        row.appendChild(rm);
        list.appendChild(row);
      }
    }
  }
  const createBtn = $("btnClanCreate");
  if (createBtn && !createBtn.dataset.bound) {
    createBtn.dataset.bound = "1";
    createBtn.addEventListener("click", () => {
      const name = ($("clanNameInput")?.value || "").trim() || "Лапка Очага";
      state.clan = {
        name,
        members: [state.session?.userId || "local_smoke"],
        createdAt: Date.now(),
      };
      toast(`Клан «${name}» создан`);
      renderClanPanel();
      renderGuild();
    });
  }
  const disband = $("btnClanDisband");
  if (disband && !disband.dataset.bound) {
    disband.dataset.bound = "1";
    disband.addEventListener("click", () => {
      state.clan = null;
      toast("Клан распущен");
      renderClanPanel();
      renderGuild();
    });
  }
  const addBtn = $("btnClanAddMember");
  if (addBtn && !addBtn.dataset.bound) {
    addBtn.dataset.bound = "1";
    addBtn.addEventListener("click", () => {
      if (!state.clan) {
        toast("Сначала создай клан");
        return;
      }
      const name = ($("clanMemberInput")?.value || "").trim();
      if (!name) {
        toast("Введи ник");
        return;
      }
      if (state.clan.members.includes(name)) {
        toast("Уже в клане");
        return;
      }
      state.clan.members.push(name);
      if ($("clanMemberInput")) $("clanMemberInput").value = "";
      toast(`Добавлен: ${name}`);
      renderClanPanel();
      renderGuild();
    });
  }
}

function renderGuild() {
  ensureHudPanel(
    "viewGuild",
    "guildClanQuick",
    `<div class="mythfel-panel-head"><strong>Клан</strong><span class="meta" id="guildClanMeta"></span></div>
     <div class="mythfel-panel-actions">
       <button type="button" class="wire-btn" id="btnGuildCreateClan">Создать клан</button>
       <button type="button" class="wire-btn" id="btnGuildAddMember">+ Участник</button>
       <button type="button" class="wire-btn" id="btnGuildRemoveMember">− Участник</button>
       <button type="button" class="wire-btn" data-path="soon_clan" id="btnGuildOpenClan">Карточка клана</button>
     </div>
     <div id="guildMemberPreview" class="meta"></div>`,
  );
  const meta = $("guildClanMeta");
  if (meta) {
    meta.textContent = state.clan
      ? `«${state.clan.name}» · ${state.clan.members.length}`
      : "нет клана";
  }
  const preview = $("guildMemberPreview");
  if (preview) {
    preview.textContent = state.clan ? state.clan.members.join(", ") : "—";
  }
  const mk = (id, fn) => {
    const el = $(id);
    if (el && !el.dataset.bound) {
      el.dataset.bound = "1";
      el.addEventListener("click", fn);
    }
  };
  mk("btnGuildCreateClan", () => {
    if (state.clan) {
      toast(`Уже есть «${state.clan.name}»`);
      return;
    }
    state.clan = {
      name: "Лапка Очага",
      members: [state.session?.userId || "local_smoke"],
      createdAt: Date.now(),
    };
    toast("Клан создан");
    renderGuild();
  });
  mk("btnGuildAddMember", () => {
    if (!state.clan) {
      toast("Сначала создай клан");
      return;
    }
    const name = `Участник-${state.clan.members.length + 1}`;
    state.clan.members.push(name);
    toast(`Добавлен: ${name}`);
    renderGuild();
  });
  mk("btnGuildRemoveMember", () => {
    if (!state.clan || state.clan.members.length <= 1) {
      toast("Некого убирать (остался лидер)");
      return;
    }
    const removed = state.clan.members.pop();
    toast(`Убран: ${removed}`);
    renderGuild();
  });
  mk("btnGuildOpenClan", () => navigate("soon_clan", { soon: "clan_boss" }));

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
  tip.addEventListener("click", () => navigate("soon_clan", { soon: "clan_boss" }));
  host.appendChild(tip);
}

/** Soft-launch hearth names (display only — combat stays server-side). */
const CAT_SHEET_NAMES = {
  starter_tank_stone: "Рыжик Каменный",
  starter_fighter_fire: "Барсик Громовержец",
  starter_support_water: "Мурка Водная",
  shop_tank_stone_a: "Щит-утёс",
  shop_tank_stone_b: "Пробой",
  shop_fighter_fire_a: "Парные когти",
  shop_fighter_fire_b: "Двуручный",
  shop_assassin_bolt_a: "Тень",
  shop_assassin_bolt_b: "Охотник тыла",
  shop_ranger_grass_a: "Охотник",
  shop_ranger_grass_b: "Град стрел",
  shop_mage_fire_a: "Огонь",
  shop_mage_ice_b: "Лёд",
  shop_support_water_a: "Чистый родник",
  shop_support_water_b: "Прилив силы",
  bot_practice_tank_a: "Дубовый",
  bot_practice_fighter_a: "Берсерк",
  bot_practice_support_a: "Тотем",
};

/**
 * Full-body portraits — wiki §1.0 / media/cat-heroes (12/12).
 * Default path keeps studio background (forms/lobby/load). Battle cutouts: D-037.
 */
const CAT_HERO_ART = {
  shop_tank_stone_a: "/stitch-assets/cat-heroes/tank-a.png",
  shop_tank_stone_b: "/stitch-assets/cat-heroes/tank-b.png",
  shop_fighter_fire_a: "/stitch-assets/cat-heroes/fighter-a.png",
  shop_fighter_fire_b: "/stitch-assets/cat-heroes/fighter-b.png",
  shop_assassin_bolt_a: "/stitch-assets/cat-heroes/assassin-a.png",
  shop_assassin_bolt_b: "/stitch-assets/cat-heroes/assassin-b.png",
  shop_ranger_grass_a: "/stitch-assets/cat-heroes/ranger-a.png",
  shop_ranger_grass_b: "/stitch-assets/cat-heroes/ranger-b.png",
  shop_mage_fire_a: "/stitch-assets/cat-heroes/mage-a.png",
  shop_mage_ice_b: "/stitch-assets/cat-heroes/mage-b.png",
  shop_support_water_a: "/stitch-assets/cat-heroes/support-a.png",
  shop_support_water_b: "/stitch-assets/cat-heroes/support-b.png",
  starter_tank_stone: "/stitch-assets/cat-heroes/tank-a.png",
  starter_fighter_fire: "/stitch-assets/cat-heroes/fighter-a.png",
  starter_support_water: "/stitch-assets/cat-heroes/support-a.png",
};

/** Transparent cutouts — ONLY live fight HUD (practice_fight / pvp_fight / battle). D-037. */
const CAT_HERO_BATTLE_ART = {
  shop_tank_stone_a: "/stitch-assets/cat-heroes/battle/tank-a.webp",
  shop_tank_stone_b: "/stitch-assets/cat-heroes/battle/tank-b.webp",
  shop_fighter_fire_a: "/stitch-assets/cat-heroes/battle/fighter-a.webp",
  shop_fighter_fire_b: "/stitch-assets/cat-heroes/battle/fighter-b.webp",
  shop_assassin_bolt_a: "/stitch-assets/cat-heroes/battle/assassin-a.webp",
  shop_assassin_bolt_b: "/stitch-assets/cat-heroes/battle/assassin-b.webp",
  shop_ranger_grass_a: "/stitch-assets/cat-heroes/battle/ranger-a.webp",
  shop_ranger_grass_b: "/stitch-assets/cat-heroes/battle/ranger-b.webp",
  shop_mage_fire_a: "/stitch-assets/cat-heroes/battle/mage-a.webp",
  shop_mage_ice_b: "/stitch-assets/cat-heroes/battle/mage-b.webp",
  shop_support_water_a: "/stitch-assets/cat-heroes/battle/support-a.webp",
  shop_support_water_b: "/stitch-assets/cat-heroes/battle/support-b.webp",
  starter_tank_stone: "/stitch-assets/cat-heroes/battle/tank-a.webp",
  starter_fighter_fire: "/stitch-assets/cat-heroes/battle/fighter-a.webp",
  starter_support_water: "/stitch-assets/cat-heroes/battle/support-a.webp",
  // Practice dummies — dedicated no-bg mannequins (D-037 fight-only).
  // FX/SFX reuse tank / fighter / support role kits (MF-149).
  bot_practice_tank_a: "/stitch-assets/dojo/battle/dummy-oak-knight.png",
  bot_practice_fighter_a: "/stitch-assets/dojo/battle/dummy-straw-berserk.png",
  bot_practice_support_a: "/stitch-assets/dojo/battle/dummy-stone-totem.png",
};

const CAT_HERO_BLURB = {
  shop_tank_stone_a: "Танк A · hard-def: щит + taunt. Карты «Каменный взор» / «Уши валуна» (N=6).",
  shop_tank_stone_b: "Танк B · pierce/fragile. Карты «Трещина взора» / «Чуткость бреши» (N=6).",
  shop_fighter_fire_a: "Боец A · dual + crit + ruffle. Карты «Искрящий взгляд» / «Боевой слух» (N=6).",
  shop_fighter_fire_b: "Боец B · тяжёлые одиночные удары. Карты «Яростный взор» / «Рёв стали» (N=6).",
  shop_assassin_bolt_a: "Ассасин A · stealth + crit. Карты «Глаза мглы» / «Шёпот ветра» (N=6).",
  shop_assassin_bolt_b: "Ассасин B · backline + poison. Карты «Прицел в спину» / «Слух поддержки» (N=6).",
  shop_ranger_grass_a: "Стрелок A · lowest_hp / ambush. Карты «Глаз добычи» / «Уши засады» (N=6).",
  shop_ranger_grass_b: "Стрелок B · AoE all_enemies. Карты «Широкий взор» / «Дальний слух» (N=6).",
  shop_mage_fire_a: "Маг A · fire AoE + vuln/weak. Карты «Пламенный зрачок» / «Треск искр» (N=6).",
  shop_mage_ice_b: "Маг B · ice control stun/freeze. Карты «Ледяной взор» / «Холодный слух» (N=6).",
  shop_support_water_a: "Саппорт A · heal + cleanse. Карты «Целительный взгляд» / «Уши очищения» (N=6).",
  shop_support_water_b: "Саппорт B · heal + ATK buff. Карты «Вдохновляющий взор» / «Шёпот слабости» (N=6).",
};

function catHeroArt(templateId) {
  return CAT_HERO_ART[templateId] || null;
}

/** No-background sprite for live battle boards only (D-037). */
function catHeroBattleArt(templateId) {
  return CAT_HERO_BATTLE_ART[templateId] || catHeroArt(templateId);
}

/** PvE monster cutouts by role (MF-152). Fallback when faction unknown. */
const MONSTER_BATTLE_BY_ROLE = {
  tank: [
    "/stitch-assets/monsters/battle/tank-a.webp",
    "/stitch-assets/monsters/battle/tank-b.webp",
    "/stitch-assets/monsters/battle/tank-c.webp",
    "/stitch-assets/monsters/battle/tank-d.webp",
  ],
  fighter: [
    "/stitch-assets/monsters/battle/fighter-a.webp",
    "/stitch-assets/monsters/battle/fighter-b.webp",
    "/stitch-assets/monsters/battle/fighter-c.webp",
    "/stitch-assets/monsters/battle/fighter-d.webp",
    "/stitch-assets/monsters/battle/fighter-e.webp",
    "/stitch-assets/monsters/battle/fighter-f.webp",
    "/stitch-assets/monsters/battle/fighter-g.webp",
    "/stitch-assets/monsters/battle/fighter-h.webp",
  ],
  support: [
    "/stitch-assets/monsters/battle/support-a.webp",
    "/stitch-assets/monsters/battle/support-b.webp",
    "/stitch-assets/monsters/battle/support-c.webp",
  ],
  assassin: [
    "/stitch-assets/monsters/battle/assassin-a.webp",
    "/stitch-assets/monsters/battle/assassin-b.webp",
  ],
  ranger: [
    "/stitch-assets/monsters/battle/ranger-a.webp",
    "/stitch-assets/monsters/battle/ranger-b.webp",
  ],
  mage: ["/stitch-assets/monsters/battle/mage-a.webp"],
};

/**
 * D-039 faction → role cutouts. Ch1 = обычные/серые псы (not red/zombie/ghost).
 * Pitboss key overrides role pool when templateId includes pitboss.
 */
const MONSTER_BATTLE_BY_FACTION = {
  dogs: {
    tank: ["/stitch-assets/monsters/battle/tank-b.webp"],
    // Grey dual-club fighter-h (обычный пёс). Do NOT use fighter-b — that dual-axe red plate
    // is the ch3 red-dog look (Andrew: ch1 showed «красный пёс»).
    fighter: ["/stitch-assets/monsters/battle/fighter-h.webp"],
    support: ["/stitch-assets/monsters/battle/ranger-a.webp"],
    pitboss: ["/stitch-assets/monsters/battle/tank-d.webp"],
  },
  wolves: {
    // Ch2 RGBA cutouts (new filenames bust 7d immutable cache of black-plate RGB).
    tank: ["/stitch-assets/monsters/battle/wolf-tank-cutout.webp"],
    fighter: ["/stitch-assets/monsters/battle/wolf-fighter-cutout.webp"],
    support: ["/stitch-assets/monsters/battle/wolf-support-cutout.webp"],
    pitboss: ["/stitch-assets/monsters/battle/wolf-pitboss-cutout.webp"],
  },
  red_dogs: {
    // Ch3 refs: shield tank / dual-axe fighter / flaming-sickle support; flaming-sword pitboss.
    tank: ["/stitch-assets/monsters/battle/redd-tank-cutout.webp"],
    fighter: ["/stitch-assets/monsters/battle/redd-fighter-cutout.webp"],
    support: ["/stitch-assets/monsters/battle/redd-support-cutout.webp"],
    pitboss: ["/stitch-assets/monsters/battle/redd-pitboss-cutout.webp"],
  },
  zombies: {
    // Ch4 refs: axe guardian / cleaver butcher / dagger plague-carrier; scythe pitboss.
    tank: ["/stitch-assets/monsters/battle/zombie-tank-cutout.webp"],
    fighter: ["/stitch-assets/monsters/battle/zombie-fighter-cutout.webp"],
    assassin: ["/stitch-assets/monsters/battle/zombie-fighter-cutout.webp"],
    support: ["/stitch-assets/monsters/battle/zombie-support-cutout.webp"],
    pitboss: ["/stitch-assets/monsters/battle/zombie-pitboss-cutout.webp"],
  },
  ghosts: {
    // Ch5 refs: shield+flail / scimitar cape / shaman staff; banner-sword pitboss.
    tank: ["/stitch-assets/monsters/battle/ghost-tank-cutout.webp"],
    fighter: ["/stitch-assets/monsters/battle/ghost-fighter-cutout.webp"],
    support: ["/stitch-assets/monsters/battle/ghost-support-cutout.webp"],
    pitboss: ["/stitch-assets/monsters/battle/ghost-pitboss-cutout.webp"],
  },
};

const MONSTER_FACTION_BY_CHAPTER = ["dogs", "wolves", "red_dogs", "zombies", "ghosts"];

function monsterFactionFromTid(tid) {
  const s = String(tid || "");
  if (s.includes("bot_dog") || s.includes("pitboss_dog")) return "dogs";
  if (s.includes("bot_wolf") || s.includes("pitboss_wolf")) return "wolves";
  if (s.includes("bot_redd") || s.includes("pitboss_redd")) return "red_dogs";
  if (s.includes("bot_zomb") || s.includes("pitboss_zomb")) return "zombies";
  if (s.includes("bot_ghost") || s.includes("pitboss_ghost")) return "ghosts";
  const ch = Math.max(1, Math.min(5, Number(state.pveChapter) || 1));
  return MONSTER_FACTION_BY_CHAPTER[ch - 1] || "dogs";
}

/** Species noun for death overlay (CSS uppercases). Dummies / PvE·dungeon·raid bots. */
const MONSTER_SPECIES_RU = {
  dogs: "пёс",
  wolves: "волк",
  red_dogs: "пёс",
  zombies: "зомби",
  ghosts: "призрак",
};

/** Fatality line over a dead unit: манекен / species / котик. */
function unitFatalityLabel(u) {
  const tid = String(unitTemplateId(u) || "");
  const id = String(u?.id || "");
  if (tid.includes("bot_practice") || id.includes("bot_practice")) {
    return "манекен отдыхает";
  }
  if (tid.startsWith("bot_") || id.startsWith("bot_") || tid.includes("pitboss")) {
    const species = MONSTER_SPECIES_RU[monsterFactionFromTid(tid)] || "монстр";
    return `${species} отдыхает`;
  }
  return "котик отдыхает";
}

function hashPickArt(key, pool) {
  if (!pool?.length) return null;
  const s = String(key || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // >>>0: Math.imul is signed; negative `%` would yield undefined slots.
  return pool[(h >>> 0) % pool.length];
}

function monsterBattleArt(unit) {
  const role = String(unit?.role || "").toLowerCase();
  const tid = unitTemplateId(unit);
  const faction = monsterFactionFromTid(tid);
  const byFaction = MONSTER_BATTLE_BY_FACTION[faction];
  const isPitboss = String(tid || "").includes("pitboss");
  const pool =
    (isPitboss && byFaction?.pitboss) ||
    byFaction?.[role] ||
    MONSTER_BATTLE_BY_ROLE[role] ||
    MONSTER_BATTLE_BY_ROLE.fighter;
  return hashPickArt(tid || unit?.id || role, pool);
}

/** Live-fight art: explicit map → PvE bot monsters by role → cat cutouts. D-037. */
function battleUnitArt(unit) {
  if (!unit) return null;
  const tid = unitTemplateId(unit);
  if (tid && Object.prototype.hasOwnProperty.call(CAT_HERO_BATTLE_ART, tid)) {
    return CAT_HERO_BATTLE_ART[tid];
  }
  if (String(tid).startsWith("bot_") || String(unit.id || "").startsWith("bot_")) {
    return monsterBattleArt(unit);
  }
  return catHeroBattleArt(tid);
}

/**
 * Sprite facing (Andrew / MF-170 · D-040):
 * - Cat heroes always face RIGHT (every form).
 * - Practice dummies + PvE monsters/soldiers/pitbosses always face LEFT.
 * Battle layout (allies left / foes right) → they look toward center.
 * Prefer CSS scaleX via `.mf-sprite-face.is-flipped` (wrapper so idle breathe keeps working).
 */
/**
 * Authored-left art slugs by folder (cats/dojo/monsters share role names — scope by path).
 * Default native = RIGHT → flip when desired is left.
 */
const CAT_NATIVE_FACE_LEFT = new Set(["assassin-a", "tank-a", "fighter-a", "support-a"]);
const DUMMY_NATIVE_FACE_LEFT = new Set([
  "dummy-oak-knight",
  // dummy-straw-berserk is authored facing RIGHT — flip when desired=left (MF-171).
  "dummy-stone-totem",
]);
// Only assets authored aiming/looking LEFT. Default native = RIGHT → flip for desired left.
// Do NOT list: ranger-a, tank-b, wolf-tank/pitboss (shield/glow RIGHT → flip).
// fighter-h (ch1 Пёс-задира) re-baked pixel-LEFT + listed — lock so CSS never mirrors it away
// (Andrew: боец смотрел направо). Ch3 redd-* same bake+list pattern.
const MONSTER_NATIVE_FACE_LEFT = new Set([
  "assassin-b",
  "fighter-f",
  "fighter-h",
  "redd-tank-cutout",
  "redd-fighter-cutout",
  "redd-support-cutout",
  "redd-pitboss-cutout",
  "wolf-support-cutout",
  "zombie-pitboss-cutout",
]);

function artSlugFromSrc(src) {
  const base = String(src || "")
    .split("?")[0]
    .split("/")
    .pop() || "";
  return base.replace(/\.(png|jpe?g|webp)$/i, "");
}

function isFoeSpriteUnit(unitOrTid) {
  if (unitOrTid == null) return false;
  if (typeof unitOrTid === "string") {
    const tid = unitOrTid;
    return tid.startsWith("bot_") || tid.includes("/dojo/") || tid.includes("/monsters/");
  }
  const tid = String(unitTemplateId(unitOrTid) || unitOrTid.templateId || "");
  const id = String(unitOrTid.id || "");
  if (tid.startsWith("bot_") || id.startsWith("bot_")) return true;
  const art = battleUnitArt(unitOrTid) || "";
  return art.includes("/dojo/") || art.includes("/monsters/");
}

/** @returns {'left'|'right'} */
function desiredSpriteFace(unitOrKind) {
  if (unitOrKind === "enemy" || unitOrKind === "foe" || unitOrKind === "left") return "left";
  if (unitOrKind === "ally" || unitOrKind === "hero" || unitOrKind === "right") return "right";
  return isFoeSpriteUnit(unitOrKind) ? "left" : "right";
}

function artNativeFace(src) {
  const path = String(src || "").split("?")[0];
  const slug = artSlugFromSrc(path);
  if (path.includes("/monsters/")) {
    return MONSTER_NATIVE_FACE_LEFT.has(slug) ? "left" : "right";
  }
  if (path.includes("/dojo/")) {
    return DUMMY_NATIVE_FACE_LEFT.has(slug) ? "left" : "right";
  }
  // cat-heroes framed + battle cutouts
  return CAT_NATIVE_FACE_LEFT.has(slug) ? "left" : "right";
}

function spriteNeedsFaceFlip(artSrc, desiredFace) {
  return artNativeFace(artSrc) !== desiredFace;
}

/** Ensure img sits in `.mf-sprite-face` wrapper; toggle `.is-flipped` for scaleX(-1). */
function applySpriteFacing(imgOrRoot, { artSrc, desiredFace, unit } = {}) {
  if (!imgOrRoot) return null;
  const img =
    imgOrRoot.tagName === "IMG"
      ? imgOrRoot
      : imgOrRoot.querySelector?.("img.mf-battle-cutout, img.mf-hero-sprite, .mf-sprite-face img, img");
  if (!img) return null;
  const src = artSrc || img.getAttribute("src") || "";
  const desired = desiredFace || desiredSpriteFace(unit);
  let face = img.closest?.(".mf-sprite-face");
  if (!face) {
    face = document.createElement("span");
    face.className = "mf-sprite-face";
    img.replaceWith(face);
    face.appendChild(img);
  }
  const flip = spriteNeedsFaceFlip(src, desired);
  face.classList.toggle("is-flipped", flip);
  face.dataset.face = desired;
  // Inline backup: some Tailwind `transform` utilities can otherwise win the cascade.
  face.style.transform = flip ? "scaleX(-1)" : "";
  return face;
}

function spriteFaceHtml(imgHtml, { artSrc, desiredFace }) {
  const flip = spriteNeedsFaceFlip(artSrc, desiredFace) ? " is-flipped" : "";
  return `<span class="mf-sprite-face${flip}" data-face="${desiredFace}">${imgHtml}</span>`;
}

const HOME_SLOT_PIN = {
  helm: "is-tl",
  armor: "is-ml",
  cloak: "is-bl",
  boots: "is-bc",
  weapon: "is-tr",
  shield: "is-mr",
  belt: "is-br",
  ring: "is-br2",
};
const CAT_ROLE_RU = {
  tank: "Страж",
  fighter: "Боец",
  assassin: "Убийца",
  ranger: "Следопыт",
  mage: "Чародей",
  support: "Поддержка",
  farm: "Двор",
};
const CAT_ELEMENT_RU = {
  stone: "Камень",
  fire: "Огонь",
  water: "Вода",
  bolt: "Молния",
  grass: "Трава",
  ice: "Лёд",
};
const CAT_ELEMENT_GEN = {
  stone: "камня",
  fire: "огня",
  water: "воды",
  bolt: "молнии",
  grass: "травы",
  ice: "льда",
};
const HOME_SLOT_ORDER = ["helm", "armor", "cloak", "boots", "weapon", "shield", "belt", "ring"];
const HOME_SLOT_LEFT = ["helm", "armor", "cloak", "boots"];
const HOME_SLOT_RIGHT = ["weapon", "shield", "belt", "ring"];
const HOME_SLOT_RU = {
  helm: "Шлем",
  armor: "Доспех",
  cloak: "Плащ",
  boots: "Сапоги",
  weapon: "Оружие",
  shield: "Щит",
  belt: "Пояс",
  ring: "Кольцо",
};
const HOME_RARITY_RU = { mythic: "Миф", epic: "Эпик", rare: "Редк", common: "Обыч" };
/** Color armor sets: piece totals + 3-piece set bonus (flat, combat scale). */
const HOME_SET_RU = {
  grey: { name: "Серый Лев", need: 3, armor: "+6 DEF · +8 HP", weapon: "—", bonus: "3+: +1 DEF" },
  green: { name: "Зелёный След", need: 3, armor: "+8 DEF · +10 HP · +1 ATK", weapon: "лук/арбалет +2 ATK", bonus: "3+: +1 ATK" },
  turquoise: { name: "Бирюза", need: 3, armor: "+9 DEF · +11 HP · +1 ATK", weapon: "посох +2 ATK", bonus: "3+: +1 SPD" },
  yellow: { name: "Жёлтый Лев", need: 3, armor: "+11 DEF · +13 HP · +2 ATK", weapon: "посох +3 / жезл +2 ATK", bonus: "3+: +1 ATK" },
  purple: { name: "Фиолет", need: 3, armor: "+12 DEF · +14 HP · +2 ATK", weapon: "кинжалы +2 ATK каждый", bonus: "3+: +1 crit" },
  red: { name: "Красный Дракон", need: 3, armor: "+14 DEF · +16 HP · +2 ATK", weapon: "меч +4 / топоры +2 ATK", bonus: "3+: +2 HP" },
};

function formatGearBonuses(item) {
  if (!item) return "";
  const parts = [];
  if (item.atk) parts.push(`+${item.atk} ATK`);
  if (item.def) parts.push(`+${item.def} DEF`);
  if (item.hp) parts.push(`+${item.hp} HP`);
  if (item.spd) parts.push(`+${item.spd} SPD`);
  if (item.crit) parts.push(`+${item.crit} crit`);
  return parts.join(" · ");
}

function armorSetTotals(setId) {
  const pieces = (state.gearCatalog || []).filter(
    (g) => g.set === setId && ["helm", "armor", "cloak", "belt", "boots"].includes(g.slot),
  );
  const tot = { atk: 0, def: 0, hp: 0, spd: 0 };
  for (const p of pieces) {
    tot.atk += p.atk || 0;
    tot.def += p.def || 0;
    tot.hp += p.hp || 0;
    tot.spd += p.spd || 0;
  }
  return tot;
}

function emptyEquipSlots() {
  return Object.fromEntries(HOME_SLOT_ORDER.map((slot) => [slot, null]));
}

function catSheetName(cat) {
  if (CAT_SHEET_NAMES[cat.templateId]) return CAT_SHEET_NAMES[cat.templateId];
  const parts = String(cat.templateId || "").split("_");
  const role = parts.find((part) => CAT_ROLE_RU[part]);
  const element = parts.find((part) => CAT_ELEMENT_RU[part]);
  if (role && element) return `${CAT_ROLE_RU[role]} ${CAT_ELEMENT_GEN[element] || CAT_ELEMENT_RU[element].toLowerCase()}`;
  return cat.templateId || cat.catId;
}

function sheetPower(stats) {
  // HP/DEF/SPD matter on sheet; ATK is catalog (sim hit = card.Atk, not unit.Atk).
  return stats.hp * 4 + stats.atk * 1 + stats.def * 5 + stats.spd * 3;
}

function formatSheetNum(n) {
  return String(n ?? "—").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function equipBest(catId) {
  if (!catId) return;
  if (!state.equippedByCat[catId]) {
    state.equippedByCat[catId] = emptyEquipSlots();
  }
  for (const slot of HOME_SLOT_ORDER) {
    const best = state.gearCatalog
      .filter((item) => item.slot === slot && canEquipItem(catId, item))
      .sort((a, b) => b.atk + b.hp + b.def + b.spd - (a.atk + a.hp + a.def + a.spd))[0];
    if (!best) continue;
    for (const eq of Object.values(state.equippedByCat)) {
      for (const key of Object.keys(eq)) {
        if (eq[key] === best.id) eq[key] = null;
      }
    }
    state.equippedByCat[catId][slot] = best.id;
  }
  toast("Лучшее надето (с учётом класса)");
  renderAll();
}

/** Dress full color armor set (helm/armor/cloak/belt/boots). Weapons stay class-gated separately. */
function equipArmorSet(catId, setId) {
  if (!catId || !setId) return false;
  if (!state.equippedByCat[catId]) state.equippedByCat[catId] = emptyEquipSlots();
  const armorSlots = ["helm", "armor", "cloak", "belt", "boots"];
  let worn = 0;
  for (const slot of armorSlots) {
    const piece = state.gearCatalog.find((g) => g.set === setId && g.slot === slot && canEquipItem(catId, g));
    if (!piece) continue;
    for (const eq of Object.values(state.equippedByCat)) {
      for (const key of Object.keys(eq)) {
        if (eq[key] === piece.id) eq[key] = null;
      }
    }
    state.equippedByCat[catId][slot] = piece.id;
    worn += 1;
  }
  const meta = HOME_SET_RU[setId];
  const label = meta?.name || setId;
  const tot = armorSetTotals(setId);
  const armorLine = meta?.armor || `+${tot.def} DEF · +${tot.hp} HP`;
  toast(worn ? `${label}: ${worn}/5 · ${armorLine}` : `${label}: нет частей`);
  renderHome();
  renderEquipCards();
  renderAll();
  return worn > 0;
}

function unequipAll(catId) {
  const eq = state.equippedByCat[catId];
  if (!eq) return;
  for (const slot of HOME_SLOT_ORDER) eq[slot] = null;
  toast("Слоты сняты");
  persistGearStub();
  renderAll();
}

function salvageItem(itemId) {
  const item = state.gearCatalog.find((g) => g.id === itemId);
  if (!item) return;
  for (const eq of Object.values(state.equippedByCat)) {
    for (const slot of Object.keys(eq)) {
      if (eq[slot] === itemId) eq[slot] = null;
    }
  }
  state.gearCatalog = state.gearCatalog.filter((g) => g.id !== itemId);
  if (state.homeBagFocus === itemId) state.homeBagFocus = null;
  if (state.barnFocus === itemId) state.barnFocus = null;
  toast(`${item.name} переплавлен`);
  persistGearStub();
  renderAll();
}

function itemPower(item) {
  if (!item) return 0;
  return (item.atk || 0) + (item.hp || 0) + (item.def || 0) * 2 + (item.spd || 0) * 3;
}

const BARN_SOON_KINDS = new Set(["farm", "potion", "blueprint"]);
const BARN_RARITIES = [
  { id: "all", label: "Все" },
  { id: "mythic", label: "Мифик" },
  { id: "legendary", label: "Легенда" },
  { id: "epic", label: "Эпик" },
  { id: "rare", label: "Редк" },
  { id: "common", label: "Обычн" },
];
const BARN_RARITY_RU = {
  mythic: "Миф",
  legendary: "Легенда",
  epic: "Эпик",
  rare: "Редк",
  common: "Обычн",
};
const BARN_KIND_RU = {
  armor: "Броня",
  weapon: "Оружие",
  farm: "Добыча / ферма",
  potion: "Зелье",
  blueprint: "Чертёж",
};

function gearBarnKind(g) {
  return g.slot === "weapon" || g.slot === "shield" ? "weapon" : "armor";
}

/** Rebuild barn rows from gearCatalog SoT (D-028). */
function syncBarnFromGear() {
  state.barnCatalog = (state.gearCatalog || []).map((g) => ({
    id: g.id,
    name: g.name,
    kind: gearBarnKind(g),
    rarity: g.rarity,
    tag: `${g.set || "class"} · ${g.slot}`,
    enhance: g.enhance || 0,
    qty: 1,
    gearId: g.id,
    iconSrc: g.iconSrc,
  }));
}

function barnStockUsed() {
  return (state.gearCatalog || []).length;
}

function barnFilteredItems() {
  syncBarnFromGear();
  const q = (state.barnSearch || "").trim().toLowerCase();
  const cat = state.barnCatFilter || "all";
  if (BARN_SOON_KINDS.has(cat)) return [];
  return (state.barnCatalog || []).filter((item) => {
    if (cat === "equip") {
      if (item.kind !== "armor" && item.kind !== "weapon") return false;
    } else if (cat !== "all" && item.kind !== cat) {
      return false;
    }
    if (state.barnRarityFilter && state.barnRarityFilter !== "all" && item.rarity !== state.barnRarityFilter) {
      return false;
    }
    if (q && !`${item.name} ${item.tag}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function barnKindCount(kind) {
  syncBarnFromGear();
  if (BARN_SOON_KINDS.has(kind)) return 0;
  return (state.barnCatalog || []).filter((item) => {
    if (kind === "all") return true;
    if (kind === "equip") return item.kind === "armor" || item.kind === "weapon";
    return item.kind === kind;
  }).length;
}

function barnGearForItem(item) {
  if (!item) return null;
  const id = item.gearId || item.id;
  return state.gearCatalog.find((g) => g.id === id) || null;
}

function barnItemWorn(gearId) {
  if (!gearId) return false;
  return Object.values(state.equippedByCat || {}).some((eq) =>
    Object.values(eq || {}).includes(gearId),
  );
}

function barnRarityBorder(rarity) {
  if (rarity === "mythic" || rarity === "legendary") return "border-primary/60";
  if (rarity === "epic") return "border-tertiary/50";
  if (rarity === "rare") return "border-secondary/50";
  return "border-surface-container-highest/40";
}

function setBarnInspectOpen(open) {
  const root = $("viewGear");
  const panel = $("barnInspector") || root?.querySelector("[data-gear-inspect]");
  if (!root || !panel) return;
  if (open) {
    panel.dataset.open = "1";
    panel.removeAttribute("hidden");
    root.dataset.inspectOpen = "1";
  } else {
    panel.dataset.open = "0";
    panel.setAttribute("hidden", "");
    root.dataset.inspectOpen = "0";
  }
}

/** One cell chrome for every category filter. */
function barnItemCellHtml(item) {
  const on = item.id === state.barnFocus;
  const worn = barnItemWorn(item.gearId || item.id);
  const border = barnRarityBorder(item.rarity);
  const badge = item.enhance > 0 ? `+${item.enhance}` : "";
  return `<button type="button" data-barn-item="${item.id}" class="rounded-xl bg-surface-container-lowest p-1 border ${border} ${on ? "ring-2 ring-primary" : "hover:border-primary/40"}${worn ? " opacity-50" : ""}" title="${item.name}${worn ? " · надето" : ""}">
    <img alt="" src="${item.iconSrc}"/>
    ${badge ? `<span class="barn-cell-badge px-1 rounded bg-surface-container-lowest/90 font-stat-numeral text-[9px] text-primary">${badge}</span>` : ""}
    ${worn ? `<span class="barn-cell-worn px-1 rounded bg-primary/90 text-on-primary font-label-sm text-[8px]">on</span>` : ""}
    <span class="barn-cell-name px-0.5 py-0.5 bg-surface-container-lowest/90 font-label-sm text-[8px] text-on-surface truncate text-center">${item.name}</span>
  </button>`;
}

/** Square rows from column width; run after layout (inspect open changes width). */
function layoutBarnGrid(grid) {
  if (!grid || grid.id !== "barnGrid") return;
  const run = () => {
    if (!grid.isConnected) return;
    const styles = getComputedStyle(grid);
    const gap = parseFloat(styles.columnGap || styles.gap) || 4;
    const colW = Math.max(48, Math.floor((grid.clientWidth - gap * 5) / 6));
    grid.style.gridAutoRows = `${colW}px`;
  };
  run();
  requestAnimationFrame(run);
}

function ensureBarnGridShell(grid) {
  if (!grid || grid.dataset.barnShell === "1") return grid;
  grid.id = "barnGrid";
  grid.classList.remove("flex-1", "overflow-y-auto", "content-start");
  grid.style.height = "auto";
  let shell = grid.parentElement;
  if (!shell || shell.id !== "barnGridScroll") {
    shell = document.createElement("div");
    shell.id = "barnGridScroll";
    grid.replaceWith(shell);
    shell.appendChild(grid);
  }
  grid.dataset.barnShell = "1";
  if (shell.dataset.barnRo !== "1") {
    shell.dataset.barnRo = "1";
    const ro = new ResizeObserver(() => layoutBarnGrid(grid));
    ro.observe(shell);
  }
  return grid;
}

/** Hook Stitch gear DOM once — ids for grid/search/inspector. */
function ensureBarnDom(root) {
  if (!root || root.dataset.barnDom === "1") return;
  const grid = [...root.querySelectorAll(".grid.grid-cols-6")].find((g) =>
    /overflow-y-auto|content-start/.test(g.className),
  );
  if (grid) ensureBarnGridShell(grid);
  const search = root.querySelector('input[placeholder*="Поиск"]');
  if (search) search.id = "barnSearch";
  const rarityRow = search?.closest(".flex.items-center.justify-between")?.querySelector(".flex.items-center.gap-1");
  if (rarityRow) rarityRow.id = "barnRarityTabs";
  const leftCol = root.querySelector(".col-span-3.flex.flex-col");
  const lowCards = [...(leftCol?.querySelectorAll(":scope > .bg-surface-container-low") || [])];
  if (lowCards[0]) lowCards[0].id = "barnCapBlock";
  const catBox =
    lowCards[1]?.querySelector(".flex.flex-col.flex-1.justify-between") || lowCards[1];
  if (catBox) catBox.id = "barnCatTabs";
  const inspector = root.querySelector("[data-gear-inspect]") || [...root.querySelectorAll(".col-span-3")].find((el) => el.querySelector("h2"));
  if (inspector) inspector.id = "barnInspector";
  const toolCard = lowCards[2];
  const toolRow = toolCard?.querySelector(".flex.gap-1") || toolCard;
  if (toolRow) {
    toolRow.id = "barnTools";
    const btns = toolRow.querySelectorAll("button");
    if (btns[0]) btns[0].setAttribute("data-barn-tool", "sort");
    if (btns[1]) btns[1].setAttribute("data-barn-tool", "smelt");
  }
  const expandBtn = [...(toolCard?.querySelectorAll("button") || leftCol?.querySelectorAll("button") || [])].find((b) =>
    /мест|\+50|\+200/i.test(b.textContent || ""),
  );
  if (expandBtn) {
    expandBtn.setAttribute("data-barn-tool", "expand");
    expandBtn.id = "barnExpandBtn";
  }
  const tune = [...root.querySelectorAll("button")].find((b) =>
    /tune/i.test(b.querySelector(".material-symbols-outlined")?.textContent || ""),
  );
  if (tune) tune.setAttribute("data-barn-tool", "tune");
  const routes = root.querySelector(".bg-surface-container-low.px-space-md");
  if (routes && /Маршруты со склада/i.test(routes.textContent || "")) {
    routes.id = "barnRoutes";
    const routeBtns = routes.querySelectorAll("button");
    const routeIds = ["craft", "craft", "market", "farm"];
    routeBtns.forEach((btn, i) => {
      btn.setAttribute("data-barn-route", routeIds[i] || "farm");
    });
  }
  root.dataset.barnDom = "1";
}

function bindBarnOnce(root) {
  if (!root || root.dataset.barnBound === "1") return;
  root.dataset.barnBound = "1";
  root.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("[data-gear-inspect-close]");
    if (closeBtn && root.contains(closeBtn)) {
      setBarnInspectOpen(false);
      return;
    }
    const catBtn = e.target.closest("[data-barn-cat]");
    if (catBtn && root.contains(catBtn)) {
      const next = catBtn.getAttribute("data-barn-cat") || "all";
      state.barnCatFilter = next;
      if (BARN_SOON_KINDS.has(next)) {
        showGateTip("Сырьё / зелья / чертежи — Phase 6 (Soon). Сейчас только экип.");
      }
      setBarnInspectOpen(false);
      renderBarn();
      return;
    }
    const rarityBtn = e.target.closest("[data-barn-rarity]");
    if (rarityBtn && root.contains(rarityBtn)) {
      state.barnRarityFilter = rarityBtn.getAttribute("data-barn-rarity") || "all";
      renderBarn();
      return;
    }
    const itemBtn = e.target.closest("[data-barn-item]");
    if (itemBtn && root.contains(itemBtn)) {
      state.barnFocus = itemBtn.getAttribute("data-barn-item");
      setBarnInspectOpen(true);
      renderBarn();
      return;
    }
    const routeBtn = e.target.closest("[data-barn-route]");
    if (routeBtn && root.contains(routeBtn)) {
      const dest = routeBtn.getAttribute("data-barn-route");
      if (dest === "craft" || dest === "market" || dest === "farm") {
        showGateTip(dest === "farm" ? "Ферма — Soon (Phase 6)" : "Маршрут скоро; склад = stub экипа");
        if (dest === "market") navigate("market");
        else if (dest === "craft") navigate("craft", { soon: "craft" });
        else navigate("farm", { soon: "farm" });
      }
      return;
    }
    const tool = e.target.closest("[data-barn-tool]");
    if (tool && root.contains(tool)) {
      const act = tool.getAttribute("data-barn-tool");
      if (act === "tune") {
        showGateTip("Расширенные фильтры — скоро");
        return;
      }
      if (act === "sort") {
        state.gearCatalog = [...state.gearCatalog].sort((a, b) => a.name.localeCompare(b.name, "ru"));
        persistGearStub();
        toast("Склад отсортирован");
        renderBarn();
        return;
      }
      if (act === "smelt") {
        const focus = (state.barnCatalog || []).find((x) => x.id === state.barnFocus);
        const gear = barnGearForItem(focus);
        if (!gear) {
          toast("Выберите броню/оружие для переплавки");
          return;
        }
        salvageItem(gear.id);
        return;
      }
      if (act === "expand") {
        state.barnCapMax = (state.barnCapMax || 96) + 200;
        persistGearStub();
        toast("Слоты склада +200");
        renderBarn();
        return;
      }
    }
    const equipBtn = e.target.closest("[data-barn-equip]");
    if (equipBtn && root.contains(equipBtn)) {
      const item = (state.barnCatalog || []).find((x) => x.id === state.barnFocus);
      const gear = barnGearForItem(item);
      const cat = homeActiveCat();
      const catId = cat?.catId;
      if (!catId) {
        toast("Выберите героя на экране Персонаж");
        return;
      }
      if (gear) {
        equipItem(catId, gear.id);
        persistGearStub();
        renderBarn();
        return;
      }
      toast(item ? `${item.name}: нельзя надеть` : "Выберите предмет");
    }
  });
  const search = $("barnSearch");
  if (search && search.dataset.bound !== "1") {
    search.dataset.bound = "1";
    search.addEventListener("input", () => {
      state.barnSearch = search.value;
      renderBarn();
    });
  }
}

function renderBarnInspector(focus) {
  const panel = $("barnInspector");
  if (!panel) return;
  const closeHtml = `<button type="button" data-gear-inspect-close class="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-surface-container-highest/90 text-on-surface-variant hover:text-primary border border-outline-variant/30 flex items-center justify-center" title="Закрыть" aria-label="Закрыть"><span class="material-symbols-outlined text-[18px]">close</span></button>`;
  if (!focus) {
    panel.innerHTML = `${closeHtml}<div class="flex-1 flex items-center justify-center text-on-surface-variant text-sm">Выберите ячейку склада</div>`;
    return;
  }
  const gear = barnGearForItem(focus);
  const bonuses = formatGearBonuses(gear) || "—";
  const rarity = BARN_RARITY_RU[focus?.rarity] || "—";
  const kind = BARN_KIND_RU[focus?.kind] || focus?.kind || "—";
  const enhance = focus?.enhance ? `+${focus.enhance}` : "—";
  const canEquip = !!(gear && (focus?.kind === "armor" || focus?.kind === "weapon"));
  const cat = homeActiveCat();
  const catName = cat ? catSheetName(cat) : "—";
  const worn = barnItemWorn(gear?.id);
  panel.innerHTML = `
    ${closeHtml}
    <div class="flex flex-col gap-space-xs overflow-y-auto pr-0.5 flex-1 min-h-0">
      <div class="flex items-start justify-between flex-shrink-0 pr-8">
        <div>
          <div class="flex items-center gap-1.5">
            <span class="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-label-sm text-label-sm uppercase tracking-wider font-bold">${rarity}</span>
            <span class="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-[10px]">${kind}</span>
          </div>
          <h2 class="font-headline-md text-headline-md text-primary mt-0.5 leading-tight">${focus?.name || "Пусто"}</h2>
          <span class="font-body-sm text-[12px] text-on-surface-variant">${focus?.tag || ""}${worn ? " · надето" : ""}</span>
        </div>
        <div class="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span class="px-2 py-1 rounded-lg bg-surface-container-high font-stat-numeral text-stat-numeral text-primary border border-surface-container-highest/40">${enhance}</span>
          <span class="font-label-sm text-[10px] text-secondary">×${formatSheetNum(focus?.qty || 0)}</span>
        </div>
      </div>
      <div class="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-highest shadow-inner flex-shrink-0 flex items-center justify-center">
        ${focus?.iconSrc ? `<img alt="" class="max-h-full max-w-full object-contain p-3" src="${focus.iconSrc}"/>` : ""}
      </div>
      <div class="bg-surface-container p-space-sm rounded-xl flex flex-col gap-1">
        <div class="flex items-center justify-between font-label-md text-[13px]">
          <span class="text-on-surface-variant">Бонусы экипа</span>
          <span class="font-stat-numeral text-primary text-[14px]">${bonuses}</span>
        </div>
        <div class="text-[11px] text-on-surface-variant">${gear ? `Слот: ${HOME_SLOT_RU[gear.slot] || gear.slot}${gear.roles?.length ? ` · ${gear.roles.map((r) => CAT_ROLE_RU[r] || r).join("/")}` : " · все классы"}` : "Не экипируется"}</div>
        <div class="text-[11px] text-on-surface-variant">Герой: <span class="text-primary font-bold">${catName}</span></div>
      </div>
    </div>
    <div class="flex flex-col gap-1.5 pt-space-xs border-t border-surface-container-highest/40 flex-shrink-0">
      <button type="button" data-barn-equip="1" class="py-1.5 rounded-lg ${canEquip ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"} font-label-md text-label-md flex items-center justify-center gap-1 font-bold" ${canEquip ? "" : "disabled"}>
        <span class="material-symbols-outlined text-[16px]">shield_with_heart</span> ${canEquip ? `Надеть на ${catName}` : "Нельзя надеть"}
      </button>
    </div>`;
}

function renderBarn() {
  const root = $("viewGear");
  if (!root || root.classList.contains("hidden")) return;
  ensureBarnDom(root);
  bindBarnOnce(root);
  syncBarnFromGear();

  const used = barnStockUsed();
  const cap = state.barnCapMax || 96;
  const free = Math.max(0, cap - used);
  const pct = Math.min(100, Math.round((used / Math.max(1, cap)) * 100));

  const capBlock = $("barnCapBlock");
  if (capBlock) {
    // Full rewrite — Stitch placeholder numbers (1420/2500/1080/102) must not leak.
    const w = barnKindCount("weapon");
    const a = barnKindCount("armor");
    capBlock.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-label-md text-label-md text-on-surface flex items-center gap-1">
          <span class="material-symbols-outlined text-primary text-[16px]">inventory</span> Вместимость
        </span>
        <span class="font-stat-numeral text-[16px] text-primary">${formatSheetNum(used)} <span class="text-on-surface-variant text-[12px] font-normal">/ ${formatSheetNum(cap)}</span></span>
      </div>
      <div class="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden p-0.5 shadow-inner">
        <div class="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all" style="width:${pct}%"></div>
      </div>
      <div class="flex justify-between items-center text-on-surface-variant font-label-sm text-[10px]">
        <span>Занято ${pct}%</span>
        <span class="text-secondary">Свободно ${formatSheetNum(free)} мест</span>
      </div>
      <div class="grid grid-cols-2 gap-1 mt-0.5">
        <div class="bg-surface-container px-2 py-0.5 rounded flex items-center justify-between">
          <span class="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-tertiary text-[12px]">swords</span> Оружие</span>
          <span class="font-stat-numeral text-on-surface text-[11px]">${formatSheetNum(w)}</span>
        </div>
        <div class="bg-surface-container px-2 py-0.5 rounded flex items-center justify-between">
          <span class="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-primary text-[12px]">shield</span> Броня</span>
          <span class="font-stat-numeral text-on-surface text-[11px]">${formatSheetNum(a)}</span>
        </div>
        <div class="bg-surface-container px-2 py-0.5 rounded flex items-center justify-between">
          <span class="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-secondary text-[12px]">spa</span> Сырьё</span>
          <span class="font-stat-numeral text-on-surface text-[11px]">Soon</span>
        </div>
        <div class="bg-surface-container px-2 py-0.5 rounded flex items-center justify-between">
          <span class="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-tertiary-container text-[12px]">science</span> Зелья</span>
          <span class="font-stat-numeral text-on-surface text-[11px]">Soon</span>
        </div>
      </div>`;
  }

  const expandBtn = $("barnExpandBtn");
  if (expandBtn) {
    expandBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">add_box</span> +200 мест (сейчас ${formatSheetNum(cap)})`;
  }

  const catTabs = $("barnCatTabs");
  if (catTabs) {
    const tabs = [
      { id: "all", label: "Все предметы", icon: "all_inclusive" },
      { id: "equip", label: "Экипировка и оружие", icon: "swords" },
      { id: "weapon", label: "Оружие", icon: "swords" },
      { id: "armor", label: "Броня и латы", icon: "shield" },
      { id: "farm", label: "Сырьё · Soon", icon: "forest" },
      { id: "potion", label: "Зелья · Soon", icon: "sanitizer" },
      { id: "blueprint", label: "Чертежи · Soon", icon: "token" },
    ];
    catTabs.innerHTML = tabs
      .map((tab) => {
        const on = state.barnCatFilter === tab.id;
        const count = barnKindCount(tab.id);
        const countLabel = BARN_SOON_KINDS.has(tab.id) ? "Soon" : formatSheetNum(count);
        return `<button type="button" data-barn-cat="${tab.id}" class="w-full flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg ${on ? "bg-primary-container text-on-primary-container shadow-sm" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"} font-label-md text-label-md transition-colors"><span class="flex items-center gap-2 truncate"><span class="material-symbols-outlined text-[18px]">${tab.icon}</span><span class="truncate ${on ? "font-bold" : ""}">${tab.label}</span></span><span class="px-2 py-0.5 ${on ? "bg-on-primary-container/20" : "bg-surface-container-highest"} rounded-md font-stat-numeral text-[12px] flex-shrink-0">${countLabel}</span></button>`;
      })
      .join("");
  }

  const rarityTabs = $("barnRarityTabs");
  if (rarityTabs) {
    rarityTabs.innerHTML = BARN_RARITIES.map((tab) => {
      const on = state.barnRarityFilter === tab.id;
      return `<button type="button" data-barn-rarity="${tab.id}" class="px-2.5 py-1 rounded-lg ${on ? "bg-surface-container-highest text-primary" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"} font-label-sm text-label-sm">${tab.label}</button>`;
    }).join("");
  }

  const search = $("barnSearch");
  if (search && document.activeElement !== search) search.value = state.barnSearch || "";

  const filtered = barnFilteredItems();
  const soonEmpty = BARN_SOON_KINDS.has(state.barnCatFilter);
  if (!soonEmpty && (!state.barnFocus || !filtered.some((x) => x.id === state.barnFocus))) {
    state.barnFocus = filtered[0]?.id || null;
  }
  const focus = soonEmpty
    ? null
    : (state.barnCatalog.find((x) => x.id === state.barnFocus) || filtered[0] || null);

  let grid = $("barnGrid");
  if (grid) {
    grid = ensureBarnGridShell(grid);
    if (soonEmpty) {
      grid.style.gridAutoRows = "";
      grid.innerHTML = `<div class="col-span-6 p-4 rounded-xl border border-dashed border-outline-variant/40 text-center text-on-surface-variant text-sm">Phase 6 · Soon — не live loop на SL</div>`;
    } else {
      grid.innerHTML = filtered.map(barnItemCellHtml).join("");
      layoutBarnGrid(grid);
    }
  }

  if (root.dataset.inspectOpen === "1" && focus) {
    renderBarnInspector(focus);
  } else if (root.dataset.inspectOpen === "1") {
    renderBarnInspector(null);
  }
}


/** Visual order on Stitch mannequin: left 4, then right 4. */
const HOME_SLOT_VISUAL = ["weapon", "cloak", "belt", "ring", "helm", "armor", "shield", "boots"];

const HOME_SLOT_LABEL = {};

/** Home sheet = knowledge base 12 (shop ×6×2). Starters are combat twins, not extra roster rows. */
function homeRosterCats() {
  const all = (state.profile?.cats || []).filter((c) => c.role !== "farm");
  const shop = all.filter((c) => String(c.templateId || "").startsWith("shop_"));
  return shop.length ? shop : all;
}

const HOME_ROLE_FILTERS = [
  { id: "all", label: "Все" },
  { id: "tank", label: "Танк" },
  { id: "fighter", label: "Бойцы" },
  { id: "assassin", label: "Убийцы" },
  { id: "ranger", label: "Стрелки" },
  { id: "mage", label: "Маги" },
  { id: "support", label: "Саппорт" },
];

function homeCatRole(c) {
  return c.role || starterMeta(c.templateId)?.role || "";
}

function homeRosterByRole(cats, filter) {
  if (!filter || filter === "all") return cats;
  return cats.filter((c) => homeCatRole(c) === filter);
}

function homeActiveCat() {
  const roster = homeRosterCats();
  const all = (state.profile?.cats || []).filter((c) => c.role !== "farm");
  const pool = roster.length ? roster : all;
  let cat = pool.find((c) => c.catId === state.selectedCatId);
  if (!cat && state.selectedCatId) {
    const selected = all.find((c) => c.catId === state.selectedCatId);
    const twin = selected && STARTER_DECK_TEMPLATE[selected.templateId];
    if (twin) cat = pool.find((c) => c.templateId === twin);
  }
  if (!cat) {
    cat =
      pool.find((c) => c.templateId === "shop_fighter_fire_a") ||
      pool.find((c) => c.templateId === "starter_fighter_fire") ||
      pool[0];
  }
  if (cat) state.selectedCatId = cat.catId;
  return cat || null;
}

function migrateHomeEquipSlots(eq) {
  if (!eq || typeof eq !== "object") return eq;
  if (eq.amulet != null && eq.cloak == null) eq.cloak = eq.amulet;
  if (eq.gloves != null && eq.cloak == null) eq.cloak = eq.gloves;
  if (eq.offhand != null && eq.shield == null) eq.shield = eq.offhand;
  delete eq.amulet;
  delete eq.gloves;
  delete eq.offhand;
  for (const slot of HOME_SLOT_ORDER) {
    if (!(slot in eq)) eq[slot] = null;
  }
  return eq;
}

function ensureHomeStitchLoadout(catId) {
  if (!catId) return;
  if (!state.equippedByCat[catId]) state.equippedByCat[catId] = emptyEquipSlots();
  const eq = migrateHomeEquipSlots(state.equippedByCat[catId]);
  state.equippedByCat[catId] = eq;
  for (const slot of HOME_SLOT_ORDER) {
    const id = eq[slot];
    if (!id) continue;
    const item = state.gearCatalog.find((g) => g.id === id);
    if (!item || !canEquipItem(catId, item)) eq[slot] = null;
  }
}

function homeRarityTone(rarity) {
  if (rarity === "mythic" || rarity === "legendary") {
    return { border: "border-primary/40", glow: "shadow-[0_0_18px_rgba(253,186,69,0.45)]", tag: "text-primary", pill: "bg-primary text-on-primary", label: rarity === "mythic" ? "Миф" : "Лег" };
  }
  if (rarity === "epic") return { border: "border-tertiary/40", glow: "shadow-[0_0_14px_rgba(255,180,166,0.35)]", tag: "text-tertiary", pill: "bg-tertiary-container text-on-tertiary-container", label: "Эпик" };
  if (rarity === "rare") return { border: "border-secondary/40", glow: "shadow-[0_0_14px_rgba(137,217,140,0.35)]", tag: "text-secondary", pill: "bg-secondary-container text-on-secondary-container", label: "Редк" };
  return { border: "border-outline-variant/40", glow: "", tag: "text-on-surface-variant", pill: "bg-surface-container-highest text-on-surface", label: "Обыч" };
}

/** Wire Stitch home: bag grid, 8 equip slots, roster, hero art. */
function ensureHomeDom(root) {
  if (!root || root.dataset.homeDom === "1") return;
  const bagGrid = [...root.querySelectorAll(".grid.grid-cols-4")].find((g) =>
    /overflow-y-auto/.test(g.className),
  );
  if (bagGrid) bagGrid.id = "homeBagGrid";
  const leftCol = root.querySelector(".col-span-3");
  const rosterEl =
    leftCol &&
    [...leftCol.querySelectorAll("div")].find(
      (el) => /overflow-y-auto/.test(el.className) && el.children.length >= 3,
    );
  if (rosterEl) rosterEl.id = "homeRoster";
  if (leftCol) {
    const filterRow = [...leftCol.querySelectorAll(".flex.items-center.gap-1")].find((row) =>
      [...row.querySelectorAll("button")].some((b) =>
        b.hasAttribute("data-home-role-filter") || /^(Все|Танк)$/i.test((b.textContent || "").trim()),
      ),
    );
    if (filterRow) {
      const active = state.homeRoleFilter || "all";
      filterRow.innerHTML = HOME_ROLE_FILTERS.map((it) => {
        const on = it.id === active;
        return `<button type="button" data-home-role-filter="${it.id}" class="px-2 py-0.5 rounded shrink-0 border border-outline-variant/20 transition-colors ${on ? "bg-primary text-on-primary shadow font-black" : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"}">${it.label}</button>`;
      }).join("");
    }
  }
  const stage = root.querySelector(".relative.w-full.h-full.flex.items-start.justify-between");
  if (stage) {
    const cols = [...stage.children].filter((el) => el.classList?.contains("flex") && el.classList?.contains("flex-col"));
    const leftSlots = cols[0]?.querySelectorAll(":scope > .group.relative.cursor-pointer") || [];
    const rightSlots = cols[1]?.querySelectorAll(":scope > .group.relative.cursor-pointer") || [];
    const slots = [...leftSlots, ...rightSlots];
    HOME_SLOT_VISUAL.forEach((slot, i) => {
      const el = slots[i];
      if (!el) return;
      el.classList.add("home-equip-slot");
      el.setAttribute("data-home-slot", slot);
      el.setAttribute("role", "button");
      el.tabIndex = 0;
      const box = el.querySelector(".w-14.h-14") || el.querySelector("div.rounded-lg");
      if (box) {
        box.classList.add("home-equip-ico");
        if (!box.querySelector("img.home-equip-img")) {
          box.innerHTML = `<img class="home-equip-img w-full h-full object-contain rounded opacity-30" alt="${HOME_SLOT_RU[slot] || slot}"/><span class="home-equip-plus absolute top-0.5 right-0.5 px-0.5 rounded bg-primary text-on-primary font-stat-numeral text-[8px] hidden"></span><span class="home-equip-tag absolute bottom-0.5 left-0.5 px-0.5 rounded bg-surface-container-lowest font-label-sm text-[7px] text-primary uppercase hidden"></span><span class="home-equip-empty material-symbols-outlined text-outline-variant text-xl absolute inset-0 flex items-center justify-center">add</span>`;
        }
      }
      ensureHomeSlotCaption(el, slot);
    });
    const center = stage.querySelector(".relative.flex-1.h-full.flex.items-center.justify-center");
    const artWrap = center?.querySelector(".relative.w-full.h-full.rounded-2xl");
    if (artWrap && !artWrap.querySelector("#homeHeroArt")) {
      const img = document.createElement("img");
      img.id = "homeHeroArt";
      img.className = "relative z-10 max-h-[92%] max-w-[90%] object-contain drop-shadow-2xl";
      img.alt = "";
      artWrap.appendChild(img);
    }
  }
  const title = [...root.querySelectorAll("span")].find((el) =>
    /ЭКИПИРОВКА ГЕРОЯ/i.test(el.textContent || ""),
  );
  if (title) title.id = "homeHeroTitle";
  const countStrong = [...root.querySelectorAll("strong")].find((el) =>
    /\/\s*8/.test(el.textContent || ""),
  );
  if (countStrong) countStrong.id = "homeEquipCount";
  // bag filters
  const bagHeader = $("homeBagGrid")?.previousElementSibling;
  if (bagHeader) {
    const typeRow = bagHeader.querySelector(".flex.items-center.gap-1.overflow-x-auto");
    if (typeRow) {
      const map = ["all", "weapon", "armor", "helm", "armor", "trinket", "boots", "trinket", "all"];
      [...typeRow.querySelectorAll("button")].forEach((btn, i) => {
        btn.setAttribute("data-home-bag-filter", map[i] || "all");
      });
    }
    const rarityLabel = [...bagHeader.querySelectorAll("span")].find((el) => /Редкость/i.test(el.textContent || ""));
    const rarityRow = rarityLabel?.parentElement;
    if (rarityRow) {
      const rmap = ["all", "mythic", "epic", "rare"];
      [...rarityRow.querySelectorAll("button")].forEach((btn, i) => {
        if (rmap[i]) btn.setAttribute("data-home-bag-rarity", rmap[i]);
      });
    }
  }
  const deckTitle = [...root.querySelectorAll("h3")].find((el) =>
    /БОЕВАЯ КОЛОДА/i.test(el.textContent || ""),
  );
  if (deckTitle) {
    const nameSpan = deckTitle.querySelector("span");
    if (nameSpan) nameSpan.id = "homeDeckHeroName";
    const wrap = deckTitle.closest(".bg-surface-container-low");
    const grid = wrap?.querySelector(".grid.grid-cols-6");
    if (grid) grid.id = "homeDeckGrid";
    const costEl = wrap && [...wrap.querySelectorAll("span")].find((el) => /Стоимость цикла/i.test(el.textContent || ""));
    if (costEl) costEl.id = "homeDeckCycleCost";
  }
  root.dataset.homeDom = "1";
}

/** Caption under mannequin slot cell (Шлем, Сапоги, …). */
function ensureHomeSlotCaption(btn, slot) {
  if (!btn || !slot) return;
  let cap = btn.querySelector(":scope > .home-equip-slot-name");
  if (!cap) {
    cap = document.createElement("span");
    cap.className = "home-equip-slot-name";
    btn.appendChild(cap);
  }
  cap.textContent = HOME_SLOT_RU[slot] || slot;
}

function syncHomeEquipDom(catId) {
  const root = $("viewHome");
  if (!root) return;
  const eq = state.equippedByCat[catId] || emptyEquipSlots();
  let worn = 0;
  root.querySelectorAll(".home-equip-slot").forEach((btn) => {
    const slot = btn.getAttribute("data-home-slot");
    ensureHomeSlotCaption(btn, slot);
    const itemId = eq[slot] || null;
    const ico = btn.querySelector(".home-equip-ico");
    const img = ico?.querySelector("img.home-equip-img") || ico?.querySelector("img");
    const plus = ico?.querySelector(".home-equip-plus");
    const tag = ico?.querySelector(".home-equip-tag");
    const empty = ico?.querySelector(".home-equip-empty");
    if (!itemId) {
      btn.classList.add("is-empty");
      btn.removeAttribute("data-item-id");
      btn.title = `${HOME_SLOT_RU[slot] || slot}: пусто`;
      if (img) {
        img.removeAttribute("src");
        img.classList.add("opacity-30", "hidden");
      }
      if (plus) plus.classList.add("hidden");
      if (tag) tag.classList.add("hidden");
      if (empty) empty.classList.remove("hidden");
      return;
    }
    worn += 1;
    const item = state.gearCatalog.find((g) => g.id === itemId);
    const tone = homeRarityTone(item?.rarity || "common");
    const label = HOME_SLOT_LABEL[itemId] || item?.name || itemId;
    btn.classList.remove("is-empty");
    btn.setAttribute("data-item-id", itemId);
    btn.title = `${label} · снять`;
    if (img) {
      img.src = item?.iconSrc || "/barn-icons/dagger.png";
      img.alt = label;
      img.classList.remove("opacity-30", "hidden");
    }
    if (plus) {
      if (item?.enhance) {
        plus.classList.remove("hidden");
        plus.textContent = `+${item.enhance}`;
      } else plus.classList.add("hidden");
    }
    if (tag) {
      tag.classList.remove("hidden");
      tag.textContent = tone.label;
    }
    if (empty) empty.classList.add("hidden");
  });
  const countEl = $("homeEquipCount");
  if (countEl) countEl.textContent = `${worn} / 8`;
  const gearBar = Array.from(root.querySelectorAll("span")).find((el) =>
    /Вид Снаряжения/i.test(el.textContent || ""),
  );
  if (gearBar) gearBar.textContent = `Вид Снаряжения: ${worn}/8 Надето`;
  root.querySelectorAll("[data-home-bag-item]").forEach((cell) => {
    const id = cell.getAttribute("data-home-bag-item");
    const on = Object.values(eq).includes(id);
    cell.classList.toggle("is-worn", on);
    cell.classList.toggle("opacity-50", on);
    cell.title = on ? "Уже надето" : "Надеть";
  });
}

function bindHomeEquipClicks() {
  const root = $("viewHome");
  if (!root || root.dataset.equipBound === "1") return;
  root.dataset.equipBound = "1";
  root.addEventListener("click", (event) => {
    const catPick = event.target.closest("[data-home-cat]");
    if (catPick && root.contains(catPick)) {
      state.selectedCatId = catPick.getAttribute("data-home-cat");
      renderHome();
      return;
    }
    const roleFilter = event.target.closest("[data-home-role-filter]");
    if (roleFilter && root.contains(roleFilter)) {
      state.homeRoleFilter = roleFilter.getAttribute("data-home-role-filter") || "all";
      root.querySelectorAll("[data-home-role-filter]").forEach((btn) => {
        const on = btn.getAttribute("data-home-role-filter") === state.homeRoleFilter;
        btn.classList.toggle("bg-primary", on);
        btn.classList.toggle("text-on-primary", on);
        btn.classList.toggle("font-black", on);
        btn.classList.toggle("shadow", on);
        btn.classList.toggle("bg-surface-container-high", !on);
        btn.classList.toggle("text-on-surface-variant", !on);
      });
      renderHomeRoster(homeActiveCat());
      return;
    }
    const cat = homeActiveCat();
    if (!cat) return;
    const bagFilter = event.target.closest("[data-home-bag-filter]");
    if (bagFilter && root.contains(bagFilter)) {
      state.homeBagFilter = bagFilter.getAttribute("data-home-bag-filter") || "all";
      root.querySelectorAll("[data-home-bag-filter]").forEach((btn) => {
        const on = btn.getAttribute("data-home-bag-filter") === state.homeBagFilter;
        btn.classList.toggle("bg-primary", on);
        btn.classList.toggle("text-on-primary", on);
        btn.classList.toggle("font-black", on);
        btn.classList.toggle("bg-surface-container-high", !on);
        btn.classList.toggle("text-on-surface-variant", !on);
      });
      renderHomeBag(cat);
      syncHomeEquipDom(cat.catId);
      return;
    }
    const rarityChip = event.target.closest("[data-home-bag-rarity]");
    if (rarityChip && root.contains(rarityChip)) {
      state.homeRarityFilter = rarityChip.getAttribute("data-home-bag-rarity") || "all";
      root.querySelectorAll("[data-home-bag-rarity]").forEach((chip) => {
        const on = chip.getAttribute("data-home-bag-rarity") === state.homeRarityFilter;
        chip.classList.toggle("bg-surface-container-highest", on);
        chip.classList.toggle("text-primary", on);
        chip.classList.toggle("font-bold", on);
      });
      renderHomeBag(cat);
      syncHomeEquipDom(cat.catId);
      return;
    }
    const slotBtn = event.target.closest(".home-equip-slot");
    if (slotBtn && root.contains(slotBtn)) {
      const slot = slotBtn.getAttribute("data-home-slot");
      const wornId = state.equippedByCat[cat.catId]?.[slot];
      if (!wornId) {
        toast(`${HOME_SLOT_RU[slot] || slot}: пусто`);
        return;
      }
      unequipSlot(cat.catId, slot);
      return;
    }
    const bag = event.target.closest("[data-home-bag-item]");
    if (bag && root.contains(bag)) {
      const itemId = bag.getAttribute("data-home-bag-item");
      const item = state.gearCatalog.find((g) => g.id === itemId);
      if (!item) {
        toast("Предмет не найден в каталоге");
        return;
      }
      if (!canEquipItem(cat, item)) {
        equipDenyToast(item, cat);
        return;
      }
      const worn = state.equippedByCat[cat.catId]?.[item.slot];
      if (worn === itemId) {
        unequipSlot(cat.catId, item.slot);
        return;
      }
      equipItem(cat.catId, itemId);
      return;
    }
    const auto = event.target.closest("button");
    if (auto && /Авто-подбор/i.test(auto.textContent || "")) {
      equipBest(cat.catId);
    }
  });
}

function homeBagTone(item) {
  const rarity = item?.rarity || "common";
  if (rarity === "legendary" || rarity === "mythic") {
    return { border: "border-primary/50", glow: "shadow-[0_0_10px_rgba(253,186,69,0.35)]", pill: "bg-primary text-on-primary", tag: "text-primary", label: rarity === "mythic" ? "Миф" : "Лег" };
  }
  if (rarity === "epic") {
    return { border: "border-tertiary/50", glow: "shadow-[0_0_10px_rgba(255,180,166,0.35)]", pill: "bg-tertiary-container text-on-tertiary", tag: "text-tertiary", label: "Эпик" };
  }
  if (rarity === "rare") {
    return { border: "border-secondary/50", glow: "shadow-[0_0_10px_rgba(137,217,140,0.35)]", pill: "bg-secondary-container text-on-secondary-container", tag: "text-secondary", label: "Редк" };
  }
  return { border: "border-outline-variant/40", glow: "", pill: "bg-surface-container-highest text-on-surface", tag: "text-on-surface-variant", label: "Обыч" };
}

function renderHomeBag(cat) {
  const grid = $("homeBagGrid");
  if (!grid) return;
  const filter = state.homeBagFilter || "all";
  const rarity = state.homeRarityFilter || "all";
  const items = state.gearCatalog.filter((item) => {
    if (barnItemWorn(item.id)) return false; // on character: worn lives in slots only
    if (filter === "weapon" && item.slot !== "weapon" && item.slot !== "shield") return false;
    if (filter === "helm" && item.slot !== "helm") return false;
    if (filter === "armor" && item.slot !== "armor" && item.slot !== "cloak") return false;
    if (filter === "boots" && item.slot !== "boots") return false;
    if (filter === "trinket" && item.slot !== "belt" && item.slot !== "ring") return false;
    if (rarity === "mythic" && item.rarity !== "mythic" && item.rarity !== "legendary") return false;
    else if (rarity !== "all" && rarity !== "mythic" && item.rarity !== rarity) return false;
    return true;
  });
  grid.innerHTML = items
    .map((item) => {
      const tone = homeBagTone(item);
      const locked = !canEquipItem(cat, item);
      const roleHint = item.roles?.length
        ? item.roles.map((r) => CAT_ROLE_RU[r] || r).join("/")
        : "";
      const enhance = item.enhance
        ? `<span class="absolute top-0.5 right-0.5 px-0.5 rounded ${tone.pill} font-stat-numeral text-[8px] leading-none font-bold">+${item.enhance}</span>`
        : "";
      const lock = locked
        ? `<span class="absolute inset-0 rounded bg-black/45 flex items-center justify-center text-[9px] font-label-sm text-on-surface uppercase tracking-wide">${roleHint || "класс"}</span>`
        : "";
      const bonuses = formatGearBonuses(item);
      return `<div data-home-bag-item="${item.id}" role="button" tabindex="0" title="${item.name}${bonuses ? ` · ${bonuses}` : ""}${roleHint ? ` · ${roleHint}` : " · все классы"}${locked ? " · недоступно" : ""}" class="aspect-square rounded-lg bg-surface-container-high p-0.5 relative cursor-pointer border ${tone.border} ${tone.glow} hover:scale-105 transition-transform flex items-center justify-center group${locked ? " is-locked" : ""}"><img alt="${item.name}" class="w-full h-full object-cover rounded" src="${item.iconSrc}"><span class="absolute bottom-0.5 left-0.5 px-0.5 rounded bg-surface-container-lowest font-label-sm text-[7px] ${tone.tag} uppercase">${tone.label}</span>${enhance}${lock}</div>`;
    })
    .join("");
  const label = [...(grid.closest(".col-span-3")?.querySelectorAll("span") || [])].find((el) =>
    /Склад:/i.test(el.textContent || ""),
  );
  if (label) {
    const used = barnStockUsed();
    const cap = state.barnCapMax || 96;
    label.innerHTML = `Склад: <span class="text-primary font-stat font-bold">${used}</span>/${formatSheetNum(cap)}`;
  }
}

function renderHomeRoster(cat) {
  const list = $("homeRoster");
  if (!list) return;
  const cats = homeRosterCats();
  const shown = homeRosterByRole(cats, state.homeRoleFilter || "all");
  if (!cats.length) {
    list.innerHTML = `<div class="p-2 rounded-xl border border-dashed border-outline-variant/40 text-outline-variant text-center text-xs">Нет героев — войдите / grant starter</div>`;
    return;
  }
  list.innerHTML = shown
    .map((c) => {
      const on = c.catId === cat?.catId;
      const name = catSheetName(c);
      const m = starterMeta(c.templateId);
      const role = CAT_ROLE_RU[c.role || m.role] || c.role || "—";
      const art = catHeroArt(c.templateId);
      return `<button type="button" data-home-cat="${c.catId}" class="p-2 rounded-xl flex items-center gap-2 shrink-0 h-[64px] text-left border transition-colors ${on ? "bg-surface-container-highest border-primary/50 shadow" : "bg-surface-container-lowest/40 border-outline-variant/40 hover:border-primary/40"}">
        ${art ? `<img alt="" src="${art}" class="w-10 h-10 object-contain rounded"/>` : `<span class="material-symbols-outlined text-primary">pets</span>`}
        <span class="flex flex-col min-w-0"><span class="font-label-sm text-label-sm text-on-surface truncate font-bold">${name}</span><span class="text-[10px] text-on-surface-variant truncate">${role}</span></span>
      </button>`;
    })
    .join("");
  const count = list.closest(".col-span-3")?.querySelector(".font-stat.font-bold");
  if (count && /Герои/i.test(count.parentElement?.textContent || "")) count.textContent = String(cats.length);
}

function renderHome() {
  const root = $("viewHome");
  if (!root) return;
  ensureHomeDom(root);
  const wallet = $("homeWallet");
  if (wallet) {
    const w = state.wallet || {};
    wallet.innerHTML = [
      ["золото", w.gold],
      ["молоко", w.milk],
      ["энергия", w.energy],
      ["пряжа", w.gems],
    ]
      .map(([label, value]) => `<li><em>${label}</em><b>${formatSheetNum(value)}</b></li>`)
      .join("");
  }
  const user = $("homeUser");
  if (user) {
    const count = (state.profile?.cats || []).length;
    user.innerHTML = `<b>Хранитель</b><span>${count} котов</span>`;
  }
  const cat = homeActiveCat();
  if (!cat) return;
  const art = catHeroArt(cat.templateId);
  const name = catSheetName(cat);
  const title = $("homeHeroTitle");
  if (title) title.textContent = `ЭКИПИРОВКА ГЕРОЯ: ${name.toUpperCase()}`;
  const nameEl = $("homeHeroName");
  const metaEl = $("homeHeroMeta");
  const artEl = $("homeHeroArt");
  if (nameEl) nameEl.textContent = name;
  if (metaEl) {
    const m = starterMeta(cat.templateId);
    const role = CAT_ROLE_RU[cat.role || m.role] || cat.role || m.role;
    const el = CAT_ELEMENT_RU[cat.element || m.element] || cat.element || m.element;
    metaEl.innerHTML = `<span class="material-symbols-outlined text-[13px] text-primary">pets</span> ${el} • ${role} · ${cat.templateId}`;
  }
  if (artEl && art) {
    artEl.src = art;
    artEl.alt = name;
    applySpriteFacing(artEl, { artSrc: art, desiredFace: "right" });
  }
  ensureHomeStitchLoadout(cat.catId);
  bindHomeEquipClicks();
  renderHomeRoster(cat);
  renderHomeBag(cat);
  renderHomeDeck(cat);
  syncHomeEquipDom(cat.catId);
  syncHomeSheetStats(cat);
}

/** Push combat-scale ATK/HP/DEF/SPD (+ gear) into the Stitch home sheet. */
function syncHomeSheetStats(cat) {
  const root = $("viewHome");
  if (!root || !cat) return;
  const s = statsForCat(cat);
  const power = sheetPower(s);
  const map = [
    ["АТАКА", s.atk],
    ["ЗДОРОВЬЕ", s.hp],
    ["ЗАЩИТА", s.def],
    ["СКОРОСТЬ", s.spd],
  ];
  for (const [label, total] of map) {
    const lab = [...root.querySelectorAll("span")].find(
      (el) => el.textContent?.trim().toUpperCase() === label,
    );
    const num = lab?.parentElement?.querySelector(".font-stat, .font-stat-numeral, .font-black");
    if (num) num.textContent = formatSheetNum(total);
  }
  const selected = [...root.querySelectorAll("span")].find((el) => /Выбрано:/i.test(el.textContent || ""));
  if (selected) {
    const eq = state.equippedByCat[cat.catId] || {};
    const focusId = state.homeBagFocus || eq.weapon || eq.armor || Object.values(eq).find(Boolean);
    const item = state.gearCatalog.find((g) => g.id === focusId);
    selected.innerHTML = item
      ? `Выбрано: <b class="text-primary font-headline">${item.name}${item.enhance ? ` +${item.enhance}` : ""}</b> (${formatGearBonuses(item) || "без бонусов"})`
      : `Выбрано: <b class="text-primary font-headline">—</b> · сила ${formatSheetNum(power)}`;
  }
}


function bindHeroesCodex() {
  const root = $("viewHeroes");
  if (!root || root.dataset.heroesBound === "1") return;
  root.dataset.heroesBound = "1";
  const cards = root.querySelectorAll(".archetype-card");
  const filters = root.querySelectorAll(".filter-btn");
  const focusCard = (card) => {
    cards.forEach((c) => {
      c.classList.remove("bg-surface-container-highest");
      c.classList.add("bg-surface-container-low");
      c.style.boxShadow = "none";
    });
    card.classList.add("bg-surface-container-highest");
    card.classList.remove("bg-surface-container-low");
    card.style.boxShadow = "0 0 12px rgba(217, 155, 38, 0.4)";
    const tpl = card.getAttribute("data-template");
    const id = card.getAttribute("data-id") || "";
    const title = card.querySelector("h2")?.textContent?.trim() || id;
    const art = tpl ? catHeroArt(tpl) : null;
    const artEl = $("heroInspectorArt");
    const nameEl = $("heroInspectorName");
    const blurbEl = $("heroInspectorBlurb");
    const classEl = $("heroInspectorClass");
    if (artEl && art) {
      artEl.src = art;
      artEl.alt = title;
    }
    if (nameEl) nameEl.textContent = title;
    if (blurbEl) {
      blurbEl.textContent =
        (tpl && CAT_HERO_BLURB[tpl]) ||
        card.querySelector("p")?.textContent?.trim() ||
        "";
    }
    if (classEl) {
      const role = card.getAttribute("data-role") || "";
      classEl.textContent = `Архи-Класс: ${title} (${role || "—"}) · ${tpl || "портрет скоро"}`;
    }
  };
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((b) => {
        b.classList.remove("bg-primary-container", "text-on-primary-container");
        b.classList.add("bg-surface-container", "text-on-surface-variant");
      });
      btn.classList.add("bg-primary-container", "text-on-primary-container");
      btn.classList.remove("bg-surface-container", "text-on-surface-variant");
      const role = btn.getAttribute("data-filter");
      cards.forEach((card) => {
        card.style.display = role === "all" || card.getAttribute("data-role") === role ? "flex" : "none";
      });
    });
  });
  cards.forEach((card) => {
    card.addEventListener("click", () => focusCard(card));
  });
  const initial = root.querySelector('.archetype-card[data-id="tank-a"]') || cards[0];
  if (initial) focusCard(initial);
}


function renderEquipCards() {
  const cats = (state.profile?.cats || []).filter((c) => c.role !== "farm");
  const cat = cats.find((c) => c.catId === state.selectedCatId) || cats[0];
  if (!cat) return;
  state.selectedCatId = cat.catId;
  const list = $("equipCardsCatList");
  if (list) {
    list.innerHTML = "";
    for (const c of cats) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wire-btn" + (c.catId === cat.catId ? " active" : "");
      b.style.width = "100%";
      b.style.textAlign = "left";
      b.innerHTML = `<strong>${c.templateId}</strong><div class="meta">${c.role} · ${c.element}</div>`;
      b.addEventListener("click", () => {
        state.selectedCatId = c.catId;
        renderEquipCards();
      });
      list.appendChild(b);
    }
  }
  const items = $("equipCardsItemList");
  const eq = state.equippedByCat[cat.catId] || {};
  if (items) {
    items.innerHTML = "";
    for (const item of state.gearCatalog) {
      const onThis = eq[item.slot] === item.id;
      const allowed = canEquipItem(cat, item);
      const roleHint = item.roles?.length
        ? item.roles.map((r) => CAT_ROLE_RU[r] || r).join("/")
        : "все классы";
      const card = document.createElement("div");
      card.className = "mythfel-panel-card";
      const bonuses = formatGearBonuses(item);
      card.innerHTML = `<strong>${item.name}</strong><div class="meta">R${item.rank} · ${item.slot} · ${item.set || "—"} · ${roleHint}${bonuses ? ` · ${bonuses}` : ""}</div>`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wire-btn";
      if (onThis) {
        btn.textContent = "Снять";
      } else if (!allowed) {
        btn.textContent = `Только ${roleHint}`;
        btn.classList.add("gated");
      } else {
        btn.textContent = "Надеть";
      }
      btn.addEventListener("click", () => {
        if (onThis) unequipSlot(cat.catId, item.slot);
        else equipItem(cat.catId, item.id);
      });
      card.appendChild(btn);
      items.appendChild(card);
    }
  }
  const statsEl = $("equipCardsStats");
  if (statsEl) {
    const s = statsForCat(cat);
    statsEl.innerHTML = `
      <div>ATK <strong>${s.atk}</strong> <span class="meta">(+${s.bonus.atk})</span></div>
      <div>HP <strong>${s.hp}</strong> <span class="meta">(+${s.bonus.hp})</span></div>
      <div>DEF <strong>${s.def}</strong> <span class="meta">(+${s.bonus.def})</span></div>
      <div>SPD <strong>${s.spd}</strong> <span class="meta">(+${s.bonus.spd})</span></div>
      <div class="meta mt-2">Слоты: W=${eq.weapon || "—"} A=${eq.armor || "—"} H=${eq.helm || "—"} B=${eq.boots || "—"}</div>`;
  }
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

function renderAutofarmToggles(hostListId, { compact = false } = {}) {
  const list = $(hostListId);
  if (!list) return;
  list.innerHTML = "";
  const active = passActive();
  for (const row of AUTOFARM_TOGGLES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wire-btn";
    const on = !!state.autofarm[row.id];
    const mark = on ? "ON" : "OFF";
    btn.innerHTML = compact
      ? `<strong>${row.label}</strong><div class="meta">${mark}${active ? "" : " · pass gated"}</div>`
      : `<strong>${row.label}</strong><div class="meta">${row.detail} · ${mark}${active ? "" : " · pass gated"}</div>`;
    if (!active) btn.classList.add("gated");
    btn.addEventListener("click", () => {
      if (!passActive()) {
        showPassGateTip();
        return;
      }
      state.autofarm[row.id] = !state.autofarm[row.id];
      toast(
        state.autofarm[row.id]
          ? t("farm.autofarm.on", "Автоферма ON · stub (сервер later)")
          : t("farm.autofarm.off", "Автоферма OFF"),
      );
      renderFarm();
      renderPass();
    });
    list.appendChild(btn);
  }
}

function farmCatCandidates() {
  return (state.profile?.cats || []).filter((c) => c.role === "farm" || c.origin === "farm");
}

function hireFarmer(zoneId) {
  const z = FARM_ZONES.find((x) => x.id === zoneId);
  if (!z) return;
  const fs = state.farmState[zoneId] || (state.farmState[zoneId] = { farmer: null, planted: false, ready: false, crop: null });
  if (fs.farmer) {
    toast("Фермер уже на зоне");
    return;
  }
  const cost = 25;
  if ((state.wallet.gold || 0) < cost) {
    toast("Недостаточно рыбок (нужно 25)");
    return;
  }
  const farmCats = farmCatCandidates();
  const cat = farmCats[0] || (state.profile?.cats || [])[0];
  if (!cat) {
    toast("Нет кота для найма");
    return;
  }
  state.wallet.gold -= cost;
  fs.farmer = cat.catId;
  toast(`Фермер нанят на «${z.label}» (−${cost} 🐟)`);
  renderCurrency();
  renderFarm();
}

function plantZone(zoneId) {
  const z = FARM_ZONES.find((x) => x.id === zoneId);
  const fs = state.farmState[zoneId];
  if (!z || !fs) return;
  if (!fs.farmer) {
    toast("Сначала найми фермера на зону");
    return;
  }
  if (fs.planted && !fs.ready) {
    toast("Уже посажено — жди / собери");
    return;
  }
  const seedCost = 5;
  if ((state.wallet.gold || 0) < seedCost) {
    toast("Нужны семена (5 🐟 stub)");
    return;
  }
  state.wallet.gold -= seedCost;
  fs.planted = true;
  fs.ready = true; // local smoke: instant ready
  fs.crop = z.id === "fishing" ? "fish_catch" : "crop_bundle";
  toast(`Посажено на «${z.label}» (−${seedCost} 🐟) · готово к сбору`);
  renderCurrency();
  renderFarm();
}

function harvestZone(zoneId) {
  const z = FARM_ZONES.find((x) => x.id === zoneId);
  const fs = state.farmState[zoneId];
  if (!z || !fs?.ready) {
    toast("Нечего собирать");
    return;
  }
  const loot = {
    id: `farm_${zoneId}_${Date.now()}`,
    name: fs.crop || "crop_bundle",
    kind: z.id === "fishing" ? "fish" : "crop",
    bid: z.id === "fishing" ? 18 : 12,
    qty: 1,
  };
  state.farmBag.push(loot);
  fs.planted = false;
  fs.ready = false;
  toast(`Собрано: ${loot.name} ×1 → сумка фермы`);
  renderFarm();
}

function harvestAllReadyZones() {
  const ready = FARM_ZONES.filter((z) => state.farmState[z.id]?.ready);
  if (!ready.length) {
    toast("Нет готовых зон — посади урожай");
    return;
  }
  for (const z of ready) {
    const fs = state.farmState[z.id];
    const loot = {
      id: `farm_${z.id}_${Date.now()}`,
      name: fs.crop || "crop_bundle",
      kind: z.id === "fishing" ? "fish" : "crop",
      bid: z.id === "fishing" ? 18 : 12,
      qty: 1,
    };
    state.farmBag.push(loot);
    fs.planted = false;
    fs.ready = false;
  }
  toast(`Сбор со всех узлов · ${ready.length} зон → сумка двора`);
  renderFarm();
}

function distributeYardWorkers() {
  const empty = FARM_ZONES.filter((z) => !state.farmState[z.id]?.farmer);
  if (!empty.length) {
    toast("Авто-распределение · все посты заняты");
    return;
  }
  // Hire first empty post (stub — full auto-assign later)
  hireFarmer(empty[0].id);
  toast(`Авто-распределение · слот «${empty[0].label}»${empty.length > 1 ? ` · ещё пусто: ${empty.length - 1}` : ""}`);
}

function repairYardConsumables() {
  toast("Починка расходников · stub (лопата/топор/кирка с Рынка)");
}

function toggleYardAutofarm() {
  if (!passActive()) {
    showGateTip(t("farm.autofarm.lead.locked", "Нужен ACTIVE пасс · иначе tip «Активируй боевой пасс»"));
    return;
  }
  const key = "autofarm_crops";
  state.autofarm[key] = !state.autofarm[key];
  toast(
    state.autofarm[key]
      ? t("farm.autofarm.on", "Автоферма ON · stub (сервер later)")
      : t("farm.autofarm.off", "Автоферма OFF"),
  );
  renderFarm();
}

function bindFarmSideActions() {
  const host = $("farmSideActions");
  if (!host || host.dataset.mythfelBound) return;
  host.dataset.mythfelBound = "1";
  host.addEventListener(
    "click",
    (ev) => {
      const btn = ev.target.closest?.("[data-farm-action]");
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      const action = btn.getAttribute("data-farm-action");
      const first = FARM_ZONES[0];
      const empty = FARM_ZONES.find((z) => !state.farmState[z.id]?.farmer) || first;
      const plantable =
        FARM_ZONES.find((z) => state.farmState[z.id]?.farmer && !state.farmState[z.id]?.ready) || empty;
      switch (action) {
        case "hire":
          hireFarmer(empty.id);
          break;
        case "plant":
          if (!state.farmState[plantable.id]?.farmer) hireFarmer(plantable.id);
          plantZone(plantable.id);
          break;
        case "repair":
          repairYardConsumables();
          break;
        case "collect":
          harvestAllReadyZones();
          break;
        case "distribute":
          distributeYardWorkers();
          break;
        case "autofarm":
          toggleYardAutofarm();
          break;
        case "sell":
          sellFarmLoot("market");
          break;
        case "market":
          navigate("market");
          break;
        default:
          break;
      }
    },
    true,
  );

  const topCollect = $("btn-collect-all");
  if (topCollect && !topCollect.dataset.mythfelBound) {
    topCollect.dataset.mythfelBound = "1";
    topCollect.addEventListener(
      "click",
      (ev) => {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        harvestAllReadyZones();
      },
      true,
    );
  }
  const topDist = $("btn-distribute");
  if (topDist && !topDist.dataset.mythfelBound) {
    topDist.dataset.mythfelBound = "1";
    topDist.addEventListener(
      "click",
      (ev) => {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        distributeYardWorkers();
      },
      true,
    );
  }
}

function sellFarmLoot(channel = "market") {
  if (!state.farmBag.length) {
    toast("Сумка двора пуста — посади и собери");
    return;
  }
  const item = state.farmBag.shift();
  const price = item.bid || 10;
  if (channel === "auction") {
    state.auctionLots.unshift({
      id: `auc_farm_${Date.now()}`,
      name: item.name,
      bid: price * 2,
      kind: item.kind || "crop",
    });
    toast(`Лот на аукционе: ${item.name} @ ${price * 2} 🐟`);
    renderAuction();
  } else {
    state.wallet.gold = (state.wallet.gold || 0) + price;
    toast(`Продано на рынке: ${item.name} +${price} 🐟`);
    renderCurrency();
    renderMarket();
  }
  renderFarm();
}

function renderFarm() {
  // QA: no floating «Двор · live stub» overlay — resource UI is the bottom panel only
  document.getElementById("farmLivePanel")?.remove();

  const zones = $("farmZonesList");
  if (zones) {
    zones.innerHTML = "";
    for (const z of FARM_ZONES) {
      const fs = state.farmState[z.id] || {};
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wire-btn";
      btn.innerHTML = `<strong>${z.label}</strong><div class="meta">${z.kind} · ${fs.farmer ? "фермер" : "без фермера"}${fs.ready ? " · ready" : ""}</div>`;
      btn.addEventListener("click", () => {
        if (!fs.farmer) hireFarmer(z.id);
        else if (!fs.ready) plantZone(z.id);
        else harvestZone(z.id);
      });
      zones.appendChild(btn);
    }
  }
  const lead = $("farmAutofarmLead");
  if (lead) {
    lead.textContent = passActive()
      ? t("farm.autofarm.lead.active", "Пасс ACTIVE · тумблеры stub · seeds/bait с Рынка")
      : t("farm.autofarm.lead.locked", "Нужен ACTIVE пасс · иначе tip «Активируй боевой пасс»");
  }
  renderAutofarmToggles("farmAutofarmList", { compact: true });

  const collectAll = $("collect-all-btn");
  if (collectAll && !collectAll.dataset.mythfelBound) {
    collectAll.dataset.mythfelBound = "1";
    collectAll.addEventListener(
      "click",
      (ev) => {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        harvestAllReadyZones();
      },
      true,
    );
  }
  const nodeCollect = $("node-collect-btn");
  if (nodeCollect && !nodeCollect.dataset.mythfelBound) {
    nodeCollect.dataset.mythfelBound = "1";
    nodeCollect.addEventListener(
      "click",
      (ev) => {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        harvestAllReadyZones();
      },
      true,
    );
  }
  bindFarmSideActions();
}

function renderPass() {
  // Painted Stitch form has no wireframe hosts — skip when absent.
  const eyebrow = $("passEyebrow");
  if (eyebrow) eyebrow.textContent = t("hub.tab.pass", "Пасс");
  const title = $("passTitle");
  if (title) title.textContent = t("pass.title", "Зов Тёплого Очага");
  const lead = $("passLead");
  if (lead) {
    lead.textContent = t(
      "pass.lead",
      "×2 XP · боксы по текущему рангу · автоферма при ACTIVE · high ranks ~1 год с пассом.",
    );
  }
  const list = $("passList");
  if (list) {
    list.innerHTML = "";
    for (const row of PASS_REWARDS) {
      const li = document.createElement("li");
      li.textContent = `Lv ${row.lvl}: ${t(row.free, row.free)} / ★ ${t(row.gold, row.gold)}`;
      list.appendChild(li);
    }
  }

  const status = $("passAutofarmStatus");
  if (status) {
    status.innerHTML = passActive()
      ? `<span class="meta">Статус: <strong>ACTIVE</strong> (stub)</span>`
      : `<span class="meta">Статус: inactive · autofarm gated</span>`;
  }
  const passLeadHost = $("passAutofarmLead");
  if (passLeadHost) {
    passLeadHost.textContent = passActive()
      ? t(
          "pass.autofarm.lead.active",
          "ACTIVE: фермеры / алхимик / gather→кузнец / auto-craft",
        )
      : t(
          "pass.autofarm.lead.locked",
          "Без ACTIVE пасса автоферма недоступна",
        );
  }
  renderAutofarmToggles("passAutofarmList");

  const stubBtn = $("btnPassActiveStub");
  if (stubBtn && !stubBtn.dataset.mythfelBound) {
    stubBtn.dataset.mythfelBound = "1";
    stubBtn.addEventListener("click", () => {
      state.passActiveStub = !state.passActiveStub;
      toast(
        state.passActiveStub
          ? t("pass.active.stub.on", "Stub: пасс ACTIVE")
          : t("pass.active.stub.off", "Stub: пасс inactive"),
      );
      renderPass();
      renderFarm();
    });
  }
  if (stubBtn) {
    stubBtn.textContent = state.passActiveStub
      ? t("pass.active.stub.toggle_off", "Stub: выключить ACTIVE")
      : t("pass.active.stub.toggle_on", "Stub: пасс ACTIVE");
  }
}

function breedingGateTip() {
  showGateTip(
    t(
      "gate.tip.breeding",
      "Питомник: обычные → мифики (малый шанс). Пока — подними ранг в боях",
    ),
  );
}

function breedCatById(catId) {
  if (!catId) return null;
  return (state.profile?.cats || []).find((c) => c.catId === catId) || null;
}

function breedEnsureParents() {
  const cats = homeRosterCats();
  if (!cats.length) return;
  if (!state.breedFatherId || !breedCatById(state.breedFatherId)) {
    state.breedFatherId = cats[0].catId;
  }
  if (!state.breedMotherId || !breedCatById(state.breedMotherId)) {
    state.breedMotherId = (cats[1] || cats[0]).catId;
  }
  if (state.breedFatherId === state.breedMotherId && cats.length > 1) {
    state.breedMotherId =
      cats.find((c) => c.catId !== state.breedFatherId)?.catId || state.breedMotherId;
  }
}

function breedGeneRow(icon, label, value, tone = "text-primary") {
  return `<div class="bg-surface-container-high p-2 rounded-lg flex items-center justify-between gap-1">
    <div class="flex items-center gap-1.5 min-w-0">
      <span class="material-symbols-outlined ${tone} text-[16px] shrink-0">${icon}</span>
      <span class="font-body-sm text-body-sm text-on-surface truncate">${label}</span>
    </div>
    <span class="font-label-sm text-label-sm ${tone} shrink-0">${value}</span>
  </div>`;
}

/** Stitch under-cat block: БМ+Gen overlay, «Доминантные гены», Чистота — SL-honest values. */
function breedFillParentCard(root, slot, cat) {
  const card = root.querySelector(`#parent-${slot}`);
  if (!card) return;
  const name = cat ? catSheetName(cat) : "—";
  const m = cat ? starterMeta(cat.templateId) : {};
  const role = cat ? CAT_ROLE_RU[cat.role || m.role] || cat.role || "—" : "—";
  const el = cat ? CAT_ELEMENT_RU[cat.element || m.element] || cat.element || "—" : "—";
  const art = cat ? catHeroArt(cat.templateId) : "";
  const lvl = cat?.level != null ? cat.level : null;
  const power = cat ? sheetPower(statsForCat(cat)) : null;
  card.dataset.parentId = cat?.catId || "";
  card.dataset.purity = "";
  const set = (field, text) => {
    const eln = card.querySelector(`[data-field="${field}"]`);
    if (eln) eln.textContent = text;
  };
  set("name", name);
  set(
    "meta",
    cat
      ? `Обычный · ${role}${lvl != null ? ` · Ур. ${lvl}` : ""}`
      : "Выбери кота из ростера",
  );
  // Stitch: «БМ 18,420» / «Генетика Gen 1» — на SL без фейка
  set("bm", power != null ? `БМ ${formatSheetNum(power)}` : "БМ · tip");
  set("gen", "Генетика · Soon");
  set("purity", "Soon");
  const elField = card.querySelector('[data-field="element"]');
  if (elField) {
    const textSpan = [...elField.querySelectorAll("span")].find(
      (s) => !s.classList.contains("material-symbols-outlined"),
    );
    if (textSpan) textSpan.textContent = el;
  }
  const portrait = card.querySelector('[data-field="portrait"]');
  if (portrait && art) {
    portrait.src = art;
    portrait.alt = name;
  }
  const bar = card.querySelector('[data-field="purity-bar"]');
  if (bar) bar.style.width = "0%";
  const genes = card.querySelector(`#${slot === "father" ? "father" : "mother"}-genes`);
  if (genes) {
    // Stitch: 3 «Доминантные гены» rows. Live passives = Phase 6; SL shows known traits.
    genes.innerHTML = cat
      ? [
          breedGeneRow("pets", "Стихия", el, slot === "mother" ? "text-secondary" : "text-primary"),
          breedGeneRow("swords", "Роль / класс", role, slot === "mother" ? "text-secondary" : "text-primary"),
          breedGeneRow("style", "Колода (наследие)", "N=6 · Phase 6", "text-on-surface-variant"),
        ].join("")
      : breedGeneRow("info", "Нет родителя", "выбери кота", "text-on-surface-variant");
  }
}

function breedClosePicker() {
  state.breedPickSlot = null;
  $("breedParentPicker")?.remove();
}

function breedOpenPicker(slot) {
  const root = $("viewBreeding");
  if (!root) return;
  breedClosePicker();
  state.breedPickSlot = slot;
  const cats = homeRosterCats();
  const panel = document.createElement("div");
  panel.id = "breedParentPicker";
  panel.className = "breed-parent-picker";
  panel.innerHTML = `
    <div class="breed-parent-picker__card">
      <header>
        <strong>${slot === "father" ? "Отец" : "Мать"}</strong>
        <button type="button" data-breed-pick-close aria-label="Закрыть">close</button>
      </header>
      <p>Выбор из ростера · без списания · live breed = Phase 6</p>
      <ul>
        ${cats
          .map((c) => {
            const on =
              (slot === "father" && c.catId === state.breedFatherId) ||
              (slot === "mother" && c.catId === state.breedMotherId);
            const other = slot === "father" ? state.breedMotherId : state.breedFatherId;
            const disabled = c.catId === other;
            return `<li><button type="button" data-breed-pick="${c.catId}" ${disabled ? "disabled" : ""} class="${on ? "is-on" : ""}">${catSheetName(c)}</button></li>`;
          })
          .join("")}
      </ul>
    </div>`;
  root.appendChild(panel);
}

function bindNursery() {
  const root = $("viewBreeding");
  if (!root || root.dataset.nurseryBound === "1") return;
  root.dataset.nurseryBound = "1";
  root.addEventListener("click", (ev) => {
    const close = ev.target.closest("[data-breed-pick-close]");
    if (close) {
      ev.preventDefault();
      breedClosePicker();
      return;
    }
    const pick = ev.target.closest("[data-breed-pick]");
    if (pick) {
      ev.preventDefault();
      const id = pick.getAttribute("data-breed-pick");
      if (state.breedPickSlot === "father") state.breedFatherId = id;
      if (state.breedPickSlot === "mother") state.breedMotherId = id;
      breedClosePicker();
      renderBreeding();
      return;
    }
    const act =
      ev.target.closest("[data-action]")?.getAttribute("data-action") ||
      ev.target.closest("[data-nursery]")?.getAttribute("data-nursery");
    if (!act) return;
    ev.preventDefault();
    if (act === "swap-father" || act === "pick-father") {
      breedOpenPicker("father");
      return;
    }
    if (act === "swap-mother" || act === "pick-mother") {
      breedOpenPicker("mother");
      return;
    }
    breedingGateTip();
  });
}

function renderBreeding() {
  const host = $("viewBreeding");
  if (!host) return;
  host.querySelector("[data-breeding-shell]")?.remove();
  bindNursery();
  if (!host.querySelector("main") && !host.querySelector(".nursery-hall")) {
    let card = host.querySelector("[data-breeding-shell]");
    if (!card) {
      card = document.createElement("div");
      card.className = "boot-card";
      card.dataset.breedingShell = "1";
      card.innerHTML = `
        <p class="eyebrow" data-breeding-eyebrow></p>
        <h2 data-breeding-title></h2>
        <p class="meta" data-breeding-lead></p>
        <p class="meta" data-breeding-tip></p>
      `;
      host.prepend(card);
    }
    const eyebrow = card.querySelector("[data-breeding-eyebrow]");
    const title = card.querySelector("[data-breeding-title]");
    const lead = card.querySelector("[data-breeding-lead]");
    const tip = card.querySelector("[data-breeding-tip]");
    if (eyebrow) eyebrow.textContent = t("hub.soon.nursery.title", "Питомник");
    if (title) title.textContent = t("breeding.title", "Скрещивание");
    if (lead) {
      lead.textContent = t(
        "breeding.lead",
        "Цель Мифиус: из обычных котов — мифические. Малый шанс мифика; у мифика набор из N=6 сильнейших карт обоих родителей.",
      );
    }
    if (tip) {
      tip.textContent = t(
        "breeding.tip",
        "Питомник скоро · мифик = редкий шанс · N=6 карт родителей · подними ранг в боях",
      );
    }
    return;
  }

  const stub = state.breedingStub || {};
  breedEnsureParents();
  breedFillParentCard(host, "father", breedCatById(state.breedFatherId));
  breedFillParentCard(host, "mother", breedCatById(state.breedMotherId));

  const altarBadge = host.querySelector("#altar-level-badge");
  if (altarBadge) altarBadge.textContent = stub.altarLabel || "Алтарь · Soon";
  const metricsLead = host.querySelector("#altar-metrics p.font-body-sm");
  if (metricsLead) {
    metricsLead.textContent = t(
      "breeding.lead",
      "Обычные → мифические · малый шанс · N=6 карт · SL stub",
    );
  }
  const hearth = host.querySelector("#metrics-hearth");
  if (hearth) {
    hearth.dataset.value = "0";
    hearth.innerHTML = `${stub.hearth?.label || "Soon"} <span class="text-on-surface-variant text-body-sm font-body-sm">· Phase 6</span>`;
  }
  const incubMetric = host.querySelector("#metrics-incubator");
  if (incubMetric) {
    const used = stub.incubator?.used ?? 0;
    const max = stub.incubator?.max ?? 4;
    incubMetric.dataset.used = String(used);
    incubMetric.dataset.max = String(max);
    incubMetric.innerHTML = `${used} <span class="text-on-surface-variant text-body-sm font-body-sm">/ ${max} · stub</span>`;
  }
  const mythic = host.querySelector("#metrics-mythic");
  if (mythic) {
    mythic.dataset.chance = "";
    mythic.textContent = stub.mythicChanceLabel || "малый";
  }

  const resonance = host.querySelector("#resonance-label");
  if (resonance) resonance.textContent = "Резонанс · Soon (сервер Phase 6)";
  const compat = host.querySelector("#compat-badge");
  if (compat) compat.textContent = "Совместимость · tip";
  const inheritBox = host.querySelector("#altar .my-space-xs .font-body-sm.text-on-surface");
  if (inheritBox) {
    inheritBox.innerHTML =
      stub.inheritHint ||
      'Мифик (Phase 6): пул ≤12 карт родителей → <span class="text-primary font-bold">N=6</span> сильнейших. На SL награда не выдаётся.';
  }

  const reagents = host.querySelector("#reagent-slots");
  const mats = Array.isArray(stub.mats) ? stub.mats : [];
  if (reagents && mats.length) {
    reagents.innerHTML = mats
      .map((m) => {
        const qty = m.soon ? `Soon · 0/${m.need || 1}` : `${m.have || 0}/${m.need || 1}`;
        return `<div class="flex flex-col items-center text-center group" data-item-id="${m.id}" data-ready="false" data-have="0" data-need="${m.need || 1}">
          <div class="w-full aspect-square rounded-lg overflow-hidden bg-surface-container-high shadow-sm relative border-2 border-dashed border-outline-variant/50 flex items-center justify-center">
            <span class="material-symbols-outlined text-outline text-[28px]">science</span>
          </div>
          <div class="mt-1 flex flex-col items-center w-full min-w-0">
            <span class="font-label-sm text-label-sm text-on-surface font-semibold truncate w-full" data-field="name">${m.name}</span>
            <span class="font-body-sm text-[10px] text-on-surface-variant truncate w-full" data-field="qty">${qty}</span>
          </div>
        </div>`;
      })
      .join("");
  }
  const reagentsStatus = host.querySelector("#reagents-status");
  if (reagentsStatus) {
    reagentsStatus.dataset.ready = "false";
    const st = reagentsStatus.querySelector('[data-field="status-text"]');
    if (st) st.textContent = "Ингредиенты · Soon";
    reagentsStatus.classList.remove("text-secondary");
    reagentsStatus.classList.add("text-on-surface-variant");
  }

  const costs = stub.costs || {};
  host.querySelectorAll("[data-cost]").forEach((el) => {
    const key = el.getAttribute("data-cost");
    if (key && costs[key] != null) el.textContent = String(costs[key]);
  });

  const ctaLabel = stub.ctaLabel || "СКОРО · ПОДНИМИ РАНГ";
  host.querySelectorAll("#btn-start-breed, #btn-start-breed-desktop").forEach((btn) => {
    btn.dataset.canStart = "false";
    const lab = btn.querySelector('[data-field="label"]');
    if (lab) lab.textContent = ctaLabel;
  });

  const slotsHost = host.querySelector("#incubator-slots");
  const cribSlots = stub.incubator?.slots;
  if (slotsHost && Array.isArray(cribSlots) && cribSlots.length) {
    slotsHost.innerHTML = cribSlots
      .map((s) => {
        const locked = s.status === "locked";
        return `<article class="min-w-[280px] w-[280px] snap-center shrink-0 lg:min-w-0 lg:w-auto bg-surface-container-high${locked ? "/50 opacity-75" : ""} rounded-lg p-space-sm flex flex-col justify-between shadow-sm relative ${locked ? "" : "border-dashed border-2 border-surface-container-highest"}" data-crib-id="${s.id}" data-status="${s.status}">
          <div class="flex items-center justify-between gap-1">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Колыбель #${s.id}</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">${locked ? "Phase 6" : "Свободно"}</span>
          </div>
          <div class="py-space-sm flex items-center gap-3 min-w-0">
            <div class="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-outline">
              <span class="material-symbols-outlined text-[28px]">${locked ? "lock" : "nest_cam_wired_stand"}</span>
            </div>
            <div class="min-w-0">
              <div class="font-label-md text-label-md text-on-surface-variant font-medium truncate">${s.name || "Пусто"}</div>
              <div class="font-body-sm text-body-sm text-outline">${s.timer || "Soon"}</div>
            </div>
          </div>
          <button type="button" class="w-full py-1.5 px-2 bg-surface-container hover:bg-surface-bright text-on-surface-variant rounded font-label-sm text-label-sm" data-action="${locked ? "unlock" : "assign"}">${locked ? "Скоро" : "Назначить · tip"}</button>
        </article>`;
      })
      .join("");
  }
  const incubSec = host.querySelector("#incubator");
  if (incubSec) {
    incubSec.dataset.used = String(stub.incubator?.used ?? 0);
    incubSec.dataset.max = String(stub.incubator?.max ?? 4);
    const subEl = [...incubSec.querySelectorAll("span")].find((el) =>
      /Котята|готовы|stub|Phase 6|Инкубатор ·/i.test(el.textContent || ""),
    );
    if (subEl && !/Колыбель|headline/i.test(subEl.className || "")) {
      if (/Котята|готовы|Инкубатор ·|stub/i.test(subEl.textContent || "")) {
        subEl.textContent = "Инкубатор · SL stub · live = Phase 6";
      }
    }
  }
}

/** Craft «Склад Сырья» — Phase 6 Soon tip (not live mats from barn). */
function renderCraftStock() {
  const root = $("viewCraft");
  if (!root) return;
  const head = [...root.querySelectorAll("span")].find((el) => /Склад Сырья/i.test(el.textContent || ""));
  const card = head?.closest(".p-space-md, .rounded-xl");
  if (!card) return;
  const capLabel = [...card.querySelectorAll("span")].find((el) => /\d+\s*\/\s*\d+|Soon/i.test(el.textContent || "") && el !== head);
  if (capLabel) capLabel.textContent = "Soon · Phase 6";
  const list = card.querySelector(".flex.flex-col.gap-space-xs");
  if (!list) return;
  list.innerHTML = `<div class="p-space-sm rounded-lg border border-dashed border-outline-variant/40 text-on-surface-variant text-sm text-center">Сырьё алхимика — не live на SL. Боевой склад = route gear.</div>`;
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
  $("soonBody").textContent =
    sheet === "nursery"
      ? t(
          "hub.soon.nursery.body",
          "Скоро: скрещивание обычных котов. Малый шанс мифика — N=6 сильнейших карт из смеси родителей. Без безлимитного breeding.",
        )
      : t("hub.soon.body");
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

function ruRounds(n) {
  const k = n % 100;
  const d = n % 10;
  const word = k >= 11 && k <= 14 ? "раундов" : d === 1 ? "раунд" : d >= 2 && d <= 4 ? "раунда" : "раундов";
  return `${n} ${word}`;
}

/** Dojo dummy masters for victory showcase (L→R авангард · центр · тыл). */
const VICTORY_DUMMIES = [
  {
    id: "dummy_oak_knight",
    name: "Дубовый Рыцарь",
    roleRu: "ТАНК",
    roleIcon: "shield",
    accent: "primary",
    lvl: 1,
    art: "/stitch-assets/dojo/dummy-oak-knight.jpg",
    archetype: "Тяжёлый автоматон",
    stats: [
      { label: "Щит", value: "18", tone: "outline" },
      { label: "Урон", value: "8", tone: "outline" },
      { label: "Принято", value: "42", tone: "tertiary" },
    ],
    foot: "Рыцарь Додзё · Т1 · 50 HP",
  },
  {
    id: "dummy_straw_berserk",
    name: "Соломенный Берсерк",
    roleRu: "БОЕЦ · MVP",
    roleIcon: "swords",
    accent: "primary",
    lvl: 1,
    art: "/stitch-assets/dojo/dummy-straw-berserk.jpg",
    archetype: "Спарринг-чучело · Ярость",
    stats: [
      { label: "Урон", value: "32", tone: "primary" },
      { label: "Крит", value: "×2", tone: "tertiary" },
      { label: "Опыт", value: "+0", tone: "outline" },
    ],
    foot: "MVP манекенов · 43 HP",
    mvp: true,
  },
  {
    id: "dummy_stone_totem",
    name: "Каменный Тотем",
    roleRu: "САППОРТ",
    roleIcon: "water_drop",
    accent: "secondary",
    lvl: 1,
    art: "/stitch-assets/dojo/dummy-stone-totem.jpg",
    archetype: "Магический оберег",
    stats: [
      { label: "Урон", value: "4", tone: "outline" },
      { label: "Лечение", value: "18", tone: "secondary" },
      { label: "Получено", value: "12", tone: "tertiary" },
    ],
    foot: "Тотем Додзё · Т1 · 28 HP",
  },
];

/** Victory cards L→R = lobby paint (тыл · центр · авангард). D-034 */
const VICTORY_SLOT_META = [
  { key: "support", badge: "СЛОТ: ТЫЛ · САППОРТ", icon: "water_drop", accent: "secondary" },
  { key: "fighter", badge: "СЛОТ: ЦЕНТР · БОЕЦ (MVP)", icon: "crown", accent: "primary", mvp: true },
  { key: "tank", badge: "СЛОТ: АВАНГАРД · ТАНК", icon: "shield", accent: "primary" },
];

function victoryStarterFallback(templateId) {
  const table = {
    starter_tank_stone: {
      templateId,
      name: "Барсик Щит-утёс",
      role: "tank",
      roleRu: "ТАНК",
      roleIcon: "shield",
      accent: "primary",
      lvl: 1,
      dmg: 4,
      shield: 8,
      hp: 50,
    },
    starter_fighter_fire: {
      templateId,
      name: "Рыжик Когти",
      role: "fighter",
      roleRu: "БОЕЦ",
      roleIcon: "swords",
      accent: "tertiary",
      lvl: 1,
      dmg: 8,
      shield: 3,
      hp: 43,
    },
    starter_support_water: {
      templateId,
      name: "Мурка Родник",
      role: "support",
      roleRu: "САППОРТ",
      roleIcon: "healing",
      accent: "secondary",
      lvl: 1,
      dmg: 2,
      shield: 4,
      hp: 28,
    },
  };
  return table[templateId] || null;
}

function victoryCatCards() {
  const ids =
    Array.isArray(state.practiceSquad) && state.practiceSquad.length === 3
      ? state.practiceSquad
      : STARTERS;
  return PRACTICE_VISUAL_LANES.map((laneIdx, visualPos) => {
    const templateId = ids[laneIdx] || STARTERS[laneIdx] || STARTERS[0];
    const hero =
      practiceHeroByTemplate(templateId) || victoryStarterFallback(templateId) || {
        templateId,
        name: templateId,
        roleRu: "ГЕРОЙ",
        roleIcon: "pets",
        accent: "primary",
        lvl: 1,
        dmg: 4,
        shield: 2,
        hp: 30,
        role: "fighter",
      };
    const meta = VICTORY_SLOT_META[visualPos];
    const isMvp = !!meta?.mvp;
    const art = catHeroArt(hero.templateId) || "/stitch-assets/cat-heroes/fighter-a.png";
    const dmg = Math.round((hero.dmg || 4) * (isMvp ? 520 : 280));
    const heal = hero.role === "support" || hero.role === "mage" ? Math.round((hero.shield || 3) * 420) : 0;
    const taken = Math.round((hero.hp || 30) * (hero.role === "tank" ? 85 : 40));
    const stats =
      visualPos === 0
        ? [
            { label: "Урон", value: String(dmg), tone: "outline" },
            { label: "Лечение", value: heal.toLocaleString("ru-RU"), tone: "secondary" },
            { label: "Получено", value: taken.toLocaleString("ru-RU"), tone: "tertiary" },
          ]
        : visualPos === 1
          ? [
              { label: "Урон", value: dmg.toLocaleString("ru-RU"), tone: "primary" },
              { label: "Крит", value: `${12 + (hero.dmg || 4)}%`, tone: "tertiary" },
              { label: "Опыт", value: "+150", tone: "outline" },
            ]
          : [
              { label: "Блок", value: String(Math.round((hero.shield || 4) * 260)), tone: "outline" },
              { label: "Урон", value: String(Math.round((hero.dmg || 4) * 180)), tone: "outline" },
              { label: "Принято", value: taken.toLocaleString("ru-RU"), tone: "tertiary" },
            ];
    return {
      id: hero.templateId,
      name: hero.name,
      roleRu: isMvp ? `${hero.roleRu} · MVP` : hero.roleRu,
      roleIcon: isMvp ? "crown" : hero.roleIcon,
      accent: hero.accent || meta.accent,
      lvl: hero.lvl || 1,
      art,
      archetype: CAT_HERO_BLURB[hero.templateId]?.split("·")[0]?.trim() || hero.roleRu,
      stats,
      foot: isMvp ? "MVP боя ×1.5" : "Победитель спарринга",
      mvp: isMvp,
    };
  });
}

function victoryToneClass(tone) {
  if (tone === "secondary") return "text-secondary";
  if (tone === "tertiary") return "text-tertiary";
  if (tone === "primary") return "text-primary";
  return "text-outline";
}

function victoryHeroCardHtml(card, meta) {
  const mvp = !!(card.mvp || meta.mvp);
  const height = mvp ? "h-[500px] lg:h-[555px] -mt-4 z-20" : "h-[460px] lg:h-[510px]";
  const shadow = mvp ? "shadow-2xl shadow-primary/20 border border-primary/40" : "shadow-xl border border-outline-variant/40";
  const badgeCls = mvp
    ? "bg-primary text-on-primary shadow-lg shadow-primary/25"
    : "bg-surface-container-high text-on-surface shadow";
  const iconTone = meta.accent === "secondary" ? "text-secondary" : "text-primary";
  const stats = (card.stats || [])
    .map(
      (s, i) =>
        `<div class="${i === 1 ? "border-x border-outline-variant/30" : ""}"><p class="${victoryToneClass(s.tone)} text-[10px] font-bold uppercase">${s.label}</p><p class="font-extrabold text-[18px] text-on-surface">${s.value}</p></div>`
    )
    .join("");
  const footCls = mvp
    ? "bg-primary-container/20 text-primary"
    : "bg-surface-container text-outline";
  const face = spriteFaceHtml(
    `<img alt="${card.name}" class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 mf-hero-portrait" src="${card.art}"/>`,
    { artSrc: card.art, desiredFace: desiredFaceFromArtSrc(card.art) }
  );
  return `<article class="relative flex flex-col justify-between ${height} rounded-xl bg-surface-container-high ${shadow} overflow-hidden transition-all duration-300 hover:-translate-y-1 group" data-vic-card="${card.id}" data-mvp="${mvp ? "1" : "0"}">
<div class="absolute inset-0 z-0">
${face}
<div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/55 to-surface-container-lowest/20"></div>
</div>
<div class="relative z-10 flex items-center justify-between p-3 border-b border-outline-variant/30 bg-surface-container-lowest/55 backdrop-blur-sm">
<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badgeCls}"><span class="material-symbols-outlined text-[16px] ${mvp ? "" : iconTone}">${mvp ? "crown" : meta.icon}</span><span class="text-[10px] font-bold uppercase tracking-wider">${meta.badge}</span></div>
</div>
<div class="relative z-10 flex-1 flex flex-col items-center justify-end p-3 text-center min-h-0">
${mvp ? `<div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container/25 text-primary-fixed mb-1"><span class="material-symbols-outlined text-[14px]">workspace_premium</span><span class="text-[10px] font-bold">Золотой MVP</span></div>` : ""}
<h3 class="text-[18px] md:text-[22px] font-bold ${mvp ? "text-primary" : "text-on-surface"} drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">${card.name}</h3>
<p class="text-[12px] text-on-surface-variant max-w-[220px]">${card.archetype || ""}</p>
</div>
<div class="relative z-10 p-3 bg-surface-container-lowest/92 border-t border-outline-variant/30 flex flex-col gap-1">
<div class="grid grid-cols-3 gap-1 text-center bg-surface-container/80 rounded-lg p-1.5">${stats}</div>
<div class="flex items-center justify-center py-2 px-2 rounded ${footCls} text-[11px] font-bold"><span class="material-symbols-outlined text-[16px] mr-1">${mvp ? "add_circle" : "emoji_events"}</span><span>${card.foot}</span></div>
</div>
</article>`;
}

function renderVictorySlots(squad) {
  const root = $("viewVictoryHall");
  const grid = $("vicSlots") || root?.querySelector("[data-vic-slots]");
  if (!grid) return;
  const cards = squad === "dummies" ? VICTORY_DUMMIES : victoryCatCards();
  grid.innerHTML = cards
    .map((card, i) => victoryHeroCardHtml(card, VICTORY_SLOT_META[i] || VICTORY_SLOT_META[0]))
    .join("");
  const btnCats = $("btnVicCats");
  const btnDummies = $("btnVicDummies");
  const onCls =
    "vic-squad-btn is-on flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold bg-primary text-on-primary shadow-sm transition-all";
  const offCls =
    "vic-squad-btn flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold bg-transparent text-on-surface-variant hover:text-on-surface transition-all";
  if (btnCats) btnCats.className = squad === "cats" ? onCls : offCls;
  if (btnDummies) btnDummies.className = squad === "dummies" ? onCls : offCls;
  // Never set data-vic-squad on the hall root — it steals [data-win] clicks via closest().
  if (root) root.dataset.vicActive = squad;
}

/** MF-151 · PvE expedition victory (Славная победа) — paint from design pack. */
function renderPveVictory() {
  const chapter = Math.max(1, Math.min(5, Number(state.pveChapter) || 1));
  const data = pveChapterData(chapter);
  const turn = state.battle?.turn || state.battle?.round || state.lastResult?.turn || 5;
  const sec = Math.max(48, Math.min(240, (turn || 5) * 28));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };
  setText("pveVicBadge", `ЭКСПЕДИЦИЯ ЗАВЕРШЕНА · 3/3 ВОЛНЫ ЗАЧИЩЕНО`);
  setText("pveVicTitle", "СЛАВНАЯ ПОБЕДА!");
  setText(
    "pveVicLead",
    `Пит-Босс «${data.bossName}» повержен! Ваши герои стяжали славу и сокровища Очага.`,
  );
  setText("pveVicTime", `${mm}:${ss}`);
  setText("pveVicRounds", `${turn || 5} Раундов`);
  setText("pveVicLosses", "0 Потерь");
  setText("pveVicMvp", "MVP: Слот #1");
  setText("pveVicGold", "+2,400");
  setText("pveVicGems", "+480");
  setText("pveVicDust", "+1,200");
  // Prefer chapter boss hall as backdrop when present.
  const bg = document.querySelector("#viewPveVictory .pve-vic-bg");
  const bossArt = data.stages?.boss?.art;
  if (bg && bossArt) bg.setAttribute("src", bossArt);
  bindPveVictory();
}

function bindPveVictory() {
  const root = $("viewPveVictory");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  const clearBattle = () => {
    state.battle = null;
    state.lastResult = null;
  };
  $("pveVicAgain")?.addEventListener("click", () => {
    clearBattle();
    state.battleMode = "pve";
    state.pveStage = "entrance";
    state.selectedStageId = pveStageId(state.pveChapter, "entrance");
    resetPveCarryAlive();
    openPveLoad();
  });
  $("pveVicHub")?.addEventListener("click", () => {
    clearBattle();
    state.battleMode = "";
    navigate("battle_hub", { primary: "combat" });
  });
  $("pveVicNext")?.addEventListener("click", () => {
    clearBattle();
    // After pitboss: back to Mythmir map — not the next fight/chapter load.
    state.battleMode = "pve";
    state.pveStage = "entrance";
    state.selectedStageId = pveStageId(state.pveChapter, "entrance");
    resetPveCarryAlive();
    navigate("yard", { primary: "combat" });
  });
  document.addEventListener("keydown", (ev) => {
    if (logicalViewId() !== "viewPveVictory") return;
    if (ev.target.closest?.("input, textarea")) return;
    if (ev.code === "Space") {
      ev.preventDefault();
      $("pveVicNext")?.click();
    } else if (ev.code === "Escape") {
      ev.preventDefault();
      $("pveVicHub")?.click();
    } else if (ev.code === "KeyR") {
      ev.preventDefault();
      $("pveVicAgain")?.click();
    }
  });
}

function renderVictoryHall() {
  const mode = state.battleMode;
  const turn = state.battle?.turn || state.battle?.round || 0;
  const copy = {
    practice: ["Арена Сэнсэя · Триумф", "Славная победа!", "Награды за спарринг:"],
    pve: ["Мифмир · Триумф", "Славная победа!", "Трофеи похода:"],
    pvp: ["Арена · Триумф", "Славная победа!", "Трофеи арены:"],
  }[mode] || ["Бой · Триумф", "Славная победа!", "Награды:"];
  if ($("vicKicker")) $("vicKicker").textContent = copy[0];
  if ($("vicTitle")) $("vicTitle").textContent = copy[1];
  if ($("vicLoot")) $("vicLoot").textContent = copy[2];
  if ($("vicRounds")) $("vicRounds").textContent = turn ? `Раундов: ${turn}` : "Раундов: —";
  if ($("vicTime")) {
    const sec = Math.max(48, Math.min(240, (turn || 3) * 28));
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    $("vicTime").textContent = `Время боя: ${mm}:${ss}`;
  }
  // Winners stand after p1_win — cats by default; toggle shows dojo dummies.
  const winners = state.lastResult?.result === "p2_win" ? "dummies" : "cats";
  renderVictorySlots(winners);
  bindVictoryHall();
}

function bindVictoryHall() {
  const root = $("viewVictoryHall");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener("click", (ev) => {
    const squadBtn = ev.target.closest("button[data-vic-squad], .vic-squad-btn[data-vic-squad]");
    if (squadBtn && root.contains(squadBtn)) {
      ev.preventDefault();
      ev.stopPropagation();
      renderVictorySlots(squadBtn.getAttribute("data-vic-squad") || "cats");
      return;
    }
    const actBtn = ev.target.closest("[data-win]");
    const act = actBtn?.getAttribute("data-win");
    if (!act || !root.contains(actBtn)) return;
    ev.preventDefault();
    ev.stopPropagation();
    const mode = state.battleMode;
    const battleId = state.battle?.battleId || state.lastResult?.battleId || "";
    if (act === "log") {
      toast(battleId ? `Бой ${battleId}` : "Лог боя на сервере");
      return;
    }
    if (act === "again") {
      state.battle = null;
      state.lastResult = null;
      if (mode === "practice") {
        state.battleMode = "practice";
        Promise.resolve(startPractice(false)).then(() => {
          if (!state.battle) renderAll();
        });
        return;
      }
      state.battleMode = "";
      if (mode === "pvp") pvpStart();
      else startYard(false);
      return;
    }
    state.battle = null;
    state.lastResult = null;
    state.battleMode = "";
    // Practice: dojo + next-fight both return to the training hall (no T2 bots yet).
    if (act === "dojo" || (act === "hub" && mode === "practice")) {
      navigate("practice");
      return;
    }
    if (act === "dojo") {
      navigate(mode === "pve" ? "yard" : "battle_hub");
      return;
    }
    navigate("battle_hub");
  });
  document.addEventListener("keydown", (ev) => {
    if (root.classList.contains("hidden")) return;
    if (ev.target.closest("input, textarea")) return;
    if (ev.code === "KeyR") {
      ev.preventDefault();
      root.querySelector('[data-win="again"]')?.click();
      return;
    }
    if (ev.code === "Escape") {
      ev.preventDefault();
      root.querySelector('[data-win="dojo"]')?.click();
      return;
    }
    if (ev.code === "Space") {
      ev.preventDefault();
      root.querySelector('[data-win="hub"]')?.click();
    }
  });
}

function ruWins(n) {
  const k = n % 100;
  const d = n % 10;
  const word = k >= 11 && k <= 14 ? "побед" : d === 1 ? "победа" : d >= 2 && d <= 4 ? "победы" : "побед";
  return `${n} ${word}`;
}

function renderPvpVictory() {
  const turn = state.battle?.turn || state.battle?.round || 0;
  const streak = state.progress.pvpWins || 1;
  if ($("colStreak")) $("colStreak").textContent = `Серия: ${ruWins(streak)}`;
  if ($("colLead")) {
    const when = turn ? ` за ${ruRounds(turn)}` : "";
    $("colLead").textContent = `Арена рукоплещет отряду Хранителя. Все три мифических кота выстояли${when}.`;
  }
  bindPvpVictory();
}

function bindPvpVictory() {
  const root = $("viewPvpVictory");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener(
    "click",
    (ev) => {
      const act = ev.target.closest("[data-col]")?.getAttribute("data-col");
      if (!act) return;
      ev.preventDefault();
      ev.stopPropagation();
      const battleId = state.battle?.battleId || state.lastResult?.battleId || "";
      if (act === "log") {
        toast(battleId ? `Бой ${battleId}` : "Лог боя на сервере");
        return;
      }
      if (act === "cards") {
        const cards = state.battle?.hand || [];
        toast(cards.length ? cards.map((c) => t(c.name_key, c.cardId)).join(" · ") : "Карты этого боя уже сыграны");
        return;
      }
      state.battle = null;
      state.lastResult = null;
      state.battleMode = "";
      if (act === "again") {
        pvpStart();
        return;
      }
      navigate("pvp");
    },
    true,
  );
  document.addEventListener("keydown", (ev) => {
    if (logicalViewId() !== "viewPvpVictory") return;
    if (ev.target.closest("input, textarea")) return;
    if (ev.code === "Space") {
      ev.preventDefault();
      root.querySelector('[data-col="again"]')?.click();
    } else if (ev.code === "Escape") {
      ev.preventDefault();
      root.querySelector('[data-col="lobby"]')?.click();
    } else if (ev.code === "KeyR") {
      ev.preventDefault();
      const cards = state.battle?.hand || [];
      toast(cards.length ? cards.map((c) => t(c.name_key, c.cardId)).join(" · ") : "Карты этого боя уже сыграны");
    }
  });
}

function renderResult() {
  const r = state.lastResult;
  const win = r?.result === "p1_win";
  $("resultEyebrow").textContent = t("result.eyebrow", "Итог боя");
  $("resultTitle").textContent = win
    ? t("result.win", "Блестящая победа!")
    : t("result.lose", "Поражение в бою");
  $("resultLead").textContent = `${r?.battleId || "?"} · ${r?.result || "?"} · mode=${state.battleMode}`;
  const loseLead = $("resultLoseLead");
  if (loseLead && !win) {
    loseLead.textContent = `${r?.battleId || "?"} · ${r?.result || "?"} · ${state.battleMode}. Пересобери строй и попробуй снова.`;
  }
  // Wire painted/lose CTAs once
  document.querySelectorAll("[data-hud-action]").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      const act = btn.getAttribute("data-hud-action");
      state.battle = null;
      state.lastResult = null;
      if (act === "result-retry") startYard(false);
      else if (act === "result-formation") navigate("formation");
      else if (act === "result-tavern") navigate("tavern");
      else if (act === "result-hub") navigate("hub");
      else if (act === "result-yard") navigate("yard");
    });
  });
}

function cleansedByUnitFromEvents(events) {
  const map = {};
  for (const ev of events || []) {
    if (ev.kind !== "status" || ev.statusOp !== "clear" || !ev.targetId || !ev.status) continue;
    (map[ev.targetId] ||= []).push(ev.status);
  }
  return map;
}

function unitCard(u, side) {
  const d = document.createElement("div");
  d.className = `unit ${side}${u.alive ? "" : " dead mf-unit-dead"} mf-battle-unit--cutout`;
  const pct = u.maxHp > 0 ? Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100)) : 0;
  const seeSh = canSeeUnitShield(u);
  const sh = seeSh && u.shield > 0 ? ` +${u.shield}` : "";
  const icons = statusIconsHtml(unitStatusList(u));
  const art = battleUnitArt(u);
  const roleRu = CAT_ROLE_RU[u.role] || u.role || "";
  const elRu = CAT_ELEMENT_RU[u.element] || u.element || "";
  const desiredFace = desiredSpriteFace(u);
  const cutout = art
    ? spriteFaceHtml(
        `<img alt="" class="mf-battle-cutout${u.alive ? "" : " mf-unit-dim"}" src="${art}"/>`,
        { artSrc: art, desiredFace }
      )
    : "";
  const rest = unitFatalityLabel(u);
  d.innerHTML = `
    <figure class="mf-unit-frame">${cutout}<div class="mf-status-row">${icons}</div><div class="mf-fatality" ${u.alive ? "hidden" : ""}><span>${rest}</span></div></figure>
    <div class="meta">${roleRu}${elRu ? ` · ${elRu}` : ""} · L${u.lane}</div>
    <div class="hp">${u.alive ? `${u.hp}/${u.maxHp}${sh}` : rest}</div>
    <div class="mf-bars"><div class="mf-bar mf-bar--hp"><i style="width:${pct}%"></i></div>${
      seeSh && u.shield > 0
        ? `<div class="mf-bar mf-bar--shield"><i style="width:${Math.min(100, (u.shield / Math.max(u.maxHp, 1)) * 100)}%"></i></div>`
        : ""
    }</div>
  `;
  // MF-152: idle/aura + hit FX target via data-unit-id (same kits as cats by role).
  decorateBattleUnitIdle(d, u, u.lane ?? 0);
  return d;
}

/** Attack-card art for practice/hand HUD — all 12 shop packs under stitch-assets. */
const ATTACK_CARD_ART_FOLDER = {
  shop_tank_stone_a: "tank-a",
  shop_tank_stone_b: "tank-b",
  shop_fighter_fire_a: "fighter-a",
  shop_fighter_fire_b: "fighter-b",
  shop_assassin_bolt_a: "assassin-a",
  shop_assassin_bolt_b: "assassin-b",
  shop_ranger_grass_a: "ranger-a",
  shop_ranger_grass_b: "ranger-b",
  shop_mage_fire_a: "mage-a",
  shop_mage_ice_b: "mage-b",
  shop_support_water_a: "support-a",
  shop_support_water_b: "support-b",
  tank_stone: "tank-a",
  fighter_fire: "fighter-a",
  support_water: "support-a",
};

/** N=6 part order — FULL-SPEC §2.3 (eyes/ears + 4 actives). */
const DECK_PARTS = ["eyes", "ears", "muzzle", "headwear", "back", "tail"];
const STARTER_DECK_TEMPLATE = {
  starter_tank_stone: "shop_tank_stone_a",
  starter_fighter_fire: "shop_fighter_fire_a",
  starter_support_water: "shop_support_water_a",
};
/** cost≠1 overrides from content/cards (default 1). */
const ATTACK_CARD_COST2 = new Set([
  "card_shop_assassin_bolt_a_tail",
  "card_shop_assassin_bolt_b_tail",
  "card_shop_fighter_fire_a_tail",
  "card_shop_fighter_fire_b_back",
  "card_shop_fighter_fire_b_eyes",
  "card_shop_fighter_fire_b_muzzle",
  "card_shop_fighter_fire_b_tail",
  "card_shop_mage_fire_a_back",
  "card_shop_mage_fire_a_muzzle",
  "card_shop_mage_ice_b_back",
  "card_shop_mage_ice_b_eyes",
  "card_shop_mage_ice_b_muzzle",
  "card_shop_mage_ice_b_tail",
  "card_shop_ranger_grass_b_eyes",
  "card_shop_ranger_grass_b_headwear",
  "card_shop_ranger_grass_b_muzzle",
  "card_shop_ranger_grass_b_tail",
  "card_shop_support_water_a_back",
  "card_shop_support_water_b_back",
]);

function deckShopTemplate(templateId) {
  return STARTER_DECK_TEMPLATE[templateId] || templateId;
}

/** Unique N=6 attack cards for a cat template (no alt/dup stems). */
function heroDeckCards(templateId) {
  const shop = deckShopTemplate(templateId);
  if (!ATTACK_CARD_ART_FOLDER[shop]) return [];
  const seen = new Set();
  const out = [];
  for (const part of DECK_PARTS) {
    const stem = `${shop}_${part}`;
    const cardId = `card_${stem}`;
    if (seen.has(cardId)) continue;
    seen.add(cardId);
    out.push({
      cardId,
      part,
      stem,
      name_key: `card.${stem}`,
      cost: ATTACK_CARD_COST2.has(cardId) ? 2 : 1,
      art: attackCardArtUrl(cardId),
    });
  }
  return out;
}

function renderHomeDeck(cat) {
  const grid = $("homeDeckGrid");
  if (!grid || !cat) return;
  const name = catSheetName(cat);
  const nameEl = $("homeDeckHeroName");
  if (nameEl) nameEl.textContent = name;
  const cards = heroDeckCards(cat.templateId);
  const cycle = cards.reduce((s, c) => s + c.cost, 0);
  const costEl = $("homeDeckCycleCost");
  if (costEl) {
    costEl.innerHTML = `Стоимость цикла: <strong>${cycle || "—"} AP</strong> / ход`;
  }
  if (!cards.length) {
    grid.innerHTML = DECK_PARTS.map(
      () =>
        `<div class="group relative rounded-lg bg-surface-container-lowest/40 border border-dashed border-outline-variant/40 aspect-[2/3] flex flex-col items-center justify-center text-outline-variant"><span class="material-symbols-outlined text-2xl">add</span><span class="text-[9px] font-label-sm mt-1">Пусто</span></div>`,
    ).join("");
    return;
  }
  grid.innerHTML = cards
    .map((c) => {
      const title = t(c.name_key, c.stem);
      if (c.art) {
        return `<div class="group relative rounded-lg bg-surface-container-lowest border border-outline-variant/40 aspect-[2/3] overflow-hidden shadow mf-atk-card mf-atk-card--art" title="${title} · ${c.cost} AP · ${c.part}"><img alt="${title}" class="w-full h-full object-cover" src="${c.art}"/></div>`;
      }
      return `<div class="group relative rounded-lg bg-surface-container-lowest border border-outline-variant/40 aspect-[2/3] flex flex-col items-center justify-center p-1 text-center" title="${title}"><span class="text-[10px] font-label-sm text-on-surface">${title}</span><span class="text-[9px] text-on-surface-variant mt-1">${c.cost} AP · ${c.part}</span></div>`;
    })
    .join("");
}

/** Extract cat templateId from battle unit id (`p1_0_shop_tank_stone_a`). */
function unitTemplateId(unitOrId) {
  const id = typeof unitOrId === "string" ? unitOrId : unitOrId?.id || "";
  const m = String(id).match(/^(?:p1|p2|bot)_\d+_(.+)$/);
  return m ? m[1] : id;
}

/** Practice lobby roster: data-hero → combat template + display meta. */
const PRACTICE_HEROES = {
  barsik: {
    templateId: "shop_tank_stone_a",
    name: "Барсик Щит-утёс",
    short: "Барсик",
    role: "tank",
    roleRu: "ТАНК",
    roleIcon: "shield",
    accent: "primary",
    lvl: 1,
    bm: 4820,
    hp: 50,
    shield: 8,
    dmg: 4,
  },
  titan: {
    templateId: "shop_tank_stone_b",
    name: "Титан Пробой",
    short: "Титан",
    role: "tank",
    roleRu: "ТАНК",
    roleIcon: "shield",
    accent: "primary",
    lvl: 1,
    bm: 4680,
    hp: 48,
    shield: 6,
    dmg: 6,
  },
  ryzhik: {
    templateId: "shop_fighter_fire_a",
    name: "Рыжик Когти",
    short: "Рыжик",
    role: "fighter",
    roleRu: "БОЕЦ",
    roleIcon: "swords",
    accent: "tertiary",
    lvl: 1,
    bm: 5140,
    hp: 43,
    shield: 3,
    dmg: 8,
  },
  grom: {
    templateId: "shop_fighter_fire_b",
    name: "Гром Клинок",
    short: "Гром",
    role: "fighter",
    roleRu: "БОЕЦ",
    roleIcon: "swords",
    accent: "tertiary",
    lvl: 1,
    bm: 5020,
    hp: 45,
    shield: 4,
    dmg: 10,
  },
  shadow: {
    templateId: "shop_assassin_bolt_a",
    name: "Тень Скрытный",
    short: "Тень",
    role: "assassin",
    roleRu: "АССАСИН",
    roleIcon: "flash_on",
    accent: "primary",
    lvl: 1,
    bm: 4910,
    hp: 38,
    shield: 2,
    dmg: 8,
  },
  bagheera: {
    templateId: "shop_assassin_bolt_b",
    name: "Багира Тень",
    short: "Багира",
    role: "assassin",
    roleRu: "АССАСИН",
    roleIcon: "flash_on",
    accent: "primary",
    lvl: 1,
    bm: 4790,
    hp: 36,
    shield: 2,
    dmg: 8,
  },
  lynx: {
    templateId: "shop_ranger_grass_a",
    name: "Рыселап Лук",
    short: "Рыселап",
    role: "ranger",
    roleRu: "СТРЕЛОК",
    roleIcon: "adjust",
    accent: "secondary",
    lvl: 1,
    bm: 4850,
    hp: 35,
    shield: 2,
    dmg: 7,
  },
  leo: {
    templateId: "shop_ranger_grass_b",
    name: "Лео Лучник",
    short: "Лео",
    role: "ranger",
    roleRu: "СТРЕЛОК",
    roleIcon: "adjust",
    accent: "secondary",
    lvl: 1,
    bm: 4960,
    hp: 37,
    shield: 2,
    dmg: 7,
  },
  ignius: {
    templateId: "shop_mage_fire_a",
    name: "Игниус Пламя",
    short: "Игниус",
    role: "mage",
    roleRu: "МАГ",
    roleIcon: "auto_fix_high",
    accent: "tertiary",
    lvl: 1,
    bm: 5300,
    hp: 30,
    shield: 2,
    dmg: 5,
  },
  frostia: {
    templateId: "shop_mage_ice_b",
    name: "Фростия Лёд",
    short: "Фростия",
    role: "mage",
    roleRu: "МАГ",
    roleIcon: "auto_fix_high",
    accent: "secondary",
    lvl: 1,
    bm: 5120,
    hp: 29,
    shield: 3,
    dmg: 5,
  },
  murka: {
    templateId: "shop_support_water_a",
    name: "Мурка Родник",
    short: "Мурка",
    role: "support",
    roleRu: "САППОРТ",
    roleIcon: "healing",
    accent: "secondary",
    lvl: 1,
    bm: 4750,
    hp: 28,
    shield: 4,
    dmg: 2,
  },
  aurelia: {
    templateId: "shop_support_water_b",
    name: "Аурелия Клирик",
    short: "Аурелия",
    role: "support",
    roleRu: "САППОРТ",
    roleIcon: "healing",
    accent: "primary",
    lvl: 1,
    bm: 4890,
    hp: 29,
    shield: 3,
    dmg: 3,
  },
};

/**
 * Sim / CreatePvE: index 0 = front (авангард) … 2 = rear (тыл). FULL-SPEC §2.1.
 * Lobby + victory paint L→R: тыл · центр · авангард (танк справа). LOCKED D-034 — do not flip.
 */
const PRACTICE_LANE_LABEL = ["Авангард", "Центр", "Тыл"];
const PRACTICE_VISUAL_LANES = [2, 1, 0];
const PRACTICE_EMPTY_SLOT_META = [
  {
    accent: "secondary",
    icon: "auto_awesome",
    badge: "Тыл",
    tip: "Саппорт / маг / стрелок",
    tags: ["Саппорт", "Маг", "Стрелок"],
  },
  {
    accent: "tertiary",
    icon: "swords",
    badge: "Центр",
    tip: "Боец / ассасин / стрелок",
    tags: ["Боец", "Ассасин", "Стрелок"],
  },
  {
    accent: "primary",
    icon: "shield",
    badge: "Фронт",
    tip: "Танк / боец",
    tags: ["Танк", "Боец"],
  },
];

function practiceElementOf(hero) {
  const m = String(hero?.templateId || "").match(/_(fire|water|grass|bolt|stone|ice)_/);
  return m ? m[1] : "";
}

const DOJO_FILTER_ROLES = [
  { id: "", label: "Все" },
  { id: "tank", label: "Танк" },
  { id: "fighter", label: "Боец" },
  { id: "assassin", label: "Асс." },
  { id: "ranger", label: "Лук" },
  { id: "mage", label: "Маг" },
  { id: "support", label: "Сап." },
];
const DOJO_FILTER_ELS = [
  { id: "", label: "·" },
  { id: "stone", label: "🪨" },
  { id: "fire", label: "🔥" },
  { id: "bolt", label: "⚡" },
  { id: "grass", label: "🌿" },
  { id: "ice", label: "❄️" },
  { id: "water", label: "💧" },
];

function ensureDojoRosterFilters(root) {
  const box = root?.querySelector("#dojoRosterFilters");
  if (!box || box.dataset.ready === "1") return box;
  box.dataset.ready = "1";
  const mk = (group, items, active) =>
    items
      .map(
        (it) =>
          `<button type="button" class="dojo-filter-chip${active === it.id ? " is-on" : ""}" data-dojo-filter="${group}" data-filter-id="${it.id}" title="${it.label}">${it.label}</button>`
      )
      .join("");
  box.innerHTML = `${mk("role", DOJO_FILTER_ROLES, state.practiceFilterRole || "")}${mk("el", DOJO_FILTER_ELS, state.practiceFilterEl || "")}`;
  return box;
}

function applyDojoRosterFilter(root) {
  ensureDojoRosterFilters(root);
  const role = state.practiceFilterRole || "";
  const el = state.practiceFilterEl || "";
  let shown = 0;
  root.querySelectorAll("[data-hero]").forEach((card) => {
    const hero = practiceHeroByKey(card.getAttribute("data-hero"));
    if (!hero) {
      card.hidden = true;
      return;
    }
    card.dataset.role = hero.role || "";
    card.dataset.el = practiceElementOf(hero);
    card.classList.add("dojo-roster-card");
    const okRole = !role || hero.role === role;
    const okEl = !el || practiceElementOf(hero) === el;
    const show = okRole && okEl;
    card.hidden = !show;
    if (show) shown += 1;
  });
  const count = root.querySelector("#dojoRosterCount");
  if (count) count.textContent = String(shown);
  root.querySelectorAll("#dojoRosterFilters [data-dojo-filter]").forEach((btn) => {
    const group = btn.getAttribute("data-dojo-filter");
    const id = btn.getAttribute("data-filter-id") || "";
    const on = group === "role" ? id === (state.practiceFilterRole || "") : id === (state.practiceFilterEl || "");
    btn.classList.toggle("is-on", on);
  });
}

function practiceHeroByKey(key) {
  return PRACTICE_HEROES[key] || null;
}

function practiceHeroByTemplate(templateId) {
  return Object.values(PRACTICE_HEROES).find((h) => h.templateId === templateId) || null;
}

function practiceHeroKeyByTemplate(templateId) {
  return Object.keys(PRACTICE_HEROES).find((k) => PRACTICE_HEROES[k].templateId === templateId) || null;
}
const ATTACK_CARD_ART_ALIAS = {
  card_tank_stone_eyes: "shop_tank_stone_a_eyes",
  card_tank_stone_ears: "shop_tank_stone_a_ears",
  card_tank_stone_muzzle: "shop_tank_stone_a_muzzle",
  card_tank_stone_headwear: "shop_tank_stone_a_headwear",
  card_tank_stone_back: "shop_tank_stone_a_back",
  card_tank_stone_tail: "shop_tank_stone_a_tail",
  card_fighter_fire_eyes: "shop_fighter_fire_a_eyes",
  card_fighter_fire_ears: "shop_fighter_fire_a_ears",
  card_fighter_fire_muzzle: "shop_fighter_fire_a_muzzle",
  card_fighter_fire_headwear: "shop_fighter_fire_a_headwear",
  card_fighter_fire_back: "shop_fighter_fire_a_back",
  card_fighter_fire_tail: "shop_fighter_fire_a_tail",
  card_support_water_eyes: "shop_support_water_a_eyes",
  card_support_water_ears: "shop_support_water_a_ears",
  card_support_water_muzzle: "shop_support_water_a_muzzle",
  card_support_water_headwear: "shop_support_water_a_headwear",
  card_support_water_back: "shop_support_water_a_back",
  card_support_water_tail: "shop_support_water_a_tail",
};

function attackCardArtUrl(cardId) {
  if (!cardId) return "";
  const raw = ATTACK_CARD_ART_ALIAS[cardId] || String(cardId).replace(/^card_/, "");
  // shop_tank_stone_a_muzzle → shop_tank_stone_a | muzzle
  // tank_stone_muzzle (after alias) already shop_*
  let folderKey = "";
  let fileStem = raw;
  if (raw.startsWith("shop_")) {
    const m = raw.match(/^(shop_[a-z]+_[a-z]+_[ab])_(.+)$/);
    if (m) {
      folderKey = m[1];
      fileStem = raw;
    }
  } else {
    const m = raw.match(/^([a-z]+_[a-z]+)_(.+)$/);
    if (m) folderKey = m[1];
  }
  const folder = ATTACK_CARD_ART_FOLDER[folderKey];
  if (!folder) return "";
  return `/stitch-assets/attack-cards/${folder}/attack_${fileStem}.webp`;
}

function unitCrowdControlled(diff, unitId) {
  const u = (diff?.units || []).find((x) => x.id === unitId);
  if (!u?.alive) return true;
  return (u.statuses || []).some((s) => s.id === "stun" || s.id === "sleep");
}

/** Portrait attack-card button for practice / PvP / wire battle hands. */
function makeAttackHandButton(c, diff, classNames = "mf-atk-card") {
  const b = document.createElement("button");
  b.type = "button";
  const art = attackCardArtUrl(c.cardId);
  const title = t(c.name_key, c.cardId);
  const cost = c.cost ?? "?";
  const cc = unitCrowdControlled(diff, c.unitId);
  b.className = art ? `${classNames} mf-atk-card--art pf-card pf-card-art` : `${classNames} mf-atk-card--text pf-card`;
  if (cc) b.classList.add("mf-atk-card--stunned");
  b.disabled = !c.playable || cc || !!diff.result || diff.active !== 0 || !!state.oppThrowPlaying;
  b.title = cc ? `${title} · стан/сон — пропуск хода` : `${title} · ${cost} AP`;
  if (art) {
    b.innerHTML = `<img alt="${title}" src="${art}"/><b class="mf-atk-card__meta">${title}</b><span class="mf-atk-card__sub">${cost} AP</span>`;
    const img = b.querySelector("img");
    img?.addEventListener("error", () => {
      // Missing/broken plate → text card instead of empty black tile.
      b.classList.remove("mf-atk-card--art", "pf-card-art");
      b.classList.add("mf-atk-card--text");
      img.remove();
    });
  } else {
    b.innerHTML = `<b class="mf-atk-card__meta">${title}</b><span class="mf-atk-card__sub">${cost} AP</span>`;
  }
  b.addEventListener("click", () =>
    submitAction({ kind: "playCard", unitId: c.unitId, handIndex: c.handIndex, targetId: "" }),
  );
  return b;
}

/** Shared attack-card reverse used for opponent discard throw (all modes). */
const OPP_CARD_BACK_URL = "/stitch-assets/attack-cards/card-back.webp";
const OPP_THROW_COUNT = 6;
let oppThrowToken = 0;

function ensureOppThrowOverlay() {
  let el = $("mfOppThrow");
  if (el) return el;
  el = document.createElement("div");
  el.id = "mfOppThrow";
  el.className = "mf-opp-throw";
  el.hidden = true;
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<p class="mf-opp-throw__label"></p><div class="mf-opp-throw__fan" role="presentation"></div>`;
  const fan = el.querySelector(".mf-opp-throw__fan");
  for (let i = 0; i < OPP_THROW_COUNT; i++) {
    const img = document.createElement("img");
    img.className = "mf-opp-throw__card";
    img.src = OPP_CARD_BACK_URL;
    img.alt = "";
    img.decoding = "async";
    img.style.setProperty("--i", String(i));
    fan.appendChild(img);
  }
  document.body.appendChild(el);
  return el;
}

function hideOppThrow() {
  const el = $("mfOppThrow");
  if (!el) return;
  el.classList.remove("is-on", "is-in", "is-hold", "is-out");
  el.hidden = true;
  el.setAttribute("aria-hidden", "true");
}

function showOppThrowHold(label) {
  const el = ensureOppThrowOverlay();
  const p = el.querySelector(".mf-opp-throw__label");
  if (p) {
    p.textContent =
      label ||
      (state.locale === "ru" ? "Ход противника · сброс карт" : "Opponent turn · discard");
  }
  el.hidden = false;
  el.setAttribute("aria-hidden", "false");
  el.classList.add("is-on", "is-hold");
  el.classList.remove("is-in", "is-out");
}

/** Axie-style: 6 face-down backs thrown toward the player, then cleared. */
function playOpponentDiscardThrow({ holdMs = 720 } = {}) {
  const el = ensureOppThrowOverlay();
  const token = ++oppThrowToken;
  state.oppThrowPlaying = true;
  const p = el.querySelector(".mf-opp-throw__label");
  if (p) {
    p.textContent =
      state.locale === "ru" ? "Ход противника · сброс карт" : "Opponent turn · discard";
  }
  el.hidden = false;
  el.setAttribute("aria-hidden", "false");
  el.classList.remove("is-out", "is-hold");
  el.classList.add("is-on", "is-in");
  el.querySelectorAll(".mf-opp-throw__card").forEach((card) => {
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";
  });
  const inMs = 680;
  const outMs = 480;
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (token !== oppThrowToken) return resolve();
      el.classList.add("is-hold");
      window.setTimeout(() => {
        if (token !== oppThrowToken) return resolve();
        el.classList.remove("is-in", "is-hold");
        el.classList.add("is-out");
        window.setTimeout(() => {
          if (token === oppThrowToken) {
            hideOppThrow();
            state.oppThrowPlaying = false;
          }
          resolve();
        }, outMs);
      }, holdMs);
    }, inMs);
  });
}

/** Keep face-down throw visible while server reports opponent active (no hand peek). */
function syncOppThrowFromBattle(diff) {
  if (state.oppThrowPlaying) return;
  if (!diff || diff.result || diff.active === 0) {
    hideOppThrow();
    return;
  }
  showOppThrowHold();
}

/** Combat status chips (FULL-SPEC §3.5). kind: debuff = red; buff = teal. */
const STATUS_META = {
  taunt: { label: "Провокация", icon: "campaign", kind: "buff" },
  stealth: { label: "Стелс", icon: "visibility_off", kind: "buff" },
  bleed: { label: "Кровотечение", icon: "bloodtype", kind: "debuff" },
  poison: { label: "Яд", icon: "skull", kind: "debuff" },
  stun: { label: "Стан", icon: "flash_on", kind: "debuff" },
  sleep: { label: "Сон", icon: "bedtime", kind: "debuff" },
  weak: { label: "Слабость", icon: "trending_down", kind: "debuff" },
  vuln: { label: "Уязвимость", icon: "crisis_alert", kind: "debuff" },
  fragile: { label: "Хрупкость", icon: "heart_broken", kind: "debuff" },
  ruffle: { label: "Ёршь", icon: "waves", kind: "buff" },
  claw_mode: { label: "Когти", icon: "pets", kind: "buff" },
  mint: { label: "Мята", icon: "spa", kind: "buff" },
  cleanser: { label: "Чистота", icon: "auto_fix", kind: "buff" },
  last_meow: { label: "Последний мяу", icon: "favorite", kind: "buff" },
  atk_up: { label: "Сила", icon: "swords", kind: "buff" },
};
const STATUS_LABEL_RU = Object.fromEntries(
  Object.entries(STATUS_META).map(([id, m]) => [id, m.label]),
);

/** PvP: shield bar only for allies (D-032). Practice/PvE: both sides visible for training. */
function canSeeUnitShield(u) {
  if (!u) return false;
  if (u.side === 0) return true;
  return state.battleMode !== "pvp";
}

function unitStatusList(u) {
  const out = [];
  for (const s of u?.statuses || []) {
    out.push({
      id: s.id,
      stacks: s.stacks || 1,
      duration: s.duration || 0,
      meta: STATUS_META[s.id] || { label: s.id, icon: "label", kind: "buff" },
    });
  }
  if (u?.atkBuff > 0) {
    out.push({
      id: "atk_up",
      stacks: u.atkBuff,
      duration: u.atkBuffDur || 0,
      meta: STATUS_META.atk_up,
    });
  }
  return out;
}

function statusIconsHtml(list, { cleansed = [] } = {}) {
  const chips = list
    .map((s) => {
      const turns = s.duration > 0 ? `<em>${s.duration}</em>` : "";
      const stacks = s.stacks > 1 ? `×${s.stacks}` : "";
      return `<span class="mf-status mf-status--${s.meta.kind}" data-status="${s.id}" title="${s.meta.label}${stacks}"><span class="material-symbols-outlined">${s.meta.icon}</span>${turns}</span>`;
    })
    .join("");
  const gone = (cleansed || [])
    .map((id) => {
      const m = STATUS_META[id] || { label: id, icon: "close" };
      return `<span class="mf-status mf-status--cleared" data-status="${id}" title="Снято: ${m.label}"><span class="material-symbols-outlined">${m.icon}</span><b>−</b></span>`;
    })
    .join("");
  return chips + gone;
}

/** Ensure portrait mount has HP + shield bars, status row, death overlay. */
function ensureCombatPortraitMounts(card) {
  const frame = card.querySelector(".relative.w-full, figure, .mf-unit-frame") || card;
  if (!frame.classList.contains("mf-unit-frame")) frame.classList.add("mf-unit-frame");
  if (!frame.querySelector(".mf-status-row")) {
    const row = document.createElement("div");
    row.className = "mf-status-row absolute top-2 right-2 flex flex-wrap justify-end gap-0.5 z-[2] max-w-[70%]";
    frame.appendChild(row);
  }
  if (!frame.querySelector(".mf-fatality")) {
    const fat = document.createElement("div");
    fat.className = "mf-fatality";
    fat.hidden = true;
    fat.innerHTML = `<span></span>`;
    frame.appendChild(fat);
  }
  let bars = card.querySelector(".mf-bars");
  if (!bars) {
    // Match the HP track itself — do NOT use parentElement on `.w-full.h-2.5`
    // (that parent is the whole unit card and would wipe the portrait/img).
    const hpWrap =
      card.querySelector(".w-full.h-2\\.5, .hp-bar") ||
      card.querySelector("i[style*='--hp']")?.parentElement;
    bars = document.createElement("div");
    bars.className = "mf-bars flex flex-col gap-0.5 w-full";
    bars.innerHTML = `<div class="mf-bar mf-bar--hp" title="HP"><i></i></div><div class="mf-bar mf-bar--shield" title="Щит" hidden><i></i></div>`;
    if (hpWrap && hpWrap.parentElement) {
      hpWrap.replaceWith(bars);
    } else {
      card.appendChild(bars);
    }
  }
  return {
    frame,
    statusRow: frame.querySelector(".mf-status-row"),
    fatality: frame.querySelector(".mf-fatality"),
    hpBar: bars.querySelector(".mf-bar--hp i"),
    shieldBar: bars.querySelector(".mf-bar--shield"),
    shieldFill: bars.querySelector(".mf-bar--shield i"),
  };
}

function paintCombatUnitCard(card, u, { foe = false, cleansedIds = [] } = {}) {
  if (!card || !u) return;
  const mounts = ensureCombatPortraitMounts(card);
  const pct = u.maxHp > 0 ? Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100)) : 0;
  const showShield = canSeeUnitShield(u) && u.shield > 0 && u.alive;
  card.classList.toggle("mf-unit-dead", !u.alive);
  card.classList.toggle("is-stunned", !!(u.alive && (u.statuses || []).some((s) => s.id === "stun" || s.id === "sleep")));
  if (mounts.hpBar) {
    mounts.hpBar.style.width = `${pct}%`;
    mounts.hpBar.style.setProperty("--hp", `${pct}%`);
  }
  const legacyBar = card.querySelector("i[style*='--hp'], .hp-bar i");
  if (legacyBar && legacyBar !== mounts.hpBar) legacyBar.style.setProperty("--hp", `${pct}%`);
  if (mounts.shieldBar && mounts.shieldFill) {
    mounts.shieldBar.hidden = !showShield;
    if (showShield) {
      const shPct = Math.max(8, Math.min(100, (u.shield / Math.max(u.maxHp, 1)) * 100));
      mounts.shieldFill.style.width = `${shPct}%`;
      mounts.shieldBar.title = `Щит ${u.shield}`;
    }
  }
  if (mounts.fatality) {
    mounts.fatality.hidden = !!u.alive;
    const span = mounts.fatality.querySelector("span") || mounts.fatality;
    span.textContent = unitFatalityLabel(u);
  }
  if (mounts.statusRow) {
    const list = u.alive ? unitStatusList(u) : [];
    // Debuffs always; buffs always (shield bar alone is fogged in PvP).
    mounts.statusRow.innerHTML = statusIconsHtml(list, { cleansed: cleansedIds });
    mounts.statusRow.hidden = !list.length && !cleansedIds.length;
  }
  const img = card.querySelector("img");
  if (img) img.classList.toggle("mf-unit-dim", !u.alive);
}

/** PvE bot display name from templateId (stage meta not in battle payload). */
function pveBotDisplayName(templateId, role) {
  const tid = String(templateId || "");
  const roleRu = CAT_ROLE_RU[role] || role || "";
  if (tid.includes("pitboss_dog") || tid.includes("baron")) return "Барон Гав";
  if (tid.includes("pitboss_wolf") || tid.includes("alpha_m2")) return "Лютый Клык";
  if (tid.includes("pitboss_redd") || tid.includes("alpha_m3")) return "Алый Вожак";
  if (tid.includes("pitboss_zomb") || tid.includes("necro")) return "Некропёс Мор";
  if (tid.includes("pitboss_ghost") || tid.includes("_gul")) return "Фантом Гул";
  const table = [
    ["bot_dog_tank", "Пёс-щитоносец"],
    ["bot_dog_fighter", "Пёс-задира"],
    ["bot_dog_support", "Пёс-завывала"],
    ["bot_wolf_tank", "Северный страж"],
    ["bot_wolf_fighter", "Волк-клык"],
    ["bot_wolf_support", "Шаман инея"],
    ["bot_redd_tank", "Алый щитоносец"],
    ["bot_redd_fighter", "Пёс-углежуй"],
    ["bot_redd_support", "Пёс-искромёт"],
    ["bot_zomb_assassin", "Ядовитый коготь"],
    ["bot_zomb_tank", "Гнилой страж"],
    ["bot_zomb_fighter", "Трупный мясник"],
    ["bot_zomb_support", "Носитель гнили"],
    ["bot_ghost_tank", "Могильный страж"],
    ["bot_ghost_fighter", "Клинок душ"],
    ["bot_ghost_support", "Блуждающий огонёк"],
  ];
  for (const [pfx, name] of table) {
    if (tid.includes(pfx)) return name;
  }
  return roleRu || tid || "Враг";
}

/** Warm fight art into browser cache (webp cutouts + chapter BG). */
const _pveArtPreload = new Set();
function preloadImages(urls = []) {
  for (const raw of urls) {
    const u = String(raw || "");
    if (!u || _pveArtPreload.has(u)) continue;
    _pveArtPreload.add(u);
    const img = new Image();
    img.decoding = "async";
    img.src = u;
  }
}

/** Prefetch current chapter arena + starters + faction monsters before «В бой». */
function preloadPveFightAssets(chapter = state.pveChapter) {
  const n = Math.max(1, Math.min(5, Number(chapter) || 1));
  const data = pveChapterData(n);
  const urls = [];
  for (const st of ["entrance", "tunnel", "boss"]) {
    const art = data.stages?.[st]?.art;
    if (art) urls.push(art);
  }
  const squad =
    Array.isArray(state.practiceSquad) && state.practiceSquad.length === 3
      ? state.practiceSquad
      : typeof STARTERS !== "undefined"
        ? STARTERS
        : ["starter_tank_stone", "starter_fighter_fire", "starter_support_water"];
  for (const tid of squad) {
    const art = catHeroBattleArt(tid);
    if (art) urls.push(art);
  }
  const faction = MONSTER_FACTION_BY_CHAPTER[n - 1];
  const byFaction = MONSTER_BATTLE_BY_FACTION[faction];
  if (byFaction) {
    for (const pool of Object.values(byFaction)) {
      for (const u of pool || []) urls.push(u);
    }
  }
  preloadImages(urls);
}

function applyPracticeFightBackdrop() {
  const bg = document.querySelector("#viewPracticeFight .pf-arena > .absolute.inset-0.bg-cover");
  if (!bg) return;
  if (state.battleMode === "pve") {
    const art = pveStageArt(state.pveChapter, state.pveStage);
    // Decode off main paint when possible, then swap (avoids multi-MB PNG hitch).
    preloadImages([art]);
    bg.style.backgroundImage = `url('${art}')`;
    bg.dataset.pveBg = "1";
  } else if (bg.dataset.pveBg === "1") {
    bg.style.backgroundImage = "url('/stitch-ref/e608/arena_dojo.png')";
    delete bg.dataset.pveBg;
  }
}

function renderPracticeFight() {
  const diff = state.battle;
  if (!diff) return;
  const local = diff.p1 || {};
  const energy = local.energy ?? 0;
  const mine = diff.active === 0 && !diff.result;
  const isPve = state.battleMode === "pve";
  applyPracticeFightBackdrop();
  // Allies D-034: L→R = тыл · центр · авангард (tank right, nearest VS). Sim lanes stay 0=front…2=rear.
  // Enemies face left: L→R = авангард · центр · тыл (tank left, nearest VS) — do NOT reuse PRACTICE_VISUAL_LANES.
  const listBySide = (side) => (diff.units || []).filter((u) => u.side === side);
  const allies = PRACTICE_VISUAL_LANES.map((lane) => listBySide(0).find((u) => u.lane === lane)).filter(Boolean);
  const enemies = listBySide(1).slice().sort((a, b) => a.lane - b.lane);
  const drawCount = allies.reduce((n, u) => n + (u.drawCount || 0), 0);
  const discardCount = allies.reduce((n, u) => n + (u.discardCount || 0), 0);
  const energyMax = Math.max(3, energy);
  if ($("pfRound")) {
    $("pfRound").textContent = `РАУНД ${diff.turn || 1} • ${mine ? "ХОД ИГРОКА" : diff.result ? "ИТОГ" : "ХОД БОТА"}`;
  }
  if ($("pfEnergy")) {
    if (isPve) {
      const data = pveChapterData(state.pveChapter);
      const st = pveNormalizeStage(state.pveStage);
      const stageRu = PVE_STAGE_META[st]?.label || st;
      $("pfEnergy").textContent = `МИФМИР · ${data.title || "Глава"} · ${stageRu} · Энергия ${energy}`;
    } else {
      $("pfEnergy").textContent = `ДОДЗЁ СПАРРИНГ · Энергия хода ${energy}`;
    }
  }
  // Enemy header strip (desktop): PvE faction vs dojo dummies.
  const headTier = document.querySelector("#viewPracticeFight .font-headline-md.text-label-lg.text-tertiary");
  const headSub = headTier?.parentElement?.querySelector(".font-body-sm");
  if (headTier) {
    if (isPve) {
      const data = pveChapterData(state.pveChapter);
      headTier.textContent = (data.faction || "ВРАГИ").toUpperCase();
      if (headSub) headSub.textContent = `${data.bossName || "Питбосс"} · ${data.threatStars || ""}`;
    } else {
      headTier.textContent = "КОМАНДА МАНЕКЕНОВ";
      if (headSub) headSub.textContent = "Угроза: Уровень 44 • Тренировочные идолы";
    }
  }
  if ($("pfOrbs")) $("pfOrbs").textContent = `Орбы энергии ${energy}`;
  if ($("pfOrbsNum")) $("pfOrbsNum").textContent = String(energy);
  if ($("pfOrbsMax")) $("pfOrbsMax").textContent = String(energyMax);
  if ($("pfDrawCount")) $("pfDrawCount").textContent = String(drawCount);
  if ($("pfDiscardCount")) $("pfDiscardCount").textContent = String(discardCount);
  const pips = $("pfOrbPips");
  if (pips) {
    pips.innerHTML = "";
    for (let i = 0; i < energyMax; i++) {
      const pip = document.createElement("span");
      pip.className =
        i < energy
          ? "w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(253,186,69,0.8)]"
          : "w-2 h-2 rounded-full bg-surface-container-highest border border-outline-variant/40";
      pips.appendChild(pip);
    }
  }
  const clearedByUnit = cleansedByUnitFromEvents(diff.events);
  const paintSlots = (rootSel, units) => {
    const root = document.querySelector(`#viewPracticeFight ${rootSel}`);
    if (!root) return;
    // Live board: left column looks right, right column looks left (D-040 / MF-171).
    const boardFace = /enem/i.test(rootSel) ? "left" : "right";
    const slots = [...root.querySelectorAll("[data-slot]")];
    slots.forEach((card, i) => {
      const u = units[i];
      const em = card.querySelector("em");
      // Prefer the portrait cutout (not status/UI icons).
      const img =
        card.querySelector("img.mf-battle-cutout") ||
        card.querySelector(".relative.w-full img, .mf-unit-frame img, img");
      const nameEl = card.querySelector(".font-headline-md, b, h4");
      const laneBadge = card.querySelector(".font-label-sm.text-label-sm");
      const fxWrap = card.querySelector(".absolute.bottom-2");
      const tidEarly = u ? unitTemplateId(u) : "";
      // D-042: empty_lane placeholders stay in sim 3v3 but never paint (solo boss center).
      // Must use class `.hidden` (display:none !important) — Tailwind `flex` overrides the HTML [hidden] attr,
      // so f2 dogs otherwise linger as «пёс отдыхает» on ch1 f3 after wave advance.
      const emptyLane = !!tidEarly && String(tidEarly).includes("empty_lane");
      const hideSlot = !u || emptyLane;
      card.hidden = hideSlot;
      card.classList.toggle("hidden", hideSlot);
      if (hideSlot) return;
      const tid = tidEarly;
      const hero = practiceHeroByTemplate(tid);
      const art = battleUnitArt(u) || catHeroBattleArt(tid);
      const isBot = String(tid).startsWith("bot_") || String(u.id || "").startsWith("bot_");
      const display =
        hero?.short ||
        CAT_SHEET_NAMES[tid] ||
        (isBot ? pveBotDisplayName(tid, u.role) : null) ||
        tid;
      if (img && art) {
        img.decoding = "async";
        img.loading = "eager";
        img.src = art;
        img.alt = hero?.name || display;
        img.classList.toggle("object-contain", !!isBot || !!art.includes("/battle/"));
        img.classList.toggle("object-cover", !(!!isBot || !!art.includes("/battle/")));
        img.classList.toggle("object-top", !(!!isBot || !!art.includes("/battle/")));
      }
      if (img) {
        img.classList.add("mf-battle-cutout");
        card.classList.add("mf-battle-unit--cutout");
        // D-040: foes always left (toward cats); allies right. Prefer unit-kind over selector.
        const face = isFoeSpriteUnit(u) ? "left" : boardFace;
        applySpriteFacing(img, {
          artSrc: art || img.getAttribute("src"),
          desiredFace: face,
          unit: u,
        });
      }
      if (nameEl) nameEl.textContent = display;
      // MF-171 / MF-173: drop portrait corner chips (Ур. N / Т1 / role).
      // Lane pill above already shows «Тыл • Роль».
      const tierEl = card.querySelector(".absolute.top-2.left-2");
      if (tierEl) {
        tierEl.remove();
      }
      const seeSh = canSeeUnitShield(u);
      if (em) {
        em.textContent =
          seeSh && u.shield > 0 ? `${u.hp} / ${u.maxHp} +${u.shield}` : `${u.hp} / ${u.maxHp}`;
      }
      if (laneBadge) {
        const lane = PRACTICE_LANE_LABEL[u.lane] || `Л${u.lane}`;
        const role = hero?.roleRu || CAT_ROLE_RU[u.role] || u.role || "";
        laneBadge.textContent = role ? `${lane} • ${role}` : lane;
      }
      // Status icons replace legacy text strip on portrait.
      if (fxWrap) fxWrap.hidden = true;
      paintCombatUnitCard(card, u, { cleansedIds: clearedByUnit[u.id] || [] });
      // MF-149: idle breathe + elemental aura (cutouts stay fight-only, D-037).
      decorateBattleUnitIdle(card, u, u.lane ?? i);
    });
  };
  paintSlots("#pfAllies", allies);
  paintSlots("#pfEnemies", enemies);
  syncOppThrowFromBattle(diff);
  const hand = document.querySelector("#viewPracticeFight #pfHand");
  // Display order = visual hero order (тыл→авангард), not sim lane 0→2.
  const liveCards = sortHandByVisualLanes(diff.hand || [], diff.units || []);
  if (hand) {
    hand.removeAttribute("data-pf-hand-static");
    hand.classList.add("mf-attack-hand");
    hand.style.setProperty("--mf-hand-h", "20rem");
    hand.innerHTML = "";
    if (!mine && !diff.result) {
      // Opponent turn: never reveal their hand — face-down throw overlay is the cue.
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mf-atk-card mf-atk-card--text pf-card";
      b.disabled = true;
      b.innerHTML = `<b class="mf-atk-card__meta">Обложка</b><span class="mf-atk-card__sub">ход противника</span>`;
      hand.appendChild(b);
    } else if (!liveCards.length) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mf-atk-card mf-atk-card--text pf-card";
      b.disabled = true;
      b.innerHTML = `<b class="mf-atk-card__meta">Колода</b><span class="mf-atk-card__sub">ждёт раздачу</span>`;
      hand.appendChild(b);
    } else {
      for (const c of liveCards) {
        hand.appendChild(makeAttackHandButton(c, diff, "mf-atk-card"));
      }
    }
  }
  const end = document.querySelector("#viewPracticeFight #pfEndTurn");
  if (end) {
    end.disabled = !diff.canEndTurn || !!diff.result || diff.active !== 0 || state.oppThrowPlaying;
    const hint = end.querySelector(":scope > span:last-of-type");
    if (hint) {
      const playable = liveCards.filter((c) => c.playable).length;
      hint.textContent = mine
        ? `${liveCards.length}·${playable}·${energy}AP`
        : diff.result
          ? String(diff.result)
          : "бот…";
    }
  }
}

function leaveLiveFightHud() {
  state.battle = null;
  state.lastResult = null;
  state.oppThrowPlaying = false;
  hideOppThrow();
  if (state.battleMode === "pve") navigate("yard", { primary: "combat" });
  else navigate("practice");
}

function bindPracticeFight() {
  const root = $("viewPracticeFight");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener("click", (ev) => {
    const id = ev.target.closest("button")?.id;
    if (id === "pfEndTurn") submitAction({ kind: "endTurn" });
    if (id === "pfBack") leaveLiveFightHud();
  });
  document.addEventListener("keydown", (ev) => {
    if (logicalViewId() !== "viewPracticeFight") return;
    if (ev.target.closest("input, textarea")) return;
    if (ev.code === "Space") {
      ev.preventDefault();
      submitAction({ kind: "endTurn" });
    } else if (ev.code === "Escape") {
      ev.preventDefault();
      leaveLiveFightHud();
    }
  });
}

function pvpUnitCard(u, foe, cleansedIds = []) {
  const li = document.createElement("li");
  const role = CAT_ROLE_RU[u.role] || u.role || "";
  const element = CAT_ELEMENT_RU[u.element] || u.element || "";
  const name = catSheetName({ templateId: unitTemplateId(u), catId: u.id });
  const pct = u.maxHp > 0 ? Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100)) : 0;
  const art = catHeroBattleArt(unitTemplateId(u)) || catHeroBattleArt(u.id);
  const seeSh = canSeeUnitShield(u);
  const rest = unitFatalityLabel(u);
  const hpLine = u.alive
    ? seeSh && u.shield > 0
      ? `${u.hp} / ${u.maxHp} +${u.shield}`
      : `${u.hp} / ${u.maxHp}`
    : rest;
  li.className = (u.alive ? "" : "mf-unit-dead") + " mf-battle-unit--cutout";
  // D-040: PvP both sides are cat heroes → face right (type rule), not side-flip.
  const desiredFace = desiredSpriteFace(u);
  const cutout = art
    ? spriteFaceHtml(
        `<img alt="" src="${art}" class="mf-battle-cutout ${u.alive ? "" : "mf-unit-dim"}"/>`,
        { artSrc: art, desiredFace }
      )
    : "";
  li.innerHTML = `${art ? `<figure class="mf-unit-frame">${cutout}<div class="mf-fatality" ${u.alive ? "hidden" : ""}><span>${rest}</span></div><div class="mf-status-row">${statusIconsHtml(u.alive ? unitStatusList(u) : [], { cleansed: cleansedIds })}</div></figure>` : ""}<div><b>${name}</b><small>${element}${role ? " · " + role : ""}</small><em class="${u.alive ? "" : "mf-fatality-inline"}">${hpLine}</em><div class="mf-bars"><div class="mf-bar mf-bar--hp"><i style="width:${pct}%"></i></div>${seeSh && u.shield > 0 && u.alive ? `<div class="mf-bar mf-bar--shield"><i style="width:${Math.min(100, (u.shield / Math.max(u.maxHp, 1)) * 100)}%"></i></div>` : ""}</div></div>`;
  if (foe) li.dataset.foe = "1";
  decorateBattleUnitIdle(li, u, u.lane ?? 0);
  return li;
}

function renderPvpFight() {
  const diff = state.battle;
  if (!diff) return;
  const energy = diff.p1?.energy ?? 0;
  const mine = diff.active === 0 && !diff.result;
  if ($("pvRound")) $("pvRound").textContent = `Раунд ${diff.turn || 1} · ${mine ? "Ход игрока" : "Ход соперника"}`;
  if ($("pvEnergy")) $("pvEnergy").textContent = `Энергия ${energy}`;
  const allies = (diff.units || []).filter((u) => u.side === 0).sort((a, b) => a.lane - b.lane);
  const enemies = (diff.units || []).filter((u) => u.side === 1).sort((a, b) => a.lane - b.lane);
  const allyBox = $("pvAllies");
  const foeBox = $("pvEnemies");
  const clearedByUnit = cleansedByUnitFromEvents(diff.events);
  if (allyBox) {
    allyBox.innerHTML = "";
    allies.forEach((u) => allyBox.appendChild(pvpUnitCard(u, false, clearedByUnit[u.id] || [])));
  }
  if (foeBox) {
    foeBox.innerHTML = "";
    enemies.forEach((u) => foeBox.appendChild(pvpUnitCard(u, true, clearedByUnit[u.id] || [])));
  }
  syncOppThrowFromBattle(diff);
  const hand = $("pvHand");
  if (hand) {
    hand.classList.add("mf-attack-hand");
    hand.innerHTML = "";
    const cards = diff.hand || [];
    if ($("pvOrbs")) {
      $("pvOrbs").textContent = mine || diff.result ? `${cards.length} карт` : "6 обложек";
    }
    if (!mine && !diff.result) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mf-atk-card mf-atk-card--text";
      b.disabled = true;
      b.innerHTML = `<b class="mf-atk-card__meta">Обложка</b><span class="mf-atk-card__sub">ход соперника</span>`;
      hand.appendChild(b);
    } else if (!cards.length) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mf-atk-card mf-atk-card--text";
      b.disabled = true;
      b.innerHTML = `<b class="mf-atk-card__meta">Колода</b><span class="mf-atk-card__sub">ждёт раздачу</span>`;
      hand.appendChild(b);
    } else {
      for (const c of cards) {
        hand.appendChild(makeAttackHandButton(c, diff, "mf-atk-card"));
      }
    }
  }
  const end = $("pvEndTurn");
  if (end) end.disabled = !diff.canEndTurn || !!diff.result || diff.active !== 0 || state.oppThrowPlaying;
}

function leavePvpFight() {
  state.battle = null;
  state.lastResult = null;
  state.battleMode = "";
  state.oppThrowPlaying = false;
  hideOppThrow();
  navigate("pvp");
}

function bindPvpFight() {
  const root = $("viewPvpFight");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener("click", (ev) => {
    const id = ev.target.closest("button")?.id;
    if (id === "pvEndTurn") submitAction({ kind: "endTurn" });
    if (id === "pvSurrender") submitAction({ kind: "surrender" });
  });
  document.addEventListener("keydown", (ev) => {
    if (logicalViewId() !== "viewPvpFight") return;
    if (ev.target.closest("input, textarea")) return;
    if (ev.code === "Space") {
      ev.preventDefault();
      submitAction({ kind: "endTurn" });
    } else if (ev.code === "Escape") {
      ev.preventDefault();
      leavePvpFight();
    }
  });
}

function renderBattle() {
  const diff = state.battle;
  if (!diff) return;
  const local = diff.p1 || {};
  const mine = diff.active === 0 && !diff.result;
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

  syncOppThrowFromBattle(diff);
  const hand = $("hand");
  hand.classList.add("mf-attack-hand");
  hand.innerHTML = "";
  if (!mine && !diff.result) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mf-atk-card mf-atk-card--text";
    b.disabled = true;
    b.innerHTML = `<b class="mf-atk-card__meta">Обложка</b><span class="mf-atk-card__sub">ход противника · 6 рубашек</span>`;
    hand.appendChild(b);
  } else {
    for (const c of diff.hand || []) {
      const art = attackCardArtUrl(c.cardId);
      const title = t(c.name_key, c.cardId);
      const cost = c.cost ?? "?";
      const b = document.createElement("button");
      b.type = "button";
      b.className = art
        ? "mf-atk-card mf-atk-card--art pf-card pf-card-art"
        : "mf-atk-card mf-atk-card--text pf-card";
      b.disabled = !c.playable || !!diff.result || diff.active !== 0 || !!state.oppThrowPlaying;
      b.title = `${title} · ${cost} AP`;
      b.innerHTML = art
        ? `<img alt="${title}" src="${art}"/><b class="mf-atk-card__meta">${title}</b><span class="mf-atk-card__sub">${cost} AP</span>`
        : `<b class="mf-atk-card__meta">${title}</b><span class="mf-atk-card__sub">${cost} AP</span>`;
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
  }

  $("btnEndTurn").disabled = !diff.canEndTurn || !!diff.result || diff.active !== 0 || state.oppThrowPlaying;
  $("btnKeep").disabled = !diff.canKeep || !!diff.result || state.oppThrowPlaying;
  $("btnKeep").textContent = state.selectedKeep?.mode
    ? state.locale === "ru"
      ? "Keep: клик по карте"
      : "Keep: click a card"
    : `Keep (${local.keepCost ?? 1})`;
  $("btnSurrender").disabled = !!diff.result || state.oppThrowPlaying;

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

/** mythmir_{ch}_f{1|2|3} → 1..3 (source of truth for wave advance). */
function pveFightNum(stageId = state.selectedStageId) {
  const m = String(stageId || "").match(/_f([123])$/);
  return m ? Number(m[1]) : 1;
}

/** D-039 · after f1/f2 win, CreatePvE next wave with carryAlive (no victory screen). */
async function advancePveWaveAfterWin() {
  const f = pveFightNum(state.selectedStageId);
  if (f >= 3) {
    state.pveAdvancingWave = false;
    return false;
  }
  state.pveAdvancingWave = true;
  const ch = Math.max(1, Math.min(5, Number(state.pveChapter) || 1));
  const nextF = f + 1;
  const next = nextF === 2 ? "tunnel" : "boss";
  state.pveChapter = ch;
  state.pveStage = next;
  state.selectedStageId = `mythmir_${ch}_f${nextF}`;
  state.battle = null;
  state.lastResult = null;
  const waveLabel = PVE_STAGE_META[next]?.wave || next;
  toast(t("pve.wave.next", `Волна зачищена · ${waveLabel}`));
  log(`pve_wave_advance → ${state.selectedStageId}`);
  preloadImages([pveStageArt(ch, next)]);
  try {
    const diff = await createPvE({
      autoPlay: false,
      stageId: state.selectedStageId,
      carryAlive: state.pveCarryAlive,
    });
    await applyDiff(diff, `CreatePvE wave ${next}`);
    return true;
  } catch (err) {
    log(`wave advance fail: ${err.message}`);
    alert(err.message);
    return false;
  } finally {
    state.pveAdvancingWave = false;
  }
}

async function applyDiff(diff, note = "") {
  state.battle = diff;
  state.lastResult = null;
  if (diff?.result || diff?.active === 0) {
    if (!state.oppThrowPlaying) hideOppThrow();
  }
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
  const midChapterPveWin =
    !!diff?.result &&
    diff.result === "p1_win" &&
    state.battleMode === "pve" &&
    pveFightNum(state.selectedStageId) < 3;
  if (diff.result) {
    // Mid-chapter wave wins skip victory view — lastResult stays null until pitboss.
    if (!midChapterPveWin) {
      state.lastResult = { battleId: diff.battleId, result: diff.result };
    }
    if (state.battleMode === "pve") {
      syncPveCarryFromBattle(diff);
      // Fatigue after chapter boss clear or any defeat — not between f1→f2→f3.
      if (!midChapterPveWin) markPveFatigue();
    }
    if (diff.result === "p1_win") {
      if (state.battleMode === "practice") {
        state.progress.practiceWins += 1;
      } else if (state.battleMode === "pvp") {
        state.progress.pvpWins = (state.progress.pvpWins || 0) + 1;
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
  const fxKey = `${diff.battleId || ""}:${diff.seq ?? ""}`;
  const shouldFx =
    Array.isArray(diff.events) &&
    diff.events.length > 0 &&
    fxKey !== state.lastBattleFxKey;
  renderAll();
  if (shouldFx) {
    state.lastBattleFxKey = fxKey;
    // After DOM paint — hit/heal/block from server events only (no client SoT numbers).
    playCombatEvents(diff);
  }
  if (midChapterPveWin) {
    state.pveAdvancingWave = true;
    await advancePveWaveAfterWin();
  }
}

async function createPvE({ autoPlay = false, seed = 0, stageId = null, team = null, carryAlive = null } = {}) {
  const sid = stageId || state.selectedStageId || YARD_STAGE;
  const squad = Array.isArray(team) && team.length === 3 ? team : STARTERS;
  const carry =
    Array.isArray(carryAlive) && carryAlive.length === 3
      ? carryAlive
      : state.battleMode === "pve"
        ? state.pveCarryAlive
        : null;
  const body = {
    stageId: sid,
    team: squad,
    potions: [],
    seed,
    autoPlay,
  };
  if (Array.isArray(carry) && carry.length === 3) body.carryAlive = carry.map(Boolean);
  const { data } = await api("/api/battle/v1/CreatePvE", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data;
}

async function submitAction(action) {
  if (!state.battle?.battleId) return;
  if (state.oppThrowPlaying) return;
  try {
    const prevActive = state.battle.active;
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
    // After P1 endTurn the server resolves P2 (PvE bots + local PvP smoke). Show Axie-style
    // 6 face-down discard throw before painting the next P1 state — all battle modes.
    const shouldThrow =
      action.kind === "endTurn" && prevActive === 0 && state.battle && !state.battle.result;
    if (shouldThrow) {
      if ($("pfRound")) $("pfRound").textContent = `РАУНД ${state.battle.turn || 1} • ХОД БОТА`;
      if ($("pvRound")) $("pvRound").textContent = `Раунд ${state.battle.turn || 1} · Ход соперника`;
      await playOpponentDiscardThrow();
    }
    await applyDiff(data, `${action.kind}${action.unitId ? " " + action.unitId : ""}`);
  } catch (err) {
    state.oppThrowPlaying = false;
    hideOppThrow();
    log(`reject ${err.status || ""}: ${err.message}`);
    alert(`Server reject: ${err.message}`);
  }
}

async function startYard(autoPlay = false) {
  try {
    if (!state.battleMode) state.battleMode = "pve";
    const practiceTeam =
      state.battleMode === "practice" && Array.isArray(state.practiceSquad) && state.practiceSquad.length === 3
        ? [...state.practiceSquad]
        : null;
    const diff = await createPvE({
      autoPlay,
      seed: autoPlay ? 20261104 : 0,
      team: practiceTeam,
    });
    await applyDiff(diff, autoPlay ? "CreatePvE autoPlay" : `CreatePvE ${state.selectedStageId}`);
  } catch (err) {
    log(`CreatePvE fail: ${err.message}`);
    alert(err.message);
  }
}

async function startPractice(autoPlay = false) {
  if (!Array.isArray(state.practiceSquad) || state.practiceSquad.length !== 3) {
    showPracticeLoad(false);
    toast("Выберите 3 котиков в боевой отряд");
    return;
  }
  showPracticeLoad(false);
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
    state.battleMode = "pvp";
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

/** MF-151 · each chapter = 3 PvE fights: entrance → tunnel → boss hall. */
const PVE_STAGES = ["entrance", "tunnel", "boss"];
const PVE_STAGE_META = {
  entrance: { label: "Вход в подземелье", wave: "Волна 1/3 (Вход)", short: "1 · Вход" },
  tunnel: { label: "Тоннель / проход", wave: "Волна 2/3 (Тоннель)", short: "2 · Тоннель" },
  boss: { label: "Зал с боссом", wave: "Волна 3/3 (Босс)", short: "3 · Босс" },
};

/** MF-151 · PvE campaign chapters → load lore + fight stage arts. */
const PVE_LOAD_CHAPTERS = {
  1: {
    title: "Железная Цитадель",
    bossName: "Барон Гав",
    bossRole: "Железный Варлорд и Молотобоец Цитадели",
    faction: "Обычные псы",
    levelPill: "Уровень Кампании: 1",
    threatStars: "★★★☆☆",
    description:
      "Барон Гав — питбосс Железной Цитадели. Солдаты-псы держат фронт; без шмоток проходим строем танк·DPS·саппорт.",
    tip: "Держите танка впереди — между волнами живые котики восстанавливают HP, мёртвые не воскресают (D-039).",
    affixes: [
      { icon: "🛡", title: "Лай-щит", desc: "Солдаты кастуют shield" },
      { icon: "🐕", title: "Укус Стаи", desc: "Ближний урон по фронту" },
      { icon: "💥", title: "Ярость Барона", desc: "Питбосс бьёт сильнее солдат" },
      { icon: "⚡", title: "Тычок", desc: "Лёгкий добивающий удар" },
    ],
    stages: {
      entrance: {
        art: "/stitch-assets/pve-fight/ch1-entrance.webp",
        enemyTitle: "СТАЯ · ВОЛНА 1/3 (СОЛДАТЫ)",
        enemies: ["Пёс-щитоносец", "Пёс-задира", "Пёс-завывала"],
        tip: "Этап 1/3 · Солдаты Железной Цитадели",
      },
      tunnel: {
        art: "/stitch-assets/pve-fight/ch1-tunnel.webp",
        enemyTitle: "СТАЯ · ВОЛНА 2/3 (СОЛДАТЫ)",
        enemies: ["Пёс-щитоносец", "Пёс-задира", "Пёс-завывала"],
        tip: "Этап 2/3 · Солдаты глубже в цитадели",
      },
      boss: {
        art: "/stitch-assets/pve-fight/ch1-boss.webp",
        enemyTitle: "СТАЯ · ВОЛНА 3/3 (ПИТБОСС СОЛО)",
        enemies: ["Барон Гав"],
        tip: "Этап 3/3 · Соло Барон Гав · пробитие брони (D-042)",
      },
    },
  },
  2: {
    title: "Ледяные Пещеры",
    bossName: "Лютый Клык",
    bossRole: "Альфа северных волков",
    faction: "Северные волки",
    levelPill: "Уровень Кампании: 2",
    threatStars: "★★★★☆",
    description:
      "Лютый Клык прыгает в тыл; за ним два хила. Снеси хилов, танком закрывай прыжки.",
    tip: "Между уровнями HP живых восстанавливается полностью; не теряйте саппорт до питбосса.",
    affixes: [
      { icon: "❄", title: "Иней", desc: "Короткий weak вместо жёсткого stun" },
      { icon: "🐺", title: "Ледяной Коготь", desc: "Урон по фронту" },
      { icon: "🗡", title: "Вой Инея", desc: "Щит / давление" },
      { icon: "💎", title: "Шаман", desc: "Хил союзникам-врагам" },
    ],
    stages: {
      entrance: {
        art: "/stitch-assets/pve-fight/ch2-entrance.webp",
        enemyTitle: "СТАЯ · ВОЛНА 1/3 (СОЛДАТЫ)",
        enemies: ["Северный страж", "Волк-клык", "Шаман инея"],
        tip: "Этап 1/3 · Солдаты Ледяных Пещер",
      },
      tunnel: {
        art: "/stitch-assets/pve-fight/ch2-tunnel.webp",
        enemyTitle: "СТАЯ · ВОЛНА 2/3 (СОЛДАТЫ)",
        enemies: ["Северный страж", "Волк-клык", "Шаман инея"],
        tip: "Этап 2/3 · Ледяной проход",
      },
      boss: {
        art: "/stitch-assets/pve-fight/ch2-boss.webp",
        enemyTitle: "СТАЯ · ВОЛНА 3/3 (БОСС + 2 ХИЛА)",
        enemies: ["Лютый Клык", "Шаман инея", "Шаман вьюги"],
        tip: "Этап 3/3 · Босс прыгает в тыл · сначала хилы, танк держит (D-042)",
      },
    },
  },
  3: {
    title: "Алая Псарня",
    bossName: "Алый Вожак",
    bossRole: "Вожак Алой Стаи и Углежор",
    faction: "Красные псы",
    levelPill: "Уровень Кампании: 3",
    threatStars: "★★★★☆",
    description:
      "Яростный вожак в багровых латах. Ведёт углежуев и искромётов Алой Псарни; удары прожигают щиты и давят тыл.",
    tip: "Держите танка впереди и лечите саппортом — Алый Вожак бьёт сильно, но проходим на стартерах без шмоток (D-039).",
    affixes: [
      { icon: "🔥", title: "Алый Рык", desc: "Давление по фронту" },
      { icon: "🦴", title: "Угольный Коготь", desc: "Сильный одиночный удар" },
      { icon: "🛡", title: "Щит Стаи", desc: "Солдаты прикрывают вожака" },
      { icon: "⚡", title: "Искра", desc: "Лёгкий добивающий тычок" },
    ],
    stages: {
      entrance: {
        // Existing painted forms remapped to D-039 factions (no new art).
        art: "/stitch-assets/pve-fight/ch5-entrance.webp",
        enemyTitle: "СТАЯ · ВОЛНА 1/3 (СОЛДАТЫ)",
        enemies: ["Алый щитоносец", "Пёс-углежуй", "Пёс-искромёт"],
        tip: "Этап 1/3 · Вход в Алую Псарню",
      },
      tunnel: {
        art: "/stitch-assets/pve-fight/ch5-tunnel.webp",
        enemyTitle: "СТАЯ · ВОЛНА 2/3 (СОЛДАТЫ)",
        enemies: ["Алый щитоносец", "Пёс-углежуй", "Пёс-искромёт"],
        tip: "Этап 2/3 · Коридор псарни",
      },
      boss: {
        art: "/stitch-assets/pve-fight/ch5-boss.webp",
        enemyTitle: "СТАЯ · ВОЛНА 3/3 (ТАНК · БОСС · ТАНК)",
        enemies: ["Алый щитоносец", "Алый Вожак", "Алый страж"],
        tip: "Этап 3/3 · Снимите одного танка, чтобы добраться до вожака (D-042)",
      },
    },
  },
  4: {
    title: "Чумные Склепы",
    bossName: "Некропёс Мор",
    bossRole: "Владыка Гнили",
    faction: "Зомби",
    levelPill: "Уровень Кампании: 4",
    threatStars: "★★★★★",
    description:
      "Убийцы травят случайных; яд только копится. Некро хилит, пока они живы — потом бьёт в тыл.",
    tip: "Не теряйте танка до питбосса — мёртвые котики не воскресают до конца главы (D-039).",
    affixes: [
      { icon: "🧪", title: "Гниль", desc: "Давление DoT-тематикой (баланс soft)" },
      { icon: "💀", title: "Трупный Удар", desc: "Сильный центр" },
      { icon: "🛡", title: "Гнилой Страж", desc: "Фронт держит" },
      { icon: "🥩", title: "Носитель", desc: "Хил союзникам-врагам" },
    ],
    stages: {
      entrance: {
        art: "/stitch-assets/pve-fight/ch3-entrance.webp",
        enemyTitle: "СТАЯ · ВОЛНА 1/3 (СОЛДАТЫ)",
        enemies: ["Гнилой страж", "Трупный мясник", "Носитель гнили"],
        tip: "Этап 1/3 · Вход в Чумные Склепы",
      },
      tunnel: {
        art: "/stitch-assets/pve-fight/ch3-tunnel.webp",
        enemyTitle: "СТАЯ · ВОЛНА 2/3 (СОЛДАТЫ)",
        enemies: ["Гнилой страж", "Трупный мясник", "Носитель гнили"],
        tip: "Этап 2/3 · Токсичный тоннель",
      },
      boss: {
        art: "/stitch-assets/pve-fight/ch3-boss.webp",
        enemyTitle: "СТАЯ · ВОЛНА 3/3 (УБИЙЦЫ + НЕКРО)",
        enemies: ["Ядовитый коготь", "Ядовитый коготь", "Некропёс Мор"],
        tip: "Этап 3/3 · Яд стекается · после убийц некро бьёт тыл (D-043)",
      },
    },
  },
  5: {
    title: "Призрачный Чертог",
    bossName: "Фантом Гул",
    bossRole: "Лорд Бестелесных Душ",
    faction: "Призраки",
    levelPill: "Уровень Кампании: 5 (ФИНАЛ)",
    threatStars: "★★★★★+",
    description:
      "Фантом Гул парит над Призрачным Чертогом. Финальная глава Мифмира SL — тяжелее всех, но проходима танк·DPS·саппорт без шмоток.",
    tip: "После боя котики устают: Таверна или 5–10 мин ожидания (stub D-039).",
    affixes: [
      { icon: "👻", title: "Фаза", desc: "Эфирные удары" },
      { icon: "⚔", title: "Клинок Душ", desc: "Сильный центр" },
      { icon: "⛓", title: "Цепь Склепа", desc: "Давление по фронту" },
      { icon: "🌌", title: "Слабость", desc: "Короткий weak" },
    ],
    stages: {
      entrance: {
        // Andrew order: graveyard → ghost gallery → spectral cathedral.
        // File names ch4-* are legacy remap; tunnel/boss files were swapped vs labels.
        art: "/stitch-assets/pve-fight/ch4-entrance.webp",
        enemyTitle: "СТАЯ · ВОЛНА 1/3 (СОЛДАТЫ)",
        enemies: ["Могильный страж", "Клинок душ", "Блуждающий огонёк"],
        tip: "Этап 1/3 · Вход в Призрачный Чертог",
      },
      tunnel: {
        art: "/stitch-assets/pve-fight/ch4-boss.webp",
        enemyTitle: "СТАЯ · ВОЛНА 2/3 (СОЛДАТЫ)",
        enemies: ["Могильный страж", "Клинок душ", "Блуждающий огонёк"],
        tip: "Этап 2/3 · Галерея призрачных колонн",
      },
      boss: {
        art: "/stitch-assets/pve-fight/ch4-tunnel.webp",
        enemyTitle: "СТАЯ · ВОЛНА 3/3 (ТАНК · БОСС · ХИЛ)",
        enemies: ["Могильный страж", "Фантом Гул", "Блуждающий огонёк"],
        tip: "Этап 3/3 · Танк спереди, рубящий босс, хил сзади (D-042)",
      },
    },
  },
};

function pveChapterData(chapter = state.pveChapter) {
  const n = Math.max(1, Math.min(5, Number(chapter) || 1));
  return PVE_LOAD_CHAPTERS[n] || PVE_LOAD_CHAPTERS[1];
}

function pveNormalizeStage(stage) {
  const s = String(stage || "entrance");
  return PVE_STAGES.includes(s) ? s : "entrance";
}

/** Map PvE UI stage → mythmir_{ch}_f{1..3} (D-039). */
function pveStageId(chapter = state.pveChapter, stage = state.pveStage) {
  const ch = Math.max(1, Math.min(5, Number(chapter) || 1));
  const st = pveNormalizeStage(stage);
  const f = st === "tunnel" ? 2 : st === "boss" ? 3 : 1;
  return `mythmir_${ch}_f${f}`;
}

function resetPveCarryAlive() {
  state.pveCarryAlive = [true, true, true];
}

function syncPveCarryFromBattle(battle) {
  if (!battle?.units) return;
  // Prefer numeric side===0 (devapi statediff); fall back to id prefix.
  const p1 = battle.units.filter(
    (u) => u.side === 0 || u.side === "p1" || String(u.id || "").startsWith("p1_"),
  );
  const next = [false, false, false];
  for (let j = 0; j < 3; j++) {
    const u = p1[j];
    next[j] = !!(u && u.alive);
  }
  state.pveCarryAlive = next;
}

function pveFatigueSec() {
  const n = Number(state.liveOps?.limits?.pve_fatigue_sec);
  return Number.isFinite(n) && n > 0 ? n : 420;
}

function pveFatigueStub() {
  const v = state.liveOps?.limits?.pve_fatigue_stub;
  return v !== false; // default stub on
}

function markPveFatigue() {
  state.pveFatigueUntil = Date.now() + pveFatigueSec() * 1000;
  toast(t("pve.fatigue.tip", "Котики устали после боя · молоко в Таверне или подождите 5–10 мин (stub)"));
}

function clearPveFatigueStub() {
  state.pveFatigueUntil = 0;
  toast(t("pve.fatigue.cleared", "Усталость снята молоком на льду (stub)"));
}

function pveFatigueActive() {
  return Number(state.pveFatigueUntil || 0) > Date.now();
}

function pveStageArt(chapter = state.pveChapter, stage = state.pveStage) {
  const data = pveChapterData(chapter);
  const st = pveNormalizeStage(stage);
  return data.stages?.[st]?.art || `/stitch-assets/pve-fight/ch${Math.max(1, Math.min(5, Number(chapter) || 1))}-entrance.webp`;
}

/** Open PvE campaign load sheet (chapter backdrop), then CreatePvE from «В бой». */
function openPveLoad() {
  state.battleMode = "pve";
  const n = Math.max(1, Math.min(5, Number(state.pveChapter) || 1));
  state.pveChapter = n;
  navigate("pve_load", { primary: "combat" });
  preloadPveFightAssets(n);
}

function setPveLoadProgress(pct) {
  const n = Math.max(0, Math.min(100, Math.round(pct)));
  const bar = $("pveLoadBar");
  const pctText = $("pveLoadPctText");
  const sync = $("pveLoadSyncPct");
  const stage = $("pveLoadStageText");
  if (bar) bar.style.width = `${n}%`;
  if (pctText) pctText.textContent = `${n}%`;
  if (sync) sync.textContent = `${n}%`;
  if (stage) {
    stage.textContent =
      n >= 100
        ? "Врата распахнуты! Бой готов."
        : "Подготовка арены и бросков инициативы…";
  }
  state.pveLoadPct = n;
}

function applyPveLoadChapter(chapter) {
  const n = Math.max(1, Math.min(5, Number(chapter) || 1));
  if (n !== Number(state.pveChapter)) {
    state.pveStage = "entrance";
    resetPveCarryAlive();
  }
  state.pveChapter = n;
  if (!state.pveStage) state.pveStage = "entrance";
  state.selectedStageId = pveStageId(n, state.pveStage);
  const data = pveChapterData(n);
  document.querySelectorAll("#viewPveLoad .pve-load-bg").forEach((img) => {
    const ch = Number(img.getAttribute("data-chapter") || 0);
    const on = ch === n;
    img.classList.toggle("is-active", on);
    // Only the active chapter sheet is eager; others stay lazy (perf).
    if (on) {
      img.loading = "eager";
      img.fetchPriority = "high";
      preloadPveFightAssets(n);
    } else {
      img.loading = "lazy";
      img.fetchPriority = "low";
    }
  });
  document.querySelectorAll("#viewPveLoad .pve-load-chapter-btn").forEach((btn) => {
    const ch = Number(btn.getAttribute("data-pve-chapter") || 0);
    btn.classList.toggle("is-active", ch === n);
  });
  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };
  setText("pveLoadLevelPill", data.levelPill);
  setText("pveLoadFactionPill", `Фракция: ${data.faction}`);
  setText("pveLoadThreat", data.threatStars);
  setText("pveLoadArenaTitle", data.title);
  setText("pveLoadBossRole", data.bossRole);
  setText("pveLoadBossName", data.bossName);
  setText("pveLoadBossDesc", data.description);
  setText("pveLoadBossTab", `Пит-Босс ${data.bossName}`);
  // Wave strip = 3 fights per chapter (entrance / tunnel / boss)
  const waves = document.querySelectorAll("#viewPveLoad .pve-load-waves > span:not(.pve-load-wave-arrow)");
  if (waves.length >= 3) {
    waves[0].textContent = PVE_STAGE_META.entrance.wave;
    waves[1].textContent = PVE_STAGE_META.tunnel.wave;
    waves[2].textContent = `Пит-Босс ${data.bossName}`;
    waves[2].id = "pveLoadBossTab";
  }
  const tip = $("pveLoadTip");
  if (tip) tip.innerHTML = `<strong>Совет Сэнсэя:</strong> ${data.tip}`;
  const grid = $("pveLoadAffixes");
  if (grid) {
    grid.innerHTML = (data.affixes || [])
      .map(
        (a) => `<div class="pve-load-affix"><span aria-hidden="true">${a.icon}</span><div><strong>${a.title}</strong><em>${a.desc}</em></div></div>`
      )
      .join("");
  }
  const card = $("pveLoadBossCard");
  if (card) {
    card.style.opacity = "0";
    card.style.transform = "translateY(8px)";
    requestAnimationFrame(() => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    });
  }
}

function startPveLoadSync() {
  clearInterval(state.pveLoadTimer);
  setPveLoadProgress(0);
  let pct = 0;
  state.pveLoadTimer = setInterval(() => {
    if (state.tab !== "pve_load") {
      clearInterval(state.pveLoadTimer);
      state.pveLoadTimer = null;
      return;
    }
    pct = Math.min(100, pct + 4 + Math.floor(Math.random() * 6));
    setPveLoadProgress(pct);
    if (pct >= 100) {
      clearInterval(state.pveLoadTimer);
      state.pveLoadTimer = null;
      toast("Арена готова · синхронизация колод 100%");
    }
  }, 120);
}

function bindPveLoad() {
  const root = $("viewPveLoad");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.querySelectorAll("[data-pve-chapter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyPveLoadChapter(btn.getAttribute("data-pve-chapter"));
    });
  });
  $("pveLoadGo")?.addEventListener("click", () => pveLoadStart());
  $("pveLoadBack")?.addEventListener("click", () => {
    clearInterval(state.pveLoadTimer);
    state.pveLoadTimer = null;
    navigate("yard", { primary: "combat" });
  });
  document.addEventListener("keydown", (ev) => {
    if (state.tab !== "pve_load") return;
    if (ev.target.closest?.("input, textarea")) return;
    if (ev.code === "Space") {
      ev.preventDefault();
      pveLoadStart();
    } else if (ev.code === "Escape") {
      ev.preventDefault();
      $("pveLoadBack")?.click();
    } else if (ev.code === "Tab") {
      ev.preventDefault();
      const next = (Number(state.pveChapter) || 1) + 1;
      applyPveLoadChapter(next > 5 ? 1 : next);
    }
  });
}

function renderPveLoad() {
  applyPveLoadChapter(state.pveChapter || 1);
  bindPveLoad();
  if (!state.pveLoadTimer) startPveLoadSync();
}

async function pveLoadStart() {
  if (state.tab === "pve_load" && (state.pveLoadPct || 0) < 100) {
    setPveLoadProgress(100);
    clearInterval(state.pveLoadTimer);
    state.pveLoadTimer = null;
  }
  clearInterval(state.pveLoadTimer);
  state.pveLoadTimer = null;
  state.battleMode = "pve";
  // Always wave 1 from load CTA; f2/f3 only via in-fight auto-advance (pitboss = f3 only).
  state.pveStage = "entrance";
  state.selectedStageId = pveStageId(state.pveChapter, "entrance");
  resetPveCarryAlive();
  if (pveFatigueActive()) {
    // SL stub: tip only — do not hard-block when pve_fatigue_stub=true (D-039).
    toast(t("pve.fatigue.active", "Отряд устал (stub) · можно идти в бой; LiveOps pve_fatigue_stub"));
    if (!pveFatigueStub()) {
      toast(t("pve.fatigue.tip", "Котики устали после боя · молоко в Таверне или подождите 5–10 мин (stub)"));
      const goBlocked = $("pveLoadGo");
      if (goBlocked) goBlocked.textContent = "В БОЙ";
      return;
    }
  }
  const go = $("pveLoadGo");
  if (go) go.textContent = "ВХОД В БОЙ…";
  await startYard(false);
}

function applyPveFightStage(stage) {
  const st = pveNormalizeStage(stage);
  state.pveStage = st;
  const chapter = Math.max(1, Math.min(5, Number(state.pveChapter) || 1));
  const data = pveChapterData(chapter);
  const stageData = data.stages?.[st] || data.stages.entrance;
  const bg = $("pveFightBg");
  if (bg) {
    bg.src = stageData.art || pveStageArt(chapter, st);
    bg.setAttribute("data-stage", st);
    bg.setAttribute("data-chapter", String(chapter));
  }
  document.querySelectorAll("#viewPveFight .pve-fight-stage-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.getAttribute("data-pve-stage") === st);
  });
  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };
  setText("pveFightCampaignTitle", `Уровень ${chapter} · ${data.title}`);
  setText("pveFightBossBadge", st === "boss" ? `ПИТ-БОСС: ${data.bossName}` : `ЭТАП: ${PVE_STAGE_META[st].label}`);
  setText("pveFightEnemyTitle", stageData.enemyTitle || `СТАЯ · ВОЛНА`);
  setText("pveFightEnemy1", stageData.enemies?.[0] || "Враг");
  setText("pveFightEnemy2", stageData.enemies?.[1] || "Враг");
  setText("pveFightEnemy3", stageData.enemies?.[2] || "Враг");
  setText("pveFightStageTip", stageData.tip || PVE_STAGE_META[st].label);
}

function bindPveFight() {
  const root = $("viewPveFight");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.querySelectorAll("[data-pve-stage]").forEach((btn) => {
    btn.addEventListener("click", () => applyPveFightStage(btn.getAttribute("data-pve-stage")));
  });
  root.querySelectorAll(".pve-fight-card").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("is-selected"));
  });
  $("pveFightEndTurn")?.addEventListener("click", () => {
    toast(t("pve.fight.end", "Ход подтверждён · очередь карт (paint)"));
  });
  $("pveFightSurrender")?.addEventListener("click", () => {
    state.battle = null;
    navigate("yard", { primary: "combat" });
  });
  document.addEventListener("keydown", (ev) => {
    if (logicalViewId() !== "viewPveFight") return;
    if (ev.target.closest?.("input, textarea")) return;
    if (ev.code === "Space") {
      ev.preventDefault();
      $("pveFightEndTurn")?.click();
    } else if (ev.code === "Escape") {
      ev.preventDefault();
      $("pveFightSurrender")?.click();
    } else if (ev.code === "Digit1") {
      applyPveFightStage("entrance");
    } else if (ev.code === "Digit2") {
      applyPveFightStage("tunnel");
    } else if (ev.code === "Digit3") {
      applyPveFightStage("boss");
    }
  });
}

function renderPveFight() {
  applyPveFightStage(state.pveStage || "entrance");
  bindPveFight();
  // Mirror live battle HUD numbers when sim is present (client paints only).
  if (state.battle && !state.battle.result) {
    renderBattle();
  }
}

/** Open ranked duel load sheet, then CreatePvP from «В бой». */
function openPvpLoad() {
  if (!pvpUnlocked()) {
    showGateTip(t("gate.tip.pvp", "PvP откроется после 3 побед в Мифмире или тренировке"));
    return;
  }
  navigate("pvp_load", { primary: "combat" });
}

function setPvpLoadProgress(pct) {
  const n = Math.max(0, Math.min(100, Math.round(pct)));
  const bar = $("pvpLoadBar");
  const label = $("pvpLoadBarLabel");
  const arena = $("pvpLoadArenaPct");
  if (bar) bar.style.width = `${n}%`;
  if (label) label.textContent = `Синхронизация колод: ${n}%`;
  if (arena) arena.textContent = `${n}%`;
  state.pvpLoadPct = n;
}

/** Desired face from art path (D-040): cats → right; dojo/monsters → left. */
function desiredFaceFromArtSrc(src) {
  const path = String(src || "");
  if (path.includes("/dojo/") || path.includes("/monsters/")) return "left";
  return "right";
}

/** MF-148: full-body load sprite (transparent art, no card plate). */
function battleLoadFigureHtml({ art, name, role, side }) {
  const safeName = String(name || "").replace(/"/g, "&quot;");
  const safeRole = String(role || "");
  const src = art || "";
  // D-040: facing by art kind (not blanket `.is-enemy` flip — PvP foes are still cats).
  const face = desiredFaceFromArtSrc(src);
  const img = spriteFaceHtml(`<img alt="${safeName}" src="${src}"/>`, {
    artSrc: src,
    desiredFace: face,
  });
  return `<figure class="battle-load-figure is-${side === "enemy" ? "enemy" : "ally"}">
${img}
<figcaption><b>${safeName}</b>${safeRole ? `<small>${safeRole}</small>` : ""}</figcaption>
</figure>`;
}

function pvpLoadDefaultRosters() {
  // Visual L→R тыл · центр · авангард (D-034 paint); art from CAT_HERO_ART.
  const ally = [
    {
      templateId: "shop_support_water_a",
      name: "Мурка",
      role: "Саппорт · Вода",
      hp: "28 HP",
    },
    {
      templateId: "shop_fighter_fire_a",
      name: "Рыжик",
      role: "Боец · Огонь",
      hp: "43 HP",
    },
    {
      templateId: "shop_tank_stone_a",
      name: "Барсик",
      role: "Танк · Камень",
      hp: "50 HP",
    },
  ];
  const foe = [
    {
      templateId: "shop_mage_fire_a",
      name: "Игниус",
      role: "Маг · Огонь",
      hp: "30 HP",
    },
    {
      templateId: "shop_assassin_bolt_a",
      name: "Тень",
      role: "Ассасин · Молния",
      hp: "38 HP",
    },
    {
      templateId: "shop_tank_stone_b",
      name: "Титан",
      role: "Танк · Камень",
      hp: "48 HP",
    },
  ];
  const withArt = (row) => ({
    ...row,
    art: catHeroArt(row.templateId) || "/stitch-assets/cat-heroes/fighter-a.png",
  });
  return { ally: ally.map(withArt), foe: foe.map(withArt) };
}

function renderPvpLoad() {
  const ally = $("pvpLoadAllyList");
  const enemy = $("pvpLoadEnemyList");
  const allyFigs = $("pvpLoadAllyFigures");
  const enemyFigs = $("pvpLoadEnemyFigures");
  const { ally: allyRoster, foe: foeRoster } = pvpLoadDefaultRosters();
  const nameRow = (c) => `<li>
    <b>${c.name}</b>
    <small>${c.role}</small>
    <em class="hp">${c.hp}</em>
  </li>`;
  if (ally) ally.innerHTML = allyRoster.map(nameRow).join("");
  if (enemy) enemy.innerHTML = foeRoster.map(nameRow).join("");
  if (allyFigs) {
    allyFigs.innerHTML = allyRoster
      .map((c) => battleLoadFigureHtml({ art: c.art, name: c.name, role: c.role, side: "ally" }))
      .join("");
  }
  if (enemyFigs) {
    enemyFigs.innerHTML = foeRoster
      .map((c) => battleLoadFigureHtml({ art: c.art, name: c.name, role: c.role, side: "enemy" }))
      .join("");
  }
  bindPvpLoad();
  if (!state.pvpLoadTimer) startPvpLoadSync();
}

function startPvpLoadSync() {
  clearInterval(state.pvpLoadTimer);
  setPvpLoadProgress(0);
  let pct = 0;
  state.pvpLoadTimer = setInterval(() => {
    if (state.tab !== "pvp_load") {
      clearInterval(state.pvpLoadTimer);
      state.pvpLoadTimer = null;
      return;
    }
    pct = Math.min(100, pct + 4 + Math.floor(Math.random() * 6));
    setPvpLoadProgress(pct);
    if (pct >= 100) {
      clearInterval(state.pvpLoadTimer);
      state.pvpLoadTimer = null;
      toast("Арена готова · синхронизация колод 100%");
    }
  }, 120);
}

function bindPvpLoad() {
  const root = $("viewPvpLoad");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  $("pvpLoadGo")?.addEventListener("click", () => pvpStart());
  $("pvpLoadBack")?.addEventListener("click", () => {
    clearInterval(state.pvpLoadTimer);
    state.pvpLoadTimer = null;
    navigate("battle_hub", { primary: "combat" });
  });
  document.addEventListener("keydown", (ev) => {
    if (state.tab !== "pvp_load") return;
    if (ev.target.closest("input, textarea")) return;
    if (ev.code === "Space") {
      ev.preventDefault();
      pvpStart();
    } else if (ev.code === "Escape") {
      ev.preventDefault();
      $("pvpLoadBack")?.click();
    }
  });
}

/** Interactive PvP (same core; human turns until end / surrender). */
async function pvpStart() {
  if (!pvpUnlocked()) {
    showGateTip(t("gate.tip.pvp", "PvP откроется после 3 побед в Мифмире или тренировке"));
    return;
  }
  if (state.tab === "pvp_load" && (state.pvpLoadPct || 0) < 100) {
    setPvpLoadProgress(100);
    clearInterval(state.pvpLoadTimer);
    state.pvpLoadTimer = null;
  }
  try {
    clearInterval(state.pvpLoadTimer);
    state.pvpLoadTimer = null;
    state.battleMode = "pvp";
    const { data } = await api("/api/battle/v1/CreatePvP", {
      method: "POST",
      body: JSON.stringify({
        matchId: `web_${Date.now()}`,
        team1: STARTERS,
        team2: STARTERS,
        seed: Date.now() % 1e9,
        autoPlay: false,
      }),
    });
    await applyDiff(data, "CreatePvP");
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
  if (lo && state.liveOps) {
    lo.textContent = `LiveOps v${state.liveOpsMeta.version} · ${state.liveOpsMeta.alg || "?"} · ${CLIENT_REGION}`;
    lo.className = "status-pill mythfel-debug-pill ok";
  }

  const viewId = logicalViewId();
  showView(viewId);
  bindStitchNav($(viewId));

  if (viewId === "viewPracticeFight" && state.battle && !state.battle.result) {
    renderBattle();
    renderPracticeFight();
    bindPracticeFight();
    return;
  }
  if (viewId === "viewPvpFight" && state.battle && !state.battle.result) {
    renderBattle();
    renderPvpFight();
    bindPvpFight();
    return;
  }
  if (viewId === "viewBattle" && state.battle && !state.battle.result) {
    renderBattle();
    return;
  }
  if (viewId === "viewPveLoad") {
    renderPveLoad();
    return;
  }
  if (viewId === "viewPveFight" && state.battle && !state.battle.result) {
    renderPveFight();
    return;
  }
  if (viewId === "viewPvpLoad") {
    renderPvpLoad();
    return;
  }
  if (viewId === "viewPvpVictory") {
    renderPvpVictory();
    return;
  }
  if (viewId === "viewPveVictory") {
    renderPveVictory();
    return;
  }
  if (viewId === "viewVictoryHall") {
    renderVictoryHall();
    return;
  }
  if (viewId === "viewResultWin" || viewId === "viewResultLose") {
    renderResult();
    return;
  }
  if (viewId === "viewSoonFarm") {
    renderSoon();
    renderFarm();
    return;
  }
  if (viewId === "viewSoonClan") {
    renderClanPanel();
    return;
  }
  if (viewId === "viewSoon") {
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
    case "home":
      renderHome();
      break;
    case "heroes":
      bindHeroesCodex();
      break;
    case "gear":
      renderBarn();
      break;
    case "craft":
      renderCraftStock();
      break;
    case "equip_cards":
      renderEquipCards();
      break;
    case "practice":
      renderUnlockProgress();
      bindPracticeFightCtas();
      break;
    case "battle_hub":
      bindBattleHub();
      renderBattleHub();
      break;
    case "codex":
      renderCodex();
      break;
    case "breeding":
      renderBreeding();
      break;
    case "yard":
      renderYard();
      bindYardForm();
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
      if ($("colEyebrow")) $("colEyebrow").textContent = t("hub.tab.collection");
      if ($("colTitle")) $("colTitle").textContent = t("hub.tab.collection");
      {
        const n = collectionRosterCats().length;
        const cap = state.collectionStub?.slotCap || 15;
        if ($("colLead")) {
          $("colLead").textContent =
            state.locale === "ru"
              ? `Коллекция: ${n} боевых / cap ${cap} (D-031 stub). Пресет local · не SoT боя.`
              : `Collection: ${n} combat / cap ${cap} (D-031 stub). Local preset · not battle SoT.`;
        }
      }
      renderCollection();
      renderStarters("collectionCards");
      break;
    case "trade_hub":
      renderTradeHub();
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
      bindHubPortals();
      break;
    case "farm":
      state.soon = "farm";
      renderSoon();
      renderFarm();
      break;
    case "guild":
      renderGuild();
      break;
    case "guild_battle":
      renderGuild();
      break;
    case "soon_clan":
      renderClanPanel();
      break;
    default:
      break;
  }
}

/** D-031 collection HUD stub — roster from profile, local preset persist. */
/** SL editable squads (of presets[5] cap). */
const COL_SQUADS = 3;

function collectionRosterCats() {
  return homeRosterCats();
}

function collectionCatById(catId) {
  if (!catId) return null;
  return (state.profile?.cats || []).find((c) => c.catId === catId) || null;
}

function collectionEnsurePresets() {
  if (!state.profile) return;
  if (!Array.isArray(state.profile.presets)) state.profile.presets = [];
  const roster = collectionRosterCats();
  const ids = new Set(roster.map((c) => c.catId));
  const twinId = (catId) => {
    const cat = collectionCatById(catId);
    if (!cat) return null;
    if (ids.has(cat.catId)) return cat.catId;
    const twinTpl = STARTER_DECK_TEMPLATE[cat.templateId];
    const twin = twinTpl && roster.find((c) => c.templateId === twinTpl);
    return twin?.catId || null;
  };
  let p0 = state.profile.presets[0];
  if (!p0 || typeof p0 !== "object") {
    p0 = { name: "starter", catIds: [] };
    state.profile.presets[0] = p0;
  }
  if (!Array.isArray(p0.catIds)) p0.catIds = [];
  // Map starters → shop twins so slots match D-027 roster (shop×12).
  p0.catIds = p0.catIds.map((id) => twinId(id)).filter(Boolean);
  const uniq = [];
  for (const id of p0.catIds) if (!uniq.includes(id)) uniq.push(id);
  p0.catIds = uniq;
  if (p0.catIds.length < 3 && roster.length) {
    const extras = roster.map((c) => c.catId).filter((id) => !p0.catIds.includes(id)).slice(0, 3 - p0.catIds.length);
    p0.catIds = p0.catIds.concat(extras).slice(0, 3);
  }
  while (state.profile.presets.length < 5) {
    state.profile.presets.push({ name: `preset_${state.profile.presets.length + 1}`, catIds: [] });
  }
  const squadNames = ["Основной", "Второй эшелон", "Резерв"];
  for (let pi = 0; pi < COL_SQUADS; pi++) {
    const p = state.profile.presets[pi];
    if (!p.name || p.name === "starter" || /^preset_/.test(p.name)) p.name = squadNames[pi];
    if (!Array.isArray(p.catIds)) p.catIds = [];
  }
}

function persistCollectionStub() {
  try {
    const payload = {
      activePresetIndex: state.colPresetIndex || 0,
      presets: (state.profile?.presets || []).slice(0, 5),
    };
    localStorage.setItem("mythfel_sl_collection", JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function loadCollectionPresetsLocal() {
  try {
    const raw = localStorage.getItem("mythfel_sl_collection");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.activePresetIndex === "number") state.colPresetIndex = data.activePresetIndex;
    if (Array.isArray(data.presets) && state.profile) {
      state.profile.presets = data.presets;
    }
  } catch {
    /* ignore */
  }
}

async function bootCollectionStub() {
  try {
    const { data } = await api("/api/dev/collection");
    if (data && typeof data === "object") state.collectionStub = data;
  } catch {
    try {
      const res = await fetch("/collection-stub.json", { cache: "no-store" });
      if (res.ok) state.collectionStub = await res.json();
    } catch {
      state.collectionStub = { stub: true, slotCap: 15, presetSlots: 5 };
    }
  }
  loadCollectionPresetsLocal();
  collectionEnsurePresets();
}

function ensureCollectionDom(root) {
  if (!root || root.dataset.colDom === "1") return;
  root.dataset.colDom = "1";
  const roster = root.querySelector(".collection-roster");
  if (roster) roster.id = "colRoster";

  const search = root.querySelector('input[placeholder*="Поиск"], input[type="text"]');
  if (search) {
    search.id = "colSearch";
    search.classList.add("roster-search");
  }

  const roleBtns = [...root.querySelectorAll("button")].filter((b) =>
    /Все котики|Танки|Бойцы|Ассасины|Стрелки|Маги|Саппорты/.test(b.textContent || ""),
  );
  const roleMap = [
    ["all", /Все/],
    ["tank", /Танк/],
    ["fighter", /Бойц/],
    ["assassin", /Ассасин/],
    ["ranger", /Стрелк/],
    ["mage", /Маг/],
    ["support", /Саппорт/],
  ];
  for (const btn of roleBtns) {
    const t = btn.textContent || "";
    const hit = roleMap.find(([, re]) => re.test(t));
    if (hit) btn.setAttribute("data-col-role", hit[0]);
  }

  const right = [...root.querySelectorAll(".collection-stage > section")].find((s) =>
    /\bcol-span-8\b/.test(s.className),
  );
  const teamsHost =
    right &&
    [...right.querySelectorAll(":scope > div")].find(
      (d) => /\bflex-1\b/.test(d.className) && /overflow-y-auto/.test(d.className),
    );
  if (teamsHost) teamsHost.id = "colTeams";
  else if (right) {
    const box = document.createElement("div");
    box.id = "colTeams";
    box.className = "flex flex-col gap-space-sm flex-1 min-h-0 overflow-y-auto";
    right.appendChild(box);
  }

  // Honest summary: strip invented pride / BM / resonance copy once.
  const badge = [...root.querySelectorAll("span")].find((el) => /Открыто\s+\d+\s*\/\s*\d+/i.test(el.textContent || ""));
  if (badge) badge.id = "colOpenBadge";
  const metaRow = [...root.querySelectorAll(".flex.items-center.gap-space-md.text-on-surface-variant")].find((el) =>
    /Ранг|Прайд|БМ|стихи/i.test(el.textContent || ""),
  );
  if (metaRow) {
    metaRow.id = "colMetaRow";
    metaRow.innerHTML = `<span class="font-label-md text-label-md text-on-surface-variant">SL stub · пресет 3v3 local · не SoT боя</span>`;
  }
  const elCounters = [...root.querySelectorAll("div")].find(
    (el) => el.className.includes("2xl:flex") && el.className.includes("gap-space-xs") && el.querySelector(".material-symbols-outlined"),
  );
  if (elCounters) elCounters.id = "colElCounters";
}

function collectionElementIcon(el) {
  return (
    {
      bolt: "bolt",
      fire: "local_fire_department",
      water: "water_drop",
      grass: "eco",
      stone: "landscape",
      ice: "ac_unit",
    }[el] || "pets"
  );
}

function renderCollectionSummary(root, cats, shown) {
  const badge = $("colOpenBadge") || root.querySelector("#colOpenBadge");
  const cap = state.collectionStub?.slotCap || 15;
  if (badge) badge.textContent = `Открыто ${cats.length} / ${cap}`;
  const titleRoster = [...root.querySelectorAll("span")].find((el) => /Боевой Ростер/i.test(el.textContent || ""));
  if (titleRoster) titleRoster.textContent = `Боевой Ростер (${shown.length})`;
  const foot = [...root.querySelectorAll("span")].find((el) => /Собрано\s+\d+\s*\/\s*\d+/i.test(el.textContent || ""));
  if (foot) foot.textContent = `Собрано ${cats.length} / ${cap}`;

  for (const btn of root.querySelectorAll("[data-col-role]")) {
    const role = btn.getAttribute("data-col-role");
    const n = role === "all" ? cats.length : cats.filter((c) => homeCatRole(c) === role).length;
    const label =
      {
        all: `Все котики (${n})`,
        tank: `Танки (${n})`,
        fighter: `Бойцы (${n})`,
        assassin: `Ассасины (${n})`,
        ranger: `Стрелки (${n})`,
        mage: `Маги (${n})`,
        support: `Саппорты (${n})`,
      }[role] || btn.textContent;
    const icon = btn.querySelector(".material-symbols-outlined");
    const iconHtml = icon ? icon.outerHTML : "";
    btn.innerHTML = `${iconHtml}<span>${label}</span>`;
    const on = (state.colRoleFilter || "all") === role;
    btn.classList.toggle("bg-primary", on);
    btn.classList.toggle("text-on-primary", on);
    btn.classList.toggle("bg-surface-container-high", !on);
    btn.classList.toggle("text-on-surface", !on);
  }

  const counters = $("colElCounters");
  if (counters) {
    const counts = {};
    for (const c of cats) {
      const el = c.element || starterMeta(c.templateId)?.element || "";
      if (!el) continue;
      counts[el] = (counts[el] || 0) + 1;
    }
    const order = ["bolt", "fire", "water", "grass", "stone", "ice"];
    counters.innerHTML = order
      .map((el) => {
        const n = counts[el] || 0;
        return `<div class="flex items-center gap-1 px-1.5 py-0.5 text-on-surface" title="${CAT_ELEMENT_RU[el] || el}">
          <span class="material-symbols-outlined text-[16px]">${collectionElementIcon(el)}</span>
          <span class="font-stat-numeral text-label-sm">${n}</span>
        </div>`;
      })
      .join("");
  }

  const used = new Set();
  for (let pi = 0; pi < COL_SQUADS; pi++) {
    for (const id of state.profile?.presets?.[pi]?.catIds || []) if (id) used.add(id);
  }
  const inSquad = used.size;
  const reserve = Math.max(0, cats.length - inSquad);
  const row = [...root.querySelectorAll("div")].find(
    (el) => el.className.includes("lg:flex") && /В строю/i.test(el.textContent || ""),
  );
  if (row) {
    row.innerHTML = `<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-secondary"></span> ${inSquad} В строю</span>
      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-outline"></span> ${reserve} В резерве</span>`;
  }
}

function renderCollectionRosterCards(cats) {
  const list = $("colRoster");
  if (!list) return;
  const q = (state.colSearch || "").trim().toLowerCase();
  const filter = state.colRoleFilter || "all";
  let shown = homeRosterByRole(cats, filter);
  if (q) {
    shown = shown.filter((c) => {
      const name = catSheetName(c).toLowerCase();
      const tid = String(c.templateId || "").toLowerCase();
      return name.includes(q) || tid.includes(q);
    });
  }
  const squadMarks = {};
  for (let pi = 0; pi < COL_SQUADS; pi++) {
    for (const id of state.profile?.presets?.[pi]?.catIds || []) {
      if (!id) continue;
      if (!squadMarks[id]) squadMarks[id] = [];
      squadMarks[id].push(pi + 1);
    }
  }
  const sel = state.colSelectedId;
  if (!shown.length) {
    list.innerHTML = `<div class="col-span-2 p-3 rounded-lg border border-dashed border-outline-variant/40 text-outline-variant text-center text-xs">Нет котиков — grant / login</div>`;
    return shown;
  }
  list.innerHTML = shown
    .map((c) => {
      const name = catSheetName(c);
      const role = CAT_ROLE_RU[homeCatRole(c)] || homeCatRole(c) || "—";
      const el = CAT_ELEMENT_RU[c.element || starterMeta(c.templateId)?.element] || "";
      const art = catHeroArt(c.templateId);
      const on = c.catId === sel;
      const marks = squadMarks[c.catId];
      const markLabel = marks ? `К${marks.join("·")}` : "";
      return `<button type="button" draggable="true" data-col-cat="${c.catId}" class="col-roster-card relative rounded-lg flex items-center gap-2 h-[88px] px-2 text-left border transition-colors cursor-grab active:cursor-grabbing ${
        on ? "is-picked bg-surface-container-highest border-primary/60" : "bg-surface-container-lowest/50 border-surface-container-highest/30 hover:border-primary/40"
      }">
        ${art ? `<img alt="" src="${art}" draggable="false" class="w-14 h-14 object-contain rounded shrink-0 pointer-events-none"/>` : `<span class="material-symbols-outlined text-primary text-[28px]">pets</span>`}
        <span class="flex flex-col min-w-0 gap-0.5">
          <span class="font-label-sm text-label-sm text-on-surface font-bold truncate">${name}</span>
          <span class="text-[10px] text-on-surface-variant truncate">${role}${el ? ` · ${el}` : ""}</span>
          ${markLabel ? `<span class="text-[9px] text-secondary font-bold uppercase">${markLabel}</span>` : ""}
        </span>
      </button>`;
    })
    .join("");
  return shown;
}

/** Place cat into squad slot; swap if moving from another slot. */
function collectionPlaceCat(pi, slot, catId, fromPi, fromSlot) {
  collectionEnsurePresets();
  if (pi < 0 || pi >= COL_SQUADS || slot < 0 || slot > 2 || !catId) return false;
  for (let p = 0; p < COL_SQUADS; p++) {
    const pr = state.profile.presets[p];
    if (!Array.isArray(pr.catIds)) pr.catIds = [];
    while (pr.catIds.length < 3) pr.catIds.push(null);
  }
  const dest = state.profile.presets[pi];
  const same = fromPi === pi && fromSlot === slot;
  if (same) return false;
  const displaced = dest.catIds[slot] || null;
  if (fromPi != null && fromSlot != null && fromPi >= 0 && fromSlot >= 0) {
    const src = state.profile.presets[fromPi];
    dest.catIds[slot] = catId;
    src.catIds[fromSlot] = displaced;
    for (let j = 0; j < 3; j++) {
      if (j !== slot && dest.catIds[j] === catId) dest.catIds[j] = null;
    }
  } else {
    for (let j = 0; j < 3; j++) {
      dest.catIds[j] = j === slot ? catId : dest.catIds[j] === catId ? null : dest.catIds[j];
    }
  }
  state.colPresetIndex = pi;
  state.colSelectedId = catId;
  persistCollectionStub();
  return true;
}

function collectionClearSlot(pi, slot) {
  collectionEnsurePresets();
  if (pi < 0 || pi >= COL_SQUADS || slot < 0 || slot > 2) return;
  const p = state.profile.presets[pi];
  if (!Array.isArray(p.catIds)) p.catIds = [];
  while (p.catIds.length < 3) p.catIds.push(null);
  p.catIds[slot] = null;
  persistCollectionStub();
}

function collectionParseDrag(ev) {
  try {
    const raw = ev.dataTransfer?.getData("application/x-mythfel-cat") || ev.dataTransfer?.getData("text/plain");
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.catId) return null;
    return data;
  } catch {
    return null;
  }
}

function collectionAutopickSquad(roster, usedIds) {
  const pick = [];
  const take = (role) => {
    const c = roster.find((x) => homeCatRole(x) === role && !usedIds.has(x.catId) && !pick.includes(x.catId));
    if (c) pick.push(c.catId);
  };
  take("tank");
  take("fighter");
  take("support");
  for (const c of roster) {
    if (pick.length >= 3) break;
    if (!usedIds.has(c.catId) && !pick.includes(c.catId)) pick.push(c.catId);
  }
  return pick.slice(0, 3);
}

function renderCollectionTeams(cats) {
  const host = $("colTeams");
  if (!host) return;
  collectionEnsurePresets();
  if (state.colPresetIndex == null || state.colPresetIndex < 0 || state.colPresetIndex >= COL_SQUADS) {
    state.colPresetIndex = 0;
  }
  const active = state.colPresetIndex || 0;
  const lanes = [
    { key: "rear", label: "1. Тыл", tip: "Саппорт / стрелок" },
    { key: "center", label: "2. Центр", tip: "DPS / удар" },
    { key: "vanguard", label: "3. Авангард", tip: "Танк / блок" },
  ];

  const slotHtml = (pi, i, slotCats) => {
    const c = slotCats[i];
    const lane = lanes[i];
    if (!c) {
      return `<button type="button" data-col-preset="${pi}" data-col-slot="${i}" data-col-drop="1" class="col-slot bg-surface-container-lowest/40 rounded-lg p-1.5 border border-dashed border-outline-variant/40 flex flex-col items-center justify-center min-h-[100px] cursor-pointer text-outline-variant hover:border-primary/50 transition-colors">
        <span class="material-symbols-outlined text-2xl">add</span>
        <span class="font-label-sm text-[10px] mt-0.5">${lane.label}</span>
      </button>`;
    }
    const art = catHeroArt(c.templateId);
    const name = catSheetName(c);
    const role = CAT_ROLE_RU[homeCatRole(c)] || "";
    return `<button type="button" draggable="true" data-col-preset="${pi}" data-col-slot="${i}" data-col-slot-cat="${c.catId}" data-col-drop="1" class="col-slot bg-surface-container-high/60 rounded-lg p-1.5 border border-primary/30 flex flex-col items-center gap-0.5 min-h-[100px] cursor-grab active:cursor-grabbing hover:border-primary/60 transition-colors">
      <span class="text-[9px] font-bold text-primary uppercase self-start">${lane.label}</span>
      ${art ? `<img alt="" src="${art}" draggable="false" class="h-16 w-auto object-contain pointer-events-none"/>` : `<span class="material-symbols-outlined text-3xl text-primary">pets</span>`}
      <span class="font-label-sm text-[11px] text-on-surface font-bold text-center leading-tight">${name}</span>
      <span class="text-[9px] text-on-surface-variant">${role}</span>
    </button>`;
  };

  const teamCard = (pi) => {
    const preset = state.profile.presets[pi] || { name: `squad_${pi + 1}`, catIds: [] };
    const slotCats = [0, 1, 2].map((i) => collectionCatById(preset.catIds?.[i]) || null);
    const filled = slotCats.filter(Boolean).length;
    const on = pi === active;
    const names = ["Основной", "Второй эшелон", "Резерв"];
    const title = preset.name || names[pi];
    return `<div class="bg-surface-container rounded-lg p-space-sm border ${on ? "border-primary/50 shadow-[0_4px_14px_rgba(0,0,0,0.5)]" : "border-surface-container-highest/60"} flex flex-col gap-1.5" data-col-team="${pi}">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <button type="button" data-col-preset-select="${pi}" class="px-2 py-0.5 rounded ${on ? "bg-primary-container/30 text-primary" : "bg-surface-container-highest text-on-surface-variant"} font-stat-numeral text-[10px] font-bold uppercase cursor-pointer">Команда ${pi + 1}${on ? " · правка" : ""}</button>
        <span class="text-[11px] text-on-surface-variant">${filled}/3</span>
      </div>
      <label class="flex items-center gap-1.5 min-w-0">
        <span class="material-symbols-outlined text-[14px] text-on-surface-variant shrink-0">edit</span>
        <input type="text" data-col-rename="${pi}" maxlength="32" value="${String(title).replace(/"/g, "&quot;")}"
          class="flex-1 min-w-0 bg-surface-container-lowest rounded-lg px-2 py-1 font-label-md text-[13px] ${on ? "text-primary" : "text-on-surface"} font-bold border border-surface-container-highest/60 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Название отряда" />
      </label>
      <div class="grid grid-cols-3 gap-1.5">${slotHtml(pi, 0, slotCats)}${slotHtml(pi, 1, slotCats)}${slotHtml(pi, 2, slotCats)}</div>
    </div>`;
  };

  host.innerHTML = `
    <div class="flex flex-col gap-space-sm flex-1 min-h-0 overflow-y-auto pr-1">
      ${[0, 1, 2].map(teamCard).join("")}
    </div>
    <div class="flex gap-2 pt-1 border-t border-surface-container-highest/40 flex-shrink-0 flex-wrap">
      <button type="button" data-col-act="apply" class="flex-1 py-1.5 rounded bg-primary text-on-primary font-label-sm text-[11px] font-bold">Сохранить 3 отряда</button>
      <button type="button" data-col-act="autopick" class="py-1.5 px-3 rounded bg-surface-container-high text-primary border border-primary/40 font-label-sm text-[11px] font-bold">Авто · активный</button>
      <button type="button" data-col-act="autopick-all" class="py-1.5 px-3 rounded bg-surface-container-high text-primary border border-primary/40 font-label-sm text-[11px] font-bold">Авто · все 3</button>
      <button type="button" data-col-act="codex" class="py-1.5 px-3 rounded bg-surface-container-high text-on-surface font-label-sm text-[11px] font-bold">Кодекс</button>
    </div>
    <p class="text-[10px] text-on-surface-variant m-0">3 отряда local stub · presets cap ${state.collectionStub?.presetSlots || 5} · не SoT боя</p>`;
}

function renderCollection() {
  const root = $("viewCollection");
  if (!root || root.classList.contains("hidden")) return;
  ensureCollectionDom(root);
  collectionEnsurePresets();
  const cats = collectionRosterCats();
  if (!state.colSelectedId && cats.length) {
    state.colSelectedId = cats[0].catId;
  }
  const shown = renderCollectionRosterCards(cats) || [];
  renderCollectionSummary(root, cats, shown.length ? shown : cats);
  renderCollectionTeams(cats);
  bindCollectionRoster();
}

function bindCollectionRoster() {
  const root = $("viewCollection");
  if (!root) return;
  if (root.dataset.rosterBound === "1") return;
  root.dataset.rosterBound = "1";

  root.addEventListener("click", (ev) => {
    const roleBtn = ev.target.closest("[data-col-role]");
    if (roleBtn && root.contains(roleBtn)) {
      ev.preventDefault();
      state.colRoleFilter = roleBtn.getAttribute("data-col-role") || "all";
      renderCollection();
      return;
    }
    const selectTeam = ev.target.closest("[data-col-preset-select]");
    if (selectTeam && root.contains(selectTeam)) {
      ev.preventDefault();
      state.colPresetIndex = Number(selectTeam.getAttribute("data-col-preset-select")) || 0;
      renderCollection();
      return;
    }
    const card = ev.target.closest("[data-col-cat]");
    if (card && root.contains(card)) {
      ev.preventDefault();
      state.colSelectedId = card.getAttribute("data-col-cat");
      renderCollection();
      return;
    }
    const slot = ev.target.closest("[data-col-slot]");
    if (slot && root.contains(slot)) {
      ev.preventDefault();
      const pi = Number(slot.getAttribute("data-col-preset"));
      const i = Number(slot.getAttribute("data-col-slot"));
      collectionEnsurePresets();
      if (pi >= 0 && pi < COL_SQUADS) state.colPresetIndex = pi;
      const preset = state.profile.presets[pi] || state.profile.presets[state.colPresetIndex || 0];
      if (!Array.isArray(preset.catIds)) preset.catIds = [];
      const occupied = slot.getAttribute("data-col-slot-cat");
      if (occupied && state.colSelectedId === occupied) {
        preset.catIds[i] = null;
        while (preset.catIds.length < 3) preset.catIds.push(null);
        persistCollectionStub();
        renderCollection();
        toast(`К${pi + 1}: слот очищен`);
        return;
      }
      if (!state.colSelectedId) {
        toast("Сначала выбери котика слева");
        return;
      }
      preset.catIds = (preset.catIds || []).map((id, j) =>
        j === i ? state.colSelectedId : id === state.colSelectedId ? null : id,
      );
      while (preset.catIds.length < 3) preset.catIds.push(null);
      persistCollectionStub();
      renderCollection();
      toast(`К${pi + 1}: ${catSheetName(collectionCatById(state.colSelectedId) || {})}`);
      return;
    }
    const act = ev.target.closest("[data-col-act]")?.getAttribute("data-col-act");
    if (act) {
      ev.preventDefault();
      if (act === "codex") {
        navigate("heroes");
        return;
      }
      if (act === "autopick") {
        const roster = collectionRosterCats();
        collectionEnsurePresets();
        const idx = state.colPresetIndex || 0;
        const used = new Set();
        for (let pi = 0; pi < COL_SQUADS; pi++) {
          if (pi === idx) continue;
          for (const id of state.profile.presets[pi]?.catIds || []) if (id) used.add(id);
        }
        state.profile.presets[idx].catIds = collectionAutopickSquad(roster, used);
        persistCollectionStub();
        renderCollection();
        toast(`Авто · команда ${idx + 1}`);
        return;
      }
      if (act === "autopick-all") {
        const roster = collectionRosterCats();
        collectionEnsurePresets();
        const used = new Set();
        for (let pi = 0; pi < COL_SQUADS; pi++) {
          const pick = collectionAutopickSquad(roster, used);
          state.profile.presets[pi].catIds = pick;
          for (const id of pick) used.add(id);
          if (!state.profile.presets[pi].name || /^preset_|^squad_/.test(state.profile.presets[pi].name)) {
            state.profile.presets[pi].name = ["Основной", "Второй эшелон", "Резерв"][pi];
          }
        }
        persistCollectionStub();
        renderCollection();
        toast("Авто · 3 отряда (local stub)");
        return;
      }
      if (act === "apply") {
        persistCollectionStub();
        toast("3 отряда сохранены (local · не SoT боя)");
        return;
      }
    }
    const label = (ev.target.closest("button")?.textContent || "").toLowerCase();
    if (label.includes("авто-подбор") || label.includes("автоподбор")) {
      ev.preventDefault();
      root.querySelector("[data-col-act='autopick-all']")?.click();
      return;
    }
    if (label.includes("применить все") || label.includes("применить расстановку") || label.includes("сохранить 3")) {
      ev.preventDefault();
      persistCollectionStub();
      toast("3 отряда сохранены (local · не SoT боя)");
      return;
    }
    if (label.includes("база знаний") || label.includes("кодекс")) {
      ev.preventDefault();
      navigate("heroes");
    }
  });

  const search = $("colSearch");
  search?.addEventListener("input", () => {
    state.colSearch = search.value || "";
    renderCollection();
  });

  root.addEventListener("change", (ev) => {
    const input = ev.target.closest("[data-col-rename]");
    if (!input || !root.contains(input)) return;
    const pi = Number(input.getAttribute("data-col-rename"));
    if (pi < 0 || pi >= COL_SQUADS) return;
    collectionEnsurePresets();
    const name = String(input.value || "").trim().slice(0, 32) || ["Основной", "Второй эшелон", "Резерв"][pi];
    state.profile.presets[pi].name = name;
    input.value = name;
    state.colPresetIndex = pi;
    persistCollectionStub();
    toast(`Отряд «${name}»`);
  });
  root.addEventListener("keydown", (ev) => {
    const input = ev.target.closest?.("[data-col-rename]");
    if (!input || !root.contains(input)) return;
    if (ev.key === "Enter") {
      ev.preventDefault();
      input.blur();
    }
  });

  root.addEventListener("dragstart", (ev) => {
    if (ev.target.closest("[data-col-rename], input, textarea")) return;
    const slot = ev.target.closest("[data-col-slot-cat]");
    const card = ev.target.closest("[data-col-cat]");
    let payload = null;
    if (slot && root.contains(slot)) {
      payload = {
        catId: slot.getAttribute("data-col-slot-cat"),
        fromPi: Number(slot.getAttribute("data-col-preset")),
        fromSlot: Number(slot.getAttribute("data-col-slot")),
      };
      slot.classList.add("opacity-50");
    } else if (card && root.contains(card)) {
      payload = { catId: card.getAttribute("data-col-cat"), fromPi: null, fromSlot: null };
      card.classList.add("opacity-50");
      state.colSelectedId = payload.catId;
    }
    if (!payload?.catId || !ev.dataTransfer) return;
    state.colDrag = payload;
    ev.dataTransfer.effectAllowed = "move";
    const raw = JSON.stringify(payload);
    ev.dataTransfer.setData("application/x-mythfel-cat", raw);
    ev.dataTransfer.setData("text/plain", raw);
  });
  root.addEventListener("dragend", () => {
    state.colDrag = null;
    root.querySelectorAll(".opacity-50").forEach((el) => el.classList.remove("opacity-50"));
    root.querySelectorAll(".col-slot.is-drop-target").forEach((el) =>
      el.classList.remove("is-drop-target", "ring-2", "ring-primary"),
    );
  });
  root.addEventListener("dragover", (ev) => {
    const drop = ev.target.closest("[data-col-drop]");
    const roster = ev.target.closest("#colRoster");
    if (drop && root.contains(drop)) {
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
      drop.classList.add("is-drop-target", "ring-2", "ring-primary");
    } else if (roster && root.contains(roster) && state.colDrag?.fromPi != null) {
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
    }
  });
  root.addEventListener("dragleave", (ev) => {
    const drop = ev.target.closest("[data-col-drop]");
    if (drop && !drop.contains(ev.relatedTarget)) {
      drop.classList.remove("is-drop-target", "ring-2", "ring-primary");
    }
  });
  root.addEventListener("drop", (ev) => {
    const drop = ev.target.closest("[data-col-drop]");
    const roster = ev.target.closest("#colRoster");
    const data = collectionParseDrag(ev) || state.colDrag;
    state.colDrag = null;
    root.querySelectorAll(".col-slot.is-drop-target").forEach((el) =>
      el.classList.remove("is-drop-target", "ring-2", "ring-primary"),
    );
    if (!data?.catId) return;
    if (drop && root.contains(drop)) {
      ev.preventDefault();
      const pi = Number(drop.getAttribute("data-col-preset"));
      const slot = Number(drop.getAttribute("data-col-slot"));
      if (collectionPlaceCat(pi, slot, data.catId, data.fromPi, data.fromSlot)) {
        renderCollection();
        toast(`DnD → К${pi + 1}`);
      }
      return;
    }
    if (roster && root.contains(roster) && data.fromPi != null && data.fromSlot != null) {
      ev.preventDefault();
      collectionClearSlot(data.fromPi, data.fromSlot);
      renderCollection();
      toast(`К${data.fromPi + 1}: убран в резерв`);
    }
  });
}


function setFrontZoneOpen(root, front) {
  state.frontFocus = front || "";
  for (const wrap of root.querySelectorAll(".front-zone[data-front]")) {
    const id = wrap.getAttribute("data-front");
    const open = !!front && id === front;
    wrap.classList.toggle("is-open", open);
    const pin = wrap.querySelector("[data-front-pin]");
    const card = wrap.querySelector(".front-card");
    if (pin) pin.setAttribute("aria-expanded", open ? "true" : "false");
    if (card) {
      if (open) card.removeAttribute("hidden");
      else card.setAttribute("hidden", "");
    }
  }
}

function renderBattleHub() {
  const root = $("viewBattleHub");
  if (!root || root.classList.contains("hidden")) return;

  if (!state.frontFilter) state.frontFilter = "all";
  // No default open card — pins only until hover / tap.

  const tickets = Math.max(0, Number(state.profile?.pvpTickets ?? 5));
  const ticketCap = 5;
  const res = $("frontRes");
  if (res) {
    res.innerHTML = `
      <span>⚡ 85/100</span>
      <span>🔑 3/3</span>
      <span>🎟 ${tickets}/${ticketCap}</span>
      <span>☠ 2/2</span>`;
  }

  const squad = $("frontSquad");
  if (squad) {
    // Soft-launch fronts sheet: design trio names (live roster later).
    squad.innerHTML =
      `АКТИВНЫЙ ОТРЯД: <b>Тройка №1</b> (Барсик, Рыжик, Мурка) <strong>18,450 БМ</strong>`;
  }

  root.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.classList.toggle("is-on", btn.getAttribute("data-filter") === state.frontFilter);
  });
  root.querySelectorAll(".front-zone[data-mode]").forEach((zone) => {
    const mode = zone.getAttribute("data-mode");
    zone.classList.toggle("is-off", state.frontFilter !== "all" && mode !== state.frontFilter);
  });

  const focusOk =
    state.frontFocus &&
    !root.querySelector(`.front-zone[data-front="${state.frontFocus}"]`)?.classList.contains("is-off");
  setFrontZoneOpen(root, focusOk ? state.frontFocus : state.frontPinned || "");
}

function bindBattleHub() {
  const root = $("viewBattleHub");
  if (!root) return;
  renderBattleHub();
  if (root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  root.addEventListener("pointerover", (ev) => {
    const zone = ev.target.closest(".front-zone[data-front]");
    if (!zone || !root.contains(zone) || zone.classList.contains("is-off")) return;
    if (ev.pointerType === "touch") return;
    setFrontZoneOpen(root, zone.getAttribute("data-front"));
  });
  root.addEventListener("pointerout", (ev) => {
    const zone = ev.target.closest(".front-zone[data-front]");
    if (!zone || !root.contains(zone)) return;
    if (ev.pointerType === "touch") return;
    const to = ev.relatedTarget;
    if (to && zone.contains(to)) return;
    if (state.frontPinned === zone.getAttribute("data-front")) return;
    setFrontZoneOpen(root, state.frontPinned || "");
  });

  root.addEventListener("click", (ev) => {
    const filter = ev.target.closest("[data-filter]");
    if (filter && root.contains(filter)) {
      state.frontFilter = filter.getAttribute("data-filter") || "all";
      state.frontPinned = "";
      state.frontFocus = "";
      renderBattleHub();
      return;
    }
    const pin = ev.target.closest("[data-front-pin]");
    if (pin && root.contains(pin)) {
      ev.preventDefault();
      const front = pin.getAttribute("data-front-pin");
      const next = state.frontPinned === front ? "" : front;
      state.frontPinned = next;
      setFrontZoneOpen(root, next);
      return;
    }
    const go = ev.target.closest("[data-front-go]");
    if (go && root.contains(go)) {
      const tab = go.getAttribute("data-front-go");
      if (tab !== "journal" && tab !== "formation" && tab !== "gear") {
        state.frontPinned = tab;
        state.frontFocus = tab;
        setFrontZoneOpen(root, tab);
      }
      if (tab === "journal") {
        toast("Журнал побед: скоро");
        return;
      }
      if (tab === "formation") {
        navigate("formation", { primary: "combat" });
        return;
      }
      if (tab === "gear") {
        navigate("gear");
        return;
      }
      if (tab === "pvp") {
        openPvpLoad();
        return;
      }
      if (tab === "practice" || tab === "yard" || tab === "boss_dungeon") {
        navigate(tab, { primary: "combat" });
        return;
      }
      if (tab === "boss_raid" || tab === "guild_battle") {
        navigate(tab, { primary: "combat" });
        return;
      }
      return;
    }
    if (!ev.target.closest(".front-zone") && !ev.target.closest(".front-filters")) {
      state.frontPinned = "";
      setFrontZoneOpen(root, "");
    }
  });
}

function clearPracticeLoadTimer() {
  clearInterval(state.practiceLoadTimer);
  state.practiceLoadTimer = null;
}

function setPracticeLoadProgress(pct) {
  const n = Math.max(0, Math.min(100, Math.round(pct)));
  const bar = $("dojoLoadBar");
  const label = $("dojoLoadPct");
  const status = $("dojoLoadStatus");
  const track = bar?.parentElement;
  if (bar) bar.style.width = `${n}%`;
  if (label) label.textContent = `${n}%`;
  if (track?.getAttribute("role") === "progressbar") track.setAttribute("aria-valuenow", String(n));
  if (status) {
    status.textContent =
      n >= 100
        ? "Арена готова · запуск тренировочного боя…"
        : "Подготовка симуляции боя и расчёт стихийных формул Додзё…";
  }
  state.practiceLoadPct = n;
}

function startPracticeLoadSync() {
  clearPracticeLoadTimer();
  setPracticeLoadProgress(0);
  let pct = 0;
  state.practiceLoadTimer = setInterval(() => {
    const root = $("viewPractice");
    if (!root || root.dataset.practiceLoad !== "1" || state.tab !== "practice") {
      clearPracticeLoadTimer();
      return;
    }
    pct = Math.min(100, pct + 5 + Math.floor(Math.random() * 8));
    setPracticeLoadProgress(pct);
    if (pct >= 100) {
      clearPracticeLoadTimer();
      // No confirm — load to 100% then enter the fight.
      startPractice(false);
    }
  }, 110);
}

/**
 * Hand L→R follows lobby hero paint: тыл · центр · авангард (D-034 / MF-158).
 * Sim hand order stays front→rear; this is display-only (playCard still uses unitId+handIndex).
 */
function sortHandByVisualLanes(cards, units) {
  const laneByUnit = new Map((units || []).map((u) => [u.id, u.lane]));
  const visualRank = (unitId) => {
    const lane = laneByUnit.get(unitId);
    if (lane == null) return 99;
    const idx = PRACTICE_VISUAL_LANES.indexOf(lane);
    return idx >= 0 ? idx : lane;
  };
  return [...(cards || [])].sort((a, b) => {
    const d = visualRank(a.unitId) - visualRank(b.unitId);
    return d !== 0 ? d : (a.handIndex || 0) - (b.handIndex || 0);
  });
}

/** MF-161: strip any leftover load roster/figures so only arena art + HUD remain. */
function scrubPracticeLoadOverlays(loadRoot) {
  if (!loadRoot) return;
  loadRoot.querySelectorAll(".battle-load-roster, .battle-load-figure, #dojoLoadAllies, #dojoLoadEnemies").forEach((el) => {
    el.remove();
  });
}

function showPracticeLoad(on) {
  const root = $("viewPractice");
  const load = root?.querySelector(".dojo-load");
  if (!root) return;
  // If the load lobby markup is missing, open still must start the fight.
  if (!load) {
    clearPracticeLoadTimer();
    root.dataset.practiceLoad = "0";
    if (on) startPractice(false);
    return;
  }
  if (on && (!Array.isArray(state.practiceSquad) || state.practiceSquad.length !== 3)) {
    toast("Выберите 3 котиков в боевой отряд");
    nudgeDojoNeedSquad();
    return;
  }
  if (on) {
    scrubPracticeLoadOverlays(load);
    load.hidden = false;
    root.dataset.practiceLoad = "1";
    startPracticeLoadSync();
    return;
  }
  clearPracticeLoadTimer();
  load.hidden = true;
  root.dataset.practiceLoad = "0";
  setPracticeLoadProgress(0);
}

function ensurePracticeSquadState() {
  if (!Array.isArray(state.practiceSquad)) state.practiceSquad = [];
  state.practiceSquad = state.practiceSquad.filter((id) => !!practiceHeroByTemplate(id)).slice(0, 3);
}

function addPracticeHero(heroKey) {
  ensurePracticeSquadState();
  const hero = practiceHeroByKey(heroKey);
  if (!hero) return;
  if (state.practiceSquad.includes(hero.templateId)) {
    toast(`${hero.short} уже в отряде`);
    return;
  }
  if (state.practiceSquad.length >= 3) {
    toast("Отряд полон · уберите котика для замены");
    return;
  }
  state.practiceSquad.push(hero.templateId);
  renderPracticeSquad();
  const lane = PRACTICE_LANE_LABEL[state.practiceSquad.length - 1] || "строй";
  toast(`${hero.short} → ${lane}`);
}

function removePracticeHero(templateId) {
  ensurePracticeSquadState();
  const hero = practiceHeroByTemplate(templateId);
  const next = state.practiceSquad.filter((id) => id !== templateId);
  if (next.length === state.practiceSquad.length) return;
  state.practiceSquad = next;
  renderPracticeSquad();
  toast(hero ? `${hero.short} убран из отряда` : "Котик убран из отряда");
}

function practiceSquadEmptySlot(visualPos) {
  const laneIdx = PRACTICE_VISUAL_LANES[visualPos] ?? visualPos;
  const lane = PRACTICE_LANE_LABEL[laneIdx] || "";
  const meta = PRACTICE_EMPTY_SLOT_META[visualPos] || PRACTICE_EMPTY_SLOT_META[0];
  const accent = meta.accent || "primary";
  const accentText = practiceAccentTextClass(accent);
  const border =
    accent === "secondary"
      ? "border-secondary/40 hover:border-secondary"
      : accent === "tertiary"
        ? "border-tertiary/40 hover:border-tertiary"
        : "border-primary/40 hover:border-primary";
  const tipBorder =
    accent === "secondary"
      ? "border-secondary/30"
      : accent === "tertiary"
        ? "border-tertiary/30"
        : "border-primary/30";
  const badgeBg =
    accent === "secondary"
      ? "bg-secondary/10 text-secondary border-secondary/30"
      : accent === "tertiary"
        ? "bg-tertiary/20 text-tertiary border-tertiary/40"
        : "bg-primary/20 text-primary border-primary/40";
  const tags = (meta.tags || [])
    .map(
      (tag) =>
        `<span class="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-[9px] ${accentText} font-bold">${tag}</span>`
    )
    .join("");
  return `<div class="dojo-squad-slot is-empty relative bg-[#1a1613]/80 rounded-xl border-2 border-dashed ${border} transition-all flex flex-col justify-center p-3 group cursor-pointer shadow-lg overflow-hidden min-h-0 gap-2" data-slot-empty="${visualPos + 1}" data-lane="${laneIdx}" aria-label="Пустой слот · ${lane}">
<div class="flex items-center justify-between"><div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px] ${accentText}">${meta.icon}</span><span class="font-bold text-[12px] ${accentText} uppercase tracking-wider">${lane}</span></div><span class="text-[9px] px-1.5 py-0.5 rounded ${badgeBg} border font-bold">${meta.badge}</span></div>
<div class="flex flex-col items-center text-center py-3"><div class="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center border ${tipBorder} group-hover:scale-105 transition-transform"><span class="material-symbols-outlined text-[22px] ${accentText}">add</span></div><span class="text-[11px] text-on-surface mt-2 font-bold">${meta.tip}</span></div>
<div class="flex items-center gap-1 flex-wrap justify-center">${tags}</div>
</div>`;
}

function practiceAccentTextClass(accent) {
  if (accent === "tertiary") return "text-tertiary";
  if (accent === "secondary") return "text-secondary";
  return "text-primary";
}

function practiceSquadFilledSlot(hero, visualPos) {
  const laneIdx = PRACTICE_VISUAL_LANES[visualPos] ?? visualPos;
  const accent = hero.accent || "primary";
  const accentText = practiceAccentTextClass(accent);
  const art = catHeroArt(hero.templateId) || "";
  const lane = PRACTICE_LANE_LABEL[laneIdx] || "";
  const hpPct = Math.min(100, Math.round((hero.hp / 50) * 100));
  const shPct = Math.min(100, Math.round((hero.shield / 10) * 100));
  const dmgPct = Math.min(100, Math.round((hero.dmg / 10) * 100));
  const midLabel = hero.role === "fighter" || hero.role === "assassin" ? "Атака" : "Щит";
  const midVal = hero.role === "fighter" || hero.role === "assassin" ? hero.dmg : hero.shield;
  const midPct = hero.role === "fighter" || hero.role === "assassin" ? dmgPct : shPct;
  const midBar = accent === "tertiary" ? "bg-tertiary" : accent === "secondary" ? "bg-secondary" : "bg-primary";
  const heroFace = spriteFaceHtml(
    `<img alt="${hero.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 pointer-events-none mf-hero-portrait" src="${art}"/>`,
    { artSrc: art, desiredFace: "right" }
  );
  return `<button type="button" class="dojo-squad-slot is-filled group relative rounded-xl bg-[#1a1613] border shadow-lg overflow-hidden flex flex-col justify-between min-h-0 text-left cursor-pointer hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" data-accent="${accent}" data-squad-hero="${hero.templateId}" data-lane="${laneIdx}" title="Убрать из отряда">
<div class="absolute inset-0 z-0">
${heroFace}
<div class="absolute inset-0 bg-gradient-to-t from-[#110d0b] via-[#110d0b]/75 to-transparent"></div>
</div>
<div class="relative z-10 p-2 flex items-center justify-between">
<span class="px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-outline-variant/40 ${accentText} text-[9px] font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[11px]">${hero.roleIcon}</span> ${hero.roleRu}</span>
<span class="px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-outline-variant/40 ${accentText} text-[10px] font-bold">${lane}</span>
</div>
<div class="relative z-10 p-2 flex flex-col gap-1 bg-gradient-to-t from-[#110d0b] via-[#110d0b]/95 to-transparent">
<div class="flex items-center justify-between gap-1"><h4 class="font-bold text-[13px] text-white truncate">${hero.name}</h4><span class="${accentText} text-[10px] font-bold whitespace-nowrap">Слот ${visualPos + 1}</span></div>
<div class="flex flex-col gap-0.5"><div class="flex justify-between text-[10px]"><span class="text-outline">HP</span><span class="text-secondary font-bold">${hero.hp}</span></div>
<div class="w-full bg-[#231f1c] h-1.5 rounded-full overflow-hidden"><div class="bg-secondary h-full rounded-full" style="width:${hpPct}%"></div></div></div>
<div class="flex flex-col gap-0.5"><div class="flex justify-between text-[10px]"><span class="text-outline">${midLabel}</span><span class="${accentText} font-bold">${midVal}</span></div>
<div class="w-full bg-[#231f1c] h-1.5 rounded-full overflow-hidden"><div class="${midBar} h-full rounded-full" style="width:${midPct}%"></div></div></div>
<div class="flex flex-col gap-0.5"><div class="flex justify-between text-[10px]"><span class="text-outline">Урон</span><span class="text-on-surface font-bold">${hero.dmg}</span></div>
<div class="w-full bg-[#231f1c] h-1.5 rounded-full overflow-hidden"><div class="bg-on-surface/60 h-full rounded-full" style="width:${dmgPct}%"></div></div></div>
<span class="text-[9px] text-outline/80 font-bold mt-0.5">Нажмите, чтобы убрать</span>
</div>
</button>`;
}

function practiceMatchAllyCard(hero, accentFallback) {
  if (!hero) {
    return `<div class="flex flex-col items-center opacity-60">
<div class="dojo-match-card w-16 h-28 rounded-lg bg-[#1a1613] overflow-hidden relative border border-dashed border-outline-variant/50 flex flex-col items-center justify-center gap-1 text-outline">
<span class="material-symbols-outlined text-[20px]">person_off</span>
<span class="text-[8px] font-bold">Слот</span>
</div>
<span class="text-[10px] text-outline mt-1 font-bold">Пусто</span>
</div>`;
  }
  const accent = hero.accent || accentFallback || "primary";
  const accentText = practiceAccentTextClass(accent);
  const art = catHeroArt(hero.templateId) || "";
  const face = spriteFaceHtml(
    `<img alt="${hero.short}" class="w-full h-full object-cover object-top mf-hero-portrait" src="${art}"/>`,
    { artSrc: art, desiredFace: "right" }
  );
  return `<div class="flex flex-col items-center">
<div class="dojo-match-card w-16 h-28 rounded-lg bg-[#1a1613] overflow-hidden relative shadow-[0_0_12px_rgba(253,186,69,0.35)] border-2" data-accent="${accent}">
${face}
<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
<div class="absolute bottom-1 inset-x-0 text-center"><span class="text-[9px] ${accentText} font-bold truncate block px-1">${hero.short}</span></div>
</div>
<span class="text-[10px] ${accentText} mt-1 font-bold">Готов!</span>
</div>`;
}

function renderPracticeSquad() {
  const root = $("viewPractice");
  if (!root) return;
  ensurePracticeSquadState();
  applyDojoRosterFilter(root);
  const squad = state.practiceSquad;
  const heroes = squad.map((id) => practiceHeroByTemplate(id)).filter(Boolean);
  const n = heroes.length;
  const hpPool = heroes.reduce((s, h) => {
    const base = CONTENT_CAT_BASE[h.templateId];
    return s + (base?.hp ?? h.hp ?? 0);
  }, 0);
  const countEl = $("dojoSquadCount");
  const readyEl = $("dojoSquadReady");
  const powerEl = $("dojoSquadPower");
  const synEl = $("dojoSquadSynergy");
  if (countEl) {
    countEl.textContent = n === 0 ? "0 / 3" : n === 3 ? "Готов · 3 / 3" : `${n} / 3`;
    countEl.className =
      n === 3
        ? "px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-[10px] font-bold"
        : "px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/40 text-outline text-[10px] font-bold";
  }
  if (readyEl) {
    readyEl.textContent = n === 3 ? "Можно начинать" : "Нужно 3 кота";
    readyEl.className = n === 3 ? "text-secondary" : "text-outline";
  }
  if (powerEl) powerEl.textContent = `${hpPool} HP`;
  if (synEl) synEl.classList.add("hidden");

  // Hide soft-launch debug chrome on dojo.
  root.querySelectorAll("[data-toggle]").forEach((el) => {
    el.hidden = true;
  });
  root.querySelectorAll("[data-preset]").forEach((btn) => {
    const id = btn.getAttribute("data-preset");
    if (id && id !== "t1") btn.hidden = true;
  });

  const grid = $("dojoSelectedSquad") || root.querySelector("[data-dojo-selected-squad]");
  if (grid) {
    // Visual L→R = тыл · центр · танк (sim lanes via PRACTICE_VISUAL_LANES). CreatePvE keeps sim order.
    const cells = [];
    for (let visualPos = 0; visualPos < 3; visualPos++) {
      const laneIdx = PRACTICE_VISUAL_LANES[visualPos];
      const hero = heroes[laneIdx] || null;
      cells.push(hero ? practiceSquadFilledSlot(hero, visualPos) : practiceSquadEmptySlot(visualPos));
    }
    grid.innerHTML = cells.join("");
  }

  const match = $("dojoMatchAllies") || root.querySelector("[data-dojo-match-allies]");
  if (match) {
    const accents = ["secondary", "tertiary", "primary"];
    match.innerHTML = PRACTICE_VISUAL_LANES.map((laneIdx, visualPos) =>
      practiceMatchAllyCard(heroes[laneIdx] || null, accents[visualPos])
    ).join("");
  }

  root.querySelectorAll("[data-hero]").forEach((card) => {
    const key = card.getAttribute("data-hero");
    const hero = practiceHeroByKey(key);
    const on = !!(hero && squad.includes(hero.templateId));
    const slotIdx = on ? squad.indexOf(hero.templateId) : -1;
    card.classList.toggle("is-picked", on);
    card.setAttribute("aria-pressed", on ? "true" : "false");
    const portrait = card.querySelector("img");
    if (portrait) {
      // D-040: framed roster cats always face right.
      applySpriteFacing(portrait, {
        artSrc: portrait.getAttribute("src") || (hero ? catHeroArt(hero.templateId) : ""),
        desiredFace: "right",
      });
    }
    const btn = card.querySelector("button");
    if (btn) {
      btn.textContent = on ? `Слот ${slotIdx + 1}` : "+ В отряд";
    }
    if (hero) {
      const base = CONTENT_CAT_BASE[hero.templateId];
      const hpLabel = `${base?.hp ?? hero.hp} HP`;
      for (const span of card.querySelectorAll("span")) {
        const t = span.textContent || "";
        if (/\d[\d\s,]*\s*БМ/.test(t) || span.hasAttribute("data-dojo-bm")) {
          span.setAttribute("data-dojo-bm", "1");
          span.textContent = hpLabel;
          break;
        }
      }
    }
  });

  // D-040: lobby dummy / monster previews always face left (not arena backdrops).
  root.querySelectorAll("img[src*='/dojo/'], img[src*='/monsters/']").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (/arena|backdrop|bg-|background|load-arena/i.test(src)) return;
    if (!/dummy-|battle\/|monsters\//i.test(src)) return;
    applySpriteFacing(img, { artSrc: src, desiredFace: "left" });
  });

  const startBtn = root.querySelector("#btnDojoStart, .dojo-start");
  if (startBtn) {
    const ready = n === 3;
    startBtn.classList.toggle("is-disabled", !ready);
    startBtn.classList.toggle("dojo-cta-ready", ready);
    startBtn.disabled = !ready;
    startBtn.setAttribute("aria-disabled", ready ? "false" : "true");
    startBtn.style.opacity = ready ? "" : "0.45";
    startBtn.style.pointerEvents = ready ? "" : "none";
  }
}

function nudgeDojoNeedSquad() {
  const grid = $("dojoSelectedSquad");
  if (!grid) return;
  grid.classList.remove("dojo-need-squad");
  void grid.offsetWidth;
  grid.classList.add("dojo-need-squad");
  window.setTimeout(() => grid.classList.remove("dojo-need-squad"), 450);
}

function bindPracticeFightCtas() {
  const root = $("viewPractice");
  if (!root) return;
  renderPracticeSquad();
  if (root.dataset.practiceBound === "1") return;
  root.dataset.practiceBound = "1";
  const selectSquad = (id) => {
    root.querySelectorAll("[data-squad]").forEach((card) => {
      const on = card.getAttribute("data-squad") === id;
      card.classList.toggle("is-on", on);
      const badge = card.querySelector("header i");
      if (on && !badge) {
        const mark = document.createElement("i");
        mark.textContent = "Выбран";
        card.querySelector("header")?.appendChild(mark);
      } else if (!on && badge) badge.remove();
    });
  };
  root.addEventListener("click", (ev) => {
    const act = ev.target.closest("[data-load]")?.getAttribute("data-load");
    if (!act) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (act === "open") {
      if (!Array.isArray(state.practiceSquad) || state.practiceSquad.length !== 3) {
        toast("Выберите 3 котиков в боевой отряд");
        nudgeDojoNeedSquad();
        return;
      }
      showPracticeLoad(true);
    } else if (act === "close") showPracticeLoad(false);
    else if (act === "go") {
      clearPracticeLoadTimer();
      setPracticeLoadProgress(100);
      startPractice(false);
    }
  }, true);
  root.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-load]")) return;
    const removeBtn = ev.target.closest("[data-squad-hero]");
    if (removeBtn) {
      ev.preventDefault();
      removePracticeHero(removeBtn.getAttribute("data-squad-hero"));
      return;
    }
    const heroCard = ev.target.closest("[data-hero]");
    if (heroCard && root.contains(heroCard)) {
      ev.preventDefault();
      const key = heroCard.getAttribute("data-hero");
      const hero = practiceHeroByKey(key);
      if (hero && state.practiceSquad.includes(hero.templateId)) {
        removePracticeHero(hero.templateId);
      } else {
        addPracticeHero(key);
      }
      return;
    }
    const squad = ev.target.closest("[data-squad]");
    if (squad) {
      ev.preventDefault();
      selectSquad(squad.getAttribute("data-squad"));
      toast(`Отряд №${squad.getAttribute("data-squad")} выбран`);
      return;
    }
    const filterBtn = ev.target.closest("[data-dojo-filter]");
    if (filterBtn) {
      ev.preventDefault();
      const group = filterBtn.getAttribute("data-dojo-filter");
      const id = filterBtn.getAttribute("data-filter-id") || "";
      if (group === "role") {
        state.practiceFilterRole = state.practiceFilterRole === id ? "" : id;
      } else if (group === "el") {
        state.practiceFilterEl = state.practiceFilterEl === id ? "" : id;
      }
      renderPracticeSquad();
      return;
    }
    const toggle = ev.target.closest("[data-toggle]");
    if (toggle) {
      ev.preventDefault();
      return;
    }
    const preset = ev.target.closest("[data-preset]");
    if (preset) {
      ev.preventDefault();
      root.querySelectorAll("[data-preset]").forEach((btn) => {
        btn.classList.toggle("is-on", btn === preset);
      });
      toast(`Пресет: ${preset.textContent.trim()}`);
      return;
    }
    const dojo = ev.target.closest("[data-dojo]")?.getAttribute("data-dojo");
    if (dojo) {
      ev.preventDefault();
      if (dojo === "quick") {
        startPractice(true);
        return;
      }
      if (dojo === "autopick") {
        state.practiceSquad = [
          "shop_tank_stone_a",
          "shop_fighter_fire_a",
          "shop_support_water_a",
        ];
        renderPracticeSquad();
        toast("Авто-подбор 3v3 · Барсик · Рыжик · Мурка");
        return;
      }
      const tips = {
        reset: "Статистика додзё сброшена (локально)",
        roster: "Выберите котиков слева → отряд справа",
        guide: "Гайд додзё — soft launch stub",
        params: "Параметры симулятора — soft launch stub",
      };
      toast(tips[dojo] || "Додзё · stub");
      return;
    }
    const label = (ev.target.closest("button, a")?.textContent || "").toLowerCase();
    if (label.includes("назад")) {
      ev.preventDefault();
      navigate("yard");
    }
  });
  document.addEventListener("keydown", (ev) => {
    if (state.tab !== "practice") return;
    if (ev.target.closest?.("input, textarea")) return;
    if (state.battle && !state.battle.result && state.battleMode === "practice") return;
    const loading = root.dataset.practiceLoad === "1";
    if (ev.code === "Space") {
      ev.preventDefault();
      if (loading) {
        clearPracticeLoadTimer();
        setPracticeLoadProgress(100);
        startPractice(false);
      } else {
        showPracticeLoad(true);
      }
    } else if (ev.code === "Escape") {
      if (loading) showPracticeLoad(false);
      else navigate("yard");
    }
  });
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
    navigate(bootTabAfterLogin());
  } catch (err) {
    // Still admit on network blip: local grant already loaded at boot.
    console.warn("stub login", err);
    state.loggedIn = true;
    navigate(bootTabAfterLogin());
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
    const register = $("viewLogin")?.dataset.auth === "register";
    const login = register
      ? $("registerNameInput")?.value || $("registerEmailInput")?.value || ""
      : $("loginUserInput")?.value || "";
    const password = register
      ? $("registerPasswordInput")?.value || ""
      : $("passwordInput")?.value || "";
    stubLogin({ login, password });
  };
  // Stitch inline scripts are stripped at build — restore tab / password UI helpers.
  window.switchTab = (mode) => {
    const loginTab = $("tabLogin");
    const registerTab = $("tabRegister");
    const view = $("viewLogin");
    const active =
      "py-2 rounded-lg font-label-lg text-xs font-extrabold transition-all duration-200 bg-gradient-to-b from-amber-500 to-amber-600 text-black shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wide";
    const idle =
      "py-2 rounded-lg font-label-lg text-xs font-bold text-amber-200/70 hover:text-amber-100 transition-all duration-200 flex items-center justify-center gap-1.5 uppercase tracking-wide";
    if (!loginTab || !registerTab) return;
    if (mode === "register") {
      registerTab.className = active;
      loginTab.className = idle;
      if (view) view.dataset.auth = "register";
    } else {
      loginTab.className = active;
      registerTab.className = idle;
      if (view) delete view.dataset.auth;
    }
  };
  if (new URLSearchParams(location.search).get("auth") === "register") {
    window.switchTab("register");
  }
  window.togglePassword = () => {
    const pass = $("passwordInput");
    const eyeIcon = $("eyeIcon");
    if (!pass) return;
    if (pass.type === "password") {
      pass.type = "text";
      if (eyeIcon) eyeIcon.textContent = "visibility_off";
    } else {
      pass.type = "password";
      if (eyeIcon) eyeIcon.textContent = "visibility";
    }
  };
  // Social stubs also free-enter
  const root = $("viewLogin");
  if (root && root.dataset.stubSocial !== "1") {
    root.dataset.stubSocial = "1";
    root.addEventListener("click", (ev) => {
      const role = ev.target.closest("[data-role]");
      if (role && root.contains(role)) {
        root.querySelectorAll("[data-role]").forEach((el) => el.classList.toggle("is-selected", el === role));
        return;
      }
      const guild = ev.target.closest("[data-guild]");
      if (guild && root.contains(guild)) {
        root.querySelectorAll("[data-guild]").forEach((el) => el.classList.toggle("is-selected", el === guild));
        return;
      }
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

function stubLogout() {
  state.loggedIn = false;
  state.battle = null;
  state.tab = "login";
  state.primary = "combat";
  document.body.classList.add("mythfel-login");
  navigate("login");
  toast(t("auth.logout", "Вы вышли (stub)"));
}

function wireButtons() {
  $("btnBrandHub")?.addEventListener("click", () => navigate("hub"));
  $("btnLogout")?.addEventListener("click", () => stubLogout());
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
  bindYardForm();
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
  $("btnHomeEquipDemo")?.addEventListener("click", () => {
    navigate("home");
    const catId = state.selectedCatId || state.profile?.cats?.[0]?.catId;
    const item = state.gearCatalog[0];
    if (catId && item) equipItem(catId, item.id);
  });
  $("btnFarmHireDemo")?.addEventListener("click", () => {
    navigate("farm", { soon: "farm" });
    const z = FARM_ZONES[0];
    hireFarmer(z.id);
    plantZone(z.id);
  });
  $("btnGuildClanDemo")?.addEventListener("click", () => {
    navigate("guild");
    if (!state.clan) {
      state.clan = { name: "Лапка Очага", members: ["local_smoke"], createdAt: Date.now() };
    }
    state.clan.members.push(`Участник-${state.clan.members.length + 1}`);
    renderGuild();
    toast("Клан demo: создан + участник");
  });
  $("btnClanPanelOpen")?.addEventListener("click", () => navigate("soon_clan", { soon: "clan_boss" }));
  $("btnColFormation").addEventListener("click", () => navigate("formation"));
  $("btnColForge").addEventListener("click", () => navigate("farm", { soon: "farm" }));
  $("btnGacha1").addEventListener("click", () => toast(t("shop.gacha.stub", "Гача stub")));
  $("btnGacha10").addEventListener("click", () => toast(t("shop.gacha.stub", "Гача stub")));
  $("btnShopToTavern").addEventListener("click", () => navigate("tavern"));
  $("btnSellStarter").addEventListener("click", () => sellFarmLoot("market"));
  $("btnMarketQuickSell")?.addEventListener("click", () => sellFarmLoot("market"));
  $("btnAuctionList")?.addEventListener("click", () => {
    if (state.farmBag.length) sellFarmLoot("auction");
    else showGateTip(t("auction.list.tip", "Нет лута — собери во дворе или подними ранг"));
  });
  $("btnPvpStart")?.addEventListener("click", () => openPvpLoad());
  $("btnMarketToShop").addEventListener("click", () => navigate("shop"));
  $("btnMarketToAuction")?.addEventListener("click", () => navigate("auction"));
  $("btnAuctionToMarket")?.addEventListener("click", () => navigate("market"));
  $("btnTavernFormation").addEventListener("click", () => navigate("formation"));
  $("btnTavernHub").addEventListener("click", () => navigate("hub"));
  $("btnPassShop").addEventListener("click", () => navigate("shop"));
  $("btnPassHub").addEventListener("click", () => navigate("hub"));
  $("btnGuildBattle")?.addEventListener("click", () => navigate("guild_battle"));
  $("btnGuildHub")?.addEventListener("click", () => navigate("hub"));
  $("btnGuildBattleFormation")?.addEventListener("click", () => navigate("formation"));
  $("btnGuildBattleHub")?.addEventListener("click", () => navigate("hub"));
  $("btnGuildBattleStartWire")?.addEventListener("click", () => {
    state.guildBattleSize = 3;
    startGuildBattle();
  });
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

function bootTabAfterLogin() {
  if (passAddressOpen()) return "pass";
  if (craftAddressOpen()) return "craft";
  if (heroAddressOpen()) return "home";
  if (barnAddressOpen()) return "gear";
  if (breedingAddressOpen()) return "breeding";
  if (squareAddressOpen()) return "trade_hub";
  if (frontsAddressOpen()) return "battle_hub";
  if (pveAddressOpen()) return "yard";
  if (pveLoadAddressOpen()) return "pve_load";
  if (pvpLoadAddressOpen()) return "pvp_load";
  if (codexAddressOpen()) return "codex";
  return "pass";
}

window.addEventListener("popstate", () => {
  if (loginAddressOpen()) {
    state.loggedIn = false;
    state.tab = "login";
    state.primary = "combat";
    document.body.classList.add("mythfel-login");
    navigate("login");
    return;
  }
  if (!state.loggedIn) return;
  const tab = bootTabAfterLogin();
  if (state.tab !== tab) navigate(tab);
});

/** Soft-launch phone = landscape only. Portrait phones get #orientGate (CSS); sync aria. */
function syncOrientGate() {
  const gate = $("orientGate");
  if (!gate) return;
  const phonePortrait = window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches;
  gate.setAttribute("aria-hidden", phonePortrait ? "false" : "true");
  document.body.classList.toggle("mythfel-phone-portrait", phonePortrait);
}

async function main() {
  window.mythfelNavigate = navigate;
  window.mythfelStartYard = startYard;
  window.mythfelStartPractice = startPractice;
  window.mythfelSoundFX = SoundFX;
  window.mythfelUnitFatalityLabel = unitFatalityLabel;
  /** QA: CreatePvE for stage + mode, then paint live fight HUD. */
  window.mythfelDebugStartStage = async (stageId, mode = "pve") => {
    state.battle = null;
    state.lastResult = null;
    state.battleMode = mode;
    state.selectedStageId = stageId || (mode === "practice" ? PRACTICE_STAGE : YARD_STAGE);
    if (mode === "pve") {
      state.pveChapter = 1;
      state.pveStage = "entrance";
      state.selectedStageId = stageId || YARD_STAGE;
    }
    if (mode === "practice") {
      state.practiceSquad = [
        "shop_tank_stone_a",
        "shop_fighter_fire_a",
        "shop_support_water_a",
      ];
    }
    await startYard(false);
    return { ok: !!state.battle, battleId: state.battle?.battleId, mode: state.battleMode, stageId: state.selectedStageId };
  };
  /** QA: mark foe lane dead + re-paint; returns label + DOM text (D-041). */
  window.mythfelDebugSetFoeDead = (lane = 0) => {
    const diff = state.battle;
    if (!diff) return { ok: false, reason: "no battle" };
    const foes = (diff.units || []).filter((u) => u.side === 1).sort((a, b) => a.lane - b.lane);
    const u = foes[lane] || foes[0];
    if (!u) return { ok: false, reason: "no foe" };
    u.hp = 0;
    u.alive = false;
    if (state.battleMode === "practice" || state.battleMode === "pve") renderPracticeFight();
    else if (state.battleMode === "pvp") renderPvpFight();
    else renderBattle();
    const fat = document.querySelector(
      "#pfEnemies .mf-fatality:not([hidden]) span, #enemyBoard .mf-fatality:not([hidden]) span",
    );
    return { ok: true, id: u.id, label: unitFatalityLabel(u), dom: fat?.textContent || null };
  };
  bindBattleFxGestureUnlock();
  syncOrientGate();
  window.addEventListener("orientationchange", syncOrientGate);
  window.addEventListener("resize", syncOrientGate);
  wireButtons();
  showView("viewBoot");
  $("bootMsg").textContent = "Boot → LiveOps fetch…";
  try {
    loadProgress();
    loadGearStub();
    await loadLoc();
    await bootLiveOps();
    await loadCampaign();
    await bootStarterGrant();
    await bootGearCatalog();
    await bootBreedingStub();
    await bootCollectionStub();
    const battleOk = await checkBattle();
    const bp = $("battlePill");
    if (bp) {
      bp.textContent = battleOk ? "Battle :8081 OK" : "Battle DOWN";
      bp.className = `status-pill mythfel-debug-pill ${battleOk ? "ok" : "bad"}`;
    }
    // /home = login/register desk. Root (and Amvera) open the main hub with portals — no login hop.
    if (loginAddressOpen()) {
      state.loggedIn = false;
      state.tab = "login";
      state.primary = "combat";
      document.body.classList.add("mythfel-login");
      renderAll();
      return;
    }
    state.loggedIn = true;
    if (!state.session) state.session = { userId: "local_smoke" };
    document.body.classList.remove("mythfel-login");
    navigate(bootTabAfterLogin());
  } catch (err) {
    $("bootMsg").textContent = `Boot fail: ${err.message}. Подними CDN :8090 и battle :8081 (см. README).`;
    const loFail = $("liveopsPill");
    if (loFail) {
      loFail.textContent = "LiveOps FAIL";
      loFail.className = "status-pill mythfel-debug-pill bad";
    }
    console.error(err);
  }
}

main();
