package sim

// Deterministic xorshift64* seeded from battleSeed.

type RNG struct {
	state uint64
}

func NewRNG(seed int64) *RNG {
	s := uint64(seed)
	if s == 0 {
		s = 0x9E3779B97F4A7C15
	}
	return &RNG{state: s}
}

func (r *RNG) Uint64() uint64 {
	x := r.state
	x ^= x >> 12
	x ^= x << 25
	x ^= x >> 27
	r.state = x
	return x * 0x2545F4914F6CDD1D
}

func (r *RNG) Intn(n int) int {
	if n <= 0 {
		return 0
	}
	return int(r.Uint64() % uint64(n))
}

func (r *RNG) Shuffle(n int, swap func(i, j int)) {
	for i := n - 1; i > 0; i-- {
		j := r.Intn(i + 1)
		swap(i, j)
	}
}

// ChancePercent returns true with p% probability (0..100), deterministic.
func (r *RNG) ChancePercent(p int) bool {
	if p <= 0 {
		return false
	}
	if p >= 100 {
		return true
	}
	return r.Intn(100) < p
}
