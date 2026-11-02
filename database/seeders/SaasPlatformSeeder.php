<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\SmsCreditPackage;
use App\Models\SmsPricingRule;
use App\Models\SmsProviderAccount;
use App\Models\SmsWallet;
use App\Models\SmsWalletIssue;
use App\Models\SmsWalletTransaction;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SaasPlatformSeeder extends Seeder
{
    public function run(): void
    {
        // 1. NextSMS Central Provider Account
        $provider = SmsProviderAccount::firstOrCreate(
            ['provider_name' => 'nextsms'],
            [
                'sender_id' => 'THE INNS',
                'base_url' => 'https://messaging-service.co.tz',
                'username' => 'haula_admin',
                'password' => 'secret_nextsms_key',
                'api_token' => 'nextsms_live_token_77a9',
                'environment' => 'production',
                'balance_credits_cached' => 148500,
                'balance_checked_at' => Carbon::now(),
                'is_active' => true,
                'settings' => [
                    'simulation_mode' => true,
                    'low_balance_threshold' => 10000,
                    'auto_notify_admin' => true,
                ],
            ]
        );

        // 2. Global Pricing Rule
        SmsPricingRule::firstOrCreate(
            ['tenant_id' => null],
            [
                'provider_cost_per_credit_minor' => 1600, // TZS 16.00
                'selling_price_per_credit_minor' => 2000, // TZS 20.00
                'currency' => 'TZS',
                'is_active' => true,
            ]
        );

        // 3. Standard SMS Credit Packages
        $packages = [
            ['name' => 'Starter Pack (500 SMS)', 'credits_count' => 500, 'cost_price_minor' => 800000, 'selling_price_minor' => 1000000, 'is_active' => true, 'is_popular' => false, 'display_order' => 1],
            ['name' => 'Standard Pack (1,500 SMS)', 'credits_count' => 1500, 'cost_price_minor' => 2250000, 'selling_price_minor' => 2800000, 'is_active' => true, 'is_popular' => true, 'display_order' => 2],
            ['name' => 'Business Pro Pack (5,000 SMS)', 'credits_count' => 5000, 'cost_price_minor' => 7000000, 'selling_price_minor' => 8500000, 'is_active' => true, 'is_popular' => false, 'display_order' => 3],
            ['name' => 'Enterprise Mega Pack (15,000 SMS)', 'credits_count' => 15000, 'cost_price_minor' => 19500000, 'selling_price_minor' => 24000000, 'is_active' => true, 'is_popular' => false, 'display_order' => 4],
        ];

        foreach ($packages as $pkg) {
            SmsCreditPackage::firstOrCreate(['name' => $pkg['name']], $pkg);
        }

        // 4. Multi-Tenants Ecosystem
        $tenantsData = [
            [
                'name' => 'Kilimanjaro View Luxury Suites',
                'slug' => 'kilimanjaro-view',
                'subdomain' => 'kili',
                'plan' => 'professional',
                'max_branches' => 3,
                'subscription_price' => 450000,
                'subscription_status' => 'active',
                'license_expiry' => Carbon::now()->addMonths(8),
                'properties' => [
                    ['name' => 'Kili Crest Suites Moshi', 'code' => 'KCSM', 'city' => 'Moshi'],
                    ['name' => 'Kili Forest Retreat Machame', 'code' => 'KFRM', 'city' => 'Machame'],
                ],
                'credits' => 3400,
            ],
            [
                'name' => 'Zanzibar Spice Island Resorts',
                'slug' => 'zanzibar-spice',
                'subdomain' => 'spice',
                'plan' => 'enterprise',
                'max_branches' => 5,
                'subscription_price' => 950000,
                'subscription_status' => 'active',
                'license_expiry' => Carbon::now()->addMonths(11),
                'properties' => [
                    ['name' => 'Kendwa Sunset Beach Resort', 'code' => 'KSBR', 'city' => 'Kendwa'],
                    ['name' => 'Stone Town Heritage Hotel', 'code' => 'STHH', 'city' => 'Stone Town'],
                    ['name' => 'Paje Lagoon Kite Villas', 'code' => 'PLKV', 'city' => 'Paje'],
                ],
                'credits' => 8200,
            ],
            [
                'name' => 'Ngorongoro Eco Tented Lodge',
                'slug' => 'ngorongoro-eco',
                'subdomain' => 'crater',
                'plan' => 'starter',
                'max_branches' => 1,
                'subscription_price' => 250000,
                'subscription_status' => 'active',
                'license_expiry' => Carbon::now()->addMonths(3),
                'properties' => [
                    ['name' => 'Crater Rim Eco Camp', 'code' => 'CREC', 'city' => 'Karatu'],
                ],
                'credits' => 850,
            ],
            [
                'name' => 'Arusha Grand Safari Palace',
                'slug' => 'arusha-grand',
                'subdomain' => 'arusha',
                'plan' => 'professional',
                'max_branches' => 2,
                'subscription_price' => 450000,
                'subscription_status' => 'trial',
                'license_expiry' => Carbon::now()->addDays(12),
                'properties' => [
                    ['name' => 'Arusha Grand Central', 'code' => 'AGCH', 'city' => 'Arusha'],
                ],
                'credits' => 200,
            ],
            [
                'name' => 'Manyara Escarpment Sanctuary',
                'slug' => 'manyara-sanctuary',
                'subdomain' => 'manyara',
                'plan' => 'starter',
                'max_branches' => 1,
                'subscription_price' => 250000,
                'subscription_status' => 'active',
                'license_expiry' => Carbon::now()->addDays(28),
                'properties' => [
                    ['name' => 'Manyara Lake Vista Lodge', 'code' => 'MLVL', 'city' => 'Mto wa Mbu'],
                ],
                'credits' => 1100,
            ],
        ];

        $superAdminUser = User::where('role', 'super_admin')->first();

        // Ensure Haula Hospitality has a wallet
        $haulaTenant = Tenant::first();
        if ($haulaTenant) {
            SmsWallet::firstOrCreate(
                ['tenant_id' => $haulaTenant->id],
                [
                    'balance_credits' => 4500,
                    'total_credits_purchased' => 6000,
                    'total_credits_used' => 1500,
                    'status' => 'active',
                ]
            );
        }

        foreach ($tenantsData as $td) {
            $tenant = Tenant::firstOrCreate(
                ['slug' => $td['slug']],
                [
                    'name' => $td['name'],
                    'subdomain' => $td['subdomain'],
                    'plan' => $td['plan'],
                    'max_branches' => $td['max_branches'],
                    'subscription_price' => $td['subscription_price'],
                    'subscription_status' => $td['subscription_status'],
                    'license_expiry' => $td['license_expiry'],
                    'is_active' => true,
                    'settings' => [
                        'vat_percentage' => 18,
                        'default_currency' => 'TZS',
                    ],
                ]
            );

            // Create properties
            foreach ($td['properties'] as $prop) {
                Property::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'code' => $prop['code']],
                    [
                        'name' => $prop['name'],
                        'is_main' => true,
                        'property_type' => 'lodge',
                        'city' => $prop['city'],
                        'country' => 'Tanzania',
                        'currency' => 'TZS',
                        'is_active' => true,
                    ]
                );
            }

            // Create Manager user for this tenant
            $mgrEmail = "manager@{$td['slug']}.co.tz";
            User::firstOrCreate(
                ['email' => $mgrEmail],
                [
                    'name' => "GM {$tenant->name}",
                    'password' => Hash::make('password'),
                    'tenant_id' => $tenant->id,
                    'property_id' => $tenant->properties()->first()?->id,
                    'role' => 'general_manager',
                    'roles' => ['general_manager', 'owner'],
                    'status' => 'active',
                ]
            );

            // Create SMS Wallet
            $wallet = SmsWallet::firstOrCreate(
                ['tenant_id' => $tenant->id],
                [
                    'balance_credits' => $td['credits'],
                    'total_credits_purchased' => $td['credits'] + 500,
                    'total_credits_used' => 500,
                    'status' => 'active',
                ]
            );

            // Create sample issue & transaction record
            SmsWalletIssue::create([
                'tenant_id' => $tenant->id,
                'sms_wallet_id' => $wallet->id,
                'package_id' => SmsCreditPackage::first()?->id,
                'credits_issued' => $td['credits'],
                'unit_cost_minor' => 1600,
                'selling_price_minor' => 2000,
                'amount_paid_minor' => $td['credits'] * 2000,
                'payment_reference' => 'PAY-' . strtoupper(Str::random(8)),
                'payment_method' => 'bank',
                'is_verified' => true,
                'issued_by_user_id' => $superAdminUser?->id ?? 1,
                'issued_at' => Carbon::now()->subDays(rand(2, 20)),
            ]);

            SmsWalletTransaction::create([
                'tenant_id' => $tenant->id,
                'sms_wallet_id' => $wallet->id,
                'reference' => 'TXN-' . strtoupper(Str::random(10)),
                'type' => 'allocation',
                'credits' => $td['credits'],
                'balance_after' => $td['credits'],
                'rate_per_credit_minor' => 2000,
                'amount_minor' => $td['credits'] * 2000,
                'currency' => 'TZS',
                'description' => 'Initial SMS Wallet issuance by Super Admin',
                'performed_by_user_id' => $superAdminUser?->id ?? 1,
            ]);
        }
    }
}
