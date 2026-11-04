#!/usr/bin/env bash
# Mythfel — локальный runnable path для DEVICE_SMOKE без Unity Editor / store secrets.
# Поднимает LiveOps CDN stub (:8090) + battle/devapi (:8081) + Mythfel.LocalSmoke.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v go >/dev/null 2>&1; then
  echo "нужен Go (battle + liveops stubs)" >&2
  exit 1
fi
if ! command -v dotnet >/dev/null 2>&1; then
  echo "нужен .NET 8 SDK (client LocalSmoke). Установка: https://dotnet.microsoft.com/download" >&2
  exit 1
fi

CDN_PORT=8090
BATTLE_PORT=8081
GEO="$ROOT/liveops/soft-launch/geo_allowlist.example.json"
PIDS=()

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

echo "=== start LiveOps CDN stub :${CDN_PORT} ==="
(
  cd "$ROOT/liveops"
  go run ./cmd/cdn-stub -addr "127.0.0.1:${CDN_PORT}" -geo "$GEO"
) &
PIDS+=($!)

echo "=== start battle/devapi :${BATTLE_PORT} ==="
(
  cd "$ROOT/battle"
  go run ./cmd/devapi -addr "127.0.0.1:${BATTLE_PORT}" -content "$ROOT/content"
) &
PIDS+=($!)

wait_http() {
  local url="$1"
  local name="$2"
  for _ in $(seq 1 50); do
    if curl -sf "$url" >/dev/null; then
      echo "up: $name"
      return 0
    fi
    sleep 0.2
  done
  echo "timeout waiting for $name ($url)" >&2
  return 1
}

wait_http "http://127.0.0.1:${CDN_PORT}/healthz" "cdn-stub"
wait_http "http://127.0.0.1:${BATTLE_PORT}/healthz" "battle-devapi"

echo "=== Mythfel.LocalSmoke ==="
export LIVEOPS_URL="http://127.0.0.1:${CDN_PORT}/v1/liveops.json"
export BATTLE_URL="http://127.0.0.1:${BATTLE_PORT}/"
export CLIENT_REGION="${CLIENT_REGION:-RU}"

dotnet run --project "$ROOT/client/tools/Mythfel.LocalSmoke" --nologo
status=$?

echo
if [[ "$status" -eq 0 ]]; then
  echo "Локальный smoke READY. Дальше — ручные строки qa/DEVICE_SMOKE.md на устройстве (Unity mobile build вне репо)."
else
  echo "Локальный smoke FAILED (exit $status)."
fi
exit "$status"
