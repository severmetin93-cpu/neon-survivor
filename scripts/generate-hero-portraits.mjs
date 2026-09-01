#!/usr/bin/env node
// Generates epic hero portraits: AI from Pollinations.ai + heavy compositing
// Run: node scripts/generate-hero-portraits.mjs

import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ASSETS = join(ROOT, "www/assets");
const INDEX = join(ROOT, "www/index.html");
const S = 256;

const HEROES = [
  {
    id: "vanguard",
    label: "VANGUARD",
    class: "AUTOBOT",
    prompt: "transformers autobot warrior robot, blue chrome metallic armor, glowing blue optic eyes, dramatic battle pose, cinematic portrait, dark background, highly detailed mech",
    glow: { r: 0, g: 140, b: 255 },
    frameColor: "#00aaff",
    seed: 42,
  },
  {
    id: "striker",
    label: "STRIKER",
    class: "ASSAULT",
    prompt: "transformers decepticon warrior robot, red black metallic armor, glowing red optic eyes, aggressive attack pose, cinematic portrait, dark background, highly detailed mech",
    glow: { r: 255, g: 20, b: 0 },
    frameColor: "#ff2200",
    seed: 137,
  },
  {
    id: "controller",
    label: "CONTROLLER",
    class: "COMMAND",
    prompt: "transformers leader robot, gold white metallic armor, glowing amber optic eyes, commanding pose, cinematic portrait, dark background, highly detailed mech",
    glow: { r: 255, g: 170, b: 0 },
    frameColor: "#ffaa00",
    seed: 256,
  },
];

async function download(hero) {
  const encoded = encodeURIComponent(hero.prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&model=sana&seed=${hero.seed}&nologo=true`;
  console.log(`  Fetching AI image (seed=${hero.seed})...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function epicFrameSvg(color, label, cls) {
  const c = color;
  return `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Corner brackets top-left -->
  <line x1="2" y1="18" x2="2" y2="2" stroke="${c}" stroke-width="2.5" filter="url(#glow)"/>
  <line x1="2" y1="2" x2="18" y2="2" stroke="${c}" stroke-width="2.5" filter="url(#glow)"/>

  <!-- Corner brackets top-right -->
  <line x1="${S-2}" y1="18" x2="${S-2}" y2="2" stroke="${c}" stroke-width="2.5" filter="url(#glow)"/>
  <line x1="${S-2}" y1="2" x2="${S-18}" y2="2" stroke="${c}" stroke-width="2.5" filter="url(#glow)"/>

  <!-- Corner brackets bottom-left -->
  <line x1="2" y1="${S-18}" x2="2" y2="${S-2}" stroke="${c}" stroke-width="2.5" filter="url(#glow)"/>
  <line x1="2" y1="${S-2}" x2="18" y2="${S-2}" stroke="${c}" stroke-width="2.5" filter="url(#glow)"/>

  <!-- Corner brackets bottom-right -->
  <line x1="${S-2}" y1="${S-18}" x2="${S-2}" y2="${S-2}" stroke="${c}" stroke-width="2.5" filter="url(#glow)"/>
  <line x1="${S-2}" y1="${S-2}" x2="${S-18}" y2="${S-2}" stroke="${c}" stroke-width="2.5" filter="url(#glow)"/>

  <!-- Side tick marks -->
  <line x1="2" y1="${S/2-8}" x2="8" y2="${S/2-8}" stroke="${c}" stroke-width="1.5" opacity="0.8"/>
  <line x1="2" y1="${S/2}" x2="10" y2="${S/2}" stroke="${c}" stroke-width="1.5" opacity="0.8"/>
  <line x1="2" y1="${S/2+8}" x2="8" y2="${S/2+8}" stroke="${c}" stroke-width="1.5" opacity="0.8"/>
  <line x1="${S-2}" y1="${S/2-8}" x2="${S-8}" y2="${S/2-8}" stroke="${c}" stroke-width="1.5" opacity="0.8"/>
  <line x1="${S-2}" y1="${S/2}" x2="${S-10}" y2="${S/2}" stroke="${c}" stroke-width="1.5" opacity="0.8"/>
  <line x1="${S-2}" y1="${S/2+8}" x2="${S-8}" y2="${S/2+8}" stroke="${c}" stroke-width="1.5" opacity="0.8"/>

  <!-- Bottom name plate -->
  <rect x="0" y="${S-34}" width="${S}" height="34" fill="black" opacity="0.75"/>
  <rect x="0" y="${S-34}" width="${S}" height="1.5" fill="${c}" opacity="0.9"/>

  <!-- Class label (small top) -->
  <text x="${S/2}" y="${S-22}" text-anchor="middle" font-family="monospace" font-size="8"
        fill="${c}" opacity="0.8" letter-spacing="3">${cls}</text>

  <!-- Hero name (large bottom) -->
  <text x="${S/2}" y="${S-8}" text-anchor="middle" font-family="monospace" font-size="13"
        font-weight="bold" fill="white" filter="url(#glow)" letter-spacing="2">${label}</text>

  <!-- Top scan line decoration -->
  <rect x="20" y="10" width="${S-40}" height="1" fill="${c}" opacity="0.5"/>
  <rect x="30" y="13" width="${S-60}" height="1" fill="${c}" opacity="0.3"/>

  <!-- Targeting reticle center (small) -->
  <circle cx="${S/2}" cy="${S/2-20}" r="16" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.3"/>
  <line x1="${S/2-20}" y1="${S/2-20}" x2="${S/2-14}" y2="${S/2-20}" stroke="${c}" stroke-width="0.7" opacity="0.4"/>
  <line x1="${S/2+14}" y1="${S/2-20}" x2="${S/2+20}" y2="${S/2-20}" stroke="${c}" stroke-width="0.7" opacity="0.4"/>
</svg>`;
}

async function compositePortrait(rawBuf, hero) {
  const { glow, frameColor, label, class: cls } = hero;

  // Dark dramatic background
  const bg = await sharp({
    create: { width: S, height: S, channels: 4, background: { r: 4, g: 4, b: 8, alpha: 1 } },
  }).png().toBuffer();

  // Radial glow background
  const glowSvg = Buffer.from(`<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="rgb(${glow.r},${glow.g},${glow.b})" stop-opacity="0.6"/>
        <stop offset="50%" stop-color="rgb(${glow.r},${glow.g},${glow.b})" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="black" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${S}" height="${S}" fill="url(#g)"/>
  </svg>`);

  // Vignette
  const vignetteSvg = Buffer.from(`<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="v" cx="50%" cy="45%" r="65%">
        <stop offset="55%" stop-color="black" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.9"/>
      </radialGradient>
    </defs>
    <rect width="${S}" height="${S}" fill="url(#v)"/>
  </svg>`);

  // Epic frame
  const frameSvg = Buffer.from(epicFrameSvg(frameColor, label, cls));

  // Scanlines
  const scanSvg = Buffer.from(`<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    ${Array.from({length: 64}, (_, i) =>
      `<rect x="0" y="${i*4}" width="${S}" height="1" fill="black" opacity="0.08"/>`
    ).join('')}
  </svg>`);

  // Render SVGs
  const [glowBuf, vignBuf, frameBuf, scanBuf] = await Promise.all([
    sharp(glowSvg).resize(S, S).png().toBuffer(),
    sharp(vignetteSvg).resize(S, S).png().toBuffer(),
    sharp(frameSvg).resize(S, S).png().toBuffer(),
    sharp(scanSvg).resize(S, S).png().toBuffer(),
  ]);

  // Resize + enhance the raw AI image
  const heroEnhanced = await sharp(rawBuf)
    .resize(S, S, { fit: "cover", position: "top" })
    .modulate({ brightness: 1.15, saturation: 1.6, hue: 0 })
    .sharpen({ sigma: 1.2, m1: 1.5, m2: 0.7 })
    .png()
    .toBuffer();

  // Blurred glow layer (color bloom)
  const heroGlow = await sharp(rawBuf)
    .resize(S, S, { fit: "cover", position: "top" })
    .modulate({ brightness: 2.5, saturation: 2 })
    .blur(22)
    .tint({ r: glow.r, g: glow.g, b: glow.b })
    .png()
    .toBuffer();

  // Compose: bg → ambient glow → hero glow (screen) → enhanced hero → vignette → scanlines → epic frame
  let result = await sharp(bg).composite([{ input: glowBuf, blend: "screen" }]).png().toBuffer();
  result = await sharp(result).composite([{ input: heroGlow, blend: "screen" }]).png().toBuffer();
  result = await sharp(result).composite([{ input: heroEnhanced }]).png().toBuffer();
  result = await sharp(result).composite([{ input: vignBuf }]).png().toBuffer();
  result = await sharp(result).composite([{ input: scanBuf }]).png().toBuffer();
  result = await sharp(result).composite([{ input: frameBuf }]).png().toBuffer();

  return result;
}

async function main() {
  console.log("=== EPIC HERO PORTRAIT GENERATOR ===\n");

  const portraits = {};

  for (const hero of HEROES) {
    console.log(`[${hero.label}]`);
    const outPath = join(ASSETS, `hero-${hero.id}.png`);

    const rawBuf = await download(hero);
    console.log(`  Raw: ${rawBuf.length} bytes`);

    const finalBuf = await compositePortrait(rawBuf, hero);
    writeFileSync(outPath, finalBuf);
    portraits[hero.id] = finalBuf.toString("base64");
    console.log(`  Done: ${outPath} (${finalBuf.length} bytes)\n`);
  }

  console.log("=== EMBEDDING INTO index.html ===");
  let html = readFileSync(INDEX, "utf8");

  const newSrc = `var SRC={vanguard:"data:image/png;base64,${portraits.vanguard}",striker:"data:image/png;base64,${portraits.striker}",controller:"data:image/png;base64,${portraits.controller}"},IM={};`;
  const srcRx = /var SRC=\{vanguard:"data:image\/png;base64,[^"]*",striker:"data:image\/png;base64,[^"]*",controller:"data:image\/png;base64,[^"]*"\},IM=\{\};/;

  if (!srcRx.test(html)) { console.error("SRC block not found!"); process.exit(1); }
  html = html.replace(srcRx, newSrc);
  writeFileSync(INDEX, html);

  console.log(`Done. index.html: ${Math.round(Buffer.byteLength(html)/1024)} KB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
