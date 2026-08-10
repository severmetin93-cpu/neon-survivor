/* Neon Survivor — offline cache (cache-first, stale-while-revalidate) */
const CACHE = "neon-survivor-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c =>
        Promise.allSettled(
          ASSETS.map(a => c.add(a))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE)
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request)
        .then(res => {
          if (
            res &&
            res.status === 200 &&
            res.type === "basic"
          ) {
            const copy = res.clone();

            caches.open(CACHE)
              .then(c => c.put(e.request, copy))
              .catch(() => {});
          }

          return res;
        })
        .catch(() =>
          hit || caches.match("./index.html")
        );

      return hit || net;
    })
  );
});
