#!/usr/bin/env python3
"""Regenerate Mythmir stage JSON per PvE rebalance plan. Run from repo root."""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "content" / "stages"


def card(cid, name, element, cost, atk=0, shield=0, hits=0, rule="nearest", tags=None, ops=None):
    return {
        "cardId": cid,
        "name_key": name,
        "element": element,
        "cost": cost,
        "atk": atk,
        "shield": shield,
        "hits": hits if hits or atk <= 0 else 1,
        "targetRule": rule,
        "tags": tags or [],
        "effectOps": ops or [],
    }


def deck4(cards):
    assert len(cards) == 4
    return cards


def empty_lane(tid, element, faction):
    stub = [
        card(f"card_empty_{tid}_{i}", "card.bot_empty", element, 1, tags=["shield"])
        for i in range(4)
    ]
    return {
        "templateId": tid,
        "role": "tank",
        "element": element,
        "level": 1,
        "baseStats": {"hp": 1, "atk": 0, "spd": 1, "skill": 0, "charm": 0},
        "deck": stub,
        "meta": {
            "display_ru": "—",
            "faction": faction,
            "isPitboss": False,
            "emptyLane": True,
            "startDead": True,
        },
    }


def unit(tid, role, element, level, hp, atk, spd, skill, deck, display, faction, pitboss=False):
    return {
        "templateId": tid,
        "role": role,
        "element": element,
        "level": level,
        "baseStats": {"hp": hp, "atk": atk, "spd": spd, "skill": skill, "charm": 1},
        "deck": deck,
        "meta": {"display_ru": display, "faction": faction, "isPitboss": pitboss},
    }


def stage(sid, ch, bowl, team, title, fight, faction, theme, loc, tactic):
    return {
        "stageId": sid,
        "chapter": ch,
        "name_key": f"stage.{sid}",
        "bowlCost": bowl,
        "enemyTeam": team,
        "meta": {
            "stageIndex": ch,
            "fightIndex": int(sid.split("_f")[1]),
            "title_ru": title,
            "fight_ru": fight,
            "faction": faction,
            "waveTheme": theme,
            "location_ru": loc,
            "tactic_ru": tactic,
        },
    }


def write(obj):
    path = OUT / f"{obj['stageId']}.json"
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", path.name)


# --- Chapter 1 dogs ---
def ch1():
    el, fac = "stone", "dogs"
    # f1 three fighters
    def fighter(tid, hp=28, atk=5):
        return unit(
            tid, "fighter", el, 1, hp, atk, 4, 2,
            deck4([
                card(f"{tid}_a1", "card.bot_dog_claw", el, 1, atk=atk, tags=["attack"]),
                card(f"{tid}_a2", "card.bot_dog_claw", el, 1, atk=atk, tags=["attack"]),
                card(f"{tid}_a3", "card.bot_dog_claw", el, 1, atk=atk + 1, tags=["attack"]),
                card(f"{tid}_a4", "card.bot_dog_claw", el, 1, atk=atk, tags=["attack"]),
            ]),
            "Пёс-боец", fac,
        )

    write(stage(
        "mythmir_1_f1", 1, 1,
        [fighter("bot_dog_fighter_m1f1_a"), fighter("bot_dog_fighter_m1f1_b"), fighter("bot_dog_fighter_m1f1_c")],
        "Железная Цитадель", "Три бойца", fac, "three_fighters", "Железная Цитадель",
        "Три бойца во фронте·центре·тылу; nearest.",
    ))

    tank = unit(
        "bot_dog_tank_m1f2", "tank", el, 1, 36, 4, 2, 1,
        deck4([
            card("card_dog_bark_m1f2", "card.bot_dog_bark", el, 1, shield=7, tags=["shield"],
                 ops=[{"op": "apply_status", "status": "taunt", "stacks": 1, "duration": 2}]),
            card("card_dog_bark2_m1f2", "card.bot_dog_bark", el, 1, shield=6, tags=["shield"],
                 ops=[{"op": "apply_status", "status": "taunt", "stacks": 1, "duration": 2}]),
            card("card_dog_bite_m1f2", "card.bot_dog_bite", el, 1, atk=4, tags=["attack"]),
            card("card_dog_bite2_m1f2", "card.bot_dog_bite", el, 1, atk=4, tags=["attack"]),
        ]),
        "Пёс-щитоносец", fac,
    )

    def ranger(tid):
        return unit(
            tid, "ranger", el, 1, 26, 5, 5, 2,
            deck4([
                card(f"{tid}_s1", "card.bot_dog_shot", el, 1, atk=5, rule="center", tags=["attack"]),
                card(f"{tid}_s2", "card.bot_dog_shot", el, 1, atk=5, rule="center", tags=["attack"]),
                card(f"{tid}_s3", "card.bot_dog_shot", el, 1, atk=6, rule="center", tags=["attack"]),
                card(f"{tid}_s4", "card.bot_dog_shot", el, 1, atk=5, rule="center", tags=["attack"]),
            ]),
            "Пёс-лучник", fac,
        )

    write(stage(
        "mythmir_1_f2", 1, 1,
        [tank, ranger("bot_dog_ranger_m1f2_a"), ranger("bot_dog_ranger_m1f2_b")],
        "Железная Цитадель", "Танк + лучники", fac, "tank_two_rangers", "Железная Цитадель",
        "Танк фронт, два лучника; center + taunt.",
    ))

    boss = unit(
        "bot_pitboss_dog_baron_m1f3", "fighter", el, 1, 110, 3, 4, 3,
        deck4([
            card("card_dog_pierce_m1f3", "card.bot_dog_pierce", el, 1, atk=3, tags=["attack", "pierce"]),
            card("card_dog_pierce2_m1f3", "card.bot_dog_pierce", el, 1, atk=3, tags=["attack", "pierce"]),
            card("card_dog_pierce3_m1f3", "card.bot_dog_pierce", el, 1, atk=3, tags=["attack", "pierce"],
                 ops=[{"op": "apply_status", "status": "fragile", "stacks": 1, "duration": 2}]),
            card("card_dog_crush_m1f3", "card.bot_dog_crush", el, 1, atk=4, tags=["attack", "pierce"]),
        ]),
        "Барон Гав", fac, pitboss=True,
    )
    write(stage(
        "mythmir_1_f3", 1, 1,
        [boss, empty_lane("bot_empty_lane_m1f3_a", el, fac), empty_lane("bot_empty_lane_m1f3_b", el, fac)],
        "Железная Цитадель", "Питбосс спереди", fac, "solo_boss_front", "Железная Цитадель",
        "Соло-босс фронт; pierce/fragile; cost 1.",
    ))


# --- Chapter 2 wolves ---
def ch2():
    el, fac = "ice", "wolves"

    fighter = unit(
        "bot_wolf_fighter_m2f1", "fighter", el, 2, 40, 6, 4, 2,
        deck4([
            card("card_wolf_claw_m2f1", "card.bot_wolf_claw", el, 1, atk=7, tags=["attack"]),
            card("card_wolf_claw2_m2f1", "card.bot_wolf_claw", el, 1, atk=7, tags=["attack"]),
            card("card_wolf_claw3_m2f1", "card.bot_wolf_claw", el, 1, atk=8, tags=["attack"]),
            card("card_wolf_claw4_m2f1", "card.bot_wolf_claw", el, 1, atk=8, tags=["attack"]),
        ]),
        "Волк-боец", fac,
    )
    heal = unit(
        "bot_wolf_support_m2f1", "support", el, 2, 34, 3, 3, 2,
        deck4([
            card("card_wolf_sip_m2f1", "card.bot_wolf_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                 ops=[{"op": "heal", "amount": 9}]),
            card("card_wolf_sip2_m2f1", "card.bot_wolf_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                 ops=[{"op": "heal", "amount": 9}]),
            card("card_wolf_sip3_m2f1", "card.bot_wolf_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                 ops=[{"op": "heal", "amount": 10}]),
            card("card_wolf_sip4_m2f1", "card.bot_wolf_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                 ops=[{"op": "heal", "amount": 9}]),
        ]),
        "Волк-хил", fac,
    )
    ranger = unit(
        "bot_wolf_ranger_m2f1", "ranger", el, 2, 36, 6, 5, 2,
        deck4([
            card("card_wolf_shot_m2f1", "card.bot_wolf_shot", el, 1, atk=8, rule="center", tags=["attack"]),
            card("card_wolf_shot2_m2f1", "card.bot_wolf_shot", el, 1, atk=8, rule="center", tags=["attack"]),
            card("card_wolf_shot3_m2f1", "card.bot_wolf_shot", el, 1, atk=9, rule="center", tags=["attack"]),
            card("card_wolf_shot4_m2f1", "card.bot_wolf_shot", el, 1, atk=8, rule="center", tags=["attack"]),
        ]),
        "Волк-лучник", fac,
    )
    write(stage(
        "mythmir_2_f1", 2, 1, [fighter, heal, ranger],
        "Ледяные Пещеры", "Боец · хил · лучник", fac, "fighter_heal_ranger", "Ледяные Пещеры",
        "Хил всегда 1E на heal; лучник center+taunt.",
    ))

    def wolf_ranger(tid, hp=33):
        return unit(
            tid, "ranger", el, 2, hp, 6, 5, 2,
            deck4([
                card(f"{tid}_1", "card.bot_wolf_shot", el, 1, atk=6, rule="center", tags=["attack"]),
                card(f"{tid}_2", "card.bot_wolf_shot", el, 1, atk=6, rule="center", tags=["attack"]),
                card(f"{tid}_3", "card.bot_wolf_shot", el, 1, atk=7, rule="center", tags=["attack"]),
                card(f"{tid}_4", "card.bot_wolf_shot", el, 1, atk=7, rule="center", tags=["attack"]),
            ]),
            "Волк-лучник", fac,
        )

    def wolf_ranger_f2(tid, hp=29):
        return unit(
            tid, "ranger", el, 2, hp, 6, 5, 2,
            deck4([
                card(f"{tid}_1", "card.bot_wolf_shot", el, 1, atk=6, rule="center", tags=["attack"]),
                card(f"{tid}_2", "card.bot_wolf_shot", el, 1, atk=6, rule="center", tags=["attack"]),
                card(f"{tid}_3", "card.bot_wolf_shot", el, 1, atk=7, rule="center", tags=["attack"]),
                card(f"{tid}_4", "card.bot_wolf_shot", el, 1, atk=6, rule="center", tags=["attack"]),
            ]),
            "Волк-лучник", fac,
        )

    write(stage(
        "mythmir_2_f2", 2, 1,
        [wolf_ranger_f2("bot_wolf_ranger_m2f2_a"), wolf_ranger_f2("bot_wolf_ranger_m2f2_b"), wolf_ranger_f2("bot_wolf_ranger_m2f2_c")],
        "Ледяные Пещеры", "Три лучника", fac, "three_rangers", "Ледяные Пещеры",
        "Три лучника center; mono без танка валятся, REF таунт держит.",
    ))

    def wolf_heal(tid):
        return unit(
            tid, "support", el, 2, 28, 3, 3, 2,
            deck4([
                card(f"{tid}_h1", "card.bot_wolf_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                     ops=[{"op": "heal", "amount": 7}]),
                card(f"{tid}_h2", "card.bot_wolf_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                     ops=[{"op": "heal", "amount": 7}]),
                card(f"{tid}_h3", "card.bot_wolf_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                     ops=[{"op": "heal", "amount": 8}]),
                card(f"{tid}_h4", "card.bot_wolf_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                     ops=[{"op": "heal", "amount": 7}]),
            ]),
            "Волк-хил", fac,
        )

    boss = unit(
        "bot_pitboss_wolf_alpha_m2f3", "fighter", el, 2, 54, 6, 5, 3,
        deck4([
            # backline leaps respect taunt; freeze-on-taunt is sim-side
            card("card_wolf_bite_m2f3", "card.bot_wolf_leap", el, 1, atk=6, rule="backline",
                 tags=["attack", "backline"]),
            card("card_wolf_bite2_m2f3", "card.bot_wolf_leap", el, 1, atk=6, rule="backline",
                 tags=["attack", "backline"]),
            card("card_wolf_bite3_m2f3", "card.bot_wolf_pounce", el, 1, atk=7, rule="backline",
                 tags=["attack", "backline", "crit"]),
            card("card_wolf_rend_m2f3", "card.bot_wolf_rend", el, 1, atk=5, rule="nearest", tags=["attack"],
                 ops=[{"op": "apply_status", "status": "bleed", "stacks": 2, "duration": 2}]),
        ]),
        "Лютый Клык", fac, pitboss=True,
    )
    write(stage(
        "mythmir_2_f3", 2, 1,
        [wolf_heal("bot_wolf_support_m2f3_a"), boss, wolf_heal("bot_wolf_support_m2f3_b")],
        "Ледяные Пещеры", "Хил · босс · хил", fac, "heal_boss_heal", "Ледяные Пещеры",
        "Хилы хилят leftover E; босс 1E backline+taunt→stun.",
    ))


# --- Chapter 3 red dogs ---
def ch3():
    el, fac = "fire", "red_dogs"

    def fighter(tid, hp=40):
        return unit(
            tid, "fighter", el, 3, hp, 6, 4, 2,
            deck4([
                card(f"{tid}_1", "card.bot_redd_claw", el, 1, atk=6, tags=["attack"]),
                card(f"{tid}_2", "card.bot_redd_claw", el, 1, atk=6, tags=["attack"]),
                card(f"{tid}_3", "card.bot_redd_claw", el, 1, atk=7, tags=["attack"]),
                card(f"{tid}_4", "card.bot_redd_claw", el, 1, atk=6, tags=["attack"]),
            ]),
            "Алый боец", fac,
        )

    tank = unit(
        "bot_redd_tank_m3f1", "tank", el, 3, 46, 4, 2, 1,
        deck4([
            card("card_redd_taunt_m3f1", "card.bot_redd_roar", el, 1, shield=8, tags=["shield"],
                 ops=[{"op": "apply_status", "status": "taunt", "stacks": 1, "duration": 2}]),
            card("card_redd_taunt2_m3f1", "card.bot_redd_roar", el, 1, shield=7, tags=["shield"],
                 ops=[{"op": "apply_status", "status": "taunt", "stacks": 1, "duration": 2}]),
            card("card_redd_bash_m3f1", "card.bot_redd_bite", el, 1, atk=5, tags=["attack"]),
            card("card_redd_bash2_m3f1", "card.bot_redd_bite", el, 1, atk=5, tags=["attack"]),
        ]),
        "Алый щитоносец", fac,
    )
    write(stage(
        "mythmir_3_f1", 3, 1,
        [fighter("bot_redd_fighter_m3f1_a"), tank, fighter("bot_redd_fighter_m3f1_b")],
        "Алая Псарня", "Боец · танк · боец", fac, "fighter_tank_fighter", "Алая Псарня",
        "Боец·танк·боец.",
    ))

    def assassin(tid):
        return unit(
            tid, "assassin", el, 3, 46, 7, 6, 2,
            deck4([
                card(f"{tid}_1", "card.bot_redd_stab", el, 1, atk=8, rule="backline", tags=["attack", "backline"]),
                card(f"{tid}_2", "card.bot_redd_stab", el, 1, atk=8, rule="backline", tags=["attack", "backline"]),
                card(f"{tid}_3", "card.bot_redd_stab", el, 1, atk=9, rule="center", tags=["attack"]),
                card(f"{tid}_4", "card.bot_redd_stab", el, 1, atk=9, rule="backline", tags=["attack", "backline"]),
            ]),
            "Алый убийца", fac,
        )

    tank2 = unit(
        "bot_redd_tank_m3f2", "tank", el, 3, 54, 5, 2, 1,
        deck4([
            card("card_redd_taunt_m3f2", "card.bot_redd_roar", el, 1, shield=8, tags=["shield"],
                 ops=[{"op": "apply_status", "status": "taunt", "stacks": 1, "duration": 2}]),
            card("card_redd_taunt2_m3f2", "card.bot_redd_roar", el, 1, shield=7, tags=["shield"],
                 ops=[{"op": "apply_status", "status": "taunt", "stacks": 1, "duration": 2}]),
            card("card_redd_bash_m3f2", "card.bot_redd_bite", el, 1, atk=5, tags=["attack"]),
            card("card_redd_bash2_m3f2", "card.bot_redd_bite", el, 1, atk=5, tags=["attack"]),
        ]),
        "Алый щитоносец", fac,
    )
    write(stage(
        "mythmir_3_f2", 3, 1,
        [assassin("bot_redd_assassin_m3f2_a"), tank2, assassin("bot_redd_assassin_m3f2_b")],
        "Алая Псарня", "Убийца · танк · убийца", fac, "assassin_tank_assassin", "Алая Псарня",
        "Убийцы center/backline; таунт уважают.",
    ))

    def flank_tank(tid):
        return unit(
            tid, "tank", el, 3, 48, 3, 2, 1,
            deck4([
                card(f"{tid}_t1", "card.bot_redd_roar", el, 1, shield=8, tags=["shield"],
                     ops=[{"op": "apply_status", "status": "taunt", "stacks": 1, "duration": 2}]),
                card(f"{tid}_t2", "card.bot_redd_roar", el, 1, shield=7, tags=["shield"],
                     ops=[{"op": "apply_status", "status": "taunt", "stacks": 1, "duration": 2}]),
                card(f"{tid}_b1", "card.bot_redd_bite", el, 1, atk=5, tags=["attack"]),
                card(f"{tid}_b2", "card.bot_redd_bite", el, 1, atk=5, tags=["attack"]),
            ]),
            "Алый щитоносец", fac,
        )

    boss = unit(
        "bot_pitboss_redd_alpha_m3f3", "fighter", el, 3, 46, 5, 4, 3,
        deck4([
            # mass cost 2 = one AoE hit with bleed
            card("card_redd_cleave_m3f3", "card.bot_redd_cleave", el, 2, atk=6, rule="all_enemies",
                 tags=["attack", "aoe"],
                 ops=[{"op": "apply_status", "status": "bleed", "stacks": 2, "duration": 2}]),
            card("card_redd_cleave2_m3f3", "card.bot_redd_cleave", el, 2, atk=6, rule="all_enemies",
                 tags=["attack", "aoe"],
                 ops=[{"op": "apply_status", "status": "bleed", "stacks": 2, "duration": 2}]),
            card("card_redd_slash_m3f3", "card.bot_redd_claw", el, 1, atk=5, tags=["attack"]),
            card("card_redd_slash2_m3f3", "card.bot_redd_claw", el, 1, atk=5, tags=["attack"]),
        ]),
        "Алый Вожак", fac, pitboss=True,
    )
    write(stage(
        "mythmir_3_f3", 3, 1,
        [flank_tank("bot_redd_tank_m3f3_a"), boss, flank_tank("bot_redd_tank_m3f3_b")],
        "Алая Псарня", "Танк · босс · танк", fac, "boss_between_tanks", "Алая Псарня",
        "Босс масс cost2 + bleed; танки taunt.",
    ))


# --- Chapter 4 zombies ---
def ch4():
    el, fac = "grass", "zombies"
    # soldiers HP like support (~24-28); boss tank-like HP/def

    def fighter_a(tid):
        return unit(
            tid, "fighter", el, 4, 26, 5, 3, 1,
            deck4([
                card(f"{tid}_1", "card.bot_zomb_bash", el, 1, atk=5, tags=["attack"]),
                card(f"{tid}_2", "card.bot_zomb_bash", el, 1, atk=5, tags=["attack"]),
                card(f"{tid}_3", "card.bot_zomb_bash", el, 1, atk=6, tags=["attack"]),
                card(f"{tid}_4", "card.bot_zomb_bash", el, 1, atk=5, tags=["attack"]),
            ]),
            "Зомби-боец", fac,
        )

    def fighter_b(tid, hp=27):
        # different art via template hash / role still fighter (pool has 2 arts after HUD tweak)
        return unit(
            tid, "fighter", el, 4, hp, 6, 3, 1,
            deck4([
                card(f"{tid}_1", "card.bot_zomb_cleave", el, 1, atk=6, tags=["attack"]),
                card(f"{tid}_2", "card.bot_zomb_cleave", el, 1, atk=6, tags=["attack"]),
                card(f"{tid}_3", "card.bot_zomb_cleave", el, 1, atk=7, tags=["attack"]),
                card(f"{tid}_4", "card.bot_zomb_cleave", el, 1, atk=6, tags=["attack"]),
            ]),
            "Зомби-палач", fac,
        )

    def assassin(tid, hp=24):
        return unit(
            tid, "assassin", el, 4, hp, 5, 6, 2,
            deck4([
                card(f"{tid}_1", "card.bot_zomb_stab", el, 1, atk=6, rule="backline", tags=["attack", "backline", "poison"],
                     ops=[{"op": "apply_status", "status": "poison", "stacks": 1, "duration": 0}]),
                card(f"{tid}_2", "card.bot_zomb_stab", el, 1, atk=6, rule="center", tags=["attack", "poison"],
                     ops=[{"op": "apply_status", "status": "poison", "stacks": 1, "duration": 0}]),
                card(f"{tid}_3", "card.bot_zomb_stab", el, 1, atk=7, rule="backline", tags=["attack", "backline", "poison"],
                     ops=[{"op": "apply_status", "status": "poison", "stacks": 1, "duration": 0}]),
                card(f"{tid}_4", "card.bot_zomb_stab", el, 1, atk=6, rule="random_enemy", tags=["attack", "poison"],
                     ops=[{"op": "apply_status", "status": "poison", "stacks": 1, "duration": 0}]),
            ]),
            "Трупный мясник", fac,
        )

    write(stage(
        "mythmir_4_f1", 4, 1,
        [fighter_a("bot_zomb_fighter_m4f1_a"), assassin("bot_zomb_assassin_m4f1"), fighter_a("bot_zomb_fighter_m4f1_b")],
        "Чумные Склепы", "Боец · убийца · боец", fac, "fighter_assassin_fighter", "Чумные Склепы",
        "Бойцы nearest; убийца center/тыл; thorns poison.",
    ))
    write(stage(
        "mythmir_4_f2", 4, 1,
        [fighter_b("bot_zomb_fighter_m4f2_a"), assassin("bot_zomb_assassin_m4f2", hp=25), fighter_b("bot_zomb_fighter_m4f2_b")],
        "Чумные Склепы", "Палач · убийца · палач", fac, "butcher_assassin_butcher", "Чумные Склепы",
        "Другой вид бойца; убийца center/тыл.",
    ))

    boss = unit(
        "bot_pitboss_zomb_necro_m4f3", "support", el, 4, 48, 4, 3, 3,
        deck4([
            card("card_zomb_miasma_m4f3", "card.bot_zomb_miasma", el, 2, atk=3, rule="all_enemies",
                 tags=["attack", "aoe", "poison"],
                 ops=[{"op": "apply_status", "status": "poison", "stacks": 1, "duration": 0}]),
            card("card_zomb_miasma2_m4f3", "card.bot_zomb_miasma", el, 2, atk=3, rule="all_enemies",
                 tags=["attack", "aoe", "poison"],
                 ops=[{"op": "apply_status", "status": "poison", "stacks": 1, "duration": 0}]),
            card("card_zomb_bolt_m4f3", "card.bot_zomb_bolt", el, 1, atk=4, tags=["attack"]),
            card("card_zomb_heal_m4f3", "card.bot_zomb_heal", el, 1, tags=["heal"], rule="ally_lowest_hp",
                 ops=[{"op": "heal", "amount": 6}]),
        ]),
        "Некропёс Мор", fac, pitboss=True,
    )

    def f3_assassin(tid):
        return unit(
            tid, "assassin", el, 4, 24, 5, 6, 2,
            deck4([
                card(f"{tid}_1", "card.bot_zomb_stab", el, 1, atk=5, rule="random_enemy", tags=["attack", "poison"],
                     ops=[{"op": "apply_status", "status": "poison", "stacks": 1, "duration": 0}]),
                card(f"{tid}_2", "card.bot_zomb_stab", el, 1, atk=5, rule="random_enemy", tags=["attack", "poison"],
                     ops=[{"op": "apply_status", "status": "poison", "stacks": 1, "duration": 0}]),
                card(f"{tid}_3", "card.bot_zomb_stab", el, 1, atk=6, rule="random_enemy", tags=["attack", "poison"],
                     ops=[{"op": "apply_status", "status": "poison", "stacks": 1, "duration": 0}]),
                card(f"{tid}_4", "card.bot_zomb_stab", el, 1, atk=5, rule="random_enemy", tags=["attack", "poison"],
                     ops=[{"op": "apply_status", "status": "poison", "stacks": 1, "duration": 0}]),
            ]),
            "Трупный мясник", fac,
        )

    write(stage(
        "mythmir_4_f3", 4, 1,
        [f3_assassin("bot_zomb_assassin_m4f3_a"), boss, f3_assassin("bot_zomb_assassin_m4f3_b")],
        "Чумные Склепы", "Убийца · босс · убийца", fac, "assassins_necro_mid", "Чумные Склепы",
        "Босс масс-poison cost2; убийцы random; thorns.",
    ))


# --- Chapter 5 ghosts ---
def ch5():
    el, fac = "bolt", "ghosts"

    def tank(tid, hp=48):
        return unit(
            tid, "tank", el, 5, hp, 3, 2, 1,
            deck4([
                card(f"{tid}_t1", "card.bot_ghost_ward", el, 1, shield=7, tags=["shield"],
                     ops=[{"op": "apply_status", "status": "taunt", "stacks": 1, "duration": 2}]),
                card(f"{tid}_t2", "card.bot_ghost_ward", el, 1, shield=6, tags=["shield"],
                     ops=[{"op": "apply_status", "status": "taunt", "stacks": 1, "duration": 2}]),
                card(f"{tid}_b1", "card.bot_ghost_bash", el, 1, atk=5, tags=["attack"]),
                card(f"{tid}_b2", "card.bot_ghost_bash", el, 1, atk=5, tags=["attack"]),
            ]),
            "Могильный страж", fac,
        )

    def fighter(tid, hp=42):
        return unit(
            tid, "fighter", el, 5, hp, 6, 4, 2,
            deck4([
                card(f"{tid}_1", "card.bot_ghost_slash", el, 1, atk=7, tags=["attack"]),
                card(f"{tid}_2", "card.bot_ghost_slash", el, 1, atk=7, tags=["attack"]),
                card(f"{tid}_3", "card.bot_ghost_slash", el, 1, atk=8, tags=["attack"]),
                card(f"{tid}_4", "card.bot_ghost_slash", el, 1, atk=7, tags=["attack"]),
            ]),
            "Призрак-боец", fac,
        )

    def heal(tid, hp=32):
        return unit(
            tid, "support", el, 5, hp, 3, 3, 2,
            deck4([
                card(f"{tid}_h1", "card.bot_ghost_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                     ops=[{"op": "heal", "amount": 7}]),
                card(f"{tid}_h2", "card.bot_ghost_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                     ops=[{"op": "heal", "amount": 7}]),
                card(f"{tid}_h3", "card.bot_ghost_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                     ops=[{"op": "heal", "amount": 8}]),
                card(f"{tid}_h4", "card.bot_ghost_sip", el, 1, tags=["heal"], rule="ally_lowest_hp",
                     ops=[{"op": "heal", "amount": 7}]),
            ]),
            "Призрак-хил", fac,
        )

    write(stage(
        "mythmir_5_f1", 5, 1,
        [tank("bot_ghost_tank_m5f1", hp=52), fighter("bot_ghost_fighter_m5f1", hp=46), heal("bot_ghost_support_m5f1", hp=36)],
        "Призрачный Чертог", "Танк · боец · хил", fac, "tank_fighter_heal", "Призрачный Чертог",
        "Dodge 1/4 у призраков.",
    ))
    write(stage(
        "mythmir_5_f2", 5, 1,
        [fighter("bot_ghost_fighter_m5f2_a", hp=44), heal("bot_ghost_support_m5f2", hp=34), fighter("bot_ghost_fighter_m5f2_b", hp=44)],
        "Призрачный Чертог", "Боец · хил · боец", fac, "fighter_heal_fighter", "Призрачный Чертог",
        "Dodge 1/4.",
    ))

    boss = unit(
        "bot_pitboss_ghost_gul_m5f3", "fighter", el, 5, 58, 6, 4, 3,
        deck4([
            # backline slashes respect taunt; mass cost2
            card("card_ghost_slash_m5f3", "card.bot_ghost_slash", el, 1, atk=7, rule="backline",
                 tags=["attack", "backline"]),
            card("card_ghost_slash2_m5f3", "card.bot_ghost_slash", el, 1, atk=7, rule="backline",
                 tags=["attack", "backline"]),
            card("card_ghost_cleave_m5f3", "card.bot_ghost_cleave", el, 2, atk=6, rule="all_enemies",
                 tags=["attack", "aoe"]),
            card("card_ghost_center_m5f3", "card.bot_ghost_slash", el, 1, atk=7, rule="nearest", tags=["attack"]),
        ]),
        "Фантом Гул", fac, pitboss=True,
    )
    write(stage(
        "mythmir_5_f3", 5, 1,
        [tank("bot_ghost_tank_m5f3", hp=46), boss, heal("bot_ghost_support_m5f3", hp=30)],
        "Призрачный Чертог", "Танк · босс · хил", fac, "tank_boss_heal", "Призрачный Чертог",
        "Босс backline+taunt; масс cost2; dodge.",
    ))


if __name__ == "__main__":
    ch1()
    ch2()
    ch3()
    ch4()
    ch5()
    print("done")
