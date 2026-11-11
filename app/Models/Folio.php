<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Folio extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'reservation_id',
        'stay_id',
        'folio_number',
        'owner_type',
        'owner_id',
        'currency',
        'total_charges_minor',
        'total_payments_minor',
        'balance_minor',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'total_charges_minor' => 'integer',
            'total_payments_minor' => 'integer',
            'balance_minor' => 'integer',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function stay(): BelongsTo
    {
        return $this->belongsTo(Stay::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(FolioLine::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function recalculateBalance(): void
    {
        $charges = $this->lines()->sum('amount_minor');
        $payments = $this->payments()->where('status', 'confirmed')->sum('amount_minor');

        $this->total_charges_minor = $charges;
        $this->total_payments_minor = $payments;
        $this->balance_minor = $charges - $payments;

        if ($this->balance_minor <= 0 && $this->status === 'open' && $charges > 0) {
            $this->status = 'settled';
        } elseif ($this->balance_minor > 0 && $this->status === 'settled') {
            // New charges on a settled folio reopen it
            $this->status = 'open';
        }

        $this->save();
    }
}
