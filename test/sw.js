const SCOPE = new URL('./', self.location).pathname;
// привʼязано до папки: тестова версія (test/) і реліз (корінь) на одному сайті не чіпають кешів одна одної
const PREFIX = 'delta-web|' + SCOPE + '|';
const CACHE = PREFIX + "test-1.6.0-618ab7018e8b";
const OLD = ['delta-web-' + SCOPE + 'test-', 'delta-web-' + SCOPE + 'release-']; // кеші попереднього service worker (до ШВ.2)
const CORE = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
// бібліотеки й тестовий файл: сторінка бере їх, лише коли потрібні, а памʼять докачує їх у фоні — після першого відкриття вони є і без інтернету
const LAZY = ["./lib/lib-xlsx.js","./lib/lib-pdfworker.js","./lib/lib-pdf.js","./lib/lib-milsymbol.js","./lib/lib-ai.js","./DELTA_%D1%82%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D0%B8%D0%B9_%D1%84%D0%B0%D0%B9%D0%BB.xlsx"];
// повз HTTP-кеш браузера: інакше новий sw.js міг би покласти в нову версію старі файли
const fresh = (url) => new Request(url, { cache: 'no-cache' });
// без поспіху і без вимог: файл, що не прийшов, докачається з наступним відкриттям
const warm = () => caches.open(CACHE).then((c) => Promise.all(LAZY.map((u) => c.match(u).then((hit) => hit || fetch(fresh(u)).then((r) => (r.ok ? c.put(u, r) : undefined), () => undefined)))));
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE.map(fresh))));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && (k.startsWith(PREFIX) || OLD.some((o) => k.startsWith(o)))).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => {
  const type = e.data && e.data.type;
  if (type === 'SKIP_WAITING') self.skipWaiting();
  else if (type === 'WARM') e.waitUntil(warm());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== self.location.origin || !u.pathname.startsWith(SCOPE)) return;
  if (req.mode === 'navigate') e.waitUntil(warm());
  e.respondWith(caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok && r.type === 'basic') { const copy = r.clone(); e.waitUntil(c.put(req, copy)); }
    return r;
  }, () => (req.mode === 'navigate' ? c.match('./index.html') : Promise.resolve()).then((r) => r || Response.error())))));
});
