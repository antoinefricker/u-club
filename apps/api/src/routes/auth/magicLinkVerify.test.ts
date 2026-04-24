import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockFirst = vi.fn();
const mockDel = vi.fn().mockResolvedValue(1);

const mockUpdate = vi.fn().mockResolvedValue(1);

vi.mock('../../db.js', () => {
    const db = Object.assign(
        vi.fn(() => ({
            where: vi.fn().mockReturnThis(),
            first: mockFirst,
            del: mockDel,
            update: mockUpdate,
        })),
        { raw: vi.fn() },
    );
    return { default: db };
});

vi.mock('../../mailer.js', () => ({
    default: { sendMail: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../password.js', () => ({
    hashPassword: vi.fn().mockResolvedValue('hashed:password'),
    verifyPassword: vi.fn().mockResolvedValue(true),
}));

const { default: app } = await import('../../app.js');

describe('POST /auth/magic_link_verify', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
        vi.clearAllMocks();
    });

    it('should return 400 if token is missing', async () => {
        const res = await request(app).post('/auth/magic_link_verify').send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'token is required');
    });

    it('should return 401 if token is invalid or expired', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app)
            .post('/auth/magic_link_verify')
            .send({ token: 'invalid-token' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'invalid or expired token');
    });

    it('should return 401 if user no longer exists', async () => {
        // First call: login_tokens lookup returns a valid token
        mockFirst.mockResolvedValueOnce({
            id: '123',
            email: 'deleted@example.com',
            token: 'valid-token',
            expiresAt: new Date(Date.now() + 60000),
        });
        // Second call: users lookup returns nothing
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app)
            .post('/auth/magic_link_verify')
            .send({ token: 'valid-token' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'user not found');
    });

    it('should return a JWT with sub and email for a valid token', async () => {
        // First call: login_tokens lookup
        mockFirst.mockResolvedValueOnce({
            id: '123',
            email: 'test@example.com',
            token: 'valid-token',
            expiresAt: new Date(Date.now() + 60000),
        });
        // Second call: users lookup
        mockFirst.mockResolvedValueOnce({
            id: 'user-uuid-1',
            email: 'test@example.com',
            emailVerifiedAt: null,
        });

        const res = await request(app)
            .post('/auth/magic_link_verify')
            .send({ token: 'valid-token' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(typeof res.body.accessToken).toBe('string');
    });

    it('should delete the token after successful verification (single-use)', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'tok-1',
            email: 'test@example.com',
            token: 'valid-token',
            expiresAt: new Date(Date.now() + 60000),
        });
        mockFirst.mockResolvedValueOnce({
            id: 'user-1',
            email: 'test@example.com',
            role: 'user',
            emailVerifiedAt: new Date('2026-01-01'),
        });

        await request(app)
            .post('/auth/magic_link_verify')
            .send({ token: 'valid-token' });

        expect(mockDel).toHaveBeenCalledTimes(1);
    });

    it('should mark emailVerifiedAt when verifying an unverified user', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'tok-1',
            email: 'test@example.com',
            expiresAt: new Date(Date.now() + 60000),
        });
        mockFirst.mockResolvedValueOnce({
            id: 'user-1',
            email: 'test@example.com',
            role: 'user',
            emailVerifiedAt: null,
        });

        await request(app)
            .post('/auth/magic_link_verify')
            .send({ token: 'valid-token' });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ emailVerifiedAt: expect.any(Date) }),
        );
    });

    it('should NOT update emailVerifiedAt for an already-verified user', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'tok-1',
            email: 'test@example.com',
            expiresAt: new Date(Date.now() + 60000),
        });
        mockFirst.mockResolvedValueOnce({
            id: 'user-1',
            email: 'test@example.com',
            role: 'user',
            emailVerifiedAt: new Date('2026-01-01'),
        });

        await request(app)
            .post('/auth/magic_link_verify')
            .send({ token: 'valid-token' });

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should return 500 when JWT_SECRET is not configured', async () => {
        delete process.env.JWT_SECRET;
        mockFirst.mockResolvedValueOnce({
            id: 'tok-1',
            email: 'test@example.com',
            expiresAt: new Date(Date.now() + 60000),
        });
        mockFirst.mockResolvedValueOnce({
            id: 'user-1',
            email: 'test@example.com',
            role: 'user',
            emailVerifiedAt: new Date('2026-01-01'),
        });

        const res = await request(app)
            .post('/auth/magic_link_verify')
            .send({ token: 'valid-token' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'server configuration error');
    });
});
