#!/usr/bin/env node
// Stability AI: generate 3 final hero portraits + remove background → transparent PNG
// Run: node scripts/generate-hero-final.mjs

import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ASSETS = join(ROOT, "www/assets");
const TMP = join(ASSETS, "concepts");
const INDEX = join(ROOT, "www/index.html");

const API_KEY = "sk-MjEPlllYkKdZE4VHvWferVF0fsYsKy4CbU7ZO3Ap51c2K0he";
const GEN_URL = "https://api.stability.ai/v2beta/stable-image/generate/core";
const BG_URL  = "https://api.stability.ai/v2beta/stable-image/edit/remove-background";

const NEG = "background, environment, landscape, floor, ground, wall, text, watermark, blurry, humans, organic body, cartoon, anime, chibi, low quality";

const HEROES = [
  {
    id: "vanguard",
    seed: 101,
    prompt: "epic sci-fi autobot warrior robot, massive blue chrome titanium battle armor, glowing neon blue visor optic eyes, heroic upright stance, heavy detailed shoulder pauldrons, chest reactor core glowing, mechanical joints and hydraulics visible, studio portrait lighting, character concept art, white background, isolated character, 4k ultra detailed professional game art",
    style: "cinematic",
  },
  {
    id: "controller",
    seed: 303,
    prompt: "epic sci-fi commander mech robot, regal gold and ivory ceremonial battle armor, glowing amber optic sensors, commanding dignified upright pose, ornate chest emblem with glowing runes, imperial shoulder guards, golden energy aura, detailed mechanical articulation, studio portrait lighting, character concept art, white background, isolated character, 4k ultra detailed professional game art",
    style: "fantasy-art",
  },
  {
    id: "striker",
    seed: 505,
    prompt: "epic sci-fi stealth assassin mech robot, jet black carbon fiber armor with purple neon energy trim, multiple glowing purple visor eyes, predatory crouching ready-to-strike pose, energy blades extended from forearms, shadow cloak effect around edges, razor sharp angular design, studio portrait lighting, character concept art, white background, isolated character, 4k ultra detailed professional game art",
    style: "cinematic",
  },
];

async function generate(hero) {
  console.log(`  Generating ${hero.id}...`);
  const form = new FormData();
  form.append("prompt", hero.prompt);
  form.append("negative_prompt", NEG);
  form.append("output_format", "png");
  form.append("aspect_ratio", "1:1");
  form.append("style_preset", hero.style);
  form.append("seed", String(hero.seed));

  const res = await fetch(GEN_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "image/*" },
    body: form,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Generate ${hero.id}: HTTP ${res.status} — ${t.substring(0, 300)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  console.log(`    Raw: ${meta.width}x${meta.height}, ${Math.round(buf.length/1024)}KB`);
  return buf;
}

async function removeBackground(imgBuf, heroId) {
  console.log(`  Removing background for ${heroId}...`);

  const blob = new Blob([imgBuf], { type: "image/png" });
  const form = new FormData();
  form.append("image", blob, `${heroId}.png`);
  form.append("output_format", "png");

  const res = await fetch(BG_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "image/*" },
    body: form,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`BG remove ${heroId}: HTTP ${res.status} — ${t.substring(0, 300)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  console.log(`    Transparent: ${meta.width}x${meta.height}, alpha=${meta.hasAlpha}, ${Math.round(buf.length/1024)}KB`);
  return buf;
}

async function finalizePortrait(transparentBuf, heroId) {
  // Downscale to 512x512 keeping transparency — crisp for in-game display
  const out = await sharp(transparentBuf)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .sharpen({ sigma: 0.8 })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const meta = await sharp(out).metadata();
  console.log(`    Final: ${meta.width}x${meta.height}, hasAlpha=${meta.hasAlpha}, ${Math.round(out.length/1024)}KB`);
  return out;
}

async function main() {
  console.log("=== NORVYX HERO FINAL PORTRAITS ===");
  console.log("Plan: Generate → Remove BG → 512x512 transparent PNG → embed in index.html\n");

  mkdirSync(TMP, { recursive: true });

  const portraits = {};

  for (const hero of HEROES) {
    console.log(`\n[${hero.id.toUpperCase()}]`);
    try {
      // 1. Generate
      const rawBuf = await generate(hero);
      writeFileSync(join(TMP, `${hero.id}-hq-raw.png`), rawBuf);

      // 2. Remove background
      const transBuf = await removeBackground(rawBuf, hero.id);
      writeFileSync(join(TMP, `${hero.id}-transparent.png`), transBuf);

      // 3. Finalize to 512x512
      const finalBuf = await finalizePortrait(transBuf, hero.id);
      writeFileSync(join(ASSETS, `hero-${hero.id}.png`), finalBuf);

      portraits[hero.id] = finalBuf.toString("base64");
      console.log(`    Saved: www/assets/hero-${hero.id}.png`);
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
      process.exit(1);
    }
  }

  console.log("\n=== EMBEDDING INTO index.html ===");
  let html = readFileSync(INDEX, "utf8");

  const newSrc = `var SRC={vanguard:"data:image/png;base64,${portraits.vanguard}",striker:"data:image/png;base64,${portraits.striker}",controller:"data:image/png;base64,${portraits.controller}"},IM={};`;
  const srcRx = /var SRC=\{vanguard:"data:image\/png;base64,[^"]*",striker:"data:image\/png;base64,[^"]*",controller:"data:image\/png;base64,[^"]*"\},IM=\{\};/;

  if (!srcRx.test(html)) { console.error("SRC block not found!"); process.exit(1); }
  html = html.replace(srcRx, newSrc);
  writeFileSync(INDEX, html);

  const totalKB = Math.round(Buffer.byteLength(html) / 1024);
  console.log(`Done. index.html: ${totalKB} KB`);

  // Also copy transparent PNGs to Download for review
  for (const hero of HEROES) {
    const src = join(TMP, `${hero.id}-transparent.png`);
    const dst = `/sdcard/Download/norvyx-concepts/${hero.id}-FINAL-transparent.png`;
    try {
      writeFileSync(dst, readFileSync(src));
      console.log(`Copied preview: ${dst}`);
    } catch {}
  }

  console.log("\nAll done! Build APK to test in game.");
}

main().catch((e) => { console.error(e); process.exit(1); });
