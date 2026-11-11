<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActiveRoleSwitchTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_switch_active_role(): void
    {
        $this->postJson('/active-role/switch', ['role' => 'accountant'])
            ->assertUnauthorized();
    }

    public function test_user_cannot_activate_unassigned_role(): void
    {
        $user = User::factory()->create([
            'role' => 'receptionist',
            'roles' => ['receptionist'],
        ]);

        $this->actingAs($user)
            ->postJson('/active-role/switch', ['role' => 'accountant'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('role');

        $this->assertNull(session('active_role'));
    }

    public function test_multi_role_user_can_switch_to_assigned_role(): void
    {
        $user = User::factory()->create([
            'role' => 'receptionist',
            'roles' => ['receptionist', 'accountant'],
        ]);

        $response = $this->actingAs($user)
            ->postJson('/active-role/switch', ['role' => 'accountant']);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('role', 'accountant')
            ->assertJsonPath('dashboard', route('accounting.index'));

        $this->assertSame('accountant', session('active_role'));
        $this->assertSame('accountant', $user->fresh()->active_role);
    }

    public function test_pos_cashier_switches_to_pos_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'pos_cashier',
            'roles' => ['pos_cashier', 'waiter'],
        ]);

        $this->actingAs($user)
            ->postJson('/active-role/switch', ['role' => 'waiter'])
            ->assertOk()
            ->assertJsonPath('dashboard', route('pos.index'));

        $this->assertSame('waiter', session('active_role'));
    }

    public function test_non_json_request_redirects_to_role_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'receptionist',
            'roles' => ['receptionist', 'housekeeper'],
        ]);

        $this->actingAs($user)
            ->post('/active-role/switch', ['role' => 'housekeeper'])
            ->assertRedirect(route('housekeeping.index'));

        $this->assertSame('housekeeper', session('active_role'));
    }

    public function test_custom_role_falls_back_to_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'procurement_manager',
            'roles' => ['procurement_manager'],
        ]);

        $this->actingAs($user)
            ->postJson('/active-role/switch', ['role' => 'procurement_manager'])
            ->assertOk()
            ->assertJsonPath('dashboard', route('inventory.index'));
    }
}
