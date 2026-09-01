/* NORYVX V26.0.0 — network-first for JS/CSS, hard cache bust */
const CACHE = "neon-survivor-v26-0-0";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/icons/icon.svg",
  "./assets/neon-noryvx-icon.svg",
  "./css/nvx2-menu-polish.css",
  "./css/noryvx-shop-day3.css",
  "./css/noryvx-gameplay-pro.css",
  "./js/ms7-day2-fixes.js",
  "./js/noryvx-day3-shop.js",
  "./js/noryvx-p3-global.js",
  "./js/noryvx-1945-runtime.js",
  "./js/noryvx-airforce-theme.js",
  "./js/noryvx-hero-assets.js",
  "./js/noryvx-powerups.js",
  "./js/noryvx-difficulty.js",
  "./js/noryvx-combo.js",
  "./js/noryvx-damage-items.js",
  "./js/noryvx-gameplay-pro.js",
  "./assets/hero-vanguard.svg",
  "./assets/hero-striker.svg",
  "./assets/hero-controller.svg"
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
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isDocRequest(req, url) {
  return (
    req.mode === "navigate" ||
    req.destination === "document" ||
    /\/index\.html($|\?)/.test(req.url) ||
    (url.origin === self.location.origin &&
      (url.pathname === "/" || url.pathname.endsWith("/")))
  );
}

function isCodeAsset(url) {
  return /\.(js|css)($|\?)/i.test(url.pathname);
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const req = event.request;
  const url = new URL(req.url);

  /* HTML + JS + CSS: network-first so APK/PWA always try latest */
  if (isDocRequest(req, url) || isCodeAsset(url)) {
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

  /* Other assets: cache-first */
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
