'use strict';

const PASS_MAX = 50;

function reward(id, name, claimed, extras = {}) {
  return { id, name, claimed, ...extras };
}

/** Named milestones; everything else is generated. */
const SPECIAL = {
  1: {
    free: { name: '500 Золота', gold: 500 },
    elite: { name: 'Рыбка ×50', fish: 50 },
  },
  5: {
    free: { name: 'Мята ×5' },
    elite: { name: 'Сливки ×2', energy: 2 },
  },
  10: {
    free: { name: 'Рыбка ×100', fish: 100 },
    elite: { name: 'Свиток Призыва' },
  },
  15: {
    free: { name: '1,000 Золота', gold: 1000 },
    elite: { name: 'Амулет Новичка' },
  },
  20: {
    free: { name: 'Корм ×25' },
    elite: { name: 'Набор Зелий', energy: 5 },
  },
  25: {
    free: { name: '2,500 Золота', gold: 2500 },
    elite: { name: 'Сливки ×5', energy: 5 },
  },
  26: {
    free: { name: 'Мята ×10' },
    elite: { name: 'Свиток Призыва' },
  },
  27: {
    free: { name: 'Рыбка ×150', fish: 150 },
    elite: { name: 'Астрал-Амулет' },
  },
  28: {
    free: { name: '5,000 Золота', gold: 5000 },
    elite: { name: 'Панцирь Дракона', isMythic: true },
  },
  29: {
    free: { name: 'Корм ×50' },
    elite: { name: 'Перстень Света' },
  },
  30: {
    free: { name: 'Фолиант Опыта', gold: 500 },
    elite: { name: 'Набор Зелий', energy: 10 },
  },
  31: {
    free: { name: 'Рыбка ×300', fish: 300 },
    elite: { name: 'Амулет Удачи' },
  },
  32: {
    free: { name: '10,000 Золота', gold: 10000 },
    elite: { name: '«Барс Солнца»', isMythic: true },
  },
  40: {
    free: { name: 'Рыбка ×500', fish: 500 },
    elite: { name: 'Корона Сезона', isMythic: true },
  },
  50: {
    free: { name: '25,000 Золота', gold: 25000 },
    elite: { name: 'Легенда Сезона III', isMythic: true },
  },
};

function buildPassLevels(userLevel) {
  const levels = [];
  for (let level = 1; level <= PASS_MAX; level++) {
    const spec = SPECIAL[level];
    const claimed = level < userLevel;
    const freeBase = spec
      ? spec.free
      : { name: level % 2 ? `${250 * level} Золота` : `Рыбка ×${20 * level}`, ...(level % 2 ? { gold: 250 * level } : { fish: 20 * level }) };
    const eliteBase = spec
      ? spec.elite
      : { name: level % 3 === 0 ? 'Сундук Элиты' : `Награда ×${level}` };

    levels.push({
      level,
      freeReward: reward(`f${level}`, freeBase.name, claimed, {
        gold: freeBase.gold,
        fish: freeBase.fish,
        energy: freeBase.energy,
        isMythic: freeBase.isMythic,
      }),
      eliteReward: reward(`e${level}`, eliteBase.name, claimed, {
        gold: eliteBase.gold,
        fish: eliteBase.fish,
        energy: eliteBase.energy,
        isMythic: eliteBase.isMythic,
      }),
    });
  }
  // Current level: claimable
  const cur = levels.find((l) => l.level === userLevel);
  if (cur) {
    cur.freeReward.claimed = false;
    cur.eliteReward.claimed = false;
  }
  return levels;
}

const USER_LEVEL = 28;

const db = {
  passMax: PASS_MAX,
  user: { id: 1, gold: 8950, energy: 84, maxEnergy: 100, fish: 1420, crystals: 350, level: USER_LEVEL, xp: 2450, maxXp: 3000 },
  seasonPreview: [
    { name: 'Багровая Броня Дракона', desc: 'Мифик-сет элитного пасса (ур. 28)', tag: 'МИФИК', icon: 'workspace_premium' },
    { name: 'Боевая Алхимия', desc: 'Эликсиры и сливки сезона', tag: 'РЕАГЕНТЫ', icon: 'science' },
    { name: 'Ресурсы для Фермы', desc: 'Семена, руда, древесина', tag: 'РЕСУРСЫ', icon: 'agriculture' },
  ],
  passLevels: buildPassLevels(USER_LEVEL),
};

module.exports = { db, PASS_MAX };
