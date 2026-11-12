import NewReservationModal from '@/Components/NewReservationModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, RatePlan, Room, RoomType } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    Bed,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    CreditCard,
    DollarSign,
    FileText,
    Filter,
    Globe,
    Grid,
    Info,
    List,
    Luggage,
    Mail,
    MessageSquare,
    MessageSquareShare,
    MoreHorizontal,
    Phone,
    PhoneCall,
    Plus,
    Receipt,
    Search,
    Shield,
    Sparkles,
    User,
    UserCheck,
    UserPlus,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface FolioSummary {
    id: string;
    reservation_id: string;
    folio_number: string;
    status: 'open' | 'closed';
    total_charges_minor: number;
    total_payments_minor: number;
    balance_minor: number;
}

interface RoomStaySummary {
    id: string;
    room?: {
        id: string;
        room_number: string;
        floor?: string;
        status_occupancy: string;
        status_hk: string;
        room_type?: {
            id: string;
            name: string;
            code?: string;
        };
    };
    check_in: string;
    check_out: string;
    rate_price_minor?: number;
    status: string;
}

interface GuestReservationSummary {
    id: string;
    ref_no: string;
    status: string;
    check_in: string;
    check_out: string;
    adults: number;
    children: number;
    total_minor: number;
    reservation_rooms?: RoomStaySummary[];
    folios?: FolioSummary[];
}

interface GuestItem {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    phone?: string;
    email?: string;
    nationality?: string;
    is_resident?: boolean;
    id_type?: string;
    id_number?: string;
    vip_level?: string;
    is_blacklisted?: boolean;
    blacklist_reason?: string;
    preferences?: Record<string, any>;
    notes?: string;
    created_at?: string;
    reservations?: GuestReservationSummary[];
    stays?: any[];
}

interface GuestsIndexProps extends PageProps {
    guests: {
        data: GuestItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
    };
    stats: {
        total_guests: number;
        in_house_guests: number;
        total_outstanding_minor: number;
        vip_guests_count: number;
    };
    filters: {
        search: string;
        filter: string;
    };
    rooms: Room[];
    roomTypes: RoomType[];
    ratePlans: RatePlan[];
}

export default function GuestsIndex({
    guests,
    stats,
    filters,
    rooms = [],
    roomTypes = [],
    ratePlans = [],
}: GuestsIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [activeFilter, setActiveFilter] = useState(filters.filter || 'all');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    // Modals and Drawers
    const [selectedGuestForDetail, setSelectedGuestForDetail] = useState<GuestItem | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingGuest, setEditingGuest] = useState<GuestItem | null>(null);

    // Quick Reservation Modal State
    const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
    const [quickBookingGuestId, setQuickBookingGuestId] = useState<string>('');

    // Create Guest Form
    const createForm = useForm({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        nationality: 'Tanzanian',
        is_resident: true,
        id_type: 'national_id',
        id_number: '',
        vip_level: 'Standard',
        notes: '',
    });

    // Edit Guest Form
    const editForm = useForm({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        nationality: 'Tanzanian',
        is_resident: true,
        id_type: 'national_id',
        id_number: '',
        vip_level: 'Standard',
        notes: '',
    });

    const formatTZS = (minor: number) => {
        return (minor / 100).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr.split('T')[0];
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Handle Search Submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('guests.index'),
            { search: searchTerm, filter: activeFilter },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Filter Change
    const handleFilterChange = (filterName: string) => {
        setActiveFilter(filterName);
        router.get(
            route('guests.index'),
            { search: searchTerm, filter: filterName },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Open Edit Modal
    const handleOpenEdit = (guest: GuestItem) => {
        setEditingGuest(guest);
        editForm.setData({
            first_name: guest.first_name || '',
            last_name: guest.last_name || '',
            phone: guest.phone || '',
            email: guest.email || '',
            nationality: guest.nationality || 'Tanzanian',
            is_resident: guest.is_resident ?? true,
            id_type: guest.id_type || 'national_id',
            id_number: guest.id_number || '',
            vip_level: guest.vip_level || 'Standard',
            notes: guest.notes || '',
        });
        setIsEditModalOpen(true);
    };

    // Submit Create Guest
    const submitCreateGuest = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('guests.store'), {
            onSuccess: () => {
                createForm.reset();
                setIsCreateModalOpen(false);
            },
        });
    };

    // Submit Edit Guest
    const submitEditGuest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGuest) return;
        editForm.put(route('guests.update', editingGuest.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingGuest(null);
            },
        });
    };

    // Open Quick Booking Modal
    const handleOpenQuickBooking = (guestId: string) => {
        setQuickBookingGuestId(guestId);
        setIsQuickBookingOpen(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Guest Portal - Guests & Rooms | THE INNS" />

            <div className="w-full max-w-[1850px] mx-auto space-y-4 pb-12 text-slate-800">
                {/* 1. TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                            Guest Portal
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                        >
                            <span>Add Guest</span>
                        </button>
                    </div>
                </div>

                {/* 2. STATS SUMMARY CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                    {/* Total Guests */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
                        <div className="min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                                Total Guests
                            </span>
                            <span className="text-base sm:text-xl font-black text-slate-900">
                                {stats.total_guests.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* In-House Guests */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/10 shadow-2xs flex items-center gap-3">
                        <div className="min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider block truncate">
                                In-House Guests
                            </span>
                            <span className="text-base sm:text-xl font-black text-emerald-800">
                                {stats.in_house_guests.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Total Outstanding Balance */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-200/90 bg-rose-50/10 shadow-2xs flex items-center gap-3">
                        <div className="min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-bold text-rose-700 uppercase tracking-wider block truncate">
                                Outstanding Balance
                            </span>
                            <span className="text-sm sm:text-lg font-black text-rose-700 block truncate">
                                TSh {formatTZS(stats.total_outstanding_minor)}
                            </span>
                        </div>
                    </div>

                    {/* VIP Guests */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/90 bg-amber-50/10 shadow-2xs flex items-center gap-3">

                        <div className="min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider block truncate">
                                VIP Guests
                            </span>
                            <span className="text-base sm:text-xl font-black text-amber-900">
                                {stats.vip_guests_count.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. SEARCH & FILTER CONTROLS BAR */}
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                        {/* Search Input */}
                        <form onSubmit={handleSearch} className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search guest name, phone, room number, email, or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-24 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                                Search
                            </button>
                        </form>

                        {/* View Switcher: Cards vs Table */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('cards')}
                                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                                        viewMode === 'cards' ? 'bg-white text-blue-600 shadow-2xs font-extrabold' : 'text-slate-500'
                                    }`}
                                    title="Cards View"
                                >
                                    <Grid className="w-3.5 h-3.5" />
                                    <span>Cards</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                                        viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs font-extrabold' : 'text-slate-500'
                                    }`}
                                    title="Table View"
                                >
                                    <List className="w-3.5 h-3.5" />
                                    <span>Table</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => handleFilterChange('all')}
                            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition active:scale-95 cursor-pointer ${
                                activeFilter === 'all'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                            All ({stats.total_guests})
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('in_house')}
                            className={`px-3 py-1.5 rounded-xl font-bold border shrink-0 transition active:scale-95 cursor-pointer ${
                                activeFilter === 'in_house'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                        >
                            In-House ({stats.in_house_guests})
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('has_balance')}
                            className={`px-3 py-1.5 rounded-xl font-bold border shrink-0 transition active:scale-95 cursor-pointer ${
                                activeFilter === 'has_balance'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                            }`}
                        >
                            Unsettled Folios
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('vip')}
                            className={`px-3 py-1.5 rounded-xl font-bold border shrink-0 transition active:scale-95 cursor-pointer ${
                                activeFilter === 'vip'
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                        >
                            VIP ({stats.vip_guests_count})
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('checked_out')}
                            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition active:scale-95 cursor-pointer ${
                                activeFilter === 'checked_out'
                                    ? 'bg-slate-700 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                            Checked Out
                        </button>
                    </div>
                </div>

                {/* 4. GUEST LISTING (CARDS VIEW - MOBILE-FIRST) */}
                {viewMode === 'cards' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {guests.data.length === 0 ? (
                            <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <h3 className="text-base font-extrabold text-slate-700">No guests found</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Check your search spelling or change active filter.
                                </p>
                            </div>
                        ) : (
                            guests.data.map((guest) => {
                                const latestRes = guest.reservations?.[0];
                                const currentRoomObj = latestRes?.reservation_rooms?.[0]?.room;
                                const isCurrentlyInHouse = latestRes?.status === 'checked_in';
                                const activeFolio = latestRes?.folios?.[0];
                                const hasPendingBalance = (activeFolio?.balance_minor ?? 0) > 0;

                                return (
                                    <div
                                        key={guest.id}
                                        className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                                            isCurrentlyInHouse
                                                ? 'border-emerald-300 ring-1 ring-emerald-200'
                                                : hasPendingBalance
                                                ? 'border-rose-200'
                                                : 'border-slate-200/90'
                                        }`}
                                    >
                                        {/* Card Header: Guest Details */}
                                        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-11 h-11 rounded-2xl bg-blue-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                                                        {guest.first_name?.charAt(0)}
                                                        {guest.last_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                                                                {guest.first_name} {guest.last_name}
                                                            </h3>
                                                            {guest.vip_level && guest.vip_level !== 'Standard' && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                                                    ★ {guest.vip_level}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                                                            <span>{guest.nationality || 'Tanzanian'}</span>
                                                            {guest.id_number && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{guest.id_type?.replace('_', ' ').toUpperCase()}: {guest.id_number}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                                                        isCurrentlyInHouse
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                            : latestRes?.status === 'confirmed'
                                                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {isCurrentlyInHouse
                                                        ? 'In-House'
                                                        : latestRes?.status === 'confirmed'
                                                        ? 'Confirmed'
                                                        : latestRes?.status === 'checked_out'
                                                        ? 'Checked Out'
                                                        : 'No Active Stay'}
                                                </span>
                                            </div>

                                            {/* Contact Actions: Phone, WhatsApp, Email */}
                                            <div className="flex items-center gap-2 pt-1 text-xs">
                                                {guest.phone ? (
                                                    <>
                                                        <a
                                                            href={`tel:${guest.phone}`}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                                                            title="Call"
                                                        >
                                                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                                                            <span>{guest.phone}</span>
                                                        </a>
                                                        <a
                                                            href={`https://wa.me/${guest.phone.replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                                                            title="WhatsApp"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                        </a>
                                                    </>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">No phone recorded</span>
                                                )}

                                                {guest.email && (
                                                    <a
                                                        href={`mailto:${guest.email}`}
                                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition ml-auto"
                                                        title={guest.email}
                                                    >
                                                        <Mail className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Body: Room Taken & Folio Status */}
                                        <div className="p-4 sm:p-5 space-y-3 bg-slate-50/40 flex-1">
                                            {/* 1. ROOM ASSIGNMENT */}
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                                    Assigned Room
                                                </span>
                                                {currentRoomObj ? (
                                                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                                                                {currentRoomObj.room_number}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="text-xs font-black text-slate-900 block truncate">
                                                                    Room {currentRoomObj.room_number}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 block truncate">
                                                                    {currentRoomObj.room_type?.name || 'Standard'} • {formatDate(latestRes?.check_in)} - {formatDate(latestRes?.check_out)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0 font-mono">
                                                            Ref: {latestRes?.ref_no}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="p-2.5 bg-white border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs font-medium">
                                                        No room currently assigned
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. FOLIO STATUS */}
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                                    Folio Billing
                                                </span>
                                                {activeFolio ? (
                                                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs text-xs">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 font-mono">
                                                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                                                <span>{activeFolio.folio_number}</span>
                                                            </span>

                                                            {hasPendingBalance ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                                                    Unsettled
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                                    Settled
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                                                            <div>
                                                                <span className="text-slate-400 block font-medium">Total Charges:</span>
                                                                <span className="font-bold text-slate-800">
                                                                    TSh {formatTZS(activeFolio.total_charges_minor)}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-slate-400 block font-medium">Balance:</span>
                                                                <span
                                                                    className={`font-black ${
                                                                        hasPendingBalance ? 'text-rose-600' : 'text-emerald-700'
                                                                    }`}
                                                                >
                                                                    TSh {formatTZS(activeFolio.balance_minor)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="pt-1.5 flex justify-end">
                                                            <Link
                                                                href={route('folios.show', activeFolio.id)}
                                                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline cursor-pointer"
                                                            >
                                                                <span>Open Folio Ledger</span>
                                                                <ChevronRight className="w-3.5 h-3.5" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-2.5 bg-white border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs font-medium">
                                                        No active folio
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Footer: Quick Actions */}
                                        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedGuestForDetail(guest)}
                                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                                            >
                                                History
                                            </button>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(guest)}
                                                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenQuickBooking(guest.id)}
                                                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-2xs transition active:scale-95 cursor-pointer"
                                                >
                                                    Book Room
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* 4. GUEST LISTING (TABLE VIEW) */
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                        <th className="py-3 px-4">Guest</th>
                                        <th className="py-3 px-4">Contact</th>
                                        <th className="py-3 px-4">Assigned Room</th>
                                        <th className="py-3 px-4">Stay Dates</th>
                                        <th className="py-3 px-4">Folio Billing</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {guests.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400">
                                                No guests found.
                                            </td>
                                        </tr>
                                    ) : (
                                        guests.data.map((guest) => {
                                            const latestRes = guest.reservations?.[0];
                                            const currentRoomObj = latestRes?.reservation_rooms?.[0]?.room;
                                            const isCurrentlyInHouse = latestRes?.status === 'checked_in';
                                            const activeFolio = latestRes?.folios?.[0];
                                            const hasPendingBalance = (activeFolio?.balance_minor ?? 0) > 0;

                                            return (
                                                <tr
                                                    key={guest.id}
                                                    className="hover:bg-slate-50/80 transition-colors"
                                                >
                                                    {/* Guest Name & VIP */}
                                                    <td className="py-3.5 px-4 font-medium text-slate-900">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                                                {guest.first_name?.charAt(0)}
                                                                {guest.last_name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <span className="font-extrabold text-slate-900 block">
                                                                    {guest.first_name} {guest.last_name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 block">
                                                                    {guest.nationality || 'Tanzanian'} {guest.vip_level && guest.vip_level !== 'Standard' && `• ${guest.vip_level}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Contact */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="space-y-0.5">
                                                            {guest.phone && (
                                                                <div className="font-bold text-slate-800 flex items-center gap-1">
                                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                                    <span>{guest.phone}</span>
                                                                </div>
                                                            )}
                                                            {guest.email && (
                                                                <div className="text-[11px] text-slate-500">
                                                                    {guest.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Room Taken */}
                                                    <td className="py-3.5 px-4">
                                                        {currentRoomObj ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center justify-center">
                                                                    {currentRoomObj.room_number}
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-slate-800 block">
                                                                        Room {currentRoomObj.room_number}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 block">
                                                                        {currentRoomObj.room_type?.name || 'Standard'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No room assigned</span>
                                                        )}
                                                    </td>

                                                    {/* Dates */}
                                                    <td className="py-3.5 px-4">
                                                        {latestRes ? (
                                                            <div className="space-y-0.5">
                                                                <span className="font-bold text-slate-800 block">
                                                                    {formatDate(latestRes.check_in)} → {formatDate(latestRes.check_out)}
                                                                </span>
                                                                <span
                                                                    className={`inline-block px-2 py-0.2 rounded-full text-[9px] font-black ${
                                                                        isCurrentlyInHouse
                                                                            ? 'bg-emerald-100 text-emerald-800'
                                                                            : latestRes.status === 'confirmed'
                                                                            ? 'bg-blue-100 text-blue-800'
                                                                            : 'bg-slate-100 text-slate-600'
                                                                    }`}
                                                                >
                                                                    {isCurrentlyInHouse ? 'In-House' : latestRes.status?.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>

                                                    {/* Folio Status */}
                                                    <td className="py-3.5 px-4">
                                                        {activeFolio ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Link
                                                                        href={route('folios.show', activeFolio.id)}
                                                                        className="font-extrabold text-blue-600 hover:underline"
                                                                    >
                                                                        {activeFolio.folio_number}
                                                                    </Link>
                                                                    {hasPendingBalance ? (
                                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800">
                                                                            Unsettled
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">
                                                                            Settled
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px]">
                                                                    Balance: <strong className={hasPendingBalance ? 'text-rose-600' : 'text-emerald-700'}>TSh {formatTZS(activeFolio.balance_minor)}</strong>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No folio</span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedGuestForDetail(guest)}
                                                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                                                                title="View History"
                                                            >
                                                                History
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenQuickBooking(guest.id)}
                                                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer"
                                                            >
                                                                Book Room
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 5. PAGINATION BAR */}
                {guests.links && guests.links.length > 3 && (
                    <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500 font-medium">
                            Showing <strong>{guests.from || 0}</strong> to <strong>{guests.to || 0}</strong> of <strong>{guests.total}</strong> guests
                        </span>

                        <div className="flex items-center gap-1 overflow-x-auto">
                            {guests.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                                        link.active
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : !link.url
                                            ? 'text-slate-300 pointer-events-none'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. SLIDE-IN GUEST DETAIL & ROOM HISTORY DRAWER */}
                {selectedGuestForDetail && (
                    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
                            {/* Drawer Header */}
                            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                        {selectedGuestForDetail.first_name?.charAt(0)}
                                        {selectedGuestForDetail.last_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900">
                                            {selectedGuestForDetail.first_name} {selectedGuestForDetail.last_name}
                                        </h3>
                                        <span className="text-xs text-slate-500 font-medium">
                                            {selectedGuestForDetail.nationality || 'Tanzanian'} • {selectedGuestForDetail.phone || 'No phone'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedGuestForDetail(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-5 text-xs">
                                {/* Profile Info */}
                                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">ID Document</span>
                                        <span className="font-extrabold text-slate-800">
                                            {selectedGuestForDetail.id_type?.replace('_', ' ').toUpperCase() || 'NIDA'}: {selectedGuestForDetail.id_number || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">VIP Tier</span>
                                        <span className="font-extrabold text-amber-700">
                                            {selectedGuestForDetail.vip_level || 'Standard'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                                        <span className="font-bold text-slate-800">
                                            {selectedGuestForDetail.email || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                                        <span className="font-bold text-slate-800">
                                            {selectedGuestForDetail.phone || '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Room Stays Timeline */}
                                <div>
                                    <h4 className="text-sm font-extrabold text-slate-900 mb-2.5 flex items-center gap-1.5">
                                        <Bed className="w-4 h-4 text-blue-600" />
                                        <span>Room Stays & Booking History</span>
                                    </h4>

                                    {selectedGuestForDetail.reservations && selectedGuestForDetail.reservations.length > 0 ? (
                                        <div className="space-y-2.5">
                                            {selectedGuestForDetail.reservations.map((res) => {
                                                const rm = res.reservation_rooms?.[0]?.room;
                                                const fol = res.folios?.[0];

                                                return (
                                                    <div
                                                        key={res.id}
                                                        className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center">
                                                                    {rm?.room_number || 'Room'}
                                                                </span>
                                                                <div>
                                                                    <span className="font-black text-slate-900 text-xs block">
                                                                        Room {rm?.room_number || 'Unassigned'} ({rm?.room_type?.name || 'Standard'})
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 block">
                                                                        Ref: {res.ref_no}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                                                    res.status === 'checked_in'
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : res.status === 'confirmed'
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-slate-100 text-slate-700'
                                                                }`}
                                                            >
                                                                {res.status === 'checked_in' ? 'Occupied' : res.status}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg">
                                                            <div>
                                                                <span className="text-slate-400 block font-medium">Dates:</span>
                                                                <span className="font-bold text-slate-700">
                                                                    {formatDate(res.check_in)} → {formatDate(res.check_out)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400 block font-medium">Folio:</span>
                                                                {fol ? (
                                                                    <span className="font-extrabold text-slate-800 font-mono">
                                                                        {fol.folio_number} (Bal: TSh {formatTZS(fol.balance_minor)})
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400">No Folio</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {fol && (
                                                            <div className="pt-1 flex justify-end">
                                                                <Link
                                                                    href={route('folios.show', fol.id)}
                                                                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                                                                >
                                                                    <span>Open Folio</span>
                                                                    <ArrowUpRight className="w-3 h-3" />
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 text-xs font-medium">
                                            No previous room stays recorded.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => handleOpenQuickBooking(selectedGuestForDetail.id)}
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                                >
                                    Book Room
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedGuestForDetail(null)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. CREATE GUEST MODAL */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex items-start sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
                        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                                        <UserPlus className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-base font-black text-slate-900">Add New Guest</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitCreateGuest} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={createForm.data.first_name}
                                            onChange={(e) => createForm.setData('first_name', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white"
                                            placeholder="First Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={createForm.data.last_name}
                                            onChange={(e) => createForm.setData('last_name', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white"
                                            placeholder="Last Name"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={createForm.data.phone}
                                            onChange={(e) => createForm.setData('phone', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white"
                                            placeholder="+255..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={createForm.data.email}
                                            onChange={(e) => createForm.setData('email', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white"
                                            placeholder="guest@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Nationality
                                        </label>
                                        <input
                                            type="text"
                                            value={createForm.data.nationality}
                                            onChange={(e) => createForm.setData('nationality', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            VIP Tier
                                        </label>
                                        <select
                                            value={createForm.data.vip_level}
                                            onChange={(e) => createForm.setData('vip_level', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white cursor-pointer"
                                        >
                                            <option value="Standard">Standard</option>
                                            <option value="VIP Silver">VIP Silver</option>
                                            <option value="VIP Gold">VIP Gold</option>
                                            <option value="VIP Platinum">VIP Platinum</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            ID Document Type
                                        </label>
                                        <select
                                            value={createForm.data.id_type}
                                            onChange={(e) => createForm.setData('id_type', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white cursor-pointer"
                                        >
                                            <option value="national_id">National ID (NIDA)</option>
                                            <option value="passport">Passport</option>
                                            <option value="driving_license">Driving License</option>
                                            <option value="voter_id">Voter ID</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            ID Number
                                        </label>
                                        <input
                                            type="text"
                                            value={createForm.data.id_number}
                                            onChange={(e) => createForm.setData('id_number', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white"
                                            placeholder="Document No..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Preferences / Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={createForm.data.notes}
                                        onChange={(e) => createForm.setData('notes', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:bg-white"
                                        placeholder="Special requests, dietary preferences..."
                                    />
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition active:scale-95 cursor-pointer"
                                    >
                                        {createForm.processing ? 'Saving...' : 'Save Guest'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 8. EDIT GUEST MODAL */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex items-start sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
                        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <h3 className="text-base font-black text-slate-900">Edit Guest Profile</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitEditGuest} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editForm.data.first_name}
                                            onChange={(e) => editForm.setData('first_name', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editForm.data.last_name}
                                            onChange={(e) => editForm.setData('last_name', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={editForm.data.phone}
                                            onChange={(e) => editForm.setData('phone', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={editForm.data.email}
                                            onChange={(e) => editForm.setData('email', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Nationality
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.data.nationality}
                                            onChange={(e) => editForm.setData('nationality', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            VIP Tier
                                        </label>
                                        <select
                                            value={editForm.data.vip_level}
                                            onChange={(e) => editForm.setData('vip_level', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 cursor-pointer"
                                        >
                                            <option value="Standard">Standard</option>
                                            <option value="VIP Silver">VIP Silver</option>
                                            <option value="VIP Gold">VIP Gold</option>
                                            <option value="VIP Platinum">VIP Platinum</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs shadow-xs transition active:scale-95 cursor-pointer"
                                    >
                                        {editForm.processing ? 'Updating...' : 'Update Guest'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 9. GLOBAL QUICK RESERVATION MODAL */}
                <NewReservationModal
                    isOpen={isQuickBookingOpen}
                    onClose={() => setIsQuickBookingOpen(false)}
                    rooms={rooms}
                    roomTypes={roomTypes}
                    ratePlans={ratePlans}
                    guests={guests.data as any}
                    initialGuestId={quickBookingGuestId}
                />
            </div>
        </AuthenticatedLayout>
    );
}

