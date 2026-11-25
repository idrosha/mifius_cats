#!/usr/bin/env node
/**
 * Smoke: auction search + category/rank chips filter painted lots.
 * HUD must be up: PORT=8099 node server.mjs
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HUD = process.env.HUD_URL || "http://127.0.0.1:8099";
const CDP_PORT = Number(process.env.CDP_PORT) || 9341;

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
  const userData = await mkdtemp(join(tmpdir(), "mf-auc-smoke-"));
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
        if (typeof window.mythfelNavigate === "function") window.mythfelNavigate("auction");
        else if (typeof window.navigate === "function") window.navigate("auction");
        const view = document.getElementById("viewAuction");
        if (!view || view.classList.contains("hidden")) {
          return { ok: false, err: "viewAuction hidden" };
        }
        const total = view.querySelectorAll("#lots-container .lot-card").length;
        const search = view.querySelector("#auctionSearch");
        if (!search) return { ok: false, err: "no #auctionSearch" };
        search.value = "Багровый";
        search.dispatchEvent(new Event("input", { bubbles: true }));
        const afterSearch = [...view.querySelectorAll("#lots-container .lot-card")].filter(
          (c) => c.style.display !== "none",
        ).length;
        const armorBtn = view.querySelector('[data-auction-cat="armor"]');
        if (!armorBtn) return { ok: false, err: "no armor chip" };
        armorBtn.click();
        const afterArmor = [...view.querySelectorAll("#lots-container .lot-card")].filter(
          (c) => c.style.display !== "none",
        ).length;
        const names = [...view.querySelectorAll("#lots-container .lot-card")]
          .filter((c) => c.style.display !== "none")
          .map((c) => c.querySelector(".font-headline-md")?.textContent?.trim() || "");
        const allBtn = view.querySelector('[data-auction-cat="all"]');
        allBtn?.click();
        search.value = "";
        search.dispatchEvent(new Event("input", { bubbles: true }));
        const afterReset = [...view.querySelectorAll("#lots-container .lot-card")].filter(
          (c) => c.style.display !== "none",
        ).length;
        const weaponBtn = view.querySelector('[data-auction-cat="weapon"]');
        weaponBtn?.click();
        const afterWeapon = [...view.querySelectorAll("#lots-container .lot-card")].filter(
          (c) => c.style.display !== "none",
        ).length;
        const countText = view.querySelector("#auctionLotCount")?.textContent || "";
        const ok =
          total >= 10 &&
          afterSearch >= 4 &&
          afterSearch < total &&
          afterArmor >= 4 &&
          afterArmor <= afterSearch &&
          names.every((n) => /багров/i.test(n)) &&
          afterReset === total &&
          afterWeapon >= 1 &&
          afterWeapon < total &&
          Number(countText) === afterWeapon;
        return {
          ok,
          total,
          afterSearch,
          afterArmor,
          names,
          afterReset,
          afterWeapon,
          countText,
        };
      })()`,
      returnByValue: true,
    });

    const result = probe.result?.value;
    console.log(JSON.stringify(result, null, 2));
    if (!result?.ok) {
      throw new Error("auction filter smoke failed: " + JSON.stringify(result));
    }
    console.log("smoke-auction-filters: OK");
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
