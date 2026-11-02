import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Cloud,
    Eye,
    EyeOff,
    Home,
    Lock,
    Mail,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword?: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: 'admin@inns.com',
        password: 'password',
        remember: true as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-slate-50/80 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative antialiased">
            {/* <Head title="THE INNS" /> */}

            {/* Soft subtle blurred background glow */}
            <div className="absolute top-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

            {/* Main Login Card (Matching Screenshot 1) */}
            <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 space-y-6">
                {/* Logo & Brand Header */}
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <Cloud className="w-16 h-16 text-sky-500 fill-sky-50 stroke-[1.5]" />
                            <Home className="w-7 h-7 text-blue-600 absolute stroke-[2.2] fill-white" />
                        </div>
                    </div>

                    <div>
                        <div className="font-black text-sm tracking-[0.2em] text-slate-800 uppercase">
                            THE INNS
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
                            Welcome Back
                        </h1>
                        <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                            Sign in to access the hotel portal
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Powered by <span className="text-red-500 font-semibold text-xs">Haula Enterprises</span>
                        </p>
                    </div>
                </div>

                {status && (
                    <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                        {status}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={submit} className="space-y-4 pt-1">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="email"
                                required
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="sample@theinns.com"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
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
                                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition tracking-wide"
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
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
                            />
                            <span>Remember me</span>
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                            >
                                Forgot?
                            </Link>
                        )}
                    </div>

                    {/* Vibrant Orange Gradient Button (Exact match to Screenshot 1) */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <span>{processing ? 'Signing In...' : 'Sign In'}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                </form>

                {/* Footer */}
                <div className="pt-2 text-center">
                    <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                        Secure System Access • THE INNS
                    </p>
                </div>
            </div>
        </div>
    );
}
