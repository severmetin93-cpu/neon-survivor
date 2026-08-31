/* NORYVX — cache adi HER BUILD'DE degismeli. */
/* V25.1.2 — Day2: inject menu CSS + missions fixes into HTML responses (avoids 4MB index push). */
const CACHE = "neon-survivor-v25-1-2";

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

const INJECT_CSS = '<link href="css/nvx2-menu-polish.css" rel="stylesheet"/>';
const INJECT_JS  = '<script src="js/ms7-day2-fixes.js" defer></script>';

function injectDayMarkup(html) {
  if (typeof html !== "string") return html;
  let out = html;
  if (out.indexOf("nvx2-menu-polish.css") === -1) {
    if (out.indexOf('rel="manifest"') !== -1) {
      out = out.replace(
        /(<link[^>]*rel=["']manifest["'][^>]*\/?>)/i,
        "$1\n" + INJECT_CSS
      );
    } else if (out.indexOf("</head>") !== -1) {
      out = out.replace("</head>", INJECT_CSS + "\n</head>");
    }
  }
  if (out.indexOf("ms7-day2-fixes.js") === -1) {
    if (out.indexOf("</body>") !== -1) {
      out = out.replace("</body>", INJECT_JS + "\n</body>");
    } else {
      out += INJECT_JS;
    }
  }
  return out;
}

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
    (url.origin === self.location.origin && (url.pathname === "/" || url.pathname.endsWith("/")));

  if (isDoc) {
    event.respondWith(
      fetch(req)
        .then(async response => {
          if (!response || response.status !== 200) {
            const cached = await caches.match(req);
            if (cached) return injectResponse(cached);
            const fallback = await caches.match("./index.html");
            return fallback ? injectResponse(fallback) : response;
          }
          const injected = await injectResponse(response);
          try {
            const copy = injected.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          } catch (e) {}
          return injected;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return injectResponse(cached);
          const fallback = await caches.match("./index.html");
          return fallback ? injectResponse(fallback) : Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

async function injectResponse(response) {
  try {
    const ct = (response.headers.get("content-type") || "").toLowerCase();
    if (ct && ct.indexOf("text/html") === -1 && ct.indexOf("text/plain") === -1) {
      return response;
    }
    const text = await response.text();
    const out = injectDayMarkup(text);
    const headers = new Headers(response.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.delete("content-length");
    return new Response(out, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (e) {
    return response;
  }
}
