package battle_test

import (
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

func TestPvE_EnemyHPUnchangedByPlayerGear(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	bare, err := mode.CreatePvE(cat, "bare", "practice_dummy_1", 7, team, nil, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	geared, err := mode.CreatePvE(cat, "gear", "practice_dummy_1", 7, team, nil, nil, []sim.GearBonus{
		{HP: 8, Atk: 2, Def: 6, Spd: 0},
		{HP: 8, Atk: 4, Def: 6, Spd: 0},
		{HP: 8, Atk: 2, Def: 6, Spd: 0},
	})
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 3; i++ {
		bU := bare.Units[3+i]
		gU := geared.Units[3+i]
		if bU.MaxHP != gU.MaxHP || bU.HP != gU.HP {
			t.Fatalf("enemy lane %d HP changed with gear: bare=%d/%d geared=%d/%d", i, bU.HP, bU.MaxHP, gU.HP, gU.MaxHP)
		}
	}
	tank := geared.Units[0]
	if tank.Def != 6 || tank.GearAtk != 2 || tank.MaxHP < 50+8 {
		t.Fatalf("tank gear not applied: def=%d gearAtk=%d maxHP=%d", tank.Def, tank.GearAtk, tank.MaxHP)
	}
}
