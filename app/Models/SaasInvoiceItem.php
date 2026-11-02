<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaasInvoiceItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'saas_invoice_id',
        'description',
        'quantity',
        'unit_price_minor',
        'total_minor',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price_minor' => 'integer',
            'total_minor' => 'integer',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SaasInvoice::class, 'saas_invoice_id');
    }
}
