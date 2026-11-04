// cdn-stub — local LiveOps CDN for soft-launch wiring (§8.4 / ЗАПУСК :8090).
// Serves versioned JSON with a placeholder signature header. No production secrets.
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"mythfel-liveops/internal/softlaunch"
)

func main() {
	var (
		addr      = flag.String("addr", ":8090", "listen address (ЗАПУСК local CDN)")
		config    = flag.String("config", "", "path to liveops.json (default: config/v1/liveops.json)")
		geoPath   = flag.String("geo", "", "optional geo allowlist JSON; if set, X-Client-Region is gated")
		stubSig   = flag.String("stub-sig", "stub", "X-LiveOps-Signature value (placeholder — not a real key)")
	)
	flag.Parse()

	root, err := repoRoot()
	if err != nil {
		log.Fatal(err)
	}
	if *config == "" {
		*config = filepath.Join(root, "liveops", "config", "v1", "liveops.json")
	}

	body, err := os.ReadFile(*config)
	if err != nil {
		log.Fatalf("read config: %v", err)
	}
	var doc map[string]any
	if err := json.Unmarshal(body, &doc); err != nil {
		log.Fatalf("config json: %v", err)
	}
	version, _ := doc["version"].(string)
	if version == "" {
		version = "1"
	}
	sum := sha256.Sum256(body)
	etag := `"` + hex.EncodeToString(sum[:8]) + `"`

	var geo *softlaunch.GeoAllowlist
	if *geoPath != "" {
		geo, err = softlaunch.LoadGeoAllowlist(*geoPath)
		if err != nil {
			log.Fatalf("geo: %v", err)
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true,"service":"mythfel-liveops-cdn-stub"}`))
	})
	mux.HandleFunc("/v1/liveops.json", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if geo != nil {
			region := strings.TrimSpace(r.Header.Get("X-Client-Region"))
			if region == "" {
				region = strings.TrimSpace(r.URL.Query().Get("region"))
			}
			if !geo.Allows(region) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				_, _ = w.Write([]byte(`{"error":"soft_launch_geo_denied","event":"soft_launch_flag"}`))
				return
			}
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Cache-Control", "public, max-age=60")
		w.Header().Set("ETag", etag)
		w.Header().Set("X-LiveOps-Version", version)
		// Placeholder only — real CDN signing keys stay out of repo (§8.4).
		w.Header().Set("X-LiveOps-Signature", *stubSig)
		w.Header().Set("X-LiveOps-Signature-Alg", "stub")
		if r.Method == http.MethodHead {
			w.WriteHeader(http.StatusOK)
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(body)
	})

	srv := &http.Server{
		Addr:              *addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("mythfel LiveOps CDN stub listening on http://%s  config=%s", listenHost(*addr), *config)
	if geo != nil {
		log.Printf("geo gate on: allowlist=%v (header X-Client-Region)", geo.Allowlist)
	} else {
		log.Printf("geo gate off — pass -geo path/to/allowlist.json to enable")
	}
	log.Fatal(srv.ListenAndServe())
}

func listenHost(addr string) string {
	if strings.HasPrefix(addr, ":") {
		return "localhost" + addr
	}
	return addr
}

func repoRoot() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	candidates := []string{wd, filepath.Join(wd, ".."), filepath.Join(wd, "../.."), filepath.Join(wd, "../../..")}
	for _, c := range candidates {
		if st, err := os.Stat(filepath.Join(c, "liveops", "schemas", "liveops.schema.json")); err == nil && !st.IsDir() {
			return filepath.Clean(c), nil
		}
	}
	return "", fmt.Errorf("repo root not found from %s", wd)
}
