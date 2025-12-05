const CACHE_NAME = "stockapp-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/src/main.jsx",
  "/src/App.jsx",
  "/src/index.css",
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((cached) => {
      return (
        cached ||
        fetch(evt.request)
          .then((res) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(evt.request, res.clone());
              return res;
            });
          })
          .catch(() => {
            if (evt.request.mode === "navigate") {
              return caches.match("/index.html");
            }
          })
      );
    })
  );
});
