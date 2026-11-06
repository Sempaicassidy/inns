const CACHE_NAME = 'the-inns-pwa-v6';
const STATIC_ASSETS = [
    './favicon.png',
    './favicon.ico',
    './apple-touch-icon.png',
    './images/logo.png',
    './pwa-icons/icon-192x192.png',
    './pwa-icons/icon-512x512.png',
    './pwa-icons/maskable-icon-192x192.png'
];

// Install event: pre-cache static assets safely
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                STATIC_ASSETS.map((asset) => {
                    return cache.add(asset).catch((err) => {
                        console.warn('[SW] Non-fatal asset cache error:', asset, err);
                    });
                })
            );
        })
    );
    self.skipWaiting();
});

// Activate event: purge outdated caches immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Only handle GET HTTP requests
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
        return;
    }

    // Never intercept or cache landing, html pages, or vite build assets to avoid stale UI
    if (
        url.pathname === '/' || 
        url.pathname.endsWith('/public') || 
        url.pathname.endsWith('/public/') ||
        url.pathname.endsWith('/index.php') ||
        url.pathname.includes('/build/')
    ) {
        return;
    }

    // Static assets: cache-first with network fallback
    if (
        url.pathname.includes('/pwa-icons/') ||
        url.pathname.includes('/images/') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.woff2')
    ) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) {
                    return cached;
                }
                return fetch(event.request).then((res) => {
                    if (res && res.status === 200) {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return res;
                }).catch(() => cached);
            })
        );
        return;
    }

    // Navigation & API requests: network-first, fallback to cache if offline
    event.respondWith(
        fetch(event.request)
            .then((networkRes) => {
                if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
                    const copy = networkRes.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return networkRes;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// ============================================================
// PWA NOTIFICATION POPUP HANDLERS
// ============================================================

// Listen for message events from client to display native PWA notification popup
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
