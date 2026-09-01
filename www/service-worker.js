/* NORYVX V27.0.0 — extracted CSS/JS for performance */
const CACHE = "noryvx-v27-0-0";

const ASSETS = [
  "./",
  "./index.html",
  "./css/noryvx-combined.css",
  "./js/noryvx-1945-runtime.js",
  "./js/noryvx-extracted-0.js",
  "./assets/hero-vanguard.png",
  "./assets/hero-striker.png",
  "./assets/hero-controller.png",
  "./assets/enemy-scout.svg",
  "./assets/enemy-assault.svg",
  "./assets/enemy-elite.svg",
  "./assets/enemy-boss.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const req = event.request;
  const url = new URL(req.url);
  const isCode =
    /\.(js|css|png|svg)($|\?)/i.test(url.pathname) ||
    req.mode === "navigate" ||
    /index\.html/i.test(url.pathname);

  if (isCode) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then(h => h || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
