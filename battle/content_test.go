package battle_test

import (
	"path/filepath"
	"runtime"
	"testing"

	"github.com/idrosha/mifius_cats/battle/internal/content"
)

func contentRoot(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller failed")
	}
	return filepath.Clean(filepath.Join(filepath.Dir(file), "..", "content"))
}

func TestContentCatalog_StartersAndCards(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatalf("LoadCatalog: %v", err)
	}
	if len(cat.Cards) < 12 {
		t.Fatalf("cards: got %d want ≥12", len(cat.Cards))
	}
	for _, id := range []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"} {
		s := cat.Starters[id]
		if s.Origin != "starter" {
			t.Fatalf("%s origin=%s", id, s.Origin)
		}
		deck, err := cat.DeckForStarter(id)
		if err != nil {
			t.Fatal(err)
		}
		if len(deck) != 4 {
			t.Fatalf("%s deck=%d", id, len(deck))
		}
	}
	if _, ok := cat.Stages["test_yard_1"]; !ok {
		t.Fatal("missing test_yard_1")
	}

	// §3.4: multiple roles ship ≥1 backline attack (formation pierce).
	backlineByRole := map[string]bool{}
	for _, c := range cat.Cards {
		if c.TargetRule != "backline" {
			continue
		}
		hasAttack := false
		for _, tag := range c.Tags {
			if tag == "attack" {
				hasAttack = true
				break
			}
		}
		if hasAttack && c.RoleGate != "" {
			backlineByRole[c.RoleGate] = true
		}
	}
	for _, role := range []string{"tank", "fighter", "assassin", "support", "mage", "ranger"} {
		if !backlineByRole[role] {
			t.Fatalf("missing backline attack for role %s", role)
		}
	}
}
