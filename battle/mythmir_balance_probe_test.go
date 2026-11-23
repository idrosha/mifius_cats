package battle_test

import (
	"bytes"
	"fmt"
	"os"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/mode"
)

var probeTeams = map[string][]string{
	"REF": {"starter_tank_stone", "starter_fighter_fire", "starter_support_water"},
	"A_mono3": {
		"starter_fighter_fire",
		"starter_fighter_fire",
		"starter_fighter_fire",
	},
	"B_no_tank": {
		"starter_fighter_fire",
		"starter_fighter_fire",
		"starter_support_water",
	},
	"C_no_heal": {
		"starter_tank_stone",
		"starter_fighter_fire",
		"starter_fighter_fire",
	},
}

// Probe-only balance matrix — run: go test ./battle/... -run TestProbeMythmirBalanceMatrix -count=1 -v
func TestProbeMythmirBalanceMatrix(t *testing.T) {
	if os.Getenv("MYTHMIR_PROBE") != "1" {
		t.Skip("set MYTHMIR_PROBE=1 to emit balance matrix")
	}
	cat := mythmirCatalog(t)
	var buf bytes.Buffer
	fmt.Fprintf(&buf, "\n=== Mythmir AutoPlay matrix (seed=20261118+ch*10+f) ===\n")
	probeOrder := []string{"REF", "A_mono3", "B_no_tank", "C_no_heal"}
	fmt.Fprintf(&buf, "%-14s", "stage")
	for _, team := range probeOrder {
		fmt.Fprintf(&buf, " %-22s", team)
	}
	buf.WriteString("\n")
	for ch := 1; ch <= 5; ch++ {
		for f := 1; f <= 3; f++ {
			id := fmt.Sprintf("mythmir_%d_f%d", ch, f)
			fmt.Fprintf(&buf, "%-14s", id)
			for _, teamKey := range []string{"REF", "A_mono3", "B_no_tank", "C_no_heal"} {
				team := probeTeams[teamKey]
				seed := int64(20261118 + ch*10 + f)
				b, err := mode.CreatePvE(cat, "probe_"+id+"_"+teamKey, id, seed, team, nil, []bool{true, true, true}, nil)
				if err != nil {
					fmt.Fprintf(&buf, " %-22s", "create_err")
					continue
				}
				apErr := b.AutoPlay(160)
				res := string(b.Result)
				if apErr != nil {
					res = "timeout"
				} else if res == "" {
					res = "timeout"
				}
				fmt.Fprintf(&buf, " %-22s", fmt.Sprintf("%s@%d", res, b.Turn))
			}
			buf.WriteString("\n")
		}
	}
	t.Log(buf.String())
}