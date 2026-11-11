import ApplicationLogo from '@/Components/ApplicationLogo';
import ToastHost from '@/Components/ToastHost';
import { PropsWithChildren, ReactNode } from 'react';

interface GuestLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    cardMaxWidth?: string;
    badgeTitle?: string;
}

export default function Guest({
    children,
    title,
    subtitle,
    cardMaxWidth = 'max-w-md',
    badgeTitle = 'THE INNS',
}: GuestLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F]/90 to-[#1E3A5F]/80 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative antialiased overflow-x-hidden">
            {/* Soft subtle blurred background glow */}
            <div className="absolute top-1/4 w-96 h-96 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 w-96 h-96 bg-[#1E3A5F]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Auth Card (Matches System Theme & Screenshot) */}
            <div className={`relative z-10 w-full ${cardMaxWidth} bg-white rounded-3xl shadow-xl shadow-[#D4AF37]/10 border-t-4 border-t-[#D4AF37] border border-slate-100 p-8 sm:p-10 space-y-6`}>
                {/* Logo & Brand Header */}
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <ApplicationLogo className="w-20 h-20 shadow-lg" />
                    </div>

                    <div>
                        <div className="font-black text-sm tracking-[0.2em] text-[#D4AF37] uppercase">
                            {badgeTitle}
                        </div>
                        {title && (
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Powered by <span className="text-red-500 font-semibold text-xs">Haula Enterprises</span>
                        </p>
                    </div>
                </div>

                {children}
            </div>
            <ToastHost />
        </div>
    );
}
