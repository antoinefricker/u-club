import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestToken } from '../../test-utils.js';

const mockSelect = vi.fn().mockReturnThis();
const mockJoin = vi.fn().mockReturnThis();
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
            join: mockJoin,
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
const userToken = createTestToken('uuid-2', 'user@example.com', 'user');

const sampleAssignment = {
    id: 'assign-1',
    teamId: 'team-1',
    memberId: 'member-1',
    role: 'player',
    createdAt: '2026-01-01T00:00:00.000Z',
};

const sampleMemberWithRole = {
    id: 'member-1',
    email: 'player@example.com',
    displayName: 'Test Player',
    role: 'player',
    assignedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
    mockJoin.mockReturnThis();
    mockWhere.mockReturnThis();
    mockInsert.mockReturnThis();
    mockUpdate.mockReturnThis();
});

describe('GET /teams/:teamId/members', () => {
    it('should return a list of team members', async () => {
        mockSelect.mockResolvedValueOnce([sampleMemberWithRole]);

        const res = await request(app).get('/teams/team-1/members').set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([sampleMemberWithRole]);
    });
});

describe('POST /teams/:teamId/members', () => {
    it('should return 400 if memberId is missing', async () => {
        const res = await request(app)
            .post('/teams/team-1/members')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'player' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 400 if role is missing', async () => {
        const res = await request(app)
            .post('/teams/team-1/members')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ memberId: 'member-1' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 400 if role is invalid', async () => {
        const res = await request(app)
            .post('/teams/team-1/members')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ memberId: 'member-1', role: 'goalkeeper' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('should return 409 if member is already assigned', async () => {
        mockFirst.mockResolvedValueOnce(sampleAssignment);

        const res = await request(app)
            .post('/teams/team-1/members')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ memberId: 'member-1', role: 'player' });

        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty('error', 'Member is already assigned to this team');
    });

    it('should create an assignment and return 201', async () => {
        mockFirst.mockResolvedValueOnce(undefined);
        mockReturning.mockResolvedValueOnce([sampleAssignment]);

        const res = await request(app)
            .post('/teams/team-1/members')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ memberId: 'member-1', role: 'player' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(sampleAssignment);
    });
});

describe('PUT /teams/:teamId/members/:memberId', () => {
    it('returns 400 if role is missing', async () => {
        const res = await request(app)
            .put('/teams/team-1/members/member-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('returns 400 if role is invalid', async () => {
        const res = await request(app)
            .put('/teams/team-1/members/member-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'goalkeeper' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'validation error');
    });

    it('returns 404 when assignment is missing', async () => {
        mockReturning.mockResolvedValueOnce([]);

        const res = await request(app)
            .put('/teams/team-1/members/missing')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'coach' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Assignment not found');
    });

    it('updates and returns the assignment', async () => {
        const updated = { ...sampleAssignment, role: 'coach' };
        mockReturning.mockResolvedValueOnce([updated]);

        const res = await request(app)
            .put('/teams/team-1/members/member-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'coach' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).put('/teams/team-1/members/member-1').send({ role: 'coach' });
        expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as a regular user', async () => {
        const res = await request(app)
            .put('/teams/team-1/members/member-1')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ role: 'coach' });
        expect(res.status).toBe(403);
    });
});

describe('DELETE /teams/:teamId/members/:memberId', () => {
    it('should return 404 if assignment not found', async () => {
        mockDel.mockResolvedValueOnce(0);

        const res = await request(app)
            .delete('/teams/team-1/members/member-1')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Assignment not found');
    });

    it('should delete and return 204', async () => {
        mockDel.mockResolvedValueOnce(1);

        const res = await request(app)
            .delete('/teams/team-1/members/member-1')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(204);
    });
});
