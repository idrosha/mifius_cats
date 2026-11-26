/**
 * Live-fight presentation FX (D-037 cutouts + universal 2D DOM rig + role action clips).
 * Numbers come from server CombatEvent — client does not invent damage.
 * Idle breathe/aura stay on the sprite (or skeletal rig); action motion runs on the unit slot,
 * then returnHome restores slot transform. skipCombatFx clears everything.
 */

import { buildHeroRig, loadHeroRigManifest, resolveHeroRigSlug } from "./hero-rig.js";
import {
  configureAnimEngine,
  playClip,
  resetRigToRest,
  startIdle,
  stopAllRigAnimations,
} from "./hero-anim-engine.js";
import { HERO_CLIPS, resolveRoleClipName } from "./hero-anim-clips.js";

let audioCtx = null;
let soundEnabled = true;
/** 1 = normal, 1.5 = faster, 2 = snappy. */
let fxSpeed = 1;
let fxToken = 0;
let activeFxNodes = 0;
const FX_CONCURRENT_MAX = 12;
const MOTION_CLASS = "mf-fx-motion";
const HOME_GUARD = new WeakMap();
const MOTION_OWNER = new WeakMap();
const RETURNING = new WeakSet();
const BUMP_GEN = new WeakMap();
const UNIT_RIGS = new WeakMap();
const RIG_MOUNT_GEN = new WeakMap();
const TRANSIENT_MOTION_CLASSES = [
  MOTION_CLASS,
  "mf-fx-dash",
  "mf-fx-jump",
  "mf-fx-windup",
  "mf-fx-cast",
  "mf-fx-brace",
  "mf-fx-windup-pose",
  "mf-fx-strike-slam",
  "mf-fx-dodge",
  "mf-fx-look-at",
  "mf-fx-hit-react",
];
const TRANSIENT_SPRITE_CLASSES = [
  "mf-fx-windup-pose",
  "mf-fx-brace",
  "mf-fx-cast",
  "mf-fx-strike-slam",
  "mf-fx-dodge",
  "mf-fx-look-at",
  "mf-fx-dot-tick",
  "mf-fx-heal-pulse",
  "mf-fx-buff-pulse",
  "mf-fx-taunt-roar",
  "mf-fx-stealth-enter",
  "mf-fx-stun",
  "hero-damage-hit",
  "hero-block-brace",
  "combat-action-shake",
  "is-crit",
  "is-secondary",
];

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

configureAnimEngine({
  fxMs,
  getFxToken: () => fxToken,
  clips: HERO_CLIPS,
});

function getUnitRig(el) {
  const root = motionRoot(el);
  if (!root) return null;
  const rig = UNIT_RIGS.get(root);
  if (rig && rig.mode === "rig" && rig.root?.isConnected) return rig;
  return null;
}

function playUnitRigAction(el, role, action, opts = {}) {
  const rig = getUnitRig(el);
  if (!rig) return null;
  const clipName = HERO_CLIPS[action] ? action : resolveRoleClipName(role || rig.role, action);
  return playClip(rig, clipName, {
    token: opts.token ?? fxToken,
    ...opts,
  });
}

/**
 * Attempt to upgrade a battle unit card from flat cutout to a skeletal DOM rig.
 * If no `rig.json` exists for this hero, leaves the flat cutout untouched (zero breakage).
 */
export async function mountHeroRigOnUnit(card, unit, opts = {}) {
  if (!card || !unit) return null;
  const root = motionRoot(card);
  const gen = (RIG_MOUNT_GEN.get(root) || 0) + 1;
  RIG_MOUNT_GEN.set(root, gen);

  const slug = opts.rigSlug || resolveHeroRigSlug(unit);
  const manifest = opts.manifest || (slug ? await loadHeroRigManifest(slug) : null);
  if (!manifest || !root.isConnected || RIG_MOUNT_GEN.get(root) !== gen) return null;

  const face =
    root.querySelector?.(".mf-sprite-face") ||
    root.querySelector?.(".mf-unit-frame") ||
    root;
  const existingImg = face.querySelector?.("img.mf-battle-cutout, img") || null;
  const fallbackSrc = opts.fallbackSrc || existingImg?.getAttribute("src") || "";
  const desiredFace =
    opts.facing ||
    face.dataset?.face ||
    (unit.side === 0 ? "right" : unit.side === 1 ? "left" : "right");

  const prevRig = UNIT_RIGS.get(root);
  if (prevRig) resetRigToRest(prevRig);

  const rig = buildHeroRig(face, manifest, fallbackSrc, {
    facing: desiredFace,
    role: unit.role,
    alive: unit.alive,
  });
  if (rig.mode !== "rig") return null;

  UNIT_RIGS.set(root, rig);
  if (unit.alive === false) {
    playClip(rig, "death", { hold: true, ignoreToken: true, durationScale: 0.1 });
  } else {
    startIdle(rig, "idle");
  }
  return rig;
}

/** Public helper to trigger any named clip or role action on a battle unit (e.g. victory/defeat/QA). */
export function playHeroRigClip(unitIdOrEl, actionOrClipName, opts = {}) {
  const el = typeof unitIdOrEl === "string" ? findBattleUnitEl(unitIdOrEl) : unitIdOrEl;
  if (!el) return Promise.resolve(false);
  const role = opts.role || el.dataset?.role || "";
  const p = playUnitRigAction(el, role, actionOrClipName, opts);
  return p || Promise.resolve(false);
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
  { cls: "idle-breathe-1", name: "heroBreathe1", duration: "3.2s", delay: "0s" },
  { cls: "idle-breathe-2", name: "heroBreathe2", duration: "3.0s", delay: "-0.8s" },
  { cls: "idle-breathe-3", name: "heroBreathe3", duration: "3.4s", delay: "-1.5s" },
  { cls: "idle-breathe-4", name: "heroBreathe4", duration: "3.1s", delay: "-0.4s" },
  { cls: "idle-breathe-5", name: "heroBreathe5", duration: "2.9s", delay: "-1.1s" },
  { cls: "idle-breathe-6", name: "heroBreathe6", duration: "3.3s", delay: "-0.2s" },
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
    el.querySelector?.(".raid-foe-frame") ||
    el.closest?.(".raid-foe-frame") ||
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
  let genMap = BUMP_GEN.get(el);
  if (!genMap) {
    genMap = new Map();
    BUMP_GEN.set(el, genMap);
  }
  const gens = parts.map((p) => {
    const next = (genMap.get(p) || 0) + 1;
    genMap.set(p, next);
    return [p, next];
  });
  el.classList.remove(...parts);
  void el.offsetWidth;
  el.classList.add(...parts);
  setTimeout(() => {
    for (const [p, g] of gens) {
      if (genMap.get(p) === g) {
        el.classList.remove(p);
      }
    }
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

/** Base slot center, removing any active fxDx/fxDy displacement on the element. */
function baseCenter(el) {
  const c = elCenter(el);
  const ox = Number(el?.dataset?.fxDx || 0);
  const oy = Number(el?.dataset?.fxDy || 0);
  return { x: c.x - ox, y: c.y - oy, w: c.w, h: c.h };
}

function centerDelta(fromEl, toEl, approach = 0.72) {
  const a = baseCenter(fromEl);
  const b = baseCenter(toEl);
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

function clearHomeGuard(root) {
  if (!root) return;
  const tid = HOME_GUARD.get(root);
  if (tid) {
    clearTimeout(tid);
    HOME_GUARD.delete(root);
  }
}

function hasMotionState(el) {
  if (!el) return false;
  return (
    el.classList.contains(MOTION_CLASS) ||
    el.classList.contains("mf-fx-dash") ||
    el.classList.contains("mf-fx-jump") ||
    el.classList.contains("mf-fx-windup") ||
    el.classList.contains("mf-fx-cast") ||
    Boolean(el.style.transform) ||
    Boolean(el.style.animation) ||
    Boolean(el.style.zIndex) ||
    Boolean(el.style.getPropertyValue("--fx-dx")) ||
    Boolean(el.style.getPropertyValue("--fx-dy")) ||
    Boolean(el.dataset?.fxDx) ||
    Boolean(el.dataset?.fxDy)
  );
}

function resetMotionRoot(el) {
  if (!el) return;
  clearHomeGuard(el);
  MOTION_OWNER.delete(el);
  RETURNING.delete(el);
  el.classList.remove(...TRANSIENT_MOTION_CLASSES);
  el.style.transition = "";
  el.style.transform = "";
  el.style.animation = "";
  el.style.opacity = "";
  el.style.zIndex = "";
  el.style.removeProperty("--fx-dx");
  el.style.removeProperty("--fx-dy");
  el.style.removeProperty("--fx-arc");
  el.style.removeProperty("--fx-dir");
  delete el.dataset.fxDx;
  delete el.dataset.fxDy;
  const rig = getUnitRig(el);
  if (rig && !el.classList.contains("mf-unit-dead")) {
    resetRigToRest(rig);
    startIdle(rig, "idle");
  }
}

function resetAllMotionRoots() {
  document.querySelectorAll(`.${MOTION_CLASS}, [data-unit-id]`).forEach((el) => {
    if (!isBattleUnitSlot(el)) return;
    if (hasMotionState(el)) resetMotionRoot(el);
  });
}

function guardHome(root, token = fxToken) {
  if (!root) return;
  clearHomeGuard(root);
  const tid = setTimeout(() => {
    HOME_GUARD.delete(root);
    if (MOTION_OWNER.get(root) !== token) return;
    if (!hasMotionState(root)) {
      MOTION_OWNER.delete(root);
      RETURNING.delete(root);
      return;
    }
    if (token !== fxToken) {
      resetMotionRoot(root);
      return;
    }
    returnHome(root, token);
  }, fxMs(2200));
  HOME_GUARD.set(root, tid);
}

/** Melee step / lunge toward target slot. */
export function dashTo(source, target, opts = {}) {
  const root = motionRoot(source);
  const dest = motionRoot(target) || target;
  const token = opts.token ?? fxToken;
  if (!root || !dest || !root.isConnected || !dest.isConnected) return Promise.resolve(false);
  if (token !== fxToken) return Promise.resolve(false);
  if (hasMotionState(root)) {
    resetMotionRoot(root);
    void root.offsetWidth;
  }
  const approach = opts.approach ?? 0.74;
  const ms = opts.ms ?? 260;
  const { dx, dy } = centerDelta(root, dest, approach);
  const dir = dx >= 0 ? 1 : -1;
  MOTION_OWNER.set(root, token);
  RETURNING.delete(root);
  root.classList.add(MOTION_CLASS, "mf-fx-dash");
  root.style.setProperty("--fx-dx", `${dx}px`);
  root.style.setProperty("--fx-dy", `${dy}px`);
  root.style.setProperty("--fx-dir", String(dir));
  root.dataset.fxDx = String(dx);
  root.dataset.fxDy = String(dy);
  root.style.animation = "";
  root.style.transition = `transform ${fxMs(ms)}ms cubic-bezier(0.2, 0.85, 0.25, 1)`;
  root.style.transform = `translate(${dx}px, ${dy}px)`;
  root.style.zIndex = "45";
  guardHome(root, token);
  return wait(ms, token).then((ok) => {
    if (!ok) {
      if (MOTION_OWNER.get(root) === token) resetMotionRoot(root);
      return false;
    }
    return MOTION_OWNER.get(root) === token && root.isConnected;
  });
}

/** Melee parabolic leap onto the target with takeoff dust + clean landing hold. */
export function jumpArc(source, target, opts = {}) {
  const root = motionRoot(source);
  const dest = motionRoot(target) || target;
  const token = opts.token ?? fxToken;
  if (!root || !dest || !root.isConnected || !dest.isConnected) return Promise.resolve(false);
  if (token !== fxToken) return Promise.resolve(false);
  if (hasMotionState(root)) {
    resetMotionRoot(root);
    void root.offsetWidth;
  }
  const approach = opts.approach ?? 0.8;
  const ms = opts.ms ?? 380;
  const arc = opts.arc ?? 82;
  const { dx, dy } = centerDelta(root, dest, approach);
  const dir = dx >= 0 ? 1 : -1;
  MOTION_OWNER.set(root, token);
  RETURNING.delete(root);
  root.classList.add(MOTION_CLASS, "mf-fx-jump");
  root.style.setProperty("--fx-dx", `${dx}px`);
  root.style.setProperty("--fx-dy", `${dy}px`);
  root.style.setProperty("--fx-arc", `${arc}px`);
  root.style.setProperty("--fx-dir", String(dir));
  root.dataset.fxDx = String(dx);
  root.dataset.fxDy = String(dy);
  root.style.transition = "none";
  root.style.animation = "none";
  void root.offsetWidth;
  root.style.animation = `mfJumpArc ${fxMs(ms)}ms cubic-bezier(0.28, 0.08, 0.25, 1) forwards`;
  root.style.zIndex = "50";
  guardHome(root, token);
  spawnFx(viewportFor(root), "mf-fx-jump-smoke", "", 480);
  return wait(ms, token).then((ok) => {
    if (!ok) {
      if (MOTION_OWNER.get(root) === token) resetMotionRoot(root);
      return false;
    }
    if (MOTION_OWNER.get(root) !== token || !root.isConnected) return false;
    // Lock final translate before clearing keyframe animation so returnHome never teleports.
    root.style.transform = `translate(${dx}px, ${dy}px)`;
    root.style.animation = "";
    return true;
  });
}

/** Ranged / spell projectile from source center to target center. */
export function projectile(source, target, style = "arrow", opts = {}) {
  const aEl = motionRoot(source) || source;
  const bEl = motionRoot(target) || target;
  const token = opts.token ?? fxToken;
  if (!aEl || !bEl || !aEl.isConnected || !bEl.isConnected) return Promise.resolve(false);
  if (token !== fxToken) return Promise.resolve(false);
  if (activeFxNodes >= FX_CONCURRENT_MAX) return Promise.resolve(false);
  const a = baseCenter(aEl);
  const b = baseCenter(bEl);
  if (!a.w && !a.h) return Promise.resolve(false);
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
  return wait(ms, token);
}

/** Support / buff / cleanse wave traveling source → each target. */
export function wave(source, targets, style = "heal", opts = {}) {
  const aEl = motionRoot(source) || source;
  const token = opts.token ?? fxToken;
  if (!aEl || !aEl.isConnected || token !== fxToken) return Promise.resolve(false);
  const list = (Array.isArray(targets) ? targets : [targets]).filter((t) => t && t.isConnected);
  if (!list.length) return Promise.resolve(false);
  const ms = opts.ms ?? 380;
  const a = baseCenter(aEl);
  if (!a.w && !a.h) return Promise.resolve(false);
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
    if (!bEl || !bEl.isConnected || activeFxNodes >= FX_CONCURRENT_MAX) return;
    const b = baseCenter(bEl);
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
  return wait(ms + Math.min(list.length, 3) * 40, token);
}

/** Hop smoothly back to formation slot (never teleports after jumpArc). */
export function returnHome(source, token = fxToken) {
  const root = motionRoot(source);
  if (!root) return Promise.resolve(false);
  if (!hasMotionState(root)) {
    if (MOTION_OWNER.get(root) === token) {
      MOTION_OWNER.delete(root);
      RETURNING.delete(root);
    }
    return Promise.resolve(true);
  }
  if (RETURNING.has(root) && MOTION_OWNER.get(root) === token) {
    return Promise.resolve(true);
  }
  const dx = Number(root.dataset.fxDx || 0);
  const dy = Number(root.dataset.fxDy || 0);
  const hadOffset = Math.hypot(dx, dy) > 4;
  if (token !== fxToken || !root.isConnected) {
    if (!MOTION_OWNER.has(root) || MOTION_OWNER.get(root) === token) {
      resetMotionRoot(root);
    }
    return Promise.resolve(false);
  }
  if (!hadOffset) {
    resetMotionRoot(root);
    return Promise.resolve(true);
  }
  MOTION_OWNER.set(root, token);
  RETURNING.add(root);
  root.classList.remove("mf-fx-dash", "mf-fx-jump", "mf-fx-windup", "mf-fx-cast");
  root.style.opacity = "";
  const ms = 270;
  root.style.setProperty("--fx-dx", `${dx}px`);
  root.style.setProperty("--fx-dy", `${dy}px`);
  root.style.setProperty("--fx-arc", "42px");
  root.style.transition = "none";
  root.style.animation = "none";
  root.style.transform = `translate(${dx}px, ${dy}px)`;
  void root.offsetWidth;
  root.style.animation = `mfJumpBack ${fxMs(ms)}ms cubic-bezier(0.22, 0.85, 0.36, 1) forwards`;
  return wait(ms + 10, token).then((ok) => {
    if (MOTION_OWNER.get(root) === token) {
      resetMotionRoot(root);
    }
    return ok;
  });
}

function windup(sourceEl, role, token = fxToken) {
  const root = motionRoot(sourceEl);
  const sprite = spriteRoot(sourceEl);
  if (!root || !root.isConnected || token !== fxToken) return Promise.resolve(false);
  MOTION_OWNER.set(root, token);
  RETURNING.delete(root);
  root.classList.add(MOTION_CLASS, "mf-fx-windup");
  if (getUnitRig(sourceEl)) {
    return playUnitRigAction(sourceEl, role, "windup", { token });
  }
  const pose =
    role === "mage" || role === "support"
      ? "mf-fx-cast"
      : role === "tank"
        ? "mf-fx-brace"
        : "mf-fx-windup-pose";
  // Pose lives ONLY on spriteRoot so it never overrides motionRoot's jump/dash transform!
  bumpClass(sprite, pose, 200);
  return wait(130, token);
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
  // Non-blocking upgrade to skeletal DOM rig if `rig.json` exists for this hero.
  mountHeroRigOnUnit(card, unit);
}

function isBattleUnitSlot(el) {
  if (!el || !el.isConnected) return false;
  if (el.matches?.("button, .mf-atk-card, .mf-hand-slot")) return false;
  if (el.closest?.(".mf-attack-hand, .pv-hand, #pfHand, #pvHand, #rbHand, #hand")) return false;
  return true;
}

function isVisibleUnitEl(el) {
  if (!isBattleUnitSlot(el) || el.hidden) return false;
  if (el.closest(".hidden, [hidden]")) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function findBattleUnitEl(unitId) {
  if (!unitId) return null;
  const esc = CSS.escape(unitId);
  const selectors = [
    `#viewPracticeFight:not(.hidden) [data-unit-id="${esc}"]`,
    `#viewPvpFight:not(.hidden) [data-unit-id="${esc}"]`,
    `#viewRaidBattle:not(.hidden) [data-unit-id="${esc}"]`,
    `#viewBattle:not(.hidden) [data-unit-id="${esc}"]`,
    `#enemyBoard [data-unit-id="${esc}"]`,
    `#allyBoard [data-unit-id="${esc}"]`,
    `[data-unit-id="${esc}"]`,
  ];
  for (const sel of selectors) {
    const matches = document.querySelectorAll(sel);
    for (const el of matches) {
      if (isVisibleUnitEl(el)) return el;
    }
  }
  return null;
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
      ".mf-fx-float, .slash-impact-fx, .shield-barrier-fx, .mf-fx-projectile, .mf-fx-wave, .mf-fx-wave-ring, .mf-fx-jump-smoke, .mf-fx-slam-dust, .mf-fx-impact, .mf-fx-crit-flash, .mf-fx-pierce, .mf-fx-status-mark, .mf-fx-taunt-mark, .mf-fx-heal-pulse, .mf-fx-heal-burst, .mf-fx-cleanse-sparks, .mf-fx-aim-mark, .mf-fx-aoe-cast, .mf-fx-potion, .mf-fx-aoe-blast, .mf-fx-death-shadow"
    )
    .forEach((n) => n.remove());
  resetAllMotionRoots();
  document
    .querySelectorAll("[data-unit-id] img, [data-unit-id] .mf-battle-cutout, [data-unit-id] .mf-hero-sprite")
    .forEach((sprite) => sprite.classList.remove(...TRANSIENT_SPRITE_CLASSES));
  stopAllRigAnimations({ resumeIdle: true });
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
  if (targetEl && getUnitRig(targetEl)) {
    playUnitRigAction(targetEl, targetEl.dataset?.role, ev.kill ? "death" : "hit", {
      token: fxToken,
      hold: !!ev.kill,
    });
  } else {
    bumpClass(targetSprite, hitCls, crit ? 640 : 560);
    if (targetEl) bumpClass(targetEl, "mf-fx-hit-react", 560);
  }

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
  floatText(targetView, "УВОРОТ", "block");
}

function playBlock(ev) {
  const targetEl = findBattleUnitEl(ev.targetId);
  const targetSprite = spriteRoot(targetEl);
  const targetView = viewportFor(targetEl);
  SoundFX.playBlock();
  if (targetEl && getUnitRig(targetEl)) {
    playUnitRigAction(targetEl, targetEl.dataset?.role || "tank", "block", { token: fxToken });
  } else {
    bumpClass(targetSprite, "hero-block-brace", 620);
  }
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
    if (targetEl && getUnitRig(targetEl)) {
      playUnitRigAction(targetEl, targetEl.dataset?.role || "tank", "taunt", { token: fxToken });
    } else {
      bumpClass(targetSprite, "mf-fx-taunt-roar", 700);
    }
    spawnFx(targetView, "mf-fx-taunt-mark", "!", 900);
    floatText(targetView, "АГРА", "status");
    // Glance: briefly nudge living enemies toward the tank (on spriteRoot, never overriding slot transform).
    document.querySelectorAll("[data-unit-id]").forEach((el) => {
      if (el === targetEl) return;
      if (!isVisibleUnitEl(el) || el.classList.contains("mf-unit-dead")) return;
      bumpClass(spriteRoot(el), "mf-fx-look-at", 500);
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

function resolveLiveUnitEl(currentEl, unitId) {
  if (currentEl && currentEl.isConnected && isVisibleUnitEl(currentEl)) return currentEl;
  return unitId ? findBattleUnitEl(unitId) : null;
}

async function playMeleeAttack(diff, sourceId, sourceEl, hits, role, token) {
  const primary = hits.find((h) => !h.aoeSecondary) || hits[0];
  if (!primary) return;
  let src = resolveLiveUnitEl(sourceEl, sourceId);
  let targetEl = findBattleUnitEl(primary.targetId);
  if (!src || !targetEl) {
    hits.forEach((h) => playHitImpact(h));
    return;
  }
  const backline = isBacklineTarget(diff, primary.sourceId, primary.targetId);
  const span = (() => {
    try {
      const a = baseCenter(src);
      const b = baseCenter(targetEl);
      return Math.hypot(b.x - a.x, b.y - a.y);
    } catch {
      return 0;
    }
  })();
  const longLeap = span > 130;
  const dual =
    hits.filter((h) => h.targetId === primary.targetId && h.sourceId).length >= 2 &&
    (role === "fighter" || role === "assassin");

  await windup(src, role, token);
  if (token !== fxToken) return;

  src = resolveLiveUnitEl(src, sourceId);
  targetEl = resolveLiveUnitEl(targetEl, primary.targetId);
  if (!src || !targetEl) {
    hits.forEach((h) => playHitImpact(h));
    return;
  }

  // Every melee hero leaps onto the enemy with role-specific arc height & speed.
  let jumped = false;
  if (role === "assassin") {
    if (getUnitRig(src)) playUnitRigAction(src, "assassin", "leap", { token });
    jumped = await jumpArc(src, targetEl, {
      ms: 350,
      arc: backline || longLeap ? 110 : 88,
      approach: 0.84,
      token,
    });
  } else if (role === "fighter") {
    if (getUnitRig(src) && (backline || longLeap)) {
      playUnitRigAction(src, "fighter", "leap", { token });
    }
    jumped = await jumpArc(src, targetEl, {
      ms: 370,
      arc: backline || longLeap ? 92 : 76,
      approach: 0.8,
      token,
    });
  } else if (role === "tank") {
    jumped = await jumpArc(src, targetEl, {
      ms: 400,
      arc: 62,
      approach: 0.72,
      token,
    });
  } else {
    jumped = await jumpArc(src, targetEl, {
      ms: 370,
      arc: 74,
      approach: 0.76,
      token,
    });
  }
  if (!jumped || token !== fxToken) return;

  src = resolveLiveUnitEl(src, sourceId);
  targetEl = resolveLiveUnitEl(targetEl, primary.targetId);
  // Attacker strike slam + landing dust on impact.
  if (src) {
    if (getUnitRig(src)) {
      playUnitRigAction(src, role, "strike", { token });
    } else {
      bumpClass(spriteRoot(src), "mf-fx-strike-slam", 240);
    }
  }
  if (role === "tank" && targetEl) {
    spawnFx(viewportFor(targetEl), "mf-fx-slam-dust", "", 460);
  }

  const sameTarget = hits.filter((h) => h.targetId === primary.targetId);
  const others = hits.filter((h) => h.targetId !== primary.targetId);

  if (dual && sameTarget.length >= 2) {
    playHitImpact(sameTarget[0]);
    await wait(120, token);
    if (token !== fxToken) return;
    src = resolveLiveUnitEl(src, sourceId);
    if (src) bumpClass(spriteRoot(src), "mf-fx-strike-slam", 220);
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

  src = resolveLiveUnitEl(src, sourceId);
  if (role === "assassin" && backline && src) {
    if (getUnitRig(src)) playUnitRigAction(src, "assassin", "retreat", { token });
    spawnFx(viewportFor(src), "mf-fx-jump-smoke", "", 480);
    const root = motionRoot(src);
    if (root) root.style.opacity = "0.35";
    await wait(80, token);
    if (token !== fxToken) return;
  }
  await returnHome(resolveLiveUnitEl(src, sourceId) || src, token);
}

async function playRangedAttack(diff, sourceId, sourceEl, hits, role, token) {
  const element = unitElementFromDiff(diff, hits[0]?.sourceId);
  const primary = hits.find((h) => !h.aoeSecondary) || hits[0];
  const targets = [...new Map(hits.map((h) => [h.targetId, h])).values()];
  const aoe = hits.some((h) => h.aoeSecondary) || targets.length > 1;

  let src = resolveLiveUnitEl(sourceEl, sourceId);
  if (!src) {
    hits.forEach((h) => playHitImpact(h));
    return;
  }
  await windup(src, role, token);
  if (token !== fxToken) return;
  src = resolveLiveUnitEl(src, sourceId);
  if (!src) return;
  const hasRig = !!getUnitRig(src);
  if (!hasRig) bumpClass(spriteRoot(src), "mf-fx-cast", 400);

  if (role === "mage" && aoe) {
    if (hasRig) playUnitRigAction(src, "mage", "cast_aoe", { token });
    spawnFx(viewportFor(src), `mf-fx-aoe-cast ${elementClass(element)}`, "", 520);
    await wait(200, token);
    if (token !== fxToken) return;
    src = resolveLiveUnitEl(src, sourceId);
    const ringTargets = targets.map((h) => findBattleUnitEl(h.targetId)).filter(Boolean);
    if (src && ringTargets.length) {
      await wave(src, ringTargets, "aoe", { element, ms: 420, token });
    }
    if (token !== fxToken) return;
    hits.forEach((h, i) => {
      setTimeout(() => {
        if (token !== fxToken) return;
        const view = viewportFor(findBattleUnitEl(h.targetId));
        spawnFx(view, `mf-fx-aoe-blast ${elementClass(element)}${h.aoeSecondary ? " is-secondary" : ""}`, "", 480);
        playHitImpact(h);
      }, fxMs(i * 55));
    });
    await wait(280 + targets.length * 40, token);
    return;
  }

  if (role === "ranger" && primary) {
    if (hasRig) {
      await playUnitRigAction(src, "ranger", "aim", { token });
      if (token !== fxToken) return;
    }
    const markEl = findBattleUnitEl(primary.targetId);
    if (markEl && (BACKLINE_ROLES.has(unitRoleFromDiff(diff, primary.targetId)) || isBacklineTarget(diff, primary.sourceId, primary.targetId))) {
      spawnFx(viewportFor(markEl), "mf-fx-aim-mark", "", 500);
      await wait(120, token);
      if (token !== fxToken) return;
    }
  }

  if (hasRig) {
    playUnitRigAction(src, role, role === "ranger" ? "release" : "cast", { token });
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
        if (i > 0) {
          await wait(i * 45, token);
          if (token !== fxToken) return;
        }
        const liveSrc = resolveLiveUnitEl(src, sourceId);
        const liveTgt = resolveLiveUnitEl(tEl, h.targetId);
        if (!liveSrc || !liveTgt) {
          if (token === fxToken) {
            hits.filter((x) => x.targetId === h.targetId).forEach((ev) => playHitImpact(ev));
          }
          return;
        }
        const ok = await projectile(liveSrc, liveTgt, style, { element, ms: 300, token });
        if (!ok || token !== fxToken) return;
        const related = hits.filter((x) => x.targetId === h.targetId);
        related.forEach((ev, j) => {
          setTimeout(() => {
            if (token !== fxToken) return;
            playHitImpact(ev);
          }, fxMs(j * 90));
        });
      })()
    );
  }
  await Promise.all(flight);
  await wait(120, token);
}

async function playSupportAttack(diff, sourceId, sourceEl, hits, token) {
  const primary = hits[0];
  const src = resolveLiveUnitEl(sourceEl, sourceId);
  const targetEl = findBattleUnitEl(primary?.targetId);
  if (src) {
    await windup(src, "support", token);
    if (token !== fxToken) return;
  }
  const liveSrc = resolveLiveUnitEl(src, sourceId);
  const liveTgt = resolveLiveUnitEl(targetEl, primary?.targetId);
  if (liveSrc && getUnitRig(liveSrc)) {
    playUnitRigAction(liveSrc, "support", "buff", { token });
  }
  if (liveSrc && liveTgt) {
    await wave(liveSrc, [liveTgt], "smite", {
      element: unitElementFromDiff(diff, primary.sourceId),
      ms: 280,
      token,
    });
    if (token !== fxToken) return;
  }
  hits.forEach((h) => playHitImpact(h));
  await wait(140, token);
}

async function playHealClip(diff, sourceId, sourceEl, heals, role, token) {
  const element = unitElementFromDiff(diff, heals[0]?.sourceId) || "water";
  SoundFX.playSupport();
  let src = resolveLiveUnitEl(sourceEl, sourceId);
  if (src) {
    await windup(src, role || "support", token);
    if (token !== fxToken) return;
    src = resolveLiveUnitEl(src, sourceId);
    if (src) {
      if (getUnitRig(src)) {
        playUnitRigAction(src, role || "support", "heal", { token });
      } else {
        bumpClass(spriteRoot(src), "mf-fx-cast", 480);
      }
    }
  }
  const targetEls = heals.map((h) => findBattleUnitEl(h.targetId)).filter(Boolean);
  const style = heals.length > 1 ? "aoe_heal" : "heal";
  if (src && targetEls.length) {
    await wave(src, targetEls, style, { element, ms: 400, token });
    if (token !== fxToken) return;
  }
  heals.forEach((h, i) => {
    setTimeout(() => {
      if (token !== fxToken) return;
      playHealOnTarget(h);
    }, fxMs(i * 50));
  });
  await wait(220, token);
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
  let sourceEl = sourceId ? findBattleUnitEl(sourceId) : null;
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
    sourcedHits.forEach((h) => playHitImpact(h));
    return;
  }

  try {
    if (sourcedHits.length) {
      SoundFX.playRole(role);
      if (role === "ranger" || role === "mage") {
        await playRangedAttack(diff, sourceId, sourceEl, sourcedHits, role, token);
      } else if (role === "support") {
        await playSupportAttack(diff, sourceId, sourceEl, sourcedHits, token);
      } else {
        await playMeleeAttack(diff, sourceId, sourceEl, sourcedHits, role || "fighter", token);
      }
    }

    if (token !== fxToken) return;

    if (heals.length) {
      sourceEl = resolveLiveUnitEl(sourceEl, sourceId) || sourceEl;
      await playHealClip(diff, sourceId, sourceEl, heals, role || "support", token);
    }

    if (token !== fxToken) return;

    // Buff / shield / taunt / cleanse after (or instead of) damage.
    const needsWave = activeStatus.some((s) =>
      ["atk_up", "shield", "cleanser", "taunt"].includes(String(s.status || "").toLowerCase()) ||
      s.statusOp === "shield" ||
      s.statusOp === "clear"
    );
    sourceEl = resolveLiveUnitEl(sourceEl, sourceId) || sourceEl;
    if (needsWave && !sourcedHits.length && !heals.length && sourceEl) {
      await windup(sourceEl, role, token);
      if (token !== fxToken) return;
      if (role === "tank" || role === "support") SoundFX.playRole(role || "tank");
    }
    for (const ev of activeStatus) {
      if (token !== fxToken) return;
      sourceEl = resolveLiveUnitEl(sourceEl, sourceId) || sourceEl;
      playStatusApply(ev, sourceEl, role);
      await wait(60, token);
    }
  } finally {
    const liveSrc = resolveLiveUnitEl(sourceEl, sourceId) || sourceEl;
    const root = motionRoot(liveSrc);
    if (root) {
      if (token === fxToken) {
        await returnHome(root, token);
      } else if (MOTION_OWNER.get(root) === token) {
        resetMotionRoot(root);
      }
    }
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
  resetAllMotionRoots();
  const groups = groupEventsBySource(events);

  setTimeout(async () => {
    if (token !== fxToken) return;
    try {
      for (const group of groups) {
        if (token !== fxToken) return;
        await playActionBundle(diff, group, token);
        await wait(70, token);
      }
    } finally {
      if (token === fxToken) {
        resetAllMotionRoots();
      }
    }
  }, fxMs(16));
}

/** Resume audio after first user gesture. */
export function bindBattleFxGestureUnlock() {
  const once = () => initAudioContext();
  document.addEventListener("pointerdown", once, { once: true });
  document.addEventListener("keydown", once, { once: true });
}
