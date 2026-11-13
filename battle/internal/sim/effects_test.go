package sim

import (
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
)

func TestCritIsDouble(t *testing.T) {
	b := &Battle{ID: "crit", rng: NewRNG(1), cardsPlayedByUnit: map[string]int{}}
	// empty elements → mul 1.0 (no kinship / matchup)
	actor := &Unit{ID: "a", Side: SideP1, Alive: true}
	target := &Unit{ID: "t", Side: SideP2, Alive: true, HP: 100, MaxHP: 100}
	b.Units = []*Unit{actor, target}
	card := content.CardDef{Atk: 10, Hits: 1, Tags: []string{"crit"}, TargetRule: "nearest"}
	b.resolveCard(actor, card, []*Unit{target})
	if target.HP != 80 {
		t.Fatalf("crit ×2: want HP 80, got %d", target.HP)
	}
}

func TestAoESecondaryHalf(t *testing.T) {
	b := &Battle{ID: "aoe", rng: NewRNG(1), cardsPlayedByUnit: map[string]int{}}
	actor := &Unit{ID: "a", Side: SideP1, Alive: true}
	t1 := &Unit{ID: "t1", Side: SideP2, Alive: true, HP: 100, MaxHP: 100}
	t2 := &Unit{ID: "t2", Side: SideP2, Alive: true, HP: 100, MaxHP: 100}
	b.Units = []*Unit{actor, t1, t2}
	card := content.CardDef{Atk: 10, Hits: 1, Tags: []string{"aoe"}, TargetRule: "all_enemies"}
	b.resolveCard(actor, card, []*Unit{t1, t2})
	if t1.HP != 90 {
		t.Fatalf("aoe primary want 90, got %d", t1.HP)
	}
	if t2.HP != 95 {
		t.Fatalf("aoe secondary 50%% want 95, got %d", t2.HP)
	}
}

func TestSleepClearsOnDamage(t *testing.T) {
	b := &Battle{ID: "sleep", rng: NewRNG(1)}
	u := &Unit{ID: "u", Alive: true, HP: 20, MaxHP: 20}
	u.addStatus("sleep", 1, 2)
	b.applyDamage(nil, u, 1, true)
	if u.hasStatus("sleep") {
		t.Fatal("sleep must clear on damage")
	}
}

func TestCleanserBlocksOneNegative(t *testing.T) {
	u := &Unit{ID: "u", Alive: true}
	u.addStatus("cleanser", 1, 2)
	u.addStatus("stun", 1, 1)
	if u.hasStatus("stun") {
		t.Fatal("cleanser should block stun")
	}
	if u.hasStatus("cleanser") {
		t.Fatal("cleanser should be consumed")
	}
	u.addStatus("stun", 1, 1)
	if !u.hasStatus("stun") {
		t.Fatal("second stun should land")
	}
}

func TestMintClearsNegatives(t *testing.T) {
	b := &Battle{ID: "mint", rng: NewRNG(1), cardsPlayedByUnit: map[string]int{}}
	actor := &Unit{ID: "a", Side: SideP1, Alive: true, HP: 10, MaxHP: 10}
	actor.addStatus("poison", 2, 2)
	b.Units = []*Unit{actor}
	b.applyOp(actor, []*Unit{actor}, map[string]any{"op": "apply_status", "status": "mint", "stacks": 1, "duration": 1})
	if actor.hasStatus("poison") {
		t.Fatal("mint should clear poison")
	}
	if !actor.hasStatus("mint") {
		t.Fatal("mint status should remain")
	}
}
