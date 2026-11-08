<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     * Supports both email address and username lookup for recovery.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $input = trim((string) ($request->input('email') ?: $request->input('username')));

        if (empty($input)) {
            throw ValidationException::withMessages([
                'email' => ['Please enter your registered username or email address.'],
            ]);
        }

        // Determine if input is email or username
        if (filter_var($input, FILTER_VALIDATE_EMAIL)) {
            $email = $input;
            $user = User::where('email', $email)->first();
        } else {
            $user = User::where('username', $input)->first();
            if (! $user || empty($user->email)) {
                throw ValidationException::withMessages([
                    'email' => ["No account found matching username '{$input}'."],
                ]);
            }
            $email = $user->email;
        }

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account found matching this email address.'],
            ]);
        }

        // Send reset link using password broker
        $status = Password::sendResetLink(['email' => $email]);

        if ($status == Password::RESET_LINK_SENT) {
            $maskedEmail = $this->maskEmail($email);
            $hotelName = $user->hotel_name;

            return back()->with('status', "Kiungo cha kurejesha nenosiri kutoka {$hotelName} kimetumwa kwenye barua pepe yako ({$maskedEmail}).");
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }

    /**
     * Mask email for secure privacy display.
     */
    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        $name = $parts[0];
        $domain = $parts[1] ?? '';

        $len = strlen($name);
        if ($len <= 2) {
            $maskedName = substr($name, 0, 1) . '*';
        } else {
            $maskedName = substr($name, 0, 2) . str_repeat('*', max(1, $len - 3)) . substr($name, -1);
        }

        return $maskedName . '@' . $domain;
    }
}
