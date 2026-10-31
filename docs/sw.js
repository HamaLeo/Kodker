// Service worker: network-first (هەمیشە نوێترین وەشان)، و ئەگەر ئینتەرنێت نەبوو لە cache.
const CACHE = 'kodker-v1';
const FILES = ['./', 'index.html', 'tutorial.html', 'style.css', 'kodker.js', 'examples.js', 'runner.js', 'worker.js', 'canvas.js', 'game.js', 'editor.js', 'app.js', 'tutorial.js', 'lessons.js', 'certificate.js', 'logo.svg', 'favicon.svg', 'manifest.webmanifest',
  'fonts/vazirmatn-arabic-400-normal.woff2', 'fonts/vazirmatn-arabic-700-normal.woff2', 'fonts/vazirmatn-arabic-800-normal.woff2',
  'fonts/vazirmatn-latin-400-normal.woff2', 'fonts/vazirmatn-latin-700-normal.woff2', 'fonts/vazirmatn-latin-800-normal.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});
