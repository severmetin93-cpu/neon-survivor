/**
 * sync-version.mjs
 * Reads BALANCE.version from www/index.html and writes the matching
 * CACHE constant into www/service-worker.js.
 *
 * Usage: npm run sync:version
 * Run this once after bumping BALANCE.version in index.html.
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_HTML = path.join(ROOT, 'www', 'index.html');
const SW_JS      = path.join(ROOT, 'www', 'service-worker.js');

const html = await readFile(INDEX_HTML, 'utf8');

const versionMatch = html.match(/version\s*:\s*"([^"]+)"/);
if (!versionMatch) {
  console.error('ERROR: BALANCE.version not found in index.html');
  process.exit(1);
}

const version   = versionMatch[1];                          // e.g. "20.0.0"
const cacheName = 'neon-survivor-v' + version.replace(/\./g, '-'); // "neon-survivor-v20-0-0"

const sw     = await readFile(SW_JS, 'utf8');
const swNew  = sw.replace(/^const CACHE\s*=\s*"[^"]+";/m, `const CACHE = "${cacheName}";`);

if (sw === swNew) {
  console.log(`CACHE already up-to-date: "${cacheName}"`);
} else {
  await writeFile(SW_JS, swNew, 'utf8');
  console.log(`CACHE updated → "${cacheName}" (BALANCE.version: ${version})`);
}
