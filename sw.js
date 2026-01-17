const CACHE_VERSION = "v2";
const CACHE_NAME = `jornada-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
  "./",
  "index.html",
  "manifest.json",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png",
];

// INSTALACIÓN
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)),
  );
});

// ACTIVACIÓN (limpia caches antiguos)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// FETCH (network-first para HTML/manifest)
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // HTML y manifest SIEMPRE desde red primero
  if (
    request.destination === "document" ||
    request.url.endsWith("manifest.json")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Resto: cache-first
  event.respondWith(
    caches.match(request).then((response) => response || fetch(request)),
  );
});
