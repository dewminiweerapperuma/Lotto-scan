const CACHE = "lottoscan-web-v1";
const STATIC = ["/", "/results", "/check", "/about", "/admin"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (new URL(e.request.url).pathname.startsWith("/api/")) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ error: "Offline" }), { headers: { "Content-Type": "application/json" }, status: 503 })));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
    if (e.request.method === "GET" && res.status === 200) {
      caches.open(CACHE).then(c => c.put(e.request, res.clone()));
    }
    return res;
  }).catch(() => caches.match("/"))));
});
