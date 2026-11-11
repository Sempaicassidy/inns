import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { TOAST_EVENT_NAME, type ToastKind, type ToastPayload } from '@/Services/toast';

const KIND_STYLES: Record<ToastKind, { wrap: string; icon: typeof Info }> = {
    success: { wrap: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: CheckCircle2 },
    error: { wrap: 'border-rose-200 bg-rose-50 text-rose-900', icon: AlertTriangle },
    info: { wrap: 'border-sky-200 bg-sky-50 text-sky-900', icon: Info },
};

const AUTO_DISMISS_MS = 4500;

export default function ToastHost() {
    const [toasts, setToasts] = useState<ToastPayload[]>([]);

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<ToastPayload>).detail;
            if (!detail?.message) {
                return;
            }
            setToasts((prev) => [...prev.slice(-4), detail]);
            window.setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== detail.id));
            }, AUTO_DISMISS_MS);
        };
        window.addEventListener(TOAST_EVENT_NAME, handler);
        return () => window.removeEventListener(TOAST_EVENT_NAME, handler);
    }, []);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2 pointer-events-none">
            {toasts.map((t) => {
                const style = KIND_STYLES[t.kind] ?? KIND_STYLES.info;
                const Icon = style.icon;
                return (
                    <div
                        key={t.id}
                        role="status"
                        className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lg ${style.wrap}`}
                    >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="flex-1 text-xs font-semibold leading-snug">{t.message}</p>
                        <button
                            type="button"
                            aria-label="Dismiss notification"
                            className="shrink-0 opacity-60 hover:opacity-100"
                            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
