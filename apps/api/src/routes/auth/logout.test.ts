import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const mockInsert = vi.fn().mockResolvedValue([1]);

vi.mock('../../db.js', () => {
  const db = Object.assign(
    vi.fn(() => ({
      insert: mockInsert,
    })),
    { raw: vi.fn() },
  );
  return { default: db };
});

vi.mock('../../password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed:password'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../mailer.js', () => ({
  default: { sendMail: vi.fn().mockResolvedValue({}) },
}));

const { default: app } = await import('../../app.js');

describe('POST /auth/logout', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('should return 401 if authorization header is missing', async () => {
    const res = await request(app).post('/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'missing authorization header');
  });

  it('should return 401 if authorization header is not Bearer', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', 'Basic abc');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'missing authorization header');
  });

  it('should return 401 if token is invalid', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'invalid token');
  });

  it('should revoke a valid token and return success', async () => {
    const token = jwt.sign(
      { sub: 'uuid-1', email: 'john@example.com' },
      'test-secret',
      { expiresIn: '7d' },
    );

    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'logged out');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        token,
        expiresAt: expect.any(Date),
      }),
    );
  });

  it('should return 500 if JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET;

    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', 'Bearer some-token');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'server configuration error');
  });
});
