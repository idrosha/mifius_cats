package mode

import (
	"fmt"

	"github.com/idrosha/mifius_cats/battle/internal/content"
	"github.com/idrosha/mifius_cats/battle/internal/sim"
)

// CreatePvE — FULL-SPEC §8.2. Economy (bowl spend) is outside battle-core; here only stage+team+seed.
func CreatePvE(cat *content.Catalog, battleID, stageID string, seed int64, teamTemplateIDs []string, potions []string) (*sim.Battle, error) {
	stage, ok := cat.Stages[stageID]
	if !ok {
		return nil, fmt.Errorf("unknown stage %s", stageID)
	}
	if len(teamTemplateIDs) != 3 {
		return nil, fmt.Errorf("CreatePvE team must be 3")
	}
	p1, err := spawnStarters(cat, teamTemplateIDs, "p1")
	if err != nil {
		return nil, err
	}
	p2, err := spawnStageEnemies(stage)
	if err != nil {
		return nil, err
	}
	return sim.NewBattle(sim.CreateParams{
		BattleID:  battleID,
		Mode:      sim.ModePvE,
		Seed:      seed,
		StageID:   stageID,
		P1Team:    p1,
		P2Team:    p2,
		PotionsP1: potions,
	})
}

// CreatePvP — FULL-SPEC §8.2. Same combat core as PvE; both sides human-driven (no AI injection).
func CreatePvP(cat *content.Catalog, battleID, matchID string, seed int64, team1, team2 []string, potions1, potions2 []string) (*sim.Battle, error) {
	if len(team1) != 3 || len(team2) != 3 {
		return nil, fmt.Errorf("CreatePvP teams must be 3v3")
	}
	p1, err := spawnStarters(cat, team1, "p1")
	if err != nil {
		return nil, err
	}
	p2, err := spawnStarters(cat, team2, "p2")
	if err != nil {
		return nil, err
	}
	return sim.NewBattle(sim.CreateParams{
		BattleID:  battleID,
		Mode:      sim.ModePvP,
		Seed:      seed,
		MatchID:   matchID,
		P1Team:    p1,
		P2Team:    p2,
		PotionsP1: potions1,
		PotionsP2: potions2,
	})
}

func spawnStarters(cat *content.Catalog, ids []string, prefix string) ([]sim.SpawnUnit, error) {
	out := make([]sim.SpawnUnit, 0, 3)
	for i, id := range ids {
		t, ok := cat.Starters[id]
		if !ok {
			return nil, fmt.Errorf("unknown template %s", id)
		}
		deck, err := cat.DeckForStarter(id)
		if err != nil {
			return nil, err
		}
		parts := map[string]content.PartDef{}
		for slot, pid := range t.Parts {
			parts[slot] = cat.Parts[pid]
		}
		out = append(out, sim.SpawnUnit{
			ID:       fmt.Sprintf("%s_%d_%s", prefix, i, id),
			Template: t,
			Deck:     deck,
			Parts:    parts,
		})
	}
	return out, nil
}

func spawnStageEnemies(stage content.StageDef) ([]sim.SpawnUnit, error) {
	if len(stage.EnemyTeam) != 3 {
		return nil, fmt.Errorf("stage %s enemyTeam must be 3", stage.StageID)
	}
	out := make([]sim.SpawnUnit, 0, 3)
	for i, t := range stage.EnemyTeam {
		if len(t.Deck) != 4 {
			return nil, fmt.Errorf("enemy %s deck must be 4", t.TemplateID)
		}
		out = append(out, sim.SpawnUnit{
			ID:       fmt.Sprintf("bot_%d_%s", i, t.TemplateID),
			Template: t,
			Deck:     t.Deck,
			Parts:    nil,
		})
	}
	return out, nil
}
