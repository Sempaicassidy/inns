import React, { useState } from 'react';
import { printThermalReceipt, printKOTReceipt, printA4Invoice, ReceiptData } from '@/Utils/receiptPrinter';
import { Printer, Receipt, FileText, X, Check, Copy, ChefHat, Eye } from 'lucide-react';

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
    title = 'Order Receipt & Kitchen Dispatch'
}: ReceiptModalProps) {
    const [copied, setCopied] = useState(false);
    const [previewMode, setPreviewMode] = useState<'receipt' | 'kot'>('receipt');

    if (!isOpen) return null;

    const isMinor = receiptData.amountsAreMinor ?? false;
    const formatCurrency = (val: number) => {
        const num = isMinor ? Math.round(val / 100) : Math.round(val);
        return num.toLocaleString();
    };

    const handleCopySummary = () => {
        const text = `${receiptData.hotelName}\nReceipt: ${receiptData.receiptNumber}\nDate: ${receiptData.dateTime || new Date().toLocaleString()}\nGuest: ${receiptData.guestName || 'Valued Guest'}\nTotal: TZS ${formatCurrency(receiptData.grandTotal)}\nStatus: Settled`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const outletName = receiptData.tableName || (receiptData.roomNumber ? `Room ${receiptData.roomNumber}` : 'Direct Order');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
                            <p className="text-xs text-slate-500 font-mono">#{receiptData.receiptNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Switch Preview Mode */}
                        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setPreviewMode('receipt')}
                                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                    previewMode === 'receipt'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Receipt
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewMode('kot')}
                                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                                    previewMode === 'kot'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                                <span>KOT</span>
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Receipt Preview (Thermal 80mm Style) */}
                <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1">
                    {previewMode === 'receipt' ? (
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

                            <div className="border-t border-dashed border-slate-300 pt-2 text-center font-bold text-xs uppercase text-slate-900 tracking-wider">
                                {receiptData.receiptType || 'PAYMENT RECEIPT'}
                            </div>

                            <div className="border-t border-dashed border-slate-300 pt-2 text-[11px] space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Receipt #:</span>
                                    <span className="font-bold">{receiptData.receiptNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Date:</span>
                                    <span>{receiptData.dateTime || new Date().toLocaleString()}</span>
                                </div>
                                {(receiptData.cashierName || receiptData.serverName) && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Server:</span>
                                        <span className="font-bold">{receiptData.serverName || receiptData.cashierName}</span>
                                    </div>
                                )}
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
                                        <span className="text-slate-500">Table / Outlet:</span>
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
                                                <td className="py-1.5 pr-1">
                                                    <div className="font-semibold text-slate-900">{item.description}</div>
                                                    {item.quantity > 1 && (
                                                        <div className="text-[10px] text-slate-400">{item.quantity} x {formatCurrency(item.unit_price)}</div>
                                                    )}
                                                    {item.notes && (
                                                        <div className="text-[10px] text-amber-700 italic">Note: {item.notes}</div>
                                                    )}
                                                </td>
                                                <td className="py-1.5 text-right font-bold align-top">
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
                                {receiptData.discount !== undefined && receiptData.discount > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discount:</span>
                                        <span>- TZS {formatCurrency(receiptData.discount)}</span>
                                    </div>
                                )}
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
                                {receiptData.balanceDue !== undefined && receiptData.balanceDue !== 0 && (
                                    <div className="flex justify-between text-slate-700 font-bold">
                                        <span>{receiptData.balanceDue > 0 ? 'Balance Due:' : 'Change Returned:'}</span>
                                        <span>TZS {formatCurrency(Math.abs(receiptData.balanceDue))}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-500 space-y-0.5">
                                <div>Thank you for choosing {receiptData.hotelName}!</div>
                                <div className="font-semibold text-slate-700">Karibu Tena!</div>
                            </div>
                        </div>
                    ) : (
                        /* KOT Preview */
                        <div className="max-w-[320px] mx-auto bg-amber-50/50 p-5 rounded-2xl shadow-md border-2 border-dashed border-amber-300 font-mono text-xs text-slate-900 space-y-3">
                            <div className="text-center p-2 border border-slate-900 font-extrabold text-xs tracking-wider">
                                *** KITCHEN ORDER TICKET (KOT) ***
                            </div>

                            <div className="text-center font-black text-sm bg-slate-900 text-white py-1 rounded">
                                {outletName}
                            </div>

                            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Order #:</span>
                                    <span className="font-bold">{receiptData.receiptNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Time:</span>
                                    <span>{receiptData.dateTime || new Date().toLocaleTimeString()}</span>
                                </div>
                                {(receiptData.serverName || receiptData.cashierName) && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Server:</span>
                                        <span className="font-bold">{receiptData.serverName || receiptData.cashierName}</span>
                                    </div>
                                )}
                                {receiptData.guestName && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Guest:</span>
                                        <span className="font-bold">{receiptData.guestName}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 py-1">
                                <div className="font-bold text-[11px] text-slate-700 uppercase tracking-wide">
                                    Items to Prepare ({receiptData.items.reduce((acc, it) => acc + (it.quantity || 1), 0)} pcs):
                                </div>
                                {receiptData.items.map((it, idx) => (
                                    <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-black text-xs text-slate-900">
                                                [ {it.quantity}x ] {it.description}
                                            </span>
                                            <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                                        </div>
                                        {it.notes && (
                                            <div className="mt-1 text-[10px] font-bold text-amber-800 bg-amber-100/60 p-1 rounded">
                                                * {it.notes}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {receiptData.notes && (
                                <div className="p-2 bg-white rounded-lg border border-slate-300 text-[11px]">
                                    <span className="font-bold uppercase text-[10px] text-slate-500 block">General Notes:</span>
                                    <p className="text-slate-800">{receiptData.notes}</p>
                                </div>
                            )}

                            <div className="text-center font-bold text-[10px] text-slate-600 pt-2 border-t border-dashed border-slate-400">
                                *** DISPATCH TO KITCHEN / BAR ***
                            </div>
                        </div>
                    )}
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

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={() => printKOTReceipt(receiptData)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-200 transition cursor-pointer shadow-2xs"
                        >
                            <ChefHat className="w-4 h-4 text-amber-700" />
                            <span>Print Kitchen KOT</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => printA4Invoice(receiptData)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                        >
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span>Print A4 Invoice</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => printThermalReceipt(receiptData)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
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
