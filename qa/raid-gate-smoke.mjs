#!/usr/bin/env node
/**
 * Raid pipeline gate smoke — filesystem / design readiness only.
 * Exit 0 = design pack OK but playtest still blocked if G3–G7 fail.
 * Exit 2 = design pack incomplete.
 * Exit 1 = playtest blocked (expected until content+HUD+art land).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rel = (...p) => path.join(root, ...p);
const exists = (...p) => fs.existsSync(rel(...p));

const checks = [];
const add = (id, ok, detail) => checks.push({ id, ok, detail });

add(
  "G1a",
  exists("docs/raids/RAID-01-myaurra.md"),
  "docs/raids/RAID-01-myaurra.md"
);
add(
  "G1b",
  exists("docs/raids/RAID-02-talass.md"),
  "docs/raids/RAID-02-talass.md"
);
add(
  "G1c",
  exists("docs/raids/RAID-03-vulcan.md"),
  "docs/raids/RAID-03-vulcan.md"
);
add("G1d", exists("docs/raids/PATHS-COMPARE.md"), "docs/raids/PATHS-COMPARE.md");
add("G1e", exists("qa/RAID_ACCEPTANCE.md"), "qa/RAID_ACCEPTANCE.md");

add(
  "G2a",
  exists("client/web-hud/design/stitch-src/boss_raid.html"),
  "stitch-src/boss_raid.html"
);
add(
  "G2b",
  exists("client/web-hud/public/stitch/boss_raid.html"),
  "public/stitch/boss_raid.html"
);

const stageDir = rel("content/stages");
const raidStages = fs.existsSync(stageDir)
  ? fs.readdirSync(stageDir).filter((f) => /^raid_/i.test(f) && f.endsWith(".json"))
  : [];
add("G3", raidStages.length >= 3, `raid_* stages found: ${raidStages.length} (${raidStages.join(", ") || "none"})`);

const monsterDir = rel("client/web-hud/public/stitch-assets/monsters/battle");
const monsterFiles = fs.existsSync(monsterDir)
  ? fs
      .readdirSync(monsterDir)
      .filter((f) => /\.(webp|png|jpg|jpeg)$/i.test(f) && !f.startsWith("_"))
  : [];
const needBossArt = ["myaurra-pitboss", "talass-pitboss", "vulcan-pitboss"];
const hasExt = (base) =>
  monsterFiles.some((f) => {
    const n = f.toLowerCase();
    return n.startsWith(base) && (n.endsWith(".png") || n.endsWith(".webp") || n.endsWith(".jpg"));
  });
const missingBoss = needBossArt.filter((b) => !hasExt(b));
const hasUniqueBossArt = missingBoss.length === 0;
add(
  "G4",
  hasUniqueBossArt,
  hasUniqueBossArt
    ? `raid bosses OK (pool=${monsterFiles.length})`
    : `missing: ${missingBoss.join(", ")} (pool=${monsterFiles.length})`
);

const appJs = exists("client/web-hud/public/app.js")
  ? fs.readFileSync(rel("client/web-hud/public/app.js"), "utf8")
  : "";
const hasPathUi =
  /raid[_-]?path|raidPath|развилк|split.?room|viewRaidFight/i.test(appJs);
add("G5", hasPathUi, `raid path/fight UI hooks in app.js: ${hasPathUi}`);

// Shared lobby: raid load must host on viewBossDungeon (not only hidden viewBossRaid).
const sharedLoad =
  /function raidLoadHost\s*\(/.test(appJs) &&
  /function raidLoadTabActive\s*\(/.test(appJs) &&
  /function ensureRaidLoadOverlay\s*\(/.test(appJs) &&
  /boss_dungeon[\s\S]*isRaidLobby|isRaidLobby\(\)[\s\S]*boss_dungeon/.test(
    appJs.match(/function raidLoadTabActive[\s\S]{0,280}/)?.[0] || "",
  );
add(
  "G5b",
  sharedLoad,
  "raid load host on shared dungeon lobby (Данж → рейд start)",
);

const unifiedNav =
  /nav\.sub\.boss_dungeon[\s\S]{0,80}"ru"\s*:\s*"Походы"/.test(
    fs.existsSync(rel("content/i18n/ru_en.json"))
      ? fs.readFileSync(rel("content/i18n/ru_en.json"), "utf8")
      : "",
  ) &&
  /id:\s*"boss_dungeon"/.test(appJs) &&
  !/tabs:\s*\[[\s\S]*?id:\s*"boss_raid"/.test(
    appJs.match(/id:\s*"combat"[\s\S]*?tabs:\s*\[[\s\S]*?\],\s*\n\s*\}/)?.[0] || "",
  );
add("G5c", unifiedNav, "NAV: one Походы tab, no boss_raid subtab (D-062)");

const lobbyHard12 =
  /legion.*12|partySize\s*[:=]\s*12|minPlayers\s*[:=]\s*12|рейд.*12/i.test(appJs) &&
  !/boss_raid[\s\S]{0,200}gated:\s*true/.test(appJs);
// gated tab is OK for SL; hard gate = dedicated min-12 enforcement marker later
add(
  "G6",
  /minRaidPlayers\s*=\s*12|RAID_PARTY_SIZE\s*=\s*12/.test(appJs),
  "hard min-12 constant (minRaidPlayers|RAID_PARTY_SIZE)"
);

const liveops = exists("liveops/config/v1/liveops.json")
  ? fs.readFileSync(rel("liveops/config/v1/liveops.json"), "utf8")
  : "";
add(
  "G7",
  /raid_.*lock|raid_attempts|weekly_raid/i.test(liveops),
  "LiveOps raid lock/attempts keys"
);

const designOk = checks.filter((c) => c.id.startsWith("G1") || c.id.startsWith("G2")).every((c) => c.ok);
const playOk = checks.filter((c) => /^G[3-7]/.test(c.id)).every((c) => c.ok);

console.log("=== Raid gate smoke ===");
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.id}  ${c.detail}`);
}
console.log("---");
console.log(`Design pack: ${designOk ? "PASS" : "FAIL"}`);
console.log(`Playtest gate G3–G7: ${playOk ? "PASS" : "FAIL / BLOCKED"}`);

if (!designOk) process.exit(2);
if (!playOk) process.exit(1);
process.exit(0);
