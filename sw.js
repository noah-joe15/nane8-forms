// sw.js
const CACHE_NAME = 'tantrade-forms-v1';
const ASSETS_TO_CACHE = [
  './',
  './nanenane.html',
  './wadau-malighafi.html',
  './styles.css',
  './script.js',
  './logo.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event: Cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // If offline and request is not in cache, return a basic offline response
        if (event.request.mode === 'navigate') {
          return caches.match('./nanenane.html'); // Fallback page
        }
      });
    })
  );
});
