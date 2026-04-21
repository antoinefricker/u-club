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

vi.mock('../../password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed:password'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

const { default: app } = await import('../../app.js');

describe('POST /auth/verify_email_resend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app).post('/auth/verify_email_resend').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 200 silently if user does not exist', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/auth/verify_email_resend')
      .send({ email: 'unknown@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'verification email sent');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should return 200 silently if user is already verified', async () => {
    mockFirst.mockResolvedValueOnce({
      id: 'uuid-1',
      email: 'verified@example.com',
      emailVerifiedAt: '2026-01-01T00:00:00.000Z',
    });

    const res = await request(app)
      .post('/auth/verify_email_resend')
      .send({ email: 'verified@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'verification email sent');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should send confirmation email for unverified user', async () => {
    mockFirst.mockResolvedValueOnce({
      id: 'uuid-1',
      email: 'unverified@example.com',
      emailVerifiedAt: null,
    });

    const res = await request(app)
      .post('/auth/verify_email_resend')
      .send({ email: 'unverified@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'verification email sent');
    expect(mockDel).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'unverified@example.com',
        subject: 'Verify your email',
      }),
    );
  });
});
