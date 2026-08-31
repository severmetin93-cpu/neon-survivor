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
/* NORYVX V20.3.0 — Full combat HUD redesign.
   Boss HUD redesigned as full card (name, phase label, threat, segmented bar).
   Weapon pills: 48x38px per design spec.
   Power pills: horizontal flex layout with name+time.
   Hull bar: player HP displayed during gameplay.
   Score display: live score shown in wave HUD during combat.
   Touch handlers: hero-select upgraded to tap() system, back button uses tap().
   Cache adi guncellendi (aksi halde eski asset'ler ilkanimlandiktan sonra calisir). */
const CACHE = "neon-survivor-v25-1-1";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/icons/icon.svg",
  "./assets/atlas-units.json",
  "./assets/atlas-units.png",
  "./assets/atlas-items.json",
  "./assets/atlas-items.png",
  "./assets/neon-noryvx-icon.svg",
  "./css/nvx2-menu-polish.css",
  "./js/ms7-day2-fixes.js"
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
