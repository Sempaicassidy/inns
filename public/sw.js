const CACHE_NAME = 'the-inns-pwa-v8';
const OFFLINE_URL = './offline.html';

const STATIC_PRECACHE = [
    './favicon.png',
    './favicon.ico',
    './apple-touch-icon.png',
    './logo.png',
    './images/logo.png',
    './offline.html',
    './pwa-icons/icon-192x192.png',
    './pwa-icons/icon-512x512.png',
    './pwa-icons/maskable-icon-192x192.png'
];

// Install event: pre-cache static assets safely
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                STATIC_PRECACHE.map((asset) => {
                    return cache.add(asset).catch((err) => {
                        console.warn('[SW] Non-fatal precache error:', asset, err);
                    });
                })
            );
        })
    );
    self.skipWaiting();
});

// Activate event: purge outdated caches immediately and claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event: smart caching router
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Only intercept HTTP/HTTPS requests
    if (!url.protocol.startsWith('http')) return;

    // 1. Navigation requests (HTML pages like /dashboard, /calendar, /housekeeping, /reservations)
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((networkRes) => {
                    if (networkRes && networkRes.status === 200) {
                        const copy = networkRes.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                    }
                    return networkRes;
                })
                .catch(() => {
                    // Offline fallback: check if requested page was cached, else serve offline.html
                    return caches.match(req).then((cached) => {
                        if (cached) return cached;
                        return caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // Only handle GET requests for remaining caching logic
    if (req.method !== 'GET') {
        return;
    }

    // 2. Vite Build Assets (CSS, JS, Web Workers, Images in /build/)
    // Strategy: Stale-While-Revalidate (Instant offline response + background cache update)
    if (url.pathname.includes('/build/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(req).then((cachedRes) => {
                    const fetchPromise = fetch(req)
                        .then((networkRes) => {
                            if (networkRes && networkRes.status === 200) {
                                cache.put(req, networkRes.clone());
                            }
                            return networkRes;
                        })
                        .catch(() => cachedRes);

                    // Return cached asset immediately if available, else wait for network
                    return cachedRes || fetchPromise;
                });
            })
        );
        return;
    }

    // 3. Static Assets & Images (logo, favicon, PWA icons, Google Fonts, Bootstrap CDN)
    if (
        url.pathname.includes('/pwa-icons/') ||
        url.pathname.includes('/images/') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.woff') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('cdn.jsdelivr.net')
    ) {
        event.respondWith(
            caches.match(req).then((cached) => {
                if (cached) return cached;

                return fetch(req)
                    .then((networkRes) => {
                        if (networkRes && networkRes.status === 200) {
                            const copy = networkRes.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                        }
                        return networkRes;
                    })
                    .catch(() => cached);
            })
        );
        return;
    }

    // 4. Default GET requests: Network first with cache fallback
    event.respondWith(
        fetch(req)
            .then((networkRes) => {
                if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
                    const copy = networkRes.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                }
                return networkRes;
            })
            .catch(() => {
                return caches.match(req);
            })
    );
});

// Background Sync Event (when connection is re-established)
self.addEventListener('sync', (event) => {
    if (event.tag === 'the-inns-sync-queue' || event.tag === 'the-inns-offline-sync') {
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' });
                });
            })
        );
    }
});

// ============================================================
// PWA NOTIFICATION POPUP HANDLERS
// ============================================================

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const title = event.data.title || 'THE INNS Notification';
        const options = {
            body: event.data.body || 'New operational update received.',
            icon: event.data.icon || './pwa-icons/icon-192x192.png',
            badge: event.data.badge || './pwa-icons/icon-192x192.png',
            tag: event.data.tag || 'the-inns-alert-' + Date.now(),
            vibrate: [200, 100, 200],
            data: {
                url: event.data.url || './dashboard'
            },
            actions: [
                { action: 'open', title: 'View Details' },
                { action: 'close', title: 'Dismiss' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

// Web Push event (when server pushes payload)
self.addEventListener('push', (event) => {
    let payload = {
        title: 'THE INNS Notification',
        body: 'New update received.',
        icon: './pwa-icons/icon-192x192.png',
        badge: './pwa-icons/icon-192x192.png',
        url: './dashboard'
    };

    if (event.data) {
        try {
            payload = Object.assign(payload, event.data.json());
        } catch (e) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: payload.icon || './pwa-icons/icon-192x192.png',
        badge: payload.badge || './pwa-icons/icon-192x192.png',
        tag: payload.tag || 'the-inns-push-' + Date.now(),
        vibrate: [200, 100, 200],
        data: {
            url: payload.url || './dashboard'
        },
        actions: [
            { action: 'open', title: 'Open in PWA' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

// Handle notification click event: focus or open the PWA window and navigate
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const targetUrl = event.notification.data?.url || './dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
