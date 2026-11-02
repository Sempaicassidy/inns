import NewReservationModal from '@/Components/NewReservationModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Guest, PageProps, RatePlan, Reservation, Room, RoomType } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Bed,
    BedDouble,
    Calendar,
    Check,
    CreditCard,
    Filter,
    LogOut,
    Plus,
    Search,
    UserCheck,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface ReservationsIndexProps extends PageProps {
    reservations: {
        data: Reservation[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    rooms: Room[];
    roomTypes: RoomType[];
    ratePlans: RatePlan[];
    guests: Guest[];
    filters: {
        status: string;
        search: string;
    };
}

export default function ReservationsIndex({
    reservations,
    rooms,
    roomTypes,
    ratePlans,
    guests,
    filters,
}: ReservationsIndexProps) {
    const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(
        typeof window !== 'undefined' && (new URLSearchParams(window.location.search).has('new') || window.location.pathname.endsWith('/create'))
    );
    const [checkInRes, setCheckInRes] = useState<Reservation | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState('');

    const { data, setData, post, processing, reset, errors } = useForm({
        guest_id: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        nationality: 'Tanzanian',
        id_number: '',
        room_type_id: roomTypes[0]?.id || '',
        room_id: '',
        rate_plan_id: ratePlans[0]?.id || '',
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        adults: 2,
        children: 0,
        source: 'walk_in',
        rate_price: 350000,
        deposit: 0,
        notes: '',
        check_in_now: false,
    });

    const { post: postCheckIn, processing: checkingIn } = useForm({
        room_id: '',
    });

    const formatTZS = (minor: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format(minor / 100);
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const searchVal = (form.elements.namedItem('search') as HTMLInputElement).value;
        router.get(route('reservations.index'), { search: searchVal, status: filters.status }, { preserveState: true });
    };

    const handleFilterStatus = (status: string) => {
        router.get(route('reservations.index'), { status, search: filters.search }, { preserveState: true });
    };

    const submitNewBooking = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('reservations.store'), {
            onSuccess: () => {
                setIsNewBookingModalOpen(false);
                reset();
            },
        });
    };

    const submitCheckIn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkInRes || !selectedRoomId) return;

        router.post(route('reservations.check-in', checkInRes.id), { room_id: selectedRoomId }, {
            onSuccess: () => {
                setCheckInRes(null);
                setSelectedRoomId('');
            },
        });
    };

    const handleCheckOut = (resId: string) => {
        if (confirm('Check out guest? Folio will be audited and room marked Dirty.')) {
            router.post(route('reservations.check-out', resId));
        }
    };

    const handleCancel = (resId: string) => {
        if (confirm('Are you sure you want to cancel this reservation?')) {
            router.post(route('reservations.cancel', resId));
        }
    };

    const getStatusBadge = (status: Reservation['status']) => {
        switch (status) {
            case 'checked_in':
                return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">Checked-In</span>;
            case 'confirmed':
                return <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-[11px] font-bold">Confirmed</span>;
            case 'tentative':
                return <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded text-[11px] font-bold">Tentative</span>;
            case 'checked_out':
                return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold">Checked-Out</span>;
            case 'cancelled':
                return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold">Cancelled</span>;
            default:
                return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">{status}</span>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="THE INNS" />

            {/* Header Toolbar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-4 sm:mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                        <BedDouble className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Reservations & Front Desk</h1>
                        <p className="text-[11px] sm:text-xs text-slate-500">
                            Bookings, room assignments, walk-ins and guest folios
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            name="search"
                            defaultValue={filters.search}
                            placeholder="Search Ref, Guest or Phone..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </form>

                    <button
                        onClick={() => setIsNewBookingModalOpen(true)}
                        className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-xl shadow-xs text-xs transition active-press shrink-0"
                    >
                        <UserPlus className="w-4 h-4 stroke-[2.5]" />
                        <span className="hidden sm:inline">New Booking / Walk-In</span>
                        <span className="sm:hidden">New Booking</span>
                    </button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 mb-4 sm:mb-6 overflow-x-auto no-scrollbar pb-1 text-xs">
                {[
                    { label: 'All Bookings', value: '' },
                    { label: 'Confirmed', value: 'confirmed' },
                    { label: 'In-House', value: 'checked_in' },
                    { label: 'Tentative', value: 'tentative' },
                    { label: 'Checked-Out', value: 'checked_out' },
                    { label: 'Cancelled', value: 'cancelled' },
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => handleFilterStatus(tab.value)}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap active-press text-xs ${
                            filters.status === tab.value
                                ? 'bg-blue-600 text-white font-bold shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* MOBILE CARDS VIEW (<sm screens) */}
            <div className="sm:hidden space-y-3 mb-6">
                {reservations.data.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                        No reservations found matching your criteria.
                    </div>
                ) : (
                    reservations.data.map((res) => {
                        const resRoom = res.reservation_rooms?.[0];
                        const folio = res.folios?.[0];
                        return (
                            <div
                                key={res.id}
                                id={`res-${res.id}`}
                                data-highlightable="true"
                                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
                            >
                                {/* Top: Guest Name, Ref & Status */}
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-slate-900 text-sm">
                                                {res.guest?.first_name} {res.guest?.last_name}
                                            </span>
                                            <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                                                {res.ref_no}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            {res.guest?.phone ? (
                                                <a href={`tel:${res.guest.phone}`} className="text-blue-600 underline">
                                                    {res.guest.phone}
                                                </a>
                                            ) : (
                                                'No phone'
                                            )}{' '}
                                            &bull; {res.guest?.nationality || 'Tanzanian'}
                                            {(res.guest as any)?.tribe && <span> ({(res.guest as any).tribe})</span>}
                                        </div>
                                        {(res.guest as any)?.id_number && (
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                <span className="font-bold uppercase">{(res.guest as any).id_type || 'ID'}:</span> {(res.guest as any).id_number}
                                            </div>
                                        )}
                                        {(res.origin || (res.guest as any)?.origin) && (
                                            <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                                                📍 {res.origin || (res.guest as any)?.origin} &rarr; {res.destination || (res.guest as any)?.destination || 'Transit'}
                                                {(res.vehicle_reg_no || (res.guest as any)?.vehicle_reg_no) && ` • 🚗 ${res.vehicle_reg_no || (res.guest as any)?.vehicle_reg_no}`}
                                            </div>
                                        )}
                                    </div>
                                    <div>{getStatusBadge(res.status)}</div>
                                </div>

                                {/* Room & Dates Bar */}
                                <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                            Room & Type
                                        </span>
                                        <span className="font-bold text-slate-900 block truncate">
                                            {resRoom?.room ? `Room ${resRoom.room.room_number}` : 'Unassigned'}
                                        </span>
                                        <span className="text-[10px] text-slate-500 block truncate">
                                            {resRoom?.room_type?.name || 'Standard'}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                            Dates & Total
                                        </span>
                                        <span className="font-mono font-semibold text-slate-800 text-[11px] block">
                                            {res.check_in} &rarr; {res.check_out}
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 text-xs block">
                                            {formatTZS(res.total_minor)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions Row */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="flex items-center space-x-1.5">
                                        {/* Check In Action */}
                                        {res.status === 'confirmed' && (
                                            <button
                                                onClick={() => {
                                                    setCheckInRes(res);
                                                    setSelectedRoomId(resRoom?.room_id || '');
                                                }}
                                                className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition active-press"
                                            >
                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                <span>Check In</span>
                                            </button>
                                        )}

                                        {/* Check Out Action */}
                                        {res.status === 'checked_in' && (
                                            <button
                                                onClick={() => handleCheckOut(res.id)}
                                                className="inline-flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition active-press"
                                            >
                                                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                                                <span>Check Out</span>
                                            </button>
                                        )}

                                        {/* View Folio */}
                                        {folio && (
                                            <Link
                                                href={route('folios.show', folio.id)}
                                                className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition active-press"
                                            >
                                                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Folio</span>
                                            </Link>
                                        )}
                                    </div>

                                    {/* Cancel */}
                                    {['confirmed', 'tentative'].includes(res.status) && (
                                        <button
                                            onClick={() => handleCancel(res.id)}
                                            className="text-slate-400 hover:text-rose-600 p-1.5 text-xs font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* DESKTOP RESERVATIONS TABLE (Hidden on mobile >=sm) */}
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="py-3.5 px-4">Ref #</th>
                                <th className="py-3.5 px-4">Guest Information</th>
                                <th className="py-3.5 px-4">Room & Type</th>
                                <th className="py-3.5 px-4">Stay Dates</th>
                                <th className="py-3.5 px-4">Total Amount</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                            {reservations.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        No reservations found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                reservations.data.map((res) => {
                                    const resRoom = res.reservation_rooms?.[0];
                                    const folio = res.folios?.[0];
                                    return (
                                        <tr
                                            key={res.id}
                                            id={`res-${res.id}`}
                                            data-highlightable="true"
                                            className="hover:bg-slate-50/80 transition"
                                        >
                                            <td className="py-4 px-4 font-mono font-bold text-sky-700">
                                                {res.ref_no}
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-medium">
                                                    {res.source.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {res.guest?.first_name} {res.guest?.last_name}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {res.guest?.phone || 'No phone'} &bull; {res.guest?.nationality || 'Tanzanian'}
                                                    {(res.guest as any)?.tribe && <span className="text-slate-400"> ({(res.guest as any).tribe})</span>}
                                                </div>
                                                {(res.guest as any)?.id_number && (
                                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                        <span className="font-bold uppercase">{(res.guest as any).id_type || 'ID'}:</span> {(res.guest as any).id_number}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-semibold text-slate-900">
                                                    {resRoom?.room ? `Room ${resRoom.room.room_number}` : (
                                                        <span className="text-sky-600 italic font-medium">Unassigned Room</span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    {resRoom?.room_type?.name}
                                                </div>
                                                {(res.vehicle_reg_no || (res.guest as any)?.vehicle_reg_no) && (
                                                    <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-600 mt-0.5">
                                                        🚗 {res.vehicle_reg_no || (res.guest as any)?.vehicle_reg_no}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 font-mono">
                                                <div className="text-slate-800 font-semibold">
                                                    {res.check_in} {res.check_in_time ? `(${res.check_in_time})` : ''} &rarr; {res.check_out} {res.check_out_time ? `(${res.check_out_time})` : ''}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-sans">
                                                    {res.adults} Adults{res.children > 0 && `, ${res.children} Kids`}
                                                    {(res.origin || (res.guest as any)?.origin) && (
                                                        <div className="text-blue-600 font-medium truncate max-w-xs mt-0.5">
                                                            {res.origin || (res.guest as any)?.origin} &rarr; {res.destination || (res.guest as any)?.destination || 'Transit'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 font-mono">
                                                <div className="font-bold text-slate-900">{formatTZS(res.total_minor)}</div>
                                                {res.deposit_minor > 0 && (
                                                    <div className="text-[10px] text-emerald-600 font-semibold">
                                                        Paid: {formatTZS(res.deposit_minor)} ({res.payment_method || 'Cash'})
                                                    </div>
                                                )}
                                                {res.receipt_no && (
                                                    <div className="text-[9px] text-slate-400 font-mono">
                                                        Rec: {res.receipt_no}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {getStatusBadge(res.status)}
                                            </td>
                                            <td className="py-4 px-4 text-right space-x-2">
                                                {/* Check In Action */}
                                                {res.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => {
                                                            setCheckInRes(res);
                                                            setSelectedRoomId(resRoom?.room_id || '');
                                                        }}
                                                        className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs shadow-xs transition active-press"
                                                    >
                                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                        <span>Check In</span>
                                                    </button>
                                                )}

                                                {/* Check Out Action */}
                                                {res.status === 'checked_in' && (
                                                    <button
                                                        onClick={() => handleCheckOut(res.id)}
                                                        className="inline-flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs shadow-xs transition active-press"
                                                    >
                                                        <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                                                        <span>Check Out</span>
                                                    </button>
                                                )}

                                                {/* View Folio */}
                                                {folio && (
                                                    <Link
                                                        href={route('folios.show', folio.id)}
                                                        className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition active-press"
                                                    >
                                                        <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                                                        <span>Folio</span>
                                                    </Link>
                                                )}

                                                {/* Cancel */}
                                                {['confirmed', 'tentative'].includes(res.status) && (
                                                    <button
                                                        onClick={() => handleCancel(res.id)}
                                                        className="text-slate-400 hover:text-slate-700 p-1 transition"
                                                        title="Cancel Booking"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {reservations.total > 15 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
                        <span>Showing {reservations.data.length} of {reservations.total} reservations</span>
                        <div className="flex space-x-1">
                            {reservations.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 rounded-lg border ${
                                        link.active
                                            ? 'bg-sky-500 text-white font-bold border-sky-500'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                    } ${!link.url && 'opacity-40 cursor-not-allowed'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Check-In Room Assignment Modal */}
            {checkInRes && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                            <h3 className="font-bold text-slate-900 text-sm">
                                Check In Guest: {checkInRes.guest?.first_name} {checkInRes.guest?.last_name}
                            </h3>
                            <button onClick={() => setCheckInRes(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitCheckIn} className="space-y-4 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                                <p><strong className="text-slate-900">Ref #:</strong> <span className="font-mono text-sky-700 font-bold">{checkInRes.ref_no}</span></p>
                                <p><strong className="text-slate-900">Dates:</strong> {checkInRes.check_in} &rarr; {checkInRes.check_out}</p>
                                <p><strong className="text-slate-900">Requested Type:</strong> {checkInRes.reservation_rooms?.[0]?.room_type?.name}</p>
                            </div>

                            <div>
                                <label className="text-slate-700 font-semibold block mb-1">
                                    Assign Clean / Inspected Room *
                                </label>
                                <select
                                    required
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                >
                                    <option value="">-- Choose Room --</option>
                                    {rooms
                                        .filter((r) => r.status_occupancy === 'vacant' || r.id === checkInRes.reservation_rooms?.[0]?.room_id)
                                        .map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.room_number} ({r.room_type?.name}) - {r.status_hk.toUpperCase()}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setCheckInRes(null)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition active-press"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedRoomId}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md disabled:opacity-50 transition active-press"
                                >
                                    Complete Check-In
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Reservation Modal matching CloudLodge UI (Autocomplete + Floors + Multi-Room) */}
            <NewReservationModal
                isOpen={isNewBookingModalOpen}
                onClose={() => setIsNewBookingModalOpen(false)}
                rooms={rooms}
                roomTypes={roomTypes}
                ratePlans={ratePlans}
                guests={guests}
            />
        </AuthenticatedLayout>
    );
}
