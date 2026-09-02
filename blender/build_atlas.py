#!/usr/bin/env python3
"""
NORVYX — post-bake: rename frame-00 PNGs to game contract names,
then pack all ships into atlas-units.png + atlas-units.json.

Input:  baked/{ship}_{frame:02d}.png  (2048×2048 or 1024×1024)
Output: baked/ships/{game-name}.png   (512×512 per ship, frame 00)
        baked/atlas-units.png          (4096×4096 combined atlas)
        baked/atlas-units.json         (frame coordinates)
"""
import os, json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent.parent
BAKED = ROOT / 'baked'
SHIPS_OUT = BAKED / 'ships'
SHIPS_OUT.mkdir(parents=True, exist_ok=True)

# Game frame-name contract: baked source → www/assets/ships/ target name
HERO_MAP = {
    'vanguard':   'hero-vanguard.png',
    'striker':    'hero-striker.png',
    'controller': 'hero-controller.png',
}
ENEMY_MAP = {
    'hunter':  'enemy-hunter.png',
    'tank':    'enemy-tank.png',
    'weaver':  'enemy-weaver.png',
    'dasher':  'enemy-dasher.png',
    'orbiter': 'enemy-orbiter.png',
    'boss':    'enemy-boss.png',
    'elite':   'enemy-elite.png',
    'assault': 'enemy-assault.png',
    'scout':   'enemy-scout.png',
}

GAME_MAP = {**HERO_MAP, **ENEMY_MAP}

# Target sizes per ship type (matching existing atlas-units.json contract)
ATLAS_SIZES = {
    'boss':       512,
    'vanguard':   256, 'striker':  256, 'controller': 256,
    'tank':       256, 'elite':    256,
    'dasher':     224,
    'hunter':     192, 'orbiter':  192, 'weaver':     192,
    'assault':    192, 'scout':    192,
}
DEFAULT_SIZE = 256

# --- Step 1: export frame-00 per ship at target size ---
game_frames = {}
for ship, game_name in GAME_MAP.items():
    src = BAKED / f'{ship}_00.png'
    if not src.exists():
        print(f'[atlas] WARNING: {src.name} not found — skipping {game_name}')
        continue
    target_sz = ATLAS_SIZES.get(ship, DEFAULT_SIZE)
    img = Image.open(src).convert('RGBA')
    img = img.resize((target_sz, target_sz), Image.LANCZOS)
    dest = SHIPS_OUT / game_name
    img.save(dest, 'PNG', optimize=False)
    game_frames[ship] = {'file': game_name, 'size': target_sz, 'img': img}
    print(f'[atlas] {game_name}  {target_sz}×{target_sz}')

# --- Step 2: pack into atlas ---
ATLAS_SIZE = 4096
atlas = Image.new('RGBA', (ATLAS_SIZE, ATLAS_SIZE), (0, 0, 0, 0))
frames_json = {}

x, y, row_h = 0, 0, 0
for ship, data in game_frames.items():
    img = data['img']
    w, h = img.size
    if x + w > ATLAS_SIZE:
        x = 0
        y += row_h
        row_h = 0
    if y + h > ATLAS_SIZE:
        print(f'[atlas] ERROR: atlas full, {ship} does not fit')
        break
    atlas.paste(img, (x, y))
    frames_json[ship] = {'x': x, 'y': y, 'w': w, 'h': h}
    row_h = max(row_h, h)
    x += w

atlas_png = BAKED / 'atlas-units.png'
atlas_json = BAKED / 'atlas-units.json'
atlas.save(atlas_png, 'PNG', optimize=False)
with open(atlas_json, 'w') as f:
    json.dump(frames_json, f, indent=2)

print(f'[atlas] atlas-units.png saved ({ATLAS_SIZE}×{ATLAS_SIZE})')
print(f'[atlas] atlas-units.json: {len(frames_json)} frames')
print(f'[atlas] Ships out dir: {SHIPS_OUT}')
print('[atlas] Done.')
