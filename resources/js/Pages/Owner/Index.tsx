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
    tab: string;
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

            <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-20">
                {/* ─── 1. ELITE EXECUTIVE HEADER ────────────────────────────────────── */}
                <header className="bg-white border-b border-slate-200/80 shadow-2xs sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                            {/* Brand & Organization */}
                            <div className="flex items-center gap-4">
                                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-[#D4AF37] flex items-center justify-center shrink-0 shadow-md ring-1 ring-amber-400/30">
                                    <Crown className="w-7 h-7 drop-shadow-xs" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight capitalize">
                                            {tenant?.name || 'Executive Holdings'}
                                        </h1>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-slate-950 text-[#D4AF37] border border-amber-500/30 shadow-2xs">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Executive Owner Suite
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                                        Consolidated Board Oversight, Chain of Command & Capital Performance
                                    </p>
                                </div>
                            </div>

                            {/* Action Toolbar */}
                            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                                <Link
                                    href={route('dashboard')}
                                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 font-bold text-xs transition flex items-center gap-2 shadow-2xs shrink-0"
                                    title="Switch to General Manager Operations View"
                                >
                                    <Building2 className="w-4 h-4 text-slate-500" />
                                    <span>Manager View</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setShowDrawingModal(true)}
                                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs transition flex items-center gap-2 shadow-2xs cursor-pointer shrink-0"
                                >
                                    <Coins className="w-4 h-4 text-emerald-600" />
                                    <span>Record Dividend / Capital</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowDirectiveModal(true)}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-xs shadow-sm transition flex items-center gap-2 cursor-pointer shrink-0"
                                >
                                    <Megaphone className="w-4 h-4 text-slate-950" />
                                    <span>Issue Owner Directive</span>
                                </button>
                            </div>
                        </div>

                        {/* Top Performance Ticker Bar */}
                        <div className="mt-5 pt-3.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Month Revenue</span>
                                    <span className="font-black text-slate-900 text-sm leading-tight">
                                        {formatTzs(metrics.group_month_revenue_minor)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Operating Profit (GOP)</span>
                                    <span className="font-black text-amber-800 text-sm leading-tight">
                                        {formatTzs(metrics.group_gop_minor)} ({metrics.group_gop_margin_percent}%)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                                    <Bed className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Average Occupancy</span>
                                    <span className="font-black text-slate-900 text-sm leading-tight">
                                        {metrics.group_occupancy_rate}% ({metrics.total_occupied_group}/{metrics.total_rooms_group} rooms)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Branch Network</span>
                                    <span className="font-black text-slate-900 text-sm leading-tight">
                                        {multiBranchData.length} Properties Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── 2. SLEEK SEGMENTED TABS (ZERO SCROLLBAR) ────────────────────── */}
                    <div className="bg-slate-50/90 border-t border-slate-200/70">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {[
                                    { id: 'overview', label: 'Executive Overview', icon: Activity },
                                    { id: 'branches', label: 'Branch Portfolio', icon: Building2 },
                                    {
                                        id: 'approvals',
                                        label: 'Expenditure Approvals',
                                        icon: CheckSquare,
                                        count: metrics.pending_approvals_count,
                                    },
                                    {
                                        id: 'directives',
                                        label: 'Owner Directives',
                                        icon: Send,
                                        count: metrics.active_directives_count,
                                    },
                                    { id: 'financials', label: 'Profit & Equity', icon: DollarSign },
                                    { id: 'analytics', label: 'Intelligence & Analytics', icon: BarChart3 },
                                    { id: 'audit', label: 'Audit & Loss Prevention', icon: ShieldAlert },
                                ].map(t => {
                                    const Icon = t.icon;
                                    const isActive = currentTab === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setCurrentTab(t.id)}
                                            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${isActive
                                                ? 'bg-slate-950 text-white font-extrabold shadow-sm'
                                                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                                            <span>{t.label}</span>
                                            {t.count !== undefined && t.count > 0 && (
                                                <span
                                                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${isActive ? 'bg-[#D4AF37] text-slate-950' : 'bg-rose-500 text-white'
                                                        }`}
                                                >
                                                    {t.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* ─── TAB 1: EXECUTIVE OVERVIEW (WAR ROOM) ────────────────────────── */}
                {currentTab === 'overview' && (
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
                        {/* Executive KPI Grid */}
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

                        {/* Multi-Branch Portfolio Grid */}
                        <section>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                                <div>
                                    <h2 className="text-xl font-black text-slate-950 flex items-center gap-2.5">
                                        <Building2 className="w-5 h-5 text-[#D4AF37]" />
                                        <span>Properties & Branch Portfolio</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Live financial scorecard, revenue pacing, and manager accountability across all properties
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCurrentTab('branches')}
                                    className="text-xs font-bold text-[#B8941F] hover:text-amber-800 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                                >
                                    <span>View Comprehensive Matrix</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

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
                        </section>

                        {/* Dual Executive Governance Stream */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left: Pending Approvals */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                                                <CheckSquare className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-950">Pending Owner Approvals</h3>
                                                <p className="text-xs text-slate-500">Expenditure requests awaiting authorization</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentTab('approvals')}
                                            className="text-xs font-bold text-[#B8941F] hover:underline cursor-pointer"
                                        >
                                            View All ({requisitions.filter(r => r.status === 'pending_owner').length})
                                        </button>
                                    </div>

                                    {requisitions.filter(r => r.status === 'pending_owner').length === 0 ? (
                                        <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-xs">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                                            <p className="font-bold text-slate-800 text-sm">All Clear</p>
                                            <p className="mt-0.5">No expenditure requests are pending your signature at this time.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3.5">
                                            {requisitions
                                                .filter(r => r.status === 'pending_owner')
                                                .slice(0, 3)
                                                .map(req => (
                                                    <div
                                                        key={req.id}
                                                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-bold text-amber-800">
                                                                    {req.requisition_no}
                                                                </span>
                                                                <span
                                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${req.urgency === 'emergency'
                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                        : req.urgency === 'priority'
                                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                        }`}
                                                                >
                                                                    {req.urgency}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-extrabold text-slate-900 mt-1 text-sm">{req.title}</h4>
                                                            <p className="text-slate-500 mt-0.5">
                                                                {req.property?.name} · Requested by {req.requester?.name}
                                                            </p>
                                                        </div>
                                                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                                            <span className="font-black text-emerald-700 text-base">
                                                                {formatTzs(req.amount_minor)}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowApprovalModal(req)}
                                                                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                                                            >
                                                                Review & Act
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Active Directives */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#D4AF37] flex items-center justify-center font-bold">
                                                <Send className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-950">Active Strategic Directives</h3>
                                                <p className="text-xs text-slate-500">Direct instructions dispatched to managers</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentTab('directives')}
                                            className="text-xs font-bold text-[#B8941F] hover:underline cursor-pointer"
                                        >
                                            View All ({directives.length})
                                        </button>
                                    </div>

                                    {directives.length === 0 ? (
                                        <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-xs">
                                            <Send className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                                            <p className="font-bold text-slate-800 text-sm">No Active Directives</p>
                                            <p className="mt-0.5">Use the "Issue Owner Directive" button to issue executive instructions.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3.5">
                                            {directives.slice(0, 3).map(dir => (
                                                <div
                                                    key={dir.id}
                                                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-white">
                                                                    {dir.category}
                                                                </span>
                                                                <span className="text-slate-400">·</span>
                                                                <span className="font-bold text-slate-600">
                                                                    {dir.property?.name || 'Group-Wide (All Branches)'}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-black text-slate-900 text-sm mt-1.5">{dir.title}</h4>
                                                            <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                                                {dir.directive_text}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${dir.status === 'completed'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : dir.status === 'acknowledged'
                                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                    : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                                                                }`}
                                                        >
                                                            {dir.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                )}

                {/* ─── TAB 2: MULTI-BRANCH COMPARISON MATRIX ──────────────────────── */}
                {currentTab === 'branches' && (
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-black text-slate-950 flex items-center gap-2.5">
                                        <Building2 className="w-5 h-5 text-[#D4AF37]" />
                                        <span>Comprehensive Branch Performance Matrix</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        P&L performance, revenue targets, operating margins and GM leadership across all properties
                                    </p>
                                </div>
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
                    </main>
                )}

                {/* ─── TAB 3: APPROVALS & REQUISITIONS ────────────────────────────── */}
                {currentTab === 'approvals' && (
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-950 flex items-center gap-2.5">
                                    <CheckSquare className="w-5 h-5 text-amber-600" />
                                    <span>Manager Requisitions & Approvals (Chain of Command)</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Expenditure and maintenance requests requiring owner authorization before financial release
                                </p>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
                                {[
                                    { id: 'all', label: 'All Requests' },
                                    { id: 'pending_owner', label: 'Pending Review' },
                                    { id: 'approved', label: 'Approved' },
                                    { id: 'rejected', label: 'Rejected' },
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setFilterRequisitionStatus(f.id as any)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filterRequisitionStatus === f.id
                                            ? 'bg-slate-950 text-white font-extrabold shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredRequisitions.length === 0 ? (
                            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 text-slate-500 shadow-xs">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                                <h3 className="text-base font-extrabold text-slate-900">No Requisitions Found</h3>
                                <p className="text-xs mt-1">
                                    No expenditure approval requests match the selected status filter.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRequisitions.map(req => (
                                    <div
                                        key={req.id}
                                        className="bg-white rounded-3xl p-6 border border-slate-200/80 flex flex-col justify-between shadow-xs hover:shadow-md transition"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="font-mono text-xs font-bold text-amber-800 block">
                                                        {req.requisition_no}
                                                    </span>
                                                    <h3 className="text-base font-black text-slate-950 mt-1 leading-snug">
                                                        {req.title}
                                                    </h3>
                                                </div>
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${req.status === 'approved'
                                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                        : req.status === 'rejected'
                                                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                                            : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                                                        }`}
                                                >
                                                    {req.status === 'pending_owner' ? 'Pending Action' : req.status}
                                                </span>
                                            </div>

                                            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs space-y-1.5">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-medium">Property:</span>
                                                    <span className="font-bold text-slate-900">{req.property?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-medium">Requested By:</span>
                                                    <span className="font-bold text-slate-900">{req.requester?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-medium">Category:</span>
                                                    <span className="font-bold text-slate-800 uppercase text-[11px]">{req.category}</span>
                                                </div>
                                                {req.vendor_name && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500 font-medium">Vendor:</span>
                                                        <span className="text-slate-800">{req.vendor_name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="mt-3.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 leading-relaxed">
                                                <span className="font-bold text-slate-400 block text-[10px] uppercase mb-0.5">
                                                    Justification:
                                                </span>
                                                {req.justification}
                                            </p>

                                            {req.owner_notes && (
                                                <p className="mt-2.5 text-xs text-amber-900 bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 leading-relaxed">
                                                    <span className="font-bold text-amber-800 block text-[10px] uppercase mb-0.5">
                                                        Owner Signature Notes:
                                                    </span>
                                                    {req.owner_notes}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                            <div>
                                                <span className="text-[10px] uppercase text-slate-400 font-bold block">Amount</span>
                                                <span className="text-lg font-black text-emerald-700">
                                                    {formatTzs(req.amount_minor)}
                                                </span>
                                            </div>

                                            {req.status === 'pending_owner' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowApprovalModal(req)}
                                                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>Approve</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowRejectModal(req)}
                                                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        <span>Reject</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                )}

                {/* ─── TAB 4: DIRECTIVES ─────────────────────────────────────────── */}
                {currentTab === 'directives' && (
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-950 flex items-center gap-2.5">
                                    <Send className="w-5 h-5 text-[#D4AF37]" />
                                    <span>Executive Directives to General Managers</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Issue operational commands, policy compliance notices, and cost-control mandates directly to managers
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDirectiveModal(true)}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-xs shadow-sm transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Issue New Directive</span>
                            </button>
                        </div>

                        {directives.length === 0 ? (
                            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 text-slate-500 shadow-xs">
                                <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-slate-900">No Directives Issued</h3>
                                <p className="text-xs mt-1">
                                    You have not issued any strategic orders to managers yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {directives.map(dir => (
                                    <div
                                        key={dir.id}
                                        className="bg-white rounded-3xl p-6 border border-slate-200/80 flex flex-col justify-between shadow-xs hover:shadow-md transition"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-extrabold uppercase text-[10px] px-2.5 py-0.5 rounded-full bg-slate-950 text-[#D4AF37]">
                                                            {dir.category}
                                                        </span>
                                                        <span className="text-slate-400">·</span>
                                                        <span className="font-bold text-slate-600 text-xs">
                                                            {dir.property?.name || 'Group-Wide (All Branches)'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base font-black text-slate-950 mt-2">
                                                        {dir.title}
                                                    </h3>
                                                </div>
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${dir.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                        : dir.status === 'acknowledged'
                                                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                                            : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                                                        }`}
                                                >
                                                    {dir.status}
                                                </span>
                                            </div>

                                            <p className="mt-4 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 leading-relaxed">
                                                {dir.directive_text}
                                            </p>

                                            <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                                                <span>Issued: {new Date(dir.created_at).toLocaleDateString()}</span>
                                                {dir.target_deadline && (
                                                    <span className="font-bold text-rose-600">
                                                        Deadline: {dir.target_deadline}
                                                    </span>
                                                )}
                                            </div>

                                            {dir.acknowledgement_notes && (
                                                <div className="mt-3 p-3 rounded-2xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900">
                                                    <span className="font-bold block text-[10px] uppercase mb-0.5">Manager Acknowledgement:</span>
                                                    {dir.acknowledgement_notes}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="text-slate-400">Priority: <strong className="capitalize text-slate-800">{dir.priority}</strong></span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm('Delete this executive directive?')) {
                                                        router.delete(route('owner.directives.destroy', dir.id));
                                                    }
                                                }}
                                                className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer transition"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Revoke</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                )}

                {/* ─── TAB 5: FINANCIALS & DRAWINGS ───────────────────────────────── */}
                {currentTab === 'financials' && (
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-950 flex items-center gap-2.5">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                    <span>Owner Equity, Dividends & Drawings</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Executive tracking of profit dividend distributions, owner withdrawals, and additional capital investments
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
                    </main>
                )}

                {/* ─── TAB 6: INTELLIGENCE & ANALYTICS ────────────────────────────── */}
                {currentTab === 'analytics' && analytics && (
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
                        {/* Period & Filter Control */}
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
                                            tab: 'analytics',
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
                                            onClick={() => router.get(route('owner.index'), { tab: 'analytics', period: p.id, property_id: analytics.selected_property_id ?? undefined }, { preserveScroll: true })}
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
                    </main>
                )}

                {/* ─── TAB 7: AUDIT & LOSS PREVENTION ─────────────────────────────── */}
                {currentTab === 'audit' && (
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
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
                    </main>
                )}

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
