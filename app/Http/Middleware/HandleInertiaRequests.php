<?php

namespace App\Http\Middleware;

use App\Models\BusinessDate;
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
        $property = null;
        $businessDate = null;

        if ($user) {
            $user->load(['tenant', 'property']);
            $property = $user->property ?? $user->tenant?->properties()->first();
            if ($property) {
                $bDateRecord = BusinessDate::where('property_id', $property->id)->first();
                $businessDate = $bDateRecord?->current_business_date?->format('Y-m-d') ?? now()->format('Y-m-d');
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'property' => $property,
                'businessDate' => $businessDate,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
