<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VerifyEmailController extends Controller
{
    /**
     * Mark the user's email address as verified (One-Time Activation).
     * Works seamlessly whether user is logged in or activating directly from email link.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $userId = $request->route('id');
        $hash = (string) $request->route('hash');

        $user = User::findOrFail($userId);

        // Verify cryptographic hash against user's email
        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403, 'Kiungo hiki cha uthibitishaji si sahihi au kimebadilishwa.');
        }

        // 1. If already verified, log in if needed and redirect cleanly to dashboard
        if ($user->hasVerifiedEmail()) {
            if (! Auth::check() || Auth::id() !== $user->id) {
                Auth::login($user);
                $request->session()->regenerate();
            }

            $singleRole = $user->roles_list[0] ?? $user->role ?? 'general_manager';
            session(['active_role' => $singleRole]);
            $targetRoute = User::getRoleDashboardRoute($singleRole);

            return redirect()->route($targetRoute)->with('info', 'Akaunti yako tayari imewezeshwa (activated). Karibu kazini!');
        }

        // 2. Mark as verified (ONE-TIME ACTIVATION)
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        // 3. Automatically authenticate the user upon successful email verification
        if (! Auth::check() || Auth::id() !== $user->id) {
            Auth::login($user);
            $request->session()->regenerate();
        }

        $singleRole = $user->roles_list[0] ?? $user->role ?? 'general_manager';
        session(['active_role' => $singleRole]);
        $targetRoute = User::getRoleDashboardRoute($singleRole);

        return redirect()->route($targetRoute)->with('success', 'Hongera! Akaunti yako imewezeshwa (activated) kikamilifu. Karibu kazini!');
    }
}
