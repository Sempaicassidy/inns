import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Monitor, CheckCircle2, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallButton({ className = '' }: { className?: string }) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect standalone (already installed)
        if (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true
        ) {
            setIsStandalone(true);
            return;
        }

        // Detect iOS
        const ua = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(ua));

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            console.log('[THE INNS PWA] Captured beforeinstallprompt event!');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            try {
                await deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice.outcome === 'accepted') {
                    setDeferredPrompt(null);
                }
            } catch (err) {
                console.warn('[THE INNS PWA] Prompt error:', err);
                setShowHelpModal(true);
            }
        } else {
            // Native prompt not yet available, show interactive install guide
            setShowHelpModal(true);
        }
    };

    if (isStandalone) {
        return null; // Already running inside installed PWA
    }

    return (
        <div className={`text-center ${className}`}>
            <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer border border-slate-700/60 active:scale-[0.98]"
            >
                <Download className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Sakinisha App (Install PWA)</span>
            </button>

            {/* Help / Manual Install Guide Modal */}
            {showHelpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-left shadow-2xl border border-slate-200 relative">
                        <button
                            type="button"
                            onClick={() => setShowHelpModal(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Download className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-sm">
                                    Sakinisha THE INNS App
                                </h3>
                                <p className="text-[11px] text-slate-500">
                                    Tumia bila kufungua kivinjari kila mara
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs text-slate-600">
                            {isIOS ? (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <Smartphone className="w-4 h-4 text-blue-600" /> Kwenye iPhone / iPad (Safari):
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1 text-[11.5px] pl-1">
                                        <li>Bonyeza kitufe cha <strong>Share (⎋)</strong> chini ya Safari.</li>
                                        <li>Tembeza chini kisha chagua <strong>Add to Home Screen (⊕)</strong>.</li>
                                        <li>Bonyeza <strong>Add</strong> juu kulia.</li>
                                    </ol>
                                </div>
                            ) : (
                                <>
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                            <Smartphone className="w-4 h-4 text-emerald-600" /> Kwenye Simu (Android Chrome):
                                        </p>
                                        <ol className="list-decimal list-inside space-y-1 text-[11.5px] pl-1">
                                            <li>Bonyeza vitone vitatu <strong>(⋮)</strong> juu kulia mwa browser.</li>
                                            <li>Chagua <strong>"Sakinisha app / Install app"</strong> au <strong>"Add to Home screen"</strong>.</li>
                                            <li>Bonyeza <strong>Sakinisha / Install</strong>.</li>
                                        </ol>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                            <Monitor className="w-4 h-4 text-blue-600" /> Kwenye Kompyuta (Chrome / Edge):
                                        </p>
                                        <p className="text-[11.5px] leading-relaxed">
                                            Angalia juu kulia kwenye sehemu ya anwani (URL address bar), utaona alama ya <strong>Kompyuta yenye mshale wa chini ⊕ (Install App)</strong>. Bonyeza hapo kusakinisha moja kwa moja.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowHelpModal(false)}
                            className="mt-5 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                        >
                            Nimeelewa
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
