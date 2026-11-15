'use strict';

const path = require('path');
const express = require('express');
const compression = require('compression');
const { db, PASS_MAX } = require('./database');

const PORT = process.env.PORT || 3847;
const BUY_LEVELS_COST = 5000;
const BUY_LEVELS_AMOUNT = 5;
const DUNGEON_ENERGY = { claw: 12, mine: 16, boss: 20 };

const app = express();
app.use(compression());
app.use(express.json());
const publicDir = path.join(__dirname, 'public');
// HTML/JS: no long cache (proto iterates fast). Images keep 1d.
app.use(express.static(publicDir, {
  maxAge: '1d',
  setHeaders(res, filePath) {
    if (/\.(html?|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-store');
    }
  },
}));

function snapshot() {
  return JSON.parse(JSON.stringify(db));
}

function grant(reward) {
  if (reward.gold) db.user.gold += reward.gold;
  if (reward.fish) db.user.fish += reward.fish;
  if (reward.energy) {
    db.user.energy = Math.min(db.user.maxEnergy, db.user.energy + reward.energy);
  }
}

function canClaim(levelRow, type) {
  if (!levelRow || levelRow.level > db.user.level) return false;
  const reward = type === 'elite' ? levelRow.eliteReward : levelRow.freeReward;
  return reward && !reward.claimed;
}

app.get('/api/state', (_req, res) => {
  res.json(snapshot());
});

app.post('/api/claim-reward', (req, res) => {
  const level = Number(req.body?.level);
  const type = req.body?.type === 'elite' ? 'elite' : 'free';
  const row = db.passLevels.find((l) => l.level === level);
  if (!canClaim(row, type)) {
    return res.status(400).json({ error: 'Награда недоступна' });
  }
  const reward = type === 'elite' ? row.eliteReward : row.freeReward;
  reward.claimed = true;
  grant(reward);
  res.json(snapshot());
});

app.post('/api/claim-all', (_req, res) => {
  for (const row of db.passLevels) {
    for (const type of ['free', 'elite']) {
      if (canClaim(row, type)) {
        const reward = type === 'elite' ? row.eliteReward : row.freeReward;
        reward.claimed = true;
        grant(reward);
      }
    }
  }
  res.json(snapshot());
});

app.post('/api/buy-levels', (_req, res) => {
  if (db.user.level >= PASS_MAX) {
    return res.status(400).json({ error: 'Достигнут максимум пропуска' });
  }
  if (db.user.gold < BUY_LEVELS_COST) {
    return res.status(400).json({ error: 'Недостаточно золота (нужно 5000)' });
  }
  db.user.gold -= BUY_LEVELS_COST;
  db.user.level = Math.min(PASS_MAX, db.user.level + BUY_LEVELS_AMOUNT);
  db.user.xp = 0;
  res.json(snapshot());
});

app.post('/api/enter-dungeon', (req, res) => {
  const cost = DUNGEON_ENERGY[req.body?.dungeon] ?? 12;
  if (db.user.energy < cost) {
    return res.status(400).json({ error: 'Недостаточно энергии' });
  }
  db.user.energy -= cost;
  res.json({ success: true, energy: db.user.energy });
});

app.listen(PORT, () => {
  console.log(`Battle Pass proto → http://localhost:${PORT}`);
});
