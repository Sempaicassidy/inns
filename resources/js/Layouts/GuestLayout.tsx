import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1E3A5F] to-[#1E3A5F]/90 p-4 font-sans overflow-x-hidden">
            <div className="mb-4">
                <Link href="/" className="flex items-center space-x-3 group">
                    <ApplicationLogo className="w-12 h-12 shadow-sm group-hover:scale-105 transition-transform" />
                    <span className="font-black text-xl tracking-tight text-white">THE <span className="text-[#D4AF37]">INNS</span></span>
                </Link>
            </div>

            <div className="w-full max-w-md overflow-hidden bg-white p-8 rounded-2xl border-t-4 border-t-[#D4AF37] border border-slate-200 shadow-2xl shadow-[#D4AF37]/10">
                {children}
            </div>
        </div>
    );
}
