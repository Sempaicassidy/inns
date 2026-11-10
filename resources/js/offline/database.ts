import Dexie, { Table } from 'dexie';
import { OFFLINE_CONFIG } from './config';

export interface LocalTenant {
    tenantId: string;
    name: string;
    slug?: string;
    currency?: string;
    tin?: string;
    vrn?: string;
    settings?: Record<string, any>;
    updatedAt: string;
}

export interface LocalDevice {
    deviceId: string;
    tenantId: string;
    deviceName: string;
    registeredAt: string;
    lastSeenAt?: string;
    isRevoked?: boolean;
}

export interface LocalSession {
    sessionId: string;
    tenantId: string;
    userId: number;
    userName: string;
    userEmail: string;
    userRole: string;
    pinHash?: string;
    salt?: string;
    unlockedAt?: string;
    expiresAt?: string;
    cachedProfile?: Record<string, any>;
}

export interface LocalRecord {
    id?: number;
    tenantId: string;
    type: string; // e.g., 'pos_item', 'pos_category', 'room', 'room_type', 'pos_order', 'guest'
    localId: string;
    data: any;
    syncStatus: 'synced' | 'pending' | 'conflict';
    updatedAt: string;
}

export interface OutboxItem {
    id?: number;
    operationId: string;
    tenantId: string;
    deviceId: string;
    type: string; // 'pos_order', 'housekeeping_update', 'guest_registration', 'action'
    action: string; // 'create', 'update', 'delete'
    payload: any;
    status: 'pending' | 'syncing' | 'confirmed' | 'failed' | 'conflict';
    retries: number;
    lastError?: string;
    createdAt: string;
}

export interface SyncHistoryItem {
    id?: number;
    tenantId: string;
    syncedCount: number;
    direction: 'upload' | 'download' | 'bidirectional';
    status: 'success' | 'partial' | 'failed';
    error?: string;
    cursor?: string;
    createdAt: string;
}

export interface LocalSetting {
    key: string;
    value: any;
    updatedAt: string;
}

export class SaaSOfflineDatabase extends Dexie {
    tenants!: Table<LocalTenant, string>;
    devices!: Table<LocalDevice, string>;
    sessions!: Table<LocalSession, string>;
    records!: Table<LocalRecord, number>;
    outbox!: Table<OutboxItem, number>;
    syncHistory!: Table<SyncHistoryItem, number>;
    settings!: Table<LocalSetting, string>;

    constructor() {
        super(OFFLINE_CONFIG.databaseName);

        this.version(OFFLINE_CONFIG.databaseVersion).stores({
            tenants: '&tenantId, name',
            devices: '&deviceId, tenantId',
            sessions: '&sessionId, tenantId, userId',
            records: '++id, &[tenantId+type+localId], tenantId, type, syncStatus',
            outbox: '++id, &operationId, tenantId, status, createdAt',
            syncHistory: '++id, tenantId, createdAt',
            settings: '&key',
        });
    }
}

export const db = new SaaSOfflineDatabase();

/**
 * Save a business record locally for a tenant.
 */
export async function saveRecord(record: {
    tenantId: string;
    type: string;
    localId: string;
    data: any;
    syncStatus?: 'synced' | 'pending' | 'conflict';
}): Promise<number> {
    if (!record.tenantId || !record.localId) {
        throw new Error('Tenant ID and local ID are required.');
    }

    const existing = await db.records
        .where('[tenantId+type+localId]')
        .equals([record.tenantId, record.type, record.localId])
        .first();

    const recordPayload: LocalRecord = {
        tenantId: record.tenantId,
        type: record.type,
        localId: record.localId,
        data: record.data,
        syncStatus: record.syncStatus ?? 'pending',
        updatedAt: new Date().toISOString(),
    };

    if (existing?.id) {
        recordPayload.id = existing.id;
    }

    return db.records.put(recordPayload);
}

/**
 * Retrieve tenant records, optionally filtered by type.
 */
export async function getTenantRecords<T = any>(
    tenantId: string,
    type: string | null = null
): Promise<T[]> {
    if (!tenantId) {
        throw new Error('Tenant ID is required.');
    }

    let query = db.records.where('tenantId').equals(tenantId);

    if (type) {
        query = query.and((record) => record.type === type);
    }

    const records = await query.toArray();
    return records.map((r) => r.data as T);
}

/**
 * Clear all local data belonging to a tenant (e.g. upon logout or tenant switch).
 */
export async function clearTenantData(tenantId: string): Promise<void> {
    await db.transaction('rw', [db.records, db.outbox, db.sessions, db.syncHistory], async () => {
        await db.records.where('tenantId').equals(tenantId).delete();
        await db.outbox.where('tenantId').equals(tenantId).delete();
        await db.sessions.where('tenantId').equals(tenantId).delete();
        await db.syncHistory.where('tenantId').equals(tenantId).delete();
    });
}
