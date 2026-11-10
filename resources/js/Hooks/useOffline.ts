import { useState, useEffect } from 'react';
import { offlineEngine, OfflineEngineStatus } from '@/offline/offline-engine';
import { network } from '@/offline/network';
import { getActiveOfflineSession, verifyOfflinePin, lockOfflineSession, LocalSession } from '@/offline';

export function useOffline() {
    const [status, setStatus] = useState<OfflineEngineStatus>(
        network.isOnline() ? 'ONLINE' : 'OFFLINE'
    );
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [offlineSession, setOfflineSession] = useState<LocalSession | null>(null);

    useEffect(() => {
        const onStatus = (event: any) => {
            setStatus(event.detail.status);
            setIsSyncing(event.detail.status === 'SYNCING');
        };

        const onPending = (event: any) => {
            setPendingCount(event.detail.count);
        };

        offlineEngine.addEventListener('status', onStatus);
        offlineEngine.addEventListener('pending', onPending);

        // Fetch initial pending count
        offlineEngine.emitPendingCount().then(setPendingCount);

        // Check local session
        if (offlineEngine.tenantId) {
            getActiveOfflineSession(offlineEngine.tenantId).then(setOfflineSession);
        }

        return () => {
            offlineEngine.removeEventListener('status', onStatus);
            offlineEngine.removeEventListener('pending', onPending);
        };
    }, []);

    const syncNow = async () => {
        setIsSyncing(true);
        try {
            return await offlineEngine.syncNow();
        } finally {
            setIsSyncing(false);
        }
    };

    const unlock = async (pin: string) => {
        if (!offlineEngine.tenantId) {
            return { success: false, error: 'No active tenant ID configured.' };
        }
        const res = await verifyOfflinePin(offlineEngine.tenantId, pin);
        if (res.success && res.session) {
            setOfflineSession(res.session);
        }
        return res;
    };

    const lock = async () => {
        if (offlineEngine.tenantId) {
            await lockOfflineSession(offlineEngine.tenantId);
            setOfflineSession(null);
        }
    };

    return {
        status,
        isOnline: status === 'ONLINE' || status === 'SYNCING',
        isOffline: status === 'OFFLINE' || status === 'SERVER_UNREACHABLE',
        isSyncing,
        pendingCount,
        offlineSession,
        syncNow,
        unlock,
        lock,
    };
}

