// Offline-Cache: nur eigene Dateien, keine externen Anfragen.
const CACHE = 'gsc-v3';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-512.png', 'lib/zxing.min.js'];
const LAZY = ['lib/tesseract.min.js', 'lib/worker.min.js', 'lib/core/tesseract-core-lstm.wasm.js', 'lib/core/tesseract-core-simd-lstm.wasm.js', 'lib/lang/eng.traineddata.b64.txt'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).then(() => c.addAll(LAZY).catch(() => {}))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // index.html: erst Netz (für neue Verzeichnis-Stände), sonst Cache
  if (e.request.mode === 'navigate'){
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('index.html', c)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
    return r;
  })));
});
