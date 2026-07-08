const CACHE = 'trip-v4';
const ASSETS = ['./paris-barcelona-trip.html', './'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Never cache the sync API or non-GET requests — always hit the network so
  // cross-device state is live, not replayed from a stale cache.
  if (url.pathname.startsWith('/api/') || e.request.method !== 'GET') return;
  // Page navigations: network-first so the HTML is never stale, fall back to cache offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('./paris-barcelona-trip.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    if (res && res.status === 200) {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
    }
    return res;
  }).catch(() => caches.match('./paris-barcelona-trip.html'))));
});
