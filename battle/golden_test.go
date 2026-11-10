package battle_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/idrosha/mifius_cats/battle/internal/content"
	"github.com/idrosha/mifius_cats/battle/internal/mode"
	"github.com/idrosha/mifius_cats/battle/internal/sim"
)

const goldenSeed int64 = 20261104

func TestGolden_StartersBeatTestYard(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvE(cat, "golden_test_yard_1", "test_yard_1", goldenSeed, team, nil)
	if err != nil {
		t.Fatal(err)
	}
	if b.Mode != sim.ModePvE {
		t.Fatalf("mode=%s", b.Mode)
	}
	if err := b.AutoPlay(30); err != nil {
		t.Fatal(err)
	}
	if b.Result != sim.ResultP1Win {
		t.Fatalf("expected p1_win, got %s after turn %d frames=%d", b.Result, b.Turn, len(b.Frames))
	}

	type golden struct {
		Seed      int64  `json:"seed"`
		StageID   string `json:"stageId"`
		Result    string `json:"result"`
		Turn      int    `json:"turn"`
		FrameCount int   `json:"frameCount"`
	}
	got := golden{
		Seed:       goldenSeed,
		StageID:    "test_yard_1",
		Result:     string(b.Result),
		Turn:       b.Turn,
		FrameCount: len(b.Frames),
	}
	path := filepath.Join("testdata", "golden", "starters_vs_test_yard_1.json")
	if os.Getenv("UPDATE_GOLDEN") == "1" {
		raw, _ := json.MarshalIndent(got, "", "  ")
		if err := os.WriteFile(path, append(raw, '\n'), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read golden (run UPDATE_GOLDEN=1): %v", err)
	}
	var want golden
	if err := json.Unmarshal(raw, &want); err != nil {
		t.Fatal(err)
	}
	if got != want {
		t.Fatalf("golden mismatch\n got=%+v\nwant=%+v", got, want)
	}
}

func TestCreatePvP_SharesCore(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvP(cat, "pvp1", "match1", 42, team, team, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if b.Mode != sim.ModePvP {
		t.Fatalf("mode=%s", b.Mode)
	}
	// same sequential energy table / illegal reject
	err = b.SubmitAction(sim.Action{Kind: sim.ActionPlayCard, UnitID: "nope", HandIndex: 0})
	if err == nil {
		t.Fatal("expected illegal play reject")
	}
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	if b.Active != sim.SideP2 {
		t.Fatalf("after P1 endTurn active=%v", b.Active)
	}
}

func TestDeterminism_SameSeedSameResult(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	run := func() (sim.Result, int) {
		b, err := mode.CreatePvE(cat, "d", "test_yard_1", goldenSeed, team, nil)
		if err != nil {
			t.Fatal(err)
		}
		if err := b.AutoPlay(30); err != nil {
			t.Fatal(err)
		}
		return b.Result, len(b.Frames)
	}
	r1, f1 := run()
	r2, f2 := run()
	if r1 != r2 || f1 != f2 {
		t.Fatalf("non-deterministic: %s/%d vs %s/%d", r1, f1, r2, f2)
	}
}
