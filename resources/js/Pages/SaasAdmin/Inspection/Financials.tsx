import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import React from 'react';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    DollarSign,
    Eye,
    Receipt,
    Shield,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';

interface TenantFinancialRow {
    tenant_id: string;
    tenant_name: string;
    plan: string;
    is_active: boolean;
    branches_count: number;
    recognized_revenue: number;
    lodging_revenue: number;
    pos_revenue: number;
    total_expenses: number;
    total_collections: number;
    total_receivables: number;
    net_operating_profit: number;
}

interface FinancialTotals {
    total_recognized_revenue: number;
    total_expenses: number;
    total_collections: number;
    total_receivables: number;
    total_net_operating_profit: number;
}

interface Props extends PageProps {
    financials: {
        rows: TenantFinancialRow[];
        totals: FinancialTotals;
    };
}

export default function CrossTenantFinancials({ financials }: Props) {
    const { rows, totals } = financials;

    return (
        <AuthenticatedLayout>
            <Head title="Cross-Tenant Financial Performance Monitoring - Super Admin" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Back Link */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route('saas-admin.inspection.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Global Tenant Directory
                    </Link>

                    <Link
                        href={route('saas-admin.inspection.timeline')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
                    >
                        Global Timeline →
                    </Link>
                </div>

                {/* Header */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/60">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Platform Financial Intelligence
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Cross-Tenant Financial Monitoring Matrix
                    </h1>
                    <p className="text-sm text-slate-300 max-w-2xl mt-1">
                        High-level surveillance of recognized revenues, expenses, operating profits, collections, and receivables across all registered hotel and lodge properties.
                    </p>
                </div>

                {/* Totals KPI Deck */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-slate-500 uppercase">Platform Revenue</div>
                        <div className="text-2xl font-black text-emerald-700 mt-2">
                            TZS {totals.total_recognized_revenue.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">Recognized transactions</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-slate-500 uppercase">Operating Expenses</div>
                        <div className="text-2xl font-black text-rose-700 mt-2">
                            TZS {totals.total_expenses.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">Authorized cost vouchers</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-slate-500 uppercase">Net Operating Profit</div>
                        <div className={`text-2xl font-black mt-2 ${totals.total_net_operating_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            TZS {totals.total_net_operating_profit.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">Aggregated platform yield</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-slate-500 uppercase">Total Collections</div>
                        <div className="text-2xl font-black text-blue-700 mt-2">
                            TZS {totals.total_collections.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">Cash & electronic tender</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-slate-500 uppercase">Receivables</div>
                        <div className="text-2xl font-black text-amber-700 mt-2">
                            TZS {totals.total_receivables.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">Unsettled guest folios</div>
                    </div>
                </div>

                {/* Matrix Table */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                            Tenant Financial Breakdown ({rows.length} Tenants)
                        </h3>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3.5">Business Tenant</th>
                                    <th className="px-3 py-3.5">Plan</th>
                                    <th className="px-3 py-3.5">Branches</th>
                                    <th className="px-4 py-3.5">Recognized Revenue</th>
                                    <th className="px-4 py-3.5">Lodging / POS Split</th>
                                    <th className="px-4 py-3.5">Expenses</th>
                                    <th className="px-4 py-3.5">Net Profit</th>
                                    <th className="px-4 py-3.5">Collections</th>
                                    <th className="px-4 py-3.5">Receivables</th>
                                    <th className="px-4 py-3.5 text-right">Drill-Down</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                                            No tenant financial records available.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((r) => (
                                        <tr key={r.tenant_id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-slate-900">{r.tenant_name}</div>
                                                <div className="text-[11px] text-slate-400 font-mono">{r.tenant_id.substring(0, 8)}...</div>
                                            </td>

                                            <td className="px-3 py-3.5">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700">
                                                    {r.plan}
                                                </span>
                                            </td>

                                            <td className="px-3 py-3.5 font-semibold text-slate-800">
                                                {r.branches_count}
                                            </td>

                                            <td className="px-4 py-3.5 font-black text-slate-900">
                                                TZS {r.recognized_revenue.toLocaleString()}
                                            </td>

                                            <td className="px-4 py-3.5 text-xs text-slate-500 space-y-0.5">
                                                <div>Ldg: <span className="font-semibold text-slate-700">TZS {r.lodging_revenue.toLocaleString()}</span></div>
                                                <div>POS: <span className="font-semibold text-slate-700">TZS {r.pos_revenue.toLocaleString()}</span></div>
                                            </td>

                                            <td className="px-4 py-3.5 font-bold text-rose-600">
                                                TZS {r.total_expenses.toLocaleString()}
                                            </td>

                                            <td className="px-4 py-3.5 font-black">
                                                <span className={r.net_operating_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                                    TZS {r.net_operating_profit.toLocaleString()}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 font-semibold text-blue-700">
                                                TZS {r.total_collections.toLocaleString()}
                                            </td>

                                            <td className="px-4 py-3.5 font-semibold text-amber-700">
                                                TZS {r.total_receivables.toLocaleString()}
                                            </td>

                                            <td className="px-4 py-3.5 text-right">
                                                <Link
                                                    href={route('saas-admin.inspection.show', { tenant: r.tenant_id, section: 'financials' })}
                                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Audit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
