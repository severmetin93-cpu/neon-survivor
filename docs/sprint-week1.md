# NORYVX — Week 1 Sprint (1–7 Eylül 2026)

## Hedef

Oynanabilir, eksik hissi düşük, soft-launch’a yakın build.

| Gün | Odak | Durum |
|-----|------|--------|
| **1** | Tasarım sistemi + isim tutarlılığı + menü CSS polish | ✅ Done |
| **2** | Missions & Achievements tam bağlama | ✅ Done |
| **3** | Cosmetics / Shop içerik + Inventory iskeleti | ⏳ Next |
| **4** | HUD / level-up / run-end görsel polish + SFX altyapısı | ⏳ |
| **5** | Loot drop + run sonu ödül | ⏳ |
| **6** | Performans cap + AdMob production hazırlığı + asset temizlik | ⏳ |
| **7** | Test, versiyon bump, kalan kritik bug’lar | ⏳ |

## Day 1 ✅

- README, design-system, sprint docs
- `www/css/nvx2-menu-polish.css`
- `www/manifest.json` → NORYVX
- Service Worker inject + cache

## Day 2 ✅

- `www/js/ms7-day2-fixes.js` — hub refresh, onRunEnd UI, hub wire, CSS fallback
- `scripts/patch-index-links.py` + Actions workflow
- **index.html** inject commit: CSS + day2 script links
- SW v25-1-2 HTML inject fallback

## Day 3 (sıradaki)

- Shop / Cosmetics içerik doğrulama
- Inventory iskeleti
- Boş ekran / dead button temizliği

## Erteleme

5 hero, full Battle Pass, sector map, büyük rewrite, leaderboard.
