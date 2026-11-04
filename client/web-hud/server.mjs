#!/usr/bin/env node
/**
 * Mythfel Web HUD — tiny static + proxy host for manual QA.
 * Serves public/ and proxies battle/devapi + LiveOps CDN stub (avoids browser CORS).
 * No combat math here — only forward to servers.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const REPO = path.resolve(__dirname, "../..");

const HUD_ADDR = process.env.HUD_ADDR || "0.0.0.0";
const HUD_PORT = Number(process.env.HUD_PORT || 8088);
const BATTLE_URL = (process.env.BATTLE_URL || "http://127.0.0.1:8081").replace(/\/$/, "");
const LIVEOPS_URL = (process.env.LIVEOPS_URL || "http://127.0.0.1:8090").replace(/\/$/, "");
const LOC_PATH =
  process.env.LOC_PATH || path.join(REPO, "content", "i18n", "ru_en.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function send(res, code, body, headers = {}) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, {
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(payload);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "not found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { "Content-Type": MIME[ext] || "application/octet-stream" });
  });
}

async function proxy(req, res, targetBase, stripPrefix) {
  const u = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const rest = u.pathname.slice(stripPrefix.length) || "/";
  const target = `${targetBase}${rest}${u.search}`;
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  let upstream;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
    });
  } catch (err) {
    send(res, 502, {
      error: "upstream_unreachable",
      target,
      message: String(err?.message || err),
    }, { "Content-Type": "application/json; charset=utf-8" });
    return;
  }

  const outHeaders = {
    "Content-Type": upstream.headers.get("content-type") || "application/json",
  };
  for (const h of [
    "X-LiveOps-Version",
    "X-LiveOps-Signature",
    "X-LiveOps-Signature-Alg",
    "ETag",
    "Cache-Control",
  ]) {
    const v = upstream.headers.get(h);
    if (v) outHeaders[h] = v;
  }
  const buf = Buffer.from(await upstream.arrayBuffer());
  res.writeHead(upstream.status, outHeaders);
  res.end(buf);
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (u.pathname === "/healthz") {
    send(res, 200, { ok: true, service: "mythfel-web-hud" }, {
      "Content-Type": "application/json; charset=utf-8",
    });
    return;
  }

  if (u.pathname.startsWith("/api/battle")) {
    await proxy(req, res, BATTLE_URL, "/api/battle");
    return;
  }
  if (u.pathname.startsWith("/api/liveops")) {
    await proxy(req, res, LIVEOPS_URL, "/api/liveops");
    return;
  }
  if (u.pathname === "/loc.json") {
    serveFile(res, LOC_PATH);
    return;
  }

  let rel = decodeURIComponent(u.pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC, rel));
  if (!filePath.startsWith(PUBLIC)) {
    send(res, 403, "forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  serveFile(res, filePath);
});

server.listen(HUD_PORT, HUD_ADDR, () => {
  console.log(`mythfel-web-hud http://${HUD_ADDR}:${HUD_PORT}/`);
  console.log(`  proxy battle  → ${BATTLE_URL}`);
  console.log(`  proxy liveops → ${LIVEOPS_URL}`);
  console.log(`  loc           → ${LOC_PATH}`);
});
