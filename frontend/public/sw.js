// Service Worker für EpiDoc
const CACHE_NAME = 'epidoc-v1';
const urlsToCache = [
  '/',
  '/login',
  '/diary',
  '/befinden',
  '/verlauf',
  '/profil',
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

// Push Notification Event
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || data.message,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      tag: data.tag || 'epidoc-notification',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'EpiDoc', options)
    );
  }
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/diary';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Prüfe ob bereits ein Fenster/Tab offen ist
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Öffne neues Fenster/Tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification Close Event
self.addEventListener('notificationclose', (event) => {
  // Optional: Tracking für geschlossene Benachrichtigungen
  console.log('Notification closed:', event.notification.tag);
});

