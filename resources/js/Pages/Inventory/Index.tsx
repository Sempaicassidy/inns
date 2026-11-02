import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Box,
    CheckCircle2,
    DollarSign,
    Edit3,
    FileText,
    Filter,
    Layers,
    Minus,
    Package,
    Plus,
    Printer,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
    Truck,
    Wrench,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface StoreItem {
    id: string;
    sku: string;
    name: string;
    department: string;
    unit: string;
    current_quantity: number;
    reorder_level: number;
    unit_cost_minor: number;
    total_valuation_minor: number;
    notes: string;
    status: 'optimal' | 'low_stock' | 'depleted';
}

interface DepartmentSummary {
    department_key: string;
    name: string;
    items_count: number;
    total_valuation_minor: number;
    low_stock_count: number;
}

interface StockMovement {
    id: string;
    item_name: string;
    sku: string;
    movement_type: string;
    quantity: number;
    department: string;
    reference_no: string;
    notes: string;
    performed_by: string;
    created_at: string;
}

interface InventoryIndexProps extends PageProps {
    metrics: {
        total_items_count: number;
        total_valuation_minor: number;
        depleted_count: number;
        low_stock_count: number;
        optimal_count: number;
    };
    items: StoreItem[];
    byDepartment: DepartmentSummary[];
    movements: StockMovement[];
    departments: Record<string, string>;
}

export default function InventoryIndex({
    metrics,
    items = [],
    byDepartment = [],
    movements = [],
    departments = {},
}: InventoryIndexProps) {
    const [activeTab, setActiveTab] = useState<'catalog' | 'movements' | 'departments'>('catalog');
    const [searchQuery, setSearchQuery] = useState(() => {
        if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search);
            return p.get('highlight') || p.get('search') || '';
        }
        return '';
    });
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'optimal' | 'low_stock' | 'depleted'>('all');

    // Modals
    const [isAddSkuModalOpen, setIsAddSkuModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedItemForAction, setSelectedItemForAction] = useState<StoreItem | null>(null);

    // Form 1: Add New Store SKU
    const addSkuForm = useForm({
        sku: '',
        name: '',
        department: 'linens',
        unit: 'pcs',
        current_quantity: 20,
        reorder_level: 10,
        unit_cost: '',
        notes: '',
    });

    // Form 2: Receive Stock (Inbound)
    const receiveForm = useForm({
        item_id: '',
        quantity: 10,
        unit_cost: '',
        reference_no: '',
        notes: '',
    });

    // Form 3: Issue Requisition (Outbound to department)
    const issueForm = useForm({
        item_id: '',
        quantity: 1,
        department: 'Housekeeping',
        recipient_name: '',
        reference_no: '',
        notes: '',
    });

    // Form 4: Adjust Stock (Loss/Damage)
    const adjustForm = useForm({
        item_id: '',
        adjustment_type: 'damage',
        quantity: 1,
        notes: '',
    });

    const formatTsh = (amountMinor: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format(amountMinor / 100);
    };

    // Filter items
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (departments[item.department] || item.department)
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());

            const matchesDept =
                selectedDepartment === 'all' || item.department === selectedDepartment;

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

            return matchesSearch && matchesDept && matchesStatus;
        });
    }, [items, searchQuery, selectedDepartment, statusFilter, departments]);

    // Action Triggers
    const openReceiveModal = (item?: StoreItem) => {
        const target = item || items[0];
        if (target) {
            setSelectedItemForAction(target);
            receiveForm.setData({
                item_id: target.id,
                quantity: 10,
                unit_cost: String(target.unit_cost_minor / 100),
                reference_no: `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                notes: `Delivery received for ${target.name}`,
            });
            setIsReceiveModalOpen(true);
        }
    };

    const openIssueModal = (item?: StoreItem) => {
        const target = item || items[0];
        if (target) {
            setSelectedItemForAction(target);
            issueForm.setData({
                item_id: target.id,
                quantity: 1,
                department: target.department === 'linens' ? 'Housekeeping Floor 1' : 'Main Kitchen',
                recipient_name: '',
                reference_no: `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                notes: `Requisition issued for ${target.name}`,
            });
            setIsIssueModalOpen(true);
        }
    };

    const openAdjustModal = (item?: StoreItem) => {
        const target = item || items[0];
        if (target) {
            setSelectedItemForAction(target);
            adjustForm.setData({
                item_id: target.id,
                adjustment_type: 'damage',
                quantity: 1,
                notes: `Damaged during handling`,
            });
            setIsAdjustModalOpen(true);
        }
    };

    // Submit Handlers
    const handleAddSkuSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addSkuForm.post(route('inventory.items.store'), {
            preserveScroll: true,
            onSuccess: () => {
                addSkuForm.reset();
                setIsAddSkuModalOpen(false);
            },
        });
    };

    const handleReceiveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        receiveForm.post(route('inventory.receive'), {
            preserveScroll: true,
            onSuccess: () => {
                receiveForm.reset();
                setIsReceiveModalOpen(false);
                setSelectedItemForAction(null);
            },
        });
    };

    const handleIssueSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        issueForm.post(route('inventory.issue'), {
            preserveScroll: true,
            onSuccess: () => {
                issueForm.reset();
                setIsIssueModalOpen(false);
                setSelectedItemForAction(null);
            },
        });
    };

    const handleAdjustSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        adjustForm.post(route('inventory.adjust'), {
            preserveScroll: true,
            onSuccess: () => {
                adjustForm.reset();
                setIsAdjustModalOpen(false);
                setSelectedItemForAction(null);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Store Overview Report - THE INNS" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* 1. Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="space-y-2 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-black uppercase tracking-wider border border-sky-400/30">
                            <Package className="w-3.5 h-3.5" />
                            <span>Central Store & Warehouse Management</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Store Overview Report
                        </h1>
                        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                            Manager operations for receiving supplier deliveries, issuing departmental requisitions, asset valuation, and audit tracking.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 relative z-10">
                        <button
                            type="button"
                            onClick={() => openReceiveModal()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                        >
                            <Truck className="w-4 h-4" />
                            <span>Receive Stock In</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => openIssueModal()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                        >
                            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                            <span>Issue Requisition</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddSkuModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Store SKU</span>
                        </button>
                    </div>

                    {/* Background Glow */}
                    <div className="absolute right-0 top-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* 2. Executive KPI Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
                    {/* Valuation */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Store Valuation</span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                                {formatTsh(metrics.total_valuation_minor)}
                            </div>
                            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                                In Warehouse Asset Value
                            </span>
                        </div>
                    </div>

                    {/* Tracked SKUs */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Tracked SKUs</span>
                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                                <Package className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                                {metrics.total_items_count} SKUs
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                                Across 6 Departments
                            </span>
                        </div>
                    </div>

                    {/* Optimal Stock */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Optimal Health</span>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-blue-700 truncate">
                                {metrics.optimal_count} Items
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                                Above Reorder Threshold
                            </span>
                        </div>
                    </div>

                    {/* Critical Alerts */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Reorder Warnings</span>
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-amber-600">
                                    {metrics.low_stock_count} Low
                                </span>
                                <span className="text-sm font-bold text-rose-600">
                                    / {metrics.depleted_count} Depleted
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                                Immediate Procurement Required
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Department Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {byDepartment.map((d) => (
                        <div
                            key={d.department_key}
                            onClick={() => {
                                setSelectedDepartment(
                                    selectedDepartment === d.department_key ? 'all' : d.department_key
                                );
                                setActiveTab('catalog');
                            }}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                selectedDepartment === d.department_key
                                    ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-xs'
                                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                            }`}
                        >
                            <div className="text-[11px] font-bold text-slate-500 truncate">{d.name}</div>
                            <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                                {d.items_count} <span className="text-xs font-semibold text-slate-400">SKUs</span>
                            </div>
                            <div className="text-[10px] font-bold text-emerald-700 mt-0.5 truncate">
                                {formatTsh(d.total_valuation_minor)}
                            </div>
                            {d.low_stock_count > 0 && (
                                <span className="inline-block mt-1 text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                    {d.low_stock_count} Reorder Alert
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* 4. Navigation Tabs */}
                <div className="bg-white rounded-2xl p-1.5 border border-slate-200 flex items-center gap-1 overflow-x-auto shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('catalog')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                            activeTab === 'catalog'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <Package className="w-4 h-4" />
                        <span>Central Store Inventory ({items.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('movements')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                            activeTab === 'movements'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Movement & Requisition Audit ({movements.length})</span>
                    </button>
                </div>

                {/* 5. Inventory Catalogue Table */}
                {activeTab === 'catalog' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
                        {/* Filters Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search central store by SKU, name, or department..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Status Filter Pills */}
                            <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                                        statusFilter === 'all'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    All ({items.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('optimal')}
                                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                                        statusFilter === 'optimal'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                    }`}
                                >
                                    Optimal ({metrics.optimal_count})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('low_stock')}
                                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                                        statusFilter === 'low_stock'
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    }`}
                                >
                                    Low Stock ({metrics.low_stock_count})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('depleted')}
                                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                                        statusFilter === 'depleted'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                                    }`}
                                >
                                    Depleted ({metrics.depleted_count})
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-100">
                                        <th className="py-3 px-3.5">SKU & Item Name</th>
                                        <th className="py-3 px-3">Department</th>
                                        <th className="py-3 px-3">Unit Cost</th>
                                        <th className="py-3 px-3">Store Balance</th>
                                        <th className="py-3 px-3">Total Valuation</th>
                                        <th className="py-3 px-3">Status</th>
                                        <th className="py-3 px-3 text-right">Manager Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400">
                                                No warehouse items found matching filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <tr
                                                key={item.id}
                                                id={`item-${item.id}`}
                                                data-highlightable="true"
                                                className="hover:bg-slate-50/60 transition"
                                            >
                                                <td className="py-3 px-3.5">
                                                    <div className="font-extrabold text-slate-900">{item.name}</div>
                                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                        {item.sku}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 font-semibold text-slate-700 capitalize">
                                                    {departments[item.department] || item.department}
                                                </td>
                                                <td className="py-3 px-3 font-medium text-slate-600">
                                                    {formatTsh(item.unit_cost_minor)}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`font-black text-xs px-2 py-0.5 rounded-lg border ${
                                                                item.status === 'depleted'
                                                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                    : item.status === 'low_stock'
                                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                            }`}
                                                        >
                                                            {item.current_quantity} {item.unit}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            (min: {item.reorder_level})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 font-extrabold text-slate-900">
                                                    {formatTsh(item.total_valuation_minor)}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span
                                                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            item.status === 'depleted'
                                                                ? 'bg-rose-100 text-rose-800'
                                                                : item.status === 'low_stock'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-emerald-100 text-emerald-800'
                                                        }`}
                                                    >
                                                        {item.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openReceiveModal(item)}
                                                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition cursor-pointer"
                                                            title="Receive inbound delivery"
                                                        >
                                                            + In
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openIssueModal(item)}
                                                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs rounded-lg border border-sky-200 transition cursor-pointer"
                                                            title="Issue requisition to department"
                                                        >
                                                            Issue Out
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openAdjustModal(item)}
                                                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                                            title="Record damaged / write-off"
                                                        >
                                                            <Wrench className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. Movement & Requisition Audit Log */}
                {activeTab === 'movements' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Central Store Requisition & Delivery Audit Trail
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Immutable historical ledger of every stock receipt, department issue, and damage adjustment
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-100">
                                        <th className="py-3 px-3.5">Timestamp</th>
                                        <th className="py-3 px-3">Item & SKU</th>
                                        <th className="py-3 px-3">Movement Type</th>
                                        <th className="py-3 px-3">Quantity</th>
                                        <th className="py-3 px-3">Department</th>
                                        <th className="py-3 px-3">Reference Slip</th>
                                        <th className="py-3 px-3">Notes</th>
                                        <th className="py-3 px-3 text-right">Performed By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {movements.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-slate-400">
                                                No warehouse movements recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/60 transition">
                                                <td className="py-3 px-3.5 text-slate-500">{m.created_at}</td>
                                                <td className="py-3 px-3">
                                                    <div className="font-bold text-slate-900">{m.item_name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{m.sku}</div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            m.movement_type === 'receive_stock'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : m.movement_type === 'issue_requisition'
                                                                ? 'bg-sky-100 text-sky-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}
                                                    >
                                                        {m.movement_type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 font-black text-sm">
                                                    {m.quantity > 0 ? (
                                                        <span className="text-emerald-600">+{m.quantity}</span>
                                                    ) : (
                                                        <span className="text-amber-700">{m.quantity}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 font-semibold text-slate-700 capitalize">
                                                    {m.department}
                                                </td>
                                                <td className="py-3 px-3 font-mono text-slate-500">{m.reference_no}</td>
                                                <td className="py-3 px-3 text-slate-600">{m.notes}</td>
                                                <td className="py-3 px-3 text-right font-semibold text-slate-800">
                                                    {m.performed_by}
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

            {/* MODAL 1: ADD NEW STORE SKU */}
            {isAddSkuModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-extrabold text-lg text-slate-900">Register New Store SKU</h3>
                            <button
                                type="button"
                                onClick={() => setIsAddSkuModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSkuSubmit} className="space-y-4 mt-4 text-xs sm:text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        SKU Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={addSkuForm.data.sku}
                                        onChange={(e) => addSkuForm.setData('sku', e.target.value)}
                                        placeholder="e.g. LIN-501"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 uppercase focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={addSkuForm.data.department}
                                        onChange={(e) => addSkuForm.setData('department', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                                    >
                                        <option value="linens">Housekeeping & Linens</option>
                                        <option value="amenities">Guest Amenities</option>
                                        <option value="kitchen">Kitchen & Provisions</option>
                                        <option value="beverage">Beverage & Bar Cellar</option>
                                        <option value="maintenance">Engineering & Maintenance</option>
                                        <option value="general">General Store</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Item Description <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={addSkuForm.data.name}
                                    onChange={(e) => addSkuForm.setData('name', e.target.value)}
                                    placeholder="e.g. Duvet Insert Microfiber Queen"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost (TZS)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={addSkuForm.data.unit_cost}
                                        onChange={(e) => addSkuForm.setData('unit_cost', e.target.value)}
                                        placeholder="e.g. 45000"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Balance</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addSkuForm.data.current_quantity}
                                        onChange={(e) => addSkuForm.setData('current_quantity', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Level</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={addSkuForm.data.reorder_level}
                                        onChange={(e) => addSkuForm.setData('reorder_level', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                                    <input
                                        type="text"
                                        value={addSkuForm.data.unit}
                                        onChange={(e) => addSkuForm.setData('unit', e.target.value)}
                                        placeholder="pcs, sets, kg, boxes, bottles"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Supplier</label>
                                    <input
                                        type="text"
                                        value={addSkuForm.data.notes}
                                        onChange={(e) => addSkuForm.setData('notes', e.target.value)}
                                        placeholder="e.g. Standard supplier Tanzania Textiles"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddSkuModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addSkuForm.processing}
                                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs"
                                >
                                    {addSkuForm.processing ? 'Registering...' : 'Register SKU'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: RECEIVE STOCK INBOUND */}
            {isReceiveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-900">Receive Stock Delivery</h3>
                                <p className="text-xs text-slate-500 font-semibold">Goods Receipt Note (GRN)</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsReceiveModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReceiveSubmit} className="space-y-4 mt-4 text-xs sm:text-sm">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Select Store Item</label>
                                <select
                                    value={receiveForm.data.item_id}
                                    onChange={(e) => {
                                        const itm = items.find((i) => i.id === e.target.value);
                                        receiveForm.setData({
                                            ...receiveForm.data,
                                            item_id: e.target.value,
                                            unit_cost: itm ? String(itm.unit_cost_minor / 100) : receiveForm.data.unit_cost,
                                        });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                >
                                    {items.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            [{i.sku}] {i.name} (Current: {i.current_quantity} {i.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Quantity Received <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={receiveForm.data.quantity}
                                        onChange={(e) => receiveForm.setData('quantity', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost (TZS)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={receiveForm.data.unit_cost}
                                        onChange={(e) => receiveForm.setData('unit_cost', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / PO Reference</label>
                                <input
                                    type="text"
                                    value={receiveForm.data.reference_no}
                                    onChange={(e) => receiveForm.setData('reference_no', e.target.value)}
                                    placeholder="e.g. GRN-2026-8802"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Notes</label>
                                <input
                                    type="text"
                                    value={receiveForm.data.notes}
                                    onChange={(e) => receiveForm.setData('notes', e.target.value)}
                                    placeholder="e.g. Delivered in good condition"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsReceiveModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={receiveForm.processing}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                                >
                                    {receiveForm.processing ? 'Receiving...' : 'Confirm Delivery'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: ISSUE REQUISITION (OUTBOUND) */}
            {isIssueModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-900">Issue Requisition</h3>
                                <p className="text-xs text-slate-500 font-semibold">Stock Requisition Slip</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsIssueModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleIssueSubmit} className="space-y-4 mt-4 text-xs sm:text-sm">
                            {issueForm.errors.quantity && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                                    {issueForm.errors.quantity}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Select Item to Issue</label>
                                <select
                                    value={issueForm.data.item_id}
                                    onChange={(e) => issueForm.setData('item_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                >
                                    {items.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            [{i.sku}] {i.name} — Balance: {i.current_quantity} {i.unit}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Quantity to Issue <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={issueForm.data.quantity}
                                        onChange={(e) => issueForm.setData('quantity', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Destination Department <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={issueForm.data.department}
                                        onChange={(e) => issueForm.setData('department', e.target.value)}
                                        placeholder="e.g. Housekeeping Floor 2"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Received By (Staff Name)</label>
                                <input
                                    type="text"
                                    value={issueForm.data.recipient_name}
                                    onChange={(e) => issueForm.setData('recipient_name', e.target.value)}
                                    placeholder="e.g. Baraka John (Housekeeping)"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Requisition Slip #</label>
                                <input
                                    type="text"
                                    value={issueForm.data.reference_no}
                                    onChange={(e) => issueForm.setData('reference_no', e.target.value)}
                                    placeholder="e.g. REQ-2026-0042"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsIssueModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={issueForm.processing}
                                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs"
                                >
                                    {issueForm.processing ? 'Issuing...' : 'Issue Requisition'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: DAMAGE / ADJUSTMENT WRITE-OFF */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-900">Stock Adjustment / Write-Off</h3>
                                <p className="text-xs text-slate-500 font-semibold">Damage, Breakage & Loss Audit</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAdjustModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="space-y-4 mt-4 text-xs sm:text-sm">
                            {adjustForm.errors.quantity && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                                    {adjustForm.errors.quantity}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Select Item</label>
                                <select
                                    value={adjustForm.data.item_id}
                                    onChange={(e) => adjustForm.setData('item_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                >
                                    {items.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            [{i.sku}] {i.name} (Current: {i.current_quantity} {i.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Type</label>
                                    <select
                                        value={adjustForm.data.adjustment_type}
                                        onChange={(e) => adjustForm.setData('adjustment_type', e.target.value as any)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    >
                                        <option value="damage">Damaged / Broken</option>
                                        <option value="shrinkage">Loss / Shrinkage</option>
                                        <option value="audit_correction">Audit Correction</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Quantity Deducted <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={adjustForm.data.quantity}
                                        onChange={(e) => adjustForm.setData('quantity', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Audit Reason / Investigation Notes <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={adjustForm.data.notes}
                                    onChange={(e) => adjustForm.setData('notes', e.target.value)}
                                    placeholder="Explain cause of damage or variance..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAdjustModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustForm.processing}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
                                >
                                    {adjustForm.processing ? 'Adjusting...' : 'Record Adjustment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
