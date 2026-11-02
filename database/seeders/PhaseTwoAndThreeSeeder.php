<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use App\Models\WhatsAppSetting;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PhaseTwoAndThreeSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::first();
        if (! $tenant) {
            return;
        }

        $property = Property::where('tenant_id', $tenant->id)->first() ?? Property::first();
        $adminUser = User::where('tenant_id', $tenant->id)->first() ?? User::first();

        // 1. POS Menu Categories
        $catBreakfast = PosCategory::firstOrCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Breakfast & Bakery',
        ], [
            'property_id' => $property?->id,
            'department' => 'restaurant',
            'icon' => 'coffee',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $catMains = PosCategory::firstOrCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Main Dining & Grills',
        ], [
            'property_id' => $property?->id,
            'department' => 'restaurant',
            'icon' => 'utensils',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $catDrinks = PosCategory::firstOrCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Cocktails & Beverages',
        ], [
            'property_id' => $property?->id,
            'department' => 'restaurant',
            'icon' => 'glass',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        // 2. POS Items
        $items = [
            ['cat' => $catBreakfast, 'name' => 'Full English Continental Breakfast', 'price' => 1800, 'code' => 'B01', 'desc' => 'Eggs, sausages, baked beans, toast and fresh tropical fruit juice.'],
            ['cat' => $catBreakfast, 'name' => 'Swahili Chapati & Beef Curry', 'price' => 1200, 'code' => 'B02', 'desc' => 'Flaky handmade chapati served with aromatic tender beef broth.'],
            ['cat' => $catMains, 'name' => 'Grilled Prime Serengeti Beef Tenderloin', 'price' => 3200, 'code' => 'M01', 'desc' => '300g tenderloin steak with pepper sauce, fries and seasonal veggies.'],
            ['cat' => $catMains, 'name' => 'Pan-Seared Zanzibar Kingfish', 'price' => 2800, 'code' => 'M02', 'desc' => 'Fresh ocean kingfish fillet with coconut lemongrass sauce & pilau rice.'],
            ['cat' => $catDrinks, 'name' => 'Kilimanjaro Sunset Cocktail', 'price' => 1400, 'code' => 'D01', 'desc' => 'Rum, passion fruit, lime juice, and grenadine layered over crushed ice.'],
            ['cat' => $catDrinks, 'name' => 'Fresh Pressed Hibiscus & Mint Juice', 'price' => 600, 'code' => 'D02', 'desc' => 'Chilled local hibiscus infused with garden mint and wild honey.'],
        ];

        foreach ($items as $item) {
            PosItem::firstOrCreate([
                'tenant_id' => $tenant->id,
                'name' => $item['name'],
            ], [
                'property_id' => $property?->id,
                'pos_category_id' => $item['cat']->id,
                'department' => 'restaurant',
                'code' => $item['code'],
                'price_minor' => $item['price'],
                'description' => $item['desc'],
                'is_available' => true,
            ]);
        }

        // 3. Chart of Accounts
        $accounts = [
            ['code' => '4001', 'name' => 'Room Accommodation Revenue', 'type' => 'revenue', 'cat' => 'room_revenue'],
            ['code' => '4002', 'name' => 'Restaurant & Bar Sales', 'type' => 'revenue', 'cat' => 'food_beverage'],
            ['code' => '5001', 'name' => 'Kitchen Food & Beverage Supplies', 'type' => 'expense', 'cat' => 'supplies'],
            ['code' => '5002', 'name' => 'Electricity & Water Utility Bills', 'type' => 'expense', 'cat' => 'utilities'],
            ['code' => '5003', 'name' => 'Housekeeping & Laundry Linen Detergents', 'type' => 'expense', 'cat' => 'maintenance'],
            ['code' => '5004', 'name' => 'Staff Salaries & Advances', 'type' => 'expense', 'cat' => 'payroll'],
        ];

        foreach ($accounts as $acc) {
            Account::firstOrCreate([
                'tenant_id' => $tenant->id,
                'name' => $acc['name'],
            ], [
                'property_id' => $property?->id,
                'code' => $acc['code'],
                'type' => $acc['type'],
                'category' => $acc['cat'],
                'balance_minor' => 0,
                'is_active' => true,
            ]);
        }

        // 4. Sample Hotel Expenses
        $accUtility = Account::where('tenant_id', $tenant->id)->where('code', '5002')->first();
        if ($accUtility) {
            Expense::firstOrCreate([
                'tenant_id' => $tenant->id,
                'expense_number' => 'EXP-2026-001',
            ], [
                'property_id' => $property?->id,
                'account_id' => $accUtility->id,
                'created_by' => $adminUser?->id,
                'title' => 'TANESCO Commercial Power Grid Bill',
                'category' => 'utilities',
                'vendor_name' => 'TANESCO Power Ltd',
                'amount_minor' => 84000,
                'payment_method' => 'bank_transfer',
                'expense_date' => Carbon::today(),
                'status' => 'paid',
                'receipt_reference' => 'TAN-99214',
                'notes' => 'Monthly electricity token for main guest lodge and laundry facilities.',
            ]);
        }

        // 5. Staff Directory (HR)
        $employees = [
            ['code' => 'EMP-01', 'name' => 'Juma Bakari', 'dept' => 'front_office', 'pos' => 'Head Receptionist', 'phone' => '+255 712 111 222', 'salary' => 85000],
            ['code' => 'EMP-02', 'name' => 'Zawadi Mussa', 'dept' => 'housekeeping', 'pos' => 'Housekeeping Supervisor', 'phone' => '+255 714 333 444', 'salary' => 70000],
            ['code' => 'EMP-03', 'name' => 'Chef Michael Mwamba', 'dept' => 'food_beverage', 'pos' => 'Executive Head Chef', 'phone' => '+255 715 555 666', 'salary' => 120000],
            ['code' => 'EMP-04', 'name' => 'Fatma Ally', 'dept' => 'food_beverage', 'pos' => 'Restaurant Bartender', 'phone' => '+255 716 777 888', 'salary' => 60000],
            ['code' => 'EMP-05', 'name' => 'Hamisi Kondo', 'dept' => 'maintenance', 'pos' => 'HVAC & Facility Electrician', 'phone' => '+255 718 999 000', 'salary' => 75000],
        ];

        foreach ($employees as $emp) {
            Employee::firstOrCreate([
                'tenant_id' => $tenant->id,
                'employee_code' => $emp['code'],
            ], [
                'property_id' => $property?->id,
                'full_name' => $emp['name'],
                'department' => $emp['dept'],
                'position' => $emp['pos'],
                'phone' => $emp['phone'],
                'salary_minor' => $emp['salary'],
                'hire_date' => Carbon::now()->subMonths(6)->toDateString(),
                'employment_type' => 'full_time',
                'status' => 'active',
            ]);
        }

        // 6. WhatsApp Configuration Initial Record
        WhatsAppSetting::firstOrCreate([
            'tenant_id' => $tenant->id,
        ], [
            'property_id' => $property?->id,
            'provider' => 'cloud_api',
            'phone_number_id' => '1029384756',
            'business_account_id' => '9988776655',
            'access_token' => 'EAA...SIMULATED_TOKEN',
            'sender_phone_number' => '+255 754 000 111',
            'send_on_reservation_confirmed' => true,
            'send_on_checkin' => true,
            'send_on_checkout_invoice' => true,
            'send_on_housekeeping_ready' => true,
            'is_active' => true,
        ]);
    }
}
