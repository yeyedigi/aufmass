// Offline-Modus: speichert das Programm auf dem Gerät.
// Bei jeder Änderung am Tool die Versionsnummer hier erhöhen.
const CACHE = "aufmass-v1.2";
const DATEIEN = ["./", "index.html", "manifest.json", "jspdf.min.js", "jspdf.autotable.min.js", "icon-180.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
