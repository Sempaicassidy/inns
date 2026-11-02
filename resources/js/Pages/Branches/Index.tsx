import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    BedDouble,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Compass,
    DoorClosed,
    Edit3,
    Hotel,
    Mail,
    MapPin,
    Palmtree,
    Phone,
    Plus,
    Power,
    Shield,
    Tent,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

export interface BranchItem {
    id: string;
    name: string;
    is_main: boolean;
    code: string;
    property_type: 'hotel' | 'lodge' | 'camp' | 'resort' | 'guest_house';
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    currency: string;
    is_active: boolean;
    is_current: boolean;
    business_date: string;
    total_rooms: number;
    occupied_rooms: number;
    occupancy_rate: number;
    active_stays: number;
    tenant_name?: string;
}

interface TenantInfo {
    id?: string;
    name: string;
    plan: string;
    max_branches: number;
    branch_count: number;
    status: string;
    is_active: boolean;
}

interface BranchesProps extends PageProps {
    branches: BranchItem[];
    currentPropertyId?: string;
    canManageBranches: boolean;
    canAddBranch: boolean;
    tenant: TenantInfo;
}

export default function BranchesIndex({
    branches,
    currentPropertyId,
    canManageBranches,
    canAddBranch,
    tenant,
}: BranchesProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);

    // Create Form
    const createForm = useForm({
        name: '',
        code: '',
        property_type: 'hotel',
        city: '',
        address: '',
        phone: '',
        email: '',
        currency: 'TZS',
        checkin_time: '14:00',
        checkout_time: '10:00',
    });

    // Edit Form
    const editForm = useForm({
        name: '',
        code: '',
        property_type: 'hotel',
        city: '',
        address: '',
        phone: '',
        email: '',
        currency: 'TZS',
        checkin_time: '14:00',
        checkout_time: '10:00',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('branches.store'), {
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditOpen = (branch: BranchItem) => {
        setEditingBranch(branch);
        editForm.setData({
            name: branch.name,
            code: branch.code,
            property_type: branch.property_type,
            city: branch.city || '',
            address: branch.address || '',
            phone: branch.phone || '',
            email: branch.email || '',
            currency: branch.currency || 'TZS',
            checkin_time: '14:00',
            checkout_time: '10:00',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBranch) return;
        editForm.put(route('branches.update', editingBranch.id), {
            onSuccess: () => {
                setEditingBranch(null);
            },
        });
    };

    const handleSwitchBranch = (branchId: string) => {
        router.post(route('branches.switch', branchId));
    };

    const handleToggleBranch = (branchId: string) => {
        if (confirm('Are you sure you want to change the active status of this branch?')) {
            router.patch(route('branches.toggle', branchId));
        }
    };

    const getPropertyIcon = (type: string) => {
        switch (type) {
            case 'lodge':
            case 'camp':
                return <Tent className="w-5 h-5 text-sky-700" />;
            case 'resort':
                return <Palmtree className="w-5 h-5 text-sky-700" />;
            default:
                return <Hotel className="w-5 h-5 text-sky-700" />;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="THE INNS" />

            {/* Header Section */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-4 sm:mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                Property & Branch Manager
                            </h1>
                            <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide hidden sm:inline">
                                Multi-Tenant
                            </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                            Unified multi-unit hotel operation for <span className="font-semibold text-slate-800">{tenant.name}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3 w-full md:w-auto justify-between md:justify-end">
                    {/* Subscription Quota Pill */}
                    <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500">
                            Quota
                        </div>
                        <div className="font-bold text-slate-900 text-xs flex items-center space-x-1 mt-0.5">
                            <span className="text-sky-700 font-mono">{tenant.branch_count}</span>
                            <span className="text-slate-400">/</span>
                            <span className="font-mono">{tenant.max_branches} Units</span>
                        </div>
                    </div>

                    {/* Add Branch Button */}
                    {canManageBranches ? (
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            disabled={!canAddBranch}
                            title={!canAddBranch ? 'Branch limit reached on your plan' : 'Add a new hotel branch'}
                            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-xs text-xs transition active-press disabled:opacity-50 shrink-0"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Add Branch</span>
                        </button>
                    ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
                            Viewing Mode
                        </div>
                    )}
                </div>
            </div>

            {/* Permission or Limit Alert if needed */}
            {!canManageBranches && (
                <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl mb-6 flex items-start space-x-3 text-xs text-sky-900">
                    <Shield className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Branch Switching Active:</span> You are currently viewing the hotel branches for your organization. To add or configure new branches, contact your organization General Manager or Administrator for permission.
                    </div>
                </div>
            )}

            {/* Branches Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {branches.map((branch) => {
                    const isCurrent = branch.id === currentPropertyId;

                    return (
                        <div
                            key={branch.id}
                            className={`bg-white rounded-2xl border transition shadow-xs flex flex-col justify-between overflow-hidden ${
                                isCurrent
                                    ? 'border-sky-500 ring-2 ring-sky-100'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {/* Card Top Banner / Badges */}
                            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                                <div className="flex items-center space-x-3">
                                    <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                                        {getPropertyIcon(branch.property_type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                                                {branch.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                                {branch.code}
                                            </span>
                                            <span className="text-[11px] text-slate-500 capitalize">
                                                {branch.property_type}
                                            </span>
                                            {branch.is_main && (
                                                <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-1.5 py-0.2 rounded-xs">
                                                    HQ
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {branch.is_active ? (
                                        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span>Active</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                            <span>Inactive</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Operational Stats Grid */}
                            <div className="p-5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-3 gap-3 text-center">
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Rooms</span>
                                    <span className="font-mono font-bold text-sm text-slate-900">
                                        {branch.total_rooms}
                                    </span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Occupancy</span>
                                    <span className="font-mono font-bold text-sm text-sky-700">
                                        {branch.occupancy_rate}%
                                    </span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Stays</span>
                                    <span className="font-mono font-bold text-sm text-emerald-700">
                                        {branch.active_stays}
                                    </span>
                                </div>
                            </div>

                            {/* Details (Location, Contacts) */}
                            <div className="p-5 space-y-2 text-xs text-slate-600 flex-1">
                                {branch.city && (
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{branch.address ? `${branch.address}, ` : ''}{branch.city}</span>
                                    </div>
                                )}
                                {branch.phone && (
                                    <div className="flex items-center space-x-2">
                                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>{branch.phone}</span>
                                    </div>
                                )}
                                {branch.email && (
                                    <div className="flex items-center space-x-2">
                                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{branch.email}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
                                    <span>Currency: <strong className="text-slate-800 font-mono">{branch.currency}</strong></span>
                                    <span>Date: <strong className="text-sky-700 font-mono">{branch.business_date}</strong></span>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                                {isCurrent ? (
                                    <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>Current Active Branch</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSwitchBranch(branch.id)}
                                        className="btn btn-outline-primary border border-sky-600 text-sky-700 hover:bg-sky-600 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active-press"
                                    >
                                        Switch to Branch
                                    </button>
                                )}

                                {canManageBranches && (
                                    <div className="flex items-center space-x-1.5">
                                        <button
                                            onClick={() => handleEditOpen(branch)}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition"
                                            title="Edit Branch Settings"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleBranch(branch.id)}
                                            className={`p-1.5 rounded-lg border transition ${
                                                branch.is_active
                                                    ? 'border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-700'
                                                    : 'border-emerald-200 hover:bg-emerald-50 text-emerald-700'
                                            }`}
                                            title={branch.is_active ? 'Deactivate Branch' : 'Activate Branch'}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CREATE BRANCH MODAL */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <div className="flex items-center space-x-2.5">
                                <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-slate-900">Add New Hotel Branch</h3>
                                    <p className="text-xs text-slate-500">Configure new property location under your SaaS subscription</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Branch Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Haula Beach Resort & Spa"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                    {createForm.errors.name && (
                                        <p className="text-[11px] text-red-600 mt-0.5">{createForm.errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Branch Code (3-4 Letters) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        placeholder="e.g. HBR"
                                        value={createForm.data.code}
                                        onChange={(e) => createForm.setData('code', e.target.value.toUpperCase())}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                    {createForm.errors.code && (
                                        <p className="text-[11px] text-red-600 mt-0.5">{createForm.errors.code}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Property Type *
                                    </label>
                                    <select
                                        value={createForm.data.property_type}
                                        onChange={(e) => createForm.setData('property_type', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    >
                                        <option value="hotel">Standard Hotel</option>
                                        <option value="lodge">Safari Lodge</option>
                                        <option value="camp">Tented Camp</option>
                                        <option value="resort">Beach / Luxury Resort</option>
                                        <option value="guest_house">Guest House</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        City / Town *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Zanzibar / Arusha"
                                        value={createForm.data.city}
                                        onChange={(e) => createForm.setData('city', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Operating Currency *
                                    </label>
                                    <select
                                        value={createForm.data.currency}
                                        onChange={(e) => createForm.setData('currency', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    >
                                        <option value="TZS">TZS - Tanzanian Shilling</option>
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="KES">KES - Kenyan Shilling</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Address / Landmark
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Nungwi Beachfront Road"
                                        value={createForm.data.address}
                                        onChange={(e) => createForm.setData('address', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Phone Contact
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="+255 784 000 000"
                                        value={createForm.data.phone}
                                        onChange={(e) => createForm.setData('phone', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Front Desk Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="reception@branch.com"
                                        value={createForm.data.email}
                                        onChange={(e) => createForm.setData('email', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="btn btn-primary bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2 rounded-xl shadow-xs text-xs transition active-press disabled:opacity-50"
                                >
                                    {createForm.processing ? 'Creating Branch...' : 'Save & Launch Branch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT BRANCH MODAL */}
            {editingBranch && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <div className="flex items-center space-x-2.5">
                                <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-slate-900">
                                        Edit Branch: {editingBranch.name}
                                    </h3>
                                    <p className="text-xs text-slate-500">Update branch details and operational configuration</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingBranch(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Branch Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Branch Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={editForm.data.code}
                                        onChange={(e) => editForm.setData('code', e.target.value.toUpperCase())}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Property Type *
                                    </label>
                                    <select
                                        value={editForm.data.property_type}
                                        onChange={(e) => editForm.setData('property_type', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    >
                                        <option value="hotel">Standard Hotel</option>
                                        <option value="lodge">Safari Lodge</option>
                                        <option value="camp">Tented Camp</option>
                                        <option value="resort">Beach / Luxury Resort</option>
                                        <option value="guest_house">Guest House</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        City / Town *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.city}
                                        onChange={(e) => editForm.setData('city', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Operating Currency *
                                    </label>
                                    <select
                                        value={editForm.data.currency}
                                        onChange={(e) => editForm.setData('currency', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    >
                                        <option value="TZS">TZS - Tanzanian Shilling</option>
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.address}
                                        onChange={(e) => editForm.setData('address', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Phone Contact
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.phone}
                                        onChange={(e) => editForm.setData('phone', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Front Desk Email
                                    </label>
                                    <input
                                        type="email"
                                        value={editForm.data.email}
                                        onChange={(e) => editForm.setData('email', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingBranch(null)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="btn btn-primary bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2 rounded-xl shadow-xs text-xs transition active-press disabled:opacity-50"
                                >
                                    {editForm.processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
