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
const mockOrderBy = vi.fn().mockReturnThis();
const mockClone = vi.fn().mockReturnThis();
const mockClearSelect = vi.fn().mockReturnThis();
const mockClearOrder = vi.fn().mockReturnThis();
const mockCount = vi.fn().mockReturnThis();
const mockCountDistinct = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockOffset = vi.fn();
const mockSendMail = vi.fn().mockResolvedValue({});

const mockTrxInsert = vi.fn().mockReturnThis();
const mockTrxReturning = vi.fn().mockResolvedValue([]);
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
            orderBy: mockOrderBy,
            clone: mockClone,
            clearSelect: mockClearSelect,
            clearOrder: mockClearOrder,
            count: mockCount,
            countDistinct: mockCountDistinct,
            limit: mockLimit,
            offset: mockOffset,
        })),
        {
            raw: vi.fn(),
            transaction: vi.fn(async (cb: (trx: unknown) => Promise<unknown>) => {
                const trx = vi.fn(() => ({
                    insert: mockTrxInsert,
                    returning: mockTrxReturning,
                    where: mockTrxWhere,
                    update: mockTrxUpdate,
                }));
                return await cb(trx);
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
const USER_UUID_ADMIN = 'aaaaaaaa-aaaa-aaaa-8aaa-aaaaaaaaaaaa';
const USER_UUID_SELF = '11111111-1111-1111-8111-111111111111';
const adminToken = createTestToken(USER_UUID_ADMIN, 'admin@test.com', 'admin');
const userToken = createTestToken(USER_UUID_SELF, 'user@test.com', 'user');

beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
    mockWhere.mockReturnThis();
    mockWhereNull.mockReturnThis();
    mockInsert.mockReturnThis();
    mockUpdate.mockReturnThis();
    mockJoin.mockReturnThis();
    mockOrderBy.mockReturnThis();
    mockClone.mockReturnThis();
    mockClearSelect.mockReturnThis();
    mockClearOrder.mockReturnThis();
    mockCount.mockReturnThis();
    mockCountDistinct.mockReturnThis();
    mockLimit.mockReturnThis();
    mockTrxInsert.mockReturnThis();
    mockTrxWhere.mockReturnThis();
    // clear leftover mockResolvedValueOnce queues so they don't bleed across tests
    mockFirst.mockReset();
    mockOffset.mockReset();
    mockReturning.mockReset();
    mockDel.mockReset();
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

        const res = await request(app).post('/invitations').set('Authorization', `Bearer ${userToken}`).send(validBody);

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
    const USER_UUID_OTHER = '22222222-2222-2222-8222-222222222222';
    const MEMBER_UUID = '33333333-3333-3333-8333-333333333333';

    const sampleInvitation = {
        id: 'inv-1',
        memberId: 'member-1',
        email: 'user@test.com',
        type: 'self',
        invitedByDisplayName: 'Admin',
        invitedByEmail: 'admin@test.com',
    };

    const mockUserListPipeline = (rows: unknown[], total: number) => {
        // First .first() call: users.where({ id }).first('email') -> user record
        mockFirst.mockResolvedValueOnce({ email: 'user@test.com' });
        // Count query
        mockFirst.mockResolvedValueOnce({ total });
        // Data query
        mockOffset.mockResolvedValueOnce(rows);
    };

    const mockMemberListPipeline = (rows: unknown[], total: number) => {
        mockFirst.mockResolvedValueOnce({ total });
        mockOffset.mockResolvedValueOnce(rows);
    };

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).get(`/invitations?userId=${USER_UUID_SELF}`);
        expect(res.status).toBe(401);
    });

    it('returns 400 when neither userId nor memberId is provided', async () => {
        const res = await request(app).get('/invitations').set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
        expect(res.body.details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    message: 'exactly one of userId or memberId is required',
                }),
            ]),
        );
    });

    it('returns 400 when both userId and memberId are provided', async () => {
        const res = await request(app)
            .get(`/invitations?userId=${USER_UUID_SELF}&memberId=${MEMBER_UUID}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    message: 'exactly one of userId or memberId is required',
                }),
            ]),
        );
    });

    it.each([['userId=not-a-uuid'], ['memberId=not-a-uuid']])('returns 400 when %s', async (qs) => {
        const res = await request(app).get(`/invitations?${qs}`).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('returns invitations for the current user when userId equals self', async () => {
        mockUserListPipeline([sampleInvitation], 1);

        const res = await request(app)
            .get(`/invitations?userId=${USER_UUID_SELF}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([sampleInvitation]);
        expect(mockWhere).toHaveBeenCalledWith('memberInvitations.email', 'user@test.com');
    });

    it('returns 403 when a regular user passes another userId', async () => {
        const res = await request(app)
            .get(`/invitations?userId=${USER_UUID_OTHER}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('error', 'insufficient permissions');
    });

    it('returns 404 when admin filters by an unknown userId', async () => {
        mockFirst.mockResolvedValueOnce(undefined); // user lookup misses

        const res = await request(app)
            .get(`/invitations?userId=${USER_UUID_OTHER}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'user not found');
    });

    it('returns invitations for the looked-up email when admin filters by userId', async () => {
        mockUserListPipeline([sampleInvitation], 1);

        const res = await request(app)
            .get(`/invitations?userId=${USER_UUID_OTHER}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockWhere).toHaveBeenCalledWith('memberInvitations.email', 'user@test.com');
    });

    it('returns 403 when a regular user passes memberId', async () => {
        const res = await request(app)
            .get(`/invitations?memberId=${MEMBER_UUID}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('error', 'insufficient permissions');
    });

    it('returns invitations for the member when admin filters by memberId', async () => {
        mockMemberListPipeline([sampleInvitation], 1);

        const res = await request(app)
            .get(`/invitations?memberId=${MEMBER_UUID}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([sampleInvitation]);
        expect(mockWhere).toHaveBeenCalledWith('memberInvitations.memberId', MEMBER_UUID);
    });

    it('always applies the pending filters (acceptedAt null and expiresAt > now)', async () => {
        mockMemberListPipeline([sampleInvitation], 1);

        await request(app).get(`/invitations?memberId=${MEMBER_UUID}`).set('Authorization', `Bearer ${adminToken}`);

        expect(mockWhereNull).toHaveBeenCalledWith('memberInvitations.acceptedAt');
        expect(mockWhere).toHaveBeenCalledWith('memberInvitations.expiresAt', '>', expect.any(Date));
    });

    it('joins inviters and selects display name + email', async () => {
        mockMemberListPipeline([sampleInvitation], 1);

        await request(app).get(`/invitations?memberId=${MEMBER_UUID}`).set('Authorization', `Bearer ${adminToken}`);

        expect(mockJoin).toHaveBeenCalledWith('users as inviters', 'inviters.id', 'memberInvitations.invitedBy');
        expect(mockSelect).toHaveBeenCalledWith(
            'memberInvitations.id',
            'memberInvitations.memberId',
            'memberInvitations.invitedBy',
            'memberInvitations.email',
            'memberInvitations.type',
            'memberInvitations.description',
            'memberInvitations.expiresAt',
            'memberInvitations.createdAt',
            'members.firstName as memberFirstName',
            'members.lastName as memberLastName',
            'inviters.displayName as invitedByDisplayName',
            'inviters.email as invitedByEmail',
        );
    });

    it('applies page=2 and itemsPerPage=10', async () => {
        mockMemberListPipeline([sampleInvitation], 42);

        const res = await request(app)
            .get(`/invitations?memberId=${MEMBER_UUID}&page=2&itemsPerPage=10`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(mockLimit).toHaveBeenCalledWith(10);
        expect(mockOffset).toHaveBeenCalledWith(10);
        expect(res.body.pagination.totalPages).toBe(5);
    });
});

describe('GET /invitations/sent', () => {
    const sampleInvitation = {
        id: 'inv-1',
        memberId: 'member-1',
        invitedBy: USER_UUID_SELF,
        email: 'someone@test.com',
    };

    const mockList = (rows: unknown[], total: number) => {
        mockFirst.mockResolvedValueOnce({ total });
        mockOffset.mockResolvedValueOnce(rows);
    };

    it('returns envelope with defaults for invitations sent by current user', async () => {
        mockList([sampleInvitation], 1);

        const res = await request(app).get('/invitations/sent').set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: [sampleInvitation],
            pagination: {
                page: 1,
                itemsPerPage: 25,
                totalItems: 1,
                totalPages: 1,
            },
        });
        expect(mockWhere).toHaveBeenCalledWith('memberInvitations.invitedBy', USER_UUID_SELF);
    });

    it('applies page=2 and itemsPerPage=10', async () => {
        mockList([sampleInvitation], 42);

        const res = await request(app)
            .get('/invitations/sent?page=2&itemsPerPage=10')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(mockLimit).toHaveBeenCalledWith(10);
        expect(mockOffset).toHaveBeenCalledWith(10);
        expect(res.body.pagination.totalPages).toBe(5);
    });

    it('returns empty envelope when no sent invitations', async () => {
        mockList([], 0);

        const res = await request(app).get('/invitations/sent').set('Authorization', `Bearer ${userToken}`);

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

    it('orders results by memberInvitations.id ascending', async () => {
        mockList([sampleInvitation], 1);
        await request(app).get('/invitations/sent').set('Authorization', `Bearer ${userToken}`);
        expect(mockOrderBy).toHaveBeenCalledWith('memberInvitations.id', 'asc');
    });

    it.each([['page=0'], ['itemsPerPage=101']])('returns 400 for %s', async (qs) => {
        const res = await request(app).get(`/invitations/sent?${qs}`).set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
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
        mockFirst.mockResolvedValueOnce({
            id: USER_UUID_SELF,
            email: 'user@test.com',
        });

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
            id: USER_UUID_SELF,
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
            invitedBy: USER_UUID_SELF,
        });
        mockDel.mockResolvedValueOnce(1);

        const res = await request(app).delete('/invitations/inv-1').set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(204);
    });

    it('should return 404 if invitation not found', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app).delete('/invitations/nonexistent').set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'invitation not found');
    });
});

describe('GET /invitations/by-token/:token', () => {
    const validInvitationRow = {
        id: 'inv-1',
        email: 'invited@example.com',
        memberId: 'member-1',
        type: 'relative',
        description: 'father',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        acceptedAt: null,
        memberFirstName: 'Alice',
        memberLastName: 'Dupont',
    };

    it('returns 200 with userExists=true when a user already exists for the email', async () => {
        mockFirst.mockResolvedValueOnce(validInvitationRow);
        mockFirst.mockResolvedValueOnce({ id: 'uuid-existing', email: 'invited@example.com' });

        const res = await request(app).get('/invitations/by-token/abc123');

        expect(res.status).toBe(200);
        expect(res.body.userExists).toBe(true);
        expect(res.body.invitation).toMatchObject({
            id: 'inv-1',
            email: 'invited@example.com',
            memberId: 'member-1',
            memberFirstName: 'Alice',
            memberLastName: 'Dupont',
            type: 'relative',
            description: 'father',
        });
    });

    it('returns 200 with userExists=false when no user exists for the email', async () => {
        mockFirst.mockResolvedValueOnce(validInvitationRow);
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app).get('/invitations/by-token/abc123');

        expect(res.status).toBe(200);
        expect(res.body.userExists).toBe(false);
    });

    it('response body does not leak acceptedAt, token, or invitedBy', async () => {
        mockFirst.mockResolvedValueOnce(validInvitationRow);
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app).get('/invitations/by-token/abc123');

        expect(res.body.invitation).not.toHaveProperty('acceptedAt');
        expect(res.body.invitation).not.toHaveProperty('token');
        expect(res.body.invitation).not.toHaveProperty('invitedBy');
    });

    it('returns 404 when the token is not found', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app).get('/invitations/by-token/does-not-exist');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'invitation not found');
    });

    it('returns 400 when the invitation has expired', async () => {
        mockFirst.mockResolvedValueOnce({
            ...validInvitationRow,
            expiresAt: new Date(Date.now() - 60 * 1000),
        });

        const res = await request(app).get('/invitations/by-token/expired');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'invitation has expired');
    });

    it('returns 400 when the invitation has already been accepted', async () => {
        mockFirst.mockResolvedValueOnce({
            ...validInvitationRow,
            acceptedAt: new Date(),
        });

        const res = await request(app).get('/invitations/by-token/already-accepted');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'invitation already accepted');
    });

    it('does not require an Authorization header', async () => {
        mockFirst.mockResolvedValueOnce(validInvitationRow);
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app).get('/invitations/by-token/abc123');

        expect(res.status).toBe(200);
    });

    it('looks up the invitation with a case-sensitive token match', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app).get('/invitations/by-token/ABC123');

        expect(res.status).toBe(404);
        expect(mockWhere).toHaveBeenCalledWith({ 'memberInvitations.token': 'ABC123' });
    });
});

describe('POST /invitations/by-token/:token/register-and-accept', () => {
    const validInvitation = {
        id: 'inv-1',
        email: 'invited@example.com',
        memberId: 'member-1',
        type: 'relative',
        description: 'father',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        acceptedAt: null,
    };

    const validBody = {
        displayName: 'New User',
        password: 'supersecret',
    };

    it('creates the user + userMembers row + accepts the invitation and returns a JWT', async () => {
        mockFirst.mockResolvedValueOnce(validInvitation);
        mockFirst.mockResolvedValueOnce(undefined);
        mockTrxReturning.mockResolvedValueOnce([{ id: 'new-user-id', email: 'invited@example.com', role: 'user' }]);

        const res = await request(app).post('/invitations/by-token/abc123/register-and-accept').send(validBody);

        expect(res.status).toBe(201);
        expect(res.body.accessToken).toEqual(expect.any(String));

        const decoded = JSON.parse(Buffer.from(res.body.accessToken.split('.')[1], 'base64').toString());
        expect(decoded).toMatchObject({ sub: 'new-user-id', email: 'invited@example.com', role: 'user' });

        expect(mockTrxInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'invited@example.com',
                displayName: 'New User',
                password: 'hashed:password',
                role: 'user',
                emailVerifiedAt: expect.any(Date),
            }),
        );
        expect(mockTrxInsert).toHaveBeenCalledWith({
            userId: 'new-user-id',
            memberId: 'member-1',
            type: 'relative',
            description: 'father',
        });
        expect(mockTrxUpdate).toHaveBeenCalledWith({ acceptedAt: expect.any(Date) });
    });

    it('ignores any email field in the body and uses the invitation email instead', async () => {
        mockFirst.mockResolvedValueOnce(validInvitation);
        mockFirst.mockResolvedValueOnce(undefined);
        mockTrxReturning.mockResolvedValueOnce([{ id: 'new-user-id', email: 'invited@example.com', role: 'user' }]);

        const res = await request(app)
            .post('/invitations/by-token/abc123/register-and-accept')
            .send({ ...validBody, email: 'attacker@evil.com' });

        expect(res.status).toBe(201);
        expect(mockTrxInsert).toHaveBeenCalledWith(expect.objectContaining({ email: 'invited@example.com' }));
        expect(mockTrxInsert).not.toHaveBeenCalledWith(expect.objectContaining({ email: 'attacker@evil.com' }));
    });

    it('returns 404 when the token is not found', async () => {
        mockFirst.mockResolvedValueOnce(undefined);

        const res = await request(app).post('/invitations/by-token/nope/register-and-accept').send(validBody);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'invitation not found');
    });

    it('returns 400 when the invitation has expired', async () => {
        mockFirst.mockResolvedValueOnce({
            ...validInvitation,
            expiresAt: new Date(Date.now() - 60 * 1000),
        });

        const res = await request(app).post('/invitations/by-token/expired/register-and-accept').send(validBody);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'invitation has expired');
    });

    it('returns 400 when the invitation has already been accepted', async () => {
        mockFirst.mockResolvedValueOnce({
            ...validInvitation,
            acceptedAt: new Date(),
        });

        const res = await request(app).post('/invitations/by-token/accepted/register-and-accept').send(validBody);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'invitation already accepted');
    });

    it('returns 409 when a user already exists for the invited email', async () => {
        mockFirst.mockResolvedValueOnce(validInvitation);
        mockFirst.mockResolvedValueOnce({ id: 'existing-user-id', email: 'invited@example.com' });

        const res = await request(app).post('/invitations/by-token/abc123/register-and-accept').send(validBody);

        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/already exists/);
    });

    it.each([
        ['missing displayName', { password: 'supersecret' }],
        ['missing password', { displayName: 'New User' }],
        ['password too short', { displayName: 'New User', password: 'short' }],
    ])('returns 400 for %s', async (_label, body) => {
        const res = await request(app).post('/invitations/by-token/abc123/register-and-accept').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('does not require an Authorization header', async () => {
        mockFirst.mockResolvedValueOnce(validInvitation);
        mockFirst.mockResolvedValueOnce(undefined);
        mockTrxReturning.mockResolvedValueOnce([{ id: 'new-user-id', email: 'invited@example.com', role: 'user' }]);

        const res = await request(app).post('/invitations/by-token/abc123/register-and-accept').send(validBody);

        expect(res.status).toBe(201);
    });
});
