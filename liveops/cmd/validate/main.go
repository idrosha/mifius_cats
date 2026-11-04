// validate — CI entry: schema + content id refs for LiveOps JSON (§7.4).
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"mythfel-liveops/internal/validate"
)

func main() {
	var (
		schema  = flag.String("schema", "", "path to liveops.schema.json")
		config  = flag.String("config", "", "path to config dir (walks *.json)")
		content = flag.String("content", "", "path to content/ root for id refs")
	)
	flag.Parse()

	root, err := repoRoot()
	if err != nil {
		fatal(err)
	}
	if *schema == "" {
		*schema = filepath.Join(root, "liveops", "schemas", "liveops.schema.json")
	}
	if *config == "" {
		*config = filepath.Join(root, "liveops", "config")
	}
	if *content == "" {
		*content = filepath.Join(root, "content")
	}

	results, err := validate.ValidateTree(*schema, *config, *content)
	if err != nil {
		fatal(err)
	}
	failed := 0
	for _, r := range results {
		if r.OK() {
			fmt.Printf("OK  %s\n", r.ConfigPath)
			continue
		}
		failed++
		fmt.Printf("FAIL %s\n", r.ConfigPath)
		for _, e := range r.Errors {
			fmt.Printf("  - %s\n", e)
		}
	}
	if failed > 0 {
		os.Exit(1)
	}
	if len(results) == 0 {
		fmt.Fprintln(os.Stderr, "no config json found")
		os.Exit(1)
	}
	fmt.Printf("validated %d config(s)\n", len(results))
}

func repoRoot() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	// Prefer when run from liveops/: ../ ; when from repo root: .
	candidates := []string{wd, filepath.Join(wd, ".."), filepath.Join(wd, "../..")}
	for _, c := range candidates {
		if st, err := os.Stat(filepath.Join(c, "liveops", "schemas", "liveops.schema.json")); err == nil && !st.IsDir() {
			return filepath.Clean(c), nil
		}
	}
	return filepath.Clean(wd), nil
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
