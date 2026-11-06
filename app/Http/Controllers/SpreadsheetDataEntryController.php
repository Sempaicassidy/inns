<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Expense;
use App\Models\Guest;
use App\Models\InventoryItem;
use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\Property;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\StockMovement;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SpreadsheetDataEntryController extends Controller
{
    /**
     * Render the Spreadsheet CSV Data Entry Hub
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id ?? Tenant::first()?->id;

        $stats = [
            'grocery_items' => PosItem::where('tenant_id', $tenantId)->where('department', 'grocery')->count(),
            'inventory_items' => InventoryItem::where('tenant_id', $tenantId)->count(),
            'guests' => Guest::where('tenant_id', $tenantId)->count(),
            'expenses' => Expense::where('tenant_id', $tenantId)->count(),
            'rooms' => Room::where('tenant_id', $tenantId)->count(),
        ];

        return Inertia::render('DataEntry/Index', [
            'stats' => $stats,
            'defaultProperty' => $property,
        ]);
    }

    /**
     * Download pre-formatted CSV template with sample data
     */
    public function downloadTemplate(Request $request, string $type): StreamedResponse
    {
        $schemas = $this->getSchemas();
        if (! isset($schemas[$type])) {
            abort(404, 'Invalid template type specified');
        }

        $schema = $schemas[$type];
        $filename = "{$type}_import_template.csv";

        return response()->streamDownload(function () use ($schema) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM so Microsoft Excel renders characters cleanly
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Write Header
            fputcsv($handle, $schema['headers']);

            // Write Sample Rows
            foreach ($schema['sample_rows'] as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Export live records to CSV spreadsheet
     */
    public function exportCsv(Request $request, string $type): StreamedResponse
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id ?? Tenant::first()?->id;

        $filename = "{$type}_export_".now()->format('Y-m-d_His').'.csv';

        return response()->streamDownload(function () use ($type, $tenantId) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            switch ($type) {
                case 'grocery_items':
                    fputcsv($handle, ['Name', 'Code', 'Category', 'Selling Price (TZS)', 'Cost Price (TZS)', 'Stock Quantity', 'Reorder Level', 'Unit', 'Is Available']);
                    PosItem::with('category')
                        ->where('tenant_id', $tenantId)
                        ->where('department', 'grocery')
                        ->orderBy('name')
                        ->chunk(100, function ($items) use ($handle) {
                            foreach ($items as $item) {
                                fputcsv($handle, [
                                    $item->name,
                                    $item->code,
                                    $item->category?->name ?? 'General',
                                    number_format($item->price_minor / 100, 2, '.', ''),
                                    number_format(($item->cost_price_minor ?? 0) / 100, 2, '.', ''),
                                    $item->stock_quantity ?? 0,
                                    $item->reorder_level ?? 10,
                                    $item->unit ?? 'pcs',
                                    $item->is_available ? 'Yes' : 'No',
                                ]);
                            }
                        });
                    break;

                case 'inventory_items':
                    fputcsv($handle, ['SKU', 'Name', 'Department', 'Unit', 'Current Quantity', 'Reorder Level', 'Unit Cost (TZS)', 'Notes', 'Is Active']);
                    InventoryItem::where('tenant_id', $tenantId)
                        ->orderBy('name')
                        ->chunk(100, function ($items) use ($handle) {
                            foreach ($items as $item) {
                                fputcsv($handle, [
                                    $item->sku,
                                    $item->name,
                                    $item->department ?? 'General Store',
                                    $item->unit ?? 'pcs',
                                    $item->current_quantity ?? 0,
                                    $item->reorder_level ?? 10,
                                    number_format(($item->unit_cost_minor ?? 0) / 100, 2, '.', ''),
                                    $item->notes ?? '',
                                    $item->is_active ? 'Yes' : 'No',
                                ]);
                            }
                        });
                    break;

                case 'guests':
                    fputcsv($handle, ['First Name', 'Last Name', 'Phone', 'Email', 'Gender', 'Nationality', 'ID Type', 'ID Number', 'Origin', 'Destination']);
                    Guest::where('tenant_id', $tenantId)
                        ->orderBy('last_name')
                        ->chunk(100, function ($guests) use ($handle) {
                            foreach ($guests as $g) {
                                fputcsv($handle, [
                                    $g->first_name,
                                    $g->last_name,
                                    $g->phone,
                                    $g->email,
                                    $g->gender,
                                    $g->nationality,
                                    $g->id_type,
                                    $g->id_number,
                                    $g->origin,
                                    $g->destination,
                                ]);
                            }
                        });
                    break;

                case 'expenses':
                    fputcsv($handle, ['Voucher Number', 'Date', 'Title', 'Category', 'Amount (TZS)', 'Vendor / Payee', 'Payment Method', 'Status', 'Notes']);
                    Expense::where('tenant_id', $tenantId)
                        ->orderByDesc('expense_date')
                        ->chunk(100, function ($expenses) use ($handle) {
                            foreach ($expenses as $e) {
                                fputcsv($handle, [
                                    $e->expense_number,
                                    $e->expense_date,
                                    $e->title,
                                    $e->category,
                                    number_format($e->amount_minor / 100, 2, '.', ''),
                                    $e->vendor_name ?? '',
                                    $e->payment_method ?? 'cash',
                                    $e->status,
                                    $e->notes ?? '',
                                ]);
                            }
                        });
                    break;

                case 'rooms':
                    fputcsv($handle, ['Room Number', 'Room Type', 'Floor', 'Occupancy Status', 'Housekeeping Status', 'Is Active']);
                    Room::with('roomType')
                        ->where('tenant_id', $tenantId)
                        ->orderBy('room_number')
                        ->chunk(100, function ($rooms) use ($handle) {
                            foreach ($rooms as $r) {
                                fputcsv($handle, [
                                    $r->room_number,
                                    $r->roomType?->name ?? 'Standard',
                                    $r->floor ?? '1',
                                    $r->status_occupancy ?? 'vacant',
                                    $r->status_hk ?? 'clean',
                                    $r->is_active ? 'Yes' : 'No',
                                ]);
                            }
                        });
                    break;

                default:
                    fputcsv($handle, ['Error', 'Unsupported export entity']);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Import CSV Spreadsheet with transaction validation & rollback safety
     */
    public function importCsv(Request $request, string $type): RedirectResponse
    {
        $request->validate([
            'csv_file' => 'required|file|max:10240', // 10MB max
        ]);

        $file = $request->file('csv_file');
        $ext = strtolower($file->getClientOriginalExtension());
        if (! in_array($ext, ['csv', 'txt'])) {
            return back()->with('error', 'Please upload a valid .csv file.');
        }

        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id ?? Tenant::first()?->id;

        $path = $file->getRealPath();
        $handle = fopen($path, 'r');
        if (! $handle) {
            return back()->with('error', 'Unable to read the uploaded CSV spreadsheet.');
        }

        // Auto-detect delimiter (, or ; or \t)
        $firstLine = fgets($handle);
        rewind($handle);

        $delimiter = ',';
        if (substr_count($firstLine, ';') > substr_count($firstLine, ',')) {
            $delimiter = ';';
        } elseif (substr_count($firstLine, "\t") > substr_count($firstLine, ',')) {
            $delimiter = "\t";
        }

        // Read and sanitize headers
        $rawHeaders = fgetcsv($handle, 0, $delimiter);
        if (! $rawHeaders || count($rawHeaders) === 0) {
            fclose($handle);

            return back()->with('error', 'The uploaded CSV file is empty or missing headers.');
        }

        $headers = array_map(function ($h) {
            // Remove UTF-8 BOM, quotes, and trim
            $h = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h);

            return strtolower(trim(str_replace([' ', '_', '-'], '', $h)));
        }, $rawHeaders);

        $createdCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $errors = [];
        $rowNumber = 1;

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
                $rowNumber++;

                // Skip empty lines
                if (count(array_filter($row)) === 0) {
                    continue;
                }

                $data = [];
                foreach ($headers as $index => $headerKey) {
                    $data[$headerKey] = isset($row[$index]) ? trim($row[$index]) : '';
                }

                // Process specific entity
                switch ($type) {
                    case 'grocery_items':
                        $res = $this->processGroceryRow($data, $tenantId, $property?->id, $user->id, $rowNumber);
                        break;

                    case 'inventory_items':
                        $res = $this->processInventoryRow($data, $tenantId, $property?->id, $rowNumber);
                        break;

                    case 'guests':
                        $res = $this->processGuestRow($data, $tenantId, $rowNumber);
                        break;

                    case 'expenses':
                        $res = $this->processExpenseRow($data, $tenantId, $property?->id, $user->id, $rowNumber);
                        break;

                    case 'rooms':
                        $res = $this->processRoomRow($data, $tenantId, $property?->id, $rowNumber);
                        break;

                    default:
                        $res = ['status' => 'error', 'message' => "Unsupported entity '{$type}'"];
                }

                if ($res['status'] === 'created') {
                    $createdCount++;
                } elseif ($res['status'] === 'updated') {
                    $updatedCount++;
                } elseif ($res['status'] === 'skipped') {
                    $skippedCount++;
                    if (! empty($res['message'])) {
                        $errors[] = "Row {$rowNumber}: {$res['message']}";
                    }
                } elseif ($res['status'] === 'error') {
                    $skippedCount++;
                    $errors[] = "Row {$rowNumber}: {$res['message']}";
                }
            }

            fclose($handle);

            DB::commit();

            $msg = "Import completed successfully! Created: {$createdCount}, Updated: {$updatedCount}.";
            if ($skippedCount > 0) {
                $msg .= " Skipped: {$skippedCount}.";
            }

            return back()->with([
                'success' => $msg,
                'import_errors' => array_slice($errors, 0, 10),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);

            return back()->with('error', "Import error on row {$rowNumber}: ".$e->getMessage());
        }
    }

    /**
     * Process single row for Grocery / Supermarket item
     */
    protected function processGroceryRow(array $data, string $tenantId, ?string $propertyId, string $userId, int $rowNum): array
    {
        $name = $data['name'] ?? $data['productname'] ?? $data['itemname'] ?? '';
        if (empty($name)) {
            return ['status' => 'error', 'message' => 'Missing product name'];
        }

        $code = $data['code'] ?? $data['sku'] ?? $data['barcode'] ?? 'GRO-'.strtoupper(substr(uniqid(), -6));
        $categoryName = $data['category'] ?? $data['categoryname'] ?? 'General Grocery';
        $price = $this->cleanAmount($data['sellingprice'] ?? $data['price'] ?? $data['unitprice'] ?? 0);
        $cost = $this->cleanAmount($data['costprice'] ?? $data['cost'] ?? $data['buyingprice'] ?? 0);
        $stock = (int) ($data['stockquantity'] ?? $data['stock'] ?? $data['quantity'] ?? $data['qty'] ?? 0);
        $reorder = (int) ($data['reorderlevel'] ?? $data['reorder'] ?? 10);
        $unit = $data['unit'] ?? 'pcs';
        $isAvailable = ! in_array(strtolower($data['isavailable'] ?? 'yes'), ['no', 'false', '0']);

        // Resolve or create category
        $category = PosCategory::firstOrCreate([
            'tenant_id' => $tenantId,
            'department' => 'grocery',
            'name' => $categoryName,
        ], [
            'property_id' => $propertyId,
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $item = PosItem::where('tenant_id', $tenantId)
            ->where('department', 'grocery')
            ->where(function ($q) use ($code, $name) {
                $q->where('code', $code)->orWhere('name', $name);
            })
            ->first();

        if ($item) {
            $item->update([
                'pos_category_id' => $category->id,
                'price_minor' => $price,
                'cost_price_minor' => $cost,
                'stock_quantity' => $stock,
                'reorder_level' => $reorder,
                'unit' => $unit,
                'is_available' => $isAvailable,
            ]);

            return ['status' => 'updated'];
        }

        $newItem = PosItem::create([
            'tenant_id' => $tenantId,
            'property_id' => $propertyId,
            'pos_category_id' => $category->id,
            'department' => 'grocery',
            'name' => $name,
            'code' => $code,
            'price_minor' => $price,
            'cost_price_minor' => $cost,
            'stock_quantity' => $stock,
            'reorder_level' => $reorder,
            'unit' => $unit,
            'is_available' => $isAvailable,
        ]);

        if ($stock > 0) {
            StockMovement::create([
                'tenant_id' => $tenantId,
                'property_id' => $propertyId,
                'pos_item_id' => $newItem->id,
                'movement_type' => 'receive_stock',
                'quantity' => $stock,
                'unit_cost_minor' => $cost,
                'reference_no' => 'CSV-IMPORT-ENTRY',
                'notes' => 'Bulk imported via spreadsheet CSV entry',
                'performed_by' => $userId,
            ]);
        }

        return ['status' => 'created'];
    }

    /**
     * Process single row for General Store Inventory Item
     */
    protected function processInventoryRow(array $data, string $tenantId, ?string $propertyId, int $rowNum): array
    {
        $name = $data['name'] ?? $data['itemname'] ?? '';
        if (empty($name)) {
            return ['status' => 'error', 'message' => 'Missing item name'];
        }

        $sku = $data['sku'] ?? $data['code'] ?? 'SKU-'.strtoupper(substr(uniqid(), -6));
        $department = $data['department'] ?? 'General Store';
        $unit = $data['unit'] ?? 'pcs';
        $quantity = (int) ($data['currentquantity'] ?? $data['quantity'] ?? $data['stock'] ?? 0);
        $reorder = (int) ($data['reorderlevel'] ?? $data['reorder'] ?? 10);
        $unitCost = $this->cleanAmount($data['unitcost'] ?? $data['cost'] ?? 0);
        $notes = $data['notes'] ?? 'CSV data import';

        $item = InventoryItem::where('tenant_id', $tenantId)
            ->where(function ($q) use ($sku, $name) {
                $q->where('sku', $sku)->orWhere('name', $name);
            })
            ->first();

        if ($item) {
            $item->update([
                'current_quantity' => $quantity,
                'reorder_level' => $reorder,
                'unit_cost_minor' => $unitCost,
                'department' => $department,
                'unit' => $unit,
                'notes' => $notes,
            ]);

            return ['status' => 'updated'];
        }

        InventoryItem::create([
            'tenant_id' => $tenantId,
            'property_id' => $propertyId,
            'sku' => $sku,
            'name' => $name,
            'department' => $department,
            'unit' => $unit,
            'current_quantity' => $quantity,
            'reorder_level' => $reorder,
            'unit_cost_minor' => $unitCost,
            'notes' => $notes,
            'is_active' => true,
        ]);

        return ['status' => 'created'];
    }

    /**
     * Process single row for Guest
     */
    protected function processGuestRow(array $data, string $tenantId, int $rowNum): array
    {
        $firstName = $data['firstname'] ?? $data['first'] ?? '';
        $lastName = $data['lastname'] ?? $data['last'] ?? $data['surname'] ?? '';

        if (empty($firstName) && empty($lastName)) {
            return ['status' => 'error', 'message' => 'Missing guest name'];
        }

        if (empty($firstName)) {
            $firstName = 'Guest';
        }
        if (empty($lastName)) {
            $lastName = 'Customer';
        }

        $phone = $data['phone'] ?? $data['phonenumber'] ?? $data['mobile'] ?? null;
        $email = $data['email'] ?? null;
        $gender = strtolower($data['gender'] ?? 'other');
        if (! in_array($gender, ['male', 'female', 'other'])) {
            $gender = 'other';
        }

        $nationality = $data['nationality'] ?? 'Tanzanian';
        $idType = $data['idtype'] ?? 'national_id';
        $idNumber = $data['idnumber'] ?? $data['idno'] ?? null;
        $origin = $data['origin'] ?? null;
        $destination = $data['destination'] ?? null;

        $guest = Guest::where('tenant_id', $tenantId)
            ->where(function ($q) use ($phone, $email, $idNumber) {
                if ($phone) {
                    $q->orWhere('phone', $phone);
                }
                if ($email) {
                    $q->orWhere('email', $email);
                }
                if ($idNumber) {
                    $q->orWhere('id_number', $idNumber);
                }
            })
            ->first();

        if ($guest) {
            $guest->update([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'gender' => $gender,
                'phone' => $phone ?: $guest->phone,
                'email' => $email ?: $guest->email,
                'nationality' => $nationality,
                'id_type' => $idType,
                'id_number' => $idNumber ?: $guest->id_number,
                'origin' => $origin,
                'destination' => $destination,
            ]);

            return ['status' => 'updated'];
        }

        Guest::create([
            'tenant_id' => $tenantId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'gender' => $gender,
            'phone' => $phone,
            'email' => $email,
            'nationality' => $nationality,
            'id_type' => $idType,
            'id_number' => $idNumber,
            'origin' => $origin,
            'destination' => $destination,
            'is_resident' => true,
        ]);

        return ['status' => 'created'];
    }

    /**
     * Process single row for Expense
     */
    protected function processExpenseRow(array $data, string $tenantId, ?string $propertyId, string $userId, int $rowNum): array
    {
        $title = $data['title'] ?? $data['description'] ?? $data['purpose'] ?? '';
        if (empty($title)) {
            return ['status' => 'error', 'message' => 'Missing expense title / purpose'];
        }

        $amount = $this->cleanAmount($data['amount'] ?? $data['amounttzs'] ?? 0);
        if ($amount <= 0) {
            return ['status' => 'error', 'message' => 'Invalid or zero amount'];
        }

        $category = strtolower($data['category'] ?? 'utilities');
        $validCategories = ['utilities', 'supplies', 'maintenance', 'payroll', 'marketing', 'administrative'];
        if (! in_array($category, $validCategories)) {
            $category = 'utilities';
        }

        $vendor = $data['vendor'] ?? $data['vendorname'] ?? $data['payee'] ?? 'General Supplier';
        $dateStr = $data['date'] ?? $data['expensedate'] ?? now()->toDateString();
        try {
            $expenseDate = Carbon::parse($dateStr)->toDateString();
        } catch (\Throwable $e) {
            $expenseDate = now()->toDateString();
        }

        $method = strtolower($data['paymentmethod'] ?? $data['method'] ?? 'cash');
        if (! in_array($method, ['cash', 'bank_transfer', 'mpesa'])) {
            $method = 'cash';
        }

        $ref = $data['reference'] ?? $data['receiptreference'] ?? null;
        $notes = $data['notes'] ?? 'CSV bulk data entry';

        $account = Account::where('tenant_id', $tenantId)->where('type', 'expense')->first();

        Expense::create([
            'tenant_id' => $tenantId,
            'property_id' => $propertyId,
            'user_id' => $userId,
            'account_id' => $account?->id,
            'expense_number' => 'EXP-CSV-'.strtoupper(substr(uniqid(), -6)),
            'title' => $title,
            'category' => $category,
            'vendor_name' => $vendor,
            'amount_minor' => $amount,
            'payment_method' => $method,
            'expense_date' => $expenseDate,
            'status' => 'approved',
            'receipt_reference' => $ref,
            'notes' => $notes,
        ]);

        return ['status' => 'created'];
    }

    /**
     * Process single row for Hotel Room
     */
    protected function processRoomRow(array $data, string $tenantId, ?string $propertyId, int $rowNum): array
    {
        $roomNumber = $data['roomnumber'] ?? $data['roomno'] ?? $data['room'] ?? '';
        if (empty($roomNumber)) {
            return ['status' => 'error', 'message' => 'Missing room number'];
        }

        $roomTypeName = $data['roomtype'] ?? $data['type'] ?? 'Standard Room';
        $floor = (int) ($data['floor'] ?? 1);
        $occupancy = strtolower($data['occupancystatus'] ?? $data['status'] ?? 'vacant');
        $hkStatus = strtolower($data['housekeepingstatus'] ?? $data['hkstatus'] ?? 'clean');

        $roomType = RoomType::firstOrCreate([
            'tenant_id' => $tenantId,
            'name' => $roomTypeName,
        ], [
            'property_id' => $propertyId,
            'code' => strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $roomTypeName), 0, 4)),
            'base_occupancy' => 2,
            'max_adults' => 2,
            'max_children' => 1,
            'base_price_minor' => 8000000, // 80,000 TZS default
            'is_active' => true,
        ]);

        $room = Room::where('tenant_id', $tenantId)
            ->where('room_number', $roomNumber)
            ->first();

        if ($room) {
            $room->update([
                'room_type_id' => $roomType->id,
                'floor' => $floor,
                'status_occupancy' => $occupancy,
                'status_hk' => $hkStatus,
            ]);

            return ['status' => 'updated'];
        }

        Room::create([
            'tenant_id' => $tenantId,
            'property_id' => $propertyId,
            'room_type_id' => $roomType->id,
            'room_number' => $roomNumber,
            'floor' => $floor,
            'status_occupancy' => $occupancy,
            'status_hk' => $hkStatus,
            'is_active' => true,
        ]);

        return ['status' => 'created'];
    }

    /**
     * Helper to clean currency / amounts and return minor units (cents)
     */
    protected function cleanAmount($value): int
    {
        if (empty($value)) {
            return 0;
        }

        // Strip currency symbols, commas, spaces
        $clean = preg_replace('/[^0-9.]/', '', (string) $value);
        $floatVal = (float) $clean;

        return (int) round($floatVal * 100);
    }

    /**
     * Template definitions and schema guide
     */
    protected function getSchemas(): array
    {
        return [
            'grocery_items' => [
                'title' => 'Supermarket & Mini Market Catalog',
                'description' => 'Bulk add or restock retail snacks, bottled sodas, toiletries, and merchandise.',
                'headers' => ['Name', 'Code', 'Category', 'Selling Price', 'Cost Price', 'Stock Quantity', 'Reorder Level', 'Unit', 'Is Available'],
                'sample_rows' => [
                    ['Coca-Cola 500ml Pet', 'BEV-001', 'Bottled Drinks & Sodas', '1500', '1000', '48', '12', 'bottle', 'Yes'],
                    ['Kilimanjaro Drinking Water 1.5L', 'BEV-002', 'Bottled Drinks & Sodas', '2000', '1300', '60', '15', 'bottle', 'Yes'],
                    ['Pringles Original 110g', 'SNK-001', 'Snacks & Confectionery', '8500', '6500', '24', '6', 'can', 'Yes'],
                    ['Colgate Toothpaste Total 100g', 'SUN-001', 'Personal Care & Sundries', '4500', '3200', '30', '10', 'tube', 'Yes'],
                ],
            ],
            'inventory_items' => [
                'title' => 'Central Warehouse & Store Inventory',
                'description' => 'Bulk register hotel linens, cleaning supplies, engineering hardware, and kitchen storeroom items.',
                'headers' => ['SKU', 'Name', 'Department', 'Unit', 'Current Quantity', 'Reorder Level', 'Unit Cost', 'Notes'],
                'sample_rows' => [
                    ['LIN-001', 'King Bed White Fitted Sheet 300TC', 'Housekeeping', 'pcs', '50', '15', '35000', 'Cotton percale white'],
                    ['DET-002', 'Commercial Laundry Detergent Liquid 20L', 'Housekeeping', 'drum', '12', '4', '85000', 'Hypoallergenic drum'],
                    ['ELEC-003', 'LED Light Bulb 9W Warm White E27', 'Maintenance', 'pcs', '100', '20', '4500', 'Philips warm glow'],
                    ['KIT-004', 'Basmati Rice 25kg Royal Bag', 'Kitchen F&B', 'bag', '8', '2', '95000', 'Grade A Aromatic'],
                ],
            ],
            'guests' => [
                'title' => 'Guest Directory & Customer Profiles',
                'description' => 'Bulk import guest contact details, nationalities, passport numbers, and company affiliations.',
                'headers' => ['First Name', 'Last Name', 'Phone', 'Email', 'Gender', 'Nationality', 'ID Type', 'ID Number', 'Origin', 'Destination'],
                'sample_rows' => [
                    ['Juma', 'Mkwawa', '+255712345678', 'juma.mkwawa@gmail.com', 'male', 'Tanzanian', 'national_id', '19850412-12345-00001', 'Dar es Salaam', 'Arusha'],
                    ['Sarah', 'Jenkins', '+447911123456', 's.jenkins@safari.co.uk', 'female', 'British', 'passport', 'GB98234120', 'London', 'Serengeti'],
                    ['Amara', 'Diallo', '+254700987654', 'amara.diallo@outlook.com', 'female', 'Kenyan', 'passport', 'KE4491028', 'Nairobi', 'Zanzibar'],
                ],
            ],
            'expenses' => [
                'title' => 'Financial Expenses & Disbursement Vouchers',
                'description' => 'Bulk upload past operational expense records, utility payments, maintenance receipts, and payroll disbursements.',
                'headers' => ['Date', 'Title', 'Category', 'Amount', 'Vendor Name', 'Payment Method', 'Receipt Reference', 'Notes'],
                'sample_rows' => [
                    [now()->subDays(2)->format('Y-m-d'), 'TANESCO Power Token Recharge Meter #241', 'utilities', '350000', 'TANESCO Ltd', 'mpesa', 'TAN-882194', 'Monthly power prepaid'],
                    [now()->subDays(1)->format('Y-m-d'), 'DAWASA Water Utility Bill - October', 'utilities', '125000', 'DAWASA Water', 'bank_transfer', 'DAW-09923', 'Direct bank settlement'],
                    [now()->format('Y-m-d'), 'Fresh Vegetables & Kitchen Farm Market', 'supplies', '220000', 'Kariakoo Market', 'cash', 'RCP-8812', 'Daily chef procurement'],
                ],
            ],
            'rooms' => [
                'title' => 'Hotel Rooms & Lodging Units',
                'description' => 'Bulk register property rooms, suites, floor levels, and initial housekeeping states.',
                'headers' => ['Room Number', 'Room Type', 'Floor', 'Occupancy Status', 'Housekeeping Status'],
                'sample_rows' => [
                    ['101', 'Deluxe King Suite', '1', 'vacant', 'clean'],
                    ['102', 'Deluxe Twin Room', '1', 'vacant', 'clean'],
                    ['201', 'Executive Ocean Suite', '2', 'vacant', 'inspected'],
                    ['202', 'Standard Single Room', '2', 'vacant', 'clean'],
                    ['301', 'Presidential Penthouse', '3', 'vacant', 'inspected'],
                ],
            ],
        ];
    }
}

