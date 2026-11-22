/**
 * Long boss must be tougher than short boss (pitboss HP).
 * Usage: node qa/gate/dungeon_boss_hp_smoke.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let fail = 0;
const ok = (m) => console.log(`PASS  ${m}`);
const bad = (m) => {
  fail += 1;
  console.error(`FAIL  ${m}`);
};

function pitbossHp(stageId) {
  const st = JSON.parse(fs.readFileSync(path.join(root, "content/stages", `${stageId}.json`), "utf8"));
  const boss = (st.enemyTeam || []).find((e) => String(e.templateId || "").includes("pitboss"));
  return boss?.baseStats?.hp ?? 0;
}

for (const id of ["scarlet", "howl", "whisper"]) {
  const shortHp = pitbossHp(`dungeon_${id}_boss`);
  const longHp = pitbossHp(`dungeon_${id}_boss_long`);
  if (longHp > shortHp) ok(`${id} long HP ${longHp} > short ${shortHp}`);
  else bad(`${id} long=${longHp} short=${shortHp}`);
}

console.log("");
if (fail) {
  console.error(`RESULT FAIL (${fail})`);
  process.exit(1);
}
console.log("RESULT PASS — long bosses harder");
process.exit(0);
