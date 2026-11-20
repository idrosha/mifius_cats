package sim

import (
	"errors"
	"fmt"
	"sort"
	"strings"

	"github.com/idrosha/mir_games/battle/internal/content"
)

var errRunaway = errors.New("battle runaway")

func isHealCard(card content.CardDef) bool {
	if hasTag(card.Tags, "heal") {
		return true
	}
	for _, op := range card.EffectOps {
		if op["op"] == "heal" {
			return true
		}
	}
	return false
}

func healAmount(card content.CardDef) int {
	n := 0
	for _, op := range card.EffectOps {
		if op["op"] == "heal" {
			if v, ok := op["amount"].(float64); ok {
				n += int(v)
			} else if v, ok := op["amount"].(int); ok {
				n += v
			}
		}
	}
	return n
}

func allyNeedsHeal(b *Battle, side Side) bool {
	return maxAllyMissingHP(b, side) > 0
}

// maxAllyMissingHP — largest MaxHP−HP among living allies (0 if full).
func maxAllyMissingHP(b *Battle, side Side) int {
	max := 0
	for _, u := range b.living(side) {
		miss := u.MaxHP - u.HP
		if miss > max {
			max = miss
		}
	}
	return max
}

func enemyHasLivingSupport(b *Battle, side Side) bool {
	for _, u := range b.living(opposite(side)) {
		if u.Role == "support" {
			return true
		}
	}
	return false
}

func isPitbossUnit(u *Unit) bool {
	return u != nil && strings.Contains(u.ID, "pitboss")
}

// pitbossCanAffordAttack — living pitboss has a playable attack at ≤ energy.
func pitbossCanAffordAttack(b *Battle, side Side, energy int, skip map[string]bool) bool {
	for _, u := range b.living(side) {
		if !isPitbossUnit(u) || u.hasStatus("stun") || u.hasStatus("sleep") {
			continue
		}
		for hi, cardIdx := range u.Hand {
			key := fmt.Sprintf("%s#%d", u.ID, hi)
			if skip != nil && skip[key] {
				continue
			}
			card := u.Deck[cardIdx]
			if card.Atk <= 0 || card.Cost > energy {
				continue
			}
			if actorClawBlocksRuffle(u, card.Tags) {
				continue
			}
			targets := b.SelectTargets(u, card.TargetRule, "", hasTag(card.Tags, "ambush"))
			if needsTarget(card.TargetRule) && len(targets) == 0 {
				continue
			}
			return true
		}
	}
	return false
}

// healWouldStarvePitboss — spending healCost would leave the pitboss unable to attack
// while it still could with current energy (Andrew: ch2 boss idle while healers spend all E).
func healWouldStarvePitboss(b *Battle, side Side, energy, healCost int, skip map[string]bool) bool {
	if healCost > energy {
		return false
	}
	if !pitbossCanAffordAttack(b, side, energy, skip) {
		return false
	}
	return !pitbossCanAffordAttack(b, side, energy-healCost, skip)
}

// ChooseAction — deterministic scripted-deck AI for PvE bots (and optional auto-play).
// Prefers: affordable attack cards by atk desc, then shield/heal, else end turn.
func (b *Battle) ChooseAction() Action {
	return b.chooseActionSkipping(nil)
}

func (b *Battle) chooseActionSkipping(skip map[string]bool) Action {
	side := b.Active
	ps := b.player(side)
	type cand struct {
		unit     *Unit
		handIdx  int
		priority int // higher first
	}
	var cs []cand
	for _, u := range b.living(side) {
		if u.hasStatus("stun") || u.hasStatus("sleep") {
			continue
		}
		for hi, cardIdx := range u.Hand {
			key := fmt.Sprintf("%s#%d", u.ID, hi)
			if skip != nil && skip[key] {
				continue
			}
			card := u.Deck[cardIdx]
			if card.Cost > ps.Energy {
				continue
			}
			if actorClawBlocksRuffle(u, card.Tags) {
				continue
			}
			targets := b.SelectTargets(u, card.TargetRule, "", hasTag(card.Tags, "ambush"))
			if needsTarget(card.TargetRule) && len(targets) == 0 {
				continue
			}
			p := 0
			if card.Atk > 0 {
				p = 100 + card.Atk
				// Bias toward spending remaining energy this action.
				if card.Cost == ps.Energy {
					p += 5
				}
				// D-042 chess: prefer backline when enemy healers/supports still up.
				if card.TargetRule == "backline" && enemyHasLivingSupport(b, side) {
					p += 40
				}
				// D-043 ch4: solo support (necro after assassins fall) hunts the rear.
				if u.Role == "support" && card.TargetRule == "backline" && len(b.living(side)) == 1 {
					p += 45
				}
			} else if u.Role == "support" && isHealCard(card) && allyNeedsHeal(b, side) {
				// Support healers must heal (ch2/ch4/ch5), but never spend the last energy
				// a living pitboss needs for an attack (D-042 — Лютый Клык / heal packs).
				miss := maxAllyMissingHP(b, side)
				starve := healWouldStarvePitboss(b, side, ps.Energy, card.Cost, skip)
				chipSoft := b.StageID == "mythmir_2_f3" && miss < 12
				if starve || chipSoft {
					p = 55 + healAmount(card) // below attacks (~100+)
				} else {
					p = 160 + healAmount(card)
				}
			} else if card.Shield > 0 {
				p = 50 + card.Shield
			} else {
				p = 40 // buff / other
			}
			cs = append(cs, cand{unit: u, handIdx: hi, priority: p})
		}
	}
	if len(cs) == 0 {
		return Action{Kind: ActionEndTurn}
	}
	sort.SliceStable(cs, func(i, j int) bool {
		if cs[i].priority != cs[j].priority {
			return cs[i].priority > cs[j].priority
		}
		if cs[i].unit.Lane != cs[j].unit.Lane {
			return cs[i].unit.Lane < cs[j].unit.Lane
		}
		return cs[i].handIdx < cs[j].handIdx
	})
	best := cs[0]
	return Action{
		Kind:      ActionPlayCard,
		UnitID:    best.unit.ID,
		HandIndex: best.handIdx,
	}
}

// submitAIAction plays the best legal card, retrying other hand slots on reject
// so leftover energy is not dumped on an empty end-turn.
// Uses applyAction (no Events clear) so AdvancePvEBots can accumulate hit cues after endTurn.
func (b *Battle) submitAIAction() error {
	tried := map[string]bool{}
	for {
		a := b.chooseActionSkipping(tried)
		if a.Kind == ActionEndTurn {
			return b.applyAction(a)
		}
		key := fmt.Sprintf("%s#%d", a.UnitID, a.HandIndex)
		tried[key] = true
		if err := b.applyAction(a); err != nil {
			if len(tried) > 32 {
				return b.applyAction(Action{Kind: ActionEndTurn})
			}
			continue
		}
		return nil
	}
}

// AutoPlay runs both sides with ChooseAction until finished or maxTurns.
func (b *Battle) AutoPlay(maxTurns int) error {
	guards := 0
	for !b.Finished() {
		if b.Turn > maxTurns {
			b.Result = ResultTimeout
			b.record("timeout", nil)
			return nil
		}
		if err := b.submitAIAction(); err != nil {
			return err
		}
		guards++
		if guards > 5000 {
			return errRunaway
		}
	}
	return nil
}

// AdvancePvEBots runs scripted AI while it is the P2 turn.
// Used after interactive SubmitAction so the player sees P1 again without inventing combat on the client.
// Soft-launch: ModePvP still advances scripted P2 (local smoke / no MM yet). HUD must label this as AI smoke, not live duel.
func (b *Battle) AdvancePvEBots() error {
	if b.Mode != ModePvE && b.Mode != ModePvP {
		return nil
	}
	guards := 0
	for !b.Finished() && b.Active == SideP2 {
		if err := b.submitAIAction(); err != nil {
			return err
		}
		guards++
		if guards > 500 {
			return errRunaway
		}
	}
	return nil
}
