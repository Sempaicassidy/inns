import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, RatePlan, ReservationRoom, Room, RoomType } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    Plus,
    User,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface CalendarProps extends PageProps {
    startDate: string;
    endDate: string;
    businessDate: string;
    dates: {
        date: string;
        day_name: string;
        day_number: string;
        month_name: string;
        is_today: boolean;
        is_weekend: boolean;
    }[];
    rooms: Room[];
    roomTypes: RoomType[];
    reservationRooms: ReservationRoom[];
    ratePlans: RatePlan[];
    filters: {
        room_type_id: string;
    };
}

export default function CalendarPage({
    dates,
    rooms,
    roomTypes,
    reservationRooms,
    ratePlans,
    startDate,
    businessDate,
    filters,
}: CalendarProps) {
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<{ room: Room; date: string } | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        room_type_id: '',
        room_id: '',
        first_name: '',
        last_name: '',
        phone: '',
        rate_plan_id: ratePlans[0]?.id || '',
        check_in: '',
        check_out: '',
        adults: 2,
        children: 0,
        source: 'walk_in',
        rate_price: 250000,
        check_in_now: false,
    });

    const shiftDates = (days: number) => {
        const current = new Date(startDate);
        current.setDate(current.getDate() + days);
        const newDateStr = current.toISOString().split('T')[0];
        router.get(route('calendar.index'), { start_date: newDateStr, room_type_id: filters.room_type_id }, { preserveState: true });
    };

    const handleRoomTypeFilter = (rtId: string) => {
        router.get(route('calendar.index'), { start_date: startDate, room_type_id: rtId }, { preserveState: true });
    };

    const openQuickBook = (room: Room, date: string) => {
        const checkOut = new Date(date);
        checkOut.setDate(checkOut.getDate() + 1);
        const checkOutStr = checkOut.toISOString().split('T')[0];

        setData({
            ...data,
            room_type_id: room.room_type_id,
            room_id: room.id,
            check_in: date,
            check_out: checkOutStr,
            rate_price: room.room_type ? room.room_type.base_price_minor / 100 : 250000,
        });

        setSelectedRoomForBooking({ room, date });
    };

    const submitQuickBook = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('reservations.store'), {
            onSuccess: () => {
                setSelectedRoomForBooking(null);
                reset();
            },
        });
    };

    const getHkBadge = (status: Room['status_hk']) => {
        switch (status) {
            case 'clean':
                return <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Clean"></span>;
            case 'dirty':
                return <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" title="Dirty"></span>;
            case 'inspected':
                return <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" title="Inspected"></span>;
            default:
                return <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" title="Out of Service"></span>;
        }
    };

    const getBookingStatusColor = (status: string) => {
        switch (status) {
            case 'checked_in':
                return 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-emerald-400/50 shadow-emerald-500/20';
            case 'confirmed':
                return 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold border-amber-300 shadow-amber-500/20';
            case 'tentative':
                return 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-purple-400/50 shadow-purple-500/20';
            default:
                return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Room Availability Calendar (Gantt) - Haula HMS" />

            {/* Header Toolbar */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                        <CalendarIcon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Availability Timeline & Gantt</h1>
                        <p className="text-xs text-slate-400">
                            Real-time room allocation, drag-and-drop bookings and occupancy forecast
                        </p>
                    </div>
                </div>

                {/* Filters & Navigation Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Room Type Selector */}
                    <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={filters.room_type_id}
                            onChange={(e) => handleRoomTypeFilter(e.target.value)}
                            className="bg-transparent border-0 text-slate-200 text-xs focus:ring-0 cursor-pointer p-0 pr-4"
                        >
                            <option value="" className="bg-slate-900">All Room Types</option>
                            {roomTypes.map((rt) => (
                                <option key={rt.id} value={rt.id} className="bg-slate-900">
                                    {rt.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Navigation Buttons */}
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            onClick={() => shiftDates(-7)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                            title="Previous 7 Days"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => shiftDates(0)}
                            className="px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-slate-800 rounded-lg transition"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => shiftDates(7)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                            title="Next 7 Days"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Color Legend */}
            <div className="flex flex-wrap items-center gap-4 px-3 mb-4 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Legend:</span>
                <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
                    <span>Checked-In</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-md bg-amber-500 inline-block"></span>
                    <span>Confirmed</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-md bg-purple-500 inline-block"></span>
                    <span>Tentative</span>
                </div>
                <span className="border-l border-slate-800 h-3 mx-1"></span>
                <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                    <span>Clean</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                    <span>Dirty</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                    <span>Inspected</span>
                </div>
            </div>

            {/* Gantt Matrix Grid */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs select-none">
                        {/* Dates Header Row */}
                        <thead>
                            <tr className="bg-slate-950 border-b border-slate-800">
                                <th className="sticky left-0 z-20 bg-slate-950 p-3.5 text-left font-bold text-slate-300 min-w-[190px] border-r border-slate-800">
                                    Room & Type
                                </th>
                                {dates.map((d) => (
                                    <th
                                        key={d.date}
                                        className={`p-2 text-center min-w-[70px] border-r border-slate-800/60 ${
                                            d.is_today
                                                ? 'bg-amber-500/10 text-amber-400 font-bold border-b-2 border-b-amber-400'
                                                : d.is_weekend
                                                ? 'bg-slate-950/40 text-slate-400'
                                                : 'text-slate-300'
                                        }`}
                                    >
                                        <div className="text-[10px] uppercase tracking-wider">{d.day_name}</div>
                                        <div className="text-sm font-mono mt-0.5">{d.day_number}</div>
                                        <div className="text-[9px] text-slate-500">{d.month_name}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Room Rows */}
                        <tbody className="divide-y divide-slate-800/60">
                            {rooms.map((room) => {
                                // Find bookings for this room
                                const roomBookings = reservationRooms.filter((rr) => rr.room_id === room.id);

                                return (
                                    <tr key={room.id} className="hover:bg-slate-850/40 transition">
                                        {/* Room Name & Status Column */}
                                        <td className="sticky left-0 z-10 bg-slate-900 p-3 border-r border-slate-800">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    {getHkBadge(room.status_hk)}
                                                    <span className="font-bold text-white font-mono text-sm">{room.room_number}</span>
                                                </div>
                                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                                    {room.room_type?.code || 'STD'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate mt-0.5 max-w-[170px]">
                                                {room.floor} &bull; {room.room_type?.name}
                                            </div>
                                        </td>

                                        {/* Date Grid Cells */}
                                        {dates.map((d) => {
                                            // Check if this date falls within any booking for this room
                                            const booking = roomBookings.find((b) => {
                                                return d.date >= b.check_in && d.date < b.check_out;
                                            });

                                            const isBookingStart = booking && booking.check_in === d.date;

                                            return (
                                                <td
                                                    key={d.date}
                                                    onClick={() => !booking && openQuickBook(room, d.date)}
                                                    className={`p-1 text-center border-r border-slate-800/40 relative h-12 transition ${
                                                        !booking
                                                            ? 'hover:bg-amber-500/5 cursor-pointer group'
                                                            : ''
                                                    } ${d.is_today ? 'bg-amber-500/[0.03]' : ''}`}
                                                >
                                                    {booking ? (
                                                        <div
                                                            className={`h-9 px-2 rounded-lg flex items-center justify-start text-[11px] overflow-hidden truncate border shadow-sm transition ${getBookingStatusColor(
                                                                booking.status
                                                            )}`}
                                                            title={`${booking.reservation?.guest?.first_name} ${booking.reservation?.guest?.last_name} (${booking.reservation?.ref_no})`}
                                                        >
                                                            {isBookingStart || d.day_number === '01' || dates[0].date === d.date ? (
                                                                <span className="truncate flex items-center space-x-1">
                                                                    <User className="w-3 h-3 shrink-0" />
                                                                    <span className="font-semibold truncate">
                                                                        {booking.reservation?.guest?.first_name} {booking.reservation?.guest?.last_name}
                                                                    </span>
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <div className="hidden group-hover:flex items-center justify-center w-full h-full text-amber-400/60">
                                                            <Plus className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Booking Modal */}
            {selectedRoomForBooking && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-white">
                                    Quick Reservation & Walk-In
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {selectedRoomForBooking.room.room_number} &bull; {selectedRoomForBooking.room.room_type?.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedRoomForBooking(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitQuickBook} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-300 font-semibold block mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                        placeholder="Juma"
                                    />
                                    {errors.first_name && <p className="text-rose-400 mt-1">{errors.first_name}</p>}
                                </div>
                                <div>
                                    <label className="text-slate-300 font-semibold block mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                        placeholder="Mwangi"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                    placeholder="+255 754 123 456"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-300 font-semibold block mb-1">Check-In Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={data.check_in}
                                        onChange={(e) => setData('check_in', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-300 font-semibold block mb-1">Check-Out Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={data.check_out}
                                        onChange={(e) => setData('check_out', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-300 font-semibold block mb-1">Rate Plan *</label>
                                    <select
                                        value={data.rate_plan_id}
                                        onChange={(e) => setData('rate_plan_id', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                    >
                                        {ratePlans.map((rp) => (
                                            <option key={rp.id} value={rp.id}>
                                                {rp.name} ({rp.meal_plan})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-300 font-semibold block mb-1">Rate Per Night (TZS) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={data.rate_price}
                                        onChange={(e) => setData('rate_price', Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Check-in Immediately Toggle */}
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                                <div>
                                    <span className="font-semibold text-white block">Immediate Walk-In Check-In</span>
                                    <span className="text-[11px] text-slate-400">Create Stay record and mark room occupied right now</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.check_in_now}
                                    onChange={(e) => setData('check_in_now', e.target.checked)}
                                    className="rounded border-slate-800 text-amber-500 focus:ring-amber-400 w-4 h-4 bg-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRoomForBooking(null)}
                                    className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
                                >
                                    {processing ? 'Booking...' : 'Confirm Reservation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
