#!/usr/bin/env node
/**
 * Smoke: PvP lobby hides #wireDock (no battle-log footer).
 * HUD must be up: PORT=8099 node server.mjs
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HUD = process.env.HUD_URL || "http://127.0.0.1:8099";
const CDP_PORT = Number(process.env.CDP_PORT) || 9333;

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
  const userData = await mkdtemp(join(tmpdir(), "mf-wire-smoke-"));
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

    // Wait until navigate is exported from the module boot.
    await send("Runtime.evaluate", {
      expression: `(() => new Promise((resolve) => {
        let n = 0;
        const tick = () => {
          if (typeof window.mythfelNavigate === "function") return resolve(true);
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
        // Plant post-battle leftovers, then open PvP lobby (reported bug surface).
        const banner = document.getElementById("resultBanner");
        if (banner) {
          banner.className = "banner lose";
          banner.textContent = "surrender";
          banner.classList.remove("hidden");
        }
        const log = document.getElementById("pvpLog");
        if (log) log.textContent = "[smoke] CreatePvP\\n[smoke] createPvE mythmir_1_f1";
        const dock = document.getElementById("wireDock");
        // Prove CSS hide even if JS suppress were cleared.
        if (dock) dock.classList.remove("wire-dock-suppressed");
        window.mythfelNavigate("pvp", { primary: "combat" });
        const view = document.getElementById("viewPvp");
        const cs = dock ? getComputedStyle(dock) : null;
        const lr = log ? log.getBoundingClientRect() : null;
        return {
          hasDock: !!dock,
          viewHidden: view ? view.classList.contains("hidden") : null,
          suppressed: dock ? dock.classList.contains("wire-dock-suppressed") : null,
          display: cs ? cs.display : null,
          bannerHidden: banner ? banner.classList.contains("hidden") : null,
          logVisible: !!(
            log &&
            lr &&
            lr.height > 0 &&
            getComputedStyle(log).display !== "none" &&
            cs &&
            cs.display !== "none"
          ),
        };
      })()`,
      returnByValue: true,
    });
    ws.close();
    const result = probe.result?.value;
    console.log("probe", result);
    const ok =
      result?.hasDock &&
      result?.viewHidden === false &&
      result?.suppressed === true &&
      result?.display === "none" &&
      result?.logVisible === false;
    if (!ok) {
      console.error("FAIL wire dock still visible on PvP");
      process.exitCode = 1;
    } else {
      console.log("PASS wire dock hidden on PvP lobby");
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
