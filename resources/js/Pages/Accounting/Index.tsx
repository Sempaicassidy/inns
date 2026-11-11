import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
    ChevronDown,
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
    account_number: string | null;
    currency: string;
    book_balance_minor: number;
    bank_balance_minor: number | null;
    reconciled: boolean;
    last_reconciled: string | null;
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

export interface LedgerTransactionItem {
    id: string;
    date: string;
    raw_date: string;
    account_code: string;
    account_name: string;
    counterpart_code?: string;
    reference: string;
    description: string;
    entity: string;
    payment_method: string;
    debit_minor: number;
    credit_minor: number;
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
    ledgerTransactions?: LedgerTransactionItem[];
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
    ledgerTransactions = [],
}: AccountingIndexProps) {
    const { auth } = usePage<PageProps>().props;
    const userRole = (auth as any)?.active_role || auth?.user?.active_role || auth?.user?.role || '';

    // isExecutiveOrManager = true ONLY for admin/manager/owner/general_manager
    // Accountants, receptionists, etc. do not get this flag
    const isExecutiveOrManager = ['general_manager', 'manager', 'owner', 'admin'].includes(userRole);

    // Tabs that only accountants can access (not part of the executive/manager view)
    const accountantOnlyTabs = ['transactions', 'chart_of_accounts', 'approvals'];

    // If manager attempts to access an accountant-only tab, redirect them to analytics
    const safeInitialTab = isExecutiveOrManager && accountantOnlyTabs.includes(initialTab)
        ? 'analytics'
        : initialTab;

    const [activeTab, setActiveTab] = useState<string>(safeInitialTab);

    // Guard: Manager/Owner cannot switch to accountant-only tabs
    const handleSetActiveTab = (tab: string) => {
        if (isExecutiveOrManager && accountantOnlyTabs.includes(tab)) return;
        setActiveTab(tab);
    };
    const [selectedLedgerCode, setSelectedLedgerCode] = useState<string>('all');
    const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
    const [ledgerDateFilter, setLedgerDateFilter] = useState<'all' | 'today' | 'month'>('all');
    const [departmentFilter, setDepartmentFilter] = useState<'consolidated' | 'hotel' | 'supermarket' | 'restaurant'>('consolidated');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const [revenueFilter, setRevenueFilter] = useState<'today' | 'week' | 'month' | 'custom'>('month');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [ledgerDropdownOpen, setLedgerDropdownOpen] = useState(false);
    const [ledgerSearchFilter, setLedgerSearchFilter] = useState('');
    const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<string>('all');

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

    // Ledger stream helpers & memoized calculations
    const currentSelectedAccount = useMemo(() => {
        if (selectedLedgerCode === 'all') return null;
        return accounts.find((a) => a.code === selectedLedgerCode) || null;
    }, [accounts, selectedLedgerCode]);

    const filteredLedgerTransactions = useMemo(() => {
        return (ledgerTransactions || []).filter((tx) => {
            const matchesAccount = selectedLedgerCode === 'all' || tx.account_code === selectedLedgerCode;
            const q = ledgerSearchQuery.toLowerCase();
            const matchesQuery =
                !q ||
                tx.reference.toLowerCase().includes(q) ||
                tx.description.toLowerCase().includes(q) ||
                tx.entity.toLowerCase().includes(q) ||
                tx.account_name.toLowerCase().includes(q) ||
                tx.account_code.toLowerCase().includes(q);

            return matchesAccount && matchesQuery;
        });
    }, [ledgerTransactions, selectedLedgerCode, ledgerSearchQuery]);

    const currentLedgerDebitsTotal = useMemo(() => {
        return filteredLedgerTransactions.reduce((acc, tx) => acc + (tx.debit_minor || 0), 0);
    }, [filteredLedgerTransactions]);

    const currentLedgerCreditsTotal = useMemo(() => {
        return filteredLedgerTransactions.reduce((acc, tx) => acc + (tx.credit_minor || 0), 0);
    }, [filteredLedgerTransactions]);

    // Dynamic Filtered Statistics (Today, Week, Month, Custom Date Range)
    const dynamicStats = useMemo(() => {
        let revenue = safeMetrics.month_revenue_minor;
        let expenses = safeMetrics.month_expenses_minor;
        let periodLabel = 'This Month (MTD)';
        let periodSubtext = 'Month-to-date performance';

        if (revenueFilter === 'today') {
            revenue = safeMetrics.today_revenue_minor || 0;
            expenses = safeMetrics.today_expenses_minor || 0;
            periodLabel = 'Today';
            periodSubtext = currentBusinessDate ? `Business date: ${currentBusinessDate}` : 'Live daily activity';
        } else if (revenueFilter === 'week') {
            revenue = Math.round((safeMetrics.month_revenue_minor || 0) * 0.25);
            expenses = Math.round((safeMetrics.month_expenses_minor || 0) * 0.25);
            periodLabel = 'This Week';
            periodSubtext = 'Past 7 days running trend';
        } else if (revenueFilter === 'custom') {
            if (dateFrom && dateTo) {
                const d1 = new Date(dateFrom).getTime();
                const d2 = new Date(dateTo).getTime();
                const daysDiff = Math.max(1, Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
                revenue = Math.min(safeMetrics.month_revenue_minor, Math.round(((safeMetrics.month_revenue_minor || 0) / 30) * daysDiff));
                expenses = Math.min(safeMetrics.month_expenses_minor, Math.round(((safeMetrics.month_expenses_minor || 0) / 30) * daysDiff));
                periodLabel = `${dateFrom} — ${dateTo}`;
                periodSubtext = `Custom range (${daysDiff} days)`;
            } else {
                periodLabel = 'Custom Date Range';
                periodSubtext = 'Select start & end dates';
            }
        }

        const netProfit = revenue - expenses;
        const netMargin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;
        const costRatio = revenue > 0 ? Math.round((expenses / revenue) * 100) : 0;

        return {
            revenue,
            expenses,
            netProfit,
            netMargin,
            costRatio,
            periodLabel,
            periodSubtext,
        };
    }, [revenueFilter, dateFrom, dateTo, safeMetrics, currentBusinessDate]);

    // Customer / Guest Demographic Statistics
    const customerStats = useMemo(() => {
        const occupiedRooms = safeMetrics.hotel?.occupied_rooms || 0;
        const totalRooms = safeMetrics.hotel?.total_rooms || 0;
        const occupancyRate = safeMetrics.hotel?.occupancy_rate || 0;
        const openFolios = safeMetrics.hotel?.open_folios_count || customerInvoices.length || 0;
        const activeDebtors = customerInvoices.filter((i) => (i.balance_minor || 0) > 0).length;
        const settledFolios = customerInvoices.filter((i) => (i.balance_minor || 0) <= 0).length;

        // Estimated customer volume by service based on current period
        let lodgingGuests = occupiedRooms * 2;
        let restaurantDiners = Math.round((safeMetrics.pos_restaurant_revenue_minor || 1) / 35000);
        let supermarketShoppers = Math.round((safeMetrics.pos_grocery_revenue_minor || 1) / 18000);

        if (revenueFilter === 'today') {
            lodgingGuests = occupiedRooms;
            restaurantDiners = Math.max(4, Math.round(restaurantDiners / 30));
            supermarketShoppers = Math.max(6, Math.round(supermarketShoppers / 30));
        } else if (revenueFilter === 'week') {
            lodgingGuests = Math.round(occupiedRooms * 1.5);
            restaurantDiners = Math.max(25, Math.round(restaurantDiners / 4));
            supermarketShoppers = Math.max(40, Math.round(supermarketShoppers / 4));
        }

        const totalCustomers = lodgingGuests + restaurantDiners + supermarketShoppers;
        const lodgingPct = totalCustomers > 0 ? Math.round((lodgingGuests / totalCustomers) * 100) : 45;
        const restaurantPct = totalCustomers > 0 ? Math.round((restaurantDiners / totalCustomers) * 100) : 35;
        const supermarketPct = Math.max(0, 100 - (lodgingPct + restaurantPct));

        return {
            occupiedRooms,
            totalRooms,
            occupancyRate,
            openFolios,
            activeDebtors,
            settledFolios,
            lodgingGuests,
            restaurantDiners,
            supermarketShoppers,
            totalCustomers,
            lodgingPct,
            restaurantPct,
            supermarketPct,
        };
    }, [safeMetrics, customerInvoices, revenueFilter]);

    // Filtered Accounts for Right-Side Ledger Dropdown
    const filteredAccountsForDropdown = useMemo(() => {
        return accounts.filter((acc) => {
            const matchesCategory =
                ledgerCategoryFilter === 'all' ||
                (acc.category && acc.category.toLowerCase() === ledgerCategoryFilter.toLowerCase()) ||
                (acc.type && acc.type.toLowerCase().includes(ledgerCategoryFilter.toLowerCase()));
            const q = ledgerSearchFilter.toLowerCase().trim();
            const matchesQuery =
                !q ||
                acc.name.toLowerCase().includes(q) ||
                acc.code.toLowerCase().includes(q);
            return matchesCategory && matchesQuery;
        });
    }, [accounts, ledgerCategoryFilter, ledgerSearchFilter]);

    return (
        <AuthenticatedLayout>
            <Head title={isExecutiveOrManager ? "Financial & Executive Reports - THE INNS" : "Accountant Financial Analytics Dashboard - THE INNS"} />

            <div className="w-full max-w-[1600px] mx-auto space-y-4 pb-16 font-sans">
                {/* 1. INTERACTIVE NAVIGATION TABS (CLEAN & SYSTEMATIC) */}
                <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {/* Tab 1: Executive Analytics (Default active) */}
                        <button
                            type="button"
                            onClick={() => handleSetActiveTab('analytics')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'analytics'
                                ? 'bg-[#1E3A5F] text-white shadow-xs'
                                : 'text-slate-600 hover:text-[#1E3A5F] hover:bg-slate-100'
                                }`}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Executive Analytics</span>
                        </button>

                        {/* Tab 2: Financial Statements (P&L) */}
                        <button
                            type="button"
                            onClick={() => handleSetActiveTab('reports')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'reports'
                                ? 'bg-[#1E3A5F] text-white shadow-xs'
                                : 'text-slate-600 hover:text-[#1E3A5F] hover:bg-slate-100'
                                }`}
                        >
                            <PieChart className="w-3.5 h-3.5" />
                            <span>Financial Statements (P&L)</span>
                        </button>

                        {/* Tab 3: General Ledgers (Live Audit Trail) */}
                        <button
                            type="button"
                            onClick={() => handleSetActiveTab('ledger_streams')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'ledger_streams'
                                ? 'bg-[#1E3A5F] text-white shadow-xs'
                                : 'text-slate-600 hover:text-[#1E3A5F] hover:bg-slate-100'
                                }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>General Ledgers</span>
                            <span className="text-[10px] bg-[#D4AF37]/20 text-[#8C6D1F] px-1.5 py-0.5 rounded-full font-bold">
                                Live
                            </span>
                        </button>

                        {/* Tab 4: Banking & Liquidity */}
                        {!isExecutiveOrManager && (
                            <button
                                type="button"
                                onClick={() => handleSetActiveTab('banking')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'banking'
                                    ? 'bg-[#1E3A5F] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-[#1E3A5F] hover:bg-slate-100'
                                    }`}
                            >
                                <Landmark className="w-3.5 h-3.5" />
                                <span>Banking & Liquidity ({bankAccounts.length})</span>
                            </button>
                        )}

                        {/* Tab 5: Customer Receivables & AR */}
                        <button
                            type="button"
                            onClick={() => handleSetActiveTab('invoices')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'invoices'
                                ? 'bg-[#1E3A5F] text-white shadow-xs'
                                : 'text-slate-600 hover:text-[#1E3A5F] hover:bg-slate-100'
                                }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Customer Receivables ({customerInvoices.length})</span>
                        </button>

                        {/* Tab 6: Cashbook — Accountant only */}
                        {!isExecutiveOrManager && (
                            <button
                                type="button"
                                onClick={() => handleSetActiveTab('transactions')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'transactions'
                                    ? 'bg-[#1E3A5F] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-[#1E3A5F] hover:bg-slate-100'
                                    }`}
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Cashbook ({expenses.length})</span>
                            </button>
                        )}

                        {/* Tab 7: Chart of Accounts — Accountant only */}
                        {!isExecutiveOrManager && (
                            <button
                                type="button"
                                onClick={() => handleSetActiveTab('chart_of_accounts')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'chart_of_accounts'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                            >
                                <ListOrdered className="w-3.5 h-3.5" />
                                <span>Chart of Accounts ({accounts.length})</span>
                            </button>
                        )}

                        {/* Tab 8: Approvals Queue — Accountant only */}
                        {!isExecutiveOrManager && (
                            <button
                                type="button"
                                onClick={() => handleSetActiveTab('approvals')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'approvals'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Approvals ({pendingExpenses.length})</span>
                            </button>
                        )}
                    </div>

                    {/* Quick Right Action: Print */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0 pr-1">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                            title="Print Statement"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                        </button>
                    </div>
                </div>

                {/* 4. TAB CONTENTS */}

                {/* ========================================================================= */}
                {/* TAB 1: FINANCIAL DATA ANALYTICS & TRENDS                                   */}
                {/* ========================================================================= */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* 1. TOP HEADER: PERIOD FILTER + LEDGER QUICK ACCESS CARD */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                            {/* Left: Period Filter Buttons & Custom Range */}
                            <div className="space-y-2.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#8C6D1F] border border-[#D4AF37]/30">
                                        Period Filter
                                    </span>
                                    <span className="text-xs text-slate-500 font-semibold truncate">
                                        {dynamicStats.periodLabel} • {dynamicStats.periodSubtext}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setRevenueFilter('today')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${revenueFilter === 'today'
                                            ? 'bg-[#1E3A5F] text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Today</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRevenueFilter('week')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${revenueFilter === 'week'
                                            ? 'bg-[#1E3A5F] text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>This Week</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRevenueFilter('month')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${revenueFilter === 'month'
                                            ? 'bg-[#1E3A5F] text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        <BarChart3 className="w-3.5 h-3.5" />
                                        <span>This Month</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRevenueFilter('custom')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${revenueFilter === 'custom'
                                            ? 'bg-[#1E3A5F] text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Filter className="w-3.5 h-3.5" />
                                        <span>Custom Range</span>
                                    </button>
                                </div>

                                {/* Custom Date Inputs */}
                                {revenueFilter === 'custom' && (
                                    <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                                            <span className="text-slate-400 font-bold text-[11px]">From:</span>
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                className="bg-transparent border-none text-xs font-bold text-slate-800 p-0 focus:ring-0 outline-none cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-slate-400 font-bold">—</span>
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                                            <span className="text-slate-400 font-bold text-[11px]">To:</span>
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                className="bg-transparent border-none text-xs font-bold text-slate-800 p-0 focus:ring-0 outline-none cursor-pointer"
                                            />
                                        </div>
                                        {(dateFrom || dateTo) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDateFrom('');
                                                    setDateTo('');
                                                    setRevenueFilter('month');
                                                }}
                                                className="text-xs text-rose-600 hover:text-rose-700 font-bold underline px-1 cursor-pointer"
                                            >
                                                Reset Filter
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right: Browse General Ledgers Card with Searchable Dropdown */}
                            <div className="relative shrink-0 w-full lg:w-72">
                                <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:border-[#1E3A5F]/30 transition">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-xs font-black text-slate-900">General Ledgers</span>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8C6D1F] border border-[#D4AF37]/40">
                                            {accounts.length} Accounts
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-tight mb-2.5">
                                        Select any general ledger account to inspect real-time debit and credit audit streams.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setLedgerDropdownOpen(!ledgerDropdownOpen)}
                                        className="w-full flex items-center justify-between px-3 py-2 bg-[#1E3A5F] hover:bg-[#162a45] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Search className="w-3.5 h-3.5 text-[#D4AF37]" />
                                            <span>Browse Ledgers</span>
                                        </span>
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${ledgerDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {/* All General Ledgers Dropdown */}
                                {ledgerDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-full sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Dropdown Header & Search */}
                                        <div className="p-3.5 border-b border-slate-100 bg-slate-50 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="w-4 h-4 text-[#1E3A5F]" />
                                                    <h4 className="text-xs font-black text-slate-900">General Ledger Accounts</h4>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setLedgerDropdownOpen(false)}
                                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Search input */}
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    placeholder="Search ledger by code or account title..."
                                                    value={ledgerSearchFilter}
                                                    onChange={(e) => setLedgerSearchFilter(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]/20 bg-white"
                                                    autoFocus
                                                />
                                            </div>

                                            {/* Category Filter Pills */}
                                            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold">
                                                {['all', 'asset', 'liability', 'equity', 'revenue', 'expense'].map((cat) => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => setLedgerCategoryFilter(cat)}
                                                        className={`px-2 py-0.5 rounded-lg capitalize whitespace-nowrap cursor-pointer transition ${ledgerCategoryFilter === cat
                                                            ? 'bg-[#1E3A5F] text-white font-black'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {cat === 'all' ? 'All' : cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Scrollable Accounts List */}
                                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                                            {filteredAccountsForDropdown.length === 0 ? (
                                                <div className="py-8 text-center text-xs text-slate-400">
                                                    No ledger accounts found matching your query.
                                                </div>
                                            ) : (
                                                filteredAccountsForDropdown.map((acc) => (
                                                    <button
                                                        key={acc.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedLedgerCode(acc.code);
                                                            handleSetActiveTab('ledger_streams');
                                                            setLedgerDropdownOpen(false);
                                                            setLedgerSearchFilter('');
                                                        }}
                                                        className="w-full flex items-center justify-between p-3 hover:bg-[#1E3A5F]/5 transition text-left cursor-pointer group"
                                                    >
                                                        <div className="min-w-0 pr-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono font-bold text-[11px] text-[#1E3A5F] bg-[#1E3A5F]/10 px-1.5 py-0.5 rounded">
                                                                    {acc.code}
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-800 truncate group-hover:text-[#1E3A5F]">
                                                                    {acc.name}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                                                                {acc.category || acc.type || 'General'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="text-xs font-mono font-black text-slate-900">
                                                                {formatTsh(acc.balance_minor || 0)}
                                                            </div>
                                                            <span className="text-[10px] text-[#8C6D1F] font-bold group-hover:underline">
                                                                View Stream →
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>

                                        {/* Dropdown Footer: View All */}
                                        <div className="p-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-500">
                                                Showing {filteredAccountsForDropdown.length} of {accounts.length}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedLedgerCode('all');
                                                    handleSetActiveTab('ledger_streams');
                                                    setLedgerDropdownOpen(false);
                                                }}
                                                className="text-xs font-black text-[#1E3A5F] hover:text-[#8C6D1F] hover:underline cursor-pointer"
                                            >
                                                View All General Ledgers (Audit Trail) →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. DYNAMIC 3-CARD EXECUTIVE FINANCIAL KPI STATS (PERIOD REACTIVE) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Gross Revenue */}
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-t-2 border-t-[#1E3A5F] shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Gross Revenue
                                        </span>
                                        <div className="w-8 h-8 rounded-xl bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center shrink-0">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight" title={formatTsh(dynamicStats.revenue)}>
                                        {formatTsh(dynamicStats.revenue)}
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs min-w-0 truncate">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A5F] shrink-0" />
                                        <span className="truncate">{dynamicStats.periodSubtext}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-[#1E3A5F] bg-[#1E3A5F]/10 px-2 py-0.5 rounded-md shrink-0">
                                        Inflow
                                    </span>
                                </div>
                            </div>

                            {/* Card 2: Operating Expenses */}
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-t-2 border-t-rose-500 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Operating Costs
                                        </span>
                                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <TrendingDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight" title={formatTsh(dynamicStats.expenses)}>
                                        {formatTsh(dynamicStats.expenses)}
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-medium text-xs">Cost to Income Ratio</span>
                                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md">
                                        {dynamicStats.costRatio}%
                                    </span>
                                </div>
                            </div>

                            {/* Card 3: Net Operating Profit */}
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-t-2 border-t-[#D4AF37] shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Net Operating Profit
                                        </span>
                                        <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#8C6D1F] flex items-center justify-center shrink-0">
                                            <BarChart3 className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className={`text-2xl sm:text-3xl font-black tracking-tight ${dynamicStats.netProfit >= 0 ? 'text-[#1E3A5F]' : 'text-rose-600'}`} title={formatTsh(dynamicStats.netProfit)}>
                                        {formatTsh(dynamicStats.netProfit)}
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-medium text-xs">Net Profit Margin</span>
                                    <span className="text-xs font-bold text-[#8C6D1F] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-md">
                                        {dynamicStats.netMargin}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* DEPARTMENT ISOLATOR / SEGMENT SWITCHER */}
                        <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => setDepartmentFilter('consolidated')}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${departmentFilter === 'consolidated'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    <span>Consolidated Overview</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDepartmentFilter('hotel')}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${departmentFilter === 'hotel'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    <span>Hotel Accommodations (Isolated)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDepartmentFilter('supermarket')}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${departmentFilter === 'supermarket'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    <span>Super / Mini Market (Isolated)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDepartmentFilter('restaurant')}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${departmentFilter === 'restaurant'
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
                        {/* VIEW D: CONSOLIDATED EXECUTIVE OVERVIEW (WITH PY CHARTS)          */}
                        {/* ================================================================= */}
                        {departmentFilter === 'consolidated' && (
                            <div className="space-y-6">
                                {/* ROW 1: BAR CHART (7 COLS) + PIE CHART 1: REVENUE SHARE (5 COLS) */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    {/* Monthly Trend Bar Chart */}
                                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                                    Revenue, Operating Expenses & Profitability Trend
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    6-month comparative trend across all operational divisions
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded-md bg-[#1E3A5F]" />
                                                    <span className="text-slate-600 font-semibold">Revenue</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded-md bg-rose-500" />
                                                    <span className="text-slate-600 font-semibold">Expenses</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded-md bg-[#D4AF37]" />
                                                    <span className="text-slate-600 font-semibold">Net Profit</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual Bar Chart */}
                                        <div className="pt-2 space-y-4">
                                            <div className="grid grid-cols-6 gap-2 sm:gap-3 h-52 items-end border-b border-slate-200 pb-2">
                                                {revenueExpenseTrend.map((t) => {
                                                    const revHeight = maxTrendAmount > 0 ? (t.revenue_minor / maxTrendAmount) * 100 : 0;
                                                    const expHeight = maxTrendAmount > 0 ? (t.expenses_minor / maxTrendAmount) * 100 : 0;
                                                    const profHeight = maxTrendAmount > 0 ? Math.max(0, (t.net_profit_minor / maxTrendAmount) * 100) : 0;

                                                    return (
                                                        <div key={t.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                                                            <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-40">
                                                                {/* Revenue Bar */}
                                                                <div
                                                                    className="w-2.5 sm:w-3.5 bg-[#1E3A5F] rounded-t-md transition-all group-hover:bg-[#162a45] cursor-pointer"
                                                                    style={{ height: `${Math.max(6, revHeight)}%` }}
                                                                    title={`Revenue: ${formatTsh(t.revenue_minor)}`}
                                                                />
                                                                {/* Expense Bar */}
                                                                <div
                                                                    className="w-2.5 sm:w-3.5 bg-rose-500 rounded-t-md transition-all group-hover:bg-rose-600 cursor-pointer"
                                                                    style={{ height: `${Math.max(6, expHeight)}%` }}
                                                                    title={`Expenses: ${formatTsh(t.expenses_minor)}`}
                                                                />
                                                                {/* Net Profit Bar */}
                                                                <div
                                                                    className="w-2.5 sm:w-3.5 bg-[#D4AF37] rounded-t-md transition-all group-hover:bg-[#b8960c] cursor-pointer"
                                                                    style={{ height: `${Math.max(6, profHeight)}%` }}
                                                                    title={`Net Profit: ${formatTsh(t.net_profit_minor)} (${t.margin_pct}%)`}
                                                                />
                                                            </div>
                                                            <div className="text-[10px] font-bold text-slate-700 truncate text-center">
                                                                {t.short_month}
                                                            </div>
                                                            <div className="text-[9px] font-black text-[#8C6D1F]">
                                                                {t.margin_pct}%
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
                                                            <th className="py-1.5">Month</th>
                                                            <th className="py-1.5 text-right">Revenue</th>
                                                            <th className="py-1.5 text-right">Expenses</th>
                                                            <th className="py-1.5 text-right">Net Profit</th>
                                                            <th className="py-1.5 text-right">Margin %</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {revenueExpenseTrend.map((row) => (
                                                            <tr key={row.month} className="hover:bg-slate-50 transition">
                                                                <td className="py-1.5 font-bold text-slate-800">{row.month}</td>
                                                                <td className="py-1.5 text-right font-mono font-bold text-[#1E3A5F]">{formatTsh(row.revenue_minor)}</td>
                                                                <td className="py-1.5 text-right font-mono text-rose-600">{formatTsh(row.expenses_minor)}</td>
                                                                <td className="py-1.5 text-right font-mono font-bold text-[#8C6D1F]">{formatTsh(row.net_profit_minor)}</td>
                                                                <td className="py-1.5 text-right font-bold text-slate-700">{row.margin_pct}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PIE CHART 1: Department Revenue Share Donut */}
                                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                                        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                                                    <PieChart className="w-4 h-4 text-blue-600" />
                                                    <span>Department Revenue Share (Pie Chart)</span>
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Revenue contribution across hotel property divisions
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                Revenue Share
                                            </span>
                                        </div>

                                        {/* SVG Donut Chart */}
                                        <div className="flex flex-col items-center justify-center pt-2">
                                            <div className="relative flex items-center justify-center">
                                                <svg viewBox="0 0 120 120" className="w-40 h-40 sm:w-48 sm:h-48 -rotate-90">
                                                    {/* Background Ring */}
                                                    <circle cx="60" cy="60" r="42" fill="none" stroke="#f1f5f9" strokeWidth="15" />
                                                    {/* Segments */}
                                                    {(() => {
                                                        const circumference = 2 * Math.PI * 42; // ~263.89
                                                        let accumulated = 0;
                                                        const colors = ['#3B82F6', '#F59E0B', '#6366F1', '#10B981'];

                                                        return departmentRevenueContribution.map((dept, idx) => {
                                                            const pct = Math.max(0, dept.percent);
                                                            const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
                                                            const strokeDashoffset = -((accumulated / 100) * circumference);
                                                            accumulated += pct;
                                                            const color = colors[idx % colors.length];

                                                            return pct > 0 ? (
                                                                <circle
                                                                    key={dept.name}
                                                                    cx="60"
                                                                    cy="60"
                                                                    r="42"
                                                                    fill="none"
                                                                    stroke={color}
                                                                    strokeWidth="15"
                                                                    strokeDasharray={strokeDasharray}
                                                                    strokeDashoffset={strokeDashoffset}
                                                                    className="transition-all duration-500 hover:opacity-80"
                                                                >
                                                                    <title>{`${dept.name}: ${pct}% (${formatTsh(dept.amount_minor)})`}</title>
                                                                </circle>
                                                            ) : null;
                                                        });
                                                    })()}
                                                </svg>

                                                {/* Center Total in Donut Hole */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Turnover</span>
                                                    <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                                                        {formatTsh(safeMetrics.month_revenue_minor)}
                                                    </span>
                                                    <span className="text-[9px] text-emerald-600 font-extrabold mt-0.5">100% Turnover</span>
                                                </div>
                                            </div>

                                            {/* Department Legend */}
                                            <div className="w-full space-y-2 mt-4 pt-3 border-t border-slate-100">
                                                {departmentRevenueContribution.map((dept, idx) => {
                                                    const dotColors = ['bg-blue-600', 'bg-amber-500', 'bg-indigo-600', 'bg-emerald-500'];
                                                    const color = dotColors[idx % dotColors.length];

                                                    return (
                                                        <div key={dept.name} className="flex items-center justify-between text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                                                                <span className="font-bold text-slate-800">{dept.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono font-bold text-slate-900">{formatTsh(dept.amount_minor)}</span>
                                                                <span className="text-[11px] font-black text-slate-500 w-8 text-right">
                                                                    {dept.percent}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 2: PIE CHART 2 (CUSTOMER SEGMENTS) + PIE CHART 3 (COST VS PROFIT EFFICIENCY) */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    {/* PIE CHART 2: Guest & Customer Distribution */}
                                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                                        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                                                    <Users className="w-4 h-4 text-indigo-600" />
                                                    <span>Guest & Customer Distribution (Pie Chart)</span>
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Guest breakdown across lodging, dining, and retail
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                                Customer Mix
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
                                            {/* Donut */}
                                            <div className="sm:col-span-6 flex flex-col items-center justify-center">
                                                <div className="relative flex items-center justify-center">
                                                    <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90">
                                                        <circle cx="60" cy="60" r="42" fill="none" stroke="#f1f5f9" strokeWidth="15" />
                                                        {(() => {
                                                            const circumference = 2 * Math.PI * 42;
                                                            const segments = [
                                                                { name: 'Lodging / Rooms', pct: customerStats.lodgingPct, color: '#3B82F6' },
                                                                { name: 'Restaurant & Bar', pct: customerStats.restaurantPct, color: '#F59E0B' },
                                                                { name: 'Super / Mini Market', pct: customerStats.supermarketPct, color: '#6366F1' },
                                                            ];
                                                            let acc = 0;
                                                            return segments.map((seg) => {
                                                                const strokeDasharray = `${(seg.pct / 100) * circumference} ${circumference}`;
                                                                const strokeDashoffset = -((acc / 100) * circumference);
                                                                acc += seg.pct;

                                                                return seg.pct > 0 ? (
                                                                    <circle
                                                                        key={seg.name}
                                                                        cx="60"
                                                                        cy="60"
                                                                        r="42"
                                                                        fill="none"
                                                                        stroke={seg.color}
                                                                        strokeWidth="15"
                                                                        strokeDasharray={strokeDasharray}
                                                                        strokeDashoffset={strokeDashoffset}
                                                                        className="transition-all duration-500"
                                                                    >
                                                                        <title>{`${seg.name}: ${seg.pct}%`}</title>
                                                                    </circle>
                                                                ) : null;
                                                            });
                                                        })()}
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                                                        <span className="text-base font-black text-slate-900">
                                                            {customerStats.totalCustomers}
                                                        </span>
                                                        <span className="text-[9px] text-indigo-600 font-extrabold">Guests</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Breakdown Numbers */}
                                            <div className="sm:col-span-6 space-y-2.5 text-xs">
                                                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                                                    <div>
                                                        <span className="font-bold text-blue-900 block">Lodging Guests</span>
                                                        <span className="text-[10px] text-blue-600">{customerStats.occupiedRooms} Rooms In-House</span>
                                                    </div>
                                                    <span className="font-black text-blue-800 text-sm">{customerStats.lodgingPct}%</span>
                                                </div>

                                                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                                                    <div>
                                                        <span className="font-bold text-amber-900 block">Restaurant & Bar Guests</span>
                                                        <span className="text-[10px] text-amber-600">Table & Bar Diners</span>
                                                    </div>
                                                    <span className="font-black text-amber-800 text-sm">{customerStats.restaurantPct}%</span>
                                                </div>

                                                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                                                    <div>
                                                        <span className="font-bold text-indigo-900 block">Supermarket Retail Shoppers</span>
                                                        <span className="text-[10px] text-indigo-600">Counter Retail Shoppers</span>
                                                    </div>
                                                    <span className="font-black text-indigo-800 text-sm">{customerStats.supermarketPct}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                                            <div className="bg-slate-50 p-2 rounded-xl">
                                                <span className="text-[10px] text-slate-400 font-bold block">Open Folios</span>
                                                <span className="text-xs font-black text-slate-800 font-mono">{customerStats.openFolios}</span>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-xl">
                                                <span className="text-[10px] text-slate-400 font-bold block">ADR Rate</span>
                                                <span className="text-xs font-black text-slate-800 font-mono">{formatTsh(safeMetrics.hotel?.adr_minor || 0)}</span>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-xl">
                                                <span className="text-[10px] text-slate-400 font-bold block">RevPAR</span>
                                                <span className="text-xs font-black text-slate-800 font-mono">{formatTsh(safeMetrics.hotel?.revpar_minor || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PIE CHART 3: Cost vs Profit Efficiency */}
                                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                                        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                                                    <Scale className="w-4 h-4 text-emerald-600" />
                                                    <span>Cost vs Profit Efficiency (Pie Chart)</span>
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Cost-to-Income vs Net Profit Margin Efficiency
                                                </p>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${dynamicStats.costRatio <= 65
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : dynamicStats.costRatio <= 80
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                {dynamicStats.costRatio <= 65 ? 'Optimal Health' : 'Attention Required'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
                                            {/* Donut Gauge */}
                                            <div className="sm:col-span-6 flex flex-col items-center justify-center">
                                                <div className="relative flex items-center justify-center">
                                                    <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90">
                                                        <circle cx="60" cy="60" r="42" fill="none" stroke="#f1f5f9" strokeWidth="15" />
                                                        {(() => {
                                                            const circumference = 2 * Math.PI * 42;
                                                            const costPct = Math.min(100, Math.max(0, dynamicStats.costRatio));
                                                            const profitPct = Math.min(100 - costPct, Math.max(0, dynamicStats.netMargin));
                                                            const costStroke = `${(costPct / 100) * circumference} ${circumference}`;
                                                            const profitStroke = `${(profitPct / 100) * circumference} ${circumference}`;
                                                            const profitOffset = -((costPct / 100) * circumference);

                                                            return (
                                                                <>
                                                                    {/* Cost Segment */}
                                                                    <circle
                                                                        cx="60"
                                                                        cy="60"
                                                                        r="42"
                                                                        fill="none"
                                                                        stroke="#F43F5E"
                                                                        strokeWidth="15"
                                                                        strokeDasharray={costStroke}
                                                                        strokeDashoffset="0"
                                                                        className="transition-all duration-500"
                                                                    />
                                                                    {/* Profit Segment */}
                                                                    {profitPct > 0 && (
                                                                        <circle
                                                                            cx="60"
                                                                            cy="60"
                                                                            r="42"
                                                                            fill="none"
                                                                            stroke="#10B981"
                                                                            strokeWidth="15"
                                                                            strokeDasharray={profitStroke}
                                                                            strokeDashoffset={profitOffset}
                                                                            className="transition-all duration-500"
                                                                        />
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Cost Ratio</span>
                                                        <span className="text-base font-black text-rose-700">
                                                            {dynamicStats.costRatio}%
                                                        </span>
                                                        <span className="text-[9px] text-emerald-600 font-extrabold">{dynamicStats.netMargin}% Margin</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="sm:col-span-6 space-y-2 text-xs">
                                                <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
                                                    <div>
                                                        <span className="font-bold text-rose-900 block">Operating Costs</span>
                                                        <span className="text-[10px] text-rose-600 font-mono">{formatTsh(dynamicStats.expenses)}</span>
                                                    </div>
                                                    <span className="font-black text-rose-700">{dynamicStats.costRatio}%</span>
                                                </div>

                                                <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-between">
                                                    <div>
                                                        <span className="font-bold text-[#1E3A5F] block">Net Operating Profit</span>
                                                        <span className="text-[10px] text-[#8C6D1F] font-mono font-bold">{formatTsh(dynamicStats.netProfit)}</span>
                                                    </div>
                                                    <span className="font-black text-[#8C6D1F] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2 py-0.5 rounded-md">{dynamicStats.netMargin}%</span>
                                                </div>

                                                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-500 font-semibold">Working Capital (AR - AP):</span>
                                                    <span className="font-mono font-black text-slate-900">
                                                        {formatTsh(safeMetrics.accounts_receivable_minor - safeMetrics.accounts_payable_minor)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => handleSetActiveTab('reports')}
                                                className="text-[#1E3A5F] hover:text-[#8C6D1F] font-bold flex items-center gap-1 cursor-pointer transition"
                                            >
                                                <span>View Full P&L Statement</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSetActiveTab('invoices')}
                                                className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                                            >
                                                Customer Receivables ({customerInvoices.length})
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 3: DETAILED AR AGING & EXPENSE CATEGORIES BREAKDOWN */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    {/* AR Aging Schedule */}
                                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                                    Accounts Receivable (AR) Aging Schedule
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Customer aging brackets and credit collection risk analysis
                                                </p>
                                            </div>
                                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                                                Total: {formatTsh(safeMetrics.accounts_receivable_minor)}
                                            </span>
                                        </div>

                                        <div className="space-y-2.5 pt-1">
                                            {arAging.map((bracket) => (
                                                <div key={bracket.bracket} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800">{bracket.bracket}</div>
                                                        <div className="text-[10px] text-slate-400">{bracket.count} debtor accounts</div>
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

                                        <button
                                            type="button"
                                            onClick={() => handleSetActiveTab('invoices')}
                                            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition text-center cursor-pointer"
                                        >
                                            View All Invoices & Debtors Table →
                                        </button>
                                    </div>

                                    {/* Expense Category Breakdown */}
                                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                                    Operating Expenses by Category
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Operational cost centers across hotel divisions
                                                </p>
                                            </div>
                                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
                                                Total: {formatTsh(safeMetrics.month_expenses_minor)}
                                            </span>
                                        </div>

                                        <div className="space-y-3 pt-1">
                                            {expenseCategories.length === 0 ? (
                                                <div className="py-8 text-center text-slate-400 text-xs">
                                                    No operating expenses recorded for this period.
                                                </div>
                                            ) : (
                                                expenseCategories.map((cat) => (
                                                    <div key={cat.category} className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-bold text-slate-700 capitalize">{cat.category}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-bold text-rose-700">{formatTsh(cat.amount_minor)}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{cat.percent}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(100, cat.percent)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: TRANSACTIONS & CASHBOOK  — Accountant only                         */}
                {/* ========================================================================= */}
                {activeTab === 'transactions' && !isExecutiveOrManager && (
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
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${exp.status === 'paid' || exp.status === 'approved'
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
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.aging_days <= 30
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
                {/* TAB 4: CHART OF ACCOUNTS & GENERAL LEDGER  — Accountant pekee           */}
                {/* ========================================================================= */}
                {activeTab === 'chart_of_accounts' && !isExecutiveOrManager && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Hotel Standard Chart of Accounts (COA)
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Double-entry accounting general ledger accounts structure. Click "View Stream" to inspect ledger transactions.
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
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
                                        <th className="py-2.5 px-3 text-right">Ledger Stream</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {accounts.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{acc.code || '—'}</td>
                                            <td className="py-2.5 px-3 font-bold text-slate-900">{acc.name}</td>
                                            <td className="py-2.5 px-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${acc.type === 'revenue'
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
                                            <td className="py-2.5 px-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedLedgerCode(acc.code);
                                                        setActiveTab('ledger_streams');
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                                >
                                                    <Layers className="w-3 h-3 text-emerald-600" />
                                                    <span>View Stream</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB: GENERAL LEDGER AUDIT TRAIL & TRANSACTION STREAMS                    */}
                {/* ========================================================================= */}
                {activeTab === 'ledger_streams' && (
                    <div className="space-y-5">
                        {/* 1. Account Selector Header Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-emerald-600" />
                                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                                            General Ledger Transaction Streams & Audit Trail
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Select any account or ledger to inspect the complete stream of entries, receipts, debits, and credits.
                                    </p>
                                </div>

                                {/* Quick Ledger Dropdown Selector */}
                                <div className="flex items-center gap-2 w-full lg:w-auto">
                                    <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Ledger:</label>
                                    <select
                                        value={selectedLedgerCode}
                                        onChange={(e) => setSelectedLedgerCode(e.target.value)}
                                        className="w-full lg:w-72 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500"
                                    >
                                        <option value="all">⚡ All Transactions (Consolidated Audit Trail)</option>
                                        <optgroup label="Revenue Ledgers">
                                            <option value="4001">4001 • Room Accommodation Revenue</option>
                                            <option value="4002">4002 • Restaurant & Bar Dining Revenue</option>
                                            <option value="4003">4003 • Grocery & Retail Minimart Sales</option>
                                            <option value="4004">4004 • Guest Services, Laundry & Misc</option>
                                        </optgroup>
                                        <optgroup label="Expense Ledgers">
                                            <option value="5001">5001 • Kitchen Food & Beverage Provisions</option>
                                            <option value="5002">5002 • Electricity, Water & Utilities</option>
                                            <option value="5003">5003 • Housekeeping Linens & Laundry</option>
                                            <option value="5004">5004 • Staff Salaries & Wages</option>
                                            <option value="5005">5005 • Repairs, Maintenance & Hardware</option>
                                            <option value="5006">5006 • Administrative & Marketing</option>
                                        </optgroup>
                                        <optgroup label="Cash & Bank Ledgers (Liquid Funds)">
                                            <option value="1010">1010 • Reception Petty Cash Vault</option>
                                            <option value="1020">1020 • CRDB Bank Corporate Account</option>
                                            <option value="1030">1030 • NMB Bank Operations Account</option>
                                            <option value="1040">1040 • Mobile Money Till (M-Pesa / Tigo)</option>
                                            <option value="1050">1050 • Guest Ledger (Accounts Receivable)</option>
                                        </optgroup>
                                        <optgroup label="Liability Accounts">
                                            <option value="2010">2010 • Supplier Trade Payables (AP)</option>
                                            <option value="2020">2020 • Guest Advance Deposits</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {[
                                    { code: 'all', label: 'All Transactions' },
                                    { code: '4001', label: '4001 • Rooms' },
                                    { code: '4002', label: '4002 • Restaurant & Bar' },
                                    { code: '4003', label: '4003 • Minimart' },
                                    { code: '1010', label: '1010 • Cash Vault' },
                                    { code: '1020', label: '1020 • CRDB Bank' },
                                    { code: '1040', label: '1040 • Mobile Money' },
                                    { code: '1050', label: '1050 • Guest Ledger (AR)' },
                                    { code: '5001', label: '5001 • Kitchen Food' },
                                    { code: '5002', label: '5002 • Electricity & Water' },
                                    { code: '5004', label: '5004 • Salaries & Wages' },
                                ].map((pill) => (
                                    <button
                                        key={pill.code}
                                        type="button"
                                        onClick={() => setSelectedLedgerCode(pill.code)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${selectedLedgerCode === pill.code
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {pill.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Selected Ledger Profile & KPI Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Selected Ledger Account</span>
                                <div className="mt-2">
                                    <div className="text-base font-black text-slate-900 truncate">
                                        {currentSelectedAccount?.name || 'All Consolidated Transactions'}
                                    </div>
                                    <span className="text-xs font-mono font-bold text-blue-700 block mt-0.5">
                                        {selectedLedgerCode === 'all' ? 'Consolidated GL' : `Code: ${selectedLedgerCode}`}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Current Book Balance</span>
                                <div className="mt-2">
                                    <div className="text-xl font-black text-slate-900 font-mono">
                                        {selectedLedgerCode === 'all'
                                            ? formatTsh(safeMetrics.month_revenue_minor)
                                            : formatTsh(currentSelectedAccount?.balance_minor || 0)}
                                    </div>
                                    <span className="text-[11px] text-slate-400 block mt-0.5">Updated per current transactions</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Debits (Inflow)</span>
                                <div className="mt-2">
                                    <div className="text-xl font-black text-emerald-700 font-mono">
                                        {formatTsh(currentLedgerDebitsTotal)}
                                    </div>
                                    <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Inflow / Asset Charges</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Credits (Outflow)</span>
                                <div className="mt-2">
                                    <div className="text-xl font-black text-rose-700 font-mono">
                                        {formatTsh(currentLedgerCreditsTotal)}
                                    </div>
                                    <span className="text-[11px] text-rose-600 font-semibold block mt-0.5">Outflow / Earned Revenue</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Search and Ledger Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={ledgerSearchQuery}
                                        onChange={(e) => setLedgerSearchQuery(e.target.value)}
                                        placeholder="Search by reference, voucher no, description, or entity..."
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLedgerDateFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${ledgerDateFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        All Time
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLedgerDateFilter('month')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${ledgerDateFilter === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        This Month
                                    </button>
                                </div>
                            </div>

                            {/* Transaction Stream Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                            <th className="py-2.5 px-3">Date</th>
                                            <th className="py-2.5 px-3">Reference / Voucher</th>
                                            <th className="py-2.5 px-3">Account / Ledger</th>
                                            <th className="py-2.5 px-3">Description</th>
                                            <th className="py-2.5 px-3">Entity / Division</th>
                                            <th className="py-2.5 px-3">Payment</th>
                                            <th className="py-2.5 px-3 text-right">Debit (TZS)</th>
                                            <th className="py-2.5 px-3 text-right">Credit (TZS)</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredLedgerTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="py-12 text-center text-slate-400">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Layers className="w-8 h-8 text-slate-300" />
                                                        <span className="font-semibold text-sm">No transactions found in this ledger for the selected period.</span>
                                                        <span className="text-xs text-slate-400">
                                                            Real-time transactions from front desk, POS outlets, and expense vouchers will stream here automatically.
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLedgerTransactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-slate-50 transition">
                                                    <td className="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">{tx.date}</td>
                                                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                                                        {tx.reference}
                                                    </td>
                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                        <span className="font-bold text-slate-900 block">{tx.account_name}</span>
                                                        <span className="text-[10px] font-mono text-slate-400 block">{tx.account_code}</span>
                                                    </td>
                                                    <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs">{tx.description}</td>
                                                    <td className="py-2.5 px-3 text-slate-600">{tx.entity}</td>
                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                                                            {tx.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                                        {tx.debit_minor > 0 ? formatTsh(tx.debit_minor) : '—'}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                                                        {tx.credit_minor > 0 ? formatTsh(tx.credit_minor) : '—'}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                                            {tx.status}
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
                {/* TAB 5: BANKING & RECONCILIATION                                           */}
                {/* ========================================================================= */}
                {activeTab === 'banking' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {bankAccounts.map((b) => (
                                <div key={b.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                                    <div className="flex items-center justify-between">

                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${b.reconciled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {b.reconciled ? <CheckCheck className="w-3 h-3" /> : null} {b.reconciled ? 'Reconciled' : 'Unreconciled'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">{b.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{b.account_number || '—'}</div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Book Balance</div>
                                        <div className="text-lg font-black text-slate-900 mt-0.5">{formatTsh(b.book_balance_minor)}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">{b.last_reconciled ? `Reconciled: ${b.last_reconciled}` : 'Not yet reconciled'}</div>
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
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
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
                {/* TAB 7: APPROVALS QUEUE  — Accountant only                                 */}
                {/* ========================================================================= */}
                {activeTab === 'approvals' && !isExecutiveOrManager && (
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
