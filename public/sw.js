// Brainly service worker: makes the app installable (and so a share target).
// It deliberately caches nothing, so a new deploy is never hidden behind a stale copy.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
