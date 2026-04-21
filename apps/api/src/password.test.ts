import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('hashPassword', () => {
  it('should produce a salt:hash string', async () => {
    const stored = await hashPassword('hunter2');
    const [salt, hash] = stored.split(':');
    expect(salt).toHaveLength(64);
    expect(hash).toHaveLength(128);
  });

  it('should produce a different output for the same password (random salt)', async () => {
    const a = await hashPassword('hunter2');
    const b = await hashPassword('hunter2');
    expect(a).not.toBe(b);
  });
});

describe('verifyPassword', () => {
  it('should return true for the correct password', async () => {
    const stored = await hashPassword('hunter2');
    await expect(verifyPassword('hunter2', stored)).resolves.toBe(true);
  });

  it('should return false for an incorrect password', async () => {
    const stored = await hashPassword('hunter2');
    await expect(verifyPassword('wrong-password', stored)).resolves.toBe(false);
  });

  it('should return false when the password case differs', async () => {
    const stored = await hashPassword('Hunter2');
    await expect(verifyPassword('hunter2', stored)).resolves.toBe(false);
  });

  it('should handle unicode and long passwords', async () => {
    const password = '🔐漢字'.repeat(50);
    const stored = await hashPassword(password);
    await expect(verifyPassword(password, stored)).resolves.toBe(true);
    await expect(verifyPassword(password + 'x', stored)).resolves.toBe(false);
  });
});
