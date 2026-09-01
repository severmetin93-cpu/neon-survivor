'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HTML_PATH = 'www/index.html';
const ASSETS_DIR = 'www/assets';

let html = fs.readFileSync(HTML_PATH, 'utf8');
const origLen = html.length;

// Find all base64 data URIs and their positions
const pattern = /data:image\/(png|svg\+xml);base64,([A-Za-z0-9+/=]+)/g;
let m;
const images = [];
while ((m = pattern.exec(html)) !== null) {
  images.push({ start: m.index, end: m.index + m[0].length, type: m[1], b64: m[2] });
}
console.log(`Found ${images.length} base64 data URIs`);

// Group by content hash (using first 300 chars of b64 as fingerprint)
const seen = new Map(); // hash -> { type, b64, filename, assetPath }
const mapping = []; // { start, end, assetPath }[]

// Determine filename for each unique image
// We'll check if we can match existing assets by comparing decoded data
function md5(b64) {
  return crypto.createHash('md5').update(b64.substring(0, 300)).digest('hex').substring(0, 12);
}

// First pass: identify unique images and assign filenames
const uniqueImages = new Map();
for (const img of images) {
  const h = md5(img.b64);
  if (!uniqueImages.has(h)) {
    uniqueImages.set(h, { type: img.type, b64: img.b64, count: 0, b64len: img.b64.length });
  }
  uniqueImages.get(h).count++;
}

console.log(`\nUnique images: ${uniqueImages.size}`);
for (const [h, v] of uniqueImages) {
  console.log(`  ${h} type=${v.type} b64len=${v.b64len} count=${v.count}`);
}

// Match to existing assets by comparing actual decoded bytes
const existingAssets = [
  { file: 'hero-vanguard.png', type: 'png' },
  { file: 'hero-striker.png', type: 'png' },
  { file: 'hero-controller.png', type: 'png' },
];

// Decode each unique image and compare with existing assets
const assetBufs = {};
for (const a of existingAssets) {
  const p = path.join(ASSETS_DIR, a.file);
  if (fs.existsSync(p)) assetBufs[a.file] = fs.readFileSync(p);
}

// Assign names to unique images
const nameMap = new Map(); // hash -> filename
let weaponIdx = 0;
let unknownIdx = 0;

const weaponNames = ['pulse', 'plasma', 'arc', 'arc-alt'];

for (const [h, v] of uniqueImages) {
  let filename = null;

  if (v.type === 'svg+xml') {
    filename = 'intro-hero.svg';
  } else {
    // Try to match existing PNG assets
    let buf;
    try { buf = Buffer.from(v.b64, 'base64'); } catch(e) { buf = null; }

    if (buf) {
      for (const [fname, existBuf] of Object.entries(assetBufs)) {
        if (buf.equals(existBuf)) { filename = fname; break; }
      }
    }

    if (!filename) {
      // Check size to guess weapon vs hero vs tutorial
      // hero PNGs are ~38-52KB decoded, weapon art is smaller
      const decSize = buf ? buf.length : 0;
      if (decSize > 30000) {
        // Large = hero
        filename = `hero-unknown-${unknownIdx++}.png`;
      } else {
        // Small = weapon or tutorial
        if (weaponIdx < weaponNames.length) {
          filename = `weapon-${weaponNames[weaponIdx++]}.png`;
        } else {
          filename = `image-${unknownIdx++}.png`;
        }
      }
    }
  }

  nameMap.set(h, filename);
  v.filename = filename;
}

console.log('\nName assignments:');
for (const [h, v] of uniqueImages) {
  console.log(`  ${h} -> ${v.filename} (${v.b64len} b64 chars, x${v.count})`);
}

// Write files to assets
console.log('\nWriting assets...');
for (const [h, v] of uniqueImages) {
  const assetPath = path.join(ASSETS_DIR, v.filename);
  try {
    let data;
    if (v.type === 'svg+xml') {
      data = Buffer.from(v.b64, 'base64').toString('utf8');
      fs.writeFileSync(assetPath, data);
    } else {
      data = Buffer.from(v.b64, 'base64');
      fs.writeFileSync(assetPath, data);
    }
    console.log(`  Written: ${assetPath} (${data.length} bytes)`);
  } catch(e) {
    console.error(`  ERROR writing ${assetPath}: ${e.message}`);
  }
}

// Replace all occurrences in HTML
console.log('\nReplacing in HTML...');
// We need to replace from end to start to preserve positions
const replacements = [];
pattern.lastIndex = 0;
while ((m = pattern.exec(html)) !== null) {
  const h = md5(m[2]);
  const filename = nameMap.get(h);
  if (filename) {
    replacements.push({ start: m.index, end: m.index + m[0].length, replacement: 'assets/' + filename });
  }
}

// Sort by start descending to replace from end
replacements.sort((a, b) => b.start - a.start);
for (const r of replacements) {
  html = html.substring(0, r.start) + r.replacement + html.substring(r.end);
}

console.log(`Replacements made: ${replacements.length}`);
console.log(`Size before: ${origLen.toLocaleString()} chars`);
console.log(`Size after:  ${html.length.toLocaleString()} chars`);
console.log(`Saved: ${(origLen - html.length).toLocaleString()} chars (${((origLen - html.length)/origLen*100).toFixed(1)}%)`);

fs.writeFileSync(HTML_PATH, html, 'utf8');
console.log('\nDone! index.html updated.');
