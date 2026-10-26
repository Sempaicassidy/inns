import Dropdown from '@/Components/Dropdown';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BedDouble,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Hotel,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    Sparkles,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const property = auth.property;
    const businessDate = auth.businessDate;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dismissFlash, setDismissFlash] = useState(false);

    const navItems = [
        { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, active: route().current('dashboard') },
        { name: 'Calendar', href: route('calendar.index'), icon: Calendar, active: route().current('calendar.*') },
        { name: 'Reservations', href: route('reservations.index'), icon: BedDouble, active: route().current('reservations.*') },
        { name: 'Folios & Billing', href: route('folios.index'), icon: CreditCard, active: route().current('folios.*') },
        { name: 'Housekeeping', href: route('housekeeping.index'), icon: Sparkles, active: route().current('housekeeping.*') },
        { name: 'Night Audit', href: route('night-audit.index'), icon: Moon, active: route().current('night-audit.*') },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
            {/* Top Bar / Hospitality Header */}
            <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        
                        {/* Brand & Property Identity */}
                        <div className="flex items-center space-x-4">
                            <Link href={route('dashboard')} className="flex items-center space-x-2.5 group">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
                                    <Hotel className="w-5 h-5 text-slate-950 stroke-[2.2]" />
                                </div>
                                <div className="leading-tight">
                                    <div className="flex items-center space-x-1.5">
                                        <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-slate-200 to-amber-200 bg-clip-text text-transparent">
                                            HAULA
                                        </span>
                                        <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                            HMS
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-[280px]">
                                        {property?.name || 'Serengeti Safari Lodge'}
                                    </p>
                                </div>
                            </Link>

                            {/* Business Date Pill */}
                            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-slate-400">Business Date:</span>
                                <span className="font-semibold text-amber-300 font-mono">
                                    {businessDate || new Date().toISOString().split('T')[0]}
                                </span>
                            </div>
                        </div>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden md:flex items-center space-x-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
                                            item.active
                                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${item.active ? 'text-amber-400' : 'text-slate-400'}`} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Profile & Quick Actions */}
                        <div className="flex items-center space-x-3">
                            <div className="hidden sm:flex flex-col text-right">
                                <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                                <span className="text-[10px] uppercase tracking-wider font-mono text-amber-400/90 font-medium">
                                    {user.role ? user.role.replace('_', ' ') : 'Staff'}
                                </span>
                            </div>

                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center p-1 rounded-full border border-slate-700 bg-slate-800 hover:border-amber-500/50 transition">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-amber-300">
                                            {user.name.charAt(0)}
                                        </div>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content contentClasses="bg-slate-900 border border-slate-800 text-slate-200 py-1 shadow-2xl">
                                    <div className="px-4 py-2 border-b border-slate-800 text-xs">
                                        <p className="font-semibold text-white">{user.name}</p>
                                        <p className="text-slate-400 truncate">{user.email}</p>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')} className="text-slate-300 hover:bg-slate-800 text-xs">
                                        Profile Settings
                                    </Dropdown.Link>
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="text-rose-400 hover:bg-rose-500/10 text-xs flex items-center"
                                    >
                                        <LogOut className="w-3.5 h-3.5 mr-2" /> Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>

                            {/* Mobile Hamburger */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-800 bg-slate-900/98 px-4 pt-2 pb-4 space-y-1">
                        <div className="px-3 py-2 text-xs text-slate-400 flex items-center justify-between border-b border-slate-800 mb-2">
                            <span>Business Date:</span>
                            <span className="font-mono text-amber-300 font-semibold">{businessDate}</span>
                        </div>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                                        item.active
                                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                            : 'text-slate-300 hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </header>

            {/* Flash Banners */}
            {flash?.success && !dismissFlash && (
                <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-xs font-medium flex items-center justify-between max-w-7xl mx-auto w-full mt-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                    <button onClick={() => setDismissFlash(true)} className="text-emerald-400/80 hover:text-emerald-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {flash?.error && !dismissFlash && (
                <div className="bg-rose-500/15 border-b border-rose-500/30 text-rose-300 px-4 py-2.5 text-xs font-medium flex items-center justify-between max-w-7xl mx-auto w-full mt-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <X className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                    <button onClick={() => setDismissFlash(true)} className="text-rose-400/80 hover:text-rose-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Optional Header Section */}
            {header && (
                <div className="bg-slate-900/60 border-b border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">{header}</div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
                    <span>&copy; {new Date().getFullYear()} Haula Technologies. Hotel & Lodge Management System (v1.0)</span>
                    <span className="text-[11px] text-slate-600 mt-1 sm:mt-0">Engineered for Eng. Cassidy &bull; Single-Codebase Multi-Tenant SaaS & LAN</span>
                </div>
            </footer>
        </div>
    );
}
