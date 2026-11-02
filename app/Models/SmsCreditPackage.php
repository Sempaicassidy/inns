<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SmsCreditPackage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'credits_count',
        'selling_price_minor',
        'cost_price_minor',
        'currency',
        'description',
        'is_popular',
        'is_active',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'credits_count' => 'integer',
            'selling_price_minor' => 'integer',
            'cost_price_minor' => 'integer',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function getGrossProfitMinorAttribute(): int
    {
        return max(0, $this->selling_price_minor - $this->cost_price_minor);
    }
}
