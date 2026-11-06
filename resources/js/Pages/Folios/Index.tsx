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
            <Head title="Billing & Folios - THE INNS" />

            {/* Header Toolbar (White Card) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                    
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Billing, Folios & Ledgers</h1>
                        
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative w-full md:w-72">
                    <input
                        type="text"
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Search Folio # or Guest Name..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-xs"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </form>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 mb-4 sm:mb-6 overflow-x-auto no-scrollbar pb-1 text-xs">
                {[
                    { label: 'All Folios', value: '' },
                    { label: 'Open (With Balance)', value: 'open' },
                    { label: 'Settled', value: 'settled' },
                    { label: 'Closed', value: 'closed' },
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => handleFilterStatus(tab.value)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer active-press whitespace-nowrap text-xs ${
                            filters.status === tab.value
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* MOBILE FOLIOS CARD LIST (<sm screens) */}
            <div className="sm:hidden space-y-3 mb-6">
                {folios.data.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                        No folios found matching criteria.
                    </div>
                ) : (
                    folios.data.map((folio) => {
                        const guest = folio.reservation?.guest;
                        const room = folio.stay?.room;
                        return (
                            <div
                                key={folio.id}
                                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-slate-900 text-sm">
                                                {guest ? `${guest.first_name} ${guest.last_name}` : 'General Guest'}
                                            </span>
                                            <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                                                {folio.folio_number}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            {room ? `Room ${room.room_number}` : 'No Room'} &bull; {guest?.phone || 'Direct'}
                                        </div>
                                    </div>

                                    <div>
                                        {folio.status === 'open' ? (
                                            <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Open</span>
                                        ) : folio.status === 'settled' ? (
                                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Settled</span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-medium">Closed</span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                                    <div>
                                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Charges</span>
                                        <span className="font-mono font-bold text-slate-800 text-[11px] block">
                                            {formatTZS(folio.total_charges_minor)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Paid</span>
                                        <span className="font-mono font-bold text-emerald-700 text-[11px] block">
                                            {formatTZS(folio.total_payments_minor)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Balance</span>
                                        <span className={`font-mono font-bold text-[11px] block ${folio.balance_minor > 0 ? 'text-blue-800' : 'text-emerald-700'}`}>
                                            {formatTZS(folio.balance_minor)}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex justify-end">
                                    <Link
                                        href={route('folios.show', folio.id)}
                                        className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition active:scale-95"
                                    >
                                        <Receipt className="w-3.5 h-3.5" />
                                        <span>View Statement & Pay</span>
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* DESKTOP FOLIOS TABLE (>=sm screens) */}
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
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
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                            {folios.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400">
                                        No folios found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                folios.data.map((folio) => {
                                    const guest = folio.reservation?.guest;
                                    const room = folio.stay?.room;
                                    return (
                                        <tr key={folio.id} className="hover:bg-slate-50/80 transition">
                                            <td className="py-4 px-4 font-mono font-bold text-sky-800 text-sm">
                                                {folio.folio_number}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {guest ? `${guest.first_name} ${guest.last_name}` : 'General Guest'}
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-medium">
                                                    {guest?.phone || 'Direct Customer'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 font-mono font-bold text-slate-800">
                                                {room ? `Room ${room.room_number}` : 'No Room'}
                                            </td>
                                            <td className="py-4 px-4 font-mono font-medium text-slate-700">
                                                {formatTZS(folio.total_charges_minor)}
                                            </td>
                                            <td className="py-4 px-4 font-mono font-bold text-emerald-700">
                                                {formatTZS(folio.total_payments_minor)}
                                            </td>
                                            <td className="py-4 px-4 font-mono font-bold">
                                                {folio.balance_minor > 0 ? (
                                                    <span className="text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{formatTZS(folio.balance_minor)}</span>
                                                ) : (
                                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">0 TZS</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {folio.status === 'open' ? (
                                                    <span className="bg-sky-100 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Open</span>
                                                ) : folio.status === 'settled' ? (
                                                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Settled</span>
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[11px] font-medium">Closed</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <Link
                                                    href={route('folios.show', folio.id)}
                                                    className="inline-flex items-center space-x-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition active-press"
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
