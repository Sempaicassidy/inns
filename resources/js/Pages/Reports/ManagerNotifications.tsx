import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    BarChart3,
    Bed,
    Bell,
    BellRing,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Mail,
    MessageSquare,
    Phone,
    Plus,
    Send,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Trash2,
    UserPlus,
    Users,
    Utensils,
    Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface ManagerNotificationProps extends PageProps {
    setting: {
        id: string;
        tenant_id: string;
        property_id: string | null;
        manager_name: string;
        phone_number: string | null;
        additional_phones?: string | string[] | null;
        email: string | null;
        additional_emails?: string | string[] | null;
        recipients?: Array<{ name: string; phone: string; email: string }> | null;
        report_time: string;
        send_via_sms: boolean;
        send_via_whatsapp: boolean;
        send_via_email: boolean;
        notify_on_reservation: boolean;
        notify_daily_report: boolean;
        last_daily_report_sent_at: string | null;
        last_daily_report_date: string | null;
        is_active: boolean;
    };
    previewData: {
        propertyName: string;
        reportDate: string;
        generatedAt: string;
        rooms: {
            total: number;
            occupied: number;
            available: number;
            dirty: number;
            maintenance: number;
            occupancyRate: number;
            reservationsToday: number;
            arrivalsExpected: number;
            departuresExpected: number;
        };
        restaurant: {
            ordersCount: number;
            revenueMinor: number;
            revenueFormatted: string;
        };
        grocery: {
            ordersCount: number;
            revenueMinor: number;
            revenueFormatted: string;
        };
        revenue: {
            roomMinor: number;
            roomFormatted: string;
            restaurantMinor: number;
            restaurantFormatted: string;
            groceryMinor: number;
            groceryFormatted: string;
            totalGrossMinor: number;
            totalGrossFormatted: string;
        };
    };
    property: {
        id: string;
        name: string;
    } | null;
}

export default function ManagerNotifications({
    auth,
    setting,
    previewData,
    property,
    flash,
}: ManagerNotificationProps) {
    const initialRecipients = Array.isArray(setting?.recipients) ? setting.recipients : [];

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        manager_name: setting?.manager_name || 'General Manager',
        phone_number: setting?.phone_number || '',
        additional_phones: typeof setting?.additional_phones === 'string'
            ? setting.additional_phones
            : (Array.isArray(setting?.additional_phones) ? setting.additional_phones.join(', ') : ''),
        email: setting?.email || '',
        additional_emails: typeof setting?.additional_emails === 'string'
            ? setting.additional_emails
            : (Array.isArray(setting?.additional_emails) ? setting.additional_emails.join(', ') : ''),
        recipients: initialRecipients as Array<{ name: string; phone: string; email: string }>,
        report_time: setting?.report_time || '12:30',
        send_via_sms: setting?.send_via_sms ?? true,
        send_via_whatsapp: setting?.send_via_whatsapp ?? true,
        send_via_email: setting?.send_via_email ?? true,
        notify_on_reservation: setting?.notify_on_reservation ?? true,
        notify_daily_report: setting?.notify_daily_report ?? true,
        is_active: setting?.is_active ?? true,
    });

    const [testLoading, setTestLoading] = useState(false);
    const [testResLoading, setTestResLoading] = useState(false);

    // Dynamic Recipient Management
    const addRecipient = () => {
        setData('recipients', [
            ...data.recipients,
            { name: '', phone: '', email: '' }
        ]);
    };

    const updateRecipient = (index: number, field: 'name' | 'phone' | 'email', value: string) => {
        const updated = [...data.recipients];
        updated[index] = { ...updated[index], [field]: value };
        setData('recipients', updated);
    };

    const removeRecipient = (index: number) => {
        setData('recipients', data.recipients.filter((_, i) => i !== index));
    };

    // Calculate all resolved unique phones and emails
    const resolvedPhones = useMemo(() => {
        const phones = new Set<string>();
        [data.phone_number, data.additional_phones].forEach(field => {
            if (field) {
                field.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean).forEach(p => phones.add(p));
            }
        });
        data.recipients.forEach(r => {
            if (r.phone && r.phone.trim()) phones.add(r.phone.trim());
        });
        return Array.from(phones);
    }, [data.phone_number, data.additional_phones, data.recipients]);

    const resolvedEmails = useMemo(() => {
        const emails = new Set<string>();
        [data.email, data.additional_emails].forEach(field => {
            if (field) {
                field.split(/[,;\n]+/).map(e => e.trim()).filter(Boolean).forEach(e => emails.add(e));
            }
        });
        data.recipients.forEach(r => {
            if (r.email && r.email.trim()) emails.add(r.email.trim());
        });
        return Array.from(emails);
    }, [data.email, data.additional_emails, data.recipients]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('manager.notifications.settings.update'));
    };

    const handleSendTestReport = () => {
        setTestLoading(true);
        post(route('manager.notifications.test-report'), {
            onFinish: () => setTestLoading(false),
        });
    };

    const handleSendTestReservation = () => {
        setTestResLoading(true);
        post(route('manager.notifications.test-reservation'), {
            onFinish: () => setTestResLoading(false),
        });
    };

    return (
        <AuthenticatedLayout header="Multi-Recipient Executive Notification Hub">
            <Head title="Manager Alerts & Scheduled Reports - The Inns" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                {/* 1. Header Banner (Slim & Clean White) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                        Manager Alerts & Automated Scheduled Reports
                    </h1>

                    {/* Status Summary Badges */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-center min-w-[120px]">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Scheduled Time</span>
                            <span className="text-lg font-black text-slate-900">{data.report_time}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-center min-w-[120px]">
                            <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider">Total Targets</span>
                            <span className="text-lg font-black text-slate-900">{resolvedPhones.length + resolvedEmails.length}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Main 2-Column Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT COLUMN: Settings Form (7 Cols) */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                    
                                    <span>Manager Alert Configuration</span>
                                </h2>
                                
                            </div>

                            {recentlySuccessful && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Settings Saved!</span>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Primary Manager / Recipient Title */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Primary Manager / Recipient Title
                                </label>
                                <input
                                    type="text"
                                    value={data.manager_name}
                                    onChange={(e) => setData('manager_name', e.target.value)}
                                    placeholder="e.g. General Manager / Director"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15 transition font-medium"
                                    required
                                />
                                {errors.manager_name && (
                                    <p className="text-xs text-rose-500">{errors.manager_name}</p>
                                )}
                            </div>

                            {/* Primary Phone & Email Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            
                                            <span>Primary Phone Number(s)</span>
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-normal">SMS & WhatsApp</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone_number}
                                        onChange={(e) => setData('phone_number', e.target.value)}
                                        placeholder="07XXXXXXXX or 2557XXXXXXXX"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15 transition font-mono font-medium"
                                    />
                                    
                                    {errors.phone_number && (
                                        <p className="text-xs text-rose-500">{errors.phone_number}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            
                                            <span>Primary Email Address(es)</span>
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-normal">HTML Flash Reports</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="manager@hotel.co.tz, gm@hotel.co.tz"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15 transition font-medium"
                                    />
                                    
                                    {errors.email && (
                                        <p className="text-xs text-rose-500">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Additional Recipients Section (Multiple Stakeholders) */}
                            <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                                    <div className="flex items-center gap-2">
                                        
                                        <div>
                                            <h3 className="text-xs font-extrabold text-slate-900">
                                                Additional Recipients (Directors, Owners & Supervisors)
                                            </h3>
                                            <p className="text-[11px] text-slate-500">
                                                Add more phone numbers and email addresses to receive identical booking alerts and flash reports.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addRecipient}
                                        className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162a45] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                                    >
                                        
                                        <span>+ Add Recipient</span>
                                    </button>
                                </div>

                                {/* Dynamic Recipient Rows */}
                                {data.recipients.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.recipients.map((rec, idx) => (
                                            <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                                        <span className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#1E3A5F] flex items-center justify-center text-[10px] font-black">
                                                            {idx + 1}
                                                        </span>
                                                        <span>Recipient #{idx + 1}</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRecipient(idx)}
                                                        className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 transition cursor-pointer"
                                                        title="Remove this recipient"
                                                    >
                                                        
                                                        <span className="text-[11px]">Remove</span>
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Role / Name</label>
                                                        <input
                                                            type="text"
                                                            value={rec.name}
                                                            onChange={(e) => updateRecipient(idx, 'name', e.target.value)}
                                                            placeholder="e.g. Managing Director / Owner"
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#D4AF37] font-medium"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone (SMS & WhatsApp)</label>
                                                        <input
                                                            type="tel"
                                                            value={rec.phone}
                                                            onChange={(e) => updateRecipient(idx, 'phone', e.target.value)}
                                                            placeholder="+255754XXXXXX"
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#D4AF37] font-mono font-medium"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Email Address</label>
                                                        <input
                                                            type="email"
                                                            value={rec.email}
                                                            onChange={(e) => updateRecipient(idx, 'email', e.target.value)}
                                                            placeholder="director@hotel.co.tz"
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#D4AF37] font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 px-2 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 text-slate-500">
                                        <p className="text-xs font-semibold">No additional named recipients added yet.</p>
                                        
                                    </div>
                                )}

                                {/* Bulk Comma-Separated Inputs */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Extra Phone Numbers (Bulk comma/newline separated)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={data.additional_phones}
                                            onChange={(e) => setData('additional_phones', e.target.value)}
                                            placeholder="+255754111222, +255712333444, 0789555666"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#D4AF37]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Extra Email Addresses (Bulk comma/newline separated)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={data.additional_emails}
                                            onChange={(e) => setData('additional_emails', e.target.value)}
                                            placeholder="director@hotel.co.tz, owner@hotel.co.tz, accounts@hotel.co.tz"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#D4AF37]"
                                        />
                                    </div>
                                </div>

                                {/* Active Recipients Summary Counter */}
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5">
                                        
                                        <span>{resolvedPhones.length} Active Phone Number(s) Configured</span>
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold flex items-center gap-1.5">
                                        
                                        <span>{resolvedEmails.length} Active Email Address(es) Configured</span>
                                    </span>
                                </div>
                            </div>

                            {/* Scheduled Report Time */}
                            <div className="bg-[#1E3A5F]/5 border border-[#1E3A5F]/15 rounded-2xl p-4 sm:p-5 space-y-2">
                                <label className="block text-xs font-extrabold text-[#1E3A5F] flex items-center gap-2">
                                    
                                    <span>Daily Scheduled Report Time</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="time"
                                        value={data.report_time}
                                        onChange={(e) => setData('report_time', e.target.value)}
                                        className="px-4 py-3 bg-white border border-slate-300 rounded-xl text-base font-mono font-bold text-[#1E3A5F] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 shadow-xs"
                                        required
                                    />
                                    <div className="text-xs text-slate-600">
                                        <p className="font-semibold text-slate-800">Default: <span className="font-mono text-[#D4AF37] font-bold">12:30</span> (or custom hour, e.g. <span className="font-mono text-[#D4AF37] font-bold">06:30</span>)</p>
                                        
                                    </div>
                                </div>
                                {errors.report_time && (
                                    <p className="text-xs text-rose-500 font-semibold">{errors.report_time}</p>
                                )}
                            </div>

                            {/* 3 Channels Selection */}
                            <div className="space-y-3 pt-2">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                                    Active Delivery Channels
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* SMS Toggle */}
                                    <label className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                                        data.send_via_sms
                                            ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-xs'
                                            : 'border-slate-200 bg-slate-50 opacity-60'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-xs text-slate-900">1. Mobile SMS</span>
                                            <input
                                                type="checkbox"
                                                checked={data.send_via_sms}
                                                onChange={(e) => setData('send_via_sms', e.target.checked)}
                                                className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37]/20 border-slate-300"
                                            />
                                        </div>
                                        
                                    </label>

                                    {/* WhatsApp Toggle */}
                                    <label className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                                        data.send_via_whatsapp
                                            ? 'border-[#16a34a] bg-[#16a34a]/5 shadow-xs'
                                            : 'border-slate-200 bg-slate-50 opacity-60'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-xs text-slate-900">2. WhatsApp</span>
                                            <input
                                                type="checkbox"
                                                checked={data.send_via_whatsapp}
                                                onChange={(e) => setData('send_via_whatsapp', e.target.checked)}
                                                className="w-4 h-4 rounded text-[#16a34a] focus:ring-[#16a34a]/20 border-slate-300"
                                            />
                                        </div>
                                        
                                    </label>

                                    {/* Email Toggle */}
                                    <label className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                                        data.send_via_email
                                            ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 shadow-xs'
                                            : 'border-slate-200 bg-slate-50 opacity-60'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-xs text-slate-900">3. Email</span>
                                            <input
                                                type="checkbox"
                                                checked={data.send_via_email}
                                                onChange={(e) => setData('send_via_email', e.target.checked)}
                                                className="w-4 h-4 rounded text-[#1E3A5F] focus:ring-[#1E3A5F]/20 border-slate-300"
                                            />
                                        </div>
                                        
                                    </label>
                                </div>
                            </div>

                            {/* Notification Triggers */}
                            <div className="space-y-3 pt-2">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                                    Trigger Events
                                </span>

                                <div className="space-y-3">
                                    {/* Trigger 1: Room Reservation Alert */}
                                    <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.notify_on_reservation}
                                            onChange={(e) => setData('notify_on_reservation', e.target.checked)}
                                            className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37]/20 border-slate-300 mt-0.5"
                                        />
                                        <div>
                                            <span className="font-bold text-xs text-slate-900 block">
                                                🛎️ Real-Time Room Booking / Reservation Alert
                                            </span>
                                            
                                        </div>
                                    </label>

                                    {/* Trigger 2: Daily Executive Summary */}
                                    <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.notify_daily_report}
                                            onChange={(e) => setData('notify_daily_report', e.target.checked)}
                                            className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37]/20 border-slate-300 mt-0.5"
                                        />
                                        <div>
                                            <span className="font-bold text-xs text-slate-900 block">
                                                🌅 Automated Daily Executive Flash Report
                                            </span>
                                            
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Active Master Switch */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                                <div>
                                    <span className="font-bold text-xs text-emerald-900 block">Enable Automated Notifications</span>
                                    
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="w-5 h-5 rounded text-[#16a34a] focus:ring-[#16a34a]/20 border-emerald-300"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm  transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    
                                    <span>{processing ? 'Saving Settings...' : `Save Notification Settings (${resolvedPhones.length} Phones, ${resolvedEmails.length} Emails)`}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: Live Test Buttons & Data Preview (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Instant Test Buttons Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3">
                                
                                <span>Live Dispatch Verification (Instant Test)</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Verify your configuration instantly. Messages will be sent to all configured phones and emails:
                            </p>

                            {/* Target Audience Badge */}
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                    <span>Target Dispatch Audience:</span>
                                    <span className="text-[#1E3A5F]">{resolvedPhones.length} Phones • {resolvedEmails.length} Emails</span>
                                </div>
                                <div className="text-[11px] text-slate-500 space-y-1 font-mono">
                                    {resolvedPhones.length > 0 && (
                                        <div className="truncate">
                                            📱 {resolvedPhones.slice(0, 3).join(', ')}{resolvedPhones.length > 3 ? ` +${resolvedPhones.length - 3} more` : ''}
                                        </div>
                                    )}
                                    {resolvedEmails.length > 0 && (
                                        <div className="truncate">
                                            ✉️ {resolvedEmails.slice(0, 3).join(', ')}{resolvedEmails.length > 3 ? ` +${resolvedEmails.length - 3} more` : ''}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-1">
                                <button
                                    type="button"
                                    onClick={handleSendTestReport}
                                    disabled={testLoading}
                                    className="w-full py-3 px-4 rounded-xl bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-60"
                                >
                                    
                                    <span>{testLoading ? 'Dispatching Daily Report...' : 'Send Today’s Test Executive Report'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSendTestReservation}
                                    disabled={testResLoading}
                                    className="w-full py-3 px-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-60"
                                >
                                    
                                    <span>{testResLoading ? 'Dispatching Booking Alert...' : 'Send Test Room Booking Alert'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (typeof window !== 'undefined' && (window as any).triggerPwaNotificationPopup) {
                                            (window as any).triggerPwaNotificationPopup(
                                                '🛎️ Room 204 Booked (PWA Alert)',
                                                'Guest: David Mushi | 3 Nights | TZS 360,000 | Deposit: TZS 100,000',
                                                '/reservations'
                                            );
                                        } else {
                                            alert('PWA Notification Manager is initializing or not active.');
                                        }
                                    }}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] hover:from-[#c29f2e] hover:to-[#a18307] text-[#1E3A5F] font-black text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                                >
                                    
                                    <span>Test PWA Notification Popup & Chime</span>
                                </button>
                            </div>

                            {setting?.last_daily_report_sent_at && (
                                <p className="text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100 text-center">
                                    Last automated report dispatched: <strong>{new Date(setting.last_daily_report_sent_at).toLocaleString()}</strong>
                                </p>
                            )}
                        </div>

                        {/* Live Summary Preview of Today's Hotel Performance */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-white shadow-xl space-y-4 border border-slate-800">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <div className="flex items-center gap-2">
                                    
                                    <span className="font-extrabold text-sm text-white">Live Data Flash Preview</span>
                                </div>
                                <span className="text-[10px] bg-white/10 text-[#D4AF37] px-2 py-0.5 rounded-full font-mono font-bold">
                                    {previewData.reportDate}
                                </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                                Summary data compiled and delivered to all configured contacts at <strong>{data.report_time}</strong>:
                            </p>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Occupancy Rate</span>
                                    <span className="text-xl font-black text-[#D4AF37]">{previewData.rooms.occupancyRate}%</span>
                                    <span className="text-[10px] text-slate-300 block mt-0.5">{previewData.rooms.occupied} / {previewData.rooms.total} Rooms Occupied</span>
                                </div>

                                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Restaurant POS</span>
                                    <span className="text-xl font-black text-emerald-400">TZS {previewData.restaurant.revenueFormatted}</span>
                                    <span className="text-[10px] text-slate-300 block mt-0.5">{previewData.restaurant.ordersCount} Orders Handled</span>
                                </div>

                                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Grocery Minimart</span>
                                    <span className="text-xl font-black text-emerald-400">TZS {previewData.grocery.revenueFormatted}</span>
                                    <span className="text-[10px] text-slate-300 block mt-0.5">{previewData.grocery.ordersCount} Sales Transactions</span>
                                </div>

                                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Expected Check-ins</span>
                                    <span className="text-xl font-black text-white">{previewData.rooms.arrivalsExpected}</span>
                                    <span className="text-[10px] text-slate-300 block mt-0.5">{previewData.rooms.departuresExpected} Check-outs Expected</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-center space-y-1">
                                <span className="text-[11px] text-[#D4AF37] uppercase font-extrabold tracking-wider block">Today's Total Gross Revenue Collected</span>
                                <span className="text-2xl font-black text-white block">TZS {previewData.revenue.totalGrossFormatted}</span>
                                <span className="text-[10px] text-slate-300">Room: TZS {previewData.revenue.roomFormatted} • Rest: TZS {previewData.revenue.restaurantFormatted} • Groc: TZS {previewData.revenue.groceryFormatted}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
