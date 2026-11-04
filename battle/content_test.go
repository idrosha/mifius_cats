package battle_test

import (
	"path/filepath"
	"runtime"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
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
}
