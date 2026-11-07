import { Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Bed,
    BedDouble,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    CreditCard,
    DollarSign,
    ExternalLink,
    Filter,
    KeyRound,
    Layers,
    Phone,
    Plus,
    Search,
    Shield,
    Sparkles,
    User,
    UserCheck,
    Users,
    Wrench,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

export interface GridRoomItem {
    id: string;
    room_number: string;
    room_type_id?: string;
    floor?: string;
    status_occupancy: 'vacant' | 'occupied' | string;
    status_hk: 'clean' | 'dirty' | 'inspected' | 'out_of_order' | 'out_of_service' | string;
    is_active?: boolean;
    type_name?: string;
    room_type?: {
        id?: string;
        name?: string;
        base_price_minor?: number;
        image?: string;
        image_url?: string;
        amenities?: string[];
        description?: string;
        max_adults?: number;
        base_occupancy?: number;
    };
    base_price_minor?: number;
    current_guest?: string | null;
    guest_name?: string | null;
    current_guest_phone?: string | null;
    current_check_in?: string | null;
    current_check_out?: string | null;
    current_reservation_id?: string | null;
    current_reservation_number?: string | null;
    current_folio_id?: string | null;
    current_folio_balance_minor?: number;
    is_due_out?: boolean;
    active_task?: {
        id: string;
        task_type: string;
        priority: string;
        status: string;
        assigned_to_name: string;
        notes?: string;
    } | null;
    // Room-specific & type-inherited decoration fields
    amenities?: string[];
    description?: string;
    features?: string[];
    max_occupancy?: number;
    base_occupancy?: number;
}

interface RoomArrangementGridProps {
    rooms: GridRoomItem[];
    businessDate?: string;
    onRoomStatusChange?: (roomId: string, status: string) => void;
    onOpenTaskModal?: (room: GridRoomItem | { id: string; [key: string]: any }) => void;
    mode?: 'housekeeping' | 'dashboard' | 'general';
    floors?: string[];
    title?: string;
}

const DEFAULT_ROOM_IMAGE =
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80';

export default function RoomArrangementGrid({
    rooms = [],
    businessDate,
    onRoomStatusChange,
    onOpenTaskModal,
    mode = 'general',
    floors = [],
    title = 'Rooms Arrangement',
}: RoomArrangementGridProps) {
    const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
    const [selectedFloor, setSelectedFloor] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [hoveredRoom, setHoveredRoom] = useState<GridRoomItem | null>(null);
    const [activeRoom, setActiveRoom] = useState<GridRoomItem | null>(null);

    // Maintenance Request Modal State
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [maintenanceRoomId, setMaintenanceRoomId] = useState<string>('');
    const [maintenanceCategory, setMaintenanceCategory] = useState<string>('plumbing');
    const [maintenancePriority, setMaintenancePriority] = useState<'normal' | 'high' | 'urgent'>('high');
    const [maintenanceStatusType, setMaintenanceStatusType] = useState<'out_of_order' | 'out_of_service'>('out_of_order');
    const [maintenanceNotes, setMaintenanceNotes] = useState<string>('');
    const [submittingMaintenance, setSubmittingMaintenance] = useState(false);
    const [maintenanceSuccess, setMaintenanceSuccess] = useState<string | null>(null);

    const formatTsh = (amountMinor: number) => {
        return `TSh ${Number(amountMinor || 0).toLocaleString()}`;
    };

    const openMaintenanceModal = (roomId?: string) => {
        if (roomId) {
            setMaintenanceRoomId(roomId);
        } else if (rooms.length > 0) {
            setMaintenanceRoomId(rooms[0].id);
        }
        setIsMaintenanceModalOpen(true);
    };

    const handleSubmitMaintenance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!maintenanceRoomId) return;
        setSubmittingMaintenance(true);

        const targetRoom = rooms.find(r => r.id === maintenanceRoomId);

        if (onRoomStatusChange) {
            onRoomStatusChange(maintenanceRoomId, maintenanceStatusType);
            setMaintenanceSuccess(`Room ${targetRoom?.room_number || ''} marked as ${maintenanceStatusType === 'out_of_order' ? 'Out of Order' : 'Out of Service'}. Maintenance requested!`);
            setTimeout(() => {
                setMaintenanceSuccess(null);
                setIsMaintenanceModalOpen(false);
                setMaintenanceNotes('');
                setSubmittingMaintenance(false);
            }, 1200);
        } else {
            router.post(route('housekeeping.rooms.status', maintenanceRoomId), {
                status_hk: maintenanceStatusType,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setMaintenanceSuccess(`Room ${targetRoom?.room_number || ''} marked as ${maintenanceStatusType === 'out_of_order' ? 'Out of Order' : 'Out of Service'}. Maintenance requested!`);
                    setTimeout(() => {
                        setMaintenanceSuccess(null);
                        setIsMaintenanceModalOpen(false);
                        setMaintenanceNotes('');
                        setSubmittingMaintenance(false);
                    }, 1200);
                },
                onError: () => {
                    setSubmittingMaintenance(false);
                }
            });
        }
    };

    // Calculate Counts
    const counts = useMemo(() => {
        let total = rooms.length;
        let available = 0;
        let occupied = 0;
        let dirty = 0;
        let maintenance = 0;
        let clean = 0;
        let inspected = 0;

        rooms.forEach((r) => {
            const isOcc = r.status_occupancy === 'occupied';
            const isD = r.status_hk === 'dirty';
            const isM = r.status_hk === 'out_of_order' || r.status_hk === 'out_of_service';

            if (r.status_hk === 'clean') clean++;
            if (r.status_hk === 'inspected') inspected++;

            if (isOcc) {
                occupied++;
            } else if (isM) {
                maintenance++;
            } else if (isD) {
                dirty++;
            } else {
                available++;
            }
        });

        return { total, available, occupied, dirty, maintenance, clean, inspected };
    }, [rooms]);

    // Filter Rooms
    const filteredRooms = useMemo(() => {
        return rooms.filter((room) => {
            const isOcc = room.status_occupancy === 'occupied';
            const isD = room.status_hk === 'dirty';
            const isM = room.status_hk === 'out_of_order' || room.status_hk === 'out_of_service';
            const isAvail = !isOcc && !isM && !isD;

            // Status filter
            if (selectedStatusTab === 'available' && !isAvail) return false;
            if (selectedStatusTab === 'occupied' && !isOcc) return false;
            if (selectedStatusTab === 'dirty' && !isD) return false;
            if (selectedStatusTab === 'maintenance' && !isM) return false;
            if (selectedStatusTab === 'clean' && room.status_hk !== 'clean' && room.status_hk !== 'inspected') return false;

            // Floor filter
            if (selectedFloor !== 'all' && room.floor !== selectedFloor) return false;

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const roomNum = (room.room_number || '').toLowerCase();
                const typeName = (room.type_name || room.room_type?.name || '').toLowerCase();
                const guest = (room.current_guest || room.guest_name || '').toLowerCase();
                if (!roomNum.includes(q) && !typeName.includes(q) && !guest.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [rooms, selectedStatusTab, selectedFloor, searchQuery]);

    // Helper: Clean Display Room Number (e.g., "101", "102", "201", "01")
    const getDisplayRoomNumber = (room: GridRoomItem) => {
        const raw = (room.room_number || '').trim();
        const cleaned = raw.replace(/^(room|suite|villa|penthouse|chalet|studio)\s+/i, '').trim();
        return cleaned || raw;
    };

    // Helper: Clean Full Room Title (e.g., "Room 101", "Suite 201", "Villa 01")
    const getDisplayRoomTitle = (room: GridRoomItem) => {
        const raw = (room.room_number || '').trim();
        if (/^(room|suite|villa|penthouse|chalet|studio)\s+/i.test(raw)) {
            return raw;
        }
        const typeName = (room.type_name || room.room_type?.name || '').toLowerCase();
        if (typeName.includes('suite')) return `Suite ${raw}`;
        if (typeName.includes('villa')) return `Villa ${raw}`;
        return `Room ${raw}`;
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Helper: Determine Room Status Visuals with Hard/Solid Colors & Subtle Soft Gradient
    const getRoomStyle = (room: GridRoomItem) => {
        const isOcc = room.status_occupancy === 'occupied';
        const isD = room.status_hk === 'dirty';
        const isM = room.status_hk === 'out_of_order' || room.status_hk === 'out_of_service';

        if (isOcc) {
            return {
                statusKey: 'occupied',
                statusLabel: 'Occupied',
                cardBg: 'bg-gradient-to-b from-[#FEECEC] to-[#FDE4E4]',
                cardBorder: 'border-2 border-[#FECACA] hover:border-[#EF4444]',
                iconColor: 'text-[#991B1B]',
                badgeBg: 'bg-[#EF4444] text-white',
                numberColor: 'text-[#991B1B]',
            };
        }

        if (isM) {
            return {
                statusKey: 'maintenance',
                statusLabel: 'Maintenance',
                cardBg: 'bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]',
                cardBorder: 'border-2 border-[#CBD5E1] hover:border-[#64748B]',
                iconColor: 'text-[#475569]',
                badgeBg: 'bg-[#64748B] text-white',
                numberColor: 'text-[#334155]',
            };
        }

        if (isD) {
            return {
                statusKey: 'dirty',
                statusLabel: 'Dirty',
                cardBg: 'bg-gradient-to-b from-[#FFFDF0] to-[#FEF7DB]',
                cardBorder: 'border-2 border-[#FDE68A] hover:border-[#F59E0B]',
                iconColor: 'text-[#B45309]',
                badgeBg: 'bg-[#F59E0B] text-white',
                numberColor: 'text-[#92400E]',
            };
        }

        // Available
        return {
            statusKey: 'available',
            statusLabel: 'Available',
            cardBg: 'bg-gradient-to-b from-[#EDFAF1] to-[#E3F7EA]',
            cardBorder: 'border-2 border-[#86EFAC] hover:border-[#22C55E]',
            iconColor: 'text-[#166534]',
            badgeBg: 'bg-[#22C55E] text-white',
            numberColor: 'text-[#166534]',
        };
    };

    return (
        <div className="space-y-4">
            {/* 1. Top Control Bar: Title + Housekeeping Status + Request Maintenance (Above Cards) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[#1E3A5F]/10 text-[#1E3A5F] shadow-2xs">
                        <BedDouble className="w-6 h-6 text-[#1E3A5F]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
                        <p className="text-xs text-slate-500">Live occupancy, housekeeping status overview, and room maintenance dispatch</p>
                    </div>
                </div>

                {/* Actions: Housekeeping Status Quick Overview & Request Maintenance Button */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Housekeeping Status Quick Strip */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">HK:</span>
                        
                        <button
                            type="button"
                            onClick={() => setSelectedStatusTab(selectedStatusTab === 'clean' ? 'all' : 'clean')}
                            className="inline-flex items-center gap-1 text-emerald-700 hover:bg-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer"
                            title="Filter Clean Rooms"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {counts.clean} Clean
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedStatusTab(selectedStatusTab === 'dirty' ? 'all' : 'dirty')}
                            className="inline-flex items-center gap-1 text-amber-800 hover:bg-amber-100 bg-amber-50 px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer"
                            title="Filter Dirty Rooms"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            {counts.dirty} Dirty
                        </button>

                        {counts.maintenance > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedStatusTab(selectedStatusTab === 'maintenance' ? 'all' : 'maintenance')}
                                className="inline-flex items-center gap-1 text-rose-700 hover:bg-rose-100 bg-rose-50 px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer"
                                title="Filter Maintenance Rooms"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                {counts.maintenance} Maintenance
                            </button>
                        )}
                    </div>

                    {/* Request Maintenance Button */}
                    <button
                        type="button"
                        onClick={() => openMaintenanceModal(activeRoom?.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#D4AF37] hover:bg-[#c29d2b] text-[#1E3A5F] font-black text-xs shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer border border-[#c29d2b]"
                    >
                        <Wrench className="w-3.5 h-3.5 text-[#1E3A5F]" />
                        <span>Request Maintenance</span>
                    </button>

                    {/* Date Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                            {businessDate ||
                                new Date().toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: '2-digit',
                                    year: 'numeric',
                                })}
                        </span>
                    </div>

                    {/* Floor selector if available */}
                    {floors && floors.length > 0 && (
                        <select
                            value={selectedFloor}
                            onChange={(e) => setSelectedFloor(e.target.value)}
                            aria-label="Filter by floor"
                            className="text-xs py-2 px-3 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:ring-1 focus:ring-[#1E3A5F] cursor-pointer"
                        >
                            <option value="all">All Floors</option>
                            {floors.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* 2. Filter Bar matching Image 2 */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
                    <button
                        type="button"
                        onClick={() => setSelectedStatusTab('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            selectedStatusTab === 'all'
                                ? 'bg-[#1E3A5F] text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                    >
                        All ({counts.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatusTab('available')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            selectedStatusTab === 'available'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                    >
                        Available ({counts.available})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatusTab('occupied')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            selectedStatusTab === 'occupied'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                        }`}
                    >
                        Occupied ({counts.occupied})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatusTab('dirty')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            selectedStatusTab === 'dirty'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                    >
                        Dirty ({counts.dirty})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatusTab('maintenance')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            selectedStatusTab === 'maintenance'
                                ? 'bg-slate-700 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        Maintenance ({counts.maintenance})
                    </button>
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search room # or guest name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F] outline-none"
                    />
                </div>
            </div>

            {/* 3. Main Area: Full-Width 4-Column Grid of Rooms (Exactly 4 Columns as Requested) */}
            <div className="w-full bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
                {filteredRooms.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <Bed className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-bold text-slate-600">No rooms match the selected filter</p>
                        <p className="text-xs text-slate-400 mt-1">Try selecting another status tab or clear your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {filteredRooms.map((room) => {
                            const style = getRoomStyle(room);
                            const isSelected = activeRoom?.id === room.id;
                            const isMaintenance =
                                room.status_hk === 'out_of_order' || room.status_hk === 'out_of_service';
                            const guestName = room.current_guest || room.guest_name;

                            return (
                                <div
                                    key={room.id}
                                    id={`room-card-${room.room_number}`}
                                    onClick={() => setActiveRoom(room)}
                                    onMouseEnter={() => setHoveredRoom(room)}
                                    onMouseLeave={() => setHoveredRoom(null)}
                                    className={`group relative rounded-2xl p-4 sm:p-5 border-2 flex flex-col items-center justify-between h-44 sm:h-48 cursor-pointer transition-all duration-200 ease-out select-none shadow-xs hover:shadow-xl hover:scale-105 overflow-visible ${
                                        style.cardBg
                                    } ${style.cardBorder} ${
                                        isSelected
                                            ? 'ring-4 ring-[#1E3A5F]/20 scale-105 shadow-xl'
                                            : ''
                                    }`}
                                >
                                    {/* 1. Top Icon matching Image 2 */}
                                    <div className="pt-1 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                                        {isMaintenance ? (
                                            <Wrench className={`w-7 h-7 sm:w-8 sm:h-8 ${style.iconColor}`} />
                                        ) : (
                                            <BedDouble className={`w-8 h-8 sm:w-9 sm:h-9 ${style.iconColor}`} />
                                        )}
                                    </div>

                                    {/* 2. Middle Room Number (101, 102, 103, 104, 105, 201) */}
                                    <div className="text-center my-auto">
                                        <span className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${style.numberColor}`}>
                                            {getDisplayRoomNumber(room)}
                                        </span>
                                    </div>

                                    {/* 3. Bottom Status Pill (Available, Occupied, Dirty, Maintenance) */}
                                    <div className="w-full flex justify-center pb-0.5">
                                        <span
                                            className={`w-full max-w-[140px] py-1.5 px-4 rounded-full text-xs font-bold text-center shadow-xs transition-transform duration-200 group-hover:scale-105 ${style.badgeBg}`}
                                        >
                                            {style.statusLabel}
                                        </span>
                                    </div>

                                    {/* Floating Hover Tooltip (Section 3 Hover Display) */}
                                    {hoveredRoom?.id === room.id && !activeRoom && (
                                        <div className="absolute z-40 -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2 w-64 p-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl text-left pointer-events-none border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                                                <span className="font-extrabold text-sm text-white">
                                                    {getDisplayRoomTitle(room)}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badgeBg}`}>
                                                    {style.statusLabel}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 text-xs text-slate-300">
                                                <div>Type: <span className="font-semibold text-white">{room.type_name || room.room_type?.name || 'Standard'}</span></div>
                                                <div>Floor: <span className="font-semibold text-white">{room.floor || 'Ground'}</span></div>
                                                <div>Rate: <span className="font-semibold text-emerald-400">{formatTsh(room.base_price_minor || room.room_type?.base_price_minor || 0)}/night</span></div>
                                                {guestName && (
                                                    <div className="text-amber-300 font-bold truncate">
                                                        👤 {guestName}
                                                    </div>
                                                )}
                                                {room.current_check_in && (
                                                    <div>Check-in: <span className="text-white">{formatDate(room.current_check_in)}</span></div>
                                                )}
                                            </div>
                                            <div className="mt-2.5 pt-1.5 border-t border-slate-700 text-[10px] text-slate-400 text-center font-medium">
                                                Click card to view Room Details
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 4. Specifications Pop-Up on Top (Modal Dialog Overlay - Pops On Top, 100% Matching Image 2) */}
            {activeRoom && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
                    onClick={() => setActiveRoom(null)}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header matching Image 2 */}
                        <div className="bg-[#0B192C] px-5 py-4 flex items-center justify-between text-white shrink-0">
                            <h3 className="font-extrabold text-base text-white">Room Details</h3>
                            <button
                                type="button"
                                onClick={() => setActiveRoom(null)}
                                className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Modal Content */}
                        <div className="overflow-y-auto p-5 space-y-4 text-xs">
                            {/* Room Image Banner */}
                            <div className="relative h-48 w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                                <img
                                    src={
                                        activeRoom.room_type?.image_url ||
                                        activeRoom.room_type?.image ||
                                        DEFAULT_ROOM_IMAGE
                                    }
                                    alt={`Room ${activeRoom.room_number}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Title & Badge Row */}
                            <div className="flex items-center justify-between">
                                <h4 className="text-xl font-black text-slate-900">
                                    {getDisplayRoomTitle(activeRoom)}
                                </h4>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        getRoomStyle(activeRoom).badgeBg
                                    }`}
                                >
                                    {getRoomStyle(activeRoom).statusLabel}
                                </span>
                            </div>

                            {/* Info List with Icons (matching Image 2) */}
                            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/90 text-slate-700">
                                <div className="flex items-center gap-2.5">
                                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="font-medium text-slate-500">Guest:</span>
                                    <span className="font-bold text-slate-900 ml-auto">
                                        {activeRoom.current_guest || activeRoom.guest_name || 'No Guest (Vacant)'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="font-medium text-slate-500">Check-in:</span>
                                    <span className="font-bold text-slate-800 ml-auto">
                                        {formatDate(activeRoom.current_check_in)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="font-medium text-slate-500">Check-out:</span>
                                    <span className="font-bold text-slate-800 ml-auto">
                                        {formatDate(activeRoom.current_check_out)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <Bed className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="font-medium text-slate-500">Room Type:</span>
                                    <span className="font-bold text-slate-800 ml-auto">
                                        {activeRoom.type_name || activeRoom.room_type?.name || 'Deluxe Room'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="font-medium text-slate-500">Payment:</span>
                                    <span className="font-bold ml-auto text-emerald-700">
                                        {activeRoom.current_folio_id
                                            ? ((activeRoom.current_folio_balance_minor || 0) > 0
                                                ? `Due: ${formatTsh(activeRoom.current_folio_balance_minor || 0)}`
                                                : 'Paid in Full')
                                            : (activeRoom.status_occupancy === 'occupied' ? 'Paid' : 'Ready')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <DollarSign className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="font-medium text-slate-500">Nightly Rate:</span>
                                    <span className="font-bold text-slate-900 ml-auto">
                                        {formatTsh(activeRoom.base_price_minor || activeRoom.room_type?.base_price_minor || 0)} / night
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <Layers className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span className="font-medium text-slate-500">Floor / Wing:</span>
                                    <span className="font-bold text-slate-800 ml-auto">
                                        {activeRoom.floor || 'Ground Floor'}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-1 space-y-2">
                                {/* Primary Button matching Image 2 "View Details ->" */}
                                {activeRoom.status_occupancy === 'occupied' ? (
                                    activeRoom.current_folio_id ? (
                                        <Link
                                            href={route('folios.show', activeRoom.current_folio_id)}
                                            className="w-full py-3 px-4 bg-[#0B192C] hover:bg-[#1E293B] text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                                        >
                                            <span>View Details & Folio</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    ) : (
                                        <Link
                                            href={route('reservations.checkout')}
                                            className="w-full py-3 px-4 bg-[#0B192C] hover:bg-[#1E293B] text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                                        >
                                            <span>View Details / Check-out</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    )
                                ) : (
                                    <Link
                                        href={route('calendar.index')}
                                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>+ Book Room / Register Guest</span>
                                    </Link>
                                )}

                                {/* Quick Housekeeping Actions */}
                                {onRoomStatusChange && (
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        {activeRoom.status_hk === 'dirty' ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onRoomStatusChange(activeRoom.id, 'clean');
                                                    setActiveRoom({
                                                        ...activeRoom,
                                                        status_hk: 'clean',
                                                    });
                                                }}
                                                className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Mark Clean</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onRoomStatusChange(activeRoom.id, 'dirty');
                                                    setActiveRoom({
                                                        ...activeRoom,
                                                        status_hk: 'dirty',
                                                    });
                                                }}
                                                className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                <span>Mark Dirty</span>
                                            </button>
                                        )}

                                        {activeRoom.status_hk === 'out_of_order' ||
                                        activeRoom.status_hk === 'out_of_service' ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onRoomStatusChange(activeRoom.id, 'clean');
                                                    setActiveRoom({
                                                        ...activeRoom,
                                                        status_hk: 'clean',
                                                    });
                                                }}
                                                className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Return to Service</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onRoomStatusChange(activeRoom.id, 'out_of_order');
                                                    setActiveRoom({
                                                        ...activeRoom,
                                                        status_hk: 'out_of_order',
                                                    });
                                                }}
                                                className="py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <Wrench className="w-3.5 h-3.5 text-rose-600" />
                                                <span>Out of Order</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {onOpenTaskModal && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onOpenTaskModal(activeRoom);
                                            setActiveRoom(null);
                                        }}
                                        className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Assign Cleaning Task</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

                        {/* 5. Request Maintenance Modal */}
            {isMaintenanceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-[#1E3A5F] px-6 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-xs">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-white">Request Room Maintenance</h3>
                                    <p className="text-xs text-slate-300">Report an issue & set room out of service</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMaintenanceModalOpen(false)}
                                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmitMaintenance} className="p-6 space-y-4">
                            {maintenanceSuccess && (
                                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{maintenanceSuccess}</span>
                                </div>
                            )}

                            {/* Room Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Select Room <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={maintenanceRoomId}
                                    onChange={(e) => setMaintenanceRoomId(e.target.value)}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]/20 cursor-pointer"
                                >
                                    <option value="" disabled>-- Select a room --</option>
                                    {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            Room {r.room_number} — {r.type_name || r.room_type?.name || 'Room'} ({r.status_hk.replace('_', ' ')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Issue Category & Priority */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Issue Category
                                    </label>
                                    <select
                                        value={maintenanceCategory}
                                        onChange={(e) => setMaintenanceCategory(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]/20 cursor-pointer"
                                    >
                                        <option value="plumbing">🚰 Plumbing / Water Leak</option>
                                        <option value="ac_hvac">❄️ AC / HVAC Heating</option>
                                        <option value="electrical">⚡ Electrical / Lighting</option>
                                        <option value="lock">🔑 Door Lock / Keycard</option>
                                        <option value="furniture">🪑 Furniture / Bedding</option>
                                        <option value="appliance">📺 TV / Mini-Bar / Safe</option>
                                        <option value="structural">🔨 Structural / Painting</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Priority Level
                                    </label>
                                    <select
                                        value={maintenancePriority}
                                        onChange={(e) => setMaintenancePriority(e.target.value as any)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]/20 cursor-pointer"
                                    >
                                        <option value="normal">Normal (Routine)</option>
                                        <option value="high">High (Needs Today)</option>
                                        <option value="urgent">🚨 Urgent (Immediate / Unsellable)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Status to apply */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Set Room Status To
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                        maintenanceStatusType === 'out_of_order'
                                            ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-2xs'
                                            : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="m_status_type"
                                            value="out_of_order"
                                            checked={maintenanceStatusType === 'out_of_order'}
                                            onChange={() => setMaintenanceStatusType('out_of_order')}
                                            className="text-rose-600 focus:ring-rose-500"
                                        />
                                        <span>Out of Order (OOO)</span>
                                    </label>
                                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                        maintenanceStatusType === 'out_of_service'
                                            ? 'bg-slate-100 border-slate-400 text-slate-900 font-bold shadow-2xs'
                                            : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="m_status_type"
                                            value="out_of_service"
                                            checked={maintenanceStatusType === 'out_of_service'}
                                            onChange={() => setMaintenanceStatusType('out_of_service')}
                                            className="text-slate-700 focus:ring-slate-500"
                                        />
                                        <span>Out of Service (OOS)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Issue Notes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Issue Description & Technician Notes
                                </label>
                                <textarea
                                    value={maintenanceNotes}
                                    onChange={(e) => setMaintenanceNotes(e.target.value)}
                                    placeholder="Describe the issue (e.g. AC leaking water, bathroom faucet loose, TV remote missing)..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]/20"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsMaintenanceModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingMaintenance || !maintenanceRoomId}
                                    className="px-5 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#c29d2b] text-[#1E3A5F] font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 border border-[#c29d2b]"
                                >
                                    <Wrench className="w-4 h-4 text-[#1E3A5F]" />
                                    <span>{submittingMaintenance ? 'Logging...' : 'Submit Maintenance Request'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

