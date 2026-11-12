import React, { useState } from 'react';
import { useOffline } from '@/Hooks/useOffline';
import { WifiOff, RefreshCw, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export default function OfflineBanner() {
    const { isOffline, status, pendingCount, isSyncing, syncNow } = useOffline();
    const [dismissed, setDismissed] = useState(false);

    if (!isOffline || dismissed) return null;

    return (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs shadow-md border-b border-amber-500/40 sticky top-14 lg:top-0 z-40 animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <WifiOff className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <span className="font-extrabold text-amber-400">Offline Mode Active: </span>
                        <span className="text-slate-300">
                            Local database is operating. POS, check-ins, and housekeeping remain available and save to device.
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                            {pendingCount} operation{pendingCount > 1 ? 's' : ''} queued
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() => syncNow()}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition disabled:opacity-50 cursor-pointer text-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Reconnecting...' : 'Check Connection'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setDismissed(true)}
                        className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded transition"
                        title="Dismiss banner"
                    >
                        Hide
                    </button>
                </div>
            </div>
        </div>
    );
}

