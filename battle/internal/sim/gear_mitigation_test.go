package sim

import (
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
)

func TestArmorDef_MitigatesHit(t *testing.T) {
	b := &Battle{}
	target := &Unit{Alive: true, HP: 50, MaxHP: 50, Def: 6}
	hpLost, _, _ := b.applyDamage(nil, target, 6, false)
	// Def/2 = 3 → 6-3 = 3
	if hpLost != 3 {
		t.Fatalf("hpLost=%d want 3 (def/2 mitigation)", hpLost)
	}
	pierceTarget := &Unit{Alive: true, HP: 50, MaxHP: 50, Def: 6}
	hpPierce, _, _ := b.applyDamage(nil, pierceTarget, 6, true)
	if hpPierce != 6 {
		t.Fatalf("pierce should ignore def: hpLost=%d want 6", hpPierce)
	}
}

func TestGearCrit_ProcAt100(t *testing.T) {
	b := &Battle{ID: "gear-crit", rng: NewRNG(1), cardsPlayedByUnit: map[string]int{}}
	actor := &Unit{ID: "a", Side: SideP1, Alive: true, GearCrit: 100}
	target := &Unit{ID: "t", Side: SideP2, Alive: true, HP: 100, MaxHP: 100}
	b.Units = []*Unit{actor, target}
	card := content.CardDef{Atk: 10, Hits: 1, TargetRule: "nearest"}
	b.resolveCard(actor, card, []*Unit{target})
	if target.HP != 80 {
		t.Fatalf("gear crit 100%% should double: HP=%d want 80", target.HP)
	}
}
