import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RoomArrangementGrid from '@/Components/RoomArrangementGrid';
import RoomAvailabilityCalendar, { CalendarProps } from '@/Components/RoomAvailabilityCalendar';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Bed,
    BedDouble,
    Calendar,
    CalendarDays,
    Check,
    CheckCircle2,
    CheckSquare,
    ChevronRight,
    Clock,
    Crown,
    DollarSign,
    DoorClosed,
    DoorOpen,
    Eye,
    FileText,
    Filter,
    Info,
    LogOut,
    Luggage,
    Megaphone,
    MessageSquare,
    Phone,
    Plus,
    Receipt,
    RefreshCw,
    Search,
    Send,
    Sparkles,
    User,
    UserCheck,
    Users,
    Utensils,
    Wrench,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface GuestMovement {
    id: string | number;
    guest?: {
        full_name?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        email?: string;
    };
    room?: {
        room_number?: string;
        room_type?: { name?: string };
        roomType?: { name?: string };
    };
    reservation_rooms?: Array<{
        room?: { room_number?: string };
        room_type?: { name?: string };
        roomType?: { name?: string };
    }>;
    check_in?: string;
    check_out?: string;
    checked_in_at?: string;
    status?: string;
    folio?: { id: string | number; balance_minor?: number };
}

interface RoomItem {
    id: string;
    room_number: string;
    type_name: string;
    status_occupancy: string;
    status_hk: string;
    guest_name?: string;
}

interface DashboardProps extends PageProps {
    selectedRange: string;
    isReceptionist?: boolean;
    pendingFoliosCount?: number;
    allRooms?: RoomItem[];
    calendarData?: CalendarProps;
    stats: {
        current_business_date: string;
        occupancy_percent: number;
        total_rooms: number;
        occupied_rooms: number;
        vacant_clean: number;
        vacant_dirty: number;
        out_of_service: number;
        today_revenue_minor: number;
        room_revenue_minor: number;
        pos_revenue_minor: number;
        expenses_minor: number;
        outstanding_minor: number;
        net_profit_minor: number;
        adr: number;
        revpar: number;
        in_house_count: number;
        arrivals_count: number;
        departures_count: number;
        available_count: number;
        reserved_count: number;
        revenue_change_pct: number;
    };
    arrivals?: GuestMovement[];
    departures?: GuestMovement[];
    inHouseStays?: GuestMovement[];
    revenueTrend?: Array<{ date: string; amount: number }>;
    ownerDirectives?: Array<any>;
    myRequisitions?: Array<any>;
    isOwnerInspecting?: boolean;
    ownerInspectingPropertyName?: string;
}

export default function Dashboard({
    auth,
    stats,
    selectedRange = '7days',
    arrivals = [],
    departures = [],
    inHouseStays = [],
    isReceptionist: isPropReceptionist,
    pendingFoliosCount = 0,
    allRooms = [],
    calendarData,
    ownerDirectives = [],
    myRequisitions = [],
    isOwnerInspecting = false,
    ownerInspectingPropertyName,
}: DashboardProps) {
    const activeRole = (auth as any)?.active_role || auth?.user?.active_role || auth?.user?.role || '';
    const isManagerRole = ['general_manager', 'manager', 'owner', 'super_admin'].includes(activeRole);
    const isReceptionist = isPropReceptionist !== undefined
        ? isPropReceptionist
        : (!isManagerRole && ['receptionist', 'front_desk', 'front_office', 'front_office_manager', 'staff'].includes(activeRole));
    const [workstationView, setWorkstationView] = useState<'calendar' | 'movement'>('calendar');
    const [movementTab, setMovementTab] = useState<'arrivals' | 'departures' | 'in_house'>(
        isReceptionist ? 'arrivals' : 'in_house'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [roomRackFilter, setRoomRackFilter] = useState<'all' | 'clean' | 'occupied' | 'dirty' | 'maintenance'>('all');
    const [showRequisitionModal, setShowRequisitionModal] = useState(false);

    const requisitionForm = useForm({
        title: '',
        category: 'maintenance',
        amount: '',
        urgency: 'routine',
        justification: '',
        vendor_name: '',
    });

    const handleAcknowledgeDirective = (directiveId: string) => {
        router.post(route('manager.directives.acknowledge', directiveId), {}, {
            preserveScroll: true,
        });
    };

    const handleRequisitionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requisitionForm.post(route('manager.requisitions.store'), {
            onSuccess: () => {
                setShowRequisitionModal(false);
                requisitionForm.reset();
            },
        });
    };

    const defaultStats = {
        current_business_date: 'Today',
        occupancy_percent: 0,
        total_rooms: 0,
        occupied_rooms: 0,
        vacant_clean: 0,
        vacant_dirty: 0,
        out_of_service: 0,
        today_revenue_minor: 0,
        room_revenue_minor: 0,
        pos_revenue_minor: 0,
        expenses_minor: 0,
        outstanding_minor: 0,
        net_profit_minor: 0,
        adr: 0,
        revpar: 0,
        in_house_count: 0,
        arrivals_count: 0,
        departures_count: 0,
        available_count: 0,
        reserved_count: 0,
        revenue_change_pct: 0,
    };
    const safeStats = { ...defaultStats, ...(stats || {}) };

    const formatCurrency = (amountMinor: number = 0) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.round((amountMinor || 0) / 100));
    };

    const handleRangeChange = (range: string) => {
        router.get(route('dashboard'), { range }, { preserveState: true, preserveScroll: true });
    };

    const revenueChangePct = safeStats.revenue_change_pct ?? 0;
    const safeArrivals = arrivals || [];
    const safeDepartures = departures || [];
    const safeInHouse = inHouseStays || [];
    const safeRooms = allRooms || [];

    // Filtered Movements for Receptionist
    const filteredArrivals = useMemo(() => {
        if (!searchQuery) return safeArrivals;
        const q = searchQuery.toLowerCase();
        return safeArrivals.filter((a) => {
            const guestName = (a?.guest?.full_name || `${a?.guest?.first_name || ''} ${a?.guest?.last_name || ''}`).toLowerCase();
            const phone = (a?.guest?.phone || '').toLowerCase();
            const roomNum = (a?.reservation_rooms?.[0]?.room?.room_number || a?.room?.room_number || '').toLowerCase();
            return guestName.includes(q) || phone.includes(q) || roomNum.includes(q);
        });
    }, [safeArrivals, searchQuery]);

    const filteredDepartures = useMemo(() => {
        if (!searchQuery) return safeDepartures;
        const q = searchQuery.toLowerCase();
        return safeDepartures.filter((d) => {
            const guestName = (d?.guest?.full_name || `${d?.guest?.first_name || ''} ${d?.guest?.last_name || ''}`).toLowerCase();
            const phone = (d?.guest?.phone || '').toLowerCase();
            const roomNum = (d?.reservation_rooms?.[0]?.room?.room_number || d?.room?.room_number || '').toLowerCase();
            return guestName.includes(q) || phone.includes(q) || roomNum.includes(q);
        });
    }, [safeDepartures, searchQuery]);

    const filteredInHouse = useMemo(() => {
        if (!searchQuery) return safeInHouse;
        const q = searchQuery.toLowerCase();
        return safeInHouse.filter((s) => {
            const guestName = (s?.guest?.full_name || `${s?.guest?.first_name || ''} ${s?.guest?.last_name || ''}`).toLowerCase();
            const phone = (s?.guest?.phone || '').toLowerCase();
            const roomNum = (s?.room?.room_number || '').toLowerCase();
            return guestName.includes(q) || phone.includes(q) || roomNum.includes(q);
        });
    }, [safeInHouse, searchQuery]);

    // Filtered Room Rack
    const filteredRooms = useMemo(() => {
        if (roomRackFilter === 'all') return safeRooms;
        if (roomRackFilter === 'clean') return safeRooms.filter((r) => r?.status_occupancy === 'vacant' && (r?.status_hk === 'clean' || r?.status_hk === 'inspected'));
        if (roomRackFilter === 'occupied') return safeRooms.filter((r) => r?.status_occupancy === 'occupied');
        if (roomRackFilter === 'dirty') return safeRooms.filter((r) => r?.status_hk === 'dirty');
        if (roomRackFilter === 'maintenance') return safeRooms.filter((r) => r?.status_hk === 'out_of_order' || r?.status_hk === 'out_of_service');
        return safeRooms;
    }, [safeRooms, roomRackFilter]);

    return (
        <AuthenticatedLayout>
            <Head title={isReceptionist ? 'THE INNS' : 'THE INNS'} />

            {isReceptionist ? (
                /* ========================================================================= */
                /* RECEPTIONIST DASHBOARD (FRONT DESK OPERATIONAL WORKSTATION)                */
                /* ========================================================================= */
                <div className="w-full max-w-[1550px] mx-auto space-y-4 sm:space-y-5">
                    {/* 1. Reception Header & Fast Action Console */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                        <div>
                            
                            <h1 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                                Receptionist Operational Console
                            </h1>
                            
                        </div>

                        {/* Fast Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('reservations.create')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                            >
                                <span>New Booking</span>
                            </Link>

                            <Link
                                href={route('reservations.checkin')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                            >
                                <span>Check-In ({safeStats.arrivals_count})</span>
                            </Link>

                            <Link
                                href={route('reservations.checkout')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                            >
                                <span>Check-Out ({safeStats.departures_count})</span>
                            </Link>

                            <Link
                                href={route('guests.index')}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                            >
                                <span>Guest Directory</span>
                            </Link>
                        </div>
                    </div>

                    {/* 2. Front Desk Operational KPI Cards (8 Key Cards) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
                        {/* 1. Arrivals Today */}
                        <Link
                            href={route('reservations.checkin')}
                            className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition flex flex-col justify-between"
                        >
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Arrivals</span>
                            <div className="mt-2 text-xl font-black text-slate-900">{safeStats.arrivals_count}</div>
                        </Link>

                        {/* 2. Departures Today */}
                        <Link
                            href={route('reservations.checkout')}
                            className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs transition flex flex-col justify-between"
                        >
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Departures</span>
                            <div className="mt-2 text-xl font-black text-slate-900">{safeStats.departures_count}</div>
                        </Link>

                        {/* 3. In-House Guests */}
                        <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">In-House</span>
                            <div className="mt-2 text-xl font-black text-slate-900">{safeStats.in_house_count}</div>
                        </div>

                        {/* 4. Available Rooms */}
                        <Link
                            href={route('housekeeping.index')}
                            className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition flex flex-col justify-between"
                        >
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Available</span>
                            <div className="mt-2 text-xl font-black text-emerald-700">{safeStats.available_count}</div>
                        </Link>

                        {/* 5. Occupied Rooms */}
                        <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">Occupied</span>
                                <span className="text-[10px] font-bold text-sky-600">{safeStats.occupancy_percent}%</span>
                            </div>
                            <div className="mt-2 text-xl font-black text-slate-900">{safeStats.occupied_rooms}</div>
                        </div>

                        {/* 6. Dirty Rooms */}
                        <Link
                            href={route('housekeeping.status')}
                            className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs transition flex flex-col justify-between"
                        >
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Dirty Rooms</span>
                            <div className="mt-2 text-xl font-black text-amber-700">{safeStats.vacant_dirty}</div>
                        </Link>

                        {/* 7. Pending Bookings */}
                        <Link
                            href={route('reservations.index')}
                            className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:border-purple-300 hover:shadow-xs transition flex flex-col justify-between"
                        >
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">Pending</span>
                            <div className="mt-2 text-xl font-black text-slate-900">{safeStats.reserved_count}</div>
                        </Link>

                        {/* 8. Maintenance / Out of Order Rooms */}
                        <Link
                            href={route('maintenance.index')}
                            className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:border-rose-300 hover:shadow-xs transition flex flex-col justify-between"
                        >
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Out of Order</span>
                            <div className="mt-2 text-xl font-black text-rose-700">{safeStats.out_of_service}</div>
                        </Link>
                    </div>

                    {/* 3. Front Desk Room Availability Calendar Workstation (Replaces old arrivals table) */}
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setWorkstationView('calendar')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                        workstationView === 'calendar'
                                            ? 'bg-[#1E3A5F] text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Room Availability Calendar (Gantt Matrix)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setWorkstationView('movement')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                        workstationView === 'movement'
                                            ? 'bg-[#1E3A5F] text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Luggage className="w-3.5 h-3.5" />
                                    <span>Arrivals & Departures ({safeArrivals.length + safeDepartures.length})</span>
                                </button>
                            </div>

                            <span className="text-[11px] font-bold text-slate-500">
                                {workstationView === 'calendar' ? 'Interactive Room Matrix & Timeline' : 'Daily Movement Log'}
                            </span>
                        </div>

                        {workstationView === 'calendar' ? (
                            <RoomAvailabilityCalendar {...(calendarData || {})} />
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-4 sm:p-5 space-y-4">
                        {/* Header & Search */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            {/* Tab Switcher */}
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setMovementTab('arrivals')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                        movementTab === 'arrivals'
                                            ? 'bg-white text-blue-700 shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Luggage className="w-3.5 h-3.5" />
                                    <span>Arrivals Today ({safeArrivals.length})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setMovementTab('departures')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                        movementTab === 'departures'
                                            ? 'bg-white text-amber-700 shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <DoorOpen className="w-3.5 h-3.5" />
                                    <span>Departures Today ({safeDepartures.length})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setMovementTab('in_house')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                        movementTab === 'in_house'
                                            ? 'bg-white text-indigo-700 shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <span>In-House Guests ({safeInHouse.length})</span>
                                </button>
                            </div>

                            {/* Search Filter */}
                            <div className="relative w-full md:w-72">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search guest, room, or phone..."
                                    className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Movement Table */}
                        <div className="overflow-x-auto">
                            {movementTab === 'arrivals' && (
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                            <th className="py-2.5 px-3">Guest Name</th>
                                            <th className="py-2.5 px-3">Phone</th>
                                            <th className="py-2.5 px-3">Assigned Room</th>
                                            <th className="py-2.5 px-3">Room Type</th>
                                            <th className="py-2.5 px-3">Stay Dates</th>
                                            <th className="py-2.5 px-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredArrivals.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-6 text-center text-slate-400">
                                                    No expected arrivals found for today.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredArrivals.map((arr) => {
                                                const guestName = arr.guest?.full_name || `${arr.guest?.first_name || ''} ${arr.guest?.last_name || ''}`.trim() || 'Guest';
                                                const phone = arr.guest?.phone || '—';
                                                const roomNum = arr.reservation_rooms?.[0]?.room?.room_number || arr.room?.room_number || 'Unassigned';
                                                const roomType = arr.reservation_rooms?.[0]?.room_type?.name || arr.reservation_rooms?.[0]?.roomType?.name || arr.room?.room_type?.name || 'Standard';

                                                return (
                                                    <tr key={arr.id} className="hover:bg-slate-50/70 transition">
                                                        <td className="py-2.5 px-3 font-bold text-slate-900">{guestName}</td>
                                                        <td className="py-2.5 px-3 text-slate-500">{phone}</td>
                                                        <td className="py-2.5 px-3">
                                                            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                                                roomNum === 'Unassigned'
                                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                    : 'bg-blue-50 text-blue-700 font-mono font-black'
                                                            }`}>
                                                                {roomNum}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-slate-600">{roomType}</td>
                                                        <td className="py-2.5 px-3 text-slate-500">
                                                            {arr.check_in} → {arr.check_out}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            <Link
                                                                href={route('reservations.index')}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs transition"
                                                            >
                                                                <UserCheck className="w-3 h-3" />
                                                                <span>Check-In</span>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {movementTab === 'departures' && (
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                            <th className="py-2.5 px-3">Guest Name</th>
                                            <th className="py-2.5 px-3">Room #</th>
                                            <th className="py-2.5 px-3">Check-In Date</th>
                                            <th className="py-2.5 px-3">Folio Balance</th>
                                            <th className="py-2.5 px-3">Folio Status</th>
                                            <th className="py-2.5 px-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredDepartures.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-6 text-center text-slate-400">
                                                    No departures scheduled for today.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDepartures.map((dep) => {
                                                const guestName = dep.guest?.full_name || `${dep.guest?.first_name || ''} ${dep.guest?.last_name || ''}`.trim() || 'Guest';
                                                const roomNum = dep.reservation_rooms?.[0]?.room?.room_number || dep.room?.room_number || '—';
                                                const balanceMinor = dep.folio?.balance_minor ?? 0;

                                                return (
                                                    <tr key={dep.id} className="hover:bg-slate-50/70 transition">
                                                        <td className="py-2.5 px-3 font-bold text-slate-900">{guestName}</td>
                                                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{roomNum}</td>
                                                        <td className="py-2.5 px-3 text-slate-500">{dep.check_in ?? '—'}</td>
                                                        <td className="py-2.5 px-3 font-bold text-slate-900">
                                                            {formatCurrency(balanceMinor)}
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                balanceMinor > 0
                                                                    ? 'bg-rose-100 text-rose-800'
                                                                    : 'bg-emerald-100 text-emerald-800'
                                                            }`}>
                                                                {balanceMinor > 0 ? 'Balance Due' : 'Settled'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            <Link
                                                                href={dep.folio?.id ? route('folios.show', dep.folio.id) : route('reservations.index')}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-2xs transition"
                                                            >
                                                                <DoorOpen className="w-3 h-3" />
                                                                <span>Check-Out</span>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {movementTab === 'in_house' && (
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                            <th className="py-2.5 px-3">Room #</th>
                                            <th className="py-2.5 px-3">Guest Name</th>
                                            <th className="py-2.5 px-3">Phone</th>
                                            <th className="py-2.5 px-3">Check-In</th>
                                            <th className="py-2.5 px-3">Expected Departure</th>
                                            <th className="py-2.5 px-3 text-right">Folio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredInHouse.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-6 text-center text-slate-400">
                                                    No in-house guests currently registered.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredInHouse.map((stay) => {
                                                const guestName = stay.guest?.full_name || `${stay.guest?.first_name || ''} ${stay.guest?.last_name || ''}`.trim() || 'Guest';
                                                const roomNum = stay.room?.room_number || '—';

                                                return (
                                                    <tr key={stay.id} className="hover:bg-slate-50/70 transition">
                                                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{roomNum}</td>
                                                        <td className="py-2.5 px-3 font-bold text-slate-900">{guestName}</td>
                                                        <td className="py-2.5 px-3 text-slate-500">{stay.guest?.phone || '—'}</td>
                                                        <td className="py-2.5 px-3 text-slate-500">{stay.checked_in_at ? stay.checked_in_at.substring(0, 10) : '—'}</td>
                                                        <td className="py-2.5 px-3 text-slate-500">{stay.check_out ?? '—'}</td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            {stay.folio?.id ? (
                                                                <Link
                                                                    href={route('folios.show', stay.folio.id)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition"
                                                                >
                                                                    <FileText className="w-3 h-3 text-slate-500" />
                                                                    <span>Folio</span>
                                                                </Link>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

                    {/* 4. Live Front Desk Room Arrangement (Interactive Popover Grid matching Image 2) */}
                    <RoomArrangementGrid
                        rooms={safeRooms as any}
                        businessDate={stats?.current_business_date}
                        mode="dashboard"
                        title="Front Desk Rooms Arrangement"
                    />
                </div>
            ) : (
                /* ========================================================================= */
                /* MANAGER / EXECUTIVE DASHBOARD (FINANCIAL, STRATEGIC & OVERVIEW)           */
                /* ========================================================================= */
                <div className="w-full max-w-[1550px] mx-auto space-y-4 sm:space-y-5">
                    {/* 1. Header & Filter Bar (Compact & Sleek) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div>
                            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                                Hotel Operations Dashboard
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                            {/* Submit Requisition to Owner Button */}
                            <button
                                type="button"
                                onClick={() => setShowRequisitionModal(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
                                title="Omba idhini ya matumizi au vifaa kwa Mmiliki wa Hoteli"
                            >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Omba Idhini kwa Mmiliki</span>
                            </button>

                            {/* Range Select */}
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <select
                                    value={selectedRange}
                                    onChange={(e) => handleRangeChange(e.target.value)}
                                    className="bg-transparent border-0 p-0 text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer"
                                >
                                    <option value="today">Today</option>
                                    <option value="7days">Last 7 Days</option>
                                    <option value="30days">Last 30 Days</option>
                                </select>
                            </div>

                            {/* Calendar Quick Link */}
                            <Link
                                href={route('calendar.index')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                            >
                                <CalendarDays className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                <span>Calendar View</span>
                            </Link>
                        </div>
                    </div>

                    {/* 1.1 Executive Directives from Property Owner (Chain of Command Alert) */}
                    {ownerDirectives && ownerDirectives.length > 0 && (
                        <div className="space-y-2.5">
                            {ownerDirectives.map((dir: any) => (
                                <div
                                    key={dir.id}
                                    className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#1E3A5F] to-slate-900 text-white border border-[#D4AF37]/50 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow">
                                            <Crown className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                                                    Mwongozo wa Mmiliki
                                                </span>
                                                <span className="text-[11px] font-bold text-amber-300 uppercase">
                                                    [{dir.category}] • {dir.priority} priority
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-black text-white mt-1">{dir.title}</h4>
                                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{dir.directive_text}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        {dir.status === 'acknowledged' ? (
                                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Imethibitishwa</span>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleAcknowledgeDirective(dir.id)}
                                                className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8960C] text-slate-950 font-black text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Check className="w-4 h-4" />
                                                <span>Thibitisha Kupokea</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 2. Top Summary Metrics Cards (Executive View) */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                        {/* TOTAL ROOMS */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                                TOTAL ROOMS
                            </span>
                            <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-slate-900 mt-1 leading-tight">
                                {safeStats.total_rooms}
                            </div>
                        </div>

                        {/* AVAILABLE */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 block truncate">
                                AVAILABLE
                            </span>
                            <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-emerald-700 mt-1 leading-tight">
                                {safeStats.available_count}
                            </div>
                        </div>

                        {/* OCCUPIED */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-600 block truncate">
                                    OCCUPIED
                                </span>
                                <span className="text-[10px] font-bold text-blue-600/80">
                                    {safeStats.occupancy_percent}%
                                </span>
                            </div>
                            <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-blue-700 mt-1 leading-tight">
                                {safeStats.occupied_rooms}
                            </div>
                        </div>

                        {/* REVENUE */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 block truncate">
                                    REVENUE
                                </span>
                                <span className={`text-[11px] font-semibold ${revenueChangePct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {revenueChangePct >= 0 ? `+${revenueChangePct}%` : `${revenueChangePct}%`}
                                </span>
                            </div>
                            <div
                                className="text-sm sm:text-lg lg:text-base xl:text-lg 2xl:text-2xl font-black text-slate-900 mt-1 leading-tight truncate"
                                title={formatCurrency(safeStats.today_revenue_minor)}
                            >
                                {formatCurrency(safeStats.today_revenue_minor)}
                            </div>
                        </div>

                        {/* SMS CREDITS BALANCE */}
                        <Link
                            href={route('whatsapp.index')}
                            className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition block cursor-pointer"
                        >
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 block truncate">
                                SMS BALANCE
                            </span>
                            <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-slate-900 mt-1 leading-tight">
                                {Number((auth as any)?.sms_balance ?? 0).toLocaleString()}
                            </div>
                        </Link>
                    </div>

                    {/* 3. Room Status Overview Card */}
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Room Status Overview</h2>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {safeStats.total_rooms} Rooms Total
                                    </span>
                                </div>
                                
                            </div>

                            <Link
                                href={route('housekeeping.index')}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                            >
                                <span>Room Overview Report</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="h-3 sm:h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-500"
                                    style={{ width: `${safeStats.total_rooms > 0 ? (safeStats.occupied_rooms / safeStats.total_rooms) * 100 : 0}%` }}
                                    title={`Occupied: ${safeStats.occupied_rooms}`}
                                />
                                <div
                                    className="bg-emerald-500 h-full transition-all duration-500"
                                    style={{ width: `${safeStats.total_rooms > 0 ? (safeStats.vacant_clean / safeStats.total_rooms) * 100 : 0}%` }}
                                    title={`Clean: ${safeStats.vacant_clean}`}
                                />
                                <div
                                    className="bg-amber-400 h-full transition-all duration-500"
                                    style={{ width: `${safeStats.total_rooms > 0 ? (safeStats.vacant_dirty / safeStats.total_rooms) * 100 : 0}%` }}
                                    title={`Dirty: ${safeStats.vacant_dirty}`}
                                />
                                <div
                                    className="bg-rose-500 h-full transition-all duration-500"
                                    style={{ width: `${safeStats.total_rooms > 0 ? (safeStats.out_of_service / safeStats.total_rooms) * 100 : 0}%` }}
                                    title={`Out of Order: ${safeStats.out_of_service}`}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs pt-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                    <span className="text-slate-600 font-medium">Occupied ({safeStats.occupied_rooms})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-slate-600 font-medium">Clean & Inspected ({safeStats.vacant_clean})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                    <span className="text-slate-600 font-medium">Dirty ({safeStats.vacant_dirty})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    <span className="text-slate-600 font-medium">Out of Service ({safeStats.out_of_service})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Manager Financials & Operations Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                        {/* Left: Guest Movements (7 Cols) */}
                        <div className="lg:col-span-7 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Guest Movements</h3>
                                    
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setMovementTab('in_house')}
                                        className={`px-2.5 py-1 rounded-md transition ${movementTab === 'in_house' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
                                    >
                                        In-House ({safeInHouse.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMovementTab('arrivals')}
                                        className={`px-2.5 py-1 rounded-md transition ${movementTab === 'arrivals' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
                                    >
                                        Arrivals ({safeArrivals.length})
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[320px] overflow-y-auto">
                                {movementTab === 'in_house' ? (
                                    inHouseStays.length === 0 ? (
                                        <div className="py-8 text-center text-slate-400 text-xs">No active in-house guests.</div>
                                    ) : (
                                        inHouseStays.map((stay) => {
                                            const guestName = stay.guest?.full_name || `${stay.guest?.first_name || ''} ${stay.guest?.last_name || ''}`.trim() || 'Guest';
                                            const roomNum = stay.room?.room_number ?? '—';
                                            return (
                                                <div key={stay.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                                                            {roomNum}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-900">{guestName}</div>
                                                            <div className="text-[10px] text-slate-400">Checkout: {stay.check_out ?? '—'}</div>
                                                        </div>
                                                    </div>
                                                    <Link href={route('guests.index')} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                                        View
                                                    </Link>
                                                </div>
                                            );
                                        })
                                    )
                                ) : (
                                    arrivals.length === 0 ? (
                                        <div className="py-8 text-center text-slate-400 text-xs">No expected arrivals today.</div>
                                    ) : (
                                        arrivals.map((arr) => {
                                            const guestName = arr.guest?.full_name || `${arr.guest?.first_name || ''} ${arr.guest?.last_name || ''}`.trim() || 'Guest';
                                            const roomNum = arr.reservation_rooms?.[0]?.room?.room_number ?? 'Unassigned';
                                            return (
                                                <div key={arr.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                                                            {roomNum}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-900">{guestName}</div>
                                                            <div className="text-[10px] text-slate-400">{arr.check_in} → {arr.check_out}</div>
                                                        </div>
                                                    </div>
                                                    <Link href={route('reservations.index')} className="text-xs font-bold text-emerald-600 hover:text-emerald-800">
                                                        Check In
                                                    </Link>
                                                </div>
                                            );
                                        })
                                    )
                                )}
                            </div>
                        </div>

                        {/* Right: Revenue Breakdown & Financial Overview (5 Cols) */}
                        <div className="lg:col-span-5 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-sm sm:text-base font-bold text-slate-900">Revenue & Rates</h3>
                            </div>

                            <div className="space-y-2.5">
                                {/* Room Revenue */}
                                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <span className="text-xs font-bold text-slate-800">Room Accommodation</span>
                                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">{formatCurrency(safeStats.room_revenue_minor)}</div>
                                </div>

                                {/* Restaurant & POS */}
                                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <span className="text-xs font-bold text-slate-800">Restaurant & POS</span>
                                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">{formatCurrency(safeStats.pos_revenue_minor)}</div>
                                </div>

                                {/* Outstanding Folios */}
                                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                                    <span className="text-xs font-bold text-slate-800">Pending Folios</span>
                                    <div className="text-xs sm:text-sm font-extrabold text-rose-600">{formatCurrency(safeStats.outstanding_minor)}</div>
                                </div>
                            </div>

                            {/* ADR and RevPAR */}
                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 bg-white">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ADR (Avg Rate)</span>
                                    <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">{formatCurrency(safeStats.adr)}</div>
                                </div>

                                <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 bg-white">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RevPAR</span>
                                    <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">{formatCurrency(safeStats.revpar)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Requisition Submission Modal for Managers */}
            {showRequisitionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
                        <button
                            type="button"
                            onClick={() => setShowRequisitionModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                <CheckSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">Tuma Ombi la Idhini kwa Mmiliki</h3>
                                <p className="text-xs text-slate-500">Ombi la ununuzi, vifaa au matengenezo yanayohitaji idhini</p>
                            </div>
                        </div>

                        <form onSubmit={handleRequisitionSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-700 font-bold mb-1">Kichwa cha Ombi (Title):</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Mfano: Ununuzi wa jenereta mpya au mashuka ya akiba"
                                    value={requisitionForm.data.title}
                                    onChange={e => requisitionForm.setData('title', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Kategoria:</label>
                                    <select
                                        value={requisitionForm.data.category}
                                        onChange={e => requisitionForm.setData('category', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 p-2.5 text-xs text-slate-900"
                                    >
                                        <option value="maintenance">Matengenezo (Maintenance)</option>
                                        <option value="supplies">Vifaa vya Kazi (Supplies)</option>
                                        <option value="equipment">Mitungi / Mashine (Equipment)</option>
                                        <option value="renovation">Maboresho ya Vyumba (Renovation)</option>
                                        <option value="utilities">Bili & Nishati (Utilities)</option>
                                        <option value="staff">Wafanyakazi (Staff Welfare)</option>
                                        <option value="other">Mengineyo (Other)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Kipaumbele (Urgency):</label>
                                    <select
                                        value={requisitionForm.data.urgency}
                                        onChange={e => requisitionForm.setData('urgency', e.target.value as any)}
                                        className="w-full rounded-xl border-slate-200 p-2.5 text-xs text-slate-900"
                                    >
                                        <option value="routine">Kawaida (Routine)</option>
                                        <option value="priority">Kipaumbele (Priority)</option>
                                        <option value="emergency">Dharura (Emergency)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Kiasi Kinachoombwa (TZS):</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Kiasi kwa TZS"
                                        value={requisitionForm.data.amount}
                                        onChange={e => requisitionForm.setData('amount', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 p-2.5 text-xs font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Jina la Msambazaji (Vendor):</label>
                                    <input
                                        type="text"
                                        placeholder="Hiari / Optional"
                                        value={requisitionForm.data.vendor_name}
                                        onChange={e => requisitionForm.setData('vendor_name', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 p-2.5 text-xs text-slate-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">Sababu & Ufafanuzi (Justification):</label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder="Eleza kwa nini gharama hii inahitajika na faida yake kwa uendeshaji wa tawi..."
                                    value={requisitionForm.data.justification}
                                    onChange={e => requisitionForm.setData('justification', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 p-2.5 text-xs text-slate-900"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowRequisitionModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
                                >
                                    Ghairi
                                </button>
                                <button
                                    type="submit"
                                    disabled={requisitionForm.processing}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow transition"
                                >
                                    Tuma Ombi kwa Mmiliki
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
