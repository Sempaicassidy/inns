import React, { useState } from 'react';
import { useOffline } from '@/Hooks/useOffline';
import { KeyRound, Lock, Unlock, X, ShieldAlert, Check } from 'lucide-react';

interface OfflineUnlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUnlocked?: () => void;
}

export default function OfflineUnlockModal({ isOpen, onClose, onUnlocked }: OfflineUnlockModalProps) {
    const { unlock, offlineSession } = useOffline();
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length < 4) {
            setError('Please enter at least 4 digits.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await unlock(pin);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
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
                    {offlineSession ? (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Account</span>
                            <span className="font-extrabold text-slate-900 block">{offlineSession.userName}</span>
                            <span className="text-slate-500 text-[11px] font-mono">{offlineSession.userEmail}</span>
                        </div>
                    ) : (
                        <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl border border-blue-200 text-xs">
                            Enter the offline security PIN configured during your initial online session. (Default: <b>1234</b>)
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Enter 4-Digit Offline PIN
                        </label>
                        <input
                            type="password"
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
                            disabled={loading || pin.length < 4}
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
