import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  getShopCatalog,
  type AvatarLoadout,
  type EquipmentSlot,
  type LevelRunResult,
  type ShopCurrency,
} from "@mir-games/game-core";
import type { ProgressStore } from "../progress/store.js";

export type HttpApiOptions = {
  port: number;
  store: ProgressStore;
  /** CORS origin for the miniapp / web (e.g. http://localhost:5173). */
  corsOrigin: string;
};

type JsonBody = Record<string, unknown>;

async function readJson(req: IncomingMessage): Promise<JsonBody> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw) as JsonBody;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown, corsOrigin: string): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

/**
 * Phase 3/5 stub auth: accepts `demo:<playerId>` and Telegram-style opaque strings mapped to a hash id.
 */
function resolvePlayerFromInitData(initData: string): { playerId: string; displayName?: string } | null {
  const trimmed = initData.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("demo:")) {
    const id = trimmed.slice("demo:".length).trim() || "local-demo";
    return { playerId: `demo:${id}`, displayName: id };
  }
  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return { playerId: `tg:${hash.toString(16)}`, displayName: "Telegram player" };
}

function requirePlayerId(body: JsonBody): string {
  const playerId = typeof body.playerId === "string" ? body.playerId : "";
  if (!playerId) {
    throw new Error("playerId required");
  }
  return playerId;
}

export function startHttpApi(options: HttpApiOptions): Promise<{ close: () => Promise<void> }> {
  const { port, store, corsOrigin } = options;

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      const method = req.method ?? "GET";

      if (method === "OPTIONS") {
        sendJson(res, 204, {}, corsOrigin);
        return;
      }

      if (method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, { ok: true, service: "mir-games-bot-server" }, corsOrigin);
        return;
      }

      if (method === "POST" && url.pathname === "/api/auth/verify") {
        const body = await readJson(req);
        const initData = typeof body.initData === "string" ? body.initData : "";
        const resolved = resolvePlayerFromInitData(initData);
        if (!resolved) {
          sendJson(res, 401, { player: null }, corsOrigin);
          return;
        }
        store.getOrCreate(resolved.playerId, resolved.displayName);
        sendJson(
          res,
          200,
          {
            player: {
              playerId: resolved.playerId,
              displayName: resolved.displayName,
            },
          },
          corsOrigin,
        );
        return;
      }

      if (method === "GET" && url.pathname === "/api/progress") {
        const playerId = url.searchParams.get("playerId");
        if (!playerId) {
          sendJson(res, 400, { error: "playerId required" }, corsOrigin);
          return;
        }
        sendJson(res, 200, store.snapshot(playerId), corsOrigin);
        return;
      }

      if (method === "GET" && url.pathname === "/api/account") {
        const playerId = url.searchParams.get("playerId");
        if (!playerId) {
          sendJson(res, 400, { error: "playerId required" }, corsOrigin);
          return;
        }
        sendJson(res, 200, store.snapshot(playerId), corsOrigin);
        return;
      }

      if (method === "GET" && url.pathname === "/api/shop/catalog") {
        const playerId = url.searchParams.get("playerId");
        const snap = playerId ? store.snapshot(playerId) : null;
        sendJson(
          res,
          200,
          {
            categories: [
              "hats",
              "glasses",
              "shirts",
              "sweaters",
              "accessories",
              "pants",
              "shoes",
            ],
            items: getShopCatalog(),
            championshipUnlocked: snap?.championshipParticipated ?? false,
          },
          corsOrigin,
        );
        return;
      }

      if (method === "POST" && url.pathname === "/api/progress/commit") {
        const body = await readJson(req);
        const playerId = typeof body.playerId === "string" ? body.playerId : "";
        const result = body.result as LevelRunResult | undefined;
        if (!playerId || !result || typeof result.levelIndex !== "number") {
          sendJson(res, 400, { error: "playerId and result required" }, corsOrigin);
          return;
        }
        try {
          store.commitRun(playerId, result);
          sendJson(res, 200, store.snapshot(playerId), corsOrigin);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendJson(res, 409, { error: message }, corsOrigin);
        }
        return;
      }

      if (method === "POST" && url.pathname === "/api/progress/avatar") {
        const body = await readJson(req);
        const playerId = typeof body.playerId === "string" ? body.playerId : "";
        const avatar = body.avatar as AvatarLoadout | undefined;
        if (!playerId || !avatar || typeof avatar !== "object") {
          sendJson(res, 400, { error: "playerId and avatar required" }, corsOrigin);
          return;
        }
        try {
          store.setAvatar(playerId, avatar);
          sendJson(res, 200, store.snapshot(playerId), corsOrigin);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendJson(res, 409, { error: message }, corsOrigin);
        }
        return;
      }

      if (method === "POST" && url.pathname === "/api/shop/buy") {
        const body = await readJson(req);
        try {
          const playerId = requirePlayerId(body);
          const itemId = typeof body.itemId === "string" ? body.itemId : "";
          const currency = body.currency as ShopCurrency;
          if (!itemId || (currency !== "points" && currency !== "money")) {
            sendJson(res, 400, { error: "itemId and currency (points|money) required" }, corsOrigin);
            return;
          }
          store.buyItem(playerId, itemId, currency);
          sendJson(res, 200, store.snapshot(playerId), corsOrigin);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const status = message.includes("required") ? 400 : 409;
          sendJson(res, status, { error: message }, corsOrigin);
        }
        return;
      }

      if (method === "POST" && url.pathname === "/api/shop/equip") {
        const body = await readJson(req);
        try {
          const playerId = requirePlayerId(body);
          const itemId = typeof body.itemId === "string" ? body.itemId : "";
          if (!itemId) {
            sendJson(res, 400, { error: "itemId required" }, corsOrigin);
            return;
          }
          store.equipItem(playerId, itemId);
          sendJson(res, 200, store.snapshot(playerId), corsOrigin);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendJson(res, 409, { error: message }, corsOrigin);
        }
        return;
      }

      if (method === "POST" && url.pathname === "/api/shop/unequip") {
        const body = await readJson(req);
        try {
          const playerId = requirePlayerId(body);
          const slot = body.slot as EquipmentSlot;
          if (!slot) {
            sendJson(res, 400, { error: "slot required" }, corsOrigin);
            return;
          }
          store.unequip(playerId, slot);
          sendJson(res, 200, store.snapshot(playerId), corsOrigin);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendJson(res, 409, { error: message }, corsOrigin);
        }
        return;
      }

      if (method === "POST" && url.pathname === "/api/shop/confirm-receipt") {
        const body = await readJson(req);
        try {
          const playerId = requirePlayerId(body);
          const provider = typeof body.provider === "string" ? body.provider : "";
          const receiptId = typeof body.receiptId === "string" ? body.receiptId : "";
          const productId = typeof body.productId === "string" ? body.productId : "";
          store.confirmStubReceipt(playerId, { provider, receiptId, productId });
          sendJson(res, 200, { ok: true, account: store.snapshot(playerId) }, corsOrigin);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendJson(res, 409, { ok: false, error: message }, corsOrigin);
        }
        return;
      }

      if (method === "POST" && url.pathname === "/api/account/profile") {
        const body = await readJson(req);
        try {
          const playerId = requirePlayerId(body);
          const displayName = typeof body.displayName === "string" ? body.displayName : "";
          store.updateProfile(playerId, displayName);
          sendJson(res, 200, store.snapshot(playerId), corsOrigin);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendJson(res, 409, { error: message }, corsOrigin);
        }
        return;
      }

      if (method === "POST" && url.pathname === "/api/account/settings") {
        const body = await readJson(req);
        try {
          const playerId = requirePlayerId(body);
          const language = typeof body.language === "string" ? body.language : undefined;
          const soundEnabled =
            typeof body.soundEnabled === "boolean" ? body.soundEnabled : undefined;
          store.updateSettings(playerId, { language, soundEnabled });
          sendJson(res, 200, store.snapshot(playerId), corsOrigin);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendJson(res, 409, { error: message }, corsOrigin);
        }
        return;
      }

      sendJson(res, 404, { error: "not found" }, corsOrigin);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendJson(res, 500, { error: message }, corsOrigin);
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      console.log(`HTTP API listening on http://127.0.0.1:${port}`);
      resolve({
        close: () =>
          new Promise((resClose, rejClose) => {
            server.close((e) => (e ? rejClose(e) : resClose()));
          }),
      });
    });
  });
}
