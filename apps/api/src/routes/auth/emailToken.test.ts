import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockFirst = vi.fn();
const mockDel = vi.fn().mockResolvedValue(1);

vi.mock('../../db.js', () => {
  const db = Object.assign(
    vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      first: mockFirst,
      del: mockDel,
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

describe('POST /auth/email_token', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('should return 400 if token is missing', async () => {
    const res = await request(app).post('/auth/email_token').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'token is required');
  });

  it('should return 401 if token is invalid or expired', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/auth/email_token')
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
      expires_at: new Date(Date.now() + 60000),
    });
    // Second call: users lookup returns nothing
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/auth/email_token')
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
      expires_at: new Date(Date.now() + 60000),
    });
    // Second call: users lookup
    mockFirst.mockResolvedValueOnce({
      id: 'user-uuid-1',
      email: 'test@example.com',
    });

    const res = await request(app)
      .post('/auth/email_token')
      .send({ token: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(typeof res.body.access_token).toBe('string');
  });
});
