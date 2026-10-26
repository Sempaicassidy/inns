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
    const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
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
                return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">Checked-In</span>;
            case 'confirmed':
                return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-bold">Confirmed</span>;
            case 'tentative':
                return <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[11px] font-bold">Tentative</span>;
            case 'checked_out':
                return <span className="bg-slate-700/60 text-slate-300 border border-slate-600 px-2 py-0.5 rounded text-[11px] font-semibold">Checked-Out</span>;
            case 'cancelled':
                return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">Cancelled</span>;
            default:
                return <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[11px]">{status}</span>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Reservations & Front Desk - Haula HMS" />

            {/* Header Toolbar */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                        <BedDouble className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Reservations & Front Desk</h1>
                        <p className="text-xs text-slate-400">
                            Manage bookings, room assignments, walk-ins and guest folios
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            name="search"
                            defaultValue={filters.search}
                            placeholder="Search Ref, Guest or Phone..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    </form>

                    <button
                        onClick={() => setIsNewBookingModalOpen(true)}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition"
                    >
                        <UserPlus className="w-4 h-4 stroke-[2.5]" />
                        <span>New Booking / Walk-In</span>
                    </button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2 text-xs">
                {[
                    { label: 'All Bookings', value: '' },
                    { label: 'Confirmed', value: 'confirmed' },
                    { label: 'In-House (Checked-In)', value: 'checked_in' },
                    { label: 'Tentative', value: 'tentative' },
                    { label: 'Checked-Out', value: 'checked_out' },
                    { label: 'Cancelled', value: 'cancelled' },
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => handleFilterStatus(tab.value)}
                        className={`px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                            filters.status === tab.value
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Reservations Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
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
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {reservations.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-500">
                                        No reservations found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                reservations.data.map((res) => {
                                    const resRoom = res.reservation_rooms?.[0];
                                    const folio = res.folios?.[0];
                                    return (
                                        <tr key={res.id} className="hover:bg-slate-850/50 transition">
                                            <td className="py-4 px-4 font-mono font-bold text-amber-400">
                                                {res.ref_no}
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
                                                    {res.source.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-white text-sm">
                                                    {res.guest?.first_name} {res.guest?.last_name}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    {res.guest?.phone} &bull; {res.guest?.nationality}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-semibold text-slate-100">
                                                    {resRoom?.room ? `Room ${resRoom.room.room_number}` : (
                                                        <span className="text-amber-400/90 italic font-normal">Unassigned Room</span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {resRoom?.room_type?.name}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 font-mono">
                                                <div className="text-slate-200">{res.check_in} &rarr; {res.check_out}</div>
                                                <div className="text-[10px] text-slate-400 font-sans">
                                                    {res.adults} Adults{res.children > 0 && `, ${res.children} Kids`}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 font-mono">
                                                <div className="font-bold text-white">{formatTZS(res.total_minor)}</div>
                                                {res.deposit_minor > 0 && (
                                                    <div className="text-[10px] text-emerald-400">Dep: {formatTZS(res.deposit_minor)}</div>
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
                                                        className="inline-flex items-center space-x-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-xs shadow-sm transition"
                                                    >
                                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                        <span>Check In</span>
                                                    </button>
                                                )}

                                                {/* Check Out Action */}
                                                {res.status === 'checked_in' && (
                                                    <button
                                                        onClick={() => handleCheckOut(res.id)}
                                                        className="inline-flex items-center space-x-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-xs shadow-sm transition"
                                                    >
                                                        <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                                                        <span>Check Out</span>
                                                    </button>
                                                )}

                                                {/* View Folio */}
                                                {folio && (
                                                    <Link
                                                        href={route('folios.show', folio.id)}
                                                        className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                                    >
                                                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                                        <span>Folio</span>
                                                    </Link>
                                                )}

                                                {/* Cancel */}
                                                {['confirmed', 'tentative'].includes(res.status) && (
                                                    <button
                                                        onClick={() => handleCancel(res.id)}
                                                        className="text-slate-500 hover:text-rose-400 p-1"
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
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span>Showing {reservations.data.length} of {reservations.total} reservations</span>
                        <div className="flex space-x-1">
                            {reservations.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 rounded-lg border ${
                                        link.active
                                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                                    } ${!link.url && 'opacity-40 cursor-not-allowed'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Check-In Room Assignment Modal */}
            {checkInRes && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="font-bold text-white text-sm">
                                Check In Guest: {checkInRes.guest?.first_name} {checkInRes.guest?.last_name}
                            </h3>
                            <button onClick={() => setCheckInRes(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitCheckIn} className="space-y-4 text-xs">
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                                <p><strong>Ref #:</strong> {checkInRes.ref_no}</p>
                                <p><strong>Dates:</strong> {checkInRes.check_in} &rarr; {checkInRes.check_out}</p>
                                <p><strong>Requested Type:</strong> {checkInRes.reservation_rooms?.[0]?.room_type?.name}</p>
                            </div>

                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">
                                    Assign Clean / Inspected Room *
                                </label>
                                <select
                                    required
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-400"
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

                            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setCheckInRes(null)}
                                    className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedRoomId}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg disabled:opacity-50"
                                >
                                    Complete Check-In
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Complete New Booking / Walk-In Modal */}
            {isNewBookingModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <div>
                                <h3 className="font-bold text-white text-base">New Guest Reservation & Walk-In</h3>
                                <p className="text-xs text-slate-400">Capture guest details, room allotment, rates and deposit</p>
                            </div>
                            <button onClick={() => setIsNewBookingModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitNewBooking} className="space-y-4 text-xs">
                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-2">
                                    1. Guest Information
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                            placeholder="Sarah"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                            placeholder="Jenkins"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                            placeholder="+255 754 000 000"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                            placeholder="guest@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">Nationality</label>
                                        <input
                                            type="text"
                                            value={data.nationality}
                                            onChange={(e) => setData('nationality', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">ID / Passport Number</label>
                                        <input
                                            type="text"
                                            value={data.id_number}
                                            onChange={(e) => setData('id_number', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                                            placeholder="Passport / NIDA"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-2">
                                    2. Room & Stay Details
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">Room Type *</label>
                                        <select
                                            value={data.room_type_id}
                                            onChange={(e) => {
                                                const rt = roomTypes.find(t => t.id === e.target.value);
                                                setData({
                                                    ...data,
                                                    room_type_id: e.target.value,
                                                    rate_price: rt ? rt.base_price_minor / 100 : data.rate_price,
                                                });
                                            }}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        >
                                            {roomTypes.map((rt) => (
                                                <option key={rt.id} value={rt.id}>
                                                    {rt.name} ({formatTZS(rt.base_price_minor)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">Assign Room (Optional)</label>
                                        <select
                                            value={data.room_id}
                                            onChange={(e) => setData('room_id', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        >
                                            <option value="">Auto-Assign Later</option>
                                            {rooms
                                                .filter(r => r.status_occupancy === 'vacant')
                                                .map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        Room {r.room_number} ({r.status_hk})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">Check-In Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={data.check_in}
                                            onChange={(e) => setData('check_in', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">Check-Out Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={data.check_out}
                                            onChange={(e) => setData('check_out', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-slate-300 font-semibold block mb-1">Rate Plan *</label>
                                        <select
                                            value={data.rate_plan_id}
                                            onChange={(e) => setData('rate_plan_id', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
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
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Immediate Walk-In Check-In */}
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                                <div>
                                    <span className="font-semibold text-white block">Immediate Walk-In Check-In</span>
                                    <span className="text-[11px] text-slate-400">Generate stay record, open folio and occupy room immediately</span>
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
                                    onClick={() => setIsNewBookingModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 'Confirm & Save Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
