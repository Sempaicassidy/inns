import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Reservation, Stay } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    BadgePercent,
    Bed,
    BedDouble,
    Calendar,
    Check,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    LogOut,
    Moon,
    Plus,
    Sparkles,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface DashboardStats {
    current_business_date: string;
    occupancy_percent: number;
    total_rooms: number;
    occupied_rooms: number;
    vacant_clean: number;
    vacant_dirty: number;
    out_of_service: number;
    today_revenue_minor: number;
    room_revenue_minor: number;
    adr: number;
    revpar: number;
    in_house_count: number;
    arrivals_count: number;
    departures_count: number;
}

interface DashboardProps extends PageProps {
    stats: DashboardStats;
    arrivals: Reservation[];
    departures: Reservation[];
    inHouseStays: Stay[];
}

export default function Dashboard({ auth, stats, arrivals, departures, inHouseStays }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<'arrivals' | 'departures' | 'in_house'>('arrivals');
    const [selectedResForCheckIn, setSelectedResForCheckIn] = useState<Reservation | null>(null);

    const { post: postCheckOut, processing: checkingOut } = useForm({});

    const formatTZS = (minor: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format(minor / 100);
    };

    const handleCheckOut = (resId: string) => {
        if (confirm('Are you sure you want to check out this guest? Folio will be audited and Room marked Dirty.')) {
            postCheckOut(route('reservations.check-out', resId));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Management Dashboard - Haula HMS" />

            {/* Top Welcome & Quick Actions Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800/90 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs uppercase tracking-wider font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                            Front Office & Operations
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                            {stats.current_business_date}
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-white mt-2 tracking-tight">
                        Karibu, {auth.user.name}
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Here is the live operational summary for {auth.property?.name || 'Haula Serengeti Lodge'}.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                        href={route('reservations.index')}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition duration-150"
                    >
                        <UserPlus className="w-4 h-4 stroke-[2.5]" />
                        <span>New Booking / Walk-In</span>
                    </Link>

                    <Link
                        href={route('calendar.index')}
                        className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs transition duration-150"
                    >
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span>Gantt Calendar</span>
                    </Link>

                    <Link
                        href={route('night-audit.index')}
                        className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs transition duration-150"
                    >
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <span>Night Audit</span>
                    </Link>
                </div>
            </div>

            {/* KPI Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Occupancy Card */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupancy Rate</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            <BadgePercent className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-white font-mono">{stats.occupancy_percent}%</span>
                        <span className="text-xs text-slate-400">
                            ({stats.occupied_rooms} of {stats.total_rooms} rooms)
                        </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, stats.occupancy_percent)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Today's Revenue Card */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Collections</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                            {formatTZS(stats.today_revenue_minor)}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Room & extra service payments collected
                    </p>
                </div>

                {/* ADR & RevPAR Card */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ADR & RevPAR</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <Bed className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400 block">ADR:</span>
                            <span className="text-lg font-bold text-white font-mono">{formatTZS(stats.adr * 100)}</span>
                        </div>
                        <div className="text-right border-l border-slate-800 pl-3">
                            <span className="text-xs text-slate-400 block">RevPAR:</span>
                            <span className="text-lg font-bold text-blue-400 font-mono">{formatTZS(stats.revpar * 100)}</span>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">Excludes taxes and service levy</p>
                </div>

                {/* In-House Guests Card */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In-House Guests</span>
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-indigo-300 font-mono">{stats.in_house_count}</span>
                        <span className="text-xs text-slate-400">active stays</span>
                    </div>
                    <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                        <span>Arrivals: <strong className="text-amber-400">{stats.arrivals_count}</strong></span>
                        <span>Departures: <strong className="text-rose-400">{stats.departures_count}</strong></span>
                    </div>
                </div>
            </div>

            {/* Room Status Breakdown Bar */}
            <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 mb-8 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Room Inventory Status</h2>
                    </div>
                    <Link
                        href={route('housekeeping.index')}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
                    >
                        <span>Open Housekeeping Board &rarr;</span>
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Vacant Clean</span>
                            <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">{stats.vacant_clean}</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
                    </div>

                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-blue-500/20 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Occupied</span>
                            <span className="text-2xl font-black text-blue-400 font-mono mt-0.5 block">{stats.occupied_rooms}</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50"></div>
                    </div>

                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-amber-500/20 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Vacant Dirty</span>
                            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">{stats.vacant_dirty}</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50"></div>
                    </div>

                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-700/40 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400 block font-medium">Out of Service</span>
                            <span className="text-2xl font-black text-slate-400 font-mono mt-0.5 block">{stats.out_of_service}</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                    </div>
                </div>
            </div>

            {/* Operational Action Center (Tabs for Arrivals, Departures, In-House) */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                {/* Tab Navigation */}
                <div className="border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/60">
                    <div className="flex space-x-6">
                        <button
                            onClick={() => setActiveTab('arrivals')}
                            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 ${
                                activeTab === 'arrivals'
                                    ? 'border-amber-400 text-amber-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>Expected Arrivals ({arrivals.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('departures')}
                            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 ${
                                activeTab === 'departures'
                                    ? 'border-rose-400 text-rose-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>Expected Departures ({departures.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('in_house')}
                            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 ${
                                activeTab === 'in_house'
                                    ? 'border-indigo-400 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>In-House Guests ({inHouseStays.length})</span>
                        </button>
                    </div>

                    <span className="text-xs text-slate-500 hidden sm:inline">
                        Live Front Desk Feed
                    </span>
                </div>

                {/* Tab 1: Arrivals */}
                {activeTab === 'arrivals' && (
                    <div className="p-4 sm:p-6">
                        {arrivals.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <UserCheck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                                <p className="text-sm font-semibold">No more arrivals expected today.</p>
                                <p className="text-xs">All scheduled guests have been checked in or no bookings exist for this date.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                                        <tr>
                                            <th className="py-3 px-4">Ref #</th>
                                            <th className="py-3 px-4">Guest Name</th>
                                            <th className="py-3 px-4">Room & Type</th>
                                            <th className="py-3 px-4">Dates</th>
                                            <th className="py-3 px-4">Total Amount</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                        {arrivals.map((res) => {
                                            const resRoom = res.reservation_rooms?.[0];
                                            return (
                                                <tr key={res.id} className="hover:bg-slate-800/40 transition">
                                                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-400">
                                                        {res.ref_no}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-semibold text-white">
                                                            {res.guest?.first_name} {res.guest?.last_name}
                                                        </div>
                                                        <div className="text-slate-400 text-[11px]">
                                                            {res.guest?.phone || res.guest?.email || 'No contact provided'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-medium text-slate-100">
                                                            {resRoom?.room ? `Room ${resRoom.room.room_number}` : 'Unassigned'}
                                                        </div>
                                                        <div className="text-slate-400 text-[11px]">
                                                            {resRoom?.room_type?.name}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono">
                                                        {res.check_in} &rarr; {res.check_out}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                                                        {formatTZS(res.total_minor)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <Link
                                                            href={route('reservations.index')}
                                                            className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-md transition"
                                                        >
                                                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                            <span>Check In</span>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Departures */}
                {activeTab === 'departures' && (
                    <div className="p-4 sm:p-6">
                        {departures.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <CheckCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                                <p className="text-sm font-semibold">No more departures scheduled for today.</p>
                                <p className="text-xs">All departures for today have settled their folios and checked out.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                                        <tr>
                                            <th className="py-3 px-4">Ref #</th>
                                            <th className="py-3 px-4">Guest Name</th>
                                            <th className="py-3 px-4">Room</th>
                                            <th className="py-3 px-4">Folio Balance</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                        {departures.map((res) => {
                                            const folio = res.folios?.[0];
                                            const room = res.reservation_rooms?.[0]?.room;
                                            const balance = folio?.balance_minor ?? 0;
                                            return (
                                                <tr key={res.id} className="hover:bg-slate-800/40 transition">
                                                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-400">
                                                        {res.ref_no}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-semibold text-white">
                                                        {res.guest?.first_name} {res.guest?.last_name}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                                                        {room?.room_number || 'N/A'}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono font-bold">
                                                        {balance > 0 ? (
                                                            <span className="text-rose-400">Due: {formatTZS(balance)}</span>
                                                        ) : (
                                                            <span className="text-emerald-400">Settled (0 TZS)</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right space-x-2">
                                                        {folio && (
                                                            <Link
                                                                href={route('folios.show', folio.id)}
                                                                className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 font-medium"
                                                            >
                                                                <CreditCard className="w-3.5 h-3.5" />
                                                                <span>View Folio</span>
                                                            </Link>
                                                        )}
                                                        <button
                                                            onClick={() => handleCheckOut(res.id)}
                                                            disabled={checkingOut}
                                                            className="inline-flex items-center space-x-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow-md transition disabled:opacity-50"
                                                        >
                                                            <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                                                            <span>Check Out</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: In-House Stays */}
                {activeTab === 'in_house' && (
                    <div className="p-4 sm:p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4">Room</th>
                                        <th className="py-3 px-4">Guest Name</th>
                                        <th className="py-3 px-4">Room Type</th>
                                        <th className="py-3 px-4">Checked-In</th>
                                        <th className="py-3 px-4">Departure Date</th>
                                        <th className="py-3 px-4 text-right">Folio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                    {inHouseStays.map((stay) => {
                                        const res = stay.reservation_room?.reservation;
                                        return (
                                            <tr key={stay.id} className="hover:bg-slate-800/40 transition">
                                                <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-sm">
                                                    {stay.room?.room_number}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-semibold text-white">
                                                        {stay.guest?.first_name} {stay.guest?.last_name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {stay.guest?.nationality} &bull; {stay.guest?.vip_level}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-300">
                                                    {stay.room?.room_type?.name}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-slate-400">
                                                    {new Date(stay.checked_in_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono font-semibold text-white">
                                                    {res?.check_out}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <Link
                                                        href={route('folios.index', { search: stay.room?.room_number })}
                                                        className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold"
                                                    >
                                                        <span>Billing Folio</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
