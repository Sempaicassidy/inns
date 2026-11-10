/**
 * Atomic Offline Transaction Queue
 * Conforms to Part 6.5 of the Multi-Tenant Offline-First Specification.
 */

import { db, OutboxItem, LocalRecord } from './database';
import { getDeviceId } from './device';

export interface QueueOperationParams {
    tenantId: string;
    type: 'pos_order' | 'housekeeping_update' | 'guest_registration' | 'action' | string;
    action?: 'create' | 'update' | 'delete';
    payload: any;
    localId?: string;
}

export async function queueOperation({
    tenantId,
    type,
    action = 'create',
    payload,
    localId,
}: QueueOperationParams): Promise<string> {
    if (!tenantId) {
        throw new Error('Tenant ID is required for offline operation queuing.');
    }

    if (!payload) {
        throw new Error('Operation payload cannot be empty.');
    }

    const deviceId = getDeviceId();
    const operationId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const resolvedLocalId = localId || payload.localId || payload.id || operationId;

    await db.transaction('rw', [db.records, db.outbox], async () => {
        // 1. Store/Update local working record for immediate UI reactivity
        const localRecord: LocalRecord = {
            tenantId,
            type,
            localId: String(resolvedLocalId),
            data: payload,
            syncStatus: 'pending',
            updatedAt: new Date().toISOString(),
        };

        const existing = await db.records
            .where('[tenantId+type+localId]')
            .equals([tenantId, type, String(resolvedLocalId)])
            .first();

        if (existing?.id) {
            localRecord.id = existing.id;
        }

        await db.records.put(localRecord);

        // 2. Atomically enqueue outgoing sync operation
        const outboxEntry: OutboxItem = {
            operationId,
            tenantId,
            deviceId,
            type,
            action,
            payload,
            status: 'pending',
            retries: 0,
            createdAt: new Date().toISOString(),
        };

        await db.outbox.add(outboxEntry);
    });

    console.log(`[OfflineQueue] Enqueued operation ${operationId} for tenant ${tenantId} (${type})`);
    return operationId;
}

/**
 * Get count of pending operations in the outbox
 */
export async function getPendingCount(tenantId: string): Promise<number> {
    if (!tenantId) return 0;
    return db.outbox
        .where('tenantId')
        .equals(tenantId)
        .and(item => item.status === 'pending' || item.status === 'failed')
        .count();
}

/**
 * Retrieve pending operations list
 */
export async function getPendingOperations(tenantId: string): Promise<OutboxItem[]> {
    if (!tenantId) return [];
    return db.outbox
        .where('tenantId')
        .equals(tenantId)
        .and(item => item.status === 'pending' || item.status === 'failed')
        .toArray();
}

