// resources/js/offline/offline-pin.ts

export interface OfflinePinCredential {
    version: 1;
    algorithm: 'PBKDF2-SHA256';
    iterations: number;
    salt: string;
    hash: string;
}

const PIN_ITERATIONS = 310_000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 256;

function validatePin(pin: string): void {
    if (!/^\d{4,6}$/.test(pin)) {
        throw new Error('PIN lazima iwe na tarakimu 4 hadi 6.');
    }

    if (!globalThis.crypto?.subtle) {
        throw new Error(
            'Secure cryptography haipatikani. Fungua mfumo kupitia HTTPS.'
        );
    }
}

function toBase64(bytes: Uint8Array): string {
    let binary = '';

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

async function derivePinHash(
    pin: string,
    salt: Uint8Array,
    iterations: number
): Promise<Uint8Array> {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(pin),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
            iterations,
            hash: 'SHA-256',
        },
        keyMaterial,
        HASH_LENGTH
    );

    return new Uint8Array(derivedBits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let difference = 0;

    for (let i = 0; i < a.length; i++) {
        difference |= a[i] ^ b[i];
    }

    return difference === 0;
}

/**
 * Tengeneza credential ya PIN mpya.
 * PIN yenyewe haihifadhiwi; kinachorudishwa ni salt na hash.
 */
export async function createOfflinePinCredential(
    pin: string,
    confirmation: string
): Promise<OfflinePinCredential> {
    validatePin(pin);

    if (pin !== confirmation) {
        throw new Error('PIN na uthibitisho wake havifanani.');
    }

    const salt = crypto.getRandomValues(
        new Uint8Array(SALT_LENGTH)
    );

    const hash = await derivePinHash(
        pin,
        salt,
        PIN_ITERATIONS
    );

    return {
        version: 1,
        algorithm: 'PBKDF2-SHA256',
        iterations: PIN_ITERATIONS,
        salt: toBase64(salt),
        hash: toBase64(hash),
    };
}

/**
 * Hakiki PIN dhidi ya credential ya mtumiaji aliyechaguliwa.
 */
export async function verifyOfflinePinCredential(
    pin: string,
    credential: OfflinePinCredential
): Promise<boolean> {
    validatePin(pin);

    if (
        credential.version !== 1 ||
        credential.algorithm !== 'PBKDF2-SHA256' ||
        !Number.isInteger(credential.iterations) ||
        credential.iterations < 100_000 ||
        credential.iterations > 1_000_000
    ) {
        throw new Error('Offline PIN credential si sahihi.');
    }

    const salt = fromBase64(credential.salt);
    const expectedHash = fromBase64(credential.hash);

    if (
        salt.length !== SALT_LENGTH ||
        expectedHash.length !== HASH_LENGTH / 8
    ) {
        throw new Error('Offline PIN credential imeharibika.');
    }

    const actualHash = await derivePinHash(
        pin,
        salt,
        credential.iterations
    );

    return constantTimeEqual(actualHash, expectedHash);
}
