import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CARDS_JSON = path.join(ROOT, "client/web-hud/public/data/card-effects.json");
const ART_RAW_DIR = path.join(ROOT, "client/web-hud/public/stitch-assets/attack-cards/art-raw");
const PROMPTS_OUT = path.join(ROOT, "docs/attack-cards-art-prompts.json");

const HERO_IDENTITY = {
  tank_fire: "massive muscular ginger tabby lion-like warrior cat in blackened bronze-and-iron plate armor, scarred muzzle, glowing amber eyes, wielding a heavy volcanic battle shield",
  tank_water: "broad-shouldered silver-blue arctic lynx warrior cat in frosted steel-and-sapphire plate armor, icy blue glowing eyes, heavy glacier shield and gauntlets",
  tank_wind: "tall athletic pale-silver and celadon maine-coon warrior cat in ornate engraved wind-steel plate armor, emerald eyes, wielding a swirling gale-forged tower shield",

  fighter_fire: "fierce muscular orange-striped tiger warrior cat in scorched bronze lamellar armor with ember-cracked pauldrons, wielding blazing twin warblades",
  fighter_water: "powerful dark-slate and ice-blue panther-cat bruiser in heavy naval steel armor, wielding a massive tidal warhammer or greatsword",
  fighter_wind: "agile silver-grey striped wildcat swordsman in light jade-trimmed brigandine with flowing wind ribbons, wielding a curved tempest saber",

  assassin_fire: "lithe dark-russet and charcoal ember-tabby rogue cat in charred leather hood and daggers glowing white-hot at the edges",
  assassin_water: "sleek midnight-blue and frost-silver shadow cat assassin in wet-sheen sea-leather cloak, wielding twin crystalline frost-venom daggers",
  assassin_wind: "slender pale-ash and moss-green forest lynx assassin in hooded leaf-weave mantle, wielding dual toxic wind-etched blades",

  ranger_fire: "lean copper-furred caracal archer cat in ranger hood and leather quiver, wielding a recurve bow strung with blazing ember fire",
  ranger_water: "graceful silver-white snow-leopard archer cat in sea-blue cloak, wielding a frost-carved longbow with shimmering water arrows",
  ranger_wind: "keen-eyed celadon-silver wildcat scout archer in feathered hood, wielding a wind-carved elven bow with glowing emerald-white arrows",

  mage_fire: "regal amber-eyed ginger-gold mystic cat sorcerer in charred crimson-and-gold robes with ember runes and a blazing staff",
  mage_water: "mystical snow-white and sapphire-marked frost cat mage in ornate silver-blue arcane robes, crystalline icicle staff, glowing frost runes",
  mage_wind: "ethereal pale-silver and jade-eyed storm cat mage in billowing celadon tempest robes, channeling crackling pale-green storm lightning",

  support_fire: "warm golden-cream longhaired cleric cat in sunlit bronze-and-ivory priestly robes, radiant lantern-flame halo and healing staff",
  support_water: "serene pearl-white and aqua-marked healer cat in flowing silver-water priestess robes, glowing spring-water chalice and luminous droplets",
  support_wind: "gentle pale-sage and white oracle cat in fluttering silk-and-leaf wind robes, holding a glowing emerald-white chime staff",
};

const ELEMENT_VFX = {
  fire: "blazing embers, molten sparks, swirling flames, warm volcanic firelight, dark ember-lit fantasy battlefield background",
  water: "crashing aqua waves, shimmering ice crystals, frost mist, glowing sapphire ripples, atmospheric stormy twilight fantasy background",
  wind: "luminous celadon wind currents, swirling emerald-white air ribbons, flying leaves, crackling gale wisps, dramatic misty mountain sky background",
};

const ACTION_OVERRIDES = {
  // Specific vivid scenes for iconic cards where title/effect calls for a signature visual
  card_shop_tank_fire_muzzle: "roaring fiercely with a torrent of golden fire erupting from its jaws while raising its heavy bronze shield behind a blazing flame barrier",
  card_shop_tank_water_muzzle: "lunging forward and unleashing a high-pressure piercing jet of icy water and frost fangs from its roaring jaws, shattering an enemy's armor",
  card_shop_tank_wind_muzzle: "roaring with a spiraling emerald wind vortex erupting from its mouth, raising a glowing gale-shield that deflects incoming attacks",
  card_shop_tank_water_back: "charging forward in a devastating full-body shield-ram wrapped in a crashing tidal wave, smashing through an enemy's barrier",
  card_shop_tank_fire_back: "slamming forward with a blazing volcanic tower shield, shockwave of fire and sparks blasting an enemy backward",
  card_shop_tank_wind_back: "bracing behind a spinning cyclone shield-barrier that reflects bright emerald wind blades back toward attackers",
  card_shop_mage_water_eyes: "casting a piercing beam of glacial frost from glowing eyes, encasing a stunned enemy monster-cat inside jagged solid blue ice crystals",
  card_shop_mage_water_back: "summoning a swirling blizzard of razor icicles and freezing gale across the battlefield, freezing enemies solid in ice",
  card_shop_mage_fire_muzzle: "hurling a massive roaring fireball across the battlefield that explodes in a blinding wave of magma and sparks over multiple foes",
  card_shop_support_fire_eyes: "channeling a warm golden stream of radiant healing embers from outstretched paws onto a wounded ally cat, mending its wounds",
  card_shop_support_water_headwear: "conjuring a pure glowing fountain of luminous aqua spring water cascading over an ally cat, washing away dark poison mist",
  card_shop_support_wind_back: "sweeping both paws upward to summon a radiant emerald-gold tailwind aura that heals and empowers allied warrior cats in battle",
};

function describeCardAction(cardId, card, role, element, part) {
  if (ACTION_OVERRIDES[cardId]) return ACTION_OVERRIDES[cardId];

  const eff = String(card.effect_ru || "").toLowerCase();
  const title = String(card.title_ru || "").toLowerCase();
  const icons = card.icons || {};
  const atk = Number(card.atk || 0);
  const shield = Number(card.shield || 0);

  // Heal / cleanse / support actions
  if (icons.heal && atk === 0) {
    if (eff.includes("всем союзникам") || eff.includes("всей команде")) {
      return "raising its staff high as a sweeping wave of luminous healing energy and shimmering restorative light washes over allied warrior cats";
    }
    if (eff.includes("очищ")) {
      return "channeling a radiant purifying stream of elemental light from its paws onto a wounded ally cat, dissolving dark purple curse smoke";
    }
    return "kneeling in urgent battle motion, pouring a glowing concentrated stream of warm healing energy from both paws into an injured ally cat";
  }

  // Pure buff / shield / taunt actions
  if (atk === 0 && shield > 0) {
    if (eff.includes("таунт") || title.includes("рёв") || title.includes("оскал")) {
      return "roaring defiantly in a fierce defensive stance, slamming its shield down as a glowing elemental fortress barrier rises around it";
    }
    if (eff.includes("отраж")) {
      return "bracing in a coiled guard stance as a shimmering crystalline mirror-barrier of swirling elemental energy forms in front of it, deflecting sparks";
    }
    if (eff.includes("союзнику")) {
      return "leaping beside a companion and projecting a bright protective elemental dome shield around the ally cat";
    }
    return "raising its armored guard as a luminous runic energy shield materializes in front of its body, deflecting incoming sparks";
  }

  if (atk === 0 && icons.buff) {
    return "raising its weapon and channeling a surging golden-elemental battle aura that erupts upward, empowering an allied warrior cat";
  }

  // Control / freeze / stun attacks
  if (eff.includes("стан")) {
    if (element === "water") {
      return "unleashing a sudden blast of glacial frost that freezes an enemy warrior solid inside jagged crystalline ice, immobilizing them";
    }
    if (role === "assassin") {
      return "leaping from the shadows in a blinding acrobatic strike, landing a concussive glowing pommel-and-blade blow that stuns the target with shockwaves";
    }
    return "unleashing a dazzling crackling elemental shockwave straight into an enemy, staggering and stunning them with blinding impact sparks";
  }

  // Poison / debuff attacks
  if (eff.includes("яд")) {
    return "lunging in a swift slashing strike with blades dripping glowing emerald-violet venom, sending swirling toxic mist across the struck foe";
  }

  // AoE / volley / cleave attacks
  if (eff.includes("всем врагам")) {
    if (role === "ranger") {
      return "leaping mid-air and loosing a dramatic fan-volley of multiple glowing elemental arrows streaking down across a group of enemies";
    }
    if (role === "mage") {
      return "unleashing a cataclysmic sweeping elemental storm wave from outstretched claws and staff, engulfing multiple enemies in the foreground";
    }
    return "executing a wide spinning cleave slash that sends a massive crescent arc of elemental energy tearing across multiple foes";
  }

  // Pierce / fragile armor-breaking attacks
  if (icons.pierce || eff.includes("пробой") || eff.includes("хрупк")) {
    if (role === "ranger") {
      return "drawing its bow to full tension and firing a blazing armor-piercing elemental arrow that shatters straight through a dark enemy shield";
    }
    return "driving a focused high-velocity piercing thrust forward, cracking and shattering a glowing enemy armor barrier in a burst of elemental shards";
  }

  // Double hit / multi-strike
  if (icons.x2 || Number(card.hits || 0) > 1) {
    return "mid-leap in a ferocious twin-blade cross-slash, carving two blazing intersecting arcs of elemental energy at high speed";
  }

  // Backline / stealth / ambush / crit execute
  if (eff.includes("стелс") || title.includes("тени") || title.includes("исчезнов")) {
    return "darting out of swirling elemental smoke and shadow in a razor-sharp crouched ambush slash, glowing eyes piercing the darkness";
  }
  if (role === "ranger") {
    return "crouched dynamically on a rocky ledge, loosing a high-speed glowing elemental arrow directly toward the viewer's target with wind-blown cloak";
  }
  if (part === "tail") {
    return "spinning dynamically mid-combat to whip its glowing elemental-charged tail in a ferocious sweeping lash that sends sparks and shockwaves flying";
  }
  if (icons.crit) {
    return "launching forward in an explosive critical strike, weapon blazing with intense concentrated elemental fire at the exact moment of impact";
  }
  if (icons.heal && atk > 0) {
    return "striking an enemy with a radiant smiting blow while golden restorative light flows back around the caster cat";
  }

  return "charging forward in a fierce dynamic mid-attack combat strike, weapon and claws blazing with intense elemental energy";
}

function buildPrompt(cardId, card) {
  const m = cardId.match(/^card_shop_([a-z]+)_([a-z]+)_(eyes|ears|muzzle|headwear|back|tail)$/);
  if (!m) return null;
  const [, role, element, part] = m;
  const heroKey = `${role}_${element}`;
  const heroDesc = HERO_IDENTITY[heroKey];
  const elemVfx = ELEMENT_VFX[element];
  const action = describeCardAction(cardId, card, role, element, part);

  return {
    cardId,
    role,
    element,
    part,
    title_ru: card.title_ru,
    effect_ru: card.effect_ru,
    outFile: path.relative(ROOT, path.join(ART_RAW_DIR, `${role}-${element}`, `${part}.png`)).replace(/\\/g, "/"),
    prompt: [
      `Dynamic dark-fantasy painted RPG skill card illustration (square 1:1 composition, action centered for card art window).`,
      `Subject: ${heroDesc} — MUST be an anthropomorphic bipedal warrior cat (feline head, ears, fur, tail), NEVER a human or elf.`,
      `Action: ${action}.`,
      `Visual effects & atmosphere: ${elemVfx}.`,
      `Art style: semi-realistic 2D painted fantasy game art (Hearthstone / Magic / tavern dark fantasy aesthetic), dramatic lighting, rich painterly brushwork, readable silhouette at card size.`,
      `Strictly forbidden: NO text, NO letters, NO numbers, NO watermarks, NO card frames or borders, NO UI icons, NO vector arrows or floating geometric circles, NO static standing pose.`,
    ].join(" "),
  };
}

async function generateWithOpenAI(prompt, apiKey) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: process.env.OPENAI_IMAGE_QUALITY || "medium",
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, "base64");
  const url = json?.data?.[0]?.url;
  if (url) {
    const imgRes = await fetch(url);
    return Buffer.from(await imgRes.arrayBuffer());
  }
  throw new Error("OpenAI response contained no image data");
}

async function generateWithGemini(prompt, apiKey) {
  const model = process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-generate-002";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: "1:1" },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const b64 = json?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("Gemini response contained no bytesBase64Encoded");
  return Buffer.from(b64, "base64");
}

async function generateWithFal(prompt, apiKey) {
  const model = process.env.FAL_IMAGE_MODEL || "fal-ai/flux/dev";
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "square_hd",
      num_images: 1,
    }),
  });
  if (!res.ok) throw new Error(`Fal ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const imgUrl = json?.images?.[0]?.url;
  if (!imgUrl) throw new Error("Fal response contained no image url");
  const imgRes = await fetch(imgUrl);
  return Buffer.from(await imgRes.arrayBuffer());
}

function detectProvider(forced) {
  if (forced === "openai" || (!forced && process.env.OPENAI_API_KEY)) {
    return { name: "openai", key: process.env.OPENAI_API_KEY, fn: generateWithOpenAI };
  }
  if (forced === "gemini" || (!forced && process.env.GEMINI_API_KEY)) {
    return { name: "gemini", key: process.env.GEMINI_API_KEY, fn: generateWithGemini };
  }
  if (forced === "fal" || (!forced && process.env.FAL_KEY)) {
    return { name: "fal", key: process.env.FAL_KEY, fn: generateWithFal };
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  let exportOnly = false;
  let force = false;
  let only = null;
  let providerArg = null;
  let concurrency = 3;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--export-prompts" || args[i] === "--dry-run") exportOnly = true;
    else if (args[i] === "--force") force = true;
    else if (args[i] === "--only" && args[i + 1]) only = args[++i];
    else if (args[i] === "--provider" && args[i + 1]) providerArg = args[++i];
    else if (args[i] === "--concurrency" && args[i + 1]) concurrency = Math.max(1, Number(args[++i]) || 3);
  }

  const catalog = JSON.parse(fs.readFileSync(CARDS_JSON, "utf8"));
  const items = Object.entries(catalog)
    .filter(([id]) => id.startsWith("card_shop_") && (!only || id.includes(only)))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, card]) => buildPrompt(id, card))
    .filter(Boolean);

  fs.mkdirSync(path.dirname(PROMPTS_OUT), { recursive: true });
  fs.writeFileSync(PROMPTS_OUT, JSON.stringify(items, null, 2), "utf8");
  console.log(`Exported ${items.length} card art prompts to ${path.relative(ROOT, PROMPTS_OUT)}`);

  if (exportOnly) return;

  const provider = detectProvider(providerArg);
  if (!provider || !provider.key) {
    console.error(
      "No image API key found. Set one of: OPENAI_API_KEY, GEMINI_API_KEY, or FAL_KEY, then re-run:\n" +
      "  node scripts/generate-attack-card-art.mjs\n" +
      "  node scripts/build-attack-cards.mjs",
    );
    process.exit(1);
  }

  console.log(`Generating art via ${provider.name} (concurrency=${concurrency})...`);
  let done = 0;
  let skipped = 0;
  let failed = 0;

  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor++];
      const absOut = path.join(ROOT, item.outFile);
      if (!force && fs.existsSync(absOut)) {
        skipped++;
        continue;
      }
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const buf = await provider.fn(item.prompt, provider.key);
          fs.mkdirSync(path.dirname(absOut), { recursive: true });
          fs.writeFileSync(absOut, buf);
          done++;
          console.log(`[${done + skipped}/${items.length}] OK ${item.cardId} -> ${item.outFile}`);
          break;
        } catch (err) {
          if (attempt === 3) {
            failed++;
            console.error(`FAIL ${item.cardId}: ${err.message}`);
          } else {
            await new Promise((r) => setTimeout(r, 1500 * attempt));
          }
        }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log(`Finished: generated=${done}, skipped=${skipped}, failed=${failed}.`);
  if (done > 0) {
    console.log("Next step: run `node scripts/build-attack-cards.mjs` to composite all cards into approved elven frames.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
