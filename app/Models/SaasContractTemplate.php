<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaasContractTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'category',
        'description',
        'content',
        'is_active',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(SaasContract::class, 'saas_contract_template_id');
    }
}
