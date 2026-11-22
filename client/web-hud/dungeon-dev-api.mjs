/**
 * Dev SoT stub for coop dungeons: keys + party lobby (in-memory).
 * Mirrors backend/internal/economy/dungeon.go contracts for HUD smoke without Go.
 */
import fs from "node:fs";
import path from "node:path";

const KEY_COST = { scarlet: 80, howl: 90, whisper: 110 };
const STARTER_KEYS = { scarlet: 3, howl: 2, whisper: 2 };

/** @type {Map<string, any>} */
const players = new Map();
/** @type {Map<string, any>} */
const parties = new Map();

function loadCatalog(repoRoot) {
  const p = path.join(repoRoot, "content", "campaign", "dungeons_coop_v1.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function ensurePlayer(userId) {
  const id = String(userId || "local_smoke");
  if (!players.has(id)) {
    players.set(id, {
      userId: id,
      fish: 500,
      keys: { ...STARTER_KEYS },
      firstClear: {},
      rares: [],
      mats: {},
      runs: 0,
      seeded: true,
      partyCode: null,
    });
  }
  return players.get(id);
}

function partySnapshot(code) {
  const p = parties.get(code);
  if (!p) return null;
  return {
    code: p.code,
    dungeonId: p.dungeonId,
    path: p.path,
    fork: p.fork,
    hostId: p.hostId,
    members: p.members.map((m) => ({ ...m })),
    readyCount: p.members.filter((m) => m.ready).length,
    size: p.members.length,
    canStart: p.members.length >= 1 && p.members.every((m) => m.ready),
  };
}

function readBody(req) {
  return new Promise(async (resolve) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString("utf8");
    if (!raw) return resolve({});
    try {
      resolve(JSON.parse(raw));
    } catch {
      resolve({});
    }
  });
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {(res, code, body, headers?) => void} send
 * @param {string} repoRoot
 * @returns {Promise<boolean>} true if handled
 */
export async function handleDungeonDevApi(req, res, send, repoRoot) {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (!u.pathname.startsWith("/api/dev/dungeon")) return false;

  const json = (code, body) =>
    send(res, code, body, { "Content-Type": "application/json; charset=utf-8" });

  if (u.pathname === "/api/dev/dungeon/catalog" && req.method === "GET") {
    try {
      json(200, loadCatalog(repoRoot));
    } catch (err) {
      json(500, { error: String(err?.message || err) });
    }
    return true;
  }

  if (u.pathname === "/api/dev/dungeon/state" && req.method === "GET") {
    const userId = u.searchParams.get("userId") || "local_smoke";
    const p = ensurePlayer(userId);
    json(200, {
      stub: true,
      userId: p.userId,
      fish: p.fish,
      keys: p.keys,
      firstClear: p.firstClear,
      rares: p.rares,
      mats: p.mats,
      runs: p.runs,
      partyCode: p.partyCode,
      party: p.partyCode ? partySnapshot(p.partyCode) : null,
      keyCosts: KEY_COST,
    });
    return true;
  }

  if (u.pathname === "/api/dev/dungeon/keys/buy" && req.method === "POST") {
    const body = await readBody(req);
    const p = ensurePlayer(body.userId);
    const dungeonId = String(body.dungeonId || "");
    const cost = KEY_COST[dungeonId];
    if (!cost) {
      json(400, { error: "unknown_dungeon" });
      return true;
    }
    if (p.fish < cost) {
      json(400, { error: "insufficient_fish", need: cost, fish: p.fish });
      return true;
    }
    p.fish -= cost;
    p.keys[dungeonId] = Number(p.keys[dungeonId] || 0) + 1;
    json(200, { ok: true, keys: p.keys, fish: p.fish });
    return true;
  }

  if (u.pathname === "/api/dev/dungeon/keys/spend" && req.method === "POST") {
    const body = await readBody(req);
    const p = ensurePlayer(body.userId);
    const dungeonId = String(body.dungeonId || "");
    if (!(dungeonId in KEY_COST)) {
      json(400, { error: "unknown_dungeon" });
      return true;
    }
    if (Number(p.keys[dungeonId] || 0) < 1) {
      json(400, { error: "no_key" });
      return true;
    }
    p.keys[dungeonId] -= 1;
    json(200, { ok: true, keys: p.keys });
    return true;
  }

  if (u.pathname === "/api/dev/dungeon/clear" && req.method === "POST") {
    const body = await readBody(req);
    const p = ensurePlayer(body.userId);
    const dungeonId = String(body.dungeonId || "");
    const rareId = body.rareId ? String(body.rareId) : null;
    const first = !p.firstClear[dungeonId];
    if (first) p.firstClear[dungeonId] = true;
    p.runs += 1;
    if (rareId) p.rares.push(rareId);
    if (Array.isArray(body.mats)) {
      for (const m of body.mats) p.mats[m] = Number(p.mats[m] || 0) + 1;
    }
    if (typeof body.fish === "number" && body.fish > 0) p.fish += body.fish;
    json(200, { ok: true, firstClear: first, state: { keys: p.keys, rares: p.rares, runs: p.runs, fish: p.fish, firstClear: p.firstClear } });
    return true;
  }

  if (u.pathname === "/api/dev/dungeon/party/create" && req.method === "POST") {
    const body = await readBody(req);
    const p = ensurePlayer(body.userId);
    const code = `D${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const party = {
      code,
      hostId: p.userId,
      dungeonId: String(body.dungeonId || "scarlet"),
      path: body.path === "long" ? "long" : "short",
      fork: body.fork === "right" ? "right" : "left",
      members: [{ userId: p.userId, name: body.name || "Хост", ready: true, slot: 0 }],
    };
    parties.set(code, party);
    p.partyCode = code;
    json(200, { ok: true, party: partySnapshot(code) });
    return true;
  }

  if (u.pathname === "/api/dev/dungeon/party/join" && req.method === "POST") {
    const body = await readBody(req);
    const p = ensurePlayer(body.userId);
    const code = String(body.code || "").toUpperCase();
    const party = parties.get(code);
    if (!party) {
      json(404, { error: "party_not_found" });
      return true;
    }
    if (party.members.length >= 4) {
      json(400, { error: "party_full" });
      return true;
    }
    if (!party.members.some((m) => m.userId === p.userId)) {
      party.members.push({
        userId: p.userId,
        name: body.name || `Игрок ${party.members.length + 1}`,
        ready: false,
        slot: party.members.length,
      });
    }
    p.partyCode = code;
    json(200, { ok: true, party: partySnapshot(code) });
    return true;
  }

  if (u.pathname === "/api/dev/dungeon/party/ready" && req.method === "POST") {
    const body = await readBody(req);
    const p = ensurePlayer(body.userId);
    const code = p.partyCode || String(body.code || "").toUpperCase();
    const party = parties.get(code);
    if (!party) {
      json(404, { error: "party_not_found" });
      return true;
    }
    const m = party.members.find((x) => x.userId === p.userId);
    if (!m) {
      json(400, { error: "not_in_party" });
      return true;
    }
    m.ready = body.ready !== false;
    if (body.dungeonId) party.dungeonId = String(body.dungeonId);
    if (body.path) party.path = body.path === "long" ? "long" : "short";
    if (body.fork) party.fork = body.fork === "right" ? "right" : "left";
    json(200, { ok: true, party: partySnapshot(code) });
    return true;
  }

  if (u.pathname === "/api/dev/dungeon/party/fill-bots" && req.method === "POST") {
    const body = await readBody(req);
    const p = ensurePlayer(body.userId);
    let code = p.partyCode;
    if (!code || !parties.has(code)) {
      code = `D${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      parties.set(code, {
        code,
        hostId: p.userId,
        dungeonId: String(body.dungeonId || "scarlet"),
        path: body.path === "long" ? "long" : "short",
        fork: body.fork === "right" ? "right" : "left",
        members: [{ userId: p.userId, name: body.name || "Вы", ready: true, slot: 0 }],
      });
      p.partyCode = code;
    }
    const party = parties.get(code);
    const bots = ["Бот·Танк", "Бот·DPS", "Бот·Хил"];
    while (party.members.length < 4) {
      const i = party.members.length;
      party.members.push({
        userId: `bot_${code}_${i}`,
        name: bots[i - 1] || `Бот ${i}`,
        ready: true,
        slot: i,
        bot: true,
      });
    }
    json(200, { ok: true, party: partySnapshot(code) });
    return true;
  }

  if (u.pathname === "/api/dev/dungeon/party" && req.method === "GET") {
    const code = String(u.searchParams.get("code") || "").toUpperCase();
    const snap = partySnapshot(code);
    if (!snap) {
      json(404, { error: "party_not_found" });
      return true;
    }
    json(200, { ok: true, party: snap });
    return true;
  }

  json(404, { error: "unknown_dungeon_route", path: u.pathname });
  return true;
}
