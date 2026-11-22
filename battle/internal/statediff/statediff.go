// Package statediff — client-facing §8.2 stateDiff from sim.Battle (HUD payload).
// Numbers are authoritative; no economy/rewards here.
package statediff

import (
	"github.com/idrosha/mir_games/battle/internal/sim"
)

// Diff mirrors mythfel-client StateDiff JSON (§8.2 / §9 Game/Battle).
type Diff struct {
	BattleID   string            `json:"battleId"`
	Seq        int               `json:"seq"`
	Turn       int               `json:"turn"`
	Active     int               `json:"active"`
	Result     string            `json:"result"`
	P1         Player            `json:"p1"`
	P2         Player            `json:"p2"`
	Units      []Unit            `json:"units"`
	Hand       []HandCard        `json:"hand"`
	PotionTray []PotionSlot      `json:"potionTray"`
	CanKeep    bool              `json:"canKeep"`
	CanEndTurn bool              `json:"canEndTurn"`
	Events     []sim.CombatEvent `json:"events,omitempty"`
}

type Player struct {
	Energy     int `json:"energy"`
	MilkDrops  int `json:"milkDrops"`
	MilkBursts int `json:"milkBursts"`
	KeepCost   int `json:"keepCost"`
}

type Unit struct {
	ID           string   `json:"id"`
	Side         int      `json:"side"`
	Lane         int      `json:"lane"`
	Role         string   `json:"role"`
	Element      string   `json:"element"`
	HP           int      `json:"hp"`
	MaxHP        int      `json:"maxHp"`
	Shield       int      `json:"shield"`
	Alive        bool     `json:"alive"`
	AtkBuff      int      `json:"atkBuff,omitempty"`
	AtkBuffDur   int      `json:"atkBuffDur,omitempty"`
	Statuses     []Status `json:"statuses"`
	HandCount    int      `json:"handCount"`
	DrawCount    int      `json:"drawCount"`
	DiscardCount int      `json:"discardCount"`
}

type Status struct {
	ID       string `json:"id"`
	Stacks   int    `json:"stacks"`
	Duration int    `json:"duration"`
}

type HandCard struct {
	UnitID     string   `json:"unitId"`
	HandIndex  int      `json:"handIndex"`
	CardID     string   `json:"cardId"`
	NameKey    string   `json:"name_key"`
	Cost       int      `json:"cost"`
	Playable   bool     `json:"playable"`
	Kept       bool     `json:"kept"`
	TargetRule string   `json:"targetRule,omitempty"`
	Tags       []string `json:"tags,omitempty"`
}

type PotionSlot struct {
	PotionID  string `json:"potionId"`
	NameKey   string `json:"name_key"`
	Available bool   `json:"available"`
}

// FromBattle builds presentation payload for the HUD (active side hand).
func FromBattle(b *sim.Battle) Diff {
	seq := 0
	if n := len(b.Frames); n > 0 {
		seq = b.Frames[n-1].Seq
	}
	finished := b.Finished()
	active := int(b.Active)
	d := Diff{
		BattleID: b.ID,
		Seq:      seq,
		Turn:     b.Turn,
		Active:   active,
		Result:   string(b.Result),
		P1: Player{
			Energy:     b.P1.Energy,
			MilkDrops:  b.P1.MilkDrops,
			MilkBursts: b.P1.MilkBursts,
			KeepCost:   b.P1.KeepCost,
		},
		P2: Player{
			Energy:     b.P2.Energy,
			MilkDrops:  b.P2.MilkDrops,
			MilkBursts: b.P2.MilkBursts,
			KeepCost:   b.P2.KeepCost,
		},
		CanKeep:    !finished && b.Active == sim.SideP1,
		CanEndTurn: !finished && b.Active == sim.SideP1,
		Units:      make([]Unit, 0, len(b.Units)),
		Hand:       nil,
		PotionTray: potionTray(b),
		Events:     append([]sim.CombatEvent(nil), b.Events...),
	}
	if d.Events == nil {
		d.Events = []sim.CombatEvent{}
	}

	energy := b.P1.Energy
	if b.Active == sim.SideP2 {
		energy = b.P2.Energy
		d.CanKeep = !finished
		d.CanEndTurn = !finished
	}

	for _, u := range b.Units {
		statuses := make([]Status, 0, len(u.Statuses))
		for _, s := range u.Statuses {
			statuses = append(statuses, Status{ID: s.ID, Stacks: s.Stacks, Duration: s.Duration})
		}
		d.Units = append(d.Units, Unit{
			ID:           u.ID,
			Side:         int(u.Side),
			Lane:         u.Lane,
			Role:         u.Role,
			Element:      u.Element,
			HP:           u.HP,
			MaxHP:        u.MaxHP,
			Shield:       u.Shield,
			Alive:        u.Alive,
			AtkBuff:      u.AtkBuff,
			AtkBuffDur:   u.AtkBuffDur,
			Statuses:     statuses,
			HandCount:    len(u.Hand),
			DrawCount:    len(u.DrawPile),
			DiscardCount: len(u.Discard),
		})
		if u.Side != b.Active || !u.Alive {
			continue
		}
		stunned := unitCC(u)
		for hi, cardIdx := range u.Hand {
			card := u.Deck[cardIdx]
			kept := hi < len(u.KeepMask) && u.KeepMask[hi]
			playable := !stunned && card.Cost <= energy && !sim.ClawBlocksRuffle(u, card.Tags)
			d.Hand = append(d.Hand, HandCard{
				UnitID:     u.ID,
				HandIndex:  hi,
				CardID:     card.CardID,
				NameKey:    card.NameKey,
				Cost:       card.Cost,
				Playable:   playable,
				Kept:       kept,
				TargetRule: card.TargetRule,
				Tags:       append([]string(nil), card.Tags...),
			})
		}
	}
	if d.Hand == nil {
		d.Hand = []HandCard{}
	}
	return d
}

// unitCC — stun/sleep: cards in hand stay visible but not playable (FULL-SPEC §3.5).
func unitCC(u *sim.Unit) bool {
	for _, s := range u.Statuses {
		if s.ID == "stun" || s.ID == "sleep" {
			return true
		}
	}
	return false
}

func potionTray(b *sim.Battle) []PotionSlot {
	src := b.PotionsP1
	if b.Active == sim.SideP2 {
		src = b.PotionsP2
	}
	if len(src) == 0 {
		return []PotionSlot{}
	}
	out := make([]PotionSlot, 0, len(src))
	for id, ok := range src {
		out = append(out, PotionSlot{
			PotionID:  id,
			NameKey:   "potion." + id,
			Available: ok,
		})
	}
	return out
}
