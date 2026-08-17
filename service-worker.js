/**
 * Service Worker for HadirTadz (v.1.0)
 * PWA Offline Assets Caching & Instant Loading
 */

const CACHE_NAME = 'hadirtadz-cache-v1.1';
const PAGE_CACHE_NAME = 'hadirtadz-pages-v1.1';
const STATIC_ASSETS = [
  './',
  './assets/css/custom.css',
  './assets/js/app.js',
  './assets/img/logo.svg',
  './assets/img/icon.svg',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/apexcharts'
];

// Install Event: Precaching Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[HadirTadz SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[HadirTadz SW] Pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== PAGE_CACHE_NAME) {
            console.log('[HadirTadz SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First with Cache Fallback for dynamic pages, Cache First for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only GET requests for same-origin or CDN are relevant
  if (request.method !== 'GET') return;

  // Handle static assets with Cache First (lokal + CDN Tailwind/Font/Chart/QR)
  if (
    url.pathname.includes('/assets/') ||
    request.url.includes('fonts.googleapis.com') ||
    request.url.includes('fonts.gstatic.com') ||
    request.url.includes('cdnjs.cloudflare.com') ||
    request.url.includes('cdn.tailwindcss.com') ||
    request.url.includes('cdn.jsdelivr.net') ||
    request.url.includes('unpkg.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request).then((networkResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          })
        );
      })
    );
    return;
  }

  // Handle HTML navigation & dynamic PHP with Network First, cache last-visit page
  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(PAGE_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() =>
          caches.open(PAGE_CACHE_NAME)
            .then((cache) => cache.match(request))
            .then((cachedPage) => cachedPage || offlineFallback())
        )
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => offlineFallback())
  );
});

function offlineFallback() {
  return new Response(
    `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline - HadirTadz</title><style>body{font-family:sans-serif;background:#091e17;color:white;text-align:center;padding:40px;}</style></head><body><h1>HadirTadz</h1><p>Anda sedang offline. Silakan periksa koneksi internet Anda.</p></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
