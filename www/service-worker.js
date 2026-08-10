const CACHE = "neon-survivor-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/icons/icon.svg"
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
            .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

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
