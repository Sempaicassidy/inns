<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleAccessTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Property $property;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Module Test Group',
            'slug' => 'module-test',
            'plan' => 'enterprise',
            'features' => [
                'calendar' => true,
                'reservations' => true,
                'guests' => true,
                'folios' => true,
                'housekeeping' => true,
                'maintenance' => true,
                'restaurant_pos' => true,
                'grocery_pos' => true,
                'accounting' => true,
                'hr_payroll' => true,
            ],
        ]);

        $this->property = Property::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Lodge',
            'property_type' => 'lodge',
            'currency' => 'TZS',
            'timezone' => 'Africa/Dar_es_Salaam',
        ]);
    }

    private function makeUser(string $role, array $roles = []): User
    {
        return User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'role' => $role,
            'roles' => $roles === [] ? [$role] : $roles,
        ]);
    }

    public function test_receptionist_cannot_access_accounting(): void
    {
        $user = $this->makeUser('receptionist');

        $this->actingAs($user)
            ->get('/accounting')
            ->assertRedirect(route('dashboard'));
    }

    public function test_housekeeper_cannot_access_grocery_or_restaurant(): void
    {
        $user = $this->makeUser('housekeeper');

        $this->actingAs($user)->get('/grocery')->assertRedirect(route('dashboard'));
        $this->actingAs($user)->get('/restaurant')->assertRedirect(route('dashboard'));
        $this->actingAs($user)->get('/accounting')->assertRedirect(route('dashboard'));
    }

    public function test_grocery_staff_cannot_access_restaurant(): void
    {
        $user = $this->makeUser('grocery_cashier');

        $this->actingAs($user)->get('/restaurant')->assertRedirect(route('dashboard'));
    }

    public function test_waiter_cannot_access_grocery(): void
    {
        $user = $this->makeUser('waiter');

        $this->actingAs($user)->get('/grocery')->assertRedirect(route('dashboard'));
    }

    public function test_accountant_can_access_accounting_but_not_pos_modules(): void
    {
        $user = $this->makeUser('accountant');

        $this->actingAs($user)->get('/accounting')->assertOk();
        $this->actingAs($user)->get('/grocery')->assertRedirect(route('dashboard'));
        $this->actingAs($user)->get('/restaurant')->assertRedirect(route('dashboard'));
    }

    public function test_cashier_can_access_pos_but_not_accounting(): void
    {
        $user = $this->makeUser('cashier');

        $this->actingAs($user)->get('/accounting')->assertRedirect(route('dashboard'));
    }

    public function test_housekeeper_can_access_housekeeping(): void
    {
        $user = $this->makeUser('housekeeper');

        $this->actingAs($user)->get('/housekeeping')->assertOk();
    }

    public function test_receptionist_can_access_front_office_but_not_housekeeping(): void
    {
        $user = $this->makeUser('receptionist');

        $this->actingAs($user)->get('/reservations')->assertOk();
        $this->actingAs($user)->get('/housekeeping')->assertRedirect(route('dashboard'));
    }

    public function test_owner_can_access_all_modules(): void
    {
        $user = $this->makeUser('owner');

        $this->actingAs($user)->get('/accounting')->assertOk();
        $this->actingAs($user)->get('/grocery')->assertOk();
        $this->actingAs($user)->get('/restaurant')->assertOk();
        $this->actingAs($user)->get('/housekeeping')->assertOk();
    }

    public function test_unauthorized_api_request_gets_403(): void
    {
        $user = $this->makeUser('receptionist');

        $this->actingAs($user)
            ->getJson('/accounting')
            ->assertForbidden()
            ->assertJsonPath('module', 'accounting');
    }

    public function test_tenant_without_feature_still_blocked_by_feature_gate(): void
    {
        $tenant2 = Tenant::create([
            'name' => 'No Features',
            'slug' => 'no-features',
            'plan' => 'starter',
            'features' => ['accounting' => false],
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant2->id,
            'role' => 'accountant',
            'roles' => ['accountant'],
        ]);

        $this->actingAs($user)->get('/accounting')->assertRedirect(route('dashboard'));
    }
}
