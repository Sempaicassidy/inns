/**
 * Receipt, Kitchen Order Ticket (KOT) & Tax Invoice Isolated Printing Engine
 * Guarantees 100% clean receipt printing without any web application UI, modals, or sidebars.
 */

export interface ReceiptItem {
    description: string;
    quantity: number;
    unit_price: number; // in whole shillings or minor (controlled by amountsAreMinor)
    amount: number;     // in whole shillings or minor
    notes?: string;     // special kitchen or customer notes
}

export interface ReceiptData {
    hotelName: string;
    hotelAddress?: string;
    hotelPhone?: string;
    hotelEmail?: string;
    tin?: string;
    vrn?: string;
    receiptNumber: string;
    receiptType?: 'FISCAL RECEIPT' | 'TAX INVOICE' | 'PAYMENT RECEIPT' | 'FOLIO STATEMENT' | 'POS RECEIPT' | 'KITCHEN TICKET' | 'BAR TICKET';
    dateTime?: string;
    cashierName?: string;
    serverName?: string;
    guestName?: string;
    roomNumber?: string;
    tableName?: string;
    orderType?: string;
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

export function escapeHtml(str?: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Execute isolated printing using a dual-protection strategy:
 * 1. Off-screen visible iframe (so Chromium assigns focus and layout correctly)
 * 2. Dedicated body container (#the-inns-receipt-print-root) with body.is-printing-receipt
 *    which hides 100% of all website elements during print.
 */
function executePrint(innerHtml: string, pageStyles: string, docTitle: string = 'Receipt'): void {
    // 1. Clean up any previous print containers or iframes
    const oldRoot = document.getElementById('the-inns-receipt-print-root');
    if (oldRoot) oldRoot.remove();
    const oldFrame = document.getElementById('the-inns-receipt-iframe');
    if (oldFrame) oldFrame.remove();

    // 2. Build full HTML document
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${escapeHtml(docTitle)}</title>
    <style>
        ${pageStyles}
    </style>
</head>
<body>
    ${innerHtml}
</body>
</html>`;

    // 3. Inject print root container into main document for body-isolation fallback
    const printRoot = document.createElement('div');
    printRoot.id = 'the-inns-receipt-print-root';
    printRoot.innerHTML = `<style>${pageStyles}</style>${innerHtml}`;
    document.body.appendChild(printRoot);

    // 4. Create off-screen visible iframe (visible to layout engine, transparent to user)
    const printFrame = document.createElement('iframe');
    printFrame.id = 'the-inns-receipt-iframe';
    printFrame.style.position = 'fixed';
    printFrame.style.bottom = '0';
    printFrame.style.right = '0';
    printFrame.style.width = '0px';
    printFrame.style.height = '0px';
    printFrame.style.border = 'none';
    printFrame.style.zIndex = '-1';
    document.body.appendChild(printFrame);

    let cleanedUp = false;
    const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        document.body.classList.remove('is-printing-receipt');
        setTimeout(() => {
            if (document.body.contains(printRoot)) printRoot.remove();
            if (document.body.contains(printFrame)) printFrame.remove();
        }, 1000);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    // Safety fallback timeout to prevent orphaned containers
    setTimeout(cleanup, 120000);

    const doc = printFrame.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();

        printFrame.contentWindow?.addEventListener('afterprint', cleanup, { once: true });

        setTimeout(() => {
            try {
                printFrame.contentWindow?.focus();
                printFrame.contentWindow?.print();
            } catch (err) {
                console.warn('Iframe print intercepted, falling back to body isolated print:', err);
                document.body.classList.add('is-printing-receipt');
                window.print();
            }
        }, 250);
    } else {
        // Direct body isolation fallback
        document.body.classList.add('is-printing-receipt');
        window.print();
    }
}

/**
 * Generate thermal receipt inner HTML
 */
export function generateThermalReceiptHtml(data: ReceiptData): string {
    const isMinor = data.amountsAreMinor ?? false;
    const nowStr = data.dateTime || new Date().toLocaleString();
    const typeTitle = data.receiptType || 'PAYMENT RECEIPT';

    const itemsHtml = data.items.map(item => `
        <tr>
            <td style="padding: 3px 0; text-align: left; vertical-align: top; word-break: break-word;">
                <div style="font-weight: bold;">${escapeHtml(item.description)}</div>
                ${item.quantity > 1 ? `<div style="font-size: 10px; color: #333;">${item.quantity} x TZS ${formatCurrency(item.unit_price, isMinor)}</div>` : ''}
                ${item.notes ? `<div style="font-size: 10px; font-style: italic; color: #555;">Note: ${escapeHtml(item.notes)}</div>` : ''}
            </td>
            <td style="padding: 3px 0; text-align: right; vertical-align: top; white-space: nowrap; font-weight: bold;">
                ${formatCurrency(item.amount, isMinor)}
            </td>
        </tr>
    `).join('');

    return `
        <div class="receipt-container">
            <div class="text-center font-bold" style="font-size: 15px; letter-spacing: 0.5px; margin-bottom: 2px;">
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
            
            <div class="text-center font-bold uppercase" style="font-size: 12px; margin: 3px 0; letter-spacing: 0.5px;">
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
            ${(data.cashierName || data.serverName) ? `
                <div class="meta-row">
                    <span>Server / Staff:</span>
                    <span>${escapeHtml(data.serverName || data.cashierName)}</span>
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
            ${data.orderType ? `
                <div class="meta-row">
                    <span>Service:</span>
                    <span class="font-bold uppercase">${escapeHtml(data.orderType.replace('_', ' '))}</span>
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

            ${data.notes ? `
                <div class="divider"></div>
                <div style="font-size: 10px; font-style: italic; padding: 2px 0;">
                    <b>Special Notes:</b> ${escapeHtml(data.notes)}
                </div>
            ` : ''}

            <div class="divider"></div>

            <div class="footer">
                <div>${escapeHtml(data.footerText || 'Thank you for your visit!')}</div>
                <div style="margin-top: 2px; font-weight: bold;">Karibu Tena!</div>
                <div style="margin-top: 5px; font-size: 9px; color: #666;">Printed via The Inns Hospitality OS</div>
            </div>
        </div>
    `;
}

/**
 * Generate Kitchen Order Ticket (KOT) inner HTML
 */
export function generateKOTHtml(data: ReceiptData): string {
    const nowStr = data.dateTime || new Date().toLocaleString();
    const outlet = data.tableName || (data.roomNumber ? `Room ${data.roomNumber}` : 'Direct Order');

    const itemsHtml = data.items.map((item, idx) => `
        <div style="padding: 6px 0; border-bottom: 1px dashed #000;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 15px; font-weight: 900; letter-spacing: 0.5px;">
                    [ ${item.quantity}x ] ${escapeHtml(item.description)}
                </span>
                <span style="font-size: 11px; color: #555;">#${idx + 1}</span>
            </div>
            ${item.notes ? `
                <div style="font-size: 11px; font-weight: bold; background: #f0f0f0; padding: 3px 5px; margin-top: 3px; border-left: 3px solid #000;">
                    * INSTRUCTION: ${escapeHtml(item.notes)}
                </div>
            ` : ''}
        </div>
    `).join('');

    return `
        <div class="receipt-container kot-container">
            <div class="text-center font-bold" style="font-size: 16px; border: 2px solid #000; padding: 4px; margin-bottom: 6px;">
                *** KITCHEN ORDER TICKET (KOT) ***
            </div>

            <div style="font-size: 18px; font-weight: 900; text-align: center; margin: 4px 0; text-transform: uppercase; background: #000; color: #fff; padding: 4px;">
                ${escapeHtml(outlet)}
            </div>

            <div class="meta-row" style="font-size: 12px; margin-top: 4px;">
                <span>Order #:</span>
                <span class="font-bold">${escapeHtml(data.receiptNumber)}</span>
            </div>
            <div class="meta-row" style="font-size: 11px;">
                <span>Time:</span>
                <span>${escapeHtml(nowStr)}</span>
            </div>
            ${(data.serverName || data.cashierName) ? `
                <div class="meta-row" style="font-size: 11px;">
                    <span>Server:</span>
                    <span class="font-bold">${escapeHtml(data.serverName || data.cashierName)}</span>
                </div>
            ` : ''}
            ${data.guestName ? `
                <div class="meta-row" style="font-size: 11px;">
                    <span>Guest:</span>
                    <span>${escapeHtml(data.guestName)}</span>
                </div>
            ` : ''}
            ${data.orderType ? `
                <div class="meta-row" style="font-size: 11px;">
                    <span>Service Type:</span>
                    <span class="font-bold uppercase">${escapeHtml(data.orderType.replace('_', ' '))}</span>
                </div>
            ` : ''}

            <div class="divider" style="border-top-width: 2px;"></div>

            <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px; text-transform: uppercase;">
                Items to Prepare (${data.items.reduce((acc, it) => acc + (it.quantity || 1), 0)} pcs):
            </div>

            <div>
                ${itemsHtml}
            </div>

            ${data.notes ? `
                <div style="margin-top: 8px; padding: 6px; border: 1px solid #000; font-size: 11px;">
                    <div style="font-weight: bold; text-transform: uppercase;">Special Order Notes:</div>
                    <div>${escapeHtml(data.notes)}</div>
                </div>
            ` : ''}

            <div class="divider" style="border-top-width: 2px; margin-top: 8px;"></div>

            <div class="text-center font-bold" style="font-size: 11px; margin-top: 6px; letter-spacing: 0.5px;">
                *** DISPATCH TO KITCHEN / BAR ***
            </div>
        </div>
    `;
}

/**
 * Thermal receipt print styling (80mm standard roll)
 */
const thermalStyles = `
    @page {
        size: 80mm auto;
        margin: 0mm !important;
    }
    @media print {
        html, body {
            width: 72mm !important;
            margin: 0 auto !important;
            padding: 3mm 2mm 8mm 2mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
    }
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    body {
        font-family: 'Courier New', 'Lucida Console', Monaco, monospace;
        font-size: 11px;
        line-height: 1.35;
        color: #000000;
        background: #ffffff;
        width: 72mm;
        margin: 0 auto;
        padding: 3mm 2mm 8mm 2mm;
        -webkit-font-smoothing: antialiased;
    }
    .receipt-container {
        width: 100%;
        max-width: 72mm;
        margin: 0 auto;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .divider {
        border-top: 1px dashed #000000;
        margin: 6px 0;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }
    .meta-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2px;
        font-size: 11px;
    }
    .summary-table td {
        padding: 2px 0;
    }
    .footer {
        margin-top: 8px;
        text-align: center;
        font-size: 10px;
    }
`;

/**
 * Print 80mm Thermal Receipt
 */
export function printThermalReceipt(data: ReceiptData): void {
    const html = generateThermalReceiptHtml(data);
    executePrint(html, thermalStyles, `Receipt-${data.receiptNumber}`);
}

/**
 * Print Kitchen Order Ticket (KOT)
 */
export function printKOTReceipt(data: ReceiptData): void {
    const html = generateKOTHtml(data);
    executePrint(html, thermalStyles, `KOT-${data.receiptNumber}`);
}

/**
 * Print Standard A4 Tax Invoice / Folio Statement
 */
export function printA4Invoice(data: ReceiptData): void {
    const isMinor = data.amountsAreMinor ?? false;
    const nowStr = data.dateTime || new Date().toLocaleString();
    const typeTitle = data.receiptType || 'TAX INVOICE / FOLIO STATEMENT';

    const itemsHtml = data.items.map((item, index) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; text-align: center; color: #64748b;">${index + 1}</td>
            <td style="padding: 10px 12px; text-align: left; font-weight: 600; color: #0f172a;">
                ${escapeHtml(item.description)}
                ${item.notes ? `<div style="font-size: 11px; color: #64748b; font-style: italic;">${escapeHtml(item.notes)}</div>` : ''}
            </td>
            <td style="padding: 10px 12px; text-align: center; color: #334155;">${item.quantity}</td>
            <td style="padding: 10px 12px; text-align: right; color: #334155;">TZS ${formatCurrency(item.unit_price, isMinor)}</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">TZS ${formatCurrency(item.amount, isMinor)}</td>
        </tr>
    `).join('');

    const a4Styles = `
        @page {
            size: A4 portrait;
            margin: 12mm;
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
            padding: 8mm;
            width: 100%;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
    `;

    const innerHtml = `
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
                ${(data.serverName || data.cashierName) ? `<div style="font-size: 12px; color: #64748b;">Issued By: ${escapeHtml(data.serverName || data.cashierName)}</div>` : ''}
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
    `;

    executePrint(innerHtml, a4Styles, `Invoice-${data.receiptNumber}`);
}
