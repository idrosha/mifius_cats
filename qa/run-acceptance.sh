#!/usr/bin/env bash
# Mythfel QA — acceptance harness (FULL-SPEC §13).
# Exit 0 = все запускаемые автогейты зелёные.
# BLOCKED-пункты (§13.4 runtime, §13.6, §13.9) не валят exit; см. ACCEPTANCE.md.
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

# §13.1 PARTIAL + §13.5 — battle golden + illegal reject
run_gate "§13.1+5" "battle go test (golden Двор + illegal play)" \
  bash -c "cd '$ROOT/battle' && go test ./..."

# §13.2 + §13.3 — backend limits / pass / no-ads
run_gate "§13.2+3" "backend economy + cmd/check" \
  bash -c "cd '$ROOT/backend' && go test ./... && go run ./cmd/check"

# LiveOps schema (supports §13.10 + pity numbers present)
run_gate "§13.10-schema" "liveops validate + go test" \
  bash -c "cd '$ROOT/liveops' && go test ./... && go run ./cmd/validate"

# qa/gate — SSOT numbers, i18n ru/en, limits mutation schema
run_gate "§13.gate" "qa/gate (pity/limits/flags + i18n + limits mutation)" \
  bash -c "cd '$ROOT/qa/gate' && go test ./..."

# §13.7 — client Hub «Скоро»
if command -v dotnet >/dev/null 2>&1; then
  run_gate "§13.7+8loc" "client dotnet test (Soon tabs + loc Resolve)" \
    bash -c "cd '$ROOT/client' && dotnet test --nologo -v q"
else
  skip_gate "§13.7" "dotnet SDK отсутствует — прогнать локально: cd client && dotnet test"
fi

echo
echo "-------- matrix (авто) --------"
echo "PASS runnable: $pass"
echo "FAIL runnable: $fail"
echo "SKIP toolchain: $skip"
echo
echo "BLOCKED (не fail харнесса — нет реализации MUST):"
echo "  §13.4 pity hard80 trigger (jar RNG / pity state)"
echo "  §13.6 PvP replay open"
echo "  §13.9 IAP sandbox yarn → jar"
echo "PARTIAL:"
echo "  §13.1 нет туториала (golden победа Двора есть)"
echo "  §13.8 i18n ru/en данные есть; UI switch — нет"
echo
echo "Итог soft-launch gate: NOT READY (см. qa/ACCEPTANCE.md)"
echo "Чеклист: $ROOT/qa/ACCEPTANCE.md"

if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
exit 0
