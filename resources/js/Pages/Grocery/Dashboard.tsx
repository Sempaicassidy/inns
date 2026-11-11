import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Package,
    PackageX,
    Receipt,
    ShoppingBag,
    ShoppingCart,
    TrendingUp,
} from 'lucide-react';

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

interface LowStockItem {
    id: string;
    name: string;
    stock_quantity: number;
    reorder_level: number;
    unit: string;
}

interface RecentOrder {
    id: string;
    order_number: string;
    guest_name: string;
    room_number: string | null;
    total_minor: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
}

interface GroceryDashboardProps extends PageProps {
    stats: {
        today_revenue_minor: number;
        month_revenue_minor: number;
        today_order_count: number;
        items_sold_today: number;
        total_skus: number;
        low_stock_count: number;
    };
    topItemsToday: TopItem[];
    paymentBreakdown: PaymentBreakdown[];
    lowStockItems: LowStockItem[];
    recentOrders: RecentOrder[];
}

const METHOD_LABELS: Record<string, string> = {
    cash: 'Cash',
    mpesa: 'M-Pesa',
    airtel_money: 'Airtel Money',
    card: 'Card',
    bank_transfer: 'Bank Transfer',
    room_folio: 'Room Folio',
    posted_to_room: 'Room Folio',
};

export default function GroceryDashboard({
    auth,
    stats,
    topItemsToday = [],
    paymentBreakdown = [],
    lowStockItems = [],
    recentOrders = [],
}: GroceryDashboardProps) {
    const formatCurrency = (minor: number) =>
        new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format((minor || 0) / 100);

    const kpis = [
        {
            label: "Today's Sales",
            value: formatCurrency(stats.today_revenue_minor),
            icon: TrendingUp,
            tone: 'text-emerald-600 bg-emerald-50',
        },
        {
            label: 'Orders Today',
            value: stats.today_order_count,
            icon: ShoppingCart,
            tone: 'text-blue-600 bg-blue-50',
        },
        {
            label: 'Items Sold Today',
            value: stats.items_sold_today,
            icon: Package,
            tone: 'text-violet-600 bg-violet-50',
        },
        {
            label: 'Month Revenue',
            value: formatCurrency(stats.month_revenue_minor),
            icon: BarChart3,
            tone: 'text-amber-600 bg-amber-50',
        },
        {
            label: 'Products in Stock',
            value: stats.total_skus,
            icon: ShoppingBag,
            tone: 'text-slate-600 bg-slate-100',
        },
        {
            label: 'Low Stock Alerts',
            value: stats.low_stock_count,
            icon: AlertTriangle,
            tone: stats.low_stock_count > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-600 bg-slate-100',
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Super / Mini Market" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                            <ShoppingBag className="w-7 h-7 text-blue-600" />
                            Super / Mini Market
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Sales overview na shughuli za duka — {auth?.tenant?.name ?? 'Tenant'}
                        </p>
                    </div>
                    <Link
                        href={route('grocery.pos')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xs transition cursor-pointer"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Open POS Terminal
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {kpis.map((kpi) => (
                        <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.tone}`}>
                                <kpi.icon className="w-4.5 h-4.5" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{kpi.label}</p>
                            <p className="text-lg font-extrabold text-slate-900 mt-0.5 truncate">{kpi.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top items today */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-extrabold text-slate-900 text-sm">Top Items Today</h2>
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        {topItemsToday.length === 0 ? (
                            <p className="px-5 py-8 text-center text-xs text-slate-400">Hakuna mauzo bado leo.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {topItemsToday.map((item, idx) => (
                                    <li key={item.name} className="px-5 py-3 flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-extrabold flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                                            <p className="text-[10px] text-slate-400">{item.quantity} sold</p>
                                        </div>
                                        <span className="text-xs font-extrabold text-slate-900">{formatCurrency(item.total_minor)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Payment breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-extrabold text-slate-900 text-sm">Payments Today</h2>
                            <Receipt className="w-4 h-4 text-blue-500" />
                        </div>
                        {paymentBreakdown.length === 0 ? (
                            <p className="px-5 py-8 text-center text-xs text-slate-400">Hakuna malipo bado leo.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {paymentBreakdown.map((p) => (
                                    <li key={p.method} className="px-5 py-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{METHOD_LABELS[p.method] ?? p.method}</p>
                                            <p className="text-[10px] text-slate-400">{p.orders_count} orders</p>
                                        </div>
                                        <span className="text-xs font-extrabold text-slate-900">{formatCurrency(p.total_minor)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Low stock alerts */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-extrabold text-slate-900 text-sm">Stock Alerts</h2>
                            <PackageX className="w-4 h-4 text-rose-500" />
                        </div>
                        {lowStockItems.length === 0 ? (
                            <p className="px-5 py-8 text-center text-xs text-slate-400">Stock iko sawa — hakuna alerts.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {lowStockItems.map((item) => (
                                    <li key={item.id} className="px-5 py-3 flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.stock_quantity <= 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                                            <p className="text-[10px] text-slate-400">
                                                Reorder at {item.reorder_level} {item.unit}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-extrabold ${item.stock_quantity <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                                            {item.stock_quantity} left
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Recent orders */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-extrabold text-slate-900 text-sm">Recent Sales</h2>
                        <Link href={route('grocery.pos')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            Open POS <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    {recentOrders.length === 0 ? (
                        <p className="px-5 py-8 text-center text-xs text-slate-400">Hakuna mauzo bado. Fungua POS Terminal kuanza kuuza.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                                        <th className="px-5 py-2.5 font-bold">Order</th>
                                        <th className="px-5 py-2.5 font-bold">Customer</th>
                                        <th className="px-5 py-2.5 font-bold">Payment</th>
                                        <th className="px-5 py-2.5 font-bold">Status</th>
                                        <th className="px-5 py-2.5 font-bold text-right">Total</th>
                                        <th className="px-5 py-2.5 font-bold text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50/60">
                                            <td className="px-5 py-3 font-mono font-bold text-slate-700">{order.order_number}</td>
                                            <td className="px-5 py-3 text-slate-600">
                                                {order.guest_name}
                                                {order.room_number && <span className="text-slate-400"> · Room {order.room_number}</span>}
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{METHOD_LABELS[order.payment_method] ?? order.payment_method}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.payment_status === 'paid' || order.payment_status === 'posted_to_room' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {order.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-extrabold text-slate-900">{formatCurrency(order.total_minor)}</td>
                                            <td className="px-5 py-3 text-right text-slate-400">{order.created_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
