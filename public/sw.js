const CACHE_NAME = 'global-pharmacy-v4';
const APP_SHELL = '/';

const PRECACHE_ROUTES = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
];

// Precache app shell on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ROUTES).catch(() => {
        // If some assets fail, cache what we can
        return Promise.allSettled(
          PRECACHE_ROUTES.map((url) =>
            cache.add(url).catch(() => null)
          )
        );
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.includes('supabase')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Navigation requests: network-first with cached shell fallback
      if (request.mode === 'navigate') {
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          // Serve cached page or app shell
          const cached = await cache.match(request);
          if (cached) return cached;
          // Fallback to cached root as SPA shell
          const shell = await cache.match(APP_SHELL);
          if (shell) return shell;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      }

      // Static assets (_next/*, icons, etc): cache-first
      if (request.url.includes('/_next/') || request.url.includes('/icons/') || request.url.endsWith('.js') || request.url.endsWith('.css')) {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return new Response('', { status: 503 });
        }
      }

      // Everything else: network-first with cache fallback
      try {
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })
  );
});
