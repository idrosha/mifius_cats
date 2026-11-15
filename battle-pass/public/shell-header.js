'use strict';
/**
 * LOCKED shell header (Stitch / Mythfel Hearth).
 * Do not fork this markup inside page HTML — edit only here.
 */
(function injectShellHeader() {
  const host = document.getElementById('site-header');
  if (!host) return;

  host.innerHTML = `
<header class="fixed top-0 inset-x-0 z-50 bg-panel/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
  <div class="h-16 w-full px-4 flex items-center justify-between gap-3">
    <div class="flex items-center gap-4 min-w-0">
      <div class="flex items-center gap-2 shrink-0 pl-0.5">
        <div class="w-9 h-9 rounded-lg bg-[#393430] flex items-center justify-center shadow-inner">
          <span class="material-symbols-outlined text-gold text-[22px]">pets</span>
        </div>
        <div class="flex flex-col leading-none">
          <span class="font-rubik font-bold text-gold uppercase tracking-wider text-lg leading-tight">Мифиус</span>
          <span class="text-[10px] uppercase tracking-widest text-muted leading-none">Mythfel Hearth</span>
        </div>
      </div>
      <nav class="hidden xl:flex items-center gap-1 bg-panelDeep p-1 rounded-xl" aria-label="Основное меню">
        <a href="#" aria-current="page" data-path="sezon"
          class="px-3 py-1 rounded-lg bg-[#d99b26] text-[#432c00] font-rubik font-bold text-xs tracking-wide shadow-[0_2px_8px_rgba(217,155,38,0.35)]">СЕЗОН</a>
        <a href="#" data-path="mifmir"
          class="px-3 py-1 rounded-lg text-muted hover:text-ink hover:bg-[#2e2926] font-rubik font-semibold text-xs tracking-wide transition-colors">МИФМИР</a>
        <a href="#" data-path="dom-khranitelya"
          class="px-3 py-1 rounded-lg text-muted hover:text-ink hover:bg-[#2e2926] font-rubik font-semibold text-xs tracking-wide transition-colors">ДОМ ХРАНИТЕЛЯ</a>
        <a href="#" data-path="boi"
          class="px-3 py-1 rounded-lg text-muted hover:text-ink hover:bg-[#2e2926] font-rubik font-semibold text-xs tracking-wide transition-colors">БОИ</a>
        <a href="#" data-path="torgovlya"
          class="px-3 py-1 rounded-lg text-muted hover:text-ink hover:bg-[#2e2926] font-rubik font-semibold text-xs tracking-wide transition-colors">ТОРГОВЛЯ</a>
        <a href="#" data-path="gildiya"
          class="px-3 py-1 rounded-lg text-muted hover:text-ink hover:bg-[#2e2926] font-rubik font-semibold text-xs tracking-wide transition-colors">ГИЛЬДИЯ</a>
      </nav>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <div class="flex items-center gap-1 bg-panelDeep px-2 py-1 rounded-lg shadow-inner">
        <span class="material-symbols-outlined text-green text-[18px]">set_meal</span>
        <div class="flex flex-col leading-none">
          <span class="text-[9px] uppercase text-muted">Рыбка</span>
          <span id="fishStat" class="font-rubik font-bold text-sm">1,420</span>
        </div>
      </div>
      <div class="flex items-center gap-1 bg-panelDeep px-2 py-1 rounded-lg shadow-inner">
        <span class="material-symbols-outlined text-gold text-[18px]">monetization_on</span>
        <div class="flex flex-col leading-none">
          <span class="text-[9px] uppercase text-muted">Золото</span>
          <span id="goldStat" class="font-rubik font-bold text-sm">8,950</span>
        </div>
      </div>
      <div class="flex items-center gap-1 bg-panelDeep px-2 py-1 rounded-lg shadow-inner">
        <span class="material-symbols-outlined text-green text-[18px]">bolt</span>
        <div class="flex flex-col leading-none">
          <span class="text-[9px] uppercase text-muted">Энергия</span>
          <span id="energyStat" class="font-rubik font-bold text-sm">84/100</span>
        </div>
      </div>
      <div class="hidden sm:flex items-center gap-1 bg-panelDeep px-2 py-1 rounded-lg shadow-inner">
        <span class="material-symbols-outlined text-[#ffb4a6] text-[18px]">diamond</span>
        <div class="flex flex-col leading-none">
          <span class="text-[9px] uppercase text-muted">Кристаллы</span>
          <span id="crystalStat" class="font-rubik font-bold text-sm">350</span>
        </div>
      </div>
      <div class="h-6 w-px bg-[#393430] mx-1 hidden sm:block"></div>
      <div class="w-8 h-8 rounded-full bg-gold flex items-center justify-center shadow-md ring-2 ring-[#d99b26]">
        <span class="material-symbols-outlined text-[#432c00] text-[18px]">person</span>
      </div>
    </div>
  </div>
</header>`;
})();
