//go:build ignore

// Restore soldier f1/f2 to gen_mythmir_stages.py numbers (REF-clearable).
// Run: go run -p 1 scripts/retune_mythmir_chess.go
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type unitTune struct {
	HP         int
	Atks       []int // per attack card in deck order; empty = leave
	Heals      []int // per heal op in deck order
	Shields    []int // per shield card in deck order
}

func main() {
	root := "content/stages"
	plan := map[string][3]unitTune{
		"mythmir_1_f1": {
			{HP: 28, Atks: []int{5, 5, 6, 5}},
			{HP: 28, Atks: []int{5, 5, 6, 5}},
			{HP: 28, Atks: []int{5, 5, 6, 5}},
		},
		"mythmir_1_f2": {
			{HP: 36, Shields: []int{7, 6}, Atks: []int{4, 4}},
			{HP: 26, Atks: []int{5, 5, 6, 5}},
			{HP: 26, Atks: []int{5, 5, 6, 5}},
		},
		"mythmir_2_f1": {
			{HP: 40, Atks: []int{7, 7, 8, 8}},
			{HP: 34, Heals: []int{9, 9, 9, 9}},
			{HP: 36, Atks: []int{8, 8, 9, 8}},
		},
		"mythmir_2_f2": {
			{HP: 29, Atks: []int{6, 6, 7, 6}},
			{HP: 29, Atks: []int{6, 6, 7, 6}},
			{HP: 29, Atks: []int{6, 6, 7, 6}},
		},
		"mythmir_3_f1": {
			{HP: 40, Atks: []int{6, 6, 7, 6}},
			{HP: 46, Shields: []int{8, 7}, Atks: []int{5, 5}},
			{HP: 40, Atks: []int{6, 6, 7, 6}},
		},
		"mythmir_3_f2": {
			{HP: 46, Atks: []int{8, 8, 9, 9}},
			{HP: 54, Shields: []int{8, 7}, Atks: []int{5, 5}},
			{HP: 46, Atks: []int{8, 8, 9, 9}},
		},
		"mythmir_4_f1": {
			{HP: 26, Atks: []int{5, 5, 6, 5}},
			{HP: 24, Atks: []int{6, 6, 7, 6}},
			{HP: 26, Atks: []int{5, 5, 6, 5}},
		},
		"mythmir_4_f2": {
			{HP: 27, Atks: []int{6, 6, 7, 6}},
			{HP: 25, Atks: []int{6, 6, 7, 6}},
			{HP: 27, Atks: []int{6, 6, 7, 6}},
		},
		"mythmir_5_f1": {
			{HP: 52, Shields: []int{7, 6}, Atks: []int{5, 5}},
			{HP: 46, Atks: []int{7, 7, 8, 7}},
			{HP: 36, Heals: []int{7, 7, 7, 7}},
		},
		"mythmir_5_f2": {
			{HP: 44, Atks: []int{7, 7, 8, 7}},
			{HP: 34, Heals: []int{7, 7, 7, 7}},
			{HP: 44, Atks: []int{7, 7, 8, 7}},
		},
	}

	for id, lanes := range plan {
		path := filepath.Join(root, id+".json")
		raw, err := os.ReadFile(path)
		if err != nil {
			panic(err)
		}
		var doc map[string]any
		if err := json.Unmarshal(raw, &doc); err != nil {
			panic(err)
		}
		team, _ := doc["enemyTeam"].([]any)
		for i, uAny := range team {
			u, _ := uAny.(map[string]any)
			meta, _ := u["meta"].(map[string]any)
			if meta != nil {
				if pit, _ := meta["isPitboss"].(bool); pit {
					continue
				}
				if empty, _ := meta["emptyLane"].(bool); empty {
					continue
				}
			}
			t := lanes[i]
			stats, _ := u["baseStats"].(map[string]any)
			if stats != nil && t.HP > 0 {
				stats["hp"] = t.HP
			}
			deck, _ := u["deck"].([]any)
			ai, si, hi := 0, 0, 0
			for _, cAny := range deck {
				c, _ := cAny.(map[string]any)
				if asInt(c["atk"]) > 0 && ai < len(t.Atks) {
					c["atk"] = t.Atks[ai]
					ai++
				}
				if asInt(c["shield"]) > 0 && si < len(t.Shields) {
					c["shield"] = t.Shields[si]
					si++
				}
				ops, _ := c["effectOps"].([]any)
				for _, opAny := range ops {
					op, _ := opAny.(map[string]any)
					if op["op"] == "heal" && hi < len(t.Heals) {
						op["amount"] = t.Heals[hi]
						hi++
					}
				}
			}
		}
		out, err := json.MarshalIndent(doc, "", "  ")
		if err != nil {
			panic(err)
		}
		out = append(out, '\n')
		if err := os.WriteFile(path, out, 0o644); err != nil {
			panic(err)
		}
		fmt.Println("restored", id)
	}
}

func asInt(v any) int {
	switch x := v.(type) {
	case float64:
		return int(x)
	case int:
		return x
	default:
		return 0
	}
}
