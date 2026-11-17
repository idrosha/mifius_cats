#!/usr/bin/env python3
"""Generate HUD card effect catalog from content/cards + i18n titles.

Output: client/web-hud/public/data/card-effects.json
Run after changing card numbers (D-035+) so overlay text stays SoT-synced.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CARDS = ROOT / "content" / "cards"
I18N = ROOT / "content" / "i18n" / "ru_en.json"
OUT = ROOT / "client" / "web-hud" / "public" / "data" / "card-effects.json"

TARGET = {
    "nearest": "ближайшему врагу",
    "backline": "врагу в тылу",
    "lowest_hp": "врагу с наименьшим HP",
    "ally_lowest_hp": "слабейшему союзнику",
    "ally_all": "всем союзникам",
    "self": "себе",
    "ally": "союзнику",
    "all_enemies": "всем врагам",
}
CHIP_ORDER = [
    "Атака",
    "Пробой",
    "Щит",
    "Таунт",
    "Хил",
    "Очищение",
    "Бафф",
    "Тыл",
    "Крит",
    "AoE",
    "Засада",
    "Стелс",
    "Хрупкость",
    "Слабость",
    "Стан",
    "Кровотечение",
    "Яд",
]
CHIP = {
    "taunt": "Таунт",
    "pierce": "Пробой",
    "attack": "Атака",
    "shield": "Щит",
    "heal": "Хил",
    "cleanse": "Очищение",
    "buff": "Бафф",
    "backline": "Тыл",
    "crit": "Крит",
    "aoe": "AoE",
    "ambush": "Засада",
    "ruffle": "Взъерошить",
    "stealth": "Стелс",
}
STATUS = {
    "taunt": "Таунт",
    "fragile": "Хрупкость",
    "weak": "Слабость",
    "stun": "Стан",
    "bleed": "Кровотечение",
    "poison": "Яд",
    "vuln": "Уязвимость",
    "stealth": "Стелс",
}


def fmt(card: dict) -> tuple[str, list[str]]:
    parts: list[str] = []
    atk = card.get("atk") or 0
    sh = card.get("shield") or 0
    hits = card.get("hits") or (1 if atk else 0)
    rule = card.get("targetRule") or "nearest"
    tgt = TARGET.get(rule, rule)
    tags = card.get("tags") or []
    ops = card.get("effectOps") or []

    if atk > 0:
        s = f"Наносит {atk} урона ×{hits} {tgt}." if hits > 1 else f"Наносит {atk} урона {tgt}."
        if "pierce" in tags:
            s = s.rstrip(".") + ". Пробой."
        parts.append(s)

    if sh > 0:
        if atk > 0 and rule not in ("self", "ally_lowest_hp", "ally_all", "ally"):
            parts.append(f"Даёт {sh} щита себе.")
        elif rule == "ally_all":
            parts.append("Даёт {0} щита всем союзникам.".format(sh))
        elif rule in ("ally_lowest_hp", "ally"):
            parts.append(f"Даёт {sh} щита {tgt}.")
        else:
            parts.append(f"Даёт {sh} щита себе.")

    for op in ops:
        name = op.get("op")
        if name == "heal":
            amt = op.get("amount", 0)
            if op.get("target") == "self":
                parts.append(f"Восстанавливает {amt} HP себе.")
            elif rule == "ally_all":
                parts.append(f"Восстанавливает {amt} HP всем союзникам.")
            else:
                parts.append(f"Восстанавливает {amt} HP {TARGET.get(rule, 'цели')}.")
        elif name == "apply_status":
            st = op.get("status")
            stacks = op.get("stacks", 1)
            label = STATUS.get(st, st)
            if st == "taunt":
                parts.append("Таунт.")
            elif st == "weak":
                parts.append(f"{label}" + (f" ×{stacks}." if stacks > 1 else "."))
            elif st in STATUS:
                parts.append(f"{label}.")
        elif name == "buff" and op.get("stat") == "atk":
            parts.append(f"Бафф ATK +{op.get('amount', 0)} ({op.get('duration', 1)} ход.).")

    n_cleanse = sum(1 for o in ops if o.get("op") == "cleanse")
    if n_cleanse == 1:
        parts.append("Снимает 1 дебафф.")
    elif n_cleanse > 1:
        parts.append(f"Снимает {n_cleanse} дебаффа.")

    effect = " ".join(parts)
    if "taunt" in tags and "Таунт" not in effect:
        effect = (effect + " Таунт.").strip()
    effect = effect.replace("..", ".").strip()

    chips: list[str] = []
    for t in tags:
        lab = CHIP.get(t)
        if lab and lab not in chips:
            chips.append(lab)
    for op in ops:
        if op.get("op") == "apply_status":
            lab = STATUS.get(op.get("status"))
            if lab and lab not in chips:
                chips.append(lab)
    if "Пробой" in chips and "Атака" in chips:
        chips.remove("Атака")
    if "Бафф" in chips and not any(o.get("op") == "buff" for o in ops):
        chips.remove("Бафф")
    chips = sorted(chips, key=lambda c: CHIP_ORDER.index(c) if c in CHIP_ORDER else 99)
    return effect, chips


def main() -> None:
    i18n = json.loads(I18N.read_text(encoding="utf-8"))
    out: dict = {}
    for p in sorted(CARDS.glob("*.json")):
        card = json.loads(p.read_text(encoding="utf-8"))
        cid = card["cardId"]
        nk = card.get("name_key") or f"card.{p.stem}"
        title = (i18n.get(nk) or {}).get("ru") or p.stem
        effect, chips = fmt(card)
        out[cid] = {
            "name_key": nk,
            "title_ru": title,
            "effect_ru": effect,
            "chips": chips,
            "cost": card.get("cost", 1),
        }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({len(out)} cards)")


if __name__ == "__main__":
    main()
