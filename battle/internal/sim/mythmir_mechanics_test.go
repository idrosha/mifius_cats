package sim

import (
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
)

func testUnit(id, role string, side Side, lane, hp int) *Unit {
	return &Unit{
		ID: id, Role: role, Side: side, Lane: lane,
		MaxHP: hp, HP: hp, Alive: true,
		Deck: []content.CardDef{
			{CardID: id + "_c0", Cost: 1, Atk: 5, Hits: 1, TargetRule: "nearest", Tags: []string{"attack"}},
			{CardID: id + "_c1", Cost: 1, Atk: 5, Hits: 1, TargetRule: "nearest", Tags: []string{"attack"}},
			{CardID: id + "_c2", Cost: 1, Atk: 5, Hits: 1, TargetRule: "nearest", Tags: []string{"attack"}},
			{CardID: id + "_c3", Cost: 1, Atk: 5, Hits: 1, TargetRule: "nearest", Tags: []string{"attack"}},
		},
	}
}

func TestCenterTargetingRespectsTaunt(t *testing.T) {
	b := &Battle{rng: NewRNG(1)}
	actor := testUnit("bot_0_wolf", "ranger", SideP2, 2, 20)
	mid := testUnit("p1_1_fighter", "fighter", SideP1, 1, 40)
	tank := testUnit("p1_0_tank", "tank", SideP1, 0, 50)
	tank.addStatus("taunt", 1, 2)
	b.Units = []*Unit{actor, mid, tank}
	got := b.SelectTargets(actor, "center", "", false)
	if len(got) != 1 || got[0].ID != tank.ID {
		t.Fatalf("center+taunt want tank, got %#v", got)
	}
}

func TestPitbossHitTauntAppliesStun(t *testing.T) {
	b := &Battle{rng: NewRNG(2)}
	boss := testUnit("bot_1_pitboss_wolf", "fighter", SideP2, 1, 60)
	tank := testUnit("p1_0_tank", "tank", SideP1, 0, 50)
	tank.addStatus("taunt", 1, 2)
	b.Units = []*Unit{boss, tank}
	b.applyHit(boss, tank, 5, false, false, false, false)
	if !tank.hasStatus("stun") {
		t.Fatal("pitboss hit on taunter must apply stun")
	}
}

func TestZombieThornsPoison(t *testing.T) {
	b := &Battle{rng: NewRNG(3)}
	atk := testUnit("p1_0_fighter", "fighter", SideP1, 0, 40)
	zomb := testUnit("bot_0_zomb_fighter", "fighter", SideP2, 0, 26)
	b.Units = []*Unit{atk, zomb}
	b.applyHit(atk, zomb, 4, false, false, false, false)
	if atk.statusStacks("poison") < 1 {
		t.Fatal("hitting zombie must apply +1 poison to attacker")
	}
}

func TestGhostDodgeChance(t *testing.T) {
	dodges := 0
	hits := 0
	for seed := int64(0); seed < 200; seed++ {
		b := &Battle{rng: NewRNG(seed)}
		atk := testUnit("p1_0_fighter", "fighter", SideP1, 0, 40)
		ghost := testUnit("bot_0_ghost_fighter", "fighter", SideP2, 1, 40)
		hpBefore := ghost.HP
		b.Units = []*Unit{atk, ghost}
		b.clearEvents()
		b.applyHit(atk, ghost, 5, false, false, false, false)
		dodged := false
		for _, ev := range b.Events {
			if ev.Kind == "dodge" {
				dodged = true
			}
		}
		if dodged {
			dodges++
			if ghost.HP != hpBefore {
				t.Fatalf("dodge must deal no damage")
			}
		} else if ghost.HP < hpBefore {
			hits++
		}
	}
	if dodges < 20 || dodges > 80 {
		t.Fatalf("dodge rate out of band: dodges=%d hits=%d", dodges, hits)
	}
}

func TestFactionHint(t *testing.T) {
	cases := map[string]string{
		"bot_0_ghost_tank":       "ghosts",
		"bot_1_zomb_assassin":    "zombies",
		"bot_2_pitboss_wolf":     "wolves",
		"bot_0_pitboss_dog":      "dogs",
		"bot_1_redd_fighter":     "red_dogs",
	}
	for id, want := range cases {
		got := unitFactionHint(&Unit{ID: id})
		if got != want {
			t.Fatalf("%s → %s want %s", id, got, want)
		}
	}
}
