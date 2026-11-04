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
  ✓ client — TutorialPresenter §13.1 + HubPresenter.SetLocale §13.8
  ✓ Phase 4 in-repo — CDN stub :8090 + geo example + ./qa/run-soft-launch.sh

Дальше (вне репо / MANUAL):
  DEVICE smoke на телефоне (qa/DEVICE_SMOKE.md) + прод LiveOps CDN signing + store IAP verify
  → закрыть Phase 4 §14 на реальном ограниченном гео
  → Phase 5 clans/boss только после этого

Шаблон промпта: см. docs/AGENTS.md раздел «Как ставить задачу»
Харнесс: ./qa/run-soft-launch.sh   чеклист: qa/SOFT_LAUNCH.md + qa/DEVICE_SMOKE.md
EOF
