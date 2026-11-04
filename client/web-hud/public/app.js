/**
 * Mythfel Web HUD — thin presenter over battle/devapi + LiveOps CDN stub.
 * Mirrors client HubPresenter / BattlePresenter / TutorialPresenter flows.
 * No combat authority: all damage/results from server stateDiff (§3.6 / §8.2).
 */

const STARTERS = [
  "starter_tank_stone",
  "starter_fighter_fire",
  "starter_support_water",
];
const YARD_STAGE = "test_yard_1";
const TUTORIAL_BUDGET_MS = 10 * 60 * 1000;
const CLIENT_REGION = (new URLSearchParams(location.search).get("region") || "RU").toUpperCase();

const TABS = [
  { id: "yard", key: "hub.tab.yard" },
  { id: "pvp", key: "hub.tab.pvp" },
  { id: "collection", key: "hub.tab.collection" },
  { id: "shop", key: "hub.tab.shop" },
  { id: "clans", key: "hub.tab.clans", soon: "clan_boss" },
  { id: "more", key: "hub.tab.more" },
];

const state = {
  locale: "ru",
  loc: {},
  liveOps: null,
  liveOpsMeta: {},
  tab: "yard",
  soon: null,
  battle: null,
  selectedKeep: null,
  tutorial: null,
  logLines: [],
};

const $ = (id) => document.getElementById(id);

function t(key, fallback = key) {
  const entry = state.loc[key];
  if (!entry) return fallback;
  return entry[state.locale] || entry.ru || entry.en || fallback;
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
    const err = new Error(typeof data === "string" ? data : data?.error || data?.raw || text || res.statusText);
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

function showView(id) {
  for (const el of document.querySelectorAll("main > section")) {
    el.classList.toggle("hidden", el.id !== id);
  }
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

function renderTabs() {
  const flags = featureFlags();
  const nav = $("hubTabs");
  nav.innerHTML = "";
  for (const tab of TABS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t(tab.key);
    const isSoon =
      (tab.id === "clans" && !flags.clan_boss_gameplay) ||
      tab.id === "more";
    if (tab.id === "clans" && !flags.clan_boss_gameplay) b.classList.add("soon");
    b.classList.toggle("active", state.tab === tab.id && !state.battle);
    b.addEventListener("click", () => {
      state.battle = null;
      state.selectedKeep = null;
      if (tab.id === "clans" && !flags.clan_boss_gameplay) {
        state.tab = "clans";
        state.soon = "clan_boss";
      } else if (tab.id === "more") {
        state.tab = "more";
        state.soon = state.soon || "farm";
      } else {
        state.tab = tab.id;
        state.soon = null;
      }
      renderAll();
    });
    nav.appendChild(b);
  }
}

function starterMeta(id) {
  const map = {
    starter_tank_stone: { role: "tank", element: "stone" },
    starter_fighter_fire: { role: "fighter", element: "fire" },
    starter_support_water: { role: "support", element: "water" },
  };
  return map[id] || { role: "?", element: "?" };
}

function renderStarters(intoId) {
  const box = $(intoId);
  box.innerHTML = "";
  for (const id of STARTERS) {
    const m = starterMeta(id);
    const d = document.createElement("div");
    d.className = "starter";
    d.innerHTML = `<strong>${id}</strong>${m.role} · ${m.element}`;
    box.appendChild(d);
  }
}

function renderYard() {
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

function renderShop() {
  $("shopTitle").textContent = t("hub.tab.shop");
  $("shopLead").textContent =
    state.locale === "ru"
      ? "Офферы только из LiveOps (пустой каталог → пустой UI)."
      : "Offers only from LiveOps (empty catalog → empty UI).";
  const list = $("offerList");
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
    b.disabled = !c.playable || !!diff.result || diff.active !== 0;
    b.innerHTML = `<span class="cost">${c.cost}</span>${t(c.name_key, c.cardId)}
      <span class="sub">${c.unitId} #${c.handIndex}${state.selectedKeep?.mode ? " · KEEP?" : ""}</span>`;
    b.addEventListener("click", async () => {
      if (state.selectedKeep?.mode) {
        await submitAction({
          kind: "keep",
          unitId: c.unitId,
          handIndex: c.handIndex,
        });
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
      li.textContent = state.locale === "ru" ? "Реплеев нет — запусти автобой PvP" : "No replays — run PvP auto";
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
  renderTabs();

  const lo = $("liveopsPill");
  if (state.liveOps) {
    lo.textContent = `LiveOps v${state.liveOpsMeta.version} · ${state.liveOpsMeta.alg || "?"} · ${CLIENT_REGION}`;
    lo.className = "status-pill ok";
  }

  if (state.battle) {
    showView("viewBattle");
    renderBattle();
    return;
  }

  if (state.soon && (state.tab === "clans" || state.tab === "more")) {
    showView("viewSoon");
    renderSoon();
    return;
  }

  switch (state.tab) {
    case "yard":
      showView("viewYard");
      renderYard();
      break;
    case "pvp":
      showView("viewPvp");
      $("pvpTitle").textContent = t("hub.tab.pvp");
      break;
    case "collection":
      showView("viewCollection");
      $("colTitle").textContent = t("hub.tab.collection");
      renderStarters("collectionCards");
      break;
    case "shop":
      showView("viewShop");
      renderShop();
      break;
    default:
      showView("viewYard");
      renderYard();
  }
}

function wireButtons() {
  $("btnTutorial").addEventListener("click", () => startTutorial());
  $("btnYardBattle").addEventListener("click", () => startYard(false));
  $("btnYardAuto").addEventListener("click", () => startYard(true));
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
    state.selectedKeep = null;
    state.tab = "yard";
    renderAll();
  });
  $("btnPvpAuto").addEventListener("click", () => pvpAuto());
  $("btnRefreshReplays").addEventListener("click", () => refreshReplays());
}

async function main() {
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
    state.tab = "yard";
    renderAll();
  } catch (err) {
    $("bootMsg").textContent = `Boot fail: ${err.message}. Подними CDN :8090 и battle :8081 (см. README).`;
    $("liveopsPill").textContent = "LiveOps FAIL";
    $("liveopsPill").className = "status-pill bad";
    console.error(err);
  }
}

main();
