/**
 * Dev in-memory PvP matchmaking queue (HUD QA: login1 vs login2).
 * Not Nakama SoT — only when client turns off the bot-MM stub (D-057).
 */

/** @type {Map<string, { userId: string, name: string, team: string[], enqueuedAt: number }>} */
const waiting = new Map();
/** @type {Map<string, { matchId: string, opponent: { userId: string, name: string, team: string[] } }>} */
const matches = new Map();

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

function snapshotFor(userId) {
  const id = String(userId || "");
  const matched = matches.get(id);
  if (matched) {
    return {
      ok: true,
      status: "matched",
      matchId: matched.matchId,
      opponent: {
        userId: matched.opponent.userId,
        name: matched.opponent.name,
        team: [...matched.opponent.team],
      },
    };
  }
  if (waiting.has(id)) {
    return { ok: true, status: "waiting" };
  }
  return { ok: true, status: "idle" };
}

function leaveQueue(userId) {
  const id = String(userId || "");
  waiting.delete(id);
  // Only drop own match row — opponent may still be reading the snapshot.
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
  if (!u.pathname.startsWith("/api/dev/pvp/mm")) return false;

  const json = (code, body) =>
    send(res, code, body, { "Content-Type": "application/json; charset=utf-8" });

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
    if (!userId) {
      json(400, { error: "userId_required" });
      return true;
    }
    if (team.length !== 3) {
      json(400, { error: "team_need_3" });
      return true;
    }

    // Already matched — return the same snapshot (both clients may poll).
    if (matches.has(userId)) {
      json(200, snapshotFor(userId));
      return true;
    }

    // Pair with oldest other waiter.
    let partnerId = null;
    let partner = null;
    for (const [wid, w] of waiting) {
      if (wid === userId) continue;
      partnerId = wid;
      partner = w;
      break;
    }

    if (partnerId && partner) {
      waiting.delete(partnerId);
      waiting.delete(userId);
      const matchId = `mm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      matches.set(userId, {
        matchId,
        opponent: { userId: partner.userId, name: partner.name, team: [...partner.team] },
      });
      matches.set(partnerId, {
        matchId,
        opponent: { userId, name, team: [...team] },
      });
      json(200, snapshotFor(userId));
      return true;
    }

    waiting.set(userId, { userId, name, team, enqueuedAt: Date.now() });
    json(200, { ok: true, status: "waiting" });
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
