/**
 * Secure Device-Based Offline Authentication & PIN Unlock Engine
 * Conforms to Part 9 of Multi-Tenant Offline-First Specification.
 *
 * PIN credentials are stored per-user as PBKDF2-SHA256 verifiers
 * (salt + hash) — never plaintext, never a shared default PIN.
 */

import { db, LocalSession } from './database';
import { getDeviceId } from './device';
import {
    createOfflinePinCredential,
    verifyOfflinePinCredential,
    OfflinePinCredential,
} from './offline-pin';

const FAILED_ATTEMPTS_PREFIX = 'offline_auth_failed_';
const LOCKOUT_PREFIX = 'offline_auth_lockout_';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * @deprecated Legacy SHA-256 verifier kept only to migrate sessions
 * created before the PBKDF2 credential system. Do not use for new PINs.
 */
async function hashPinWithSalt(pin: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${pin}:the_inns_offline_salt`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function sessionIdFor(tenantId: string, userId: number): string {
    return `sess_${tenantId}_${userId}`;
}

function isSessionExpired(session: LocalSession): boolean {
    return Boolean(session.expiresAt && new Date(session.expiresAt).getTime() < Date.now());
}

/**
 * Cache current online authenticated session into Dexie.
 * No PIN is provisioned automatically — the user must set their own
 * offline PIN via setOfflinePin() while online.
 */
export async function cacheOnlineSession(params: {
    tenantId: string;
    userId: number;
    userName: string;
    userEmail: string;
    userRole: string;
    profile?: Record<string, any>;
    pin?: string;
    pinConfirmation?: string;
}): Promise<LocalSession> {
    const sessionId = sessionIdFor(params.tenantId, params.userId);
    const existing = await db.sessions.get(sessionId);

    let pinCredential = existing?.pinCredential;

    if (params.pin) {
        pinCredential = await createOfflinePinCredential(
            params.pin,
            params.pinConfirmation ?? params.pin
        );
    }

    const session: LocalSession = {
        sessionId,
        tenantId: params.tenantId,
        userId: params.userId,
        userName: params.userName,
        userEmail: params.userEmail,
        userRole: params.userRole,
        pinCredential,
        unlockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days local validity
        cachedProfile: params.profile,
    };

    await db.sessions.put(session);
    return session;
}

/**
 * Establish or rotate the offline unlock PIN for a specific user.
 * PIN is 4-6 digits and stored only as a PBKDF2-SHA256 credential.
 */
export async function setOfflinePin(
    tenantId: string,
    userId: number,
    pin: string,
    confirmation?: string
): Promise<boolean> {
    const sessionId = sessionIdFor(tenantId, userId);
    const session = await db.sessions.get(sessionId);
    if (!session) {
        throw new Error('No local session found. Please log in online first.');
    }

    const credential = await createOfflinePinCredential(pin, confirmation ?? pin);

    session.pinCredential = credential;
    // Clear legacy verifier so stale credentials cannot be used.
    session.pinHash = undefined;
    session.salt = undefined;
    session.unlockedAt = new Date().toISOString();
    await db.sessions.put(session);

    return true;
}

/**
 * List local sessions that have a PIN provisioned (for the offline
 * account picker). Expired sessions are excluded.
 */
export async function listProvisionedSessions(tenantId: string): Promise<LocalSession[]> {
    const sessions = await db.sessions.where('tenantId').equals(tenantId).toArray();
    return sessions.filter((s) => (s.pinCredential || s.pinHash) && !isSessionExpired(s));
}

/**
 * Verify the offline PIN for ONE specific user session.
 * The PIN is never compared against every user in a tenant.
 * Lockout is tracked per tenant + user + device.
 */
export async function verifyOfflinePin(
    tenantId: string,
    userId: number,
    pin: string
): Promise<{ success: boolean; session?: LocalSession; error?: string }> {
    const deviceId = getDeviceId();
    const lockoutKey = `${LOCKOUT_PREFIX}${tenantId}_${userId}_${deviceId}`;
    const failedKey = `${FAILED_ATTEMPTS_PREFIX}${tenantId}_${userId}_${deviceId}`;

    // 1. Check Lockout
    const lockoutRecord = await db.settings.get(lockoutKey);
    if (lockoutRecord) {
        const lockoutTime = new Date(lockoutRecord.value).getTime();
        const remaining = lockoutTime + LOCKOUT_MS - Date.now();
        if (remaining > 0) {
            const minutesLeft = Math.ceil(remaining / 60000);
            return {
                success: false,
                error: `Device is temporarily locked out due to multiple failed attempts. Try again in ${minutesLeft} minute(s).`,
            };
        } else {
            await db.settings.delete(lockoutKey);
            await db.settings.delete(failedKey);
        }
    }

    // 2. Fetch the session for THIS user only
    const session = await db.sessions.get(sessionIdFor(tenantId, userId));
    if (!session || (!session.pinCredential && !session.pinHash)) {
        return {
            success: false,
            error: 'No offline PIN has been set up for this account on this device. Log in online once and set your PIN.',
        };
    }

    if (isSessionExpired(session)) {
        return {
            success: false,
            error: 'Your offline session has expired. Please log in online to renew it.',
        };
    }

    // 3. Verify PIN against this user's credential only
    let pinValid = false;
    try {
        if (session.pinCredential) {
            pinValid = await verifyOfflinePinCredential(pin, session.pinCredential);
        } else if (session.pinHash && session.salt) {
            // Legacy migration path for sessions created before PBKDF2 credentials.
            const candidateHash = await hashPinWithSalt(pin, session.salt);
            pinValid = candidateHash === session.pinHash;
        }
    } catch {
        return {
            success: false,
            error: 'Offline PIN credential is invalid. Please set your PIN again while online.',
        };
    }

    if (pinValid) {
        await db.settings.delete(failedKey);
        session.unlockedAt = new Date().toISOString();
        await db.sessions.put(session);

        return { success: true, session };
    }

    // 4. Failed attempt handling & rate limiting
    const failedRecord = await db.settings.get(failedKey);
    const count = (failedRecord?.value || 0) + 1;

    if (count >= MAX_ATTEMPTS) {
        await db.settings.put({
            key: lockoutKey,
            value: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        await db.settings.delete(failedKey);

        return {
            success: false,
            error: `Incorrect PIN. Maximum attempts exceeded. Locked for 5 minutes.`,
        };
    } else {
        await db.settings.put({
            key: failedKey,
            value: count,
            updatedAt: new Date().toISOString(),
        });

        const remainingAttempts = MAX_ATTEMPTS - count;
        return {
            success: false,
            error: `Incorrect PIN. ${remainingAttempts} attempt(s) remaining before lockout.`,
        };
    }
}

/**
 * Get the active unlocked local session for a user (or the most
 * recently unlocked one when userId is omitted).
 */
export async function getActiveOfflineSession(
    tenantId: string,
    userId?: number
): Promise<LocalSession | null> {
    const sessions = await db.sessions.where('tenantId').equals(tenantId).toArray();
    const candidates = sessions.filter((s) => !isSessionExpired(s));
    if (!candidates.length) return null;

    if (userId !== undefined) {
        return candidates.find((s) => s.userId === userId) ?? null;
    }

    return candidates.find((s) => s.unlockedAt) ?? candidates[0];
}

/**
 * Lock a specific user's local offline session (or all tenant
 * sessions when userId is omitted).
 */
export async function lockOfflineSession(tenantId: string, userId?: number): Promise<void> {
    const sessions = await db.sessions.where('tenantId').equals(tenantId).toArray();
    const targets = userId === undefined ? sessions : sessions.filter((s) => s.userId === userId);
    for (const sess of targets) {
        sess.unlockedAt = undefined;
        await db.sessions.put(sess);
    }
}
