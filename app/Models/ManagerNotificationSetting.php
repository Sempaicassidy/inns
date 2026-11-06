<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManagerNotificationSetting extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $table = 'manager_notification_settings';

    protected $fillable = [
        'tenant_id',
        'property_id',
        'manager_name',
        'phone_number',
        'additional_phones',
        'email',
        'additional_emails',
        'recipients',
        'report_time',
        'send_via_sms',
        'send_via_whatsapp',
        'send_via_email',
        'notify_on_reservation',
        'notify_daily_report',
        'last_daily_report_sent_at',
        'last_daily_report_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'additional_phones' => 'array',
            'additional_emails' => 'array',
            'recipients' => 'array',
            'send_via_sms' => 'boolean',
            'send_via_whatsapp' => 'boolean',
            'send_via_email' => 'boolean',
            'notify_on_reservation' => 'boolean',
            'notify_daily_report' => 'boolean',
            'is_active' => 'boolean',
            'last_daily_report_sent_at' => 'datetime',
            'last_daily_report_date' => 'date',
        ];
    }

    /**
     * Get all unique phone numbers configured for SMS and WhatsApp dispatch.
     */
    public function getAllPhoneNumbers(): array
    {
        $phones = [];

        // 1. Primary phone
        if (! empty($this->phone_number)) {
            foreach (preg_split('/[,;\n]+/', $this->phone_number) as $p) {
                $cleaned = trim($p);
                if ($cleaned) $phones[] = $cleaned;
            }
        }

        // 2. Additional phones (array or text)
        if (! empty($this->additional_phones)) {
            if (is_array($this->additional_phones)) {
                foreach ($this->additional_phones as $p) {
                    if (is_string($p) && trim($p)) $phones[] = trim($p);
                }
            } elseif (is_string($this->additional_phones)) {
                foreach (preg_split('/[,;\n]+/', $this->additional_phones) as $p) {
                    $cleaned = trim($p);
                    if ($cleaned) $phones[] = $cleaned;
                }
            }
        }

        // 3. Structured recipients
        if (! empty($this->recipients) && is_array($this->recipients)) {
            foreach ($this->recipients as $r) {
                if (! empty($r['phone'])) {
                    $cleaned = trim($r['phone']);
                    if ($cleaned) $phones[] = $cleaned;
                }
            }
        }

        return array_values(array_unique($phones));
    }

    /**
     * Get all unique email addresses configured for email report dispatch.
     */
    public function getAllEmails(): array
    {
        $emails = [];

        // 1. Primary email
        if (! empty($this->email)) {
            foreach (preg_split('/[,;\n]+/', $this->email) as $e) {
                $cleaned = trim($e);
                if (filter_var($cleaned, FILTER_VALIDATE_EMAIL)) $emails[] = $cleaned;
            }
        }

        // 2. Additional emails
        if (! empty($this->additional_emails)) {
            if (is_array($this->additional_emails)) {
                foreach ($this->additional_emails as $e) {
                    if (is_string($e) && filter_var(trim($e), FILTER_VALIDATE_EMAIL)) $emails[] = trim($e);
                }
            } elseif (is_string($this->additional_emails)) {
                foreach (preg_split('/[,;\n]+/', $this->additional_emails) as $e) {
                    $cleaned = trim($e);
                    if (filter_var($cleaned, FILTER_VALIDATE_EMAIL)) $emails[] = $cleaned;
                }
            }
        }

        // 3. Structured recipients
        if (! empty($this->recipients) && is_array($this->recipients)) {
            foreach ($this->recipients as $r) {
                if (! empty($r['email'])) {
                    $cleaned = trim($r['email']);
                    if (filter_var($cleaned, FILTER_VALIDATE_EMAIL)) $emails[] = $cleaned;
                }
            }
        }

        return array_values(array_unique($emails));
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}

