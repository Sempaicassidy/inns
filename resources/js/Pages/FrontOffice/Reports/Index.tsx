import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Bed,
    Calendar,
    CheckCircle2,
    Clock,
    FilePlus2,
    FileText,
    HelpCircle,
    History,
    LogIn,
    LogOut,
    MessageSquare,
    Printer,
    Search,
    Send,
    User,
    UserCheck,
    Users,
    Wrench,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface ReportUser {
    id: number;
    name: string;
    role?: string;
}

interface FrontOfficeReportItem {
    id: number;
    report_date: string;
    shift_type: 'morning' | 'evening' | 'night' | 'full_day';
    shift_handover_to?: string;
    occupancy_count: number;
    arrivals_count: number;
    departures_count: number;
    in_house_count: number;
    operational_summary: string;
    guest_issues?: string;
    maintenance_issues?: string;
    handover_notes?: string;
    status: string;
    created_at: string;
    user?: ReportUser;
}

interface SnapshotProps {
    current_date: string;
    total_rooms: number;
    occupied_rooms: number;
    vacant_clean: number;
    vacant_dirty: number;
    maintenance_rooms: number;
    arrivals_today: number;
    departures_today: number;
    in_house_count: number;
    occupancy_pct: number;
}

interface Props extends PageProps {
    reports: {
        data: FrontOfficeReportItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    snapshot: SnapshotProps;
}

export default function FrontOfficeReportsIndex({ auth, reports, snapshot }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<FrontOfficeReportItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [shiftFilter, setShiftFilter] = useState<string>('all');

    const { data, setData, post, processing, errors, reset } = useForm({
        report_date: new Date().toISOString().split('T')[0],
        shift_type: 'morning',
        shift_handover_to: '',
        operational_summary: '',
        guest_issues: '',
        maintenance_issues: '',
        handover_notes: '',
    });

    const submitReport = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('front-office.reports.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    const getShiftBadge = (shift: string) => {
        switch (shift) {
            case 'morning':
                return {
                    label: 'Morning Shift (07:00 - 15:00)',
                    class: 'bg-amber-50 text-amber-800 border-amber-200',
                };
            case 'evening':
                return {
                    label: 'Evening Shift (15:00 - 23:00)',
                    class: 'bg-blue-50 text-blue-800 border-blue-200',
                };
            case 'night':
                return {
                    label: 'Night Shift (23:00 - 07:00)',
                    class: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                };
            default:
                return {
                    label: 'Full Day Summary',
                    class: 'bg-slate-100 text-slate-800 border-slate-200',
                };
        }
    };

    const filteredReports = (reports.data || []).filter((r) => {
        const matchesSearch =
            r.operational_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.shift_handover_to && r.shift_handover_to.toLowerCase().includes(searchTerm.toLowerCase())) ||
            r.report_date?.includes(searchTerm);

        const matchesShift = shiftFilter === 'all' || r.shift_type === shiftFilter;

        return matchesSearch && matchesShift;
    });

    return (
        <AuthenticatedLayout>
            <Head title="Front Office Shift Reports" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* 1. Header with deep navy / gold branding */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1E3A5F]/10 text-[#1E3A5F] border border-[#1E3A5F]/20">
                                <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                                Front Office Operations
                            </span>
                            <span className="text-xs text-slate-400">• Business Date: {snapshot.current_date}</span>
                        </div>
                        <h1 className="text-2xl font-black text-[#1E3A5F] tracking-tight">
                            Front Office Shift & Progress Reports
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Record shift handover notes, guest movement activities, room status, and desk progress logs.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                        >
                            <Printer className="w-4 h-4 text-slate-500" />
                            <span>Print Log</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#152a45] text-white text-xs font-bold rounded-xl shadow-xs transition"
                        >
                            <FilePlus2 className="w-4 h-4 text-[#D4AF37]" />
                            <span>Write Shift Report</span>
                        </button>
                    </div>
                </div>

                {/* 2. Operational Snapshot KPIs (Zero financial/money metrics) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {/* KPI 1: Occupancy Rate */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Occupancy</span>
                        <div className="mt-1 text-xl font-black text-[#1E3A5F]">{snapshot.occupancy_pct}%</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{snapshot.occupied_rooms} / {snapshot.total_rooms} Rooms</div>
                    </div>

                    {/* KPI 2: In-House Guests */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">In-House</span>
                        <div className="mt-1 text-xl font-black text-indigo-700">{snapshot.in_house_count}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Active Guests</div>
                    </div>

                    {/* KPI 3: Today Arrivals */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Arrivals</span>
                        <div className="mt-1 text-xl font-black text-blue-700">{snapshot.arrivals_today}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Expected Today</div>
                    </div>

                    {/* KPI 4: Today Departures */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Departures</span>
                        <div className="mt-1 text-xl font-black text-amber-700">{snapshot.departures_today}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Expected Today</div>
                    </div>

                    {/* KPI 5: Clean & Ready */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Ready Clean</span>
                        <div className="mt-1 text-xl font-black text-emerald-700">{snapshot.vacant_clean}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Available Rooms</div>
                    </div>

                    {/* KPI 6: Dirty Rooms */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Dirty Rooms</span>
                        <div className="mt-1 text-xl font-black text-rose-700">{snapshot.vacant_dirty}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Needs Cleaning</div>
                    </div>

                    {/* KPI 7: Out of Order */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Out of Order</span>
                        <div className="mt-1 text-xl font-black text-slate-800">{snapshot.maintenance_rooms}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Under Repair</div>
                    </div>

                    {/* KPI 8: Total Rooms */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Total Rooms</span>
                        <div className="mt-1 text-xl font-black text-slate-900">{snapshot.total_rooms}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Inventory</div>
                    </div>
                </div>

                {/* 3. Filter Bar & Search */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search report notes, author, handover..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F] outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Shift:</span>
                        {[
                            { id: 'all', label: 'All Shifts' },
                            { id: 'morning', label: 'Morning' },
                            { id: 'evening', label: 'Evening' },
                            { id: 'night', label: 'Night' },
                            { id: 'full_day', label: 'Full Day' },
                        ].map((shift) => (
                            <button
                                key={shift.id}
                                type="button"
                                onClick={() => setShiftFilter(shift.id)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                                    shiftFilter === shift.id
                                        ? 'bg-[#1E3A5F] text-white shadow-2xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                            >
                                {shift.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. Shift Reports History List */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-[#D4AF37]" />
                            <h2 className="text-sm font-bold text-slate-800">Submitted Shift Handover & Progress Logs</h2>
                        </div>
                        <span className="text-xs text-slate-400">{filteredReports.length} records</span>
                    </div>

                    {filteredReports.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-sm font-bold text-slate-700">No shift reports recorded yet</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                Receptionists can record their shift activities, guest interactions, room maintenance requests, and handover notes here.
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A5F] hover:bg-[#152a45] text-white text-xs font-bold rounded-xl transition"
                            >
                                <FilePlus2 className="w-4 h-4 text-[#D4AF37]" />
                                <span>Write First Report</span>
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredReports.map((report) => {
                                const badge = getShiftBadge(report.shift_type);
                                return (
                                    <div
                                        key={report.id}
                                        className="p-4 sm:p-5 hover:bg-slate-50/70 transition space-y-3"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`px-2.5 py-1 rounded-md text-[11px] font-black border uppercase tracking-wider ${badge.class}`}
                                                >
                                                    {badge.label}
                                                </span>
                                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {report.report_date}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    Recorded at {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedReport(report)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition"
                                                >
                                                    <span>View Full Report</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                                            <div>
                                                <span className="text-slate-400 text-[10px] uppercase font-bold block">Author / Receptionist</span>
                                                <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                                                    <User className="w-3.5 h-3.5 text-blue-600" />
                                                    {report.user?.name || 'Reception Staff'}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-slate-400 text-[10px] uppercase font-bold block">Handover Given To</span>
                                                <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                    {report.shift_handover_to || 'Next Shift Colleague'}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-slate-400 text-[10px] uppercase font-bold block">Room Occupancy</span>
                                                <div className="font-bold text-slate-800 mt-0.5">
                                                    {report.occupancy_count} Occupied Rooms
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-slate-400 text-[10px] uppercase font-bold block">Guest Movements</span>
                                                <div className="font-bold text-slate-800 mt-0.5">
                                                    <span className="text-blue-600 font-extrabold">{report.arrivals_count}</span> In / <span className="text-amber-600 font-extrabold">{report.departures_count}</span> Out
                                                </div>
                                            </div>
                                        </div>

                                        {/* Operational Summary snippet */}
                                        <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100">
                                            <span className="font-bold text-[#1E3A5F] block mb-1">Operational Progress & Summary:</span>
                                            <p className="line-clamp-2 leading-relaxed text-slate-600">{report.operational_summary}</p>
                                        </div>

                                        {/* Badges for issues */}
                                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                                            {report.guest_issues ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                                    Guest Requests / Issues Noted
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    No Guest Conflicts
                                                </span>
                                            )}

                                            {report.maintenance_issues && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                                                    <Wrench className="w-3 h-3 text-rose-500" />
                                                    Maintenance Defect Flagged
                                                </span>
                                            )}

                                            {report.handover_notes && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                                                    <Clock className="w-3 h-3 text-indigo-500" />
                                                    Handover Instructions Attached
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Write Shift Progress Report */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 bg-[#1E3A5F] text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FilePlus2 className="w-5 h-5 text-[#D4AF37]" />
                                <div>
                                    <h3 className="text-base font-bold text-white">Write Front Office Shift Report</h3>
                                    <p className="text-xs text-slate-300">Daily operational progress and desk handover</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-slate-300 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitReport} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Report Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.report_date}
                                        onChange={(e) => setData('report_date', e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
                                        required
                                    />
                                    {errors.report_date && <p className="text-xs text-rose-600 mt-1">{errors.report_date}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Shift Working Period <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.shift_type}
                                        onChange={(e) => setData('shift_type', e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
                                        required
                                    >
                                        <option value="morning">Morning Shift (07:00 - 15:00)</option>
                                        <option value="evening">Evening Shift (15:00 - 23:00)</option>
                                        <option value="night">Night Shift (23:00 - 07:00)</option>
                                        <option value="full_day">Full Day Operational Summary</option>
                                    </select>
                                    {errors.shift_type && <p className="text-xs text-rose-600 mt-1">{errors.shift_type}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Handover Given To (Incoming Colleague / Shift Staff)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Maria, John, Night Duty Officer..."
                                    value={data.shift_handover_to}
                                    onChange={(e) => setData('shift_handover_to', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
                                />
                                {errors.shift_handover_to && <p className="text-xs text-rose-600 mt-1">{errors.shift_handover_to}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Operational Progress & Desk Activities <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe general shift flow: guests checked in, room availability, front desk workload, VIP arrivals, key handovers..."
                                    value={data.operational_summary}
                                    onChange={(e) => setData('operational_summary', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
                                    required
                                />
                                {errors.operational_summary && <p className="text-xs text-rose-600 mt-1">{errors.operational_summary}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Guest Inquiries, Requests & Feedback (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Guest feedback, wake-up call requests, airport shuttle bookings, special meal preferences..."
                                    value={data.guest_issues}
                                    onChange={(e) => setData('guest_issues', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Room Maintenance & Defect Reports (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Report faulty ACs, plumbing leaks, electronic key locks needing battery replacement, etc."
                                    value={data.maintenance_issues}
                                    onChange={(e) => setData('maintenance_issues', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Specific Handover Notes / Instructions for Next Shift
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g., Room 104 requested late check-out at 14:00; Room 202 is expecting a guest delivery; early breakfast box needed for 06:00..."
                                    value={data.handover_notes}
                                    onChange={(e) => setData('handover_notes', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-[#1E3A5F] hover:bg-[#152a45] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4 text-[#D4AF37]" />
                                    <span>{processing ? 'Submitting...' : 'Submit Shift Report'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: View Full Report Details */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 bg-[#1E3A5F] text-white flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                                    Front Office Official Log #{selectedReport.id}
                                </span>
                                <h3 className="text-base font-bold text-white">
                                    {getShiftBadge(selectedReport.shift_type).label}
                                </h3>
                                <p className="text-xs text-slate-300">
                                    Date: {selectedReport.report_date} • Submitted by {selectedReport.user?.name || 'Staff'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedReport(null)}
                                className="text-slate-300 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            {/* Operational Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Occupancy</span>
                                    <div className="text-base font-black text-[#1E3A5F] mt-0.5">{selectedReport.occupancy_count} Rooms</div>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">In-House</span>
                                    <div className="text-base font-black text-indigo-700 mt-0.5">{selectedReport.in_house_count} Guests</div>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Arrivals</span>
                                    <div className="text-base font-black text-blue-700 mt-0.5">{selectedReport.arrivals_count}</div>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Departures</span>
                                    <div className="text-base font-black text-amber-700 mt-0.5">{selectedReport.departures_count}</div>
                                </div>
                            </div>

                            {/* Shift Handover Info */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-100/80 rounded-xl text-xs">
                                <div>
                                    <span className="text-slate-500 font-medium">Logged By:</span>{' '}
                                    <span className="font-bold text-slate-800">{selectedReport.user?.name || 'Reception Staff'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Handover Given To:</span>{' '}
                                    <span className="font-bold text-slate-800">{selectedReport.shift_handover_to || 'Next Colleague'}</span>
                                </div>
                            </div>

                            {/* Section 1: Operational Summary */}
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    Operational Progress & Shift Summary
                                </h4>
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedReport.operational_summary}
                                </div>
                            </div>

                            {/* Section 2: Guest Requests & Feedback */}
                            {selectedReport.guest_issues && (
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                                        Guest Inquiries & Service Requests
                                    </h4>
                                    <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {selectedReport.guest_issues}
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Maintenance Issues */}
                            {selectedReport.maintenance_issues && (
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Wrench className="w-3.5 h-3.5 text-rose-600" />
                                        Maintenance & Room Defect Reports
                                    </h4>
                                    <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {selectedReport.maintenance_issues}
                                    </div>
                                </div>
                            )}

                            {/* Section 4: Handover Instructions */}
                            {selectedReport.handover_notes && (
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                        Handover Instructions for Next Shift
                                    </h4>
                                    <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {selectedReport.handover_notes}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedReport(null)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
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

