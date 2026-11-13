package sim

// Energy/draw table — FULL-SPEC §3.3.
// Turn | First | Second
// 1    | E1 D* | E2 D*
// 2–3  | E2 D* | E3 D*
// 4+   | E3 D* | E3 D*
// D* is per living unit; scales with living allies on that side at turn start:
// 3 alive → D2 (team hand 6), 2 → D3 (hand 6), 1 → D4 (hand 4).

func energyDrawFor(turn int, firstActor bool) (energy, draw int) {
	draw = 2 // baseline when 3 alive; callers replace via drawPerLiving
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

// DrawPerLiving — §3.3 dynamic D by living allies on the acting side.
func DrawPerLiving(alive int) int {
	switch {
	case alive <= 0:
		return 0
	case alive == 1:
		return 4
	case alive == 2:
		return 3
	default:
		return 2
	}
}
