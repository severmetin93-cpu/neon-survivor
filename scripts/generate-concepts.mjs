#!/usr/bin/env node
// Stability AI - generate 5 robot concept portraits for NORVYX
// Run: node scripts/generate-concepts.mjs

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "www/assets/concepts");
mkdirSync(OUT, { recursive: true });

const API_KEY = "sk-MjEPlllYkKdZE4VHvWferVF0fsYsKy4CbU7ZO3Ap51c2K0he";
const API_URL = "https://api.stability.ai/v2beta/stable-image/generate/core";

// NORVYX is a dark sci-fi survivor game (Vampire Survivors in space)
// Style: neon-lit, cyberpunk, mature, dramatic portraits
const BASE = "epic sci-fi mech warrior robot character portrait, dark cyberpunk background, neon lighting, cinematic composition, head and chest visible, ultra detailed mechanical armor, professional game art, 4k";
const NEG = "cartoon, anime, chibi, simple, low quality, blurry, watermark, text, humans, organic";

const CONCEPTS = [
  {
    id: "concept-1-vanguard-blue",
    label: "VANGUARD (Blue Heavy)",
    prompt: `${BASE}, massive blue chrome battle armor, glowing electric blue visor eyes, autobot warrior stance, heavy shoulder pauldrons with energy cannons, metallic chest plate with glowing core reactor, dramatic underlighting`,
    style: "cinematic",
  },
  {
    id: "concept-2-striker-red",
    label: "STRIKER (Red Assault)",
    prompt: `${BASE}, sleek red and black carbon fiber armor, glowing crimson visor eyes, aggressive forward-leaning attack pose, blade weapons on forearms, sharp angular design, fire and energy particles around armor`,
    style: "cinematic",
  },
  {
    id: "concept-3-controller-gold",
    label: "CONTROLLER (Gold Commander)",
    prompt: `${BASE}, regal gold and ivory command armor, amber glowing optic sensors, dignified upright commander pose, cape-like energy field flowing behind, ornate chest emblem, commanding presence, imperial design`,
    style: "fantasy-art",
  },
  {
    id: "concept-4-vanguard-alt",
    label: "VANGUARD ALT (Steel Titan)",
    prompt: `${BASE}, gunmetal gray and electric cyan armor, battle-scarred veteran robot, one glowing eye visor cracked, heavy war-torn chest armor with repair marks, stoic powerful stance, battle damage details, neon blue energy leaking from wounds`,
    style: "cinematic",
  },
  {
    id: "concept-5-striker-alt",
    label: "STRIKER ALT (Shadow Ninja)",
    prompt: `${BASE}, jet black stealth armor with purple neon trim, multiple glowing purple visor eyes, crouching ready-to-strike pose, energy blades extended, shadow cloak energy effect, assassin mech design, dangerous predatory feel`,
    style: "cinematic",
  },
];

async function generate(concept) {
  console.log(`\n[${concept.label}]`);
  console.log(`  Prompt: ${concept.prompt.substring(0, 80)}...`);

  const form = new FormData();
  form.append("prompt", concept.prompt);
  form.append("negative_prompt", NEG);
  form.append("output_format", "png");
  form.append("aspect_ratio", "1:1");
  form.append("style_preset", concept.style);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "image/*",
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err.substring(0, 200)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`  Downloaded: ${buf.length} bytes`);

  // Get dimensions
  const meta = await sharp(buf).metadata();
  console.log(`  Dimensions: ${meta.width}x${meta.height} ${meta.format}`);

  // Save raw full-size
  const rawPath = join(OUT, `${concept.id}-raw.png`);
  writeFileSync(rawPath, buf);

  // Create 256x256 portrait preview with dramatic compositing
  await makePreview(buf, concept);

  return buf;
}

async function makePreview(buf, concept) {
  const S = 256;
  const isBlue = concept.id.includes("vanguard") && !concept.id.includes("alt");
  const isRed = concept.id.includes("striker") && !concept.id.includes("alt");
  const isGold = concept.id.includes("controller");
  const isCyan = concept.id.includes("vanguard-alt");
  const isPurple = concept.id.includes("striker-alt");

  const glow = isBlue ? { r: 0, g: 140, b: 255 } :
               isRed ? { r: 255, g: 20, b: 0 } :
               isGold ? { r: 255, g: 170, b: 0 } :
               isCyan ? { r: 0, g: 220, b: 220 } :
               { r: 160, g: 0, b: 255 };

  const frameColor = isBlue ? "#00aaff" :
                     isRed ? "#ff2200" :
                     isGold ? "#ffaa00" :
                     isCyan ? "#00dddd" :
                     "#aa00ff";

  const bg = await sharp({
    create: { width: S, height: S, channels: 4, background: { r: 4, g: 4, b: 8, alpha: 1 } },
  }).png().toBuffer();

  const glowSvg = Buffer.from(`<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="rgb(${glow.r},${glow.g},${glow.b})" stop-opacity="0.55"/>
        <stop offset="50%" stop-color="rgb(${glow.r},${glow.g},${glow.b})" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="black" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${S}" height="${S}" fill="url(#g)"/>
  </svg>`);

  const vignSvg = Buffer.from(`<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="v" cx="50%" cy="45%" r="65%">
        <stop offset="55%" stop-color="black" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.88"/>
      </radialGradient>
    </defs>
    <rect width="${S}" height="${S}" fill="url(#v)"/>
  </svg>`);

  const [glowBuf, vignBuf] = await Promise.all([
    sharp(glowSvg).resize(S, S).png().toBuffer(),
    sharp(vignSvg).resize(S, S).png().toBuffer(),
  ]);

  const heroGlow = await sharp(buf)
    .resize(S, S, { fit: "cover", position: "top" })
    .modulate({ brightness: 2.5, saturation: 2 })
    .blur(20)
    .tint({ r: glow.r, g: glow.g, b: glow.b })
    .png().toBuffer();

  const heroImg = await sharp(buf)
    .resize(S, S, { fit: "cover", position: "top" })
    .modulate({ brightness: 1.1, saturation: 1.5 })
    .sharpen({ sigma: 1.0 })
    .png().toBuffer();

  let result = await sharp(bg).composite([{ input: glowBuf, blend: "screen" }]).png().toBuffer();
  result = await sharp(result).composite([{ input: heroGlow, blend: "screen" }]).png().toBuffer();
  result = await sharp(result).composite([{ input: heroImg }]).png().toBuffer();
  result = await sharp(result).composite([{ input: vignBuf }]).png().toBuffer();

  const previewPath = join(OUT, `${concept.id}-preview.png`);
  writeFileSync(previewPath, result);
  console.log(`  Preview: ${previewPath}`);
}

async function main() {
  console.log("=== NORVYX — STABILITY AI ROBOT CONCEPTS ===");
  console.log(`Generating ${CONCEPTS.length} concepts (~${CONCEPTS.length * 3} credits)\n`);

  // Check API key
  const check = await fetch("https://api.stability.ai/v1/user/account", {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (check.ok) {
    const acc = await check.json();
    console.log(`Account: ${acc.email}`);
    console.log(`Credits: ${acc.credits}\n`);
  } else {
    console.warn("Could not verify account, proceeding anyway...");
  }

  for (const concept of CONCEPTS) {
    try {
      await generate(concept);
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
    }
  }

  console.log("\n=== DONE ===");
  console.log(`Images saved to: ${OUT}`);
  console.log("Raw PNGs and 256x256 previews are ready.");
  console.log("Tell me which concept(s) you like best!");
}

main().catch((e) => { console.error(e); process.exit(1); });
