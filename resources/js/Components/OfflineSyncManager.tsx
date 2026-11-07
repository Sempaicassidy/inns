import React, { useEffect, useState } from 'react';
import offlineSyncService, { OfflineAction } from '@/Services/offlineSync';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Database,
    RefreshCw,
    Wifi,
    WifiOff,
    X,
    Trash2,
    Calendar,
    BedDouble,
    Utensils,
    FileSpreadsheet,
} from 'lucide-react';
import { router } from '@inertiajs/react';

export default function OfflineSyncManager() {
    const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
    const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [syncNotification, setSyncNotification] = useState<string | null>(null);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
        };
        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Subscribe to offline queue changes
        const unsubscribe = offlineSyncService.subscribe((actions, syncing) => {
            setPendingActions(actions);
            setIsSyncing(syncing);
        });

        // Listen for sync completion event
        const handleSyncEvent = (e: any) => {
            const detail = e.detail;
            if (detail?.succeeded > 0) {
                setSyncNotification(`Successfully synchronized ${detail.succeeded} offline record(s) to the database.`);
                setTimeout(() => setSyncNotification(null), 6000);
                // Reload current Inertia page to refresh live server data
                try {
                    router.reload();
                } catch {
                    // Ignore if router reload is unsupported in context
                }
            }
        };

        window.addEventListener('the-inns-offline-synced', handleSyncEvent);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('the-inns-offline-synced', handleSyncEvent);
            unsubscribe();
        };
    }, []);

    const handleManualSync = async () => {
        if (!navigator.onLine) {
            alert('Cannot synchronize: No internet connection detected yet.');
            return;
        }
        setIsSyncing(true);
        const result = await offlineSyncService.syncPendingActions();
        setIsSyncing(false);
        if (result.succeeded > 0) {
            setSyncNotification(`Successfully synchronized ${result.succeeded} offline record(s) to the database.`);
            setTimeout(() => setSyncNotification(null), 6000);
        }
    };

    const handleClearQueue = async () => {
        if (confirm('Are you sure you want to discard all pending offline records?')) {
            await offlineSyncService.clearAll();
            setShowModal(false);
        }
    };

    const getModuleIcon = (module?: string) => {
        switch (module) {
            case 'reservation':
                return <Calendar className="w-4 h-4 text-emerald-500" />;
            case 'housekeeping':
                return <BedDouble className="w-4 h-4 text-amber-500" />;
            case 'pos':
                return <Utensils className="w-4 h-4 text-rose-500" />;
            default:
                return <FileSpreadsheet className="w-4 h-4 text-sky-500" />;
        }
    };

    const formatTimestamp = (ts: number) => {
        return new Date(ts).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    // If completely online and no pending items and no notification, render nothing
    if (isOnline && pendingActions.length === 0 && !syncNotification) {
        return null;
    }

    return (
        <>
            {/* Global Floating Pill Banner */}
            <div className="fixed bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!isOnline ? (
                    // Offline Pill
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md text-amber-400 border border-amber-500/40 rounded-2xl shadow-xl hover:bg-slate-900 transition cursor-pointer text-xs font-bold"
                    >
                        <WifiOff className="w-4 h-4 animate-pulse text-amber-400" />
                        <span>Offline Mode Active</span>
                        {pendingActions.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                                {pendingActions.length} Pending
                            </span>
                        )}
                    </button>
                ) : isSyncing ? (
                    // Syncing Pill
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-900/95 backdrop-blur-md text-white border border-blue-400/40 rounded-2xl shadow-xl text-xs font-bold">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
                        <span>Syncing {pendingActions.length} record(s) to DB...</span>
                    </div>
                ) : pendingActions.length > 0 ? (
                    // Online with Pending Items
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-900/95 backdrop-blur-md text-emerald-300 border border-emerald-400/40 rounded-2xl shadow-xl hover:bg-emerald-900 transition cursor-pointer text-xs font-bold"
                    >
                        <Wifi className="w-4 h-4 text-emerald-400" />
                        <span>Online • {pendingActions.length} record(s) ready to sync</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                            Sync Now
                        </span>
                    </button>
                ) : syncNotification ? (
                    // Success Notification
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-950/95 backdrop-blur-md text-emerald-300 border border-emerald-500/50 rounded-2xl shadow-xl text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{syncNotification}</span>
                        <button
                            type="button"
                            onClick={() => setSyncNotification(null)}
                            className="text-emerald-400 hover:text-white p-0.5 cursor-pointer ml-1"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Offline Queue Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-5 py-4 bg-[#0B192C] text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-white/10 text-[#D4AF37]">
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-white">Offline Data Collection</h3>
                                    <p className="text-[11px] text-slate-300">
                                        Status: {isOnline ? 'Online (Connected)' : 'Offline (Local Storage)'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-4 text-xs">
                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                                <span className="font-extrabold block text-xs">Auto-Sync Guarantee:</span>
                                <p className="text-[11px] leading-relaxed text-amber-800">
                                    All entries collected while disconnected are safely held in this device's IndexedDB. When internet connectivity is restored, they automatically sync directly to your database.
                                </p>
                            </div>

                            <div className="flex items-center justify-between text-slate-500 font-bold border-b border-slate-100 pb-2">
                                <span>Pending Local Records ({pendingActions.length})</span>
                                {pendingActions.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearQueue}
                                        className="text-rose-600 hover:text-rose-700 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Clear All</span>
                                    </button>
                                )}
                            </div>

                            {pendingActions.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 space-y-1.5">
                                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                                    <p className="font-bold text-slate-700">All local data is fully synchronized</p>
                                    <p className="text-[11px] text-slate-400">Any new offline entries will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {pendingActions.map((action) => (
                                        <div
                                            key={action.id}
                                            className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0">
                                                    {getModuleIcon(action.module)}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="font-bold text-slate-900 block truncate">
                                                        {action.title}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{formatTimestamp(action.timestamp)}</span>
                                                        <span>•</span>
                                                        <span className="font-mono text-slate-600 uppercase">
                                                            {action.method} {action.url}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                                    Pending
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => offlineSyncService.deleteAction(action.id)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                                    title="Discard item"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500">
                                Network: {isOnline ? 'Online' : 'Offline'}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    disabled={isSyncing || !isOnline || pendingActions.length === 0}
                                    onClick={handleManualSync}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                                >
                                    {isSyncing ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Syncing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span>Sync Now ({pendingActions.length})</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
