// Service Worker für EpiDoc
// WICHTIG: Cache-Version erhöhen bei jedem relevanten Update
const CACHE_NAME = 'epidoc-v3';
const STATIC_ASSETS = [
  '/favicon.ico',
];

// Install Event - Nur statische Assets cachen, alte Caches sofort ersetzen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // Sofort aktivieren, nicht auf alte Tabs warten
  );
});

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim()) // Sofort alle Tabs übernehmen
  );
});

// Fetch Event - Network First für Seiten, Cache First nur für statische Assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Navigation-Requests (HTML-Seiten) → immer Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
        .then((response) => response || caches.match('/'))
    );
    return;
  }

  // API-Calls → immer Netzwerk, nie cachen
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Statische Assets (JS, CSS, Bilder) → Network First mit Cache-Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Nur gültige Responses cachen
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Push-Benachrichtigungen im Pilotprojekt deaktiviert
