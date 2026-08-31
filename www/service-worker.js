/* NORYVX — cache adi HER BUILD'DE degismeli. */
/* V25.1.3 — HOTFIX: remove full-HTML inject (caused black screen on Android WebView).
   index.html already has CSS/JS links from patch-index-links workflow. */
const CACHE = "neon-survivor-v25-1-3";

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
      .then(cache => Promise.allSettled(ASSETS.map(a => cache.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .filter(key => key.indexOf("neon-survivor") === 0)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const req = event.request;
  const url = new URL(req.url);
  const isDoc =
    req.mode === "navigate" ||
    req.destination === "document" ||
    /\/index\.html($|\?)/.test(req.url) ||
    (url.origin === self.location.origin &&
      (url.pathname === "/" || url.pathname.endsWith("/")));

  if (isDoc) {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() =>
          caches.match(req).then(hit => hit || caches.match("./index.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req)
        .then(response => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
