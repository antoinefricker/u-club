import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockFirst = vi.fn();
const mockVerifyPassword = vi.fn();

vi.mock('../../db.js', () => {
    const db = Object.assign(
        vi.fn(() => ({
            where: vi.fn().mockReturnThis(),
            first: mockFirst,
        })),
        { raw: vi.fn() },
    );
    return { default: db };
});

vi.mock('../../password.js', () => ({
    hashPassword: vi.fn().mockResolvedValue('hashed:password'),
    verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));

vi.mock('../../mailer.js', () => ({
    default: { sendMail: vi.fn().mockResolvedValue({}) },
}));

const { default: app } = await import('../../app.js');

describe('POST /auth/login', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
        vi.clearAllMocks();
    });

    it('should return 400 if email is missing', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ password: 'secret' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 400 if password is missing', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'john@example.com' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 401 if user not found', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'unknown@example.com', password: 'secret' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'invalid email or password');
    });

    it('should return 401 if password is wrong', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'uuid-1',
            email: 'john@example.com',
            password: 'hashed:password',
        });
        mockVerifyPassword.mockResolvedValueOnce(false);

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'john@example.com', password: 'wrong' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'invalid email or password');
    });

    it('should return 403 if email is not verified', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'uuid-1',
            email: 'john@example.com',
            password: 'hashed:password',
            emailVerifiedAt: null,
        });
        mockVerifyPassword.mockResolvedValueOnce(true);

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'john@example.com', password: 'secret' });

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('error', 'email not verified');
    });

    it('should return a JWT for valid credentials', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'uuid-1',
            email: 'john@example.com',
            password: 'hashed:password',
            emailVerifiedAt: '2026-01-01T00:00:00.000Z',
        });
        mockVerifyPassword.mockResolvedValueOnce(true);

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'john@example.com', password: 'secret' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(typeof res.body.accessToken).toBe('string');
    });

    it('should return 500 if JWT_SECRET is not set', async () => {
        delete process.env.JWT_SECRET;
        mockFirst.mockResolvedValueOnce({
            id: 'uuid-1',
            email: 'john@example.com',
            password: 'hashed:password',
            emailVerifiedAt: '2026-01-01T00:00:00.000Z',
        });
        mockVerifyPassword.mockResolvedValueOnce(true);

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'john@example.com', password: 'secret' });

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'server configuration error');
    });
});
