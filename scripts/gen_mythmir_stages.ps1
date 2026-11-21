$ErrorActionPreference = 'Stop'
$OUT = Join-Path $PSScriptRoot '..\content\stages'

function New-Card($cid, $name, $element, $cost, $atk=0, $shield=0, $hits=$null, $rule='nearest', $tags=@(), $ops=@()) {
  if ($null -eq $hits) { $hits = if ($atk -gt 0) { 1 } else { 0 } }
  [ordered]@{
    cardId=$cid; name_key=$name; element=$element; cost=$cost; atk=$atk; shield=$shield; hits=$hits
    targetRule=$rule; tags=@($tags); effectOps=@($ops)
  }
}
function New-Unit($tid,$role,$element,$level,$hp,$atk,$spd,$skill,$deck,$display,$faction,$pitboss=$false) {
  [ordered]@{
    templateId=$tid; role=$role; element=$element; level=$level
    baseStats=[ordered]@{hp=$hp;atk=$atk;spd=$spd;skill=$skill;charm=1}
    deck=@($deck)
    meta=[ordered]@{display_ru=$display;faction=$faction;isPitboss=$pitboss}
  }
}
function New-Empty($tid,$element,$faction) {
  $deck = 0..3 | ForEach-Object { New-Card "card_empty_${tid}_$_" 'card.bot_empty' $element 1 -tags @('shield') }
  [ordered]@{
    templateId=$tid; role='tank'; element=$element; level=1
    baseStats=[ordered]@{hp=1;atk=0;spd=1;skill=0;charm=0}
    deck=@($deck)
    meta=[ordered]@{display_ru='—';faction=$faction;isPitboss=$false;emptyLane=$true;startDead=$true}
  }
}
function Write-Stage($sid,$ch,$team,$title,$fight,$faction,$theme,$loc,$tactic) {
  $fightIndex = [int]($sid -split '_f')[1]
  $obj = [ordered]@{
    stageId=$sid; chapter=$ch; name_key="stage.$sid"; bowlCost=1
    enemyTeam=@($team)
    meta=[ordered]@{
      stageIndex=$ch; fightIndex=$fightIndex; title_ru=$title; fight_ru=$fight
      faction=$faction; waveTheme=$theme; location_ru=$loc; tactic_ru=$tactic
    }
  }
  $json = $obj | ConvertTo-Json -Depth 12
  $path = Join-Path $OUT "$sid.json"
  [System.IO.File]::WriteAllText($path, $json + "`n", [System.Text.UTF8Encoding]::new($false))
  Write-Host "wrote $sid"
}

# ===== Ch1 dogs =====
$el='stone'; $fac='dogs'
function Dog-Fighter($tid,$hp=28,$atk=5) {
  New-Unit $tid 'fighter' $el 1 $hp $atk 4 2 @(
    (New-Card "${tid}_a1" 'card.bot_dog_claw' $el 1 -atk $atk -tags @('attack')),
    (New-Card "${tid}_a2" 'card.bot_dog_claw' $el 1 -atk $atk -tags @('attack')),
    (New-Card "${tid}_a3" 'card.bot_dog_claw' $el 1 -atk ($atk+1) -tags @('attack')),
    (New-Card "${tid}_a4" 'card.bot_dog_claw' $el 1 -atk $atk -tags @('attack'))
  ) 'Пёс-боец' $fac
}
Write-Stage 'mythmir_1_f1' 1 @(
  (Dog-Fighter 'bot_dog_fighter_m1f1_a'), (Dog-Fighter 'bot_dog_fighter_m1f1_b'), (Dog-Fighter 'bot_dog_fighter_m1f1_c')
) 'Железная Цитадель' 'Три бойца' $fac 'three_fighters' 'Железная Цитадель' 'Три бойца; nearest.'

$tank = New-Unit 'bot_dog_tank_m1f2' 'tank' $el 1 36 4 2 1 @(
  (New-Card 'card_dog_bark_m1f2' 'card.bot_dog_bark' $el 1 -shield 7 -tags @('shield') -ops @(@{op='apply_status';status='taunt';stacks=1;duration=2})),
  (New-Card 'card_dog_bark2_m1f2' 'card.bot_dog_bark' $el 1 -shield 6 -tags @('shield') -ops @(@{op='apply_status';status='taunt';stacks=1;duration=2})),
  (New-Card 'card_dog_bite_m1f2' 'card.bot_dog_bite' $el 1 -atk 4 -tags @('attack')),
  (New-Card 'card_dog_bite2_m1f2' 'card.bot_dog_bite' $el 1 -atk 4 -tags @('attack'))
) 'Пёс-щитоносец' $fac
function Dog-Ranger($tid) {
  New-Unit $tid 'ranger' $el 1 26 5 5 2 @(
    (New-Card "${tid}_s1" 'card.bot_dog_shot' $el 1 -atk 5 -rule 'center' -tags @('attack')),
    (New-Card "${tid}_s2" 'card.bot_dog_shot' $el 1 -atk 5 -rule 'center' -tags @('attack')),
    (New-Card "${tid}_s3" 'card.bot_dog_shot' $el 1 -atk 6 -rule 'center' -tags @('attack')),
    (New-Card "${tid}_s4" 'card.bot_dog_shot' $el 1 -atk 5 -rule 'center' -tags @('attack'))
  ) 'Пёс-лучник' $fac
}
Write-Stage 'mythmir_1_f2' 1 @($tank, (Dog-Ranger 'bot_dog_ranger_m1f2_a'), (Dog-Ranger 'bot_dog_ranger_m1f2_b')) 'Железная Цитадель' 'Танк + лучники' $fac 'tank_two_rangers' 'Железная Цитадель' 'Танк + 2 лучника.'

$boss = New-Unit 'bot_pitboss_dog_baron_m1f3' 'fighter' $el 1 110 3 4 3 @(
  (New-Card 'card_dog_pierce_m1f3' 'card.bot_dog_pierce' $el 1 -atk 3 -tags @('attack','pierce')),
  (New-Card 'card_dog_pierce2_m1f3' 'card.bot_dog_pierce' $el 1 -atk 3 -tags @('attack','pierce')),
  (New-Card 'card_dog_pierce3_m1f3' 'card.bot_dog_pierce' $el 1 -atk 3 -tags @('attack','pierce') -ops @(@{op='apply_status';status='fragile';stacks=1;duration=2})),
  (New-Card 'card_dog_crush_m1f3' 'card.bot_dog_crush' $el 1 -atk 4 -tags @('attack','pierce'))
) 'Барон Гав' $fac $true
Write-Stage 'mythmir_1_f3' 1 @($boss, (New-Empty 'bot_empty_lane_m1f3_a' $el $fac), (New-Empty 'bot_empty_lane_m1f3_b' $el $fac)) 'Железная Цитадель' 'Питбосс спереди' $fac 'solo_boss_front' 'Железная Цитадель' 'Соло-босс фронт.'

# ===== Ch2 wolves =====
$el='ice'; $fac='wolves'
$fighter = New-Unit 'bot_wolf_fighter_m2f1' 'fighter' $el 2 30 5 4 2 @(
  (New-Card 'card_wolf_claw_m2f1' 'card.bot_wolf_claw' $el 1 -atk 5 -tags @('attack')),
  (New-Card 'card_wolf_claw2_m2f1' 'card.bot_wolf_claw' $el 1 -atk 5 -tags @('attack')),
  (New-Card 'card_wolf_claw3_m2f1' 'card.bot_wolf_claw' $el 1 -atk 6 -tags @('attack')),
  (New-Card 'card_wolf_claw4_m2f1' 'card.bot_wolf_claw' $el 1 -atk 5 -tags @('attack'))
) 'Волк-боец' $fac
$heal = New-Unit 'bot_wolf_support_m2f1' 'support' $el 2 26 3 3 2 @(
  (New-Card 'card_wolf_sip_m2f1' 'card.bot_wolf_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=6})),
  (New-Card 'card_wolf_sip2_m2f1' 'card.bot_wolf_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=6})),
  (New-Card 'card_wolf_sip3_m2f1' 'card.bot_wolf_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=7})),
  (New-Card 'card_wolf_sip4_m2f1' 'card.bot_wolf_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=6}))
) 'Волк-хил' $fac
$ranger = New-Unit 'bot_wolf_ranger_m2f1' 'ranger' $el 2 27 5 5 2 @(
  (New-Card 'card_wolf_shot_m2f1' 'card.bot_wolf_shot' $el 1 -atk 5 -rule 'center' -tags @('attack')),
  (New-Card 'card_wolf_shot2_m2f1' 'card.bot_wolf_shot' $el 1 -atk 5 -rule 'center' -tags @('attack')),
  (New-Card 'card_wolf_shot3_m2f1' 'card.bot_wolf_shot' $el 1 -atk 6 -rule 'center' -tags @('attack')),
  (New-Card 'card_wolf_shot4_m2f1' 'card.bot_wolf_shot' $el 1 -atk 5 -rule 'center' -tags @('attack'))
) 'Волк-лучник' $fac
Write-Stage 'mythmir_2_f1' 2 @($fighter,$heal,$ranger) 'Ледяные Пещеры' 'Боец · хил · лучник' $fac 'fighter_heal_ranger' 'Ледяные Пещеры' 'Хил 1E; лучник center.'

function Wolf-Ranger($tid,$hp=29) {
  New-Unit $tid 'ranger' $el 2 $hp 6 5 2 @(
    (New-Card "${tid}_1" 'card.bot_wolf_shot' $el 1 -atk 6 -rule 'center' -tags @('attack')),
    (New-Card "${tid}_2" 'card.bot_wolf_shot' $el 1 -atk 6 -rule 'center' -tags @('attack')),
    (New-Card "${tid}_3" 'card.bot_wolf_shot' $el 1 -atk 7 -rule 'center' -tags @('attack')),
    (New-Card "${tid}_4" 'card.bot_wolf_shot' $el 1 -atk 6 -rule 'center' -tags @('attack'))
  ) 'Волк-лучник' $fac
}
Write-Stage 'mythmir_2_f2' 2 @(
  (Wolf-Ranger 'bot_wolf_ranger_m2f2_a'), (Wolf-Ranger 'bot_wolf_ranger_m2f2_b'), (Wolf-Ranger 'bot_wolf_ranger_m2f2_c')
) 'Ледяные Пещеры' 'Три лучника' $fac 'three_rangers' 'Ледяные Пещеры' 'Три лучника center+taunt.'

function Wolf-Heal($tid) {
  New-Unit $tid 'support' $el 2 28 3 3 2 @(
    (New-Card "${tid}_h1" 'card.bot_wolf_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=7})),
    (New-Card "${tid}_h2" 'card.bot_wolf_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=7})),
    (New-Card "${tid}_h3" 'card.bot_wolf_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=8})),
    (New-Card "${tid}_h4" 'card.bot_wolf_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=7}))
  ) 'Волк-хил' $fac
}
$boss = New-Unit 'bot_pitboss_wolf_alpha_m2f3' 'fighter' $el 2 62 6 5 3 @(
  (New-Card 'card_wolf_bite_m2f3' 'card.bot_wolf_leap' $el 1 -atk 7 -tags @('attack')),
  (New-Card 'card_wolf_bite2_m2f3' 'card.bot_wolf_leap' $el 1 -atk 7 -tags @('attack')),
  (New-Card 'card_wolf_bite3_m2f3' 'card.bot_wolf_pounce' $el 1 -atk 8 -tags @('attack','crit')),
  (New-Card 'card_wolf_rend_m2f3' 'card.bot_wolf_rend' $el 1 -atk 6 -tags @('attack') -ops @(@{op='apply_status';status='bleed';stacks=2;duration=2}))
) 'Лютый Клык' $fac $true
Write-Stage 'mythmir_2_f3' 2 @(
  (Wolf-Heal 'bot_wolf_support_m2f3_a'), $boss, (Wolf-Heal 'bot_wolf_support_m2f3_b')
) 'Ледяные Пещеры' 'Хил · босс · хил' $fac 'heal_boss_heal' 'Ледяные Пещеры' 'Хилы leftover; босс nearest+stun on taunt.'

# ===== Ch3 red dogs =====
$el='fire'; $fac='red_dogs'
function Redd-Fighter($tid,$hp=35) {
  New-Unit $tid 'fighter' $el 3 $hp 6 4 2 @(
    (New-Card "${tid}_1" 'card.bot_redd_claw' $el 1 -atk 6 -tags @('attack')),
    (New-Card "${tid}_2" 'card.bot_redd_claw' $el 1 -atk 6 -tags @('attack')),
    (New-Card "${tid}_3" 'card.bot_redd_claw' $el 1 -atk 7 -tags @('attack')),
    (New-Card "${tid}_4" 'card.bot_redd_claw' $el 1 -atk 6 -tags @('attack'))
  ) 'Алый боец' $fac
}
$tank = New-Unit 'bot_redd_tank_m3f1' 'tank' $el 3 42 4 2 1 @(
  (New-Card 'card_redd_taunt_m3f1' 'card.bot_redd_roar' $el 1 -shield 8 -tags @('shield') -ops @(@{op='apply_status';status='taunt';stacks=1;duration=2})),
  (New-Card 'card_redd_taunt2_m3f1' 'card.bot_redd_roar' $el 1 -shield 7 -tags @('shield') -ops @(@{op='apply_status';status='taunt';stacks=1;duration=2})),
  (New-Card 'card_redd_bash_m3f1' 'card.bot_redd_bite' $el 1 -atk 5 -tags @('attack')),
  (New-Card 'card_redd_bash2_m3f1' 'card.bot_redd_bite' $el 1 -atk 5 -tags @('attack'))
) 'Алый щитоносец' $fac
Write-Stage 'mythmir_3_f1' 3 @(
  (Redd-Fighter 'bot_redd_fighter_m3f1_a'), $tank, (Redd-Fighter 'bot_redd_fighter_m3f1_b')
) 'Алая Псарня' 'Боец · танк · боец' $fac 'fighter_tank_fighter' 'Алая Псарня' 'Боец·танк·боец.'

function Redd-Assassin($tid) {
  New-Unit $tid 'assassin' $el 3 34 6 6 2 @(
    (New-Card "${tid}_1" 'card.bot_redd_stab' $el 1 -atk 7 -rule 'backline' -tags @('attack','backline')),
    (New-Card "${tid}_2" 'card.bot_redd_stab' $el 1 -atk 7 -rule 'backline' -tags @('attack','backline')),
    (New-Card "${tid}_3" 'card.bot_redd_stab' $el 1 -atk 8 -rule 'center' -tags @('attack')),
    (New-Card "${tid}_4" 'card.bot_redd_stab' $el 1 -atk 7 -rule 'backline' -tags @('attack','backline'))
  ) 'Алый убийца' $fac
}
$tank2 = New-Unit 'bot_redd_tank_m3f2' 'tank' $el 3 44 4 2 1 @(
  (New-Card 'card_redd_taunt_m3f2' 'card.bot_redd_roar' $el 1 -shield 8 -tags @('shield') -ops @(@{op='apply_status';status='taunt';stacks=1;duration=2})),
  (New-Card 'card_redd_taunt2_m3f2' 'card.bot_redd_roar' $el 1 -shield 7 -tags @('shield') -ops @(@{op='apply_status';status='taunt';stacks=1;duration=2})),
  (New-Card 'card_redd_bash_m3f2' 'card.bot_redd_bite' $el 1 -atk 5 -tags @('attack')),
  (New-Card 'card_redd_bash2_m3f2' 'card.bot_redd_bite' $el 1 -atk 5 -tags @('attack'))
) 'Алый щитоносец' $fac
Write-Stage 'mythmir_3_f2' 3 @(
  (Redd-Assassin 'bot_redd_assassin_m3f2_a'), $tank2, (Redd-Assassin 'bot_redd_assassin_m3f2_b')
) 'Алая Псарня' 'Убийца · танк · убийца' $fac 'assassin_tank_assassin' 'Алая Псарня' 'Убийцы center/backline; таунт.'

function Redd-Flank($tid) {
  New-Unit $tid 'tank' $el 3 54 3 2 1 @(
    (New-Card "${tid}_t1" 'card.bot_redd_roar' $el 1 -shield 8 -tags @('shield') -ops @(@{op='apply_status';status='taunt';stacks=1;duration=2})),
    (New-Card "${tid}_t2" 'card.bot_redd_roar' $el 1 -shield 7 -tags @('shield') -ops @(@{op='apply_status';status='taunt';stacks=1;duration=2})),
    (New-Card "${tid}_b1" 'card.bot_redd_bite' $el 1 -atk 5 -tags @('attack')),
    (New-Card "${tid}_b2" 'card.bot_redd_bite' $el 1 -atk 5 -tags @('attack'))
  ) 'Алый щитоносец' $fac
}
$boss = New-Unit 'bot_pitboss_redd_alpha_m3f3' 'fighter' $el 3 58 5 4 3 @(
  (New-Card 'card_redd_cleave_m3f3' 'card.bot_redd_cleave' $el 2 -atk 7 -rule 'all_enemies' -tags @('attack','aoe') -ops @(@{op='apply_status';status='bleed';stacks=2;duration=2})),
  (New-Card 'card_redd_cleave2_m3f3' 'card.bot_redd_cleave' $el 2 -atk 7 -rule 'all_enemies' -tags @('attack','aoe') -ops @(@{op='apply_status';status='bleed';stacks=2;duration=2})),
  (New-Card 'card_redd_slash_m3f3' 'card.bot_redd_claw' $el 1 -atk 6 -tags @('attack')),
  (New-Card 'card_redd_slash2_m3f3' 'card.bot_redd_claw' $el 1 -atk 6 -tags @('attack'))
) 'Алый Вожак' $fac $true
Write-Stage 'mythmir_3_f3' 3 @(
  (Redd-Flank 'bot_redd_tank_m3f3_a'), $boss, (Redd-Flank 'bot_redd_tank_m3f3_b')
) 'Алая Псарня' 'Танк · босс · танк' $fac 'boss_between_tanks' 'Алая Псарня' 'Босс масс cost2 + bleed.'

# ===== Ch4 zombies =====
$el='grass'; $fac='zombies'
function Zomb-FighterA($tid) {
  New-Unit $tid 'fighter' $el 4 26 5 3 1 @(
    (New-Card "${tid}_1" 'card.bot_zomb_bash' $el 1 -atk 5 -tags @('attack')),
    (New-Card "${tid}_2" 'card.bot_zomb_bash' $el 1 -atk 5 -tags @('attack')),
    (New-Card "${tid}_3" 'card.bot_zomb_bash' $el 1 -atk 6 -tags @('attack')),
    (New-Card "${tid}_4" 'card.bot_zomb_bash' $el 1 -atk 5 -tags @('attack'))
  ) 'Зомби-боец' $fac
}
function Zomb-FighterB($tid) {
  New-Unit $tid 'fighter' $el 4 27 6 3 1 @(
    (New-Card "${tid}_1" 'card.bot_zomb_cleave' $el 1 -atk 6 -tags @('attack')),
    (New-Card "${tid}_2" 'card.bot_zomb_cleave' $el 1 -atk 6 -tags @('attack')),
    (New-Card "${tid}_3" 'card.bot_zomb_cleave' $el 1 -atk 7 -tags @('attack')),
    (New-Card "${tid}_4" 'card.bot_zomb_cleave' $el 1 -atk 6 -tags @('attack'))
  ) 'Зомби-палач' $fac
}
function Zomb-Assassin($tid,$hp=24) {
  New-Unit $tid 'assassin' $el 4 $hp 5 6 2 @(
    (New-Card "${tid}_1" 'card.bot_zomb_stab' $el 1 -atk 6 -rule 'backline' -tags @('attack','backline','poison') -ops @(@{op='apply_status';status='poison';stacks=1;duration=0})),
    (New-Card "${tid}_2" 'card.bot_zomb_stab' $el 1 -atk 6 -rule 'center' -tags @('attack','poison') -ops @(@{op='apply_status';status='poison';stacks=1;duration=0})),
    (New-Card "${tid}_3" 'card.bot_zomb_stab' $el 1 -atk 7 -rule 'backline' -tags @('attack','backline','poison') -ops @(@{op='apply_status';status='poison';stacks=1;duration=0})),
    (New-Card "${tid}_4" 'card.bot_zomb_stab' $el 1 -atk 6 -rule 'random_enemy' -tags @('attack','poison') -ops @(@{op='apply_status';status='poison';stacks=1;duration=0}))
  ) 'Трупный мясник' $fac
}
Write-Stage 'mythmir_4_f1' 4 @(
  (Zomb-FighterA 'bot_zomb_fighter_m4f1_a'), (Zomb-Assassin 'bot_zomb_assassin_m4f1'), (Zomb-FighterA 'bot_zomb_fighter_m4f1_b')
) 'Чумные Склепы' 'Боец · убийца · боец' $fac 'fighter_assassin_fighter' 'Чумные Склепы' 'Бойцы nearest; убийца center/тыл; thorns.'

Write-Stage 'mythmir_4_f2' 4 @(
  (Zomb-FighterB 'bot_zomb_fighter_m4f2_a'), (Zomb-Assassin 'bot_zomb_assassin_m4f2' 25), (Zomb-FighterB 'bot_zomb_fighter_m4f2_b')
) 'Чумные Склепы' 'Палач · убийца · палач' $fac 'butcher_assassin_butcher' 'Чумные Склепы' 'Другой вид бойца.'

function Zomb-F3Assassin($tid) {
  New-Unit $tid 'assassin' $el 4 26 5 6 2 @(
    (New-Card "${tid}_1" 'card.bot_zomb_stab' $el 1 -atk 7 -rule 'random_enemy' -tags @('attack','poison') -ops @(@{op='apply_status';status='poison';stacks=1;duration=0})),
    (New-Card "${tid}_2" 'card.bot_zomb_stab' $el 1 -atk 7 -rule 'random_enemy' -tags @('attack','poison') -ops @(@{op='apply_status';status='poison';stacks=1;duration=0})),
    (New-Card "${tid}_3" 'card.bot_zomb_stab' $el 1 -atk 8 -rule 'random_enemy' -tags @('attack','poison') -ops @(@{op='apply_status';status='poison';stacks=1;duration=0})),
    (New-Card "${tid}_4" 'card.bot_zomb_stab' $el 1 -atk 6 -rule 'random_enemy' -tags @('attack','poison') -ops @(@{op='apply_status';status='poison';stacks=1;duration=0}))
  ) 'Трупный мясник' $fac
}
$boss = New-Unit 'bot_pitboss_zomb_necro_m4f3' 'support' $el 4 70 4 3 3 @(
  (New-Card 'card_zomb_miasma_m4f3' 'card.bot_zomb_miasma' $el 2 -atk 5 -rule 'all_enemies' -tags @('attack','aoe','poison') -ops @(@{op='apply_status';status='poison';stacks=1;duration=0})),
  (New-Card 'card_zomb_miasma2_m4f3' 'card.bot_zomb_miasma' $el 2 -atk 5 -rule 'all_enemies' -tags @('attack','aoe','poison') -ops @(@{op='apply_status';status='poison';stacks=1;duration=0})),
  (New-Card 'card_zomb_bolt_m4f3' 'card.bot_zomb_bolt' $el 1 -atk 6 -tags @('attack')),
  (New-Card 'card_zomb_heal_m4f3' 'card.bot_zomb_heal' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=8}))
) 'Некропёс Мор' $fac $true
Write-Stage 'mythmir_4_f3' 4 @(
  (Zomb-F3Assassin 'bot_zomb_assassin_m4f3_a'), $boss, (Zomb-F3Assassin 'bot_zomb_assassin_m4f3_b')
) 'Чумные Склепы' 'Убийца · босс · убийца' $fac 'assassins_necro_mid' 'Чумные Склепы' 'Босс масс-poison cost2.'

# ===== Ch5 ghosts =====
$el='bolt'; $fac='ghosts'
function Ghost-Tank($tid,$hp=46) {
  New-Unit $tid 'tank' $el 5 $hp 3 2 1 @(
    (New-Card "${tid}_t1" 'card.bot_ghost_ward' $el 1 -shield 7 -tags @('shield') -ops @(@{op='apply_status';status='taunt';stacks=1;duration=2})),
    (New-Card "${tid}_t2" 'card.bot_ghost_ward' $el 1 -shield 6 -tags @('shield') -ops @(@{op='apply_status';status='taunt';stacks=1;duration=2})),
    (New-Card "${tid}_b1" 'card.bot_ghost_bash' $el 1 -atk 5 -tags @('attack')),
    (New-Card "${tid}_b2" 'card.bot_ghost_bash' $el 1 -atk 5 -tags @('attack'))
  ) 'Могильный страж' $fac
}
function Ghost-Fighter($tid,$hp=40) {
  New-Unit $tid 'fighter' $el 5 $hp 6 4 2 @(
    (New-Card "${tid}_1" 'card.bot_ghost_slash' $el 1 -atk 6 -tags @('attack')),
    (New-Card "${tid}_2" 'card.bot_ghost_slash' $el 1 -atk 6 -tags @('attack')),
    (New-Card "${tid}_3" 'card.bot_ghost_slash' $el 1 -atk 7 -tags @('attack')),
    (New-Card "${tid}_4" 'card.bot_ghost_slash' $el 1 -atk 6 -tags @('attack'))
  ) 'Призрак-боец' $fac
}
function Ghost-Heal($tid,$hp=30) {
  New-Unit $tid 'support' $el 5 $hp 3 3 2 @(
    (New-Card "${tid}_h1" 'card.bot_ghost_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=6})),
    (New-Card "${tid}_h2" 'card.bot_ghost_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=6})),
    (New-Card "${tid}_h3" 'card.bot_ghost_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=7})),
    (New-Card "${tid}_h4" 'card.bot_ghost_sip' $el 1 -rule 'ally_lowest_hp' -tags @('heal') -ops @(@{op='heal';amount=6}))
  ) 'Призрак-хил' $fac
}
Write-Stage 'mythmir_5_f1' 5 @(
  (Ghost-Tank 'bot_ghost_tank_m5f1'), (Ghost-Fighter 'bot_ghost_fighter_m5f1'), (Ghost-Heal 'bot_ghost_support_m5f1')
) 'Призрачный Чертог' 'Танк · боец · хил' $fac 'tank_fighter_heal' 'Призрачный Чертог' 'Dodge 1/4.'

Write-Stage 'mythmir_5_f2' 5 @(
  (Ghost-Fighter 'bot_ghost_fighter_m5f2_a' 42), (Ghost-Heal 'bot_ghost_support_m5f2' 32), (Ghost-Fighter 'bot_ghost_fighter_m5f2_b' 42)
) 'Призрачный Чертог' 'Боец · хил · боец' $fac 'fighter_heal_fighter' 'Призрачный Чертог' 'Dodge 1/4.'

$boss = New-Unit 'bot_pitboss_ghost_gul_m5f3' 'fighter' $el 5 95 6 4 3 @(
  (New-Card 'card_ghost_slash_m5f3' 'card.bot_ghost_slash' $el 1 -atk 10 -tags @('attack')),
  (New-Card 'card_ghost_slash2_m5f3' 'card.bot_ghost_slash' $el 1 -atk 10 -tags @('attack')),
  (New-Card 'card_ghost_cleave_m5f3' 'card.bot_ghost_cleave' $el 2 -atk 9 -rule 'all_enemies' -tags @('attack','aoe')),
  (New-Card 'card_ghost_center_m5f3' 'card.bot_ghost_slash' $el 1 -atk 11 -rule 'center' -tags @('attack'))
) 'Фантом Гул' $fac $true
Write-Stage 'mythmir_5_f3' 5 @(
  (Ghost-Tank 'bot_ghost_tank_m5f3' 48), $boss, (Ghost-Heal 'bot_ghost_support_m5f3' 28)
) 'Призрачный Чертог' 'Танк · босс · хил' $fac 'tank_boss_heal' 'Призрачный Чертог' 'Босс танк/центр; масс cost2; dodge.'

Write-Host 'all mythmir stages written'
