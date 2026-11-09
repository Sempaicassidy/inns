import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    Bed,
    Check,
    Coffee,
    CreditCard,
    DollarSign,
    GlassWater,
    Minus,
    Plus,
    Printer,
    Receipt,
    Search,
    ShoppingBag,
    Trash2,
    Utensils,
    Wine,
    X,
    ArrowRight,
    Clock,
} from 'lucide-react';
import { useState } from 'react';
import ReceiptModal from '@/Components/ReceiptModal';
import { ReceiptData, printThermalReceipt } from '@/Utils/receiptPrinter';

interface PosCategory {
    id: string;
    name: string;
    icon: string;
}

interface PosItem {
    id: string;
    pos_category_id: string;
    name: string;
    code: string;
    description: string;
    price_minor: number;
    image?: string;
    category?: PosCategory;
}

interface ActiveStay {
    stay_id: string;
    room_number: string;
    room_id: string;
    guest_name: string;
    folio_id?: string;
}

interface PosOrder {
    id: string;
    order_number: string;
    order_type: string;
    table_number?: string;
    guest_name?: string;
    total_minor: number;
    payment_status: string;
    payment_method: string;
    created_at: string;
    items?: { id: string; item_name: string; quantity: number; total_minor: number }[];
}

interface PosIndexProps extends PageProps {
    categories: PosCategory[];
    items: PosItem[];
    activeStays: ActiveStay[];
    recentOrders: PosOrder[];
    stats: {
        today_total_minor: number;
        today_order_count: number;
    };
}

export default function PosIndex({
    auth,
    categories = [],
    items = [],
    activeStays = [],
    recentOrders = [],
    stats,
}: PosIndexProps) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<{ item: PosItem; quantity: number }[]>([]);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [currentReceiptData, setCurrentReceiptData] = useState<ReceiptData | null>(null);
    const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);

    const { data: orderData, setData: setOrderData, post: submitOrder, processing, reset } = useForm({
        order_type: 'dine_in' as 'dine_in' | 'room_delivery' | 'takeaway',
        table_number: 'Table 04',
        room_id: '',
        stay_id: '',
        folio_id: '',
        guest_name: 'Walk-in Guest',
        payment_method: 'room_folio' as 'cash' | 'card' | 'mpesa' | 'room_folio',
        items: [] as { item_id: string; quantity: number }[],
        notes: '',
    });

    const formatCurrency = (minor: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format(minor / 100);
    };

    const addToCart = (item: PosItem) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.item.id === item.id);
            if (existing) {
                return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
            }
            return [...prev, { item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((c) => {
                    if (c.item.id === itemId) {
                        const newQ = c.quantity + delta;
                        return newQ > 0 ? { ...c, quantity: newQ } : null;
                    }
                    return c;
                })
                .filter(Boolean) as { item: PosItem; quantity: number }[]
        );
    };

    const clearCart = () => setCart([]);

    const subtotalMinor = cart.reduce((sum, c) => sum + c.item.price_minor * c.quantity, 0);
    const taxMinor = Math.round(subtotalMinor * 0.18);
    const totalMinor = subtotalMinor + taxMinor;
    const totalItemsCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    const handleRoomSelect = (stayId: string) => {
        const stay = activeStays.find((s) => s.stay_id === stayId);
        if (stay) {
            setOrderData((prev) => ({
                ...prev,
                stay_id: stay.stay_id,
                room_id: stay.room_id,
                folio_id: stay.folio_id || '',
                guest_name: stay.guest_name,
                order_type: 'room_delivery',
            }));
        } else {
            setOrderData((prev) => ({
                ...prev,
                stay_id: '',
                room_id: '',
                folio_id: '',
                guest_name: 'Walk-in Guest',
            }));
        }
    };

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;

        orderData.items = cart.map((c) => ({
            item_id: c.item.id,
            quantity: c.quantity,
        }));

        const receiptSnapshot: ReceiptData = {
            hotelName: (auth?.tenant as any)?.name || 'THE INNS RESTAURANT & BAR',
            hotelAddress: (auth?.property as any)?.address || (auth?.tenant as any)?.address || undefined,
            hotelPhone: (auth?.property as any)?.phone || (auth?.tenant as any)?.phone || undefined,
            tin: (auth?.tenant as any)?.tin || undefined,
            vrn: (auth?.tenant as any)?.vrn || undefined,
            receiptNumber: `ORD-${Date.now().toString().slice(-6)}`,
            receiptType: 'POS RECEIPT',
            dateTime: new Date().toLocaleString(),
            cashierName: auth?.user?.name || 'Server',
            guestName: orderData.guest_name || 'Walk-in Guest',
            tableName: orderData.table_number ? `Table ${orderData.table_number}` : (orderData.order_type === 'room_delivery' ? 'Room Delivery' : 'Takeaway / Counter'),
            items: cart.map(c => ({
                description: c.item.name,
                quantity: c.quantity,
                unit_price: c.item.price_minor,
                amount: c.item.price_minor * c.quantity,
            })),
            subtotal: subtotalMinor,
            tax: taxMinor,
            taxRatePercent: 18,
            grandTotal: totalMinor,
            paymentMethod: orderData.payment_method,
            amountPaid: totalMinor,
            balanceDue: 0,
            amountsAreMinor: true,
            footerText: 'Thank you for dining with us!',
        };

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            import('@/Services/offlineSync').then(({ default: offlineSync }) => {
                offlineSync.queueOfflineAction({
                    url: route('pos.store'),
                    method: 'POST',
                    data: orderData,
                    title: `POS Order: ${receiptSnapshot.receiptNumber} (${orderData.guest_name})`,
                    module: 'pos',
                });
                setCurrentReceiptData(receiptSnapshot);
                setIsReceiptModalOpen(true);
                clearCart();
                reset();
                setIsMobileCartOpen(false);
            });
            return;
        }

        submitOrder(route('pos.store'), {
            onSuccess: () => {
                setCurrentReceiptData(receiptSnapshot);
                setIsReceiptModalOpen(true);
                clearCart();
                reset();
                setIsMobileCartOpen(false);
            },
            onError: () => {
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    import('@/Services/offlineSync').then(({ default: offlineSync }) => {
                        offlineSync.queueOfflineAction({
                            url: route('pos.store'),
                            method: 'POST',
                            data: orderData,
                            title: `POS Order: ${receiptSnapshot.receiptNumber} (${orderData.guest_name})`,
                            module: 'pos',
                        });
                        setCurrentReceiptData(receiptSnapshot);
                        setIsReceiptModalOpen(true);
                        clearCart();
                        reset();
                        setIsMobileCartOpen(false);
                    });
                }
            },
        });
    };

    const handlePrintOrder = (order: PosOrder) => {
        const orderReceipt: ReceiptData = {
            hotelName: (auth?.tenant as any)?.name || 'THE INNS RESTAURANT & BAR',
            hotelAddress: (auth?.property as any)?.address || (auth?.tenant as any)?.address || undefined,
            hotelPhone: (auth?.property as any)?.phone || (auth?.tenant as any)?.phone || undefined,
            tin: (auth?.tenant as any)?.tin || undefined,
            vrn: (auth?.tenant as any)?.vrn || undefined,
            receiptNumber: order.order_number,
            receiptType: 'POS RECEIPT',
            dateTime: new Date(order.created_at).toLocaleString(),
            cashierName: auth?.user?.name || 'Server',
            guestName: order.guest_name || 'Walk-in Guest',
            tableName: order.table_number ? `Table ${order.table_number}` : order.order_type.replace('_', ' ').toUpperCase(),
            items: (order.items && order.items.length > 0)
                ? order.items.map(it => ({
                    description: it.item_name,
                    quantity: it.quantity,
                    unit_price: it.total_minor / (it.quantity || 1),
                    amount: it.total_minor,
                }))
                : [{
                    description: `POS Order #${order.order_number}`,
                    quantity: 1,
                    unit_price: order.total_minor,
                    amount: order.total_minor,
                }],
            subtotal: order.total_minor,
            tax: Math.round(order.total_minor * 0.18),
            taxRatePercent: 18,
            grandTotal: order.total_minor,
            paymentMethod: order.payment_method,
            amountPaid: order.total_minor,
            balanceDue: 0,
            amountsAreMinor: true,
            footerText: 'Thank you for dining with us!',
        };

        setCurrentReceiptData(orderReceipt);
        setIsReceiptModalOpen(true);
    };

    const filteredItems = items.filter((item) => {
        const matchesCategory = selectedCategoryId === 'all' || item.pos_category_id === selectedCategoryId;
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.code?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getCategoryIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('beverage') || lower.includes('soft')) return <GlassWater className="w-4 h-4" />;
        if (lower.includes('cocktail') || lower.includes('wine') || lower.includes('bar'))
            return <Wine className="w-4 h-4" />;
        if (lower.includes('coffee') || lower.includes('breakfast')) return <Coffee className="w-4 h-4" />;
        return <Utensils className="w-4 h-4" />;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Restaurant POS - THE INNS" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1E293B]">Restaurant POS</h1>
                        
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsRecentOrdersOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer"
                        >
                            <Receipt className="w-4 h-4 text-slate-500" />
                            <span>Recent Receipts ({recentOrders.length})</span>
                        </button>
                        <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-2">
                            <span className="text-xs text-[#64748B]">Today's Sales</span>
                            <div className="text-lg font-bold text-[#1E293B]">{formatCurrency(stats.today_total_minor)}</div>
                        </div>
                        <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-2">
                            <span className="text-xs text-[#64748B]">Orders</span>
                            <div className="text-lg font-bold text-[#2563EB]">{stats.today_order_count}</div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Menu Items (8 cols) */}
                    <div className="lg:col-span-8 space-y-4">
                        {/* Categories */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            <button
                                onClick={() => setSelectedCategoryId('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                                    selectedCategoryId === 'all'
                                        ? 'bg-[#2563EB] text-white'
                                        : 'bg-white border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC]'
                                }`}
                            >
                                All Items
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                                        selectedCategoryId === cat.id
                                            ? 'bg-[#2563EB] text-white'
                                            : 'bg-white border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC]'
                                    }`}
                                >
                                    {getCategoryIcon(cat.name)}
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="w-5 h-5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search menu items..."
                                className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
                            />
                        </div>

                        {/* Menu Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className="bg-white border border-[#E2E8F0] rounded-lg p-4 text-left hover:border-[#2563EB] hover:shadow-md transition group"
                                >
                                    <div className="aspect-square bg-[#F8FAFC] rounded-lg mb-3 flex items-center justify-center">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <Utensils className="w-8 h-8 text-[#64748B]" />
                                        )}
                                    </div>
                                    <div className="font-medium text-[#1E293B] text-sm truncate">{item.name}</div>
                                    <div className="text-[#2563EB] font-bold text-sm mt-1">{formatCurrency(item.price_minor)}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cart (4 cols) */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 sticky top-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-[#1E293B]">Current Order</h2>
                                {cart.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="text-sm text-[#B91C1C] hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleCheckout} className="space-y-4">
                                {/* Order Type */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { key: 'dine_in', label: 'Dine In' },
                                        { key: 'room_delivery', label: 'Room' },
                                        { key: 'takeaway', label: 'Takeaway' },
                                    ].map((type) => (
                                        <button
                                            key={type.key}
                                            type="button"
                                            onClick={() => setOrderData('order_type', type.key as any)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                                orderData.order_type === type.key
                                                    ? 'bg-[#2563EB] text-white'
                                                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0]'
                                            }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Room Selection */}
                                {orderData.order_type === 'room_delivery' && (
                                    <div>
                                        <label className="block text-sm font-medium text-[#1E293B] mb-1">Select Room</label>
                                        <select
                                            value={orderData.stay_id}
                                            onChange={(e) => handleRoomSelect(e.target.value)}
                                            className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#1E293B]"
                                        >
                                            <option value="">-- Choose Room --</option>
                                            {activeStays.map((s) => (
                                                <option key={s.stay_id} value={s.stay_id}>
                                                    Room {s.room_number} - {s.guest_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Table Selection */}
                                {orderData.order_type !== 'room_delivery' && (
                                    <div>
                                        <label className="block text-sm font-medium text-[#1E293B] mb-1">Table</label>
                                        <input
                                            type="text"
                                            value={orderData.table_number}
                                            onChange={(e) => setOrderData('table_number', e.target.value)}
                                            className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#1E293B]"
                                        />
                                    </div>
                                )}

                                {/* Cart Items */}
                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {cart.length > 0 ? (
                                        cart.map((c) => (
                                            <div key={c.item.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                                                <div className="flex-1">
                                                    <div className="font-medium text-[#1E293B] text-sm">{c.item.name}</div>
                                                    <div className="text-xs text-[#64748B]">{formatCurrency(c.item.price_minor)} each</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(c.item.id, -1)}
                                                        className="w-8 h-8 rounded border border-[#E2E8F0] flex items-center justify-center hover:bg-[#E2E8F0]"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-[#1E293B]">{c.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(c.item.id, 1)}
                                                        className="w-8 h-8 rounded bg-[#2563EB] text-white flex items-center justify-center hover:bg-[#1E3A5F]"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-[#64748B]">
                                            <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-[#CBD5E1]" />
                                            <p className="text-sm">Cart is empty</p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-sm font-medium text-[#1E293B] mb-2">Payment Method</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'room_folio', label: 'Room Folio', icon: Bed },
                                            { key: 'cash', label: 'Cash', icon: DollarSign },
                                            { key: 'mpesa', label: 'M-Pesa', icon: CreditCard },
                                            { key: 'card', label: 'Card', icon: CreditCard },
                                        ].map((method) => {
                                            const Icon = method.icon;
                                            return (
                                                <button
                                                    key={method.key}
                                                    type="button"
                                                    onClick={() => setOrderData('payment_method', method.key as any)}
                                                    className={`p-3 rounded-lg border flex items-center gap-2 text-sm transition ${
                                                        orderData.payment_method === method.key
                                                            ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                                                            : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span>{method.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="border-t border-[#E2E8F0] pt-4 space-y-2">
                                    <div className="flex justify-between text-sm text-[#64748B]">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotalMinor)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[#64748B]">
                                        <span>VAT (18%)</span>
                                        <span>{formatCurrency(taxMinor)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-[#1E293B] pt-2 border-t border-[#E2E8F0]">
                                        <span>Total</span>
                                        <span className="text-[#2563EB]">{formatCurrency(totalMinor)}</span>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={cart.length === 0 || processing}
                                    className="w-full py-3 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1E3A5F] disabled:bg-[#94A3B8] disabled:text-[#64748B] transition flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    <span>{processing ? 'Processing...' : 'Submit Order'}</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Receipt Modal for Instant Thermal Print */}
            {currentReceiptData && (
                <ReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    receiptData={currentReceiptData}
                    title="Order Receipt (POS)"
                />
            )}

            {/* Recent Orders & Receipts History Modal */}
            {isRecentOrdersOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Recent POS Receipts</h3>
                                    <p className="text-xs text-slate-500">View and reprint past order thermal receipts</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRecentOrdersOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
                            {recentOrders.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>No recent POS orders found.</p>
                                </div>
                            ) : (
                                recentOrders.map((ord) => (
                                    <div
                                        key={ord.id}
                                        className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white transition flex items-center justify-between gap-4"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-slate-900 font-mono">#{ord.order_number}</span>
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                                                    {ord.order_type.replace('_', ' ')}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase">
                                                    {ord.payment_method}
                                                </span>
                                            </div>
                                            <div className="text-slate-500 text-[11px]">
                                                {ord.guest_name || 'Walk-in'} {ord.table_number ? `• Table ${ord.table_number}` : ''} • {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="font-extrabold text-sm text-slate-900">
                                                {formatCurrency(ord.total_minor)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handlePrintOrder(ord)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 transition cursor-pointer"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                <span>Print Receipt</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsRecentOrdersOpen(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
