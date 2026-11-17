<?php

namespace App\Services;

use App\Models\SmsProviderAccount;
use App\Models\SmsProviderLog;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DarSmsService
{
    /**
     * Build HTTP client for Dar SMS
     */
    protected function httpClient(int $timeout = 20): PendingRequest
    {
        return Http::timeout($timeout)->withoutVerifying();
    }

    /**
     * Normalize Tanzanian and international phone numbers to E.164 (+255XXXXXXXXX or 255XXXXXXXXX) format
     */
    public function normalizePhoneNumber(string $phone): string
    {
        $clean = preg_replace('/[^0-9]/', '', $phone);

        // e.g. 0712345678 -> 255712345678
        if (str_starts_with($clean, '0') && strlen($clean) === 10) {
            $clean = '255'.substr($clean, 1);
        }

        // e.g. 712345678 -> 255712345678
        if (strlen($clean) === 9 && in_array($clean[0], ['6', '7'])) {
            $clean = '255'.$clean;
        }

        return str_starts_with($clean, '+') ? $clean : ('+'.$clean);
    }

    /**
     * Calculate billable SMS segments and detect if message contains Unicode
     */
    public function calculateSegments(string $message): array
    {
        $length = mb_strlen($message, 'UTF-8');
        $isUnicode = $this->containsUnicode($message);

        if ($isUnicode) {
            $segments = $length <= 70 ? 1 : (int) ceil($length / 67);
            $maxPerSegment = $segments === 1 ? 70 : 67;
        } else {
            $segments = $length <= 160 ? 1 : (int) ceil($length / 153);
            $maxPerSegment = $segments === 1 ? 160 : 153;
        }

        return [
            'characters' => $length,
            'segments' => max(1, $segments),
            'is_unicode' => $isUnicode,
            'max_per_segment' => $maxPerSegment,
        ];
    }

    /**
     * Check if message contains non-GSM characters
     */
    protected function containsUnicode(string $message): bool
    {
        $gsmChars = "@£\$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~]|€";

        $len = mb_strlen($message, 'UTF-8');
        for ($i = 0; $i < $len; $i++) {
            $char = mb_substr($message, $i, 1, 'UTF-8');
            if (mb_strpos($gsmChars, $char, 0, 'UTF-8') === false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get active Dar SMS provider credentials
     */
    public function getCredentials(): array
    {
        $account = SmsProviderAccount::getActiveAccount();

        $apiKey = $account?->api_token
            ?: ($account?->password
            ?: config('darsms.api_key', env('DARSMS_API_KEY')));

        $baseUrl = $account?->base_url
            ?: config('darsms.base_url', env('DARSMS_BASE_URL', 'https://dev.darsms.co.tz/api/v1'));

        $senderId = $account?->sender_id
            ?: config('darsms.sender_id', env('DARSMS_SENDER_ID', 'DARSMS'));

        return [
            'account' => $account,
            'provider' => 'DarSMS',
            'api_key' => trim((string) $apiKey),
            'base_url' => rtrim(trim((string) $baseUrl), '/'),
            'sender_id' => trim((string) $senderId),
        ];
    }

    /**
     * Send SMS via Dar SMS Official API (POST /integrations/sms/send)
     * Supports sending to any phone number without sandbox or whitelist restrictions.
     */
    public function sendSms(string|array $toPhone, string $messageText, ?string $senderId = null): array
    {
        $startTime = microtime(true);
        $creds = $this->getCredentials();
        $finalSenderId = $senderId ?: ($creds['sender_id'] ?: 'DARSMS');
        $endpoint = $creds['base_url'].'/integrations/sms/send';

        if (is_array($toPhone)) {
            $formattedTo = array_values(array_filter(array_map(function ($p) {
                $num = is_array($p) ? ($p['to'] ?? '') : $p;
                return $this->normalizePhoneNumber((string) $num);
            }, $toPhone)));
        } else {
            $formattedTo = [$this->normalizePhoneNumber($toPhone)];
        }

        $payload = [
            'senderId' => $finalSenderId,
            'to' => $formattedTo,
            'message' => $messageText,
        ];

        try {
            $response = $this->httpClient(20)
                ->withHeaders([
                    'X-API-Key' => $creds['api_key'],
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->post($endpoint, $payload);

            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            $responseData = $response->json() ?? [];

            SmsProviderLog::create([
                'endpoint' => $endpoint,
                'method' => 'POST',
                'request_payload' => $payload,
                'response_payload' => $responseData,
                'http_status' => $response->status(),
                'duration_ms' => $durationMs,
                'ip_address' => request()?->ip(),
            ]);

            if (($response->successful() || $response->status() === 202) && ($responseData['success'] ?? false)) {
                $msgUid = $responseData['data']['message_ids'][0] ?? $responseData['data']['batch_ids'][0] ?? ('DAR-'.time());
                $units = $responseData['data']['metrics']['credits'] ?? count($formattedTo);

                if ($creds['account'] && $creds['account']->balance_credits_cached > 0) {
                    $creds['account']->decrement('balance_credits_cached', (int) $units);
                }

                return [
                    'success' => true,
                    'message_id' => $msgUid,
                    'status' => 'queued',
                    'units' => $units,
                    'description' => "SMS imetumwa kikamilifu kupitia Dar SMS (ID: {$msgUid})",
                    'provider' => 'Dar SMS',
                    'raw' => $responseData,
                ];
            }

            $rawMsg = $responseData['message'] ?? ('Hitilafu ya Dar SMS ('.$response->status().')');
            if ($response->status() === 401) {
                $rawMsg = "API Key ya Dar SMS si sahihi au imeisha muda wake. Tafadhali weka API Key mpya kutoka kwenye dashibodi ya Dar SMS (dev.darsms.co.tz).";
            } elseif (isset($responseData['code']) && $responseData['code'] === 'APP_ERROR' && str_contains(strtolower($rawMsg), 'sender id not found')) {
                $rawMsg = "Sender ID '{$finalSenderId}' haijathibitishwa kwenye akaunti yako ya Dar SMS. Tafadhali tumia 'DARSMS'.";
            }

            return [
                'success' => false,
                'message_id' => null,
                'status' => 'failed',
                'error' => $rawMsg,
                'error_code' => $responseData['code'] ?? 'DAR_ERROR',
                'provider' => 'Dar SMS',
                'raw' => $responseData,
            ];
        } catch (\Throwable $e) {
            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            Log::error('Dar SMS dispatch exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            SmsProviderLog::create([
                'endpoint' => $endpoint,
                'method' => 'POST',
                'request_payload' => $payload,
                'response_payload' => ['exception' => $e->getMessage()],
                'http_status' => 500,
                'duration_ms' => $durationMs,
                'ip_address' => request()?->ip(),
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'status' => 'failed',
                'error' => 'Kushindwa kuwasiliana na Dar SMS API: '.$e->getMessage(),
                'provider' => 'Dar SMS',
            ];
        }
    }

    /**
     * Fetch Live SMS Balance from Dar SMS (GET /integrations/balance)
     */
    public function getBalance(): array
    {
        $creds = $this->getCredentials();
        $endpoint = $creds['base_url'].'/integrations/balance';

        try {
            $response = $this->httpClient(10)
                ->withHeaders([
                    'X-API-Key' => $creds['api_key'],
                    'Accept' => 'application/json',
                ])
                ->get($endpoint);

            if ($response->successful()) {
                $data = $response->json();
                $balance = $data['data']['sms_balance'] ?? null;

                if ($balance !== null && $creds['account']) {
                    $creds['account']->update([
                        'balance_credits_cached' => (int) $balance,
                        'balance_checked_at' => now(),
                    ]);
                }

                return [
                    'success' => true,
                    'balance' => (float) ($balance ?? 0),
                    'provider' => 'Dar SMS',
                    'raw' => $data,
                ];
            }

            return [
                'success' => false,
                'error' => $response->json()['message'] ?? 'Unable to fetch balance from Dar SMS',
                'status' => $response->status(),
                'provider' => 'Dar SMS',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'provider' => 'Dar SMS',
            ];
        }
    }

    /**
     * Send bulk SMS via Dar SMS
     */
    public function sendBulk(array $recipients, string $message, ?string $senderId = null, ?string $campaignName = null): array
    {
        $formattedRecipients = array_values(array_filter(array_map(function ($r) {
            $phone = is_array($r) ? ($r['to'] ?? '') : $r;
            return $this->normalizePhoneNumber((string) $phone);
        }, $recipients)));

        $res = $this->sendSms($formattedRecipients, $message, $senderId);

        return [
            'success' => $res['success'],
            'total' => count($formattedRecipients),
            'sent' => $res['success'] ? count($formattedRecipients) : 0,
            'provider' => 'Dar SMS',
            'message_id' => $res['message_id'] ?? null,
            'raw' => $res['raw'] ?? [],
            'error' => $res['error'] ?? null,
        ];
    }
}
