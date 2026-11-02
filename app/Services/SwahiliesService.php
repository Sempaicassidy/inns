<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SwahiliesService
{
    protected string $apiKey;
    protected string $baseUrl;
    protected string $environment;

    public function __construct()
    {
        $this->apiKey = config('swahilies.api_key', env('SWAHILIES_API_KEY', 'swl_live_3rRTD7pHVgLewdEEmDZNvk762gvfkMefkzl7ESSQ6xQi7QNx'));
        $this->baseUrl = rtrim(config('swahilies.base_url', env('SWAHILIES_BASE_URL', 'https://api.swahilies.com')), '/');
        $this->environment = config('swahilies.environment', env('SWAHILIES_ENV', 'live'));
    }

    /**
     * Get active API Key
     */
    public function getApiKey(): string
    {
        return $this->apiKey;
    }

    /**
     * Initiate a payment collection request (Mobile Money / M-Pesa / Tigo / Airtel / HaloPesa)
     */
    public function initiatePayment(array $payload): array
    {
        try {
            $endpoint = "{$this->baseUrl}/v1/payments/initialize";

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($endpoint, $payload);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            Log::warning('Swahilies payment initiation returned non-success response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'message' => $response->json('message') ?? 'Payment initiation failed',
                'status' => $response->status(),
                'raw' => $response->json(),
            ];
        } catch (\Throwable $e) {
            Log::error('Swahilies payment initiation exception: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify payment status by reference / transaction ID
     */
    public function verifyPayment(string $reference): array
    {
        try {
            $endpoint = "{$this->baseUrl}/v1/payments/verify/{$reference}";

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Accept' => 'application/json',
            ])->timeout(30)->get($endpoint);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => $response->json('message') ?? 'Verification failed',
                'raw' => $response->json(),
            ];
        } catch (\Throwable $e) {
            Log::error('Swahilies verification exception: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send SMS via Swahilies SMS Gateway
     */
    public function sendSms(string $toPhone, string $message, ?string $senderId = null): array
    {
        try {
            $endpoint = "{$this->baseUrl}/v1/sms/send";

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Accept' => 'application/json',
            ])->timeout(20)->post($endpoint, [
                'to' => $toPhone,
                'message' => $message,
                'sender_id' => $senderId ?: 'THE INNS',
            ]);

            return [
                'success' => $response->successful(),
                'data' => $response->json(),
            ];
        } catch (\Throwable $e) {
            Log::error('Swahilies SMS dispatch exception: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }
}

