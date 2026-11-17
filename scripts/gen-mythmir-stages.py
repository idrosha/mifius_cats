#!/usr/bin/env python3
"""Generate Mythmir SL stages (5 chapters × 3 fights). D-039 / FULL-SPEC §4.1."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGES = ROOT / "content" / "stages"

CHAPTERS = {
    1: {
        "faction": "dogs",
        "title_ru": "Железная Цитадель",
        "element": "stone",
        "prefix": "dog",
        "pitboss": "bot_pitboss_dog_baron",
        "names": {
            "tank": "Пёс-щитоносец",
            "fighter": "Пёс-задира",
            "support": "Пёс-завывала",
            "boss": "Барон Гав",
        },
    },
    2: {
        "faction": "wolves",
        "title_ru": "Ледяные Пещеры",
        "element": "ice",
        "prefix": "wolf",
        "pitboss": "bot_pitboss_wolf_alpha",
        "names": {
            "tank": "Северный страж",
            "fighter": "Волк-клык",
            "support": "Шаман инея",
            "boss": "Лютый Клык",
        },
    },
    3: {
        "faction": "red_dogs",
        "title_ru": "Алая Псарня",
        "element": "fire",
        "prefix": "redd",
        "pitboss": "bot_pitboss_redd_alpha",
        "names": {
            "tank": "Алый щитоносец",
            "fighter": "Пёс-углежуй",
            "support": "Пёс-искромёт",
            "boss": "Алый Вожак",
        },
    },
    4: {
        "faction": "zombies",
        "title_ru": "Чумные Склепы",
        "element": "grass",
        "prefix": "zomb",
        "pitboss": "bot_pitboss_zomb_necro",
        "names": {
            "tank": "Гнилой страж",
            "fighter": "Трупный мясник",
            "support": "Носитель гнили",
            "boss": "Некропёс Мор",
        },
    },
    5: {
        "faction": "ghosts",
        "title_ru": "Призрачный Чертог",
        "element": "bolt",
        "prefix": "ghost",
        "pitboss": "bot_pitboss_ghost_gul",
        "names": {
            "tank": "Могильный страж",
            "fighter": "Клинок душ",
            "support": "Блуждающий огонёк",
            "boss": "Фантом Гул",
        },
    },
}

# Difficulty: clearable on starters tank/fighter/support, no gear/potions (D-039).
# Tuned so AutoPlay starters clear all 15 nodes; still ramps ch1→ch5.
CH_SCALE = {1: 1.00, 2: 1.06, 3: 1.12, 4: 1.15, 5: 1.20}
FIGHT_BASE = {
    1: {  # soldiers
        "theme": "soldiers",
        "fight_ru": "Солдаты",
        "roles": ("tank", "fighter", "support"),
        "hp": (16, 13, 11),
        "atk": (2, 3, 1),
        "spd": (2, 4, 3),
        "skill": (1, 1, 2),
        "card_atk": (3, 4, 2),
        "shield": 3,
        "heal": 3,
    },
    2: {  # soldiers harder
        "theme": "soldiers",
        "fight_ru": "Солдаты",
        "roles": ("tank", "fighter", "support"),
        "hp": (19, 15, 12),
        "atk": (2, 3, 1),
        "spd": (2, 4, 3),
        "skill": (1, 1, 2),
        "card_atk": (3, 4, 2),
        "shield": 3,
        "heal": 3,
    },
    3: {  # pitboss + soldiers
        "theme": "boss_plus_soldiers",
        "fight_ru": "Питбосс + солдаты",
        "roles": ("tank", "boss", "support"),
        "hp": (20, 26, 13),
        "atk": (2, 4, 1),
        "spd": (2, 4, 3),
        "skill": (1, 2, 2),
        "card_atk": (3, 4, 2),
        "shield": 4,
        "heal": 3,
    },
}


def sc(n: float, ch: int) -> int:
    return max(1, int(round(n * CH_SCALE[ch])))


def card(
    card_id: str,
    name_key: str,
    element: str,
    *,
    cost: int = 1,
    atk: int = 0,
    shield: int = 0,
    hits: int = 0,
    target: str = "nearest",
    tags: list[str] | None = None,
    effect_ops: list | None = None,
) -> dict:
    return {
        "cardId": card_id,
        "name_key": name_key,
        "element": element,
        "cost": cost,
        "atk": atk,
        "shield": shield,
        "hits": hits,
        "targetRule": target,
        "tags": tags or (["attack"] if atk else []),
        "effectOps": effect_ops or [],
    }


def deck_for(
    ch: int,
    fight: int,
    role: str,
    element: str,
    prefix: str,
    card_atk: int,
    shield: int,
    heal: int,
    is_boss: bool,
) -> list[dict]:
    """4-card attack map per soldier/pitboss (themed)."""
    sid = f"m{ch}f{fight}"
    p = prefix
    # Themed attack keys by faction prefix
    bite = {
        "dog": ("укус", "card.bot_dog_bite"),
        "wolf": ("морозный укус", "card.bot_wolf_bite"),
        "redd": ("алый укус", "card.bot_redd_bite"),
        "zomb": ("гнилой укус", "card.bot_zomb_bite"),
        "ghost": ("фазовый удар", "card.bot_ghost_strike"),
    }[p]
    bark = {
        "dog": ("лай-щит", "card.bot_dog_bark"),
        "wolf": ("вой инея", "card.bot_wolf_howl"),
        "redd": ("искровой рык", "card.bot_redd_roar"),
        "zomb": ("кожура гнили", "card.bot_zomb_husk"),
        "ghost": ("саван", "card.bot_ghost_shroud"),
    }[p]
    claw = {
        "dog": ("царапка стаи", "card.bot_dog_claw"),
        "wolf": ("ледяной коготь", "card.bot_wolf_claw"),
        "redd": ("угольный коготь", "card.bot_redd_claw"),
        "zomb": ("чумной коготь", "card.bot_zomb_claw"),
        "ghost": ("цепь склепа", "card.bot_ghost_chain"),
    }[p]
    util = {
        "dog": ("тычок", "card.bot_dog_poke"),
        "wolf": ("иней", "card.bot_wolf_frost"),
        "redd": ("искра", "card.bot_redd_spark"),
        "zomb": ("яд", "card.bot_zomb_poison"),
        "ghost": ("слабость", "card.bot_ghost_weak"),
    }[p]

    if role == "tank":
        return [
            card(f"card_{p}_bite_{sid}", bite[1], element, atk=card_atk, hits=1),
            card(
                f"card_{p}_bark_{sid}",
                bark[1],
                element,
                shield=shield,
                target="self",
                tags=["shield"],
            ),
            card(f"card_{p}_bite2_{sid}", bite[1], element, atk=card_atk, hits=1),
            card(
                f"card_{p}_bark2_{sid}",
                bark[1],
                element,
                shield=shield,
                target="self",
                tags=["shield"],
            ),
        ]
    if role in ("fighter", "boss"):
        tags_extra = ["attack", "pierce"] if (is_boss and p in ("ghost", "redd")) else ["attack"]
        boss_bump = 1 if is_boss else 0
        a = card_atk + boss_bump
        cards = [
            card(f"card_{p}_claw_{sid}", claw[1], element, atk=a, hits=1, tags=tags_extra),
            card(f"card_{p}_claw2_{sid}", claw[1], element, atk=a, hits=1, tags=tags_extra),
            card(f"card_{p}_claw3_{sid}", claw[1], element, atk=a, hits=1, tags=["attack"]),
        ]
        if p == "zomb":
            # Soft DoT would wipe tank into boss on AutoPlay starters — use short weak instead (D-039 clearable).
            cards.append(
                card(
                    f"card_{p}_poison_{sid}",
                    util[1],
                    element,
                    atk=max(2, a - 2),
                    hits=1,
                    tags=["attack", "weak"],
                    effect_ops=[{"op": "apply_status", "status": "weak", "stacks": 1, "duration": 1}],
                )
            )
        elif p == "ghost":
            cards.append(
                card(
                    f"card_{p}_weak_{sid}",
                    util[1],
                    element,
                    atk=max(2, a - 2),
                    hits=1,
                    tags=["attack", "weak"],
                    effect_ops=[{"op": "apply_status", "status": "weak", "stacks": 1, "duration": 2}],
                )
            )
        elif p == "wolf":
            # Soft chill (weak), not stun — stun made ch2 pitboss unbeatable on starters AutoPlay.
            cards.append(
                card(
                    f"card_{p}_frost_{sid}",
                    util[1],
                    element,
                    atk=max(2, a - 1),
                    hits=1,
                    tags=["attack", "weak"],
                    effect_ops=[{"op": "apply_status", "status": "weak", "stacks": 1, "duration": 1}],
                )
            )
        else:
            cards.append(
                card(f"card_{p}_poke_{sid}", util[1], element, atk=max(2, a - 1), hits=1)
            )
        return cards
    # support
    return [
        card(
            f"card_{p}_sip_{sid}",
            "card.bot_sip",
            element,
            target="ally_lowest_hp",
            tags=["heal"],
            effect_ops=[{"op": "heal", "amount": heal}],
        ),
        card(f"card_{p}_poke_{sid}", util[1], element, atk=card_atk, hits=1),
        card(
            f"card_{p}_sip2_{sid}",
            "card.bot_sip2",
            element,
            target="ally_lowest_hp",
            tags=["heal"],
            effect_ops=[{"op": "heal", "amount": heal}],
        ),
        card(f"card_{p}_poke2_{sid}", util[1], element, atk=card_atk, hits=1),
    ]


def unit(
    ch: int,
    fight: int,
    lane_role: str,
    idx: int,
    base: dict,
    ch_meta: dict,
) -> dict:
    is_boss = lane_role == "boss"
    role = "fighter" if is_boss else lane_role
    element = ch_meta["element"]
    prefix = ch_meta["prefix"]
    if is_boss:
        template_id = f"{ch_meta['pitboss']}_m{ch}f{fight}"
    else:
        template_id = f"bot_{prefix}_{role}_m{ch}f{fight}"
    hp = sc(base["hp"][idx], ch)
    atk = sc(base["atk"][idx], ch)
    card_atk = sc(base["card_atk"][idx], ch)
    shield = sc(base["shield"], ch)
    heal = sc(base["heal"], ch)
    return {
        "templateId": template_id,
        "role": role,
        "element": element,
        "level": ch,
        "baseStats": {
            "hp": hp,
            "atk": atk,
            "spd": base["spd"][idx],
            "skill": base["skill"][idx] + (1 if is_boss else 0),
            "charm": 1,
        },
        "deck": deck_for(
            ch, fight, role if not is_boss else "boss", element, prefix, card_atk, shield, heal, is_boss
        ),
        "meta": {
            "display_ru": ch_meta["names"]["boss" if is_boss else role],
            "faction": ch_meta["faction"],
            "isPitboss": is_boss,
        },
    }


def build_stage(ch: int, fight: int) -> dict:
    ch_meta = CHAPTERS[ch]
    base = FIGHT_BASE[fight]
    roles = base["roles"]
    enemies = [unit(ch, fight, roles[i], i, base, ch_meta) for i in range(3)]
    return {
        "stageId": f"mythmir_{ch}_f{fight}",
        "chapter": ch,
        "name_key": f"stage.mythmir_{ch}_f{fight}",
        "bowlCost": 1,
        "enemyTeam": enemies,
        "meta": {
            "stageIndex": ch,
            "fightIndex": fight,
            "title_ru": ch_meta["title_ru"],
            "fight_ru": base["fight_ru"],
            "faction": ch_meta["faction"],
            "waveTheme": base["theme"],
            "location_ru": ch_meta["title_ru"],
        },
    }


def main() -> None:
    STAGES.mkdir(parents=True, exist_ok=True)
    for ch in range(1, 6):
        for fight in range(1, 4):
            stage = build_stage(ch, fight)
            path = STAGES / f"{stage['stageId']}.json"
            path.write_text(json.dumps(stage, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print("wrote", path.relative_to(ROOT))


if __name__ == "__main__":
    main()
