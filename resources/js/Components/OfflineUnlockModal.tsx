import React, { useEffect, useState } from 'react';
import { useOffline } from '@/Hooks/useOffline';
import { Lock, Unlock, X, ShieldAlert, User as UserIcon } from 'lucide-react';

interface OfflineUnlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUnlocked?: () => void;
}

export default function OfflineUnlockModal({ isOpen, onClose, onUnlocked }: OfflineUnlockModalProps) {
    const { unlock, offlineSession, provisionedSessions } = useOffline();
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedUserId(null);
            setPin('');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            setError('Please select your account first.');
            return;
        }
        if (!/^\d{4,6}$/.test(pin)) {
            setError('PIN must be 4 to 6 digits.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await unlock(selectedUserId, pin);
            if (res.success) {
                onUnlocked?.();
                onClose();
            } else {
                setError(res.error || 'Invalid offline PIN.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900">Unlock Offline Access</h3>
                            <p className="text-xs text-slate-500">Device Local Authentication</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {provisionedSessions.length === 0 ? (
                        <div className="p-3 bg-amber-50 text-amber-900 rounded-2xl border border-amber-200 text-xs">
                            No accounts are provisioned for offline use on this device yet. Log in online once and set your offline PIN.
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Select Your Account
                            </label>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {provisionedSessions.map((session) => {
                                    const isSelected = selectedUserId === session.userId;
                                    return (
                                        <button
                                            key={session.sessionId}
                                            type="button"
                                            onClick={() => setSelectedUserId(session.userId)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition ${
                                                isSelected
                                                    ? 'border-amber-500 bg-amber-50'
                                                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                            }`}
                                        >
                                            <UserIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-xs font-extrabold text-slate-900 truncate">{session.userName}</span>
                                                <span className="block text-[10px] text-slate-500 font-mono truncate">{session.userEmail}</span>
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">{session.userRole}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Enter Offline PIN (4-6 digits)
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            autoFocus
                            className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-amber-500 focus:bg-white"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-2 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedUserId || !/^\d{4,6}$/.test(pin)}
                            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                        >
                            <Unlock className="w-4 h-4" />
                            <span>{loading ? 'Verifying...' : 'Unlock'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
