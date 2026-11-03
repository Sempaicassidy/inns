import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    BarChart3,
    Bed,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    CreditCard,
    DollarSign,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    Globe,
    HelpCircle,
    Layers,
    Lock,
    LogOut,
    Menu,
    MessageSquare,
    Package,
    Phone,
    Plus,
    Receipt,
    RefreshCw,
    Scale,
    Shield,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Star,
    TrendingUp,
    Truck,
    UserCheck,
    Users,
    Utensils,
    Wallet,
    Wrench,
    X,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface WelcomeProps {
    canLogin?: boolean;
    canRegister?: boolean;
    user?: {
        name: string;
        email: string;
        role: string;
    } | null;
    auth?: {
        user?: {
            name: string;
            email: string;
            role: string;
        };
    };
}

export default function Welcome({ auth, canLogin = true, canRegister = true, user: propUser }: WelcomeProps) {
    const user = propUser || auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
    const [currency, setCurrency] = useState<'TZS' | 'USD'>('TZS');
    const [previewTab, setPreviewTab] = useState<'manager' | 'frontdesk' | 'restaurant' | 'grocery' | 'accounting' | 'housekeeping'>('manager');
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const formatPrice = (monthlyTzs: number, monthlyUsd: number, annualTzs: number, annualUsd: number) => {
        if (billingCycle === 'annually') {
            if (currency === 'TZS') {
                return `TZS ${new Intl.NumberFormat('en-TZ').format(annualTzs)}`;
            }
            return `$${new Intl.NumberFormat('en-US').format(annualUsd)}`;
        }
        if (currency === 'TZS') {
            return `TZS ${new Intl.NumberFormat('en-TZ').format(monthlyTzs)}`;
        }
        return `$${new Intl.NumberFormat('en-US').format(monthlyUsd)}`;
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
            <Head title="THE INNS" />

            {/* TOP FLOATING PILL NAVBAR WRAPPER ON SOFT SKY GRADIENT */}
            <div className="relative bg-gradient-to-b from-[#edf4ff] via-[#f6f9fe] to-white pb-6 pt-4 sm:pt-6">
                <div className="sticky top-4 z-50 w-full px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    {activeDropdown && (
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setActiveDropdown(null)}
                        />
                    )}
                    <header className="relative z-50 bg-white/95 backdrop-blur-md rounded-full border border-slate-200/70 shadow-[0_4px_25px_-3px_rgba(15,23,42,0.07),0_2px_8px_-2px_rgba(15,23,42,0.04)] px-4 sm:px-7 py-2.5 sm:py-3 flex items-center justify-between transition-all">
                        {/* Brand Left */}
                        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#1e60f2] rounded-full flex items-center justify-center text-white shadow-sm shadow-blue-500/30 shrink-0 group-hover:scale-105 transition-transform">
                                <Zap className="w-4 h-4 fill-white stroke-[2.5]" />
                            </div>
                            <span className="font-bold text-base sm:text-[18px] text-slate-900 tracking-tight shrink-0">
                                THE INNS
                            </span>
                        </Link>

                        {/* Center Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[14.5px] font-medium text-slate-700">
                            {/* Product Dropdown */}
                            <div
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown('product')}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    type="button"
                                    onClick={() => setActiveDropdown(activeDropdown === 'product' ? null : 'product')}
                                    className="flex items-center gap-1.5 hover:text-slate-950 transition py-1 cursor-pointer"
                                >
                                    <span>Product</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${activeDropdown === 'product' ? 'rotate-180 text-blue-600' : ''}`} />
                                </button>

                                {activeDropdown === 'product' && (
                                    <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="space-y-1 text-xs">
                                            <a
                                                href="#modules"
                                                onClick={() => setActiveDropdown(null)}
                                                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1e60f2] flex items-center justify-center shrink-0 group-hover:bg-[#1e60f2] group-hover:text-white transition">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block text-xs">Front Desk & Gantt PMS</span>
                                                    <span className="text-slate-500 text-[11px]">Visual room matrix & folios</span>
                                                </div>
                                            </a>

                                            <a
                                                href="#modules"
                                                onClick={() => setActiveDropdown(null)}
                                                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition">
                                                    <Utensils className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block text-xs">Restaurant & Bar POS</span>
                                                    <span className="text-slate-500 text-[11px]">Tables, KOT & room charge post</span>
                                                </div>
                                            </a>

                                            <a
                                                href="#modules"
                                                onClick={() => setActiveDropdown(null)}
                                                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                                                    <ShoppingBag className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block text-xs">Grocery Minimart POS</span>
                                                    <span className="text-slate-500 text-[11px]">Barcode scan & independent sales</span>
                                                </div>
                                            </a>

                                            <a
                                                href="#modules"
                                                onClick={() => setActiveDropdown(null)}
                                                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                                                    <DollarSign className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block text-xs">General Ledger & P&L</span>
                                                    <span className="text-slate-500 text-[11px]">Double-entry automated accounting</span>
                                                </div>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pricing */}
                            <a href="#pricing" className="hover:text-slate-950 transition py-1">
                                Pricing
                            </a>

                            {/* Solutions Dropdown */}
                            <div
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown('solutions')}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    type="button"
                                    onClick={() => setActiveDropdown(activeDropdown === 'solutions' ? null : 'solutions')}
                                    className="flex items-center gap-1.5 hover:text-slate-950 transition py-1 cursor-pointer"
                                >
                                    <span>Solutions</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${activeDropdown === 'solutions' ? 'rotate-180 text-blue-600' : ''}`} />
                                </button>

                                {activeDropdown === 'solutions' && (
                                    <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="space-y-1 text-xs">
                                            <a href="#why-inns" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-xl hover:bg-slate-50 transition">
                                                <span className="font-bold text-slate-900 block">Boutique Lodges & B&Bs</span>
                                                <span className="text-slate-500 text-[11px]">Streamlined room management</span>
                                            </a>
                                            <a href="#why-inns" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-xl hover:bg-slate-50 transition">
                                                <span className="font-bold text-slate-900 block">Safari Camps & Tour Resorts</span>
                                                <span className="text-slate-500 text-[11px]">All-inclusive meal & activity folios</span>
                                            </a>
                                            <a href="#why-inns" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-xl hover:bg-slate-50 transition">
                                                <span className="font-bold text-slate-900 block">Multi-Property Chains</span>
                                                <span className="text-slate-500 text-[11px]">Consolidated multi-branch reporting</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reviews */}
                            <a href="#reviews" className="hover:text-slate-950 transition py-1">
                                Reviews
                            </a>

                            {/* Blog / Why Us */}
                            <a href="#why-inns" className="hover:text-slate-950 transition py-1">
                                Blog
                            </a>

                            {/* Resources Dropdown */}
                            <div
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown('resources')}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    type="button"
                                    onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
                                    className="flex items-center gap-1.5 hover:text-slate-950 transition py-1 cursor-pointer"
                                >
                                    <span>Resources</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${activeDropdown === 'resources' ? 'rotate-180 text-blue-600' : ''}`} />
                                </button>

                                {activeDropdown === 'resources' && (
                                    <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="space-y-1 text-xs">
                                            <a href="#preview" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-xl hover:bg-slate-50 transition">
                                                <span className="font-bold text-slate-900 block">Live Module Preview</span>
                                                <span className="text-slate-500 text-[11px]">Interactive feature walkthrough</span>
                                            </a>
                                            <a href="#faq" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-xl hover:bg-slate-50 transition">
                                                <span className="font-bold text-slate-900 block">Frequently Asked Questions</span>
                                                <span className="text-slate-500 text-[11px]">Hardware & data migration guides</span>
                                            </a>
                                            <a href="#contact" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-xl hover:bg-slate-50 transition">
                                                <span className="font-bold text-slate-900 block">Help & Support</span>
                                                <span className="text-slate-500 text-[11px]">24/7 hospitality assistance</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </nav>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                            {user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e60f2] hover:bg-[#1a54d6] text-white rounded-full font-medium text-xs sm:text-[14.5px] shadow-sm shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
                                >
                                    <span>Dashboard</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="text-slate-700 hover:text-slate-950 font-medium text-xs sm:text-[14.5px] px-2 sm:px-3 py-1.5 transition"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center justify-center px-5 sm:px-6 py-2 sm:py-2.5 bg-[#1e60f2] hover:bg-[#1a54d6] text-white font-medium text-xs sm:text-[14.5px] rounded-full shadow-sm shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                                    >
                                        Start free
                                    </Link>
                                </>
                            )}

                            {/* Mobile Drawer Toggle */}
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition ml-1"
                                aria-label="Toggle navigation"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </header>

                    {/* Mobile Drawer Dropdown */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-150">
                            <nav className="flex flex-col space-y-2.5 font-medium text-sm text-slate-700">
                                <a href="#modules" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">Product & Modules</a>
                                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">Pricing</a>
                                <a href="#why-inns" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">Solutions</a>
                                <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">Reviews</a>
                                <a href="#why-inns" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">Blog</a>
                                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">Resources</a>
                            </nav>
                            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                                {user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="w-full text-center py-2.5 bg-[#1e60f2] text-white rounded-full font-semibold text-sm shadow-md"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="w-full text-center py-2 border border-slate-300 text-slate-700 rounded-full font-medium text-sm"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="w-full text-center py-2.5 bg-[#1e60f2] text-white rounded-full font-semibold text-sm shadow-md"
                                        >
                                            Start free
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. HERO SECTION */}
            <section className="relative overflow-hidden pt-6 pb-20 lg:pt-12 lg:pb-32 bg-white">
                {/* Background decorative glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {/* Badge */}


                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-5xl mx-auto leading-[1.12]">
                        Run Your Hotel, Lodges, Airbnb & Guest House from{' '}
                        <span className="text-blue-600">One Seamless Cloud.</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Replace fragmented software with THE INNS. Unify front-desk Gantt reservations, housekeeping, independent Restaurant & Grocery POS, store inventory, and full double-entry General Ledger—crafted for boutique lodges and multi-property hotel chains.
                    </p>

                    {/* CTA Group */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={user ? route('dashboard') : route('register')}
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <span>{user ? 'Open Hotel Dashboard' : 'Start 14-Day Free Trial'}</span>
                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </Link>

                        <a
                            href="#preview"
                            className="w-full sm:w-auto px-7 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm rounded-2xl border border-slate-300 shadow-xs transition flex items-center justify-center gap-2"
                        >
                            <Activity className="w-4 h-4 text-white-600" />
                            <span>Explore Live Modules</span>
                        </a>

                        {/* <Link
                            href={route('login')}
                            className="w-full sm:w-auto text-xs font-bold text-slate-500 hover:text-blue-600 py-2 sm:py-0 px-2 transition flex items-center justify-center gap-1"
                        >
                            <span>Staff Login Portal</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link> */}
                    </div>

                    {/* Value highlights checklist */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Zero local server installation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Independent Restaurant & Grocery POS</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Full Double-Entry Accounting</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>TRA / EFD Compliant Ready</span>
                        </div>
                    </div>
                </div>

                {/* 4. INTERACTIVE LIVE OPERATIONS SHOWCASE (Clean Light Aesthetic) */}
                <div id="preview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
                    <div className="bg-white rounded-3xl p-4 sm:p-7 shadow-xl border border-slate-200">
                        {/* Top Bar with Live Pulse & Category Switcher */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live Operations Demo
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                                        Multi-Property Cloud Workflow
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
                                    Interactive Hotel Command Center
                                </h3>
                            </div>

                            {/* Solid Module Switchers */}
                            <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-100 rounded-2xl text-xs font-bold w-full md:w-auto scrollbar-none">
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('frontdesk')}
                                    className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
                                        previewTab === 'frontdesk'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                    }`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Front Desk</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('restaurant')}
                                    className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
                                        previewTab === 'restaurant'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                    }`}
                                >
                                    <Utensils className="w-3.5 h-3.5" />
                                    <span>Restaurant POS</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('grocery')}
                                    className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
                                        previewTab === 'grocery'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                    }`}
                                >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>Minimart POS</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('housekeeping')}
                                    className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
                                        previewTab === 'housekeeping'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                    }`}
                                >
                                    <Bed className="w-3.5 h-3.5" />
                                    <span>Housekeeping</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('manager')}
                                    className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
                                        previewTab === 'manager'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                    }`}
                                >
                                    <BarChart3 className="w-3.5 h-3.5" />
                                    <span>Executive Reports</span>
                                </button>
                            </div>
                        </div>

                        {/* Interactive Tab Body */}
                        <div className="mt-5 min-h-[360px] flex flex-col justify-between">
                            {previewTab === 'frontdesk' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div>
                                            <div className="text-sm font-black text-slate-900">Live Visual Room Matrix & Folio Manager</div>
                                            <div className="text-xs text-slate-500">Real-time room allocation, check-ins, guest ledger & instant billing</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold">24 Occupied</span>
                                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-bold">14 Clean & Inspected</span>
                                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 font-bold">4 Expected Today</span>
                                        </div>
                                    </div>

                                    {/* Room Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-blue-400 transition">
                                            <div className="flex items-center justify-between">
                                                <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg">Room 101</span>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold">Checked In</span>
                                            </div>
                                            <div className="mt-3">
                                                <div className="font-bold text-slate-900 text-sm">Dr. David Mhando</div>
                                                <div className="text-xs text-slate-500">Deluxe Safari Suite • 3 Nights (B&B)</div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                                <span className="text-slate-500 font-semibold">Folio Balance</span>
                                                <span className="font-black text-slate-900">TZS 360,000</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-2xs">
                                            <div className="flex items-center justify-between">
                                                <span className="px-2.5 py-1 bg-blue-600 text-white font-mono font-bold text-xs rounded-lg">Room 102</span>
                                                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">Arriving 14:00</span>
                                            </div>
                                            <div className="mt-3">
                                                <div className="font-bold text-slate-900 text-sm">Sarah Jenkins (UK)</div>
                                                <div className="text-xs text-slate-500">Executive Ocean View • 2 Nights (HB)</div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between text-xs">
                                                <span className="text-blue-700 font-semibold">Advance Deposit</span>
                                                <span className="font-black text-emerald-700">Paid TZS 250,000</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                                            <div className="flex items-center justify-between">
                                                <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg">Room 201</span>
                                                <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[11px] font-bold">Reserved</span>
                                            </div>
                                            <div className="mt-3">
                                                <div className="font-bold text-slate-900 text-sm">Serengeti Tour Group</div>
                                                <div className="text-xs text-slate-500">Family Garden Villa • 4 Nights (FB)</div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                                <span className="text-slate-500 font-semibold">Total Package</span>
                                                <span className="font-black text-slate-900">TZS 1,840,000</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span>Statutory Tanzania Police Guest Ledger (Kitabu cha Wageni) automatically filled and exportable upon check-in.</span>
                                        </div>
                                        <span className="font-bold text-blue-700">100% EFD Compliant</span>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'restaurant' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div>
                                            <div className="text-sm font-black text-slate-900">Restaurant & Bar Touch POS</div>
                                            <div className="text-xs text-slate-500">Table orders, Kitchen Order Tickets (KOT) & direct charge to room folios</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-bold">8 Active Tables</span>
                                            <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold">3 KOT in Kitchen</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900 text-sm">Table 04 — Poolside Terrace</span>
                                                <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold">KOT #108 Active</span>
                                            </div>
                                            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                                                <div className="flex justify-between">
                                                    <span>2x Grilled Serengeti Tilapia</span>
                                                    <span className="font-bold text-slate-900">TZS 44,000</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>2x Fresh Passion Juice</span>
                                                    <span className="font-bold text-slate-900">TZS 16,000</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>1x Espresso Double</span>
                                                    <span className="font-bold text-slate-900">TZS 6,000</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-500">Bill Total</span>
                                                <span className="text-base font-black text-slate-900">TZS 66,000</span>
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <button type="button" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition">
                                                    Post to Room 101 Folio
                                                </button>
                                                <button type="button" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">
                                                    Print KOT
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900 text-sm">Table 07 — VIP Lounge & Bar</span>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">Paid & Settled</span>
                                            </div>
                                            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                                                <div className="flex justify-between">
                                                    <span>4x Kilimanjaro Lager (Cold)</span>
                                                    <span className="font-bold text-slate-900">TZS 24,000</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>1x Mixed BBQ Platter (Platter for 3)</span>
                                                    <span className="font-bold text-slate-900">TZS 45,000</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-500">Settled via M-Pesa</span>
                                                <span className="text-base font-black text-emerald-700">TZS 69,000</span>
                                            </div>
                                            <div className="mt-3">
                                                <div className="py-2 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                                                    TRA Fiscalized Receipt #8932 Printed
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'grocery' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div>
                                            <div className="text-sm font-black text-slate-900">Hotel Minimart & Gift Shop POS</div>
                                            <div className="text-xs text-slate-500">Instant barcode scanning, walk-in sales, stock depletion & room charging</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-bold">Barcode Active</span>
                                            <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold">148 Products in Stock</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white md:col-span-2">
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Retail Cart</div>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                                                    <div>
                                                        <span className="font-bold text-slate-900 block">Kilimanjaro Mineral Water 1.5L</span>
                                                        <span className="text-slate-500 text-[11px]">Barcode: 61640012001 • Qty: 2</span>
                                                    </div>
                                                    <span className="font-black text-slate-900">TZS 5,000</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                                                    <div>
                                                        <span className="font-bold text-slate-900 block">Safari Sunscreen SPF 50 (100ml)</span>
                                                        <span className="text-slate-500 text-[11px]">Barcode: 61640049012 • Qty: 1</span>
                                                    </div>
                                                    <span className="font-black text-slate-900">TZS 28,000</span>
                                                </div>
                                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                                                    <div>
                                                        <span className="font-bold text-slate-900 block">Handmade Maasai Souvenir Shuka</span>
                                                        <span className="text-slate-500 text-[11px]">Barcode: 61640098114 • Qty: 1</span>
                                                    </div>
                                                    <span className="font-black text-slate-900">TZS 35,000</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Checkout Summary</div>
                                                <div className="mt-3">
                                                    <span className="text-2xl font-black text-slate-900">TZS 68,000</span>
                                                    <span className="text-[11px] text-slate-500 block">3 Items (VAT 18% included)</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                <button type="button" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition">
                                                    Pay with Cash / Mobile Money
                                                </button>
                                                <button type="button" className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition">
                                                    Post to Room Folio
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'housekeeping' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div>
                                            <div className="text-sm font-black text-slate-900">Housekeeping & Room Readiness Hub</div>
                                            <div className="text-xs text-slate-500">Live maid assignments, cleaning stages & instant supervisor inspection</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-bold">18 Inspected Clean</span>
                                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 font-bold">4 In Progress</span>
                                            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold">1 Maintenance</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900">Room 101 — Suite</span>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">Ready</span>
                                            </div>
                                            <div className="mt-2 text-slate-600">Cleaned & Inspected by Supervisor Grace. Fresh linen & amenities placed.</div>
                                            <div className="mt-3 text-[11px] text-emerald-700 font-bold">Ready for Instant Check-In</div>
                                        </div>

                                        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900">Room 103 — Deluxe</span>
                                                <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-bold text-[10px]">Cleaning</span>
                                            </div>
                                            <div className="mt-2 text-slate-600">Assigned to Housekeeper Amina M. Target turnaround: 13:30 for incoming guest.</div>
                                            <div className="mt-3 text-[11px] text-amber-700 font-bold">Priority Turnover (Check-in 14:00)</div>
                                        </div>

                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900">Room 204 — Twin Villa</span>
                                                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px]">Maintenance</span>
                                            </div>
                                            <div className="mt-2 text-slate-600">AC filter maintenance and master shower pressure check reported by guest.</div>
                                            <div className="mt-3 text-[11px] text-rose-700 font-bold">Technician Assigned</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'manager' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div>
                                            <div className="text-sm font-black text-slate-900">General Manager Flash Cockpit</div>
                                            <div className="text-xs text-slate-500">Paradise Safari Lodge & Resort • Real-time occupancy, ADR & RevPAR</div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold">
                                            Occupancy 88.4%
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Total Revenue (MTD)</span>
                                            <div className="text-xl font-black text-slate-900 mt-1">TZS 184,250,000</div>
                                            <span className="text-[10px] text-emerald-600 font-semibold">+18.2% vs last month</span>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Average Daily Rate (ADR)</span>
                                            <div className="text-xl font-black text-slate-900 mt-1">TZS 285,000</div>
                                            <span className="text-[10px] text-blue-600 font-semibold">Premium Surge</span>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">RevPAR</span>
                                            <div className="text-xl font-black text-slate-900 mt-1">TZS 251,940</div>
                                            <span className="text-[10px] text-emerald-600 font-semibold">High Season</span>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">In-House Guests</span>
                                            <div className="text-xl font-black text-slate-900 mt-1">42 Guests / 24 Rooms</div>
                                            <span className="text-[10px] text-amber-600 font-semibold">9 Expected Today</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                        <span className="text-slate-600">
                                            Daily Flash Report ready for instant PDF export or automated WhatsApp dispatch to hotel owners.
                                        </span>
                                        <div className="flex gap-2">
                                            <button type="button" className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition">
                                                WhatsApp Summary
                                            </button>
                                            <button type="button" className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition">
                                                Export Flash PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Showcase Footer Bar */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <span className="text-slate-500 font-medium">
                                    Want to see how this works for your specific lodge or hotel?
                                </span>
                                <Link
                                    href={user ? route('dashboard') : route('register')}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm"
                                >
                                    Launch Live Portal →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. WHY THE INNS (THE 4 SAAS PILLARS) */}
            <section id="why-inns" className="py-20 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        {/* <span className="text-blue-600 font-black text-xs uppercase tracking-wider">Engineered for Hospitality Growth</span> */}
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                            Why Modern Hoteliers Are Switching to THE INNS
                        </h2>
                        <p className="text-slate-600 mt-3 text-sm sm:text-base">
                            Traditional hotel software is clunky, expensive, and leaves your restaurant and accounting disconnected. THE INNS provides a unified, decoupled architecture built for operational speed.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
                        {/* Pillar 1 */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 hover:border-blue-400 transition hover:shadow-lg hover:shadow-blue-500/5 group">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Total System Decoupling</h3>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                Restaurant, Grocery Minimart, Store Warehouse, and Hotel Rooms operate independently. A POS rush never freezes hotel reservations, and each department maintains dedicated shifts and registers.
                            </p>
                        </div>

                        {/* Pillar 2 */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 hover:border-blue-400 transition hover:shadow-lg hover:shadow-blue-500/5 group">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                                <Scale className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Automated Double-Entry GL</h3>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                No more manual Excel exports at midnight. Room revenue, F&B orders, inventory write-offs, and guest payments post directly into the Chart of Accounts, balancing your Trial Balance in real time.
                            </p>
                        </div>

                        {/* Pillar 3 */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 hover:border-blue-400 transition hover:shadow-lg hover:shadow-blue-500/5 group">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Multi-Property Tenant Control</h3>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                Manage a beach resort in Zanzibar, a safari camp in Serengeti, and a business hotel in Arusha or Dar from one unified dashboard. Switch between branches in one click with consolidated owner reporting.
                            </p>
                        </div>

                        {/* Pillar 4 */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 hover:border-blue-400 transition hover:shadow-lg hover:shadow-blue-500/5 group">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-4 group-hover:bg-amber-600 group-hover:text-white transition">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Strict Role Separation</h3>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                Prevent revenue leakages. Receptionists handle check-in without seeing overall hotel profit. Waitstaff manage orders without overriding prices. Accountants balance books with multi-level approval hierarchies.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. COMPLETE MODULAR SUITE BREAKDOWN */}
            <section id="modules" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        {/* <span className="text-blue-600 font-black text-xs uppercase tracking-wider">Hospitality Architecture</span> */}
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                            Six Dedicated Modules on One Connected Cloud.
                        </h2>
                        <p className="text-slate-600 mt-3 text-sm sm:text-base">
                            Everything you need to manage guests, staff, food, inventory, and finances without paying for multiple third-party software subscriptions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
                        {/* Module 1 */}
                        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Front Office</span>
                            <h3 className="text-lg font-black text-slate-900 mt-1">Reservations & Guest Folios</h3>
                            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Visual Gantt room matrix & fast booking engine</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Express mobile Check-in and Check-out workflows</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Guest folio management & corporate billing ledger</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Automated WhatsApp booking confirmations</span>
                                </li>
                            </ul>
                        </div>

                        {/* Module 2 */}
                        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                                <Bed className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Rooms Control</span>
                            <h3 className="text-lg font-black text-slate-900 mt-1">Housekeeping & Maintenance</h3>
                            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Real-time Clean, Dirty, Inspected & Out-of-Order states</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Staff cleaning assignment & supervisor quality checklist</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Maintenance ticketing & urgent repair priority tracking</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Mobile interface for on-floor room attendants</span>
                                </li>
                            </ul>
                        </div>

                        {/* Module 3 */}
                        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                                <Utensils className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">F&B Outlet</span>
                            <h3 className="text-lg font-black text-slate-900 mt-1">Restaurant & Lounge POS</h3>
                            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Visual table layout & floor plan management</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Direct room charge posting with digital guest verification</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Kitchen Order Ticket (KOT) thermal printer support</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Split billing: Cash, Credit Card, M-Pesa, Airtel Money</span>
                                </li>
                            </ul>
                        </div>

                        {/* Module 4 */}
                        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Retail Outlet</span>
                            <h3 className="text-lg font-black text-slate-900 mt-1">Grocery & Minimart POS</h3>
                            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>High-speed barcode scanning & rapid counter sales</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Completely decoupled from hotel guest folios</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Independent product catalog, SKU tracking & pricing</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Daily cashier reconciliation & shift variance reports</span>
                                </li>
                            </ul>
                        </div>

                        {/* Module 5 */}
                        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                                <Package className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Supply Chain</span>
                            <h3 className="text-lg font-black text-slate-900 mt-1">Store Inventory & Procurement</h3>
                            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Central warehouse stock & department requisitions</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Goods Received Note (GRN) & supplier invoice matching</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Perpetual inventory costing: Weighted Average Cost (WAC)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Automated reorder level & minimum stock warning alerts</span>
                                </li>
                            </ul>
                        </div>

                        {/* Module 6 */}
                        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition">
                            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">Financial Control</span>
                            <h3 className="text-lg font-black text-slate-900 mt-1">Accounting & General Ledger</h3>
                            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Full Double-Entry Chart of Accounts & General Ledger</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Automated P&L, Balance Sheet & Cash Flow Statements</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Accounts Receivable (AR) & Accounts Payable (AP) aging</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Bank & Cash Vault reconciliation with expense approvals</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. TRANSPARENT SAAS PRICING TIERS */}
            <section id="pricing" className="py-20 bg-white border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        {/* <span className="text-blue-600 font-black text-xs uppercase tracking-wider">Predictable Pricing</span>*/}
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2"> 
                            Simple, Value-Packed Pricing for Every Property Size
                        </h2>
                        <p className="text-slate-600 mt-3 text-sm sm:text-base">
                            Start with a 14-day free trial. No credit card required. Cancel anytime.
                        </p>

                        {/* Currency & Billing Cycle Switchers */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            {/* Billing Cycle Switcher */}
                            <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center text-xs font-bold text-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-3.5 py-1.5 rounded-lg transition ${
                                        billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    Monthly Billing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('annually')}
                                    className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                                        billingCycle === 'annually' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <span>Annual Billing</span>
                                    <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                        Save 20%
                                    </span>
                                </button>
                            </div>

                            {/* Currency Selector */}
                            <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center text-xs font-bold text-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setCurrency('TZS')}
                                    className={`px-3 py-1.5 rounded-lg transition ${
                                        currency === 'TZS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                                    }`}
                                >
                                    TZS (Shillings)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrency('USD')}
                                    className={`px-3 py-1.5 rounded-lg transition ${
                                        currency === 'USD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                                    }`}
                                >
                                    USD ($)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Plans */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-14 max-w-6xl mx-auto">
                        {/* Starter Lodge */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl flex flex-col">
                            <div>
                                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Starter Lodge</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-1">Boutique lodges, B&Bs, guesthouses and smaller properties</h3>
                                <div className="mt-6">
                                    <span className="text-3xl sm:text-4xl font-black text-slate-900">
                                        {formatPrice(120000, 50, 1152000, 480)}
                                    </span>
                                    <span className="text-xs text-slate-500 font-semibold block mt-1">
                                        per property / month {billingCycle === 'annually' ? '(billed yearly - Save 20%)' : ''}
                                    </span>
                                </div>

                                <ul className="mt-8 space-y-3 text-xs text-slate-700 border-t border-slate-200 pt-6">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Up to 25 Rooms & Suites</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Front Desk & Gantt Calendar</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Housekeeping Status Hub</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Guest Folios & Basic Cashbook</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Profit and Loss Report</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8">
                                <Link
                                    href={route('register')}
                                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl block text-center transition shadow-sm"
                                >
                                    Get Started with Starter
                                </Link>
                            </div>
                        </div>

                        {/* Hotel Pro (Featured) */}
                        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl ring-2 ring-blue-600 relative flex flex-col">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                                Most Popular Choice
                            </div>

                            <div>
                                <span className="text-xs font-black text-blue-300 uppercase tracking-wider">Hotel Pro</span>
                                <h3 className="text-2xl font-black text-white mt-1">Hotels, resorts and larger single-property operations</h3>
                                <div className="mt-6">
                                    <span className="text-3xl sm:text-4xl font-black text-white">
                                        {formatPrice(219000, 90, 2102400, 860)}
                                    </span>
                                    <span className="text-xs text-blue-200 font-semibold block mt-1">
                                        per property / month {billingCycle === 'annually' ? '(billed yearly - Save 20%)' : ''}
                                    </span>
                                </div>

                                <ul className="mt-8 space-y-3 text-xs text-slate-200 border-t border-slate-700/60 pt-6">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Up to 80 Rooms & Multiple Categories</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Gantt Matrix + Mobile Housekeeping</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Independent Restaurant & Bar POS</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Independent Grocery & Retail Minimart POS</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Store Warehouse & GRN Management</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Double-Entry General Ledger, P&L & Balance Sheet</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>WhatsApp Guest Messaging Integration</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8">
                                <Link
                                    href={route('register')}
                                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl block text-center transition shadow-sm"
                                >
                                    Start 14-Day Free Pro Trial
                                </Link>
                            </div>
                        </div>

                        {/* Enterprise Group */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl flex flex-col">
                            <div>
                                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Enterprise Group</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-1">Hotel groups, resort chains and multi-property operators</h3>
                                <div className="mt-6">
                                    <span className="text-3xl sm:text-4xl font-black text-slate-900">
                                        {formatPrice(450000, 180, 4320000, 1728)}
                                    </span>
                                    <span className="text-xs text-slate-500 font-semibold block mt-1">
                                        multi-property package / month {billingCycle === 'annually' ? '(billed yearly - Save 20%)' : ''}
                                    </span>
                                </div>

                                <ul className="mt-8 space-y-3 text-xs text-slate-700 border-t border-slate-200 pt-6">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Unlimited Rooms & Multiple Properties</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Consolidated Multi-Branch P&L & Balance Sheet</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Inter-Branch Stock Transfers</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Custom TRA / VFD fiscalization gateway</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Dedicated Account Manager & 24/7 Priority SLA</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Free On-Site Staff Training & Data Migration</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8">
                                <a
                                    href="#contact"
                                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl block text-center transition"
                                >
                                    Speak with Enterprise Sales
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. CLIENT PROOF & TESTIMONIALS */}
            {/* <section id="reviews" className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto">
                        <span className="text-blue-600 font-black text-xs uppercase tracking-wider">Trusted by Industry Leaders</span>
                        <h2 className="text-3xl font-black text-slate-900 mt-2">
                            Powering High-Performing Hotels Across East Africa
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        {/* Testimonial 1 */}
                        {/* <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                            <div className="flex items-center gap-1 text-amber-400 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                                ))} */}
                            {/* </div>
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                                "Before THE INNS, our restaurant POS and room bookings were kept in two separate systems, causing frequent billing errors at checkout. Now, food bills post straight to the room folio, and our accountant closes books in minutes."
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                                    JK
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-900 block">Juma K. Mwambapa</span>
                                    <span className="text-[10px] text-slate-500">General Manager, Mount Meru Vista Lodge</span>
                                </div>
                            </div>
                        </div> */}

                        {/* Testimonial 2 */}
                        {/*<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                            <div className="flex items-center gap-1 text-amber-400 mb-3">*/}
                                {/* {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                                ))} */}
                            {/*</div>
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                                "The Grocery Minimart module is phenomenal. We run a tourist convenience store at our beach resort; having it decoupled from the hotel means walk-in customers checkout in 10 seconds without interfering with our hotel front desk."
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                                    SN
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-900 block">Salma N. Al-Husseini</span>
                                    <span className="text-[10px] text-slate-500">Managing Director, Kendwa Palms Resort, Zanzibar</span>
                                </div>
                            </div>
                        </div>*/}

                        {/* Testimonial 3 */}
                        {/* <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                            <div className="flex items-center gap-1 text-amber-400 mb-3"> */}
                                {/* {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                                ))}
                            </div> */}
                            {/* <p className="text-xs text-slate-600 leading-relaxed italic">
                                "As a Chief Accountant, having automatic double-entry journal postings with AR aging schedules and real-time P&L has eliminated our manual Excel reconciliations. Our audit was completed in half the time."
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                                    EC
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-900 block">Eng. Cassidy K.</span>
                                    <span className="text-[10px] text-slate-500">Finance & Operations Director, Haula Group</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}

            {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ) */}
            <section id="faq" className="py-20 bg-white border-t border-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        {/* <span className="text-blue-600 font-black text-xs uppercase tracking-wider">Got Questions?</span> */}
                        <h2 className="text-3xl font-black text-slate-900 mt-2">
                           <i>Frequently Asked Questions</i>
                        </h2>
                    </div>

                    <div className="mt-12 space-y-3">
                        {[
                            {
                                q: 'Do our Restaurant and Grocery Minimart operate independently from the hotel rooms?',
                                a: 'Yes, 100%! Restaurant POS and Grocery Minimart POS run on independent registers, shifts, and catalogs. Walk-in customers can buy drinks or groceries without creating hotel reservations. When a hotel guest wishes to charge a meal to their room, staff simply choose "Post to Room Folio" with a single click.',
                            },
                            {
                                q: 'Can our Accountant generate real double-entry Balance Sheets and P&L?',
                                a: 'Absolutely. THE INNS has a true General Ledger with an immutable Chart of Accounts, debit/credit journal vouchers, real-time Trial Balance, Income Statements (P&L), and Accounts Receivable (AR) Aging Schedules.',
                            },
                            {
                                q: 'What hardware is required? Do we need local servers?',
                                a: 'Zero servers are required. THE INNS is 100% cloud-hosted. It runs smoothly in any web browser on desktop PCs, laptops, iPad/Android tablets, and smartphones. It connects seamlessly with standard USB/Bluetooth thermal receipt printers, cash drawers, and barcode scanners.',
                            },
                            {
                                q: 'How does multi-property management work for hotel chains?',
                                a: 'If your business operates multiple branches (e.g. city hotel, beach resort, and safari camp), your owner account can switch between properties in one click or view consolidated financial and occupancy reports across all branches.',
                            },
                            {
                                q: 'How long does onboarding and staff training take?',
                                a: 'Most boutique lodges go live within 24 to 48 hours. Our team assists with room category configuration, menu setup, staff accounts creation, and initial opening inventory import.',
                            },
                            {
                                q: 'Is our data secure and backed up?',
                                a: 'Yes. All data is encrypted in transit via SSL/TLS and backed up redundantly multiple times daily across distributed cloud data centers with 99.98% uptime SLA.',
                            },
                        ].map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div
                                    key={index}
                                    className="border border-slate-200 rounded-2xl overflow-hidden transition"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleFaq(index)}
                                        className="w-full text-left p-5 flex items-center justify-between font-bold text-sm text-slate-900 hover:bg-slate-50 transition"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                                    </button>
                                    {isOpen && (
                                        <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 10. PRE-FOOTER CALL TO ACTION */}
            <section id="contact" className="py-20 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
                

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    {/* <span className="text-blue-300 font-black text-xs uppercase tracking-wider">Transform Your Hospitality Property</span> */}
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3 text-white leading-tight">
                        Ready to Stop Revenue Leakages and Automate Your Entire Business?
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-4xl mx-auto">
                        Join <b className="text-white">THE INNS</b>. Get started in minutes with our 14-day risk-free trial.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                         <Link
                            href={user ? route('dashboard') : route('register')}
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-sm"
                        >
                            <span>{user ? 'Go to Dashboard' : 'Start 14-Day Free Trial'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link> 

                        {/* <a
                            href="tel:+255779646632"
                            className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition flex items-center justify-center gap-2"
                        >
                            <Phone className="w-4 h-4 text-blue-300" />
                            <span>Call Sales: <br /> +255 (779) 646 632 <hr/>
                            &nbsp; &nbsp;+255 (659) 958 595 <hr />
                            &nbsp; &nbsp;+255 (794) 376 209
                            </span>
                        </a> */}
                    </div>

                    <div className="mt-8 text-xs text-slate-400 flex items-center justify-center gap-6">
                        <span>No credit card required</span>
                        <span>•</span>
                        <span>Instant cloud setup</span>
                        <span>•</span>
                        <span>24/7 Local Support</span>
                    </div>
                </div>
            </section>

            {/* 11. FOOTER */}
            <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                        {/* Col 1: Brand */}
                        <div className="col-span-2 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <span className="text-lg font-black text-white">THE INNS</span>
                            </div>
                            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                                The comprehensive Inns Management System. Built for guests, lodges, resorts, and hotel chains.
                            </p>
                          
                        </div>

                        {/* Col 2: Modules */}
                        <div className="space-y-3">
                            <span className="text-white font-bold uppercase tracking-wider text-[11px] block">
                                Core Modules
                            </span>
                            <ul className="space-y-2 text-slate-400">
                                <li><a href="#modules" className="hover:text-white transition">Front Desk</a></li>
                                <li><a href="#modules" className="hover:text-white transition">Housekeeping Hub</a></li>
                                <li><a href="#modules" className="hover:text-white transition">Restaurant POS</a></li>
                                <li><a href="#modules" className="hover:text-white transition">Grocery POS</a></li>
                                <li><a href="#modules" className="hover:text-white transition">Store Inventory</a></li>
                                <li><a href="#modules" className="hover:text-white transition">General Ledger GL</a></li>
                            </ul>
                        </div>

                        {/* Col 3: Role Portals */}
                        <div className="space-y-3">
                            <span className="text-white font-bold uppercase tracking-wider text-[11px] block">
                                Role Portals
                            </span>
                            <ul className="space-y-2 text-slate-400">
                                <li><Link href={route('login')} className="hover:text-white transition">General Manager</Link></li>
                                <li><Link href={route('login')} className="hover:text-white transition">Receptionist Desk</Link></li>
                                <li><Link href={route('login')} className="hover:text-white transition">Accountant Portal</Link></li>
                                <li><Link href={route('login')} className="hover:text-white transition">Cashier POS</Link></li>
                                <li><Link href={route('login')} className="hover:text-white transition">Housekeeping Supervisor</Link></li>
                            </ul>
                        </div>

                        {/* Col 4: Regional Hubs */}
                        <div className="space-y-3">
                            <span className="text-white font-bold uppercase tracking-wider text-[11px] block">
                                HEAD OFFICE
                            </span>
                            <div className="space-y-2 text-slate-400 text-xs">
                                <p><strong className="text-white">MOROGORO:</strong> Msamvu, whitehouse street</p>
                                <p><strong className="text-white">Email:</strong>support@inns.haulaenterprises.co.tz</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                        <p>&copy; {new Date().getFullYear()} THE INNS Cloud Hotel Management System. All rights reserved.</p>
                        <p>Powered by <a href="https://www.haulaenterprises.co.tz" target="_blank" className="hover:text-white transition">Haula Enterprises</a></p>
                        <div className="flex items-center gap-6">
                            <a href="#privacy" className="hover:text-slate-400 transition">Privacy Policy</a>
                            <a href="#terms" className="hover:text-slate-400 transition">Terms of Service</a>
                            <a href="#security" className="hover:text-slate-400 transition">Security & TRA Compliance</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function LayoutDashboardIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    );
}
