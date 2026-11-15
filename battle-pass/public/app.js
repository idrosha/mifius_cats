'use strict';

const fmt = (n) => Number(n).toLocaleString('ru-RU');

function rewardIcon(reward, kind) {
  const n = (reward.name || '').toLowerCase();
  if (reward.isMythic || n.includes('барс') || n.includes('панцир')) return 'workspace_premium';
  if (n.includes('золот')) return 'monetization_on';
  if (n.includes('рыб')) return 'set_meal';
  if (n.includes('мят')) return 'eco';
  if (n.includes('корм')) return 'restaurant';
  if (n.includes('фолиант') || n.includes('опыт')) return 'menu_book';
  if (n.includes('свиток')) return 'description';
  if (n.includes('амулет') || n.includes('перстен')) return 'diamond';
  if (n.includes('сливк') || n.includes('зель')) return 'science';
  return kind === 'elite' ? 'inventory_2' : 'redeem';
}

function statusHtml(userLevel, level, claimed, type) {
  if (level > userLevel) {
    return `<span class="text-[10px] text-[#9d8f7b] flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">lock</span>Заперто</span>`;
  }
  if (claimed) {
    return `<span class="text-[10px] text-green flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">check_circle</span>Получено</span>`;
  }
  return `<button type="button" data-claim data-level="${level}" data-type="${type}"
    class="w-full min-h-[32px] bg-gradient-to-r from-gold via-[#d99b26] to-gold text-[#432c00] text-[10px] font-rubik font-bold py-1 rounded uppercase mt-0.5 shadow-[0_0_16px_rgba(253,186,69,0.9)] hover:brightness-110 active:scale-95 transition-all duration-200">Забрать</button>`;
}

function rewardCard(user, row, kind) {
  const reward = kind === 'elite' ? row.eliteReward : row.freeReward;
  const locked = row.level > user.level;
  const active = row.level === user.level;
  const claimed = reward.claimed;
  const mythic = reward.isMythic
    ? `<span class="bg-gold text-[#432c00] text-[8px] font-bold px-1 rounded">МИФИК</span>`
    : '';
  const icon = rewardIcon(reward, kind);

  const base =
    kind === 'elite'
      ? `min-h-[120px] sm:min-h-[144px] bg-gradient-to-b from-[#d99b26]/20 via-panelDeep/95 to-panelDeep border border-gold/40`
      : `h-24 sm:h-28 bg-panelDeep/90 border border-line/30`;

  const glow =
    active && !claimed
      ? 'border-2 border-gold ring-2 ring-gold/40 shadow-[0_0_16px_rgba(253,186,69,0.9)]'
      : '';
  const dim = claimed || locked ? 'opacity-75' : '';

  return `<div class="w-full ${base} ${glow} ${dim} rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all duration-200">
    ${mythic}
    <span class="material-symbols-outlined text-gold text-[28px] sm:text-[32px] ${reward.isMythic ? 'fill-icon' : ''}">${icon}</span>
    <span class="text-[10px] sm:text-[11px] font-rubik font-bold text-center leading-tight line-clamp-2 ${kind === 'elite' ? 'text-gold' : ''}">${reward.name}</span>
    ${statusHtml(user.level, row.level, claimed, kind)}
  </div>`;
}

function levelNode(user, row, passMax) {
  const active = row.level === user.level;
  const done = row.level < user.level;
  const circle = active
    ? `w-9 h-9 sm:w-10 sm:h-10 bg-gold text-panelDeep shadow-[0_0_16px_rgba(253,186,69,0.9)] ring-2 ring-[#ffdeae] border border-gold`
    : done
      ? `w-8 h-8 sm:w-9 sm:h-9 bg-green text-[#003910]`
      : `w-8 h-8 sm:w-9 sm:h-9 bg-[#393430] text-muted`;
  const tag = active
    ? `<span class="text-[8px] sm:text-[9px] text-gold font-bold uppercase -mt-1 bg-panelDeep/90 px-1 rounded">ТЕКУЩИЙ</span>`
    : row.level === passMax
      ? `<span class="text-[8px] text-gold font-bold uppercase -mt-1">ФИНАЛ</span>`
      : '';

  return `<div data-pass-level="${row.level}" class="snap-start flex-shrink-0 min-w-[130px] sm:min-w-[150px] flex flex-col items-center justify-between h-full ${active ? 'scale-[1.02] sm:scale-[1.03] z-10' : ''} transition-all duration-200">
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
      (item) => `<article class="bg-panelDeep/90 border border-gold/40 rounded-xl p-3 transition-all duration-200 hover:border-gold min-w-0">
        <div class="flex items-center gap-2 min-w-0">
          <div class="font-rubik font-bold text-gold text-sm truncate">${item.name}</div>
          ${item.tag ? `<span class="bg-gold/20 text-gold text-[10px] font-bold px-1 rounded shrink-0">${item.tag}</span>` : ''}
        </div>
        <p class="text-xs text-muted mt-0.5 line-clamp-2">${item.desc}</p>
      </article>`,
    )
    .join('');
}

let didInitialScroll = false;

function scrollTrackBy(dir) {
  const track = document.getElementById('passTrack');
  if (!track) return;
  const step = Math.max(260, Math.floor(track.clientWidth * 0.75));
  track.scrollBy({ left: dir * step, behavior: 'smooth' });
}

function scrollToCurrentLevel(userLevel) {
  const track = document.getElementById('passTrack');
  const col = document.querySelector(`[data-pass-level="${userLevel}"]`);
  if (!track || !col) return;
  const left = col.offsetLeft - track.clientWidth / 2 + col.offsetWidth / 2;
  track.scrollLeft = Math.max(0, left);
}

function renderUI(state) {
  const { user, passLevels, seasonPreview, passMax } = state;
  const track = document.getElementById('passTrack');
  const scrollLeft = track ? track.scrollLeft : 0;
  const max = passMax || (passLevels[passLevels.length - 1]?.level ?? 50);

  document.getElementById('goldStat').textContent = fmt(user.gold);
  const fishEl = document.getElementById('fishStat');
  if (fishEl) fishEl.textContent = fmt(user.fish);
  document.getElementById('energyStat').textContent = `${user.energy}/${user.maxEnergy}`;
  document.getElementById('levelBadge').textContent = `УР. ${user.level}`;
  document.getElementById('xpLabel').textContent = `${fmt(user.xp)} / ${fmt(user.maxXp)} XP`;
  const pct = Math.min(100, (user.xp / user.maxXp) * 100);
  document.getElementById('xpBar').style.width = `${pct}%`;

  const range = `1–${max}`;
  const rangeLabel = document.getElementById('passRangeLabel');
  if (rangeLabel) rangeLabel.textContent = `Уровни ${range}`;
  const badge = document.getElementById('passLevelsBadge');
  if (badge) badge.textContent = range;

  const grid = document.getElementById('passGrid');
  const frag = document.createDocumentFragment();
  const wrap = document.createElement('div');
  wrap.innerHTML = passLevels.map((row) => levelNode(user, row, max)).join('');
  while (wrap.firstChild) frag.appendChild(wrap.firstChild);
  grid.replaceChildren(frag);
  renderSeason(seasonPreview);

  if (track) {
    if (!didInitialScroll) {
      scrollToCurrentLevel(user.level);
      didInitialScroll = true;
    } else {
      track.scrollLeft = scrollLeft;
    }
  }
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
  const passTrack = document.getElementById('passTrack');

  document.getElementById('passScrollPrev').addEventListener('click', () => scrollTrackBy(-1));
  document.getElementById('passScrollNext').addEventListener('click', () => scrollTrackBy(1));

  // Delegation on track (survives grid re-render + horizontal scroll)
  passTrack.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-claim]');
    if (!btn || !passTrack.contains(btn)) return;
    try {
      await refresh(
        await api('/api/claim-reward', {
          level: Number(btn.dataset.level),
          type: btn.dataset.type,
        }),
      );
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
