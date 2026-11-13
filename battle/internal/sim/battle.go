package sim

import (
	"fmt"

	"github.com/idrosha/mir_games/battle/internal/content"
)

type CreateParams struct {
	BattleID string
	Mode     Mode
	Seed     int64
	StageID  string
	MatchID  string
	P1Team   []SpawnUnit
	P2Team   []SpawnUnit
	PotionsP1 []string
	PotionsP2 []string
}

type SpawnUnit struct {
	ID       string
	Template content.CatTemplate
	Deck     []content.CardDef
	Parts    map[string]content.PartDef // for passiveOps
}

// NewBattle builds the shared core used by CreatePvE and CreatePvP.
func NewBattle(p CreateParams) (*Battle, error) {
	if len(p.P1Team) != 3 || len(p.P2Team) != 3 {
		return nil, fmt.Errorf("team must be 3v3, got %d vs %d", len(p.P1Team), len(p.P2Team))
	}
	b := &Battle{
		ID:                p.BattleID,
		Mode:              p.Mode,
		Seed:              p.Seed,
		StageID:           p.StageID,
		MatchID:           p.MatchID,
		Turn:              1,
		Active:            SideP1,
		First:             SideP1,
		rng:               NewRNG(p.Seed),
		PotionsP1:         potionSet(p.PotionsP1),
		PotionsP2:         potionSet(p.PotionsP2),
		cardsPlayedByUnit: map[string]int{},
	}
	for i, s := range p.P1Team {
		u, err := spawn(s, SideP1, i, b.rng)
		if err != nil {
			return nil, err
		}
		b.Units = append(b.Units, u)
	}
	for i, s := range p.P2Team {
		u, err := spawn(s, SideP2, i, b.rng)
		if err != nil {
			return nil, err
		}
		b.Units = append(b.Units, u)
	}
	b.beginSideTurn(SideP1, true)
	b.record("battle_start", nil)
	return b, nil
}

func potionSet(ids []string) map[string]bool {
	m := map[string]bool{}
	seen := map[string]bool{}
	for _, id := range ids {
		if seen[id] {
			continue // ≤1 per potionId (§3.4)
		}
		seen[id] = true
		m[id] = true
	}
	return m
}

func spawn(s SpawnUnit, side Side, lane int, rng *RNG) (*Unit, error) {
	n := len(s.Deck)
	if n < 4 || n > 6 {
		return nil, fmt.Errorf("unit %s deck must be 4–6 cards, got %d", s.ID, n)
	}
	st := s.Template.BaseStats
	u := &Unit{
		ID:      s.ID,
		Side:    side,
		Lane:    lane,
		Role:    s.Template.Role,
		Element: s.Template.Element,
		MaxHP:   st.HP,
		HP:      st.HP,
		Atk:     st.Atk,
		Spd:     st.Spd,
		Skill:   st.Skill,
		Charm:   st.Charm,
		Deck:    append([]content.CardDef(nil), s.Deck...),
		Alive:   true,
	}
	for _, p := range s.Parts {
		for _, op := range p.PassiveOps {
			if op["op"] == "stat_mod" {
				stat, _ := op["stat"].(string)
				amt := intFrom(op["amount"], 0)
				switch stat {
				case "hp":
					u.MaxHP += amt
					u.HP += amt
				case "atk":
					u.Atk += amt
				case "spd":
					u.Spd += amt
				case "skill":
					u.Skill += amt
				case "charm":
					u.Charm += amt
				}
			}
		}
	}
	u.DrawPile = make([]int, n)
	for i := 0; i < n; i++ {
		u.DrawPile[i] = i
	}
	rng.Shuffle(len(u.DrawPile), func(i, j int) {
		u.DrawPile[i], u.DrawPile[j] = u.DrawPile[j], u.DrawPile[i]
	})
	return u, nil
}

func (b *Battle) beginSideTurn(side Side, isRoundStart bool) {
	b.Active = side
	b.cardsPlayedByUnit = map[string]int{}
	firstActor := side == b.First
	e, _ := energyDrawFor(b.Turn, firstActor)
	ps := b.player(side)
	ps.Energy = e + ps.BonusE
	ps.KeepCost = 1
	living := b.living(side)
	drawN := DrawPerLiving(len(living)) + ps.BonusDraw
	for _, u := range living {
		// Kept cards already sit in Hand from endTurn; clear Keep marks for the new turn (§3.3–3.4).
		u.KeepMask = make([]bool, len(u.Hand))
		b.drawCards(u, drawN)
		if u.hasStatus("stun") || u.hasStatus("sleep") {
			continue
		}
	}
	_ = isRoundStart
}

// discardUnusedHand moves non-Kept hand cards into discard at end of that side's turn (§3.3).
func (b *Battle) discardUnusedHand(side Side) {
	for _, u := range b.living(side) {
		keptHand := make([]int, 0, len(u.Hand))
		for i, hi := range u.Hand {
			if i < len(u.KeepMask) && u.KeepMask[i] {
				keptHand = append(keptHand, hi)
				continue
			}
			u.Discard = append(u.Discard, hi)
		}
		u.Hand = keptHand
		u.KeepMask = make([]bool, len(keptHand))
		for i := range u.KeepMask {
			u.KeepMask[i] = true // still marked until beginSideTurn clears for the new turn
		}
	}
}

func (b *Battle) drawCards(u *Unit, n int) {
	for i := 0; i < n; i++ {
		if len(u.DrawPile) == 0 {
			if len(u.Discard) == 0 {
				return
			}
			u.DrawPile = append(u.DrawPile, u.Discard...)
			u.Discard = nil
			b.rng.Shuffle(len(u.DrawPile), func(a, c int) {
				u.DrawPile[a], u.DrawPile[c] = u.DrawPile[c], u.DrawPile[a]
			})
		}
		if len(u.DrawPile) == 0 {
			return
		}
		cardIdx := u.DrawPile[0]
		u.DrawPile = u.DrawPile[1:]
		u.Hand = append(u.Hand, cardIdx)
		u.KeepMask = append(u.KeepMask, false)
	}
}

func (b *Battle) record(note string, action *Action) {
	b.frameSeq++
	snap := map[string]any{
		"turn":   b.Turn,
		"active": int(b.Active),
		"result": string(b.Result),
		"p1e":    b.P1.Energy,
		"p2e":    b.P2.Energy,
	}
	units := make([]map[string]any, 0, len(b.Units))
	for _, u := range b.Units {
		units = append(units, map[string]any{
			"id": u.ID, "hp": u.HP, "maxHp": u.MaxHP, "shield": u.Shield,
			"alive": u.Alive, "side": int(u.Side), "hand": len(u.Hand),
		})
	}
	snap["units"] = units
	b.Frames = append(b.Frames, Frame{Seq: b.frameSeq, Action: action, Note: note, Snapshot: snap})
}

func (b *Battle) checkEnd() {
	if len(b.living(SideP1)) == 0 {
		b.Result = ResultP2Win
		return
	}
	if len(b.living(SideP2)) == 0 {
		b.Result = ResultP1Win
	}
}

// Finished reports whether the battle has a terminal result.
func (b *Battle) Finished() bool {
	return b.Result != ResultNone
}
