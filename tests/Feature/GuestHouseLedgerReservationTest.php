<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestHouseLedgerReservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_house_ledger_reservation_creation(): void
    {
        $tenant = Tenant::first() ?? Tenant::create(['name' => 'Test Hotel Co', 'slug' => 'test-hotel-co']);
        $property = Property::where('tenant_id', $tenant->id)->first() ?? Property::create([
            'tenant_id' => $tenant->id,
            'name' => 'Safari Retreat Lodge',
            'code' => 'SRL',
            'currency' => 'TZS',
            'is_main' => true,
        ]);

        $user = User::where('tenant_id', $tenant->id)->first() ?? User::factory()->create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'role' => 'general_manager',
        ]);

        $roomType = RoomType::first() ?? RoomType::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'name' => 'Deluxe King Suite',
            'code' => 'DKS',
            'base_price_minor' => 8500000,
        ]);

        $room = Room::where('property_id', $property->id)->first() ?? Room::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'room_type_id' => $roomType->id,
            'room_number' => '101',
            'floor' => '1',
            'status_occupancy' => 'vacant',
            'status_hk' => 'clean',
        ]);

        $ratePlan = RatePlan::first() ?? RatePlan::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'name' => 'Bed & Breakfast',
            'code' => 'BB',
            'meal_plan' => 'BB',
        ]);

        $response = $this->actingAs($user)->post(route('reservations.store'), [
            'first_name' => 'Emmanuel',
            'last_name' => 'Massawe',
            'gender' => 'male',
            'age' => 38,
            'phone' => '+255754123456',
            'email' => 'massawe@example.com',
            'nationality' => 'Tanzanian',
            'tribe' => 'Mchagga',
            'id_type' => 'national_id',
            'id_number' => '19880415-12345-00002-19',
            'origin' => 'Moshi, Kilimanjaro',
            'destination' => 'Arusha Town',
            'vehicle_reg_no' => 'T 789 DKY',
            'check_in' => now()->toDateString(),
            'check_in_time' => '14:30',
            'check_out' => now()->addDays(2)->toDateString(),
            'check_out_time' => '10:00',
            'room_ids' => [$room->id],
            'room_id' => $room->id,
            'room_type_id' => $roomType->id,
            'rate_plan_id' => $ratePlan->id,
            'adults' => 2,
            'children' => 0,
            'source' => 'walk_in',
            'rate_price' => 85000,
            'deposit' => 85000,
            'payment_method' => 'mpesa',
            'receipt_no' => 'RCT-202611-9871',
            'guest_signature' => true,
            'receptionist_name' => 'Fatma Juma',
            'notes' => 'Ameongozana na mke wake, gari limeegeshwa maegesho ya mbele',
            'check_in_now' => true,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('guests', [
            'first_name' => 'Emmanuel',
            'last_name' => 'Massawe',
            'gender' => 'male',
            'age' => 38,
            'tribe' => 'Mchagga',
            'id_number' => '19880415-12345-00002-19',
            'origin' => 'Moshi, Kilimanjaro',
            'destination' => 'Arusha Town',
            'vehicle_reg_no' => 'T 789 DKY',
        ]);

        $this->assertDatabaseHas('reservations', [
            'origin' => 'Moshi, Kilimanjaro',
            'destination' => 'Arusha Town',
            'vehicle_reg_no' => 'T 789 DKY',
            'payment_method' => 'mpesa',
            'receipt_no' => 'RCT-202611-9871',
            'guest_signature' => true,
            'receptionist_name' => 'Fatma Juma',
            'status' => 'checked_in',
        ]);
    }
}
