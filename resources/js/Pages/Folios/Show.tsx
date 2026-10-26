import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Folio, PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Hotel,
    Plus,
    Printer,
    Receipt,
    Send,
    User,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface FolioShowProps extends PageProps {
    folio: Folio;
}

export default function FolioShow({ folio, auth }: FolioShowProps) {
    const [isAddChargeModalOpen, setIsAddChargeModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const guest = folio.reservation?.guest;
    const room = folio.stay?.room;

    const {
        data: chargeData,
        setData: setChargeData,
        post: postCharge,
        processing: postingCharge,
        reset: resetCharge,
    } = useForm({
        line_type: 'restaurant',
        description: '',
        amount: '',
    });

    const {
        data: paymentData,
        setData: setPaymentData,
        post: postPayment,
        processing: recordingPayment,
        reset: resetPayment,
    } = useForm({
        payment_method: 'mpesa',
        amount: folio.balance_minor > 0 ? (folio.balance_minor / 100).toString() : '',
        provider: 'Vodacom M-Pesa',
        provider_ref: '',
        notes: '',
    });

    const formatTZS = (minor: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format(minor / 100);
    };

    const submitCharge = (e: React.FormEvent) => {
        e.preventDefault();
        postCharge(route('folios.charges.store', folio.id), {
            onSuccess: () => {
                setIsAddChargeModalOpen(false);
                resetCharge();
            },
        });
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        postPayment(route('folios.payments.store', folio.id), {
            onSuccess: () => {
                setIsPaymentModalOpen(false);
                resetPayment();
            },
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Folio ${folio.folio_number} - Haula HMS`} />

            {/* Back to Folios */}
            <div className="mb-4 print:hidden">
                <Link
                    href={route('folios.index')}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Folios List</span>
                </Link>
            </div>

            {/* Statement Container (Optimized for Screen and Print) */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 max-w-4xl mx-auto print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
                {/* Printable Header */}
                <div className="border-b border-slate-800 print:border-gray-300 pb-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 print:bg-amber-100 flex items-center justify-center text-amber-400 print:text-amber-600">
                            <Hotel className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white print:text-black tracking-tight">
                                {auth.property?.name || 'Haula Serengeti Safari Lodge'}
                            </h2>
                            <p className="text-xs text-slate-400 print:text-gray-600">
                                Official Guest Folio Statement &bull; TIN: 102-458-999
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition"
                        >
                            <Printer className="w-4 h-4 text-amber-400" />
                            <span>Print Statement</span>
                        </button>

                        <button
                            onClick={() => setIsAddChargeModalOpen(true)}
                            className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition"
                        >
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>Post Charge</span>
                        </button>

                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition"
                        >
                            <CreditCard className="w-4 h-4 stroke-[2.5]" />
                            <span>Record Payment</span>
                        </button>
                    </div>
                </div>

                {/* Folio Metadata & Guest Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 bg-slate-950/60 print:bg-gray-50 p-4 rounded-2xl border border-slate-800 print:border-gray-200 text-xs">
                    <div>
                        <span className="text-slate-400 print:text-gray-500 block font-medium">Guest Name</span>
                        <span className="text-sm font-bold text-white print:text-black mt-0.5 block">
                            {guest ? `${guest.first_name} ${guest.last_name}` : 'Direct Customer'}
                        </span>
                        <span className="text-slate-400 print:text-gray-600 block mt-0.5">
                            {guest?.phone} &bull; {guest?.nationality}
                        </span>
                    </div>

                    <div>
                        <span className="text-slate-400 print:text-gray-500 block font-medium">Room & Reservation</span>
                        <span className="text-sm font-mono font-bold text-amber-400 print:text-amber-700 mt-0.5 block">
                            {room ? `Room ${room.room_number}` : 'N/A'}
                        </span>
                        <span className="text-slate-400 print:text-gray-600 block mt-0.5 font-mono">
                            Ref: {folio.reservation?.ref_no || 'Direct'}
                        </span>
                    </div>

                    <div>
                        <span className="text-slate-400 print:text-gray-500 block font-medium">Folio Status</span>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm font-mono font-bold text-white print:text-black">
                                {folio.folio_number}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                folio.status === 'settled'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                            }`}>
                                {folio.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 print:border-gray-200">
                        <span className="text-[11px] text-slate-400 print:text-gray-600 block">Total Charges</span>
                        <span className="text-base sm:text-lg font-black text-white print:text-black font-mono mt-0.5 block">
                            {formatTZS(folio.total_charges_minor)}
                        </span>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 print:border-gray-200">
                        <span className="text-[11px] text-slate-400 print:text-gray-600 block">Total Payments</span>
                        <span className="text-base sm:text-lg font-black text-emerald-400 print:text-emerald-700 font-mono mt-0.5 block">
                            {formatTZS(folio.total_payments_minor)}
                        </span>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 print:border-gray-200">
                        <span className="text-[11px] text-slate-400 print:text-gray-600 block">Current Balance Due</span>
                        <span className={`text-base sm:text-lg font-black font-mono mt-0.5 block ${
                            folio.balance_minor > 0 ? 'text-rose-400 print:text-red-600' : 'text-emerald-400 print:text-green-700'
                        }`}>
                            {formatTZS(folio.balance_minor)}
                        </span>
                    </div>
                </div>

                {/* Section 1: Itemized Charges */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-black mb-2 flex items-center space-x-1.5">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Itemized Charges</span>
                    </h3>

                    <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-300">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 print:bg-gray-100 text-slate-400 print:text-gray-600 border-b border-slate-800 print:border-gray-300 font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Department</th>
                                    <th className="py-2.5 px-3">Description</th>
                                    <th className="py-2.5 px-3 text-right">Tax (VAT 18%)</th>
                                    <th className="py-2.5 px-3 text-right">Amount (TZS)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 text-slate-200 print:text-black">
                                {folio.lines?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-slate-500">
                                            No charges posted yet.
                                        </td>
                                    </tr>
                                ) : (
                                    folio.lines?.map((line) => (
                                        <tr key={line.id} className="hover:bg-slate-850/40 print:hover:bg-transparent">
                                            <td className="py-2.5 px-3 font-mono">{line.business_date}</td>
                                            <td className="py-2.5 px-3 uppercase text-[10px] tracking-wider font-semibold text-amber-400 print:text-gray-700">
                                                {line.line_type}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium">{line.description}</td>
                                            <td className="py-2.5 px-3 text-right font-mono text-slate-400 print:text-gray-600">
                                                {formatTZS(line.tax_minor)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white print:text-black">
                                                {formatTZS(line.amount_minor)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 2: Payments Recorded */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-black mb-2 flex items-center space-x-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Payments Received</span>
                    </h3>

                    <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-300">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 print:bg-gray-100 text-slate-400 print:text-gray-600 border-b border-slate-800 print:border-gray-300 font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Payment Method</th>
                                    <th className="py-2.5 px-3">Reference / Tx ID</th>
                                    <th className="py-2.5 px-3">Notes</th>
                                    <th className="py-2.5 px-3 text-right">Amount Paid</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 text-slate-200 print:text-black">
                                {folio.payments?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-slate-500">
                                            No payments recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    folio.payments?.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-slate-850/40 print:hover:bg-transparent">
                                            <td className="py-2.5 px-3 font-mono">{payment.business_date}</td>
                                            <td className="py-2.5 px-3 uppercase text-[10px] tracking-wider font-bold text-emerald-400 print:text-green-700">
                                                {payment.payment_method}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-slate-300 print:text-gray-700">
                                                {payment.provider_ref || 'Cash Counter'}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-400 print:text-gray-600">
                                                {payment.notes || '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                                                {formatTZS(payment.amount_minor)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Printable Signature Section */}
                <div className="hidden print:flex items-end justify-between pt-12 border-t border-gray-300 text-xs text-gray-700">
                    <div>
                        <div className="w-48 border-b border-gray-400 mb-1"></div>
                        <span>Guest Signature</span>
                    </div>
                    <div>
                        <div className="w-48 border-b border-gray-400 mb-1"></div>
                        <span>Authorized Hotel Cashier</span>
                    </div>
                </div>
            </div>

            {/* Modal: Post Charge */}
            {isAddChargeModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="font-bold text-white text-sm">Post Charge to Folio {folio.folio_number}</h3>
                            <button onClick={() => setIsAddChargeModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitCharge} className="space-y-4 text-xs">
                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Department / Service Type</label>
                                <select
                                    value={chargeData.line_type}
                                    onChange={(e) => setChargeData('line_type', e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                >
                                    <option value="restaurant">Restaurant / Dining</option>
                                    <option value="bar">Bar & Beverages</option>
                                    <option value="room">Room Night Charge</option>
                                    <option value="tour">Safari Tour / Excursion</option>
                                    <option value="laundry">Laundry & Dry Cleaning</option>
                                    <option value="minibar">Minibar Refill</option>
                                    <option value="miscellaneous">Miscellaneous Service</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Description *</label>
                                <input
                                    type="text"
                                    required
                                    value={chargeData.description}
                                    onChange={(e) => setChargeData('description', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                    placeholder="e.g. Serengeti Lunch Buffet x 2"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Amount (TZS) *</label>
                                <input
                                    type="number"
                                    required
                                    min="100"
                                    value={chargeData.amount}
                                    onChange={(e) => setChargeData('amount', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                                    placeholder="50000"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsAddChargeModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={postingCharge}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg disabled:opacity-50"
                                >
                                    {postingCharge ? 'Posting...' : 'Post Charge'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Record Payment */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="font-bold text-white text-sm">Record Payment for Folio {folio.folio_number}</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitPayment} className="space-y-4 text-xs">
                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Payment Method *</label>
                                <select
                                    value={paymentData.payment_method}
                                    onChange={(e) => setPaymentData('payment_method', e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                >
                                    <option value="mpesa">M-Pesa (Vodacom)</option>
                                    <option value="tigopesa">Tigo Pesa</option>
                                    <option value="airtelmoney">Airtel Money</option>
                                    <option value="cash">Cash Counter</option>
                                    <option value="card">Credit / Debit Card (POS)</option>
                                    <option value="bank_transfer">Bank Wire Transfer</option>
                                    <option value="city_ledger">City Ledger (Corporate Account)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Amount to Pay (TZS) *</label>
                                <input
                                    type="number"
                                    required
                                    min="100"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData('amount', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Reference / Transaction ID</label>
                                <input
                                    type="text"
                                    value={paymentData.provider_ref}
                                    onChange={(e) => setPaymentData('provider_ref', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                                    placeholder="e.g. QWE981248TZ"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">Notes</label>
                                <input
                                    type="text"
                                    value={paymentData.notes}
                                    onChange={(e) => setPaymentData('notes', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                    placeholder="Received at front desk"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={recordingPayment}
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    {recordingPayment ? 'Recording...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
