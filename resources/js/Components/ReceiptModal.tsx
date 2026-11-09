import React, { useState } from 'react';
import { printThermalReceipt, printA4Invoice, ReceiptData } from '@/Utils/receiptPrinter';
import { Printer, Receipt, FileText, X, Check, Copy } from 'lucide-react';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptData: ReceiptData;
    title?: string;
}

export default function ReceiptModal({
    isOpen,
    onClose,
    receiptData,
    title = 'Receipt & Invoice Printing'
}: ReceiptModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const isMinor = receiptData.amountsAreMinor ?? false;
    const formatCurrency = (val: number) => {
        const num = isMinor ? Math.round(val / 100) : Math.round(val);
        return num.toLocaleString();
    };

    const handleCopySummary = () => {
        const text = `${receiptData.hotelName}\nReceipt: ${receiptData.receiptNumber}\nDate: ${receiptData.dateTime || new Date().toLocaleString()}\nGuest: ${receiptData.guestName || 'Valued Guest'}\nTotal: TZS ${formatCurrency(receiptData.grandTotal)}\nStatus: Paid`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
                            <p className="text-xs text-slate-500 font-mono">#{receiptData.receiptNumber}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Receipt Preview (Thermal 80mm Style) */}
                <div className="p-6 overflow-y-auto bg-slate-100 flex-1">
                    <div className="max-w-[320px] mx-auto bg-white p-5 rounded-2xl shadow-md border border-slate-200 font-mono text-xs text-slate-800 space-y-3">
                        <div className="text-center space-y-0.5">
                            <div className="font-extrabold text-sm uppercase tracking-wide text-slate-900">{receiptData.hotelName}</div>
                            {receiptData.hotelAddress && <div className="text-[10px] text-slate-500">{receiptData.hotelAddress}</div>}
                            {receiptData.hotelPhone && <div className="text-[10px] text-slate-500">Tel: {receiptData.hotelPhone}</div>}
                            {(receiptData.tin || receiptData.vrn) && (
                                <div className="text-[10px] text-slate-600 font-bold pt-1">
                                    {receiptData.tin && `TIN: ${receiptData.tin} `}
                                    {receiptData.vrn && `VRN: ${receiptData.vrn}`}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-2 text-center font-bold text-xs uppercase text-slate-900">
                            {receiptData.receiptType || 'PAYMENT RECEIPT'}
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-2 text-[11px] space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Receipt #:</span>
                                <span className="font-bold">{receiptData.receiptNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Date:</span>
                                <span>{receiptData.dateTime || new Date().toLocaleDateString()}</span>
                            </div>
                            {receiptData.guestName && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Guest:</span>
                                    <span className="font-bold truncate max-w-[170px]">{receiptData.guestName}</span>
                                </div>
                            )}
                            {receiptData.roomNumber && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Room:</span>
                                    <span className="font-bold">{receiptData.roomNumber}</span>
                                </div>
                            )}
                            {receiptData.tableName && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Outlet / Table:</span>
                                    <span className="font-bold">{receiptData.tableName}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-2">
                            <table className="w-full text-[11px]">
                                <thead>
                                    <tr className="border-b border-dashed border-slate-300 text-slate-500">
                                        <th className="text-left pb-1">Item</th>
                                        <th className="text-right pb-1">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {receiptData.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-1 pr-1">
                                                <div className="font-semibold text-slate-900">{item.description}</div>
                                                {item.quantity > 1 && (
                                                    <div className="text-[10px] text-slate-400">{item.quantity} x {formatCurrency(item.unit_price)}</div>
                                                )}
                                            </td>
                                            <td className="py-1 text-right font-bold align-top">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal:</span>
                                <span>TZS {formatCurrency(receiptData.subtotal)}</span>
                            </div>
                            {receiptData.tax !== undefined && receiptData.tax > 0 && (
                                <div className="flex justify-between text-slate-600">
                                    <span>VAT ({receiptData.taxRatePercent || 18}%):</span>
                                    <span>TZS {formatCurrency(receiptData.tax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-extrabold text-sm border-t border-double border-slate-300 pt-1.5 text-slate-900">
                                <span>TOTAL:</span>
                                <span>TZS {formatCurrency(receiptData.grandTotal)}</span>
                            </div>
                            {receiptData.amountPaid !== undefined && (
                                <div className="flex justify-between text-emerald-700 font-bold pt-1">
                                    <span>Paid ({receiptData.paymentMethod || 'Cash'}):</span>
                                    <span>TZS {formatCurrency(receiptData.amountPaid)}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-500 space-y-0.5">
                            <div>Thank you for choosing {receiptData.hotelName}!</div>
                            <div className="font-semibold">Karibu Tena!</div>
                        </div>
                    </div>
                </div>

                {/* Print Actions Toolbar */}
                <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleCopySummary}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer w-full sm:w-auto justify-center"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Summary Copied' : 'Copy Text'}</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => printA4Invoice(receiptData)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                        >
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span>Print A4 Invoice</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => printThermalReceipt(receiptData)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print 80mm Receipt</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

