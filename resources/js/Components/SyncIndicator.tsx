import React from 'react';
import { useOffline } from '@/Hooks/useOffline';
import { RefreshCw, CloudCheck, CloudOff, AlertCircle } from 'lucide-react';

export default function SyncIndicator({ className = '' }: { className?: string }) {
    const { status, pendingCount, isSyncing, syncNow } = useOffline();

    return (
        <button
            type="button"
            onClick={() => syncNow()}
            disabled={isSyncing}
            className={`relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center justify-center ${className}`}
            title={
                isSyncing
                    ? 'Synchronizing offline operations with server...'
                    : pendingCount > 0
                    ? `${pendingCount} offline operations queued. Click to sync now.`
                    : 'System synchronized with server'
            }
        >
            <RefreshCw
                className={`w-4 h-4 ${
                    isSyncing
                        ? 'animate-spin text-blue-600'
                        : pendingCount > 0
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                }`}
            />

            {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-600 text-white font-mono text-[9px] font-extrabold shadow-2xs">
                    {pendingCount}
                </span>
            )}
        </button>
    );
}

