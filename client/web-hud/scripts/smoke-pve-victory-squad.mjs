#!/usr/bin/env node
/**
 * Smoke: PvE victory cards follow fought allies, not practiceSquad/starters.
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
  const userData = await mkdtemp(join(tmpdir(), "mf-pve-vic-smoke-"));
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
        // Red herring: practiceSquad stays starters-shaped while fight was 3 fighters.
        const fought = [
          { id: "p1_0_shop_fighter_fire", side: 0, lane: 0, role: "fighter", hp: 40, alive: true },
          { id: "p1_1_shop_fighter_water", side: 0, lane: 1, role: "fighter", hp: 40, alive: true },
          { id: "p1_2_shop_fighter_wind", side: 0, lane: 2, role: "fighter", hp: 40, alive: true },
          { id: "bot_0_monster_tank", side: 1, lane: 0, role: "tank", hp: 0, alive: false },
          { id: "bot_1_monster_fighter", side: 1, lane: 1, role: "fighter", hp: 0, alive: false },
          { id: "bot_2_monster_support", side: 1, lane: 2, role: "support", hp: 0, alive: false },
        ];
        const out = window.mythfelDebugForceBattleResult({
          result: "p1_win",
          mode: "pve",
          units: fought,
          extra: {
            practiceSquad: ["starter_tank_stone", "starter_fighter_fire", "starter_support_water"],
            pveChapter: 5,
            selectedStageId: "mythmir_5_f3",
            pveStage: "boss",
          },
        });
        const names = [
          document.getElementById("pveVicName3")?.textContent?.trim(),
          document.getElementById("pveVicName2")?.textContent?.trim(),
          document.getElementById("pveVicName1")?.textContent?.trim(),
        ];
        const view = document.getElementById("viewPveVictory");
        return {
          out,
          names,
          viewHidden: view ? view.classList.contains("hidden") : null,
          joined: names.join(" · "),
        };
      })()`,
      returnByValue: true,
    });
    ws.close();
    const result = probe.result?.value;
    console.log("probe", result);
    const names = result?.names || [];
    // Visual L→R = тыл·центр·авангард = wind · water · fire fighters.
    const want = ["Ветряной размах", "Гром Клинок", "Рыжик Когти"];
    const starterOrder =
      names[0]?.includes("Мурка") && names[1]?.includes("Рыжик") && names[2]?.includes("Барсик");
    const matched = want.every((w, i) => names[i] === w);
    if (result?.viewHidden !== false) {
      console.error("FAIL viewPveVictory hidden", result);
      process.exitCode = 1;
    } else if (starterOrder) {
      console.error("FAIL PvE victory still shows starter squad", names);
      process.exitCode = 1;
    } else if (!matched) {
      console.error("FAIL want", want.join(" · "), "got", names.join(" · "));
      process.exitCode = 1;
    } else {
      console.log("PASS PvE victory follows fought allies:", names.join(" · "));
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
