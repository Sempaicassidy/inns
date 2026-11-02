import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Check,
    CheckCircle2,
    DollarSign,
    Edit3,
    Eye,
    Filter,
    Package,
    Plus,
    Printer,
    RefreshCw,
    Search,
    ShoppingBag,
    ShoppingCart,
    Tag,
    Trash2,
    TrendingUp,
    Truck,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface GroceryItem {
    id: string;
    name: string;
    code: string;
    pos_category_id: string;
    category_name: string;
    price_minor: number;
    cost_price_minor: number;
    stock_quantity: number;
    reorder_level: number;
    unit: string;
    is_available: boolean;
    margin_pct: number;
    stock_valuation_minor: number;
    status: 'optimal' | 'low_stock' | 'out_of_stock';
}

interface PosCategoryItem {
    id: string;
    name: string;
    icon?: string;
}

interface GroceryOrder {
    id: string;
    order_number: string;
    order_type: string;
    table_number?: string;
    room_number: string;
    guest_name: string;
    total_minor: number;
    payment_method: string;
    payment_status: string;
    status: string;
    items_count: number;
    created_at: string;
}

interface StockMovementItem {
    id: string;
    item_name: string;
    movement_type: string;
    quantity: number;
    reference_no: string;
    notes: string;
    performed_by: string;
    created_at: string;
}

interface CategoryBreakdownItem {
    id: string;
    name: string;
    items_count: number;
    cost_valuation_minor: number;
    retail_valuation_minor: number;
    margin_profit_minor: number;
    low_stock_count: number;
    out_of_stock_count: number;
}

interface TopSellingItem {
    item_name: string;
    total_qty: number;
    total_sales_minor: number;
}

interface GroceryIndexProps extends PageProps {
    metrics: {
        today_revenue_minor: number;
        month_revenue_minor: number;
        total_cost_valuation_minor: number;
        total_retail_valuation_minor: number;
        total_skus: number;
        low_stock_count: number;
        out_of_stock_count: number;
        optimal_count: number;
    };
    items: GroceryItem[];
    categories: PosCategoryItem[];
    allCategories: PosCategoryItem[];
    categoryBreakdown?: CategoryBreakdownItem[];
    topSelling?: TopSellingItem[];
    recentOrders: GroceryOrder[];
    recentMovements: StockMovementItem[];
    activeStays?: { stay_id: string; room_number: string; guest_name: string; folio_id?: string }[];
}

export default function GroceryIndex({
    metrics,
    items = [],
    categories = [],
    allCategories = [],
    categoryBreakdown = [],
    topSelling = [],
    recentOrders = [],
    recentMovements = [],
    activeStays = [],
}: GroceryIndexProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'sales' | 'movements'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'optimal' | 'low_stock' | 'out_of_stock'>('all');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [selectedItemForAction, setSelectedItemForAction] = useState<GroceryItem | null>(null);

    // Retail Sale Form
    const saleForm = useForm({
        payment_method: 'cash' as 'cash' | 'card' | 'mpesa' | 'room_folio',
        folio_id: '',
        room_id: '',
        guest_name: 'Walk-In Customer',
        items: [{ item_id: items[0]?.id || '', quantity: 1 }],
        notes: '',
    });

    // Add Product Form
    const addForm = useForm({
        pos_category_id: categories[0]?.id || allCategories[0]?.id || '',
        name: '',
        code: '',
        price: '',
        cost_price: '',
        stock_quantity: 50,
        reorder_level: 10,
        unit: 'pcs',
    });

    // Restock Form
    const restockForm = useForm({
        add_quantity: 20,
        unit_cost: '',
        reference_no: '',
        notes: '',
    });

    // Edit Item Form
    const editForm = useForm({
        name: '',
        code: '',
        price: '',
        cost_price: '',
        reorder_level: 10,
        unit: 'pcs',
        is_available: true,
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
                item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category_name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategory === 'all' || item.pos_category_id === selectedCategory;

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [items, searchQuery, selectedCategory, statusFilter]);

    // Handlers
    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(route('grocery.items.store'), {
            preserveScroll: true,
            onSuccess: () => {
                addForm.reset();
                setIsAddModalOpen(false);
            },
        });
    };

    const openRestockModal = (item: GroceryItem) => {
        setSelectedItemForAction(item);
        restockForm.setData({
            add_quantity: 20,
            unit_cost: String(item.cost_price_minor / 100),
            reference_no: `PO-GR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            notes: `Restocked ${item.name}`,
        });
        setIsRestockModalOpen(true);
    };

    const handleRestockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemForAction) return;

        restockForm.post(route('grocery.items.restock', selectedItemForAction.id), {
            preserveScroll: true,
            onSuccess: () => {
                restockForm.reset();
                setIsRestockModalOpen(false);
                setSelectedItemForAction(null);
            },
        });
    };

    const openEditModal = (item: GroceryItem) => {
        setSelectedItemForAction(item);
        editForm.setData({
            name: item.name,
            code: item.code,
            price: String(item.price_minor / 100),
            cost_price: String(item.cost_price_minor / 100),
            reorder_level: item.reorder_level,
            unit: item.unit,
            is_available: item.is_available,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemForAction) return;

        editForm.put(route('grocery.items.update', selectedItemForAction.id), {
            preserveScroll: true,
            onSuccess: () => {
                editForm.reset();
                setIsEditModalOpen(false);
                setSelectedItemForAction(null);
            },
        });
    };

    const handleToggleAvailability = (item: GroceryItem) => {
        router.post(
            route('grocery.items.toggle', item.id),
            {},
            { preserveScroll: true }
        );
    };

    const handleSaleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saleForm.post(route('grocery.orders.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaleModalOpen(false);
                saleForm.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Grocery Overview Report - THE INNS" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* 1. Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                                    Grocery Overview Report
                                </h1>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                                    Executive Retail Management
                                </span>
                            </div>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed mt-1">
                            Manager portal for retail pricing, shelf replenishment, gross profit margins, stock auditing, and cashier reconciliation.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>Add Product</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (items.length > 0) openRestockModal(items[0]);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                        >
                            <Truck className="w-4 h-4" />
                            <span>Restock Inbound</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                saleForm.reset();
                                setIsSaleModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs sm:text-sm rounded-xl transition active:scale-95 cursor-pointer"
                            title="Ring up walk-in counter retail sale"
                        >
                            <ShoppingCart className="w-4 h-4 text-emerald-600" />
                            <span>New Retail Sale</span>
                        </button>
                    </div>
                </div>

                {/* 2. Executive KPI Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
                    {/* Today Sales */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Today Sales</span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                                {formatTsh(metrics.today_revenue_minor)}
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                                <ArrowUpRight className="w-3.5 h-3.5" /> Retail Turnover
                            </span>
                        </div>
                    </div>

                    {/* Month Sales */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Month-to-Date</span>
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                                {formatTsh(metrics.month_revenue_minor)}
                            </div>
                            <span className="text-[11px] font-semibold text-indigo-600 mt-1 block">
                                Current Calendar Month
                            </span>
                        </div>
                    </div>

                    {/* Stock Valuation */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Inventory Valuation</span>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Package className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                                {formatTsh(metrics.total_cost_valuation_minor)}
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                                Cost Value ({metrics.total_skus} Active SKUs)
                            </span>
                        </div>
                    </div>

                    {/* Stock Health Alerts */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Stock Alerts</span>
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
                                    / {metrics.out_of_stock_count} Depleted
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                                Needs Reorder Attention
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Navigation Tabs */}
                <div className="bg-white rounded-2xl p-1.5 border border-slate-200 flex items-center gap-1 overflow-x-auto shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'overview'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        <span>Executive Overview Report</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('inventory')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'inventory'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <Package className="w-4 h-4" />
                        <span>Product Catalog & Stock ({items.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('sales')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'sales'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Recent Retail Sales Orders ({recentOrders.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('movements')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'movements'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Stock Movement Audit ({recentMovements.length})</span>
                    </button>
                </div>

                {/* 4. Tab Contents */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Overview Top Section: Category Margins & Top Sellers */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Category Breakdown (7 cols) */}
                            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div>
                                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                            Category Valuation & Margin Breakdown
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Asset value, projected retail turnover and margin by grocery department
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add SKU</span>
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                                <th className="py-2.5 px-3">Category</th>
                                                <th className="py-2.5 px-3 text-center">Items</th>
                                                <th className="py-2.5 px-3 text-right">Cost Value</th>
                                                <th className="py-2.5 px-3 text-right">Retail Value</th>
                                                <th className="py-2.5 px-3 text-right">Margin Profit</th>
                                                <th className="py-2.5 px-3 text-center">Health</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {categoryBreakdown.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-6 text-center text-slate-400">
                                                        No grocery categories configured yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                categoryBreakdown.map((cat) => (
                                                    <tr key={cat.id} className="hover:bg-slate-50/70 transition">
                                                        <td className="py-3 px-3 font-bold text-slate-900">{cat.name}</td>
                                                        <td className="py-3 px-3 text-center font-mono text-slate-600">{cat.items_count}</td>
                                                        <td className="py-3 px-3 text-right font-mono text-slate-700">{formatTsh(cat.cost_valuation_minor)}</td>
                                                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatTsh(cat.retail_valuation_minor)}</td>
                                                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">+{formatTsh(cat.margin_profit_minor)}</td>
                                                        <td className="py-3 px-3 text-center">
                                                            {cat.out_of_stock_count > 0 ? (
                                                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                                                                    {cat.out_of_stock_count} Out
                                                                </span>
                                                            ) : cat.low_stock_count > 0 ? (
                                                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                                                                    {cat.low_stock_count} Low
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                                                    Optimal
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Top Selling Retail Items (5 cols) */}
                            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                                <div className="border-b border-slate-100 pb-3">
                                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                        Top Selling Retail Products
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Best-selling merchandise by volume and revenue
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {topSelling.length === 0 ? (
                                        <div className="py-8 text-center text-slate-400 text-xs">
                                            No completed retail sales recorded yet today.
                                        </div>
                                    ) : (
                                        topSelling.map((top, idx) => (
                                            <div key={top.item_name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                                                        #{idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">{top.item_name}</div>
                                                        <div className="text-[10px] text-slate-400">Sold: {top.total_qty} units</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-slate-900">{formatTsh(top.total_sales_minor)}</div>
                                                    <div className="text-[10px] text-emerald-600 font-bold">Revenue</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Reorder and Stock Depletion Alert Panel */}
                        <div className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-5 sm:p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm sm:text-base">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    <span>Manager Stock Reorder Alerts</span>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-200/70 text-amber-900">
                                    {metrics.low_stock_count + metrics.out_of_stock_count} SKUs Require Action
                                </span>
                            </div>
                            <p className="text-xs text-amber-700/90">
                                Products currently below safe inventory buffer. Restock promptly to prevent retail lost sales.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                {items
                                    .filter((i) => i.status !== 'optimal')
                                    .slice(0, 6)
                                    .map((i) => (
                                        <div key={i.id} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">{i.name}</div>
                                                <div className="text-[10px] text-slate-400">
                                                    Stock: <span className="font-bold text-rose-600">{i.stock_quantity}</span> / Buffer: {i.reorder_level} {i.unit}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openRestockModal(i)}
                                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
                                            >
                                                Restock
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
                        {/* Filters Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products by name, barcode, or category..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500"
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
                                    onClick={() => setStatusFilter('out_of_stock')}
                                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                                        statusFilter === 'out_of_stock'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                                    }`}
                                >
                                    Depleted ({metrics.out_of_stock_count})
                                </button>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-100">
                                        <th className="py-3 px-3.5">Product & SKU</th>
                                        <th className="py-3 px-3">Cost Price</th>
                                        <th className="py-3 px-3">Selling Price</th>
                                        <th className="py-3 px-3">Margin %</th>
                                        <th className="py-3 px-3">Stock Balance</th>
                                        <th className="py-3 px-3">Total Value</th>
                                        <th className="py-3 px-3">Available</th>
                                        <th className="py-3 px-3 text-right">Manager Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-slate-400">
                                                No grocery products found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/60 transition">
                                                <td className="py-3 px-3.5">
                                                    <div className="font-bold text-slate-900">{item.name}</div>
                                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                        {item.code} • {item.category_name}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 font-medium text-slate-600">
                                                    {formatTsh(item.cost_price_minor)}
                                                </td>
                                                <td className="py-3 px-3 font-extrabold text-slate-900">
                                                    {formatTsh(item.price_minor)}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 rounded-md font-black text-[10px] ${
                                                            item.margin_pct >= 40
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : item.margin_pct >= 20
                                                                ? 'bg-indigo-100 text-indigo-800'
                                                                : 'bg-amber-100 text-amber-800'
                                                        }`}
                                                    >
                                                        {item.margin_pct}%
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`font-black text-xs px-2 py-0.5 rounded-lg border ${
                                                                item.status === 'out_of_stock'
                                                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                    : item.status === 'low_stock'
                                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                            }`}
                                                        >
                                                            {item.stock_quantity} {item.unit}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            (min: {item.reorder_level})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 font-bold text-slate-700">
                                                    {formatTsh(item.stock_valuation_minor)}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleAvailability(item)}
                                                        className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                                                            item.is_available ? 'bg-emerald-600' : 'bg-slate-300'
                                                        }`}
                                                        title="Click to toggle shelf availability"
                                                    >
                                                        <span
                                                            className={`w-3 h-3 rounded-full bg-white transition-transform shadow-xs ${
                                                                item.is_available ? 'translate-x-3' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openRestockModal(item)}
                                                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition cursor-pointer"
                                                        >
                                                            + Restock
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(item)}
                                                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                                            title="Edit pricing and details"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
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

                {/* 5. Sales Orders Audit Table */}
                {activeTab === 'sales' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Recent Retail & Grocery Sales Orders
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Transaction ledger of all grocery minimart sales, room charges, and cash collections
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-100">
                                        <th className="py-3 px-3.5">Order #</th>
                                        <th className="py-3 px-3">Date & Time</th>
                                        <th className="py-3 px-3">Guest / Room</th>
                                        <th className="py-3 px-3">Items</th>
                                        <th className="py-3 px-3">Total Amount</th>
                                        <th className="py-3 px-3">Payment Method</th>
                                        <th className="py-3 px-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400">
                                                No grocery sales recorded yet today.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-slate-50/60 transition">
                                                <td className="py-3 px-3.5 font-bold text-indigo-700 font-mono">
                                                    {order.order_number}
                                                </td>
                                                <td className="py-3 px-3 text-slate-500">{order.created_at}</td>
                                                <td className="py-3 px-3 font-semibold text-slate-800">
                                                    {order.guest_name}
                                                    {order.room_number !== 'Walk-In' && (
                                                        <span className="text-[11px] text-slate-400 block font-normal">
                                                            Room {order.room_number}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-slate-600 font-medium">
                                                    {order.items_count} items
                                                </td>
                                                <td className="py-3 px-3 font-black text-slate-900">
                                                    {formatTsh(order.total_minor)}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                                        {order.payment_method.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                                        {order.payment_status}
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

                {/* 6. Stock Movements Audit Table */}
                {activeTab === 'movements' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Stock Inbound & Adjustment Audit Log
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Manager verification of all shelf stock replenishment and inventory receipts
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-100">
                                        <th className="py-3 px-3.5">Date</th>
                                        <th className="py-3 px-3">Product</th>
                                        <th className="py-3 px-3">Type</th>
                                        <th className="py-3 px-3">Quantity</th>
                                        <th className="py-3 px-3">Reference</th>
                                        <th className="py-3 px-3">Notes</th>
                                        <th className="py-3 px-3 text-right">Performed By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentMovements.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400">
                                                No stock movements recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentMovements.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/60 transition">
                                                <td className="py-3 px-3.5 text-slate-500">{m.created_at}</td>
                                                <td className="py-3 px-3 font-bold text-slate-900">{m.item_name}</td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                                                        {m.movement_type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 font-black text-emerald-600">
                                                    +{m.quantity}
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

            {/* MODAL 1: ADD PRODUCT */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-extrabold text-lg text-slate-900">Add New Grocery Product</h3>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddProduct} className="space-y-4 mt-4 text-xs sm:text-sm">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={addForm.data.name}
                                    onChange={(e) => addForm.setData('name', e.target.value)}
                                    placeholder="e.g. Serengeti Spring Water 1L"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Barcode</label>
                                    <input
                                        type="text"
                                        value={addForm.data.code}
                                        onChange={(e) => addForm.setData('code', e.target.value)}
                                        placeholder="e.g. GRO-WAT-09"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={addForm.data.pos_category_id}
                                        onChange={(e) => addForm.setData('pos_category_id', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                                    >
                                        {allCategories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Selling Price (TZS) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={addForm.data.price}
                                        onChange={(e) => addForm.setData('price', e.target.value)}
                                        placeholder="e.g. 2500"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (TZS)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addForm.data.cost_price}
                                        onChange={(e) => addForm.setData('cost_price', e.target.value)}
                                        placeholder="e.g. 1500"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addForm.data.stock_quantity}
                                        onChange={(e) => addForm.setData('stock_quantity', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Level</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={addForm.data.reorder_level}
                                        onChange={(e) => addForm.setData('reorder_level', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                                    <input
                                        type="text"
                                        value={addForm.data.unit}
                                        onChange={(e) => addForm.setData('unit', e.target.value)}
                                        placeholder="pcs, bottle, can"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addForm.processing}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                                >
                                    {addForm.processing ? 'Saving...' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: RESTOCK INBOUND */}
            {isRestockModalOpen && selectedItemForAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-900">Restock Product</h3>
                                <p className="text-xs text-slate-500 font-semibold">{selectedItemForAction.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRestockModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRestockSubmit} className="space-y-4 mt-4 text-xs sm:text-sm">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Current Shelf Balance:</span>
                                <span className="font-black text-slate-900 text-sm">
                                    {selectedItemForAction.stock_quantity} {selectedItemForAction.unit}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Quantity to Add <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={restockForm.data.add_quantity}
                                        onChange={(e) => restockForm.setData('add_quantity', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Cost / Unit (TZS)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={restockForm.data.unit_cost}
                                        onChange={(e) => restockForm.setData('unit_cost', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">PO / Delivery Reference</label>
                                <input
                                    type="text"
                                    value={restockForm.data.reference_no}
                                    onChange={(e) => restockForm.setData('reference_no', e.target.value)}
                                    placeholder="e.g. INV-2026-9901"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Supplier</label>
                                <input
                                    type="text"
                                    value={restockForm.data.notes}
                                    onChange={(e) => restockForm.setData('notes', e.target.value)}
                                    placeholder="e.g. Delivered by Dar Bottlers"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsRestockModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={restockForm.processing}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                                >
                                    {restockForm.processing ? 'Receiving...' : 'Confirm Restock'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: EDIT PRICING & ITEM */}
            {isEditModalOpen && selectedItemForAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-extrabold text-lg text-slate-900">Edit Product Pricing</h3>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs sm:text-sm">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (TZS)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={editForm.data.price}
                                        onChange={(e) => editForm.setData('price', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (TZS)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.data.cost_price}
                                        onChange={(e) => editForm.setData('cost_price', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Threshold</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editForm.data.reorder_level}
                                        onChange={(e) => editForm.setData('reorder_level', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                                    <input
                                        type="text"
                                        value={editForm.data.unit}
                                        onChange={(e) => editForm.setData('unit', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                                >
                                    {editForm.processing ? 'Saving...' : 'Update Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: NEW RETAIL COUNTER SALE */}
            {isSaleModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                                Record Grocery Retail Counter Sale
                            </h3>
                            <button
                                onClick={() => setIsSaleModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaleSubmit} className="space-y-4 text-xs">
                            {/* Product Select */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Select Retail Product
                                </label>
                                <select
                                    value={saleForm.data.items[0]?.item_id}
                                    onChange={(e) => {
                                        const newItemId = e.target.value;
                                        saleForm.setData('items', [{ item_id: newItemId, quantity: saleForm.data.items[0]?.quantity || 1 }]);
                                    }}
                                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                                    required
                                >
                                    {items.filter(i => i.is_available).map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.code}) — {formatTsh(item.price_minor)} (Stock: {item.stock_quantity})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={saleForm.data.items[0]?.quantity || 1}
                                        onChange={(e) => {
                                            const qty = Math.max(1, parseInt(e.target.value) || 1);
                                            saleForm.setData('items', [{ item_id: saleForm.data.items[0]?.item_id || items[0]?.id || '', quantity: qty }]);
                                        }}
                                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Payment Method
                                    </label>
                                    <select
                                        value={saleForm.data.payment_method}
                                        onChange={(e) => saleForm.setData('payment_method', e.target.value as any)}
                                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Credit / Debit Card</option>
                                        <option value="mpesa">M-Pesa / Mobile Money</option>
                                        <option value="room_folio">Post to Room Folio</option>
                                    </select>
                                </div>
                            </div>

                            {/* If Room Folio, show room selector */}
                            {saleForm.data.payment_method === 'room_folio' && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Guest Room Folio
                                    </label>
                                    <select
                                        value={saleForm.data.folio_id}
                                        onChange={(e) => {
                                            const selectedStay = activeStays.find(s => s.folio_id === e.target.value);
                                            saleForm.setData({
                                                ...saleForm.data,
                                                folio_id: e.target.value,
                                                room_id: selectedStay?.room_number || '',
                                                guest_name: selectedStay?.guest_name || 'In-House Guest',
                                            });
                                        }}
                                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                                        required
                                    >
                                        <option value="">-- Select Active Guest Room --</option>
                                        {activeStays.map((stay) => (
                                            <option key={stay.stay_id} value={stay.folio_id}>
                                                Room {stay.room_number} — {stay.guest_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Customer Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={saleForm.data.guest_name}
                                    onChange={(e) => saleForm.setData('guest_name', e.target.value)}
                                    placeholder="Walk-In Customer"
                                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Estimated Total Display */}
                            {(() => {
                                const selectedItem = items.find(i => i.id === saleForm.data.items[0]?.item_id);
                                const qty = saleForm.data.items[0]?.quantity || 1;
                                const total = selectedItem ? selectedItem.price_minor * qty : 0;
                                return (
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 flex items-center justify-between">
                                        <span className="font-bold text-emerald-800">Total Receipt Amount</span>
                                        <span className="text-base font-black text-emerald-900">{formatTsh(total)}</span>
                                    </div>
                                );
                            })()}

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsSaleModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saleForm.processing}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                                >
                                    Complete Sale
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

