<?php

namespace Tests\Feature;

use App\Models\BusinessDate;
use App\Models\Guest;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewReservationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Tenant $tenant;
    protected Property $property;
    protected Room $room;
    protected RoomType $roomType;
    protected RatePlan $ratePlan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'The Inns Group',
            'slug' => 'the-inns',
            'plan' => 'Professional',
        ]);

        $this->property = Property::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'The Inns Downtown',
            'code' => 'TIN-01',
            'currency' => 'TZS',
        ]);

        BusinessDate::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'current_business_date' => Carbon::today()->toDateString(),
            'roll_state' => 'open',
        ]);

        $this->admin = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'role' => 'general_manager',
        ]);

        $this->roomType = RoomType::create([
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
            'room_type_id' => $this->roomType->id,
            'room_number' => '101',
            'status_occupancy' => 'vacant',
            'status_hk' => 'clean',
            'is_active' => true,
        ]);

        $this->ratePlan = RatePlan::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'Standard Rate',
            'code' => 'STD',
            'is_active' => true,
        ]);
    }

    public function test_can_create_reservation_with_empty_guest_id_string(): void
    {
        $response = $this->actingAs($this->admin)->post('/reservations', [
            'guest_id' => '',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '+255712345678',
            'email' => 'john.doe@example.com',
            'check_in' => Carbon::today()->toDateString(),
            'check_out' => Carbon::today()->addDays(2)->toDateString(),
            'adults' => 2,
            'children' => 0,
            'source' => 'walk_in',
            'room_ids' => [$this->room->id],
            'room_id' => $this->room->id,
            'rate_plan_id' => $this->ratePlan->id,
            'rate_price' => 50000,
            'check_in_now' => false,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('reservations', [
            'source' => 'walk_in',
            'status' => 'confirmed',
        ]);
    }

    public function test_can_create_reservation_with_immediate_check_in(): void
    {
        $response = $this->actingAs($this->admin)->post('/reservations', [
            'guest_id' => '',
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'phone' => '+255712999999',
            'email' => 'jane@example.com',
            'check_in' => Carbon::today()->toDateString(),
            'check_out' => Carbon::today()->addDays(1)->toDateString(),
            'adults' => 1,
            'source' => 'walk_in',
            'room_ids' => [$this->room->id],
            'room_id' => $this->room->id,
            'rate_price' => 45000,
            'check_in_now' => true,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('reservations', [
            'status' => 'checked_in',
        ]);
        $this->assertDatabaseHas('rooms', [
            'id' => $this->room->id,
            'status_occupancy' => 'occupied',
        ]);
    }
}
