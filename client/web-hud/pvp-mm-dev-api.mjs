/**
 * Dev in-memory PvP matchmaking queue + Friendly Duel invites (D-057 / D-061 / D-066).
 * Cross-play single pool: NEVER segments waiters by platform (telegram / web / android / ios).
 * Modes: ranked | unranked | friendly (invite/link, 0 tickets, 0 MMR change).
 */
import crypto from "node:crypto";

/** @type {Map<string, { userId: string, name: string, team: string[], mode: string, platform: string, enqueuedAt: number }>} */
const waiting = new Map();
/**
 * @type {Map<string, {
 *   matchId: string,
 *   mode: string,
 *   seat: 0|1,
 *   team1: string[],
 *   team2: string[],
 *   crossplay: boolean,
 *   platforms: [string, string],
 *   opponent: { userId: string, name: string, team: string[], platform: string }
 * }>}
 */
const matches = new Map();
/**
 * Friendly duel invites by code.
 * @type {Map<string, { code: string, host: { userId: string, name: string, team: string[], platform: string }, matchId: string, status: string, createdAt: number }>}
 */
const friendlyInvites = new Map();

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

function normalizeTeam(team) {
  if (!Array.isArray(team)) return [];
  return team.map((id) => String(id || "")).filter(Boolean).slice(0, 3);
}

function normalizeMode(raw) {
  const m = String(raw || "ranked").toLowerCase();
  if (m === "unranked" || m === "casual") return "unranked";
  if (m === "friendly") return "friendly";
  return "ranked";
}

function normalizePlatform(raw) {
  const p = String(raw || "web").toLowerCase().trim();
  if (["telegram", "tg", "web", "android", "ios"].includes(p)) {
    return p === "tg" ? "telegram" : p;
  }
  return "web";
}

function snapshotFor(userId) {
  const id = String(userId || "");
  const matched = matches.get(id);
  if (matched) {
    return {
      ok: true,
      status: "matched",
      mode: matched.mode || "ranked",
      matchId: matched.matchId,
      seat: matched.seat,
      team1: [...matched.team1],
      team2: [...matched.team2],
      crossplay: true,
      platforms: [...(matched.platforms || ["web", "web"])],
      opponent: {
        userId: matched.opponent.userId,
        name: matched.opponent.name,
        team: [...matched.opponent.team],
        platform: matched.opponent.platform || "web",
      },
    };
  }
  const w = waiting.get(id);
  if (w) {
    return { ok: true, status: "waiting", mode: w.mode, crossplay: true };
  }
  return { ok: true, status: "idle" };
}

function leaveQueue(userId) {
  const id = String(userId || "");
  waiting.delete(id);
  matches.delete(id);
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {(res, code, body, headers?) => void} send
 * @returns {Promise<boolean>} true if handled
 */
export async function handlePvpMmDevApi(req, res, send) {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (!u.pathname.startsWith("/api/dev/pvp/mm") && !u.pathname.startsWith("/api/dev/pvp/friendly")) {
    return false;
  }

  const json = (code, body) =>
    send(res, code, body, { "Content-Type": "application/json; charset=utf-8" });

  // --- Friendly Duel by invite/link (D-066) ---
  if (u.pathname === "/api/dev/pvp/friendly/create" && req.method === "POST") {
    const body = await readBody(req);
    const userId = String(body.userId || "").trim();
    const team = normalizeTeam(body.team);
    const name = String(body.name || userId || "Игрок").slice(0, 48);
    const platform = normalizePlatform(body.platform);
    if (!userId) return json(400, { ok: false, error: "userId_required" }), true;
    if (team.length !== 3) return json(400, { ok: false, error: "team_need_3" }), true;

    leaveQueue(userId);
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    friendlyInvites.set(code, {
      code,
      host: { userId, name, team, platform },
      matchId: "",
      status: "waiting",
      createdAt: Date.now(),
    });
    json(200, {
      ok: true,
      status: "waiting",
      mode: "friendly",
      inviteCode: code,
      webPath: `/?duel=${code}`,
      tgStartParam: `duel_${code}`,
      crossplay: true,
    });
    return true;
  }

  if (u.pathname === "/api/dev/pvp/friendly/join" && req.method === "POST") {
    const body = await readBody(req);
    const code = String(body.inviteCode || body.code || "").trim().toUpperCase();
    const userId = String(body.userId || "").trim();
    const team = normalizeTeam(body.team);
    const name = String(body.name || userId || "Игрок").slice(0, 48);
    const platform = normalizePlatform(body.platform);
    if (!code) return json(400, { ok: false, error: "invite_code_required" }), true;
    if (!userId) return json(400, { ok: false, error: "userId_required" }), true;
    if (team.length !== 3) return json(400, { ok: false, error: "team_need_3" }), true;

    const inv = friendlyInvites.get(code);
    if (!inv) return json(404, { ok: false, error: "invite_not_found" }), true;
    if (inv.host.userId === userId) return json(400, { ok: false, error: "cannot_join_own_duel" }), true;
    if (inv.status === "matched") return json(409, { ok: false, error: "invite_already_used" }), true;

    const matchId = `duel_${code}_${Date.now().toString(36)}`;
    const team1 = [...inv.host.team];
    const team2 = [...team];
    const platforms = [inv.host.platform, platform];
    inv.matchId = matchId;
    inv.status = "matched";

    matches.set(inv.host.userId, {
      matchId,
      mode: "friendly",
      seat: 0,
      team1,
      team2,
      crossplay: true,
      platforms,
      opponent: { userId, name, team: [...team], platform },
    });
    matches.set(userId, {
      matchId,
      mode: "friendly",
      seat: 1,
      team1,
      team2,
      crossplay: true,
      platforms,
      opponent: { userId: inv.host.userId, name: inv.host.name, team: [...inv.host.team], platform: inv.host.platform },
    });
    json(200, { ...snapshotFor(userId), inviteCode: code });
    return true;
  }

  if (u.pathname === "/api/dev/pvp/friendly" && req.method === "GET") {
    const code = String(u.searchParams.get("code") || "").trim().toUpperCase();
    const inv = friendlyInvites.get(code);
    if (!inv) return json(404, { ok: false, error: "invite_not_found" }), true;
    json(200, {
      ok: true,
      inviteCode: inv.code,
      status: inv.status,
      hostName: inv.host.name,
      hostPlatform: inv.host.platform,
      matchId: inv.matchId || null,
      crossplay: true,
    });
    return true;
  }

  // --- Common Cross-Play MM Queue (ranked | unranked) ---
  if (u.pathname === "/api/dev/pvp/mm" && req.method === "GET") {
    const userId = u.searchParams.get("userId") || "";
    if (!userId) {
      json(400, { error: "userId_required" });
      return true;
    }
    json(200, snapshotFor(userId));
    return true;
  }

  if (u.pathname === "/api/dev/pvp/mm/enqueue" && req.method === "POST") {
    const body = await readBody(req);
    const userId = String(body.userId || "");
    const team = normalizeTeam(body.team);
    const name = String(body.name || userId || "Игрок").slice(0, 48);
    const mode = normalizeMode(body.mode);
    const platform = normalizePlatform(body.platform); // diagnostic only — single cross-play pool (§0, §8.1)
    if (!userId) {
      json(400, { error: "userId_required" });
      return true;
    }
    if (team.length !== 3) {
      json(400, { error: "team_need_3" });
      return true;
    }

    if (matches.has(userId)) {
      json(200, snapshotFor(userId));
      return true;
    }

    // Pair with oldest other waiter in the SAME mode, regardless of platform (cross-play §0).
    let partnerId = null;
    let partner = null;
    for (const [wid, w] of waiting) {
      if (wid === userId) continue;
      if (w.mode !== mode) continue;
      partnerId = wid;
      partner = w;
      break;
    }

    if (partnerId && partner) {
      waiting.delete(partnerId);
      waiting.delete(userId);
      const matchId = `mm_${mode}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const team1 = [...partner.team];
      const team2 = [...team];
      const platforms = [partner.platform, platform];
      matches.set(partnerId, {
        matchId,
        mode,
        seat: 0,
        team1,
        team2,
        crossplay: true,
        platforms,
        opponent: { userId, name, team: [...team], platform },
      });
      matches.set(userId, {
        matchId,
        mode,
        seat: 1,
        team1,
        team2,
        crossplay: true,
        platforms,
        opponent: {
          userId: partner.userId,
          name: partner.name,
          team: [...partner.team],
          platform: partner.platform,
        },
      });
      json(200, snapshotFor(userId));
      return true;
    }

    waiting.set(userId, { userId, name, team, mode, platform, enqueuedAt: Date.now() });
    json(200, { ok: true, status: "waiting", mode, crossplay: true });
    return true;
  }

  if (u.pathname === "/api/dev/pvp/mm/leave" && req.method === "POST") {
    const body = await readBody(req);
    const userId = String(body.userId || "");
    if (!userId) {
      json(400, { error: "userId_required" });
      return true;
    }
    leaveQueue(userId);
    json(200, { ok: true, status: "idle" });
    return true;
  }

  return false;
}
