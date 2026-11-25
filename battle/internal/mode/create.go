package mode

import (
	"fmt"
	"strings"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

// CreatePvE — FULL-SPEC §8.2. Economy (bowl spend) is outside battle-core; here only stage+team+seed.
// carryAlive (D-039 / §4.1): optional len=3; false = that lane stays dead across Mythmir chapter levels.
// Living lanes always spawn at MaxHP (wave HP restore). nil / empty = all alive.
// teamGear: optional len=3 player armor/weapon bonuses. Enemy HP is never scaled from gear —
// dungeon/raid difficulty comes from player DEF/HP/weapon ATK against a fixed stage baseline.
func CreatePvE(cat *content.Catalog, battleID, stageID string, seed int64, teamTemplateIDs []string, potions []string, carryAlive []bool, teamGear []sim.GearBonus) (*sim.Battle, error) {
	stage, ok := cat.Stages[stageID]
	if !ok {
		return nil, fmt.Errorf("unknown stage %s", stageID)
	}
	if len(teamTemplateIDs) != 3 {
		return nil, fmt.Errorf("CreatePvE team must be 3")
	}
	if carryAlive != nil && len(carryAlive) != 3 {
		return nil, fmt.Errorf("CreatePvE carryAlive must be len 3 or empty")
	}
	if teamGear != nil && len(teamGear) != 3 {
		return nil, fmt.Errorf("CreatePvE teamGear must be len 3 or empty")
	}
	p1, err := spawnStarters(cat, teamTemplateIDs, "p1", carryAlive, teamGear)
	if err != nil {
		return nil, err
	}
	aliveN := 0
	for _, u := range p1 {
		if u.CarryAlive == nil || *u.CarryAlive {
			aliveN++
		}
	}
	if aliveN == 0 {
		return nil, fmt.Errorf("CreatePvE: no living heroes for chapter wave (D-039)")
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
// teamGear1/teamGear2: optional PvP-lane armor/weapons (shop gear). Same length rules as CreatePvE.
// humanP2: live MM duel — P2 is human; scripted AdvancePvEBots skipped (D-058). turnTimerSec>0 arms per-turn deadline.
func CreatePvP(cat *content.Catalog, battleID, matchID string, seed int64, team1, team2 []string, potions1, potions2 []string, teamGear1, teamGear2 []sim.GearBonus, humanP2 bool, turnTimerSec int) (*sim.Battle, error) {
	if len(team1) != 3 || len(team2) != 3 {
		return nil, fmt.Errorf("CreatePvP teams must be 3v3")
	}
	if teamGear1 != nil && len(teamGear1) != 3 {
		return nil, fmt.Errorf("CreatePvP teamGear1 must be len 3 or empty")
	}
	if teamGear2 != nil && len(teamGear2) != 3 {
		return nil, fmt.Errorf("CreatePvP teamGear2 must be len 3 or empty")
	}
	p1, err := spawnStarters(cat, team1, "p1", nil, teamGear1)
	if err != nil {
		return nil, err
	}
	p2, err := spawnStarters(cat, team2, "p2", nil, teamGear2)
	if err != nil {
		return nil, err
	}
	return sim.NewBattle(sim.CreateParams{
		BattleID:     battleID,
		Mode:         sim.ModePvP,
		Seed:         seed,
		MatchID:      matchID,
		P1Team:       p1,
		P2Team:       p2,
		PotionsP1:    potions1,
		PotionsP2:    potions2,
		P2Human:      humanP2,
		TurnTimerSec: turnTimerSec,
	})
}

func spawnStarters(cat *content.Catalog, ids []string, prefix string, carryAlive []bool, teamGear []sim.GearBonus) ([]sim.SpawnUnit, error) {
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
		su := sim.SpawnUnit{
			ID:       fmt.Sprintf("%s_%d_%s", prefix, i, id),
			Template: t,
			Deck:     deck,
			Parts:    parts,
		}
		if teamGear != nil {
			su.Gear = teamGear[i]
		}
		if carryAlive != nil {
			alive := carryAlive[i]
			su.CarryAlive = &alive
		}
		out = append(out, su)
	}
	return out, nil
}

func spawnStageEnemies(stage content.StageDef) ([]sim.SpawnUnit, error) {
	if len(stage.EnemyTeam) != 3 {
		return nil, fmt.Errorf("stage %s enemyTeam must be 3", stage.StageID)
	}
	out := make([]sim.SpawnUnit, 0, 3)
	for i, t := range stage.EnemyTeam {
		if n := len(t.Deck); n < 4 || n > 6 {
			return nil, fmt.Errorf("enemy %s deck must be 4–6, got %d", t.TemplateID, n)
		}
		su := sim.SpawnUnit{
			ID:       fmt.Sprintf("bot_%d_%s", i, t.TemplateID),
			Template: t,
			Deck:     t.Deck,
			Parts:    nil,
		}
		// D-042/D-051: empty_lane placeholders keep 3v3 slots but spawn dead (solo boss front).
		if strings.Contains(t.TemplateID, "empty_lane") {
			dead := false
			su.CarryAlive = &dead
		}
		out = append(out, su)
	}
	return out, nil
}
