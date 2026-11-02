import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Award,
    Banknote,
    BarChart3,
    BedDouble,
    BookOpen,
    Boxes,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    DollarSign,
    ExternalLink,
    HelpCircle,
    Info,
    Layers,
    ListTodo,
    Package,
    Percent,
    Phone,
    Printer,
    Receipt,
    RefreshCw,
    Search,
    Shield,
    Sparkles,
    TrendingDown,
    TrendingUp,
    UserCheck,
    Users,
    UtensilsCrossed,
    Wallet,
    Wrench,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface BranchMetric {
    branch_id: string;
    name: string;
    code: string;
    city?: string;
    total_rooms: number;
    occupied_rooms: number;
    occupancy_rate: number;
    revenue_minor: number;
}

interface GlossaryItem {
    term: string;
    category: string;
    label: string;
    formula: string;
    summary: string;
    benchmark?: string;
    link: string;
    link_label: string;
}

interface PosOrderItemSummary {
    id: string;
    order_number: string;
    order_type: string;
    table_number?: string;
    room_number?: string;
    guest_name: string;
    items_count: number;
    items_summary: string;
    total_minor: number;
    payment_status: string;
    payment_method: string;
    folio_id?: string;
    created_at: string;
}

interface PosCategorySales {
    category: string;
    items_count: number;
    units_sold: number;
    total_minor: number;
}

interface StoreItem {
    id: string;
    sku: string;
    name: string;
    category: string;
    unit: string;
    current_stock: number;
    reorder_level: number;
    unit_cost_minor: number;
    total_valuation_minor: number;
    status: 'optimal' | 'low_stock' | 'out_of_stock';
    units_issued: number;
}

interface StoreData {
    total_items_count: number;
    total_valuation_minor: number;
    optimal_count: number;
    low_stock_count: number;
    out_of_stock_count: number;
    items: StoreItem[];
    by_category: Array<{
        category: string;
        items_count: number;
        total_valuation_minor: number;
        low_stock: number;
    }>;
}

interface ReportsIndexProps extends PageProps {
    selectedRange: string;
    summary: {
        total_gross_revenue_minor: number;
        total_room_revenue_minor: number;
        pos_revenue_minor: number;
        total_expenses_minor: number;
        net_profit_minor: number;
        profit_margin_percent: number;
        occupancy_rate: number;
        total_rooms: number;
        occupied_rooms: number;
        vacant_clean_rooms: number;
        dirty_rooms: number;
        out_of_service_rooms: number;
        adr_minor: number;
        revpar_minor: number;
    };
    financials: {
        payments_by_method: Record<string, { method: string; total_minor: number; count: number }>;
        department_charges: Array<{ department: string; total_minor: number; count: number }>;
        recent_payments: Array<{
            id: string;
            folio_id: string;
            folio_number: string;
            guest_name: string;
            payment_method: string;
            amount_minor: number;
            status: string;
            created_at: string;
        }>;
    };
    expenses: {
        by_category: Array<{ category: string; total_minor: number; count: number }>;
        recent_expenses: Array<{
            id: string;
            expense_number: string;
            title: string;
            category: string;
            vendor_name: string;
            amount_minor: number;
            payment_method: string;
            expense_date: string;
            status: string;
        }>;
    };
    rooms_data: {
        room_types_breakdown: Array<{
            id: string;
            name: string;
            code: string;
            total_units: number;
            occupied_units: number;
            occupancy_percent: number;
            base_price_minor: number;
            revenue_minor: number;
        }>;
    };
    customers_data: {
        total_in_house: number;
        total_checkins_period: number;
        total_reservations_period: number;
        upcoming_reservations: number;
        total_registered: number;
        resident_count: number;
        non_resident_count: number;
        in_house_guests: Array<{
            id: string;
            guest_id?: string;
            name: string;
            phone: string;
            room_number: string;
            room_type: string;
            checked_in_at: string;
            check_out: string;
            folio_id?: string;
            folio_balance_minor: number;
            vip_level: string;
            is_resident: boolean;
        }>;
    };
    restaurant_data: {
        total_items: number;
        available_items: number;
        out_of_stock_items: number;
        total_orders: number;
        top_selling: Array<{ name: string; quantity_sold: number; total_minor: number }>;
        stock_list: Array<{
            id: string;
            code: string;
            name: string;
            category: string;
            price_minor: number;
            is_available: boolean;
            units_sold: number;
        }>;
        recent_orders?: PosOrderItemSummary[];
        by_category?: PosCategorySales[];
    };
    store_data?: StoreData;
    branchComparisons: BranchMetric[];
    glossary: GlossaryItem[];
}

export default function ReportsIndex({
    selectedRange = '30days',
    summary,
    financials,
    expenses,
    rooms_data,
    customers_data,
    restaurant_data,
    store_data,
    branchComparisons = [],
    glossary = [],
}: ReportsIndexProps) {
    const [activeTab, setActiveTab] = useState<
        'all' | 'income' | 'expenses' | 'rooms' | 'customers' | 'restaurant' | 'store' | 'glossary'
    >(() => {
        if (typeof window !== 'undefined') {
            const param = new URLSearchParams(window.location.search).get('tab');
            if (param && ['all', 'income', 'expenses', 'rooms', 'customers', 'restaurant', 'store', 'glossary'].includes(param)) {
                return param as any;
            }
        }
        return 'all';
    });
    const [stockSearch, setStockSearch] = useState('');
    const [storeSearch, setStoreSearch] = useState('');
    const [storeCategoryFilter, setStoreCategoryFilter] = useState('all');
    const [glossarySearch, setGlossarySearch] = useState('');

    const handleRangeChange = (range: string) => {
        router.get(
            route('reports.index'),
            { range, tab: activeTab !== 'all' ? activeTab : undefined },
            { preserveState: true, replace: true }
        );
    };

    const formatTsh = (amountMinor: number) => {
        const val = Math.round((amountMinor || 0) / 100);
        return 'TSh ' + val.toLocaleString();
    };

    const formatPaymentMethodName = (method: string) => {
        switch (method?.toLowerCase()) {
            case 'mpesa':
                return 'M-Pesa';
            case 'tigopesa':
                return 'TigoPesa';
            case 'airtelmoney':
                return 'Airtel Money';
            case 'halopesa':
                return 'HaloPesa';
            case 'cash':
                return 'Cash';
            case 'card':
                return 'Credit / Debit Card';
            case 'bank_transfer':
                return 'Bank Transfer';
            default:
                return method?.toUpperCase() || 'Other';
        }
    };

    // Filter stock items
    const filteredStockList = useMemo(() => {
        if (!stockSearch.trim()) return restaurant_data?.stock_list || [];
        const q = stockSearch.toLowerCase().trim();
        return (restaurant_data?.stock_list || []).filter(
            (i) =>
                i.name.toLowerCase().includes(q) ||
                i.code.toLowerCase().includes(q) ||
                i.category.toLowerCase().includes(q)
        );
    }, [restaurant_data?.stock_list, stockSearch]);

    // Filter store items
    const filteredStoreItems = useMemo(() => {
        const items = store_data?.items || [];
        return items.filter((item) => {
            const matchesCat = storeCategoryFilter === 'all' || item.category === storeCategoryFilter;
            const q = storeSearch.toLowerCase().trim();
            const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
            return matchesCat && matchesSearch;
        });
    }, [store_data?.items, storeSearch, storeCategoryFilter]);

    // Filter glossary
    const filteredGlossary = useMemo(() => {
        if (!glossarySearch.trim()) return glossary || [];
        const q = glossarySearch.toLowerCase().trim();
        return (glossary || []).filter(
            (g) =>
                g.term.toLowerCase().includes(q) ||
                g.label.toLowerCase().includes(q) ||
                g.category.toLowerCase().includes(q) ||
                g.summary.toLowerCase().includes(q)
        );
    }, [glossary, glossarySearch]);

    return (
        <AuthenticatedLayout>
            <Head title="Hotel Executive Report - Performance Analytics" />

            <div className="space-y-6 pb-16">
                {/* 1. TOP EXECUTIVE HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Hotel Performance Report
                            </h1>
                            <span className="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold rounded-full">
                                Executive Overview
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                            <span>Income</span>
                            <span>•</span>
                            <span>Expenses</span>
                            <span>•</span>
                            <span>Rooms</span>
                            <span>•</span>
                            <span>Guests</span>
                            <span>•</span>
                            <span>POS & Stock</span>
                            <span>•</span>
                            <span>Glossary</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Time Range Selector */}
                        <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
                            {[
                                { key: 'today', label: 'Today' },
                                { key: '7days', label: '7 Days' },
                                { key: '30days', label: '30 Days' },
                                { key: 'this_month', label: 'This Month' },
                                { key: 'this_year', label: 'This Year' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleRangeChange(tab.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                        selectedRange === tab.key
                                            ? 'bg-sky-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95"
                        >
                            <Printer className="w-4 h-4 text-slate-500" />
                            <span>Print</span>
                        </button>
                    </div>
                </div>

                {/* 2. SECTION NAVIGATION TABS */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200">
                    {[
                        { key: 'all', label: 'Overview', icon: BarChart3 },
                        { key: 'income', label: 'Income & Folios', icon: Banknote },
                        { key: 'expenses', label: 'Expenses & Profit', icon: Wallet },
                        { key: 'rooms', label: 'Rooms & Occupancy', icon: BedDouble },
                        { key: 'customers', label: 'Guests', icon: Users },
                        { key: 'restaurant', label: 'Restaurant Overview', icon: UtensilsCrossed },
                        { key: 'store', label: 'Store & Inventory', icon: Package },
                        { key: 'glossary', label: 'Hotel Glossary', icon: BookOpen },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                                    isSelected
                                        ? 'bg-sky-800 text-white shadow-xs'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* 3. CORE SUMMARY KPI CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Gross Income Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Total Gross Income
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-xl sm:text-2xl font-black text-slate-900">
                                {formatTsh(summary.total_gross_revenue_minor)}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-semibold">
                                <span>Rooms: {formatTsh(summary.total_room_revenue_minor)}</span>
                                <span>•</span>
                                <span>POS: {formatTsh(summary.pos_revenue_minor)}</span>
                            </div>
                        </div>
                        <Link
                            href={route('folios.index')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 pt-2 border-t border-slate-100 group"
                        >
                            <span>Open Folios & Billing</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

                    {/* Total Expenses Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Total Operating Expenses
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-xl sm:text-2xl font-black text-rose-700">
                                {formatTsh(summary.total_expenses_minor)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                                Operations • Purchases • Payroll
                            </div>
                        </div>
                        <Link
                            href={route('accounting.index')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 pt-2 border-t border-slate-100 group"
                        >
                            <span>Open Accounting Ledger</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

                    {/* Net Profit Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Net Operating Profit
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Award className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className={`text-xl sm:text-2xl font-black ${
                                summary.net_profit_minor >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                                {formatTsh(summary.net_profit_minor)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                                Profit Margin: <strong className="text-slate-900">{summary.profit_margin_percent}%</strong>
                            </div>
                        </div>
                        <Link
                            href={route('accounting.index')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 pt-2 border-t border-slate-100 group"
                        >
                            <span>View Profit Ledger</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

                    {/* Occupancy & ADR Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Occupancy & ADR
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <BedDouble className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-xl sm:text-2xl font-black text-slate-900">
                                {summary.occupancy_rate}%
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                                Occupied: {summary.occupied_rooms}/{summary.total_rooms} • ADR: {formatTsh(summary.adr_minor)}
                            </div>
                        </div>
                        <Link
                            href={route('housekeeping.index')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 pt-2 border-t border-slate-100 group"
                        >
                            <span>Room Status Overview</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* =========================================================================
                    SECTION 1: INCOME & FOLIOS
                ========================================================================== */}
                {(activeTab === 'all' || activeTab === 'income') && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <Banknote className="w-5 h-5 text-emerald-600" />
                                    <span>Income & Collections</span>
                                </h2>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    Revenue Stream Breakdown
                                </span>
                            </div>
                            <Link
                                href={route('folios.index')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition"
                            >
                                <span>All Folios</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {/* Income KPI Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
                                <span className="text-xs font-bold text-slate-400 uppercase">Room Revenue</span>
                                <div className="text-xl font-black text-slate-900 mt-1">
                                    {formatTsh(summary.total_room_revenue_minor)}
                                </div>
                                <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                    Lodging & Folio Settlements
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
                                <span className="text-xs font-bold text-slate-400 uppercase">Restaurant & Bar POS</span>
                                <div className="text-xl font-black text-slate-900 mt-1">
                                    {formatTsh(summary.pos_revenue_minor)}
                                </div>
                                <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                    {restaurant_data.total_orders} Orders Settled
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
                                <span className="text-xs font-bold text-slate-400 uppercase">RevPAR</span>
                                <div className="text-xl font-black text-sky-800 mt-1">
                                    {formatTsh(summary.revpar_minor)}
                                </div>
                                <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 text-[10px] font-bold">
                                    Revenue Per Available Room
                                </span>
                            </div>
                        </div>

                        {/* Payment Methods Breakdown Cards */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Payment Channels & Collections
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                                {Object.keys(financials.payments_by_method || {}).length === 0 ? (
                                    <div className="col-span-full py-4 text-center text-xs text-slate-400">
                                        No payment records in selected period.
                                    </div>
                                ) : (
                                    Object.entries(financials.payments_by_method).map(([key, val]) => (
                                        <div
                                            key={key}
                                            className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between"
                                        >
                                            <span className="text-[10px] font-bold text-slate-500 uppercase truncate">
                                                {formatPaymentMethodName(key)}
                                            </span>
                                            <div className="text-sm font-black text-slate-900 mt-1">
                                                {formatTsh(val.total_minor)}
                                            </div>
                                            <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                                {val.count} Transactions
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Payments Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Recent Payment Transactions
                                </h3>
                                <Link
                                    href={route('folios.index')}
                                    className="text-xs text-sky-700 font-bold hover:underline"
                                >
                                    View All &rarr;
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="py-3 px-4">Folio Reference</th>
                                            <th className="py-3 px-4">Guest / Owner</th>
                                            <th className="py-3 px-4">Payment Method</th>
                                            <th className="py-3 px-4">Amount Paid</th>
                                            <th className="py-3 px-4">Date & Time</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {financials.recent_payments.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-slate-400">
                                                    No payments recorded in selected period.
                                                </td>
                                            </tr>
                                        ) : (
                                            financials.recent_payments.map((pay) => (
                                                <tr key={pay.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3 px-4 font-bold text-slate-900">
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 font-mono">
                                                            {pay.folio_number}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-slate-800">
                                                        {pay.guest_name}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                            {formatPaymentMethodName(pay.payment_method)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-black text-slate-900">
                                                        {formatTsh(pay.amount_minor)}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                        {pay.created_at}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 capitalize">
                                                            {pay.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Link
                                                            href={route('folios.show', pay.folio_id)}
                                                            className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                                                        >
                                                            <span>Folio</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    SECTION 2: EXPENSES & PROFIT
                ========================================================================== */}
                {(activeTab === 'all' || activeTab === 'expenses') && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-rose-600" />
                                    <span>Operating Expenses & Net Profit</span>
                                </h2>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    Cost Center Breakdown
                                </span>
                            </div>
                            <Link
                                href={route('accounting.index')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition"
                            >
                                <span>Accounting Module</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {/* Expense Categories Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                            {expenses.by_category.length === 0 ? (
                                <div className="col-span-full bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                                    No expense records in selected period.
                                </div>
                            ) : (
                                expenses.by_category.map((cat) => (
                                    <div
                                        key={cat.category}
                                        className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between"
                                    >
                                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate capitalize">
                                            {cat.category?.replace('_', ' ')}
                                        </span>
                                        <div className="text-base font-black text-rose-700 mt-1">
                                            {formatTsh(cat.total_minor)}
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                            {cat.count} Entries
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Recent Expenses Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Recent Operating Expense Entries
                                </h3>
                                <Link
                                    href={route('accounting.index')}
                                    className="text-xs text-sky-700 font-bold hover:underline"
                                >
                                    View All &rarr;
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="py-3 px-4">Expense No</th>
                                            <th className="py-3 px-4">Title / Description</th>
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4">Payee / Vendor</th>
                                            <th className="py-3 px-4">Payment Method</th>
                                            <th className="py-3 px-4">Amount</th>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {expenses.recent_expenses.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-slate-400">
                                                    No expenses recorded in selected period.
                                                </td>
                                            </tr>
                                        ) : (
                                            expenses.recent_expenses.map((exp) => (
                                                <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3 px-4 font-bold text-slate-900">
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 font-mono">
                                                            {exp.expense_number}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-slate-800">
                                                        {exp.title}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                                                            {exp.category?.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-700 font-medium">
                                                        {exp.vendor_name}
                                                    </td>
                                                    <td className="py-3 px-4 capitalize text-slate-600">
                                                        {exp.payment_method}
                                                    </td>
                                                    <td className="py-3 px-4 font-black text-rose-700">
                                                        {formatTsh(exp.amount_minor)}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                        {exp.expense_date}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Link
                                                            href={route('accounting.index')}
                                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                                                        >
                                                            <span>Ledger</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    SECTION 3: ROOMS & OCCUPANCY
                ========================================================================== */}
                {(activeTab === 'all' || activeTab === 'rooms') && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <BedDouble className="w-5 h-5 text-sky-700" />
                                    <span>Rooms & Occupancy</span>
                                </h2>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    Inventory & Utilization Metrics
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={route('calendar.index')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs"
                                >
                                    <span>Gantt Calendar</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <Link
                                    href={route('housekeeping.index')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold transition"
                                >
                                    <span>Room Overview</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Room Status KPI Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Inventory</span>
                                <div className="text-xl font-black text-slate-900 mt-1">{summary.total_rooms}</div>
                                <span className="text-[10px] text-slate-500 font-semibold">100% Capacity</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Vacant Clean</span>
                                <div className="text-xl font-black text-emerald-700 mt-1">{summary.vacant_clean_rooms}</div>
                                <span className="text-[10px] text-emerald-600 font-semibold">Ready for Check-In</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-blue-600 uppercase">Occupied</span>
                                <div className="text-xl font-black text-blue-800 mt-1">{summary.occupied_rooms}</div>
                                <span className="text-[10px] text-blue-600 font-semibold">{summary.occupancy_rate}% Occupancy</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-amber-600 uppercase">Needs Cleaning</span>
                                <div className="text-xl font-black text-amber-700 mt-1">{summary.dirty_rooms}</div>
                                <span className="text-[10px] text-amber-600 font-semibold">Dirty / Queue</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-rose-600 uppercase">Out of Order</span>
                                <div className="text-xl font-black text-rose-700 mt-1">{summary.out_of_service_rooms}</div>
                                <span className="text-[10px] text-rose-600 font-semibold">Maintenance</span>
                            </div>
                        </div>

                        {/* Room Types Breakdown Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Room Type Performance & Utilization
                                </h3>
                                <Link
                                    href={route('housekeeping.index')}
                                    className="text-xs text-sky-700 font-bold hover:underline"
                                >
                                    Manage Rooms &rarr;
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="py-3 px-4">Room Type</th>
                                            <th className="py-3 px-4">Base Rate</th>
                                            <th className="py-3 px-4">Total Units</th>
                                            <th className="py-3 px-4">Occupied Units</th>
                                            <th className="py-3 px-4">Occupancy</th>
                                            <th className="py-3 px-4 text-right">Estimated Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rooms_data.room_types_breakdown.map((rt) => (
                                            <tr key={rt.id} className="hover:bg-slate-50/70 transition">
                                                <td className="py-3 px-4 font-bold text-slate-900">
                                                    {rt.name}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-800">
                                                    {formatTsh(rt.base_price_minor)}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-700">
                                                    {rt.total_units} Units
                                                </td>
                                                <td className="py-3 px-4 font-bold text-sky-800">
                                                    {rt.occupied_units} Units
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className="bg-sky-600 h-full rounded-full"
                                                                style={{ width: `${Math.min(100, rt.occupancy_percent)}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-bold text-slate-800 text-[11px]">
                                                            {rt.occupancy_percent}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right font-black text-slate-900">
                                                    {formatTsh(rt.revenue_minor)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    SECTION 4: CUSTOMERS & GUESTS
                ========================================================================== */}
                {(activeTab === 'all' || activeTab === 'customers') && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                    <span>Guests & In-House Stays</span>
                                </h2>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    Resident & International Guest Metrics
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={route('guests.index')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition"
                                >
                                    <span>Guest Portal</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <Link
                                    href={route('reservations.index')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs"
                                >
                                    <span>Reservations</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Customer KPI Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">In-House Guests</span>
                                <div className="text-xl font-black text-indigo-800 mt-1">
                                    {customers_data.total_in_house}
                                </div>
                                <span className="text-[10px] text-slate-500 font-semibold">Active In-House Stays</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Period Check-Ins</span>
                                <div className="text-xl font-black text-slate-900 mt-1">
                                    {customers_data.total_checkins_period}
                                </div>
                                <span className="text-[10px] text-slate-500 font-semibold">Completed Arrivals</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Upcoming Bookings</span>
                                <div className="text-xl font-black text-emerald-700 mt-1">
                                    {customers_data.upcoming_reservations}
                                </div>
                                <span className="text-[10px] text-emerald-600 font-semibold">Future Reservations</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Residents / International</span>
                                <div className="text-xl font-black text-slate-900 mt-1">
                                    {customers_data.resident_count} / {customers_data.non_resident_count}
                                </div>
                                <span className="text-[10px] text-slate-500 font-semibold">Guest Origin Breakdown</span>
                            </div>
                        </div>

                        {/* In-House Guests Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Active In-House Stays & Room Accounts
                                </h3>
                                <Link
                                    href={route('guests.index')}
                                    className="text-xs text-indigo-700 font-bold hover:underline"
                                >
                                    Guest Portal &rarr;
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="py-3 px-4">Room</th>
                                            <th className="py-3 px-4">Guest Name</th>
                                            <th className="py-3 px-4">Contact</th>
                                            <th className="py-3 px-4">Arrival Date</th>
                                            <th className="py-3 px-4">Departure Date</th>
                                            <th className="py-3 px-4">VIP Tier</th>
                                            <th className="py-3 px-4">Folio Balance</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {customers_data.in_house_guests.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-slate-400">
                                                    No in-house guests currently checked in.
                                                </td>
                                            </tr>
                                        ) : (
                                            customers_data.in_house_guests.map((g) => (
                                                <tr key={g.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3 px-4 font-bold text-slate-900">
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                                                            {g.room_number}
                                                        </span>
                                                        <span className="block text-[10px] text-slate-400 mt-0.5">
                                                            {g.room_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-900">
                                                        {g.name}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600">
                                                        {g.phone}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                                                        {g.checked_in_at}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                                                        {g.check_out}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                                                            {g.vip_level}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-bold">
                                                        {g.folio_balance_minor > 0 ? (
                                                            <span className="text-rose-600">
                                                                {formatTsh(g.folio_balance_minor)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-700">Settled (TSh 0)</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {g.folio_id ? (
                                                            <Link
                                                                href={route('folios.show', g.folio_id)}
                                                                className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                                                            >
                                                                <span>Folio</span>
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Link>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    SECTION 5: RESTAURANT OVERVIEW REPORT
                ========================================================================== */}
                {(activeTab === 'all' || activeTab === 'restaurant') && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                                    <span>Restaurant, Food & Beverage Overview</span>
                                </h2>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    Dining Sales, Order Channels & Kitchen Performance
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={route('restaurant.index')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 rounded-xl text-xs font-bold transition shadow-2xs"
                                >
                                    <span>Restaurant Manager Portal</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <Link
                                    href={route('pos.index')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold transition"
                                >
                                    <span>POS Terminal</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Restaurant & Stock KPI Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Gross F&B Revenue</span>
                                <div className="text-xl font-black text-amber-900 mt-1">
                                    {formatTsh(summary.pos_revenue_minor)}
                                </div>
                                <span className="text-[10px] text-amber-700 font-semibold">{restaurant_data.total_orders} Total Orders</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Menu Items</span>
                                <div className="text-xl font-black text-slate-900 mt-1">
                                    {restaurant_data.total_items}
                                </div>
                                <span className="text-[10px] text-slate-500 font-semibold">Active Menu Catalog</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">In Stock Items</span>
                                <div className="text-xl font-black text-emerald-700 mt-1">
                                    {restaurant_data.available_items}
                                </div>
                                <span className="text-[10px] text-emerald-600 font-semibold">Available for Orders</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-rose-600 uppercase">Out of Stock</span>
                                <div className="text-xl font-black text-rose-700 mt-1">
                                    {restaurant_data.out_of_stock_items}
                                </div>
                                <span className="text-[10px] text-rose-600 font-semibold">Depleted Items</span>
                            </div>
                        </div>

                        {/* F&B Category Breakdown Cards */}
                        {restaurant_data.by_category && restaurant_data.by_category.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {restaurant_data.by_category.map((cat) => (
                                    <div
                                        key={cat.category}
                                        className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between"
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-xs font-bold text-slate-800 truncate">{cat.category}</span>
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                                                {cat.items_count} items
                                            </span>
                                        </div>
                                        <div className="text-base font-black text-slate-900 mt-1">
                                            {formatTsh(cat.total_minor)}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                            {cat.units_sold} Units Sold
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Top Selling Items & Stock Inventory Dual Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* Left: Top Selling Items (4 cols) */}
                            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-amber-500" />
                                    <span>Top Selling Menu Items</span>
                                </h3>
                                {restaurant_data.top_selling.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-slate-400">
                                        No sales records in selected period.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {restaurant_data.top_selling.map((item, idx) => (
                                            <div key={item.name} className="py-2.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <span className="font-bold text-slate-900 text-xs block">
                                                            {item.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {item.quantity_sold} Units Sold
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-xs text-slate-900">
                                                    {formatTsh(item.total_minor)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: Menu & Stock List Table (8 cols) */}
                            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs flex flex-col justify-between">
                                <div>
                                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Menu Catalog & Stock Status
                                        </h3>
                                        <div className="relative w-full sm:w-48">
                                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={stockSearch}
                                                onChange={(e) => setStockSearch(e.target.value)}
                                                placeholder="Search menu item..."
                                                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                                <tr>
                                                    <th className="py-2.5 px-3">Item Code</th>
                                                    <th className="py-2.5 px-3">Item Name</th>
                                                    <th className="py-2.5 px-3">Category</th>
                                                    <th className="py-2.5 px-3">Unit Price</th>
                                                    <th className="py-2.5 px-3">Stock Status</th>
                                                    <th className="py-2.5 px-3 text-right">Sold Units</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredStockList.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-6 text-center text-slate-400">
                                                            No stock items matched filter.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredStockList.map((item) => (
                                                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                                            <td className="py-2.5 px-3 font-mono font-bold text-slate-600 text-[11px]">
                                                                {item.code}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-bold text-slate-900">
                                                                {item.name}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-slate-600">
                                                                {item.category}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-black text-slate-900">
                                                                {formatTsh(item.price_minor)}
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                        item.is_available
                                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                    }`}
                                                                >
                                                                    {item.is_available ? 'In Stock' : 'Out of Stock'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                                                                {item.units_sold} Units
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-medium">
                                        Showing {filteredStockList.length} items.
                                    </span>
                                    <Link
                                        href={route('pos.index')}
                                        className="font-bold text-amber-800 hover:text-amber-950 underline"
                                    >
                                        Manage POS & Menu &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Recent Restaurant Orders Table */}
                        {restaurant_data.recent_orders && (
                            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Receipt className="w-4 h-4 text-amber-600" />
                                        <span>Recent Dining & Bar Orders</span>
                                    </h3>
                                    <Link
                                        href={route('pos.index')}
                                        className="text-xs text-amber-800 font-bold hover:underline"
                                    >
                                        POS Terminal &rarr;
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                            <tr>
                                                <th className="py-3 px-4">Order No</th>
                                                <th className="py-3 px-4">Order Type</th>
                                                <th className="py-3 px-4">Room / Table</th>
                                                <th className="py-3 px-4">Guest Name</th>
                                                <th className="py-3 px-4">Items Summary</th>
                                                <th className="py-3 px-4">Total Amount</th>
                                                <th className="py-3 px-4">Payment Method</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4 text-right">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {restaurant_data.recent_orders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="py-6 text-center text-slate-400">
                                                        No orders recorded in selected period.
                                                    </td>
                                                </tr>
                                            ) : (
                                                restaurant_data.recent_orders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                                                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                                            <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                                                                {order.order_number}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 capitalize font-medium text-slate-700">
                                                            {order.order_type.replace('_', ' ')}
                                                        </td>
                                                        <td className="py-3 px-4 font-bold text-slate-900">
                                                            {order.room_number ? `Room ${order.room_number}` : (order.table_number ? `Table ${order.table_number}` : 'Counter')}
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-800 font-medium">
                                                            {order.guest_name}
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                                                            {order.items_summary} ({order.items_count} items)
                                                        </td>
                                                        <td className="py-3 px-4 font-black text-slate-900">
                                                            {formatTsh(order.total_minor)}
                                                        </td>
                                                        <td className="py-3 px-4 capitalize text-slate-600">
                                                            {order.payment_method.replace('_', ' ')}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                    order.payment_status === 'paid'
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                        : order.payment_status === 'posted_to_room'
                                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                }`}
                                                            >
                                                                {order.payment_status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                                                            {order.created_at}
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
                )}

                {/* =========================================================================
                    SECTION 6: STORE & INVENTORY OVERVIEW REPORT (ASTORE REPORT)
                ========================================================================== */}
                {(activeTab === 'all' || activeTab === 'store') && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <Package className="w-5 h-5 text-emerald-700" />
                                    <span>Hotel Store & Central Inventory Overview</span>
                                </h2>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    Asset Valuation, Linens, Consumables & Reorder Alerts
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={route('inventory.index')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                                >
                                    <span>Store Manager Portal</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <Link
                                    href={route('grocery.index')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition"
                                >
                                    <span>POS Grocery Portal</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Store KPI Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Inventory Value</span>
                                <div className="text-xl font-black text-emerald-900 mt-1">
                                    {formatTsh(store_data?.total_valuation_minor || 0)}
                                </div>
                                <span className="text-[10px] text-emerald-700 font-semibold">Store Stock Assets</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Tracked SKUs</span>
                                <div className="text-xl font-black text-slate-900 mt-1">
                                    {store_data?.total_items_count || 0} Items
                                </div>
                                <span className="text-[10px] text-slate-500 font-semibold">Consumables & Assets</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Optimal Stock</span>
                                <div className="text-xl font-black text-emerald-700 mt-1">
                                    {store_data?.optimal_count || 0} SKUs
                                </div>
                                <span className="text-[10px] text-emerald-600 font-semibold">Healthy Reserves</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-rose-600 uppercase">Reorder Alerts</span>
                                <div className="text-xl font-black text-rose-700 mt-1">
                                    {(store_data?.low_stock_count || 0) + (store_data?.out_of_stock_count || 0)} SKUs
                                </div>
                                <span className="text-[10px] text-rose-600 font-semibold">Low or Depleted</span>
                            </div>
                        </div>

                        {/* Department Valuation Cards */}
                        {store_data?.by_category && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {store_data.by_category.map((cat) => (
                                    <div
                                        key={cat.category}
                                        className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between"
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-xs font-bold text-slate-800 truncate">{cat.category}</span>
                                            {cat.low_stock > 0 && (
                                                <span className="text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded">
                                                    {cat.low_stock} Low
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-base font-black text-emerald-800 mt-1">
                                            {formatTsh(cat.total_valuation_minor)}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                            {cat.items_count} Tracked SKUs
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Searchable Store Inventory Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Central Store Stock Ledger & Reorder Register
                                    </h3>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        Showing {filteredStoreItems.length} of {store_data?.items?.length || 0} items
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Department Filter */}
                                    <select
                                        value={storeCategoryFilter}
                                        onChange={(e) => setStoreCategoryFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
                                    >
                                        <option value="all">All Store Departments</option>
                                        {store_data?.by_category?.map((c) => (
                                            <option key={c.category} value={c.category}>
                                                {c.category}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Search Input */}
                                    <div className="relative w-full sm:w-48">
                                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={storeSearch}
                                            onChange={(e) => setStoreSearch(e.target.value)}
                                            placeholder="Search SKU or name..."
                                            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="py-3 px-4">SKU Code</th>
                                            <th className="py-3 px-4">Item Name</th>
                                            <th className="py-3 px-4">Department</th>
                                            <th className="py-3 px-4">Unit</th>
                                            <th className="py-3 px-4">Unit Cost</th>
                                            <th className="py-3 px-4">Current Stock</th>
                                            <th className="py-3 px-4">Reorder Min</th>
                                            <th className="py-3 px-4">Valuation</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStoreItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="py-8 text-center text-slate-400">
                                                    No inventory items found matching filter criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStoreItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                                                            {item.sku}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-900">
                                                        {item.name}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600">
                                                        {item.category}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500 font-medium">
                                                        {item.unit}
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-700">
                                                        {formatTsh(item.unit_cost_minor)}
                                                    </td>
                                                    <td className="py-3 px-4 font-black text-slate-900">
                                                        <span className={item.current_stock <= item.reorder_level ? 'text-rose-600' : 'text-slate-900'}>
                                                            {item.current_stock}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500 font-semibold">
                                                        {item.reorder_level}
                                                    </td>
                                                    <td className="py-3 px-4 font-black text-emerald-800">
                                                        {formatTsh(item.total_valuation_minor)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                item.status === 'optimal'
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : item.status === 'low_stock'
                                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}
                                                        >
                                                            {item.status === 'optimal' ? 'Optimal' : (item.status === 'low_stock' ? 'Low Stock' : 'Out of Stock')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Link
                                                            href={route('accounting.index')}
                                                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                                                        >
                                                            <span>Procure</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    SECTION 7: GLOSSARY REPORT (KPI LABELS & FORMULAS)
                ========================================================================== */}
                {(activeTab === 'all' || activeTab === 'glossary') && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-sky-700" />
                                    <span>Hotel Metrics Glossary & KPI Formulas</span>
                                </h2>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    Hospitality Standards, Mathematical Equations & Performance Benchmarks
                                </span>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={glossarySearch}
                                    onChange={(e) => setGlossarySearch(e.target.value)}
                                    placeholder="Search metric or formula..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        {/* Glossary Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredGlossary.map((item) => (
                                <div
                                    key={item.term}
                                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between space-y-3 hover:border-sky-300 transition"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-black text-slate-900 tracking-tight">
                                                {item.term}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                                {item.category}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-sky-800 mt-1">
                                            {item.label}
                                        </h4>
                                        <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
                                            {item.summary}
                                        </p>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                                Standard Formula:
                                            </span>
                                            <span className="font-mono text-[11px] font-bold text-slate-800 block mt-0.5">
                                                {item.formula}
                                            </span>
                                        </div>

                                        {item.benchmark && (
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-400 font-semibold">Target Benchmark:</span>
                                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    {item.benchmark}
                                                </span>
                                            </div>
                                        )}

                                        <Link
                                            href={item.link}
                                            className="inline-flex items-center gap-1 font-bold text-sky-700 hover:text-sky-900 text-xs pt-1 group"
                                        >
                                            <span>{item.link_label}</span>
                                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Master Glossary Reference Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs mt-4">
                            <div className="p-4 border-b border-slate-100">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Hotel Key Performance Indicators Master Reference Table
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="py-3 px-4">Metric & KPI</th>
                                            <th className="py-3 px-4">Department</th>
                                            <th className="py-3 px-4">Standard Formula</th>
                                            <th className="py-3 px-4">Benchmark Target</th>
                                            <th className="py-3 px-4 text-right">Module Link</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredGlossary.map((item) => (
                                            <tr key={item.term} className="hover:bg-slate-50/70 transition">
                                                <td className="py-3 px-4 font-bold text-slate-900">
                                                    {item.term}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono font-bold text-slate-800 text-[11px]">
                                                    {item.formula}
                                                </td>
                                                <td className="py-3 px-4 text-emerald-700 font-semibold">
                                                    {item.benchmark || 'Operational Sync'}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Link
                                                        href={item.link}
                                                        className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                                                    >
                                                        <span>{item.link_label}</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    MULTI-BRANCH COMPARISON TABLE (IF MULTI-PROPERTY)
                ========================================================================== */}
                {branchComparisons.length > 1 && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs pt-2">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-sky-700" />
                                <span>Multi-Property Performance Comparison</span>
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 px-4">Branch Property</th>
                                        <th className="py-3 px-4">Location</th>
                                        <th className="py-3 px-4">Total Rooms</th>
                                        <th className="py-3 px-4">Occupied Rooms</th>
                                        <th className="py-3 px-4">Occupancy Rate</th>
                                        <th className="py-3 px-4 text-right">Period Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {branchComparisons.map((b) => (
                                        <tr key={b.branch_id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4 font-bold text-slate-900">
                                                {b.name} ({b.code})
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">{b.city || 'Tanzania'}</td>
                                            <td className="py-3 px-4 font-semibold text-slate-700">{b.total_rooms}</td>
                                            <td className="py-3 px-4 font-bold text-sky-800">{b.occupied_rooms}</td>
                                            <td className="py-3 px-4 font-bold text-slate-900">{b.occupancy_rate}%</td>
                                            <td className="py-3 px-4 text-right font-black text-emerald-700">
                                                {formatTsh(b.revenue_minor)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
