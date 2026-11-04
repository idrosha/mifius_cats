package gate_test

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// §13.4 / §13.2–3 / §5 — конфиг LiveOps несёт SSOT-числа soft launch.
// Pity *срабатывание* — backend TestOpenJar_HardPityTriggersAt80 (ACCEPTANCE PASS).

func TestLiveOps_PityAndLimits_MatchSSOT(t *testing.T) {
	root := repoRoot(t)
	raw, err := os.ReadFile(filepath.Join(root, "liveops", "config", "v1", "liveops.json"))
	if err != nil {
		t.Fatal(err)
	}
	var doc struct {
		Limits struct {
			PvEPerDayFree  int `json:"pve_per_day_free"`
			PvPPerDayFree  int `json:"pvp_per_day_free"`
			PassMultiplier int `json:"pass_multiplier"`
		} `json:"limits"`
		Pity struct {
			Soft int `json:"soft"`
			Hard int `json:"hard"`
		} `json:"pity"`
		FeatureFlags struct {
			ClanBoss bool `json:"clan_boss_gameplay"`
			Farm     bool `json:"farm_gameplay"`
			Nursery  bool `json:"nursery_gameplay"`
		} `json:"feature_flags"`
	}
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	if doc.Limits.PvEPerDayFree != 3 || doc.Limits.PvPPerDayFree != 5 || doc.Limits.PassMultiplier != 2 {
		t.Fatalf("§13.2/3 limits want 3/5 ×2, got %d/%d ×%d",
			doc.Limits.PvEPerDayFree, doc.Limits.PvPPerDayFree, doc.Limits.PassMultiplier)
	}
	if doc.Pity.Soft != 50 || doc.Pity.Hard != 80 {
		t.Fatalf("§13.4 pity want soft50/hard80, got %d/%d", doc.Pity.Soft, doc.Pity.Hard)
	}
	if doc.FeatureFlags.ClanBoss || doc.FeatureFlags.Farm || doc.FeatureFlags.Nursery {
		t.Fatal("§1 MUST NOT: SL feature_flags for clan/farm/nursery must be false")
	}
}

// §13.10 — смена remote limits остаётся валидной по схеме (без ребилда клиента).
func TestLiveOps_LimitsMutation_StillSchemaValid(t *testing.T) {
	root := repoRoot(t)
	cfgPath := filepath.Join(root, "liveops", "config", "v1", "liveops.json")

	raw, err := os.ReadFile(cfgPath)
	if err != nil {
		t.Fatal(err)
	}
	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	limits := doc["limits"].(map[string]any)
	limits["pve_per_day_free"] = float64(4)
	limits["pvp_per_day_free"] = float64(7)

	dir := t.TempDir()
	v1 := filepath.Join(dir, "v1")
	if err := os.MkdirAll(v1, 0o755); err != nil {
		t.Fatal(err)
	}
	out, err := json.MarshalIndent(doc, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(v1, "liveops.json"), append(out, '\n'), 0o644); err != nil {
		t.Fatal(err)
	}

	cmd := exec.Command("go", "run", "./cmd/validate",
		"-config", dir,
		"-schema", filepath.Join(root, "liveops", "schemas", "liveops.schema.json"),
		"-content", filepath.Join(root, "content"),
	)
	cmd.Dir = filepath.Join(root, "liveops")
	outBytes, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("§13.10 mutated limits must validate via liveops cmd:\n%s\n%v", outBytes, err)
	}
}
