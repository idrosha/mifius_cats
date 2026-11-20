# Stitch prompts — пустая рамка карты атаки (единый chrome)

**Решение:** `D-045` · одна нейтральная рамка на все классы; стихия позже CSS-цветом; текст/AP/иллюстрация — compose в HUD.  
**Не** генерить заполненные плашки с названием/описанием/цифрой cost.

Как вставлять: новая сессия Mythfel → блок ниже целиком → попроси **3–5 вариантов** → выбери один → zip/share агенту.  
Выбранный chrome в репо: `client/web-hud/public/stitch-assets/attack-cards/chrome/attack_card_chrome.jpg`.  
Руны стихий: `chrome/runes/{stone,fire,water,ice,grass,bolt}.svg` → слот лапы сверху.

```
Asset art for «Мифиус: Мифические котики» (Mythfel) — EMPTY ATTACK CARD CHROME / FRAME ONLY.
Not a full filled skill card. Not a battle screen. Not gear. Not a cat portrait as the main deliverable.

Goal:
Design ONE reusable vertical collectible skill-card FRAME for the mobile battle HUD hand.
The same chrome will be used for ALL classes and elements. Element color will be applied later in CSS — do NOT bake stone/fire/ice/water/grass/bolt tints into the frame.
Title, description, energy cost number, and illustration will be composited later in the game UI. Leave those areas EMPTY and readable as slots.

Product / style:
- Turn-based 3v3 card battler with combat mythic cats.
- Art direction: «Tavern Hearth Battler» — cozy dark fantasy tavern: peat charcoal (#161310 / #14110F), aged hearthstone / carved wood frame, bronze clasps, warm lantern / amber-gold accents (#D99B26 / #fdba45), aged vellum (#F4E8D1) for the title plaque area.
- Painted / illustrated 2D craft — NOT soft-3D plastic, NOT crypto/NFT chrome, NOT kindergarten pastel, NOT purple-on-white generic AI poster.

Card format:
- Portrait ~2:3, rounded-lg game card, readable at thumbnail in a 4-card hand.
- Fixed layout slots (keep proportions consistent across variants):
  1) TOP-LEFT: empty COST GEM — amber/gold circular gem bezel ONLY, NO digit inside (hollow center).
  2) UPPER-CENTER: empty ILLUSTRATION WINDOW — large rectangular/arched art panel with a neutral dark parchment or soft wood inset; NO scene, NO cat, NO icons, NO watermark text.
  3) MID/LOWER: empty TITLE PLAQUE — vellum / carved name plate with NO letters.
  4) BOTTOM: empty DESCRIPTION BAND — short parchment strip for 1–2 lines of effect text; NO letters, NO Latin filenames, NO DATAIMAGE, NO service ids.
- Decorative runes / wood grain / bronze rivets on the OUTER frame are OK if they stay clear of the four slots.
- No filename line at the bottom. No English labels. No RU sample text either — truly empty slots.

Deliverable:
- Generate 3 to 5 polished VARIANTS of this same empty chrome (same slot layout, different wood/bronze ornament details).
- Label variants A/B/C/D/E in the filename only if needed; do not print labels on the card face.
- Output: individual card faces, transparent or solid peat background outside the card is fine; prefer the card filling the frame.

Forbidden:
- Filled sample cards with titles, costs, or artwork inside the slots.
- Per-element colored frames; neon glows; crypto/NFT badges; Axie names; gore; sexualized poses.
- Tiny unreadable ornaments inside the title/description/gem holes.

Keep Tavern Hearth Battler; one neutral empty attack-card chrome; hollow cost gem; blank art window; blank title plaque; blank description; no baked text.
```
