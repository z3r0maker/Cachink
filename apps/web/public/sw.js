/**
 * The portal's offline page (N-23, ADR-071).
 *
 * One precached document and nothing else: no data caching, no writes, no
 * runtime cache — a navigation that cannot reach the network gets the branded
 * «Sin conexión» page so nobody stares at a browser error. The operator
 * register owns its own offline story and is never replaced here.
 *
 * Registered as a module worker (`{ type: 'module' }`) so the rule below is
 * exported and unit-tested by `tests/offline/sw-rule.test.ts` — this file is
 * the single source. The listener block is guarded so importing the module
 * under Node (the tests) attaches nothing.
 */

export const OFFLINE_URL = '/sin-conexion.html';
const CACHE = 'xangarro-offline-1';

/**
 * May a failed navigation to `pathname` be answered with the offline page?
 * ADR-071: never under `/operador` — the register has its own outbox and
 * replaces itself. API calls are not navigations, but the guard is cheap.
 */
export function replaceableNavigation(pathname) {
  if (pathname.startsWith('/operador')) return false;
  if (pathname.startsWith('/api/')) return false;
  return true;
}

async function cachedOfflinePage() {
  const cache = await caches.open(CACHE);
  return (await cache.match(OFFLINE_URL)) ?? Response.error();
}

if (typeof self !== 'undefined' && 'addEventListener' in self && 'caches' in self) {
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches
        .open(CACHE)
        .then((cache) => cache.add(OFFLINE_URL))
        .then(() => self.skipWaiting()),
    );
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
        .then(() => self.clients.claim()),
    );
  });

  self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.mode !== 'navigate') return;
    const url = new URL(request.url);
    if (!replaceableNavigation(url.pathname)) return;
    event.respondWith(fetch(request).catch(() => cachedOfflinePage()));
  });
}
