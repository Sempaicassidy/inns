import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    BarChart3,
    Bed,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    Percent,
    Printer,
    RefreshCw,
    Search,
    TrendingDown,
    TrendingUp,
    Users,
    UtensilsCrossed,
    Wallet,
} from 'lucide-react';

export interface ReportItem {
    id?: string | number;
    [key: string]: any;
}

export interface ReportData {
    report_type: string;
    range: string;
    start_date: string;
    end_date: string;
    property_id?: string | null;
    search?: string | null;
    department?: string | null;
    payment_method?: string | null;
    status?: string | null;
    summary?: Record<string, any>;
    revenue_breakdown?: Array<any>;
    expense_breakdown?: Array<any>;
    inflows?: Array<any>;
    outflows?: Array<any>;
    items: ReportItem[];
    pagination?: {
        total: number;
        page: number;
        per_page: number;
        last_page: number;
    };
}

interface OwnerReportCenterProps {
    reportType: string;
    reportData: ReportData;
    properties: Array<{ id: string; name: string }>;
    period?: string;
    startDate?: string;
    endDate?: string;
    selectedPropertyId?: string | null;
    formatTzs: (minor: number) => string;
}

const REPORT_TABS = [
    { id: 'sales', label: '1. Sales Report', icon: DollarSign, desc: 'All itemized POS sales and folio service transactions' },
    { id: 'revenue', label: '2. Revenue Report', icon: TrendingUp, desc: 'Recognized revenue pace across rooms and dining outlets' },
    { id: 'expense', label: '3. Expense Report', icon: ArrowDownRight, desc: 'Operational expenditures, supplies & vendor payables' },
    { id: 'profit_loss', label: '4. Profit & Loss', icon: Activity, desc: 'Income statement: Revenue, OPEX and Net Operating Profit' },
    { id: 'booking', label: '5. Booking Report', icon: Calendar, desc: 'Reservation ledger, stay lengths, sources & confirmations' },
    { id: 'room_occupancy', label: '6. Room Occupancy', icon: Bed, desc: 'Daily room occupancy rate, capacity yield, ADR & RevPAR' },
    { id: 'customer', label: '7. Customer Report', icon: Users, desc: 'Guest lifetime spend, stay frequency & pending balances' },
    { id: 'payment', label: '8. Payment Report', icon: Wallet, desc: 'Tender collections across Cash, M-Pesa, Bank & Cards' },
    { id: 'department_performance', label: '9. Department Yield', icon: UtensilsCrossed, desc: 'Comparative scorecard of all hospitality revenue centers' },
    { id: 'staff_performance', label: '10. Staff Activity', icon: Users, desc: 'Audit of staff cashiering, orders handled & collections' },
    { id: 'cash_flow', label: '11. Cash Flow', icon: Banknote, desc: 'Cash inflows vs operational outflows & owner distributions' },
    { id: 'tax', label: '12. Tax & Fiscal', icon: FileText, desc: 'VAT & Tourism levy collected for fiscal audit compliance' },
];

export default function OwnerReportCenter({
    reportType,
    reportData,
    properties,
    startDate,
    endDate,
    selectedPropertyId,
    formatTzs,
}: OwnerReportCenterProps) {
    const [currentReport, setCurrentReport] = useState(reportType || 'sales');
    const [filterStart, setFilterStart] = useState(startDate || reportData?.start_date || '');
    const [filterEnd, setFilterEnd] = useState(endDate || reportData?.end_date || '');
    const [filterProperty, setFilterProperty] = useState(selectedPropertyId || reportData?.property_id || '');
    const [filterSearch, setFilterSearch] = useState(reportData?.search || '');
    const [filterDept, setFilterDept] = useState(reportData?.department || '');
    const [filterMethod, setFilterMethod] = useState(reportData?.payment_method || '');
    const [filterStatus, setFilterStatus] = useState(reportData?.status || '');
    const [isFiltering, setIsFiltering] = useState(false);

    const applyFilters = (overrideReportType?: string, newPage?: number) => {
        setIsFiltering(true);
        const targetReport = overrideReportType || currentReport;

        router.get(
            route('owner.index'),
            {
                tab: 'reports',
                report_type: targetReport,
                start_date: filterStart || undefined,
                end_date: filterEnd || undefined,
                property_id: filterProperty || undefined,
                search: filterSearch || undefined,
                department: filterDept || undefined,
                payment_method: filterMethod || undefined,
                status: filterStatus || undefined,
                page: newPage || 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsFiltering(false),
            }
        );
    };

    const handleReportChange = (type: string) => {
        setCurrentReport(type);
        applyFilters(type, 1);
    };

    const handleExport = () => {
        const queryParams = new URLSearchParams({
            report_type: currentReport,
            ...(filterStart ? { start_date: filterStart } : {}),
            ...(filterEnd ? { end_date: filterEnd } : {}),
            ...(filterProperty ? { property_id: filterProperty } : {}),
            ...(filterSearch ? { search: filterSearch } : {}),
            ...(filterDept ? { department: filterDept } : {}),
            ...(filterMethod ? { payment_method: filterMethod } : {}),
            ...(filterStatus ? { status: filterStatus } : {}),
        }).toString();

        window.open(route('owner.reports.export') + '?' + queryParams, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    const resetFilters = () => {
        setFilterStart('');
        setFilterEnd('');
        setFilterProperty('');
        setFilterSearch('');
        setFilterDept('');
        setFilterMethod('');
        setFilterStatus('');
        router.get(
            route('owner.index'),
            { tab: 'reports', report_type: currentReport },
            { preserveState: true, preserveScroll: true }
        );
    };

    const summary = reportData?.summary || {};
    const items = reportData?.items || [];
    const pagination = reportData?.pagination || { total: items.length, page: 1, per_page: 25, last_page: 1 };

    return (
        <div className="space-y-6 print:space-y-4">
            {/* ─── REPORT CENTER HEADER (Non-print) ────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-950 tracking-tight">
                            Hospitality Intelligence & Official Reporting Center
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Audited financial statements, operational occupancy records, departmental yield & live transaction logs
                    </p>
                </div>

                {/* Export & Print Toolbar */}
                <div className="flex items-center gap-2.5 self-start lg:self-auto">
                    <button
                        type="button"
                        onClick={handleExport}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                        title="Download raw Excel-compatible CSV dataset"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export Excel (CSV)</span>
                    </button>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                        title="Generate official executive printable PDF / Paper Report"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Print / Save PDF</span>
                    </button>
                </div>
            </div>

            {/* Print-Only Official Executive Header */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">THE INNS — EXECUTIVE AUDIT REPORT</h1>
                        <h2 className="text-base font-bold text-slate-700 uppercase mt-0.5">
                            {REPORT_TABS.find((t) => t.id === currentReport)?.label || currentReport.toUpperCase()}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Reporting Scope: {reportData?.start_date} → {reportData?.end_date} | Generated on {new Date().toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                        <span className="font-extrabold text-slate-900 block">Strictly Confidential</span>
                        <span>Property Owner Executive Audit Copy</span>
                    </div>
                </div>
            </div>

            {/* ─── 12 REPORT SELECTOR TILES ───────────────────────────────── */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs print:hidden">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-3">
                    Select Audited Report ({REPORT_TABS.length} Standard Business Statements)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {REPORT_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = currentReport === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleReportChange(tab.id)}
                                className={`p-3 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between min-h-[72px] ${
                                    isSelected
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/70 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </div>
                                <span className="text-xs font-black tracking-tight mt-2 line-clamp-1">
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── MULTI-DIMENSIONAL AUDIT FILTER BAR ──────────────────────── */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs print:hidden space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-blue-600" />
                        <span>Filter & Refine Report Dataset</span>
                    </span>
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                    {/* Start Date */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={filterStart}
                            onChange={(e) => setFilterStart(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white transition"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={filterEnd}
                            onChange={(e) => setFilterEnd(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white transition"
                        />
                    </div>

                    {/* Branch / Property Scope */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Branch Scope
                        </label>
                        <select
                            value={filterProperty}
                            onChange={(e) => setFilterProperty(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white transition"
                        >
                            <option value="">All Properties (Consolidated)</option>
                            {properties.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search Term */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Search Records
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ref #, guest, vendor..."
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white transition"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                        </div>
                    </div>

                    {/* Department Filter (Sales/Revenue/Expenses) */}
                    {(currentReport === 'sales' || currentReport === 'expense' || currentReport === 'revenue' || currentReport === 'department_performance') && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Department / Category
                            </label>
                            <select
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                            >
                                <option value="">All Departments</option>
                                <option value="room">Rooms & Accommodation</option>
                                <option value="restaurant">Restaurant & Kitchen</option>
                                <option value="bar">Bar & Beverage</option>
                                <option value="laundry">Laundry</option>
                                <option value="conference">Conference & Banquets</option>
                                <option value="tour">Tours & Safari</option>
                                <option value="grocery">Mini Market / Retail</option>
                            </select>
                        </div>
                    )}

                    {/* Payment Method Filter */}
                    {(currentReport === 'sales' || currentReport === 'payment' || currentReport === 'cash_flow') && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Tender Method
                            </label>
                            <select
                                value={filterMethod}
                                onChange={(e) => setFilterMethod(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                            >
                                <option value="">All Payment Modes</option>
                                <option value="cash">Cash on Hand</option>
                                <option value="mpesa">M-Pesa</option>
                                <option value="tigopesa">Tigo Pesa</option>
                                <option value="airtelmoney">Airtel Money</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="card">Card / POS Terminal</option>
                                <option value="room_folio">Room Folio Charge</option>
                            </select>
                        </div>
                    )}

                    {/* Status Filter */}
                    {(currentReport === 'sales' || currentReport === 'booking' || currentReport === 'expense' || currentReport === 'payment') && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Transaction Status
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                            >
                                <option value="">All Statuses</option>
                                <option value="confirmed">Confirmed / Paid</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    )}

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => applyFilters()}
                            disabled={isFiltering}
                            className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            <span>{isFiltering ? 'Filtering...' : 'Apply Filters'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── AUDIT SUMMARY KPI BANNER ───────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentReport === 'sales' && (
                    <>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Sales Volume</span>
                            <h3 className="text-2xl font-black text-slate-950 mt-2">{formatTzs(summary.total_sales_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">{summary.total_transactions || 0} recognized transactions</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Net Recognized Sales</span>
                            <h3 className="text-2xl font-black text-emerald-700 mt-2">{formatTzs(summary.net_sales_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Excluding VAT & hospitality taxes</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Tax Collected (VAT)</span>
                            <h3 className="text-2xl font-black text-blue-700 mt-2">{formatTzs(summary.total_tax_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Audited tax liability</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Average Ticket Size</span>
                            <h3 className="text-2xl font-black text-amber-800 mt-2">
                                {formatTzs(summary.total_transactions > 0 ? Math.round(summary.total_sales_minor / summary.total_transactions) : 0)}
                            </h3>
                            <span className="text-xs text-slate-500 mt-1 block">Per recognized transaction</span>
                        </div>
                    </>
                )}

                {currentReport === 'revenue' && (
                    <>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Gross Revenue</span>
                            <h3 className="text-2xl font-black text-slate-950 mt-2">{formatTzs(summary.total_revenue_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Consolidated recognized revenue</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Rooms Accommodation</span>
                            <h3 className="text-2xl font-black text-blue-700 mt-2">{formatTzs(summary.room_revenue_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Guest lodging & suites</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Food & Beverage (F&B)</span>
                            <h3 className="text-2xl font-black text-amber-700 mt-2">{formatTzs(summary.fb_revenue_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Dining, Bar & Room Service</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Ancillary Services</span>
                            <h3 className="text-2xl font-black text-purple-700 mt-2">{formatTzs(summary.other_revenue_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Events, laundry, tours & retail</span>
                        </div>
                    </>
                )}

                {currentReport === 'profit_loss' && (
                    <>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Operating Revenue</span>
                            <h3 className="text-2xl font-black text-slate-950 mt-2">{formatTzs(summary.total_revenue_minor || 0)}</h3>
                            <span className="text-xs text-emerald-600 font-bold mt-1 block">Total inflows from operations</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Operating Expenses (OPEX)</span>
                            <h3 className="text-2xl font-black text-rose-700 mt-2">{formatTzs(summary.total_expenses_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Kitchen, utilities, payroll & maintenance</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Gross Operating Profit (GOP)</span>
                            <h3 className="text-2xl font-black text-amber-800 mt-2">{formatTzs(summary.gross_operating_profit_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Net operational business surplus</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">GOP Margin Conversion</span>
                            <h3 className="text-2xl font-black text-blue-700 mt-2">{summary.gop_margin_percent || 0}%</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Profit conversion efficiency</span>
                        </div>
                    </>
                )}

                {currentReport === 'room_occupancy' && (
                    <>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Average Occupancy</span>
                            <h3 className="text-2xl font-black text-blue-700 mt-2">{summary.average_occupancy_percent || 0}%</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Across {summary.total_active_rooms || 0} active rooms</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Average Daily Rate (ADR)</span>
                            <h3 className="text-2xl font-black text-slate-950 mt-2">{formatTzs(summary.overall_adr_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Average per occupied room night</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">RevPAR (Revenue / Room)</span>
                            <h3 className="text-2xl font-black text-emerald-700 mt-2">{formatTzs(summary.overall_revpar_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Revenue per available room</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Room Revenue</span>
                            <h3 className="text-2xl font-black text-purple-700 mt-2">{formatTzs(summary.total_room_revenue_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Accommodations in period</span>
                        </div>
                    </>
                )}

                {currentReport === 'booking' && (
                    <>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Bookings</span>
                            <h3 className="text-2xl font-black text-slate-950 mt-2">{summary.total_bookings || 0}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Reservations recorded</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Confirmed Bookings</span>
                            <h3 className="text-2xl font-black text-emerald-700 mt-2">{summary.confirmed || 0}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Locked in guest reservations</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Pending / Tentative</span>
                            <h3 className="text-2xl font-black text-amber-700 mt-2">{summary.pending || 0}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Awaiting deposit or arrival</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Booking Value</span>
                            <h3 className="text-2xl font-black text-purple-700 mt-2">{formatTzs(summary.total_value_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Gross booking contract value</span>
                        </div>
                    </>
                )}

                {currentReport === 'expense' && (
                    <>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Expenditures</span>
                            <h3 className="text-2xl font-black text-rose-700 mt-2">{formatTzs(summary.total_expenses_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Across {summary.count || 0} authorized vouchers</span>
                        </div>
                    </>
                )}

                {currentReport === 'payment' && (
                    <>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Collections</span>
                            <h3 className="text-2xl font-black text-emerald-700 mt-2">{formatTzs(summary.total_collected_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">{summary.count || 0} receipts settled</span>
                        </div>
                    </>
                )}

                {currentReport === 'cash_flow' && (
                    <>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Cash Inflows</span>
                            <h3 className="text-2xl font-black text-emerald-700 mt-2">{formatTzs(summary.total_inflows_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Collections & capital</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Cash Outflows</span>
                            <h3 className="text-2xl font-black text-rose-700 mt-2">{formatTzs(summary.total_outflows_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Expenses, procurement & drawings</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Net Cash Surplus</span>
                            <h3 className={`text-2xl font-black mt-2 ${(summary.net_cash_flow_minor || 0) >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                                {formatTzs(summary.net_cash_flow_minor || 0)}
                            </h3>
                            <span className="text-xs text-slate-500 mt-1 block">Net periodic cash delta</span>
                        </div>
                    </>
                )}

                {currentReport === 'tax' && (
                    <>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Audited Tax Collected</span>
                            <h3 className="text-2xl font-black text-blue-700 mt-2">{formatTzs(summary.total_tax_collected_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">VAT & tourism levies accrued</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Net Taxable Revenue</span>
                            <h3 className="text-2xl font-black text-slate-950 mt-2">{formatTzs(summary.total_taxable_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Base sales subject to VAT</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">Gross Sales with Tax</span>
                            <h3 className="text-2xl font-black text-emerald-700 mt-2">{formatTzs(summary.gross_sales_with_tax_minor || 0)}</h3>
                            <span className="text-xs text-slate-500 mt-1 block">Total customer billings</span>
                        </div>
                    </>
                )}
            </div>

            {/* ─── DYNAMIC DATA TABLE ─────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-950 capitalize">
                            {REPORT_TABS.find((t) => t.id === currentReport)?.label || currentReport.replace('_', ' ')}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {REPORT_TABS.find((t) => t.id === currentReport)?.desc}
                        </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-700">
                        {pagination.total} records found
                    </span>
                </div>

                {items.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-xs font-medium">
                        <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p>No transactions match the selected filters for this statement.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200">
                                <tr>
                                    {currentReport === 'sales' && (
                                        <>
                                            <th className="py-3 px-4">Date / Time</th>
                                            <th className="py-3 px-4">Ref #</th>
                                            <th className="py-3 px-4">Department</th>
                                            <th className="py-3 px-4">Customer / Guest</th>
                                            <th className="py-3 px-4 text-right">Subtotal</th>
                                            <th className="py-3 px-4 text-right">Tax (VAT)</th>
                                            <th className="py-3 px-4 text-right">Total Amount</th>
                                            <th className="py-3 px-4">Tender</th>
                                            <th className="py-3 px-4">Status</th>
                                        </>
                                    )}

                                    {currentReport === 'revenue' && (
                                        <>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4 text-right">Accommodation (Rooms)</th>
                                            <th className="py-3 px-4 text-right">Dining & Bar (F&B)</th>
                                            <th className="py-3 px-4 text-right">Ancillary Services</th>
                                            <th className="py-3 px-4 text-right">Total Recognized Revenue</th>
                                        </>
                                    )}

                                    {currentReport === 'expense' && (
                                        <>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4">Voucher #</th>
                                            <th className="py-3 px-4">Title / Purpose</th>
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4">Vendor / Payee</th>
                                            <th className="py-3 px-4">Branch</th>
                                            <th className="py-3 px-4">Tender</th>
                                            <th className="py-3 px-4 text-right">Amount</th>
                                            <th className="py-3 px-4">Status</th>
                                        </>
                                    )}

                                    {currentReport === 'profit_loss' && (
                                        <>
                                            <th className="py-3 px-4">Financial Type</th>
                                            <th className="py-3 px-4">Line Item / Stream</th>
                                            <th className="py-3 px-4 text-right">Amount (TZS)</th>
                                        </>
                                    )}

                                    {currentReport === 'booking' && (
                                        <>
                                            <th className="py-3 px-4">Ref #</th>
                                            <th className="py-3 px-4">Guest Name</th>
                                            <th className="py-3 px-4">Property</th>
                                            <th className="py-3 px-4">Room(s)</th>
                                            <th className="py-3 px-4">Check-In</th>
                                            <th className="py-3 px-4">Check-Out</th>
                                            <th className="py-3 px-4 text-center">Nights</th>
                                            <th className="py-3 px-4 text-right">Booking Amount</th>
                                            <th className="py-3 px-4">Status</th>
                                        </>
                                    )}

                                    {currentReport === 'room_occupancy' && (
                                        <>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4 text-center">Day</th>
                                            <th className="py-3 px-4 text-center">Capacity</th>
                                            <th className="py-3 px-4 text-center">Occupied</th>
                                            <th className="py-3 px-4 text-center">Vacant</th>
                                            <th className="py-3 px-4 text-center">Occupancy %</th>
                                            <th className="py-3 px-4 text-right">Room Revenue</th>
                                            <th className="py-3 px-4 text-right">ADR</th>
                                            <th className="py-3 px-4 text-right">RevPAR</th>
                                        </>
                                    )}

                                    {currentReport === 'customer' && (
                                        <>
                                            <th className="py-3 px-4">Customer Name</th>
                                            <th className="py-3 px-4">Phone</th>
                                            <th className="py-3 px-4">Email</th>
                                            <th className="py-3 px-4">Tier / VIP</th>
                                            <th className="py-3 px-4 text-center">Stays</th>
                                            <th className="py-3 px-4 text-right">Lifetime Spend</th>
                                            <th className="py-3 px-4 text-right">Pending Balance</th>
                                            <th className="py-3 px-4">Since</th>
                                        </>
                                    )}

                                    {currentReport === 'payment' && (
                                        <>
                                            <th className="py-3 px-4">Date / Time</th>
                                            <th className="py-3 px-4">Ref #</th>
                                            <th className="py-3 px-4">Transaction Source</th>
                                            <th className="py-3 px-4">Customer</th>
                                            <th className="py-3 px-4">Branch</th>
                                            <th className="py-3 px-4">Payment Method</th>
                                            <th className="py-3 px-4">Cashier / Staff</th>
                                            <th className="py-3 px-4 text-right">Amount</th>
                                            <th className="py-3 px-4">Status</th>
                                        </>
                                    )}

                                    {currentReport === 'department_performance' && (
                                        <>
                                            <th className="py-3 px-4">Department / Center</th>
                                            <th className="py-3 px-4 text-center">Transactions</th>
                                            <th className="py-3 px-4 text-right">Gross Revenue</th>
                                            <th className="py-3 px-4 text-right">Allocated Expenses</th>
                                            <th className="py-3 px-4 text-right">Net Operating Yield</th>
                                            <th className="py-3 px-4 text-center">Margin %</th>
                                        </>
                                    )}

                                    {currentReport === 'staff_performance' && (
                                        <>
                                            <th className="py-3 px-4">Staff Member</th>
                                            <th className="py-3 px-4">Role</th>
                                            <th className="py-3 px-4">Branch</th>
                                            <th className="py-3 px-4 text-center">Orders Handled</th>
                                            <th className="py-3 px-4 text-right">Collections Tended</th>
                                            <th className="py-3 px-4 text-right">Expenses Submitted</th>
                                        </>
                                    )}

                                    {currentReport === 'cash_flow' && (
                                        <>
                                            <th className="py-3 px-4">Flow Type</th>
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4">Line Item Description</th>
                                            <th className="py-3 px-4 text-right">Cash Amount (TZS)</th>
                                        </>
                                    )}

                                    {currentReport === 'tax' && (
                                        <>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4 text-right">Net Taxable Billings</th>
                                            <th className="py-3 px-4 text-right">VAT & Hospitality Tax</th>
                                            <th className="py-3 px-4 text-right">Gross Revenue with Tax</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-slate-50/70 transition">
                                        {currentReport === 'sales' && (
                                            <>
                                                <td className="py-3 px-4 font-mono text-slate-500">{row.date}</td>
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.reference}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                                        {row.department}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-medium text-slate-800">{row.customer}</td>
                                                <td className="py-3 px-4 text-right font-mono">{formatTzs(row.subtotal_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono text-slate-500">{formatTzs(row.tax_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{formatTzs(row.total_minor)}</td>
                                                <td className="py-3 px-4 font-medium capitalize text-slate-600">{row.payment_method?.replace('_', ' ')}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        row.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                    }`}>
                                                        {row.payment_status}
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        {currentReport === 'revenue' && (
                                            <>
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.date}</td>
                                                <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">{formatTzs(row.room_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono text-amber-700 font-bold">{formatTzs(row.fb_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono text-purple-700 font-bold">{formatTzs(row.other_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{formatTzs(row.total_minor)}</td>
                                            </>
                                        )}

                                        {currentReport === 'expense' && (
                                            <>
                                                <td className="py-3 px-4 font-mono text-slate-500">{row.date}</td>
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.expense_number}</td>
                                                <td className="py-3 px-4 font-bold text-slate-800">{row.title}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                                        {row.category}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-600">{row.vendor}</td>
                                                <td className="py-3 px-4 text-slate-600">{row.property_name}</td>
                                                <td className="py-3 px-4 capitalize text-slate-600">{row.payment_method?.replace('_', ' ')}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-rose-700">{formatTzs(row.amount_minor)}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        {currentReport === 'profit_loss' && (
                                            <>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        row.type === 'Revenue' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                                    }`}>
                                                        {row.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-900">{row.item}</td>
                                                <td className={`py-3 px-4 text-right font-mono font-black ${
                                                    row.amount_minor >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                                }`}>
                                                    {formatTzs(Math.abs(row.amount_minor))}
                                                </td>
                                            </>
                                        )}

                                        {currentReport === 'booking' && (
                                            <>
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.ref_no}</td>
                                                <td className="py-3 px-4 font-bold text-slate-800">{row.guest_name}</td>
                                                <td className="py-3 px-4 text-slate-600">{row.property_name}</td>
                                                <td className="py-3 px-4 text-slate-600">{row.rooms}</td>
                                                <td className="py-3 px-4 font-mono text-slate-600">{row.check_in}</td>
                                                <td className="py-3 px-4 font-mono text-slate-600">{row.check_out}</td>
                                                <td className="py-3 px-4 text-center font-bold">{row.nights}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{formatTzs(row.total_amount_minor)}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        row.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        {currentReport === 'room_occupancy' && (
                                            <>
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.date}</td>
                                                <td className="py-3 px-4 text-center font-bold text-slate-500">{row.day_name}</td>
                                                <td className="py-3 px-4 text-center font-bold">{row.total_rooms}</td>
                                                <td className="py-3 px-4 text-center font-bold text-emerald-700">{row.occupied_rooms}</td>
                                                <td className="py-3 px-4 text-center font-bold text-slate-500">{row.vacant_rooms}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="font-black text-blue-700">{row.occupancy_rate}%</span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatTzs(row.room_revenue_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{formatTzs(row.adr_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">{formatTzs(row.revpar_minor)}</td>
                                            </>
                                        )}

                                        {currentReport === 'customer' && (
                                            <>
                                                <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                                                <td className="py-3 px-4 font-mono text-slate-600">{row.phone}</td>
                                                <td className="py-3 px-4 text-slate-500">{row.email}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                                                        {row.vip_level}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-bold">{row.total_stays}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">{formatTzs(row.total_spend_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-rose-700">{formatTzs(row.outstanding_balance_minor)}</td>
                                                <td className="py-3 px-4 font-mono text-slate-500">{row.created_at}</td>
                                            </>
                                        )}

                                        {currentReport === 'payment' && (
                                            <>
                                                <td className="py-3 px-4 font-mono text-slate-500">{row.date}</td>
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.reference}</td>
                                                <td className="py-3 px-4 text-slate-600">{row.source}</td>
                                                <td className="py-3 px-4 font-bold text-slate-800">{row.customer}</td>
                                                <td className="py-3 px-4 text-slate-600">{row.property_name}</td>
                                                <td className="py-3 px-4 capitalize font-medium text-slate-700">{row.payment_method?.replace('_', ' ')}</td>
                                                <td className="py-3 px-4 text-slate-600">{row.cashier}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">{formatTzs(row.amount_minor)}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        {currentReport === 'department_performance' && (
                                            <>
                                                <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                                                <td className="py-3 px-4 text-center font-bold">{row.orders}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">{formatTzs(row.revenue_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">{formatTzs(row.expenses_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{formatTzs(row.net_yield_minor)}</td>
                                                <td className="py-3 px-4 text-center font-black text-blue-700">{row.margin_percent}%</td>
                                            </>
                                        )}

                                        {currentReport === 'staff_performance' && (
                                            <>
                                                <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                                                <td className="py-3 px-4 text-slate-600">{row.role}</td>
                                                <td className="py-3 px-4 text-slate-600">{row.property_name}</td>
                                                <td className="py-3 px-4 text-center font-bold">{row.orders_count}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">{formatTzs(row.payments_collected_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">{formatTzs(row.expenses_submitted_minor)}</td>
                                            </>
                                        )}

                                        {currentReport === 'cash_flow' && (
                                            <>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        row.type === 'Inflow' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                                    }`}>
                                                        {row.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-600">{row.category}</td>
                                                <td className="py-3 px-4 font-bold text-slate-900">{row.item}</td>
                                                <td className={`py-3 px-4 text-right font-mono font-black ${
                                                    row.amount_minor >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                                }`}>
                                                    {formatTzs(Math.abs(row.amount_minor))}
                                                </td>
                                            </>
                                        )}

                                        {currentReport === 'tax' && (
                                            <>
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.date}</td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">{formatTzs(row.net_taxable_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-blue-700">{formatTzs(row.vat_tax_minor)}</td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{formatTzs(row.gross_sales_minor)}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {pagination.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 print:hidden">
                        <span>
                            Showing page {pagination.page} of {pagination.last_page} ({pagination.total} records)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={pagination.page <= 1}
                                onClick={() => applyFilters(currentReport, pagination.page - 1)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                disabled={pagination.page >= pagination.last_page}
                                onClick={() => applyFilters(currentReport, pagination.page + 1)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
