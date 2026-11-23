$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$i18nPath = Join-Path $Root "content\i18n\ru_en.json"
$patchPath = Join-Path $Root "docs\attack-cards-elven-preview\i18n-patch.json"
$i18n = Get-Content $i18nPath -Raw -Encoding UTF8 | ConvertFrom-Json
$patch = Get-Content $patchPath -Raw -Encoding UTF8 | ConvertFrom-Json
$added = 0
foreach ($p in $patch.PSObject.Properties) {
  $i18n | Add-Member -NotePropertyName $p.Name -NotePropertyValue $p.Value -Force
  $added++
}
$i18n | ConvertTo-Json -Depth 6 | Set-Content $i18nPath -Encoding UTF8
Write-Host "i18n keys upserted: $added"
