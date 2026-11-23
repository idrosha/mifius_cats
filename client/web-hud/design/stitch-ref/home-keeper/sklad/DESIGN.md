---
name: Tavern Hearth Battler
colors:
  surface: '#161310'
  surface-dim: '#161310'
  surface-bright: '#3d3835'
  surface-container-lowest: '#110d0b'
  surface-container-low: '#1f1b18'
  surface-container: '#231f1c'
  surface-container-high: '#2e2926'
  surface-container-highest: '#393430'
  on-surface: '#eae1db'
  on-surface-variant: '#d5c4af'
  inverse-surface: '#eae1db'
  inverse-on-surface: '#342f2c'
  outline: '#9d8f7b'
  outline-variant: '#504535'
  surface-tint: '#fdba45'
  primary: '#fdba45'
  on-primary: '#432c00'
  primary-container: '#d99b26'
  on-primary-container: '#523700'
  inverse-primary: '#7f5700'
  secondary: '#89d98c'
  on-secondary: '#003910'
  secondary-container: '#005b1e'
  on-secondary-container: '#82d186'
  tertiary: '#ffb4a6'
  on-tertiary: '#660700'
  tertiary-container: '#ff826c'
  on-tertiary-container: '#7c0a00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdeae'
  primary-fixed-dim: '#fdba45'
  on-primary-fixed: '#281900'
  on-primary-fixed-variant: '#604100'
  secondary-fixed: '#a4f6a6'
  secondary-fixed-dim: '#89d98c'
  on-secondary-fixed: '#002106'
  on-secondary-fixed-variant: '#00531b'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a6'
  on-tertiary-fixed: '#3f0300'
  on-tertiary-fixed-variant: '#8d1607'
  background: '#161310'
  on-background: '#eae1db'
  surface-variant: '#393430'
typography:
  headline-xl:
    fontFamily: Rubik
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Rubik
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
  headline-lg:
    fontFamily: Rubik
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg-mobile:
    fontFamily: Rubik
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Rubik
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-lg:
    fontFamily: Rubik
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
  label-md:
    fontFamily: Rubik
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Rubik
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
  stat-numeral:
    fontFamily: Rubik
    fontSize: 20px
    fontWeight: '800'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-tablet: 1rem
  margin: 1rem
  margin-tablet: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system crafts a whimsical, warm fantasy tavern aesthetic for a tactical turn-based card battler. It blends the approachable, tactile charm of classic 2D storybook creature collectors with polished, modern mobile HUD functionality. The mood evokes glowing hearthside strategy: aged parchment decks, oiled wooden moldings, polished bronze clasps, and illustrated mythic feline champions.

The visual direction rejects harsh neon crypto-gaming tropes in favor of an organic, hand-crafted storybook finish:
- **Warm Tactile Metaphors:** Interfaces simulate carved wood frames, tactile combat badges, and layered parchment scrolls illuminated by golden lantern light.
- **Fairy-Tale Warmth:** Deep peat, midnight slate, and aged stone anchors create contrast behind amber-rimmed interactive elements.
- **Cyrillic-First Clarity:** All typographic structures and spatial limits cater expressly to longer Cyrillic stems, inflections, and game terminology without awkward line drops or truncations.

## Colors

The palette grounds players within a cozy, candlelit stone hall while providing clean elemental color coding during rapid 3v3 combat rounds.

### Base & Canvas Surfaces
- **Canvas Root (`#14110F`):** Deep charcoal peat providing high contrast for battle stage layers.
- **Surface Layer 1 (`#1E1A17`):** Aged hearthstone for bottom sheets, inventory grids, and panel hulls.
- **Surface Layer 2 (`#2B241E`):** Carved wood grain and thick parchment backing for battle cards and stat trays.
- **Surface Elevated (`#3A3129`):** Popovers, card previews, and floating inspection badges.

### Primary Accents & Neutral Tones
- **Amber Gold (`#D99B26`):** The primary seed and interactive hallmark—denotes active turns, gold currency, mana surge, and primary action affordances.
- **Aged Vellum Text (`#F4E8D1`):** Primary text color, offering softer contrast than pure white on dark surfaces.
- **Muted Hearth Smoke (`#A89B8C`):** Secondary metadata, sub-labels, and cost requirement counters.

### Elemental Combat Tokens
The six combat affinities rely on natural, mineral pigments rather than synthetic neon saturations:
- **Bolt / Молния (`#D99B26`):** Soft amber-gold.
- **Fire / Огонь (`#E0533C`):** Soft ember vermillion.
- **Water / Вода (`#388E9C`):** Mineral teal-cyan.
- **Grass / Природа (`#4D9A55`):** Forest leaf green.
- **Stone / Земля (`#8C7A6B`):** Warm clay ochre.
- **Ice / Лед (`#7594B8`):** Frosted morning twilight blue.

## Typography

The typographic hierarchy prioritizes instantaneous Cyrillic glanceability during real-time decision phases in battle.

- **Display & Numerical Elements (Rubik):** Rounded geometry softens numerical stats (HP, Energy, Shields) while offering high structural legibility. Uppercase tracking is restrained (+0.02em) to prevent Cyrillic diacritics and wide characters (`Ж`, `Ш`, `Щ`, `Ю`) from feeling cramped.
- **Descriptive Body & Skill Lore (Nunito Sans):** Clean, organic rounded stems provide relaxed readability for complex card passive abilities, battle debuffs, and item descriptions.
- **Battle Badges & Values:** HP, Energy, and Shield numbers utilize heavy Rubik weights paired with drop shadows to maintain instant readability over animated cat sprites and spell particle effects.

## Layout & Spacing

This mobile-first card battler uses a dense, ergonomic layout designed for thumb zones and fluid horizontal combat arenas.

### Grid & Combat Arena Architecture
- **Mobile Combat Viewport (Aspect Ratio Safe Areas):** Top HUD (turn order, enemy cats, energy reservoirs) reserves `space-lg` top margins. The bottom 38% of the viewport is reserved for the active card hand, turn commitment trigger, and energy crystals.
- **Card Hand Staging:** Hands fan out using negative horizontal overlap (`-0.75rem`) on mobile viewports under 400px wide, expanding into a relaxed grid with `space-sm` gaps upon selection or card zoom.
- **Modals and Deckbuilders:** Organized in a 4-column layout on mobile, scaling to 6 columns on tablets with `gutter-tablet` spacing for 3v3 team assembly trays.

## Elevation & Depth

Visual depth is achieved through tactile tavern layering, subtle warm illumination, and carved relief framing rather than cold digital drop shadows:

- **Level 0 (Battle Arena):** Dark matte canvas texture (`#14110F`) with subtle ambient radial vignette.
- **Level 1 (Docked Trays & Arena HUDs):** Deep bog oak surface (`#1E1A17`) bordered by an inner engraved line (`rgba(244, 232, 209, 0.08)`) and a subtle floor shadow (`0 4px 12px rgba(0, 0, 0, 0.5)`).
- **Level 2 (In-Hand Action Cards & Stat Pods):** Warm parchment cardstock (`#2B241E`) framed by a 1.5px bevel border (`#544436`), casting an ambient shadow tinted with warm amber (`0 6px 16px rgba(18, 12, 8, 0.65)`).
- **Level 3 (Active Turn & Dragged Cards):** Cards picked up from the hand scale 1.08x, gaining an amber aura highlight (`box-shadow: 0 0 16px rgba(217, 155, 38, 0.45), 0 12px 24px rgba(0, 0, 0, 0.75)`).
- **Level 4 (Battle Popups & Loot Displays):** Deep stone modal surfaces with thick golden corner brads and heavy backdrop occlusion (`rgba(10, 8, 7, 0.82)`).

## Shapes

The interface embraces organic, comfortable silhouettes that feel friendly and collectible:
- **Base Geometry:** A standard 0.5rem (`roundedness: 2`) border radius provides soft, chip-resistant corners reminiscent of molded clay tokens and wooden tiles.
- **Card Geometry:** Combat cards use `rounded-lg` (1rem) for an authentic, rounded tabletop card profile.
- **Action Buttons & Badges:** Primary combat execution triggers and elemental energy orbs use pill silhouettes (`rounded-xl` or circular tokens) to invite immediate, satisfying taps.

## Components

### Action Cards (Карты приемов)
- **Container:** Rounded 1rem corners, 2-tier parchment layering (`#2B241E` body with `#3D332A` header banner).
- **Cost Badge:** Located at the top-left corner in a carved gem inset matching the skill's elemental color token. Typography is `stat-numeral` in white with an engraved inner border.
- **Artwork Frame:** Square ratio with inner bevel and 0.5rem rounded frame.
- **Description Block:** `body-sm` in `#F4E8D1`, with bold keywords highlighted in the corresponding elemental hue (e.g., **Оглушение**, **Кровоток**).

### Buttons (Кнопки действий)
- **Primary Battle Button («Завершить ход» / «В бой!»):** Thick-set, tactile rounded pill with a warm amber gradient (`#E5A835` to `#C48419`), 2px bottom lip shadow for a physical button-press sensation, and centered `label-lg` Cyrillic text in `#1A1308`.
- **Secondary HUD Action:** Deep wood-grain button (`#2B241E`) with a 1px border (`#544436`) and `label-md` text in `#F4E8D1`.

### Team Health & Shield Trays (Панели статуса котиков)
- **HP Meter:** Segmented pill bar with a thick dark stone trough (`#14110F`). The filled track uses an organic leaf-green gradient (`#5CB565` to `#4D9A55`) that shifts to amber below 30% HP.
- **Shield Overlay:** Overlapping steel-blue slate bar (`#5D7F9E`) with an embossed metallic shield icon at the left margin.
- **Turn Order Indicator:** Miniature circular portrait tokens pinned along the upper HUD, glowing with a `#D99B26` ring when that cat holds active initiative.

### Elemental Badges & Counters (Значки стихий)
- **Form:** Compact circular badges (24px mobile, 28px desktop) containing the elemental glyph.
- **Color Coding:** Uses the dedicated soft elemental palette tokens. Never use flat black for glyphs; use deep tonal shades of the corresponding element for maximum visual richness.

### Modals & Dialogs (Окна и свитки)
- **Frame:** Scrollwork-inspired stone panels flanked by ornate bronze corners.
- **Title Banner:** Centered `headline-md` encased in a raised amber ribbon.
- **Close Button:** Prominent circular brass "X" medallion pinned to the upper-right corner for effortless dismissability on compact mobile devices.

### Warehouse · Farm resources & tools (Сырьё / инструменты двора · MF-153)

Icon masters for route `gear` (Склад) filter **Сырьё · Soon** and Market tool SKUs. Art lives under `/barn-icons/`. Soft launch: **design + assets only** — warehouse farm stock stays Soon tip (`D-028`, FULL-SPEC §4.4 / Phase 5+); do not wire live farm/nursery gameplay UI.

**Art rules:** tavern-hearth still life; crop to square card thumb when the master has a fireplace backdrop; warm peat canvas; no neon crypto glow.

#### Tools (расходники рынка · wiki §8.1)

| Asset | RU | SKU / zone | Notes |
|---|---|---|---|
| `tool-shovel.png` | Лопата | `tool_shovel` · грядки/сад | Cat-pommel trowel; soil + mint sprouts |
| `tool-axe.png` | Топор | `tool_axe` · лесопилка | Tree-engraved hatchet in stone |
| `tool-pick.png` | Кирка | `tool_pick` · рудник/карьер | Dual-point pick on forge block |
| `tool-rod.png` | Удочка | рыбная заводя (+ `bait_basic`) | Paw-handle rod + catch sparkles |

Wear ≈ **7 дней** активного тика; ремонт `tool_repair_kit` / scrap (wiki §2).

#### Resources (добыча двора · wiki §2)

| Asset | RU | Day min (visit) | Sink |
|---|---|---|---|
| `wood.png` | Дерево / брёвна | 2–3 | кузня / крафт |
| `iron.png` | Железо / слитки | 2 | кузня / ремонт tools |
| `stone.png` | Камень (мшистый гранит) | — | карьер → кузня |
| `veggies.png` | Овощи | ~1 ведро | алхимия «еда» |
| `fruit.png` | Фрукты | ~1 ведро | алхимия |
| `herbs.png` | Травы | ~1 ведро | алхимия / мята |
| `fish.png` | Рыба (связка) | 3 / день | сытость ферм-котов |
| `seeds.png` | Семена | buy Market | грядки / autofarm |
| `milk.png` | Молоко Очага | Tavern | post-fight HP (не ranked buff) |

#### Alchemy bottles (зелья · warehouse Soon)

Split singles for Phase 6 alchemy shelf; keep `potions.png` as category row until live craft.

| Asset | RU hint | Hue |
|---|---|---|
| `potion-nature.png` | Зелье жизни / HP | leaf green + leaf wax seal |
| `potion-energy.png` | Эликсир энергии / +1 AP | molten gold + bronze filigree |
| `potion-cleanse.png` | Отвар очищения / −1 дебафф | mineral teal-blue (ex mana) |
| `potion-ember.png` | Мятный отвар (utility) | amber-orange + lion «S» seal |
| `potion-mana.png` | legacy → cleanse | same as `potion-cleanse.png` |

#### Warehouse chrome (не mats)

| Asset | Use |
|---|---|
| `seal-paw.png` | Brand / inspect badge (paw runestone) |
| `seal-warehouse.png` | Capacity / «амбар» badge (hex shield tablet) |

**HUD paths:** `/barn-icons/<file>.png`. Source pack: project media `warehouse-icons-v2/` (+ `17–25` tools/potions/seals) and `warehouse-farm-tools/`.