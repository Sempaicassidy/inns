import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    AlertTriangle,
    BedDouble,
    Boxes,
    Calendar,
    Check,
    CheckCircle2,
    CircleDollarSign,
    Database,
    Loader2,
    MessageSquare,
    Receipt,
    RefreshCw,
    Search,
    ShieldAlert,
    ShoppingCart,
    Sparkles,
    Trash2,
    UserCheck,
    Users,
    UtensilsCrossed,
    X,
} from 'lucide-react';

interface ModuleItem {
    key: string;
    name: string;
    swahili_name: string;
    category: string;
    icon: string;
    description: string;
    target_records_label: string;
}

interface ModuleCountInfo {
    count: number;
    details: string;
}

interface TenantInfo {
    id: string;
    name: string;
    subdomain?: string;
    slug?: string;
    plan?: string;
}

interface TenantDataClearModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: TenantInfo | null;
    countsEndpoint: string;
    clearEndpoint: string;
    onSuccess?: () => void;
}

export default function TenantDataClearModal({
    isOpen,
    onClose,
    tenant,
    countsEndpoint,
    clearEndpoint,
    onSuccess,
}: TenantDataClearModalProps) {
    const [loadingCounts, setLoadingCounts] = useState(false);
    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [counts, setCounts] = useState<Record<string, ModuleCountInfo>>({});
    const [totalOperationalRecords, setTotalOperationalRecords] = useState(0);

    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [confirmationInput, setConfirmationInput] = useState('');
    const [understandChecked, setUnderstandChecked] = useState(false);

    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successResult, setSuccessResult] = useState<{
        total_deleted: number;
        summary: Record<string, number>;
    } | null>(null);

    // Fetch live module counts whenever modal opens for a tenant
    useEffect(() => {
        if (isOpen && tenant) {
            fetchCounts();
            setSelectedModules([]);
            setConfirmationInput('');
            setUnderstandChecked(false);
            setErrorMessage(null);
            setSuccessResult(null);
        }
    }, [isOpen, tenant?.id]);

    const fetchCounts = async () => {
        if (!countsEndpoint) return;
        setLoadingCounts(true);
        setErrorMessage(null);
        try {
            const res = await axios.get(countsEndpoint);
            if (res.data?.success || res.data?.modules) {
                setModules(res.data.modules || []);
                setCounts(res.data.counts?.modules || {});
                setTotalOperationalRecords(res.data.counts?.total_operational_records || 0);
            }
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Imeshindikana kupata taarifa za moduli za hoteli.');
        } finally {
            setLoadingCounts(false);
        }
    };

    if (!isOpen || !tenant) return null;

    const getIconComponent = (iconName: string) => {
        switch (iconName) {
            case 'Calendar':
                return <Calendar className="w-4 h-4 text-blue-600" />;
            case 'Receipt':
                return <Receipt className="w-4 h-4 text-emerald-600" />;
            case 'UtensilsCrossed':
                return <UtensilsCrossed className="w-4 h-4 text-amber-600" />;
            case 'ShoppingCart':
                return <ShoppingCart className="w-4 h-4 text-orange-600" />;
            case 'Boxes':
                return <Boxes className="w-4 h-4 text-indigo-600" />;
            case 'CircleDollarSign':
                return <CircleDollarSign className="w-4 h-4 text-rose-600" />;
            case 'Users':
                return <Users className="w-4 h-4 text-purple-600" />;
            case 'Sparkles':
                return <Sparkles className="w-4 h-4 text-cyan-600" />;
            case 'UserCheck':
                return <UserCheck className="w-4 h-4 text-teal-600" />;
            case 'ShieldAlert':
                return <ShieldAlert className="w-4 h-4 text-red-600" />;
            case 'MessageSquare':
                return <MessageSquare className="w-4 h-4 text-sky-600" />;
            case 'BedDouble':
                return <BedDouble className="w-4 h-4 text-slate-600" />;
            default:
                return <Database className="w-4 h-4 text-slate-600" />;
        }
    };

    const toggleModule = (key: string) => {
        if (selectedModules.includes(key)) {
            setSelectedModules(selectedModules.filter((k) => k !== key));
        } else {
            setSelectedModules([...selectedModules, key]);
        }
    };

    const selectAllOperational = () => {
        const operationalKeys = modules.filter((m) => m.key !== 'rooms_catalog').map((m) => m.key);
        setSelectedModules(operationalKeys);
    };

    const deselectAll = () => {
        setSelectedModules([]);
    };

    // Filter modules by search and category
    const filteredModules = modules.filter((m) => {
        const matchesSearch =
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.swahili_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...Array.from(new Set(modules.map((m) => m.category)))];

    const isConfirmed =
        understandChecked &&
        (confirmationInput.trim().toUpperCase() === 'CLEAR' ||
            confirmationInput.trim().toUpperCase() === tenant.name.trim().toUpperCase() ||
            (tenant.slug && confirmationInput.trim().toUpperCase() === tenant.slug.trim().toUpperCase()));

    // Submit Clear Action
    const handleExecuteClear = async (overrideModules?: string[]) => {
        const targets = overrideModules || selectedModules;
        if (!targets || targets.length === 0) {
            setErrorMessage('Tafadhali chagua angalau moduli moja ya kusafisha.');
            return;
        }

        if (!isConfirmed && !overrideModules) {
            setErrorMessage('Tafadhali thibitisha kwa kuweka tiki na kuandika CLEAR au jina la hoteli.');
            return;
        }

        setProcessing(true);
        setErrorMessage(null);

        try {
            const payload = {
                modules: targets,
                confirmation: confirmationInput.trim() || 'CLEAR',
            };

            const res = await axios.post(clearEndpoint, payload);

            if (res.data?.success) {
                setSuccessResult(res.data.result || { total_deleted: 0, summary: {} });
                setSelectedModules([]);
                setConfirmationInput('');
                setUnderstandChecked(false);
                fetchCounts();
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setErrorMessage(res.data?.message || 'Hitilafu imetokea wakati wa kusafisha database.');
            }
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Hitilafu imetokea wakati wa kusafisha data ya moduli.');
        } finally {
            setProcessing(false);
        }
    };

    // Fast Single Module Purge
    const handleQuickSinglePurge = (moduleItem: ModuleItem) => {
        const c = counts[moduleItem.key]?.count || 0;
        const confirmMsg = `Je, una uhakika unataka kusafisha kabisa moduli ya "${moduleItem.swahili_name}" (${c} rekodi) kwa ajili ya "${tenant.name}"?\n\nKitendo hiki hakirudi nyuma na kitafuta rekodi hizi mara moja.`;
        if (window.confirm(confirmMsg)) {
            setSelectedModules([moduleItem.key]);
            setConfirmationInput('CLEAR');
            setUnderstandChecked(true);
            handleExecuteClear([moduleItem.key]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/60 via-white to-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs shrink-0">
                            <Database className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                    Safisha Database kwa Moduli (Clear Module Data)
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                                    Specific Tenant
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Hoteli Lengwa:{' '}
                                <span className="font-bold text-slate-900">{tenant.name}</span>
                                {tenant.subdomain && (
                                    <span className="text-slate-400 ml-1 font-mono text-[11px]">
                                        ({tenant.subdomain}.theinns.com)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700">
                    {/* Success Alert Banner */}
                    {successResult && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <p className="font-bold text-emerald-800 text-sm">
                                    Usafishaji Umekamilika Kikamilifu!
                                </p>
                                <p className="mt-0.5 text-emerald-700">
                                    Jumla ya rekodi{' '}
                                    <span className="font-extrabold">{successResult.total_deleted}</span> zimefutwa
                                    kwenye database ya hoteli hii.
                                </p>
                                {successResult.summary && Object.keys(successResult.summary).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {Object.entries(successResult.summary).map(([mod, cnt]) => (
                                            <span
                                                key={mod}
                                                className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 font-bold text-[11px]"
                                            >
                                                {mod}: {cnt} rekodi
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Warning & Scope Banner */}
                    <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                            <p className="font-bold text-amber-900">
                                Udhibiti wa Data kwa Hoteli Hii Pekee (Tenant Isolation Safeguard)
                            </p>
                            <p className="text-amber-800 leading-relaxed">
                                Kufuta data kutaathiri rekodi za hoteli{' '}
                                <strong className="font-bold text-slate-900">{tenant.name}</strong> pekee. Hoteli
                                nyingine au akaunti za watumiaji (staff accounts / logins) hazitaathirika.
                                Unaposafisha moduli, data inafutwa kabisa na hairudi nyuma.
                            </p>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                {errorMessage}
                            </span>
                            <button
                                type="button"
                                onClick={() => setErrorMessage(null)}
                                className="text-rose-600 hover:text-rose-900"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Toolbar: Search, Category Filters, Select All / Deselect All */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tafuta moduli..."
                                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                />
                            </div>

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
                            >
                                <option value="all">Moduli Zote ({modules.length})</option>
                                {categories
                                    .filter((c) => c !== 'all')
                                    .map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={selectAllOperational}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition cursor-pointer border border-rose-200"
                            >
                                Chagua Zote za Uendeshaji ({modules.length - 1})
                            </button>
                            <button
                                type="button"
                                onClick={deselectAll}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                            >
                                Ondoa Uchaguzi
                            </button>
                            <button
                                type="button"
                                onClick={fetchCounts}
                                title="Pakia upya idadi ya rekodi"
                                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingCounts ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Operational Summary Count Badge */}
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                        <span className="font-semibold text-slate-600">
                            Jumla ya Rekodi za Uendeshaji Zilizopo (Live Database):
                        </span>
                        <div className="flex items-center gap-2 font-black">
                            {loadingCounts ? (
                                <span className="inline-flex items-center gap-1 text-slate-400">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Inapakia...
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs">
                                    {new Intl.NumberFormat('en-TZ').format(totalOperationalRecords)} rekodi
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Modules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredModules.map((item) => {
                            const countInfo = counts[item.key];
                            const currentCount = countInfo?.count ?? 0;
                            const isSelected = selectedModules.includes(item.key);
                            const isDangerModule = item.key === 'rooms_catalog';

                            return (
                                <div
                                    key={item.key}
                                    onClick={() => toggleModule(item.key)}
                                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                                        isSelected
                                            ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-300/40 shadow-xs'
                                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2.5">
                                                <div
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                                        isSelected
                                                            ? 'bg-rose-100 border-rose-300'
                                                            : 'bg-slate-100 border-slate-200'
                                                    }`}
                                                >
                                                    {getIconComponent(item.icon)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="font-bold text-slate-900 text-xs leading-tight">
                                                            {item.swahili_name}
                                                        </h4>
                                                        {isDangerModule && (
                                                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                                                Catalog
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {item.name} • {item.category}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Selection Checkbox */}
                                            <div
                                                className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                                                    isSelected
                                                        ? 'bg-rose-600 border-rose-600 text-white'
                                                        : 'border-slate-300 bg-white'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed line-clamp-2">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Footer with Count and Quick Action */}
                                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                    currentCount > 0
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {loadingCounts ? '...' : `${currentCount} rekodi`}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickSinglePurge(item);
                                            }}
                                            disabled={currentCount === 0 || processing}
                                            title={`Safisha ${item.swahili_name} pekee`}
                                            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer ${
                                                currentCount > 0
                                                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200'
                                                    : 'text-slate-300 bg-slate-50 cursor-not-allowed'
                                            }`}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            <span>Safisha Hii</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Safety Verification Section */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 border-2 border-rose-200 space-y-3">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                            <h3 className="font-extrabold text-xs text-rose-950 uppercase tracking-wider">
                                Uthibitisho wa Usalama Kabla ya Kufuta (Security Authorization)
                            </h3>
                        </div>

                        <label className="flex items-start gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                checked={understandChecked}
                                onChange={(e) => setUnderstandChecked(e.target.checked)}
                                className="mt-0.5 rounded-md border-rose-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                            />
                            <span>
                                Nathibitisha kuwa ninaelewa kuwa rekodi za moduli zilizochaguliwa kwa hoteli ya{' '}
                                <strong className="font-bold text-slate-900">{tenant.name}</strong> zitafutwa kabisa
                                kutoka kwenye database na haziwezi kurejeshwa.
                            </span>
                        </label>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Andika neno <span className="font-mono text-rose-600 font-extrabold">CLEAR</span> au jina
                                la hoteli ({tenant.name}) ili kuwezesha kitufe:
                            </label>
                            <input
                                type="text"
                                value={confirmationInput}
                                onChange={(e) => setConfirmationInput(e.target.value)}
                                placeholder="Andika CLEAR hapa..."
                                className="w-full sm:max-w-md px-3 py-2 rounded-xl border border-rose-300 font-mono text-xs text-slate-900 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                            />
                        </div>
                    </div>
                </div>

                {/* Modal Actions Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                    <div className="text-xs text-slate-500 font-medium">
                        Moduli zilizochaguliwa:{' '}
                        <span className="font-bold text-rose-700">{selectedModules.length}</span> kati ya{' '}
                        {modules.length}
                    </div>

                    <div className="flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 bg-white hover:bg-slate-100 transition cursor-pointer"
                        >
                            Ghairi (Close)
                        </button>

                        <button
                            type="button"
                            onClick={() => handleExecuteClear()}
                            disabled={!isConfirmed || selectedModules.length === 0 || processing}
                            className={`px-5 py-2 rounded-xl font-bold text-xs text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                isConfirmed && selectedModules.length > 0 && !processing
                                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                                    : 'bg-slate-300 cursor-not-allowed opacity-70'
                            }`}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Inasafisha Database...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    <span>Safisha Moduli Zilizochaguliwa ({selectedModules.length})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
