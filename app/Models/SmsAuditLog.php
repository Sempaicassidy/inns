<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsAuditLog extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'action',
        'details',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function record(string $action, ?string $tenantId = null, ?int $userId = null, array $details = []): self
    {
        return self::create([
            'tenant_id' => $tenantId,
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'details' => $details,
            'ip_address' => request()?->ip(),
        ]);
    }
}
