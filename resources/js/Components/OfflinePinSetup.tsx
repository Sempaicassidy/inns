import { db } from '@/offline/database';
import { setOfflinePin } from '@/offline/auth';
import { usePage } from '@inertiajs/react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Lets the signed-in staff member set / rotate their personal
 * offline unlock PIN (4-6 digits, PBKDF2-SHA256 credential stored
 * in tenant-scoped IndexedDB — never plaintext).
 */
export default function OfflinePinSetup() {
    const { auth } = usePage().props as any;
    const tenantId = auth?.tenant?.id;
    const user = auth?.user;

    const [hasSession, setHasSession] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!tenantId || !user?.id) return;
        const sessionId = `sess_${tenantId}_${user.id}`;
        db.sessions.get(sessionId).then((session) => {
            setHasSession(Boolean(session));
            setHasPin(Boolean(session?.pinCredential || session?.pinHash));
        });
    }, [tenantId, user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!tenantId || !user?.id) {
            setMessage({ type: 'error', text: 'Tenant or user context is missing.' });
            return;
        }
        if (!/^\d{4,6}$/.test(pin)) {
            setMessage({ type: 'error', text: 'PIN must be 4 to 6 digits.' });
            return;
        }
        if (pin !== confirmPin) {
            setMessage({ type: 'error', text: 'PIN and confirmation do not match.' });
            return;
        }

        setSaving(true);
        try {
            await setOfflinePin(tenantId, user.id, pin, confirmPin);
            setHasPin(true);
            setPin('');
            setConfirmPin('');
            setMessage({ type: 'success', text: 'Offline PIN saved securely. You can now unlock this device while offline.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err?.message || 'Failed to save offline PIN.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-xl space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-base">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Offline Access PIN</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Set a personal 4–6 digit PIN to unlock the app on this device when the internet is unavailable.
                The PIN is stored locally as a PBKDF2-SHA256 hash — never in plain text — and only works for your account on this device.
            </p>

            {!hasSession && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
                    No offline session is cached for this device yet. It will be created automatically the next time you sync while online.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New PIN</label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="4-6 digits"
                            className="w-full text-center tracking-[0.4em] font-mono py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm PIN</label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="Repeat PIN"
                            className="w-full text-center tracking-[0.4em] font-mono py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500"
                        />
                    </div>
                </div>

                {message && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        message.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>{message.text}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={saving || !hasSession || !/^\d{4,6}$/.test(pin) || pin !== confirmPin}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl transition"
                >
                    {saving ? 'Saving...' : hasPin ? 'Update Offline PIN' : 'Set Offline PIN'}
                </button>
            </form>
        </div>
    );
}
