# NORYVX Design System

Tek görsel dil. Kod içi kaynak: `www/index.html` → `<style id="noryvx-design-system">`.
Ek overlay: `www/css/nvx2-menu-polish.css`.

## İlkeler

1. **Okunabilirlik önce** — neon glow metni boğmaz
2. **Mobil-first** — min 44px dokunma, safe-area
3. **Tek aile** — menü, HUD, popup aynı token’lar
4. **Hiyerarşi** — birincil aksiyon 1 saniyede bulunur
5. **Hafif animasyon** — 150–320ms, performanslı

## Token’lar

### Yüzey
| Token | Kullanım |
|-------|----------|
| `--s0` | En koyu zemin `#020611` |
| `--s1`–`--s3` | Kart / panel derinlik |
| `--card-bg` | Menü kartları |

### Marka
| Token | Hex | Rol |
|-------|-----|-----|
| `--primary` | `#22e6ff` | Cyan — ana vurgu |
| `--secondary` | `#a05cff` | Violet |
| `--accent` | `#ff4fd8` | Mythic / vurgu |
| `--danger` | `#ff3b6b` | Hasar / uyarı |
| `--elite` | `#ffe34d` | Elite / ödül |
| `--energy` | `#48ff9b` | HP / enerji |

### Metin
| Token | Rol |
|-------|-----|
| `--ink` | Birincil metin |
| `--ink-2` | İkincil |
| `--ink-3` | Üçüncül / label |

### Spacing & radius
8px grid: `--gap-sm` 4 · `--gap` 8 · `--gap-md` 16 · `--gap-lg` 24  
Radius: `--r-sm` 10 · `--r-md` 14 · `--r-lg` 20

### Motion
`--t-fast` 150ms · `--t-mid` 220ms · `--t-slow` 320ms

### Rarity
Common → Mythic: gri → yeşil → cyan → mor → sarı → pembe

## Tipografi

- **UI:** Chakra Petch (başlık, buton)
- **Data / mono:** IBM Plex Mono (skor, timer, ticker)

## Week-1 tasarım sırası

1. Ana menü (OYNA, kartlar, HUD strip) — Day 1
2. HUD + level-up kartları — Day 4
3. Missions / Shop / Cosmetics ekranları — Day 3–5
4. Run sonu — Day 5
