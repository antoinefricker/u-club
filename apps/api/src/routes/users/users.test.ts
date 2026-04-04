import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockSelect = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockWhereNot = vi.fn().mockReturnThis();
const mockFirst = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockReturning = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockDel = vi.fn();

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

const sampleUser = {
  id: 'uuid-1',
  displayName: 'johnd',
  bio: null,
  phone: null,
  email: 'john@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reset chaining: each call to db('users') returns a fresh chain
  mockSelect.mockReturnThis();
  mockWhere.mockReturnThis();
  mockWhereNot.mockReturnThis();
  mockInsert.mockReturnThis();
  mockUpdate.mockReturnThis();
});

describe('GET /users', () => {
  it('should return a list of users', async () => {
    mockSelect.mockResolvedValueOnce([sampleUser]);

    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleUser]);
  });
});

describe('GET /users/:id', () => {
  it('should return a user by id', async () => {
    mockFirst.mockResolvedValueOnce(sampleUser);

    const res = await request(app).get('/users/uuid-1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleUser);
  });

  it('should return 404 if user not found', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app).get('/users/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'user not found');
  });
});

describe('POST /users', () => {
  it('should return 400 if displayName is missing', async () => {
    const res = await request(app).post('/users').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'display_name is required');
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ displayName: 'johnd' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'email is required');
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app).post('/users').send({
      displayName: 'johnd',
      email: 'john@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'password is required');
  });

  it('should return 409 if email already exists', async () => {
    mockFirst.mockResolvedValueOnce(sampleUser);

    const res = await request(app).post('/users').send({
      displayName: 'johnd',
      email: 'john@example.com',
      password: 'secret',
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'email already in use');
  });

  it('should create a user and return 201', async () => {
    mockFirst.mockResolvedValueOnce(undefined); // no existing user
    mockReturning.mockResolvedValueOnce([sampleUser]);

    const res = await request(app).post('/users').send({
      displayName: 'johnd',
      email: 'john@example.com',
      password: 'secret',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleUser);
  });
});

describe('PUT /users/:id', () => {
  it('should return 400 if no valid fields provided', async () => {
    const res = await request(app).put('/users/uuid-1').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'no valid fields to update');
  });

  it('should return 409 if updated email already in use', async () => {
    mockFirst.mockResolvedValueOnce(sampleUser); // email taken

    const res = await request(app)
      .put('/users/uuid-2')
      .send({ email: 'john@example.com' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'email already in use');
  });

  it('should return 404 if user not found', async () => {
    mockReturning.mockResolvedValueOnce([]);

    const res = await request(app)
      .put('/users/nonexistent')
      .send({ displayName: 'janed' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'user not found');
  });

  it('should update and return the user', async () => {
    const updated = { ...sampleUser, displayName: 'janed' };
    mockReturning.mockResolvedValueOnce([updated]);

    const res = await request(app)
      .put('/users/uuid-1')
      .send({ displayName: 'janed' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });
});

describe('DELETE /users/:id', () => {
  it('should return 404 if user not found', async () => {
    mockDel.mockResolvedValueOnce(0);

    const res = await request(app).delete('/users/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'user not found');
  });

  it('should delete and return 204', async () => {
    mockDel.mockResolvedValueOnce(1);

    const res = await request(app).delete('/users/uuid-1');

    expect(res.status).toBe(204);
  });
});
