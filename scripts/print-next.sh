#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cat <<EOF
=== Мифоус / Mythfel — следующий шаг ===
Корень: $ROOT
SSOT:   $ROOT/docs/FULL-SPEC.md
Агенты: $ROOT/docs/AGENTS.md
Запуск: $ROOT/ЗАПУСК.md

Сделано:
  ✓ ЗАПУСК Step B — content → content/cards|parts|cats|stages
  ✓ ЗАПУСК Step B — battle  → battle/ (mythfel-battle Go)
  ✓ ЗАПУСК Step C — client  → client/ (BattlePresenter + stateDiff HUD)

Дальше (ЗАПУСК Step C / docs/AGENTS.md порядок):
  backend limits/inventory → liveops schemas → client hub/shop → qa §13

Шаблон промпта: см. docs/AGENTS.md раздел «Как ставить задачу»
EOF
