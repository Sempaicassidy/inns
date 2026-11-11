<?php

namespace App\Services;

use App\Models\FiscalInvoice;
use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * TRA/VFD fiscalisation client.
 *
 * Tanzania Revenue Authority requires every fiscal receipt to be signed and
 * acknowledged by an official VFD/EFD unit. This service records every
 * fiscalisable document as a FiscalInvoice and submits it to the configured
 * VFD endpoint ONLY when complete credentials exist:
 *
 *   tenant.settings['vfd'] = [
 *     'base_url'        => official VFD endpoint (sandbox or production),
 *     'environment'     => 'sandbox' | 'production',
 *     'device_id'       => assigned VFD device/EFD unit ID,
 *     'certificate_path'=> path to signing certificate (PEM),
 *     'private_key_path'=> path to private key (PEM),
 *     'api_key'         => provider API key (if the unit requires one),
 *   ]
 *
 * When configuration is incomplete the invoice is stored with status
 * 'not_configured' — nothing is ever reported as fiscally recognised
 * without a real acknowledgement from the authority endpoint.
 */
class TraVfdService
{
    public function isConfigured(Tenant $tenant): bool
    {
        $cfg = $this->config($tenant);

        return ! empty($cfg['base_url'])
            && ! empty($cfg['device_id'])
            && ! empty($cfg['certificate_path'])
            && is_file($cfg['certificate_path'])
            && ! empty($cfg['private_key_path'])
            && is_file($cfg['private_key_path']);
    }

    /**
     * Record a fiscalisable document and, when configured, submit it.
     * Returns the FiscalInvoice row (never throws for provider errors —
     * failures are persisted on the record for retry/audit).
     */
    public function recordInvoice(
        Tenant $tenant,
        string $sourceType,
        string $sourceId,
        array $payload,
        ?string $propertyId = null,
    ): FiscalInvoice {
        $configured = $this->isConfigured($tenant);
        $cfg = $this->config($tenant);

        $invoice = FiscalInvoice::firstOrCreate(
            ['source_type' => $sourceType, 'source_id' => $sourceId],
            [
                'tenant_id' => $tenant->id,
                'property_id' => $propertyId,
                'invoice_number' => 'FISC-'.strtoupper(Str::random(10)),
                'environment' => $cfg['environment'] ?? 'sandbox',
                'status' => $configured ? 'queued' : 'not_configured',
                'request_payload' => $payload,
            ]
        );

        if ($configured && $invoice->status === 'queued') {
            $this->submit($invoice->fresh(), $tenant);
        }

        return $invoice;
    }

    /**
     * Submit a queued invoice to the VFD endpoint and persist the outcome.
     */
    public function submit(FiscalInvoice $invoice, Tenant $tenant): FiscalInvoice
    {
        $cfg = $this->config($tenant);

        try {
            $requestBody = $this->buildRequestBody($invoice, $cfg);

            $response = Http::timeout(20)
                ->withOptions([
                    'verify' => true, // TLS verification stays ON in every environment
                    'cert' => $cfg['certificate_path'],
                    'ssl_key' => $cfg['private_key_path'],
                ])
                ->withHeaders(array_filter([
                    'X-Device-Id' => $cfg['device_id'] ?? null,
                    'X-Api-Key' => $cfg['api_key'] ?? null,
                    'Accept' => 'application/json',
                ]))
                ->post(rtrim($cfg['base_url'], '/').'/invoices', $requestBody);

            $invoice->update([
                'status' => $response->successful() ? 'submitted' : 'failed',
                'response_payload' => $response->json() ?? ['raw' => $response->body()],
                'submitted_at' => now(),
                'error_message' => $response->successful() ? null : 'HTTP '.$response->status(),
            ]);

            // Acknowledgement (fiscal number + QR) may arrive via a second
            // authority callback or polling endpoint; handle when the
            // official TRA/VFD acknowledgement contract is available.
        } catch (\Throwable $e) {
            $invoice->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'submitted_at' => now(),
            ]);
        }

        return $invoice;
    }

    /**
     * Build the outbound fiscal document payload. The exact field contract
     * must be aligned with the official TRA/VFD technical specification
     * once credentials and the current API document are available.
     */
    protected function buildRequestBody(FiscalInvoice $invoice, array $cfg): array
    {
        $payload = $invoice->request_payload ?? [];

        return [
            'device_id' => $cfg['device_id'] ?? null,
            'invoice_number' => $invoice->invoice_number,
            'environment' => $invoice->environment,
            'issued_at' => now()->toIso8601String(),
            'seller' => [
                'tin' => $payload['tin'] ?? null,
                'vrn' => $payload['vrn'] ?? null,
                'name' => $payload['seller_name'] ?? null,
            ],
            'buyer' => $payload['buyer'] ?? ['type' => 'walk_in'],
            'lines' => $payload['lines'] ?? [],
            'totals' => $payload['totals'] ?? [],
        ];
    }

    /**
     * Resolve VFD configuration: tenant settings first, then env fallback.
     */
    protected function config(Tenant $tenant): array
    {
        $settings = $tenant->settings ?? [];
        $vfd = $settings['vfd'] ?? [];

        return [
            'base_url' => $vfd['base_url'] ?? env('TRA_VFD_BASE_URL'),
            'environment' => $vfd['environment'] ?? env('TRA_VFD_ENV', 'sandbox'),
            'device_id' => $vfd['device_id'] ?? env('TRA_VFD_DEVICE_ID'),
            'certificate_path' => $vfd['certificate_path'] ?? env('TRA_VFD_CERT_PATH'),
            'private_key_path' => $vfd['private_key_path'] ?? env('TRA_VFD_KEY_PATH'),
            'api_key' => $vfd['api_key'] ?? env('TRA_VFD_API_KEY'),
        ];
    }
}
