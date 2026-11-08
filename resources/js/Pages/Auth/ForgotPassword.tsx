import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { User, ArrowRight, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout
            title="Forgot Password"
            subtitle="Request a secure password reset link"
            cardMaxWidth="max-w-md"
        >
            <Head title="Forgot Password - THE INNS" />

            <div className="space-y-5">
                {/* Visual Icon Badge */}
                <div className="flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                        <KeyRound className="w-7 h-7 text-[#1E3A5F]" />
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Forgot your password? Enter your registered <strong>Username</strong> or <strong>Email address</strong> below and we will send a password reset link to your verified email.
                    </p>
                </div>

                {status && (
                    <div className="flex items-start gap-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                            Username or Email Address
                        </label>
                        <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                id="email"
                                type="text"
                                name="email"
                                required
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Enter username or email"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 transition"
                            />
                        </div>
                        <InputError message={errors.email} className="mt-1" />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 px-4 rounded-2xl bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] font-bold text-sm shadow-md shadow-[#D4AF37]/30 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <span>{processing ? 'Sending Link...' : 'Send Password Reset Link'}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    <div className="pt-2 text-center border-t border-slate-100">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3A5F] hover:text-[#D4AF37] transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-50"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Sign In</span>
                        </Link>
                    </div>
                </form>

                <div className="text-center pt-2">
                    <p className="text-[11px] text-slate-400 font-medium">
                        Secure System Access | THE INNS
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
