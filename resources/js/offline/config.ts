/**
 * Offline PWA Engine Configuration
 * Resolves base URLs correctly for both root domains and subfolder environments (e.g. /inns/).
 */

const getBasePath = (): string => {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname;
    if (path.startsWith('/inns/')) {
        return '/inns';
    }
    return '';
};

export const OFFLINE_CONFIG = {
    databaseName: 'TheInnsOfflineDatabase',
    databaseVersion: 2,
    basePath: getBasePath(),
    apiBaseUrl: `${getBasePath()}/api/offline`,
    pingEndpoint: '/ping',
    syncEndpoint: '/sync',
    deviceEndpoint: '/devices',
    bootstrapEndpoint: '/bootstrap',
    changesEndpoint: '/changes',
    syncInterval: 30000,
    pingInterval: 15000,
    batchSize: 50,
    maxRetries: 5,
    serviceWorker: `${getBasePath()}/sw.js`,
    cacheVersion: 'saas-offline-v1',
};
