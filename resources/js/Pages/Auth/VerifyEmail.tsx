import GuestLayout from '@/Layouts/GuestLayout';
import { logout } from '@/Utils/auth';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { MailCheck, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout
            title="Email Verification"
            subtitle="Account activation and security verification"
            cardMaxWidth="max-w-md"
        >
            <Head title="Verify Email - THE INNS" />

            <div className="space-y-5">
                {/* Visual Icon Badge */}
                <div className="flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                        <MailCheck className="w-7 h-7 text-[#1E3A5F]" />
                    </div>
                </div>

                {/* Information Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                        Please verify your email address to activate your account.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                        A secure activation link was dispatched to your email address. Click the button in that email to start using THE INNS. If you did not receive the email, click below to request a new link.
                    </p>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="flex items-start gap-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>A new activation link has been sent to your registered email address.</span>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 px-4 rounded-2xl bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] font-bold text-sm shadow-md shadow-[#D4AF37]/30 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 stroke-[2.5] ${processing ? 'animate-spin' : ''}`} />
                        <span>{processing ? 'Sending Link...' : 'Resend Verification Email'}</span>
                    </button>

                    <div className="pt-2 flex items-center justify-center border-t border-slate-100">
                        <button
                            type="button"
                            onClick={logout}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1E3A5F] transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-slate-100"
                        >
                            <LogOut className="w-3.5 h-3.5 text-slate-400" />
                            <span>Log Out</span>
                        </button>
                    </div>
                </form>

                {/* Secure System Access Footer */}
                <div className="text-center pt-2">
                    <p className="text-[11px] text-slate-400 font-medium">
                        Secure System Access | THE INNS
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
