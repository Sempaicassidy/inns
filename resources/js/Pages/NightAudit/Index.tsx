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
            <Head title="End-of-Day Night Audit - THE INNS" />

            {/* Header Toolbar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-4 sm:mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3">
                    
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">End-of-Day Night Audit Wizard</h1>
                        
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3 w-full md:w-auto">
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left sm:text-right">
                        <span className="text-slate-500 block text-[9px] sm:text-[10px] uppercase font-bold">Business Date</span>
                        <span className="font-mono text-sky-700 font-bold text-xs sm:text-sm">{businessDate}</span>
                    </div>

                    <button
                        onClick={() => setConfirmModalOpen(true)}
                        disabled={processing}
                        className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-xs text-xs transition active-press disabled:opacity-50 shrink-0"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Execute Audit</span>
                    </button>
                </div>
            </div>

            {/* Pre-Audit Checklist & Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* 1. In-House Stays to Post */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">In-House Stays</span>
                        
                    </div>
                    <span className="text-3xl font-black text-emerald-600 font-mono block">
                        {inHouseStays.length} Rooms
                    </span>
                    
                </div>

                {/* 2. Pending Departures */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overdue Departures</span>
                        
                    </div>
                    <span className={`text-3xl font-black font-mono block ${pendingDepartures.length > 0 ? 'text-sky-600' : 'text-emerald-600'}`}>
                        {pendingDepartures.length} Pending
                    </span>
                    
                </div>

                {/* 3. Audit Status */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Date Status</span>
                        
                    </div>
                    <span className="text-xl font-black text-slate-900 font-mono block">
                        {alreadyAuditedToday ? 'Audit Executed' : 'Ready to Close'}
                    </span>
                    
                </div>
            </div>

            {/* In-House Stays Preview Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700 mb-3 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>In-House Stays Queued for Automatic Room Charge Posting</span>
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="py-2.5 px-3">Room</th>
                                <th className="py-2.5 px-3">Guest Name</th>
                                <th className="py-2.5 px-3">Room Type</th>
                                <th className="py-2.5 px-3">Rate Plan</th>
                                <th className="py-2.5 px-3 text-right">Night Rate (TZS)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                            {inHouseStays.map((stay) => {
                                const rate = stay.reservation_room?.rate_price_minor ?? 0;
                                return (
                                    <tr key={stay.id} className="hover:bg-slate-50/70 transition">
                                        <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{stay.room?.room_number}</td>
                                        <td className="py-2.5 px-3 font-bold text-slate-900">{stay.guest?.first_name} {stay.guest?.last_name}</td>
                                        <td className="py-2.5 px-3 text-slate-600">{stay.room?.room_type?.name}</td>
                                        <td className="py-2.5 px-3 text-slate-500">Full Board Safari (FB)</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatTZS(rate)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Night Audit History Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Past Night Audit Records</span>
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="py-2.5 px-3">Business Date</th>
                                <th className="py-2.5 px-3">Rooms Occupied</th>
                                <th className="py-2.5 px-3">Room Revenue</th>
                                <th className="py-2.5 px-3">Payments Collected</th>
                                <th className="py-2.5 px-3">Auditor</th>
                                <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                            {auditHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-slate-400">
                                        No previous night audits recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                auditHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                        <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{item.business_date}</td>
                                        <td className="py-2.5 px-3 font-mono font-semibold">{item.rooms_occupied} / {item.rooms_available}</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-900 font-semibold">{formatTZS(item.total_room_revenue_minor)}</td>
                                        <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">{formatTZS(item.total_payments_collected_minor)}</td>
                                        <td className="py-2.5 px-3 text-slate-600">{item.performer?.name || 'System Admin'}</td>
                                        <td className="py-2.5 px-3 text-right">
                                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
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
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center mb-4">
                            <Moon className="w-6 h-6" />
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            Execute Night Audit for {businessDate}?
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                            This process will automatically post room charges to all {inHouseStays.length} in-house folios, generate daily revenue snapshots, and advance the business date to tomorrow.
                        </p>

                        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setConfirmModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition active-press"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRunAudit}
                                disabled={processing}
                                className="btn btn-primary bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2 rounded-xl shadow-xs text-xs transition active-press disabled:opacity-50"
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
