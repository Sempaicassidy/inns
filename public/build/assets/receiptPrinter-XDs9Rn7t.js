var e=(e,t=!1)=>Math.round(t?e/100:e).toLocaleString();function t(t){let n=t.amountsAreMinor??!1,i=document.createElement(`iframe`);i.style.position=`fixed`,i.style.right=`0`,i.style.bottom=`0`,i.style.width=`0`,i.style.height=`0`,i.style.border=`0`,i.style.visibility=`hidden`,document.body.appendChild(i);let a=i.contentWindow?.document;if(!a){document.body.removeChild(i),window.print();return}let o=t.dateTime||new Date().toLocaleString(),s=t.receiptType||`PAYMENT RECEIPT`,c=t.items.map(t=>`
        <tr>
            <td style="padding: 2px 0; text-align: left; vertical-align: top; word-break: break-word;">
                ${r(t.description)}
                ${t.quantity>1?`<br><small style="color: #444;">${t.quantity} x TZS ${e(t.unit_price,n)}</small>`:``}
            </td>
            <td style="padding: 2px 0; text-align: right; vertical-align: top; white-space: nowrap; font-weight: bold;">
                ${e(t.amount,n)}
            </td>
        </tr>
    `).join(``),l=`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${r(t.receiptNumber)}</title>
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
                ${r(t.hotelName)}
            </div>
            ${t.hotelAddress?`<div class="text-center" style="font-size: 10px;">${r(t.hotelAddress)}</div>`:``}
            ${t.hotelPhone?`<div class="text-center" style="font-size: 10px;">Tel: ${r(t.hotelPhone)}</div>`:``}
            ${t.hotelEmail?`<div class="text-center" style="font-size: 10px;">Email: ${r(t.hotelEmail)}</div>`:``}
            
            ${t.tin||t.vrn?`
                <div class="text-center" style="font-size: 10px; margin-top: 2px;">
                    ${t.tin?`TIN: <b>${r(t.tin)}</b> `:``}
                    ${t.vrn?`VRN: <b>${r(t.vrn)}</b>`:``}
                </div>
            `:``}

            <div class="divider"></div>
            
            <div class="text-center font-bold uppercase" style="font-size: 12px; margin: 3px 0;">
                ${r(s)}
            </div>

            <div class="divider"></div>

            <div class="meta-row">
                <span>Receipt #:</span>
                <span class="font-bold">${r(t.receiptNumber)}</span>
            </div>
            <div class="meta-row">
                <span>Date & Time:</span>
                <span>${r(o)}</span>
            </div>
            ${t.cashierName?`
                <div class="meta-row">
                    <span>Cashier / Staff:</span>
                    <span>${r(t.cashierName)}</span>
                </div>
            `:``}
            ${t.guestName?`
                <div class="meta-row">
                    <span>Guest:</span>
                    <span class="font-bold">${r(t.guestName)}</span>
                </div>
            `:``}
            ${t.roomNumber?`
                <div class="meta-row">
                    <span>Room #:</span>
                    <span class="font-bold">${r(t.roomNumber)}</span>
                </div>
            `:``}
            ${t.tableName?`
                <div class="meta-row">
                    <span>Table / Order:</span>
                    <span class="font-bold">${r(t.tableName)}</span>
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
                    ${c}
                </tbody>
            </table>

            <div class="divider"></div>

            <table class="summary-table">
                <tr>
                    <td class="text-left">Subtotal:</td>
                    <td class="text-right font-bold">TZS ${e(t.subtotal,n)}</td>
                </tr>
                ${t.discount&&t.discount>0?`
                    <tr>
                        <td class="text-left">Discount:</td>
                        <td class="text-right">- TZS ${e(t.discount,n)}</td>
                    </tr>
                `:``}
                ${t.tax&&t.tax>0?`
                    <tr>
                        <td class="text-left">VAT / Tax (${t.taxRatePercent||18}%):</td>
                        <td class="text-right">TZS ${e(t.tax,n)}</td>
                    </tr>
                `:``}
                ${t.serviceCharge&&t.serviceCharge>0?`
                    <tr>
                        <td class="text-left">Service Charge:</td>
                        <td class="text-right">TZS ${e(t.serviceCharge,n)}</td>
                    </tr>
                `:``}
                <tr style="border-top: 1px double #000; font-size: 13px;">
                    <td class="text-left font-bold" style="padding-top: 4px;">TOTAL:</td>
                    <td class="text-right font-bold" style="padding-top: 4px;">TZS ${e(t.grandTotal,n)}</td>
                </tr>
            </table>

            <div class="divider"></div>

            <table class="summary-table">
                ${t.paymentMethod?`
                    <tr>
                        <td class="text-left">Payment Mode:</td>
                        <td class="text-right font-bold uppercase">${r(t.paymentMethod)}</td>
                    </tr>
                `:``}
                ${t.amountPaid===void 0?``:`
                    <tr>
                        <td class="text-left">Amount Paid:</td>
                        <td class="text-right font-bold">TZS ${e(t.amountPaid,n)}</td>
                    </tr>
                `}
                ${t.balanceDue===void 0?``:`
                    <tr>
                        <td class="text-left">${t.balanceDue>0?`Balance Due:`:`Change Returned:`}</td>
                        <td class="text-right font-bold">TZS ${e(Math.abs(t.balanceDue),n)}</td>
                    </tr>
                `}
            </table>

            <div class="divider"></div>

            <div class="footer">
                <div>${r(t.footerText||`Thank you for your visit!`)}</div>
                <div style="margin-top: 2px;">Karibu Tena!</div>
                <div style="margin-top: 4px; font-size: 9px; color: #555;">Printed via The Inns Hospitality OS</div>
            </div>
        </body>
        </html>
    `;a.open(),a.write(l),a.close(),setTimeout(()=>{try{i.contentWindow?.focus(),i.contentWindow?.print()}catch(e){console.error(`Thermal print error:`,e)}finally{setTimeout(()=>{document.body.contains(i)&&document.body.removeChild(i)},1e3)}},250)}function n(t){let n=t.amountsAreMinor??!1,i=document.createElement(`iframe`);i.style.position=`fixed`,i.style.right=`0`,i.style.bottom=`0`,i.style.width=`0`,i.style.height=`0`,i.style.border=`0`,i.style.visibility=`hidden`,document.body.appendChild(i);let a=i.contentWindow?.document;if(!a){document.body.removeChild(i),window.print();return}let o=t.dateTime||new Date().toLocaleString(),s=t.receiptType||`TAX INVOICE / FOLIO STATEMENT`,c=t.items.map((t,i)=>`
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; text-align: center; color: #64748b;">${i+1}</td>
            <td style="padding: 10px 12px; text-align: left; font-weight: 600; color: #0f172a;">${r(t.description)}</td>
            <td style="padding: 10px 12px; text-align: center; color: #334155;">${t.quantity}</td>
            <td style="padding: 10px 12px; text-align: right; color: #334155;">TZS ${e(t.unit_price,n)}</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">TZS ${e(t.amount,n)}</td>
        </tr>
    `).join(``),l=`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${r(t.receiptNumber)}</title>
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
                    <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">${r(t.hotelName)}</h1>
                    ${t.hotelAddress?`<p style="color: #64748b; font-size: 12px; margin-top: 4px;">${r(t.hotelAddress)}</p>`:``}
                    ${t.hotelPhone?`<p style="color: #64748b; font-size: 12px;">Tel: ${r(t.hotelPhone)} | Email: ${r(t.hotelEmail||``)}</p>`:``}
                    ${t.tin||t.vrn?`
                        <p style="color: #475569; font-size: 12px; margin-top: 4px; font-weight: 600;">
                            ${t.tin?`TIN: ${r(t.tin)} `:``}
                            ${t.vrn?`| VRN: ${r(t.vrn)}`:``}
                        </p>
                    `:``}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${r(s)}</div>
                    <div style="font-size: 13px; font-weight: 700; color: #2563eb; margin-top: 4px;"># ${r(t.receiptNumber)}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${r(o)}</div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 28px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div>
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Billed To / Guest</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px;">${r(t.guestName||`Valued Guest`)}</div>
                    ${t.roomNumber?`<div style="font-size: 12px; color: #475569;">Room Number: <b>${r(t.roomNumber)}</b></div>`:``}
                    ${t.tableName?`<div style="font-size: 12px; color: #475569;">Table / Outlet: <b>${r(t.tableName)}</b></div>`:``}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Payment Details</div>
                    <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 4px;">Method: <span style="text-transform: uppercase;">${r(t.paymentMethod||`Settled`)}</span></div>
                    ${t.cashierName?`<div style="font-size: 12px; color: #64748b;">Issued By: ${r(t.cashierName)}</div>`:``}
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
                    ${c}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
                <div style="width: 320px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: 600;">TZS ${e(t.subtotal,n)}</td>
                        </tr>
                        ${t.discount&&t.discount>0?`
                            <tr>
                                <td style="padding: 6px 0; color: #64748b;">Discount:</td>
                                <td style="padding: 6px 0; text-align: right; color: #dc2626; font-weight: 600;">- TZS ${e(t.discount,n)}</td>
                            </tr>
                        `:``}
                        ${t.tax&&t.tax>0?`
                            <tr>
                                <td style="padding: 6px 0; color: #64748b;">VAT (${t.taxRatePercent||18}%):</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: 600;">TZS ${e(t.tax,n)}</td>
                            </tr>
                        `:``}
                        ${t.serviceCharge&&t.serviceCharge>0?`
                            <tr>
                                <td style="padding: 6px 0; color: #64748b;">Service Charge:</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: 600;">TZS ${e(t.serviceCharge,n)}</td>
                            </tr>
                        `:``}
                        <tr style="border-top: 2px solid #0f172a; font-size: 15px;">
                            <td style="padding: 10px 0; font-weight: 800; color: #0f172a;">Grand Total:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: 800; color: #0f172a;">TZS ${e(t.grandTotal,n)}</td>
                        </tr>
                        ${t.amountPaid===void 0?``:`
                            <tr style="border-top: 1px solid #e2e8f0;">
                                <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #16a34a;">TZS ${e(t.amountPaid,n)}</td>
                            </tr>
                        `}
                        ${t.balanceDue===void 0?``:`
                            <tr>
                                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">Balance Due:</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: 800; color: ${t.balanceDue>0?`#dc2626`:`#16a34a`};">TZS ${e(t.balanceDue,n)}</td>
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
                    ${r(t.footerText||`Thank you for choosing our hospitality services!`)}
                </div>
            </div>
        </body>
        </html>
    `;a.open(),a.write(l),a.close(),setTimeout(()=>{try{i.contentWindow?.focus(),i.contentWindow?.print()}catch(e){console.error(`A4 print error:`,e)}finally{setTimeout(()=>{document.body.contains(i)&&document.body.removeChild(i)},1e3)}},250)}function r(e){return e?e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`):``}export{t as n,n as t};