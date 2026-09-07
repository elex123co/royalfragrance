// Deliberately minimal — this project relies on always-fresh server data
// (see netlify.toml's no-store headers, added specifically to fix a
// "have to clear cache to see changes" bug). A caching service worker
// would silently reintroduce that exact problem. This one exists only to
// satisfy Chrome/Android's installability requirement (a registered SW
// with a fetch handler) — every request just passes straight to the
// network, nothing is ever cached or served offline.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
