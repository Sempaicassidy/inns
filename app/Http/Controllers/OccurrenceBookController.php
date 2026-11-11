<?php

namespace App\Http\Controllers;

use App\Models\OccurrenceBookAmendment;
use App\Models\OccurrenceBookEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OccurrenceBookController extends Controller
{
    /**
     * Roles allowed to access the Security / Occurrence Book module.
     *
     * @var array<int, string>
     */
    private const ALLOWED_ROLES = [
        'owner', 'super_admin', 'general_manager', 'manager', 'admin',
        'security_officer', 'security_guard', 'security', 'staff',
    ];

    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user || ! in_array($user->active_role, self::ALLOWED_ROLES, true)) {
            return redirect()->route('dashboard')->with('error', 'You do not have access to the Security Occurrence Book.');
        }

        $tenantId = $user->tenant_id;
        $query = OccurrenceBookEntry::where('tenant_id', $tenantId)
            ->with(['property:id,name', 'creator:id,name', 'amendments.amendedBy:id,name'])
            ->latest('occurred_at');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference', 'like', "%{$s}%")
                    ->orWhere('location', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%")
                    ->orWhere('involved_persons', 'like', "%{$s}%");
            });
        }

        $entries = $query->paginate(20)->withQueryString();

        $stats = [
            'total' => OccurrenceBookEntry::where('tenant_id', $tenantId)->count(),
            'today' => OccurrenceBookEntry::where('tenant_id', $tenantId)
                ->whereDate('occurred_at', today())->count(),
            'submitted' => OccurrenceBookEntry::where('tenant_id', $tenantId)->where('status', 'submitted')->count(),
            'under_review' => OccurrenceBookEntry::where('tenant_id', $tenantId)->where('status', 'under_review')->count(),
            'closed' => OccurrenceBookEntry::where('tenant_id', $tenantId)->where('status', 'closed')->count(),
        ];

        return Inertia::render('Security/OccurrenceBook', [
            'entries' => $entries,
            'stats' => $stats,
            'categories' => OccurrenceBookEntry::CATEGORIES,
            'filters' => $request->only(['status', 'category', 'search']),
            'can_amend' => in_array($user->active_role, ['owner', 'super_admin', 'general_manager', 'manager', 'admin', 'security_officer'], true),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && in_array($user->active_role, self::ALLOWED_ROLES, true), 403);

        $validated = $request->validate([
            'occurred_at' => 'required|date',
            'location' => 'required|string|max:255',
            'category' => ['required', Rule::in(OccurrenceBookEntry::CATEGORIES)],
            'description' => 'required|string|max:5000',
            'involved_persons' => 'nullable|string|max:1000',
            'action_taken' => 'nullable|string|max:2000',
            'property_id' => 'nullable|uuid|exists:properties,id',
        ]);

        $entry = DB::transaction(function () use ($validated, $user) {
            $reference = 'OB-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));

            $entry = OccurrenceBookEntry::create([
                'tenant_id' => $user->tenant_id,
                'property_id' => $validated['property_id'] ?? $user->property_id,
                'reference' => $reference,
                'occurred_at' => $validated['occurred_at'],
                'location' => $validated['location'],
                'category' => $validated['category'],
                'description' => $validated['description'],
                'involved_persons' => $validated['involved_persons'] ?? null,
                'action_taken' => $validated['action_taken'] ?? null,
                'status' => 'submitted',
                'created_by_user_id' => $user->id,
            ]);

            Log::info('ob.entry.created', [
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
                'reference' => $reference,
            ]);

            return $entry;
        });

        return back()->with('success', "O.B. entry {$entry->reference} recorded successfully.");
    }

    /**
     * Amend an existing entry — preserves original + audit trail.
     */
    public function amend(Request $request, OccurrenceBookEntry $entry): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && in_array($user->active_role, self::ALLOWED_ROLES, true), 403);
        abort_unless($entry->tenant_id === $user->tenant_id, 403);
        abort_unless(in_array($user->active_role, ['owner', 'super_admin', 'general_manager', 'manager', 'admin', 'security_officer'], true), 403);

        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
            'location' => 'sometimes|required|string|max:255',
            'category' => ['sometimes', 'required', Rule::in(OccurrenceBookEntry::CATEGORIES)],
            'description' => 'sometimes|required|string|max:5000',
            'involved_persons' => 'nullable|string|max:1000',
            'action_taken' => 'nullable|string|max:2000',
            'status' => ['sometimes', Rule::in(['submitted', 'under_review', 'closed'])],
        ]);

        DB::transaction(function () use ($entry, $validated, $user) {
            $original = $entry->only(['occurred_at', 'location', 'category', 'description', 'involved_persons', 'action_taken', 'status']);
            $amended = array_intersect_key($validated, array_flip(['location', 'category', 'description', 'involved_persons', 'action_taken', 'status']));

            if (! empty($amended)) {
                OccurrenceBookAmendment::create([
                    'occurrence_book_entry_id' => $entry->id,
                    'original_values' => $original,
                    'amended_values' => $amended,
                    'reason' => $validated['reason'],
                    'amended_by_user_id' => $user->id,
                ]);

                $entry->update($amended);
            }

            Log::info('ob.entry.amended', [
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
                'entry_id' => $entry->id,
                'reference' => $entry->reference,
            ]);
        });

        return back()->with('success', "O.B. entry {$entry->reference} amended. Original record preserved in audit trail.");
    }
}
