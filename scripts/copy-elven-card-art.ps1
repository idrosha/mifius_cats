$src = "C:\Users\Ирина\.cursor\projects\c-Users-Desktop\assets"
$preview = "C:\Users\Ирина\Desktop\проекты\котики\mifius_cats-main\docs\attack-cards-elven-preview"
$n = 0
Get-ChildItem -Path $src -Filter "attack_*.jpg" | ForEach-Object {
  # attack_tank_fire_eyes.jpg -> tank_fire
  if ($_.Name -match '^attack_([^_]+)_([^_]+)_(.+)\.jpg$') {
    $hero = "$($Matches[1])_$($Matches[2])"
    $dest = Join-Path $preview $hero
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item $_.FullName (Join-Path $dest $_.Name) -Force
    $n++
  }
}
Write-Host "copied $n files into preview hero folders"
