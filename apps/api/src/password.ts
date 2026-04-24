import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

export function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = randomBytes(SALT_LENGTH).toString('hex');
        scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const [salt, hash] = stored.split(':');
        scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(timingSafeEqual(Buffer.from(hash, 'hex'), derivedKey));
        });
    });
}
