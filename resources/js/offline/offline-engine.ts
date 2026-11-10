/**
 * Master Offline Engine Coordinator
 * Conforms to Part 6.8 of the Multi-Tenant Offline-First Specification.
 */

import { network, NetworkStatus } from './network';
import { synchronize, downloadTenantBootstrap } from './sync';
import { db } from './database';
import { registerDevice } from './device';
import { cacheOnlineSession, getActiveOfflineSession } from './auth';

export type OfflineEngineStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'PENDING' | 'SERVER_UNREACHABLE';

export class OfflineEngine extends EventTarget {
    public tenantId: string | null = null;
    public syncing: boolean = false;
    private initialized: boolean = false;
    private autoSyncInterval: any = null;

    constructor() {
        super();

        network.addEventListener('change', async (event: any) => {
            const detail = event.detail;
            console.log('[OfflineEngine] Network connectivity changed:', detail);

            if (detail.online && detail.serverReachable) {
                if (this.tenantId) {
                    await this.syncNow();
                } else {
                    this.emitStatus('ONLINE');
                }
            } else {
                this.emitStatus(detail.status);
            }
        });
    }

    /**
     * Initialize the engine with current tenant and user session context
     */
    async initialize(tenantId: string, user?: { id: number; name: string; email: string; role?: string }): Promise<this> {
        if (!tenantId) {
            console.warn('[OfflineEngine] Initialized without tenantId.');
            return this;
        }

        this.tenantId = tenantId;

        // 1. Register device & cache online session if user profile passed and online
        if (user && network.isOnline()) {
            registerDevice(tenantId).catch(() => {});
            cacheOnlineSession({
                tenantId,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                userRole: user.role || 'staff',
            }).catch(() => {});
        }

        // 2. Initial state emission
        await this.emitPendingCount();

        if (network.isOnline()) {
            this.emitStatus('ONLINE');
            // Download bootstrap if local records are empty
            const recordCount = await db.records.where('tenantId').equals(tenantId).count();
            if (recordCount === 0) {
                downloadTenantBootstrap(tenantId).catch(() => {});
            }

            // Sync any existing pending actions
            await this.syncNow();
        } else {
            this.emitStatus('OFFLINE');
        }

        // 3. Periodic Auto-Sync Timer when online
        if (!this.autoSyncInterval) {
            this.autoSyncInterval = setInterval(() => {
                if (this.tenantId && network.isOnline() && !this.syncing) {
                    this.syncNow();
                }
            }, 30000);
        }

        this.initialized = true;
        return this;
    }

    public emitStatus(status: OfflineEngineStatus) {
        this.dispatchEvent(
            new CustomEvent('status', {
                detail: { status },
            })
        );
    }

    public async emitPendingCount(): Promise<number> {
        if (!this.tenantId) return 0;
        const count = await db.outbox
            .where('tenantId')
            .equals(this.tenantId)
            .and(item => item.status === 'pending' || item.status === 'failed')
            .count();

        this.dispatchEvent(
            new CustomEvent('pending', {
                detail: { count },
            })
        );

        return count;
    }

    /**
     * Trigger synchronization immediately
     */
    public async syncNow(): Promise<any> {
        if (!this.tenantId || this.syncing) {
            return { success: false, reason: 'BUSY_OR_UNINITIALIZED' };
        }

        if (!network.isOnline()) {
            this.emitStatus('OFFLINE');
            return { success: false, reason: 'OFFLINE' };
        }

        this.syncing = true;
        this.emitStatus('SYNCING');

        try {
            const result = await synchronize(this.tenantId);
            const remainingPending = await this.emitPendingCount();

            if (result.success) {
                this.emitStatus(remainingPending > 0 ? 'PENDING' : 'ONLINE');
            } else {
                this.emitStatus(remainingPending > 0 ? 'PENDING' : 'ONLINE');
            }

            return result;
        } catch (err: any) {
            console.error('[OfflineEngine] Sync execution error:', err);
            await this.emitPendingCount();
            this.emitStatus('PENDING');
            return { success: false, error: err.message };
        } finally {
            this.syncing = false;
        }
    }

    public isInitialized(): boolean {
        return this.initialized;
    }
}

export const offlineEngine = new OfflineEngine();

