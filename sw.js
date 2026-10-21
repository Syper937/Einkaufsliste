// Speichert die App auf dem Handy zwischen, damit sie auch ohne Internet startet.
// Bei Änderungen an der App die Versionsnummer erhöhen.
const VERSION = "einkaufsliste-v4";
const DATEIEN = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(DATEIEN)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(namen => Promise.all(namen.filter(n => n !== VERSION).map(n => caches.delete(n))))
  );
  self.clients.claim();
});

// Erst im Netz nachsehen (für Updates), ohne Internet die gespeicherte Version nehmen
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(antwort => {
        const kopie = antwort.clone();
        caches.open(VERSION).then(c => c.put(e.request, kopie));
        return antwort;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
