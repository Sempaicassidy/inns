<?php

namespace Database\Seeders;

use App\Models\SaasContract;
use App\Models\SaasContractAuditLog;
use App\Models\SaasContractTemplate;
use App\Models\SaasInvoice;
use App\Models\SaasInvoiceItem;
use App\Models\SaasPayment;
use App\Models\SaasQuotation;
use App\Models\SaasQuotationItem;
use App\Models\SaasReceipt;
use App\Models\SaasSubscription;
use App\Models\SaasSubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use App\Models\WhatsAppSetting;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SaasFinancialAndLegalSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = User::where('role', 'super_admin')->first() ?? User::first();
        $tenants = Tenant::all();

        // 1. Seed Official SaaS Subscription Plans
        $starterPlan = SaasSubscriptionPlan::updateOrCreate(
            ['code' => 'starter'],
            [
                'name' => 'Starter Lodge & Camp',
                'badge' => 'Boutique',
                'monthly_price_minor' => 15000000, // TZS 150,000
                'annual_price_minor' => 150000000, // TZS 1,500,000
                'max_branches' => 1,
                'max_rooms' => 15,
                'features' => [
                    'Single Property PMS',
                    'Room Availability Gantt Calendar',
                    'Guest Folios & Billing',
                    'Housekeeping Supervisor Tasks',
                    'Night Audit & Daily Charge Rollover',
                    'SMS NextSMS Ready (Add-on)',
                    'WhatsApp Guest Confirmations',
                ],
                'is_active' => true,
                'display_order' => 1,
            ]
        );

        $proPlan = SaasSubscriptionPlan::updateOrCreate(
            ['code' => 'pro'],
            [
                'name' => 'Hotel & Safari Pro',
                'badge' => 'Most Popular',
                'monthly_price_minor' => 35000000, // TZS 350,000
                'annual_price_minor' => 350000000, // TZS 3,500,000
                'max_branches' => 3,
                'max_rooms' => 60,
                'features' => [
                    'Up to 3 Branches / Properties',
                    'All Starter Features Included',
                    'Restaurant & Bar POS (KOT / Billing)',
                    'Central Store & Warehouse Inventory',
                    'Double-Entry Accounting & Financial P&L',
                    'Staff Rostering, Shifts & Attendance',
                    'Multi-Branch Switcher & Analytics',
                    'NextSMS Financial SMS Integration',
                ],
                'is_active' => true,
                'display_order' => 2,
            ]
        );

        $enterprisePlan = SaasSubscriptionPlan::updateOrCreate(
            ['code' => 'enterprise'],
            [
                'name' => 'Enterprise Hospitality Group',
                'badge' => 'Unlimited',
                'monthly_price_minor' => 75000000, // TZS 750,000
                'annual_price_minor' => 750000000, // TZS 7,500,000
                'max_branches' => 10,
                'max_rooms' => 250,
                'features' => [
                    'Unlimited Branches & Multi-Property Grouping',
                    'Dedicated NextSMS Custom Sender ID',
                    'Multi-Unit POS (Restaurant, MiniMart, Curio)',
                    'Custom Legal Contracts & SLA Guarantee',
                    'Custom Domain / Subdomain White-labeling',
                    'Executive Analytics & Consolidated Balance Sheet',
                    '24/7 Dedicated Account Manager Support',
                ],
                'is_active' => true,
                'display_order' => 3,
            ]
        );

        // 2. Seed Official Legal Contract Templates
        $masterAgreementTemplate = SaasContractTemplate::firstOrCreate(
            ['name' => 'THE INNS SaaS Master Subscription Agreement'],
            [
                'category' => 'subscription',
                'description' => 'Official service agreement between Haula Enterprises Ltd and hotel tenant covering software licensing, uptime SLA, and billing.',
                'content' => <<<EOT
<h1>THE INNS HOSPITALITY CLOUD — MASTER SERVICE AGREEMENT</h1>
<p>This Software-as-a-Service Agreement is entered into between <strong>Haula Enterprises Ltd</strong> ("Provider") and <strong>{{tenant_name}}</strong> ("Client") on {{effective_date}}.</p>

<h3>1. SCOPE OF SERVICES</h3>
<p>The Provider grants the Client a non-exclusive, non-transferable subscription to access and utilize <strong>THE INNS Hospitality Cloud PMS</strong> under the <strong>{{plan_name}}</strong> plan.</p>

<h3>2. FEES AND PAYMENT TERMS</h3>
<p>The Client agrees to pay a recurring subscription fee of <strong>{{monthly_fee}}</strong> payable in advance per agreed billing cycle ({{billing_cycle}}). Failure to settle invoices within the 3-day grace period will result in automated system suspension.</p>

<h3>3. SERVICE LEVEL AGREEMENT (SLA)</h3>
<p>The Provider guarantees a minimum of <strong>99.9% application uptime</strong> excluding scheduled maintenance communicated at least 48 hours in advance.</p>

<h3>4. DATA OWNERSHIP & CONFIDENTIALITY</h3>
<p>All guest records, reservation folios, and financial accounting data generated by {{tenant_name}} remain the exclusive intellectual and proprietary property of the Client.</p>

<h3>5. GOVERNING LAW</h3>
<p>This Agreement is executed under the laws of the United Republic of Tanzania and the Electronic Transactions Act.</p>
EOT
,
                'is_active' => true,
                'version' => '1.0',
            ]
        );

        $slaTemplate = SaasContractTemplate::firstOrCreate(
            ['name' => 'Data Privacy, Security & SLA Addendum'],
            [
                'category' => 'sla',
                'description' => 'Complies with Tanzania Personal Data Protection Act (PDPA 2022) regarding guest identity and payment information.',
                'content' => <<<EOT
<h1>DATA PRIVACY AND SECURITY ADDENDUM (PDPA COMPLIANT)</h1>
<p>This Addendum forms an integral part of the service agreement between Haula Enterprises Ltd and <strong>{{tenant_name}}</strong>.</p>
<p>Provider commits to maintaining enterprise-grade AES-256 database encryption at rest, TLS 1.3 in transit, and strictly isolated multi-tenant schemas. Guest passport numbers, credit card tokens, and reservation histories are strictly protected.</p>
EOT
,
                'is_active' => true,
                'version' => '1.0',
            ]
        );

        // 3. Link All Existing Tenants to Real Subscriptions, Contracts, Invoices, Receipts
        foreach ($tenants as $index => $tenant) {
            $plan = match ($tenant->plan) {
                'enterprise' => $enterprisePlan,
                'starter' => $starterPlan,
                default => $proPlan,
            };

            // Real SaasSubscription
            $subscription = SaasSubscription::updateOrCreate(
                ['tenant_id' => $tenant->id],
                [
                    'plan_code' => $plan->code,
                    'billing_cycle' => 'monthly',
                    'amount_minor' => $plan->monthly_price_minor,
                    'currency' => 'TZS',
                    'status' => $tenant->is_active ? 'active' : 'suspended',
                    'starts_at' => Carbon::now()->subMonths(3),
                    'expires_at' => Carbon::now()->addDays(25),
                    'next_billing_at' => Carbon::now()->addDays(25),
                    'grace_period_days' => 3,
                    'grace_period_ends_at' => Carbon::now()->addDays(28),
                ]
            );

            // Update Tenant price and plan
            $tenant->update([
                'subscription_price' => $plan->monthly_price_minor / 100,
                'subscription_status' => $subscription->status,
                'license_expiry' => $subscription->expires_at,
            ]);

            // Real SaasContract
            $contractContent = str_replace(
                ['{{tenant_name}}', '{{plan_name}}', '{{monthly_fee}}', '{{billing_cycle}}', '{{effective_date}}'],
                [$tenant->name, $plan->name, 'TZS ' . number_format($plan->monthly_price_minor / 100), 'Monthly', Carbon::now()->subMonths(3)->format('d M Y')],
                $masterAgreementTemplate->content
            );

            $docHash = hash('sha256', $contractContent . $tenant->id);

            $contract = SaasContract::firstOrCreate(
                ['tenant_id' => $tenant->id, 'contract_number' => 'CTR-2026-' . str_pad($index + 10, 4, '0', STR_PAD_LEFT)],
                [
                    'saas_contract_template_id' => $masterAgreementTemplate->id,
                    'saas_subscription_id' => $subscription->id,
                    'title' => "Master SaaS Subscription Agreement - {$tenant->name}",
                    'category' => 'subscription',
                    'rendered_content' => $contractContent,
                    'status' => 'signed',
                    'access_token' => Str::random(40),
                    'signer_name' => "GM {$tenant->name}",
                    'signer_email' => "manager@{$tenant->slug}.co.tz",
                    'signer_title' => 'General Manager',
                    'signed_at' => Carbon::now()->subMonths(3)->addDay(),
                    'signer_ip' => '102.214.33.' . ($index + 12),
                    'document_hash' => $docHash,
                    'valid_from' => Carbon::now()->subMonths(3),
                    'valid_until' => Carbon::now()->addMonths(9),
                    'created_by_user_id' => $superAdmin->id,
                ]
            );

            // Audit log for contract
            SaasContractAuditLog::firstOrCreate(
                ['saas_contract_id' => $contract->id, 'action' => 'signed'],
                [
                    'actor_type' => 'customer',
                    'actor_id' => "GM {$tenant->name}",
                    'ip_address' => '102.214.33.' . ($index + 12),
                    'details' => ['document_hash' => $docHash, 'status' => 'signed'],
                ]
            );

            // Real SaasQuotation
            $quotation = SaasQuotation::firstOrCreate(
                ['quotation_number' => 'QT-2026-' . str_pad($index + 101, 5, '0', STR_PAD_LEFT)],
                [
                    'tenant_id' => $tenant->id,
                    'customer_name' => "GM {$tenant->name}",
                    'customer_email' => "manager@{$tenant->slug}.co.tz",
                    'customer_phone' => '+255 754 ' . rand(100000, 999999),
                    'company_name' => $tenant->name,
                    'plan_code' => $plan->code,
                    'subtotal_minor' => $plan->monthly_price_minor,
                    'discount_minor' => 0,
                    'tax_minor' => 0,
                    'total_minor' => $plan->monthly_price_minor,
                    'currency' => 'TZS',
                    'status' => 'converted',
                    'valid_until' => Carbon::now()->subMonths(2),
                    'terms_and_conditions' => 'Standard SaaS payment terms: Net 7 days from invoice date.',
                    'access_token' => Str::random(40),
                    'sent_at' => Carbon::now()->subMonths(3)->subDays(3),
                    'accepted_at' => Carbon::now()->subMonths(3),
                    'created_by_user_id' => $superAdmin->id,
                ]
            );

            SaasQuotationItem::firstOrCreate(
                ['saas_quotation_id' => $quotation->id],
                [
                    'description' => "{$plan->name} Monthly Cloud License",
                    'quantity' => 1,
                    'unit_price_minor' => $plan->monthly_price_minor,
                    'total_minor' => $plan->monthly_price_minor,
                ]
            );

            // Real SaasInvoice
            $invoice = SaasInvoice::firstOrCreate(
                ['invoice_number' => 'INV-2026-' . str_pad($index + 1001, 5, '0', STR_PAD_LEFT)],
                [
                    'tenant_id' => $tenant->id,
                    'saas_subscription_id' => $subscription->id,
                    'saas_quotation_id' => $quotation->id,
                    'customer_name' => "GM {$tenant->name}",
                    'customer_email' => "manager@{$tenant->slug}.co.tz",
                    'customer_phone' => '+255 754 ' . rand(100000, 999999),
                    'billing_reason' => 'renewal',
                    'subtotal_minor' => $plan->monthly_price_minor,
                    'discount_minor' => 0,
                    'tax_minor' => 0,
                    'total_minor' => $plan->monthly_price_minor,
                    'paid_amount_minor' => $plan->monthly_price_minor,
                    'balance_minor' => 0,
                    'currency' => 'TZS',
                    'status' => 'paid',
                    'issue_date' => Carbon::now()->startOfMonth(),
                    'due_date' => Carbon::now()->startOfMonth()->addDays(7),
                    'paid_at' => Carbon::now()->startOfMonth()->addDays(2),
                    'access_token' => Str::random(40),
                    'notes' => 'Subscription active for current billing cycle.',
                ]
            );

            SaasInvoiceItem::firstOrCreate(
                ['saas_invoice_id' => $invoice->id],
                [
                    'description' => "Monthly SaaS Subscription ({$plan->name})",
                    'quantity' => 1,
                    'unit_price_minor' => $plan->monthly_price_minor,
                    'total_minor' => $plan->monthly_price_minor,
                ]
            );

            // Real SaasPayment
            $payment = SaasPayment::firstOrCreate(
                ['payment_reference' => 'PAY-2026-' . str_pad($index + 201, 5, '0', STR_PAD_LEFT)],
                [
                    'tenant_id' => $tenant->id,
                    'saas_invoice_id' => $invoice->id,
                    'amount_minor' => $plan->monthly_price_minor,
                    'currency' => 'TZS',
                    'payment_method' => 'bank_transfer',
                    'gateway_provider' => 'manual',
                    'gateway_transaction_id' => 'CRDB' . rand(10000000, 99999999),
                    'status' => 'successful',
                    'verified_at' => Carbon::now()->startOfMonth()->addDays(2),
                    'verified_by_user_id' => $superAdmin->id,
                    'paid_at' => Carbon::now()->startOfMonth()->addDays(2),
                    'idempotency_key' => Str::uuid()->toString(),
                ]
            );

            // Real SaasReceipt
            SaasReceipt::firstOrCreate(
                ['receipt_number' => 'RCT-2026-' . str_pad($index + 501, 5, '0', STR_PAD_LEFT)],
                [
                    'tenant_id' => $tenant->id,
                    'saas_invoice_id' => $invoice->id,
                    'saas_payment_id' => $payment->id,
                    'customer_name' => "GM {$tenant->name}",
                    'amount_paid_minor' => $plan->monthly_price_minor,
                    'currency' => 'TZS',
                    'payment_method' => 'bank_transfer',
                    'payment_reference' => $payment->payment_reference,
                    'issued_at' => Carbon::now()->startOfMonth()->addDays(2),
                    'access_token' => Str::random(40),
                ]
            );
        }

        // 4. WhatsApp Gateway Official Settings
        $firstTenant = $tenants->first();
        if ($firstTenant) {
            WhatsAppSetting::updateOrCreate(
                ['tenant_id' => $firstTenant->id],
                [
                    'provider' => 'cloud_api',
                    'phone_number_id' => '108492048591820',
                    'business_account_id' => '209482019485718',
                    'access_token' => 'EAAG...haula_live_meta_cloud_token',
                    'sender_phone_number' => '+255754000111',
                    'send_on_reservation_confirmed' => true,
                    'send_on_checkin' => true,
                    'send_on_checkout_invoice' => true,
                    'send_on_housekeeping_ready' => true,
                    'is_active' => true,
                ]
            );
        }
    }
}
