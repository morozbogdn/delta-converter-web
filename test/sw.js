const SCOPE = new URL('./', self.location).pathname;
const CACHE = 'delta-web-' + SCOPE + "test-1.3.0-5733d56f9dfc"; // привʼязано до папки: тестова версія і реліз на одному сайті не заважають одна одній
const CORE = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./DELTA_%D1%82%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D0%B8%D0%B9_%D1%84%D0%B0%D0%B9%D0%BB.xlsx"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('delta-web-' + SCOPE) && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin || !u.pathname.startsWith(SCOPE)) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const copy = r.clone(); e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copy))); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true, cacheName: CACHE }).then((r) => r || (e.request.mode === 'navigate' ? caches.match('./index.html', { cacheName: CACHE }) : Response.error()))));
});
