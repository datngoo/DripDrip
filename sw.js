/* Increment on every deployment changing app assets. Build script replaces __BUILD_ID__. */
const CACHE = 'dripdrip-__BUILD_ID__';
const ROOT = new URL('./', self.location.href);
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'src/app.js',
  'src/models.js',
  'src/storage.js',
  'src/actions.js',
  'src/hydration-engine.js',
  'src/streak-manager.js',
  'src/ui.js',
  'src/pet-mascot.js',
  'src/dashboard-view.js',
  'src/store-view.js',
  'src/share-story-view.js',
  'src/notification-engine.js',
];
self.addEventListener('install', (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((path) => new URL(path, ROOT).href))),
  ),
);
// Wait for existing clients to close before activating: prevents mixed code versions across tabs.
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith('dripdrip-') && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== ROOT.origin ||
    !url.pathname.startsWith(ROOT.pathname)
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE),
        key = event.request.mode === 'navigate' ? ROOT.href : event.request;
      const cached = await cache.match(key);
      if (cached) return cached;
      try {
        return await fetch(event.request);
      } catch {
        return new Response('DripDrip chưa tải được tài nguyên này.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })(),
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = windows.find((w) => w.url.startsWith(ROOT.href));
      if (existing) return existing.focus();
      return self.clients.openWindow(ROOT.href);
    })(),
  );
});
