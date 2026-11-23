$src = "C:\Users\Ирина\.cursor\projects\c-Users-Desktop\assets"
$dest = "C:\Users\Ирина\Desktop\проекты\котики\mifius_cats-main\docs\attack-cards-elven-preview\tank_fire"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Get-ChildItem -Path $src -Filter "attack_tank_fire_*.jpg" | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $dest $_.Name) -Force
  Write-Host "copied $($_.Name)"
}
Get-ChildItem $dest | Format-Table Name, Length
