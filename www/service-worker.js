/* NORYVX V26.1.0 — force visual plane pack, network-first code */
const CACHE = "neon-survivor-v26-1-0";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
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
  "./js/noryvx-visual-force.js",
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
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isDoc(req, url) {
  return (
    req.mode === "navigate" ||
    req.destination === "document" ||
    /\/index\.html($|\?)/.test(req.url) ||
    (url.origin === self.location.origin && (url.pathname === "/" || url.pathname.endsWith("/")))
  );
}

function isCode(url) {
  return /\.(js|css)($|\?)/i.test(url.pathname);
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const req = event.request;
  const url = new URL(req.url);

  if (isDoc(req, url) || isCode(url)) {
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
