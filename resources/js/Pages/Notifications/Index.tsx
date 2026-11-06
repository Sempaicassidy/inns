import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Bed,
    Bell,
    Calendar,
    Check,
    CheckCheck,
    CheckCircle2,
    Clock,
    DollarSign,
    Filter,
    Package,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
    Users,
    Wrench,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    category: string;
    severity: string;
    action_url?: string;
    is_read: boolean;
    read_at?: string;
    created_at: string;
    created_date: string;
}

interface NotificationsIndexProps extends PageProps {
    notifications: NotificationItem[];
    stats: {
        total: number;
        unread: number;
        today: number;
        urgent: number;
    };
    activeCategory: string;
    activeFilter: string;
}

export default function NotificationsIndex({
    notifications = [],
    stats = { total: 0, unread: 0, today: 0, urgent: 0 },
    activeCategory = 'all',
    activeFilter = 'all',
}: NotificationsIndexProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(activeCategory);
    const [selectedFilter, setSelectedFilter] = useState(activeFilter);

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        router.get(
            route('notifications.index'),
            { category: cat, filter: selectedFilter },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (fil: string) => {
        setSelectedFilter(fil);
        router.get(
            route('notifications.index'),
            { category: selectedCategory, filter: fil },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleMarkAllRead = () => {
        router.post(route('notifications.mark-all-read'), {}, { preserveScroll: true });
    };

    const handleClearRead = () => {
        if (confirm('Clear all read notifications from your inbox?')) {
            router.post(route('notifications.clear-all'), {}, { preserveScroll: true });
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        router.delete(route('notifications.destroy', id), { preserveScroll: true });
    };

    const handleMarkRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(route('notifications.read', id), {}, { preserveScroll: true });
    };

    // Client-side search filtering
    const filteredNotifications = notifications.filter((n) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    });

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'reservation':
            case 'check_in':
                return <Calendar className="w-5 h-5 text-blue-600" />;
            case 'housekeeping':
                return <Bed className="w-5 h-5 text-rose-600" />;
            case 'finance':
                return <DollarSign className="w-5 h-5 text-emerald-600" />;
            case 'maintenance':
                return <Wrench className="w-5 h-5 text-purple-600" />;
            case 'inventory':
                return <Package className="w-5 h-5 text-amber-600" />;
            default:
                return <Bell className="w-5 h-5 text-blue-600" />;
        }
    };

    const getCategoryBg = (category: string) => {
        switch (category) {
            case 'reservation':
            case 'check_in':
                return 'bg-blue-100/80';
            case 'housekeeping':
                return 'bg-rose-100/80';
            case 'finance':
                return 'bg-emerald-100/80';
            case 'maintenance':
                return 'bg-purple-100/80';
            case 'inventory':
                return 'bg-amber-100/80';
            default:
                return 'bg-blue-100/80';
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'urgent':
                return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px] uppercase">Urgent Action</span>;
            case 'warning':
                return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] uppercase">Warning</span>;
            case 'success':
                return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase">Success</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase">Information</span>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="System Notifications & Alerts - THE INNS" />

            <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 font-sans">
                {/* 1. HEADER & KPI CARDS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-wider">
                            <Bell className="w-4 h-4" />
                            <span>System Operations Hub</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                            Notifications & Operational Alerts
                        </h1>
                        
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {stats.unread > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                            >
                                
                                <span>Mark All Read</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleClearRead}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                        >
                            
                            <span>Clear Read</span>
                        </button>
                    </div>
                </div>

                {/* 2. STATS OVERVIEW CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase text-slate-400">Total Notifications</span>
                        <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
                        <span className="text-[10px] text-slate-500 font-medium">Logged in inbox</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase text-blue-600">Unread Alerts</span>
                        <div className="text-2xl font-black text-blue-600 mt-1">{stats.unread}</div>
                        <span className="text-[10px] text-blue-600 font-semibold">Requiring attention</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase text-emerald-600">Today's Alerts</span>
                        <div className="text-2xl font-black text-slate-900 mt-1">{stats.today}</div>
                        <span className="text-[10px] text-emerald-600 font-semibold">Recent 24 hours</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase text-rose-600">Urgent Alerts</span>
                        <div className="text-2xl font-black text-rose-600 mt-1">{stats.urgent}</div>
                        <span className="text-[10px] text-rose-600 font-semibold">Priority action</span>
                    </div>
                </div>

                {/* 3. FILTER TABS & SEARCH */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Status Filter Buttons */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
                            <button
                                type="button"
                                onClick={() => handleFilterChange('all')}
                                className={`px-3 py-1.5 rounded-lg transition ${
                                    selectedFilter === 'all'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                All ({stats.total})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterChange('unread')}
                                className={`px-3 py-1.5 rounded-lg transition ${
                                    selectedFilter === 'unread'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Unread ({stats.unread})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterChange('read')}
                                className={`px-3 py-1.5 rounded-lg transition ${
                                    selectedFilter === 'read'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Read
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-72">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs font-bold scrollbar-none">
                        {[
                            { key: 'all', label: 'All Modules' },
                            { key: 'reservation', label: 'Reservations & Check-In' },
                            { key: 'housekeeping', label: 'Housekeeping' },
                            { key: 'finance', label: 'Finance & Approvals' },
                            { key: 'inventory', label: 'Store & Stock' },
                            { key: 'maintenance', label: 'Maintenance' },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => handleCategoryChange(cat.key)}
                                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                                    selectedCategory === cat.key
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. NOTIFICATIONS LIST */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                    {filteredNotifications.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                            <h3 className="text-base font-bold text-slate-700">No Notifications Found</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                {searchQuery
                                    ? `No notifications matched "${searchQuery}". Try a different keyword.`
                                    : 'There are no active notifications in this category right now.'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-slate-50/80 ${
                                    !n.is_read ? 'bg-blue-50/25 border-l-4 border-l-blue-600' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${getCategoryBg(n.category)}`}>
                                        {getCategoryIcon(n.category)}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-extrabold text-slate-900 text-sm">
                                                {n.title}
                                            </span>
                                            {getSeverityBadge(n.severity)}
                                            {!n.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                                            {n.message}
                                        </p>

                                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{n.created_at}</span>
                                            </span>
                                            <span>•</span>
                                            <span>{n.created_date}</span>
                                            {n.read_at && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-emerald-600 font-medium">Read at {n.read_at}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Actions */}
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    {n.action_url && (
                                        <Link
                                            href={route('notifications.go', n.id)}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
                                        >
                                            <span>View</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    )}

                                    {!n.is_read && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleMarkRead(n.id, e)}
                                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                                            title="Mark as read"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Read</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(n.id, e)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                        title="Delete notification"
                                    >
                                        
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

