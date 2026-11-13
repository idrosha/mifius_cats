"""One-shot: attack-cards PNG → WebP (max 640px). Run from repo root."""
from pathlib import Path
from PIL import Image

root = Path("client/web-hud/public/stitch-assets/attack-cards")
before = sum(p.stat().st_size for p in root.rglob("*.png"))
n = 0
for p in sorted(root.rglob("*.png")):
    im = Image.open(p)
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        im = im.convert("RGBA")
    else:
        im = im.convert("RGB")
    im.thumbnail((640, 960), Image.Resampling.LANCZOS)
    out = p.with_suffix(".webp")
    im.save(out, "WEBP", quality=72, method=6)
    p.unlink()
    n += 1
after = sum(p.stat().st_size for p in root.rglob("*.webp"))
print(f"converted={n}")
print(f"before_MB={before / 1e6:.1f}")
print(f"after_MB={after / 1e6:.1f}")
print(f"ratio={after / before:.3f}" if before else "n/a")
