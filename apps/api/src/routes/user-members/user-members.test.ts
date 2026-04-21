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
const mockThen = vi.fn();

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
      then: mockThen,
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
const adminToken = createTestToken('uuid-admin', 'admin@example.com', 'admin');
const userToken = createTestToken('uuid-1', 'user@example.com', 'user');

const sampleUserMember = {
  id: 'um-1',
  userId: 'uuid-1',
  memberId: 'member-1',
  type: 'self',
  description: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
  vi.resetAllMocks();
  mockSelect.mockReturnThis();
  mockWhere.mockReturnThis();
  mockWhereNot.mockReturnThis();
  mockInsert.mockReturnThis();
  mockUpdate.mockReturnThis();
  mockJoin.mockReturnThis();
});

describe('GET /user-members', () => {
  it('should return all user-members for admin (200)', async () => {
    mockThen.mockImplementationOnce((resolve: (value: unknown) => void) =>
      resolve([sampleUserMember]),
    );

    const res = await request(app)
      .get('/user-members')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleUserMember]);
  });

  it('should return only own records for regular user (200)', async () => {
    mockThen.mockImplementationOnce((resolve: (value: unknown) => void) =>
      resolve([sampleUserMember]),
    );

    const res = await request(app)
      .get('/user-members')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleUserMember]);
    expect(mockWhere).toHaveBeenCalledWith('userMembers.userId', 'uuid-1');
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await request(app).get('/user-members');

    expect(res.status).toBe(401);
  });
});

describe('POST /user-members', () => {
  it('should create a user-member and return 201', async () => {
    mockFirst.mockResolvedValueOnce(undefined);
    mockReturning.mockResolvedValueOnce([sampleUserMember]);

    const res = await request(app)
      .post('/user-members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: 'uuid-1',
        memberId: 'member-1',
        type: 'self',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleUserMember);
  });

  it('should allow regular user to create for self', async () => {
    mockFirst.mockResolvedValueOnce(undefined);
    mockReturning.mockResolvedValueOnce([sampleUserMember]);

    const res = await request(app)
      .post('/user-members')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userId: 'uuid-1',
        memberId: 'member-1',
        type: 'self',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleUserMember);
  });

  it('should return 403 when regular user creates for another user', async () => {
    const res = await request(app)
      .post('/user-members')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userId: 'uuid-other',
        memberId: 'member-1',
        type: 'self',
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty(
      'error',
      'not allowed to create for another user',
    );
  });

  it('should return 409 when duplicate (userId, memberId) pair', async () => {
    mockFirst.mockResolvedValueOnce(sampleUserMember);

    const res = await request(app)
      .post('/user-members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: 'uuid-1',
        memberId: 'member-1',
        type: 'self',
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'association already exists');
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/user-members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: 'uuid-1' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });
});

describe('PUT /user-members/:id', () => {
  it('should update and return 200 when owner updates', async () => {
    const updated = { ...sampleUserMember, type: 'relative' };
    mockFirst.mockResolvedValueOnce({ ...sampleUserMember, userId: 'uuid-1' });
    mockReturning.mockResolvedValueOnce([updated]);

    const res = await request(app)
      .put('/user-members/um-1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'relative' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('should return 404 when user-member not found', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .put('/user-members/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'relative' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty(
      'error',
      'user-member association not found',
    );
  });

  it('should return 403 when non-owner regular user updates', async () => {
    mockFirst.mockResolvedValueOnce({
      ...sampleUserMember,
      userId: 'uuid-other',
    });

    const res = await request(app)
      .put('/user-members/um-1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'relative' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty(
      'error',
      'not allowed to update this association',
    );
  });

  it('should return 400 when body is empty', async () => {
    const res = await request(app)
      .put('/user-members/um-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });
});

describe('DELETE /user-members/:id', () => {
  it('should delete and return 204 when owner deletes', async () => {
    mockFirst.mockResolvedValueOnce({ ...sampleUserMember, userId: 'uuid-1' });
    mockDel.mockResolvedValueOnce(1);

    const res = await request(app)
      .delete('/user-members/um-1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(204);
  });

  it('should return 404 when user-member not found', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .delete('/user-members/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty(
      'error',
      'user-member association not found',
    );
  });

  it('should return 403 when non-owner regular user deletes', async () => {
    mockFirst.mockResolvedValueOnce({
      ...sampleUserMember,
      userId: 'uuid-other',
    });

    const res = await request(app)
      .delete('/user-members/um-1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty(
      'error',
      'not allowed to delete this association',
    );
  });
});
