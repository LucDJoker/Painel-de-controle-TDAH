// Minimal service worker to unregister any previously cached Workbox worker and clear caches.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    } catch (err) {
      // ignore cache cleanup failures
    }

    try {
      await self.registration.unregister();
    } finally {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clients.forEach(client => client.navigate(client.url));
    }
  })());
});
