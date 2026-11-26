package battle_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

// 12-hero legion composition: 3 Tanks, 6 DPS (fighters/rangers/mages/assassins), 3 Supports.
// Arranged into 4 squads of 3 cats (4×3) for co-op dungeons & 12-hero raids.
var legion12Squads = [][]string{
	{"shop_tank_fire", "shop_fighter_fire", "shop_support_fire"},
	{"shop_tank_water", "shop_fighter_water", "shop_support_water"},
	{"shop_tank_wind", "shop_ranger_wind", "shop_support_wind"},
	{"shop_ranger_fire", "shop_mage_water", "shop_assassin_fire"},
}

type raidCatalog struct {
	Raids []struct {
		RaidID string `json:"raidId"`
		Paths  map[string]struct {
			Nodes []string `json:"nodes"`
		} `json:"paths"`
	} `json:"raids"`
}

func TestDungeonsAndRaids_12HeroParty_3Tank_6DPS_3Support(t *testing.T) {
	cat := mythmirCatalog(t)
	dungeons := loadDungeonCoop(t)

	// Verify exact 12-hero role split: 3 tank, 6 dps, 3 support.
	tanks, dps, supports := 0, 0, 0
	for _, sq := range legion12Squads {
		for _, tid := range sq {
			c, ok := cat.Cats[tid]
			if !ok {
				t.Fatalf("missing cat template %s", tid)
			}
			switch c.Role {
			case "tank":
				tanks++
			case "support":
				supports++
			default:
				dps++
			}
		}
	}
	if tanks != 3 || dps != 6 || supports != 3 {
		t.Fatalf("party roles got %dT/%dDPS/%dS want 3T/6DPS/3S", tanks, dps, supports)
	}

	seed := int64(20261126)

	// 1. All 3 dungeons (short + long paths)
	for _, d := range dungeons.Dungeons {
		for pathName, p := range d.Paths {
			for i, sid := range p.Nodes {
				squad := legion12Squads[i%len(legion12Squads)]
				b, err := mode.CreatePvE(cat, "d12_"+d.ID+"_"+pathName+"_"+sid, sid, seed+int64(i), squad, nil, []bool{true, true, true}, nil)
				if err != nil {
					t.Fatalf("dungeon %s/%s/%s create: %v", d.ID, pathName, sid, err)
				}
				if err := b.AutoPlay(200); err != nil {
					t.Fatalf("dungeon %s/%s/%s auto: %v", d.ID, pathName, sid, err)
				}
				if b.Result != sim.ResultP1Win {
					t.Fatalf("dungeon %s/%s/%s result=%s turn=%d want p1_win", d.ID, pathName, sid, b.Result, b.Turn)
				}
			}
		}
	}

	// 2. All 3 raids (short + long paths)
	raw, err := os.ReadFile(filepath.Join(contentRoot(t), "campaign", "raids_sl.json"))
	if err != nil {
		t.Fatal(err)
	}
	var raids raidCatalog
	if err := json.Unmarshal(raw, &raids); err != nil {
		t.Fatal(err)
	}
	for _, r := range raids.Raids {
		for pathName, p := range r.Paths {
			for i, sid := range p.Nodes {
				cleared := false
				for sqIdx, squad := range legion12Squads {
					b, err := mode.CreatePvE(cat, "r12_"+r.RaidID+"_"+pathName+"_"+sid, sid, seed+int64(i*10+sqIdx), squad, nil, []bool{true, true, true}, nil)
					if err != nil {
						t.Fatalf("raid %s/%s/%s create: %v", r.RaidID, pathName, sid, err)
					}
					if err := b.AutoPlay(240); err != nil {
						t.Fatalf("raid %s/%s/%s auto: %v", r.RaidID, pathName, sid, err)
					}
					if b.Result == sim.ResultP1Win {
						cleared = true
						break
					}
				}
				if !cleared {
					t.Fatalf("raid %s/%s/%s not cleared by 12-hero legion", r.RaidID, pathName, sid)
				}
			}
		}
	}
}
