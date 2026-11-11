<?php

namespace App\Services;

use App\Models\SmsProviderAccount;
use App\Models\SmsProviderLog;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SwalaSmsService
{
    /**
     * Build an HTTP client that verifies TLS certificates unless explicitly
     * disabled for local development via SWALASMS_VERIFY_TLS=false.
     */
    protected function httpClient(int $timeout = 20): PendingRequest
    {
        $request = Http::timeout($timeout);

        $verifyTls = filter_var(
            config('swalasms.verify_tls', config('swahilies.verify_tls', true)),
            FILTER_VALIDATE_BOOLEAN
        );

        return $verifyTls ? $request : $request->withoutVerifying();
    }

    /**
     * Normalize Tanzanian and international phone numbers to E.164 (+255XXXXXXXXX) format
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
            // Unicode SMS (UCS-2): 70 chars for 1 segment, 67 chars per segment for multi-part
            $segments = $length <= 70 ? 1 : (int) ceil($length / 67);
            $maxPerSegment = $segments === 1 ? 70 : 67;
        } else {
            // GSM 7-bit standard SMS: 160 chars for 1 segment, 153 chars per segment for multi-part
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
        // GSM 03.38 character set check
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
     * Get active SwalaSMS provider credentials
     */
    protected function getCredentials(): array
    {
        $account = SmsProviderAccount::getActiveAccount();

        $apiKey = $account?->api_token
            ?: ($account?->password
            ?: config('swalasms.api_key', config('swahilies.api_key')));

        $baseUrl = $account?->base_url
            ?: config('swalasms.base_url', config('swahilies.base_url', 'https://api.swalasms.com'));

        $senderId = $account?->sender_id
            ?: config('swalasms.sender_id', 'SWALATECH');

        return [
            'account' => $account,
            'api_key' => trim((string) $apiKey),
            'base_url' => rtrim(trim((string) $baseUrl), '/'),
            'sender_id' => trim((string) $senderId),
        ];
    }

    /**
     * Send SMS via SwalaSMS Official API (POST /v1/sms/messages)
     */
    public function sendSms(string $toPhone, string $messageText, ?string $senderId = null): array
    {
        $startTime = microtime(true);
        $e164Phone = $this->normalizePhoneNumber($toPhone);
        $creds = $this->getCredentials();

        $finalSenderId = $senderId ?: ($creds['sender_id'] ?: 'SWALATECH');
        $endpoint = $creds['base_url'].'/v1/sms/messages';
        $idempotencyKey = (string) Str::uuid();

        $payload = [
            'sender_id' => $finalSenderId,
            'recipient' => $e164Phone,
            'body' => $messageText,
            'message' => $messageText, // supported alternative per SwalaSMS OpenAPI
        ];

        try {
            $response = $this->httpClient(20)
                ->withToken($creds['api_key'])
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'Idempotency-Key' => $idempotencyKey,
                ])
                ->post($endpoint, $payload);

            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            $responseData = $response->json() ?? [];

            // Audit log in database
            SmsProviderLog::create([
                'endpoint' => $endpoint,
                'method' => 'POST',
                'request_payload' => $payload,
                'response_payload' => $responseData,
                'http_status' => $response->status(),
                'duration_ms' => $durationMs,
                'ip_address' => request()?->ip(),
            ]);

            // SwalaSMS returns 202 Accepted on success
            if (($response->successful() || $response->status() === 202) && ($responseData['success'] ?? false)) {
                $msgUid = $responseData['data']['uid'] ?? $responseData['request_uid'] ?? ('SWL-'.time());
                $units = $responseData['data']['units'] ?? 1;

                // Sync local provider balance if available
                if ($creds['account'] && $creds['account']->balance_credits_cached > 0) {
                    $creds['account']->decrement('balance_credits_cached', (int) $units);
                }

                return [
                    'success' => true,
                    'message_id' => $msgUid,
                    'status' => $responseData['data']['status'] ?? 'queued',
                    'units' => $units,
                    'description' => "SMS imetumwa kikamilifu kupitia SwalaSMS (UID: {$msgUid})",
                    'raw' => $responseData,
                ];
            }

            // Error handling with Swahili translations
            $errCode = $responseData['error_code'] ?? null;
            $rawMsg = $responseData['message']
                ?? ($responseData['errors']['sender_id'][0]
                ?? ($responseData['errors']['recipient'][0] ?? 'Hitilafu ya SwalaSMS ('.$response->status().')'));

            if ($errCode === 'INVALID_SENDER') {
                $rawMsg = "Sender ID '{$finalSenderId}' haijaidhinishwa bado kwenye akaunti yako ya SwalaSMS. Unaweza kutumia 'SWALATECH' kwa majaribio, au sanidi Sender ID iliyoidhinishwa kwenye Gateway Settings.";
            } elseif ($errCode === 'INSUFFICIENT_BALANCE') {
                $rawMsg = 'Salio la SMS halitoshi kwenye akaunti yako ya SwalaSMS. Tafadhali ongeza salio.';
            } elseif ($errCode === 'POLICY_BLOCKED') {
                $rawMsg = "Ujumbe umezuiliwa na sera ya SwalaSMS: {$rawMsg}";
            }

            return [
                'success' => false,
                'message_id' => null,
                'status' => 'failed',
                'error' => $rawMsg,
                'error_code' => $errCode,
                'raw' => $responseData,
            ];
        } catch (\Throwable $e) {
            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            Log::error('SwalaSMS dispatch exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

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
                'error' => 'Kushindwa kuwasiliana na SwalaSMS API: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Fetch Live SMS Balance from SwalaSMS (GET /v1/balance)
     */
    public function getBalance(): array
    {
        $creds = $this->getCredentials();
        $endpoint = $creds['base_url'].'/v1/balance';

        try {
            $response = $this->httpClient(10)
                ->withToken($creds['api_key'])
                ->get($endpoint);

            if ($response->successful()) {
                $data = $response->json();
                $balance = $data['data']['balance'] ?? null;

                if ($balance !== null && $creds['account']) {
                    $creds['account']->update([
                        'balance_credits_cached' => (int) $balance,
                        'balance_checked_at' => now(),
                    ]);
                }

                return [
                    'success' => true,
                    'balance' => (float) ($balance ?? 0),
                    'raw' => $data,
                ];
            }

            return [
                'success' => false,
                'error' => $response->json()['message'] ?? 'Unable to fetch balance',
                'status' => $response->status(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send bulk SMS via SwalaSMS (POST /v2/sms/send-bulk)
     */
    public function sendBulk(array $recipients, string $message, ?string $senderId = null, ?string $campaignName = null): array
    {
        $creds = $this->getCredentials();
        $endpoint = $creds['base_url'].'/v2/sms/send-bulk';
        $finalSenderId = $senderId ?: ($creds['sender_id'] ?: 'SWALATECH');

        $formattedRecipients = array_map(function ($r) {
            if (is_string($r)) {
                return $this->normalizePhoneNumber($r);
            }
            if (is_array($r) && isset($r['to'])) {
                $r['to'] = $this->normalizePhoneNumber($r['to']);
            }

            return $r;
        }, $recipients);

        $payload = [
            'recipients' => $formattedRecipients,
            'message' => $message,
            'sender_id' => $finalSenderId,
            'campaign_name' => $campaignName ?: ('Campaign-'.date('Ymd-His')),
        ];

        try {
            $response = $this->httpClient(30)
                ->withToken($creds['api_key'])
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'Idempotency-Key' => (string) Str::uuid(),
                ])
                ->post($endpoint, $payload);

            $data = $response->json() ?? [];

            return [
                'success' => $response->successful() && ($data['success'] ?? false),
                'data' => $data,
                'status' => $response->status(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
