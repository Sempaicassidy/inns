import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
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
    Laptop,
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
    Smartphone,
    Star,
    Tablet,
    TrendingUp,
    Truck,
    UserCheck,
    Users,
    Utensils,
    Wallet,
    Wifi,
    Wrench,
    X,
    Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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
    cms_content?: {
        hero_badge?: string;
        hero_title?: string;
        hero_subtitle?: string;
        hero_cta_text?: string;
        demo_cta_text?: string;
        hero_image?: string | null;
        hero_slides?: Array<{
            id?: string | number;
            badge?: string;
            title?: string;
            subtitle?: string;
            image?: string;
        }>;
    };
}

export default function Welcome({ auth, canLogin = true, canRegister = true, user: propUser, cms_content }: WelcomeProps) {
    const user = propUser || auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
    const [currency, setCurrency] = useState<'TZS' | 'USD'>('TZS');
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [activeDeviceFocus, setActiveDeviceFocus] = useState<'all' | 'laptop' | 'tablet' | 'phone'>('all');
    const [syncedOrderActive, setSyncedOrderActive] = useState(false);

    // Hero Background Slideshow with Dynamic Synchronized Texts (Configured dynamically by Super Admin)
    const defaultSlides = useMemo(() => [
        {
            id: 'slide_1',
            title: cms_content?.hero_title || 'Complete Modern Cloud PMS for Hotels, Lodges & Resorts',
            subtitle: cms_content?.hero_subtitle || 'Manage rooms, front desk, reservations, legal contracts, invoices, payment receipts, POS, and financial reporting seamlessly on one unified cloud platform.',
            image: cms_content?.hero_image || '/uploads/cms/hero_1794042362.png',
        },
        {
            id: 'slide_2',
            title: 'Modern Operations for Safari Lodges, Camps & Luxury Boutique Resorts',
            subtitle: 'Track guest stays, room calendar Gantt racks, folios and payments, with automated daily manager flash reports via SMS and WhatsApp.',
            image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&q=80&fit=crop',
        },
        {
            id: 'slide_3',
            title: 'Touchscreen Restaurant POS, Grocery Minimart & Automated Night Audit',
            subtitle: 'Fast sales ordering for resident and walk-in guests, kitchen KOT tickets, inventory stock management, and double-entry accounting ledger.',
            image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe524?w=1920&q=80&fit=crop',
        },
        {
            id: 'slide_4',
            title: 'Manage Multiple Hotel Properties & Branches From a Single Command Hub',
            subtitle: 'Consolidate multiple branches across regions, benchmark property revenue performance in real-time, enforce RBAC permissions, and eliminate revenue leakage.',
            image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80&fit=crop',
        },
    ], [cms_content]);

    const heroSlides = useMemo(() => {
        if (cms_content?.hero_slides && Array.isArray(cms_content.hero_slides) && cms_content.hero_slides.length > 0) {
            return cms_content.hero_slides;
        }
        return defaultSlides;
    }, [cms_content, defaultSlides]);

    const [heroSlideIndex, setHeroSlideIndex] = useState(0);

    // Keep active slide index safe if total slides count changes
    useEffect(() => {
        if (heroSlideIndex >= heroSlides.length) {
            setHeroSlideIndex(0);
        }
    }, [heroSlides.length, heroSlideIndex]);

    useEffect(() => {
        if (heroSlides.length <= 1) return;
        const timer = setInterval(() => {
            setHeroSlideIndex((prev) => (prev + 1) % heroSlides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [heroSlides.length]);

    const currentSlide = heroSlides[heroSlideIndex] || heroSlides[0] || {
        title: 'Complete Modern Cloud PMS for Hotels, Lodges & Resorts',
        subtitle: 'Manage rooms, front desk, reservations, legal contracts, invoices, payment receipts, POS, and financial reporting seamlessly on one unified cloud platform.',
    };

    const triggerSyncDemo = () => {
        setSyncedOrderActive(true);
        setTimeout(() => setSyncedOrderActive(false), 4000);
    };

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
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#D4AF37] selection:text-[#1E3A5F] overflow-x-hidden">
            <Head title="THE INNS" />

            {/* TOP FLOATING PILL NAVBAR WRAPPER ON SOFT SKY GRADIENT */}
            <div className="relative bg-gradient-to-b from-[#1E3A5F]/5 via-white to-white pb-6 pt-4 sm:pt-6">
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
                            <ApplicationLogo className="w-8 h-8 sm:w-9 sm:h-9 shadow-sm shadow-[#D4AF37]/30 group-hover:scale-105 transition-transform" />
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
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${activeDropdown === 'product' ? 'rotate-180 text-[#D4AF37]' : ''}}`} />
                                </button>

                                {activeDropdown === 'product' && (
                                    <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="space-y-1 text-xs">
                                            <a
                                                href="#modules"
                                                onClick={() => setActiveDropdown(null)}
                                                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37] group-hover:text-[#1E3A5F] transition">
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
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${activeDropdown === 'solutions' ? 'rotate-180 text-[#D4AF37]' : ''}}`} />
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
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${activeDropdown === 'resources' ? 'rotate-180 text-[#D4AF37]' : ''}}`} />
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
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] rounded-full font-semibold text-xs sm:text-[14.5px] shadow-sm shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
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
                                <a href="#modules" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#D4AF37] py-1">Product & Modules</a>
                                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#D4AF37] py-1">Pricing</a>
                                <a href="#why-inns" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#D4AF37] py-1">Solutions</a>
                                <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#D4AF37] py-1">Reviews</a>
                                <a href="#why-inns" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#D4AF37] py-1">Blog</a>
                                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#D4AF37] py-1">Resources</a>
                            </nav>
                            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                                {user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="w-full text-center py-2.5 bg-[#D4AF37] text-[#1E3A5F] rounded-full font-semibold text-sm shadow-md"
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
                                            className="w-full text-center py-2.5 bg-[#D4AF37] text-[#1E3A5F] rounded-full font-semibold text-sm shadow-md"
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

            {/* 3. HERO SECTION WITH BACKGROUND SLIDESHOW */}
            <section className="relative isolate overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28">
                {/* Background Slideshow (Nyuma ya Maandishi - Explicitly in front of body canvas) */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {heroSlides.map((slide: any, idx: number) => {
                        const resolvedSrc = slide.image?.startsWith('/uploads/') && typeof window !== 'undefined' && window.location.pathname.startsWith('/inns')
                            ? '/inns' + slide.image
                            : slide.image;

                        return (
                            <div
                                key={slide.id || idx}
                                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                                    idx === heroSlideIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                                }`}
                                style={{ transition: 'opacity 1s ease-in-out, transform 8s ease-out' }}
                            >
                                <img
                                    src={resolvedSrc}
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        if (slide.image && !target.src.includes('/inns/')) {
                                            target.src = '/inns' + (slide.image.startsWith('/') ? slide.image : '/' + slide.image);
                                        }
                                    }}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                                {/* Tuned overlay: Not too faint, not glaring - balanced photo visibility with crisp text */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/15 to-white/65" />
                            </div>
                        );
                    })}
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    {/* Headline (Dynamic per slide) with subtle ambient shadow for perfect contrast */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight max-w-5xl mx-auto leading-[1.14] transition-all duration-500 min-h-[120px] sm:min-h-[140px] flex items-center justify-center drop-shadow-[0_2px_12px_rgba(255,255,255,0.9)]">
                        <span>{currentSlide.title}</span>
                    </h1>

                    {/* Subheadline (Dynamic per slide) */}
                    <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-900 font-bold max-w-3xl mx-auto leading-relaxed transition-all duration-500 min-h-[60px] flex items-center justify-center drop-shadow-[0_1px_8px_rgba(255,255,255,0.9)]">
                        <span>{currentSlide.subtitle}</span>
                    </p>

                    {/* CTA Group */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={user ? route('dashboard') : route('register')}
                            className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] font-extrabold text-sm rounded-2xl shadow-xl shadow-[#D4AF37]/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>{user ? 'Open Hotel Dashboard' : (cms_content?.hero_cta_text || 'Start 14-Day Free Trial')}</span>
                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </Link>

                        <a
                            href="#preview"
                            className="w-full sm:w-auto px-7 py-4 bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-white font-bold text-sm rounded-2xl border border-[#D4AF37]/30 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Activity className="w-4 h-4 text-white-600" />
                            <span>{cms_content?.demo_cta_text || 'Explore Live Modules'}</span>
                        </a>
                    </div>

                    {/* Slide Navigation Indicators & Controls (Matches exact number of slides) */}
                    {heroSlides.length > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {heroSlides.map((_: any, idx: number) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setHeroSlideIndex(idx)}
                                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                                        idx === heroSlideIndex
                                            ? 'w-8 h-2.5 bg-[#D4AF37]'
                                            : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
                                    }`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Value highlights checklist */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-black text-slate-800 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-200/80 shadow-xs max-w-fit mx-auto">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Zero local server installation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Independent Restaurant & Grocery POS</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Full Double-Entry Accounting</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>TRA / EFD Compliant Ready</span>
                        </div>
                    </div>
                </div>

                {/* 4. MULTI-DEVICE 3D ANIMATED SHOWCASE (Computer, Tablet & Smartphone) */}
                <div id="preview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                    <style>{`
                        @keyframes floatLaptop {
                            0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
                            50% { transform: translateY(-7px) rotate(0deg); }
                        }
                        @keyframes floatTablet {
                            0%, 100% { transform: translateY(0px) rotate(2deg); }
                            50% { transform: translateY(-9px) rotate(1.5deg); }
                        }
                        @keyframes floatPhone {
                            0%, 100% { transform: translateY(0px) rotate(-2deg); }
                            50% { transform: translateY(-6px) rotate(-1.5deg); }
                        }
                        .animate-float-laptop {
                            animation: floatLaptop 6s ease-in-out infinite;
                        }
                        .animate-float-tablet {
                            animation: floatTablet 5s ease-in-out infinite 0.7s;
                        }
                        .animate-float-phone {
                            animation: floatPhone 4.5s ease-in-out infinite 1.4s;
                        }
                    `}</style>

                    <div className="bg-gradient-to-b from-white via-slate-50 to-[#D4AF37]/5 rounded-3xl p-5 sm:p-9 shadow-2xl border border-slate-200/90 relative overflow-hidden">
                        {/* Background subtle radial glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#D4AF37]/8 blur-[100px] pointer-events-none rounded-full" />

                        {/* Top Bar with Live Cloud Sync Pulse & Interactive Trigger */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/70 pb-6 relative z-10">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#D4AF37]/10 text-[#B8960C] text-xs font-bold border border-[#D4AF37]/30">
                                    <span>Real-Time Cloud Synchronization</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                                    One Single Hotel Ecosystem Across All Devices
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                                    Desktop PC for Front Desk & Accounting, Tablet for Waiters & POS, and Smartphone for Housekeeping & WhatsApp.
                                </p>
                            </div>

                            {/* Live Interactive Sync Demo Button */}
                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                <button
                                    type="button"
                                    onClick={triggerSyncDemo}
                                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-sm ${
                                        syncedOrderActive
                                            ? 'bg-emerald-600 text-white animate-pulse'
                                            : 'bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F]'
                                    }`}
                                >
                                    <Zap className="w-3.5 h-3.5 fill-white" />
                                    <span>{syncedOrderActive ? '⚡ Syncing Bill Across Devices...' : 'Simulate Live Order Sync'}</span>
                                </button>
                            </div>
                        </div>

                        {/* THE 3D MULTI-DEVICE STAGE (Mirroring user reference photo) */}
                        <div className="relative mt-8 pt-4 pb-10 min-h-[440px] sm:min-h-[500px] flex items-center justify-center overflow-hidden lg:overflow-visible">
                            {/* Reflection Floor Gradient */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-12 bg-gradient-to-t from-blue-400/20 via-blue-200/10 to-transparent blur-xl rounded-full pointer-events-none" />

                            {/* Container for relative positioning of all 3 devices */}
                            <div className="relative w-full max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-0">
                                
                                {/* 1. LAPTOP (Desktop Front Desk PMS) - Left/Center Background */}
                                <div className={`relative z-10 w-full max-w-[480px] sm:max-w-[540px] lg:max-w-[560px] animate-float-laptop transition-all duration-300 ${
                                    activeDeviceFocus === 'laptop' ? 'scale-105 z-30 ring-2 ring-[#D4AF37] rounded-2xl' : ''
                                }`}>
                                    {/* Laptop Lid Screen */}
                                    <div className="bg-slate-950 rounded-t-2xl p-2 sm:p-3 border-[4px] border-slate-800 shadow-2xl relative">
                                        {/* Webcam dot */}
                                        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full mx-auto mb-1.5" />

                                        {/* Screen Surface (Front Desk PMS UI) */}
                                        <div className="bg-white rounded-lg overflow-hidden border border-slate-200/90 text-slate-900 shadow-inner">
                                            {/* Top Window Bar */}
                                            <div className="bg-slate-100 px-3 py-1.5 flex items-center justify-between border-b border-slate-200 text-[10px]">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                                    <span className="ml-2 font-mono font-bold text-slate-600 hidden sm:inline">
                                                        THE INNS - Serengeti Safari Lodge & Resort
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span>Front Desk Online</span>
                                                </div>
                                            </div>

                                            {/* PMS Dashboard Screen Contents */}
                                            <div className="p-3 sm:p-4 bg-slate-50/50">
                                                {/* Mini KPI row */}
                                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
                                                    <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                                                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 block uppercase truncate">Occupancy</span>
                                                        <span className="text-xs sm:text-sm font-black text-slate-900">88.4%</span>
                                                        <span className="text-[8px] sm:text-[9px] text-emerald-600 font-bold block truncate">+18% vs L/M</span>
                                                    </div>
                                                    <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                                                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 block uppercase truncate">Today's Rev</span>
                                                        <span className="text-xs sm:text-sm font-black text-slate-900">TZS 4.85M</span>
                                                        <span className="text-[8px] sm:text-[9px] text-[#D4AF37] font-bold block truncate">14 Arrivals</span>
                                                    </div>
                                                    <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                                                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 block uppercase truncate">Rooms Clean</span>
                                                        <span className="text-xs sm:text-sm font-black text-emerald-600">22 / 25</span>
                                                        <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold block truncate">Ready</span>
                                                    </div>
                                                </div>

                                                {/* Live Visual Gantt Matrix Mini Row */}
                                                <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                                                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold border-b border-slate-100 pb-1.5 gap-1">
                                                        <span className="text-slate-800 flex items-center gap-1 sm:gap-1.5 truncate">
                                                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37] shrink-0" />
                                                            <span className="truncate">Room 101 - Safari Suite</span>
                                                        </span>
                                                        <span className="px-1.5 sm:px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#B8960C] text-[8px] sm:text-[9px] font-extrabold shrink-0">
                                                            Dr. Mhando
                                                        </span>
                                                    </div>

                                                    {/* Synced Folio Alert Animation */}
                                                    {syncedOrderActive ? (
                                                        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-1.5 flex flex-col sm:flex-row sm:items-center justify-between text-[9px] sm:text-[10px] text-emerald-800 animate-bounce gap-1">
                                                            <span className="font-bold truncate">⚡ F&B Bill (+TZS 84,000) Posted!</span>
                                                            <span className="font-mono font-black text-emerald-700 shrink-0">Folio: TZS 369,000</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[9px] sm:text-[10px] text-slate-500 gap-1">
                                                            <span className="truncate">Folio Balance: TZS 285,000 (3 Nights)</span>
                                                            <span className="text-slate-700 font-bold shrink-0">Checkout: Tomorrow</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Realistic Laptop Keyboard Base & Trackpad */}
                                    <div className="h-5 bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-b-xl border-t border-slate-700 shadow-2xl relative flex items-center justify-center">
                                        <div className="w-20 h-1 bg-slate-700 rounded-full shadow-inner" />
                                    </div>
                                    <div className="h-1.5 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 rounded-b-2xl mx-6 shadow-md" />
                                </div>

                                {/* 2. TABLET (Waiter POS & Bar Terminal) - Right Upright Stance */}
                                <div className={`relative z-20 w-64 sm:w-72 lg:w-[280px] lg:-ml-12 lg:-mt-10 animate-float-tablet transition-all duration-300 ${
                                    activeDeviceFocus === 'tablet' ? 'scale-105 z-30 ring-2 ring-emerald-500 rounded-2xl' : ''
                                }`}>
                                    <div className="bg-slate-950 rounded-2xl p-2.5 border-[4px] border-slate-800 shadow-2xl">
                                        {/* Tablet top camera */}
                                        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full mx-auto mb-1.5" />

                                        {/* Tablet Screen Surface */}
                                        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 text-xs">
                                            {/* Tablet Header Bar */}
                                            <div className="bg-emerald-600 text-white px-3 py-2 flex items-center justify-between font-bold">
                                                <div className="flex items-center gap-1.5">
                                                    <Utensils className="w-3.5 h-3.5" />
                                                    <span className="text-[11px]">Table 04 - Poolside</span>
                                                </div>
                                                <span className="text-[9px] bg-emerald-700 px-1.5 py-0.5 rounded font-mono">
                                                    KOT #108
                                                </span>
                                            </div>

                                            {/* Active Restaurant Order Tickets */}
                                            <div className="p-2.5 bg-slate-50 space-y-1.5 text-[10.5px]">
                                                <div className="flex justify-between text-slate-800 font-semibold">
                                                    <span>2x Grilled Tilapia</span>
                                                    <span className="font-mono font-bold">TZS 44,000</span>
                                                </div>
                                                <div className="flex justify-between text-slate-800 font-semibold">
                                                    <span>2x Passion Juice</span>
                                                    <span className="font-mono font-bold">TZS 16,000</span>
                                                </div>
                                                <div className="flex justify-between text-slate-800 font-semibold">
                                                    <span>4x Kilimanjaro Lager</span>
                                                    <span className="font-mono font-bold">TZS 24,000</span>
                                                </div>

                                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
                                                    <span>Order Total</span>
                                                    <span className="font-mono text-emerald-700 text-sm">TZS 84,000</span>
                                                </div>

                                                {/* Interactive Post to Room Button */}
                                                <button
                                                    type="button"
                                                    onClick={triggerSyncDemo}
                                                    className={`w-full mt-2 py-2 rounded-lg font-bold text-[10px] text-white flex items-center justify-center gap-1.5 transition ${
                                                        syncedOrderActive
                                                            ? 'bg-emerald-700'
                                                            : 'bg-emerald-600 hover:bg-emerald-700'
                                                    }`}
                                                >
                                                    <Zap className="w-3 h-3 fill-white" />
                                                    <span>{syncedOrderActive ? '✓ Posted to Room 101' : 'Post to Room 101 Folio'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Tablet Soft Reflection */}
                                    <div className="h-2 bg-gradient-to-b from-slate-900/40 to-transparent blur-xs rounded-full mx-4 mt-1" />
                                </div>

                                {/* 3. SMARTPHONE (Mobile Housekeeping & WhatsApp) - Resting in Foreground */}
                                <div className={`relative z-30 w-48 sm:w-52 lg:w-[210px] lg:-ml-28 lg:mt-24 animate-float-phone transition-all duration-300 ${
                                    activeDeviceFocus === 'phone' ? 'scale-105 z-30 ring-2 ring-indigo-500 rounded-3xl' : ''
                                }`}>
                                    <div className="bg-slate-950 rounded-3xl p-2 border-[3.5px] border-slate-800 shadow-2xl">
                                        {/* Dynamic Island Pill */}
                                        <div className="w-12 h-2.5 bg-black rounded-full mx-auto mb-1 flex items-center justify-center">
                                            <div className="w-1 h-1 bg-slate-800 rounded-full" />
                                        </div>

                                        {/* Mobile Screen Surface */}
                                        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 text-xs">
                                            {/* Mobile App Header */}
                                            <div className="bg-slate-900 text-white px-2.5 py-1.5 flex items-center justify-between text-[10px] font-bold">
                                                <span className="flex items-center gap-1">
                                                    <Bed className="w-3 h-3 text-[#D4AF37]" />
                                                    Maid Amina
                                                </span>
                                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 rounded text-emerald-400">
                                                    Online
                                                </span>
                                            </div>

                                            {/* Mobile Housekeeping Content */}
                                            <div className="p-2 bg-slate-50 space-y-1.5 text-[9.5px]">
                                                <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between">
                                                    <span>Room 103 Cleaned</span>
                                                    <span className="text-[8px] bg-emerald-600 text-white px-1 rounded">Ready</span>
                                                </div>

                                                {/* Simulated WhatsApp Notification */}
                                                <div className="p-1.5 rounded-lg bg-green-50 border border-green-200 text-green-900">
                                                    <div className="flex items-center gap-1 font-bold text-[9px] text-green-800">
                                                        <MessageSquare className="w-2.5 h-2.5" />
                                                        <span>WhatsApp Receipt</span>
                                                    </div>
                                                    <div className="text-[8.5px] text-slate-600 mt-0.5">
                                                        {syncedOrderActive ? 'Sent TZS 84,000 bill update to Guest WhatsApp ✓' : 'Sent TZS 285,000 receipt to Dr. Mhando ✓'}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={triggerSyncDemo}
                                                    className="w-full py-1.5 bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] font-bold rounded-lg text-[9px] transition"
                                                >
                                                    Mark Room 102 Clean
                                                </button>
                                            </div>

                                            {/* Home Indicator */}
                                            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-1" />
                                        </div>
                                    </div>
                                    {/* Mobile Soft Floor Reflection */}
                                    <div className="h-2 bg-gradient-to-b from-slate-900/40 to-transparent blur-xs rounded-full mx-3 mt-1" />
                                </div>

                            </div>
                        </div>

                        {/* Three Device Capability Badges */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200/70 text-xs">
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#B8960C] flex items-center justify-center shrink-0">
                                    <Laptop className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 block text-xs">Desktop PMS (Manager & Reception)</span>
                                    <span className="text-slate-500 text-[11px]">Visual Gantt timeline, cash vault auditing & TRA EFD tax receipts.</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Tablet className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 block text-xs">Tablet Touch POS (Restaurant & Bar)</span>
                                    <span className="text-slate-500 text-[11px]">Instant KOT kitchen orders and 1-tap room folio posting.</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                    <Smartphone className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 block text-xs">Mobile Phone (Staff & WhatsApp)</span>
                                    <span className="text-slate-500 text-[11px]">Housekeeper room status updates & automated guest WhatsApp receipts.</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Portal CTA */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <span className="text-slate-600 font-medium">
                                Ready to experience the all-in-one multi-device workflow for your property?
                            </span>
                            <Link
                                href={user ? route('dashboard') : route('register')}
                                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] font-bold rounded-xl transition shadow-sm"
                            >
                                {user ? 'Open Hotel Dashboard →' : 'Start 14-Day Free Trial →'}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. WHY THE INNS (THE 4 SAAS PILLARS) */}
            <section id="why-inns" className="py-20 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        {/* <span className="text-[#D4AF37] font-black text-xs uppercase tracking-wider">Engineered for Hospitality Growth</span> */}
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                            Why Modern Hoteliers Are Switching to THE INNS
                        </h2>
                        <p className="text-slate-600 mt-3 text-sm sm:text-base">
                            Traditional hotel software is clunky, expensive, and leaves your restaurant and accounting disconnected. THE INNS provides a unified, decoupled architecture built for operational speed.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
                        {/* Pillar 1 */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 hover:border-[#D4AF37] transition hover:shadow-lg hover:shadow-blue-500/5 group">
                            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center font-bold mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Total System Decoupling</h3>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                Restaurant, Grocery Minimart, Store Warehouse, and Hotel Rooms operate independently. A POS rush never freezes hotel reservations, and each department maintains dedicated shifts and registers.
                            </p>
                        </div>

                        {/* Pillar 2 */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 hover:border-[#D4AF37] transition hover:shadow-lg hover:shadow-blue-500/5 group">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                                <Scale className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Automated Double-Entry GL</h3>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                No more manual Excel exports at midnight. Room revenue, F&B orders, inventory write-offs, and guest payments post directly into the Chart of Accounts, balancing your Trial Balance in real time.
                            </p>
                        </div>

                        {/* Pillar 3 */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 hover:border-[#D4AF37] transition hover:shadow-lg hover:shadow-blue-500/5 group">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Multi-Property Tenant Control</h3>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                Manage a beach resort in Zanzibar, a safari camp in Serengeti, and a business hotel in Arusha or Dar from one unified dashboard. Switch between branches in one click with consolidated owner reporting.
                            </p>
                        </div>

                        {/* Pillar 4 */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 hover:border-[#D4AF37] transition hover:shadow-lg hover:shadow-blue-500/5 group">
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
                        {/* <span className="text-[#D4AF37] font-black text-xs uppercase tracking-wider">Hospitality Architecture</span> */}
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
                            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mb-4">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">Front Office</span>
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
                        {/* <span className="text-[#D4AF37] font-black text-xs uppercase tracking-wider">Predictable Pricing</span>*/}
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
                                        billingCycle === 'annually' ? 'bg-[#D4AF37] text-[#1E3A5F] shadow-xs' : 'text-slate-500 hover:text-slate-900'
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
                        <div className="bg-[#1E3A5F] rounded-3xl p-8 text-white shadow-xl ring-2 ring-[#D4AF37]/50 relative flex flex-col">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#1E3A5F] font-black text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                                Most Popular Choice
                            </div>

                            <div>
                                <span className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Hotel Pro</span>
                                <h3 className="text-2xl font-black text-white mt-1">Hotels, resorts and larger single-property operations</h3>
                                <div className="mt-6">
                                    <span className="text-3xl sm:text-4xl font-black text-white">
                                        {formatPrice(219000, 90, 2102400, 860)}
                                    </span>
                                    <span className="text-xs text-[#D4AF37]/70 font-semibold block mt-1">
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
                                    className="w-full py-3 px-4 bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] font-bold text-xs rounded-xl block text-center transition shadow-sm"
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
                        <span className="text-[#D4AF37] font-black text-xs uppercase tracking-wider">Trusted by Industry Leaders</span>
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
                                <div className="w-9 h-9 rounded-full bg-[#D4AF37]/15 text-[#B8960C] font-bold flex items-center justify-center text-xs">
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
                        {/* <span className="text-[#D4AF37] font-black text-xs uppercase tracking-wider">Got Questions?</span> */}
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
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#D4AF37]' : ''}}`} />
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
            <section id="contact" className="py-20 bg-[#1E3A5F] text-white relative overflow-hidden border-t border-[#D4AF37]/20">
                

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
                            className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] font-extrabold text-sm rounded-2xl transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-sm"
                        >
                            <span>{user ? 'Go to Dashboard' : 'Start 14-Day Free Trial'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link> 

                        {/* <a
                            href="tel:+255779646632"
                            className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition flex items-center justify-center gap-2"
                        >
                            <Phone className="w-4 h-4 text-[#D4AF37]" />
                            <span>Call Sales: <br /> +255 (779) 646 632 <hr/>
                            &nbsp; &nbsp;+255 (659) 958 595 <hr />
                            &nbsp; &nbsp;+255 (794) 376 209
                            </span>
                        </a> */}
                    </div>

                    <div className="mt-8 text-xs text-slate-400 flex items-center justify-center gap-6">
                        <span>No credit card required</span>
                        <span className="text-slate-600">|</span>
                        <span>Instant cloud setup</span>
                        <span className="text-slate-600">|</span>
                        <span>24/7 Local Support</span>
                    </div>
                </div>
            </section>

            {/* 11. FOOTER */}
            <footer className="bg-[#1E3A5F] text-slate-400 py-16 border-t border-[#D4AF37]/20 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                        {/* Col 1: Brand */}
                        <div className="col-span-2 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <ApplicationLogo className="w-10 h-10 shadow-md" />
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

