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
/* NORYVX V20.2.0 — Phase 3-5 design + touch + overdrive fixes.
   Phase 3: Chakra Petch/IBM Plex Mono fonts, logo underline, PLAY button redesign,
            floating hero particles, bottom nav IBM Plex Mono labels.
   Phase 4: Joystick indicator removed, dead zone + sqrt acceleration curve,
            diagonal normalization, MAG_MAX cap for jump artefact prevention.
   Phase 5: Overdrive sensitivity fix — overdriveMultiplier applied to velocity
            only, not input delta, so control precision is unchanged.
   Cache adi guncellendi (aksi halde eski asset'ler ilkanminlarak calisir). */
const CACHE = "neon-survivor-v23-0-0";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/icons/icon.svg",
  "./assets/atlas-units.json",
  "./assets/atlas-units.png",
  "./assets/atlas-items.json",
  "./assets/atlas-items.png",
  "./assets/neon-noryvx-icon.svg"
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
