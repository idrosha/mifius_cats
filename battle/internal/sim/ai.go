package sim

import (
	"errors"
	"sort"
)

var errRunaway = errors.New("battle runaway")

// ChooseAction — deterministic scripted-deck AI for PvE bots (and optional auto-play).
// Prefers: affordable attack cards by atk desc, then shield/heal, else end turn.
func (b *Battle) ChooseAction() Action {
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
			card := u.Deck[cardIdx]
			if card.Cost > ps.Energy {
				continue
			}
			p := 0
			if card.Atk > 0 {
				p = 100 + card.Atk
			} else if card.Shield > 0 {
				p = 50 + card.Shield
			} else {
				p = 40 // heal/buff
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

// AutoPlay runs both sides with ChooseAction until finished or maxTurns.
func (b *Battle) AutoPlay(maxTurns int) error {
	guards := 0
	for !b.Finished() {
		if b.Turn > maxTurns {
			b.Result = ResultTimeout
			b.record("timeout", nil)
			return nil
		}
		a := b.ChooseAction()
		if err := b.SubmitAction(a); err != nil {
			if err2 := b.SubmitAction(Action{Kind: ActionEndTurn}); err2 != nil {
				return err2
			}
		}
		guards++
		if guards > 5000 {
			return errRunaway
		}
	}
	return nil
}

// AdvancePvEBots runs scripted AI while it is the P2 (bot) turn.
// Used after interactive SubmitAction so the player sees P1 again without inventing combat on the client.
func (b *Battle) AdvancePvEBots() error {
	if b.Mode != ModePvE {
		return nil
	}
	guards := 0
	for !b.Finished() && b.Active == SideP2 {
		a := b.ChooseAction()
		if err := b.SubmitAction(a); err != nil {
			if err2 := b.SubmitAction(Action{Kind: ActionEndTurn}); err2 != nil {
				return err2
			}
		}
		guards++
		if guards > 500 {
			return errRunaway
		}
	}
	return nil
}
