import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { LevelRunResult, AvatarLoadout } from "@mir-games/game-core";
import type { ProgressStore } from "../progress/store.js";

export type HttpApiOptions = {
  port: number;
  store: ProgressStore;
  /** CORS origin for the miniapp (e.g. http://localhost:5173). */
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
 * Phase 3 stub auth: accepts real-looking initData later;
 * for now accepts `demo:<playerId>` and Telegram-style opaque strings mapped to a hash id.
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
  // Opaque Telegram initData — Phase 3 does not HMAC-verify yet (needs bot token secret on server).
  // Map to a stable opaque player id without trusting client-supplied user fields.
  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return { playerId: `tg:${hash.toString(16)}`, displayName: "Telegram player" };
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
        store.setAvatar(playerId, avatar);
        sendJson(res, 200, store.snapshot(playerId), corsOrigin);
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
