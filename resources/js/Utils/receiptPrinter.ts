/**
 * Receipt & Invoice Isolated Printing Engine
 * Creates a hidden sandbox iframe to print clean receipts without rendering the main web application UI.
 */

export interface ReceiptItem {
    description: string;
    quantity: number;
    unit_price: number; // in whole shillings or minor, specified by amountMinor
    amount: number;     // in whole shillings or minor
}

export interface ReceiptData {
    hotelName: string;
    hotelAddress?: string;
    hotelPhone?: string;
    hotelEmail?: string;
    tin?: string;
    vrn?: string;
    receiptNumber: string;
    receiptType?: 'FISCAL RECEIPT' | 'TAX INVOICE' | 'PAYMENT RECEIPT' | 'FOLIO STATEMENT' | 'POS RECEIPT';
    dateTime?: string;
    cashierName?: string;
    guestName?: string;
    roomNumber?: string;
    tableName?: string;
    items: ReceiptItem[];
    subtotal: number;
    tax?: number;
    taxRatePercent?: number;
    serviceCharge?: number;
    discount?: number;
    grandTotal: number;
    paymentMethod?: string;
    amountPaid?: number;
    balanceDue?: number;
    notes?: string;
    footerText?: string;
    amountsAreMinor?: boolean; // if true, divides amounts by 100
}

const formatCurrency = (val: number, isMinor: boolean = false): string => {
    const num = isMinor ? Math.round(val / 100) : Math.round(val);
    return num.toLocaleString();
};

/**
 * Print 80mm Thermal Receipt via an isolated iframe
 */
export function printThermalReceipt(data: ReceiptData): void {
    const isMinor = data.amountsAreMinor ?? false;
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
        document.body.removeChild(printFrame);
        window.print();
        return;
    }

    const nowStr = data.dateTime || new Date().toLocaleString();
    const typeTitle = data.receiptType || 'PAYMENT RECEIPT';

    const itemsHtml = data.items.map(item => `
        <tr>
            <td style="padding: 2px 0; text-align: left; vertical-align: top; word-break: break-word;">
                ${escapeHtml(item.description)}
                ${item.quantity > 1 ? `<br><small style="color: #444;">${item.quantity} x TZS ${formatCurrency(item.unit_price, isMinor)}</small>` : ''}
            </td>
            <td style="padding: 2px 0; text-align: right; vertical-align: top; white-space: nowrap; font-weight: bold;">
                ${formatCurrency(item.amount, isMinor)}
            </td>
        </tr>
    `).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${escapeHtml(data.receiptNumber)}</title>
            <style>
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: 'Courier New', Courier, monospace, monospace;
                    font-size: 11px;
                    line-height: 1.25;
                    color: #000;
                    background: #fff;
                    width: 76mm;
                    margin: 0 auto;
                    padding: 3mm 2mm 8mm 2mm;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .font-bold { font-weight: bold; }
                .uppercase { text-transform: uppercase; }
                .divider {
                    border-top: 1px dashed #000;
                    margin: 4px 0;
                }
                .double-divider {
                    border-top: 1px double #000;
                    margin: 4px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .meta-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2px;
                }
                .summary-table td {
                    padding: 1.5px 0;
                }
                .footer {
                    margin-top: 8px;
                    text-align: center;
                    font-size: 10px;
                }
            </style>
        </head>
        <body>
            <div class="text-center font-bold" style="font-size: 14px; letter-spacing: 0.5px; margin-bottom: 2px;">
                ${escapeHtml(data.hotelName)}
            </div>
            ${data.hotelAddress ? `<div class="text-center" style="font-size: 10px;">${escapeHtml(data.hotelAddress)}</div>` : ''}
            ${data.hotelPhone ? `<div class="text-center" style="font-size: 10px;">Tel: ${escapeHtml(data.hotelPhone)}</div>` : ''}
            ${data.hotelEmail ? `<div class="text-center" style="font-size: 10px;">Email: ${escapeHtml(data.hotelEmail)}</div>` : ''}
            
            ${(data.tin || data.vrn) ? `
                <div class="text-center" style="font-size: 10px; margin-top: 2px;">
                    ${data.tin ? `TIN: <b>${escapeHtml(data.tin)}</b> ` : ''}
                    ${data.vrn ? `VRN: <b>${escapeHtml(data.vrn)}</b>` : ''}
                </div>
            ` : ''}

            <div class="divider"></div>
            
            <div class="text-center font-bold uppercase" style="font-size: 12px; margin: 3px 0;">
                ${escapeHtml(typeTitle)}
            </div>

            <div class="divider"></div>

            <div class="meta-row">
                <span>Receipt #:</span>
                <span class="font-bold">${escapeHtml(data.receiptNumber)}</span>
            </div>
            <div class="meta-row">
                <span>Date & Time:</span>
                <span>${escapeHtml(nowStr)}</span>
            </div>
            ${data.cashierName ? `
                <div class="meta-row">
                    <span>Cashier / Staff:</span>
                    <span>${escapeHtml(data.cashierName)}</span>
                </div>
            ` : ''}
            ${data.guestName ? `
                <div class="meta-row">
                    <span>Guest:</span>
                    <span class="font-bold">${escapeHtml(data.guestName)}</span>
                </div>
            ` : ''}
            ${data.roomNumber ? `
                <div class="meta-row">
                    <span>Room #:</span>
                    <span class="font-bold">${escapeHtml(data.roomNumber)}</span>
                </div>
            ` : ''}
            ${data.tableName ? `
                <div class="meta-row">
                    <span>Table / Order:</span>
                    <span class="font-bold">${escapeHtml(data.tableName)}</span>
                </div>
            ` : ''}

            <div class="divider"></div>

            <table>
                <thead>
                    <tr style="border-bottom: 1px dashed #000;">
                        <th style="text-align: left; padding: 2px 0;">ITEM</th>
                        <th style="text-align: right; padding: 2px 0;">AMOUNT (TZS)</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="divider"></div>

            <table class="summary-table">
                <tr>
                    <td class="text-left">Subtotal:</td>
                    <td class="text-right font-bold">TZS ${formatCurrency(data.subtotal, isMinor)}</td>
                </tr>
                ${data.discount && data.discount > 0 ? `
                    <tr>
                        <td class="text-left">Discount:</td>
                        <td class="text-right">- TZS ${formatCurrency(data.discount, isMinor)}</td>
                    </tr>
                ` : ''}
                ${data.tax && data.tax > 0 ? `
                    <tr>
                        <td class="text-left">VAT / Tax (${data.taxRatePercent || 18}%):</td>
                        <td class="text-right">TZS ${formatCurrency(data.tax, isMinor)}</td>
                    </tr>
                ` : ''}
                ${data.serviceCharge && data.serviceCharge > 0 ? `
                    <tr>
                        <td class="text-left">Service Charge:</td>
                        <td class="text-right">TZS ${formatCurrency(data.serviceCharge, isMinor)}</td>
                    </tr>
                ` : ''}
                <tr style="border-top: 1px double #000; font-size: 13px;">
                    <td class="text-left font-bold" style="padding-top: 4px;">TOTAL:</td>
                    <td class="text-right font-bold" style="padding-top: 4px;">TZS ${formatCurrency(data.grandTotal, isMinor)}</td>
                </tr>
            </table>

            <div class="divider"></div>

            <table class="summary-table">
                ${data.paymentMethod ? `
                    <tr>
                        <td class="text-left">Payment Mode:</td>
                        <td class="text-right font-bold uppercase">${escapeHtml(data.paymentMethod)}</td>
                    </tr>
                ` : ''}
                ${data.amountPaid !== undefined ? `
                    <tr>
                        <td class="text-left">Amount Paid:</td>
                        <td class="text-right font-bold">TZS ${formatCurrency(data.amountPaid, isMinor)}</td>
                    </tr>
                ` : ''}
                ${data.balanceDue !== undefined ? `
                    <tr>
                        <td class="text-left">${data.balanceDue > 0 ? 'Balance Due:' : 'Change Returned:'}</td>
                        <td class="text-right font-bold">TZS ${formatCurrency(Math.abs(data.balanceDue), isMinor)}</td>
                    </tr>
                ` : ''}
            </table>

            <div class="divider"></div>

            <div class="footer">
                <div>${escapeHtml(data.footerText || 'Thank you for your visit!')}</div>
                <div style="margin-top: 2px;">Karibu Tena!</div>
                <div style="margin-top: 4px; font-size: 9px; color: #555;">Printed via The Inns Hospitality OS</div>
            </div>
        </body>
        </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
        try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
        } catch (e) {
            console.error('Thermal print error:', e);
        } finally {
            setTimeout(() => {
                if (document.body.contains(printFrame)) {
                    document.body.removeChild(printFrame);
                }
            }, 1000);
        }
    }, 250);
}

/**
 * Print Standard A4 Tax Invoice / Statement via an isolated iframe
 */
export function printA4Invoice(data: ReceiptData): void {
    const isMinor = data.amountsAreMinor ?? false;
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
        document.body.removeChild(printFrame);
        window.print();
        return;
    }

    const nowStr = data.dateTime || new Date().toLocaleString();
    const typeTitle = data.receiptType || 'TAX INVOICE / FOLIO STATEMENT';

    const itemsHtml = data.items.map((item, index) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; text-align: center; color: #64748b;">${index + 1}</td>
            <td style="padding: 10px 12px; text-align: left; font-weight: 600; color: #0f172a;">${escapeHtml(item.description)}</td>
            <td style="padding: 10px 12px; text-align: center; color: #334155;">${item.quantity}</td>
            <td style="padding: 10px 12px; text-align: right; color: #334155;">TZS ${formatCurrency(item.unit_price, isMinor)}</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">TZS ${formatCurrency(item.amount, isMinor)}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${escapeHtml(data.receiptNumber)}</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 15mm;
                }
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 13px;
                    line-height: 1.5;
                    color: #1e293b;
                    background: #fff;
                    padding: 10mm;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
            </style>
        </head>
        <body>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px;">
                <div>
                    <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">${escapeHtml(data.hotelName)}</h1>
                    ${data.hotelAddress ? `<p style="color: #64748b; font-size: 12px; margin-top: 4px;">${escapeHtml(data.hotelAddress)}</p>` : ''}
                    ${data.hotelPhone ? `<p style="color: #64748b; font-size: 12px;">Tel: ${escapeHtml(data.hotelPhone)} | Email: ${escapeHtml(data.hotelEmail || '')}</p>` : ''}
                    ${(data.tin || data.vrn) ? `
                        <p style="color: #475569; font-size: 12px; margin-top: 4px; font-weight: 600;">
                            ${data.tin ? `TIN: ${escapeHtml(data.tin)} ` : ''}
                            ${data.vrn ? `| VRN: ${escapeHtml(data.vrn)}` : ''}
                        </p>
                    ` : ''}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${escapeHtml(typeTitle)}</div>
                    <div style="font-size: 13px; font-weight: 700; color: #2563eb; margin-top: 4px;"># ${escapeHtml(data.receiptNumber)}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${escapeHtml(nowStr)}</div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 28px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div>
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Billed To / Guest</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px;">${escapeHtml(data.guestName || 'Valued Guest')}</div>
                    ${data.roomNumber ? `<div style="font-size: 12px; color: #475569;">Room Number: <b>${escapeHtml(data.roomNumber)}</b></div>` : ''}
                    ${data.tableName ? `<div style="font-size: 12px; color: #475569;">Table / Outlet: <b>${escapeHtml(data.tableName)}</b></div>` : ''}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Payment Details</div>
                    <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 4px;">Method: <span style="text-transform: uppercase;">${escapeHtml(data.paymentMethod || 'Settled')}</span></div>
                    ${data.cashierName ? `<div style="font-size: 12px; color: #64748b;">Issued By: ${escapeHtml(data.cashierName)}</div>` : ''}
                </div>
            </div>

            <table>
                <thead>
                    <tr style="background: #0f172a; color: #fff;">
                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; text-transform: uppercase;">#</th>
                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase;">Description</th>
                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; text-transform: uppercase;">Qty</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase;">Unit Price</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase;">Total (TZS)</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
                <div style="width: 320px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: 600;">TZS ${formatCurrency(data.subtotal, isMinor)}</td>
                        </tr>
                        ${data.discount && data.discount > 0 ? `
                            <tr>
                                <td style="padding: 6px 0; color: #64748b;">Discount:</td>
                                <td style="padding: 6px 0; text-align: right; color: #dc2626; font-weight: 600;">- TZS ${formatCurrency(data.discount, isMinor)}</td>
                            </tr>
                        ` : ''}
                        ${data.tax && data.tax > 0 ? `
                            <tr>
                                <td style="padding: 6px 0; color: #64748b;">VAT (${data.taxRatePercent || 18}%):</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: 600;">TZS ${formatCurrency(data.tax, isMinor)}</td>
                            </tr>
                        ` : ''}
                        ${data.serviceCharge && data.serviceCharge > 0 ? `
                            <tr>
                                <td style="padding: 6px 0; color: #64748b;">Service Charge:</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: 600;">TZS ${formatCurrency(data.serviceCharge, isMinor)}</td>
                            </tr>
                        ` : ''}
                        <tr style="border-top: 2px solid #0f172a; font-size: 15px;">
                            <td style="padding: 10px 0; font-weight: 800; color: #0f172a;">Grand Total:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: 800; color: #0f172a;">TZS ${formatCurrency(data.grandTotal, isMinor)}</td>
                        </tr>
                        ${data.amountPaid !== undefined ? `
                            <tr style="border-top: 1px solid #e2e8f0;">
                                <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #16a34a;">TZS ${formatCurrency(data.amountPaid, isMinor)}</td>
                            </tr>
                        ` : ''}
                        ${data.balanceDue !== undefined ? `
                            <tr>
                                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">Balance Due:</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: 800; color: ${data.balanceDue > 0 ? '#dc2626' : '#16a34a'};">TZS ${formatCurrency(data.balanceDue, isMinor)}</td>
                            </tr>
                        ` : ''}
                    </table>
                </div>
            </div>

            <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <div style="width: 200px; border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
                    <div style="font-size: 11px; color: #64748b; font-weight: 600;">Authorized Signatory / Stamp</div>
                </div>
                <div style="text-align: right; font-size: 11px; color: #94a3b8;">
                    ${escapeHtml(data.footerText || 'Thank you for choosing our hospitality services!')}
                </div>
            </div>
        </body>
        </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
        try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
        } catch (e) {
            console.error('A4 print error:', e);
        } finally {
            setTimeout(() => {
                if (document.body.contains(printFrame)) {
                    document.body.removeChild(printFrame);
                }
            }, 1000);
        }
    }, 250);
}

function escapeHtml(str?: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
