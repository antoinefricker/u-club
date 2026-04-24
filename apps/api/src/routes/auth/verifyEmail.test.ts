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

describe('POST /auth/verify_email', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
        vi.clearAllMocks();
    });

    it('should return 400 if token is missing', async () => {
        const res = await request(app).post('/auth/verify_email').send({ email: 'test@example.com' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 400 if email is missing', async () => {
        const res = await request(app).post('/auth/verify_email').send({ token: 'valid-token' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 401 if token is invalid or expired', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app)
            .post('/auth/verify_email')
            .send({ token: 'invalid-token', email: 'test@example.com' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'invalid or expired token');
    });

    it('should return 401 if user not found', async () => {
        mockFirst.mockResolvedValueOnce({
            id: '123',
            email: 'deleted@example.com',
            token: 'valid-token',
            type: 'confirmation',
            expiresAt: new Date(Date.now() + 60000),
        });
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app)
            .post('/auth/verify_email')
            .send({ token: 'valid-token', email: 'deleted@example.com' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'user not found');
    });

    it('should confirm email and return a JWT for a valid token', async () => {
        mockFirst.mockResolvedValueOnce({
            id: '123',
            email: 'test@example.com',
            token: 'valid-token',
            type: 'confirmation',
            expiresAt: new Date(Date.now() + 60000),
        });
        mockFirst.mockResolvedValueOnce({
            id: 'user-uuid-1',
            email: 'test@example.com',
            emailVerifiedAt: null,
        });

        const res = await request(app)
            .post('/auth/verify_email')
            .send({ token: 'valid-token', email: 'test@example.com' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(typeof res.body.accessToken).toBe('string');
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockDel).toHaveBeenCalled();
    });
});
