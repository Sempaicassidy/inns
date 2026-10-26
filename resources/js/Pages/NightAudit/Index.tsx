import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Reservation, Stay } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Bed,
    CheckCircle2,
    Clock,
    DollarSign,
    Moon,
    Play,
    ShieldAlert,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface NightAuditHistoryItem {
    id: string;
    business_date: string;
    status: string;
    rooms_occupied: number;
    rooms_available: number;
    total_room_revenue_minor: number;
    total_payments_collected_minor: number;
    performer?: { name: string };
    created_at: string;
}

interface NightAuditProps extends PageProps {
    businessDate: string;
    pendingDepartures: Reservation[];
    inHouseStays: Stay[];
    auditHistory: NightAuditHistoryItem[];
    alreadyAuditedToday: boolean;
}

export default function NightAuditIndex({
    businessDate,
    pendingDepartures,
    inHouseStays,
    auditHistory,
    alreadyAuditedToday,
}: NightAuditProps) {
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const { post, processing } = useForm({});

    const formatTZS = (minor: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format(minor / 100);
    };

    const handleRunAudit = () => {
        post(route('night-audit.run'), {
            onSuccess: () => setConfirmModalOpen(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="End-of-Day Night Audit - Haula HMS" />

            {/* Header Toolbar */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Moon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">End-of-Day Night Audit Wizard</h1>
                        <p className="text-xs text-slate-400">
                            Automatic room charge posting, revenue reconciliation and business date rollover
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Business Date</span>
                        <span className="font-mono text-amber-400 font-bold text-sm">{businessDate}</span>
                    </div>

                    <button
                        onClick={() => setConfirmModalOpen(true)}
                        disabled={processing}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 text-xs transition disabled:opacity-50"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Execute Night Audit</span>
                    </button>
                </div>
            </div>

            {/* Pre-Audit Checklist & Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* 1. In-House Stays to Post */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">In-House Stays</span>
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Bed className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-3xl font-black text-emerald-400 font-mono block">
                        {inHouseStays.length} Rooms
                    </span>
                    <p className="text-xs text-slate-400 mt-2">
                        Nightly room accommodation charges will be posted to active folios with idempotency locking.
                    </p>
                </div>

                {/* 2. Pending Departures */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overdue Departures</span>
                        <div className={`p-2 rounded-lg ${pendingDepartures.length > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {pendingDepartures.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </div>
                    </div>
                    <span className={`text-3xl font-black font-mono block ${pendingDepartures.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {pendingDepartures.length} Pending
                    </span>
                    <p className="text-xs text-slate-400 mt-2">
                        {pendingDepartures.length > 0
                            ? 'Warning: Some guests scheduled to depart have not checked out yet. Check them out or extend stay.'
                            : 'All departures for today have settled their folios and checked out.'}
                    </p>
                </div>

                {/* 3. Audit Status */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Date Status</span>
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-xl font-black text-white font-mono block">
                        {alreadyAuditedToday ? 'Audit Executed' : 'Ready to Close'}
                    </span>
                    <p className="text-xs text-slate-400 mt-2">
                        Executing audit advances business date from <strong className="text-amber-300 font-mono">{businessDate}</strong> to next day.
                    </p>
                </div>
            </div>

            {/* In-House Stays Preview Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>In-House Stays Queued for Automatic Room Charge Posting</span>
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="py-2.5 px-3">Room</th>
                                <th className="py-2.5 px-3">Guest Name</th>
                                <th className="py-2.5 px-3">Room Type</th>
                                <th className="py-2.5 px-3">Rate Plan</th>
                                <th className="py-2.5 px-3 text-right">Night Rate (TZS)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {inHouseStays.map((stay) => {
                                const rate = stay.reservation_room?.rate_price_minor ?? 0;
                                return (
                                    <tr key={stay.id} className="hover:bg-slate-850/40">
                                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{stay.room?.room_number}</td>
                                        <td className="py-2.5 px-3 font-semibold text-white">{stay.guest?.first_name} {stay.guest?.last_name}</td>
                                        <td className="py-2.5 px-3 text-slate-300">{stay.room?.room_type?.name}</td>
                                        <td className="py-2.5 px-3 text-slate-400">Full Board Safari (FB)</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{formatTZS(rate)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Night Audit History Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Past Night Audit Records</span>
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="py-2.5 px-3">Business Date</th>
                                <th className="py-2.5 px-3">Rooms Occupied</th>
                                <th className="py-2.5 px-3">Room Revenue</th>
                                <th className="py-2.5 px-3">Payments Collected</th>
                                <th className="py-2.5 px-3">Auditor</th>
                                <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {auditHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-slate-500">
                                        No previous night audits recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                auditHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-850/40">
                                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{item.business_date}</td>
                                        <td className="py-2.5 px-3 font-mono">{item.rooms_occupied} / {item.rooms_available}</td>
                                        <td className="py-2.5 px-3 font-mono text-white">{formatTZS(item.total_room_revenue_minor)}</td>
                                        <td className="py-2.5 px-3 font-mono text-emerald-400">{formatTZS(item.total_payments_collected_minor)}</td>
                                        <td className="py-2.5 px-3 text-slate-400">{item.performer?.name || 'System Admin'}</td>
                                        <td className="py-2.5 px-3 text-right">
                                            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Run Night Audit Confirmation Modal */}
            {confirmModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                            <Moon className="w-6 h-6" />
                        </div>

                        <h3 className="text-base font-bold text-white mb-2">
                            Execute Night Audit for {businessDate}?
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            This process will automatically post room charges to all {inHouseStays.length} in-house folios, generate daily revenue snapshots, and advance the business date to tomorrow.
                        </p>

                        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setConfirmModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRunAudit}
                                disabled={processing}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg shadow-indigo-600/30 text-xs transition disabled:opacity-50"
                            >
                                {processing ? 'Running Audit...' : 'Confirm & Run Night Audit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
