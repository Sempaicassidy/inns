<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantInspectionSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'super_admin_id',
        'reason',
        'started_at',
        'ended_at',
        'is_write_mode',
        'ip_address',
        'user_agent',
        'actions_performed',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'is_write_mode' => 'boolean',
            'actions_performed' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function superAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'super_admin_id');
    }

    public function isActive(): bool
    {
        return is_null($this->ended_at);
    }

    public function recordAction(string $action, array $meta = []): void
    {
        $actions = $this->actions_performed ?? [];
        $actions[] = [
            'action' => $action,
            'timestamp' => now()->toIso8601String(),
            'meta' => $meta,
        ];
        $this->update(['actions_performed' => $actions]);
    }
}
