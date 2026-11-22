package battle_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

type dungeonCoopCatalog struct {
	Version int `json:"version"`
	Party   struct {
		Players        int    `json:"players"`
		CatsPerPlayer  int    `json:"catsPerPlayer"`
		Combat         string `json:"combat"`
		MaxPlayers     int    `json:"maxPlayers"`
	} `json:"party"`
	Timing struct {
		ShortMaxMin int `json:"shortMaxMin"`
		LongMaxMin  int `json:"longMaxMin"`
		MinDeltaMin int `json:"minDeltaMin"`
	} `json:"timing"`
	Dungeons []struct {
		ID         string `json:"id"`
		Faction    string `json:"faction"`
		RareItems  []struct {
			ID string `json:"id"`
		} `json:"rareItems"`
		Paths map[string]struct {
			Nodes     []string `json:"nodes"`
			ChestTier int      `json:"chestTier"`
			LootMult  float64  `json:"lootMult"`
		} `json:"paths"`
	} `json:"dungeons"`
}

func loadDungeonCoop(t *testing.T) dungeonCoopCatalog {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join(contentRoot(t), "campaign", "dungeons_coop_v1.json"))
	if err != nil {
		t.Fatal(err)
	}
	var doc dungeonCoopCatalog
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	return doc
}

func TestDungeonCoop_CatalogShape(t *testing.T) {
	doc := loadDungeonCoop(t)
	if doc.Version < 3 {
		t.Fatalf("version=%d want ≥3", doc.Version)
	}
	if doc.Party.Players != 4 || doc.Party.CatsPerPlayer != 3 || doc.Party.Combat != "3v3" {
		t.Fatalf("party want 4×3 3v3, got %+v", doc.Party)
	}
	if doc.Party.MaxPlayers > 4 || doc.Party.MaxPlayers < 4 {
		t.Fatalf("maxPlayers=%d want 4 (not raid 12)", doc.Party.MaxPlayers)
	}
	if doc.Timing.ShortMaxMin != 10 || doc.Timing.LongMaxMin != 15 {
		t.Fatalf("timing short=%d long=%d want 10/15", doc.Timing.ShortMaxMin, doc.Timing.LongMaxMin)
	}
	if doc.Timing.MinDeltaMin < 4 {
		t.Fatalf("minDeltaMin=%d want ≥4", doc.Timing.MinDeltaMin)
	}
	if len(doc.Dungeons) != 3 {
		t.Fatalf("dungeons=%d want 3", len(doc.Dungeons))
	}
	wantIDs := map[string]string{
		"scarlet": "red_dogs",
		"howl":    "wolves",
		"whisper": "zombies",
	}
	seen := map[string]bool{}
	for _, d := range doc.Dungeons {
		seen[d.ID] = true
		if wantIDs[d.ID] != d.Faction {
			t.Fatalf("%s faction=%s want %s", d.ID, d.Faction, wantIDs[d.ID])
		}
		if len(d.RareItems) < 2 {
			t.Fatalf("%s rareItems=%d want ≥2", d.ID, len(d.RareItems))
		}
		short, ok := d.Paths["short"]
		if !ok || len(short.Nodes) < 2 {
			t.Fatalf("%s missing short path", d.ID)
		}
		long, ok := d.Paths["long"]
		if !ok || len(long.Nodes) <= len(short.Nodes) {
			t.Fatalf("%s long must have more nodes than short (%d vs %d)", d.ID, len(long.Nodes), len(short.Nodes))
		}
		if short.LootMult >= long.LootMult {
			t.Fatalf("%s short lootMult must be < long", d.ID)
		}
		if short.ChestTier >= long.ChestTier {
			t.Fatalf("%s short chestTier must be < long", d.ID)
		}
		// Short ends *_boss; long ends *_boss_long (tougher HP).
		sb := short.Nodes[len(short.Nodes)-1]
		lb := long.Nodes[len(long.Nodes)-1]
		if !strings.HasSuffix(sb, "_boss") || strings.HasSuffix(sb, "_boss_long") {
			t.Fatalf("%s short boss=%s want *_boss", d.ID, sb)
		}
		if !strings.HasSuffix(lb, "_boss_long") {
			t.Fatalf("%s long boss=%s want *_boss_long", d.ID, lb)
		}
	}
	for id := range wantIDs {
		if !seen[id] {
			t.Fatalf("missing dungeon %s", id)
		}
	}
}

func TestDungeonCoop_StagesExist(t *testing.T) {
	doc := loadDungeonCoop(t)
	cat := mythmirCatalog(t)
	for _, d := range doc.Dungeons {
		for pathName, path := range d.Paths {
			for _, sid := range path.Nodes {
				st, ok := cat.Stages[sid]
				if !ok {
					t.Fatalf("%s/%s missing stage %s", d.ID, pathName, sid)
				}
				if len(st.EnemyTeam) != 3 {
					t.Fatalf("%s enemies=%d want 3v3", sid, len(st.EnemyTeam))
				}
			}
		}
	}
}

func TestDungeonCoop_ShortPath_StartersClear(t *testing.T) {
	doc := loadDungeonCoop(t)
	cat := mythmirCatalog(t)
	seed := int64(20261122)
	for _, d := range doc.Dungeons {
		short := d.Paths["short"]
		for i, sid := range short.Nodes {
			b, err := mode.CreatePvE(cat, "dungeon_"+sid, sid, seed+int64(i), startersTeam, nil, []bool{true, true, true})
			if err != nil {
				t.Fatalf("%s create: %v", sid, err)
			}
			if err := b.AutoPlay(160); err != nil {
				t.Fatalf("%s auto: %v", sid, err)
			}
			if b.Result != sim.ResultP1Win {
				t.Fatalf("%s result=%s turn=%d want p1_win", sid, b.Result, b.Turn)
			}
		}
	}
}

func TestDungeonCoop_RareOnlyOnBossContract(t *testing.T) {
	doc := loadDungeonCoop(t)
	for _, d := range doc.Dungeons {
		for pathName, path := range d.Paths {
			boss := path.Nodes[len(path.Nodes)-1]
			if boss == "" || len(d.RareItems) == 0 {
				t.Fatalf("%s/%s invalid boss/rare contract", d.ID, pathName)
			}
			// Mid nodes must not equal a rare item id (sanity: rares are item ids, not stages).
			for _, sid := range path.Nodes[:len(path.Nodes)-1] {
				for _, r := range d.RareItems {
					if sid == r.ID {
						t.Fatalf("rare id leaked as mid stage: %s", sid)
					}
				}
			}
		}
	}
}
