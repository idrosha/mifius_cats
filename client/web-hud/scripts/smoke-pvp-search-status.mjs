#!/usr/bin/env node
/**
 * Smoke: PvP arena search status — idle empty, searching + timer, found label.
 * HUD must be up: PORT=8099 node server.mjs
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HUD = process.env.HUD_URL || "http://127.0.0.1:8099";
const CDP_PORT = Number(process.env.CDP_PORT) || 9348;

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

async function evalJson(send, expression) {
  const probe = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return probe.result?.value;
}

async function main() {
  await waitHttp(`${HUD}/`);
  const userData = await mkdtemp(join(tmpdir(), "mf-pvp-search-smoke-"));
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
    await new Promise((r) => setTimeout(r, 1200));

    const boot = await evalJson(
      send,
      `(() => new Promise((resolve) => {
        let n = 0;
        const tick = () => {
          if (typeof window.mythfelNavigate === "function") return resolve(true);
          if (++n > 60) return resolve(false);
          setTimeout(tick, 250);
        };
        tick();
      }))()`,
    );
    if (!boot) throw new Error("HUD boot timeout");

    // Persist unlock wins, reload so progress hydrate unlocks PvP.
    await evalJson(
      send,
      `(() => {
        localStorage.setItem("mythfel_sl_progress", JSON.stringify({ pveWins: 3, practiceWins: 0 }));
        location.reload();
        return true;
      })()`,
    );
    await new Promise((r) => setTimeout(r, 1500));
    await evalJson(
      send,
      `(() => new Promise((resolve) => {
        let n = 0;
        const tick = () => {
          if (typeof window.mythfelNavigate === "function") return resolve(true);
          if (++n > 60) return resolve(false);
          setTimeout(tick, 250);
        };
        tick();
      }))()`,
    );

    const idle = await evalJson(
      send,
      `(() => {
        document.body.classList.remove("mythfel-login");
        window.mythfelNavigate("pvp");
        const view = document.getElementById("viewPvp");
        if (!view || view.classList.contains("hidden")) return { ok: false, err: "viewPvp hidden" };
        const banned = (view.textContent || "").includes("Подбор соперника");
        const status = document.getElementById("arenaSearchStatus")?.textContent?.trim() || "";
        const timerHidden = document.getElementById("arenaSearchTimer")?.classList.contains("hidden");
        const iconHidden = document.getElementById("arenaSearchIcon")?.classList.contains("hidden");
        const row = document.getElementById("arenaSearchStatusRow");
        const btn = document.getElementById("btnArenaSearch");
        return {
          ok: !banned && status === "" && timerHidden && iconHidden && row?.dataset.state === "idle" && !!btn,
          banned,
          status,
          timerHidden,
          iconHidden,
          state: row?.dataset.state || "",
        };
      })()`,
    );
    if (!idle?.ok) throw new Error("idle status failed: " + JSON.stringify(idle));

    const searching = await evalJson(
      send,
      `(() => new Promise((resolve) => {
        const btn = document.getElementById("btnArenaSearch");
        btn?.click();
        let n = 0;
        const tick = () => {
          const status = document.getElementById("arenaSearchStatus")?.textContent?.trim() || "";
          const timer = document.getElementById("arenaSearchTimer");
          const icon = document.getElementById("arenaSearchIcon");
          const row = document.getElementById("arenaSearchStatusRow");
          const ready =
            status === "Идёт поиск" &&
            timer &&
            !timer.classList.contains("hidden") &&
            icon &&
            !icon.classList.contains("hidden") &&
            row?.dataset.state === "searching";
          if (ready) {
            return resolve({
              ok: true,
              status,
              timer: timer.textContent,
              icon: icon.textContent,
              state: row.dataset.state,
            });
          }
          if (++n > 40) {
            return resolve({
              ok: false,
              status,
              timer: timer?.textContent,
              timerHidden: timer?.classList.contains("hidden"),
              iconHidden: icon?.classList.contains("hidden"),
              state: row?.dataset.state,
            });
          }
          setTimeout(tick, 100);
        };
        tick();
      }))()`,
    );
    if (!searching?.ok) throw new Error("searching status failed: " + JSON.stringify(searching));

    // Wait past stub MM delay; catch "Соперник найден" before load screen.
    const found = await evalJson(
      send,
      `(() => new Promise((resolve) => {
        let n = 0;
        let sawFound = false;
        const tick = () => {
          const status = document.getElementById("arenaSearchStatus")?.textContent?.trim() || "";
          const row = document.getElementById("arenaSearchStatusRow");
          const load = document.getElementById("viewPvpLoad");
          if (status === "Соперник найден" || row?.dataset.state === "found") sawFound = true;
          const loadOpen = load && !load.classList.contains("hidden");
          if (sawFound || loadOpen) {
            return resolve({
              ok: sawFound || loadOpen,
              sawFound,
              loadOpen,
              status,
              state: row?.dataset.state || "",
            });
          }
          if (++n > 50) {
            return resolve({ ok: false, status, state: row?.dataset.state || "", sawFound, loadOpen });
          }
          setTimeout(tick, 100);
        };
        tick();
      }))()`,
    );
    if (!found?.ok) throw new Error("found status failed: " + JSON.stringify(found));

    console.log(JSON.stringify({ idle, searching, found }, null, 2));
    console.log("smoke-pvp-search-status: OK");
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
