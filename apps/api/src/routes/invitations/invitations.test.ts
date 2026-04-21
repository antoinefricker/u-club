import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestToken } from '../../test-utils.js';

const mockSelect = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockWhereNull = vi.fn().mockReturnThis();
const mockFirst = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockReturning = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockDel = vi.fn();
const mockJoin = vi.fn().mockReturnThis();
const mockSendMail = vi.fn().mockResolvedValue({});

const mockTrxInsert = vi.fn().mockResolvedValue([]);
const mockTrxUpdate = vi.fn().mockResolvedValue(1);
const mockTrxWhere = vi.fn().mockReturnThis();

vi.mock('../../db.js', () => {
  const db = Object.assign(
    vi.fn(() => ({
      select: mockSelect,
      where: mockWhere,
      whereNull: mockWhereNull,
      first: mockFirst,
      insert: mockInsert,
      returning: mockReturning,
      update: mockUpdate,
      del: mockDel,
      join: mockJoin,
    })),
    {
      raw: vi.fn(),
      transaction: vi.fn(async (cb: (trx: unknown) => Promise<void>) => {
        const trx = vi.fn(() => ({
          insert: mockTrxInsert,
          where: mockTrxWhere,
          update: mockTrxUpdate,
        }));
        await cb(trx);
      }),
    },
  );
  return { default: db };
});

vi.mock('../../password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed:password'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../mailer.js', () => ({
  default: { sendMail: mockSendMail },
}));

const { default: app } = await import('../../app.js');
const adminToken = createTestToken('uuid-admin', 'admin@test.com', 'admin');
const userToken = createTestToken('uuid-1', 'user@test.com', 'user');

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
  vi.clearAllMocks();
  mockSelect.mockReturnThis();
  mockWhere.mockReturnThis();
  mockWhereNull.mockReturnThis();
  mockInsert.mockReturnThis();
  mockUpdate.mockReturnThis();
  mockJoin.mockReturnThis();
  mockTrxWhere.mockReturnThis();
});

describe('POST /invitations', () => {
  const validBody = {
    memberId: 'member-1',
    email: 'invited@test.com',
    type: 'self',
  };

  it('should return 201 when admin invites for any member', async () => {
    mockInsert.mockResolvedValueOnce([]);

    const res = await request(app)
      .post('/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: 'invitation sent' });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('should return 403 when regular user is not linked to member', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/invitations')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'not linked to this member');
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'invited@test.com' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });
});

describe('GET /invitations', () => {
  it('should return 200 with pending invitations for current user email', async () => {
    const invitations = [
      {
        id: 'inv-1',
        memberId: 'member-1',
        email: 'user@test.com',
        type: 'self',
      },
    ];
    // First call: db('users').where({ id }).first() -> user record
    mockFirst.mockResolvedValueOnce({ id: 'uuid-1', email: 'user@test.com' });
    // Second call: the chained query -> invitations list
    mockSelect.mockResolvedValueOnce(invitations);

    const res = await request(app)
      .get('/invitations')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(invitations);
  });
});

describe('GET /invitations/sent', () => {
  it('should return 200 with invitations sent by current user', async () => {
    const invitations = [
      {
        id: 'inv-1',
        memberId: 'member-1',
        invitedBy: 'uuid-1',
        email: 'someone@test.com',
      },
    ];
    mockSelect.mockResolvedValueOnce(invitations);

    const res = await request(app)
      .get('/invitations/sent')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(invitations);
  });
});

describe('POST /invitations/:id/accept', () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString();
  const pastDate = new Date(Date.now() - 86400000).toISOString();

  it('should return 200 on successful accept', async () => {
    // First call: db('memberInvitations').where({ id }).first() -> invitation
    mockFirst.mockResolvedValueOnce({
      id: 'inv-1',
      memberId: 'member-1',
      email: 'user@test.com',
      type: 'self',
      description: null,
      acceptedAt: null,
      expiresAt: futureDate,
    });
    // Second call: db('users').where({ id: user.id }).first() -> user
    mockFirst.mockResolvedValueOnce({ id: 'uuid-1', email: 'user@test.com' });

    const res = await request(app)
      .post('/invitations/inv-1/accept')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'invitation accepted' });
  });

  it('should return 404 if invitation not found', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/invitations/nonexistent/accept')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'invitation not found');
  });

  it('should return 400 if already accepted', async () => {
    mockFirst.mockResolvedValueOnce({
      id: 'inv-1',
      acceptedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: futureDate,
      email: 'user@test.com',
    });

    const res = await request(app)
      .post('/invitations/inv-1/accept')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'invitation already accepted');
  });

  it('should return 400 if invitation has expired', async () => {
    mockFirst.mockResolvedValueOnce({
      id: 'inv-1',
      acceptedAt: null,
      expiresAt: pastDate,
      email: 'user@test.com',
    });

    const res = await request(app)
      .post('/invitations/inv-1/accept')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'invitation has expired');
  });

  it('should return 403 if email does not match', async () => {
    mockFirst.mockResolvedValueOnce({
      id: 'inv-1',
      acceptedAt: null,
      expiresAt: futureDate,
      email: 'other@test.com',
    });
    mockFirst.mockResolvedValueOnce({
      id: 'uuid-1',
      email: 'user@test.com',
    });

    const res = await request(app)
      .post('/invitations/inv-1/accept')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'email does not match invitation');
  });
});

describe('DELETE /invitations/:id', () => {
  it('should return 204 when sender deletes their invitation', async () => {
    mockFirst.mockResolvedValueOnce({
      id: 'inv-1',
      invitedBy: 'uuid-1',
    });
    mockDel.mockResolvedValueOnce(1);

    const res = await request(app)
      .delete('/invitations/inv-1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(204);
  });

  it('should return 404 if invitation not found', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .delete('/invitations/nonexistent')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'invitation not found');
  });
});
