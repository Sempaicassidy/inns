<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsAppSetting extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $table = 'whatsapp_settings';

    protected $fillable = [
        'tenant_id',
        'property_id',
        'provider',
        'phone_number_id',
        'business_account_id',
        'access_token',
        'sender_phone_number',
        'send_on_reservation_confirmed',
        'send_on_checkin',
        'send_on_checkout_invoice',
        'send_on_housekeeping_ready',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'send_on_reservation_confirmed' => 'boolean',
            'send_on_checkin' => 'boolean',
            'send_on_checkout_invoice' => 'boolean',
            'send_on_housekeeping_ready' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
