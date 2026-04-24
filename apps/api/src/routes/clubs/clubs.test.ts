import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestToken } from '../../test-utils.js';

const mockSelect = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockWhereNot = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();
const mockClone = vi.fn().mockReturnThis();
const mockClearSelect = vi.fn().mockReturnThis();
const mockClearOrder = vi.fn().mockReturnThis();
const mockCount = vi.fn().mockReturnThis();
const mockCountDistinct = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockOffset = vi.fn();
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
            orderBy: mockOrderBy,
            clone: mockClone,
            clearSelect: mockClearSelect,
            clearOrder: mockClearOrder,
            count: mockCount,
            countDistinct: mockCountDistinct,
            limit: mockLimit,
            offset: mockOffset,
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
const userToken = createTestToken('uuid-2', 'user@example.com', 'user');

const sampleClub = {
    id: 'club-1',
    name: 'FC Example',
    code: 'FCE',
    description: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
    mockWhere.mockReturnThis();
    mockWhereNot.mockReturnThis();
    mockOrderBy.mockReturnThis();
    mockClone.mockReturnThis();
    mockClearSelect.mockReturnThis();
    mockClearOrder.mockReturnThis();
    mockCount.mockReturnThis();
    mockCountDistinct.mockReturnThis();
    mockLimit.mockReturnThis();
    mockInsert.mockReturnThis();
    mockUpdate.mockReturnThis();
});

describe('GET /clubs', () => {
    const mockList = (rows: unknown[], total: number) => {
        mockFirst.mockResolvedValueOnce({ total });
        mockOffset.mockResolvedValueOnce(rows);
    };

    it('returns envelope with defaults when no query params', async () => {
        mockList([sampleClub], 1);

        const res = await request(app)
            .get('/clubs')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: [sampleClub],
            pagination: {
                page: 1,
                itemsPerPage: 25,
                totalItems: 1,
                totalPages: 1,
            },
        });
        expect(mockLimit).toHaveBeenCalledWith(25);
        expect(mockOffset).toHaveBeenCalledWith(0);
    });

    it('applies page=2 and itemsPerPage=10 to the query', async () => {
        mockList([sampleClub], 42);

        const res = await request(app)
            .get('/clubs?page=2&itemsPerPage=10')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockLimit).toHaveBeenCalledWith(10);
        expect(mockOffset).toHaveBeenCalledWith(10);
        expect(res.body.pagination).toEqual({
            page: 2,
            itemsPerPage: 10,
            totalItems: 42,
            totalPages: 5,
        });
    });

    it('computes totalPages correctly for exact and partial last page', async () => {
        mockList([sampleClub], 30);
        const exact = await request(app)
            .get('/clubs?itemsPerPage=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(exact.body.pagination.totalPages).toBe(3);

        mockList([sampleClub], 31);
        const partial = await request(app)
            .get('/clubs?itemsPerPage=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(partial.body.pagination.totalPages).toBe(4);
    });

    it('returns empty data with totalPages=1 when no clubs exist', async () => {
        mockList([], 0);

        const res = await request(app)
            .get('/clubs')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
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

    it('preserves requested page in meta when beyond last page', async () => {
        mockList([], 5);

        const res = await request(app)
            .get('/clubs?page=99&itemsPerPage=10')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.pagination).toEqual({
            page: 99,
            itemsPerPage: 10,
            totalItems: 5,
            totalPages: 1,
        });
    });

    it('orders results by id ascending', async () => {
        mockList([sampleClub], 1);

        await request(app)
            .get('/clubs')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(mockOrderBy).toHaveBeenCalledWith('id', 'asc');
    });

    it.each([
        ['page=0', 'page=0'],
        ['page=-1', 'page=-1'],
        ['page=abc', 'page=abc'],
        ['page=1.5', 'page=1.5'],
        ['itemsPerPage=0', 'itemsPerPage=0'],
        ['itemsPerPage=101', 'itemsPerPage=101'],
    ])('returns 400 for %s', async (_label, qs) => {
        const res = await request(app)
            .get(`/clubs?${qs}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).get('/clubs');
        expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as a regular user', async () => {
        const res = await request(app)
            .get('/clubs')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(403);
    });
});

describe('GET /clubs/:id', () => {
    it('should return a club by id', async () => {
        mockFirst.mockResolvedValueOnce(sampleClub);

        const res = await request(app)
            .get('/clubs/club-1')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(sampleClub);
    });

    it('should return 404 if club not found', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app)
            .get('/clubs/nonexistent')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'club not found');
    });
});

describe('POST /clubs', () => {
    it('should return 400 if name is missing', async () => {
        const res = await request(app)
            .post('/clubs')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ code: 'FCE' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 400 if code is missing', async () => {
        const res = await request(app)
            .post('/clubs')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'FC Example' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 409 if code already exists', async () => {
        mockFirst.mockResolvedValueOnce(sampleClub);

        const res = await request(app)
            .post('/clubs')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'FC Example', code: 'FCE' });

        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty('error', 'code already in use');
    });

    it('should create a club and return 201', async () => {
        mockFirst.mockResolvedValueOnce(undefined);
        mockReturning.mockResolvedValueOnce([sampleClub]);

        const res = await request(app)
            .post('/clubs')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'FC Example', code: 'FCE' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(sampleClub);
    });
});

describe('PUT /clubs/:id', () => {
    it('should return 400 if no valid fields provided', async () => {
        const res = await request(app)
            .put('/clubs/club-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 409 if updated code already in use', async () => {
        mockFirst.mockResolvedValueOnce(sampleClub);

        const res = await request(app)
            .put('/clubs/club-2')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ code: 'FCE' });

        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty('error', 'code already in use');
    });

    it('should return 404 if club not found', async () => {
        mockReturning.mockResolvedValueOnce([]);

        const res = await request(app)
            .put('/clubs/nonexistent')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Updated' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'club not found');
    });

    it('should update and return the club', async () => {
        const updated = { ...sampleClub, name: 'FC Updated' };
        mockReturning.mockResolvedValueOnce([updated]);

        const res = await request(app)
            .put('/clubs/club-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'FC Updated' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
    });
});

describe('DELETE /clubs/:id', () => {
    it('should return 404 if club not found', async () => {
        mockDel.mockResolvedValueOnce(0);

        const res = await request(app)
            .delete('/clubs/nonexistent')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'club not found');
    });

    it('should delete and return 204', async () => {
        mockDel.mockResolvedValueOnce(1);

        const res = await request(app)
            .delete('/clubs/club-1')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(204);
    });
});
