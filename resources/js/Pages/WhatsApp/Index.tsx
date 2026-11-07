import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Bell,
    Check,
    CheckCheck,
    CheckCircle2,
    Clock,
    FileText,
    MessageSquare,
    PhoneCall,
    Send,
    Settings,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface WhatsAppSetting {
    id: string;
    phone_number_id?: string;
    business_account_id?: string;
    access_token?: string;
    sender_phone_number?: string;
    send_on_reservation_confirmed: boolean;
    send_on_checkin: boolean;
    send_on_checkout_invoice: boolean;
    send_on_housekeeping_ready: boolean;
    is_active: boolean;
}

interface WhatsAppLog {
    id: string;
    recipient_phone: string;
    message_type: string;
    template_name?: string;
    status: string;
    error_message?: string;
    created_at: string;
}

interface Guest {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
}

interface WhatsAppIndexProps extends PageProps {
    setting: WhatsAppSetting | null;
    logs: WhatsAppLog[];
    recentGuests: Guest[];
    stats: {
        total_sent: number;
        delivered_count: number;
        failed_count: number;
    };
}

export default function WhatsAppIndex({
    auth,
    setting,
    logs,
    recentGuests,
    stats,
}: WhatsAppIndexProps) {
    const [activeTab, setActiveTab] = useState<'messaging' | 'settings'>('messaging');

    // Quick Message Form
    const sendForm = useForm({
        guest_id: '',
        recipient_phone: '',
        message: '',
    });

    // Settings Form
    const settingsForm = useForm({
        phone_number_id: setting?.phone_number_id || '',
        business_account_id: setting?.business_account_id || '',
        access_token: setting?.access_token || '',
        sender_phone_number: setting?.sender_phone_number || '',
        send_on_reservation_confirmed: setting?.send_on_reservation_confirmed ?? true,
        send_on_checkin: setting?.send_on_checkin ?? true,
        send_on_checkout_invoice: setting?.send_on_checkout_invoice ?? true,
        send_on_housekeeping_ready: setting?.send_on_housekeeping_ready ?? false,
        is_active: setting?.is_active ?? true,
    });

    const handleSelectGuest = (guestId: string) => {
        sendForm.setData('guest_id', guestId);
        const g = recentGuests.find((x) => x.id === guestId);
        if (g && g.phone) {
            sendForm.setData('recipient_phone', g.phone);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        sendForm.post(route('whatsapp.send'), {
            onSuccess: () => {
                sendForm.reset('message');
            },
        });
    };

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        settingsForm.post(route('whatsapp.settings.update'));
    };

    const deliveryRate = stats.total_sent > 0
        ? Math.round((stats.delivered_count / stats.total_sent) * 100)
        : 100;

    return (
        <AuthenticatedLayout>
            <Head title="WhatsApp Integration & Notifications - THE INNS" />

            <div className="space-y-4 sm:space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                            Messaging & Notifications Hub
                        </h1>
                        
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className="inline-flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 font-semibold px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-xs sm:text-sm transition-all min-h-[38px]"
                        >
                            <span>API Credentials</span>
                        </button>
                    </div>
                </div>

                {/* SMS Wallet & Live Credits Status Card - Clean & Slim */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="min-w-0">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                            Hotel SMS Credit Wallet
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 flex items-baseline gap-2">
                            <span>{Number((auth as any)?.sms_balance ?? 0).toLocaleString()}</span>
                            <span className="text-xs sm:text-sm font-normal text-slate-500">Credits Available</span>
                        </h3>
                    </div>

                    <div className="flex items-center gap-2.5 sm:gap-3 text-xs shrink-0">
                        <div className="bg-slate-50 border border-slate-100 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center min-w-[90px]">
                            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Used</span>
                            <span className="font-mono font-bold text-sm sm:text-base text-slate-800">
                                {Number((auth as any)?.sms_wallet?.total_used ?? 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center min-w-[90px]">
                            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Purchased</span>
                            <span className="font-mono font-bold text-sm sm:text-base text-slate-800">
                                {Number((auth as any)?.sms_wallet?.total_purchased ?? 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4 KPI Cards (2-col mobile, 4-col desktop) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        
                        <div className="min-w-0">
                            <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                                Sent
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                                {stats.total_sent}
                            </div>
                            
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        
                        <div className="min-w-0">
                            <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                                Delivery Rate
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                                {deliveryRate}%
                            </div>
                            
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        
                        <div className="min-w-0">
                            <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                                Auto Triggers
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                                4 Active
                            </div>
                            
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        
                        <div className="min-w-0">
                            <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                                Sender
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">
                                {setting?.sender_phone_number || '+255 (Haula HMS)'}
                            </div>
                            
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('messaging')}
                        className={`pb-2.5 sm:pb-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                            activeTab === 'messaging'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        Quick Dispatch & Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-2.5 sm:pb-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                            activeTab === 'settings'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        
                        API Credentials & Automated Triggers
                    </button>
                </div>

                {/* TAB 1: Messaging & Audit Logs */}
                {activeTab === 'messaging' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                        {/* Quick Message Composer */}
                        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Send className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Direct Guest Messenger</h3>
                            </div>
                            <p className="text-xs text-slate-500">
                                Send direct custom notifications, welcome greetings, or flight transfer updates to guests
                            </p>

                            <form onSubmit={handleSendMessage} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                        Choose In-House Guest (Optional)
                                    </label>
                                    <select
                                        value={sendForm.data.guest_id}
                                        onChange={(e) => handleSelectGuest(e.target.value)}
                                        className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                                    >
                                        <option value="">-- Manual Number or Select Guest --</option>
                                        {recentGuests.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.first_name} {g.last_name} ({g.phone || 'No phone'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                        Recipient WhatsApp Phone *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. +255712345678"
                                        value={sendForm.data.recipient_phone}
                                        onChange={(e) => sendForm.setData('recipient_phone', e.target.value)}
                                        className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Use country code format (e.g. +255 for Tanzania)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                        Message Body *
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Hello! Welcome to THE INNS. Your room is ready..."
                                        value={sendForm.data.message}
                                        onChange={(e) => sendForm.setData('message', e.target.value)}
                                        className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={sendForm.processing}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-sm text-sm transition-all min-h-[44px]"
                                >
                                    <Send className="w-4 h-4" />
                                    {sendForm.processing ? 'Dispatching...' : 'Send WhatsApp Message'}
                                </button>
                            </form>
                        </div>

                        {/* Recent Delivery Logs */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                        WhatsApp Delivery Audit Trail
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Recent messages triggered by the system or front desk staff
                                    </p>
                                </div>
                                <span className="text-xs text-slate-400">Last 30 records</span>
                            </div>

                            {/* MOBILE: Delivery Cards (<sm screens) */}
                            <div className="sm:hidden space-y-2.5">
                                {logs.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 text-xs">
                                        No WhatsApp messages recorded yet.
                                    </div>
                                ) : (
                                    logs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs font-semibold text-slate-900">
                                                    {log.recipient_phone}
                                                </span>
                                                {log.status === 'delivered' || log.status === 'sent' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                        <CheckCheck className="w-3 h-3" />
                                                        Delivered
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Failed
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                                                <span className="capitalize font-medium text-[11px]">
                                                    {log.message_type.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* DESKTOP: Delivery Table (>=sm screens) */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                                            <th className="py-3 px-3">Recipient</th>
                                            <th className="py-3 px-3">Type & Template</th>
                                            <th className="py-3 px-3">Status</th>
                                            <th className="py-3 px-3 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-400">
                                                    No WhatsApp messages recorded yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 px-3">
                                                        <div className="font-semibold text-slate-900 text-xs font-mono">
                                                            {log.recipient_phone}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className="capitalize text-xs font-medium text-slate-800">
                                                            {log.message_type.replace(/_/g, ' ')}
                                                        </span>
                                                        {log.template_name && (
                                                            <div className="text-[11px] text-slate-400">
                                                                Template: {log.template_name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        {log.status === 'delivered' || log.status === 'sent' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                                <CheckCheck className="w-3.5 h-3.5" />
                                                                Delivered
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                                                                <AlertCircle className="w-3.5 h-3.5" />
                                                                Failed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-right text-xs text-slate-400">
                                                        {new Date(log.created_at).toLocaleString('en-GB')}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: Settings & Automated Triggers */}
                {activeTab === 'settings' && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-4xl space-y-6">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">
                                Meta Cloud API & Automation Triggers
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Configure your official WhatsApp Business Cloud API parameters and automation switches
                            </p>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-6">
                            {/* API Credentials */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                                    Meta Cloud API Credentials
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                            Phone Number ID
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 109847294829104"
                                            value={settingsForm.data.phone_number_id}
                                            onChange={(e) =>
                                                settingsForm.setData('phone_number_id', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                            WhatsApp Business Account ID (WABA)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 984729104829103"
                                            value={settingsForm.data.business_account_id}
                                            onChange={(e) =>
                                                settingsForm.setData('business_account_id', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                            Sender WhatsApp Phone
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="+255 7XX XXX XXX"
                                            value={settingsForm.data.sender_phone_number}
                                            onChange={(e) =>
                                                settingsForm.setData('sender_phone_number', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 pt-6">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={settingsForm.data.is_active}
                                            onChange={(e) =>
                                                settingsForm.setData('is_active', e.target.checked)
                                            }
                                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                        />
                                        <label htmlFor="is_active" className="text-sm font-semibold text-slate-800">
                                            Enable Live WhatsApp Notifications
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                                        Permanent System User Access Token
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="EAAG...."
                                        value={settingsForm.data.access_token}
                                        onChange={(e) =>
                                            settingsForm.setData('access_token', e.target.value)
                                        }
                                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Obtain this token from Meta Business Manager &gt; System Users
                                    </p>
                                </div>
                            </div>

                            {/* Automation Switches */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                                    Automated Lifecycle Triggers
                                </h4>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.data.send_on_reservation_confirmed}
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    'send_on_reservation_confirmed',
                                                    e.target.checked
                                                )
                                            }
                                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                Reservation Confirmed Notification
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Automatically send booking details and confirmation code when guest makes a reservation
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.data.send_on_checkin}
                                            onChange={(e) =>
                                                settingsForm.setData('send_on_checkin', e.target.checked)
                                            }
                                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                Guest Check-In Welcome Greeting
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Automatically send Wi-Fi password, breakfast hours, and room number upon physical arrival
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.data.send_on_checkout_invoice}
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    'send_on_checkout_invoice',
                                                    e.target.checked
                                                )
                                            }
                                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                Check-Out Folio & Invoice Receipt
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Send official hotel folio PDF and thank you message when guest checks out
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.data.send_on_housekeeping_ready}
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    'send_on_housekeeping_ready',
                                                    e.target.checked
                                                )
                                            }
                                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                Housekeeping Ready Alert
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Notify Front Desk / Guest immediately when room status changes to Inspected Clean
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={settingsForm.processing}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
                                >
                                    {settingsForm.processing ? 'Saving...' : 'Save WhatsApp Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
