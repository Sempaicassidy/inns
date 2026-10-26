<?php

namespace Database\Seeders;

use App\Models\BusinessDate;
use App\Models\Company;
use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\Guest;
use App\Models\HousekeepingTask;
use App\Models\Payment;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Reservation;
use App\Models\ReservationRoom;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Stay;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $today = Carbon::today();

        // 1. Create Tenant
        $tenant = Tenant::create([
            'name' => 'Haula Hospitality & Safari Lodges',
            'slug' => 'haula-hospitality',
            'subdomain' => 'serengeti',
            'plan' => 'enterprise',
            'is_active' => true,
            'settings' => [
                'vat_percentage' => 18,
                'service_charge_percentage' => 5,
                'default_currency' => 'TZS',
            ],
        ]);

        // 2. Create Primary Property (Lodge)
        $property = Property::create([
            'tenant_id' => $tenant->id,
            'name' => 'Haula Serengeti Safari Lodge & Camp',
            'code' => 'HSSL',
            'property_type' => 'lodge',
            'timezone' => 'Africa/Dar_es_Salaam',
            'currency' => 'TZS',
            'checkin_time' => '12:00',
            'checkout_time' => '10:00',
            'tax_config' => [
                'vat_rate' => 0.18,
                'service_charge' => 0.05,
                'tourism_levy' => 0.015,
            ],
            'address' => 'Seronera Valley, Central Serengeti',
            'city' => 'Serengeti',
            'country' => 'Tanzania',
            'phone' => '+255 754 888 999',
            'email' => 'serengeti@haula.co.tz',
            'is_active' => true,
        ]);

        // Set Business Date
        BusinessDate::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'current_business_date' => $today->toDateString(),
            'status' => 'open',
        ]);

        // 3. Create Users
        $admin = User::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'name' => 'Eng. Cassidy (GM)',
            'email' => 'admin@haula.co.tz',
            'phone' => '+255 712 000 001',
            'password' => Hash::make('password'),
            'role' => 'general_manager',
            'status' => 'active',
            'pin_code' => '1234',
            'locale' => 'en',
        ]);

        $receptionist = User::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'name' => 'Neema Mushi (Front Desk)',
            'email' => 'reception@haula.co.tz',
            'phone' => '+255 754 000 002',
            'password' => Hash::make('password'),
            'role' => 'receptionist',
            'status' => 'active',
            'pin_code' => '1111',
            'locale' => 'sw',
        ]);

        $housekeeper = User::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'name' => 'Baraka John (Housekeeping Supervisor)',
            'email' => 'housekeeping@haula.co.tz',
            'phone' => '+255 784 000 003',
            'password' => Hash::make('password'),
            'role' => 'housekeeper',
            'status' => 'active',
            'pin_code' => '2222',
            'locale' => 'sw',
        ]);

        $accountant = User::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'name' => 'Fatma Ally (Accountant)',
            'email' => 'accountant@haula.co.tz',
            'phone' => '+255 768 000 004',
            'password' => Hash::make('password'),
            'role' => 'accountant',
            'status' => 'active',
            'pin_code' => '3333',
            'locale' => 'en',
        ]);

        // 4. Room Types
        $tentType = RoomType::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'code' => 'TENT',
            'name' => 'Luxury Safari Tent',
            'base_occupancy' => 2,
            'max_adults' => 2,
            'max_children' => 1,
            'base_price_minor' => 38000000, // 380,000 TZS
            'amenities' => ['Balcony / Deck', 'En-suite Bathroom', 'Solar Hot Water', 'Mosquito Net', 'Wildlife View'],
            'description' => 'Canvas luxury safari tent perched overlooking the Seronera riverbed.',
        ]);

        $suiteType = RoomType::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'code' => 'SUITE',
            'name' => 'Savannah Panoramic Suite',
            'base_occupancy' => 2,
            'max_adults' => 3,
            'max_children' => 2,
            'base_price_minor' => 55000000, // 550,000 TZS
            'amenities' => ['King Bed', 'Private Plunge Pool', 'Mini Bar', 'Panoramic Sunset View', 'Lounge Area'],
            'description' => 'Exclusive stone-built suite with an expansive outdoor deck and plunge pool.',
        ]);

        $villaType = RoomType::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'code' => 'VILLA',
            'name' => 'Executive Family Safari Villa',
            'base_occupancy' => 4,
            'max_adults' => 6,
            'max_children' => 3,
            'base_price_minor' => 95000000, // 950,000 TZS
            'amenities' => ['2 Master Bedrooms', 'Private Dining', 'Dedicated Butler', 'Infinity Deck', 'WiFi'],
            'description' => 'Two-bedroom family safari villa offering absolute privacy and breathtaking views.',
        ]);

        $standardType = RoomType::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'code' => 'STD',
            'name' => 'Standard Garden Cottage',
            'base_occupancy' => 2,
            'max_adults' => 2,
            'max_children' => 1,
            'base_price_minor' => 22000000, // 220,000 TZS
            'amenities' => ['Queen Bed', 'Private Veranda', 'En-suite Shower', 'Tea & Coffee Maker'],
            'description' => 'Cozy cottage nestled in the indigenous acacia garden.',
        ]);

        // 5. Rooms
        $roomsData = [
            ['number' => 'Tent 01', 'type' => $tentType->id, 'floor' => 'East Wing Tent Ridge', 'occ' => 'occupied', 'hk' => 'clean'],
            ['number' => 'Tent 02', 'type' => $tentType->id, 'floor' => 'East Wing Tent Ridge', 'occ' => 'vacant', 'hk' => 'clean'],
            ['number' => 'Tent 03', 'type' => $tentType->id, 'floor' => 'East Wing Tent Ridge', 'occ' => 'vacant', 'hk' => 'dirty'],
            ['number' => 'Tent 04', 'type' => $tentType->id, 'floor' => 'East Wing Tent Ridge', 'occ' => 'vacant', 'hk' => 'inspected'],
            ['number' => 'Suite 101', 'type' => $suiteType->id, 'floor' => 'Acacia Hill Top', 'occ' => 'occupied', 'hk' => 'clean'],
            ['number' => 'Suite 102', 'type' => $suiteType->id, 'floor' => 'Acacia Hill Top', 'occ' => 'vacant', 'hk' => 'clean'],
            ['number' => 'Suite 103', 'type' => $suiteType->id, 'floor' => 'Acacia Hill Top', 'occ' => 'vacant', 'hk' => 'out_of_service'],
            ['number' => 'Villa 01', 'type' => $villaType->id, 'floor' => 'Kopjes Reserve', 'occ' => 'occupied', 'hk' => 'clean'],
            ['number' => 'Villa 02', 'type' => $villaType->id, 'floor' => 'Kopjes Reserve', 'occ' => 'vacant', 'hk' => 'clean'],
            ['number' => 'Cottage 201', 'type' => $standardType->id, 'floor' => 'Garden Ground', 'occ' => 'occupied', 'hk' => 'clean'],
            ['number' => 'Cottage 202', 'type' => $standardType->id, 'floor' => 'Garden Ground', 'occ' => 'vacant', 'hk' => 'clean'],
            ['number' => 'Cottage 203', 'type' => $standardType->id, 'floor' => 'Garden Ground', 'occ' => 'vacant', 'hk' => 'dirty'],
            ['number' => 'Cottage 204', 'type' => $standardType->id, 'floor' => 'Garden Ground', 'occ' => 'vacant', 'hk' => 'clean'],
        ];

        $createdRooms = [];
        foreach ($roomsData as $r) {
            $createdRooms[$r['number']] = Room::create([
                'tenant_id' => $tenant->id,
                'property_id' => $property->id,
                'room_type_id' => $r['type'],
                'room_number' => $r['number'],
                'floor' => $r['floor'],
                'status_occupancy' => $r['occ'],
                'status_hk' => $r['hk'],
                'is_active' => true,
            ]);
        }

        // 6. Rate Plans
        $fbPlan = RatePlan::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'code' => 'FB-SAFARI',
            'name' => 'Full Board Safari & Game Drive',
            'meal_plan' => 'FB',
            'is_resident_only' => false,
            'rules' => ['includes_game_drive' => true, 'min_stay' => 1],
        ]);

        $bbPlan = RatePlan::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'code' => 'BB-RACK',
            'name' => 'Bed & Breakfast Standard Rack',
            'meal_plan' => 'BB',
            'is_resident_only' => false,
        ]);

        $residentPlan = RatePlan::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'code' => 'RES-DISC',
            'name' => 'Tanzania Resident Special (25% Off)',
            'meal_plan' => 'FB',
            'is_resident_only' => true,
        ]);

        // 7. Companies
        $safariCompany = Company::create([
            'tenant_id' => $tenant->id,
            'name' => 'Asilia Tanzania Safaris & Expeditions',
            'tin' => '102-458-999',
            'vrn' => '40012345T',
            'contact_person' => 'Geoffrey Mrema',
            'phone' => '+255 754 112 233',
            'email' => 'bookings@asiliasafaris.co.tz',
            'address' => 'Arusha, Tanzania',
            'credit_limit_minor' => 2000000000, // 20,000,000 TZS
            'commission_rate' => 10.00,
        ]);

        // 8. Guests
        $guest1 = Guest::create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Juma',
            'last_name' => 'Mwangi',
            'phone' => '+255 754 123 456',
            'email' => 'juma.mwangi@gmail.com',
            'nationality' => 'Tanzanian',
            'is_resident' => true,
            'id_type' => 'national_id',
            'id_number' => '19850412-14120-00002-19',
            'vip_level' => 'VIP Gold',
            'preferences' => ['dietary' => 'Halal', 'bed' => 'King'],
            'notes' => 'Frequent visitor during wildebeest migration season.',
        ]);

        $guest2 = Guest::create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Sarah',
            'last_name' => 'Jenkins',
            'phone' => '+44 7700 900077',
            'email' => 'sarah.jenkins@outlook.com',
            'nationality' => 'British',
            'is_resident' => false,
            'id_type' => 'passport',
            'id_number' => 'GB98234120',
            'vip_level' => 'Standard',
            'preferences' => ['allergies' => 'Peanuts', 'room' => 'Quiet location'],
        ]);

        $guest3 = Guest::create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Michael',
            'last_name' => 'Schmidt',
            'phone' => '+49 151 23456789',
            'email' => 'm.schmidt@berlin-travel.de',
            'nationality' => 'German',
            'is_resident' => false,
            'id_type' => 'passport',
            'id_number' => 'C33458921',
            'vip_level' => 'VIP Silver',
        ]);

        $guest4 = Guest::create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Neema',
            'last_name' => 'Kimaro',
            'phone' => '+255 784 555 666',
            'email' => 'neema.kimaro@vodacom.co.tz',
            'nationality' => 'Tanzanian',
            'is_resident' => true,
            'id_type' => 'driving_license',
            'id_number' => 'DL-TZ-884912',
            'vip_level' => 'Standard',
        ]);

        // 9. Active In-House Stay 1: Juma Mwangi in Tent 01
        $res1 = Reservation::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'ref_no' => 'RES-2026-0001',
            'guest_id' => $guest1->id,
            'source' => 'phone',
            'status' => 'checked_in',
            'check_in' => $today->copy()->subDays(1),
            'check_out' => $today->copy()->addDays(2),
            'adults' => 2,
            'children' => 0,
            'total_minor' => 114000000, // 3 nights @ 380,000 = 1,140,000 TZS
            'deposit_minor' => 38000000,
            'created_by' => $receptionist->id,
        ]);

        $resRoom1 = ReservationRoom::create([
            'tenant_id' => $tenant->id,
            'reservation_id' => $res1->id,
            'room_type_id' => $tentType->id,
            'room_id' => $createdRooms['Tent 01']->id,
            'rate_plan_id' => $fbPlan->id,
            'check_in' => $today->copy()->subDays(1),
            'check_out' => $today->copy()->addDays(2),
            'rate_price_minor' => 38000000,
            'status' => 'checked_in',
        ]);

        $stay1 = Stay::create([
            'tenant_id' => $tenant->id,
            'reservation_room_id' => $resRoom1->id,
            'room_id' => $createdRooms['Tent 01']->id,
            'guest_id' => $guest1->id,
            'checked_in_at' => $today->copy()->subDays(1)->setTime(14, 30),
            'registration_data' => [
                'vehicle_reg' => 'T 412 DFP (Land Cruiser)',
                'purpose_of_visit' => 'Holiday / Wildlife Photography',
            ],
        ]);

        $folio1 = Folio::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'reservation_id' => $res1->id,
            'stay_id' => $stay1->id,
            'folio_number' => 'FOL-0001',
            'owner_type' => 'guest',
            'owner_id' => $guest1->id,
            'currency' => 'TZS',
            'status' => 'open',
        ]);

        // Folio Lines for Stay 1
        FolioLine::create([
            'tenant_id' => $tenant->id,
            'folio_id' => $folio1->id,
            'business_date' => $today->copy()->subDays(1),
            'line_type' => 'room',
            'description' => 'Night Accommodation - Tent 01 (Full Board)',
            'amount_minor' => 38000000,
            'tax_minor' => 5796610,
            'posted_by' => $admin->id,
        ]);

        FolioLine::create([
            'tenant_id' => $tenant->id,
            'folio_id' => $folio1->id,
            'business_date' => $today->copy()->subDays(1),
            'line_type' => 'bar',
            'description' => 'Sunset Safari Bar - Serengeti Gin & Tonic x 4',
            'amount_minor' => 4800000,
            'tax_minor' => 732203,
            'posted_by' => $receptionist->id,
        ]);

        // Payment for Stay 1 (Deposit via M-Pesa)
        Payment::create([
            'tenant_id' => $tenant->id,
            'folio_id' => $folio1->id,
            'business_date' => $today->copy()->subDays(1),
            'payment_method' => 'mpesa',
            'provider' => 'Vodacom M-Pesa',
            'provider_ref' => 'QWE987123MP',
            'amount_minor' => 38000000,
            'currency' => 'TZS',
            'status' => 'confirmed',
            'received_by' => $receptionist->id,
            'notes' => 'Advance Deposit received via M-Pesa Till',
        ]);

        $folio1->recalculateBalance();

        // 10. Active In-House Stay 2: Sarah Jenkins in Suite 101
        $res2 = Reservation::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'ref_no' => 'RES-2026-0002',
            'guest_id' => $guest2->id,
            'company_id' => $safariCompany->id,
            'source' => 'agent',
            'status' => 'checked_in',
            'check_in' => $today->copy()->subDays(2),
            'check_out' => $today, // Departing today!
            'adults' => 2,
            'children' => 0,
            'total_minor' => 110000000,
            'deposit_minor' => 55000000,
            'created_by' => $receptionist->id,
        ]);

        $resRoom2 = ReservationRoom::create([
            'tenant_id' => $tenant->id,
            'reservation_id' => $res2->id,
            'room_type_id' => $suiteType->id,
            'room_id' => $createdRooms['Suite 101']->id,
            'rate_plan_id' => $fbPlan->id,
            'check_in' => $today->copy()->subDays(2),
            'check_out' => $today,
            'rate_price_minor' => 55000000,
            'status' => 'checked_in',
        ]);

        $stay2 = Stay::create([
            'tenant_id' => $tenant->id,
            'reservation_room_id' => $resRoom2->id,
            'room_id' => $createdRooms['Suite 101']->id,
            'guest_id' => $guest2->id,
            'checked_in_at' => $today->copy()->subDays(2)->setTime(13, 10),
            'registration_data' => [
                'vehicle_reg' => 'Asilia Safari Cruiser TZ 09',
                'purpose_of_visit' => 'Safari / Honeymoon',
            ],
        ]);

        $folio2 = Folio::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'reservation_id' => $res2->id,
            'stay_id' => $stay2->id,
            'folio_number' => 'FOL-0002',
            'owner_type' => 'guest',
            'owner_id' => $guest2->id,
            'currency' => 'TZS',
            'status' => 'open',
        ]);

        FolioLine::create([
            'tenant_id' => $tenant->id,
            'folio_id' => $folio2->id,
            'business_date' => $today->copy()->subDays(2),
            'line_type' => 'room',
            'description' => 'Night Accommodation - Suite 101',
            'amount_minor' => 55000000,
            'tax_minor' => 8389830,
            'posted_by' => $admin->id,
        ]);

        FolioLine::create([
            'tenant_id' => $tenant->id,
            'folio_id' => $folio2->id,
            'business_date' => $today->copy()->subDays(1),
            'line_type' => 'room',
            'description' => 'Night Accommodation - Suite 101',
            'amount_minor' => 55000000,
            'tax_minor' => 8389830,
            'posted_by' => $admin->id,
        ]);

        FolioLine::create([
            'tenant_id' => $tenant->id,
            'folio_id' => $folio2->id,
            'business_date' => $today->copy()->subDays(1),
            'line_type' => 'tour',
            'description' => 'Hot Air Balloon Safari & Champagne Breakfast',
            'amount_minor' => 120000000,
            'tax_minor' => 18305084,
            'posted_by' => $receptionist->id,
        ]);

        $folio2->recalculateBalance();

        // 11. Upcoming Confirmed Reservation (Arrival Today)
        Reservation::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'ref_no' => 'RES-2026-0003',
            'guest_id' => $guest3->id,
            'source' => 'booking_com',
            'status' => 'confirmed',
            'check_in' => $today,
            'check_out' => $today->copy()->addDays(3),
            'adults' => 2,
            'children' => 0,
            'total_minor' => 165000000,
            'deposit_minor' => 55000000,
            'notes' => 'Early arrival expected around 11:30 AM.',
            'created_by' => $receptionist->id,
        ]);

        // 12. Upcoming Confirmed Reservation (Arrival Tomorrow)
        Reservation::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'ref_no' => 'RES-2026-0004',
            'guest_id' => $guest4->id,
            'source' => 'walk_in',
            'status' => 'confirmed',
            'check_in' => $today->copy()->addDays(1),
            'check_out' => $today->copy()->addDays(3),
            'adults' => 1,
            'children' => 1,
            'total_minor' => 44000000,
            'deposit_minor' => 0,
            'created_by' => $receptionist->id,
        ]);

        // 13. Housekeeping Tasks for Dirty Rooms
        HousekeepingTask::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'room_id' => $createdRooms['Tent 03']->id,
            'task_type' => 'checkout_clean',
            'priority' => 'high',
            'status' => 'pending',
            'assigned_to' => $housekeeper->id,
            'notes' => 'Previous guest checked out early morning. Prepare fresh linen.',
        ]);

        HousekeepingTask::create([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'room_id' => $createdRooms['Cottage 203']->id,
            'task_type' => 'stayover_clean',
            'priority' => 'normal',
            'status' => 'in_progress',
            'assigned_to' => $housekeeper->id,
            'notes' => 'Refill drinking water bottles and replace bathroom towels.',
        ]);
    }
}
