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
});
