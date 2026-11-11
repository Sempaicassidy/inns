import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import PwaInstallButton from '@/Components/PwaInstallButton';
import PwaNotificationManager from '@/Components/PwaNotificationManager';
import OfflineSyncManager from '@/Components/OfflineSyncManager';
import OfflineStatus from '@/Components/OfflineStatus';
import OfflineBanner from '@/Components/OfflineBanner';
import SyncIndicator from '@/Components/SyncIndicator';
import ToastHost from '@/Components/ToastHost';
import RoleSwitcher from '@/Components/RoleSwitcher';
import { ActiveRoleProvider } from '@/contexts/ActiveRoleContext';
import { getRoleNavigation, NAV_ICONS, NavItemDef } from '@/config/role-navigation';
import {
    Bell,
    BellRing,
    Bed,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Crown,
    DollarSign,
    LogOut,
    Menu,
    MessageSquare,
    Package,
    ShieldCheck,
    X,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';

export default function AuthenticatedLayout({
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [highlightBanner, setHighlightBanner] = useState<string | null>(null);

    const pageUrl = usePage().url;

    // Universal Auto-Highlight from Notification Navigation
    useEffect(() => {
        let term = '';
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            term = params.get('highlight') || '';
        }
        if (!term && flash?.highlight_term) {
            term = flash.highlight_term;
        }

        if (!term) return;
        term = decodeURIComponent(term).trim();
        if (!term) return;

        setHighlightBanner(term);

        const timer = setTimeout(() => {
            const normalized = term.toLowerCase();

            // 1. Check matching ID directly
            let target: HTMLElement | null =
                document.getElementById(term) ||
                document.getElementById(`item-${term}`) ||
                document.getElementById(`room-${term}`) ||
                document.getElementById(`room-row-${term}`) ||
                document.getElementById(`res-${term}`) ||
                document.getElementById(`voucher-${term}`) ||
                document.getElementById(`task-${term}`);

            // 2. Check elements marked with data-highlightable
            if (!target) {
                const candidates = document.querySelectorAll('[data-highlightable]');
                for (const el of Array.from(candidates)) {
                    if (el.textContent && el.textContent.toLowerCase().includes(normalized)) {
                        target = el as HTMLElement;
                        break;
                    }
                }
            }

            // 3. Fallback: Search table rows or cards
            if (!target) {
                const rows = document.querySelectorAll('tbody tr, .room-card, .inventory-card, article');
                for (const row of Array.from(rows)) {
                    if (row.textContent && row.textContent.toLowerCase().includes(normalized)) {
                        target = row as HTMLElement;
                        break;
                    }
                }
            }

            // 4. Fallback: Search cards/divs inside main
            if (!target) {
                const divs = document.querySelectorAll('main div');
                for (const d of Array.from(divs)) {
                    if (d.clientHeight >= 30 && d.clientHeight <= 260 && d.textContent && d.textContent.toLowerCase().includes(normalized)) {
                        target = d as HTMLElement;
                        break;
                    }
                }
            }

            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                target.classList.add('notification-highlight-glow');

                setTimeout(() => {
                    target?.classList.remove('notification-highlight-glow');
                }, 7500);
            }

            setTimeout(() => {
                setHighlightBanner(null);
            }, 7500);
        }, 450);

        return () => clearTimeout(timer);
    }, [pageUrl]);

    const notifications = auth?.notifications || [];
    const unreadCount = auth?.unread_notifications_count !== undefined ? auth.unread_notifications_count : notifications.length;

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const activeRole = (auth as any)?.active_role || user?.active_role || user?.role || '';
    const isSuperAdmin =
        !(auth as any)?.is_impersonating && (
            user?.role === 'super_admin' ||
            activeRole === 'super_admin' ||
            (Array.isArray(user?.roles) && user.roles.includes('super_admin')) ||
            route().current('saas-admin.*')
        );
    const isOwner = !isSuperAdmin && (
        ['owner', 'director', 'investor', 'proprietor'].includes(activeRole) ||
        ['owner', 'director', 'investor', 'proprietor'].includes(user?.role) ||
        (Array.isArray(user?.roles) && user.roles.includes('owner') && (activeRole === 'owner' || route().current('owner.*'))) ||
        route().current('owner.*')
    );
    const isManager = !isSuperAdmin && !isOwner && (
        ['general_manager', 'manager', 'admin', 'hr_manager', 'procurement_manager'].includes(activeRole) ||
        ['general_manager', 'manager', 'admin', 'hr_manager', 'procurement_manager'].includes(user?.role)
    );
    const canAccessHr = Boolean(
        (auth as any)?.can_access_hr ??
        (isSuperAdmin || isOwner || isManager)
    );

    const currentTab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') || 'overview' : 'overview';

    // Dynamic Tenant & System Identity
    const systemName = (auth as any)?.is_impersonating
        ? ((auth as any).impersonated_tenant_name)
        : ((auth as any)?.tenant?.system_name || user?.tenant?.name || 'THE INNS');
    const hotelDisplayName = (auth as any)?.is_impersonating
        ? ((auth as any).impersonated_tenant_name)
        : ((auth as any)?.tenant?.name || user?.tenant?.name || 'THE INNS Hospitality Platform');
    const hotelTagline = (auth as any)?.tenant?.tagline || (isSuperAdmin ? 'Centralized SaaS Ecosystem' : 'Hotel Property Workspace');


    const isFeatureAllowed = (featureKey?: string) => {
        if (!featureKey) return true;
        if (isSuperAdmin || (auth as any)?.is_impersonating) return true;
        const features = (auth as any)?.tenant?.features;
        if (!features) return true;
        return features[featureKey] !== false;
    };

    const isRoleAllowed = (roles?: string[]): boolean => {
        if (!roles || roles.length === 0) return true;
        if (isSuperAdmin || (auth as any)?.is_impersonating || isOwner) return true;
        return roles.includes(activeRole);
    };

    const filterItemsByFeature = (items: any[]): any[] => {
        const allowed = (item: any) => isFeatureAllowed(item.feature) && isRoleAllowed(item.roles);
        return items
            .map(item => {
                if (item.section && item.items) {
                    const filteredSub = item.items.filter(allowed);
                    return filteredSub.length > 0 ? { ...item, items: filteredSub } : null;
                }
                if (item.items) {
                    const filteredSub = item.items.filter(allowed);
                    return (filteredSub.length > 0 && allowed(item))
                        ? { ...item, items: filteredSub }
                        : null;
                }
                return allowed(item) ? item : null;
            })
            .filter(Boolean);
    };

    // Centralized role-based navigation (resources/js/config/role-navigation.ts)
    const isNavItemActive = (def: NavItemDef): boolean => {
        if (def.active === false) return false;
        const patterns = def.active ?? (def.route ? [def.route] : []);
        if (patterns.length === 0) return false;
        const routeMatched = patterns.some((pattern) => route().current(pattern));
        if (!routeMatched) return false;
        if (def.tab !== undefined) return currentTab === def.tab;
        return true;
    };

    const resolveNavItem = (def: NavItemDef): any => {
        const children = def.items?.map(resolveNavItem);
        const selfActive = isNavItemActive(def);
        return {
            name: def.name,
            href: def.route ? route(def.route, def.params ?? {}) : undefined,
            icon: NAV_ICONS[def.icon],
            active: def.items ? selfActive || (children?.some((child: any) => child.active) ?? false) : selfActive,
            feature: def.feature,
            isLogout: def.isLogout,
            hrOnly: def.hrOnly,
            roles: def.roles,
            items: children,
        };
    };

    const navDef = getRoleNavigation(activeRole || user?.role);
    const resolvedNav = navDef.navigation.map((def) =>
        def.section
            ? {
                section: def.section,
                title: def.title,
                icon: NAV_ICONS[def.icon],
                items: (def.items ?? []).map(resolveNavItem),
            }
            : resolveNavItem(def)
    );
    const navItems = ((isSuperAdmin || isOwner) ? resolvedNav : filterItemsByFeature(resolvedNav))
        .filter((item: any) => !item.hrOnly || canAccessHr);

    const getRoleTitle = (role?: string) => {
        if ((auth as any)?.is_impersonating) return 'Support Manager (Temporary)';
        const r = (auth as any)?.active_role || user?.active_role || role;
        if (!r) return 'Staff';
        if (r === 'super_admin') return 'Super Admin (SaaS)';
        if (r === 'owner') return 'Hotel Owner / Director';
        if (r === 'general_manager' || r === 'manager') return 'General Manager';
        if (r === 'hr_manager') return 'HR Manager';
        if (r === 'accountant' || r === 'senior_accountant' || r === 'finance_officer') return 'Accountant';
        if (r === 'receptionist' || r === 'front_desk' || r === 'front_office' || r === 'front_office_manager' || r === 'staff') return 'Front Desk Receptionist';
        if (r === 'cashier' || r === 'pos_cashier') return 'POS Cashier';
        if (r === 'waiter') return 'Restaurant Waiter';
        if (r === 'bartender') return 'Bartender';
        if (r === 'chef') return 'Kitchen Chef';
        if (r === 'restaurant_cashier' || r === 'restaurant_staff' || r === 'restaurant_pos') return 'Restaurant Cashier';
        if (r === 'grocery_cashier' || r === 'supermarket_cashier') return 'Supermarket / Grocery Cashier';
        if (r === 'storekeeper') return 'Store / Inventory Keeper';
        if (r === 'procurement_manager') return 'Procurement Manager';
        if (r === 'housekeeper' || r === 'housekeeping_supervisor') return 'Housekeeping';
        if (r === 'auditor' || r === 'night_auditor') return 'Night Auditor';
        if (r === 'admin') return 'Administrator';
        return 'Staff';
    };

    const renderNavItem = (item: any, depth = 0) => {
        const Icon = item.icon;
        const isExpanded = expandedSections[item.name] !== undefined ? expandedSections[item.name] : (item.active ?? true);
        const hasSubItems = item.items && item.items.length > 0;

        if (item.isLogout) {
            return (
                <Link
                    key={item.name}
                    href={route('logout')}
                    method="post"
                    as="button"
                    onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-left cursor-pointer"
                >
                    <Icon className="w-4 h-4 text-rose-500" />
                    <span className="flex-1">{item.name}</span>
                </Link>
            );
        }

        if (hasSubItems) {
            return (
                <div key={item.name} className="space-y-1">
                    <button
                        type="button"
                        onClick={() => toggleSection(item.name)}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${item.active
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-extrabold'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <Icon className={`w-4 h-4 ${item.active ? 'text-[#D4AF37]' : 'text-white/40'}`} />
                        <span className="flex-1 text-left">{item.name}</span>
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    {isExpanded && (
                        <div className="pl-3.5 space-y-1 border-l border-[#D4AF37]/30 ml-4 my-1">
                            {item.items.map((subItem: any) => renderNavItem(subItem, depth + 1))}
                        </div>
                    )}
                </div>
            );
        }

        const isChild = depth > 0;

        return (
            <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 transition rounded-xl ${isChild
                    ? `px-3 py-2 text-xs ${item.active
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-bold border border-[#D4AF37]/30 shadow-2xs'
                        : 'text-white/60 hover:text-white hover:bg-white/10 font-medium'
                    }`
                    : `px-3.5 py-2.5 text-xs ${item.active
                        ? 'bg-[#D4AF37] text-[#1E3A5F] shadow-xs font-bold'
                        : 'text-white/70 hover:text-white hover:bg-white/10 font-semibold'
                    }`
                    }`}
            >
                <Icon className={`w-4 h-4 ${item.active ? (isChild ? 'text-[#D4AF37]' : 'text-[#1E3A5F]') : 'text-white/40'}`} />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold">
                        {item.badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <ActiveRoleProvider>
            <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col md:flex-row font-sans antialiased">
                <PwaNotificationManager />
                <OfflineSyncManager />
                <ToastHost />
                {/* MOBILE TOP BAR */}
                <div className="md:hidden sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#D4AF37]/30 px-4 h-14 flex items-center justify-between shadow-xs">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-[#D4AF37] hover:bg-white/10 transition"
                        aria-label="Open Navigation"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center space-x-2.5">
                        <ApplicationLogo className="w-7 h-7 shadow-xs" />
                        <span className="font-bold text-lg text-[#D4AF37] truncate max-w-[170px]">{systemName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <SyncIndicator className="text-[#D4AF37] hover:bg-white/10" />
                        <button
                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            className="w-9 h-9 rounded-full bg-[#D4AF37] text-[#1E3A5F] font-bold flex items-center justify-center text-sm shadow-xs"
                        >
                            {user?.name?.charAt(0) || 'U'}
                        </button>
                    </div>
                </div>

                {/* MOBILE OVERLAY */}
                {sidebarOpen && (
                    <div
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
                    />
                )}

                {/* SIDEBAR */}
                <aside
                    className={`fixed md:sticky top-0 bottom-0 left-0 z-50 w-64 bg-[#1E3A5F] border-r border-[#D4AF37]/20 flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 shadow-xl md:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    {/* Logo Header */}
                    <div className="px-5 py-4 flex items-center justify-between border-b border-[#D4AF37]/20">
                        <Link href={route('dashboard')} className="flex items-center space-x-2.5 group" onClick={() => setSidebarOpen(false)}>
                            <ApplicationLogo className="w-8 h-8 shadow-xs group-hover:scale-105 transition-transform" />
                            <span className="font-bold text-lg text-[#D4AF37] truncate max-w-[170px] tracking-wide">{systemName}</span>
                        </Link>

                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-2 rounded-lg text-white/60 hover:bg-white/10 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Active Role / Workspace Switcher */}
                    <RoleSwitcher />

                    {/* Nav Items — resolved from centralized role navigation config */}
                    <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                        {navItems.map((itemOrSection: any, idx: number) => {
                            if (itemOrSection.section) {
                                const SectionIcon = itemOrSection.icon;
                                return (
                                    <div key={itemOrSection.section || idx} className="mb-3">
                                        <div className="px-3 py-1 mb-1">
                                            <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#D4AF37]/60 uppercase tracking-wider">
                                                <SectionIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                                                <span>{itemOrSection.title}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            {itemOrSection.items.map((subItem: any) => renderNavItem(subItem))}
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div key={itemOrSection.name || idx} className="mb-2">
                                    {renderNavItem(itemOrSection)}
                                </div>
                            );
                        })}
                    </nav>

                    {/* PWA App Install in Sidebar */}
                    <div className="px-4 py-2 border-t border-[#D4AF37]/20">
                        <PwaInstallButton className="w-full" />
                    </div>

                    {/* User Info (Bottom) */}
                    <div className="px-4 py-3.5 border-t border-[#D4AF37]/20 bg-[#D4AF37]/5">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#1E3A5F] font-bold flex items-center justify-center text-sm shadow-xs">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
                                <p className="text-[11px] text-white/50 truncate">{getRoleTitle(activeRole)}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT WRAPPER */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Super Admin Impersonation Workspace Banner */}
                    {(auth as any)?.is_impersonating && (
                        <div className="bg-amber-400 text-slate-950 px-4 sm:px-6 py-2.5 font-bold text-xs sm:text-sm flex items-center justify-between sticky top-0 z-50 shadow-md border-b border-amber-500">
                            <div className="flex items-center gap-2.5">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-950"></span>
                                </span>
                                <span>
                                    You are viewing hotel workspace: <strong className="font-black text-slate-950">{(auth as any).impersonated_tenant_name || 'Hotel Tenant'}</strong> as General Manager.
                                </span>
                            </div>
                            <Link
                                href={route('saas-admin.impersonate.leave')}
                                method="post"
                                as="button"
                                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs transition"
                            >
                                Return to Super Admin Portal
                            </Link>
                        </div>
                    )}
                    {/* Hotel Owner Branch Inspection Banner */}
                    {((auth as any)?.is_owner_inspecting || (auth as any)?.owner_inspecting_property_name) && (
                        <div className="bg-amber-500 text-slate-950 px-4 sm:px-6 py-2.5 font-bold text-xs sm:text-sm flex items-center justify-between sticky top-0 z-50 shadow-md border-b border-amber-600">
                            <div className="flex items-center gap-2.5">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-950"></span>
                                </span>
                                <span>
                                    Inspecting property: <strong className="font-black text-slate-950">{(auth as any)?.owner_inspecting_property_name || 'Hotel Property'}</strong> in <strong className="font-black text-slate-950">Owner Mode</strong>.
                                </span>
                            </div>
                            <Link
                                href={route('owner.inspect.leave')}
                                method="post"
                                as="button"
                                className="px-3.5 py-1.5 bg-[#1E3A5F] hover:bg-[#152a45] text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5"
                            >
                                <Crown className="w-3.5 h-3.5 text-amber-300" />
                                Return to Owner Portal
                            </Link>
                        </div>
                    )}
                    {/* Offline Mode Banner */}
                    <OfflineBanner />

                    {/* TOP HEADER */}
                    <header className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between bg-white border-b border-slate-100 shadow-2xs">
                        {/* Left: Mobile hamburger & Workspace Context */}
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center shrink-0">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight flex items-center gap-2">
                                        <span>{hotelDisplayName}</span>
                                        {(auth as any)?.is_impersonating && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                                Support View
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                                        {hotelTagline}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Offline status, Sync Indicator, Clock, SMS balance, Profile */}
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* Offline Status Badge */}
                            <OfflineStatus className="hidden sm:inline-flex" />

                            {/* Sync Indicator */}
                            <SyncIndicator />

                            {/* Live Clock */}
                            <div className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {/* Hotel SMS Balance Badge (Hotel Workspace Only) */}
                            {!isSuperAdmin && (
                                <Link
                                    href={route('whatsapp.index')}
                                    title={`SMS Balance: ${Number((auth as any)?.sms_balance ?? 0).toLocaleString()} Credits available. Click to review gateway or send messages.`}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs border cursor-pointer ${Number((auth as any)?.sms_balance ?? 0) <= 50
                                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                >
                                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${Number((auth as any)?.sms_balance ?? 0) <= 50 ? 'text-amber-600' : 'text-emerald-600'}`} />
                                    <span className="font-mono font-extrabold">{Number((auth as any)?.sms_balance ?? 0).toLocaleString()}</span>
                                    <span className="hidden md:inline font-semibold text-[11px] text-slate-500">SMS Credits</span>
                                </Link>
                            )}

                            {/* Top Action Button - only for Super Admin to jump to SaaS portal if on hotel view */}
                            {isSuperAdmin && (
                                <Link
                                    href={route('saas-admin.index')}
                                    className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#1E3A5F] px-3.5 py-1.5 rounded-xl font-bold text-xs hover:shadow-xs transition-all flex items-center gap-1.5"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">SaaS Portal</span>
                                </Link>
                            )}

                            {/* Top Action Button - Hotel Owner Jump Buttons */}
                            {isOwner && !route().current('owner.*') && (
                                <Link
                                    href={route('owner.index')}
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                                    title="Open Hotel Owner Portal"
                                >
                                    <Crown className="w-3.5 h-3.5 text-amber-200" />
                                    <span className="hidden sm:inline">Owner Portal</span>
                                </Link>
                            )}
                            {isOwner && route().current('owner.*') && (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-[#1E3A5F] hover:bg-[#152a45] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                                    title="View Branch Dashboard as Manager"
                                >
                                    <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    <span className="hidden sm:inline">Manager View</span>
                                </Link>
                            )}

                            {/* Notification Bell with Interactive Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition relative cursor-pointer ${notificationsOpen
                                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] ring-2 ring-[#D4AF37]/20'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                        }`}
                                    title="Notifications & Operational Alerts"
                                >
                                    <Bell className="w-4 h-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notificationsOpen && (
                                    <>
                                        <div
                                            onClick={() => setNotificationsOpen(false)}
                                            className="fixed inset-0 z-40"
                                        />
                                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 text-xs overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                            {/* Dropdown Header */}
                                            <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-slate-900 text-sm">Notifications</span>
                                                    {unreadCount > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#B8960C] font-bold text-[10px]">
                                                            {unreadCount} new
                                                        </span>
                                                    )}
                                                </div>

                                                {unreadCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            router.post(route('notifications.mark-all-read'), {}, { preserveScroll: true });
                                                            setNotificationsOpen(false);
                                                        }}
                                                        className="text-[11px] font-bold text-[#D4AF37] hover:text-[#B8960C] transition cursor-pointer"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>

                                            {/* Notifications List */}
                                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                                                {notifications.length === 0 ? (
                                                    <div className="p-6 text-center text-slate-400">
                                                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
                                                        <p className="font-bold text-slate-700">All caught up!</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">No pending alerts or unread notifications.</p>
                                                    </div>
                                                ) : (
                                                    notifications.map((item: any, idx: number) => {
                                                        const targetUrl = item.url || (item.id ? route('notifications.go', item.id) : '#');
                                                        return (
                                                            <Link
                                                                key={item.id || idx}
                                                                href={targetUrl}
                                                                onClick={() => setNotificationsOpen(false)}
                                                                className="flex items-start gap-3 p-3.5 hover:bg-slate-50 transition text-left group block"
                                                            >
                                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${item.type === 'check_in' || item.type === 'reservation'
                                                                    ? 'bg-[#D4AF37]/15 text-[#B8960C]'
                                                                    : item.type === 'housekeeping'
                                                                        ? 'bg-rose-100 text-rose-600'
                                                                        : item.type === 'finance'
                                                                            ? 'bg-emerald-100 text-emerald-600'
                                                                            : item.type === 'inventory'
                                                                                ? 'bg-amber-100 text-amber-600'
                                                                                : 'bg-purple-100 text-purple-600'
                                                                    }`}>
                                                                    {item.type === 'check_in' || item.type === 'reservation' ? (
                                                                        <Calendar className="w-4 h-4" />
                                                                    ) : item.type === 'housekeeping' ? (
                                                                        <Bed className="w-4 h-4" />
                                                                    ) : item.type === 'finance' ? (
                                                                        <DollarSign className="w-4 h-4" />
                                                                    ) : item.type === 'inventory' ? (
                                                                        <Package className="w-4 h-4" />
                                                                    ) : (
                                                                        <Bell className="w-4 h-4" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <p className="font-bold text-slate-900 truncate text-xs group-hover:text-[#D4AF37] transition">
                                                                            {item.title}
                                                                        </p>
                                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                                            {item.time}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                                                                        {item.message}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Dropdown Footer */}
                                            <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between px-3">
                                                <button
                                                    type="button"
                                                    onClick={() => (window as any).triggerPwaNotificationPopup?.()}
                                                    className="text-[11px] font-bold text-[#1E3A5F] hover:text-[#B8960C] transition cursor-pointer flex items-center gap-1"
                                                    title="Trigger instant PWA notification popup"
                                                >
                                                    <BellRing className="w-3.5 h-3.5 text-[#D4AF37]" />
                                                    <span>Test PWA Popup</span>
                                                </button>
                                                <Link
                                                    href={route('notifications.index')}
                                                    onClick={() => setNotificationsOpen(false)}
                                                    className="text-xs font-bold text-[#D4AF37] hover:text-[#B8960C] transition block py-1"
                                                >
                                                    View all notifications inbox â†’
                                                </Link>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Profile */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                    className="hidden md:flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition text-left cursor-pointer"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-[#D4AF37] text-[#1E3A5F] font-bold flex items-center justify-center text-sm">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-900 leading-tight">
                                            {user?.name || 'User'}
                                        </span>
                                        <span className="block text-xs text-gray-500 leading-tight">
                                            {getRoleTitle(activeRole)}
                                        </span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>

                                {profileDropdownOpen && (
                                    <>
                                        <div
                                            onClick={() => setProfileDropdownOpen(false)}
                                            className="fixed inset-0 z-40"
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 text-sm">
                                            <div className="px-4 py-2 border-b border-gray-200">
                                                <p className="font-bold text-gray-900">{user?.name}</p>
                                                <p className="text-gray-500 truncate text-xs">{user?.email}</p>
                                            </div>
                                            <Link
                                                href={route('tenant.settings')}
                                                className="block px-4 py-2 text-gray-900 hover:bg-gray-100 font-semibold"
                                            >
                                                Hotel & Receipt Branding
                                            </Link>
                                            <Link
                                                href={route('profile.edit')}
                                                className="block px-4 py-2 text-gray-900 hover:bg-gray-100 font-semibold"
                                            >
                                                Profile Settings
                                            </Link>
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-semibold flex items-center space-x-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Log Out</span>
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* MAIN PAGE BODY */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 relative">
                        {/* Floating Notification Highlight Alert Pill */}
                        {highlightBanner && (
                            <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-250">
                                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl shadow-blue-900/30 text-xs font-bold border border-slate-700">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4AF37]"></span>
                                    </span>
                                    <span>
                                        Focusing: <span className="text-[#D4AF37] font-extrabold">{highlightBanner}</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setHighlightBanner(null)}
                                        className="ml-1 p-1 hover:bg-white/20 rounded-lg transition text-slate-300 hover:text-white"
                                        title="Dismiss highlight"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                        {children}
                    </main>
                </div>
            </div>
        </ActiveRoleProvider>
    );
}
