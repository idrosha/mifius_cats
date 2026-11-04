package sim

// Energy/draw table — FULL-SPEC §3.3.
// Turn | First | Second
// 1    | E1 D3 | E2 D4
// 2–3  | E2 D4 | E3 D4
// 4+   | E3 D5 | E3 D5

func energyDrawFor(turn int, firstActor bool) (energy, draw int) {
	switch {
	case turn <= 1:
		if firstActor {
			return 1, 3
		}
		return 2, 4
	case turn <= 3:
		if firstActor {
			return 2, 4
		}
		return 3, 4
	default:
		return 3, 5
	}
}
