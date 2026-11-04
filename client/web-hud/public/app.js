/**
 * Mythfel Web HUD — real Stitch HTML screens + battle/devapi / LiveOps.
 * Visual SSOT = design/stitch-src (built into index). No combat authority on client.
 */

const STARTERS = [
  "starter_tank_stone",
  "starter_fighter_fire",
  "starter_support_water",
];
const YARD_STAGE = "test_yard_1";
const TUTORIAL_BUDGET_MS = 10 * 60 * 1000;
const CLIENT_REGION = (new URLSearchParams(location.search).get("region") || "RU").toUpperCase();

/** Stitch header data-path → app tab */
const PATH_TO_TAB = {
  "главный-хаб": "hub",
  "бой-3v3": "battle",
  "rejd-na-doga": "soon",
  "рейд-на-дога": "soon",
  "двор-усадьбы": "yard",
  коллекция: "collection",
  "лавка-и-маркет": "shop",
  "pvp-арена": "pvp",
  "battle-pass": "pass",
  гильдия: "clans",
  бой: "battle",
};

const TABS = [
  { id: "hub", key: "hub.tab.hub" },
  { id: "yard", key: "hub.tab.yard" },
  { id: "formation", key: "hub.tab.formation" },
  { id: "pvp", key: "hub.tab.pvp" },
  { id: "collection", key: "hub.tab.collection" },
  { id: "shop", key: "hub.tab.shop" },
  { id: "market", key: "hub.tab.market" },
  { id: "tavern", key: "hub.tab.tavern" },
  { id: "pass", key: "hub.tab.pass" },
  { id: "clans", key: "hub.tab.clans", soon: "clan_boss" },
  { id: "more", key: "hub.tab.more" },
];

const DRINKS = [
  { id: "fresh_milk", nameKey: "tavern.drink.milk", effectKey: "tavern.drink.milk.fx", price: 20 },
  { id: "honey_brew", nameKey: "tavern.drink.honey", effectKey: "tavern.drink.honey.fx", price: 35 },
  { id: "mint_infusion", nameKey: "tavern.drink.mint", effectKey: "tavern.drink.mint.fx", price: 25 },
];

const POTIONS = [
  { id: "stone_skin", nameKey: "tavern.potion.stone", effectKey: "tavern.potion.stone.fx", price: 45 },
  { id: "spark_claw", nameKey: "tavern.potion.spark", effectKey: "tavern.potion.spark.fx", price: 60 },
  { id: "nine_lives", nameKey: "tavern.potion.nine", effectKey: "tavern.potion.nine.fx", price: 80 },
  { id: "cleanse", nameKey: "tavern.potion.cleanse", effectKey: "tavern.potion.cleanse.fx", price: 35 },
];

const PASS_REWARDS = [
  { lvl: 1, free: "pass.reward.fish_50", gold: "pass.reward.yarn_10" },
  { lvl: 2, free: "pass.reward.scrap", gold: "pass.reward.potion_skin" },
  { lvl: 3, free: "pass.reward.bowl", gold: "pass.reward.chest" },
  { lvl: 4, free: "pass.reward.ticket", gold: "pass.reward.potion_nine" },
];

const state = {
  locale: "ru",
  loc: {},
  liveOps: null,
  liveOpsMeta: {},
  tab: "hub",
  soon: null,
  battle: null,
  lastResult: null,
  selectedKeep: null,
  tutorial: null,
  logLines: [],
  shopTab: "offers",
  marketTab: "buy",
  wallet: { gold: 1480, milk: 12, energy: "85/90", gems: 40 },
  ownedPotions: ["stone_skin", "spark_claw", "nine_lives"],
  marketLots: [
    { id: "lot_1", name: "starter_support_water", bid: 120, side: "buy" },
    { id: "lot_2", name: "yarn_ball", bid: 80, side: "buy" },
  ],
  wireMode: "hub",
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
  if (state.soon && (state.tab === "clans" || state.tab === "more")) {
    if (state.soon === "clan_boss") return "viewSoonClan";
    if (state.soon === "nursery") return "viewSoon";
    return "viewSoonFarm";
  }
  switch (state.tab) {
    case "hub":
      return "viewHub";
    case "yard":
      return "viewYard";
    case "formation":
      return "viewFormation";
    case "battle":
      return "viewBattle";
    case "pvp":
      return "viewPvp";
    case "collection":
      return "viewCollection";
    case "shop":
      return "viewShop";
    case "market":
      return "viewMarket";
    case "tavern":
      return "viewTavern";
    case "pass":
      return "viewPass";
    default:
      return "viewHub";
  }
}

function wireModeFor(viewId) {
  if (viewId === "viewResultWin" || viewId === "viewResultLose" || viewId === "viewResult") {
    return "result";
  }
  if (viewId === "viewSoonFarm" || viewId === "viewSoonClan" || viewId === "viewSoon") {
    return "soon";
  }
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

function navigate(tab, { soon = null, clearBattle = true } = {}) {
  if (clearBattle) {
    state.battle = null;
    state.selectedKeep = null;
  }
  state.tab = tab;
  state.soon = soon;
  if (tab === "clans") state.soon = "clan_boss";
  if (tab === "more" && !state.soon) state.soon = "farm";
  if (tab === "soon") {
    state.tab = "more";
    state.soon = "farm";
  }
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
  set("curGold", state.wallet.gold);
  set("curMilk", state.wallet.milk);
  set("curEnergy", state.wallet.energy);
  set("curGems", state.wallet.gems);
  set(
    "brandSub",
    state.locale === "ru" ? "Ур. 1 · Soft Launch" : "Lv. 1 · Soft Launch",
  );
}

function renderTabs() {
  const flags = featureFlags();
  const targets = [$("appTabs"), $("hubTabs")].filter(Boolean);
  for (const nav of targets) {
    nav.innerHTML = "";
    const battleActive = !!state.battle && !state.lastResult;
    for (const tab of TABS) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = t(tab.key, tab.id);
      b.dataset.tab = tab.id;
      const isSoon =
        (tab.id === "clans" && !flags.clan_boss_gameplay) || tab.id === "more";
      if (isSoon) b.classList.add("soon");
      const active =
        !battleActive &&
        ((state.tab === tab.id && !state.soon) ||
          (tab.id === "clans" && state.soon === "clan_boss") ||
          (tab.id === "more" && (state.soon === "farm" || state.soon === "nursery")));
      b.classList.toggle("active", active);
      b.addEventListener("click", () => {
        if (tab.id === "clans" && !flags.clan_boss_gameplay) {
          navigate("clans", { soon: "clan_boss" });
        } else if (tab.id === "more") {
          navigate("more", { soon: state.soon === "nursery" ? "nursery" : "farm" });
        } else {
          navigate(tab.id);
        }
      });
      nav.appendChild(b);
    }
  }
}

function starterMeta(id) {
  const map = {
    starter_tank_stone: { role: "tank", element: "stone", lane: "vanguard" },
    starter_fighter_fire: { role: "fighter", element: "fire", lane: "center" },
    starter_support_water: { role: "support", element: "water", lane: "rear" },
  };
  return map[id] || { role: "?", element: "?", lane: "?" };
}

function renderStarters(intoId) {
  const box = $(intoId);
  if (!box) return;
  box.innerHTML = "";
  for (const id of STARTERS) {
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
    ["к рейду", () => navigate("more", { soon: "farm" })],
    ["главный хаб", () => navigate("hub")],
    ["двор", () => navigate("yard")],
    ["коллекция", () => navigate("collection")],
    ["лавка", () => navigate("shop")],
    ["маркет", () => navigate("market")],
    ["таверна", () => navigate("tavern")],
    ["pvp", () => navigate("pvp")],
    ["арена", () => navigate("pvp")],
    ["пасс", () => navigate("pass")],
    ["расстанов", () => navigate("formation")],
    ["клан", () => navigate("clans", { soon: "clan_boss" })],
    ["ферма", () => navigate("more", { soon: "farm" })],
    ["питомник", () => navigate("more", { soon: "nursery" })],
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
      if (tab === "clans") navigate("clans", { soon: "clan_boss" });
      else if (tab === "soon") navigate("more", { soon: "farm" });
      else if (tab === "battle") navigate("formation");
      else navigate(tab);
      return;
    }
    const label = (a.textContent || "").trim();
    if (softNavigateFromLabel(label)) {
      e.preventDefault();
    }
  });
}

function renderHub() {
  $("hubEyebrow").textContent = t("hub.tab.hub", "Главный Хаб");
  $("hubTitle").textContent = t("hub.home.title", "Мифиус");
  $("hubLead").textContent = t("hub.home.lead", "Stitch hub screen");
  const box = $("hubPortals");
  if (box) box.innerHTML = "";
}

function renderYard() {
  $("yardEyebrow").textContent = t("hub.tab.yard");
  $("yardTitle").textContent = t("hub.tab.yard");
  $("yardLead").textContent = `${t("stage.test_yard_1")} · ${YARD_STAGE}`;
  renderStarters("starterCards");
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

function renderFormation() {
  $("formEyebrow").textContent = t("hub.tab.formation", "Расстановка");
  $("formTitle").textContent = t("formation.title", "Строй отряда 3v3");
  $("formLead").textContent = t(
    "formation.lead",
    "Авангард → Центр → Тыл. Зелья из Таверны — слоты ниже (stub).",
  );
  const lanes = $("formationLanes");
  if (!lanes) return;
  lanes.innerHTML = "";
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
    tray.textContent = t("formation.no_potions", "Нет зелий — зайди в Таверну");
  }
}

function renderShop() {
  $("shopEyebrow").textContent = t("hub.tab.shop");
  $("shopTitle").textContent = t("hub.tab.shop");
  $("shopLead").textContent =
    state.locale === "ru"
      ? "Офферы только из LiveOps (пустой каталог → пустой UI)."
      : "Offers only from LiveOps (empty catalog → empty UI).";
  const list = $("offerList");
  if (!list) return;
  list.innerHTML = "";
  const offers = state.liveOps?.shop?.offers || [];
  if (!offers.length) {
    const li = document.createElement("li");
    li.textContent = state.locale === "ru" ? "Нет офферов в LiveOps" : "No LiveOps offers";
    list.appendChild(li);
    return;
  }
  for (const o of offers) {
    const li = document.createElement("li");
    li.textContent = `${o.offer_id || o.offerId || "?"} · ${o.kind || "?"}`;
    list.appendChild(li);
  }
}

function renderMarket() {
  $("marketEyebrow").textContent = t("hub.tab.market", "Маркетплейс");
  $("marketTitle").textContent = t("market.title", "Аукцион Хранителей");
  $("marketLead").textContent = t(
    "market.lead",
    "Buy/sell stub (без денег/крипты). Лоты локальные для ручного QA.",
  );
  const list = $("marketList");
  if (!list) return;
  list.innerHTML = "";
  for (const lot of state.marketLots) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${lot.name} · ${lot.bid} 💎</span>`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wire-btn";
    btn.textContent = t("market.buy", "Купить");
    btn.addEventListener("click", () => {
      if (state.wallet.gems < lot.bid) {
        toast(t("market.no_gems", "Не хватает кристаллов"));
        return;
      }
      state.wallet.gems -= lot.bid;
      state.marketLots = state.marketLots.filter((x) => x.id !== lot.id);
      toast(t("market.bought", "Куплено (stub)"));
      renderAll();
    });
    li.appendChild(btn);
    list.appendChild(li);
  }
}

function renderTavern() {
  $("tavernEyebrow").textContent = t("hub.tab.tavern", "Таверна");
  $("tavernTitle").textContent = t("tavern.title", "Таверна «Усатый Хмель»");
  $("tavernLead").textContent = t("tavern.lead", "Молоко, напитки и зелья.");
  // Stitch already paints drinks/potions; wire dock still hosts stubs for owned state
  const drinks = $("drinkList");
  const pots = $("potionList");
  if (drinks) {
    drinks.innerHTML = "";
    for (const d of DRINKS) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = t(d.nameKey, d.id);
      drinks.appendChild(tile);
    }
  }
  if (pots) {
    pots.innerHTML = "";
    for (const p of POTIONS) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = t(p.nameKey, p.id);
      pots.appendChild(tile);
    }
  }
}

function renderPass() {
  $("passEyebrow").textContent = t("hub.tab.pass", "Пасс");
  $("passTitle").textContent = t("pass.title", "Зов Тёплого Очага");
  $("passLead").textContent = t("pass.lead", "Треки пасса — stub наград.");
  const list = $("passList");
  if (!list) return;
  list.innerHTML = "";
  for (const row of PASS_REWARDS) {
    const li = document.createElement("li");
    li.textContent = `Lv ${row.lvl}: ${t(row.free)} / ★ ${t(row.gold)}`;
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
  }
  renderAll();
}

async function createPvE({ autoPlay = false, seed = 0 } = {}) {
  const { data } = await api("/api/battle/v1/CreatePvE", {
    method: "POST",
    body: JSON.stringify({
      stageId: YARD_STAGE,
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
    const diff = await createPvE({ autoPlay, seed: autoPlay ? 20261104 : 0 });
    await applyDiff(diff, autoPlay ? "CreatePvE autoPlay" : "CreatePvE");
  } catch (err) {
    log(`CreatePvE fail: ${err.message}`);
    alert(err.message);
  }
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
      break;
    case "yard":
      renderYard();
      break;
    case "formation":
      renderFormation();
      break;
    case "pvp":
      $("pvpEyebrow").textContent = t("hub.tab.pvp");
      $("pvpTitle").textContent = t("hub.tab.pvp");
      break;
    case "collection":
      $("colEyebrow").textContent = t("hub.tab.collection");
      $("colTitle").textContent = t("hub.tab.collection");
      $("colLead").textContent =
        state.locale === "ru"
          ? "Stub: стартовая тройка из content."
          : "Stub: starter trio from content.";
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
    case "pass":
      renderPass();
      break;
    default:
      renderHub();
  }
}

function wireButtons() {
  $("btnTutorial").addEventListener("click", () => startTutorial());
  $("btnYardBattle").addEventListener("click", () => startYard(false));
  $("btnYardAuto").addEventListener("click", () => startYard(true));
  $("btnYardToFormation").addEventListener("click", () => navigate("formation"));
  $("btnFormationBattle").addEventListener("click", () => startYard(false));
  $("btnFormationYard").addEventListener("click", () => navigate("yard"));
  $("btnFormationTavern").addEventListener("click", () => navigate("tavern"));
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
  $("btnColForge").addEventListener("click", () => navigate("more", { soon: "farm" }));
  $("btnGacha1").addEventListener("click", () => toast(t("shop.gacha.stub", "Гача stub")));
  $("btnGacha10").addEventListener("click", () => toast(t("shop.gacha.stub", "Гача stub")));
  $("btnShopToTavern").addEventListener("click", () => navigate("tavern"));
  $("btnSellStarter").addEventListener("click", () => {
    state.marketLots.push({
      id: `lot_${Date.now()}`,
      name: "starter_tank_stone",
      bid: 100,
      side: "buy",
    });
    state.marketTab = "buy";
    toast(t("market.listed", "Лот выставлен (stub)"));
    renderAll();
  });
  $("btnMarketToShop").addEventListener("click", () => navigate("shop"));
  $("btnTavernFormation").addEventListener("click", () => navigate("formation"));
  $("btnTavernHub").addEventListener("click", () => navigate("hub"));
  $("btnPassShop").addEventListener("click", () => navigate("shop"));
  $("btnPassHub").addEventListener("click", () => navigate("hub"));
  $("btnSoonHub").addEventListener("click", () => navigate("hub"));
}

async function main() {
  window.mythfelNavigate = navigate;
  window.mythfelStartYard = startYard;
  wireButtons();
  showView("viewBoot");
  $("bootMsg").textContent = "Boot → LiveOps fetch…";
  try {
    await loadLoc();
    await bootLiveOps();
    const battleOk = await checkBattle();
    const bp = $("battlePill");
    bp.textContent = battleOk ? "Battle :8081 OK" : "Battle DOWN";
    bp.className = `status-pill ${battleOk ? "ok" : "bad"}`;
    state.tab = "hub";
    renderAll();
  } catch (err) {
    $("bootMsg").textContent = `Boot fail: ${err.message}. Подними CDN :8090 и battle :8081 (см. README).`;
    $("liveopsPill").textContent = "LiveOps FAIL";
    $("liveopsPill").className = "status-pill bad";
    console.error(err);
  }
}

main();
