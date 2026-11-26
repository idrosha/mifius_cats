/**
 * Complete universal + 6-role cut-out animation clip library for Mythfel ("котики").
 *
 * Coordinate convention (native art faces LEFT, 512×512 logical canvas, pelvis = [256, 300]):
 * - `x < 0` moves forward (left toward enemy); `x > 0` moves backward (right).
 * - `y < 0` moves up; `y > 0` moves down.
 * - `rot > 0` = clockwise:
 *     - torso/head: `+rot` leans back/up, `-rot` leans forward/down.
 *     - hanging arms/legs: `+rot` swings forward/up (6→9→12 o'clock), `-rot` swings back (6→3 o'clock).
 * - Missing bones in a hero's `rig.json` are safely ignored by the engine.
 */

export const HERO_CLIPS = Object.freeze({
  /* =========================================================================
   * 1. COMMON CLIPS (ALL 6 ROLES)
   * ========================================================================= */

  idle: {
    durationMs: 2800,
    loop: true,
    blendInMs: 140,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0, easing: "ease-in-out" },
        { t: 0.5, y: 3, rot: -0.8, easing: "ease-in-out" },
        { t: 1, y: 0, rot: 0 },
      ],
      torso: [
        { t: 0, y: 0, rot: 0, scaleY: 1, easing: "ease-in-out" },
        { t: 0.5, y: -3.5, rot: 1.4, scaleY: 1.022, easing: "ease-in-out" },
        { t: 1, y: 0, rot: 0, scaleY: 1 },
      ],
      head: [
        { t: 0, rot: 0, y: 0, easing: "ease-in-out" },
        { t: 0.45, rot: -1.6, y: -1.5, easing: "ease-in-out" },
        { t: 0.85, rot: 1.2, y: 0.5, easing: "ease-in-out" },
        { t: 1, rot: 0, y: 0 },
      ],
      ear_front: [
        { t: 0, rot: 0 },
        { t: 0.62, rot: 0 },
        { t: 0.66, rot: -7, easing: "ease-out" },
        { t: 0.71, rot: 0, easing: "ease-in" },
        { t: 1, rot: 0 },
      ],
      ear_back: [
        { t: 0, rot: 0 },
        { t: 0.64, rot: 0 },
        { t: 0.68, rot: 6, easing: "ease-out" },
        { t: 0.73, rot: 0, easing: "ease-in" },
        { t: 1, rot: 0 },
      ],
      eyes_open: [
        { t: 0, opacity: 1 },
        { t: 0.77, opacity: 1 },
        { t: 0.79, opacity: 0 },
        { t: 0.84, opacity: 0 },
        { t: 0.86, opacity: 1 },
        { t: 1, opacity: 1 },
      ],
      eyes_closed: [
        { t: 0, opacity: 0 },
        { t: 0.77, opacity: 0 },
        { t: 0.79, opacity: 1 },
        { t: 0.84, opacity: 1 },
        { t: 0.86, opacity: 0 },
        { t: 1, opacity: 0 },
      ],
      tail: [
        { t: 0, rot: -6, easing: "ease-in-out" },
        { t: 0.35, rot: 8, easing: "ease-in-out" },
        { t: 0.7, rot: -4, easing: "ease-in-out" },
        { t: 1, rot: -6 },
      ],
      cape: [
        { t: 0, rot: -2, scaleX: 1, easing: "ease-in-out" },
        { t: 0.5, rot: 4, scaleX: 1.03, easing: "ease-in-out" },
        { t: 1, rot: -2, scaleX: 1 },
      ],
      arm_front_up: [
        { t: 0, rot: 0, easing: "ease-in-out" },
        { t: 0.5, rot: -2.5, easing: "ease-in-out" },
        { t: 1, rot: 0 },
      ],
      arm_back_up: [
        { t: 0, rot: 0, easing: "ease-in-out" },
        { t: 0.5, rot: 2.5, easing: "ease-in-out" },
        { t: 1, rot: 0 },
      ],
    },
  },

  walk: {
    durationMs: 720,
    loop: true,
    blendInMs: 90,
    bones: {
      pelvis: [
        { t: 0, y: 2, rot: -2, easing: "ease-in-out" },
        { t: 0.25, y: -5, rot: 0, easing: "ease-in-out" },
        { t: 0.5, y: 2, rot: -2, easing: "ease-in-out" },
        { t: 0.75, y: -5, rot: 0, easing: "ease-in-out" },
        { t: 1, y: 2, rot: -2 },
      ],
      torso: [
        { t: 0, rot: -4, easing: "ease-in-out" },
        { t: 0.5, rot: -2, easing: "ease-in-out" },
        { t: 1, rot: -4 },
      ],
      head: [
        { t: 0, rot: 3, easing: "ease-in-out" },
        { t: 0.5, rot: 1, easing: "ease-in-out" },
        { t: 1, rot: 3 },
      ],
      leg_front_up: [
        { t: 0, rot: 22, easing: "ease-in-out" },
        { t: 0.5, rot: -20, easing: "ease-in-out" },
        { t: 1, rot: 22 },
      ],
      leg_front_low: [
        { t: 0, rot: -10, easing: "ease-in-out" },
        { t: 0.25, rot: -26, easing: "ease-in-out" },
        { t: 0.5, rot: -8, easing: "ease-in-out" },
        { t: 1, rot: -10 },
      ],
      leg_back_up: [
        { t: 0, rot: -20, easing: "ease-in-out" },
        { t: 0.5, rot: 22, easing: "ease-in-out" },
        { t: 1, rot: -20 },
      ],
      leg_back_low: [
        { t: 0, rot: -8, easing: "ease-in-out" },
        { t: 0.75, rot: -26, easing: "ease-in-out" },
        { t: 1, rot: -8 },
      ],
      arm_front_up: [
        { t: 0, rot: -16, easing: "ease-in-out" },
        { t: 0.5, rot: 18, easing: "ease-in-out" },
        { t: 1, rot: -16 },
      ],
      arm_back_up: [
        { t: 0, rot: 18, easing: "ease-in-out" },
        { t: 0.5, rot: -16, easing: "ease-in-out" },
        { t: 1, rot: 18 },
      ],
      tail: [
        { t: 0, rot: 10, easing: "ease-in-out" },
        { t: 0.5, rot: -10, easing: "ease-in-out" },
        { t: 1, rot: 10 },
      ],
      cape: [
        { t: 0, rot: -10, easing: "ease-in-out" },
        { t: 0.5, rot: -4, easing: "ease-in-out" },
        { t: 1, rot: -10 },
      ],
    },
  },

  run: {
    durationMs: 460,
    loop: true,
    blendInMs: 70,
    bones: {
      pelvis: [
        { t: 0, y: 6, rot: -6, easing: "ease-out" },
        { t: 0.25, y: -12, rot: -3, easing: "ease-in" },
        { t: 0.5, y: 6, rot: -6, easing: "ease-out" },
        { t: 0.75, y: -12, rot: -3, easing: "ease-in" },
        { t: 1, y: 6, rot: -6 },
      ],
      torso: [
        { t: 0, rot: -12, easing: "ease-in-out" },
        { t: 0.5, rot: -9, easing: "ease-in-out" },
        { t: 1, rot: -12 },
      ],
      head: [
        { t: 0, rot: 10, easing: "ease-in-out" },
        { t: 0.5, rot: 7, easing: "ease-in-out" },
        { t: 1, rot: 10 },
      ],
      leg_front_up: [
        { t: 0, rot: 38, easing: "ease-in-out" },
        { t: 0.5, rot: -34, easing: "ease-in-out" },
        { t: 1, rot: 38 },
      ],
      leg_front_low: [
        { t: 0, rot: -18, easing: "ease-in-out" },
        { t: 0.3, rot: -48, easing: "ease-in-out" },
        { t: 0.5, rot: -12, easing: "ease-in-out" },
        { t: 1, rot: -18 },
      ],
      leg_back_up: [
        { t: 0, rot: -34, easing: "ease-in-out" },
        { t: 0.5, rot: 38, easing: "ease-in-out" },
        { t: 1, rot: -34 },
      ],
      leg_back_low: [
        { t: 0, rot: -12, easing: "ease-in-out" },
        { t: 0.8, rot: -48, easing: "ease-in-out" },
        { t: 1, rot: -12 },
      ],
      arm_front_up: [
        { t: 0, rot: -30, easing: "ease-in-out" },
        { t: 0.5, rot: 34, easing: "ease-in-out" },
        { t: 1, rot: -30 },
      ],
      arm_back_up: [
        { t: 0, rot: 34, easing: "ease-in-out" },
        { t: 0.5, rot: -30, easing: "ease-in-out" },
        { t: 1, rot: 34 },
      ],
      tail: [
        { t: 0, rot: -22, easing: "ease-in-out" },
        { t: 0.5, rot: -12, easing: "ease-in-out" },
        { t: 1, rot: -22 },
      ],
      cape: [
        { t: 0, rot: -26, scaleX: 1.08, easing: "ease-in-out" },
        { t: 0.5, rot: -18, scaleX: 1.04, easing: "ease-in-out" },
        { t: 1, rot: -26, scaleX: 1.08 },
      ],
    },
  },

  hit: {
    durationMs: 340,
    blendInMs: 25,
    blendOutMs: 90,
    bones: {
      root: [
        { t: 0, opacity: 1 },
        { t: 0.18, opacity: 0.62, easing: "ease-out" },
        { t: 0.42, opacity: 1, easing: "ease-in" },
        { t: 1, opacity: 1 },
      ],
      pelvis: [
        { t: 0, x: 0, y: 0, rot: 0, easing: "cubic-bezier(0.15, 0.9, 0.3, 1)" },
        { t: 0.25, x: 18, y: 4, rot: 9, easing: "ease-out" },
        { t: 0.65, x: 6, y: 2, rot: 3, easing: "ease-in-out" },
        { t: 1, x: 0, y: 0, rot: 0 },
      ],
      torso: [
        { t: 0, rot: 0, easing: "cubic-bezier(0.15, 0.9, 0.3, 1)" },
        { t: 0.24, rot: 16, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      head: [
        { t: 0, rot: 0, easing: "ease-out" },
        { t: 0.28, rot: 22, easing: "ease-in-out" },
        { t: 1, rot: 0 },
      ],
      eyes_open: [
        { t: 0, opacity: 1 },
        { t: 0.1, opacity: 0 },
        { t: 0.6, opacity: 0 },
        { t: 0.75, opacity: 1 },
      ],
      eyes_closed: [
        { t: 0, opacity: 0 },
        { t: 0.1, opacity: 1 },
        { t: 0.6, opacity: 1 },
        { t: 0.75, opacity: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 0.26, rot: -24, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 0.26, rot: 22, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      tail: [
        { t: 0, rot: 0 },
        { t: 0.3, rot: -26, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
    },
  },

  death: {
    durationMs: 780,
    hold: true,
    blendInMs: 40,
    bones: {
      root: [
        { t: 0, opacity: 1 },
        { t: 0.65, opacity: 0.92 },
        { t: 1, opacity: 0.58, easing: "ease-out" },
      ],
      pelvis: [
        { t: 0, x: 0, y: 0, rot: 0, easing: "ease-out" },
        { t: 0.25, x: 16, y: 8, rot: 14, easing: "cubic-bezier(0.55, 0.05, 0.85, 0.2)" },
        { t: 0.75, x: 36, y: 88, rot: 78, easing: "ease-out" },
        { t: 0.88, x: 38, y: 82, rot: 74, easing: "ease-in" },
        { t: 1, x: 40, y: 88, rot: 82 },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 0.28, rot: 18, easing: "ease-in" },
        { t: 0.8, rot: 10, easing: "ease-out" },
        { t: 1, rot: 8 },
      ],
      head: [
        { t: 0, rot: 0 },
        { t: 0.3, rot: 20 },
        { t: 0.85, rot: -14, easing: "ease-out" },
        { t: 1, rot: -10 },
      ],
      eyes_open: [
        { t: 0, opacity: 1 },
        { t: 0.2, opacity: 0 },
        { t: 1, opacity: 0 },
      ],
      eyes_closed: [
        { t: 0, opacity: 0 },
        { t: 0.2, opacity: 1 },
        { t: 1, opacity: 1 },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 0.75, rot: -38, easing: "ease-out" },
        { t: 1, rot: -32 },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 0.75, rot: 28, easing: "ease-out" },
        { t: 1, rot: 22 },
      ],
      leg_front_up: [
        { t: 0, rot: 0 },
        { t: 0.78, rot: 18, easing: "ease-out" },
        { t: 1, rot: 14 },
      ],
      leg_back_up: [
        { t: 0, rot: 0 },
        { t: 0.78, rot: -16, easing: "ease-out" },
        { t: 1, rot: -12 },
      ],
      tail: [
        { t: 0, rot: 0 },
        { t: 1, rot: -35, easing: "ease-out" },
      ],
    },
  },

  victory: {
    durationMs: 900,
    blendInMs: 80,
    blendOutMs: 120,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0, easing: "ease-in" },
        { t: 0.16, y: 14, rot: -4, easing: "cubic-bezier(0.2, 0.85, 0.3, 1)" },
        { t: 0.44, y: -34, rot: 4, easing: "ease-in" },
        { t: 0.72, y: 6, rot: -2, easing: "ease-out" },
        { t: 1, y: 0, rot: 0 },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 0.16, rot: -8 },
        { t: 0.44, rot: 8, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      head: [
        { t: 0, rot: 0 },
        { t: 0.44, rot: 10, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      ear_front: [
        { t: 0, rot: 0 },
        { t: 0.44, rot: -10 },
        { t: 1, rot: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 0.18, rot: -18 },
        { t: 0.46, rot: 136, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        { t: 0.74, rot: 120, easing: "ease-in-out" },
        { t: 1, rot: 0 },
      ],
      arm_front_low: [
        { t: 0, rot: 0 },
        { t: 0.46, rot: 16 },
        { t: 1, rot: 0 },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 0.46, rot: 112, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      tail: [
        { t: 0, rot: 0 },
        { t: 0.44, rot: 22, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
    },
  },

  defeat: {
    durationMs: 720,
    hold: true,
    blendInMs: 90,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0 },
        { t: 1, y: 16, rot: -4, easing: "ease-out" },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 1, rot: -14, easing: "ease-out" },
      ],
      head: [
        { t: 0, rot: 0 },
        { t: 1, rot: -22, easing: "ease-out" },
      ],
      eyes_open: [
        { t: 0, opacity: 1 },
        { t: 0.4, opacity: 0 },
        { t: 1, opacity: 0 },
      ],
      eyes_closed: [
        { t: 0, opacity: 0 },
        { t: 0.4, opacity: 1 },
        { t: 1, opacity: 1 },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: -14, easing: "ease-out" },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: -10, easing: "ease-out" },
      ],
      tail: [
        { t: 0, rot: 0 },
        { t: 1, rot: -28, easing: "ease-out" },
      ],
    },
  },

  /* =========================================================================
   * 2. TANK CLIPS (weapon_main = mace/sword, weapon_off = shield)
   * ========================================================================= */

  tank_block: {
    durationMs: 520,
    blendInMs: 45,
    blendOutMs: 110,
    bones: {
      pelvis: [
        { t: 0, x: 0, y: 0, rot: 0, easing: "ease-out" },
        { t: 0.22, x: -4, y: 12, rot: -3, easing: "ease-out" },
        { t: 0.46, x: 14, y: 14, rot: 6, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        { t: 0.72, x: 4, y: 10, rot: 1, easing: "ease-in-out" },
        { t: 1, x: 0, y: 0, rot: 0 },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 0.22, rot: -8, easing: "ease-out" },
        { t: 0.46, rot: 6, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 0.2, rot: 64, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        { t: 0.46, rot: 54, easing: "ease-out" },
        { t: 0.74, rot: 62, easing: "ease-in-out" },
        { t: 1, rot: 0 },
      ],
      arm_back_low: [
        { t: 0, rot: 0 },
        { t: 0.2, rot: 26, easing: "ease-out" },
        { t: 0.74, rot: 22 },
        { t: 1, rot: 0 },
      ],
      weapon_off: [
        { t: 0, x: 0, y: 0, rot: 0, scale: 1 },
        { t: 0.2, x: -16, y: -10, rot: -12, scale: 1.08, easing: "ease-out" },
        { t: 0.46, x: -4, y: -6, rot: -2, scale: 1.12, easing: "ease-out" },
        { t: 1, x: 0, y: 0, rot: 0, scale: 1 },
      ],
      leg_front_up: [
        { t: 0, rot: 0 },
        { t: 0.22, rot: 18, easing: "ease-out" },
        { t: 0.74, rot: 14 },
        { t: 1, rot: 0 },
      ],
      leg_back_up: [
        { t: 0, rot: 0 },
        { t: 0.22, rot: -22, easing: "ease-out" },
        { t: 0.74, rot: -18 },
        { t: 1, rot: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 0.25, rot: -18, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
    },
  },

  tank_melee_windup: {
    durationMs: 240,
    blendInMs: 45,
    hold: true,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0 },
        { t: 1, y: 14, rot: 6, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 1, rot: 18, easing: "ease-out" },
      ],
      head: [
        { t: 0, rot: 0 },
        { t: 1, rot: -10, easing: "ease-out" },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: -62, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
      ],
      arm_front_low: [
        { t: 0, rot: 0 },
        { t: 1, rot: -24, easing: "ease-out" },
      ],
      weapon_main: [
        { t: 0, rot: 0 },
        { t: 1, rot: -28, easing: "ease-out" },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: 36, easing: "ease-out" },
      ],
    },
  },

  tank_melee_strike: {
    durationMs: 300,
    blendInMs: 20,
    blendOutMs: 110,
    bones: {
      pelvis: [
        { t: 0, x: 0, y: 14, rot: 6 },
        { t: 0.36, x: -16, y: 8, rot: -10, easing: "cubic-bezier(0.15, 0.9, 0.25, 1)" },
        { t: 0.56, x: -18, y: 12, rot: -12, easing: "ease-out" },
        { t: 1, x: 0, y: 0, rot: 0, easing: "ease-in-out" },
      ],
      torso: [
        { t: 0, rot: 18 },
        { t: 0.36, rot: -22, easing: "cubic-bezier(0.12, 0.95, 0.25, 1)" },
        { t: 0.58, rot: -26, easing: "ease-out" },
        { t: 1, rot: 0, easing: "ease-in-out" },
      ],
      arm_front_up: [
        { t: 0, rot: -62 },
        { t: 0.36, rot: 86, easing: "cubic-bezier(0.12, 0.95, 0.22, 1)" },
        { t: 0.58, rot: 98, easing: "ease-out" },
        { t: 1, rot: 0, easing: "ease-in-out" },
      ],
      arm_front_low: [
        { t: 0, rot: -24 },
        { t: 0.36, rot: 16, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      weapon_main: [
        { t: 0, rot: -28 },
        { t: 0.36, rot: 34, easing: "cubic-bezier(0.12, 0.95, 0.22, 1)" },
        { t: 0.58, rot: 42, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      arm_back_up: [
        { t: 0, rot: 36 },
        { t: 0.36, rot: -14, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      cape: [
        { t: 0, rot: 14 },
        { t: 0.45, rot: -24, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
    },
  },

  tank_taunt: {
    durationMs: 640,
    blendInMs: 50,
    blendOutMs: 120,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0 },
        { t: 0.22, y: 12, rot: -4, easing: "ease-out" },
        { t: 0.52, y: -8, rot: 6, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        { t: 0.78, y: -4, rot: 4 },
        { t: 1, y: 0, rot: 0, easing: "ease-in-out" },
      ],
      torso: [
        { t: 0, rot: 0, scaleX: 1, scaleY: 1 },
        { t: 0.22, rot: -8, scaleX: 1.04, scaleY: 0.96 },
        { t: 0.52, rot: 12, scaleX: 1.07, scaleY: 1.05, easing: "ease-out" },
        { t: 1, rot: 0, scaleX: 1, scaleY: 1 },
      ],
      head: [
        { t: 0, rot: 0 },
        { t: 0.52, rot: 16, easing: "ease-out" },
        { t: 0.78, rot: 14 },
        { t: 1, rot: 0 },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 0.24, rot: 46 },
        { t: 0.46, rot: 74, easing: "cubic-bezier(0.15, 0.95, 0.25, 1)" },
        { t: 0.62, rot: 56 },
        { t: 0.76, rot: 72 },
        { t: 1, rot: 0 },
      ],
      weapon_off: [
        { t: 0, x: 0, scale: 1 },
        { t: 0.46, x: -18, scale: 1.12, easing: "ease-out" },
        { t: 0.76, x: -16, scale: 1.1 },
        { t: 1, x: 0, scale: 1 },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 0.52, rot: 118, easing: "ease-out" },
        { t: 0.78, rot: 110 },
        { t: 1, rot: 0 },
      ],
    },
  },

  /* =========================================================================
   * 3. FIGHTER CLIPS (weapon_main = sword/axe)
   * ========================================================================= */

  fighter_melee_windup: {
    durationMs: 200,
    blendInMs: 40,
    hold: true,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0 },
        { t: 1, y: 12, rot: 5, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 1, rot: 14, easing: "ease-out" },
      ],
      head: [
        { t: 0, rot: 0 },
        { t: 1, rot: -8, easing: "ease-out" },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: 148, easing: "cubic-bezier(0.25, 0.85, 0.3, 1)" },
      ],
      arm_front_low: [
        { t: 0, rot: 0 },
        { t: 1, rot: -26, easing: "ease-out" },
      ],
      weapon_main: [
        { t: 0, rot: 0 },
        { t: 1, rot: -32, easing: "ease-out" },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: 26, easing: "ease-out" },
      ],
      leg_front_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: 16, easing: "ease-out" },
      ],
    },
  },

  fighter_melee_strike: {
    durationMs: 260,
    blendInMs: 18,
    blendOutMs: 100,
    bones: {
      pelvis: [
        { t: 0, x: 0, y: 12, rot: 5 },
        { t: 0.38, x: -16, y: 4, rot: -10, easing: "cubic-bezier(0.12, 0.96, 0.2, 1)" },
        { t: 0.62, x: -18, y: 8, rot: -12, easing: "ease-out" },
        { t: 1, x: 0, y: 0, rot: 0, easing: "ease-in-out" },
      ],
      torso: [
        { t: 0, rot: 14 },
        { t: 0.38, rot: -24, easing: "cubic-bezier(0.12, 0.96, 0.2, 1)" },
        { t: 0.62, rot: -28, easing: "ease-out" },
        { t: 1, rot: 0, easing: "ease-in-out" },
      ],
      arm_front_up: [
        { t: 0, rot: 148 },
        { t: 0.38, rot: 26, easing: "cubic-bezier(0.1, 0.96, 0.2, 1)" },
        { t: 0.62, rot: 10, easing: "ease-out" },
        { t: 1, rot: 0, easing: "ease-in-out" },
      ],
      arm_front_low: [
        { t: 0, rot: -26 },
        { t: 0.38, rot: 14, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      weapon_main: [
        { t: 0, rot: -32 },
        { t: 0.38, rot: 36, easing: "cubic-bezier(0.1, 0.96, 0.2, 1)" },
        { t: 0.62, rot: 46, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      arm_back_up: [
        { t: 0, rot: 26 },
        { t: 0.38, rot: -28, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      cape: [
        { t: 0, rot: 12 },
        { t: 0.45, rot: -26, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
    },
  },

  fighter_leap_attack: {
    durationMs: 460,
    blendInMs: 35,
    blendOutMs: 100,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0 },
        { t: 0.18, y: 18, rot: -8, easing: "ease-in" },
        { t: 0.52, y: -26, rot: -14, easing: "ease-out" },
        { t: 0.78, y: 12, rot: -10, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        { t: 1, y: 0, rot: 0, easing: "ease-in-out" },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 0.18, rot: -10 },
        { t: 0.5, rot: 16, easing: "ease-out" },
        { t: 0.78, rot: -26, easing: "cubic-bezier(0.12, 0.96, 0.2, 1)" },
        { t: 1, rot: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 0.5, rot: 156, easing: "ease-out" },
        { t: 0.78, rot: 16, easing: "cubic-bezier(0.1, 0.96, 0.2, 1)" },
        { t: 1, rot: 0 },
      ],
      weapon_main: [
        { t: 0, rot: 0 },
        { t: 0.5, rot: -34 },
        { t: 0.78, rot: 42, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      leg_front_up: [
        { t: 0, rot: 0 },
        { t: 0.5, rot: 36, easing: "ease-out" },
        { t: 0.78, rot: 12 },
        { t: 1, rot: 0 },
      ],
      leg_back_up: [
        { t: 0, rot: 0 },
        { t: 0.5, rot: -32, easing: "ease-out" },
        { t: 0.78, rot: -14 },
        { t: 1, rot: 0 },
      ],
    },
  },

  /* =========================================================================
   * 4. ASSASSIN CLIPS (weapon_main = dagger 1, weapon_off = dagger 2)
   * ========================================================================= */

  assassin_leap_backline: {
    durationMs: 360,
    blendInMs: 30,
    hold: true,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0 },
        { t: 0.22, y: 20, rot: -12, easing: "ease-in" },
        { t: 0.65, y: -22, rot: -22, easing: "ease-out" },
        { t: 1, y: -4, rot: -14, easing: "ease-in" },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 0.22, rot: -16 },
        { t: 0.65, rot: -24, easing: "ease-out" },
        { t: 1, rot: -18 },
      ],
      head: [
        { t: 0, rot: 0 },
        { t: 0.65, rot: 18 },
        { t: 1, rot: 14 },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 0.65, rot: -46, easing: "ease-out" },
        { t: 1, rot: -36 },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 0.65, rot: -38, easing: "ease-out" },
        { t: 1, rot: -28 },
      ],
      leg_front_up: [
        { t: 0, rot: 0 },
        { t: 0.65, rot: 46, easing: "ease-out" },
        { t: 1, rot: 26 },
      ],
      leg_front_low: [
        { t: 0, rot: 0 },
        { t: 0.65, rot: -52 },
        { t: 1, rot: -28 },
      ],
      leg_back_up: [
        { t: 0, rot: 0 },
        { t: 0.65, rot: -36 },
        { t: 1, rot: -18 },
      ],
      cape: [
        { t: 0, rot: 0 },
        { t: 0.65, rot: -36, scaleX: 1.12 },
        { t: 1, rot: -26, scaleX: 1.08 },
      ],
    },
  },

  assassin_double_slash: {
    durationMs: 320,
    blendInMs: 20,
    blendOutMs: 85,
    bones: {
      pelvis: [
        { t: 0, x: 0, y: 4, rot: -10 },
        { t: 0.25, x: -14, y: 6, rot: -14, easing: "cubic-bezier(0.15, 0.95, 0.25, 1)" },
        { t: 0.62, x: -20, y: 2, rot: -8, easing: "cubic-bezier(0.15, 0.95, 0.25, 1)" },
        { t: 1, x: 0, y: 0, rot: 0, easing: "ease-out" },
      ],
      torso: [
        { t: 0, rot: -14 },
        { t: 0.25, rot: -24, easing: "ease-out" },
        { t: 0.62, rot: 10, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: -42 },
        { t: 0.26, rot: 112, easing: "cubic-bezier(0.1, 0.96, 0.2, 1)" },
        { t: 0.52, rot: 92 },
        { t: 0.72, rot: -24, easing: "ease-in" },
        { t: 1, rot: 0 },
      ],
      weapon_main: [
        { t: 0, rot: -24 },
        { t: 0.26, rot: 44, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      arm_back_up: [
        { t: 0, rot: -24 },
        { t: 0.34, rot: -48, easing: "ease-in" },
        { t: 0.64, rot: 118, easing: "cubic-bezier(0.1, 0.96, 0.2, 1)" },
        { t: 0.82, rot: 84, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      weapon_off: [
        { t: 0, rot: -16 },
        { t: 0.64, rot: 46, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      tail: [
        { t: 0, rot: -22 },
        { t: 0.5, rot: 18, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
    },
  },

  assassin_backflip: {
    durationMs: 300,
    blendInMs: 25,
    blendOutMs: 80,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0, easing: "ease-out" },
        { t: 0.2, y: -22, rot: 90, easing: "linear" },
        { t: 0.5, y: -42, rot: 210, easing: "linear" },
        { t: 0.8, y: -14, rot: 330, easing: "ease-out" },
        { t: 1, y: 0, rot: 360 },
      ],
      leg_front_up: [
        { t: 0, rot: 0 },
        { t: 0.45, rot: 54, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      leg_back_up: [
        { t: 0, rot: 0 },
        { t: 0.45, rot: 44, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 0.45, rot: 52 },
        { t: 1, rot: 0 },
      ],
      cape: [
        { t: 0, rot: 0 },
        { t: 0.5, rot: 32 },
        { t: 1, rot: 0 },
      ],
    },
  },

  /* =========================================================================
   * 5. RANGER CLIPS (weapon_main = bow, weapon_off = arrow, back_prop = quiver)
   * ========================================================================= */

  ranger_bow_draw: {
    durationMs: 240,
    blendInMs: 45,
    hold: true,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0 },
        { t: 1, y: 6, rot: 4, easing: "ease-out" },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 1, rot: 6, easing: "ease-out" },
      ],
      head: [
        { t: 0, rot: 0 },
        { t: 1, rot: -5, easing: "ease-out" },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: 86, easing: "cubic-bezier(0.2, 0.85, 0.3, 1)" },
      ],
      arm_front_low: [
        { t: 0, rot: 0 },
        { t: 1, rot: 4, easing: "ease-out" },
      ],
      weapon_main: [
        { t: 0, rot: 0, scaleX: 1 },
        { t: 1, rot: -6, scaleX: 0.94, easing: "ease-out" },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 0.35, rot: -42, easing: "ease-in" },
        { t: 1, rot: -18, x: 14, y: -14, easing: "ease-out" },
      ],
      arm_back_low: [
        { t: 0, rot: 0 },
        { t: 1, rot: 74, easing: "ease-out" },
      ],
      weapon_off: [
        { t: 0, opacity: 0, x: 0 },
        { t: 0.3, opacity: 1, x: 0 },
        { t: 1, opacity: 1, x: 18, easing: "ease-out" },
      ],
      back_prop: [
        { t: 0, rot: 0 },
        { t: 0.35, rot: 6 },
        { t: 1, rot: 2 },
      ],
    },
  },

  ranger_aim: {
    durationMs: 180,
    blendInMs: 20,
    hold: true,
    bones: {
      torso: [
        { t: 0, rot: 6 },
        { t: 0.5, rot: 7.2, easing: "ease-in-out" },
        { t: 1, rot: 6.4 },
      ],
      arm_front_up: [
        { t: 0, rot: 86 },
        { t: 0.5, rot: 87.5, easing: "ease-in-out" },
        { t: 1, rot: 86 },
      ],
      arm_back_up: [
        { t: 0, rot: -18, x: 14, y: -14 },
        { t: 1, rot: -20, x: 16, y: -14, easing: "ease-out" },
      ],
      weapon_off: [
        { t: 0, opacity: 1, x: 18 },
        { t: 1, opacity: 1, x: 20 },
      ],
    },
  },

  ranger_bow_release: {
    durationMs: 240,
    blendInMs: 15,
    blendOutMs: 110,
    bones: {
      pelvis: [
        { t: 0, x: 0, y: 6, rot: 4 },
        { t: 0.25, x: 10, y: 4, rot: 8, easing: "cubic-bezier(0.15, 0.9, 0.3, 1)" },
        { t: 1, x: 0, y: 0, rot: 0, easing: "ease-in-out" },
      ],
      torso: [
        { t: 0, rot: 6 },
        { t: 0.25, rot: 12, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: 86 },
        { t: 0.25, rot: 98, easing: "ease-out" },
        { t: 1, rot: 0, easing: "ease-in-out" },
      ],
      weapon_main: [
        { t: 0, rot: -6, scaleX: 0.94 },
        { t: 0.22, rot: 6, scaleX: 1.04, easing: "ease-out" },
        { t: 1, rot: 0, scaleX: 1 },
      ],
      arm_back_up: [
        { t: 0, rot: -20, x: 16, y: -14 },
        { t: 0.24, rot: -46, x: 22, y: -10, easing: "cubic-bezier(0.15, 0.95, 0.25, 1)" },
        { t: 1, rot: 0, x: 0, y: 0, easing: "ease-in-out" },
      ],
      weapon_off: [
        { t: 0, opacity: 1, x: 20 },
        { t: 0.08, opacity: 0, x: -30 },
        { t: 1, opacity: 0, x: 0 },
      ],
    },
  },

  /* =========================================================================
   * 6. MAGE CLIPS (weapon_main = staff, weapon_off = orb)
   * ========================================================================= */

  mage_staff_raise: {
    durationMs: 240,
    blendInMs: 45,
    hold: true,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0 },
        { t: 1, y: -6, rot: 3, easing: "ease-out" },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 1, rot: 8, easing: "ease-out" },
      ],
      head: [
        { t: 0, rot: 0 },
        { t: 1, rot: 8, easing: "ease-out" },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: 128, easing: "cubic-bezier(0.2, 0.85, 0.3, 1)" },
      ],
      arm_front_low: [
        { t: 0, rot: 0 },
        { t: 1, rot: 16, easing: "ease-out" },
      ],
      weapon_main: [
        { t: 0, rot: 0 },
        { t: 1, rot: -16, easing: "ease-out" },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: 74, easing: "ease-out" },
      ],
      weapon_off: [
        { t: 0, scale: 1, y: 0 },
        { t: 1, scale: 1.24, y: -12, easing: "ease-out" },
      ],
      cape: [
        { t: 0, rot: 0 },
        { t: 1, rot: -18, scaleX: 1.08, easing: "ease-out" },
      ],
    },
  },

  mage_cast_single: {
    durationMs: 280,
    blendInMs: 20,
    blendOutMs: 110,
    bones: {
      pelvis: [
        { t: 0, x: 0, y: -6, rot: 3 },
        { t: 0.34, x: -10, y: 2, rot: -6, easing: "cubic-bezier(0.15, 0.92, 0.25, 1)" },
        { t: 0.56, x: 8, y: 4, rot: 5, easing: "ease-out" },
        { t: 1, x: 0, y: 0, rot: 0, easing: "ease-in-out" },
      ],
      torso: [
        { t: 0, rot: 8 },
        { t: 0.34, rot: -14, easing: "cubic-bezier(0.15, 0.92, 0.25, 1)" },
        { t: 0.58, rot: 6, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: 128 },
        { t: 0.34, rot: 72, easing: "cubic-bezier(0.12, 0.95, 0.22, 1)" },
        { t: 0.6, rot: 82, easing: "ease-out" },
        { t: 1, rot: 0, easing: "ease-in-out" },
      ],
      weapon_main: [
        { t: 0, rot: -16 },
        { t: 0.34, rot: 22, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      weapon_off: [
        { t: 0, scale: 1.24, opacity: 1 },
        { t: 0.32, scale: 1.42, opacity: 1, easing: "ease-out" },
        { t: 0.6, scale: 0.95, opacity: 0.85 },
        { t: 1, scale: 1, opacity: 1 },
      ],
      cape: [
        { t: 0, rot: -18 },
        { t: 0.4, rot: -30, scaleX: 1.12, easing: "ease-out" },
        { t: 1, rot: 0, scaleX: 1 },
      ],
    },
  },

  mage_cast_aoe: {
    durationMs: 440,
    blendInMs: 25,
    blendOutMs: 120,
    bones: {
      pelvis: [
        { t: 0, y: -6, rot: 3 },
        { t: 0.32, y: -18, rot: 8, easing: "ease-out" },
        { t: 0.62, y: 12, rot: -10, easing: "cubic-bezier(0.15, 0.95, 0.25, 1)" },
        { t: 1, y: 0, rot: 0, easing: "ease-in-out" },
      ],
      torso: [
        { t: 0, rot: 8 },
        { t: 0.32, rot: 14, easing: "ease-out" },
        { t: 0.62, rot: -18, easing: "cubic-bezier(0.15, 0.95, 0.25, 1)" },
        { t: 1, rot: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: 128 },
        { t: 0.32, rot: 152, easing: "ease-out" },
        { t: 0.62, rot: 44, easing: "cubic-bezier(0.12, 0.95, 0.22, 1)" },
        { t: 1, rot: 0, easing: "ease-in-out" },
      ],
      arm_back_up: [
        { t: 0, rot: 74 },
        { t: 0.32, rot: 138, easing: "ease-out" },
        { t: 0.62, rot: 54, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      weapon_off: [
        { t: 0, scale: 1.24, y: -12 },
        { t: 0.35, scale: 1.55, y: -26, easing: "ease-out" },
        { t: 0.68, scale: 1.1, y: -4 },
        { t: 1, scale: 1, y: 0 },
      ],
      cape: [
        { t: 0, rot: -18, scaleX: 1.08 },
        { t: 0.45, rot: -36, scaleX: 1.16, easing: "ease-out" },
        { t: 1, rot: 0, scaleX: 1 },
      ],
    },
  },

  /* =========================================================================
   * 7. SUPPORT CLIPS (weapon_main = wand, weapon_off = amulet/orb)
   * ========================================================================= */

  support_wand_raise: {
    durationMs: 220,
    blendInMs: 45,
    hold: true,
    bones: {
      pelvis: [
        { t: 0, y: 0, rot: 0 },
        { t: 1, y: -6, rot: 2, easing: "ease-out" },
      ],
      torso: [
        { t: 0, rot: 0 },
        { t: 1, rot: 6, easing: "ease-out" },
      ],
      head: [
        { t: 0, rot: 0 },
        { t: 1, rot: 8, easing: "ease-out" },
      ],
      arm_front_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: 118, easing: "cubic-bezier(0.2, 0.85, 0.3, 1)" },
      ],
      arm_front_low: [
        { t: 0, rot: 0 },
        { t: 1, rot: 18, easing: "ease-out" },
      ],
      arm_back_up: [
        { t: 0, rot: 0 },
        { t: 1, rot: 94, easing: "ease-out" },
      ],
      weapon_off: [
        { t: 0, scale: 1, y: 0 },
        { t: 1, scale: 1.18, y: -8, easing: "ease-out" },
      ],
    },
  },

  support_heal_cast: {
    durationMs: 380,
    blendInMs: 25,
    blendOutMs: 120,
    bones: {
      pelvis: [
        { t: 0, y: -6, rot: 2 },
        { t: 0.42, y: -12, rot: 4, easing: "ease-in-out" },
        { t: 1, y: 0, rot: 0, easing: "ease-out" },
      ],
      torso: [
        { t: 0, rot: 6 },
        { t: 0.42, rot: 10, easing: "ease-in-out" },
        { t: 1, rot: 0 },
      ],
      head: [
        { t: 0, rot: 8 },
        { t: 0.42, rot: 12, easing: "ease-in-out" },
        { t: 1, rot: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: 118 },
        { t: 0.35, rot: 142, easing: "ease-out" },
        { t: 0.65, rot: 96, easing: "ease-in-out" },
        { t: 1, rot: 0, easing: "ease-out" },
      ],
      weapon_main: [
        { t: 0, rot: 0, scale: 1 },
        { t: 0.35, rot: -18, scale: 1.12, easing: "ease-out" },
        { t: 0.65, rot: 16, scale: 1.08, easing: "ease-in-out" },
        { t: 1, rot: 0, scale: 1 },
      ],
      arm_back_up: [
        { t: 0, rot: 94 },
        { t: 0.45, rot: 116, easing: "ease-in-out" },
        { t: 1, rot: 0 },
      ],
      weapon_off: [
        { t: 0, scale: 1.18, y: -8 },
        { t: 0.42, scale: 1.36, y: -16, easing: "ease-out" },
        { t: 1, scale: 1, y: 0 },
      ],
      cape: [
        { t: 0, rot: -6 },
        { t: 0.45, rot: -16, scaleX: 1.06, easing: "ease-out" },
        { t: 1, rot: 0, scaleX: 1 },
      ],
    },
  },

  support_buff_cast: {
    durationMs: 320,
    blendInMs: 25,
    blendOutMs: 110,
    bones: {
      pelvis: [
        { t: 0, y: -6, rot: 2 },
        { t: 0.38, y: -4, rot: -5, easing: "ease-out" },
        { t: 1, y: 0, rot: 0, easing: "ease-in-out" },
      ],
      torso: [
        { t: 0, rot: 6 },
        { t: 0.38, rot: -10, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      arm_front_up: [
        { t: 0, rot: 118 },
        { t: 0.38, rot: 78, easing: "cubic-bezier(0.18, 0.9, 0.25, 1)" },
        { t: 1, rot: 0, easing: "ease-in-out" },
      ],
      weapon_main: [
        { t: 0, rot: 0 },
        { t: 0.38, rot: 22, easing: "ease-out" },
        { t: 1, rot: 0 },
      ],
      weapon_off: [
        { t: 0, scale: 1.18 },
        { t: 0.38, scale: 1.32, easing: "ease-out" },
        { t: 1, scale: 1 },
      ],
    },
  },
});

/** Role → semantic action clip lookup table. */
const ROLE_CLIP_MAP = Object.freeze({
  tank: {
    windup: "tank_melee_windup",
    strike: "tank_melee_strike",
    leap: "tank_melee_windup",
    block: "tank_block",
    taunt: "tank_taunt",
  },
  fighter: {
    windup: "fighter_melee_windup",
    strike: "fighter_melee_strike",
    leap: "fighter_leap_attack",
  },
  assassin: {
    windup: "assassin_leap_backline",
    leap: "assassin_leap_backline",
    strike: "assassin_double_slash",
    retreat: "assassin_backflip",
  },
  ranger: {
    windup: "ranger_bow_draw",
    aim: "ranger_aim",
    strike: "ranger_bow_release",
    release: "ranger_bow_release",
  },
  mage: {
    windup: "mage_staff_raise",
    cast: "mage_cast_single",
    cast_aoe: "mage_cast_aoe",
    strike: "mage_cast_single",
  },
  support: {
    windup: "support_wand_raise",
    heal: "support_heal_cast",
    buff: "support_buff_cast",
    cast: "support_buff_cast",
    strike: "support_buff_cast",
  },
});

/**
 * Resolve the clip name for a hero's `role` and semantic `action`.
 * Falls back cleanly to common clips (`idle`, `hit`, `death`, `victory`, `defeat`, etc.)
 * or fighter melee clips if a role doesn't define a specialized override.
 */
export function resolveRoleClipName(role, action) {
  const r = String(role || "").toLowerCase();
  const a = String(action || "").toLowerCase();
  if (ROLE_CLIP_MAP[r]?.[a]) return ROLE_CLIP_MAP[r][a];
  if (HERO_CLIPS[a]) return a;
  if (a === "windup") return "fighter_melee_windup";
  if (a === "strike") return "fighter_melee_strike";
  if (a === "block") return "tank_block";
  if (a === "heal") return "support_heal_cast";
  if (a === "buff") return "support_buff_cast";
  return "idle";
}
