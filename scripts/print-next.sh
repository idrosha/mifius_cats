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
  ✓ qa §13 — чеклист + ./qa/run-acceptance.sh
  ✓ backend — pity hard80 + IAP sandbox yarn→jar (§13.4 / §13.9)
  ✓ battle+client — PvP replay store / GetReplay / ReplayList open (§13.6)

Дальше (docs/AGENTS.md / §14 Phase 3→4):
  закрыть PARTIAL §13.1 tutorial + §13.8 locale UI
  → затем soft launch (§13 зелёный)

Шаблон промпта: см. docs/AGENTS.md раздел «Как ставить задачу»
Харнесс: ./qa/run-acceptance.sh   чеклист: qa/ACCEPTANCE.md
EOF
