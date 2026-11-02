<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SmsProviderLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'endpoint',
        'method',
        'request_payload',
        'response_payload',
        'http_status',
        'duration_ms',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'request_payload' => 'array',
            'response_payload' => 'array',
            'http_status' => 'integer',
            'duration_ms' => 'integer',
        ];
    }
}
