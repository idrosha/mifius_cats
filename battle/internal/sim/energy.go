package sim

// Energy/draw table — FULL-SPEC §3.3.
// Turn | First | Second
// 1    | E1 D2 | E2 D2
// 2–3  | E2 D2 | E3 D2
// 4+   | E3 D2 | E3 D2
// D is per-unit; team hand ≈ 3×D2 = 6 (before Keep / BonusDraw).

func energyDrawFor(turn int, firstActor bool) (energy, draw int) {
	draw = 2
	switch {
	case turn <= 1:
		if firstActor {
			return 1, draw
		}
		return 2, draw
	case turn <= 3:
		if firstActor {
			return 2, draw
		}
		return 3, draw
	default:
		return 3, draw
	}
}
