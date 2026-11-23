# Ship elven 108 attack cards into live stitch-assets; delete old 12-hero packs.
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Preview = Join-Path $Root "docs\attack-cards-elven-preview"
$Live = Join-Path $Root "client\web-hud\public\stitch-assets\attack-cards"
$Parts = @("eyes","ears","muzzle","headwear","back","tail")
$Roles = @("tank","fighter","assassin","ranger","mage","support")
$Elements = @("fire","water","wind")

$oldFolders = @(
  "tank-a","tank-b","fighter-a","fighter-b","assassin-a","assassin-b",
  "ranger-a","ranger-b","mage-a","mage-b","support-a","support-b"
)

Write-Host "=== Delete old attack-card folders ==="
foreach ($f in $oldFolders) {
  $p = Join-Path $Live $f
  if (Test-Path $p) {
    Remove-Item -Recurse -Force $p
    Write-Host "removed $f"
  }
}

Write-Host "=== Ship 108 new cards ==="
$n = 0
foreach ($role in $Roles) {
  foreach ($el in $Elements) {
    $hero = "${role}_${el}"
    $folderName = "${role}-${el}"
    $destDir = Join-Path $Live $folderName
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    $srcDir = Join-Path $Preview $hero
    foreach ($part in $Parts) {
      $src = Join-Path $srcDir "attack_${role}_${el}_${part}.jpg"
      if (-not (Test-Path $src)) { throw "Missing preview: $src" }
      # Live filename matches card stem: attack_shop_{role}_{element}_{part}.jpg
      $dest = Join-Path $destDir "attack_shop_${role}_${el}_${part}.jpg"
      Copy-Item $src $dest -Force
      $n++
    }
    Write-Host "shipped $folderName (6)"
  }
}
Write-Host "shipped_files=$n"

Write-Host "=== Replace shop cats/parts with elven_18 ==="
Copy-Item (Join-Path $Root "content\cats\elven_18.json") (Join-Path $Root "content\cats\shop_common.json") -Force
Copy-Item (Join-Path $Root "content\parts\elven_18.json") (Join-Path $Root "content\parts\shop_common.json") -Force

Write-Host "=== Delete old shop A/B card JSON ==="
$deleted = 0
Get-ChildItem (Join-Path $Root "content\cards") -Filter "shop_*.json" | ForEach-Object {
  # keep shop_{role}_{element}_{part} without _a/_b variant
  if ($_.Name -match '^shop_.+_[ab]_') {
    Remove-Item $_.FullName -Force
    $deleted++
  }
}
# legacy non-shop starter card defs that duplicated old kits
foreach ($pat in @("tank_stone_*.json","fighter_fire_*.json","support_water_*.json")) {
  Get-ChildItem (Join-Path $Root "content\cards") -Filter $pat -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_.FullName -Force
    $deleted++
  }
}
Write-Host "deleted_old_card_json=$deleted"

Write-Host "=== Verify live folders ==="
$liveCount = (Get-ChildItem $Live -Recurse -Filter "attack_shop_*.jpg").Count
Write-Host "live_attack_jpgs=$liveCount"
foreach ($f in $oldFolders) {
  if (Test-Path (Join-Path $Live $f)) { throw "OLD FOLDER STILL EXISTS: $f" }
}
Write-Host "OLD_FOLDERS_GONE=ok"
Write-Host "DONE"
