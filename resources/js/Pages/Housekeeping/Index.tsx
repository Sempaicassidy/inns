import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { HousekeepingTask, PageProps, Room, RoomType, User } from '@/types';
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
    Eye,
    Filter,
    Layers,
    ListTodo,
    LogOut,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Sparkles,
    UserCheck,
    Users,
    Wrench,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface HousekeepingIndexProps extends PageProps {
    rooms: Room[];
    roomTypes?: RoomType[];
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
        status_occupancy: 'vacant',
        status_hk: 'clean',
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
        router.post(route('housekeeping.rooms.status', roomId), payload, {
            preserveScroll: true,
        });
    };

    // Task status change
    const handleTaskStatusChange = (taskId: string, newStatus: string) => {
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

    const submitTask = (e: React.FormEvent) => {
        e.preventDefault();
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
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Room Status Overview
                            </h1>
                            <span className="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold rounded-full">
                                Housekeeping & Occupancy
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                            <span>Room Inventory</span>
                            <span>•</span>
                            <span>Housekeeping Status</span>
                            <span>•</span>
                            <span>In-House Guests</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => openTaskModal()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95"
                        >
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Assign Cleaning Task</span>
                        </button>

                        <button
                            onClick={() => setIsAddRoomModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
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
                        <div className="flex items-center justify-between text-slate-500 mb-1">
                            <span className="font-bold uppercase tracking-wider text-[10px]">All Rooms</span>
                            <BedDouble className="w-4 h-4 text-sky-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Total Inventory</div>
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
                        <div className="flex items-center justify-between text-emerald-700 mb-1">
                            <span className="font-bold uppercase tracking-wider text-[10px]">Vacant Clean</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-emerald-700">{stats.vacant_clean}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Ready for Check-In</div>
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
                        <div className="flex items-center justify-between text-blue-700 mb-1">
                            <span className="font-bold uppercase tracking-wider text-[10px]">Occupied</span>
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-blue-800">{stats.occupied}</div>
                        <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                            {stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0}% Occupancy
                        </div>
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
                        <div className="flex items-center justify-between text-amber-800 mb-1">
                            <span className="font-bold uppercase tracking-wider text-[10px]">Dirty</span>
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-amber-700">{stats.dirty}</div>
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Cleaning Queue</div>
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
                        <div className="flex items-center justify-between text-indigo-700 mb-1">
                            <span className="font-bold uppercase tracking-wider text-[10px]">Inspected</span>
                            <Shield className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-indigo-800">{stats.inspected}</div>
                        <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">Supervisor Verified</div>
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
                        <div className="flex items-center justify-between text-rose-700 mb-1">
                            <span className="font-bold uppercase tracking-wider text-[10px]">Out of Order</span>
                            <Wrench className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-rose-700">{stats.out_of_service}</div>
                        <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Under Maintenance</div>
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
                    /* CARDS VIEW */
                    <div>
                        {filteredRooms.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                                <BedDouble className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="font-bold text-slate-700">No rooms matched search</p>
                                <span className="text-xs text-slate-400">Try adjusting your filters or search keywords</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredRooms.map((room) => {
                                    const hkBadge = getHkBadge(room.status_hk);
                                    const occBadge = getOccupancyBadge(room.status_occupancy);
                                    const priceMinor = room.room_type?.base_price_minor || 0;
                                    const isOccupied = room.status_occupancy === 'occupied';
                                    const isClean = room.status_hk === 'clean' || room.status_hk === 'inspected';
                                    const isDirty = room.status_hk === 'dirty';
                                    const isOutOfOrder = room.status_hk === 'out_of_order' || room.status_hk === 'out_of_service';

                                    return (
                                        <div
                                            key={room.id}
                                            id={`room-${room.room_number}`}
                                            data-highlightable="true"
                                            className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                                                isOccupied
                                                    ? 'border-sky-200/90 ring-1 ring-sky-100'
                                                    : isDirty
                                                    ? 'border-amber-200 ring-1 ring-amber-100'
                                                    : 'border-slate-200/90'
                                            }`}
                                        >
                                            {/* TOP ROOM CARD HEADER */}
                                            <div className="p-4 border-b border-slate-100">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-black text-slate-900 tracking-tight">
                                                                Room {room.room_number}
                                                            </span>
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                                                {room.floor}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-semibold text-sky-800 block mt-0.5">
                                                            {room.room_type?.name || 'Standard Unit'}
                                                        </span>
                                                    </div>

                                                    {/* Price Tag */}
                                                    <div className="text-right">
                                                        <span className="text-xs font-bold text-slate-900 block">
                                                            {formatTsh(priceMinor)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-semibold">per night</span>
                                                    </div>
                                                </div>

                                                {/* STATUS PILLS */}
                                                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] border ${occBadge.bg}`}
                                                    >
                                                        <span>{occBadge.label}</span>
                                                    </span>

                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${hkBadge.bg}`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${hkBadge.dot}`} />
                                                        <span>{hkBadge.label}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* MIDDLE BODY: GUEST OR AVAILABILITY INFO */}
                                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-slate-50/40">
                                                {isOccupied ? (
                                                    /* OCCUPIED DETAILS BOX */
                                                    <div className="bg-sky-50/60 rounded-xl p-3 border border-sky-100 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                                                                <UserCheck className="w-3 h-3" /> In-House Guest:
                                                            </span>
                                                            {room.is_due_out && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-extrabold">
                                                                    Due Out
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <h4 className="text-xs font-bold text-slate-900">
                                                                {room.current_guest || 'Occupant'}
                                                            </h4>
                                                            {room.current_guest_phone && (
                                                                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                                    {room.current_guest_phone}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Dates */}
                                                        <div className="pt-1 border-t border-sky-100/80 flex items-center justify-between text-[10px] text-slate-600">
                                                            <div>
                                                                <span className="text-slate-400 block font-medium">Arrival:</span>
                                                                <span className="font-semibold text-slate-800">
                                                                    {room.current_check_in || '-'}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-slate-400 block font-medium">Departure:</span>
                                                                <span className="font-semibold text-slate-800">
                                                                    {room.current_check_out || '-'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Folio info link */}
                                                        {room.current_folio_id && (
                                                            <div className="pt-1 border-t border-sky-100/80 flex items-center justify-between text-[10px]">
                                                                <span className="text-slate-500">
                                                                    Balance: <strong className="text-rose-600">{formatTsh(room.current_folio_balance_minor || 0)}</strong>
                                                                </span>
                                                                <Link
                                                                    href={route('folios.show', room.current_folio_id)}
                                                                    className="font-bold text-sky-700 hover:text-sky-900 underline"
                                                                >
                                                                    Folio Ledger &rarr;
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* VACANT DETAILS BOX */
                                                    <div className="bg-white rounded-xl p-3 border border-slate-100 flex flex-col justify-center space-y-2">
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                            {isClean ? (
                                                                <>
                                                                    <Check className="w-4 h-4 text-emerald-500" />
                                                                    <span className="text-emerald-700 font-bold">Ready for Occupancy</span>
                                                                </>
                                                            ) : isDirty ? (
                                                                <>
                                                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                                                    <span className="text-amber-800 font-bold">Cleaning Pending</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Wrench className="w-4 h-4 text-rose-500" />
                                                                    <span className="text-rose-700 font-bold">Maintenance Block</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {isClean && (
                                                            <Link
                                                                href={route('calendar.index')}
                                                                className="text-center py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition"
                                                            >
                                                                + Book Room
                                                            </Link>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ACTIVE TASK BADGE IF ASSIGNED */}
                                                {room.active_task && (
                                                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex items-center justify-between">
                                                        <div>
                                                            <span className="text-[9px] font-bold text-amber-800 uppercase block">
                                                                Housekeeper Assigned:
                                                            </span>
                                                            <span className="font-bold text-slate-800 text-[11px]">
                                                                {room.active_task.assigned_to_name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 block capitalize font-medium">
                                                                {room.active_task.task_type.replace('_', ' ')} • {room.active_task.priority}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleTaskStatusChange(room.active_task!.id, 'completed')}
                                                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold shadow-2xs transition"
                                                        >
                                                            Complete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* BOTTOM ACTION BAR */}
                                            <div className="p-3 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-1.5">
                                                {/* Toggle HK Status button */}
                                                <div className="flex items-center gap-1">
                                                    {isDirty ? (
                                                        <button
                                                            onClick={() => handleRoomStatusChange(room.id, 'clean')}
                                                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition active:scale-95 flex items-center gap-1"
                                                            title="Mark Clean"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                            <span>Mark Clean</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRoomStatusChange(room.id, 'dirty')}
                                                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition active:scale-95 flex items-center gap-1"
                                                            title="Mark Dirty"
                                                        >
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            <span>Mark Dirty</span>
                                                        </button>
                                                    )}

                                                    {/* Quick inspect button */}
                                                    <button
                                                        onClick={() =>
                                                            handleRoomStatusChange(
                                                                room.id,
                                                                room.status_hk === 'inspected' ? 'clean' : 'inspected'
                                                            )
                                                        }
                                                        className={`p-1.5 rounded-lg border transition ${
                                                            room.status_hk === 'inspected'
                                                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                                        }`}
                                                        title="Supervisor Inspection"
                                                    >
                                                        <Shield className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Assign Task button */}
                                                <button
                                                    onClick={() => openTaskModal(room)}
                                                    className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold transition active:scale-95 flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                                    <span>Assign Task</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
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
                                                    <td className="py-3 px-4 text-right space-x-1.5">
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
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Add New Room
                                </h3>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                    Register Room Inventory
                                </span>
                            </div>
                            <button
                                onClick={() => setIsAddRoomModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitAddRoom} className="space-y-4 mt-4 text-xs">
                            {/* Room Number */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Room Number</label>
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
                                <label className="block font-bold text-slate-700 mb-1">Room Type</label>
                                <select
                                    value={roomFormData.room_type_id}
                                    onChange={(e) => setRoomFormData('room_type_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                >
                                    {roomTypes.map((rt) => (
                                        <option key={rt.id} value={rt.id}>
                                            {rt.name} - ({formatTsh(rt.base_price_minor)})
                                        </option>
                                    ))}
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

                            {/* Initial Status */}
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
                                    <label className="block font-bold text-slate-700 mb-1">Housekeeping Status</label>
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
                                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50"
                                >
                                    {addingRoom ? 'Saving...' : 'Add Room'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
