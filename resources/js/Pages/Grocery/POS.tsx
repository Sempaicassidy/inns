import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BarChart3,
    Barcode,
    Bed,
    Check,
    Coins,
    CreditCard,
    DollarSign,
    LayoutGrid,
    List,
    Minus,
    Package,
    Plus,
    Printer,
    Receipt,
    RotateCcw,
    Search,
    ShoppingBag,
    ShoppingCart,
    Smartphone,
    Tag,
    Trash2,
    Truck,
    X,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import ReceiptModal from '@/Components/ReceiptModal';
import { ReceiptData } from '@/Utils/receiptPrinter';
import { queueOperation } from '@/offline/queue';
import { toastError } from '@/Services/toast';

interface PosCategory {
    id: string;
    name: string;
    icon?: string;
}

interface GroceryItem {
    id: string;
    pos_category_id: string;
    name: string;
    code: string;
    price_minor: number;
    stock_quantity: number;
    unit: string;
    category?: PosCategory | null;
}

interface ActiveStay {
    stay_id: string;
    room_id: string;
    room_number: string;
    guest_name: string;
    folio_id?: string;
}

interface GroceryOrder {
    id: string;
    order_number: string;
    guest_name?: string;
    room_number?: string | null;
    total_minor: number;
    payment_method: string;
    created_at: string;
    items: { item_name: string; quantity: number; total_minor: number }[];
}

interface GroceryPosProps extends PageProps {
    categories: PosCategory[];
    items: GroceryItem[];
    activeStays: ActiveStay[];
    recentOrders: GroceryOrder[];
    stats: {
        today_total_minor: number;
        today_order_count: number;
    };
}

export default function GroceryPos({
    auth,
    categories = [],
    items = [],
    activeStays = [],
    recentOrders = [],
    stats = { today_total_minor: 0, today_order_count: 0 },
}: GroceryPosProps) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [orderType, setOrderType] = useState<'counter' | 'room' | 'takeaway'>('counter');
    const [cart, setCart] = useState<{ item: GroceryItem; quantity: number }[]>([]);
    const [cashTendered, setCashTendered] = useState<string>('');
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [currentReceiptData, setCurrentReceiptData] = useState<ReceiptData | null>(null);
    const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const userRole = (auth?.user as any)?.active_role || (auth?.user as any)?.role || 'staff';
    const isManager = ['owner', 'super_admin', 'general_manager', 'manager', 'admin'].includes(userRole);

    // Add Product Form (Quick Add SKU right from POS terminal)
    const addProductForm = useForm({
        pos_category_id: categories[0]?.id || '',
        name: '',
        code: '',
        price: '',
        cost_price: '',
        stock_quantity: 50,
        reorder_level: 10,
        unit: 'pcs',
    });

    // Add Category Form (cashier-created product categories)
    const categoryForm = useForm({
        name: '',
        icon: 'package',
    });

    // Sale Checkout Form
    const { data: saleData, setData: setSaleData, post: submitSale, processing, reset } = useForm({
        payment_method: 'cash' as 'cash' | 'card' | 'mpesa' | 'room_folio',
        folio_id: '',
        room_id: '',
        guest_name: 'Walk-in Customer',
        items: [] as { item_id: string; quantity: number }[],
        notes: '',
    });

    const formatCurrency = (minor: number) =>
        new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format((minor || 0) / 100);

    const subtotalMinor = useMemo(
        () => cart.reduce((sum, c) => sum + c.item.price_minor * c.quantity, 0),
        [cart]
    );
    const totalItemsCount = useMemo(
        () => cart.reduce((sum, c) => sum + c.quantity, 0),
        [cart]
    );

    const totalMajor = subtotalMinor / 100;
    const tenderedNum = Number(cashTendered) || 0;
    const changeDue = tenderedNum > 0 ? tenderedNum - totalMajor : 0;

    const addToCart = (item: GroceryItem, qtyDelta: number = 1) => {
        if (item.stock_quantity <= 0) {
            toastError(`"${item.name}" is out of stock.`);
            return;
        }
        setCart((prev) => {
            const existing = prev.find((c) => c.item.id === item.id);
            const inCart = existing?.quantity ?? 0;
            if (inCart + qtyDelta > item.stock_quantity) {
                toastError(`Only ${item.stock_quantity} ${item.unit}(s) of "${item.name}" in stock.`);
                return prev;
            }
            if (existing) {
                return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + qtyDelta } : c));
            }
            return [...prev, { item, quantity: qtyDelta }];
        });
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((c) => {
                    if (c.item.id === itemId) {
                        const newQ = c.quantity + delta;
                        if (newQ > c.item.stock_quantity) {
                            toastError(`Only ${c.item.stock_quantity} ${c.item.unit}(s) of "${c.item.name}" in stock.`);
                            return c;
                        }
                        return newQ > 0 ? { ...c, quantity: newQ } : null;
                    }
                    return c;
                })
                .filter(Boolean) as { item: GroceryItem; quantity: number }[]
        );
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => prev.filter((c) => c.item.id !== itemId));
    };

    const clearCart = () => {
        setCart([]);
        setCashTendered('');
    };

    const handleRoomSelect = (stayId: string) => {
        const stay = activeStays.find((s) => s.stay_id === stayId);
        if (stay) {
            setSaleData((prev) => ({
                ...prev,
                room_id: stay.room_id,
                folio_id: stay.folio_id || '',
                guest_name: `${stay.guest_name} (Room ${stay.room_number})`,
            }));
        } else {
            setSaleData((prev) => ({ ...prev, room_id: '', folio_id: '', guest_name: 'Walk-in Customer' }));
        }
    };

    const filteredItems = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return items.filter((item) => {
            const matchesCategory = selectedCategoryId === 'all' || item.pos_category_id === selectedCategoryId;
            const matchesSearch =
                !q ||
                item.name.toLowerCase().includes(q) ||
                item.code?.toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [items, selectedCategoryId, searchQuery]);

    // Handle barcode scanner input / Enter key on search
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const q = searchQuery.trim().toLowerCase();
            if (!q) return;

            // 1. Exact match on barcode/SKU
            const exactCodeMatch = items.find((i) => i.code?.toLowerCase() === q);
            if (exactCodeMatch) {
                addToCart(exactCodeMatch);
                setSearchQuery('');
                return;
            }

            // 2. Exact match on name
            const exactNameMatch = items.find((i) => i.name.toLowerCase() === q);
            if (exactNameMatch) {
                addToCart(exactNameMatch);
                setSearchQuery('');
                return;
            }

            // 3. Single filtered item match
            if (filteredItems.length === 1) {
                addToCart(filteredItems[0]);
                setSearchQuery('');
                return;
            }
        }
    };

    const buildReceipt = (orderNumber: string): ReceiptData => ({
        hotelName: (auth?.tenant as any)?.name || 'SUPER / MINI MARKET',
        hotelAddress: (auth?.property as any)?.address || (auth?.tenant as any)?.address || undefined,
        hotelPhone: (auth?.property as any)?.phone || (auth?.tenant as any)?.phone || undefined,
        tin: (auth?.tenant as any)?.tin || undefined,
        vrn: (auth?.tenant as any)?.vrn || undefined,
        receiptNumber: orderNumber,
        receiptType: 'POS RECEIPT',
        dateTime: new Date().toLocaleString(),
        cashierName: (auth?.user as any)?.name || 'Cashier',
        guestName: saleData.guest_name || 'Walk-in Customer',
        tableName: saleData.payment_method === 'room_folio'
            ? `Room ${activeStays.find((s) => s.room_id === saleData.room_id)?.room_number ?? saleData.room_id}`
            : orderType === 'takeaway' ? 'Takeaway Counter' : 'Super Market Counter',
        items: cart.map((c) => ({
            description: c.item.name,
            quantity: c.quantity,
            unit_price: c.item.price_minor,
            amount: c.item.price_minor * c.quantity,
        })),
        subtotal: subtotalMinor,
        tax: 0,
        taxRatePercent: 0,
        grandTotal: subtotalMinor,
        paymentMethod: saleData.payment_method.toUpperCase(),
        amountPaid: saleData.payment_method === 'cash' && tenderedNum > 0 ? tenderedNum * 100 : subtotalMinor,
        balanceDue: 0,
        notes: saleData.payment_method === 'cash' && tenderedNum >= totalMajor
            ? `Cash Received: TSh ${tenderedNum.toLocaleString()} | Change Due: TSh ${changeDue.toLocaleString()}`
            : undefined,
        amountsAreMinor: true,
        footerText: 'Thank you for shopping with us! Welcome again.',
    });

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;

        if (saleData.payment_method === 'room_folio' && !saleData.folio_id) {
            toastError('Please select a checked-in guest room with an active folio.');
            return;
        }

        saleData.items = cart.map((c) => ({ item_id: c.item.id, quantity: c.quantity }));
        const receiptSnapshot = buildReceipt(`GRO-${Date.now().toString().slice(-6)}`);

        const offlinePayload = {
            ...saleData,
            department: 'grocery',
            order_type: orderType === 'room' ? 'room_service' : orderType === 'takeaway' ? 'takeaway' : 'retail_counter',
            order_number: receiptSnapshot.receiptNumber,
            subtotal_minor: subtotalMinor,
            tax_minor: 0,
            total_minor: subtotalMinor,
            items: cart.map((c) => ({
                item_id: c.item.id,
                name: c.item.name,
                quantity: c.quantity,
                unit_price: c.item.price_minor,
                amount: c.item.price_minor * c.quantity,
            })),
        };

        const queueOfflineSale = () => {
            if ((auth?.tenant as any)?.id) {
                queueOperation({
                    tenantId: (auth.tenant as any).id,
                    type: 'pos_order',
                    action: 'create',
                    payload: offlinePayload,
                }).catch(() => { });
            }

            import('@/Services/offlineSync').then(({ default: offlineSync }) => {
                offlineSync.queueOfflineAction({
                    url: route('grocery.orders.store'),
                    method: 'POST',
                    data: saleData,
                    title: `Grocery Sale: ${receiptSnapshot.receiptNumber} (${saleData.guest_name || 'Walk-In'})`,
                    module: 'pos',
                });
                setCurrentReceiptData(receiptSnapshot);
                setIsReceiptModalOpen(true);
                clearCart();
                reset();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            });
        };

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            queueOfflineSale();
            return;
        }

        submitSale(route('grocery.orders.store'), {
            onSuccess: (page: any) => {
                const serverReceipt = page.props?.flash?.sale_receipt;
                if (serverReceipt) {
                    setCurrentReceiptData(serverReceipt);
                } else {
                    setCurrentReceiptData(receiptSnapshot);
                }
                setIsReceiptModalOpen(true);
                clearCart();
                reset();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            },
            onError: () => {
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    queueOfflineSale();
                } else {
                    toastError('Sale checkout failed. Please check stock and try again.');
                }
            },
        });
    };

    const handleQuickAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        addProductForm.post(route('grocery.items.store'), {
            preserveScroll: true,
            onSuccess: () => {
                addProductForm.reset();
                setIsAddProductModalOpen(false);
            },
        });
    };

    const handleQuickAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        categoryForm.post(route('grocery.categories.store'), {
            preserveScroll: true,
            onSuccess: () => {
                categoryForm.reset();
                setIsAddCategoryModalOpen(false);
            },
        });
    };

    const buildOrderReceiptData = (order: GroceryOrder): ReceiptData => ({
        hotelName: (auth?.tenant as any)?.name || 'SUPER / MINI MARKET',
        hotelAddress: (auth?.property as any)?.address || (auth?.tenant as any)?.address || undefined,
        hotelPhone: (auth?.property as any)?.phone || (auth?.tenant as any)?.phone || undefined,
        tin: (auth?.tenant as any)?.tin || undefined,
        vrn: (auth?.tenant as any)?.vrn || undefined,
        receiptNumber: order.order_number,
        receiptType: 'POS RECEIPT',
        dateTime: new Date(order.created_at).toLocaleString(),
        cashierName: (auth?.user as any)?.name || 'Cashier',
        guestName: order.guest_name || 'Walk-in Customer',
        tableName: order.room_number ? `Room ${order.room_number}` : 'Super Market Counter',
        items: order.items?.length > 0
            ? order.items.map((it) => ({
                description: it.item_name,
                quantity: it.quantity,
                unit_price: Math.round(it.total_minor / (it.quantity || 1)),
                amount: it.total_minor,
            }))
            : [{ description: `Retail Sale #${order.order_number}`, quantity: 1, unit_price: order.total_minor, amount: order.total_minor }],
        subtotal: order.total_minor,
        tax: 0,
        taxRatePercent: 0,
        grandTotal: order.total_minor,
        paymentMethod: order.payment_method.toUpperCase(),
        amountPaid: order.total_minor,
        balanceDue: 0,
        amountsAreMinor: true,
        footerText: 'Thank you for shopping with us! Welcome again.',
    });

    return (
        <AuthenticatedLayout>
            <Head title="Super / Mini Market POS — Cashier Checkout Terminal" />

            <div className="space-y-5">
                {/* 1. Header & Cashier Status Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs border border-blue-100">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Super / Mini Market POS</h1>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Cashier: <strong className="text-slate-900">{(auth?.user as any)?.name || 'Cashier'}</strong>
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span>Terminal Active</span>
                                    </div>
                                </div>
                            </div>

                            {/* Manager Quick Navigation if Manager */}
                            {isManager && (
                                <div className="flex items-center gap-1.5 pt-2">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg border border-blue-100 flex items-center gap-1">
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                        <span>POS Terminal</span>
                                    </span>
                                    <Link
                                        href={route('grocery.index', { tab: 'inventory' })}
                                        className="px-3 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs rounded-lg transition flex items-center gap-1"
                                    >
                                        <Package className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Manage Inventory</span>
                                    </Link>
                                    <Link
                                        href={route('grocery.index')}
                                        className="px-3 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs rounded-lg transition flex items-center gap-1"
                                    >
                                        <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Margin Reports</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Top Action Buttons & Shift Summary */}
                        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setIsRecentOrdersOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer active:scale-95"
                            >
                                <Receipt className="w-4 h-4 text-slate-500" />
                                <span>Recent Receipts ({recentOrders.length})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsAddProductModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Quick Add SKU</span>
                            </button>

                            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-1.5 text-right min-w-[110px]">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Sales</span>
                                    <div className="text-sm font-black text-slate-900">{formatCurrency(stats.today_total_minor)}</div>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-center min-w-[60px]">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Orders</span>
                                    <div className="text-sm font-black text-blue-600">{stats.today_order_count}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Main POS Grid: Product Catalog + Sticky Cart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column: Product Search, Category Pills & Products Grid/List */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                        {/* Search, Barcode Scanner & View Toggle Bar */}
                        <div className="flex items-center gap-2.5">
                            <div className="relative flex-1">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                                    <Barcode className="w-5 h-5 text-blue-600" />
                                    <Search className="w-4 h-4 text-slate-400" />
                                </div>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Scan barcode or type name / SKU (Press Enter to add)..."
                                    className="w-full pl-16 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            searchInputRef.current?.focus();
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* View Switcher: Grid vs List */}
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition cursor-pointer ${viewMode === 'grid'
                                            ? 'bg-white text-blue-600 shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    title="Grid View (Cards)"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition cursor-pointer ${viewMode === 'list'
                                            ? 'bg-white text-blue-600 shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    title="List View (Compact Rows)"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Category filter pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                            <button
                                onClick={() => setSelectedCategoryId('all')}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${selectedCategoryId === 'all'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                All Items ({items.length})
                            </button>
                            {categories.map((cat) => {
                                const countInCat = items.filter((i) => i.pos_category_id === cat.id).length;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${selectedCategoryId === cat.id
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Package className="w-3.5 h-3.5" />
                                        <span>{cat.name}</span>
                                        <span
                                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${selectedCategoryId === cat.id
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-slate-100 text-slate-500'
                                                }`}
                                        >
                                            {countInCat}
                                        </span>
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => setIsAddCategoryModalOpen(true)}
                                className="px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 bg-white border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50"
                                title="Create a new product category"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Category</span>
                            </button>
                        </div>

                        {/* Product Catalog Display (Grid View or List View) */}
                        {filteredItems.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3 shadow-2xs">
                                <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
                                <h3 className="font-bold text-slate-800 text-base">No retail products found</h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                    {searchQuery
                                        ? `No product matches "${searchQuery}". Scan a different barcode or add a new SKU.`
                                        : 'No products in this category yet. Click "Quick Add SKU" to add your first product.'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsAddProductModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add New SKU Now</span>
                                </button>
                            </div>
                        ) : viewMode === 'grid' ? (
                            /* GRID VIEW */
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                {filteredItems.map((item) => {
                                    const outOfStock = item.stock_quantity <= 0;
                                    const inCartItem = cart.find((c) => c.item.id === item.id);

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => !outOfStock && addToCart(item)}
                                            className={`group relative rounded-2xl border p-3 flex flex-col justify-between transition-all select-none ${outOfStock
                                                    ? 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed'
                                                    : inCartItem
                                                        ? 'border-blue-500 bg-blue-50/40 shadow-xs cursor-pointer ring-1 ring-blue-500/20'
                                                        : 'border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs hover:bg-blue-50/10 cursor-pointer'
                                                }`}
                                        >
                                            <div>
                                                {/* Top row: Stock badge & SKU */}
                                                <div className="flex items-center justify-between gap-1 mb-2">
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase truncate">
                                                        {item.code || 'SKU'}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${outOfStock
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : item.stock_quantity <= 10
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-emerald-100 text-emerald-800'
                                                            }`}
                                                    >
                                                        {outOfStock ? 'Out' : `${item.stock_quantity} ${item.unit}`}
                                                    </span>
                                                </div>

                                                {/* Icon / Image Placeholder */}
                                                <div className="w-full h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5 group-hover:scale-[1.02] transition-transform">
                                                    <Package className="w-8 h-8 text-blue-600/70" />
                                                </div>

                                                {/* Product Name */}
                                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
                                                    {item.name}
                                                </h4>
                                            </div>

                                            {/* Bottom row: Price and In-Cart Controller */}
                                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                                                <div className="text-blue-600 font-black text-xs sm:text-sm">
                                                    {formatCurrency(item.price_minor)}
                                                </div>

                                                {inCartItem ? (
                                                    <div
                                                        className="flex items-center gap-1 bg-white border border-blue-200 rounded-lg p-0.5 shadow-2xs"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-5 text-center font-black text-xs text-blue-700">
                                                            {inCartItem.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="w-6 h-6 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={outOfStock}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!outOfStock) addToCart(item);
                                                        }}
                                                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1 ${outOfStock
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 cursor-pointer active:scale-95'
                                                            }`}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        <span>Add</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* LIST VIEW (Compact Rows) */
                            <div className="space-y-1.5">
                                {filteredItems.map((item) => {
                                    const outOfStock = item.stock_quantity <= 0;
                                    const inCartItem = cart.find((c) => c.item.id === item.id);

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => !outOfStock && addToCart(item)}
                                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all select-none ${outOfStock
                                                    ? 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed'
                                                    : inCartItem
                                                        ? 'border-blue-400 bg-blue-50/50 shadow-2xs cursor-pointer'
                                                        : 'border-slate-200/90 bg-white hover:border-blue-300 hover:bg-blue-50/20 cursor-pointer shadow-2xs'
                                                }`}
                                        >
                                            {/* Thumbnail */}
                                            <div className="w-10 h-10 rounded-lg bg-blue-50/60 border border-slate-100 flex items-center justify-center shrink-0">
                                                <Package className="w-5 h-5 text-blue-600/70" />
                                            </div>

                                            {/* Name + SKU */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                                                    {item.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                                                        {item.code || 'SKU'}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${outOfStock
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : item.stock_quantity <= 10
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-emerald-100 text-emerald-800'
                                                            }`}
                                                    >
                                                        {outOfStock ? 'Out of stock' : `${item.stock_quantity} ${item.unit} left`}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right shrink-0">
                                                <span className="text-blue-600 font-black text-sm whitespace-nowrap">
                                                    {formatCurrency(item.price_minor)}
                                                </span>
                                            </div>

                                            {/* In-cart qty or Add button */}
                                            {inCartItem ? (
                                                <div
                                                    className="flex items-center gap-1 shrink-0 bg-white border border-blue-200 rounded-lg p-0.5"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-7 text-center font-black text-sm text-blue-700">
                                                        {inCartItem.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="w-7 h-7 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={outOfStock}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!outOfStock) addToCart(item);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition shrink-0 flex items-center gap-1 ${outOfStock
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 cursor-pointer active:scale-95'
                                                        }`}
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Add</span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Checkout Cart Sidebar */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm sticky top-4 space-y-4">
                            {/* Cart Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <ShoppingCart className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-slate-900 leading-tight">Order Cart</h2>
                                        <span className="text-[11px] font-bold text-slate-500">
                                            {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'} selected
                                        </span>
                                    </div>
                                </div>
                                {cart.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearCart}
                                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleCheckout} className="space-y-4">
                                {/* Order Type Selector (Retail Counter / Room Delivery / Takeaway) */}
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                        Order Destination
                                    </label>
                                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOrderType('counter');
                                                if (saleData.payment_method === 'room_folio') {
                                                    setSaleData('payment_method', 'cash');
                                                }
                                            }}
                                            className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${orderType === 'counter'
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            Counter
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOrderType('room');
                                                setSaleData('payment_method', 'room_folio');
                                            }}
                                            className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${orderType === 'room'
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            Room
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOrderType('takeaway');
                                                if (saleData.payment_method === 'room_folio') {
                                                    setSaleData('payment_method', 'cash');
                                                }
                                            }}
                                            className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${orderType === 'takeaway'
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            Takeaway
                                        </button>
                                    </div>
                                </div>

                                {/* Room / Customer Selector */}
                                {orderType === 'room' || saleData.payment_method === 'room_folio' ? (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Bed className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Post to Guest Room Folio *</span>
                                        </label>
                                        <select
                                            value={activeStays.find((s) => s.room_id === saleData.room_id)?.stay_id ?? ''}
                                            onChange={(e) => handleRoomSelect(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                            required
                                        >
                                            <option value="">Select active room...</option>
                                            {activeStays.map((s) => (
                                                <option key={s.stay_id} value={s.stay_id}>
                                                    Room {s.room_number} — {s.guest_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 block">Customer Name</label>
                                        <input
                                            type="text"
                                            value={saleData.guest_name}
                                            onChange={(e) => setSaleData('guest_name', e.target.value)}
                                            placeholder="Walk-in Customer"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                        />
                                    </div>
                                )}

                                {/* Cart Items List */}
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {cart.length > 0 ? (
                                        cart.map((c) => (
                                            <div
                                                key={c.item.id}
                                                className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 text-xs"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-900 truncate">{c.item.name}</div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {formatCurrency(c.item.price_minor)} × {c.quantity} ={' '}
                                                        <strong className="text-slate-800">
                                                            {formatCurrency(c.item.price_minor * c.quantity)}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(c.item.id, -1)}
                                                        className="w-6 h-6 rounded-md border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition cursor-pointer"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-6 text-center font-black text-slate-900 text-xs">
                                                        {c.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(c.item.id, 1)}
                                                        className="w-6 h-6 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center transition cursor-pointer shadow-2xs"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFromCart(c.item.id)}
                                                        className="w-6 h-6 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer ml-0.5"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center space-y-2 border-2 border-dashed border-slate-200 rounded-xl">
                                            <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                                            <p className="text-xs font-bold text-slate-500">Cart is empty</p>
                                            <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                                                Scan a barcode or tap products to build order.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method Grid (4 Big Buttons) */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Payment Method
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSaleData('payment_method', 'cash')}
                                            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition cursor-pointer ${saleData.payment_method === 'cash'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500/20'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            <DollarSign className="w-4 h-4 text-emerald-600" />
                                            <span>Cash</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSaleData('payment_method', 'mpesa')}
                                            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition cursor-pointer ${saleData.payment_method === 'mpesa'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500/20'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            <Smartphone className="w-4 h-4 text-emerald-600" />
                                            <span>M-Pesa</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSaleData('payment_method', 'card')}
                                            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition cursor-pointer ${saleData.payment_method === 'card'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500/20'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            <CreditCard className="w-4 h-4 text-indigo-600" />
                                            <span>Card</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSaleData('payment_method', 'room_folio')}
                                            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition cursor-pointer ${saleData.payment_method === 'room_folio'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500/20'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            <Bed className="w-4 h-4 text-blue-600" />
                                            <span>Room Folio</span>
                                        </button>
                                    </div>
                                </div>

                                {/* CASH TENDERED & CHENJI CALCULATOR */}
                                {saleData.payment_method === 'cash' && cart.length > 0 && (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <Coins className="w-3.5 h-3.5 text-amber-600" />
                                                <span>Cash Received (TZS)</span>
                                            </label>
                                            <span className="text-[11px] font-bold text-slate-500">
                                                Bill: {formatCurrency(subtotalMinor)}
                                            </span>
                                        </div>

                                        <input
                                            type="number"
                                            min="0"
                                            value={cashTendered}
                                            onChange={(e) => setCashTendered(e.target.value)}
                                            placeholder={`e.g. ${totalMajor || 5000}`}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                        />

                                        {/* Quick denomination chips */}
                                        <div className="flex flex-wrap gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setCashTendered(String(totalMajor))}
                                                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold cursor-pointer"
                                            >
                                                Exact
                                            </button>
                                            {[2000, 5000, 10000, 20000, 50000, 100000].map((amt) => (
                                                <button
                                                    key={amt}
                                                    type="button"
                                                    onClick={() => setCashTendered(String(amt))}
                                                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold cursor-pointer"
                                                >
                                                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Change Due (Chenji) or Shortage Display */}
                                        {tenderedNum > 0 && (
                                            <div
                                                className={`p-2.5 rounded-lg flex items-center justify-between text-xs font-extrabold ${changeDue >= 0
                                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                    }`}
                                            >
                                                <span>{changeDue >= 0 ? 'Chenji (Change Due):' : 'Bado (Shortage):'}</span>
                                                <span className="text-sm">
                                                    TSh {Math.abs(changeDue).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {saleData.payment_method === 'room_folio' && (
                                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                        <span>
                                            Charges will be billed to the guest's folio and settled at room check-out.
                                        </span>
                                    </div>
                                )}

                                {/* Total and Place Order Button */}
                                <div className="border-t border-slate-200 pt-3 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Total Items</span>
                                        <span className="font-bold text-slate-800">{totalItemsCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-base font-black text-slate-900">
                                        <span>Total Amount</span>
                                        <span className="text-blue-600 text-lg font-black">
                                            {formatCurrency(subtotalMinor)}
                                        </span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={cart.length === 0 || processing}
                                        className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>
                                            {processing
                                                ? 'Processing Sale...'
                                                : `Complete Sale (${formatCurrency(subtotalMinor)})`}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Add SKU Modal */}
            {/* MODAL: ADD PRODUCT CATEGORY */}
            {isAddCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">New Product Category</h3>
                                    <p className="text-xs text-slate-500">Group products for faster POS filtering</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddCategoryModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleQuickAddCategory} className="p-6 space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={categoryForm.data.name}
                                    onChange={(e) => categoryForm.setData('name', e.target.value)}
                                    placeholder="e.g. Fresh Produce, Dairy, Bakery"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                                {categoryForm.errors.name && (
                                    <p className="mt-1 text-rose-600 font-semibold">{categoryForm.errors.name}</p>
                                )}
                            </div>
                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCategoryModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={categoryForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{categoryForm.processing ? 'Saving...' : 'Create Category'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Add New Retail Product</h3>
                                    <p className="text-xs text-slate-500">Register a new item to sell at the Market counter</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddProductModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleQuickAddProduct} className="p-6 space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={addProductForm.data.name}
                                    onChange={(e) => addProductForm.setData('name', e.target.value)}
                                    placeholder="e.g. Kilimanjaro Mineral Water 500ml"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Category *</label>
                                    <select
                                        required
                                        value={addProductForm.data.pos_category_id}
                                        onChange={(e) => addProductForm.setData('pos_category_id', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Barcode / SKU</label>
                                    <input
                                        type="text"
                                        value={addProductForm.data.code}
                                        onChange={(e) => addProductForm.setData('code', e.target.value)}
                                        placeholder="e.g. SKU-WTR01"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Selling Price (TZS) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={addProductForm.data.price}
                                        onChange={(e) => addProductForm.setData('price', e.target.value)}
                                        placeholder="1500"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Cost Price (TZS)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addProductForm.data.cost_price}
                                        onChange={(e) => addProductForm.setData('cost_price', e.target.value)}
                                        placeholder="1000"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Initial Stock Qty</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addProductForm.data.stock_quantity}
                                        onChange={(e) => addProductForm.setData('stock_quantity', Number(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Reorder Level</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addProductForm.data.reorder_level}
                                        onChange={(e) => addProductForm.setData('reorder_level', Number(e.target.value))}
                                        title="Minimum stock level that triggers a low-stock alert"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Unit of Measure</label>
                                    <select
                                        value={addProductForm.data.unit}
                                        onChange={(e) => addProductForm.setData('unit', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    >
                                        <option value="pcs">Pieces (pcs)</option>
                                        <option value="btl">Bottles (btl)</option>
                                        <option value="can">Cans (can)</option>
                                        <option value="pkt">Packets (pkt)</option>
                                        <option value="box">Boxes (box)</option>
                                        <option value="kg">Kilograms (kg)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddProductModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addProductForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                                >
                                    {addProductForm.processing ? 'Saving...' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receipt Modal for Instant Thermal Printing */}
            {currentReceiptData && (
                <ReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    receiptData={currentReceiptData}
                    title="Retail Sale Receipt (POS)"
                    showKOT={false}
                />
            )}

            {/* Recent Orders Modal */}
            {isRecentOrdersOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Recent Sales Receipts</h3>
                                    <p className="text-xs text-slate-500">View and reprint past retail sale receipts</p>
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
                                    <p>No recent retail sales found today.</p>
                                </div>
                            ) : (
                                recentOrders.map((ord) => (
                                    <div
                                        key={ord.id}
                                        className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-extrabold text-slate-900 font-mono">#{ord.order_number}</span>
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase">
                                                    {ord.payment_method}
                                                </span>
                                            </div>
                                            <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-1.5">
                                                <span className="font-medium text-slate-700">{ord.guest_name || 'Walk-in'}</span>
                                                {ord.room_number && (
                                                    <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-semibold text-[10px]">
                                                        Room {ord.room_number}
                                                    </span>
                                                )}
                                                <span className="text-slate-400">/</span>
                                                <span>{new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <span className="font-extrabold text-sm text-slate-900 mr-2">
                                                {formatCurrency(ord.total_minor)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentReceiptData(buildOrderReceiptData(ord));
                                                    setIsReceiptModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 transition cursor-pointer text-xs"
                                                title="Print Sale Receipt"
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
