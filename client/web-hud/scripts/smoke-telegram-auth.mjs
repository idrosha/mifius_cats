#!/usr/bin/env node
/**
 * Telegram Mini App auth smoke (no network, no real bot token).
 * Builds initData exactly like Telegram does (HMAC per core.telegram.org/bots/webapps)
 * and checks: valid → ok, tampered / wrong token / expired → rejected.
 * Usage: node client/web-hud/scripts/smoke-telegram-auth.mjs
 */
import crypto from "node:crypto";
import { verifyTelegramInitData } from "../telegram-auth.mjs";

const TOKEN = "123456:TEST_TOKEN_for_smoke_only";
let failed = 0;
function check(name, cond) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failed++;
}

function sign(fields, token) {
  const params = new URLSearchParams(fields);
  const dcs = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const hash = crypto.createHmac("sha256", secret).update(dcs).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

const now = Math.floor(Date.now() / 1000);
const base = {
  auth_date: String(now),
  query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
  user: JSON.stringify({ id: 424242, first_name: "Ирина", username: "irina" }),
};

const good = sign(base, TOKEN);
const r1 = verifyTelegramInitData(good, TOKEN);
check("valid initData accepted", r1.ok === true && r1.user?.id === 424242);

const tampered = good.replace("424242", "999999");
check("tampered user rejected", verifyTelegramInitData(tampered, TOKEN).ok === false);

check("wrong bot token rejected", verifyTelegramInitData(good, "1:other").ok === false);

const old = sign({ ...base, auth_date: String(now - 2 * 24 * 3600) }, TOKEN);
check("expired (>24h) rejected", verifyTelegramInitData(old, TOKEN).ok === false);

check("missing hash rejected", verifyTelegramInitData("auth_date=1&user=%7B%7D", TOKEN).ok === false);
check("empty initData rejected", verifyTelegramInitData("", TOKEN).ok === false);

console.log(failed ? `\nFAILED: ${failed}` : "\nALL PASS");
process.exit(failed ? 1 : 0);
