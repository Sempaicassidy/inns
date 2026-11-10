<?php

namespace Tests\Feature;

use App\Models\OfflineDevice;
use App\Models\OfflineOperation;
use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OfflineSyncEngineTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected User $userA;
    protected User $userB;
    protected Property $propertyA;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Tenant A and User A
        $this->tenantA = Tenant::create([
            'id' => (string) Str::uuid(),
            'name' => 'Safari Grand Hotel',
            'slug' => 'safari-grand-' . Str::random(5),
            'currency' => 'TZS',
            'is_active' => true,
        ]);

        $this->propertyA = Property::create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $this->tenantA->id,
            'name' => 'Main Wing',
            'currency' => 'TZS',
        ]);

        $this->userA = User::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'role' => 'manager',
        ]);

        // Create Tenant B and User B for isolation testing
        $this->tenantB = Tenant::create([
            'id' => (string) Str::uuid(),
            'name' => 'Kilimanjaro Heights',
            'slug' => 'kili-heights-' . Str::random(5),
            'currency' => 'TZS',
            'is_active' => true,
        ]);

        $this->userB = User::factory()->create([
            'tenant_id' => $this->tenantB->id,
            'role' => 'manager',
        ]);
    }

    public function test_ping_endpoint_returns_online_status(): void
    {
        $response = $this->getJson('/api/offline/ping');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ONLINE',
            ]);
    }

    public function test_authenticated_tenant_user_can_register_device(): void
    {
        $deviceId = 'dev-test-' . Str::random(8);

        $response = $this->actingAs($this->userA)
            ->postJson('/api/offline/devices', [
                'device_id' => $deviceId,
                'device_name' => 'Reception Tablet',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('offline_devices', [
            'tenant_id' => $this->tenantA->id,
            'user_id' => $this->userA->id,
            'device_id' => $deviceId,
            'device_name' => 'Reception Tablet',
        ]);
    }

    public function test_tenant_can_list_registered_devices(): void
    {
        $deviceId = 'dev-list-' . Str::random(8);

        OfflineDevice::create([
            'tenant_id' => $this->tenantA->id,
            'user_id' => $this->userA->id,
            'device_id' => $deviceId,
            'device_name' => 'POS Terminal 1',
            'last_seen_at' => now(),
        ]);

        $response = $this->actingAs($this->userA)
            ->getJson('/api/offline/devices');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'devices',
            ]);

        $devices = $response->json('devices');
        $this->assertNotEmpty($devices);
        $this->assertEquals($deviceId, $devices[0]['device_id']);
    }

    public function test_bootstrap_returns_tenant_baseline_catalog(): void
    {
        // Create test POS item
        $category = PosCategory::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Appetizers',
            'icon' => 'Utensils',
            'department' => 'restaurant',
            'sort_order' => 1,
        ]);

        PosItem::create([
            'tenant_id' => $this->tenantA->id,
            'pos_category_id' => $category->id,
            'name' => 'Spicy Samosas',
            'code' => 'SAM-01',
            'price_minor' => 5000,
            'unit' => 'portion',
            'department' => 'restaurant',
            'is_available' => true,
        ]);

        $response = $this->actingAs($this->userA)
            ->getJson('/api/offline/bootstrap');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'tenant',
                    'user',
                    'categories',
                    'items',
                    'server_timestamp',
                    'cursor',
                ],
            ]);

        $this->assertEquals($this->tenantA->id, $response->json('data.tenant.id'));
    }

    public function test_offline_pos_order_syncs_atomically_and_idempotently(): void
    {
        $deviceId = 'dev-pos-' . Str::random(8);
        $opId = 'op-' . Str::random(12);
        $orderNumber = 'ORD-OFFLINE-' . rand(1000, 9999);

        // Register device
        OfflineDevice::create([
            'tenant_id' => $this->tenantA->id,
            'user_id' => $this->userA->id,
            'device_id' => $deviceId,
            'device_name' => 'POS Terminal Alpha',
            'last_seen_at' => now(),
        ]);

        $payload = [
            'device_id' => $deviceId,
            'operations' => [
                [
                    'operation_id' => $opId,
                    'type' => 'pos_order',
                    'action' => 'create',
                    'payload' => [
                        'order_number' => $orderNumber,
                        'order_type' => 'dine_in',
                        'department' => 'restaurant',
                        'table_number' => '4',
                        'guest_name' => 'David Livingstone',
                        'total_minor' => 35000,
                        'subtotal_minor' => 29661,
                        'tax_minor' => 5339,
                        'payment_method' => 'cash',
                        'items' => [
                            [
                                'name' => 'Grilled Tilapia',
                                'quantity' => 1,
                                'unit_price' => 25000,
                                'amount' => 25000,
                            ],
                            [
                                'name' => 'Fresh Passion Juice',
                                'quantity' => 2,
                                'unit_price' => 5000,
                                'amount' => 10000,
                            ],
                        ],
                    ],
                ],
            ],
        ];

        // First Sync
        $response = $this->actingAs($this->userA)
            ->postJson('/api/offline/sync', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'confirmed_operation_ids' => [$opId],
            ]);

        // Verify order created in database
        $this->assertDatabaseHas('pos_orders', [
            'tenant_id' => $this->tenantA->id,
            'order_number' => $orderNumber,
            'total_minor' => 35000,
        ]);

        // Verify operation recorded in offline_operations
        $this->assertDatabaseHas('offline_operations', [
            'tenant_id' => $this->tenantA->id,
            'operation_id' => $opId,
            'status' => 'confirmed',
        ]);

        // Repeat Sync (Idempotency test: duplicate call should NOT duplicate orders or fail)
        $repeatResponse = $this->actingAs($this->userA)
            ->postJson('/api/offline/sync', $payload);

        $repeatResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'confirmed_operation_ids' => [$opId],
            ]);

        // Count must still be 1 (No duplicate order created)
        $orderCount = PosOrder::where('tenant_id', $this->tenantA->id)
            ->where('order_number', $orderNumber)
            ->count();

        $this->assertEquals(1, $orderCount, 'Idempotency failed: Duplicate order was created.');
    }

    public function test_revoked_device_is_rejected_on_subsequent_sync(): void
    {
        $deviceId = 'dev-revoked-' . Str::random(8);
        $opId = 'op-rev-' . Str::random(12);

        $device = OfflineDevice::create([
            'tenant_id' => $this->tenantA->id,
            'user_id' => $this->userA->id,
            'device_id' => $deviceId,
            'device_name' => 'Lost Tablet',
            'revoked_at' => now(), // Revoked!
        ]);

        $payload = [
            'device_id' => $deviceId,
            'operations' => [
                [
                    'operation_id' => $opId,
                    'type' => 'pos_order',
                    'action' => 'create',
                    'payload' => [
                        'order_number' => 'ORD-SHOULD-FAIL',
                        'total_minor' => 10000,
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->userA)
            ->withHeader('X-Device-Id', $deviceId)
            ->postJson('/api/offline/sync', $payload);

        $response->assertStatus(403)
            ->assertJson([
                'error' => 'DEVICE_REVOKED',
            ]);
    }

    public function test_cross_tenant_isolation_is_strictly_enforced(): void
    {
        $deviceIdA = 'dev-a-' . Str::random(8);

        OfflineDevice::create([
            'tenant_id' => $this->tenantA->id,
            'user_id' => $this->userA->id,
            'device_id' => $deviceIdA,
            'device_name' => 'Device of Tenant A',
        ]);

        // User B from Tenant B requests device list
        $response = $this->actingAs($this->userB)
            ->getJson('/api/offline/devices');

        $response->assertStatus(200);
        $devices = $response->json('devices');

        // User B must NOT see Device A
        foreach ($devices as $dev) {
            $this->assertNotEquals($deviceIdA, $dev['device_id'], 'Cross-tenant leak: Tenant B saw Tenant A device.');
        }
    }
}
