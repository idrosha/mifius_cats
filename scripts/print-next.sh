#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cat <<EOF
=== Мифоус / Mythfel — следующий шаг ===
Корень: $ROOT
SSOT:   $ROOT/docs/FULL-SPEC.md
Агенты: $ROOT/docs/AGENTS.md
Запуск: $ROOT/ЗАПУСК.md

Phase 1 (сейчас):
  1) content → docs/skills/content.md + FULL-SPEC §2 §10
  2) battle  → docs/skills/battle.md  + FULL-SPEC §3 §8.2

Шаблон промпта: см. docs/AGENTS.md раздел «Как ставить задачу»
Код клиента/серверов ещё не создан — сначала slice боя.
EOF
