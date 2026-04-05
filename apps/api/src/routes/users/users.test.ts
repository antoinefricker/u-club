import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestToken } from '../../test-utils.js';

const mockSelect = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockWhereNot = vi.fn().mockReturnThis();
const mockFirst = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockReturning = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockDel = vi.fn();
const mockCount = vi.fn().mockReturnThis();

vi.mock('../../db.js', () => {
  const db = Object.assign(
    vi.fn(() => ({
      select: mockSelect,
      where: mockWhere,
      whereNot: mockWhereNot,
      first: mockFirst,
      insert: mockInsert,
      returning: mockReturning,
      update: mockUpdate,
      del: mockDel,
      count: mockCount,
    })),
    { raw: vi.fn() },
  );
  return { default: db };
});

vi.mock('../../password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed:password'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

const mockSendMail = vi.fn().mockResolvedValue({});

vi.mock('../../mailer.js', () => ({
  default: { sendMail: mockSendMail },
}));

const { default: app } = await import('../../app.js');

const sampleUser = {
  id: 'uuid-1',
  displayName: 'johnd',
  bio: null,
  phone: null,
  email: 'john@example.com',
  role: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const adminToken = createTestToken('uuid-1', 'admin@example.com', 'admin');
const selfToken = createTestToken('uuid-1', 'john@example.com', 'user');

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
  vi.clearAllMocks();
  // Reset chaining: each call to db('users') returns a fresh chain
  mockSelect.mockReturnThis();
  mockWhere.mockReturnThis();
  mockWhereNot.mockReturnThis();
  mockInsert.mockReturnThis();
  mockUpdate.mockReturnThis();
  mockCount.mockReturnThis();
});

describe('GET /users', () => {
  it('should return a list of users', async () => {
    mockSelect.mockResolvedValueOnce([sampleUser]);

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleUser]);
  });
});

describe('GET /users/:id', () => {
  it('should return a user by id', async () => {
    mockFirst.mockResolvedValueOnce(sampleUser);

    const res = await request(app)
      .get('/users/uuid-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleUser);
  });

  it('should return 404 if user not found', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .get('/users/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'user not found');
  });
});

describe('POST /users', () => {
  it('should return 400 if displayName is missing', async () => {
    const res = await request(app).post('/users').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ displayName: 'johnd' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app).post('/users').send({
      displayName: 'johnd',
      email: 'john@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 409 if email already exists', async () => {
    mockFirst.mockResolvedValueOnce(sampleUser); // email check

    const res = await request(app).post('/users').send({
      displayName: 'johnd',
      email: 'john@example.com',
      password: 'secret',
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'email already in use');
  });

  it('should create a user and return 201', async () => {
    mockFirst.mockResolvedValueOnce(undefined); // no existing email
    mockFirst.mockResolvedValueOnce({ count: 1 }); // count query (not first user)
    mockReturning.mockResolvedValueOnce([sampleUser]);

    const res = await request(app).post('/users').send({
      displayName: 'johnd',
      email: 'john@example.com',
      password: 'secret',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleUser);
  });

  it('should send confirmation email after creation', async () => {
    mockFirst.mockResolvedValueOnce(undefined); // no existing email
    mockFirst.mockResolvedValueOnce({ count: 1 }); // count query
    mockReturning.mockResolvedValueOnce([sampleUser]);

    await request(app).post('/users').send({
      display_name: 'johnd',
      email: 'john@example.com',
      password: 'secret',
    });

    expect(mockInsert).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
        subject: 'Confirm your email',
      }),
    );
  });
});

describe('PUT /users/:id', () => {
  it('should return 400 if no valid fields provided', async () => {
    const res = await request(app)
      .put('/users/uuid-1')
      .set('Authorization', `Bearer ${selfToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 409 if updated email already in use', async () => {
    mockFirst.mockResolvedValueOnce(sampleUser); // email taken

    const res = await request(app)
      .put('/users/uuid-2')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'john@example.com' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'email already in use');
  });

  it('should return 404 if user not found', async () => {
    mockReturning.mockResolvedValueOnce([]);

    const res = await request(app)
      .put('/users/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ displayName: 'janed' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'user not found');
  });

  it('should update and return the user', async () => {
    const updated = { ...sampleUser, displayName: 'janed' };
    mockReturning.mockResolvedValueOnce([updated]);

    const res = await request(app)
      .put('/users/uuid-1')
      .set('Authorization', `Bearer ${selfToken}`)
      .send({ displayName: 'janed' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });
});

describe('DELETE /users/:id', () => {
  it('should return 404 if user not found', async () => {
    mockDel.mockResolvedValueOnce(0);

    const res = await request(app)
      .delete('/users/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'user not found');
  });

  it('should delete and return 204', async () => {
    mockDel.mockResolvedValueOnce(1);

    const res = await request(app)
      .delete('/users/uuid-1')
      .set('Authorization', `Bearer ${selfToken}`);

    expect(res.status).toBe(204);
  });
});
