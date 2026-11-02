<?php

namespace App\Services;

use App\Models\SaasContract;
use App\Models\SaasContractTemplate;
use App\Models\SaasInvoice;
use App\Models\SaasInvoiceItem;
use App\Models\SaasQuotation;
use App\Models\SaasQuotationItem;
use App\Models\SaasSubscription;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SaasQuotationService
{
    /**
     * Create a formal SaaS quotation.
     */
    public function createQuotation(array $data, array $items): SaasQuotation
    {
        return DB::transaction(function () use ($data, $items) {
            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += ($item['quantity'] * $item['unit_price_minor']);
            }

            $discount = $data['discount_minor'] ?? 0;
            $tax = $data['tax_minor'] ?? 0;
            $total = max(0, $subtotal - $discount + $tax);

            $quotation = SaasQuotation::create([
                'tenant_id' => $data['tenant_id'] ?? null,
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'company_name' => $data['company_name'] ?? null,
                'plan_code' => $data['plan_code'] ?? 'pro',
                'subtotal_minor' => $subtotal,
                'discount_minor' => $discount,
                'tax_minor' => $tax,
                'total_minor' => $total,
                'currency' => $data['currency'] ?? 'TZS',
                'status' => 'sent',
                'valid_until' => $data['valid_until'] ?? Carbon::now()->addDays(14)->toDateString(),
                'terms_and_conditions' => $data['terms_and_conditions'] ?? 'Standard Haula Enterprises B2B SaaS Service Terms apply.',
                'sent_at' => Carbon::now(),
                'created_by_user_id' => auth()->id(),
            ]);

            foreach ($items as $item) {
                SaasQuotationItem::create([
                    'saas_quotation_id' => $quotation->id,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price_minor' => $item['unit_price_minor'],
                    'total_minor' => $item['quantity'] * $item['unit_price_minor'],
                ]);
            }

            return $quotation;
        });
    }

    /**
     * Customer accepts quotation online -> auto-converts to Invoice & initializes Contract.
     */
    public function acceptQuotation(SaasQuotation $quotation, ?string $signerIp = null): SaasInvoice
    {
        return DB::transaction(function () use ($quotation) {
            $now = Carbon::now();

            $quotation->update([
                'status' => 'accepted',
                'accepted_at' => $now,
            ]);

            // Ensure tenant exists or create one if this was a new customer lead
            $tenantId = $quotation->tenant_id;
            if (! $tenantId) {
                $tenant = Tenant::create([
                    'name' => $quotation->company_name ?: $quotation->customer_name,
                    'slug' => Str::slug($quotation->company_name ?: $quotation->customer_name),
                    'subdomain' => strtolower(Str::random(8)),
                    'plan' => $quotation->plan_code,
                    'subscription_status' => 'pending',
                    'subscription_price' => $quotation->total_minor / 100,
                    'is_active' => false,
                ]);
                $tenantId = $tenant->id;
                $quotation->update(['tenant_id' => $tenantId]);
            }

            // Create SaaS Subscription Record in pending status
            $subscription = SaasSubscription::create([
                'tenant_id' => $tenantId,
                'plan_code' => $quotation->plan_code,
                'billing_cycle' => 'monthly',
                'amount_minor' => $quotation->total_minor,
                'currency' => $quotation->currency,
                'status' => 'pending',
            ]);

            // Convert to Invoice
            $invoice = SaasInvoice::create([
                'tenant_id' => $tenantId,
                'saas_subscription_id' => $subscription->id,
                'saas_quotation_id' => $quotation->id,
                'customer_name' => $quotation->customer_name,
                'customer_email' => $quotation->customer_email,
                'customer_phone' => $quotation->customer_phone,
                'billing_reason' => 'new_subscription',
                'subtotal_minor' => $quotation->subtotal_minor,
                'discount_minor' => $quotation->discount_minor,
                'tax_minor' => $quotation->tax_minor,
                'total_minor' => $quotation->total_minor,
                'paid_amount_minor' => 0,
                'balance_minor' => $quotation->total_minor,
                'currency' => $quotation->currency,
                'status' => 'unpaid',
                'issue_date' => $now->toDateString(),
                'due_date' => $now->copy()->addDays(7)->toDateString(),
                'notes' => "Invoice automatically converted from accepted Quotation #{$quotation->quotation_number}.",
            ]);

            foreach ($quotation->items as $item) {
                SaasInvoiceItem::create([
                    'saas_invoice_id' => $invoice->id,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price_minor' => $item->unit_price_minor,
                    'total_minor' => $item->total_minor,
                ]);
            }

            $quotation->update(['status' => 'converted']);

            // Create Draft Service Agreement Contract
            $template = SaasContractTemplate::where('category', 'subscription')->where('is_active', true)->first();
            $contractContent = $template ? $template->content : 'THE INNS SaaS Subscription & Service Agreement between Haula Enterprises and Customer.';
            $rendered = str_replace(
                ['{{tenant_name}}', '{{customer_name}}', '{{subscription_plan}}', '{{subscription_price}}'],
                [$quotation->company_name ?: $quotation->customer_name, $quotation->customer_name, $quotation->plan_code, 'TZS '.number_format($quotation->total_minor / 100)],
                $contractContent
            );

            SaasContract::create([
                'tenant_id' => $tenantId,
                'saas_contract_template_id' => $template?->id,
                'saas_subscription_id' => $subscription->id,
                'saas_quotation_id' => $quotation->id,
                'title' => "THE INNS SaaS Agreement — {$quotation->customer_name}",
                'category' => 'subscription',
                'rendered_content' => $rendered,
                'status' => 'pending_signature',
                'signer_name' => $quotation->customer_name,
                'signer_email' => $quotation->customer_email,
                'valid_from' => $now->toDateString(),
                'valid_until' => $now->copy()->addYear()->toDateString(),
            ]);

            return $invoice;
        });
    }

    /**
     * Customer rejects quotation.
     */
    public function rejectQuotation(SaasQuotation $quotation, string $reason): bool
    {
        return $quotation->update([
            'status' => 'rejected',
            'rejected_at' => Carbon::now(),
            'rejection_reason' => $reason,
        ]);
    }
}
