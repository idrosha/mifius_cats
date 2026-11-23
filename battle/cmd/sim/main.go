package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
)

func main() {
	seed := flag.Int64("seed", 20261104, "battleSeed")
	stage := flag.String("stage", "test_yard_1", "stageId")
	contentDir := flag.String("content", "", "path to content/")
	flag.Parse()

	root := *contentDir
	if root == "" {
		wd, _ := os.Getwd()
		root = filepath.Join(wd, "content")
		if _, err := os.Stat(root); err != nil {
			root = filepath.Join(wd, "..", "content")
		}
	}
	cat, err := content.LoadCatalog(root)
	if err != nil {
		fmt.Fprintf(os.Stderr, "content: %v\n", err)
		os.Exit(1)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvE(cat, "cli", *stage, *seed, team, nil, nil, nil)
	if err != nil {
		fmt.Fprintf(os.Stderr, "CreatePvE: %v\n", err)
		os.Exit(1)
	}
	if err := b.AutoPlay(40); err != nil {
		fmt.Fprintf(os.Stderr, "auto: %v\n", err)
		os.Exit(1)
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	_ = enc.Encode(map[string]any{
		"battleId": b.ID,
		"mode":     b.Mode,
		"seed":     b.Seed,
		"stageId":  b.StageID,
		"result":   b.Result,
		"turn":     b.Turn,
		"frames":   len(b.Frames),
	})
}
