/**
 * Universal 2D cut-out DOM rig builder for Mythfel ("котики").
 *
 * - Builds a nested bone hierarchy from a `rig.json` manifest (512×512 logical canvas).
 * - Uses percentage-based `transform-origin` so the rig scales crisply to any slot size.
 * - Supports horizontal mirroring (`scaleX(-1)`) on the rig root for left/right arena sides.
 * - Gracefully falls back to a standard flat cutout `<img>` when `manifest` is absent or invalid.
 * - Zero external dependencies.
 */

export const RIG_CANVAS_DEFAULT = [512, 512];
export const RIG_ORIGIN_DEFAULT = [256, 300];
export const RIG_ROOT_BASE_PATH = "/stitch-assets/cat-heroes/rigs";

/** Canonical bone names shared across all 6 hero roles. */
export const UNIVERSAL_BONES = Object.freeze([
  "root",
  "pelvis",
  "torso",
  "head",
  "ear_front",
  "ear_back",
  "eyes_open",
  "eyes_closed",
  "muzzle",
  "tail",
  "cape",
  "back_prop",
  "arm_front_up",
  "arm_front_low",
  "paw_front",
  "weapon_main",
  "arm_back_up",
  "arm_back_low",
  "paw_back",
  "weapon_off",
  "leg_front_up",
  "leg_front_low",
  "foot_front",
  "leg_back_up",
  "leg_back_low",
  "foot_back",
]);

/** Cache of loaded rig manifests (URL -> manifest object | null). */
const manifestCache = new Map();
const manifestInflight = new Map();

function normalizeBaseUrl(url) {
  if (!url) return "";
  return url.endsWith("/") ? url : `${url}/`;
}

function resolvePartUrl(baseUrl, src) {
  if (!src) return "";
  if (/^(https?:)?\/\/|^\/|^data:/.test(src)) return src;
  return `${normalizeBaseUrl(baseUrl)}${src}`;
}

function isValidManifest(manifest) {
  return !!(
    manifest &&
    typeof manifest === "object" &&
    manifest.bones &&
    typeof manifest.bones === "object" &&
    Object.keys(manifest.bones).length > 0
  );
}

/**
 * Derive a deterministic rig folder slug from a unit object, e.g. "tank-fire".
 * Supports explicit `unit.rigId` / `unit.rigSlug` override for custom/event heroes.
 */
export function resolveHeroRigSlug(unit) {
  if (!unit || typeof unit !== "object") return "";
  if (unit.rigId || unit.rigSlug) return String(unit.rigId || unit.rigSlug).trim();
  const tid = String(unit.templateId || unit.template || "").toLowerCase();
  // Never try to load cat-hero rigs for monsters or training dummies unless explicitly tagged.
  if (/^(bot_|pitboss_|dummy_|raid_foe|monster_)/.test(tid)) return "";
  const m = tid.match(/(tank|fighter|assassin|ranger|mage|support)[_-](fire|water|wind|stone|ice|bolt|grass)/);
  if (m) return `${m[1]}-${m[2]}`;
  const role = String(unit.role || "").toLowerCase();
  const el = String(unit.element || "").toLowerCase();
  if (role && el) return `${role}-${el}`;
  return "";
}

/**
 * Fetch and cache a hero's `rig.json` manifest.
 * Returns `null` cleanly on 404 / network / parse error (cached to avoid repeat requests).
 */
export async function loadHeroRigManifest(rigUrlOrSlug) {
  if (!rigUrlOrSlug) return null;
  const raw = String(rigUrlOrSlug).trim();
  const url = raw.endsWith(".json")
    ? raw
    : raw.startsWith("/") || /^https?:\/\//.test(raw)
      ? `${normalizeBaseUrl(raw)}rig.json`
      : `${RIG_ROOT_BASE_PATH}/${raw}/rig.json`;

  if (manifestCache.has(url)) return manifestCache.get(url);
  if (manifestInflight.has(url)) return manifestInflight.get(url);

  const promise = (async () => {
    try {
      const res = await fetch(url, { cache: "default" });
      if (!res.ok) {
        manifestCache.set(url, null);
        return null;
      }
      const data = await res.json();
      if (!isValidManifest(data)) {
        manifestCache.set(url, null);
        return null;
      }
      const baseUrl = url.slice(0, url.lastIndexOf("/") + 1);
      const enriched = { ...data, _baseUrl: data.baseUrl || baseUrl, _manifestUrl: url };
      manifestCache.set(url, enriched);
      return enriched;
    } catch {
      manifestCache.set(url, null);
      return null;
    } finally {
      manifestInflight.delete(url);
    }
  })();

  manifestInflight.set(url, promise);
  return promise;
}

/** Clear cached rig manifests (useful for hot-reloading art during authoring). */
export function clearHeroRigCache() {
  manifestCache.clear();
}

/**
 * Build a flat cutout fallback inside `container` when `manifest` is missing.
 */
function buildFallbackCutout(container, fallbackCutoutSrc, opts = {}) {
  const root = document.createElement("div");
  root.className = "mf-rig-root mf-rig-fallback";
  if (opts.role) root.dataset.rigRole = String(opts.role).toLowerCase();
  if (opts.flipX) root.classList.add("is-flipped");

  const img = document.createElement("img");
  img.alt = opts.alt || "";
  img.src = fallbackCutoutSrc || "";
  img.className = opts.imgClass || "mf-battle-cutout mf-hero-sprite";
  if (opts.alive === false) img.classList.add("mf-unit-dim");
  img.decoding = "async";
  img.draggable = false;
  root.appendChild(img);

  if (container) {
    container.replaceChildren(root);
  }

  return {
    mode: "cutout",
    root,
    stage: root,
    img,
    bones: {},
    boneMeta: {},
    canvas: [...RIG_CANVAS_DEFAULT],
    manifest: null,
    role: String(opts.role || "").toLowerCase(),
    setFacing(desiredFace) {
      const nativeFace = opts.nativeFacing || "left";
      const flip = desiredFace ? desiredFace !== nativeFace : !!opts.flipX;
      root.classList.toggle("is-flipped", flip);
      root.dataset.face = desiredFace || nativeFace;
    },
    destroy() {
      root.remove();
    },
  };
}

/**
 * Universal Hero DOM Rig Builder.
 *
 * @param {HTMLElement|null} container - Target DOM element to mount into.
 * @param {object|null} manifest - Parsed `rig.json` object, or null for flat cutout fallback.
 * @param {string} fallbackCutoutSrc - Flat cutout sprite URL used when manifest is unavailable.
 * @param {object} [opts]
 * @param {string} [opts.baseUrl] - Base URL for relative bone sprite paths.
 * @param {'left'|'right'} [opts.facing] - Desired facing direction on the field.
 * @param {boolean} [opts.flipX] - Explicit horizontal mirror flag (overrides `facing` if boolean).
 * @param {string} [opts.role] - Hero role override (`tank`|`fighter`|`assassin`|`ranger`|`mage`|`support`).
 * @param {boolean} [opts.alive] - Whether the unit is alive.
 * @param {string} [opts.alt] - Alt text for fallback cutout.
 * @returns {object} Rig handle (`{ mode, root, stage, bones, boneMeta, canvas, manifest, role, setFacing, destroy }`).
 */
export function buildHeroRig(container, manifest, fallbackCutoutSrc, opts = {}) {
  if (!isValidManifest(manifest)) {
    return buildFallbackCutout(container, fallbackCutoutSrc, opts);
  }

  const canvasW = Number(manifest.canvas?.[0]) || RIG_CANVAS_DEFAULT[0];
  const canvasH = Number(manifest.canvas?.[1]) || RIG_CANVAS_DEFAULT[1];
  const nativeFacing = manifest.facing === "right" ? "right" : "left";
  const baseUrl = normalizeBaseUrl(opts.baseUrl || manifest._baseUrl || "");
  const role = String(opts.role || manifest.role || "").toLowerCase();

  const root = document.createElement("div");
  root.className = "mf-rig-root mf-rig-active";
  root.dataset.rigRole = role;
  if (manifest.heroId) root.dataset.rigHero = String(manifest.heroId);
  if (opts.alive === false) root.classList.add("mf-unit-dim");

  const stage = document.createElement("div");
  stage.className = "mf-rig-stage";
  stage.style.setProperty("--rig-w", String(canvasW));
  stage.style.setProperty("--rig-h", String(canvasH));
  root.appendChild(stage);

  const bones = {};
  const boneMeta = {};
  const defs = manifest.bones;

  // Ensure a root bone always exists in the hierarchy.
  const allEntries = Object.entries(defs);
  if (!defs.root) {
    allEntries.unshift(["root", { parent: null, pivot: [canvasW / 2, canvasH * 0.9], z: 0 }]);
  }

  // Pass 1: Create every bone div, set transform-origin, z-index, default opacity, and sprite img.
  for (const [name, def] of allEntries) {
    if (!def || typeof def !== "object") continue;
    const boneEl = document.createElement("div");
    boneEl.className = "mf-rig-bone";
    boneEl.dataset.bone = name;

    const px = Number(def.pivot?.[0] ?? canvasW / 2);
    const py = Number(def.pivot?.[1] ?? canvasH / 2);
    const oxPct = (px / canvasW) * 100;
    const oyPct = (py / canvasH) * 100;
    boneEl.style.transformOrigin = `${oxPct.toFixed(4)}% ${oyPct.toFixed(4)}%`;

    const z = Number.isFinite(def.z) ? def.z : 0;
    boneEl.style.zIndex = String(z);

    const defaultOpacity = typeof def.opacity === "number" ? def.opacity : 1;
    if (defaultOpacity !== 1) {
      boneEl.style.opacity = String(defaultOpacity);
    }

    if (def.src) {
      const img = document.createElement("img");
      img.className = "mf-rig-part";
      img.alt = "";
      img.draggable = false;
      img.decoding = "async";
      img.src = resolvePartUrl(baseUrl, def.src);
      img.style.zIndex = String(z);

      // Optional cropped sub-rect [x, y, w, h] in 512×512 logical canvas coords.
      if (Array.isArray(def.rect) && def.rect.length === 4) {
        const [rx, ry, rw, rh] = def.rect.map(Number);
        img.style.left = `${((rx / canvasW) * 100).toFixed(4)}%`;
        img.style.top = `${((ry / canvasH) * 100).toFixed(4)}%`;
        img.style.width = `${((rw / canvasW) * 100).toFixed(4)}%`;
        img.style.height = `${((rh / canvasH) * 100).toFixed(4)}%`;
      }

      img.onerror = () => {
        img.style.display = "none";
      };
      boneEl.appendChild(img);
    }

    bones[name] = boneEl;
    boneMeta[name] = {
      name,
      parent: def.parent ?? null,
      pivot: [px, py],
      z,
      defaultOpacity,
    };
  }

  // Pass 2: Nest bones according to `parent` (with cycle protection).
  const hasCycle = (childName, parentName) => {
    let cur = parentName;
    const seen = new Set([childName]);
    while (cur) {
      if (seen.has(cur)) return true;
      seen.add(cur);
      cur = boneMeta[cur]?.parent ?? null;
    }
    return false;
  };

  for (const [name, boneEl] of Object.entries(bones)) {
    const parentName = boneMeta[name]?.parent;
    if (parentName && bones[parentName] && !hasCycle(name, parentName)) {
      bones[parentName].appendChild(boneEl);
    } else if (name !== "root" && bones.root) {
      bones.root.appendChild(boneEl);
    } else {
      stage.appendChild(boneEl);
    }
  }

  const applyFacing = (desiredFace, explicitFlip) => {
    let flip;
    if (typeof explicitFlip === "boolean") {
      flip = explicitFlip;
    } else if (desiredFace === "left" || desiredFace === "right") {
      flip = desiredFace !== nativeFacing;
    } else {
      flip = false;
    }
    root.classList.toggle("is-flipped", flip);
    root.dataset.face = desiredFace || (flip ? (nativeFacing === "left" ? "right" : "left") : nativeFacing);
  };

  applyFacing(opts.facing, opts.flipX);

  if (container) {
    container.replaceChildren(root);
  }

  return {
    mode: "rig",
    root,
    stage,
    bones,
    boneMeta,
    canvas: [canvasW, canvasH],
    manifest,
    role,
    setFacing(desiredFace) {
      applyFacing(desiredFace, undefined);
    },
    destroy() {
      root.remove();
    },
  };
}
