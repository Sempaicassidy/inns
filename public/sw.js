const CACHE_NAME = 'the-inns-pwa-v11';
const OFFLINE_URL = '/offline.html';
const APP_SHELL_KEY = '/app-shell';

const STATIC_PRECACHE = [
    '/',
    '/login',
    '/dashboard',
    '/manifest.webmanifest',
    '/offline.html',
    '/favicon.png',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/logo.png',
    '/pwa-icons/icon-72x72.png',
    '/pwa-icons/icon-96x96.png',
    '/pwa-icons/icon-128x128.png',
    '/pwa-icons/icon-144x144.png',
    '/pwa-icons/icon-152x152.png',
    '/pwa-icons/icon-192x192.png',
    '/pwa-icons/icon-384x384.png',
    '/pwa-icons/icon-512x512.png',
    '/pwa-icons/maskable-icon-192x192.png',
    '/pwa-icons/maskable-icon-512x512.png'
];

// Install event: pre-cache static assets AND all Vite production chunks from manifest
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // 1. Precache static core assets
            await Promise.all(
                STATIC_PRECACHE.map((asset) => {
                    return cache.add(asset).catch((err) => {
                        console.warn('[SW] Non-fatal precache item:', asset, err);
                    });
                })
            );

            // 2. Precache active authenticated App Shell HTML
            try {
                const shellRes = await fetch('/dashboard');
                if (shellRes && shellRes.status === 200) {
                    await cache.put(APP_SHELL_KEY, shellRes.clone());
                    await cache.put('/dashboard', shellRes);
                }
            } catch (e) {
                // In offline install or unauthenticated state
            }

            // 3. Precache all compiled Vite production JS/CSS bundles
            try {
                const manifestRes = await fetch('/build/manifest.json');
                if (manifestRes && manifestRes.status === 200) {
                    await cache.put('/build/manifest.json', manifestRes.clone());
                    const manifest = await manifestRes.json();
                    const assetUrls = Object.values(manifest)
                        .map((entry) => (entry.file ? `/build/${entry.file}` : null))
                        .filter(Boolean);

                    await Promise.all(
                        assetUrls.map((url) => {
                            return cache.add(url).catch(() => {});
                        })
                    );
                    console.log('[SW] Pre-cached', assetUrls.length, 'Vite production assets for offline mode');
                }
            } catch (err) {
                console.warn('[SW] Manifest bundle precache note:', err);
            }
        })
    );
    self.skipWaiting();
});

// Activate event: purge outdated caches and take control of all open clients immediately
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

// Fetch event: resilient offline-first routing engine
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Only intercept HTTP/HTTPS requests
    if (!url.protocol.startsWith('http')) return;

    // 1. Navigation requests (Full page loads / refreshes)
    // Never trap user on offline.html if ANY application HTML is cached!
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((networkRes) => {
                    if (networkRes && networkRes.status === 200) {
                        const copy = networkRes.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(req, copy.clone());
                            // Store authenticated HTML pages as App Shell fallback
                            if (!url.pathname.includes('/login') && !url.pathname.includes('/register')) {
                                cache.put(APP_SHELL_KEY, copy);
                            }
                        });
                    }
                    return networkRes;
                })
                .catch(async () => {
                    const cache = await caches.open(CACHE_NAME);

                    // 1. Try exact requested page from cache
                    const cachedPage = await cache.match(req);
                    if (cachedPage) return cachedPage;

                    // 2. Try App Shell key (boots full React Inertia app offline)
                    const appShell = await cache.match(APP_SHELL_KEY);
                    if (appShell) return appShell;

                    // 3. Try /dashboard
                    const dashboardPage = await cache.match('/dashboard');
                    if (dashboardPage) return dashboardPage;

                    // 4. Try ANY cached HTML page from the system to boot the app
                    const keys = await cache.keys();
                    for (const key of keys) {
                        const res = await cache.match(key);
                        const contentType = res?.headers?.get('content-type') || '';
                        if (contentType.includes('text/html') && !key.url.includes('offline.html')) {
                            return res;
                        }
                    }

                    // 5. Fallback to interactive offline launcher
                    const offlineFallback = await cache.match(OFFLINE_URL);
                    if (offlineFallback) return offlineFallback;

                    return new Response('Offline - THE INNS', {
                        headers: { 'Content-Type': 'text/html' }
                    });
                })
        );
        return;
    }

    // 2. Inertia.js AJAX Page Navigation (X-Inertia requests)
    if (req.headers.get('x-inertia') === 'true') {
        event.respondWith(
            fetch(req)
                .then((networkRes) => {
                    if (networkRes && networkRes.status === 200) {
                        const copy = networkRes.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                    }
                    return networkRes;
                })
                .catch(async () => {
                    // Match previous Inertia visit from cache
                    const cachedInertia = await caches.match(req);
                    if (cachedInertia) return cachedInertia;

                    // Safe synthetic Inertia JSON response if unvisited page is clicked offline
                    return new Response(JSON.stringify({
                        component: 'Dashboard',
                        props: {
                            is_offline: true,
                            offline_notice: 'Working in Offline Standby Mode. Operations and records will synchronize automatically upon reconnect.'
                        },
                        url: url.pathname,
                        version: ''
                    }), {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Inertia': 'true'
                        }
                    });
                })
        );
        return;
    }

    // Only handle GET requests for remaining asset caches
    if (req.method !== 'GET') {
        return;
    }

    // 3. Vite Build Assets (CSS, JS, Fonts, Workers in /build/)
    // Strategy: Cache-First with background revalidation (Immediate offline availability)
    if (url.pathname.includes('/build/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedRes = await cache.match(req);
                if (cachedRes) {
                    // Background refresh if online
                    fetch(req).then((netRes) => {
                        if (netRes && netRes.status === 200) {
                            cache.put(req, netRes);
                        }
                    }).catch(() => {});
                    return cachedRes;
                }

                return fetch(req).then((networkRes) => {
                    if (networkRes && networkRes.status === 200) {
                        cache.put(req, networkRes.clone());
                    }
                    return networkRes;
                });
            })
        );
        return;
    }

    // 4. Static Assets & External CDNs (Fonts, Icons, Logos, Bootstrap)
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

    // 5. Default GET requests: Network first with Cache fallback
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
                return caches.match(req);
            })
    );
});

// Background Sync Event (Triggered when internet connectivity is re-established)
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
            icon: event.data.icon || '/pwa-icons/icon-192x192.png',
            badge: event.data.badge || '/pwa-icons/icon-192x192.png',
            tag: event.data.tag || 'the-inns-alert-' + Date.now(),
            vibrate: [200, 100, 200],
            data: {
                url: event.data.url || '/dashboard'
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
        icon: '/pwa-icons/icon-192x192.png',
        badge: '/pwa-icons/icon-192x192.png',
        url: '/dashboard'
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
        icon: payload.icon || '/pwa-icons/icon-192x192.png',
        badge: payload.badge || '/pwa-icons/icon-192x192.png',
        tag: payload.tag || 'the-inns-push-' + Date.now(),
        vibrate: [200, 100, 200],
        data: {
            url: payload.url || '/dashboard'
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

    const targetUrl = event.notification.data?.url || '/dashboard';

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
