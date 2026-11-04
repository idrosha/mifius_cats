#!/usr/bin/env bash
# Mythfel Phase 4 — soft launch harness (§14 limited geo + §8.4 CDN stub + §13).
# No production secrets / store credentials.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pass=0
fail=0
skip=0

run_gate() {
  local id="$1"
  local label="$2"
  shift 2
  printf '\n=== [%s] %s ===\n' "$id" "$label"
  if "$@"; then
    echo "PASS $id"
    pass=$((pass + 1))
    return 0
  else
    echo "FAIL $id"
    fail=$((fail + 1))
    return 1
  fi
}

skip_gate() {
  local id="$1"
  local reason="$2"
  printf '\n=== [%s] SKIP — %s ===\n' "$id" "$reason"
  skip=$((skip + 1))
}

echo "Mythfel soft-launch harness — SSOT §14 / §8.4 / §13"
echo "root: $ROOT"

# 1) Full §13 acceptance (battle/backend/liveops/qa/client*)
if ! "$ROOT/qa/run-acceptance.sh"; then
  echo "FAIL §13-acceptance"
  fail=$((fail + 1))
else
  echo "PASS §13-acceptance"
  pass=$((pass + 1))
fi

# 2) Geo allowlist package + example file
run_gate "§14-geo" "liveops softlaunch geo + example allowlist" \
  bash -c "cd '$ROOT/liveops' && go test ./internal/softlaunch/..."

# 3) CDN stub smoke (health + geo allow/deny) on ephemeral port
run_gate "§8.4-cdn-stub" "LiveOps CDN stub localhost smoke" \
  bash -c "
set -euo pipefail
cd '$ROOT/liveops'
PORT=\$(python3 -c 'import socket; s=socket.socket(); s.bind((\"127.0.0.1\",0)); print(s.getsockname()[1]); s.close()')
GEO='$ROOT/liveops/soft-launch/geo_allowlist.example.json'
go run ./cmd/cdn-stub -addr \"127.0.0.1:\${PORT}\" -geo \"\$GEO\" &
PID=\$!
cleanup() { kill \$PID 2>/dev/null || true; wait \$PID 2>/dev/null || true; }
trap cleanup EXIT
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf \"http://127.0.0.1:\${PORT}/healthz\" >/dev/null; then break; fi
  sleep 0.2
done
curl -sf \"http://127.0.0.1:\${PORT}/healthz\" | grep -q mythfel-liveops-cdn-stub
code_ok=\$(curl -s -o /tmp/mf-lo.json -w '%{http_code}' -H 'X-Client-Region: RU' \"http://127.0.0.1:\${PORT}/v1/liveops.json\")
test \"\$code_ok\" = \"200\"
grep -q '\"feature_flags\"' /tmp/mf-lo.json
sig=\$(curl -sI -H 'X-Client-Region: RU' \"http://127.0.0.1:\${PORT}/v1/liveops.json\" | tr -d '\\r' | awk -F': ' 'tolower(\$1)==\"x-liveops-signature\"{print \$2}')
test -n \"\$sig\"
code_deny=\$(curl -s -o /dev/null -w '%{http_code}' -H 'X-Client-Region: US' \"http://127.0.0.1:\${PORT}/v1/liveops.json\")
test \"\$code_deny\" = \"403\"
"

# 4) Client soft-launch unit tests when SDK present
if command -v dotnet >/dev/null 2>&1; then
  run_gate "§14-client" "client SoftLaunchGeo + HttpLiveOpsSource" \
    bash -c "cd '$ROOT/client' && dotnet test --nologo -v q --filter 'FullyQualifiedName~SoftLaunch|FullyQualifiedName~HttpLiveOps'"
else
  skip_gate "§14-client" "dotnet SDK отсутствует — прогнать локально: cd client && dotnet test"
fi

echo
echo "-------- Phase 4 matrix --------"
echo "PASS runnable: $pass"
echo "FAIL runnable: $fail"
echo "SKIP toolchain: $skip"
echo
echo "MANUAL device rows: qa/DEVICE_SMOKE.md"
echo "Чеклист Phase 4: qa/SOFT_LAUNCH.md"
echo
if [[ "$fail" -gt 0 ]]; then
  echo "Итог Phase 4 in-repo: NOT READY (fix)"
  exit 1
fi
echo "Итог Phase 4 in-repo: READY (auto §13 + CDN stub + geo example; device/prod CDN — blockers)"
exit 0
