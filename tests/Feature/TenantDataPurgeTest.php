<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantDataPurgeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TenantDataPurgeTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_data_purge_service_returns_modules_and_counts(): void
    {
        $tenantA = Tenant::create([
            'name' => 'Hotel Alpha Test',
            'slug' => 'hotel-alpha-test',
            'subdomain' => 'hotelalpha',
            'plan' => 'pro',
            'max_branches' => 5,
            'is_active' => true,
        ]);

        $propertyA = Property::create([
            'tenant_id' => $tenantA->id,
            'name' => 'Alpha Main Lodge',
            'slug' => 'alpha-main-lodge',
            'code' => 'ALPHA1',
            'is_active' => true,
        ]);

        $roomTypeA = RoomType::create([
            'tenant_id' => $tenantA->id,
            'property_id' => $propertyA->id,
            'name' => 'Deluxe Room',
            'code' => 'DLX',
            'base_rate_minor' => 100000,
        ]);

        $roomA = Room::create([
            'tenant_id' => $tenantA->id,
            'property_id' => $propertyA->id,
            'room_type_id' => $roomTypeA->id,
            'room_number' => '101',
            'status_occupancy' => 'occupied',
            'status_hk' => 'dirty',
        ]);

        $guestA = Guest::create([
            'tenant_id' => $tenantA->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '+255712000001',
            'email' => 'john.test@example.com',
        ]);

        $resA = Reservation::create([
            'tenant_id' => $tenantA->id,
            'property_id' => $propertyA->id,
            'guest_id' => $guestA->id,
            'ref_no' => 'RES-ALPHA-001',
            'check_in' => now()->toDateString(),
            'check_out' => now()->addDays(2)->toDateString(),
            'status' => 'confirmed',
            'total_amount_minor' => 200000,
        ]);

        $service = app(TenantDataPurgeService::class);
        $modules = $service->getModules();
        $this->assertNotEmpty($modules);

        $counts = $service->getModuleCounts($tenantA);
        $this->assertGreaterThanOrEqual(1, $counts['modules']['reservations']['count']);
        $this->assertGreaterThanOrEqual(1, $counts['modules']['guests']['count']);

        // Purge reservations
        $purgeResult = $service->purgeModules($tenantA, ['reservations']);
        $this->assertTrue($purgeResult['success']);

        // Verify reservations deleted for Tenant A
        $this->assertEquals(0, DB::table('reservations')->where('tenant_id', $tenantA->id)->count());

        // Verify Room occupancy status was reset to vacant
        $refreshedRoom = Room::find($roomA->id);
        $this->assertEquals('vacant', $refreshedRoom->status_occupancy);

        // Verify Tenant, Property and Guest were preserved
        $this->assertDatabaseHas('tenants', ['id' => $tenantA->id]);
        $this->assertDatabaseHas('properties', ['id' => $propertyA->id]);
        $this->assertDatabaseHas('guests', ['id' => $guestA->id]);
    }

    public function test_superadmin_can_fetch_module_counts_and_purge_via_http(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'roles' => ['super_admin'],
        ]);

        $tenant = Tenant::create([
            'name' => 'Serengeti Safari Camp',
            'slug' => 'serengeti-safari-camp',
            'subdomain' => 'serengetisafari',
            'plan' => 'enterprise',
            'max_branches' => 3,
            'is_active' => true,
        ]);

        $property = Property::create([
            'tenant_id' => $tenant->id,
            'name' => 'Main Camp',
            'slug' => 'main-camp',
            'code' => 'MAIN',
            'is_active' => true,
        ]);

        $guest = Guest::create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'phone' => '+255755123456',
            'email' => 'jane@example.com',
        ]);

        Reservation::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'guest_id' => $guest->id,
            'ref_no' => 'RES-SER-101',
            'check_in' => now()->toDateString(),
            'check_out' => now()->addDays(3)->toDateString(),
            'status' => 'confirmed',
            'total_amount_minor' => 450000,
        ]);

        // 1. SuperAdmin fetches module counts for tenant
        $response = $this->actingAs($superAdmin)
            ->getJson(route('saas-admin.tenants.module-counts', $tenant->id));

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertGreaterThanOrEqual(1, $response->json('counts.modules.reservations.count'));

        // 2. Reject clear if confirmation text does not match
        $badConfirmationResponse = $this->actingAs($superAdmin)
            ->postJson(route('saas-admin.tenants.clear-module-data', $tenant->id), [
                'modules' => ['reservations'],
                'confirmation' => 'WRONG_CODE',
            ]);
        $badConfirmationResponse->assertStatus(422);

        // 3. Clear reservations with 'CLEAR'
        $clearResponse = $this->actingAs($superAdmin)
            ->postJson(route('saas-admin.tenants.clear-module-data', $tenant->id), [
                'modules' => ['reservations'],
                'confirmation' => 'CLEAR',
            ]);

        $clearResponse->assertStatus(200);
        $clearResponse->assertJsonPath('success', true);
        $this->assertEquals(0, DB::table('reservations')->where('tenant_id', $tenant->id)->count());
    }
}
