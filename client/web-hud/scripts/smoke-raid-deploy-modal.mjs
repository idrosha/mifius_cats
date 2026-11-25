#!/usr/bin/env node
/**
 * Smoke: raid lobby like dungeon + party scroll 12 + Ready → deploy modal → confirm → start gate.
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

    await send("Runtime.evaluate", {
      expression: `(() => new Promise((resolve) => {
        let n = 0;
        const tick = () => {
          if (typeof window.navigate === "function" || typeof window.mythfelNavigate === "function") return resolve(true);
          if (document.getElementById("viewBossRaid")) return resolve(true);
          if (++n > 80) return resolve(false);
          setTimeout(tick, 200);
        };
        tick();
      }))()`,
      awaitPromise: true,
      returnByValue: true,
    });

    const probe = await send("Runtime.evaluate", {
      expression: `(() => {
        if (typeof window.mythfelStubLogin === "function") window.mythfelStubLogin();
        document.body.classList.remove("mythfel-login");
        if (typeof window.mythfelNavigate === "function") {
          window.mythfelNavigate("boss_raid", { primary: "combat" });
        }
        const root = document.getElementById("viewBossRaid");
        if (!root) return { err: "no viewBossRaid" };
        root.classList.remove("hidden");
        root.querySelector('[data-hud-action="raid-fill-party"]')?.click();
        const party = root.querySelector("[data-raid-party]");
        const partyN = party ? party.children.length : 0;
        const partyScroll = party ? getComputedStyle(party).overflowY : "";
        const modal = root.querySelector("[data-raid-deploy-modal]");
        const modalOpen = modal && !modal.classList.contains("hidden");
        const board = root.querySelector("[data-raid-legion-board]");
        const slots = board ? board.querySelectorAll("[data-raid-form-row]").length : 0;
        const catalog = root.querySelector("[data-raid-catalog]");
        const catalogN = catalog ? catalog.querySelectorAll("[data-raid-id]").length : 0;
        const readyChip = root.querySelector("[data-raid-ready-chip]")?.textContent || "";
        root.querySelector('[data-hud-action="raid-deploy-confirm"]')?.click();
        const modalClosed = !modal || modal.classList.contains("hidden");
        const startBtn = root.querySelector('[data-hud-action="raid-start"]');
        const startEnabled = !!(startBtn && !startBtn.disabled);
        const status = root.querySelector("[data-raid-deploy-status]")?.textContent || "";
        return {
          partyN,
          partyScroll,
          modalOpenBeforeConfirm: modalOpen,
          slots,
          catalogN,
          readyChip,
          modalClosed,
          startEnabled,
          status,
          hasDungeonLikeGrid: !!root.querySelector(".mode-grid"),
        };
      })()`,
      returnByValue: true,
    });

    const r = probe.result?.value || {};
    const fails = [];
    if (r.err) fails.push(r.err);
    if (r.partyN !== 12) fails.push(`partyN=${r.partyN}`);
    if (r.partyScroll !== "auto") fails.push(`partyScroll=${r.partyScroll}`);
    if (!r.modalOpenBeforeConfirm) fails.push("modal not open after bots");
    if (r.slots !== 12) fails.push(`slots=${r.slots}`);
    if (r.catalogN < 1) fails.push(`catalogN=${r.catalogN}`);
    if (!r.modalClosed) fails.push("modal still open after confirm");
    if (!r.startEnabled) fails.push("start still disabled");
    if (!r.hasDungeonLikeGrid) fails.push("no mode-grid");
    if (!String(r.status || "").includes("Строй")) fails.push(`status=${r.status}`);

    if (fails.length) {
      console.error("FAIL", fails, r);
      process.exitCode = 1;
    } else {
      console.log("PASS raid deploy modal", r);
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
