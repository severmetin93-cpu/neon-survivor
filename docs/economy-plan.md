# NORYVX — Ekonomi Planı (Taslak)

> **Durum:** Taslak — onay bekleniyor. `[TASLAK]` işaretli sistemler henüz kodlanmamış veya UI'da gizlidir.

---

## 1. Mevcut Para Birimleri

| Sembol | Ad | Kaynak | Kodda Nerede |
|---|---|---|---|
| ◆ | Çekirdek (cores) | Oyun sonu ödülü, score'dan türetilir | `Save.data.cores`, `profile-currency` |
| ◎ | Coin (soft) | Gameplay score ödülü | `Save.data.coins` (var, UI'da gizli) |
| ◆P | Gem (premium) | `[TASLAK]` satın alma / rewarded ad | `Save.data.gems` (var, UI'da gizli) |
| SP | Skill Point | Her level-up'ta +1 | `DEVELOPMENT` ekranı, `dev-currency-display` |

**Mevcut durumda yalnızca Çekirdek (◆) kullanıcıya gösterilmektedir.**
Coin ve Gem değişkenleri `Save.data` içinde tanımlı ama hiçbir UI öğesi bunları
tüketmemektedir — shop, cosm, skins ekranları `display:none` butonlarla gizli.

---

## 2. XP Kaynakları (Kodlanmış)

Tümü `BALANCE.economy` objesinden gelir. Değerler değiştirilmemelidir.

| Kaynak | Katsayı | Koda göre |
|---|---|---|
| Enerji toplama (normal) | `xpPerEnergy: 1` | `Telemetry.onEnergy(1)` |
| Rare enerji toplama | `xpPerRareEnergy: 1` | `Telemetry.onEnergy(3)` |
| Elite öldürme | `xpPerElite: 8` | `Telemetry.onKill(e)` |
| Boss öldürme | `xpPerBoss: 25` | `Telemetry.onKill(e)` |
| Score başına | `xpPerScore` | `ProfileEconomy.award(score,time)` |
| Saniye başına | `xpPerSecond` | `ProfileEconomy.award(score,time)` |
| Minimum XP/koşu | `xpMin: 10` | garantili taban |

Level hesaplama: `level = 1 + floor(sqrt(profileXP / 100))` — kare kök eğrisi,
geç oyunda level kazanma hızı yavaşlar.

---

## 3. Ödül Kaynakları ve Hedef Sistemler

### A. Mevcut (Çalışıyor)

| Sistem | Ödül Türü | Durum |
|---|---|---|
| Koşu sonu skoru → Çekirdek | Soft progression | Aktif |
| Level-up → Skill Point (SP) | Kalıcı güç artışı | Aktif |
| Weapon Mastery XP (hasar bazlı) | Hafıza/Mastery ilerleme | Aktif |
| Run upgrade (kart seçimi) | Geçici güçlenme | Aktif |

### B. UI'da Var Ama Henüz Bağlanmamış `[TASLAK]`

| Sistem | Gizli Buton ID | Hedef |
|---|---|---|
| Missions (görevler) | `b-missions` | Görev tamamlama → Çekirdek/XP |
| Battle Pass | `b-battlepass` | Sezon ilerlemesi → kozmetik + bonus |
| Shop (mağaza) | `b-shop` | Gem harcama ekranı |
| Cosmetics | `b-cosm` | Skin/görsel satın alma |
| Skins | `b-skins` | Karakter kostümü |
| Achievements | `b-ach` | Başarı → tek seferlik ödül |
| Leaderboard | `b-leaderboard` | Rekabetçi gösterim |
| Sectors | `b-sectors` | `[TASLAK]` Harita ilerleme sistemi |

### C. AdMob Entegrasyonu (Altyapı Hazır, İçerik Eksik)

`capacitor.config.json`:
- `appIdAndroid / appIdIos`: Şu an **test ID** (üretim öncesi değiştirilmeli)
- `initializeForTesting: true`

Kodda `NORYVXTelemetry.log("ad_"+event)` çağrısı mevcut — ad olayları loglanabiliyor.
Battle Pass ekranında `bp-ad` butonu var (rewarded ad tetikleyici `[TASLAK]`).

Öngörülen reklam türleri:
| Tür | Tetikleyici | Ödül |
|---|---|---|
| Rewarded Video | BP ekranında `bp-ad` butonu | `[TASLAK]` BP XP / Çekirdek |
| Interstitial | `[TASLAK]` Koşu sonu | — |
| Banner | `[TASLAK]` Menü alt alan | — |

---

## 4. Pay-to-Win Olmaması Kuralı

`BALANCE` nesnesi içinde açıkça tanımlı:

```js
allowed: [
  "cosmetic", "skin", "visual_effects",
  "profile_customization", "ui_themes",
  "banners", "emotes",
  "non_competitive_convenience"
]
```

**Yasak olan (listede olmayan):** Savaş gücü, silah hasarı, HP, hız, spawn rate
avantajı satılmaz. Skill Point yalnızca level-up ile kazanılır (satın alınamaz).

**Mevcut kodda çelişki riski:**
- `Save.data.gems` değişkeni var ama hiçbir yerde Gem → SP veya Gem → silah güçlendirme
  dönüşümü yapılmıyor. Taslak ekonomi bu kuralı koruyorsa sorun yok.
- BP (Battle Pass) ödülleri `[TASLAK]` aşamasında — kozmetiğin dışına çıkmaması gerekiyor.

---

## 5. Önerilen Sonraki Adımlar (Kod Değil, Kapsam Planı)

1. Coin (◎) ve Gem (◆P) kazanım yollarını netleştir
2. Mission sistemi ödüllerini tanımla (XP mi, Çekirdek mi, Gem mi)
3. Battle Pass sezon döngüsünü (süre, ödül çizelgesi) tasarla
4. AdMob gerçek ID'lerini üretim öncesinde ekle, `initializeForTesting: false` yap
5. Shop ekranında yalnızca `allowed` listesindeki öğeleri sat
