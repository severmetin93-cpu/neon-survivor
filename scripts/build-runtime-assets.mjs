/**
 * build-runtime-assets.mjs
 * Converts existing UI_SET source PNGs into runtime atlas files.
 *
 * Outputs:
 *   www/assets/atlas-units.png   — 768×768, 3×3 grid, 256×256 frames
 *   www/assets/atlas-units.json  — frame map consumed by loadAtlas()
 *   www/assets/atlas-items.png   — 512×256, 4×2 grid, 128×128 cells
 *
 * Rules:
 *   - Never modifies source files in sets/
 *   - Skips missing sources; omits frame from JSON (procedural fallback activates)
 *   - Transparent cells for missing slots (atlas-items)
 *   - No new visual art generated
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT   = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETS   = path.join(ROOT, 'sets');
const OUT    = path.join(ROOT, 'www', 'assets');

// ─── atlas-units spec ────────────────────────────────────────────────────────
//
// Each frame: 256×256px
// Sheet layout: 3 cols × 3 rows = 768×768px
//
// Confidence legend:
//   high        — direct semantic match
//   provisional — no exact match; closest available boss portrait used
//   missing     — no source; frame omitted from JSON → procedural fallback
//
const UNIT_FRAMES = [
  // col 0
  { name:'vanguard',   src:'UI_SET_02/03_CharacterPortraits/noryvx_portrait.png',     col:0, row:0, confidence:'high'        },
  { name:'boss',       src:'UI_SET_08/03_BossPortraits/titan_portrait.png',            col:0, row:1, confidence:'high'        },
  { name:'hunter',     src:'UI_SET_08/03_BossPortraits/void_reaper_portrait.png',      col:0, row:2, confidence:'provisional' },
  // col 1
  { name:'striker',    src:'UI_SET_02/03_CharacterPortraits/shadow_portrait.png',      col:1, row:0, confidence:'high'        },
  { name:'elite',      src:'UI_SET_08/03_BossPortraits/overmind_portrait.png',         col:1, row:1, confidence:'high'        },
  { name:'weaver',     src:'UI_SET_08/03_BossPortraits/radiant_beast_portrait.png',    col:1, row:2, confidence:'provisional' },
  // col 2
  { name:'controller', src:'UI_SET_02/03_CharacterPortraits/rex_portrait.png',         col:2, row:0, confidence:'high'        },
  // tank, orbiter, dasher → missing (no source) → omitted from JSON
];

const UNIT_FRAME_SIZE = 256;
const UNIT_COLS       = 3;
const UNIT_ROWS       = 3;
const UNIT_SHEET_W    = UNIT_FRAME_SIZE * UNIT_COLS;   // 768
const UNIT_SHEET_H    = UNIT_FRAME_SIZE * UNIT_ROWS;   // 768

// ─── atlas-items spec ────────────────────────────────────────────────────────
//
// Each cell: 128×128px
// Sheet layout: 4 cols × 2 rows = 512×256px
// Source crop: center-square from 300×330 → then resize to 128×128
//
// Slot order matches CSS background-position in index.html:
//   row 0: weapon[0] helmet[1] armor[2] gloves[3]
//   row 1: boots[0]  core[1]   module[2] accessory[3]
//
const ITEM_CELLS = [
  // row 0
  { name:'weapon',    src:'UI_SET_02/06_Equipment/weapon_slot.png',  col:0, row:0, missing:false },
  { name:'helmet',    src:'UI_SET_02/06_Equipment/helmet_slot.png',  col:1, row:0, missing:false },
  { name:'armor',     src:'UI_SET_02/06_Equipment/chest_slot.png',   col:2, row:0, missing:false },
  { name:'gloves',    src:'UI_SET_02/06_Equipment/gloves_slot.png',  col:3, row:0, missing:false },
  // row 1
  { name:'boots',     src:'UI_SET_02/06_Equipment/boots_slot.png',   col:0, row:1, missing:false },
  { name:'core',      src:null,                                       col:1, row:1, missing:true  },
  { name:'module',    src:'UI_SET_02/06_Equipment/module_slot.png',  col:2, row:1, missing:false },
  { name:'accessory', src:null,                                       col:3, row:1, missing:true  },
];

const ITEM_CELL_SIZE  = 128;
const ITEM_COLS       = 4;
const ITEM_SHEET_W    = ITEM_CELL_SIZE * ITEM_COLS;   // 512
const ITEM_SHEET_H    = ITEM_CELL_SIZE * 2;           // 256
// Source images are 300×330 → crop center 300×300 → resize 128×128
const ITEM_SRC_W      = 300;
const ITEM_SRC_CROP_H = 300;
const ITEM_CROP_TOP   = 15;   // Math.floor((330 - 300) / 2)

// ─── helpers ─────────────────────────────────────────────────────────────────

function log(msg) { process.stdout.write(msg + '\n'); }

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

// ─── build atlas-units ───────────────────────────────────────────────────────

async function buildUnits() {
  log('\n── atlas-units ─────────────────────────────────────────────────────');

  // Blank RGBA sheet
  const sheet = sharp({
    create: { width: UNIT_SHEET_W, height: UNIT_SHEET_H, channels: 4,
              background: { r:0, g:0, b:0, alpha:0 } }
  }).png();

  const composites = [];
  const frames     = {};
  const missing    = [];

  for (const f of UNIT_FRAMES) {
    const srcPath = path.join(SETS, f.src);
    if (!(await exists(srcPath))) {
      log(`  SKIP  ${f.name} — source not found: ${f.src}`);
      missing.push(f.name);
      continue;
    }

    const buf = await sharp(srcPath)
      .resize(UNIT_FRAME_SIZE, UNIT_FRAME_SIZE, { fit:'cover', position:'centre' })
      .png()
      .toBuffer();

    const x = f.col * UNIT_FRAME_SIZE;
    const y = f.row * UNIT_FRAME_SIZE;
    composites.push({ input: buf, left: x, top: y });

    frames[f.name] = { x, y, w: UNIT_FRAME_SIZE, h: UNIT_FRAME_SIZE };
    log(`  OK    ${f.name.padEnd(12)} [${f.col},${f.row}] conf:${f.confidence}`);
  }

  // Missing sources never touch the sheet; just note them
  for (const n of ['tank','orbiter','dasher']) {
    log(`  SKIP  ${n.padEnd(12)} — no source (missing)`);
  }

  // Compose and write
  const outPng  = path.join(OUT, 'atlas-units.png');
  const outJson = path.join(OUT, 'atlas-units.json');

  await sheet.composite(composites).toFile(outPng);
  const stat = await fs.stat(outPng);
  log(`  WRITE atlas-units.png  ${UNIT_SHEET_W}×${UNIT_SHEET_H}  ${(stat.size/1024).toFixed(1)}KB`);

  const json = { image: 'atlas-units.png', frames };
  await fs.writeFile(outJson, JSON.stringify(json, null, 2));
  log(`  WRITE atlas-units.json  ${Object.keys(frames).length} frames`);

  log('\n  Frame summary:');
  log(`  ✅ Confirmed  : vanguard, striker, controller, boss, elite`);
  log(`  ⚠️  Provisional: hunter (void_reaper), weaver (radiant_beast)`);
  log(`  ❌ Missing    : tank, orbiter, dasher → procedural fallback`);
}

// ─── build atlas-items ───────────────────────────────────────────────────────

async function buildItems() {
  log('\n── atlas-items ─────────────────────────────────────────────────────');

  const sheet = sharp({
    create: { width: ITEM_SHEET_W, height: ITEM_SHEET_H, channels: 4,
              background: { r:0, g:0, b:0, alpha:0 } }
  }).png();

  const composites = [];

  for (const c of ITEM_CELLS) {
    if (c.missing || !c.src) {
      log(`  SKIP  ${c.name.padEnd(12)} — no source → transparent cell`);
      continue;
    }

    const srcPath = path.join(SETS, c.src);
    if (!(await exists(srcPath))) {
      log(`  SKIP  ${c.name.padEnd(12)} — file missing: ${c.src}`);
      continue;
    }

    const buf = await sharp(srcPath)
      // Center-crop: 300×330 → 300×300 (remove 15px top, 15px bottom)
      .extract({ left: 0, top: ITEM_CROP_TOP, width: ITEM_SRC_W, height: ITEM_SRC_CROP_H })
      .resize(ITEM_CELL_SIZE, ITEM_CELL_SIZE, { fit:'cover', position:'centre' })
      .png()
      .toBuffer();

    const x = c.col * ITEM_CELL_SIZE;
    const y = c.row * ITEM_CELL_SIZE;
    composites.push({ input: buf, left: x, top: y });
    log(`  OK    ${c.name.padEnd(12)} [${c.col},${c.row}]`);
  }

  const outPng = path.join(OUT, 'atlas-items.png');
  await sheet.composite(composites).toFile(outPng);
  const stat = await fs.stat(outPng);
  log(`  WRITE atlas-items.png  ${ITEM_SHEET_W}×${ITEM_SHEET_H}  ${(stat.size/1024).toFixed(1)}KB`);

  log('\n  Cell summary:');
  log(`  ✅ Filled : weapon, helmet, armor, gloves, boots, module`);
  log(`  ❌ Empty  : core, accessory → transparent (no source)`);
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  log('build-runtime-assets.mjs — NORYVX V20.0.0');
  log('Source: sets/ (read-only)');
  log('Output: www/assets/');

  await fs.mkdir(OUT, { recursive: true });

  await buildUnits();
  await buildItems();

  log('\n✅ Done. anim/ sistemi: kaynak yok → procedural fallback korunuyor.');
}

main().catch(e => { console.error(e); process.exit(1); });
