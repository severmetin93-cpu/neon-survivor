/**
 * build-atlas.mjs
 * Repacks atlas-units.png using CC0 sprites from Kenney and OpenGameArt.
 * Run: node scripts/build-atlas.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const TMPDIR = '/data/data/com.termux/files/usr/tmp/sprites';
const REMASTERED = `${TMPDIR}/kenney-remastered/PNG`;
const EXTENSION = `${TMPDIR}/kenney-extension/PNG/Sprites X2/Ships`;
const SHIPS200 = `${TMPDIR}/200ships/200Starships/Shaded`;

// Atlas dimensions
const ATLAS_W = 1024;
const ATLAS_H = 2048;

// Frame slots (matches ATLAS.f in index.html)
const SLOTS = {
  boss:       { x: 0,   y: 0,   w: 512, h: 512 },
  vanguard:   { x: 514, y: 0,   w: 256, h: 256 },
  striker:    { x: 0,   y: 514, w: 256, h: 256 },
  controller: { x: 258, y: 514, w: 256, h: 256 },
  tank:       { x: 516, y: 514, w: 256, h: 256 },
  elite:      { x: 0,   y: 772, w: 256, h: 256 },
  dasher:     { x: 258, y: 772, w: 224, h: 224 },
  hunter:     { x: 484, y: 772, w: 192, h: 192 },
  orbiter:    { x: 678, y: 772, w: 192, h: 192 },
  weaver:     { x: 0,   y: 1030, w: 192, h: 192 },
};

// Sprite assignments
// Sources chosen for role/visual fit — all CC0 licensed
const SOURCES = {
  // BOSS: spaceShips_005 — largest, most imposing (342x301) from Kenney Extension
  boss:       `${EXTENSION}/spaceShips_005.png`,
  // Heroes — Kenney Remastered playerShips, facing up (canonical orientation)
  vanguard:   `${REMASTERED}/playerShip1_blue.png`,    // wide heavy cruiser
  striker:    `${REMASTERED}/playerShip3_red.png`,     // slim fast fighter
  controller: `${REMASTERED}/playerShip2_orange.png`,  // mid-size tech ship
  // ELITE: spaceShips_004 — tall imposing (186x294), different silhouette
  elite:      `${EXTENSION}/spaceShips_004.png`,
  // Enemy variants — Kenney Remastered enemies
  tank:       `${REMASTERED}/Enemies/enemyBlack2.png`, // wide/heavy (104x84)
  hunter:     `${REMASTERED}/Enemies/enemyBlack4.png`, // smallest (82x84) → fast
  orbiter:    `${REMASTERED}/ufoRed.png`,              // UFO disc → circular orbiter
  dasher:     `${REMASTERED}/Enemies/enemyBlack5.png`, // sharp-nosed (97x84) → dart
  weaver:     `${REMASTERED}/Enemies/enemyBlue1.png`,  // blue light variant (93x84)
};

// Orientation: game draws enemies facing DOWN (toward player at bottom).
// Kenney enemies already face DOWN. Player ships face UP — keep as-is
// since heroes are drawn pointing toward movement direction in code.
// Boss (extension ship) faces UP by default — flip 180° so it faces DOWN like enemies.
const FLIP_180 = new Set(['boss', 'elite']);

async function fitIntoSlot(srcPath, slot, flip180) {
  // Load source, fit inside slot with transparent padding (letterbox)
  const src = sharp(srcPath).ensureAlpha();
  const meta = await src.metadata();

  const scaleX = slot.w / meta.width;
  const scaleY = slot.h / meta.height;
  const scale = Math.min(scaleX, scaleY);
  const fitW = Math.round(meta.width * scale);
  const fitH = Math.round(meta.height * scale);

  let pipeline = sharp(srcPath).ensureAlpha();
  if (flip180) {
    pipeline = pipeline.rotate(180);
  }
  pipeline = pipeline
    .resize(fitW, fitH, { kernel: 'lanczos3' })
    .extend({
      top:    Math.floor((slot.h - fitH) / 2),
      bottom: Math.ceil((slot.h - fitH) / 2),
      left:   Math.floor((slot.w - fitW) / 2),
      right:  Math.ceil((slot.w - fitW) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });

  return pipeline.png().toBuffer();
}

async function main() {
  const OUTPUT = `${REPO}/www/assets/atlas-units.png`;

  // Start with a blank transparent canvas
  const canvas = sharp({
    create: {
      width: ATLAS_W,
      height: ATLAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  // Build compositing layers
  const composites = [];
  for (const [name, slot] of Object.entries(SLOTS)) {
    const src = SOURCES[name];
    if (!src) {
      console.warn(`No source defined for ${name}, skipping`);
      continue;
    }
    console.log(`Processing ${name}: ${src.split('/').pop()} → ${slot.w}×${slot.h} at (${slot.x},${slot.y})`);
    const buf = await fitIntoSlot(src, slot, FLIP_180.has(name));
    composites.push({ input: buf, left: slot.x, top: slot.y });
  }

  await canvas.composite(composites).png({ compressionLevel: 9 }).toFile(OUTPUT);
  console.log(`\nAtlas written to: ${OUTPUT}`);
  console.log(`Dimensions: ${ATLAS_W}×${ATLAS_H}`);
}

main().catch(err => { console.error(err); process.exit(1); });
