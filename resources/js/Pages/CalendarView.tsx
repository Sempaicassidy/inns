import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Filter,
    Plus,
    X,
    Bed,
    Users,
    Lock,
    CheckCircle,
    Clock,
    AlertCircle,
    Home,
    Search,
} from 'lucide-react';

interface RoomType {
    id: string;
    name: string;
    rooms: Room[];
}

interface Room {
    id: string;
    number: string;
    type: string;
    status: 'available' | 'occupied' | 'reserved' | 'dirty' | 'maintenance' | 'blocked';
    guest_name?: string;
    check_in?: string;
    check_out?: string;
    price?: number;
}

interface Booking {
    id: string;
    room_id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    adults: number;
    children: number;
    amount: number;
}

interface CalendarViewProps extends PageProps {
    roomTypes: RoomType[];
    bookings: Booking[];
    stats: {
        total: number;
        vacant: number;
        occupied: number;
        reserved: number;
        blocked: number;
        dirty: number;
    };
}

export default function CalendarView({
    roomTypes = [],
    bookings = [],
    stats,
}: CalendarViewProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const lastDay = new Date(year, month + 1, 0);
        return lastDay.getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const prevMonth = () => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
    };

    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getBookingForRoomAndDate = (roomId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return bookings.find(b =>
            b.room_id === roomId &&
            dateStr >= b.check_in &&
            dateStr < b.check_out
        );
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '/');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Calendar View - THE INNS" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Calendar View</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                            <span>New Booking</span>
                        </button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                            <span>Quick Search</span>
                        </button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">All:</span>
                        <span className="font-bold text-gray-900">{stats.total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-sm text-gray-600">Vacant:</span>
                        <span className="font-bold text-emerald-700">{stats.vacant}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-600">Occupied:</span>
                        <span className="font-bold text-blue-700">{stats.occupied}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-sm text-gray-600">Reserved:</span>
                        <span className="font-bold text-purple-700">{stats.reserved}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <span className="text-sm text-gray-600">Blocked:</span>
                        <span className="font-bold text-gray-700">{stats.blocked}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-sm text-gray-600">Dirty:</span>
                        <span className="font-bold text-amber-700">{stats.dirty}</span>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <button
                            onClick={prevMonth}
                            className="p-2 rounded hover:bg-gray-100 transition"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900">
                            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button
                            onClick={nextMonth}
                            className="p-2 rounded hover:bg-gray-100 transition"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Days Header */}
                    <div className="grid border-b border-gray-200 min-w-[720px]" style={{ gridTemplateColumns: `repeat(${daysInMonth + 1}, minmax(64px, 1fr))` }}>
                        <div className="p-2 text-center text-xs font-medium text-gray-500 border-r border-gray-200 bg-gray-50">Room Type</div>
                        {days.map((day) => (
                            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 border-r border-gray-200 bg-gray-50">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Room Rows */}
                    {roomTypes.map((roomType) => (
                        <div key={roomType.id} className="border-b border-gray-200">
                            {/* Room Type Header */}
                            <div className="bg-blue-50 p-2 text-sm font-medium text-blue-900 border-b border-blue-200">
                                {roomType.name}
                            </div>

                            {/* Room Cells */}
                            {roomType.rooms.map((room) => (
                                <div key={room.id} className="grid border-b border-gray-100 min-w-[720px]" style={{ gridTemplateColumns: `repeat(${daysInMonth + 1}, minmax(64px, 1fr))` }}>
                                    <div
                                        onClick={() => setSelectedRoom(room)}
                                        className="p-2 text-xs font-medium text-gray-900 border-r border-gray-200 bg-white hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                                    >
                                        <Bed className="w-3 h-3" />
                                        {room.number}
                                    </div>
                                    {days.map((day) => {
                                        const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                                        const booking = getBookingForRoomAndDate(room.id, date);

                                        return (
                                            <div
                                                key={day}
                                                onClick={() => {
                                                    if (!booking) {
                                                        setSelectedRange({ start: date, end: new Date(date.getTime() + 86400000) });
                                                    }
                                                }}
                                                className={`p-2 text-xs border-r border-gray-200 cursor-pointer ${booking ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'
                                                    }`}
                                            >
                                                {booking ? (
                                                    <div className="text-center">
                                                        <div className="font-medium truncate">{booking.guest_name}</div>
                                                        <div className="text-[10px] opacity-80">{booking.adults}A {booking.children}C</div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-gray-400 text-[10px]">
                                                        {room.price ? `${room.price}` : 'N/A'}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Room Availability & Occupancy */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Room Availability</h3>
                        <div className="space-y-1">
                            {days.slice(0, 7).map((day) => {
                                const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                                const availableCount = roomTypes.reduce((acc, rt) => {
                                    return acc + rt.rooms.filter(r => {
                                        const booking = getBookingForRoomAndDate(r.id, date);
                                        return !booking;
                                    }).length;
                                }, 0);

                                return (
                                    <div key={day} className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600">{formatDate(date)}</span>
                                        <span className="font-medium text-gray-900">{availableCount}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Occupancy(%)</h3>
                        <div className="space-y-1">
                            {days.slice(0, 7).map((day) => {
                                const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                                const occupiedCount = roomTypes.reduce((acc, rt) => {
                                    return acc + rt.rooms.filter(r => {
                                        const booking = getBookingForRoomAndDate(r.id, date);
                                        return !!booking;
                                    }).length;
                                }, 0);
                                const occupancy = stats.total > 0 ? Math.round((occupiedCount / stats.total) * 100) : 0;

                                return (
                                    <div key={day} className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600">{formatDate(date)}</span>
                                        <span className="font-medium text-gray-900">{occupancy}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Date Range Selection Modal */}
                {selectedRange.start && !isBlockModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Action</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setIsBlockModalOpen(true)}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2"
                                >
                                    <span>Maintenance Block</span>
                                </button>
                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2">
                                    <span>Walk In / Reservation</span>
                                </button>
                                <button
                                    onClick={() => setSelectedRange({ start: null, end: null })}
                                    className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                            {selectedRange.start && selectedRange.end && (
                                <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
                                    <div className="text-sm text-gray-600">
                                        {formatDate(selectedRange.start)} - {formatDate(selectedRange.end)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {Math.ceil((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24))} night(s)
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Block Room Modal */}
                {isBlockModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Block Room</h3>
                                <button
                                    onClick={() => {
                                        setIsBlockModalOpen(false);
                                        setSelectedRange({ start: null, end: null });
                                    }}
                                    className="p-2 rounded hover:bg-gray-100 transition"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={selectedRange.start?.toISOString().split('T')[0] || ''}
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                                            readOnly
                                        />
                                        <span className="text-gray-500">to</span>
                                        <input
                                            type="date"
                                            value={selectedRange.end?.toISOString().split('T')[0] || ''}
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
                                        <option value="">Select Room Type</option>
                                        {roomTypes.map((rt) => (
                                            <option key={rt.id} value={rt.id}>{rt.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
                                        <option value="">Select Room</option>
                                        {selectedRoom && (
                                            <option value={selectedRoom.id}>Room {selectedRoom.number}</option>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
                                        <option value="">Select Reason</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="renovation">Renovation</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setIsBlockModalOpen(false);
                                            setSelectedRange({ start: null, end: null });
                                        }}
                                        className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
                                    >
                                        Clear
                                    </button>
                                    <button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg font-medium transition">
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
