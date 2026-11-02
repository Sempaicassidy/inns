import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 font-sans">
            <div className="mb-4">
                <Link href="/" className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 text-white font-black flex items-center justify-center shadow-md">
                        T
                    </div>
                    <span className="font-black text-xl tracking-tight text-slate-900">THE <span className="text-sky-600">INNS</span></span>
                </Link>
            </div>

            <div className="w-full max-w-md overflow-hidden bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
                {children}
            </div>
        </div>
    );
}
