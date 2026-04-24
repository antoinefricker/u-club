import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestToken } from '../../test-utils.js';

const mockSelect = vi.fn();
const mockWhere = vi.fn();
const mockFirst = vi.fn();
const mockInsert = vi.fn();
const mockReturning = vi.fn();
const mockUpdate = vi.fn();
const mockDel = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockOffset = vi.fn();
const mockCount = vi.fn();
const mockCountDistinct = vi.fn();

let listResult: unknown = [];
const setListResult = (v: unknown) => {
    listResult = v;
};

vi.mock('../../db.js', () => {
    const builder: Record<string, unknown> = {
        select: (...args: unknown[]) => {
            mockSelect(...args);
            return builder;
        },
        where: (...args: unknown[]) => {
            mockWhere(...args);
            return builder;
        },
        leftJoin: () => builder,
        first: mockFirst,
        insert: (...args: unknown[]) => {
            mockInsert(...args);
            return builder;
        },
        returning: mockReturning,
        update: (...args: unknown[]) => {
            mockUpdate(...args);
            return builder;
        },
        del: mockDel,
        orderBy: (...args: unknown[]) => {
            mockOrderBy(...args);
            return builder;
        },
        clone: () => builder,
        clearSelect: () => builder,
        clearOrder: () => builder,
        count: (...args: unknown[]) => {
            mockCount(...args);
            return builder;
        },
        countDistinct: (...args: unknown[]) => {
            mockCountDistinct(...args);
            return builder;
        },
        limit: (...args: unknown[]) => {
            mockLimit(...args);
            return builder;
        },
        offset: (...args: unknown[]) => {
            mockOffset(...args);
            return builder;
        },
        then: (resolve: (v: unknown) => void) => resolve(listResult),
    };
    const db = Object.assign(
        vi.fn(() => builder),
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
    categoryId: 'cat-1',
    label: 'U15 Boys',
    gender: 'male',
    description: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    categoryLabel: 'U15',
};

beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
    setListResult([]);
});

describe('GET /teams', () => {
    const mockList = (rows: unknown[], total: number) => {
        setListResult(rows);
        mockFirst.mockResolvedValueOnce({ total });
    };

    it('returns envelope with defaults when no query params', async () => {
        mockList([sampleTeam], 1);

        const res = await request(app)
            .get('/teams')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: [sampleTeam],
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
        mockList([sampleTeam], 42);

        const res = await request(app)
            .get('/teams?page=2&itemsPerPage=10')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockLimit).toHaveBeenCalledWith(10);
        expect(mockOffset).toHaveBeenCalledWith(10);
        expect(res.body.pagination.totalPages).toBe(5);
    });

    it('filters by gender and paginates the filtered set', async () => {
        const femaleTeam = { ...sampleTeam, id: 'team-2', gender: 'female' };
        mockList([femaleTeam], 3);

        const res = await request(app)
            .get('/teams?gender=female')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([femaleTeam]);
        expect(res.body.pagination.totalItems).toBe(3);
        expect(mockWhere).toHaveBeenCalledWith('teams.gender', 'female');
    });

    it('combines clubId and gender filters with pagination', async () => {
        mockList([sampleTeam], 1);

        const res = await request(app)
            .get('/teams?clubId=club-1&gender=male&page=1&itemsPerPage=10')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).toHaveBeenCalledWith('teams.clubId', 'club-1');
        expect(mockWhere).toHaveBeenCalledWith('teams.gender', 'male');
        expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('returns 400 for an invalid gender value', async () => {
        const res = await request(app)
            .get('/teams?gender=other')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
            'error',
            'gender must be male, female, or mixed',
        );
        expect(mockWhere).not.toHaveBeenCalled();
    });

    it('ignores an empty gender value', async () => {
        mockList([sampleTeam], 1);

        const res = await request(app)
            .get('/teams?gender=')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).not.toHaveBeenCalled();
    });

    it('filters by categoryId', async () => {
        mockList([sampleTeam], 1);
        const categoryId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

        const res = await request(app)
            .get(`/teams?categoryId=${categoryId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).toHaveBeenCalledWith('teams.categoryId', categoryId);
    });

    it('returns 400 for an invalid categoryId', async () => {
        const res = await request(app)
            .get('/teams?categoryId=not-a-uuid')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
            'error',
            'categoryId must be a valid uuid',
        );
        expect(mockWhere).not.toHaveBeenCalled();
    });

    it('combines clubId and categoryId filters', async () => {
        mockList([sampleTeam], 1);
        const clubId = 'b1ffdc88-8d1a-4fe7-aa5c-5aa8ac470b22';
        const categoryId = 'c2bbcd77-7e2b-4ad6-99b4-4995ad370c33';

        const res = await request(app)
            .get(`/teams?clubId=${clubId}&categoryId=${categoryId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).toHaveBeenCalledWith('teams.clubId', clubId);
        expect(mockWhere).toHaveBeenCalledWith('teams.categoryId', categoryId);
    });

    it('returns empty envelope when no teams match', async () => {
        mockList([], 0);

        const res = await request(app)
            .get('/teams?clubId=club-none')
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

    it('orders results by teams.id ascending', async () => {
        mockList([sampleTeam], 1);
        await request(app)
            .get('/teams')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(mockOrderBy).toHaveBeenCalledWith('teams.id', 'asc');
    });

    it.each([['page=0'], ['itemsPerPage=101']])(
        'returns 400 for %s',
        async (qs) => {
            const res = await request(app)
                .get(`/teams?${qs}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'validation error');
        },
    );
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

    it('creates a team with a valid categoryId', async () => {
        const categoryId = '33333333-3333-4333-8333-333333333333';
        mockReturning.mockResolvedValueOnce([{ ...sampleTeam, categoryId }]);

        const res = await request(app)
            .post('/teams')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                clubId: 'club-1',
                label: 'U15 Boys',
                gender: 'male',
                categoryId,
            });

        expect(res.status).toBe(201);
        expect(res.body.categoryId).toBe(categoryId);
    });

    it('creates a team with categoryId=null', async () => {
        mockReturning.mockResolvedValueOnce([
            { ...sampleTeam, categoryId: null },
        ]);

        const res = await request(app)
            .post('/teams')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                clubId: 'club-1',
                label: 'U15 Boys',
                gender: 'male',
                categoryId: null,
            });

        expect(res.status).toBe(201);
    });

    it('returns 400 when categoryId is not a uuid', async () => {
        const res = await request(app)
            .post('/teams')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                clubId: 'club-1',
                label: 'U15 Boys',
                gender: 'male',
                categoryId: 'not-a-uuid',
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
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

    it('updates categoryId with a valid uuid', async () => {
        const categoryId = '33333333-3333-4333-8333-333333333333';
        mockReturning.mockResolvedValueOnce([{ ...sampleTeam, categoryId }]);

        const res = await request(app)
            .put('/teams/team-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ categoryId });

        expect(res.status).toBe(200);
        expect(res.body.categoryId).toBe(categoryId);
    });

    it('clears categoryId with null', async () => {
        mockReturning.mockResolvedValueOnce([
            { ...sampleTeam, categoryId: null },
        ]);

        const res = await request(app)
            .put('/teams/team-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ categoryId: null });

        expect(res.status).toBe(200);
    });

    it('returns 400 when categoryId is not a uuid', async () => {
        const res = await request(app)
            .put('/teams/team-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ categoryId: 'not-a-uuid' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
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
