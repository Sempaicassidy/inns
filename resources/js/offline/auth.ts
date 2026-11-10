/**
 * Secure Device-Based Offline Authentication & PIN Unlock Engine
 * Conforms to Part 9 of Multi-Tenant Offline-First Specification.
 */

import { db, LocalSession } from './database';

const FAILED_ATTEMPTS_PREFIX = 'offline_auth_failed_';
const LOCKOUT_PREFIX = 'offline_auth_lockout_';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * SHA-256 helper with salt using native Web Crypto
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

/**
 * Cache current online authenticated session into Dexie
 */
export async function cacheOnlineSession(params: {
    tenantId: string;
    userId: number;
    userName: string;
    userEmail: string;
    userRole: string;
    profile?: Record<string, any>;
    defaultPin?: string;
}): Promise<LocalSession> {
    const sessionId = `sess_${params.tenantId}_${params.userId}`;
    const existing = await db.sessions.get(sessionId);

    let salt = existing?.salt || generateSalt();
    let pinHash = existing?.pinHash;

    // If default pin provided or none set, use provided pin or default '1234'
    if (params.defaultPin) {
        pinHash = await hashPinWithSalt(params.defaultPin, salt);
    } else if (!pinHash) {
        // Set a default initial 4-digit PIN (1234) for quick first-time offline setup
        pinHash = await hashPinWithSalt('1234', salt);
    }

    const session: LocalSession = {
        sessionId,
        tenantId: params.tenantId,
        userId: params.userId,
        userName: params.userName,
        userEmail: params.userEmail,
        userRole: params.userRole,
        pinHash,
        salt,
        unlockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days local validity
        cachedProfile: params.profile,
    };

    await db.sessions.put(session);
    return session;
}

/**
 * Update or establish a custom 4-6 digit offline unlock PIN
 */
export async function setOfflinePin(tenantId: string, userId: number, pin: string): Promise<boolean> {
    if (!pin || pin.length < 4) {
        throw new Error('Offline PIN must be at least 4 digits.');
    }

    const sessionId = `sess_${tenantId}_${userId}`;
    const session = await db.sessions.get(sessionId);
    if (!session) {
        throw new Error('No local session found. Please log in online first.');
    }

    const salt = generateSalt();
    const pinHash = await hashPinWithSalt(pin, salt);

    session.salt = salt;
    session.pinHash = pinHash;
    session.unlockedAt = new Date().toISOString();
    await db.sessions.put(session);

    return true;
}

/**
 * Verify local PIN and unlock offline session
 */
export async function verifyOfflinePin(
    tenantId: string,
    pin: string
): Promise<{ success: boolean; session?: LocalSession; error?: string }> {
    const lockoutKey = `${LOCKOUT_PREFIX}${tenantId}`;
    const failedKey = `${FAILED_ATTEMPTS_PREFIX}${tenantId}`;

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
            // Expired lockout
            await db.settings.delete(lockoutKey);
            await db.settings.delete(failedKey);
        }
    }

    // 2. Fetch Session for this Tenant
    const sessions = await db.sessions.where('tenantId').equals(tenantId).toArray();
    if (!sessions.length) {
        return {
            success: false,
            error: 'No cached authorized accounts found for this property. Log in online once before working offline.',
        };
    }

    // Check PIN across matching sessions
    for (const session of sessions) {
        if (!session.pinHash || !session.salt) continue;

        const candidateHash = await hashPinWithSalt(pin, session.salt);
        if (candidateHash === session.pinHash) {
            // Success! Reset failed attempts
            await db.settings.delete(failedKey);
            session.unlockedAt = new Date().toISOString();
            await db.sessions.put(session);

            return {
                success: true,
                session,
            };
        }
    }

    // 3. Failed attempt handling & rate limiting
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
 * Get active unlocked local session
 */
export async function getActiveOfflineSession(tenantId: string): Promise<LocalSession | null> {
    const sessions = await db.sessions.where('tenantId').equals(tenantId).toArray();
    if (!sessions.length) return null;

    // Check expiry
    const session = sessions[0];
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
        return null;
    }

    return session;
}

/**
 * Lock local offline session
 */
export async function lockOfflineSession(tenantId: string): Promise<void> {
    const sessions = await db.sessions.where('tenantId').equals(tenantId).toArray();
    for (const sess of sessions) {
        sess.unlockedAt = undefined;
        await db.sessions.put(sess);
    }
}
