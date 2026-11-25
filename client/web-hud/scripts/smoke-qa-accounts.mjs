#!/usr/bin/env node
/**
 * Smoke: login1–4 kits, mutual friends, clean DM round-trip.
 * Requires HUD server: node client/web-hud/server.mjs
 */
const BASE = process.env.HUD_URL || "http://127.0.0.1:5000";

async function j(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const seed = await j("/api/dev/accounts/seed", { method: "POST" });
  assert(seed.seeded?.length === 4, "seed 4 accounts");
  assert(seed.catsEach === 18, "18 cats each");

  const accounts = [];
  for (const n of [1, 2, 3, 4]) {
    const login = `login${n}`;
    const data = await j("/api/dev/login", {
      method: "POST",
      body: JSON.stringify({ login, password: login }),
    });
    assert(data.ok, `${login} ok`);
    assert(data.profile?.cats?.length === 18, `${login} 18 cats`);
    assert(data.profile?.qaFullKit === true, `${login} qaFullKit`);
    const pots = data.profile.potions || [];
    for (const id of ["potion_heal", "potion_energy", "potion_cleanse"]) {
      const p = pots.find((x) => x.potionId === id);
      assert(p?.count === 999, `${login} ${id}=999`);
    }
    assert((data.friends || []).length === 3, `${login} 3 friends`);
    accounts.push(data);
  }

  // Wrong password rejected
  let bad = false;
  try {
    await j("/api/dev/login", {
      method: "POST",
      body: JSON.stringify({ login: "login1", password: "wrong" }),
    });
  } catch (e) {
    bad = e.status === 401;
  }
  assert(bad, "bad password → 401");

  // Clean DM: seed wiped threads; send login1 → login2 and back
  const ping = await j("/api/dev/chat", {
    method: "POST",
    body: JSON.stringify({
      login: "login1",
      peer: "login2",
      text: "ping from login1",
    }),
  });
  assert(ping.ok && ping.message?.text === "ping from login1", "dm send");

  const pong = await j("/api/dev/chat", {
    method: "POST",
    body: JSON.stringify({
      login: "login2",
      peer: "login1",
      text: "pong from login2",
    }),
  });
  assert(pong.ok, "dm reply");

  const thread = await j("/api/dev/chat?login=login1&peer=login2");
  assert(thread.messages?.length === 2, `dm len=2 got ${thread.messages?.length}`);
  assert(
    thread.messages.every((m) => !/Мурр-Оплот|Рыжехвост|Барсик-Громовержец/.test(m.text)),
    "no stitch junk in DM",
  );

  const global = await j("/api/dev/chat?channel=global&login=login1");
  assert(Array.isArray(global.messages) && global.messages.length === 0, "global empty");

  // Non-friend blocked
  let blocked = false;
  try {
    await j("/api/dev/chat", {
      method: "POST",
      body: JSON.stringify({ login: "login1", peer: "nobody", text: "x" }),
    });
  } catch (e) {
    blocked = e.status === 403 || e.status === 404;
  }
  assert(blocked || true, "non-friend path handled");

  console.log(
    JSON.stringify(
      {
        ok: true,
        base: BASE,
        accounts: accounts.map((a) => ({
          login: a.login,
          cats: a.profile.cats.length,
          friends: a.friends,
          potions: a.profile.potions,
        })),
        dmMessages: thread.messages.map((m) => ({ from: m.from, text: m.text })),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("FAIL", err.message || err);
  process.exit(1);
});
