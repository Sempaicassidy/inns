<?php

namespace Tests\Feature;

use App\Models\BusinessDate;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SidebarNavigationTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected Property $property;

    protected User $manager;

    protected User $receptionist;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Paradise Inn Group',
            'slug' => 'paradise-inn-group',
            'domain' => 'paradise.local',
            'plan' => 'enterprise',
        ]);

        $this->property = Property::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Paradise Inn Hotel',
            'code' => 'PIH',
            'city' => 'Arusha',
            'property_type' => 'hotel',
            'is_active' => true,
        ]);

        BusinessDate::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'current_business_date' => Carbon::today()->toDateString(),
            'is_open' => true,
        ]);

        $this->manager = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'role' => 'general_manager',
        ]);

        $this->receptionist = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'role' => 'receptionist',
        ]);
    }

    public function test_all_receptionist_sidebar_routes_respond_successfully(): void
    {
        $receptionistRoutes = [
            'dashboard',
            'reservations.index',
            'reservations.create',
            'reservations.checkin',
            'reservations.checkout',
            'guests.index',
            'guest.requests.index',
            'whatsapp.index',
            'folios.index',
            'front-office.reports.index',
            'notifications.index',
            'profile.edit',
        ];

        foreach ($receptionistRoutes as $routeName) {
            $url = route($routeName);
            $response = $this->actingAs($this->receptionist)->get($url);
            $response->assertStatus(200, "Route {$routeName} ({$url}) failed with status {$response->status()} for Receptionist");
        }
    }

    public function test_all_manager_sidebar_routes_respond_successfully(): void
    {
        $managerRoutes = [
            'dashboard',
            'calendar.index',
            'reservations.index',
            'guests.index',
            'housekeeping.index',
            'reports.index',
            'restaurant.index',
            'grocery.index',
            'inventory.index',
            'hr.index',
            'accounting.index',
            'whatsapp.index',
            'profile.edit',
        ];

        foreach ($managerRoutes as $routeName) {
            $url = route($routeName);
            $response = $this->actingAs($this->manager)->get($url);
            $response->assertStatus(200, "Route {$routeName} ({$url}) failed with status {$response->status()} for Manager");
        }
    }

    public function test_all_accountant_sidebar_routes_respond_successfully(): void
    {
        $accountant = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'role' => 'accountant',
        ]);

        $accountantRoutes = [
            'accounting.index',
            'accounting.transactions',
            'accounting.refunds',
            'accounting.cashbook',
            'accounting.invoices.customer',
            'accounting.invoices.supplier',
            'accounting.credit-notes',
            'accounting.ar',
            'accounting.ap',
            'accounting.customer-balances',
            'accounting.supplier-balances',
            'accounting.chart-of-accounts',
            'accounting.journals',
            'accounting.trial-balance',
            'accounting.statements',
            'accounting.bank-accounts',
            'accounting.bank-transactions',
            'accounting.bank-reconciliation',
            'accounting.cash-reconciliation',
            'accounting.reports.pnl',
            'accounting.reports.balance-sheet',
            'accounting.reports.cash-flow',
            'accounting.reports.revenue',
            'accounting.reports.expenses',
            'accounting.reports.tax',
            'accounting.approvals.expenses',
            'accounting.approvals.payments',
            'accounting.approvals.journals',
            'notifications.index',
            'profile.edit',
        ];

        foreach ($accountantRoutes as $routeName) {
            $url = route($routeName);
            $response = $this->actingAs($accountant)->get($url);
            $response->assertStatus(200, "Route {$routeName} ({$url}) failed with status {$response->status()} for Accountant");
        }
    }
}
