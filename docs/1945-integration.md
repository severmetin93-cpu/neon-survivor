# NORYVX × 1945 Air Force Integration

Reference: **1945 Air Force** (Play Store) — vertical shooter systems mapped onto NORYVX survival loop.

## Integrated systems (in `www/index.html`)

| 1945 feature | NORYVX implementation |
|---|---|
| Enemy bullets | `enemyBullets` pool + `enemyShoot` / `eliteFire` / `bossFire` |
| Power-up drops | `dropFromEnemy` → powerCore / shield / nanoRepair |
| Weapon power P1–P5 | `Game.weaponPower` + spread in `fireProjectile` |
| Power HUD | `#nvx-weapon-power` (LV + bar) |
| Absolute touch move | Delta→absolute position tracking |
| Wave clear bonus | `_waveKills` → power bump every 3 waves |

## Runtime harden layer

`www/js/noryvx-1945-runtime.js` (loaded via Actions patch):

- Safe hex→rgba bullet trails (fixes invalid `replace` on `#rrggbb`)
- Weapon HUD only while `Game.state === PLAYING`
- Guarantees `Game.weaponPower` in 1–5 range
- Re-binds after late script loads

## Known prior fixes (Sept 2026)

- Game loop / `loop` name collision with music
- `update`/`render` overridden by UI scripts → `_gameUpdate` / `_gameRender`
- TDZ on `Game`, `CHAR_W`, `drops`
- `p3MasteryRank` exported to `window`

## Next polish targets

1. Boss bullet-hell density tuning per sector
2. Distinct SFX for power-core pickup
3. In-run damage flash + low-HP vignette
4. Remove residual diag overlays in production builds
