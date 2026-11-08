import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Eye,
    EyeOff,
    Lock,
    User as UserIcon,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import PwaInstallButton from '@/Components/PwaInstallButton';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword?: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title="Welcome Back"
            subtitle="Sign in to access the hotel portal"
            cardMaxWidth="max-w-sm"
        >
            <Head title="Sign In - THE INNS" />

            {status && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    {status}
                </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="space-y-4 pt-1" autoComplete="off">
                {/* Username or Email Input */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                        Username or Email
                    </label>
                    <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            required
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Enter username or email"
                            autoComplete="username"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 transition"
                        />
                    </div>
                    {errors.email && (
                        <p className="text-xs text-rose-500 font-medium">{errors.email}</p>
                    )}
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••••"
                            autoComplete="new-password"
                            className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 transition tracking-wide"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-xs text-rose-500 font-medium">{errors.password}</p>
                    )}
                </div>

                {/* Remember & Forgot password */}
                <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="w-4 h-4 rounded text-[#1E3A5F] focus:ring-[#D4AF37]/20 border-slate-300"
                        />
                        <span>Remember me</span>
                    </label>
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-[#D4AF37] hover:text-[#B8960C] font-semibold hover:underline"
                        >
                            Forgot?
                        </Link>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] font-bold text-sm shadow-md shadow-[#D4AF37]/30 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <span>{processing ? 'Signing In...' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
            </form>

            {/* PWA App Install Action */}
            <PwaInstallButton className="pt-2" />

            {/* Footer */}
            <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                    Secure System Access • THE INNS
                </p>
            </div>
        </GuestLayout>
    );
}
