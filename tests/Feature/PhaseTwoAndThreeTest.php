<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\BusinessDate;
use App\Models\Employee;
use App\Models\Folio;
use App\Models\Guest;
use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Reservation;
use App\Models\ReservationRoom;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Stay;
use App\Models\Tenant;
use App\Models\User;
use App\Models\WhatsAppSetting;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PhaseTwoAndThreeTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Tenant $tenant;
    protected Property $property;
    protected Room $room;
    protected Guest $guest;
    protected Stay $stay;
    protected Folio $folio;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'The Inns Group',
            'slug' => 'the-inns',
            'plan' => 'Professional',
            'max_branches' => 5,
        ]);

        $this->property = Property::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'The Inns Downtown',
            'code' => 'TIN-01',
            'city' => 'Dar es Salaam',
            'currency' => 'TZS',
            'timezone' => 'Africa/Dar_es_Salaam',
        ]);

        BusinessDate::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'current_business_date' => Carbon::today()->toDateString(),
            'roll_state' => 'open',
        ]);

        $this->admin = User::factory()->create([
            'name' => 'Eng Cassidy',
            'email' => 'cassidy@theinns.co.tz',
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'role' => 'general_manager',
        ]);

        $roomType = RoomType::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'Deluxe Suite',
            'code' => 'DLX',
            'base_occupancy' => 2,
            'max_occupancy' => 3,
            'base_rate_minor' => 15000000,
        ]);

        $this->room = Room::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'room_type_id' => $roomType->id,
            'room_number' => '101',
            'status_cleanliness' => 'inspected_clean',
            'status_occupancy' => 'occupied',
        ]);

        $this->guest = Guest::create([
            'tenant_id' => $this->tenant->id,
            'first_name' => 'Baraka',
            'last_name' => 'Mlowe',
            'email' => 'baraka@example.com',
            'phone' => '+255712000111',
        ]);

        $reservation = Reservation::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'ref_no' => 'RES-9988',
            'guest_id' => $this->guest->id,
            'status' => 'checked_in',
            'source' => 'walk_in',
            'check_in' => Carbon::today(),
            'check_out' => Carbon::tomorrow(),
            'total_minor' => 15000000,
        ]);

        $ratePlan = RatePlan::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'code' => 'BB',
            'name' => 'Bed & Breakfast',
            'meal_plan' => 'BB',
        ]);

        $resRoom = ReservationRoom::create([
            'tenant_id' => $this->tenant->id,
            'reservation_id' => $reservation->id,
            'room_type_id' => $roomType->id,
            'rate_plan_id' => $ratePlan->id,
            'check_in' => Carbon::today(),
            'check_out' => Carbon::tomorrow(),
            'rate_price_minor' => 15000000,
            'status' => 'confirmed',
        ]);

        $this->stay = Stay::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'reservation_id' => $reservation->id,
            'reservation_room_id' => $resRoom->id,
            'room_id' => $this->room->id,
            'guest_id' => $this->guest->id,
            'checked_in_at' => Carbon::now(),
        ]);

        $this->folio = Folio::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'reservation_id' => $reservation->id,
            'stay_id' => $this->stay->id,
            'folio_number' => 'FOL-9988',
            'owner_type' => 'guest',
            'owner_id' => $this->guest->id,
            'currency' => 'TZS',
            'status' => 'open',
        ]);
    }

    public function test_pos_index_and_order_creation_direct(): void
    {
        $category = PosCategory::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'Main Dining',
            'code' => 'MAIN',
        ]);

        $item = PosItem::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'pos_category_id' => $category->id,
            'name' => 'Grilled Tilapia',
            'price_minor' => 2500000,
            'is_available' => true,
        ]);

        $response = $this->actingAs($this->admin)->get(route('pos.index'));
        $response->assertStatus(200);

        // Place a direct paid order
        $orderData = [
            'order_type' => 'dine_in',
            'table_number' => 'T-04',
            'payment_method' => 'cash',
            'items' => [
                [
                    'item_id' => $item->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $postResponse = $this->actingAs($this->admin)->post(route('pos.store'), $orderData);
        $postResponse->assertRedirect();

        $this->assertDatabaseHas('pos_orders', [
            'tenant_id' => $this->tenant->id,
            'table_number' => 'T-04',
            'payment_status' => 'paid',
            'total_minor' => 5900000, // 5,000,000 + 18% VAT (900,000)
        ]);
    }

    public function test_pos_order_posted_to_inhouse_room_folio(): void
    {
        $category = PosCategory::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'Room Service',
            'code' => 'RS',
        ]);

        $item = PosItem::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'pos_category_id' => $category->id,
            'name' => 'Club Sandwich',
            'price_minor' => 1800000,
            'is_available' => true,
        ]);

        $orderData = [
            'order_type' => 'room_delivery',
            'room_id' => $this->room->id,
            'stay_id' => $this->stay->id,
            'folio_id' => $this->folio->id,
            'guest_name' => 'Baraka Mlowe',
            'payment_method' => 'room_folio',
            'items' => [
                [
                    'item_id' => $item->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post(route('pos.store'), $orderData);
        $response->assertRedirect();

        $this->assertDatabaseHas('pos_orders', [
            'room_id' => $this->room->id,
            'payment_status' => 'posted_to_room',
            'total_minor' => 2124000, // 1,800,000 + 18% VAT (324,000)
        ]);

        $this->assertDatabaseHas('folio_lines', [
            'folio_id' => $this->folio->id,
            'amount_minor' => 2124000,
        ]);
    }

    public function test_accounting_system_and_expense_creation(): void
    {
        $account = Account::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'code' => 'EXP-UTL-01',
            'name' => 'Electricity & Water Utilities',
            'type' => 'expense',
            'category' => 'utilities',
        ]);

        $response = $this->actingAs($this->admin)->get(route('accounting.index'));
        $response->assertStatus(200);

        $expenseData = [
            'account_id' => $account->id,
            'title' => 'TANESCO Power Units',
            'category' => 'utilities',
            'vendor_name' => 'TANESCO',
            'amount_minor' => 45000000,
            'payment_method' => 'bank_transfer',
            'expense_date' => Carbon::today()->toDateString(),
            'notes' => 'Monthly meter recharge',
        ];

        $postResponse = $this->actingAs($this->admin)->post(route('accounting.expenses.store'), $expenseData);
        $postResponse->assertRedirect();

        $this->assertDatabaseHas('expenses', [
            'title' => 'TANESCO Power Units',
            'amount_minor' => 45000000,
        ]);
    }

    public function test_hr_system_and_shift_rostering(): void
    {
        $response = $this->actingAs($this->admin)->get(route('hr.index'));
        $response->assertStatus(200);

        $employeeData = [
            'full_name' => 'Neema Mushi',
            'department' => 'housekeeping',
            'position' => 'Floor Supervisor',
            'phone' => '+255788112233',
            'salary_minor' => 60000000,
            'employment_type' => 'full_time',
            'hire_date' => Carbon::today()->subMonths(3)->toDateString(),
        ];

        $empPost = $this->actingAs($this->admin)->post(route('hr.employees.store'), $employeeData);
        $empPost->assertRedirect();

        $employee = Employee::where('full_name', 'Neema Mushi')->first();
        $this->assertNotNull($employee);

        // Schedule shift
        $shiftData = [
            'employee_id' => $employee->id,
            'shift_date' => Carbon::today()->toDateString(),
            'shift_type' => 'morning',
            'start_time' => '07:00',
            'end_time' => '15:30',
            'notes' => 'Floors 1 & 2 inspection',
        ];

        $shiftPost = $this->actingAs($this->admin)->post(route('hr.schedules.store'), $shiftData);
        $shiftPost->assertRedirect();

        $this->assertDatabaseHas('staff_schedules', [
            'employee_id' => $employee->id,
            'shift_type' => 'morning',
        ]);
    }

    public function test_manager_reports_and_kpis(): void
    {
        $response = $this->actingAs($this->admin)->get(route('reports.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Index')
            ->has('metrics')
            ->has('branchComparisons')
        );
    }

    public function test_whatsapp_configuration_and_dispatch(): void
    {
        $response = $this->actingAs($this->admin)->get(route('whatsapp.index'));
        $response->assertStatus(200);

        // Update settings
        $settingsData = [
            'phone_number_id' => '1029384756',
            'business_account_id' => '9988776655',
            'access_token' => 'EAA_TEST_TOKEN',
            'sender_phone_number' => '+255767000111',
            'send_on_reservation_confirmed' => true,
            'send_on_checkin' => true,
            'send_on_checkout_invoice' => true,
            'send_on_housekeeping_ready' => true,
            'is_active' => true,
        ];

        $updateResp = $this->actingAs($this->admin)->post(route('whatsapp.settings.update'), $settingsData);
        $updateResp->assertRedirect();

        $this->assertDatabaseHas('whatsapp_settings', [
            'phone_number_id' => '1029384756',
            'sender_phone_number' => '+255767000111',
        ]);

        Http::fake([
            'https://graph.facebook.com/*' => Http::response([
                'messages' => [['id' => 'wamid.HBgLMTE5OA==']],
            ], 200),
        ]);

        // Dispatch direct message
        $msgData = [
            'recipient_phone' => '+255712000111',
            'recipient_name' => 'Baraka Mlowe',
            'message' => 'Habari mgeni wetu, chumba chako kipo tayari!',
            'guest_id' => $this->guest->id,
        ];

        $sendResp = $this->actingAs($this->admin)->post(route('whatsapp.send'), $msgData);
        $sendResp->assertRedirect();

        $this->assertDatabaseHas('whatsapp_logs', [
            'recipient_phone' => '255712000111',
            'status' => 'delivered',
        ]);
    }

    public function test_saas_admin_tenant_plan_update(): void
    {
        $response = $this->actingAs($this->admin)->get(route('saas-admin.index'));
        $response->assertStatus(200);

        $updateData = [
            'name' => 'The Inns Luxury Hotels International',
            'plan' => 'enterprise',
            'max_branches' => 10,
            'subscription_price' => 500000,
            'license_expiry' => null,
            'is_active' => true,
        ];

        $postResp = $this->actingAs($this->admin)->put(route('saas-admin.tenants.update', $this->tenant), $updateData);
        $postResp->assertRedirect();

        $this->assertDatabaseHas('tenants', [
            'id' => $this->tenant->id,
            'name' => 'The Inns Luxury Hotels International',
            'plan' => 'enterprise',
            'max_branches' => 10,
        ]);
    }
}
