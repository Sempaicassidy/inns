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

        submitOrder(route('pos.store'), {
            onSuccess: () => {
                clearCart();
                reset();
                setIsMobileCartOpen(false);
            },
        });
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
                        <p className="text-sm text-[#64748B] mt-1">Order management and payment processing</p>
                    </div>
                    <div className="flex items-center gap-3">
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
        </AuthenticatedLayout>
    );
}
