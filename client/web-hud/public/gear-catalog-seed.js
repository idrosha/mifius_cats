/**
 * Gear catalog seed — R1–R8 armor + class weapons (PvP base; HUD clones PvE via seedGearLanes).
 * Canon: docs/stitch-prompts-pve-pvp-gear-sets.md · gear-sets/README.md
 * Owned qty starts at 0 — drops / battle pass / shop grant copies (gear is scarce / CP key).
 */
export const GEAR_STUB_VERSION = 4;
/** Soft cap for identical stack size (18 combat heroes). */
export const GEAR_HERO_STOCK = 18;

const SLOTS = ["helm", "armor", "cloak", "belt", "boots", "ring"];

/** Per-set piece stat tables (combat scale). Totals match README armor 5/5 + ring. */
const SET_DEFS = {
  grey: {
    rank: 1,
    rarity: "common",
    enhanceCap: 5,
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
    enhanceCap: 7,
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
    enhanceCap: 8,
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
    enhanceCap: 10,
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
    enhanceCap: 12,
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
    enhanceCap: 14,
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
    enhanceCap: 15,
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
    enhanceCap: 16,
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

/** Class weapons / offhands — stats scale with set rank; art uses armor thumbs until overlays land. */
const ROLE_WEAPON_DEFS = [
  {
    role: "tank",
    slot: "weapon",
    label: "Булава",
    stats: { atk: 2, hp: 1, def: 1, spd: 0, crit: 0 },
  },
  {
    role: "tank",
    slot: "shield",
    label: "Щит",
    stats: { atk: 0, hp: 2, def: 3, spd: 0, crit: 0 },
  },
  {
    role: "fighter",
    slot: "weapon",
    label: "Клинок",
    stats: { atk: 3, hp: 0, def: 0, spd: 1, crit: 0 },
  },
  {
    role: "assassin",
    slot: "weapon",
    label: "Кинжалы",
    stats: { atk: 3, hp: 0, def: 0, spd: 2, crit: 1 },
  },
  {
    role: "ranger",
    slot: "weapon",
    label: "Лук",
    stats: { atk: 3, hp: 0, def: 0, spd: 1, crit: 1 },
  },
  {
    role: "mage",
    slot: "weapon",
    label: "Посох",
    stats: { atk: 2, hp: 1, def: 0, spd: 0, crit: 1 },
  },
  {
    role: "support",
    slot: "weapon",
    label: "Жезл",
    stats: { atk: 1, hp: 2, def: 1, spd: 0, crit: 0 },
  },
];

const SET_NAME_RU = {
  grey: "Серый",
  green: "Зелёный",
  blue: "Синий",
  yellow: "Жёлтый",
  purple: "Фиолет",
  red: "Красный",
  solar: "Солнечный",
  or: "Мифик",
};

function thumbFor(setId, slot) {
  if (slot === "weapon" || slot === "shield") {
    return `/gear-sets/thumbs/${setId}-armor.png`;
  }
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
        enhance: 0,
        enhanceCap: def.enhanceCap,
        set: setId,
        roles: null,
        qty: 0,
        iconSrc: thumbFor(setId, slot),
      });
    }
  }
  return out;
}

function buildWeapons() {
  const out = [];
  for (const [setId, def] of Object.entries(SET_DEFS)) {
    const scale = Math.max(1, def.rank);
    for (const w of ROLE_WEAPON_DEFS) {
      const st = w.stats;
      out.push({
        id: `${setId}_${w.slot}_${w.role}`,
        slot: w.slot,
        name: `${SET_NAME_RU[setId] || setId} ${w.label}`,
        atk: st.atk + Math.floor((scale - 1) / 2),
        hp: st.hp + Math.floor((scale - 1) / 3),
        def: st.def + Math.floor((scale - 1) / 3),
        spd: st.spd,
        crit: st.crit,
        rank: def.rank,
        rarity: def.rarity,
        enhance: 0,
        enhanceCap: def.enhanceCap,
        set: setId,
        roles: [w.role],
        qty: 0,
        iconSrc: thumbFor(setId, w.slot),
      });
    }
  }
  return out;
}

export const PVE_SET_IDS = ["grey", "green", "blue", "yellow", "purple", "red", "solar", "or"];

export const HOME_SET_RU = {
  grey: { name: "Серый Лев", need: 3, armor: "+6 DEF · +8 HP", weapon: "класс", bonus: "3+: +1 DEF" },
  green: { name: "Зелёный След", need: 3, armor: "+8 DEF · +10 HP · +1 ATK", weapon: "класс", bonus: "3+: +1 ATK" },
  blue: { name: "Синяя Корона", need: 3, armor: "+9 DEF · +11 HP · +1 ATK", weapon: "класс", bonus: "3+: +1 SPD" },
  turquoise: { name: "Синяя Корона", need: 3, armor: "+9 DEF · +11 HP · +1 ATK", weapon: "класс", bonus: "3+: +1 SPD" },
  yellow: { name: "Жёлтый Лев", need: 3, armor: "+11 DEF · +13 HP · +2 ATK", weapon: "класс", bonus: "3+: +1 ATK" },
  purple: { name: "Фиолет", need: 3, armor: "+12 DEF · +14 HP · +2 ATK", weapon: "класс", bonus: "3+: +1 crit" },
  red: { name: "Красный Дракон", need: 3, armor: "+14 DEF · +16 HP · +2 ATK", weapon: "класс", bonus: "3+: +2 HP" },
  solar: { name: "Солнечный Пламень", need: 3, armor: "+15 DEF · +18 HP · +3 ATK", weapon: "класс", bonus: "3+: +1 ATK" },
  or: { name: "Мифик OR", need: 3, armor: "+17 DEF · +20 HP · +3 ATK", weapon: "класс", bonus: "3+: +2 DEF" },
};

/** Season battle-pass guaranteed set for one cat (armor + class weapon). */
export const PASS_GUARANTEED_SET_ID = "green";

export function buildGearCatalogSeed() {
  return [...buildArmorPieces(), ...buildWeapons()];
}
