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
import { handleDungeonDevApi } from "./dungeon-dev-api.mjs";
import { handleAccountsDevApi } from "./accounts-dev-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
/** Monorepo: client/web-hud → repo root. Amvera flat artifacts: /app is the web-hud root. */
function resolveRepoRoot() {
  const candidates = [__dirname, path.resolve(__dirname, "../..")];
  for (const root of candidates) {
    if (fs.existsSync(path.join(root, "content", "i18n", "ru_en.json"))) return root;
  }
  return path.resolve(__dirname, "../..");
}
const REPO = resolveRepoRoot();

// Amvera requires 0.0.0.0 (not localhost) or the edge returns 502/503.
const HUD_ADDR = process.env.HUD_ADDR || "0.0.0.0";
// HARD: process.env.PORT || 5000 on 0.0.0.0 (Amvera Docker: ENV PORT + containerPort 5000).
// Do NOT read HUD_PORT — leftover HUD_PORT=8088 caused probe miss → SIGTERM → 503.
const HUD_PORT = Number(process.env.PORT) || 5000;
if (!Number.isFinite(HUD_PORT) || HUD_PORT <= 0) {
  console.error(`mythfel-web-hud: bad PORT=${process.env.PORT}`);
  process.exit(1);
}
const BATTLE_URL = (process.env.BATTLE_URL || "http://127.0.0.1:8081").replace(/\/$/, "");
const LIVEOPS_URL = (process.env.LIVEOPS_URL || "http://127.0.0.1:8090").replace(/\/$/, "");
const LOC_PATH =
  process.env.LOC_PATH || path.join(REPO, "content", "i18n", "ru_en.json");
const LIVEOPS_FALLBACK = path.join(REPO, "liveops", "config", "v1", "liveops.json");

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

function cacheControlFor(ext) {
  // Soft-launch cutouts still iterate — keep must-revalidate. Query `?v=` on URLs
  // busts after rebakes; longer max-age cuts repeat downloads on warm sessions.
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico"].includes(ext)) {
    // Query ?v= busts after rebakes; week-long warm cache speeds repeat visits.
    return "public, max-age=604800, immutable";
  }
  if ([".woff", ".woff2"].includes(ext)) {
    return "public, max-age=604800, immutable";
  }
  // Soft-launch: JS/CSS change often (fatality labels, FX). max-age trapped
  // open tabs on pre-deploy app.js (D-041 «котик» after merge) — always revalidate.
  if ([".css", ".js"].includes(ext)) return "no-cache";
  return "no-store";
}

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
    send(res, 200, data, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": cacheControlFor(ext),
    });
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
 * = §5.1 starters (3) + elven-18 shop commons (6 roles × fire/water/wind) + 1 farm
 * → 22 cats. Production GrantStarterKit stays 3 combat + farm (equal decks).
 * Canon: content/cats/elven_18.json · shop_common.json · CAT_HERO_ART.
 */
const SHOP_COMMON_COMBAT = [
  { templateId: "shop_tank_fire", role: "tank", element: "fire" },
  { templateId: "shop_tank_water", role: "tank", element: "water" },
  { templateId: "shop_tank_wind", role: "tank", element: "wind" },
  { templateId: "shop_fighter_fire", role: "fighter", element: "fire" },
  { templateId: "shop_fighter_water", role: "fighter", element: "water" },
  { templateId: "shop_fighter_wind", role: "fighter", element: "wind" },
  { templateId: "shop_assassin_fire", role: "assassin", element: "fire" },
  { templateId: "shop_assassin_water", role: "assassin", element: "water" },
  { templateId: "shop_assassin_wind", role: "assassin", element: "wind" },
  { templateId: "shop_ranger_fire", role: "ranger", element: "fire" },
  { templateId: "shop_ranger_water", role: "ranger", element: "water" },
  { templateId: "shop_ranger_wind", role: "ranger", element: "wind" },
  { templateId: "shop_mage_fire", role: "mage", element: "fire" },
  { templateId: "shop_mage_water", role: "mage", element: "water" },
  { templateId: "shop_mage_wind", role: "mage", element: "wind" },
  { templateId: "shop_support_fire", role: "support", element: "fire" },
  { templateId: "shop_support_water", role: "support", element: "water" },
  { templateId: "shop_support_wind", role: "support", element: "wind" },
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
    // HUD collection slots = visual L→R тыл · центр · авангард (D-034).
    // Sim CreatePvE/PvP order is produced later by collectionPresetTemplateIds flip.
    // Do NOT seed sim [tank,fighter,support] here — that double-flips live PvP paint.
    presets: [
      {
        name: "starter",
        catIds: [cats[2].catId, cats[1].catId, cats[0].catId],
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

  /** Warehouse stub catalog (D-028 / Wave B) — not Nakama SoT; battle does not consume. */
  if (u.pathname === "/api/dev/gear" && req.method === "GET") {
    const gearPath = path.join(PUBLIC, "gear-stub.json");
    try {
      const raw = fs.readFileSync(gearPath, "utf8");
      send(res, 200, JSON.parse(raw), { "Content-Type": "application/json; charset=utf-8" });
    } catch {
      send(res, 200, { stub: true, cap: 96, items: [], note: "HUD local seed; file missing" }, {
        "Content-Type": "application/json; charset=utf-8",
      });
    }
    return;
  }

  if (u.pathname === "/api/dev/breeding" && req.method === "GET") {
    const breedPath = path.join(PUBLIC, "breeding-stub.json");
    try {
      const raw = fs.readFileSync(breedPath, "utf8");
      send(res, 200, JSON.parse(raw), { "Content-Type": "application/json; charset=utf-8" });
    } catch {
      send(res, 200, { stub: true, note: "D-030; file missing", mythicChanceLabel: "малый", mats: [] }, {
        "Content-Type": "application/json; charset=utf-8",
      });
    }
    return;
  }

  /** Collection stub meta (D-031) — cats from grant/profile; presets local. */
  if (u.pathname === "/api/dev/collection" && req.method === "GET") {
    const colPath = path.join(PUBLIC, "collection-stub.json");
    try {
      const raw = fs.readFileSync(colPath, "utf8");
      send(res, 200, JSON.parse(raw), { "Content-Type": "application/json; charset=utf-8" });
    } catch {
      send(res, 200, { stub: true, note: "D-031; file missing", slotCap: 15, presetSlots: 5, presets: [] }, {
        "Content-Type": "application/json; charset=utf-8",
      });
    }
    return;
  }

  if (u.pathname === "/api/dev/starter" && (req.method === "POST" || req.method === "GET")) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let userId = "local_smoke";
    // Soft-launch Web HUD default: full test roster (22 = 3 starters + 18 shop + farm). Pass testRoster:false for pure §5.1.
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

  if (await handleDungeonDevApi(req, res, send, REPO)) {
    return;
  }

  /** QA accounts + friends + DM (login1–4). Falls through if path not matched. */
  if (await handleAccountsDevApi(req, res, send)) {
    return;
  }

  if (u.pathname.startsWith("/api/battle")) {
    // HUD-only hosts (Amvera): healthz must not 502 or boot never reaches the game.
    if (u.pathname === "/api/battle/healthz" || u.pathname.endsWith("/healthz")) {
      try {
        const upstream = await fetch(`${BATTLE_URL}/healthz`, {
          headers: { Accept: "application/json" },
        });
        if (upstream.ok) {
          const buf = Buffer.from(await upstream.arrayBuffer());
          res.writeHead(upstream.status, {
            "Content-Type": upstream.headers.get("content-type") || "application/json",
          });
          res.end(buf);
          return;
        }
      } catch {
        /* fall through to soft stub */
      }
      send(res, 200, { ok: false, service: "battle", stub: true }, {
        "Content-Type": "application/json; charset=utf-8",
      });
      return;
    }
    await proxy(req, res, BATTLE_URL, "/api/battle");
    return;
  }
  if (u.pathname.startsWith("/api/liveops")) {
    // Prefer LiveOps CDN; if unreachable/slow, ship repo liveops.json so boot still enters the game.
    const rest = u.pathname.slice("/api/liveops".length) || "/";
    const wantsBundle = rest.includes("liveops.json");
    try {
      const target = `${LIVEOPS_URL}${rest}${u.search}`;
      const upstream = await fetch(target, {
        method: req.method,
        headers: { Accept: "application/json", "X-Client-Region": req.headers["x-client-region"] || "" },
        signal: AbortSignal.timeout(1500),
      });
      if (upstream.ok) {
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
        return;
      }
    } catch {
      /* fall through to disk fallback */
    }
    if (wantsBundle && fs.existsSync(LIVEOPS_FALLBACK)) {
      serveFile(res, LIVEOPS_FALLBACK);
      return;
    }
    send(res, 503, { error: "liveops unavailable" }, { "Content-Type": "application/json; charset=utf-8" });
    return;
  }
  if (u.pathname === "/loc.json") {
    serveFile(res, LOC_PATH);
    return;
  }

  let rel = decodeURIComponent(u.pathname);
  // Frozen halls. Paths stay even when other screens change.
  if (
    rel === "/pass" ||
    rel === "/pass/" ||
    rel === "/craft" ||
    rel === "/craft/" ||
    rel === "/hero" ||
    rel === "/hero/" ||
    rel === "/barn" ||
    rel === "/barn/" ||
    rel === "/breeding" ||
    rel === "/breeding/" ||
    rel === "/square" ||
    rel === "/square/" ||
    rel === "/fronts" ||
    rel === "/fronts/" ||
    rel === "/pve" ||
    rel === "/pve/" ||
    rel === "/pve-load" ||
    rel === "/pve-load/" ||
    rel === "/pvp-load" ||
    rel === "/pvp-load/" ||
    rel === "/codex" ||
    rel === "/codex/" ||
    rel === "/home" ||
    rel === "/home/"
  ) {
    serveFile(res, path.join(PUBLIC, "index.html"));
    return;
  }
  if (rel === "/" || rel === "") rel = "/index.html";
  // Masters / pre-optimize originals — not for runtime (keep on disk under _src/).
  if (/(^|\/|\\)_src(\/|\\|$)/i.test(rel) || rel.includes("/_src/") || rel.includes("\\_src\\")) {
    send(res, 404, "not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  const filePath = path.normalize(path.join(PUBLIC, rel));
  if (!filePath.startsWith(PUBLIC)) {
    send(res, 403, "forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  serveFile(res, filePath);
});

// Sync bind line so Amvera logs show it even if the process is SIGTERM'd quickly
// (piped stdout can buffer console.log and hide listen until exit).
fs.writeSync(
  1,
  `mythfel-web-hud binding ${HUD_ADDR}:${HUD_PORT} PORT=${process.env.PORT || "(unset)"}\n`,
);

server.on("error", (err) => {
  fs.writeSync(2, `mythfel-web-hud listen failed on ${HUD_ADDR}:${HUD_PORT}: ${err}\n`);
  process.exit(1);
});

process.on("SIGTERM", () => {
  fs.writeSync(1, "mythfel-web-hud SIGTERM — shutting down\n");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
});

server.listen(HUD_PORT, HUD_ADDR, () => {
  fs.writeSync(1, `mythfel-web-hud http://${HUD_ADDR}:${HUD_PORT}/\n`);
  console.log(`  bind env      → PORT=${process.env.PORT || "(unset)"} → ${HUD_PORT}`);
  console.log(`  proxy battle  → ${BATTLE_URL}`);
  console.log(`  proxy liveops → ${LIVEOPS_URL}`);
  console.log(`  loc           → ${LOC_PATH}`);
  console.log(`  public        → ${PUBLIC}`);
  console.log(`  repo          → ${REPO}`);
});
