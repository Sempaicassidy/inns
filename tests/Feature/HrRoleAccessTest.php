<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HrRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Property $property;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Serengeti Grand Safari Camp',
            'slug' => 'serengeti-safari',
            'domain' => 'serengeti.inns.local',
            'features' => ['hr_payroll' => true],
        ]);

        $this->property = Property::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Main Safari Lodge',
            'code' => 'MAIN',
            'city' => 'Arusha',
            'is_active' => true,
            'is_main' => true,
        ]);
    }

    public function test_pos_cashier_cannot_access_hr(): void
    {
        $cashier = User::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'POS Station Cashier',
            'email' => 'cashier@serengeti.local',
            'password' => bcrypt('password123'),
            'role' => 'cashier',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($cashier)->get('/hr');
        $response->assertRedirect(route('pos.index'));
        $response->assertSessionHas('error');

        $jsonResponse = $this->actingAs($cashier)->getJson('/hr');
        $jsonResponse->assertStatus(403);
    }

    public function test_restaurant_waiter_cannot_access_hr(): void
    {
        $waiter = User::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'Restaurant Waiter',
            'email' => 'waiter@serengeti.local',
            'password' => bcrypt('password123'),
            'role' => 'waiter',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($waiter)->get('/hr');
        $response->assertRedirect(route('pos.index'));
        $response->assertSessionHas('error');
    }

    public function test_grocery_cashier_cannot_access_hr(): void
    {
        $groceryStaff = User::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'Supermarket Cashier',
            'email' => 'grocery@serengeti.local',
            'password' => bcrypt('password123'),
            'role' => 'grocery_cashier',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($groceryStaff)->get('/hr');
        $response->assertRedirect(route('pos.index'));
        $response->assertSessionHas('error');
    }

    public function test_receptionist_cannot_access_hr(): void
    {
        $receptionist = User::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'Front Desk Receptionist',
            'email' => 'reception@serengeti.local',
            'password' => bcrypt('password123'),
            'role' => 'receptionist',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($receptionist)->get('/hr');
        $response->assertRedirect(route('dashboard'));
        $response->assertSessionHas('error');
    }

    public function test_general_manager_can_access_hr(): void
    {
        $gm = User::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'General Manager',
            'email' => 'gm@serengeti.local',
            'password' => bcrypt('password123'),
            'role' => 'general_manager',
            'roles' => ['general_manager'],
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($gm)->get('/hr');
        $response->assertOk();
    }
}
