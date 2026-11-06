import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    Building2,
    Check,
    CheckCircle2,
    DollarSign,
    Download,
    FileSpreadsheet,
    Info,
    Package,
    RefreshCw,
    ShoppingBag,
    Table,
    Upload,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface SchemaInfo {
    id: string;
    name: string;
    icon: any;
    color: string;
    badgeColor: string;
    description: string;
    countKey: string;
    columns: { name: string; required: boolean; type: string; example: string; notes: string }[];
    sampleRows: string[][];
}

interface DataEntryIndexProps extends PageProps {
    stats: {
        grocery_items: number;
        inventory_items: number;
        guests: number;
        expenses: number;
        rooms: number;
    };
    defaultProperty?: { id: string; name: string };
}

const SCHEMAS: Record<string, SchemaInfo> = {
    grocery_items: {
        id: 'grocery_items',
        name: 'Super / Mini Market Products',
        icon: ShoppingBag,
        color: 'indigo',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        description: 'Bulk catalog entry for retail merchandise, snacks, sodas, toiletries, and minimart shelf items.',
        countKey: 'grocery_items',
        columns: [
            { name: 'Name', required: true, type: 'Text (String)', example: 'Coca-Cola 500ml Pet', notes: 'Product display name' },
            { name: 'Code', required: false, type: 'Text / Barcode', example: 'BEV-001 or 049000000443', notes: 'SKU or Barcode; auto-generated if blank' },
            { name: 'Category', required: false, type: 'Text (String)', example: 'Bottled Drinks & Sodas', notes: 'Category name; created automatically if not found' },
            { name: 'Selling Price', required: true, type: 'Number (TZS)', example: '1500', notes: 'Retail customer selling price' },
            { name: 'Cost Price', required: false, type: 'Number (TZS)', example: '1000', notes: 'Wholesale acquisition cost for margin tracking' },
            { name: 'Stock Quantity', required: false, type: 'Integer', example: '48', notes: 'Initial shelf quantity' },
            { name: 'Reorder Level', required: false, type: 'Integer', example: '12', notes: 'Minimum threshold for low stock alert' },
            { name: 'Unit', required: false, type: 'Text', example: 'bottle', notes: 'pcs, bottle, can, pack, etc.' },
            { name: 'Is Available', required: false, type: 'Yes / No', example: 'Yes', notes: 'Whether product is active for POS sales' },
        ],
        sampleRows: [
            ['Coca-Cola 500ml Pet', 'BEV-001', 'Bottled Drinks & Sodas', '1500', '1000', '48', '12', 'bottle', 'Yes'],
            ['Kilimanjaro Drinking Water 1.5L', 'BEV-002', 'Bottled Drinks & Sodas', '2000', '1300', '60', '15', 'bottle', 'Yes'],
            ['Pringles Original 110g', 'SNK-001', 'Snacks & Confectionery', '8500', '6500', '24', '6', 'can', 'Yes'],
            ['Colgate Toothpaste Total 100g', 'SUN-001', 'Personal Care & Sundries', '4500', '3200', '30', '10', 'tube', 'Yes'],
        ],
    },
    inventory_items: {
        id: 'inventory_items',
        name: 'Store & Warehouse Inventory',
        icon: Package,
        color: 'emerald',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Bulk register central warehouse supplies, hotel linens, laundry chemicals, hardware, and guest amenities.',
        countKey: 'inventory_items',
        columns: [
            { name: 'SKU', required: false, type: 'Text / Code', example: 'LIN-001', notes: 'Unique item SKU; auto-generated if blank' },
            { name: 'Name', required: true, type: 'Text (String)', example: 'King Bed White Fitted Sheet 300TC', notes: 'Item description' },
            { name: 'Department', required: false, type: 'Text', example: 'Housekeeping', notes: 'Housekeeping, Maintenance, Kitchen F&B, Front Office' },
            { name: 'Unit', required: false, type: 'Text', example: 'pcs', notes: 'pcs, drum, bag, roll, box' },
            { name: 'Current Quantity', required: false, type: 'Integer', example: '50', notes: 'Initial warehouse stock on hand' },
            { name: 'Reorder Level', required: false, type: 'Integer', example: '15', notes: 'Replenishment trigger level' },
            { name: 'Unit Cost', required: false, type: 'Number (TZS)', example: '35000', notes: 'Average wholesale cost' },
            { name: 'Notes', required: false, type: 'Text', example: '100% Egyptian Cotton Percale', notes: 'Optional specifications' },
        ],
        sampleRows: [
            ['LIN-001', 'King Bed White Fitted Sheet 300TC', 'Housekeeping', 'pcs', '50', '15', '35000', 'Cotton percale white'],
            ['DET-002', 'Commercial Laundry Detergent Liquid 20L', 'Housekeeping', 'drum', '12', '4', '85000', 'Hypoallergenic drum'],
            ['ELEC-003', 'LED Light Bulb 9W Warm White E27', 'Maintenance', 'pcs', '100', '20', '4500', 'Philips warm glow'],
            ['KIT-004', 'Basmati Rice 25kg Royal Bag', 'Kitchen F&B', 'bag', '8', '2', '95000', 'Grade A Aromatic'],
        ],
    },
    guests: {
        id: 'guests',
        name: 'Guest Directory & Customers',
        icon: Users,
        color: 'blue',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Bulk import customer contact records, passport / national ID details, nationalities, and VIP profiles.',
        countKey: 'guests',
        columns: [
            { name: 'First Name', required: true, type: 'Text', example: 'Juma', notes: 'Guest first name' },
            { name: 'Last Name', required: true, type: 'Text', example: 'Mkwawa', notes: 'Guest last name / surname' },
            { name: 'Phone', required: false, type: 'Phone Number', example: '+255712345678', notes: 'Primary mobile number for SMS/WhatsApp' },
            { name: 'Email', required: false, type: 'Email Address', example: 'juma.mkwawa@gmail.com', notes: 'Booking confirmation & folio billing email' },
            { name: 'Gender', required: false, type: 'male / female', example: 'male', notes: 'Gender' },
            { name: 'Nationality', required: false, type: 'Country (String)', example: 'Tanzanian', notes: 'Country of citizenship' },
            { name: 'ID Type', required: false, type: 'passport / national_id', example: 'national_id', notes: 'Official identification document type' },
            { name: 'ID Number', required: false, type: 'Text', example: '19850412-12345-00001', notes: 'Document serial number' },
            { name: 'Origin', required: false, type: 'City / Country', example: 'Dar es Salaam', notes: 'Place traveling from' },
            { name: 'Destination', required: false, type: 'City / Country', example: 'Arusha', notes: 'Next destination' },
        ],
        sampleRows: [
            ['Juma', 'Mkwawa', '+255712345678', 'juma.mkwawa@gmail.com', 'male', 'Tanzanian', 'national_id', '19850412-12345-00001', 'Dar es Salaam', 'Arusha'],
            ['Sarah', 'Jenkins', '+447911123456', 's.jenkins@safari.co.uk', 'female', 'British', 'passport', 'GB98234120', 'London', 'Serengeti'],
            ['Amara', 'Diallo', '+254700987654', 'amara.diallo@outlook.com', 'female', 'Kenyan', 'passport', 'KE4491028', 'Nairobi', 'Zanzibar'],
        ],
    },
    expenses: {
        id: 'expenses',
        name: 'Financial Expense Vouchers',
        icon: DollarSign,
        color: 'rose',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        description: 'Bulk upload historical operational disbursements, electricity/water utility receipts, and vendor bills.',
        countKey: 'expenses',
        columns: [
            { name: 'Date', required: true, type: 'YYYY-MM-DD', example: '2026-11-04', notes: 'Disbursement date' },
            { name: 'Title', required: true, type: 'Text (String)', example: 'TANESCO Power Token Recharge Meter #241', notes: 'Purpose / Description' },
            { name: 'Category', required: true, type: 'Category Key', example: 'utilities', notes: 'utilities, supplies, maintenance, payroll, marketing' },
            { name: 'Amount', required: true, type: 'Number (TZS)', example: '350000', notes: 'Total voucher amount' },
            { name: 'Vendor Name', required: false, type: 'Text (String)', example: 'TANESCO Ltd', notes: 'Beneficiary or vendor' },
            { name: 'Payment Method', required: false, type: 'cash / bank / mpesa', example: 'mpesa', notes: 'Disbursement method' },
            { name: 'Receipt Reference', required: false, type: 'Text', example: 'TAN-882194', notes: 'Bill / receipt reference' },
            { name: 'Notes', required: false, type: 'Text', example: 'Monthly power prepaid token', notes: 'Accounting notes' },
        ],
        sampleRows: [
            ['2026-11-04', 'TANESCO Power Token Recharge Meter #241', 'utilities', '350000', 'TANESCO Ltd', 'mpesa', 'TAN-882194', 'Monthly power prepaid'],
            ['2026-11-03', 'DAWASA Water Utility Bill - October', 'utilities', '125000', 'DAWASA Water', 'bank_transfer', 'DAW-09923', 'Direct bank settlement'],
            ['2026-11-02', 'Fresh Vegetables & Kitchen Farm Market', 'supplies', '220000', 'Kariakoo Market', 'cash', 'RCP-8812', 'Daily chef procurement'],
        ],
    },
    rooms: {
        id: 'rooms',
        name: 'Hotel Rooms & Lodging Units',
        icon: Building2,
        color: 'amber',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Bulk register property rooms, suites, floor levels, and initial housekeeping states.',
        countKey: 'rooms',
        columns: [
            { name: 'Room Number', required: true, type: 'Text / Number', example: '101', notes: 'Unique room identifier' },
            { name: 'Room Type', required: false, type: 'Text (String)', example: 'Deluxe King Suite', notes: 'Suite/type name; created if not existing' },
            { name: 'Floor', required: false, type: 'Integer', example: '1', notes: 'Floor number' },
            { name: 'Occupancy Status', required: false, type: 'vacant / occupied', example: 'vacant', notes: 'Initial occupancy status' },
            { name: 'Housekeeping Status', required: false, type: 'clean / dirty / inspected', example: 'clean', notes: 'Current cleaning condition' },
        ],
        sampleRows: [
            ['101', 'Deluxe King Suite', '1', 'vacant', 'clean'],
            ['102', 'Deluxe Twin Room', '1', 'vacant', 'clean'],
            ['201', 'Executive Ocean Suite', '2', 'vacant', 'inspected'],
            ['202', 'Standard Single Room', '2', 'vacant', 'clean'],
        ],
    },
};

export default function SpreadsheetDataEntryIndex({ stats, defaultProperty }: DataEntryIndexProps) {
    const { flash, errors: pageErrors } = usePage<PageProps<{ flash?: { success?: string; error?: string; import_errors?: string[] } }>>().props;
    const [selectedSchemaKey, setSelectedSchemaKey] = useState<string>('grocery_items');
    const [dragActive, setDragActive] = useState(false);

    const activeSchema = SCHEMAS[selectedSchemaKey] || SCHEMAS.grocery_items;

    const { data, setData, post, processing, reset, errors, progress } = useForm<{ csv_file: File | null }>({
        csv_file: null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setData('csv_file', e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setData('csv_file', e.dataTransfer.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.csv_file) return;

        post(route('data-entry.import', selectedSchemaKey), {
            forceFormData: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Spreadsheet CSV Data Entry (Importer & Exporter)" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* 1. HEADER SECTION (Slim, Clean White) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Universal CSV Importer & Exporter
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <a
                            href={route('data-entry.template', selectedSchemaKey)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition"
                        >
                            <span>Download Template (.csv)</span>
                        </a>
                        <a
                            href={route('data-entry.export', selectedSchemaKey)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                        >
                            <span>Export Live Data (.csv)</span>
                        </a>
                    </div>
                </div>

                {/* FLASH NOTIFICATIONS */}
                {flash?.success && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm space-y-1">
                            <div className="font-extrabold">{flash.success}</div>
                            {flash.import_errors && flash.import_errors.length > 0 && (
                                <div className="mt-2 text-xs bg-white/70 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                                    <div className="font-bold text-amber-800">Skipped Row Warnings:</div>
                                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                                        {flash.import_errors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 shadow-xs">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <div className="text-xs sm:text-sm font-bold">{flash.error}</div>
                    </div>
                )}

                {/* 2. ENTITY SELECTOR CARDS */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-black text-slate-900 uppercase tracking-wider text-xs">
                            Select Module for Data Entry
                        </h2>
                        <span className="text-xs text-slate-500 font-medium">
                            Choose the dataset you want to import or export
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                        {Object.values(SCHEMAS).map((s) => {
                            const Icon = s.icon;
                            const isSelected = selectedSchemaKey === s.id;
                            const currentCount = (stats as any)[s.countKey] ?? 0;

                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedSchemaKey(s.id);
                                        reset();
                                    }}
                                    className={`p-4 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                                        isSelected
                                            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                                            : 'bg-white/80 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-2xs'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                                            {currentCount} Records
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-900">{s.name}</div>
                                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                                            {s.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. WORKSPACE FOR SELECTED MODULE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT PANEL: UPLOAD & IMPORT FORM (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-indigo-600" />
                                    <span>Import CSV Spreadsheet</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Upload your prepared spreadsheet to bulk populate <strong>{activeSchema.name}</strong>.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* DRAG AND DROP AREA */}
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                                        dragActive
                                            ? 'border-indigo-600 bg-indigo-50/50'
                                            : data.csv_file
                                            ? 'border-emerald-500 bg-emerald-50/30'
                                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Upload className="w-6 h-6" />
                                    </div>

                                    {data.csv_file ? (
                                        <div className="space-y-1">
                                            <div className="text-xs font-black text-emerald-800 break-all">
                                                {data.csv_file.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                                {(data.csv_file.size / 1024).toFixed(1)} KB • Ready to Import
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <span className="text-xs font-black text-slate-800 block">
                                                Drag & drop CSV file here, or click to browse
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">
                                                Supports standard comma or semicolon delimited .csv files
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {errors.csv_file && (
                                    <div className="text-xs text-rose-600 font-bold flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{errors.csv_file}</span>
                                    </div>
                                )}

                                {progress && (
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={!data.csv_file || processing}
                                        className={`w-full py-3 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                                            !data.csv_file || processing
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                                        }`}
                                    >
                                        {processing ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Importing & Processing Rows...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                <span>Start Bulk CSV Import</span>
                                            </>
                                        )}
                                    </button>

                                    {data.csv_file && (
                                        <button
                                            type="button"
                                            onClick={() => reset()}
                                            className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-800 font-bold transition"
                                        >
                                            Cancel / Clear Selected File
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* DOWNLOAD & EXPORT QUICK ACTIONS */}
                            <div className="pt-4 border-t border-slate-100 space-y-2.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                    Template & Export Tools
                                </span>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <a
                                        href={route('data-entry.template', selectedSchemaKey)}
                                        className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left flex flex-col justify-between space-y-1 text-xs"
                                    >
                                        <div className="flex items-center gap-1.5 text-indigo-600 font-black">
                                            <span>Template</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">Pre-formatted headers</span>
                                    </a>

                                    <a
                                        href={route('data-entry.export', selectedSchemaKey)}
                                        className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left flex flex-col justify-between space-y-1 text-xs"
                                    >
                                        <div className="flex items-center gap-1.5 text-emerald-600 font-black">
                                            <span>Live Export</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">All current records</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* INFO BOX */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-600">
                            <div className="flex items-center gap-2 font-black text-slate-800">
                                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>CSV Format Guidelines</span>
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                                <li>The first line of your file must contain the column header names.</li>
                                <li>Duplicate entries matching existing SKU, Barcode, Phone, or Room Number will be updated safely.</li>
                                <li>Prices and numbers can include commas or decimals (e.g. <code>1,500.00</code>).</li>
                                <li>UTF-8 character encoding is recommended for special names or Swahili accents.</li>
                            </ul>
                        </div>
                    </div>

                    {/* RIGHT PANEL: SCHEMA SPECIFICATIONS & SAMPLE PREVIEW (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 1. SCHEMA COLUMN DICTIONARY */}
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {activeSchema.name} Column Dictionary
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Expected column headers and data requirements for your spreadsheet.
                                    </p>
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-500">
                                    {activeSchema.columns.length} Columns
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                                            <th className="py-2.5 px-3">Column Header</th>
                                            <th className="py-2.5 px-3">Required</th>
                                            <th className="py-2.5 px-3">Data Type</th>
                                            <th className="py-2.5 px-3">Sample Value</th>
                                            <th className="py-2.5 px-3">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {activeSchema.columns.map((col) => (
                                            <tr key={col.name} className="hover:bg-slate-50/70 transition">
                                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                                    {col.name}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    {col.required ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                                                            Required
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                                                            Optional
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600 font-medium">{col.type}</td>
                                                <td className="py-2.5 px-3 font-mono text-indigo-700">{col.example}</td>
                                                <td className="py-2.5 px-3 text-slate-400 text-[11px]">{col.notes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 2. SAMPLE PREVIEW TABLE */}
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                        <Table className="w-4 h-4 text-emerald-600" />
                                        <span>Sample Template Preview</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Visual representation of rows in the downloadable CSV template.
                                    </p>
                                </div>
                                <a
                                    href={route('data-entry.template', selectedSchemaKey)}
                                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold transition"
                                >
                                    <span>Download .CSV</span>
                                </a>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                                    <thead>
                                        <tr className="bg-slate-900 text-white font-mono uppercase text-[10px]">
                                            {activeSchema.columns.map((c) => (
                                                <th key={c.name} className="py-2.5 px-3 whitespace-nowrap">
                                                    {c.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {activeSchema.sampleRows.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-slate-50 transition">
                                                {row.map((val, cIdx) => (
                                                    <td key={cIdx} className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                                                        {val}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
