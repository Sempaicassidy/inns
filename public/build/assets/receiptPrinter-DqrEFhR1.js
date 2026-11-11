var e=(e,t=!1)=>Math.round(t?e/100:e).toLocaleString();function t(e){return e?e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`):``}function n(e,n,r=`Receipt`){let i=document.getElementById(`the-inns-receipt-print-root`);i&&i.remove();let a=document.getElementById(`the-inns-receipt-iframe`);a&&a.remove();let o=`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${t(r)}</title>
    <style>
        ${n}
    </style>
</head>
<body>
    ${e}
</body>
</html>`,s=document.createElement(`div`);s.id=`the-inns-receipt-print-root`,s.innerHTML=`<style>${n}</style>${e}`,document.body.appendChild(s);let c=document.createElement(`iframe`);c.id=`the-inns-receipt-iframe`,c.style.position=`fixed`,c.style.bottom=`0`,c.style.right=`0`,c.style.width=`0px`,c.style.height=`0px`,c.style.border=`none`,c.style.zIndex=`-1`,document.body.appendChild(c);let l=!1,u=()=>{l||(l=!0,document.body.classList.remove(`is-printing-receipt`),setTimeout(()=>{document.body.contains(s)&&s.remove(),document.body.contains(c)&&c.remove()},1e3))};window.addEventListener(`afterprint`,u,{once:!0}),setTimeout(u,12e4);let d=c.contentWindow?.document;d?(d.open(),d.write(o),d.close(),c.contentWindow?.addEventListener(`afterprint`,u,{once:!0}),setTimeout(()=>{try{c.contentWindow?.focus(),c.contentWindow?.print()}catch(e){console.warn(`Iframe print intercepted, falling back to body isolated print:`,e),document.body.classList.add(`is-printing-receipt`),window.print()}},250)):(document.body.classList.add(`is-printing-receipt`),window.print())}function r(n){let r=n.amountsAreMinor??!1,i=n.dateTime||new Date().toLocaleString(),a=n.receiptType||`PAYMENT RECEIPT`,o=n.items.map(n=>`
        <tr>
            <td style="padding: 3px 0; text-align: left; vertical-align: top; word-break: break-word;">
                <div style="font-weight: bold;">${t(n.description)}</div>
                ${n.quantity>1?`<div style="font-size: 10px; color: #333;">${n.quantity} x TZS ${e(n.unit_price,r)}</div>`:``}
                ${n.notes?`<div style="font-size: 10px; font-style: italic; color: #555;">Note: ${t(n.notes)}</div>`:``}
            </td>
            <td style="padding: 3px 0; text-align: right; vertical-align: top; white-space: nowrap; font-weight: bold;">
                ${e(n.amount,r)}
            </td>
        </tr>
    `).join(``);return`
        <div class="receipt-container">
            <div class="text-center font-bold" style="font-size: 15px; letter-spacing: 0.5px; margin-bottom: 2px;">
                ${t(n.hotelName)}
            </div>
            ${n.hotelAddress?`<div class="text-center" style="font-size: 10px;">${t(n.hotelAddress)}</div>`:``}
            ${n.hotelPhone?`<div class="text-center" style="font-size: 10px;">Tel: ${t(n.hotelPhone)}</div>`:``}
            ${n.hotelEmail?`<div class="text-center" style="font-size: 10px;">Email: ${t(n.hotelEmail)}</div>`:``}
            
            ${n.tin||n.vrn?`
                <div class="text-center" style="font-size: 10px; margin-top: 2px;">
                    ${n.tin?`TIN: <b>${t(n.tin)}</b> `:``}
                    ${n.vrn?`VRN: <b>${t(n.vrn)}</b>`:``}
                </div>
            `:``}

            <div class="divider"></div>
            
            <div class="text-center font-bold uppercase" style="font-size: 12px; margin: 3px 0; letter-spacing: 0.5px;">
                ${t(a)}
            </div>

            <div class="divider"></div>

            <div class="meta-row">
                <span>Receipt #:</span>
                <span class="font-bold">${t(n.receiptNumber)}</span>
            </div>
            <div class="meta-row">
                <span>Date & Time:</span>
                <span>${t(i)}</span>
            </div>
            ${n.cashierName||n.serverName?`
                <div class="meta-row">
                    <span>Server / Staff:</span>
                    <span>${t(n.serverName||n.cashierName)}</span>
                </div>
            `:``}
            ${n.guestName?`
                <div class="meta-row">
                    <span>Guest:</span>
                    <span class="font-bold">${t(n.guestName)}</span>
                </div>
            `:``}
            ${n.roomNumber?`
                <div class="meta-row">
                    <span>Room #:</span>
                    <span class="font-bold">${t(n.roomNumber)}</span>
                </div>
            `:``}
            ${n.tableName?`
                <div class="meta-row">
                    <span>Table / Order:</span>
                    <span class="font-bold">${t(n.tableName)}</span>
                </div>
            `:``}
            ${n.orderType?`
                <div class="meta-row">
                    <span>Service:</span>
                    <span class="font-bold uppercase">${t(n.orderType.replace(`_`,` `))}</span>
                </div>
            `:``}

            <div class="divider"></div>

            <table>
                <thead>
                    <tr style="border-bottom: 1px dashed #000;">
                        <th style="text-align: left; padding: 2px 0;">ITEM</th>
                        <th style="text-align: right; padding: 2px 0;">AMOUNT (TZS)</th>
                    </tr>
                </thead>
                <tbody>
                    ${o}
                </tbody>
            </table>

            <div class="divider"></div>

            <table class="summary-table">
                <tr>
                    <td class="text-left">Subtotal:</td>
                    <td class="text-right font-bold">TZS ${e(n.subtotal,r)}</td>
                </tr>
                ${n.discount&&n.discount>0?`
                    <tr>
                        <td class="text-left">Discount:</td>
                        <td class="text-right">- TZS ${e(n.discount,r)}</td>
                    </tr>
                `:``}
                ${n.tax&&n.tax>0?`
                    <tr>
                        <td class="text-left">VAT / Tax (${n.taxRatePercent||18}%):</td>
                        <td class="text-right">TZS ${e(n.tax,r)}</td>
                    </tr>
                `:``}
                ${n.serviceCharge&&n.serviceCharge>0?`
                    <tr>
                        <td class="text-left">Service Charge:</td>
                        <td class="text-right">TZS ${e(n.serviceCharge,r)}</td>
                    </tr>
                `:``}
                <tr style="border-top: 1px double #000; font-size: 13px;">
                    <td class="text-left font-bold" style="padding-top: 4px;">TOTAL:</td>
                    <td class="text-right font-bold" style="padding-top: 4px;">TZS ${e(n.grandTotal,r)}</td>
                </tr>
            </table>

            <div class="divider"></div>

            <table class="summary-table">
                ${n.paymentMethod?`
                    <tr>
                        <td class="text-left">Payment Mode:</td>
                        <td class="text-right font-bold uppercase">${t(n.paymentMethod)}</td>
                    </tr>
                `:``}
                ${n.amountPaid===void 0?``:`
                    <tr>
                        <td class="text-left">Amount Paid:</td>
                        <td class="text-right font-bold">TZS ${e(n.amountPaid,r)}</td>
                    </tr>
                `}
                ${n.balanceDue===void 0?``:`
                    <tr>
                        <td class="text-left">${n.balanceDue>0?`Balance Due:`:`Change Returned:`}</td>
                        <td class="text-right font-bold">TZS ${e(Math.abs(n.balanceDue),r)}</td>
                    </tr>
                `}
            </table>

            ${n.notes?`
                <div class="divider"></div>
                <div style="font-size: 10px; font-style: italic; padding: 2px 0;">
                    <b>Special Notes:</b> ${t(n.notes)}
                </div>
            `:``}

            <div class="divider"></div>

            <div class="footer">
                <div>${t(n.footerText||`Thank you for your visit!`)}</div>
                <div style="margin-top: 2px; font-weight: bold;">Karibu Tena!</div>
                <div style="margin-top: 5px; font-size: 9px; color: #666;">Printed via The Inns Hospitality OS</div>
            </div>
        </div>
    `}function i(e){let n=e.dateTime||new Date().toLocaleString(),r=e.tableName||(e.roomNumber?`Room ${e.roomNumber}`:`Direct Order`),i=e.items.map((e,n)=>`
        <div style="padding: 6px 0; border-bottom: 1px dashed #000;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 15px; font-weight: 900; letter-spacing: 0.5px;">
                    [ ${e.quantity}x ] ${t(e.description)}
                </span>
                <span style="font-size: 11px; color: #555;">#${n+1}</span>
            </div>
            ${e.notes?`
                <div style="font-size: 11px; font-weight: bold; background: #f0f0f0; padding: 3px 5px; margin-top: 3px; border-left: 3px solid #000;">
                    * INSTRUCTION: ${t(e.notes)}
                </div>
            `:``}
        </div>
    `).join(``);return`
        <div class="receipt-container kot-container">
            <div class="text-center font-bold" style="font-size: 16px; border: 2px solid #000; padding: 4px; margin-bottom: 6px;">
                *** KITCHEN ORDER TICKET (KOT) ***
            </div>

            <div style="font-size: 18px; font-weight: 900; text-align: center; margin: 4px 0; text-transform: uppercase; background: #000; color: #fff; padding: 4px;">
                ${t(r)}
            </div>

            <div class="meta-row" style="font-size: 12px; margin-top: 4px;">
                <span>Order #:</span>
                <span class="font-bold">${t(e.receiptNumber)}</span>
            </div>
            <div class="meta-row" style="font-size: 11px;">
                <span>Time:</span>
                <span>${t(n)}</span>
            </div>
            ${e.serverName||e.cashierName?`
                <div class="meta-row" style="font-size: 11px;">
                    <span>Server:</span>
                    <span class="font-bold">${t(e.serverName||e.cashierName)}</span>
                </div>
            `:``}
            ${e.guestName?`
                <div class="meta-row" style="font-size: 11px;">
                    <span>Guest:</span>
                    <span>${t(e.guestName)}</span>
                </div>
            `:``}
            ${e.orderType?`
                <div class="meta-row" style="font-size: 11px;">
                    <span>Service Type:</span>
                    <span class="font-bold uppercase">${t(e.orderType.replace(`_`,` `))}</span>
                </div>
            `:``}

            <div class="divider" style="border-top-width: 2px;"></div>

            <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px; text-transform: uppercase;">
                Items to Prepare (${e.items.reduce((e,t)=>e+(t.quantity||1),0)} pcs):
            </div>

            <div>
                ${i}
            </div>

            ${e.notes?`
                <div style="margin-top: 8px; padding: 6px; border: 1px solid #000; font-size: 11px;">
                    <div style="font-weight: bold; text-transform: uppercase;">Special Order Notes:</div>
                    <div>${t(e.notes)}</div>
                </div>
            `:``}

            <div class="divider" style="border-top-width: 2px; margin-top: 8px;"></div>

            <div class="text-center font-bold" style="font-size: 11px; margin-top: 6px; letter-spacing: 0.5px;">
                *** DISPATCH TO KITCHEN / BAR ***
            </div>
        </div>
    `}var a=`
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
`;function o(e){n(r(e),a,`Receipt-${e.receiptNumber}`)}function s(e){n(i(e),a,`KOT-${e.receiptNumber}`)}function c(r){let i=r.amountsAreMinor??!1,a=r.dateTime||new Date().toLocaleString(),o=r.receiptType||`TAX INVOICE / FOLIO STATEMENT`,s=r.items.map((n,r)=>`
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; text-align: center; color: #64748b;">${r+1}</td>
            <td style="padding: 10px 12px; text-align: left; font-weight: 600; color: #0f172a;">
                ${t(n.description)}
                ${n.notes?`<div style="font-size: 11px; color: #64748b; font-style: italic;">${t(n.notes)}</div>`:``}
            </td>
            <td style="padding: 10px 12px; text-align: center; color: #334155;">${n.quantity}</td>
            <td style="padding: 10px 12px; text-align: right; color: #334155;">TZS ${e(n.unit_price,i)}</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">TZS ${e(n.amount,i)}</td>
        </tr>
    `).join(``);n(`
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px;">
            <div>
                <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">${t(r.hotelName)}</h1>
                ${r.hotelAddress?`<p style="color: #64748b; font-size: 12px; margin-top: 4px;">${t(r.hotelAddress)}</p>`:``}
                ${r.hotelPhone?`<p style="color: #64748b; font-size: 12px;">Tel: ${t(r.hotelPhone)} | Email: ${t(r.hotelEmail||``)}</p>`:``}
                ${r.tin||r.vrn?`
                    <p style="color: #475569; font-size: 12px; margin-top: 4px; font-weight: 600;">
                        ${r.tin?`TIN: ${t(r.tin)} `:``}
                        ${r.vrn?`| VRN: ${t(r.vrn)}`:``}
                    </p>
                `:``}
            </div>
            <div style="text-align: right;">
                <div style="font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${t(o)}</div>
                <div style="font-size: 13px; font-weight: 700; color: #2563eb; margin-top: 4px;"># ${t(r.receiptNumber)}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${t(a)}</div>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 28px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div>
                <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Billed To / Guest</div>
                <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px;">${t(r.guestName||`Valued Guest`)}</div>
                ${r.roomNumber?`<div style="font-size: 12px; color: #475569;">Room Number: <b>${t(r.roomNumber)}</b></div>`:``}
                ${r.tableName?`<div style="font-size: 12px; color: #475569;">Table / Outlet: <b>${t(r.tableName)}</b></div>`:``}
            </div>
            <div style="text-align: right;">
                <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Payment Details</div>
                <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 4px;">Method: <span style="text-transform: uppercase;">${t(r.paymentMethod||`Settled`)}</span></div>
                ${r.serverName||r.cashierName?`<div style="font-size: 12px; color: #64748b;">Issued By: ${t(r.serverName||r.cashierName)}</div>`:``}
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
                ${s}
            </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
            <div style="width: 320px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 600;">TZS ${e(r.subtotal,i)}</td>
                    </tr>
                    ${r.discount&&r.discount>0?`
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Discount:</td>
                            <td style="padding: 6px 0; text-align: right; color: #dc2626; font-weight: 600;">- TZS ${e(r.discount,i)}</td>
                        </tr>
                    `:``}
                    ${r.tax&&r.tax>0?`
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">VAT (${r.taxRatePercent||18}%):</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: 600;">TZS ${e(r.tax,i)}</td>
                        </tr>
                    `:``}
                    ${r.serviceCharge&&r.serviceCharge>0?`
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Service Charge:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: 600;">TZS ${e(r.serviceCharge,i)}</td>
                        </tr>
                    `:``}
                    <tr style="border-top: 2px solid #0f172a; font-size: 15px;">
                        <td style="padding: 10px 0; font-weight: 800; color: #0f172a;">Grand Total:</td>
                        <td style="padding: 10px 0; text-align: right; font-weight: 800; color: #0f172a;">TZS ${e(r.grandTotal,i)}</td>
                    </tr>
                    ${r.amountPaid===void 0?``:`
                        <tr style="border-top: 1px solid #e2e8f0;">
                            <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #16a34a;">TZS ${e(r.amountPaid,i)}</td>
                        </tr>
                    `}
                    ${r.balanceDue===void 0?``:`
                        <tr>
                            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">Balance Due:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: 800; color: ${r.balanceDue>0?`#dc2626`:`#16a34a`};">TZS ${e(r.balanceDue,i)}</td>
                        </tr>
                    `}
                </table>
            </div>
        </div>

        <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <div style="width: 200px; border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
                <div style="font-size: 11px; color: #64748b; font-weight: 600;">Authorized Signatory / Stamp</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #94a3b8;">
                ${t(r.footerText||`Thank you for choosing our hospitality services!`)}
            </div>
        </div>
    `,`
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
    `,`Invoice-${r.receiptNumber}`)}export{s as n,o as r,c as t};