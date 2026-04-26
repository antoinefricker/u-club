import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestToken } from '../../test-utils.js';

const mockSelect = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockWhereIn = vi.fn().mockReturnThis();
const mockJoin = vi.fn().mockReturnThis();
const mockLeftJoin = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();
const mockClone = vi.fn().mockReturnThis();
const mockClearSelect = vi.fn().mockReturnThis();
const mockClearOrder = vi.fn().mockReturnThis();
const mockCount = vi.fn().mockReturnThis();
const mockCountDistinct = vi.fn().mockReturnThis();
const mockFirst = vi.fn();
const mockLimit = vi.fn().mockReturnThis();
const mockOffset = vi.fn();

vi.mock('../../db.js', () => {
    const db = Object.assign(
        vi.fn(() => ({
            select: mockSelect,
            where: mockWhere,
            whereIn: mockWhereIn,
            join: mockJoin,
            leftJoin: mockLeftJoin,
            orderBy: mockOrderBy,
            clone: mockClone,
            clearSelect: mockClearSelect,
            clearOrder: mockClearOrder,
            count: mockCount,
            countDistinct: mockCountDistinct,
            first: mockFirst,
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
const adminToken = createTestToken('uuid-admin', 'admin@example.com', 'admin');
const managerToken = createTestToken('uuid-manager', 'manager@example.com', 'manager');
const userToken = createTestToken('uuid-1', 'user@example.com', 'user');

const USER_UUID_OTHER = '22222222-2222-2222-8222-222222222222';
const MEMBER_UUID = '33333333-3333-3333-8333-333333333333';
const TEAM_UUID = '44444444-4444-4444-8444-444444444444';

const sampleAssignmentRow = {
    id: 'ta-1',
    teamId: 'team-1',
    memberId: 'member-1',
    role: 'player',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    teamLabel: 'Senior Men',
    teamGender: 'male',
    teamCategoryLabel: 'Senior',
    memberFirstName: 'Alice',
    memberLastName: 'Doe',
};

beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.resetAllMocks();
    mockSelect.mockReturnThis();
    mockWhere.mockReturnThis();
    mockWhereIn.mockReturnThis();
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

describe('GET /team-assignments', () => {
    const mockList = (rows: unknown[], total: number) => {
        mockFirst.mockResolvedValueOnce({ total });
        mockOffset.mockResolvedValueOnce(rows);
    };

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).get('/team-assignments');
        expect(res.status).toBe(401);
    });

    it.each([
        [`userId=${USER_UUID_OTHER}&memberId=${MEMBER_UUID}`],
        [`userId=${USER_UUID_OTHER}&teamId=${TEAM_UUID}`],
        [`memberId=${MEMBER_UUID}&teamId=${TEAM_UUID}`],
        [`userId=${USER_UUID_OTHER}&memberId=${MEMBER_UUID}&teamId=${TEAM_UUID}`],
    ])('returns 400 when filters are mixed (%s)', async (qs) => {
        const res = await request(app).get(`/team-assignments?${qs}`).set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
        expect(res.body.details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    message: 'userId, memberId and teamId are mutually exclusive',
                }),
            ]),
        );
    });

    it('returns 400 when userId is not a UUID', async () => {
        const res = await request(app)
            .get('/team-assignments?userId=not-a-uuid')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('returns 400 when memberId is not a UUID', async () => {
        const res = await request(app)
            .get('/team-assignments?memberId=not-a-uuid')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('returns 400 when teamId is not a UUID', async () => {
        const res = await request(app)
            .get('/team-assignments?teamId=not-a-uuid')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it.each([['page=0'], ['itemsPerPage=101']])('returns 400 for %s', async (qs) => {
        const res = await request(app).get(`/team-assignments?${qs}`).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('returns paginated envelope for admin without filter (no whereIn applied)', async () => {
        mockList([sampleAssignmentRow], 1);

        const res = await request(app).get('/team-assignments').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: [sampleAssignmentRow],
            pagination: {
                page: 1,
                itemsPerPage: 25,
                totalItems: 1,
                totalPages: 1,
            },
        });
        expect(mockWhereIn).not.toHaveBeenCalled();
        expect(mockWhere).not.toHaveBeenCalled();
    });

    it('applies memberId filter when admin passes it', async () => {
        mockList([sampleAssignmentRow], 1);

        const res = await request(app)
            .get(`/team-assignments?memberId=${MEMBER_UUID}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).toHaveBeenCalledWith('teamAssignments.memberId', MEMBER_UUID);
        expect(mockWhereIn).not.toHaveBeenCalled();
    });

    it('applies teamId filter when admin passes it', async () => {
        mockList([sampleAssignmentRow], 1);

        const res = await request(app)
            .get(`/team-assignments?teamId=${TEAM_UUID}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).toHaveBeenCalledWith('teamAssignments.teamId', TEAM_UUID);
        expect(mockWhereIn).not.toHaveBeenCalled();
    });

    it('ignores teamId query param for regular user (still scoped to self)', async () => {
        mockList([sampleAssignmentRow], 1);

        const res = await request(app)
            .get(`/team-assignments?teamId=${TEAM_UUID}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).toHaveBeenCalledWith('userId', 'uuid-1');
        expect(mockWhere).not.toHaveBeenCalledWith('teamAssignments.teamId', TEAM_UUID);
    });

    it('applies userId filter via userMembers subquery when admin passes it', async () => {
        mockList([sampleAssignmentRow], 1);

        const res = await request(app)
            .get(`/team-assignments?userId=${USER_UUID_OTHER}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockWhereIn).toHaveBeenCalledWith('teamAssignments.memberId', expect.anything());
        // The subquery built via `db('userMembers').select('memberId').where('userId', userId)`
        expect(mockSelect).toHaveBeenCalledWith('memberId');
        expect(mockWhere).toHaveBeenCalledWith('userId', USER_UUID_OTHER);
    });

    it('applies memberId filter when manager passes it', async () => {
        mockList([sampleAssignmentRow], 1);

        const res = await request(app)
            .get(`/team-assignments?memberId=${MEMBER_UUID}`)
            .set('Authorization', `Bearer ${managerToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).toHaveBeenCalledWith('teamAssignments.memberId', MEMBER_UUID);
    });

    it('scopes regular user to their own userMembers via whereIn (no params)', async () => {
        mockList([sampleAssignmentRow], 1);

        const res = await request(app).get('/team-assignments').set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(mockWhereIn).toHaveBeenCalledWith('teamAssignments.memberId', expect.anything());
        expect(mockSelect).toHaveBeenCalledWith('memberId');
        expect(mockWhere).toHaveBeenCalledWith('userId', 'uuid-1');
    });

    it('ignores userId query param for regular user (still scoped to self)', async () => {
        mockList([sampleAssignmentRow], 1);

        const res = await request(app)
            .get(`/team-assignments?userId=${USER_UUID_OTHER}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).toHaveBeenCalledWith('userId', 'uuid-1');
        expect(mockWhere).not.toHaveBeenCalledWith('userId', USER_UUID_OTHER);
    });

    it('ignores memberId query param for regular user (still scoped to self)', async () => {
        mockList([sampleAssignmentRow], 1);

        const res = await request(app)
            .get(`/team-assignments?memberId=${MEMBER_UUID}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).toHaveBeenCalledWith('userId', 'uuid-1');
        expect(mockWhere).not.toHaveBeenCalledWith('teamAssignments.memberId', MEMBER_UUID);
    });

    it('selects joined team and member display fields', async () => {
        mockList([sampleAssignmentRow], 1);

        await request(app).get('/team-assignments').set('Authorization', `Bearer ${adminToken}`);

        expect(mockSelect).toHaveBeenCalledWith(
            'teamAssignments.id',
            'teamAssignments.teamId',
            'teamAssignments.memberId',
            'teamAssignments.role',
            'teamAssignments.createdAt',
            'teamAssignments.updatedAt',
            'teams.label as teamLabel',
            'teams.gender as teamGender',
            'teamCategories.label as teamCategoryLabel',
            'members.firstName as memberFirstName',
            'members.lastName as memberLastName',
        );
    });

    it('orders results by createdAt desc then id asc', async () => {
        mockList([sampleAssignmentRow], 1);

        await request(app).get('/team-assignments').set('Authorization', `Bearer ${adminToken}`);

        expect(mockOrderBy).toHaveBeenCalledWith([
            { column: 'teamAssignments.createdAt', order: 'desc' },
            { column: 'teamAssignments.id', order: 'asc' },
        ]);
    });

    it('applies page=2 and itemsPerPage=10 to limit/offset', async () => {
        mockList([sampleAssignmentRow], 42);

        const res = await request(app)
            .get('/team-assignments?page=2&itemsPerPage=10')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockLimit).toHaveBeenCalledWith(10);
        expect(mockOffset).toHaveBeenCalledWith(10);
        expect(res.body.pagination.totalPages).toBe(5);
    });

    it('returns empty envelope when no rows match', async () => {
        mockList([], 0);

        const res = await request(app).get('/team-assignments').set('Authorization', `Bearer ${adminToken}`);

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
});
