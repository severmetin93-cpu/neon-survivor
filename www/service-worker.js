/* NORYVX — cache adi HER BUILD'DE degismeli.
   ONCE: "neon-survivor-v4" V15.5'ten beri hic degismemisti. activate
   asamasi eski cache'leri temizliyor ama SADECE ad degistiginde
   tetikleniyor; ad sabit kaldigi icin hicbir zaman temizlenmedi ve
   fetch cache-first oldugu icin cihaz ilk kurulumdaki index.html'i
   sonsuza kadar sunmaya devam etti. Yeni APK'larda eski oyunun
   gorunmesinin sebebi buydu.
   SONRA: ad surumle birlikte degisir. */
/* V16.8.0 — sprite atlas eklendi. Varliklar CACHE-FIRST oldugu icin
   cache adi degismezse yeni atlas cihaza HIC ULASMAZ; dosyanin en
   ustundeki notun tarif ettigi hata tam olarak budur. Ad bu yuzden
   surumle birlikte yukseltildi. Temizleme mantigi degismedi. */
/* V17.0.0 — UI_SET_60 Phase 2: atlas-icons.png eklendi.
   Onceki listede var olan atlas-units/items dosyalari www/assets altinda
   mevcut degildi (pre-existing sorun); ASSETS listesi temizlendi. */
/* V18.0.0 — manifest.json duzeltildi: mevcut olmayan PNG ikonlar kaldirildi,
   icon.svg eklendi. manifest cache-first oldugu icin cache adi yukseltildi. */
/* V19.0.0 — Phase 12-15 UI sprint: token sistemi tamamlandi, AYARLAR ekrani,
   oyun-sonu dalga/seviye/sektor, iOS status bar meta tag eklendi.
   index.html network-first oldugu icin cache adi sadece eski neon-survivor-v18
   cache'lerini temizlemek icin yukseltildi. */
/* V19.1.0 — Phase 18 PWA/offline QA: manifest.json guncellendi (lang:tr,
   purpose:"any maskable"). manifest cache-first oldugu icin cache adi
   yukseltildi; eski manifest artik bir dahaki acilista temizlenecek. */
/* V20.0.0 — Phase 20 release: BALANCE.version "20.0.0"'a yukseltildi,
   console.warn bagimlilık uyarılari kaldirildi, tum versiyon fallback'leri
   guncellendi. Cache adi degisiyor — eski v19 entry'leri temizlenecek. */
const CACHE = "neon-survivor-v20-0-0";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/icons/icon.svg",
  "./assets/atlas-icons.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => {
        return Promise.allSettled(
          ASSETS.map(asset => cache.add(asset))
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            /* Guncel cache disindaki TUM neon-survivor cache'leri silinir.
               Yabanci originlerin cache'lerine dokunulmaz. */
            .filter(key => key !== CACHE)
            .filter(key => key.indexOf("neon-survivor") === 0)
            .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  /* index.html / navigasyon istekleri NETWORK-FIRST.
     Diger varliklar (ikon, manifest) eskisi gibi CACHE-FIRST kalir.
     Neden: cache-first index.html, cache adi degismedigi surece yeni
     build'i hicbir zaman gostermiyordu. Network-first ile yeni dosya
     her acilista alinir; cevrimdisi durumda cache'e dusulur. */
  const req = event.request;
  const isDoc =
    req.mode === "navigate" ||
    (req.destination === "document") ||
    /\/index\.html($|\?)/.test(req.url) ||
    /\/$/.test(new URL(req.url).pathname);

  if (isDoc) {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE)
              .then(cache => cache.put(req, copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => {
          return caches.match(req)
            .then(hit => hit || caches.match("./index.html"));
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          return cached;
        }

        return fetch(event.request)
          .then(response => {
            if (
              response &&
              response.status === 200 &&
              response.type === "basic"
            ) {
              const copy = response.clone();

              caches.open(CACHE)
                .then(cache => cache.put(event.request, copy))
                .catch(() => {});
            }

            return response;
          })
          .catch(() => {
            return caches.match("./index.html");
          });
      })
  );
});
