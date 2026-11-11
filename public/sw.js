/*
 * THE INNS — Service Worker (Offline PWA)
 *
 * Security model:
 *  - Caches STATIC public assets only (hashed Vite bundles, icons, fonts, images).
 *  - NEVER caches authenticated HTML, Inertia page responses, login/logout,
 *    or any private API / tenant business data in Cache Storage.
 *  - Business data lives exclusively in tenant-scoped IndexedDB (Dexie).
 *  - Only deletes caches belonging to this app (the-inns-* prefix).
 */

const CACHE_PREFIX = 'the-inns-static-';
const CACHE_VERSION = 'v17';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const OFFLINE_PAGE = 'offline.html';

// Resolve a path against the service worker scope (supports /inns/ subfolder deploys)
const toScopeUrl = (path) => {
    if (!path) return self.registration.scope;
    if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
        return path;
    }
    const clean = String(path).replace(/^\/+/, '');
    return new URL(clean, self.registration.scope).href;
};

// Static public assets safe to precache (no user-specific content)
const STATIC_PRECACHE = [
    'manifest.webmanifest',
    'favicon.png',
    'favicon.ico',
    'apple-touch-icon.png',
    'logo.png',
    OFFLINE_PAGE,
    'pwa-icons/icon-72x72.png',
    'pwa-icons/icon-96x96.png',
    'pwa-icons/icon-128x128.png',
    'pwa-icons/icon-144x144.png',
    'pwa-icons/icon-152x152.png',
    'pwa-icons/icon-192x192.png',
    'pwa-icons/icon-384x384.png',
    'pwa-icons/icon-512x512.png',
    'pwa-icons/maskable-icon-192x192.png',
    'pwa-icons/maskable-icon-512x512.png',
];

// Paths that must NEVER be cached (private / authenticated)
const NEVER_CACHE_PATTERNS = [
    '/api/',
    '/sanctum/',
    '/login',
    '/logout',
    '/register',
    '/password',
    '/verify-email',
    '/select-role',
    '/active-role',
];

const isPrivatePath = (pathname) =>
    NEVER_CACHE_PATTERNS.some((p) => pathname.includes(p));

// Only GET requests for static resources are eligible for caching
const isStaticAssetRequest = (req, url) => {
    if (req.method !== 'GET') return false;
    const p = url.pathname;
    return (
        p.includes('/build/') ||
        p.includes('/pwa-icons/') ||
        p.includes('/images/') ||
        p.endsWith('.js') ||
        p.endsWith('.css') ||
        p.endsWith('.png') ||
        p.endsWith('.jpg') ||
        p.endsWith('.jpeg') ||
        p.endsWith('.svg') ||
        p.endsWith('.ico') ||
        p.endsWith('.webp') ||
        p.endsWith('.woff2') ||
        p.endsWith('.woff') ||
        p.endsWith('.ttf') ||
        p.endsWith('.webmanifest') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('cdn.jsdelivr.net')
    );
};

// Install: precache static shell assets + Vite bundles only
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await Promise.all(
                STATIC_PRECACHE.map((rel) =>
                    cache.add(toScopeUrl(rel)).catch(() => {})
                )
            );

            // Precache compiled Vite production bundles from build/manifest.json
            try {
                const manifestRes = await fetch(toScopeUrl('build/manifest.json'), { cache: 'no-store' });
                if (manifestRes && manifestRes.status === 200) {
                    const manifest = await manifestRes.json();
                    const bundleUrls = [];
                    for (const entry of Object.values(manifest)) {
                        if (entry.file) bundleUrls.push(toScopeUrl('build/' + entry.file));
                        if (Array.isArray(entry.css)) {
                            entry.css.forEach((f) => bundleUrls.push(toScopeUrl('build/' + f)));
                        }
                    }
                    await Promise.all(bundleUrls.map((u) => cache.add(u).catch(() => {})));
                    console.log('[SW] Precached', bundleUrls.length, 'Vite bundles');
                }
            } catch (err) {
                console.warn('[SW] Manifest precache skipped:', err);
            }
        })
    );
    self.skipWaiting();
});

// Activate: delete ONLY this app's outdated caches, then claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) =>
                Promise.all(
                    keys.map((key) => {
                        if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
                            return caches.delete(key);
                        }
                    })
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    if (!url.protocol.startsWith('http')) return;

    // 1. Never intercept non-GET or private/authenticated paths
    if (req.method !== 'GET' || isPrivatePath(url.pathname)) {
        return;
    }

    // 2. Navigation requests: network-first, offline fallback page.
    //    We deliberately do NOT cache HTML pages — they contain
    //    user/tenant data and must never be served stale offline.
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req, { cache: 'no-store' }).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                const offlinePage = await cache.match(toScopeUrl(OFFLINE_PAGE));
                if (offlinePage) return offlinePage;
                return new Response(
                    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — THE INNS</title></head><body style="background:#0F172A;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center;max-width:420px;padding:24px"><h1 style="color:#D4AF37">THE INNS</h1><p>You are offline. Cached operational data remains available inside the app; changes will synchronize when connection returns.</p><p style="color:#94a3b8;font-size:13px">Re-open the app to continue working offline.</p></div></body></html>',
                    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                );
            })
        );
        return;
    }

    // 3. Inertia AJAX navigations: pass through — never cached, never fabricated
    if (req.headers.get('x-inertia') === 'true') {
        return;
    }

    // 4. Static assets: cache-first with background revalidation
    if (isStaticAssetRequest(req, url)) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cached = await cache.match(req);
                const networkFetch = fetch(req)
                    .then((res) => {
                        if (res && res.status === 200 && res.type === 'basic') {
                            cache.put(req, res.clone()).catch(() => {});
                        }
                        return res;
                    })
                    .catch(() => null);

                if (cached) {
                    // Serve cache immediately, refresh in background
                    networkFetch;
                    return cached;
                }

                const res = await networkFetch;
                if (res) return res;
                return cached || Response.error();
            })
        );
        return;
    }

    // 5. Everything else: plain network, no caching
});

// Background Sync: ask open clients to run the Dexie outbox sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'the-inns-sync-queue' || event.tag === 'the-inns-offline-sync') {
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
                clients.forEach((client) => client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' }));
            })
        );
    }
});

// PWA Notification & Message Handlers (unchanged behavior)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const title = event.data.title || 'THE INNS Notification';
        const options = {
            body: event.data.body || 'New operational update received.',
            icon: toScopeUrl('pwa-icons/icon-192x192.png'),
            badge: toScopeUrl('pwa-icons/icon-192x192.png'),
            tag: event.data.tag || 'the-inns-alert-' + Date.now(),
            vibrate: [200, 100, 200],
            data: { url: event.data.url || toScopeUrl('dashboard') },
            actions: [
                { action: 'open', title: 'View Details' },
                { action: 'close', title: 'Dismiss' }
            ]
        };
        event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('push', (event) => {
    let payload = {
        title: 'THE INNS Notification',
        body: 'New update received.',
        icon: toScopeUrl('pwa-icons/icon-192x192.png'),
        badge: toScopeUrl('pwa-icons/icon-192x192.png'),
        url: toScopeUrl('dashboard')
    };
    if (event.data) {
        try {
            payload = Object.assign(payload, event.data.json());
        } catch (e) {
            payload.body = event.data.text();
        }
    }
    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon || toScopeUrl('pwa-icons/icon-192x192.png'),
            badge: payload.badge || toScopeUrl('pwa-icons/icon-192x192.png'),
            tag: payload.tag || 'the-inns-push-' + Date.now(),
            vibrate: [200, 100, 200],
            data: { url: payload.url || toScopeUrl('dashboard') },
            actions: [
                { action: 'open', title: 'Open in PWA' },
                { action: 'close', title: 'Dismiss' }
            ]
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'close') return;
    const targetUrl = event.notification.data?.url || toScopeUrl('dashboard');
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});
