// Service Worker für EpiDoc
const CACHE_NAME = 'epidoc-v1';
const urlsToCache = [
  '/',
  '/login',
  '/diary',
  '/befinden',
  '/verlauf',
  '/einstellungen',
  '/kontakt',
];

// Install Event - Cache wichtige Dateien
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch Event - Cache First Strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push-Benachrichtigungen im Pilotprojekt deaktiviert

