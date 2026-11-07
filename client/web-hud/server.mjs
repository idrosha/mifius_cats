#!/usr/bin/env node
/**
 * Mythfel Web HUD — tiny static + proxy host for manual QA.
 * Serves public/ and proxies battle/devapi + LiveOps CDN stub (avoids browser CORS).
 * No combat math here — only forward to servers.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const REPO = path.resolve(__dirname, "../..");

const HUD_ADDR = process.env.HUD_ADDR || "0.0.0.0";
const HUD_PORT = Number(process.env.HUD_PORT || 8088);
const BATTLE_URL = (process.env.BATTLE_URL || "http://127.0.0.1:8081").replace(/\/$/, "");
const LIVEOPS_URL = (process.env.LIVEOPS_URL || "http://127.0.0.1:8090").replace(/\/$/, "");
const LOC_PATH =
  process.env.LOC_PATH || path.join(REPO, "content", "i18n", "ru_en.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function send(res, code, body, headers = {}) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, {
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(payload);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "not found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { "Content-Type": MIME[ext] || "application/octet-stream" });
  });
}

async function proxy(req, res, targetBase, stripPrefix) {
  const u = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const rest = u.pathname.slice(stripPrefix.length) || "/";
  const target = `${targetBase}${rest}${u.search}`;
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  let upstream;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
    });
  } catch (err) {
    send(res, 502, {
      error: "upstream_unreachable",
      target,
      message: String(err?.message || err),
    }, { "Content-Type": "application/json; charset=utf-8" });
    return;
  }

  const outHeaders = {
    "Content-Type": upstream.headers.get("content-type") || "application/json",
  };
  for (const h of [
    "X-LiveOps-Version",
    "X-LiveOps-Signature",
    "X-LiveOps-Signature-Alg",
    "ETag",
    "Cache-Control",
  ]) {
    const v = upstream.headers.get(h);
    if (v) outHeaders[h] = v;
  }
  const buf = Buffer.from(await upstream.arrayBuffer());
  res.writeHead(upstream.status, outHeaders);
  res.end(buf);
}

/**
 * Soft-launch **test** roster for Web HUD smoke (not production NewPlayer §5.1).
 * = §5.1 starters (3) + all 12 shop common variants (2×6 classes) + 1 farm
 * → 16 cats. Production GrantStarterKit stays 3 combat + farm (equal decks).
 */
const SHOP_COMMON_COMBAT = [
  { templateId: "shop_tank_stone_a", role: "tank", element: "stone", variant: "a" },
  { templateId: "shop_tank_stone_b", role: "tank", element: "stone", variant: "b" },
  { templateId: "shop_fighter_fire_a", role: "fighter", element: "fire", variant: "a" },
  { templateId: "shop_fighter_fire_b", role: "fighter", element: "fire", variant: "b" },
  { templateId: "shop_assassin_bolt_a", role: "assassin", element: "bolt", variant: "a" },
  { templateId: "shop_assassin_bolt_b", role: "assassin", element: "bolt", variant: "b" },
  { templateId: "shop_ranger_grass_a", role: "ranger", element: "grass", variant: "a" },
  { templateId: "shop_ranger_grass_b", role: "ranger", element: "grass", variant: "b" },
  { templateId: "shop_mage_fire_a", role: "mage", element: "fire", variant: "a" },
  { templateId: "shop_mage_ice_b", role: "mage", element: "ice", variant: "b" },
  { templateId: "shop_support_water_a", role: "support", element: "water", variant: "a" },
  { templateId: "shop_support_water_b", role: "support", element: "water", variant: "b" },
];

function grantStarterKit(userId = "local_smoke", { testRoster = true } = {}) {
  const combat = [
    { templateId: "starter_tank_stone", role: "tank", element: "stone", origin: "starter" },
    { templateId: "starter_fighter_fire", role: "fighter", element: "fire", origin: "starter" },
    { templateId: "starter_support_water", role: "support", element: "water", origin: "starter" },
  ];
  if (testRoster) {
    for (const s of SHOP_COMMON_COMBAT) {
      combat.push({
        templateId: s.templateId,
        role: s.role,
        element: s.element,
        origin: "shop",
        variant: s.variant,
      });
    }
  }
  const cats = combat.map((c, i) => ({
    catId: `${userId}_c${i + 1}`,
    templateId: c.templateId,
    role: c.role,
    element: c.element,
    level: 1,
    rarity: "common",
    origin: c.origin,
    variant: c.variant || null,
    pendantId: "",
    bowByPart: {},
  }));
  cats.push({
    catId: `${userId}_farm1`,
    templateId: "starter_farm_grass",
    role: "farm",
    element: "grass",
    level: 1,
    rarity: "common",
    origin: "farm",
    pendantId: "",
    bowByPart: {},
  });
  const potionIds = [
    "potion_life",
    "potion_stone_skin",
    "potion_spark_claw",
    "potion_nine_lives",
    "potion_cleanse",
    "potion_mint",
  ];
  return {
    userId,
    fish: 200,
    yarn: 0,
    scrap: 20,
    medals: 0,
    bowls: 3,
    pvpTickets: 5,
    jarKey: 0,
    cats,
    presets: [
      {
        name: "starter",
        catIds: [cats[0].catId, cats[1].catId, cats[2].catId],
      },
    ],
    potions: potionIds.map((potionId) => ({ potionId, count: 1 })),
    equalDecks: true,
    gear: null,
    softLaunchTestRoster: !!testRoster,
    shopCommonGranted: testRoster ? SHOP_COMMON_COMBAT.length : 0,
  };
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (u.pathname === "/healthz") {
    send(res, 200, { ok: true, service: "mythfel-web-hud" }, {
      "Content-Type": "application/json; charset=utf-8",
    });
    return;
  }

  if (u.pathname === "/api/dev/starter" && (req.method === "POST" || req.method === "GET")) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let userId = "local_smoke";
    // Soft-launch Web HUD default: full test roster (16 = 3 starters + 12 shop + farm). Pass testRoster:false for pure §5.1.
    let testRoster = u.searchParams.get("testRoster") !== "0";
    try {
      const body = Buffer.concat(chunks).toString("utf8");
      if (body) {
        const parsed = JSON.parse(body);
        if (parsed?.userId) userId = String(parsed.userId);
        if (parsed?.testRoster === false || parsed?.testRoster === 0) testRoster = false;
        if (parsed?.testRoster === true || parsed?.testRoster === 1) testRoster = true;
      }
    } catch {
      /* keep default */
    }
    send(res, 200, grantStarterKit(userId, { testRoster }), {
      "Content-Type": "application/json; charset=utf-8",
    });
    return;
  }

  /** Stub auth for soft-launch smoke — any login/password succeeds. */
  if (u.pathname === "/api/dev/login" && req.method === "POST") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let login = "";
    let password = "";
    try {
      const body = Buffer.concat(chunks).toString("utf8");
      if (body) {
        const parsed = JSON.parse(body);
        login = String(parsed?.login ?? parsed?.user ?? parsed?.email ?? "");
        password = String(parsed?.password ?? "");
      }
    } catch {
      /* empty ok */
    }
    const userId = (login && login.trim()) || "guest_smoke";
    const kit = grantStarterKit(userId.replace(/[^\w.-]+/g, "_").slice(0, 48), {
      testRoster: true,
    });
    send(
      res,
      200,
      {
        ok: true,
        stubAuth: true,
        message: "free login — credentials not validated",
        login: login || userId,
        passwordAccepted: true,
        passwordLength: password.length,
        session: { userId: kit.userId, token: `stub_${kit.userId}` },
        profile: kit,
      },
      { "Content-Type": "application/json; charset=utf-8" },
    );
    return;
  }

  if (u.pathname.startsWith("/api/battle")) {
    await proxy(req, res, BATTLE_URL, "/api/battle");
    return;
  }
  if (u.pathname.startsWith("/api/liveops")) {
    await proxy(req, res, LIVEOPS_URL, "/api/liveops");
    return;
  }
  if (u.pathname === "/loc.json") {
    serveFile(res, LOC_PATH);
    return;
  }

  let rel = decodeURIComponent(u.pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC, rel));
  if (!filePath.startsWith(PUBLIC)) {
    send(res, 403, "forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  serveFile(res, filePath);
});

server.listen(HUD_PORT, HUD_ADDR, () => {
  console.log(`mythfel-web-hud http://${HUD_ADDR}:${HUD_PORT}/`);
  console.log(`  proxy battle  → ${BATTLE_URL}`);
  console.log(`  proxy liveops → ${LIVEOPS_URL}`);
  console.log(`  loc           → ${LOC_PATH}`);
});
