/*
 * restoreLab internal-app service worker.
 *
 * Its ONLY job is to make /admin and /socio installable as standalone PWAs
 * (Android needs a SW with a fetch handler to promote a home-screen icon to a
 * chrome-less WebAPK). These are live-data tools, so it deliberately does NOT
 * cache anything — every request goes straight to the network. No offline mode
 * by design: a stale admin/partner view would be worse than a clear failure.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
// A fetch handler must exist for installability; falling through (no
// respondWith) means the browser handles the request normally over the network.
self.addEventListener('fetch', () => {});
