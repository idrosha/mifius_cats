/**
 * Gear catalog seed — R1–R8 armor (PvP base; HUD clones PvE via seedGearLanes).
 * Canon: docs/stitch-prompts-pve-pvp-gear-sets.md · gear-sets/README.md
 */
export const GEAR_STUB_VERSION = 3;
/** Enough copies for every combat hero (18). Stacked as one bag/barn cell. */
export const GEAR_HERO_STOCK = 18;

const SLOTS = ["helm", "armor", "cloak", "belt", "boots", "ring"];

/** Per-set piece stat tables (combat scale). Totals match README armor 5/5 + ring. */
const SET_DEFS = {
  grey: {
    rank: 1,
    rarity: "common",
    enhance: 0,
    names: {
      helm: "Серый шлем Льва",
      armor: "Серая кираса Льва",
      cloak: "Серый плащ Льва",
      belt: "Серый пояс Льва",
      boots: "Серые когтистые сапоги",
      ring: "Серое кольцо Лапы",
    },
    stats: {
      helm: { atk: 0, hp: 1, def: 1, spd: 0, crit: 0 },
      armor: { atk: 0, hp: 3, def: 2, spd: 0, crit: 0 },
      cloak: { atk: 0, hp: 2, def: 1, spd: 0, crit: 0 },
      belt: { atk: 0, hp: 1, def: 1, spd: 0, crit: 0 },
      boots: { atk: 0, hp: 1, def: 1, spd: 1, crit: 0 },
      ring: { atk: 0, hp: 1, def: 1, spd: 0, crit: 0 },
    },
  },
  green: {
    rank: 2,
    rarity: "rare",
    enhance: 4,
    names: {
      helm: "Зелёная шляпа Следопыта",
      armor: "Зелёная чешуя Рыси",
      cloak: "Зелёный плащ листвы",
      belt: "Зелёный пояс Рыси",
      boots: "Зелёные сапоги листвы",
      ring: "Зелёное кольцо Рыси",
    },
    stats: {
      helm: { atk: 0, hp: 2, def: 1, spd: 0, crit: 0 },
      armor: { atk: 1, hp: 3, def: 3, spd: 0, crit: 0 },
      cloak: { atk: 0, hp: 2, def: 1, spd: 0, crit: 0 },
      belt: { atk: 0, hp: 1, def: 1, spd: 0, crit: 0 },
      boots: { atk: 0, hp: 2, def: 2, spd: 1, crit: 0 },
      ring: { atk: 0, hp: 1, def: 1, spd: 1, crit: 0 },
    },
  },
  blue: {
    rank: 3,
    rarity: "rare",
    enhance: 4,
    /** HUD legacy alias */
    alias: "turquoise",
    names: {
      helm: "Синий шлем Короны",
      armor: "Синяя кираса Короны",
      cloak: "Синий плащ Короны",
      belt: "Синий пояс Короны",
      boots: "Синие сапоги Короны",
      ring: "Синее кольцо Короны",
    },
    stats: {
      helm: { atk: 0, hp: 2, def: 2, spd: 0, crit: 0 },
      armor: { atk: 1, hp: 3, def: 3, spd: 0, crit: 0 },
      cloak: { atk: 0, hp: 2, def: 2, spd: 0, crit: 0 },
      belt: { atk: 0, hp: 2, def: 1, spd: 0, crit: 0 },
      boots: { atk: 0, hp: 2, def: 1, spd: 1, crit: 0 },
      ring: { atk: 0, hp: 2, def: 1, spd: 0, crit: 0 },
    },
  },
  yellow: {
    rank: 4,
    rarity: "epic",
    enhance: 6,
    names: {
      helm: "Жёлтая шляпа Чародея",
      armor: "Жёлтая кираса Солнца",
      cloak: "Жёлтый плащ Солнца",
      belt: "Жёлтый пояс Льва",
      boots: "Жёлтые когтистые сапоги",
      ring: "Жёлтое кольцо Льва",
    },
    stats: {
      helm: { atk: 1, hp: 2, def: 2, spd: 0, crit: 0 },
      armor: { atk: 1, hp: 4, def: 3, spd: 0, crit: 0 },
      cloak: { atk: 0, hp: 3, def: 2, spd: 0, crit: 0 },
      belt: { atk: 0, hp: 2, def: 2, spd: 0, crit: 0 },
      boots: { atk: 0, hp: 2, def: 2, spd: 1, crit: 0 },
      ring: { atk: 1, hp: 1, def: 1, spd: 0, crit: 0 },
    },
  },
  purple: {
    rank: 5,
    rarity: "epic",
    enhance: 8,
    names: {
      helm: "Фиолетовый капюшон",
      armor: "Фиолетовая кираса Пантеры",
      cloak: "Фиолетовый плащ Пантеры",
      belt: "Фиолетовый пояс Пантеры",
      boots: "Фиолетовые когтистые сапоги",
      ring: "Фиолетовое кольцо Небулы",
    },
    stats: {
      helm: { atk: 1, hp: 2, def: 2, spd: 0, crit: 1 },
      armor: { atk: 1, hp: 4, def: 4, spd: 0, crit: 0 },
      cloak: { atk: 0, hp: 3, def: 2, spd: 0, crit: 0 },
      belt: { atk: 0, hp: 2, def: 2, spd: 0, crit: 1 },
      boots: { atk: 0, hp: 3, def: 2, spd: 2, crit: 1 },
      ring: { atk: 1, hp: 1, def: 1, spd: 0, crit: 1 },
    },
  },
  red: {
    rank: 6,
    rarity: "legendary",
    enhance: 10,
    names: {
      helm: "Красный шлем Дракона",
      armor: "Красная кираса Дракона",
      cloak: "Красный плащ Тигра",
      belt: "Красный пояс Тигра",
      boots: "Красные шипованные сапоги",
      ring: "Красное кольцо Дракона",
    },
    stats: {
      helm: { atk: 0, hp: 3, def: 3, spd: 0, crit: 0 },
      armor: { atk: 1, hp: 5, def: 4, spd: 0, crit: 0 },
      cloak: { atk: 1, hp: 3, def: 3, spd: 0, crit: 0 },
      belt: { atk: 0, hp: 2, def: 2, spd: 0, crit: 0 },
      boots: { atk: 0, hp: 3, def: 2, spd: 2, crit: 0 },
      ring: { atk: 1, hp: 2, def: 1, spd: 0, crit: 0 },
    },
  },
  solar: {
    rank: 7,
    rarity: "legendary",
    enhance: 12,
    names: {
      helm: "Солнечный шлем Пламени",
      armor: "Солнечная кираса Пламени",
      cloak: "Солнечный плащ Пламени",
      belt: "Солнечный пояс Пламени",
      boots: "Солнечные сапоги Пламени",
      ring: "Солнечное кольцо Пламени",
    },
    stats: {
      helm: { atk: 1, hp: 3, def: 3, spd: 0, crit: 0 },
      armor: { atk: 1, hp: 5, def: 4, spd: 0, crit: 0 },
      cloak: { atk: 1, hp: 4, def: 3, spd: 0, crit: 0 },
      belt: { atk: 0, hp: 2, def: 2, spd: 0, crit: 0 },
      boots: { atk: 0, hp: 3, def: 3, spd: 2, crit: 0 },
      ring: { atk: 1, hp: 2, def: 1, spd: 0, crit: 0 },
    },
  },
  or: {
    rank: 8,
    rarity: "mythic",
    enhance: 14,
    names: {
      helm: "Мифик шлем OR",
      armor: "Мифик кираса OR",
      cloak: "Мифик плащ OR",
      belt: "Мифик пояс OR",
      boots: "Мифик сапоги OR",
      ring: "Мифик кольцо OR",
    },
    stats: {
      helm: { atk: 1, hp: 3, def: 3, spd: 0, crit: 0 },
      armor: { atk: 1, hp: 6, def: 5, spd: 0, crit: 0 },
      cloak: { atk: 1, hp: 4, def: 3, spd: 0, crit: 0 },
      belt: { atk: 0, hp: 3, def: 2, spd: 0, crit: 0 },
      boots: { atk: 0, hp: 3, def: 3, spd: 2, crit: 0 },
      ring: { atk: 1, hp: 2, def: 1, spd: 0, crit: 1 },
    },
  },
};

function thumbFor(setId, slot) {
  return `/gear-sets/thumbs/${setId}-${slot}.png`;
}

function buildArmorPieces() {
  const out = [];
  for (const [setId, def] of Object.entries(SET_DEFS)) {
    for (const slot of SLOTS) {
      const st = def.stats[slot];
      out.push({
        id: `${setId}_${slot}`,
        slot,
        name: def.names[slot],
        atk: st.atk,
        hp: st.hp,
        def: st.def,
        spd: st.spd,
        crit: st.crit,
        rank: def.rank,
        rarity: def.rarity,
        enhance: slot === "armor" || slot === "helm" ? def.enhance : Math.max(0, def.enhance - (def.enhance >= 10 ? 1 : 0)),
        set: setId,
        roles: null,
        qty: GEAR_HERO_STOCK,
        iconSrc: thumbFor(setId, slot),
      });
    }
  }
  return out;
}

/** Class weapons / offhands — stocked ×18 for smoke. */
function buildWeapons() {
  const Q = GEAR_HERO_STOCK;
  return [
    { id: "yellow_staff", slot: "weapon", name: "Жёлтый посох Солнца (2H)", atk: 3, hp: 0, def: 0, spd: 0, crit: 1, rank: 4, rarity: "epic", enhance: 8, set: "yellow", roles: ["mage"], qty: Q, iconSrc: "/gear-sets/thumbs/yellow-staff.png" },
    { id: "yellow_wand", slot: "weapon", name: "Жёлтый жезл Солнца (1H)", atk: 2, hp: 0, def: 0, spd: 1, crit: 0, rank: 4, rarity: "epic", enhance: 6, set: "yellow", roles: ["mage"], qty: Q, iconSrc: "/gear-sets/thumbs/yellow-wand.png" },
    { id: "mage_book", slot: "shield", name: "Книга Чародея", atk: 1, hp: 1, def: 1, spd: 0, crit: 1, rank: 4, rarity: "epic", enhance: 6, set: "yellow", roles: ["mage"], qty: Q, iconSrc: "/gear-sets/thumbs/mage-book.png" },
    { id: "blue_staff", slot: "weapon", name: "Синий посох Короны", atk: 2, hp: 0, def: 0, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 4, set: "blue", roles: ["support"], qty: Q, iconSrc: "/gear-sets/thumbs/turquoise-staff.png" },
    { id: "support_scroll", slot: "shield", name: "Свиток Поддержки", atk: 0, hp: 2, def: 1, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 4, set: "blue", roles: ["support"], qty: Q, iconSrc: "/gear-sets/thumbs/support-scroll.png" },
    { id: "tank_mace", slot: "weapon", name: "Булава Стража", atk: 2, hp: 1, def: 1, spd: 0, crit: 0, rank: 4, rarity: "epic", enhance: 8, set: null, roles: ["tank"], qty: Q, iconSrc: "/gear-sets/thumbs/tank-mace.png" },
    { id: "tank_spear", slot: "weapon", name: "Копьё Стража", atk: 2, hp: 0, def: 0, spd: 1, crit: 1, rank: 4, rarity: "epic", enhance: 8, set: null, roles: ["tank"], qty: Q, iconSrc: "/gear-sets/thumbs/tank-spear.png" },
    { id: "tank_shield_large", slot: "shield", name: "Большой щит Льва", atk: 0, hp: 3, def: 4, spd: 0, crit: 0, rank: 4, rarity: "epic", enhance: 10, set: null, roles: ["tank"], qty: Q, iconSrc: "/gear-sets/thumbs/tank-shield-large.png" },
    { id: "tank_shield_small", slot: "shield", name: "Малый щит Льва", atk: 0, hp: 2, def: 3, spd: 0, crit: 0, rank: 3, rarity: "rare", enhance: 6, set: null, roles: ["tank"], qty: Q, iconSrc: "/gear-sets/thumbs/tank-shield-small.png" },
    { id: "fighter_greatsword", slot: "weapon", name: "Двуручный меч Тигра", atk: 4, hp: 0, def: 0, spd: 0, crit: 2, rank: 6, rarity: "legendary", enhance: 10, set: "red", roles: ["fighter"], qty: Q, iconSrc: "/gear-sets/thumbs/fighter-greatsword.png" },
    { id: "fighter_axe_a", slot: "weapon", name: "Топор Бойца A", atk: 2, hp: 0, def: 0, spd: 0, crit: 1, rank: 6, rarity: "legendary", enhance: 8, set: "red", roles: ["fighter"], qty: Q, iconSrc: "/gear-sets/thumbs/fighter-axe-a.png" },
    { id: "fighter_axe_b", slot: "shield", name: "Топор Бойца B", atk: 2, hp: 0, def: 0, spd: 0, crit: 1, rank: 6, rarity: "legendary", enhance: 8, set: "red", roles: ["fighter"], qty: Q, iconSrc: "/gear-sets/thumbs/fighter-axe-b.png" },
    { id: "assassin_dagger_a", slot: "weapon", name: "Кинжал Убийцы A", atk: 2, hp: 0, def: 0, spd: 1, crit: 2, rank: 5, rarity: "epic", enhance: 8, set: "purple", roles: ["assassin"], qty: Q, iconSrc: "/gear-sets/thumbs/assassin-dagger-a.png" },
    { id: "assassin_dagger_b", slot: "shield", name: "Кинжал Убийцы B", atk: 2, hp: 0, def: 0, spd: 1, crit: 2, rank: 5, rarity: "epic", enhance: 8, set: "purple", roles: ["assassin"], qty: Q, iconSrc: "/gear-sets/thumbs/assassin-dagger-b.png" },
    { id: "green_bow", slot: "weapon", name: "Зелёный лук Рыси", atk: 2, hp: 0, def: 0, spd: 1, crit: 1, rank: 2, rarity: "rare", enhance: 4, set: "green", roles: ["ranger"], qty: Q, iconSrc: "/gear-sets/thumbs/green-bow.png" },
    { id: "green_crossbow", slot: "weapon", name: "Зелёный арбалет", atk: 2, hp: 0, def: 0, spd: 0, crit: 1, rank: 2, rarity: "rare", enhance: 4, set: "green", roles: ["ranger"], qty: Q, iconSrc: "/gear-sets/thumbs/green-crossbow.png" },
    { id: "green_arrows", slot: "shield", name: "Колчан зелёных стрел", atk: 1, hp: 0, def: 0, spd: 0, crit: 0, rank: 2, rarity: "rare", enhance: 2, set: "green", roles: ["ranger"], qty: Q, iconSrc: "/gear-sets/thumbs/green-arrows.png" },
  ];
}

export const PVE_SET_IDS = ["grey", "green", "blue", "yellow", "purple", "red", "solar", "or"];

export const HOME_SET_RU = {
  grey: { name: "Серый Лев", need: 3, armor: "+6 DEF · +8 HP", weapon: "—", bonus: "3+: +1 DEF" },
  green: { name: "Зелёный След", need: 3, armor: "+8 DEF · +10 HP · +1 ATK", weapon: "лук/арбалет +2 ATK", bonus: "3+: +1 ATK" },
  blue: { name: "Синяя Корона", need: 3, armor: "+9 DEF · +11 HP · +1 ATK", weapon: "посох +2 ATK", bonus: "3+: +1 SPD" },
  turquoise: { name: "Синяя Корона", need: 3, armor: "+9 DEF · +11 HP · +1 ATK", weapon: "посох +2 ATK", bonus: "3+: +1 SPD" },
  yellow: { name: "Жёлтый Лев", need: 3, armor: "+11 DEF · +13 HP · +2 ATK", weapon: "посох +3 / жезл +2 ATK", bonus: "3+: +1 ATK" },
  purple: { name: "Фиолет", need: 3, armor: "+12 DEF · +14 HP · +2 ATK", weapon: "кинжалы +2 ATK каждый", bonus: "3+: +1 crit" },
  red: { name: "Красный Дракон", need: 3, armor: "+14 DEF · +16 HP · +2 ATK", weapon: "меч +4 / топоры +2 ATK", bonus: "3+: +2 HP" },
  solar: { name: "Солнечный Пламень", need: 3, armor: "+15 DEF · +18 HP · +3 ATK", weapon: "—", bonus: "3+: +1 ATK" },
  or: { name: "Мифик OR", need: 3, armor: "+17 DEF · +20 HP · +3 ATK", weapon: "—", bonus: "3+: +2 DEF" },
};

export function buildGearCatalogSeed() {
  return [...buildArmorPieces(), ...buildWeapons()];
}
