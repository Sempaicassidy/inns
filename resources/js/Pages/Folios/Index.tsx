import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Folio, PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Receipt,
    Search,
} from 'lucide-react';

interface FoliosIndexProps extends PageProps {
    folios: {
        data: Folio[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        status: string;
        search: string;
    };
}

export default function FoliosIndex({ folios, filters }: FoliosIndexProps) {
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
        router.get(route('folios.index'), { search: searchVal, status: filters.status }, { preserveState: true });
    };

    const handleFilterStatus = (status: string) => {
        router.get(route('folios.index'), { status, search: filters.search }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Billing & Folios - Haula HMS" />

            {/* Header Toolbar */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                        <CreditCard className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Billing, Folios & Ledgers</h1>
                        <p className="text-xs text-slate-400">
                            Track guest and company folios, itemized charges and multi-method payments
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative w-full md:w-72">
                    <input
                        type="text"
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Search Folio # or Guest Name..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </form>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 mb-6 text-xs">
                {[
                    { label: 'All Folios', value: '' },
                    { label: 'Open (With Balance)', value: 'open' },
                    { label: 'Settled (Zero Balance)', value: 'settled' },
                    { label: 'Closed', value: 'closed' },
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => handleFilterStatus(tab.value)}
                        className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
                            filters.status === tab.value
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Folios Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="py-3.5 px-4">Folio #</th>
                                <th className="py-3.5 px-4">Guest / Account</th>
                                <th className="py-3.5 px-4">Room</th>
                                <th className="py-3.5 px-4">Total Charges</th>
                                <th className="py-3.5 px-4">Payments Made</th>
                                <th className="py-3.5 px-4">Current Balance</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {folios.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-500">
                                        No folios found.
                                    </td>
                                </tr>
                            ) : (
                                folios.data.map((folio) => {
                                    const guest = folio.reservation?.guest;
                                    const room = folio.stay?.room;
                                    return (
                                        <tr key={folio.id} className="hover:bg-slate-850/50 transition">
                                            <td className="py-4 px-4 font-mono font-bold text-amber-400 text-sm">
                                                {folio.folio_number}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-white text-sm">
                                                    {guest ? `${guest.first_name} ${guest.last_name}` : 'General Guest'}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {guest?.phone || 'Direct Customer'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 font-mono font-semibold text-slate-200">
                                                {room ? `Room ${room.room_number}` : 'No Room'}
                                            </td>
                                            <td className="py-4 px-4 font-mono text-slate-200">
                                                {formatTZS(folio.total_charges_minor)}
                                            </td>
                                            <td className="py-4 px-4 font-mono text-emerald-400">
                                                {formatTZS(folio.total_payments_minor)}
                                            </td>
                                            <td className="py-4 px-4 font-mono font-bold">
                                                {folio.balance_minor > 0 ? (
                                                    <span className="text-rose-400">{formatTZS(folio.balance_minor)}</span>
                                                ) : (
                                                    <span className="text-emerald-400">0 TZS</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {folio.status === 'open' ? (
                                                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-bold">Open</span>
                                                ) : folio.status === 'settled' ? (
                                                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">Settled</span>
                                                ) : (
                                                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[11px]">Closed</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <Link
                                                    href={route('folios.show', folio.id)}
                                                    className="inline-flex items-center space-x-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-md transition"
                                                >
                                                    <Receipt className="w-3.5 h-3.5 stroke-[2.2]" />
                                                    <span>Open Statement</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
