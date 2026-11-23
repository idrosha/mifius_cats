# Generate 18 heroes x 6 attack cards from stitch-prompts-attack-cards-elven-18x6.md §6
# Writes: content/cards, content/cats/elven_18.json, content/parts/elven_18.json,
#         docs/attack-cards-elven-preview/manifest.json, balance report

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $Root "content"))) {
  $Root = Split-Path $PSScriptRoot -Parent
}
$CardsDir = Join-Path $Root "content\cards"
$CatsPath = Join-Path $Root "content\cats\elven_18.json"
$PartsPath = Join-Path $Root "content\parts\elven_18.json"
$PreviewDir = Join-Path $Root "docs\attack-cards-elven-preview"
$ManifestPath = Join-Path $PreviewDir "manifest.json"
$BalancePath = Join-Path $PreviewDir "balance-report.json"
$I18nPatchPath = Join-Path $PreviewDir "i18n-patch.json"

New-Item -ItemType Directory -Force -Path $PreviewDir | Out-Null
New-Item -ItemType Directory -Force -Path $CardsDir | Out-Null

$CLASS_RU = @{
  tank = "Танк"; fighter = "Боец"; assassin = "Ассасин"
  ranger = "Стрелок"; mage = "Маг"; support = "Саппорт"
}

# Base stats per role/element (PvP equal band; archetype flavor)
$BaseStats = @{
  "tank_fire"     = @{ hp = 50; atk = 4; spd = 3; skill = 2; charm = 4 }
  "tank_water"    = @{ hp = 48; atk = 6; spd = 3; skill = 2; charm = 4 }
  "tank_wind"     = @{ hp = 50; atk = 4; spd = 4; skill = 3; charm = 4 }
  "fighter_fire"  = @{ hp = 43; atk = 8; spd = 7; skill = 3; charm = 3 }
  "fighter_water" = @{ hp = 45; atk = 10; spd = 5; skill = 3; charm = 3 }
  "fighter_wind"  = @{ hp = 42; atk = 8; spd = 7; skill = 4; charm = 3 }
  "assassin_fire" = @{ hp = 38; atk = 8; spd = 9; skill = 4; charm = 4 }
  "assassin_water"= @{ hp = 36; atk = 8; spd = 8; skill = 4; charm = 4 }
  "assassin_wind" = @{ hp = 37; atk = 7; spd = 9; skill = 5; charm = 4 }
  "ranger_fire"   = @{ hp = 35; atk = 7; spd = 8; skill = 4; charm = 3 }
  "ranger_water"  = @{ hp = 37; atk = 7; spd = 7; skill = 5; charm = 3 }
  "ranger_wind"   = @{ hp = 35; atk = 7; spd = 8; skill = 5; charm = 3 }
  "mage_fire"     = @{ hp = 30; atk = 5; spd = 5; skill = 8; charm = 3 }
  "mage_water"    = @{ hp = 29; atk = 5; spd = 5; skill = 8; charm = 3 }
  "mage_wind"     = @{ hp = 30; atk = 5; spd = 6; skill = 8; charm = 3 }
  "support_fire"  = @{ hp = 28; atk = 3; spd = 5; skill = 7; charm = 6 }
  "support_water" = @{ hp = 28; atk = 2; spd = 5; skill = 7; charm = 6 }
  "support_wind"  = @{ hp = 29; atk = 3; spd = 5; skill = 7; charm = 6 }
}

function New-OpStatus($status, $stacks, $duration) {
  $o = [ordered]@{ op = "apply_status"; status = $status; stacks = [int]$stacks }
  if ($null -ne $duration) { $o.duration = [int]$duration }
  return $o
}
function New-OpHeal($amount, $target = $null) {
  $o = [ordered]@{ op = "heal"; amount = [int]$amount }
  if ($target) { $o.target = $target }
  return $o
}
function New-OpCleanse($n) { return [ordered]@{ op = "cleanse"; amount = [int]$n } }
function New-OpBuff($stat, $amount, $duration) {
  return [ordered]@{ op = "buff"; stat = $stat; amount = [int]$amount; duration = [int]$duration }
}

# Kit definitions: heroId -> array of 6 card specs (part order fixed)
# Fields: part, name_ru, name_en, cost, atk, shield, heal, hits, targetRule, tags[], effectOps[], desc_ru
$Kits = [ordered]@{}

# --- Tank Fire ---
$Kits["tank_fire"] = @(
  @{ part="eyes"; name_ru="Жаркий взор"; name_en="Ember Gaze"; cost=1; atk=0; shield=5; heal=0; hits=0; targetRule="self"; tags=@("shield"); ops=@(); desc_ru="Взгляд закаляет шкуру. Даёт щит себе." }
  @{ part="ears"; name_ru="Слух горна"; name_en="Horn Hearing"; cost=1; atk=0; shield=3; heal=0; hits=0; targetRule="ally_lowest_hp"; tags=@("shield"); ops=@(); desc_ru="Слышит зов союзника. Щит слабому союзнику." }
  @{ part="muzzle"; name_ru="Оскал жара"; name_en="Heat Snarl"; cost=1; atk=0; shield=6; heal=0; hits=0; targetRule="self"; tags=@("shield","taunt"); ops=@((New-OpStatus "taunt" 1 2)); desc_ru="Рёв провоцирует врагов. Щит и таунт." }
  @{ part="headwear"; name_ru="Шлем углей"; name_en="Cinder Helm"; cost=1; atk=0; shield=5; heal=0; hits=0; targetRule="self"; tags=@("shield"); ops=@(); desc_ru="Угольный шлем. Крепкий щит." }
  @{ part="back"; name_ru="Удар щита-жара"; name_en="Heat Bash"; cost=1; atk=4; shield=2; heal=0; hits=1; targetRule="nearest"; tags=@("attack","shield","taunt"); ops=@((New-OpStatus "taunt" 1 2)); desc_ru="Удар щитом. Урон, щит и таунт." }
  @{ part="tail"; name_ru="Хлыст пламени"; name_en="Flame Lash"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@(); desc_ru="Хвост-хлыст. Сильный удар по фронту." }
)

# --- Tank Water ---
$Kits["tank_water"] = @(
  @{ part="eyes"; name_ru="Трещина волны"; name_en="Wave Crack"; cost=1; atk=3; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","pierce"); ops=@((New-OpStatus "fragile" 1 2)); desc_ru="Взгляд находит брешь. Pierce и fragile." }
  @{ part="ears"; name_ru="Слух бреши"; name_en="Breach Ear"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","pierce"); ops=@(); desc_ru="Слышит слабое место брони. Pierce-удар." }
  @{ part="muzzle"; name_ru="Клык прилива"; name_en="Tide Fang"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","pierce"); ops=@((New-OpStatus "fragile" 1 2)); desc_ru="Укус прилива. Pierce и fragile." }
  @{ part="headwear"; name_ru="Шлем пены"; name_en="Foam Helm"; cost=1; atk=0; shield=5; heal=0; hits=0; targetRule="self"; tags=@("shield","taunt"); ops=@((New-OpStatus "taunt" 1 2)); desc_ru="Пена держит агро. Щит и таунт." }
  @{ part="back"; name_ru="Таран глубины"; name_en="Depth Ram"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","pierce"); ops=@(); desc_ru="Мощный таран. Высокий pierce-урон." }
  @{ part="tail"; name_ru="Хвост-пробой"; name_en="Pierce Tail"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","pierce","backline"); ops=@((New-OpStatus "fragile" 1 2)); desc_ru="Удар в тыл. Pierce и fragile." }
)

# --- Tank Wind ---
$Kits["tank_wind"] = @(
  @{ part="eyes"; name_ru="Взор бури"; name_en="Storm Gaze"; cost=1; atk=0; shield=4; heal=0; hits=0; targetRule="self"; tags=@("shield","buff"); ops=@((New-OpStatus "reflect" 1 2)); desc_ru="Взгляд бури. Щит и аура отражения." }
  @{ part="ears"; name_ru="Слух отката"; name_en="Rebound Ear"; cost=1; atk=0; shield=3; heal=0; hits=0; targetRule="ally_lowest_hp"; tags=@("shield"); ops=@(); desc_ru="Ловит удар за союзника. Малый щит." }
  @{ part="muzzle"; name_ru="Рёв ветра"; name_en="Wind Roar"; cost=1; atk=0; shield=5; heal=0; hits=0; targetRule="self"; tags=@("shield","taunt"); ops=@((New-OpStatus "taunt" 1 2)); desc_ru="Рёв ветра. Щит и таунт." }
  @{ part="headwear"; name_ru="Корона шквала"; name_en="Squall Crown"; cost=1; atk=0; shield=4; heal=0; hits=0; targetRule="self"; tags=@("shield","buff"); ops=@((New-OpStatus "reflect" 1 2)); desc_ru="Корона шквала. Щит и reflect." }
  @{ part="back"; name_ru="Щит-вихрь"; name_en="Vortex Guard"; cost=1; atk=0; shield=3; heal=0; hits=0; targetRule="self"; tags=@("shield","taunt","buff"); ops=@((New-OpStatus "taunt" 1 2),(New-OpStatus "reflect" 1 2)); desc_ru="Вихрь на щите. Таунт и reflect." }
  @{ part="tail"; name_ru="Ответный порыв"; name_en="Reply Gust"; cost=1; atk=3; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","buff"); ops=@((New-OpStatus "reflect" 1 1)); desc_ru="Хвост бьёт и пульсирует отражением." }
)

# --- Fighter Fire ---
$Kits["fighter_fire"] = @(
  @{ part="eyes"; name_ru="Искрящий взгляд"; name_en="Spark Gaze"; cost=1; atk=3; shield=0; heal=0; hits=2; targetRule="nearest"; tags=@("attack"); ops=@((New-OpStatus "bleed" 1 2)); desc_ru="Двойной удар взглядом. Bleed." }
  @{ part="ears"; name_ru="Боевой слух"; name_en="Battle Ear"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","crit","ruffle"); ops=@(); desc_ru="Слышит ритм боя. Crit и ruffle." }
  @{ part="muzzle"; name_ru="Парный укус"; name_en="Twin Bite"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@((New-OpStatus "bleed" 2 2)); desc_ru="Парный укус. Сильный bleed." }
  @{ part="headwear"; name_ru="Корона искр"; name_en="Spark Crown"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","crit"); ops=@(); desc_ru="Корона искр. Crit-удар." }
  @{ part="back"; name_ru="Двойной удар"; name_en="Double Strike"; cost=2; atk=4; shield=0; heal=0; hits=2; targetRule="nearest"; tags=@("attack","crit"); ops=@(); desc_ru="Два тяжёлых удара с crit." }
  @{ part="tail"; name_ru="Хлыст жара"; name_en="Heat Whip"; cost=1; atk=6; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@((New-OpStatus "bleed" 1 2)); desc_ru="Хлыст жара. Урон и bleed." }
)

# --- Fighter Water ---
$Kits["fighter_water"] = @(
  @{ part="eyes"; name_ru="Тяжёлый взор"; name_en="Heavy Gaze"; cost=1; atk=6; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@((New-OpStatus "bleed" 1 2)); desc_ru="Тяжёлый взгляд. Большой урон." }
  @{ part="ears"; name_ru="Рёв стали-воды"; name_en="Steelwater Roar"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@((New-OpStatus "fragile" 1 2)); desc_ru="Рёв ломает броню. Fragile." }
  @{ part="muzzle"; name_ru="Молот прилива"; name_en="Tide Hammer"; cost=2; atk=8; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@(); desc_ru="Молот прилива. Сокрушительный удар." }
  @{ part="headwear"; name_ru="Шлем вала"; name_en="Surge Helm"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@((New-OpStatus "bleed" 1 2)); desc_ru="Шлем вала. Урон и bleed." }
  @{ part="back"; name_ru="Двуручный шквал"; name_en="Twohand Squall"; cost=1; atk=6; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@((New-OpStatus "fragile" 1 2)); desc_ru="Двуручный шквал. Урон и fragile." }
  @{ part="tail"; name_ru="Добивающий вал"; name_en="Finishing Wave"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","backline"); ops=@(); desc_ru="Вал в тыл. Добивание саппорта." }
)

# --- Fighter Wind ---
$Kits["fighter_wind"] = @(
  @{ part="eyes"; name_ru="Взор порыва"; name_en="Gust Gaze"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@(); desc_ru="Порыв бьёт ближайшего." }
  @{ part="ears"; name_ru="Слух строя"; name_en="Line Ear"; cost=1; atk=3; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe"); ops=@(); desc_ru="Слышит весь строй. Малый AoE." }
  @{ part="muzzle"; name_ru="Клык вихря"; name_en="Vortex Fang"; cost=1; atk=6; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@(); desc_ru="Клык вихря. Чистый ST-удар." }
  @{ part="headwear"; name_ru="Лента ветра"; name_en="Wind Ribbon"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Лента ветра. Урон и weak." }
  @{ part="back"; name_ru="Ветряной размах"; name_en="Wind Sweep"; cost=2; atk=3; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe"); ops=@(); desc_ru="Размах по всем. AoE + дожим фронта в описании." }
  @{ part="tail"; name_ru="Финальный порыв"; name_en="Final Gust"; cost=1; atk=7; shield=0; heal=0; hits=1; targetRule="lowest_hp"; tags=@("attack"); ops=@(); desc_ru="Добивает цель с наименьшим HP." }
)

# --- Assassin Fire ---
$Kits["assassin_fire"] = @(
  @{ part="eyes"; name_ru="Глаза мглы-жара"; name_en="Ember Haze Eyes"; cost=1; atk=3; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "stun" 1 1)); desc_ru="Взгляд мглы. Короткий stun." }
  @{ part="ears"; name_ru="Шёпот искр"; name_en="Spark Whisper"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "poison" 1 0)); desc_ru="Шёпот искр. Poison." }
  @{ part="muzzle"; name_ru="Теневой укус"; name_en="Shadow Bite"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","crit"); ops=@(); desc_ru="Укус из тени. Crit." }
  @{ part="headwear"; name_ru="Маска угля"; name_en="Coal Mask"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","buff"); ops=@((New-OpStatus "stealth" 1 1)); desc_ru="Маска угля. Stealth после удара." }
  @{ part="back"; name_ru="Удар из тени"; name_en="Shadow Strike"; cost=1; atk=6; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","crit"); ops=@((New-OpStatus "stealth" 1 1)); desc_ru="Удар из тени. Crit и stealth." }
  @{ part="tail"; name_ru="Исчезновение"; name_en="Vanish"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","buff"); ops=@((New-OpStatus "stealth" 1 1)); desc_ru="Удар и исчезновение. Stealth." }
)

# --- Assassin Water ---
$Kits["assassin_water"] = @(
  @{ part="eyes"; name_ru="Прицел в спину"; name_en="Back Aim"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","crit","backline"); ops=@((New-OpStatus "poison" 1 0)); desc_ru="Прицел в тыл. Crit и poison." }
  @{ part="ears"; name_ru="Слух тыла"; name_en="Rear Ear"; cost=1; atk=3; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","backline","debuff"); ops=@((New-OpStatus "stun" 1 1)); desc_ru="Слышит тыл. Stun саппорту." }
  @{ part="muzzle"; name_ru="Укол прилива"; name_en="Tide Stab"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","backline","debuff"); ops=@((New-OpStatus "poison" 2 0)); desc_ru="Укол прилива. Сильный poison в тыл." }
  @{ part="headwear"; name_ru="Капюшон пены"; name_en="Foam Hood"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","crit","backline"); ops=@(); desc_ru="Капюшон пены. Crit в тыл." }
  @{ part="back"; name_ru="Казнь сзади"; name_en="Rear Execute"; cost=2; atk=6; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","crit","backline"); ops=@(); desc_ru="Казнь сзади. Тяжёлый crit по тылу." }
  @{ part="tail"; name_ru="Тихий разряд"; name_en="Quiet Discharge"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","backline","debuff"); ops=@((New-OpStatus "poison" 1 0)); desc_ru="Тихий разряд. Урон и poison в тыл." }
)

# --- Assassin Wind ---
$Kits["assassin_wind"] = @(
  @{ part="eyes"; name_ru="Глаза сквозняка"; name_en="Draft Eyes"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="random_enemy"; tags=@("attack","debuff"); ops=@((New-OpStatus "poison" 2 0)); desc_ru="Яд по случайной цели. Игнор taunt." }
  @{ part="ears"; name_ru="Слух роя"; name_en="Swarm Ear"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="random_enemy"; tags=@("attack","debuff"); ops=@((New-OpStatus "poison" 1 0)); desc_ru="Слышит рой. Случайный poison." }
  @{ part="muzzle"; name_ru="Ядовитый порыв"; name_en="Venom Gust"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "poison" 2 0)); desc_ru="Порыв по фронту. Сильный poison." }
  @{ part="headwear"; name_ru="Маска пыльцы"; name_en="Pollen Mask"; cost=1; atk=2; shield=0; heal=0; hits=1; targetRule="random_enemy"; tags=@("attack","debuff"); ops=@((New-OpStatus "poison" 2 0)); desc_ru="Пыльца на случайного. Урон + poison." }
  @{ part="back"; name_ru="Шквал яда"; name_en="Poison Squall"; cost=2; atk=3; shield=0; heal=0; hits=2; targetRule="random_enemy"; tags=@("attack","debuff"); ops=@((New-OpStatus "poison" 1 0)); desc_ru="Два случайных укуса яда." }
  @{ part="tail"; name_ru="Хвост-зараз"; name_en="Plague Tail"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="random_enemy"; tags=@("attack","debuff"); ops=@((New-OpStatus "poison" 2 0)); desc_ru="Хвост разносит яд. Random + poison." }
)

# --- Ranger Fire ---
$Kits["ranger_fire"] = @(
  @{ part="eyes"; name_ru="Глаз добычи"; name_en="Prey Eye"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="lowest_hp"; tags=@("attack","ambush","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Глаз добычи. Lowest HP, ambush, weak." }
  @{ part="ears"; name_ru="Уши засады"; name_en="Ambush Ears"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","ambush"); ops=@((New-OpStatus "bleed" 1 2)); desc_ru="Засада на фронт. Ambush и bleed." }
  @{ part="muzzle"; name_ru="Выстрел жара"; name_en="Heat Shot"; cost=1; atk=6; shield=0; heal=0; hits=1; targetRule="lowest_hp"; tags=@("attack","ambush"); ops=@(); desc_ru="Выстрел жара по weakest. Ambush." }
  @{ part="headwear"; name_ru="Капюшон охоты"; name_en="Hunt Hood"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="lowest_hp"; tags=@("attack","crit"); ops=@(); desc_ru="Капюшон охоты. Crit по weakest." }
  @{ part="back"; name_ru="Огненная стрела"; name_en="Fire Arrow"; cost=1; atk=6; shield=0; heal=0; hits=1; targetRule="lowest_hp"; tags=@("attack","ambush"); ops=@(); desc_ru="Огненная стрела. Ambush finish." }
  @{ part="tail"; name_ru="Добивание"; name_en="Finish Off"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="lowest_hp"; tags=@("attack","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Добивание weakest. Weak." }
)

# --- Ranger Water ---
$Kits["ranger_water"] = @(
  @{ part="eyes"; name_ru="Широкий взор"; name_en="Wide Gaze"; cost=1; atk=2; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Широкий взор. AoE и weak." }
  @{ part="ears"; name_ru="Дальний слух"; name_en="Far Ear"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="lowest_hp"; tags=@("attack"); ops=@(); desc_ru="Дальний слух. Удар по weakest." }
  @{ part="muzzle"; name_ru="Град капель"; name_en="Drop Volley"; cost=2; atk=3; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe"); ops=@(); desc_ru="Град капель. Сильный AoE." }
  @{ part="headwear"; name_ru="Обруч прилива"; name_en="Tide Circlet"; cost=1; atk=2; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe"); ops=@((New-OpStatus "bleed" 1 2)); desc_ru="Обруч прилива. AoE bleed." }
  @{ part="back"; name_ru="Волна стрел"; name_en="Arrow Wave"; cost=2; atk=3; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Волна стрел. AoE и weak." }
  @{ part="tail"; name_ru="Стрела-якорь"; name_en="Anchor Arrow"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@(); desc_ru="Якорная стрела во фронт." }
)

# --- Ranger Wind ---
$Kits["ranger_wind"] = @(
  @{ part="eyes"; name_ru="Метка ветра"; name_en="Wind Mark"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "vuln" 1 2)); desc_ru="Метка ветра. Vuln на цель (окно focus)." }
  @{ part="ears"; name_ru="Слух цели"; name_en="Target Ear"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="lowest_hp"; tags=@("attack","ambush"); ops=@(); desc_ru="Слух цели. Ambush по weakest." }
  @{ part="muzzle"; name_ru="Пронзающий свист"; name_en="Piercing Whistle"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","pierce"); ops=@(); desc_ru="Пронзающий свист. Pierce." }
  @{ part="headwear"; name_ru="Перо следопыта"; name_en="Tracker Feather"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","pierce","backline"); ops=@(); desc_ru="Перо следопыта. Pierce в тыл." }
  @{ part="back"; name_ru="Стрела-шквал"; name_en="Squall Arrow"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","pierce","backline","debuff"); ops=@((New-OpStatus "vuln" 1 2)); desc_ru="Стрела-шквал. Pierce + метка в тыл." }
  @{ part="tail"; name_ru="Финальный свист"; name_en="Final Whistle"; cost=1; atk=6; shield=0; heal=0; hits=1; targetRule="lowest_hp"; tags=@("attack","pierce"); ops=@(); desc_ru="Финальный свист. Pierce finish." }
)

# --- Mage Fire ---
$Kits["mage_fire"] = @(
  @{ part="eyes"; name_ru="Пламенный зрачок"; name_en="Flame Pupil"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "vuln" 1 2)); desc_ru="Пламенный зрачок. Vuln для burst." }
  @{ part="ears"; name_ru="Треск искр"; name_en="Spark Crack"; cost=1; atk=3; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","crit","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Треск искр. Crit и weak." }
  @{ part="muzzle"; name_ru="Огненный шар"; name_en="Fireball"; cost=2; atk=3; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe","debuff"); ops=@((New-OpStatus "vuln" 1 2)); desc_ru="Огненный шар. AoE и vuln." }
  @{ part="headwear"; name_ru="Корона углей"; name_en="Cinder Crown"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Корона углей. Урон и weak." }
  @{ part="back"; name_ru="Волна жара"; name_en="Heat Wave"; cost=2; atk=3; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe","crit"); ops=@(); desc_ru="Волна жара. AoE crit." }
  @{ part="tail"; name_ru="Искра дожатия"; name_en="Finish Spark"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@(); desc_ru="Искра дожатия. ST finish." }
)

# --- Mage Water ---
$Kits["mage_water"] = @(
  @{ part="eyes"; name_ru="Ледяной взор"; name_en="Ice Gaze"; cost=2; atk=2; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "stun" 1 1)); desc_ru="Ледяной взор. Freeze (stun)." }
  @{ part="ears"; name_ru="Холодный слух"; name_en="Cold Ear"; cost=1; atk=3; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "weak" 2 2)); desc_ru="Холодный слух. Сильный weak." }
  @{ part="muzzle"; name_ru="Морозный укус"; name_en="Frost Bite"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "stun" 1 1)); desc_ru="Морозный укус. Stun." }
  @{ part="headwear"; name_ru="Корона льда-воды"; name_en="Icewater Crown"; cost=1; atk=2; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Корона льда. AoE weak." }
  @{ part="back"; name_ru="Буря льда"; name_en="Ice Storm"; cost=2; atk=2; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe","debuff"); ops=@((New-OpStatus "stun" 1 1)); desc_ru="Буря льда. AoE; stun на primary." }
  @{ part="tail"; name_ru="Стылый хвост"; name_en="Chill Tail"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Стылый хвост. Урон и weak." }
)

# --- Mage Wind ---
$Kits["mage_wind"] = @(
  @{ part="eyes"; name_ru="Взор молнии-ветра"; name_en="Stormbolt Gaze"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Взор молнии. Урон и weak." }
  @{ part="ears"; name_ru="Слух грозы"; name_en="Thunder Ear"; cost=1; atk=3; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","debuff"); ops=@((New-OpStatus "stun" 1 1)); desc_ru="Слух грозы. Короткий stun." }
  @{ part="muzzle"; name_ru="Разряд"; name_en="Discharge"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack"); ops=@(); desc_ru="Чистый разряд. ST-удар." }
  @{ part="headwear"; name_ru="Обруч шквала"; name_en="Squall Band"; cost=1; atk=2; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe"); ops=@(); desc_ru="Обруч шквала. Малый AoE." }
  @{ part="back"; name_ru="Цепной порыв"; name_en="Chain Gust"; cost=2; atk=5; shield=0; heal=0; hits=1; targetRule="all_enemies"; tags=@("attack","aoe"); ops=@(); desc_ru="Цепной порыв. Primary сильный, splash 50%." }
  @{ part="tail"; name_ru="Хвост-разряд"; name_en="Tail Bolt"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="backline"; tags=@("attack","backline","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Разряд в тыл. Weak." }
)

# --- Support Fire ---
$Kits["support_fire"] = @(
  @{ part="eyes"; name_ru="Целительный жар"; name_en="Healing Ember"; cost=1; atk=0; shield=0; heal=7; hits=0; targetRule="ally_lowest_hp"; tags=@("heal"); ops=@((New-OpHeal 7)); desc_ru="Целительный жар. Heal слабому." }
  @{ part="ears"; name_ru="Тёплый слух"; name_en="Warm Ear"; cost=1; atk=0; shield=0; heal=6; hits=0; targetRule="ally_lowest_hp"; tags=@("heal"); ops=@((New-OpHeal 6)); desc_ru="Тёплый слух. Heal." }
  @{ part="muzzle"; name_ru="Поцелуй угля"; name_en="Coal Kiss"; cost=1; atk=0; shield=0; heal=5; hits=0; targetRule="ally_lowest_hp"; tags=@("heal"); ops=@((New-OpHeal 5)); desc_ru="Поцелуй угля. Heal." }
  @{ part="headwear"; name_ru="Корона заботы"; name_en="Care Crown"; cost=1; atk=0; shield=0; heal=5; hits=0; targetRule="ally_lowest_hp"; tags=@("heal","buff"); ops=@((New-OpHeal 5),(New-OpCleanse 1)); desc_ru="Корона заботы. Heal и cleanse." }
  @{ part="back"; name_ru="Волна тепла"; name_en="Warm Wave"; cost=2; atk=0; shield=0; heal=3; hits=0; targetRule="ally_all"; tags=@("heal"); ops=@((New-OpHeal 3)); desc_ru="Волна тепла. Heal всей команде." }
  @{ part="tail"; name_ru="Праведный ожог"; name_en="Righteous Burn"; cost=1; atk=5; shield=0; heal=4; hits=1; targetRule="nearest"; tags=@("attack","heal"); ops=@((New-OpHeal 4 "self")); desc_ru="Smite: урон врагу и heal себе." }
)

# --- Support Water ---
$Kits["support_water"] = @(
  @{ part="eyes"; name_ru="Целительный взгляд"; name_en="Healing Gaze"; cost=1; atk=0; shield=0; heal=6; hits=0; targetRule="ally_lowest_hp"; tags=@("heal"); ops=@((New-OpHeal 6)); desc_ru="Целительный взгляд. Heal слабому." }
  @{ part="ears"; name_ru="Уши очищения"; name_en="Cleanse Ears"; cost=1; atk=0; shield=0; heal=4; hits=0; targetRule="ally_lowest_hp"; tags=@("heal","buff"); ops=@((New-OpHeal 4),(New-OpCleanse 2)); desc_ru="Уши очищения. Heal и сильный cleanse." }
  @{ part="muzzle"; name_ru="Капля жизни"; name_en="Life Drop"; cost=1; atk=0; shield=0; heal=5; hits=0; targetRule="ally_lowest_hp"; tags=@("heal"); ops=@((New-OpHeal 5)); desc_ru="Капля жизни. Heal." }
  @{ part="headwear"; name_ru="Чистый родник"; name_en="Clear Spring"; cost=1; atk=0; shield=0; heal=5; hits=0; targetRule="ally_lowest_hp"; tags=@("heal","buff"); ops=@((New-OpHeal 5),(New-OpCleanse 1)); desc_ru="Чистый родник. Heal и cleanse." }
  @{ part="back"; name_ru="Волна опеки"; name_en="Care Wave"; cost=2; atk=0; shield=0; heal=3; hits=0; targetRule="ally_all"; tags=@("heal","buff"); ops=@((New-OpHeal 3),(New-OpCleanse 1)); desc_ru="Волна опеки. Heal all + cleanse." }
  @{ part="tail"; name_ru="Очищающий удар"; name_en="Cleansing Strike"; cost=1; atk=4; shield=0; heal=0; hits=1; targetRule="nearest"; tags=@("attack","buff"); ops=@((New-OpCleanse 1)); desc_ru="Удар и очищение союзника/себя." }
)

# --- Support Wind ---
$Kits["support_wind"] = @(
  @{ part="eyes"; name_ru="Вдохновляющий взор"; name_en="Inspire Gaze"; cost=1; atk=0; shield=0; heal=0; hits=0; targetRule="ally_lowest_hp"; tags=@("buff"); ops=@((New-OpBuff "atk" 2 2)); desc_ru="Вдохновляющий взор. ATK buff союзнику." }
  @{ part="ears"; name_ru="Шёпот ветра"; name_en="Wind Whisper"; cost=1; atk=3; shield=0; heal=3; hits=1; targetRule="nearest"; tags=@("attack","heal","debuff"); ops=@((New-OpHeal 3 "self"),(New-OpStatus "weak" 1 2)); desc_ru="Шёпот ветра. Урон+weak врагу, heal себе." }
  @{ part="muzzle"; name_ru="Дыхание силы"; name_en="Breath of Power"; cost=1; atk=0; shield=4; heal=5; hits=0; targetRule="ally_lowest_hp"; tags=@("heal","shield"); ops=@((New-OpHeal 5)); desc_ru="Дыхание силы. Heal и малый щит." }
  @{ part="headwear"; name_ru="Лента попутного"; name_en="Tailwind Ribbon"; cost=1; atk=0; shield=0; heal=5; hits=0; targetRule="ally_lowest_hp"; tags=@("heal"); ops=@((New-OpHeal 5)); desc_ru="Лента попутного. Heal." }
  @{ part="back"; name_ru="Попутный шквал"; name_en="Tailwind Squall"; cost=2; atk=0; shield=0; heal=3; hits=0; targetRule="ally_all"; tags=@("heal","buff"); ops=@((New-OpHeal 3),(New-OpBuff "atk" 1 2)); desc_ru="Попутный шквал. Heal all + ATK buff." }
  @{ part="tail"; name_ru="Добивающий порыв"; name_en="Finishing Gust"; cost=1; atk=5; shield=0; heal=0; hits=1; targetRule="lowest_hp"; tags=@("attack","debuff"); ops=@((New-OpStatus "weak" 1 2)); desc_ru="Добивающий порыв. Weak finish." }
)

function Get-ControlWeight($c) {
  $w = 0.0
  foreach ($t in $c.tags) {
    switch ($t) {
      "taunt" { $w += 3 }
      "pierce" { $w += 1 }
      "crit" { $w += 1 }
      "ambush" { $w += 0.5 }
      "aoe" { $w += 1.5 }
      "backline" { $w += 0.5 }
      "ruffle" { $w += 0.5 }
    }
  }
  foreach ($op in $c.ops) {
    $st = $op.status
    $stacks = if ($op.stacks) { [double]$op.stacks } else { 1 }
    $amt = if ($op.amount) { [double]$op.amount } else { 0 }
    switch ($op.op) {
      "apply_status" {
        switch ($st) {
          "stun" { $w += 4 * $stacks }
          "taunt" { $w += 3 }
          "weak" { $w += 1.5 * $stacks }
          "vuln" { $w += 2 * $stacks }
          "fragile" { $w += 2 * $stacks }
          "poison" { $w += 1.5 * $stacks }
          "bleed" { $w += 1.5 * $stacks }
          "stealth" { $w += 2 }
          "reflect" { $w += 2 * $stacks }  # PvE-skewed; lower PvP weight
        }
      }
      "cleanse" { $w += 2 * [Math]::Max(1, $amt) }
      "buff" { $w += 2 * $amt }
    }
  }
  # AoE effective atk contribution already via tag; multi-hit
  return $w
}

function Get-CardPower($c) {
  $hits = if ($c.hits -gt 0) { $c.hits } else { 1 }
  $atkEff = [double]$c.atk * $hits
  if ($c.targetRule -eq "all_enemies") {
    # primary + ~2 secondaries at 50%
    $atkEff = [double]$c.atk * 2.0
  }
  $heal = [double]$c.heal
  if ($c.targetRule -eq "ally_all" -and $heal -gt 0) { $heal = $heal * 3 }
  $shield = [double]$c.shield
  $ctrl = Get-ControlWeight $c
  return [Math]::Round($atkEff + $shield + ($heal * 0.9) + $ctrl, 2)
}

$AllCards = @()
$Cats = @()
$Parts = @()
$I18n = [ordered]@{}
$KitPowers = [ordered]@{}

foreach ($heroId in $Kits.Keys) {
  # NOTE: do not use $parts — PowerShell is case-insensitive and would clobber $Parts[]
  $heroBits = $heroId -split "_"
  $role = $heroBits[0]
  $element = $heroBits[1]
  $templateId = "shop_${role}_${element}"
  $kit = $Kits[$heroId]
  $kitPower = 0.0
  $partMap = [ordered]@{}
  $heroDir = Join-Path $PreviewDir $heroId
  New-Item -ItemType Directory -Force -Path $heroDir | Out-Null

  foreach ($c in $kit) {
    $stem = "${role}_${element}_$($c.part)"
    $cardId = "card_shop_$stem"
    $partId = "part_shop_$stem"
    $nameKey = "card.shop_$stem"
    $power = Get-CardPower $c
    $kitPower += $power

    $cardObj = [ordered]@{
      cost = [int]$c.cost
      atk = [int]$c.atk
      shield = [int]$c.shield
      hits = [int]$c.hits
      targetRule = $c.targetRule
      tags = @($c.tags)
      effectOps = @($c.ops)
      cardId = $cardId
      name_key = $nameKey
      roleGate = $role
      element = $element
    }
    # heal is tracked in effectOps; keep manifest field only
    $cardJson = $cardObj | ConvertTo-Json -Depth 8
    $cardPath = Join-Path $CardsDir "shop_${stem}.json"
    Set-Content -Path $cardPath -Value $cardJson -Encoding UTF8

    $partObj = [ordered]@{
      partId = $partId
      slot = $c.part
      element = $element
      cardId = $cardId
      passiveOps = @()
      artKey = "part.shop_${role}_${element}.$($c.part)"
      rarity = "common"
    }
    $Parts += $partObj
    $partMap[$c.part] = $partId

    $I18n[$nameKey] = [ordered]@{ ru = $c.name_ru; en = $c.name_en }

    $AllCards += [ordered]@{
      cardId = $cardId
      heroId = $heroId
      templateId = $templateId
      part = $c.part
      name_ru = $c.name_ru
      name_en = $c.name_en
      desc_ru = $c.desc_ru
      cost = $c.cost
      atk = $c.atk
      shield = $c.shield
      heal = $c.heal
      hits = $c.hits
      targetRule = $c.targetRule
      tags = $c.tags
      card_power = $power
      chrome = "card_frame_${element}.jpg"
      artFile = "attack_${role}_${element}_$($c.part).jpg"
      CLASS_RU = $CLASS_RU[$role]
    }
  }

  $stats = $BaseStats[$heroId]
  $Cats += [ordered]@{
    templateId = $templateId
    role = $role
    element = $element
    level = 1
    baseStats = [ordered]@{
      hp = $stats.hp; atk = $stats.atk; spd = $stats.spd; skill = $stats.skill; charm = $stats.charm
    }
    parts = $partMap
    rarity = "common"
    origin = "shop"
    archetype = $heroId
  }
  $KitPowers[$heroId] = [Math]::Round($kitPower, 2)
}

# Balance check ±5%
$powers = @($KitPowers.Values)
$avg = ($powers | Measure-Object -Average).Average
$min = ($powers | Measure-Object -Minimum).Minimum
$max = ($powers | Measure-Object -Maximum).Maximum
  # ±5% of average (inclusive with tiny float slack)
  $bandOk = ($max - $avg) / $avg -le 0.051 -and ($avg - $min) / $avg -le 0.051

# Team power: tank + dps + support
$DpsRoles = @("fighter","assassin","ranger","mage")
$Tanks = @("tank_fire","tank_water","tank_wind")
$Supports = @("support_fire","support_water","support_wind")
$Dps = @()
foreach ($r in $DpsRoles) { foreach ($e in @("fire","water","wind")) { $Dps += "${r}_${e}" } }

$Teams = @()
foreach ($t in $Tanks) {
  foreach ($d in $Dps) {
    foreach ($s in $Supports) {
      $tp = $KitPowers[$t] + $KitPowers[$d] + $KitPowers[$s]
      $Teams += [ordered]@{
        tank = $t; dps = $d; support = $s
        team_power = [Math]::Round($tp, 2)
        team = @("shop_$($t -replace '_','_' -replace '^','')" ) # placeholder fixed below
      }
    }
  }
}
# Fix team template ids
$Teams = @()
foreach ($t in $Tanks) {
  foreach ($d in $Dps) {
    foreach ($s in $Supports) {
      $tp = $KitPowers[$t] + $KitPowers[$d] + $KitPowers[$s]
      $Teams += [ordered]@{
        tank = "shop_$t"
        dps = "shop_$d"
        support = "shop_$s"
        team_power = [Math]::Round($tp, 2)
      }
    }
  }
}
$teamPowers = @($Teams.team_power)
$teamAvg = ($teamPowers | Measure-Object -Average).Average
$teamMin = ($teamPowers | Measure-Object -Minimum).Minimum
$teamMax = ($teamPowers | Measure-Object -Maximum).Maximum
$teamBandOk = ($teamMax - $teamAvg) / $teamAvg -le 0.05 -and ($teamAvg - $teamMin) / $teamAvg -le 0.05

$balance = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  kit_count = $KitPowers.Count
  card_count = $AllCards.Count
  kit_powers = $KitPowers
  kit_power_avg = [Math]::Round($avg, 2)
  kit_power_min = $min
  kit_power_max = $max
  kit_band_ok_pm5 = $bandOk
  team_count = $Teams.Count
  team_power_avg = [Math]::Round($teamAvg, 2)
  team_power_min = $teamMin
  team_power_max = $teamMax
  team_band_ok_pm5 = $teamBandOk
  weakest_kits = @($KitPowers.GetEnumerator() | Sort-Object Value | Select-Object -First 3 | ForEach-Object { "$($_.Key)=$($_.Value)" })
  strongest_kits = @($KitPowers.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 3 | ForEach-Object { "$($_.Key)=$($_.Value)" })
  sample_teams = @($Teams | Sort-Object team_power | Select-Object -First 3) + @($Teams | Sort-Object team_power -Descending | Select-Object -First 3)
}

$Cats | ConvertTo-Json -Depth 8 | Set-Content -Path $CatsPath -Encoding UTF8
$Parts | ConvertTo-Json -Depth 6 | Set-Content -Path $PartsPath -Encoding UTF8
$AllCards | ConvertTo-Json -Depth 8 | Set-Content -Path $ManifestPath -Encoding UTF8
$balance | ConvertTo-Json -Depth 8 | Set-Content -Path $BalancePath -Encoding UTF8
$I18n | ConvertTo-Json -Depth 4 | Set-Content -Path $I18nPatchPath -Encoding UTF8

Write-Host "ROOT=$Root"
Write-Host "Cards=$($AllCards.Count) Kits=$($KitPowers.Count) Teams=$($Teams.Count)"
Write-Host "Kit power: avg=$([Math]::Round($avg,2)) min=$min max=$max band5%=$bandOk"
Write-Host "Team power: avg=$([Math]::Round($teamAvg,2)) min=$teamMin max=$teamMax band5%=$teamBandOk"
Write-Host "Wrote $CatsPath"
Write-Host "Wrote $PartsPath"
Write-Host "Wrote $ManifestPath"
Write-Host "Wrote $BalancePath"
