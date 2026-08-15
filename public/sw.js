/* Service Worker HadirTadz — PWA / Offline Mode (DEVELOPMENT_RULES #15) */
const CACHE = 'hadirtadz-v1';
const PRECACHE = [
  '/',
  '/login',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Network-first untuk navigasi (fallback cache saat offline), stale-while-revalidate untuk API GET. */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API dinamis: coba jaringan dulu, fallback ke cache bila offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Aset statis & halaman: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(request, res.clone());
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

/* Push Notification (placeholder minimal, mekanisme push nyata via server nanti) */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'HadirTadz', {
      body: data.body || 'Ada pembaruan presensi di HadirTadz.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.url || '/login',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data) {
    const target = event.notification.data.url || '/login';
    event.waitUntil(clients.openWindow(target));
  }
});