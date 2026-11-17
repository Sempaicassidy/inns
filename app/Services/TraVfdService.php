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

        if (empty($cfg['device_id'])) {
            return false;
        }

        $hasApiKey = ! empty($cfg['api_key']);
        $hasCerts = ! empty($cfg['certificate_path'])
            && is_file($cfg['certificate_path'])
            && ! empty($cfg['private_key_path'])
            && is_file($cfg['private_key_path']);

        return ! empty($cfg['base_url']) && ($hasApiKey || $hasCerts);
    }

    /**
     * Test connection to VFD service endpoint with current tenant credentials.
     */
    public function testConnection(Tenant $tenant): array
    {
        $cfg = $this->config($tenant);

        if (! $this->isConfigured($tenant)) {
            return [
                'success' => false,
                'message' => 'VFD haijawekewa Device ID au API Key kikamilifu.',
                'details' => [
                    'device_id_set' => ! empty($cfg['device_id']),
                    'api_key_set' => ! empty($cfg['api_key']),
                    'base_url' => $cfg['base_url'],
                ],
            ];
        }

        try {
            $options = ['verify' => true];
            if (! empty($cfg['certificate_path']) && is_file($cfg['certificate_path']) && ! empty($cfg['private_key_path']) && is_file($cfg['private_key_path'])) {
                $options['cert'] = $cfg['certificate_path'];
                $options['ssl_key'] = $cfg['private_key_path'];
            }

            $response = Http::timeout(10)
                ->withOptions($options)
                ->withHeaders(array_filter([
                    'X-Device-Id' => $cfg['device_id'] ?? null,
                    'X-Api-Key' => $cfg['api_key'] ?? null,
                    'Authorization' => ! empty($cfg['api_key']) ? 'Bearer '.$cfg['api_key'] : null,
                    'Accept' => 'application/json',
                ]))
                ->get(rtrim($cfg['base_url'], '/').'/ping');

            if ($response->successful() || in_array($response->status(), [200, 204, 404, 405])) {
                return [
                    'success' => true,
                    'message' => 'Mawasiliano na VFD Gateway yamefanikiwa (HTTP '.$response->status().'). Kifaa kiko tayari kutumika.',
                    'status' => $response->status(),
                ];
            }

            return [
                'success' => false,
                'message' => 'Imeshindwa kuthibitisha na VFD Gateway (HTTP '.$response->status().'). Hakikisha API Key na Device ID zimetolewa na TRA/Provider wako.',
                'status' => $response->status(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Hitilafu ya mtandao: '.$e->getMessage(),
            ];
        }
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

            $options = ['verify' => true];
            if (! empty($cfg['certificate_path']) && is_file($cfg['certificate_path']) && ! empty($cfg['private_key_path']) && is_file($cfg['private_key_path'])) {
                $options['cert'] = $cfg['certificate_path'];
                $options['ssl_key'] = $cfg['private_key_path'];
            }

            $response = Http::timeout(20)
                ->withOptions($options)
                ->withHeaders(array_filter([
                    'X-Device-Id' => $cfg['device_id'] ?? null,
                    'X-Api-Key' => $cfg['api_key'] ?? null,
                    'Authorization' => ! empty($cfg['api_key']) ? 'Bearer '.$cfg['api_key'] : null,
                    'Accept' => 'application/json',
                ]))
                ->post(rtrim($cfg['base_url'], '/').'/invoices', $requestBody);

            $resData = $response->json() ?? [];
            $fiscalNumber = $resData['fiscal_number'] ?? $resData['rct_num'] ?? $resData['receipt_number'] ?? null;
            $qrPayload = $resData['qr_payload'] ?? $resData['qr_code'] ?? $resData['qr'] ?? null;
            $verificationUrl = $resData['verification_url'] ?? $resData['verify_url'] ?? null;

            $invoice->update([
                'status' => $response->successful() ? ($fiscalNumber ? 'acknowledged' : 'submitted') : 'failed',
                'response_payload' => ! empty($resData) ? $resData : ['raw' => $response->body()],
                'fiscal_number' => $fiscalNumber,
                'qr_payload' => $qrPayload,
                'verification_url' => $verificationUrl,
                'submitted_at' => now(),
                'acknowledged_at' => $fiscalNumber ? now() : null,
                'error_message' => $response->successful() ? null : ($resData['message'] ?? 'HTTP '.$response->status()),
            ]);
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
            'buyer' => $payload['buyer'] ?? ['type' => 'walk_in', 'name' => 'Walk-in Guest'],
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

        $defaultBaseUrl = env('TRA_VFD_BASE_URL', 'https://vfd.tra.go.tz/api/v1');

        return [
            'base_url' => ! empty($vfd['base_url']) ? $vfd['base_url'] : $defaultBaseUrl,
            'environment' => $vfd['environment'] ?? env('TRA_VFD_ENV', 'sandbox'),
            'device_id' => $vfd['device_id'] ?? env('TRA_VFD_DEVICE_ID'),
            'certificate_path' => $vfd['certificate_path'] ?? env('TRA_VFD_CERT_PATH'),
            'private_key_path' => $vfd['private_key_path'] ?? env('TRA_VFD_KEY_PATH'),
            'api_key' => $vfd['api_key'] ?? env('TRA_VFD_API_KEY'),
        ];
    }
}
