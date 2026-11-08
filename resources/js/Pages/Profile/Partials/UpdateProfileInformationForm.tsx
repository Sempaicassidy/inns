import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Clock, CheckCircle2, MailCheck } from 'lucide-react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Your email address is unverified</span>
                        </div>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Please verify your email address to ensure full account access and security.
                        </p>
                        <div>
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-[#D4AF37] text-xs font-bold transition shadow-xs cursor-pointer border border-[#D4AF37]/30"
                            >
                                <MailCheck className="w-3.5 h-3.5" />
                                <span>Re-send Verification Email</span>
                            </Link>
                        </div>

                        {status === 'verification-link-sent' && (
                            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 p-2.5 rounded-xl border border-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>A new verification link has been sent to your email address.</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
