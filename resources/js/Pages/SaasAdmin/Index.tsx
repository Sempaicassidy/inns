import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Bed,
    Bell,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Coins,
    Copy,
    CreditCard,
    DollarSign,
    ExternalLink,
    Eye,
    FileCheck,
    FileSpreadsheet,
    FileText,
    Globe,
    HelpCircle,
    Home,
    Inbox,
    Layers,
    Lock,
    LogOut,
    Mail,
    MessageSquare,
    MessageSquareText,
    MoreVertical,
    Package,
    Percent,
    Phone,
    PieChart,
    Plus,
    Power,
    Receipt,
    RefreshCw,
    RotateCcw,
    Scale,
    Search,
    Send,
    Server,
    Settings,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Trash2,
    TrendingDown,
    TrendingUp,
    Truck,
    User,
    UserCheck,
    Users,
    Utensils,
    Wallet,
    Wrench,
    X,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface TenantItem {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    plan: string;
    plan_name: string;
    max_branches: number;
    properties_count: number;
    users_count: number;
    subscription_price: number;
    subscription_status: string;
    license_expiry: string;
    is_active: boolean;
    created_at: string;
    sms_balance: number;
    sms_wallet_status: string;
    properties: Array<{
        id: string;
        name: string;
        code: string;
        city: string;
        is_main: boolean;
    }>;
}

interface PlanItem {
    id: string;
    name: string;
    code: string;
    badge: string;
    price_tzs: number;
    annual_price_tzs: number;
    max_branches: number;
    max_rooms: string | number;
    active_count: number;
    features: string[];
    is_active: boolean;
}

interface SubscriptionItem {
    id: string;
    tenant_id: string;
    tenant_name: string;
    plan_code: string;
    plan_name: string;
    billing_cycle: string;
    amount_tzs: number;
    status: string;
    starts_at: string;
    expires_at: string;
    next_billing_at: string;
    grace_period_ends_at: string;
}

interface QuotationItem {
    id: string;
    quotation_number: string;
    tenant_id: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    company_name: string;
    plan_code: string;
    total_tzs: number;
    status: string;
    valid_until: string;
    created_at: string;
    items: Array<{
        description: string;
        quantity: number;
        unit_price_tzs: number;
        total_tzs: number;
    }>;
}

interface InvoiceItem {
    id: string;
    invoice_number: string;
    tenant_id: string;
    tenant_name: string;
    customer_name: string;
    billing_reason: string;
    total_tzs: number;
    paid_amount_tzs: number;
    balance_tzs: number;
    status: string;
    issue_date: string;
    due_date: string;
    paid_at: string | null;
    items: Array<{
        description: string;
        quantity: number;
        total_tzs: number;
    }>;
}

interface PaymentItem {
    id: string;
    payment_reference: string;
    tenant_id: string;
    tenant_name: string;
    invoice_number: string;
    amount_tzs: number;
    payment_method: string;
    gateway_transaction_id: string;
    status: string;
    verified_at: string | null;
    paid_at: string;
}

interface ReceiptItem {
    id: string;
    receipt_number: string;
    tenant_name: string;
    invoice_number: string;
    amount_tzs: number;
    payment_method: string;
    payment_reference: string;
    issued_at: string;
}

interface ContractItem {
    id: string;
    contract_number: string;
    tenant_id: string;
    tenant_name: string;
    title: string;
    category: string;
    status: string;
    document_hash: string;
    signer_name: string;
    signer_title: string;
    signed_at: string | null;
    signer_ip: string;
    valid_from: string;
    valid_until: string;
    rendered_content: string;
    audit_logs: Array<{
        action: string;
        actor: string;
        ip: string;
        time: string;
    }>;
}

interface SaasAdminProps extends PageProps {
    kpis: {
        total_tenants: number;
        active_subscriptions: number;
        trial_tenants: number;
        suspended_tenants: number;
        monthly_revenue: number;
        sms_balance: number;
        demo_requests: number;
    };
    tenants: TenantItem[];
    plans: PlanItem[];
    subscriptions: SubscriptionItem[];
    quotations: QuotationItem[];
    invoices: InvoiceItem[];
    payments: PaymentItem[];
    receipts: ReceiptItem[];
    contracts: ContractItem[];
    contract_templates: Array<{
        id: string;
        name: string;
        category: string;
        description: string;
        version: string;
        content: string;
    }>;
    sms_wallets: Array<{
        id: string;
        tenant_id: string;
        tenant_name: string;
        balance: number;
        total_credited: number;
        total_used: number;
        status: string;
        last_issued_at: string;
    }>;
    sms_issues: Array<{
        id: string;
        tenant_name: string;
        credits: number;
        amount: number;
        reference: string;
        method: string;
        date: string;
    }>;
    sms_packages: Array<{
        id: string;
        name: string;
        credits_count: number;
        selling_price_minor: number;
        is_popular: boolean;
        is_active: boolean;
    }>;
    sms_transactions: Array<{
        id: string;
        reference: string;
        tenant_name: string;
        type: string;
        credits: number;
        balance_after: number;
        description: string;
        time: string;
    }>;
    sms_provider: {
        name: string;
        sender_id: string;
        balance: number;
        is_active: boolean;
        base_url: string;
        username: string;
    } | null;
    whatsapp_settings: {
        phone_number_id: string;
        business_account_id: string;
        is_active: boolean;
        sender_phone_number: string;
    } | null;
    whatsapp_logs: Array<{
        id: string;
        recipient_phone: string;
        recipient_name: string;
        message_type: string;
        message_body: string;
        status: string;
        time: string;
    }>;
    notices: Array<{
        id: string;
        title: string;
        message: string;
        target: string;
        priority: string;
        created_at: string;
    }>;
    system_health: {
        uptime: string;
        server_cluster: string;
        php_version: string;
        laravel_version: string;
        database_status: string;
        database_name: string;
        cache_driver: string;
        queue_status: string;
        last_backup: string;
        storage_used: string;
        total_rooms: number;
        total_users: number;
        total_invoices: number;
        total_contracts: number;
        total_notifications: number;
    };
    global_users?: Array<any>;
    roles_matrix?: Array<any>;
    demo_requests?: Array<any>;
    cms_content?: any;
    marketing_data?: any;
    conversion_funnel?: any;
    support_tickets?: Array<any>;
}

export default function SaasAdminDashboard({
    kpis,
    tenants,
    plans,
    subscriptions,
    quotations,
    invoices,
    payments,
    receipts,
    contracts,
    contract_templates,
    sms_wallets,
    sms_issues,
    sms_packages,
    sms_transactions,
    sms_provider,
    whatsapp_settings,
    whatsapp_logs,
    notices,
    system_health,
    global_users = [],
    roles_matrix = [],
    demo_requests = [],
    cms_content,
    marketing_data,
    conversion_funnel,
    support_tickets = [],
}: SaasAdminProps) {
    // Current Active Tab
    const [activeTab, setActiveTab] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab === 'sms_wallets') return 'sms';
            if (tab === 'plans') return 'subscriptions';
            return tab || 'overview';
        }
        return 'overview';
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState('all');

    // Sub-switchers for multi-view tabs
    const [userSubTab, setUserSubTab] = useState<'users' | 'roles'>(() => activeTab === 'roles' ? 'roles' : 'users');
    const [cmsSubTab, setCmsSubTab] = useState<'landing' | 'pricing' | 'faqs'>(() => {
        if (activeTab === 'cms_pricing') return 'pricing';
        if (activeTab === 'cms_faqs') return 'faqs';
        return 'landing';
    });
    const [marketingSubTab, setMarketingSubTab] = useState<'promos' | 'demos' | 'funnel'>(() => {
        if (activeTab === 'demos') return 'demos';
        if (activeTab === 'funnel') return 'funnel';
        return 'promos';
    });
    const [noticesSubTab, setNoticesSubTab] = useState<'broadcasts' | 'alerts'>(() => activeTab === 'system_alerts' ? 'alerts' : 'broadcasts');

    React.useEffect(() => {
        if (activeTab === 'roles') setUserSubTab('roles');
        if (activeTab === 'users') setUserSubTab('users');
        if (activeTab === 'cms_landing') setCmsSubTab('landing');
        if (activeTab === 'cms_pricing') setCmsSubTab('pricing');
        if (activeTab === 'cms_faqs') setCmsSubTab('faqs');
        if (activeTab === 'marketing') setMarketingSubTab('promos');
        if (activeTab === 'demos') setMarketingSubTab('demos');
        if (activeTab === 'funnel') setMarketingSubTab('funnel');
        if (activeTab === 'notices') setNoticesSubTab('broadcasts');
        if (activeTab === 'system_alerts') setNoticesSubTab('alerts');
    }, [activeTab]);

    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedUserRole, setSelectedUserRole] = useState('all');
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showCreatePromoModal, setShowCreatePromoModal] = useState(false);
    const [showReplyTicketModal, setShowReplyTicketModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);

    const createUserForm = useForm({
        name: '',
        email: '',
        role: 'general_manager',
        tenant_id: '',
        password: 'password123',
    });

    const promoForm = useForm({
        code: '',
        discount_percent: 15,
        applies_to: 'All Plans',
        max_uses: 50,
        expires_at: '2026-12-31',
    });

    const liveCmsForm = useForm({
        hero_title: cms_content?.hero_title || 'Mfumo Kamilifu wa Kisasa wa Kusimamia Mahoteli, Lodges & Restaurants',
        hero_subtitle: cms_content?.hero_subtitle || 'Dhibiti vyumba, mapokezi, mikataba ya kisheria, ankara na risiti za malipo, POS ya mgahawa, na ripoti za mapato kidijitali katika mfumo mmoja unaoaminika.',
        hero_cta_text: cms_content?.hero_cta_text || 'Anza Jaribio la Siku 14 Bure',
        demo_cta_text: cms_content?.demo_cta_text || 'Omba Kuona Demo ya Mfumo',
    });

    const replyTicketForm = useForm({
        ticket_id: '',
        resolution_note: '',
    });

    // Modals visibility
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [showEditTenantModal, setShowEditTenantModal] = useState(false);
    const [selectedTenantToEdit, setSelectedTenantToEdit] = useState<TenantItem | null>(null);

    const [showIssueSmsModal, setShowIssueSmsModal] = useState(false);
    const [selectedTenantForSms, setSelectedTenantForSms] = useState<string>('');

    const [showSmsConfigModal, setShowSmsConfigModal] = useState(false);
    const [showTestSmsModal, setShowTestSmsModal] = useState(false);

    const [showWhatsAppConfigModal, setShowWhatsAppConfigModal] = useState(false);
    const [showTestWhatsAppModal, setShowTestWhatsAppModal] = useState(false);

    const [showCreateQuotationModal, setShowCreateQuotationModal] = useState(false);
    const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
    const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceItem | null>(null);

    const [showCreateContractModal, setShowCreateContractModal] = useState(false);
    const [showViewContractModal, setShowViewContractModal] = useState(false);
    const [selectedContractToView, setSelectedContractToView] = useState<ContractItem | null>(null);

    const [showNoticeModal, setShowNoticeModal] = useState(false);

    // Forms
    const onboardForm = useForm({
        name: '',
        subdomain: '',
        plan: 'pro',
        property_name: '',
        city: '',
        admin_name: '',
        admin_email: '',
        admin_password: 'password123',
    });

    const editTenantForm = useForm({
        name: '',
        plan: 'pro',
        max_branches: 1,
        subscription_price: 350000,
        license_expiry: '',
        is_active: true,
    });

    const smsForm = useForm({
        tenant_id: '',
        credits: 1000,
        amount_paid: 20000,
        payment_reference: '',
        payment_method: 'bank',
        notes: '',
    });

    const smsConfigForm = useForm({
        sender_id: sms_provider?.sender_id || 'SWALATECH',
        base_url: sms_provider?.base_url || 'https://api.swalasms.com',
        username: sms_provider?.username || 'SwalaSMS',
        password: '',
        api_token: '',
        is_active: sms_provider?.is_active ?? true,
    });

    const testSmsForm = useForm({
        phone: '+255779646632',
        message: 'Habari! Ujumbe huu unathibitisha kuwa SwalaSMS Gateway inafanya kazi kikamilifu ndani ya THE INNS.',
    });

    const waConfigForm = useForm({
        phone_number_id: whatsapp_settings?.phone_number_id || '',
        business_account_id: whatsapp_settings?.business_account_id || '',
        access_token: '',
        sender_phone_number: whatsapp_settings?.sender_phone_number || '',
        is_active: whatsapp_settings?.is_active ?? true,
    });

    const testWaForm = useForm({
        recipient_phone: '+255754000000',
        recipient_name: 'Meneja wa Hoteli',
        message: 'Habari! Ujumbe huu ni uthibitisho rasmi wa WhatsApp Cloud Business API gateway inayofanya kazi kwenye THE INNS.',
    });

    const quotationForm = useForm({
        tenant_id: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        company_name: '',
        plan_code: 'pro',
        amount: 350000,
        valid_until: '',
        description: 'Monthly SaaS PMS Software License & Cloud Support',
    });

    const invoiceForm = useForm({
        tenant_id: tenants[0]?.id || '',
        description: 'Monthly Cloud PMS Subscription',
        amount: 350000,
        billing_reason: 'renewal',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: 'Payable via Bank Transfer or M-Pesa within 7 days.',
    });

    const paymentForm = useForm({
        invoice_id: '',
        amount: 0,
        payment_method: 'bank_transfer',
        external_transaction_id: '',
        notes: 'Payment confirmed by Super Admin',
    });

    const contractForm = useForm({
        tenant_id: tenants[0]?.id || '',
        template_id: contract_templates[0]?.id || '',
        plan_name: 'Hotel & Safari Pro',
        monthly_fee: 'TZS 350,000',
        billing_cycle: 'Monthly',
    });

    const signContractForm = useForm({
        signer_name: 'SaaS Super Admin',
        signer_title: 'Chief Technology Director',
        signer_email: 'superadmin@inns.com',
    });

    const noticeForm = useForm({
        title: '',
        message: '',
        target_tenant_id: 'all',
    });

    const handleSwitchTab = (tab: string) => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url.toString());
    };

    // Tenant Actions
    const handleToggleTenant = (tenantId: string) => {
        if (confirm('Je, una uhakika unataka kusimamisha au kuwezesha hoteli hii?')) {
            router.post(route('saas-admin.tenants.toggle', tenantId), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleImpersonate = (tenantId: string, tenantName: string) => {
        if (confirm(`Unataka kuingia kwenye workspace ya hoteli ya "${tenantName}" kama General Manager?`)) {
            router.post(route('saas-admin.tenants.impersonate', tenantId));
        }
    };

    const handleOpenEditTenant = (tenant: TenantItem) => {
        setSelectedTenantToEdit(tenant);
        editTenantForm.setData({
            name: tenant.name,
            plan: tenant.plan,
            max_branches: tenant.max_branches,
            subscription_price: tenant.subscription_price,
            license_expiry: tenant.license_expiry !== 'Lifetime' ? tenant.license_expiry : '',
            is_active: tenant.is_active,
        });
        setShowEditTenantModal(true);
    };

    const submitEditTenant = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantToEdit) return;
        editTenantForm.put(route('saas-admin.tenants.update', selectedTenantToEdit.id), {
            onSuccess: () => setShowEditTenantModal(false),
        });
    };

    const handleOpenIssueSms = (tenantId: string) => {
        setSelectedTenantForSms(tenantId);
        smsForm.setData('tenant_id', tenantId);
        setShowIssueSmsModal(true);
    };

    const submitOnboard = (e: React.FormEvent) => {
        e.preventDefault();
        onboardForm.post(route('saas-admin.tenants.store'), {
            onSuccess: () => {
                setShowOnboardModal(false);
                onboardForm.reset();
            },
        });
    };

    const submitIssueSms = (e: React.FormEvent) => {
        e.preventDefault();
        smsForm.post(route('saas-admin.sms.issue'), {
            onSuccess: () => {
                setShowIssueSmsModal(false);
                smsForm.reset();
            },
        });
    };

    const submitSmsConfig = (e: React.FormEvent) => {
        e.preventDefault();
        smsConfigForm.post(route('saas-admin.sms.provider.update'), {
            onSuccess: () => setShowSmsConfigModal(false),
        });
    };

    const submitTestSms = (e: React.FormEvent) => {
        e.preventDefault();
        testSmsForm.post(route('saas-admin.sms.test'), {
            onSuccess: () => setShowTestSmsModal(false),
        });
    };

    const submitWhatsAppConfig = (e: React.FormEvent) => {
        e.preventDefault();
        waConfigForm.post(route('saas-admin.whatsapp.settings.update'), {
            onSuccess: () => setShowWhatsAppConfigModal(false),
        });
    };

    const submitTestWhatsApp = (e: React.FormEvent) => {
        e.preventDefault();
        testWaForm.post(route('saas-admin.whatsapp.test'), {
            onSuccess: () => setShowTestWhatsAppModal(false),
        });
    };

    const submitQuotation = (e: React.FormEvent) => {
        e.preventDefault();
        quotationForm.post(route('saas-admin.quotations.store'), {
            onSuccess: () => {
                setShowCreateQuotationModal(false);
                quotationForm.reset();
            },
        });
    };

    const handleConvertQuotation = (quoteId: string) => {
        if (confirm('Je, unataka kubadilisha Quotation hii kuwa Invoice rasmi?')) {
            router.post(route('saas-admin.quotations.convert', quoteId));
        }
    };

    const submitInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        invoiceForm.post(route('saas-admin.invoices.store'), {
            onSuccess: () => {
                setShowCreateInvoiceModal(false);
                invoiceForm.reset();
            },
        });
    };

    const handleOpenRecordPayment = (inv: InvoiceItem) => {
        setSelectedInvoiceForPayment(inv);
        paymentForm.setData({
            invoice_id: inv.id,
            amount: inv.balance_tzs,
            payment_method: 'bank_transfer',
            external_transaction_id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            notes: `Payment for invoice ${inv.invoice_number}`,
        });
        setShowRecordPaymentModal(true);
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        paymentForm.post(route('saas-admin.payments.store'), {
            onSuccess: () => setShowRecordPaymentModal(false),
        });
    };

    const handleVerifyPayment = (paymentId: string) => {
        if (confirm('Thibitisha malipo haya ili mfumo utoe Risiti rasmi na kurefusha subscription ya hoteli?')) {
            router.post(route('saas-admin.payments.verify', paymentId));
        }
    };

    const submitContract = (e: React.FormEvent) => {
        e.preventDefault();
        contractForm.post(route('saas-admin.contracts.store'), {
            onSuccess: () => setShowCreateContractModal(false),
        });
    };

    const handleOpenViewContract = (contract: ContractItem) => {
        setSelectedContractToView(contract);
        setShowViewContractModal(true);
    };

    const submitSignContract = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContractToView) return;
        signContractForm.post(route('saas-admin.contracts.sign', selectedContractToView.id), {
            onSuccess: () => setShowViewContractModal(false),
        });
    };

    const submitNotice = (e: React.FormEvent) => {
        e.preventDefault();
        noticeForm.post(route('saas-admin.notices.broadcast'), {
            onSuccess: () => {
                setShowNoticeModal(false);
                noticeForm.reset();
            },
        });
    };

    const handleClearCache = () => {
        if (confirm('Je, unataka kusafisha cache zote za mfumo (Config, Routes, Views, Cache)?')) {
            router.post(route('saas-admin.system.clear-cache'));
        }
    };

    const submitCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createUserForm.post(route('saas-admin.users.store'), {
            onSuccess: () => {
                setShowCreateUserModal(false);
                createUserForm.reset();
            },
        });
    };

    const handleToggleUserStatus = (userId: number, userName: string) => {
        if (confirm(`Badili hali ya akaunti ya mtumiaji "${userName}"?`)) {
            router.post(route('saas-admin.users.toggle', userId), {}, { preserveScroll: true });
        }
    };

    const submitPromo = (e: React.FormEvent) => {
        e.preventDefault();
        promoForm.post(route('saas-admin.marketing.promos.store'), {
            onSuccess: () => {
                setShowCreatePromoModal(false);
                promoForm.reset();
            },
        });
    };

    const submitCmsUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        liveCmsForm.post(route('saas-admin.cms.update'), {
            preserveScroll: true,
        });
    };

    const submitReplyTicket = (e: React.FormEvent) => {
        e.preventDefault();
        replyTicketForm.post(route('saas-admin.support.resolve'), {
            onSuccess: () => {
                setShowReplyTicketModal(false);
                replyTicketForm.reset();
            },
        });
    };

    const handleConvertLeadToQuote = (lead: any) => {
        quotationForm.setData({
            customer_name: lead.contact_name,
            customer_email: lead.email,
            customer_phone: lead.phone,
            company_name: lead.hotel_name,
            plan_code: lead.requested_plan.toLowerCase().includes('enterprise') ? 'enterprise' : (lead.requested_plan.toLowerCase().includes('starter') ? 'starter' : 'pro'),
            amount: 350000,
            description: `THE INNS Hotel PMS Subscription for ${lead.hotel_name} (${lead.rooms_count} Rooms)`,
            tenant_id: '',
            valid_until: '',
        });
        setShowCreateQuotationModal(true);
    };

    const filteredGlobalUsers = global_users.filter((u) => {
        const matchesTerm =
            u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            u.tenant_name.toLowerCase().includes(userSearchTerm.toLowerCase());
        const matchesRole = selectedUserRole === 'all' || u.role === selectedUserRole;
        return matchesTerm && matchesRole;
    });

    // Filter tenants
    const filteredTenants = tenants.filter((t) => {
        const matchesSearch =
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.properties.some((p) => p.city.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPlan = planFilter === 'all' || t.plan === planFilter;
        return matchesSearch && matchesPlan;
    });

    return (
        <AuthenticatedLayout>
            <Head title="THE INNS — Super Admin Centralized SaaS Ecosystem" />

            <div className="space-y-6 pb-20">
                {/* 1. TOP HEADER & SYSTEM BANNER */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-96 h-96 bg-blue-500/10 blur-[90px] rounded-full pointer-events-none" />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="bg-blue-500/20 text-blue-300 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider border border-blue-400/30 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                                    Platform Master Authority
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    All Nodes Operational (99.98% SLA)
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                                <span>THE INNS Centralized SaaS Ecosystem</span>
                            </h1>
                            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                                Usimamizi kamili: Mahoteli, Mikataba ya Kisheria (E-Signatures), Bili & Risiti, SwalaSMS Tanzania, WhatsApp Cloud API, na Miundombinu.
                            </p>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setShowOnboardModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Onboard Hotel</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedTenantForSms(tenants[0]?.id || '');
                                    smsForm.setData('tenant_id', tenants[0]?.id || '');
                                    setShowIssueSmsModal(true);
                                }}
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/20 transition cursor-pointer"
                            >
                                <Coins className="w-4 h-4 text-amber-400" />
                                <span>Issue SMS</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateInvoiceModal(true)}
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/20 transition cursor-pointer"
                            >
                                <Receipt className="w-4 h-4 text-emerald-300" />
                                <span>New Invoice</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowNoticeModal(true)}
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/20 transition cursor-pointer"
                            >
                                <Bell className="w-4 h-4 text-indigo-300" />
                                <span>Broadcast</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. JUU KABISA: CORE DASHBOARD OVERVIEW KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Card 1: Total Tenants */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tenants</span>
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Building2 className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900">{kpis.total_tenants}</span>
                            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Active
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                            <span>Hotels & Lodges</span>
                            <span className="font-semibold text-slate-700">{tenants.reduce((acc, t) => acc + t.properties_count, 0)} Branches</span>
                        </p>
                    </div>

                    {/* Card 2: Active Subscriptions */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Subscriptions</span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CreditCard className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900">{kpis.active_subscriptions}</span>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {Math.round((kpis.active_subscriptions / (kpis.total_tenants || 1)) * 100)}% Current
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                            <span className="text-amber-600 font-semibold">{kpis.trial_tenants} In Trial</span>
                            <span className="text-rose-500 font-semibold">{kpis.suspended_tenants} Suspended</span>
                        </p>
                    </div>

                    {/* Card 3: Monthly Revenue */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Revenue</span>
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-lg sm:text-xl font-black text-slate-900 truncate">
                                TZS {new Intl.NumberFormat('en-TZ').format(Math.round(kpis.monthly_revenue))}
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                            <span>SaaS + SMS Add-ons</span>
                            <span className="text-emerald-600 font-bold flex items-center">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Verified MRR
                            </span>
                        </p>
                    </div>

                    {/* Card 4: SMS Master Balance */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMS Master Balance</span>
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <MessageSquareText className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900">
                                {new Intl.NumberFormat('en-TZ').format(kpis.sms_balance)}
                            </span>
                            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                SwalaSMS
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                            <span>Central Gateway</span>
                            <button
                                type="button"
                                onClick={() => setShowTestSmsModal(true)}
                                className="text-blue-600 hover:underline font-bold text-[11px]"
                            >
                                Test Send
                            </button>
                        </p>
                    </div>

                    {/* Card 5: Legal & Contracts */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Legal Contracts</span>
                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <FileCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900">{contracts.length}</span>
                            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                Signed
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                            <span>E-Sign SHA-256</span>
                            <button
                                type="button"
                                onClick={() => handleSwitchTab('contracts')}
                                className="text-blue-600 hover:underline font-bold text-xs"
                            >
                                View all
                            </button>
                        </p>
                    </div>
                </div>

                {/* 3. SUB-NAVIGATION TABS */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-2xs overflow-x-auto">
                    <div className="flex items-center gap-1 min-w-max">
                        {[
                            { key: 'overview', label: 'Dashboard Overview', icon: Home },
                            { key: 'tenants', label: 'Tenant Management', icon: Building2 },
                            { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
                            { key: 'billing', label: 'Billing & Invoices', icon: Receipt },
                            { key: 'contracts', label: 'Legal & Contracts', icon: FileCheck },
                            { key: 'sms', label: 'Financial SMS', icon: MessageSquareText },
                            { key: 'whatsapp', label: 'WhatsApp Gateway', icon: Phone },
                            { key: 'users', label: 'Users & Roles', icon: ShieldCheck },
                            { key: 'cms_landing', label: 'Website & CMS', icon: Globe },
                            { key: 'marketing', label: 'Marketing & Demos', icon: Sparkles },
                            { key: 'notices', label: 'Notices & Alerts', icon: Bell },
                            { key: 'support', label: 'Support Desk', icon: HelpCircle },
                            { key: 'system', label: 'System Admin', icon: Settings },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive =
                                activeTab === tab.key ||
                                (tab.key === 'subscriptions' && activeTab === 'plans') ||
                                (tab.key === 'sms' && (activeTab === 'sms_wallets' || activeTab === 'sms_issue' || activeTab === 'sms_provider')) ||
                                (tab.key === 'whatsapp' && (activeTab === 'whatsapp_templates' || activeTab === 'whatsapp_logs')) ||
                                (tab.key === 'users' && (activeTab === 'roles' || activeTab === 'users')) ||
                                (tab.key === 'cms_landing' && (activeTab === 'cms_landing' || activeTab === 'cms_pricing' || activeTab === 'cms_faqs')) ||
                                (tab.key === 'marketing' && (activeTab === 'marketing' || activeTab === 'demos' || activeTab === 'funnel')) ||
                                (tab.key === 'notices' && (activeTab === 'notices' || activeTab === 'system_alerts')) ||
                                (tab.key === 'support' && activeTab === 'support');
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleSwitchTab(tab.key)}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4. TAB CONTENTS */}

                {/* TAB 1: OVERVIEW & TENANTS LIST */}
                {(activeTab === 'overview' || activeTab === 'tenants') && (
                    <div className="space-y-6">
                        {/* Filters and search header */}
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-72">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search hotel name, subdomain, city..."
                                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <select
                                    value={planFilter}
                                    onChange={(e) => setPlanFilter(e.target.value)}
                                    className="text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="all">All Plans</option>
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <span className="text-xs text-slate-500 font-medium">
                                    Showing <strong className="text-slate-900">{filteredTenants.length}</strong> of {tenants.length} Hotels
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowOnboardModal(true)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Hotel</span>
                                </button>
                            </div>
                        </div>

                        {/* Tenants Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-900">
                                        Managed Hotel Tenants & Operations
                                    </h3>
                                    <p className="text-xs text-slate-400">Click 'Access Workspace' to manage hotel operations directly.</p>
                                </div>
                                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    Database Isolation Active
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                            <th className="py-3 px-5">Hotel / Group</th>
                                            <th className="py-3 px-4">Plan & Billing</th>
                                            <th className="py-3 px-4">Properties</th>
                                            <th className="py-3 px-4">SMS Wallet</th>
                                            <th className="py-3 px-4">License Expiry</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {filteredTenants.map((tenant) => (
                                            <tr key={tenant.id} className="hover:bg-slate-50/60 transition">
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0 border border-blue-100">
                                                            {tenant.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-slate-900 block">{tenant.name}</span>
                                                            <span className="text-slate-400 text-[11px]">
                                                                {tenant.subdomain}.theinns.com
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                        tenant.plan === 'enterprise'
                                                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                            : tenant.plan === 'pro' || tenant.plan === 'professional'
                                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                                                    }`}>
                                                        {tenant.plan_name || tenant.plan}
                                                    </span>
                                                    <span className="block text-slate-500 text-[11px] mt-1 font-semibold">
                                                        TZS {new Intl.NumberFormat('en-TZ').format(tenant.subscription_price)}/mo
                                                    </span>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{tenant.properties_count} / {tenant.max_branches} Branches</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                                                        {tenant.properties.map((p) => p.name).join(', ')}
                                                    </div>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-extrabold text-slate-900">
                                                            {new Intl.NumberFormat('en-TZ').format(tenant.sms_balance)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">credits</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenIssueSms(tenant.id)}
                                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                                                    >
                                                        <Plus className="w-2.5 h-2.5" />
                                                        Top-up SMS
                                                    </button>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <span className="text-slate-700 font-medium">{tenant.license_expiry}</span>
                                                    <span className="block text-[10px] text-slate-400 capitalize">{tenant.subscription_status}</span>
                                                </td>

                                                <td className="py-4 px-4">
                                                    {tenant.is_active ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
                                                            <Check className="w-2.5 h-2.5" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-rose-200">
                                                            <AlertCircle className="w-2.5 h-2.5" />
                                                            Suspended
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-4 px-5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Impersonate / Access Workspace */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImpersonate(tenant.id, tenant.name)}
                                                            title="Access Hotel Workspace as General Manager"
                                                            className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            <span>Workspace</span>
                                                        </button>

                                                        {/* Edit Tenant */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditTenant(tenant)}
                                                            title="Edit Tenant Configuration"
                                                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>

                                                        {/* Suspend / Reactivate */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleTenant(tenant.id)}
                                                            title={tenant.is_active ? 'Suspend Hotel Operations' : 'Reactivate Hotel'}
                                                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                                                                tenant.is_active
                                                                    ? 'text-rose-500 hover:bg-rose-50'
                                                                    : 'text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                        >
                                                            <Power className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: SUBSCRIPTION MANAGEMENT */}
                {activeTab === 'subscriptions' && (
                    <div className="space-y-6">
                        {/* Plans Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan) => (
                                <div key={plan.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-base text-slate-900">{plan.name}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200/50">
                                                {plan.badge}
                                            </span>
                                        </div>
                                        <div className="mt-4">
                                            <span className="text-3xl font-black text-slate-900">
                                                TZS {new Intl.NumberFormat('en-TZ').format(plan.price_tzs)}
                                            </span>
                                            <span className="text-xs text-slate-500"> / month</span>
                                        </div>

                                        <div className="my-5 pt-4 border-t border-slate-100 space-y-2 text-xs">
                                            <div className="flex items-center justify-between text-slate-700 font-medium">
                                                <span>Active Hotels on tier:</span>
                                                <strong className="text-slate-900 font-extrabold">{plan.active_count} Hotels</strong>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-700 font-medium">
                                                <span>Max Branches Allowed:</span>
                                                <strong className="text-slate-900">{plan.max_branches}</strong>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-700 font-medium">
                                                <span>Recommended Rooms:</span>
                                                <strong className="text-slate-900">{plan.max_rooms}</strong>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {plan.features.map((f, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    <span>{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                quotationForm.setData('plan_code', plan.code);
                                                quotationForm.setData('amount', plan.price_tzs);
                                                setShowCreateQuotationModal(true);
                                            }}
                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                                        >
                                            Generate Quote on This Tier
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Active Subscriptions Real Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                            <h3 className="font-extrabold text-sm text-slate-900 mb-4">
                                Live Tenant Subscriptions & Auto-Renewal Monitoring
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                            <th className="py-3 px-4">Hotel Tenant</th>
                                            <th className="py-3 px-4">Plan Name</th>
                                            <th className="py-3 px-4">Monthly Rate</th>
                                            <th className="py-3 px-4">Cycle</th>
                                            <th className="py-3 px-4">Expires On</th>
                                            <th className="py-3 px-4">Grace Ends</th>
                                            <th className="py-3 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {subscriptions.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-bold text-slate-900">{sub.tenant_name}</td>
                                                <td className="py-3 px-4">{sub.plan_name}</td>
                                                <td className="py-3 px-4 font-bold text-slate-800">TZS {new Intl.NumberFormat('en-TZ').format(sub.amount_tzs)}</td>
                                                <td className="py-3 px-4 capitalize">{sub.billing_cycle}</td>
                                                <td className="py-3 px-4">{sub.expires_at}</td>
                                                <td className="py-3 px-4 text-slate-500">{sub.grace_period_ends_at}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        sub.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : sub.status === 'grace_period'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        {sub.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: BILLING, QUOTES & INVOICES */}
                {activeTab === 'billing' && (
                    <div className="space-y-6">
                        {/* Quick Action Header */}
                        <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                            <div>
                                <h3 className="font-extrabold text-sm text-slate-900">SaaS Billing, Quotations & Receipts</h3>
                                <p className="text-xs text-slate-500">Flow: Quotation → Accepted → Invoice → Payment Verified → Official Receipt.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateQuotationModal(true)}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Create Quotation</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateInvoiceModal(true)}
                                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Issue Invoice</span>
                                </button>
                            </div>
                        </div>

                        {/* Quotations Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                            <h4 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center justify-between">
                                <span>Recent Quotations (QT)</span>
                                <span className="text-xs text-slate-400 font-medium">B2B Proposals</span>
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                            <th className="py-3 px-4">Quote Number</th>
                                            <th className="py-3 px-4">Client / Hotel</th>
                                            <th className="py-3 px-4">Contact</th>
                                            <th className="py-3 px-4">Total Amount</th>
                                            <th className="py-3 px-4">Valid Until</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {quotations.map((quote) => (
                                            <tr key={quote.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-mono font-bold text-blue-600">{quote.quotation_number}</td>
                                                <td className="py-3 px-4 font-bold text-slate-900">{quote.company_name || quote.customer_name}</td>
                                                <td className="py-3 px-4 text-slate-600">{quote.customer_email}</td>
                                                <td className="py-3 px-4 font-bold text-slate-800">TZS {new Intl.NumberFormat('en-TZ').format(quote.total_tzs)}</td>
                                                <td className="py-3 px-4 text-slate-500">{quote.valid_until}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        quote.status === 'converted' || quote.status === 'accepted'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : quote.status === 'sent'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {quote.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    {quote.status !== 'converted' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleConvertQuotation(quote.id)}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                                        >
                                                            Convert to Invoice
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Invoices Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                            <h4 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center justify-between">
                                <span>Official Invoices (INV)</span>
                                <span className="text-xs text-slate-400 font-medium">Auto-Ledger Synchronized</span>
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                            <th className="py-3 px-4">Invoice #</th>
                                            <th className="py-3 px-4">Tenant Hotel</th>
                                            <th className="py-3 px-4">Reason</th>
                                            <th className="py-3 px-4">Total</th>
                                            <th className="py-3 px-4">Paid</th>
                                            <th className="py-3 px-4">Balance</th>
                                            <th className="py-3 px-4">Due Date</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                                                <td className="py-3 px-4 font-bold text-slate-800">{inv.tenant_name}</td>
                                                <td className="py-3 px-4 capitalize text-slate-500">{inv.billing_reason.replace('_', ' ')}</td>
                                                <td className="py-3 px-4 font-bold text-slate-900">TZS {new Intl.NumberFormat('en-TZ').format(inv.total_tzs)}</td>
                                                <td className="py-3 px-4 text-emerald-600 font-semibold">TZS {new Intl.NumberFormat('en-TZ').format(inv.paid_amount_tzs)}</td>
                                                <td className="py-3 px-4 font-bold text-slate-800">TZS {new Intl.NumberFormat('en-TZ').format(inv.balance_tzs)}</td>
                                                <td className="py-3 px-4 text-slate-500">{inv.due_date}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        inv.status === 'paid'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : inv.status === 'unpaid'
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    {inv.status !== 'paid' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenRecordPayment(inv)}
                                                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                                        >
                                                            Record Payment
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Receipts Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                            <h4 className="font-extrabold text-sm text-slate-900 mb-4">Official Payment Receipts (RCT)</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                            <th className="py-3 px-4">Receipt #</th>
                                            <th className="py-3 px-4">Tenant Hotel</th>
                                            <th className="py-3 px-4">Invoice #</th>
                                            <th className="py-3 px-4">Amount Paid</th>
                                            <th className="py-3 px-4">Method</th>
                                            <th className="py-3 px-4">Ref</th>
                                            <th className="py-3 px-4">Issued At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {receipts.map((rct) => (
                                            <tr key={rct.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-mono font-bold text-emerald-600">{rct.receipt_number}</td>
                                                <td className="py-3 px-4 font-bold text-slate-900">{rct.tenant_name}</td>
                                                <td className="py-3 px-4 font-mono text-slate-600">{rct.invoice_number}</td>
                                                <td className="py-3 px-4 font-bold text-slate-900">TZS {new Intl.NumberFormat('en-TZ').format(rct.amount_tzs)}</td>
                                                <td className="py-3 px-4 capitalize">{rct.payment_method.replace('_', ' ')}</td>
                                                <td className="py-3 px-4 font-mono text-slate-500">{rct.payment_reference}</td>
                                                <td className="py-3 px-4 text-slate-500">{rct.issued_at}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: LEGAL & CONTRACTS (E-SIGN) */}
                {activeTab === 'contracts' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                            <div>
                                <h3 className="font-extrabold text-sm text-slate-900">Legal & Contract Management (E-Signatures)</h3>
                                <p className="text-xs text-slate-500">All contracts are sealed with SHA-256 document hashing and immutable audit trails.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateContractModal(true)}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Generate Contract</span>
                            </button>
                        </div>

                        {/* Contracts Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                            <h4 className="font-extrabold text-sm text-slate-900 mb-4">Executed & Pending Tenant Contracts</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                            <th className="py-3 px-4">Contract #</th>
                                            <th className="py-3 px-4">Hotel Tenant</th>
                                            <th className="py-3 px-4">Contract Title</th>
                                            <th className="py-3 px-4">Signer Name</th>
                                            <th className="py-3 px-4">Signed At</th>
                                            <th className="py-3 px-4">Document Hash</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {contracts.map((contract) => (
                                            <tr key={contract.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-mono font-bold text-blue-600">{contract.contract_number}</td>
                                                <td className="py-3 px-4 font-bold text-slate-900">{contract.tenant_name}</td>
                                                <td className="py-3 px-4 text-slate-700">{contract.title}</td>
                                                <td className="py-3 px-4 text-slate-600">{contract.signer_name || 'Pending'}</td>
                                                <td className="py-3 px-4 text-slate-500">{contract.signed_at || 'Pending'}</td>
                                                <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-xs" title={contract.document_hash}>
                                                    {contract.document_hash ? contract.document_hash.substring(0, 16) + '...' : 'N/A'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        contract.status === 'signed' || contract.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {contract.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenViewContract(contract)}
                                                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                                    >
                                                        View / Sign
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Contract Templates */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                            <h4 className="font-extrabold text-sm text-slate-900 mb-4">Master Contract Templates</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {contract_templates.map((tpl) => (
                                    <div key={tpl.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900">{tpl.name}</span>
                                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md uppercase">
                                                v{tpl.version}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-[11px]">{tpl.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: FINANCIAL SMS & MESSAGING */}
                {activeTab === 'sms' && (
                    <div className="space-y-6">
                        {/* Provider Gateway Status - Clean Humanic UI */}
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Central Master Provider</span>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <span>{sms_provider?.name || 'SwalaSMS Tanzania Gateway'}</span>
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Base Endpoint: <span className="font-mono text-slate-700">{sms_provider?.base_url || 'https://api.swalasms.com'}</span> | Sender ID: <strong className="text-slate-800">{sms_provider?.sender_id || 'SWALATECH'}</strong>
                                </p>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-wrap">
                                <div>
                                    <span className="text-[11px] text-slate-500 block font-semibold">Available Master Credits</span>
                                    <span className="text-2xl font-black text-slate-900 font-mono">
                                        {new Intl.NumberFormat('en-TZ').format(sms_provider?.balance || 148500)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowSmsConfigModal(true)}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                                >
                                    Gateway Settings
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTestSmsModal(true)}
                                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                                >
                                    Test Send SMS
                                </button>
                            </div>
                        </div>

                        {/* Tenant Wallets Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-extrabold text-sm text-slate-900">Hotel Tenant SMS Wallets & Balances</h4>
                                <span className="text-xs text-slate-400">Total Wallets: {sms_wallets.length}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                            <th className="py-3 px-4">Hotel Tenant</th>
                                            <th className="py-3 px-4">Current Balance</th>
                                            <th className="py-3 px-4">Total Purchased</th>
                                            <th className="py-3 px-4">Total Sent</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Last Issued</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sms_wallets.map((wallet) => (
                                            <tr key={wallet.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-bold text-slate-900">{wallet.tenant_name}</td>
                                                <td className="py-3 px-4">
                                                    <span className="font-black text-blue-600 text-sm">
                                                        {new Intl.NumberFormat('en-TZ').format(wallet.balance)}
                                                    </span>{' '}
                                                    <span className="text-slate-400 text-[11px]">SMS</span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-700">{new Intl.NumberFormat('en-TZ').format(wallet.total_credited)}</td>
                                                <td className="py-3 px-4 text-slate-700">{new Intl.NumberFormat('en-TZ').format(wallet.total_used)}</td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                                        {wallet.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500">{wallet.last_issued_at}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenIssueSms(wallet.tenant_id)}
                                                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                                                    >
                                                        + Issue Credits
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Issuances & Packages */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                                <h4 className="font-extrabold text-sm text-slate-900 mb-4">Recent SMS Wallet Issuance Ledger</h4>
                                <div className="divide-y divide-slate-100 text-xs">
                                    {sms_issues.map((issue) => (
                                        <div key={issue.id} className="py-3 flex items-center justify-between gap-4">
                                            <div>
                                                <span className="font-bold text-slate-900 block">{issue.tenant_name}</span>
                                                <span className="text-slate-400 text-[11px] font-mono">Ref: {issue.reference} ({issue.method})</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-extrabold text-emerald-600 block">+{issue.credits} Credits</span>
                                                <span className="text-slate-400 text-[11px]">{issue.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SMS Packages list */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                                <h4 className="font-extrabold text-sm text-slate-900 mb-4">Standard SMS Credit Bundles</h4>
                                <div className="space-y-3">
                                    {sms_packages.map((pkg) => (
                                        <div key={pkg.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                                            <div>
                                                <span className="font-bold text-slate-800 block">{pkg.name}</span>
                                                <span className="text-blue-600 font-bold">{pkg.credits_count} Credits</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-slate-900">
                                                    TZS {new Intl.NumberFormat('en-TZ').format(pkg.selling_price_minor / 100)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 6: WHATSAPP MANAGEMENT */}
                {activeTab === 'whatsapp' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">WhatsApp Cloud Business API Gateway</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Automated guest booking confirmations, room check-in notifications & digital folios.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowWhatsAppConfigModal(true)}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    API Credentials
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTestWhatsAppModal(true)}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Test Send WhatsApp
                                </button>
                            </div>
                        </div>

                        {/* WhatsApp Message Activity Logs */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                            <h4 className="font-extrabold text-sm text-slate-900 mb-4">Live WhatsApp Dispatch Activity Logs</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                            <th className="py-3 px-4">Recipient</th>
                                            <th className="py-3 px-4">Phone Number</th>
                                            <th className="py-3 px-4">Type</th>
                                            <th className="py-3 px-4">Message Preview</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {whatsapp_logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-6 text-center text-slate-400">
                                                    Hakuna log za WhatsApp zilizorekodiwa bado. Bonyeza 'Test Send WhatsApp' kujaribu.
                                                </td>
                                            </tr>
                                        ) : (
                                            whatsapp_logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50">
                                                    <td className="py-3 px-4 font-bold text-slate-900">{log.recipient_name || 'Guest'}</td>
                                                    <td className="py-3 px-4 font-mono text-slate-600">{log.recipient_phone}</td>
                                                    <td className="py-3 px-4 capitalize">{log.message_type.replace('_', ' ')}</td>
                                                    <td className="py-3 px-4 text-slate-500 truncate max-w-sm">{log.message_body}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-400">{log.time}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 7: NOTICES & BROADCASTS & SYSTEM ALERTS */}
                {(activeTab === 'notices' || activeTab === 'system_alerts') && (
                    <div className="space-y-6">
                        {/* Subnav switcher */}
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => setNoticesSubTab('broadcasts')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    noticesSubTab === 'broadcasts' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Tenant Broadcasts ({notices.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setNoticesSubTab('alerts')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    noticesSubTab === 'alerts' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                System Alerts & Maintenance
                            </button>
                        </div>
                        {noticesSubTab === 'alerts' && (
                            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-amber-950">Scheduled System Maintenance Window</h4>
                                        <p className="text-xs text-amber-800 mt-1">
                                            Next automated routine database optimization and backup cycle is scheduled every night at <strong>03:00 AM EAT</strong>. Zero downtime expected.
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                All Services Operational
                                            </span>
                                            <span className="text-xs text-amber-700">Cluster: {system_health.server_cluster}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowNoticeModal(true)}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition shrink-0 cursor-pointer"
                                >
                                    Post Emergency Alert
                                </button>
                            </div>
                        )}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Tenant Broadcast Notices</h3>
                                <p className="text-xs text-slate-500">Send real-time alerts and notices to hotel managers and front desks across Tanzania.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNoticeModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create Notice</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {notices.map((notice) => (
                                <div key={notice.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                                            {notice.target}
                                        </span>
                                        <span className="text-xs text-slate-400">{notice.created_at}</span>
                                    </div>
                                    <h4 className="font-bold text-sm text-slate-900">{notice.title}</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">{notice.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

                {/* TAB 8: SYSTEM ADMINISTRATION & DIAGNOSTICS */}
                {activeTab === 'system' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                    <Server className="w-5 h-5 text-blue-600" />
                                    <span>Platform Health, Database & Diagnostics</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Real-time node metrics, MySQL InnoDB engine status, and cache management.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearCache}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Clear Cache & Optimize</span>
                            </button>
                        </div>

                        {/* Real Node Diagnostics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                                <span className="text-slate-400 block text-[11px]">Cluster Uptime</span>
                                <span className="text-lg font-black text-emerald-600">{system_health.uptime}</span>
                                <span className="text-[10px] text-slate-500 block mt-1">{system_health.server_cluster}</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                                <span className="text-slate-400 block text-[11px]">Database Status</span>
                                <span className="text-lg font-black text-slate-900">{system_health.database_status}</span>
                                <span className="text-[10px] text-slate-500 block mt-1">DB: {system_health.database_name}</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                                <span className="text-slate-400 block text-[11px]">Software Versions</span>
                                <span className="text-lg font-black text-slate-900">PHP {system_health.php_version}</span>
                                <span className="text-[10px] text-slate-500 block mt-1">Laravel {system_health.laravel_version}</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                                <span className="text-slate-400 block text-[11px]">Last Automated Backup</span>
                                <span className="text-lg font-black text-blue-600">{system_health.last_backup}</span>
                                <span className="text-[10px] text-slate-500 block mt-1">Storage: {system_health.storage_used}</span>
                            </div>
                        </div>

                        {/* Real Table Counts */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                            <h4 className="font-extrabold text-sm text-slate-900 mb-4">Database Table Records Count (Live Audit)</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-2xl font-black text-slate-900">{kpis.total_tenants}</span>
                                    <span className="block text-[11px] text-slate-500 mt-1 font-bold">Tenants</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-2xl font-black text-blue-600">{system_health.total_rooms}</span>
                                    <span className="block text-[11px] text-slate-500 mt-1 font-bold">Hotel Rooms</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-2xl font-black text-slate-900">{system_health.total_users}</span>
                                    <span className="block text-[11px] text-slate-500 mt-1 font-bold">Staff & Users</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-2xl font-black text-emerald-600">{system_health.total_invoices}</span>
                                    <span className="block text-[11px] text-slate-500 mt-1 font-bold">SaaS Invoices</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-2xl font-black text-purple-600">{system_health.total_contracts}</span>
                                    <span className="block text-[11px] text-slate-500 mt-1 font-bold">Contracts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 9: USER & ACCESS MANAGEMENT */}
                {(activeTab === 'users' || activeTab === 'roles') && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => setUserSubTab('users')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    userSubTab === 'users' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Global SaaS Users ({global_users.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserSubTab('roles')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    userSubTab === 'roles' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Roles & Permissions Matrix ({roles_matrix.length})
                            </button>
                        </div>

                        {userSubTab === 'users' ? (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="relative w-64">
                                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={userSearchTerm}
                                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                                placeholder="Search user, email, hotel..."
                                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <select
                                            value={selectedUserRole}
                                            onChange={(e) => setSelectedUserRole(e.target.value)}
                                            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold cursor-pointer"
                                        >
                                            <option value="all">All Roles</option>
                                            <option value="super_admin">Super Admin</option>
                                            <option value="general_manager">General Manager</option>
                                            <option value="receptionist">Receptionist</option>
                                            <option value="accountant">Accountant</option>
                                            <option value="housekeeping">Housekeeping</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateUserModal(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Create SaaS User</span>
                                    </button>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                                <th className="py-3 px-4">User Details</th>
                                                <th className="py-3 px-4">Assigned Tenant / Hotel</th>
                                                <th className="py-3 px-4">Platform Role</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4">Joined Date</th>
                                                <th className="py-3 px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredGlobalUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-8 text-center text-slate-400">
                                                        No users found matching query.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredGlobalUsers.map((u: any) => (
                                                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                                                        <td className="py-3 px-4">
                                                            <div className="font-bold text-slate-900">{u.name}</div>
                                                            <div className="text-[11px] text-slate-400">{u.email}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                                                {u.tenant_name}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                u.role === 'super_admin'
                                                                    ? 'bg-purple-100 text-purple-700'
                                                                    : u.role === 'general_manager' || u.role === 'owner'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : u.role === 'receptionist'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                                {u.role.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                                u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                {u.is_active ? 'Active' : 'Suspended'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-500">{u.created_at}</td>
                                                        <td className="py-3 px-4 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleUserStatus(u.id, u.name)}
                                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                                                    u.is_active
                                                                        ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                                                                        : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                                                                }`}
                                                            >
                                                                {u.is_active ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {roles_matrix.map((rm: any) => (
                                    <div key={rm.role} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {rm.badge}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500">{rm.users_count} Users</span>
                                            </div>
                                            <h4 className="text-sm font-extrabold text-slate-900 mt-2">{rm.title}</h4>
                                            <p className="text-[11px] text-slate-400 font-semibold">{rm.scope}</p>
                                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{rm.description}</p>
                                        </div>
                                        <div className="border-t border-slate-100 pt-3">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                                Authorized Capabilities
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {rm.permissions.map((p: string, idx: number) => (
                                                    <span key={idx} className="bg-slate-50 border border-slate-200/60 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 10: WEBSITE & CMS */}
                {(activeTab === 'cms_landing' || activeTab === 'cms_pricing' || activeTab === 'cms_faqs') && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => setCmsSubTab('landing')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    cmsSubTab === 'landing' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Landing Page Content
                            </button>
                            <button
                                type="button"
                                onClick={() => setCmsSubTab('pricing')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    cmsSubTab === 'pricing' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Pricing Plans Display ({plans.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setCmsSubTab('faqs')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    cmsSubTab === 'faqs' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Testimonials & FAQs
                            </button>
                        </div>

                        {cmsSubTab === 'landing' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <form onSubmit={submitCmsUpdate} className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
                                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-extrabold text-sm text-slate-900">Landing Page Hero & CTA Settings</h3>
                                            <p className="text-[11px] text-slate-500">Live customization of the SaaS public landing page seen by prospective hotel owners.</p>
                                        </div>
                                        <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold text-xs">
                                            <span>View Live</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Main Hero Headline *</label>
                                        <input
                                            type="text"
                                            required
                                            value={liveCmsForm.data.hero_title}
                                            onChange={(e) => liveCmsForm.setData('hero_title', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Hero Subheadline & Value Proposition *</label>
                                        <textarea
                                            rows={3}
                                            required
                                            value={liveCmsForm.data.hero_subtitle}
                                            onChange={(e) => liveCmsForm.setData('hero_subtitle', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="font-bold text-slate-700 block mb-1">Primary CTA Button Label</label>
                                            <input
                                                type="text"
                                                required
                                                value={liveCmsForm.data.hero_cta_text}
                                                onChange={(e) => liveCmsForm.setData('hero_cta_text', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="font-bold text-slate-700 block mb-1">Demo Request Button Label</label>
                                            <input
                                                type="text"
                                                required
                                                value={liveCmsForm.data.demo_cta_text}
                                                onChange={(e) => liveCmsForm.setData('demo_cta_text', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={liveCmsForm.processing}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                        >
                                            <Check className="w-4 h-4 stroke-[3]" />
                                            <span>Save & Publish Live</span>
                                        </button>
                                    </div>
                                </form>

                                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-extrabold text-[10px] tracking-wider uppercase">
                                            <Sparkles className="w-3 h-3" />
                                            <span>{cms_content?.hero_badge || 'THE INNS • PMS'}</span>
                                        </div>
                                        <h2 className="text-xl font-black text-white leading-tight">
                                            {liveCmsForm.data.hero_title}
                                        </h2>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            {liveCmsForm.data.hero_subtitle}
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <span className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md">
                                                {liveCmsForm.data.hero_cta_text}
                                            </span>
                                            <span className="px-4 py-2 bg-white/10 text-white font-bold rounded-xl text-xs border border-white/20">
                                                {liveCmsForm.data.demo_cta_text}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Preview Mode (Real-Time Synchronized)</span>
                                        <span className="text-emerald-400 font-bold">100% Mobile Ready</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {cmsSubTab === 'pricing' && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-blue-800 font-semibold">
                                        <Percent className="w-4 h-4 text-blue-600" />
                                        <span>{cms_content?.display_annual_discount || 'Pata punguzo la 20% kwa malipo ya mwaka mzima'}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchTab('subscriptions')}
                                        className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                                    >
                                        Manage Subscription Plans →
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {plans.map((p: any) => (
                                        <div key={p.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                                                        {p.badge}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-500">{p.active_count} Hotels Active</span>
                                                </div>
                                                <h4 className="text-base font-black text-slate-900 mt-2">{p.name}</h4>
                                                <div className="mt-2">
                                                    <span className="text-2xl font-black text-slate-900">
                                                        TZS {new Intl.NumberFormat('en-TZ').format(p.price_tzs)}
                                                    </span>
                                                    <span className="text-xs text-slate-400 block">/ month (Annual available)</span>
                                                </div>
                                                <div className="mt-4 border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>Max Branches: {p.max_branches}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>Rooms Capacity: {p.max_rooms}</span>
                                                    </div>
                                                    {p.features?.map((f: string, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>{f}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleSwitchTab('subscriptions')}
                                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer"
                                            >
                                                Configure Plan Tiers
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {cmsSubTab === 'faqs' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-blue-600" />
                                        <span>Customer Testimonials Showcase</span>
                                    </h4>
                                    <div className="space-y-3">
                                        {cms_content?.testimonials?.map((t: any) => (
                                            <div key={t.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-bold text-slate-900 text-xs block">{t.name}</span>
                                                        <span className="text-[11px] text-slate-400">{t.role} • {t.hotel}</span>
                                                    </div>
                                                    <div className="flex text-amber-400 text-xs">★★★★★</div>
                                                </div>
                                                <p className="text-xs text-slate-600 italic">"{t.quote}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4 text-purple-600" />
                                        <span>Frequently Asked Questions (FAQs)</span>
                                    </h4>
                                    <div className="space-y-3">
                                        {cms_content?.faqs?.map((faq: any) => (
                                            <div key={faq.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
                                                <h5 className="font-bold text-slate-900 text-xs">{faq.question}</h5>
                                                <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 11: MARKETING, DEMOS & CONVERSIONS */}
                {(activeTab === 'marketing' || activeTab === 'demos' || activeTab === 'funnel') && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => setMarketingSubTab('promos')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    marketingSubTab === 'promos' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Campaigns & Promos
                            </button>
                            <button
                                type="button"
                                onClick={() => setMarketingSubTab('demos')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    marketingSubTab === 'demos' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Demo & Trial Inquiries ({demo_requests.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setMarketingSubTab('funnel')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    marketingSubTab === 'funnel' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Conversion Funnel Analytics
                            </button>
                        </div>

                        {marketingSubTab === 'promos' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-900">Promotional Discount Codes</h3>
                                        <p className="text-xs text-slate-500">Configure promotional vouchers for onboarding campaigns and sales outreach.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreatePromoModal(true)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Create Promo Code</span>
                                    </button>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                                <th className="py-3 px-4">Coupon Code</th>
                                                <th className="py-3 px-4">Discount</th>
                                                <th className="py-3 px-4">Applies To</th>
                                                <th className="py-3 px-4">Usage Count</th>
                                                <th className="py-3 px-4">Expiry Date</th>
                                                <th className="py-3 px-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {marketing_data?.promos?.map((promo: any) => (
                                                <tr key={promo.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3 px-4 font-mono font-black text-blue-600 text-sm">
                                                        {promo.code}
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-900">
                                                        {promo.discount_percent}% OFF
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600">{promo.applies_to}</td>
                                                    <td className="py-3 px-4 font-semibold text-slate-700">
                                                        {promo.uses_count} / {promo.max_uses} used
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500">{promo.expires_at}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            promo.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {promo.is_active ? 'Active' : 'Expired'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
                                    <h4 className="font-extrabold text-sm text-slate-900">Marketing Acquisition Channels</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                        {marketing_data?.channels?.map((ch: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                                <span className="font-bold text-slate-800 block text-xs">{ch.name}</span>
                                                <div className="flex items-baseline justify-between mt-2">
                                                    <span className="text-xl font-black text-slate-900">{ch.leads} Leads</span>
                                                    <span className="text-xs font-black text-emerald-600">{ch.conversion_rate}</span>
                                                </div>
                                                <span className="text-[11px] text-slate-400 block">{ch.converted} converted to paying</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {marketingSubTab === 'demos' && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-900">Prospective Hotel Demo Inquiries</h3>
                                        <p className="text-xs text-slate-500">Inbound requests submitted by lodge and hotel owners requesting live walkthroughs.</p>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                                        {demo_requests.length} High-Intent Leads
                                    </span>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                                <th className="py-3 px-4">Hotel / Lodge</th>
                                                <th className="py-3 px-4">Contact Person</th>
                                                <th className="py-3 px-4">Rooms & City</th>
                                                <th className="py-3 px-4">Requested Plan</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4 text-right">Quick Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {demo_requests.map((demo: any) => (
                                                <tr key={demo.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-slate-900">{demo.hotel_name}</div>
                                                        <div className="text-[11px] text-slate-400">Received {demo.created_at}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-slate-800">{demo.contact_name}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <a href={`tel:${demo.phone}`} className="text-blue-600 hover:underline text-[11px]">
                                                                {demo.phone}
                                                            </a>
                                                            <span>•</span>
                                                            <a href={`https://wa.me/${demo.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline text-[11px] font-bold">
                                                                WhatsApp
                                                            </a>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="font-bold text-slate-900">{demo.rooms_count} Rooms</span>
                                                        <span className="text-[11px] text-slate-400 block">{demo.city}</span>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-slate-700">{demo.requested_plan}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            demo.status === 'new' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                            {demo.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleConvertLeadToQuote(demo)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-2xs transition cursor-pointer"
                                                        >
                                                            <Receipt className="w-3 h-3" />
                                                            <span>Send Quote</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {marketingSubTab === 'funnel' && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-extrabold text-base text-slate-900">SaaS Growth & Conversion Funnel</h3>
                                            <p className="text-xs text-slate-500">Real-time pipeline metrics from website visitor to paid recurring subscription.</p>
                                        </div>
                                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                            {conversion_funnel?.conversion_rate_lead_to_paying || '10.4%'} Overall Conversion
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 text-center">
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">1. Visitors</span>
                                            <span className="text-2xl font-black text-slate-900 mt-1 block">
                                                {new Intl.NumberFormat('en-TZ').format(conversion_funnel?.visitors || 1240)}
                                            </span>
                                            <span className="text-[10px] text-slate-500 mt-1 block">Traffic source</span>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                                            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">2. Inquiries</span>
                                            <span className="text-2xl font-black text-blue-700 mt-1 block">
                                                {conversion_funnel?.inquiries || 48}
                                            </span>
                                            <span className="text-[10px] text-blue-600 font-bold mt-1 block">3.8% rate</span>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                                            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">3. Demos</span>
                                            <span className="text-2xl font-black text-indigo-700 mt-1 block">
                                                {conversion_funnel?.demos || 22}
                                            </span>
                                            <span className="text-[10px] text-indigo-600 font-bold mt-1 block">45.8% rate</span>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                                            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">4. Quotations</span>
                                            <span className="text-2xl font-black text-purple-700 mt-1 block">
                                                {conversion_funnel?.quotations || 14}
                                            </span>
                                            <span className="text-[10px] text-purple-600 font-bold mt-1 block">63.6% rate</span>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                                            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">5. Active Hotels</span>
                                            <span className="text-2xl font-black text-emerald-700 mt-1 block">
                                                {conversion_funnel?.active_paying_tenants || kpis.active_subscriptions}
                                            </span>
                                            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Paying Recurring</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 12: SUPPORT DESK & TICKET MANAGEMENT */}
                {activeTab === 'support' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Tenant Support Desk & Impersonation Hub</h3>
                                <p className="text-xs text-slate-500">Resolve tenant issues, manage help tickets, and launch 1-click workspace support login.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                                    Live Support Online
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                        <th className="py-3 px-4">Ticket</th>
                                        <th className="py-3 px-4">Hotel / Tenant</th>
                                        <th className="py-3 px-4">Category & Subject</th>
                                        <th className="py-3 px-4">Priority</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Support Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {support_tickets.map((t: any) => (
                                        <tr key={t.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                                {t.id}
                                                <span className="block font-normal text-[10px] text-slate-400">{t.created_at}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-900">{t.tenant_name}</div>
                                                <div className="text-[11px] text-slate-400">{t.sender_name}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-800">{t.subject}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{t.message}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    t.priority === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {t.priority}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    t.status === 'open'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : t.status === 'in_progress'
                                                        ? 'bg-indigo-100 text-indigo-800'
                                                        : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {t.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTicket(t);
                                                        replyTicketForm.setData('ticket_id', t.id);
                                                        setShowReplyTicketModal(true);
                                                    }}
                                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
                                                >
                                                    Reply / Resolve
                                                </button>
                                                {t.tenant_id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImpersonate(t.tenant_id!, t.tenant_name)}
                                                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
                                                    >
                                                        Support Login
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── MODALS SECTION ───────────────────────────────────────── */}

            {/* MODAL 1: ONBOARD NEW HOTEL TENANT */}
            {showOnboardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Onboard New Hotel Tenant</h3>
                                <p className="text-xs text-slate-500">Auto-provisions database, GM user, SMS wallet & master agreement.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowOnboardModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitOnboard} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Hotel Group / Tenant Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={onboardForm.data.name}
                                    onChange={(e) => onboardForm.setData('name', e.target.value)}
                                    placeholder="e.g. Serengeti Heritage Camp & Lodges"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Subdomain Slug *</label>
                                    <input
                                        type="text"
                                        required
                                        value={onboardForm.data.subdomain}
                                        onChange={(e) => onboardForm.setData('subdomain', e.target.value)}
                                        placeholder="serengeti"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Subscription Plan *</label>
                                    <select
                                        value={onboardForm.data.plan}
                                        onChange={(e) => onboardForm.setData('plan', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="starter">Starter Lodge (TZS 150,000)</option>
                                        <option value="pro">Hotel Pro (TZS 350,000)</option>
                                        <option value="enterprise">Enterprise Group (TZS 750,000)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">First Property / Lodge *</label>
                                    <input
                                        type="text"
                                        required
                                        value={onboardForm.data.property_name}
                                        onChange={(e) => onboardForm.setData('property_name', e.target.value)}
                                        placeholder="Main Safari Camp"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">City / Location *</label>
                                    <input
                                        type="text"
                                        required
                                        value={onboardForm.data.city}
                                        onChange={(e) => onboardForm.setData('city', e.target.value)}
                                        placeholder="Arusha / Zanzibar"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <span className="font-bold text-slate-800 block text-xs">General Manager Credentials</span>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] text-slate-600 block mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={onboardForm.data.admin_name}
                                            onChange={(e) => onboardForm.setData('admin_name', e.target.value)}
                                            placeholder="Peter Mwita"
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-slate-600 block mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={onboardForm.data.admin_email}
                                            onChange={(e) => onboardForm.setData('admin_email', e.target.value)}
                                            placeholder="manager@hotel.co.tz"
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowOnboardModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={onboardForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {onboardForm.processing ? 'Provisioning...' : 'Provision Tenant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: EDIT TENANT CONFIGURATION */}
            {showEditTenantModal && selectedTenantToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Edit Tenant Configuration</h3>
                                <p className="text-xs text-slate-500">{selectedTenantToEdit.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditTenantModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitEditTenant} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Hotel Group Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editTenantForm.data.name}
                                    onChange={(e) => editTenantForm.setData('name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Plan</label>
                                    <select
                                        value={editTenantForm.data.plan}
                                        onChange={(e) => editTenantForm.setData('plan', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="starter">Starter</option>
                                        <option value="pro">Pro</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Max Branches</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={editTenantForm.data.max_branches}
                                        onChange={(e) => editTenantForm.setData('max_branches', parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Price / Month (TZS)</label>
                                    <input
                                        type="number"
                                        value={editTenantForm.data.subscription_price}
                                        onChange={(e) => editTenantForm.setData('subscription_price', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">License Expiry</label>
                                    <input
                                        type="text"
                                        value={editTenantForm.data.license_expiry}
                                        onChange={(e) => editTenantForm.setData('license_expiry', e.target.value)}
                                        placeholder="YYYY-MM-DD"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active_toggle"
                                    checked={editTenantForm.data.is_active}
                                    onChange={(e) => editTenantForm.setData('is_active', e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active_toggle" className="font-bold text-slate-700">
                                    Hotel Account is Active & Operational
                                </label>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditTenantModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editTenantForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: ISSUE SMS CREDITS */}
            {showIssueSmsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Issue SMS Wallet Credits</h3>
                                <p className="text-xs text-slate-500">Super Admin Top-up Authority</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowIssueSmsModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitIssueSms} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Select Hotel Tenant *</label>
                                <select
                                    required
                                    value={smsForm.data.tenant_id}
                                    onChange={(e) => smsForm.setData('tenant_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                    <option value="">-- Choose Hotel --</option>
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} (Current: {t.sms_balance} credits)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">SMS Credits to Add *</label>
                                    <input
                                        type="number"
                                        required
                                        min="50"
                                        step="50"
                                        value={smsForm.data.credits}
                                        onChange={(e) => {
                                            const cr = parseInt(e.target.value) || 0;
                                            smsForm.setData('credits', cr);
                                            smsForm.setData('amount_paid', cr * 20); // 20 TZS per credit
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Amount Paid (TZS) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={smsForm.data.amount_paid}
                                        onChange={(e) => smsForm.setData('amount_paid', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                                    <select
                                        value={smsForm.data.payment_method}
                                        onChange={(e) => smsForm.setData('payment_method', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="bank">Bank Transfer (CRDB/NMB)</option>
                                        <option value="mobile_money">Mobile Money (M-Pesa/Tigo)</option>
                                        <option value="cash">Cash Settlement</option>
                                        <option value="gateway">Payment Gateway</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Payment Reference</label>
                                    <input
                                        type="text"
                                        value={smsForm.data.payment_reference}
                                        onChange={(e) => smsForm.setData('payment_reference', e.target.value)}
                                        placeholder="e.g. CRDB-TX9928"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Notes / Remarks</label>
                                <input
                                    type="text"
                                    value={smsForm.data.notes}
                                    onChange={(e) => smsForm.setData('notes', e.target.value)}
                                    placeholder="Approved topup for customer booking confirmations"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowIssueSmsModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={smsForm.processing}
                                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black shadow-md cursor-pointer"
                                >
                                    Issue {smsForm.data.credits} SMS Credits
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: SWALASMS PROVIDER GATEWAY CONFIG */}
            {showSmsConfigModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">
                                    SwalaSMS Gateway Settings
                                </h3>
                                <p className="text-xs text-slate-500">Sanidi vigezo vya SwalaSMS Developer API</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSmsConfigModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitSmsConfig} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Official Sender ID *</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={11}
                                    value={smsConfigForm.data.sender_id}
                                    onChange={(e) => smsConfigForm.setData('sender_id', e.target.value)}
                                    placeholder="SWALATECH"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                />
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Tumia <strong>SWALATECH</strong> kwa majaribio, au weka Sender ID yako iliyoidhinishwa kwenye portal ya SwalaSMS.
                                </span>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Gateway Base URL *</label>
                                <input
                                    type="url"
                                    required
                                    value={smsConfigForm.data.base_url}
                                    onChange={(e) => smsConfigForm.setData('base_url', e.target.value)}
                                    placeholder="https://api.swalasms.com"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">API Username / Account *</label>
                                <input
                                    type="text"
                                    required
                                    value={smsConfigForm.data.username}
                                    onChange={(e) => smsConfigForm.setData('username', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">SwalaSMS Bearer Token / API Key (swl_live_...)</label>
                                <input
                                    type="password"
                                    value={smsConfigForm.data.password}
                                    onChange={(e) => smsConfigForm.setData('password', e.target.value)}
                                    placeholder="Weka API Key ya SwalaSMS (swl_live_...)"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="sms_active_toggle"
                                    checked={smsConfigForm.data.is_active}
                                    onChange={(e) => smsConfigForm.setData('is_active', e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="sms_active_toggle" className="font-bold text-slate-700">
                                    SwalaSMS Gateway is Live & Active
                                </label>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowSmsConfigModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={smsConfigForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Save SwalaSMS Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: TEST SEND SMS */}
            {showTestSmsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Send Live Test SMS</h3>
                                <p className="text-xs text-slate-500">Verified SwalaSMS Tanzania Gateway Dispatch</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTestSmsModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitTestSms} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Destination Phone Number *</label>
                                <input
                                    type="text"
                                    required
                                    value={testSmsForm.data.phone}
                                    onChange={(e) => testSmsForm.setData('phone', e.target.value)}
                                    placeholder="+255754XXXXXX"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Message Text (Max 160 Chars) *</label>
                                <textarea
                                    required
                                    rows={3}
                                    maxLength={160}
                                    value={testSmsForm.data.message}
                                    onChange={(e) => testSmsForm.setData('message', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                                <span className="text-[10px] text-slate-400 block text-right mt-1">
                                    {testSmsForm.data.message.length} / 160 (1 SMS Segment)
                                </span>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTestSmsModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={testSmsForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Dispatch Test SMS</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 6: WHATSAPP CLOUD API CONFIG */}
            {showWhatsAppConfigModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Meta Cloud WhatsApp API</h3>
                                <p className="text-xs text-slate-500">Official Business Platform Settings</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowWhatsAppConfigModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitWhatsAppConfig} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Phone Number ID *</label>
                                <input
                                    type="text"
                                    required
                                    value={waConfigForm.data.phone_number_id}
                                    onChange={(e) => waConfigForm.setData('phone_number_id', e.target.value)}
                                    placeholder="108492048591820"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">WhatsApp Business Account ID *</label>
                                <input
                                    type="text"
                                    required
                                    value={waConfigForm.data.business_account_id}
                                    onChange={(e) => waConfigForm.setData('business_account_id', e.target.value)}
                                    placeholder="209482019485718"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Sender Phone Number</label>
                                <input
                                    type="text"
                                    value={waConfigForm.data.sender_phone_number}
                                    onChange={(e) => waConfigForm.setData('sender_phone_number', e.target.value)}
                                    placeholder="+255754000111"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Permanent System User Access Token</label>
                                <textarea
                                    rows={2}
                                    value={waConfigForm.data.access_token}
                                    onChange={(e) => waConfigForm.setData('access_token', e.target.value)}
                                    placeholder="EAAG... (Leave empty to keep existing)"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-[11px]"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="wa_active_toggle"
                                    checked={waConfigForm.data.is_active}
                                    onChange={(e) => waConfigForm.setData('is_active', e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="wa_active_toggle" className="font-bold text-slate-700">
                                    WhatsApp Cloud API Gateway Active
                                </label>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowWhatsAppConfigModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={waConfigForm.processing}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Save WhatsApp Credentials
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 7: TEST SEND WHATSAPP */}
            {showTestWhatsAppModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Send Test WhatsApp Message</h3>
                                <p className="text-xs text-slate-500">Simulate guest booking/folio dispatch</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTestWhatsAppModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitTestWhatsApp} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Recipient Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={testWaForm.data.recipient_name}
                                    onChange={(e) => testWaForm.setData('recipient_name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">WhatsApp Phone Number *</label>
                                <input
                                    type="text"
                                    required
                                    value={testWaForm.data.recipient_phone}
                                    onChange={(e) => testWaForm.setData('recipient_phone', e.target.value)}
                                    placeholder="+255754XXXXXX"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Message Body *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={testWaForm.data.message}
                                    onChange={(e) => testWaForm.setData('message', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTestWhatsAppModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={testWaForm.processing}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Send WhatsApp Message</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 8: CREATE FORMAL QUOTATION */}
            {showCreateQuotationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Create Official Quotation (QT)</h3>
                                <p className="text-xs text-slate-500">Prospective Hotel or Upgrade Proposal</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateQuotationModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitQuotation} className="space-y-4 pt-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Company / Hotel Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={quotationForm.data.company_name}
                                        onChange={(e) => quotationForm.setData('company_name', e.target.value)}
                                        placeholder="Ngorongoro Safari Camp"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Existing Tenant (Optional)</label>
                                    <select
                                        value={quotationForm.data.tenant_id}
                                        onChange={(e) => {
                                            const tid = e.target.value;
                                            quotationForm.setData('tenant_id', tid);
                                            const t = tenants.find((item) => item.id === tid);
                                            if (t) {
                                                quotationForm.setData('company_name', t.name);
                                            }
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="">-- New Prospect --</option>
                                        {tenants.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Contact Person *</label>
                                    <input
                                        type="text"
                                        required
                                        value={quotationForm.data.customer_name}
                                        onChange={(e) => quotationForm.setData('customer_name', e.target.value)}
                                        placeholder="Erick Mariki"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        value={quotationForm.data.customer_email}
                                        onChange={(e) => quotationForm.setData('customer_email', e.target.value)}
                                        placeholder="erick@safari.co.tz"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Plan Tier *</label>
                                    <select
                                        value={quotationForm.data.plan_code}
                                        onChange={(e) => quotationForm.setData('plan_code', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="starter">Starter Lodge (15 Rooms)</option>
                                        <option value="pro">Hotel & Safari Pro (60 Rooms)</option>
                                        <option value="enterprise">Enterprise Group (Unlimited)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Total Fee (TZS) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={quotationForm.data.amount}
                                        onChange={(e) => quotationForm.setData('amount', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Quotation Scope & Description</label>
                                <input
                                    type="text"
                                    required
                                    value={quotationForm.data.description}
                                    onChange={(e) => quotationForm.setData('description', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateQuotationModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={quotationForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Generate Quotation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 9: ISSUE MANUAL SAAS INVOICE */}
            {showCreateInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Issue SaaS Invoice (INV)</h3>
                                <p className="text-xs text-slate-500">Official billing dispatch</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateInvoiceModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitInvoice} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Select Hotel Tenant *</label>
                                <select
                                    required
                                    value={invoiceForm.data.tenant_id}
                                    onChange={(e) => invoiceForm.setData('tenant_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Billing Reason</label>
                                    <select
                                        value={invoiceForm.data.billing_reason}
                                        onChange={(e) => invoiceForm.setData('billing_reason', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="renewal">Subscription Renewal</option>
                                        <option value="new_subscription">New Subscription</option>
                                        <option value="sms_credits">SMS Credits Add-on</option>
                                        <option value="custom_service">Custom Integration</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Invoice Amount (TZS) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1000"
                                        value={invoiceForm.data.amount}
                                        onChange={(e) => invoiceForm.setData('amount', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Due Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={invoiceForm.data.due_date}
                                        onChange={(e) => invoiceForm.setData('due_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Description</label>
                                    <input
                                        type="text"
                                        required
                                        value={invoiceForm.data.description}
                                        onChange={(e) => invoiceForm.setData('description', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Notes</label>
                                <input
                                    type="text"
                                    value={invoiceForm.data.notes}
                                    onChange={(e) => invoiceForm.setData('notes', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateInvoiceModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={invoiceForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Issue Official Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 10: RECORD & VERIFY SAAS PAYMENT */}
            {showRecordPaymentModal && selectedInvoiceForPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Record & Verify Payment</h3>
                                <p className="text-xs text-slate-500">Invoice: {selectedInvoiceForPayment.invoice_number} ({selectedInvoiceForPayment.tenant_name})</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRecordPaymentModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitPayment} className="space-y-4 pt-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Amount to Pay (TZS) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1000"
                                        value={paymentForm.data.amount}
                                        onChange={(e) => paymentForm.setData('amount', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Payment Method *</label>
                                    <select
                                        value={paymentForm.data.payment_method}
                                        onChange={(e) => paymentForm.setData('payment_method', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="bank_transfer">Bank Transfer (CRDB/NMB)</option>
                                        <option value="mobile_money">Mobile Money (M-Pesa/Airtel)</option>
                                        <option value="card">Visa / Mastercard</option>
                                        <option value="cash">Cash Settlement</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">External Transaction Reference</label>
                                <input
                                    type="text"
                                    value={paymentForm.data.external_transaction_id}
                                    onChange={(e) => paymentForm.setData('external_transaction_id', e.target.value)}
                                    placeholder="e.g. CRDB-TX9921820"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                />
                            </div>

                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800">
                                <strong>Auto-Settlement Action:</strong> Saving this payment will mark the invoice as PAID, generate an Official Receipt (RCT), and automatically extend the hotel subscription.
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRecordPaymentModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Verify Payment & Issue Receipt
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 11: GENERATE CONTRACT */}
            {showCreateContractModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Generate Legal Contract</h3>
                                <p className="text-xs text-slate-500">Service Level Agreement & Licensing</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateContractModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitContract} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Target Hotel Tenant *</label>
                                <select
                                    required
                                    value={contractForm.data.tenant_id}
                                    onChange={(e) => contractForm.setData('tenant_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Contract Template *</label>
                                <select
                                    required
                                    value={contractForm.data.template_id}
                                    onChange={(e) => contractForm.setData('template_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                    {contract_templates.map((tpl) => (
                                        <option key={tpl.id} value={tpl.id}>
                                            {tpl.name} (v{tpl.version})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Plan Specification</label>
                                    <input
                                        type="text"
                                        value={contractForm.data.plan_name}
                                        onChange={(e) => contractForm.setData('plan_name', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Agreed Monthly Fee</label>
                                    <input
                                        type="text"
                                        value={contractForm.data.monthly_fee}
                                        onChange={(e) => contractForm.setData('monthly_fee', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateContractModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={contractForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Create Contract Document
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 12: VIEW & SIGN CONTRACT */}
            {showViewContractModal && selectedContractToView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">{selectedContractToView.title}</h3>
                                <p className="text-xs text-slate-500">
                                    Number: <span className="font-mono font-bold text-blue-600">{selectedContractToView.contract_number}</span> | Tenant: {selectedContractToView.tenant_name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowViewContractModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Rendered Contract Document */}
                        <div className="flex-1 overflow-y-auto my-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 prose prose-sm max-w-none text-slate-800 text-xs">
                            <div dangerouslySetInnerHTML={{ __html: selectedContractToView.rendered_content }} />

                            <div className="mt-6 pt-4 border-t border-slate-200">
                                <span className="font-mono text-[10px] text-slate-500 block">
                                    SHA-256 Document Verification Hash:
                                </span>
                                <span className="font-mono text-[10px] text-blue-700 font-bold break-all">
                                    {selectedContractToView.document_hash || 'PENDING_FINAL_SEAL'}
                                </span>
                            </div>
                        </div>

                        {/* Sign Action / Audit Stamp */}
                        <div className="shrink-0 pt-4 border-t border-slate-100">
                            {selectedContractToView.status === 'signed' ? (
                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                                    <div className="flex items-center gap-2 text-emerald-800">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <span className="font-bold block">Digitally Signed & Certified</span>
                                            <span className="text-[11px] text-emerald-700">
                                                By {selectedContractToView.signer_name} ({selectedContractToView.signer_title}) on {selectedContractToView.signed_at}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="font-mono text-[10px] text-emerald-600 font-bold bg-white px-2 py-1 rounded-md border border-emerald-200">
                                        IP: {selectedContractToView.signer_ip}
                                    </span>
                                </div>
                            ) : (
                                <form onSubmit={submitSignContract} className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <input
                                            type="text"
                                            required
                                            value={signContractForm.data.signer_name}
                                            onChange={(e) => signContractForm.setData('signer_name', e.target.value)}
                                            placeholder="Signer Full Name"
                                            className="px-3 py-1.5 rounded-lg border border-slate-300"
                                        />
                                        <input
                                            type="text"
                                            required
                                            value={signContractForm.data.signer_title}
                                            onChange={(e) => signContractForm.setData('signer_title', e.target.value)}
                                            placeholder="Job Title / Role"
                                            className="px-3 py-1.5 rounded-lg border border-slate-300"
                                        />
                                        <input
                                            type="email"
                                            required
                                            value={signContractForm.data.signer_email}
                                            onChange={(e) => signContractForm.setData('signer_email', e.target.value)}
                                            placeholder="Email"
                                            className="px-3 py-1.5 rounded-lg border border-slate-300"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowViewContractModal(false)}
                                            className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 text-xs cursor-pointer"
                                        >
                                            Close
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={signContractForm.processing}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>Apply Official E-Signature</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 13: BROADCAST NOTICE */}
            {showNoticeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Broadcast Platform Notice</h3>
                                <p className="text-xs text-slate-500">Real-time alert to hotel managers</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNoticeModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitNotice} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Target Audience *</label>
                                <select
                                    value={noticeForm.data.target_tenant_id}
                                    onChange={(e) => noticeForm.setData('target_tenant_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                    <option value="all">Broadcast to All Hotels (System-Wide)</option>
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} Only
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Notice Headline *</label>
                                <input
                                    type="text"
                                    required
                                    value={noticeForm.data.title}
                                    onChange={(e) => noticeForm.setData('title', e.target.value)}
                                    placeholder="e.g. Scheduled Infrastructure Upgrade Tonight"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Notice Message Body *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={noticeForm.data.message}
                                    onChange={(e) => noticeForm.setData('message', e.target.value)}
                                    placeholder="Andika ujumbe rasmi unaoenda kwa mameneja wote wa hoteli..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 leading-relaxed"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNoticeModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={noticeForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Broadcast Now</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CREATE GLOBAL SAAS USER */}
            {showCreateUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Create New SaaS / Hotel User</h3>
                                <p className="text-xs text-slate-500">Provision platform credentials with specific role and property scope.</p>
                            </div>
                            <button type="button" onClick={() => setShowCreateUserModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitCreateUser} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={createUserForm.data.name}
                                    onChange={(e) => createUserForm.setData('name', e.target.value)}
                                    placeholder="e.g. Kelvin Mlay"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={createUserForm.data.email}
                                    onChange={(e) => createUserForm.setData('email', e.target.value)}
                                    placeholder="e.g. k.mlay@inns.com"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Platform Role *</label>
                                    <select
                                        value={createUserForm.data.role}
                                        onChange={(e) => createUserForm.setData('role', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                                    >
                                        <option value="general_manager">General Manager</option>
                                        <option value="super_admin">Super Administrator</option>
                                        <option value="receptionist">Receptionist</option>
                                        <option value="accountant">Accountant</option>
                                        <option value="housekeeping">Housekeeping Supervisor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Hotel Scope</label>
                                    <select
                                        value={createUserForm.data.tenant_id}
                                        onChange={(e) => createUserForm.setData('tenant_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    >
                                        <option value="">Global / Platform User</option>
                                        {tenants.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                                <input
                                    type="password"
                                    required
                                    value={createUserForm.data.password}
                                    onChange={(e) => createUserForm.setData('password', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>
                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button type="button" onClick={() => setShowCreateUserModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createUserForm.processing} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Create User</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CREATE PROMO CODE */}
            {showCreatePromoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Create Marketing Promo Code</h3>
                                <p className="text-xs text-slate-500">Generate discount vouchers for prospective hotel onboarding.</p>
                            </div>
                            <button type="button" onClick={() => setShowCreatePromoModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitPromo} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Promo Coupon Code *</label>
                                <input
                                    type="text"
                                    required
                                    value={promoForm.data.code}
                                    onChange={(e) => promoForm.setData('code', e.target.value.toUpperCase())}
                                    placeholder="e.g. SABA2026"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Discount % *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        required
                                        value={promoForm.data.discount_percent}
                                        onChange={(e) => promoForm.setData('discount_percent', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Max Uses Allowed</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={promoForm.data.max_uses}
                                        onChange={(e) => promoForm.setData('max_uses', parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Applicable Tier</label>
                                    <select
                                        value={promoForm.data.applies_to}
                                        onChange={(e) => promoForm.setData('applies_to', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    >
                                        <option value="All Plans">All Plans</option>
                                        <option value="Hotel & Safari Pro">Hotel & Safari Pro</option>
                                        <option value="Enterprise Multi-Branch">Enterprise Multi-Branch</option>
                                        <option value="Boutique Starter">Boutique Starter</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Expiry Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={promoForm.data.expires_at}
                                        onChange={(e) => promoForm.setData('expires_at', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>
                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button type="button" onClick={() => setShowCreatePromoModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={promoForm.processing} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Save Promo Code</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: REPLY & RESOLVE SUPPORT TICKET */}
            {showReplyTicketModal && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <span className="font-mono text-[10px] font-bold text-blue-600 uppercase">
                                    Ticket #{selectedTicket.id}
                                </span>
                                <h3 className="font-extrabold text-base text-slate-900 mt-0.5">{selectedTicket.subject}</h3>
                                <p className="text-xs text-slate-500">{selectedTicket.tenant_name} • {selectedTicket.sender_name}</p>
                            </div>
                            <button type="button" onClick={() => setShowReplyTicketModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitReplyTicket} className="space-y-4 pt-4 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Tenant Inquiry Message
                                </span>
                                <p className="text-slate-800 leading-relaxed">{selectedTicket.message}</p>
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Resolution & Support Response Note</label>
                                <textarea
                                    rows={3}
                                    value={replyTicketForm.data.resolution_note}
                                    onChange={(e) => replyTicketForm.setData('resolution_note', e.target.value)}
                                    placeholder="Eleza jinsi tatizo lilivyotatuliwa au maelekezo uliyompa meneja wa hoteli..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="pt-2 flex items-center justify-between">
                                {selectedTicket.tenant_id && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReplyTicketModal(false);
                                            handleImpersonate(selectedTicket.tenant_id, selectedTicket.tenant_name);
                                        }}
                                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>Support Login as GM</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </button>
                                )}
                                <div className="flex items-center gap-2 ml-auto">
                                    <button type="button" onClick={() => setShowReplyTicketModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={replyTicketForm.processing} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Mark as Resolved</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
