package sim

import "testing"

func TestArmorDef_MitigatesHit(t *testing.T) {
	b := &Battle{}
	target := &Unit{Alive: true, HP: 50, MaxHP: 50, Def: 6}
	hpLost, _, _ := b.applyDamage(nil, target, 6, false)
	// Def/2 = 3 → 6-3 = 3
	if hpLost != 3 {
		t.Fatalf("hpLost=%d want 3 (def/2 mitigation)", hpLost)
	}
	pierceTarget := &Unit{Alive: true, HP: 50, MaxHP: 50, Def: 6}
	hpPierce, _, _ := b.applyDamage(nil, pierceTarget, 6, true)
	if hpPierce != 6 {
		t.Fatalf("pierce should ignore def: hpLost=%d want 6", hpPierce)
	}
}
