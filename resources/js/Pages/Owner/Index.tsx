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

interface OwnerProps extends PageProps {
    tenant: any;
    tab: string;
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

            <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
                {/* ─── TOP EXECUTIVE BANNER ────────────────────────────────────────── */}
                <div className="bg-gradient-to-r from-slate-950 via-[#112239] to-slate-950 border-b border-[#D4AF37]/30 px-4 sm:px-6 lg:px-8 py-6 shadow-xl">
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 ring-2 ring-[#D4AF37]/50">
                                <Crown className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                        {tenant?.name || 'Hotel Group & Lodges'}
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-[#D4AF37] border border-[#D4AF37]/40">
                                        Executive Owner Portal
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                                    Usimamizi Mkuu wa Kikundi cha Hoteli, Idhini za Mameneja na Ulinzi wa Faida (Chain of Command)
                                </p>
                            </div>
                        </div>

                        {/* Top Action Pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setShowDirectiveModal(true)}
                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"
                            >
                                <Megaphone className="w-4 h-4" />
                                <span>Toa Mwongozo wa Mmiliki</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowDrawingModal(true)}
                                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs transition flex items-center gap-1.5"
                            >
                                <Coins className="w-4 h-4 text-emerald-400" />
                                <span>Rekodi Gawio / Mtaji</span>
                            </button>

                            <Link
                                href={route('dashboard')}
                                className="px-3.5 py-2 rounded-xl bg-[#1E3A5F] hover:bg-[#152a45] text-white border border-[#D4AF37]/30 font-bold text-xs transition flex items-center gap-1.5"
                            >
                                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                                <span>Tazama Kama Meneja</span>
                            </Link>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="max-w-7xl mx-auto mt-6 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/80 pt-4">
                        {[
                            { id: 'overview', label: 'Muhtasari Mkuu (Overview)', icon: Activity },
                            { id: 'branches', label: 'Ulinganifu wa Matawi (Branches)', icon: Building2 },
                            {
                                id: 'approvals',
                                label: 'Idhini za Matumizi (Approvals)',
                                icon: CheckSquare,
                                count: metrics.pending_approvals_count,
                            },
                            {
                                id: 'directives',
                                label: 'Miongozo ya Mmiliki (Directives)',
                                icon: Send,
                                count: metrics.active_directives_count,
                            },
                            { id: 'audit', label: 'Ukaguzi wa Fedha (Audit & Loss)', icon: ShieldAlert },
                            { id: 'financials', label: 'Faida & Gawio (Financials)', icon: DollarSign },
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
                                            ? 'bg-[#D4AF37] text-slate-950 font-black shadow-md shadow-amber-500/20'
                                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{t.label}</span>
                                    {t.count !== undefined && t.count > 0 && (
                                        <span
                                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                                                isActive ? 'bg-slate-950 text-amber-300' : 'bg-rose-500 text-white'
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
                            <div className="bg-gradient-to-br from-slate-800 to-slate-850 p-5 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Mapato ya Mwezi (Group)
                                    </span>
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                                    {formatTzs(metrics.group_month_revenue_minor)}
                                </h3>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                                    <span>Mapato ya Leo:</span>
                                    <span className="font-bold text-emerald-400">
                                        {formatTzs(metrics.group_today_revenue_minor)}
                                    </span>
                                </div>
                            </div>

                            {/* 2. Group Net GOP */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-850 p-5 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Faida ya Uendeshaji (GOP)
                                    </span>
                                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-amber-300 mt-2">
                                    {formatTzs(metrics.group_gop_minor)}
                                </h3>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                                    <span>GOP Margin:</span>
                                    <span className="font-bold text-amber-400">{metrics.group_gop_margin_percent}%</span>
                                </div>
                            </div>

                            {/* 3. Group Occupancy */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-850 p-5 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Wastani wa Ukaaji (Occupancy)
                                    </span>
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                        <Bed className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                                    {metrics.group_occupancy_rate}%
                                </h3>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                                    <span>Vyumba Vilivyopo:</span>
                                    <span className="font-bold text-slate-200">
                                        {metrics.total_occupied_group} / {metrics.total_rooms_group} rooms
                                    </span>
                                </div>
                            </div>

                            {/* 4. Target Progress */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-850 p-5 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Lengo la Mwezi (Target)
                                    </span>
                                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                        <Target className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-purple-300 mt-2">
                                    {metrics.group_target_progress_percent}%
                                </h3>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                                    <span>Lengo:</span>
                                    <span className="font-bold text-slate-200">
                                        {metrics.group_target_minor > 0 ? formatTzs(metrics.group_target_minor) : 'Haijawekwa'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Multi-Branch Performance Cards Grid */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-black text-white flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-[#D4AF37]" />
                                    <span>Matawi Yote ya Hoteli & Utendaji (Property Portfolio)</span>
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setCurrentTab('branches')}
                                    className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
                                >
                                    Tazama Jedwali Kamili la Ulinganifu <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {multiBranchData.map(branch => (
                                    <div
                                        key={branch.id}
                                        className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 hover:border-[#D4AF37]/50 transition shadow-lg flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-base font-black text-white leading-tight">
                                                        {branch.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {branch.city} • Code: {branch.code || 'N/A'}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        branch.is_active
                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                    }`}
                                                >
                                                    {branch.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            {/* General Manager Info */}
                                            <div className="mt-3.5 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                                                    <div>
                                                        <p className="font-bold text-slate-200">
                                                            GM: {branch.general_manager?.name || 'Haijapangiwa Meneja'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400">
                                                            {branch.general_manager?.phone || branch.general_manager?.email || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                                                <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/40">
                                                    <span className="text-[11px] text-slate-400 block">Mapato ya Mwezi</span>
                                                    <span className="font-black text-emerald-400 text-sm">
                                                        {formatTzs(branch.month_revenue_minor)}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/40">
                                                    <span className="text-[11px] text-slate-400 block">Faida (GOP)</span>
                                                    <span className="font-black text-amber-300 text-sm">
                                                        {formatTzs(branch.gop_minor)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Occupancy Bar */}
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                                    <span className="text-slate-400">Ukaaji wa Vyumba</span>
                                                    <span className="text-slate-200">
                                                        {branch.occupancy_rate}% ({branch.occupied_rooms}/{branch.total_rooms})
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, branch.occupancy_rate)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="mt-5 pt-3 border-t border-slate-700 flex items-center justify-between gap-2">
                                            <form action={route('owner.inspect', branch.id)} method="POST" className="flex-1">
                                                <input type="hidden" name="_token" value={(document.querySelector('meta[name="csrf-token"]') as any)?.content || ''} />
                                                <button
                                                    type="submit"
                                                    className="w-full py-2 px-3 rounded-xl bg-slate-700 hover:bg-[#1E3A5F] hover:text-[#D4AF37] text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                                                    title="Tazama dashibodi ya tawi hili kama meneja"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Kagua Tawi (Inspect)</span>
                                                </button>
                                            </form>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowTargetModal(branch);
                                                    targetForm.setData('monthly_target_revenue', Math.round(branch.monthly_target_revenue_minor / 100));
                                                }}
                                                className="py-2 px-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                                                title="Weka Lengo la Mapato"
                                            >
                                                <Target className="w-3.5 h-3.5 text-purple-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Chain of Command Feed */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pending Approvals */}
                            <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-black text-white flex items-center gap-2">
                                        <CheckSquare className="w-5 h-5 text-amber-400" />
                                        <span>Idhini Zinazosubiri Uamuzi wa Mmiliki</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentTab('approvals')}
                                        className="text-xs font-bold text-[#D4AF37] hover:underline"
                                    >
                                        Tazama Zote ({requisitions.filter(r => r.status === 'pending_owner').length})
                                    </button>
                                </div>

                                {requisitions.filter(r => r.status === 'pending_owner').length === 0 ? (
                                    <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                                        Hakuna ombi lolote la dharura linalosubiri idhini yako kwa sasa.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {requisitions
                                            .filter(r => r.status === 'pending_owner')
                                            .slice(0, 3)
                                            .map(req => (
                                                <div
                                                    key={req.id}
                                                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/80 flex items-start justify-between gap-3 text-xs"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-amber-300">
                                                                {req.requisition_no}
                                                            </span>
                                                            <span
                                                                className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                                                                    req.urgency === 'emergency'
                                                                        ? 'bg-rose-500/20 text-rose-300'
                                                                        : req.urgency === 'priority'
                                                                        ? 'bg-amber-500/20 text-amber-300'
                                                                        : 'bg-blue-500/20 text-blue-300'
                                                                }`}
                                                            >
                                                                {req.urgency}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-white mt-1">{req.title}</h4>
                                                        <p className="text-slate-400 mt-0.5">
                                                            Tawi: {req.property?.name} • Kutoka: {req.requester?.name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="font-black text-emerald-400 text-sm">
                                                            {formatTzs(req.amount_minor)}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowApprovalModal(req)}
                                                            className="mt-2 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow transition"
                                                        >
                                                            Idhinisha
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Active Directives */}
                            <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-black text-white flex items-center gap-2">
                                        <Megaphone className="w-5 h-5 text-[#D4AF37]" />
                                        <span>Miongozo Rasmi ya Hivi Karibuni</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowDirectiveModal(true)}
                                        className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Toa Mpya
                                    </button>
                                </div>

                                {directives.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                                        Hakuna muongozo rasmi uliotolewa hivi karibuni.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {directives.slice(0, 3).map(dir => (
                                            <div
                                                key={dir.id}
                                                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/80 text-xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-white text-sm">{dir.title}</span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            dir.status === 'acknowledged'
                                                                ? 'bg-blue-500/20 text-blue-300'
                                                                : dir.status === 'completed'
                                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                                : 'bg-amber-500/20 text-amber-300'
                                                        }`}
                                                    >
                                                        {dir.status === 'acknowledged'
                                                            ? 'Imepokelewa na GM'
                                                            : dir.status}
                                                    </span>
                                                </div>
                                                <p className="text-slate-300 mt-1 line-clamp-2">
                                                    {dir.directive_text}
                                                </p>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                                                    <span>Target: {dir.property?.name || 'Matawi Yote'}</span>
                                                    <span>Tarehe: {dir.created_at.split('T')[0]}</span>
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
                        <div className="bg-slate-800/90 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                            <div className="p-5 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-[#D4AF37]" />
                                        <span>Jedwali Kamili la Ulinganifu wa Matawi (Branch Matrix)</span>
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Ulinganifu wa mapato, matumizi, faida (GOP), ADR, RevPAR na mameneja wa kila tawi
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-200">
                                    <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-700">
                                        <tr>
                                            <th className="py-3 px-4">Tawi (Property)</th>
                                            <th className="py-3 px-4">Meneja Mkuu (GM)</th>
                                            <th className="py-3 px-4">Vyumba & Ukaaji</th>
                                            <th className="py-3 px-4">Mapato ya Mwezi</th>
                                            <th className="py-3 px-4">Lengo (Target)</th>
                                            <th className="py-3 px-4">Matumizi (OPEX)</th>
                                            <th className="py-3 px-4">Faida (GOP)</th>
                                            <th className="py-3 px-4">Margin %</th>
                                            <th className="py-3 px-4 text-right">Vitendo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {multiBranchData.map(branch => (
                                            <tr key={branch.id} className="hover:bg-slate-750 transition">
                                                <td className="py-3.5 px-4 font-bold text-white">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-700 text-[#D4AF37] flex items-center justify-center font-black text-xs">
                                                            {branch.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="leading-tight">{branch.name}</p>
                                                            <p className="text-[11px] text-slate-400">{branch.city}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {branch.general_manager ? (
                                                        <div>
                                                            <p className="font-bold text-slate-200">
                                                                {branch.general_manager.name}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400">
                                                                {branch.general_manager.phone || branch.general_manager.username}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-amber-400 font-semibold italic">
                                                            Haijapangiwa
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold">{branch.occupancy_rate}%</span>
                                                    <span className="text-[11px] text-slate-400 block">
                                                        {branch.occupied_rooms} / {branch.total_rooms} rooms
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-black text-emerald-400">
                                                    {formatTzs(branch.month_revenue_minor)}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-purple-300">
                                                        {branch.monthly_target_revenue_minor > 0
                                                            ? formatTzs(branch.monthly_target_revenue_minor)
                                                            : '—'}
                                                    </span>
                                                    {branch.monthly_target_revenue_minor > 0 && (
                                                        <span className="text-[10px] text-slate-400 block">
                                                            {branch.target_progress_percent}% iliyofikiwa
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-rose-400">
                                                    {formatTzs(branch.month_expenses_minor)}
                                                </td>
                                                <td className="py-3.5 px-4 font-black text-amber-300">
                                                    {formatTzs(branch.gop_minor)}
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-slate-200">
                                                    {branch.gop_margin_percent}%
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <form action={route('owner.inspect', branch.id)} method="POST">
                                                            <input type="hidden" name="_token" value={(document.querySelector('meta[name="csrf-token"]') as any)?.content || ''} />
                                                            <button
                                                                type="submit"
                                                                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-[#1E3A5F] text-[#D4AF37] font-bold text-xs transition"
                                                                title="Kagua shughuli za kiutendaji za tawi hili"
                                                            >
                                                                Kagua
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
                                                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs transition"
                                                            title="Weka Lengo la Mapato"
                                                        >
                                                            Lengo
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
                                <h2 className="text-lg font-black text-white flex items-center gap-2">
                                    <CheckSquare className="w-5 h-5 text-amber-400" />
                                    <span>Idhini za Matumizi na Maombi ya Mameneja (Chain of Command)</span>
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Maombi yote ya fedha au matengenezo yanayohitaji idhini rasmi ya Mmiliki kabla ya kutolewa
                                </p>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                                {[
                                    { id: 'all', label: 'Zote' },
                                    { id: 'pending_owner', label: 'Zinazosubiri (Pending)' },
                                    { id: 'approved', label: 'Zilizoidhinishwa' },
                                    { id: 'rejected', label: 'Zilizokataliwa' },
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setFilterRequisitionStatus(f.id as any)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            filterRequisitionStatus === f.id
                                                ? 'bg-[#D4AF37] text-slate-950 font-black'
                                                : 'text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredRequisitions.length === 0 ? (
                            <div className="bg-slate-800/80 rounded-2xl p-12 text-center border border-slate-700 text-slate-400">
                                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-75" />
                                <h3 className="text-base font-bold text-white">Hakuna Maombi Yaliyopatikana</h3>
                                <p className="text-xs mt-1">
                                    Hakuna maombi ya idhini kulingana na kichujio ulichochagua.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredRequisitions.map(req => (
                                    <div
                                        key={req.id}
                                        className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 flex flex-col justify-between shadow-lg"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="font-mono text-xs font-bold text-amber-300 block">
                                                        {req.requisition_no}
                                                    </span>
                                                    <h3 className="text-base font-black text-white mt-0.5 leading-snug">
                                                        {req.title}
                                                    </h3>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                                                        req.status === 'approved'
                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                            : req.status === 'rejected'
                                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                                    }`}
                                                >
                                                    {req.status === 'pending_owner' ? 'Inasubiri Mmiliki' : req.status}
                                                </span>
                                            </div>

                                            <div className="mt-3.5 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Tawi:</span>
                                                    <span className="font-bold text-slate-200">{req.property?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Meneja Aliyeomba:</span>
                                                    <span className="font-bold text-slate-200">{req.requester?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Kategoria:</span>
                                                    <span className="font-semibold text-slate-300 uppercase text-[11px]">{req.category}</span>
                                                </div>
                                                {req.vendor_name && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Msambazaji:</span>
                                                        <span className="text-slate-300">{req.vendor_name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="mt-3 text-xs text-slate-300 bg-slate-900/30 p-2.5 rounded-xl border border-slate-800">
                                                <span className="font-bold text-slate-400 block text-[10px] uppercase">
                                                    Maelezo / Sababu ya Ombi:
                                                </span>
                                                {req.justification}
                                            </p>

                                            {req.owner_notes && (
                                                <p className="mt-2 text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                                                    <span className="font-bold text-amber-400 block text-[10px] uppercase">
                                                        Uamuzi wa Mmiliki:
                                                    </span>
                                                    {req.owner_notes}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-slate-700 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] uppercase text-slate-400 font-bold block">Kiasi Kilichoombwa</span>
                                                <span className="text-base font-black text-emerald-400">
                                                    {formatTzs(req.amount_minor)}
                                                </span>
                                            </div>

                                            {req.status === 'pending_owner' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowApprovalModal(req)}
                                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow transition flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>Idhinisha</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowRejectModal(req)}
                                                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow transition flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        <span>Kataa</span>
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
                                <h2 className="text-lg font-black text-white flex items-center gap-2">
                                    <Send className="w-5 h-5 text-[#D4AF37]" />
                                    <span>Miongozo Rasmi ya Mmiliki kwa Mameneja (Executive Directives)</span>
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Toa maagizo ya kiutendaji, sera mpya au malengo ya dharura yatakayoonekana moja kwa moja kwenye dashibodi ya mameneja
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDirectiveModal(true)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Toa Mwongozo Mpya</span>
                            </button>
                        </div>

                        {directives.length === 0 ? (
                            <div className="bg-slate-800/80 rounded-2xl p-12 text-center border border-slate-700 text-slate-400">
                                <Megaphone className="w-12 h-12 text-[#D4AF37] mx-auto mb-3 opacity-75" />
                                <h3 className="text-base font-bold text-white">Hakuna Miongozo Iliyotolewa</h3>
                                <p className="text-xs mt-1">
                                    Bado haujatoa mwongozo wowote kwa mameneja wa matawi yako.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {directives.map(dir => (
                                    <div
                                        key={dir.id}
                                        className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 shadow-lg flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">
                                                        {dir.category}
                                                    </span>
                                                    <h3 className="text-base font-black text-white mt-0.5">
                                                        {dir.title}
                                                    </h3>
                                                </div>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        dir.priority === 'urgent'
                                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                            : dir.priority === 'high'
                                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                    }`}
                                                >
                                                    {dir.priority}
                                                </span>
                                            </div>

                                            <p className="mt-3 text-xs text-slate-200 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-700/60">
                                                {dir.directive_text}
                                            </p>

                                            <div className="mt-4 p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1.5">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Matawi Yanayohusika:</span>
                                                    <span className="font-bold text-slate-200">
                                                        {dir.property?.name || 'Matawi Yote (Group-wide)'}
                                                    </span>
                                                </div>
                                                {dir.target_deadline && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Ukomo wa Utekelezaji:</span>
                                                        <span className="font-bold text-amber-300">
                                                            {dir.target_deadline}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Hali:</span>
                                                    <span className="font-bold text-slate-200">
                                                        {dir.status === 'acknowledged'
                                                            ? `Imethibitishwa na ${dir.acknowledgedBy?.name || 'Meneja'}`
                                                            : dir.status}
                                                    </span>
                                                </div>
                                                {dir.acknowledgement_notes && (
                                                    <p className="text-[11px] text-blue-300 pt-1 border-t border-slate-800">
                                                        Jibu la Meneja: "{dir.acknowledgement_notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                                            <span>Iliwekwa: {dir.created_at.split('T')[0]}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm('Je, una uhakika unataka kufuta mwongozo huu?')) {
                                                        router.delete(route('owner.directives.destroy', dir.id));
                                                    }
                                                }}
                                                className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Futa</span>
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
                            <h2 className="text-lg font-black text-white flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-rose-400" />
                                <span>Ukaguzi wa Fedha & Ulinzi wa Mapato (Loss Prevention Watchlist)</span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Ufuatiliaji wa punguzo zilizotolewa, miamala iliyofutwa, na ughairi wa wateja ili kuzuia upotevu wa fedha kwenye matawi
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Discounts Watchlist */}
                            <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 shadow-lg">
                                <h3 className="text-base font-black text-white flex items-center gap-2 mb-3">
                                    <Percent className="w-4 h-4 text-amber-400" />
                                    <span>Punguzo Zilizotolewa (Discounts Watchlist)</span>
                                </h3>
                                {discountsWatchlist.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-6">
                                        Hakuna punguzo zilizorekodiwa hivi karibuni.
                                    </p>
                                ) : (
                                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                        {discountsWatchlist.map(disc => (
                                            <div
                                                key={disc.id}
                                                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-bold text-white">{disc.guest_name}</p>
                                                    <p className="text-[11px] text-slate-400">
                                                        {disc.property_name} • {disc.description}
                                                    </p>
                                                    <span className="text-[10px] text-slate-500">{disc.date}</span>
                                                </div>
                                                <span className="font-black text-amber-400 text-sm">
                                                    -{formatTzs(disc.amount_minor)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cancelled Bookings */}
                            <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 shadow-lg">
                                <h3 className="text-base font-black text-white flex items-center gap-2 mb-3">
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                    <span>Ughairi wa Vyumba & Sababu (Cancelled Bookings)</span>
                                </h3>
                                {cancelledBookings.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-6">
                                        Hakuna vyumba vilivyoghairiwa hivi karibuni.
                                    </p>
                                ) : (
                                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                        {cancelledBookings.map(bk => (
                                            <div
                                                key={bk.id}
                                                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono font-bold text-rose-300">
                                                            {bk.ref_no}
                                                        </span>
                                                        <span className="text-slate-300 font-bold">• {bk.guest_name}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400">
                                                        {bk.property_name} — Sababu: {bk.notes}
                                                    </p>
                                                    <span className="text-[10px] text-slate-500">{bk.date}</span>
                                                </div>
                                                <span className="font-black text-slate-300 text-sm">
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
                                <h2 className="text-lg font-black text-white flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                    <span>Gawio la Mmiliki na Mtaji (Owner Equity & Drawings)</span>
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Rekodi na fuatilia mgao wa faida (dividends), akiba ya mmiliki, na uwekezaji wa mtaji wa ziada
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDrawingModal(true)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Rekodi Gawio / Mtaji</span>
                            </button>
                        </div>

                        {/* Top Equity Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow-lg">
                                <span className="text-xs font-bold text-slate-400 uppercase block">Jumla ya Gawio Lililotolewa</span>
                                <h3 className="text-2xl font-black text-emerald-400 mt-1">
                                    {formatTzs(metrics.total_drawings_minor)}
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-1">Dividends & Owner Withdrawals</p>
                            </div>

                            <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow-lg">
                                <span className="text-xs font-bold text-slate-400 uppercase block">Mtaji wa Ziada Ulioingizwa</span>
                                <h3 className="text-2xl font-black text-purple-300 mt-1">
                                    {formatTzs(metrics.total_capital_injected_minor)}
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-1">Capital Injections by Owner</p>
                            </div>

                            <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow-lg">
                                <span className="text-xs font-bold text-slate-400 uppercase block">Faida ya Mwezi Huu (GOP)</span>
                                <h3 className="text-2xl font-black text-[#D4AF37] mt-1">
                                    {formatTzs(metrics.group_gop_minor)}
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-1">Inayoweza kugawa kama gawio</p>
                            </div>
                        </div>

                        {/* Drawings Table */}
                        <div className="bg-slate-800/90 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                            <div className="p-5 border-b border-slate-700">
                                <h3 className="text-base font-black text-white">Historia ya Miamala ya Mmiliki</h3>
                            </div>

                            {drawings.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-10">
                                    Hakuna muamala wa gawio au mtaji uliorekodiwa.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-slate-200">
                                        <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-700">
                                            <tr>
                                                <th className="py-3 px-4">Tarehe</th>
                                                <th className="py-3 px-4">Ref #</th>
                                                <th className="py-3 px-4">Aina ya Muamala</th>
                                                <th className="py-3 px-4">Tawi</th>
                                                <th className="py-3 px-4">Njia ya Malipo</th>
                                                <th className="py-3 px-4">Kiasi</th>
                                                <th className="py-3 px-4">Maelezo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {drawings.map(d => (
                                                <tr key={d.id} className="hover:bg-slate-750 transition">
                                                    <td className="py-3 px-4">{d.drawing_date}</td>
                                                    <td className="py-3 px-4 font-mono font-bold text-slate-300">{d.reference_no}</td>
                                                    <td className="py-3 px-4 font-bold">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                                d.drawing_type === 'dividend'
                                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                                    : 'bg-purple-500/20 text-purple-300'
                                                            }`}
                                                        >
                                                            {d.drawing_type === 'dividend'
                                                                ? 'Gawio (Dividend)'
                                                                : d.drawing_type === 'capital_injection'
                                                                ? 'Mtaji (Capital)'
                                                                : 'Owner Draw'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">{d.property?.name || 'Matawi Yote'}</td>
                                                    <td className="py-3 px-4 capitalize">{d.payment_method.replace('_', ' ')}</td>
                                                    <td className="py-3 px-4 font-black text-emerald-400">
                                                        {formatTzs(d.amount_minor)}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-400">{d.notes || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── MODAL 1: CREATE DIRECTIVE ──────────────────────────────────── */}
                {showDirectiveModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
                            <button
                                type="button"
                                onClick={() => setShowDirectiveModal(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                    <Megaphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">Toa Mwongozo wa Mmiliki</h3>
                                    <p className="text-xs text-slate-400">Maelekezo rasmi kwa mameneja wa matawi</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateDirective} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Kichwa cha Mwongozo (Title):</label>
                                    <input
                                        type="text"
                                        required
                                        value={directiveForm.data.title}
                                        onChange={e => directiveForm.setData('title', e.target.value)}
                                        placeholder="Mfano: Punguza gharama za umeme na kagua vifaa"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-[#D4AF37]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-300 font-bold mb-1">Tawi Lengwa:</label>
                                        <select
                                            value={directiveForm.data.property_id}
                                            onChange={e => directiveForm.setData('property_id', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                                        >
                                            <option value="">Matawi Yote (Group-wide)</option>
                                            {multiBranchData.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-bold mb-1">Kipaumbele (Priority):</label>
                                        <select
                                            value={directiveForm.data.priority}
                                            onChange={e => directiveForm.setData('priority', e.target.value as any)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                                        >
                                            <option value="normal">Kawaida (Normal)</option>
                                            <option value="high">Kipaumbele (High)</option>
                                            <option value="urgent">Dharura (Urgent)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-300 font-bold mb-1">Kategoria:</label>
                                        <select
                                            value={directiveForm.data.category}
                                            onChange={e => directiveForm.setData('category', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                                        >
                                            <option value="operations">Uendeshaji (Operations)</option>
                                            <option value="finance">Udhibiti wa Fedha (Finance)</option>
                                            <option value="policy">Sera & Taratibu (Policy)</option>
                                            <option value="maintenance">Matengenezo (Maintenance)</option>
                                            <option value="hr">Wafanyakazi & Nidhamu (HR)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-bold mb-1">Ukomo wa Siku (Deadline):</label>
                                        <input
                                            type="date"
                                            value={directiveForm.data.target_deadline}
                                            onChange={e => directiveForm.setData('target_deadline', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Maelekezo Kamili:</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={directiveForm.data.directive_text}
                                        onChange={e => directiveForm.setData('directive_text', e.target.value)}
                                        placeholder="Eleza maelekezo ya utekelezaji kwa mameneja..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-[#D4AF37]"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowDirectiveModal(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                                    >
                                        Ghairi
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={directiveForm.processing}
                                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow"
                                    >
                                        Tuma Mwongozo
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── MODAL 2: APPROVE REQUISITION ───────────────────────────────── */}
                {showApprovalModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                            <button
                                type="button"
                                onClick={() => setShowApprovalModal(null)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">Idhinisha Ombi la Matumizi</h3>
                                    <p className="text-xs font-mono text-amber-300">{showApprovalModal.requisition_no}</p>
                                </div>
                            </div>

                            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs mb-4">
                                <p className="font-bold text-white text-sm">{showApprovalModal.title}</p>
                                <p className="text-slate-400 mt-1">Tawi: {showApprovalModal.property?.name}</p>
                                <p className="font-black text-emerald-400 text-base mt-2">
                                    {formatTzs(showApprovalModal.amount_minor)}
                                </p>
                            </div>

                            <form onSubmit={handleApprove} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Maoni ya Idhini (Owner Notes):</label>
                                    <textarea
                                        rows={3}
                                        value={approvalForm.data.owner_notes}
                                        onChange={e => approvalForm.setData('owner_notes', e.target.value)}
                                        placeholder="Maoni au maelekezo kwa meneja wakati wa kutoa fedha hizi..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                                    />
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={approvalForm.data.create_expense}
                                        onChange={e => approvalForm.setData('create_expense', e.target.checked)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                                    />
                                    <span>Ingiza moja kwa moja kwenye orodha ya matumizi yaliyoidhinishwa (Expenses)</span>
                                </label>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowApprovalModal(null)}
                                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                                    >
                                        Ghairi
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={approvalForm.processing}
                                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow"
                                    >
                                        Thibitisha Idhini
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── MODAL 3: REJECT REQUISITION ────────────────────────────────── */}
                {showRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                            <button
                                type="button"
                                onClick={() => setShowRejectModal(null)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                                    <XCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">Kataa Ombi la Matumizi</h3>
                                    <p className="text-xs font-mono text-rose-300">{showRejectModal.requisition_no}</p>
                                </div>
                            </div>

                            <form onSubmit={handleReject} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Sababu ya Kukataa (Rejection Reason):</label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={rejectForm.data.owner_notes}
                                        onChange={e => rejectForm.setData('owner_notes', e.target.value)}
                                        placeholder="Eleza meneja kwa nini ombi hili limekataliwa au marekebisho yanayotakiwa..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowRejectModal(null)}
                                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                                    >
                                        Ghairi
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={rejectForm.processing}
                                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow"
                                    >
                                        Kataa Ombi Hili
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── MODAL 4: SET BRANCH TARGET ─────────────────────────────────── */}
                {showTargetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                            <button
                                type="button"
                                onClick={() => setShowTargetModal(null)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">Weka Lengo la Mapato</h3>
                                    <p className="text-xs text-slate-400">{showTargetModal.name}</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateTarget} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">
                                        Mapato Lengwa kwa Mwezi (TZS):
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={targetForm.data.monthly_target_revenue}
                                        onChange={e => targetForm.setData('monthly_target_revenue', Number(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-base font-black text-purple-300"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Lengo hili litaonekana kwenye dashibodi ya meneja mkuu wa tawi hili kama KPI kuu.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowTargetModal(null)}
                                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                                    >
                                        Ghairi
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={targetForm.processing}
                                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow"
                                    >
                                        Hifadhi Lengo
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── MODAL 5: RECORD DRAWING / CAPITAL INJECTION ─────────────────── */}
                {showDrawingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                            <button
                                type="button"
                                onClick={() => setShowDrawingModal(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <Coins className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">Rekodi Gawio au Mtaji</h3>
                                    <p className="text-xs text-slate-400">Muamala wa akaunti ya mmiliki wa hoteli</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateDrawing} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Aina ya Muamala:</label>
                                    <select
                                        value={drawingForm.data.drawing_type}
                                        onChange={e => drawingForm.setData('drawing_type', e.target.value as any)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                                    >
                                        <option value="dividend">Gawio la Faida (Dividend Withdrawal)</option>
                                        <option value="capital_injection">Kuingiza Mtaji wa Ziada (Capital Injection)</option>
                                        <option value="draw">Kutoa Fedha (Owner Draw)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Kiasi (TZS):</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="5000000"
                                        value={drawingForm.data.amount}
                                        onChange={e => drawingForm.setData('amount', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-black text-emerald-400 text-base"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-300 font-bold mb-1">Njia ya Malipo:</label>
                                        <select
                                            value={drawingForm.data.payment_method}
                                            onChange={e => drawingForm.setData('payment_method', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                                        >
                                            <option value="bank_transfer">Benki (Bank Transfer)</option>
                                            <option value="cash">Pesa Taslimu (Cash)</option>
                                            <option value="mpesa">Simu ya Mkononi (M-Pesa / Airtel)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-bold mb-1">Tarehe:</label>
                                        <input
                                            type="date"
                                            required
                                            value={drawingForm.data.drawing_date}
                                            onChange={e => drawingForm.setData('drawing_date', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Tawi Lililotoa/Kupokea:</label>
                                    <select
                                        value={drawingForm.data.property_id}
                                        onChange={e => drawingForm.setData('property_id', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                                    >
                                        <option value="">Akaunti Kuu ya Kikundi (Group Account)</option>
                                        {multiBranchData.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Maelezo ya Ziada (Notes):</label>
                                    <textarea
                                        rows={2}
                                        value={drawingForm.data.notes}
                                        onChange={e => drawingForm.setData('notes', e.target.value)}
                                        placeholder="Maelezo kuhusu mgao au uwekezaji huu..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowDrawingModal(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                                    >
                                        Ghairi
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={drawingForm.processing}
                                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow"
                                    >
                                        Hifadhi Muamala
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

