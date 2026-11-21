/**
 * Live-fight presentation FX (D-037 cutouts + showcase anim/SFX).
 * Numbers come from server CombatEvent — client does not invent damage.
 * Source showcase: idle/aura/hit/block + Web Audio synth (Tavern Hearth).
 *
 * Perf notes (battle HUD):
 * - Idle aura uses a sibling glow layer (box-shadow), not animated filter on the cutout.
 * - Combat event VFX are budgeted + speed-scalable; skip clears pending timers.
 */

let audioCtx = null;
let soundEnabled = true;
/** 1 = normal, 1.5 = faster, 2 = snappy. */
let fxSpeed = 1;
let fxToken = 0;
let activeFxNodes = 0;
const FX_CONCURRENT_MAX = 3;

try {
  const raw = localStorage.getItem("mythfel_sfx");
  if (raw === "0") soundEnabled = false;
} catch {
  /* ignore */
}

try {
  const sp = localStorage.getItem("mythfel_fx_speed");
  if (sp === "1.5" || sp === "2") fxSpeed = Number(sp);
} catch {
  /* ignore */
}

function initAudioContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx?.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function createNoiseBuffer(duration = 1) {
  if (!audioCtx) return null;
  const n = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, n, audioCtx.sampleRate);
  const out = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) out[i] = Math.random() * 2 - 1;
  return buffer;
}

function fxMs(ms) {
  return Math.max(40, Math.round(ms / fxSpeed));
}

export const SoundFX = {
  setEnabled(on) {
    soundEnabled = !!on;
    try {
      localStorage.setItem("mythfel_sfx", soundEnabled ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (soundEnabled) initAudioContext();
  },
  isEnabled() {
    return soundEnabled;
  },
  playDamage(isCrit = false) {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(isCrit ? 180 : 140, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.32);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
    const noiseBuf = createNoiseBuffer(0.25);
    if (noiseBuf) {
      const noiseSrc = audioCtx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(isCrit ? 2200 : 1200, now);
      filter.frequency.exponentialRampToValueAtTime(160, now + 0.22);
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(isCrit ? 0.8 : 0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      noiseSrc.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.25);
    }
  },
  playBlock() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [380, 740, 1180, 1620].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, now + 0.45);
      gain.gain.setValueAtTime(0.25 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    });
    const thump = audioCtx.createOscillator();
    const thumpGain = audioCtx.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(220, now);
    thump.frequency.exponentialRampToValueAtTime(50, now + 0.28);
    thumpGain.gain.setValueAtTime(0.6, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    thump.connect(thumpGain);
    thumpGain.connect(audioCtx.destination);
    thump.start(now);
    thump.stop(now + 0.32);
  },
  playTank() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const saw = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    saw.type = "sawtooth";
    saw.frequency.setValueAtTime(110, now);
    saw.frequency.exponentialRampToValueAtTime(38, now + 0.85);
    filter.type = "lowpass";
    filter.Q.value = 8;
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.exponentialRampToValueAtTime(45, now + 0.8);
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.linearRampToValueAtTime(0.85, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    saw.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    saw.start(now);
    saw.stop(now + 0.9);
  },
  playFighter() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;
    [0, 0.12].forEach((delay) => {
      const now = audioCtx.currentTime + delay;
      const nBuf = createNoiseBuffer(0.28);
      if (nBuf) {
        const nSrc = audioCtx.createBufferSource();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();
        nSrc.buffer = nBuf;
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(420, now + 0.22);
        filter.Q.value = 4;
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.65, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        nSrc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        nSrc.start(now);
        nSrc.stop(now + 0.25);
      }
    });
  },
  playAssassin() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1850, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.28);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  },
  playRanger() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const twang = audioCtx.createOscillator();
    const twangGain = audioCtx.createGain();
    twang.type = "triangle";
    twang.frequency.setValueAtTime(440, now);
    twang.frequency.exponentialRampToValueAtTime(180, now + 0.35);
    twangGain.gain.setValueAtTime(0.65, now);
    twangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    twang.connect(twangGain);
    twangGain.connect(audioCtx.destination);
    twang.start(now);
    twang.stop(now + 0.4);
  },
  playMage() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const magicOsc = audioCtx.createOscillator();
    const magicGain = audioCtx.createGain();
    magicOsc.type = "sawtooth";
    magicOsc.frequency.setValueAtTime(140, now);
    magicOsc.frequency.exponentialRampToValueAtTime(560, now + 0.3);
    magicOsc.frequency.exponentialRampToValueAtTime(80, now + 0.7);
    magicGain.gain.setValueAtTime(0.1, now);
    magicGain.gain.linearRampToValueAtTime(0.55, now + 0.25);
    magicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    magicOsc.connect(magicGain);
    magicGain.connect(audioCtx.destination);
    magicOsc.start(now);
    magicOsc.stop(now + 0.75);
  },
  playSupport() {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + 0.35);
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.52);
    });
  },
  playRole(role) {
    const r = String(role || "").toLowerCase();
    if (r === "tank") this.playTank();
    else if (r === "fighter") this.playFighter();
    else if (r === "assassin") this.playAssassin();
    else if (r === "ranger") this.playRanger();
    else if (r === "mage") this.playMage();
    else if (r === "support") this.playSupport();
    else this.playFighter();
  },
};

const ELEMENT_AURA = {
  stone: "aura-stone",
  fire: "aura-fire",
  bolt: "aura-lightning",
  grass: "aura-wind",
  ice: "aura-ice",
  water: "aura-water",
};

/** Keyframe + timing — breathe (transform) only on cutout (D-046). Aura = sibling glow. */
const BREATHE_SPEC = [
  { cls: "idle-breathe-1", name: "heroBreathe1", duration: "4.2s", delay: "0s" },
  { cls: "idle-breathe-2", name: "heroBreathe2", duration: "3.8s", delay: "-1.1s" },
  { cls: "idle-breathe-3", name: "heroBreathe3", duration: "4.5s", delay: "-2.3s" },
  { cls: "idle-breathe-4", name: "heroBreathe4", duration: "4s", delay: "-0.7s" },
  { cls: "idle-breathe-5", name: "heroBreathe5", duration: "3.6s", delay: "-1.8s" },
  { cls: "idle-breathe-6", name: "heroBreathe6", duration: "4.3s", delay: "-0.4s" },
];

const AURA_SPEC = {
  stone: { cls: "aura-stone", glow: "mf-aura-glow--stone" },
  fire: { cls: "aura-fire", glow: "mf-aura-glow--fire" },
  bolt: { cls: "aura-lightning", glow: "mf-aura-glow--bolt" },
  grass: { cls: "aura-wind", glow: "mf-aura-glow--grass" },
  ice: { cls: "aura-ice", glow: "mf-aura-glow--ice" },
  water: { cls: "aura-water", glow: "mf-aura-glow--water" },
};

const BREATHE = BREATHE_SPEC.map((s) => s.cls);

function spriteRoot(el) {
  if (!el) return null;
  if (el.matches?.("img, .mf-battle-cutout, .mf-hero-sprite")) return el;
  // Prefer the cutout img inside `.mf-sprite-face` (D-040 flip wrapper); keep breathe/hit on img.
  return (
    el.querySelector(
      ".mf-sprite-face img.mf-battle-cutout, .mf-sprite-face img, img.mf-battle-cutout, .mf-battle-cutout, .mf-unit-frame img, img"
    ) || el
  );
}

function viewportFor(el) {
  if (!el) return null;
  const frame =
    el.querySelector?.(".mf-unit-frame") ||
    el.closest?.(".mf-unit-frame") ||
    el.querySelector?.(".relative.w-full") ||
    el;
  return frame;
}

function ensureAuraGlow(frame, glowCls) {
  if (!frame) return;
  let glow = frame.querySelector(":scope > .mf-aura-glow");
  if (!glow) {
    glow = document.createElement("div");
    glow.className = "mf-aura-glow";
    glow.setAttribute("aria-hidden", "true");
    frame.appendChild(glow);
  }
  glow.className = `mf-aura-glow ${glowCls}`;
  glow.hidden = false;
}

function clearAuraGlow(frame) {
  const glow = frame?.querySelector?.(":scope > .mf-aura-glow");
  if (glow) glow.hidden = true;
}

function bumpClass(el, cls, ms) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  const token = fxToken;
  setTimeout(() => {
    if (token !== fxToken) return;
    el.classList.remove(cls);
  }, fxMs(ms));
}

function spawnFx(viewport, className, html = "", ms = 500) {
  if (!viewport) return;
  if (activeFxNodes >= FX_CONCURRENT_MAX) return;
  const node = document.createElement("div");
  node.className = className;
  if (html) node.innerHTML = html;
  viewport.appendChild(node);
  activeFxNodes += 1;
  const token = fxToken;
  setTimeout(() => {
    node.remove();
    if (token === fxToken) activeFxNodes = Math.max(0, activeFxNodes - 1);
  }, fxMs(ms));
}

function floatText(viewport, text, tone = "dmg") {
  if (!viewport) return;
  const fct = document.createElement("div");
  fct.className = `floating-combat-txt mf-fx-float ${tone === "heal" ? "is-heal" : tone === "block" ? "is-block" : "is-dmg"}`;
  fct.textContent = text;
  viewport.appendChild(fct);
  const token = fxToken;
  setTimeout(() => {
    if (token === fxToken) fct.remove();
    else fct.remove();
  }, fxMs(900));
}

/**
 * Ch3 red dogs + ch4 zombies: cutout already emits fire/plague.
 * Skip pulsing glow (washes soft fringe). Breathe still runs (D-046).
 */
function monsterGlowIsBaked(unit) {
  const id = `${unit?.id || ""} ${unit?.templateId || ""}`;
  return /bot_redd|bot_zomb|pitboss_redd|pitboss_zomb/.test(id);
}

/**
 * Idle breathe (+ optional elemental aura glow sibling) on a fight unit cutout.
 * Locked for every live-fight mode: practice / Mythmir PvE / PvP / wire (D-046, MF-149).
 * Breathe = transform on img; aura = `.mf-aura-glow` box-shadow (no filter on cutout).
 */
export function decorateBattleUnitIdle(card, unit, laneIndex = 0) {
  if (!card || !unit) return;
  const img = spriteRoot(card);
  if (!img) return;
  const frame = viewportFor(card);
  BREATHE.forEach((c) => img.classList.remove(c));
  Object.values(ELEMENT_AURA).forEach((c) => img.classList.remove(c));
  img.classList.remove("mf-sprite-crisp");
  img.style.removeProperty("animation");
  card.dataset.unitId = unit.id || "";
  card.dataset.role = unit.role || "";
  card.dataset.element = unit.element || "";
  if (!unit.alive) {
    img.classList.remove("mf-hero-sprite");
    clearAuraGlow(frame);
    return;
  }
  const breathe = BREATHE_SPEC[Math.abs(laneIndex) % BREATHE_SPEC.length];
  img.classList.add(breathe.cls, "mf-hero-sprite");
  img.style.animation = `${breathe.name} ${breathe.duration} ease-in-out ${breathe.delay} infinite`;
  img.style.transformOrigin = "bottom center";
  if (!monsterGlowIsBaked(unit)) {
    const aura = AURA_SPEC[unit.element] || AURA_SPEC.stone;
    img.classList.add(aura.cls);
    ensureAuraGlow(frame, aura.glow);
  } else {
    clearAuraGlow(frame);
  }
}

export function findBattleUnitEl(unitId) {
  if (!unitId) return null;
  const esc = CSS.escape(unitId);
  // Yard wire `#allyBoard`/`#enemyBoard` can sit outside `#viewBattle` in the DOM.
  return (
    document.querySelector(`#viewPracticeFight [data-unit-id="${esc}"]`) ||
    document.querySelector(`#viewPvpFight [data-unit-id="${esc}"]`) ||
    document.querySelector(`#viewBattle [data-unit-id="${esc}"]`) ||
    document.querySelector(`#enemyBoard [data-unit-id="${esc}"]`) ||
    document.querySelector(`#allyBoard [data-unit-id="${esc}"]`) ||
    document.querySelector(`[data-unit-id="${esc}"]`)
  );
}

function unitRoleFromDiff(diff, unitId) {
  const u = (diff?.units || []).find((x) => x.id === unitId);
  return u?.role || "";
}

export function setFxSpeed(speed) {
  const n = Number(speed);
  fxSpeed = n === 1.5 || n === 2 ? n : 1;
  try {
    localStorage.setItem("mythfel_fx_speed", String(fxSpeed));
  } catch {
    /* ignore */
  }
}

export function getFxSpeed() {
  return fxSpeed;
}

/** Cancel pending combat presentation timers / floating nodes. */
export function skipCombatFx() {
  fxToken += 1;
  activeFxNodes = 0;
  document.querySelectorAll(".mf-fx-float, .slash-impact-fx, .shield-barrier-fx").forEach((n) => n.remove());
}

/** Play presentation for server CombatEvent[] (hit | heal | status). */
export function playCombatEvents(diff) {
  const events = diff?.events;
  if (!Array.isArray(events) || !events.length) return;
  initAudioContext();
  const token = ++fxToken;
  activeFxNodes = 0;
  const playedAttack = new Set();
  const stagger = fxMs(55);
  events.forEach((ev, idx) => {
    // Soft budget: after many events, coalesce delays so settle stays snappy.
    const delay = Math.min(idx * stagger, fxMs(420));
    setTimeout(() => {
      if (token !== fxToken) return;
      const targetEl = findBattleUnitEl(ev.targetId);
      const sourceEl = findBattleUnitEl(ev.sourceId);
      const targetSprite = spriteRoot(targetEl);
      const sourceSprite = spriteRoot(sourceEl);
      const targetView = viewportFor(targetEl);
      const kind = ev.kind;

      if (kind === "hit") {
        if (ev.sourceId && !playedAttack.has(ev.sourceId)) {
          playedAttack.add(ev.sourceId);
          SoundFX.playRole(unitRoleFromDiff(diff, ev.sourceId));
          bumpClass(sourceSprite, "combat-action-shake", 500);
        }
        SoundFX.playDamage(!!ev.crit);
        bumpClass(targetSprite, "hero-damage-hit", 560);
        spawnFx(targetView, "slash-impact-fx", "", 420);
        const amt = Number(ev.amount) || 0;
        const label = ev.crit ? `-${amt} КРИТ!` : `-${amt}`;
        floatText(targetView, label, "dmg");
        if (ev.shieldAbsorb > 0) {
          floatText(targetView, `🛡 −${ev.shieldAbsorb}`, "block");
        }
        return;
      }

      if (kind === "heal") {
        SoundFX.playSupport();
        bumpClass(targetSprite, "combat-action-shake", 450);
        floatText(targetView, `+${Number(ev.amount) || 0}`, "heal");
        return;
      }

      if (kind === "dodge") {
        bumpClass(targetSprite, "combat-action-shake", 380);
        floatText(targetView, "УВОРОТ", "block");
        return;
      }

      if (kind === "status" && ev.statusOp === "block") {
        SoundFX.playBlock();
        bumpClass(targetSprite, "hero-block-brace", 620);
        spawnFx(
          targetView,
          "shield-barrier-fx",
          '<span class="mf-fx-shield-glyph">🛡</span>',
          600
        );
        floatText(targetView, "БЛОК", "block");
      }
    }, delay);
  });
}

/** Resume audio after first user gesture. */
export function bindBattleFxGestureUnlock() {
  const once = () => initAudioContext();
  document.addEventListener("pointerdown", once, { once: true });
  document.addEventListener("keydown", once, { once: true });
}
