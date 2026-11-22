package economy

import (
	"testing"
	"time"
)

func TestDungeonKeys_SeedSpendBuyFirstClear(t *testing.T) {
	p := NewPlayer("u1")
	p.Fish = 500
	if err := SeedDungeonKeys(p); err != nil {
		t.Fatal(err)
	}
	if p.DungeonKeys["scarlet"] != 3 {
		t.Fatalf("scarlet keys=%d", p.DungeonKeys["scarlet"])
	}
	if err := SeedDungeonKeys(p); err != nil {
		t.Fatal(err)
	}
	if p.DungeonKeys["scarlet"] != 3 {
		t.Fatalf("re-seed mutated keys")
	}
	if err := SpendDungeonKey(p, "scarlet"); err != nil {
		t.Fatal(err)
	}
	if p.DungeonKeys["scarlet"] != 2 {
		t.Fatalf("after spend=%d", p.DungeonKeys["scarlet"])
	}
	if err := BuyDungeonKey(p, "howl"); err != nil {
		t.Fatal(err)
	}
	if p.Fish != 500-90 {
		t.Fatalf("fish=%d", p.Fish)
	}
	if !MarkDungeonFirstClear(p, "howl") {
		t.Fatal("first clear want true")
	}
	if MarkDungeonFirstClear(p, "howl") {
		t.Fatal("second first-clear must be false")
	}
	if err := GrantDungeonRare(p, "rare_howl_mane"); err != nil {
		t.Fatal(err)
	}
	if len(p.DungeonRares) != 1 {
		t.Fatalf("rares=%d", len(p.DungeonRares))
	}
	snap := DungeonSnapshot(p, time.Now().UTC())
	if snap["runs"].(int) != 1 {
		t.Fatalf("runs=%v", snap["runs"])
	}
}

func TestDungeonKeys_Errors(t *testing.T) {
	p := NewPlayer("u2")
	_ = SeedDungeonKeys(p)
	p.DungeonKeys["scarlet"] = 0
	if err := SpendDungeonKey(p, "scarlet"); err != ErrNoDungeonKey {
		t.Fatalf("want ErrNoDungeonKey got %v", err)
	}
	if err := BuyDungeonKey(p, "nope"); err != ErrUnknownDungeonKey {
		t.Fatalf("want unknown got %v", err)
	}
}
