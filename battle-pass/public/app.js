'use strict';

const fmt = (n) => Number(n).toLocaleString('ru-RU');

function imgUrl(reward) {
  if (reward.image) return reward.image;
  const t = encodeURIComponent(String(reward.name).slice(0, 8));
  return `https://placehold.co/64x64.webp/2e2926/fdba45?text=${t}`;
}

function statusHtml(userLevel, level, claimed, active) {
  if (level > userLevel) {
    return `<span class="text-[10px] text-[#9d8f7b] flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">lock</span>Заперто</span>`;
  }
  if (claimed) {
    return `<span class="text-[10px] text-green flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">check_circle</span>Получено</span>`;
  }
  return `<button type="button" data-claim data-level="${level}" data-type="${active}"
    class="w-full bg-gradient-to-r from-gold via-[#d99b26] to-gold text-[#432c00] text-[10px] font-rubik font-bold py-0.5 rounded uppercase mt-0.5 shadow-[0_0_16px_rgba(253,186,69,0.9)] hover:brightness-110 active:scale-95 transition-all duration-200">Забрать</button>`;
}

function rewardCard(user, row, kind) {
  const reward = kind === 'elite' ? row.eliteReward : row.freeReward;
  const locked = row.level > user.level;
  const active = row.level === user.level;
  const claimed = reward.claimed;
  const mythic = reward.isMythic
    ? `<span class="absolute top-0.5 left-0.5 bg-gold text-[#432c00] text-[8px] font-bold px-1 rounded">МИФИК</span>`
    : '';

  const base =
    kind === 'elite'
      ? `min-h-[144px] bg-gradient-to-b from-[#d99b26]/20 via-panelDeep/95 to-panelDeep border border-gold/40`
      : `h-28 bg-panelDeep/90 border border-line/30`;

  const glow = active && !claimed
    ? 'border-2 border-gold ring-2 ring-gold/40 shadow-[0_0_16px_rgba(253,186,69,0.9)]'
    : '';
  const dim = claimed ? 'opacity-75' : locked ? 'opacity-75' : '';

  const lazy = row.level <= user.level ? '' : 'loading="lazy"';

  return `<div class="w-full ${base} ${glow} ${dim} rounded-xl p-1.5 flex flex-col items-center justify-between transition-all duration-200">
    <div class="relative w-16 h-16 rounded-lg overflow-hidden bg-[#2e2926] border border-gold/30 shrink-0">
      <img src="${imgUrl(reward)}" alt="${reward.name}" width="64" height="64" ${lazy} decoding="async" class="w-full h-full object-cover">
      ${mythic}
    </div>
    <div class="w-full flex flex-col items-center mt-1">
      <span class="text-[11px] font-rubik font-bold text-center leading-tight ${kind === 'elite' ? 'text-gold' : ''}">${reward.name}</span>
      ${statusHtml(user.level, row.level, claimed, kind)}
    </div>
  </div>`;
}

function levelNode(user, row) {
  const active = row.level === user.level;
  const done = row.level < user.level;
  const circle = active
    ? `w-10 h-10 bg-gold text-panelDeep shadow-[0_0_16px_rgba(253,186,69,0.9)] ring-2 ring-[#ffdeae] border border-gold`
    : done
      ? `w-9 h-9 bg-green text-[#003910]`
      : `w-9 h-9 bg-[#393430] text-muted`;
  const tag = active
    ? `<span class="text-[9px] text-gold font-bold uppercase -mt-1 bg-panelDeep/90 px-1 rounded">ТЕКУЩИЙ</span>`
    : row.level === 32
      ? `<span class="text-[8px] text-gold font-bold uppercase -mt-1">ФИНАЛ</span>`
      : '';

  return `<div class="flex flex-col items-center justify-between h-full ${active ? 'scale-[1.03] z-10' : ''} transition-all duration-200">
    ${rewardCard(user, row, 'free')}
    <div class="my-1.5 flex flex-col items-center">
      <div class="${circle} rounded-full font-rubik font-extrabold text-sm flex items-center justify-center">${row.level}</div>
      ${tag}
    </div>
    ${rewardCard(user, row, 'elite')}
  </div>`;
}

function renderSeason(preview) {
  const el = document.getElementById('seasonGrid');
  if (!el || !preview) return;
  el.innerHTML = preview
    .map(
      (item) => `<article class="bg-panelDeep/90 border border-gold/40 rounded-xl p-3 flex gap-3 transition-all duration-200 hover:border-gold">
      <img src="${item.image}" alt="${item.name}" width="64" height="64" loading="lazy" decoding="async" class="rounded-lg ring-2 ring-gold/60 shrink-0 object-cover w-16 h-16">
      <div>
        <div class="flex items-center gap-2">
          <div class="font-rubik font-bold text-gold text-sm">${item.name}</div>
          ${item.tag ? `<span class="bg-gold/20 text-gold text-[10px] font-bold px-1 rounded">${item.tag}</span>` : ''}
        </div>
        <p class="text-xs text-muted mt-0.5">${item.desc}</p>
      </div>
    </article>`,
    )
    .join('');
}

function renderUI(state) {
  const { user, passLevels, seasonPreview } = state;
  document.getElementById('goldStat').textContent = fmt(user.gold);
  document.getElementById('fishStat').textContent = fmt(user.fish);
  document.getElementById('energyStat').textContent = `${user.energy}/${user.maxEnergy}`;
  document.getElementById('levelBadge').textContent = `УР. ${user.level}`;
  document.getElementById('xpLabel').textContent = `${fmt(user.xp)} / ${fmt(user.maxXp)} XP`;
  const pct = Math.min(100, (user.xp / user.maxXp) * 100);
  document.getElementById('xpBar').style.width = `${pct}%`;

  document.getElementById('passGrid').innerHTML = passLevels.map((row) => levelNode(user, row)).join('');
  renderSeason(seasonPreview);
}

async function api(url, body) {
  const res = await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

let state = null;

async function refresh(next) {
  state = next;
  renderUI(state);
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('app');
  const skeleton = document.getElementById('skeleton');

  // Event delegation for claim buttons
  document.getElementById('passGrid').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-claim]');
    if (!btn) return;
    try {
      await refresh(await api('/api/claim-reward', {
        level: Number(btn.dataset.level),
        type: btn.dataset.type,
      }));
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('claimAllBtn').addEventListener('click', async () => {
    try {
      await refresh(await api('/api/claim-all', {}));
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('buyLevelsBtn').addEventListener('click', async () => {
    try {
      await refresh(await api('/api/buy-levels', {}));
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('dungeonGrid').addEventListener('click', async (e) => {
    const btn = e.target.closest('.dungeon-btn');
    if (!btn) return;
    try {
      const data = await api('/api/enter-dungeon', { dungeon: btn.dataset.dungeon });
      if (state) {
        state.user.energy = data.energy;
        renderUI(state);
      }
    } catch (err) {
      alert(err.message);
    }
  });

  try {
    await refresh(await api('/api/state'));
    skeleton.remove();
    app.classList.remove('opacity-0');
  } catch (err) {
    skeleton.innerHTML = `<p class="text-red-300 p-4">Ошибка загрузки: ${err.message}</p>`;
  }
});
