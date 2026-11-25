#!/usr/bin/env node
/**
 * Smoke: dungeon/raid win paints Stitch result_win (not wireframe).
 * HUD must be up: HUD_PORT=8099 node server.mjs
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HUD = process.env.HUD_URL || "http://127.0.0.1:8099";
const CDP_PORT = Number(process.env.CDP_PORT) || 9361;

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
  const bg = await fetch(`${HUD}/stitch-assets/result-win/bg.jpg`);
  if (!bg.ok) throw new Error(`bg.jpg ${bg.status}`);

  const userData = await mkdtemp(join(tmpdir(), "mf-result-win-smoke-"));
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
    await new Promise((r) => setTimeout(r, 1800));

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
        if (typeof window.mythfelStubLogin === "function") {
          try { window.mythfelStubLogin({ quiet: true }); } catch (_) {}
        }
        const forced = window.mythfelDebugForceBattleResult({
          result: "p1_win",
          mode: "dungeon",
          extra: { selectedDungeonId: "scarlet", dungeonNodeIndex: 99 },
        });
        const root = document.getElementById("viewResultWin");
        const hidden = !root || root.classList.contains("hidden");
        const wire = !!root?.querySelector('[data-purpose="wireframe"]');
        const title = document.getElementById("rwTitle")?.textContent?.trim() || "";
        const retry = !!root?.querySelector('[data-hud-action="result-retry"]');
        const hub = !!root?.querySelector('[data-hud-action="result-hub"]');
        const slots = root?.querySelectorAll("img[data-rw-slot]")?.length || 0;
        const bgEl = root?.querySelector('[style*="result-win/bg"], [style*="background-image"]');
        const painted = !wire && !!title && retry && hub && slots >= 12;
        return {
          ok: painted && !hidden,
          hidden,
          wire,
          title,
          retry,
          hub,
          slots,
          hasBg: !!bgEl,
          view: forced?.view || "",
        };
      })()`,
      returnByValue: true,
      awaitPromise: false,
    });

    const v = probe?.result?.value;
    if (!v?.ok) {
      console.error("FAIL", JSON.stringify(v, null, 2));
      process.exit(1);
    }
    console.log("OK result_win dungeon paint", JSON.stringify(v));
    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    await rm(userData, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
