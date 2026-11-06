import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'THE INNS';

/**
 * Dynamic PWA Controller
 * Automatically activates PWA from Login & all internal modules.
 * Strictly excludes the Welcome (Landing) page.
 */
function managePwaState(componentName: string) {
    if (typeof window === 'undefined') return;

    const isLandingPage = componentName === 'Welcome';
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;

    if (!isLandingPage) {
        const isSubfolder = window.location.pathname.startsWith('/inns');
        const manifestUrl = isSubfolder ? '/inns/manifest.webmanifest' : '/manifest.webmanifest';
        const swUrl = isSubfolder ? '/inns/sw.js' : '/sw.js';

        if (!manifestLink) {
            manifestLink = document.createElement('link');
            manifestLink.rel = 'manifest';
            manifestLink.href = manifestUrl;
            document.head.appendChild(manifestLink);
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register(swUrl)
                .then((reg) => {
                    console.log('[THE INNS PWA] Active with scope:', reg.scope);
                })
                .catch((err) => {
                    console.warn('[THE INNS PWA] SW Init note:', err);
                });
        }
    } else {
        if (manifestLink) {
            manifestLink.remove();
        }
    }
}

router.on('navigate', (event) => {
    if (event?.detail?.page?.component) {
        managePwaState(event.detail.page.component);
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Run initial check on app boot
        if (props?.initialPage?.component) {
            managePwaState(props.initialPage.component);
        }

        root.render(<App {...props} />);
    },
    progress: {
        color: '#1E3A5F',
    },
});
