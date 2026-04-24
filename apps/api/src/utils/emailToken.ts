import crypto from 'node:crypto';

export function createEmailToken(ttlMs: number): { token: string; expiresAt: Date } {
    return {
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + ttlMs),
    };
}
