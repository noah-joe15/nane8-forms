// Service Worker for image caching
const IMAGE_CACHE_NAME = 'tantrade-images-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing image cache');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating image cache');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== IMAGE_CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle image requests
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request).then(networkResponse => {
          // Don't cache if fetch failed
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          
          // Clone the response
          const responseToCache = networkResponse.clone();
          
          caches.open(IMAGE_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        }).catch(() => {
          // Return placeholder for offline images
          return new Response('', {
            status: 408,
            statusText: 'Image offline'
          });
        });
      })
    );
  }
});
