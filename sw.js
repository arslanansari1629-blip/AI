/* BotForge service worker — offline-first static shell.
   Bump CACHE when shipping meaningful changes. */

const CACHE = 'botforge-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/base.css',
  './assets/css/app.css',
  './assets/js/main.js',
  './assets/js/ui.js',
  './assets/js/store.js',
  './assets/js/telegram.js',
  './assets/js/runtime.js',
  './assets/js/templates.js',
  './assets/js/codegen.js',
  './assets/js/deploy.js',
  './assets/js/chat.js',
  './assets/js/zip.js',
  './assets/js/io.js',
  './assets/js/views/home.js',
  './assets/js/views/builder.js',
  './assets/js/views/bots.js',
  './assets/js/views/runtime.js',
  './assets/js/views/templates.js',
  './assets/js/views/deploy.js',
  './assets/js/views/docs.js',
  './assets/img/favicon.svg',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never touch Telegram API calls or cross-origin traffic.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Stale-while-revalidate
        fetch(request).then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
        }).catch(() => {});
        return cached;
      }
      return fetch(request)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
