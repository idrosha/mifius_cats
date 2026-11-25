#!/usr/bin/env node
/**
 * Smoke: unified dungeon/raid lobby — filter Данж|Рейд, Ready 4/4 → center legion board (not modal).
 * HUD must be up: PORT=8099 node server.mjs
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
  const userData = await mkdtemp(join(tmpdir(), "mf-raid-deploy-smoke-"));
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

    const probe = await send("Runtime.evaluate", {
      expression: `(() => {
        const u = document.getElementById("loginUserInput");
        const p = document.getElementById("passwordInput");
        if (u) u.value = "qa_smoke";
        if (p) p.value = "qa";
        document.body.classList.remove("mythfel-login");
        if (typeof mythfelStubLogin === "function") mythfelStubLogin();
        return new Promise((resolve) => {
          setTimeout(() => {
            if (typeof mythfelNavigate === "function") mythfelNavigate("boss_raid", { primary: "combat" });
            setTimeout(() => {
              const root = document.getElementById("viewBossDungeon");
              if (!root || root.classList.contains("hidden")) {
                resolve({ err: "viewBossDungeon not shown for boss_raid" });
                return;
              }
              const filters = [...root.querySelectorAll("[data-dungeon-filter]")].map((el) =>
                el.getAttribute("data-dungeon-filter"),
              );
              const raidFilterOn = root
                .querySelector('[data-dungeon-filter="raid"]')
                ?.classList.contains("is-on");
              root.querySelector('[data-hud-action="dungeon-fill-party"]')?.click();
              setTimeout(() => {
                const stageHidden = root.querySelector("[data-dungeon-stage-panel]")?.classList.contains("hidden");
                const deployHidden = root.querySelector("[data-dungeon-deploy-panel]")?.classList.contains("hidden");
                const slots = root.querySelectorAll("[data-raid-form-row]").length;
                const partyN = root.querySelector("[data-dungeon-party]")?.children.length || 0;
                const modal = document.querySelector("[data-raid-deploy-modal]");
                const modalOpen = modal && !modal.classList.contains("hidden") && modal.offsetParent !== null;
                root.querySelector('[data-hud-action="raid-deploy-confirm"]')?.click();
                setTimeout(() => {
                  const startBtn = root.querySelector('[data-hud-action="dungeon-start"]');
                  resolve({
                    filters,
                    raidFilterOn,
                    partyN,
                    stageHidden,
                    deployHidden,
                    slots,
                    modalOpen,
                    startEnabled: !!(startBtn && !startBtn.disabled),
                    startLabel: startBtn?.textContent?.replace(/\\s+/g, " ").trim() || "",
                  });
                }, 200);
              }, 400);
            }, 600);
          }, 600);
        });
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });

    const r = probe.result?.value || {};
    const fails = [];
    if (r.err) fails.push(r.err);
    if (!Array.isArray(r.filters) || !r.filters.includes("dungeon") || !r.filters.includes("raid")) {
      fails.push(`filters=${JSON.stringify(r.filters)}`);
    }
    if (r.filters?.includes("open") || r.filters?.includes("heroic")) fails.push("legacy open/heroic still present");
    if (!r.raidFilterOn) fails.push("raid filter not on after boss_raid nav");
    if (r.partyN !== 4) fails.push(`partyN=${r.partyN}`);
    if (!r.stageHidden) fails.push("stage panel still visible after Ready");
    if (r.deployHidden) fails.push("deploy panel not shown in center");
    if (r.slots !== 12) fails.push(`slots=${r.slots}`);
    if (r.modalOpen) fails.push("legacy modal still open");
    if (!r.startEnabled) fails.push("start still disabled");

    if (fails.length) {
      console.error("FAIL", fails, r);
      process.exitCode = 1;
    } else {
      console.log("PASS unified raid deploy center", r);
    }
    ws.close();
  } finally {
    try {
      chrome.kill("SIGKILL");
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 200));
    await rm(userData, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
