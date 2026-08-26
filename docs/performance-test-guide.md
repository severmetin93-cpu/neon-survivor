# NORYVX — Cihaz Üzerinde Performans Test Rehberi

> Bu rehber **senin** gerçek Android telefonda APK ile yapacağın testi anlatır.
> Claude bu adımları çalıştırmaz.

---

## Gereksinimler

- NORYVX APK yüklü Android cihaz
- ~15–20 dakika süre
- Bu dokümanı açık tutabileceğin ikinci bir ekran (veya çıktı notları)

---

## BÖLÜM 1 — Debug Panelini Açma

Debug paneli üretim UI'ında görünmez; gizli bir tap dizisiyle açılır.

1. Uygulamayı başlat — **Ana Menü** ekranı açılsın.
2. Ekranın üst kısmındaki büyük **"NORYVX"** yazısına (logo) **5 kez arka arkaya** dokun.
   - Her dokunuş arasındaki süre **1.2 saniyeden az** olmalı.
   - Doğru yapıldığında ekranın ortasında **"DEBUG AÇIK"** yazısı belirir ve
     telefon titreşir (vibrasyon açıksa).
3. Debug paneli artık aktif. Oyun oynarken sol alt köşede küçük bir metin kutusu
   görünecek.

> Kapatmak için aynı işlemi tekrarla → **"DEBUG KAPALI"** mesajı gelir.
> Panel tercih `localStorage`'a kaydedilir; uygulamayı yeniden başlatsan bile açık kalır.

---

## BÖLÜM 2 — Test Koşusu

### Başlamadan Önce

- Telefonu şarjdan çek (şarj sırasında CPU/GPU throttling davranışı değişir).
- Açık arka plan uygulamalarını kapat.
- Ekran parlaklığını normal kullanım seviyesine getir.

### Karakter Seçimi

- Hero Select ekranından **VANGUARD** seç (mevcut varsayılan; en stabil test ortamı).

### Koşu Adımları

| Adım | Ne Yapacaksın | Not |
|---|---|---|
| 0:00 | Koşuya başla | Debug panelinin sol altta göründüğünü teyit et |
| 0:00–2:00 | Normal oyna | Hareket et, düşman öldür, enerji topla |
| 2:00 | Bir durup debug panelini oku ve not al (ilk okuma) | Aşağıdaki metriklere bak |
| 2:00–8:00 | Oynamaya devam et | Level-up kartı seçimlerini normal yap |
| 8:00 | Tekrar dur, ikinci okuma | |
| 8:00–15:00 | Agresif oyna — mümkün olduğunca çok düşman ve elite öldür | Stres testi |
| 15:00 | Üçüncü ve son okuma | |
| Herhangi bir anda | Boss geldiğinde ek okuma yap | Boss sırasında yük artar |

---

## BÖLÜM 3 — Debug Panelinden Hangi Değerleri Okuyacaksın

Panel her 0.2 saniyede bir güncellenir. Şu satırlara odaklan:

```
POWER   player X.XX   threat X.XX
RATIO   X.XX  hedef X.XX  (±%) HEDEFTE / ZAYIF / ASIRI GUCLU
LEVEL   N  ·  TIER_ADI
────────────────────────────
DPS     ham X.XX   efektif X.XX
CLEAR   X.XX kill/s   spawn X.XX/s
ENEMY   N/CAP  yogunluk X.XX  ortHP X.XX
THREAT  hiz xX.XX  davranis xX.XX  tehdit xX.XX
```

### Raporlamam Gereken Değerler

Her okumada şu bilgileri not al:

| Zaman | RATIO | STATUS | DPS (ham) | ENEMY alive/cap | THREAT hız |
|---|---|---|---|---|---|
| 2. dakika | | | | | |
| 8. dakika | | | | | |
| 15. dakika | | | | | |
| Boss sırasında | | | | | |

---

## BÖLÜM 4 — Ek Gözlem Noktaları

### Görsel Takılma (Frame Drop)

Debug panelinde doğrudan FPS sayacı yok. Bunun yerine:
- Oyunun **gözle takılıp takmadığını** not et (özellikle çok parçacık varken)
- Takılma varsa: hangi anda oldu, kaçıncı dakikaydı, kaç düşman vardı?

### Particle / Efekt Yoğunluğu

Panel şunu gösterir:
```
ENEMY   alive / cap
```
`alive` değeri `cap` değerine yaklaştığında yükün arttığını gözlemle.
Bu noktada görsel takılma başlıyorsa beni bilgilendir.

### Silah Katkısı (Hasar Dağılımı)

Panelde:
```
SILAH KATKISI (olculen hasar payi)
 Pulse  Lv2   48%  1.23 k/s
 Plasma Lv1   32%  0.87 k/s
 ...
```
Hangi silahın ne kadar hasar verdiğini 15. dakikada not al.

---

## BÖLÜM 5 — Bana Geri Bildireceğin Bilgiler

Testi bitirince şunları paylaş:

1. **Doldurulan tablo** (Bölüm 3'teki 4 satır)
2. **Görsel takılma oldu mu?** → Evet/Hayır; olduysa kaçıncı dakikada, ne sırasında
3. **15. dakika RATIO durumu** → HEDEFTE mi, ZAYIF mi, ASIRI GUCLU mu
4. **Telefon modeli ve Android versiyonu** (throttling karşılaştırması için)
5. **Varsa dikkat çeken başka bir şey** (crash, beklenmedik UI davranışı vb.)

---

## Hata Senaryoları

| Sorun | Ne Yapmalısın |
|---|---|
| Debug paneli açılmıyor | Dokunuşlar çok yavaş olabilir — 5 dokunuşu 1 saniyenin içinde dene |
| Panel sol altta görünmüyor | Oyun başladıktan sonra 1–2 saniye bekle, panel gecikmeli oluşuyor |
| Uygulama kapanıyor (crash) | Hangi dakikada, hangi aksiyon sırasında olduğunu not al |
| Panel içeriği "0" gösteriyor | Run henüz başlamamış olabilir — hareket et ve düşman öldür |
