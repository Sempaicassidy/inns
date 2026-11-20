import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    BarChart3,
    Bed,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    DollarSign,
    Download,
    Eye,
    FileText,
    HelpCircle,
    Key,
    Layers,
    Lock,
    Package,
    Receipt,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShoppingBag,
    TrendingUp,
    UserCheck,
    Users,
    XCircle,
} from 'lucide-react';

interface Props extends PageProps {
    inspection: {
        tenant: {
            id: string;
            name: string;
            slug: string;
            subdomain: string;
            plan: string;
            max_branches: number;
            subscription_price: number;
            subscription_status: string | null;
            is_active: boolean;
            is_expired: boolean;
            license_expiry: string | null;
            created_at: string;
            updated_at: string;
        };
        active_session: {
            id: number;
            super_admin_name: string;
            reason: string;
            started_at: string;
            ip_address: string | null;
            is_write_mode: boolean;
        } | null;
        section: string;
        overview?: {
            branches: any[];
            modules: any[];
            stats: {
                branches_count: number;
                rooms_count: number;
                bookings_count: number;
                pos_orders_count: number;
                staff_count: number;
            };
            saas_invoices: any[];
        };
        users?: {
            list: any[];
            roles_breakdown: Record<string, number>;
            total_users: number;
            active_users: number;
        };
        bookings?: {
            list: any[];
            status_breakdown: Record<string, number>;
            total_bookings: number;
        };
        pos?: {
            list: any[];
            payment_methods: any[];
            shifts: any[];
            total_orders: number;
        };
        financials?: {
            recognized_revenue: number;
            lodging_revenue: number;
            pos_revenue: number;
            total_collections: number;
            total_expenses: number;
            net_operating_profit: number;
            total_receivables: number;
            recent_expenses: any[];
            recent_payments: any[];
        };
        inventory?: {
            items: any[];
            total_items_count: number;
            low_stock_count: number;
            recent_movements: any[];
        };
        reports?: {
            occupancy_rate: number;
            total_rooms: number;
            occupied_rooms: number;
            adr: number;
            rev_par: number;
            daily_pacing: { date: string; label: string; revenue: number }[];
        };
        config?: {
            tenant_settings: Record<string, any>;
            features: Record<string, boolean>;
            branch_configs: any[];
            is_credential_masked: boolean;
        };
        security?: {
            events: any[];
            inspection_sessions: any[];
        };
    };
    currentSection: string;
    filters: Record<string, any>;
}

export default function TenantInspectionShow({ inspection, currentSection }: Props) {
    const { tenant, active_session: activeSession } = inspection;
    const [activeTab, setActiveTab] = useState(currentSection || 'overview');
    const [copiedId, setCopiedId] = useState(false);

    // Support Session Modal
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [sessionReason, setSessionReason] = useState('');
    const [isWriteMode, setIsWriteMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Raw JSON Inspector Modal
    const [inspectorData, setInspectorData] = useState<any | null>(null);

    const switchTab = (tabKey: string) => {
        setActiveTab(tabKey);
        router.get(
            route('saas-admin.inspection.show', tenant.id),
            { section: tabKey },
            { preserveState: true }
        );
    };

    const copyTenantId = () => {
        navigator.clipboard.writeText(tenant.id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const handleStartSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionReason.trim()) return;

        setIsSubmitting(true);
        router.post(
            route('saas-admin.inspection.session.start', tenant.id),
            { reason: sessionReason, is_write_mode: isWriteMode },
            {
                onSuccess: () => {
                    setShowSessionModal(false);
                    setSessionReason('');
                    setIsWriteMode(false);
                    setIsSubmitting(false);
                },
                onError: () => setIsSubmitting(false),
            }
        );
    };

    const handleEndSession = (sessionId: number) => {
        if (!confirm('Conclude and end this active support inspection session?')) return;
        router.post(route('saas-admin.inspection.session.end', sessionId));
    };

    const tabs = [
        { key: 'overview', label: 'A. Business Overview', icon: Building2 },
        { key: 'users', label: 'B. Users & Staff', icon: Users },
        { key: 'bookings', label: 'C. Bookings & Reservations', icon: Bed },
        { key: 'pos', label: 'D. POS & Sales', icon: ShoppingBag },
        { key: 'financials', label: 'E. Financials', icon: DollarSign },
        { key: 'inventory', label: 'F. Inventory', icon: Package },
        { key: 'reports', label: 'G. Reports & Analytics', icon: BarChart3 },
        { key: 'config', label: 'H. Configuration & Secrets', icon: Key },
        { key: 'security', label: 'I. Security & Audit Logs', icon: ShieldAlert },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={`Inspect: ${tenant.name} - Super Admin`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Back Link */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route('saas-admin.inspection.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Global Tenant Directory
                    </Link>

                    <div className="flex items-center gap-3">
                        <a
                            href={route('saas-admin.inspection.export', tenant.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export Audit JSON
                        </a>
                    </div>
                </div>

                {/* Persistent Super Admin Inspection Banner */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-900/60 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                    INSPECTING TENANT WORKSPACE
                                </span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                    tenant.plan === 'enterprise'
                                        ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                                        : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                                }`}>
                                    Plan: {tenant.plan}
                                </span>
                                {tenant.is_active ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-900/50 text-rose-300 border border-rose-700/50">
                                        <XCircle className="w-3 h-3 text-rose-400" />
                                        Suspended
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                                    {tenant.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono">
                                    <span>subdomain: {tenant.subdomain}</span>
                                    <span>•</span>
                                    <button
                                        type="button"
                                        onClick={copyTenantId}
                                        className="hover:text-white inline-flex items-center gap-1"
                                    >
                                        <Copy className="w-3 h-3" />
                                        ID: {tenant.id} {copiedId && '(Copied!)'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Support Session Status Card */}
                        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/70 min-w-[280px] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    SUPPORT INSPECTION MODE
                                </span>
                                {activeSession ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        LIVE SESSION
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-700 text-slate-300">
                                        PASSIVE OBSERVER
                                    </span>
                                )}
                            </div>

                            {activeSession ? (
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-200">
                                        <div className="font-semibold text-white">{activeSession.super_admin_name}</div>
                                        <div className="text-[11px] text-slate-300 italic truncate max-w-[260px]">
                                            "{activeSession.reason}"
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Mode: {activeSession.is_write_mode ? 'Write Authorized' : 'Read-Only'}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleEndSession(activeSession.id)}
                                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition"
                                        >
                                            Conclude Session
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-400">
                                        Currently observing in standard audit mode.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowSessionModal(true)}
                                        className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        Start Support Session
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs (Sections A through I) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => switchTab(tab.key)}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content Display */}
                <div className="space-y-6">
                    {/* SECTION A: BUSINESS OVERVIEW */}
                    {activeTab === 'overview' && inspection.overview && (
                        <div className="space-y-6">
                            {/* High-level stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                    <div className="text-xs text-slate-500 font-semibold uppercase">Branches</div>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                        {inspection.overview.stats.branches_count}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">Physical properties</div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                    <div className="text-xs text-slate-500 font-semibold uppercase">Total Rooms</div>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                        {inspection.overview.stats.rooms_count}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">Configured lodging units</div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                    <div className="text-xs text-slate-500 font-semibold uppercase">Total Bookings</div>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                        {inspection.overview.stats.bookings_count}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">Lifetime reservations</div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                    <div className="text-xs text-slate-500 font-semibold uppercase">POS Orders</div>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                        {inspection.overview.stats.pos_orders_count}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">Dining & retail tickets</div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                    <div className="text-xs text-slate-500 font-semibold uppercase">Total Staff</div>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                        {inspection.overview.stats.staff_count}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">Platform user profiles</div>
                                </div>
                            </div>

                            {/* Branches / Properties */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    Configured Branches & Locations
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {inspection.overview.branches.map((b) => (
                                        <div key={b.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                                                {b.is_main && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                                        Main HQ
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                <div>Code: <strong className="text-slate-700">{b.code || '—'}</strong></div>
                                                <div>Rooms: <strong className="text-slate-700">{b.rooms_count}</strong></div>
                                                <div>Timezone: <strong className="text-slate-700">{b.timezone}</strong></div>
                                                <div>Currency: <strong className="text-slate-700">{b.currency}</strong></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Enabled Modules Matrix */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    Tenant Module Entitlements & Features
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {inspection.overview.modules.map((m) => (
                                        <div
                                            key={m.key}
                                            className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                                                m.is_enabled
                                                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                                                    : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                                            }`}
                                        >
                                            <div className="mt-0.5">
                                                {m.is_enabled ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="space-y-0.5 text-xs">
                                                <div className="font-bold text-slate-900">{m.name}</div>
                                                <div className="text-[11px] text-slate-500">{m.category}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION B: USERS AND STAFF */}
                    {activeTab === 'users' && inspection.users && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                        Registered Staff & Accounts ({inspection.users.total_users})
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Inspect credentials, roles, active branches, and last login activity.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                        {inspection.users.active_users} Active
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-left text-sm text-slate-700">
                                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Staff Name</th>
                                            <th className="px-4 py-3">Email / Username</th>
                                            <th className="px-4 py-3">Assigned Role</th>
                                            <th className="px-4 py-3">Branch Scope</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Last Login</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {inspection.users.list.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50/70">
                                                <td className="px-4 py-3 font-semibold text-slate-900">
                                                    {u.name}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                                                    <div>{u.email}</div>
                                                    {u.username && <div className="text-slate-400">@{u.username}</div>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                                                        {u.active_role || u.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-700">
                                                    {u.branch_name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {u.is_active ? (
                                                        <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                                                            <Check className="w-3.5 h-3.5" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-600 font-semibold text-xs">
                                                            Disabled
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                                                    {u.last_login_at || 'Never'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION C: BOOKINGS AND RESERVATIONS */}
                    {activeTab === 'bookings' && inspection.bookings && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                        Lodging Reservations & Stays ({inspection.bookings.total_bookings})
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Inspect reservation records, guest identities, room allocations, and payment balances.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {Object.entries(inspection.bookings.status_breakdown).map(([statusKey, count]) => (
                                        <span key={statusKey} className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 uppercase">
                                            {statusKey}: {count}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-left text-sm text-slate-700">
                                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Reservation #</th>
                                            <th className="px-4 py-3">Guest Details</th>
                                            <th className="px-4 py-3">Branch</th>
                                            <th className="px-4 py-3">Dates (In / Out)</th>
                                            <th className="px-4 py-3">Rooms</th>
                                            <th className="px-4 py-3">Total Amount</th>
                                            <th className="px-4 py-3">Balance Due</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {inspection.bookings.list.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                                    No reservations recorded for this tenant yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            inspection.bookings.list.map((b) => (
                                                <tr key={b.id} className="hover:bg-slate-50/70">
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-900 text-xs">
                                                        {b.reservation_number}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs">
                                                        <div className="font-semibold text-slate-900">{b.guest_name}</div>
                                                        <div className="text-slate-400">{b.guest_phone}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-700">
                                                        {b.branch_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                                                        {b.check_in_date} → {b.check_out_date}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                                                        {b.rooms || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-900">
                                                        TZS {b.total_amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-bold text-rose-600">
                                                        TZS {b.balance_amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 uppercase">
                                                            {b.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION D: POS AND SALES */}
                    {activeTab === 'pos' && inspection.pos && (
                        <div className="space-y-6">
                            {/* Payment Methods Breakdown */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {inspection.pos.payment_methods.map((pm, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200">
                                        <div className="text-xs text-slate-500 font-semibold uppercase">{pm.method}</div>
                                        <div className="text-xl font-black text-slate-900 mt-1">
                                            TZS {pm.amount.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">{pm.count} orders processed</div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent POS Orders */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                    Recent POS Transactions ({inspection.pos.total_orders})
                                </h3>
                                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                    <table className="w-full text-left text-sm text-slate-700">
                                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">Order #</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3">Branch</th>
                                                <th className="px-4 py-3">Items</th>
                                                <th className="px-4 py-3">Payment Method</th>
                                                <th className="px-4 py-3">Total Amount</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {inspection.pos.list.map((o) => (
                                                <tr key={o.id} className="hover:bg-slate-50/70">
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-900 text-xs">
                                                        {o.order_number}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs capitalize text-slate-700">
                                                        {o.order_type}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-700">
                                                        {o.branch_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-600">
                                                        {o.items_count} items
                                                    </td>
                                                    <td className="px-4 py-3 text-xs uppercase font-semibold text-slate-700">
                                                        {o.payment_method}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-black text-slate-900">
                                                        TZS {o.total_amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 uppercase">
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                                                        {o.created_at}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION E: FINANCIAL MANAGEMENT */}
                    {activeTab === 'financials' && inspection.financials && (
                        <div className="space-y-6">
                            {/* Financial KPIs */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Recognized Revenue</div>
                                    <div className="text-2xl font-black text-emerald-700 mt-2">
                                        TZS {inspection.financials.recognized_revenue.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Lodging: TZS {inspection.financials.lodging_revenue.toLocaleString()} • POS: TZS {inspection.financials.pos_revenue.toLocaleString()}
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Operating Expenses</div>
                                    <div className="text-2xl font-black text-rose-700 mt-2">
                                        TZS {inspection.financials.total_expenses.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">Approved operational vouchers</div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Net Operating Profit</div>
                                    <div className={`text-2xl font-black mt-2 ${inspection.financials.net_operating_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        TZS {inspection.financials.net_operating_profit.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">Revenue minus Expenses</div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Total Collections</div>
                                    <div className="text-2xl font-black text-blue-700 mt-2">
                                        TZS {inspection.financials.total_collections.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-rose-600 font-semibold mt-1">
                                        Receivables: TZS {inspection.financials.total_receivables.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Expenses & Recent Payments in 2-column layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-rose-600" />
                                        Recent Operating Expenses
                                    </h4>
                                    <div className="space-y-2">
                                        {inspection.financials.recent_expenses.length === 0 ? (
                                            <p className="text-xs text-slate-400 py-4 text-center">No expense vouchers recorded.</p>
                                        ) : (
                                            inspection.financials.recent_expenses.map((e) => (
                                                <div key={e.id} className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                                                    <div>
                                                        <div className="font-bold text-slate-800">{e.title}</div>
                                                        <div className="text-slate-400">{e.category} • {e.date}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-rose-600">TZS {e.amount.toLocaleString()}</div>
                                                        <span className="text-[10px] uppercase font-semibold text-slate-500">{e.status}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                        Recent Collections & Tender
                                    </h4>
                                    <div className="space-y-2">
                                        {inspection.financials.recent_payments.length === 0 ? (
                                            <p className="text-xs text-slate-400 py-4 text-center">No payments logged.</p>
                                        ) : (
                                            inspection.financials.recent_payments.map((p) => (
                                                <div key={p.id} className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                                                    <div>
                                                        <div className="font-mono font-bold text-slate-800">{p.payment_number}</div>
                                                        <div className="text-slate-400 uppercase">{p.method} • {p.branch_name}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-emerald-700">TZS {p.amount.toLocaleString()}</div>
                                                        <span className="text-[10px] text-slate-400 font-mono">{p.created_at}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION F: INVENTORY AND PROCUREMENT */}
                    {activeTab === 'inventory' && inspection.inventory && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                        Inventory Catalog & Stock Balances ({inspection.inventory.total_items_count})
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Inspect current stock levels, retail reorder thresholds, and inventory movements.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                        {inspection.inventory.low_stock_count} Low Stock Items
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-left text-sm text-slate-700">
                                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Item Name</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3">Selling Price</th>
                                            <th className="px-4 py-3">Cost Price</th>
                                            <th className="px-4 py-3">Current Stock</th>
                                            <th className="px-4 py-3">Reorder Point</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {inspection.inventory.items.map((i) => (
                                            <tr key={i.id} className="hover:bg-slate-50/70">
                                                <td className="px-4 py-3 font-semibold text-slate-900">
                                                    {i.name}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500">
                                                    {i.category_name}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-bold text-slate-900">
                                                    TZS {i.price.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-600">
                                                    TZS {i.cost_price.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-bold">
                                                    <span className={i.current_stock <= i.reorder_point ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>
                                                        {i.current_stock}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-400">
                                                    {i.reorder_point}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {i.current_stock <= i.reorder_point ? (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                                            Low Stock
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            In Stock
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION G: REPORTS & ANALYTICS */}
                    {activeTab === 'reports' && inspection.reports && (
                        <div className="space-y-6">
                            {/* Hospitality KPI Metrics */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Occupancy Rate</div>
                                    <div className="text-3xl font-black text-indigo-700 mt-2">
                                        {inspection.reports.occupancy_rate}%
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {inspection.reports.occupied_rooms} of {inspection.reports.total_rooms} rooms occupied
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-500 uppercase">ADR (Avg Daily Rate)</div>
                                    <div className="text-3xl font-black text-slate-900 mt-2">
                                        TZS {inspection.reports.adr.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">Average rental rate per paid room</div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-500 uppercase">RevPAR</div>
                                    <div className="text-3xl font-black text-slate-900 mt-2">
                                        TZS {inspection.reports.rev_par.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">Revenue per available room</div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Capacity Utilization</div>
                                    <div className="text-3xl font-black text-emerald-700 mt-2">
                                        {inspection.reports.total_rooms} Units
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">Active inventory pool</div>
                                </div>
                            </div>

                            {/* 14-Day Revenue Pacing Chart / Bar representation */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                    14-Day Daily Revenue Trajectory & Pacing
                                </h3>
                                <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-4">
                                    {inspection.reports.daily_pacing.map((dp, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-2">
                                            <div className="text-[10px] font-bold text-slate-600">
                                                {dp.revenue > 0 ? (dp.revenue >= 1000 ? `${Math.round(dp.revenue / 1000)}k` : dp.revenue) : '—'}
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-lg h-24 flex items-end p-1">
                                                <div
                                                    className="w-full bg-indigo-600 rounded-md transition-all duration-300"
                                                    style={{
                                                        height: `${Math.min(
                                                            100,
                                                            Math.max(8, (dp.revenue / Math.max(...inspection.reports!.daily_pacing.map((d) => d.revenue), 1)) * 100)
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-400">{dp.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION H: CONFIGURATION AND SECRETS (MASKED) */}
                    {activeTab === 'config' && inspection.config && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-amber-600" />
                                        Tenant Configuration & Protected Credentials
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Tenant settings, branch configurations, and payment gateways.
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                                    Sensitive Credentials Strictly Masked
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900">
                                <strong>Platform Security Policy:</strong> In compliance with security standards, all private keys, database passwords, API tokens, and webhook secrets belonging to this tenant have been automatically masked to protect client confidentiality.
                            </div>

                            {/* Raw Settings Viewer */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Tenant Settings Payload
                                </h4>
                                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto max-h-96">
                                    {JSON.stringify(inspection.config.tenant_settings, null, 2)}
                                </pre>
                            </div>

                            {/* Branch Configs */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Branch-Specific Policies & Tax Configs
                                </h4>
                                <pre className="p-4 rounded-2xl bg-slate-900 text-indigo-300 text-xs font-mono overflow-x-auto max-h-96">
                                    {JSON.stringify(inspection.config.branch_configs, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* SECTION I: SECURITY & SYSTEM EVENTS */}
                    {activeTab === 'security' && inspection.security && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                                        Immutable Tenant Audit Events & Access Trails
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Chronological audit records of sensitive business events, logins, and inspection activities.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-left text-sm text-slate-700">
                                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Timestamp</th>
                                            <th className="px-4 py-3">Module</th>
                                            <th className="px-4 py-3">Action Type</th>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3">Actor / User</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {inspection.security.events.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                                    No audit events logged for this tenant yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            inspection.security.events.map((evt) => (
                                                <tr key={evt.id} className="hover:bg-slate-50/70">
                                                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                                                        {evt.created_at}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                                                            {evt.module}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                                                        {evt.action_type}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-700 max-w-xs truncate">
                                                        {evt.description}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                                                        {evt.user_name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            evt.status === 'success'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}>
                                                            {evt.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {(evt.before_state || evt.after_state) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setInspectorData(evt)}
                                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                                            >
                                                                Inspect Diff
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Start Support Session Modal */}
            {showSessionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                                <Shield className="w-5 h-5 text-indigo-600" />
                                Initiate Audited Support Session
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSessionModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleStartSession} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Official Audit Reason / Support Ticket <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={sessionReason}
                                    onChange={(e) => setSessionReason(e.target.value)}
                                    rows={3}
                                    required
                                    placeholder="e.g., Investigating inventory mismatch requested by property manager."
                                    className="w-full rounded-2xl border border-slate-300 text-sm p-3 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Default access mode is <strong>Strictly Read-Only</strong>. No silent impersonation occurs.</span>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowSessionModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !sessionReason.trim()}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
                                >
                                    {isSubmitting ? 'Recording...' : 'Authorize Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inspector Diff Modal */}
            {inspectorData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                Audit Event State Payload (#{inspectorData.id})
                            </h3>
                            <button
                                type="button"
                                onClick={() => setInspectorData(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="text-xs text-slate-600">
                            <strong>Description:</strong> {inspectorData.description}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">Before State</div>
                                <pre className="p-3 rounded-xl bg-slate-900 text-slate-300 text-[11px] font-mono overflow-x-auto max-h-64">
                                    {JSON.stringify(inspectorData.before_state, null, 2) || 'null'}
                                </pre>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">After State</div>
                                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 text-[11px] font-mono overflow-x-auto max-h-64">
                                    {JSON.stringify(inspectorData.after_state, null, 2) || 'null'}
                                </pre>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setInspectorData(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
