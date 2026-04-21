import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestToken } from '../../test-utils.js';

const mockSelect = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
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
const adminToken = createTestToken('uuid-1', 'admin@example.com', 'admin');

const sampleTeam = {
  id: 'team-1',
  clubId: 'club-1',
  label: 'U15 Boys',
  gender: 'male',
  description: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
  vi.clearAllMocks();
  mockSelect.mockReturnThis();
  mockWhere.mockReturnThis();
  mockInsert.mockReturnThis();
  mockUpdate.mockReturnThis();
});

describe('GET /teams', () => {
  it('should return a list of teams', async () => {
    mockSelect.mockResolvedValueOnce([sampleTeam]);

    const res = await request(app)
      .get('/teams')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleTeam]);
  });
});

describe('GET /teams/:id', () => {
  it('should return a team by id', async () => {
    mockFirst.mockResolvedValueOnce(sampleTeam);

    const res = await request(app)
      .get('/teams/team-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleTeam);
  });

  it('should return 404 if team not found', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .get('/teams/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'team not found');
  });
});

describe('POST /teams', () => {
  it('should return 400 if clubId is missing', async () => {
    const res = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'U15', gender: 'male' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 400 if label is missing', async () => {
    const res = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clubId: 'club-1', gender: 'male' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 400 if gender is invalid', async () => {
    const res = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clubId: 'club-1', label: 'U15', gender: 'other' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should create a team and return 201', async () => {
    mockReturning.mockResolvedValueOnce([sampleTeam]);

    const res = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        clubId: 'club-1',
        label: 'U15 Boys',
        gender: 'male',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleTeam);
  });
});

describe('PUT /teams/:id', () => {
  it('should return 400 if no valid fields provided', async () => {
    const res = await request(app)
      .put('/teams/team-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should return 404 if team not found', async () => {
    mockReturning.mockResolvedValueOnce([]);

    const res = await request(app)
      .put('/teams/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'U16' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'team not found');
  });

  it('should return 400 if gender is invalid', async () => {
    const res = await request(app)
      .put('/teams/team-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ gender: 'other' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('should update and return the team', async () => {
    const updated = { ...sampleTeam, label: 'U16 Boys' };
    mockReturning.mockResolvedValueOnce([updated]);

    const res = await request(app)
      .put('/teams/team-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'U16 Boys' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });
});

describe('DELETE /teams/:id', () => {
  it('should return 404 if team not found', async () => {
    mockDel.mockResolvedValueOnce(0);

    const res = await request(app)
      .delete('/teams/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'team not found');
  });

  it('should delete and return 204', async () => {
    mockDel.mockResolvedValueOnce(1);

    const res = await request(app)
      .delete('/teams/team-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });
});
