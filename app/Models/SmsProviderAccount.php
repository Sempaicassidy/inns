<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SmsProviderAccount extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'provider_name',
        'sender_id',
        'base_url',
        'username',
        'password',
        'api_token',
        'environment',
        'balance_credits_cached',
        'balance_checked_at',
        'is_active',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
            'api_token' => 'encrypted',
            'balance_checked_at' => 'datetime',
            'is_active' => 'boolean',
            'settings' => 'array',
        ];
    }

    public static function getActiveAccount(): ?self
    {
        return self::where('is_active', true)->first();
    }
}
