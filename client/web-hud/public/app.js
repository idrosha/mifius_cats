/**
 * Mythfel Web HUD — battle/devapi + LiveOps wire logic + Stitch packs 0268/64d5/e608/4da7/18c7/ba17/17eb.
 * Formation is inline (no Бои subtab). Home = cat + equip + inventory (no portals).
 * Pack 18c7: practice fight + guild hall. Pack ba17: pass + chats×3.
 * Pack 17eb: tavern/shop/market/auction + ratings×2. No combat authority on client (§3.6 / §8.2).
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
/** Knowledge screens stay reachable; База знаний is a top-level item with no submenu. */
const KNOWLEDGE_TABS = [
  { id: "armor_sets", key: "nav.sub.armor_sets", gated: true },
  { id: "class_sets", key: "nav.sub.class_sets", gated: true },
  { id: "equip_cards", key: "nav.sub.equip_cards", gated: true },
  { id: "heroes", key: "nav.sub.heroes" },
  { id: "codex", key: "nav.sub.codex" },
];

const NAV = [
  {
    id: "pass",
    key: "nav.primary.pass",
    route: "pass",
    tabs: [],
  },
  {
    id: "character",
    key: "nav.primary.character",
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
    tabs: [
      { id: "guild_hub", key: "nav.sub.guild_hub" },
      { id: "guild", key: "nav.sub.guild" },
      { id: "chat_guild", key: "nav.sub.chat_guild" },
    ],
  },
  {
    id: "ratings",
    key: "nav.primary.ratings",
    tabs: [
      { id: "rating_players", key: "nav.sub.rating_players" },
      { id: "rating_dungeon", key: "nav.sub.rating_dungeon" },
      { id: "rating_raid", key: "nav.sub.rating_raid" },
      { id: "rating_guilds", key: "nav.sub.rating_guilds" },
    ],
  },
  {
    id: "chats",
    key: "nav.primary.chats",
    tabs: [
      { id: "chat_friends", key: "nav.sub.chat_friends" },
      { id: "chat_global", key: "nav.sub.chat_global" },
    ],
  },
  {
    id: "knowledge",
    key: "nav.primary.knowledge",
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
  if (tabId === "yard") return NAV.find((g) => g.id === "combat") || null;
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
      tab: knowledge || { id: "knowledge", key: "nav.sub.knowledge" },
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
      "На soft launch глубокая ферма выключена (вкладка «Скоро»), но HUD показывает 10 зон усадьбы, включая Рыбную заводь. Семена, наживка, лопата/топор/кирка — на Рынке (stub). Pass ACTIVE даёт тумблеры автофермы (сбор+посев, алхимик, gather→кузнец). Сбор/крафт loop — post-SL / tip.",
    bodyEn:
      "Deep farm is off on soft launch (Soon tab), but HUD shows 10 estate zones including the fishing cove. Seeds, bait, shovel/axe/pick are Market stubs. Pass ACTIVE unlocks autofarm toggles (harvest+replant, alchemist, gather→blacksmith). Live crop/craft loop is post-SL / tip.",
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
  {
    id: "mythic_breed",
    titleRu: "Мифики и скрещивание",
    titleEn: "Mythics and breeding",
    bodyRu:
      "Главная цель: из обычных котов сделать мифических через питомник. Малый шанс мифика. У мифика ровно 4 карты — сильнейшие из смеси обоих родителей (пул до 8). Без безлимитного breeding: мифики редки. На soft launch экран есть, live breed — Phase 6 / tip «Подними ранг».",
    bodyEn:
      "Core goal: turn ordinary cats into mythics via the nursery. Small mythic chance. A mythic keeps exactly 4 cards — the strongest from both parents (pool up to 8). No unlimited breeding: mythics stay scarce. Soft launch has the screen; live breed is Phase 6 / «rank up» tip.",
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
  passActiveStub: false,
  autofarm: {
    autofarm_crops: false,
    autofarm_alchemy: false,
    autofarm_gather: false,
    autofarm_blacksmith: false,
    autofarm_fish: false,
  },
  /** Local HUD gear catalog — soft-launch stub (server later). */
  gearCatalog: [
    { id: "weapon_wood_claw", slot: "weapon", name: "Деревянный коготь", atk: 120, hp: 0, def: 0, spd: 4, rank: 1 },
    { id: "armor_grey_plate", slot: "armor", name: "Серая кираса", atk: 0, hp: 420, def: 40, spd: 0, rank: 1 },
    { id: "helm_grey_cap", slot: "helm", name: "Серый шлем", atk: 0, hp: 180, def: 25, spd: 0, rank: 1 },
    { id: "boots_soft_pads", slot: "boots", name: "Мягкие лапки", atk: 0, hp: 0, def: 10, spd: 12, rank: 1 },
    { id: "weapon_flint_bow", slot: "weapon", name: "Кремнёвый лук", atk: 160, hp: 0, def: 0, spd: 6, rank: 2 },
    { id: "armor_green_mail", slot: "armor", name: "Зелёная кольчуга", atk: 0, hp: 620, def: 55, spd: 0, rank: 2 },
  ],
  /** catId → { weapon, armor, helm, boots } item ids */
  equippedByCat: {},
  selectedCatId: null,
  /** Farm zones: farmer hired + crop cycle (local stub). */
  farmState: {},
  farmBag: [],
  clan: null, // { name, members: string[], createdAt }
  wireMode: "hub",
  loggedIn: false,
  selectedStageId: YARD_STAGE,
  battleMode: "pve", // pve | practice | boss | guild_demo | pvp
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
    if (state.battleMode === "practice") return "viewPracticeFight";
    if (state.battleMode === "pvp") return "viewPvpFight";
    return "viewBattle";
  }
  if (state.battle?.result && state.lastResult) {
    if (state.lastResult.result === "p1_win" && (state.battleMode === "practice" || state.battleMode === "pve")) {
      return "viewVictoryHall";
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
    collection: "viewCollection",
    trade_hub: "viewTradeHub",
    shop: "viewShop",
    market: "viewMarket",
    tavern: "viewTavern",
    pass: "viewHub",
    gear: "viewGear",
    home: "viewHome",
    heroes: "viewHeroes",
    armor_sets: "viewArmorSets",
    class_sets: "viewClassSets",
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

function showView(id) {
  // ONLY top-level stage hosts under #app — never nested Stitch <main><section>
  // (old "main > section" hid home/hub/equip body columns → brown void + float panel).
  for (const el of document.querySelectorAll("#app > section")) {
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

function loginAddressOpen() {
  return normalizedPath() === "/home";
}

function screenAddressFor(tab) {
  if (tab === "pass") return "/pass";
  if (tab === "craft") return "/craft";
  if (tab === "home") return "/hero";
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
  // База знаний is a top-level item — open the codex
  if (tab === "knowledge") {
    tab = "codex";
    primary = primary || "knowledge";
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
  if (tab === "pvp" && !pvpUnlocked()) {
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
  document.body.classList.toggle("mythfel-trade", tab === "trade_hub");
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
  const cats = profile?.cats || [];
  if (!state.selectedCatId && cats.length) {
    state.selectedCatId = cats.find((c) => c.role !== "farm")?.catId || cats[0].catId;
  }
  for (const c of cats) {
    if (!state.equippedByCat[c.catId]) {
      state.equippedByCat[c.catId] = { weapon: null, armor: null, helm: null, boots: null };
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

function baseStatsForCat(cat) {
  const role = cat?.role || "fighter";
  const table = {
    tank: { atk: 80, hp: 1200, def: 90, spd: 40 },
    fighter: { atk: 140, hp: 900, def: 50, spd: 55 },
    assassin: { atk: 160, hp: 720, def: 35, spd: 70 },
    ranger: { atk: 130, hp: 780, def: 40, spd: 65 },
    mage: { atk: 150, hp: 700, def: 30, spd: 50 },
    support: { atk: 70, hp: 850, def: 45, spd: 48 },
    farm: { atk: 20, hp: 500, def: 20, spd: 30 },
  };
  return { ...(table[role] || table.fighter) };
}

function gearBonusForCat(catId) {
  const eq = state.equippedByCat[catId] || {};
  const bonus = { atk: 0, hp: 0, def: 0, spd: 0 };
  for (const slot of ["weapon", "armor", "helm", "boots"]) {
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

function equipItem(catId, itemId) {
  const item = state.gearCatalog.find((g) => g.id === itemId);
  if (!item || !catId) return;
  if (!state.equippedByCat[catId]) {
    state.equippedByCat[catId] = { weapon: null, armor: null, helm: null, boots: null };
  }
  // Unequip same item from other cats / same slot swap
  for (const [cid, eq] of Object.entries(state.equippedByCat)) {
    for (const slot of Object.keys(eq)) {
      if (eq[slot] === itemId) eq[slot] = null;
    }
  }
  state.equippedByCat[catId][item.slot] = itemId;
  toast(`${item.name} → надето`);
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
    navigate(group.route, { primary: group.id });
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
    b.textContent = t(group.key, group.id);
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
  fillNav(
    document.querySelector("#viewHub .mythfel-hub-tabs"),
    document.querySelector("#viewHub .mythfel-hub-sub"),
    activeGroup,
    battleActive,
    "is-active",
  );
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
    // Old hub-go portals, dock, and static submenu leftovers stay closed during redesign.
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

function renderTradeHub() {
  const el = $("tradeFairTimer");
  if (!el || el.dataset.armed === "1") return;
  el.dataset.armed = "1";
  let total = 4 * 3600 + 18 * 60 + 19;
  const tick = () => {
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    el.textContent = `${h}:${m}:${s}`;
    if (total > 0) total -= 1;
  };
  tick();
  setInterval(tick, 1000);
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

const CAT_SHEET_NAMES = {
  starter_tank_stone: "Страж камня",
  starter_fighter_fire: "Боец огня",
  starter_support_water: "Поддержка воды",
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
const HOME_SLOT_ORDER = ["weapon", "armor", "helm", "boots"];
const HOME_SLOT_RU = { weapon: "Оружие", armor: "Броня", helm: "Шлем", boots: "Обувь" };

function catSheetName(cat) {
  if (CAT_SHEET_NAMES[cat.templateId]) return CAT_SHEET_NAMES[cat.templateId];
  const parts = String(cat.templateId || "").split("_");
  const role = parts.find((part) => CAT_ROLE_RU[part]);
  const element = parts.find((part) => CAT_ELEMENT_RU[part]);
  if (role && element) return `${CAT_ROLE_RU[role]} ${CAT_ELEMENT_GEN[element] || CAT_ELEMENT_RU[element].toLowerCase()}`;
  return cat.templateId || cat.catId;
}

function sheetPower(stats) {
  return stats.atk * 20 + stats.hp + stats.def * 8 + stats.spd * 6;
}

function formatSheetNum(n) {
  return String(n ?? "—").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function equipBest(catId) {
  if (!catId) return;
  if (!state.equippedByCat[catId]) {
    state.equippedByCat[catId] = { weapon: null, armor: null, helm: null, boots: null };
  }
  for (const slot of HOME_SLOT_ORDER) {
    const best = state.gearCatalog
      .filter((item) => item.slot === slot)
      .sort((a, b) => b.atk + b.hp + b.def + b.spd - (a.atk + a.hp + a.def + a.spd))[0];
    if (!best) continue;
    for (const eq of Object.values(state.equippedByCat)) {
      for (const key of Object.keys(eq)) {
        if (eq[key] === best.id) eq[key] = null;
      }
    }
    state.equippedByCat[catId][slot] = best.id;
  }
  toast("Лучшее надето");
  renderAll();
}

function unequipAll(catId) {
  const eq = state.equippedByCat[catId];
  if (!eq) return;
  for (const slot of HOME_SLOT_ORDER) eq[slot] = null;
  toast("Слоты сняты");
  renderAll();
}

function renderHome() {
  // Frozen /hero desk: the screenshot is the page. Host nodes stay for verify-nav.
  const cats = (state.profile?.cats || []).filter((c) => c.role !== "farm");
  const cat = cats.find((c) => c.catId === state.selectedCatId) || cats[0];
  if (cat) state.selectedCatId = cat.catId;
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
      const card = document.createElement("div");
      card.className = "mythfel-panel-card";
      card.innerHTML = `<strong>${item.name}</strong><div class="meta">R${item.rank} · ${item.slot}</div>`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wire-btn";
      btn.textContent = onThis ? "Снять" : "Надеть";
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
  $("passEyebrow").textContent = t("hub.tab.pass", "Пасс");
  $("passTitle").textContent = t("pass.title", "Зов Тёплого Очага");
  $("passLead").textContent = t(
    "pass.lead",
    "×2 XP · боксы по текущему рангу · автоферма при ACTIVE · high ranks ~1 год с пассом.",
  );
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

function bindNursery() {
  const root = $("viewBreeding");
  if (!root || root.dataset.nurseryBound === "1") return;
  root.dataset.nurseryBound = "1";
  root.querySelector(".nursery-light")?.addEventListener("click", () => {
    showGateTip(
      t(
        "gate.tip.breeding",
        "Питомник: обычные → мифики (малый шанс). Пока — подними ранг в боях",
      ),
    );
  });
}

function renderBreeding() {
  const host = $("viewBreeding");
  if (!host) return;
  if (host.querySelector(".nursery-hall")) {
    bindNursery();
    return;
  }
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
      "Цель Мифоус: из обычных котов — мифические. Малый шанс мифика; у мифика набор из 4 сильнейших карт обоих родителей.",
    );
  }
  if (tip) {
    tip.textContent = t(
      "breeding.tip",
      "Питомник скоро · мифик = редкий шанс · 4 сильнейшие карты родителей · подними ранг в боях",
    );
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
          "Скоро: скрещивание обычных котов. Малый шанс мифика — 4 сильнейшие смешанные карты родителей. Без безлимитного breeding.",
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

function renderVictoryHall() {
  const mode = state.battleMode;
  const turn = state.battle?.turn || state.battle?.round || 0;
  const when = turn ? ` за ${ruRounds(turn)}` : "";
  const copy = {
    practice: ["Тренировочное додзё · Арена испытаний", "Славная победа в додзё!", `3 из 3 манекенов повержены${when} · Идеальное исполнение комбо`, "Трофеи додзё"],
    pve: ["Мифмир · Поход", "Славная победа в походе!", `Узел пройден${when}`, "Трофеи похода"],
    pvp: ["Арена · ПвП", "Славная победа на арене!", `Соперник повержен${when}`, "Трофеи арены"],
  }[mode] || ["Бой", "Славная победа!", "Бой завершён", "Трофеи"];
  if ($("vicKicker")) $("vicKicker").textContent = copy[0];
  if ($("vicTitle")) $("vicTitle").textContent = copy[1];
  if ($("vicLead")) $("vicLead").textContent = copy[2];
  if ($("vicLoot")) $("vicLoot").textContent = copy[3];
  bindVictoryHall();
}

function bindVictoryHall() {
  const root = $("viewVictoryHall");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener("click", (ev) => {
    const act = ev.target.closest("[data-win]")?.getAttribute("data-win");
    if (!act) return;
    ev.preventDefault();
    const mode = state.battleMode;
    const battleId = state.battle?.battleId || state.lastResult?.battleId || "";
    if (act === "log") {
      toast(battleId ? `Бой ${battleId}` : "Лог боя на сервере");
      return;
    }
    state.battle = null;
    state.lastResult = null;
    state.battleMode = "";
    if (act === "again") {
      if (mode === "practice") startPractice(false);
      else if (mode === "pvp") pvpStart();
      else startYard(false);
      return;
    }
    navigate("battle_hub");
  });
  document.addEventListener("keydown", (ev) => {
    if (root.classList.contains("hidden")) return;
    if (ev.target.closest("input, textarea")) return;
    if (ev.code !== "KeyR") return;
    ev.preventDefault();
    root.querySelector('[data-win="again"]')?.click();
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

function renderPracticeFight() {
  const diff = state.battle;
  if (!diff) return;
  const local = diff.p1 || {};
  const energy = local.energy ?? 0;
  if ($("pfRound")) $("pfRound").textContent = `Раунд ${diff.turn || 1} · Ход игрока`;
  if ($("pfEnergy")) $("pfEnergy").textContent = `Энергия ${energy}`;
  if ($("pfOrbs")) $("pfOrbs").textContent = `Орбы энергии ${energy}`;
  const paint = (sel, units) => {
    document.querySelectorAll(sel).forEach((card, i) => {
      const u = units[i];
      const em = card.querySelector("em");
      const bar = card.querySelector("i");
      card.hidden = !u;
      if (!u) return;
      if (em) em.textContent = `${u.hp} / ${u.maxHp}`;
      const pct = u.maxHp > 0 ? Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100)) : 0;
      if (bar) bar.style.setProperty("--hp", `${pct}%`);
    });
  };
  const allies = (diff.units || []).filter((u) => u.side === 0).sort((a, b) => a.lane - b.lane);
  const enemies = (diff.units || []).filter((u) => u.side === 1).sort((a, b) => a.lane - b.lane);
  paint("#pfAllies [data-slot]", allies);
  paint("#pfEnemies [data-slot]", enemies);
  const hand = $("pfHand");
  if (!hand) return;
  hand.innerHTML = "";
  const cards = (diff.hand || []).slice(0, 6);
  const source = cards.length
    ? cards
    : ["Громовой Удар", "Огненный Щит", "Целебный Мур", "Круговой Взмах", "Искра Очага"].map((name) => ({
        label: name,
        idle: true,
      }));
  for (const c of source) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pf-card";
    if (c.idle) {
      b.disabled = true;
      b.innerHTML = `<b>${c.label}</b><span>ждёт раздачу</span>`;
    } else {
      b.disabled = !c.playable || !!diff.result || diff.active !== 0;
      b.innerHTML = `<b>${t(c.name_key, c.cardId)}</b><span>цена ${c.cost ?? "?"}</span>`;
      b.addEventListener("click", () =>
        submitAction({ kind: "playCard", unitId: c.unitId, handIndex: c.handIndex, targetId: "" }),
      );
    }
    hand.appendChild(b);
  }
  const end = $("pfEndTurn");
  if (end) end.disabled = !diff.canEndTurn || !!diff.result || diff.active !== 0;
}

function bindPracticeFight() {
  const root = $("viewPracticeFight");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener("click", (ev) => {
    const id = ev.target.closest("button")?.id;
    if (id === "pfEndTurn") submitAction({ kind: "endTurn" });
    if (id === "pfBack") {
      state.battle = null;
      state.lastResult = null;
      navigate("practice");
    }
  });
  document.addEventListener("keydown", (ev) => {
    if (logicalViewId() !== "viewPracticeFight") return;
    if (ev.target.closest("input, textarea")) return;
    if (ev.code === "Space") {
      ev.preventDefault();
      submitAction({ kind: "endTurn" });
    } else if (ev.code === "Escape") {
      ev.preventDefault();
      state.battle = null;
      state.lastResult = null;
      navigate("practice");
    }
  });
}

function pvpUnitCard(u, foe) {
  const li = document.createElement("li");
  const role = CAT_ROLE_RU[u.role] || u.role || "";
  const element = CAT_ELEMENT_RU[u.element] || u.element || "";
  const name = catSheetName({ templateId: u.id, catId: u.id });
  const pct = u.maxHp > 0 ? Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100)) : 0;
  const art = {
    starter_support_water: "/stitch-assets/ad3ff067b5c8.jpg",
    starter_fighter_fire: "/stitch-assets/f453fafbcca9.jpg",
    starter_tank_stone: "/stitch-assets/dc459e94ceed.jpg",
  }[u.id];
  li.innerHTML = `${art ? `<figure><img alt="" src="${art}"/></figure>` : ""}<div><b>${name}</b><small>${element}${role ? " · " + role : ""}</small><em>${u.hp} / ${u.maxHp}</em><i style="--hp:${pct}%"></i></div>`;
  if (foe) li.dataset.foe = "1";
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
  if (allyBox) {
    allyBox.innerHTML = "";
    allies.forEach((u) => allyBox.appendChild(pvpUnitCard(u, false)));
  }
  if (foeBox) {
    foeBox.innerHTML = "";
    enemies.forEach((u) => foeBox.appendChild(pvpUnitCard(u, true)));
  }
  const hand = $("pvHand");
  if (hand) {
    hand.innerHTML = "";
    const cards = diff.hand || [];
    if ($("pvOrbs")) $("pvOrbs").textContent = `${cards.length} карт`;
    if (!cards.length) {
      const b = document.createElement("button");
      b.type = "button";
      b.disabled = true;
      b.innerHTML = `<b>Колода</b><span>ждёт раздачу</span>`;
      hand.appendChild(b);
    }
    for (const c of cards) {
      const b = document.createElement("button");
      b.type = "button";
      b.disabled = !c.playable || !!diff.result || diff.active !== 0;
      b.innerHTML = `<b>${t(c.name_key, c.cardId)}</b><span>цена ${c.cost ?? "?"}</span>`;
      b.addEventListener("click", () =>
        submitAction({ kind: "playCard", unitId: c.unitId, handIndex: c.handIndex, targetId: "" }),
      );
      hand.appendChild(b);
    }
  }
  const end = $("pvEndTurn");
  if (end) end.disabled = !diff.canEndTurn || !!diff.result || diff.active !== 0;
}

function leavePvpFight() {
  state.battle = null;
  state.lastResult = null;
  state.battleMode = "";
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

/** Interactive PvP (same core; human turns until end / surrender). */
async function pvpStart() {
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
  if (state.liveOps) {
    lo.textContent = `LiveOps v${state.liveOpsMeta.version} · ${state.liveOpsMeta.alg || "?"} · ${CLIENT_REGION}`;
    lo.className = "status-pill ok";
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
  if (viewId === "viewPvpVictory") {
    renderPvpVictory();
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
    case "equip_cards":
      renderEquipCards();
      break;
    case "practice":
      renderUnlockProgress();
      bindPracticeFightCtas();
      break;
    case "battle_hub":
      bindBattleHub();
      break;
    case "codex":
      renderCodex();
      break;
    case "breeding":
      renderBreeding();
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
      bindCollectionRoster();
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

function bindCollectionRoster() {
  const root = $("viewCollection");
  if (!root || root.dataset.rosterBound === "1") return;
  root.dataset.rosterBound = "1";
  const list = root.querySelector(".roster-list");
  const search = root.querySelector(".roster-search");
  const applyFilter = () => {
    const q = (search?.value || "").trim().toLowerCase();
    const el = root.querySelector(".roster-filters button.is-on")?.dataset.el || "all";
    list?.querySelectorAll("[data-hero]").forEach((row) => {
      const name = row.getAttribute("data-hero") || "";
      const kind = row.getAttribute("data-el") || "";
      const ok = (el === "all" || kind === el) && (!q || name.includes(q));
      row.classList.toggle("is-off", !ok);
    });
  };
  root.querySelectorAll(".roster-filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".roster-filters button").forEach((b) => b.classList.toggle("is-on", b === btn));
      applyFilter();
    });
  });
  search?.addEventListener("input", applyFilter);
  root.querySelector(".roster-apply")?.addEventListener("click", () => {
    toast("Связки применены для всех боёв");
  });
  root.querySelector("[data-act='all']")?.addEventListener("click", () => {
    root.querySelectorAll(".roster-pack[data-pack]").forEach((pack) => pack.classList.add("is-on"));
    toast("Все связки активны");
  });
  root.querySelectorAll(".roster-pack[data-pack]").forEach((pack) => {
    pack.addEventListener("click", (ev) => {
      if (ev.target.closest("button")) return;
      root.querySelectorAll(".roster-pack[data-pack]").forEach((p) => p.classList.toggle("is-on", p === pack));
    });
  });
  document.addEventListener("keydown", (ev) => {
    if (state.tab !== "collection") return;
    if (ev.target.closest("input, textarea")) return;
    if (ev.code === "Space") {
      ev.preventDefault();
      toast("Расстановка сохранена");
    } else if (ev.key === "t" || ev.key === "T" || ev.key === "е" || ev.key === "Е") {
      navigate("practice");
    } else if (ev.key === "p" || ev.key === "P" || ev.key === "з" || ev.key === "З") {
      navigate("home");
    } else if (ev.key === "i" || ev.key === "I" || ev.key === "ш" || ev.key === "Ш") {
      navigate("gear");
    } else if (ev.code === "Escape") {
      navigate("home");
    }
  });
}

function bindBattleHub() {
  const root = $("viewBattleHub");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener("click", (ev) => {
    const filter = ev.target.closest("[data-filter]");
    if (!filter || !root.contains(filter)) return;
    const kind = filter.getAttribute("data-filter");
    root.querySelectorAll("[data-filter]").forEach((btn) => btn.classList.toggle("is-on", btn === filter));
    root.querySelectorAll("[data-mode]").forEach((card) => {
      card.classList.toggle("is-off", kind !== "all" && card.getAttribute("data-mode") !== kind);
    });
  });
}

function showPracticeLoad(on) {
  const root = $("viewPractice");
  const load = root?.querySelector(".dojo-load");
  if (!root || !load) return;
  load.hidden = !on;
  root.dataset.practiceLoad = on ? "1" : "0";
}

function bindPracticeFightCtas() {
  const root = $("viewPractice");
  if (!root || root.dataset.practiceBound === "1") return;
  root.dataset.practiceBound = "1";
  root.addEventListener("click", (ev) => {
    const act = ev.target.closest("[data-load]")?.getAttribute("data-load");
    if (!act) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (act === "open") showPracticeLoad(true);
    else if (act === "close") showPracticeLoad(false);
    else if (act === "go") startPractice(false);
  }, true);
  root.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-load]")) return;
    const label = (ev.target.closest("button, a")?.textContent || "").toLowerCase();
    if (label.includes("назад")) {
      ev.preventDefault();
      navigate("yard");
      return;
    }
    if (label.includes("быстрый тест")) {
      ev.preventDefault();
      startPractice(true);
    }
  });
  document.addEventListener("keydown", (ev) => {
    if (state.tab !== "practice") return;
    if (ev.target.closest("input, textarea")) return;
    if (state.battle && !state.battle.result && state.battleMode === "practice") return;
    const loading = root.dataset.practiceLoad === "1";
    if (ev.code === "Space") {
      ev.preventDefault();
      if (loading) startPractice(false);
      else showPracticeLoad(true);
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
  $("btnPvpStart")?.addEventListener("click", () => pvpStart());
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
  return "hub";
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
    // /home = login/register desk. Everywhere else soft-launch enters the game at once.
    if (loginAddressOpen()) {
      state.loggedIn = false;
      state.tab = "login";
      state.primary = "combat";
      document.body.classList.add("mythfel-login");
      renderAll();
      return;
    }
    await stubLogin({ login: "auto_boot", password: "" });
  } catch (err) {
    $("bootMsg").textContent = `Boot fail: ${err.message}. Подними CDN :8090 и battle :8081 (см. README).`;
    $("liveopsPill").textContent = "LiveOps FAIL";
    $("liveopsPill").className = "status-pill bad";
    console.error(err);
  }
}

main();
