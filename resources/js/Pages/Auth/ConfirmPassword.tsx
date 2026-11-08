import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, ShieldAlert } from 'lucide-react';

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title="Confirm Password"
            subtitle="Security confirmation before proceeding"
            cardMaxWidth="max-w-md"
        >
            <Head title="Confirm Password - THE INNS" />

            <div className="space-y-5">
                <div className="flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                        <ShieldAlert className="w-7 h-7 text-[#1E3A5F]" />
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        This is a secure area of the system. Please confirm your password before continuing.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 px-4 rounded-2xl bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] font-bold text-sm shadow-md shadow-[#D4AF37]/30 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <span>{processing ? 'Confirming...' : 'Confirm Password'}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
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
