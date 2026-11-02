<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsPermission extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    public const PERM_SEND = 'sms.send';

    public const PERM_SEND_BOOKING = 'sms.send.booking_confirmation';

    public const PERM_SEND_PAYMENT = 'sms.send.payment_confirmation';

    public const PERM_SEND_GUEST = 'sms.send.guest_notification';

    public const PERM_VIEW_WALLET = 'sms.view_wallet';

    public const PERM_VIEW_HISTORY = 'sms.view_history';

    public const PERM_PURCHASE = 'sms.purchase';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'permission',
        'granted_by_user_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function granter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by_user_id');
    }

    public static function userHasPermission(User $user, string $permission): bool
    {
        // 1. Super Admin has all permissions
        if ($user->isSuperAdmin()) {
            return true;
        }

        // 2. Tenant Manager has all SMS permissions by default for their tenant
        if ($user->isManager()) {
            return true;
        }

        // 3. Check explicit permission or general sms.send
        return self::where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->where(function ($q) use ($permission) {
                $q->where('permission', $permission)
                    ->orWhere('permission', self::PERM_SEND);
            })
            ->exists();
    }
}
