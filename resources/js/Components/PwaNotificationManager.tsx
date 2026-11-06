import { Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Bell,
    BellRing,
    CheckCircle2,
    DollarSign,
    Package,
    Volume2,
    VolumeX,
    X,
    Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export interface ToastAlert {
    id: string | number;
    title: string;
    message: string;
    category?: string;
    severity?: string;
    action_url?: string;
    go_url?: string;
    created_at?: string;
}

export default function PwaNotificationManager() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [activeToast, setActiveToast] = useState<ToastAlert | null>(null);
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const seenNotificationIdsRef = useRef<Set<string>>(new Set());
    const isFirstRunRef = useRef(true);

    // Play pleasant high-quality chime using Web Audio API (Zero external file dependencies)
    const playNotificationChime = () => {
        if (!soundEnabled || typeof window === 'undefined') return;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;

            const ctx = new AudioContextClass();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const now = ctx.currentTime;

            // Tone 1: 587.33 Hz (D5) - gold bright chime
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now);
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.18, now + 0.04);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.35);

            // Tone 2: 880 Hz (A5) - sweet resonance
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, now + 0.12);
            gain2.gain.setValueAtTime(0, now + 0.12);
            gain2.gain.linearRampToValueAtTime(0.22, now + 0.16);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.65);
        } catch (err) {
            console.warn('[PWA Notification Sound Note]', err);
        }
    };

    // Trigger PWA Native Notification Popup (via Service Worker or Notification API)
    const triggerNativePwaNotification = (alert: ToastAlert) => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        const isSubfolder = window.location.pathname.startsWith('/inns');
        const iconPath = isSubfolder ? '/inns/pwa-icons/icon-192x192.png' : '/pwa-icons/icon-192x192.png';
        const targetUrl = alert.action_url || alert.go_url || (isSubfolder ? '/inns/dashboard' : '/dashboard');

        // Prefer Service Worker registration to support PWA background & lock-screen popups
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title: alert.title,
                body: alert.message,
                icon: iconPath,
                badge: iconPath,
                url: targetUrl,
                tag: `inns-alert-${alert.id}`,
            });
        } else if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(alert.title, {
                    body: alert.message,
                    icon: iconPath,
                    badge: iconPath,
                    data: { url: targetUrl },
                });
            }).catch(() => {
                try {
                    new Notification(alert.title, {
                        body: alert.message,
                        icon: iconPath,
                    });
                } catch (e) {
                }
            });
        }
    };

    // Combined Notification Dispatcher (Toast + Native Popup + Audio Chime)
    const displayNotification = (alert: ToastAlert, isTest = false) => {
        playNotificationChime();
        setActiveToast(alert);
        triggerNativePwaNotification(alert);

        // Auto-dismiss the in-app toast after 8 seconds
        setTimeout(() => {
            setActiveToast((curr) => (curr?.id === alert.id ? null : curr));
        }, 8000);
    };

    // Request Notification Permission
    const requestNotificationPermission = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;

        try {
            const res = await Notification.requestPermission();
            setPermission(res);
            setShowPermissionBanner(false);

            if (res === 'granted') {
                displayNotification({
                    id: 'perm-granted-' + Date.now(),
                    title: '🔔 PWA Notification Popups Enabled!',
                    message: 'You will now receive instant popups for new room reservations and daily reports.',
                    category: 'system',
                });
            }
        } catch (e) {
            console.warn('[Notification Permission Error]', e);
        }
    };

    // Initial check on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Load cached seen IDs from sessionStorage
        try {
            const cached = sessionStorage.getItem('the_inns_seen_notif_ids');
            if (cached) {
                const arr = JSON.parse(cached);
                seenNotificationIdsRef.current = new Set(arr);
            }
        } catch (e) {
        }

        if ('Notification' in window) {
            setPermission(Notification.permission);
            if (Notification.permission === 'default') {
                // Show permission prompt after a brief 3 second delay
                const bannerTimer = setTimeout(() => {
                    const dismissed = sessionStorage.getItem('pwa_notif_prompt_dismissed');
                    if (!dismissed) {
                        setShowPermissionBanner(true);
                    }
                }, 3500);
                return () => clearTimeout(bannerTimer);
            }
        }

        // Expose global test trigger so any UI button can test it directly
        (window as any).triggerPwaNotificationPopup = (customTitle?: string, customBody?: string) => {
            displayNotification({
                id: 'test-pwa-' + Date.now(),
                title: customTitle || '🛎️ New Reservation: Room #204 (Deluxe)',
                message: customBody || 'Guest: John Kasidi • Check-in: Today • Deposit: TZS 150,000 received.',
                category: 'reservation',
                action_url: window.location.pathname.startsWith('/inns') ? '/inns/reservations' : '/reservations',
            }, true);
        };
    }, []);

    // Polling mechanism to fetch new unread notifications
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isSubfolder = window.location.pathname.startsWith('/inns');
        const endpointUrl = isSubfolder ? '/inns/notifications/unread-latest' : '/notifications/unread-latest';

        const checkForNewNotifications = async () => {
            try {
                const res = await fetch(endpointUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!res.ok) return;
                const json = await res.json();
                const unreadList: ToastAlert[] = json.notifications || [];

                if (unreadList.length === 0) return;

                // On first run, record existing IDs so we don't bombard user with old alerts
                if (isFirstRunRef.current) {
                    isFirstRunRef.current = false;
                    unreadList.forEach((n) => seenNotificationIdsRef.current.add(String(n.id)));
                    try {
                        sessionStorage.setItem('the_inns_seen_notif_ids', JSON.stringify(Array.from(seenNotificationIdsRef.current)));
                    } catch (e) {
                    }
                    return;
                }

                // Find alerts that have not yet been popped up
                const newAlerts = unreadList.filter((n) => !seenNotificationIdsRef.current.has(String(n.id)));

                if (newAlerts.length > 0) {
                    // Pick the most recent new alert to display
                    const latestNew = newAlerts[0];
                    newAlerts.forEach((n) => seenNotificationIdsRef.current.add(String(n.id)));

                    try {
                        sessionStorage.setItem('the_inns_seen_notif_ids', JSON.stringify(Array.from(seenNotificationIdsRef.current)));
                    } catch (e) {
                    }

                    displayNotification(latestNew);
                }
            } catch (err) {
                // Non-fatal background fetch note
            }
        };

        // Run check on window focus
        const handleWindowFocus = () => {
            checkForNewNotifications();
        };

        window.addEventListener('focus', handleWindowFocus);

        // Interval poll every 20 seconds
        const pollInterval = setInterval(checkForNewNotifications, 20000);

        return () => {
            window.removeEventListener('focus', handleWindowFocus);
            clearInterval(pollInterval);
        };
    }, []);

    const dismissToast = () => {
        setActiveToast(null);
    };

    const dismissPermissionBanner = () => {
        setShowPermissionBanner(false);
        try {
            sessionStorage.setItem('pwa_notif_prompt_dismissed', '1');
        } catch (e) {
        }
    };

    return (
        <>
            {/* 1. PERMISSION PROMPT BANNER (Shown when permission is 'default') */}
            {showPermissionBanner && (
                <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-[#1E3A5F] text-white p-4 rounded-2xl shadow-2xl border border-[#D4AF37]/40 backdrop-blur-md flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                            <BellRing className="w-5 h-5 animate-bounce" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-white">Enable PWA Notification Popups</h4>
                            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                Get instant popups on your phone & desktop when new rooms are reserved or daily reports are ready.
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={requestNotificationPermission}
                                    className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
                                >
                                    Enable Popups
                                </button>
                                <button
                                    type="button"
                                    onClick={dismissPermissionBanner}
                                    className="px-3 py-1.5 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={dismissPermissionBanner}
                            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* 2. REAL-TIME FLOATING TOAST NOTIFICATION POPUP */}
            {activeToast && (
                <div className="fixed top-4 right-4 left-4 sm:left-auto sm:right-6 sm:w-[420px] z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#D4AF37] p-4 text-slate-900 relative overflow-hidden backdrop-blur-md">
                        {/* Gold accent top line with auto-dismiss progress bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] via-[#16a34a] to-[#1E3A5F] animate-pulse" />

                        <div className="flex items-start gap-3 pt-1">
                            {/* Icon Indicator */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                activeToast.category === 'reservation'
                                    ? 'bg-[#D4AF37]/15 text-[#B8960C]'
                                    : activeToast.category === 'finance'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-[#1E3A5F]/10 text-[#1E3A5F]'
                            }`}>
                                <BellRing className="w-5 h-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F]">
                                        PWA Alert • {activeToast.category || 'System'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={dismissToast}
                                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
                                        title="Dismiss popup"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <h4 className="text-sm font-extrabold text-[#1E3A5F] mt-1.5 leading-snug">
                                    {activeToast.title}
                                </h4>

                                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                    {activeToast.message}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSoundEnabled(!soundEnabled)}
                                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                                            title={soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
                                        >
                                            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                        <span className="text-[10px] text-slate-400">PWA Popup Active</span>
                                    </div>

                                    {activeToast.action_url || activeToast.go_url ? (
                                        <Link
                                            href={activeToast.action_url || activeToast.go_url || '#'}
                                            onClick={dismissToast}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-white rounded-xl text-xs font-bold transition shadow-xs"
                                        >
                                            <span>View Details</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={dismissToast}
                                            className="text-xs font-bold text-[#D4AF37] hover:underline"
                                        >
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

