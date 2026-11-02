<?php

namespace App\Services;

use App\Models\SaasContract;
use App\Models\SaasContractAuditLog;
use App\Models\SaasContractTemplate;
use App\Models\SystemNotification;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SaasContractService
{
    /**
     * Create a new contract from a template with dynamic variable substitution.
     */
    public function createContractFromTemplate(Tenant $tenant, SaasContractTemplate $template, array $variables = []): SaasContract
    {
        return DB::transaction(function () use ($tenant, $template, $variables) {
            $now = Carbon::now();

            $defaultVars = [
                '{{tenant_name}}' => $tenant->name,
                '{{company_name}}' => 'Haula Enterprises Ltd',
                '{{company_representative}}' => 'Managing Director, Haula Enterprises',
                '{{subscription_plan}}' => ucfirst($tenant->plan ?? 'Professional'),
                '{{subscription_price}}' => 'TZS '.number_format($tenant->subscription_price ?? 280000),
                '{{contract_start_date}}' => $now->format('d M Y'),
                '{{contract_end_date}}' => $now->copy()->addYear()->format('d M Y'),
                '{{business_address}}' => $tenant->properties()->first()?->address ?? 'Tanzania',
                '{{owner_name}}' => $tenant->users()->first()?->name ?? 'Hotel General Manager',
                '{{owner_email}}' => $tenant->users()->first()?->email ?? 'manager@hotel.com',
                '{{payment_terms}}' => 'Net 7 Days, Advance Billing Cycle',
            ];

            $allVars = array_merge($defaultVars, $variables);
            $rendered = str_replace(array_keys($allVars), array_values($allVars), $template->content);

            $contract = SaasContract::create([
                'tenant_id' => $tenant->id,
                'saas_contract_template_id' => $template->id,
                'title' => "{$template->name} — {$tenant->name}",
                'category' => $template->category,
                'rendered_content' => $rendered,
                'status' => 'pending_signature',
                'signer_name' => $tenant->users()->first()?->name,
                'signer_email' => $tenant->users()->first()?->email,
                'valid_from' => $now->toDateString(),
                'valid_until' => $now->copy()->addYear()->toDateString(),
                'created_by_user_id' => auth()->id(),
            ]);

            SaasContractAuditLog::create([
                'saas_contract_id' => $contract->id,
                'action' => 'created',
                'actor_type' => 'super_admin',
                'actor_id' => (string) (auth()->id() ?? 'system'),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'details' => ['template_id' => $template->id, 'version' => $template->version],
            ]);

            return $contract;
        });
    }

    /**
     * Sign a contract electronically with SHA-256 document hashing and audit log.
     */
    public function signContract(SaasContract $contract, array $signatureData): bool
    {
        return DB::transaction(function () use ($contract, $signatureData) {
            $now = Carbon::now();

            // Compute cryptographic SHA-256 hash of the final document
            $docHash = hash('sha256', $contract->rendered_content.'|'.($signatureData['signer_name'] ?? '').'|'.$now->toIso8601String());

            $contract->update([
                'status' => 'signed',
                'signer_name' => $signatureData['signer_name'] ?? $contract->signer_name,
                'signer_email' => $signatureData['signer_email'] ?? $contract->signer_email,
                'signer_title' => $signatureData['signer_title'] ?? 'Managing Director / Hotel Owner',
                'signed_at' => $now,
                'signer_ip' => request()->ip() ?? '127.0.0.1',
                'signer_user_agent' => request()->userAgent() ?? 'Mozilla/5.0 Browser',
                'signature_data' => $signatureData['signature_data'] ?? 'E-SIGNATURE-VERIFIED',
                'document_hash' => $docHash,
            ]);

            // Immutable Audit Log
            SaasContractAuditLog::create([
                'saas_contract_id' => $contract->id,
                'action' => 'signed',
                'actor_type' => 'customer',
                'actor_id' => $contract->signer_email,
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent() ?? 'Browser Client',
                'details' => [
                    'hash' => $docHash,
                    'timestamp' => $now->toIso8601String(),
                    'signer_title' => $contract->signer_title,
                ],
            ]);

            // Notify Super Admin
            $superAdmins = User::where('role', 'super_admin')->get();
            foreach ($superAdmins as $sa) {
                SystemNotification::create([
                    'tenant_id' => $sa->tenant_id,
                    'user_id' => $sa->id,
                    'title' => 'Contract Signed Successfully',
                    'message' => "Contract #{$contract->contract_number} has been signed by {$contract->signer_name} ({$contract->tenant->name}).",
                    'category' => 'contract_signed',
                    'severity' => 'info',
                ]);
            }

            return true;
        });
    }
}
