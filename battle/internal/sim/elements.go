package sim

// Element modifiers — FULL-SPEC §2.2 (+15% / −15%). Kinship +10% when card element == unit element.

var elementStrong = map[string][]string{
	"fire":  {"grass", "ice", "wind"},
	"water": {"fire", "stone"},
	"grass": {"water", "stone"},
	"bolt":  {"water", "ice"},
	"stone": {"bolt", "fire"},
	"ice":   {"grass", "stone"},
	// Elven triad (attack-cards-elven-18x6): fire > wind > water > fire
	"wind": {"water"},
}

var elementWeak = map[string][]string{
	"fire":  {"water", "stone"},
	"water": {"grass", "bolt", "wind"},
	"grass": {"fire", "ice"},
	"bolt":  {"stone", "grass"},
	"stone": {"water", "grass"},
	"ice":   {"fire", "bolt"},
	"wind":  {"fire"},
}

func contains(xs []string, v string) bool {
	for _, x := range xs {
		if x == v {
			return true
		}
	}
	return false
}

// DamageMul returns atk/shield multiplier for card element vs target element, plus kinship.
func DamageMul(cardElement, unitElement, targetElement string) float64 {
	mul := 1.0
	if contains(elementStrong[cardElement], targetElement) {
		mul *= 1.15
	}
	if contains(elementWeak[cardElement], targetElement) {
		mul *= 0.85
	}
	if cardElement != "" && cardElement == unitElement {
		mul *= 1.10 // kinship §2.2
	}
	return mul
}
