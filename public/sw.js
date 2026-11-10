const CACHE_NAME = 'the-inns-pwa-v16';
const APP_SHELL_KEY = '__the_inns_app_shell__';

// Helper: Safely resolve relative paths against the service worker scope
// Works seamlessly in WAMP subfolder (http://localhost/inns/) and custom domain (https://hotel.com/)
const toScopeUrl = (path) => {
    if (!path) return self.registration.scope;
    if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
        return path;
    }
    const clean = String(path).replace(/^\/+/, '');
    return new URL(clean, self.registration.scope).href;
};

const RELATIVE_PRECACHE = [
    '',
    'login',
    'dashboard',
    'pos',
    'housekeeping',
    'reservations',
    'calendar',
    'manifest.webmanifest',
    'favicon.png',
    'favicon.ico',
    'apple-touch-icon.png',
    'logo.png',
    'pwa-icons/icon-72x72.png',
    'pwa-icons/icon-96x96.png',
    'pwa-icons/icon-128x128.png',
    'pwa-icons/icon-144x144.png',
    'pwa-icons/icon-152x152.png',
    'pwa-icons/icon-192x192.png',
    'pwa-icons/icon-384x384.png',
    'pwa-icons/icon-512x512.png',
    'pwa-icons/maskable-icon-192x192.png',
    'pwa-icons/maskable-icon-512x512.png'
];

// Install event: download system assets, app shell, and Vite production bundles
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // 1. Precache static assets resolved against registration scope
            await Promise.all(
                RELATIVE_PRECACHE.map((relPath) => {
                    const fullUrl = toScopeUrl(relPath);
                    return cache.add(fullUrl).catch((err) => {
                        console.warn('[SW v14] Precache item skip:', fullUrl, err);
                    });
                })
            );

            // 2. Precache active authenticated App Shell HTML from dashboard
            try {
                const dashUrl = toScopeUrl('dashboard');
                const shellRes = await fetch(dashUrl);
                if (shellRes && shellRes.status === 200) {
                    await cache.put(APP_SHELL_KEY, shellRes.clone());
                    await cache.put(dashUrl, shellRes);
                }
            } catch (e) {
                // Offline or unauthenticated
            }

            // 3. Precache all compiled Vite production JS/CSS bundles from build/manifest.json
            try {
                const manifestUrl = toScopeUrl('build/manifest.json');
                const manifestRes = await fetch(manifestUrl);
                if (manifestRes && manifestRes.status === 200) {
                    await cache.put(manifestUrl, manifestRes.clone());
                    const manifest = await manifestRes.json();
                    const bundleUrls = [];
                    for (const entry of Object.values(manifest)) {
                        if (entry.file) {
                            bundleUrls.push(toScopeUrl('build/' + entry.file));
                        }
                        if (Array.isArray(entry.css)) {
                            entry.css.forEach((cssFile) => {
                                bundleUrls.push(toScopeUrl('build/' + cssFile));
                            });
                        }
                    }

                    await Promise.all(
                        bundleUrls.map((url) => cache.add(url).catch(() => {}))
                    );
                    console.log('[SW v14] Precached', bundleUrls.length, 'Vite bundles for offline operation');
                }
            } catch (err) {
                console.warn('[SW v14] Manifest precache note:', err);
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

// Fetch event: full offline application routing engine
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Only intercept HTTP/HTTPS requests
    if (!url.protocol.startsWith('http')) return;

    // 1. Navigation requests (Full page loads, direct URL entry, browser refreshes)
    // ALWAYS serve the actual application shell - never show an empty offline error page!
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

                    // 3. Try dashboard under current scope
                    const dashboardPage = await cache.match(toScopeUrl('dashboard'));
                    if (dashboardPage) return dashboardPage;

                    // 4. Try ANY cached HTML page from the system to boot the app
                    const keys = await cache.keys();
                    for (const key of keys) {
                        const res = await cache.match(key);
                        const contentType = res?.headers?.get('content-type') || '';
                        if (contentType.includes('text/html')) {
                            return res;
                        }
                    }

                    // 5. Final fallback to cached root
                    const rootFallback = await cache.match(toScopeUrl(''));
                    if (rootFallback) return rootFallback;

                    return new Response(
                        `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="1;url=${toScopeUrl('dashboard')}"></head><body style="background:#0F172A;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><p>Opening THE INNS in Offline Mode...</p></body></html>`,
                        { headers: { 'Content-Type': 'text/html' } }
                    );
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
                    const cache = await caches.open(CACHE_NAME);

                    // Match previous Inertia visit from cache
                    const cachedInertia = await cache.match(req);
                    if (cachedInertia) return cachedInertia;

                    // Try matching dashboard Inertia state
                    const dashboardInertia = await cache.match(toScopeUrl('dashboard'));
                    if (dashboardInertia) return dashboardInertia;

                    // Return synthetic Inertia response so the React SPA never crashes
                    return new Response(JSON.stringify({
                        component: 'Dashboard',
                        props: {
                            is_offline: true,
                            offline_notice: 'Working in Offline Mode. Operations and records will synchronize automatically upon reconnect.'
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
    // Strategy: Cache-First with background revalidation
    if (url.pathname.includes('/build/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedRes = await cache.match(req);
                if (cachedRes) {
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
                }).catch(() => cache.match(req));
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

    // Never cache authenticated API endpoints, tenant data or auth routes in shared SW cache
    if (
        url.pathname.includes('/api/') ||
        url.pathname.includes('/sanctum/') ||
        url.pathname.includes('/login') ||
        url.pathname.includes('/logout')
    ) {
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
            .catch(() => caches.match(req))
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

// PWA Notification & Message Handlers
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const title = event.data.title || 'THE INNS Notification';
        const options = {
            body: event.data.body || 'New operational update received.',
            icon: toScopeUrl('pwa-icons/icon-192x192.png'),
            badge: toScopeUrl('pwa-icons/icon-192x192.png'),
            tag: event.data.tag || 'the-inns-alert-' + Date.now(),
            vibrate: [200, 100, 200],
            data: {
                url: event.data.url || toScopeUrl('dashboard')
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

// Web Push event
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

    const options = {
        body: payload.body,
        icon: payload.icon || toScopeUrl('pwa-icons/icon-192x192.png'),
        badge: payload.badge || toScopeUrl('pwa-icons/icon-192x192.png'),
        tag: payload.tag || 'the-inns-push-' + Date.now(),
        vibrate: [200, 100, 200],
        data: {
            url: payload.url || toScopeUrl('dashboard')
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

// Notification click
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
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
