# Phase 4 Soft launch — in-repo gate

Done when (§14): **§13 зелёный на ограниченном гео**.

| Слой | В репо | Вне репо (блокер прод-launch) |
|---|---|---|
| §13 auto | `./qa/run-acceptance.sh` | — |
| LiveOps CDN | `liveops/cmd/cdn-stub` → `:8090` | Signed CDN + release keys |
| Geo | `liveops/soft-launch/geo_allowlist.example.json` | Ops allowlist / store listing geos |
| Device | `qa/DEVICE_SMOKE.md` | Реальный девайс + mobile build |
| Analytics | `soft_launch_flag` stub (§11) | Прод analytics sink |

```bash
./qa/run-soft-launch.sh
```

Exit `0` = auto §13 + geo example + CDN stub smoke зелёные. Device rows остаются MANUAL.
