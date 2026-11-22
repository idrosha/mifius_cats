/**
 * Smoke for dungeon-dev-api (keys + party) without full HUD server.
 * Usage: node qa/gate/dungeon_api_smoke.mjs
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleDungeonDevApi } from "../../client/web-hud/dungeon-dev-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

function send(res, code, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(code, { "Cache-Control": "no-store", ...headers });
  res.end(payload);
}

let fail = 0;
function ok(m) {
  console.log(`PASS  ${m}`);
}
function bad(m) {
  fail += 1;
  console.error(`FAIL  ${m}`);
}

async function req(port, method, urlPath, body) {
  const payload = body ? JSON.stringify(body) : null;
  const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload || undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

const server = http.createServer(async (req, res) => {
  if (await handleDungeonDevApi(req, res, send, root)) return;
  send(res, 404, { error: "nope" }, { "Content-Type": "application/json" });
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

try {
  let r = await req(port, "GET", "/api/dev/dungeon/state?userId=qa1");
  if (r.status === 200 && r.data.keys?.scarlet === 3) ok("state starter keys");
  else bad(`state ${JSON.stringify(r.data)}`);

  r = await req(port, "POST", "/api/dev/dungeon/keys/spend", { userId: "qa1", dungeonId: "scarlet" });
  if (r.data.ok && r.data.keys.scarlet === 2) ok("spend key");
  else bad(`spend ${JSON.stringify(r.data)}`);

  r = await req(port, "POST", "/api/dev/dungeon/keys/buy", { userId: "qa1", dungeonId: "howl" });
  if (r.data.ok && r.data.keys.howl >= 3) ok("buy key");
  else bad(`buy ${JSON.stringify(r.data)}`);

  r = await req(port, "POST", "/api/dev/dungeon/party/create", {
    userId: "qa1",
    dungeonId: "scarlet",
    path: "short",
  });
  const code = r.data.party?.code;
  if (code) ok(`party create ${code}`);
  else bad(`create ${JSON.stringify(r.data)}`);

  r = await req(port, "POST", "/api/dev/dungeon/party/join", {
    userId: "qa2",
    code,
    name: "Второй",
  });
  if (r.data.ok && r.data.party?.size === 2) ok("party join second player");
  else bad(`join ${JSON.stringify(r.data)}`);

  r = await req(port, "POST", "/api/dev/dungeon/party/ready", {
    userId: "qa2",
    code,
    ready: true,
  });
  if (r.data.party?.readyCount >= 2) ok("party ready sync");
  else bad(`ready ${JSON.stringify(r.data)}`);

  r = await req(port, "POST", "/api/dev/dungeon/party/fill-bots", {
    userId: "qa1",
    dungeonId: "scarlet",
  });
  if (r.data.party?.readyCount === 4) ok("party 4/4 bots");
  else bad(`bots ${JSON.stringify(r.data)}`);

  r = await req(port, "POST", "/api/dev/dungeon/clear", {
    userId: "qa1",
    dungeonId: "scarlet",
    rareId: "rare_scarlet_belt",
    fish: 80,
    mats: ["collar_fragment"],
  });
  if (r.data.firstClear === true && r.data.state?.rares?.includes("rare_scarlet_belt")) ok("clear first+rare");
  else bad(`clear ${JSON.stringify(r.data)}`);

  // unique boss arts exist
  const arts = [
    "dungeon-scarlet-boss-cutout-faceleft.webp",
    "dungeon-howl-boss-cutout-faceleft.webp",
    "dungeon-whisper-boss-cutout-faceleft.webp",
  ];
  const { default: fs } = await import("node:fs");
  for (const a of arts) {
    const p = path.join(root, "client/web-hud/public/stitch-assets/monsters/battle", a);
    if (fs.existsSync(p)) ok(`art ${a}`);
    else bad(`missing art ${a}`);
  }
} finally {
  server.close();
}

console.log("");
if (fail) {
  console.error(`RESULT FAIL (${fail})`);
  process.exit(1);
}
console.log("RESULT PASS — dungeon api + party + boss art aliases");
process.exit(0);
