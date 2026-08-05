// Kairos Service Worker v26
// Uses Workbox precaching via vite-plugin-pwa injectManifest strategy.
// __WB_MANIFEST is replaced at build time with the asset precache list.

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute }                                    from 'workbox-routing'
import { NetworkFirst, CacheFirst, NetworkOnly }                             from 'workbox-strategies'
import { CacheableResponsePlugin }                                           from 'workbox-cacheable-response'
import { ExpirationPlugin }                                                  from 'workbox-expiration'

// ─── Precache app shell (injected by vite-plugin-pwa at build time) ───────────
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

// ─── SPA navigation fallback — always serve index.html ───────────────────────
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    // Exclude API routes from the SPA fallback
    denylist: [/^\/api\//]
  })
)

// ─── API routes — NEVER cache; always go to network ──────────────────────────
// Supabase, Anthropic, and /api/* must never be intercepted.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') ||
               url.hostname.includes('supabase') ||
               url.hostname.includes('anthropic'),
  new NetworkOnly()
)

// ─── Static assets — cache-first with 30-day expiry ──────────────────────────
registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new CacheFirst({
    cacheName: 'kairos-assets-v26',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
)

// ─── Images — cache-first with 7-day expiry ───────────────────────────────────
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'kairos-images-v26',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 })
    ]
  })
)

// ─── Skip-waiting message ─────────────────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
