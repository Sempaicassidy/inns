<?php

namespace App\Http\Middleware;

use App\Models\BusinessDate;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\SystemNotification;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $tenant = null;
        $property = null;
        $branches = [];
        $businessDate = null;
        $canManageBranches = false;
        $smsWallet = null;

        if ($user) {
            $user->load(['tenant', 'property']);
            $tenant = $user->tenant;

            if ($tenant) {
                try {
                    $smsWallet = $tenant->smsWallet()->first();
                } catch (\Throwable $e) {
                }
            }

            $activePropId = session('current_property_id', $user->property_id);
            if ($activePropId) {
                $property = Property::find($activePropId);
            }

            if (! $property) {
                $property = $user->property ?? $tenant?->properties()->where('is_active', true)->first() ?? $tenant?->properties()->first();
            }

            if ($property) {
                $bDateRecord = BusinessDate::where('property_id', $property->id)->first();
                $businessDate = $bDateRecord?->current_business_date?->format('Y-m-d') ?? now()->format('Y-m-d');
            }

            if ($tenant) {
                $branches = $tenant->properties()
                    ->where('is_active', true)
                    ->orderBy('created_at')
                    ->get(['id', 'name', 'code', 'city', 'property_type', 'is_main'])
                    ->toArray();
            }

            $canManageBranches = $user->canManageBranches();

            // Real-time operational notifications
            $notifications = [];
            $persistentNotifications = [];

            // 1. Persistent system notifications
            try {
                $persistentNotifications = SystemNotification::where('tenant_id', $user->tenant_id)
                    ->forUser($user)
                    ->unread()
                    ->latest()
                    ->take(15)
                    ->get()
                    ->map(fn ($n) => [
                        'id' => $n->id,
                        'type' => $n->category,
                        'title' => $n->title,
                        'message' => $n->message,
                        'severity' => $n->severity,
                        'url' => route('notifications.go', $n->id),
                        'action_url' => $n->resolved_action_url ?? route('dashboard'),
                        'time' => $n->created_at?->diffForHumans() ?? 'Just now',
                        'is_persistent' => true,
                    ])
                    ->toArray();
                $notifications = $persistentNotifications;
            } catch (\Throwable $e) {
                // Table might not exist in early tests
            }

            if ($property) {
                $propId = $property->id;
                $today = $businessDate ?? now()->toDateString();

                $dueInCount = Reservation::where('property_id', $propId)
                    ->where('status', 'confirmed')
                    ->whereDate('check_in', '<=', $today)
                    ->count();
                if ($dueInCount > 0) {
                    $notifications[] = [
                        'id' => 'due_in',
                        'type' => 'reservation',
                        'title' => 'Pending Check-Ins',
                        'message' => "{$dueInCount} guest(s) arriving or scheduled to check in today",
                        'count' => $dueInCount,
                        'url' => route('reservations.index', ['status' => 'confirmed']),
                        'color' => 'blue',
                        'time' => 'Today',
                    ];
                }

                $dueOutCount = Reservation::where('property_id', $propId)
                    ->where('status', 'checked_in')
                    ->whereDate('check_out', '<=', $today)
                    ->count();
                if ($dueOutCount > 0) {
                    $notifications[] = [
                        'id' => 'due_out',
                        'type' => 'reservation',
                        'title' => 'Pending Check-Outs',
                        'message' => "{$dueOutCount} room(s) due for check-out today",
                        'count' => $dueOutCount,
                        'url' => route('reservations.index', ['status' => 'checked_in']),
                        'color' => 'amber',
                        'time' => 'Today',
                    ];
                }

                $dirtyCount = Room::where('property_id', $propId)
                    ->where('status_hk', 'dirty')
                    ->count();
                if ($dirtyCount > 0) {
                    $notifications[] = [
                        'id' => 'dirty_rooms',
                        'type' => 'housekeeping',
                        'title' => 'Housekeeping Required',
                        'message' => "{$dirtyCount} dirty room(s) awaiting cleaning",
                        'count' => $dirtyCount,
                        'url' => route('housekeeping.index', ['tab' => 'dirty']),
                        'color' => 'rose',
                        'time' => 'Priority',
                    ];
                }

                $blockedCount = Room::where('property_id', $propId)
                    ->whereIn('status_hk', ['out_of_order', 'out_of_service'])
                    ->count();
                if ($blockedCount > 0) {
                    $notifications[] = [
                        'id' => 'blocked_rooms',
                        'type' => 'maintenance',
                        'title' => 'Blocked Rooms',
                        'message' => "{$blockedCount} room(s) under maintenance / blocked",
                        'count' => $blockedCount,
                        'url' => route('calendar.index'),
                        'color' => 'purple',
                        'time' => 'Maintenance',
                    ];
                }

                // Pending Expenses for Accountant / GM
                if (in_array($user->role, ['general_manager', 'owner', 'accountant', 'senior_accountant', 'finance_officer'])) {
                    $pendingExpCount = Expense::where('tenant_id', $user->tenant_id)
                        ->where('status', 'pending')
                        ->count();
                    if ($pendingExpCount > 0) {
                        $notifications[] = [
                            'id' => 'pending_expenses',
                            'type' => 'finance',
                            'title' => 'Pending Expense Approvals',
                            'message' => "{$pendingExpCount} expense voucher(s) awaiting approval",
                            'count' => $pendingExpCount,
                            'url' => route('accounting.approvals.expenses'),
                            'color' => 'rose',
                            'time' => 'Finance',
                        ];
                    }
                }

                // Low stock alerts for Manager / Store
                if (in_array($user->role, ['general_manager', 'owner', 'storekeeper'])) {
                    try {
                        $lowStockCount = InventoryItem::where('tenant_id', $user->tenant_id)
                            ->whereColumn('current_stock', '<=', 'min_stock_alert')
                            ->where('is_active', true)
                            ->count();
                        if ($lowStockCount > 0) {
                            $notifications[] = [
                                'id' => 'low_stock',
                                'type' => 'inventory',
                                'title' => 'Low Stock Alert',
                                'message' => "{$lowStockCount} inventory item(s) below reorder level",
                                'count' => $lowStockCount,
                                'url' => route('inventory.index'),
                                'color' => 'amber',
                                'time' => 'Inventory',
                            ];
                        }
                    } catch (\Throwable $e) {
                    }
                }
            }
        }

        if (! $tenant) {
            $tenant = Tenant::first();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'tenant' => $tenant ? [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'plan' => $tenant->plan,
                    'settings' => $tenant->settings ?? [],
                    'system_name' => $tenant->settings['system_name'] ?? $tenant->name ?? 'THE INNS',
                    'tagline' => $tenant->settings['tagline'] ?? null,
                    'tin' => $tenant->settings['tin'] ?? ($property?->tax_config['tin'] ?? null),
                    'vrn' => $tenant->settings['vrn'] ?? ($property?->tax_config['vrn'] ?? null),
                    'business_license' => $tenant->settings['business_license'] ?? null,
                    'phone' => $tenant->settings['phone'] ?? $property?->phone,
                    'email' => $tenant->settings['email'] ?? $property?->email,
                    'address' => $tenant->settings['address'] ?? $property?->address,
                    'city' => $tenant->settings['city'] ?? $property?->city,
                    'country' => $tenant->settings['country'] ?? ($property?->country ?? 'Tanzania'),
                    'website' => $tenant->settings['website'] ?? null,
                    'receipt_header' => $tenant->settings['receipt_header'] ?? 'OFFICIAL CASH RECEIPT / INVOICE',
                    'receipt_footer' => $tenant->settings['receipt_footer'] ?? 'Thank you for choosing us! Goods & services once paid are non-refundable.',
                    'currency' => $tenant->settings['currency'] ?? ($property?->currency ?? 'TZS'),
                    'currency_symbol' => $tenant->settings['currency_symbol'] ?? 'TZS',
                    'sender_id' => $tenant->settings['sender_id'] ?? $tenant->name ?? 'THE INNS',
                    'wifi_ssid' => $tenant->settings['wifi_ssid'] ?? null,
                    'wifi_password' => $tenant->settings['wifi_password'] ?? null,
                    'features' => $tenant->getFeaturesMap(),
                ] : null,
                'active_role' => $user?->active_role,
                'property' => $property,
                'branches' => $branches,
                'can_manage_branches' => $canManageBranches,
                'businessDate' => $businessDate,
                'sms_balance' => $smsWallet?->balance_credits ?? 0,
                'sms_wallet' => $smsWallet ? [
                    'balance_credits' => $smsWallet->balance_credits,
                    'total_purchased' => $smsWallet->total_credits_purchased,
                    'total_used' => $smsWallet->total_credits_used,
                    'status' => $smsWallet->status,
                ] : null,
                'notifications' => $notifications ?? [],
                'unread_notifications_count' => count($persistentNotifications ?? []),
                'is_impersonating' => $request->session()->has('impersonating_original_superadmin_id'),
                'impersonated_tenant_name' => $request->session()->get('impersonated_tenant_name'),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'highlight_term' => $request->session()->get('highlight_term'),
            ],
        ];
    }
}
