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
const mockOrderBy = vi.fn().mockReturnThis();
const mockClone = vi.fn().mockReturnThis();
const mockClearSelect = vi.fn().mockReturnThis();
const mockClearOrder = vi.fn().mockReturnThis();
const mockCount = vi.fn().mockReturnThis();
const mockCountDistinct = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockOffset = vi.fn();

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
      orderBy: mockOrderBy,
      clone: mockClone,
      clearSelect: mockClearSelect,
      clearOrder: mockClearOrder,
      count: mockCount,
      countDistinct: mockCountDistinct,
      limit: mockLimit,
      offset: mockOffset,
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
const userToken = createTestToken('uuid-2', 'user@example.com', 'user');

const CLUB_ID = '11111111-1111-4111-8111-111111111111';
const CATEGORY_ID = '22222222-2222-4222-8222-222222222222';

const sampleCategory = {
  id: CATEGORY_ID,
  clubId: CLUB_ID,
  label: 'U15',
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
  mockOrderBy.mockReturnThis();
  mockClone.mockReturnThis();
  mockClearSelect.mockReturnThis();
  mockClearOrder.mockReturnThis();
  mockCount.mockReturnThis();
  mockCountDistinct.mockReturnThis();
  mockLimit.mockReturnThis();
});

describe('GET /team-categories', () => {
  const mockList = (rows: unknown[], total: number) => {
    mockFirst.mockResolvedValueOnce({ total });
    mockOffset.mockResolvedValueOnce(rows);
  };

  it('returns envelope with defaults when no query params', async () => {
    mockList([sampleCategory], 1);

    const res = await request(app)
      .get('/team-categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [sampleCategory],
      pagination: {
        page: 1,
        itemsPerPage: 25,
        totalItems: 1,
        totalPages: 1,
      },
    });
    expect(mockWhere).not.toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(25);
    expect(mockOffset).toHaveBeenCalledWith(0);
  });

  it('applies page=2 and itemsPerPage=10', async () => {
    mockList([sampleCategory], 42);

    const res = await request(app)
      .get('/team-categories?page=2&itemsPerPage=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(mockLimit).toHaveBeenCalledWith(10);
    expect(mockOffset).toHaveBeenCalledWith(10);
    expect(res.body.pagination.totalPages).toBe(5);
  });

  it('filters by clubId', async () => {
    mockList([sampleCategory], 3);

    const res = await request(app)
      .get(`/team-categories?clubId=${CLUB_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(mockWhere).toHaveBeenCalledWith('clubId', CLUB_ID);
    expect(res.body.pagination.totalItems).toBe(3);
  });

  it('returns empty envelope when no categories', async () => {
    mockList([], 0);

    const res = await request(app)
      .get('/team-categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body).toEqual({
      data: [],
      pagination: {
        page: 1,
        itemsPerPage: 25,
        totalItems: 0,
        totalPages: 1,
      },
    });
  });

  it('orders results by id ascending', async () => {
    mockList([sampleCategory], 1);
    await request(app)
      .get('/team-categories')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(mockOrderBy).toHaveBeenCalledWith('id', 'asc');
  });

  it.each([['page=0'], ['itemsPerPage=101']])(
    'returns 400 for %s',
    async (qs) => {
      const res = await request(app)
        .get(`/team-categories?${qs}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'validation error');
    },
  );

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/team-categories');
    expect(res.status).toBe(401);
  });

  it('returns 403 when authenticated as a regular user', async () => {
    const res = await request(app)
      .get('/team-categories')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /team-categories/:id', () => {
  it('returns the category', async () => {
    mockFirst.mockResolvedValueOnce(sampleCategory);

    const res = await request(app)
      .get(`/team-categories/${CATEGORY_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleCategory);
  });

  it('returns 404 when missing', async () => {
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .get('/team-categories/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'team category not found');
  });
});

describe('POST /team-categories', () => {
  it('creates and returns 201', async () => {
    mockFirst.mockResolvedValueOnce(undefined);
    mockReturning.mockResolvedValueOnce([sampleCategory]);

    const res = await request(app)
      .post('/team-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clubId: CLUB_ID, label: 'U15' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleCategory);
  });

  it('returns 400 when label is missing', async () => {
    const res = await request(app)
      .post('/team-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clubId: CLUB_ID });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('returns 400 when clubId is missing', async () => {
    const res = await request(app)
      .post('/team-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'U15' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('returns 400 when clubId is not a uuid', async () => {
    const res = await request(app)
      .post('/team-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clubId: 'not-a-uuid', label: 'U15' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('returns 409 when (clubId, label) already exists', async () => {
    mockFirst.mockResolvedValueOnce(sampleCategory);

    const res = await request(app)
      .post('/team-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clubId: CLUB_ID, label: 'U15' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty(
      'error',
      'label already in use for this club',
    );
  });
});

describe('PUT /team-categories/:id', () => {
  it('updates and returns 200', async () => {
    // Lookup current clubId
    mockFirst.mockResolvedValueOnce({ clubId: CLUB_ID });
    // Duplicate check: none
    mockFirst.mockResolvedValueOnce(undefined);
    const updated = { ...sampleCategory, label: 'U16' };
    mockReturning.mockResolvedValueOnce([updated]);

    const res = await request(app)
      .put(`/team-categories/${CATEGORY_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'U16' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('returns 400 when body is empty', async () => {
    const res = await request(app)
      .put(`/team-categories/${CATEGORY_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'validation error');
  });

  it('returns 404 when category does not exist', async () => {
    // clubId lookup returns nothing
    mockFirst.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .put('/team-categories/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'U16' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'team category not found');
  });

  it('returns 409 when the new label already exists in the same club', async () => {
    mockFirst.mockResolvedValueOnce({ clubId: CLUB_ID });
    mockFirst.mockResolvedValueOnce({ ...sampleCategory, id: 'other-id' });

    const res = await request(app)
      .put(`/team-categories/${CATEGORY_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'U15' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty(
      'error',
      'label already in use for this club',
    );
  });
});

describe('DELETE /team-categories/:id', () => {
  it('deletes and returns 204', async () => {
    mockDel.mockResolvedValueOnce(1);

    const res = await request(app)
      .delete(`/team-categories/${CATEGORY_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it('returns 404 when category does not exist', async () => {
    mockDel.mockResolvedValueOnce(0);

    const res = await request(app)
      .delete('/team-categories/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'team category not found');
  });
});
