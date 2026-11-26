/**
 * Live-fight presentation FX (D-037 cutouts + role action clips).
 * Numbers come from server CombatEvent — client does not invent damage.
 * Idle breathe/aura stay on the sprite; action motion runs on the unit slot,
 * then returnHome restores slot transform. skipCombatFx clears everything.
 */

let audioCtx = null;
let soundEnabled = true;
/** 1 = normal, 1.5 = faster, 2 = snappy. */
let fxSpeed = 1;
let fxToken = 0;
let activeFxNodes = 0;
const FX_CONCURRENT_MAX = 8;
const MOTION_CLASS = "mf-fx-motion";
const HOME_GUARD = new WeakMap();

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

function wait(ms, token) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(token === fxToken), fxMs(ms));
  });
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

const ELEMENT_FX = {
  stone: "mf-fx-el-stone",
  fire: "mf-fx-el-fire",
  bolt: "mf-fx-el-bolt",
  grass: "mf-fx-el-wind",
  ice: "mf-fx-el-ice",
  water: "mf-fx-el-water",
  wind: "mf-fx-el-wind",
};

/** Keyframe + timing — breathe (transform) and aura (filter) must share one animation list (D-046). */
const BREATHE_SPEC = [
  { cls: "idle-breathe-1", name: "heroBreathe1", duration: "4.2s", delay: "0s" },
  { cls: "idle-breathe-2", name: "heroBreathe2", duration: "3.8s", delay: "-1.1s" },
  { cls: "idle-breathe-3", name: "heroBreathe3", duration: "4.5s", delay: "-2.3s" },
  { cls: "idle-breathe-4", name: "heroBreathe4", duration: "4s", delay: "-0.7s" },
  { cls: "idle-breathe-5", name: "heroBreathe5", duration: "3.6s", delay: "-1.8s" },
  { cls: "idle-breathe-6", name: "heroBreathe6", duration: "4.3s", delay: "-0.4s" },
];

const AURA_SPEC = {
  stone: { cls: "aura-stone", name: "pulseGlowStone", duration: "4s" },
  fire: { cls: "aura-fire", name: "pulseGlowFire", duration: "3.6s" },
  bolt: { cls: "aura-lightning", name: "pulseGlowLightning", duration: "3.4s" },
  grass: { cls: "aura-wind", name: "pulseGlowWind", duration: "4.2s" },
  ice: { cls: "aura-ice", name: "pulseGlowIce", duration: "3.8s" },
  water: { cls: "aura-water", name: "pulseGlowWater", duration: "4.1s" },
};

const BREATHE = BREATHE_SPEC.map((s) => s.cls);
const BACKLINE_ROLES = new Set(["support", "mage", "ranger"]);

function spriteRoot(el) {
  if (!el) return null;
  if (el.matches?.("img, .mf-battle-cutout, .mf-hero-sprite")) return el;
  return (
    el.querySelector(
      ".mf-sprite-face img.mf-battle-cutout, .mf-sprite-face img, img.mf-battle-cutout, .mf-battle-cutout, .mf-unit-frame img, img"
    ) || el
  );
}

function viewportFor(el) {
  if (!el) return null;
  return (
    el.querySelector?.(".mf-unit-frame") ||
    el.closest?.(".mf-unit-frame") ||
    el.querySelector?.(".relative.w-full") ||
    el
  );
}

/** Slot root that can leave formation — keeps idle breathe on the img. */
function motionRoot(el) {
  if (!el) return null;
  if (el.hasAttribute?.("data-unit-id")) return el;
  return el.closest?.("[data-unit-id]") || el;
}

function bumpClass(el, cls, ms) {
  if (!el || !cls) return;
  const parts = String(cls).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return;
  el.classList.remove(...parts);
  void el.offsetWidth;
  el.classList.add(...parts);
  const token = fxToken;
  setTimeout(() => {
    if (token !== fxToken) return;
    el.classList.remove(...parts);
  }, fxMs(ms));
}

function fxLayer() {
  let layer = document.getElementById("mf-battle-fx-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "mf-battle-fx-layer";
    layer.className = "mf-battle-fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
  }
  return layer;
}

function trackFxNode(node, ms) {
  if (!node) return;
  activeFxNodes += 1;
  const token = fxToken;
  setTimeout(() => {
    node.remove();
    if (token === fxToken) activeFxNodes = Math.max(0, activeFxNodes - 1);
  }, fxMs(ms));
}

function spawnFx(viewport, className, html = "", ms = 500) {
  if (!viewport) return null;
  if (activeFxNodes >= FX_CONCURRENT_MAX) return null;
  const node = document.createElement("div");
  node.className = className;
  if (html) node.innerHTML = html;
  viewport.appendChild(node);
  trackFxNode(node, ms);
  return node;
}

function floatText(viewport, text, tone = "dmg") {
  if (!viewport) return;
  const fct = document.createElement("div");
  const toneCls =
    tone === "heal"
      ? "is-heal"
      : tone === "block"
        ? "is-block"
        : tone === "buff"
          ? "is-buff"
          : tone === "status"
            ? "is-status"
            : "is-dmg";
  fct.className = `floating-combat-txt mf-fx-float ${toneCls}`;
  fct.textContent = text;
  viewport.appendChild(fct);
  const token = fxToken;
  setTimeout(() => fct.remove(), fxMs(900));
  void token;
}

function elCenter(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

function centerDelta(fromEl, toEl, approach = 0.72) {
  const a = elCenter(fromEl);
  const b = elCenter(toEl);
  return {
    dx: (b.x - a.x) * approach,
    dy: (b.y - a.y) * approach,
  };
}

function elementClass(element) {
  return ELEMENT_FX[element] || ELEMENT_FX.stone;
}

function unitFromDiff(diff, unitId) {
  return (diff?.units || []).find((x) => x.id === unitId) || null;
}

function unitRoleFromDiff(diff, unitId) {
  return unitFromDiff(diff, unitId)?.role || "";
}

function unitElementFromDiff(diff, unitId) {
  return unitFromDiff(diff, unitId)?.element || "";
}

function isBacklineTarget(diff, sourceId, targetId) {
  const src = unitFromDiff(diff, sourceId);
  const tgt = unitFromDiff(diff, targetId);
  if (!tgt) return false;
  if (BACKLINE_ROLES.has(String(tgt.role || "").toLowerCase())) return true;
  if (typeof tgt.lane === "number" && typeof src?.lane === "number") {
    return tgt.lane > src.lane || tgt.lane >= 2;
  }
  if (typeof tgt.lane === "number") return tgt.lane >= 2;
  return false;
}

function guardHome(root) {
  if (!root || HOME_GUARD.has(root)) return;
  HOME_GUARD.set(root, true);
  const token = fxToken;
  setTimeout(() => {
    if (token !== fxToken) return;
    if (root.classList.contains(MOTION_CLASS)) returnHome(root);
    HOME_GUARD.delete(root);
  }, fxMs(2200));
}

/** Melee step / lunge toward target slot. */
export function dashTo(source, target, opts = {}) {
  const root = motionRoot(source);
  const dest = motionRoot(target) || target;
  if (!root || !dest) return Promise.resolve(false);
  const approach = opts.approach ?? 0.7;
  const ms = opts.ms ?? 280;
  const { dx, dy } = centerDelta(root, dest, approach);
  root.classList.add(MOTION_CLASS, "mf-fx-dash");
  root.style.setProperty("--fx-dx", `${dx}px`);
  root.style.setProperty("--fx-dy", `${dy}px`);
  root.style.transition = `transform ${fxMs(ms)}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
  root.style.transform = `translate(${dx}px, ${dy}px)`;
  root.style.zIndex = "40";
  guardHome(root);
  return wait(ms, fxToken);
}

/** Assassin / fighter leap along a parabolic arc onto the target. */
export function jumpArc(source, target, opts = {}) {
  const root = motionRoot(source);
  const dest = motionRoot(target) || target;
  if (!root || !dest) return Promise.resolve(false);
  const approach = opts.approach ?? 0.78;
  const ms = opts.ms ?? 420;
  const arc = opts.arc ?? 72;
  const { dx, dy } = centerDelta(root, dest, approach);
  root.classList.add(MOTION_CLASS, "mf-fx-jump");
  root.style.setProperty("--fx-dx", `${dx}px`);
  root.style.setProperty("--fx-dy", `${dy}px`);
  root.style.setProperty("--fx-arc", `${arc}px`);
  root.style.transition = "none";
  void root.offsetWidth;
  root.style.animation = `mfJumpArc ${fxMs(ms)}ms cubic-bezier(0.33, 0.1, 0.25, 1) forwards`;
  root.style.zIndex = "45";
  guardHome(root);
  spawnFx(viewportFor(root), "mf-fx-jump-smoke", "", 480);
  return wait(ms, fxToken);
}

/** Ranged / spell projectile from source center to target center. */
export function projectile(source, target, style = "arrow", opts = {}) {
  const aEl = motionRoot(source) || source;
  const bEl = motionRoot(target) || target;
  if (!aEl || !bEl) return Promise.resolve(false);
  if (activeFxNodes >= FX_CONCURRENT_MAX) return Promise.resolve(false);
  const a = elCenter(aEl);
  const b = elCenter(bEl);
  const ms = opts.ms ?? (style === "beam" ? 360 : 320);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const node = document.createElement("div");
  const elCls = elementClass(opts.element);
  node.className = `mf-fx-projectile mf-fx-projectile--${style} ${elCls}`;
  node.style.left = `${a.x}px`;
  node.style.top = `${a.y}px`;
  node.style.setProperty("--fx-dx", `${dx}px`);
  node.style.setProperty("--fx-dy", `${dy}px`);
  node.style.setProperty("--fx-dist", `${dist}px`);
  node.style.setProperty("--fx-rot", `${angle}deg`);
  node.style.animationDuration = `${fxMs(ms)}ms`;
  fxLayer().appendChild(node);
  trackFxNode(node, ms + 40);
  return wait(ms, fxToken);
}

/** Support / buff / cleanse wave traveling source → each target. */
export function wave(source, targets, style = "heal", opts = {}) {
  const aEl = motionRoot(source) || source;
  if (!aEl) return Promise.resolve(false);
  const list = (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
  if (!list.length) return Promise.resolve(false);
  const ms = opts.ms ?? 380;
  const a = elCenter(aEl);
  const ring = style === "aoe" || style === "aoe_heal" || list.length > 2;
  if (ring) {
    if (activeFxNodes < FX_CONCURRENT_MAX) {
      const node = document.createElement("div");
      node.className = `mf-fx-wave-ring mf-fx-wave--${style} ${elementClass(opts.element)}`;
      node.style.left = `${a.x}px`;
      node.style.top = `${a.y}px`;
      node.style.animationDuration = `${fxMs(ms + 120)}ms`;
      fxLayer().appendChild(node);
      trackFxNode(node, ms + 160);
    }
  }
  list.forEach((t, i) => {
    const bEl = motionRoot(t) || t;
    if (!bEl || activeFxNodes >= FX_CONCURRENT_MAX) return;
    const b = elCenter(bEl);
    const node = document.createElement("div");
    node.className = `mf-fx-wave mf-fx-wave--${style} ${elementClass(opts.element)}`;
    node.style.left = `${a.x}px`;
    node.style.top = `${a.y}px`;
    node.style.setProperty("--fx-dx", `${b.x - a.x}px`);
    node.style.setProperty("--fx-dy", `${b.y - a.y}px`);
    node.style.animationDelay = `${fxMs(i * 40)}ms`;
    node.style.animationDuration = `${fxMs(ms)}ms`;
    fxLayer().appendChild(node);
    trackFxNode(node, ms + i * 40 + 40);
  });
  return wait(ms + Math.min(list.length, 3) * 40, fxToken);
}

/** Snap unit back to formation slot. */
export function returnHome(source) {
  const root = motionRoot(source);
  if (!root) return Promise.resolve(false);
  root.classList.remove("mf-fx-dash", "mf-fx-jump", "mf-fx-windup", "mf-fx-cast");
  root.style.animation = "";
  root.style.transition = `transform ${fxMs(220)}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${fxMs(180)}ms ease`;
  root.style.transform = "translate(0, 0)";
  root.style.opacity = "";
  root.style.zIndex = "";
  root.style.removeProperty("--fx-dx");
  root.style.removeProperty("--fx-dy");
  root.style.removeProperty("--fx-arc");
  const token = fxToken;
  return wait(230, token).then((ok) => {
    if (!ok) return false;
    root.classList.remove(MOTION_CLASS);
    root.style.transition = "";
    root.style.transform = "";
    HOME_GUARD.delete(root);
    return true;
  });
}

function windup(sourceEl, role) {
  const root = motionRoot(sourceEl);
  const sprite = spriteRoot(sourceEl);
  if (!root) return Promise.resolve(false);
  root.classList.add(MOTION_CLASS, "mf-fx-windup");
  const pose =
    role === "mage" || role === "support"
      ? "mf-fx-cast"
      : role === "tank"
        ? "mf-fx-brace"
        : "mf-fx-windup-pose";
  bumpClass(sprite, pose, 260);
  bumpClass(root, pose, 260);
  return wait(140, fxToken);
}

/**
 * Ch3 red dogs + ch4 zombies: cutout already emits fire/plague.
 * Skip pulsing drop-shadow aura (washes soft fringe). Breathe still runs (D-046).
 */
function monsterGlowIsBaked(unit) {
  const id = `${unit?.id || ""} ${unit?.templateId || ""}`;
  return /bot_redd|bot_zomb|pitboss_redd|pitboss_zomb/.test(id);
}

/**
 * Idle breathe (+ optional elemental aura) on a fight unit cutout.
 * Locked for every live-fight mode: practice / Mythmir PvE / PvP / wire (D-046, MF-149).
 */
export function decorateBattleUnitIdle(card, unit, laneIndex = 0) {
  if (!card || !unit) return;
  const img = spriteRoot(card);
  if (!img) return;
  BREATHE.forEach((c) => img.classList.remove(c));
  Object.values(ELEMENT_AURA).forEach((c) => img.classList.remove(c));
  img.classList.remove("mf-sprite-crisp", "mf-fx-stealth", "mf-fx-dead-settle");
  img.style.removeProperty("animation");
  card.dataset.unitId = unit.id || "";
  card.dataset.role = unit.role || "";
  card.dataset.element = unit.element || "";
  if (typeof unit.lane === "number") card.dataset.lane = String(unit.lane);
  if (!unit.alive) {
    img.classList.remove("mf-hero-sprite");
    card.classList.add("mf-unit-dead");
    return;
  }
  card.classList.remove("mf-unit-dead");
  const breathe = BREATHE_SPEC[Math.abs(laneIndex) % BREATHE_SPEC.length];
  const anim = [`${breathe.name} ${breathe.duration} ease-in-out ${breathe.delay} infinite`];
  img.classList.add(breathe.cls, "mf-hero-sprite");
  if (!monsterGlowIsBaked(unit)) {
    const aura = AURA_SPEC[unit.element] || AURA_SPEC.stone;
    img.classList.add(aura.cls);
    anim.push(`${aura.name} ${aura.duration} ease-in-out infinite`);
  }
  const stealth = (unit.statuses || []).some((s) => s.id === "stealth");
  img.classList.toggle("mf-fx-stealth", stealth);
  img.style.animation = anim.join(", ");
  img.style.transformOrigin = "bottom center";
}

export function findBattleUnitEl(unitId) {
  if (!unitId) return null;
  const esc = CSS.escape(unitId);
  return (
    document.querySelector(`#viewPracticeFight [data-unit-id="${esc}"]`) ||
    document.querySelector(`#viewPvpFight [data-unit-id="${esc}"]`) ||
    document.querySelector(`#viewRaidBattle [data-unit-id="${esc}"]`) ||
    document.querySelector(`#viewBattle [data-unit-id="${esc}"]`) ||
    document.querySelector(`#enemyBoard [data-unit-id="${esc}"]`) ||
    document.querySelector(`#allyBoard [data-unit-id="${esc}"]`) ||
    document.querySelector(`[data-unit-id="${esc}"]`)
  );
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

/** Cancel pending combat presentation timers / floating nodes / motion. */
export function skipCombatFx() {
  fxToken += 1;
  activeFxNodes = 0;
  document
    .querySelectorAll(
      ".mf-fx-float, .slash-impact-fx, .shield-barrier-fx, .mf-fx-projectile, .mf-fx-wave, .mf-fx-wave-ring, .mf-fx-jump-smoke, .mf-fx-impact, .mf-fx-crit-flash, .mf-fx-pierce, .mf-fx-status-mark, .mf-fx-taunt-mark, .mf-fx-heal-pulse, .mf-fx-potion, .mf-fx-aoe-blast, .mf-fx-death-shadow"
    )
    .forEach((n) => n.remove());
  document.querySelectorAll(`.${MOTION_CLASS}`).forEach((el) => {
    el.classList.remove(
      MOTION_CLASS,
      "mf-fx-dash",
      "mf-fx-jump",
      "mf-fx-windup",
      "mf-fx-cast",
      "mf-fx-brace",
      "mf-fx-windup-pose"
    );
    el.style.transition = "";
    el.style.transform = "";
    el.style.animation = "";
    el.style.opacity = "";
    el.style.zIndex = "";
    el.style.removeProperty("--fx-dx");
    el.style.removeProperty("--fx-dy");
    el.style.removeProperty("--fx-arc");
  });
  const layer = document.getElementById("mf-battle-fx-layer");
  if (layer) layer.innerHTML = "";
}

function playHitImpact(ev, opts = {}) {
  const targetEl = findBattleUnitEl(ev.targetId);
  const targetSprite = spriteRoot(targetEl);
  const targetView = viewportFor(targetEl);
  const secondary = !!ev.aoeSecondary;
  const strength = secondary ? " is-secondary" : "";
  const crit = !!ev.crit;

  if (ev.pierce) {
    spawnFx(targetView, `mf-fx-pierce mf-fx-impact${strength}`, "", 520);
  } else if (crit) {
    spawnFx(targetView, `mf-fx-crit-flash mf-fx-impact${strength}`, "", 520);
    spawnFx(targetView, `slash-impact-fx${strength}`, "", 420);
  } else {
    spawnFx(targetView, `slash-impact-fx${strength}`, "", 420);
  }

  const hitCls = crit ? "hero-damage-hit is-crit" : secondary ? "hero-damage-hit is-secondary" : "hero-damage-hit";
  bumpClass(targetSprite, hitCls, crit ? 640 : 560);
  if (targetEl) bumpClass(targetEl, "mf-fx-hit-react", 560);

  SoundFX.playDamage(crit);

  const amt = Number(ev.amount) || 0;
  if (amt > 0) {
    const label = crit ? `-${amt} КРИТ!` : `-${amt}`;
    floatText(targetView, label, "dmg");
  }
  if (ev.shieldAbsorb > 0) {
    floatText(targetView, `🛡 −${ev.shieldAbsorb}`, "block");
    if (!opts.skipBlockPose) {
      bumpClass(targetSprite, "hero-block-brace", 420);
      spawnFx(targetView, "shield-barrier-fx is-absorb", '<span class="mf-fx-shield-glyph">🛡</span>', 500);
    }
  }
  if (ev.kill) {
    bumpClass(targetSprite, "mf-fx-dead-settle", 900);
    bumpClass(targetEl, "mf-fx-dead-settle", 900);
    spawnFx(targetView, "mf-fx-death-shadow", "", 900);
  }
}

function playHealOnTarget(ev) {
  const targetEl = findBattleUnitEl(ev.targetId);
  const targetSprite = spriteRoot(targetEl);
  const targetView = viewportFor(targetEl);
  bumpClass(targetSprite, "mf-fx-heal-pulse", 520);
  spawnFx(targetView, "mf-fx-heal-burst", "", 560);
  floatText(targetView, `+${Number(ev.amount) || 0}`, "heal");
}

function playDodge(ev) {
  const targetEl = findBattleUnitEl(ev.targetId);
  const targetSprite = spriteRoot(targetEl);
  const targetView = viewportFor(targetEl);
  bumpClass(targetSprite, "mf-fx-dodge", 420);
  bumpClass(targetEl, "mf-fx-dodge", 420);
  floatText(targetView, "УВОРОТ", "block");
}

function playBlock(ev) {
  const targetEl = findBattleUnitEl(ev.targetId);
  const targetSprite = spriteRoot(targetEl);
  const targetView = viewportFor(targetEl);
  SoundFX.playBlock();
  bumpClass(targetSprite, "hero-block-brace", 620);
  spawnFx(targetView, "shield-barrier-fx", '<span class="mf-fx-shield-glyph">🛡</span>', 600);
  floatText(targetView, "БЛОК", "block");
}

function playStatusApply(ev, sourceEl, role) {
  const targetEl = findBattleUnitEl(ev.targetId);
  const targetSprite = spriteRoot(targetEl);
  const targetView = viewportFor(targetEl);
  const st = String(ev.status || "").toLowerCase();
  const op = String(ev.statusOp || "").toLowerCase();

  if (op === "block") {
    playBlock(ev);
    return;
  }
  if (op === "shield" || (op === "apply" && st === "shield")) {
    SoundFX.playBlock();
    bumpClass(targetSprite, "hero-block-brace", 620);
    spawnFx(targetView, "shield-barrier-fx", '<span class="mf-fx-shield-glyph">🛡</span>', 700);
    const amt = Number(ev.amount) || 0;
    floatText(targetView, amt ? `+${amt} щит` : "ЩИТ", "block");
    if (sourceEl && sourceEl !== targetEl) {
      wave(sourceEl, [targetEl], "shield", { element: "water", ms: 340 });
    }
    return;
  }
  if (op === "clear") {
    spawnFx(targetView, "mf-fx-cleanse-sparks", "", 600);
    floatText(targetView, "ОЧИЩЕНО", "buff");
    return;
  }
  if (op !== "apply" && op !== "shield") return;

  if (st === "taunt") {
    bumpClass(targetSprite, "mf-fx-taunt-roar", 700);
    spawnFx(targetView, "mf-fx-taunt-mark", "!", 900);
    floatText(targetView, "АГРА", "status");
    // Glance: briefly nudge living enemies toward the tank.
    document.querySelectorAll("[data-unit-id]").forEach((el) => {
      if (el === targetEl) return;
      if (el.classList.contains("mf-unit-dead")) return;
      bumpClass(el, "mf-fx-look-at", 500);
    });
    return;
  }
  if (st === "stealth") {
    bumpClass(targetSprite, "mf-fx-stealth-enter", 700);
    targetSprite?.classList.add("mf-fx-stealth");
    spawnFx(targetView, "mf-fx-jump-smoke", "", 560);
    floatText(targetView, "СТЕЛС", "status");
    return;
  }
  if (st === "atk_up") {
    bumpClass(targetSprite, "mf-fx-buff-pulse", 520);
    spawnFx(targetView, "mf-fx-status-mark is-buff", "ATK↑", 700);
    floatText(targetView, `+${Number(ev.amount) || 0} ATK`, "buff");
    if (sourceEl && sourceEl !== targetEl) {
      wave(sourceEl, [targetEl], "buff", { element: "fire", ms: 340 });
    }
    return;
  }
  if (st === "stun" || st === "sleep") {
    bumpClass(targetSprite, "mf-fx-stun", 800);
    spawnFx(targetView, "mf-fx-status-mark is-stun", "✦", 800);
    floatText(targetView, st === "sleep" ? "СОН" : "СТАН", "status");
    return;
  }
  if (st === "poison") {
    spawnFx(targetView, "mf-fx-status-mark is-poison", "☠", 700);
    floatText(targetView, "ЯД", "status");
    return;
  }
  if (st === "bleed") {
    spawnFx(targetView, "mf-fx-status-mark is-bleed", "🩸", 700);
    floatText(targetView, "КРОВЬ", "status");
    return;
  }
  if (st === "fragile") {
    spawnFx(targetView, "mf-fx-status-mark is-fragile", "✖", 700);
    floatText(targetView, "ХРУПК.", "status");
    return;
  }
  if (st === "weak" || st === "vuln") {
    spawnFx(targetView, `mf-fx-status-mark is-${st}`, st === "weak" ? "↓" : "◎", 700);
    floatText(targetView, st === "weak" ? "СЛАБ." : "УЯЗВ.", "status");
    return;
  }
  if (st === "cleanser") {
    spawnFx(targetView, "mf-fx-cleanse-sparks", "", 600);
    if (sourceEl) wave(sourceEl, [targetEl], "cleanse", { element: "water", ms: 340 });
    floatText(targetView, "ОЧИЩ.", "buff");
    return;
  }
  if (role === "support" || role === "tank") {
    bumpClass(targetSprite, "combat-action-shake", 360);
  }
}

function playDotTick(ev) {
  const targetEl = findBattleUnitEl(ev.targetId);
  const targetSprite = spriteRoot(targetEl);
  const targetView = viewportFor(targetEl);
  bumpClass(targetSprite, "mf-fx-dot-tick", 360);
  const amt = Number(ev.amount) || 0;
  if (amt > 0) floatText(targetView, `-${amt}`, "dmg");
  spawnFx(targetView, "mf-fx-status-mark is-bleed", "", 420);
  if (ev.kill) {
    bumpClass(targetSprite, "mf-fx-dead-settle", 900);
    spawnFx(targetView, "mf-fx-death-shadow", "", 900);
  }
}

async function playMeleeAttack(diff, sourceEl, hits, role, token) {
  const primary = hits.find((h) => !h.aoeSecondary) || hits[0];
  if (!primary) return;
  const targetEl = findBattleUnitEl(primary.targetId);
  if (!targetEl) {
    hits.forEach((h) => playHitImpact(h));
    return;
  }
  const backline = isBacklineTarget(diff, primary.sourceId, primary.targetId);
  const span = (() => {
    try {
      const a = elCenter(sourceEl);
      const b = elCenter(targetEl);
      return Math.hypot(b.x - a.x, b.y - a.y);
    } catch {
      return 0;
    }
  })();
  const longLeap = span > 130;
  const dual =
    hits.filter((h) => h.targetId === primary.targetId && h.sourceId).length >= 2 &&
    role === "fighter";

  await windup(sourceEl, role);
  if (token !== fxToken) return;

  if (role === "assassin" && (backline || longLeap)) {
    await jumpArc(sourceEl, targetEl, { ms: 440, arc: 88, approach: 0.82 });
  } else if (role === "assassin") {
    await dashTo(sourceEl, targetEl, { ms: 220, approach: 0.78 });
  } else if (role === "fighter" && (backline || longLeap)) {
    await jumpArc(sourceEl, targetEl, { ms: 460, arc: 64, approach: 0.8 });
  } else {
    await dashTo(sourceEl, targetEl, {
      ms: role === "tank" ? 300 : 240,
      approach: role === "tank" ? 0.62 : 0.72,
    });
  }
  if (token !== fxToken) return;

  const sameTarget = hits.filter((h) => h.targetId === primary.targetId);
  const others = hits.filter((h) => h.targetId !== primary.targetId);

  if (dual && sameTarget.length >= 2) {
    playHitImpact(sameTarget[0]);
    await wait(110, token);
    if (token !== fxToken) return;
    playHitImpact(sameTarget[1]);
    sameTarget.slice(2).forEach((h) => playHitImpact(h));
  } else {
    sameTarget.forEach((h, i) => {
      setTimeout(() => {
        if (token !== fxToken) return;
        playHitImpact(h);
      }, fxMs(i * 90));
    });
  }
  others.forEach((h, i) => {
    setTimeout(() => {
      if (token !== fxToken) return;
      playHitImpact(h);
    }, fxMs(80 + i * 60));
  });

  await wait(dual ? 220 : 160, token);
  if (token !== fxToken) return;

  if (role === "assassin" && backline) {
    spawnFx(viewportFor(sourceEl), "mf-fx-jump-smoke", "", 480);
    const root = motionRoot(sourceEl);
    if (root) root.style.opacity = "0.35";
    await wait(80, token);
  }
  await returnHome(sourceEl);
}

async function playRangedAttack(diff, sourceEl, hits, role) {
  const element = unitElementFromDiff(diff, hits[0]?.sourceId);
  const primary = hits.find((h) => !h.aoeSecondary) || hits[0];
  const targets = [...new Map(hits.map((h) => [h.targetId, h])).values()];
  const aoe = hits.some((h) => h.aoeSecondary) || targets.length > 1;

  await windup(sourceEl, role);
  bumpClass(spriteRoot(sourceEl), "mf-fx-cast", 400);

  if (role === "mage" && aoe) {
    spawnFx(viewportFor(sourceEl), `mf-fx-aoe-cast ${elementClass(element)}`, "", 520);
    await wait(200, fxToken);
    const ringTargets = targets.map((h) => findBattleUnitEl(h.targetId)).filter(Boolean);
    await wave(sourceEl, ringTargets, "aoe", { element, ms: 420 });
    hits.forEach((h, i) => {
      setTimeout(() => {
        const view = viewportFor(findBattleUnitEl(h.targetId));
        spawnFx(view, `mf-fx-aoe-blast ${elementClass(element)}${h.aoeSecondary ? " is-secondary" : ""}`, "", 480);
        playHitImpact(h);
      }, fxMs(i * 55));
    });
    await wait(280 + targets.length * 40, fxToken);
    return;
  }

  if (role === "ranger" && primary) {
    const markEl = findBattleUnitEl(primary.targetId);
    if (markEl && (BACKLINE_ROLES.has(unitRoleFromDiff(diff, primary.targetId)) || isBacklineTarget(diff, primary.sourceId, primary.targetId))) {
      spawnFx(viewportFor(markEl), "mf-fx-aim-mark", "", 500);
      await wait(120, fxToken);
    }
  }

  const style = role === "mage" ? "bolt" : "arrow";
  const flight = [];
  for (let i = 0; i < targets.length; i++) {
    const h = targets[i];
    const tEl = findBattleUnitEl(h.targetId);
    if (!tEl) {
      playHitImpact(h);
      continue;
    }
    flight.push(
      (async () => {
        await wait(i * 45, fxToken);
        await projectile(sourceEl, tEl, style, { element, ms: 300 });
        const related = hits.filter((x) => x.targetId === h.targetId);
        related.forEach((ev, j) => {
          setTimeout(() => playHitImpact(ev), fxMs(j * 90));
        });
      })()
    );
  }
  await Promise.all(flight);
  await wait(120, fxToken);
}

async function playSupportAttack(diff, sourceEl, hits) {
  const primary = hits[0];
  const targetEl = findBattleUnitEl(primary?.targetId);
  await windup(sourceEl, "support");
  if (targetEl) {
    await wave(sourceEl, [targetEl], "smite", {
      element: unitElementFromDiff(diff, primary.sourceId),
      ms: 280,
    });
  }
  hits.forEach((h) => playHitImpact(h));
  await wait(140, fxToken);
}

async function playHealClip(diff, sourceEl, heals, role) {
  const targetEls = heals.map((h) => findBattleUnitEl(h.targetId)).filter(Boolean);
  const element = unitElementFromDiff(diff, heals[0]?.sourceId) || "water";
  SoundFX.playSupport();
  await windup(sourceEl, role || "support");
  bumpClass(spriteRoot(sourceEl), "mf-fx-cast", 480);
  const style = heals.length > 1 ? "aoe_heal" : "heal";
  await wave(sourceEl, targetEls, style, { element, ms: 400 });
  heals.forEach((h, i) => {
    setTimeout(() => playHealOnTarget(h), fxMs(i * 50));
  });
  await wait(220, fxToken);
}

async function playActionBundle(diff, events, token) {
  if (token !== fxToken) return;

  const dots = events.filter((e) => e.kind === "hit" && !e.sourceId);
  const sourcedHits = events.filter((e) => e.kind === "hit" && e.sourceId);
  const heals = events.filter((e) => e.kind === "heal");
  const statuses = events.filter((e) => e.kind === "status");
  const dodges = events.filter((e) => e.kind === "dodge");

  dots.forEach((ev) => playDotTick(ev));
  dodges.forEach((ev) => playDodge(ev));

  const sourceId =
    sourcedHits[0]?.sourceId ||
    heals[0]?.sourceId ||
    statuses.find((s) => s.sourceId)?.sourceId ||
    "";
  const sourceEl = sourceId ? findBattleUnitEl(sourceId) : null;
  const role = String(unitRoleFromDiff(diff, sourceId) || sourceEl?.dataset?.role || "").toLowerCase();

  // Statuses that are pure defense on the target (no caster travel).
  const reactiveStatus = statuses.filter(
    (s) => s.statusOp === "block" || (!s.sourceId && s.statusOp !== "apply")
  );
  const activeStatus = statuses.filter((s) => !reactiveStatus.includes(s));
  reactiveStatus.forEach((ev) => playStatusApply(ev, sourceEl, role));

  if (!sourceEl) {
    activeStatus.forEach((ev) => playStatusApply(ev, null, role));
    heals.forEach((h) => playHealOnTarget(h));
    return;
  }

  try {
    if (sourcedHits.length) {
      SoundFX.playRole(role);
      if (role === "ranger" || role === "mage") {
        await playRangedAttack(diff, sourceEl, sourcedHits, role);
      } else if (role === "support") {
        await playSupportAttack(diff, sourceEl, sourcedHits);
      } else {
        await playMeleeAttack(diff, sourceEl, sourcedHits, role || "fighter", token);
      }
    }

    if (token !== fxToken) return;

    if (heals.length) {
      await playHealClip(diff, sourceEl, heals, role || "support");
    }

    if (token !== fxToken) return;

    // Buff / shield / taunt / cleanse after (or instead of) damage.
    const needsWave = activeStatus.some((s) =>
      ["atk_up", "shield", "cleanser", "taunt"].includes(String(s.status || "").toLowerCase()) ||
      s.statusOp === "shield" ||
      s.statusOp === "clear"
    );
    if (needsWave && !sourcedHits.length && !heals.length) {
      await windup(sourceEl, role);
      if (role === "tank" || role === "support") SoundFX.playRole(role || "tank");
    }
    for (const ev of activeStatus) {
      if (token !== fxToken) return;
      playStatusApply(ev, sourceEl, role);
      await wait(60, token);
    }
  } finally {
    if (token === fxToken) await returnHome(sourceEl);
  }
}

/** Split accumulated bot/player events into per-source clips (AdvancePvEBots). */
function groupEventsBySource(events) {
  const groups = [];
  let cur = null;
  let curKey = null;
  let activeSource = null;
  for (const ev of events) {
    let key;
    if (ev.sourceId) {
      activeSource = ev.sourceId;
      key = activeSource;
    } else if (ev.kind === "hit") {
      // DoT ticks (poison/bleed) — no attacker travel.
      key = `__dot:${ev.targetId}`;
      activeSource = null;
    } else if (ev.kind === "dodge" || (ev.kind === "status" && ev.statusOp === "block")) {
      key = `__react:${ev.kind}:${ev.targetId}`;
    } else if (activeSource) {
      // EffectOps after a card (status apply / heal without source) stay with caster.
      key = activeSource;
    } else {
      key = `__orphan:${ev.kind}:${ev.targetId}:${ev.status || ""}`;
    }
    if (key !== curKey) {
      cur = [];
      groups.push(cur);
      curKey = key;
    }
    cur.push(ev);
  }
  return groups;
}

/**
 * Play presentation for server CombatEvent[] (hit | heal | dodge | status).
 * Groups by sourceId into readable role clips (practice / PvE / PvP / raid).
 */
export function playCombatEvents(diff) {
  const events = diff?.events;
  if (!Array.isArray(events) || !events.length) return;
  initAudioContext();
  const token = ++fxToken;
  activeFxNodes = 0;
  const groups = groupEventsBySource(events);

  setTimeout(async () => {
    if (token !== fxToken) return;
    for (const group of groups) {
      if (token !== fxToken) return;
      await playActionBundle(diff, group, token);
      await wait(70, token);
    }
  }, fxMs(16));
}

/** Resume audio after first user gesture. */
export function bindBattleFxGestureUnlock() {
  const once = () => initAudioContext();
  document.addEventListener("pointerdown", once, { once: true });
  document.addEventListener("keydown", once, { once: true });
}
