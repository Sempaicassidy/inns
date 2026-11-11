import {
    Activity,
    ArrowDownRight,
    ArrowRightLeft,
    ArrowUpRight,
    BarChart3,
    Bed,
    Bell,
    BellRing,
    BookOpen,
    Building2,
    Calendar,
    CheckCheck,
    CheckCircle2,
    CheckSquare,
    ClipboardList,
    Clock,
    Coins,
    CreditCard,
    Crown,
    DollarSign,
    FileCheck,
    FileCheck2,
    FileEdit,
    FileSpreadsheet,
    FileText,
    Globe,
    HelpCircle,
    Home,
    KeyRound,
    Landmark,
    Layers,
    ListOrdered,
    LogOut,
    MessageSquare,
    MessageSquareText,
    Moon,
    Package,
    Percent,
    Phone,
    PieChart,
    Plus,
    Receipt,
    RotateCcw,
    Scale,
    Send,
    Server,
    Settings,
    ShieldAlert,
    ShieldCheck,
    ShoppingBag,
    TrendingDown,
    TrendingUp,
    Truck,
    User,
    UserCheck,
    Users,
    Utensils,
    Wallet,
    Wrench,
} from 'lucide-react';

export const NAV_ICONS = {
    Activity,
    ArrowDownRight,
    ArrowRightLeft,
    ArrowUpRight,
    BarChart3,
    Bed,
    Bell,
    BellRing,
    BookOpen,
    Building2,
    Calendar,
    CheckCheck,
    CheckCircle2,
    CheckSquare,
    ClipboardList,
    Clock,
    Coins,
    CreditCard,
    Crown,
    DollarSign,
    FileCheck,
    FileCheck2,
    FileEdit,
    FileSpreadsheet,
    FileText,
    Globe,
    HelpCircle,
    Home,
    KeyRound,
    Landmark,
    Layers,
    ListOrdered,
    LogOut,
    MessageSquare,
    MessageSquareText,
    Moon,
    Package,
    Percent,
    Phone,
    PieChart,
    Plus,
    Receipt,
    RotateCcw,
    Scale,
    Send,
    Server,
    Settings,
    ShieldAlert,
    ShieldCheck,
    ShoppingBag,
    TrendingDown,
    TrendingUp,
    Truck,
    User,
    UserCheck,
    Users,
    Utensils,
    Wallet,
    Wrench,
} as const;

export type NavIconName = keyof typeof NAV_ICONS;

export interface NavItemDef {
    /** Display label. Optional on section headers (they use `title`). */
    name?: string;
    /** Laravel route name. Omit for logout buttons / pure groups. */
    route?: string;
    /** Route parameters passed to Ziggy's route() helper. */
    params?: Record<string, string>;
    icon: NavIconName;
    /** Tenant feature flag key (see Tenant::getFeaturesMap). */
    feature?: string;
    /**
     * Route patterns for the active state (route().current()).
     * `false` means never highlighted. Defaults to [route] when omitted.
     */
    active?: string[] | false;
    /**
     * When set, the item is only active while the `tab` query param
     * matches this value (used by the tabbed SaaS admin page).
     */
    tab?: string;
    isLogout?: boolean;
    /** Only visible when the user can access HR (manager-level). */
    hrOnly?: boolean;
    /** Only visible when the active workspace role is one of these slugs. */
    roles?: string[];
    /** Nested navigation (collapsible group). */
    items?: NavItemDef[];
    /** Section header marker — renders a titled group, not a link. */
    section?: string;
    title?: string;
}

export interface RoleNavigationDef {
    role: string;
    label: string;
    dashboard: string;
    navigation: NavItemDef[];
}

const saasTab = (tab: string) => ({ active: ['saas-admin.*'] as string[], tab });

export const roleNavigation: Record<string, RoleNavigationDef> = {
    super_admin: {
        role: 'super_admin',
        label: 'SaaS Super Admin',
        dashboard: 'saas-admin.index',
        navigation: [
            {
                name: 'Dashboard Overview',
                route: 'saas-admin.index',
                params: { tab: 'overview' },
                icon: 'Home',
                ...saasTab('overview'),
            },
            {
                section: 'tenant_management',
                title: 'TENANT MANAGEMENT',
                icon: 'Building2',
                items: [
                    { name: 'All Hotel Tenants', route: 'saas-admin.index', params: { tab: 'tenants' }, icon: 'Building2', ...saasTab('tenants') },
                    { name: 'Properties & Branches', route: 'branches.index', icon: 'Layers', active: ['branches.*'] },
                    { name: 'Onboard New Hotel', route: 'saas-admin.index', params: { tab: 'tenants', action: 'create' }, icon: 'Plus', active: false },
                ],
            },
            {
                section: 'subscription_management',
                title: 'SUBSCRIPTION MANAGEMENT',
                icon: 'CreditCard',
                items: [
                    { name: 'Active Subscriptions', route: 'saas-admin.index', params: { tab: 'subscriptions' }, icon: 'CreditCard', ...saasTab('subscriptions') },
                    { name: 'Pricing Plans & Tiers', route: 'saas-admin.index', params: { tab: 'plans' }, icon: 'DollarSign', ...saasTab('plans') },
                    { name: 'Billing & Invoices', route: 'saas-admin.index', params: { tab: 'billing' }, icon: 'Receipt', ...saasTab('billing') },
                ],
            },
            {
                section: 'sms_messaging',
                title: 'FINANCIAL SMS & MESSAGING',
                icon: 'MessageSquareText',
                items: [
                    { name: 'SMS Dashboard', route: 'saas-admin.index', params: { tab: 'sms' }, icon: 'MessageSquareText', ...saasTab('sms') },
                    { name: 'Tenant Wallets', route: 'saas-admin.index', params: { tab: 'sms_wallets' }, icon: 'Wallet', ...saasTab('sms_wallets') },
                    { name: 'Issue SMS Wallet', route: 'saas-admin.index', params: { tab: 'sms_issue' }, icon: 'Coins', ...saasTab('sms_issue') },
                    { name: 'SwalaSMS Provider Settings', route: 'saas-admin.index', params: { tab: 'sms_provider' }, icon: 'Settings', ...saasTab('sms_provider') },
                ],
            },
            {
                section: 'whatsapp_management',
                title: 'WHATSAPP MANAGEMENT',
                icon: 'Phone',
                items: [
                    { name: 'WhatsApp Gateway', route: 'whatsapp.index', icon: 'Phone', active: ['whatsapp.*'] },
                    { name: 'Notification Templates', route: 'saas-admin.index', params: { tab: 'whatsapp_templates' }, icon: 'MessageSquare', ...saasTab('whatsapp_templates') },
                    { name: 'Broadcast Logs', route: 'saas-admin.index', params: { tab: 'whatsapp_logs' }, icon: 'ClipboardList', ...saasTab('whatsapp_logs') },
                ],
            },
            {
                section: 'user_access',
                title: 'USER & ACCESS MANAGEMENT',
                icon: 'ShieldCheck',
                items: [
                    { name: 'Global SaaS Users', route: 'saas-admin.index', params: { tab: 'users' }, icon: 'Users', ...saasTab('users') },
                    { name: 'Roles & Permissions', route: 'saas-admin.index', params: { tab: 'roles' }, icon: 'ShieldCheck', ...saasTab('roles') },
                    { name: 'Staff Across Tenants', route: 'hr.index', icon: 'UserCheck', active: ['hr.*'] },
                ],
            },
            {
                section: 'website_cms',
                title: 'WEBSITE & CMS',
                icon: 'Globe',
                items: [
                    { name: 'Landing Page Content', route: 'saas-admin.index', params: { tab: 'cms_landing' }, icon: 'Globe', ...saasTab('cms_landing') },
                    { name: 'Pricing Plans Display', route: 'saas-admin.index', params: { tab: 'cms_pricing' }, icon: 'Percent', ...saasTab('cms_pricing') },
                    { name: 'Testimonials & FAQs', route: 'saas-admin.index', params: { tab: 'cms_faqs' }, icon: 'HelpCircle', ...saasTab('cms_faqs') },
                ],
            },
            {
                section: 'marketing',
                title: 'MARKETING',
                icon: 'TrendingUp',
                items: [
                    { name: 'Campaigns & Promos', route: 'saas-admin.index', params: { tab: 'marketing' }, icon: 'TrendingUp', ...saasTab('marketing') },
                    { name: 'Demo / Trial Inquiries', route: 'saas-admin.index', params: { tab: 'demos' }, icon: 'MessageSquare', ...saasTab('demos') },
                    { name: 'Conversion Tracking', route: 'saas-admin.index', params: { tab: 'funnel' }, icon: 'BarChart3', ...saasTab('funnel') },
                ],
            },
            {
                section: 'notices',
                title: 'NOTICES',
                icon: 'Bell',
                items: [
                    { name: 'Tenant Broadcasts', route: 'saas-admin.index', params: { tab: 'notices' }, icon: 'Bell', ...saasTab('notices') },
                    { name: 'System Alerts & Maintenance', route: 'saas-admin.index', params: { tab: 'system_alerts' }, icon: 'Clock', ...saasTab('system_alerts') },
                ],
            },
            {
                section: 'support',
                title: 'SUPPORT',
                icon: 'HelpCircle',
                items: [
                    { name: 'Support Tickets', route: 'saas-admin.index', params: { tab: 'support' }, icon: 'HelpCircle', ...saasTab('support') },
                    { name: 'Hotel Inquiries', route: 'saas-admin.index', params: { tab: 'inquiries' }, icon: 'MessageSquare', ...saasTab('inquiries') },
                ],
            },
            {
                section: 'integrations',
                title: 'INTEGRATIONS',
                icon: 'Layers',
                items: [
                    { name: 'SwalaSMS Gateway API', route: 'saas-admin.index', params: { tab: 'sms_provider' }, icon: 'MessageSquareText', ...saasTab('sms_provider') },
                    { name: 'Payment Gateways (DPO / M-Pesa)', route: 'saas-admin.index', params: { tab: 'gateways' }, icon: 'CreditCard', ...saasTab('gateways') },
                    { name: 'Accounting Integrations', route: 'accounting.index', icon: 'Scale', active: ['accounting.*'] },
                ],
            },
            {
                section: 'reports',
                title: 'REPORTS',
                icon: 'BarChart3',
                items: [
                    { name: 'Platform Revenue Analytics', route: 'saas-admin.index', params: { tab: 'reports' }, icon: 'BarChart3', ...saasTab('reports') },
                    { name: 'Tenant Growth & Churn', route: 'saas-admin.index', params: { tab: 'growth' }, icon: 'TrendingUp', ...saasTab('growth') },
                    { name: 'SMS Usage Reports', route: 'saas-admin.index', params: { tab: 'sms_reports' }, icon: 'PieChart', ...saasTab('sms_reports') },
                ],
            },
            {
                section: 'system_admin',
                title: 'SYSTEM ADMINISTRATION',
                icon: 'Settings',
                items: [
                    { name: 'System Health & Diagnostics', route: 'saas-admin.index', params: { tab: 'system' }, icon: 'Server', ...saasTab('system') },
                    { name: 'Database & Backups', route: 'saas-admin.index', params: { tab: 'backups' }, icon: 'Layers', ...saasTab('backups') },
                    { name: 'Cache & Optimization', route: 'saas-admin.index', params: { tab: 'cache' }, icon: 'RotateCcw', ...saasTab('cache') },
                    { name: 'My Account Settings', route: 'profile.edit', icon: 'User', active: ['profile.*'] },
                    { name: 'Sign Out', icon: 'LogOut', isLogout: true },
                ],
            },
        ],
    },

    owner: {
        role: 'owner',
        label: 'Hotel Owner / Director',
        dashboard: 'owner.index',
        navigation: [
            { name: 'Executive Dashboard', route: 'owner.index', params: { tab: 'overview' }, icon: 'Crown', active: ['owner.*'], tab: 'overview' },
            { name: 'Multi-Branch Matrix', route: 'owner.index', params: { tab: 'branches' }, icon: 'Building2', active: ['owner.*'], tab: 'branches' },
            { name: 'Approvals & Requisitions', route: 'owner.index', params: { tab: 'approvals' }, icon: 'CheckSquare', active: ['owner.*'], tab: 'approvals' },
            { name: 'Executive Directives', route: 'owner.index', params: { tab: 'directives' }, icon: 'Send', active: ['owner.*'], tab: 'directives' },
            { name: 'Loss Prevention & Audit', route: 'owner.index', params: { tab: 'audit' }, icon: 'ShieldAlert', active: ['owner.*'], tab: 'audit' },
            { name: 'Consolidated Financials', route: 'owner.index', params: { tab: 'financials' }, icon: 'DollarSign', active: ['owner.*'], tab: 'financials' },
            { name: 'Properties & Branches', route: 'branches.index', icon: 'Layers', active: ['branches.*'] },
            { name: 'Hotel Reports & Analytics', route: 'reports.index', icon: 'BarChart3', active: ['reports.*'], feature: 'hotel_reports' },
            { name: 'Night Audit Ledger', route: 'night-audit.index', icon: 'Moon', active: ['night-audit.*'] },
            { name: 'Branding & Profile', route: 'tenant.settings', icon: 'Settings', active: ['tenant.settings*'] },
            { name: 'Sign Out', icon: 'LogOut', isLogout: true },
        ],
    },

    accountant: {
        role: 'accountant',
        label: 'Accountant & Finance',
        dashboard: 'accounting.index',
        navigation: [
            { name: 'Dashboard', route: 'accounting.index', icon: 'Home', active: ['accounting.index'] },
            {
                section: 'financial_transactions',
                title: 'FINANCIAL TRANSACTIONS',
                icon: 'DollarSign',
                items: [
                    { name: 'Income Transactions', route: 'accounting.transactions', params: { type: 'income' }, icon: 'ArrowDownRight', active: ['accounting.transactions'] },
                    { name: 'Expense Transactions', route: 'accounting.transactions', params: { type: 'expense' }, icon: 'ArrowUpRight', active: ['accounting.transactions'] },
                    { name: 'Refunds & Reversals', route: 'accounting.refunds', icon: 'RotateCcw', active: ['accounting.refunds'] },
                    { name: 'Cashbook', route: 'accounting.cashbook', icon: 'BookOpen', active: ['accounting.cashbook'] },
                ],
            },
            {
                section: 'invoices_billing',
                title: 'INVOICES & BILLING',
                icon: 'Receipt',
                items: [
                    { name: 'Customer Invoices', route: 'accounting.invoices.customer', icon: 'FileText', active: ['accounting.invoices.customer'] },
                    { name: 'Supplier Invoices', route: 'accounting.invoices.supplier', icon: 'Truck', active: ['accounting.invoices.supplier'] },
                    { name: 'Credit Notes', route: 'accounting.credit-notes', icon: 'FileSpreadsheet', active: ['accounting.credit-notes'] },
                ],
            },
            {
                section: 'accounts',
                title: 'ACCOUNTS',
                icon: 'Wallet',
                items: [
                    { name: 'Accounts Receivable (AR)', route: 'accounting.ar', icon: 'TrendingUp', active: ['accounting.ar'] },
                    { name: 'Accounts Payable (AP)', route: 'accounting.ap', icon: 'TrendingDown', active: ['accounting.ap'] },
                    { name: 'Customer Balances', route: 'accounting.customer-balances', icon: 'Users', active: ['accounting.customer-balances'] },
                    { name: 'Supplier Balances', route: 'accounting.supplier-balances', icon: 'Building2', active: ['accounting.supplier-balances'] },
                ],
            },
            {
                section: 'general_ledger',
                title: 'GENERAL LEDGER',
                icon: 'Layers',
                items: [
                    { name: 'Chart of Accounts', route: 'accounting.chart-of-accounts', icon: 'ListOrdered', active: ['accounting.chart-of-accounts'] },
                    { name: 'Journal Entries', route: 'accounting.journals', icon: 'FileEdit', active: ['accounting.journals'] },
                    { name: 'Trial Balance', route: 'accounting.trial-balance', icon: 'Scale', active: ['accounting.trial-balance'] },
                    { name: 'Account Statements', route: 'accounting.statements', icon: 'FileCheck2', active: ['accounting.statements'] },
                ],
            },
            {
                section: 'banking_reconciliation',
                title: 'BANKING & RECONCILIATION',
                icon: 'Landmark',
                items: [
                    { name: 'Bank Accounts', route: 'accounting.bank-accounts', icon: 'Landmark', active: ['accounting.bank-accounts'] },
                    { name: 'Bank Transactions', route: 'accounting.bank-transactions', icon: 'CreditCard', active: ['accounting.bank-transactions'] },
                    { name: 'Bank Reconciliation', route: 'accounting.bank-reconciliation', icon: 'CheckCheck', active: ['accounting.bank-reconciliation'] },
                    { name: 'Cash Reconciliation', route: 'accounting.cash-reconciliation', icon: 'Coins', active: ['accounting.cash-reconciliation'] },
                ],
            },
            {
                section: 'financial_reports',
                title: 'FINANCIAL REPORTS',
                icon: 'BarChart3',
                items: [
                    { name: 'Income Statement / P&L', route: 'accounting.reports.pnl', icon: 'PieChart', active: ['accounting.reports.pnl'] },
                    { name: 'Balance Sheet', route: 'accounting.reports.balance-sheet', icon: 'Scale', active: ['accounting.reports.balance-sheet'] },
                    { name: 'Cash Flow Statement', route: 'accounting.reports.cash-flow', icon: 'ArrowRightLeft', active: ['accounting.reports.cash-flow'] },
                    { name: 'Revenue Reports', route: 'accounting.reports.revenue', icon: 'TrendingUp', active: ['accounting.reports.revenue'] },
                    { name: 'Expense Reports', route: 'accounting.reports.expenses', icon: 'TrendingDown', active: ['accounting.reports.expenses'] },
                    { name: 'Tax Reports', route: 'accounting.reports.tax', icon: 'Percent', active: ['accounting.reports.tax'] },
                ],
            },
            {
                section: 'approvals',
                title: 'APPROVALS',
                icon: 'ShieldCheck',
                items: [
                    { name: 'Pending Expense Approvals', route: 'accounting.approvals.expenses', icon: 'Clock', active: ['accounting.approvals.expenses'] },
                    { name: 'Pending Payments', route: 'accounting.approvals.payments', icon: 'DollarSign', active: ['accounting.approvals.payments'] },
                    { name: 'Pending Journal Approvals', route: 'accounting.approvals.journals', icon: 'FileCheck', active: ['accounting.approvals.journals'] },
                ],
            },
            {
                section: 'account_settings',
                title: 'ACCOUNT & SYSTEM',
                icon: 'Settings',
                items: [
                    { name: 'Notifications', route: 'notifications.index', icon: 'Bell', active: ['notifications.*'] },
                    { name: 'My Account', route: 'profile.edit', icon: 'User', active: ['profile.*'] },
                    { name: 'Sign Out', icon: 'LogOut', isLogout: true },
                ],
            },
        ],
    },

    receptionist: {
        role: 'receptionist',
        label: 'Front Desk Receptionist',
        dashboard: 'dashboard',
        navigation: [
            { name: 'Dashboard', route: 'dashboard', icon: 'Home', active: ['dashboard'] },
            {
                section: 'front_office',
                title: 'FRONT OFFICE',
                icon: 'Calendar',
                items: [
                    {
                        name: 'Reservations',
                        icon: 'Calendar',
                        feature: 'reservations',
                        active: ['reservations.*'],
                        items: [
                            { name: 'All Reservations', route: 'reservations.index', icon: 'ClipboardList', active: ['reservations.index'], feature: 'reservations' },
                            { name: 'New Booking', route: 'reservations.create', icon: 'Plus', active: ['reservations.create'], feature: 'reservations' },
                            { name: 'Check-in', route: 'reservations.checkin', icon: 'KeyRound', active: ['reservations.checkin'], feature: 'reservations' },
                            { name: 'Check-out', route: 'reservations.checkout', icon: 'LogOut', active: ['reservations.checkout'], feature: 'reservations' },
                        ],
                    },
                    {
                        name: 'Guests & Services',
                        icon: 'Users',
                        feature: 'guests',
                        active: ['guests.*', 'guest.*', 'folios.*'],
                        items: [
                            { name: 'Guest Directory', route: 'guests.index', icon: 'Users', active: ['guests.index'], feature: 'guests' },
                            { name: 'Guest Requests', route: 'guest.requests.index', icon: 'Phone', active: ['guest.requests.*'], feature: 'guests' },
                            { name: 'Super / Mini Market POS', route: 'grocery.pos', icon: 'ShoppingBag', active: ['grocery.*'], feature: 'grocery_pos' },
                            { name: 'Guest Communications', route: 'whatsapp.index', icon: 'MessageSquareText', active: ['whatsapp.*'], feature: 'whatsapp_sms', roles: ['receptionist', 'front_desk', 'front_office', 'front_office_manager'] },
                            { name: 'Guest Folios', route: 'folios.index', icon: 'FileText', active: ['folios.*'], feature: 'folios' },
                        ],
                    },
                ],
            },
            {
                section: 'reports_account',
                title: 'SHIFT REPORTS & ACCOUNT',
                icon: 'FileText',
                items: [
                    { name: 'Shift Progress Reports', route: 'front-office.reports.index', icon: 'FileText', active: ['front-office.reports.*'], feature: 'front_office_reports' },
                    { name: 'Notifications', route: 'notifications.index', icon: 'Bell', active: ['notifications.*'] },
                    { name: 'My Account', route: 'profile.edit', icon: 'User', active: ['profile.*'] },
                    { name: 'Sign Out', icon: 'LogOut', isLogout: true },
                ],
            },
        ],
    },

    pos: {
        role: 'pos',
        label: 'POS & Sales Staff',
        dashboard: 'pos.index',
        navigation: [
            { name: 'POS Terminal (Restaurant & Bar)', route: 'pos.index', icon: 'Utensils', active: ['pos.*'], feature: 'restaurant_pos' },
            { name: 'Super Market Dashboard', route: 'grocery.dashboard', icon: 'ShoppingBag', active: ['grocery.dashboard'], feature: 'grocery_pos' },
            { name: 'Super / Mini Market POS', route: 'grocery.pos', icon: 'ShoppingBag', active: ['grocery.pos'], feature: 'grocery_pos' },
            { name: 'Restaurant Orders & Menu', route: 'restaurant.index', icon: 'Utensils', active: ['restaurant.*'], feature: 'restaurant_pos' },
            { name: 'My Profile & Account', route: 'profile.edit', icon: 'Settings', active: ['profile.*'] },
            { name: 'Sign Out', icon: 'LogOut', isLogout: true },
        ],
    },

    housekeeper: {
        role: 'housekeeper',
        label: 'Housekeeping',
        dashboard: 'housekeeping.index',
        navigation: [
            { name: 'Rooms & Availability', route: 'housekeeping.index', icon: 'Bed', active: ['housekeeping.index'], feature: 'housekeeping' },
            { name: 'Housekeeping Status', route: 'housekeeping.status', icon: 'Activity', active: ['housekeeping.status'], feature: 'housekeeping' },
            { name: 'Maintenance Requests', route: 'maintenance.index', icon: 'Wrench', active: ['maintenance.*'], feature: 'maintenance' },
            { name: 'My Profile & Account', route: 'profile.edit', icon: 'Settings', active: ['profile.*'] },
            { name: 'Sign Out', icon: 'LogOut', isLogout: true },
        ],
    },

    security: {
        role: 'security',
        label: 'Security',
        dashboard: 'security.ob.index',
        navigation: [
            { name: 'Occurrence Book (O.B.)', route: 'security.ob.index', icon: 'ShieldAlert', active: ['security.ob.*'] },
            { name: 'My Profile & Account', route: 'profile.edit', icon: 'Settings', active: ['profile.*'] },
            { name: 'Sign Out', icon: 'LogOut', isLogout: true },
        ],
    },

    manager: {
        role: 'manager',
        label: 'General Manager',
        dashboard: 'dashboard',
        navigation: [
            { name: 'Dashboard', route: 'dashboard', icon: 'Home', active: ['dashboard'] },
            { name: 'Calendar View', route: 'calendar.index', icon: 'Calendar', active: ['calendar.*'], feature: 'calendar' },
            { name: 'Reservations', route: 'reservations.index', icon: 'Calendar', active: ['reservations.*'], feature: 'reservations' },
            {
                name: 'Room Management',
                icon: 'Bed',
                feature: 'housekeeping',
                active: ['housekeeping.*', 'maintenance.*'],
                items: [
                    { name: 'Rooms & Availability', route: 'housekeeping.index', icon: 'Bed', active: ['housekeeping.index'], feature: 'housekeeping' },
                    { name: 'Housekeeping Status', route: 'housekeeping.status', icon: 'Activity', active: ['housekeeping.status'], feature: 'housekeeping' },
                    { name: 'Maintenance Requests', route: 'maintenance.index', icon: 'Wrench', active: ['maintenance.*'], feature: 'maintenance' },
                ],
            },
            { name: 'Hotel Report', route: 'reports.index', icon: 'BarChart3', active: ['reports.*'], feature: 'hotel_reports' },
            { name: 'Front Office Shift Reports', route: 'front-office.reports.index', icon: 'FileText', active: ['front-office.reports.*'], feature: 'front_office_reports' },
            { name: 'Manager Alerts (SMS/WhatsApp)', route: 'manager.notifications.index', icon: 'BellRing', active: ['manager.notifications.*'], feature: 'manager_alerts' },
            { name: 'POS Restaurant Report', route: 'restaurant.index', icon: 'Utensils', active: ['restaurant.*'], feature: 'restaurant_pos' },
            { name: 'Super / Mini Market POS', route: 'grocery.pos', icon: 'ShoppingBag', active: ['grocery.*'], feature: 'grocery_pos' },
            { name: 'Store Report', route: 'inventory.index', icon: 'Package', active: ['inventory.*'], feature: 'inventory' },
            { name: 'Staff & HR System', route: 'hr.index', icon: 'UserCheck', active: ['hr.*'], feature: 'hr_payroll', hrOnly: true },
            { name: 'Accounting & Reports', route: 'accounting.index', icon: 'DollarSign', active: ['accounting.*'], feature: 'accounting' },
            { name: 'Notifications', route: 'whatsapp.index', icon: 'MessageSquare', active: ['whatsapp.*'], feature: 'whatsapp_sms' },
            { name: 'Hotel & Receipt Branding', route: 'tenant.settings', icon: 'Building2', active: ['tenant.settings*'], feature: 'branding_settings' },
            { name: 'CSV Data Entry Hub', route: 'data-entry.index', icon: 'FileSpreadsheet', active: ['data-entry.*'], feature: 'data_entry_hub' },
            { name: 'Settings', route: 'profile.edit', icon: 'Settings', active: ['profile.*'] },
            { name: 'Sign Out', icon: 'LogOut', isLogout: true },
        ],
    },

    storekeeper: {
        role: 'storekeeper',
        label: 'Store / Inventory Keeper',
        dashboard: 'inventory.index',
        navigation: [
            { name: 'Dashboard', route: 'dashboard', icon: 'Home', active: ['dashboard'] },
            { name: 'Central Store & Stock', route: 'inventory.index', icon: 'Package', active: ['inventory.*'], feature: 'inventory' },
            { name: 'Super Market Dashboard', route: 'grocery.dashboard', icon: 'ShoppingBag', active: ['grocery.dashboard'], feature: 'grocery_pos' },
            { name: 'Super / Mini Market POS', route: 'grocery.pos', icon: 'ShoppingBag', active: ['grocery.pos'], feature: 'grocery_pos' },
            { name: 'My Profile & Account', route: 'profile.edit', icon: 'Settings', active: ['profile.*'] },
            { name: 'Sign Out', icon: 'LogOut', isLogout: true },
        ],
    },

    hr: {
        role: 'hr',
        label: 'HR Manager',
        dashboard: 'dashboard',
        navigation: [
            { name: 'Dashboard', route: 'dashboard', icon: 'Home', active: ['dashboard'] },
            { name: 'Staff & HR System', route: 'hr.index', icon: 'UserCheck', active: ['hr.*'], feature: 'hr_payroll', hrOnly: true },
            { name: 'Notifications', route: 'notifications.index', icon: 'Bell', active: ['notifications.*'] },
            { name: 'My Account', route: 'profile.edit', icon: 'User', active: ['profile.*'] },
            { name: 'Sign Out', icon: 'LogOut', isLogout: true },
        ],
    },

    auditor: {
        role: 'auditor',
        label: 'Night Auditor',
        dashboard: 'night-audit.index',
        navigation: [
            { name: 'Night Audit', route: 'night-audit.index', icon: 'Moon', active: ['night-audit.*'] },
            { name: 'Hotel Reports', route: 'reports.index', icon: 'BarChart3', active: ['reports.*'], feature: 'hotel_reports' },
            { name: 'Notifications', route: 'notifications.index', icon: 'Bell', active: ['notifications.*'] },
            { name: 'My Account', route: 'profile.edit', icon: 'User', active: ['profile.*'] },
            { name: 'Sign Out', icon: 'LogOut', isLogout: true },
        ],
    },

    /**
     * Safe fallback for custom / unrecognized roles.
     * Custom roles never inherit the manager navigation implicitly.
     */
    staff: {
        role: 'staff',
        label: 'Staff',
        dashboard: 'dashboard',
        navigation: [
            { name: 'Dashboard', route: 'dashboard', icon: 'Home', active: ['dashboard'] },
            { name: 'Notifications', route: 'notifications.index', icon: 'Bell', active: ['notifications.*'] },
            { name: 'My Account', route: 'profile.edit', icon: 'User', active: ['profile.*'] },
            { name: 'Sign Out', icon: 'LogOut', isLogout: true },
        ],
    },
};

/** Maps a concrete user role slug to its navigation workspace key. */
export const ROLE_NAV_KEY_MAP: Record<string, string> = {
    super_admin: 'super_admin',
    owner: 'owner',
    general_manager: 'manager',
    manager: 'manager',
    admin: 'manager',
    hr_manager: 'hr',
    procurement_manager: 'storekeeper',
    accountant: 'accountant',
    senior_accountant: 'accountant',
    finance_officer: 'accountant',
    auditor: 'accountant',
    receptionist: 'receptionist',
    front_desk: 'receptionist',
    front_office: 'receptionist',
    front_office_manager: 'receptionist',
    staff: 'receptionist',
    pos_cashier: 'pos',
    cashier: 'pos',
    waiter: 'pos',
    bartender: 'pos',
    chef: 'pos',
    restaurant_cashier: 'pos',
    restaurant_staff: 'pos',
    restaurant_pos: 'pos',
    grocery_cashier: 'pos',
    supermarket_cashier: 'pos',
    storekeeper: 'storekeeper',
    housekeeper: 'housekeeper',
    housekeeping_supervisor: 'housekeeper',
    night_auditor: 'auditor',
    security_officer: 'security',
    security_guard: 'security',
    security: 'security',
};

export function getRoleNavigation(role?: string | null): RoleNavigationDef {
    const key = (role && ROLE_NAV_KEY_MAP[role]) || 'staff';
    return roleNavigation[key] ?? roleNavigation.staff;
}
