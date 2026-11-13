package sim

import (
	"math"

	"github.com/idrosha/mir_games/battle/internal/content"
)

func (b *Battle) resolveCard(actor *Unit, card content.CardDef, targets []*Unit) {
	if card.Shield > 0 {
		amt := int(math.Floor(float64(card.Shield) * kinshipOnly(card.Element, actor.Element)))
		switch card.TargetRule {
		case "ally_all":
			for _, t := range targets {
				t.Shield += amt
			}
		case "ally_lowest_hp", "self":
			for _, t := range targets {
				t.Shield += amt
			}
		default:
			actor.Shield += amt
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
			// Hit = card.Atk (+ buff). Unit.Atk is sheet/catalog only (FULL-SPEC cards SoT).
			dmg := card.Atk + actor.AtkBuff
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
			if aoe && !primary {
				dealt = int(math.Floor(float64(dealt) * 0.5))
			}
			primary = false
			ignoreShield := pierce || t.hasStatus("fragile")
			b.applyDamage(actor, t, dealt, ignoreShield)
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

func (b *Battle) applyDamage(attacker, target *Unit, amount int, ignoreShield bool) {
	_ = attacker
	if amount <= 0 || !target.Alive {
		return
	}
	if !ignoreShield && target.Shield > 0 {
		if amount <= target.Shield {
			target.Shield -= amount
			return
		}
		amount -= target.Shield
		target.Shield = 0
	}
	target.HP -= amount
	// wiki §1.3: sleep breaks on damage (stun does not).
	if target.hasStatus("sleep") {
		target.clearStatus("sleep")
	}
	if target.HP <= 0 {
		if b.rng != nil && b.rng.ChancePercent(target.Charm) {
			target.HP = 1
			target.addStatus("last_meow", 1, 1)
			return
		}
		target.HP = 0
		target.Alive = false
		target.Statuses = nil
	}
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
			t.addStatus(st, stacks, dur)
			// mint (мята): self-cleanse of negatives on apply.
			if st == "mint" {
				t.clearNegative()
			}
			if st == "ruffle" && t.statusStacks("ruffle") >= 10 {
				t.addStatus("claw_mode", 1, 1)
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
			t.HP += amt
			if t.HP > t.MaxHP {
				t.HP = t.MaxHP
			}
		}
	case "cleanse":
		for _, t := range targets {
			t.clearNegative()
			// cleanser buff: block the next incoming negative once.
			t.addStatus("cleanser", 1, 2)
		}
	case "buff":
		stat, _ := op["stat"].(string)
		amt := intFrom(op["amount"], 0)
		dur := intFrom(op["duration"], 1)
		for _, t := range targets {
			if stat == "atk" {
				t.AtkBuff += amt
				t.AtkBuffDur = dur
			}
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
