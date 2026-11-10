/**
 * Two-Way Multi-Tenant Synchronization Engine
 * Conforms to Part 6.6, 10 & 11 of the Specification.
 */

import { db, OutboxItem } from './database';
import { network } from './network';
import { OFFLINE_CONFIG } from './config';
import { getDeviceId } from './device';
import { conflictHandler } from './conflict';

let syncing = false;

export interface SyncResult {
    success: boolean;
    synced: number;
    pending: number;
    downloaded?: number;
    error?: string;
    reason?: string;
}

/**
 * Execute bidirectional synchronization for the active tenant.
 */
export async function synchronize(tenantId: string): Promise<SyncResult> {
    if (!tenantId) {
        return { success: false, synced: 0, pending: 0, error: 'Tenant ID is required.' };
    }

    if (!network.isOnline() || syncing) {
        const currentPending = await db.outbox
            .where('tenantId')
            .equals(tenantId)
            .and(item => item.status === 'pending' || item.status === 'failed')
            .count();

        return {
            success: false,
            synced: 0,
            pending: currentPending,
            reason: syncing ? 'SYNC_ALREADY_IN_PROGRESS' : 'OFFLINE',
        };
    }

    syncing = true;
    const deviceId = getDeviceId();

    try {
        // --- 1. UPLOAD PENDING OUTBOX OPERATIONS ---
        const pending = await db.outbox
            .where('tenantId')
            .equals(tenantId)
            .and(item => item.status === 'pending' || (item.status === 'failed' && item.retries < OFFLINE_CONFIG.maxRetries))
            .limit(OFFLINE_CONFIG.batchSize)
            .toArray();

        let confirmedCount = 0;

        if (pending.length > 0) {
            // Mark items as syncing
            await db.transaction('rw', db.outbox, async () => {
                for (const item of pending) {
                    if (item.id) {
                        await db.outbox.update(item.id, { status: 'syncing' });
                    }
                }
            });

            const uploadPayload = {
                device_id: deviceId,
                operations: pending.map(item => ({
                    operation_id: item.operationId,
                    type: item.type,
                    action: item.action,
                    payload: item.payload,
                })),
            };

            const response = await fetch(`${OFFLINE_CONFIG.apiBaseUrl}${OFFLINE_CONFIG.syncEndpoint}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Device-Id': deviceId,
                },
                body: JSON.stringify(uploadPayload),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Sync failed with HTTP ${response.status}`);
            }

            const result = await response.json();
            const confirmedSet = new Set<string>(result.confirmed_operation_ids || []);
            const opResults = result.results || {};

            // Update local outbox & records atomically
            await db.transaction('rw', [db.outbox, db.records, db.syncHistory], async () => {
                for (const item of pending) {
                    if (!item.id) continue;

                    if (confirmedSet.has(item.operationId)) {
                        // Confirmed! Delete from outbox and mark local record as synced
                        await db.outbox.delete(item.id);

                        const localId = item.payload?.localId || item.payload?.id || item.operationId;
                        const record = await db.records
                            .where('[tenantId+type+localId]')
                            .equals([tenantId, item.type, String(localId)])
                            .first();

                        if (record?.id) {
                            await db.records.update(record.id, { syncStatus: 'synced' });
                        }

                        confirmedCount++;
                    } else {
                        // Unconfirmed or failed: increment retries with exponential backoff status
                        const opRes = opResults[item.operationId];
                        if (opRes?.status === 'conflict') {
                            await conflictHandler.handleServerConflict(
                                tenantId,
                                item.operationId,
                                item.type,
                                item.payload,
                                opRes.result
                            );
                        } else {
                            await db.outbox.update(item.id, {
                                status: 'failed',
                                retries: item.retries + 1,
                                lastError: opRes?.error || 'Server did not acknowledge operation.',
                            });
                        }
                    }
                }

                await db.syncHistory.add({
                    tenantId,
                    syncedCount: confirmedCount,
                    direction: 'upload',
                    status: confirmedCount === pending.length ? 'success' : 'partial',
                    cursor: result.cursor,
                    createdAt: new Date().toISOString(),
                });
            });
        }

        // --- 2. DOWNLOAD INCREMENTAL CHANGES FROM SERVER ---
        let downloadedCount = 0;
        try {
            const lastSync = await db.syncHistory
                .where('tenantId')
                .equals(tenantId)
                .reverse()
                .first();

            const cursorParam = lastSync?.cursor ? `?cursor=${lastSync.cursor}` : '';
            const changesRes = await fetch(`${OFFLINE_CONFIG.apiBaseUrl}${OFFLINE_CONFIG.changesEndpoint}${cursorParam}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Device-Id': deviceId,
                },
            });

            if (changesRes.ok) {
                const changesData = await changesRes.json();
                const delta = changesData.data || {};

                await db.transaction('rw', [db.records, db.syncHistory], async () => {
                    // Update POS Items
                    if (Array.isArray(delta.items)) {
                        for (const item of delta.items) {
                            await db.records.put({
                                tenantId,
                                type: 'pos_item',
                                localId: String(item.id),
                                data: item,
                                syncStatus: 'synced',
                                updatedAt: new Date().toISOString(),
                            });
                            downloadedCount++;
                        }
                    }

                    // Update Rooms
                    if (Array.isArray(delta.rooms)) {
                        for (const room of delta.rooms) {
                            await db.records.put({
                                tenantId,
                                type: 'room',
                                localId: String(room.id),
                                data: room,
                                syncStatus: 'synced',
                                updatedAt: new Date().toISOString(),
                            });
                            downloadedCount++;
                        }
                    }
                });
            }
        } catch (downloadErr) {
            console.warn('[OfflineSync] Incremental change download skipped:', downloadErr);
        }

        const remainingPending = await db.outbox
            .where('tenantId')
            .equals(tenantId)
            .and(item => item.status === 'pending' || item.status === 'failed')
            .count();

        return {
            success: true,
            synced: confirmedCount,
            downloaded: downloadedCount,
            pending: remainingPending,
        };
    } catch (error: any) {
        console.error('[OfflineSync] Synchronization encountered an error:', error);

        // Reset any items that were left in 'syncing' status back to 'failed'
        const syncingItems = await db.outbox
            .where('tenantId')
            .equals(tenantId)
            .and(item => item.status === 'syncing')
            .toArray();

        for (const item of syncingItems) {
            if (item.id) {
                await db.outbox.update(item.id, {
                    status: 'failed',
                    retries: item.retries + 1,
                    lastError: error.message,
                });
            }
        }

        return {
            success: false,
            synced: 0,
            pending: await db.outbox.where('tenantId').equals(tenantId).count(),
            error: error.message,
        };
    } finally {
        syncing = false;
    }
}

/**
 * Bootstrap local database with full tenant baseline catalog (POS items, rooms, rates).
 */
export async function downloadTenantBootstrap(tenantId: string): Promise<{ success: boolean; count: number; error?: string }> {
    if (!network.isOnline()) {
        return { success: false, count: 0, error: 'Cannot bootstrap while offline.' };
    }

    const deviceId = getDeviceId();

    try {
        const response = await fetch(`${OFFLINE_CONFIG.apiBaseUrl}${OFFLINE_CONFIG.bootstrapEndpoint}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Device-Id': deviceId,
            },
        });

        if (!response.ok) {
            throw new Error(`Bootstrap failed with HTTP ${response.status}`);
        }

        const resData = await response.json();
        const data = resData.data || {};
        let totalCount = 0;

        await db.transaction('rw', [db.tenants, db.records, db.syncHistory], async () => {
            // Save Tenant
            if (data.tenant) {
                await db.tenants.put({
                    tenantId: data.tenant.id,
                    name: data.tenant.name,
                    slug: data.tenant.slug,
                    currency: data.tenant.currency,
                    tin: data.tenant.tin,
                    vrn: data.tenant.vrn,
                    updatedAt: new Date().toISOString(),
                });
            }

            // Save POS Categories
            if (Array.isArray(data.categories)) {
                for (const cat of data.categories) {
                    await db.records.put({
                        tenantId,
                        type: 'pos_category',
                        localId: String(cat.id),
                        data: cat,
                        syncStatus: 'synced',
                        updatedAt: new Date().toISOString(),
                    });
                    totalCount++;
                }
            }

            // Save POS Items
            if (Array.isArray(data.items)) {
                for (const item of data.items) {
                    await db.records.put({
                        tenantId,
                        type: 'pos_item',
                        localId: String(item.id),
                        data: item,
                        syncStatus: 'synced',
                        updatedAt: new Date().toISOString(),
                    });
                    totalCount++;
                }
            }

            // Save Rooms
            if (Array.isArray(data.rooms)) {
                for (const room of data.rooms) {
                    await db.records.put({
                        tenantId,
                        type: 'room',
                        localId: String(room.id),
                        data: room,
                        syncStatus: 'synced',
                        updatedAt: new Date().toISOString(),
                    });
                    totalCount++;
                }
            }

            // Save Room Types
            if (Array.isArray(data.room_types)) {
                for (const rt of data.room_types) {
                    await db.records.put({
                        tenantId,
                        type: 'room_type',
                        localId: String(rt.id),
                        data: rt,
                        syncStatus: 'synced',
                        updatedAt: new Date().toISOString(),
                    });
                    totalCount++;
                }
            }

            await db.syncHistory.add({
                tenantId,
                syncedCount: totalCount,
                direction: 'download',
                status: 'success',
                cursor: data.cursor,
                createdAt: new Date().toISOString(),
            });
        });

        console.log(`[OfflineSync] Successfully bootstrapped ${totalCount} records for tenant ${tenantId}`);
        return { success: true, count: totalCount };
    } catch (err: any) {
        console.error('[OfflineSync] Bootstrap error:', err);
        return { success: false, count: 0, error: err.message };
    }
}

