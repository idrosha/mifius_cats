#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cat <<EOF
=== Мифоус / Mythfel — следующий шаг ===
Корень: $ROOT
SSOT:   $ROOT/docs/FULL-SPEC.md
Агенты: $ROOT/docs/AGENTS.md
Запуск: $ROOT/ЗАПУСК.md

Сделано (Phase 1 slice, ЗАПУСК Step B):
  ✓ content → content/cards|parts|cats|stages (3 стартера + 12 карт)
  ✓ battle  → battle/ (mythfel-battle Go, CreatePvE/CreatePvP, golden)

Дальше (ЗАПУСК Step C / docs/AGENTS.md порядок):
  client presenter к бою → backend limits/inventory → liveops schemas → hub/shop → qa §13

Шаблон промпта: см. docs/AGENTS.md раздел «Как ставить задачу»
EOF
