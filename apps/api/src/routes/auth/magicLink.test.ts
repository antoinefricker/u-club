import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockFirst = vi.fn();
const mockInsert = vi.fn().mockResolvedValue([1]);

vi.mock('../../db.js', () => {
    const db = Object.assign(
        vi.fn(() => ({
            where: vi.fn().mockReturnThis(),
            first: mockFirst,
            insert: mockInsert,
        })),
        { raw: vi.fn() },
    );
    return { default: db };
});

vi.mock('../../mailer.js', () => ({
    default: {
        sendMail: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('../../password.js', () => ({
    hashPassword: vi.fn().mockResolvedValue('hashed:password'),
    verifyPassword: vi.fn().mockResolvedValue(true),
}));

const { default: app } = await import('../../app.js');
const { default: mailer } = await import('../../mailer.js');

describe('POST /auth/magic_link', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if email is missing', async () => {
        const res = await request(app).post('/auth/magic_link').send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return success without sending email if user does not exist', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app)
            .post('/auth/magic_link')
            .send({ email: 'unknown@example.com' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'login email sent');
        expect(mailer.sendMail).not.toHaveBeenCalled();
    });

    it('should send a login email for an existing user', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'uuid-1',
            email: 'test@example.com',
        });

        const res = await request(app)
            .post('/auth/magic_link')
            .send({ email: 'test@example.com' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'login email sent');
        expect(mailer.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'test@example.com',
                subject: 'Your login code',
            }),
        );
    });

    it('should insert a 64-hex-char token with ~15 min expiry', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'uuid-1',
            email: 'test@example.com',
        });

        const before = Date.now();
        await request(app)
            .post('/auth/magic_link')
            .send({ email: 'test@example.com' });
        const after = Date.now();

        const insertArg = mockInsert.mock.calls[0][0];
        expect(insertArg.token).toMatch(/^[a-f0-9]{64}$/);
        expect(insertArg.email).toBe('test@example.com');
        const expiresMs = new Date(insertArg.expiresAt).getTime();
        expect(expiresMs).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
        expect(expiresMs).toBeLessThanOrEqual(after + 15 * 60 * 1000);
    });

    it('should include the generated token in the email body', async () => {
        mockFirst.mockResolvedValueOnce({
            id: 'uuid-1',
            email: 'test@example.com',
        });

        await request(app)
            .post('/auth/magic_link')
            .send({ email: 'test@example.com' });

        const insertArg = mockInsert.mock.calls[0][0];
        const mailArg = (mailer.sendMail as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
        expect(mailArg.text).toContain(insertArg.token);
    });

    it('should not send email when email field is an empty string', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app)
            .post('/auth/magic_link')
            .send({ email: '' });

        expect(res.status).toBe(200);
        expect(mailer.sendMail).not.toHaveBeenCalled();
    });
});
