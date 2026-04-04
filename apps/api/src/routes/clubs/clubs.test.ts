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

const sampleClub = {
  id: 'club-1',
  name: 'FC Example',
  code: 'FCE',
  description: null,
  mediaLogoLg: null,
  mediaLogoSm: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnThis();
  mockWhere.mockReturnThis();
  mockWhereNot.mockReturnThis();
  mockInsert.mockReturnThis();
  mockUpdate.mockReturnThis();
});

describe('GET /clubs', () => {
  it('should return a list of clubs', async () => {
    mockSelect.mockResolvedValueOnce([sampleClub]);

    const res = await request(app).get('/clubs');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleClub]);
  });
});

describe('GET /clubs/:id', () => {
  it('should return a club by id', async () => {
    mockFirst.mockResolvedValueOnce(sampleClub);

    const res = await request(app).get('/clubs/club-1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleClub);
  });

  it('should return 404 if club not found', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app).get('/clubs/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'club not found');
  });
});

describe('POST /clubs', () => {
  it('should return 400 if name is missing', async () => {
    const res = await request(app).post('/clubs').send({ code: 'FCE' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'name is required');
  });

  it('should return 400 if code is missing', async () => {
    const res = await request(app).post('/clubs').send({ name: 'FC Example' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'code is required');
  });

  it('should return 409 if code already exists', async () => {
    mockFirst.mockResolvedValueOnce(sampleClub);

    const res = await request(app)
      .post('/clubs')
      .send({ name: 'FC Example', code: 'FCE' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'code already in use');
  });

  it('should create a club and return 201', async () => {
    mockFirst.mockResolvedValueOnce(undefined);
    mockReturning.mockResolvedValueOnce([sampleClub]);

    const res = await request(app)
      .post('/clubs')
      .send({ name: 'FC Example', code: 'FCE' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleClub);
  });
});

describe('PUT /clubs/:id', () => {
  it('should return 400 if no valid fields provided', async () => {
    const res = await request(app).put('/clubs/club-1').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'no valid fields to update');
  });

  it('should return 409 if updated code already in use', async () => {
    mockFirst.mockResolvedValueOnce(sampleClub);

    const res = await request(app).put('/clubs/club-2').send({ code: 'FCE' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'code already in use');
  });

  it('should return 404 if club not found', async () => {
    mockReturning.mockResolvedValueOnce([]);

    const res = await request(app)
      .put('/clubs/nonexistent')
      .send({ name: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'club not found');
  });

  it('should update and return the club', async () => {
    const updated = { ...sampleClub, name: 'FC Updated' };
    mockReturning.mockResolvedValueOnce([updated]);

    const res = await request(app)
      .put('/clubs/club-1')
      .send({ name: 'FC Updated' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });
});

describe('DELETE /clubs/:id', () => {
  it('should return 404 if club not found', async () => {
    mockDel.mockResolvedValueOnce(0);

    const res = await request(app).delete('/clubs/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'club not found');
  });

  it('should delete and return 204', async () => {
    mockDel.mockResolvedValueOnce(1);

    const res = await request(app).delete('/clubs/club-1');

    expect(res.status).toBe(204);
  });
});
