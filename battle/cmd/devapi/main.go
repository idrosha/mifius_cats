// devapi — local battle-service stub for manual QA (§8.2).
// No Nakama / no store secrets. Bind localhost only by default.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/replay"
	"github.com/idrosha/mir_games/battle/internal/sim"
	"github.com/idrosha/mir_games/battle/internal/statediff"
)

const defaultPvPTurnSec = 30

func main() {
	addr := flag.String("addr", "127.0.0.1:8081", "listen (local smoke; not prod)")
	contentDir := flag.String("content", "", "path to content/")
	flag.Parse()

	root := *contentDir
	if root == "" {
		wd, _ := os.Getwd()
		root = filepath.Join(wd, "content")
		if _, err := os.Stat(root); err != nil {
			root = filepath.Join(wd, "..", "content")
		}
		if _, err := os.Stat(root); err != nil {
			root = filepath.Join(wd, "..", "..", "content")
		}
	}
	cat, err := content.LoadCatalog(root)
	if err != nil {
		log.Fatalf("content: %v", err)
	}

	s := &server{
		cat:       cat,
		battles:   map[string]*sim.Battle{},
		byMatchID: map[string]string{},
		store:     replay.NewStore(),
		userID:    "local_smoke",
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", s.healthz)
	mux.HandleFunc("/v1/CreatePvE", s.createPvE)
	mux.HandleFunc("/v1/CreatePvP", s.createPvP)
	mux.HandleFunc("/v1/GetBattle", s.getBattle)
	mux.HandleFunc("/v1/SubmitAction", s.submitAction)
	mux.HandleFunc("/v1/ListReplays", s.listReplays)
	mux.HandleFunc("/v1/GetReplay", s.getReplay)

	log.Printf("mythfel-battle-devapi listening on http://%s (content=%s)", *addr, root)
	log.Fatal(http.ListenAndServe(*addr, mux))
}

type server struct {
	cat       *content.Catalog
	mu        sync.Mutex
	battles   map[string]*sim.Battle
	byMatchID map[string]string // matchId → battleId (idempotent CreatePvP / D-058)
	store     *replay.Store
	userID    string
	seq       atomic.Uint64
}

type createPvEReq struct {
	StageID    string          `json:"stageId"`
	Team       []string        `json:"team"`
	Potions    []string        `json:"potions"`
	Seed       int64           `json:"seed"`
	AutoPlay   bool            `json:"autoPlay"`
	CarryAlive []bool          `json:"carryAlive"` // D-039 Mythmir wave carry; omit = all alive
	TeamGear   []sim.GearBonus `json:"teamGear"`   // len 3 armor/weapon bonuses; enemy HP stays fixed
}

type createPvPReq struct {
	MatchID      string          `json:"matchId"`
	Team1        []string        `json:"team1"`
	Team2        []string        `json:"team2"`
	Seed         int64           `json:"seed"`
	AutoPlay     bool            `json:"autoPlay"`
	TeamGear1    []sim.GearBonus `json:"teamGear1"`
	TeamGear2    []sim.GearBonus `json:"teamGear2"`
	HumanP2      bool            `json:"humanP2"` // live MM: both humans (D-058)
	TurnTimerSec int             `json:"turnTimerSec"`
	Seat         *int            `json:"seat"` // optional viewer seat for hand filter
}

type submitReq struct {
	BattleID string     `json:"battleId"`
	Seat     *int       `json:"seat"` // optional; when set must match Active for play/end/keep
	Action   sim.Action `json:"action"`
}

func (s *server) healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "service": "mythfel-battle-devapi"})
}

func (s *server) createPvE(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	var req createPvEReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	if req.StageID == "" {
		http.Error(w, "stageId required", http.StatusBadRequest)
		return
	}
	if len(req.Team) != 3 {
		http.Error(w, "team must be 3", http.StatusBadRequest)
		return
	}
	seed := req.Seed
	if seed == 0 {
		seed = time.Now().UnixNano()
	}
	id := fmt.Sprintf("pve_%d", s.seq.Add(1))
	b, err := mode.CreatePvE(s.cat, id, req.StageID, seed, req.Team, req.Potions, req.CarryAlive, req.TeamGear)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.AutoPlay {
		if err := b.AutoPlay(40); err != nil {
			http.Error(w, "autoPlay: "+err.Error(), http.StatusInternalServerError)
			return
		}
	} else if err := b.AdvancePvEBots(); err != nil {
		http.Error(w, "bot: "+err.Error(), http.StatusInternalServerError)
		return
	}
	s.mu.Lock()
	s.battles[id] = b
	s.mu.Unlock()
	writeJSON(w, http.StatusOK, statediff.FromBattle(b))
}

func (s *server) createPvP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	var req createPvPReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	if req.MatchID == "" {
		req.MatchID = fmt.Sprintf("m_%d", s.seq.Add(1))
	}
	if len(req.Team1) != 3 || len(req.Team2) != 3 {
		http.Error(w, "teams must be 3v3", http.StatusBadRequest)
		return
	}

	// Idempotent by matchId — both live seats join the same battle (D-058).
	s.mu.Lock()
	if bid, ok := s.byMatchID[req.MatchID]; ok {
		b := s.battles[bid]
		s.mu.Unlock()
		if b == nil {
			http.Error(w, "battle missing for match", http.StatusInternalServerError)
			return
		}
		if _, err := s.withDeadline(b); err != nil {
			http.Error(w, "deadline: "+err.Error(), http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, statediff.FromBattleForSeat(b, req.Seat))
		return
	}
	s.mu.Unlock()

	seed := req.Seed
	if seed == 0 {
		seed = 20261104
	}
	turnSec := req.TurnTimerSec
	if req.HumanP2 && turnSec <= 0 {
		turnSec = defaultPvPTurnSec
	}
	id := fmt.Sprintf("pvp_%d", s.seq.Add(1))
	b, err := mode.CreatePvP(s.cat, id, req.MatchID, seed, req.Team1, req.Team2, nil, nil, req.TeamGear1, req.TeamGear2, req.HumanP2, turnSec)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.AutoPlay {
		if err := b.AutoPlay(40); err != nil {
			http.Error(w, "autoPlay: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	s.mu.Lock()
	// Double-check race: another seat may have created first.
	if bid, ok := s.byMatchID[req.MatchID]; ok {
		existing := s.battles[bid]
		s.mu.Unlock()
		if existing == nil {
			http.Error(w, "battle missing for match", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, statediff.FromBattleForSeat(existing, req.Seat))
		return
	}
	s.battles[id] = b
	s.byMatchID[req.MatchID] = id
	s.mu.Unlock()

	if b.Finished() {
		_ = s.store.SaveFinishedPvP([]string{s.userID, "opp_smoke"}, b)
	}
	writeJSON(w, http.StatusOK, statediff.FromBattleForSeat(b, req.Seat))
}

func (s *server) getBattle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "GET only", http.StatusMethodNotAllowed)
		return
	}
	battleID := r.URL.Query().Get("battleId")
	matchID := r.URL.Query().Get("matchId")
	var seat *int
	if raw := r.URL.Query().Get("seat"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || (n != 0 && n != 1) {
			http.Error(w, "seat must be 0 or 1", http.StatusBadRequest)
			return
		}
		seat = &n
	}

	s.mu.Lock()
	var b *sim.Battle
	if battleID != "" {
		b = s.battles[battleID]
	} else if matchID != "" {
		if bid, ok := s.byMatchID[matchID]; ok {
			b = s.battles[bid]
		}
	}
	s.mu.Unlock()
	if b == nil {
		http.Error(w, "battle not found", http.StatusNotFound)
		return
	}
	if _, err := s.withDeadline(b); err != nil {
		http.Error(w, "deadline: "+err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, statediff.FromBattleForSeat(b, seat))
}

func (s *server) submitAction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	var req submitReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	s.mu.Lock()
	b, ok := s.battles[req.BattleID]
	s.mu.Unlock()
	if !ok {
		http.Error(w, "battle not found", http.StatusNotFound)
		return
	}
	if _, err := s.withDeadline(b); err != nil {
		http.Error(w, "deadline: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if b.Finished() {
		writeJSON(w, http.StatusOK, statediff.FromBattleForSeat(b, req.Seat))
		return
	}
	if req.Seat != nil {
		if int(b.Active) != *req.Seat {
			http.Error(w, "not your turn", http.StatusBadRequest)
			return
		}
	}
	if err := b.SubmitAction(req.Action); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest) // illegal → reject (§13.5)
		return
	}
	if err := b.AdvancePvEBots(); err != nil {
		http.Error(w, "bot: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if b.Mode == sim.ModePvP && b.Finished() {
		_ = s.store.SaveFinishedPvP([]string{s.userID, "opp_smoke"}, b)
	}
	writeJSON(w, http.StatusOK, statediff.FromBattleForSeat(b, req.Seat))
}

func (s *server) withDeadline(b *sim.Battle) (timedOut bool, err error) {
	timedOut, err = b.EnforceTurnDeadline()
	if err != nil {
		return timedOut, err
	}
	if timedOut {
		if err := b.AdvancePvEBots(); err != nil {
			return true, err
		}
	}
	return timedOut, nil
}

func (s *server) listReplays(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "GET only", http.StatusMethodNotAllowed)
		return
	}
	user := r.URL.Query().Get("userId")
	if user == "" {
		user = s.userID
	}
	writeJSON(w, http.StatusOK, s.store.List(user))
}

func (s *server) getReplay(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "GET only", http.StatusMethodNotAllowed)
		return
	}
	id := r.URL.Query().Get("battleId")
	frames, err := s.store.GetReplay(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, frames)
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}
