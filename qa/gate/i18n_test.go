package gate_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

// §13.8 — контентные строки SL должны иметь и ru, и en (переключатель UI — PARTIAL).

func TestI18n_AllKeysHaveRuAndEn(t *testing.T) {
	root := repoRoot(t)
	raw, err := os.ReadFile(filepath.Join(root, "content", "i18n", "ru_en.json"))
	if err != nil {
		t.Fatal(err)
	}
	var entries map[string]map[string]string
	if err := json.Unmarshal(raw, &entries); err != nil {
		t.Fatal(err)
	}
	if len(entries) == 0 {
		t.Fatal("empty i18n catalog")
	}
	for key, loc := range entries {
		if loc["ru"] == "" {
			t.Errorf("%s: missing ru", key)
		}
		if loc["en"] == "" {
			t.Errorf("%s: missing en", key)
		}
		if loc["ru"] == loc["en"] && key != "hub.tab.pvp" {
			// PvP is identical by design; other keys should differ for a meaningful switch.
			t.Logf("note: %s ru==en (%q)", key, loc["ru"])
		}
	}
}
