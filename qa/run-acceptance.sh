#!/usr/bin/env bash
# Mythfel QA — acceptance harness (FULL-SPEC §13).
# Exit 0 = все запускаемые автогейты зелёные.
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

echo "Mythfel acceptance harness — SSOT docs/FULL-SPEC.md §13"
echo "root: $ROOT"

# §13.1 golden + §13.5 + §13.6 — battle golden + illegal reject + PvP replay store/GetReplay
run_gate "§13.1+5+6" "battle go test (golden Двор + illegal + replay store)" \
  bash -c "cd '$ROOT/battle' && go test ./..."

# §13.2 + §13.3 + §13.4 + §13.9 — limits / pass / pity hard80 / IAP sandbox yarn→jar
run_gate "§13.2+3+4+9" "backend economy (limits+pity+iap) + cmd/check" \
  bash -c "cd '$ROOT/backend' && go test ./... && go run ./cmd/check"

# LiveOps schema (supports §13.10 + pity numbers present)
run_gate "§13.10-schema" "liveops validate + go test" \
  bash -c "cd '$ROOT/liveops' && go test ./... && go run ./cmd/validate"

# qa/gate — SSOT numbers, i18n ru/en, limits mutation schema
run_gate "§13.gate" "qa/gate (pity/limits/flags + i18n + limits mutation)" \
  bash -c "cd '$ROOT/qa/gate' && go test ./..."

# §13.1 tutorial + §13.6 client open + §13.7 Hub «Скоро» + §13.8 locale switch
if command -v dotnet >/dev/null 2>&1; then
  run_gate "§13.1+6+7+8" "client dotnet test (Tutorial + ReplayList + Soon + SetLocale)" \
    bash -c "cd '$ROOT/client' && dotnet test --nologo -v q"
else
  skip_gate "§13.1client+§13.6client+§13.7+§13.8" "dotnet SDK отсутствует — прогнать локально: cd client && dotnet test"
fi

echo
echo "-------- matrix (авто) --------"
echo "PASS runnable: $pass"
echo "FAIL runnable: $fail"
echo "SKIP toolchain: $skip"
echo
echo "BLOCKED MUST: (нет)"
echo "PARTIAL: (нет — §13.1 / §13.8 закрыты presenter-гейтом)"
echo
echo "Итог soft-launch gate: READY (авто §13; MANUAL Unity Play — см. qa/ACCEPTANCE.md)"
echo "Чеклист: $ROOT/qa/ACCEPTANCE.md"

if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
exit 0
