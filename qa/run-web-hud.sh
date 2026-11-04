#!/usr/bin/env bash
# Mythfel — browser Web HUD + CDN stub + battle/devapi для ручного smoke (без Unity).
# Оставляет процессы в foreground-группе; Ctrl+C гасит все.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v go >/dev/null 2>&1; then
  echo "нужен Go" >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "нужен Node 20+" >&2
  exit 1
fi

CDN_PORT="${CDN_PORT:-8090}"
BATTLE_PORT="${BATTLE_PORT:-8081}"
HUD_PORT="${HUD_PORT:-8088}"
GEO="$ROOT/liveops/soft-launch/geo_allowlist.example.json"
PIDS=()

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

echo "=== LiveOps CDN stub :${CDN_PORT} ==="
(
  cd "$ROOT/liveops"
  go run ./cmd/cdn-stub -addr "127.0.0.1:${CDN_PORT}" -geo "$GEO"
) &
PIDS+=($!)

echo "=== battle/devapi :${BATTLE_PORT} ==="
(
  cd "$ROOT/battle"
  go run ./cmd/devapi -addr "127.0.0.1:${BATTLE_PORT}" -content "$ROOT/content"
) &
PIDS+=($!)

wait_http() {
  local url="$1"
  local name="$2"
  for _ in $(seq 1 80); do
    if curl -sf "$url" >/dev/null; then
      echo "up: $name"
      return 0
    fi
    sleep 0.25
  done
  echo "timeout waiting for $name ($url)" >&2
  return 1
}

wait_http "http://127.0.0.1:${CDN_PORT}/healthz" "cdn-stub"
wait_http "http://127.0.0.1:${BATTLE_PORT}/healthz" "battle-devapi"

echo "=== Mythfel Web HUD :${HUD_PORT} ==="
export HUD_ADDR="${HUD_ADDR:-0.0.0.0}"
export HUD_PORT
export BATTLE_URL="http://127.0.0.1:${BATTLE_PORT}"
export LIVEOPS_URL="http://127.0.0.1:${CDN_PORT}"

node "$ROOT/client/web-hud/server.mjs" &
PIDS+=($!)

wait_http "http://127.0.0.1:${HUD_PORT}/healthz" "web-hud"

echo
echo "READY — открой http://127.0.0.1:${HUD_PORT}/"
echo "  LiveOps  http://127.0.0.1:${CDN_PORT}/v1/liveops.json"
echo "  Battle   http://127.0.0.1:${BATTLE_PORT}/healthz"
echo "Ctrl+C — остановить все."
wait
