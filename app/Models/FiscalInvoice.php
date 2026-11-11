<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FiscalInvoice extends Model
{
    use BelongsToTenant, HasUuids;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'source_type',
        'source_id',
        'invoice_number',
        'environment',
        'status',
        'request_payload',
        'response_payload',
        'fiscal_number',
        'qr_payload',
        'verification_url',
        'error_message',
        'submitted_at',
        'acknowledged_at',
    ];

    protected function casts(): array
    {
        return [
            'request_payload' => 'array',
            'response_payload' => 'array',
            'submitted_at' => 'datetime',
            'acknowledged_at' => 'datetime',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
