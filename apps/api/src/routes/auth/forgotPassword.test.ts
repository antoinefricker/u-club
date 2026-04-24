import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockFirst = vi.fn();
const mockDel = vi.fn().mockResolvedValue(1);
const mockInsert = vi.fn().mockResolvedValue([1]);
const mockSendMail = vi.fn().mockResolvedValue({});

vi.mock('../../db.js', () => {
    const db = Object.assign(
        vi.fn(() => ({
            where: vi.fn().mockReturnThis(),
            first: mockFirst,
            del: mockDel,
            insert: mockInsert,
        })),
        { raw: vi.fn() },
    );
    return { default: db };
});

vi.mock('../../mailer.js', () => ({
    default: { sendMail: mockSendMail },
}));

const { default: app } = await import('../../app.js');

describe('POST /auth/forgot_password', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
        vi.clearAllMocks();
    });

    it('should return 400 if email is missing', async () => {
        const res = await request(app).post('/auth/forgot_password').send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 200 if user not found (silent, no email sent)', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app)
            .post('/auth/forgot_password')
            .send({ email: 'nobody@example.com' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'password reset email sent');
        expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should return 200 and send email if user found', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'user-uuid-1',
            email: 'test@example.com',
        });

        const res = await request(app)
            .post('/auth/forgot_password')
            .send({ email: 'test@example.com' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'password reset email sent');
        expect(mockSendMail).toHaveBeenCalled();
        expect(mockInsert).toHaveBeenCalled();
    });

    it('should delete existing password_reset tokens before creating a new one', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'u1',
            email: 'test@example.com',
        });

        await request(app)
            .post('/auth/forgot_password')
            .send({ email: 'test@example.com' });

        expect(mockDel).toHaveBeenCalledTimes(1);
        expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'test@example.com',
                type: 'password_reset',
            }),
        );
    });

    it('should insert a 64-hex-char token with ~1h expiry', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'u1',
            email: 'test@example.com',
        });

        const before = Date.now();
        await request(app)
            .post('/auth/forgot_password')
            .send({ email: 'test@example.com' });
        const after = Date.now();

        const insertArg = mockInsert.mock.calls[0][0];
        expect(insertArg.token).toMatch(/^[a-f0-9]{64}$/);
        const expiresMs = new Date(insertArg.expiresAt).getTime();
        expect(expiresMs).toBeGreaterThanOrEqual(before + 60 * 60 * 1000);
        expect(expiresMs).toBeLessThanOrEqual(after + 60 * 60 * 1000);
    });

    it('should URL-encode the email in the reset link', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'u1',
            email: 'user+alias@example.com',
        });

        await request(app)
            .post('/auth/forgot_password')
            .send({ email: 'user+alias@example.com' });

        const mailArg = mockSendMail.mock.calls[0][0];
        expect(mailArg.to).toBe('user+alias@example.com');
        expect(mailArg.text).toContain('email=user%2Balias%40example.com');
    });
});
