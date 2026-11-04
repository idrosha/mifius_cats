package gate_test

import (
	"os"
	"path/filepath"
	"testing"
)

func repoRoot(t *testing.T) string {
	t.Helper()
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	// qa/gate → qa → repo
	root := filepath.Clean(filepath.Join(wd, "..", ".."))
	if _, err := os.Stat(filepath.Join(root, "docs", "FULL-SPEC.md")); err != nil {
		t.Fatalf("repo root not found from %s: %v", wd, err)
	}
	return root
}
