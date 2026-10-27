const CACHE_VERSION = "v4";
const CACHE_NAME = `jornada-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
  "./",
  "index.html",
  "manifest.json",
  "lib/lucide.min.js",
  "lib/chart.umd.js",
  "favicon.ico",
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
      )
      .then(() => self.clients.claim()),
  );
});

// FETCH
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Solo GET y mismo origen
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // HTML y manifest: red primero, caché si no hay conexión
  if (
    request.destination === "document" ||
    request.url.endsWith("manifest.json")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request)) ||
            (await caches.match("index.html")) ||
            (await caches.match("./")),
        ),
    );
    return;
  }

  // Resto: caché primero
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
