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

func TestHitEventsInBattle(t *testing.T) {
	b := &Battle{ID: "ev", rng: NewRNG(1), cardsPlayedByUnit: map[string]int{}}
	actor := &Unit{ID: "a", Side: SideP1, Alive: true}
	target := &Unit{ID: "t", Side: SideP2, Alive: true, HP: 100, MaxHP: 100, Shield: 5}
	b.Units = []*Unit{actor, target}
	card := content.CardDef{Atk: 10, Hits: 1, Tags: []string{"crit"}, TargetRule: "nearest"}
	b.resolveCard(actor, card, []*Unit{target})
	if len(b.Events) != 1 {
		t.Fatalf("want 1 hit event, got %d", len(b.Events))
	}
	ev := b.Events[0]
	if ev.Kind != "hit" || !ev.Crit || ev.TargetID != "t" {
		t.Fatalf("bad event: %+v", ev)
	}
	if ev.ShieldAbsorb != 5 || ev.Amount != 15 {
		t.Fatalf("want shield 5 + hp 15 (crit 20), got absorb=%d amount=%d", ev.ShieldAbsorb, ev.Amount)
	}
}

func TestShieldEmitsEventOnAllyLowest(t *testing.T) {
	b := &Battle{ID: "sh", rng: NewRNG(1), cardsPlayedByUnit: map[string]int{}}
	actor := &Unit{ID: "tank", Side: SideP1, Alive: true, HP: 50, MaxHP: 50, Element: "stone"}
	ally := &Unit{ID: "hurt", Side: SideP1, Alive: true, HP: 20, MaxHP: 50}
	b.Units = []*Unit{actor, ally}
	card := content.CardDef{
		Shield: 4, TargetRule: "ally_lowest_hp", Element: "stone",
		Tags: []string{"shield"},
	}
	b.resolveCard(actor, card, []*Unit{ally})
	if ally.Shield != 4 {
		t.Fatalf("ally shield want 4, got %d", ally.Shield)
	}
	if actor.Shield != 0 {
		t.Fatalf("caster must not keep ally shield, got %d", actor.Shield)
	}
	if len(b.Events) != 1 {
		t.Fatalf("want 1 shield event, got %d %#v", len(b.Events), b.Events)
	}
	ev := b.Events[0]
	if ev.Kind != "status" || ev.StatusOp != "shield" || ev.TargetID != "hurt" || ev.Amount != 4 {
		t.Fatalf("bad shield event: %+v", ev)
	}
}

func TestHealEventTargetID(t *testing.T) {
	b := &Battle{ID: "heal", rng: NewRNG(1), cardsPlayedByUnit: map[string]int{}}
	actor := &Unit{ID: "supp", Side: SideP1, Alive: true, HP: 28, MaxHP: 28}
	ally := &Unit{ID: "hurt", Side: SideP1, Alive: true, HP: 20, MaxHP: 50}
	b.Units = []*Unit{actor, ally}
	b.applyOp(actor, []*Unit{ally}, map[string]any{"op": "heal", "amount": 5})
	if ally.HP != 25 {
		t.Fatalf("heal want HP 25, got %d", ally.HP)
	}
	if len(b.Events) != 1 || b.Events[0].Kind != "heal" || b.Events[0].TargetID != "hurt" || b.Events[0].Amount != 5 {
		t.Fatalf("bad heal event: %#v", b.Events)
	}
}

func TestBuffEmitsAtkUpEvent(t *testing.T) {
	b := &Battle{ID: "buff", rng: NewRNG(1), cardsPlayedByUnit: map[string]int{}}
	actor := &Unit{ID: "supp", Side: SideP1, Alive: true, HP: 28, MaxHP: 28}
	ally := &Unit{ID: "fighter", Side: SideP1, Alive: true, HP: 40, MaxHP: 43}
	b.Units = []*Unit{actor, ally}
	b.applyOp(actor, []*Unit{ally}, map[string]any{"op": "buff", "stat": "atk", "amount": 2, "duration": 3})
	if ally.AtkBuff != 2 || ally.AtkBuffDur != 3 {
		t.Fatalf("buff state want +2/3, got %d/%d", ally.AtkBuff, ally.AtkBuffDur)
	}
	if len(b.Events) != 1 {
		t.Fatalf("want 1 buff event, got %d", len(b.Events))
	}
	ev := b.Events[0]
	if ev.Kind != "status" || ev.Status != "atk_up" || ev.StatusOp != "apply" || ev.TargetID != "fighter" || ev.Amount != 2 {
		t.Fatalf("bad buff event: %+v", ev)
	}
}
