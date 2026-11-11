import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import OfflinePinSetup from '@/Components/OfflinePinSetup';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
    canDeleteAccount = true,
}: PageProps<{ mustVerifyEmail: boolean; status?: string; canDeleteAccount?: boolean }>) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Profile Settings
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        <OfflinePinSetup />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                        {canDeleteAccount ? (
                            <DeleteUserForm className="max-w-xl" />
                        ) : (
                            <div className="max-w-xl space-y-3">
                                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-base">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                    <span>Protected Administrator Account</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    This account is registered with General Management / Administrative privileges for the property. Self-deletion is disabled to safeguard ongoing room reservations, financial audit trails, and staff rosters. If this account needs to be decommissioned or reassigned, please contact the SaaS Platform Administrator or Property Owner.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
