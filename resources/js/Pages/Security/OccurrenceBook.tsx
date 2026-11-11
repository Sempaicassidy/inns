import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    Clock,
    Edit3,
    Eye,
    FileText,
    Filter,
    MapPin,
    Plus,
    Search,
    ShieldAlert,
    User,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface ObEntry {
    id: string;
    reference: string;
    occurred_at: string;
    location: string;
    category: string;
    description: string;
    involved_persons: string | null;
    action_taken: string | null;
    status: 'submitted' | 'under_review' | 'closed';
    property?: { id: string; name: string } | null;
    creator?: { id: number; name: string } | null;
    amendments?: Array<{
        id: string;
        reason: string;
        amended_by?: { id: number; name: string } | null;
        created_at: string;
    }>;
    created_at: string;
}

interface Props extends PageProps {
    entries: { data: ObEntry[]; links: any[] };
    stats: { total: number; today: number; submitted: number; under_review: number; closed: number };
    categories: string[];
    filters: { status?: string; category?: string; search?: string };
    can_amend: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
    security_incident: 'Security Incident',
    theft: 'Theft',
    assault: 'Assault',
    trespass: 'Trespass',
    vandalism: 'Vandalism',
    fire: 'Fire',
    medical: 'Medical',
    disturbance: 'Disturbance',
    lost_property: 'Lost Property',
    other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
    submitted: 'bg-amber-50 text-amber-700 border-amber-200',
    under_review: 'bg-blue-50 text-blue-700 border-blue-200',
    closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function OccurrenceBook({ entries, stats, categories, filters, can_amend }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [viewEntry, setViewEntry] = useState<ObEntry | null>(null);
    const [amendEntry, setAmendEntry] = useState<ObEntry | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const createForm = useForm({
        occurred_at: new Date().toISOString().slice(0, 16),
        location: '',
        category: 'security_incident',
        description: '',
        involved_persons: '',
        action_taken: '',
    });

    const amendForm = useForm({
        reason: '',
        location: '',
        category: '',
        description: '',
        involved_persons: '',
        action_taken: '',
        status: '',
    });

    const applyFilters = (patch: Record<string, string>) => {
        router.get(route('security.ob.index'), { ...filters, ...patch }, { preserveState: true, preserveScroll: true });
    };

    const openAmend = (entry: ObEntry) => {
        amendForm.setData({
            reason: '',
            location: entry.location,
            category: entry.category,
            description: entry.description,
            involved_persons: entry.involved_persons || '',
            action_taken: entry.action_taken || '',
            status: entry.status,
        });
        setAmendEntry(entry);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Occurrence Book (O.B.) — Security" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-blue-600" />
                            Occurrence Book (O.B.)
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">Security incident log — entries are amendable only with audit trail</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New O.B. Entry</span>
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { label: 'Total Entries', value: stats.total, icon: BookOpen, color: 'text-slate-700', bg: 'bg-slate-100' },
                        { label: "Today's", value: stats.today, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Submitted', value: stats.submitted, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Under Review', value: stats.under_review, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Closed', value: stats.closed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((s) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                                <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-2`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="text-xl font-black text-slate-900">{s.value}</div>
                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{s.label}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                            placeholder="Search reference, location, description..."
                            className="flex-1 text-sm bg-transparent outline-none"
                        />
                    </div>
                    <select
                        value={filters.status || 'all'}
                        onChange={(e) => applyFilters({ status: e.target.value })}
                        className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white"
                    >
                        <option value="all">All Statuses</option>
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        value={filters.category || 'all'}
                        onChange={(e) => applyFilters({ category: e.target.value })}
                        className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
                        ))}
                    </select>
                </div>

                {/* Entries table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-4 py-3">Date & Time</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Reported By</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {entries.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            No O.B. entries recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    entries.data.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{entry.reference}</td>
                                            <td className="px-4 py-3 text-xs text-slate-600">{new Date(entry.occurred_at).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-xs font-semibold text-slate-700">{entry.location}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                                    {CATEGORY_LABELS[entry.category] || entry.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_STYLES[entry.status]}`}>
                                                    {entry.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{entry.creator?.name || '—'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button type="button" onClick={() => setViewEntry(entry)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="View">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {can_amend && (
                                                        <button type="button" onClick={() => openAmend(entry)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Amend">
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {entries.links && entries.links.length > 3 && (
                        <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-1">
                            {entries.links.map((link: any, i: number) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${link.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button type="button" onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-blue-600" /> New O.B. Entry
                        </h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                createForm.post(route('security.ob.store'), {
                                    preserveScroll: true,
                                    onSuccess: () => { setShowCreate(false); createForm.reset(); },
                                });
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Date & Time *</label>
                                <input type="datetime-local" value={createForm.data.occurred_at} onChange={(e) => createForm.setData('occurred_at', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Location *</label>
                                <input type="text" value={createForm.data.location} onChange={(e) => createForm.setData('location', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="e.g. Main Gate, Lobby, Room 204" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Category *</label>
                                <select value={createForm.data.category} onChange={(e) => createForm.setData('category', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                                    {categories.map((c) => (
                                        <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Description *</label>
                                <textarea value={createForm.data.description} onChange={(e) => createForm.setData('description', e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Detailed description of the incident..." required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Involved Persons</label>
                                <input type="text" value={createForm.data.involved_persons} onChange={(e) => createForm.setData('involved_persons', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Names/IDs if known" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Action Taken</label>
                                <textarea value={createForm.data.action_taken} onChange={(e) => createForm.setData('action_taken', e.target.value)} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Response actions taken..." />
                            </div>
                            {createForm.errors && Object.keys(createForm.errors).length > 0 && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                                    {Object.values(createForm.errors).map((err, i) => <div key={i}>{err}</div>)}
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm">Cancel</button>
                                <button type="submit" disabled={createForm.processing} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                                    {createForm.processing ? 'Saving...' : 'Record Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button type="button" onClick={() => setViewEntry(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-black text-slate-900 mb-1 font-mono">{viewEntry.reference}</h3>
                        <p className="text-xs text-slate-500 mb-4">{CATEGORY_LABELS[viewEntry.category]} • {new Date(viewEntry.occurred_at).toLocaleString()}</p>
                        <div className="space-y-3 text-sm">
                            <div className="flex gap-2"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" /><span className="font-semibold">{viewEntry.location}</span></div>
                            <div className="flex gap-2"><User className="w-4 h-4 text-slate-400 mt-0.5" /><span>{viewEntry.creator?.name || '—'}</span></div>
                            <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs font-bold text-slate-500 mb-1">Description</p><p className="text-slate-700 whitespace-pre-wrap">{viewEntry.description}</p></div>
                            {viewEntry.involved_persons && <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs font-bold text-slate-500 mb-1">Involved Persons</p><p className="text-slate-700">{viewEntry.involved_persons}</p></div>}
                            {viewEntry.action_taken && <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs font-bold text-slate-500 mb-1">Action Taken</p><p className="text-slate-700 whitespace-pre-wrap">{viewEntry.action_taken}</p></div>}
                            {viewEntry.amendments && viewEntry.amendments.length > 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Amendments ({viewEntry.amendments.length})</p>
                                    {viewEntry.amendments.map((a) => (
                                        <div key={a.id} className="text-xs text-amber-800 mb-1">
                                            {new Date(a.created_at).toLocaleString()} — {a.amended_by?.name || 'System'}: {a.reason}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Amend Modal */}
            {amendEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button type="button" onClick={() => setAmendEntry(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-black text-slate-900 mb-1">Amend {amendEntry.reference}</h3>
                        <p className="text-xs text-amber-600 mb-4 font-semibold">Original record will be preserved in audit trail</p>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                amendForm.post(route('security.ob.amend', amendEntry.id), {
                                    preserveScroll: true,
                                    onSuccess: () => setAmendEntry(null),
                                });
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Reason for Amendment *</label>
                                <input type="text" value={amendForm.data.reason} onChange={(e) => amendForm.setData('reason', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="e.g. Corrected location typo" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                                <select value={amendForm.data.status} onChange={(e) => amendForm.setData('status', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                                    <option value="submitted">Submitted</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Location</label>
                                <input type="text" value={amendForm.data.location} onChange={(e) => amendForm.setData('location', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                                <select value={amendForm.data.category} onChange={(e) => amendForm.setData('category', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                                    {categories.map((c) => (
                                        <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                                <textarea value={amendForm.data.description} onChange={(e) => amendForm.setData('description', e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Involved Persons</label>
                                <input type="text" value={amendForm.data.involved_persons} onChange={(e) => amendForm.setData('involved_persons', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Action Taken</label>
                                <textarea value={amendForm.data.action_taken} onChange={(e) => amendForm.setData('action_taken', e.target.value)} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setAmendEntry(null)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm">Cancel</button>
                                <button type="submit" disabled={amendForm.processing} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-50">
                                    {amendForm.processing ? 'Saving...' : 'Save Amendment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
