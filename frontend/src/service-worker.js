import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// Pré-cache des ressources critiques
precacheAndRoute(self.__WB_MANIFEST);

// Cache pour les API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60 // 24 heures
      })
    ]
  })
);

// Cache pour les assets statiques
registerRoute(
  ({ request }) => request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 jours
      })
    ]
  })
);

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    console.log('🔄 Synchronisation en arrière-plan');
    event.waitUntil(syncPendingOperations());
  }
});

// Gestion de l'installation
self.addEventListener('install', (event) => {
  console.log('⚙️ Service Worker installé');
  self.skipWaiting();
});

// Gestion de l'activation
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activé');
  event.waitUntil(self.clients.claim());
});

// Synchronisation des opérations en attente
async function syncPendingOperations() {
  const clients = await self.clients.matchAll();

  for (const client of clients) {
    client.postMessage({
      type: 'SYNC_REQUEST',
      payload: { force: true }
    });
  }
}

// Notification push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'stock-notification',
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Gestion Stock', options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          const client = clientList[0];
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            payload: event.notification.data
          });
        } else {
          self.clients.openWindow('/');
        }
      })
  );
});