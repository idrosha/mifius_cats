package sim

import "testing"

// D-043: poison never expires by duration; stacks escalate +1 after each tick.
func TestPoisonPermanentEscalate(t *testing.T) {
	b := &Battle{ID: "poison", rng: NewRNG(1), cardsPlayedByUnit: map[string]int{}}
	u := &Unit{ID: "t", Side: SideP1, Alive: true, HP: 40, MaxHP: 40}
	b.Units = []*Unit{u}
	u.addStatus("poison", 2, 99) // duration ignored
	if got := u.statusStacks("poison"); got != 2 {
		t.Fatalf("stacks=%d want 2", got)
	}
	if u.Statuses[0].Duration != 0 {
		t.Fatalf("poison duration=%d want 0 (permanent)", u.Statuses[0].Duration)
	}
	b.tickStatuses(SideP1)
	if u.HP != 38 { // dealt 2
		t.Fatalf("after tick1 hp=%d want 38", u.HP)
	}
	if got := u.statusStacks("poison"); got != 3 {
		t.Fatalf("after tick1 stacks=%d want 3", got)
	}
	b.tickStatuses(SideP1)
	if u.HP != 35 { // dealt 3
		t.Fatalf("after tick2 hp=%d want 35", u.HP)
	}
	if got := u.statusStacks("poison"); got != 4 {
		t.Fatalf("after tick2 stacks=%d want 4", got)
	}
}
