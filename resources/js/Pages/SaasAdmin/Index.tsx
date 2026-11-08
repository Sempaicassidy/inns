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
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Clock,
    Coins,
    Copy,
    CreditCard,
    DollarSign,
    Edit3,
    ExternalLink,
    Eye,
    FileCheck,
    FileSpreadsheet,
    FileText,
    Globe,
    HelpCircle,
    Home,
    Image as ImageIcon,
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
    Sliders,
    Sparkles,
    ToggleLeft,
    Trash2,
    TrendingDown,
    TrendingUp,
    Truck,
    Upload,
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
    features?: Record<string, boolean>;
    features_count?: number;
    features_total?: number;
    features_detailed?: Array<{
        key: string;
        name: string;
        category: string;
        description: string;
        enabled: boolean;
    }>;
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
    available_features?: Array<{
        key: string;
        name: string;
        category: string;
        description: string;
        default_starter: boolean;
        default_pro: boolean;
        default_enterprise: boolean;
    }>;
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
    available_features = [],
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
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [selectedUserToEdit, setSelectedUserToEdit] = useState<any>(null);
    const [showCreatePromoModal, setShowCreatePromoModal] = useState(false);
    const [showReplyTicketModal, setShowReplyTicketModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);

    const createUserForm = useForm({
        name: '',
        email: '',
        role: 'owner',
        tenant_id: '',
        password: 'password123',
    });

    const editUserForm = useForm({
        name: '',
        email: '',
        role: 'general_manager',
        tenant_id: '',
        password: '',
        is_active: true,
    });

    const promoForm = useForm({
        code: '',
        discount_percent: 15,
        applies_to: 'All Plans',
        max_uses: 50,
        expires_at: '2026-12-31',
    });

    interface HeroSlideItem {
        id: string | number;
        badge: string;
        title: string;
        subtitle: string;
        image: string;
        file?: File | null;
        previewUrl?: string | null;
    }

    const defaultHeroSlides: HeroSlideItem[] = [
        {
            id: 'slide_1',
            badge: cms_content?.hero_badge || 'THE INNS • Centralized Hospitality OS 2026',
            title: cms_content?.hero_title || 'Complete Modern Cloud PMS for Hotels, Lodges & Resorts',
            subtitle: cms_content?.hero_subtitle || 'Manage rooms, front desk, reservations, legal contracts, invoices, payment receipts, POS, and financial reporting seamlessly on one unified cloud platform.',
            image: cms_content?.hero_image || '/uploads/cms/hero_1794042362.png',
            previewUrl: cms_content?.hero_image || '/uploads/cms/hero_1794042362.png',
        },
        {
            id: 'slide_2',
            badge: 'SAFARI & BOUTIQUE LODGES',
            title: 'Modern Operations for Safari Lodges, Camps & Luxury Boutique Resorts',
            subtitle: 'Track guest stays, room calendar Gantt racks, folios and payments, with automated daily manager flash reports via SMS and WhatsApp.',
            image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&q=80&fit=crop',
            previewUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&q=80&fit=crop',
        },
        {
            id: 'slide_3',
            badge: 'RESTAURANT & BAR TOUCHSCREEN POS',
            title: 'Touchscreen Restaurant POS, Grocery Minimart & Automated Night Audit',
            subtitle: 'Fast sales ordering for resident and walk-in guests, kitchen KOT tickets, inventory stock management, and double-entry accounting ledger.',
            image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe524?w=1920&q=80&fit=crop',
            previewUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe524?w=1920&q=80&fit=crop',
        },
        {
            id: 'slide_4',
            badge: 'MULTI-PROPERTY CENTRALIZED CLOUD',
            title: 'Manage Multiple Hotel Properties & Branches From a Single Command Hub',
            subtitle: 'Consolidate multiple branches across regions, benchmark property revenue performance in real-time, enforce RBAC permissions, and eliminate revenue leakage.',
            image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80&fit=crop',
            previewUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80&fit=crop',
        },
    ];

    const initialSlides: HeroSlideItem[] = (cms_content?.hero_slides && Array.isArray(cms_content.hero_slides) && cms_content.hero_slides.length > 0)
        ? cms_content.hero_slides.map((s: any, idx: number) => ({
            id: s.id || `slide_${idx + 1}`,
            badge: s.badge || 'THE INNS • Hospitality OS',
            title: s.title || '',
            subtitle: s.subtitle || '',
            image: s.image || '',
            previewUrl: s.image || '',
        }))
        : defaultHeroSlides;

    const [heroSlidesList, setHeroSlidesList] = useState<HeroSlideItem[]>(initialSlides);
    const [activePreviewIndex, setActivePreviewIndex] = useState(0);
    const [isSavingCms, setIsSavingCms] = useState(false);

    const handleUpdateSlideField = (index: number, field: keyof HeroSlideItem, value: any) => {
        setHeroSlidesList((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            if (field === 'image') {
                next[index].previewUrl = value;
            }
            return next;
        });
    };

    const handleSlideFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            setHeroSlidesList((prev) => {
                const next = [...prev];
                next[index] = {
                    ...next[index],
                    file: file,
                    previewUrl: preview,
                };
                return next;
            });
        }
    };

    const handleAddSlide = () => {
        const newId = `slide_${Date.now()}`;
        const newIndex = heroSlidesList.length + 1;
        const newSlide: HeroSlideItem = {
            id: newId,
            badge: `NEW HOSPITALITY MODULE • SLIDE ${newIndex}`,
            title: `Next-Generation Hotel Management #${newIndex}`,
            subtitle: 'Provide a brief summary of the key features, advantages, and operational speed of the platform here.',
            image: 'https://images.unsplash.com/photo-1566073741257-6a1056039daa?w=1920&q=80&fit=crop',
            previewUrl: 'https://images.unsplash.com/photo-1566073741257-6a1056039daa?w=1920&q=80&fit=crop',
        };
        setHeroSlidesList((prev) => [...prev, newSlide]);
        setActivePreviewIndex(heroSlidesList.length);
    };

    const handleRemoveSlide = (index: number) => {
        if (heroSlidesList.length <= 1) {
            alert('Cannot remove this slide. The platform requires at least 1 slide for the hero showcase.');
            return;
        }
        if (window.confirm(`Are you sure you want to remove Slide #${index + 1}?`)) {
            setHeroSlidesList((prev) => prev.filter((_, i) => i !== index));
            setActivePreviewIndex(0);
        }
    };

    const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= heroSlidesList.length) return;
        setHeroSlidesList((prev) => {
            const next = [...prev];
            const item = next[index];
            next[index] = next[targetIndex];
            next[targetIndex] = item;
            return next;
        });
        setActivePreviewIndex(targetIndex);
    };

    const [heroImagePreview, setHeroImagePreview] = useState<string | null>(cms_content?.hero_image || null);

    const liveCmsForm = useForm({
        hero_title: cms_content?.hero_title || 'Complete Modern Cloud PMS for Hotels, Lodges & Resorts',
        hero_subtitle: cms_content?.hero_subtitle || 'Manage rooms, front desk, reservations, legal contracts, invoices, payment receipts, POS, and financial reporting seamlessly on one unified cloud platform.',
        hero_cta_text: cms_content?.hero_cta_text || 'Start 14-Day Free Trial',
        demo_cta_text: cms_content?.demo_cta_text || 'Schedule a Live Platform Demo',
        hero_badge: cms_content?.hero_badge || 'THE INNS • Centralized Hospitality OS 2026',
        demo_cta_phone: cms_content?.demo_cta_phone || '+255 744 396 220',
        hero_image: null as File | null,
        remove_hero_image: false,
    });

    const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            liveCmsForm.setData('hero_image', file);
            liveCmsForm.setData('remove_hero_image', false);
            setHeroImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveHeroImage = () => {
        liveCmsForm.setData('hero_image', null);
        liveCmsForm.setData('remove_hero_image', true);
        setHeroImagePreview(null);
    };

    const replyTicketForm = useForm({
        ticket_id: '',
        resolution_note: '',
    });

    // Modals visibility
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [showEditTenantModal, setShowEditTenantModal] = useState(false);
    const [selectedTenantToEdit, setSelectedTenantToEdit] = useState<TenantItem | null>(null);

    // Feature Control Panel modal state
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [selectedTenantForFeatures, setSelectedTenantForFeatures] = useState<TenantItem | null>(null);
    const [featureSearch, setFeatureSearch] = useState('');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

    const featureForm = useForm<{
        features: Record<string, boolean>;
    }>({
        features: {},
    });

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
        admin_role: 'owner',
        admin_name: '',
        admin_email: '',
        admin_password: '',
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
        recipient_phone: '+255779646632',
        recipient_name: 'Hotel Manager',
        message: 'Hello! This is an official test notification from the WhatsApp Cloud Business API gateway configured for THE INNS platform.',
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
        description: 'Monthly INNS Cloud PMS Software License & Support',
    });

    const invoiceForm = useForm({
        tenant_id: tenants[0]?.id || '',
        description: 'Monthly INNS Cloud PMS Software Subscription',
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
        if (confirm('Are you sure you want to change the active/suspended status for this hotel?')) {
            router.post(route('saas-admin.tenants.toggle', tenantId), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleImpersonate = (tenantId: string, tenantName: string) => {
        if (confirm(`Do you want to access the workspace for "${tenantName}" as General Manager?`)) {
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

    const handleOpenFeatureModal = (tenant: TenantItem) => {
        setSelectedTenantForFeatures(tenant);
        const initialMap: Record<string, boolean> = {};
        if (available_features && available_features.length > 0) {
            available_features.forEach((f: any) => {
                if (tenant.features && typeof tenant.features[f.key] !== 'undefined') {
                    initialMap[f.key] = Boolean(tenant.features[f.key]);
                } else if (tenant.plan === 'enterprise') {
                    initialMap[f.key] = true;
                } else if (tenant.plan === 'starter') {
                    initialMap[f.key] = Boolean(f.default_starter);
                } else {
                    initialMap[f.key] = Boolean(f.default_pro);
                }
            });
        }
        featureForm.setData('features', initialMap);
        setFeatureSearch('');
        setActiveCategoryFilter('all');
        setShowFeatureModal(true);
    };

    const handleApplyPreset = (presetName: 'starter' | 'pro' | 'enterprise' | 'none') => {
        if (!available_features) return;
        const newMap: Record<string, boolean> = {};
        available_features.forEach((f: any) => {
            if (presetName === 'none') {
                newMap[f.key] = false;
            } else if (presetName === 'starter') {
                newMap[f.key] = Boolean(f.default_starter);
            } else if (presetName === 'pro') {
                newMap[f.key] = Boolean(f.default_pro);
            } else if (presetName === 'enterprise') {
                newMap[f.key] = true;
            }
        });
        featureForm.setData('features', newMap);
    };

    const handleToggleSingleFeature = (featureKey: string) => {
        const current = featureForm.data.features[featureKey] ?? true;
        featureForm.setData('features', {
            ...featureForm.data.features,
            [featureKey]: !current,
        });
    };

    const submitSaveFeatures = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantForFeatures) return;
        featureForm.put(route('saas-admin.tenants.features.update', selectedTenantForFeatures.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowFeatureModal(false);
            },
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
        if (confirm('Are you sure you want to convert this quotation into an official SaaS invoice?')) {
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
        if (confirm('Verify and approve this payment to generate an official SaaS receipt and extend the hotel subscription?')) {
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
        if (confirm('Are you sure you want to clear all platform caches (Config, Routes, Views, Application Cache)?')) {
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

    const handleOpenEditUser = (u: any) => {
        setSelectedUserToEdit(u);
        editUserForm.setData({
            name: u.name,
            email: u.email,
            role: u.role,
            tenant_id: u.tenant_id ? String(u.tenant_id) : '',
            password: '',
            is_active: Boolean(u.is_active ?? true),
        });
        setShowEditUserModal(true);
    };

    const submitEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserToEdit) return;
        editUserForm.put(route('saas-admin.users.update', selectedUserToEdit.id), {
            onSuccess: () => {
                setShowEditUserModal(false);
                editUserForm.reset();
            },
        });
    };

    const handleDeleteUser = (u: any) => {
        if (confirm(`Are you sure you want to delete user "${u.name}" (${u.email})? This action cannot be undone.`)) {
            router.delete(route('saas-admin.users.destroy', u.id));
        }
    };

    const handleDeleteTenant = (tenant: TenantItem) => {
        if (confirm(`Warning: Are you sure you want to delete hotel tenant "${tenant.name}"? This will deactivate all associated user accounts and archive the hotel workspace.`)) {
            router.delete(route('saas-admin.tenants.destroy', tenant.id));
        }
    };

    const handleToggleUserStatus = (userId: number, userName: string) => {
        if (confirm(`Change active/suspended status for user "${userName}"?`)) {
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
        setIsSavingCms(true);

        const formData = new FormData();
        formData.append('hero_cta_text', liveCmsForm.data.hero_cta_text);
        formData.append('demo_cta_text', liveCmsForm.data.demo_cta_text);
        formData.append('demo_cta_phone', liveCmsForm.data.demo_cta_phone);

        // Slides metadata without non-serializable properties
        const sanitizedSlides = heroSlidesList.map((s, idx) => ({
            id: s.id || `slide_${idx + 1}`,
            badge: s.badge,
            title: s.title,
            subtitle: s.subtitle,
            image: s.image,
        }));
        formData.append('hero_slides', JSON.stringify(sanitizedSlides));

        // Sync first slide as top-level hero for compatibility
        if (heroSlidesList[0]) {
            formData.append('hero_title', heroSlidesList[0].title);
            formData.append('hero_subtitle', heroSlidesList[0].subtitle);
            formData.append('hero_badge', heroSlidesList[0].badge);
        }

        // Attach slide image files
        heroSlidesList.forEach((s, idx) => {
            if (s.file) {
                formData.append(`slide_file_${idx}`, s.file);
            }
        });

        router.post(route('saas-admin.cms.update'), formData, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: () => setIsSavingCms(false),
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
                {/* 1. TOP HEADER (Slim & Clean) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                            THE INNS Centralized SaaS Ecosystem
                        </h1>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setShowOnboardModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
                        >
                            <span>Onboard Hotel</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedTenantForSms(tenants[0]?.id || '');
                                smsForm.setData('tenant_id', tenants[0]?.id || '');
                                setShowIssueSmsModal(true);
                            }}
                            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition cursor-pointer"
                        >
                            <span>Issue SMS</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreateInvoiceModal(true)}
                            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition cursor-pointer"
                        >
                            <span>New Invoice</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowNoticeModal(true)}
                            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition cursor-pointer"
                        >
                            <span>Broadcast</span>
                        </button>
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

                {/* 3. SUB-NAVIGATION TABS (Grouped & Clean) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {/* Group: Core */}
                        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                            {[
                                { key: 'overview', label: 'Command Center' },
                                { key: 'tenants', label: `Hotels (${tenants.length})` },
                            ].map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => handleSwitchTab(tab.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Group: Subscriptions & Billing */}
                        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                            {[
                                { key: 'subscriptions', label: 'Subscriptions & Plans' },
                                { key: 'billing', label: `Invoices (${invoices.length})` },
                                { key: 'contracts', label: `Contracts (${contracts.length})` },
                            ].map((tab) => {
                                const isActive =
                                    activeTab === tab.key ||
                                    (tab.key === 'subscriptions' && activeTab === 'plans');
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => handleSwitchTab(tab.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Group: Messaging */}
                        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                            {[
                                { key: 'sms', label: 'Financial SMS' },
                                { key: 'whatsapp', label: 'WhatsApp Cloud' },
                            ].map((tab) => {
                                const isActive =
                                    activeTab === tab.key ||
                                    (tab.key === 'sms' && (activeTab === 'sms_wallets' || activeTab === 'sms_issue' || activeTab === 'sms_provider')) ||
                                    (tab.key === 'whatsapp' && (activeTab === 'whatsapp_templates' || activeTab === 'whatsapp_logs'));
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => handleSwitchTab(tab.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Group: Website & Marketing */}
                        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                            {[
                                { key: 'cms_landing', label: 'Website & CMS' },
                                { key: 'marketing', label: `Demos & Leads (${demo_requests.length})` },
                            ].map((tab) => {
                                const isActive =
                                    activeTab === tab.key ||
                                    (tab.key === 'cms_landing' && (activeTab === 'cms_landing' || activeTab === 'cms_pricing' || activeTab === 'cms_faqs')) ||
                                    (tab.key === 'marketing' && (activeTab === 'marketing' || activeTab === 'demos' || activeTab === 'funnel'));
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => handleSwitchTab(tab.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Group: Platform Admin */}
                        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                            {[
                                { key: 'notices', label: `Alerts (${notices.length})` },
                                { key: 'support', label: `Support (${support_tickets.length})` },
                                { key: 'users', label: 'Users & Roles' },
                                { key: 'system', label: 'System Admin' },
                            ].map((tab) => {
                                const isActive =
                                    activeTab === tab.key ||
                                    (tab.key === 'notices' && (activeTab === 'notices' || activeTab === 'system_alerts')) ||
                                    (tab.key === 'support' && activeTab === 'support') ||
                                    (tab.key === 'users' && (activeTab === 'roles' || activeTab === 'users')) ||
                                    (tab.key === 'system' && activeTab === 'system');
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => handleSwitchTab(tab.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 4. TAB CONTENTS */}

                {/* TAB 1: EXECUTIVE COMMAND CENTER OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Executive Summary Cards (6 KPIs) */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
                            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Platform ARR</span>
                                <div className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate">
                                    TZS {new Intl.NumberFormat('en-TZ').format(kpis.monthly_revenue * 12)}
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 mt-0.5 block">Annual Run Rate</span>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly MRR</span>
                                <div className="text-base sm:text-lg font-black text-emerald-700 mt-1 truncate">
                                    TZS {new Intl.NumberFormat('en-TZ').format(kpis.monthly_revenue)}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">Active Recurring</span>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hotels Active</span>
                                <div className="text-base sm:text-lg font-black text-blue-700 mt-1">
                                    {kpis.active_subscriptions} <span className="text-xs text-slate-400 font-semibold">/ {kpis.total_tenants}</span>
                                </div>
                                <span className="text-[10px] font-bold text-blue-600 mt-0.5 block">{kpis.trial_tenants} Trials • {kpis.suspended_tenants} Paused</span>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Rooms</span>
                                <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                                    {system_health?.total_rooms || 240}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">In Network</span>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SMS Master Balance</span>
                                <div className="text-base sm:text-lg font-black text-amber-700 mt-1 truncate">
                                    {new Intl.NumberFormat('en-TZ').format(kpis.sms_balance)}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">SwalaSMS Credits</span>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Actions</span>
                                <div className="text-base sm:text-lg font-black text-indigo-700 mt-1">
                                    {demo_requests.length} Leads
                                </div>
                                <span className="text-[10px] font-bold text-rose-600 mt-0.5 block">{support_tickets.filter((t: any) => t.status === 'open').length} Open Tickets</span>
                            </div>
                        </div>

                        {/* Mid Section: Quick Action Launchpad & Infrastructure Cluster */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Left: Quick Actions & Plan Distribution (7 Cols) */}
                            <div className="lg:col-span-7 space-y-5">
                                {/* Quick Actions */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                                    <h3 className="font-extrabold text-sm text-slate-900">Executive Quick Actions</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setShowOnboardModal(true)}
                                            className="p-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-800 text-left transition border border-blue-100"
                                        >
                                            <span className="font-bold text-xs block">+ Onboard Hotel</span>
                                            <span className="text-[10px] text-blue-600 block mt-0.5">Setup new property</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateQuotationModal(true)}
                                            className="p-3 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-left transition border border-emerald-100"
                                        >
                                            <span className="font-bold text-xs block">Create Quotation</span>
                                            <span className="text-[10px] text-emerald-600 block mt-0.5">Pro-forma contract</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (tenants.length > 0) handleOpenIssueSms(tenants[0].id);
                                            }}
                                            className="p-3 rounded-xl bg-amber-50/80 hover:bg-amber-100 text-amber-800 text-left transition border border-amber-100"
                                        >
                                            <span className="font-bold text-xs block">Top-up SMS</span>
                                            <span className="text-[10px] text-amber-600 block mt-0.5">Hotel credit wallet</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowNoticeModal(true)}
                                            className="p-3 rounded-xl bg-purple-50/80 hover:bg-purple-100 text-purple-800 text-left transition border border-purple-100"
                                        >
                                            <span className="font-bold text-xs block">Broadcast Alert</span>
                                            <span className="text-[10px] text-purple-600 block mt-0.5">System message to GMs</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSwitchTab('cms_landing')}
                                            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-left transition border border-slate-200"
                                        >
                                            <span className="font-bold text-xs block">Landing Hero CMS</span>
                                            <span className="text-[10px] text-slate-500 block mt-0.5">Upload hero image</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearCache}
                                            className="p-3 rounded-xl bg-rose-50/80 hover:bg-rose-100 text-rose-800 text-left transition border border-rose-100"
                                        >
                                            <span className="font-bold text-xs block">Flush System Cache</span>
                                            <span className="text-[10px] text-rose-600 block mt-0.5">Optimize speed</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Plan Breakdown */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
                                    <h3 className="font-extrabold text-sm text-slate-900">SaaS Plan Distribution</h3>
                                    <div className="space-y-2.5">
                                        <div>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-bold text-slate-800">Safari Pro (Multi-Branch)</span>
                                                <span className="text-slate-500 font-semibold">{tenants.filter(t => t.plan === 'pro' || t.plan === 'safari_pro').length} Hotels</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.max(15, (tenants.filter(t => t.plan === 'pro' || t.plan === 'safari_pro').length / Math.max(1, tenants.length)) * 100)}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-bold text-slate-800">Luxury Enterprise</span>
                                                <span className="text-slate-500 font-semibold">{tenants.filter(t => t.plan === 'enterprise').length} Hotels</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${Math.max(15, (tenants.filter(t => t.plan === 'enterprise').length / Math.max(1, tenants.length)) * 100)}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-bold text-slate-800">Boutique Starter</span>
                                                <span className="text-slate-500 font-semibold">{tenants.filter(t => t.plan === 'starter' || t.plan === 'boutique_starter').length} Hotels</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(15, (tenants.filter(t => t.plan === 'starter' || t.plan === 'boutique_starter').length / Math.max(1, tenants.length)) * 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Infrastructure & Telephony Status (5 Cols) */}
                            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                    <h3 className="font-extrabold text-sm text-slate-900">Platform Infrastructure Status</h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        100% Operational
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-100 text-xs">
                                    <div className="py-2.5 flex items-center justify-between">
                                        <span className="text-slate-500">App Environment</span>
                                        <span className="font-mono font-bold text-slate-900">WAMP Production Node</span>
                                    </div>
                                    <div className="py-2.5 flex items-center justify-between">
                                        <span className="text-slate-500">PHP Version</span>
                                        <span className="font-mono font-bold text-slate-900">{system_health?.php_version || 'PHP 8.3'}</span>
                                    </div>
                                    <div className="py-2.5 flex items-center justify-between">
                                        <span className="text-slate-500">Laravel Framework</span>
                                        <span className="font-mono font-bold text-slate-900">{system_health?.laravel_version || '12.0'}</span>
                                    </div>
                                    <div className="py-2.5 flex items-center justify-between">
                                        <span className="text-slate-500">Database Engine</span>
                                        <span className="font-mono font-bold text-slate-900">{system_health?.database_status || 'MySQL InnoDB'}</span>
                                    </div>
                                    <div className="py-2.5 flex items-center justify-between">
                                        <span className="text-slate-500">Financial SMS Gateway</span>
                                        <span className="font-bold text-emerald-700">SwalaSMS Active (SWALATECH)</span>
                                    </div>
                                    <div className="py-2.5 flex items-center justify-between">
                                        <span className="text-slate-500">Automated Daily Backups</span>
                                        <span className="font-semibold text-slate-700">Active (03:00 AM)</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchTab('tenants')}
                                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                                    >
                                        Go to Full Tenant Directory →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Onboarded Hotels */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-extrabold text-sm text-slate-900">Recently Onboarded Hotel Properties</h3>
                                <button
                                    type="button"
                                    onClick={() => handleSwitchTab('tenants')}
                                    className="text-xs font-bold text-blue-600 hover:underline"
                                >
                                    View All ({tenants.length}) →
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                            <th className="py-2.5 px-4">Hotel Group</th>
                                            <th className="py-2.5 px-3">Plan</th>
                                            <th className="py-2.5 px-3">Branches</th>
                                            <th className="py-2.5 px-3">SMS Wallet</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tenants.slice(0, 5).map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50/60 transition">
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-slate-900 block">{t.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{t.subdomain}.theinns.com</span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                                                        {t.plan_name || t.plan}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 font-semibold text-slate-700">
                                                    {t.properties_count} Properties
                                                </td>
                                                <td className="py-3 px-3 font-mono font-bold text-slate-800">
                                                    {new Intl.NumberFormat('en-TZ').format(t.sms_balance)} cr
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                        {t.is_active ? 'Active' : 'Suspended'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImpersonate(t.id, t.name)}
                                                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs rounded-lg transition"
                                                    >
                                                        Access
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 1B: DEDICATED HOTEL TENANTS DIRECTORY */}
                {activeTab === 'tenants' && (
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
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenFeatureModal(tenant)}
                                                        title="Configure Module Entitlements & Features"
                                                        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 hover:text-indigo-900 px-2 py-0.5 rounded-md border border-indigo-200/80 transition cursor-pointer"
                                                    >
                                                        <Sliders className="w-2.5 h-2.5 text-indigo-600" />
                                                        <span>{tenant.features_count ?? 19}/{tenant.features_total ?? 19} Modules</span>
                                                    </button>
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

                                                        {/* Feature Control Panel */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenFeatureModal(tenant)}
                                                            title="Module Entitlements & Features Control Panel"
                                                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                                        >
                                                            <Sliders className="w-4 h-4" />
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
                                                                    ? 'text-amber-500 hover:bg-amber-50'
                                                                    : 'text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                        >
                                                            <Power className="w-4 h-4" />
                                                        </button>

                                                        {/* Delete Tenant */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTenant(tenant)}
                                                            title="Delete Hotel Tenant"
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                                    
                                    <span>Create Quotation</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateInvoiceModal(true)}
                                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    
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
                                            <option value="owner">👑 Hotel Owner / Director</option>
                                            <option value="super_admin">⚡ Super Admin</option>
                                            <option value="general_manager">👔 General Manager</option>
                                            <option value="receptionist">🏨 Receptionist</option>
                                            <option value="accountant">💰 Accountant</option>
                                            <option value="housekeeping">🧹 Housekeeping</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateUserModal(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                                    >
                                        
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
                                                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                                                <span>{u.email}</span>
                                                                {u.username && (
                                                                    <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">@{u.username}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                                                {u.tenant_name}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                u.role === 'super_admin'
                                                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                                    : u.role === 'owner'
                                                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                                                                    : u.role === 'general_manager'
                                                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                                    : u.role === 'receptionist'
                                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                            }`}>
                                                                {u.role === 'owner' ? '👑 Owner' : u.role.replace('_', ' ')}
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
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                {/* Edit User */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenEditUser(u)}
                                                                    title="Edit User Details & Password"
                                                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>

                                                                {/* Toggle Active */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleUserStatus(u.id, u.name)}
                                                                    title={u.is_active ? 'Deactivate User' : 'Activate User'}
                                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                                                        u.is_active
                                                                            ? 'text-amber-700 hover:bg-amber-50 border border-amber-200'
                                                                            : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                                                                    }`}
                                                                >
                                                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                                                </button>

                                                                {/* Delete User */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteUser(u)}
                                                                    title="Delete User Account"
                                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
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
                            <div className="space-y-6">
                                {/* Top Control Bar */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-base text-slate-900 tracking-tight">Hero Slideshow & Landing Page Manager</h3>
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                                                {heroSlidesList.length} Active Slides
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                                            Dhibiti picha na maandishi ya slides za Hero section (nyuma ya maandishi). Idadi ya slides zitakazoonekana kwenye ukurasa wa mbele (Landing Page) inalingana moja kwa moja na idadi ya slides ulizoweka hapa.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleAddSlide}
                                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 stroke-[2.5]" />
                                            <span>Ongeza Slide Mpya</span>
                                        </button>
                                        <a
                                            href="/"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                                        >
                                            <span>Tazama Live</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    {/* Left: Slides Editor Form */}
                                    <form onSubmit={submitCmsUpdate} className="lg:col-span-7 space-y-4">
                                        <div className="space-y-4">
                                            {heroSlidesList.map((slide, idx) => {
                                                const isActivePreview = activePreviewIndex === idx;
                                                return (
                                                    <div
                                                        key={slide.id || idx}
                                                        className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                                                            isActivePreview ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                                                        }`}
                                                    >
                                                        {/* Slide Header Toolbar */}
                                                        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                                                                    {idx + 1}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <span className="font-bold text-xs text-slate-900 block truncate">
                                                                        {slide.title || `Slide #${idx + 1}`}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500 font-medium truncate block">
                                                                        {slide.badge || 'THE INNS • Slide'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Slide Ordering & Actions */}
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveSlide(idx, 'up')}
                                                                    disabled={idx === 0}
                                                                    title="Sogeza Juu (Move Up)"
                                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                                                                >
                                                                    <ChevronUp className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveSlide(idx, 'down')}
                                                                    disabled={idx === heroSlidesList.length - 1}
                                                                    title="Sogeza Chini (Move Down)"
                                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                                                                >
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActivePreviewIndex(idx)}
                                                                    title="Tazama Kwenye Simulation"
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                                                        isActivePreview ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                                                                    }`}
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    <span>Preview</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveSlide(idx)}
                                                                    disabled={heroSlidesList.length <= 1}
                                                                    title="Delete Slide"
                                                                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Slide Edit Fields */}
                                                        <div className="p-4 space-y-3.5 text-xs">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div className="sm:col-span-2">
                                                                    <label className="font-bold text-slate-700 block mb-1">
                                                                        Slide Badge / Tagline (Lebo ya Juu) *
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        required
                                                                        value={slide.badge}
                                                                        onChange={(e) => handleUpdateSlideField(idx, 'badge', e.target.value)}
                                                                        placeholder="Mfano: THE INNS • Centralized Hospitality OS 2026"
                                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                                                                    />
                                                                </div>

                                                                <div className="sm:col-span-2">
                                                                    <label className="font-bold text-slate-700 block mb-1">
                                                                        Slide Headline *
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        required
                                                                        value={slide.title}
                                                                        onChange={(e) => handleUpdateSlideField(idx, 'title', e.target.value)}
                                                                        placeholder="e.g. Next-Generation Cloud Hospitality Management Platform..."
                                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                                                                    />
                                                                </div>

                                                                <div className="sm:col-span-2">
                                                                    <label className="font-bold text-slate-700 block mb-1">
                                                                        Slide Subheadline (Maelezo ya Kina) *
                                                                    </label>
                                                                    <textarea
                                                                        rows={2}
                                                                        required
                                                                        value={slide.subtitle}
                                                                        onChange={(e) => handleUpdateSlideField(idx, 'subtitle', e.target.value)}
                                                                        placeholder="Dhibiti vyumba, mapokezi, mikataba, ankara na risiti..."
                                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 leading-relaxed"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Slide Background Image Control */}
                                                            <div className="pt-2 border-t border-slate-100">
                                                                <label className="font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                                                                    <span>Picha ya Slide (Background Image)</span>
                                                                    <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, WebP</span>
                                                                </label>

                                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                                                    {/* Thumbnail */}
                                                                    <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-slate-300 shadow-2xs shrink-0 bg-slate-900 group">
                                                                        <img
                                                                            src={slide.previewUrl || slide.image}
                                                                            onError={(e) => {
                                                                                const target = e.currentTarget;
                                                                                if (slide.image && slide.image.startsWith('/uploads/') && !target.src.includes('/inns/')) {
                                                                                    target.src = '/inns' + slide.image;
                                                                                }
                                                                            }}
                                                                            alt=""
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[9px] text-white font-bold">
                                                                            Slide #{idx + 1}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex-1 space-y-2 w-full">
                                                                        <div>
                                                                            <span className="text-[10px] text-slate-500 block mb-1 font-semibold">1. Pakia kutoka kwenye kompyuta:</span>
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                onChange={(e) => handleSlideFileChange(idx, e)}
                                                                                className="block w-full text-xs text-slate-500 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] text-slate-500 block mb-1 font-semibold">2. Au weka Link / URL ya picha moja kwa moja:</span>
                                                                            <input
                                                                                type="text"
                                                                                value={slide.image}
                                                                                onChange={(e) => handleUpdateSlideField(idx, 'image', e.target.value)}
                                                                                placeholder="https://... au /uploads/cms/..."
                                                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-mono focus:ring-1 focus:ring-blue-500"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Global CTA Buttons Settings */}
                                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5 text-xs">
                                            <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                                <span>Global CTA Buttons (Vitufe vya Chini ya Hero Section)</span>
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="font-bold text-slate-700 block mb-1">Primary CTA Label</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={liveCmsForm.data.hero_cta_text}
                                                        onChange={(e) => liveCmsForm.setData('hero_cta_text', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="font-bold text-slate-700 block mb-1">Demo Request Label</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={liveCmsForm.data.demo_cta_text}
                                                        onChange={(e) => liveCmsForm.setData('demo_cta_text', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="font-bold text-slate-700 block mb-1">Demo Request Phone</label>
                                                    <input
                                                        type="text"
                                                        value={liveCmsForm.data.demo_cta_phone}
                                                        onChange={(e) => liveCmsForm.setData('demo_cta_phone', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Action Buttons */}
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleAddSlide}
                                                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>+ Ongeza Slide Nyingine ({heroSlidesList.length + 1})</span>
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={isSavingCms}
                                                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
                                            >
                                                {isSavingCms ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                        <span>Inahifadhi Slides Zote...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4 stroke-[3]" />
                                                        <span>Hifadhi Slides Zote ({heroSlidesList.length}) & Publish Live</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Right: Live WYSIWYG Simulation */}
                                    <div className="lg:col-span-5 sticky top-6 space-y-4">
                                        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                                            {/* Simulation Header */}
                                            <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-xs font-extrabold tracking-tight">Live Hero Simulation</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    Slide {activePreviewIndex + 1} of {heroSlidesList.length}
                                                </span>
                                            </div>

                                            {/* Slide Selector Tabs */}
                                            <div className="flex items-center gap-1.5 p-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto">
                                                {heroSlidesList.map((_, sIdx) => (
                                                    <button
                                                        key={sIdx}
                                                        type="button"
                                                        onClick={() => setActivePreviewIndex(sIdx)}
                                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition shrink-0 cursor-pointer ${
                                                            activePreviewIndex === sIdx
                                                                ? 'bg-[#D4AF37] text-slate-950 shadow-xs'
                                                                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
                                                        }`}
                                                    >
                                                        Slide {sIdx + 1}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Simulated Hero Section Stage */}
                                            {(() => {
                                                const currentPreview = heroSlidesList[activePreviewIndex] || heroSlidesList[0] || {};
                                                return (
                                                    <div className="relative p-6 sm:p-7 min-h-[360px] flex flex-col justify-between overflow-hidden">
                                                        {/* Simulated Background Image */}
                                                        <div className="absolute inset-0 -z-10">
                                                            <img
                                                                src={currentPreview.previewUrl || currentPreview.image}
                                                                onError={(e) => {
                                                                    const target = e.currentTarget;
                                                                    if (currentPreview.image && currentPreview.image.startsWith('/uploads/') && !target.src.includes('/inns/')) {
                                                                        target.src = '/inns' + currentPreview.image;
                                                                    }
                                                                }}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {/* Exact Soft Overlay Gradient from Welcome.tsx */}
                                                            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/15 to-white/65" />
                                                        </div>

                                                        {/* Simulated Live Content */}
                                                        <div className="space-y-3.5 text-center relative z-10 my-auto">
                                                            {/* Badge */}
                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#8c7003] font-black text-[10px] border border-[#D4AF37]/50 shadow-xs">
                                                                <Sparkles className="w-3 h-3" />
                                                                <span>{currentPreview.badge || 'THE INNS • OS'}</span>
                                                            </div>

                                                            {/* Headline */}
                                                            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)]">
                                                                {currentPreview.title || 'Slide Headline'}
                                                            </h2>

                                                            {/* Subtitle */}
                                                            <p className="text-xs text-slate-900 font-bold leading-relaxed max-w-sm mx-auto drop-shadow-[0_1px_6px_rgba(255,255,255,0.9)]">
                                                                {currentPreview.subtitle || 'Slide Subtitle'}
                                                            </p>

                                                            {/* CTA Buttons */}
                                                            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                                                <span className="px-4 py-2 bg-[#D4AF37] text-[#1E3A5F] font-black text-[11px] rounded-xl shadow-xs">
                                                                    {liveCmsForm.data.hero_cta_text}
                                                                </span>
                                                                <span className="px-4 py-2 bg-[#1E3A5F] text-white font-bold text-[11px] rounded-xl shadow-xs">
                                                                    {liveCmsForm.data.demo_cta_text}
                                                                </span>
                                                            </div>

                                                            {/* Simulated Indicator Dots matching total count */}
                                                            <div className="flex items-center justify-center gap-1.5 pt-3">
                                                                {heroSlidesList.map((_, dIdx) => (
                                                                    <span
                                                                        key={dIdx}
                                                                        onClick={() => setActivePreviewIndex(dIdx)}
                                                                        className={`transition-all rounded-full cursor-pointer ${
                                                                            dIdx === activePreviewIndex
                                                                                ? 'w-6 h-2 bg-[#D4AF37]'
                                                                                : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                                                                        }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Simulation Footer */}
                                                        <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                                            <span className="flex items-center gap-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                <span>{heroSlidesList.length} Slides zitazunguka kiotomatiki</span>
                                                            </span>
                                                            <span className="font-bold text-slate-700">100% Dynamic</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Helper Tips Card */}
                                        <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5">
                                            <span className="font-extrabold flex items-center gap-1.5 text-blue-800">
                                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Ufafanuzi wa Hero Slides:</span>
                                            </span>
                                            <p className="text-[11px] text-blue-700 leading-relaxed">
                                                Kila slide unayoongeza au kubadilisha hapa itakuwa na picha yake nyuma ya maandishi na maandishi yake yanayobadilika kwa pamoja kwenye Landing Page. Idadi ya vidoti (dots) chini itaongezeka au kupungua kulingana na idadi ya slides ulizoweka.
                                            </p>
                                        </div>
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

                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                                <div>
                                    <span className="font-bold text-slate-800 block text-xs">Primary Administrative Account</span>
                                    <span className="text-[10px] text-slate-500">Akaunti ya kwanza ya uongozi itakayokabidhiwa hoteli hii.</span>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Account Role *</label>
                                    <select
                                        value={onboardForm.data.admin_role || 'owner'}
                                        onChange={(e) => onboardForm.setData('admin_role', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-semibold bg-white text-xs"
                                    >
                                        <option value="owner">👑 Hotel Owner / Director (Mmiliki wa Hoteli) — Recommended</option>
                                        <option value="general_manager">👔 General Manager (Meneja Mkuu)</option>
                                    </select>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Mmiliki anapata Portal ya Mwekezaji (kusimamia matawi yote, mapato & GOP, kutoa miongozo na kuidhinisha matumizi).
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={onboardForm.data.admin_name}
                                            onChange={(e) => onboardForm.setData('admin_name', e.target.value)}
                                            placeholder="e.g. Peter Mwita"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={onboardForm.data.admin_email}
                                            onChange={(e) => onboardForm.setData('admin_email', e.target.value)}
                                            placeholder="leader@hotel.co.tz"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Initial Password *</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={onboardForm.data.admin_password}
                                        onChange={(e) => onboardForm.setData('admin_password', e.target.value)}
                                        placeholder="Enter secure initial password (min 6 characters)"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono bg-white"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">This password will be used to sign in to the hotel's portal.</p>
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

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currentTenant = selectedTenantToEdit;
                                        setShowEditTenantModal(false);
                                        if (currentTenant) {
                                            handleOpenFeatureModal(currentTenant);
                                        }
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 transition font-bold text-xs cursor-pointer"
                                >
                                    <span className="flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-indigo-600" />
                                        <span>Manage Module & Feature Entitlements</span>
                                    </span>
                                    <span className="text-[11px] text-indigo-600 font-extrabold">&rarr;</span>
                                </button>
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

            {/* MODAL 2B: TENANT FEATURE CONTROL PANEL & MODULE ENTITLEMENTS */}
            {showFeatureModal && selectedTenantForFeatures && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] my-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-200 shrink-0">
                                    <Sliders className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                                            Feature Entitlements & Module Control Panel
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                            {selectedTenantForFeatures.plan} Plan
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Hotel: <strong className="text-slate-800">{selectedTenantForFeatures.name}</strong> • 
                                        Subdomain: <span className="font-mono text-slate-600">{selectedTenantForFeatures.subdomain}.theinns.com</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFeatureModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Presets & Quick Action Bar */}
                        <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col lg:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">Presets:</span>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('starter')}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition text-slate-700 cursor-pointer shadow-2xs"
                                >
                                    Starter (Core Front Desk)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('pro')}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition text-slate-700 cursor-pointer shadow-2xs"
                                >
                                    Pro (Front Desk + Store + Alerts)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('enterprise')}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition cursor-pointer shadow-2xs"
                                >
                                    Enterprise (All 19 Modules)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('none')}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                                >
                                    Deselect All
                                </button>
                            </div>

                            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                                <div className="relative w-full sm:w-56">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={featureSearch}
                                        onChange={(e) => setFeatureSearch(e.target.value)}
                                        placeholder="Search features..."
                                        className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl shrink-0">
                                    {Object.values(featureForm.data.features).filter(Boolean).length} of {available_features?.length || 19} Active
                                </span>
                            </div>
                        </div>

                        {/* Scrollable Features Form */}
                        <form onSubmit={submitSaveFeatures} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="text-xs text-slate-600 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-blue-900 block font-bold mb-0.5">Enforced Tenant Access Control</strong>
                                    <span>
                                        Turning off a module below removes it from this client's left navigation menu and blocks direct URL access immediately. Grant access only to the modules this hotel has subscribed and paid for.
                                    </span>
                                </div>
                            </div>

                            {/* Render Features Grouped by Category */}
                            {Object.entries(
                                (available_features || []).reduce((acc: Record<string, any[]>, item: any) => {
                                    const matchesSearch = !featureSearch || 
                                        item.name.toLowerCase().includes(featureSearch.toLowerCase()) ||
                                        item.description.toLowerCase().includes(featureSearch.toLowerCase()) ||
                                        item.category.toLowerCase().includes(featureSearch.toLowerCase());
                                    if (matchesSearch) {
                                        if (!acc[item.category]) acc[item.category] = [];
                                        acc[item.category].push(item);
                                    }
                                    return acc;
                                }, {})
                            ).map(([category, items]: [string, any[]]) => (
                                <div key={category} className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                            {category}
                                        </h4>
                                        <span className="text-[11px] font-semibold text-slate-400">
                                            {items.filter(f => featureForm.data.features[f.key]).length} / {items.length} Enabled
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {items.map((feature: any) => {
                                            const isEnabled = featureForm.data.features[feature.key] ?? false;
                                            return (
                                                <div
                                                    key={feature.key}
                                                    onClick={() => handleToggleSingleFeature(feature.key)}
                                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                                                        isEnabled
                                                            ? 'bg-white border-indigo-200 shadow-xs hover:border-indigo-300 ring-1 ring-indigo-500/10'
                                                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60 opacity-75'
                                                    }`}
                                                >
                                                    <div className="flex-1 pr-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-xs text-slate-900 block">
                                                                {feature.name}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                                            {feature.description}
                                                        </p>
                                                    </div>

                                                    {/* Toggle Switch */}
                                                    <div className="shrink-0 pt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleSingleFeature(feature.key);
                                                            }}
                                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                                                isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                                                                }`}
                                                            />
                                                        </button>
                                                        <span className={`block text-[10px] font-bold text-center mt-1 uppercase tracking-tight ${
                                                            isEnabled ? 'text-indigo-600' : 'text-slate-400'
                                                        }`}>
                                                            {isEnabled ? 'Active' : 'Off'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Sticky Bottom Actions */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-500">
                                    Changes take effect immediately for all staff logged into this hotel workspace.
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowFeatureModal(false)}
                                        className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={featureForm.processing}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        {featureForm.processing ? (
                                            <>
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                <span>Saving Entitlements...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>Save Module Entitlements</span>
                                            </>
                                        )}
                                    </button>
                                </div>
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
                                    placeholder="Enter SwalaSMS API Key (swl_live_...)"
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
                                    placeholder="Write the official announcement for hotel managers..."
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
                                        <option value="owner">👑 Hotel Owner / Director (Mmiliki wa Hoteli)</option>
                                        <option value="general_manager">👔 General Manager (Meneja Mkuu)</option>
                                        <option value="super_admin">⚡ Super Administrator (Msimamizi wa SaaS)</option>
                                        <option value="receptionist">🏨 Front Desk Receptionist</option>
                                        <option value="accountant">💰 Accountant / Finance</option>
                                        <option value="housekeeping">🧹 Housekeeping Supervisor</option>
                                        <option value="pos_cashier">🍽️ POS Cashier / Waiter</option>
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

            {/* MODAL: EDIT GLOBAL SAAS USER */}
            {showEditUserModal && selectedUserToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900">Edit SaaS / Hotel User</h3>
                                <p className="text-xs text-slate-500">Update account details, role, hotel assignment or reset password.</p>
                            </div>
                            <button type="button" onClick={() => setShowEditUserModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitEditUser} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={editUserForm.data.name}
                                    onChange={(e) => editUserForm.setData('name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={editUserForm.data.email}
                                    onChange={(e) => editUserForm.setData('email', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Platform Role *</label>
                                    <select
                                        value={editUserForm.data.role}
                                        onChange={(e) => editUserForm.setData('role', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                                    >
                                        <option value="owner">👑 Hotel Owner / Director (Mmiliki wa Hoteli)</option>
                                        <option value="general_manager">👔 General Manager (Meneja Mkuu)</option>
                                        <option value="super_admin">⚡ Super Administrator (Msimamizi wa SaaS)</option>
                                        <option value="receptionist">🏨 Front Desk Receptionist</option>
                                        <option value="accountant">💰 Accountant / Finance</option>
                                        <option value="housekeeping">🧹 Housekeeping Supervisor</option>
                                        <option value="pos_cashier">🍽️ POS Cashier / Waiter</option>
                                        <option value="staff">👤 General Staff</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Hotel Scope</label>
                                    <select
                                        value={editUserForm.data.tenant_id}
                                        onChange={(e) => editUserForm.setData('tenant_id', e.target.value)}
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
                                <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                                <select
                                    value={editUserForm.data.is_active ? '1' : '0'}
                                    onChange={(e) => editUserForm.setData('is_active', e.target.value === '1')}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                                >
                                    <option value="1">Active</option>
                                    <option value="0">Suspended / Deactivated</option>
                                </select>
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Reset Password (Optional)</label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep existing password"
                                    value={editUserForm.data.password}
                                    onChange={(e) => editUserForm.setData('password', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Leave blank unless you want to set a new password for this user.</p>
                            </div>
                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button type="button" onClick={() => setShowEditUserModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={editUserForm.processing} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{editUserForm.processing ? 'Saving...' : 'Save User Changes'}</span>
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
                                    placeholder="Explain how the issue was resolved or instructions provided to the hotel manager..."
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
