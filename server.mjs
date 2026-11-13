#!/usr/bin/env node
/**
 * Amvera / npm start entry.
 * - Monorepo checkout: delegates to client/web-hud/server.mjs
 * - Docker image: Dockerfile overwrites this path with the real web-hud server.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const nested = path.join(root, "client", "web-hud", "server.mjs");

if (fs.existsSync(nested)) {
  await import(pathToFileURL(nested).href);
} else {
  console.error(
    "mythfel-web-hud: missing client/web-hud/server.mjs — use the Docker image entry (node server.mjs in /app)",
  );
  process.exit(1);
}
