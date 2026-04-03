import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../db.js', () => {
  const insert = vi.fn().mockResolvedValue([1]);
  const db = Object.assign(
    vi.fn(() => ({ insert })),
    {
      raw: vi.fn(),
    },
  );
  return { default: db };
});

vi.mock('../mailer.js', () => ({
  default: {
    sendMail: vi.fn().mockResolvedValue({}),
  },
}));

const { default: app } = await import('../app.js');
const { default: mailer } = await import('../mailer.js');

describe('POST /auth/email_login', () => {
  it('should return 400 if email is missing', async () => {
    const res = await request(app).post('/auth/email_login').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'email is required');
  });

  it('should send a login email and return success', async () => {
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
