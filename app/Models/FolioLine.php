<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FolioLine extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'folio_id',
        'business_date',
        'line_type',
        'description',
        'amount_minor',
        'tax_minor',
        'source_ref',
        'reversed_line_id',
        'idempotency_key',
        'posted_by',
    ];

    protected function casts(): array
    {
        return [
            'business_date' => 'date',
            'amount_minor' => 'integer',
            'tax_minor' => 'integer',
        ];
    }

    public function folio(): BelongsTo
    {
        return $this->belongsTo(Folio::class);
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }
}
