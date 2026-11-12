import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    BellRing,
    Building2,
    CheckCircle2,
    FileText,
    Globe,
    HelpCircle,
    Hotel,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Printer,
    Receipt,
    Save,
    Send,
    Shield,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Wifi,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface TenantSettingsProps extends PageProps {
    tenant: {
        id: string;
        name: string;
        slug: string;
        subdomain?: string;
        plan: string;
        system_name: string;
        tagline?: string;
        tin?: string;
        vrn?: string;
        business_license?: string;
        phone?: string;
        email?: string;
        address?: string;
        city?: string;
        country?: string;
        website?: string;
        receipt_header?: string;
        receipt_footer?: string;
        currency?: string;
        currency_symbol?: string;
        sender_id?: string;
        wifi_ssid?: string;
        wifi_password?: string;
    };
    property?: any;
    businessDate?: string;
}

export default function TenantSettings({ auth, tenant, property, businessDate }: TenantSettingsProps) {
    const [previewTab, setPreviewTab] = useState<'receipt' | 'message' | 'system'>('receipt');

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: tenant.name || '',
        system_name: tenant.system_name || tenant.name || 'THE INNS',
        tagline: tenant.tagline || 'Excellence in Luxury Hospitality & Guest Comfort',
        tin: tenant.tin || '102-458-999',
        vrn: tenant.vrn || '40-001234-A',
        business_license: tenant.business_license || 'BL-2026-00918',
        phone: tenant.phone || '+255 754 000 111',
        email: tenant.email || 'info@theinns.co.tz',
        address: tenant.address || 'Plot 42, Safari Way, P.O. Box 1042',
        city: tenant.city || 'Seronera, Serengeti',
        country: tenant.country || 'Tanzania',
        website: tenant.website || 'https://theinns.co.tz',
        receipt_header: tenant.receipt_header || 'OFFICIAL FISCAL CASH RECEIPT / INVOICE',
        receipt_footer: tenant.receipt_footer || 'Thank you for staying with us! Goods & services once paid are non-refundable. Karibu tena!',
        currency: tenant.currency || 'TZS',
        currency_symbol: tenant.currency_symbol || 'TZS',
        sender_id: tenant.sender_id || tenant.name || 'THE INNS',
        wifi_ssid: tenant.wifi_ssid || 'GUEST-HIGH-SPEED-WIFI',
        wifi_password: tenant.wifi_password || 'welcome2026',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('tenant.settings.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout header="Hotel & Receipt Branding Configuration">
            <Head title="Hotel Branding & Receipts - Tenant Settings" />

            <div className="max-w-7xl mx-auto space-y-6 pb-16">
                {/* Header Banner (Slim & Clean) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Hotel Identity, Receipt & System Branding
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-xs shrink-0">
                        <span className="text-slate-500 font-medium">Tenant:</span>
                        <span className="font-black text-slate-900">{data.name || 'Hotel Property'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({tenant.plan || 'Standard'})</span>
                    </div>
                </div>

                {/* Success Banner */}
                {recentlySuccessful && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                                <h4 className="text-xs font-bold">Settings Saved Successfully</h4>
                                <p className="text-[11px] text-emerald-700">All receipts, guest messages, invoices, and system navigation now use your updated hotel details.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Multi-Recipient Quick Navigation Banner (Slim & Clean) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        Multi-Recipient Alert Contacts (More Phones & Emails)
                    </h4>
                    <Link
                        href={route('manager.notifications.index')}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
                    >
                        <span>Configure Message Recipients &rarr;</span>
                    </Link>
                </div>

                {/* Main Grid: Form (7 cols) + Real-Time Live Preview (5 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Configuration Form */}
                    <div className="lg:col-span-7 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Card 1: Hotel & System Identity */}
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-extrabold text-slate-900">1. Hotel & System Identity</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Hotel / Business Legal Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g. Platinum Medical Hotel & Suites"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                            required
                                        />
                                        
                                        {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            System / Application Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.system_name}
                                            onChange={(e) => setData('system_name', e.target.value)}
                                            placeholder="e.g. PLATINUM HMS or THE INNS"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                        
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Hotel Slogan / Tagline
                                        </label>
                                        <input
                                            type="text"
                                            value={data.tagline}
                                            onChange={(e) => setData('tagline', e.target.value)}
                                            placeholder="e.g. Luxury, Comfort & Exceptional Service"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Contact & Location */}
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-extrabold text-slate-900">2. Official Contact & Physical Location</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Telephone / Mobile Number
                                        </label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+255 754 000 111"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Official Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="info@yourhotel.co.tz"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Physical Address / Street / P.O. Box
                                        </label>
                                        <input
                                            type="text"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            placeholder="Plot 42, Safari Way, P.O. Box 1042"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            City / Region
                                        </label>
                                        <input
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder="Seronera, Serengeti"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            value={data.country}
                                            onChange={(e) => setData('country', e.target.value)}
                                            placeholder="Tanzania"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Official Website URL
                                        </label>
                                        <input
                                            type="text"
                                            value={data.website}
                                            onChange={(e) => setData('website', e.target.value)}
                                            placeholder="https://yourhotel.co.tz"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Fiscal Registration & TRA Identification */}
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-extrabold text-slate-900">3. Statutory & Fiscal Tax Numbers (TRA)</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Tax ID Number (TIN)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.tin}
                                            onChange={(e) => setData('tin', e.target.value)}
                                            placeholder="102-458-999"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            VAT Reg. Number (VRN)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.vrn}
                                            onChange={(e) => setData('vrn', e.target.value)}
                                            placeholder="40-001234-A"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Business License No.
                                        </label>
                                        <input
                                            type="text"
                                            value={data.business_license}
                                            onChange={(e) => setData('business_license', e.target.value)}
                                            placeholder="BL-2026-00918"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Receipt & Invoice Customization */}
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-extrabold text-slate-900">4. Receipt & Invoice Customization</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Receipt Header Title
                                        </label>
                                        <input
                                            type="text"
                                            value={data.receipt_header}
                                            onChange={(e) => setData('receipt_header', e.target.value)}
                                            placeholder="OFFICIAL FISCAL CASH RECEIPT / INVOICE"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Receipt Footer Terms & Policy Note
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={data.receipt_footer}
                                            onChange={(e) => setData('receipt_footer', e.target.value)}
                                            placeholder="Thank you for staying with us! Goods & services once paid are non-refundable. Karibu tena!"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition leading-relaxed"
                                        />
                                        
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Currency Code
                                            </label>
                                            <input
                                                type="text"
                                                value={data.currency}
                                                onChange={(e) => setData('currency', e.target.value)}
                                                placeholder="TZS"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Currency Symbol
                                            </label>
                                            <input
                                                type="text"
                                                value={data.currency_symbol}
                                                onChange={(e) => setData('currency_symbol', e.target.value)}
                                                placeholder="TZS"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 5: Guest Communications & Messaging */}
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-extrabold text-slate-900">5. Messaging & Guest Wi-Fi Communications</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            SMS & WhatsApp Sender Brand Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.sender_id}
                                            onChange={(e) => setData('sender_id', e.target.value)}
                                            placeholder="e.g. PLATINUM or SERENGETI"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                        
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Guest Wi-Fi Network (SSID)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.wifi_ssid}
                                                onChange={(e) => setData('wifi_ssid', e.target.value)}
                                                placeholder="GUEST-HIGH-SPEED-WIFI"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Guest Wi-Fi Password
                                            </label>
                                            <input
                                                type="text"
                                                value={data.wifi_password}
                                                onChange={(e) => setData('wifi_password', e.target.value)}
                                                placeholder="welcome2026"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2 sticky bottom-4 z-20">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center cursor-pointer disabled:opacity-60"
                                >
                                    <span>{processing ? 'Saving Changes Across System...' : 'Save Hotel Branding & Document Settings'}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: Real-Time Live Preview (5 cols) */}
                    <div className="lg:col-span-5 space-y-6 sticky top-20">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Live Document Preview</span>
                                </div>
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    Updates in Real-Time
                                </span>
                            </div>

                            {/* Preview Tabs */}
                            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('receipt')}
                                    className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                        previewTab === 'receipt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <span>Thermal Slip</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('message')}
                                    className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                        previewTab === 'message' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <span>Messages</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('system')}
                                    className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                        previewTab === 'system' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span>System Bar</span>
                                </button>
                            </div>

                            {/* TAB 1: 80mm ESC/POS Thermal Receipt Simulation */}
                            {previewTab === 'receipt' && (
                                <div className="flex flex-col items-center pt-2">
                                    <div className="w-full max-w-[280px] bg-white border-2 border-dashed border-slate-300 p-4 font-mono text-[11px] text-slate-900 leading-tight shadow-inner rounded-sm space-y-2">
                                        <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
                                            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-950">
                                                {data.name || 'HOTEL LEGAL NAME'}
                                            </h4>
                                            <p className="text-[10px] text-slate-600">{data.address || 'Plot 42, Safari Way'}</p>
                                            <p className="text-[10px] text-slate-600">
                                                {data.city || 'Seronera'}{data.country ? `, ${data.country}` : ''}
                                            </p>
                                            <p className="text-[10px] text-slate-600">
                                                TIN: {data.tin || '102-458-999'}{data.vrn ? ` | VRN: ${data.vrn}` : ''}
                                            </p>
                                            <p className="text-[10px] text-slate-600">TEL: {data.phone || '+255 754 000 111'}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide pt-1 border-t border-slate-200 mt-1">
                                                {data.receipt_header || 'OFFICIAL CASH RECEIPT'}
                                            </p>
                                        </div>

                                        <div className="py-1 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
                                            <div className="flex justify-between">
                                                <span>RCV NO:</span>
                                                <span className="font-bold">REC-2026-0814</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>DATE:</span>
                                                <span>{new Date().toISOString().split('T')[0]}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>ROOM:</span>
                                                <span className="font-bold">Room #204 (Deluxe)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>GUEST:</span>
                                                <span className="font-bold truncate max-w-[130px]">David Mushi</span>
                                            </div>
                                        </div>

                                        <div className="py-1 border-b border-dashed border-slate-300">
                                            <div className="flex justify-between font-bold text-[10px] mb-1">
                                                <span>DESCRIPTION</span>
                                                <span>AMT ({data.currency_symbol || 'TZS'})</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] py-0.5">
                                                <span>Room Stay (2 Nights)</span>
                                                <span className="font-bold">240,000</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] py-0.5">
                                                <span>Restaurant Breakfast</span>
                                                <span className="font-bold">35,000</span>
                                            </div>
                                        </div>

                                        <div className="py-1 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
                                            <div className="flex justify-between">
                                                <span>SUBTOTAL:</span>
                                                <span>233,050</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>VAT (18% INCL):</span>
                                                <span>41,950</span>
                                            </div>
                                            <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-200 mt-1">
                                                <span>TOTAL PAID:</span>
                                                <span className="text-[#1E3A5F]">{data.currency_symbol || 'TZS'} 275,000</span>
                                            </div>
                                        </div>

                                        <div className="text-center pt-2 text-[9px] text-slate-500 space-y-1">
                                            <div className="w-14 h-14 border border-slate-300 mx-auto flex items-center justify-center bg-slate-50 text-[8px] font-bold text-slate-400">
                                                [TRA QR]
                                            </div>
                                            <p className="font-bold text-slate-700">VERIFIED FISCAL RECEIPT</p>
                                            <p className="text-[10px] italic leading-tight text-slate-600">
                                                "{data.receipt_footer || `Thank you for choosing ${data.name || 'us'}!`}"
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2 text-center">
                                        Rendered identically on all thermal and A4 printers.
                                    </p>
                                </div>
                            )}

                            {/* TAB 2: SMS & WhatsApp Message Preview */}
                            {previewTab === 'message' && (
                                <div className="space-y-4 pt-1">
                                    {/* WhatsApp Simulation */}
                                    <div className="rounded-2xl bg-[#075E54] p-3 text-white shadow-md">
                                        <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-2">
                                            <span className="text-xs font-bold flex items-center gap-1.5">
                                                <span>WhatsApp Booking Alert</span>
                                            </span>
                                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">12:30 PM</span>
                                        </div>
                                        <div className="bg-[#DCF8C6] text-slate-900 rounded-xl p-3 text-xs font-mono space-y-1 shadow-xs whitespace-pre-wrap leading-relaxed">
                                            <p className="font-black text-slate-950">🏨 *{data.sender_id || data.name} - NEW RESERVATION ALERT*</p>
                                            <p className="text-[11px]">📍 *Property:* {data.name}</p>
                                            <p className="text-[11px]">👤 *Guest:* Jane Doe (+255712...)</p>
                                            <p className="text-[11px]">🚪 *Room:* Room #204 (Deluxe)</p>
                                            <p className="text-[11px]">💰 *Total Rate:* {data.currency || 'TZS'} 360,000</p>
                                            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-300/50">_Automated Notification recorded by {data.system_name}._</p>
                                        </div>
                                    </div>

                                    {/* SMS Simulation */}
                                    <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-md">
                                        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                                            <span className="text-xs font-bold text-slate-200">Standard GSM SMS</span>
                                            <span className="text-[10px] text-[#D4AF37] font-bold">Sender: {data.sender_id || 'HOTEL'}</span>
                                        </div>
                                        <div className="bg-slate-800 text-slate-100 rounded-xl p-3 text-xs font-mono space-y-1 whitespace-pre-wrap leading-relaxed">
                                            {data.sender_id || 'HOTEL'} Alert: New Booking {data.name}!\nGuest: Jane Doe\nRoom: #204 (Deluxe)\nTotal: {data.currency || 'TZS'} 360,000\nRef: RES-98214
                                        </div>
                                    </div>

                                    {/* Wi-Fi Welcome Card */}
                                    <div className="rounded-2xl bg-purple-50 border border-purple-200 p-3 space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                                            <span>Guest Check-in Welcome Note</span>
                                        </div>
                                        <p className="text-[11px] text-purple-800 leading-relaxed font-mono">
                                            📶 Wi-Fi: <strong>{data.wifi_ssid || 'GUEST-WIFI'}</strong><br />
                                            🔑 Password: <strong>{data.wifi_password || 'welcome2026'}</strong>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: System Header & Bar Preview */}
                            {previewTab === 'system' && (
                                <div className="space-y-4 pt-1">
                                    <p className="text-xs text-slate-500">
                                        This is how your workspace header, mobile navigation, and active property title appear to all staff:
                                    </p>

                                    {/* Top Navigation Bar Simulation */}
                                    <div className="rounded-2xl bg-[#1E3A5F] p-4 text-white border border-[#D4AF37]/30 shadow-md space-y-3">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-[#D4AF37] text-[#1E3A5F] font-black flex items-center justify-center text-xs shadow-xs">
                                                    P
                                                </div>
                                                <span className="font-extrabold text-sm text-[#D4AF37] tracking-wider uppercase">
                                                    {data.system_name || 'SYSTEM BRAND'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                                                PWA Ready
                                            </span>
                                        </div>

                                        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white">{data.name || 'Hotel Property Name'}</div>
                                                <div className="text-[10px] text-slate-300">{data.tagline || 'Hotel Property Workspace'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PWA App Title */}
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
                                        <span className="font-bold block text-slate-800">Browser & PWA Window Title:</span>
                                        <span className="font-mono text-[11px] text-[#1E3A5F] mt-0.5 block">
                                            Dashboard - {data.system_name || 'THE INNS'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

