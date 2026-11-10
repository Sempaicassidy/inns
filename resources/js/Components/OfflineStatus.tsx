import React from 'react';
import { useOffline } from '@/Hooks/useOffline';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

const STATUS_CONFIG = {
    ONLINE: {
        color: '#16a34a',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
        label: 'Online',
    },
    OFFLINE: {
        color: '#dc2626',
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        dotColor: 'bg-rose-500',
        label: 'Offline (Local)',
    },
    SERVER_UNREACHABLE: {
        color: '#d97706',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
        label: 'Connecting...',
    },
    SYNCING: {
        color: '#2563eb',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        dotColor: 'bg-blue-500',
        label: 'Synchronizing',
    },
    PENDING: {
        color: '#d97706',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
        label: 'Sync Pending',
    },
};

export default function OfflineStatus({ className = '' }: { className?: string }) {
    const { status, pendingCount, isSyncing, syncNow } = useOffline();
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE;

    return (
        <div
            role="status"
            aria-live="polite"
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold border transition ${config.bg} ${className}`}
        >
            <span className="relative flex h-2 w-2">
                {isSyncing && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
            </span>

            <span>{config.label}</span>

            {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/70 font-mono">
                    {pendingCount}
                </span>
            )}

            {status !== 'SYNCING' && pendingCount > 0 && (
                <button
                    type="button"
                    onClick={() => syncNow()}
                    title="Synchronize pending operations"
                    className="p-1 hover:bg-black/5 rounded cursor-pointer transition"
                >
                    <RefreshCw className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}

