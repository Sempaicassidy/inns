<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsAppLog extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $table = 'whatsapp_logs';

    protected $fillable = [
        'tenant_id',
        'property_id',
        'recipient_phone',
        'recipient_name',
        'message_type',
        'message_body',
        'template_name',
        'status',
        'external_message_id',
        'error_message',
    ];
}
