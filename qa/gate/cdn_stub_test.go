package gate_test

import (
	"encoding/json"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"
)

// §8.4 — CDN stub serves versioned LiveOps JSON with stub signature (no prod keys).
func TestCdnStub_ServesLiveOpsWithStubSignature(t *testing.T) {
	root := repoRoot(t)
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := ln.Addr().String()
	_ = ln.Close()

	cmd := exec.Command("go", "run", "./cmd/cdn-stub",
		"-addr", addr,
		"-geo", filepath.Join(root, "liveops", "soft-launch", "geo_allowlist.example.json"),
	)
	cmd.Dir = filepath.Join(root, "liveops")
	cmd.Stdout = io.Discard
	cmd.Stderr = io.Discard
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	defer func() {
		_ = cmd.Process.Kill()
		_, _ = cmd.Process.Wait()
	}()

	url := "http://" + addr + "/v1/liveops.json"
	var resp *http.Response
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		req, _ := http.NewRequest(http.MethodGet, url, nil)
		req.Header.Set("X-Client-Region", "RU")
		resp, err = http.DefaultClient.Do(req)
		if err == nil {
			break
		}
		time.Sleep(100 * time.Millisecond)
	}
	if err != nil {
		t.Fatalf("cdn stub not up: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if resp.Header.Get("X-LiveOps-Signature") == "" {
		t.Fatal("missing stub signature header")
	}
	if resp.Header.Get("X-LiveOps-Signature-Alg") != "stub" {
		t.Fatalf("want stub alg, got %q", resp.Header.Get("X-LiveOps-Signature-Alg"))
	}
	var doc map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&doc); err != nil {
		t.Fatal(err)
	}
	if doc["feature_flags"] == nil {
		t.Fatal("expected feature_flags in CDN body")
	}

	reqDeny, _ := http.NewRequest(http.MethodGet, url, nil)
	reqDeny.Header.Set("X-Client-Region", "US")
	deny, err := http.DefaultClient.Do(reqDeny)
	if err != nil {
		t.Fatal(err)
	}
	defer deny.Body.Close()
	if deny.StatusCode != http.StatusForbidden {
		t.Fatalf("US region want 403, got %d", deny.StatusCode)
	}
}

func TestGeoAllowlistExample_ExistsAndParses(t *testing.T) {
	root := repoRoot(t)
	raw, err := os.ReadFile(filepath.Join(root, "liveops", "soft-launch", "geo_allowlist.example.json"))
	if err != nil {
		t.Fatal(err)
	}
	var doc struct {
		Allowlist []string `json:"allowlist"`
	}
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	if len(doc.Allowlist) == 0 {
		t.Fatal("example allowlist empty")
	}
}
