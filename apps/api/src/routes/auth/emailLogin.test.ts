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

describe('POST /auth/email_login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app).post('/auth/email_login').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return success without sending email if user does not exist', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/auth/email_login')
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
      .post('/auth/email_login')
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
});
