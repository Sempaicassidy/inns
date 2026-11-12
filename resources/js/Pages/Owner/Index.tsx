import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowRight,
    ArrowRightLeft,
    ArrowUpRight,
    BarChart3,
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
    analytics?: OwnerAnalytics;
    metrics: {
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

    const formatTzs = (amountMinor: number) => {
        return (
            'TZS ' +
            Math.round(amountMinor / 100).toLocaleString('en-US')
        );
    };

    const formatPaymentMethod = (method: string) => {
        const names: Record<string, string> = {
            cash: 'Cash',
            mpesa: 'M-Pesa',
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
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-[#D4AF37] flex items-center justify-center shrink-0 shadow-md ring-1 ring-amber-400/30">
                                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-xs" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight capitalize leading-tight">
                                            {tenant?.name || 'Executive Holdings'}
                                        </h1>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-950 text-[#D4AF37] border border-amber-500/30 shadow-2xs">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Executive Suite
                                        </span>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                                        Consolidated Board Oversight, Chain of Command & Capital Performance
                                    </p>
                                </div>
                            </div>

                            {/* Action Toolbar */}
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <Link
                                    href={route('dashboard')}
                                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs shrink-0"
                                    title="Switch to General Manager Operations View"
                                >
                                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Manager</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setShowDrawingModal(true)}
                                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                                >
                                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Equity / Capital</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowDirectiveModal(true)}
                                    className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                                >
                                    <Megaphone className="w-3.5 h-3.5 text-slate-950" />
                                    <span>Issue Directive</span>
                                </button>
                            </div>
                        </div>

                        {/* Executive Navigation Tabs (Clean, Modern, Zero Horizontal Scrollbar) */}
                        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100">
                            <nav className="flex items-center gap-1 sm:gap-2 flex-wrap" aria-label="Executive Navigation">
                                {[
                                    { id: 'overview', label: 'Overview', icon: Activity },
                                    { id: 'branches', label: 'Branches', icon: Building2 },
                                    {
                                        id: 'approvals',
                                        label: 'Approvals',
                                        icon: CheckSquare,
                                        count: metrics.pending_approvals_count,
                                    },
                                    {
                                        id: 'directives',
                                        label: 'Directives',
                                        icon: Send,
                                        count: metrics.active_directives_count,
                                    },
                                    { id: 'financials', label: 'Financials', icon: DollarSign },
                                    { id: 'audit', label: 'Audit & Risk', icon: ShieldAlert },
                                ].map(tabItem => {
                                    const Icon = tabItem.icon;
                                    const isActive = currentTab === tabItem.id;
                                    return (
                                        <button
                                            key={tabItem.id}
                                            type="button"
                                            onClick={() => setCurrentTab(tabItem.id)}
                                            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                isActive
                                                    ? 'bg-slate-950 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                                            }`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
                                            <span>{tabItem.label}</span>
                                            {typeof tabItem.count === 'number' && tabItem.count > 0 && (
                                                <span
                                                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                                        isActive
                                                            ? 'bg-[#D4AF37] text-slate-950'
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
                                        className="px-4 py-2 rounded-xl bg-slate-950 text-[#D4AF37] font-bold text-xs hover:bg-slate-900 transition flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
                                    >
                                        <span>Review Approvals</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* Section 1: Executive Financial Performance */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-[#D4AF37]" />
                                        <span>Group Financial Overview</span>
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {/* Card 1: Month Revenue */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-[#D4AF37]/50 transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                                Consolidated Revenue
                                            </span>
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-3 tracking-tight">
                                            {formatTzs(metrics.group_month_revenue_minor)}
                                        </h3>
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                                            <span>Today:</span>
                                            <span className="font-extrabold text-emerald-600">
                                                {formatTzs(metrics.group_today_revenue_minor)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card 2: Operating Profit (GOP) */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-[#D4AF37]/50 transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                                Operating Profit (GOP)
                                            </span>
                                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                                                <DollarSign className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-amber-800 mt-3 tracking-tight">
                                            {formatTzs(metrics.group_gop_minor)}
                                        </h3>
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                                            <span>Net GOP Margin:</span>
                                            <span className="font-extrabold text-amber-800">
                                                {metrics.group_gop_margin_percent}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card 3: Room Occupancy */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-[#D4AF37]/50 transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                                Average Occupancy
                                            </span>
                                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                <Bed className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-3 tracking-tight">
                                            {metrics.group_occupancy_rate}%
                                        </h3>
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                                            <span>Occupied:</span>
                                            <span className="font-bold text-slate-800">
                                                {metrics.total_occupied_group} of {metrics.total_rooms_group} rooms
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card 4: Target Realization */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-[#D4AF37]/50 transition">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                                Monthly Target Progress
                                            </span>
                                            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                                <Target className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-purple-700 mt-3 tracking-tight">
                                            {metrics.group_target_progress_percent}%
                                        </h3>
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                                            <span>Target:</span>
                                            <span className="font-bold text-slate-800">
                                                {metrics.group_target_minor > 0 ? formatTzs(metrics.group_target_minor) : 'Unset'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ─── EXECUTIVE BUSINESS ANALYTICS & REVENUE TRAJECTORY ─── */}
                            {analytics && (
                                <section className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
                                                <h3 className="text-base sm:text-lg font-black text-slate-950">
                                                    Executive Business Intelligence & Revenue Pacing
                                                </h3>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Financial trajectory, departmental yield, and cycle comparison ({analytics.range?.start || 'Current'} → {analytics.range?.end || 'Now'})
                                            </p>
                                        </div>

                                        {/* Period Selector Chips */}
                                        <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-2xl p-1 shadow-2xs self-start sm:self-auto">
                                            {[
                                                { id: 'today', label: 'Today' },
                                                { id: '7d', label: '7D' },
                                                { id: '30d', label: '30D' },
                                                { id: 'month', label: 'This Month' },
                                                { id: 'year', label: 'This Year' },
                                            ].map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => router.get(route('owner.index'), { period: p.id, tab: 'overview' }, { preserveScroll: true })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${period === p.id
                                                        ? 'bg-slate-950 text-[#D4AF37] font-extrabold shadow-2xs'
                                                        : 'text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Analytics Grid: 2 Columns */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Left 2 Cols: Revenue Trajectory Bar Chart */}
                                        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                                                            <Activity className="w-4 h-4 text-emerald-600" />
                                                            <span>Revenue Trajectory & Daily Pacing</span>
                                                        </h4>
                                                        <p className="text-xs text-slate-400 mt-0.5">Cash flow pace across accommodation & POS outlets</p>
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
                                                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-950 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-20">
                                                                        {point.label}: {formatTzs(point.total_minor)}
                                                                    </div>
                                                                    <div className="w-full flex flex-col justify-end h-32">
                                                                        <div
                                                                            className="w-full bg-gradient-to-t from-slate-950 via-slate-800 to-[#D4AF37] rounded-t-lg transition-all duration-300 group-hover:from-amber-600 group-hover:to-amber-400"
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
                                                        <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                                                        Total Revenue
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                                                        Base Flow
                                                    </span>
                                                </div>
                                                <span className="font-bold text-slate-700">Period: {period.toUpperCase()}</span>
                                            </div>
                                        </div>

                                        {/* Right 1 Col: Department Revenue Contribution */}
                                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-950 flex items-center gap-2 mb-1">
                                                    <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                                                    <span>Departmental Yield</span>
                                                </h4>
                                                <p className="text-xs text-slate-400 mb-4">Revenue breakdown by operating profit centers</p>

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

                                                    {/* POS & Dining / Bar */}
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

                                                    {/* Other Outlets / Departments */}
                                                    {(analytics.departments ?? []).slice(0, 3).map((dept: any, i: number) => (
                                                        <div key={i}>
                                                            <div className="flex items-center justify-between text-xs mb-1">
                                                                <span className="font-bold text-slate-700 capitalize">{dept.name} Outlet</span>
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
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Conversion</span>
                                                    <span className="font-black text-amber-800 text-sm">{metrics.group_gop_margin_percent}% GOP</span>
                                                </div>
                                                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Occupancy Yield</span>
                                                    <span className="font-black text-slate-900 text-sm">{metrics.group_occupancy_rate}% Booked</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Highlights Grid: Directives & Audit Watchlist */}
                            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Directives Preview */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Send className="w-4 h-4 text-[#D4AF37]" />
                                                <h3 className="text-base font-black text-slate-950">Active Directives</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentTab('directives')}
                                                className="text-xs font-bold text-[#D4AF37] hover:text-amber-600 transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>All Directives ({directives.length})</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {directives.length === 0 ? (
                                            <p className="text-xs text-slate-500 text-center py-6">No active executive directives dispatched.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {directives.slice(0, 3).map(dir => (
                                                    <div key={dir.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-950 text-[#D4AF37]">
                                                                {dir.category}
                                                            </span>
                                                            <span className="text-[10px] font-bold uppercase text-slate-500">{dir.status}</span>
                                                        </div>
                                                        <h4 className="font-black text-slate-900 text-sm mt-1">{dir.title}</h4>
                                                        <p className="text-slate-600 text-xs mt-0.5 line-clamp-1">{dir.directive_text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Loss Prevention Watchlist Preview */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4 text-rose-600" />
                                                <h3 className="text-base font-black text-slate-950">Loss Prevention & Audit</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentTab('audit')}
                                                className="text-xs font-bold text-[#D4AF37] hover:text-amber-600 transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>Audit Logs</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-amber-900 block">Discounts Watchlist</span>
                                                    <span className="text-[11px] text-amber-700">{discountsWatchlist.length} recent room/item discounts</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentTab('audit')}
                                                    className="px-3 py-1 rounded-xl bg-amber-200/80 text-amber-900 font-bold text-xs"
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
                                                    className="px-3 py-1 rounded-xl bg-rose-200/80 text-rose-900 font-bold text-xs"
                                                >
                                                    Inspect
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
                                                        ? 'bg-slate-950 text-white font-extrabold shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-950'
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
                                                    ? 'bg-slate-950 text-[#D4AF37] font-extrabold shadow-2xs'
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {[
                                    { label: 'Revenue', value: analytics.comparison.revenue_minor, prev: analytics.comparison.previous_revenue_minor, change: analytics.comparison.revenue_change_percent, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { label: 'Expenses', value: analytics.comparison.expenses_minor, prev: analytics.comparison.previous_expenses_minor, change: analytics.comparison.expenses_change_percent, icon: ArrowDownRight, color: 'text-rose-600', bg: 'bg-rose-50' },
                                    { label: 'Net GOP Profit', value: analytics.comparison.gop_minor, prev: analytics.comparison.previous_gop_minor, change: analytics.comparison.gop_change_percent, icon: DollarSign, color: 'text-amber-800', bg: 'bg-amber-50' },
                                    { label: 'POS & Dining Revenue', value: analytics.comparison.pos_revenue_minor, prev: analytics.comparison.previous_pos_revenue_minor, change: null, icon: UtensilsCrossed, color: 'text-blue-600', bg: 'bg-blue-50' },
                                ].map((kpi) => {
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
                        </section>
                    )}
                    </div>
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
