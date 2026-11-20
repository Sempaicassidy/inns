import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReceiptModal from '@/Components/ReceiptModal';
import type { ReceiptData } from '@/Utils/receiptPrinter';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    DollarSign,
    Edit3,
    FileSpreadsheet,
    Package,
    PackageX,
    Plus,
    Printer,
    Receipt,
    RefreshCw,
    Search,
    ShoppingBag,
    ShoppingCart,
    Tag,
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

interface TopItem {
    name: string;
    quantity: number;
    total_minor: number;
}

interface PaymentBreakdown {
    method: string;
    orders_count: number;
    total_minor: number;
}

interface RecentOrderItem {
    id: string;
    item_name: string;
    quantity: number;
    unit_price_minor: number;
    total_minor: number;
}

interface RecentOrder {
    id: string;
    order_number: string;
    order_type?: string;
    table_number?: string;
    guest_name: string;
    room_number: string | null;
    total_minor: number;
    subtotal_minor?: number;
    tax_minor?: number;
    payment_method: string;
    payment_status: string;
    items_count: number;
    created_at: string;
    raw_created_at?: string;
    items?: RecentOrderItem[];
}

interface StockMovementItem {
    id: string;
    item_name: string;
    movement_type: string;
    quantity: number;
    unit_cost_minor: number;
    reference_no: string;
    notes: string;
    performed_by: string;
    created_at: string;
}

interface GroceryDashboardProps extends PageProps {
    stats: {
        today_revenue_minor: number;
        month_revenue_minor: number;
        today_order_count: number;
        items_sold_today: number;
        total_skus: number;
        in_stock_count?: number;
        low_stock_count?: number;
        out_of_stock_count?: number;
        optimal_count?: number;
        total_cost_valuation_minor?: number;
        total_retail_valuation_minor?: number;
    };
    items?: GroceryItem[];
    categories?: PosCategoryItem[];
    categoryBreakdown?: CategoryBreakdownItem[];
    topItemsToday?: TopItem[];
    paymentBreakdown?: PaymentBreakdown[];
    lowStockItems?: GroceryItem[];
    recentOrders?: RecentOrder[];
    recentMovements?: StockMovementItem[];
}

const METHOD_LABELS: Record<string, string> = {
    cash: 'Cash Tender',
    mpesa: 'M-Pesa (Vodacom)',
    airtel_money: 'Airtel Money',
    tigopesa: 'Tigo Pesa',
    card: 'Credit / Debit Card',
    bank_transfer: 'Bank Transfer / CRDB / NMB',
    room_folio: 'Charged to Room Folio',
    posted_to_room: 'Charged to Room Folio',
};

export default function GroceryDashboard({
    auth,
    stats,
    items = [],
    categories = [],
    categoryBreakdown = [],
    topItemsToday = [],
    paymentBreakdown = [],
    lowStockItems = [],
    recentOrders = [],
    recentMovements = [],
}: GroceryDashboardProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'sales' | 'movements'>('overview');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItemForAction, setSelectedItemForAction] = useState<GroceryItem | null>(null);

    // Thermal Receipt Modal
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

    // Inventory Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'optimal' | 'low_stock' | 'out_of_stock'>('all');

    // Sales Filtering
    const [salesSearch, setSalesSearch] = useState('');

    const formatCurrency = (minor: number) =>
        new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format((minor || 0) / 100);

    // Safe stats calculation
    const totalSkus = stats.total_skus || items.length;
    const inStockCount = stats.in_stock_count ?? items.filter((i) => (i.stock_quantity || 0) > 0).length;
    const outOfStockCount = stats.out_of_stock_count ?? items.filter((i) => (i.stock_quantity || 0) <= 0).length;
    const lowStockCount = stats.low_stock_count ?? items.filter((i) => (i.stock_quantity || 0) > 0 && (i.stock_quantity || 0) <= (i.reorder_level || 10)).length;
    const optimalCount = stats.optimal_count ?? items.filter((i) => (i.stock_quantity || 0) > (i.reorder_level || 10)).length;
    const totalCostValuation = stats.total_cost_valuation_minor ?? items.reduce((acc, i) => acc + (i.stock_valuation_minor || 0), 0);
    const totalRetailValuation = stats.total_retail_valuation_minor ?? items.reduce((acc, i) => acc + (i.price_minor * (i.stock_quantity || 0)), 0);

    // Filtered Items for Catalog Tab
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category_name?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategory === 'all' || item.pos_category_id === selectedCategory;

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [items, searchQuery, selectedCategory, statusFilter]);

    // Filtered Recent Orders
    const filteredOrders = useMemo(() => {
        return recentOrders.filter((order) => {
            if (!salesSearch) return true;
            const q = salesSearch.toLowerCase();
            return (
                order.order_number.toLowerCase().includes(q) ||
                (order.guest_name && order.guest_name.toLowerCase().includes(q)) ||
                (order.room_number && order.room_number.toLowerCase().includes(q))
            );
        });
    }, [recentOrders, salesSearch]);

    // Forms
    const addForm = useForm({
        pos_category_id: categories[0]?.id || '',
        name: '',
        code: '',
        price: '',
        cost_price: '',
        stock_quantity: 0,
        reorder_level: 10,
        unit: 'pcs',
    });

    const restockForm = useForm({
        add_quantity: 20,
        unit_cost: '',
        reference_no: '',
        notes: '',
    });

    const editForm = useForm({
        name: '',
        code: '',
        price: '',
        cost_price: '',
        reorder_level: 10,
        unit: 'pcs',
        is_available: true,
    });

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
            add_quantity: 24,
            unit_cost: item.cost_price_minor > 0 ? String(item.cost_price_minor / 100) : '',
            reference_no: `INBOUND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            notes: `Restock delivery for ${item.name}`,
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
            cost_price: String((item.cost_price_minor || 0) / 100),
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

    const handleOpenReceipt = (order: RecentOrder) => {
        const lineItems = (order.items && order.items.length > 0)
            ? order.items.map((i) => ({
                  description: i.item_name,
                  quantity: i.quantity,
                  unit_price: i.unit_price_minor,
                  amount: i.total_minor,
              }))
            : [
                  {
                      description: 'Supermarket Grocery Purchase',
                      quantity: order.items_count || 1,
                      unit_price: order.total_minor,
                      amount: order.total_minor,
                  },
              ];

        setReceiptData({
            hotelName: auth?.tenant?.name || 'SUPER / MINI MARKET',
            receiptNumber: order.order_number,
            receiptType: 'POS RECEIPT',
            dateTime: order.created_at,
            guestName: order.guest_name,
            roomNumber: order.room_number || undefined,
            tableName: order.table_number || undefined,
            paymentMethod: METHOD_LABELS[order.payment_method] || order.payment_method,
            items: lineItems,
            subtotal: order.subtotal_minor ?? order.total_minor,
            tax: order.tax_minor ?? 0,
            grandTotal: order.total_minor,
            amountsAreMinor: true,
            cashierName: auth?.user?.name || 'Store Cashier',
        });
    };

    const kpis = [
        {
            label: "Today's Sales",
            value: formatCurrency(stats.today_revenue_minor),
            subtext: `${stats.today_order_count || 0} orders · ${stats.items_sold_today || 0} items sold`,
            icon: TrendingUp,
            tone: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        },
        {
            label: 'Month Revenue',
            value: formatCurrency(stats.month_revenue_minor),
            subtext: 'Month-to-Date Collections',
            icon: BarChart3,
            tone: 'text-blue-600 bg-blue-50 border-blue-100',
        },
        {
            label: 'Inventory Asset Value',
            value: formatCurrency(totalCostValuation),
            subtext: `Retail Turnover: ${formatCurrency(totalRetailValuation)}`,
            icon: DollarSign,
            tone: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        },
        {
            label: 'Catalog SKUs',
            value: `${totalSkus} Items`,
            subtext: `${categories.length || 0} product categories`,
            icon: ShoppingBag,
            tone: 'text-slate-700 bg-slate-100 border-slate-200',
        },
        {
            label: 'Available in Buffer',
            value: `${inStockCount} In Stock`,
            subtext: optimalCount > 0 ? `${optimalCount} optimal shelf buffer` : 'Critical buffer warning',
            icon: Package,
            tone: inStockCount > 0 ? 'text-teal-600 bg-teal-50 border-teal-100' : 'text-slate-400 bg-slate-100 border-slate-200',
        },
        {
            label: 'Stock Health Alerts',
            value: `${outOfStockCount + lowStockCount} Alerts`,
            subtext: `${outOfStockCount} Out of Stock · ${lowStockCount} Low`,
            icon: AlertTriangle,
            tone: (outOfStockCount + lowStockCount) > 0 ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-400 bg-slate-100 border-slate-200',
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Super / Mini Market - Duka & Usimamizi wa Stoo" />

            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* 1. Header Banner with Complete Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                                    Super / Mini Market
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold">
                                        Retail POS & Stock Hub
                                    </span>
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                                    Mauzo, orodha ya bidhaa, udhibiti wa stoo na faida — {auth?.tenant?.name ?? 'Store Outlet'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            href={route('grocery.pos')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
                            title="Fungua POS terminal kwa ajili ya mauzo ya haraka ya dukani"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Open POS Terminal</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>Add Product (SKU)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (items.length > 0) openRestockModal(items[0]);
                                else setIsAddModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
                        >
                            <Truck className="w-4 h-4" />
                            <span>Restock Inbound</span>
                        </button>
                        <Link
                            href={route('data-entry.index')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer"
                            title="Ingiza au pakua bidhaa zote kwa Excel / CSV"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>CSV Import / Export</span>
                        </Link>
                    </div>
                </div>

                {/* 2. Executive KPI Summary Cards (Clean, Un-truncated) */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                    {kpis.map((kpi) => (
                        <div
                            key={kpi.label}
                            className={`bg-white rounded-2xl border p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between ${kpi.tone.split(' ')[2] || 'border-slate-200'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    {kpi.label}
                                </span>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpi.tone}`}>
                                    <kpi.icon className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm sm:text-base xl:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap overflow-x-auto no-scrollbar">
                                    {kpi.value}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-tight">
                                    {kpi.subtext}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Navigation Tabs */}
                <div className="bg-white rounded-2xl p-1.5 border border-slate-200 flex items-center gap-1.5 overflow-x-auto shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'overview'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        <span>Overview & Financial Margins</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('inventory')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'inventory'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <Package className="w-4 h-4" />
                        <span>Product Inventory & Stock ({items.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('sales')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'sales'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <Receipt className="w-4 h-4" />
                        <span>Sales Orders & Receipts ({recentOrders.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('movements')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                            activeTab === 'movements'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Stock Movement Audit ({recentMovements.length})</span>
                    </button>
                </div>

                {/* 4. Tab 1: Overview & Margins */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* 3 Columns: Top Items, Payments, Interactive Stock Alerts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Column 1: Top Items Today */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            <h2 className="font-extrabold text-slate-900 text-sm">Top Items Today</h2>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Best Sellers
                                        </span>
                                    </div>
                                    {(!topItemsToday || topItemsToday.length === 0) ? (
                                        <div className="px-5 py-12 text-center text-xs text-slate-400">
                                            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            Hakuna mauzo ya bidhaa bado leo.
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-slate-100">
                                            {topItemsToday.map((item, idx) => (
                                                <li key={item.name} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition">
                                                    <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 text-xs font-black flex items-center justify-center">
                                                        #{idx + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                                                        <p className="text-[11px] text-slate-400 font-medium">{item.quantity} units sold today</p>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900">{formatCurrency(item.total_minor)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Payment Breakdown */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="w-4 h-4 text-blue-500" />
                                            <h2 className="font-extrabold text-slate-900 text-sm">Payments Today</h2>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Tender Breakdown
                                        </span>
                                    </div>
                                    {(!paymentBreakdown || paymentBreakdown.length === 0) ? (
                                        <div className="px-5 py-12 text-center text-xs text-slate-400">
                                            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            Hakuna miamala ya malipo iliyopokelewa leo.
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-slate-100">
                                            {paymentBreakdown.map((p) => (
                                                <li key={p.method} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">{METHOD_LABELS[p.method] ?? p.method}</p>
                                                        <p className="text-[11px] text-slate-400 font-medium">{p.orders_count} transactions</p>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900">{formatCurrency(p.total_minor)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Column 3: Interactive Stock Alerts with 1-Click Restock */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/30">
                                        <div className="flex items-center gap-2">
                                            <PackageX className="w-4 h-4 text-rose-500" />
                                            <h2 className="font-extrabold text-slate-900 text-sm">Stock Alerts</h2>
                                        </div>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                            {lowStockItems.length} Depleted / Low
                                        </span>
                                    </div>
                                    {(!lowStockItems || lowStockItems.length === 0) ? (
                                        <div className="px-5 py-12 text-center text-xs text-slate-400">
                                            <Package className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                            Bidhaa zote zipo kwenye viwango vizuri vya stock.
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                                            {lowStockItems.slice(0, 10).map((item) => (
                                                <li key={item.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition">
                                                    <div
                                                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                            (item.stock_quantity || 0) <= 0
                                                                ? 'bg-rose-100 text-rose-600'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            Reorder buffer: {item.reorder_level} {item.unit}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`text-xs font-black ${
                                                                (item.stock_quantity || 0) <= 0 ? 'text-rose-600' : 'text-amber-600'
                                                            }`}
                                                        >
                                                            {item.stock_quantity || 0} left
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => openRestockModal(item)}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
                                                            title="Ongeza mzigo wa bidhaa hii moja kwa moja"
                                                        >
                                                            Restock
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                {lowStockItems.length > 0 && (
                                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStatusFilter('out_of_stock');
                                                setActiveTab('inventory');
                                            }}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                                        >
                                            View all {lowStockItems.length} items in inventory →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Valuation & Margin Breakdown */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                                <div>
                                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                        Category Valuation & Profit Margins
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Thamani ya mzigo wa stoo, makadirio ya mauzo na faida ghafi kwa kila idara ya bidhaa
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition cursor-pointer self-start sm:self-auto"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Category SKU</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                            <th className="py-2.5 px-3">Category</th>
                                            <th className="py-2.5 px-3 text-center">SKUs</th>
                                            <th className="py-2.5 px-3 text-right">Cost Value</th>
                                            <th className="py-2.5 px-3 text-right">Retail Value</th>
                                            <th className="py-2.5 px-3 text-right">Gross Margin</th>
                                            <th className="py-2.5 px-3 text-center">Stock Health</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(!categoryBreakdown || categoryBreakdown.length === 0) ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400">
                                                    Hakuna makundi ya bidhaa yaliyowekwa bado.
                                                </td>
                                            </tr>
                                        ) : (
                                            categoryBreakdown.map((cat) => (
                                                <tr key={cat.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3 px-3 font-bold text-slate-900">{cat.name}</td>
                                                    <td className="py-3 px-3 text-center font-mono text-slate-600">{cat.items_count}</td>
                                                    <td className="py-3 px-3 text-right font-mono text-slate-700">{formatCurrency(cat.cost_valuation_minor)}</td>
                                                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(cat.retail_valuation_minor)}</td>
                                                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">+{formatCurrency(cat.margin_profit_minor)}</td>
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

                        {/* Recent Sales Quick Preview Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="font-extrabold text-slate-900 text-sm">Recent Sales Orders</h2>
                                    <p className="text-[11px] text-slate-400">Miamala ya hivi karibuni ya supermarket cashier</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('sales')}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition cursor-pointer"
                                    >
                                        View All Sales ({recentOrders.length}) <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {(!recentOrders || recentOrders.length === 0) ? (
                                <div className="px-5 py-12 text-center text-xs text-slate-400">
                                    <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    Hakuna mauzo ya hivi karibuni. Fungua POS Terminal kuanza kuuza.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100 bg-slate-50/80">
                                                <th className="px-5 py-3 font-bold">Order #</th>
                                                <th className="px-5 py-3 font-bold">Customer / Destination</th>
                                                <th className="px-5 py-3 font-bold">Payment Method</th>
                                                <th className="px-5 py-3 font-bold">Status</th>
                                                <th className="px-5 py-3 font-bold text-right">Amount</th>
                                                <th className="px-5 py-3 font-bold text-center">Receipt</th>
                                                <th className="px-5 py-3 font-bold text-right">Date & Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {recentOrders.slice(0, 8).map((order) => (
                                                <tr key={order.id} className="hover:bg-slate-50/60 transition">
                                                    <td className="px-5 py-3 font-mono font-bold text-slate-800">{order.order_number}</td>
                                                    <td className="px-5 py-3 text-slate-600 font-medium">
                                                        {order.guest_name}
                                                        {order.room_number && (
                                                            <span className="text-blue-600 font-bold ml-1">· Room {order.room_number}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-600">
                                                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                                                            {METHOD_LABELS[order.payment_method] ?? order.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                                order.payment_status === 'paid' || order.payment_status === 'posted_to_room'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-amber-50 text-amber-700'
                                                            }`}
                                                        >
                                                            {order.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-black text-slate-900">{formatCurrency(order.total_minor)}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenReceipt(order)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition cursor-pointer"
                                                            title="Tazama na chapisha risiti ya 80mm thermal"
                                                        >
                                                            <Printer className="w-3 h-3" />
                                                            <span>Receipt</span>
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-slate-400">{order.created_at}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 5. Tab 2: Product Catalog & Stock */}
                {activeTab === 'inventory' && (
                    <div className="space-y-4">
                        {/* Search & Filter Toolbar */}
                        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex-1 flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[240px] flex-1">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Tafuta kwa jina la bidhaa au barcode..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-blue-500 transition"
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

                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-bold focus:bg-white focus:border-blue-500 transition"
                                >
                                    <option value="all">Categories Zote</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>

                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('all')}
                                        className={`px-3 py-1 rounded-lg transition ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                                    >
                                        Zote ({items.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('optimal')}
                                        className={`px-3 py-1 rounded-lg transition ${statusFilter === 'optimal' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-emerald-700'}`}
                                    >
                                        Optimal ({optimalCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('low_stock')}
                                        className={`px-3 py-1 rounded-lg transition ${statusFilter === 'low_stock' ? 'bg-amber-600 text-white shadow-xs' : 'hover:text-amber-700'}`}
                                    >
                                        Low ({lowStockCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('out_of_stock')}
                                        className={`px-3 py-1 rounded-lg transition ${statusFilter === 'out_of_stock' ? 'bg-rose-600 text-white shadow-xs' : 'hover:text-rose-700'}`}
                                    >
                                        Out ({outOfStockCount})
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add New Item</span>
                            </button>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                            {filteredItems.length === 0 ? (
                                <div className="px-5 py-16 text-center text-xs text-slate-400">
                                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="font-bold text-slate-600 text-sm">Hakuna bidhaa inayolingana na vigezo</p>
                                    <p className="mt-1">Jaribu kubadili search query au category filter.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200/80">
                                                <th className="py-3 px-4">SKU Code & Item Name</th>
                                                <th className="py-3 px-4">Category</th>
                                                <th className="py-3 px-4 text-right">Selling Price</th>
                                                <th className="py-3 px-4 text-right">Cost Price</th>
                                                <th className="py-3 px-4 text-right">Margin %</th>
                                                <th className="py-3 px-4 text-center">Stock Level</th>
                                                <th className="py-3 px-4 text-center">Reorder Buffer</th>
                                                <th className="py-3 px-4 text-center">Status</th>
                                                <th className="py-3 px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-extrabold text-slate-900 text-sm">{item.name}</div>
                                                        <div className="font-mono text-[10px] text-slate-400">{item.code}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                                                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                                                            {item.category_name}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                                                        {formatCurrency(item.price_minor)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                                                        {item.cost_price_minor > 0 ? formatCurrency(item.cost_price_minor) : '—'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                                                        +{item.margin_pct}%
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black ${
                                                                (item.stock_quantity || 0) <= 0
                                                                    ? 'bg-rose-100 text-rose-700'
                                                                    : (item.stock_quantity || 0) <= (item.reorder_level || 10)
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-emerald-100 text-emerald-800'
                                                            }`}
                                                        >
                                                            {item.stock_quantity || 0} {item.unit}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                                                        {item.reorder_level} {item.unit}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        {item.status === 'out_of_stock' ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px] border border-rose-200">
                                                                Out of Stock
                                                            </span>
                                                        ) : item.status === 'low_stock' ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                                                                Low Stock
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                                                Optimal
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openRestockModal(item)}
                                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition active:scale-95 cursor-pointer"
                                                                title="Weka mzigo mpya (restock)"
                                                            >
                                                                Restock
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(item)}
                                                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                                                                title="Badili bei au jina"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleAvailability(item)}
                                                                className={`p-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                                                    item.is_available
                                                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700'
                                                                        : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700'
                                                                }`}
                                                                title={item.is_available ? 'Bonyeza kuzima kwa POS' : 'Bonyeza kuwasha kwa POS'}
                                                            >
                                                                {item.is_available ? 'Active' : 'Off'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 6. Tab 3: Sales Orders & Receipts */}
                {activeTab === 'sales' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                            <div className="relative max-w-sm flex-1">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tafuta order number au mteja..."
                                    value={salesSearch}
                                    onChange={(e) => setSalesSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-blue-500 transition"
                                />
                            </div>
                            <span className="text-xs font-bold text-slate-500">
                                Jumla ya Mauzo: {filteredOrders.length}
                            </span>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                            {filteredOrders.length === 0 ? (
                                <div className="px-5 py-16 text-center text-xs text-slate-400">
                                    <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="font-bold text-slate-600 text-sm">Hakuna mauzo yaliyopatikana</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100 bg-slate-50/80">
                                                <th className="px-5 py-3 font-bold">Order #</th>
                                                <th className="px-5 py-3 font-bold">Customer / Destination</th>
                                                <th className="px-5 py-3 font-bold">Channel</th>
                                                <th className="px-5 py-3 font-bold">Status</th>
                                                <th className="px-5 py-3 font-bold text-center">Items</th>
                                                <th className="px-5 py-3 font-bold text-right">Total Amount</th>
                                                <th className="px-5 py-3 font-bold text-center">Thermal Receipt</th>
                                                <th className="px-5 py-3 font-bold text-right">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-slate-50/60 transition">
                                                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{order.order_number}</td>
                                                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                                                        {order.guest_name}
                                                        {order.room_number && (
                                                            <span className="text-blue-600 font-bold ml-1">· Room {order.room_number}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-slate-600">
                                                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                                                            {METHOD_LABELS[order.payment_method] ?? order.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                                order.payment_status === 'paid' || order.payment_status === 'posted_to_room'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-amber-50 text-amber-700'
                                                            }`}
                                                        >
                                                            {order.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center font-mono text-slate-600">
                                                        {order.items_count} items
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-black text-slate-900">{formatCurrency(order.total_minor)}</td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenReceipt(order)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                            <span>Print Receipt</span>
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right text-slate-400">{order.created_at}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 7. Tab 4: Stock Movement Audit */}
                {activeTab === 'movements' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-900">Stock Movement Audit Trail</h3>
                                <p className="text-xs text-slate-500">Marekebisho, mauzo na mapokezi ya stoo</p>
                            </div>
                        </div>

                        {(!recentMovements || recentMovements.length === 0) ? (
                            <div className="px-5 py-16 text-center text-xs text-slate-400">
                                <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="font-bold text-slate-600 text-sm">Hakuna kumbukumbu za stock movement bado</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                            <th className="py-2.5 px-4">Date & Time</th>
                                            <th className="py-2.5 px-4">Item Name</th>
                                            <th className="py-2.5 px-4 text-center">Action Type</th>
                                            <th className="py-2.5 px-4 text-right">Quantity</th>
                                            <th className="py-2.5 px-4 text-right">Unit Cost</th>
                                            <th className="py-2.5 px-4">Reference / Invoice #</th>
                                            <th className="py-2.5 px-4">Performed By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentMovements.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/60 transition">
                                                <td className="py-3 px-4 font-mono text-slate-400">{m.created_at}</td>
                                                <td className="py-3 px-4 font-bold text-slate-900">{m.item_name}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                            m.movement_type === 'receive_stock'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : m.movement_type === 'sale'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}
                                                    >
                                                        {m.movement_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                                                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-slate-600">
                                                    {m.unit_cost_minor > 0 ? formatCurrency(m.unit_cost_minor) : '—'}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-slate-600">{m.reference_no}</td>
                                                <td className="py-3 px-4 text-slate-600 font-medium">{m.performed_by}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL 1: ADD PRODUCT */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-900">Add New Grocery Product</h3>
                                <p className="text-xs text-slate-500">Sajili bidhaa mpya kwenye orodha ya supermarket</p>
                            </div>
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
                                    placeholder="e.g. Red Bull Energy Drink 250ml"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Barcode / SKU Code</label>
                                    <input
                                        type="text"
                                        value={addForm.data.code}
                                        onChange={(e) => addForm.setData('code', e.target.value)}
                                        placeholder="Optional (Auto-generated)"
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white font-bold"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (TZS)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addForm.data.cost_price}
                                        onChange={(e) => addForm.setData('cost_price', e.target.value)}
                                        placeholder="e.g. 1800"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addForm.data.stock_quantity}
                                        onChange={(e) => addForm.setData('stock_quantity', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Level</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={addForm.data.reorder_level}
                                        onChange={(e) => addForm.setData('reorder_level', Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white font-bold"
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
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
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
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRestockSubmit} className="space-y-4 mt-4 text-xs sm:text-sm">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Current Stock Balance:</span>
                                <span className="font-black text-slate-900 text-sm">
                                    {selectedItemForAction.stock_quantity || 0} {selectedItemForAction.unit}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white font-black text-sm"
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
                                        placeholder="Optional"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Invoice / Delivery Reference
                                </label>
                                <input
                                    type="text"
                                    value={restockForm.data.reference_no}
                                    onChange={(e) => restockForm.setData('reference_no', e.target.value)}
                                    placeholder="e.g. INV-2026-9042"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Supplier</label>
                                <input
                                    type="text"
                                    value={restockForm.data.notes}
                                    onChange={(e) => restockForm.setData('notes', e.target.value)}
                                    placeholder="e.g. Delivered by Dar Bottlers Ltd"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsRestockModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={restockForm.processing}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
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
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (TZS)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={editForm.data.price}
                                        onChange={(e) => editForm.setData('price', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white font-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (TZS)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.data.cost_price}
                                        onChange={(e) => editForm.setData('cost_price', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                                    <input
                                        type="text"
                                        value={editForm.data.unit}
                                        onChange={(e) => editForm.setData('unit', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="edit_is_available"
                                    checked={editForm.data.is_available}
                                    onChange={(e) => editForm.setData('is_available', e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="edit_is_available" className="text-xs font-bold text-slate-700">
                                    Item is Active & Sellable on POS Terminal
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                                >
                                    {editForm.processing ? 'Updating...' : 'Update Details'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: THERMAL RECEIPT MODAL */}
            {receiptData && (
                <ReceiptModal
                    isOpen={!!receiptData}
                    onClose={() => setReceiptData(null)}
                    receiptData={receiptData}
                    title="Supermarket POS Cashier Receipt"
                    showKOT={false}
                />
            )}
        </AuthenticatedLayout>
    );
}
