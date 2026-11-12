import { router } from '@inertiajs/react';

/**
 * Log the user out and invalidate Inertia's encrypted history snapshots.
 *
 * Inertia stores page snapshots inside history.state, encrypted with a key
 * kept in sessionStorage (historyKey / historyIv). If those keys survive a
 * logout, the browser back button restores the last authenticated page from
 * memory without ever hitting the server — even though the session is gone.
 * Removing the keys makes old entries undecryptable, so Inertia falls back to
 * a fresh server visit which the auth middleware redirects to login.
 */
export function logout(): void {
    router.post(route('logout'), {}, {
        onSuccess: () => {
            sessionStorage.removeItem('historyKey');
            sessionStorage.removeItem('historyIv');
        },
    });
}
