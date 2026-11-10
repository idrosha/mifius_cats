// Package replay — хранение последних 10 PvP и GetReplay (§3.6 / §8.2).
package replay

import (
	"fmt"
	"sync"

	"github.com/idrosha/mifius_cats/battle/internal/sim"
)

const MaxPerUser = 10 // FULL-SPEC §1 / §3.6 / §6 ReplayList

// Meta — краткая запись для списка (§6 ReplayList).
type Meta struct {
	BattleID   string `json:"battleId"`
	MatchID    string `json:"matchId"`
	Seed       int64  `json:"seed"`
	Result     string `json:"result"`
	FrameCount int    `json:"frameCount"`
}

type record struct {
	Meta
	Frames []sim.Frame
	users  map[string]struct{}
}

// Store — in-memory last-N PvP/user. Nakama persistence — отдельно.
type Store struct {
	mu      sync.Mutex
	byID    map[string]*record
	byUser  map[string][]string // battleIDs newest-first, ≤ MaxPerUser
}

func NewStore() *Store {
	return &Store{
		byID:   map[string]*record{},
		byUser: map[string][]string{},
	}
}

// SaveFinishedPvP stores frames for each participant (§3.6: 10 последних PvP/user).
// Only ModePvP + finished battles. Idempotent for same battleId+user.
func (s *Store) SaveFinishedPvP(userIDs []string, b *sim.Battle) error {
	if b == nil {
		return fmt.Errorf("nil battle")
	}
	if b.Mode != sim.ModePvP {
		return fmt.Errorf("SaveFinishedPvP: mode=%s (only pvp)", b.Mode)
	}
	if !b.Finished() {
		return fmt.Errorf("SaveFinishedPvP: battle %s not finished", b.ID)
	}
	if b.ID == "" {
		return fmt.Errorf("SaveFinishedPvP: empty battleId")
	}
	if len(userIDs) == 0 {
		return fmt.Errorf("SaveFinishedPvP: no userIds")
	}

	frames := append([]sim.Frame(nil), b.Frames...)
	meta := Meta{
		BattleID:   b.ID,
		MatchID:    b.MatchID,
		Seed:       b.Seed,
		Result:     string(b.Result),
		FrameCount: len(frames),
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	rec, ok := s.byID[b.ID]
	if !ok {
		rec = &record{Meta: meta, Frames: frames, users: map[string]struct{}{}}
		s.byID[b.ID] = rec
	} else {
		// Same battleId: keep existing frames (authoritative first save).
		rec.Meta = meta
		if len(rec.Frames) == 0 {
			rec.Frames = frames
		}
	}

	for _, uid := range userIDs {
		if uid == "" {
			continue
		}
		if _, has := rec.users[uid]; has {
			continue
		}
		rec.users[uid] = struct{}{}
		s.pushUser(uid, b.ID)
	}
	return nil
}

func (s *Store) pushUser(userID, battleID string) {
	list := s.byUser[userID]
	// Drop duplicate if re-saved (should not happen after users check).
	filtered := list[:0]
	for _, id := range list {
		if id != battleID {
			filtered = append(filtered, id)
		}
	}
	list = append([]string{battleID}, filtered...)
	for len(list) > MaxPerUser {
		evicted := list[len(list)-1]
		list = list[:len(list)-1]
		s.unlinkUser(evicted, userID)
	}
	s.byUser[userID] = list
}

func (s *Store) unlinkUser(battleID, userID string) {
	rec, ok := s.byID[battleID]
	if !ok {
		return
	}
	delete(rec.users, userID)
	if len(rec.users) == 0 {
		delete(s.byID, battleID)
	}
}

// List returns up to MaxPerUser newest PvP metas for user (§6 ReplayList).
func (s *Store) List(userID string) []Meta {
	s.mu.Lock()
	defer s.mu.Unlock()
	ids := s.byUser[userID]
	out := make([]Meta, 0, len(ids))
	for _, id := range ids {
		if rec, ok := s.byID[id]; ok {
			out = append(out, rec.Meta)
		}
	}
	return out
}

// GetReplay — FULL-SPEC §8.2: battleId → frames.
func (s *Store) GetReplay(battleID string) ([]sim.Frame, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	rec, ok := s.byID[battleID]
	if !ok {
		return nil, fmt.Errorf("replay not found: %s", battleID)
	}
	out := make([]sim.Frame, len(rec.Frames))
	copy(out, rec.Frames)
	return out, nil
}
