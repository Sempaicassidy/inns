import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm, Link, usePage } from '@inertiajs/react';
import {
    Utensils,
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Clock,
    DollarSign,
    Filter,
    Edit3,
    Eye,
    ChefHat,
    Coffee,
    Wine,
    ExternalLink,
    AlertTriangle,
    Layers,
    Tag,
    Printer,
    Receipt,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import ReceiptModal from '@/Components/ReceiptModal';
import { ReceiptData, printThermalReceipt, printKOTReceipt } from '@/Utils/receiptPrinter';

interface PosCategory {
    id: string;
    name: string;
    icon: string;
    sort_order: number;
    department?: string;
}

interface PosItem {
    id: string;
    name: string;
    code: string;
    pos_category_id: string;
    category_name: string;
    price_minor: number;
    cost_price_minor: number;
    is_available: boolean;
    unit: string;
    margin_pct: number;
}

interface RecentOrder {
    id: string;
    order_number: string;
    order_type: string;
    table_number: string;
    room_number: string;
    guest_name: string;
    server_name: string;
    subtotal_minor: number;
    tax_minor: number;
    total_minor: number;
    payment_status: string;
    payment_method: string;
    status: string;
    notes?: string;
    items_count: number;
    items_summary: string;
    created_at: string;
}

interface TopDish {
    name: string;
    quantity: number;
    revenue_minor: number;
}

interface Props extends PageProps {
    metrics: {
        today_sales_minor: number;
        month_sales_minor: number;
        today_orders_count: number;
        active_orders_count: number;
        total_menu_items: number;
        unavailable_count: number;
    };
    categories: PosCategory[];
    items: PosItem[];
    recentOrders: RecentOrder[];
    topSelling: TopDish[];
    activeStays?: { stay_id: string; room_number: string; guest_name: string; folio_id?: string }[];
}

export default function RestaurantIndex({
    metrics,
    categories = [],
    items = [],
    recentOrders = [],
    topSelling = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'analytics' | 'categories'>('menu');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');

    // Modals
    const [isAddDishOpen, setIsAddDishOpen] = useState(false);
    const [isEditDishOpen, setIsEditDishOpen] = useState(false);
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PosItem | null>(null);

    // Receipt Modal State & Helpers
    const { auth } = usePage<PageProps>().props;
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const buildOrderReceipt = (order: RecentOrder): ReceiptData => {
        let receiptItems: { description: string; quantity: number; unit_price: number; amount: number; notes?: string }[] = [];
        if (order.items_summary) {
            const parts = order.items_summary.split(',').map(s => s.trim()).filter(Boolean);
            receiptItems = parts.map(part => {
                const match = part.match(/^(\d+)x\s*(.*)$/);
                if (match) {
                    const qty = parseInt(match[1], 10);
                    const desc = match[2];
                    return {
                        description: desc,
                        quantity: qty,
                        unit_price: Math.round(order.total_minor / (qty || 1)),
                        amount: Math.round(order.total_minor / parts.length),
                    };
                }
                return {
                    description: part,
                    quantity: 1,
                    unit_price: Math.round(order.total_minor / parts.length),
                    amount: Math.round(order.total_minor / parts.length),
                };
            });
        }

        if (receiptItems.length === 0) {
            receiptItems = [{
                description: `Restaurant Order #${order.order_number}`,
                quantity: order.items_count || 1,
                unit_price: order.total_minor,
                amount: order.total_minor,
            }];
        }

        return {
            hotelName: (auth?.tenant as any)?.name || 'THE INNS RESTAURANT & BAR',
            hotelAddress: (auth?.property as any)?.address || (auth?.tenant as any)?.address || undefined,
            hotelPhone: (auth?.property as any)?.phone || (auth?.tenant as any)?.phone || undefined,
            tin: (auth?.tenant as any)?.tin || undefined,
            vrn: (auth?.tenant as any)?.vrn || undefined,
            receiptNumber: order.order_number,
            receiptType: 'POS RECEIPT',
            dateTime: order.created_at || new Date().toLocaleString(),
            cashierName: order.server_name || auth?.user?.name || 'Server',
            serverName: order.server_name || auth?.user?.name || 'Server',
            guestName: order.guest_name || 'Walk-in Guest',
            roomNumber: order.room_number || undefined,
            tableName: order.table_number || (order.order_type === 'room_delivery' ? `Room ${order.room_number}` : 'Walk-in Counter'),
            orderType: order.order_type,
            items: receiptItems,
            subtotal: order.subtotal_minor || order.total_minor,
            tax: order.tax_minor || Math.round(order.total_minor * 0.18),
            taxRatePercent: 18,
            grandTotal: order.total_minor,
            paymentMethod: order.payment_method || 'Settled',
            amountPaid: order.total_minor,
            balanceDue: 0,
            notes: order.notes,
            amountsAreMinor: true,
            footerText: 'Thank you for dining with us!',
        };
    };

    const handleOpenReceipt = (order: RecentOrder) => {
        setSelectedReceipt(buildOrderReceipt(order));
        setIsReceiptModalOpen(true);
    };

    const handleDirectKOT = (order: RecentOrder) => {
        const r = buildOrderReceipt(order);
        r.receiptType = 'KITCHEN TICKET';
        printKOTReceipt(r);
    };

    // Add Dish Form
    const addDishForm = useForm({
        pos_category_id: categories[0]?.id || '',
        name: '',
        code: '',
        price: '',
        cost_price: '',
        unit: 'portion',
        description: '',
    });

    // Edit Dish Form
    const editDishForm = useForm({
        pos_category_id: '',
        name: '',
        code: '',
        price: '',
        cost_price: '',
        unit: '',
        description: '',
    });

    // Add Category Form
    const addCategoryForm = useForm({
        name: '',
        icon: 'utensils',
    });

    const formatTsh = (minor: number) => {
        return (
            new Intl.NumberFormat('en-TZ', {
                style: 'decimal',
                maximumFractionDigits: 0,
            }).format(Math.round(minor / 100)) + ' TZS'
        );
    };

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesCategory = selectedCategory === 'all' || item.pos_category_id === selectedCategory;
            const matchesSearch =
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.code.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'available'
                    ? item.is_available
                    : !item.is_available;
            return matchesCategory && matchesSearch && matchesStatus;
        });
    }, [items, selectedCategory, searchQuery, statusFilter]);

    const handleToggleAvailability = (item: PosItem) => {
        router.post(
            route('restaurant.items.toggle', item.id),
            {},
            { preserveScroll: true }
        );
    };

    const handleOpenEdit = (item: PosItem) => {
        setEditingItem(item);
        editDishForm.setData({
            pos_category_id: item.pos_category_id,
            name: item.name,
            code: item.code,
            price: (item.price_minor / 100).toString(),
            cost_price: item.cost_price_minor ? (item.cost_price_minor / 100).toString() : '',
            unit: item.unit || 'portion',
            description: '',
        });
        setIsEditDishOpen(true);
    };

    const handleUpdateOrderStatus = (orderId: string, status: string) => {
        router.post(
            route('restaurant.orders.status', orderId),
            { status },
            { preserveScroll: true }
        );
    };

    const handleCreateDish = (e: React.FormEvent) => {
        e.preventDefault();
        addDishForm.post(route('restaurant.items.store'), {
            onSuccess: () => {
                setIsAddDishOpen(false);
                addDishForm.reset();
            },
        });
    };

    const handleSaveEditDish = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        editDishForm.put(route('restaurant.items.update', editingItem.id), {
            onSuccess: () => {
                setIsEditDishOpen(false);
                setEditingItem(null);
            },
        });
    };

    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        addCategoryForm.post(route('restaurant.categories.store'), {
            onSuccess: () => {
                setIsAddCategoryOpen(false);
                addCategoryForm.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Restaurant Overview Report</h2>}>
            <Head title="Restaurant Overview Report - THE INNS" />

            <div className="space-y-6">
                {/* 1. TOP HEADER & QUICK ACTIONS */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                Restaurant Overview Report
                            </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={route('pos.index')}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        >
                            <span>Waiter POS Terminal</span>
                        </Link>
                        <button
                            onClick={() => setIsAddCategoryOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                        >
                            <span>New Category</span>
                        </button>
                        <button
                            onClick={() => setIsAddDishOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs"
                        >
                            <span>Add Menu Item</span>
                        </button>
                    </div>
                </div>

                {/* 2. EXECUTIVE F&B METRIC CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Today Sales */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Today F&B Sales
                            </span>
                            
                        </div>
                        <div className="my-2">
                            <div className="text-2xl font-black text-slate-900">
                                {formatTsh(metrics.today_sales_minor)}
                            </div>
                            
                        </div>
                    </div>

                    {/* Month-To-Date Sales */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Month-to-Date Revenue
                            </span>
                            
                        </div>
                        <div className="my-2">
                            <div className="text-2xl font-black text-slate-900">
                                {formatTsh(metrics.month_sales_minor)}
                            </div>
                            
                        </div>
                    </div>

                    {/* Active Kitchen / Bar Orders */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Active Kitchen Orders
                            </span>
                            
                        </div>
                        <div className="my-2">
                            <div className="text-2xl font-black text-amber-700">
                                {metrics.active_orders_count}
                            </div>
                            
                        </div>
                    </div>

                    {/* Menu Health */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Active Menu Catalog
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Utensils className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-2xl font-black text-slate-900">
                                {metrics.total_menu_items} Dishes / Drinks
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-bold text-rose-600">
                                    {metrics.unavailable_count} 86'd (Unavailable)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. NAVIGATION TABS */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                            activeTab === 'menu'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Menu Catalog & Pricing</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                            activeTab === 'orders'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Dining & Room Orders</span>
                        {recentOrders.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                                {recentOrders.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                            activeTab === 'analytics'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Top Selling Dishes</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                            activeTab === 'categories'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span>Menu Categories</span>
                    </button>
                </div>

                {/* 4. TAB 1: MENU CATALOG & PRICING */}
                {activeTab === 'menu' && (
                    <div className="space-y-4">
                        {/* Filters Bar */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            {/* Search */}
                            <div className="relative flex-1 max-w-sm">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search dish or beverage name / code..."
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                                />
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                        selectedCategory === 'all'
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    All Categories
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                            selectedCategory === cat.id
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                        statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setStatusFilter('available')}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                        statusFilter === 'available' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-700'
                                    }`}
                                >
                                    Available
                                </button>
                                <button
                                    onClick={() => setStatusFilter('unavailable')}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                        statusFilter === 'unavailable' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-rose-700'
                                    }`}
                                >
                                    86'd
                                </button>
                            </div>
                        </div>

                        {/* Menu Items Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="py-3 px-4">Code</th>
                                            <th className="py-3 px-4">Item Name</th>
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4 text-right">Selling Price</th>
                                            <th className="py-3 px-4 text-right">Food Cost</th>
                                            <th className="py-3 px-4 text-center">Margin</th>
                                            <th className="py-3 px-4 text-center">Kitchen Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {filteredItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-slate-400">
                                                    No restaurant menu items found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                                                        {item.code}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="font-bold text-slate-900 block">
                                                            {item.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            Per {item.unit}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
                                                            {item.category_name}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-black text-slate-900">
                                                        {formatTsh(item.price_minor)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-slate-600">
                                                        {formatTsh(item.cost_price_minor)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                item.margin_pct >= 60
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : item.margin_pct >= 40
                                                                    ? 'bg-amber-50 text-amber-700'
                                                                    : 'bg-rose-50 text-rose-700'
                                                            }`}
                                                        >
                                                            {item.margin_pct}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {item.is_available ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Available
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                                                <XCircle className="w-3 h-3" />
                                                                86'd (Out of Stock)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleToggleAvailability(item)}
                                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                                                    item.is_available
                                                                        ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                                                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                }`}
                                                                title="Toggle 86 Kitchen Availability"
                                                            >
                                                                {item.is_available ? 'Mark 86' : 'Mark Available'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenEdit(item)}
                                                                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                                                                title="Edit Menu Item"
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
                    </div>
                )}

                {/* 5. TAB 2: DINING & ROOM ORDERS */}
                {activeTab === 'orders' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900">
                                Recent Restaurant & Bar Orders
                            </h2>
                            <span className="text-xs text-slate-400">
                                Real-time kitchen & dining ticket log
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4">Order #</th>
                                        <th className="py-3 px-4">Service Type</th>
                                        <th className="py-3 px-4">Location</th>
                                        <th className="py-3 px-4">Guest / Server</th>
                                        <th className="py-3 px-4">Items Summary</th>
                                        <th className="py-3 px-4 text-right">Amount</th>
                                        <th className="py-3 px-4 text-center">Payment</th>
                                        <th className="py-3 px-4 text-center">Kitchen Status</th>
                                        <th className="py-3 px-4 text-center">Receipt &amp; KOT</th>
                                        <th className="py-3 px-4 text-right">Update Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {recentOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="py-8 text-center text-slate-400">
                                                No restaurant orders recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                                    {order.order_number}
                                                    <span className="block text-[10px] text-slate-400 font-normal">
                                                        {order.created_at}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                            order.order_type === 'dine_in'
                                                                ? 'bg-blue-50 text-blue-700'
                                                                : order.order_type === 'room_delivery'
                                                                ? 'bg-purple-50 text-purple-700'
                                                                : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        {order.order_type.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-800">
                                                    {order.order_type === 'room_delivery'
                                                        ? `Room ${order.room_number}`
                                                        : order.table_number || 'Walk-In Counter'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-slate-900 block">
                                                        {order.guest_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        Server: {order.server_name}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={order.items_summary}>
                                                    {order.items_summary || `${order.items_count} items`}
                                                </td>
                                                <td className="py-3 px-4 text-right font-black text-slate-900">
                                                    {formatTsh(order.total_minor)}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            order.payment_status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : order.payment_status === 'posted_to_room'
                                                                ? 'bg-sky-50 text-sky-700'
                                                                : 'bg-amber-50 text-amber-700'
                                                        }`}
                                                    >
                                                        {order.payment_status.toUpperCase()} ({order.payment_method})
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            order.status === 'served'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : order.status === 'preparing'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : order.status === 'pending'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}
                                                    >
                                                        {order.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDirectKOT(order)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 transition text-[11px] font-bold cursor-pointer shadow-2xs"
                                                            title="Print Kitchen Order Ticket (KOT)"
                                                        >
                                                            <ChefHat className="w-3.5 h-3.5 text-amber-700" />
                                                            <span>KOT</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenReceipt(order)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition text-[11px] font-bold cursor-pointer"
                                                            title="View &amp; Print Customer Receipt"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                            <span>Receipt</span>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                        className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="preparing">Preparing</option>
                                                        <option value="served">Served</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. TAB 3: TOP SELLING DISHES */}
                {activeTab === 'analytics' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-amber-600" />
                                Top Selling Dishes & Drinks
                            </h3>

                            {topSelling.length === 0 ? (
                                <p className="text-xs text-slate-400 py-6 text-center">No sales recorded yet.</p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {topSelling.map((dish, idx) => (
                                        <div key={dish.name} className="py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <span className="font-bold text-slate-900 block text-xs">
                                                        {dish.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {dish.quantity} portions served
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="font-black text-xs text-slate-900">
                                                {formatTsh(dish.revenue_minor)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <ChefHat className="w-4 h-4 text-amber-600" />
                                Kitchen Operations Summary
                            </h3>
                            <div className="space-y-3 text-xs">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Total Menu Items</span>
                                    <span className="font-bold text-slate-900">{metrics.total_menu_items}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                                    <span className="text-emerald-800 font-medium">Available for Kitchen Prep</span>
                                    <span className="font-bold text-emerald-900">
                                        {metrics.total_menu_items - metrics.unavailable_count}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex justify-between items-center">
                                    <span className="text-rose-800 font-medium">86'd / Depleted</span>
                                    <span className="font-bold text-rose-900">{metrics.unavailable_count}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex justify-between items-center">
                                    <span className="text-amber-800 font-medium">Orders Currently in Preparation</span>
                                    <span className="font-bold text-amber-900">{metrics.active_orders_count}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. TAB 4: MENU CATEGORIES */}
                {activeTab === 'categories' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900">
                                Active Restaurant Categories
                            </h3>
                            <button
                                onClick={() => setIsAddCategoryOpen(true)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition"
                            >
                                Add Category
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                            <Utensils className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-xs text-slate-900 block">
                                                {cat.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                Order: #{cat.sort_order}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL: ADD DISH / BEVERAGE */}
            {isAddDishOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Utensils className="w-4 h-4 text-amber-600" />
                                Add Restaurant Menu Item
                            </h3>
                            <button
                                onClick={() => setIsAddDishOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateDish} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Menu Category
                                </label>
                                <select
                                    value={addDishForm.data.pos_category_id}
                                    onChange={(e) => addDishForm.setData('pos_category_id', e.target.value)}
                                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                    required
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Item / Dish Name
                                </label>
                                <input
                                    type="text"
                                    value={addDishForm.data.name}
                                    onChange={(e) => addDishForm.setData('name', e.target.value)}
                                    placeholder="e.g. Swahili Coconut Fish Curry"
                                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Item Code (SKU)
                                    </label>
                                    <input
                                        type="text"
                                        value={addDishForm.data.code}
                                        onChange={(e) => addDishForm.setData('code', e.target.value)}
                                        placeholder="e.g. RST-CRRY-01"
                                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Unit Portion
                                    </label>
                                    <input
                                        type="text"
                                        value={addDishForm.data.unit}
                                        onChange={(e) => addDishForm.setData('unit', e.target.value)}
                                        placeholder="portion, plate, glass"
                                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Selling Price (TZS)
                                    </label>
                                    <input
                                        type="number"
                                        value={addDishForm.data.price}
                                        onChange={(e) => addDishForm.setData('price', e.target.value)}
                                        placeholder="e.g. 25000"
                                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Food Cost (TZS)
                                    </label>
                                    <input
                                        type="number"
                                        value={addDishForm.data.cost_price}
                                        onChange={(e) => addDishForm.setData('cost_price', e.target.value)}
                                        placeholder="e.g. 10000"
                                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddDishOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addDishForm.processing}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                                >
                                    Save Menu Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT DISH */}
            {isEditDishOpen && editingItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-amber-600" />
                                Edit Restaurant Item: {editingItem.name}
                            </h3>
                            <button
                                onClick={() => setIsEditDishOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveEditDish} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Menu Category
                                </label>
                                <select
                                    value={editDishForm.data.pos_category_id}
                                    onChange={(e) => editDishForm.setData('pos_category_id', e.target.value)}
                                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                    required
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Item / Dish Name
                                </label>
                                <input
                                    type="text"
                                    value={editDishForm.data.name}
                                    onChange={(e) => editDishForm.setData('name', e.target.value)}
                                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Selling Price (TZS)
                                    </label>
                                    <input
                                        type="number"
                                        value={editDishForm.data.price}
                                        onChange={(e) => editDishForm.setData('price', e.target.value)}
                                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Food Cost (TZS)
                                    </label>
                                    <input
                                        type="number"
                                        value={editDishForm.data.cost_price}
                                        onChange={(e) => editDishForm.setData('cost_price', e.target.value)}
                                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditDishOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editDishForm.processing}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                                >
                                    Update Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD CATEGORY */}
            {isAddCategoryOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-amber-600" />
                                Add Menu Category
                            </h3>
                            <button
                                onClick={() => setIsAddCategoryOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateCategory} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Category Name
                                </label>
                                <input
                                    type="text"
                                    value={addCategoryForm.data.name}
                                    onChange={(e) => addCategoryForm.setData('name', e.target.value)}
                                    placeholder="e.g. Seafood & Grills"
                                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCategoryOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addCategoryForm.processing}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                                >
                                    Create Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Dedicated Receipt & KOT Modal */}
            {selectedReceipt && (
                <ReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    receiptData={selectedReceipt}
                    title="Restaurant Order Receipt &amp; KOT"
                />
            )}
        </AuthenticatedLayout>
    );
}

