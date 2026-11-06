<?php

namespace App\Http\Controllers;

use App\Models\SystemNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $category = $request->input('category');
        $filter = $request->input('filter', 'all');

        $query = SystemNotification::where('tenant_id', $tenantId)
            ->forUser($user)
            ->latest();

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($filter === 'unread') {
            $query->unread();
        } elseif ($filter === 'read') {
            $query->whereNotNull('read_at');
        }

        $notifications = $query->take(60)->get()->map(fn ($n) => [
            'id' => $n->id,
            'title' => $n->title,
            'message' => $n->message,
            'category' => $n->category,
            'severity' => $n->severity,
            'action_url' => $n->resolved_action_url,
            'is_read' => $n->read_at !== null,
            'read_at' => $n->read_at?->format('d M Y, H:i'),
            'created_at' => $n->created_at->diffForHumans(),
            'created_date' => $n->created_at->format('d M Y, H:i'),
        ]);

        $baseUserQuery = SystemNotification::where('tenant_id', $tenantId)->forUser($user);
        $stats = [
            'total' => (clone $baseUserQuery)->count(),
            'unread' => (clone $baseUserQuery)->unread()->count(),
            'today' => (clone $baseUserQuery)->whereDate('created_at', now()->toDateString())->count(),
            'urgent' => (clone $baseUserQuery)->where('severity', 'urgent')->unread()->count(),
        ];

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'stats' => $stats,
            'activeCategory' => $category ?? 'all',
            'activeFilter' => $filter,
        ]);
    }

    /**
     * Open notification: mark it as read and navigate immediately to the destination
     */
    public function go(Request $request, SystemNotification $notification): RedirectResponse
    {
        $user = $request->user();
        if ($notification->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        $notification->markAsRead();

        $destination = $notification->resolved_action_url ?: route('dashboard');

        // Extract highlight parameter if not already present
        $highlight = $this->extractHighlightKeyword($notification);
        if ($highlight && ! str_contains($destination, 'highlight=')) {
            $separator = str_contains($destination, '?') ? '&' : '?';
            $destination .= $separator.'highlight='.urlencode($highlight);
        }

        return redirect($destination)->with('highlight_term', $highlight);
    }

    /**
     * Smart keyword extraction from notification for instant UI highlighting
     */
    protected function extractHighlightKeyword(SystemNotification $notification): ?string
    {
        $title = $notification->title;
        $message = $notification->message;

        // 1. Colon separated: e.g. "Low Stock Warning: Mineral Water 1.5L"
        if (str_contains($title, ':')) {
            $parts = explode(':', $title, 2);
            $afterColon = trim($parts[1]);

            if (preg_match('/Room\s*([A-Za-z0-9\-]+)/i', $afterColon, $rm)) {
                return $rm[1];
            }

            // Remove trailing unit/quantities e.g. "Mineral Water 1.5L" -> "Mineral Water"
            $cleaned = preg_replace('/\s+\d+(\.\d+)?\s*(L|ml|kg|g|pcs|boxes|bottles)?$/i', '', $afterColon);

            return trim($cleaned);
        }

        // 2. Room number: e.g. "Room 102 Inspected & Ready" -> "102"
        if (preg_match('/Room\s*([A-Za-z0-9\-]+)/i', $title, $rm)) {
            return $rm[1];
        }

        // 3. Voucher or document codes: e.g. "Expense Voucher EXP-2026-001"
        if (preg_match('/(?:Voucher|Invoice|Booking|Ticket)\s*([A-Za-z0-9\-]+)/i', $title, $m)) {
            return $m[1];
        }

        // 4. Message inspection for Room number
        if (preg_match('/Room\s*([A-Za-z0-9\-]+)/i', $message, $rm)) {
            return $rm[1];
        }

        return null;
    }

    /**
     * Mark single notification as read (stays on current screen)
     */
    public function markAsRead(Request $request, SystemNotification $notification): RedirectResponse
    {
        $user = $request->user();
        if ($notification->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        $notification->markAsRead();

        if ($request->boolean('redirect') && $notification->resolved_action_url) {
            return redirect($notification->resolved_action_url);
        }

        return redirect()->back()->with('success', 'Notification marked as read.');
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $user = $request->user();

        SystemNotification::where('tenant_id', $user->tenant_id)
            ->forUser($user)
            ->unread()
            ->update(['read_at' => now()]);

        return redirect()->back()->with('success', 'All notifications marked as read.');
    }

    public function destroy(Request $request, SystemNotification $notification): RedirectResponse
    {
        $user = $request->user();
        if ($notification->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        $notification->delete();

        return redirect()->back()->with('success', 'Notification removed.');
    }

    public function clearAll(Request $request): RedirectResponse
    {
        $user = $request->user();

        SystemNotification::where('tenant_id', $user->tenant_id)
            ->forUser($user)
            ->whereNotNull('read_at')
            ->delete();

        return redirect()->back()->with('success', 'Read notifications cleared.');
    }

    /**
     * Polling endpoint for PWA real-time notification popups
     */
    public function unreadLatest(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['unread_count' => 0, 'notifications' => []]);
        }

        $notifications = SystemNotification::where('tenant_id', $user->tenant_id)
            ->forUser($user)
            ->unread()
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'title' => $n->title,
                'message' => $n->message,
                'category' => $n->category,
                'severity' => $n->severity,
                'action_url' => $n->resolved_action_url ?: route('dashboard'),
                'go_url' => route('notifications.go', $n->id),
                'created_at' => $n->created_at->diffForHumans(),
                'timestamp' => $n->created_at->timestamp,
            ]);

        return response()->json([
            'unread_count' => SystemNotification::where('tenant_id', $user->tenant_id)->forUser($user)->unread()->count(),
            'notifications' => $notifications,
        ]);
    }
}
