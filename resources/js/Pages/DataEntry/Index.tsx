import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BedDouble,
    Building2,
    Check,
    CheckCircle2,
    Columns3,
    DollarSign,
    Download,
    FileSpreadsheet,
    Package,
    Plus,
    RefreshCw,
    Save,
    ShoppingBag,
    Table,
    Trash2,
    Upload,
    Users,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

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
        room_types?: number;
    };
    defaultProperty?: { id: string; name: string };
}

const SCHEMAS: Record<string, SchemaInfo> = {
    rooms: {
        id: 'rooms',
        name: 'Hotel Rooms & Lodging Units',
        icon: Building2,
        color: 'amber',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Bulk register property rooms, suites, floor levels, room types, and rates.',
        countKey: 'rooms',
        columns: [
            { name: 'Room Number', required: true, type: 'Text / Number', example: '101', notes: 'Unique room identifier' },
            { name: 'Room Type', required: false, type: 'Text (String)', example: 'Deluxe King Suite', notes: 'Suite/type name; created if not existing' },
            { name: 'Floor', required: false, type: 'Integer', example: '1', notes: 'Floor number' },
            { name: 'Base Price (TZS)', required: false, type: 'Number (TZS)', example: '120000', notes: 'Nightly room rate in shillings' },
            { name: 'Occupancy Status', required: false, type: 'vacant / occupied', example: 'vacant', notes: 'Initial occupancy status' },
            { name: 'Housekeeping Status', required: false, type: 'clean / dirty / inspected', example: 'clean', notes: 'Current cleaning condition' },
        ],
        sampleRows: [
            ['101', 'Deluxe King Suite', '1', '120000', 'vacant', 'clean'],
            ['102', 'Deluxe Twin Room', '1', '100000', 'vacant', 'clean'],
            ['201', 'Executive Ocean Suite', '2', '250000', 'vacant', 'inspected'],
            ['202', 'Standard Single Room', '2', '60000', 'vacant', 'clean'],
            ['301', 'Presidential Penthouse', '3', '500000', 'vacant', 'inspected'],
        ],
    },
    room_types: {
        id: 'room_types',
        name: 'Room Types & Rate Plans',
        icon: BedDouble,
        color: 'blue',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Bulk configure room categories, nightly rates, capacity, and amenities.',
        countKey: 'room_types',
        columns: [
            { name: 'Room Type Name', required: true, type: 'Text', example: 'Standard Executive Room', notes: 'Display title for booking & front desk' },
            { name: 'Code', required: false, type: 'Text', example: 'EXEC', notes: 'Short category code' },
            { name: 'Base Price (TZS)', required: true, type: 'Number (TZS)', example: '180000', notes: 'Standard night rate' },
            { name: 'Base Occupancy', required: false, type: 'Integer', example: '2', notes: 'Default number of guests' },
            { name: 'Max Adults', required: false, type: 'Integer', example: '2', notes: 'Maximum adult capacity' },
            { name: 'Max Children', required: false, type: 'Integer', example: '1', notes: 'Maximum children capacity' },
            { name: 'Amenities', required: false, type: 'Text (Comma-separated)', example: 'King Bed, Free WiFi, AC', notes: 'Room features' },
            { name: 'Description', required: false, type: 'Text', example: 'Executive suite with work desk', notes: 'Guest overview' },
        ],
        sampleRows: [
            ['Standard Single Room', 'SGL', '60000', '1', '1', '0', 'Single Bed, WiFi, AC', 'Compact cozy single room'],
            ['Standard Executive Room', 'EXEC', '180000', '2', '2', '1', 'King Bed, Free WiFi, Air Conditioning, Safe Box', 'Executive room with working desk'],
            ['Deluxe Ocean Suite', 'OCN', '280000', '2', '3', '2', 'King Bed, Balcony, Sea View, Mini Bar', 'Spacious luxury oceanfront suite'],
            ['Presidential Villa', 'PVIL', '650000', '4', '4', '2', 'Private Pool, Butler, Kitchenette, King Bed', 'Exclusive VIP private villa'],
        ],
    },
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
        color: 'cyan',
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
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
};

export default function SpreadsheetDataEntryIndex({ stats, defaultProperty }: DataEntryIndexProps) {
    const { flash } = usePage<PageProps<{ flash?: { success?: string; error?: string; import_errors?: string[] } }>>().props;
    const [selectedSchemaKey, setSelectedSchemaKey] = useState<string>('rooms');
    const [activeTab, setActiveTab] = useState<'upload' | 'organize' | 'grid'>('upload');
    const [dragActive, setDragActive] = useState(false);

    const activeSchema = SCHEMAS[selectedSchemaKey] || SCHEMAS.rooms;

    // 1. Column Organizer State: selected columns to collect / export
    const [selectedColumns, setSelectedColumns] = useState<Record<string, string[]>>(() => {
        const initial: Record<string, string[]> = {};
        Object.entries(SCHEMAS).forEach(([k, s]) => {
            initial[k] = s.columns.map((c) => c.name);
        });
        return initial;
    });

    const activeSelectedColumns = selectedColumns[selectedSchemaKey] || activeSchema.columns.map((c) => c.name);

    const toggleColumn = (columnName: string) => {
        setSelectedColumns((prev) => {
            const current = prev[selectedSchemaKey] || activeSchema.columns.map((c) => c.name);
            const exists = current.includes(columnName);
            const updated = exists ? current.filter((c) => c !== columnName) : [...current, columnName];
            return { ...prev, [selectedSchemaKey]: updated };
        });
    };

    const selectAllColumns = () => {
        setSelectedColumns((prev) => ({
            ...prev,
            [selectedSchemaKey]: activeSchema.columns.map((c) => c.name),
        }));
    };

    const clearAllColumns = () => {
        const requiredOnly = activeSchema.columns.filter((c) => c.required).map((c) => c.name);
        setSelectedColumns((prev) => ({
            ...prev,
            [selectedSchemaKey]: requiredOnly,
        }));
    };

    // 2. Interactive Spreadsheet Grid State
    const [gridRows, setGridRows] = useState<Array<Record<string, string>>>(() => [
        {}, {}, {}, {}, {}
    ]);
    const [savingGrid, setSavingGrid] = useState(false);
    const [gridFeedback, setGridFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleGridCellChange = (rowIndex: number, colName: string, val: string) => {
        setGridRows((prev) => {
            const updated = [...prev];
            updated[rowIndex] = { ...updated[rowIndex], [colName]: val };
            return updated;
        });
    };

    const addGridRow = () => {
        setGridRows((prev) => [...prev, {}]);
    };

    const removeGridRow = (index: number) => {
        setGridRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSaveGrid = async () => {
        const validRows = gridRows.filter((r) => Object.values(r).some((v) => v && v.trim() !== ''));
        if (validRows.length === 0) {
            setGridFeedback({ type: 'error', message: 'Please enter at least one row of data.' });
            return;
        }

        setSavingGrid(true);
        setGridFeedback(null);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(route('data-entry.batch-save', selectedSchemaKey), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ rows: validRows }),
            });

            const json = await res.json();
            if (json.success) {
                setGridFeedback({ type: 'success', message: json.message || 'Records saved successfully.' });
                setGridRows([{}, {}, {}, {}, {}]);
            } else {
                setGridFeedback({ type: 'error', message: json.message || 'Failed to save records.' });
            }
        } catch (err: any) {
            setGridFeedback({ type: 'error', message: err.message || 'Network error while saving.' });
        } finally {
            setSavingGrid(false);
        }
    };

    // 3. Client-Side Smart CSV Parser & Column Mapper State
    const [parsedCsvHeaders, setParsedCsvHeaders] = useState<string[]>([]);
    const [parsedCsvRows, setParsedCsvRows] = useState<string[][]>([]);
    const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
    const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
    const [importingMapped, setImportingMapped] = useState(false);

    const handleFileSelected = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== '');
            if (lines.length < 2) {
                alert('Uploaded CSV must contain at least a header and 1 row of data.');
                return;
            }

            const parseLine = (line: string): string[] => {
                const result: string[] = [];
                let cur = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const ch = line[i];
                    if (ch === '"') {
                        inQuotes = !inQuotes;
                    } else if (ch === ',' && !inQuotes) {
                        result.push(cur.trim());
                        cur = '';
                    } else {
                        cur += ch;
                    }
                }
                result.push(cur.trim());
                return result;
            };

            const headers = parseLine(lines[0]);
            const rows = lines.slice(1, 15).map(parseLine);

            setParsedCsvHeaders(headers);
            setParsedCsvRows(rows);

            // Auto match system schema columns
            const autoMap: Record<string, string> = {};
            activeSchema.columns.forEach((col) => {
                const normSys = col.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const matchedCsv = headers.find((h) => {
                    const normCsv = h.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return normCsv.includes(normSys) || normSys.includes(normCsv);
                });
                if (matchedCsv) {
                    autoMap[col.name] = matchedCsv;
                }
            });
            setColumnMappings(autoMap);
            setIsMappingModalOpen(true);
        };
        reader.readAsText(file);
    };

    const handleExecuteMappedImport = async () => {
        if (!data.csv_file) {
            setImportingMapped(true);
            try {
                const mappedRows = parsedCsvRows.map((row) => {
                    const obj: Record<string, any> = {};
                    Object.entries(columnMappings).forEach(([sysCol, csvHeader]) => {
                        const csvIdx = parsedCsvHeaders.indexOf(csvHeader);
                        if (csvIdx !== -1) {
                            obj[sysCol] = row[csvIdx] || '';
                        }
                    });
                    return obj;
                });

                const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
                const res = await fetch(route('data-entry.batch-save', selectedSchemaKey), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ rows: mappedRows }),
                });

                const json = await res.json();
                if (json.success) {
                    alert(json.message);
                    setIsMappingModalOpen(false);
                } else {
                    alert('Error: ' + json.message);
                }
            } catch (err: any) {
                alert('Import error: ' + err.message);
            } finally {
                setImportingMapped(false);
            }
            return;
        }

        post(route('data-entry.import', selectedSchemaKey), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setIsMappingModalOpen(false);
            },
        });
    };

    // Standard Inertia file form
    const { data, setData, post, processing, reset } = useForm<{ csv_file: File | null }>({
        csv_file: null,
    });

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setData('csv_file', file);
            handleFileSelected(file);
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

    const customTemplateUrl = useMemo(() => {
        const colsParam = encodeURIComponent(activeSelectedColumns.join(','));
        return `${route('data-entry.template', selectedSchemaKey)}?columns=${colsParam}`;
    }, [selectedSchemaKey, activeSelectedColumns]);

    const customExportUrl = useMemo(() => {
        const colsParam = encodeURIComponent(activeSelectedColumns.join(','));
        return `${route('data-entry.export', selectedSchemaKey)}?columns=${colsParam}`;
    }, [selectedSchemaKey, activeSelectedColumns]);

    return (
        <AuthenticatedLayout>
            <Head title="Universal Data Entry Hub & CSV Spreadsheet Manager" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* 1. HEADER SECTION (Clean, Functional White) */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[11px] uppercase tracking-wider border border-blue-200">
                                Data Hub & Importer
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Excel & CSV Ready</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                            Hotel Data Collection & CSV Spreadsheet Hub
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Select datasets, customize required columns, enter data directly in-browser, or import bulk records.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <a
                            href={customTemplateUrl}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer shadow-2xs"
                        >
                            <Download className="w-4 h-4 text-slate-600" />
                            <span>Download Template ({activeSelectedColumns.length} Cols)</span>
                        </a>
                        <a
                            href={customExportUrl}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
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
                                    <div className="font-bold text-amber-800">Warnings / Skipped Rows:</div>
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
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Step 1: Select Target Dataset
                        </h2>
                        <span className="text-xs text-slate-500 font-medium">
                            Choose which hotel module you want to populate or extract
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                                        setGridFeedback(null);
                                    }}
                                    className={`p-3.5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between space-y-2.5 ${
                                        isSelected
                                            ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div
                                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-[11px] font-extrabold text-slate-500 font-mono">
                                            {currentCount} records
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-extrabold text-xs text-slate-900 leading-tight">
                                            {s.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                            {s.columns.length} columns available
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. WORKSPACE TABS */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                    {/* Tab Navigation */}
                    <div className="border-b border-slate-200 px-6 pt-4 flex items-center justify-between gap-4 bg-slate-50/70">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('upload')}
                                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 cursor-pointer flex items-center gap-2 ${
                                    activeTab === 'upload'
                                        ? 'border-blue-600 text-blue-700 bg-white'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Upload className="w-4 h-4" />
                                <span>1. CSV File Upload & Mapping</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('organize')}
                                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 cursor-pointer flex items-center gap-2 ${
                                    activeTab === 'organize'
                                        ? 'border-blue-600 text-blue-700 bg-white'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Columns3 className="w-4 h-4" />
                                <span>2. Column Organizer ({activeSelectedColumns.length}/{activeSchema.columns.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('grid')}
                                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 cursor-pointer flex items-center gap-2 ${
                                    activeTab === 'grid'
                                        ? 'border-blue-600 text-blue-700 bg-white'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Table className="w-4 h-4" />
                                <span>3. Interactive Web Spreadsheet Grid</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab 1: CSV File Upload & Smart Mapping */}
                    {activeTab === 'upload' && (
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="max-w-2xl mx-auto space-y-4">
                                <div className="text-center space-y-1">
                                    <h3 className="font-extrabold text-base text-slate-900">
                                        Import {activeSchema.name} from CSV / Excel
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Drag & drop your file or choose from your computer. Our smart parser will match your columns automatically.
                                    </p>
                                </div>

                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`p-8 border-2 border-dashed rounded-3xl text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                                        dragActive
                                            ? 'border-blue-500 bg-blue-50/50'
                                            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                                    }`}
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                        <Upload className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="csv-upload-input"
                                            className="font-extrabold text-sm text-blue-600 hover:underline cursor-pointer"
                                        >
                                            Click to browse file
                                        </label>
                                        <span className="text-xs text-slate-500"> or drag and drop here</span>
                                        <p className="text-[11px] text-slate-400 mt-1">Supports standard CSV files (.csv) up to 10MB</p>
                                    </div>
                                    <input
                                        id="csv-upload-input"
                                        type="file"
                                        accept=".csv,text/csv"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const f = e.target.files[0];
                                                setData('csv_file', f);
                                                handleFileSelected(f);
                                            }
                                        }}
                                    />
                                </div>

                                {data.csv_file && (
                                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3">
                                            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <div className="font-extrabold text-slate-900">{data.csv_file.name}</div>
                                                <div className="text-[11px] text-slate-500 font-mono">
                                                    {(data.csv_file.size / 1024).toFixed(1)} KB • Ready for processing
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsMappingModalOpen(true)}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                                            >
                                                Configure Mapping & Preview
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    reset();
                                                    setParsedCsvHeaders([]);
                                                    setParsedCsvRows([]);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Column Customization & Organizer */}
                    {activeTab === 'organize' && (
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">
                                        Configure Data Fields to Collect ({activeSchema.name})
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Check or uncheck the attributes your hotel tracks. Your downloaded template and export will match your exact selection.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllColumns}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAllColumns}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                                    >
                                        Required Only
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {activeSchema.columns.map((col) => {
                                    const isChecked = activeSelectedColumns.includes(col.name);
                                    return (
                                        <div
                                            key={col.name}
                                            onClick={() => toggleColumn(col.name)}
                                            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                                                isChecked
                                                    ? 'bg-blue-50/40 border-blue-400 shadow-2xs'
                                                    : 'bg-white border-slate-200 hover:border-slate-300 opacity-60'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {}}
                                                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            />
                                            <div className="space-y-1 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-extrabold text-slate-900">{col.name}</span>
                                                    {col.required && (
                                                        <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 font-extrabold text-[10px]">
                                                            Required
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-mono">Type: {col.type}</div>
                                                <div className="text-[11px] text-slate-400">{col.notes}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-bold">
                                    {activeSelectedColumns.length} of {activeSchema.columns.length} columns active for template & export
                                </span>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={customTemplateUrl}
                                        download
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download Custom Template</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Interactive In-Browser Spreadsheet Grid */}
                    {activeTab === 'grid' && (
                        <div className="p-6 sm:p-8 space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">
                                        Live Spreadsheet Grid ({activeSchema.name})
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Type directly into the table cells below, or paste from Excel / Google Sheets, then click Save.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={addGridRow}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Blank Row</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveGrid}
                                        disabled={savingGrid}
                                        className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-60"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{savingGrid ? 'Saving Records...' : 'Save & Import Grid'}</span>
                                    </button>
                                </div>
                            </div>

                            {gridFeedback && (
                                <div
                                    className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                                        gridFeedback.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                                    }`}
                                >
                                    {gridFeedback.type === 'success' ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-rose-600" />
                                    )}
                                    <span>{gridFeedback.message}</span>
                                </div>
                            )}

                            {/* Spreadsheet Table */}
                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                                        <tr>
                                            <th className="py-2.5 px-3 text-center w-12">#</th>
                                            {activeSelectedColumns.map((colName) => (
                                                <th key={colName} className="py-2.5 px-3 whitespace-nowrap">
                                                    {colName}
                                                </th>
                                            ))}
                                            <th className="py-2.5 px-3 text-center w-12">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {gridRows.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-slate-50/50">
                                                <td className="py-2 px-3 text-center font-bold text-slate-400 font-mono">
                                                    {rIdx + 1}
                                                </td>
                                                {activeSelectedColumns.map((colName) => (
                                                    <td key={colName} className="p-1">
                                                        <input
                                                            type="text"
                                                            value={row[colName] || ''}
                                                            onChange={(e) => handleGridCellChange(rIdx, colName, e.target.value)}
                                                            placeholder={`e.g. ${
                                                                activeSchema.columns.find((c) => c.name === colName)?.example || ''
                                                            }`}
                                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="py-2 px-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGridRow(rIdx)}
                                                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                                        title="Delete row"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Smart Column Mapping & Preview Modal */}
            {isMappingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Columns3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">
                                        Map CSV Columns & Preview Import
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Match each column in your file to the correct system field
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMappingModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
                            {/* Mapping Grid */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-900 text-sm">Column Relationships</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {activeSchema.columns.map((col) => (
                                        <div
                                            key={col.name}
                                            className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                                        >
                                            <div className="font-extrabold text-slate-800">
                                                {col.name}
                                                {col.required && <span className="text-rose-500 ml-1">*</span>}
                                            </div>
                                            <select
                                                value={columnMappings[col.name] || ''}
                                                onChange={(e) =>
                                                    setColumnMappings((prev) => ({
                                                        ...prev,
                                                        [col.name]: e.target.value,
                                                    }))
                                                }
                                                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="">-- Ignore Column --</option>
                                                {parsedCsvHeaders.map((h) => (
                                                    <option key={h} value={h}>
                                                        File: {h}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Preview Table */}
                            {parsedCsvRows.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        File Data Preview (First {parsedCsvRows.length} Rows)
                                    </h4>
                                    <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-48">
                                        <table className="w-full text-[11px] text-left">
                                            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                                                <tr>
                                                    {parsedCsvHeaders.map((h, i) => (
                                                        <th key={i} className="py-2 px-3 whitespace-nowrap">
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {parsedCsvRows.slice(0, 5).map((row, rIdx) => (
                                                    <tr key={rIdx}>
                                                        {row.map((cell, cIdx) => (
                                                            <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap font-mono text-slate-700">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsMappingModalOpen(false)}
                                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteMappedImport}
                                disabled={importingMapped || processing}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                            >
                                <Check className="w-4 h-4" />
                                <span>{importingMapped || processing ? 'Importing Data...' : 'Confirm & Import Records'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
