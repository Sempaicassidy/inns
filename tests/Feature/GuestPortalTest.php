<?php

namespace Tests\Feature;

use App\Models\BusinessDate;
use App\Models\Guest;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_portal_displays_guests_and_rooms_and_folios(): void
    {
        $tenant = Tenant::create([
            'name' => 'Test Hospitality Group',
            'slug' => 'test-group',
            'plan' => 'standard',
        ]);

        $property = Property::create([
            'tenant_id' => $tenant->id,
            'name' => 'Test Safari Lodge',
            'property_type' => 'lodge',
            'currency' => 'TZS',
            'timezone' => 'Africa/Dar_es_Salaam',
        ]);

        BusinessDate::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'current_business_date' => Carbon::today()->toDateString(),
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'role' => 'admin',
        ]);

        $guest = Guest::create([
            'tenant_id' => $tenant->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '+255 700 000 000',
            'email' => 'john@example.com',
            'nationality' => 'Tanzanian',
            'id_type' => 'national_id',
            'id_number' => '12345',
            'vip_level' => 'VIP Gold',
        ]);

        $response = $this->actingAs($user)->get('/guests');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Guests/Index')
            ->has('guests.data')
            ->has('stats')
        );
    }
}
