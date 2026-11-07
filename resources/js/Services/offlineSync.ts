/**
 * THE INNS - PWA Offline Data Collection & Background Sync Engine
 * Uses IndexedDB to store offline forms, transactions, and guest registrations,
 * and automatically synchronizes them with the MySQL database when connectivity returns.
 */

export interface OfflineAction {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data: any;
    title: string;
    module: 'reservation' | 'housekeeping' | 'room' | 'pos' | 'accounting' | 'general';
    timestamp: number;
    status: 'pending' | 'syncing' | 'synced' | 'failed';
    error?: string;
    retryCount: number;
}

const DB_NAME = 'THE_INNS_OFFLINE_DB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_queue';

class OfflineSyncService {
    private dbPromise: Promise<IDBDatabase> | null = null;
    private isSyncing = false;
    private listeners: Array<(actions: OfflineAction[], isSyncing: boolean) => void> = [];

    constructor() {
        if (typeof window !== 'undefined') {
            this.initListeners();
        }
    }

    private getDb(): Promise<IDBDatabase> {
        if (!this.dbPromise) {
            this.dbPromise = new Promise((resolve, reject) => {
                if (!('indexedDB' in window)) {
                    reject(new Error('IndexedDB not supported in this browser environment'));
                    return;
                }

                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                        store.createIndex('status', 'status', { unique: false });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                };

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        return this.dbPromise;
    }

    private initListeners() {
        window.addEventListener('online', () => {
            console.log('[OfflineSync] Connection restored! Initiating auto-sync...');
            this.syncPendingActions();
        });

        // Listen for service worker background sync triggers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data?.type === 'TRIGGER_OFFLINE_SYNC') {
                    this.syncPendingActions();
                }
            });
        }

        // Periodic sync attempt if online
        setInterval(() => {
            if (navigator.onLine && !this.isSyncing) {
                this.syncPendingActions();
            }
        }, 45000);
    }

    /**
     * Store an action locally when offline or when network call fails
     */
    async queueOfflineAction(action: {
        url: string;
        method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        data: any;
        title: string;
        module?: OfflineAction['module'];
    }): Promise<OfflineAction> {
        const db = await this.getDb();
        const fullAction: OfflineAction = {
            id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            url: action.url,
            method: action.method || 'POST',
            data: action.data,
            title: action.title,
            module: action.module || 'general',
            timestamp: Date.now(),
            status: 'pending',
            retryCount: 0,
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.add(fullAction);

            req.onsuccess = () => {
                this.notifyListeners();
                // Request Background Sync from SW if supported
                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    navigator.serviceWorker.ready.then((reg: any) => {
                        reg.sync?.register('the-inns-sync-queue').catch(() => {});
                    });
                }
                resolve(fullAction);
            };

            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Retrieve all pending offline items
     */
    async getPendingActions(): Promise<OfflineAction[]> {
        const db = await this.getDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();

            req.onsuccess = () => {
                const list = (req.result as OfflineAction[]) || [];
                // Sort by timestamp asc
                list.sort((a, b) => a.timestamp - b.timestamp);
                resolve(list);
            };

            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Delete an action from the queue once synced
     */
    async deleteAction(id: string): Promise<void> {
        const db = await this.getDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(id);

            req.onsuccess = () => {
                this.notifyListeners();
                resolve();
            };
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Clear all queued actions
     */
    async clearAll(): Promise<void> {
        const db = await this.getDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.clear();

            req.onsuccess = () => {
                this.notifyListeners();
                resolve();
            };
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Synchronize all pending items to the database via API/HTTP
     */
    async syncPendingActions(): Promise<{ total: number; succeeded: number; failed: number }> {
        if (this.isSyncing || !navigator.onLine) {
            const pending = await this.getPendingActions();
            return { total: pending.length, succeeded: 0, failed: 0 };
        }

        const actions = await this.getPendingActions();
        if (actions.length === 0) {
            return { total: 0, succeeded: 0, failed: 0 };
        }

        this.isSyncing = true;
        this.notifyListeners();

        let succeeded = 0;
        let failed = 0;

        // Get CSRF Token from page
        const csrfToken =
            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
            this.getCookie('XSRF-TOKEN') ||
            '';

        for (const action of actions) {
            try {
                // Ensure proper endpoint formatting
                let endpoint = action.url;
                if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
                    if (!endpoint.startsWith('/')) {
                        endpoint = '/' + endpoint;
                    }
                }

                const response = await fetch(endpoint, {
                    method: action.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-XSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify(action.data),
                    credentials: 'same-origin',
                });

                if (response.ok || response.status === 302 || response.status === 201 || response.status === 200) {
                    await this.deleteAction(action.id);
                    succeeded++;
                } else if (response.status === 422) {
                    // Validation error - keep for user inspection or remove
                    console.warn(`[OfflineSync] Validation error for action ${action.id}:`, await response.text());
                    await this.deleteAction(action.id);
                    failed++;
                } else {
                    failed++;
                }
            } catch (err) {
                console.warn(`[OfflineSync] Failed to sync action ${action.id}:`, err);
                failed++;
                break; // Stop loop if connection dropped again
            }
        }

        this.isSyncing = false;
        this.notifyListeners();

        if (succeeded > 0) {
            // Dispatch event for UI toasts
            window.dispatchEvent(
                new CustomEvent('the-inns-offline-synced', {
                    detail: { succeeded, failed, total: actions.length },
                })
            );
        }

        return { total: actions.length, succeeded, failed };
    }

    /**
     * Subscribe to changes in the queue
     */
    subscribe(callback: (actions: OfflineAction[], isSyncing: boolean) => void): () => void {
        this.listeners.push(callback);
        this.getPendingActions().then((actions) => callback(actions, this.isSyncing));

        return () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
        };
    }

    private async notifyListeners() {
        const actions = await this.getPendingActions();
        this.listeners.forEach((callback) => callback(actions, this.isSyncing));
    }

    private getCookie(name: string): string {
        const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
        return match ? decodeURIComponent(match[3]) : '';
    }
}

export const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;

