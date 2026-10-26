import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { HousekeepingTask, PageProps, Room, User } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Filter,
    Plus,
    Sparkles,
    UserCheck,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface HousekeepingIndexProps extends PageProps {
    rooms: Room[];
    tasks: HousekeepingTask[];
    housekeepers: User[];
    floors: string[];
    filters: {
        status_hk: string;
        floor: string;
    };
    stats: {
        total: number;
        clean: number;
        dirty: number;
        inspected: number;
        out_of_service: number;
    };
}

export default function HousekeepingIndex({
    rooms,
    tasks,
    housekeepers,
    floors,
    filters,
    stats,
}: HousekeepingIndexProps) {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const { data: taskData, setData: setTaskData, post: postTask, processing: creatingTask, reset: resetTask } = useForm({
        room_id: rooms[0]?.id || '',
        task_type: 'checkout_clean',
        priority: 'normal',
        assigned_to: housekeepers[0]?.id || '',
        notes: '',
    });

    const handleRoomStatusChange = (roomId: string, newStatus: string) => {
        router.post(route('housekeeping.rooms.status', roomId), { status_hk: newStatus });
    };

    const handleTaskStatusChange = (taskId: string, newStatus: string) => {
        router.post(route('housekeeping.tasks.status', taskId), { status: newStatus });
    };

    const handleFilterStatus = (status_hk: string) => {
        router.get(route('housekeeping.index'), { status_hk, floor: filters.floor }, { preserveState: true });
    };

    const handleFilterFloor = (floor: string) => {
        router.get(route('housekeeping.index'), { floor, status_hk: filters.status_hk }, { preserveState: true });
    };

    const submitTask = (e: React.FormEvent) => {
        e.preventDefault();
        postTask(route('housekeeping.tasks.store'), {
            onSuccess: () => {
                setIsTaskModalOpen(false);
                resetTask();
            },
        });
    };

    const getRoomCardBg = (hk: Room['status_hk'], occ: Room['status_occupancy']) => {
        if (occ === 'occupied') {
            return 'border-blue-500/40 bg-gradient-to-br from-slate-900 to-blue-950/20';
        }
        switch (hk) {
            case 'clean':
                return 'border-emerald-500/40 bg-gradient-to-br from-slate-900 to-emerald-950/20';
            case 'inspected':
                return 'border-cyan-500/40 bg-gradient-to-br from-slate-900 to-cyan-950/20';
            case 'dirty':
                return 'border-amber-500/40 bg-gradient-to-br from-slate-900 to-amber-950/20';
            default:
                return 'border-slate-700 bg-slate-900';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Housekeeping & Room Status - Haula HMS" />

            {/* Header Toolbar */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                        <Sparkles className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Housekeeping & Maintenance Board</h1>
                        <p className="text-xs text-slate-400">
                            Monitor live room cleanliness, occupancy and turnover tasks
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition"
                >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Assign Cleaning Task</span>
                </button>
            </div>

            {/* Quick Status KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <button
                    onClick={() => handleFilterStatus('')}
                    className={`p-3.5 rounded-xl border text-left transition ${
                        filters.status_hk === '' ? 'bg-slate-800 border-amber-400/50' : 'bg-slate-900 border-slate-800'
                    }`}
                >
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Rooms</span>
                    <span className="text-xl font-black text-white font-mono block mt-0.5">{stats.total}</span>
                </button>

                <button
                    onClick={() => handleFilterStatus('clean')}
                    className={`p-3.5 rounded-xl border text-left transition ${
                        filters.status_hk === 'clean' ? 'bg-slate-800 border-emerald-400/50' : 'bg-slate-900 border-slate-800'
                    }`}
                >
                    <span className="text-[11px] text-emerald-400 font-semibold uppercase">Clean</span>
                    <span className="text-xl font-black text-emerald-400 font-mono block mt-0.5">{stats.clean}</span>
                </button>

                <button
                    onClick={() => handleFilterStatus('dirty')}
                    className={`p-3.5 rounded-xl border text-left transition ${
                        filters.status_hk === 'dirty' ? 'bg-slate-800 border-amber-400/50' : 'bg-slate-900 border-slate-800'
                    }`}
                >
                    <span className="text-[11px] text-amber-400 font-semibold uppercase">Dirty</span>
                    <span className="text-xl font-black text-amber-400 font-mono block mt-0.5">{stats.dirty}</span>
                </button>

                <button
                    onClick={() => handleFilterStatus('inspected')}
                    className={`p-3.5 rounded-xl border text-left transition ${
                        filters.status_hk === 'inspected' ? 'bg-slate-800 border-cyan-400/50' : 'bg-slate-900 border-slate-800'
                    }`}
                >
                    <span className="text-[11px] text-cyan-400 font-semibold uppercase">Inspected</span>
                    <span className="text-xl font-black text-cyan-400 font-mono block mt-0.5">{stats.inspected}</span>
                </button>

                <button
                    onClick={() => handleFilterStatus('out_of_order')}
                    className={`p-3.5 rounded-xl border text-left transition ${
                        filters.status_hk === 'out_of_order' ? 'bg-slate-800 border-slate-500' : 'bg-slate-900 border-slate-800'
                    }`}
                >
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Out of Service</span>
                    <span className="text-xl font-black text-slate-400 font-mono block mt-0.5">{stats.out_of_service}</span>
                </button>
            </div>

            {/* Room Status Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {rooms.map((room) => (
                    <div
                        key={room.id}
                        className={`p-4 rounded-2xl border shadow-xl relative overflow-hidden transition hover:scale-[1.01] ${getRoomCardBg(
                            room.status_hk,
                            room.status_occupancy
                        )}`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-lg font-black text-white font-mono block">
                                    {room.room_number}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                                    {room.room_type?.name}
                                </span>
                            </div>

                            <div className="flex flex-col items-end space-y-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                    room.status_occupancy === 'occupied'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}>
                                    {room.status_occupancy}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500">{room.floor}</span>
                            
                            {/* Status Switcher Select */}
                            <select
                                value={room.status_hk}
                                onChange={(e) => handleRoomStatusChange(room.id, e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-lg text-xs py-1 px-2 text-white font-medium focus:border-amber-400 cursor-pointer"
                            >
                                <option value="clean">Clean</option>
                                <option value="dirty">Dirty</option>
                                <option value="inspected">Inspected</option>
                                <option value="out_of_order">Out of Order</option>
                                <option value="out_of_service">Out of Service</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Housekeeping Tasks Section */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Active Cleaning & Maintenance Queue ({tasks.length})</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="py-3 px-4">Room</th>
                                <th className="py-3 px-4">Task Type</th>
                                <th className="py-3 px-4">Priority</th>
                                <th className="py-3 px-4">Assigned Attendant</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Notes</th>
                                <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {tasks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500">
                                        No active housekeeping tasks pending. All rooms cleaned.
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-slate-850/50 transition">
                                        <td className="py-3 px-4 font-mono font-bold text-white">
                                            {task.room?.room_number}
                                        </td>
                                        <td className="py-3 px-4 capitalize font-medium text-slate-300">
                                            {task.task_type.replace('_', ' ')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                task.priority === 'urgent'
                                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                                    : task.priority === 'high'
                                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                    : 'bg-slate-800 text-slate-300'
                                            }`}>
                                                {task.priority.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-200">
                                            {task.assignee?.name || 'Unassigned'}
                                        </td>
                                        <td className="py-3 px-4 capitalize text-amber-400">
                                            {task.status.replace('_', ' ')}
                                        </td>
                                        <td className="py-3 px-4 text-slate-400">
                                            {task.notes || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleTaskStatusChange(task.id, 'completed')}
                                                className="inline-flex items-center space-x-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-xs transition shadow-sm"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Mark Clean</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Assign Cleaning Task */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="font-bold text-white text-sm">Assign Housekeeping Task</h3>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitTask} className="space-y-4 text-xs">
                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Select Room *</label>
                                <select
                                    required
                                    value={taskData.room_id}
                                    onChange={(e) => setTaskData('room_id', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                >
                                    {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            Room {r.room_number} ({r.status_hk.toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-300 font-semibold block mb-1">Task Type *</label>
                                    <select
                                        value={taskData.task_type}
                                        onChange={(e) => setTaskData('task_type', e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                    >
                                        <option value="checkout_clean">Checkout Clean</option>
                                        <option value="stayover_clean">Stayover Clean</option>
                                        <option value="deep_clean">Deep Clean</option>
                                        <option value="inspection">Inspection</option>
                                        <option value="touchup">Quick Touchup</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-300 font-semibold block mb-1">Priority *</label>
                                    <select
                                        value={taskData.priority}
                                        onChange={(e) => setTaskData('priority', e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="high">High Priority</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Assign Attendant</label>
                                <select
                                    value={taskData.assigned_to}
                                    onChange={(e) => setTaskData('assigned_to', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                >
                                    <option value="">-- Unassigned --</option>
                                    {housekeepers.map((h) => (
                                        <option key={h.id} value={h.id}>
                                            {h.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Instructions / Notes</label>
                                <textarea
                                    value={taskData.notes}
                                    onChange={(e) => setTaskData('notes', e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                    placeholder="e.g. Replace fresh linen and replenish minibar..."
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsTaskModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingTask}
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg disabled:opacity-50"
                                >
                                    {creatingTask ? 'Assigning...' : 'Assign Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
