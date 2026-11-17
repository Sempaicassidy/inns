import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    BellRing,
    Building2,
    CheckCircle2,
    Database,
    Eye,
    EyeOff,
    FileText,
    Globe,
    HelpCircle,
    Hotel,
    Loader2,
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
import TenantDataClearModal from '@/Components/TenantDataClearModal';

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
        vfd_device_id?: string;
        vfd_api_key?: string;
        vfd_base_url?: string;
        vfd_environment?: string;
        vfd_is_configured?: boolean;
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
    const [showClearDataModal, setShowClearDataModal] = useState(false);
    const [isTestingVfd, setIsTestingVfd] = useState(false);
    const [vfdTestResult, setVfdTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: tenant.name || '',
        system_name: tenant.system_name || tenant.name || 'THE INNS',
        tagline: tenant.tagline || 'Excellence in Luxury Hospitality & Guest Comfort',
        tin: tenant.tin || '',
        vrn: tenant.vrn || '',
        business_license: tenant.business_license || 'BL-2026-00918',
        vfd_device_id: tenant.vfd_device_id || '',
        vfd_api_key: tenant.vfd_api_key || '',
        vfd_base_url: tenant.vfd_base_url || 'https://vfd.tra.go.tz/api/v1',
        vfd_environment: tenant.vfd_environment || 'sandbox',
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

    const handleTestVfd = async () => {
        setIsTestingVfd(true);
        setVfdTestResult(null);
        try {
            const response = await axios.post(route('tenant.settings.test-vfd'), {
                vfd_device_id: data.vfd_device_id,
                vfd_api_key: data.vfd_api_key,
                vfd_base_url: data.vfd_base_url,
                vfd_environment: data.vfd_environment,
            });
            setVfdTestResult(response.data);
        } catch (err: any) {
            setVfdTestResult({
                success: false,
                message: err.response?.data?.message || 'Hitilafu ya mtandao wakati wa kupima mawasiliano.',
            });
        } finally {
            setIsTestingVfd(false);
        }
    };

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
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-[#D4AF37]" />
                                        <h3 className="text-sm font-extrabold text-slate-900">
                                            3. Kodi & TRA VFD Integration (Electronic Fiscal Device)
                                        </h3>
                                    </div>
                                    {(tenant.vfd_is_configured || (data.vfd_device_id && data.vfd_api_key)) ? (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                            VFD Tayari Imeunganishwa
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 w-fit">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                            Inasubiri Taarifa za VFD
                                        </span>
                                    )}
                                </div>

                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1">
                                    <p className="font-semibold text-slate-800">
                                        💡 Maelekezo ya Kuanzisha TRA VFD (EFD Bila Mashine ya Mezani):
                                    </p>
                                    <p className="text-[11px] leading-relaxed">
                                        Tenant anahitaji tu kujaza <strong>TIN</strong>, <strong>VFD Device ID</strong>, na <strong>VFD API Key</strong> zilizotolewa na TRA au VFD Provider aliyesajiliwa (mfano: WebVFD, PosCloud, SmartVFD). Ukishahifadhi, mfumo utaanza kutoa stakabadhi za kikodi zenye QR code na namba ya TRA kiotomatiki kwa kila malipo ya folio au mauzo ya POS.
                                    </p>
                                </div>

                                {/* Statutory Identifiers */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Tax ID Number (TIN) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.tin}
                                            onChange={(e) => setData('tin', e.target.value)}
                                            placeholder="e.g. 102-458-999"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                        />
                                        {errors.tin && <p className="text-[11px] text-rose-600 mt-1">{errors.tin}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            VAT Reg. Number (VRN)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.vrn}
                                            onChange={(e) => setData('vrn', e.target.value)}
                                            placeholder="40-001234-A (ikiwa upo VAT)"
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

                                {/* VFD Technical Link Credentials */}
                                <div className="pt-2 border-t border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                                            Vipengele vya Mawasiliano ya VFD Gateway
                                        </h4>
                                        <span className="text-[11px] text-slate-400 font-mono">TRA Fiscal Gateway</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                VFD Device ID / EFD Unit ID <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.vfd_device_id}
                                                onChange={(e) => setData('vfd_device_id', e.target.value)}
                                                placeholder="k.m. VFD-INNS-00129"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition font-mono"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Namba ya kifaa uliyotengewa na TRA au VFD Provider.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                VFD API Key / Secret Token <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showApiKey ? 'text' : 'password'}
                                                    value={data.vfd_api_key}
                                                    onChange={(e) => setData('vfd_api_key', e.target.value)}
                                                    placeholder="vfd_sec_live_xxxxxxxx..."
                                                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowApiKey(!showApiKey)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                                                >
                                                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Ufunguo wa kiusalama unaothibitisha maombi yako kwa VFD gateway.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Mazingira (Environment)
                                            </label>
                                            <select
                                                value={data.vfd_environment}
                                                onChange={(e) => setData('vfd_environment', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
                                            >
                                                <option value="sandbox">Sandbox (Majaribio / Test Mode)</option>
                                                <option value="production">Production (Mifumo Rasmi ya TRA - Live)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                VFD Gateway URL (Hiari / Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.vfd_base_url}
                                                onChange={(e) => setData('vfd_base_url', e.target.value)}
                                                placeholder="https://vfd.tra.go.tz/api/v1"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition font-mono"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Iache kama ilivyo isipokuwa ukitumia VFD provider binafsi.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Test VFD Connection Button & Result */}
                                    <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            disabled={isTestingVfd || !data.vfd_device_id || !data.vfd_api_key}
                                            onClick={handleTestVfd}
                                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200/80"
                                        >
                                            {isTestingVfd ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                                                    <span>Inapima Mawasiliano na VFD...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                                    <span>Jaribu Mawasiliano ya VFD (Test Connection)</span>
                                                </>
                                            )}
                                        </button>

                                        <span className="text-[11px] text-slate-400">
                                            Unaweza kupima mara moja hata kabla ya kuhifadhi.
                                        </span>
                                    </div>

                                    {vfdTestResult && (
                                        <div
                                            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                                                vfdTestResult.success
                                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                                                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                                            }`}
                                        >
                                            {vfdTestResult.success ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                            )}
                                            <div>
                                                <p className="font-bold">
                                                    {vfdTestResult.success ? 'Uthibitisho Umefanikiwa' : 'Mawasiliano Yameshindwa'}
                                                </p>
                                                <p className="text-[11px] mt-0.5">{vfdTestResult.message}</p>
                                            </div>
                                        </div>
                                    )}
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

                        {/* Danger Zone: Clear Database per Module */}
                        <div className="bg-white rounded-3xl p-6 shadow-xs border border-rose-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                                        <Database className="w-4 h-4 text-rose-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900">
                                            Eneo la Hatari: Safisha Database kwa Moduli
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Futa rekodi au miamala ya majaribio kwa moduli mahususi za hoteli hii.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                                    Danger Zone
                                </span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                                Unaweza kusafisha data ya moduli fulani (kama Uhifadhi wa Vyumba, Mauzo ya POS, Stoo, au Leja ya Uhasibu) ili kuanza upya. Akaunti za wafanyakazi na taarifa za msingi za hoteli hazitaguswa.
                            </p>

                            <button
                                type="button"
                                onClick={() => setShowClearDataModal(true)}
                                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                            >
                                <Database className="w-4 h-4" />
                                <span>Fungua Dirisha la Kusafisha Database kwa Moduli</span>
                            </button>
                        </div>
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

            {/* Modal: Clear Database per Module */}
            {showClearDataModal && (
                <TenantDataClearModal
                    isOpen={showClearDataModal}
                    onClose={() => setShowClearDataModal(false)}
                    tenant={tenant}
                    countsEndpoint={route('tenant.settings.module-counts')}
                    clearEndpoint={route('tenant.settings.clear-module-data')}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}
        </AuthenticatedLayout>
    );
}

