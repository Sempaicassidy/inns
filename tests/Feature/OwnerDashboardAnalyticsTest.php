<?php

namespace Tests\Feature;

use App\Models\BusinessDate;
use App\Models\Expense;
use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\PosOrder;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnerDashboardAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected Property $propertyA1;
    protected Property $propertyA2;
    protected Property $propertyB;
    protected User $ownerA;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Setup Tenant A
        $this->tenantA = Tenant::create([
            'name' => 'Serengeti Hospitality Group',
            'slug' => 'serengeti-hospitality',
            'plan' => 'enterprise',
            'max_branches' => 5,
        ]);

        $this->propertyA1 = Property::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Serengeti Grand Lodge',
            'code' => 'SGL-01',
            'city' => 'Arusha',
            'currency' => 'TZS',
            'timezone' => 'Africa/Dar_es_Salaam',
            'monthly_target_revenue_minor' => 5000000000,
        ]);

        $this->propertyA2 = Property::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Zanzibar Ocean View',
            'code' => 'ZOV-02',
            'city' => 'Zanzibar',
            'currency' => 'TZS',
            'timezone' => 'Africa/Dar_es_Salaam',
            'monthly_target_revenue_minor' => 3000000000,
        ]);

        BusinessDate::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'current_business_date' => Carbon::today()->toDateString(),
            'roll_state' => 'open',
        ]);

        $this->ownerA = User::factory()->create([
            'name' => 'Managing Director A',
            'email' => 'owner@serengetigroup.co.tz',
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'role' => 'owner',
            'roles' => ['owner'],
        ]);

        $this->regularUser = User::factory()->create([
            'name' => 'Front Desk Staff',
            'email' => 'desk@serengetigroup.co.tz',
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'role' => 'receptionist',
            'roles' => ['receptionist'],
        ]);

        // 2. Setup Tenant B (for Tenant Isolation verification)
        $this->tenantB = Tenant::create([
            'name' => 'Kilimanjaro Luxury Safari',
            'slug' => 'kilimanjaro-safari',
            'plan' => 'starter',
            'max_branches' => 1,
        ]);

        $this->propertyB = Property::create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Kili Base Hotel',
            'code' => 'KBH-01',
            'city' => 'Moshi',
            'currency' => 'TZS',
            'timezone' => 'Africa/Dar_es_Salaam',
        ]);
    }

    public function test_unauthorized_user_cannot_access_owner_portal(): void
    {
        // Unauthenticated
        $this->get(route('owner.index'))->assertRedirect(route('login'));

        // Receptionist without owner role is redirected away from owner executive portal
        $this->actingAs($this->regularUser)
            ->get(route('owner.index'))
            ->assertRedirect(route('dashboard'));

        // Export directly returns 403 forbidden
        $this->actingAs($this->regularUser)
            ->get('/owner/reports/export?report_type=sales')
            ->assertForbidden();
    }

    public function test_owner_portal_loads_with_live_financial_and_operational_kpis(): void
    {
        $today = Carbon::today();

        // 1. Create Room and Reservation in Property A1
        $roomType = RoomType::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'name' => 'Presidential Suite',
            'code' => 'PRS',
            'base_occupancy' => 2,
            'max_occupancy' => 4,
            'base_rate_minor' => 25000000, // 250,000 TZS
        ]);

        $room1 = Room::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'room_type_id' => $roomType->id,
            'room_number' => '101',
            'floor' => '1',
            'status_cleanliness' => 'inspected',
            'status_occupancy' => 'occupied',
        ]);

        $room2 = Room::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'room_type_id' => $roomType->id,
            'room_number' => '102',
            'floor' => '1',
            'status_cleanliness' => 'inspected',
            'status_occupancy' => 'vacant',
        ]);

        $guest = Guest::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'first_name' => 'Juma',
            'last_name' => 'Mkwawa',
            'email' => 'juma@example.com',
            'phone' => '+255712000001',
        ]);

        $reservation = Reservation::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'guest_id' => $guest->id,
            'ref_no' => 'RES-2026-001',
            'check_in' => $today->toDateString(),
            'check_out' => $today->copy()->addDays(2)->toDateString(),
            'status' => 'checked_in',
            'total_amount_minor' => 50000000,
        ]);

        $folio = Folio::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'reservation_id' => $reservation->id,
            'owner_type' => 'guest',
            'owner_id' => $guest->id,
            'folio_number' => 'FOL-101',
            'status' => 'open',
            'total_charges_minor' => 30000000, // 300,000 TZS
            'total_payments_minor' => 20000000, // 200,000 TZS
            'balance_minor' => 10000000, // 100,000 TZS
        ]);

        // Room charge folio line (250,000 TZS)
        FolioLine::create([
            'tenant_id' => $this->tenantA->id,
            'folio_id' => $folio->id,
            'business_date' => $today->toDateString(),
            'line_type' => 'room',
            'description' => 'Presidential Suite Night Charge',
            'amount_minor' => 25000000,
            'tax_minor' => 4500000, // 18% VAT included
            'created_at' => $today->copy()->addHour(),
        ]);

        // Ancillary restaurant charge posted to folio (50,000 TZS)
        FolioLine::create([
            'tenant_id' => $this->tenantA->id,
            'folio_id' => $folio->id,
            'business_date' => $today->toDateString(),
            'line_type' => 'restaurant',
            'description' => 'Dinner Buffet with Wine',
            'amount_minor' => 5000000,
            'tax_minor' => 900000,
            'created_at' => $today->copy()->addHours(2),
        ]);

        // Folio payment received (200,000 TZS via M-Pesa)
        Payment::create([
            'tenant_id' => $this->tenantA->id,
            'folio_id' => $folio->id,
            'business_date' => $today->toDateString(),
            'payment_method' => 'mpesa',
            'amount_minor' => 20000000,
            'status' => 'confirmed',
            'created_at' => $today->copy()->addHours(3),
        ]);

        // Direct POS sale not billed to room (paid directly by walk-in diner: 40,000 TZS cash)
        PosOrder::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'order_number' => 'POS-001',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'total_minor' => 4000000,
            'tax_minor' => 720000,
            'created_at' => $today->copy()->addHours(4),
        ]);

        // Operating Expense (60,000 TZS for kitchen supplies)
        Expense::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->propertyA1->id,
            'expense_number' => 'EXP-2026-001',
            'title' => 'Fresh Seafood & Organic Vegetables',
            'category' => 'Kitchen Provisions',
            'amount_minor' => 6000000,
            'payment_method' => 'cash',
            'expense_date' => $today->toDateString(),
            'status' => 'approved',
            'created_at' => $today->copy()->addHours(5),
        ]);

        // 2. Perform Request as Owner A
        $response = $this->actingAs($this->ownerA)
            ->get(route('owner.index', ['period' => 'today']));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('Owner/Index');

            // Verify live metrics
            $metrics = $page->toArray()['props']['metrics'];
            $financialKpis = $page->toArray()['props']['financial_kpis']['current'];
            $operationalKpis = $page->toArray()['props']['operational_kpis'];

            // Total Recognized Revenue = Room (250,000) + Ancillary Folio (50,000) + Direct POS (40,000) = 340,000 TZS = 34,000,000 minor
            $this->assertEquals(34000000, $financialKpis['total_revenue_minor']);
            $this->assertEquals(25000000, $financialKpis['room_revenue_minor']);
            $this->assertEquals(4000000, $financialKpis['pos_revenue_minor']);

            // Total Expenses = 60,000 TZS = 6,000,000 minor
            $this->assertEquals(6000000, $financialKpis['total_expenses_minor']);

            // GOP = Revenue (34,000,000) - Expenses (6,000,000) = 28,000,000 minor
            $this->assertEquals(28000000, $financialKpis['gop_minor']);

            // Total Collections = Folio Mpesa (20,000,000) + Direct Cash POS (4,000,000) = 24,000,000 minor
            $this->assertEquals(24000000, $financialKpis['total_payments_minor']);
            $this->assertEquals(4000000, $financialKpis['cash_payments_minor']);
            $this->assertEquals(20000000, $financialKpis['digital_payments_minor']);

            // Operational: 2 total rooms, 1 occupied => 50% occupancy
            $this->assertEquals(2, $operationalKpis['total_rooms']);
            $this->assertEquals(1, $operationalKpis['occupied_rooms']);
            $this->assertEquals(1, $operationalKpis['available_rooms']);
            $this->assertEquals(50.0, $operationalKpis['occupancy_rate']);

            // Guest Receivables: 10,000,000 minor open folio balance
            $this->assertEquals(10000000, $metrics['outstanding_balances_minor']);
        });
    }

    public function test_tenant_isolation_enforced_across_kpis_and_reports(): void
    {
        $today = Carbon::today();

        // Create Tenant B big revenue
        $guestB = Guest::create([
            'tenant_id' => $this->tenantB->id,
            'property_id' => $this->propertyB->id,
            'first_name' => 'Foreign',
            'last_name' => 'Tourist',
        ]);

        $resB = Reservation::create([
            'tenant_id' => $this->tenantB->id,
            'property_id' => $this->propertyB->id,
            'guest_id' => $guestB->id,
            'ref_no' => 'RES-B-999',
            'check_in' => $today->toDateString(),
            'check_out' => $today->copy()->addDays(3)->toDateString(),
            'status' => 'confirmed',
            'total_amount_minor' => 888000000, // 8.88m TZS
        ]);

        $folioB = Folio::create([
            'tenant_id' => $this->tenantB->id,
            'property_id' => $this->propertyB->id,
            'reservation_id' => $resB->id,
            'owner_type' => 'guest',
            'owner_id' => $guestB->id,
            'folio_number' => 'FOL-B-999',
            'status' => 'open',
            'total_charges_minor' => 888000000,
            'total_payments_minor' => 888000000,
            'balance_minor' => 0,
        ]);

        FolioLine::create([
            'tenant_id' => $this->tenantB->id,
            'folio_id' => $folioB->id,
            'business_date' => $today->toDateString(),
            'line_type' => 'room',
            'description' => 'Kili Safari Presidential',
            'amount_minor' => 888000000,
            'created_at' => $today,
        ]);

        // When Owner A visits their dashboard, they MUST NOT see Tenant B's 888,000,000
        $response = $this->actingAs($this->ownerA)
            ->get(route('owner.index', ['period' => 'today']));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $financialKpis = $page->toArray()['props']['financial_kpis']['current'];
            $this->assertNotEquals(888000000, $financialKpis['total_revenue_minor']);
            $this->assertEquals(0, $financialKpis['total_revenue_minor']);
        });
    }

    public function test_all_twelve_hospitality_reports_rendered_for_owner(): void
    {
        $reportTypes = [
            'sales',
            'revenue',
            'expense',
            'profit_loss',
            'booking',
            'occupancy',
            'customer',
            'payment',
            'department',
            'staff',
            'cash_flow',
            'tax',
        ];

        foreach ($reportTypes as $type) {
            $response = $this->actingAs($this->ownerA)
                ->get(route('owner.index', ['tab' => 'reports', 'report_type' => $type]));

            $response->assertOk();
            $response->assertInertia(function ($page) use ($type) {
                $page->where('tab', 'reports')
                    ->where('reportType', $type)
                    ->has('reportData');
            });
        }
    }

    public function test_owner_report_csv_export(): void
    {
        $response = $this->actingAs($this->ownerA)
            ->get('/owner/reports/export?report_type=sales');

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));
        $this->assertStringContainsString('filename=sales_report_', $response->headers->get('content-disposition'));
    }
}
