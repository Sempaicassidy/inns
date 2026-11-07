import NewReservationModal from '@/Components/NewReservationModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Guest, PageProps, RatePlan, ReservationRoom, Room, RoomType } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Bed,
    BedDouble,
    Building2,
    Calendar as CalendarIcon,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    DoorClosed,
    FileText,
    Filter,
    Globe,
    Grid,
    Info,
    List,
    Lock,
    Luggage,
    Mail,
    Minus,
    Phone,
    Plus,
    Printer,
    Search,
    Shield,
    Sparkles,
    User,
    Users,
    Wrench,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

export interface CalendarProps {
    startDate?: string;
    endDate?: string;
    businessDate?: string;
    dates?: {
        date: string;
        day_name: string;
        day_number: string;
        month_name: string;
        is_today: boolean;
        is_weekend: boolean;
    }[];
    rooms?: Room[];
    roomTypes?: RoomType[];
    reservationRooms?: ReservationRoom[];
    ratePlans?: RatePlan[];
    guests?: Guest[];
    dailyMetrics?: Record<string, { availability: number; occupancy_pct: number; occupied: number }>;
    summary?: {
        all: number;
        vacant: number;
        occupied: number;
        reserved: number;
        blocked: number;
        due_out: number;
        dirty: number;
    };
    stats?: {
        total_rooms: number;
        available_rooms: number;
        occupied_rooms: number;
    };
    filters?: {
        room_type_id: string;
    };
}

export default function RoomAvailabilityCalendar({
    startDate = new Date().toISOString().split('T')[0],
    endDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    businessDate = new Date().toISOString().split('T')[0],
    dates = [],
    rooms = [],
    roomTypes = [],
    reservationRooms = [],
    ratePlans = [],
    guests = [],
    dailyMetrics = {},
    summary,
    filters = { room_type_id: '' },
}: CalendarProps) {
    // Top Controls
    const [selectedDateInput, setSelectedDateInput] = useState(startDate);
    const [isCozy, setIsCozy] = useState(false);
    const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({});
    const [mobileViewMode, setMobileViewMode] = useState<'matrix' | 'cards'>('matrix');

    // Filter controls
    const [statusFilter, setStatusFilter] = useState<'all' | 'vacant' | 'occupied' | 'reserved' | 'blocked' | 'due_out' | 'dirty'>('all');
    const [rateChannelFilter, setRateChannelFilter] = useState<string>('all');

    // Helper: normalize any datetime or ISO string to Y-m-d
    const toYmd = (dt?: string | null) => (dt ? dt.split('T')[0].split(' ')[0] : '');

    // Format display date DD/MM/YYYY
    const formatDisplayDate = (ymdStr?: string | null) => {
        if (!ymdStr) return '';
        const parts = ymdStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return ymdStr;
    };

    // Selection on Grid (Exact match for Screenshot 1)
    const [selection, setSelection] = useState<{
        roomId: string | number;
        roomNumber: string;
        roomTypeId: string | number;
        roomTypeName: string;
        startDate: string;
        endDate: string;
        nights: number;
    } | null>(null);

    // Active Drawer State
    const [activeReservation, setActiveReservation] = useState<ReservationRoom | null>(null);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [isBlockedListOpen, setIsBlockedListOpen] = useState(false);
    const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
    const [prefilledModalData, setPrefilledModalData] = useState<{
        roomId?: string;
        checkIn?: string;
        checkOut?: string;
    }>({});

    // Amend Stay Form State (Screenshot 2)
    const [amendForm, setAmendForm] = useState({
        check_in: '',
        check_out: '',
        nights: 1,
        override_rate: false,
        rate_price: '',
        room_id: '',
    });
    const [isAmending, setIsAmending] = useState(false);

    // Block Room Form State (Screenshot 4)
    const [blockRoomTypeId, setBlockRoomTypeId] = useState<string>('');
    const blockForm = useForm({
        room_id: '',
        reason: 'Maintenance',
        status_hk: 'out_of_order',
    });

    // Toggle collapse for room types
    const toggleCollapseType = (typeId: string | number) => {
        setCollapsedTypes((prev) => ({
            ...prev,
            [typeId]: !prev[typeId],
        }));
    };

    // Navigate Timeline (+/- 7 or 14 days)
    const shiftTimeline = (days: number) => {
        const curr = new Date(startDate);
        curr.setDate(curr.getDate() + days);
        const nextDateStr = curr.toISOString().split('T')[0];
        router.get(
            route('calendar.index'),
            { start_date: nextDateStr, days: dates.length || 14 },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Change Window Days (7d vs 14d)
    const changeDaysWindow = (newDays: number) => {
        router.get(
            route('calendar.index'),
            { start_date: startDate, days: newDays },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleDateJump = (newDateStr: string) => {
        setSelectedDateInput(newDateStr);
        if (newDateStr) {
            router.get(
                route('calendar.index'),
                { start_date: newDateStr, days: dates.length || 14 },
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    // Fast lookup for reservations per room
    const reservationsByRoom = useMemo(() => {
        const map = new Map<string, ReservationRoom[]>();
        reservationRooms.forEach((rr) => {
            const rId = String(rr.room_id);
            if (!map.has(rId)) {
                map.set(rId, []);
            }
            map.get(rId)!.push(rr);
        });
        return map;
    }, [reservationRooms]);

    // Filter all currently blocked rooms
    const blockedRooms = useMemo(() => {
        return rooms.filter((r) => r.status_hk === 'out_of_order' || r.status_hk === 'out_of_service');
    }, [rooms]);

    // Filter rooms based on active statusFilter and rateChannelFilter
    const filteredRooms = useMemo(() => {
        return rooms.filter((r) => {
            const roomResList = reservationsByRoom.get(String(r.id)) || [];

            // 1. Status Filter
            if (statusFilter === 'vacant') {
                const isBlocked = r.status_hk === 'out_of_order' || r.status_hk === 'out_of_service';
                const hasInHouseToday = roomResList.some((rr) => {
                    const inDate = toYmd(rr.check_in);
                    const outDate = toYmd(rr.check_out);
                    return inDate <= businessDate && outDate > businessDate;
                });
                if (isBlocked || r.status_occupancy === 'occupied' || hasInHouseToday || r.status_hk === 'dirty') {
                    return false;
                }
            } else if (statusFilter === 'occupied') {
                const hasInHouseToday = roomResList.some((rr) => {
                    const inDate = toYmd(rr.check_in);
                    const outDate = toYmd(rr.check_out);
                    return inDate <= businessDate && outDate > businessDate;
                });
                if (r.status_occupancy !== 'occupied' && !hasInHouseToday) {
                    return false;
                }
            } else if (statusFilter === 'reserved') {
                const hasReserved = roomResList.some((rr) => {
                    return (rr.status === 'confirmed' || rr.status === 'tentative') && toYmd(rr.check_out) >= businessDate;
                });
                if (!hasReserved) return false;
            } else if (statusFilter === 'blocked') {
                if (r.status_hk !== 'out_of_order' && r.status_hk !== 'out_of_service') {
                    return false;
                }
            } else if (statusFilter === 'due_out') {
                const isDueOut = roomResList.some((rr) => {
                    return toYmd(rr.check_out) === businessDate && (rr.status === 'checked_in' || r.status_occupancy === 'occupied');
                });
                if (!isDueOut) return false;
            } else if (statusFilter === 'dirty') {
                if (r.status_hk !== 'dirty') return false;
            }

            // 2. Rate / Channel Filter
            if (rateChannelFilter !== 'all') {
                const matches = roomResList.some((rr) => {
                    const planMatch = String(rr.rate_plan_id) === rateChannelFilter || String(rr.ratePlan?.id) === rateChannelFilter;
                    const sourceMatch = (rr.reservation?.source || '').toLowerCase() === rateChannelFilter.toLowerCase();
                    return planMatch || sourceMatch;
                });
                if (!matches) return false;
            }

            return true;
        });
    }, [rooms, reservationsByRoom, statusFilter, rateChannelFilter, businessDate]);

    // Group rooms by Room Type
    const groupedRooms = useMemo(() => {
        const map = new Map<string, { type: RoomType; rooms: Room[] }>();

        roomTypes.forEach((rt) => {
            map.set(String(rt.id), { type: rt, rooms: [] });
        });

        filteredRooms.forEach((r) => {
            const rtId = String(r.room_type_id || r.room_type?.id || r.roomType?.id || '');
            if (map.has(rtId)) {
                map.get(rtId)!.rooms.push(r);
            } else if (roomTypes.length > 0) {
                const firstId = String(roomTypes[0].id);
                map.get(firstId)!.rooms.push(r);
            }
        });

        return Array.from(map.values()).filter((g) => g.rooms.length > 0);
    }, [roomTypes, filteredRooms]);

    // Unblock room handler
    const handleUnblock = (roomId: string | number) => {
        router.post(
            route('calendar.unblock-room'),
            { room_id: roomId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsBlockedListOpen(false);
                    setIsBlockModalOpen(false);
                },
            }
        );
    };

    // Handle clicking a cell to select a date range
    const handleCellClick = (room: Room, dateStr: string) => {
        if (!selection || selection.roomId !== room.id) {
            // Start a new 1-night selection
            const nextDay = new Date(dateStr);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];

            setSelection({
                roomId: room.id,
                roomNumber: room.room_number,
                roomTypeId: room.room_type_id || room.roomType?.id || '',
                roomTypeName: room.roomType?.name || room.room_type?.name || 'Room',
                startDate: dateStr,
                endDate: nextDayStr,
                nights: 1,
            });
        } else {
            // Second click: extend selection
            if (dateStr > selection.startDate) {
                const start = new Date(selection.startDate);
                const end = new Date(dateStr);
                const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                setSelection({
                    ...selection,
                    endDate: dateStr,
                    nights: nights,
                });
            } else {
                // Clicked earlier date, reset start
                const nextDay = new Date(dateStr);
                nextDay.setDate(nextDay.getDate() + 1);
                setSelection({
                    ...selection,
                    startDate: dateStr,
                    endDate: nextDay.toISOString().split('T')[0],
                    nights: 1,
                });
            }
        }
    };

    // Open Walk-In / Reservation Modal with pre-filled selection
    const openReservationFromSelection = () => {
        if (!selection) return;
        setPrefilledModalData({
            roomId: String(selection.roomId),
            checkIn: selection.startDate,
            checkOut: selection.endDate,
        });
        setIsNewBookingModalOpen(true);
        setSelection(null);
    };

    // Open Maintenance Block from selection
    const openBlockFromSelection = () => {
        if (!selection) return;
        blockForm.setData('room_id', String(selection.roomId));
        setBlockRoomTypeId(String(selection.roomTypeId || ''));
        setIsBlockModalOpen(true);
    };

    const submitBlockRoom = (e: React.FormEvent) => {
        e.preventDefault();
        blockForm.post(route('calendar.block-room'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsBlockModalOpen(false);
                setSelection(null);
            },
        });
    };

    // Handle clicking a reservation to open Amend Stay Drawer (Screenshot 2)
    const handleSelectReservation = (rr: ReservationRoom) => {
        setActiveReservation(rr);
        const inDate = toYmd(rr.check_in);
        const outDate = toYmd(rr.check_out);
        const nights = Math.max(1, Math.round((new Date(outDate).getTime() - new Date(inDate).getTime()) / (1000 * 60 * 60 * 24)));
        setAmendForm({
            check_in: inDate,
            check_out: outDate,
            nights: isNaN(nights) ? 1 : nights,
            override_rate: false,
            rate_price: rr.rate_price_minor ? (rr.rate_price_minor / 100).toString() : '',
            room_id: String(rr.room_id || ''),
        });
    };

    // Submit Amend Stay Form
    const handleAmendStaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeReservation) return;
        const resId = activeReservation.reservation_id || activeReservation.reservation?.id;
        if (!resId) return;

        setIsAmending(true);
        router.put(
            route('reservations.update', resId),
            {
                check_in: amendForm.check_in,
                check_out: amendForm.check_out,
                room_id: amendForm.room_id,
                rate_price: amendForm.override_rate && amendForm.rate_price ? Number(amendForm.rate_price) : undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAmending(false);
                    setActiveReservation(null);
                },
                onError: () => {
                    setIsAmending(false);
                },
            }
        );
    };

    // Quick Check In from Drawer
    const handleQuickCheckIn = (resId: string, roomId: string) => {
        router.post(
            route('reservations.check-in', resId),
            { room_id: roomId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setActiveReservation(null);
                },
            }
        );
    };

    // Quick Check Out from Drawer
    const handleQuickCheckOut = (resId: string) => {
        router.post(
            route('reservations.check-out', resId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setActiveReservation(null);
                },
            }
        );
    };

    return (
        <div className="w-full max-w-[1850px] mx-auto space-y-2.5 sm:space-y-3 pb-8 text-slate-800">
                {/* 1. TOP CONTROL BAR */}
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs p-2.5 sm:p-3 space-y-2.5">
                    {/* Top Row: Date Navigation & Quick Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Date Picker + Navigation Arrow Buttons */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
                            <button
                                type="button"
                                onClick={() => shiftTimeline(-7)}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition shadow-2xs active:scale-95 cursor-pointer"
                                title="Previous 7 days"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1.5 px-1.5">
                                <input
                                    type="date"
                                    value={selectedDateInput}
                                    onChange={(e) => handleDateJump(e.target.value)}
                                    className="bg-transparent border-0 p-0 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-0 cursor-pointer"
                                />
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-400 pointer-events-none hidden sm:block" />
                            </div>

                            <button
                                type="button"
                                onClick={() => shiftTimeline(7)}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition shadow-2xs active:scale-95 cursor-pointer"
                                title="Next 7 days"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Middle: Days Window Selector (7d vs 14d) & Today button */}
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleDateJump(businessDate)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer"
                            >
                                Today
                            </button>

                            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => changeDaysWindow(7)}
                                    className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                                        dates.length === 7 ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                                    }`}
                                >
                                    7D
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeDaysWindow(14)}
                                    className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                                        dates.length === 14 ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                                    }`}
                                >
                                    14D
                                </button>
                            </div>
                        </div>

                        {/* Right: View Toggle (Mobile cards vs matrix) */}
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="md:hidden flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
                                <button
                                    type="button"
                                    onClick={() => setMobileViewMode('matrix')}
                                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                                        mobileViewMode === 'matrix' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                                    }`}
                                    title="Matrix View"
                                >
                                    <Grid className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMobileViewMode('cards')}
                                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                                        mobileViewMode === 'cards' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                                    }`}
                                    title="List View"
                                >
                                    <List className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Middle Row: Status Filter Pills + All Rates/Channels + Cozy + Assign Room (Exact UI Match for Screenshot 5) */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
                        {/* Interactive Status Filter Pills */}
                        <div className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
                            {/* ALL */}
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer ${
                                    statusFilter === 'all'
                                        ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-400'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title="Show all rooms"
                            >
                                <span className="text-[11px] uppercase font-bold">All</span>
                                <span className="font-extrabold text-xs sm:text-sm">{summary?.all ?? rooms.length}</span>
                            </button>

                            {/* VACANT */}
                            <button
                                type="button"
                                onClick={() => setStatusFilter(statusFilter === 'vacant' ? 'all' : 'vacant')}
                                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border shrink-0 transition active:scale-95 cursor-pointer ${
                                    statusFilter === 'vacant'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400'
                                        : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border-emerald-200'
                                }`}
                                title="Filter vacant rooms ready for check-in"
                            >
                                <span className={`text-[11px] uppercase font-bold ${statusFilter === 'vacant' ? 'text-emerald-100' : 'text-emerald-600'}`}>Vacant</span>
                                <span className="font-extrabold text-xs sm:text-sm">{summary?.vacant ?? 0}</span>
                            </button>

                            {/* OCCUPIED */}
                            <button
                                type="button"
                                onClick={() => setStatusFilter(statusFilter === 'occupied' ? 'all' : 'occupied')}
                                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border shrink-0 transition active:scale-95 cursor-pointer ${
                                    statusFilter === 'occupied'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400'
                                        : 'bg-blue-50 hover:bg-blue-100/80 text-blue-800 border-blue-200'
                                }`}
                                title="Filter occupied rooms with guests"
                            >
                                <span className={`text-[11px] uppercase font-bold ${statusFilter === 'occupied' ? 'text-blue-100' : 'text-blue-600'}`}>Occupied</span>
                                <span className="font-extrabold text-xs sm:text-sm">{summary?.occupied ?? 0}</span>
                            </button>

                            {/* RESERVED */}
                            <button
                                type="button"
                                onClick={() => setStatusFilter(statusFilter === 'reserved' ? 'all' : 'reserved')}
                                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border shrink-0 transition active:scale-95 cursor-pointer ${
                                    statusFilter === 'reserved'
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-400'
                                        : 'bg-purple-50 hover:bg-purple-100/80 text-purple-800 border-purple-200'
                                }`}
                                title="Filter rooms with bookings"
                            >
                                <span className={`text-[11px] uppercase font-bold ${statusFilter === 'reserved' ? 'text-purple-100' : 'text-purple-600'}`}>Reserved</span>
                                <span className="font-extrabold text-xs sm:text-sm">{summary?.reserved ?? 0}</span>
                            </button>

                            {/* BLOCKED */}
                            <div
                                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border shrink-0 transition ${
                                    statusFilter === 'blocked'
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-400'
                                        : 'bg-rose-50 hover:bg-rose-100/80 text-rose-800 border-rose-200'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked')}
                                    className="flex items-center gap-1 cursor-pointer"
                                    title="Filter blocked rooms"
                                >
                                    <span className={`text-[11px] uppercase font-bold ${statusFilter === 'blocked' ? 'text-rose-100' : 'text-rose-600'}`}>Blocked</span>
                                    <span className="font-extrabold text-xs sm:text-sm">{summary?.blocked ?? blockedRooms.length}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsBlockedListOpen(true);
                                    }}
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-black underline cursor-pointer hover:scale-105 transition ${
                                        statusFilter === 'blocked' ? 'bg-rose-700 text-white' : 'bg-rose-200/90 text-rose-900'
                                    }`}
                                    title="Click to manage & unblock rooms"
                                >
                                    Manage
                                </button>
                            </div>

                            {/* DUE OUT */}
                            <button
                                type="button"
                                onClick={() => setStatusFilter(statusFilter === 'due_out' ? 'all' : 'due_out')}
                                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border shrink-0 transition active:scale-95 cursor-pointer ${
                                    statusFilter === 'due_out'
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400'
                                        : 'bg-amber-50 hover:bg-amber-100/80 text-amber-800 border-amber-200'
                                }`}
                                title="Filter rooms checking out today"
                            >
                                <span className={`text-[11px] uppercase font-bold ${statusFilter === 'due_out' ? 'text-amber-100' : 'text-amber-600'}`}>Due Out</span>
                                <span className="font-extrabold text-xs sm:text-sm">{summary?.due_out ?? 0}</span>
                            </button>

                            {/* DIRTY */}
                            <button
                                type="button"
                                onClick={() => setStatusFilter(statusFilter === 'dirty' ? 'all' : 'dirty')}
                                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer ${
                                    statusFilter === 'dirty'
                                        ? 'bg-slate-700 text-white shadow-xs ring-2 ring-slate-400'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title="Filter dirty rooms"
                            >
                                <span className="text-[11px] uppercase font-bold text-slate-500">Dirty</span>
                                <span className="font-extrabold text-xs sm:text-sm">{summary?.dirty ?? 0}</span>
                            </button>
                        </div>

                        {/* Right Group: All Rates / Channels, Cozy Switch, + Assign Room */}
                        <div className="flex items-center gap-2 ml-auto">
                            {/* All Rates / Channels Select Box */}
                            <div className="relative">
                                <select
                                    value={rateChannelFilter}
                                    onChange={(e) => setRateChannelFilter(e.target.value)}
                                    className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 pr-7 shadow-2xs hover:border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="all">All Rates / Channels</option>
                                    <optgroup label="Rate Plans">
                                        {ratePlans.map((rp) => (
                                            <option key={rp.id} value={String(rp.id)}>
                                                {rp.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Channels / Source">
                                        <option value="walk_in">Walk-in / Direct</option>
                                        <option value="booking_com">Booking.com</option>
                                        <option value="agent">Agoda / Agent</option>
                                        <option value="corporate">Corporate</option>
                                        <option value="website">Website</option>
                                    </optgroup>
                                </select>
                            </div>

                            {/* Cozy Toggle Switch */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                                <span className="text-[11px] font-bold select-none">Cozy</span>
                                <button
                                    type="button"
                                    onClick={() => setIsCozy(!isCozy)}
                                    className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                                        isCozy ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                                    title="Toggle cozy expanded row view"
                                >
                                    <span
                                        className={`w-3 h-3 rounded-full bg-white transition-transform shadow-xs ${
                                            isCozy ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* + Assign Room Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setPrefilledModalData({
                                        checkIn: businessDate,
                                        checkOut: new Date(new Date(businessDate).getTime() + 86400000).toISOString().split('T')[0],
                                    });
                                    setIsNewBookingModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Assign Room</span>
                            </button>
                        </div>
                    </div>

                    {/* Active Filter Indicator Banner */}
                    {(statusFilter !== 'all' || rateChannelFilter !== 'all') && (
                        <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200/80 rounded-xl px-3 py-1.5 text-xs text-blue-900">
                            <div className="flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5 text-blue-600" />
                                <span>
                                    Showing filtered rooms: <strong>{statusFilter.toUpperCase()}</strong>
                                    {rateChannelFilter !== 'all' && <> • Channel: <strong>{rateChannelFilter}</strong></>} ({filteredRooms.length} rooms)
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setStatusFilter('all');
                                    setRateChannelFilter('all');
                                }}
                                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                            >
                                Reset Filter
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. MAIN TAPE CHART TIMELINE (Screenshot 3 Layout) */}
                {mobileViewMode === 'matrix' ? (
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto relative min-h-[460px] touch-pan-x">
                            <table className="w-full border-collapse text-left text-xs table-fixed">
                                {/* RESPONSIVE COLGROUP */}
                                <colgroup>
                                    {/* Left frozen room column */}
                                    <col className="w-32 sm:w-44 md:w-56 min-w-[120px] sm:min-w-[170px] md:min-w-[220px]" />
                                    {/* Date columns */}
                                    {dates.map((d) => (
                                        <col key={d.date} className="w-14 sm:w-16 md:w-20 min-w-[56px] sm:min-w-[64px] md:min-w-[76px]" />
                                    ))}
                                </colgroup>

                                {/* TABLE HEADER */}
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700 select-none">
                                        {/* Sticky Top-Left Corner Cell */}
                                        <th className="sticky left-0 top-0 z-30 bg-slate-100/95 backdrop-blur-xs border-r border-slate-200 px-2 sm:px-3 py-2 text-xs font-bold text-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                                            <div className="flex items-center justify-between">
                                                <span className="uppercase tracking-wider text-[10px] sm:text-[11px] font-black text-slate-500">
                                                    Room Type
                                                </span>
                                            </div>
                                        </th>

                                        {/* Date Header Cells */}
                                        {dates.map((d) => {
                                            const isSat = d.day_name === 'Sat';
                                            const isSun = d.day_name === 'Sun';
                                            const isWeekend = isSat || isSun;

                                            return (
                                                <th
                                                    key={d.date}
                                                    className={`text-center py-1.5 sm:py-2 px-0.5 sm:px-1 border-r border-slate-200/80 transition-colors ${
                                                        isWeekend
                                                            ? 'bg-amber-100/50 text-amber-900'
                                                            : d.is_today
                                                            ? 'bg-blue-50 text-blue-900 font-bold ring-1 ring-inset ring-blue-300'
                                                            : 'text-slate-600'
                                                    }`}
                                                >
                                                    <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 leading-tight">
                                                        {d.day_name}
                                                    </div>
                                                    <div className={`text-xs sm:text-sm font-black leading-tight ${d.is_today ? 'text-blue-600' : ''}`}>
                                                        {d.day_number}
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 font-normal leading-tight hidden sm:block">
                                                        {d.month_name}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                {/* TABLE BODY (Grouped by Room Type) */}
                                <tbody>
                                    {groupedRooms.map((group) => {
                                        const typeId = String(group.type.id);
                                        const isCollapsed = !!collapsedTypes[typeId];
                                        const defaultRateMinor = group.type.base_price_minor || 0;
                                        const defaultRateFormatted = (defaultRateMinor / 100).toFixed(0);

                                        return (
                                            <React.Fragment key={typeId}>
                                                {/* ROOM TYPE ACCORDION HEADER ROW */}
                                                <tr className="bg-slate-100/80 border-y border-slate-200 text-slate-800 font-bold">
                                                    {/* Sticky Left Room Type Header Cell */}
                                                    <td className="sticky left-0 z-20 bg-slate-100 border-r border-slate-200 px-2 sm:px-3 py-1.5 text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCollapseType(typeId)}
                                                            className="flex items-center gap-1.5 sm:gap-2 w-full text-left font-bold text-slate-800 hover:text-blue-600 transition truncate cursor-pointer"
                                                        >
                                                            <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-slate-200 flex items-center justify-center text-slate-700 text-[10px] shrink-0 font-black">
                                                                {isCollapsed ? '+' : '−'}
                                                            </span>
                                                            <span className="truncate text-[11px] sm:text-xs font-bold">{group.type.name}</span>
                                                        </button>
                                                    </td>

                                                    {/* Daily available count & rate badges for this room type */}
                                                    {dates.map((d) => {
                                                        const occupiedCount = reservationRooms.filter((rr) => {
                                                            const matchType = rr.room_type_id === group.type.id || rr.room?.room_type_id === group.type.id;
                                                            return matchType && rr.check_in <= d.date && rr.check_out > d.date;
                                                        }).length;
                                                        const totalInType = group.rooms.length;
                                                        const availInType = Math.max(0, totalInType - occupiedCount);

                                                        return (
                                                            <td
                                                                key={d.date}
                                                                className={`border-r border-slate-200/80 text-center py-1 px-0.5 ${
                                                                    d.is_weekend ? 'bg-amber-50/20' : ''
                                                                }`}
                                                            >
                                                                <div className="inline-flex flex-col items-center">
                                                                    <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-black bg-rose-100 text-rose-700 leading-tight">
                                                                        {availInType}
                                                                    </span>
                                                                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-normal">
                                                                        {defaultRateMinor > 0 ? defaultRateFormatted : 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>

                                                {/* INDIVIDUAL ROOM ROWS */}
                                                {!isCollapsed &&
                                                    group.rooms.map((room) => {
                                                        const roomResList = reservationsByRoom.get(String(room.id)) || [];
                                                        const rowHeightClass = isCozy ? 'h-12 sm:h-13' : 'h-10 sm:h-11';

                                                        // Identify if room is currently occupied by active stay
                                                        const activeStay = (room as any).stays?.find((s: any) => !s.checked_out_at) || (room as any).stays?.[0];
                                                        const inHouseGuest = activeStay?.guest;
                                                        const inHouseGuestName = inHouseGuest
                                                            ? (inHouseGuest.full_name || `${inHouseGuest.first_name || ''} ${inHouseGuest.last_name || ''}`.trim())
                                                            : null;

                                                        // Also check room's reservation list for in-house today
                                                        const activeResToday = roomResList.find((rr) => {
                                                            const inDate = toYmd(rr.check_in);
                                                            const outDate = toYmd(rr.check_out);
                                                            return inDate <= businessDate && outDate > businessDate && (rr.status === 'checked_in' || room.status_occupancy === 'occupied');
                                                        });
                                                        const todayGuestName = inHouseGuestName || activeResToday?.guest_name || activeResToday?.reservation?.guest?.full_name || null;
                                                        const isOccupied = room.status_occupancy === 'occupied' || !!activeResToday;
                                                        const isBlocked = room.status_hk === 'out_of_order' || room.status_hk === 'out_of_service';

                                                        return (
                                                            <tr
                                                                key={room.id}
                                                                className={`border-b border-slate-200/60 hover:bg-slate-50/50 transition-colors ${rowHeightClass}`}
                                                            >
                                                                {/* Sticky Room Column with clear status & guest name */}
                                                                <td className="sticky left-0 z-20 bg-white border-r border-slate-200 px-2 sm:px-3 py-1 font-medium text-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] min-w-[170px] max-w-[210px]">
                                                                    <div className="flex items-center justify-between gap-1.5">
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate">
                                                                                    {room.room_number}
                                                                                </span>
                                                                                {isOccupied ? (
                                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                                                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                                                                        Occupied
                                                                                    </span>
                                                                                ) : isBlocked ? (
                                                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                                                                                        Blocked
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                                                                        Vacant
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* Customer Name when occupied, or room type */}
                                                                            {isOccupied && todayGuestName ? (
                                                                                <span className="text-[10px] font-bold text-blue-700 block truncate leading-tight mt-0.5" title={`Occupied by: ${todayGuestName}`}>
                                                                                    👤 {todayGuestName}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[9px] text-slate-400 block truncate leading-tight mt-0.5">
                                                                                    {group.type.name} • {room.status_hk === 'dirty' ? 'Dirty' : 'Clean'}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Right action or housekeeping indicator */}
                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                            {isBlocked ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleUnblock(room.id);
                                                                                    }}
                                                                                    title="Click to unblock room"
                                                                                    className="flex items-center gap-0.5 text-[9px] text-rose-600 hover:text-emerald-700 bg-rose-50 hover:bg-emerald-50 px-1.5 py-0.5 rounded border border-rose-200 font-black transition cursor-pointer"
                                                                                >
                                                                                    <Wrench className="w-2.5 h-2.5" />
                                                                                    <span>Unblock</span>
                                                                                </button>
                                                                            ) : room.status_hk === 'dirty' ? (
                                                                                <span title="Dirty / Turnover required" className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded">
                                                                                    Dirty
                                                                                </span>
                                                                            ) : (
                                                                                <span title="Clean" className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Dates Grid Cells & Booking Bars */}
                                                                {dates.map((d, colIndex) => {
                                                                    const activeRes = roomResList.find((rr) => {
                                                                        const inDate = toYmd(rr.check_in);
                                                                        const outDate = toYmd(rr.check_out);
                                                                        return inDate <= d.date && outDate > d.date;
                                                                    });

                                                                    const startingRes = roomResList.find((rr) => {
                                                                        const inDate = toYmd(rr.check_in);
                                                                        const outDate = toYmd(rr.check_out);
                                                                        if (!(inDate <= d.date && outDate > d.date)) return false;
                                                                        return inDate === d.date || (colIndex === 0 && inDate < dates[0].date);
                                                                    });

                                                                    const isUnlinkedOccupiedToday = !activeRes && d.is_today && isOccupied;
                                                                    const displayOccupiedLabel = todayGuestName || inHouseGuestName || 'Occupied';

                                                                    const isSelected =
                                                                        selection &&
                                                                        selection.roomId === room.id &&
                                                                        d.date >= selection.startDate &&
                                                                        d.date < selection.endDate;

                                                                    return (
                                                                        <td
                                                                            key={d.date}
                                                                            onClick={() => !activeRes && !isUnlinkedOccupiedToday && handleCellClick(room, d.date)}
                                                                            className={`relative border-r border-slate-200/70 p-0 text-center transition-colors cursor-pointer select-none ${
                                                                                d.is_weekend ? 'bg-amber-50/20' : ''
                                                                            } ${isSelected ? 'bg-slate-900/10' : 'hover:bg-blue-50/40'}`}
                                                                        >
                                                                            {/* RESERVATION BAR (OCCUPIED / RESERVED) */}
                                                                            {startingRes && (
                                                                                (() => {
                                                                                    const inDate = toYmd(startingRes.check_in);
                                                                                    const outDate = toYmd(startingRes.check_out);
                                                                                    const startIdx = colIndex;
                                                                                    const endIdx = dates.findIndex((dt) => dt.date === outDate);
                                                                                    const spanCols = Math.max(1, (endIdx !== -1 ? endIdx : dates.length) - startIdx);
                                                                                    const spanWidthPercent = spanCols * 100;

                                                                                    const guestName =
                                                                                        startingRes.guest_name ||
                                                                                        startingRes.reservation?.guest?.full_name ||
                                                                                        `${startingRes.reservation?.guest?.first_name ?? ''} ${startingRes.reservation?.guest?.last_name ?? ''}`.trim() ||
                                                                                        'Guest';

                                                                                    const isContinuedFromPast = inDate < dates[0].date && colIndex === 0;
                                                                                    const isExtendsToFuture = endIdx === -1;

                                                                                    const isCheckedIn = startingRes.status === 'checked_in';
                                                                                    const isConfirmed = startingRes.status === 'confirmed';
                                                                                    const isCheckedOut = startingRes.status === 'checked_out';

                                                                                    // Solid colors matching user screenshots: green for in-house/confirmed, purple for OTAs
                                                                                    const isOTA = startingRes.reservation?.source === 'booking_com' || startingRes.reservation?.source === 'agent';
                                                                                    const barColorClass = isOTA
                                                                                        ? 'bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-xs'
                                                                                        : isCheckedIn || isConfirmed
                                                                                        ? 'bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-xs'
                                                                                        : isCheckedOut
                                                                                        ? 'bg-slate-500 hover:bg-slate-600 text-white'
                                                                                        : 'bg-amber-500 hover:bg-amber-600 text-white';

                                                                                    const sourceInitial = (startingRes.reservation?.source || 'W').charAt(0).toUpperCase();

                                                                                    return (
                                                                                        <div
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleSelectReservation(startingRes);
                                                                                            }}
                                                                                            style={{
                                                                                                width: `calc(${spanWidthPercent}% - 4px)`,
                                                                                                zIndex: 15,
                                                                                            }}
                                                                                            className={`absolute top-0.5 bottom-0.5 left-0.5 rounded-lg px-2 flex items-center justify-between font-bold shadow-xs cursor-pointer transition-all hover:brightness-105 select-none ${barColorClass} ${
                                                                                                isCozy ? 'py-1' : 'py-0.5'
                                                                                            }`}
                                                                                            title={`${guestName} (${inDate} to ${outDate}) - ${startingRes.status}`}
                                                                                        >
                                                                                            <div className="flex items-center gap-1.5 truncate">
                                                                                                {isContinuedFromPast && (
                                                                                                    <span className="text-[10px] font-black opacity-90 shrink-0">◀</span>
                                                                                                )}
                                                                                                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/20 flex items-center justify-center text-[8px] sm:text-[9px] font-black shrink-0">
                                                                                                    {sourceInitial}
                                                                                                </span>
                                                                                                <div className="truncate text-left leading-tight">
                                                                                                    <div className="flex items-center gap-1">
                                                                                                        <span className="text-[8px] uppercase tracking-wider font-extrabold px-1 rounded bg-black/25">
                                                                                                            {isCheckedIn ? 'Occupied' : isConfirmed ? 'Reserved' : startingRes.status}
                                                                                                        </span>
                                                                                                        <span className={`block font-black uppercase tracking-tight truncate text-white ${isCozy ? 'text-xs' : 'text-[9px] sm:text-[10px]'}`}>
                                                                                                            {guestName}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="flex items-center gap-1 shrink-0 ml-1">
                                                                                                <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-black shadow-xs">
                                                                                                    S
                                                                                                </span>
                                                                                                {isExtendsToFuture && (
                                                                                                    <span className="text-[10px] font-black opacity-90 shrink-0">▶</span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })()
                                                                            )}

                                                                            {/* UNLINKED OCCUPIED TODAY INDICATOR */}
                                                                            {isUnlinkedOccupiedToday && (
                                                                                <div
                                                                                    style={{
                                                                                        width: 'calc(100% - 4px)',
                                                                                        zIndex: 14,
                                                                                    }}
                                                                                    className="absolute top-0.5 bottom-0.5 left-0.5 rounded-lg px-2 flex items-center justify-between text-[10px] sm:text-[11px] font-black bg-[#22c55e] text-white shadow-xs cursor-pointer"
                                                                                    title={`Occupied - ${displayOccupiedLabel}`}
                                                                                >
                                                                                    <div className="flex items-center gap-1.5 truncate">
                                                                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                                                                                        <span className="text-[8px] uppercase tracking-wider font-extrabold px-1 rounded bg-black/25">
                                                                                            Occupied
                                                                                        </span>
                                                                                        <span className={`truncate uppercase font-black text-white ${isCozy ? 'text-xs' : 'text-[9px] sm:text-[10px]'}`}>
                                                                                            {displayOccupiedLabel}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* HOVER AFFORDANCE FOR VACANT CELLS */}
                                                                            {!activeRes && !isUnlinkedOccupiedToday && !isSelected && (
                                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shadow-2xs">
                                                                                        + Vacant
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            {/* SELECTION BAR & INLINE POPOVER (Screenshot 1 Exact Match) */}
                                                                            {isSelected && d.date === selection.startDate && (
                                                                                (() => {
                                                                                    const startIdx = colIndex;
                                                                                    const endIdx = dates.findIndex((dt) => dt.date === selection.endDate);
                                                                                    const spanCols = Math.max(1, (endIdx !== -1 ? endIdx : dates.length) - startIdx);
                                                                                    const spanWidthPercent = spanCols * 100;

                                                                                    return (
                                                                                        <>
                                                                                            {/* 1. SELECTION SPAN BAR (Dark bar with "3 night(s)") */}
                                                                                            <div
                                                                                                style={{
                                                                                                    width: `calc(${spanWidthPercent}% - 4px)`,
                                                                                                    zIndex: 25,
                                                                                                }}
                                                                                                className="absolute top-1 bottom-1 left-0.5 rounded-lg bg-slate-900 text-white font-extrabold text-[11px] sm:text-xs flex items-center justify-center shadow-lg border border-slate-700 select-none pointer-events-none"
                                                                                            >
                                                                                                <span>{selection.nights} night(s)</span>
                                                                                            </div>

                                                                                            {/* 2. INLINE POPOVER BOX (Screenshot 1) */}
                                                                                            <div
                                                                                                style={{
                                                                                                    zIndex: 40,
                                                                                                }}
                                                                                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 p-3 text-left animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
                                                                                            >
                                                                                                {/* Header: Arrival, Departure, Close */}
                                                                                                <div className="flex items-start justify-between border-b border-slate-100 pb-2 mb-2">
                                                                                                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                                                                                                        <div>
                                                                                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Arrival</span>
                                                                                                            <span className="font-extrabold text-slate-900">{formatDisplayDate(selection.startDate)}</span>
                                                                                                        </div>
                                                                                                        <div>
                                                                                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Departure</span>
                                                                                                            <span className="font-extrabold text-slate-900">{formatDisplayDate(selection.endDate)}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            setSelection(null);
                                                                                                        }}
                                                                                                        className="text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 cursor-pointer"
                                                                                                    >
                                                                                                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                                                                                    </button>
                                                                                                </div>

                                                                                                {/* Popover Buttons */}
                                                                                                <div className="space-y-1.5">
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            openReservationFromSelection();
                                                                                                        }}
                                                                                                        className="w-full text-center py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs hover:border-slate-300 transition cursor-pointer"
                                                                                                    >
                                                                                                        Walk In / Reservation
                                                                                                    </button>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            openBlockFromSelection();
                                                                                                        }}
                                                                                                        className="w-full text-center py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs hover:border-slate-300 transition cursor-pointer"
                                                                                                    >
                                                                                                        Maintenance Block
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        </>
                                                                                    );
                                                                                })()
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })}
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* 3. BOTTOM SUMMARY ROWS (Screenshot 3) */}
                                    {/* Room Availability */}
                                    <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-700 text-xs">
                                        <td className="sticky left-0 z-20 bg-slate-200/95 border-r border-slate-300 px-2 sm:px-3 py-2 text-[10px] sm:text-[11px] font-extrabold text-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                                            Room Availability
                                        </td>
                                        {dates.map((d) => {
                                            const avail = dailyMetrics[d.date]?.availability ?? summary?.vacant ?? 0;
                                            return (
                                                <td key={d.date} className="text-center py-1.5 sm:py-2 px-1 border-r border-slate-200 font-extrabold text-slate-800 text-[10px] sm:text-xs">
                                                    {avail}
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* Occupancy % */}
                                    <tr className="bg-slate-100/70 border-t border-slate-200 font-bold text-slate-700 text-xs">
                                        <td className="sticky left-0 z-20 bg-slate-200/95 border-r border-slate-300 px-2 sm:px-3 py-2 text-[10px] sm:text-[11px] font-extrabold text-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                                            Occupancy(%)
                                        </td>
                                        {dates.map((d) => {
                                            const pct = dailyMetrics[d.date]?.occupancy_pct ?? 0;
                                            return (
                                                <td key={d.date} className="text-center py-1.5 sm:py-2 px-1 border-r border-slate-200 font-extrabold text-slate-700 text-[10px] sm:text-xs">
                                                    {pct}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* 3. ALTERNATIVE MOBILE DAY CARDS VIEW */
                    <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
                            <span className="font-bold text-slate-700">Rooms List for {startDate}</span>
                            <span className="text-slate-400 font-medium">{filteredRooms.length} Units</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {filteredRooms.map((room) => {
                                const roomResList = reservationsByRoom.get(String(room.id)) || [];
                                const todayRes = roomResList.find((rr) => {
                                    const inDate = toYmd(rr.check_in);
                                    const outDate = toYmd(rr.check_out);
                                    return inDate <= startDate && outDate > startDate;
                                });

                                const isBlocked = room.status_hk === 'out_of_order' || room.status_hk === 'out_of_service';
                                const activeStay = (room as any).stays?.find((s: any) => !s.checked_out_at) || (room as any).stays?.[0];
                                const inHouseGuest = activeStay?.guest;
                                const inHouseGuestName = inHouseGuest
                                    ? (inHouseGuest.full_name || `${inHouseGuest.first_name || ''} ${inHouseGuest.last_name || ''}`.trim())
                                    : null;
                                const isOccupied = !!todayRes || room.status_occupancy === 'occupied';
                                const guestName = todayRes?.guest_name || todayRes?.reservation?.guest?.full_name || inHouseGuestName || 'In-House Guest';

                                return (
                                    <div
                                        key={room.id}
                                        className={`p-3.5 rounded-xl border bg-white shadow-2xs flex items-center justify-between gap-3 ${
                                            isBlocked
                                                ? 'border-rose-200 bg-rose-50/20'
                                                : isOccupied
                                                ? 'border-blue-200 bg-blue-50/20'
                                                : 'border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-xs ${
                                                    isBlocked
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : isOccupied
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-emerald-100 text-emerald-800'
                                                }`}
                                            >
                                                {room.room_number}
                                            </div>

                                            <div>
                                                <div className="font-bold text-slate-900 text-xs">
                                                    Room {room.room_number} ({room.roomType?.name || room.room_type?.name || 'Standard'})
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {isBlocked ? (
                                                        <span className="text-rose-600 font-bold">Blocked / Out of Order</span>
                                                    ) : isOccupied ? (
                                                        <span className="text-blue-700 font-semibold">
                                                            Occupied: <strong>{guestName}</strong>
                                                        </span>
                                                    ) : (
                                                        <span className="text-emerald-700 font-semibold">Available Clean</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            {isBlocked ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUnblock(room.id)}
                                                    className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                                                >
                                                    Unblock
                                                </button>
                                            ) : isOccupied && todayRes ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectReservation(todayRes)}
                                                    className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-200 transition cursor-pointer"
                                                >
                                                    Details
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPrefilledModalData({
                                                            roomId: String(room.id),
                                                            checkIn: startDate,
                                                        });
                                                        setIsNewBookingModalOpen(true);
                                                    }}
                                                    className="px-2.5 py-1 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition cursor-pointer"
                                                >
                                                    Book
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 4. SLIDE-IN RESERVATION DETAIL & AMEND STAY DRAWER (Screenshot 2 Exact Match) */}
                {activeReservation && (
                    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-4xl bg-white shadow-2xl h-full flex flex-col sm:flex-row animate-in slide-in-from-right duration-200 overflow-y-auto sm:overflow-hidden">
                            {/* LEFT PANEL: Reservation Details (Screenshot 2 Left Side) */}
                            <div className="flex-1 border-r border-slate-200 flex flex-col bg-white">
                                {/* Header: Guest Info */}
                                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-extrabold text-slate-900">
                                                {activeReservation.guest_name || activeReservation.reservation?.guest?.full_name || 'Mr. Guest'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                                                <span>{activeReservation.reservation?.guest?.nationality || 'Tanzania'}</span>
                                                <span>•</span>
                                                <span>{activeReservation.reservation?.guest?.phone || 'No Phone'}</span>
                                                <span>•</span>
                                                <span className="truncate max-w-[180px]">{activeReservation.reservation?.guest?.email || 'No Email'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setActiveReservation(null)}
                                        className="sm:hidden p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Action Buttons (Edit Reservation, Print/Send) */}
                                <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                                    <Link
                                        href={route('reservations.index')}
                                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 shadow-2xs transition"
                                    >
                                        Edit Reservation
                                    </Link>
                                    {activeReservation.reservation?.folios?.[0]?.id && (
                                        <Link
                                            href={route('folios.show', activeReservation.reservation.folios[0].id)}
                                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 shadow-2xs transition flex items-center gap-1.5"
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>Print / Folio</span>
                                        </Link>
                                    )}

                                    {/* Quick Check In / Check Out buttons */}
                                    {activeReservation.status === 'confirmed' && (
                                        <button
                                            type="button"
                                            onClick={() => handleQuickCheckIn(
                                                String(activeReservation.reservation_id || activeReservation.reservation?.id),
                                                String(activeReservation.room_id)
                                            )}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-2xs transition cursor-pointer"
                                        >
                                            Check-In Now
                                        </button>
                                    )}
                                    {activeReservation.status === 'checked_in' && (
                                        <button
                                            type="button"
                                            onClick={() => handleQuickCheckOut(
                                                String(activeReservation.reservation_id || activeReservation.reservation?.id)
                                            )}
                                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-2xs transition cursor-pointer"
                                        >
                                            Check-Out
                                        </button>
                                    )}
                                </div>

                                {/* Details Grid (Exact match for Screenshot 2) */}
                                <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Reservation Number</span>
                                            <span className="font-extrabold text-slate-900 text-sm">
                                                {activeReservation.reservation?.ref_no || activeReservation.reservation?.reservation_number || `#${activeReservation.id}`}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                                            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                {activeReservation.status === 'checked_in' ? 'Occupied / In-House' : activeReservation.status === 'confirmed' ? 'Confirmed Reservation' : activeReservation.status?.toUpperCase()}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Arrival Date</span>
                                            <span className="font-bold text-slate-800">
                                                {formatDisplayDate(toYmd(activeReservation.check_in))} 10:00:00 AM
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Departure Date</span>
                                            <span className="font-bold text-slate-800">
                                                {formatDisplayDate(toYmd(activeReservation.check_out))} 10:00:00 AM
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Booking Date</span>
                                            <span className="font-bold text-slate-800">
                                                {formatDisplayDate(toYmd(activeReservation.reservation?.created_at || ''))}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Room Type</span>
                                            <span className="font-bold text-slate-800">
                                                {activeReservation.room_type?.name || activeReservation.roomType?.name || 'Standard'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Room Number</span>
                                            <span className="font-bold text-slate-800">
                                                Room {activeReservation.room?.room_number || 'Unassigned'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Rate Plan</span>
                                            <span className="font-bold text-slate-800">
                                                {activeReservation.rate_plan?.name || activeReservation.ratePlan?.name || 'European Plan'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Pax</span>
                                            <span className="font-bold text-slate-800">
                                                {activeReservation.reservation?.adults || 1} Adult • {activeReservation.reservation?.children || 0} Child
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg. Daily Rate</span>
                                            <span className="font-bold text-slate-800">
                                                TSh {((activeReservation.rate_price_minor || 35000000) / 100).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Financial Breakdown (Screenshot 2 bottom) */}
                                    <div className="mt-auto pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                                        <div className="flex justify-between text-slate-600">
                                            <span className="font-medium">Total</span>
                                            <span className="font-extrabold text-slate-900">
                                                TSh {(((activeReservation.reservation?.total_minor ?? activeReservation.rate_price_minor ?? 35000000)) / 100).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span className="font-medium">Paid</span>
                                            <span className="font-extrabold text-emerald-600">
                                                TSh {(((activeReservation.reservation?.folios?.[0]?.total_payments_minor ?? 0)) / 100).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-rose-600 pt-1 border-t border-slate-100 text-sm">
                                            <span className="font-black">Balance</span>
                                            <span className="font-black">
                                                TSh {(((activeReservation.reservation?.folios?.[0]?.balance_minor ?? activeReservation.reservation?.total_minor ?? 35000000)) / 100).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANEL: Amend Stay Form (Screenshot 2 Right Side) */}
                            <div className="w-full sm:w-80 md:w-96 bg-white flex flex-col border-t sm:border-t-0">
                                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Amend Stay</h3>
                                    <button
                                        type="button"
                                        onClick={() => setActiveReservation(null)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleAmendStaySubmit} className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 text-xs">
                                    <div className="space-y-3.5">
                                        {/* Arrival Date */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                                Arrival:
                                            </label>
                                            <input
                                                type="date"
                                                value={amendForm.check_in}
                                                onChange={(e) => {
                                                    const newIn = e.target.value;
                                                    const newNights = Math.max(1, Math.round((new Date(amendForm.check_out).getTime() - new Date(newIn).getTime()) / (1000 * 60 * 60 * 24)));
                                                    setAmendForm({ ...amendForm, check_in: newIn, nights: isNaN(newNights) ? 1 : newNights });
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white"
                                                required
                                            />
                                        </div>

                                        {/* Departure Date */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                                Departure:
                                            </label>
                                            <input
                                                type="date"
                                                value={amendForm.check_out}
                                                onChange={(e) => {
                                                    const newOut = e.target.value;
                                                    const newNights = Math.max(1, Math.round((new Date(newOut).getTime() - new Date(amendForm.check_in).getTime()) / (1000 * 60 * 60 * 24)));
                                                    setAmendForm({ ...amendForm, check_out: newOut, nights: isNaN(newNights) ? 1 : newNights });
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white"
                                                required
                                            />
                                        </div>

                                        {/* Nights */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                                Nights:
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={amendForm.nights}
                                                onChange={(e) => {
                                                    const n = parseInt(e.target.value) || 1;
                                                    const currIn = new Date(amendForm.check_in);
                                                    currIn.setDate(currIn.getDate() + n);
                                                    setAmendForm({ ...amendForm, nights: n, check_out: currIn.toISOString().split('T')[0] });
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white"
                                            />
                                        </div>

                                        {/* Override Room Rate Checkbox */}
                                        <div className="pt-1">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={amendForm.override_rate}
                                                    onChange={(e) => setAmendForm({ ...amendForm, override_rate: e.target.checked })}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-xs font-bold text-slate-700">Override Room Rate</span>
                                            </label>

                                            {amendForm.override_rate && (
                                                <div className="mt-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Rate per night (TSh)"
                                                        value={amendForm.rate_price}
                                                        onChange={(e) => setAmendForm({ ...amendForm, rate_price: e.target.value })}
                                                        className="w-full bg-white border border-blue-300 rounded-xl p-2 text-xs font-bold text-slate-800"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Next Reservation section */}
                                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                                            <span className="text-[11px] font-bold text-slate-600 block mb-2">Next Reservation</span>
                                            <div className="py-4 text-center text-slate-400">
                                                <Luggage className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                                <span className="text-[11px]">No Data</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amend Stay Buttons (Cancel & Save) */}
                                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setActiveReservation(null)}
                                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isAmending}
                                            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer shadow-xs"
                                        >
                                            {isAmending ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. SLIDE-IN BLOCK ROOM DRAWER (Screenshot 4 Exact Match) */}
                {isBlockModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
                            {/* Drawer Header */}
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                                <h3 className="text-base font-extrabold text-slate-900">Block Room</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsBlockModalOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitBlockRoom} className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 text-xs">
                                <div className="space-y-4">
                                    {/* Date Range (Screenshot 4) */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Date Range
                                        </label>
                                        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                                            <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span>
                                                {formatDisplayDate(selection?.startDate)} → {formatDisplayDate(selection?.endDate)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="mt-2 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
                                        >
                                            Add Range
                                        </button>
                                    </div>

                                    {/* Room Type Dropdown */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Room Type
                                        </label>
                                        <select
                                            value={blockRoomTypeId}
                                            onChange={(e) => {
                                                setBlockRoomTypeId(e.target.value);
                                                blockForm.setData('room_id', '');
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        >
                                            <option value="">All Room Types</option>
                                            {roomTypes.map((rt) => (
                                                <option key={rt.id} value={String(rt.id)}>
                                                    {rt.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Room Dropdown */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Room
                                        </label>
                                        <select
                                            value={blockForm.data.room_id}
                                            onChange={(e) => blockForm.setData('room_id', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                            required
                                        >
                                            <option value="">Select Room</option>
                                            {rooms
                                                .filter((r) => !blockRoomTypeId || String(r.room_type_id) === blockRoomTypeId)
                                                .map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        Room {r.room_number} ({r.roomType?.name || r.room_type?.name || 'Room'}) {r.status_hk === 'out_of_order' || r.status_hk === 'out_of_service' ? '• [ALREADY BLOCKED]' : ''}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* Reason Dropdown (Screenshot 4) */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Reason
                                        </label>
                                        <select
                                            value={blockForm.data.reason}
                                            onChange={(e) => blockForm.setData('reason', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        >
                                            <option value="">Select Reason</option>
                                            <option value="Maintenance">Maintenance</option>
                                            <option value="Renovation">Renovation</option>
                                            <option value="Deep Cleaning">Deep Cleaning</option>
                                            <option value="Out of Order">Out of Order</option>
                                            <option value="Owner Stay">Owner Stay</option>
                                            <option value="Plumbing">Plumbing</option>
                                            <option value="Electrical">Electrical</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Buttons (Clear & Apply - Screenshot 4) */}
                                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            blockForm.reset();
                                            setIsBlockModalOpen(false);
                                        }}
                                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={blockForm.processing}
                                        className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 6. SLIDE-IN BLOCKED ROOMS MANAGEMENT DRAWER */}
                {isBlockedListOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                                        <Wrench className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900">Blocked Rooms</h3>
                                        <p className="text-xs text-slate-500">Currently out of order or under maintenance</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsBlockedListOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
                                {blockedRooms.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 text-xs">
                                        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                                        <div className="font-bold text-slate-700 text-sm">No Rooms Blocked</div>
                                        <p className="text-slate-400 mt-1">All hotel rooms are active and available for booking.</p>
                                    </div>
                                ) : (
                                    blockedRooms.map((room) => (
                                        <div
                                            key={room.id}
                                            className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between gap-3 shadow-2xs"
                                        >
                                            <div className="flex items-center gap-2.5 sm:gap-3">
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 text-rose-800 font-black flex items-center justify-center text-xs">
                                                    {room.room_number}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800">
                                                        Room {room.room_number}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {room.roomType?.name || room.room_type?.name || 'Standard'} • <span className="text-rose-600 font-semibold">{room.status_hk.replace('_', ' ').toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleUnblock(room.id)}
                                                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                                                title="Unblock this room and set it Clean"
                                            >
                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                <span>Unblock</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsBlockedListOpen(false)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. GLOBAL NEW RESERVATION MODAL (Pre-filled from Grid Selection) */}
                <NewReservationModal
                    isOpen={isNewBookingModalOpen}
                    onClose={() => setIsNewBookingModalOpen(false)}
                    rooms={rooms}
                    roomTypes={roomTypes}
                    ratePlans={ratePlans}
                    guests={guests}
                    initialRoomId={prefilledModalData.roomId}
                    initialCheckIn={prefilledModalData.checkIn}
                    initialCheckOut={prefilledModalData.checkOut}
                />
            </div>
    );
}
