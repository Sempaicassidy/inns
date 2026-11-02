<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemNotification extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'user_id',
        'target_role',
        'category',
        'severity',
        'title',
        'message',
        'action_url',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }

    public function scopeForUser(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $q) use ($user) {
            $q->where('user_id', $user->id)
                ->orWhere(function (Builder $sub) use ($user) {
                    $sub->whereNull('user_id')
                        ->where(function (Builder $roleQuery) use ($user) {
                            $roleQuery->whereNull('target_role')
                                ->orWhere('target_role', $user->role)
                                ->orWhere('target_role', 'all');
                        });
                });
        });
    }

    public function markAsRead(): bool
    {
        return $this->update(['read_at' => now()]);
    }

    /**
     * Get resolved action URL normalized to current installation host and subpath
     */
    public function getResolvedActionUrlAttribute(): ?string
    {
        if (! $this->action_url) {
            return null;
        }

        $url = trim($this->action_url);

        // Replace any lingering localhost:8000
        if (str_contains($url, 'localhost:8000')) {
            $parsed = parse_url($url);
            $path = $parsed['path'] ?? '/';
            $query = isset($parsed['query']) ? '?'.$parsed['query'] : '';

            return url($path.$query);
        }

        // If absolute URL, return as is
        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }

        // Relative path
        return url($url);
    }

    /**
     * Helper to dispatch a system notification
     */
    public static function send(
        string $tenantId,
        string $title,
        string $message,
        string $category = 'system',
        string $severity = 'info',
        ?string $actionUrl = null,
        ?string $targetRole = null,
        ?int $userId = null,
        ?string $propertyId = null
    ): self {
        return self::create([
            'tenant_id' => $tenantId,
            'property_id' => $propertyId,
            'user_id' => $userId,
            'target_role' => $targetRole,
            'category' => $category,
            'severity' => $severity,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'read_at' => null,
        ]);
    }
}
