# NORYVX — Firebase Analytics Entegrasyon Planı

> **Durum:** Plan aşaması — hiçbir kod değişikliği yapılmadı.
> **Tarih:** 2026-08-26
> **Kapsam:** Sadece analiz/ölçüm altyapısı. Gameplay/balance/UI değişikliği yok.

---

## 1. Mevcut Durum — Ne Var, Ne Eksik

### Mevcut
| Bileşen | Durum | Not |
|---------|-------|-----|
| `@capacitor-community/admob` | ✅ Kurulu | `package.json` dependencies içinde |
| `capacitor.config.json` → AdMob plugin config | ✅ Var | Test App ID ile yapılandırılmış |
| `android/` klasörü | ✅ Var | Gradle build çalışıyor |
| AdMob `google-services.json` | ⚠️ Belirsiz | AdMob çalışıyor ama dosya `android/app/` altında görünmüyor — AdMob plugin bunu kendi yönetiyor olabilir |

### Eksik
| Bileşen | Durum |
|---------|-------|
| `@capacitor-community/firebase-analytics` paketi | ❌ Kurulu değil |
| `google-services.json` (Analytics içeren) | ❌ Yok |
| Firebase projesi | ❌ Oluşturulmamış |
| `www/index.html` içinde `logEvent` çağrıları | ❌ Hiç yok |

---

## 2. Kurulacak Paket

```bash
npm install @capacitor-community/firebase-analytics
npx cap sync android
```

> **Henüz çalıştırma.** Sen onay verdikten sonra yapılacak.

Bu paket Capacitor üzerinden Firebase Analytics Android SDK'sını sarmalar.
Web tarafında `window.Capacitor.Plugins.FirebaseAnalytics.logEvent(...)` çağrısıyla
event gönderilir.

---

## 3. Firebase Console'da Sen Yapacaksın (Tarayıcı Adımları)

Bu adımlar Claude'un yapamayacağı, Firebase web arayüzünden elle yapılması gereken adımlar:

1. **Firebase Console'a git:** https://console.firebase.google.com
2. **Yeni proje oluştur:**
   - Proje adı: `NORYVX` (veya istediğin)
   - Google Analytics: **Etkinleştir** (varsayılan açık gelir)
3. **Android uygulaması ekle:**
   - Android package name: `com.tumes.neonsurvivor` *(capacitor.config.json'daki appId)*
   - App nickname: `NORYVX Android`
   - Debug signing certificate SHA-1: isteğe bağlı, şimdilik boş bırakabilirsin
4. **`google-services.json` indir:**
   - Firebase sana bir dosya indirecek
   - Bu dosyayı `android/app/google-services.json` olarak kaydet
5. **Analytics'i etkinleştir:**
   - Firebase Console → Analytics → "Analytics'i etkinleştir" (proje oluştururken seçtiysen zaten açık)

> **Not:** Eğer AdMob zaten bir Firebase projesiyle bağlantılıysa (aynı Google hesabı),
> mevcut projeye Android app eklemek yeterli olabilir. App ID'lerin çakışmadığından emin ol.

---

## 4. Takip Edilecek Event Listesi

### `run_start`
**Tetikleyici:** Oyuncu "OYNA" butonuna basar, run başlar.
**Parametreler:**
```js
{ hero: string, weapon: string, run_count: number }
```

### `run_end`
**Tetikleyici:** Run biter (ölüm veya quit).
**Parametreler:**
```js
{
  reason: "death" | "quit",
  score: number,
  duration_sec: number,
  wave: number,
  kills: number,
  level_reached: number
}
```

### `level_up`
**Tetikleyici:** Oyuncu run içinde level atlar, perk seçim ekranı açılır.
**Parametreler:**
```js
{ level: number, perk_chosen: string }
```

### `ad_watched`
**Tetikleyici:** Rewarded veya interstitial reklam tamamlandı.
**Parametreler:**
```js
{ ad_type: "rewarded" | "interstitial", context: string }
// context örnekleri: "revive", "double_run_reward", "double_daily", "resource_boost", "run_transition"
```

### `mission_completed`
**Tetikleyici:** Oyuncu günlük veya haftalık görev tamamlar ve ödülü claim eder.
**Parametreler:**
```js
{ mission_type: "daily" | "weekly", mission_id: string, reward_coins: number }
```

### `achievement_unlocked`
**Tetikleyici:** Yeni başarım unlock olur (`achievementsUnlocked.push` anı).
**Parametreler:**
```js
{ achievement_id: string }
```

### `item_purchased` *(IAP hazır olduğunda)*
**Parametreler:**
```js
{ item_id: string, price_usd: number, currency: "USD" }
```
> Şu an IAP yok. İleride eklendiğinde bu event yerleştirilir.

---

## 5. Hook Noktaları — Kod Planı (Değişiklik Yapılmadı)

Tüm hook'lar `www/index.html` içine eklenecek. Merkezi bir yardımcı fonksiyon
(`window.NORYVXAnalytics.log`) yazılacak; bu fonksiyon Capacitor plugin'i
wrap ederek hem native hem de web (no-op) ortamda güvenle çalışır.

### `run_start` → `startGame()` — satır 11005
```
function startGame() {
  // ... mevcut kod ...
  // HOOK: NORYVXAnalytics.log("run_start", { hero, weapon, run_count })
}
```

### `run_end` → `MissionsDB.onRunEnd(...)` bloğu — satır 7985–8010
Bu blok zaten `score`, `time`, `kills`, `wave`, `weapon` bilgilerini topluyor.
`MissionsDB.onRunEnd(...)` çağrısının hemen öncesine veya sonrasına hook eklenecek:
```
// HOOK: NORYVXAnalytics.log("run_end", { reason, score, duration_sec, wave, kills, level_reached })
```
`reason` tespiti: `player.hp <= 0` → `"death"`, değilse → `"quit"`.

### `level_up` → `openLevelUp()` — satır 11453
```
function openLevelUp() {
  // ... mevcut kod ...
  // HOOK: NORYVXAnalytics.log("level_up", { level: Game.level, perk_chosen: "?" })
}
// perk_chosen: chooseRunPerk() içinde seçim sonrası loglanabilir
```

### `ad_watched` → `NORYVXAdService.showRewarded` / `showInterstitial` — satır 20663–20699
Her iki fonksiyonun `completed` callback'i içine hook eklenecek:
```
// showRewarded callback: NORYVXAnalytics.log("ad_watched", { ad_type:"rewarded", context })
// showInterstitial callback: NORYVXAnalytics.log("ad_watched", { ad_type:"interstitial", context })
```

### `mission_completed` → `MissionsDB.claimDaily` / `claimWeekly` — satır 22171 / 22195
```
claimDaily: function(idx) {
  // ... mevcut kod ...
  // HOOK: NORYVXAnalytics.log("mission_completed", { mission_type:"daily", mission_id, reward_coins })
}
```

### `achievement_unlocked` → `achievementsUnlocked.push(a.id)` — satır 22120
```
try { if(a.check(totals)) {
  d.achievementsUnlocked.push(a.id);
  // HOOK: NORYVXAnalytics.log("achievement_unlocked", { achievement_id: a.id })
}}
```

---

## 6. Uygulama Sırası (Onay Sonrası)

1. Sen Firebase Console'da projeyi oluştur ve `google-services.json` indirip `android/app/` altına koy
2. `npm install @capacitor-community/firebase-analytics`
3. `android/app/build.gradle` içine Firebase Analytics bağımlılığı ekle (plugin bunu otomatik yapabilir, kontrol edilecek)
4. `www/index.html` içine `NORYVXAnalytics` wrapper objesi ekle
5. Yukarıdaki 6 hook noktasına `logEvent` çağrıları ekle
6. `npx cap sync android && ./gradlew assembleDebug` ile build ve test
