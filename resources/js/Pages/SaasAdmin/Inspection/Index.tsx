import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    Clock,
    Copy,
    DollarSign,
    ExternalLink,
    Eye,
    Filter,
    Layers,
    Lock,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    TrendingUp,
    Users,
    XCircle,
} from 'lucide-react';

interface TenantDirectoryItem {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    plan: string;
    is_active: boolean;
    is_expired: boolean;
    license_expiry: string | null;
    subscription_price: number;
    created_at: string;
    properties_count: number;
    staff_count: number;
    active_staff_count: number;
    inactive_staff_count: number;
    enabled_modules_count: number;
    last_activity_at: string | null;
    has_active_inspection_session: boolean;
    active_session_reason: string | null;
    revenue_30d: number;
}

interface CrossTenantMetrics {
    total_tenants: number;
    active_tenants: number;
    inactive_tenants: number;
    expired_tenants: number;
    total_branches: number;
    total_users: number;
    active_users: number;
    plan_distribution: Record<string, number>;
    total_revenue_30d: number;
    security_alerts_count_7d: number;
    active_inspection_sessions_count: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props extends PageProps {
    directory: PaginatedData<TenantDirectoryItem>;
    crossTenantMetrics: CrossTenantMetrics;
    filters: {
        search: string;
        status: string;
        plan: string;
        sort_by: string;
        sort_order: string;
        per_page: number;
    };
}

export default function TenantInspectionIndex({ directory, crossTenantMetrics, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [plan, setPlan] = useState(filters.plan || 'all');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Modal state for quick support session
    const [selectedTenantForSession, setSelectedTenantForSession] = useState<TenantDirectoryItem | null>(null);
    const [sessionReason, setSessionReason] = useState('');
    const [isWriteMode, setIsWriteMode] = useState(false);
    const [isSubmittingSession, setIsSubmittingSession] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('saas-admin.inspection.index'),
            { search, status, plan, per_page: filters.per_page },
            { preserveState: true }
        );
    };

    const handleFilterChange = (newStatus: string, newPlan: string) => {
        setStatus(newStatus);
        setPlan(newPlan);
        router.get(
            route('saas-admin.inspection.index'),
            { search, status: newStatus, plan: newPlan, per_page: filters.per_page },
            { preserveState: true }
        );
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleStartSessionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantForSession || !sessionReason.trim()) return;

        setIsSubmittingSession(true);
        router.post(
            route('saas-admin.inspection.session.start', selectedTenantForSession.id),
            { reason: sessionReason, is_write_mode: isWriteMode },
            {
                onSuccess: () => {
                    setSelectedTenantForSession(null);
                    setSessionReason('');
                    setIsWriteMode(false);
                    setIsSubmittingSession(false);
                },
                onError: () => setIsSubmittingSession(false),
            }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="SaaS Tenant Inspection & Audit Center" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                Super Admin Platform Command
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Global Tenant Monitoring, Inspection & Audit Center
                            </h1>
                            <p className="text-sm text-slate-300 max-w-2xl">
                                Comprehensive multi-tenant surveillance. Deep-inspect tenant activities, financial performance, users, bookings, POS transactions, configurations, and system events with immutable audit logging.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={route('saas-admin.inspection.timeline')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 shadow-sm transition"
                            >
                                <Clock className="w-4 h-4 text-amber-400" />
                                Global Timeline
                            </Link>
                            <Link
                                href={route('saas-admin.inspection.financials')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md transition"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Cross-Tenant Financials
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Platform Overview KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                            <span>TOTAL TENANTS</span>
                            <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="mt-2 text-2xl font-black text-slate-900">
                            {crossTenantMetrics.total_tenants}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <span className="text-emerald-600 font-semibold">{crossTenantMetrics.active_tenants} Active</span>
                            <span>•</span>
                            <span className="text-rose-600 font-semibold">{crossTenantMetrics.inactive_tenants} Inactive</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                            <span>ACTIVE BRANCHES</span>
                            <Layers className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="mt-2 text-2xl font-black text-slate-900">
                            {crossTenantMetrics.total_branches}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            Across all active properties
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                            <span>PLATFORM USERS</span>
                            <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="mt-2 text-2xl font-black text-slate-900">
                            {crossTenantMetrics.total_users}
                        </div>
                        <div className="mt-1 text-xs text-emerald-600 font-semibold">
                            {crossTenantMetrics.active_users} active accounts
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                            <span>30D REVENUE</span>
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="mt-2 text-xl font-black text-emerald-700">
                            TZS {crossTenantMetrics.total_revenue_30d.toLocaleString()}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            Recognized platform volume
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                            <span>ACTIVE AUDITS</span>
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="mt-2 text-2xl font-black text-amber-700">
                            {crossTenantMetrics.active_inspection_sessions_count}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            Live support sessions
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                            <span>SECURITY (7D)</span>
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="mt-2 text-2xl font-black text-rose-700">
                            {crossTenantMetrics.security_alerts_count_7d}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            Failed logins & alerts
                        </div>
                    </div>
                </div>

                {/* Directory Search & Filters */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <form onSubmit={handleSearch} className="flex-1 relative">
                            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by business name, slug, subdomain, or tenant UUID..."
                                className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </form>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
                                <select
                                    value={status}
                                    onChange={(e) => handleFilterChange(e.target.value, plan)}
                                    className="text-xs rounded-xl border border-slate-300 py-2 px-3 text-slate-700 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                    <option value="expired">License Expired</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan:</span>
                                <select
                                    value={plan}
                                    onChange={(e) => handleFilterChange(status, e.target.value)}
                                    className="text-xs rounded-xl border border-slate-300 py-2 px-3 text-slate-700 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">All Plans</option>
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleFilterChange('all', 'all')}
                                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                title="Reset filters"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Tenant Directory Table */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3.5">Business & Identity</th>
                                    <th className="px-4 py-3.5">Plan & Tier</th>
                                    <th className="px-4 py-3.5">Branches</th>
                                    <th className="px-4 py-3.5">Staff & Accounts</th>
                                    <th className="px-4 py-3.5">Enabled Modules</th>
                                    <th className="px-4 py-3.5">30D Revenue</th>
                                    <th className="px-4 py-3.5">Status & Audit</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {directory.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                            No tenants found matching your filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    directory.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-100">
                                                        {item.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                                                            <Link href={route('saas-admin.inspection.show', item.id)}>
                                                                {item.name}
                                                            </Link>
                                                            {item.has_active_inspection_session && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                                                                    Auditing
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                                            <span>{item.subdomain}.inns.haulaenterprises.co.tz</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(item.id, item.id)}
                                                                className="text-slate-400 hover:text-slate-600 inline-flex items-center gap-0.5"
                                                                title="Copy Tenant ID"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                                {copiedId === item.id ? 'Copied!' : item.id.substring(0, 8) + '...'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                                        item.plan === 'enterprise'
                                                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                            : item.plan === 'pro'
                                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                    }`}>
                                                        {item.plan}
                                                    </span>
                                                    <div className="text-xs text-slate-500 font-medium">
                                                        TZS {item.subscription_price.toLocaleString()}/mo
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="text-sm font-semibold text-slate-800">
                                                    {item.properties_count} {item.properties_count === 1 ? 'branch' : 'branches'}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="space-y-0.5">
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {item.staff_count} users
                                                    </div>
                                                    <div className="text-xs text-emerald-600 font-medium">
                                                        {item.active_staff_count} active
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                                                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                                    {item.enabled_modules_count} Enabled
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="font-bold text-slate-900 text-sm">
                                                    TZS {item.revenue_30d.toLocaleString()}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    Recognized (30d)
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    {item.is_active ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                            <XCircle className="w-3 h-3 text-rose-500" />
                                                            Suspended
                                                        </span>
                                                    )}
                                                    {item.is_expired && (
                                                        <div className="text-[10px] text-rose-600 font-semibold">
                                                            License Expired
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route('saas-admin.inspection.show', item.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Inspect
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTenantForSession(item);
                                                            setSessionReason('');
                                                        }}
                                                        className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                                                        title="Start Support Inspection Session"
                                                    >
                                                        <Shield className="w-4 h-4 text-slate-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {directory.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                            <div>
                                Showing <span className="font-semibold text-slate-800">{directory.from}</span> to{' '}
                                <span className="font-semibold text-slate-800">{directory.to}</span> of{' '}
                                <span className="font-semibold text-slate-800">{directory.total}</span> tenants
                            </div>
                            <div className="flex items-center gap-1">
                                {directory.links.map((link, idx) => (
                                    link.url ? (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`px-3 py-1.5 rounded-lg border font-medium ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={idx}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-300"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Support Inspection Session Modal */}
            {selectedTenantForSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                                <Shield className="w-5 h-5 text-indigo-600" />
                                Start Audited Support Session
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTenantForSession(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-slate-500">
                                You are about to initiate an authenticated support inspection session for:
                            </p>
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900">
                                {selectedTenantForSession.name} ({selectedTenantForSession.subdomain})
                            </div>
                        </div>

                        <form onSubmit={handleStartSessionSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Official Audit Reason / Support Ticket ID <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={sessionReason}
                                    onChange={(e) => setSessionReason(e.target.value)}
                                    rows={3}
                                    required
                                    placeholder="e.g., Resolving payment dispute ticket #8492 requested by property director."
                                    className="w-full rounded-2xl border border-slate-300 text-sm p-3 focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="text-[11px] text-slate-400">
                                    This statement is written to immutable audit logs alongside your Super Admin credentials.
                                </span>
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Default access mode is <strong>Strictly Read-Only</strong>. Write actions will remain restricted unless separately authorized.</span>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTenantForSession(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingSession || !sessionReason.trim()}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
                                >
                                    {isSubmittingSession ? 'Recording...' : 'Authorize & Launch Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
