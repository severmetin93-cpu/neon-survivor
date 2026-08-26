# NORYVX — MVP Kapsam Analizi

> "Bugünkü haliyle yayınlasak, oyuncuya ne sunardık; neyi yarım bırakırdık?"

---

## Faz Geçmişi Özeti

| Faz | İçerik |
|---|---|
| Phase 0 | Temel canvas oyun döngüsü, hareket, düşman spawn, XP toplama |
| Phase 1 | Silah sistemi (PULSE/PLASMA/ARC/NOVA), run upgrade kart mekanizması |
| Phase 2 | Loot rarity renk sistemi, build/power panel, boss sistemi |
| Phase 3 (NORYVX rewrite) | RPG karakter seçimi (Vanguard/Striker/Controller), Skill Matrix, Weapon Mastery, profil ekonomisi, yeniden tasarlanmış HUD (Phase 3 fullcard boss HUD, weapon pills, hull bar), Telemetry/debug sistemi, sprite atlas, Service Worker düzeltmesi |
| Sonraki (planlanmış) | Inventory, loot sistemi, sector haritası, battle pass, 5 kahraman (NORYX/SHADOW/REX/VEGA/LUXIA), 5 sektör |

---

## TAMAMLANMIŞ SİSTEMLER (Şu an çalışıyor)

### Oyun Döngüsü
- Endless survival arenası — wave/spawn sistemi aktif
- Düşman tipolojisi: normal, elite, boss (faz geçişleri, çoklu boss fazı)
- Oyuncu hareketi (joystick), dash mekaniği
- Ölüm / koşu sonu ekranı
- Combo sistemi, canlı skor

### Silah Sistemi
- 4 silah: PULSE, PLASMA, ARC, NOVA
- Silah level-up (kart seçimi ile run içi)
- Silah synerji sistemi
- Weapon Mastery (hasar bazlı kalıcı ilerleme)
- Run upgrade deck (5 upgrade slotu)

### Karakter Sistemi
- 3 hero: **Vanguard** (tank), **Striker** (saldırı), **Controller** (destek)
- Her hero için ayrı stat profili (HP, hız, güç, magnet)
- Sprite atlas render + prosedürel fallback
- Karakter seçim ekranı (carousel, hero stats görünümü)

### Skill Matrix
- Kalıcı Skill Point sistemi (level-up → SP)
- Skill ağacı (Vanguard/Striker/Controller için ayrı dallar)
- Mastery çubuğu

### Profil & Ekonomi (Temel)
- Profil XP, level hesaplama (kare kök eğrisi)
- Çekirdek (◆) kazanımı ve görüntülenmesi
- Koşu sonu ödül ekranı (XP + Çekirdek)
- Save/load sistemi (`localStorage`)

### UI/UX
- Ana menü, hero select, pause, level-up, run-end ekranları
- Tutorial (5 slayt)
- Ayarlar: ses, titreşim, kalite (LOW/MED/HIGH), dil (TR/EN)
- Versiyon rozeti (BALANCE.version'dan otomatik)
- Service Worker (network-first index.html, cache-first assets)
- PWA manifest, offline çalışabilirlik

### Debug / Geliştirici Araçları
- Telemetry debug paneli (logo'ya 5 dokunuş)
- PowerCurve balance analizi (DPS, threat, ratio)
- AFK metrikleri

---

## YARI TAMAMLANMIŞ / İSKELET HALİNDE

Aşağıdaki sistemlerin UI'ı var (CSS + HTML elemanları), ancak işlevsel değil
veya kasıtlı olarak gizlenmiş (`display:none` buton olarak kodda bekliyor):

| Sistem | Durum | Eksik Olan |
|---|---|---|
| **Missions (Görevler)** | CSS + HTML var, `scr-missions` ekranı var | Görev tanımları, ödül bağlantısı, kaydetme/yükleme |
| **Battle Pass** | CSS (`noryvx-bp-css`) + HTML iskelet var | Sezon verisi, ödül çizelgesi, satın alma akışı |
| **Shop (Mağaza)** | Buton gizli (`b-shop`) | Tüm içerik eksik |
| **Cosmetics / Skins** | Buton gizli | Tüm içerik eksik |
| **Leaderboard** | Buton gizli | Backend yok, veri yok |
| **Achievements** | Buton gizli | Tanımlar yok |
| **Sectors** | Buton gizli | Harita sistemi hiç yok |
| **Inventory / Loot** | Atlas-items.png hazır (8 slot) | Loot drop sistemi, envanter ekranı yok |
| **5. Hero (NORYX/SHADOW/REX/VEGA/LUXIA)** | İsimler planında var | PNG yok, atlas frame yok, stat profili yok |
| **Gerçek AdMob ID** | Test ID ile çalışıyor | Üretim ID girilmeli, `initializeForTesting: false` yapılmalı |

---

## MVP OLARAK YAYINLANABİLİR Mİ?

### Sunulan Deneyim (şu haliyle)

- Sonsuz survival arcade: rastgele dalga, 4 silah, 3 kahraman, boss savaşı
- Run başına değişen kart sistemi (her koşu farklı hissettiriyor)
- Kalıcı ilerleme: level, skill, mastery
- Türkçe + İngilizce dil desteği
- PWA + APK olarak çalışıyor, offline oynanıyor

### Eksik / Yarım Bırakılan (MVP öncesi kapatılabilir)

| Öncelik | Madde |
|---|---|
| **Kritik** | AdMob gerçek ID (gelir için) |
| **Kritik** | Gizli butonların ya aktifleştirilmesi ya da UI'dan tamamen kaldırılması (şu an ölü buton) |
| **Önemli** | Missions sistemi (oyuncu tutma için birincil mekanik) |
| **Önemli** | Loot / Inventory (RPG genişlemesinin temeli) |
| **İsteğe bağlı** | Battle Pass, Shop, Cosmetics (monetizasyon) |
| **Gelecek** | 5-hero kadrosu, 5-sektör haritası, Leaderboard |

### Sonuç

Şu haliyle yayınlanabilir bir **arcade survival çekirdeği** var.
Oyuncuya sunulan tamamlanmış deneyim: "Her koşuda farklı build dene, 3 farklı
karakter oyna, kalıcı skill ilerlet." Bu tek başına MVP için yeterli bir döngü.

Eksik kalan şey: **tutma (retention) mekanizmaları** — görevler, battle pass,
loot tabanlı ilerleme bunlar olmadan oyuncu 5–7 koşudan sonra ayrılabilir.
Yayın öncesinde en az Missions sistemi aktifleştirilmeli.
