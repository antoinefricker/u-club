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
const mockJoin = vi.fn().mockReturnThis();

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
      join: mockJoin,
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
const adminToken = createTestToken('uuid-1', 'admin@example.com', 'admin');

const sampleMember = {
  id: 'member-1',
  userId: null,
  statusId: null,
  firstName: 'John',
  lastName: 'Doe',
  birthdate: null,
  gender: 'male',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
  vi.clearAllMocks();
  mockSelect.mockReturnThis();
  mockWhere.mockReturnThis();
  mockWhereNot.mockReturnThis();
  mockInsert.mockReturnThis();
  mockUpdate.mockReturnThis();
  mockJoin.mockReturnThis();
});

describe('GET /members', () => {
  it('should return a list of members', async () => {
    mockSelect.mockResolvedValueOnce([sampleMember]);

    const res = await request(app)
      .get('/members')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleMember]);
  });
});

describe('GET /members/:id', () => {
  it('should return a member by id', async () => {
    mockFirst.mockResolvedValueOnce(sampleMember);

    const res = await request(app)
      .get('/members/member-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleMember);
  });

  it('should return 404 if member not found', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .get('/members/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'member not found');
  });
});

describe('POST /members', () => {
  it('should return 400 if firstName is missing', async () => {
    const res = await request(app)
      .post('/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lastName: 'Doe', gender: 'male' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 400 if lastName is missing', async () => {
    const res = await request(app)
      .post('/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'John', gender: 'male' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 400 if gender is invalid', async () => {
    const res = await request(app)
      .post('/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'other',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should create a member and return 201', async () => {
    mockReturning.mockResolvedValueOnce([sampleMember]);

    const res = await request(app)
      .post('/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'John', lastName: 'Doe', gender: 'male' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleMember);
  });
});

describe('PUT /members/:id', () => {
  it('should return 400 if no valid fields provided', async () => {
    const res = await request(app)
      .put('/members/member-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 400 if gender is invalid', async () => {
    const res = await request(app)
      .put('/members/member-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ gender: 'other' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 404 if member not found', async () => {
    mockReturning.mockResolvedValueOnce([]);

    const res = await request(app)
      .put('/members/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'member not found');
  });

  it('should update and return the member', async () => {
    const updated = { ...sampleMember, firstName: 'Jane' };
    mockReturning.mockResolvedValueOnce([updated]);

    const res = await request(app)
      .put('/members/member-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Jane' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });
});

describe('DELETE /members/:id', () => {
  it('should return 404 if member not found', async () => {
    mockDel.mockResolvedValueOnce(0);

    const res = await request(app)
      .delete('/members/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'member not found');
  });

  it('should delete and return 204', async () => {
    mockDel.mockResolvedValueOnce(1);

    const res = await request(app)
      .delete('/members/member-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });
});
