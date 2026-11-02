<?php

namespace Tests\Feature;

use App\Models\BusinessDate;
use App\Models\Folio;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Reservation;
use App\Models\ReservationRoom;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HotelManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected Tenant $tenant;

    protected Property $property;

    protected RoomType $roomType;

    protected Room $room;

    protected RatePlan $ratePlan;

    protected Guest $guest;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Test Hospitality Group',
            'slug' => 'test-group',
            'plan' => 'standard',
        ]);

        $this->property = Property::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Safari Lodge',
            'property_type' => 'lodge',
            'currency' => 'TZS',
            'timezone' => 'Africa/Dar_es_Salaam',
        ]);

        BusinessDate::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'current_business_date' => Carbon::today()->toDateString(),
            'status' => 'open',
        ]);

        $this->admin = User::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'General Manager',
            'email' => 'gm@testlodge.com',
            'password' => bcrypt('password'),
            'role' => 'general_manager',
        ]);

        $this->roomType = RoomType::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'code' => 'DLX',
            'name' => 'Deluxe Suite',
            'base_occupancy' => 2,
            'max_adults' => 2,
            'max_children' => 1,
            'base_price_minor' => 30000000,
        ]);

        $this->room = Room::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'room_type_id' => $this->roomType->id,
            'room_number' => '101',
            'floor' => 'Floor 1',
            'status_occupancy' => 'vacant',
            'status_hk' => 'clean',
        ]);

        $this->ratePlan = RatePlan::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'code' => 'BB',
            'name' => 'Bed & Breakfast',
            'meal_plan' => 'BB',
        ]);

        $this->guest = Guest::create([
            'tenant_id' => $this->tenant->id,
            'first_name' => 'Salim',
            'last_name' => 'Rashid',
            'phone' => '+255 712 345 678',
            'nationality' => 'Tanzanian',
            'id_number' => 'NIDA-12345',
        ]);
    }

    public function test_dashboard_renders_successfully(): void
    {
        $response = $this->actingAs($this->admin)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard')
            ->has('stats')
            ->has('arrivals')
            ->has('departures')
            ->has('inHouseStays')
        );
    }

    public function test_receptionist_gets_front_desk_operational_dashboard(): void
    {
        $receptionist = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'role' => 'receptionist',
        ]);

        $response = $this->actingAs($receptionist)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard')
            ->where('isReceptionist', true)
            ->has('allRooms')
            ->has('pendingFoliosCount')
        );
    }

    public function test_calendar_renders_with_rooms_and_dates(): void
    {
        $response = $this->actingAs($this->admin)->get('/calendar');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Calendar/Index')
            ->has('dates')
            ->has('rooms')
            ->has('roomTypes')
        );
    }

    public function test_user_can_create_reservation(): void
    {
        $response = $this->actingAs($this->admin)->post('/reservations', [
            'guest_id' => $this->guest->id,
            'room_type_id' => $this->roomType->id,
            'room_id' => $this->room->id,
            'rate_plan_id' => $this->ratePlan->id,
            'check_in' => Carbon::today()->toDateString(),
            'check_out' => Carbon::tomorrow()->toDateString(),
            'adults' => 2,
            'children' => 0,
            'source' => 'phone',
            'rate_price' => 300000,
            'deposit' => 100000,
        ]);

        $response->assertRedirect('/reservations');
        $this->assertDatabaseHas('reservations', [
            'guest_id' => $this->guest->id,
            'status' => 'confirmed',
        ]);

        // Auto-created folio
        $this->assertDatabaseHas('folios', [
            'owner_id' => $this->guest->id,
            'status' => 'open',
        ]);
    }

    public function test_check_in_flow_marks_room_occupied_and_creates_stay(): void
    {
        $reservation = Reservation::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'ref_no' => 'RES-TEST-01',
            'guest_id' => $this->guest->id,
            'source' => 'walk_in',
            'status' => 'confirmed',
            'check_in' => Carbon::today(),
            'check_out' => Carbon::tomorrow(),
            'total_minor' => 30000000,
        ]);

        ReservationRoom::create([
            'tenant_id' => $this->tenant->id,
            'reservation_id' => $reservation->id,
            'room_type_id' => $this->roomType->id,
            'rate_plan_id' => $this->ratePlan->id,
            'check_in' => Carbon::today(),
            'check_out' => Carbon::tomorrow(),
            'rate_price_minor' => 30000000,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($this->admin)->post("/reservations/{$reservation->id}/check-in", [
            'room_id' => $this->room->id,
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals('occupied', $this->room->fresh()->status_occupancy);
        $this->assertEquals('checked_in', $reservation->fresh()->status);
        $this->assertDatabaseHas('stays', [
            'room_id' => $this->room->id,
            'guest_id' => $this->guest->id,
        ]);
    }

    public function test_check_in_flow_succeeds_even_when_reservation_room_is_missing(): void
    {
        $reservation = Reservation::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'ref_no' => 'RES-TEST-NO-ROOM',
            'guest_id' => $this->guest->id,
            'source' => 'booking_com',
            'status' => 'confirmed',
            'check_in' => Carbon::today(),
            'check_out' => Carbon::tomorrow(),
            'total_minor' => 30000000,
        ]);

        $response = $this->actingAs($this->admin)->post("/reservations/{$reservation->id}/check-in", [
            'room_id' => $this->room->id,
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals('occupied', $this->room->fresh()->status_occupancy);
        $this->assertEquals('checked_in', $reservation->fresh()->status);
        $this->assertDatabaseHas('stays', [
            'room_id' => $this->room->id,
            'guest_id' => $this->guest->id,
        ]);
        $this->assertDatabaseHas('reservation_rooms', [
            'reservation_id' => $reservation->id,
            'room_id' => $this->room->id,
            'status' => 'checked_in',
        ]);
    }

    public function test_folio_charge_and_payment_flow(): void
    {
        $folio = Folio::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'folio_number' => 'FOL-TEST-01',
            'owner_type' => 'guest',
            'owner_id' => $this->guest->id,
            'currency' => 'TZS',
            'status' => 'open',
        ]);

        // Post charge
        $this->actingAs($this->admin)->post("/folios/{$folio->id}/charges", [
            'line_type' => 'restaurant',
            'description' => 'Dinner Buffet',
            'amount' => 50000,
        ]);

        $this->assertEquals(5000000, $folio->fresh()->total_charges_minor);
        $this->assertEquals(5000000, $folio->fresh()->balance_minor);

        // Record payment
        $this->actingAs($this->admin)->post("/folios/{$folio->id}/payments", [
            'payment_method' => 'mpesa',
            'amount' => 50000,
            'provider' => 'M-Pesa',
            'provider_ref' => 'TESTMPESA123',
        ]);

        $this->assertEquals(5000000, $folio->fresh()->total_payments_minor);
        $this->assertEquals(0, $folio->fresh()->balance_minor);
        $this->assertEquals('settled', $folio->fresh()->status);
    }

    public function test_run_night_audit_flow_succeeds(): void
    {
        $response = $this->actingAs($this->admin)->post('/night-audit/run');

        $response->assertRedirect(route('night-audit.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('night_audits', [
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'status' => 'completed',
        ]);
    }

    public function test_manager_can_view_and_manage_branches(): void
    {
        $this->admin->update(['can_manage_branches' => true]);

        $response = $this->actingAs($this->admin)->get('/branches');
        $response->assertStatus(200);

        // Create new branch
        $createResponse = $this->actingAs($this->admin)->post('/branches', [
            'name' => 'Haula City Hotel - Dar',
            'code' => 'HCHD',
            'property_type' => 'hotel',
            'city' => 'Dar es Salaam',
            'address' => 'Kivukoni Waterfront',
            'currency' => 'TZS',
            'phone' => '+255 22 211 0000',
            'email' => 'dar@haula.co.tz',
        ]);

        $createResponse->assertRedirect(route('branches.index'));
        $createResponse->assertSessionHas('success');

        $this->assertDatabaseHas('properties', [
            'tenant_id' => $this->tenant->id,
            'code' => 'HCHD',
            'city' => 'Dar es Salaam',
        ]);

        $newBranch = Property::where('code', 'HCHD')->first();
        $this->assertNotNull($newBranch);

        // Switch to new branch
        $switchResponse = $this->actingAs($this->admin)->post("/branches/{$newBranch->id}/switch");
        $switchResponse->assertSessionHas('success');
        $this->assertEquals($newBranch->id, session('current_property_id'));
    }

    public function test_user_without_branch_permission_cannot_add_branch(): void
    {
        $staff = User::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'Staff Without Branch Permission',
            'email' => 'nobranches@haula.co.tz',
            'password' => bcrypt('password'),
            'role' => 'receptionist',
            'can_manage_branches' => false,
        ]);

        $response = $this->actingAs($staff)->post('/branches', [
            'name' => 'Illegal Branch',
            'code' => 'ILL',
            'property_type' => 'hotel',
            'city' => 'Mwanza',
            'currency' => 'TZS',
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('properties', [
            'code' => 'ILL',
        ]);
    }

    public function test_receptionist_can_access_revised_portal_routes(): void
    {
        $receptionist = User::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'name' => 'Front Desk Receptionist',
            'email' => 'reception@theinns.co.tz',
            'password' => bcrypt('password'),
            'role' => 'receptionist',
        ]);

        // Dashboard
        $this->actingAs($receptionist)->get('/dashboard')->assertStatus(200);

        // Reservations
        $this->actingAs($receptionist)->get('/reservations')->assertStatus(200);
        $this->actingAs($receptionist)->get('/reservations/check-in')->assertStatus(200);
        $this->actingAs($receptionist)->get('/reservations/check-out')->assertStatus(200);

        // Guests & Services
        $this->actingAs($receptionist)->get('/guests')->assertStatus(200);
        $this->actingAs($receptionist)->get('/guest-requests')->assertStatus(200);
        $this->actingAs($receptionist)->get('/folios')->assertStatus(200);

        // Room Management
        $this->actingAs($receptionist)->get('/housekeeping')->assertStatus(200);
        $this->actingAs($receptionist)->get('/housekeeping/status')->assertStatus(200);
        $this->actingAs($receptionist)->get('/maintenance')->assertStatus(200);

        // Reports & Account
        $this->actingAs($receptionist)->get('/reports')->assertStatus(200);
        $this->actingAs($receptionist)->get('/notifications')->assertStatus(200);
        $this->actingAs($receptionist)->get('/profile')->assertStatus(200);
    }
}


