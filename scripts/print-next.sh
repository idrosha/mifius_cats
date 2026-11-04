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
  ✓ ЗАПУСК Step C — backend → backend/ (limits 3/5 + inventory §7.5)
  ✓ ЗАПУСК Step C — liveops → liveops/ (JSON Schema §7.4 + validate)
  ✓ ЗАПУСК Step C — client  → client/ (Hub + Shop + Soon flags)

Дальше (ЗАПУСК Step C / docs/AGENTS.md порядок):
  qa §13 → soft launch

Шаблон промпта: см. docs/AGENTS.md раздел «Как ставить задачу»
EOF
