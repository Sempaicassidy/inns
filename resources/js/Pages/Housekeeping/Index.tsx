import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RoomArrangementGrid from '@/Components/RoomArrangementGrid';
import { HousekeepingTask, PageProps, RatePlan, Room, RoomType, User } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    BedDouble,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    DollarSign,
    Edit,
    Eye,
    Filter,
    Layers,
    ListTodo,
    LogOut,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Settings,
    Shield,
    Sparkles,
    Trash2,
    UserCheck,
    Users,
    Utensils,
    Wrench,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface HousekeepingIndexProps extends PageProps {
    rooms: Room[];
    roomTypes?: RoomType[];
    ratePlans?: RatePlan[];
    tasks: HousekeepingTask[];
    housekeepers: User[];
    floors: string[];
    filters: {
        status_hk: string;
        status_occupancy: string;
        floor: string;
        room_type_id: string;
        search: string;
    };
    stats: {
        total: number;
        vacant_clean: number;
        vacant_dirty: number;
        occupied: number;
        clean: number;
        dirty: number;
        inspected: number;
        out_of_service: number;
        pending_tasks: number;
    };
    business_date?: string;
}

export default function HousekeepingIndex({
    rooms = [],
    roomTypes = [],
    ratePlans = [],
    tasks = [],
    housekeepers = [],
    floors = [],
    filters,
    stats,
    business_date,
}: HousekeepingIndexProps) {
    const [viewMode, setViewMode] = useState<'cards' | 'table' | 'queue'>('cards');
    const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>(() => {
        if (filters?.search) return filters.search;
        if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search);
            return p.get('highlight') || '';
        }
        return '';
    });
    const [selectedFloor, setSelectedFloor] = useState<string>(filters?.floor || 'all');
    const [selectedRoomType, setSelectedRoomType] = useState<string>(filters?.room_type_id || 'all');

    const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
    const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
    const [selectedRoomForTask, setSelectedRoomForTask] = useState<Room | null>(null);

    // Rate Plans Management
    const [isRatePlansModalOpen, setIsRatePlansModalOpen] = useState(false);
    const [localRatePlans, setLocalRatePlans] = useState<RatePlan[]>(ratePlans);
    const [isAddPlanInlineOpen, setIsAddPlanInlineOpen] = useState(false);
    const [savingPlan, setSavingPlan] = useState(false);
    const [planError, setPlanError] = useState('');
    const [newPlanForm, setNewPlanForm] = useState({
        name: '',
        meal_plan: 'BB',
        code: '',
        is_resident_only: false,
    });

    useEffect(() => {
        if (ratePlans && ratePlans.length > 0) {
            setLocalRatePlans(ratePlans);
        }
    }, [ratePlans]);

    const handleCreateRatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingPlan(true);
        setPlanError('');

        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(route('rate-plans.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(newPlanForm),
            });

            const json = await res.json();
            if (json.success && json.ratePlan) {
                setLocalRatePlans(prev => [...prev, json.ratePlan]);
                setIsAddPlanInlineOpen(false);
                setNewPlanForm({ name: '', meal_plan: 'BB', code: '', is_resident_only: false });
            } else if (json.errors) {
                const firstErr = Object.values(json.errors)[0];
                setPlanError(Array.isArray(firstErr) ? (firstErr as any)[0] : String(firstErr));
            } else {
                setPlanError(json.message || 'Failed to save rate plan.');
            }
        } catch (err: any) {
            setPlanError(err?.message || 'Network error.');
        } finally {
            setSavingPlan(false);
        }
    };

    // Room Types Management
    const [isRoomTypesModalOpen, setIsRoomTypesModalOpen] = useState(false);
    const [localRoomTypes, setLocalRoomTypes] = useState<RoomType[]>(roomTypes);
    const [isAddRoomTypeOpen, setIsAddRoomTypeOpen] = useState(false);
    const [editingRoomTypeId, setEditingRoomTypeId] = useState<string | null>(null);
    const [savingRoomType, setSavingRoomType] = useState(false);
    const [roomTypeError, setRoomTypeError] = useState('');
    const [roomTypeForm, setRoomTypeForm] = useState({
        name: '',
        code: '',
        base_price: '180000',
        base_occupancy: 2,
        max_adults: 2,
        max_children: 1,
        amenities: ['King Bed', 'Free High-Speed WiFi', 'Air Conditioning', 'En-suite Bathroom'] as string[],
        description: '',
    });

    useEffect(() => {
        if (roomTypes && roomTypes.length > 0) {
            setLocalRoomTypes(roomTypes);
        }
    }, [roomTypes]);

    const availableAmenities = [
        'King Bed',
        'Queen Bed',
        'Twin Beds',
        'En-suite Bathroom',
        'Air Conditioning',
        'Free High-Speed WiFi',
        'Flat Screen TV',
        'Private Balcony / Veranda',
        'Mini Bar / Fridge',
        'Coffee / Tea Maker',
        'Room Safe Box',
        'Scenic Mountain / Garden View',
        'Swimming Pool View',
        'Working Desk & Chair',
        'Solar Hot Water Shower',
    ];

    const handleToggleAmenity = (amenity: string) => {
        setRoomTypeForm(prev => {
            const exists = prev.amenities.includes(amenity);
            if (exists) {
                return { ...prev, amenities: prev.amenities.filter(a => a !== amenity) };
            } else {
                return { ...prev, amenities: [...prev.amenities, amenity] };
            }
        });
    };

    const handleOpenEditRoomType = (rt: RoomType) => {
        setEditingRoomTypeId(rt.id);
        setRoomTypeForm({
            name: rt.name,
            code: rt.code,
            base_price: String((rt.base_price_minor || 0) / 100),
            base_occupancy: rt.base_occupancy || 2,
            max_adults: rt.max_adults || 2,
            max_children: rt.max_children || 1,
            amenities: Array.isArray(rt.amenities) ? rt.amenities : ['King Bed', 'Free High-Speed WiFi'],
            description: rt.description || '',
        });
        setIsAddRoomTypeOpen(true);
    };

    const handleSaveRoomType = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingRoomType(true);
        setRoomTypeError('');

        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const url = editingRoomTypeId
                ? route('room-types.update', editingRoomTypeId)
                : route('room-types.store');
            const method = editingRoomTypeId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(roomTypeForm),
            });

            const json = await res.json();
            if (json.success && json.roomType) {
                if (editingRoomTypeId) {
                    setLocalRoomTypes(prev => prev.map(rt => rt.id === editingRoomTypeId ? json.roomType : rt));
                } else {
                    setLocalRoomTypes(prev => [...prev, json.roomType]);
                }
                setIsAddRoomTypeOpen(false);
                setEditingRoomTypeId(null);
                setRoomTypeForm({
                    name: '',
                    code: '',
                    base_price: '180000',
                    base_occupancy: 2,
                    max_adults: 2,
                    max_children: 1,
                    amenities: ['King Bed', 'Free High-Speed WiFi', 'Air Conditioning', 'En-suite Bathroom'],
                    description: '',
                });
            } else if (json.errors) {
                const firstErr = Object.values(json.errors)[0];
                setRoomTypeError(Array.isArray(firstErr) ? (firstErr as any)[0] : String(firstErr));
            } else {
                setRoomTypeError(json.message || 'Failed to save room type.');
            }
        } catch (err: any) {
            setRoomTypeError(err?.message || 'Network error.');
        } finally {
            setSavingRoomType(false);
        }
    };

    const handleDeleteRoomType = async (rt: RoomType) => {
        if (!confirm(`Are you sure you want to delete or deactivate room type "${rt.name}"?`)) return;

        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(route('room-types.destroy', rt.id), {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const json = await res.json();
            if (json.success) {
                setLocalRoomTypes(prev => prev.filter(item => item.id !== rt.id));
            } else {
                alert(json.message || 'Failed to remove room type.');
            }
        } catch (err: any) {
            alert(err?.message || 'Network error deleting room type.');
        }
    };

    const handleDeleteRoom = (room: Room) => {
        if (room.status_occupancy === 'occupied') {
            alert(`Cannot delete Room "${room.room_number}" because it is currently OCCUPIED. Please check out the guest or reassign them to another room first.`);
            return;
        }

        if (!confirm(`Are you sure you want to permanently delete Room "${room.room_number}" from this lodge? This action will remove the room from the housekeeping list.`)) {
            return;
        }

        router.delete(route('housekeeping.rooms.destroy', room.id), {
            preserveScroll: true,
        });
    };

    // Form for Add Room
    const {
        data: roomFormData,
        setData: setRoomFormData,
        post: postRoom,
        processing: addingRoom,
        reset: resetRoomForm,
    } = useForm({
        room_number: '',
        room_type_id: roomTypes[0]?.id || '',
        floor: 'Ground Floor',
        status_occupancy: 'vacant' as 'vacant' | 'occupied',
        status_hk: 'clean' as 'clean' | 'dirty' | 'inspected' | 'out_of_order',
        features: [] as string[],
    });

    // Form for Cleaning Task Modal
    const {
        data: taskData,
        setData: setTaskData,
        post: postTask,
        processing: creatingTask,
        reset: resetTask,
    } = useForm({
        room_id: rooms[0]?.id || '',
        task_type: 'checkout_clean',
        priority: 'normal',
        assigned_to: housekeepers[0]?.id?.toString() || '',
        notes: '',
    });

    const formatTsh = (amountMinor: number) => {
        const tsh = Math.round(amountMinor / 100);
        return 'TSh ' + tsh.toLocaleString();
    };

    // Quick HK status change
    const handleRoomStatusChange = (roomId: string, newHkStatus: string, newOccupancy?: string) => {
        const payload: Record<string, string> = { status_hk: newHkStatus };
        if (newOccupancy) {
            payload.status_occupancy = newOccupancy;
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            import('@/Services/offlineSync').then(({ default: offlineSync }) => {
                const targetRoom = rooms.find((r) => r.id === roomId);
                offlineSync.queueOfflineAction({
                    url: route('housekeeping.rooms.status', roomId),
                    method: 'POST',
                    data: payload,
                    title: `Update Room ${targetRoom?.room_number || ''} to ${newHkStatus.toUpperCase()}`,
                    module: 'housekeeping',
                });
            });
            return;
        }

        router.post(route('housekeeping.rooms.status', roomId), payload, {
            preserveScroll: true,
            onError: () => {
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    import('@/Services/offlineSync').then(({ default: offlineSync }) => {
                        const targetRoom = rooms.find((r) => r.id === roomId);
                        offlineSync.queueOfflineAction({
                            url: route('housekeeping.rooms.status', roomId),
                            method: 'POST',
                            data: payload,
                            title: `Update Room ${targetRoom?.room_number || ''} to ${newHkStatus.toUpperCase()}`,
                            module: 'housekeeping',
                        });
                    });
                }
            },
        });
    };

    // Task status change
    const handleTaskStatusChange = (taskId: string, newStatus: string) => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            import('@/Services/offlineSync').then(({ default: offlineSync }) => {
                offlineSync.queueOfflineAction({
                    url: route('housekeeping.tasks.status', taskId),
                    method: 'POST',
                    data: { status: newStatus },
                    title: `Housekeeping Task Status: ${newStatus.toUpperCase()}`,
                    module: 'housekeeping',
                });
            });
            return;
        }

        router.post(
            route('housekeeping.tasks.status', taskId),
            { status: newStatus },
            { preserveScroll: true }
        );
    };

    const submitAddRoom = (e: React.FormEvent) => {
        e.preventDefault();
        postRoom(route('housekeeping.rooms.store'), {
            onSuccess: () => {
                setIsAddRoomModalOpen(false);
                resetRoomForm();
            },
        });
    };

    const openTaskModal = (room?: Room) => {
        if (room) {
            setSelectedRoomForTask(room);
            setTaskData('room_id', room.id);
        } else if (rooms.length > 0) {
            setSelectedRoomForTask(rooms[0]);
            setTaskData('room_id', rooms[0].id);
        }
        setIsAssignTaskModalOpen(true);
    };

    // Adapter for RoomArrangementGrid — it passes GridRoomItem, we need Room
    const handleGridTaskModal = (gridRoom: { id: string; [key: string]: any }) => {
        const matched = rooms.find((r) => r.id === gridRoom.id);
        if (matched) {
            openTaskModal(matched);
        } else {
            // Fallback: open modal with just the id set
            setTaskData('room_id', gridRoom.id);
            setIsAssignTaskModalOpen(true);
        }
    };

    const submitTask = (e: React.FormEvent) => {
        e.preventDefault();

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            import('@/Services/offlineSync').then(({ default: offlineSync }) => {
                const targetRoom = rooms.find((r) => r.id === taskData.room_id);
                offlineSync.queueOfflineAction({
                    url: route('housekeeping.tasks.store'),
                    method: 'POST',
                    data: taskData,
                    title: `Assign Cleaning Task: Room ${targetRoom?.room_number || ''}`,
                    module: 'housekeeping',
                });
                setIsAssignTaskModalOpen(false);
                resetTask();
            });
            return;
        }

        postTask(route('housekeeping.tasks.store'), {
            onSuccess: () => {
                setIsAssignTaskModalOpen(false);
                resetTask();
            },
        });
    };

    // Client-side filtering for fast interactive feedback
    const filteredRooms = useMemo(() => {
        return rooms.filter((r) => {
            // Tab filter
            if (selectedStatusTab === 'vacant_clean') {
                if (r.status_occupancy !== 'vacant' || (r.status_hk !== 'clean' && r.status_hk !== 'inspected')) {
                    return false;
                }
            } else if (selectedStatusTab === 'occupied') {
                if (r.status_occupancy !== 'occupied') return false;
            } else if (selectedStatusTab === 'dirty') {
                if (r.status_hk !== 'dirty') return false;
            } else if (selectedStatusTab === 'inspected') {
                if (r.status_hk !== 'inspected') return false;
            } else if (selectedStatusTab === 'out_of_service') {
                if (r.status_hk !== 'out_of_order' && r.status_hk !== 'out_of_service') return false;
            }

            // Floor filter
            if (selectedFloor !== 'all' && r.floor !== selectedFloor) {
                return false;
            }

            // Room Type filter
            if (selectedRoomType !== 'all' && r.room_type_id !== selectedRoomType) {
                return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const numMatch = r.room_number?.toLowerCase().includes(query);
                const typeMatch = r.room_type?.name?.toLowerCase().includes(query);
                const floorMatch = r.floor?.toLowerCase().includes(query);
                const guestMatch = r.current_guest?.toLowerCase().includes(query);
                if (!numMatch && !typeMatch && !floorMatch && !guestMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [rooms, selectedStatusTab, selectedFloor, selectedRoomType, searchQuery]);

    const getHkBadge = (statusHk: string) => {
        switch (statusHk) {
            case 'clean':
                return {
                    label: 'Clean',
                    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    dot: 'bg-emerald-500',
                };
            case 'dirty':
                return {
                    label: 'Dirty / Needs Cleaning',
                    bg: 'bg-amber-50 text-amber-800 border-amber-300',
                    dot: 'bg-amber-500',
                };
            case 'inspected':
                return {
                    label: 'Inspected',
                    bg: 'bg-blue-50 text-blue-700 border-blue-200',
                    dot: 'bg-blue-500',
                };
            case 'out_of_order':
            case 'out_of_service':
                return {
                    label: 'Out of Order',
                    bg: 'bg-rose-50 text-rose-700 border-rose-200',
                    dot: 'bg-rose-500',
                };
            default:
                return {
                    label: statusHk,
                    bg: 'bg-slate-50 text-slate-700 border-slate-200',
                    dot: 'bg-slate-400',
                };
        }
    };

    const getOccupancyBadge = (occ: string) => {
        if (occ === 'occupied') {
            return {
                label: 'Occupied',
                bg: 'bg-sky-100 text-sky-800 border-sky-300 font-bold',
            };
        }
        return {
            label: 'Vacant',
            bg: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
        };
    };

    return (
        <AuthenticatedLayout>
            <Head title="Rooms Overview & Status" />

            <div className="space-y-6 pb-12">
                {/* 1. TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Room Status Overview
                            </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsRoomTypesModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                        >
                            <span>Room Types</span>
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full text-[10px] border border-blue-200/60">
                                {localRoomTypes.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsRatePlansModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                        >
                            <span>Rate Plans & Meal Basis</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200/60">
                                {localRatePlans.length}
                            </span>
                        </button>

                        <button
                            onClick={() => openTaskModal()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                        >
                            <span>Assign Cleaning Task</span>
                        </button>

                        <button
                            onClick={() => setIsAddRoomModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
                        >
                            <span>Add Room</span>
                        </button>
                    </div>
                </div>

                {/* 2. STATS KPI OVERVIEW CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* All Rooms */}
                    <button
                        onClick={() => setSelectedStatusTab('all')}
                        className={`text-left p-3.5 rounded-2xl border transition text-xs ${
                            selectedStatusTab === 'all'
                                ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-200 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block mb-1">All Rooms</span>
                        <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</div>
                    </button>

                    {/* Vacant Clean */}
                    <button
                        onClick={() => setSelectedStatusTab('vacant_clean')}
                        className={`text-left p-3.5 rounded-2xl border transition text-xs ${
                            selectedStatusTab === 'vacant_clean'
                                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-200 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-700 block mb-1">Vacant Clean</span>
                        <div className="text-xl sm:text-2xl font-black text-emerald-700">{stats.vacant_clean}</div>
                    </button>

                    {/* Occupied */}
                    <button
                        onClick={() => setSelectedStatusTab('occupied')}
                        className={`text-left p-3.5 rounded-2xl border transition text-xs ${
                            selectedStatusTab === 'occupied'
                                ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-200 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <span className="font-bold uppercase tracking-wider text-[10px] text-blue-700 block mb-1">Occupied</span>
                        <div className="text-xl sm:text-2xl font-black text-blue-800">{stats.occupied}</div>
                    </button>

                    {/* Dirty */}
                    <button
                        onClick={() => setSelectedStatusTab('dirty')}
                        className={`text-left p-3.5 rounded-2xl border transition text-xs ${
                            selectedStatusTab === 'dirty'
                                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-200 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block mb-1">Dirty</span>
                        <div className="text-xl sm:text-2xl font-black text-amber-700">{stats.dirty}</div>
                    </button>

                    {/* Inspected */}
                    <button
                        onClick={() => setSelectedStatusTab('inspected')}
                        className={`text-left p-3.5 rounded-2xl border transition text-xs ${
                            selectedStatusTab === 'inspected'
                                ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-700 block mb-1">Inspected</span>
                        <div className="text-xl sm:text-2xl font-black text-indigo-800">{stats.inspected}</div>
                    </button>

                    {/* Out of Order */}
                    <button
                        onClick={() => setSelectedStatusTab('out_of_service')}
                        className={`text-left p-3.5 rounded-2xl border transition text-xs ${
                            selectedStatusTab === 'out_of_service'
                                ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-200 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <span className="font-bold uppercase tracking-wider text-[10px] text-rose-700 block mb-1">Out of Order</span>
                        <div className="text-xl sm:text-2xl font-black text-rose-700">{stats.out_of_service}</div>
                    </button>
                </div>

                {/* 3. FILTER BAR & VIEW SELECTOR */}
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Search input */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search room number, guest name, floor, or type..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Middle: Dropdowns for Floor and Room Type */}
                    <div className="flex items-center gap-2">
                        {/* Floor select */}
                        <div className="relative">
                            <select
                                value={selectedFloor}
                                onChange={(e) => setSelectedFloor(e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-3 pr-7 py-2 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
                            >
                                <option value="all">All Floors</option>
                                {floors.map((fl) => (
                                    <option key={fl} value={fl}>
                                        {fl}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Room Type select */}
                        <div className="relative">
                            <select
                                value={selectedRoomType}
                                onChange={(e) => setSelectedRoomType(e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-3 pr-7 py-2 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
                            >
                                <option value="all">All Room Types</option>
                                {roomTypes.map((rt) => (
                                    <option key={rt.id} value={rt.id}>
                                        {rt.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Right: View Toggle (Cards / Table / Queue) */}
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-3 py-1.5 rounded-lg transition ${
                                viewMode === 'cards'
                                    ? 'bg-white text-sky-800 shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Cards
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 rounded-lg transition ${
                                viewMode === 'table'
                                    ? 'bg-white text-sky-800 shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Table
                        </button>
                        <button
                            onClick={() => setViewMode('queue')}
                            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                                viewMode === 'queue'
                                    ? 'bg-white text-sky-800 shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>Cleaning Queue</span>
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black">
                                {tasks.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* 4. MAIN CONTENT AREA */}
                {viewMode === 'queue' ? (
                    /* HOUSEKEEPING TASKS QUEUE */
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Housekeeping Cleaning Queue
                                </h2>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    Assigned Room Tasks & Inspection Queue
                                </span>
                            </div>
                            <button
                                onClick={() => openTaskModal()}
                                className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold transition"
                            >
                                + New Task
                            </button>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-60" />
                                <p className="text-sm font-bold text-slate-700">Cleaning Queue Empty</p>
                                <span className="text-xs text-slate-400 font-medium">All rooms cleaned and up to date</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="py-3 px-4">Room</th>
                                            <th className="py-3 px-4">Cleaning Type</th>
                                            <th className="py-3 px-4">Priority</th>
                                            <th className="py-3 px-4">Assigned Housekeeper</th>
                                            <th className="py-3 px-4">Notes</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tasks.map((task) => {
                                            const roomNum = task.room?.room_number || 'Room';
                                            const typeName = task.room?.room_type?.name || '';
                                            return (
                                                <tr key={task.id} className="hover:bg-slate-50/60 transition">
                                                    <td className="py-3 px-4 font-bold text-slate-900">
                                                        <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200 text-slate-800">
                                                            {roomNum}
                                                        </span>
                                                        <span className="block text-[10px] text-slate-400 mt-0.5">
                                                            {typeName}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-medium capitalize text-slate-700">
                                                        {task.task_type?.replace('_', ' ')}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                task.priority === 'urgent'
                                                                    ? 'bg-rose-100 text-rose-800'
                                                                    : task.priority === 'high'
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}
                                                        >
                                                            {task.priority?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-slate-800">
                                                        {task.assignee?.name || (
                                                            <span className="text-slate-400 italic">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                                                        {task.notes || '-'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                                                            {task.status?.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right space-x-1.5">
                                                        <button
                                                            onClick={() => handleTaskStatusChange(task.id, 'completed')}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shadow-2xs"
                                                            title="Mark Complete"
                                                        >
                                                            ✓ Complete
                                                        </button>
                                                        <button
                                                            onClick={() => handleTaskStatusChange(task.id, 'inspected')}
                                                            className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-bold text-[11px] transition"
                                                            title="Inspect"
                                                        >
                                                            Inspect
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
                ) : viewMode === 'cards' ? (
                    <RoomArrangementGrid
                        rooms={rooms}
                        businessDate={business_date}
                        floors={floors}
                        onRoomStatusChange={handleRoomStatusChange}
                        onOpenTaskModal={handleGridTaskModal}
                        mode="housekeeping"
                        title="Rooms Arrangement & Availability"
                    />
                ) : (
                    /* TABLE VIEW */
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-4">Room & Floor</th>
                                        <th className="py-3 px-4">Room Type</th>
                                        <th className="py-3 px-4">Nightly Rate</th>
                                        <th className="py-3 px-4">Occupancy</th>
                                        <th className="py-3 px-4">Housekeeping</th>
                                        <th className="py-3 px-4">In-House Guest</th>
                                        <th className="py-3 px-4">Stay Dates</th>
                                        <th className="py-3 px-4">Assigned Housekeeper</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRooms.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-10 text-center text-slate-400">
                                                No rooms found matching filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRooms.map((room) => {
                                            const hkBadge = getHkBadge(room.status_hk);
                                            const occBadge = getOccupancyBadge(room.status_occupancy);
                                            const isOccupied = room.status_occupancy === 'occupied';
                                            const isDirty = room.status_hk === 'dirty';
                                            const priceMinor = room.room_type?.base_price_minor || 0;

                                            return (
                                                <tr
                                                    key={room.id}
                                                    id={`room-row-${room.room_number}`}
                                                    data-highlightable="true"
                                                    className="hover:bg-slate-50/70 transition"
                                                >
                                                    <td className="py-3 px-4 font-bold text-slate-900">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-900 font-extrabold">
                                                                {room.room_number}
                                                            </span>
                                                            <span className="text-[11px] text-slate-500 font-medium">
                                                                {room.floor}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-slate-800">
                                                        {room.room_type?.name || 'Standard'}
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-900">
                                                        {formatTsh(priceMinor)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${occBadge.bg}`}
                                                        >
                                                            {occBadge.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border font-bold ${hkBadge.bg}`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${hkBadge.dot}`} />
                                                            <span>{hkBadge.label}</span>
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {isOccupied ? (
                                                            <div>
                                                                <span className="font-bold text-slate-900 block">
                                                                    {room.current_guest || 'Guest'}
                                                                </span>
                                                                {room.current_guest_phone && (
                                                                    <span className="text-[10px] text-slate-400">
                                                                        {room.current_guest_phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Vacant</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-[11px] text-slate-600">
                                                        {isOccupied && room.current_check_in ? (
                                                            <span>
                                                                {room.current_check_in} &rarr; {room.current_check_out || 'N/A'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {room.active_task ? (
                                                            <span className="text-[11px] font-bold text-amber-800">
                                                                {room.active_task.assigned_to_name} (
                                                                {room.active_task.task_type.replace('_', ' ')})
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-[11px]">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                                                        {isDirty ? (
                                                            <button
                                                                onClick={() => handleRoomStatusChange(room.id, 'clean')}
                                                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-2xs transition"
                                                            >
                                                                Mark Clean
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleRoomStatusChange(room.id, 'dirty')}
                                                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md text-[11px] font-bold transition"
                                                            >
                                                                Mark Dirty
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openTaskModal(room)}
                                                            className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 rounded-md text-[11px] font-bold transition"
                                                        >
                                                            Assign Task
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRoom(room)}
                                                            title={`Delete Room ${room.room_number}`}
                                                            className="p-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-md text-[11px] font-bold transition inline-flex items-center cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
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
            </div>

            {/* MODAL: ASSIGN HOUSEKEEPING TASK */}
            {isAssignTaskModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Assign Housekeeping Task
                                </h3>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    Room Cleaning Assignment
                                </span>
                            </div>
                            <button
                                onClick={() => setIsAssignTaskModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitTask} className="space-y-4 mt-4 text-xs">
                            {/* Room Selection */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Select Room</label>
                                <select
                                    value={taskData.room_id}
                                    onChange={(e) => setTaskData('room_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                >
                                    {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            Room {r.room_number} - {r.room_type?.name} ({r.floor})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Task Type */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Cleaning Type</label>
                                <select
                                    value={taskData.task_type}
                                    onChange={(e) => setTaskData('task_type', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                >
                                    <option value="checkout_clean">Checkout Clean</option>
                                    <option value="stayover_clean">Stayover Clean</option>
                                    <option value="deep_clean">Deep Clean</option>
                                    <option value="inspection">Supervisor Inspection</option>
                                    <option value="touchup">Touchup</option>
                                </select>
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Assigned Housekeeper / Staff
                                </label>
                                <select
                                    value={taskData.assigned_to}
                                    onChange={(e) => setTaskData('assigned_to', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                >
                                    <option value="">-- Select Staff Member --</option>
                                    {housekeepers.map((hk) => (
                                        <option key={hk.id} value={hk.id}>
                                            {hk.name} ({hk.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Priority</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['normal', 'high', 'urgent'] as const).map((p) => (
                                        <button
                                            type="button"
                                            key={p}
                                            onClick={() => setTaskData('priority', p)}
                                            className={`py-2 rounded-xl border text-center capitalize font-bold transition ${
                                                taskData.priority === p
                                                    ? p === 'urgent'
                                                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                                                        : p === 'high'
                                                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                                        : 'bg-sky-600 text-white border-sky-700 shadow-xs'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Instructions / Notes</label>
                                <textarea
                                    value={taskData.notes}
                                    onChange={(e) => setTaskData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="e.g. Change linens, replace amenities..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignTaskModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingTask}
                                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50"
                                >
                                    {creatingTask ? 'Saving...' : 'Save Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD NEW ROOM */}
            {isAddRoomModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#1E3A5F]/5 to-transparent">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Add New Room</h3>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Register Room Inventory</span>
                            </div>
                            <button onClick={() => setIsAddRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row">
                            {/* LEFT: Form */}
                            <form onSubmit={submitAddRoom} className="flex-1 p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
                                {/* Room Number */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Room Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={roomFormData.room_number}
                                        onChange={(e) => setRoomFormData('room_number', e.target.value)}
                                        placeholder="e.g. 101, 204, Suite 1..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    />
                                </div>

                                {/* Room Type */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block font-bold text-slate-700">Room Type *</label>
                                        <button
                                            type="button"
                                            onClick={() => { setIsAddRoomModalOpen(false); setIsRoomTypesModalOpen(true); setIsAddRoomTypeOpen(true); }}
                                            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                                        >
                                            + Add New Type
                                        </button>
                                    </div>
                                    <select
                                        value={roomFormData.room_type_id}
                                        onChange={(e) => setRoomFormData('room_type_id', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    >
                                        {localRoomTypes.length === 0 ? (
                                            <option value="">No room types found - Click &apos;+ Add New Type&apos;</option>
                                        ) : (
                                            localRoomTypes.map((rt) => (
                                                <option key={rt.id} value={rt.id}>
                                                    {rt.name} - ({formatTsh(rt.base_price_minor)})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                {/* Floor */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Floor / Wing</label>
                                    <input
                                        type="text"
                                        value={roomFormData.floor}
                                        onChange={(e) => setRoomFormData('floor', e.target.value)}
                                        placeholder="e.g. Ground Floor, 1st Floor, Wing B..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                    />
                                </div>

                                {/* Status */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Occupancy</label>
                                        <select
                                            value={roomFormData.status_occupancy}
                                            onChange={(e) => setRoomFormData('status_occupancy', e.target.value as 'vacant' | 'occupied')}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        >
                                            <option value="vacant">Vacant</option>
                                            <option value="occupied">Occupied</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">HK Status</label>
                                        <select
                                            value={roomFormData.status_hk}
                                            onChange={(e) => setRoomFormData('status_hk', e.target.value as 'clean' | 'dirty' | 'inspected' | 'out_of_order')}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        >
                                            <option value="clean">Clean</option>
                                            <option value="dirty">Dirty</option>
                                            <option value="inspected">Inspected</option>
                                            <option value="out_of_order">Out of Order</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Room-Specific Features */}
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1.5">Room-Specific Features</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['Non-Smoking', 'Connecting Room', 'Accessible', 'Corner Room', 'Pool View', 'Garden View', 'Sea View', 'Mountain View', 'City View', 'High Floor', 'Ground Floor Room', 'Quiet Room'].map((feat) => {
                                            const currentFeatures = Array.isArray(roomFormData.features) ? roomFormData.features as string[] : [];
                                            const selected = currentFeatures.includes(feat);
                                            return (
                                                <button
                                                    key={feat}
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = selected
                                                            ? currentFeatures.filter((f) => f !== feat)
                                                            : [...currentFeatures, feat];
                                                        setRoomFormData('features', updated);
                                                    }}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                                                        selected
                                                            ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] shadow-2xs'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <span>{selected ? '✓' : '+'}</span>
                                                    <span>{feat}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-2 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddRoomModalOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addingRoom}
                                        className="px-5 py-2 bg-[#1E3A5F] hover:bg-[#152a45] text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50"
                                    >
                                        {addingRoom ? 'Saving...' : 'Add Room'}
                                    </button>
                                </div>
                            </form>

                            {/* RIGHT: Live Preview Card */}
                            <div className="md:w-64 shrink-0 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-5 flex flex-col gap-3">
                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Card Preview</div>

                                {/* Preview card mimicking the grid tile */}
                                {(() => {
                                    const isOcc = roomFormData.status_occupancy === 'occupied';
                                    const isDirty = roomFormData.status_hk === 'dirty';
                                    const isMaint = roomFormData.status_hk === 'out_of_order';
                                    const isInspected = roomFormData.status_hk === 'inspected';
                                    const selectedRt = localRoomTypes.find(rt => rt.id === roomFormData.room_type_id);

                                    const cardBg = isOcc ? 'bg-[#fff1f2]' : isMaint ? 'bg-[#f8fafc]' : isDirty ? 'bg-[#fffbeb]' : 'bg-[#ecfdf5]';
                                    const cardBorder = isOcc ? 'border-[#fecdd3]' : isMaint ? 'border-[#cbd5e1]' : isDirty ? 'border-[#fde68a]' : 'border-[#a7f3d0]';
                                    const badgeBg = isOcc ? 'bg-[#f43f5e] text-white' : isMaint ? 'bg-[#64748b] text-white' : isDirty ? 'bg-[#f59e0b] text-white' : 'bg-[#22c55e] text-white';
                                    const statusLabel = isOcc ? 'Occupied' : isMaint ? 'Maintenance' : isDirty ? 'Dirty' : isInspected ? 'Inspected' : 'Available';
                                    const iconColor = isOcc ? 'text-[#be123c]' : isMaint ? 'text-[#475569]' : isDirty ? 'text-[#b45309]' : 'text-[#065f46]';
                                    const numberColor = isOcc ? 'text-[#881337]' : isMaint ? 'text-[#1e293b]' : isDirty ? 'text-[#78350f]' : 'text-[#064e3b]';
                                    const currentFeatures = Array.isArray(roomFormData.features) ? roomFormData.features as string[] : [];

                                    return (
                                        <div className={`rounded-2xl p-4 border-2 flex flex-col items-center gap-2 min-h-[160px] justify-between ${cardBg} ${cardBorder} shadow-sm`}>
                                            <BedDouble className={`w-7 h-7 ${iconColor}`} />
                                            <div className="text-center">
                                                <span className={`text-2xl font-black tracking-tight ${numberColor}`}>
                                                    {roomFormData.room_number || '—'}
                                                </span>
                                                <span className="block text-[10px] font-semibold text-slate-500 truncate max-w-[130px]">
                                                    {selectedRt?.name || 'Select Room Type'}
                                                </span>
                                                {roomFormData.floor && (
                                                    <span className="block text-[9px] text-slate-400">{roomFormData.floor}</span>
                                                )}
                                                {/* Features micro-badges */}
                                                {currentFeatures.length > 0 && (
                                                    <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                                                        {currentFeatures.slice(0, 2).map((f, i) => (
                                                            <span key={i} className="px-1 py-0.5 rounded text-[8px] font-bold bg-white/70 text-slate-600 border border-slate-200/80 leading-none">
                                                                {f.length > 7 ? f.slice(0, 6) + '…' : f}
                                                            </span>
                                                        ))}
                                                        {currentFeatures.length > 2 && (
                                                            <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-white/70 text-slate-500 border border-slate-200/80 leading-none">
                                                                +{currentFeatures.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Amenities from selected type */}
                                                {selectedRt && Array.isArray(selectedRt.amenities) && selectedRt.amenities.length > 0 && (
                                                    <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                                                        {selectedRt.amenities.slice(0, 2).map((a, i) => (
                                                            <span key={i} className="px-1 py-0.5 rounded text-[8px] font-bold bg-white/60 text-[#1E3A5F] border border-[#1E3A5F]/20 leading-none">
                                                                {a.length > 6 ? a.slice(0, 5) + '…' : a}
                                                            </span>
                                                        ))}
                                                        {selectedRt.amenities.length > 2 && (
                                                            <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-white/60 text-slate-500 border border-slate-200/80 leading-none">
                                                                +{selectedRt.amenities.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-2xs ${badgeBg}`}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                    );
                                })()}

                                {/* Selected type details */}
                                {(() => {
                                    const rt = localRoomTypes.find(r => r.id === roomFormData.room_type_id);
                                    if (!rt) return null;
                                    return (
                                        <div className="text-[11px] space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 font-semibold">Nightly Rate</span>
                                                <span className="font-extrabold text-[#1E3A5F]">{formatTsh(rt.base_price_minor)}</span>
                                            </div>
                                            {(rt.max_adults || rt.base_occupancy) && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500 font-semibold">Capacity</span>
                                                    <span className="font-bold text-slate-700">👥 {rt.max_adults || rt.base_occupancy} Guests</span>
                                                </div>
                                            )}
                                            {Array.isArray(rt.amenities) && rt.amenities.length > 0 && (
                                                <div>
                                                    <span className="text-slate-500 font-semibold block mb-1">Type Amenities:</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {rt.amenities.slice(0, 5).map((a, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 rounded bg-[#1E3A5F]/8 text-[#1E3A5F] text-[9px] font-semibold border border-[#1E3A5F]/15">
                                                                {a}
                                                            </span>
                                                        ))}
                                                        {rt.amenities.length > 5 && (
                                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px]">+{rt.amenities.length - 5}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {rt.description && (
                                                <p className="text-slate-400 italic text-[10px] line-clamp-3">{rt.description}</p>
                                            )}
                                        </div>
                                    );
                                })()}

                                <div className="text-[10px] text-slate-400 text-center mt-auto pt-2 border-t border-slate-200">
                                    Card updates live as you fill the form
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Rate Plans & Meal Basis Management Modal */}
            {isRatePlansModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                    <Utensils className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Hotel Rate Plans & Meal Basis</h3>
                                    
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRatePlansModalOpen(false);
                                    setIsAddPlanInlineOpen(false);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Active Pricing Plans ({localRatePlans.length})</h4>
                                    
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddPlanInlineOpen(!isAddPlanInlineOpen)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{isAddPlanInlineOpen ? 'Cancel' : 'Add New Rate Plan'}</span>
                                </button>
                            </div>

                            {/* Inline Add Rate Plan Form */}
                            {isAddPlanInlineOpen && (
                                <form onSubmit={handleCreateRatePlan} className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3 animate-in fade-in duration-150">
                                    <h5 className="font-bold text-emerald-900 text-xs">Create New Rate Plan</h5>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Rate Plan Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newPlanForm.name}
                                            onChange={e => setNewPlanForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g. Bed & Breakfast Standard, Full Board Safari..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">Meal Basis *</label>
                                            <select
                                                value={newPlanForm.meal_plan}
                                                onChange={e => setNewPlanForm(prev => ({ ...prev, meal_plan: e.target.value }))}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                                            >
                                                <option value="BB">BB - Bed & Breakfast</option>
                                                <option value="HB">HB - Half Board (Breakfast & Dinner)</option>
                                                <option value="FB">FB - Full Board (All 3 Meals)</option>
                                                <option value="RO">RO - Room Only (European Plan)</option>
                                                <option value="AI">AI - All Inclusive Package</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">Code (Optional)</label>
                                            <input
                                                type="text"
                                                value={newPlanForm.code}
                                                onChange={e => setNewPlanForm(prev => ({ ...prev, code: e.target.value }))}
                                                placeholder="e.g. BB-STD"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase"
                                            />
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                                        <input
                                            type="checkbox"
                                            checked={newPlanForm.is_resident_only}
                                            onChange={e => setNewPlanForm(prev => ({ ...prev, is_resident_only: e.target.checked }))}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                        />
                                        <span className="font-semibold text-slate-700">East African / Tanzania Resident Only</span>
                                    </label>
                                    {planError && (
                                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                                            {planError}
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddPlanInlineOpen(false)}
                                            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={savingPlan}
                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                                        >
                                            {savingPlan ? 'Saving...' : 'Save Rate Plan'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Rate Plans List */}
                            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                                {localRatePlans.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400">
                                        No rate plans found. Click 'Add New Rate Plan' above to configure one.
                                    </div>
                                ) : (
                                    localRatePlans.map(rp => (
                                        <div key={rp.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 font-bold font-mono text-xs flex items-center justify-center text-slate-700 shrink-0">
                                                    {rp.meal_plan}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                                        <span>{rp.name}</span>
                                                        <span className="font-mono text-[10px] text-slate-400">({rp.code})</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                                        <span>
                                                            {rp.meal_plan === 'RO' && 'Accommodation Only (No meals)'}
                                                            {rp.meal_plan === 'BB' && 'Bed & Breakfast (Daily breakfast included)'}
                                                            {rp.meal_plan === 'HB' && 'Half Board (Breakfast & Dinner included)'}
                                                            {rp.meal_plan === 'FB' && 'Full Board (Breakfast, Lunch & Dinner)'}
                                                            {rp.meal_plan === 'AI' && 'All Inclusive (All Meals & Beverages)'}
                                                        </span>
                                                        {rp.is_resident_only && (
                                                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200/60 text-[10px]">
                                                                Resident Special
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100">
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsRatePlansModalOpen(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Room Types Management Modal */}
            {isRoomTypesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <BedDouble className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Hotel Room Types & Pricing</h3>
                                    
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRoomTypesModalOpen(false);
                                    setIsAddRoomTypeOpen(false);
                                    setEditingRoomTypeId(null);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Active Room Types ({localRoomTypes.length})</h4>
                                    
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingRoomTypeId(null);
                                        setRoomTypeForm({
                                            name: '',
                                            code: '',
                                            base_price: '180000',
                                            base_occupancy: 2,
                                            max_adults: 2,
                                            max_children: 1,
                                            amenities: ['King Bed', 'Free High-Speed WiFi', 'Air Conditioning', 'En-suite Bathroom'],
                                            description: '',
                                        });
                                        setIsAddRoomTypeOpen(!isAddRoomTypeOpen);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{isAddRoomTypeOpen ? 'Close Form' : 'Add New Room Type'}</span>
                                </button>
                            </div>

                            {/* Inline Add/Edit Room Type Form */}
                            {isAddRoomTypeOpen && (
                                <form onSubmit={handleSaveRoomType} className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4 animate-in fade-in duration-150">
                                    <div className="flex items-center justify-between">
                                        <h5 className="font-bold text-blue-900 text-xs sm:text-sm">
                                            {editingRoomTypeId ? 'Edit Room Type' : 'Create New Room Type'}
                                        </h5>
                                        <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                                            Pricing & Inventory Setup
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">
                                                Room Type Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={roomTypeForm.name}
                                                onChange={e => setRoomTypeForm(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="e.g. Deluxe Ocean Suite, Executive Cottage..."
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">
                                                Type Code (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={roomTypeForm.code}
                                                onChange={e => setRoomTypeForm(prev => ({ ...prev, code: e.target.value }))}
                                                placeholder="e.g. DLX, EXEC, VILLA"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">
                                                Standard Base Rate per Night (TZS) *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                step="1000"
                                                value={roomTypeForm.base_price}
                                                onChange={e => setRoomTypeForm(prev => ({ ...prev, base_price: e.target.value }))}
                                                placeholder="180000"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                                                    Base Occ.
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={roomTypeForm.base_occupancy}
                                                    onChange={e => setRoomTypeForm(prev => ({ ...prev, base_occupancy: Number(e.target.value) }))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-center font-bold text-slate-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                                                    Max Adults
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={roomTypeForm.max_adults}
                                                    onChange={e => setRoomTypeForm(prev => ({ ...prev, max_adults: Number(e.target.value) }))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-center font-bold text-slate-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                                                    Max Kids
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={roomTypeForm.max_children}
                                                    onChange={e => setRoomTypeForm(prev => ({ ...prev, max_children: Number(e.target.value) }))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-center font-bold text-slate-900"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selectable Amenities */}
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1.5">
                                            Room Amenities & Features
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {availableAmenities.map(amenity => {
                                                const selected = roomTypeForm.amenities.includes(amenity);
                                                return (
                                                    <button
                                                        key={amenity}
                                                        type="button"
                                                        onClick={() => handleToggleAmenity(amenity)}
                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                                                            selected
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <span>{selected ? '✓' : '+'}</span>
                                                        <span>{amenity}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">
                                            Description / Guest Overview
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={roomTypeForm.description}
                                            onChange={e => setRoomTypeForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Overview of room aesthetics, balcony views, and special features..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    {roomTypeError && (
                                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                                            {roomTypeError}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-1 border-t border-blue-200/60">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddRoomTypeOpen(false);
                                                setEditingRoomTypeId(null);
                                            }}
                                            className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={savingRoomType}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                                        >
                                            {savingRoomType ? 'Saving...' : (editingRoomTypeId ? 'Update Room Type' : 'Save Room Type')}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Room Types Cards List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {localRoomTypes.length === 0 ? (
                                    <div className="col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        No room types configured. Click 'Add New Room Type' above to get started.
                                    </div>
                                ) : (
                                    localRoomTypes.map(rt => {
                                        const count = (rt as any).rooms_count !== undefined
                                            ? (rt as any).rooms_count
                                            : rooms.filter(r => String(r.room_type_id) === String(rt.id)).length;
                                        return (
                                            <div
                                                key={rt.id}
                                                className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition flex flex-col justify-between gap-3"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h5 className="font-bold text-slate-900 text-sm">
                                                                    {rt.name}
                                                                </h5>
                                                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                                                    {rt.code}
                                                                </span>
                                                            </div>
                                                            <div className="text-emerald-700 font-extrabold text-sm mt-1">
                                                                {formatTsh(rt.base_price_minor)}
                                                                <span className="text-[11px] font-normal text-slate-400 ml-1">/ night</span>
                                                            </div>
                                                        </div>

                                                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-100 shrink-0">
                                                            {count} Room{count !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>Base: {rt.base_occupancy || 2} | Max: {rt.max_adults || 2} Adults, {rt.max_children || 1} Kids</span>
                                                        </span>
                                                    </div>

                                                    {rt.description && (
                                                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                                                            {rt.description}
                                                        </p>
                                                    )}

                                                    {Array.isArray(rt.amenities) && rt.amenities.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2.5">
                                                            {rt.amenities.slice(0, 4).map((a, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 text-[10px] border border-slate-100"
                                                                >
                                                                    {a}
                                                                </span>
                                                            ))}
                                                            {rt.amenities.length > 4 && (
                                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                                                                    +{rt.amenities.length - 4} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditRoomType(rt)}
                                                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRoomType(rt)}
                                                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRoomTypesModalOpen(false);
                                    setIsAddRoomTypeOpen(false);
                                    setEditingRoomTypeId(null);
                                }}
                                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
