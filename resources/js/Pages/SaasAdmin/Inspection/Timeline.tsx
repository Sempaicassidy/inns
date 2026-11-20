import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    Clock,
    Filter,
    Layers,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    User,
} from 'lucide-react';

interface TimelineEvent {
    id: number;
    tenant_id: string;
    tenant_name: string;
    user_id: number | null;
    user_name: string;
    branch_id: string | null;
    branch_name: string;
    module: string;
    action_type: string;
    description: string;
    record_type: string | null;
    record_id: string | null;
    before_state: any | null;
    after_state: any | null;
    status: string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    created_at_human: string;
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
    timeline: PaginatedData<TimelineEvent>;
    tenantsList: { id: string; name: string }[];
    filters: {
        tenant_id?: string;
        module: string;
        action_type: string;
        status: string;
        date_from?: string;
        date_to?: string;
        search: string;
    };
}

export default function GlobalTimeline({ timeline, tenantsList, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedTenant, setSelectedTenant] = useState(filters.tenant_id || '');
    const [selectedModule, setSelectedModule] = useState(filters.module || 'all');
    const [selectedAction, setSelectedAction] = useState(filters.action_type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const [diffModalEvent, setDiffModalEvent] = useState<TimelineEvent | null>(null);

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('saas-admin.inspection.timeline'),
            {
                search,
                tenant_id: selectedTenant || undefined,
                module: selectedModule,
                action_type: selectedAction,
                status: selectedStatus,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setSelectedTenant('');
        setSelectedModule('all');
        setSelectedAction('all');
        setSelectedStatus('all');
        setDateFrom('');
        setDateTo('');
        router.get(route('saas-admin.inspection.timeline'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Global Tenant Activity Timeline - Super Admin" />

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

                    <Link
                        href={route('saas-admin.inspection.financials')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
                    >
                        Cross-Tenant Financials →
                    </Link>
                </div>

                {/* Header */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/60">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Unified SaaS Audit Trail
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Global Tenant Activity Timeline
                    </h1>
                    <p className="text-sm text-slate-300 max-w-2xl mt-1">
                        Chronological record of sensitive activities, bookings, payments, and system events across all tenants.
                    </p>
                </div>

                {/* Filters Bar */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <form onSubmit={handleApplyFilters} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Search Text
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Description, actor, record..."
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Filter by Tenant
                                </label>
                                <select
                                    value={selectedTenant}
                                    onChange={(e) => setSelectedTenant(e.target.value)}
                                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Tenants</option>
                                    {tenantsList.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Module
                                </label>
                                <select
                                    value={selectedModule}
                                    onChange={(e) => setSelectedModule(e.target.value)}
                                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">All Modules</option>
                                    <option value="bookings">Bookings & Stays</option>
                                    <option value="pos">POS & Sales</option>
                                    <option value="financial">Financial & Accounting</option>
                                    <option value="users">Users & Roles</option>
                                    <option value="inventory">Inventory</option>
                                    <option value="config">Configuration</option>
                                    <option value="security">Security & Support</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Event Status
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="success">Success</option>
                                    <option value="failure">Failure / Alert</option>
                                    <option value="warning">Warning</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                    <span>From:</span>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="py-1 px-2 rounded-lg border border-slate-300 text-xs"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                    <span>To:</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="py-1 px-2 rounded-lg border border-slate-300 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                >
                                    Reset
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                                >
                                    Filter Timeline
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Timeline Event Feed */}
                    <div className="space-y-3 pt-2">
                        {timeline.data.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm">
                                No audit events found matching the selected filters.
                            </div>
                        ) : (
                            timeline.data.map((evt) => (
                                <div
                                    key={evt.id}
                                    className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link
                                                href={route('saas-admin.inspection.show', evt.tenant_id)}
                                                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
                                            >
                                                {evt.tenant_name}
                                            </Link>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                                                {evt.module}
                                            </span>
                                            <span className="font-mono text-xs font-bold text-slate-800">
                                                {evt.action_type}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                evt.status === 'success'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {evt.status}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-700">
                                            {evt.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                                            <span>Actor: <strong className="text-slate-600">{evt.user_name}</strong></span>
                                            <span>•</span>
                                            <span>Branch: <strong className="text-slate-600">{evt.branch_name}</strong></span>
                                            {evt.ip_address && (
                                                <>
                                                    <span>•</span>
                                                    <span>IP: {evt.ip_address}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                                        <div className="text-right text-xs">
                                            <div className="font-semibold text-slate-700">{evt.created_at_human}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{evt.created_at}</div>
                                        </div>

                                        {(evt.before_state || evt.after_state) && (
                                            <button
                                                type="button"
                                                onClick={() => setDiffModalEvent(evt)}
                                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 text-xs font-bold transition"
                                            >
                                                Payload Diff
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {timeline.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                            <div>
                                Showing <span className="font-semibold text-slate-800">{timeline.from}</span> to{' '}
                                <span className="font-semibold text-slate-800">{timeline.to}</span> of{' '}
                                <span className="font-semibold text-slate-800">{timeline.total}</span> events
                            </div>
                            <div className="flex items-center gap-1">
                                {timeline.links.map((link, idx) => (
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

            {/* Payload Diff Modal */}
            {diffModalEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                Audit Event Payload (#{diffModalEvent.id}) - {diffModalEvent.tenant_name}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setDiffModalEvent(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="text-xs text-slate-600">
                            <strong>Description:</strong> {diffModalEvent.description}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">Before State</div>
                                <pre className="p-3 rounded-xl bg-slate-900 text-slate-300 text-[11px] font-mono overflow-x-auto max-h-64">
                                    {JSON.stringify(diffModalEvent.before_state, null, 2) || 'null'}
                                </pre>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">After State</div>
                                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 text-[11px] font-mono overflow-x-auto max-h-64">
                                    {JSON.stringify(diffModalEvent.after_state, null, 2) || 'null'}
                                </pre>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setDiffModalEvent(null)}
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
