import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
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
    Plus,
    RefreshCw,
    Search,
    Send,
    ShieldAlert,
    ShieldCheck,
    Target,
    Trash2,
    TrendingDown,
    TrendingUp,
    UtensilsCrossed,
    User,
    UserCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

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
            <Head title="Owner Executive Portal — Chain of Command" />

            <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
                {/* ─── TOP EXECUTIVE BANNER ────────────────────────────────────────── */}
                <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-6 shadow-xs">
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 ring-2 ring-[#D4AF37]/40">
                                <Crown className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                        {tenant?.name || 'Hotel Group & Lodges'}
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                                        Executive Owner Portal
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                                    Executive Group Hospitality Management, Manager Approvals & Chain of Command
                                </p>
                            </div>
                        </div>

                        {/* Top Action Pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setShowDirectiveModal(true)}
                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Megaphone className="w-4 h-4" />
                                <span>Issue Owner Directive</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowDrawingModal(true)}
                                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                                <Coins className="w-4 h-4 text-emerald-600" />
                                <span>Record Dividend / Capital</span>
                            </button>

                            <Link
                                href={route('dashboard')}
                                className="px-3.5 py-2 rounded-xl bg-[#1E3A5F] hover:bg-[#152a45] text-white border border-[#1E3A5F] font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                            >
                                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                                <span>View as Manager</span>
                            </Link>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="max-w-7xl mx-auto mt-6 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-200 pt-4">
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
                            { id: 'audit', label: 'Audit & Loss Prevention', icon: ShieldAlert },
                            { id: 'financials', label: 'Profit & Equity', icon: DollarSign },
                            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                        ].map(t => {
                            const Icon = t.icon;
                            const isActive = currentTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setCurrentTab(t.id)}
                                    className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                                        isActive
                                            ? 'bg-[#1E3A5F] text-white font-black shadow-xs'
                                            : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
                                    <span>{t.label}</span>
                                    {t.count !== undefined && t.count > 0 && (
                                        <span
                                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                                                isActive ? 'bg-[#D4AF37] text-slate-950' : 'bg-rose-500 text-white'
                                            }`}
                                        >
                                            {t.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ─── TAB 1: OVERVIEW ────────────────────────────────────────────── */}
                {currentTab === 'overview' && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
                        {/* 4 Major Financial & Operational KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* 1. Group Revenue Month */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Monthly Revenue (Group)
                                    </span>
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                                    {formatTzs(metrics.group_month_revenue_minor)}
                                </h3>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    <span>Today's Revenue:</span>
                                    <span className="font-bold text-emerald-600">
                                        {formatTzs(metrics.group_today_revenue_minor)}
                                    </span>
                                </div>
                            </div>

                            {/* 2. Group Net GOP */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Operating Profit (GOP)
                                    </span>
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-amber-700 mt-2">
                                    {formatTzs(metrics.group_gop_minor)}
                                </h3>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    <span>GOP Margin:</span>
                                    <span className="font-bold text-amber-700">{metrics.group_gop_margin_percent}%</span>
                                </div>
                            </div>

                            {/* 3. Group Occupancy */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Average Occupancy
                                    </span>
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Bed className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                                    {metrics.group_occupancy_rate}%
                                </h3>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    <span>Occupied Rooms:</span>
                                    <span className="font-bold text-slate-800">
                                        {metrics.total_occupied_group} / {metrics.total_rooms_group} rooms
                                    </span>
                                </div>
                            </div>

                            {/* 4. Target Progress */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Monthly Target Progress
                                    </span>
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <Target className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-purple-700 mt-2">
                                    {metrics.group_target_progress_percent}%
                                </h3>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    <span>Target:</span>
                                    <span className="font-bold text-slate-800">
                                        {metrics.group_target_minor > 0 ? formatTzs(metrics.group_target_minor) : 'Not Set'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Multi-Branch Performance Cards Grid */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-[#B8941F]" />
                                    <span>All Properties & Performance Portfolio</span>
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setCurrentTab('branches')}
                                    className="text-xs font-bold text-[#B8941F] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    View Full Comparison Matrix <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {multiBranchData.map(branch => (
                                    <div
                                        key={branch.id}
                                        className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#D4AF37] transition shadow-xs flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-base font-black text-slate-900 leading-tight">
                                                        {branch.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {branch.city} - Code: {branch.code || 'N/A'}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        branch.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}
                                                >
                                                    {branch.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            {/* General Manager Info */}
                                            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                                    <div>
                                                        <p className="font-bold text-slate-800">
                                                            GM: {branch.general_manager?.name || 'Unassigned GM'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500">
                                                            {branch.general_manager?.phone || branch.general_manager?.email || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                                    <span className="text-[11px] text-slate-500 block">Monthly Revenue</span>
                                                    <span className="font-black text-emerald-700 text-sm">
                                                        {formatTzs(branch.month_revenue_minor)}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                                    <span className="text-[11px] text-slate-500 block">Gross Profit (GOP)</span>
                                                    <span className="font-black text-amber-700 text-sm">
                                                        {formatTzs(branch.gop_minor)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Occupancy Bar */}
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                                    <span className="text-slate-500">Room Occupancy</span>
                                                    <span className="text-slate-800">
                                                        {branch.occupancy_rate}% ({branch.occupied_rooms}/{branch.total_rooms})
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-emerald-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, branch.occupancy_rate)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <form action={route('owner.inspect', branch.id)} method="POST" className="flex-1">
                                                <input type="hidden" name="_token" value={(document.querySelector('meta[name="csrf-token"]') as any)?.content || ''} />
                                                <button
                                                    type="submit"
                                                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#1E3A5F] hover:text-white text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                    title="Inspect operations of this property in manager mode"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Inspect Property</span>
                                                </button>
                                            </form>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowTargetModal(branch);
                                                    targetForm.setData('monthly_target_revenue', Math.round(branch.monthly_target_revenue_minor / 100));
                                                }}
                                                className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition border border-purple-200 cursor-pointer"
                                                title="Set Revenue Target"
                                            >
                                                <Target className="w-3.5 h-3.5 text-purple-600" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Chain of Command Feed */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pending Approvals */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                        <CheckSquare className="w-5 h-5 text-amber-600" />
                                        <span>Approvals Pending Owner Action</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentTab('approvals')}
                                        className="text-xs font-bold text-[#B8941F] hover:underline cursor-pointer"
                                    >
                                        View All ({requisitions.filter(r => r.status === 'pending_owner').length})
                                    </button>
                                </div>

                                {requisitions.filter(r => r.status === 'pending_owner').length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                                        No urgent requisitions pending your review at this time.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {requisitions
                                            .filter(r => r.status === 'pending_owner')
                                            .slice(0, 3)
                                            .map(req => (
                                                <div
                                                    key={req.id}
                                                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-amber-700">
                                                                {req.requisition_no}
                                                            </span>
                                                            <span
                                                                className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                                                                    req.urgency === 'emergency'
                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                        : req.urgency === 'priority'
                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                }`}
                                                            >
                                                                {req.urgency}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-900 mt-1">{req.title}</h4>
                                                        <p className="text-slate-500 mt-0.5">
                                                            Property: {req.property?.name} - Requested By: {req.requester?.name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="font-black text-emerald-700 text-sm">
                                                            {formatTzs(req.amount_minor)}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowApprovalModal(req)}
                                                            className="mt-2 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-xs transition cursor-pointer"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Active Directives */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                        <Megaphone className="w-5 h-5 text-[#B8941F]" />
                                        <span>Recent Official Directives</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowDirectiveModal(true)}
                                        className="text-xs font-bold text-[#B8941F] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Issue New
                                    </button>
                                </div>

                                {directives.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                                        No executive directives issued recently.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {directives.slice(0, 3).map(dir => (
                                            <div
                                                key={dir.id}
                                                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-900 text-sm">{dir.title}</span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            dir.status === 'acknowledged'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                : dir.status === 'completed'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        }`}
                                                    >
                                                        {dir.status === 'acknowledged'
                                                            ? 'Acknowledged by GM'
                                                            : dir.status}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 mt-1 line-clamp-2">
                                                    {dir.directive_text}
                                                </p>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                                                    <span>Target: {dir.property?.name || 'All Properties'}</span>
                                                    <span>Date: {dir.created_at.split('T')[0]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 2: MULTI-BRANCH COMPARISON MATRIX ──────────────────────── */}
                {currentTab === 'branches' && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-[#B8941F]" />
                                        <span>Comprehensive Branch Performance Matrix</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Comparison of revenue, expenditures, GOP profit, occupancy and property managers across branches
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-700">
                                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="py-3 px-4">Property</th>
                                            <th className="py-3 px-4">General Manager (GM)</th>
                                            <th className="py-3 px-4">Rooms & Occupancy</th>
                                            <th className="py-3 px-4">Monthly Revenue</th>
                                            <th className="py-3 px-4">Monthly Target</th>
                                            <th className="py-3 px-4">Operating Expenses (OPEX)</th>
                                            <th className="py-3 px-4">Gross Profit (GOP)</th>
                                            <th className="py-3 px-4">Margin %</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {multiBranchData.map(branch => (
                                            <tr key={branch.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#B8941F] border border-amber-200/80 flex items-center justify-center font-black text-xs">
                                                            {branch.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="leading-tight text-slate-900">{branch.name}</p>
                                                            <p className="text-[11px] text-slate-500 font-normal">{branch.city}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {branch.general_manager ? (
                                                        <div>
                                                            <p className="font-bold text-slate-800">
                                                                {branch.general_manager.name}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500">
                                                                {branch.general_manager.phone || branch.general_manager.username}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-amber-600 font-semibold italic">
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-slate-800">{branch.occupancy_rate}%</span>
                                                    <span className="text-[11px] text-slate-500 block">
                                                        {branch.occupied_rooms} / {branch.total_rooms} rooms
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-black text-emerald-700">
                                                    {formatTzs(branch.month_revenue_minor)}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-purple-700">
                                                        {branch.monthly_target_revenue_minor > 0
                                                            ? formatTzs(branch.monthly_target_revenue_minor)
                                                            : '—'}
                                                    </span>
                                                    {branch.monthly_target_revenue_minor > 0 && (
                                                        <span className="text-[10px] text-slate-500 block">
                                                            {branch.target_progress_percent}% achieved
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-rose-600">
                                                    {formatTzs(branch.month_expenses_minor)}
                                                </td>
                                                <td className="py-3.5 px-4 font-black text-amber-700">
                                                    {formatTzs(branch.gop_minor)}
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-slate-800">
                                                    {branch.gop_margin_percent}%
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <form action={route('owner.inspect', branch.id)} method="POST">
                                                            <input type="hidden" name="_token" value={(document.querySelector('meta[name="csrf-token"]') as any)?.content || ''} />
                                                            <button
                                                                type="submit"
                                                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#1E3A5F] hover:text-white text-slate-700 font-bold text-xs transition border border-slate-200 cursor-pointer"
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
                                                            className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition border border-purple-200 cursor-pointer"
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
                    </div>
                )}

                {/* ─── TAB 3: APPROVALS & REQUISITIONS ────────────────────────────── */}
                {currentTab === 'approvals' && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <CheckSquare className="w-5 h-5 text-amber-600" />
                                    <span>Manager Requisitions & Approvals (Chain of Command)</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    All expenditure and maintenance requests requiring owner authorization before release
                                </p>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
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
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            filterRequisitionStatus === f.id
                                                ? 'bg-[#1E3A5F] text-white font-black shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredRequisitions.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 shadow-xs">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-75" />
                                <h3 className="text-base font-bold text-slate-900">No Requisitions Found</h3>
                                <p className="text-xs mt-1">
                                    No expenditure approval requests match the selected status filter.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredRequisitions.map(req => (
                                    <div
                                        key={req.id}
                                        className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between shadow-xs"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="font-mono text-xs font-bold text-amber-700 block">
                                                        {req.requisition_no}
                                                    </span>
                                                    <h3 className="text-base font-black text-slate-900 mt-0.5 leading-snug">
                                                        {req.title}
                                                    </h3>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                                                        req.status === 'approved'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : req.status === 'rejected'
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                                    }`}
                                                >
                                                    {req.status === 'pending_owner' ? 'Pending Review' : req.status}
                                                </span>
                                            </div>

                                            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Property:</span>
                                                    <span className="font-bold text-slate-800">{req.property?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Requested By:</span>
                                                    <span className="font-bold text-slate-800">{req.requester?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Category:</span>
                                                    <span className="font-semibold text-slate-700 uppercase text-[11px]">{req.category}</span>
                                                </div>
                                                {req.vendor_name && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Vendor:</span>
                                                        <span className="text-slate-700">{req.vendor_name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="mt-3 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                                <span className="font-bold text-slate-500 block text-[10px] uppercase">
                                                    Request Justification:
                                                </span>
                                                {req.justification}
                                            </p>

                                            {req.owner_notes && (
                                                <p className="mt-2 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                                                    <span className="font-bold text-amber-700 block text-[10px] uppercase">
                                                        Owner Decision Notes:
                                                    </span>
                                                    {req.owner_notes}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] uppercase text-slate-400 font-bold block">Requested Amount</span>
                                                <span className="text-base font-black text-emerald-700">
                                                    {formatTzs(req.amount_minor)}
                                                </span>
                                            </div>

                                            {req.status === 'pending_owner' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowApprovalModal(req)}
                                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>Approve</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowRejectModal(req)}
                                                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        <span>Reject</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB 4: DIRECTIVES ─────────────────────────────────────────── */}
                {currentTab === 'directives' && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <Send className="w-5 h-5 text-[#B8941F]" />
                                    <span>Executive Directives to General Managers</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Issue operational instructions, company policies, or target directives visible immediately on manager dashboards
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDirectiveModal(true)}
                                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Issue New Directive</span>
                            </button>
                        </div>

                        {directives.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 shadow-xs">
                                <Megaphone className="w-12 h-12 text-[#B8941F] mx-auto mb-3 opacity-75" />
                                <h3 className="text-base font-bold text-slate-900">No Directives Issued</h3>
                                <p className="text-xs mt-1">
                                    You haven't issued any executive directives to property managers yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {directives.map(dir => (
                                    <div
                                        key={dir.id}
                                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#B8941F]">
                                                        {dir.category}
                                                    </span>
                                                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                                                        {dir.title}
                                                    </h3>
                                                </div>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        dir.priority === 'urgent'
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : dir.priority === 'high'
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    }`}
                                                >
                                                    {dir.priority}
                                                </span>
                                            </div>

                                            <p className="mt-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                                {dir.directive_text}
                                            </p>

                                            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Target Property:</span>
                                                    <span className="font-bold text-slate-800">
                                                        {dir.property?.name || 'All Properties (Group-wide)'}
                                                    </span>
                                                </div>
                                                {dir.target_deadline && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Deadline:</span>
                                                        <span className="font-bold text-amber-700">
                                                            {dir.target_deadline}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Status:</span>
                                                    <span className="font-bold text-slate-800">
                                                        {dir.status === 'acknowledged'
                                                            ? `Acknowledged by ${dir.acknowledgedBy?.name || 'Manager'}`
                                                            : dir.status}
                                                    </span>
                                                </div>
                                                {dir.acknowledgement_notes && (
                                                    <p className="text-[11px] text-blue-700 pt-1 border-t border-slate-200">
                                                        Manager Note: "{dir.acknowledgement_notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                            <span>Issued: {dir.created_at.split('T')[0]}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this directive?')) {
                                                        router.delete(route('owner.directives.destroy', dir.id));
                                                    }
                                                }}
                                                className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB 5: AUDIT & LOSS PREVENTION ─────────────────────────────── */}
                {currentTab === 'audit' && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-rose-600" />
                                <span>Financial Audit & Loss Prevention Watchlist</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Monitoring of room discounts, voided transactions, and guest cancellations to prevent branch revenue leakage
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Discounts Watchlist */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-3">
                                    <Percent className="w-4 h-4 text-amber-600" />
                                    <span>Discounts Watchlist</span>
                                </h3>
                                {discountsWatchlist.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-6">
                                        No promotional discounts recorded recently.
                                    </p>
                                ) : (
                                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                        {discountsWatchlist.map(disc => (
                                            <div
                                                key={disc.id}
                                                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-900">{disc.guest_name}</p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {disc.property_name} - {disc.description}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400">{disc.date}</span>
                                                </div>
                                                <span className="font-black text-amber-700 text-sm">
                                                    -{formatTzs(disc.amount_minor)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cancelled Bookings */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-3">
                                    <XCircle className="w-4 h-4 text-rose-600" />
                                    <span>Room Cancellations & Reasons</span>
                                </h3>
                                {cancelledBookings.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-6">
                                        No room cancellations recorded recently.
                                    </p>
                                ) : (
                                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                        {cancelledBookings.map(bk => (
                                            <div
                                                key={bk.id}
                                                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono font-bold text-rose-700">
                                                            {bk.ref_no}
                                                        </span>
                                                        <span className="text-slate-800 font-bold">- {bk.guest_name}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">
                                                        {bk.property_name} - Reason: {bk.notes}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400">{bk.date}</span>
                                                </div>
                                                <span className="font-black text-slate-800 text-sm">
                                                    {formatTzs(bk.total_amount_minor)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 6: FINANCIALS & DRAWINGS ───────────────────────────────── */}
                {currentTab === 'financials' && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                    <span>Owner Equity, Dividends & Drawings</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Track profit dividend distributions, owner withdrawals, and additional capital investments
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDrawingModal(true)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Record Dividend / Capital</span>
                            </button>
                        </div>

                        {/* Top Equity Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                                <span className="text-xs font-bold text-slate-500 uppercase block">Total Dividends Distributed</span>
                                <h3 className="text-2xl font-black text-emerald-700 mt-1">
                                    {formatTzs(metrics.total_drawings_minor)}
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-1">Dividends & Owner Withdrawals</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                                <span className="text-xs font-bold text-slate-500 uppercase block">Total Capital Injected</span>
                                <h3 className="text-2xl font-black text-purple-700 mt-1">
                                    {formatTzs(metrics.total_capital_injected_minor)}
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-1">Capital Injections by Owner</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                                <span className="text-xs font-bold text-slate-500 uppercase block">This Month's Profit (GOP)</span>
                                <h3 className="text-2xl font-black text-amber-700 mt-1">
                                    {formatTzs(metrics.group_gop_minor)}
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-1">Available for dividend distribution</p>
                            </div>
                        </div>

                        {/* Drawings Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                            <div className="p-5 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-900">Owner Transactions History</h3>
                            </div>

                            {drawings.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-10">
                                    No dividend or capital transactions recorded yet.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-slate-700">
                                        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="py-3 px-4">Date</th>
                                                <th className="py-3 px-4">Ref #</th>
                                                <th className="py-3 px-4">Transaction Type</th>
                                                <th className="py-3 px-4">Property</th>
                                                <th className="py-3 px-4">Payment Method</th>
                                                <th className="py-3 px-4">Amount</th>
                                                <th className="py-3 px-4">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {drawings.map(d => (
                                                <tr key={d.id} className="hover:bg-slate-50/80 transition">
                                                    <td className="py-3 px-4 text-slate-800">{d.drawing_date}</td>
                                                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{d.reference_no}</td>
                                                    <td className="py-3 px-4 font-bold">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                                d.drawing_type === 'dividend'
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                                            }`}
                                                        >
                                                            {d.drawing_type === 'dividend'
                                                                ? 'Dividend'
                                                                : d.drawing_type === 'capital_injection'
                                                                ? 'Capital'
                                                                : 'Owner Draw'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-800">{d.property?.name || 'All Properties'}</td>
                                                    <td className="py-3 px-4 capitalize text-slate-800">{d.payment_method.replace('_', ' ')}</td>
                                                    <td className="py-3 px-4 font-black text-emerald-700">
                                                        {formatTzs(d.amount_minor)}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500">{d.notes || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── TAB: ANALYTICS ────────────────────────────────────────────── */}
                {currentTab === 'analytics' && analytics && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
                        {/* Period selector */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-[#B8941F]" />
                                    <span>Business Analytics</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {analytics.range.start} → {analytics.range.end} · compared with {analytics.range.previous_start} → {analytics.range.previous_end}
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
                                        className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-sm"
                                    >
                                        <option value="">All Properties</option>
                                        {multiBranchData.map((b) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                )}
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
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
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            period === p.id
                                                ? 'bg-[#D4AF37] text-slate-950'
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Revenue', value: analytics.comparison.revenue_minor, prev: analytics.comparison.previous_revenue_minor, change: analytics.comparison.revenue_change_percent, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Expenses', value: analytics.comparison.expenses_minor, prev: analytics.comparison.previous_expenses_minor, change: analytics.comparison.expenses_change_percent, icon: ArrowDownRight, color: 'text-rose-600', bg: 'bg-rose-50' },
                                { label: 'Net GOP', value: analytics.comparison.gop_minor, prev: analytics.comparison.previous_gop_minor, change: analytics.comparison.gop_change_percent, icon: DollarSign, color: 'text-amber-700', bg: 'bg-amber-50' },
                                { label: 'POS / F&B Revenue', value: analytics.comparison.pos_revenue_minor, prev: analytics.comparison.previous_pos_revenue_minor, change: null, icon: UtensilsCrossed, color: 'text-blue-600', bg: 'bg-blue-50' },
                            ].map((kpi) => {
                                const Icon = kpi.icon;
                                const isUp = (kpi.change ?? 0) >= 0;
                                return (
                                    <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{kpi.label}</span>
                                            <div className={`w-9 h-9 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{formatTzs(kpi.value)}</h3>
                                        <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                            <span>vs prev: {formatTzs(kpi.prev)}</span>
                                            {kpi.change !== null && kpi.change !== undefined ? (
                                                <span className={`font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {isUp ? '▲' : '▼'} {Math.abs(kpi.change)}%
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">n/a</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Revenue trend */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-black text-slate-900 mb-4">Revenue Trend</h3>
                            {analytics.revenue_trend.length === 0 ? (
                                <p className="text-xs text-slate-500">No revenue data for this period.</p>
                            ) : (
                                <div className="flex items-end gap-1 h-40">
                                    {analytics.revenue_trend.map((point, i) => {
                                        const max = Math.max(...analytics.revenue_trend.map(p => p.total_minor), 1);
                                        const h = Math.max(4, Math.round((point.total_minor / max) * 100));
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${point.label}: ${formatTzs(point.total_minor)}`}>
                                                <div className="w-full flex flex-col justify-end h-32">
                                                    <div className="w-full bg-[#D4AF37] rounded-t-sm" style={{ height: `${h}%` }} />
                                                </div>
                                                <span className="text-[9px] text-slate-400 truncate w-full text-center">{point.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Occupancy */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><Bed className="w-4 h-4 text-blue-600" /> Occupancy</h3>
                                <div className="text-3xl font-black text-slate-900">{analytics.occupancy.occupancy_rate}%</div>
                                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                                    <div className="flex justify-between"><span>Total rooms</span><span className="font-bold text-slate-900">{analytics.occupancy.total_rooms}</span></div>
                                    <div className="flex justify-between"><span>Occupied</span><span className="font-bold text-emerald-600">{analytics.occupancy.occupied_rooms}</span></div>
                                    <div className="flex justify-between"><span>Available</span><span className="font-bold text-slate-900">{analytics.occupancy.available_rooms}</span></div>
                                    <div className="flex justify-between"><span>Reserved (upcoming)</span><span className="font-bold text-blue-600">{analytics.occupancy.reserved_rooms}</span></div>
                                    <div className="flex justify-between"><span>Out of order</span><span className="font-bold text-rose-600">{analytics.occupancy.out_of_order_rooms}</span></div>
                                </div>
                            </div>

                            {/* Department performance */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm lg:col-span-2">
                                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-amber-600" /> Department Revenue (POS / F&amp;B)</h3>
                                {analytics.departments.length === 0 ? (
                                    <p className="text-xs text-slate-500">No POS sales recorded for this period.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {analytics.departments.map((dept) => {
                                            const max = Math.max(...analytics.departments.map(d => d.revenue_minor), 1);
                                            return (
                                                <div key={dept.name}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold text-slate-800">{dept.name}</span>
                                                        <span className="text-slate-500">{dept.orders} orders · {formatTzs(dept.revenue_minor)}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${Math.max(2, Math.round((dept.revenue_minor / max) * 100))}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Staff */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-purple-600" /> Staff</h3>
                                <div className="text-3xl font-black text-slate-900">{analytics.staff.total_active}</div>
                                <p className="text-xs text-slate-500 mt-1">Active staff members</p>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {Object.entries(analytics.staff.by_role).map(([role, count]) => (
                                        <span key={role} className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                            {role}: {count}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Alerts */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm lg:col-span-2">
                                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600" /> Business Alerts</h3>
                                {analytics.alerts.length === 0 ? (
                                    <p className="text-xs text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> No alerts — all clear.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {analytics.alerts.map((alert, i) => (
                                            <Link
                                                key={i}
                                                href={alert.route}
                                                className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition ${
                                                    alert.severity === 'warning'
                                                        ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                                        : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                                                }`}
                                            >
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                <span className="flex-1">{alert.message}</span>
                                                <ChevronRight className="w-4 h-4 shrink-0" />
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── MODAL 1: CREATE DIRECTIVE ──────────────────────────────────── */}
                {showDirectiveModal && (
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowDirectiveModal(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                                    <Megaphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Issue Owner Directive</h3>
                                    <p className="text-xs text-slate-500">Official executive instructions for branch managers</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateDirective} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Directive Title:</label>
                                    <input
                                        type="text"
                                        required
                                        value={directiveForm.data.title}
                                        onChange={e => directiveForm.setData('title', e.target.value)}
                                        placeholder="e.g. Reduce energy consumption and inspect HVAC systems"
                                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-[#D4AF37]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1">Target Property:</label>
                                        <select
                                            value={directiveForm.data.property_id}
                                            onChange={e => directiveForm.setData('property_id', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
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
                                        <label className="block text-slate-700 font-bold mb-1">Priority:</label>
                                        <select
                                            value={directiveForm.data.priority}
                                            onChange={e => directiveForm.setData('priority', e.target.value as any)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1">Kategoria:</label>
                                        <select
                                            value={directiveForm.data.category}
                                            onChange={e => directiveForm.setData('category', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                                        >
                                            <option value="operations">Operations</option>
                                            <option value="finance">Finance & Cost Control</option>
                                            <option value="policy">Policy & Compliance</option>
                                            <option value="maintenance">Maintenance & Repairs</option>
                                            <option value="hr">Human Resources (HR)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1">Target Deadline:</label>
                                        <input
                                            type="date"
                                            value={directiveForm.data.target_deadline}
                                            onChange={e => directiveForm.setData('target_deadline', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Directive Instructions:</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={directiveForm.data.directive_text}
                                        onChange={e => directiveForm.setData('directive_text', e.target.value)}
                                        placeholder="Describe operational instructions for managers..."
                                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-[#D4AF37]"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowDirectiveModal(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={directiveForm.processing}
                                        className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-xs cursor-pointer"
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
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowApprovalModal(null)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Approve Expenditure Requisition</h3>
                                    <p className="text-xs font-mono text-amber-700">{showApprovalModal.requisition_no}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-4">
                                <p className="font-bold text-slate-900 text-sm">{showApprovalModal.title}</p>
                                <p className="text-slate-500 mt-1">Property: {showApprovalModal.property?.name}</p>
                                <p className="font-black text-emerald-700 text-base mt-2">
                                    {formatTzs(showApprovalModal.amount_minor)}
                                </p>
                            </div>

                            <form onSubmit={handleApprove} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Owner Approval Notes:</label>
                                    <textarea
                                        rows={3}
                                        value={approvalForm.data.owner_notes}
                                        onChange={e => approvalForm.setData('owner_notes', e.target.value)}
                                        placeholder="Comments or payment instructions for the manager..."
                                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                                    />
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={approvalForm.data.create_expense}
                                        onChange={e => approvalForm.setData('create_expense', e.target.checked)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300"
                                    />
                                    <span>Automatically record in approved operational expenses ledger</span>
                                </label>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowApprovalModal(null)}
                                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={approvalForm.processing}
                                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs cursor-pointer"
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
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowRejectModal(null)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                                    <XCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Reject Expenditure Requisition</h3>
                                    <p className="text-xs font-mono text-rose-700">{showRejectModal.requisition_no}</p>
                                </div>
                            </div>

                            <form onSubmit={handleReject} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Rejection Reason:</label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={rejectForm.data.owner_notes}
                                        onChange={e => rejectForm.setData('owner_notes', e.target.value)}
                                        placeholder="Explain to the manager why this request was declined or modifications required..."
                                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowRejectModal(null)}
                                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={rejectForm.processing}
                                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-xs cursor-pointer"
                                    >
                                        Reject Requisition
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── MODAL 4: SET BRANCH TARGET ─────────────────────────────────── */}
                {showTargetModal && (
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowTargetModal(null)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Set Monthly Revenue Target</h3>
                                    <p className="text-xs text-slate-500">{showTargetModal.name}</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateTarget} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">
                                        Target Monthly Revenue (TZS):
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={targetForm.data.monthly_target_revenue}
                                        onChange={e => targetForm.setData('monthly_target_revenue', Number(e.target.value))}
                                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-purple-700 text-base font-black focus:ring-2 focus:ring-purple-400"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        This target will appear on the General Manager's dashboard as a primary KPI.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowTargetModal(null)}
                                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={targetForm.processing}
                                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-xs cursor-pointer"
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
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowDrawingModal(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                                    <Coins className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Record Dividend or Capital</h3>
                                    <p className="text-xs text-slate-500">Hotel owner equity and drawing transaction</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateDrawing} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Transaction Type:</label>
                                    <select
                                        value={drawingForm.data.drawing_type}
                                        onChange={e => drawingForm.setData('drawing_type', e.target.value as any)}
                                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                                    >
                                        <option value="dividend">Profit Dividend (Dividend Withdrawal)</option>
                                        <option value="capital_injection">Capital Investment (Capital Injection)</option>
                                        <option value="draw">Owner Draw</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Amount (TZS):</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="5000000"
                                        value={drawingForm.data.amount}
                                        onChange={e => drawingForm.setData('amount', e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-emerald-700 font-black text-base focus:ring-2 focus:ring-emerald-400"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1">Payment Method:</label>
                                        <select
                                            value={drawingForm.data.payment_method}
                                            onChange={e => drawingForm.setData('payment_method', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                                        >
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="cash">Cash</option>
                                            <option value="mpesa">Mobile Money (M-Pesa / Airtel)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1">Date:</label>
                                        <input
                                            type="date"
                                            required
                                            value={drawingForm.data.drawing_date}
                                            onChange={e => drawingForm.setData('drawing_date', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Source / Target Property:</label>
                                    <select
                                        value={drawingForm.data.property_id}
                                        onChange={e => drawingForm.setData('property_id', e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                                    >
                                        <option value="">Group Central Account</option>
                                        {multiBranchData.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Additional Notes:</label>
                                    <textarea
                                        rows={2}
                                        value={drawingForm.data.notes}
                                        onChange={e => drawingForm.setData('notes', e.target.value)}
                                        placeholder="Details regarding this dividend or capital transaction..."
                                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowDrawingModal(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={drawingForm.processing}
                                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs cursor-pointer"
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

