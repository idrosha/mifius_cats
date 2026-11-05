package sim

import "testing"

func baseBattleThreeRoles() (*Battle, *Unit) {
	b := &Battle{ID: "t", Mode: ModePvE, Units: nil}
	tank := &Unit{ID: "e_tank", Side: SideP2, Lane: 0, Role: "tank", HP: 40, MaxHP: 40, Alive: true}
	fighter := &Unit{ID: "e_fighter", Side: SideP2, Lane: 1, Role: "fighter", HP: 30, MaxHP: 30, Alive: true}
	support := &Unit{ID: "e_support", Side: SideP2, Lane: 2, Role: "support", HP: 25, MaxHP: 25, Alive: true}
	actor := &Unit{ID: "p_fighter", Side: SideP1, Lane: 1, Role: "fighter", HP: 30, MaxHP: 30, Alive: true}
	b.Units = []*Unit{actor, tank, fighter, support}
	return b, actor
}

func TestSelectTargets_NearestPrefersTank(t *testing.T) {
	b, actor := baseBattleThreeRoles()
	got := b.SelectTargets(actor, "nearest", "")
	if len(got) != 1 || got[0].ID != "e_tank" {
		t.Fatalf("nearest want e_tank, got %#v", ids(got))
	}
}

func TestSelectTargets_NearestPrefersFrontLane(t *testing.T) {
	b, actor := baseBattleThreeRoles()
	// Misplaced support in lane 0 is the frontmost enemy (§3.4 lane-first).
	for _, u := range b.Units {
		if u.ID == "e_support" {
			u.Lane = 0
		}
		if u.ID == "e_tank" {
			u.Lane = 2
		}
	}
	got := b.SelectTargets(actor, "nearest", "")
	if len(got) != 1 || got[0].ID != "e_support" {
		t.Fatalf("nearest must prefer front lane over rear tank, got %#v", ids(got))
	}
}

func TestSelectTargets_BacklinePrefersSupport(t *testing.T) {
	b, actor := baseBattleThreeRoles()
	got := b.SelectTargets(actor, "backline", "")
	if len(got) != 1 || got[0].ID != "e_support" {
		t.Fatalf("backline want e_support, got %#v", ids(got))
	}
}

func TestSelectTargets_BacklineFallsToRangerThenMage(t *testing.T) {
	b := &Battle{ID: "t2", Mode: ModePvE}
	actor := &Unit{ID: "p", Side: SideP1, Lane: 0, Role: "ranger", HP: 20, MaxHP: 20, Alive: true}
	mage := &Unit{ID: "e_mage", Side: SideP2, Lane: 1, Role: "mage", HP: 20, MaxHP: 20, Alive: true}
	ranger := &Unit{ID: "e_ranger", Side: SideP2, Lane: 2, Role: "ranger", HP: 20, MaxHP: 20, Alive: true}
	tank := &Unit{ID: "e_tank", Side: SideP2, Lane: 0, Role: "tank", HP: 40, MaxHP: 40, Alive: true}
	b.Units = []*Unit{actor, tank, mage, ranger}

	got := b.SelectTargets(actor, "backline", "")
	if len(got) != 1 || got[0].ID != "e_ranger" {
		t.Fatalf("backline without support want ranger, got %#v", ids(got))
	}
	ranger.Alive = false
	got = b.SelectTargets(actor, "backline", "")
	if len(got) != 1 || got[0].ID != "e_mage" {
		t.Fatalf("backline without support/ranger want mage, got %#v", ids(got))
	}
}

func TestSelectTargets_TauntOverridesBackline(t *testing.T) {
	b, actor := baseBattleThreeRoles()
	for _, u := range b.Units {
		if u.ID == "e_tank" {
			u.addStatus("taunt", 1, 1)
		}
	}
	got := b.SelectTargets(actor, "backline", "")
	if len(got) != 1 || got[0].ID != "e_tank" {
		t.Fatalf("taunt must override backline, got %#v", ids(got))
	}
}

func ids(units []*Unit) []string {
	out := make([]string, len(units))
	for i, u := range units {
		out[i] = u.ID
	}
	return out
}
