#!/usr/bin/env node
/**
 * Smoke: victory/defeat screens paint fought winners across PvE · practice · PvP.
 * HUD must be up: PORT=8099 node server.mjs
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HUD = process.env.HUD_URL || "http://127.0.0.1:8099";
const CDP_PORT = Number(process.env.CDP_PORT) || 9351;

async function waitHttp(url, n = 40) {
  for (let i = 0; i < n; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`timeout ${url}`);
}

function cdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const msgId = ++id;
        pending.set(msgId, { res, rej });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
    });
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () => resolve({ ws, send }));
  });
}

async function main() {
  await waitHttp(`${HUD}/`);
  const userData = await mkdtemp(join(tmpdir(), "mf-vic-modes-smoke-"));
  const chrome = spawn(
    "google-chrome",
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--user-data-dir=${userData}`,
      `--remote-debugging-port=${CDP_PORT}`,
      `${HUD}/?region=RU`,
    ],
    { stdio: "ignore" },
  );

  try {
    await waitHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (!page) throw new Error("no CDP page");
    const { ws, send } = await cdp(page.webSocketDebuggerUrl);
    await send("Runtime.enable");
    await new Promise((r) => setTimeout(r, 1500));

    await send("Runtime.evaluate", {
      expression: `(() => new Promise((resolve) => {
        let n = 0;
        const tick = () => {
          if (typeof window.mythfelDebugForceBattleResult === "function") return resolve(true);
          if (++n > 60) return resolve(false);
          setTimeout(tick, 250);
        };
        tick();
      }))()`,
      awaitPromise: true,
      returnByValue: true,
    });

    const probe = await send("Runtime.evaluate", {
      expression: `(() => {
        document.body.classList.remove("mythfel-login");
        const fighters = [
          { id: "p1_0_shop_fighter_fire", side: 0, lane: 0, role: "fighter", hp: 40, alive: true },
          { id: "p1_1_shop_fighter_water", side: 0, lane: 1, role: "fighter", hp: 40, alive: true },
          { id: "p1_2_shop_fighter_wind", side: 0, lane: 2, role: "fighter", hp: 40, alive: true },
        ];
        const dummies = [
          { id: "bot_0_bot_practice_tank_a", side: 1, lane: 0, role: "tank", hp: 0, alive: false },
          { id: "bot_1_bot_practice_fighter_a", side: 1, lane: 1, role: "fighter", hp: 0, alive: false },
          { id: "bot_2_bot_practice_support_a", side: 1, lane: 2, role: "support", hp: 0, alive: false },
        ];
        const foeCats = [
          { id: "p2_0_shop_assassin_fire", side: 1, lane: 0, role: "assassin", hp: 40, alive: true },
          { id: "p2_1_shop_ranger_water", side: 1, lane: 1, role: "ranger", hp: 40, alive: true },
          { id: "p2_2_shop_mage_wind", side: 1, lane: 2, role: "mage", hp: 40, alive: true },
        ];
        const starters = ["starter_tank_stone", "starter_fighter_fire", "starter_support_water"];
        const wrongPvp = ["shop_tank_fire", "shop_fighter_fire", "shop_support_water"];
        const wrongFoe = ["shop_tank_water", "shop_fighter_water", "shop_support_fire"];

        const cases = {};

        // --- PvE win: fought fighters, practiceSquad = starters red herring ---
        window.mythfelDebugForceBattleResult({
          result: "p1_win",
          mode: "pve",
          units: [...fighters, ...dummies.map((u) => ({ ...u, hp: 0, alive: false }))],
          extra: {
            practiceSquad: starters,
            pveChapter: 5,
            selectedStageId: "mythmir_5_f3",
            pveStage: "boss",
          },
        });
        cases.pveWin = {
          view: document.getElementById("viewPveVictory")?.classList.contains("hidden") === false,
          names: [
            document.getElementById("pveVicName3")?.textContent?.trim(),
            document.getElementById("pveVicName2")?.textContent?.trim(),
            document.getElementById("pveVicName1")?.textContent?.trim(),
          ],
          want: ["Ветряной размах", "Гром Клинок", "Рыжик Когти"],
        };

        // --- PvE lose: monster winners ---
        const monsters = [
          { id: "bot_0_bot_ghost_tank_a", side: 1, lane: 0, role: "tank", hp: 40, alive: true },
          { id: "bot_1_bot_ghost_fighter_a", side: 1, lane: 1, role: "fighter", hp: 40, alive: true },
          { id: "bot_2_bot_ghost_support_a", side: 1, lane: 2, role: "support", hp: 40, alive: true },
        ];
        window.mythfelDebugForceBattleResult({
          result: "p2_win",
          mode: "pve",
          units: [
            ...fighters.map((u) => ({ ...u, hp: 0, alive: false })),
            ...monsters,
          ],
          extra: {
            practiceSquad: starters,
            pveChapter: 5,
            selectedStageId: "mythmir_5_f3",
            pveStage: "boss",
          },
        });
        cases.pveLose = {
          view: document.getElementById("viewPveVictory")?.classList.contains("hidden") === false,
          title: document.getElementById("pveVicTitle")?.textContent?.trim(),
          names: [
            document.getElementById("pveVicName3")?.textContent?.trim(),
            document.getElementById("pveVicName2")?.textContent?.trim(),
            document.getElementById("pveVicName1")?.textContent?.trim(),
          ],
          want: ["Блуждающий огонёк", "Клинок душ", "Могильный страж"],
        };

        // --- Practice win: fought fighters vs wrong practiceSquad ---
        window.mythfelDebugForceBattleResult({
          result: "p1_win",
          mode: "practice",
          units: [...fighters, ...dummies],
          extra: { practiceSquad: starters },
        });
        cases.practiceWin = {
          view: document.getElementById("viewVictoryHall")?.classList.contains("hidden") === false,
          names: [...document.querySelectorAll("#vicSlots [data-vic-card] h3, #viewVictoryHall [data-vic-card] h3")].map(
            (el) => el.textContent?.trim(),
          ),
          ids: [...document.querySelectorAll("#vicSlots [data-vic-card], #viewVictoryHall [data-vic-card]")].map((el) =>
            el.getAttribute("data-vic-card"),
          ),
          wantIds: ["shop_fighter_wind", "shop_fighter_water", "shop_fighter_fire"],
        };

        // --- Practice lose: fought dummies as winners ---
        window.mythfelDebugForceBattleResult({
          result: "p2_win",
          mode: "practice",
          units: [
            ...fighters.map((u) => ({ ...u, hp: 0, alive: false })),
            ...dummies.map((u) => ({ ...u, hp: 40, alive: true })),
          ],
          extra: { practiceSquad: starters },
        });
        cases.practiceLose = {
          view: document.getElementById("viewVictoryHall")?.classList.contains("hidden") === false,
          names: [...document.querySelectorAll("#vicSlots [data-vic-card] h3, #viewVictoryHall [data-vic-card] h3")].map(
            (el) => el.textContent?.trim(),
          ),
          ids: [...document.querySelectorAll("#vicSlots [data-vic-card], #viewVictoryHall [data-vic-card]")].map((el) =>
            el.getAttribute("data-vic-card"),
          ),
          wantIds: ["bot_practice_support_a", "bot_practice_fighter_a", "bot_practice_tank_a"],
        };

        // --- PvP win: fought fighters, pvpSquad = wrong ---
        window.mythfelDebugForceBattleResult({
          result: "p1_win",
          mode: "pvp",
          units: [...fighters, ...foeCats.map((u) => ({ ...u, hp: 0, alive: false }))],
          extra: { pvpSquad: wrongPvp, pvpOpponentTeam: wrongFoe },
        });
        cases.pvpWin = {
          view: document.getElementById("viewPvpVictory")?.classList.contains("hidden") === false,
          names: [...document.querySelectorAll("#viewPvpVictory .col-cats b")].map((el) => el.textContent?.trim()),
          tids: [...document.querySelectorAll("#viewPvpVictory .col-cats [data-vic-tid]")].map((el) =>
            el.getAttribute("data-vic-tid"),
          ),
          wantIds: ["shop_fighter_wind", "shop_fighter_water", "shop_fighter_fire"],
        };

        // --- PvP lose: fought foe cats, opponentTeam = wrong ---
        window.mythfelDebugForceBattleResult({
          result: "p2_win",
          mode: "pvp",
          units: [
            ...fighters.map((u) => ({ ...u, hp: 0, alive: false })),
            ...foeCats,
          ],
          extra: { pvpSquad: wrongPvp, pvpOpponentTeam: wrongFoe },
        });
        cases.pvpLose = {
          view: document.getElementById("viewPvpVictory")?.classList.contains("hidden") === false,
          names: [...document.querySelectorAll("#viewPvpVictory .col-cats b")].map((el) => el.textContent?.trim()),
          tids: [...document.querySelectorAll("#viewPvpVictory .col-cats [data-vic-tid]")].map((el) =>
            el.getAttribute("data-vic-tid"),
          ),
          wantIds: ["shop_mage_wind", "shop_ranger_water", "shop_assassin_fire"],
        };

        return cases;
      })()`,
      returnByValue: true,
    });
    ws.close();
    const cases = probe.result?.value || {};
    console.log(JSON.stringify(cases, null, 2));

    const fails = [];
    const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

    if (!cases.pveWin?.view || !eq(cases.pveWin.names, cases.pveWin.want)) {
      fails.push(`pveWin want ${cases.pveWin?.want} got ${cases.pveWin?.names}`);
    }
    if (
      !cases.pveLose?.view ||
      !/ПОРАЖЕНИЕ/i.test(cases.pveLose.title || "") ||
      !eq(cases.pveLose.names, cases.pveLose.want)
    ) {
      fails.push(`pveLose want ${cases.pveLose?.want} got ${cases.pveLose?.names} title=${cases.pveLose?.title}`);
    }
    if (!cases.practiceWin?.view || !eq(cases.practiceWin.ids, cases.practiceWin.wantIds)) {
      fails.push(`practiceWin want ${cases.practiceWin?.wantIds} got ${cases.practiceWin?.ids}`);
    }
    if (!cases.practiceLose?.view || !eq(cases.practiceLose.ids, cases.practiceLose.wantIds)) {
      fails.push(`practiceLose want ${cases.practiceLose?.wantIds} got ${cases.practiceLose?.ids}`);
    }
    if (!cases.pvpWin?.view || !eq(cases.pvpWin.tids, cases.pvpWin.wantIds)) {
      fails.push(`pvpWin want ${cases.pvpWin?.wantIds} got ${cases.pvpWin?.tids}`);
    }
    if (!cases.pvpLose?.view || !eq(cases.pvpLose.tids, cases.pvpLose.wantIds)) {
      fails.push(`pvpLose want ${cases.pvpLose?.wantIds} got ${cases.pvpLose?.tids}`);
    }

    if (fails.length) {
      console.error("FAIL");
      for (const f of fails) console.error(" -", f);
      process.exitCode = 1;
    } else {
      console.log("PASS victory squads: pve/practice/pvp × win/lose");
    }
  } finally {
    chrome.kill("SIGTERM");
    await rm(userData, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error("FAIL", err.message || err);
  process.exit(1);
});
