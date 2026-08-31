/**
 * add-projectile-sprites.mjs
 * Composites PULSE, PLASMA, ARC projectile sprites into atlas-units.png.
 * Free space starts at y=1222 (weaver: y=1030,h=192 → 1222).
 * Run: node scripts/add-projectile-sprites.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const KENNEY = '/data/data/com.termux/files/usr/tmp/sprites/kenney-remastered/PNG/Lasers';

const ATLAS_PATH = `${REPO}/www/assets/atlas-units.png`;

// Free space starts at y=1222
// Layout:
//   bullet_pulse:  x=0,   y=1222, w=64, h=16  (thin horizontal beam)
//   bullet_plasma: x=64,  y=1222, w=64, h=64  (round orb)
//   bullet_arc:    x=128, y=1222, w=64, h=32  (angular energy bolt)
const SLOTS = {
  bullet_pulse:  { x: 0,   y: 1222, w: 64, h: 16, src: `${KENNEY}/laserBlue01.png`,  rotate: 90  },
  bullet_plasma: { x: 64,  y: 1222, w: 64, h: 64, src: `${KENNEY}/laserBlue09.png`,  rotate: 0   },
  bullet_arc:    { x: 128, y: 1222, w: 64, h: 32, src: `${KENNEY}/laserRed08.png`,   rotate: 90  },
};

async function fitIntoSlot(srcPath, slot) {
  const { w, h, rotate } = slot;
  let pipeline = sharp(srcPath).ensureAlpha();

  // Rotate first if needed (Kenney lasers point UP; rotate 90° CW → points RIGHT)
  if (rotate) {
    pipeline = pipeline.rotate(rotate);
  }

  const meta = await pipeline.metadata();

  const scaleX = w / meta.width;
  const scaleY = h / meta.height;
  const scale = Math.min(scaleX, scaleY);
  const fitW = Math.max(1, Math.round(meta.width * scale));
  const fitH = Math.max(1, Math.round(meta.height * scale));

  const padTop    = Math.floor((h - fitH) / 2);
  const padBottom = Math.ceil((h - fitH) / 2);
  const padLeft   = Math.floor((w - fitW) / 2);
  const padRight  = Math.ceil((w - fitW) / 2);

  // Re-create pipeline (sharp pipelines are consumed)
  let p2 = sharp(srcPath).ensureAlpha();
  if (rotate) p2 = p2.rotate(rotate);
  p2 = p2
    .resize(fitW, fitH, { kernel: 'lanczos3' })
    .extend({
      top:    padTop,
      bottom: padBottom,
      left:   padLeft,
      right:  padRight,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });

  return p2.png().toBuffer();
}

async function main() {
  console.log('Loading existing atlas:', ATLAS_PATH);
  const atlas = sharp(ATLAS_PATH);
  const meta = await atlas.metadata();
  console.log(`Atlas: ${meta.width}x${meta.height}`);

  const composites = [];
  for (const [name, slot] of Object.entries(SLOTS)) {
    console.log(`Processing ${name}: ${slot.src.split('/').pop()} → ${slot.w}×${slot.h} at (${slot.x},${slot.y}) rotate=${slot.rotate}°`);
    const buf = await fitIntoSlot(slot.src, slot);
    composites.push({ input: buf, left: slot.x, top: slot.y });
  }

  // Composite onto existing atlas
  await sharp(ATLAS_PATH)
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(ATLAS_PATH + '.tmp');

  // Replace original
  const fs = await import('fs');
  fs.renameSync(ATLAS_PATH + '.tmp', ATLAS_PATH);

  console.log('\nDone! New frames placed:');
  for (const [name, slot] of Object.entries(SLOTS)) {
    console.log(`  ${name}: {x:${slot.x},y:${slot.y},w:${slot.w},h:${slot.h}}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
