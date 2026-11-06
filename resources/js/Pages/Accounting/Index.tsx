import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowRight,
    ArrowRightLeft,
    ArrowUpRight,
    Banknote,
    BarChart3,
    Bed,
    BookOpen,
    Building2,
    Calendar,
    Check,
    CheckCheck,
    CheckCircle2,
    ChevronRight,
    Clock,
    Coins,
    CreditCard,
    DollarSign,
    Download,
    Eye,
    FileCheck,
    FileCheck2,
    FileEdit,
    FileSpreadsheet,
    FileText,
    Filter,
    HelpCircle,
    Landmark,
    Layers,
    ListOrdered,
    Package,
    Percent,
    PieChart,
    Plus,
    Printer,
    Receipt,
    RefreshCw,
    RotateCcw,
    Scale,
    Search,
    ShieldAlert,
    ShieldCheck,
    ShoppingBag,
    Store,
    TrendingDown,
    TrendingUp,
    Truck,
    Users,
    Utensils,
    Wallet,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
    category: string;
    balance_minor?: number;
    is_active?: boolean;
}

interface Expense {
    id: string;
    expense_number: string;
    title: string;
    category: string;
    vendor_name?: string;
    amount_minor: number;
    payment_method: string;
    expense_date: string;
    status: string;
    receipt_reference?: string;
    notes?: string;
    creator?: { name: string };
}

interface CustomerInvoice {
    id: string;
    folio_number: string;
    guest_name: string;
    room_number: string;
    balance_minor: number;
    total_charges_minor: number;
    total_payments_minor: number;
    status: string;
    created_at: string;
    aging_days: number;
}

interface BankAccountItem {
    id: string;
    name: string;
    code: string;
    account_number: string;
    currency: string;
    book_balance_minor: number;
    bank_balance_minor: number;
    reconciled: boolean;
    last_reconciled: string;
}

interface RevenueExpenseTrendPoint {
    month: string;
    short_month: string;
    revenue_minor: number;
    expenses_minor: number;
    net_profit_minor: number;
    margin_pct: number;
}

interface DepartmentRevenueShare {
    name: string;
    amount_minor: number;
    percent: number;
    color: string;
    textColor: string;
}

interface ArAgingBracket {
    bracket: string;
    count: number;
    amount_minor: number;
    risk: string;
    badge: string;
}

interface ExpenseCategoryItem {
    category: string;
    amount_minor: number;
    count: number;
    percent: number;
}

interface CashierShift {
    id: string;
    cashier?: { name: string };
    opened_at: string;
    closed_at?: string;
    opening_balance_minor: number;
    cash_payments_minor: number;
    status: string;
}

interface AccountingIndexProps extends PageProps {
    activeTab?: string;
    subType?: string | null;
    reportType?: string | null;
    approvalType?: string | null;
    currentBusinessDate?: string;
    financialYear?: string;
    metrics: {
        today_revenue_minor: number;
        month_revenue_minor: number;
        room_revenue_minor: number;
        room_revenue_today_minor?: number;
        pos_restaurant_revenue_minor: number;
        pos_restaurant_revenue_today_minor?: number;
        pos_grocery_revenue_minor: number;
        pos_grocery_revenue_today_minor?: number;
        other_revenue_minor: number;
        other_revenue_today_minor?: number;
        cash_receipts_month_minor?: number;
        cash_receipts_today_minor?: number;
        today_expenses_minor: number;
        month_expenses_minor: number;
        net_profit_month_minor: number;
        net_margin_pct: number;
        cost_to_income_ratio: number;
        accounts_receivable_minor: number;
        accounts_payable_minor: number;
        cash_on_hand_minor: number;
        total_liquidity_minor: number;
        pending_approvals_count: number;
        hotel?: {
            revenue_month_minor: number;
            revenue_today_minor: number;
            total_rooms: number;
            occupied_rooms: number;
            occupancy_rate: number;
            adr_minor: number;
            revpar_minor: number;
            expenses_month_minor: number;
            operating_profit_minor: number;
            operating_margin_pct: number;
            open_folios_count: number;
            receivables_minor: number;
        };
        supermarket?: {
            revenue_month_minor: number;
            revenue_today_minor: number;
            cogs_month_minor: number;
            gross_profit_minor: number;
            gross_margin_pct: number;
            cost_valuation_minor: number;
            retail_valuation_minor: number;
            total_skus: number;
            low_stock_count: number;
            out_of_stock_count: number;
        };
        restaurant?: {
            revenue_month_minor: number;
            revenue_today_minor: number;
            supplies_cost_minor: number;
            gross_profit_minor: number;
            gross_margin_pct: number;
        };
    };
    revenueExpenseTrend: RevenueExpenseTrendPoint[];
    departmentRevenueContribution: DepartmentRevenueShare[];
    arAging: ArAgingBracket[];
    expenseCategories: ExpenseCategoryItem[];
    accounts: Account[];
    expenses: Expense[];
    pendingExpenses: Expense[];
    customerInvoices: CustomerInvoice[];
    bankAccounts: BankAccountItem[];
    shifts: CashierShift[];
}

export default function AccountingIndex({
    activeTab: initialTab = 'analytics',
    subType,
    reportType,
    approvalType,
    currentBusinessDate = 'Today',
    financialYear = 'Jan 01 - Dec 31, 2026',
    metrics,
    revenueExpenseTrend = [],
    departmentRevenueContribution = [],
    arAging = [],
    expenseCategories = [],
    accounts = [],
    expenses = [],
    pendingExpenses = [],
    customerInvoices = [],
    bankAccounts = [],
    shifts = [],
}: AccountingIndexProps) {
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [departmentFilter, setDepartmentFilter] = useState<'consolidated' | 'hotel' | 'supermarket' | 'restaurant'>('consolidated');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

    const defaultMetrics = {
        today_revenue_minor: 0,
        month_revenue_minor: 0,
        room_revenue_minor: 0,
        room_revenue_today_minor: 0,
        pos_restaurant_revenue_minor: 0,
        pos_restaurant_revenue_today_minor: 0,
        pos_grocery_revenue_minor: 0,
        pos_grocery_revenue_today_minor: 0,
        other_revenue_minor: 0,
        other_revenue_today_minor: 0,
        cash_receipts_month_minor: 0,
        cash_receipts_today_minor: 0,
        today_expenses_minor: 0,
        month_expenses_minor: 0,
        net_profit_month_minor: 0,
        net_margin_pct: 0,
        cost_to_income_ratio: 0,
        accounts_receivable_minor: 0,
        accounts_payable_minor: 0,
        cash_on_hand_minor: 0,
        total_liquidity_minor: 0,
        pending_approvals_count: 0,
    };
    const safeMetrics = { ...defaultMetrics, ...(metrics || {}) };

    // Form 1: New Expense Voucher
    const expenseForm = useForm({
        account_id: accounts.length > 0 ? accounts[0].id : '',
        title: '',
        category: 'utilities',
        vendor_name: '',
        amount_minor: 0,
        payment_method: 'cash' as 'cash' | 'bank_transfer' | 'mpesa',
        expense_date: new Date().toISOString().split('T')[0],
        receipt_reference: '',
        notes: '',
    });

    // Form 2: Quick Journal Entry
    const journalForm = useForm({
        debit_account_id: accounts[0]?.id || '',
        credit_account_id: accounts[1]?.id || '',
        amount_minor: 0,
        description: '',
        entry_date: new Date().toISOString().split('T')[0],
        reference_no: `JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    const formatTsh = (amountMinor: number = 0) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amountMinor / 100);
    };

    const handleExpenseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        expenseForm.post(route('accounting.expenses.store'), {
            preserveScroll: true,
            onSuccess: () => {
                expenseForm.reset();
                setIsExpenseModalOpen(false);
            },
        });
    };

    const handleApproveExpense = (expenseId: string) => {
        router.post(route('accounting.expenses.approve', expenseId), {}, { preserveScroll: true });
    };

    // Filtered Expenses
    const filteredExpenses = useMemo(() => {
        return expenses.filter((exp) => {
            const matchesSearch =
                !searchQuery ||
                exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exp.expense_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (exp.vendor_name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                selectedCategoryFilter === 'all' || exp.category === selectedCategoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [expenses, searchQuery, selectedCategoryFilter]);

    // Maximum trend amount for graph scaling
    const maxTrendAmount = useMemo(() => {
        return Math.max(
            ...revenueExpenseTrend.map((t) => Math.max(t.revenue_minor, t.expenses_minor)),
            100000000
        );
    }, [revenueExpenseTrend]);

    return (
        <AuthenticatedLayout>
            <Head title="Accountant Financial Analytics Dashboard - THE INNS" />

            <div className="w-full max-w-[1600px] mx-auto space-y-5 pb-16 font-sans">
                {/* 1. FINANCIAL EXECUTIVE HEADER & FAST ACTIONS (Slim & Clean) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                            Accountant Financial Analytics Dashboard
                        </h1>
                    </div>

                    {/* Fast Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsExpenseModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                        >
                            <span>Record Expense</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsJournalModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                        >
                            <span>Post Journal</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                        >
                            <span>Export Statements</span>
                        </button>

                        <Link
                            href={route('data-entry.index')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition"
                            title="Bulk import or export expenses using CSV spreadsheet"
                        >
                            <span>CSV Import / Export</span>
                        </Link>
                    </div>
                </div>

                {/* 2. TOP EXECUTIVE FINANCIAL KPI CARDS (CLEAN 5-CARD GRID) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    {/* 1. Total Turnover (MTD Revenue) */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition">
                        <div className="flex items-center justify-between text-blue-600">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Gross Turnover (MTD)</span>
                            
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate" title={formatTsh(safeMetrics.month_revenue_minor)}>
                                {formatTsh(safeMetrics.month_revenue_minor)}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-bold">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Today: {formatTsh(safeMetrics.today_revenue_minor)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Operating Expenses MTD */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-rose-300 transition">
                        <div className="flex items-center justify-between text-rose-600">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Operating Expenses</span>
                            
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight truncate" title={formatTsh(safeMetrics.month_expenses_minor)}>
                                {formatTsh(safeMetrics.month_expenses_minor)}
                            </div>
                            <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-medium">
                                <span>Cost/Income:</span>
                                <span className="font-bold text-rose-600">{safeMetrics.cost_to_income_ratio}%</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Net Operating Profit */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition">
                        <div className="flex items-center justify-between text-emerald-600">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Net Operating Profit</span>
                            
                        </div>
                        <div className="mt-3">
                            <div className={`text-xl sm:text-2xl font-black tracking-tight truncate ${safeMetrics.net_profit_month_minor >= 0 ? 'text-emerald-700' : 'text-rose-600'}`} title={formatTsh(safeMetrics.net_profit_month_minor)}>
                                {formatTsh(safeMetrics.net_profit_month_minor)}
                            </div>
                            <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-medium">
                                <span>Net Margin:</span>
                                <span className="font-bold text-emerald-600">{safeMetrics.net_margin_pct}%</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Liquid Cash & Bank Reserves */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-sky-300 transition">
                        <div className="flex items-center justify-between text-sky-600">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Liquid Cash & Bank</span>
                            
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate" title={formatTsh(safeMetrics.total_liquidity_minor)}>
                                {formatTsh(safeMetrics.total_liquidity_minor)}
                            </div>
                            
                        </div>
                    </div>

                    {/* 5. Working Capital (AR vs AP) */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition">
                        <div className="flex items-center justify-between text-amber-600">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Working Ledger (AR - AP)</span>
                            
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate" title={formatTsh(safeMetrics.accounts_receivable_minor - safeMetrics.accounts_payable_minor)}>
                                {formatTsh(safeMetrics.accounts_receivable_minor - safeMetrics.accounts_payable_minor)}
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                                <span className="text-amber-700 font-bold">AR: {formatTsh(safeMetrics.accounts_receivable_minor)}</span>
                                <span className="text-slate-400 font-medium">AP: {formatTsh(safeMetrics.accounts_payable_minor)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. INTERACTIVE NAVIGATION TABS */}
                <div className="bg-white rounded-2xl p-1.5 border border-slate-200 flex items-center gap-1 overflow-x-auto shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'analytics'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <span>Financial Analytics & Trends</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('transactions')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'transactions'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <span>Transactions & Cashbook ({expenses.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('invoices')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'invoices'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <span>Invoices & AR Aging ({customerInvoices.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('chart_of_accounts')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'chart_of_accounts'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <span>Chart of Accounts & GL ({accounts.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('banking')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'banking'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        
                        <span>Banking & Reconciliation</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'reports'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <span>Financial Statements (P&L / Balance Sheet)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('approvals')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'approvals'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <span>Pending Approvals ({pendingExpenses.length})</span>
                    </button>
                </div>

                {/* 4. TAB CONTENTS */}

                {/* ========================================================================= */}
                {/* TAB 1: FINANCIAL DATA ANALYTICS & TRENDS                                   */}
                {/* ========================================================================= */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* DEPARTMENT ISOLATOR / SEGMENT SWITCHER */}
                        <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => setDepartmentFilter('consolidated')}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                                        departmentFilter === 'consolidated'
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>Consolidated Overview</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDepartmentFilter('hotel')}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                                        departmentFilter === 'hotel'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>Hotel Accommodations (Isolated)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDepartmentFilter('supermarket')}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                                        departmentFilter === 'supermarket'
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>Super / Mini Market (Isolated)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDepartmentFilter('restaurant')}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                                        departmentFilter === 'restaurant'
                                            ? 'bg-amber-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>Restaurant & Bar (F&B)</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {departmentFilter === 'supermarket' && (
                                    <Link
                                        href={route('grocery.index')}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                                    >
                                        <span>Open Supermarket System</span>
                                        </Link>
                                )}

                                {departmentFilter === 'hotel' && (
                                    <Link
                                        href={route('reservations.index')}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                                    >
                                        <span>Room Bookings & Front Desk</span>
                                        </Link>
                                )}
                            </div>
                        </div>

                        {/* ================================================================= */}
                        {/* VIEW A: ISOLATED HOTEL ACCOMMODATIONS                             */}
                        {/* ================================================================= */}
                        {departmentFilter === 'hotel' && (
                            <div className="space-y-6">
                                {/* Hotel Banner (Slim & Clean) */}
                                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                                        Hotel Accommodations Financial Performance
                                    </h3>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link
                                            href={route('housekeeping.index')}
                                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition"
                                        >
                                            Room Status
                                        </Link>
                                        <Link
                                            href={route('reservations.index')}
                                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                                        >
                                            Guest Bookings
                                        </Link>
                                    </div>
                                </div>

                                {/* 4 Hotel Operational KPIs */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Room Revenue MTD</span>
                                        <div className="mt-2">
                                            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                                                {formatTsh(safeMetrics.hotel?.revenue_month_minor || safeMetrics.room_revenue_minor)}
                                            </div>
                                            <span className="text-xs text-emerald-600 font-bold block mt-0.5">
                                                Today: {formatTsh(safeMetrics.hotel?.revenue_today_minor || safeMetrics.room_revenue_today_minor || 0)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Occupancy Rate</span>
                                        <div className="mt-2">
                                            <div className="text-xl sm:text-2xl font-black text-indigo-700">
                                                {safeMetrics.hotel?.occupancy_rate || 0}%
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium block mt-0.5">
                                                {safeMetrics.hotel?.occupied_rooms || 0} / {safeMetrics.hotel?.total_rooms || 0} Rooms In-House
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Average Daily Rate (ADR)</span>
                                        <div className="mt-2">
                                            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                                                {formatTsh(safeMetrics.hotel?.adr_minor || 0)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">RevPAR</span>
                                        <div className="mt-2">
                                            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                                                {formatTsh(safeMetrics.hotel?.revpar_minor || 0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Hotel Detailed Operating Breakdown */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div>
                                                <h4 className="text-base font-extrabold text-slate-900">Lodging Operating Statement</h4>
                                                <p className="text-xs text-slate-500">Room nights turnover vs lodging overheads</p>
                                            </div>
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                                                Margin: {safeMetrics.hotel?.operating_margin_pct || 0}%
                                            </span>
                                        </div>

                                        <div className="space-y-3 text-xs">
                                            <div className="flex justify-between py-2 border-b border-slate-100">
                                                <span className="font-bold text-slate-700">Room Accommodation Turnover</span>
                                                <span className="font-mono font-bold text-blue-700">{formatTsh(safeMetrics.hotel?.revenue_month_minor || safeMetrics.room_revenue_minor)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-slate-100">
                                                <span className="font-bold text-slate-700">Other Lodging Ancillary (Laundry & Tours)</span>
                                                <span className="font-mono font-bold text-slate-800">{formatTsh(safeMetrics.other_revenue_minor)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                                                <span className="font-bold">Lodging Overhead (Housekeeping, Utilities, Maintenance)</span>
                                                <span className="font-mono font-bold">({formatTsh(safeMetrics.hotel?.expenses_month_minor || 0)})</span>
                                            </div>
                                            <div className="flex justify-between py-2.5 bg-slate-50 px-3 rounded-xl font-black text-sm">
                                                <span className="text-slate-900">Net Lodging Operating Profit</span>
                                                <span className="font-mono text-emerald-700">{formatTsh(safeMetrics.hotel?.operating_profit_minor || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                                        <div className="border-b border-slate-100 pb-3">
                                            <h4 className="text-base font-extrabold text-slate-900">Guest Ledger & Open Folios</h4>
                                            <p className="text-xs text-slate-500">In-house customer balances awaiting checkout settlement</p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                                            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Unsettled Guest Ledger (AR)</div>
                                            <div className="text-2xl font-black text-amber-900 font-mono">
                                                {formatTsh(safeMetrics.hotel?.receivables_minor || safeMetrics.accounts_receivable_minor)}
                                            </div>
                                            <p className="text-xs text-amber-700 mt-1">
                                                Accrued across {safeMetrics.hotel?.open_folios_count || customerInvoices.length} active room folios
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('invoices')}
                                            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition text-center"
                                        >
                                            View Customer Open Folios Table
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================================================================= */}
                        {/* VIEW B: ISOLATED SUPERMARKET & MINI MARKET                         */}
                        {/* ================================================================= */}
                        {departmentFilter === 'supermarket' && (
                            <div className="space-y-6">
                                {/* Supermarket Banner (Slim & Clean) */}
                                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                                        Supermarket & Mini Market Financial Analytics
                                    </h3>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link
                                            href={route('grocery.index')}
                                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                                        >
                                            <span>Open Super / Mini Market System</span>
                                        </Link>
                                    </div>
                                </div>

                                {/* 4 Supermarket KPIs */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Retail Sales (MTD)</span>
                                        <div className="mt-2">
                                            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                                                {formatTsh(safeMetrics.supermarket?.revenue_month_minor || safeMetrics.pos_grocery_revenue_minor)}
                                            </div>
                                            <span className="text-xs text-emerald-600 font-bold block mt-0.5">
                                                Today: {formatTsh(safeMetrics.supermarket?.revenue_today_minor || safeMetrics.pos_grocery_revenue_today_minor || 0)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Cost of Goods Sold (COGS)</span>
                                        <div className="mt-2">
                                            <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
                                                {formatTsh(safeMetrics.supermarket?.cogs_month_minor || 0)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Gross Retail Profit</span>
                                        <div className="mt-2">
                                            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                                                {formatTsh(safeMetrics.supermarket?.gross_profit_minor || 0)}
                                            </div>
                                            <span className="text-xs text-emerald-600 font-bold block mt-0.5">
                                                {safeMetrics.supermarket?.gross_margin_pct || 0}% Gross Retail Margin
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Inventory Valuation</span>
                                        <div className="mt-2">
                                            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                                                {formatTsh(safeMetrics.supermarket?.retail_valuation_minor || 0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Supermarket Operational Breakdown */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                                        <div className="border-b border-slate-100 pb-3">
                                            <h4 className="text-base font-extrabold text-slate-900">Inventory Catalog Health</h4>
                                            <p className="text-xs text-slate-500">Active retail products and shelf replenishment alerts</p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                                <div className="text-xl font-black text-slate-900">{safeMetrics.supermarket?.total_skus || 0}</div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Total SKUs</div>
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                                                <div className="text-xl font-black text-amber-800">{safeMetrics.supermarket?.low_stock_count || 0}</div>
                                                <div className="text-[10px] font-bold text-amber-700 uppercase mt-0.5">Low Stock</div>
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                                                <div className="text-xl font-black text-rose-800">{safeMetrics.supermarket?.out_of_stock_count || 0}</div>
                                                <div className="text-[10px] font-bold text-rose-700 uppercase mt-0.5">Out of Stock</div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Link
                                                href={route('grocery.index')}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition"
                                            >
                                                <span>Manage Inventory & Restock Catalog</span>
                                                </Link>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                                        <div className="border-b border-slate-100 pb-3">
                                            <h4 className="text-base font-extrabold text-slate-900">Minimart POS & Counter Sales</h4>
                                            <p className="text-xs text-slate-500">Point of sale cashier till and customer order settlements</p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="font-bold text-slate-600">POS Outlet Type:</span>
                                                <span className="font-semibold text-slate-900">Grocery / Minimart Counter</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold text-slate-600">Payment Modes Accepted:</span>
                                                <span className="font-semibold text-slate-900">Cash, M-Pesa, Room Charge Folio</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold text-slate-600">Thermal Receipt Size:</span>
                                                <span className="font-semibold text-slate-900">80mm ESC/POS Standard</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={route('grocery.index')}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                                        >
                                            
                                            <span>Launch Supermarket POS Register</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================================================================= */}
                        {/* VIEW C: ISOLATED RESTAURANT & BAR (F&B)                           */}
                        {/* ================================================================= */}
                        {departmentFilter === 'restaurant' && (
                            <div className="space-y-6">
                                {/* Restaurant Banner (Slim & Clean) */}
                                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                                        Restaurant & Bar Financial Analytics
                                    </h3>
                                    <Link
                                        href={route('restaurant.index')}
                                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                                    >
                                        <span>Launch Restaurant POS</span>
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Dining Revenue MTD</span>
                                        <div className="mt-2">
                                            <div className="text-2xl font-black text-slate-900 font-mono">
                                                {formatTsh(safeMetrics.restaurant?.revenue_month_minor || safeMetrics.pos_restaurant_revenue_minor)}
                                            </div>
                                            <span className="text-xs text-emerald-600 font-bold block mt-0.5">
                                                Today: {formatTsh(safeMetrics.restaurant?.revenue_today_minor || safeMetrics.pos_restaurant_revenue_today_minor || 0)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Kitchen Food Supplies Cost</span>
                                        <div className="mt-2">
                                            <div className="text-2xl font-black text-rose-700 font-mono">
                                                {formatTsh(safeMetrics.restaurant?.supplies_cost_minor || 0)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">F&B Gross Margin</span>
                                        <div className="mt-2">
                                            <div className="text-2xl font-black text-emerald-700 font-mono">
                                                {formatTsh(safeMetrics.restaurant?.gross_profit_minor || 0)}
                                            </div>
                                            <span className="text-xs text-emerald-600 font-bold block mt-0.5">
                                                {safeMetrics.restaurant?.gross_margin_pct || 0}% Culinary Margin
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================================================================= */}
                        {/* VIEW D: CONSOLIDATED EXECUTIVE OVERVIEW                           */}
                        {/* ================================================================= */}
                        {departmentFilter === 'consolidated' && (
                            <>
                                {/* Row 1: Revenue vs Expense Trend Chart (8 cols) + Department Share (4 cols) */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    {/* Monthly Trend Chart */}
                                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                                Revenue, Operating Expenses & Profitability Trend
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded-md bg-blue-600" />
                                                    <span className="text-slate-600 font-semibold">Revenue</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded-md bg-rose-500" />
                                                    <span className="text-slate-600 font-semibold">Expenses</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded-md bg-emerald-500" />
                                                    <span className="text-slate-600 font-semibold">Net Profit</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual Bar Chart */}
                                        <div className="pt-4 space-y-5">
                                            <div className="grid grid-cols-6 gap-3 sm:gap-4 h-60 items-end border-b border-slate-200 pb-2">
                                                {revenueExpenseTrend.map((t) => {
                                                    const revHeight = maxTrendAmount > 0 ? (t.revenue_minor / maxTrendAmount) * 100 : 0;
                                                    const expHeight = maxTrendAmount > 0 ? (t.expenses_minor / maxTrendAmount) * 100 : 0;
                                                    const profHeight = maxTrendAmount > 0 ? Math.max(0, (t.net_profit_minor / maxTrendAmount) * 100) : 0;

                                                    return (
                                                        <div key={t.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                                                            <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-48">
                                                                {/* Revenue Bar */}
                                                                <div
                                                                    className="w-3 sm:w-4 bg-blue-600 rounded-t-md transition-all group-hover:bg-blue-700"
                                                                    style={{ height: `${Math.max(6, revHeight)}%` }}
                                                                    title={`Revenue: ${formatTsh(t.revenue_minor)}`}
                                                                />
                                                                {/* Expense Bar */}
                                                                <div
                                                                    className="w-3 sm:w-4 bg-rose-500 rounded-t-md transition-all group-hover:bg-rose-600"
                                                                    style={{ height: `${Math.max(6, expHeight)}%` }}
                                                                    title={`Expenses: ${formatTsh(t.expenses_minor)}`}
                                                                />
                                                                {/* Net Profit Bar */}
                                                                <div
                                                                    className="w-3 sm:w-4 bg-emerald-500 rounded-t-md transition-all group-hover:bg-emerald-600"
                                                                    style={{ height: `${Math.max(6, profHeight)}%` }}
                                                                    title={`Net Profit: ${formatTsh(t.net_profit_minor)} (${t.margin_pct}%)`}
                                                                />
                                                            </div>
                                                            <div className="text-[11px] font-bold text-slate-700 truncate text-center">
                                                                {t.short_month}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Monthly Summary Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="text-slate-400 font-bold uppercase text-[10px]">
                                                            <th className="py-2">Month</th>
                                                            <th className="py-2 text-right">Revenue</th>
                                                            <th className="py-2 text-right">Expenses</th>
                                                            <th className="py-2 text-right">Net Profit</th>
                                                            <th className="py-2 text-right">Margin %</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {revenueExpenseTrend.map((row) => (
                                                            <tr key={row.month} className="hover:bg-slate-50 transition">
                                                                <td className="py-2 font-bold text-slate-800">{row.month}</td>
                                                                <td className="py-2 text-right font-mono font-bold text-blue-700">{formatTsh(row.revenue_minor)}</td>
                                                                <td className="py-2 text-right font-mono text-rose-600">{formatTsh(row.expenses_minor)}</td>
                                                                <td className="py-2 text-right font-mono font-bold text-emerald-600">{formatTsh(row.net_profit_minor)}</td>
                                                                <td className="py-2 text-right font-bold text-slate-700">{row.margin_pct}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Departmental Revenue Share */}
                                    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                                        <div className="border-b border-slate-100 pb-3">
                                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                                Department Revenue Contribution
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Income stream distribution across hotel divisions
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            {departmentRevenueContribution.map((dept) => (
                                                <div key={dept.name} className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-slate-800">{dept.name}</span>
                                                        <span className="font-mono font-bold text-slate-900">{formatTsh(dept.amount_minor)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${dept.color} transition-all duration-500`}
                                                                style={{ width: `${dept.percent}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-[11px] font-black w-10 text-right ${dept.textColor}`}>
                                                            {dept.percent}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Combined Revenue</div>
                                                <div className="text-xl font-black text-slate-900">{formatTsh(safeMetrics.month_revenue_minor)}</div>
                                                <p className="text-[10px] text-slate-400">All property divisions consolidated</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Accounts Receivable Aging (6 cols) + Expense Distribution (6 cols) */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    {/* AR Aging Schedule */}
                                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                                    Accounts Receivable (AR) Aging Analysis
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Outstanding customer balances categorized by age of debt
                                                </p>
                                            </div>
                                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                                                Total: {formatTsh(safeMetrics.accounts_receivable_minor)}
                                            </span>
                                        </div>

                                        <div className="space-y-3 pt-1">
                                            {arAging.map((bracket) => (
                                                <div key={bracket.bracket} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800">{bracket.bracket}</div>
                                                        <div className="text-[10px] text-slate-400">{bracket.count} active accounts</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-mono font-black text-slate-900">{formatTsh(bracket.amount_minor)}</div>
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-0.5 ${bracket.badge}`}>
                                                            {bracket.risk} Risk
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Expense Category Breakdown */}
                                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                                    Operating Expenses by Category
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Cost allocation across property operational cost centers
                                                </p>
                                            </div>
                                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
                                                Total: {formatTsh(safeMetrics.month_expenses_minor)}
                                            </span>
                                        </div>

                                        <div className="space-y-3 pt-1">
                                            {expenseCategories.length === 0 ? (
                                                <div className="py-8 text-center text-slate-400 text-xs">
                                                    No recorded operating expenses for this period.
                                                </div>
                                            ) : (
                                                expenseCategories.map((cat) => (
                                                    <div key={cat.category} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800">{cat.category}</div>
                                                            <div className="text-[10px] text-slate-400">{cat.count} vouchers posted</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-mono font-black text-rose-700">{formatTsh(cat.amount_minor)}</div>
                                                            <span className="text-[10px] font-bold text-slate-500">{cat.percent}% of total</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: TRANSACTIONS & CASHBOOK                                            */}
                {/* ========================================================================= */}
                {activeTab === 'transactions' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Financial Transactions & Expense Vouchers
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Comprehensive ledger log of operational disbursements, receipts, and vouchers
                                </p>
                            </div>

                            {/* Search and Category Filter */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search voucher or vendor..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <select
                                    value={selectedCategoryFilter}
                                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                    className="text-xs border border-slate-200 rounded-xl py-1.5 px-3 focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="utilities">Utilities</option>
                                    <option value="supplies">Food & Supplies</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="payroll">Payroll</option>
                                    <option value="marketing">Marketing</option>
                                </select>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                        <th className="py-2.5 px-3">Voucher #</th>
                                        <th className="py-2.5 px-3">Title & Vendor</th>
                                        <th className="py-2.5 px-3">Category</th>
                                        <th className="py-2.5 px-3">Date</th>
                                        <th className="py-2.5 px-3">Method</th>
                                        <th className="py-2.5 px-3 text-right">Amount</th>
                                        <th className="py-2.5 px-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400">
                                                No financial transactions found matching the filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExpenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{exp.expense_number}</td>
                                                <td className="py-2.5 px-3">
                                                    <div className="font-bold text-slate-900">{exp.title}</div>
                                                    <div className="text-[10px] text-slate-400">{exp.vendor_name || 'Direct Disbursement'}</div>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600 font-mono">{exp.expense_date}</td>
                                                <td className="py-2.5 px-3 text-slate-600 uppercase font-bold text-[10px]">{exp.payment_method}</td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                                                    -{formatTsh(exp.amount_minor)}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        exp.status === 'paid' || exp.status === 'approved'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {exp.status}
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

                {/* ========================================================================= */}
                {/* TAB 3: INVOICES & ACCOUNTS RECEIVABLE (AR)                                 */}
                {/* ========================================================================= */}
                {activeTab === 'invoices' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Customer Invoices & Open Guest Folios (AR Ledger)
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Direct guest folios with pending balances, days outstanding, and settlement tracking
                                </p>
                            </div>
                            <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">
                                Total Receivables: {formatTsh(safeMetrics.accounts_receivable_minor)}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                        <th className="py-2.5 px-3">Folio #</th>
                                        <th className="py-2.5 px-3">Guest Name</th>
                                        <th className="py-2.5 px-3">Room</th>
                                        <th className="py-2.5 px-3">Date Opened</th>
                                        <th className="py-2.5 px-3 text-center">Aging</th>
                                        <th className="py-2.5 px-3 text-right">Total Charges</th>
                                        <th className="py-2.5 px-3 text-right">Balance Due</th>
                                        <th className="py-2.5 px-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {customerInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-slate-400">
                                                No open customer invoices or unsettled guest folios found.
                                            </td>
                                        </tr>
                                    ) : (
                                        customerInvoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-slate-50 transition">
                                                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{inv.folio_number}</td>
                                                <td className="py-2.5 px-3 font-bold text-slate-900">{inv.guest_name}</td>
                                                <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{inv.room_number}</td>
                                                <td className="py-2.5 px-3 text-slate-500">{inv.created_at}</td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        inv.aging_days <= 30
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : inv.aging_days <= 60
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        {inv.aging_days} Days
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatTsh(inv.total_charges_minor)}</td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">{formatTsh(inv.balance_minor)}</td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <Link
                                                        href={route('folios.show', inv.id)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition"
                                                    >
                                                        <Eye className="w-3 h-3 text-slate-500" />
                                                        <span>View Folio</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 4: CHART OF ACCOUNTS & GENERAL LEDGER                                 */}
                {/* ========================================================================= */}
                {activeTab === 'chart_of_accounts' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Hotel Standard Chart of Accounts (COA)
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Double-entry accounting general ledger accounts structure
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-600">
                                {accounts.length} Active Accounts
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                        <th className="py-2.5 px-3">Account Code</th>
                                        <th className="py-2.5 px-3">Account Name</th>
                                        <th className="py-2.5 px-3">Type</th>
                                        <th className="py-2.5 px-3">Category</th>
                                        <th className="py-2.5 px-3 text-right">Balance</th>
                                        <th className="py-2.5 px-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {accounts.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{acc.code || '—'}</td>
                                            <td className="py-2.5 px-3 font-bold text-slate-900">{acc.name}</td>
                                            <td className="py-2.5 px-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    acc.type === 'revenue'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : acc.type === 'expense'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : acc.type === 'asset'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {acc.type}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600 font-medium">{acc.category || '—'}</td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                                {formatTsh(acc.balance_minor || 0)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 5: BANKING & RECONCILIATION                                           */}
                {/* ========================================================================= */}
                {activeTab === 'banking' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {bankAccounts.map((b) => (
                                <div key={b.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                                            <CheckCheck className="w-3 h-3" /> Reconciled
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">{b.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{b.account_number}</div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Book Balance</div>
                                        <div className="text-lg font-black text-slate-900 mt-0.5">{formatTsh(b.book_balance_minor)}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">Reconciled: {b.last_reconciled}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cashier Shift Reconciliation */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Cashier Shifts & Cash Reconciliation
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Opening and closing cash drawer reconciliations across front desk and outlet POS tills
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                            <th className="py-2.5 px-3">Shift ID</th>
                                            <th className="py-2.5 px-3">Cashier</th>
                                            <th className="py-2.5 px-3">Opened At</th>
                                            <th className="py-2.5 px-3">Closed At</th>
                                            <th className="py-2.5 px-3 text-right">Opening Float</th>
                                            <th className="py-2.5 px-3 text-right">Cash Received</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {shifts.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-slate-400">
                                                    No cashier shift records logged.
                                                </td>
                                            </tr>
                                        ) : (
                                            shifts.map((s) => (
                                                <tr key={s.id} className="hover:bg-slate-50 transition">
                                                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">#{s.id.substring(0, 8)}</td>
                                                    <td className="py-2.5 px-3 font-bold text-slate-900">{s.cashier?.name || 'Staff'}</td>
                                                    <td className="py-2.5 px-3 text-slate-500">{s.opened_at}</td>
                                                    <td className="py-2.5 px-3 text-slate-500">{s.closed_at || 'Active'}</td>
                                                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatTsh(s.opening_balance_minor)}</td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">{formatTsh(s.cash_payments_minor)}</td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            s.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {s.status}
                                                        </span>
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

                {/* ========================================================================= */}
                {/* TAB 6: FINANCIAL STATEMENTS (P&L / BALANCE SHEET)                         */}
                {/* ========================================================================= */}
                {activeTab === 'reports' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
                        <div className="text-center border-b border-slate-100 pb-5 space-y-1">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">THE INNS HOTEL MANAGEMENT</span>
                            <h2 className="text-2xl font-black text-slate-900">Income Statement (Profit & Loss)</h2>
                            <p className="text-xs text-slate-500">For the period ended {currentBusinessDate} • Currency: TZS</p>
                        </div>

                        {/* Statement Body */}
                        <div className="max-w-3xl mx-auto space-y-6 text-sm">
                            {/* 1. Operating Revenue */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between font-black text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider text-xs">
                                    <span>Operating Revenue (Turnover)</span>
                                    <span>Amount (TZS)</span>
                                </div>
                                <div className="flex justify-between py-1 text-slate-700 pl-4">
                                    <span>Room Accommodation Sales</span>
                                    <span className="font-mono">{formatTsh(safeMetrics.room_revenue_minor)}</span>
                                </div>
                                <div className="flex justify-between py-1 text-slate-700 pl-4">
                                    <span>Restaurant & Bar Food/Beverage</span>
                                    <span className="font-mono">{formatTsh(safeMetrics.pos_restaurant_revenue_minor)}</span>
                                </div>
                                <div className="flex justify-between py-1 text-slate-700 pl-4">
                                    <span>Grocery Minimart & Sundries</span>
                                    <span className="font-mono">{formatTsh(safeMetrics.pos_grocery_revenue_minor)}</span>
                                </div>
                                <div className="flex justify-between py-1 text-slate-700 pl-4">
                                    <span>Other Guest Services & Laundry</span>
                                    <span className="font-mono">{formatTsh(safeMetrics.other_revenue_minor)}</span>
                                </div>
                                <div className="flex justify-between py-2 font-black text-blue-700 border-t border-slate-200">
                                    <span>Total Operating Revenue</span>
                                    <span className="font-mono text-base">{formatTsh(safeMetrics.month_revenue_minor)}</span>
                                </div>
                            </div>

                            {/* 2. Operating Expenses */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between font-black text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider text-xs">
                                    <span>Operating Expenses & Overhead</span>
                                    <span>Amount (TZS)</span>
                                </div>
                                {expenseCategories.map((c) => (
                                    <div key={c.category} className="flex justify-between py-1 text-slate-700 pl-4">
                                        <span>{c.category}</span>
                                        <span className="font-mono">{formatTsh(c.amount_minor)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between py-2 font-black text-rose-700 border-t border-slate-200">
                                    <span>Total Operating Expenses</span>
                                    <span className="font-mono text-base">({formatTsh(safeMetrics.month_expenses_minor)})</span>
                                </div>
                            </div>

                            {/* 3. Net Operating Surplus */}
                            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Net Operating Profit / Surplus</div>
                                    <div className="text-xs text-slate-400">Net Margin: {safeMetrics.net_margin_pct}%</div>
                                </div>
                                <div className="text-2xl font-black font-mono text-emerald-400">
                                    {formatTsh(safeMetrics.net_profit_month_minor)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 7: APPROVALS QUEUE                                                    */}
                {/* ========================================================================= */}
                {activeTab === 'approvals' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Financial Approvals & Sign-off Queue
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Expenses and disbursements requiring management confirmation before ledger posting
                                </p>
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800">
                                {pendingExpenses.length} Pending
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                        <th className="py-2.5 px-3">Voucher #</th>
                                        <th className="py-2.5 px-3">Title & Purpose</th>
                                        <th className="py-2.5 px-3">Category</th>
                                        <th className="py-2.5 px-3">Vendor / Beneficiary</th>
                                        <th className="py-2.5 px-3">Requested By</th>
                                        <th className="py-2.5 px-3 text-right">Amount</th>
                                        <th className="py-2.5 px-3 text-right">Decision</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400">
                                                No financial items currently pending approval.
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingExpenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-slate-50 transition">
                                                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{exp.expense_number}</td>
                                                <td className="py-2.5 px-3 font-bold text-slate-900">{exp.title}</td>
                                                <td className="py-2.5 px-3 text-slate-600">{exp.category}</td>
                                                <td className="py-2.5 px-3 text-slate-600">{exp.vendor_name || 'Internal'}</td>
                                                <td className="py-2.5 px-3 text-slate-600">{exp.creator?.name || 'Staff'}</td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">{formatTsh(exp.amount_minor)}</td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApproveExpense(exp.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Approve</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MODAL 1: NEW EXPENSE VOUCHER */}
                {isExpenseModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-base font-extrabold text-slate-900">Record New Expense Voucher</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsExpenseModalOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Expense Title / Description *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Electricity bill token recharge"
                                        value={expenseForm.data.title}
                                        onChange={(e) => expenseForm.setData('title', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Category *</label>
                                        <select
                                            value={expenseForm.data.category}
                                            onChange={(e) => expenseForm.setData('category', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                        >
                                            <option value="utilities">Utilities (Water & Power)</option>
                                            <option value="supplies">Kitchen & F&B Supplies</option>
                                            <option value="maintenance">Repairs & Maintenance</option>
                                            <option value="payroll">Staff Advances / Payroll</option>
                                            <option value="marketing">Marketing & Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">GL Account</label>
                                        <select
                                            value={expenseForm.data.account_id}
                                            onChange={(e) => expenseForm.setData('account_id', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                        >
                                            {accounts.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.code} - {a.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Amount (TZS) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="100"
                                            placeholder="50000"
                                            value={expenseForm.data.amount_minor / 100 || ''}
                                            onChange={(e) => expenseForm.setData('amount_minor', Math.round(Number(e.target.value) * 100))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                                        <select
                                            value={expenseForm.data.payment_method}
                                            onChange={(e) => expenseForm.setData('payment_method', e.target.value as any)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                        >
                                            <option value="cash">Cash Till</option>
                                            <option value="bank_transfer">Bank Transfer (CRDB/NMB)</option>
                                            <option value="mpesa">Mobile Money (M-Pesa)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Vendor / Beneficiary</label>
                                        <input
                                            type="text"
                                            placeholder="TANESCO / Local Supplier"
                                            value={expenseForm.data.vendor_name}
                                            onChange={(e) => expenseForm.setData('vendor_name', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Receipt Reference #</label>
                                        <input
                                            type="text"
                                            placeholder="REC-88410"
                                            value={expenseForm.data.receipt_reference}
                                            onChange={(e) => expenseForm.setData('receipt_reference', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsExpenseModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={expenseForm.processing}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
                                    >
                                        Post Voucher
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 2: QUICK JOURNAL ENTRY */}
                {isJournalModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-base font-extrabold text-slate-900">Post General Ledger Journal Entry</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsJournalModalOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); setIsJournalModalOpen(false); }} className="space-y-3 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Journal Reference #</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={journalForm.data.reference_no}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-700"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Debit Account (+)</label>
                                    <select
                                        value={journalForm.data.debit_account_id}
                                        onChange={(e) => journalForm.setData('debit_account_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                    >
                                        {accounts.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.code} - {a.name} ({a.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Credit Account (-)</label>
                                    <select
                                        value={journalForm.data.credit_account_id}
                                        onChange={(e) => journalForm.setData('credit_account_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                    >
                                        {accounts.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.code} - {a.name} ({a.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Amount (TZS)</label>
                                    <input
                                        type="number"
                                        placeholder="100000"
                                        value={journalForm.data.amount_minor / 100 || ''}
                                        onChange={(e) => journalForm.setData('amount_minor', Math.round(Number(e.target.value) * 100))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Narration / Memo</label>
                                    <textarea
                                        placeholder="Reason for adjustment / journal posting"
                                        value={journalForm.data.description}
                                        onChange={(e) => journalForm.setData('description', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                                        rows={2}
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsJournalModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                                    >
                                        Post Journal Entry
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
