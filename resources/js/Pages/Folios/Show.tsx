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
import { printThermalReceipt, printA4Invoice, ReceiptData } from '@/Utils/receiptPrinter';

interface FolioShowProps extends PageProps {
    folio: Folio;
}

export default function FolioShow({ folio, auth }: FolioShowProps) {
    const [isAddChargeModalOpen, setIsAddChargeModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isThermalReceiptOpen, setIsThermalReceiptOpen] = useState(false);

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

    const getFolioReceiptData = (type: 'FISCAL RECEIPT' | 'FOLIO STATEMENT' = 'FOLIO STATEMENT'): ReceiptData => {
        const guestName = guest?.full_name || (guest ? `${guest.first_name} ${guest.last_name}` : 'Valued Guest');
        const roomNum = room?.room_number || (folio.reservation as any)?.room?.room_number || undefined;
        
        return {
            hotelName: auth.tenant?.name || auth.property?.name || 'THE INNS HOTEL',
            hotelAddress: auth.property?.address || (auth.tenant as any)?.address || undefined,
            hotelPhone: auth.property?.phone || (auth.tenant as any)?.phone || undefined,
            hotelEmail: (auth.tenant as any)?.email || undefined,
            tin: auth.tenant?.tin || (auth.property?.tax_config as any)?.tin || undefined,
            vrn: auth.tenant?.vrn || undefined,
            receiptNumber: folio.folio_number,
            receiptType: type,
            dateTime: new Date().toLocaleString(),
            cashierName: auth.user?.name || 'Front Desk',
            guestName: guestName,
            roomNumber: roomNum,
            items: (folio.lines && folio.lines.length > 0)
                ? folio.lines.map((l: any) => ({
                    description: l.description || l.line_type || 'Room Charge',
                    quantity: 1,
                    unit_price: l.amount_minor || 0,
                    amount: l.amount_minor || 0,
                }))
                : [{
                    description: 'Hotel Accommodation Charges',
                    quantity: 1,
                    unit_price: folio.total_charges_minor,
                    amount: folio.total_charges_minor,
                }],
            subtotal: folio.total_charges_minor,
            tax: Math.round(folio.total_charges_minor * 0.18),
            taxRatePercent: 18,
            grandTotal: folio.total_charges_minor,
            paymentMethod: folio.payments?.[0]?.payment_method || (folio.balance_minor <= 0 ? 'Settled' : 'Pending'),
            amountPaid: folio.total_payments_minor,
            balanceDue: folio.balance_minor,
            amountsAreMinor: true,
            footerText: auth.tenant?.receipt_footer || undefined,
        };
    };

    const handlePrintA4 = () => {
        printA4Invoice(getFolioReceiptData('FOLIO STATEMENT'));
    };

    const handlePrintThermal = () => {
        printThermalReceipt(getFolioReceiptData('FISCAL RECEIPT'));
    };

    const handlePrintSinglePayment = (payment: any) => {
        const guestName = guest?.full_name || (guest ? `${guest.first_name} ${guest.last_name}` : 'Valued Guest');
        const roomNum = room?.room_number || (folio.reservation as any)?.room?.room_number || undefined;

        printThermalReceipt({
            hotelName: auth.tenant?.name || auth.property?.name || 'THE INNS HOTEL',
            hotelAddress: auth.property?.address || (auth.tenant as any)?.address || undefined,
            hotelPhone: auth.property?.phone || (auth.tenant as any)?.phone || undefined,
            tin: auth.tenant?.tin || (auth.property?.tax_config as any)?.tin || undefined,
            vrn: auth.tenant?.vrn || undefined,
            receiptNumber: payment.receipt_number || `RCP-${payment.id.substring(0, 8).toUpperCase()}`,
            receiptType: 'PAYMENT RECEIPT',
            dateTime: payment.business_date || new Date().toLocaleString(),
            cashierName: auth.user?.name || 'Cashier',
            guestName: guestName,
            roomNumber: roomNum,
            items: [{
                description: `Payment on Folio #${folio.folio_number} (${payment.payment_method})`,
                quantity: 1,
                unit_price: payment.amount_minor,
                amount: payment.amount_minor,
            }],
            subtotal: payment.amount_minor,
            grandTotal: payment.amount_minor,
            paymentMethod: payment.payment_method,
            amountPaid: payment.amount_minor,
            balanceDue: 0,
            amountsAreMinor: true,
            footerText: 'Payment received with thanks!',
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Folio ${folio.folio_number} - THE INNS`} />

            {/* Back to Folios */}
            <div className="mb-4 print:hidden">
                <Link
                    href={route('folios.index')}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Folios List</span>
                </Link>
            </div>

            {/* Statement Container (Pure White Luxury) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-8 max-w-4xl mx-auto print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
                {/* Header */}
                <div className="border-b border-slate-100 pb-5 mb-5 sm:pb-6 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                        
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                {auth.tenant?.name || auth.property?.name || 'Hotel Property'}
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-500">
                                {auth.tenant?.receipt_header || 'Official Guest Folio Statement'} | TIN: {auth.tenant?.tin || (auth.property?.tax_config as any)?.tin || '102-458-999'}
                                {auth.tenant?.vrn ? ` | VRN: ${auth.tenant.vrn}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 print:hidden w-full sm:w-auto">
                        <button
                            onClick={() => setIsThermalReceiptOpen(true)}
                            className="inline-flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-bold px-3 py-2 rounded-xl text-xs transition active-press cursor-pointer flex-1 sm:flex-none justify-center"
                        >
                            <Receipt className="w-4 h-4 text-sky-700" />
                            <span>Thermal Slip</span>
                        </button>

                        <button
                            onClick={handlePrintA4}
                            className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-2 rounded-xl text-xs transition active-press cursor-pointer shadow-xs flex-1 sm:flex-none justify-center"
                        >
                            
                            <span>Print A4</span>
                        </button>

                        <button
                            onClick={() => setIsAddChargeModalOpen(true)}
                            className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-2 rounded-xl text-xs transition active-press cursor-pointer shadow-xs flex-1 sm:flex-none justify-center"
                        >
                            
                            <span>Post Charge</span>
                        </button>

                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shadow-xs transition active-press cursor-pointer flex-1 sm:flex-none justify-center"
                        >
                            <CreditCard className="w-4 h-4 stroke-[2.5]" />
                            <span>Record Payment</span>
                        </button>
                    </div>
                </div>

                {/* Folio Metadata & Guest Info (White Card) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6 bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                        <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Guest Name</span>
                        <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                            {guest ? `${guest.first_name} ${guest.last_name}` : 'Direct Customer'}
                        </span>
                        <span className="text-slate-500 block mt-0.5 font-medium">
                            {guest?.phone} &bull; {guest?.nationality}
                        </span>
                    </div>

                    <div>
                        <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Room & Reservation</span>
                        <span className="text-sm font-mono font-bold text-sky-800 mt-0.5 block">
                            {room ? `Room ${room.room_number}` : 'N/A'}
                        </span>
                        <span className="text-slate-500 block mt-0.5 font-mono">
                            Ref: {folio.reservation?.ref_no || 'Direct'}
                        </span>
                    </div>

                    <div>
                        <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Folio Status</span>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm font-mono font-bold text-slate-900">
                                {folio.folio_number}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                folio.status === 'settled'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-sky-100 text-sky-800 border border-sky-200'
                            }`}>
                                {folio.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Financial Summary Cards - 1 Col on Mobile, 3 on Desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-[11px] text-slate-500 block font-semibold uppercase">Total Charges</span>
                        <span className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5 block">
                            {formatTZS(folio.total_charges_minor)}
                        </span>
                    </div>

                    <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-xs">
                        <span className="text-[11px] text-emerald-800 block font-semibold uppercase">Total Payments</span>
                        <span className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-0.5 block">
                            {formatTZS(folio.total_payments_minor)}
                        </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-[11px] text-slate-500 block font-semibold uppercase">Current Balance Due</span>
                        <span className={`text-base sm:text-lg font-black font-mono mt-0.5 block ${
                            folio.balance_minor > 0 ? 'text-sky-800' : 'text-emerald-700'
                        }`}>
                            {formatTZS(folio.balance_minor)}
                        </span>
                    </div>
                </div>

                {/* Section 1: Itemized Charges */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center space-x-1.5">
                        <Receipt className="w-3.5 h-3.5 text-sky-600" />
                        <span>Itemized Charges</span>
                    </h3>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Department</th>
                                    <th className="py-2.5 px-3">Description</th>
                                    <th className="py-2.5 px-3 text-right">Tax (VAT 18%)</th>
                                    <th className="py-2.5 px-3 text-right">Amount (TZS)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800">
                                {folio.lines?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-slate-400">
                                            No charges posted yet.
                                        </td>
                                    </tr>
                                ) : (
                                    folio.lines?.map((line) => (
                                        <tr key={line.id} className="hover:bg-slate-50/80">
                                            <td className="py-2.5 px-3 font-mono text-slate-600">{line.business_date}</td>
                                            <td className="py-2.5 px-3 uppercase text-[10px] tracking-wider font-bold text-sky-800">
                                                {line.line_type}
                                            </td>
                                            <td className="py-2.5 px-3 font-semibold text-slate-900">{line.description}</td>
                                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                                                {formatTZS(line.tax_minor)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center space-x-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Payments Received</span>
                    </h3>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Payment Method</th>
                                    <th className="py-2.5 px-3">Reference / Tx ID</th>
                                    <th className="py-2.5 px-3">Notes</th>
                                    <th className="py-2.5 px-3 text-right">Amount Paid</th>
                                    <th className="py-2.5 px-3 text-center print:hidden">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800">
                                {folio.payments?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-4 text-center text-slate-400">
                                            No payments recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    folio.payments?.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-slate-50/80">
                                            <td className="py-2.5 px-3 font-mono text-slate-600">{payment.business_date}</td>
                                            <td className="py-2.5 px-3 uppercase text-[10px] tracking-wider font-bold text-emerald-700">
                                                {payment.payment_method}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-slate-700">
                                                {payment.provider_ref || 'Cash Counter'}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500">
                                                {payment.notes || '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                                {formatTZS(payment.amount_minor)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center print:hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePrintSinglePayment(payment)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                                    title="Print Payment Thermal Receipt"
                                                >
                                                    <Printer className="w-3 h-3 text-slate-600" />
                                                    <span>Receipt</span>
                                                </button>
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

            {/* Modal: Post Charge (White) */}
            {isAddChargeModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-slate-900 text-sm">Post Charge to Folio {folio.folio_number}</h3>
                            <button onClick={() => setIsAddChargeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitCharge} className="space-y-4 text-xs">
                            <div>
                                <label className="text-slate-700 font-semibold block mb-1">Department / Service Type</label>
                                <select
                                    value={chargeData.line_type}
                                    onChange={(e) => setChargeData('line_type', e.target.value as any)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-xs"
                                >
                                    <option value="restaurant">Restaurant / Dining</option>
                                    <option value="grocery">Grocery / Minimart</option>
                                    <option value="bar">Bar & Beverages</option>
                                    <option value="room">Room Night Charge</option>
                                    <option value="tour">Safari Tour / Excursion</option>
                                    <option value="laundry">Laundry & Dry Cleaning</option>
                                    <option value="minibar">Minibar Refill</option>
                                    <option value="miscellaneous">Miscellaneous Service</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-slate-700 font-semibold block mb-1">Description *</label>
                                <input
                                    type="text"
                                    required
                                    value={chargeData.description}
                                    onChange={(e) => setChargeData('description', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-xs"
                                    placeholder="e.g. Serengeti Lunch Buffet x 2"
                                />
                            </div>

                            <div>
                                <label className="text-slate-700 font-semibold block mb-1">Amount (TZS) *</label>
                                <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                                    <span className="bg-slate-100 px-3 py-2 text-slate-600 font-mono font-bold flex items-center border-r border-slate-200">
                                        TZS
                                    </span>
                                    <input
                                        type="number"
                                        required
                                        min="100"
                                        value={chargeData.amount}
                                        onChange={(e) => setChargeData('amount', e.target.value)}
                                        className="w-full bg-white border-0 px-3 py-2 text-slate-900 font-mono font-bold focus:ring-0"
                                        placeholder="50000"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddChargeModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={postingCharge}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl shadow-md disabled:opacity-50 active-press cursor-pointer"
                                >
                                    {postingCharge ? 'Posting...' : 'Post Charge'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Record Payment (White) */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-slate-900 text-sm">Record Payment for Folio {folio.folio_number}</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitPayment} className="space-y-4 text-xs">
                            <div>
                                <label className="text-slate-700 font-semibold block mb-1">Payment Method *</label>
                                <select
                                    value={paymentData.payment_method}
                                    onChange={(e) => setPaymentData('payment_method', e.target.value as any)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-xs"
                                >
                                    <option value="mpesa">M-Pesa (Vodacom Tanzania)</option>
                                    <option value="tigopesa">Tigo Pesa</option>
                                    <option value="airtelmoney">Airtel Money</option>
                                    <option value="cash">Cash Counter</option>
                                    <option value="card">Credit / Debit Card (POS)</option>
                                    <option value="bank_transfer">Bank Wire Transfer</option>
                                    <option value="city_ledger">City Ledger (Corporate Account)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-slate-700 font-semibold block mb-1">Amount to Pay (TZS) *</label>
                                <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                                    <span className="bg-slate-100 px-3 py-2 text-slate-600 font-mono font-bold flex items-center border-r border-slate-200">
                                        TZS
                                    </span>
                                    <input
                                        type="number"
                                        required
                                        min="100"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData('amount', e.target.value)}
                                        className="w-full bg-white border-0 px-3 py-2 text-slate-900 font-mono font-bold focus:ring-0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-700 font-semibold block mb-1">Reference / Transaction ID</label>
                                <input
                                    type="text"
                                    value={paymentData.provider_ref}
                                    onChange={(e) => setPaymentData('provider_ref', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-xs"
                                    placeholder="e.g. QWE981248TZ"
                                />
                            </div>

                            <div>
                                <label className="text-slate-700 font-semibold block mb-1">Notes</label>
                                <input
                                    type="text"
                                    value={paymentData.notes}
                                    onChange={(e) => setPaymentData('notes', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-xs"
                                    placeholder="Received at front desk"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={recordingPayment}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 active-press cursor-pointer"
                                >
                                    {recordingPayment ? 'Recording...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: 80mm ESC/POS Thermal Receipt Live Preview */}
            {isThermalReceiptOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center">
                        <div className="flex items-center justify-between w-full pb-3 border-b border-slate-100 mb-4">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                                <Receipt className="w-4 h-4 text-sky-600" />
                                <span>80mm Thermal Receipt</span>
                            </span>
                            <button onClick={() => setIsThermalReceiptOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 80mm Thermal Paper Simulation Container */}
                        <div id="thermal-receipt-area" className="w-[280px] bg-white border-2 border-dashed border-slate-300 p-4 font-mono text-[11px] text-slate-900 leading-tight shadow-inner rounded-sm">
                            <div className="text-center pb-2 border-b border-dashed border-slate-300">
                                <h4 className="font-extrabold text-xs uppercase tracking-wider">{auth.tenant?.name || auth.property?.name || 'HOTEL RECEIPT'}</h4>
                                <p className="text-[10px] text-slate-600">{auth.tenant?.address || auth.property?.address || 'P.O. BOX 1042, SERONERA, TZ'}{auth.tenant?.city ? `, ${auth.tenant.city}` : ''}</p>
                                <p className="text-[10px] text-slate-600">
                                    TIN: {auth.tenant?.tin || (auth.property?.tax_config as any)?.tin || '102-458-999'}
                                    {auth.tenant?.vrn ? ` | VRN: ${auth.tenant.vrn}` : ''}
                                </p>
                                <p className="text-[10px] text-slate-600">TEL: {auth.tenant?.phone || auth.property?.phone || '+255 754 000 111'}</p>
                            </div>

                            <div className="py-2 border-b border-dashed border-slate-300 text-[10px]">
                                <div className="flex justify-between">
                                    <span>RCV NO:</span>
                                    <span className="font-bold">{folio.folio_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>DATE:</span>
                                    <span>{new Date().toISOString().split('T')[0]}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ROOM:</span>
                                    <span className="font-bold">{room ? room.room_number : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>GUEST:</span>
                                    <span className="font-bold truncate max-w-[140px]">{guest?.first_name} {guest?.last_name}</span>
                                </div>
                            </div>

                            <div className="py-2 border-b border-dashed border-slate-300">
                                <div className="flex justify-between font-bold text-[10px] mb-1">
                                    <span>DESCRIPTION</span>
                                    <span>AMT (TZS)</span>
                                </div>
                                {folio.lines?.map((line) => (
                                    <div key={line.id} className="flex justify-between text-[10px] py-0.5">
                                        <span className="truncate max-w-[170px]">{line.description}</span>
                                        <span className="font-bold">{(line.amount_minor / 100).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="py-2 border-b border-dashed border-slate-300 text-[10px]">
                                <div className="flex justify-between">
                                    <span>SUBTOTAL:</span>
                                    <span>{formatTZS(folio.total_charges_minor - Math.round(folio.total_charges_minor * 0.18))}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>VAT (18% INCL):</span>
                                    <span>{formatTZS(Math.round(folio.total_charges_minor * 0.18))}</span>
                                </div>
                                <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-200 mt-1">
                                    <span>TOTAL BILL:</span>
                                    <span>{formatTZS(folio.total_charges_minor)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-emerald-700">
                                    <span>PAID:</span>
                                    <span>{formatTZS(folio.total_payments_minor)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-sky-800">
                                    <span>BALANCE:</span>
                                    <span>{formatTZS(folio.balance_minor)}</span>
                                </div>
                            </div>

                            <div className="text-center pt-3 text-[9px] text-slate-500">
                                <div className="w-16 h-16 border border-slate-300 mx-auto flex items-center justify-center bg-slate-50 text-[8px] font-bold text-slate-400 mb-1">
                                    [TRA QR]
                                </div>
                                <p className="font-bold">{auth.tenant?.receipt_header || 'VERIFIED FISCAL RECEIPT'}</p>
                                <p>{auth.tenant?.receipt_footer || `Thank you for staying with us at ${auth.tenant?.name || 'our hotel'}!`}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 w-full mt-4">
                            <button
                                onClick={() => setIsThermalReceiptOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrintThermal}
                                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition active-press cursor-pointer flex items-center justify-center space-x-1"
                            >
                                
                                <span>Print 80mm</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
