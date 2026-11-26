/**
 * Telegram Mini App auth: verify WebApp initData (HMAC-SHA256 per Telegram docs)
 * and open/create the matching HUD account. Token comes from BOT_TOKEN env only.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
import crypto from "node:crypto";
import { loginTelegramAccount } from "./accounts-dev-api.mjs";

const MAX_AUTH_AGE_SEC = 24 * 60 * 60;

/**
 * @param {string} initData raw query string from Telegram.WebApp.initData
 * @param {string} botToken
 * @returns {{ ok: true, user: { id: number, first_name?: string } } | { ok: false, error: string }}
 */
export function verifyTelegramInitData(initData, botToken, nowSec = Math.floor(Date.now() / 1000)) {
  if (!initData || !botToken) return { ok: false, error: "missing_init_data" };
  const params = new URLSearchParams(String(initData));
  const hash = params.get("hash");
  if (!hash) return { ok: false, error: "no_hash" };
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(hash).toLowerCase(), "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: "bad_signature" };
  }

  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || nowSec - authDate > MAX_AUTH_AGE_SEC) {
    return { ok: false, error: "expired" };
  }

  let user;
  try {
    user = JSON.parse(params.get("user") || "null");
  } catch {
    user = null;
  }
  if (!user || user.id == null) return { ok: false, error: "no_user" };
  return { ok: true, user };
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * POST /api/tg/login  body: { initData }  →  same shape as /api/dev/login.
 * @returns {Promise<boolean>} true if handled
 */
export async function handleTelegramApi(req, res, send) {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (u.pathname !== "/api/tg/login") return false;

  const json = (code, body) =>
    send(res, code, body, { "Content-Type": "application/json; charset=utf-8" }, req);

  if (req.method !== "POST") {
    json(405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  const botToken = process.env.BOT_TOKEN || "";
  if (!botToken) {
    json(503, { ok: false, error: "telegram_not_configured" });
    return true;
  }

  const body = await readJsonBody(req);
  const verdict = verifyTelegramInitData(String(body?.initData || ""), botToken);
  if (!verdict.ok) {
    json(401, { ok: false, error: verdict.error });
    return true;
  }

  json(200, loginTelegramAccount({ tgId: verdict.user.id, firstName: verdict.user.first_name || "" }));
  return true;
}
