package replay_test

import (
	"path/filepath"
	"runtime"
	"strconv"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/replay"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

func contentRoot(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller failed")
	}
	// battle/internal/replay → repo root /content
	return filepath.Clean(filepath.Join(filepath.Dir(file), "..", "..", "..", "content"))
}

func finishShortPvP(t *testing.T, battleID, matchID string, seed int64) *sim.Battle {
	t.Helper()
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvP(cat, battleID, matchID, seed, team, team, nil, nil, nil, nil, false, 0)
	if err != nil {
		t.Fatal(err)
	}
	// Surrender ends immediately — enough frames for GetReplay (§8.2).
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionSurrender}); err != nil {
		t.Fatal(err)
	}
	if !b.Finished() {
		t.Fatal("expected finished")
	}
	return b
}

func TestSaveListGetReplay_PvP(t *testing.T) {
	store := replay.NewStore()
	b := finishShortPvP(t, "pvp_r1", "m1", 11)

	if err := store.SaveFinishedPvP([]string{"u1", "u2"}, b); err != nil {
		t.Fatal(err)
	}

	list1 := store.List("u1")
	if len(list1) != 1 || list1[0].BattleID != "pvp_r1" {
		t.Fatalf("list u1=%+v", list1)
	}
	list2 := store.List("u2")
	if len(list2) != 1 {
		t.Fatalf("list u2 len=%d", len(list2))
	}
	if len(store.List("nobody")) != 0 {
		t.Fatal("empty user should have empty list")
	}

	frames, err := store.GetReplay("pvp_r1")
	if err != nil {
		t.Fatal(err)
	}
	if len(frames) == 0 {
		t.Fatal("GetReplay returned 0 frames")
	}
	if len(frames) != list1[0].FrameCount {
		t.Fatalf("frameCount meta=%d got=%d", list1[0].FrameCount, len(frames))
	}
	if _, err := store.GetReplay("missing"); err == nil {
		t.Fatal("expected missing replay error")
	}
}

func TestSaveFinishedPvP_RejectsPvE(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvE(cat, "pve1", "test_yard_1", 1, team, nil, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	_ = b.SubmitAction(sim.Action{Kind: sim.ActionSurrender})
	store := replay.NewStore()
	if err := store.SaveFinishedPvP([]string{"u1"}, b); err == nil {
		t.Fatal("expected PvE reject")
	}
}

func TestStore_KeepsLast10PerUser(t *testing.T) {
	store := replay.NewStore()
	for i := 0; i < replay.MaxPerUser+3; i++ {
		id := "pvp_" + strconv.Itoa(i)
		b := finishShortPvP(t, id, "m_"+strconv.Itoa(i), int64(100+i))
		if err := store.SaveFinishedPvP([]string{"u1"}, b); err != nil {
			t.Fatal(err)
		}
	}
	list := store.List("u1")
	if len(list) != replay.MaxPerUser {
		t.Fatalf("want %d, got %d", replay.MaxPerUser, len(list))
	}
	// Newest first.
	if list[0].BattleID != "pvp_"+strconv.Itoa(replay.MaxPerUser+2) {
		t.Fatalf("newest=%s", list[0].BattleID)
	}
	if list[len(list)-1].BattleID != "pvp_3" {
		t.Fatalf("oldest kept=%s want pvp_3", list[len(list)-1].BattleID)
	}
	// Evicted battleIds no longer GetReplay-able for this sole owner.
	if _, err := store.GetReplay("pvp_0"); err == nil {
		t.Fatal("expected evicted pvp_0 gone")
	}
	if _, err := store.GetReplay("pvp_" + strconv.Itoa(replay.MaxPerUser+2)); err != nil {
		t.Fatal(err)
	}
}

func TestStore_EvictDoesNotDropSharedOpponent(t *testing.T) {
	store := replay.NewStore()
	shared := finishShortPvP(t, "shared", "ms", 1)
	if err := store.SaveFinishedPvP([]string{"u1", "u2"}, shared); err != nil {
		t.Fatal(err)
	}
	for i := 0; i < replay.MaxPerUser; i++ {
		b := finishShortPvP(t, "u1only_"+strconv.Itoa(i), "m", int64(i+2))
		if err := store.SaveFinishedPvP([]string{"u1"}, b); err != nil {
			t.Fatal(err)
		}
	}
	// shared evicted from u1 (11th push after shared), but u2 still holds it.
	if len(store.List("u1")) != replay.MaxPerUser {
		t.Fatalf("u1 list=%d", len(store.List("u1")))
	}
	u2 := store.List("u2")
	if len(u2) != 1 || u2[0].BattleID != "shared" {
		t.Fatalf("u2=%+v", u2)
	}
	if _, err := store.GetReplay("shared"); err != nil {
		t.Fatalf("shared must remain via u2: %v", err)
	}
}
