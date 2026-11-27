package economy

import (
	"errors"
	"fmt"
	"math"
	"strings"
	"time"
)

// MVP Beta rules — FULL-SPEC §1.1, §5 / D-066.
const (
	MaxCatRank          = 8 // R1–R8; no separate account-level XP track
	CatRankXPPerStep    = 100
	DefaultSeasonMMR    = 1200
	DefaultSeasonDays   = 28
	MinParticipationWin = 5
)

var (
	ErrShopGachaDisabled    = errors.New("economy: shop gacha disabled in mvp_beta (D-066)")
	ErrPassFinaleClaimed    = errors.New("economy: pass finale cat already claimed for season")
	ErrEmptyPassFinalePool  = errors.New("economy: pass finale cat pool is empty")
	ErrInvalidEmail         = errors.New("economy: invalid email")
	ErrCatNotFound          = errors.New("economy: cat not found")
	ErrQuestNotReady        = errors.New("economy: daily quest target not met")
	ErrQuestAlreadyClaimed  = errors.New("economy: daily quest already claimed")
)

// DailyQuestDef — LiveOps daily quest template (separate from bowls/tickets, D-066).
type DailyQuestDef struct {
	QuestID      string
	Kind         string
	Target       int
	RewardFish   int
	RewardPassXP int
}

// DailyQuestProgress — per-player UTC-daily progress.
type DailyQuestProgress struct {
	Progress int
	Claimed  bool
}

// LinkEmail binds an email for cross-client sync (TG / Web / Android / iOS, D-066).
func LinkEmail(p *Player, email string) error {
	if p == nil {
		return ErrNilPlayer
	}
	e := strings.ToLower(strings.TrimSpace(email))
	at := strings.IndexByte(e, '@')
	if at <= 0 || at >= len(e)-3 || !strings.Contains(e[at+1:], ".") || strings.ContainsAny(e, " \t\r\n") {
		return ErrInvalidEmail
	}
	p.LinkedEmail = e
	return nil
}

// AddCatRankXP grants rank XP to a single cat (R1–R8 cap; ×2 when pass ACTIVE, D-066).
// No account-level XP track exists.
func AddCatRankXP(p *Player, catID string, baseXP int, now time.Time) (int, error) {
	if p == nil {
		return 0, ErrNilPlayer
	}
	if baseXP <= 0 {
		return 0, nil
	}
	for i := range p.Cats {
		if p.Cats[i].CatID != catID {
			continue
		}
		if p.Cats[i].Level < 1 {
			p.Cats[i].Level = 1
		}
		earned := baseXP
		if p.PassActive(now) {
			earned *= 2
		}
		p.Cats[i].XP += earned
		for p.Cats[i].Level < MaxCatRank && p.Cats[i].XP >= p.Cats[i].Level*CatRankXPPerStep {
			p.Cats[i].XP -= p.Cats[i].Level * CatRankXPPerStep
			p.Cats[i].Level++
		}
		if p.Cats[i].Level >= MaxCatRank {
			p.Cats[i].Level = MaxCatRank
			p.Cats[i].XP = 0
		}
		return earned, nil
	}
	return 0, ErrCatNotFound
}

// ClaimPassFinaleCat awards 1 random cat via server RNG on Battle Pass completion (D-066).
// Explicitly not a shop gacha_jar; idempotent per season.
func ClaimPassFinaleCat(
	p *Player,
	seasonID string,
	pool []CatInstance,
	roll func(n int) int,
) (CatInstance, error) {
	if p == nil {
		return CatInstance{}, ErrNilPlayer
	}
	if seasonID == "" {
		seasonID = "mvp_beta_s1"
	}
	if p.PassFinaleClaimedSeason == seasonID {
		return CatInstance{}, ErrPassFinaleClaimed
	}
	if len(pool) == 0 {
		return CatInstance{}, ErrEmptyPassFinalePool
	}
	idx := 0
	if roll != nil && len(pool) > 1 {
		idx = roll(len(pool))
		if idx < 0 {
			idx = -idx
		}
		idx = idx % len(pool)
	}
	picked := pool[idx]
	picked.CatID = fmt.Sprintf("%s_pass_%s_%d", p.UserID, seasonID, len(p.Cats)+1)
	if picked.Level < 1 {
		picked.Level = 1
	}
	picked.Origin = "pass_finale"
	p.Cats = append(p.Cats, picked)
	p.PassFinaleClaimedSeason = seasonID
	return picked, nil
}

// EnsureDailyQuests resets player daily quest progress on a new UTC day (D-066).
func EnsureDailyQuests(p *Player, now time.Time) {
	if p == nil {
		return
	}
	day := now.UTC().Format(utcDateLayout)
	if p.DailyQuestUTCDate != day || p.DailyQuests == nil {
		p.DailyQuestUTCDate = day
		p.DailyQuests = map[string]*DailyQuestProgress{}
	}
}

// AdvanceDailyQuest increments progress for quests matching kind on the current UTC day.
func AdvanceDailyQuest(p *Player, now time.Time, defs []DailyQuestDef, kind string, delta int) {
	if p == nil || delta <= 0 {
		return
	}
	EnsureDailyQuests(p, now)
	for _, d := range defs {
		if d.Kind != kind && d.Kind != "any_battle" {
			continue
		}
		st, ok := p.DailyQuests[d.QuestID]
		if !ok {
			st = &DailyQuestProgress{}
			p.DailyQuests[d.QuestID] = st
		}
		if st.Claimed {
			continue
		}
		st.Progress += delta
		if st.Progress > d.Target {
			st.Progress = d.Target
		}
	}
}

// ClaimDailyQuest grants fish (MIFOUS) server-side once target is met.
func ClaimDailyQuest(p *Player, now time.Time, def DailyQuestDef) (fish int, passXP int, err error) {
	if p == nil {
		return 0, 0, ErrNilPlayer
	}
	EnsureDailyQuests(p, now)
	st, ok := p.DailyQuests[def.QuestID]
	if !ok || st.Progress < def.Target {
		return 0, 0, ErrQuestNotReady
	}
	if st.Claimed {
		return 0, 0, ErrQuestAlreadyClaimed
	}
	st.Claimed = true
	if def.RewardFish > 0 {
		_ = Grant(p, def.RewardFish, 0, 0, 0)
	}
	return def.RewardFish, def.RewardPassXP, nil
}

// SoftDecayMMR pulls MMR softly toward baseline between ~28d seasons (D-066).
func SoftDecayMMR(mmr, baseline int, factor float64) int {
	if baseline <= 0 {
		baseline = DefaultSeasonMMR
	}
	if factor < 0 {
		factor = 0
	}
	if factor > 1 {
		factor = 1
	}
	diff := float64(mmr - baseline)
	return baseline + int(math.Round(diff*(1.0-factor)))
}

// SeasonPrizeTier maps final season rank & ranked wins to the LiveOps prize tier (D-066).
func SeasonPrizeTier(rank, rankedWins int) string {
	switch {
	case rank == 1:
		return "top_1"
	case rank >= 2 && rank <= 10:
		return "top_2_10"
	case rank >= 11 && rank <= 100:
		return "top_11_100"
	case rank >= 101 && rank <= 1000:
		return "top_101_1000"
	case rankedWins >= MinParticipationWin:
		return "participation"
	default:
		return "none"
	}
}
