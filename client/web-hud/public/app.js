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
  skipCombatFx,
  SoundFX,
} from "./battle-fx.js";
/** Side-effect: fills window.CODEX_TOPICS / CODEX_FILTERS (survives stitch HTML rebakes). */
import "./codex-topics.js";
import {
  GEAR_STUB_VERSION,
  GEAR_HERO_STOCK,
  PVE_SET_IDS as PVE_SET_IDS_SEED,
  HOME_SET_RU as HOME_SET_RU_SEED,
  buildGearCatalogSeed,
} from "./gear-catalog-seed.js";

const STARTERS = [
  "starter_tank_stone",
  "starter_fighter_fire",
  "starter_support_water",
];
const YARD_STAGE = "mythmir_1_f1"; // default first fight; campaign selects others
/** Raid / legion hard party size (docs/raids · qa G6). */
const RAID_PARTY_SIZE = 12;
const minRaidPlayers = 12;
/** Таймер хода в бою — ровно 1 минута (docs/raids/COMPOSITION.md). */
const BATTLE_TURN_TIMER_SEC = 60;
/** Канон состава легиона 12: 3T / 3S / 6DPS. */
const RAID_COMP = {
  tank: 3,
  support: 3,
  dps: 6,
  tankSubs: { aggro: 2, armorBreak: 1 },
  supportSubs: { heal: 2, buffer: 1 },
  dpsSubs: { ranged: 3, melee: 3 }, // mage|ranger · assassin|fighter
};
/**
 * Построение от тыла к фронту (4×3):
 * row3 supports → row2 ranged DPS → row1 melee DPS → row0 tanks.
 */
const RAID_FORMATION_ROWS = [
  { row: 3, lane: "rear", roles: ["support", "support", "support"], label_ru: "Тыл · саппорты" },
  { row: 2, lane: "ranged", roles: ["mage|ranger", "mage|ranger", "mage|ranger"], label_ru: "Даль · маги/лучники" },
  { row: 1, lane: "melee", roles: ["assassin|fighter", "assassin|fighter", "assassin|fighter"], label_ru: "Мили · убийцы/воины" },
  { row: 0, lane: "front", roles: ["tank", "tank", "tank"], label_ru: "Фронт · танки" },
];
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
  "trade-tavern-bar": "tavern",
  "shop-donate": "shop",
  "trade-shop": "shop",
  "market-resources": "market",
  "trade-market": "market",
  "player-auctions": "auction",
  "trade-auction": "auction",
  "character-home": "home",
  equipment: "gear",
  farmlands: "farm",
  "pve-expedition": "yard",
  "arena-battles": "battle_hub",
  "rejting-igrokov-sezon-4": "rating_players",
  "rejting-gildiy": "rating_guilds",
  "rating-guilds": "rating_guilds",
  "rating-players": "rating_players",
  rating_players: "rating_players",
  rating_dungeon: "rating_dungeon",
  rating_raid: "rating_raid",
  rating_guilds: "rating_guilds",
  "rating-dungeon": "rating_dungeon",
  "rating-raid": "rating_raid",
  "rejting-danzhey": "rating_dungeon",
  "rejting-reyda": "rating_raid",
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
  guild_battle: "guild_battle",
  boss_raid: "boss_raid",
  chat_guild: "chat_guild",
  yard: "yard",
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
  boss_dungeon: "boss_dungeon",
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
  guild: "guild",
  guild_hub: "guild_hub",
  guild_members: "guild_members",
  guild_tech: "guild_tech",
  guild_treasury: "guild_treasury",
  "uchastniki-i-sostav": "guild_members",
  "razvitie-i-tehnologii": "guild_tech",
  "kazna-i-zadaniya": "guild_treasury",
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
      { id: "boss_raid", key: "nav.sub.boss_raid", gated: false },
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
      { id: "rating_players", key: "nav.sub.rating_players", label: "Игроки" },
      { id: "rating_dungeon", key: "nav.sub.rating_dungeon", label: "Данжи" },
      { id: "rating_raid", key: "nav.sub.rating_raid", label: "Рейд" },
      { id: "rating_guilds", key: "nav.sub.rating_guilds", label: "Гильдии" },
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
  if (
    tabId === "soon_clan" ||
    tabId === "guild_members" ||
    tabId === "guild_tech" ||
    tabId === "guild_treasury"
  ) {
    return NAV.find((g) => g.id === "guilds") || null;
  }
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

/** Local warehouse mats / tools / potions — HUD smoke (MF-153 icons). Not server SoT. */
const BARN_MATS_SEED = [
  { id: "seeds", name: "Семена Урожая", kind: "farm", rarity: "common", qty: 10, tag: "Двор · посев", desc: "Грядки и сад. Покупка на Рынке.", iconSrc: "/barn-icons/seeds.png" },
  { id: "wood", name: "Дубовые брёвна", kind: "farm", rarity: "common", qty: 8, tag: "Лесопилка", desc: "Кузня / крафт / ремонт tools.", iconSrc: "/barn-icons/wood.png" },
  { id: "iron", name: "Железо / слитки", kind: "farm", rarity: "common", qty: 6, tag: "Рудник", desc: "Кузня и ремонт инструментов.", iconSrc: "/barn-icons/iron.png" },
  { id: "stone", name: "Мшистый гранит", kind: "farm", rarity: "common", qty: 6, tag: "Карьер", desc: "Камень для кузни.", iconSrc: "/barn-icons/stone.png" },
  { id: "veggies", name: "Корзина урожая", kind: "farm", rarity: "common", qty: 12, tag: "Грядки", desc: "Алхимия «еда».", iconSrc: "/barn-icons/veggies.png" },
  { id: "fruit", name: "Свежие плоды", kind: "farm", rarity: "common", qty: 10, tag: "Сад", desc: "Алхимия / зелья.", iconSrc: "/barn-icons/fruit.png" },
  { id: "herbs", name: "Пучок трав", kind: "farm", rarity: "common", qty: 14, tag: "Аптека", desc: "Базовый реагент алхимии.", iconSrc: "/barn-icons/herbs.png" },
  { id: "fish", name: "Связка рыбы", kind: "farm", rarity: "common", qty: 8, tag: "Заводя", desc: "Сытость и крафт.", iconSrc: "/barn-icons/fish.png" },
  { id: "milk", name: "Молоко Очага", kind: "farm", rarity: "rare", qty: 4, tag: "Таверна", desc: "Post-fight HP (не ranked buff).", iconSrc: "/barn-icons/milk.png" },
  { id: "bait", name: "Наживка", kind: "farm", rarity: "common", qty: 8, tag: "Заводя", desc: "5 забросов на рыбную заводя.", iconSrc: "/barn-icons/fish.png" },
  { id: "tool_shovel", name: "Лопата", kind: "tool", rarity: "common", qty: 1, tag: "Инструмент", desc: "Грядки / сад · износ ~7д.", iconSrc: "/barn-icons/tool-shovel.png", durability: 7, durabilityMax: 7 },
  { id: "tool_axe", name: "Топор", kind: "tool", rarity: "common", qty: 1, tag: "Инструмент", desc: "Лесопилка · износ ~7д.", iconSrc: "/barn-icons/tool-axe.png", durability: 7, durabilityMax: 7 },
  { id: "tool_pick", name: "Кирка", kind: "tool", rarity: "common", qty: 1, tag: "Инструмент", desc: "Рудник / карьер · износ ~7д.", iconSrc: "/barn-icons/tool-pick.png", durability: 7, durabilityMax: 7 },
  { id: "tool_rod", name: "Удочка", kind: "tool", rarity: "common", qty: 1, tag: "Инструмент", desc: "Рыбная заводя (+ наживка).", iconSrc: "/barn-icons/tool-rod.png", durability: 7, durabilityMax: 7 },
  { id: "potion_mana", name: "Эликсир маны", kind: "potion", rarity: "rare", qty: 1, tag: "Алхимия", desc: "Мана / вода · smoke stub.", iconSrc: "/barn-icons/potion-mana.png" },
  { id: "potion_nature", name: "Эликсир природы", kind: "potion", rarity: "rare", qty: 1, tag: "Алхимия", desc: "Природа / рост · smoke stub.", iconSrc: "/barn-icons/potion-nature.png" },
  { id: "potion_ember", name: "Эликсир жара", kind: "potion", rarity: "rare", qty: 0, tag: "Алхимия", desc: "Огонь / жар · smoke stub.", iconSrc: "/barn-icons/potion-ember.png" },
];

/** Smoke craft recipes (wiki §6 / codex alchemy_craft). */
const CRAFT_RECIPES = [
  {
    id: "potion_life",
    name: "Зелье жизни",
    outId: "potion_nature",
    outQty: 1,
    costGold: 50,
    ingredients: [
      { id: "herbs", qty: 1 },
      { id: "fruit", qty: 1 },
    ],
  },
  {
    id: "potion_cleanse",
    name: "Отвар очищения",
    outId: "potion_mana",
    outQty: 1,
    costGold: 40,
    ingredients: [
      { id: "herbs", qty: 2 },
      { id: "veggies", qty: 1 },
    ],
  },
  {
    id: "potion_mint",
    name: "Мятный отвар",
    outId: "potion_ember",
    outQty: 1,
    costGold: 45,
    ingredients: [
      { id: "herbs", qty: 2 },
      { id: "fish", qty: 1 },
    ],
  },
];

/** Zone id → harvested mat id (farm smoke). */
const FARM_ZONE_LOOT = {
  wheat: "veggies",
  herbs: "herbs",
  garden: "herbs",
  orchard: "fruit",
  fishing: "fish",
  wood: "wood",
  mine: "iron",
  stone: "stone",
  forge: "iron",
  alchemist: "herbs",
};

/** Wiki §2 daily mins — qty per successful harvest action. */
const FARM_HARVEST_QTY = {
  wood: 3,
  iron: 2,
  stone: 2,
  veggies: 1,
  fruit: 1,
  herbs: 1,
  fish: 3,
};

/** Zone → required tool (null = craft post, no field tool). */
const FARM_ZONE_TOOL = {
  wheat: "tool_shovel",
  herbs: "tool_shovel",
  garden: "tool_shovel",
  orchard: "tool_shovel",
  fishing: "tool_rod",
  wood: "tool_axe",
  mine: "tool_pick",
  stone: "tool_pick",
  forge: null,
  alchemist: null,
};

const TOOL_DURABILITY_MAX = 7;
const FARM_TOOL_IDS = ["tool_shovel", "tool_axe", "tool_pick", "tool_rod"];

/** Stitch map pin → zone id(s). Matched by pin card text. */
const FARM_MAP_PIN_MATCHERS = [
  { zoneIds: ["mine"], re: /Железная Штольня/i, filter: "mines" },
  { zoneIds: ["stone"], re: /Каменоломня/i, filter: "mines" },
  { zoneIds: ["wood"], re: /Дубовая Лесопилка/i, filter: "mines" },
  { zoneIds: ["forge", "alchemist"], re: /Мастерские Очага|Дом Хранителя/i, filter: "craft" },
  { zoneIds: ["wheat", "herbs", "garden", "orchard"], re: /Сады, Овощи/i, filter: "crops" },
  { zoneIds: ["fishing"], re: /Рыбацкий Стан/i, filter: "fish" },
];

const FARM_STOCK_CAPS = {
  cropBundle: 500,
  wood: 2500,
  stone: 1500,
  iron: 1000,
  fish: 4000,
};

const MARKET_STOCK = [
  { id: "seed_wheat", name: "Семена пшеницы", price: 15, kind: "seed", gated: false, matId: "seeds", buyQty: 5, iconSrc: "/barn-icons/seeds.png" },
  { id: "seed_herb", name: "Семена трав", price: 20, kind: "seed", gated: false, matId: "seeds", buyQty: 5, iconSrc: "/barn-icons/seeds.png" },
  { id: "seed_mint", name: "Семена мяты", price: 25, kind: "seed", gated: false, matId: "seeds", buyQty: 5, iconSrc: "/barn-icons/seeds.png" },
  { id: "tool_shovel", name: "Лопата", price: 50, kind: "tool", gated: false, matId: "tool_shovel", buyQty: 1, iconSrc: "/barn-icons/tool-shovel.png" },
  { id: "tool_axe", name: "Топор", price: 55, kind: "tool", gated: false, matId: "tool_axe", buyQty: 1, iconSrc: "/barn-icons/tool-axe.png" },
  { id: "tool_pick", name: "Кирка", price: 60, kind: "tool", gated: false, matId: "tool_pick", buyQty: 1, iconSrc: "/barn-icons/tool-pick.png" },
  { id: "tool_rod", name: "Удочка", price: 70, kind: "tool", gated: false, matId: "tool_rod", buyQty: 1, iconSrc: "/barn-icons/tool-rod.png" },
  { id: "bait_worm", name: "Наживка · червяк", price: 12, kind: "bait", gated: false, matId: "bait", buyQty: 5, iconSrc: "/barn-icons/fish.png" },
  { id: "bait_shiny", name: "Наживка · блесна", price: 28, kind: "bait", gated: false, matId: "bait", buyQty: 5, iconSrc: "/barn-icons/fish.png" },
  { id: "res_wood", name: "Бревно", price: 8, kind: "resource", gated: false, matId: "wood", buyQty: 1, iconSrc: "/barn-icons/wood.png" },
  { id: "res_ore", name: "Руда", price: 12, kind: "resource", gated: false, matId: "iron", buyQty: 1, iconSrc: "/barn-icons/iron.png" },
  { id: "craft_herb_bundle", name: "Пучок трав (крафт)", price: 18, kind: "ingredient", gated: false, matId: "herbs", buyQty: 3, iconSrc: "/barn-icons/herbs.png" },
  { id: "potion_stone_skin", name: "Зелье каменной шкуры", price: 45, kind: "potion", gated: false, matId: "potion_mana", buyQty: 1, iconSrc: "/barn-icons/potion-mana.png" },
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
  { id: "armor_grey_plate", label: "PvP броня · grey R1 plate", detail: "PvP shop · Rank 1", gated: false },
  { id: "armor_grey_pendant", label: "PvP кулон · grey R1", detail: "PvP shop · Rank 1", gated: false },
  { id: "pvp_set_green", label: "PvP сет · green R2", detail: "PvP shop · Rank 2", gated: false },
  { id: "battle_coin_gear", label: "PvP gear за battle coins", detail: "medals → PvP shop", gated: true },
];

/** Codex knowledge base — titles/bodies from docs/game-wiki.md where possible. */
// CODEX_FILTERS / CODEX_TOPICS live in /codex-topics.js


const PASS_REWARDS = [
  { lvl: 1, free: "pass.reward.fish_50", gold: "pass.reward.yarn_10" },
  { lvl: 2, free: "pass.reward.scrap", gold: "pass.reward.box_r1" },
  { lvl: 3, free: "pass.reward.bowl", gold: "pass.reward.box_rank" },
  { lvl: 4, free: "pass.reward.ticket", gold: "pass.reward.armor_piece" },
];

const PASS_SEASON_DAYS = 30;
const PASS_XP_PER_LEVEL = 3000;
const PASS_ICON = {
  gold: "/stitch-ref/pass-hearth/icon-1.png",
  fish: "/stitch-assets/barn-icons/fish.png",
  herbs: "/stitch-assets/barn-icons/herbs.png",
  veggies: "/stitch-assets/barn-icons/veggies.png",
  fruit: "/stitch-assets/barn-icons/fruit.png",
  milk: "/stitch-assets/barn-icons/milk.png",
  potions: "/stitch-assets/barn-icons/potions.png",
  ring: "/stitch-assets/barn-icons/ring.png",
  chest: "/stitch-assets/barn-icons/chest.png",
  seeds: "/stitch-assets/barn-icons/seeds.png",
  wood: "/stitch-assets/barn-icons/wood.png",
  iron: "/stitch-assets/barn-icons/iron.png",
  stone: "/stitch-assets/barn-icons/stone.png",
  scroll: "/stitch-assets/hero-icons/deck_1.png",
  tome: "/stitch-assets/hero-icons/deck_3.png",
  amulet: "/stitch-assets/hero-icons/slot_amulet.png",
  collar: "/stitch-assets/barn-icons/collar.png",
  cloak: "/stitch-assets/kb-v3/items/item-1.webp",
  belt: "/stitch-assets/kb-v3/items/item-2.webp",
  helm: "/stitch-assets/kb-v3/items/item-3.webp",
  boots: "/stitch-assets/kb-v3/items/item-4.webp",
  panzer: "/stitch-assets/kb-v3/items/item-5.webp",
  gloves: "/stitch-assets/kb-v3/items/item-6.webp",
  dragonSet: "/stitch-assets/kb-v3/armor/r6-dragon.webp",
  sunBars: "/stitch-assets/monsters/battle/solar-lion-fighter-cutout.webp",
  freeBox: "/stitch-ref/pass-hearth/icon-2.png",
};

/** Season III «Лапы Судьбы» — 30 дней, free + elite tracks. */
const PASS_SEASON_TRACK = (() => {
  const freePool = [
    { name: "500 Золота", img: PASS_ICON.gold },
    { name: "Рыбка ×50", img: PASS_ICON.fish },
    { name: "Мята ×8", img: PASS_ICON.herbs },
    { name: "Корм ×30", img: PASS_ICON.veggies },
    { name: "Семена ×20", img: PASS_ICON.seeds },
    { name: "Рыбка ×100", img: PASS_ICON.fish },
    { name: "1,000 Золота", img: PASS_ICON.gold },
    { name: "Фрукты ×25", img: PASS_ICON.fruit },
    { name: "Дуб ×40", img: PASS_ICON.wood },
    { name: "Руда ×15", img: PASS_ICON.iron },
  ];
  const elitePool = [
    { name: "Сливки ×3", img: PASS_ICON.milk },
    { name: "Свиток Призыва", img: PASS_ICON.scroll },
    { name: "Астрал-Амулет", img: PASS_ICON.amulet },
    { name: "Набор Зелий", img: PASS_ICON.potions },
    { name: "Перстень Света", img: PASS_ICON.ring },
    { name: "Сундук Лапы", img: PASS_ICON.chest },
    { name: "Ошейник Удачи", img: PASS_ICON.collar },
    { name: "Фолиант Опыта", img: PASS_ICON.tome },
  ];
  const specialElite = {
    10: { name: "Багровый Плащ", img: PASS_ICON.cloak, tag: "ЭПИК" },
    15: { name: "Пояс Дракона", img: PASS_ICON.belt, tag: "ЭПИК" },
    20: { name: "Шлем Архипса", img: PASS_ICON.helm, tag: "ЭПИК" },
    24: { name: "Сапоги Когтя", img: PASS_ICON.boots, tag: "ЭПИК" },
    25: { name: "Перчатки Дракона", img: PASS_ICON.gloves, tag: "ЭПИК" },
    28: { name: "Панцирь Дракона", img: PASS_ICON.panzer, tag: "МИФИК" },
    30: { name: "«Барс Солнца»", img: PASS_ICON.sunBars, tag: "ФИНАЛ" },
  };
  const specialFree = {
    10: { name: "2,500 Золота", img: PASS_ICON.gold },
    20: { name: "Фолиант Опыта", img: PASS_ICON.tome },
    28: { name: "5,000 Золота", img: PASS_ICON.gold },
    30: { name: "10,000 Золота", img: PASS_ICON.gold },
  };
  const rows = [];
  for (let day = 1; day <= PASS_SEASON_DAYS; day++) {
    rows.push({
      day,
      free: specialFree[day] || freePool[(day - 1) % freePool.length],
      elite: specialElite[day] || elitePool[(day - 1) % elitePool.length],
    });
  }
  return rows;
})();

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
    { id: "auc_1", name: "shop_tank_fire", bid: 900, kind: "cat" },
    { id: "auc_2", name: "shop_fighter_water", bid: 850, kind: "cat" },
    { id: "auc_3", name: "shop_mage_water", bid: 980, kind: "cat" },
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
  passLevel: 14,
  passXp: 1800,
  passClaimed: { free: {}, elite: {} },
  passTrackCentered: false,
  autofarm: {
    autofarm_crops: false,
    autofarm_alchemy: false,
    autofarm_gather: false,
    autofarm_blacksmith: false,
    autofarm_fish: false,
  },
  /**
   * Local HUD gear catalog — R1–R8 armor (PvP+PvE) + class weapons.
   * Armor/trinket: all roles. Weapons/offhand: `roles` gate.
   * Identical pieces stack via `qty` (GEAR_HERO_STOCK = 18).
   */
  gearCatalog: buildGearCatalogSeed(),
  /** Derived from gearCatalog + barnMats (D-028 + MF-153 smoke). */
  barnCatalog: [],
  /** Local farm/tool/potion stock — HUD smoke, not server SoT. */
  barnMats: JSON.parse(JSON.stringify(BARN_MATS_SEED)),
  barnCatFilter: "all",
  barnRarityFilter: "all",
  barnSearch: "",
  barnFocus: null,
  barnCapMax: 256,
  craftRecipeId: "potion_life",
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
  /** Active equip lane in HUD: pve | pvp (separate loadouts). */
  equipLane: "pve",
  /** catId → slot → item id (legacy alias → equippedPveByCat). */
  equippedByCat: {},
  equippedPveByCat: {},
  equippedPvpByCat: {},
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
  battleMode: "pve", // pve | practice | boss | dungeon | guild_demo | pvp
  dungeonCoop: null, // content/dungeons_coop_v1.json
  dungeonRewards: null, // content/dungeon_rewards_v1.json
  dungeonRares: null, // content/dungeon_rares.json
  selectedDungeonId: "scarlet",
  dungeonPath: "short", // short | long — голосование после 1-го отряда
  dungeonPathLocked: false,
  dungeonPathVoteOpen: false,
  dungeonPathVotes: { short: 0, long: 0, myVote: null, botsDone: false },
  dungeonFork: "left", // long F2: left | right
  dungeonNodeIndex: 0,
  dungeonPartyCode: null,
  dungeonPartyPollTimer: null,
  dungeonParty: [
    { slot: 0, name: "Вы", ready: true, local: true },
    { slot: 1, name: "Слот 2", ready: false },
    { slot: 2, name: "Слот 3", ready: false },
    { slot: 3, name: "Слот 4", ready: false },
  ],
  /** Solo QA stub: one player fills party + picks 3 heroes, full dungeon run. */
  dungeonSoloStub: false,
  /** Practice dojo selected squad — templateIds, max 3; starts empty. */
  practiceSquad: [],
  practiceFilterRole: "",
  practiceFilterEl: "",
  /** Practice load overlay progress (0–100) + timer handle. */
  practiceLoadPct: 0,
  practiceLoadTimer: null,
  /** PvP arena: preset id, active 3-cat squad (front→mid→rear), MM stub foe. */
  pvpArenaMode: "ranked",
  pvpArenaSquadId: "1",
  pvpSquad: ["shop_tank_fire", "shop_fighter_fire", "shop_support_water"],
  pvpOpponentTeam: null,
  pvpOpponentName: "",
  pvpSearching: false,
  pvpSearchTimer: null,
  pvpLoadPct: 0,
  pvpLoadTimer: null,
  pvpStarting: false,
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
  /** True while SubmitAction is in flight (blocks double-tap). */
  actionBusy: false,
  /** Space must be pressed twice within window to end turn (accidental-tap guard). */
  endTurnArmed: false,
  /** In-fight PvP auto-battle toggle (client AI loop while player's turn). */
  pvpAutoBattle: false,
  /** Local fight potion tray qty (HUD smoke — Phase 1 sim rejects ActionPotion). */
  pvpFightPots: { heal: 2, mana: 1, cleanse: 2 },
  bossWaveIndex: 0,
  campaign: null,
  bossFirst: null,
  /** Raid legion lobby (docs/raids · content/campaign/raids_sl.json). */
  raidsCatalog: null,
  raidId: "myaurra",
  raidPath: "short", // short | long — фиксируется голосованием после 1-го отряда
  raidPathLocked: false,
  raidPathNodeIndex: 0,
  raidPathVoteOpen: false,
  raidPathVotes: { short: 0, long: 0, myVote: null, botsDone: false },
  raidLegionCount: 0,
  /** 12-slot legion roster: { row, col, role, sub, templateId, name_ru } */
  raidLegion: [],
  raidAttemptsLeft: 3,
  raidWeeklyLocked: false,
  /** When «Строй» from raid → viewFormation shows 12-cat legion editor. */
  formationMode: "",
  /** Preview 4×3 board before CreatePvE (final fight art comes later). */
  raidBattlePreview: false,
  /** Solo QA stub: one player owns all 12 legion slots for full raid smoke. */
  raidSoloStub: false,
  raidLastLoot: null,
  /** Live turn countdown (BATTLE_TURN_TIMER_SEC). */
  battleTurnLeft: BATTLE_TURN_TIMER_SEC,
  battleTurnTimer: null,
  battleTurnKey: "",
  progress: {
    pveWins: 0,
    practiceWins: 0,
    pvpWins: 0,
    clearedFights: {}, // stageId -> true
    dungeon: {
      keys: {},
      firstClear: {},
      rares: [],
      mats: {},
      runs: 0,
      keysSeeded: false,
    },
    raidLootClaimed: false,
  },
};

/** Seed for warehouse stub reset / API mirror (D-028). */
const GEAR_CATALOG_SEED = JSON.parse(JSON.stringify(state.gearCatalog));

/** Armor/weapon sets that drop as PvE-only copies (shop sells PvP lane only). */
const PVE_SET_IDS = PVE_SET_IDS_SEED;
/** Dungeon → typical PvE set rank drop (boss). Higher = easier clears vs fixed monster HP. */
const DUNGEON_PVE_SET_DROP = {
  scarlet: "grey",
  howl: "green",
  whisper: "blue",
};
const RAID_PVE_SET_DROP = {
  myaurra: "yellow",
  talass: "purple",
  vulcan: "red",
};

function withGearLane(item, lane) {
  const next = { ...item, lane, qty: Number(item.qty || GEAR_HERO_STOCK) };
  if (lane === "pve") {
    next.pveOnly = true;
    next.id = item.id.startsWith("pve_") ? item.id : `pve_${item.id}`;
    next.name = item.name?.startsWith("PvE ·") ? item.name : `PvE · ${item.name}`;
  } else {
    next.pveOnly = false;
    if (!next.name?.startsWith("PvP ·") && !item.id.startsWith("pve_")) {
      next.name = item.name;
    }
  }
  return next;
}

function buildPveGearSeedFromPvp(pvpItems) {
  const out = [];
  for (const item of pvpItems) {
    if (item.lane === "pve" || item.pveOnly) continue;
    const isSet = item.set && PVE_SET_IDS.includes(item.set);
    const isWeapon = item.slot === "weapon" || item.slot === "shield";
    if (!isSet && !isWeapon) continue;
    out.push(withGearLane(item, "pve"));
  }
  return out;
}

/** Normalize seed: shop/catalog defaults to PvP; dungeon rares stay PvE. Stock ×18. */
(function seedGearLanes() {
  for (const g of state.gearCatalog) {
    if (g.pveOnly || g.lane === "pve") {
      g.lane = "pve";
      g.pveOnly = true;
    } else {
      g.lane = "pvp";
      g.pveOnly = false;
    }
    if (g.qty == null || g.qty < GEAR_HERO_STOCK) g.qty = GEAR_HERO_STOCK;
  }
  const pveSeed = buildPveGearSeedFromPvp(state.gearCatalog);
  const have = new Set(state.gearCatalog.map((g) => g.id));
  for (const g of pveSeed) {
    if (!have.has(g.id)) {
      state.gearCatalog.push(g);
      have.add(g.id);
    }
  }
  GEAR_CATALOG_SEED.length = 0;
  for (const g of state.gearCatalog) GEAR_CATALOG_SEED.push(JSON.parse(JSON.stringify(g)));
})();

function equipMapForLane(lane = state.equipLane) {
  if (lane === "pvp") {
    if (!state.equippedPvpByCat) state.equippedPvpByCat = {};
    return state.equippedPvpByCat;
  }
  if (!state.equippedPveByCat) state.equippedPveByCat = {};
  return state.equippedPveByCat;
}

function syncEquippedAlias() {
  state.equippedByCat = equipMapForLane(state.equipLane || "pve");
}

function gearLaneOf(item) {
  if (!item) return "pvp";
  if (item.lane === "pve" || item.pveOnly) return "pve";
  return item.lane === "pvp" ? "pvp" : "pvp";
}

/** How many copies of this gear id are currently worn (lane-scoped). */
function gearWornCount(gearId, lane = state.equipLane || "pve") {
  if (!gearId) return 0;
  const map = equipMapForLane(lane);
  let n = 0;
  for (const eq of Object.values(map || {})) {
    for (const id of Object.values(eq || {})) {
      if (id === gearId) n += 1;
    }
  }
  return n;
}

function gearOwnedQty(item) {
  if (!item) return 0;
  return Math.max(1, Number(item.qty) || GEAR_HERO_STOCK);
}

/** Free copies left in bag/barn for this stack. */
function gearAvailableQty(item, lane = state.equipLane || "pve") {
  if (!item) return 0;
  return Math.max(0, gearOwnedQty(item) - gearWornCount(item.id, lane));
}

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

function ensureDungeonProgress() {
  if (!state.progress.dungeon || typeof state.progress.dungeon !== "object") {
    state.progress.dungeon = {
      keys: {},
      firstClear: {},
      rares: [],
      mats: {},
      runs: 0,
      keysSeeded: false,
    };
  }
  const d = state.progress.dungeon;
  if (!d.keys || typeof d.keys !== "object") d.keys = {};
  if (!d.firstClear || typeof d.firstClear !== "object") d.firstClear = {};
  if (!Array.isArray(d.rares)) d.rares = [];
  if (!d.mats || typeof d.mats !== "object") d.mats = {};
  if (typeof d.runs !== "number") d.runs = 0;
  return d;
}

function seedDungeonKeysIfNeeded() {
  const d = ensureDungeonProgress();
  if (d.keysSeeded || !state.dungeonCoop?.starterKeys) return;
  for (const [id, n] of Object.entries(state.dungeonCoop.starterKeys)) {
    if (typeof d.keys[id] !== "number") d.keys[id] = Number(n) || 0;
  }
  d.keysSeeded = true;
  persistProgress();
}

function persistProgress() {
  try {
    ensureDungeonProgress();
    localStorage.setItem("mythfel_sl_progress", JSON.stringify(state.progress));
  } catch (_) {}
}

function persistGearStub() {
  try {
    syncEquippedAlias();
    localStorage.setItem(
      "mythfel_sl_gear",
      JSON.stringify({
        version: GEAR_STUB_VERSION,
        gearCatalog: state.gearCatalog,
        equipLane: state.equipLane || "pve",
        equippedByCat: state.equippedByCat,
        equippedPveByCat: state.equippedPveByCat,
        equippedPvpByCat: state.equippedPvpByCat,
        barnCapMax: state.barnCapMax,
        barnMats: state.barnMats,
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
        dungeon: parsed.dungeon || {
          keys: {},
          firstClear: {},
          rares: [],
          mats: {},
          runs: 0,
          keysSeeded: false,
        },
      };
    }
  } catch (_) {}
  ensureDungeonProgress();
}

/** Append seed items missing from persisted catalog (e.g. new rings). */
function mergeGearCatalogSeed() {
  const have = new Set((state.gearCatalog || []).map((g) => g.id));
  for (const seed of GEAR_CATALOG_SEED) {
    if (have.has(seed.id)) continue;
    state.gearCatalog.push(JSON.parse(JSON.stringify(seed)));
  }
}

function mergeBarnMatsSeed() {
  if (!Array.isArray(state.barnMats)) state.barnMats = [];
  const have = new Set(state.barnMats.map((m) => m.id));
  for (const seed of BARN_MATS_SEED) {
    if (have.has(seed.id)) continue;
    state.barnMats.push(JSON.parse(JSON.stringify(seed)));
  }
  for (const m of state.barnMats) {
    if (m.kind === "tool" || String(m.id || "").startsWith("tool_")) ensureToolDurability(m);
  }
}

function loadGearStub() {
  try {
    const raw = localStorage.getItem("mythfel_sl_gear");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const stale = Number(parsed.version || 0) < GEAR_STUB_VERSION;
    if (stale) {
      // Drop old turquoise / pre-R7–R8 catalogs; reseed from GEAR_CATALOG_SEED.
      state.gearCatalog = JSON.parse(JSON.stringify(GEAR_CATALOG_SEED));
      state.equippedPveByCat = {};
      state.equippedPvpByCat = {};
      state.equippedByCat = {};
      state.barnCapMax = Math.max(256, Number(parsed.barnCapMax) || 256);
      if (Array.isArray(parsed.barnMats) && parsed.barnMats.length) {
        state.barnMats = parsed.barnMats;
        mergeBarnMatsSeed();
      }
      syncEquippedAlias();
      persistGearStub();
      return;
    }
    if (Array.isArray(parsed.gearCatalog) && parsed.gearCatalog.length) {
      state.gearCatalog = parsed.gearCatalog;
      mergeGearCatalogSeed();
      for (const g of state.gearCatalog) {
        if (!g.lane) g.lane = g.pveOnly ? "pve" : "pvp";
        if (g.qty == null) g.qty = GEAR_HERO_STOCK;
        if (g.set === "turquoise") g.set = "blue";
        if (String(g.id || "").includes("turquoise_")) {
          g.id = String(g.id).replace(/turquoise_/g, "blue_");
        }
      }
    }
    if (parsed.equipLane === "pve" || parsed.equipLane === "pvp") {
      state.equipLane = parsed.equipLane;
    }
    if (parsed.equippedPveByCat && typeof parsed.equippedPveByCat === "object") {
      state.equippedPveByCat = parsed.equippedPveByCat;
    }
    if (parsed.equippedPvpByCat && typeof parsed.equippedPvpByCat === "object") {
      state.equippedPvpByCat = parsed.equippedPvpByCat;
    }
    if (parsed.equippedByCat && typeof parsed.equippedByCat === "object") {
      if (!Object.keys(state.equippedPveByCat || {}).length) {
        state.equippedPveByCat = JSON.parse(JSON.stringify(parsed.equippedByCat));
      }
      if (!Object.keys(state.equippedPvpByCat || {}).length) {
        state.equippedPvpByCat = JSON.parse(JSON.stringify(parsed.equippedByCat));
      }
    }
    syncEquippedAlias();
    if (typeof parsed.barnCapMax === "number" && parsed.barnCapMax > 0) {
      state.barnCapMax = Math.max(parsed.barnCapMax, 256);
    }
    if (Array.isArray(parsed.barnMats) && parsed.barnMats.length) {
      state.barnMats = parsed.barnMats;
      mergeBarnMatsSeed();
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
    if (state.battleMode === "boss") {
      return "viewRaidBattle";
    }
    if (
      state.battleMode === "practice" ||
      state.battleMode === "pve" ||
      state.battleMode === "dungeon"
    ) {
      return "viewPracticeFight";
    }
    if (state.battleMode === "pvp") return "viewPvpFight";
    return "viewBattle";
  }
  if (state.raidBattlePreview) return "viewRaidBattle";
  // Mid-chapter / mid-dungeon wave clear / in-flight next CreatePvE: keep fight HUD (no victory).
  if (
    (state.battleMode === "pve" &&
      (state.pveAdvancingWave ||
        (state.battle?.result === "p1_win" && !state.lastResult))) ||
    (state.battleMode === "dungeon" &&
      (state.dungeonAdvancing ||
        (state.battle?.result === "p1_win" && !state.lastResult)))
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
    if (state.lastResult.result === "p1_win" && state.battleMode === "boss") {
      return "viewResultWin";
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
    raid_battle: "viewRaidBattle",
    battle: "viewBattle",
    pvp: "viewPvp",
    pve_load: "viewPveLoad",
    pve_fight: "viewPveFight",
    pve_victory: "viewPveVictory",
    pvp_load: "viewPvpLoad",
    pvp_fight: "viewPvpFight",
    pvp_victory: "viewPvpVictory",
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
    guild_hub: "viewGuildHub",
    guild_members: "viewGuildMembers",
    guild_tech: "viewGuildTech",
    guild_treasury: "viewGuildTreasury",
    guild_battle: "viewGuildBattle",
    chat_global: "viewChatGlobal",
    chat_guild: "viewChatGuild",
    chat_friends: "viewChatFriends",
    rating_players: "viewRatingPlayers",
    rating_dungeon: "viewRatingDungeon",
    rating_raid: "viewRatingRaid",
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
    viewRatingDungeon: "rating_dungeon",
    viewRatingRaid: "rating_raid",
    viewRatingGuilds: "rating_guilds",
  };
  if (special[viewId]) return special[viewId];
  return viewId.replace(/^view/, "").toLowerCase();
}

/** Hydrate deferred stitch imgs/bgs only for the active view (keeps boot off heavy raster dump). */
function hydrateViewImages(root) {
  if (!root) return;
  root.querySelectorAll("img[data-mf-src]").forEach((img) => {
    const src = img.getAttribute("data-mf-src");
    if (!src || img.getAttribute("src") === src) return;
    img.decoding = "async";
    img.setAttribute("src", src);
    img.removeAttribute("data-mf-src");
  });
  root.querySelectorAll("[data-mf-bg]").forEach((el) => {
    const url = el.getAttribute("data-mf-bg");
    if (!url) return;
    el.style.backgroundImage = `url("${url}")`;
    el.removeAttribute("data-mf-bg");
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
  // Warm current + next-likely screen art (not every chapter / every pack).
  if (id === "viewLogin") preloadScreenBgs("login", "yard");
  else if (id === "viewYard") preloadScreenBgs("yard", "dojoLoad", "dojo");
  else if (id === "viewPractice" || id === "viewPracticeLoad") {
    preloadScreenBgs("dojoLoad", "dojo");
    prefetchSquadCardArt(combatSquadForPrefetch());
  } else if (id === "viewPracticeFight") {
    preloadScreenBgs("dojo", "pveVictory", "victoryHall");
    prefetchSquadCardArt(combatSquadForPrefetch());
  } else if (id === "viewPvpLoad") preloadScreenBgs("pvpLoad", "arenaInterior");
  else if (id === "viewPvpFight") preloadScreenBgs("arenaInterior", "pvpVictory");
  else if (id === "viewPveVictory" || id === "viewVictoryHall" || id === "viewPvpVictory") {
    preloadScreenBgs("pveVictory", "victoryHall", "pvpVictory", "yard");
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
  for (const lane of ["pve", "pvp"]) {
    const map = equipMapForLane(lane);
    for (const c of cats) {
      if (!map[c.catId]) {
        map[c.catId] = emptyEquipSlots();
      } else {
        for (const slot of HOME_SLOT_ORDER) {
          if (!(slot in map[c.catId])) map[c.catId][slot] = null;
        }
      }
    }
  }
  syncEquippedAlias();
  ensureStarterPveGrey();
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
  shop_tank_fire: { atk: 4, hp: 50, spd: 3, skill: 2, charm: 4 },
  shop_tank_water: { atk: 6, hp: 48, spd: 3, skill: 2, charm: 4 },
  shop_tank_wind: { atk: 4, hp: 50, spd: 4, skill: 3, charm: 4 },
  shop_fighter_fire: { atk: 8, hp: 43, spd: 7, skill: 3, charm: 3 },
  shop_fighter_water: { atk: 10, hp: 45, spd: 5, skill: 3, charm: 3 },
  shop_fighter_wind: { atk: 8, hp: 42, spd: 7, skill: 4, charm: 3 },
  shop_assassin_fire: { atk: 8, hp: 38, spd: 9, skill: 4, charm: 4 },
  shop_assassin_water: { atk: 8, hp: 36, spd: 8, skill: 4, charm: 4 },
  shop_assassin_wind: { atk: 7, hp: 37, spd: 9, skill: 5, charm: 4 },
  shop_ranger_fire: { atk: 7, hp: 35, spd: 8, skill: 4, charm: 3 },
  shop_ranger_water: { atk: 7, hp: 37, spd: 7, skill: 5, charm: 3 },
  shop_ranger_wind: { atk: 7, hp: 35, spd: 8, skill: 5, charm: 3 },
  shop_mage_fire: { atk: 5, hp: 30, spd: 5, skill: 8, charm: 3 },
  shop_mage_water: { atk: 5, hp: 29, spd: 5, skill: 8, charm: 3 },
  shop_mage_wind: { atk: 5, hp: 30, spd: 6, skill: 8, charm: 3 },
  shop_support_fire: { atk: 3, hp: 28, spd: 5, skill: 7, charm: 6 },
  shop_support_water: { atk: 2, hp: 28, spd: 5, skill: 7, charm: 6 },
  shop_support_wind: { atk: 3, hp: 29, spd: 5, skill: 7, charm: 6 },
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

function gearBonusForCat(catId, lane = state.equipLane || "pve") {
  const eq = equipMapForLane(lane)[catId] || {};
  const bonus = { atk: 0, hp: 0, def: 0, spd: 0 };
  for (const slot of HOME_SLOT_ORDER) {
    const id = eq[slot];
    if (!id) continue;
    const item = state.gearCatalog.find((g) => g.id === id);
    if (!item) continue;
    if (gearLaneOf(item) !== lane) continue;
    bonus.atk += item.atk || 0;
    bonus.hp += item.hp || 0;
    bonus.def += item.def || 0;
    bonus.spd += item.spd || 0;
  }
  return bonus;
}

/** Starter PvE grey — dungeon/raid only lane; shop never sells PvE. Grey clears hard, higher sets easier. */
function ensureStarterPveGrey() {
  const have = new Set((state.gearCatalog || []).map((g) => g.id));
  let added = 0;
  for (const seed of GEAR_CATALOG_SEED) {
    if (seed.lane !== "pve" || seed.set !== "grey") continue;
    if (have.has(seed.id)) continue;
    state.gearCatalog.push(JSON.parse(JSON.stringify(seed)));
    have.add(seed.id);
    added++;
  }
  const cats = (state.profile?.cats || []).filter((c) => c.role !== "farm");
  const map = equipMapForLane("pve");
  for (const cat of cats) {
    if (!map[cat.catId]) map[cat.catId] = emptyEquipSlots();
    const eq = map[cat.catId];
    const empty = HOME_SLOT_ORDER.every((s) => !eq[s]);
    if (!empty) continue;
    for (const slot of HOME_SLOT_ORDER) {
      const piece = state.gearCatalog.find(
        (g) => g.lane === "pve" && g.set === "grey" && g.slot === slot && canEquipItemForLane(cat.catId, g, "pve"),
      );
      if (!piece) continue;
      eq[slot] = null;
      if (gearAvailableQty(piece, "pve") > 0) eq[slot] = piece.id;
    }
  }
  syncEquippedAlias();
  if (added) persistGearStub();
}

function canEquipItemForLane(catOrId, item, lane) {
  if (!item) return false;
  if (gearLaneOf(item) !== lane) return false;
  if (!item.roles || item.roles.length === 0) return true;
  const role = catRoleOf(catOrId);
  return !!role && item.roles.includes(role);
}

function setEquipLane(lane) {
  state.equipLane = lane === "pvp" ? "pvp" : "pve";
  syncEquippedAlias();
  persistGearStub();
  if (typeof renderHome === "function") {
    try {
      renderHome();
    } catch (_) {}
  }
  toast(state.equipLane === "pvp" ? "Экип: PvP (магазин)" : "Экип: PvE (данжи/рейды)");
}

function grantShopPvpGear(offerId) {
  const setId = offerId === "pvp_set_green" ? "green" : "grey";
  const pieces = (state.gearCatalog || []).filter((g) => g.lane === "pvp" && g.set === setId);
  if (!pieces.length) {
    toast("PvP сет не найден в каталоге");
    return;
  }
  toast(`Куплено PvP · ${setId} (${pieces.length} слотов) — stub`);
  persistGearStub();
}

function grantPveSetPiece(setId, preferredSlot = null) {
  const pool = (state.gearCatalog || []).filter((g) => g.lane === "pve" && g.set === setId);
  if (!pool.length) return null;
  let piece = preferredSlot ? pool.find((g) => g.slot === preferredSlot) : null;
  if (!piece) piece = pool[Math.floor(Math.random() * pool.length)];
  const existing = state.gearCatalog.find((g) => g.id === piece.id);
  if (existing) existing.qty = Number(existing.qty || 1) + 1;
  toast(`PvE дроп: ${piece.name}`);
  persistGearStub();
  return piece;
}

/** Team gear payload for CreatePvE / CreatePvP — len 3, matches squad template order. */
function teamGearForTemplates(templateIds, lane = "pve") {
  const cats = state.profile?.cats || [];
  const used = new Set();
  const out = [];
  for (const tid of templateIds || []) {
    const cat = cats.find((c) => c.templateId === tid && !used.has(c.catId));
    if (cat) used.add(cat.catId);
    const bonus = cat ? gearBonusForCat(cat.catId, lane) : { atk: 0, hp: 0, def: 0, spd: 0 };
    out.push({
      hp: bonus.hp || 0,
      atk: bonus.atk || 0,
      def: bonus.def || 0,
      spd: bonus.spd || 0,
    });
  }
  while (out.length < 3) out.push({ hp: 0, atk: 0, def: 0, spd: 0 });
  return out.slice(0, 3);
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

/** Armor/ring (roles null/[]) → all heroes. Weapons/shield → only listed roles. Lane must match equipLane. */
function canEquipItem(catOrId, item) {
  if (!item) return false;
  if (gearLaneOf(item) !== (state.equipLane || "pve")) return false;
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
    if (gearLaneOf(item) !== (state.equipLane || "pve")) {
      toast(`${item.name}: слот ${gearLaneOf(item) === "pve" ? "PvE" : "PvP"} — переключи ленту экипа`);
      return;
    }
    equipDenyToast(item, catId);
    return;
  }
  const map = equipMapForLane();
  if (!map[catId]) map[catId] = emptyEquipSlots();
  const eq = map[catId];
  const prev = eq[item.slot];
  // Free own slot first so stack availability counts correctly.
  eq[item.slot] = null;
  if (gearAvailableQty(item) <= 0) {
    eq[item.slot] = prev;
    toast(`${item.name}: нет свободных копий (×${gearOwnedQty(item)})`);
    return;
  }
  eq[item.slot] = itemId;
  syncEquippedAlias();
  toast(`${item.name} → надето (${state.equipLane === "pvp" ? "PvP" : "PvE"}) · остаток ×${gearAvailableQty(item)}`);
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
    b.textContent = t(tab.key, tab.label || tab.id);
    b.dataset.tab = tab.id;
    if (tab.stub) b.classList.add("stub");
    if (tab.soon) b.classList.add("soon");
    if (tab.gated) b.classList.add("gated");
    if (tab.id === "pvp" && !pvpUnlocked()) b.classList.add("locked");
    const tabOn =
      state.tab === tab.id ||
      (tab.id === "pve" && state.tab === "yard") ||
      (tab.id === "guild" &&
        (state.tab === "guild_members" || state.tab === "guild_tech" || state.tab === "guild_treasury"));
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
    starter_tank_stone: { role: "tank", element: "fire", lane: "vanguard" },
    starter_fighter_fire: { role: "fighter", element: "fire", lane: "center" },
    starter_support_water: { role: "support", element: "water", lane: "rear" },
    shop_tank_fire: { role: "tank", element: "fire", lane: "vanguard" },
    shop_tank_water: { role: "tank", element: "water", lane: "vanguard" },
    shop_tank_wind: { role: "tank", element: "wind", lane: "vanguard" },
    shop_fighter_fire: { role: "fighter", element: "fire", lane: "center" },
    shop_fighter_water: { role: "fighter", element: "water", lane: "center" },
    shop_fighter_wind: { role: "fighter", element: "wind", lane: "center" },
    shop_assassin_fire: { role: "assassin", element: "fire", lane: "center" },
    shop_assassin_water: { role: "assassin", element: "water", lane: "center" },
    shop_assassin_wind: { role: "assassin", element: "wind", lane: "center" },
    shop_ranger_fire: { role: "ranger", element: "fire", lane: "rear" },
    shop_ranger_water: { role: "ranger", element: "water", lane: "rear" },
    shop_ranger_wind: { role: "ranger", element: "wind", lane: "rear" },
    shop_mage_fire: { role: "mage", element: "fire", lane: "rear" },
    shop_mage_water: { role: "mage", element: "water", lane: "rear" },
    shop_mage_wind: { role: "mage", element: "wind", lane: "rear" },
    shop_support_fire: { role: "support", element: "fire", lane: "rear" },
    shop_support_water: { role: "support", element: "water", lane: "rear" },
    shop_support_wind: { role: "support", element: "wind", lane: "rear" },
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

/**
 * Collection preset → combat templateIds (sim front→mid→rear).
 * Collection UI stores [тыл, центр, авангард]; battle wants [авангард, центр, тыл].
 */
function collectionPresetTemplateIds(pi = state.colPresetIndex || 0) {
  if (typeof collectionEnsurePresets === "function") collectionEnsurePresets();
  const preset = state.profile?.presets?.[pi];
  if (!preset || !Array.isArray(preset.catIds)) return null;
  const visual = [0, 1, 2].map((i) => collectionCatById(preset.catIds[i])).filter(Boolean);
  if (visual.length !== 3) return null;
  return [visual[2], visual[1], visual[0]].map((c) => c.templateId).filter(Boolean);
}

/** Active 3-cat team: PvP / practice / collection preset / starters (B5). */
function combatSquadIds() {
  if (state.battleMode === "pvp" && Array.isArray(state.pvpSquad) && state.pvpSquad.length === 3) {
    return [...state.pvpSquad];
  }
  if (state.battleMode === "practice" && Array.isArray(state.practiceSquad) && state.practiceSquad.length === 3) {
    return [...state.practiceSquad];
  }
  const fromCol = collectionPresetTemplateIds();
  if (fromCol && fromCol.length === 3) return fromCol;
  if (Array.isArray(state.practiceSquad) && state.practiceSquad.length === 3) {
    return [...state.practiceSquad];
  }
  const starters = combatStarterIds();
  return starters.length === 3 ? [...starters] : [...STARTERS];
}

/** PvP lobby squad (front tank → mid DPS → rear support). */
function pvpSquadIds() {
  if (Array.isArray(state.pvpSquad) && state.pvpSquad.length === 3) {
    return [...state.pvpSquad];
  }
  return ["shop_tank_fire", "shop_fighter_fire", "shop_support_water"];
}

/** mythmir_{ch}_f{1|2|3} → { chapter, stage: entrance|tunnel|boss } or null. */
function parseMythmirStageId(stageId) {
  const m = String(stageId || "").match(/^mythmir_([1-5])_f([123])$/);
  if (!m) return null;
  const fight = Number(m[2]);
  return {
    chapter: Number(m[1]),
    stage: fight === 2 ? "tunnel" : fight === 3 ? "boss" : "entrance",
    fight,
  };
}

/** Keep pveChapter / pveStage / selectedStageId aligned with Mythmir SSOT (D-039 / D-051). */
function syncPveFromStageId(stageId = state.selectedStageId) {
  const parsed = parseMythmirStageId(stageId);
  if (!parsed) return false;
  state.pveChapter = parsed.chapter;
  state.pveStage = parsed.stage;
  state.selectedStageId = `mythmir_${parsed.chapter}_f${parsed.fight}`;
  return true;
}

/** Co-op dungeon catalog helpers (docs/dungeons-coop-3.md). */
function dungeonById(id = state.selectedDungeonId) {
  const list = state.dungeonCoop?.dungeons || [];
  return list.find((d) => d.id === id) || list[0] || null;
}

function dungeonPathNodes(dungeonId = state.selectedDungeonId, path = state.dungeonPath, fork = state.dungeonFork) {
  const d = dungeonById(dungeonId);
  const route = d?.paths?.[path];
  if (!route || !Array.isArray(route.nodes)) return [];
  if (path !== "long" || !route.forkF2) return route.nodes.slice();
  const side = fork === "right" ? "right" : "left";
  const forkNodes = route.forkF2[side];
  if (!Array.isArray(forkNodes) || !forkNodes.length) return route.nodes.slice();
  const forkIds = new Set([...(route.forkF2.left || []), ...(route.forkF2.right || [])]);
  const prefix = [];
  for (const sid of route.nodes) {
    if (forkIds.has(sid)) break;
    prefix.push(sid);
  }
  return prefix.concat(forkNodes);
}

function dungeonKeyCount(id = state.selectedDungeonId) {
  const d = ensureDungeonProgress();
  return Number(d.keys[id] || 0);
}

async function spendDungeonKey(id = state.selectedDungeonId) {
  const d = ensureDungeonProgress();
  const n = Number(d.keys[id] || 0);
  if (n <= 0) return false;
  const userId = state.profile?.userId || state.session?.userId || "local_smoke";
  try {
    const { data } = await api("/api/dev/dungeon/keys/spend", {
      method: "POST",
      body: JSON.stringify({ userId, dungeonId: id }),
    });
    if (data?.ok && data.keys) {
      d.keys = { ...data.keys };
      persistProgress();
      return true;
    }
  } catch (_) {
    /* local fallback */
  }
  d.keys[id] = n - 1;
  persistProgress();
  return true;
}

async function syncDungeonStateFromServer() {
  try {
    const userId = state.profile?.userId || state.session?.userId || "local_smoke";
    const { data } = await api(`/api/dev/dungeon/state?userId=${encodeURIComponent(userId)}`);
    if (!data?.keys) return false;
    const d = ensureDungeonProgress();
    d.keys = { ...data.keys };
    d.firstClear = { ...(data.firstClear || {}) };
    d.rares = Array.isArray(data.rares) ? data.rares.slice() : d.rares;
    d.mats = { ...(data.mats || {}) };
    d.runs = Number(data.runs || 0);
    d.keysSeeded = true;
    if (typeof data.fish === "number") {
      if (state.profile) state.profile.fish = data.fish;
      state.wallet.gold = data.fish;
    }
    if (data.party?.members) {
      state.dungeonParty = data.party.members.map((m, i) => ({
        slot: m.slot ?? i,
        name: m.name || m.userId,
        ready: !!m.ready,
        bot: !!m.bot,
        local: i === 0,
      }));
      state.dungeonPartyCode = data.party.code;
    }
    persistProgress();
    renderCurrency();
    renderDungeonLobby();
    return true;
  } catch (_) {
    return false;
  }
}

async function buyDungeonKey(id = state.selectedDungeonId) {
  const dung = dungeonById(id);
  if (!dung) return false;
  const cost = Number(dung.keyFishCost) || 80;
  const userId = state.profile?.userId || state.session?.userId || "local_smoke";
  try {
    const { data } = await api("/api/dev/dungeon/keys/buy", {
      method: "POST",
      body: JSON.stringify({ userId, dungeonId: id }),
    });
    if (data?.ok) {
      const d = ensureDungeonProgress();
      d.keys = { ...data.keys };
      if (typeof data.fish === "number") {
        if (state.profile) state.profile.fish = data.fish;
        state.wallet.gold = data.fish;
      }
      persistProgress();
      renderCurrency();
      renderDungeonLobby();
      toast(`Ключ +1 · ${dung.title_ru} (−${cost} рыбы · server)`);
      return true;
    }
  } catch (_) {
    /* local fallback */
  }
  const fish = state.profile?.fish ?? state.wallet?.gold ?? 0;
  if (fish < cost) {
    toast(`Нужно ${cost} рыбы на ключ`);
    return false;
  }
  if (state.profile && typeof state.profile.fish === "number") {
    state.profile.fish -= cost;
    state.wallet.gold = state.profile.fish;
  } else {
    state.wallet.gold = Math.max(0, (state.wallet.gold || 0) - cost);
  }
  const d = ensureDungeonProgress();
  d.keys[id] = Number(d.keys[id] || 0) + 1;
  persistProgress();
  renderCurrency();
  renderDungeonLobby();
  toast(`Ключ +1 · ${dung.title_ru} (−${cost} рыбы)`);
  return true;
}

function grantDungeonFish(amount) {
  const n = Math.max(0, Number(amount) || 0);
  if (!n) return;
  if (state.profile && typeof state.profile.fish === "number") {
    state.profile.fish += n;
    state.wallet.gold = state.profile.fish;
  } else {
    state.wallet.gold = (state.wallet.gold || 0) + n;
  }
  renderCurrency();
}

function grantDungeonMat(matId, qty = 1) {
  const d = ensureDungeonProgress();
  d.mats[matId] = Number(d.mats[matId] || 0) + qty;
  const barn = (state.barnMats || []).find((m) => m.id === matId);
  if (barn) barn.qty = Number(barn.qty || 0) + qty;
  else {
    if (!Array.isArray(state.barnMats)) state.barnMats = [];
    state.barnMats.push({
      id: matId,
      name: matId,
      kind: "dungeon",
      rarity: "rare",
      qty,
      tag: "Данж",
      desc: "Материал кооп-данжа",
    });
  }
  persistGearStub();
}

function upsertDungeonRareGear(rare) {
  if (!rare?.id) return;
  const def = (state.dungeonRares?.items || []).find((x) => x.id === rare.id) || rare;
  const existing = (state.gearCatalog || []).find((g) => g.id === def.id);
  if (existing) {
    existing.qty = Number(existing.qty || 1) + 1;
    return existing;
  }
  const item = {
    id: def.id,
    slot: def.slot || "ring",
    name: def.title_ru || def.id,
    atk: def.atk || 0,
    hp: def.hp || 0,
    def: def.def || 0,
    spd: def.spd || 0,
    crit: def.crit || 0,
    rank: 3,
    rarity: def.rarity || "rare",
    enhance: 0,
    set: "dungeon_rare",
    roles: null,
    qty: 1,
    pveOnly: true,
    lane: "pve",
    effect: def.effect_ru || "",
    iconSrc: "/barn-icons/fish.png",
  };
  state.gearCatalog.push(item);
  persistGearStub();
  return item;
}

function grantDungeonBossLoot() {
  const dung = dungeonById();
  if (!dung) return;
  const prog = ensureDungeonProgress();
  const path = state.dungeonPath === "long" ? "long" : "short";
  const bossTable = state.dungeonRewards?.bossLoot?.[path] || { fish: 80, rareChance: 0.55 };
  const first = !prog.firstClear[dung.id];
  grantDungeonFish(bossTable.fish || 80);

  if (path === "long") {
    const mats = state.dungeonRewards?.matsByDungeon?.[dung.id]?.long || dung.paths?.long?.uniqueMats || [];
    for (const mat of mats) grantDungeonMat(mat, 1);
  }

  const rares = dung.rareItems || [];
  let awarded = null;
  if (rares.length) {
    if (first && state.dungeonRewards?.firstClear?.guaranteeRare) {
      awarded = rares[0];
      prog.firstClear[dung.id] = true;
      grantDungeonFish(state.dungeonRewards?.firstClear?.fish || 150);
    } else {
      let chance = Number(bossTable.rareChance) || 0.55;
      if (path === "long") chance += Number(bossTable.pityBonus) || 0;
      if (Math.random() <= chance) {
        awarded = rares[Math.floor(Math.random() * rares.length)];
      }
    }
  }
  const setDrop = DUNGEON_PVE_SET_DROP[dung.id] || "grey";
  grantPveSetPiece(setDrop);

  if (awarded) {
    upsertDungeonRareGear(awarded);
    prog.rares.push({ id: awarded.id, dungeonId: dung.id, at: Date.now(), path });
    toast(`Редмет: ${awarded.title_ru || awarded.id}${first ? " · first-clear" : ""}`);
  } else {
    toast(`Босс сражён · +${bossTable.fish || 80} рыбы (редмет не выпал)`);
  }
  prog.runs = Number(prog.runs || 0) + 1;
  persistProgress();
  const userId = state.profile?.userId || state.session?.userId || "local_smoke";
  const mats =
    path === "long"
      ? state.dungeonRewards?.matsByDungeon?.[dung.id]?.long || dung.paths?.long?.uniqueMats || []
      : [];
  api("/api/dev/dungeon/clear", {
    method: "POST",
    body: JSON.stringify({
      userId,
      dungeonId: dung.id,
      rareId: awarded?.id || null,
      mats,
      fish: bossTable.fish || 80,
    }),
  }).catch(() => {});
  renderDungeonLobby();
}

function grantDungeonNodeLoot() {
  const path = state.dungeonPath === "long" ? "long" : "short";
  const table = state.dungeonRewards?.nodeLoot?.[path] || { fish: 25 };
  grantDungeonFish(table.fish || 25);
}

function applyDungeonPartySnapshot(party, userId) {
  if (!party?.members) return;
  state.dungeonPartyCode = party.code;
  state.dungeonParty = party.members.map((m, i) => ({
    slot: m.slot ?? i,
    name: m.name || m.userId,
    ready: !!m.ready,
    bot: !!m.bot,
    local: m.userId === userId,
  }));
  if (party.dungeonId) state.selectedDungeonId = party.dungeonId;
  if (party.path) state.dungeonPath = party.path === "long" ? "long" : "short";
  if (party.fork) state.dungeonFork = party.fork === "right" ? "right" : "left";
  renderDungeonLobby();
}

function stopDungeonPartyPoll() {
  if (state.dungeonPartyPollTimer) {
    clearInterval(state.dungeonPartyPollTimer);
    state.dungeonPartyPollTimer = null;
  }
}

function startDungeonPartyPoll() {
  stopDungeonPartyPoll();
  if (!state.dungeonPartyCode) return;
  state.dungeonPartyPollTimer = setInterval(() => {
    pollDungeonParty().catch(() => {});
  }, 2500);
}

async function pollDungeonParty() {
  const code = state.dungeonPartyCode;
  if (!code) return;
  const userId = state.profile?.userId || state.session?.userId || "local_smoke";
  try {
    const { data } = await api(`/api/dev/dungeon/party?code=${encodeURIComponent(code)}`);
    if (data?.ok && data.party) applyDungeonPartySnapshot(data.party, userId);
  } catch (_) {
    /* ignore */
  }
}

async function createDungeonParty() {
  const userId = state.profile?.userId || state.session?.userId || "local_smoke";
  try {
    const { data } = await api("/api/dev/dungeon/party/create", {
      method: "POST",
      body: JSON.stringify({
        userId,
        name: "Вы",
        dungeonId: state.selectedDungeonId,
        path: state.dungeonPath,
        fork: state.dungeonFork,
      }),
    });
    if (data?.ok && data.party) {
      applyDungeonPartySnapshot(data.party, userId);
      startDungeonPartyPoll();
      toast(`Лобби создано · код ${data.party.code}`);
      return;
    }
  } catch (err) {
    toast(`Пати API: ${err.message || "offline"}`);
  }
}

async function joinDungeonParty() {
  const root = $("viewBossDungeon");
  const input = root?.querySelector("[data-dungeon-party-join-input]");
  const code = String(input?.value || state.dungeonPartyCode || "")
    .trim()
    .toUpperCase();
  if (!code) {
    toast("Введите код пати");
    return;
  }
  const userId = state.profile?.userId || state.session?.userId || `guest_${Date.now().toString(36)}`;
  try {
    const { data } = await api("/api/dev/dungeon/party/join", {
      method: "POST",
      body: JSON.stringify({ userId, code, name: "Игрок" }),
    });
    if (data?.ok && data.party) {
      applyDungeonPartySnapshot(data.party, userId);
      startDungeonPartyPoll();
      toast(`Вы в пати ${data.party.code} · ${data.party.readyCount}/${data.party.size}`);
      return;
    }
    toast(data?.error || "Не удалось войти");
  } catch (err) {
    toast(`Join: ${err.message || "offline"}`);
  }
}

async function toggleDungeonPartyReady() {
  const userId = state.profile?.userId || state.session?.userId || "local_smoke";
  if (!state.dungeonPartyCode) {
    toast("Сначала создайте или войдите в пати");
    return;
  }
  const me = (state.dungeonParty || []).find((p) => p.local);
  const nextReady = !(me?.ready);
  try {
    const { data } = await api("/api/dev/dungeon/party/ready", {
      method: "POST",
      body: JSON.stringify({
        userId,
        code: state.dungeonPartyCode,
        ready: nextReady,
        dungeonId: state.selectedDungeonId,
        path: state.dungeonPath,
        fork: state.dungeonFork,
      }),
    });
    if (data?.ok && data.party) {
      applyDungeonPartySnapshot(data.party, userId);
      toast(nextReady ? "Ready ✓" : "Ready снято");
    }
  } catch (err) {
    toast(`Ready: ${err.message || "offline"}`);
  }
}

async function fillDungeonPartyBots() {
  const userId = state.profile?.userId || state.session?.userId || "local_smoke";
  try {
    const { data } = await api("/api/dev/dungeon/party/fill-bots", {
      method: "POST",
      body: JSON.stringify({
        userId,
        name: "Вы",
        dungeonId: state.selectedDungeonId,
        path: state.dungeonPath,
        fork: state.dungeonFork,
      }),
    });
    if (data?.ok && data.party?.members) {
      applyDungeonPartySnapshot(data.party, userId);
      startDungeonPartyPoll();
      toast(`Пати ${data.party.readyCount}/4 · код ${data.party.code}`);
      return;
    }
  } catch (_) {
    /* local fallback */
  }
  state.dungeonParty = [
    { slot: 0, name: "Вы", ready: true, local: true },
    { slot: 1, name: "Бот·Танк", ready: true, bot: true },
    { slot: 2, name: "Бот·DPS", ready: true, bot: true },
    { slot: 3, name: "Бот·Хил", ready: true, bot: true },
  ];
  renderDungeonLobby();
  toast("Пати 4/4 (локальные боты · бой всё ещё ваш 3v3)");
}

/** Default 3v3 wing for dungeon solo tests (tank · DPS · heal). */
function ensureDungeonTestSquad() {
  if (Array.isArray(state.practiceSquad) && state.practiceSquad.length === 3) {
    return [...state.practiceSquad];
  }
  const pick = ["shop_tank_fire", "shop_fighter_fire", "shop_support_water"];
  state.practiceSquad = [...pick];
  return [...pick];
}

/**
 * Solo QA stub: one player «owns» the whole party, picks 3 heroes, full dungeon path test.
 * Skips real MM; keeps combat as your 3v3 wing.
 */
function enableDungeonSoloTestStub() {
  state.dungeonSoloStub = true;
  state.dungeonParty = [
    { slot: 0, name: "Вы (соло-тест)", ready: true, local: true, solo: true },
    { slot: 1, name: "Слот·Вы·2", ready: true, local: true, solo: true },
    { slot: 2, name: "Слот·Вы·3", ready: true, local: true, solo: true },
    { slot: 3, name: "Слот·Вы·4", ready: true, local: true, solo: true },
  ];
  state.dungeonPartyCode = "SOLO";
  ensureDungeonTestSquad();
  seedDungeonKeysIfNeeded();
  // Extra keys so a full short+long smoke does not block on empty wallet.
  const prog = ensureDungeonProgress();
  const id = state.selectedDungeonId || "scarlet";
  prog.keys[id] = Math.max(prog.keys[id] | 0, 5);
  persistProgress();
  state.battleMode = "dungeon";
  renderDungeonLobby();
  toast("Соло-тест: пати 4/4 заглушка · выберите 3 котов в «Расстановка» · затем «В путь»");
}

function dungeonPartyReadyForStart() {
  if (state.dungeonSoloStub) return true;
  const readyN = (state.dungeonParty || []).filter((p) => p.ready).length;
  const sizeN = (state.dungeonParty || []).length;
  return sizeN >= 4 && readyN >= 4;
}

function renderDungeonSquadStrip() {
  const root = $("viewBossDungeon");
  if (!root) return;
  const host = root.querySelector("[data-dungeon-squad-strip]");
  if (!host) return;
  const squad = ensureDungeonTestSquad();
  const roles = ["ТАНК", "DPS", "САП"];
  const toneCls = [
    {
      border: "border-primary/40",
      badge: "bg-primary/15 text-primary border-primary/35",
    },
    {
      border: "border-tertiary/40",
      badge: "bg-tertiary/15 text-tertiary border-tertiary/35",
    },
    {
      border: "border-secondary/40",
      badge: "bg-secondary/15 text-secondary border-secondary/35",
    },
  ];
  host.innerHTML = squad
    .map((tid, i) => {
      const art =
        (typeof CAT_HERO_ART !== "undefined" && CAT_HERO_ART[tid]) ||
        `/stitch-assets/cat-heroes/tank-fire.jpg?v=elven18`;
      const name = String(tid).replace(/^shop_/, "").replace(/_/g, " ");
      const t = toneCls[i] || toneCls[0];
      return `<article class="relative flex gap-2 rounded-lg border ${t.border} bg-[#1a1613] overflow-hidden min-h-[4.4rem] flex-shrink-0">
        <img alt="" class="w-14 self-stretch object-cover object-top" src="${art}"/>
        <div class="flex-1 min-w-0 py-1.5 pr-2 flex flex-col justify-between">
          <div class="flex items-center justify-between gap-1">
            <span class="font-bold text-[12px] text-white truncate">${name}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded border font-bold ${t.badge}">${roles[i]}</span>
          </div>
          <div class="text-[10px] text-outline">${state.dungeonSoloStub ? "соло-тест · ваш выбор" : "ядро 3v3"}</div>
          <div class="text-[10px] text-on-surface-variant truncate">${tid}</div>
        </div>
      </article>`;
    })
    .join("");
}

function selectDungeon(id, path = state.dungeonPath, fork = state.dungeonFork) {
  const d = dungeonById(id);
  if (!d) {
    toast("Данж не найден в catalog");
    return;
  }
  state.selectedDungeonId = d.id;
  // Path is chosen in-battle by vote; keep provisional short for entry node only.
  state.dungeonPath = "short";
  state.dungeonPathLocked = false;
  state.dungeonPathVoteOpen = false;
  state.dungeonFork = fork === "right" ? "right" : "left";
  state.dungeonNodeIndex = 0;
  state.selectedStageId = dungeonEntryStageId(d.id) || state.selectedStageId;
  void path;
  renderDungeonLobby();
}

function renderDungeonLobby() {
  const root = $("viewBossDungeon");
  if (!root || !state.dungeonCoop) return;
  seedDungeonKeysIfNeeded();
  const d = dungeonById();
  if (!d) return;
  const nodes = dungeonPathNodes();
  const path = d.paths?.[state.dungeonPath];
  root.querySelectorAll(".dungeon-pick[data-dungeon]").forEach((el) => {
    const id = el.getAttribute("data-dungeon");
    el.classList.toggle("is-on", id === d.id);
  });
  root.querySelectorAll("[data-dungeon-path]").forEach((el) => {
    el.classList.add("hidden");
  });
  root.querySelectorAll("[data-dungeon-fork]").forEach((el) => {
    el.classList.toggle("is-on", el.getAttribute("data-dungeon-fork") === state.dungeonFork);
    el.classList.toggle(
      "hidden",
      !state.dungeonPathLocked || state.dungeonPath !== "long" || !path?.forkF2,
    );
  });
  const forkWrap = root.querySelector("[data-dungeon-fork-wrap]");
  if (forkWrap) {
    forkWrap.classList.toggle(
      "hidden",
      !state.dungeonPathLocked || state.dungeonPath !== "long" || !path?.forkF2,
    );
  }
  if (path?.forkF2) {
    const leftBtn = root.querySelector('[data-dungeon-fork="left"]');
    const rightBtn = root.querySelector('[data-dungeon-fork="right"]');
    if (leftBtn) leftBtn.textContent = path.forkF2.left_ru || "Налево";
    if (rightBtn) rightBtn.textContent = path.forkF2.right_ru || "Направо";
  }
  const pathHint = root.querySelector("[data-dungeon-path-hint]");
  if (pathHint) {
    pathHint.textContent = state.dungeonPathLocked
      ? `Путь зафиксирован: ${state.dungeonPath === "long" ? "длинный" : "короткий"}`
      : "Короткий/длинный путь — голосование после первого отряда (соло-тест: ваш голос = решение).";
  }
  const title = root.querySelector("[data-dungeon-active-title]");
  if (title) title.textContent = d.title_ru || d.id;
  const sub = root.querySelector("[data-dungeon-active-sub]");
  if (sub) {
    if (!state.dungeonPathLocked) {
      sub.textContent = `Входной отряд · путь позже голосованием · 3v3`;
    } else {
      const tmax =
        state.dungeonPath === "short"
          ? state.dungeonCoop.timing?.shortMaxMin
          : state.dungeonCoop.timing?.longMaxMin;
      const forkHint =
        state.dungeonPath === "long" && path?.forkF2
          ? ` · F2 ${state.dungeonFork === "right" ? path.forkF2.right_ru || "право" : path.forkF2.left_ru || "лево"}`
          : "";
      sub.textContent = `${path?.label_ru || state.dungeonPath}${forkHint} · ${nodes.length} узлов · ≤${tmax || "?"} мин · 3v3`;
    }
  }
  const timeEl = root.querySelector("[data-dungeon-time]");
  if (timeEl) {
    timeEl.textContent = state.dungeonPathLocked
      ? state.dungeonPath === "short"
        ? `≤${state.dungeonCoop.timing?.shortMaxMin || 10} мин`
        : `≤${state.dungeonCoop.timing?.longMaxMin || 15} мин`
      : `≤${state.dungeonCoop.timing?.shortMaxMin || 10}–${state.dungeonCoop.timing?.longMaxMin || 15} мин`;
  }
  const keysEl = root.querySelector("[data-dungeon-keys]");
  if (keysEl) keysEl.textContent = String(dungeonKeyCount(d.id));
  const runsEl = root.querySelector("[data-dungeon-runs]");
  if (runsEl) runsEl.textContent = String(ensureDungeonProgress().runs || 0);
  const raresEl = root.querySelector("[data-dungeon-rares-count]");
  if (raresEl) raresEl.textContent = String((ensureDungeonProgress().rares || []).length);
  const fcEl = root.querySelector("[data-dungeon-first-clear]");
  if (fcEl) {
    const done = !!ensureDungeonProgress().firstClear[d.id];
    fcEl.textContent = done ? "First-clear ✓" : "First-clear бонус";
    fcEl.classList.toggle("text-secondary", done);
  }
  const partyBox = root.querySelector("[data-dungeon-party]");
  if (partyBox) {
    partyBox.innerHTML = "";
    for (const p of state.dungeonParty || []) {
      const row = document.createElement("div");
      row.className =
        "rounded-md border px-2 py-1 text-[10px] flex justify-between " +
        (p.ready ? "border-primary/40 bg-primary/10" : "border-outline-variant/30 bg-[#1a1613]");
      row.innerHTML = `<span>${p.name}</span><b>${p.ready ? "ready" : "…"}</b>`;
      partyBox.appendChild(row);
    }
  }
  const codeEl = root.querySelector("[data-dungeon-party-code]");
  if (codeEl) {
    if (state.dungeonPartyCode) {
      codeEl.textContent = `Код: ${state.dungeonPartyCode}`;
      codeEl.classList.remove("hidden");
    } else {
      codeEl.textContent = "";
      codeEl.classList.add("hidden");
    }
  }
  const readyN = (state.dungeonParty || []).filter((p) => p.ready).length;
  const sizeN = (state.dungeonParty || []).length;
  const partyHint = root.querySelector("[data-dungeon-party-hint]");
  if (partyHint) {
    if (state.dungeonSoloStub) {
      partyHint.textContent = "Соло-тест · вы = вся пати 4/4 · бой ваш 3v3";
    } else {
      partyHint.textContent =
        readyN < 4
          ? `Пати ${readyN}/${Math.max(4, sizeN)} ready · или «Соло-тест»`
          : "Пати 4/4 ready · бой ядра 3v3";
    }
  }
  const soloChip = root.querySelector("[data-dungeon-solo-chip]");
  if (soloChip) {
    soloChip.classList.toggle("hidden", !state.dungeonSoloStub);
  }
  renderDungeonSquadStrip();
}

function dungeonEntryStageId(dungeonId = state.selectedDungeonId) {
  const d = dungeonById(dungeonId);
  return d?.paths?.short?.nodes?.[0] || d?.paths?.long?.nodes?.[0] || null;
}

function resetDungeonPathVote() {
  state.dungeonPathLocked = false;
  state.dungeonPathVoteOpen = false;
  state.dungeonPathVotes = { short: 0, long: 0, myVote: null, botsDone: false };
  state.dungeonPath = "short";
  state.dungeonNodeIndex = 0;
}

function openDungeonPathVote() {
  state.dungeonPathVoteOpen = true;
  state.dungeonAdvancing = false;
  state.battle = null;
  state.lastResult = null;
  state.dungeonPathVotes = { short: 0, long: 0, myVote: null, botsDone: false };
  // Solo stub: skip bot tally — one click locks.
  renderDungeonPathVotePanel();
  toast(
    state.dungeonSoloStub
      ? "Соло-тест: выберите короткий или длинный путь"
      : "Отряд сражён · голосуйте за путь",
  );
}

function renderDungeonPathVotePanel() {
  let panel = document.querySelector("[data-dungeon-path-vote]");
  if (!state.dungeonPathVoteOpen) {
    if (panel) panel.classList.add("hidden");
    return;
  }
  if (!panel) {
    panel = document.createElement("div");
    panel.setAttribute("data-dungeon-path-vote", "1");
    panel.className = "raid-path-vote";
    document.body.appendChild(panel);
  }
  panel.classList.remove("hidden");
  const d = dungeonById();
  const shortL = d?.paths?.short?.label_ru || "Короткий";
  const longL = d?.paths?.long?.label_ru || "Длинный";
  const v = state.dungeonPathVotes;
  const solo = !!state.dungeonSoloStub;
  panel.innerHTML = `
    <div class="raid-path-vote-card">
      <header>
        <span class="material-symbols-outlined text-primary">fork_right</span>
        <div>
          <strong>Выбор пути данжа</strong>
          <p>${solo ? "Соло-тест · ваш голос = решение" : "Голосование пати после 1-го отряда"}</p>
        </div>
      </header>
      <div class="raid-path-vote-opts">
        <button type="button" class="raid-path-vote-opt${v.myVote === "short" ? " is-on" : ""}" data-dungeon-vote="short">
          <b>Короткий</b><span>${shortL}</span>
        </button>
        <button type="button" class="raid-path-vote-opt${v.myVote === "long" ? " is-on" : ""}" data-dungeon-vote="long">
          <b>Длинный</b><span>${longL}</span>
        </button>
      </div>
      <footer>
        ${solo ? "" : `<button type="button" class="wire-btn" data-hud-action="dungeon-path-bots">Добор голосов</button>`}
        <button type="button" class="mode-cta" data-hud-action="dungeon-path-lock"${v.myVote ? "" : " disabled"}>Зафиксировать и дальше</button>
      </footer>
    </div>
  `;
  if (!panel.dataset.bound) {
    panel.dataset.bound = "1";
    panel.addEventListener("click", (ev) => {
      const vote = ev.target.closest("[data-dungeon-vote]");
      if (vote) {
        state.dungeonPathVotes.myVote = vote.getAttribute("data-dungeon-vote") === "long" ? "long" : "short";
        if (state.dungeonSoloStub) {
          state.dungeonPathVotes.short = state.dungeonPathVotes.myVote === "short" ? 1 : 0;
          state.dungeonPathVotes.long = state.dungeonPathVotes.myVote === "long" ? 1 : 0;
          state.dungeonPathVotes.botsDone = true;
        }
        renderDungeonPathVotePanel();
        return;
      }
      const act = ev.target.closest("[data-hud-action]");
      if (!act) return;
      const a = act.getAttribute("data-hud-action");
      if (a === "dungeon-path-bots") {
        state.dungeonPathVotes.botsDone = true;
        const lean = state.dungeonPathVotes.myVote || "short";
        state.dungeonPathVotes.short = lean === "short" ? 3 : 1;
        state.dungeonPathVotes.long = lean === "long" ? 3 : 1;
        renderDungeonPathVotePanel();
      }
      if (a === "dungeon-path-lock") {
        const my = state.dungeonPathVotes.myVote;
        if (!my) {
          toast("Сначала выберите путь");
          return;
        }
        const v2 = state.dungeonPathVotes;
        const win =
          state.dungeonSoloStub || v2.long === v2.short
            ? my
            : v2.long > v2.short
              ? "long"
              : "short";
        state.dungeonPath = win;
        state.dungeonPathLocked = true;
        state.dungeonPathVoteOpen = false;
        state.dungeonNodeIndex = 1;
        const nodes = dungeonPathNodes();
        state.selectedStageId = nodes[1] || nodes[0];
        renderDungeonPathVotePanel();
        toast(`Путь: ${win === "long" ? "длинный" : "короткий"} · дальше`);
        startYard(false);
      }
    });
  }
}

async function startDungeonRun() {
  const entry = dungeonEntryStageId();
  if (!entry) {
    toast("Нет узлов пути — проверьте dungeons_coop_v1.json");
    return;
  }
  const dung = dungeonById();
  if (dungeonKeyCount(dung?.id) <= 0) {
    toast("Нет ключа — купите за рыбу или «Соло-тест»");
    return;
  }
  if (!dungeonPartyReadyForStart()) {
    const readyN = (state.dungeonParty || []).filter((p) => p.ready).length;
    const sizeN = (state.dungeonParty || []).length;
    toast(
      `Пати ${readyN}/${Math.max(4, sizeN)} · нажмите «Соло-тест» или «Боты»`,
    );
    return;
  }
  ensureDungeonTestSquad();
  if (!(await spendDungeonKey(dung.id))) {
    toast("Не удалось списать ключ");
    return;
  }
  resetDungeonPathVote();
  state.battleMode = "dungeon";
  state.dungeonNodeIndex = 0;
  state.selectedStageId = entry;
  state.battle = null;
  state.lastResult = null;
  renderDungeonLobby();
  toast(
    `${dung?.title_ru || "Данж"} · вход · ${state.dungeonSoloStub ? "соло-тест" : "пати"} · ключ −1`,
  );
  await startYard(false);
}

async function advanceDungeonNodeAfterWin() {
  const idx = Math.max(0, Number(state.dungeonNodeIndex) || 0);
  grantDungeonNodeLoot();
  if (!state.dungeonPathLocked && idx === 0) {
    openDungeonPathVote();
    return true;
  }
  const nodes = dungeonPathNodes();
  if (idx >= nodes.length - 1) {
    state.dungeonAdvancing = false;
    grantDungeonBossLoot();
    return false;
  }
  state.dungeonAdvancing = true;
  state.dungeonNodeIndex = idx + 1;
  state.selectedStageId = nodes[state.dungeonNodeIndex];
  state.battle = null;
  state.lastResult = null;
  toast(`Узел ${state.dungeonNodeIndex + 1}/${nodes.length} · +рыба`);
  try {
    const diff = await createPvE({
      autoPlay: false,
      stageId: state.selectedStageId,
      carryAlive: null,
    });
    await applyDiff(diff, `CreatePvE dungeon ${state.selectedStageId}`);
    return true;
  } catch (err) {
    log(`dungeon advance fail: ${err.message}`);
    alert(err.message);
    return false;
  } finally {
    state.dungeonAdvancing = false;
  }
}

/**
 * Resolve stage + player team for the active battle mode.
 * Prevents practice dummies / stale mythmir waves / wrong-chapter soldiers leaking across modes.
 */
function resolveBattlePlan(mode = state.battleMode) {
  const m = String(mode || "pve");
  if (m === "practice") {
    return {
      mode: "practice",
      stageId: PRACTICE_STAGE,
      team: combatSquadIds(),
      carryAlive: null,
    };
  }
  if (m === "boss") {
    // Legion raid path takes priority over legacy boss_first waves.
    const raidStage = raidCurrentStageId();
    const usingRaid =
      !!raidDef() &&
      (state.formationMode === "raid" ||
        !!state.raidBattlePreview ||
        String(state.selectedStageId || "").startsWith("raid_") ||
        String(raidStage || "").startsWith("raid_"));
    if (usingRaid) {
      return {
        mode: "boss",
        stageId: raidStage || state.selectedStageId,
        team: raidCombatWingIds(),
        carryAlive: null,
      };
    }
    const waves = state.bossFirst?.waves || [];
    const idx = Math.max(0, Number(state.bossWaveIndex) || 0);
    const stageId = waves[idx]?.stageId || state.selectedStageId || "boss_first_w1";
    return { mode: "boss", stageId, team: combatSquadIds(), carryAlive: null };
  }
  if (m === "dungeon") {
    const nodes = dungeonPathNodes();
    const idx = Math.max(0, Math.min(nodes.length - 1, Number(state.dungeonNodeIndex) || 0));
    const stageId =
      !state.dungeonPathLocked && idx === 0
        ? dungeonEntryStageId() || nodes[0] || state.selectedStageId
        : nodes[idx] || state.selectedStageId;
    return { mode: "dungeon", stageId, team: ensureDungeonTestSquad(), carryAlive: null };
  }
  if (m === "pvp") {
    return { mode: "pvp", stageId: null, team: pvpSquadIds(), carryAlive: null };
  }
  // PvE / guild_demo / default → Mythmir chapter wave
  const ch = Math.max(1, Math.min(5, Number(state.pveChapter) || 1));
  const parsed = parseMythmirStageId(state.selectedStageId);
  if (!parsed || parsed.chapter !== ch) {
    // Stale practice/boss/other-chapter id → start this chapter at wave 1 soldiers.
    state.pveChapter = ch;
    state.pveStage = "entrance";
    state.selectedStageId = pveStageId(ch, "entrance");
    resetPveCarryAlive();
  } else {
    syncPveFromStageId(state.selectedStageId);
  }
  return {
    mode: "pve",
    stageId: state.selectedStageId,
    team: combatSquadIds(),
    carryAlive: state.pveCarryAlive,
  };
}

/**
 * SL stub spend — HUD/profile only until economy-service (D1).
 * DEV: bowl gate off — PvE entry does not consume/block on bowls.
 * Flip FREE_PVE_BOWLS to false when daily limits return.
 */
const FREE_PVE_BOWLS = true;

function spendBowlStub() {
  if (FREE_PVE_BOWLS) return true;
  if (state.profile && typeof state.profile.bowls === "number") {
    if (state.profile.bowls <= 0) {
      toast(t("limits.bowl.empty", "Миски на сегодня кончились (stub)"));
      return false;
    }
    state.profile.bowls -= 1;
    state.wallet.milk = state.profile.bowls;
    renderCurrency();
    toast(`Миска −1 · осталось ${state.profile.bowls} (stub)`);
  }
  return true;
}

function spendTicketStub() {
  if (state.profile && typeof state.profile.pvpTickets === "number") {
    if (state.profile.pvpTickets <= 0) {
      toast(t("limits.ticket.empty", "Билеты PvP на сегодня кончились (stub)"));
      return false;
    }
    state.profile.pvpTickets -= 1;
    state.wallet.energy = `${state.profile.pvpTickets}/5`;
    renderCurrency();
    toast(`Билет −1 · осталось ${state.profile.pvpTickets} (stub)`);
  }
  return true;
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
    ["рейтинг данж", () => navigate("rating_dungeon")],
    ["рейтинг рейд", () => navigate("rating_raid")],
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
    const a = e.target.closest("a[data-path], a[href='#'], button[data-path], [data-path].front-pin");
    if (!a || !root.contains(a)) return;
    e.preventDefault();
    // D-029: Stitch header chrome never navigates — only #appNav / #appSubTabs.
    // In-content CTAs live under <main> (trade hub cards, guild subnav, etc.).
    if (a.closest("header") && !a.closest("main")) return;
    const raw = (a.getAttribute("data-path") || "").trim();
    if (!raw) return;
    const tab = PATH_TO_TAB[raw] || PATH_TO_TAB[raw.toLowerCase()];
    if (tab) navigate(tab);
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
  const ch = Math.max(1, Math.min(5, Number(chapter) || 1));
  if (ch <= 1) return true;
  return isChapterCleared(ch - 1);
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
      { label: "Волна 1", stage: "entrance", name: "Волна 1", sub: `${faction || "Враги"} · солдаты` },
      { label: "Волна 2", stage: "tunnel", name: "Волна 2", sub: `${faction || "Враги"} · солдаты` },      { label: "Босс", stage: "boss", name: boss || "Питбосс", sub: "Питбосс-волна" },
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
  renderPveYardSquad();
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

/** Visual L→R lanes on PvE yard: тыл · центр · авангард (collection slot order). */
const PVE_YARD_LANES = [
  { key: "rear", label: "Тыл", badge: "ХИЛ", tone: "secondary" },
  { key: "center", label: "Центр", badge: "ДПС", tone: "tertiary" },
  { key: "vanguard", label: "Авангард", badge: "ТАНК", tone: "primary" },
];

function pveYardActiveCats() {
  if (typeof collectionEnsurePresets === "function") collectionEnsurePresets();
  const pi = state.colPresetIndex || 0;
  const preset = state.profile?.presets?.[pi];
  const ids = Array.isArray(preset?.catIds) ? preset.catIds : [];
  const cats = [0, 1, 2].map((i) => collectionCatById(ids[i]) || null);
  if (cats.filter(Boolean).length === 3) return cats;
  // Fallback display: starters in visual order тыл · центр · авангард
  const starters = combatStarterIds();
  const visualTids = [starters[2] || starters[0], starters[1] || starters[0], starters[0]].filter(Boolean);
  return [0, 1, 2].map((i) => {
    if (cats[i]) return cats[i];
    const tid = visualTids[i] || STARTERS[Math.min(i, STARTERS.length - 1)];
    const fromProfile = (state.profile?.cats || []).find((c) => c.templateId === tid);
    return fromProfile || { templateId: tid, level: 1 };
  });
}

function renderPveYardSquad() {
  const host = $("pveYardSquadSlots");
  if (!host) return;
  const cats = pveYardActiveCats();
  const roleBadge = (role) => {
    if (role === "tank") return "ТАНК";
    if (role === "support") return "ХИЛ";
    return "ДПС";
  };
  const toneCls = {
    secondary: {
      card: "border-secondary/40 hover:border-secondary/60",
      label: "text-secondary",
      art: "border-secondary/40",
      badge: "bg-secondary text-on-secondary",
    },
    tertiary: {
      card: "border-tertiary/40 hover:border-tertiary/60",
      label: "text-tertiary",
      art: "border-tertiary/40",
      badge: "bg-tertiary text-on-tertiary",
    },
    primary: {
      card: "border-primary/40 hover:border-primary/60",
      label: "text-primary",
      art: "border-primary/40",
      badge: "bg-primary text-on-primary",
    },
  };
  host.innerHTML = PVE_YARD_LANES.map((lane, i) => {
    const c = cats[i];
    const role = c ? homeCatRole(c) : "";
    const art = c ? catHeroArt(c.templateId) || "/stitch-assets/cat-heroes/fighter-fire.jpg?v=elven18" : "";
    const name = c ? catSheetName(c) : "Пусто";
    const lvl = c?.level != null ? c.level : "—";
    const stats = c ? statsForCat(c) : null;
    const hp = stats ? formatSheetNum(stats.hp) : "—";
    const atk = stats ? formatSheetNum(stats.atk) : "—";
    const tc = toneCls[lane.tone] || toneCls.primary;
    const badge = role ? roleBadge(role) : lane.badge;
    if (!c) {
      return `<div class="bg-surface-container rounded-xl p-2.5 border border-dashed border-outline-variant/50 flex flex-col justify-center items-center min-h-[12rem] text-on-surface-variant">
        <span class="text-[11px] font-label-sm font-bold uppercase tracking-wider">${lane.label}</span>
        <span class="material-symbols-outlined text-3xl mt-2">add</span>
        <span class="text-[11px] mt-1">Выберите команду</span>
      </div>`;
    }
    return `<div class="bg-surface-container rounded-xl p-2.5 border ${tc.card} flex flex-col justify-between transition-all shadow-md group relative overflow-hidden">
      <div class="flex items-center justify-between mb-1.5 z-10 relative">
        <span class="text-[11px] font-label-sm ${tc.label} font-bold uppercase tracking-wider">${lane.label}</span>
        <span class="text-[11px] font-stat-numeral text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">Ур. ${lvl}</span>
      </div>
      <div class="pve-yard-hero-art w-full h-44 rounded-lg overflow-hidden relative bg-surface-container-highest border ${tc.art} shadow-inner flex items-center justify-center">
        <img class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" alt="${name.replace(/"/g, "&quot;")}" src="${art}"/>
        <div class="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent opacity-80 pointer-events-none"></div>
        <span class="absolute bottom-1.5 left-1.5 ${tc.badge} text-[10px] font-bold px-1.5 py-0.5 rounded leading-tight shadow-sm">${badge}</span>
      </div>
      <div class="flex flex-col min-w-0 mt-2 z-10 relative">
        <span class="font-label-md text-[13px] text-on-surface font-bold truncate leading-tight">${name}</span>
        <div class="flex items-center justify-between gap-1 mt-1.5">
          <span class="text-secondary text-[11px] font-stat-numeral flex items-center gap-0.5 font-bold leading-none"><span class="material-symbols-outlined text-[13px]">favorite</span>${hp}</span>
          <span class="text-primary text-[11px] font-stat-numeral flex items-center gap-0.5 font-bold leading-none"><span class="material-symbols-outlined text-[13px]">swords</span>${atk}</span>
        </div>
      </div>
    </div>`;
  }).join("");
}

function closePveYardTeamPicker() {
  const picker = $("pveYardTeamPicker");
  if (!picker) return;
  picker.classList.add("hidden");
  picker.setAttribute("aria-hidden", "true");
}

function openPveYardTeamPicker() {
  const picker = $("pveYardTeamPicker");
  if (!picker) return;
  if (typeof collectionEnsurePresets === "function") collectionEnsurePresets();
  renderPveYardTeamPicker();
  picker.classList.remove("hidden");
  picker.setAttribute("aria-hidden", "false");
}

function renderPveYardTeamPicker() {
  const list = $("pveYardTeamPickerList");
  if (!list) return;
  if (typeof collectionEnsurePresets === "function") collectionEnsurePresets();
  const active = state.colPresetIndex || 0;
  const fallbackNames = ["Основной", "Второй эшелон", "Резерв"];
  const lanes = ["Тыл", "Центр", "Авангард"];
  list.innerHTML = [0, 1, 2]
    .map((pi) => {
      const preset = state.profile?.presets?.[pi] || { name: fallbackNames[pi], catIds: [] };
      const slotCats = [0, 1, 2].map((i) => collectionCatById(preset.catIds?.[i]) || null);
      const filled = slotCats.filter(Boolean).length;
      const on = pi === active;
      const title = preset.name || fallbackNames[pi];
      const slots = slotCats
        .map((c, i) => {
          if (!c) {
            return `<div class="pve-yard-team-card__slot is-empty">${lanes[i]}</div>`;
          }
          const art = catHeroArt(c.templateId) || "/stitch-assets/cat-heroes/fighter-fire.jpg?v=elven18";
          return `<div class="pve-yard-team-card__slot"><img alt="" src="${art}"/><span>${catSheetName(c)}</span></div>`;
        })
        .join("");
      return `<button type="button" class="pve-yard-team-card${on ? " is-on" : ""}" data-yard-team-pick="${pi}">
        <header><b>Команда ${pi + 1} · ${title}</b>${on ? "<i>Активна</i>" : `<span class="text-[10px] text-outline">${filled}/3</span>`}</header>
        <div class="pve-yard-team-card__slots">${slots}</div>
        <footer>${filled === 3 ? "Нажмите, чтобы выбрать для ПВЕ" : "Неполный отряд — соберите в Коллекции"}</footer>
      </button>`;
    })
    .join("");
}

function applyPveYardTeamPreset(pi) {
  const idx = Math.max(0, Math.min(2, Number(pi) || 0));
  if (typeof collectionEnsurePresets === "function") collectionEnsurePresets();
  const preset = state.profile?.presets?.[idx];
  const filled = (preset?.catIds || []).filter(Boolean).length;
  if (filled < 3) {
    toast("В этом отряде меньше 3 котиков — доберите в Коллекции");
    return false;
  }
  state.colPresetIndex = idx;
  if (typeof persistCollectionStub === "function") persistCollectionStub();
  renderPveYardSquad();
  renderPveYardTeamPicker();
  closePveYardTeamPicker();
  const name = preset?.name || `Команда ${idx + 1}`;
  toast(`Отряд «${name}» выбран для ПВЕ`);
  return true;
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
    team.addEventListener("click", () => openPveYardTeamPicker());
  }
  const picker = $("pveYardTeamPicker");
  if (picker && !picker.dataset.bound) {
    picker.dataset.bound = "1";
    picker.addEventListener("click", (ev) => {
      if (ev.target.closest("[data-yard-team-close]")) {
        ev.preventDefault();
        closePveYardTeamPicker();
        return;
      }
      const pick = ev.target.closest("[data-yard-team-pick]");
      if (pick && picker.contains(pick)) {
        ev.preventDefault();
        applyPveYardTeamPreset(pick.getAttribute("data-yard-team-pick"));
      }
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      if (!picker.classList.contains("hidden")) closePveYardTeamPicker();
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

function raidDef(raidId = state.raidId) {
  const list = state.raidsCatalog?.raids || [];
  return list.find((r) => r.raidId === raidId) || list[0] || null;
}

function raidPathDef(raidId = state.raidId, pathKey = state.raidPath) {
  const raid = raidDef(raidId);
  return raid?.paths?.[pathKey] || raid?.paths?.short || null;
}

/** Shared first node of short/long (vote happens after this squad). */
function raidEntryStageId(raidId = state.raidId) {
  const raid = raidDef(raidId);
  const short0 = raid?.paths?.short?.nodes?.[0];
  const long0 = raid?.paths?.long?.nodes?.[0];
  return short0 || long0 || raid?.bossStageId || "raid_myaurra_a";
}

function raidCurrentStageId() {
  if (!state.raidPathLocked && (state.raidPathNodeIndex | 0) === 0) {
    return raidEntryStageId();
  }
  const path = raidPathDef();
  const nodes = path?.nodes || [];
  const i = Math.max(0, Math.min(nodes.length - 1, state.raidPathNodeIndex | 0));
  return nodes[i] || raidDef()?.bossStageId || "raid_myaurra_boss";
}

function resetRaidPathVote() {
  state.raidPathLocked = false;
  state.raidPathVoteOpen = false;
  state.raidPathVotes = { short: 0, long: 0, myVote: null, botsDone: false };
  state.raidPath = "short";
  state.raidPathNodeIndex = 0;
}

function raidPathVoteLabels() {
  const raid = raidDef();
  return {
    short: raid?.paths?.short?.label_ru || "Короткий путь",
    long: raid?.paths?.long?.label_ru || "Длинный путь",
    shortEta: raid?.paths?.short?.etaMin
      ? `${raid.paths.short.etaMin[0]}–${raid.paths.short.etaMin[1]} мин`
      : "",
    longEta: raid?.paths?.long?.etaMin
      ? `${raid.paths.long.etaMin[0]}–${raid.paths.long.etaMin[1]} мин`
      : "",
  };
}

function recountRaidPathVotes() {
  const my = state.raidPathVotes.myVote;
  let shortN = my === "short" ? 1 : 0;
  let longN = my === "long" ? 1 : 0;
  if (state.raidPathVotes.botsDone) {
    // 3 bots: 2 follow leader (or short), 1 opposite
    const lean = my || "short";
    if (lean === "long") {
      longN += 2;
      shortN += 1;
    } else {
      shortN += 2;
      longN += 1;
    }
  }
  state.raidPathVotes.short = shortN;
  state.raidPathVotes.long = longN;
}

function castRaidPathVote(choice) {
  state.raidPathVotes.myVote = choice === "long" ? "long" : "short";
  recountRaidPathVotes();
  renderRaidPathVotePanel();
}

function fillRaidPathBotVotes() {
  state.raidPathVotes.botsDone = true;
  recountRaidPathVotes();
  renderRaidPathVotePanel();
  toast(`Голоса пати: короткий ${state.raidPathVotes.short} · длинный ${state.raidPathVotes.long}`);
}

function resolveRaidPathVote() {
  const v = state.raidPathVotes;
  if (!v.myVote) {
    toast("Сначала отдайте свой голос");
    return false;
  }
  if (!v.botsDone) fillRaidPathBotVotes();
  const win =
    v.long > v.short ? "long" : v.short > v.long ? "short" : v.myVote; // tie → leader
  state.raidPath = win;
  state.raidPathLocked = true;
  state.raidPathVoteOpen = false;
  // After entry squad: continue at node 1 of chosen path
  state.raidPathNodeIndex = 1;
  const nodes = raidPathDef()?.nodes || [];
  state.selectedStageId = nodes[1] || nodes[0] || raidEntryStageId();
  toast(`Путь выбран голосованием: ${win === "long" ? "длинный" : "короткий"} · ${v.short}:${v.long}`);
  renderRaidBattleStub();
  return true;
}

function openRaidPathVote() {
  state.raidPathVoteOpen = true;
  state.raidBattlePreview = true;
  state.battle = null;
  state.lastResult = null;
  state.raidPathVotes = { short: 0, long: 0, myVote: null, botsDone: false };
  navigate("raid_battle", { primary: "combat" });
  renderRaidBattleStub();
  toast("Отряд сражён · голосуйте за короткий или длинный путь");
}

function renderRaidPathVotePanel() {
  const root = $("viewRaidBattle");
  if (!root) return;
  const host =
    root.querySelector("[data-raid-battle-root]") ||
    root.querySelector("main.raid-battle-12-stage") ||
    root.querySelector("main") ||
    root;
  let panel = root.querySelector("[data-raid-path-vote]");
  if (!state.raidPathVoteOpen) {
    if (panel) panel.classList.add("hidden");
    return;
  }
  if (!panel) {
    panel = document.createElement("div");
    panel.setAttribute("data-raid-path-vote", "1");
    panel.className = "raid-path-vote";
    host.appendChild(panel);
  } else if (panel.parentElement !== host) {
    host.appendChild(panel);
  }
  panel.classList.remove("hidden");
  const labels = raidPathVoteLabels();
  const v = state.raidPathVotes;
  const total = Math.max(1, (v.short | 0) + (v.long | 0));
  panel.innerHTML = `
    <div class="raid-path-vote-card" role="dialog" aria-label="Голосование пути рейда">
      <header>
        <span class="material-symbols-outlined text-primary">fork_right</span>
        <div>
          <strong>Выбор пути</strong>
          <p>Отряд сражён · голосует пати · большинство фиксирует короткий или длинный путь</p>
        </div>
      </header>
      <div class="raid-path-vote-opts">
        <button type="button" class="raid-path-vote-opt${v.myVote === "short" ? " is-on" : ""}" data-raid-vote="short">
          <b>Короткий</b>
          <span>${labels.short}</span>
          <em>${labels.shortEta || "быстрее · сложнее босс"}</em>
          <strong class="raid-path-vote-tally">${v.short | 0} голос.</strong>
        </button>
        <button type="button" class="raid-path-vote-opt${v.myVote === "long" ? " is-on" : ""}" data-raid-vote="long">
          <b>Длинный</b>
          <span>${labels.long}</span>
          <em>${labels.longEta || "дольше · path-only лут"}</em>
          <strong class="raid-path-vote-tally">${v.long | 0} голос.</strong>
        </button>
      </div>
      <div class="raid-path-vote-bar" aria-hidden="true">
        <i style="width:${Math.round((100 * (v.short | 0)) / total)}%"></i>
      </div>
      <footer>
        <button type="button" class="wire-btn" data-hud-action="raid-path-bots">Добор голосов ботов</button>
        <button type="button" class="mode-cta" data-hud-action="raid-path-lock"${v.myVote ? "" : " disabled"}>Зафиксировать путь</button>
      </footer>
    </div>
  `;
}

function syncRaidLimitsFromLiveOps() {
  const lim = state.liveOps?.limits || state.liveops?.limits || {};
  if (Number.isFinite(Number(lim.raid_attempts_weekly))) {
    state.raidAttemptsLeft = Number(lim.raid_attempts_weekly);
  }
  if (typeof lim.raid_weekly_lock === "boolean") {
    state.raidWeeklyLocked = !!lim.raid_weekly_lock && !!state.progress?.raidLootClaimed;
  }
}

/** Canonical 12-cat fill: 2 aggro tanks + 1 pierce; 2 heal + 1 buffer; 3 ranged + 3 melee DPS. */
function buildRaidLegionRoster() {
  const plan = [
    // row 3 rear — supports (L→R)
    { row: 3, col: 0, role: "support", sub: "heal", templateId: "shop_support_water", name_ru: "Хил A" },
    { row: 3, col: 1, role: "support", sub: "heal", templateId: "shop_support_water", name_ru: "Хил A′" },
    { row: 3, col: 2, role: "support", sub: "buffer", templateId: "shop_support_wind", name_ru: "Баффер B" },
    // row 2 ranged DPS
    { row: 2, col: 0, role: "mage", sub: "ranged", templateId: "shop_mage_fire", name_ru: "Маг A" },
    { row: 2, col: 1, role: "ranger", sub: "ranged", templateId: "shop_ranger_fire", name_ru: "Лучник A" },
    { row: 2, col: 2, role: "mage", sub: "ranged", templateId: "shop_mage_water", name_ru: "Маг B" },
    // row 1 melee DPS
    { row: 1, col: 0, role: "assassin", sub: "melee", templateId: "shop_assassin_fire", name_ru: "Убийца A" },
    { row: 1, col: 1, role: "fighter", sub: "melee", templateId: "shop_fighter_fire", name_ru: "Воин A" },
    { row: 1, col: 2, role: "assassin", sub: "melee", templateId: "shop_assassin_water", name_ru: "Убийца B" },
    // row 0 front — tanks
    { row: 0, col: 0, role: "tank", sub: "aggro", templateId: "shop_tank_fire", name_ru: "Танк-агр A" },
    { row: 0, col: 1, role: "tank", sub: "aggro", templateId: "shop_tank_fire", name_ru: "Танк-агр A′" },
    { row: 0, col: 2, role: "tank", sub: "armorBreak", templateId: "shop_tank_water", name_ru: "Танк-пробой B" },
  ];
  return plan.map((s, i) => ({ ...s, slot: i, filled: true }));
}

function raidCompCounts(roster = state.raidLegion) {
  const list = Array.isArray(roster) ? roster.filter((s) => s?.filled) : [];
  const roleOf = (s) => {
    if (s.role === "tank") return "tank";
    if (s.role === "support") return "support";
    return "dps";
  };
  const tanks = list.filter((s) => roleOf(s) === "tank");
  const supports = list.filter((s) => roleOf(s) === "support");
  const dps = list.filter((s) => roleOf(s) === "dps");
  return {
    tank: tanks.length,
    support: supports.length,
    dps: dps.length,
    aggro: tanks.filter((s) => s.sub === "aggro").length,
    armorBreak: tanks.filter((s) => s.sub === "armorBreak").length,
    heal: supports.filter((s) => s.sub === "heal").length,
    buffer: supports.filter((s) => s.sub === "buffer").length,
    ranged: dps.filter((s) => s.sub === "ranged").length,
    melee: dps.filter((s) => s.sub === "melee").length,
    total: list.length,
  };
}

function validateRaidComposition(roster = state.raidLegion) {
  const c = raidCompCounts(roster);
  const ok =
    c.total === RAID_PARTY_SIZE &&
    c.tank === RAID_COMP.tank &&
    c.support === RAID_COMP.support &&
    c.dps === RAID_COMP.dps &&
    c.aggro >= RAID_COMP.tankSubs.aggro &&
    c.armorBreak >= RAID_COMP.tankSubs.armorBreak &&
    c.heal >= RAID_COMP.supportSubs.heal &&
    c.buffer >= RAID_COMP.supportSubs.buffer &&
    c.ranged >= RAID_COMP.dpsSubs.ranged &&
    c.melee >= RAID_COMP.dpsSubs.melee;
  return { ok, counts: c };
}

/** Active 3v3 wing from legion until full-12 sim exists: tank-aggro · melee DPS · heal. */
function raidCombatWingIds(roster = state.raidLegion) {
  const list = (Array.isArray(roster) ? roster : []).filter((s) => s?.filled && s.templateId);
  const pick = (pred) => list.find(pred)?.templateId;
  const tank = pick((s) => s.role === "tank" && s.sub === "aggro") || pick((s) => s.role === "tank");
  const dps =
    pick((s) => s.sub === "melee") ||
    pick((s) => s.sub === "ranged") ||
    pick((s) => !["tank", "support"].includes(s.role));
  const support = pick((s) => s.role === "support" && s.sub === "heal") || pick((s) => s.role === "support");
  const wing = [tank, dps, support].filter(Boolean);
  return wing.length === 3 ? wing : combatSquadIds();
}

/** Snapshot for battle design handoff (rows · slots · timer · stage). */
function raidFormationSnapshot() {
  ensureRaidLegion();
  return {
    version: 1,
    partySize: RAID_PARTY_SIZE,
    turnSec: battleTurnTimerSec(),
    raidId: state.raidId,
    path: state.raidPath,
    stageId: raidCurrentStageId(),
    nodeIndex: state.raidPathNodeIndex | 0,
    rows: RAID_FORMATION_ROWS.map((r) => ({
      row: r.row,
      lane: r.lane,
      label_ru: r.label_ru,
      slots: [0, 1, 2].map((col) => {
        const s = state.raidLegion.find((x) => x.row === r.row && x.col === col);
        if (!s?.filled) return { col, empty: true };
        return {
          col,
          role: s.role,
          sub: s.sub,
          templateId: s.templateId,
          name_ru: s.name_ru,
          art: (typeof CAT_HERO_ART !== "undefined" && CAT_HERO_ART[s.templateId]) || "",
        };
      }),
    })),
    comp: raidCompCounts(),
    wing3v3: raidCombatWingIds(),
  };
}

const RAID_BOSS_UI = {
  myaurra: {
    art: "/stitch-assets/monsters/battle/myaurra-pitboss-cutout.webp?v=raid1",
    place_ru: "Небесный Двор",
    mech_ru: "Удар стаи",
    phase_ru: "Пса-Бури",
  },
  talass: {
    art: "/stitch-assets/monsters/battle/talass-pitboss-cutout.webp?v=raid1",
    place_ru: "Бездна Усов",
    mech_ru: "Шёпот глубин",
    phase_ru: "Прилив",
  },
  vulcan: {
    art: "/stitch-assets/monsters/battle/vulcan-pitboss-cutout.webp?v=raid1",
    place_ru: "Пепельный Трон",
    mech_ru: "Девять хвостов",
    phase_ru: "Пепел",
  },
};

function paintRaidLobbyBoss() {
  const root = $("viewBossRaid");
  if (!root) return;
  const raid = raidDef();
  const ui = RAID_BOSS_UI[raid?.raidId] || RAID_BOSS_UI.myaurra;
  const title = root.querySelector("[data-raid-boss-title]");
  if (title) title.textContent = raid?.title_ru || "Рейд";
  const place = root.querySelector("[data-raid-boss-place]");
  if (place) place.textContent = ui.place_ru;
  const img = root.querySelector("[data-raid-boss-art]");
  if (img && ui.art) {
    img.src = ui.art;
    img.alt = raid?.title_ru || "Босс";
  }
  const mech = root.querySelector("[data-raid-boss-mech]");
  if (mech) mech.textContent = ui.mech_ru;
  const rageTip = root.querySelector("[data-raid-rage-tip]");
  if (rageTip) {
    rageTip.textContent = `При 100% — фаза «${ui.phase_ru}». Держите 2 хила и танков на фронте.`;
  }
  root.querySelectorAll(".flex.items-center.justify-between.px-1 span").forEach((el) => {
    if ((el.textContent || "").includes("нужно")) {
      el.textContent = `нужно ровно ${RAID_PARTY_SIZE}`;
    }
  });
}

function ensureRaidLegion() {
  if (!Array.isArray(state.raidLegion) || state.raidLegion.length !== RAID_PARTY_SIZE) {
    state.raidLegion = buildRaidLegionRoster().map((s) => ({ ...s, filled: false }));
    state.raidLegionCount = 0;
  }
}

function fillRaidLegionSlots(n = RAID_PARTY_SIZE) {
  ensureRaidLegion();
  const full = buildRaidLegionRoster();
  const target = Math.max(0, Math.min(RAID_PARTY_SIZE, n | 0));
  // Fill in formation order: front tanks → melee → ranged → supports (or reverse from empty?)
  // Product: fill by rows front→rear so tanks arrive first visually when inviting.
  const order = [...full].sort((a, b) => a.row - b.row || a.col - b.col);
  state.raidLegion = full.map((slot) => {
    const idx = order.findIndex((o) => o.row === slot.row && o.col === slot.col);
    return {
      ...slot,
      filled: idx >= 0 && idx < target,
      owner: state.raidSoloStub ? "you" : slot.owner || "",
      solo: !!state.raidSoloStub,
    };
  });
  state.raidLegionCount = state.raidLegion.filter((s) => s.filled).length;
  return state.raidLegionCount;
}

/**
 * Solo QA stub: one player «owns» all 12 legion cats (canon 3T/3S/6DPS) for full raid path smoke.
 * Skips real MM/invite; combat wing remains 3v3 stub until legion-sim lands.
 */
function enableRaidSoloTestStub() {
  state.raidSoloStub = true;
  resetRaidPathVote();
  syncRaidLimitsFromLiveOps();
  // Do not block smoke on weekly lock / empty attempts during local QA.
  state.raidWeeklyLocked = false;
  state.raidAttemptsLeft = Math.max(state.raidAttemptsLeft | 0, 3);
  fillRaidLegionSlots(RAID_PARTY_SIZE);
  state.battleMode = "boss";
  state.formationMode = "raid";
  renderRaidPath();
  const v = validateRaidComposition();
  toast(
    v.ok
      ? "Соло-тест рейда: легион 12/12 (канон) · вы «владеете» всеми слотами · «Вступить в рейд»"
      : `Соло-тест: легион ${state.raidLegionCount}/12 · состав ещё не канон`,
  );
}

function renderRaidLegionBoard() {
  const root = $("viewBossRaid");
  if (!root) return;
  ensureRaidLegion();
  let board = root.querySelector("[data-raid-legion-board]");
  if (!board) {
    const old = root.querySelector('[aria-label="12 слотов рейда"]');
    if (old) {
      old.setAttribute("data-raid-legion-board", "1");
      old.className = "flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto py-1.5";
      board = old;
    }
  }
  if (!board) return;
  const artFor = (tid) =>
    (typeof CAT_HERO_ART !== "undefined" && CAT_HERO_ART[tid]) ||
    `/stitch-assets/cat-heroes/tank-fire.jpg?v=elven18`;
  const subRu = {
    aggro: "агр",
    armorBreak: "пробитие",
    heal: "хил",
    buffer: "бафф",
    ranged: "даль",
    melee: "мили",
  };
  // Paint rear→front (supports on top of board, tanks at bottom toward enemy)
  const rows = [...RAID_FORMATION_ROWS];
  board.innerHTML = rows
    .map((rowDef) => {
      const slots = [0, 1, 2].map((col) => {
        const s = state.raidLegion.find((x) => x.row === rowDef.row && x.col === col);
        if (!s?.filled) {
          return `<article class="raid-slot rounded-lg border border-dashed border-outline-variant/50 bg-[#14110f] p-1.5 flex flex-col items-center justify-center gap-0.5 min-h-[4.8rem] text-outline">
            <span class="material-symbols-outlined text-[20px]">add</span>
            <span class="text-[9px] font-bold">${rowDef.label_ru.split("·")[0].trim()}</span>
          </article>`;
        }
        const tone =
          s.role === "tank" ? "border-primary/50" : s.role === "support" ? "border-secondary/45" : "border-tertiary/45";
        return `<article class="raid-slot is-filled rounded-lg border ${tone} bg-[#1a1613] p-1.5 flex flex-col gap-0.5 min-h-[4.8rem]">
          <img alt="" class="w-full h-9 object-cover object-top rounded-md" src="${artFor(s.templateId)}"/>
          <span class="text-[10px] font-bold truncate">${s.name_ru}</span>
          <span class="text-[9px] text-on-surface-variant">${subRu[s.sub] || s.role}</span>
        </article>`;
      });
      return `<div class="flex flex-col gap-0.5">
        <div class="text-[9px] text-outline font-bold uppercase tracking-wide px-0.5">${rowDef.label_ru}</div>
        <div class="grid grid-cols-3 gap-1.5">${slots.join("")}</div>
      </div>`;
    })
    .join("");
  const c = raidCompCounts();
  const chips = root.querySelector("[data-raid-role-chips]");
  if (chips) {
    chips.innerHTML = `
      <span class="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-bold">Танк ${c.tank}/${RAID_COMP.tank} · агр ${c.aggro}/${RAID_COMP.tankSubs.aggro} · пробитие ${c.armorBreak}/${RAID_COMP.tankSubs.armorBreak}</span>
      <span class="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 font-bold">Сап ${c.support}/${RAID_COMP.support} · хил ${c.heal}/${RAID_COMP.supportSubs.heal} · бафф ${c.buffer}/${RAID_COMP.supportSubs.buffer}</span>
      <span class="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary border border-tertiary/30 font-bold">DPS ${c.dps}/${RAID_COMP.dps} · даль ${c.ranged} · мили ${c.melee}</span>
      <span class="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/30 font-bold">Ход ${formatBattleTimer(battleTurnTimerSec())}</span>
    `;
  }
  const sizeChip = root.querySelector("[data-raid-size-chip]");
  if (sizeChip) sizeChip.textContent = `${c.total}/${RAID_PARTY_SIZE}`;
  const readyChip = root.querySelector("[data-raid-ready-chip]");
  if (readyChip) readyChip.textContent = `${c.total}/${RAID_PARTY_SIZE}`;
}

/** Painted raid lobby: выбор рейда / легион 12 (путь — голосование в бою). */
function renderRaidPath() {
  syncRaidLimitsFromLiveOps();
  ensureRaidLegion();
  const root = $("viewBossRaid");
  if (!root) return;
  let panel = $("raidPathPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "raidPathPanel";
    panel.className = "raid-path-panel";
    const host =
      root.querySelector(".mode-grid") ||
      root.querySelector("main") ||
      root;
    host.prepend(panel);
  }
  const raids = state.raidsCatalog?.raids || [];
  const raid = raidDef();
  const entry = raidEntryStageId();
  const filled = state.raidLegionCount | 0;
  const comp = validateRaidComposition();
  const ready =
    filled >= minRaidPlayers &&
    comp.ok &&
    !state.raidWeeklyLocked &&
    state.raidAttemptsLeft > 0;
  renderRaidLegionBoard();
  paintRaidLobbyBoss();
  panel.innerHTML = `
    <div class="raid-path-head">
      <strong>Рейд · легион ${RAID_PARTY_SIZE}</strong>
      <span class="meta">попытки ${state.raidAttemptsLeft} · ход ${formatBattleTimer(battleTurnTimerSec())} · путь — голосование в бою</span>
    </div>
    <div class="raid-comp meta">Состав: ${RAID_COMP.tank}T (${RAID_COMP.tankSubs.aggro} агр + ${RAID_COMP.tankSubs.armorBreak} пробитие) · ${RAID_COMP.support}S (${RAID_COMP.supportSubs.heal} хил + ${RAID_COMP.supportSubs.buffer} бафф) · ${RAID_COMP.dps} DPS · строй: сап → маги/лучники → убийцы/воины → танки</div>
    <div class="raid-path-raids" role="tablist">
      ${raids
        .map(
          (r) =>
            `<button type="button" class="raid-pick${r.raidId === state.raidId ? " is-on" : ""}" data-raid-id="${r.raidId}">${r.title_ru}</button>`,
        )
        .join("")}
    </div>
    <p class="raid-path-vote-hint meta">Старт: общий отряд <b>${entry}</b>. После победы на форме боя пати голосует: короткий или длинный путь.${
      state.raidSoloStub ? " · <b>соло-тест</b>: все 12 слотов ваши" : ""
    }</p>
    <div class="raid-path-foot">
      <span>Состав: <b id="raidLegionCountLabel">${filled}/${RAID_PARTY_SIZE}</b>${
        state.raidSoloStub ? " · соло-тест" : ready ? " · готов" : " · нужен полный легион"
      }</span>
      <span class="meta">${raid?.title_ru || ""}</span>
    </div>
  `;
  root.querySelectorAll(".dojo-server span").forEach((span) => {
    if ((span.textContent || "").includes("Легион")) {
      const b = span.querySelector("b");
      if (b) b.textContent = `${filled}/${RAID_PARTY_SIZE}`;
    }
    if ((span.textContent || "").includes("Попытки")) {
      const b = span.querySelector("b");
      if (b) b.textContent = `${state.raidAttemptsLeft}/${state.liveops?.limits?.raid_attempts_weekly ?? 3}`;
    }
  });
  root.querySelectorAll(".flex.items-center.justify-between.px-1 span").forEach((el) => {
    const t = el.textContent || "";
    if (t.includes("нужно") || t.includes("кота") || t.includes("соло-тест")) {
      el.textContent = state.raidSoloStub ? "соло-тест · 12/12 ваши" : `нужно ровно ${minRaidPlayers}`;
    }
  });
  const readyHost = root.querySelector("[data-raid-ready-grid]") || root.querySelector(".grid.grid-cols-3");
  if (readyHost && state.raidSoloStub) {
    readyHost.setAttribute("data-raid-ready-grid", "1");
    readyHost.innerHTML = `
      <div class="rounded-md bg-[#1a1613] border border-secondary/35 px-2 py-1.5 text-center"><b class="text-secondary block">Вы</b>готов</div>
      <div class="rounded-md bg-[#1a1613] border border-secondary/35 px-2 py-1.5 text-center"><b class="text-secondary block">Слот·2</b>готов</div>
      <div class="rounded-md bg-[#1a1613] border border-secondary/35 px-2 py-1.5 text-center"><b class="text-secondary block">Слот·3</b>готов</div>
    `;
  }
}

function raidPathIsBossNode(stageId = raidCurrentStageId()) {
  return /_boss$/i.test(String(stageId || "")) || String(stageId) === raidDef()?.bossStageId;
}

function grantRaidLootStub() {
  const raid = raidDef();
  const path = raidPathDef();
  const loot = {
    raidId: raid?.raidId || state.raidId,
    path: state.raidPath,
    pathOnly: path?.pathOnlyLoot || [],
    rares: [
      { id: `${raid?.raidId || "raid"}_rare_1`, label_ru: "Рейдовый редмет · слот 1" },
      { id: `${raid?.raidId || "raid"}_rare_2`, label_ru: "Рейдовый редмет · слот 2" },
    ],
    fish: state.raidPath === "long" ? 220 : 140,
    claimedAt: Date.now(),
  };
  state.raidLastLoot = loot;
  state.progress.raidLootClaimed = true;
  const lim = state.liveOps?.limits || state.liveops?.limits || {};
  if (lim.raid_weekly_lock !== false) {
    state.raidWeeklyLocked = true;
  }
  state.raidAttemptsLeft = Math.max(0, (state.raidAttemptsLeft | 0) - 1);
  const setDrop = RAID_PVE_SET_DROP[raid?.raidId || state.raidId] || "yellow";
  const piece = grantPveSetPiece(setDrop);
  if (piece) loot.pveSetPiece = piece.id;
  persistProgress();
  toast(
    `Лут рейда: +${loot.fish} рыбок` +
      (piece ? ` · PvE ${piece.name}` : "") +
      (loot.pathOnly.length ? ` · path-only: ${loot.pathOnly.join(", ")}` : "") +
      " · weekly lock",
  );
  return loot;
}

async function advanceRaidNodeAfterWin() {
  const i = state.raidPathNodeIndex | 0;
  // After entry squad — path vote on the same battle form (no lobby pick).
  if (!state.raidPathLocked && i === 0) {
    openRaidPathVote();
    return true;
  }
  const path = raidPathDef();
  const nodes = path?.nodes || [];
  if (i >= nodes.length - 1) {
    grantRaidLootStub();
    state.raidBattlePreview = false;
    return false;
  }
  state.raidPathNodeIndex = i + 1;
  state.selectedStageId = nodes[state.raidPathNodeIndex];
  state.battle = null;
  state.lastResult = null;
  state.raidBattlePreview = true;
  state.formationMode = "raid";
  navigate("raid_battle", { primary: "combat" });
  renderRaidBattleStub();
  toast(`Узел ${state.raidPathNodeIndex + 1}/${nodes.length} · строй 12 · ${state.selectedStageId}`);
  return true;
}

/** Validate legion → show 4×3 preview (design placeholder) before sim fight. */
function viewRaidFight({ autoPlay = false } = {}) {
  ensureRaidLegion();
  if ((state.raidLegionCount | 0) < minRaidPlayers) {
    showGateTip(
      t(
        "raid.gate.party",
        `Рейд только на ${minRaidPlayers}: сейчас ${state.raidLegionCount}/${RAID_PARTY_SIZE}. «Соло-тест» заполнит всех 12, или «Пригласить» по +3.`,
      ),
    );
    return false;
  }
  const comp = validateRaidComposition();
  if (!comp.ok) {
    showGateTip(
      t(
        "raid.gate.comp",
        `Состав: нужно ${RAID_COMP.tank}T (2 агр + 1 пробитие), ${RAID_COMP.support}S (2 хил + 1 бафф), ${RAID_COMP.dps} DPS. Сейчас T${comp.counts.tank}/S${comp.counts.support}/D${comp.counts.dps}.`,
      ),
    );
    return false;
  }
  if (state.raidWeeklyLocked) {
    showGateTip(t("raid.gate.weekly", "Weekly lock рейдового лута — ждите сброса."));
    return false;
  }
  if (state.raidAttemptsLeft <= 0) {
    showGateTip(t("raid.gate.attempts", "Попытки рейда на неделю закончились."));
    return false;
  }
  resetRaidPathVote();
  const stageId = raidEntryStageId();
  state.battleMode = "boss";
  state.selectedStageId = stageId;
  state.raidPathNodeIndex = 0;
  state.formationMode = "raid";
  state.raidBattlePreview = true;
  state._raidAutoPlay = !!autoPlay;
  navigate("raid_battle", { primary: "combat" });
  renderRaidBattleStub();
  toast(`Строй 12 · входной отряд · путь выберете после победы`);
  return true;
}

/** Actually start CreatePvE for current raid node (3v3 stub until full 12 sim). */
async function startRaidNodeFight({ autoPlay = false } = {}) {
  state.raidBattlePreview = false;
  state.battleMode = "boss";
  state.selectedStageId = raidCurrentStageId();
  await startYard(autoPlay || !!state._raidAutoPlay);
  state._raidAutoPlay = false;
}

function raidBattleRoleBadge(s) {
  if (!s) return { label: "—", tone: "bg-surface-container-high text-on-surface-variant" };
  if (s.role === "tank" && s.sub === "armorBreak")
    return { label: "Пробой", tone: "bg-primary-container text-on-primary" };
  if (s.role === "tank") return { label: "Танк", tone: "bg-primary text-on-primary" };
  if (s.role === "support" && s.sub === "buffer")
    return { label: "Буфер", tone: "bg-secondary-container text-on-secondary" };
  if (s.role === "support") return { label: "Хил", tone: "bg-secondary-container text-on-secondary" };
  if (s.role === "mage") return { label: "Маг", tone: "bg-tertiary-container text-on-tertiary" };
  if (s.role === "ranger") return { label: "Лук", tone: "bg-primary-container text-on-primary" };
  if (s.role === "assassin") return { label: "Убийца", tone: "bg-surface-container-highest text-tertiary" };
  if (s.role === "fighter") return { label: "Штурм", tone: "bg-tertiary-container text-on-tertiary" };
  return { label: s.role, tone: "bg-surface-container-high text-on-surface" };
}

function raidBattleCatArt(tid) {
  if (typeof CAT_HERO_BATTLE_ART !== "undefined" && CAT_HERO_BATTLE_ART[tid]) return CAT_HERO_BATTLE_ART[tid];
  if (typeof CAT_HERO_ART !== "undefined" && CAT_HERO_ART[tid]) return CAT_HERO_ART[tid];
  return "/stitch-assets/cat-heroes/tank-fire.jpg?v=elven18";
}

/** Stitch legion-12 battle board: columns L→R = тыл → даль → штурм → авангард. */
function renderRaidBattleStub() {
  ensureRaidLegion();
  const root = $("viewRaidBattle");
  if (!root) return;
  const snap = raidFormationSnapshot();
  const raid = raidDef();
  const path = raidPathDef();
  const nodes = path?.nodes || [];
  const ui = RAID_BOSS_UI[raid?.raidId] || RAID_BOSS_UI.myaurra;
  const stageId = snap.stageId;
  const nodeN = (snap.nodeIndex | 0) + 1;
  const nodeMax = nodes.length || 1;
  root.dataset.raidFormationJson = JSON.stringify(snap);

  const setTxt = (sel, text) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = text;
  };
  setTxt(
    "[data-raid-battle-sector]",
    `${(raid?.title_ru || "Рейд").toUpperCase()} · ${
      state.raidPathLocked
        ? state.raidPath === "long"
          ? "ДЛИННЫЙ"
          : "КОРОТКИЙ"
        : state.raidPathVoteOpen
          ? "ГОЛОСОВАНИЕ"
          : "ВХОД · ПУТЬ ПОЗЖЕ"
    }`,
  );
  setTxt("[data-raid-battle-round]", `УЗЕЛ ${nodeN}/${nodeMax}`);
  const mine = state.battle ? state.battle.active === 0 && !state.battle.result : true;
  setTxt(
    "[data-raid-battle-phase]",
    state.battle && !state.battle.result ? (mine ? "/ ХОД ИГРОКА" : "/ ХОД БОТА") : "/ ПРЕВЬЮ СТРОЯ",
  );
  setTxt("[data-raid-battle-timer]", formatBattleTimer(snap.turnSec));
  setTxt("[data-raid-battle-boss-name]", raid?.title_ru || "Босс рейда");
  setTxt("[data-raid-battle-boss-sub]", `${ui.place_ru} · ${ui.mech_ru}`);
  setTxt("[data-raid-battle-boss-hp]", "— / —");
  setTxt("[data-raid-battle-rage]", `Фаза «${ui.phase_ru}» · строй 4×3`);
  setTxt(
    "[data-raid-battle-meta]",
    `${stageId} · ход ${formatBattleTimer(snap.turnSec)}`,
  );
  setTxt(
    "[data-raid-battle-wing]",
    `Крыло 3v3: ${snap.wing3v3.map((id) => String(id).replace(/^shop_/, "")).join(" · ")}`,
  );
  setTxt(
    "[data-raid-battle-note]",
    "Stitch · построение в бою: саппорты → маги/лучники → убийцы/воины → танки. «В бой» — симулятор узла.",
  );

  const bossArt = ui.art;
  const bossImg = root.querySelector("[data-raid-enemy-boss]");
  if (bossImg) {
    bossImg.src = bossArt;
    bossImg.alt = raid?.title_ru || "Босс";
  }
  const bossIcon = root.querySelector("[data-raid-battle-boss-icon]");
  if (bossIcon) bossIcon.src = bossArt;
  const bar = root.querySelector("[data-raid-battle-boss-bar]");
  if (bar) bar.style.width = "100%";

  // Column order matches Stitch: rear(support) → ranged → melee → front(tanks)
  const cols = [
    { row: 3, head: "РЯД 4: САППОРТ", headClass: "text-secondary-fixed" },
    { row: 2, head: "РЯД 3: МАГИ/ЛУК", headClass: "text-primary" },
    { row: 1, head: "РЯД 2: ШТУРМ", headClass: "text-tertiary" },
    { row: 0, head: "РЯД 1: ТАНКИ", headClass: "text-on-primary font-bold", headBg: "bg-primary-container" },
  ];
  const board = root.querySelector("[data-raid-battle-board]");
  if (!board) return;
  board.innerHTML = cols
    .map((col) => {
      const cards = [0, 1, 2]
        .map((slotCol) => {
          const s = state.raidLegion.find((x) => x.row === col.row && x.col === slotCol);
          if (!s?.filled) {
            return `<div class="relative bg-surface-container/40 rounded-xl p-1.5 border border-dashed border-outline-variant/40 flex flex-col items-center justify-center h-28 text-outline text-[10px]" data-row="${col.row}" data-col="${slotCol}">пусто</div>`;
          }
          const badge = raidBattleRoleBadge(s);
          const art = raidBattleCatArt(s.templateId);
          const tankish = s.role === "tank";
          return `<div class="relative bg-surface-container/95 rounded-xl p-1.5 shadow-md flex flex-col justify-between h-28 sm:h-32 hover:scale-[1.02] transition-transform cursor-pointer group${tankish ? " border border-primary/40" : ""}" data-row="${col.row}" data-col="${slotCol}" data-role="${s.role}" data-sub="${s.sub}" data-template="${s.templateId}">
            <div class="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full ${badge.tone} text-[9px] uppercase font-bold z-10">${badge.label}</div>
            <div class="relative w-full h-14 sm:h-16 rounded-lg bg-surface-container-lowest overflow-hidden flex items-end justify-center">
              <img alt="" class="h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform" src="${art}"/>
              <div class="absolute top-1 right-1 px-1 rounded bg-surface-container-high text-on-surface text-[8px] leading-tight">${s.sub}</div>
            </div>
            <div class="flex flex-col mt-1">
              <span class="text-[11px] font-bold text-on-surface truncate leading-tight">${s.name_ru}</span>
              <div class="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden mt-1">
                <div class="bg-secondary h-full rounded-full" style="width:100%"></div>
              </div>
              <div class="flex items-center justify-between text-[9px] text-on-surface-variant mt-0.5">
                <span class="text-secondary font-bold">готов</span>
                <span class="text-primary-fixed">${s.role}</span>
              </div>
            </div>
          </div>`;
        })
        .join("");
      const headBg = col.headBg || "bg-surface-container-high/90";
      return `<div class="flex flex-col gap-1.5" data-raid-col-row="${col.row}">
        <div class="px-1.5 py-0.5 rounded ${headBg} text-center text-[10px] font-bold ${col.headClass}">${col.head}</div>
        ${cards}
      </div>`;
    })
    .join("");

  const endBtn = $("raidEndTurnBtn");
  if (endBtn) {
    const live = !!(state.battle && !state.battle.result);
    const voting = !!state.raidPathVoteOpen;
    const title = endBtn.querySelector("span.flex span:last-child") || endBtn.querySelector("span span:last-child");
    const sub = endBtn.querySelector("span.font-label-sm");
    if (title) {
      title.textContent = voting ? "ГОЛОСОВАНИЕ" : live ? "ЗАВЕРШИТЬ ХОД" : "В БОЙ";
    }
    if (sub) {
      sub.textContent = voting
        ? "Выберите короткий или длинный путь"
        : live
          ? `ХОД ${formatBattleTimer(snap.turnSec)} · [ПРОБЕЛ]`
          : state.raidPathLocked
            ? `Строй 12 · узел ${nodeN}/${nodeMax}`
            : "Входной отряд · путь после победы";
    }
    endBtn.disabled = voting;
    endBtn.classList.toggle("opacity-50", voting);
  }
  const note = root.querySelector("[data-raid-battle-note]");
  if (note) {
    note.textContent = state.raidPathVoteOpen
      ? "Голосование пути на форме боя · большинство пати · затем следующий узел"
      : state.raidPathLocked
        ? `Путь зафиксирован: ${state.raidPath === "long" ? "длинный" : "короткий"} · строй 4×3`
        : "Сначала входной отряд · короткий/длинный путь — голосованием после победы";
  }
  paintBattleTurnTimer(snap.turnSec);
  renderRaidPathVotePanel();
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

function renderRaidFormationEditor() {
  ensureRaidLegion();
  $("formEyebrow").textContent = t("raid.form.eyebrow", "Рейд · легион 12");
  $("formTitle").textContent = t("raid.form.title", "Строй легиона 4×3");
  $("formLead").textContent = t(
    "raid.form.lead",
    "Тыл саппорты → даль (маги/лучники) → мили (убийцы/воины) → фронт танки (2 агр + 1 пробитие).",
  );
  const lanes = $("formationLanes");
  if (!lanes) return;
  const v = validateRaidComposition();
  const artFor = (tid) =>
    (typeof CAT_HERO_ART !== "undefined" && CAT_HERO_ART[tid]) ||
    `/stitch-assets/cat-heroes/tank-fire.jpg?v=elven18`;
  lanes.innerHTML = "";
  const tip = document.createElement("p");
  tip.className = "meta formation-tip";
  tip.id = "formationRoleTip";
  tip.textContent = v.ok
    ? `Состав OK · ${RAID_PARTY_SIZE}/12 · ход ${formatBattleTimer(battleTurnTimerSec())}`
    : `Нужно: 3T (2 агр+1 пробитие), 3S (2 хил+1 бафф), 6 DPS · сейчас T${v.counts.tank}/S${v.counts.support}/D${v.counts.dps}`;
  lanes.appendChild(tip);
  const board = document.createElement("div");
  board.className = "raid-form-board";
  board.innerHTML = [...RAID_FORMATION_ROWS]
    .map((rowDef) => {
      const slots = [0, 1, 2]
        .map((col) => {
          const s = state.raidLegion.find((x) => x.row === rowDef.row && x.col === col);
          const filled = !!s?.filled;
          return `<button type="button" class="raid-form-slot${filled ? " is-on" : ""}" data-raid-form-row="${rowDef.row}" data-raid-form-col="${col}">
            ${
              filled
                ? `<img alt="" src="${artFor(s.templateId)}"/><b>${s.name_ru}</b><em>${s.sub}</em>`
                : `<span class="material-symbols-outlined">add</span><em>${rowDef.label_ru}</em>`
            }
          </button>`;
        })
        .join("");
      return `<div class="raid-form-row"><div class="raid-form-row-label">${rowDef.label_ru}</div><div class="raid-form-row-slots">${slots}</div></div>`;
    })
    .join("");
  lanes.appendChild(board);
  const actions = document.createElement("div");
  actions.className = "raid-form-actions";
  actions.innerHTML = `
    <button type="button" class="wire-btn" data-raid-form-fill="12">Заполнить 12 (канон)</button>
    <button type="button" class="wire-btn" data-raid-form-fill="0">Очистить</button>
    <button type="button" class="wire-btn" data-hud-action="raid-form-back">К лобби рейда</button>
    <button type="button" class="wire-btn primary" data-hud-action="raid-form-go"${v.ok ? "" : " disabled"}>К доске боя</button>
  `;
  lanes.appendChild(actions);
  if (!lanes.dataset.raidFormBound) {
    lanes.dataset.raidFormBound = "1";
    lanes.addEventListener("click", (ev) => {
      const fill = ev.target.closest("[data-raid-form-fill]");
      if (fill) {
        fillRaidLegionSlots(Number(fill.getAttribute("data-raid-form-fill")) || 0);
        renderRaidFormationEditor();
        return;
      }
      if (ev.target.closest("[data-hud-action='raid-form-back']")) {
        state.formationMode = "";
        navigate("boss_raid", { primary: "combat" });
        return;
      }
      if (ev.target.closest("[data-hud-action='raid-form-go']")) {
        viewRaidFight({ autoPlay: false });
        return;
      }
      const slot = ev.target.closest("[data-raid-form-row]");
      if (!slot) return;
      const row = Number(slot.getAttribute("data-raid-form-row"));
      const col = Number(slot.getAttribute("data-raid-form-col"));
      const full = buildRaidLegionRoster();
      const proto = full.find((x) => x.row === row && x.col === col);
      const cur = state.raidLegion.find((x) => x.row === row && x.col === col);
      if (!proto || !cur) return;
      Object.assign(cur, proto, { filled: !cur.filled });
      state.raidLegionCount = state.raidLegion.filter((s) => s.filled).length;
      renderRaidFormationEditor();
    });
  }
  const tray = $("formationPotions");
  if (tray) {
    tray.innerHTML = `<p class="meta">Рейд: зелья легиона · Soon. Таймер хода ${formatBattleTimer(battleTurnTimerSec())}.</p>`;
  }
}

function renderFormation() {
  if (state.formationMode === "raid" || state.battleMode === "boss") {
    renderRaidFormationEditor();
    return;
  }
  $("formEyebrow").textContent = t("hub.tab.formation", "Расстановка");
  $("formTitle").textContent = t("formation.title", "Строй отряда 3v3");
  $("formLead").textContent = t(
    "formation.lead",
    "Авангард → Центр → Тыл. Не ставь саппорта/стрелка/мага вперёд — фронт для танка (и мили).",
  );
  const lanes = $("formationLanes");
  if (!lanes) return;
  lanes.innerHTML = "";
  delete lanes.dataset.raidFormBound;
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
  // A4: potions not playable in Phase 1 sim — show inventory as Soon, do not promise in-fight use.
  const note = document.createElement("p");
  note.className = "text-xs text-on-surface-variant mb-1";
  note.textContent = t(
    "formation.potions.soon",
    "Боевые зелья · Soon (каталог есть; play в бою — следующая фаза)",
  );
  tray.appendChild(note);
  for (const pid of state.ownedPotions) {
    const def = POTIONS.find((p) => p.id === pid);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "potion-chip";
    chip.textContent = `${t(def?.nameKey || pid, pid)} · Soon`;
    chip.addEventListener("click", () =>
      showGateTip(t("formation.potions.gate", "Зелья в бою ещё не подключены (Phase 1)")),
    );
    tray.appendChild(chip);
  }
  if (!state.ownedPotions.length) {
    const empty = document.createElement("span");
    empty.textContent = t("formation.no_potions", "Нет зелий — рынок у крафтеров");
    tray.appendChild(empty);
  }
}

function renderShop() {
  $("shopEyebrow").textContent = t("hub.tab.shop");
  $("shopTitle").textContent = t("hub.tab.shop");
  $("shopLead").textContent = t(
    "shop.lead_channels",
    "IAP · пасс · рыбки · breeding · 12 common · PvP броня · battle coins → PvP gear (PvE только из данжей/рейдов)",
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
        else if (row.id.startsWith("armor_") || row.id.startsWith("pvp_set_")) grantShopPvpGear(row.id);
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
        else if (row.id.startsWith("armor_") || row.id.startsWith("pvp_set_")) grantShopPvpGear(row.id);
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

function buyMarketItem(item) {
  if (!item) return;
  if (item.gated) {
    showGateTip();
    return;
  }
  const price = item.price || 0;
  if ((state.wallet.gold || 0) < price) {
    toast(`Недостаточно рыбок (нужно ${price})`);
    return;
  }
  const matId = item.matId || item.id;
  const qty = item.buyQty || 1;
  if (!barnMatGet(matId) && !BARN_MATS_SEED.some((m) => m.id === matId)) {
    toast("SKU без склада (stub)");
    return;
  }
  state.wallet.gold -= price;
  const mat = barnMatAdd(matId, qty);
  if (mat && (item.kind === "tool" || String(matId).startsWith("tool_"))) {
    const seed = BARN_MATS_SEED.find((m) => m.id === matId);
    if (seed?.name) mat.name = seed.name;
    if (seed?.iconSrc) mat.iconSrc = seed.iconSrc;
    mat.kind = "tool";
    ensureToolDurability(mat);
    mat.durability = mat.durabilityMax || TOOL_DURABILITY_MAX;
    persistGearStub();
  }
  renderCurrency();
  toast(`Куплено: ${mat?.name || item.name} ×${qty} → склад`);
  renderMarket();
  if (!$("viewGear")?.classList.contains("hidden")) renderBarn();
}

function bindMarketStitchOnce(root) {
  if (!root || root.dataset.marketMatsBound === "1") return;
  root.dataset.marketMatsBound = "1";
  const map = [
    { re: /Кирка/i, sku: "tool_pick" },
    { re: /Топор/i, sku: "tool_axe" },
    { re: /Лопата/i, sku: "tool_shovel" },
    { re: /Удочка/i, sku: "tool_rod" },
    { re: /Семена/i, sku: "seed_wheat" },
  ];
  for (const card of root.querySelectorAll(".bg-surface-container.rounded-xl")) {
    const title = card.querySelector(".font-label-lg, .font-headline-md")?.textContent || "";
    const hit = map.find((m) => m.re.test(title));
    if (!hit) continue;
    const sku = MARKET_STOCK.find((s) => s.id === hit.sku);
    if (!sku) continue;
    const iconBox = card.querySelector(".w-12.h-12, .w-32, .shrink-0");
    if (iconBox && sku.iconSrc) {
      iconBox.innerHTML = `<img alt="" class="w-full h-full object-contain p-1" src="${sku.iconSrc}"/>`;
    }
    const buyBtn = [...card.querySelectorAll("button")].find((b) => /Купить/i.test(b.textContent || ""));
    if (buyBtn) {
      buyBtn.setAttribute("data-market-sku", sku.id);
      buyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        buyMarketItem(sku);
      });
    }
  }
}

function renderMarket() {
  const eyebrow = $("marketEyebrow");
  if (eyebrow) eyebrow.textContent = t("hub.tab.market", "Рынок");
  const title = $("marketTitle");
  if (title) title.textContent = t("market.title", "Рынок Усадьбы");
  const lead = $("marketLead");
  if (lead) {
    lead.textContent = t(
      "market.lead",
      "Семена · инструменты · ингредиенты/ресурсы · quick sell. Покупка → склад.",
    );
  }
  const stitch = $("viewMarket");
  if (stitch) bindMarketStitchOnce(stitch);

  const list = $("marketList");
  if (list) {
    list.innerHTML = "";
    for (const item of MARKET_STOCK) {
      const li = document.createElement("li");
      const icon = item.iconSrc
        ? `<img alt="" src="${item.iconSrc}" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;margin-right:6px"/>`
        : "";
      li.innerHTML = `<span>${icon}${item.name} · ${item.kind} · ${item.price} 🐟${item.gated ? " · gated" : ""}</span>`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wire-btn";
      btn.textContent = t("market.buy", "Купить");
      btn.addEventListener("click", () => buyMarketItem(item));
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
      const icon = item.iconSrc
        ? `<img alt="" src="${item.iconSrc}" style="width:32px;height:32px;object-fit:contain;float:left;margin-right:8px"/>`
        : "";
      row.innerHTML = `${icon}<strong>${item.name}</strong><div class="meta">${item.kind} · ${item.price} 🐟 · на склад ×${item.buyQty || 1}</div>`;
      row.addEventListener("click", () => buyMarketItem(item));
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

/** Painted trade screens are live in HUD; remaining map pins stay tip-only. */
const TRADE_ZONE_OPEN = new Set(["tavern", "shop", "market", "auction"]);
const TRADE_ZONE_TIP = {
  farm: "Угодья: портал пока закрыт (SL)",
  pass: "Боевой пасс: открой из верхнего меню",
};

function tradeTip(zone) {
  toast(TRADE_ZONE_TIP[zone] || "Зона площади: скоро");
}

function openTradeZone(zone) {
  if (TRADE_ZONE_OPEN.has(zone)) {
    navigate(zone);
    return true;
  }
  tradeTip(zone);
  return false;
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
        openTradeZone(zone);
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
  const eyebrow = $("tavernEyebrow");
  if (eyebrow) eyebrow.textContent = t("hub.tab.tavern", "Таверна");
  const title = $("tavernTitle");
  if (title) title.textContent = t("tavern.title", "Таверна «Усатый Хмель»");
  const lead = $("tavernLead");
  if (lead) {
    lead.textContent = t(
      "tavern.lead_milk",
      "Молоко на льду = HP после боя. Бафф-молоко — только PvE/данжи. Зелья → рынок/аукцион.",
    );
  }
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
  1: "/stitch-assets/kb-v3/armor/r1-steel.webp",
  2: "/stitch-assets/kb-v3/armor/r2-ranger.webp",
  3: "/stitch-assets/kb-v3/armor/r3-blue.webp",
  4: "/stitch-assets/kb-v3/armor/r4-lion.webp",
  5: "/stitch-assets/kb-v3/armor/r5-purple.webp",
  6: "/stitch-assets/kb-v3/armor/r6-dragon.webp",
  7: "/stitch-assets/kb-v3/armor/r7-solar.webp",
  8: "/stitch-assets/kb-v3/armor/r8-or-fullplate.webp",
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

/**
 * Stitch rebakes can wipe #codexSearch / #codexTopicList / #codexDetailHost.
 * Re-attach mounts from the painted База знаний column so every topic opens.
 */
function ensureCodexMounts(root) {
  if (!root || root.dataset.kbMounts === "1") return;
  const grid = root.querySelector(".grid.grid-cols-12");
  if (!grid) return;

  const asides = [...grid.querySelectorAll(":scope > aside")];
  const leftAside =
    asides.find((a) => (a.textContent || "").includes("База Знаний")) || asides[0];
  if (!leftAside) return;

  const search =
    leftAside.querySelector("#codexSearch") ||
    leftAside.querySelector('input[placeholder*="Кодекс"], input[type="search"], input[type="text"]');
  if (search) {
    search.id = "codexSearch";
    search.type = "search";
    search.setAttribute("autocomplete", "off");
  }

  let filters = leftAside.querySelector("#codexFilters");
  if (!filters) {
    filters =
      leftAside.querySelector(".overflow-x-auto") ||
      leftAside.querySelector('[role="tablist"]');
  }
  if (filters) {
    filters.id = "codexFilters";
    filters.setAttribute("role", "tablist");
    filters.setAttribute("aria-label", "Фильтры кодекса");
    filters.innerHTML = "";
  }

  leftAside.classList.add("min-h-0", "overflow-hidden");
  leftAside.style.justifyContent = "flex-start";

  let body = leftAside.querySelector(":scope > .flex.flex-col.gap-1");
  if (!body) {
    body = [...leftAside.children].find(
      (el) => el !== leftAside.firstElementChild && el.classList?.contains("flex"),
    );
  }
  if (body) {
    body.classList.add("flex-1", "min-h-0", "overflow-hidden");
    body.style.justifyContent = "flex-start";

    let progress =
      body.querySelector("#codexProgress") ||
      [...body.children].find((el) => (el.textContent || "").includes("Прогресс Кодекса"));
    if (progress) {
      progress.id = "codexProgress";
      progress.classList.add("flex-shrink-0");
    }

    let topicList = body.querySelector("#codexTopicList");
    if (!topicList) {
      topicList = document.createElement("div");
      topicList.id = "codexTopicList";
      topicList.className = "flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-1";
      [...body.children].forEach((ch) => {
        if (ch !== progress) ch.remove();
      });
      body.insertBefore(topicList, progress || null);
    } else {
      topicList.classList.add("flex-1", "min-h-0", "overflow-y-auto", "overflow-x-hidden");
    }
  }

  let host = root.querySelector("#codexDetailHost");
  if (!host) {
    const col2 = grid.querySelector(":scope > section");
    const col3 = asides.find((a) => a !== leftAside);
    if (col2 && col3) {
      host = document.createElement("div");
      host.id = "codexDetailHost";
      host.className = "contents";
      host.dataset.armorDefault = "1";
      grid.insertBefore(host, col2);
      host.appendChild(col2);
      host.appendChild(col3);
    }
  }

  root.dataset.kbMounts = "1";
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
    const icons = block.icons || [];
    const src = block.src;
    const cover = block.fit === "cover";
    if (src || icons.length) {
      const grid =
        icons.length > 0
          ? `<div class="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full p-space-sm">${icons
              .map(
                (ic) =>
                  `<div class="flex flex-col items-center gap-1">
                    <div class="w-14 h-14 rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-center overflow-hidden">
                      <img alt="${codexEsc(ic.label || "")}" class="max-w-full max-h-full object-contain p-1" src="${codexEsc(ic.src)}"/>
                    </div>
                    <span class="font-label-sm text-[9px] text-on-surface-variant text-center leading-tight">${codexEsc(ic.label || "")}</span>
                  </div>`,
              )
              .join("")}</div>`
          : cover
            ? `<div class="w-full overflow-hidden bg-surface-container-lowest" style="height:${codexEsc(h)}"><img alt="${codexEsc(block.label || "")}" class="w-full h-full object-cover object-top" src="${codexEsc(src)}"/></div>`
            : `<img alt="${codexEsc(block.label || "")}" class="w-full h-full object-contain p-2" src="${codexEsc(src)}" style="max-height:14rem"/>`;
      return `<div class="rounded-xl border border-outline-variant/50 bg-surface-container-lowest/50 flex flex-col items-stretch gap-1 overflow-hidden" style="min-height:${codexEsc(h)}">
        <div class="px-space-sm pt-space-xs flex items-center justify-between gap-2">
          <span class="font-label-sm text-[10px] text-outline uppercase tracking-wider">${codexEsc(block.label || "Иллюстрация")}</span>
          ${block.caption ? `<span class="font-body-sm text-[10px] text-on-surface-variant truncate">${codexEsc(block.caption)}</span>` : ""}
        </div>
        ${grid}
      </div>`;
    }
    return `<div class="rounded-xl border border-dashed border-outline-variant/70 bg-surface-container-lowest/50 flex flex-col items-center justify-center gap-1 text-center px-space-sm" style="min-height:${codexEsc(h)}">
      <span class="material-symbols-outlined text-outline text-[28px]">image</span>
      <span class="font-label-sm text-[10px] text-outline uppercase tracking-wider">${codexEsc(block.label || "Иллюстрация")}</span>
      <span class="font-body-sm text-[11px] text-on-surface-variant max-w-[20rem]">${codexEsc(block.caption || "Пустой блок под картинку — арт добавим позже")}</span>
    </div>`;
  }
  if (block.type === "go") {
    return codexGoHtml(block.links || []);
  }
  return "";
}

/** CTA buttons from a knowledge article into live game screens. */
function codexGoHtml(links) {
  if (!Array.isArray(links) || !links.length) return "";
  const btns = links
    .map((l) => {
      if (!l || !l.tab) return "";
      const soon = l.soon ? ` data-kb-soon="${codexEsc(l.soon)}"` : "";
      const primary = l.primary ? ` data-kb-primary="${codexEsc(l.primary)}"` : "";
      return `<button type="button" data-kb-go="${codexEsc(l.tab)}"${soon}${primary} class="px-3 py-2 rounded-lg bg-primary text-on-primary font-label-md text-[12px] font-bold hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_2px_8px_rgba(253,186,69,0.25)]">
        <span class="material-symbols-outlined text-[16px]">${codexEsc(l.icon || "arrow_forward")}</span>
        <span>${codexEsc(l.label || l.tab)}</span>
      </button>`;
    })
    .filter(Boolean)
    .join("");
  if (!btns) return "";
  return `<div class="bg-surface-container-low/95 rounded-xl p-space-md shadow-xl flex flex-col gap-space-xs border border-primary/25">
    <span class="font-label-sm text-label-sm text-primary uppercase tracking-wider font-bold">Открыть в игре</span>
    <div class="flex flex-wrap gap-2">${btns}</div>
  </div>`;
}

function codexRenderArticle(topic) {
  const blocks = (topic.blocks || []).map(codexBlockHtml).join("");
  const goSide = codexGoHtml(topic.go || []);
  const sideBlocks = (topic.side || []).map(codexBlockHtml).join("");
  const side =
    sideBlocks || goSide
      ? `${sideBlocks}${goSide}`
      : `<div class="bg-surface-container-low/95 rounded-xl p-space-md shadow-xl text-[12px] text-on-surface-variant">Источник: ${codexEsc(topic.source || "wiki")}</div>`;
  const leadExtra = topic.detail
    ? `<p class="font-body-sm text-[13px] text-on-surface-variant/90 leading-relaxed z-10">${codexEsc(topic.detail)}</p>`
    : "";
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
  <p class="font-body-md text-body-md text-on-surface leading-relaxed z-10">${codexEsc(topic.lead || "")}</p>
  ${leadExtra}
  <div class="flex flex-col gap-space-sm z-10 overflow-auto flex-1 min-h-0">${blocks}</div>
  <div class="text-[10px] text-outline z-10 pt-1">Источник: ${codexEsc(topic.source || "")}</div>
</section>
<aside class="col-span-12 lg:col-span-4 flex flex-col justify-between gap-space-sm min-h-0 overflow-auto h-full max-h-full">
  ${side}
</aside>`;
}


function renderCodex() {
  const root = $("viewCodex");
  if (!root || root.classList.contains("hidden")) return;
  ensureCodexMounts(root);
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
    const goText = (t.go || []).map((g) => [g.label, g.tab].filter(Boolean).join(" ")).join(" ");
    const hay = [t.title, t.blurb, t.tag, t.headline, t.lead, t.detail, t.source, blockText, goText]
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
      const goHtml = codexGoHtml(topic.go || []);
      if (goHtml) {
        const strip = document.createElement("div");
        strip.className =
          "col-span-12 flex flex-col gap-space-sm px-space-md pb-space-md";
        strip.innerHTML = goHtml;
        host.appendChild(strip);
      }
    } else {
      host.innerHTML = codexRenderArticle(topic);
    }
  }

  if (root.dataset.kbWired !== "1") {
    root.dataset.kbWired = "1";
    root.addEventListener("click", (e) => {
      const goBtn = e.target.closest("[data-kb-go]");
      if (goBtn && root.contains(goBtn)) {
        e.preventDefault();
        const tab = goBtn.getAttribute("data-kb-go");
        if (!tab) return;
        navigate(tab, {
          soon: goBtn.getAttribute("data-kb-soon") || null,
          primary: goBtn.getAttribute("data-kb-primary") || null,
        });
        return;
      }
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
  starter_tank_stone: "Рыжик Огненный",
  starter_fighter_fire: "Барсик Громовержец",
  starter_support_water: "Мурка Водная",
  shop_tank_fire: "Щит-жара",
  shop_tank_water: "Пробой-прилив",
  shop_tank_wind: "Щит-вихрь",
  shop_fighter_fire: "Парные когти",
  shop_fighter_water: "Молот прилива",
  shop_fighter_wind: "Ветряной размах",
  shop_assassin_fire: "Тень-жар",
  shop_assassin_water: "Охотник тыла",
  shop_assassin_wind: "Ядовитый порыв",
  shop_ranger_fire: "Охотник",
  shop_ranger_water: "Град капель",
  shop_ranger_wind: "Метка ветра",
  shop_mage_fire: "Огненный шар",
  shop_mage_water: "Ледяной взор",
  shop_mage_wind: "Цепной порыв",
  shop_support_fire: "Целительный жар",
  shop_support_water: "Чистый родник",
  shop_support_wind: "Попутный шквал",
  bot_practice_tank_a: "Дубовый",
  bot_practice_fighter_a: "Берсерк",
  bot_practice_support_a: "Тотем",
};

/**
 * Full-body portraits — elven 18 (6 roles × fire/water/wind).
 * Idle JPG from cat-heroes-v2 (breed map: fire→fire, water→ice, wind→stone). Battle: same until cutouts land.
 */
const CAT_HERO_ART = {
  shop_tank_fire: "/stitch-assets/cat-heroes/tank-fire.jpg?v=elven18",
  shop_tank_water: "/stitch-assets/cat-heroes/tank-water.jpg?v=elven18",
  shop_tank_wind: "/stitch-assets/cat-heroes/tank-wind.jpg?v=elven18",
  shop_fighter_fire: "/stitch-assets/cat-heroes/fighter-fire.jpg?v=elven18",
  shop_fighter_water: "/stitch-assets/cat-heroes/fighter-water.jpg?v=elven18",
  shop_fighter_wind: "/stitch-assets/cat-heroes/fighter-wind.jpg?v=elven18",
  shop_assassin_fire: "/stitch-assets/cat-heroes/assassin-fire.jpg?v=elven18",
  shop_assassin_water: "/stitch-assets/cat-heroes/assassin-water.jpg?v=elven18",
  shop_assassin_wind: "/stitch-assets/cat-heroes/assassin-wind.jpg?v=elven18",
  shop_ranger_fire: "/stitch-assets/cat-heroes/ranger-fire.jpg?v=elven18",
  shop_ranger_water: "/stitch-assets/cat-heroes/ranger-water.jpg?v=elven18",
  shop_ranger_wind: "/stitch-assets/cat-heroes/ranger-wind.jpg?v=elven18",
  shop_mage_fire: "/stitch-assets/cat-heroes/mage-fire.jpg?v=elven18",
  shop_mage_water: "/stitch-assets/cat-heroes/mage-water.jpg?v=elven18",
  shop_mage_wind: "/stitch-assets/cat-heroes/mage-wind.jpg?v=elven18",
  shop_support_fire: "/stitch-assets/cat-heroes/support-fire.jpg?v=elven18",
  shop_support_water: "/stitch-assets/cat-heroes/support-water.jpg?v=elven18",
  shop_support_wind: "/stitch-assets/cat-heroes/support-wind.jpg?v=elven18",
  starter_tank_stone: "/stitch-assets/cat-heroes/tank-fire.jpg?v=elven18",
  starter_fighter_fire: "/stitch-assets/cat-heroes/fighter-fire.jpg?v=elven18",
  starter_support_water: "/stitch-assets/cat-heroes/support-water.jpg?v=elven18",
};

/** Fight board art — same idle until transparent cutouts (D-037). */
const CAT_HERO_BATTLE_ART = {
  shop_tank_fire: "/stitch-assets/cat-heroes/battle/tank-fire.jpg?v=elven18",
  shop_tank_water: "/stitch-assets/cat-heroes/battle/tank-water.jpg?v=elven18",
  shop_tank_wind: "/stitch-assets/cat-heroes/battle/tank-wind.jpg?v=elven18",
  shop_fighter_fire: "/stitch-assets/cat-heroes/battle/fighter-fire.jpg?v=elven18",
  shop_fighter_water: "/stitch-assets/cat-heroes/battle/fighter-water.jpg?v=elven18",
  shop_fighter_wind: "/stitch-assets/cat-heroes/battle/fighter-wind.jpg?v=elven18",
  shop_assassin_fire: "/stitch-assets/cat-heroes/battle/assassin-fire.jpg?v=elven18",
  shop_assassin_water: "/stitch-assets/cat-heroes/battle/assassin-water.jpg?v=elven18",
  shop_assassin_wind: "/stitch-assets/cat-heroes/battle/assassin-wind.jpg?v=elven18",
  shop_ranger_fire: "/stitch-assets/cat-heroes/battle/ranger-fire.jpg?v=elven18",
  shop_ranger_water: "/stitch-assets/cat-heroes/battle/ranger-water.jpg?v=elven18",
  shop_ranger_wind: "/stitch-assets/cat-heroes/battle/ranger-wind.jpg?v=elven18",
  shop_mage_fire: "/stitch-assets/cat-heroes/battle/mage-fire.jpg?v=elven18",
  shop_mage_water: "/stitch-assets/cat-heroes/battle/mage-water.jpg?v=elven18",
  shop_mage_wind: "/stitch-assets/cat-heroes/battle/mage-wind.jpg?v=elven18",
  shop_support_fire: "/stitch-assets/cat-heroes/battle/support-fire.jpg?v=elven18",
  shop_support_water: "/stitch-assets/cat-heroes/battle/support-water.jpg?v=elven18",
  shop_support_wind: "/stitch-assets/cat-heroes/battle/support-wind.jpg?v=elven18",
  starter_tank_stone: "/stitch-assets/cat-heroes/battle/tank-fire.jpg?v=elven18",
  starter_fighter_fire: "/stitch-assets/cat-heroes/battle/fighter-fire.jpg?v=elven18",
  starter_support_water: "/stitch-assets/cat-heroes/battle/support-water.jpg?v=elven18",
  // Practice dummies — dedicated no-bg mannequins (D-037 fight-only).
  bot_practice_tank_a: "/stitch-assets/dojo/battle/dummy-oak-knight.webp?v=dummyfix1",
  bot_practice_fighter_a: "/stitch-assets/dojo/battle/dummy-straw-berserk.webp?v=dummyfix1",
  bot_practice_support_a: "/stitch-assets/dojo/battle/dummy-stone-totem.webp?v=dummyfix1",
};

/** Lobby JPG + battle WebP fallbacks when primary cutout 404s. */
const PRACTICE_DUMMY_ART_FALLBACKS = {
  bot_practice_tank_a: [
    "/stitch-assets/dojo/battle/dummy-oak-knight.webp?v=dummyfix1",
    "/stitch-assets/dojo/dummy-oak-knight.jpg",
  ],
  bot_practice_fighter_a: [
    "/stitch-assets/dojo/battle/dummy-straw-berserk.webp?v=dummyfix1",
    "/stitch-assets/dojo/dummy-straw-berserk.jpg",
  ],
  bot_practice_support_a: [
    "/stitch-assets/dojo/battle/dummy-stone-totem.webp?v=dummyfix1",
    "/stitch-assets/dojo/dummy-stone-totem.jpg",
  ],
};

/** Set fight portrait src; on error walk fallbacks (practice dummies / missing cutouts). */
function bindBattleUnitImg(img, primarySrc, fallbackSrcs = []) {
  if (!img || !primarySrc) return;
  const chain = [primarySrc, ...fallbackSrcs].filter(Boolean);
  let i = 0;
  const apply = () => {
    if (i >= chain.length) return;
    img.onerror =
      i < chain.length - 1
        ? () => {
            i += 1;
            apply();
          }
        : null;
    img.src = chain[i];
  };
  apply();
}

const CAT_HERO_BLURB = {
  shop_tank_fire: "Танк · огонь: taunt + poke. Карты «Оскал жара» / «Удар щита-жара» (N=6).",
  shop_tank_water: "Танк · вода: pierce/fragile. Карты «Трещина волны» / «Хвост-пробой» (N=6).",
  shop_tank_wind: "Танк · ветер: taunt + reflect. Карты «Рёв ветра» / «Щит-вихрь» (N=6).",
  shop_fighter_fire: "Боец · огонь: burst crit. Карты «Искрящий взгляд» / «Двойной удар» (N=6).",
  shop_fighter_water: "Боец · вода: heavy smash. Карты «Молот прилива» / «Двуручный шквал» (N=6).",
  shop_fighter_wind: "Боец · ветер: hybrid cleave. Карты «Слух строя» / «Ветряной размах» (N=6).",
  shop_assassin_fire: "Ассасин · огонь: stealth crit. Карты «Теневой укус» / «Удар из тени» (N=6).",
  shop_assassin_water: "Ассасин · вода: backline execute. Карты «Прицел в спину» / «Казнь сзади» (N=6).",
  shop_assassin_wind: "Ассасин · ветер: poison spread. Карты «Глаза сквозняка» / «Шквал яда» (N=6).",
  shop_ranger_fire: "Стрелок · огонь: hunter lowest_hp. Карты «Глаз добычи» / «Огненная стрела» (N=6).",
  shop_ranger_water: "Стрелок · вода: mass volley. Карты «Град капель» / «Волна стрел» (N=6).",
  shop_ranger_wind: "Стрелок · ветер: mark + pierce. Карты «Метка ветра» / «Стрела-шквал» (N=6).",
  shop_mage_fire: "Маг · огонь: AoE + vuln. Карты «Огненный шар» / «Волна жара» (N=6).",
  shop_mage_water: "Маг · вода: freeze control. Карты «Ледяной взор» / «Буря льда» (N=6).",
  shop_mage_wind: "Маг · ветер: hybrid bolt. Карты «Разряд» / «Цепной порыв» (N=6).",
  shop_support_fire: "Саппорт · огонь: heal + smite. Карты «Целительный жар» / «Праведный ожог» (N=6).",
  shop_support_water: "Саппорт · вода: heal + cleanse. Карты «Целительный взгляд» / «Уши очищения» (N=6).",
  shop_support_wind: "Саппорт · ветер: heal + ATK buff. Карты «Вдохновляющий взор» / «Попутный шквал» (N=6).",
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
    // *-faceleft = flopped toward cats (board-right faces left). Native-left originals unchanged.
    tank: ["/stitch-assets/monsters/battle/tank-b-faceleft.webp?v=faceleft2"],
    // Grey dual-club fighter-h (обычный пёс). Do NOT use fighter-b — that dual-axe red plate
    // is the ch3 red-dog look (Andrew: ch1 showed «красный пёс»).
    fighter: ["/stitch-assets/monsters/battle/fighter-h-faceleft.webp?v=faceleft3"],
    // Ch1 dog archers: grey canine only. Never ranger-b (frost wolf = ch2 Ледяные Пещеры).
    ranger: ["/stitch-assets/monsters/battle/ranger-a-faceleft.webp?v=faceleft2"],
    // No dog support in PvE roster (Andrew plan).
    pitboss: ["/stitch-assets/monsters/battle/tank-d-faceleft.webp?v=faceleft2"],
  },
  wolves: {
    tank: ["/stitch-assets/monsters/battle/wolf-tank-cutout-faceleft.webp?v=faceleft2"],
    // Andrew: no separate «Волк-клык»; ice archer cutout is Волк-лучник (ranger only).
    ranger: ["/stitch-assets/monsters/battle/wolf-fighter-cutout-faceleft.webp?v=faceleft2"],
    // Original already faces left; faceleft rebake faced right.
    support: ["/stitch-assets/monsters/battle/wolf-support-cutout.webp?v=faceleft2"],
    pitboss: ["/stitch-assets/monsters/battle/wolf-pitboss-cutout.webp?v=faceleft2"],
  },
  red_dogs: {
    // Ch3: all four use left-facing authored files (no faceleft for tank/fighter — rebakes faced wrong).
    tank: ["/stitch-assets/monsters/battle/redd-tank-cutout.webp?v=faceleft3"],
    fighter: ["/stitch-assets/monsters/battle/redd-fighter-cutout.webp?v=faceleft3"],
    // Andrew: drop Алый убийца; Пёс-искромёт art = assassin role.
    assassin: ["/stitch-assets/monsters/battle/redd-support-cutout.webp?v=faceleft2"],
    pitboss: ["/stitch-assets/monsters/battle/redd-pitboss-cutout.webp?v=faceleft2"],
  },
  zombies: {
    // Ch4: butcher fighter + poison assassin; pitboss original (faceleft rebake faced wrong).
    tank: ["/stitch-assets/monsters/battle/zombie-tank-cutout-faceleft.webp?v=faceleft2"],
    fighter: [
      "/stitch-assets/monsters/battle/zombie-fighter-cutout-faceleft.webp?v=faceleft2",
      "/stitch-assets/monsters/battle/zombie-tank-cutout-faceleft.webp?v=faceleft2",
    ],
    assassin: ["/stitch-assets/monsters/battle/zombie-support-cutout-faceleft.webp?v=faceleft2"],
    support: ["/stitch-assets/monsters/battle/zombie-support-cutout-faceleft.webp?v=faceleft2"],
    pitboss: ["/stitch-assets/monsters/battle/zombie-pitboss-cutout.webp?v=faceleft3"],
  },
  ghosts: {
    // Ch5: shield+flail / scimitar cape / shaman staff; banner-sword pitboss.
    tank: ["/stitch-assets/monsters/battle/ghost-tank-cutout-faceleft.webp?v=faceleft2"],
    fighter: ["/stitch-assets/monsters/battle/ghost-fighter-cutout-faceleft.webp?v=faceleft2"],
    support: ["/stitch-assets/monsters/battle/ghost-support-cutout-faceleft.webp?v=faceleft2"],
    pitboss: ["/stitch-assets/monsters/battle/ghost-pitboss-cutout-faceleft.webp?v=faceleft2"],
  },
  // Raid factions (docs/raids) — PNG cutouts 2026-11-22
  solar_lions: {
    tank: ["/stitch-assets/monsters/battle/solar-lion-tank-cutout.webp?v=raid1"],
    fighter: ["/stitch-assets/monsters/battle/solar-lion-fighter-cutout.webp?v=raid1"],
    support: ["/stitch-assets/monsters/battle/solar-lion-fighter-cutout.webp?v=raid1"],
    pitboss: ["/stitch-assets/monsters/battle/myaurra-pitboss-cutout.webp?v=raid1"],
  },
  deep_lynxes: {
    tank: ["/stitch-assets/monsters/battle/deep-lynx-tank-cutout.webp?v=raid1"],
    fighter: ["/stitch-assets/monsters/battle/deep-lynx-tank-cutout.webp?v=raid1"],
    support: ["/stitch-assets/monsters/battle/deep-lynx-support-cutout.webp?v=raid1"],
    pitboss: ["/stitch-assets/monsters/battle/talass-pitboss-cutout.webp?v=raid1"],
  },
  kitsune_ash: {
    tank: ["/stitch-assets/monsters/battle/kitsune-fighter-cutout.webp?v=raid1"],
    fighter: ["/stitch-assets/monsters/battle/kitsune-fighter-cutout.webp?v=raid1"],
    support: ["/stitch-assets/monsters/battle/kitsune-support-cutout.webp?v=raid1"],
    pitboss: ["/stitch-assets/monsters/battle/vulcan-pitboss-cutout.webp?v=raid1"],
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
  if (
    s.includes("bot_solar") ||
    s.includes("pitboss_myaurra") ||
    s.includes("pitboss_solar") ||
    s.includes("myaurra")
  ) {
    return "solar_lions";
  }
  if (
    s.includes("bot_lynx") ||
    s.includes("pitboss_talass") ||
    s.includes("pitboss_lynx") ||
    s.includes("talass")
  ) {
    return "deep_lynxes";
  }
  if (
    s.includes("bot_kitsune") ||
    s.includes("pitboss_vulcan") ||
    s.includes("pitboss_kitsune") ||
    s.includes("vulcan")
  ) {
    return "kitsune_ash";
  }
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
  solar_lions: "лев",
  deep_lynxes: "рысь",
  kitsune_ash: "кицунэ",
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

/** Coop-dungeon boss cutout aliases (unique stage ids → named files). */
const DUNGEON_BOSS_BATTLE_ART = {
  dungeon_scarlet: ["/stitch-assets/monsters/battle/dungeon-scarlet-boss-cutout-faceleft.webp?v=dung1"],
  dungeon_howl: ["/stitch-assets/monsters/battle/dungeon-howl-boss-cutout-faceleft.webp?v=dung1"],
  dungeon_whisper: [
    "/stitch-assets/monsters/battle/dungeon-whisper-boss-cutout-faceleft.webp?v=dung1",
    "/stitch-assets/monsters/battle/dungeon-whisper-echo-boss-cutout-faceleft.webp?v=dung1",
  ],
};

function dungeonBossArtPool(tid) {
  const s = String(tid || "");
  if (s.includes("dungeon_scarlet")) return DUNGEON_BOSS_BATTLE_ART.dungeon_scarlet;
  if (s.includes("dungeon_howl")) return DUNGEON_BOSS_BATTLE_ART.dungeon_howl;
  if (s.includes("dungeon_whisper")) return DUNGEON_BOSS_BATTLE_ART.dungeon_whisper;
  return null;
}

function monsterBattleArt(unit) {
  const role = String(unit?.role || "").toLowerCase();
  const tid = unitTemplateId(unit);
  const dungeonPool = dungeonBossArtPool(tid);
  if (dungeonPool?.length) return hashPickArt(tid || unit?.id || role, dungeonPool);
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
 * Sprite facing (D-047 · supersedes board part of D-040 / MF-170):
 * Live board: LEFT column → face RIGHT; RIGHT column → face LEFT (toward center).
 * Non-board forms: cats → right; dummies/monsters → left (type default).
 * Flip via `.mf-sprite-face.is-flipped` only when native art ≠ desired.
 * New assets: add slug to *_NATIVE_FACE_LEFT only if the file is authored facing left.
 */
/** Authored-left cat battle/portrait slugs. Default native = RIGHT. */
const CAT_NATIVE_FACE_LEFT = new Set([
  "tank-a", // shield on viewer's left → looks left
  "fighter-b", // tiger plate, three-quarter left
]);
const DUMMY_NATIVE_FACE_LEFT = new Set([
  "dummy-oak-knight",
  "dummy-stone-totem",
]);
/**
 * Authored-left monster cutouts. Default native = RIGHT → flip for board-right (face left).
 * 2026-11-22: roster faces left toward cats. Native-left originals + *-faceleft rebakes
 * (flopped right-authored files) — all listed so CSS does not flip them away from center.
 */
const MONSTER_NATIVE_FACE_LEFT = new Set([
  // Originals already facing left
  "assassin-b",
  "fighter-a",
  "fighter-f",
  "ranger-b",
  "support-a",
  "wolf-support-cutout",
  "wolf-pitboss-cutout",
  "redd-fighter-cutout",
  "redd-tank-cutout",
  "redd-support-cutout",
  "redd-pitboss-cutout",
  "zombie-pitboss-cutout",
  "dungeon-scarlet-boss-cutout",
  "dungeon-scarlet-boss-cutout-faceleft",
  "dungeon-howl-boss-cutout",
  "dungeon-howl-boss-cutout-faceleft",
  "dungeon-whisper-boss-cutout",
  "dungeon-whisper-boss-cutout-faceleft",
  "dungeon-whisper-echo-boss-cutout-faceleft",
  // Raid cutouts (authored left / three-quarter left · 2026-11-22)
  "myaurra-pitboss-cutout",
  "talass-pitboss-cutout",
  "vulcan-pitboss-cutout",
  "solar-lion-tank-cutout",
  "solar-lion-fighter-cutout",
  "deep-lynx-tank-cutout",
  "deep-lynx-support-cutout",
  "kitsune-fighter-cutout",
  "kitsune-support-cutout",
  // Flopped rebakes (*-faceleft.webp)
  "tank-b-faceleft",
  "tank-d-faceleft",
  "fighter-h-faceleft",
  "ranger-a-faceleft",
  "wolf-fighter-cutout-faceleft",
  "wolf-tank-cutout-faceleft",
  "assassin-a-faceleft",
  "zombie-fighter-cutout-faceleft",
  "zombie-tank-cutout-faceleft",
  "zombie-support-cutout-faceleft",
  "ghost-tank-cutout-faceleft",
  "ghost-fighter-cutout-faceleft",
  "ghost-support-cutout-faceleft",
  "ghost-pitboss-cutout-faceleft",
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

/**
 * Desired face for a unit.
 * @param {object|string} unitOrKind unit | 'ally'|'foe'|'board-left'|'board-right'
 * @returns {'left'|'right'}
 */
function desiredSpriteFace(unitOrKind) {
  if (unitOrKind === "board-right" || unitOrKind === "enemy" || unitOrKind === "foe") return "left";
  if (unitOrKind === "board-left" || unitOrKind === "ally" || unitOrKind === "hero") return "right";
  // Live unit: side 0 = left column (face right), side 1 = right column (face left).
  if (unitOrKind && typeof unitOrKind === "object" && (unitOrKind.side === 0 || unitOrKind.side === 1)) {
    return unitOrKind.side === 0 ? "right" : "left";
  }
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
const HOME_SET_RU = HOME_SET_RU_SEED;

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
  const lane = state.equipLane || "pve";
  const pieces = (state.gearCatalog || []).filter(
    (g) =>
      g.set === setId &&
      gearLaneOf(g) === lane &&
      ["helm", "armor", "cloak", "belt", "boots"].includes(g.slot),
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
  const map = equipMapForLane();
  if (!map[catId]) map[catId] = emptyEquipSlots();
  for (const slot of HOME_SLOT_ORDER) {
    const candidates = state.gearCatalog
      .filter((item) => item.slot === slot && canEquipItem(catId, item))
      .sort((a, b) => b.atk + b.hp + b.def + b.spd - (a.atk + a.hp + a.def + a.spd));
    const prev = map[catId][slot];
    map[catId][slot] = null;
    const best = candidates.find((item) => gearAvailableQty(item) > 0);
    map[catId][slot] = best ? best.id : prev;
  }
  syncEquippedAlias();
  toast("Лучшее надето (с учётом класса · стеки)");
  persistGearStub();
  renderAll();
}

/** Dress full color armor set (helm/armor/cloak/belt/boots). Weapons stay class-gated separately. */
function equipArmorSet(catId, setId) {
  if (!catId || !setId) return false;
  const map = equipMapForLane();
  if (!map[catId]) map[catId] = emptyEquipSlots();
  const armorSlots = ["helm", "armor", "cloak", "belt", "boots"];
  let worn = 0;
  for (const slot of armorSlots) {
    const piece = state.gearCatalog.find(
      (g) => g.set === setId && g.slot === slot && canEquipItem(catId, g),
    );
    if (!piece) continue;
    const prev = map[catId][slot];
    map[catId][slot] = null;
    if (gearAvailableQty(piece) <= 0) {
      map[catId][slot] = prev;
      continue;
    }
    map[catId][slot] = piece.id;
    worn += 1;
  }
  syncEquippedAlias();
  const meta = HOME_SET_RU[setId];
  const label = meta?.name || setId;
  const tot = armorSetTotals(setId);
  const armorLine = meta?.armor || `+${tot.def} DEF · +${tot.hp} HP`;
  toast(worn ? `${label}: ${worn}/5 · ${armorLine}` : `${label}: нет свободных частей`);
  persistGearStub();
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

const BARN_SOON_KINDS = new Set(["blueprint"]);
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
  tool: "Инструмент",
  potion: "Зелье",
  blueprint: "Чертёж",
};

function gearBarnKind(g) {
  return g.slot === "weapon" || g.slot === "shield" ? "weapon" : "armor";
}

function ensureBarnMats() {
  if (!Array.isArray(state.barnMats) || !state.barnMats.length) {
    state.barnMats = JSON.parse(JSON.stringify(BARN_MATS_SEED));
  } else {
    mergeBarnMatsSeed();
  }
}

function barnMatGet(id) {
  ensureBarnMats();
  return (state.barnMats || []).find((m) => m.id === id) || null;
}

function barnMatQty(id) {
  return barnMatGet(id)?.qty || 0;
}

function barnMatAdd(id, qty = 1) {
  ensureBarnMats();
  const n = Math.max(0, Number(qty) || 0);
  if (!n) return barnMatGet(id);
  let mat = barnMatGet(id);
  if (!mat) {
    const seed = BARN_MATS_SEED.find((m) => m.id === id);
    if (!seed) return null;
    mat = JSON.parse(JSON.stringify(seed));
    mat.qty = 0;
    state.barnMats.push(mat);
  }
  mat.qty = (mat.qty || 0) + n;
  persistGearStub();
  return mat;
}

function barnMatSpend(id, qty = 1) {
  const mat = barnMatGet(id);
  const n = Math.max(0, Number(qty) || 0);
  if (!mat || (mat.qty || 0) < n) return false;
  mat.qty -= n;
  persistGearStub();
  return true;
}

/** Rebuild barn rows from gearCatalog + barnMats (D-028 / MF-153 smoke). */
function syncBarnFromGear() {
  ensureBarnMats();
  const gearRows = (state.gearCatalog || [])
    .filter((g) => gearAvailableQty(g, gearLaneOf(g)) > 0 || gearWornCount(g.id, gearLaneOf(g)) > 0)
    .map((g) => {
      const avail = gearAvailableQty(g, gearLaneOf(g));
      return {
        id: g.id,
        name: g.name,
        kind: gearBarnKind(g),
        rarity: g.rarity,
        tag: `${g.set || "class"} · ${g.slot} · ${gearLaneOf(g)}`,
        enhance: g.enhance || 0,
        qty: avail,
        owned: gearOwnedQty(g),
        gearId: g.id,
        iconSrc: g.iconSrc,
      };
    });
  const matRows = (state.barnMats || [])
    .filter((m) => (m.qty || 0) > 0 || m.kind === "tool")
    .map((m) => ({
      id: `mat_${m.id}`,
      matId: m.id,
      name: m.name,
      kind: m.kind === "tool" ? "farm" : m.kind,
      matKind: m.kind,
      rarity: m.rarity || "common",
      tag: m.tag || m.kind,
      desc: m.desc || "",
      enhance: 0,
      qty: m.qty || 0,
      iconSrc: m.iconSrc,
    }));
  state.barnCatalog = [...gearRows, ...matRows];
}

function barnStockUsed() {
  ensureBarnMats();
  const gearN = (state.gearCatalog || []).length;
  const matN = (state.barnMats || []).filter((m) => (m.qty || 0) > 0 || m.kind === "tool").length;
  return gearN + matN;
}

function barnFilteredItems() {
  syncBarnFromGear();
  const q = (state.barnSearch || "").trim().toLowerCase();
  const cat = state.barnCatFilter || "all";
  if (BARN_SOON_KINDS.has(cat)) return [];
  return (state.barnCatalog || []).filter((item) => {
    if (cat === "equip") {
      if (item.kind !== "armor" && item.kind !== "weapon") return false;
    } else if (cat === "farm") {
      if (item.kind !== "farm" && item.matKind !== "tool") return false;
    } else if (cat !== "all" && item.kind !== cat) {
      return false;
    }
    if (state.barnRarityFilter && state.barnRarityFilter !== "all" && item.rarity !== state.barnRarityFilter) {
      return false;
    }
    if (q && !`${item.name} ${item.tag} ${item.desc || ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function barnKindCount(kind) {
  syncBarnFromGear();
  if (BARN_SOON_KINDS.has(kind)) return 0;
  return (state.barnCatalog || []).filter((item) => {
    if (kind === "all") return true;
    if (kind === "equip") return item.kind === "armor" || item.kind === "weapon";
    if (kind === "farm") return item.kind === "farm" || item.matKind === "tool";
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
  const maps = [state.equippedPveByCat, state.equippedPvpByCat, state.equippedByCat];
  return maps.some((map) =>
    Object.values(map || {}).some((eq) => Object.values(eq || {}).includes(gearId)),
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
  const gear = barnGearForItem(item);
  const avail = item.matId ? item.qty || 0 : gear ? gearAvailableQty(gear, gearLaneOf(gear)) : item.qty || 0;
  const wornN = gear ? gearWornCount(gear.id, gearLaneOf(gear)) : 0;
  const fullyWorn = gear && avail <= 0 && wornN > 0;
  const border = barnRarityBorder(item.rarity);
  const qtyBadge = avail > 1 || (gear && gearOwnedQty(gear) > 1) ? `×${avail}` : "";
  const enhanceBadge = !qtyBadge && item.enhance > 0 ? `+${item.enhance}` : "";
  const badge = qtyBadge || enhanceBadge;
  return `<button type="button" data-barn-item="${item.id}" class="rounded-xl bg-surface-container-lowest p-1 border ${border} ${on ? "ring-2 ring-primary" : "hover:border-primary/40"}${fullyWorn ? " opacity-50" : ""}" title="${item.name}${wornN ? ` · надето ${wornN}` : ""}${avail ? ` · склад ×${avail}` : ""}">
    <img alt="" src="${item.iconSrc}"/>
    ${badge ? `<span class="barn-cell-badge absolute top-0.5 right-0.5 px-1 rounded bg-surface-container-lowest/90 font-stat-numeral text-[9px] text-primary font-bold">${badge}</span>` : ""}
    ${wornN && !fullyWorn ? `<span class="barn-cell-worn px-1 rounded bg-primary/90 text-on-primary font-label-sm text-[8px]">${wornN} on</span>` : ""}
    ${fullyWorn ? `<span class="barn-cell-worn px-1 rounded bg-primary/90 text-on-primary font-label-sm text-[8px]">on</span>` : ""}
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
        showGateTip("Чертежи — Phase 6 (Soon). Сырьё и зелья уже на складе (smoke).");
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
        if (focus?.matId) {
          toast("Сырьё / зелья нельзя переплавить");
          return;
        }
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
  const isMat = !!focus.matId;
  const gear = isMat ? null : barnGearForItem(focus);
  const bonuses = isMat ? "—" : formatGearBonuses(gear) || "—";
  const rarity = BARN_RARITY_RU[focus?.rarity] || "—";
  const kind = BARN_KIND_RU[focus?.matKind || focus?.kind] || focus?.kind || "—";
  const enhance = focus?.enhance ? `+${focus.enhance}` : isMat ? `×${focus?.qty || 0}` : "—";
  const canEquip = !!(gear && (focus?.kind === "armor" || focus?.kind === "weapon"));
  const cat = homeActiveCat();
  const catName = cat ? catSheetName(cat) : "—";
  const worn = barnItemWorn(gear?.id);
  const detail = isMat
    ? `<div class="text-[11px] text-on-surface-variant">${focus.desc || "Сырьё двора / крафт (HUD smoke)"}</div>
        <div class="text-[11px] text-on-surface-variant">На складе: <span class="text-primary font-bold">×${formatSheetNum(focus.qty || 0)}</span></div>`
    : `<div class="text-[11px] text-on-surface-variant">${gear ? `Слот: ${HOME_SLOT_RU[gear.slot] || gear.slot}${gear.roles?.length ? ` · ${gear.roles.map((r) => CAT_ROLE_RU[r] || r).join("/")}` : " · все классы"}` : "Не экипируется"}</div>
        <div class="text-[11px] text-on-surface-variant">Герой: <span class="text-primary font-bold">${catName}</span></div>`;
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
          <span class="text-on-surface-variant">${isMat ? "Назначение" : "Бонусы экипа"}</span>
          <span class="font-stat-numeral text-primary text-[14px]">${isMat ? kind : bonuses}</span>
        </div>
        ${detail}
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
    const farmN = barnKindCount("farm");
    const potionN = barnKindCount("potion");
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
          <span class="font-stat-numeral text-on-surface text-[11px]">${formatSheetNum(farmN)}</span>
        </div>
        <div class="bg-surface-container px-2 py-0.5 rounded flex items-center justify-between">
          <span class="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-tertiary-container text-[12px]">science</span> Зелья</span>
          <span class="font-stat-numeral text-on-surface text-[11px]">${formatSheetNum(potionN)}</span>
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
      { id: "farm", label: "Сырьё и инструменты", icon: "forest" },
      { id: "potion", label: "Зелья", icon: "sanitizer" },
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
      pool.find((c) => c.templateId === "shop_fighter_fire") ||
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
  const lane = state.equipLane || "pve";
  const items = state.gearCatalog.filter((item) => {
    if (gearLaneOf(item) !== lane) return false;
    // Stacked: hide only when zero free copies remain.
    if (gearAvailableQty(item, lane) <= 0) return false;
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
      const avail = gearAvailableQty(item, lane);
      const roleHint = item.roles?.length
        ? item.roles.map((r) => CAT_ROLE_RU[r] || r).join("/")
        : "";
      const qtyBadge =
        avail > 1
          ? `<span class="absolute top-0.5 right-0.5 min-w-[14px] px-0.5 rounded ${tone.pill} font-stat-numeral text-[9px] leading-none font-bold text-center">${avail}</span>`
          : item.enhance
            ? `<span class="absolute top-0.5 right-0.5 px-0.5 rounded ${tone.pill} font-stat-numeral text-[8px] leading-none font-bold">+${item.enhance}</span>`
            : "";
      const lock = locked
        ? `<span class="absolute inset-0 rounded bg-black/45 flex items-center justify-center text-[9px] font-label-sm text-on-surface uppercase tracking-wide">${roleHint || "класс"}</span>`
        : "";
      const bonuses = formatGearBonuses(item);
      return `<div data-home-bag-item="${item.id}" role="button" tabindex="0" title="${item.name}${bonuses ? ` · ${bonuses}` : ""} · ×${avail}${roleHint ? ` · ${roleHint}` : " · все классы"}${locked ? " · недоступно" : ""}" class="aspect-square rounded-lg bg-surface-container-high p-0.5 relative cursor-pointer border ${tone.border} ${tone.glow} hover:scale-105 transition-transform flex items-center justify-center group${locked ? " is-locked" : ""}"><img alt="${item.name}" class="w-full h-full object-cover rounded" src="${item.iconSrc}"><span class="absolute bottom-0.5 left-0.5 px-0.5 rounded bg-surface-container-lowest font-label-sm text-[7px] ${tone.tag} uppercase">${tone.label}</span>${qtyBadge}${lock}</div>`;
    })
    .join("");
  const label = [...(grid.closest(".col-span-3")?.querySelectorAll("span") || [])].find((el) =>
    /Склад:/i.test(el.textContent || ""),
  );
  if (label) {
    const used = barnStockUsed();
    const cap = state.barnCapMax || 256;
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
  if (title) {
    title.textContent = `ЭКИПИРОВКА ГЕРОЯ: ${name.toUpperCase()}`;
    let laneBar = $("homeEquipLaneBar");
    if (!laneBar && title.parentElement) {
      laneBar = document.createElement("div");
      laneBar.id = "homeEquipLaneBar";
      laneBar.className = "flex gap-2 mt-2";
      title.parentElement.insertBefore(laneBar, title.nextSibling);
    }
    if (laneBar) {
      const lane = state.equipLane || "pve";
      laneBar.innerHTML = `
        <button type="button" data-equip-lane="pve" class="mission-fight ${lane === "pve" ? "is-active" : ""}" style="padding:0.35rem 0.7rem">PvE · данжи/рейды</button>
        <button type="button" data-equip-lane="pvp" class="mission-fight ${lane === "pvp" ? "is-active" : ""}" style="padding:0.35rem 0.7rem">PvP · магазин</button>
        <span class="meta" style="align-self:center;font-size:11px;opacity:.75">HP врагов фиксировано · выше броня/оружие = проще</span>`;
      laneBar.querySelectorAll("[data-equip-lane]").forEach((btn) => {
        btn.addEventListener("click", () => setEquipLane(btn.getAttribute("data-equip-lane")));
      });
    }
  }
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

function farmEnsureZone(zoneId) {
  if (!state.farmState[zoneId]) {
    state.farmState[zoneId] = { farmer: null, planted: false, ready: false, crop: null };
  }
  return state.farmState[zoneId];
}

function farmHiredCount() {
  return FARM_ZONES.filter((z) => state.farmState[z.id]?.farmer).length;
}

function farmReadyZones(zoneIds = null) {
  const ids = zoneIds || FARM_ZONES.map((z) => z.id);
  return ids
    .map((id) => FARM_ZONES.find((z) => z.id === id))
    .filter((z) => z && state.farmState[z.id]?.ready);
}

function farmHarvestQtyFor(matId) {
  return FARM_HARVEST_QTY[matId] || 1;
}

function farmZoneToolId(zoneId) {
  return Object.prototype.hasOwnProperty.call(FARM_ZONE_TOOL, zoneId) ? FARM_ZONE_TOOL[zoneId] : "tool_shovel";
}

function ensureToolDurability(mat) {
  if (!mat || (mat.kind !== "tool" && !String(mat.id || "").startsWith("tool_"))) return mat;
  const max = mat.durabilityMax || TOOL_DURABILITY_MAX;
  mat.durabilityMax = max;
  if (typeof mat.durability !== "number" || mat.durability < 0) mat.durability = max;
  return mat;
}

function farmToolWorking(toolId) {
  if (!toolId) return true;
  const mat = barnMatGet(toolId);
  if (!mat || (mat.qty || 0) <= 0) return false;
  ensureToolDurability(mat);
  return (mat.durability || 0) > 0;
}

function farmToolDisplayName(toolId, mat = null) {
  const seed = BARN_MATS_SEED.find((m) => m.id === toolId);
  const stock = MARKET_STOCK.find((s) => s.matId === toolId || s.id === toolId);
  return seed?.name || stock?.name || mat?.name || toolId;
}

function farmRequireTool(zoneId, { silent = false } = {}) {
  const toolId = farmZoneToolId(zoneId);
  if (!toolId) return { ok: true, toolId: null };
  const mat = barnMatGet(toolId);
  const name = farmToolDisplayName(toolId, mat);
  if (!mat || (mat.qty || 0) <= 0) {
    if (!silent) toast(`Нужна «${name}» на складе — купи на Рынке и выдай фермеру`);
    return { ok: false, toolId, name };
  }
  ensureToolDurability(mat);
  if ((mat.durability || 0) <= 0) {
    if (!silent) {
      toast(`«${name}» сломана (износ 0/${mat.durabilityMax || TOOL_DURABILITY_MAX}) — почини или купи новую`);
    }
    return { ok: false, toolId, name, broken: true };
  }
  return { ok: true, toolId, name, mat };
}

function farmWearTool(toolId) {
  if (!toolId) return { worn: false };
  const mat = barnMatGet(toolId);
  if (!mat || (mat.qty || 0) <= 0) return { worn: false };
  ensureToolDurability(mat);
  mat.durability = Math.max(0, (mat.durability || 0) - 1);
  let broke = false;
  if (mat.durability <= 0) {
    mat.qty = Math.max(0, (mat.qty || 1) - 1);
    broke = true;
    if (mat.qty > 0) mat.durability = mat.durabilityMax || TOOL_DURABILITY_MAX;
    else mat.durability = 0;
  }
  persistGearStub();
  return {
    worn: true,
    broke,
    left: mat.durability,
    max: mat.durabilityMax || TOOL_DURABILITY_MAX,
    name: mat.name,
  };
}

function hireFarmer(zoneId) {
  const z = FARM_ZONES.find((x) => x.id === zoneId);
  if (!z) return false;
  const fs = farmEnsureZone(zoneId);
  if (fs.farmer) {
    toast("Фермер уже на зоне");
    return false;
  }
  const cost = 25;
  if ((state.wallet.gold || 0) < cost) {
    toast("Недостаточно рыбок (нужно 25)");
    return false;
  }
  const farmCats = farmCatCandidates();
  const cat = farmCats[0] || (state.profile?.cats || [])[0];
  if (!cat) {
    toast("Нет кота для найма");
    return false;
  }
  const toolCheck = farmRequireTool(zoneId, { silent: true });
  if (!toolCheck.ok) {
    toast(`Без «${toolCheck.name}» фермер на «${z.label}» работать не будет — купи на Рынке`);
  }
  state.wallet.gold -= cost;
  fs.farmer = cat.catId;
  toast(`Фермер нанят на «${z.label}» (−${cost} 🐟)`);
  renderCurrency();
  renderFarm();
  return true;
}

function fireFarmer(zoneId) {
  const z = FARM_ZONES.find((x) => x.id === zoneId);
  if (!z) return false;
  const fs = state.farmState[zoneId];
  if (!fs?.farmer) {
    toast("На зоне нет фермера");
    return false;
  }
  fs.farmer = null;
  fs.planted = false;
  fs.ready = false;
  fs.crop = null;
  toast(`Фермер снят с «${z.label}»`);
  renderFarm();
  return true;
}

function fireAnyFarmer() {
  const occupied = [...FARM_ZONES].reverse().find((z) => state.farmState[z.id]?.farmer);
  if (!occupied) {
    toast("Нет фермеров на постах");
    return false;
  }
  return fireFarmer(occupied.id);
}

function farmZoneNeedsSeeds(z) {
  return z?.kind === "crop";
}

function farmZoneNeedsBait(z) {
  return z?.kind === "water" || z?.id === "fishing";
}

function plantZone(zoneId) {
  const z = FARM_ZONES.find((x) => x.id === zoneId);
  const fs = farmEnsureZone(zoneId);
  if (!z || !fs) return false;
  if (!fs.farmer) {
    toast("Сначала найми фермера на зону");
    return false;
  }
  if (fs.planted && !fs.ready) {
    toast("Уже посажено — жди / собери");
    return false;
  }
  if (fs.ready) {
    toast("Урожай готов — сначала собери");
    return false;
  }
  const tool = farmRequireTool(zoneId);
  if (!tool.ok) return false;
  if (farmZoneNeedsSeeds(z)) {
    if (!barnMatSpend("seeds", 1)) {
      toast("Нужны семена на складе (купи на Рынке)");
      return false;
    }
  } else if (farmZoneNeedsBait(z)) {
    if (!barnMatSpend("bait", 1)) {
      toast("Нужна наживка на складе (Рынок)");
      return false;
    }
  }
  fs.planted = true;
  fs.ready = true;
  fs.crop = FARM_ZONE_LOOT[z.id] || "veggies";
  const costHint = farmZoneNeedsSeeds(z)
    ? "−1 семена"
    : farmZoneNeedsBait(z)
      ? "−1 наживка"
      : "сбор";
  const toolHint =
    tool.name && tool.mat
      ? ` · ${tool.name} ${tool.mat.durability}/${tool.mat.durabilityMax || TOOL_DURABILITY_MAX}`
      : "";
  toast(`Посажено на «${z.label}» (${costHint}) · готово к сбору${toolHint}`);
  renderFarm();
  if (!$("viewGear")?.classList.contains("hidden")) renderBarn();
  return true;
}

function pushFarmLootToBarn(zoneId, cropId) {
  const z = FARM_ZONES.find((x) => x.id === zoneId);
  const matId = cropId || FARM_ZONE_LOOT[zoneId] || "veggies";
  const qty = farmHarvestQtyFor(matId);
  const mat = barnMatAdd(matId, qty);
  const unitBid = z?.id === "fishing" ? 18 : 12;
  const loot = {
    id: `farm_${zoneId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: mat?.name || matId,
    matId,
    kind: z?.id === "fishing" ? "fish" : "crop",
    bid: unitBid * qty,
    qty,
  };
  state.farmBag.push(loot);
  return { mat, qty, matId };
}

function harvestZone(zoneId, { quiet = false } = {}) {
  const z = FARM_ZONES.find((x) => x.id === zoneId);
  const fs = state.farmState[zoneId];
  if (!z || !fs?.ready) {
    if (!quiet) toast("Нечего собирать");
    return null;
  }
  const tool = farmRequireTool(zoneId);
  if (!tool.ok) return null;
  const { mat, qty } = pushFarmLootToBarn(zoneId, fs.crop);
  const wear = farmWearTool(tool.toolId);
  fs.planted = false;
  fs.ready = false;
  if (!quiet) {
    const wearHint = wear.broke
      ? ` · ${wear.name} сломалась!`
      : wear.worn
        ? ` · ${wear.name} ${wear.left}/${wear.max}`
        : "";
    toast(`Собрано: ${mat?.name || fs.crop} ×${qty} → склад${wearHint}`);
  }
  renderFarm();
  if (!$("viewGear")?.classList.contains("hidden")) renderBarn();
  return { mat, qty };
}

function harvestZonesList(zoneIds, { label = null } = {}) {
  const ready = farmReadyZones(zoneIds);
  if (!ready.length) {
    toast("Нечего собирать");
    return 0;
  }
  let totalUnits = 0;
  let harvested = 0;
  for (const z of ready) {
    const tool = farmRequireTool(z.id, { silent: harvested > 0 });
    if (!tool.ok) {
      if (harvested === 0) return 0;
      break;
    }
    const fs = state.farmState[z.id];
    const { qty } = pushFarmLootToBarn(z.id, fs.crop);
    farmWearTool(tool.toolId);
    fs.planted = false;
    fs.ready = false;
    totalUnits += qty;
    harvested += 1;
  }
  if (!harvested) return 0;
  toast(
    label
      ? `${label}: ${harvested} зон · ${totalUnits} ед. → склад`
      : `Собрано с ${harvested} зон · ${totalUnits} ед. → склад`,
  );
  renderFarm();
  if (!$("viewGear")?.classList.contains("hidden")) renderBarn();
  return harvested;
}

function harvestAllReadyZones() {
  const ready = farmReadyZones();
  if (!ready.length) {
    toast("Нет готовых зон — посади урожай");
    return 0;
  }
  return harvestZonesList(
    ready.map((z) => z.id),
    { label: "Сбор со всех узлов" },
  );
}

function interactFarmPin(zoneIds) {
  const ids = zoneIds || [];
  if (!ids.length) return;
  const ready = farmReadyZones(ids);
  if (ready.length) {
    if (ids.length === 1) harvestZone(ids[0]);
    else harvestZonesList(ids);
    return;
  }
  const plantable = ids.find((id) => state.farmState[id]?.farmer && !state.farmState[id]?.ready);
  if (plantable) {
    plantZone(plantable);
    return;
  }
  const empty = ids.find((id) => !state.farmState[id]?.farmer);
  if (empty) {
    hireFarmer(empty);
    return;
  }
  toast("Зоны заняты — собери урожай или сними фермера");
}

function distributeYardWorkers() {
  const empty = FARM_ZONES.filter((z) => !state.farmState[z.id]?.farmer);
  if (!empty.length) {
    toast("Авто-распределение · все посты заняты");
    return;
  }
  hireFarmer(empty[0].id);
  toast(
    `Авто-распределение · слот «${empty[0].label}»${empty.length > 1 ? ` · ещё пусто: ${empty.length - 1}` : ""}`,
  );
}

function repairYardConsumables() {
  const tools = FARM_TOOL_IDS.map((id) => barnMatGet(id)).filter((m) => m && (m.qty || 0) > 0);
  if (!tools.length) {
    toast("Нет инструментов на складе — купи на Рынке");
    return;
  }
  const needRepair = tools.filter((m) => {
    ensureToolDurability(m);
    return (m.durability || 0) < (m.durabilityMax || TOOL_DURABILITY_MAX);
  });
  if (!needRepair.length) {
    toast("Все инструменты целы");
    return;
  }
  if (barnMatQty("iron") < 1 || barnMatQty("wood") < 1) {
    toast(
      `Для ремонта нужно железо×1 + дерево×1 (износ: ${needRepair
        .map((m) => `${m.name} ${m.durability}/${m.durabilityMax}`)
        .join(", ")})`,
    );
    return;
  }
  barnMatSpend("iron", 1);
  barnMatSpend("wood", 1);
  for (const m of needRepair) {
    m.durability = m.durabilityMax || TOOL_DURABILITY_MAX;
  }
  persistGearStub();
  toast(`Починка: ${needRepair.map((m) => m.name).join(", ")} (−1 железо, −1 дерево)`);
  if (!$("viewGear")?.classList.contains("hidden")) renderBarn();
  renderFarm();
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
        case "fire":
          fireAnyFarmer();
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

function bindFarmMapPins() {
  const root = $("viewSoonFarm");
  if (!root || root.dataset.farmPinsBound === "1") return;
  root.dataset.farmPinsBound = "1";

  const pins = [...root.querySelectorAll(".group.cursor-pointer")];
  for (const pin of pins) {
    const text = pin.textContent || "";
    if (/СКОРО|Коровник/i.test(text) && /lock|cottage/i.test(pin.innerHTML || "")) {
      pin.dataset.farmSoon = "1";
      continue;
    }
    const hit = FARM_MAP_PIN_MATCHERS.find((m) => m.re.test(text));
    if (!hit) continue;
    pin.dataset.farmZones = hit.zoneIds.join(",");
    pin.dataset.farmFilter = hit.filter || "all";
    for (const btn of pin.querySelectorAll("button")) {
      const bt = btn.textContent || "";
      if (/Собрать/i.test(bt)) {
        btn.dataset.farmCollect = "1";
        btn.dataset.farmZones = hit.zoneIds.join(",");
      } else if (/Войти в цех/i.test(bt)) {
        btn.dataset.farmCraft = "1";
      }
    }
  }

  root.addEventListener(
    "click",
    (ev) => {
      const soon = ev.target.closest?.("[data-farm-soon]");
      if (soon) {
        ev.preventDefault();
        toast("Коровник · Скоро");
        return;
      }
      const craftBtn = ev.target.closest?.("[data-farm-craft]");
      if (craftBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        navigate("craft");
        return;
      }
      const collectBtn = ev.target.closest?.("[data-farm-collect]");
      if (collectBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        const ids = (collectBtn.dataset.farmZones || "").split(",").filter(Boolean);
        if (ids.length === 1) harvestZone(ids[0]);
        else harvestZonesList(ids);
        return;
      }
      const pin = ev.target.closest?.("[data-farm-zones]");
      if (pin && root.contains(pin)) {
        ev.preventDefault();
        const ids = (pin.dataset.farmZones || "").split(",").filter(Boolean);
        interactFarmPin(ids);
      }
    },
    true,
  );

  const filterHost =
    [...root.querySelectorAll("button")].find((b) => /Все секторы/i.test(b.textContent || ""))?.parentElement ||
    null;
  if (filterHost && filterHost.dataset.farmFilterBound !== "1") {
    filterHost.dataset.farmFilterBound = "1";
    filterHost.addEventListener("click", (ev) => {
      const btn = ev.target.closest?.("button");
      if (!btn || !filterHost.contains(btn)) return;
      ev.preventDefault();
      const label = btn.textContent || "";
      let filter = "all";
      if (/Лес и Шахты/i.test(label)) filter = "mines";
      else if (/Сады/i.test(label)) filter = "crops";
      else if (/Рыбалка/i.test(label)) filter = "fish";
      else if (/Мастерские/i.test(label)) filter = "craft";
      else if (/Коровник/i.test(label)) {
        toast("Коровник · Скоро");
        return;
      }
      for (const b of filterHost.querySelectorAll("button")) {
        const active = b === btn;
        if (/Коровник/i.test(b.textContent || "")) continue;
        b.classList.toggle("bg-primary", active);
        b.classList.toggle("text-on-primary", active);
        b.classList.toggle("font-bold", active);
        b.classList.toggle("shadow-sm", active);
        b.classList.toggle("bg-surface-container-high", !active);
        b.classList.toggle("text-on-surface-variant", !active);
      }
      for (const pin of root.querySelectorAll("[data-farm-zones], [data-farm-soon]")) {
        const pinFilter = pin.dataset.farmFilter || (pin.dataset.farmSoon ? "soon" : "all");
        const show = filter === "all" || pinFilter === filter;
        pin.style.display = show ? "" : "none";
      }
    });
  }
}

function syncFarmHud() {
  const root = $("viewSoonFarm");
  if (!root) return;
  const wood = barnMatQty("wood");
  const stone = barnMatQty("stone");
  const iron = barnMatQty("iron");
  const fish = barnMatQty("fish");
  const crops = barnMatQty("veggies") + barnMatQty("herbs") + barnMatQty("fruit");
  const hired = farmHiredCount();
  const readyN = farmReadyZones().length;
  const readyUnits = farmReadyZones().reduce((sum, z) => {
    const matId = state.farmState[z.id]?.crop || FARM_ZONE_LOOT[z.id] || "veggies";
    return sum + farmHarvestQtyFor(matId);
  }, 0);

  const fmt = (n) => Number(n || 0).toLocaleString("ru-RU");
  const pct = (n, cap) => Math.max(0, Math.min(100, Math.round(((n || 0) / cap) * 100)));

  const patchBadge = (re, text) => {
    for (const el of root.querySelectorAll(".font-bold")) {
      if (re.test(el.textContent || "") && (el.textContent || "").length < 48) {
        el.textContent = text;
      }
    }
  };
  patchBadge(/\/\s*1k\s*руды/i, `${fmt(iron)} / 1k руды`);
  patchBadge(/\/\s*1\.5k/i, `${fmt(stone)} / 1.5k`);
  patchBadge(/\/\s*2\.5k/i, `${fmt(wood)} / 2.5k`);
  patchBadge(/рыбки/i, `${fmt(fish)} рыбки 🐟`);

  const strip = root.querySelector(".farm-thin-strip");
  if (strip) {
    const map = [
      [/Травы/i, `Травы ${pct(crops, FARM_STOCK_CAPS.cropBundle)}%`],
      [/Дерево/i, `Дерево ${pct(wood, FARM_STOCK_CAPS.wood)}%`],
      [/Камень/i, `Камень ${pct(stone, FARM_STOCK_CAPS.stone)}%`],
      [/Руда/i, `Руда ${pct(iron, FARM_STOCK_CAPS.iron)}%`],
      [/Рыба/i, `Рыба ${pct(fish, FARM_STOCK_CAPS.fish)}%`],
    ];
    for (const span of strip.querySelectorAll("span.inline-flex")) {
      for (const [re, label] of map) {
        if (!re.test(span.textContent || "")) continue;
        const icon = span.querySelector(".material-symbols-outlined");
        span.textContent = "";
        if (icon) span.appendChild(icon);
        span.appendChild(document.createTextNode(` ${label}`));
        break;
      }
    }
  }

  const topCollect = $("btn-collect-all");
  if (topCollect) {
    const label = topCollect.querySelector("span:last-child") || topCollect;
    label.textContent = readyN > 0 ? `Собрать со всех узлов (+${fmt(readyUnits)} ед.)` : "Собрать со всех узлов";
  }

  for (const el of root.querySelectorAll(".font-stat-numeral, strong")) {
    const parent = el.parentElement?.textContent || "";
    if (/Котики на сменах|на постах/i.test(parent) && /^\d+\s*\/\s*\d+/.test((el.textContent || "").trim())) {
      el.textContent = `${hired} / ${FARM_ZONES.length}`;
    }
  }
  for (const el of root.querySelectorAll("span, div")) {
    if (/Готово к сбору:/i.test(el.textContent || "") && (el.textContent || "").length < 60 && el.children.length <= 2) {
      el.innerHTML = `Готово к сбору: <strong class="text-secondary font-bold">${readyN} зон</strong>`;
    }
  }

  const barnHud = [...root.querySelectorAll("div")].find(
    (el) =>
      el.children.length > 2 &&
      /Амбар Усадьбы/i.test(el.textContent || "") &&
      (el.textContent || "").length < 420,
  );
  if (barnHud) {
    const rows = [
      [/Травы/i, `${fmt(crops)}`],
      [/Древесина/i, `${fmt(wood)}`],
      [/Камень/i, `${fmt(stone)}`],
      [/Сталь|Руда/i, `${fmt(iron)}`],
      [/Рыбка/i, `${fmt(fish)}`],
    ];
    for (const row of barnHud.querySelectorAll(".flex.items-center.justify-between")) {
      const label = row.textContent || "";
      for (const [re, val] of rows) {
        if (!re.test(label)) continue;
        const bold = row.querySelector(".font-bold");
        if (!bold) continue;
        const rate = bold.querySelector("span");
        bold.textContent = "";
        bold.appendChild(document.createTextNode(`${val} `));
        if (rate) bold.appendChild(rate);
        break;
      }
    }
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
    toast(`Продано на рынке: ${item.name}${item.qty > 1 ? ` ×${item.qty}` : ""} +${price} 🐟`);
    renderCurrency();
    renderMarket();
  }
  renderFarm();
}

function renderFarm() {
  document.getElementById("farmLivePanel")?.remove();

  const zones = $("farmZonesList");
  if (zones) {
    zones.innerHTML = "";
    for (const z of FARM_ZONES) {
      const fs = state.farmState[z.id] || {};
      const toolId = farmZoneToolId(z.id);
      const toolOk = farmToolWorking(toolId);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wire-btn";
      const toolHint = toolId ? (toolOk ? " · tool OK" : " · нет tool") : "";
      btn.innerHTML = `<strong>${z.label}</strong><div class="meta">${z.kind} · ${
        fs.farmer ? "фермер" : "без фермера"
      }${fs.ready ? " · ready" : ""}${toolHint}</div>`;
      btn.addEventListener("click", () => {
        if (!fs.farmer) hireFarmer(z.id);
        else if (!fs.ready) plantZone(z.id);
        else harvestZone(z.id);
      });
      btn.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        if (fs.farmer) fireFarmer(z.id);
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
  bindFarmMapPins();
  syncFarmHud();
}

function ensurePassClaimState() {
  if (!state.passClaimed || typeof state.passClaimed !== "object") {
    state.passClaimed = { free: {}, elite: {} };
  }
  if (!state.passClaimed.free) state.passClaimed.free = {};
  if (!state.passClaimed.elite) state.passClaimed.elite = {};
  if (!Number.isFinite(state.passLevel)) state.passLevel = 1;
  if (!Number.isFinite(state.passXp)) state.passXp = 0;
  state.passLevel = Math.max(1, Math.min(PASS_SEASON_DAYS, state.passLevel));
  state.passXp = Math.max(0, Math.min(PASS_XP_PER_LEVEL - 1, state.passXp));
}

function passRewardClaimed(track, day) {
  ensurePassClaimState();
  return !!state.passClaimed[track]?.[day];
}

function passCanClaim(track, day) {
  ensurePassClaimState();
  if (day > state.passLevel) return false;
  if (passRewardClaimed(track, day)) return false;
  if (track === "elite" && !passActive()) return false;
  return true;
}

function passClaimReward(track, day, { silent = false } = {}) {
  ensurePassClaimState();
  const row = PASS_SEASON_TRACK.find((r) => r.day === day);
  if (!row) return false;
  if (day > state.passLevel) {
    if (!silent) toast(`День ${day} ещё закрыт`);
    return false;
  }
  if (track === "elite" && !passActive()) {
    if (!silent) showPassGateTip();
    return false;
  }
  if (passRewardClaimed(track, day)) {
    if (!silent) toast("Уже получено");
    return false;
  }
  state.passClaimed[track][day] = true;
  const reward = track === "free" ? row.free : row.elite;
  if (!silent) {
    toast(
      track === "elite"
        ? `Элита · день ${day}: ${reward.name}`
        : `Обычный · день ${day}: ${reward.name}`,
    );
  }
  return true;
}

function passClaimAllAvailable() {
  let n = 0;
  for (const row of PASS_SEASON_TRACK) {
    if (passCanClaim("free", row.day) && passClaimReward("free", row.day, { silent: true })) n += 1;
    if (passCanClaim("elite", row.day) && passClaimReward("elite", row.day, { silent: true })) n += 1;
  }
  if (n === 0) {
    toast(
      passActive()
        ? "Нет доступных наград"
        : "Свободный трек пуст · элита требует боевой пасс",
    );
  } else {
    toast(`Получено наград: ${n}`);
  }
  renderPass();
}

function passBuyLevels(count = 5) {
  ensurePassClaimState();
  const before = state.passLevel;
  state.passLevel = Math.min(PASS_SEASON_DAYS, state.passLevel + count);
  state.passXp = 0;
  const gained = state.passLevel - before;
  toast(gained > 0 ? `+${gained} ур. пропуска → день ${state.passLevel}` : "Уже максимум сезона");
  state.passTrackCentered = false;
  renderPass();
}

function passRewardStatusHtml(track, day) {
  if (passRewardClaimed(track, day)) {
    return `<span class="font-label-sm text-[10px] text-secondary flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">check_circle</span>Получено</span>`;
  }
  if (day > state.passLevel) {
    return `<span class="font-label-sm text-[10px] text-outline flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">lock</span>Заперто</span>`;
  }
  if (track === "elite" && !passActive()) {
    return `<span class="font-label-sm text-[10px] text-outline flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">lock</span>Нужен пасс</span>`;
  }
  return `<button type="button" class="claim-btn pass-claim-btn w-full bg-gradient-to-r from-primary via-primary-container to-primary text-on-primary font-label-sm text-[10px] py-0.5 rounded shadow hover:brightness-110 active:scale-95 transition-transform font-bold uppercase mt-0.5" data-pass-claim="${track}" data-pass-day="${day}">Забрать</button>`;
}

function passTrackCardHtml(track, day, reward, { current = false } = {}) {
  const claimed = passRewardClaimed(track, day);
  const locked = day > state.passLevel || (track === "elite" && !passActive() && !claimed);
  const elite = track === "elite";
  const tag = reward.tag
    ? `<span class="absolute top-0.5 left-0.5 bg-primary text-on-primary text-[8px] font-bold px-1 rounded shadow">${reward.tag}</span>`
    : "";
  const cardClass = elite
    ? `w-full h-full bg-gradient-to-b from-primary-container/20 via-surface-container-lowest/95 to-surface-container-lowest border ${
        current ? "border-2 border-primary ring-2 ring-primary/60 shadow-[0_0_24px_rgba(253,186,69,0.5)]" : "border-primary/40 shadow-[0_4px_16px_rgba(217,155,38,0.2)]"
      } rounded-xl p-1.5 flex flex-col items-center justify-between transition-all ${locked && !claimed ? "opacity-75" : ""}`
    : `w-full h-full bg-surface-container-lowest/90 border ${
        current ? "border-2 border-primary ring-2 ring-primary/40 shadow-xl" : "border-outline-variant/30"
      } rounded-xl p-1 flex flex-col items-center justify-between transition-opacity ${locked && !claimed ? "opacity-75" : ""}`;
  return `<div class="${cardClass}" data-pass-track="${track}" data-pass-day="${day}">
    <div class="w-14 h-14 rounded-lg overflow-hidden border ${elite ? "border-primary/40 ring-1 ring-primary/20" : "border-outline-variant/50"} shadow-inner bg-surface-container-high relative flex-shrink-0">
      <img src="${reward.img}" alt="${reward.name}" class="w-full h-full object-cover" loading="lazy" width="56" height="56">
      ${tag}
    </div>
    <div class="w-full flex flex-col items-center mt-0.5 min-w-0">
      <span class="font-label-sm text-[10px] ${elite ? "text-primary-fixed" : "text-on-surface"} font-bold text-center leading-tight truncate max-w-[100px]">${reward.name}</span>
      ${passRewardStatusHtml(track, day)}
    </div>
  </div>`;
}

function renderPassTrack() {
  const host = $("passTrackLevels");
  if (!host) return;
  ensurePassClaimState();
  const lvl = state.passLevel;
  host.innerHTML = PASS_SEASON_TRACK.map((row) => {
    const current = row.day === lvl;
    const done = row.day < lvl;
    const midClass = current
      ? "w-8 h-8 rounded-full bg-primary text-surface-container-lowest font-stat-numeral text-[14px] font-bold flex items-center justify-center shadow-[0_0_16px_rgba(253,186,69,0.9)] ring-2 ring-primary-fixed border border-primary"
      : done
        ? "w-7 h-7 rounded-full bg-secondary text-on-secondary font-stat-numeral text-label-md flex items-center justify-center shadow-md font-bold"
        : "w-7 h-7 rounded-full bg-surface-container-highest text-on-surface-variant font-stat-numeral text-label-md flex items-center justify-center font-bold";
    const colScale = current || row.day === PASS_SEASON_DAYS ? "scale-[1.03] relative z-20" : "";
    const finale =
      row.day === PASS_SEASON_DAYS
        ? `<span class="font-label-sm text-[7px] text-primary-fixed font-bold uppercase tracking-wider bg-surface-container-lowest px-1 rounded shadow leading-none">ФИНАЛ</span>`
        : current
          ? `<span class="font-label-sm text-[8px] text-primary font-bold uppercase tracking-wider bg-surface-container-lowest/90 px-1 rounded shadow leading-none">ТЕКУЩИЙ</span>`
          : "";
    return `<div class="pass-track-col ${colScale}" data-pass-col="${row.day}">
      ${passTrackCardHtml("free", row.day, row.free, { current })}
      <div class="pass-day-node">
        <div class="${midClass}">${row.day}</div>
        ${finale}
      </div>
      ${passTrackCardHtml("elite", row.day, row.elite, { current })}
    </div>`;
  }).join("");
}

function bindPassInteractions() {
  const root = $("viewPass");
  if (!root || root.dataset.passBound === "1") return;
  root.dataset.passBound = "1";

  root.addEventListener("click", (ev) => {
    const claim = ev.target.closest("[data-pass-claim]");
    if (claim && root.contains(claim)) {
      ev.preventDefault();
      const track = claim.getAttribute("data-pass-claim");
      const day = Number(claim.getAttribute("data-pass-day"));
      if (track && day) {
        passClaimReward(track, day);
        renderPass();
      }
      return;
    }

    const seasonGo = ev.target.closest(".pass-season-go");
    if (seasonGo && root.contains(seasonGo)) {
      ev.preventDefault();
      const minLvl = Number(seasonGo.getAttribute("data-pass-min-level") || 0);
      const needsElite = seasonGo.getAttribute("data-pass-gate") === "elite";
      if (needsElite && !passActive()) {
        showPassGateTip();
        return;
      }
      if (minLvl && state.passLevel < minLvl) {
        toast(`Нужен уровень пропуска ${minLvl}+`);
        return;
      }
      const tab = seasonGo.getAttribute("data-pass-go");
      const PASS_SEASON_TABS = new Set(["boss_dungeon", "boss_raid", "raid_battle"]);
      if (!tab || !PASS_SEASON_TABS.has(tab)) {
        toast("Маршрут сезона недоступен");
        return;
      }
      navigate(tab, { primary: "combat" });
    }
  });

  const scroll = $("passTrackScroll");
  const left = $("passScrollLeft");
  const right = $("passScrollRight");
  if (left && scroll) {
    left.addEventListener("click", () => scroll.scrollBy({ left: -320, behavior: "smooth" }));
  }
  if (right && scroll) {
    right.addEventListener("click", () => scroll.scrollBy({ left: 320, behavior: "smooth" }));
  }

  const claimAll = $("claimAllBtn");
  if (claimAll) {
    claimAll.addEventListener("click", (ev) => {
      ev.preventDefault();
      passClaimAllAvailable();
    });
  }

  const buy = $("buyLevelsBtn");
  if (buy) {
    buy.addEventListener("click", (ev) => {
      ev.preventDefault();
      passBuyLevels(5);
    });
  }

  const stubBtn = $("btnPassActiveStub");
  if (stubBtn) {
    stubBtn.addEventListener("click", () => {
      state.passActiveStub = !state.passActiveStub;
      toast(
        state.passActiveStub
          ? t("pass.active.stub.on", "Элитный пасс ACTIVE")
          : t("pass.active.stub.off", "Элитный пасс выключен"),
      );
      renderPass();
      renderFarm();
    });
  }
}

function centerPassTrackOnCurrent() {
  const scroll = $("passTrackScroll");
  const col = scroll?.querySelector(`[data-pass-col="${state.passLevel}"]`);
  if (!scroll || !col) return;
  const left = col.offsetLeft - scroll.clientWidth / 2 + col.offsetWidth / 2;
  scroll.scrollTo({ left: Math.max(0, left), behavior: state.passTrackCentered ? "auto" : "smooth" });
  state.passTrackCentered = true;
}

function renderPass() {
  ensurePassClaimState();
  bindPassInteractions();

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

  const badge = $("passCurrentLevelBadge");
  if (badge) badge.textContent = `УР. ${state.passLevel}`;
  const xpLabel = $("passXpLabel");
  if (xpLabel) {
    xpLabel.textContent = `${state.passXp.toLocaleString("ru-RU")} / ${PASS_XP_PER_LEVEL.toLocaleString("ru-RU")} XP`;
  }
  const xpBar = $("passXpBar");
  if (xpBar) {
    xpBar.style.width = `${Math.round((state.passXp / PASS_XP_PER_LEVEL) * 1000) / 10}%`;
  }
  const eliteLabel = $("passEliteStatusLabel");
  if (eliteLabel) eliteLabel.textContent = passActive() ? "АКТИВЕН" : "ВЫКЛ";
  const booster = $("passBoosterState");
  if (booster) booster.textContent = passActive() ? "АКТИВЕН" : "НЕТ";
  const range = $("passLevelRange");
  if (range) range.textContent = `1 — ${PASS_SEASON_DAYS}`;
  const bossHint = $("passBossLevelHint");
  if (bossHint) bossHint.textContent = `Ур. 28+ (Ваш Ур: ${state.passLevel})`;

  renderPassTrack();
  requestAnimationFrame(() => centerPassTrackOnCurrent());
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

function craftRecipeById(id) {
  return CRAFT_RECIPES.find((r) => r.id === id) || CRAFT_RECIPES[0];
}

function craftCanAfford(recipe) {
  if (!recipe) return false;
  if ((state.wallet.gold || 0) < (recipe.costGold || 0)) return false;
  return (recipe.ingredients || []).every((ing) => barnMatQty(ing.id) >= ing.qty);
}

function runCraftRecipe(recipeId) {
  const recipe = craftRecipeById(recipeId || state.craftRecipeId);
  if (!recipe) {
    toast("Рецепт не найден");
    return;
  }
  if ((state.wallet.gold || 0) < (recipe.costGold || 0)) {
    toast(`Нужно ${recipe.costGold} 🐟`);
    return;
  }
  for (const ing of recipe.ingredients || []) {
    if (barnMatQty(ing.id) < ing.qty) {
      toast(`Не хватает: ${barnMatGet(ing.id)?.name || ing.id} ×${ing.qty}`);
      return;
    }
  }
  for (const ing of recipe.ingredients || []) barnMatSpend(ing.id, ing.qty);
  state.wallet.gold -= recipe.costGold || 0;
  const out = barnMatAdd(recipe.outId, recipe.outQty || 1);
  renderCurrency();
  toast(`Скрафчено: ${out?.name || recipe.name} ×${recipe.outQty || 1}`);
  renderCraftStock();
  if (!$("viewGear")?.classList.contains("hidden")) renderBarn();
}

function renderCraftReagents(root, recipe) {
  const grid = root.querySelector(".grid.grid-cols-2.sm\\:grid-cols-4, .grid.grid-cols-2");
  // Prefer the «Необходимые Реагенты» block
  const label = [...root.querySelectorAll("span")].find((el) => /Необходимые Реагенты/i.test(el.textContent || ""));
  const host =
    label?.closest(".flex.flex-col")?.querySelector(".grid") ||
    [...root.querySelectorAll(".grid")].find((g) => /Душистая|Реагент|Мята|Рыбк/i.test(g.textContent || ""));
  if (!host || !recipe) return;
  const slots = (recipe.ingredients || []).slice(0, 4);
  while (slots.length < 4) slots.push(null);
  host.innerHTML = slots
    .map((ing) => {
      if (!ing) {
        return `<div class="p-space-sm rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col items-center text-center opacity-40">
          <div class="w-full h-20 rounded-lg bg-surface-container-lowest flex items-center justify-center text-outline-variant"><span class="material-symbols-outlined text-3xl">add</span></div>
          <span class="font-label-sm text-[11px] text-on-surface-variant mt-1">Слот</span>
        </div>`;
      }
      const mat = barnMatGet(ing.id);
      const have = barnMatQty(ing.id);
      const ok = have >= ing.qty;
      return `<div class="p-space-sm rounded-xl bg-surface-container border ${ok ? "border-secondary/40" : "border-tertiary/50"} shadow-md flex flex-col items-center text-center">
        <div class="w-full h-20 rounded-lg bg-surface-container-lowest overflow-hidden mb-1 border border-outline-variant/30 flex items-center justify-center">
          <img alt="" class="max-h-full max-w-full object-contain p-1" src="${mat?.iconSrc || "/barn-icons/herbs.png"}"/>
        </div>
        <span class="font-label-sm text-label-sm text-on-surface line-clamp-1 font-bold">${mat?.name || ing.id}</span>
        <span class="font-body-sm text-body-sm ${ok ? "text-secondary" : "text-tertiary"} font-bold mt-0.5">${have} / ${ing.qty}</span>
      </div>`;
    })
    .join("");
}

/** Craft «Склад Сырья» — live smoke mats from barn. */
function renderCraftStock() {
  const root = $("viewCraft");
  if (!root) return;
  ensureBarnMats();
  if (!state.craftRecipeId) state.craftRecipeId = CRAFT_RECIPES[0]?.id;

  const head = [...root.querySelectorAll("span")].find((el) => /Склад Сырья/i.test(el.textContent || ""));
  const card = head?.closest(".p-space-md, .rounded-xl");
  if (card) {
    const used = (state.barnMats || []).filter((m) => (m.qty || 0) > 0).length;
    const capLabel = [...card.querySelectorAll("span")].find(
      (el) => /\d+\s*\/\s*\d+|Soon|smoke/i.test(el.textContent || "") && el !== head,
    );
    if (capLabel) capLabel.textContent = `${used} / ${state.barnMats?.length || 0}`;
    const list = card.querySelector(".flex.flex-col.gap-space-xs");
    if (list) {
      const rows = (state.barnMats || [])
        .filter((m) => m.kind === "farm" || m.kind === "potion" || (m.qty || 0) > 0)
        .slice(0, 8)
        .map((m) => {
          const pct = Math.min(100, Math.round(((m.qty || 0) / 40) * 100));
          return `<div class="p-space-xs rounded-lg bg-surface-container flex flex-col gap-1">
            <div class="flex items-center justify-between gap-1">
              <span class="flex items-center gap-1.5 min-w-0">
                <img alt="" src="${m.iconSrc}" class="w-5 h-5 object-contain shrink-0"/>
                <span class="font-label-sm text-label-sm text-on-surface truncate">${m.name}</span>
              </span>
              <span class="font-stat-numeral text-[11px] text-primary shrink-0">×${m.qty || 0}</span>
            </div>
            <div class="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
              <div class="h-full bg-secondary rounded-full" style="width:${pct}%"></div>
            </div>
          </div>`;
        })
        .join("");
      list.innerHTML =
        rows ||
        `<div class="p-space-sm rounded-lg border border-dashed border-outline-variant/40 text-on-surface-variant text-sm text-center">Склад пуст — купи на Рынке или собери на Дворе</div>`;
    }
  }

  const recipe = craftRecipeById(state.craftRecipeId);
  renderCraftReagents(root, recipe);

  let picker = root.querySelector("#craftSmokeRecipes");
  if (!picker) {
    picker = document.createElement("div");
    picker.id = "craftSmokeRecipes";
    picker.className = "flex flex-wrap gap-1.5 px-1 mb-2 relative z-10";
    const ctaRow = root.querySelector("#btn-craft-potion")?.parentElement;
    if (ctaRow) ctaRow.parentElement?.insertBefore(picker, ctaRow);
    else root.appendChild(picker);
  }
  picker.innerHTML = CRAFT_RECIPES.map((r) => {
    const on = r.id === state.craftRecipeId;
    const out = barnMatGet(r.outId);
    return `<button type="button" data-craft-recipe="${r.id}" class="px-2.5 py-1.5 rounded-lg ${on ? "bg-primary-container text-on-primary-container font-bold" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"} font-label-sm text-[11px] flex items-center gap-1.5">
      <img alt="" src="${out?.iconSrc || "/barn-icons/potions.png"}" class="w-5 h-5 object-contain"/>
      ${r.name}
    </button>`;
  }).join("");

  if (root.dataset.craftBound !== "1") {
    root.dataset.craftBound = "1";
    root.addEventListener("click", (e) => {
      const recipeBtn = e.target.closest("[data-craft-recipe]");
      if (recipeBtn && root.contains(recipeBtn)) {
        state.craftRecipeId = recipeBtn.getAttribute("data-craft-recipe");
        renderCraftStock();
        return;
      }
      const craftBtn = e.target.closest("#btn-craft-potion");
      if (craftBtn && root.contains(craftBtn)) {
        e.preventDefault();
        runCraftRecipe(state.craftRecipeId);
      }
    });
  }

  const cta = root.querySelector("#btn-craft-potion");
  if (cta && recipe) {
    const ok = craftCanAfford(recipe);
    cta.innerHTML = `<span class="material-symbols-outlined text-[24px] ${ok ? "animate-pulse" : ""} text-on-primary">local_fire_department</span><span class="tracking-wide">Скрафтить ${recipe.name} · ${recipe.costGold} 🐟</span>`;
    cta.classList.toggle("opacity-60", !ok);
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
    const art = catHeroArt(hero.templateId) || "/stitch-assets/cat-heroes/fighter-fire.jpg?v=elven18";
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
  const list = $("viewPvpVictory")?.querySelector(".col-cats");
  if (list) {
    const squad = pvpSquadIds();
    const visual = PRACTICE_VISUAL_LANES.map((i) => squad[i]).filter(Boolean);
    const chips = { tank: "is-storm", fighter: "is-fire", assassin: "is-storm", ranger: "is-fire", mage: "is-fire", support: "is-water" };
    list.innerHTML = visual
      .map((tid, idx) => {
        const hero = practiceHeroByTemplate(tid);
        const role = hero?.role || starterMeta(tid).role;
        const el = practiceElementOf(hero || { templateId: tid }) || starterMeta(tid).element;
        const name = hero?.name || catSheetName({ templateId: tid });
        const art = catHeroArt(tid) || "/stitch-assets/cat-heroes/fighter-fire.jpg?v=elven18";
        const mvp = idx === 1 ? ` class="is-mvp"` : "";
        const badge = idx === 1 ? `<span class="col-badge">MVP матча</span>` : "";
        return `<li${mvp}>
${badge}
<span class="col-chip ${chips[role] || "is-fire"}">${CAT_ELEMENT_RU[el] || el} · ${hero?.roleRu || CAT_ROLE_RU[role] || role}</span>
<figure><img alt="" src="${art}"/></figure>
<div>
<b>${name}</b>
<small>${hero?.roleRu || CAT_ROLE_RU[role] || role}</small>
</div>
</li>`;
      })
      .join("");
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
      state.pvpOpponentTeam = null;
      if (act === "again") {
        navigate("pvp", { primary: "combat" });
        window.setTimeout(() => startPvpSearch(), 80);
        return;
      }
      navigate("pvp", { primary: "combat" });
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
  const modeRu =
    { practice: "Тренировка", pve: "Мифмир", pvp: "PvP арена", boss: "Босс" }[state.battleMode] ||
    state.battleMode ||
    "бой";
  $("resultEyebrow").textContent = t("result.eyebrow", "Итог боя");
  $("resultTitle").textContent = win
    ? t("result.win", "Блестящая победа!")
    : t("result.lose", "Поражение в бою");
  $("resultLead").textContent = `${r?.battleId || "?"} · ${r?.result || "?"} · ${modeRu}`;
  const loseLead = $("resultLoseLead");
  if (loseLead && !win) {
    loseLead.textContent =
      state.battleMode === "pvp"
        ? `Арена: поражение против «${state.pvpOpponentName || "соперника"}». Вернись в лобби или сразу начни новый поиск.`
        : `${modeRu}: ${r?.result || "поражение"}. Пересобери строй, зайди в таверну за молоком и попробуй снова.`;
  }
  const pvpLobbyBtn = document.querySelector('#viewResultLose [data-hud-action="result-pvp-lobby"]');
  if (pvpLobbyBtn) pvpLobbyBtn.hidden = state.battleMode !== "pvp";
  // Wire painted/lose CTAs once
  document.querySelectorAll("[data-hud-action]").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      const act = btn.getAttribute("data-hud-action");
      const mode = state.battleMode;
      state.battle = null;
      state.lastResult = null;
      if (act === "result-retry") {
        if (mode === "pvp") {
          state.battleMode = "";
          state.pvpOpponentTeam = null;
          navigate("pvp", { primary: "combat" });
          window.setTimeout(() => startPvpSearch(), 80);
        } else if (mode === "practice") startPractice(false);
        else startYard(false);
      } else if (act === "result-formation") navigate("formation");
      else if (act === "result-tavern") navigate("tavern");
      else if (act === "result-hub") {
        state.battleMode = "";
        navigate("hub");
      } else if (act === "result-yard") {
        state.battleMode = "";
        state.pvpOpponentTeam = null;
        navigate(mode === "pvp" ? "pvp" : mode === "practice" ? "practice" : "yard");
      } else if (act === "result-pvp-lobby") {
        state.battleMode = "";
        state.pvpOpponentTeam = null;
        navigate("pvp", { primary: "combat" });
      }
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

/** Cleanse «−» flash: play once per event batch, then drop (do not linger until next action). */
const CLEANSE_FLASH_MS = 1300;
const _cleanseFlash = { sig: "", byUnit: {}, shownAt: 0, timer: 0 };

function activeCleanseFlashes(events, battleKey = "") {
  const map = cleansedByUnitFromEvents(events);
  const ids = Object.keys(map);
  if (!ids.length) return {};
  const sig = `${battleKey}|${ids
    .sort()
    .map((id) => `${id}:${(map[id] || []).join(",")}`)
    .join(";")}`;
  const now = Date.now();
  if (sig !== _cleanseFlash.sig) {
    _cleanseFlash.sig = sig;
    _cleanseFlash.byUnit = map;
    _cleanseFlash.shownAt = now;
    clearTimeout(_cleanseFlash.timer);
    _cleanseFlash.timer = setTimeout(() => {
      if (_cleanseFlash.sig !== sig) return;
      _cleanseFlash.byUnit = {};
      if (!state.battle) return;
      if (state.battleMode === "pvp") renderPvpFight();
      else if (state.battleMode === "practice" || state.battleMode === "pve") renderPracticeFight();
    }, CLEANSE_FLASH_MS);
  }
  if (now - _cleanseFlash.shownAt >= CLEANSE_FLASH_MS) return {};
  return _cleanseFlash.byUnit;
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
  const tidArt = unitTemplateId(u);
  const artFallback = (PRACTICE_DUMMY_ART_FALLBACKS[tidArt] || [])[0] || art;
  const cutout = art
    ? spriteFaceHtml(
        `<img alt="" class="mf-battle-cutout${u.alive ? "" : " mf-unit-dim"}" src="${art}" onerror="this.onerror=null;this.src='${artFallback}'"/>`,
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
        ? `<div class="mf-bar mf-bar--shield" title="Щит ${u.shield}"><i style="width:${Math.min(100, (u.shield / Math.max(u.maxHp, 1)) * 100)}%"></i></div>`
        : ""
    }</div>
  `;
  d.classList.toggle("is-stunned", !!(u.alive && (u.statuses || []).some((s) => s.id === "stun" || s.id === "sleep")));
  // MF-152: idle/aura + hit FX target via data-unit-id (same kits as cats by role).
  decorateBattleUnitIdle(d, u, u.lane ?? 0);
  return d;
}

/** Attack-card art — elven 18 heroes (role-element) under stitch-assets. */
const ATTACK_CARD_ART_FOLDER = {
  shop_tank_fire: "tank-fire",
  shop_tank_water: "tank-water",
  shop_tank_wind: "tank-wind",
  shop_fighter_fire: "fighter-fire",
  shop_fighter_water: "fighter-water",
  shop_fighter_wind: "fighter-wind",
  shop_assassin_fire: "assassin-fire",
  shop_assassin_water: "assassin-water",
  shop_assassin_wind: "assassin-wind",
  shop_ranger_fire: "ranger-fire",
  shop_ranger_water: "ranger-water",
  shop_ranger_wind: "ranger-wind",
  shop_mage_fire: "mage-fire",
  shop_mage_water: "mage-water",
  shop_mage_wind: "mage-wind",
  shop_support_fire: "support-fire",
  shop_support_water: "support-water",
  shop_support_wind: "support-wind",
};

/** N=6 part order — FULL-SPEC §2.3 (eyes/ears + 4 actives). */
const DECK_PARTS = ["eyes", "ears", "muzzle", "headwear", "back", "tail"];
const STARTER_DECK_TEMPLATE = {
  starter_tank_stone: "shop_tank_fire",
  starter_fighter_fire: "shop_fighter_fire",
  starter_support_water: "shop_support_water",
};
/** cost≠1 overrides from content/cards (default 1). Art gem = playable cost. */
const ATTACK_CARD_COST2 = new Set([
  "card_shop_assassin_water_back",
  "card_shop_assassin_wind_back",
  "card_shop_fighter_fire_back",
  "card_shop_fighter_water_muzzle",
  "card_shop_fighter_wind_back",
  "card_shop_mage_fire_back",
  "card_shop_mage_fire_muzzle",
  "card_shop_mage_water_back",
  "card_shop_mage_water_eyes",
  "card_shop_mage_wind_back",
  "card_shop_ranger_water_back",
  "card_shop_ranger_water_muzzle",
  "card_shop_support_fire_back",
  "card_shop_support_water_back",
  "card_shop_support_wind_back",
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

/** Extract cat templateId from battle unit id (`p1_0_shop_tank_fire`). */
function unitTemplateId(unitOrId) {
  const id = typeof unitOrId === "string" ? unitOrId : unitOrId?.id || "";
  const m = String(id).match(/^(?:p1|p2|bot)_\d+_(.+)$/);
  return m ? m[1] : id;
}

/** Practice lobby roster: data-hero → combat template + display meta. */
const PRACTICE_HEROES = {
  barsik: {
    templateId: "shop_tank_fire",
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
    templateId: "shop_tank_water",
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
    templateId: "shop_fighter_fire",
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
    templateId: "shop_fighter_water",
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
    templateId: "shop_assassin_fire",
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
    templateId: "shop_assassin_water",
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
    templateId: "shop_ranger_fire",
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
    templateId: "shop_ranger_water",
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
    templateId: "shop_mage_fire",
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
    templateId: "shop_mage_water",
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
    templateId: "shop_support_water",
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
    templateId: "shop_support_wind",
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
  card_tank_stone_eyes: "shop_tank_fire_eyes",
  card_tank_stone_ears: "shop_tank_fire_ears",
  card_tank_stone_muzzle: "shop_tank_fire_muzzle",
  card_tank_stone_headwear: "shop_tank_fire_headwear",
  card_tank_stone_back: "shop_tank_fire_back",
  card_tank_stone_tail: "shop_tank_fire_tail",
  card_fighter_fire_eyes: "shop_fighter_fire_eyes",
  card_fighter_fire_ears: "shop_fighter_fire_ears",
  card_fighter_fire_muzzle: "shop_fighter_fire_muzzle",
  card_fighter_fire_headwear: "shop_fighter_fire_headwear",
  card_fighter_fire_back: "shop_fighter_fire_back",
  card_fighter_fire_tail: "shop_fighter_fire_tail",
  card_support_water_eyes: "shop_support_water_eyes",
  card_support_water_ears: "shop_support_water_ears",
  card_support_water_muzzle: "shop_support_water_muzzle",
  card_support_water_headwear: "shop_support_water_headwear",
  card_support_water_back: "shop_support_water_back",
  card_support_water_tail: "shop_support_water_tail",
};

/** Bust Amvera/browser max-age after in-place rebakes. */
const STITCH_ASSET_V = "elven18";

function attackCardArtUrl(cardId) {
  if (!cardId) return "";
  const raw = ATTACK_CARD_ART_ALIAS[cardId] || String(cardId).replace(/^card_/, "");
  // shop_tank_fire_muzzle → shop_tank_fire | muzzle
  let folderKey = "";
  let fileStem = raw;
  if (raw.startsWith("shop_")) {
    const m = raw.match(/^(shop_[a-z]+_[a-z]+)_(eyes|ears|muzzle|headwear|back|tail)$/);
    if (m) {
      folderKey = m[1];
      fileStem = raw;
    }
  }
  const folder = ATTACK_CARD_ART_FOLDER[folderKey];
  if (!folder) return "";
  return `/stitch-assets/attack-cards/${folder}/attack_${fileStem}.jpg?v=${STITCH_ASSET_V}`;
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
  const busy = !!state.oppThrowPlaying || !!state.actionBusy;
  b.className = art ? `${classNames} mf-atk-card--art pf-card pf-card-art` : `${classNames} mf-atk-card--text pf-card`;
  if (cc) b.classList.add("mf-atk-card--stunned");
  if (busy) b.classList.add("is-busy-wait");
  b.disabled = !c.playable || cc || !!diff.result || diff.active !== 0 || busy;
  b.dataset.cardId = c.cardId || "";
  b.dataset.targetRule = c.targetRule || "";
  b.title = cc ? `${title} · стан/сон — пропуск хода` : `${title} · ${cost} AP`;
  if (art) {
    b.innerHTML = `<img alt="${title}" src="${art}" draggable="false"/><b class="mf-atk-card__meta">${title}</b><span class="mf-atk-card__sub">${cost} AP</span>`;
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

  b.addEventListener("click", () => {
    if (b.disabled) return;
    if (state.selectedKeep?.mode) {
      state.selectedKeep = null;
      submitAction({ kind: "keep", unitId: c.unitId, handIndex: c.handIndex });
      return;
    }
    // Auto-target by card TargetRule (nearest / backline / all_enemies / self / heal…).
    submitAction({ kind: "playCard", unitId: c.unitId, handIndex: c.handIndex, targetId: "" });
  });
  return b;
}

/** Shared attack-card reverse used for opponent discard throw (all modes). */
const OPP_CARD_BACK_URL = `/stitch-assets/attack-cards/card-back.webp?v=${STITCH_ASSET_V}`;
const OPP_THROW_COUNT = 6;
let oppThrowToken = 0;
let oppThrowSkip = null;

function ensureOppThrowOverlay() {
  let el = $("mfOppThrow");
  if (el) return el;
  el = document.createElement("div");
  el.id = "mfOppThrow";
  el.className = "mf-opp-throw";
  el.hidden = true;
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<p class="mf-opp-throw__label"></p><p class="mf-opp-throw__hint"></p><div class="mf-opp-throw__fan" role="presentation"></div>`;
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
  el.addEventListener("pointerdown", (ev) => {
    if (!state.oppThrowPlaying) return;
    ev.preventDefault();
    if (typeof oppThrowSkip === "function") oppThrowSkip();
  });
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
  const hint = el.querySelector(".mf-opp-throw__hint");
  if (hint) hint.textContent = "";
  el.hidden = false;
  el.setAttribute("aria-hidden", "false");
  el.classList.add("is-on", "is-hold");
  el.classList.remove("is-in", "is-out");
}

/** Axie-style: 6 face-down backs thrown toward the player, then cleared. Tap to skip. */
function playOpponentDiscardThrow({ holdMs = 280 } = {}) {
  const el = ensureOppThrowOverlay();
  const token = ++oppThrowToken;
  state.oppThrowPlaying = true;
  const p = el.querySelector(".mf-opp-throw__label");
  if (p) {
    p.textContent =
      state.locale === "ru" ? "Ход противника · сброс карт" : "Opponent turn · discard";
  }
  const hint = el.querySelector(".mf-opp-throw__hint");
  if (hint) {
    hint.textContent =
      state.locale === "ru" ? "тап — пропустить" : "tap to skip";
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
  const inMs = 420;
  const outMs = 300;
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled || token !== oppThrowToken) return;
      settled = true;
      oppThrowSkip = null;
      hideOppThrow();
      state.oppThrowPlaying = false;
      resolve();
    };
    const goOut = () => {
      if (token !== oppThrowToken || settled) return;
      el.classList.remove("is-in", "is-hold");
      el.classList.add("is-out");
      window.setTimeout(finish, outMs);
    };
    oppThrowSkip = () => {
      skipCombatFx();
      goOut();
    };
    window.setTimeout(() => {
      if (token !== oppThrowToken || settled) return;
      el.classList.add("is-hold");
      window.setTimeout(goOut, holdMs);
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
  // freeze = same stun id (ice mage / pitboss taunt); player-facing RU = Заморозка
  stun: { label: "Заморозка", icon: "ac_unit", kind: "debuff" },
  dodge: { label: "Уворот", icon: "speed", kind: "buff" },
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
/** Stable chip order: debuffs first, then buffs (within kind — this list). */
const STATUS_SORT_IDS = [
  "stun",
  "sleep",
  "poison",
  "bleed",
  "weak",
  "vuln",
  "fragile",
  "taunt",
  "stealth",
  "dodge",
  "ruffle",
  "claw_mode",
  "mint",
  "cleanser",
  "last_meow",
  "atk_up",
];
const STATUS_SORT_INDEX = Object.fromEntries(STATUS_SORT_IDS.map((id, i) => [id, i]));
const STATUS_CHIP_SOFT_CAP = 8;
const STATUS_LABEL_RU = Object.fromEntries(
  Object.entries(STATUS_META).map(([id, m]) => [id, m.label]),
);

function statusMetaFor(id) {
  return (
    STATUS_META[id] || {
      label: String(id || "?"),
      icon: "help",
      kind: "debuff",
    }
  );
}

function statusTurnsRu(n) {
  const v = Math.abs(Number(n) || 0);
  const mod100 = v % 100;
  const mod10 = v % 10;
  let word = "ходов";
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) word = "ход";
    else if (mod10 >= 2 && mod10 <= 4) word = "хода";
  }
  return `${v} ${word}`;
}

/** Escape attribute text for title= tooltips. */
function escAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/** PvP: shield bar only for allies (D-032). Practice/PvE: both sides visible for training. */
function canSeeUnitShield(u) {
  if (!u) return false;
  if (u.side === 0) return true;
  return state.battleMode !== "pvp";
}

function unitStatusList(u) {
  const out = [];
  const seen = new Set();
  for (const s of u?.statuses || []) {
    const id = s?.id;
    if (!id || id === "shield") continue; // shield = HP bar only, never a chip
    seen.add(id);
    out.push({
      id,
      stacks: Math.max(1, Number(s.stacks) || 1),
      duration: Math.max(0, Number(s.duration) || 0),
      meta: statusMetaFor(id),
    });
  }
  if (u?.atkBuff > 0 && !seen.has("atk_up")) {
    out.push({
      id: "atk_up",
      stacks: Math.max(1, Number(u.atkBuff) || 1),
      duration: Math.max(0, Number(u.atkBuffDur) || 0),
      meta: STATUS_META.atk_up,
    });
  }
  out.sort((a, b) => {
    const ka = a.meta.kind === "debuff" ? 0 : 1;
    const kb = b.meta.kind === "debuff" ? 0 : 1;
    if (ka !== kb) return ka - kb;
    const ia = STATUS_SORT_INDEX[a.id] ?? 900;
    const ib = STATUS_SORT_INDEX[b.id] ?? 900;
    if (ia !== ib) return ia - ib;
    return String(a.id).localeCompare(String(b.id));
  });
  return out;
}

function statusChipTitle(s) {
  const label = s.meta?.label || s.id;
  if (s.id === "poison") {
    return `${label} · ×${s.stacks || 1} · до очищения`;
  }
  const parts = [label];
  if (s.stacks > 1 || s.id === "ruffle") parts.push(`×${s.stacks || 1}`);
  if (s.duration > 0) parts.push(statusTurnsRu(s.duration));
  return parts.join(" · ");
}

function statusChipHtml(s) {
  const kind = s.meta?.kind === "buff" ? "buff" : "debuff";
  const isPoison = s.id === "poison";
  const showStacks = isPoison || s.id === "ruffle" || s.stacks > 1;
  const showTurns = !isPoison && s.duration > 0;
  const stacks = showStacks ? `<b class="mf-status__stacks">×${s.stacks || 1}</b>` : "";
  const turns = showTurns ? `<em>${s.duration}</em>` : "";
  const tip = escAttr(statusChipTitle(s));
  const icon = s.meta?.icon || "help";
  return `<span class="mf-status mf-status--${kind}" data-status="${escAttr(s.id)}" title="${tip}"><span class="material-symbols-outlined" aria-hidden="true">${icon}</span>${stacks}${turns}</span>`;
}

function statusIconsHtml(list, { cleansed = [] } = {}) {
  const items = Array.isArray(list) ? list.slice() : [];
  let overflowTip = "";
  let visible = items;
  if (items.length > STATUS_CHIP_SOFT_CAP) {
    const keep = STATUS_CHIP_SOFT_CAP - 1;
    const hidden = items.slice(keep);
    visible = items.slice(0, keep);
    overflowTip = escAttr(hidden.map((s) => statusChipTitle(s)).join("; "));
    visible.push({
      _overflow: true,
      count: hidden.length,
      tip: overflowTip,
    });
  }
  const chips = visible
    .map((s) => {
      if (s._overflow) {
        return `<span class="mf-status mf-status--more" title="${s.tip}"><b>+${s.count}</b></span>`;
      }
      return statusChipHtml(s);
    })
    .join("");
  const gone = (cleansed || [])
    .map((id) => {
      const m = statusMetaFor(id);
      return `<span class="mf-status mf-status--cleared" data-status="${escAttr(id)}" title="${escAttr(`Снято: ${m.label}`)}"><span class="material-symbols-outlined" aria-hidden="true">${m.icon}</span><b>−</b></span>`;
    })
    .join("");
  return chips + gone;
}

/** Display-only energy cap from FULL-SPEC §3.3 (P1 = first actor). */
function energyTurnCap(turn, isFirstActor = true) {
  const t = Math.max(1, Number(turn) || 1);
  if (t <= 1) return isFirstActor ? 1 : 2;
  if (t <= 3) return isFirstActor ? 2 : 3;
  return 3;
}

/** Ensure portrait mount has HP + shield bars, status row, death overlay. */
function ensureCombatPortraitMounts(card) {
  const frame = card.querySelector(".relative.w-full, figure, .mf-unit-frame") || card;
  if (!frame.classList.contains("mf-unit-frame")) frame.classList.add("mf-unit-frame");
  let statusRow = frame.querySelector(".mf-status-row");
  if (!statusRow) {
    statusRow = document.createElement("div");
    frame.appendChild(statusRow);
  }
  // Unified class for practice / PvE / PvP (position + size in CSS).
  statusRow.className = "mf-status-row";
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

/** PvE bot display name from templateId (stage meta not in battle payload). D-051 roles. */
function pveBotDisplayName(templateId, role) {
  const tid = String(templateId || "");
  const roleRu = CAT_ROLE_RU[role] || role || "";
  if (tid.includes("empty_lane")) return "";
  if (tid.includes("pitboss_dog") || tid.includes("baron")) return "Барон Гав";
  if (tid.includes("pitboss_wolf") || tid.includes("alpha_m2")) return "Лютый Клык";
  if (tid.includes("pitboss_redd") || tid.includes("alpha_m3")) return "Алый Вожак";
  if (tid.includes("pitboss_zomb") || tid.includes("necro")) return "Некропёс Мор";
  if (tid.includes("pitboss_ghost") || tid.includes("_gul")) return "Фантом Гул";
  // Longer / more specific prefixes first (ranger before generic faction).
  const table = [
    ["bot_dog_ranger", "Пёс-лучник"],
    ["bot_dog_tank", "Пёс-щитоносец"],
    ["bot_dog_fighter", "Пёс-задира"],
    ["bot_wolf_ranger", "Волк-лучник"],
    ["bot_wolf_tank", "Северный страж"],
    ["bot_wolf_fighter", "Волк-лучник"],
    ["bot_wolf_support", "Шаман инея"],
    ["bot_redd_assassin", "Пёс-искромёт"],
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
    ["bot_practice_tank", "Дубовый"],
    ["bot_practice_fighter", "Берсерк"],
    ["bot_practice_support", "Тотем"],
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

/** Critical screen backdrops — current + next-likely (not every chapter). */
const SCREEN_BG = {
  login: `/stitch-assets/login-bg.webp?v=${STITCH_ASSET_V}`,
  yard: `/stitch-assets/yard/meowkara-mines-bg.webp?v=${STITCH_ASSET_V}`,
  dojo: `/stitch-ref/e608/arena_dojo.webp?v=${STITCH_ASSET_V}`,
  dojoLoad: `/stitch-assets/dojo/practice-load-arena.webp?v=${STITCH_ASSET_V}`,
  pvpLoad: `/stitch-assets/pvp-battles/load-bg.webp?v=${STITCH_ASSET_V}`,
  pveVictory: `/stitch-assets/pve-victory/bg.webp?v=${STITCH_ASSET_V}`,
  victoryHall: `/stitch-ref/e608/victory_hall.webp?v=${STITCH_ASSET_V}`,
  arenaInterior: `/stitch-assets/pvp-battles/fight-bg.webp?v=${STITCH_ASSET_V}`,
  pvpVictory: `/stitch-assets/pvp-battles/victory-hall.webp?v=${STITCH_ASSET_V}`,
};

function preloadScreenBgs(...keys) {
  preloadImages(keys.map((k) => SCREEN_BG[k]).filter(Boolean));
}

/** Prefetch N=6 attack plates for each squad template (not only visible hand). */
function prefetchSquadCardArt(templateIds) {
  const urls = [];
  for (const tid of templateIds || []) {
    for (const c of heroDeckCards(tid)) {
      if (c.art) urls.push(c.art);
    }
  }
  if (urls.length) preloadImages(urls);
  preloadImages([OPP_CARD_BACK_URL]);
}

function combatSquadForPrefetch() {
  if (state.battleMode === "pvp" || state.tab === "pvp_load" || state.tab === "pvp") {
    const mine = pvpSquadIds();
    const foe = Array.isArray(state.pvpOpponentTeam) ? state.pvpOpponentTeam : [];
    return [...mine, ...foe];
  }
  if (Array.isArray(state.practiceSquad) && state.practiceSquad.length) {
    return state.practiceSquad;
  }
  if (typeof combatSquadIds === "function") {
    try {
      const ids = combatSquadIds();
      if (Array.isArray(ids) && ids.length) return ids;
    } catch {
      /* ignore */
    }
  }
  return typeof STARTERS !== "undefined"
    ? STARTERS
    : ["starter_tank_stone", "starter_fighter_fire", "starter_support_water"];
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
  const squad = combatSquadForPrefetch();
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
  prefetchSquadCardArt(squad);
}

function battleTurnTimerSec() {
  // Always at least 1 minute (product lock). LiveOps may raise, never lower below 60.
  const n = Number(state.liveOps?.limits?.battle_turn_sec ?? state.liveops?.limits?.battle_turn_sec);
  const fromOps = Number.isFinite(n) && n > 0 ? Math.floor(n) : BATTLE_TURN_TIMER_SEC;
  return Math.max(BATTLE_TURN_TIMER_SEC, fromOps);
}

function formatBattleTimer(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function paintBattleTurnTimer(sec = state.battleTurnLeft) {
  const label = formatBattleTimer(sec);
  const el = $("battle-timer");
  if (el) el.textContent = label;
  const pve = $("pveFightTimer");
  if (pve) pve.textContent = label;
  const raidT = $("raidBattleTimer");
  if (raidT) raidT.textContent = label;
  document.querySelectorAll("[data-raid-battle-timer]").forEach((n) => {
    n.textContent = label;
  });
}

function clearBattleTurnTimer() {
  if (state.battleTurnTimer) {
    clearInterval(state.battleTurnTimer);
    state.battleTurnTimer = null;
  }
}

/** Player-turn countdown → 1:00; on 0 auto endTurn. */
function syncBattleTurnTimer({ mine = false, turn = 0, battleId = "" } = {}) {
  paintBattleTurnTimer(state.battleTurnLeft);
  if (!mine || state.battle?.result) {
    clearBattleTurnTimer();
    state.battleTurnKey = "";
    return;
  }
  const key = `${battleId || state.battle?.battleId || "b"}:${turn || state.battle?.turn || 0}`;
  if (state.battleTurnKey === key && state.battleTurnTimer) {
    paintBattleTurnTimer(state.battleTurnLeft);
    return;
  }
  clearBattleTurnTimer();
  state.battleTurnKey = key;
  state.battleTurnLeft = battleTurnTimerSec();
  paintBattleTurnTimer(state.battleTurnLeft);
  state.battleTurnTimer = setInterval(() => {
    if (!state.battle || state.battle.result || state.battle.active !== 0) {
      clearBattleTurnTimer();
      return;
    }
    state.battleTurnLeft = Math.max(0, (state.battleTurnLeft | 0) - 1);
    paintBattleTurnTimer(state.battleTurnLeft);
    if (state.battleTurnLeft <= 0) {
      clearBattleTurnTimer();
      toast(t("battle.turn.timeout", "Время хода вышло · ход передан"));
      submitAction({ kind: "endTurn" });
    }
  }, 1000);
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
    bg.style.backgroundImage = "url('/stitch-ref/e608/arena_dojo.webp?v=opt1')";
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
  if (isPve) syncPveFromStageId(state.selectedStageId);
  applyPracticeFightBackdrop();
  // Allies D-034: L→R = тыл · центр · авангард (tank right, nearest VS). Sim lanes stay 0=front…2=rear.
  // Enemies face left: L→R = авангард · центр · тыл (tank left, nearest VS) — do NOT reuse PRACTICE_VISUAL_LANES.
  const listBySide = (side) => (diff.units || []).filter((u) => u.side === side);
  const allies = PRACTICE_VISUAL_LANES.map((lane) => listBySide(0).find((u) => u.lane === lane)).filter(Boolean);
  const enemies = listBySide(1).slice().sort((a, b) => a.lane - b.lane);
  const drawCount = allies.reduce((n, u) => n + (u.drawCount || 0), 0);
  const discardCount = allies.reduce((n, u) => n + (u.discardCount || 0), 0);
  const energyMax = Math.max(energyTurnCap(diff.turn, true), energy);
  if ($("pfRound")) {
    $("pfRound").textContent = `РАУНД ${diff.turn || 1} • ${mine ? "ХОД ИГРОКА" : diff.result ? "ИТОГ" : "ХОД БОТА"}`;
  }
  if ($("pfEnergy")) {
    if (isPve) {
      const data = pveChapterData(state.pveChapter);
      const waveN = pveFightNum(state.selectedStageId);
      $("pfEnergy").textContent = `МИФМИР · ${data.title || "Глава"} · Волна ${waveN}/3 · Энергия ${energy}`;
    } else if (state.battleMode === "boss") {
      $("pfEnergy").textContent = `РЕЙД · ход ${formatBattleTimer(battleTurnTimerSec())} · Энергия ${energy}`;
    } else {
      $("pfEnergy").textContent = `ДОДЗЁ СПАРРИНГ · Энергия хода ${energy}`;
    }
  }
  syncBattleTurnTimer({
    mine,
    turn: diff.turn || 1,
    battleId: diff.battleId || "",
  });
  const waveStrip = $("pfPveWaveStrip");
  if (waveStrip) {
    waveStrip.classList.toggle("hidden", !isPve);
    if (isPve) {
      const waveN = pveFightNum(state.selectedStageId);
      waveStrip.querySelectorAll(".pf-pve-wave").forEach((el) => {
        const n = Number(el.getAttribute("data-wave") || 0);
        el.classList.toggle("is-active", n === waveN);
        el.classList.toggle("is-done", n < waveN);
      });
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
  const clearedByUnit = activeCleanseFlashes(
    diff.events,
    `${diff.battleId || ""}:${diff.seq ?? ""}`,
  );
  const paintSlots = (rootSel, units) => {
    const root = document.querySelector(`#viewPracticeFight ${rootSel}`);
    if (!root) return;
    // D-047: column side → face toward center (not type).
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
        img.alt = hero?.name || display;
        const dummyFallbacks = PRACTICE_DUMMY_ART_FALLBACKS[tid] || [];
        bindBattleUnitImg(img, art, dummyFallbacks);
        const cutout = !!isBot || !!art.includes("/battle/");
        img.classList.toggle("object-contain", cutout);
        img.classList.toggle("object-cover", !cutout);
        img.classList.toggle("object-top", !cutout);
      }
      if (img) {
        img.classList.add("mf-battle-cutout");
        card.classList.add("mf-battle-unit--cutout");
        applySpriteFacing(img, {
          artSrc: art || img.getAttribute("src"),
          desiredFace: boardFace,
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
  const keepBtn = document.querySelector("#viewPracticeFight #pfKeep");
  if (keepBtn) {
    const kc = local.keepCost ?? 1;
    keepBtn.disabled =
      !diff.canKeep || !!diff.result || !mine || state.oppThrowPlaying || state.actionBusy;
    keepBtn.innerHTML = state.selectedKeep?.mode
      ? `<span class="material-symbols-outlined text-[16px]">touch_app</span><span>Keep: клик по карте</span>`
      : `<span class="material-symbols-outlined text-[16px]">back_hand</span><span>Keep (${kc})</span>`;
  }
  const end = document.querySelector("#viewPracticeFight #pfEndTurn");
  if (end) {
    end.disabled =
      !diff.canEndTurn ||
      !!diff.result ||
      diff.active !== 0 ||
      state.oppThrowPlaying ||
      state.actionBusy;
    const hint = end.querySelector(":scope > span:last-of-type");
    if (hint) {
      const playable = liveCards.filter((c) => c.playable).length;
      hint.textContent = mine
        ? `${liveCards.length}·${playable}·${energy}/${energyMax}AP`
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
  state.actionBusy = false;
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
    if (id === "pfKeep") {
      if (!state.battle?.canKeep || state.battle?.result) return;
      state.selectedKeep = { mode: true };
      toast(state.locale === "ru" ? "Keep: клик по карте в руке" : "Keep: click a hand card");
      renderPracticeFight();
      return;
    }
    if (id === "pfEndTurn") {
      state.selectedKeep = null;
      submitAction({ kind: "endTurn" });
    }
    if (id === "pfBack") leaveLiveFightHud();
  });
  document.addEventListener("keydown", (ev) => {
    if (logicalViewId() !== "viewPracticeFight") return;
    if (ev.target.closest("input, textarea")) return;
    if (ev.code === "Escape") {
      ev.preventDefault();
      leaveLiveFightHud();
      return;
    }
    if (ev.code === "Space") {
      ev.preventDefault();
      requestEndTurn();
      return;
    }
    const digit = /^Digit([1-6])$/.exec(ev.code);
    if (digit) {
      ev.preventDefault();
      playHandCardByHotkey(Number(digit[1]) - 1);
    }
  });
}

function requestEndTurn() {
  if (state.actionBusy || state.oppThrowPlaying) return;
  if (!state.battle?.canEndTurn || state.battle?.result || state.battle?.active !== 0) return;
  if (!state.endTurnArmed) {
    state.endTurnArmed = true;
    toast(state.locale === "ru" ? "Ещё раз Space — завершить ход" : "Press Space again to end turn");
    clearTimeout(requestEndTurn._t);
    requestEndTurn._t = setTimeout(() => {
      state.endTurnArmed = false;
    }, 1400);
    return;
  }
  state.endTurnArmed = false;
  state.selectedKeep = null;
  submitAction({ kind: "endTurn" });
}

/** Hotkeys 1–6: play visible hand card; empty targetId → server TargetRule. */
function playHandCardByHotkey(slotIndex) {
  if (state.actionBusy || state.oppThrowPlaying) return;
  const diff = state.battle;
  if (!diff || diff.result || diff.active !== 0) return;
  const cards = sortHandByVisualLanes(diff.hand || [], diff.units || []);
  const c = cards[slotIndex];
  if (!c || !c.playable) return;
  if (unitCrowdControlled(diff, c.unitId)) return;
  if (state.selectedKeep?.mode) {
    state.selectedKeep = null;
    submitAction({ kind: "keep", unitId: c.unitId, handIndex: c.handIndex });
    return;
  }
  submitAction({ kind: "playCard", unitId: c.unitId, handIndex: c.handIndex, targetId: "" });
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
  // D-032: never leak enemy shield as «+N» text in PvP.
  const hpLine = u.alive
    ? seeSh && u.shield > 0
      ? `${u.hp} / ${u.maxHp} +${u.shield}`
      : `${u.hp} / ${u.maxHp}`
    : rest;
  li.className = (u.alive ? "" : "mf-unit-dead") + " mf-battle-unit--cutout";
  li.classList.toggle("is-stunned", !!(u.alive && (u.statuses || []).some((s) => s.id === "stun" || s.id === "sleep")));
  // D-047: board side → toward center (PvP foe cats face left when on the right column).
  const desiredFace = foe ? "left" : "right";
  const cutout = art
    ? spriteFaceHtml(
        `<img alt="" src="${art}" class="mf-battle-cutout ${u.alive ? "" : "mf-unit-dim"}"/>`,
        { artSrc: art, desiredFace }
      )
    : "";
  const statusHtml = statusIconsHtml(u.alive ? unitStatusList(u) : [], { cleansed: cleansedIds });
  const shieldBar =
    seeSh && u.shield > 0 && u.alive
      ? `<div class="mf-bar mf-bar--shield" title="Щит ${u.shield}"><i style="width:${Math.min(100, (u.shield / Math.max(u.maxHp, 1)) * 100)}%"></i></div>`
      : "";
  li.innerHTML = `${
    art
      ? `<figure class="mf-unit-frame">${cutout}<div class="mf-status-row">${statusHtml}</div><div class="mf-fatality" ${u.alive ? "hidden" : ""}><span>${rest}</span></div></figure>`
      : ""
  }<div><b>${name}</b><small>${element}${role ? " · " + role : ""}</small><em class="${u.alive ? "" : "mf-fatality-inline"}">${hpLine}</em><div class="mf-bars"><div class="mf-bar mf-bar--hp"><i style="width:${pct}%"></i></div>${shieldBar}</div></div>`;
  if (foe) li.dataset.foe = "1";
  decorateBattleUnitIdle(li, u, u.lane ?? 0);
  return li;
}

const PVP_FIGHT_POT_META = {
  heal: {
    potionId: "stone_skin",
    name: "Целебный отвар",
    fx: "+350 HP союзникам (stub)",
    qtyId: "pvPotHealQty",
    btnId: "pvPotHeal",
  },
  mana: {
    potionId: "spark_claw",
    name: "Эликсир маны",
    fx: "+1 AP (stub)",
    qtyId: "pvPotManaQty",
    btnId: "pvPotMana",
  },
  cleanse: {
    potionId: "cleanse",
    name: "Солнечный настой",
    fx: "Очищение DoT (stub)",
    qtyId: "pvPotCleanseQty",
    btnId: "pvPotCleanse",
  },
};

function resetPvpFightPots() {
  state.pvpFightPots = { heal: 2, mana: 1, cleanse: 2 };
}

function syncPvpAutoBattleUi() {
  const btn = $("pvAutoBattle");
  const status = $("pvAutoStatus");
  if (!btn) return;
  const on = !!state.pvpAutoBattle;
  btn.classList.toggle("is-on", on);
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  if (status) status.textContent = on ? "ВКЛ" : "ВЫКЛ";
}

function renderPvpApPips(energy, energyMax) {
  const pips = $("pvApPips");
  const num = $("pvApNum");
  const row = $("pvApRow");
  if (num) num.textContent = String(energy);
  if (row) {
    const em = row.querySelector(".pv-ap-num em");
    if (em) em.textContent = `/${energyMax} AP`;
  }
  if (!pips) return;
  const max = Math.max(1, Math.min(6, energyMax || 4));
  pips.innerHTML = "";
  for (let i = 0; i < max; i++) {
    const pip = document.createElement("i");
    pip.className = i < energy ? "is-on" : "";
    pip.textContent = "⚡";
    pips.appendChild(pip);
  }
}

function renderPvpFightPots(mine) {
  if (!state.pvpFightPots) resetPvpFightPots();
  for (const [key, meta] of Object.entries(PVP_FIGHT_POT_META)) {
    const qty = Math.max(0, Number(state.pvpFightPots[key]) || 0);
    const qtyEl = $(meta.qtyId);
    const btn = $(meta.btnId);
    if (qtyEl) qtyEl.textContent = String(qty);
    if (btn) {
      btn.classList.toggle("is-empty", qty <= 0);
      btn.disabled = !mine || qty <= 0 || !!state.battle?.result || state.oppThrowPlaying || state.actionBusy;
    }
  }
}

function renderPvpFight() {
  const diff = state.battle;
  if (!diff) return;
  const energy = diff.p1?.energy ?? 0;
  const mine = diff.active === 0 && !diff.result;
  if ($("pvRound")) {
    $("pvRound").textContent = `Раунд ${diff.turn || 1} · ${
      mine ? "Ход игрока" : diff.result ? "Итог" : "Ход AI (smoke)"
    }`;
  }
  const energyMax = Math.max(energyTurnCap(diff.turn, true), energy);
  if ($("pvEnergy")) $("pvEnergy").textContent = `Энергия ${energy}/${energyMax}`;
  renderPvpApPips(energy, energyMax);
  const root = $("viewPvpFight");
  const allyTitle = root?.querySelector(".pv-side.is-ally h2");
  const foeTitle = root?.querySelector(".pv-side.is-enemy h2");
  if (allyTitle) allyTitle.textContent = `Отряд «${pvpActiveSquadName()}»`;
  if (foeTitle) foeTitle.textContent = state.pvpOpponentName || "Свора гладиаторов";
  const allies = (diff.units || []).filter((u) => u.side === 0).sort((a, b) => a.lane - b.lane);
  const enemies = (diff.units || []).filter((u) => u.side === 1).sort((a, b) => a.lane - b.lane);
  const allyBox = $("pvAllies");
  const foeBox = $("pvEnemies");
  const clearedByUnit = activeCleanseFlashes(
    diff.events,
    `${diff.battleId || ""}:${diff.seq ?? ""}`,
  );
  if (allyBox) {
    allyBox.innerHTML = "";
    allies.forEach((u) => allyBox.appendChild(pvpUnitCard(u, false, clearedByUnit[u.id] || [])));
  }
  if (foeBox) {
    foeBox.innerHTML = "";
    enemies.forEach((u) => foeBox.appendChild(pvpUnitCard(u, true, clearedByUnit[u.id] || [])));
  }
  syncOppThrowFromBattle(diff);
  let cards = [];
  const hand = $("pvHand");
  if (hand) {
    hand.classList.add("mf-attack-hand");
    hand.innerHTML = "";
    cards = sortHandByVisualLanes(diff.hand || [], allies);
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
      if (diff.seq === 0 || diff.seq === 1) verifyPvpHandCards(diff);
      for (const c of cards) {
        hand.appendChild(makeAttackHandButton(c, diff, "mf-atk-card"));
      }
    }
  }
  const keepBtn = $("pvKeep");
  if (keepBtn) {
    const kc = diff.p1?.keepCost ?? 1;
    keepBtn.disabled =
      !diff.canKeep || !!diff.result || !mine || state.oppThrowPlaying || state.actionBusy || state.pvpAutoBattle;
    keepBtn.textContent = state.selectedKeep?.mode ? "Keep: клик по карте" : `Keep (${kc})`;
  }
  const end = $("pvEndTurn");
  if (end) {
    end.disabled =
      !diff.canEndTurn ||
      !!diff.result ||
      diff.active !== 0 ||
      state.oppThrowPlaying ||
      state.actionBusy ||
      state.pvpAutoBattle;
    const sub = $("pvEndSub");
    if (sub) {
      const playable = cards.filter((c) => c.playable).length;
      sub.textContent = mine
        ? `В РУКЕ: ${cards.length} · ${playable} ход. · ${energy}/${energyMax} AP`
        : diff.result
          ? String(diff.result)
          : "ход соперника…";
    }
  }
  const autoBtn = $("pvAutoBattle");
  if (autoBtn) {
    autoBtn.disabled = !!diff.result || state.oppThrowPlaying;
    syncPvpAutoBattleUi();
  }
  renderPvpFightPots(mine && !state.pvpAutoBattle);
  if (state.pvpAutoBattle && mine && !diff.result && !state.actionBusy && !state.oppThrowPlaying) {
    queuePvpAutoBattleStep();
  }
  if (diff.result && state.pvpAutoBattle) setPvpAutoBattle(false, { silent: true });
}

function setPvpAutoBattle(on, { silent = false } = {}) {
  const next = !!on;
  const changed = state.pvpAutoBattle !== next;
  state.pvpAutoBattle = next;
  syncPvpAutoBattleUi();
  if (!changed) return;
  if (state.pvpAutoBattle) {
    if (!silent) toast(state.locale === "ru" ? "Авто-бой включён" : "Auto-battle ON");
    queuePvpAutoBattleStep();
  } else if (!silent) {
    toast(state.locale === "ru" ? "Авто-бой выключен" : "Auto-battle OFF");
  }
}

function togglePvpAutoBattle() {
  if (state.battle?.result) return;
  setPvpAutoBattle(!state.pvpAutoBattle);
}

let _pvpAutoStepTimer = 0;
function queuePvpAutoBattleStep() {
  clearTimeout(_pvpAutoStepTimer);
  _pvpAutoStepTimer = setTimeout(() => {
    void runPvpAutoBattleStep();
  }, 220);
}

async function runPvpAutoBattleStep() {
  if (!state.pvpAutoBattle) return;
  if (logicalViewId() !== "viewPvpFight") {
    setPvpAutoBattle(false, { silent: true });
    return;
  }
  const diff = state.battle;
  if (!diff || diff.result) {
    setPvpAutoBattle(false, { silent: true });
    return;
  }
  if (state.actionBusy || state.oppThrowPlaying || diff.active !== 0) {
    queuePvpAutoBattleStep();
    return;
  }
  const allies = (diff.units || []).filter((u) => u.side === 0);
  const cards = sortHandByVisualLanes(diff.hand || [], allies)
    .filter((c) => c.playable && !unitCrowdControlled(diff, c.unitId))
    .sort((a, b) => (a.cost ?? 1) - (b.cost ?? 1));
  if (cards.length) {
    const c = cards[0];
    await submitAction({ kind: "playCard", unitId: c.unitId, handIndex: c.handIndex, targetId: "" });
    if (state.pvpAutoBattle) queuePvpAutoBattleStep();
    return;
  }
  if (diff.canEndTurn) {
    await submitAction({ kind: "endTurn" });
    if (state.pvpAutoBattle) queuePvpAutoBattleStep();
    return;
  }
  if (state.pvpAutoBattle) queuePvpAutoBattleStep();
}

async function usePvpFightPotion(slotKey) {
  const meta = PVP_FIGHT_POT_META[slotKey];
  if (!meta || !state.battle || state.battle.result) return;
  if (state.battle.active !== 0 || state.actionBusy || state.oppThrowPlaying || state.pvpAutoBattle) return;
  if (!state.pvpFightPots) resetPvpFightPots();
  const qty = Math.max(0, Number(state.pvpFightPots[slotKey]) || 0);
  if (qty <= 0) {
    toast(state.locale === "ru" ? "Баночка пуста" : "Potion empty");
    return;
  }
  // Phase 1 sim rejects ActionPotion — apply local tray smoke so the HUD tray works.
  state.pvpFightPots[slotKey] = qty - 1;
  renderPvpFightPots(true);
  toast(
    state.locale === "ru"
      ? `${meta.name}: ${meta.fx}`
      : `${meta.name}: ${meta.fx}`,
  );
  log(`pvp potion ${slotKey} → ${state.pvpFightPots[slotKey]} left (HUD stub)`, "pvp");
}

function leavePvpFight() {
  state.pvpAutoBattle = false;
  clearTimeout(_pvpAutoStepTimer);
  state.battle = null;
  state.lastResult = null;
  state.battleMode = "";
  state.pvpOpponentTeam = null;
  state.oppThrowPlaying = false;
  state.actionBusy = false;
  hideOppThrow();
  navigate("pvp", { primary: "combat" });
}

function bindPvpFight() {
  const root = $("viewPvpFight");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const id = btn.id;
    const potKey = btn.getAttribute("data-pv-pot");
    if (potKey) {
      void usePvpFightPotion(potKey);
      return;
    }
    if (id === "pvAutoBattle") {
      togglePvpAutoBattle();
      return;
    }
    if (id === "pvKeep") {
      if (state.pvpAutoBattle) return;
      if (!state.battle?.canKeep || state.battle?.result) return;
      state.selectedKeep = { mode: true };
      toast(state.locale === "ru" ? "Keep: клик по карте в руке" : "Keep: click a hand card");
      renderPvpFight();
      return;
    }
    if (id === "pvEndTurn") {
      if (state.pvpAutoBattle) return;
      state.selectedKeep = null;
      submitAction({ kind: "endTurn" });
      return;
    }
    if (id === "pvSurrender") {
      setPvpAutoBattle(false);
      submitAction({ kind: "surrender" });
    }
  });
  document.addEventListener("keydown", (ev) => {
    if (logicalViewId() !== "viewPvpFight") return;
    if (ev.target.closest("input, textarea")) return;
    if (ev.code === "Escape") {
      ev.preventDefault();
      leavePvpFight();
      return;
    }
    if (ev.code === "Space") {
      ev.preventDefault();
      if (state.pvpAutoBattle) return;
      requestEndTurn();
      return;
    }
    const digit = /^Digit([1-6])$/.exec(ev.code);
    if (digit) {
      ev.preventDefault();
      if (state.pvpAutoBattle) return;
      playHandCardByHotkey(Number(digit[1]) - 1);
    }
  });
}

function renderBattle() {
  const diff = state.battle;
  if (!diff) return;
  const local = diff.p1 || {};
  const mine = diff.active === 0 && !diff.result;
  $("battleHeading").textContent = `${diff.battleId || "?"} · T${diff.turn} · seq ${diff.seq}`;
  const energyNow = local.energy ?? 0;
  const energyMax = Math.max(energyTurnCap(diff.turn, true), energyNow);
  $("battleStats").innerHTML = `
    <span>⚡ <b>${energyNow}/${energyMax}</b></span>
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
      hand.appendChild(makeAttackHandButton(c, diff, "mf-atk-card"));
    }
  }

  $("btnEndTurn").disabled =
    !diff.canEndTurn || !!diff.result || diff.active !== 0 || state.oppThrowPlaying || state.actionBusy;
  $("btnKeep").disabled = !diff.canKeep || !!diff.result || state.oppThrowPlaying || state.actionBusy;
  $("btnKeep").textContent = state.selectedKeep?.mode
    ? state.locale === "ru"
      ? "Keep: клик по карте"
      : "Keep: click a card"
    : `Keep (${local.keepCost ?? 1})`;
  $("btnSurrender").disabled = !!diff.result || state.oppThrowPlaying || state.actionBusy;

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

function prefetchHandCardArt(hand) {
  const urls = (hand || []).map((c) => attackCardArtUrl(c.cardId)).filter(Boolean);
  if (urls.length) preloadImages(urls);
  // Also warm the rest of the current squad decks so draws/reshuffles stay instant.
  prefetchSquadCardArt(combatSquadForPrefetch());
}

async function applyDiff(diff, note = "") {
  state.battle = diff;
  state.lastResult = null;
  prefetchHandCardArt(diff?.hand);
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
  const midDungeonWin =
    !!diff?.result &&
    diff.result === "p1_win" &&
    state.battleMode === "dungeon" &&
    Number(state.dungeonNodeIndex) < dungeonPathNodes().length - 1;
  const midRaidWin =
    !!diff?.result &&
    diff.result === "p1_win" &&
    state.battleMode === "boss" &&
    !raidPathIsBossNode(state.selectedStageId);
  if (diff.result) {
    // Mid-chapter / mid-dungeon / mid-raid wins skip victory view until final boss node.
    if (!midChapterPveWin && !midDungeonWin && !midRaidWin) {
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
      } else if (state.battleMode === "boss" || state.battleMode === "dungeon") {
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
  } else if (midDungeonWin) {
    state.dungeonAdvancing = true;
    await advanceDungeonNodeAfterWin();
  } else if (midRaidWin) {
    await advanceRaidNodeAfterWin();
  } else if (
    diff?.result === "p1_win" &&
    state.battleMode === "dungeon" &&
    Number(state.dungeonNodeIndex) >= dungeonPathNodes().length - 1
  ) {
    grantDungeonNodeLoot();
    grantDungeonBossLoot();
  } else if (
    diff?.result === "p1_win" &&
    state.battleMode === "boss" &&
    raidPathIsBossNode(state.selectedStageId)
  ) {
    grantRaidLootStub();
  }
}

async function createPvE({ autoPlay = false, seed = 0, stageId = null, team = null, carryAlive = null } = {}) {
  const plan = resolveBattlePlan(state.battleMode || "pve");
  // Explicit args win; otherwise mode plan (never leak practice_dummy into Mythmir, etc.).
  const sid = stageId || plan.stageId || state.selectedStageId || YARD_STAGE;
  if (parseMythmirStageId(sid)) {
    state.selectedStageId = sid;
    syncPveFromStageId(sid);
  } else if (plan.mode === "practice" || plan.mode === "boss" || plan.mode === "dungeon") {
    state.selectedStageId = sid;
  }
  const squad = Array.isArray(team) && team.length === 3 ? team : plan.team;
  const carry =
    Array.isArray(carryAlive) && carryAlive.length === 3
      ? carryAlive
      : plan.mode === "pve"
        ? plan.carryAlive
        : null;
  const body = {
    stageId: sid,
    team: squad,
    potions: [],
    seed,
    autoPlay,
    teamGear: teamGearForTemplates(squad, "pve"),
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
  if (state.oppThrowPlaying || state.actionBusy) return;
  state.actionBusy = true;
  try {
    const prevActive = state.battle.active;
    const prevTurn = state.battle.turn;
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
    // After P1 endTurn the server resolves P2 (PvE bots + local PvP smoke).
    // Paint stateDiff FIRST (HP/floats), then Axie-style 6 face-down throw overlay.
    const shouldThrow =
      action.kind === "endTurn" && prevActive === 0 && state.battle && !state.battle.result;
    // Lock hand before paint so mid-throw taps cannot double-submit.
    if (shouldThrow) state.oppThrowPlaying = true;
    await applyDiff(data, `${action.kind}${action.unitId ? " " + action.unitId : ""}`);
    if (shouldThrow) {
      if ($("pfRound")) $("pfRound").textContent = `РАУНД ${prevTurn || 1} • ХОД БОТА`;
      if ($("pvRound")) $("pvRound").textContent = `Раунд ${prevTurn || 1} · Ход AI (smoke)`;
      await playOpponentDiscardThrow({ holdMs: data?.result ? 160 : 280 });
      // Re-sync labels after throw (applyDiff already painted player-active state).
      if (state.battle && !state.battle.result) {
        if ($("pfRound")) {
          $("pfRound").textContent = `РАУНД ${state.battle.turn || 1} • ХОД ИГРОКА`;
        }
        if ($("pvRound")) {
          $("pvRound").textContent = `Раунд ${state.battle.turn || 1} · Ход игрока`;
        }
      }
    }
  } catch (err) {
    state.oppThrowPlaying = false;
    hideOppThrow();
    log(`reject ${err.status || ""}: ${err.message}`);
    const msg = String(err.message || "reject");
    const clawRuffle = /claw_mode:\s*no ruffle/i.test(msg);
    toast(
      state.locale === "ru"
        ? (clawRuffle
            ? "Режим когтей: карты со «Взъерошить» нельзя в этот ход"
            : `Не удалось: ${msg}`
          ).slice(0, 120)
        : (clawRuffle
            ? "Claw Mode: ruffle cards blocked this turn"
            : `Rejected: ${msg}`
          ).slice(0, 120),
    );
    // Soft resync — re-render last known state so UI is not stuck disabled.
    if (state.battle) {
      try {
        renderPracticeFight();
        renderPvpFight();
        renderBattle();
      } catch {
        /* ignore */
      }
    }
  } finally {
    state.actionBusy = false;
    if (state.battle) {
      try {
        renderPracticeFight();
        renderPvpFight();
        renderBattle();
      } catch {
        /* ignore */
      }
    }
  }
}

async function startYard(autoPlay = false) {
  try {
    if (!state.battleMode) state.battleMode = "pve";
    const plan = resolveBattlePlan(state.battleMode);
    if (plan.mode === "pve" || plan.mode === "boss" || plan.mode === "dungeon") {
      if (!spendBowlStub()) return;
    }
    if (plan.mode === "practice" && (!Array.isArray(plan.team) || plan.team.length !== 3)) {
      toast("Выберите 3 котиков в боевой отряд");
      return;
    }
    const diff = await createPvE({
      autoPlay,
      seed: autoPlay ? 20261104 : 0,
      stageId: plan.stageId,
      team: plan.team,
      carryAlive: plan.carryAlive,
    });
    await applyDiff(diff, autoPlay ? "CreatePvE autoPlay" : `CreatePvE ${plan.stageId}`);
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
    if (!list) return;
    list.innerHTML = "";
    for (const item of data || []) {
      const li = document.createElement("li");
      li.innerHTML = `<span>${item.battleId} · ${item.result || "?"} · frames ${item.frameCount ?? "?"}</span>`;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wire-btn";
      b.textContent = state.locale === "ru" ? "Открыть" : "Open";
      b.addEventListener("click", async () => {
        const { data: frames } = await api(
          `/api/battle/v1/GetReplay?battleId=${encodeURIComponent(item.battleId)}`,
        );
        const n = (frames || []).length;
        const last = n ? frames[n - 1] : null;
        const summary = last
          ? `T${last.turn ?? "?"} · ${last.result || item.result || "?"} · ${n} frames`
          : `${n} frames`;
        log(`replay ${item.battleId}: ${summary}`, "pvp");
        toast(`Реплей ${item.battleId}: ${summary}`);
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
    ensurePvpSquad();
    const team1 = [...state.pvpSquad];
    const team2 = rollPvpOpponentTeam(team1);
    state.pvpOpponentTeam = team2;
    const { data } = await api("/api/battle/v1/CreatePvP", {
      method: "POST",
      body: JSON.stringify({
        matchId: `web_${Date.now()}`,
        team1,
        team2,
        seed: 20261104,
        autoPlay: true,
        teamGear1: teamGearForTemplates(team1, "pvp"),
        teamGear2: teamGearForTemplates(team2, "pvp"),
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
  entrance: { label: "Волна 1", wave: "Волна 1", short: "1" },
  tunnel: { label: "Волна 2", wave: "Волна 2", short: "2" },
  boss: { label: "Волна 3", wave: "Волна 3 · Босс", short: "3" },
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
      "Барон Гав — соло-питбосс Цитадели. Держите танк·DPS·саппорт; щиты не спасают от pierce.",
    tip: "Держите танка впереди — между волнами живые котики восстанавливают HP, мёртвые не воскресают (D-039).",
    affixes: [
      { icon: "🛡", title: "Лай-щит", desc: "Солдаты кастуют shield" },
      { icon: "🐕", title: "Укус Стаи", desc: "Ближний урон по фронту" },
      { icon: "💥", title: "Ярость Барона", desc: "Питбосс бьёт сильнее солдат" },
      { icon: "⚡", title: "Тычок", desc: "Лёгкий добивающий удар" },
    ],
    stages: {
      // Enemy names = D-051 wave layouts (must match content/stages/mythmir_*).
      entrance: {
        art: "/stitch-assets/pve-fight/ch1-entrance.webp",
        enemyTitle: "СТАЯ · ВОЛНА 1/3 (СОЛДАТЫ)",
        enemies: ["Пёс-задира", "Пёс-задира", "Пёс-задира"],
        tip: "Этап 1/3 · Три бойца Железной Цитадели",
      },
      tunnel: {
        art: "/stitch-assets/pve-fight/ch1-tunnel.webp",
        enemyTitle: "СТАЯ · ВОЛНА 2/3 (СОЛДАТЫ)",
        enemies: ["Пёс-щитоносец", "Пёс-лучник", "Пёс-лучник"],
        tip: "Этап 2/3 · Танк + два лучника",
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
        enemies: ["Волк-лучник", "Шаман инея", "Волк-лучник"],
        tip: "Этап 1/3 · Лучник · хил · лучник",
      },
      tunnel: {
        art: "/stitch-assets/pve-fight/ch2-tunnel.webp",
        enemyTitle: "СТАЯ · ВОЛНА 2/3 (СОЛДАТЫ)",
        enemies: ["Волк-лучник", "Волк-лучник", "Волк-лучник"],
        tip: "Этап 2/3 · Три лучника (center + taunt)",
      },
      boss: {
        art: "/stitch-assets/pve-fight/ch2-boss.webp",
        enemyTitle: "СТАЯ · ВОЛНА 3/3 (ХИЛ · БОСС · ХИЛ)",
        enemies: ["Шаман инея", "Лютый Клык", "Шаман инея"],
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
        enemies: ["Пёс-углежуй", "Алый щитоносец", "Пёс-углежуй"],
        tip: "Этап 1/3 · Боец · танк · боец",
      },
      tunnel: {
        art: "/stitch-assets/pve-fight/ch5-tunnel.webp",
        enemyTitle: "СТАЯ · ВОЛНА 2/3 (СОЛДАТЫ)",
        enemies: ["Пёс-искромёт", "Алый щитоносец", "Пёс-искромёт"],
        tip: "Этап 2/3 · Убийца · танк · убийца",
      },
      boss: {
        art: "/stitch-assets/pve-fight/ch5-boss.webp",
        enemyTitle: "СТАЯ · ВОЛНА 3/3 (ТАНК · БОСС · ТАНК)",
        enemies: ["Алый щитоносец", "Алый Вожак", "Алый щитоносец"],
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
        enemies: ["Трупный мясник", "Ядовитый коготь", "Трупный мясник"],
        tip: "Этап 1/3 · Боец · убийца · боец",
      },
      tunnel: {
        art: "/stitch-assets/pve-fight/ch3-tunnel.webp",
        enemyTitle: "СТАЯ · ВОЛНА 2/3 (СОЛДАТЫ)",
        enemies: ["Трупный мясник", "Ядовитый коготь", "Трупный мясник"],
        tip: "Этап 2/3 · Боец · убийца · боец (сильнее)",
      },
      boss: {
        art: "/stitch-assets/pve-fight/ch3-boss.webp",
        enemyTitle: "СТАЯ · ВОЛНА 3/3 (УБИЙЦЫ + НЕКРО)",
        enemies: ["Ядовитый коготь", "Некропёс Мор", "Ядовитый коготь"],
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
    threatStars: "★★★★★",
    description:
      "Фантом Гул рубит тыл + AoE. Снимите хил или закройте танком — иначе вырежет саппорт.",
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
        tip: "Этап 1/3 · Танк · боец · хил",
      },
      tunnel: {
        art: "/stitch-assets/pve-fight/ch4-boss.webp",
        enemyTitle: "СТАЯ · ВОЛНА 2/3 (СОЛДАТЫ)",
        enemies: ["Клинок душ", "Блуждающий огонёк", "Клинок душ"],
        tip: "Этап 2/3 · Боец · хил · боец",
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
    waves[0].textContent = "Волна 1";
    waves[1].textContent = "Волна 2";
    waves[2].textContent = `Волна 3 · ${data.bossName}`;
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
  setText("pveFightBossBadge", st === "boss" ? `ВОЛНА 3 · ${data.bossName}` : `ВОЛНА ${PVE_STAGE_META[st].short}`);
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
  // C4: stub chrome only — do not dual-paint wire battle; tip if opened live.
  const tipEl = $("pveFightStageTip");
  if (tipEl) {
    tipEl.textContent = state.battle
      ? "Live Мифмир идёт в HUD тренировки (practice_fight). Этот экран — chrome stub."
      : tipEl.textContent;
  }
}

/** Arena presets: sim order front(tank) → mid(DPS) → rear(support). */
const PVP_ARENA_SQUADS = {
  "1": {
    name: "Мурр-Оплот",
    team: ["shop_tank_fire", "shop_fighter_fire", "shop_support_water"],
  },
  "2": {
    name: "Теневой Клык",
    team: ["shop_tank_water", "shop_assassin_fire", "shop_support_wind"],
  },
  "3": {
    name: "Ледяной Строй",
    team: ["shop_tank_water", "shop_mage_water", "shop_support_water"],
  },
};
const PVP_DPS_ROLES = new Set(["fighter", "assassin", "ranger", "mage"]);
const PVP_FOE_NAMES = ["Свора Гладиаторов", "Клык Арены", "Тень Колизея", "Рёв Трибун", "Лапы Судьбы"];

function pickRandomItem(list) {
  if (!list?.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/** MM stub: random tank + DPS + support from all shop cats. */
function rollPvpOpponentTeam(excludeIds = []) {
  const exclude = new Set(excludeIds || []);
  const pool = Object.values(PRACTICE_HEROES);
  const byRole = (pred) => {
    const all = pool.filter(pred);
    const fresh = all.filter((h) => !exclude.has(h.templateId));
    return fresh.length ? fresh : all;
  };
  const tank = pickRandomItem(byRole((h) => h.role === "tank"));
  const dps = pickRandomItem(byRole((h) => PVP_DPS_ROLES.has(h.role)));
  const support = pickRandomItem(byRole((h) => h.role === "support"));
  return [tank, dps, support].map((h) => h?.templateId).filter(Boolean);
}

function ensurePvpSquad() {
  const preset = PVP_ARENA_SQUADS[state.pvpArenaSquadId] || PVP_ARENA_SQUADS["1"];
  if (!Array.isArray(state.pvpSquad) || state.pvpSquad.length !== 3) {
    state.pvpSquad = [...preset.team];
  }
  return state.pvpSquad;
}

function applyPvpArenaSquad(id) {
  const preset = PVP_ARENA_SQUADS[id];
  if (!preset) return;
  state.pvpArenaSquadId = id;
  state.pvpSquad = [...preset.team];
  state.pvpOpponentTeam = null;
  state.pvpOpponentName = "";
}

function pvpRosterEntry(templateId) {
  const hero = practiceHeroByTemplate(templateId);
  const meta = starterMeta(templateId);
  const role = hero?.role || meta.role || "?";
  const el = practiceElementOf(hero || { templateId }) || meta.element || "";
  const roleRu = hero?.roleRu || CAT_ROLE_RU[role] || role;
  const elRu = CAT_ELEMENT_RU[el] || el;
  const hp = Number(hero?.hp) || 30;
  return {
    templateId,
    name: hero?.short || hero?.name || catSheetName({ templateId }),
    fullName: hero?.name || catSheetName({ templateId }),
    role: elRu ? `${roleRu} · ${elRu}` : roleRu,
    roleRu,
    roleKey: role,
    lvl: hero?.lvl || 1,
    hp,
    hpLabel: `${hp} HP`,
    art: catHeroArt(templateId) || "/stitch-assets/cat-heroes/fighter-fire.jpg?v=elven18",
    bm: hero?.bm || 4500,
  };
}

/** Visual L→R тыл · центр · авангард from sim [front, mid, rear]. */
function pvpVisualRoster(teamIds) {
  const ids = Array.isArray(teamIds) ? teamIds : [];
  return PRACTICE_VISUAL_LANES.map((i) => ids[i])
    .filter(Boolean)
    .map(pvpRosterEntry);
}

function pvpActiveSquadName() {
  return PVP_ARENA_SQUADS[state.pvpArenaSquadId]?.name || "Мурр-Оплот";
}

/** Open ranked duel load sheet after MM stub finds a foe. */
function openPvpLoad() {
  if (!pvpUnlocked()) {
    showGateTip(t("gate.tip.pvp", "PvP откроется после 3 побед в Мифмире или тренировке"));
    return;
  }
  ensurePvpSquad();
  if (!Array.isArray(state.pvpOpponentTeam) || state.pvpOpponentTeam.length !== 3) {
    state.pvpOpponentTeam = rollPvpOpponentTeam(state.pvpSquad);
    state.pvpOpponentName = pickRandomItem(PVP_FOE_NAMES) || "Свора Гладиаторов";
  }
  state.pvpStarting = false;
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

function pvpLoadRosters() {
  ensurePvpSquad();
  if (!Array.isArray(state.pvpOpponentTeam) || state.pvpOpponentTeam.length !== 3) {
    state.pvpOpponentTeam = rollPvpOpponentTeam(state.pvpSquad);
  }
  if (!state.pvpOpponentName) {
    state.pvpOpponentName = pickRandomItem(PVP_FOE_NAMES) || "Свора Гладиаторов";
  }
  return {
    ally: pvpVisualRoster(state.pvpSquad),
    foe: pvpVisualRoster(state.pvpOpponentTeam),
  };
}

/** Stitch pvp_versus_3v3 card plate (framed portrait + role + HP). D-037: load uses studio art. */
function pvpLoadCardHtml(c) {
  const safeName = String(c.fullName || c.name || "").replace(/"/g, "&quot;");
  const role = String(c.roleRu || c.role || "").replace(/</g, "");
  const src = c.art || "";
  const lvl = c.lvl || 1;
  const hp = Number(c.hp) || 0;
  return `<li>
<figure>
<img alt="${safeName}" src="${src}"/>
<span class="pvp-load-role">${role}</span>
<span class="pvp-load-lvl">${lvl}</span>
</figure>
<b title="${safeName}">${c.name || safeName}</b>
<div class="pvp-load-hp"><span>HP</span><em>${formatSheetNum(hp)}</em></div>
<div class="pvp-load-hp-bar" aria-hidden="true"><i></i></div>
</li>`;
}

function renderPvpLoad() {
  const ally = $("pvpLoadAllyList");
  const enemy = $("pvpLoadEnemyList");
  const { ally: allyRoster, foe: foeRoster } = pvpLoadRosters();
  if (ally) ally.innerHTML = allyRoster.map(pvpLoadCardHtml).join("");
  if (enemy) enemy.innerHTML = foeRoster.map(pvpLoadCardHtml).join("");
  const sumBm = (rows) => rows.reduce((n, c) => n + (c.bm || 0), 0);
  const allyName = `«${pvpActiveSquadName()}»`;
  const foeName = `«${state.pvpOpponentName || "Свора Гладиаторов"}»`;
  const allyBmTxt = `${formatSheetNum(sumBm(allyRoster))} БМ`;
  const foeBmTxt = `${formatSheetNum(sumBm(foeRoster))} БМ`;
  const setText = (id, text) => {
    const el = $(id);
    if (el) el.textContent = text;
  };
  setText("pvpLoadAllyName", allyName);
  setText("pvpLoadEnemyName", foeName);
  setText("pvpLoadAllyBm", allyBmTxt);
  setText("pvpLoadEnemyBm", foeBmTxt);
  bindPvpLoad();
  if (!state.pvpLoadTimer) startPvpLoadSync();
}
function startPvpLoadSync() {
  clearInterval(state.pvpLoadTimer);
  setPvpLoadProgress(0);
  state.battleMode = "pvp";
  preloadScreenBgs("pvpLoad", "arenaInterior");
  prefetchSquadCardArt(combatSquadForPrefetch());
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
      pvpStart();
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
    state.pvpStarting = false;
    state.pvpOpponentTeam = null;
    navigate("pvp", { primary: "combat" });
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

/** Hand cards must belong to that unit's N=6 deck (shop template). */
function verifyPvpHandCards(diff) {
  if (!diff?.hand?.length) return true;
  let ok = true;
  for (const c of diff.hand) {
    const tid = unitTemplateId(c.unitId);
    const shop = deckShopTemplate(tid);
    const stem = String(c.cardId || "").replace(/^card_/, "");
    if (shop && stem && !stem.startsWith(shop)) {
      ok = false;
      log(`PvP card mismatch: ${c.cardId} ∉ deck ${shop} (${tid})`, "pvp");
    }
  }
  if (ok) log(`PvP hand ok · ${diff.hand.length} карт под героев`, "pvp");
  return ok;
}

/** Interactive PvP (same core; P2 = scripted AI until live MM — B1/B2 smoke). */
async function pvpStart() {
  if (state.pvpStarting) return;
  if (!pvpUnlocked()) {
    showGateTip(t("gate.tip.pvp", "PvP откроется после 3 побед в Мифмире или тренировке"));
    return;
  }
  if (!spendTicketStub()) return;
  state.pvpStarting = true;
  if (state.tab === "pvp_load" && (state.pvpLoadPct || 0) < 100) {
    setPvpLoadProgress(100);
    clearInterval(state.pvpLoadTimer);
    state.pvpLoadTimer = null;
  }
  try {
    clearInterval(state.pvpLoadTimer);
    state.pvpLoadTimer = null;
    state.battleMode = "pvp";
    ensurePvpSquad();
    const team1 = [...state.pvpSquad];
    const team2 =
      Array.isArray(state.pvpOpponentTeam) && state.pvpOpponentTeam.length === 3
        ? [...state.pvpOpponentTeam]
        : rollPvpOpponentTeam(team1);
    state.pvpOpponentTeam = team2;
    toast(
      t(
        "pvp.smoke.ai",
        "PvP smoke: соперник — скриптовый AI (общий MM позже)",
      ),
    );
    const { data } = await api("/api/battle/v1/CreatePvP", {
      method: "POST",
      body: JSON.stringify({
        matchId: `web_${Date.now()}`,
        team1,
        team2,
        seed: Date.now() % 1e9,
        autoPlay: false,
        teamGear1: teamGearForTemplates(team1, "pvp"),
        teamGear2: teamGearForTemplates(team2, "pvp"),
      }),
    });
    verifyPvpHandCards(data);
    state.pvpAutoBattle = false;
    resetPvpFightPots();
    await applyDiff(data, "CreatePvP");
  } catch (err) {
    log(`PvP fail: ${err.message}`, "pvp");
    alert(err.message);
  } finally {
    state.pvpStarting = false;
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

  if (viewId === "viewBossDungeon") {
    renderDungeonLobby();
  }

  if (viewId === "viewPracticeFight" && state.battle && !state.battle.result) {
    // C3: stitch fight is SoT paint — skip dual wire renderBattle.
    renderPracticeFight();
    bindPracticeFight();
    return;
  }
  if (viewId === "viewPvpFight" && state.battle && !state.battle.result) {
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
  if (viewId === "viewPveFight") {
    // C4: painted PvE fight is stub chrome — live Mythmir uses practice HUD.
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
      bindBattleModeLobbies();
      break;
    case "boss_raid":
      state.raidBattlePreview = false;
      renderRaidPath();
      bindBattleModeLobbies();
      break;
    case "raid_battle":
      state.raidBattlePreview = true;
      renderRaidBattleStub();
      bindRaidBattleStub();
      break;
    case "pvp":
      if ($("pvpEyebrow")) $("pvpEyebrow").textContent = t("hub.tab.pvp");
      if ($("pvpTitle")) $("pvpTitle").textContent = t("hub.tab.pvp");
      renderUnlockProgress();
      bindPvpArena();
      renderPvpArena();
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
    case "guild_hub":
    case "guild_members":
    case "guild_tech":
    case "guild_treasury":
      renderGuild();
      bindGuildHalls();
      break;
    case "guild_battle":
      renderGuild();
      bindBattleModeLobbies();
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
        navigate("pvp", { primary: "combat" });
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
  // Prefetch fight backdrop + full squad card decks during the load bar.
  preloadScreenBgs("dojoLoad", "dojo");
  prefetchSquadCardArt(combatSquadForPrefetch());
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

function clearPvpSearchTimer() {
  if (state.pvpSearchTimer) {
    clearTimeout(state.pvpSearchTimer);
    state.pvpSearchTimer = null;
  }
  state.pvpSearching = false;
  const cta = $("btnArenaSearch");
  if (cta) {
    cta.classList.remove("is-searching");
    cta.disabled = false;
  }
}

function renderPvpArenaActiveTeam() {
  const box = $("arenaActiveTeam");
  if (!box) return;
  ensurePvpSquad();
  const rows = state.pvpSquad.map(pvpRosterEntry);
  const tone = {
    tank: {
      card: "border-primary/40",
      badge: "bg-primary/15 text-primary border-primary/35",
      bar: "bg-primary",
      bm: "text-primary",
    },
    fighter: {
      card: "border-tertiary/40",
      badge: "bg-tertiary/15 text-tertiary border-tertiary/35",
      bar: "bg-tertiary",
      bm: "text-tertiary",
    },
    assassin: {
      card: "border-primary/40",
      badge: "bg-primary/15 text-primary border-primary/35",
      bar: "bg-primary",
      bm: "text-primary",
    },
    ranger: {
      card: "border-secondary/40",
      badge: "bg-secondary/15 text-secondary border-secondary/35",
      bar: "bg-secondary",
      bm: "text-secondary",
    },
    mage: {
      card: "border-tertiary/40",
      badge: "bg-tertiary/15 text-tertiary border-tertiary/35",
      bar: "bg-tertiary",
      bm: "text-tertiary",
    },
    support: {
      card: "border-secondary/40",
      badge: "bg-secondary/15 text-secondary border-secondary/35",
      bar: "bg-secondary",
      bm: "text-secondary",
    },
  };
  box.innerHTML = rows
    .map((c) => {
      const t = tone[c.roleKey] || tone.tank;
      return `<article class="relative flex gap-2 rounded-lg border ${t.card} bg-[#1a1613] overflow-hidden min-h-[4.6rem] flex-shrink-0">
<img alt="${c.name}" class="w-14 self-stretch object-cover object-top" src="${c.art}"/>
<div class="flex-1 min-w-0 py-1.5 pr-2 flex flex-col justify-between">
<div class="flex items-center justify-between gap-1">
<span class="font-bold text-[12px] text-white truncate">${c.name}</span>
<span class="text-[9px] px-1.5 py-0.5 rounded border font-bold ${t.badge}">${(c.role.split(" · ")[0] || c.role).toUpperCase()}</span>
</div>
<div class="flex items-center gap-2 text-[10px] text-outline"><span>${c.role}</span></div>
<div class="h-1.5 rounded-full bg-black/50 overflow-hidden"><i class="block h-full w-[80%] ${t.bar} rounded-full"></i></div>
<div class="flex justify-between text-[10px]"><span class="text-on-surface-variant">${c.hp}</span><span class="${t.bm} font-bold">${formatSheetNum(c.bm)} БМ</span></div>
</div>
</article>`;
    })
    .join("");
}

function renderPvpArenaOppPreview(mode = "idle") {
  const box = $("arenaOppPreview");
  if (!box) return;
  const labels = ["Танк", "ДПС", "Саппорт"];
  const team =
    mode === "found" && Array.isArray(state.pvpOpponentTeam) ? state.pvpOpponentTeam.map(pvpRosterEntry) : null;
  box.innerHTML = [0, 1, 2]
    .map((i) => {
      if (mode === "searching") {
        return `<div class="rounded-lg border border-dashed border-primary/40 bg-[#1a1613]/80 h-20 flex flex-col items-center justify-center gap-0.5 text-primary animate-pulse" data-opp-slot="${i}">
<span class="material-symbols-outlined text-[20px]">hourglass_top</span>
<span class="text-[9px] font-bold">${labels[i]}…</span>
</div>`;
      }
      if (team?.[i]) {
        const c = team[i];
        return `<div class="rounded-lg border border-secondary/40 bg-[#1a1613] h-20 overflow-hidden flex flex-col items-center justify-end relative" data-opp-slot="${i}">
<img alt="${c.name}" class="absolute inset-0 w-full h-full object-cover object-top opacity-90" src="${c.art}"/>
<span class="relative z-10 w-full text-center text-[9px] font-bold bg-black/65 text-white py-0.5">${c.name}</span>
</div>`;
      }
      return `<div class="rounded-lg border border-dashed border-outline-variant/50 bg-[#1a1613]/80 h-20 flex flex-col items-center justify-center gap-0.5 text-outline" data-opp-slot="${i}">
<span class="material-symbols-outlined text-[20px]">person_search</span>
<span class="text-[9px] font-bold">${labels[i]}</span>
</div>`;
    })
    .join("");
}

function renderPvpArena() {
  const root = $("viewPvp");
  if (!root) return;
  ensurePvpSquad();
  const id = state.pvpArenaSquadId || "1";
  root.querySelectorAll("[data-arena-squad]").forEach((card) => {
    const on = card.getAttribute("data-arena-squad") === id;
    card.classList.toggle("is-on", on);
    const badge = card.querySelector("header i");
    if (on) {
      if (!badge) {
        const mark = document.createElement("i");
        mark.className = "text-[9px] text-secondary not-italic font-bold";
        mark.textContent = "Активен";
        card.querySelector("header")?.appendChild(mark);
      } else {
        badge.textContent = "Активен";
      }
    } else if (badge) {
      badge.remove();
    }
    const preset = PVP_ARENA_SQUADS[card.getAttribute("data-arena-squad")];
    if (preset) {
      const imgs = card.querySelectorAll("img");
      preset.team.forEach((tid, i) => {
        if (imgs[i]) imgs[i].src = catHeroArt(tid) || imgs[i].src;
      });
      const title = card.querySelector("p");
      if (title) title.textContent = preset.name;
    }
  });
  root.querySelectorAll("[data-arena-mode]").forEach((btn) => {
    const on = btn.getAttribute("data-arena-mode") === (state.pvpArenaMode || "ranked");
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  renderPvpArenaActiveTeam();
  if (state.pvpSearching) renderPvpArenaOppPreview("searching");
  else if (state.pvpOpponentTeam?.length === 3) renderPvpArenaOppPreview("found");
  else renderPvpArenaOppPreview("idle");
  const status = $("arenaSearchStatus");
  if (status && !state.pvpSearching) {
    status.textContent = state.pvpOpponentTeam?.length === 3 ? "Соперник найден" : "Готов к поиску";
  }
}

function startPvpSearch() {
  if (!pvpUnlocked()) {
    showGateTip(t("gate.tip.pvp", "PvP откроется после 3 побед в Мифмире или тренировке"));
    return;
  }
  if (state.pvpSearching) return;
  ensurePvpSquad();
  clearPvpSearchTimer();
  state.pvpSearching = true;
  state.pvpOpponentTeam = null;
  state.pvpOpponentName = "";
  const cta = $("btnArenaSearch");
  const status = $("arenaSearchStatus");
  if (cta) {
    cta.classList.add("is-searching");
    cta.disabled = true;
  }
  if (status) status.textContent = "Поиск соперника…";
  renderPvpArenaOppPreview("searching");
  toast("Поиск по рангу + БМ…");
  const delay = 1200 + Math.floor(Math.random() * 1400);
  state.pvpSearchTimer = setTimeout(() => {
    state.pvpSearchTimer = null;
    state.pvpSearching = false;
    state.pvpOpponentTeam = rollPvpOpponentTeam(state.pvpSquad);
    state.pvpOpponentName = pickRandomItem(PVP_FOE_NAMES) || "Свора Гладиаторов";
    if (cta) {
      cta.classList.remove("is-searching");
      cta.disabled = false;
    }
    if (status) status.textContent = "Соперник найден";
    renderPvpArenaOppPreview("found");
    const names = state.pvpOpponentTeam.map((id) => pvpRosterEntry(id).name).join(" · ");
    toast(`Найден отряд: ${names}`);
    window.setTimeout(() => openPvpLoad(), 450);
  }, delay);
}

/** Painted guild hall / hub / members / tech / treasury — local CTAs + tips. */
function bindGuildHalls() {
  const ids = ["viewGuild", "viewGuildHub", "viewGuildMembers", "viewGuildTech", "viewGuildTreasury"];
  for (const id of ids) {
    const root = $(id);
    if (!root || root.dataset.guildHallBound === "1") continue;
    root.dataset.guildHallBound = "1";
    root.addEventListener("click", (ev) => {
      const tip = ev.target.closest("[data-hud-action]");
      if (tip && root.contains(tip)) {
        const act = tip.getAttribute("data-hud-action");
        ev.preventDefault();
        if (act === "guild-claim" || act === "guild-donate" || act === "guild-research") {
          toast("Скоро · награда / вклад ордена");
          return;
        }
        if (act === "guild-officers") {
          toast("Совет офицеров: скоро");
          return;
        }
        if (act === "guild-leave") {
          toast("Покинуть орден: скоро");
          return;
        }
        if (act === "guild-hearth") {
          toast("Дрова для очага: скоро");
        }
      }
    });
  }
}

function bindRaidBattleStub() {
  const root = $("viewRaidBattle");
  if (!root || root.dataset.raidBattleBound === "1") return;
  root.dataset.raidBattleBound = "1";
  root.addEventListener("click", (ev) => {
    const voteBtn = ev.target.closest("[data-raid-vote]");
    if (voteBtn && root.contains(voteBtn) && state.raidPathVoteOpen) {
      ev.preventDefault();
      castRaidPathVote(voteBtn.getAttribute("data-raid-vote"));
      return;
    }
    const btn = ev.target.closest("[data-hud-action]");
    if (!btn || !root.contains(btn)) return;
    const act = btn.getAttribute("data-hud-action");
    ev.preventDefault();
    if (act === "raid-path-bots") {
      fillRaidPathBotVotes();
      return;
    }
    if (act === "raid-path-lock") {
      if (resolveRaidPathVote()) {
        toast("Путь зафиксирован · жмите «В бой» на следующий узел");
      }
      return;
    }
    if (act === "raid-battle-start") {
      if (state.raidPathVoteOpen) {
        toast("Сначала выберите путь голосованием");
        return;
      }
      if (state.battle && !state.battle.result && state.battleMode === "boss") {
        submitAction({ kind: "endTurn" });
        return;
      }
      startRaidNodeFight({ autoPlay: false });
      return;
    }
    if (act === "raid-battle-back") {
      state.raidBattlePreview = false;
      state.raidPathVoteOpen = false;
      navigate("boss_raid", { primary: "combat" });
      return;
    }
    if (act === "raid-battle-form") {
      state.raidBattlePreview = false;
      state.formationMode = "raid";
      state.battleMode = "boss";
      navigate("formation", { primary: "combat" });
    }
  });
}

/** Dense painted lobbies: dungeon / raid / guild war CTAs + local selection. */
function bindBattleModeLobbies() {
  for (const id of ["viewBossDungeon", "viewBossRaid", "viewGuildBattle"]) {
    const root = $(id);
    if (!root || root.dataset.modeLobbyBound === "1") continue;
    root.dataset.modeLobbyBound = "1";
    root.addEventListener("click", (ev) => {
      const pick = ev.target.closest(".dungeon-pick[data-dungeon]");
      if (pick && root.contains(pick) && !pick.classList.contains("is-locked")) {
        const id = pick.getAttribute("data-dungeon");
        if (id === "loot") return;
        selectDungeon(id, state.dungeonPath);
        toast(`Данж: ${dungeonById()?.title_ru || id}`);
        return;
      }
      // Path short/long is voted in-battle after entry squad — ignore lobby picks.
      if (ev.target.closest("[data-dungeon-path]")) return;
      const forkBtn = ev.target.closest("[data-dungeon-fork]");
      if (forkBtn && root.contains(forkBtn)) {
        selectDungeon(state.selectedDungeonId, "long", forkBtn.getAttribute("data-dungeon-fork"));
        toast(`Развилка F2: ${forkBtn.textContent.trim()}`);
        return;
      }
      const filter = ev.target.closest("[data-dungeon-filter]");
      if (filter && root.contains(filter)) {
        root.querySelectorAll("[data-dungeon-filter]").forEach((el) => el.classList.toggle("is-on", el === filter));
        return;
      }
      const sizeBtn = ev.target.closest("[data-gvg-size]");
      if (sizeBtn && root.contains(sizeBtn)) {
        const n = Number(sizeBtn.getAttribute("data-gvg-size")) || 3;
        state.guildBattleSize = n;
        root.querySelectorAll("[data-gvg-size]").forEach((el) => el.classList.toggle("is-on", el === sizeBtn));
        toast(`Формат GvG: ${n}v${n}`);
        return;
      }
      if (id === "viewBossRaid" || root.id === "viewBossRaid") {
        const raidPick = ev.target.closest("[data-raid-id]");
        if (raidPick && root.contains(raidPick)) {
          state.raidId = raidPick.getAttribute("data-raid-id") || state.raidId;
          resetRaidPathVote();
          renderRaidPath();
          toast(raidDef()?.title_ru || state.raidId);
          return;
        }
        // Path short/long is chosen by vote on the battle form after the entry squad — not in lobby.
      }
      const actBtn = ev.target.closest("[data-hud-action]");
      if (!actBtn || !root.contains(actBtn)) return;
      const act = actBtn.getAttribute("data-hud-action");
      ev.preventDefault();
      if (act === "dungeon-start") {
        startDungeonRun();
        return;
      }
      if (act === "dungeon-buy-key") {
        buyDungeonKey(state.selectedDungeonId);
        return;
      }
      if (act === "dungeon-fill-party") {
        fillDungeonPartyBots();
        return;
      }
      if (act === "dungeon-solo-test") {
        enableDungeonSoloTestStub();
        return;
      }
      if (act === "dungeon-party-create") {
        createDungeonParty();
        return;
      }
      if (act === "dungeon-party-join") {
        joinDungeonParty();
        return;
      }
      if (act === "dungeon-party-ready") {
        toggleDungeonPartyReady();
        return;
      }
      if (act === "raid-start") {
        viewRaidFight({ autoPlay: false });
        return;
      }
      if (act === "dungeon-formation" || act === "raid-formation" || act === "gvg-formation") {
        if (id === "viewBossRaid" || root.id === "viewBossRaid") {
          if (actBtn.id === "btn-deploy-raid") {
            viewRaidFight({ autoPlay: false });
            return;
          }
          state.battleMode = "boss";
          state.formationMode = "raid";
          ensureRaidLegion();
          navigate("formation", { primary: "combat" });
          return;
        }
        if (id === "viewBossDungeon" || root.id === "viewBossDungeon") {
          // Keep dungeon mode; pick 3 heroes into practiceSquad for 3v3 wing.
          state.battleMode = "dungeon";
          state.formationMode = "";
          ensureDungeonTestSquad();
        }
        navigate("formation", { primary: "combat" });
        return;
      }
      if (act === "dungeon-raid") {
        navigate("boss_raid", { primary: "combat" });
        return;
      }
      if (act === "raid-solo-test") {
        enableRaidSoloTestStub();
        return;
      }
      if (act === "raid-invite") {
        const next = Math.min(RAID_PARTY_SIZE, (state.raidLegionCount | 0) + 3);
        fillRaidLegionSlots(next);
        if (state.raidLegionCount < minRaidPlayers) {
          toast(`Легион ${state.raidLegionCount}/${RAID_PARTY_SIZE} · строй сап→даль→мили→танк`);
        } else {
          const v = validateRaidComposition();
          toast(
            v.ok
              ? `Легион полный · 2 агр + 1 пробитие · 2 хил + 1 бафф · 6 DPS`
              : `Легион ${state.raidLegionCount}/${RAID_PARTY_SIZE} · состав неполный`,
          );
        }
        renderRaidPath();
        return;
      }
      if (act === "gvg-search") {
        startGuildBattle();
        return;
      }
      if (act === "gvg-hub") {
        navigate("hub");
      }
    });
  }
}

/** PvP Arena lobby: team presets, mode tabs, find-match → load sheet. */
function bindPvpArena() {
  const root = $("viewPvp");
  if (!root) return;
  renderPvpArena();
  if (root.dataset.arenaBound === "1") return;
  root.dataset.arenaBound = "1";

  root.addEventListener("click", (ev) => {
    const squad = ev.target.closest("[data-arena-squad]");
    if (squad && root.contains(squad)) {
      ev.preventDefault();
      const id = squad.getAttribute("data-arena-squad");
      applyPvpArenaSquad(id);
      renderPvpArena();
      toast(`Отряд «${pvpActiveSquadName()}» выбран для арены`);
      return;
    }
    const modeBtn = ev.target.closest("[data-arena-mode]");
    if (modeBtn && root.contains(modeBtn)) {
      ev.preventDefault();
      const mode = modeBtn.getAttribute("data-arena-mode");
      state.pvpArenaMode = mode;
      renderPvpArena();
      const labels = { ranked: "Рейтинг", casual: "Свободный", gauntlet: "Гонтлет" };
      toast(`Режим: ${labels[mode] || mode}`);
      return;
    }
    const arenaTip = ev.target.closest("[data-arena]");
    if (arenaTip && root.contains(arenaTip)) {
      const tip = arenaTip.getAttribute("data-arena");
      if (tip === "tactics") {
        toast("Тактика защиты: скоро");
        return;
      }
      if (tip === "rewards") {
        toast("Сезонные награды арены: скоро");
        return;
      }
    }
    const actBtn = ev.target.closest("[data-hud-action]");
    if (!actBtn || !root.contains(actBtn)) return;
    const act = actBtn.getAttribute("data-hud-action");
    ev.preventDefault();
    if (act === "pvp-search") {
      startPvpSearch();
      return;
    }
    if (act === "pvp-formation") {
      navigate("formation", { primary: "combat" });
      return;
    }
    if (act === "pvp-rating") {
      navigate("rating_players");
    }
  });
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
          "shop_tank_fire",
          "shop_fighter_fire",
          "shop_support_water",
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
    // Full chapter run from wave 1 soldiers (same as pveLoadStart).
    state.pveStage = "entrance";
    state.selectedStageId = pveStageId(state.pveChapter, "entrance");
    resetPveCarryAlive();
    startYard(false);
  });
  $("btnYardAuto").addEventListener("click", () => {
    state.battleMode = "pve";
    state.pveStage = "entrance";
    state.selectedStageId = pveStageId(state.pveChapter, "entrance");
    resetPveCarryAlive();
    startYard(true);
  });
  $("btnYardToFormation").addEventListener("click", () => navigate("formation"));
  bindYardForm();
  $("btnFormationBattle").addEventListener("click", () => {
    // Formation «В бой» → current Mythmir chapter soldiers (not practice dummies).
    state.battleMode = "pve";
    state.pveStage = "entrance";
    state.selectedStageId = pveStageId(state.pveChapter, "entrance");
    resetPveCarryAlive();
    startYard(false);
  });
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
  $("btnPvpStart")?.addEventListener("click", () => startPvpSearch());
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
  try {
    const { data } = await api("/content/dungeons_coop_v1.json");
    state.dungeonCoop = data;
    if (!state.selectedDungeonId && data?.dungeons?.[0]?.id) {
      state.selectedDungeonId = data.dungeons[0].id;
    }
    seedDungeonKeysIfNeeded();
  } catch (err) {
    console.warn("dungeon coop catalog", err);
    state.dungeonCoop = null;
  }
  try {
    const { data } = await api("/content/dungeon_rewards_v1.json");
    state.dungeonRewards = data;
  } catch (err) {
    state.dungeonRewards = null;
  }
  try {
    const { data } = await api("/content/dungeon_rares.json");
    state.dungeonRares = data;
  } catch (err) {
    state.dungeonRares = null;
  }
  await syncDungeonStateFromServer();
  try {
    const { data } = await api("/content/raids_sl.json");
    state.raidsCatalog = data;
    if (data?.partySize) {
      /* RAID_PARTY_SIZE const is source of truth; catalog mirrors it */
    }
    if (data?.raids?.[0]?.raidId && !data.raids.some((r) => r.raidId === state.raidId)) {
      state.raidId = data.raids[0].raidId;
    }
    syncRaidLimitsFromLiveOps();
  } catch (err) {
    console.warn("raids catalog", err);
    state.raidsCatalog = null;
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
  /** Design handoff: 4×3 legion snapshot (rows/slots/timer/stage/wing3v3). */
  window.mythfelRaidFormation = raidFormationSnapshot;
  window.mythfelViewRaidBattle = () => {
    state.raidBattlePreview = true;
    navigate("raid_battle", { primary: "combat" });
    renderRaidBattleStub();
    return raidFormationSnapshot();
  };
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
        "shop_tank_fire",
        "shop_fighter_fire",
        "shop_support_water",
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
