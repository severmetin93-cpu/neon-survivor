# QA Checklist — NEON SURVIVOR V20.0.0

Her release öncesi bu liste baştan sona gözden geçirilmeli.
Tamamlanan her madde işaretlenir. `[P0]` maddeler çözülmeden APK gönderilemez.

---

## 1. Build & Signing `[P0]`

- [x] `capacitor.config.json` → `webContentsDebuggingEnabled: false`
- [ ] `build-apk.yml` signed APK üretiyor (`jar verified` çıktısı mevcut)
- [x] `versionCode 20`, `versionName "20.0.0"` (android/app/build.gradle)
- [x] `www/index.html` başlığı `NORYVX V20.0.0` içeriyor
- [x] v20.0.0 git tag push edildi, CI `build-apk.yml` yeşil
- [ ] Signed APK gerçek cihaza kuruldu, açılıyor

---

## 2. Uygulama Başlatma

- [ ] Uygulama sorunsuz açılıyor — siyah flash, beyaz ekran veya crash yok
- [ ] Ana menü tam yükleniyor, tüm butonlar dokunulabilir
- [ ] Arka plan rengi `#04060f` (siyah) — sistem teması veya WebView beyazı yok
- [ ] Notch / punch-hole ekranlarda içerik safe-area'nın içinde kalıyor
- [ ] Farklı ekran oranlarında (16:9, 19:9, 20:9) layout bozulmuyor
- [ ] Ekran kilidi açıldıktan sonra uygulama görünür ve işlevsel

---

## 3. Atlas Sprite Yüklemesi

- [ ] `atlas-units.png` ve `atlas-units.json` başarıyla yükleniyor (hata yok)
- [ ] Vanguard, Striker, Controller oyuncuları atlas sprite ile çiziliyor (procedural değil)
- [ ] Boss ve Elite atlas sprite ile çiziliyor
- [ ] Hunter ve Weaver atlas sprite ile çiziliyor
- [ ] Tank, Orbiter, Dasher — atlas sprite ile çiziliyor (procedural fallback değil)
- [ ] Sprite boyutları ve hizalaması `ATLAS.k` katsayılarıyla tutarlı

---

## 4. Temel Oynanış `[P0]`

- [ ] Karakter ekranda görünüyor ve joystick'e tepki veriyor
- [ ] Düşmanlar spawn oluyor (hunter, tank, orbiter, dasher, weaver)
- [ ] Düşmanlar oyuncuyu takip ediyor, çarpışma algılama çalışıyor
- [ ] Varsayılan Pulse silahı ateşleniyor
- [ ] Hasar alındığında can çubuğu güncelleniyor
- [ ] Oyuncu ölünce game-over ekranı açılıyor, kilitleme yok
- [ ] Game-over ekranında süre, skor ve wave sayısı doğru gösteriliyor

---

## 5. XP & Wave Sistemi

- [ ] XP toplanıyor, seviye atlıyor
- [ ] Seviye atlandığında kart seçim ekranı açılıyor
- [ ] Kart seçilemiyor olsa bile oyun kilitlenmiyor (fallback kart görünüyor)
- [ ] Wave sayacı HUD'da görünüyor, her ~30 saniyede artıyor
- [ ] Run süresi 3+ dakikada oyun hâlâ akıcı (bellek veya frame sorun yok)

---

## 6. Silah & Build Sistemi

- [ ] Plasma, Arc, Nova Burst kart seçiminde açılıyor ve ateşleniyor
- [ ] Silah seviyesi artışında hasar arttığı görülüyor
- [ ] Lv5'te evrim kartı çıkıyor
- [ ] Rarity renkleri (COMMON gri → LEGENDARY altın) doğru görünüyor
- [ ] Sinerji aktif olduğunda efekti görülüyor (Overcharge, ChainReactor, Meltdown)

---

## 7. Karakter & Phase 3

- [ ] Karakter seçim ekranı açılıyor (Vanguard / Striker / Controller)
- [ ] Seçim uygulama yeniden açıldıktan sonra korunuyor
- [ ] Vanguard seçiliyken hasar alımı Striker'a kıyasla daha düşük
- [ ] Striker seçiliyken silah hasarı Vanguard'a kıyasla daha yüksek
- [ ] Controller seçiliyken pickup manyetik alanı daha geniş
- [ ] Karakter XP'si run bitiminde artıyor, kaydediliyor

---

## 8. Boss & Elite

- [ ] Boss yüksek run seviyesinde spawn oluyor, gözle ayırt edilebilir boyut
- [ ] Boss yüzde ellide hız ve ateş hızı artıyor (Phase 2)
- [ ] Elite düşman run sırasında beliriyor, modifikatör davranışı görünür
- [ ] Boss veya Elite spawn sırasında frame düşmesi yok

---

## 9. Meta İlerleme & Ekonomi

- [ ] Krediler ve shard'lar run sonunda gösteriliyor
- [ ] Meta yükseltme satın alınıyor ve sonraki run'da etkisi görülüyor
- [ ] Ekipman slotu eklenip etkinleştiriliyor
- [ ] "Kayıt & Yedek" ekranından dışa aktarma çalışıyor
- [ ] Dışa aktarılan veri içe aktarılıyor, ilerleme korunuyor

---

## 10. Kayıt & Veri Bütünlüğü

- [ ] Uygulama kapatılıp açıldıktan sonra ilerleme korunuyor
- [ ] localStorage temizlenip yeniden açıldığında uygulama crash etmiyor
- [ ] SCHEMA_VERSION=2 ile kaydedilmiş veri doğru okunuyor
- [ ] Bozuk JSON kaydında uygulama sıfırdan başlıyor, kilitlenmiyor

---

## 11. UI Ekranları

- [ ] Tüm menü sekmeleri açılıyor ve içerikleri yükleniyor
- [ ] AYARLAR ekranında ses toggle'ları çalışıyor
- [ ] BAŞARIMLAR listesi görünüyor, tamamlananlar işaretli
- [ ] GÖREVLER ekranı yükleniyor
- [x] BATTLE PASS ve LİDERLİK butonları menüde **görünmüyor** (hidden) `[P0]`
- [ ] Hiçbir ekranda boş veya kırık element yok

---

## 12. Android Cihaz

- [ ] Android 8.0+ cihazda kurulum ve çalışma sorunsuz
- [ ] Arka plana alınıp ön plana getirildiğinde crash yok
- [ ] Sistem geri tuşu / gesture navigation uygulamayı kapatmıyor, menüye dönüyor
- [ ] Dokunma gecikmesi yok (joystick ve UI butonları)
- [ ] Uzun oturumda (10+ dakika) belirgin yavaşlama veya aşırı ısınma yok

---

## 13. UI Set Dosya Varlığı

Bu bölüm yalnızca **dosyaların repoda mevcut olduğunu** doğrular.
Oyun UI'sına entegrasyon ayrıca test edilmelidir.

- [ ] UI Sets 01–60 dosyaları repoda mevcut
- [ ] Her set bağımsız adreslenebilir
- [ ] JSON manifest dosyaları korunmuş
- [ ] Integration guide dosyaları korunmuş
- [ ] Set 60 global UI konvansiyonları referans olarak kullanılıyor
- [ ] Hiçbir set yıkıcı şekilde başka bir setle birleştirilmemiş
- [ ] **UI oyun ekranlarına entegrasyon gerçek cihazda ayrıca doğrulandı** (yukarıdaki bölümlerde)

---

## 14. Release Son Kontrol `[P0]`

- [ ] Bölüm 1–13 arasındaki tüm `[P0]` maddeler tamamlandı
- [ ] CI `android-build.yml` son push'ta yeşil
- [ ] CI `build-apk.yml` v20.0.0 tag'inde yeşil, signed artifact mevcut
- [ ] Signed APK gerçek cihazda baştan sona test edildi
- [ ] Play Store listeleme metni ve ekran görüntüleri hazır
