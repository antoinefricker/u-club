import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestToken } from '../../test-utils.js';

const mockSelect = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockWhereNot = vi.fn().mockReturnThis();
const mockAndWhere = vi.fn(function (this: unknown, cb: unknown) {
    if (typeof cb === 'function') cb(this);
    return this;
});
const mockOrWhere = vi.fn().mockReturnThis();
const mockWhereRaw = vi.fn().mockReturnThis();
const mockOrWhereRaw = vi.fn().mockReturnThis();
const mockFirst = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockReturning = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockDel = vi.fn();
const mockJoin = vi.fn().mockReturnThis();
const mockLeftJoin = vi.fn().mockReturnThis();
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
            andWhere: mockAndWhere,
            orWhere: mockOrWhere,
            whereRaw: mockWhereRaw,
            orWhereRaw: mockOrWhereRaw,
            first: mockFirst,
            insert: mockInsert,
            returning: mockReturning,
            update: mockUpdate,
            del: mockDel,
            join: mockJoin,
            leftJoin: mockLeftJoin,
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
    mockOrWhere.mockReturnThis();
    mockWhereRaw.mockReturnThis();
    mockOrWhereRaw.mockReturnThis();
    mockInsert.mockReturnThis();
    mockUpdate.mockReturnThis();
    mockJoin.mockReturnThis();
    mockLeftJoin.mockReturnThis();
    mockOrderBy.mockReturnThis();
    mockClone.mockReturnThis();
    mockClearSelect.mockReturnThis();
    mockClearOrder.mockReturnThis();
    mockCount.mockReturnThis();
    mockCountDistinct.mockReturnThis();
    mockLimit.mockReturnThis();
});

describe('GET /members', () => {
    const mockList = (rows: unknown[], total: number) => {
        mockFirst.mockResolvedValueOnce({ total });
        mockOffset.mockResolvedValueOnce(rows);
    };

    it('returns envelope with defaults when no query params', async () => {
        mockList([sampleMember], 1);

        const res = await request(app).get('/members').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: [sampleMember],
            pagination: {
                page: 1,
                itemsPerPage: 25,
                totalItems: 1,
                totalPages: 1,
            },
        });
        expect(mockJoin).not.toHaveBeenCalled();
        expect(mockLimit).toHaveBeenCalledWith(25);
        expect(mockOffset).toHaveBeenCalledWith(0);
    });

    it('applies page=2 and itemsPerPage=10', async () => {
        mockList([sampleMember], 42);

        const res = await request(app)
            .get('/members?page=2&itemsPerPage=10')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockLimit).toHaveBeenCalledWith(10);
        expect(mockOffset).toHaveBeenCalledWith(10);
        expect(res.body.pagination.totalPages).toBe(5);
    });

    it('filters by teamId with an inner join and paginates the filtered set', async () => {
        mockList([sampleMember], 7);

        const res = await request(app).get('/members?teamId=team-1').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockJoin).toHaveBeenCalledWith('teamAssignments', 'members.id', 'teamAssignments.memberId');
        expect(mockWhere).toHaveBeenCalledWith('teamAssignments.teamId', 'team-1');
        expect(res.body.pagination.totalItems).toBe(7);
    });

    it('returns empty envelope when no members match', async () => {
        mockList([], 0);

        const res = await request(app).get('/members').set('Authorization', `Bearer ${adminToken}`);

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

    it('orders results by members.id ascending', async () => {
        mockList([sampleMember], 1);
        await request(app).get('/members').set('Authorization', `Bearer ${adminToken}`);
        expect(mockOrderBy).toHaveBeenCalledWith('members.id', 'asc');
    });

    it('left-joins memberStatuses to expose statusLabel', async () => {
        const memberWithStatus = { ...sampleMember, statusLabel: 'Active' };
        mockList([memberWithStatus], 1);

        const res = await request(app).get('/members').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockLeftJoin).toHaveBeenCalledWith('memberStatuses', 'members.statusId', 'memberStatuses.id');
        expect(res.body.data[0]).toHaveProperty('statusLabel', 'Active');
    });

    it('returns null statusLabel when member has no status', async () => {
        const memberWithoutStatus = { ...sampleMember, statusLabel: null };
        mockList([memberWithoutStatus], 1);

        const res = await request(app).get('/members').set('Authorization', `Bearer ${adminToken}`);

        expect(res.body.data[0]).toHaveProperty('statusLabel', null);
    });

    it.each([['page=0'], ['itemsPerPage=101']])('returns 400 for %s', async (qs) => {
        const res = await request(app).get(`/members?${qs}`).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    describe('search filter', () => {
        it('ignores empty and whitespace-only search', async () => {
            mockList([sampleMember], 1);
            await request(app).get('/members?search=').set('Authorization', `Bearer ${adminToken}`);
            expect(mockAndWhere).not.toHaveBeenCalled();

            mockList([sampleMember], 1);
            await request(app).get('/members?search=%20%20').set('Authorization', `Bearer ${adminToken}`);
            expect(mockAndWhere).not.toHaveBeenCalled();
        });

        it('applies a single-token search with unaccent ILIKE across all three fields', async () => {
            mockList([sampleMember], 1);

            const res = await request(app).get('/members?search=john').set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(mockAndWhere).toHaveBeenCalledTimes(1);
            expect(mockWhereRaw).toHaveBeenCalledWith('unaccent(members.first_name) ilike unaccent(?)', ['%john%']);
            expect(mockOrWhereRaw).toHaveBeenCalledWith('unaccent(members.last_name) ilike unaccent(?)', ['%john%']);
            expect(mockOrWhereRaw).toHaveBeenCalledWith(
                "unaccent(to_char(members.birthdate, 'DD/MM/YYYY')) ilike unaccent(?)",
                ['%john%'],
            );
        });

        it('ANDs multiple tokens — one andWhere group per token', async () => {
            mockList([sampleMember], 1);

            await request(app).get('/members?search=john%201990').set('Authorization', `Bearer ${adminToken}`);

            expect(mockAndWhere).toHaveBeenCalledTimes(2);
            expect(mockWhereRaw).toHaveBeenCalledWith('unaccent(members.first_name) ilike unaccent(?)', ['%john%']);
            expect(mockWhereRaw).toHaveBeenCalledWith('unaccent(members.first_name) ilike unaccent(?)', ['%1990%']);
        });

        it('collapses internal and surrounding whitespace into tokens', async () => {
            mockList([sampleMember], 1);

            await request(app)
                .get('/members?search=%20%20john%20%20%201990%20%20')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(mockAndWhere).toHaveBeenCalledTimes(2);
        });

        it('escapes LIKE wildcards in user input', async () => {
            mockList([sampleMember], 1);

            await request(app).get('/members?search=%25_%5C').set('Authorization', `Bearer ${adminToken}`);

            expect(mockWhereRaw).toHaveBeenCalledWith('unaccent(members.first_name) ilike unaccent(?)', [
                '%\\%\\_\\\\%',
            ]);
        });

        it('returns 400 when search exceeds 100 characters', async () => {
            const long = 'a'.repeat(101);
            const res = await request(app).get(`/members?search=${long}`).set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'search must be 100 characters or fewer');
            expect(mockAndWhere).not.toHaveBeenCalled();
        });

        it('returns 400 when search contains more than 10 tokens', async () => {
            const tokens = Array.from({ length: 11 }, (_, i) => `t${i}`).join(' ');
            const res = await request(app)
                .get(`/members?search=${encodeURIComponent(tokens)}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'search must contain at most 10 tokens');
            expect(mockAndWhere).not.toHaveBeenCalled();
        });

        it('combines search with teamId filter', async () => {
            mockList([sampleMember], 1);

            const res = await request(app)
                .get('/members?teamId=team-1&search=jo')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(mockJoin).toHaveBeenCalledWith('teamAssignments', 'members.id', 'teamAssignments.memberId');
            expect(mockWhere).toHaveBeenCalledWith('teamAssignments.teamId', 'team-1');
            expect(mockAndWhere).toHaveBeenCalledTimes(1);
            expect(mockWhereRaw).toHaveBeenCalledWith('unaccent(members.first_name) ilike unaccent(?)', ['%jo%']);
        });
    });
});

describe('GET /members/:id', () => {
    it('should return a member by id', async () => {
        mockFirst.mockResolvedValueOnce(sampleMember);

        const res = await request(app).get('/members/member-1').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(sampleMember);
    });

    it('should return 404 if member not found', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app).get('/members/nonexistent').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'member not found');
    });
});

describe('GET /members/:memberId/teams', () => {
    const sampleAssignment = {
        id: 'assign-1',
        teamId: 'team-1',
        teamLabel: 'U13 A',
        teamGender: 'mixed',
        teamCategoryLabel: 'U13',
        role: 'player',
        createdAt: '2026-01-01T00:00:00.000Z',
    };

    it("returns the member's team assignments", async () => {
        mockSelect.mockResolvedValueOnce([sampleAssignment]);

        const res = await request(app).get('/members/member-1/teams').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([sampleAssignment]);
    });

    it('returns an empty array when the member has no assignments', async () => {
        mockSelect.mockResolvedValueOnce([]);

        const res = await request(app).get('/members/member-1/teams').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('orders results by team label ascending', async () => {
        mockSelect.mockResolvedValueOnce([]);
        await request(app).get('/members/member-1/teams').set('Authorization', `Bearer ${adminToken}`);
        expect(mockOrderBy).toHaveBeenCalledWith('teams.label', 'asc');
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).get('/members/member-1/teams');
        expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as a regular user', async () => {
        const res = await request(app).get('/members/member-1/teams').set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(403);
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
        const res = await request(app).post('/members').set('Authorization', `Bearer ${adminToken}`).send({
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

    it.each([['not-a-date'], ['2010-13-45'], ['2010/05/03']])(
        'returns 400 for invalid birthdate %s',
        async (birthdate) => {
            const res = await request(app).post('/members').set('Authorization', `Bearer ${adminToken}`).send({
                firstName: 'John',
                lastName: 'Doe',
                gender: 'male',
                birthdate,
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'validation error');
        },
    );

    it('accepts a valid YYYY-MM-DD birthdate', async () => {
        mockReturning.mockResolvedValueOnce([sampleMember]);

        const res = await request(app).post('/members').set('Authorization', `Bearer ${adminToken}`).send({
            firstName: 'John',
            lastName: 'Doe',
            gender: 'male',
            birthdate: '2010-05-03',
        });

        expect(res.status).toBe(201);
    });

    it('accepts null birthdate', async () => {
        mockReturning.mockResolvedValueOnce([sampleMember]);

        const res = await request(app).post('/members').set('Authorization', `Bearer ${adminToken}`).send({
            firstName: 'John',
            lastName: 'Doe',
            gender: 'male',
            birthdate: null,
        });

        expect(res.status).toBe(201);
    });
});

describe('PUT /members/:id', () => {
    it('should return 400 if no valid fields provided', async () => {
        const res = await request(app).put('/members/member-1').set('Authorization', `Bearer ${adminToken}`).send({});

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

    it.each([['not-a-date'], ['2010-13-45'], ['2010/05/03']])(
        'returns 400 for invalid birthdate %s',
        async (birthdate) => {
            const res = await request(app)
                .put('/members/member-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ birthdate });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'validation error');
        },
    );

    it('accepts a valid YYYY-MM-DD birthdate', async () => {
        mockReturning.mockResolvedValueOnce([sampleMember]);

        const res = await request(app)
            .put('/members/member-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ birthdate: '2010-05-03' });

        expect(res.status).toBe(200);
    });

    it('accepts null birthdate', async () => {
        mockReturning.mockResolvedValueOnce([sampleMember]);

        const res = await request(app)
            .put('/members/member-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ birthdate: null });

        expect(res.status).toBe(200);
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

        const res = await request(app).delete('/members/nonexistent').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'member not found');
    });

    it('should delete and return 204', async () => {
        mockDel.mockResolvedValueOnce(1);

        const res = await request(app).delete('/members/member-1').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(204);
    });
});
