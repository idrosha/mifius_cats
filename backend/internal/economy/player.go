package economy

import "time"

// Player — FULL-SPEC §7.5.
type Player struct {
	UserID          string
	Fish            int
	Yarn            int
	Scrap           int
	Medals          int
	Bowls           int
	PvPTickets      int
	PassActiveUntil time.Time // zero → pass inactive
	Cats            []CatInstance
	Presets         [5]Preset
	Potions         []PotionStack
	PendingAdsCap   int

	// LastRefillUTCDate — последний UTC-день рефилла ("2006-01-02"). Не в §7.5 списке,
	// но нужен для §8.3 daily refill без выдуманной TZ-логики (§16: UTC).
	LastRefillUTCDate string

	// MVP Beta (D-066 / §1.1): флаг билда, email-линк, финал пасса, дейлики и сезон.
	MVPBeta                 bool
	LinkedEmail             string
	PassFinaleClaimedSeason string
	DailyQuestUTCDate       string
	DailyQuests             map[string]*DailyQuestProgress
	RankedMMR               int
	RankedWins              int
	SeasonID                string

	// Кооп-данжи (docs/dungeons-coop-3.md) — server SoT stub; HUD may mirror.
	DungeonKeys        map[string]int  // dungeonId → keys
	DungeonKeysSeeded  bool
	DungeonFirstClear  map[string]bool
	DungeonRares       []string
	DungeonMats        map[string]int
	DungeonRuns        int
}

// CatInstance — FULL-SPEC §7.1 (хранилище; сборка боя — вне этого пакета).
type CatInstance struct {
	CatID      string
	TemplateID string
	Role       string
	Element    string
	Level      int
	XP         int
	Parts      map[string]string // eyes,ears,muzzle,headwear,back,tail → partId
	PendantID  string
	BowByPart  map[string]string
	Rarity     string
	Origin     string // starter|jar|workshop|nursery
}

// Preset — слот пресета команды (§7.5 presets[5]).
type Preset struct {
	Name   string
	CatIDs []string // ожидается 3 в бою; валидация состава — battle/mode
}

// PotionStack — расходник в инвентаре (§2.5 battle_potion / §7.5 potions[]).
type PotionStack struct {
	PotionID string
	Count    int
}

// PassActive — passActiveUntil > now (§7.5).
func (p *Player) PassActive(now time.Time) bool {
	if p == nil || p.PassActiveUntil.IsZero() {
		return false
	}
	return now.Before(p.PassActiveUntil) || now.Equal(p.PassActiveUntil)
}

// AdsHidden — pass → no-ads (§5 Ads hidden / §13.3); в MVP Beta рекламы нет всегда (D-066).
func (p *Player) AdsHidden(now time.Time) bool {
	if p == nil {
		return false
	}
	if p.MVPBeta {
		return true
	}
	return p.PassActive(now)
}

// NewPlayer — пустой профиль; bowls/tickets появятся после RefillDaily.
func NewPlayer(userID string) *Player {
	return &Player{UserID: userID}
}
