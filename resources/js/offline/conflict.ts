/**
 * Client-Side Conflict Detection & Resolution Handler
 * Conforms to Part 11 of the Multi-Tenant Offline-First Specification.
 */

import { db } from './database';

export interface ConflictRecord {
    operationId: string;
    tenantId: string;
    type: string;
    clientPayload: any;
    serverResult: any;
    resolvedAt?: string;
}

export class ClientConflictHandler {
    /**
     * Handle conflict response returned from server
     */
    async handleServerConflict(
        tenantId: string,
        operationId: string,
        type: string,
        clientPayload: any,
        serverResult: any
    ): Promise<void> {
        console.warn(`[OfflineConflict] Conflict detected on operation ${operationId} (${type})`, serverResult);

        // 1. Mark operation in outbox as 'conflict'
        const op = await db.outbox.where('operationId').equals(operationId).first();
        if (op?.id) {
            await db.outbox.update(op.id, {
                status: 'conflict',
                lastError: serverResult?.reason || 'Conflict detected during synchronization',
            });
        }

        // 2. Mark local working record
        const localId = clientPayload?.localId || clientPayload?.id || operationId;
        const localRec = await db.records
            .where('[tenantId+type+localId]')
            .equals([tenantId, type, String(localId)])
            .first();

        if (localRec?.id) {
            await db.records.update(localRec.id, {
                syncStatus: 'conflict',
                data: {
                    ...localRec.data,
                    _conflict: {
                        serverResult,
                        detectedAt: new Date().toISOString(),
                    },
                },
            });
        }
    }

    /**
     * Manually accept server resolution or override
     */
    async resolveConflict(
        tenantId: string,
        operationId: string,
        resolutionAction: 'accept_server' | 'retry_override'
    ): Promise<void> {
        const op = await db.outbox.where('operationId').equals(operationId).first();
        if (!op?.id) return;

        if (resolutionAction === 'accept_server') {
            await db.outbox.delete(op.id);
        } else {
            await db.outbox.update(op.id, {
                status: 'pending',
                retries: 0,
            });
        }
    }
}

export const conflictHandler = new ClientConflictHandler();

