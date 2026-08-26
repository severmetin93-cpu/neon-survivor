# NORYVX — Asset Audit

> Tarih: 2026-08-26 | Dizin: `www/assets/`

---

## 1. Silah Assetleri

### Mevcut Dosyalar

| Silah | SVG | PNG | SVG Boyut | PNG Boyut |
|---|---|---|---|---|
| PULSE | `weapon-pulse.svg` | `weapon-pulse.png` | 1.2 KB | 48.2 KB |
| PLASMA | `weapon-plasma.svg` | `weapon-plasma.png` | 1.2 KB | 59.6 KB |
| ARC | `weapon-arc.svg` | `weapon-arc.png` | 1.1 KB | 49.2 KB |
| NOVA | `weapon-nova.svg` | `weapon-nova.png` | 1.2 KB | 47.1 KB |

4 silahın tamamı için hem SVG hem PNG mevcut.

### Kod Hangisini Kullanıyor?

`index.html` içinde `assets/weapon-*.svg` veya `assets/weapon-*.png` dosya yolu
**hiçbir yerde referans verilmiyor.** Silah görselleri şu yolla sunuluyor:

- **Weapon seçim kartları** (`scr-rpgchar` içindeki butonlar): `data:image/png;base64,...`
  ile **inline base64 PNG** olarak gömülü (satır ~3124).
- **Atlas-items.png** (`assets/atlas-items.png`): `weapon` frame'i içeriyor, CSS
  background-image olarak kullanılıyor (satır 1815).

**Sonuç:** `www/assets/weapon-*.svg` ve `www/assets/weapon-*.png` dosyaları
şu an **kullanılmıyor.** Silinmez ama gelecekteki refactor için not düşülmeli.

---

## 2. Hero/Karakter Assetleri

### Mevcut Hero PNG'leri

| Dosya | Boyut | Durum |
|---|---|---|
| `hero-vanguard.png` | 37.9 KB | Mevcut |
| `hero-striker.png` | 36.6 KB | Mevcut |
| `hero-controller.png` | 32.9 KB | Mevcut |

**Eksik:** `hero-noryx.png`, `hero-shadow.png`, `hero-rex.png`, `hero-vega.png`,
`hero-luxia.png` — 5-hero planının NORYX/SHADOW/REX/VEGA/LUXIA karakterlerine ait
hiçbir PNG dosyası `assets/` klasöründe yok.

### Mevcut Karakterler Koda Nasıl Yükleniyor?

- **Sprite Atlas (`atlas-units.png`):** `loadAtlas()` fonksiyonu
  `./assets/atlas-units.png` yükler. Atlas içinde `vanguard`, `striker`,
  `controller` frame'leri tanımlı ve oyun içi (canvas) render için kullanılıyor.
- **Menü hero görselleri:** `#nvx-intro-hero`, `#scr-rpgchar` içindeki hero resmi
  de **inline base64** olarak gömülü — dosya sistemi PNG'si kullanılmıyor.

### Prosedürel Fallback Çalışıyor mu?

Evet. `atlasDraw()` çağrısı öncesinde `atlasHas(name)` kontrolü var:

```js
if(atlasHas("vanguard")){
  atlasDraw("vanguard", 47);
} else {
  // procedural çizim (geometrik şekil)
}
```

Atlas yüklenemezse veya bir frame eksikse (`ATLAS.ready = false`) sistem otomatik
olarak prosedürel (geometrik/neon) render'a geçer. NORYX/SHADOW/REX/VEGA/LUXIA
için atlas frame'leri de olmadığından şu an prosedürel fallback kesinlikle aktif.

---

## 3. Diğer Assetler

| Dosya | Boyut | Kullanım |
|---|---|---|
| `atlas-units.png` | 433.7 KB | Oyun içi enemy + hero sprite atlas |
| `atlas-units.json` | 485 B | Atlas frame haritası (JS'e hardcoded kopyası da var) |
| `atlas-items.png` | 51.1 KB | Item/loot ikonları (CSS bg) |
| `atlas-items.json` | 403 B | Item frame haritası |
| `neon-noryvx-icon.svg` | 5.0 KB | Service Worker cache'e alınan uygulama ikonu |
| `icons/` (klasör) | — | PWA ikonları (manifest.json için) |

---

## 4. Özet — Kullanılmayan / Dikkat Gereken Dosyalar

| Dosya | Durum | Öneri |
|---|---|---|
| `weapon-pulse.svg` | Kullanılmıyor | Silme; ileride SVG render'a geçişte kaynak olabilir |
| `weapon-plasma.svg` | Kullanılmıyor | Aynı |
| `weapon-arc.svg` | Kullanılmıyor | Aynı |
| `weapon-nova.svg` | Kullanılmıyor | Aynı |
| `weapon-pulse.png` | Kullanılmıyor | Silme; base64 ile değiştirildi |
| `weapon-plasma.png` | Kullanılmıyor | Aynı |
| `weapon-arc.png` | Kullanılmıyor | Aynı |
| `weapon-nova.png` | Kullanılmıyor | Aynı |

**Hiçbir dosya silinmedi — bu rapor yalnızca tespittir.**
