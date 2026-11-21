package sim

import "testing"

func baseBattleThreeRoles() (*Battle, *Unit) {
	b := &Battle{ID: "t", Mode: ModePvE, Units: nil}
	tank := &Unit{ID: "e_tank", Side: SideP2, Lane: 0, Role: "tank", HP: 50, MaxHP: 50, Alive: true}
	fighter := &Unit{ID: "e_fighter", Side: SideP2, Lane: 1, Role: "fighter", HP: 43, MaxHP: 43, Alive: true}
	support := &Unit{ID: "e_support", Side: SideP2, Lane: 2, Role: "support", HP: 28, MaxHP: 28, Alive: true}
	actor := &Unit{ID: "p_fighter", Side: SideP1, Lane: 1, Role: "fighter", HP: 43, MaxHP: 43, Alive: true}
	b.Units = []*Unit{actor, tank, fighter, support}
	return b, actor
}

func TestSelectTargets_NearestPrefersTank(t *testing.T) {
	b, actor := baseBattleThreeRoles()
	got := b.SelectTargets(actor, "nearest", "", false)
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
	got := b.SelectTargets(actor, "nearest", "", false)
	if len(got) != 1 || got[0].ID != "e_support" {
		t.Fatalf("nearest must prefer front lane over rear tank, got %#v", ids(got))
	}
}

func TestSelectTargets_BacklinePrefersSupport(t *testing.T) {
	b, actor := baseBattleThreeRoles()
	got := b.SelectTargets(actor, "backline", "", false)
	if len(got) != 1 || got[0].ID != "e_support" {
		t.Fatalf("backline want e_support, got %#v", ids(got))
	}
}

func TestSelectTargets_BacklineFallsToRangerThenMage(t *testing.T) {
	b := &Battle{ID: "t2", Mode: ModePvE}
	actor := &Unit{ID: "p", Side: SideP1, Lane: 0, Role: "ranger", HP: 35, MaxHP: 35, Alive: true}
	mage := &Unit{ID: "e_mage", Side: SideP2, Lane: 1, Role: "mage", HP: 30, MaxHP: 30, Alive: true}
	ranger := &Unit{ID: "e_ranger", Side: SideP2, Lane: 2, Role: "ranger", HP: 35, MaxHP: 35, Alive: true}
	tank := &Unit{ID: "e_tank", Side: SideP2, Lane: 0, Role: "tank", HP: 50, MaxHP: 50, Alive: true}
	b.Units = []*Unit{actor, tank, mage, ranger}

	got := b.SelectTargets(actor, "backline", "", false)
	if len(got) != 1 || got[0].ID != "e_ranger" {
		t.Fatalf("backline without support want ranger, got %#v", ids(got))
	}
	ranger.Alive = false
	got = b.SelectTargets(actor, "backline", "", false)
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
	got := b.SelectTargets(actor, "backline", "", false)
	if len(got) != 1 || got[0].ID != "e_tank" {
		t.Fatalf("taunt must override backline, got %#v", ids(got))
	}
}

func TestSelectTargets_CenterPrefersMidLane(t *testing.T) {
	b, actor := baseBattleThreeRoles()
	got := b.SelectTargets(actor, "center", "", false)
	if len(got) != 1 || got[0].ID != "e_fighter" {
		t.Fatalf("center want mid fighter, got %#v", ids(got))
	}
}

func TestSelectTargets_RandomEnemyIgnoresTaunt(t *testing.T) {
	b, actor := baseBattleThreeRoles()
	b.rng = NewRNG(42)
	for _, u := range b.Units {
		if u.ID == "e_tank" {
			u.addStatus("taunt", 1, 1)
		}
	}
	seen := map[string]bool{}
	for i := 0; i < 40; i++ {
		got := b.SelectTargets(actor, "random_enemy", "", false)
		if len(got) != 1 {
			t.Fatalf("random_enemy want 1 target, got %#v", ids(got))
		}
		seen[got[0].ID] = true
	}
	if len(seen) < 2 {
		t.Fatalf("random_enemy should hit multiple ids despite taunt, got %#v", seen)
	}
}

func TestSelectTargets_MeleeExplicitDeepPickRejected(t *testing.T) {
	b, actor := baseBattleThreeRoles()
	// Fighter naming rear support on nearest = illegal (§3.4).
	got := b.SelectTargets(actor, "nearest", "e_support", false)
	if got != nil {
		t.Fatalf("melee deep-pick must reject, got %#v", ids(got))
	}
	got = b.SelectTargets(actor, "nearest", "e_tank", false)
	if len(got) != 1 || got[0].ID != "e_tank" {
		t.Fatalf("melee may name legal nearest tank, got %#v", ids(got))
	}
}

func TestSelectTargets_FreeTargetExplicitAnyEnemy(t *testing.T) {
	b, _ := baseBattleThreeRoles()
	ranger := &Unit{ID: "p_ranger", Side: SideP1, Lane: 2, Role: "ranger", HP: 35, MaxHP: 35, Alive: true}
	b.Units = append(b.Units, ranger)
	got := b.SelectTargets(ranger, "nearest", "e_support", false)
	if len(got) != 1 || got[0].ID != "e_support" {
		t.Fatalf("ranger free-target may name rear support, got %#v", ids(got))
	}
}

func TestSelectTargets_AmbushBypassesStealth(t *testing.T) {
	b, actor := baseBattleThreeRoles()
	for _, u := range b.Units {
		if u.ID == "e_tank" {
			u.addStatus("stealth", 1, 1)
		}
	}
	got := b.SelectTargets(actor, "nearest", "", false)
	if len(got) != 1 || got[0].ID == "e_tank" {
		t.Fatalf("without ambush stealth tank must be skipped, got %#v", ids(got))
	}
	got = b.SelectTargets(actor, "nearest", "", true)
	if len(got) != 1 || got[0].ID != "e_tank" {
		t.Fatalf("ambush must hit stealthed front tank, got %#v", ids(got))
	}
}

func ids(units []*Unit) []string {
	out := make([]string, len(units))
	for i, u := range units {
		out[i] = u.ID
	}
	return out
}
