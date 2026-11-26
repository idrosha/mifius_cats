/**
 * Universal data-driven 2D bone animation engine (Web Animations API).
 *
 * - Animates ONLY `transform` and `opacity` on DOM rig bones.
 * - Scales all clip & blend durations via `fxMs()`.
 * - Smoothly blends between clips (`idle → action → idle`) with zero snapping.
 * - Integrates with `fxToken` and `skipCombatFx`: instant cancellation + zero-drift rest pose.
 * - Respects `prefers-reduced-motion: reduce`.
 * - Zero external dependencies.
 */

const RIG_STATES = new WeakMap();
const ACTIVE_RIGS = new Set();

let _fxMs = (ms) => Math.max(40, Math.round(ms));
let _getFxToken = () => 0;
let _clipRegistry = Object.create(null);

const REST_POSE = Object.freeze({
  x: 0,
  y: 0,
  rot: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
});

/** Bind timing (`fxMs`) and cancellation (`getFxToken`) hooks from battle-fx.js. */
export function configureAnimEngine({ fxMs, getFxToken, clips } = {}) {
  if (typeof fxMs === "function") _fxMs = fxMs;
  if (typeof getFxToken === "function") _getFxToken = getFxToken;
  if (clips && typeof clips === "object") {
    registerClips(clips);
  }
}

/** Register named clips so `playClip(rig, "idle")` can resolve by string name. */
export function registerClips(clipMap) {
  if (!clipMap || typeof clipMap !== "object") return;
  Object.assign(_clipRegistry, clipMap);
}

export function getRegisteredClip(name) {
  return _clipRegistry[name] || null;
}

export function prefersReducedMotion() {
  try {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  } catch {
    return false;
  }
}

function getRigState(rig) {
  let st = RIG_STATES.get(rig);
  if (!st) {
    st = {
      activeAnims: new Map(),
      poses: new Map(),
      activeClip: null,
      idleClip: null,
      runId: 0,
      pendingTimers: new Set(),
    };
    RIG_STATES.set(rig, st);
  }
  return st;
}

function restPoseForBone(rig, boneName) {
  const defaultOpacity = rig?.boneMeta?.[boneName]?.defaultOpacity;
  return {
    x: 0,
    y: 0,
    rot: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: typeof defaultOpacity === "number" ? defaultOpacity : 1,
  };
}

function normalizeKeyframe(kf, fallbackOpacity = 1) {
  const sx = kf.scaleX ?? kf.scale ?? 1;
  const sy = kf.scaleY ?? kf.scale ?? 1;
  return {
    t: Math.max(0, Math.min(1, Number(kf.t) || 0)),
    x: Number(kf.x) || 0,
    y: Number(kf.y) || 0,
    rot: Number(kf.rot) || 0,
    scaleX: Number(sx),
    scaleY: Number(sy),
    opacity: typeof kf.opacity === "number" ? kf.opacity : fallbackOpacity,
    easing: kf.easing || undefined,
  };
}

function poseToTransform(pose, canvasW, canvasH) {
  const xPct = (pose.x / canvasW) * 100;
  const yPct = (pose.y / canvasH) * 100;
  return `translate(${xPct.toFixed(3)}%, ${yPct.toFixed(3)}%) rotate(${pose.rot.toFixed(2)}deg) scale(${pose.scaleX.toFixed(4)}, ${pose.scaleY.toFixed(4)})`;
}

function poseEqualsRest(pose, rest) {
  return (
    Math.abs(pose.x - rest.x) < 0.05 &&
    Math.abs(pose.y - rest.y) < 0.05 &&
    Math.abs(pose.rot - rest.rot) < 0.05 &&
    Math.abs(pose.scaleX - rest.scaleX) < 0.002 &&
    Math.abs(pose.scaleY - rest.scaleY) < 0.002 &&
    Math.abs(pose.opacity - rest.opacity) < 0.01
  );
}

/** Sample a bone's logical pose from a sorted keyframe track at normalized time `u` in [0, 1]. */
function sampleTrack(track, u, fallbackOpacity) {
  if (!track || !track.length) return { ...REST_POSE, opacity: fallbackOpacity };
  const clamped = Math.max(0, Math.min(1, u));
  if (clamped <= track[0].t) return { ...track[0] };
  const last = track[track.length - 1];
  if (clamped >= last.t) return { ...last };
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const span = b.t - a.t || 1;
      const k = (clamped - a.t) / span;
      return {
        x: a.x + (b.x - a.x) * k,
        y: a.y + (b.y - a.y) * k,
        rot: a.rot + (b.rot - a.rot) * k,
        scaleX: a.scaleX + (b.scaleX - a.scaleX) * k,
        scaleY: a.scaleY + (b.scaleY - a.scaleY) * k,
        opacity: a.opacity + (b.opacity - a.opacity) * k,
      };
    }
  }
  return { ...last };
}

/** Snapshot current pose of every bone in the rig before interrupting an active clip. */
function captureCurrentPoses(rig, st) {
  const snapshot = new Map();
  const active = st.activeClip;
  const now = performance.now();

  for (const boneName of Object.keys(rig.bones)) {
    const rest = restPoseForBone(rig, boneName);
    if (active && active.tracks.has(boneName)) {
      const elapsed = Math.max(0, now - active.startTime);
      const dur = active.durationMs || 1;
      const u = active.loop ? (elapsed % dur) / dur : Math.min(1, elapsed / dur);
      snapshot.set(boneName, sampleTrack(active.tracks.get(boneName), u, rest.opacity));
    } else if (st.poses.has(boneName)) {
      snapshot.set(boneName, { ...st.poses.get(boneName) });
    } else {
      snapshot.set(boneName, rest);
    }
  }
  return snapshot;
}

function clearRigTimers(st) {
  for (const tid of st.pendingTimers) clearTimeout(tid);
  st.pendingTimers.clear();
}

function cancelRigAnimations(st) {
  for (const anim of st.activeAnims.values()) {
    try {
      anim.cancel();
    } catch {
      /* ignore */
    }
  }
  st.activeAnims.clear();
}

/**
 * Instantly stop all animations on a rig and restore every bone to its exact rest pose.
 * Guarantees zero drift on `skipCombatFx` / `returnHome`.
 */
export function resetRigToRest(rig) {
  if (!rig || rig.mode !== "rig") return;
  const st = getRigState(rig);
  st.runId += 1;
  clearRigTimers(st);
  cancelRigAnimations(st);
  st.activeClip = null;
  st.poses.clear();

  for (const [name, boneEl] of Object.entries(rig.bones)) {
    const rest = restPoseForBone(rig, name);
    boneEl.style.transform = "";
    boneEl.style.opacity = rest.opacity === 1 ? "" : String(rest.opacity);
  }
}

/** Stop animations on all active rigs and restore rest poses (called by `skipCombatFx`). */
export function stopAllRigAnimations({ resumeIdle = false } = {}) {
  for (const rig of Array.from(ACTIVE_RIGS)) {
    if (!rig.root?.isConnected) {
      ACTIVE_RIGS.delete(rig);
      continue;
    }
    const st = getRigState(rig);
    const savedIdle = st.idleClip;
    resetRigToRest(rig);
    if (resumeIdle && savedIdle && !rig.root.classList.contains("mf-unit-dim")) {
      startIdle(rig, savedIdle);
    }
  }
}

/** Start (or restart) the looping idle clip on a rig. */
export function startIdle(rig, idleClipOrName = "idle", opts = {}) {
  if (!rig || rig.mode !== "rig") return Promise.resolve(false);
  const clip = typeof idleClipOrName === "string" ? getRegisteredClip(idleClipOrName) : idleClipOrName;
  if (!clip) return Promise.resolve(false);
  const st = getRigState(rig);
  st.idleClip = clip;
  if (prefersReducedMotion()) {
    resetRigToRest(rig);
    return Promise.resolve(true);
  }
  return playClip(rig, clip, {
    ...opts,
    loop: true,
    blendInMs: opts.blendInMs ?? clip.blendInMs ?? 120,
    returnToIdle: false,
    ignoreToken: true,
  });
}

/**
 * Play a data-driven animation clip on a hero rig.
 *
 * @param {object} rig - Handle returned by `buildHeroRig`.
 * @param {object|string} clipOrName - Clip definition object or registered clip name.
 * @param {object} [opts]
 * @param {number} [opts.token] - Combat FX token for cancellation checks.
 * @param {boolean} [opts.ignoreToken] - Ignore global `fxToken` (used for idle loop).
 * @param {boolean} [opts.loop] - Override clip.loop.
 * @param {boolean} [opts.hold] - Keep end pose instead of blending back to idle.
 * @param {number} [opts.blendInMs] - Blend-in duration in ms (before `fxMs` scaling).
 * @param {boolean} [opts.returnToIdle] - Auto-blend back to stored idle clip on finish (default true for non-loop, non-hold clips).
 * @param {number} [opts.durationScale] - Optional multiplier on clip duration.
 * @returns {Promise<boolean>} Resolves `true` if clip completed, `false` if cancelled/skipped.
 */
export function playClip(rig, clipOrName, opts = {}) {
  if (!rig || rig.mode !== "rig" || !rig.root?.isConnected) {
    return Promise.resolve(false);
  }

  const clip = typeof clipOrName === "string" ? getRegisteredClip(clipOrName) : clipOrName;
  if (!clip || !clip.bones) {
    return Promise.resolve(false);
  }

  const token = opts.token;
  const checkToken = () => {
    if (opts.ignoreToken) return true;
    if (token !== undefined) return token === _getFxToken();
    return true;
  };

  if (!checkToken()) return Promise.resolve(false);

  ACTIVE_RIGS.add(rig);
  const st = getRigState(rig);
  const loop = opts.loop ?? !!clip.loop;
  const hold = opts.hold ?? !!clip.hold;
  const returnToIdle = opts.returnToIdle ?? (!loop && !hold);
  const reduced = prefersReducedMotion();

  // Reduced motion: skip looping motion; compress one-shot clips cleanly.
  if (reduced && loop) {
    resetRigToRest(rig);
    return Promise.resolve(true);
  }

  const [canvasW, canvasH] = rig.canvas || [512, 512];
  const prevPoses = captureCurrentPoses(rig, st);

  st.runId += 1;
  const myRunId = st.runId;
  clearRigTimers(st);
  cancelRigAnimations(st);

  const rawDuration = Math.max(40, (Number(clip.durationMs) || 300) * (opts.durationScale ?? 1));
  const scaledDuration = reduced ? Math.min(80, _fxMs(rawDuration)) : loop ? rawDuration : _fxMs(rawDuration);
  const rawBlendIn = opts.blendInMs ?? clip.blendInMs ?? (loop ? 120 : 55);
  const scaledBlendIn = reduced || rawBlendIn <= 0 ? 0 : Math.min(_fxMs(rawBlendIn), Math.round(scaledDuration * 0.45));
  const totalDuration = loop ? scaledDuration : scaledDuration + scaledBlendIn;
  const blendFrac = !loop && totalDuration > 0 ? scaledBlendIn / totalDuration : 0;

  const builtTracks = new Map();
  const animatedBones = new Set();

  // Build WAAPI keyframes for every bone present in both clip and rig.
  for (const [boneName, rawKeys] of Object.entries(clip.bones)) {
    const boneEl = rig.bones[boneName];
    if (!boneEl || !Array.isArray(rawKeys) || !rawKeys.length) continue;

    const rest = restPoseForBone(rig, boneName);
    const startPose = prevPoses.get(boneName) || rest;
    const sorted = rawKeys
      .map((kf) => normalizeKeyframe(kf, rest.opacity))
      .sort((a, b) => a.t - b.t);

    const track = [];
    if (!loop && blendFrac > 0.001) {
      track.push({ ...startPose, t: 0, easing: "ease-out" });
      for (const kf of sorted) {
        const mappedT = blendFrac + kf.t * (1 - blendFrac);
        track.push({ ...kf, t: Math.min(1, mappedT) });
      }
    } else {
      if (sorted[0].t > 0) {
        track.push({ ...startPose, t: 0, easing: sorted[0].easing || "ease-out" });
      }
      for (const kf of sorted) track.push(kf);
      if (track[track.length - 1].t < 1) {
        track.push({ ...track[track.length - 1], t: 1 });
      }
    }

    builtTracks.set(boneName, track);
    animatedBones.add(boneName);

    const waapiFrames = track.map((kf) => {
      const frame = {
        offset: kf.t,
        transform: poseToTransform(kf, canvasW, canvasH),
        opacity: kf.opacity,
      };
      if (kf.easing) frame.easing = kf.easing;
      return frame;
    });

    try {
      const anim = boneEl.animate(waapiFrames, {
        duration: totalDuration,
        iterations: loop ? Infinity : 1,
        fill: loop ? "none" : "forwards",
        easing: "linear",
      });
      st.activeAnims.set(boneName, anim);
    } catch {
      // Fallback for environments without WAAPI
      const endPose = track[track.length - 1];
      boneEl.style.transform = poseToTransform(endPose, canvasW, canvasH);
      boneEl.style.opacity = String(endPose.opacity);
    }
  }

  // Smoothly return any bone displaced by the previous clip (but untouched by this clip) to rest.
  const relaxDur = Math.max(60, scaledBlendIn || _fxMs(80));
  for (const [boneName, prevPose] of prevPoses.entries()) {
    if (animatedBones.has(boneName)) continue;
    const boneEl = rig.bones[boneName];
    if (!boneEl) continue;
    const rest = restPoseForBone(rig, boneName);
    if (poseEqualsRest(prevPose, rest)) {
      boneEl.style.transform = "";
      boneEl.style.opacity = rest.opacity === 1 ? "" : String(rest.opacity);
      continue;
    }
    try {
      const anim = boneEl.animate(
        [
          { transform: poseToTransform(prevPose, canvasW, canvasH), opacity: prevPose.opacity },
          { transform: poseToTransform(rest, canvasW, canvasH), opacity: rest.opacity },
        ],
        { duration: relaxDur, iterations: 1, fill: "none", easing: "ease-out" }
      );
      st.activeAnims.set(boneName, anim);
      anim.onfinish = () => {
        if (st.runId === myRunId) {
          boneEl.style.transform = "";
          boneEl.style.opacity = rest.opacity === 1 ? "" : String(rest.opacity);
          st.poses.delete(boneName);
        }
      };
    } catch {
      boneEl.style.transform = "";
      boneEl.style.opacity = rest.opacity === 1 ? "" : String(rest.opacity);
    }
  }

  st.activeClip = {
    clip,
    tracks: builtTracks,
    startTime: performance.now(),
    durationMs: totalDuration,
    loop,
  };

  if (loop) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const tid = setTimeout(() => {
      st.pendingTimers.delete(tid);
      if (st.runId !== myRunId) {
        resolve(false);
        return;
      }
      if (!checkToken()) {
        resetRigToRest(rig);
        resolve(false);
        return;
      }

      // Commit final logical poses so next clip or idle blends smoothly from here.
      for (const [boneName, track] of builtTracks.entries()) {
        const endPose = track[track.length - 1];
        st.poses.set(boneName, { ...endPose });
        if (hold) {
          const boneEl = rig.bones[boneName];
          if (boneEl) {
            boneEl.style.transform = poseToTransform(endPose, canvasW, canvasH);
            boneEl.style.opacity = String(endPose.opacity);
          }
        }
      }

      if (hold) {
        cancelRigAnimations(st);
        st.activeClip = null;
        resolve(true);
        return;
      }

      if (returnToIdle && st.idleClip) {
        startIdle(rig, st.idleClip, { blendInMs: clip.blendOutMs ?? 110 });
      } else {
        resetRigToRest(rig);
      }
      resolve(true);
    }, totalDuration + 8);
    st.pendingTimers.add(tid);
  });
}
