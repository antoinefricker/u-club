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

const sampleStatus = { id: 'status-1', label: 'Active' };

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

describe('GET /member-statuses', () => {
    const mockList = (rows: unknown[], total: number) => {
        mockFirst.mockResolvedValueOnce({ total });
        mockOffset.mockResolvedValueOnce(rows);
    };

    it('returns envelope with defaults when no query params', async () => {
        mockList([sampleStatus], 1);

        const res = await request(app).get('/member-statuses').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: [sampleStatus],
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

    it('applies page=2 and itemsPerPage=10', async () => {
        mockList([sampleStatus], 42);

        const res = await request(app)
            .get('/member-statuses?page=2&itemsPerPage=10')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockLimit).toHaveBeenCalledWith(10);
        expect(mockOffset).toHaveBeenCalledWith(10);
        expect(res.body.pagination.totalPages).toBe(5);
    });

    it('returns empty envelope when no statuses', async () => {
        mockList([], 0);

        const res = await request(app).get('/member-statuses').set('Authorization', `Bearer ${adminToken}`);

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
        mockList([sampleStatus], 1);
        await request(app).get('/member-statuses').set('Authorization', `Bearer ${adminToken}`);
        expect(mockOrderBy).toHaveBeenCalledWith('id', 'asc');
    });

    it.each([['page=0'], ['itemsPerPage=101']])('returns 400 for %s', async (qs) => {
        const res = await request(app).get(`/member-statuses?${qs}`).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });
});

describe('POST /member-statuses', () => {
    it('should return 400 if label is missing', async () => {
        const res = await request(app).post('/member-statuses').set('Authorization', `Bearer ${adminToken}`).send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 409 if label already exists', async () => {
        mockFirst.mockResolvedValueOnce(sampleStatus);

        const res = await request(app)
            .post('/member-statuses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ label: 'Active' });

        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty('error', 'label already in use');
    });

    it('should create a status and return 201', async () => {
        mockFirst.mockResolvedValueOnce(undefined);
        mockReturning.mockResolvedValueOnce([sampleStatus]);

        const res = await request(app)
            .post('/member-statuses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ label: 'Active' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(sampleStatus);
    });
});

describe('PUT /member-statuses/:id', () => {
    it('should return 400 if no valid fields provided', async () => {
        const res = await request(app)
            .put('/member-statuses/status-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 409 if label already in use', async () => {
        mockFirst.mockResolvedValueOnce(sampleStatus);

        const res = await request(app)
            .put('/member-statuses/status-2')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ label: 'Active' });

        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty('error', 'label already in use');
    });

    it('should return 404 if status not found', async () => {
        mockReturning.mockResolvedValueOnce([]);

        const res = await request(app)
            .put('/member-statuses/nonexistent')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ label: 'Updated' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'member status not found');
    });

    it('should update and return the status', async () => {
        const updated = { ...sampleStatus, label: 'Inactive' };
        mockReturning.mockResolvedValueOnce([updated]);

        const res = await request(app)
            .put('/member-statuses/status-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ label: 'Inactive' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
    });
});

describe('DELETE /member-statuses/:id', () => {
    it('should return 404 if status not found', async () => {
        mockDel.mockResolvedValueOnce(0);

        const res = await request(app)
            .delete('/member-statuses/nonexistent')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'member status not found');
    });

    it('should delete and return 204', async () => {
        mockDel.mockResolvedValueOnce(1);

        const res = await request(app).delete('/member-statuses/status-1').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(204);
    });
});
