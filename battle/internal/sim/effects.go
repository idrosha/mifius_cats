package sim

import (
	"math"
	"strings"

	"github.com/idrosha/mir_games/battle/internal/content"
)

func unitFactionHint(u *Unit) string {
	if u == nil {
		return ""
	}
	id := strings.ToLower(u.ID)
	switch {
	case strings.Contains(id, "ghost"):
		return "ghosts"
	case strings.Contains(id, "zomb"):
		return "zombies"
	case strings.Contains(id, "wolf"):
		return "wolves"
	case strings.Contains(id, "redd"):
		return "red_dogs"
	case strings.Contains(id, "dog"):
		return "dogs"
	default:
		return ""
	}
}

func (b *Battle) resolveCard(actor *Unit, card content.CardDef, targets []*Unit) {
	if card.Shield > 0 {
		amt := int(math.Floor(float64(card.Shield) * kinshipOnly(card.Element, actor.Element)))
		var shieldTargets []*Unit
		switch card.TargetRule {
		case "ally_all", "ally_lowest_hp", "self":
			// Ally/self shields resolve via SelectTargets (ally_lowest = missing HP).
			shieldTargets = targets
		default:
			// Bash / poke: attack hits enemies; barrier stays on the caster.
			shieldTargets = []*Unit{actor}
		}
		src := ""
		if actor != nil {
			src = actor.ID
		}
		for _, t := range shieldTargets {
			if t == nil || !t.Alive || amt <= 0 {
				continue
			}
			t.Shield += amt
			b.emit(CombatEvent{
				Kind:     "status",
				SourceID: src,
				TargetID: t.ID,
				Status:   "shield",
				StatusOp: "shield",
				Amount:   amt,
			})
		}
	}

	hits := card.Hits
	if hits <= 0 && card.Atk > 0 {
		hits = 1
	}
	pierce := hasTag(card.Tags, "pierce")
	crit := hasTag(card.Tags, "crit")
	// FULL-SPEC: AoE primary = full hit; secondary targets = 50%.
	aoe := hasTag(card.Tags, "aoe") || card.TargetRule == "all_enemies"
	for h := 0; h < hits; h++ {
		primary := true
		for _, t := range targets {
			if !t.Alive || card.Atk <= 0 {
				continue
			}
			// Hit = card.Atk + gear weapon ATK (+ buff). Template Unit.Atk stays sheet/catalog.
			dmg := card.Atk + actor.AtkBuff + actor.GearAtk
			if b.cardsPlayedByUnit[actor.ID] >= 2 {
				// ponytail: skill/500 under scale-50 ≈ noop; retune divisor when LiveOps sets skill curve
				dmg += int(math.Floor(float64(dmg) * float64(actor.Skill) / 500.0))
			}
			mul := DamageMul(card.Element, actor.Element, t.Element)
			if actor.hasStatus("claw_mode") {
				mul *= 1.5
			}
			if crit {
				mul *= 2.0 // FULL-SPEC / MF-59 (was 1.5 SL stub)
			}
			if t.hasStatus("vuln") {
				mul *= 1.25
			}
			if actor.hasStatus("weak") {
				mul *= 0.75
			}
			dealt := int(math.Floor(float64(dmg) * mul))
			aoeSec := aoe && !primary
			if aoeSec {
				dealt = int(math.Floor(float64(dealt) * 0.5))
			}
			primary = false
			ignoreShield := pierce || t.hasStatus("fragile")
			b.applyHit(actor, t, dealt, ignoreShield, crit, pierce, aoeSec)
		}
	}

	for _, op := range card.EffectOps {
		b.applyOp(actor, targets, op)
	}
}

func kinshipOnly(cardEl, unitEl string) float64 {
	if cardEl != "" && cardEl == unitEl {
		return 1.10
	}
	return 1.0
}

func (b *Battle) applyHit(attacker, target *Unit, amount int, ignoreShield, crit, pierce, aoeSecondary bool) {
	src := ""
	if attacker != nil {
		src = attacker.ID
	}
	// Ch5 ghosts: rare dodge (~1 of 4 hits).
	if unitFactionHint(target) == "ghosts" && b.rng != nil && b.rng.ChancePercent(25) {
		b.emit(CombatEvent{Kind: "dodge", SourceID: src, TargetID: target.ID})
		return
	}
	hadTaunt := target.hasStatus("taunt")
	hpLost, shAbs, killed := b.applyDamage(attacker, target, amount, ignoreShield)
	if hpLost == 0 && shAbs == 0 {
		return
	}
	b.emit(CombatEvent{
		Kind:         "hit",
		SourceID:     src,
		TargetID:     target.ID,
		Amount:       hpLost,
		ShieldAbsorb: shAbs,
		Crit:         crit,
		Pierce:       pierce,
		AoeSecondary: aoeSecondary,
		Kill:         killed,
	})
	// Ch4 zombies: attacker gains +1 poison stack (thorns) on any successful hit.
	if attacker != nil && attacker.Alive && unitFactionHint(target) == "zombies" {
		attacker.addStatus("poison", 1, 0)
		b.emit(CombatEvent{Kind: "status", SourceID: target.ID, TargetID: attacker.ID, Status: "poison", StatusOp: "apply", Amount: 1})
	}
	// Tank wind reflect (elven kits): while taunted target has reflect, return ~35% of HP damage dealt.
	if attacker != nil && attacker.Alive && hadTaunt && target.hasStatus("reflect") && hpLost > 0 {
		stacks := target.statusStacks("reflect")
		if stacks < 1 {
			stacks = 1
		}
		pct := 0.30 + 0.05*float64(stacks-1) // 30% base, +5% per extra stack, cap ~40%
		if pct > 0.40 {
			pct = 0.40
		}
		reflected := int(math.Floor(float64(hpLost) * pct))
		if reflected > 0 {
			_, _, _ = b.applyDamage(target, attacker, reflected, true)
			b.emit(CombatEvent{Kind: "hit", SourceID: target.ID, TargetID: attacker.ID, Amount: reflected, Pierce: true})
		}
	}
	// Pitboss hitting a taunting tank freezes them (stun) for the next turn; support cleanse removes it.
	if attacker != nil && isPitbossUnit(attacker) && hadTaunt && target.Alive {
		target.addStatus("stun", 1, 1)
		b.emit(CombatEvent{Kind: "status", SourceID: src, TargetID: target.ID, Status: "stun", StatusOp: "apply", Amount: 1})
	}
}

// applyDamage mutates HP/shield; returns HP lost, shield absorbed, and whether the unit died this hit.
// Armor DEF softens hits (Def/2, floor 1) unless pierce/fragile (ignoreShield). Enemy HP is fixed in content.
func (b *Battle) applyDamage(attacker, target *Unit, amount int, ignoreShield bool) (hpLost, shieldAbs int, killed bool) {
	_ = attacker
	if amount <= 0 || !target.Alive {
		return 0, 0, false
	}
	wasAlive := target.Alive
	if !ignoreShield && target.Def > 0 {
		mit := target.Def / 2
		if mit > 0 {
			amount -= mit
			if amount < 1 {
				amount = 1
			}
		}
	}
	if !ignoreShield && target.Shield > 0 {
		if amount <= target.Shield {
			target.Shield -= amount
			return 0, amount, false
		}
		shieldAbs = target.Shield
		amount -= target.Shield
		target.Shield = 0
	}
	before := target.HP
	target.HP -= amount
	// wiki §1.3: sleep breaks on damage (stun does not).
	if target.hasStatus("sleep") {
		target.clearStatus("sleep")
		b.emit(CombatEvent{Kind: "status", TargetID: target.ID, Status: "sleep", StatusOp: "clear"})
	}
	if target.HP <= 0 {
		if b.rng != nil && b.rng.ChancePercent(target.Charm) {
			target.HP = 1
			target.addStatus("last_meow", 1, 1)
			b.emit(CombatEvent{Kind: "status", TargetID: target.ID, Status: "last_meow", StatusOp: "apply"})
			hpLost = before - target.HP
			return hpLost, shieldAbs, false
		}
		target.HP = 0
		target.Alive = false
		target.Statuses = nil
		hpLost = before
		return hpLost, shieldAbs, wasAlive
	}
	hpLost = before - target.HP
	return hpLost, shieldAbs, false
}

func hasTag(tags []string, want string) bool {
	for _, t := range tags {
		if t == want {
			return true
		}
	}
	return false
}

func (b *Battle) applyOp(actor *Unit, targets []*Unit, op map[string]any) {
	name, _ := op["op"].(string)
	switch name {
	case "apply_status":
		st, _ := op["status"].(string)
		stacks := intFrom(op["stacks"], 1)
		dur := intFrom(op["duration"], 1)
		dest := targets
		// taunt/stealth/ruffle/claw/mint stack on the acting unit (§3.4 Claw Mode).
		if st == "taunt" || st == "stealth" || st == "ruffle" || st == "claw_mode" || st == "mint" {
			dest = []*Unit{actor}
		}
		for _, t := range dest {
			hadCleanser := t.hasStatus("cleanser") && isNegativeStatus(st)
			t.addStatus(st, stacks, dur)
			if hadCleanser && !t.hasStatus(st) {
				b.emit(CombatEvent{Kind: "status", TargetID: t.ID, Status: st, StatusOp: "block"})
				continue
			}
			b.emit(CombatEvent{Kind: "status", TargetID: t.ID, Status: st, StatusOp: "apply", Amount: stacks})
			// mint (мята): self-cleanse of negatives on apply.
			if st == "mint" {
				emitClearedNegatives(b, t)
				t.clearNegative()
			}
			if st == "ruffle" && t.statusStacks("ruffle") >= 10 {
				t.addStatus("claw_mode", 1, 1)
				b.emit(CombatEvent{Kind: "status", TargetID: t.ID, Status: "claw_mode", StatusOp: "apply"})
				ps := b.player(t.Side)
				ps.Energy++
				b.drawCards(t, 1)
			}
		}
	case "heal":
		amt := intFrom(op["amount"], 0)
		healTargets := targets
		if tgt, _ := op["target"].(string); tgt == "self" {
			healTargets = []*Unit{actor}
		}
		for _, t := range healTargets {
			if !t.Alive {
				continue
			}
			before := t.HP
			t.HP += amt
			if t.HP > t.MaxHP {
				t.HP = t.MaxHP
			}
			gained := t.HP - before
			if gained > 0 {
				src := ""
				if actor != nil {
					src = actor.ID
				}
				b.emit(CombatEvent{Kind: "heal", SourceID: src, TargetID: t.ID, Amount: gained})
			}
		}
	case "cleanse":
		for _, t := range targets {
			emitClearedNegatives(b, t)
			t.clearNegative()
			// cleanser buff: block the next incoming negative once.
			t.addStatus("cleanser", 1, 2)
			b.emit(CombatEvent{Kind: "status", TargetID: t.ID, Status: "cleanser", StatusOp: "apply"})
		}
	case "buff":
		stat, _ := op["stat"].(string)
		amt := intFrom(op["amount"], 0)
		dur := intFrom(op["duration"], 1)
		src := ""
		if actor != nil {
			src = actor.ID
		}
		for _, t := range targets {
			if t == nil || !t.Alive {
				continue
			}
			if stat == "atk" {
				t.AtkBuff += amt
				t.AtkBuffDur = dur
				b.emit(CombatEvent{
					Kind:     "status",
					SourceID: src,
					TargetID: t.ID,
					Status:   "atk_up",
					StatusOp: "apply",
					Amount:   amt,
				})
			}
		}
	}
}

// emitClearedNegatives — HUD cue before clearNegative (cleanse / mint). Visible to all.
func emitClearedNegatives(b *Battle, t *Unit) {
	if t == nil {
		return
	}
	for _, s := range t.Statuses {
		if isNegativeStatus(s.ID) {
			b.emit(CombatEvent{Kind: "status", TargetID: t.ID, Status: s.ID, StatusOp: "clear"})
		}
	}
}

func intFrom(v any, def int) int {
	switch x := v.(type) {
	case float64:
		return int(x)
	case int:
		return x
	case int64:
		return int(x)
	default:
		return def
	}
}
