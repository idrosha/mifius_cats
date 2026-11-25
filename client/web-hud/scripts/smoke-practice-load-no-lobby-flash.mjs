#!/usr/bin/env node
/**
 * Smoke: practice load → fight must not flash the dojo lobby after 100%.
 * HUD must be up: PORT=8099 node server.mjs (+ battle/devapi).
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HUD = process.env.HUD_URL || "http://127.0.0.1:8099";
const CDP_PORT = Number(process.env.CDP_PORT) || 9347;

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
  const userData = await mkdtemp(join(tmpdir(), "mf-practice-load-smoke-"));
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
          if (typeof window.mythfelNavigate === "function" && typeof window.mythfelStubLogin === "function")
            return resolve(true);
          if (++n > 80) return resolve(false);
          setTimeout(tick, 250);
        };
        tick();
      }))()`,
      awaitPromise: true,
      returnByValue: true,
    });

    const result = await send("Runtime.evaluate", {
      expression: `(() => new Promise(async (resolve) => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        try {
          // Free smoke login (form submit path).
          const loginInput = document.getElementById("loginUserInput");
          if (loginInput) loginInput.value = "smoke_practice_load";
          window.mythfelStubLogin({ preventDefault() {} });
          await sleep(800);

          window.mythfelNavigate("practice", { primary: "combat" });
          await sleep(400);

          // Force a full 3-cat squad via autopick path / direct state through start CTA readiness.
          const auto = document.querySelector("[data-dojo='autopick']");
          if (auto) auto.click();
          else {
            // Fallback: fill via roster clicks if autopick missing.
            const cards = [...document.querySelectorAll("#viewPractice [data-hero]")].slice(0, 3);
            for (const c of cards) c.click();
          }
          await sleep(200);

          // Delay CreatePvE so a premature lobby reveal is observable.
          const origFetch = window.fetch.bind(window);
          window.fetch = (input, init) => {
            const url = typeof input === "string" ? input : input?.url || "";
            if (String(url).includes("/api/battle/v1/CreatePvE")) {
              return sleep(900).then(() => origFetch(input, init));
            }
            return origFetch(input, init);
          };

          const samples = [];
          const sample = () => {
            const practice = document.getElementById("viewPractice");
            const load = practice?.querySelector(".dojo-load");
            const fight = document.getElementById("viewPracticeFight");
            const pct = document.getElementById("dojoLoadPct")?.textContent || "";
            samples.push({
              t: Date.now(),
              pct,
              practiceHidden: practice ? practice.classList.contains("hidden") : null,
              loadHidden: load ? !!load.hidden : null,
              loadDataset: practice?.dataset?.practiceLoad || null,
              fightHidden: fight ? fight.classList.contains("hidden") : null,
            });
          };

          const startBtn = document.querySelector("#btnDojoStart, .dojo-start");
          if (!startBtn) throw new Error("no start button");
          startBtn.click();

          // Poll through load bar + delayed CreatePvE + fight paint.
          const t0 = Date.now();
          while (Date.now() - t0 < 8000) {
            sample();
            const fight = document.getElementById("viewPracticeFight");
            if (fight && !fight.classList.contains("hidden")) break;
            await sleep(50);
          }
          sample();

          // Lobby flash = load overlay already hidden while practice view still shown and fight not yet.
          const flashes = samples.filter(
            (s) =>
              s.loadHidden === true &&
              s.practiceHidden === false &&
              s.fightHidden !== false &&
              (s.pct === "100%" || Number(String(s.pct).replace("%", "")) >= 100),
          );

          const last = samples[samples.length - 1] || null;
          resolve({
            ok: flashes.length === 0 && last && last.fightHidden === false,
            flashCount: flashes.length,
            sampleCount: samples.length,
            last,
            flashes: flashes.slice(0, 5),
          });
        } catch (err) {
          resolve({ ok: false, error: String(err && err.message ? err.message : err) });
        }
      }))()`,
      awaitPromise: true,
      returnByValue: true,
    });

    const value = result?.result?.value;
    console.log(JSON.stringify(value, null, 2));
    if (!value?.ok) {
      process.exitCode = 1;
      throw new Error(`smoke failed: ${JSON.stringify(value)}`);
    }
    console.log("PASS practice load → fight (no lobby flash)");
    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    await rm(userData, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
