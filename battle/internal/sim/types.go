package sim

import "github.com/idrosha/mifius_cats/battle/internal/content"

type Side int

const (
	SideP1 Side = 0
	SideP2 Side = 1
)

type Mode string

const (
	ModePvE Mode = "pve"
	ModePvP Mode = "pvp"
)

type Status struct {
	ID       string `json:"id"`
	Stacks   int    `json:"stacks"`
	Duration int    `json:"duration"` // 0 = permanent stacks (e.g. ruffle)
}

type Unit struct {
	ID        string           `json:"id"`
	Side      Side             `json:"side"`
	Lane      int              `json:"lane"` // 0..2
	Role      string           `json:"role"`
	Element   string           `json:"element"`
	MaxHP     int              `json:"maxHp"`
	HP        int              `json:"hp"`
	Atk       int              `json:"atk"`
	Spd       int              `json:"spd"`
	Skill     int              `json:"skill"`
	Charm     int              `json:"charm"`
	Shield    int              `json:"shield"`
	Statuses  []Status         `json:"statuses"`
	Deck      []content.CardDef `json:"-"`
	DrawPile  []int            `json:"-"` // indices into Deck
	Hand      []int            `json:"hand"`
	Discard   []int            `json:"-"`
	Alive     bool             `json:"alive"`
	AtkBuff   int              `json:"atkBuff"`
	AtkBuffDur int             `json:"atkBuffDur"`
}

type PlayerState struct {
	Energy     int `json:"energy"`
	MilkDrops  int `json:"milkDrops"`
	MilkBursts int `json:"milkBursts"`
	BonusE     int `json:"bonusE"` // permanent from Milk Burst
	BonusDraw  int `json:"bonusDraw"`
	KeepCost   int `json:"keepCost"`
}

type ActionKind string

const (
	ActionPlayCard ActionKind = "playCard"
	ActionKeep     ActionKind = "keep"
	ActionPotion   ActionKind = "potion"
	ActionEndTurn  ActionKind = "endTurn"
	ActionSurrender ActionKind = "surrender"
)

type Action struct {
	Kind       ActionKind `json:"kind"`
	UnitID     string     `json:"unitId,omitempty"`
	HandIndex  int        `json:"handIndex,omitempty"`
	TargetID   string     `json:"targetId,omitempty"`
	PotionID   string     `json:"potionId,omitempty"`
}

type Frame struct {
	Seq     int            `json:"seq"`
	Action  *Action        `json:"action,omitempty"`
	Note    string         `json:"note,omitempty"`
	Snapshot map[string]any `json:"snapshot,omitempty"`
}

type Result string

const (
	ResultNone      Result = ""
	ResultP1Win     Result = "p1_win"
	ResultP2Win     Result = "p2_win"
	ResultSurrender Result = "surrender"
	ResultTimeout   Result = "timeout"
)

type Battle struct {
	ID        string
	Mode      Mode
	Seed      int64
	StageID   string // PvE
	MatchID   string // PvP
	Turn      int
	Active    Side
	First     Side // who acts first each round (P1 for Phase 1)
	Units     []*Unit
	P1        PlayerState
	P2        PlayerState
	Result    Result
	Frames    []Frame
	frameSeq  int
	rng       *RNG
	PotionsP1 map[string]bool
	PotionsP2 map[string]bool
	cardsPlayedByUnit map[string]int // for skill combo §2.4
}

func (b *Battle) player(side Side) *PlayerState {
	if side == SideP1 {
		return &b.P1
	}
	return &b.P2
}

func (b *Battle) living(side Side) []*Unit {
	var out []*Unit
	for _, u := range b.Units {
		if u.Side == side && u.Alive {
			out = append(out, u)
		}
	}
	return out
}

func (b *Battle) unitByID(id string) *Unit {
	for _, u := range b.Units {
		if u.ID == id {
			return u
		}
	}
	return nil
}

func (u *Unit) hasStatus(id string) bool {
	for _, s := range u.Statuses {
		if s.ID == id && (s.Stacks > 0 || s.Duration > 0) {
			return true
		}
	}
	return false
}

func (u *Unit) statusStacks(id string) int {
	for _, s := range u.Statuses {
		if s.ID == id {
			return s.Stacks
		}
	}
	return 0
}

func (u *Unit) addStatus(id string, stacks, duration int) {
	for i := range u.Statuses {
		if u.Statuses[i].ID == id {
			u.Statuses[i].Stacks += stacks
			if duration > u.Statuses[i].Duration {
				u.Statuses[i].Duration = duration
			}
			return
		}
	}
	u.Statuses = append(u.Statuses, Status{ID: id, Stacks: stacks, Duration: duration})
}

func (u *Unit) clearNegative() {
	keep := u.Statuses[:0]
	neg := map[string]bool{"bleed": true, "poison": true, "sleep": true, "stun": true, "weak": true, "vuln": true, "fragile": true}
	for _, s := range u.Statuses {
		if !neg[s.ID] {
			keep = append(keep, s)
		}
	}
	u.Statuses = keep
}
