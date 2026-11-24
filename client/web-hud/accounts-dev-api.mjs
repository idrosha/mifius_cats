/**
 * Soft-launch QA accounts + friends + DM chat (file store).
 * Not Nakama SoT — HUD smoke only. Seeds login1…login4 with equal kits.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "qa-accounts.json");

const QA_LOGINS = ["login1", "login2", "login3", "login4"];

/** Elven-18 shop commons — user kit = exactly these 18 combat cats. */
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

const BATTLE_POTIONS = [
  { potionId: "potion_heal", count: 999 },
  { potionId: "potion_energy", count: 999 },
  { potionId: "potion_cleanse", count: 999 },
];

/** @type {{ accounts: Record<string, any>, dms: Record<string, any[]>, global: any[] } | null} */
let store = null;

function emptyStore() {
  return { accounts: {}, dms: {}, global: [] };
}

function loadStore() {
  if (store) return store;
  try {
    if (fs.existsSync(STORE_PATH)) {
      store = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
      if (!store.accounts) store.accounts = {};
      if (!store.dms) store.dms = {};
      if (!Array.isArray(store.global)) store.global = [];
      return store;
    }
  } catch (err) {
    console.warn("qa-accounts load fail:", err?.message || err);
  }
  store = emptyStore();
  return store;
}

function saveStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, STORE_PATH);
}

function dmKey(a, b) {
  return [String(a), String(b)].sort().join(":");
}

function buildQaProfile(login) {
  const userId = login;
  const cats = SHOP_COMMON_COMBAT.map((c, i) => ({
    catId: `${userId}_c${i + 1}`,
    templateId: c.templateId,
    role: c.role,
    element: c.element,
    level: 1,
    rarity: "common",
    origin: "shop",
    pendantId: "",
    bowByPart: {},
  }));
  const presetIds = [cats[0].catId, cats[3].catId, cats[15].catId]; // tank / fighter / support
  return {
    userId,
    login,
    fish: 9999,
    yarn: 500,
    scrap: 200,
    medals: 0,
    bowls: 99,
    pvpTickets: 5,
    jarKey: 0,
    cats,
    presets: [{ name: "qa", catIds: presetIds }],
    potions: BATTLE_POTIONS.map((p) => ({ ...p })),
    equalDecks: true,
    gear: null,
    qaFullKit: true,
    softLaunchTestRoster: true,
    shopCommonGranted: SHOP_COMMON_COMBAT.length,
  };
}

function ensureQaAccount(login) {
  const s = loadStore();
  const id = String(login);
  if (!s.accounts[id]) {
    s.accounts[id] = {
      login: id,
      password: id,
      userId: id,
      profile: buildQaProfile(id),
      friends: [],
      createdAt: Date.now(),
    };
  } else {
    // Refresh kit fields if seed re-run (keep password/friends).
    s.accounts[id].profile = buildQaProfile(id);
    s.accounts[id].password = id;
  }
  return s.accounts[id];
}

/** Seed login1–4 equal kits + mutual friends; wipe DM junk. */
export function seedQaAccounts() {
  const s = loadStore();
  for (const login of QA_LOGINS) ensureQaAccount(login);
  for (const a of QA_LOGINS) {
    s.accounts[a].friends = QA_LOGINS.filter((x) => x !== a);
  }
  // Drop any prior DM threads among QA logins (clean slate).
  for (let i = 0; i < QA_LOGINS.length; i++) {
    for (let j = i + 1; j < QA_LOGINS.length; j++) {
      s.dms[dmKey(QA_LOGINS[i], QA_LOGINS[j])] = [];
    }
  }
  // Strip decorative global spam — keep empty.
  s.global = [];
  saveStore();
  return {
    ok: true,
    seeded: QA_LOGINS.slice(),
    catsEach: SHOP_COMMON_COMBAT.length,
    potions: BATTLE_POTIONS,
    friendsPairs: (QA_LOGINS.length * (QA_LOGINS.length - 1)) / 2,
  };
}

function publicAccount(acc) {
  if (!acc) return null;
  return {
    login: acc.login,
    userId: acc.userId,
    friends: [...(acc.friends || [])],
    profile: acc.profile,
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
 * @returns {Promise<boolean>} true if handled
 */
export async function handleAccountsDevApi(req, res, send) {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (!u.pathname.startsWith("/api/dev/")) return false;

  const json = (code, body) =>
    send(res, code, body, { "Content-Type": "application/json; charset=utf-8" });

  // Seed / reset QA quartet
  if (u.pathname === "/api/dev/accounts/seed" && (req.method === "POST" || req.method === "GET")) {
    return json(200, seedQaAccounts()), true;
  }

  if (u.pathname === "/api/dev/accounts" && req.method === "GET") {
    const s = loadStore();
    return (
      json(200, {
        ok: true,
        accounts: Object.keys(s.accounts).map((login) => ({
          login,
          userId: s.accounts[login].userId,
          friends: s.accounts[login].friends || [],
          cats: (s.accounts[login].profile?.cats || []).length,
          potions: s.accounts[login].profile?.potions || [],
        })),
      }),
      true
    );
  }

  // Override stub login when account exists; create free guest otherwise (smoke).
  if (u.pathname === "/api/dev/login" && req.method === "POST") {
    const body = await readBody(req);
    const login = String(body?.login ?? body?.user ?? body?.email ?? "").trim();
    const password = String(body?.password ?? "");
    const register = !!(body?.register || body?.mode === "register");
    const s = loadStore();

    if (!login) {
      return json(400, { ok: false, error: "login_required" }), true;
    }

    let acc = s.accounts[login];
    if (register) {
      if (acc) return json(409, { ok: false, error: "already_exists" }), true;
      acc = {
        login,
        password: password || login,
        userId: login.replace(/[^\w.-]+/g, "_").slice(0, 48) || `user_${Date.now().toString(36)}`,
        profile: buildQaProfile(login.replace(/[^\w.-]+/g, "_").slice(0, 48) || login),
        friends: [],
        createdAt: Date.now(),
      };
      // Non-QA register still gets equal 18-kit for parity when password matches pattern.
      if (!QA_LOGINS.includes(login)) {
        acc.profile = buildQaProfile(acc.userId);
      }
      s.accounts[login] = acc;
      saveStore();
    } else if (acc) {
      if (String(acc.password) !== password) {
        return json(401, { ok: false, error: "bad_password" }), true;
      }
    } else if (QA_LOGINS.includes(login)) {
      // Auto-heal missing seed
      seedQaAccounts();
      acc = s.accounts[login];
      if (String(acc.password) !== password) {
        return json(401, { ok: false, error: "bad_password" }), true;
      }
    } else {
      // Free smoke login (legacy): ephemeral kit, not persisted.
      const userId = login.replace(/[^\w.-]+/g, "_").slice(0, 48) || "guest_smoke";
      const kit = buildQaProfile(userId);
      return (
        json(200, {
          ok: true,
          stubAuth: true,
          message: "ephemeral smoke login — not persisted",
          login,
          passwordAccepted: true,
          session: { userId, token: `stub_${userId}` },
          profile: kit,
          friends: [],
        }),
        true
      );
    }

    return (
      json(200, {
        ok: true,
        stubAuth: true,
        message: "qa account",
        login: acc.login,
        passwordAccepted: true,
        session: { userId: acc.userId, token: `stub_${acc.userId}` },
        profile: acc.profile,
        friends: [...(acc.friends || [])],
      }),
      true
    );
  }

  if (u.pathname === "/api/dev/friends" && req.method === "GET") {
    const login = String(u.searchParams.get("userId") || u.searchParams.get("login") || "").trim();
    const s = loadStore();
    const acc = s.accounts[login];
    if (!acc) return json(404, { ok: false, error: "unknown_user" }), true;
    const friends = (acc.friends || []).map((fid) => {
      const f = s.accounts[fid];
      return {
        login: fid,
        userId: f?.userId || fid,
        online: true,
        cats: (f?.profile?.cats || []).length,
      };
    });
    return json(200, { ok: true, login, friends }), true;
  }

  if (u.pathname === "/api/dev/friends/add" && req.method === "POST") {
    const body = await readBody(req);
    const login = String(body?.login || body?.userId || "").trim();
    const friend = String(body?.friend || body?.target || "").trim();
    const s = loadStore();
    const a = s.accounts[login];
    const b = s.accounts[friend];
    if (!a || !b) return json(404, { ok: false, error: "unknown_user" }), true;
    if (!a.friends.includes(friend)) a.friends.push(friend);
    if (!b.friends.includes(login)) b.friends.push(login);
    saveStore();
    return json(200, { ok: true, friends: a.friends }), true;
  }

  if (u.pathname === "/api/dev/chat" && req.method === "GET") {
    const login = String(u.searchParams.get("userId") || u.searchParams.get("login") || "").trim();
    const peer = String(u.searchParams.get("peer") || "").trim();
    const channel = String(u.searchParams.get("channel") || (peer ? "dm" : "global"));
    const s = loadStore();
    if (channel === "global") {
      return json(200, { ok: true, channel: "global", messages: s.global.slice(-200) }), true;
    }
    if (!login || !peer) return json(400, { ok: false, error: "login_and_peer_required" }), true;
    const key = dmKey(login, peer);
    const messages = s.dms[key] || [];
    return json(200, { ok: true, channel: "dm", peer, key, messages }), true;
  }

  if (u.pathname === "/api/dev/chat" && req.method === "POST") {
    const body = await readBody(req);
    const login = String(body?.login || body?.userId || "").trim();
    const peer = String(body?.peer || "").trim();
    const text = String(body?.text || body?.message || "").trim();
    const channel = String(body?.channel || (peer ? "dm" : "global"));
    if (!login || !text) return json(400, { ok: false, error: "login_and_text_required" }), true;
    if (text.length > 500) return json(400, { ok: false, error: "too_long" }), true;
    const s = loadStore();
    if (!s.accounts[login] && !QA_LOGINS.includes(login)) {
      // allow ephemeral smoke ids into global only
    }
    const msg = {
      id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      from: login,
      text,
      ts: Date.now(),
    };
    if (channel === "global" && !peer) {
      s.global.push(msg);
      if (s.global.length > 500) s.global = s.global.slice(-400);
      saveStore();
      return json(200, { ok: true, channel: "global", message: msg }), true;
    }
    if (!peer) return json(400, { ok: false, error: "peer_required" }), true;
    const a = s.accounts[login];
    if (a && !(a.friends || []).includes(peer)) {
      return json(403, { ok: false, error: "not_friends" }), true;
    }
    const key = dmKey(login, peer);
    if (!s.dms[key]) s.dms[key] = [];
    s.dms[key].push(msg);
    if (s.dms[key].length > 500) s.dms[key] = s.dms[key].slice(-400);
    saveStore();
    return json(200, { ok: true, channel: "dm", peer, key, message: msg }), true;
  }

  return false;
}

// Auto-seed on first import so login1–4 exist before first request.
seedQaAccounts();
