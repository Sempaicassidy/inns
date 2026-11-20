<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\PosOrderItem;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Tenant;
use App\Models\TenantAuditEvent;
use App\Models\TenantInspectionSession;
use App\Models\User;
use App\Services\TenantInspectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantInspectionTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $regularStaff;
    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected Property $branchA;
    protected Property $branchB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'roles' => ['super_admin'],
        ]);

        $this->tenantA = Tenant::create([
            'name' => 'Grand Serena Hotel',
            'slug' => 'grand-serena',
            'subdomain' => 'serena',
            'plan' => 'enterprise',
            'max_branches' => 5,
            'subscription_price' => 250000,
            'is_active' => true,
            'settings' => [
                'api_key' => 'sk_live_verysecretkey12345',
                'payment_secret' => 'whsec_topsecretwebhook999',
                'business_name' => 'Grand Serena Hotel Ltd',
                'database_password' => 'supersecretpass',
            ],
            'features' => [
                'reservations' => true,
                'pos' => true,
                'accounting' => true,
            ],
        ]);

        $this->tenantB = Tenant::create([
            'name' => 'Kilimanjaro Safari Lodge',
            'slug' => 'kilimanjaro-safari',
            'subdomain' => 'kili',
            'plan' => 'pro',
            'max_branches' => 2,
            'subscription_price' => 150000,
            'is_active' => true,
            'settings' => [
                'sms_token' => 'sms_token_secret9876',
            ],
        ]);

        $this->branchA = Property::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Serena Main Resort',
            'code' => 'SER01',
            'property_type' => 'hotel',
            'is_main' => true,
            'is_active' => true,
        ]);

        $this->branchB = Property::create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Kili Camp',
            'code' => 'KIL01',
            'property_type' => 'lodge',
            'is_main' => true,
            'is_active' => true,
        ]);

        $this->regularStaff = User::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->branchA->id,
            'role' => 'receptionist',
            'roles' => ['receptionist'],
        ]);
    }

    public function test_super_admin_can_access_global_tenant_directory(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get(route('saas-admin.inspection.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('SaasAdmin/Inspection/Index')
            ->has('directory.data', 2)
            ->has('crossTenantMetrics')
            ->where('crossTenantMetrics.total_tenants', 2)
        );
    }

    public function test_non_superadmin_forbidden_from_inspection(): void
    {
        $response = $this->actingAs($this->regularStaff)
            ->get(route('saas-admin.inspection.index'));

        $response->assertForbidden();

        $showResponse = $this->actingAs($this->regularStaff)
            ->get(route('saas-admin.inspection.show', $this->tenantA->id));

        $showResponse->assertForbidden();
    }

    public function test_super_admin_can_inspect_individual_tenant_workspace(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get(route('saas-admin.inspection.show', [
                'tenant' => $this->tenantA->id,
                'section' => 'overview',
            ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('SaasAdmin/Inspection/Show')
            ->where('inspection.tenant.id', $this->tenantA->id)
            ->where('inspection.tenant.name', 'Grand Serena Hotel')
            ->has('inspection.overview')
        );

        // Verify audit event was logged
        $this->assertDatabaseHas('tenant_audit_events', [
            'tenant_id' => $this->tenantA->id,
            'action_type' => 'tenant_inspected',
        ]);
    }

    public function test_tenant_inspection_enforces_strict_isolation_between_tenants(): void
    {
        // Create Guest and Reservation for Tenant A
        $guestA = Guest::create([
            'tenant_id' => $this->tenantA->id,
            'first_name' => 'Alice',
            'last_name' => 'Serena',
            'phone' => '+255711111111',
            'email' => 'alice@serena.test',
        ]);

        $resA = Reservation::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->branchA->id,
            'guest_id' => $guestA->id,
            'ref_no' => 'RES-SERENA-001',
            'check_in' => now()->toDateString(),
            'check_out' => now()->addDays(2)->toDateString(),
            'status' => 'confirmed',
            'total_minor' => 200000,
            'deposit_minor' => 200000,
        ]);

        // Create Guest and Reservation for Tenant B
        $guestB = Guest::create([
            'tenant_id' => $this->tenantB->id,
            'first_name' => 'Bob',
            'last_name' => 'Kili',
            'phone' => '+255722222222',
            'email' => 'bob@kili.test',
        ]);

        $resB = Reservation::create([
            'tenant_id' => $this->tenantB->id,
            'property_id' => $this->branchB->id,
            'guest_id' => $guestB->id,
            'ref_no' => 'RES-KILI-002',
            'check_in' => now()->toDateString(),
            'check_out' => now()->addDays(3)->toDateString(),
            'status' => 'checked_in',
            'total_minor' => 500000,
            'deposit_minor' => 100000,
        ]);

        // Service inspection for Tenant A
        $service = app(TenantInspectionService::class);
        $dataA = $service->getTenantInspectionData($this->tenantA, 'bookings');

        $this->assertCount(1, $dataA['bookings']['list']);
        $this->assertEquals('RES-SERENA-001', $dataA['bookings']['list'][0]['reservation_number']);
        $this->assertEquals('Alice Serena', $dataA['bookings']['list'][0]['guest_name']);

        // Confirm Tenant B booking did NOT leak into Tenant A
        $bookingNumbers = collect($dataA['bookings']['list'])->pluck('reservation_number')->toArray();
        $this->assertNotContains('RES-KILI-002', $bookingNumbers);
    }

    public function test_support_inspection_session_lifecycle(): void
    {
        // 1. Start support session
        $response = $this->actingAs($this->superAdmin)
            ->post(route('saas-admin.inspection.session.start', $this->tenantA->id), [
                'reason' => 'Investigating missing Folio line items under support ticket #1234',
                'is_write_mode' => false,
            ]);

        $response->assertRedirect();

        $session = TenantInspectionSession::where('tenant_id', $this->tenantA->id)->first();
        $this->assertNotNull($session);
        $this->assertEquals('Investigating missing Folio line items under support ticket #1234', $session->reason);
        $this->assertTrue($session->isActive());
        $this->assertFalse($session->is_write_mode);

        // Verify audit event for session start
        $this->assertDatabaseHas('tenant_audit_events', [
            'tenant_id' => $this->tenantA->id,
            'action_type' => 'support_session_started',
        ]);

        // 2. End support session
        $endResponse = $this->actingAs($this->superAdmin)
            ->post(route('saas-admin.inspection.session.end', $session->id));

        $endResponse->assertRedirect();
        $session->refresh();
        $this->assertFalse($session->isActive());
        $this->assertNotNull($session->ended_at);

        // Verify audit event for session end
        $this->assertDatabaseHas('tenant_audit_events', [
            'tenant_id' => $this->tenantA->id,
            'action_type' => 'support_session_ended',
        ]);
    }

    public function test_sensitive_credentials_are_strictly_masked(): void
    {
        $service = app(TenantInspectionService::class);
        $inspectionData = $service->getTenantInspectionData($this->tenantA, 'config');

        $settings = $inspectionData['config']['tenant_settings'];

        // Sensitive keys must be masked
        $this->assertStringContainsString('••••••••', $settings['api_key']);
        $this->assertStringNotContainsString('sk_live_verysecretkey12345', $settings['api_key']);

        $this->assertStringContainsString('••••••••', $settings['payment_secret']);
        $this->assertStringNotContainsString('whsec_topsecretwebhook999', $settings['payment_secret']);

        $this->assertStringContainsString('••••••••', $settings['database_password']);
        $this->assertStringNotContainsString('supersecretpass', $settings['database_password']);

        // Non-sensitive keys remain legible
        $this->assertEquals('Grand Serena Hotel Ltd', $settings['business_name']);
    }

    public function test_global_activity_timeline_returns_events_and_filters(): void
    {
        // Create sample audit event
        TenantAuditEvent::create([
            'tenant_id' => $this->tenantA->id,
            'user_id' => $this->superAdmin->id,
            'user_name' => 'Super Admin',
            'branch_id' => $this->branchA->id,
            'module' => 'financial',
            'action_type' => 'payment_refunded',
            'description' => 'Super admin processed audit check on payment #883',
            'status' => 'success',
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->get(route('saas-admin.inspection.timeline', [
                'tenant_id' => $this->tenantA->id,
                'module' => 'financial',
            ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('SaasAdmin/Inspection/Timeline')
            ->has('timeline.data')
            ->has('tenantsList')
        );
    }

    public function test_cross_tenant_financials_matrix(): void
    {
        $folio = Folio::create([
            'tenant_id' => $this->tenantA->id,
            'property_id' => $this->branchA->id,
            'folio_number' => 'FOL-SER-001',
            'owner_type' => 'guest',
            'owner_id' => (string) \Illuminate\Support\Str::uuid(),
            'currency' => 'TZS',
            'total_charges_minor' => 300000,
            'total_payments_minor' => 300000,
            'balance_minor' => 0,
            'status' => 'closed',
        ]);

        // Add recognized revenue and payments to Tenant A
        FolioLine::create([
            'tenant_id' => $this->tenantA->id,
            'folio_id' => $folio->id,
            'line_type' => 'room',
            'description' => 'Nightly Room Charge',
            'amount_minor' => 300000,
            'business_date' => now()->toDateString(),
        ]);

        Payment::create([
            'tenant_id' => $this->tenantA->id,
            'folio_id' => $folio->id,
            'business_date' => now()->toDateString(),
            'amount_minor' => 300000,
            'payment_method' => 'cash',
            'currency' => 'TZS',
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->get(route('saas-admin.inspection.financials'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('SaasAdmin/Inspection/Financials')
            ->has('financials.rows', 2)
            ->has('financials.totals')
            ->where('financials.totals.total_recognized_revenue', 3000)
            ->where('financials.totals.total_collections', 3000)
        );
    }

    public function test_export_tenant_audit_report_endpoint(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get(route('saas-admin.inspection.export', $this->tenantA->id));

        $response->assertOk();
        $response->assertJsonStructure([
            'export_timestamp',
            'exported_by',
            'data' => [
                'tenant',
                'section',
            ],
        ]);

        $this->assertDatabaseHas('tenant_audit_events', [
            'tenant_id' => $this->tenantA->id,
            'action_type' => 'audit_report_exported',
        ]);
    }
}
