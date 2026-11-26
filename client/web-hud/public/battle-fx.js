/**
 * Live-fight presentation FX — 2D battler (Axie Infinity / AFK Arena) 5-phase combat cycle.
 * Numbers come strictly from server CombatEvent — client does not invent damage.
 *
 * Architecture:
 * - Anchor slot ([data-unit-id]) NEVER moves (fixed grid/flex coordinates).
 * - Inner motion container (.mf-motion-actor) moves ONLY via translate3d(dx, dy, 0) using WAAPI.
 * - Pose rig (.mf-pose-rig) + weapon layer (.mf-weapon-layer) live inside .mf-sprite-face so
 *   enemy scaleX(-1) mirrors the sprite & weapon cleanly without flipping HP bars or text.
 * - resetActor() cancels all script animations and guarantees (0, 0) before every action,
 *   in finally, and on skipCombatFx().
 */

let audioCtx = null;
let soundEnabled = true;
/** 1 = normal, 1.5 = faster, 2 = snappy. */
let fxSpeed = 1;
let fxToken = 0;
let activeFxNodes = 0;
const FX_CONCURRENT_MAX = 16;
const MOTION_CLASS = "mf-fx-motion";

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
  return Math.max(30, Math.round(ms / fxSpeed));
}

function wait(ms, token) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(token === fxToken), fxMs(ms));
  });
}

function animFinished(anim, token) {
  if (!anim) return Promise.resolve(token === fxToken);
  return anim.finished
    .then(() => token === fxToken)
    .catch(() => false);
}

/** Cancel only JS-driven Web Animations (preserve CSS idle animations on sprites/weapons). */
function cancelScriptAnimations(el) {
  if (!el || typeof el.getAnimations !== "function") return;
  for (const a of el.getAnimations()) {
    if (typeof CSSAnimation !== "undefined" && a instanceof CSSAnimation) continue;
    try {
      a.cancel();
    } catch {
      /* ignore */
    }
  }
}

/** Cancel ALL animations on an element (used on .mf-motion-actor which has no idle CSS anim). */
function cancelAllAnimations(el) {
  if (!el || typeof el.getAnimations !== "function") return;
  for (const a of el.getAnimations()) {
    try {
      a.cancel();
    } catch {
      /* ignore */
    }
  }
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
    osc.frequency.setValueAtTime(isCrit ? 190 : 145, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.32);
    gain.gain.setValueAtTime(isCrit ? 0.78 : 0.65, now);
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
      filter.frequency.setValueAtTime(isCrit ? 2400 : 1250, now);
      filter.frequency.exponentialRampToValueAtTime(160, now + 0.22);
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(isCrit ? 0.82 : 0.45, now);
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
  wind: "aura-wind",
  ice: "aura-ice",
  water: "aura-water",
};

const ELEMENT_FX = {
  stone: "mf-fx-el-stone",
  fire: "mf-fx-el-fire",
  bolt: "mf-fx-el-bolt",
  grass: "mf-fx-el-wind",
  wind: "mf-fx-el-wind",
  ice: "mf-fx-el-ice",
  water: "mf-fx-el-water",
};

const ELEMENT_PALETTE = {
  fire: { main: "#fb923c", glow: "#ef4444", core: "#fef08a" },
  water: { main: "#38bdf8", glow: "#0ea5e9", core: "#e0f2fe" },
  ice: { main: "#7dd3fc", glow: "#38bdf8", core: "#f0f9ff" },
  wind: { main: "#4ade80", glow: "#22c55e", core: "#dcfce7" },
  grass: { main: "#4ade80", glow: "#22c55e", core: "#dcfce7" },
  bolt: { main: "#c084fc", glow: "#a855f7", core: "#f3e8ff" },
  stone: { main: "#fbbf24", glow: "#d97706", core: "#fef3c7" },
};

/** Clean idle breathe timings (no skew/tilts — pure chest breathing with per-unit phase). */
const BREATHE_SPEC = [
  { cls: "idle-breathe-1", name: "heroBreathe1", duration: "2.4s", delay: "0s" },
  { cls: "idle-breathe-2", name: "heroBreathe2", duration: "2.25s", delay: "-0.65s" },
  { cls: "idle-breathe-3", name: "heroBreathe3", duration: "2.55s", delay: "-1.3s" },
  { cls: "idle-breathe-4", name: "heroBreathe4", duration: "2.3s", delay: "-0.35s" },
  { cls: "idle-breathe-5", name: "heroBreathe5", duration: "2.15s", delay: "-1.05s" },
  { cls: "idle-breathe-6", name: "heroBreathe6", duration: "2.45s", delay: "-1.75s" },
];

const AURA_SPEC = {
  stone: { cls: "aura-stone", name: "pulseGlowStone", duration: "4s" },
  fire: { cls: "aura-fire", name: "pulseGlowFire", duration: "3.6s" },
  bolt: { cls: "aura-lightning", name: "pulseGlowLightning", duration: "3.4s" },
  grass: { cls: "aura-wind", name: "pulseGlowWind", duration: "4.2s" },
  wind: { cls: "aura-wind", name: "pulseGlowWind", duration: "4.2s" },
  ice: { cls: "aura-ice", name: "pulseGlowIce", duration: "3.8s" },
  water: { cls: "aura-water", name: "pulseGlowWater", duration: "4.1s" },
};

const BREATHE = BREATHE_SPEC.map((s) => s.cls);
const BACKLINE_ROLES = new Set(["support", "mage", "ranger"]);

/** Role-specific SVG weapon/claw overlay (pivoted at shoulder/grip inside .mf-pose-rig). */
function weaponSvgForRole(role, element) {
  const pal = ELEMENT_PALETTE[element] || ELEMENT_PALETTE.stone;
  const r = String(role || "fighter").toLowerCase();
  if (r === "tank") {
    return `<svg viewBox="0 0 64 64" class="mf-weapon-svg" aria-hidden="true">
      <defs><linearGradient id="mfw_${r}_${element}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${pal.core}"/><stop offset="55%" stop-color="${pal.main}"/><stop offset="100%" stop-color="#475569"/>
      </linearGradient></defs>
      <path d="M16 52 L44 16" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
      <path d="M36 12 L52 8 L56 24 L42 30 Z" fill="url(#mfw_${r}_${element})" stroke="${pal.core}" stroke-width="1.5"/>
      <circle cx="46" cy="18" r="3" fill="${pal.core}"/>
    </svg>`;
  }
  if (r === "assassin") {
    return `<svg viewBox="0 0 64 64" class="mf-weapon-svg" aria-hidden="true">
      <path d="M12 46 Q32 30 56 10 Q46 28 24 48 Z" fill="${pal.core}" stroke="${pal.main}" stroke-width="1.5"/>
      <path d="M18 54 Q38 40 58 24 Q46 38 26 54 Z" fill="${pal.main}" opacity="0.9"/>
      <rect x="10" y="44" width="10" height="4" rx="2" transform="rotate(-38 15 46)" fill="#451a03"/>
    </svg>`;
  }
  if (r === "ranger") {
    return `<svg viewBox="0 0 64 64" class="mf-weapon-svg" aria-hidden="true">
      <path d="M22 10 Q48 32 22 54" fill="none" stroke="#92400e" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="22" y1="11" x2="22" y2="53" stroke="${pal.core}" stroke-width="1.3" opacity="0.85"/>
      <line x1="16" y1="32" x2="54" y2="32" stroke="${pal.main}" stroke-width="2.6" stroke-linecap="round"/>
      <polygon points="58,32 48,27 50,32 48,37" fill="${pal.core}"/>
    </svg>`;
  }
  if (r === "mage") {
    return `<svg viewBox="0 0 64 64" class="mf-weapon-svg" aria-hidden="true">
      <path d="M16 56 L42 20" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
      <circle cx="46" cy="16" r="10" fill="${pal.glow}" opacity="0.35"/>
      <circle cx="46" cy="16" r="6" fill="${pal.main}" stroke="${pal.core}" stroke-width="1.8"/>
      <circle cx="44" cy="14" r="2.2" fill="#ffffff"/>
    </svg>`;
  }
  if (r === "support") {
    return `<svg viewBox="0 0 64 64" class="mf-weapon-svg" aria-hidden="true">
      <path d="M18 56 L42 22" stroke="#b45309" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M45 8 L48 16 L56 19 L48 22 L45 30 L42 22 L34 19 L42 16 Z" fill="${pal.core}" stroke="${pal.main}" stroke-width="1.2"/>
    </svg>`;
  }
  // fighter (default): greatsword / blade
  return `<svg viewBox="0 0 64 64" class="mf-weapon-svg" aria-hidden="true">
    <path d="M14 52 L22 44" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
    <path d="M18 40 L28 50" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M22 44 L54 10 L56 14 L26 48 Z" fill="${pal.core}" stroke="${pal.main}" stroke-width="1.4"/>
    <path d="M24 44 L52 14" stroke="#ffffff" stroke-width="1.2" opacity="0.8"/>
  </svg>`;
}

/** Anchor slot root — NEVER moves in layout or transform. */
function slotRoot(el) {
  if (!el) return null;
  if (el.hasAttribute?.("data-unit-id")) return el;
  return el.closest?.("[data-unit-id]") || el;
}

/**
 * Ensure an inner .mf-motion-actor exists inside the anchor slot so that
 * slot layout coordinates stay 100% locked while only .mf-motion-actor translates.
 */
export function ensureMotionActor(slotEl) {
  const slot = slotRoot(slotEl);
  if (!slot) return null;
  let actor = slot.querySelector(":scope > .mf-motion-actor");
  if (!actor) {
    actor = document.createElement("div");
    actor.className = "mf-motion-actor";
    while (slot.firstChild) {
      actor.appendChild(slot.firstChild);
    }
    slot.appendChild(actor);
  }
  return actor;
}

function spriteRoot(el) {
  if (!el) return null;
  if (el.matches?.("img, .mf-battle-cutout, .mf-hero-sprite")) return el;
  return (
    el.querySelector(
      ".mf-pose-rig img.mf-battle-cutout, .mf-sprite-face img.mf-battle-cutout, .mf-sprite-face img, img.mf-battle-cutout, .mf-battle-cutout, .mf-unit-frame img, img"
    ) || el
  );
}

function poseRigRoot(el) {
  const slot = slotRoot(el);
  return slot?.querySelector?.(".mf-pose-rig") || spriteRoot(slot);
}

function weaponLayerRoot(el) {
  const slot = slotRoot(el);
  return slot?.querySelector?.(".mf-weapon-layer") || null;
}

function shadowRoot(el) {
  const slot = slotRoot(el);
  return slot?.querySelector?.(".mf-unit-shadow") || null;
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

function isEnemySlot(el) {
  const slot = slotRoot(el);
  if (!slot) return false;
  if (slot.dataset.side === "enemy" || slot.dataset.slot === "enemy" || slot.dataset.foe === "1") return true;
  if (slot.classList.contains("enemy") || slot.classList.contains("pf-dummy-card")) return true;
  if (slot.closest?.("#pfEnemies, .pv-foes, #enemyBoard")) return true;
  return false;
}

function facingDir(slotEl) {
  return isEnemySlot(slotEl) ? -1 : 1;
}

/**
 * Local horizontal forward direction inside .mf-pose-rig:
 * - Allies (face right, not flipped): +1
 * - Flipped enemies (.mf-sprite-face.is-flipped): +1 (scaleX(-1) on parent already mirrors +X to screen-left)
 * - Native face-left enemies (not flipped): -1
 */
function rigLocalDir(slotEl) {
  const slot = slotRoot(slotEl);
  const face = slot?.querySelector?.(".mf-sprite-face");
  if (face && face.dataset.face === "left" && !face.classList.contains("is-flipped")) {
    return -1;
  }
  return 1;
}

/**
 * Prepare pose rig (.mf-pose-rig), weapon layer (.mf-weapon-layer), and ground shadow (.mf-unit-shadow).
 * Supports optional keyframe pose sprite URLs via data-pose-{windup|strike|hurt} on the <img>.
 */
function ensureUnitRig(card, unit, laneIndex = 0) {
  const actor = ensureMotionActor(card);
  const frame = viewportFor(actor || card);
  const img = spriteRoot(actor || card);
  if (!img) return;

  if (frame && !frame.querySelector(":scope > .mf-unit-shadow")) {
    const sh = document.createElement("div");
    sh.className = "mf-unit-shadow";
    sh.setAttribute("aria-hidden", "true");
    frame.insertBefore(sh, frame.firstChild);
  }

  let face = img.closest(".mf-sprite-face");
  if (!face && img.parentElement) {
    face = document.createElement("span");
    face.className = "mf-sprite-face";
    img.replaceWith(face);
    face.appendChild(img);
  }

  let rig = img.closest(".mf-pose-rig");
  if (!rig && face) {
    rig = document.createElement("span");
    rig.className = "mf-pose-rig";
    img.replaceWith(rig);
    rig.appendChild(img);
  }

  if (rig) {
    const role = String(unit?.role || card?.dataset?.role || "fighter").toLowerCase();
    const element = String(unit?.element || card?.dataset?.element || "stone").toLowerCase();
    const weaponKey = `${role}:${element}`;
    let weapon = rig.querySelector(":scope > .mf-weapon-layer");
    if (!weapon) {
      weapon = document.createElement("span");
      weapon.className = "mf-weapon-layer";
      weapon.setAttribute("aria-hidden", "true");
      rig.appendChild(weapon);
    }
    if (weapon.dataset.weaponKey !== weaponKey) {
      weapon.dataset.weaponKey = weaponKey;
      weapon.dataset.role = role;
      weapon.innerHTML = weaponSvgForRole(role, element);
    }
    const phaseDelay = `${-((Math.abs(laneIndex) * 0.43) % 2.1).toFixed(2)}s`;
    weapon.style.setProperty("--mf-weapon-delay", phaseDelay);
  }
}

/** Switch semantic pose state (and swap pose-specific sprite if authored). */
function setUnitPose(slotEl, pose = "idle") {
  const slot = slotRoot(slotEl);
  if (!slot) return;
  slot.dataset.pose = pose;
  const img = spriteRoot(slot);
  if (img && img.tagName === "IMG") {
    if (!img.dataset.poseIdleSrc && img.getAttribute("src")) {
      img.dataset.poseIdleSrc = img.getAttribute("src");
    }
    const poseAttr =
      pose === "windup"
        ? img.dataset.poseWindup
        : pose === "strike"
          ? img.dataset.poseStrike
          : pose === "hurt"
            ? img.dataset.poseHurt
            : null;
    if (poseAttr && img.getAttribute("src") !== poseAttr) {
      img.setAttribute("src", poseAttr);
    } else if (pose === "idle" && img.dataset.poseIdleSrc && img.getAttribute("src") !== img.dataset.poseIdleSrc) {
      // Only restore if it was swapped to a pose asset
      if (
        img.getAttribute("src") === img.dataset.poseWindup ||
        img.getAttribute("src") === img.dataset.poseStrike ||
        img.getAttribute("src") === img.dataset.poseHurt
      ) {
        img.setAttribute("src", img.dataset.poseIdleSrc);
      }
    }
  }
}

/**
 * Hard reset of a unit's motion container & transient animations.
 * Guarantees the fighter returns strictly to (0, 0) of their anchor slot.
 */
export function resetActor(slotEl) {
  const slot = slotRoot(slotEl);
  if (!slot) return;
  const actor = slot.querySelector(":scope > .mf-motion-actor");
  const rig = poseRigRoot(slot);
  const sprite = spriteRoot(slot);
  const weapon = weaponLayerRoot(slot);
  const shadow = shadowRoot(slot);

  if (actor) {
    cancelAllAnimations(actor);
    actor.classList.remove(MOTION_CLASS, "mf-fx-dash", "mf-fx-jump", "mf-fx-windup", "mf-fx-cast");
    actor.style.transform = "";
    actor.style.transition = "";
    actor.style.opacity = "";
    actor.style.zIndex = "";
    delete actor.dataset.fxDx;
    delete actor.dataset.fxDy;
  }
  if (rig) cancelScriptAnimations(rig);
  if (sprite && sprite !== rig) cancelScriptAnimations(sprite);
  if (weapon) cancelScriptAnimations(weapon);
  if (shadow) cancelScriptAnimations(shadow);

  slot.classList.remove(MOTION_CLASS, "mf-fx-dash", "mf-fx-jump", "mf-fx-windup", "mf-fx-cast", "mf-fx-hit-react");
  slot.style.zIndex = "";
  slot.style.transform = "";
  slot.style.transition = "";
  setUnitPose(slot, "idle");
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

function floatText(viewport, text, tone = "dmg", isCrit = false) {
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
  fct.className = `floating-combat-txt mf-fx-float ${toneCls}${isCrit ? " is-crit" : ""}`;
  fct.textContent = text;
  viewport.appendChild(fct);
  setTimeout(() => fct.remove(), fxMs(isCrit ? 1050 : 900));
}

function slotRect(el) {
  const slot = slotRoot(el) || el;
  const frame = slot?.querySelector?.(".mf-unit-frame") || slot;
  const r = frame.getBoundingClientRect();
  return {
    left: r.left,
    right: r.right,
    top: r.top,
    bottom: r.bottom,
    w: r.width || 110,
    h: r.height || 150,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
  };
}

/**
 * Exact melee stop point in front of the target slot, offset by sprite width
 * so attacker stands cleanly beside the target on the same floor line.
 */
function meleeStopDelta(sourceEl, targetEl, opts = {}) {
  const a = slotRect(sourceEl);
  const b = slotRect(targetEl);
  const dir = b.cx >= a.cx ? 1 : -1;
  const spacing = opts.spacing ?? 0.44;
  const stopGap = Math.max(58, Math.min(138, (a.w + b.w) * spacing));
  const rawDx = b.cx - dir * stopGap - a.cx;
  // Don't overshoot backwards if already very close
  const dx = dir > 0 ? Math.max(24, rawDx) : Math.min(-24, rawDx);
  const dy = b.bottom - a.bottom;
  return { dx, dy, dir };
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

function findActiveArena(refEl) {
  const el = slotRoot(refEl);
  return (
    el?.closest?.(".pf-arena, .pv-arena, #viewBattle .arena, #viewRaidBattle .raid-arena") ||
    document.querySelector("#viewPracticeFight:not(.hidden) .pf-arena") ||
    document.querySelector("#viewPvpFight:not(.hidden) .pv-arena") ||
    document.querySelector("#viewBattle:not(.hidden)") ||
    null
  );
}

/** Subtle camera/arena shake on impact (stronger on crit). */
function shakeArena(refEl, isCrit = false) {
  const arena = findActiveArena(refEl);
  if (!arena || typeof arena.animate !== "function") return;
  const amp = isCrit ? 7 : 3.2;
  const dur = fxMs(isCrit ? 220 : 140);
  cancelScriptAnimations(arena);
  arena.animate(
    [
      { transform: "translate3d(0, 0, 0)" },
      { transform: `translate3d(${-amp}px, ${amp * 0.5}px, 0)` },
      { transform: `translate3d(${amp}px, ${-amp * 0.4}px, 0)` },
      { transform: `translate3d(${-amp * 0.55}px, ${amp * 0.25}px, 0)` },
      { transform: `translate3d(${amp * 0.35}px, 0, 0)` },
      { transform: "translate3d(0, 0, 0)" },
    ],
    { duration: dur, easing: "ease-out" }
  );
}

/** Spawn motion streak lines during dash. */
function spawnDashTrail(sourceEl, dx, dy, element) {
  const a = slotRect(sourceEl);
  const layer = fxLayer();
  if (!layer || activeFxNodes >= FX_CONCURRENT_MAX) return;
  const dist = Math.hypot(dx, dy);
  if (dist < 24) return;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const trail = document.createElement("div");
  trail.className = `mf-fx-dash-trail ${elementClass(element)}`;
  trail.style.left = `${a.cx}px`;
  trail.style.top = `${a.cy}px`;
  trail.style.width = `${Math.min(dist * 0.85, 240)}px`;
  trail.style.transform = `translate(0, -50%) rotate(${angle}deg)`;
  layer.appendChild(trail);
  trackFxNode(trail, 240);
}

/* ============================================================================
 * 5-PHASE COMBAT CYCLE (Wind-up -> Dash -> Strike+Impact -> Hit-stop -> Return)
 * ============================================================================ */

/** Phase 2: Wind-up / Замах (160–220ms). */
async function phaseWindup(sourceEl, role, token) {
  const slot = slotRoot(sourceEl);
  const actor = ensureMotionActor(slot);
  const rig = poseRigRoot(slot);
  const weapon = weaponLayerRoot(slot);
  const view = viewportFor(slot);
  if (!slot || !actor) return false;

  setUnitPose(slot, "windup");
  actor.classList.add(MOTION_CLASS, "mf-fx-windup");
  slot.style.zIndex = "45";

  const ms = role === "tank" ? 210 : role === "assassin" ? 165 : 185;
  const dur = fxMs(ms);

  // Ready glint on weapon/chest
  spawnFx(view, `mf-fx-ready-glint ${elementClass(slot.dataset.element)}`, "", 220);

  const anims = [];
  const ldir = rigLocalDir(slot);
  if (rig && typeof rig.animate === "function") {
    cancelScriptAnimations(rig);
    const crouchY = role === "mage" || role === "support" ? -6 : 6;
    const leanDeg = (role === "mage" || role === "support" ? -4 : -8) * ldir;
    anims.push(
      rig.animate(
        [
          { transform: "translate3d(0, 0, 0) scale(1, 1) rotate(0deg)" },
          {
            transform: `translate3d(${-10 * ldir}px, ${crouchY}px, 0) scale(1.06, 0.92) rotate(${leanDeg}deg)`,
          },
        ],
        { duration: dur, easing: "cubic-bezier(0.3, 0, 0.2, 1)", fill: "forwards" }
      )
    );
  }
  if (weapon && typeof weapon.animate === "function") {
    cancelScriptAnimations(weapon);
    anims.push(
      weapon.animate(
        [
          { transform: "translate3d(0, 0, 0) rotate(0deg) scale(1)" },
          { transform: `translate3d(${-8 * ldir}px, -16px, 0) rotate(${-62 * ldir}deg) scale(1.16)` },
        ],
        { duration: dur, easing: "cubic-bezier(0.25, 0.9, 0.3, 1)", fill: "forwards" }
      )
    );
  }

  await Promise.all(anims.map((a) => animFinished(a, token)));
  return token === fxToken;
}

/** Phase 3: Dash / Рывок к цели (180–240ms). */
export async function dashTo(source, target, opts = {}) {
  const token = opts.token ?? fxToken;
  const slot = slotRoot(source);
  const actor = ensureMotionActor(slot);
  const rig = poseRigRoot(slot);
  const shadow = shadowRoot(slot);
  if (!slot || !actor || !target) return false;

  const { dx, dy, dir } = meleeStopDelta(slot, target, opts);
  const ms = opts.ms ?? 210;
  const dur = fxMs(ms);
  const hopY = opts.arc ?? 22;

  setUnitPose(slot, "dash");
  actor.classList.add(MOTION_CLASS, "mf-fx-dash");
  actor.dataset.fxDx = String(dx);
  actor.dataset.fxDy = String(dy);
  slot.style.zIndex = "55";

  spawnFx(viewportFor(slot), "mf-fx-jump-smoke", "", 360);
  spawnDashTrail(slot, dx, dy, slot.dataset.element);

  cancelAllAnimations(actor);
  const moveAnim = actor.animate(
    [
      { transform: "translate3d(0, 0, 0)" },
      {
        transform: `translate3d(${(dx * 0.55).toFixed(1)}px, ${(dy * 0.55 - hopY).toFixed(1)}px, 0)`,
        offset: 0.52,
      },
      { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)` },
    ],
    { duration: dur, easing: "cubic-bezier(0.18, 0.88, 0.28, 1)", fill: "forwards" }
  );

  const ldir = rigLocalDir(slot);
  if (rig && typeof rig.animate === "function") {
    cancelScriptAnimations(rig);
    rig.animate(
      [
        { transform: `translate3d(${-8 * ldir}px, 4px, 0) scale(1.04, 0.94) rotate(${-6 * ldir}deg)` },
        { transform: `translate3d(${6 * ldir}px, -4px, 0) scale(0.96, 1.05) rotate(${11 * ldir}deg)`, offset: 0.55 },
        { transform: `translate3d(${4 * ldir}px, 0, 0) scale(1.03, 0.97) rotate(${6 * ldir}deg)` },
      ],
      { duration: dur, easing: "ease-out", fill: "forwards" }
    );
  }
  if (shadow && typeof shadow.animate === "function") {
    cancelScriptAnimations(shadow);
    shadow.animate(
      [
        { transform: "translateX(-50%) scale(1)", opacity: 0.55 },
        { transform: "translateX(-50%) scale(0.72)", opacity: 0.28, offset: 0.5 },
        { transform: "translateX(-50%) scale(1.05)", opacity: 0.6 },
      ],
      { duration: dur, easing: "ease-out" }
    );
  }

  const ok = await animFinished(moveAnim, token);
  if (!ok) return false;
  // Hold exact endpoint without relying on residual animation state
  actor.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
  void dir;
  return true;
}

/** High-arc leap variant (e.g. assassin backline dive). */
export function jumpArc(source, target, opts = {}) {
  return dashTo(source, target, {
    ...opts,
    ms: opts.ms ?? 230,
    arc: opts.arc ?? 56,
  });
}

/** Ranged step forward before casting/shooting. */
async function rangedStepForward(sourceEl, token) {
  const slot = slotRoot(sourceEl);
  const actor = ensureMotionActor(slot);
  if (!slot || !actor) return false;
  const dir = facingDir(slot);
  const dx = dir * 28;
  actor.dataset.fxDx = String(dx);
  actor.dataset.fxDy = "0";
  actor.classList.add(MOTION_CLASS);
  slot.style.zIndex = "45";
  setUnitPose(slot, "dash");
  cancelAllAnimations(actor);
  const anim = actor.animate(
    [
      { transform: "translate3d(0, 0, 0)" },
      { transform: `translate3d(${dx}px, -4px, 0)`, offset: 0.5 },
      { transform: `translate3d(${dx}px, 0, 0)` },
    ],
    { duration: fxMs(180), easing: "cubic-bezier(0.2, 0.9, 0.3, 1)", fill: "forwards" }
  );
  const ok = await animFinished(anim, token);
  if (ok) actor.style.transform = `translate3d(${dx}px, 0, 0)`;
  return ok;
}

/** Phase 4: Strike swing on attacker (120–160ms). */
async function phaseStrikeSwing(sourceEl, role, token) {
  const slot = slotRoot(sourceEl);
  const rig = poseRigRoot(slot);
  const weapon = weaponLayerRoot(slot);
  if (!slot) return false;

  setUnitPose(slot, "strike");
  const dur = fxMs(role === "tank" ? 155 : role === "assassin" ? 120 : 140);
  const anims = [];
  const ldir = rigLocalDir(slot);

  if (rig && typeof rig.animate === "function") {
    cancelScriptAnimations(rig);
    anims.push(
      rig.animate(
        [
          { transform: `translate3d(${4 * ldir}px, -4px, 0) scale(0.96, 1.06) rotate(${4 * ldir}deg)` },
          { transform: `translate3d(${16 * ldir}px, 3px, 0) scale(1.09, 0.92) rotate(${13 * ldir}deg)`, offset: 0.45 },
          { transform: `translate3d(${8 * ldir}px, 1px, 0) scale(1.02, 0.98) rotate(${5 * ldir}deg)` },
        ],
        { duration: dur, easing: "cubic-bezier(0.15, 0.95, 0.25, 1)", fill: "forwards" }
      )
    );
  }
  if (weapon && typeof weapon.animate === "function") {
    cancelScriptAnimations(weapon);
    anims.push(
      weapon.animate(
        [
          { transform: `translate3d(${-8 * ldir}px, -16px, 0) rotate(${-62 * ldir}deg) scale(1.16)` },
          { transform: `translate3d(${18 * ldir}px, 12px, 0) rotate(${68 * ldir}deg) scale(1.28)`, offset: 0.45 },
          { transform: `translate3d(${10 * ldir}px, 6px, 0) rotate(${42 * ldir}deg) scale(1.08)` },
        ],
        { duration: dur, easing: "cubic-bezier(0.12, 0.95, 0.2, 1)", fill: "forwards" }
      )
    );
  }

  await Promise.all(anims.map((a) => animFinished(a, token)));
  return token === fxToken;
}

/** Phase 5: Return / Возврат strictly to (0, 0) of anchor slot (200–240ms). */
export async function returnHome(source, opts = {}) {
  const token = opts.token ?? fxToken;
  const slot = slotRoot(source);
  const actor = slot?.querySelector?.(":scope > .mf-motion-actor");
  const rig = poseRigRoot(slot);
  const weapon = weaponLayerRoot(slot);
  if (!slot || !actor) {
    resetActor(slot);
    return true;
  }

  const dx = Number(actor.dataset.fxDx || 0);
  const dy = Number(actor.dataset.fxDy || 0);
  const dist = Math.hypot(dx, dy);

  if (dist < 3) {
    resetActor(slot);
    return true;
  }

  setUnitPose(slot, "return");
  const dur = fxMs(opts.ms ?? 220);
  const hopY = Math.min(28, Math.max(12, dist * 0.08));

  cancelAllAnimations(actor);
  const backAnim = actor.animate(
    [
      { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)` },
      {
        transform: `translate3d(${(dx * 0.45).toFixed(1)}px, ${(dy * 0.45 - hopY).toFixed(1)}px, 0)`,
        offset: 0.48,
      },
      { transform: "translate3d(0, 0, 0)" },
    ],
    { duration: dur, easing: "cubic-bezier(0.22, 0.85, 0.36, 1)", fill: "forwards" }
  );

  if (rig && typeof rig.animate === "function") {
    cancelScriptAnimations(rig);
    rig.animate(
      [
        { transform: "translate3d(4px, 0, 0) rotate(-6deg)" },
        { transform: "translate3d(0, 0, 0) rotate(0deg)" },
      ],
      { duration: dur, easing: "ease-out" }
    );
  }
  if (weapon && typeof weapon.animate === "function") {
    cancelScriptAnimations(weapon);
    weapon.animate(
      [
        { transform: "translate3d(8px, 4px, 0) rotate(28deg) scale(1.04)" },
        { transform: "translate3d(0, 0, 0) rotate(0deg) scale(1)" },
      ],
      { duration: dur, easing: "ease-out" }
    );
  }

  await animFinished(backAnim, token);
  resetActor(slot);
  return token === fxToken;
}

/** Ranged / spell projectile from source center to target center. */
export function projectile(source, target, style = "arrow", opts = {}) {
  const aEl = slotRoot(source) || source;
  const bEl = slotRoot(target) || target;
  if (!aEl || !bEl) return Promise.resolve(false);
  if (activeFxNodes >= FX_CONCURRENT_MAX) return Promise.resolve(false);
  const a = slotRect(aEl);
  const b = slotRect(bEl);
  const ms = opts.ms ?? (style === "beam" ? 300 : 240);
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const node = document.createElement("div");
  const elCls = elementClass(opts.element);
  node.className = `mf-fx-projectile mf-fx-projectile--${style} ${elCls}`;
  node.style.left = `${a.cx}px`;
  node.style.top = `${a.cy - a.h * 0.08}px`;
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
  const aEl = slotRoot(source) || source;
  if (!aEl) return Promise.resolve(false);
  const list = (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
  if (!list.length) return Promise.resolve(false);
  const ms = opts.ms ?? 320;
  const a = slotRect(aEl);
  const ring = style === "aoe" || style === "aoe_heal" || list.length > 2;
  if (ring && activeFxNodes < FX_CONCURRENT_MAX) {
    const node = document.createElement("div");
    node.className = `mf-fx-wave-ring mf-fx-wave--${style} ${elementClass(opts.element)}`;
    node.style.left = `${a.cx}px`;
    node.style.top = `${a.cy}px`;
    node.style.animationDuration = `${fxMs(ms + 100)}ms`;
    fxLayer().appendChild(node);
    trackFxNode(node, ms + 140);
  }
  list.forEach((t, i) => {
    const bEl = slotRoot(t) || t;
    if (!bEl || activeFxNodes >= FX_CONCURRENT_MAX) return;
    const b = slotRect(bEl);
    const node = document.createElement("div");
    node.className = `mf-fx-wave mf-fx-wave--${style} ${elementClass(opts.element)}`;
    node.style.left = `${a.cx}px`;
    node.style.top = `${a.cy}px`;
    node.style.setProperty("--fx-dx", `${b.cx - a.cx}px`);
    node.style.setProperty("--fx-dy", `${b.cy - a.cy}px`);
    node.style.animationDelay = `${fxMs(i * 35)}ms`;
    node.style.animationDuration = `${fxMs(ms)}ms`;
    fxLayer().appendChild(node);
    trackFxNode(node, ms + i * 35 + 40);
  });
  return wait(ms + Math.min(list.length, 3) * 35, fxToken);
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
 * Idle breathe + rig + weapon layer + ground shadow on a fight unit cutout.
 * Locked for every live-fight mode: practice / Mythmir PvE / PvP / raid (D-046, MF-149).
 */
export function decorateBattleUnitIdle(card, unit, laneIndex = 0) {
  if (!card || !unit) return;
  card.dataset.unitId = unit.id || "";
  card.dataset.role = unit.role || "";
  card.dataset.element = unit.element || "";
  if (typeof unit.lane === "number") card.dataset.lane = String(unit.lane);
  if (!card.dataset.pose) card.dataset.pose = "idle";

  ensureUnitRig(card, unit, laneIndex);

  const img = spriteRoot(card);
  if (!img) return;
  BREATHE.forEach((c) => img.classList.remove(c));
  Object.values(ELEMENT_AURA).forEach((c) => img.classList.remove(c));
  img.classList.remove("mf-sprite-crisp", "mf-fx-stealth", "mf-fx-dead-settle");
  img.style.removeProperty("animation");

  if (!unit.alive) {
    img.classList.remove("mf-hero-sprite");
    card.classList.add("mf-unit-dead");
    return;
  }
  card.classList.remove("mf-unit-dead");

  const idx = Math.abs(laneIndex + (isEnemySlot(card) ? 3 : 0)) % BREATHE_SPEC.length;
  const breathe = BREATHE_SPEC[idx];
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

/** Cancel pending combat presentation timers / floating nodes / motion & reset every actor to (0, 0). */
export function skipCombatFx() {
  fxToken += 1;
  activeFxNodes = 0;
  document
    .querySelectorAll(
      ".mf-fx-float, .slash-impact-fx, .mf-fx-slash-arc, .mf-fx-claw-marks, .mf-fx-ready-glint, .mf-fx-dash-trail, .shield-barrier-fx, .mf-fx-projectile, .mf-fx-wave, .mf-fx-wave-ring, .mf-fx-jump-smoke, .mf-fx-slam-dust, .mf-fx-impact, .mf-fx-crit-flash, .mf-fx-pierce, .mf-fx-status-mark, .mf-fx-taunt-mark, .mf-fx-heal-pulse, .mf-fx-potion, .mf-fx-aoe-blast, .mf-fx-death-shadow"
    )
    .forEach((n) => n.remove());
  document.querySelectorAll("[data-unit-id]").forEach((slot) => resetActor(slot));
  document.querySelectorAll(".pf-arena, .pv-arena").forEach((arena) => cancelScriptAnimations(arena));
  const layer = document.getElementById("mf-battle-fx-layer");
  if (layer) layer.innerHTML = "";
}

/** Knockback recoil + brightness hit-flash on damaged target. */
function playTargetRecoil(targetEl, isCrit, secondary) {
  const slot = slotRoot(targetEl);
  const actor = ensureMotionActor(slot);
  const sprite = spriteRoot(slot);
  if (!slot || !actor) return;

  const knockDir = isEnemySlot(slot) ? 1 : -1;
  const dist = isCrit ? 22 : secondary ? 10 : 15;
  const dur = fxMs(isCrit ? 320 : 250);

  setUnitPose(slot, "hurt");
  // Only recoil if this target is not currently mid-dash
  if (!actor.classList.contains("mf-fx-dash")) {
    cancelAllAnimations(actor);
    const recoilAnim = actor.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: `translate3d(${knockDir * dist}px, -4px, 0)`, offset: 0.22 },
        { transform: `translate3d(${-knockDir * Math.round(dist * 0.25)}px, 1px, 0)`, offset: 0.62 },
        { transform: "translate3d(0, 0, 0)" },
      ],
      { duration: dur, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
    const token = fxToken;
    recoilAnim.finished
      .then(() => {
        if (token === fxToken && slot.dataset.pose === "hurt") {
          setUnitPose(slot, "idle");
        }
      })
      .catch(() => {});
  }

  if (sprite && typeof sprite.animate === "function") {
    cancelScriptAnimations(sprite);
    sprite.animate(
      [
        { filter: `brightness(${isCrit ? 2.4 : 1.95}) saturate(1.25) drop-shadow(0 0 22px rgba(255,255,255,0.95))` },
        { filter: `brightness(1.35) drop-shadow(0 0 18px ${isCrit ? "rgba(251,191,36,0.95)" : "rgba(239,68,68,0.85)"})`, offset: 0.4 },
        { filter: "none" },
      ],
      { duration: fxMs(isCrit ? 340 : 260), easing: "ease-out" }
    );
  }
}

function playHitImpact(ev, opts = {}) {
  const targetEl = findBattleUnitEl(ev.targetId);
  const targetSprite = spriteRoot(targetEl);
  const targetView = viewportFor(targetEl);
  const secondary = !!ev.aoeSecondary;
  const strength = secondary ? " is-secondary" : "";
  const crit = !!ev.crit;
  const elCls = elementClass(opts.element);
  const role = String(opts.role || "").toLowerCase();

  // Impact slash / claw / pierce / crit VFX right on the target
  if (ev.pierce) {
    spawnFx(targetView, `mf-fx-pierce mf-fx-impact ${elCls}${strength}`, "", 440);
  } else if (role === "assassin") {
    spawnFx(targetView, `mf-fx-claw-marks ${elCls}${strength}`, "", 380);
  } else {
    spawnFx(targetView, `mf-fx-slash-arc ${elCls}${strength}${crit ? " is-crit" : ""}`, "", 380);
  }

  if (crit) {
    spawnFx(targetView, `mf-fx-crit-flash mf-fx-impact${strength}`, "", 460);
  }

  playTargetRecoil(targetEl, crit, secondary);
  if (!secondary) shakeArena(targetEl, crit);
  SoundFX.playDamage(crit);

  const amt = Number(ev.amount) || 0;
  if (amt > 0) {
    const label = crit ? `-${amt} КРИТ!` : `-${amt}`;
    floatText(targetView, label, "dmg", crit);
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
      wave(sourceEl, [targetEl], "shield", { element: "water", ms: 320 });
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
      wave(sourceEl, [targetEl], "buff", { element: "fire", ms: 320 });
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
    if (sourceEl) wave(sourceEl, [targetEl], "cleanse", { element: "water", ms: 320 });
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
  const element = unitElementFromDiff(diff, primary.sourceId) || sourceEl?.dataset?.element || "stone";
  const targetEl = findBattleUnitEl(primary.targetId);
  if (!targetEl) {
    hits.forEach((h) => playHitImpact(h, { role, element }));
    return;
  }

  const backline = isBacklineTarget(diff, primary.sourceId, primary.targetId);
  const dual =
    hits.filter((h) => h.targetId === primary.targetId && h.sourceId).length >= 2 &&
    (role === "fighter" || role === "assassin");

  // Phase 2: Wind-up (165–210ms)
  if (!(await phaseWindup(sourceEl, role, token))) return;

  // Phase 3: Dash to target with sprite-width offset (180–240ms)
  const dashOpts =
    role === "assassin"
      ? { ms: 195, arc: backline ? 56 : 34, spacing: 0.4, token }
      : role === "tank"
        ? { ms: 230, arc: 16, spacing: 0.46, token }
        : { ms: 210, arc: backline ? 38 : 22, spacing: 0.43, token };

  if (!(await dashTo(sourceEl, targetEl, dashOpts))) return;

  // Phase 4: Strike + Impact + Hit-stop (55–65ms)
  const sameTarget = hits.filter((h) => h.targetId === primary.targetId);
  const others = hits.filter((h) => h.targetId !== primary.targetId);

  if (dual && sameTarget.length >= 2) {
    const swing1 = phaseStrikeSwing(sourceEl, role, token);
    await wait(55, token);
    if (token !== fxToken) return;
    playHitImpact(sameTarget[0], { role, element });
    if (role === "tank") spawnFx(viewportFor(targetEl), "mf-fx-slam-dust", "", 420);
    await wait(60, token); // hit-stop
    await swing1;
    if (token !== fxToken) return;

    const swing2 = phaseStrikeSwing(sourceEl, role, token);
    await wait(50, token);
    if (token !== fxToken) return;
    playHitImpact(sameTarget[1], { role, element });
    sameTarget.slice(2).forEach((h) => playHitImpact(h, { role, element }));
    await wait(65, token); // hit-stop
    await swing2;
  } else {
    const swing = phaseStrikeSwing(sourceEl, role, token);
    await wait(55, token);
    if (token !== fxToken) return;
    playHitImpact(sameTarget[0], { role, element });
    if (role === "tank") spawnFx(viewportFor(targetEl), "mf-fx-slam-dust", "", 420);
    sameTarget.slice(1).forEach((h, i) => {
      setTimeout(() => {
        if (token !== fxToken) return;
        playHitImpact(h, { role, element });
      }, fxMs((i + 1) * 85));
    });
    others.forEach((h, i) => {
      setTimeout(() => {
        if (token !== fxToken) return;
        playHitImpact(h, { role, element });
      }, fxMs(70 + i * 55));
    });
    // Hit-stop pause (55–65ms)
    await wait(sameTarget[0]?.crit ? 70 : 58, token);
    await swing;
  }

  if (token !== fxToken) return;

  // Phase 5: Return to (0, 0) (200–240ms)
  await returnHome(sourceEl, { ms: 220, token });
}

async function playRangedAttack(diff, sourceEl, hits, role, token) {
  const element = unitElementFromDiff(diff, hits[0]?.sourceId) || sourceEl?.dataset?.element || "stone";
  const primary = hits.find((h) => !h.aoeSecondary) || hits[0];
  const targets = [...new Map(hits.map((h) => [h.targetId, h])).values()];
  const aoe = hits.some((h) => h.aoeSecondary) || targets.length > 1;

  // Phase 2: Wind-up
  if (!(await phaseWindup(sourceEl, role, token))) return;

  // Phase 3: Step forward
  if (!(await rangedStepForward(sourceEl, token))) return;

  // Phase 4: Release / Swing + Projectile
  const release = phaseStrikeSwing(sourceEl, role, token);

  if (role === "mage" && aoe) {
    spawnFx(viewportFor(sourceEl), `mf-fx-aoe-cast ${elementClass(element)}`, "", 460);
    await wait(140, token);
    if (token !== fxToken) return;
    const ringTargets = targets.map((h) => findBattleUnitEl(h.targetId)).filter(Boolean);
    await wave(sourceEl, ringTargets, "aoe", { element, ms: 340 });
    hits.forEach((h, i) => {
      setTimeout(() => {
        if (token !== fxToken) return;
        const view = viewportFor(findBattleUnitEl(h.targetId));
        spawnFx(view, `mf-fx-aoe-blast ${elementClass(element)}${h.aoeSecondary ? " is-secondary" : ""}`, "", 440);
        playHitImpact(h, { role, element });
      }, fxMs(i * 50));
    });
    await release;
    await wait(180 + targets.length * 35, token);
    if (token !== fxToken) return;
    await returnHome(sourceEl, { ms: 200, token });
    return;
  }

  if (role === "ranger" && primary) {
    const markEl = findBattleUnitEl(primary.targetId);
    if (markEl && (BACKLINE_ROLES.has(unitRoleFromDiff(diff, primary.targetId)) || isBacklineTarget(diff, primary.sourceId, primary.targetId))) {
      spawnFx(viewportFor(markEl), "mf-fx-aim-mark", "", 420);
      await wait(90, token);
      if (token !== fxToken) return;
    }
  }

  const style = role === "mage" ? "bolt" : "arrow";
  const flight = [];
  for (let i = 0; i < targets.length; i++) {
    const h = targets[i];
    const tEl = findBattleUnitEl(h.targetId);
    if (!tEl) {
      playHitImpact(h, { role, element });
      continue;
    }
    flight.push(
      (async () => {
        if (i > 0) await wait(i * 45, token);
        if (token !== fxToken) return;
        await projectile(sourceEl, tEl, style, { element, ms: 240 });
        if (token !== fxToken) return;
        const related = hits.filter((x) => x.targetId === h.targetId);
        related.forEach((ev, j) => {
          if (j === 0) playHitImpact(ev, { role, element });
          else {
            setTimeout(() => {
              if (token === fxToken) playHitImpact(ev, { role, element });
            }, fxMs(j * 85));
          }
        });
      })()
    );
  }
  await Promise.all([release, ...flight]);
  await wait(80, token);
  if (token !== fxToken) return;

  // Phase 5: Return
  await returnHome(sourceEl, { ms: 200, token });
}

async function playSupportAttack(diff, sourceEl, hits, token) {
  const primary = hits[0];
  const element = unitElementFromDiff(diff, primary?.sourceId) || sourceEl?.dataset?.element || "water";
  const targetEl = findBattleUnitEl(primary?.targetId);
  if (!(await phaseWindup(sourceEl, "support", token))) return;
  if (!(await rangedStepForward(sourceEl, token))) return;
  const swing = phaseStrikeSwing(sourceEl, "support", token);
  if (targetEl) {
    await wave(sourceEl, [targetEl], "smite", { element, ms: 260 });
  }
  if (token !== fxToken) return;
  hits.forEach((h) => playHitImpact(h, { role: "support", element }));
  await swing;
  await wait(90, token);
  if (token !== fxToken) return;
  await returnHome(sourceEl, { ms: 200, token });
}

async function playHealClip(diff, sourceEl, heals, role, token) {
  const targetEls = heals.map((h) => findBattleUnitEl(h.targetId)).filter(Boolean);
  const element = unitElementFromDiff(diff, heals[0]?.sourceId) || "water";
  SoundFX.playSupport();
  if (!(await phaseWindup(sourceEl, role || "support", token))) return;
  if (!(await rangedStepForward(sourceEl, token))) return;
  const swing = phaseStrikeSwing(sourceEl, role || "support", token);
  const style = heals.length > 1 ? "aoe_heal" : "heal";
  await wave(sourceEl, targetEls, style, { element, ms: 340 });
  if (token !== fxToken) return;
  heals.forEach((h, i) => {
    setTimeout(() => {
      if (token === fxToken) playHealOnTarget(h);
    }, fxMs(i * 45));
  });
  await swing;
  await wait(140, token);
  if (token !== fxToken) return;
  await returnHome(sourceEl, { ms: 200, token });
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

  // Always start from a guaranteed clean (0, 0) anchor position
  resetActor(sourceEl);

  try {
    if (sourcedHits.length) {
      SoundFX.playRole(role);
      if (role === "ranger" || role === "mage") {
        await playRangedAttack(diff, sourceEl, sourcedHits, role, token);
      } else if (role === "support") {
        await playSupportAttack(diff, sourceEl, sourcedHits, token);
      } else {
        await playMeleeAttack(diff, sourceEl, sourcedHits, role || "fighter", token);
      }
    }

    if (token !== fxToken) return;

    if (heals.length) {
      await playHealClip(diff, sourceEl, heals, role || "support", token);
    }

    if (token !== fxToken) return;

    const needsWave = activeStatus.some(
      (s) =>
        ["atk_up", "shield", "cleanser", "taunt"].includes(String(s.status || "").toLowerCase()) ||
        s.statusOp === "shield" ||
        s.statusOp === "clear"
    );
    if (needsWave && !sourcedHits.length && !heals.length) {
      await phaseWindup(sourceEl, role, token);
      if (role === "tank" || role === "support") SoundFX.playRole(role || "tank");
    }
    for (const ev of activeStatus) {
      if (token !== fxToken) return;
      playStatusApply(ev, sourceEl, role);
      await wait(55, token);
    }
  } finally {
    // 100% guarantee: fighter always returns cleanly to (0, 0) of their anchor slot
    resetActor(sourceEl);
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
      key = `__dot:${ev.targetId}`;
      activeSource = null;
    } else if (ev.kind === "dodge" || (ev.kind === "status" && ev.statusOp === "block")) {
      key = `__react:${ev.kind}:${ev.targetId}`;
    } else if (activeSource) {
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
 * Groups by sourceId into readable 5-phase clips (practice / PvE / PvP / raid).
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
      await wait(65, token);
    }
  }, fxMs(16));
}

/** Resume audio after first user gesture. */
export function bindBattleFxGestureUnlock() {
  const once = () => initAudioContext();
  document.addEventListener("pointerdown", once, { once: true });
  document.addEventListener("keydown", once, { once: true });
}
