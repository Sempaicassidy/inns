import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import OwnerReportCenter, { ReportData } from './Partials/OwnerReportCenter';
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowRight,
    ArrowRightLeft,
    ArrowUpRight,
    BarChart3,
    Banknote,
    Bed,
    Building2,
    Calendar,
    CheckCircle2,
    CheckSquare,
    ChevronRight,
    Clock,
    Coins,
    CreditCard,
    Crown,
    DollarSign,
    Eye,
    FileCheck,
    FileSpreadsheet,
    FileText,
    Filter,
    Landmark,
    Layers,
    Megaphone,
    MessageSquare,
    Percent,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Send,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Target,
    Trash2,
    TrendingDown,
    TrendingUp,
    UtensilsCrossed,
    User,
    UserCheck,
    Users,
    Wallet,
    X,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

interface GeneralManagerInfo {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    username: string;
}

interface MultiBranchItem {
    id: string;
    name: string;
    code: string | null;
    city: string;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    monthly_target_revenue_minor: number;
    target_progress_percent: number;
    total_rooms: number;
    occupied_rooms: number;
    occupancy_rate: number;
    month_revenue_minor: number;
    today_revenue_minor: number;
    month_expenses_minor: number;
    gop_minor: number;
    gop_margin_percent: number;
    adr_minor: number;
    revpar_minor: number;
    general_manager: GeneralManagerInfo | null;
}

interface RequisitionItem {
    id: string;
    requisition_no: string;
    title: string;
    category: string;
    amount_minor: number;
    urgency: 'routine' | 'priority' | 'emergency';
    justification: string;
    vendor_name: string | null;
    status: 'pending_owner' | 'approved' | 'rejected';
    owner_notes: string | null;
    created_at: string;
    approved_at: string | null;
    rejected_at: string | null;
    property?: { id: string; name: string; city: string };
    requester?: { id: number; name: string; email: string; username: string };
    approver?: { id: number; name: string };
}

interface DirectiveItem {
    id: string;
    title: string;
    directive_text: string;
    priority: 'normal' | 'high' | 'urgent';
    category: string;
    target_deadline: string | null;
    status: 'active' | 'acknowledged' | 'completed';
    created_at: string;
    acknowledged_at: string | null;
    acknowledgement_notes: string | null;
    property?: { id: string; name: string; city: string };
    creator?: { id: number; name: string };
    acknowledgedBy?: { id: number; name: string };
}

interface AuditDiscountItem {
    id: string;
    date: string;
    property_name: string;
    description: string;
    amount_minor: number;
    guest_name: string;
    folio_id: string;
}

interface CancelledBookingItem {
    id: string;
    ref_no: string;
    date: string;
    guest_name: string;
    property_name: string;
    total_amount_minor: number;
    notes: string;
}

interface DrawingItem {
    id: string;
    drawing_type: 'dividend' | 'draw' | 'capital_injection';
    amount_minor: number;
    payment_method: string;
    reference_no: string | null;
    drawing_date: string;
    notes: string | null;
    property?: { id: string; name: string };
    creator?: { id: number; name: string };
}

interface OwnerAnalytics {
    period: string;
    selected_property_id: string | null;
    range: { start: string | null; end: string | null; previous_start: string | null; previous_end: string | null };
    comparison: {
        revenue_minor: number;
        previous_revenue_minor: number;
        revenue_change_percent: number | null;
        expenses_minor: number;
        previous_expenses_minor: number;
        expenses_change_percent: number | null;
        gop_minor: number;
        previous_gop_minor: number;
        gop_change_percent: number | null;
        pos_revenue_minor: number;
        previous_pos_revenue_minor: number;
    };
    revenue_trend: Array<{ label: string; accommodation_minor: number; pos_minor: number; total_minor: number }>;
    occupancy: {
        total_rooms: number;
        occupied_rooms: number;
        available_rooms: number;
        reserved_rooms: number;
        out_of_order_rooms: number;
        occupancy_rate: number;
    };
    departments: Array<{ name: string; orders: number; revenue_minor: number }>;
    payments_by_method: Array<{ method: string; total_minor: number; count: number }>;
    staff: { total_active: number; by_role: Record<string, number> };
    alerts: Array<{ type: string; severity: 'info' | 'warning'; message: string; route: string }>;
}

interface OwnerProps extends PageProps {
    tenant: any;
    tab?: string;
    period?: string;
    start_date?: string;
    end_date?: string;
    selected_property_id?: string | null;
    reportType?: string;
    reportData?: ReportData;
    financial_kpis?: any;
    operational_kpis?: any;
    recent_transactions?: any[];
    recent_bookings?: any[];
    outstanding_folios?: any[];
    analytics?: OwnerAnalytics;
    metrics: {
        total_revenue_minor?: number;
        total_expenses_minor?: number;
        gross_operating_profit_minor?: number;
        gop_margin_percent?: number;
        total_payments_received_minor?: number;
        outstanding_balances_minor?: number;
        refunds_minor?: number;
        tax_collected_minor?: number;
        today_revenue_minor?: number;
        group_month_revenue_minor: number;
        group_today_revenue_minor: number;
        group_month_expenses_minor: number;
        group_gop_minor: number;
        group_gop_margin_percent: number;
        group_occupancy_rate: number;
        total_rooms_group: number;
        total_occupied_group: number;
        group_target_minor: number;
        group_target_progress_percent: number;
        pending_approvals_count: number;
        active_directives_count: number;
        total_drawings_minor: number;
        total_capital_injected_minor: number;
    };
    multiBranchData: MultiBranchItem[];
    requisitions: RequisitionItem[];
    directives: DirectiveItem[];
    discountsWatchlist: AuditDiscountItem[];
    cancelledBookings: CancelledBookingItem[];
    drawings: DrawingItem[];
    managersList: any[];
    inspectingPropertyId: string | null;
}

export default function OwnerPortalIndex({
    auth,
    tenant,
    tab = 'overview',
    period = 'month',
    start_date,
    end_date,
    selected_property_id,
    reportType = 'sales',
    reportData,
    financial_kpis,
    operational_kpis,
    recent_transactions = [],
    recent_bookings = [],
    outstanding_folios = [],
    analytics,
    metrics,
    multiBranchData = [],
    requisitions = [],
    directives = [],
    discountsWatchlist = [],
    cancelledBookings = [],
    drawings = [],
    managersList = [],
    inspectingPropertyId,
}: OwnerProps) {
    const [currentTab, setCurrentTab] = useState(tab || 'overview');
    const features = ((auth as any)?.tenant?.features || tenant?.features || {}) as Record<string, boolean>;
    const [overviewStartDate, setOverviewStartDate] = useState(start_date || '');
    const [overviewEndDate, setOverviewEndDate] = useState(end_date || '');
    const [overviewPropertyId, setOverviewPropertyId] = useState(selected_property_id || '');
    const [filterRequisitionStatus, setFilterRequisitionStatus] = useState<'all' | 'pending_owner' | 'approved' | 'rejected'>('all');

    // Modals
    const [showDirectiveModal, setShowDirectiveModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState<RequisitionItem | null>(null);
    const [showRejectModal, setShowRejectModal] = useState<RequisitionItem | null>(null);
    const [showTargetModal, setShowTargetModal] = useState<MultiBranchItem | null>(null);
    const [showDrawingModal, setShowDrawingModal] = useState(false);

    // Directive Form
    const directiveForm = useForm({
        title: '',
        directive_text: '',
        property_id: '',
        priority: 'high',
        category: 'operations',
        target_deadline: '',
    });

    // Approval Form
    const approvalForm = useForm({
        owner_notes: '',
        create_expense: true,
    });

    // Rejection Form
    const rejectForm = useForm({
        owner_notes: '',
    });

    // Target Form
    const targetForm = useForm({
        monthly_target_revenue: 0,
    });

    // Drawing Form
    const drawingForm = useForm({
        drawing_type: 'dividend',
        amount: '',
        property_id: '',
        payment_method: 'bank_transfer',
        drawing_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const handlePeriodChange = (pId: string) => {
        router.get(
            route('owner.index'),
            {
                tab: 'overview',
                period: pId,
                property_id: overviewPropertyId || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleCustomDateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!overviewStartDate || !overviewEndDate) return;
        router.get(
            route('owner.index'),
            {
                tab: 'overview',
                period: 'custom',
                start_date: overviewStartDate,
                end_date: overviewEndDate,
                property_id: overviewPropertyId || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handlePropertyChange = (propId: string) => {
        setOverviewPropertyId(propId);
        router.get(
            route('owner.index'),
            {
                tab: 'overview',
                period,
                start_date: overviewStartDate || undefined,
                end_date: overviewEndDate || undefined,
                property_id: propId || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const formatTzs = (amountMinor: number) => {
        return (
            'TZS ' +
            Math.round(amountMinor / 100).toLocaleString('en-US')
        );
    };

    const formatPaymentMethod = (method: string) => {
        const names: Record<string, string> = {
            cash: 'Cash',
            mpesa: 'Mobile Money Collection',
            tigopesa: 'Tigo Pesa',
            airtelmoney: 'Airtel Money',
            halopesa: 'Halo Pesa',
            card: 'Card',
            bank_transfer: 'Bank Transfer',
            city_ledger: 'City Ledger',
            room_folio: 'Room Folio',
        };
        return names[method] ?? method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const getPaymentMethodDetails = (method: string) => {
        switch (method.toLowerCase()) {
            case 'cash':
                return {
                    name: 'Cash',
                    category: 'Cash On Hand',
                    icon: Banknote,
                    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    dotClass: 'bg-emerald-500',
                    barClass: 'bg-emerald-500',
                    accentColor: 'text-emerald-700',
                    borderHover: 'hover:border-emerald-300',
                };
            case 'mpesa':
            case 'mobile_money':
                return {
                    name: 'Mobile Money Collection',
                    category: 'Mobile Money',
                    icon: Smartphone,
                    badgeClass: 'bg-red-50 text-red-700 border-red-200',
                    dotClass: 'bg-red-500',
                    barClass: 'bg-red-500',
                    accentColor: 'text-red-700',
                    borderHover: 'hover:border-red-300',
                };
            case 'tigopesa':
                return {
                    name: 'Tigo Pesa (Mixx)',
                    category: 'Mobile Money',
                    icon: Smartphone,
                    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
                    dotClass: 'bg-blue-500',
                    barClass: 'bg-blue-500',
                    accentColor: 'text-blue-700',
                    borderHover: 'hover:border-blue-300',
                };
            case 'airtelmoney':
                return {
                    name: 'Airtel Money',
                    category: 'Mobile Money',
                    icon: Smartphone,
                    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
                    dotClass: 'bg-rose-500',
                    barClass: 'bg-rose-500',
                    accentColor: 'text-rose-700',
                    borderHover: 'hover:border-rose-300',
                };
            case 'halopesa':
                return {
                    name: 'Halo Pesa',
                    category: 'Mobile Money',
                    icon: Smartphone,
                    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
                    dotClass: 'bg-orange-500',
                    barClass: 'bg-orange-500',
                    accentColor: 'text-orange-700',
                    borderHover: 'hover:border-orange-300',
                };
            case 'bank_transfer':
                return {
                    name: 'Bank Transfer (Benki)',
                    category: 'Direct Deposit',
                    icon: Landmark,
                    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
                    dotClass: 'bg-purple-500',
                    barClass: 'bg-purple-500',
                    accentColor: 'text-purple-700',
                    borderHover: 'hover:border-purple-300',
                };
            case 'card':
                return {
                    name: 'Credit / Debit Card',
                    category: 'POS Terminal',
                    icon: CreditCard,
                    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
                    dotClass: 'bg-sky-500',
                    barClass: 'bg-sky-500',
                    accentColor: 'text-sky-700',
                    borderHover: 'hover:border-sky-300',
                };
            case 'room_folio':
                return {
                    name: 'Room Folio',
                    category: 'Room Charge',
                    icon: Bed,
                    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
                    dotClass: 'bg-amber-500',
                    barClass: 'bg-amber-500',
                    accentColor: 'text-amber-700',
                    borderHover: 'hover:border-amber-300',
                };
            default:
                return {
                    name: formatPaymentMethod(method),
                    category: 'Payment Channel',
                    icon: Wallet,
                    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
                    dotClass: 'bg-slate-500',
                    barClass: 'bg-slate-500',
                    accentColor: 'text-slate-800',
                    borderHover: 'hover:border-slate-300',
                };
        }
    };

    const handleCreateDirective = (e: React.FormEvent) => {
        e.preventDefault();
        directiveForm.post(route('owner.directives.store'), {
            onSuccess: () => {
                setShowDirectiveModal(false);
                directiveForm.reset();
            },
        });
    };

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showApprovalModal) return;
        approvalForm.post(route('owner.requisitions.approve', showApprovalModal.id), {
            onSuccess: () => {
                setShowApprovalModal(null);
                approvalForm.reset();
            },
        });
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showRejectModal) return;
        rejectForm.post(route('owner.requisitions.reject', showRejectModal.id), {
            onSuccess: () => {
                setShowRejectModal(null);
                rejectForm.reset();
            },
        });
    };

    const handleUpdateTarget = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showTargetModal) return;
        targetForm.post(route('owner.properties.target', showTargetModal.id), {
            onSuccess: () => {
                setShowTargetModal(null);
                targetForm.reset();
            },
        });
    };

    const handleCreateDrawing = (e: React.FormEvent) => {
        e.preventDefault();
        drawingForm.post(route('owner.drawings.store'), {
            onSuccess: () => {
                setShowDrawingModal(false);
                drawingForm.reset();
            },
        });
    };

    const filteredRequisitions = requisitions.filter(item => {
        if (filterRequisitionStatus === 'all') return true;
        return item.status === filterRequisitionStatus;
    });

    return (
        <AuthenticatedLayout>
            <Head title="Executive Owner Suite — Board Oversight & Capital Governance" />

            <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-24">
                {/* ─── 1. ELITE EXECUTIVE HEADER ──────────────────────────── */}
                <header className="bg-white border-b border-slate-200/80 shadow-2xs sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                            {/* Brand & Organization */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                                    {(tenant?.name || 'P').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight capitalize leading-tight">
                                        {tenant?.name || 'Executive Holdings'}
                                    </h1>
                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                                        Consolidated Board Oversight, Chain of Command & Capital Performance
                                    </p>
                                </div>
                            </div>

                            {/* Action Toolbar */}
                            <div className="flex items-center gap-2 shrink-0">
                                <Link
                                    href={route('dashboard')}
                                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition shadow-2xs shrink-0"
                                    title="Switch to General Manager Operations View"
                                >
                                    Manager View
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setShowDirectiveModal(true)}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs transition cursor-pointer shrink-0"
                                >
                                    Issue Directive
                                </button>
                            </div>
                        </div>

                        {/* Executive Navigation Tabs (Humanic, Solid Colors, No Icons, No Dark Colors) */}
                        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100">
                            <nav className="flex items-center gap-1.5 sm:gap-2 flex-wrap" aria-label="Executive Navigation">
                                {[
                                    { id: 'overview', label: 'Overview', show: true },
                                    { id: 'branches', label: 'Branches', show: features.multi_branch !== false && (multiBranchData.length > 1 || (tenant as any)?.max_branches > 1) },
                                    { id: 'reports', label: 'Reports Center', show: features.hotel_reports !== false },
                                    { id: 'financials', label: 'Financials', show: features.accounting !== false },
                                    {
                                        id: 'approvals',
                                        label: 'Approvals',
                                        count: metrics.pending_approvals_count,
                                        show: true,
                                    },
                                    {
                                        id: 'directives',
                                        label: 'Directives',
                                        count: metrics.active_directives_count,
                                        show: true,
                                    },
                                    { id: 'audit', label: 'Audit & Risk', show: true },
                                ].filter(tabItem => tabItem.show !== false).map(tabItem => {
                                    const isActive = currentTab === tabItem.id;
                                    return (
                                        <button
                                            key={tabItem.id}
                                            type="button"
                                            onClick={() => {
                                                setCurrentTab(tabItem.id);
                                                if (tabItem.id === 'reports') {
                                                    router.get(
                                                        route('owner.index'),
                                                        { tab: 'reports', report_type: reportType || 'sales' },
                                                        { preserveState: true, preserveScroll: true }
                                                    );
                                                }
                                            }}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                isActive
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            <span>{tabItem.label}</span>
                                            {typeof tabItem.count === 'number' && tabItem.count > 0 && (
                                                <span
                                                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                                        isActive
                                                            ? 'bg-white text-blue-700'
                                                            : 'bg-rose-500 text-white'
                                                    }`}
                                                >
                                                    {tabItem.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* ─── MAIN EXECUTIVE CONTENT CONTAINER ───────────────────────────── */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-8">
                    {/* ─── TAB 1: EXECUTIVE OVERVIEW ──────────────────────────────── */}
                    {currentTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Urgent Approvals Banner */}
                            {metrics.pending_approvals_count > 0 && (
                                <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-950 text-sm">
                                                {metrics.pending_approvals_count} Requisition{metrics.pending_approvals_count > 1 ? 's' : ''} Awaiting Your Sign-Off
                                            </h4>
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                Branch managers have submitted expenditure requests requiring executive authorization.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentTab('approvals')}
                                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
                                    >
                                        <span>Review Approvals</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* ─── EXECUTIVE SCOPE & TIME FILTER BAR ───────────────────────── */}
                            <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    {/* Left: Quick Period Chips & Title */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-2 mr-1">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                <Filter className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                                Scope:
                                            </span>
                                        </div>

                                        <div className="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
                                            {[
                                                { id: 'today', label: 'Today' },
                                                { id: '7d', label: '7D' },
                                                { id: '30d', label: '30D' },
                                                { id: 'month', label: 'This Month' },
                                                { id: 'year', label: 'This Year' },
                                            ].map((p) => {
                                                const isActive = period === p.id;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => handlePeriodChange(p.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                            isActive
                                                                ? 'bg-blue-600 text-white shadow-xs'
                                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                                        }`}
                                                    >
                                                        {p.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Center & Right: Custom Range & Branch Dropdown */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <form onSubmit={handleCustomDateSubmit} className="flex items-center gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <input
                                                    type="date"
                                                    value={overviewStartDate}
                                                    onChange={(e) => setOverviewStartDate(e.target.value)}
                                                    className="bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0"
                                                    title="Start Date"
                                                />
                                                <span className="text-slate-400 font-bold">to</span>
                                                <input
                                                    type="date"
                                                    value={overviewEndDate}
                                                    onChange={(e) => setOverviewEndDate(e.target.value)}
                                                    className="bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0"
                                                    title="End Date"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                                            >
                                                Apply Range
                                            </button>
                                        </form>

                                        {multiBranchData.length > 1 && (
                                            <select
                                                value={overviewPropertyId}
                                                onChange={(e) => handlePropertyChange(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                            >
                                                <option value="">All Branches ({multiBranchData.length})</option>
                                                {multiBranchData.map((b) => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>
                                            Reconciled Accounting Period:{' '}
                                            <strong className="text-slate-800 font-extrabold font-mono">
                                                {analytics?.range?.start || start_date || 'Cycle Start'}
                                            </strong>{' '}
                                            through{' '}
                                            <strong className="text-slate-800 font-extrabold font-mono">
                                                {analytics?.range?.end || end_date || 'Now'}
                                            </strong>
                                        </span>
                                    </div>
                                    <span className="text-slate-400">
                                        All monetary metrics reported in TZS
                                    </span>
                                </div>
                            </section>

                            {/* ─── 1. EXECUTIVE PAYMENT CHANNELS & COLLECTIONS (IMAGE 1) ───── */}
                            <section className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-5 h-5 text-emerald-600" />
                                            <h3 className="text-base sm:text-lg font-black text-slate-950">
                                                Collections by Payment Mode & Channel
                                            </h3>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Real-time tender breakdown across Cash, M-Pesa, Tigo Pesa, Airtel Money, and Bank Deposits
                                        </p>
                                    </div>

                                    {/* Aggregate Total Badge */}
                                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-2xs self-start sm:self-auto">
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                Total Tender ({period.toUpperCase()})
                                            </span>
                                            <span className="text-sm sm:text-base font-black text-emerald-700">
                                                {formatTzs((analytics?.payments_by_method ?? []).reduce((acc, p) => acc + (p.total_minor || 0), 0))}
                                            </span>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center">
                                            <Coins className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {(!analytics?.payments_by_method || analytics.payments_by_method.length === 0) ? (
                                    <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center text-slate-400">
                                        <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-60" />
                                        <p className="text-xs font-semibold">No payment collections recorded in the selected period ({period.toUpperCase()}).</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Multi-channel proportion visual bar */}
                                        {(() => {
                                            const totalMinor = (analytics.payments_by_method ?? []).reduce((acc, p) => acc + (p.total_minor || 0), 0);
                                            if (totalMinor <= 0) return null;
                                            return (
                                                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                                            Channel Revenue Share
                                                        </span>
                                                        <span className="text-[11px] font-bold text-slate-600">
                                                            {(analytics.payments_by_method ?? []).reduce((acc, p) => acc + (p.count || 0), 0)} Total Transactions
                                                        </span>
                                                    </div>
                                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                                        {analytics.payments_by_method.map((p) => {
                                                            const pct = totalMinor > 0 ? (p.total_minor / totalMinor) * 100 : 0;
                                                            if (pct <= 0) return null;
                                                            const details = getPaymentMethodDetails(p.method);
                                                            return (
                                                                <div
                                                                    key={p.method}
                                                                    className={`${details.barClass} h-full transition-all duration-500 hover:opacity-85`}
                                                                    style={{ width: `${pct}%` }}
                                                                    title={`${details.name}: ${formatTzs(p.total_minor)} (${Math.round(pct)}%)`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Dynamic Responsive Grid of payment cards */}
                                        {(() => {
                                            const paymentCount = (analytics.payments_by_method ?? []).length;
                                            const gridColsClass =
                                                paymentCount === 1
                                                    ? 'grid-cols-1'
                                                    : paymentCount === 2
                                                        ? 'grid-cols-1 sm:grid-cols-2'
                                                        : paymentCount === 3
                                                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

                                            return (
                                                <div className={`grid gap-5 ${gridColsClass}`}>
                                                    {analytics.payments_by_method.map((p) => {
                                                        const details = getPaymentMethodDetails(p.method);
                                                        const totalMinor = (analytics.payments_by_method ?? []).reduce((acc, item) => acc + (item.total_minor || 0), 0);
                                                        const sharePct = totalMinor > 0 ? Math.round((p.total_minor / totalMinor) * 100) : 0;
                                                        const IconComponent = details.icon;

                                                        return (
                                                            <div
                                                                key={p.method}
                                                                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition flex flex-col justify-between"
                                                            >
                                                                <div>
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${details.badgeClass} shadow-2xs`}>
                                                                                <IconComponent className="w-6 h-6" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <h4 className="text-sm sm:text-base font-black text-slate-900 truncate" title={details.name}>
                                                                                    {details.name}
                                                                                </h4>
                                                                                <span className="text-[11px] font-extrabold text-slate-400 block uppercase tracking-wider mt-0.5">
                                                                                    {details.category}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-xl">
                                                                            <span className="text-xs font-black text-slate-800">
                                                                                {sharePct}%
                                                                            </span>
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Share</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-5 pt-1">
                                                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                                                            Tender Volume
                                                                        </span>
                                                                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                                                                            <h3 className={`text-2xl sm:text-3xl font-black ${details.accentColor} tracking-tight whitespace-nowrap`}>
                                                                                {formatTzs(p.total_minor)}
                                                                            </h3>
                                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-medium text-slate-600 whitespace-nowrap">
                                                                                <span className="font-black text-slate-900">{p.count}</span>
                                                                                <span>{p.count === 1 ? 'transaction' : 'transactions'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Progress bar indicating share */}
                                                                <div className="mt-5 pt-3.5 border-t border-slate-100">
                                                                    <div className="flex items-center justify-between text-xs mb-2">
                                                                        <span className="text-[11px] font-bold text-slate-400">Channel Contribution</span>
                                                                        <span className="font-extrabold text-slate-700 text-xs">{sharePct}% of period tender</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                                                                        <div
                                                                            className={`h-2 rounded-full ${details.barClass} transition-all duration-500`}
                                                                            style={{ width: `${Math.min(100, Math.max(3, sharePct))}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </>
                                )}
                            </section>

                            {/* ─── 2. REVENUE TRAJECTORY & DEPARTMENTAL YIELD (IMAGE 3) ────── */}
                            {analytics && (
                                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left 2 Cols: Revenue Trajectory Bar Chart */}
                                    <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-emerald-600" />
                                                        <span>Revenue Trajectory & Daily Pacing</span>
                                                    </h4>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        Recognized cash flow pace across accommodation & POS outlets
                                                    </p>
                                                </div>
                                                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                                                    Total: {formatTzs(analytics.comparison?.revenue_minor ?? metrics.group_month_revenue_minor)}
                                                </span>
                                            </div>

                                            {(!analytics.revenue_trend || analytics.revenue_trend.length === 0) ? (
                                                <div className="py-16 text-center text-slate-400 text-xs font-medium">
                                                    <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-60" />
                                                    <p>No transaction flow recorded in this timeframe.</p>
                                                </div>
                                            ) : (
                                                <div className="flex items-end gap-2 h-44 pt-6 pb-2">
                                                    {analytics.revenue_trend.map((point: any, idx: number) => {
                                                        const max = Math.max(...analytics.revenue_trend.map((p: any) => p.total_minor), 1);
                                                        const h = Math.max(8, Math.round((point.total_minor / max) * 100));
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="flex-1 flex flex-col items-center gap-1.5 min-w-0 group relative"
                                                            >
                                                                {/* Tooltip on hover */}
                                                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-20">
                                                                    {point.label}: {formatTzs(point.total_minor)}
                                                                </div>
                                                                <div className="w-full flex flex-col justify-end h-32">
                                                                    <div
                                                                        className="w-full bg-blue-600 hover:bg-blue-500 rounded-t-lg transition-all duration-300"
                                                                        style={{ height: `${h}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-400 truncate w-full text-center">
                                                                    {point.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                                    Recognized Revenue
                                                </span>
                                            </div>
                                            <span className="font-bold text-slate-700">Period: {period.toUpperCase()}</span>
                                        </div>
                                    </div>

                                    {/* Right 1 Col: Department Revenue Contribution */}
                                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-sm font-black text-slate-950 flex items-center gap-2 mb-1">
                                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                                <span>Departmental Yield</span>
                                            </h4>
                                            <p className="text-xs text-slate-400 mb-4">
                                                Revenue breakdown across operational profit centers
                                            </p>

                                            <div className="space-y-4">
                                                {/* Rooms */}
                                                <div>
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                                            <Bed className="w-3.5 h-3.5 text-blue-600" />
                                                            <span>Rooms & Lodging</span>
                                                        </span>
                                                        <span className="font-black text-slate-900">
                                                            {formatTzs(Math.max(0, (analytics.comparison?.revenue_minor ?? 0) - (analytics.comparison?.pos_revenue_minor ?? 0)))}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="h-2 rounded-full bg-blue-600"
                                                            style={{
                                                                width: `${analytics.comparison?.revenue_minor > 0
                                                                    ? Math.round((Math.max(0, analytics.comparison.revenue_minor - (analytics.comparison.pos_revenue_minor ?? 0)) / analytics.comparison.revenue_minor) * 100)
                                                                    : 100}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* POS & Dining / Bar - Only when restaurant_pos is enabled */}
                                                {features.restaurant_pos !== false && (
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                                                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                                                                <span>Food, Dining & Bar (POS)</span>
                                                            </span>
                                                            <span className="font-black text-slate-900">
                                                                {formatTzs(analytics.comparison?.pos_revenue_minor ?? 0)}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="h-2 rounded-full bg-amber-500"
                                                                style={{
                                                                    width: `${analytics.comparison?.revenue_minor > 0
                                                                        ? Math.round(((analytics.comparison.pos_revenue_minor ?? 0) / analytics.comparison.revenue_minor) * 100)
                                                                        : 0}%`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Other Outlets / Departments - Respecting Tenant Enabled Modules */}
                                                {(analytics.departments ?? [])
                                                    .filter((dept: any) => {
                                                        const name = (dept.name || '').toLowerCase();
                                                        if (name.includes('restaurant') || name.includes('bar') || name.includes('dining') || name.includes('food')) {
                                                            return features.restaurant_pos !== false;
                                                        }
                                                        if (name.includes('grocery') || name.includes('minimart') || name.includes('supermarket') || name.includes('market')) {
                                                            return features.grocery_pos !== false;
                                                        }
                                                        return true;
                                                    })
                                                    .slice(0, 3).map((dept: any, i: number) => (
                                                    <div key={i}>
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="font-bold text-slate-700 capitalize">{dept.name}</span>
                                                            <span className="font-black text-slate-900">{formatTzs(dept.revenue_minor)}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.round((dept.revenue_minor / Math.max(analytics.comparison?.revenue_minor ?? 1, 1)) * 100))}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Key Efficiency Ratios */}
                                        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                                            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Operating Margin</span>
                                                <span className="font-black text-amber-800 text-sm">{metrics.group_gop_margin_percent}% GOP</span>
                                            </div>
                                            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Occupancy Rate</span>
                                                <span className="font-black text-slate-900 text-sm">{metrics.group_occupancy_rate}% Booked</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ─── 3. PRIMARY FINANCIAL KPIS & CASH GENERATION (EXECUTIVE DECK) ─ */}
                            <section className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                                {/* Deck Header */}
                                <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                                                    Financial Performance & Cash Generation
                                                </h2>
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-200/60">
                                                    Accrual Ledger
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">
                                                Mapato halisi yaliyotambulika, faida ghafi ya kiutendaji, na mtiririko wa fedha
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80">
                                            Kipindi: <span className="text-slate-900 font-black">{period.toUpperCase()}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* 4 Primary Executive Metric Cards */}
                                <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {/* Card 1: Recognized Revenue */}
                                    {(() => {
                                        const rev = financial_kpis?.current?.total_revenue_minor ?? metrics.total_revenue_minor ?? metrics.group_month_revenue_minor ?? 0;
                                        const roomRev = financial_kpis?.current?.room_revenue_minor ?? 0;
                                        const posRev = financial_kpis?.current?.pos_revenue_minor ?? 0;
                                        const totalShare = roomRev + posRev;
                                        const roomPct = totalShare > 0 ? Math.round((roomRev / totalShare) * 100) : 0;
                                        const posPct = totalShare > 0 ? 100 - roomPct : 0;
                                        const change = financial_kpis?.comparison?.revenue_change_percent;
                                        const isUp = (change ?? 0) >= 0;

                                        return (
                                            <div className="bg-gradient-to-b from-white to-slate-50/50 p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                                            Recognized Revenue
                                                        </span>
                                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                                            <TrendingUp className="w-4 h-4" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-2.5">
                                                        <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                                                            {formatTzs(rev)}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                            Accrual hospitality turnover
                                                        </p>
                                                    </div>

                                                    {/* Segmented Distribution Bar */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                                        <div className="h-2 w-full rounded-full bg-slate-100 flex overflow-hidden">
                                                            <div
                                                                style={{ width: `${features.restaurant_pos !== false ? Math.max(roomPct, 4) : 100}%` }}
                                                                className="h-full bg-blue-600"
                                                                title={`Lodging: ${formatTzs(roomRev)} (${roomPct}%)`}
                                                            />
                                                            {features.restaurant_pos !== false && (
                                                                <div
                                                                    style={{ width: `${Math.max(posPct, 4)}%` }}
                                                                    className="h-full bg-amber-500"
                                                                    title={`POS/Dining: ${formatTzs(posRev)} (${posPct}%)`}
                                                                />
                                                            )}
                                                        </div>
                                                        <div className={`grid ${features.restaurant_pos !== false ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-2.5 text-[11px]`}>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                                                <span className="text-slate-500 truncate">Rooms:</span>
                                                                <span className="font-bold text-slate-800 ml-auto">{formatTzs(roomRev)}</span>
                                                            </div>
                                                            {features.restaurant_pos !== false && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                                                    <span className="text-slate-500 truncate">POS:</span>
                                                                    <span className="font-bold text-slate-800 ml-auto">{formatTzs(posRev)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                                    <span>Cycle Performance:</span>
                                                    {change !== null && change !== undefined ? (
                                                        <span className={`font-black flex items-center gap-0.5 ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                            {Math.abs(change)}%
                                                        </span>
                                                    ) : (
                                                        <span className="font-bold text-emerald-600">Active</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Card 2: Gross Operating Profit (GOP) */}
                                    {(() => {
                                        const gop = financial_kpis?.current?.gop_minor ?? metrics.gross_operating_profit_minor ?? metrics.group_gop_minor ?? 0;
                                        const margin = financial_kpis?.current?.gop_margin_percent ?? metrics.gop_margin_percent ?? metrics.group_gop_margin_percent ?? 0;

                                        return (
                                            <div className="bg-gradient-to-b from-white to-amber-50/20 p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-amber-300 transition flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                                            Gross Operating Profit
                                                        </span>
                                                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                                                            <DollarSign className="w-4 h-4" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-2.5">
                                                        <div className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight">
                                                            {formatTzs(gop)}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                            Operational retained yield
                                                        </p>
                                                    </div>

                                                    {/* Efficiency Progress Bar */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                                                            <span className="text-slate-500 font-medium">GOP Margin:</span>
                                                            <span className="font-black text-amber-900">{margin}%</span>
                                                        </div>
                                                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                                            <div
                                                                style={{ width: `${Math.min(Math.max(margin, 5), 100)}%` }}
                                                                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                                                            />
                                                        </div>
                                                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                                                            <Percent className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                            <span>Net operational margin intact</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                                    <span>Operating Health:</span>
                                                    <span className="font-extrabold text-emerald-600">Optimal (Strong)</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Card 3: Operating Expenses (OPEX) */}
                                    {(() => {
                                        const rev = financial_kpis?.current?.total_revenue_minor ?? metrics.total_revenue_minor ?? metrics.group_month_revenue_minor ?? 0;
                                        const exp = financial_kpis?.current?.total_expenses_minor ?? metrics.total_expenses_minor ?? metrics.group_month_expenses_minor ?? 0;
                                        const costRatio = rev > 0 ? Math.round((exp / rev) * 100) : 0;
                                        const change = financial_kpis?.comparison?.expenses_change_percent;

                                        return (
                                            <div className="bg-gradient-to-b from-white to-rose-50/20 p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-rose-300 transition flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                                            Operating Expenses
                                                        </span>
                                                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                                                            <ArrowDownRight className="w-4 h-4" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-2.5">
                                                        <div className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
                                                            {formatTzs(exp)}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                            Authorized operational costs
                                                        </p>
                                                    </div>

                                                    {/* Cost Control Bar */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                                                            <span className="text-slate-500 font-medium">Cost to Revenue:</span>
                                                            <span className="font-black text-slate-800">{costRatio}%</span>
                                                        </div>
                                                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                                            <div
                                                                style={{ width: `${Math.min(costRatio, 100)}%` }}
                                                                className="h-full bg-rose-500 rounded-full"
                                                            />
                                                        </div>
                                                        <p className="mt-2.5 text-[11px] text-slate-500 truncate">
                                                            Supplies, procurement & vouchers
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                                    <span>Cost Containment:</span>
                                                    <span className="font-extrabold text-emerald-600">
                                                        {exp === 0 ? 'Zero Outflow' : 'Controlled'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Card 4: Total Collections */}
                                    {(() => {
                                        const payments = financial_kpis?.current?.total_payments_minor ?? metrics.total_payments_received_minor ?? 0;
                                        const cash = financial_kpis?.current?.cash_payments_minor ?? 0;
                                        const digital = financial_kpis?.current?.digital_payments_minor ?? 0;
                                        const totalTender = cash + digital;
                                        const cashPct = totalTender > 0 ? Math.round((cash / totalTender) * 100) : 0;
                                        const digitalPct = totalTender > 0 ? 100 - cashPct : 0;

                                        return (
                                            <div className="bg-gradient-to-b from-white to-blue-50/20 p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-blue-300 transition flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                                            Total Collections
                                                        </span>
                                                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                            <Coins className="w-4 h-4" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-2.5">
                                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                                            {formatTzs(payments)}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                            Actual cash & digital receipts
                                                        </p>
                                                    </div>

                                                    {/* Tender Channels Bar */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                                        <div className="h-2 w-full rounded-full bg-slate-100 flex overflow-hidden">
                                                            <div
                                                                style={{ width: `${Math.max(cashPct, 4)}%` }}
                                                                className="h-full bg-emerald-600"
                                                                title={`Cash: ${formatTzs(cash)} (${cashPct}%)`}
                                                            />
                                                            <div
                                                                style={{ width: `${Math.max(digitalPct, 4)}%` }}
                                                                className="h-full bg-blue-600"
                                                                title={`Digital: ${formatTzs(digital)} (${digitalPct}%)`}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px]">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                                                                <span className="text-slate-500 truncate">Cash:</span>
                                                                <span className="font-bold text-slate-800 ml-auto">{formatTzs(cash)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                                                <span className="text-slate-500 truncate">Digital:</span>
                                                                <span className="font-bold text-slate-800 ml-auto">{formatTzs(digital)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                                    <span>Settlement Status:</span>
                                                    <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        Reconciled
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Integrated Secondary Financial Balance Ribbon */}
                                <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {/* Ribbon 1: Guest Receivables */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                                    Guest Receivables
                                                </span>
                                                <div className="text-base sm:text-lg font-black text-amber-900 leading-tight">
                                                    {formatTzs(metrics.outstanding_balances_minor ?? 0)}
                                                </div>
                                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                    {outstanding_folios.length} open guest folios
                                                </p>
                                            </div>
                                        </div>

                                        {/* Ribbon 2: Tax Collected */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                                    Fiscal Tax Collected
                                                </span>
                                                <div className="text-base sm:text-lg font-black text-purple-700 leading-tight">
                                                    {formatTzs(financial_kpis?.current?.tax_collected_minor ?? metrics.tax_collected_minor ?? 0)}
                                                </div>
                                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                    VAT & statutory levies
                                                </p>
                                            </div>
                                        </div>

                                        {/* Ribbon 3: Refunds & Returns */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
                                                <ArrowRightLeft className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                                    Refunds & Returns
                                                </span>
                                                <div className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                                                    {formatTzs(financial_kpis?.current?.refunds_minor ?? metrics.refunds_minor ?? 0)}
                                                </div>
                                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                    Audited returns & reversals
                                                </p>
                                            </div>
                                        </div>

                                        {/* Ribbon 4: Revenue Target */}
                                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                                                <Target className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                                    Period Target Pacing
                                                </span>
                                                <div className="text-base sm:text-lg font-black text-emerald-700 leading-tight">
                                                    {metrics.group_target_progress_percent}%
                                                </div>
                                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                    Target: {metrics.group_target_minor > 0 ? formatTzs(metrics.group_target_minor) : 'Unset'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ─── 5. OPERATIONAL CAPACITY & HOSPITALITY YIELD ───── */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                        <Bed className="w-4 h-4 text-blue-600" />
                                        <span>Hospitality Capacity, Movement & Yield</span>
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {/* Occupancy Card */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                                Room Occupancy
                                            </span>
                                            <div className="flex items-baseline justify-between">
                                                <h3 className="text-3xl font-black text-slate-900">
                                                    {operational_kpis?.occupancy_rate ?? metrics.group_occupancy_rate ?? 0}%
                                                </h3>
                                                <span className="text-xs font-bold text-slate-500">
                                                    {operational_kpis?.occupied_rooms ?? metrics.total_occupied_group ?? 0} / {operational_kpis?.total_rooms ?? metrics.total_rooms_group ?? 0}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                                                <div
                                                    className="h-2 rounded-full bg-blue-600"
                                                    style={{ width: `${Math.min(100, operational_kpis?.occupancy_rate ?? metrics.group_occupancy_rate ?? 0)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">
                                            Live room inventory in active service
                                        </p>
                                    </div>

                                    {/* Available Rooms Card */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                                Ready for Sale
                                            </span>
                                            <div className="flex items-baseline justify-between">
                                                <h3 className="text-3xl font-black text-emerald-700">
                                                    {operational_kpis?.available_rooms ?? 0}
                                                </h3>
                                                <span className="text-xs font-bold text-slate-500">
                                                    Available Rooms
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                {operational_kpis?.out_of_order_rooms ?? 0} out of order · {operational_kpis?.confirmed_bookings ?? 0} reserved
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">
                                            Cleaned and inspected rooms ready for walk-ins
                                        </p>
                                    </div>

                                    {/* Movement Card */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                                In-House Activity
                                            </span>
                                            <div className="flex items-baseline justify-between">
                                                <h3 className="text-3xl font-black text-slate-900">
                                                    {operational_kpis?.current_checkins ?? 0}
                                                </h3>
                                                <span className="text-xs font-bold text-slate-500">
                                                    Checked-in Guests
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 font-medium">
                                                <span>Arr: {operational_kpis?.expected_checkins_today ?? 0}</span>
                                                <span>·</span>
                                                <span>Dep: {operational_kpis?.expected_checkouts_today ?? 0}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">
                                            Today's guest flow and front desk movement
                                        </p>
                                    </div>

                                    {/* ADR & RevPAR Yield Card */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                                ADR & RevPAR Yield
                                            </span>
                                            <div className="space-y-1">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-xs font-extrabold text-slate-400">ADR:</span>
                                                    <span className="text-base font-black text-slate-900 font-mono">
                                                        {formatTzs(operational_kpis?.adr_minor ?? 0)}
                                                    </span>
                                                </div>
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-xs font-extrabold text-slate-400">RevPAR:</span>
                                                    <span className="text-base font-black text-blue-700 font-mono">
                                                        {formatTzs(operational_kpis?.revpar_minor ?? 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">
                                            Daily room rate and revenue per capacity unit
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* ─── 6. OPERATIONAL ACTIVITY & AUDIT WATCHLISTS ───── */}
                            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Table 1: Recent Financial Settlements */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Coins className="w-4 h-4 text-emerald-600" />
                                                <h3 className="text-base font-black text-slate-950">Recent Recognized Payments</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentTab('reports');
                                                    router.get(route('owner.index'), { tab: 'reports', report_type: 'payment' });
                                                }}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>Payment Report</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {recent_transactions.length === 0 ? (
                                            <p className="text-xs text-slate-500 text-center py-8">No payment records found in this cycle.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                                                            <th className="pb-2">Reference</th>
                                                            <th className="pb-2">Guest / Method</th>
                                                            <th className="pb-2">Branch</th>
                                                            <th className="pb-2 text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {recent_transactions.slice(0, 6).map((tx: any) => (
                                                            <tr key={tx.id} className="hover:bg-slate-50/60">
                                                                <td className="py-2.5 font-mono font-bold text-slate-900">{tx.reference}</td>
                                                                <td className="py-2.5">
                                                                    <span className="font-extrabold text-slate-800 block">{tx.guest_name}</span>
                                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">{formatPaymentMethod(tx.payment_method)}</span>
                                                                </td>
                                                                <td className="py-2.5 text-slate-600">{tx.property_name}</td>
                                                                <td className="py-2.5 text-right font-black text-emerald-700">{formatTzs(tx.amount_minor)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Table 2: Recent Bookings & Reservations */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Bed className="w-4 h-4 text-blue-600" />
                                                <h3 className="text-base font-black text-slate-950">Recent Room Bookings</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentTab('reports');
                                                    router.get(route('owner.index'), { tab: 'reports', report_type: 'booking' });
                                                }}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>Booking Report</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {recent_bookings.length === 0 ? (
                                            <p className="text-xs text-slate-500 text-center py-8">No recent bookings recorded.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                                                            <th className="pb-2">Booking Ref</th>
                                                            <th className="pb-2">Guest</th>
                                                            <th className="pb-2">Stay Period</th>
                                                            <th className="pb-2">Status</th>
                                                            <th className="pb-2 text-right">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {recent_bookings.slice(0, 6).map((b: any) => (
                                                            <tr key={b.id} className="hover:bg-slate-50/60">
                                                                <td className="py-2.5 font-mono font-bold text-slate-900">{b.ref_no}</td>
                                                                <td className="py-2.5 font-bold text-slate-800">{b.guest_name}</td>
                                                                <td className="py-2.5 text-slate-500 font-mono text-[11px]">{b.check_in} → {b.check_out}</td>
                                                                <td className="py-2.5">
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                                                                        {b.status}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 text-right font-black text-slate-900">{formatTzs(b.total_amount_minor)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Table 3: Outstanding Customer Folios */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-amber-600" />
                                                <h3 className="text-base font-black text-slate-950">Outstanding Guest Receivables</h3>
                                            </div>
                                            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800">
                                                Total Due: {formatTzs(metrics.outstanding_balances_minor ?? 0)}
                                            </span>
                                        </div>

                                        {outstanding_folios.length === 0 ? (
                                            <p className="text-xs text-slate-500 text-center py-8">Zero outstanding guest receivables. All folios cleared!</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                                                            <th className="pb-2">Folio #</th>
                                                            <th className="pb-2">Guest / Property</th>
                                                            <th className="pb-2">Charges</th>
                                                            <th className="pb-2 text-right">Balance Due</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {outstanding_folios.slice(0, 6).map((f: any) => (
                                                            <tr key={f.id} className="hover:bg-slate-50/60">
                                                                <td className="py-2.5 font-mono font-bold text-slate-900">{f.folio_number}</td>
                                                                <td className="py-2.5">
                                                                    <span className="font-extrabold text-slate-800 block">{f.guest_name}</span>
                                                                    <span className="text-[10px] text-slate-400">{f.property_name}</span>
                                                                </td>
                                                                <td className="py-2.5 font-medium text-slate-700">{formatTzs(f.charges_minor)}</td>
                                                                <td className="py-2.5 text-right font-black text-amber-800">{formatTzs(f.balance_minor)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Table 4: Loss Prevention & Directives Watchlist */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4 text-rose-600" />
                                                <h3 className="text-base font-black text-slate-950">Loss Prevention & Directives</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentTab('audit')}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>Audit Logs</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-amber-900 block">Discounts & Price Overrides</span>
                                                    <span className="text-[11px] text-amber-700">{discountsWatchlist.length} recent room/item discounts flagged</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentTab('audit')}
                                                    className="px-3 py-1 rounded-xl bg-amber-200/80 text-amber-900 font-bold text-xs cursor-pointer"
                                                >
                                                    Inspect
                                                </button>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/70 text-xs flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-rose-900 block">Room Cancellations</span>
                                                    <span className="text-[11px] text-rose-700">{cancelledBookings.length} booking cancellations audited</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentTab('audit')}
                                                    className="px-3 py-1 rounded-xl bg-rose-200/80 text-rose-900 font-bold text-xs cursor-pointer"
                                                >
                                                    Inspect
                                                </button>
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/70 text-xs flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-blue-900 block">Active Executive Directives</span>
                                                    <span className="text-[11px] text-blue-700">{directives.length} directives dispatched to General Managers</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentTab('directives')}
                                                    className="px-3 py-1 rounded-xl bg-blue-200/80 text-blue-900 font-bold text-xs cursor-pointer"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ─── TAB 2: PROPERTIES & BRANCH PORTFOLIO ───────────────────── */}
                    {currentTab === 'branches' && (
                    <section className="space-y-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2.5">
                                <Building2 className="w-5 h-5 text-[#D4AF37]" />
                                <span>Properties & Branch Portfolio</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Live financial scorecard, revenue pacing, and general manager accountability across all properties
                            </p>
                        </div>

                        {/* Property Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {multiBranchData.map(branch => (
                                <div
                                    key={branch.id}
                                    className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-[#D4AF37] hover:shadow-md transition duration-200 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-950 leading-snug">
                                                    {branch.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                    {branch.city} · Branch Code: {branch.code || 'N/A'}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${branch.is_active
                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                                    }`}
                                            >
                                                {branch.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        {/* General Manager Pill */}
                                        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                                    {branch.general_manager?.name?.charAt(0) || 'M'}
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-900 leading-tight">
                                                        {branch.general_manager?.name || 'Unassigned GM'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {branch.general_manager?.phone || branch.general_manager?.email || 'No contact on file'}
                                                    </p>
                                                </div>
                                            </div>
                                            {branch.general_manager?.phone && (
                                                <a
                                                    href={`tel:${branch.general_manager.phone}`}
                                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:text-slate-900"
                                                    title="Call General Manager"
                                                >
                                                    <Phone className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>

                                        {/* Financial Metrics */}
                                        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Revenue</span>
                                                <span className="font-black text-emerald-700 text-base block mt-0.5">
                                                    {formatTzs(branch.month_revenue_minor)}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Operating Profit (GOP)</span>
                                                <span className="font-black text-amber-800 text-base block mt-0.5">
                                                    {formatTzs(branch.gop_minor)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Occupancy Indicator */}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                                <span className="text-slate-500">Room Occupancy</span>
                                                <span className="text-slate-900">
                                                    {branch.occupancy_rate}% ({branch.occupied_rooms}/{branch.total_rooms})
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, branch.occupancy_rate)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                                        <form action={route('owner.inspect', branch.id)} method="POST" className="flex-1">
                                            <input type="hidden" name="_token" value={(document.querySelector('meta[name="csrf-token"]') as any)?.content || ''} />
                                            <button
                                                type="submit"
                                                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                                                title="Inspect branch workspace in Manager Mode"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                                                <span>Inspect Operations</span>
                                            </button>
                                        </form>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowTargetModal(branch);
                                                targetForm.setData('monthly_target_revenue', Math.round(branch.monthly_target_revenue_minor / 100));
                                            }}
                                            className="py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs transition border border-purple-200 cursor-pointer"
                                            title="Set Monthly Target"
                                        >
                                            <Target className="w-4 h-4 text-purple-600" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Full Branch Performance Matrix Table */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-950">Consolidated Property Comparison Matrix</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Comprehensive P&L overview across all operational units</p>
                            </div>

                            <div className="overflow-x-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                <table className="w-full text-left text-xs text-slate-700">
                                    <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
                                        <tr>
                                            <th className="py-3.5 px-5">Property</th>
                                            <th className="py-3.5 px-5">General Manager</th>
                                            <th className="py-3.5 px-5">Occupancy</th>
                                            <th className="py-3.5 px-5">Monthly Revenue</th>
                                            <th className="py-3.5 px-5">Target Progress</th>
                                            <th className="py-3.5 px-5">Operating Expenses</th>
                                            <th className="py-3.5 px-5">GOP Profit</th>
                                            <th className="py-3.5 px-5">Margin %</th>
                                            <th className="py-3.5 px-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {multiBranchData.map(branch => (
                                            <tr key={branch.id} className="hover:bg-slate-50/70 transition">
                                                <td className="py-4 px-5 font-bold text-slate-900">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-slate-950 text-[#D4AF37] border border-amber-400/30 flex items-center justify-center font-black text-sm shrink-0">
                                                            {branch.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="leading-tight text-slate-950 font-black text-sm">{branch.name}</p>
                                                            <p className="text-[11px] text-slate-500 font-normal mt-0.5">{branch.city}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5">
                                                    {branch.general_manager ? (
                                                        <div>
                                                            <p className="font-extrabold text-slate-900">
                                                                {branch.general_manager.name}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 font-mono">
                                                                {branch.general_manager.phone || branch.general_manager.username}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-amber-700 font-bold italic">
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className="font-black text-slate-900 text-sm">{branch.occupancy_rate}%</span>
                                                    <span className="text-[11px] text-slate-500 block">
                                                        {branch.occupied_rooms} / {branch.total_rooms} rooms
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5 font-black text-emerald-700 text-sm">
                                                    {formatTzs(branch.month_revenue_minor)}
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className="font-black text-purple-700">
                                                        {branch.monthly_target_revenue_minor > 0
                                                            ? formatTzs(branch.monthly_target_revenue_minor)
                                                            : '—'}
                                                    </span>
                                                    {branch.monthly_target_revenue_minor > 0 && (
                                                        <span className="text-[11px] text-slate-500 block font-medium">
                                                            {branch.target_progress_percent}% achieved
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-5 font-bold text-rose-600">
                                                    {formatTzs(branch.month_expenses_minor)}
                                                </td>
                                                <td className="py-4 px-5 font-black text-amber-800 text-sm">
                                                    {formatTzs(branch.gop_minor)}
                                                </td>
                                                <td className="py-4 px-5 font-extrabold text-slate-900">
                                                    {branch.gop_margin_percent}%
                                                </td>
                                                <td className="py-4 px-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <form action={route('owner.inspect', branch.id)} method="POST">
                                                            <input type="hidden" name="_token" value={(document.querySelector('meta[name="csrf-token"]') as any)?.content || ''} />
                                                            <button
                                                                type="submit"
                                                                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                                                                title="Inspect branch operational workspace"
                                                            >
                                                                Inspect
                                                            </button>
                                                        </form>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowTargetModal(branch);
                                                                targetForm.setData(
                                                                    'monthly_target_revenue',
                                                                    Math.round(branch.monthly_target_revenue_minor / 100)
                                                                );
                                                            }}
                                                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs transition border border-purple-200 cursor-pointer"
                                                            title="Set Revenue Target"
                                                        >
                                                            Target
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                    )}

                    {/* ─── TAB 3: EXPENDITURE APPROVALS ───────────────────────────── */}
                    {currentTab === 'approvals' && (
                        <section className="space-y-6">
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                                                <CheckSquare className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-950">Expenditure Authorization Queue</h3>
                                                <p className="text-xs text-slate-500">Sign-off requests submitted by branch general managers</p>
                                            </div>
                                        </div>

                                        {/* Filter Chips */}
                                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto text-xs">
                                            {[
                                                { id: 'all', label: 'All' },
                                                { id: 'pending_owner', label: 'Pending' },
                                                { id: 'approved', label: 'Approved' },
                                                { id: 'rejected', label: 'Rejected' },
                                            ].map(f => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    onClick={() => setFilterRequisitionStatus(f.id as any)}
                                                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${filterRequisitionStatus === f.id
                                                        ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {filteredRequisitions.length === 0 ? (
                                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-xs">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2.5 opacity-80" />
                                            <p className="font-bold text-slate-800 text-sm">No Requisitions Found</p>
                                            <p className="mt-1">No expenditure requests match the selected status.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3.5">
                                            {filteredRequisitions.map(req => (
                                                <div
                                                    key={req.id}
                                                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-amber-800">
                                                                {req.requisition_no}
                                                            </span>
                                                            <span
                                                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${req.urgency === 'emergency'
                                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                    : req.urgency === 'priority'
                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                    }`}
                                                            >
                                                                {req.urgency}
                                                            </span>
                                                            <span
                                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${req.status === 'approved'
                                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                                    : req.status === 'rejected'
                                                                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                                    }`}
                                                            >
                                                                {req.status === 'pending_owner' ? 'Pending Approval' : req.status}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-black text-slate-900 mt-1.5 text-sm sm:text-base">{req.title}</h4>
                                                        <p className="text-slate-500 mt-0.5">
                                                            {req.property?.name} · Requested by {req.requester?.name} {req.category ? `· Category: ${req.category}` : ''}
                                                        </p>
                                                        {req.justification && (
                                                            <p className="text-slate-600 mt-2 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                                                                <strong>Justification:</strong> {req.justification}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                                        <span className="font-black text-emerald-700 text-lg">
                                                            {formatTzs(req.amount_minor)}
                                                        </span>
                                                        {req.status === 'pending_owner' ? (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowApprovalModal(req)}
                                                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                                                                >
                                                                    Authorize
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowRejectModal(req)}
                                                                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                                                                >
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-500 font-medium capitalize">
                                                                {req.status} {req.approver?.name ? `by ${req.approver.name}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ─── TAB 4: OWNER DIRECTIVES ────────────────────────────────── */}
                    {currentTab === 'directives' && (
                        <section className="space-y-6">
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D4AF37] flex items-center justify-center font-bold">
                                                <Send className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-950">Executive Directives to Branch GMs</h3>
                                                <p className="text-xs text-slate-500">Official strategic orders, instructions, and accountability tracking</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowDirectiveModal(true)}
                                            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-[#D4AF37] font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Issue New Directive</span>
                                        </button>
                                    </div>

                                    {directives.length === 0 ? (
                                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-xs">
                                            <Send className="w-12 h-12 text-slate-400 mx-auto mb-2.5 opacity-60" />
                                            <p className="font-bold text-slate-800 text-sm">No Active Directives</p>
                                            <p className="mt-1">Click "Issue New Directive" to dispatch strategic orders to managers.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {directives.map(dir => (
                                                <div
                                                    key={dir.id}
                                                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-extrabold uppercase text-[10px] px-2.5 py-0.5 rounded-full bg-slate-950 text-[#D4AF37]">
                                                                    {dir.category}
                                                                </span>
                                                                <span className="text-slate-400">·</span>
                                                                <span className="font-bold text-slate-700">
                                                                    {dir.property?.name || 'Group-Wide (All Properties)'}
                                                                </span>
                                                                {dir.target_deadline && (
                                                                    <>
                                                                        <span className="text-slate-400">·</span>
                                                                        <span className="font-mono text-slate-500">
                                                                            Deadline: {dir.target_deadline}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <h4 className="font-black text-slate-900 text-base mt-2">{dir.title}</h4>
                                                            <p className="text-slate-700 mt-1 leading-relaxed">
                                                                {dir.directive_text}
                                                            </p>
                                                            {dir.acknowledgement_notes && (
                                                                <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200/70 text-slate-600">
                                                                    <strong className="text-slate-800">GM Acknowledgement:</strong> {dir.acknowledgement_notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                                            <span
                                                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${dir.status === 'completed'
                                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                                    : dir.status === 'acknowledged'
                                                                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                                    }`}
                                                            >
                                                                {dir.status}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (confirm('Revoke this directive?')) {
                                                                        router.delete(route('owner.directives.destroy', dir.id));
                                                                    }
                                                                }}
                                                                className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                                                            >
                                                                Revoke
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ─── TAB 5: OWNER EQUITY & DIVIDENDS ────────────────────────── */}
                    {currentTab === 'financials' && (
                        <div className="space-y-12">

                    {/* ─── SECTION 4: OWNER EQUITY & DIVIDENDS ───────────────────── */}
                    <section className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-950 flex items-center gap-2.5">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                    <span>Owner Equity, Dividends & Capital</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Record of profit distributions, capital investments, and cumulative drawings
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDrawingModal(true)}
                                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Record Dividend / Capital</span>
                            </button>
                        </div>

                        {/* Top Equity Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Dividends Distributed</span>
                                <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
                                    {formatTzs(metrics.total_drawings_minor)}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Cumulative profit withdrawals</p>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Capital Injected</span>
                                <h3 className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">
                                    {formatTzs(metrics.total_capital_injected_minor)}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Capital investments made by owner</p>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">This Month's Operating Profit (GOP)</span>
                                <h3 className="text-2xl sm:text-3xl font-black text-amber-800 mt-2">
                                    {formatTzs(metrics.group_gop_minor)}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Surplus available for dividend distribution</p>
                            </div>
                        </div>

                        {/* Drawings Table */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-950">Owner Equity Transactions Ledger</h3>
                            </div>

                            {drawings.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-12">
                                    No dividend or capital transactions recorded yet.
                                </p>
                            ) : (
                                <div className="overflow-x-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                    <table className="w-full text-left text-xs text-slate-700">
                                        <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
                                            <tr>
                                                <th className="py-3.5 px-5">Date</th>
                                                <th className="py-3.5 px-5">Ref #</th>
                                                <th className="py-3.5 px-5">Transaction Type</th>
                                                <th className="py-3.5 px-5">Property</th>
                                                <th className="py-3.5 px-5">Tender Method</th>
                                                <th className="py-3.5 px-5">Notes</th>
                                                <th className="py-3.5 px-5 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {drawings.map(d => (
                                                <tr key={d.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3.5 px-5 font-mono text-slate-600">{d.drawing_date}</td>
                                                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{d.reference_no || '—'}</td>
                                                    <td className="py-3.5 px-5">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${d.drawing_type === 'dividend'
                                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                                                                }`}
                                                        >
                                                            {d.drawing_type.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-5 font-bold text-slate-900">
                                                        {d.property?.name || 'Group Central Account'}
                                                    </td>
                                                    <td className="py-3.5 px-5 font-medium text-slate-700">
                                                        {formatPaymentMethod(d.payment_method)}
                                                    </td>
                                                    <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate">{d.notes || '—'}</td>
                                                    <td
                                                        className={`py-3.5 px-5 text-right font-black text-sm ${d.drawing_type === 'capital_injection'
                                                            ? 'text-purple-700'
                                                            : 'text-emerald-700'
                                                            }`}
                                                    >
                                                        {d.drawing_type === 'capital_injection' ? '+' : '-'}
                                                        {formatTzs(d.amount_minor)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ─── SECTION 5: INTELLIGENCE & ANALYTICS ───────────────────── */}
                    {analytics && (
                        <section className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-950 flex items-center gap-2.5">
                                        <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
                                        <span>Financial & Business Intelligence</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {analytics.range.start} → {analytics.range.end} compared to prior cycle ({analytics.range.previous_start} → {analytics.range.previous_end})
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {multiBranchData.length > 1 && (
                                        <select
                                            value={analytics.selected_property_id ?? ''}
                                            onChange={(e) => router.get(route('owner.index'), {
                                                period,
                                                property_id: e.target.value || undefined,
                                            }, { preserveScroll: true })}
                                            className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 shadow-2xs"
                                        >
                                            <option value="">All Properties (Consolidated)</option>
                                            {multiBranchData.map((b) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    )}
                                    <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-2xl p-1 shadow-2xs">
                                        {[
                                            { id: 'today', label: 'Today' },
                                            { id: '7d', label: '7 Days' },
                                            { id: '30d', label: '30 Days' },
                                            { id: 'month', label: 'This Month' },
                                            { id: 'year', label: 'This Year' },
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => router.get(route('owner.index'), { period: p.id, property_id: analytics.selected_property_id ?? undefined }, { preserveScroll: true })}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${period === p.id
                                                    ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Comparison KPI cards */}
                            <div className={`grid grid-cols-1 sm:grid-cols-2 ${features.restaurant_pos !== false ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-5`}>
                                {[
                                    { label: 'Revenue', value: analytics.comparison.revenue_minor, prev: analytics.comparison.previous_revenue_minor, change: analytics.comparison.revenue_change_percent, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', show: true },
                                    { label: 'Expenses', value: analytics.comparison.expenses_minor, prev: analytics.comparison.previous_expenses_minor, change: analytics.comparison.expenses_change_percent, icon: ArrowDownRight, color: 'text-rose-600', bg: 'bg-rose-50', show: true },
                                    { label: 'Net GOP Profit', value: analytics.comparison.gop_minor, prev: analytics.comparison.previous_gop_minor, change: analytics.comparison.gop_change_percent, icon: DollarSign, color: 'text-amber-800', bg: 'bg-amber-50', show: true },
                                    { label: 'POS & Dining Revenue', value: analytics.comparison.pos_revenue_minor, prev: analytics.comparison.previous_pos_revenue_minor, change: null, icon: UtensilsCrossed, color: 'text-blue-600', bg: 'bg-blue-50', show: features.restaurant_pos !== false },
                                ].filter(kpi => kpi.show !== false).map((kpi) => {
                                    const Icon = kpi.icon;
                                    const isUp = (kpi.change ?? 0) >= 0;
                                    return (
                                        <div key={kpi.label} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{kpi.label}</span>
                                                <div className={`w-10 h-10 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center font-bold`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-950 mt-3 tracking-tight">{formatTzs(kpi.value)}</h3>
                                            <div className="flex items-center justify-between mt-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                                                <span>Prior: {formatTzs(kpi.prev)}</span>
                                                {kpi.change !== null && kpi.change !== undefined ? (
                                                    <span className={`font-extrabold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {isUp ? '▲' : '▼'} {Math.abs(kpi.change)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Revenue Trend Visualizer */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                                <h3 className="text-base font-black text-slate-950 mb-4">Revenue Pacing & Trajectory</h3>
                                {analytics.revenue_trend.length === 0 ? (
                                    <p className="text-xs text-slate-500">No revenue data for this period.</p>
                                ) : (
                                    <div className="flex items-end gap-1.5 h-44 pt-4">
                                        {analytics.revenue_trend.map((point, i) => {
                                            const max = Math.max(...analytics.revenue_trend.map(p => p.total_minor), 1);
                                            const h = Math.max(6, Math.round((point.total_minor / max) * 100));
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0" title={`${point.label}: ${formatTzs(point.total_minor)}`}>
                                                    <div className="w-full flex flex-col justify-end h-32">
                                                        <div className="w-full bg-gradient-to-t from-slate-900 to-[#D4AF37] rounded-t-lg transition-all duration-300 hover:opacity-80" style={{ height: `${h}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 truncate w-full text-center">{point.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Collections by Payment Method in Financials tab */}
                            {analytics.payments_by_method && analytics.payments_by_method.length > 0 && (
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                                                <Wallet className="w-4 h-4 text-emerald-600" />
                                                <span>Collections by Tender Channel ({period.toUpperCase()})</span>
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">Realized cash and electronic collections in this accounting cycle</p>
                                        </div>
                                        <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                                            Total: {formatTzs(analytics.payments_by_method.reduce((acc, p) => acc + (p.total_minor || 0), 0))}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {analytics.payments_by_method.map((p) => {
                                            const details = getPaymentMethodDetails(p.method);
                                            const IconComponent = details.icon;
                                            return (
                                                <div key={p.method} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${details.badgeClass}`}>
                                                        <IconComponent className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] font-bold text-slate-800 block truncate">{details.name}</span>
                                                        <span className="text-sm font-black text-slate-900 block">{formatTzs(p.total_minor)}</span>
                                                        <span className="text-[10px] text-slate-400 font-semibold">{p.count} transaction{p.count === 1 ? '' : 's'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                    </div>
                    )}

                    {/* ─── TAB: HOSPITALITY EXECUTIVE REPORTING CENTER ─────────── */}
                    {currentTab === 'reports' && reportData && (
                        <OwnerReportCenter
                            reportType={reportType || 'sales'}
                            reportData={reportData}
                            properties={multiBranchData.map((b) => ({ id: b.id, name: b.name }))}
                            period={period}
                            startDate={start_date}
                            endDate={end_date}
                            selectedPropertyId={selected_property_id}
                            formatTzs={formatTzs}
                        />
                    )}

                    {/* ─── TAB 6: AUDIT & LOSS PREVENTION ─────────────────────────── */}
                    {currentTab === 'audit' && (
                    <section className="space-y-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2.5">
                                <ShieldAlert className="w-5 h-5 text-rose-600" />
                                <span>Financial Audit & Revenue Protection Watchlist</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Real-time monitoring of room discounts, voided items, and guest cancellations to prevent branch revenue leakage
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Discounts Watchlist */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                                <h3 className="text-base font-black text-slate-950 flex items-center gap-2 mb-4">
                                    <Percent className="w-4 h-4 text-amber-600" />
                                    <span>Staff & Room Discounts Watchlist</span>
                                </h3>
                                {discountsWatchlist.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-8">
                                        No promotional or staff discounts recorded recently.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                        {discountsWatchlist.map(disc => (
                                            <div
                                                key={disc.id}
                                                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-extrabold text-slate-900">{disc.guest_name}</p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {disc.property_name} · {disc.description}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-mono">{disc.date}</span>
                                                </div>
                                                <span className="font-black text-amber-800 text-sm">
                                                    -{formatTzs(disc.amount_minor)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cancelled Bookings */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                                <h3 className="text-base font-black text-slate-950 flex items-center gap-2 mb-4">
                                    <XCircle className="w-4 h-4 text-rose-600" />
                                    <span>Room Cancellations & Reason Audit</span>
                                </h3>
                                {cancelledBookings.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-8">
                                        No room cancellations recorded recently.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                        {cancelledBookings.map(bk => (
                                            <div
                                                key={bk.id}
                                                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-rose-700">
                                                            {bk.ref_no}
                                                        </span>
                                                        <span className="text-slate-900 font-bold">· {bk.guest_name}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        {bk.property_name} · Reason: {bk.notes}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-mono">{bk.date}</span>
                                                </div>
                                                <span className="font-black text-slate-900 text-sm">
                                                    {formatTzs(bk.total_amount_minor)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                    )}
                </main>

                {/* ─── MODAL 1: CREATE DIRECTIVE ──────────────────────────────────── */}
                {showDirectiveModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowDirectiveModal(false)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3.5 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                                    <Megaphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-950">Issue Owner Directive</h3>
                                    <p className="text-xs text-slate-500">Official executive instructions dispatched to branch managers</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateDirective} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-800 font-bold mb-1">Directive Title:</label>
                                    <input
                                        type="text"
                                        required
                                        value={directiveForm.data.title}
                                        onChange={e => directiveForm.setData('title', e.target.value)}
                                        placeholder="e.g. Conduct monthly stock count and review food cost ratios"
                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-[#D4AF37]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-800 font-bold mb-1">Target Property:</label>
                                        <select
                                            value={directiveForm.data.property_id}
                                            onChange={e => directiveForm.setData('property_id', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900"
                                        >
                                            <option value="">All Properties (Group-wide)</option>
                                            {multiBranchData.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-800 font-bold mb-1">Priority:</label>
                                        <select
                                            value={directiveForm.data.priority}
                                            onChange={e => directiveForm.setData('priority', e.target.value as any)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-800 font-bold mb-1">Category:</label>
                                        <select
                                            value={directiveForm.data.category}
                                            onChange={e => directiveForm.setData('category', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900"
                                        >
                                            <option value="operations">Operations</option>
                                            <option value="finance">Finance & Cost Control</option>
                                            <option value="policy">Policy & Compliance</option>
                                            <option value="maintenance">Maintenance & Repairs</option>
                                            <option value="hr">Human Resources (HR)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-800 font-bold mb-1">Target Deadline:</label>
                                        <input
                                            type="date"
                                            value={directiveForm.data.target_deadline}
                                            onChange={e => directiveForm.setData('target_deadline', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-800 font-bold mb-1">Directive Instructions:</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={directiveForm.data.directive_text}
                                        onChange={e => directiveForm.setData('directive_text', e.target.value)}
                                        placeholder="Detailed instructions for the General Manager..."
                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-[#D4AF37]"
                                    />
                                </div>

                                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowDirectiveModal(false)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={directiveForm.processing}
                                        className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-[#D4AF37] font-black shadow-xs cursor-pointer"
                                    >
                                        Dispatch Directive
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── MODAL 2: APPROVE REQUISITION ───────────────────────────────── */}
                {showApprovalModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowApprovalModal(null)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3.5 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-950">Approve Expenditure Request</h3>
                                    <p className="text-xs font-mono text-amber-800">{showApprovalModal.requisition_no}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs mb-4">
                                <p className="font-extrabold text-slate-950 text-sm">{showApprovalModal.title}</p>
                                <p className="text-slate-500 mt-1">Property: {showApprovalModal.property?.name}</p>
                                <p className="font-black text-emerald-700 text-lg mt-2">
                                    {formatTzs(showApprovalModal.amount_minor)}
                                </p>
                            </div>

                            <form onSubmit={handleApprove} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-800 font-bold mb-1">Owner Approval Comments:</label>
                                    <textarea
                                        rows={3}
                                        value={approvalForm.data.owner_notes}
                                        onChange={e => approvalForm.setData('owner_notes', e.target.value)}
                                        placeholder="Add approval comments or payment release instructions..."
                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900"
                                    />
                                </div>

                                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium">
                                    <input
                                        type="checkbox"
                                        checked={approvalForm.data.create_expense}
                                        onChange={e => approvalForm.setData('create_expense', e.target.checked)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300"
                                    />
                                    <span>Automatically post to approved expenses ledger</span>
                                </label>

                                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowApprovalModal(null)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={approvalForm.processing}
                                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs cursor-pointer"
                                    >
                                        Confirm Approval
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── MODAL 3: REJECT REQUISITION ────────────────────────────────── */}
                {showRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowRejectModal(null)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3.5 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                                    <XCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-950">Decline Expenditure Request</h3>
                                    <p className="text-xs font-mono text-rose-700">{showRejectModal.requisition_no}</p>
                                </div>
                            </div>

                            <form onSubmit={handleReject} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-800 font-bold mb-1">Reason for Rejection:</label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={rejectForm.data.owner_notes}
                                        onChange={e => rejectForm.setData('owner_notes', e.target.value)}
                                        placeholder="Explain why this request is declined or what modifications are needed..."
                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900"
                                    />
                                </div>

                                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowRejectModal(null)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={rejectForm.processing}
                                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-xs cursor-pointer"
                                    >
                                        Decline Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── MODAL 4: SET BRANCH TARGET ─────────────────────────────────── */}
                {showTargetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowTargetModal(null)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3.5 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-950">Set Monthly Revenue Target</h3>
                                    <p className="text-xs text-slate-500">{showTargetModal.name}</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateTarget} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-800 font-bold mb-1">
                                        Target Monthly Revenue (TZS):
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={targetForm.data.monthly_target_revenue}
                                        onChange={e => targetForm.setData('monthly_target_revenue', Number(e.target.value))}
                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-purple-700 text-lg font-black focus:ring-2 focus:ring-purple-400"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        This target will be reflected as the monthly goal on the General Manager's dashboard.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowTargetModal(null)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={targetForm.processing}
                                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-xs cursor-pointer"
                                    >
                                        Save Target
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── MODAL 5: RECORD DRAWING / CAPITAL INJECTION ─────────────────── */}
                {showDrawingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowDrawingModal(false)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3.5 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                                    <Coins className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-950">Record Equity Transaction</h3>
                                    <p className="text-xs text-slate-500">Dividend distribution or capital injection</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateDrawing} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-800 font-bold mb-1">Transaction Nature:</label>
                                    <select
                                        value={drawingForm.data.drawing_type}
                                        onChange={e => drawingForm.setData('drawing_type', e.target.value as any)}
                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 font-extrabold"
                                    >
                                        <option value="dividend">Profit Dividend Distribution (Withdrawal)</option>
                                        <option value="capital_injection">Capital Injection (Investment into business)</option>
                                        <option value="draw">Owner Personal Draw</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-800 font-bold mb-1">Amount (TZS):</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="e.g. 10000000"
                                        value={drawingForm.data.amount}
                                        onChange={e => drawingForm.setData('amount', e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-emerald-700 font-black text-lg focus:ring-2 focus:ring-emerald-400"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-800 font-bold mb-1">Payment Method:</label>
                                        <select
                                            value={drawingForm.data.payment_method}
                                            onChange={e => drawingForm.setData('payment_method', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900"
                                        >
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="cash">Cash</option>
                                            <option value="mpesa">Mobile Money (M-Pesa / Airtel)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-800 font-bold mb-1">Transaction Date:</label>
                                        <input
                                            type="date"
                                            required
                                            value={drawingForm.data.drawing_date}
                                            onChange={e => drawingForm.setData('drawing_date', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-800 font-bold mb-1">Branch / Account:</label>
                                    <select
                                        value={drawingForm.data.property_id}
                                        onChange={e => drawingForm.setData('property_id', e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900"
                                    >
                                        <option value="">Group Central Treasury</option>
                                        {multiBranchData.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-800 font-bold mb-1">Notes / Description:</label>
                                    <textarea
                                        rows={2}
                                        value={drawingForm.data.notes}
                                        onChange={e => drawingForm.setData('notes', e.target.value)}
                                        placeholder="Reference or notes regarding this equity transaction..."
                                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900"
                                    />
                                </div>

                                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowDrawingModal(false)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={drawingForm.processing}
                                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs cursor-pointer"
                                    >
                                        Record Transaction
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
