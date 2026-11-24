#!/usr/bin/env node
/**
 * Smoke (static): D-053 turn commit must drop turnCommitPlaying before endTurn
 * so submitAction's final paint cannot leave hand disabled+is-busy-wait.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const appJs = readFileSync(join(ROOT, "public/app.js"), "utf8");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const start = appJs.indexOf("async function commitHandSelectionAndEndTurn()");
assert(start >= 0, "commitHandSelectionAndEndTurn missing");
const slice = appJs.slice(start, start + 1800);

const clearIdx = slice.indexOf("state.turnCommitPlaying = false;");
const endTurnIdx = slice.indexOf('await submitAction({ kind: "endTurn" })');
assert(clearIdx >= 0, "must clear turnCommitPlaying in commit");
assert(endTurnIdx >= 0, "must submit endTurn in commit");
assert(
  clearIdx < endTurnIdx,
  "turnCommitPlaying must clear before endTurn submitAction (hand unlock)",
);
assert(
  /is-busy-wait|turnCommitPlaying stays true|Drop commit lock before endTurn/i.test(slice),
  "commit should document why the flag clears before endTurn",
);

console.log("ok: hand commit clears turnCommitPlaying before endTurn");
