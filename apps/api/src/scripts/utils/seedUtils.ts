import db from '../../db.js';
import { hashPassword } from '../../password.js';
import type {
    Club,
    Member,
    MemberStatus,
    Team,
    TeamAssignment,
    TeamCategory,
    User,
    UserMember,
} from '../../types/index.js';

export const hashedPassword = await hashPassword(process.env.SEED_PASSWORD || 'password123');

export const checkDbConnection = async () => {
    try {
        await db.raw('SELECT 1');
    } catch {
        throw new Error('Unable to connect to the database. Is Postgres running?');
    }
};

export const dbClear = async (): Promise<string[]> => {
    const tables = [
        'memberInvitations',
        'userMembers',
        'teamAssignments',
        'members',
        'memberStatuses',
        'teams',
        'teamCategories',
        'clubs',
        'authTokens',
        'revokedTokens',
        'users',
    ];

    const results: string[] = [];
    for (const table of tables) {
        const count = await db(table).del();
        if (count > 0) {
            results.push(`${table} (${count})`);
        }
    }
    return results;
};

export const insertMemberStatus = async (label: string): Promise<MemberStatus> => {
    const [status] = await db('memberStatuses').insert({ label }).returning('*');
    return status;
};

export const insertMember = async (
    member: Pick<Member, 'statusId' | 'firstName' | 'lastName' | 'birthdate' | 'gender'>,
): Promise<Member> => {
    const [createdMember] = await db('members').insert(member).returning('*');
    return createdMember;
};

export const insertTeamAssignment = async (
    assignment: Pick<TeamAssignment, 'teamId' | 'memberId' | 'role'>,
): Promise<TeamAssignment> => {
    const [createdAssignment] = await db('teamAssignments').insert(assignment).returning('*');
    return createdAssignment;
};

export const insertUser = async (
    user: Pick<User, 'email' | 'displayName' | 'role'> & Partial<Pick<User, 'emailVerifiedAt'>>,
): Promise<User> => {
    const [createdUser] = await db('users')
        .insert({
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            password: hashedPassword,
            emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
        })
        .returning('*');
    return createdUser;
};

export const insertUserMemberLink = async (
    link: Pick<UserMember, 'userId' | 'memberId' | 'type' | 'description'>,
): Promise<UserMember> => {
    const [createdLink] = await db('userMembers').insert(link).returning('*');
    return createdLink;
};

export const insertClub = async (club: Pick<Club, 'name' | 'code' | 'description'>): Promise<Club> => {
    const [createdClub] = await db('clubs').insert(club).returning('*');
    return createdClub;
};

export const insertTeamCategory = async (category: Pick<TeamCategory, 'clubId' | 'label'>): Promise<TeamCategory> => {
    const [createdCategory] = await db('teamCategories').insert(category).returning('*');
    return createdCategory;
};

export const insertTeam = async (team: Pick<Team, 'clubId' | 'categoryId' | 'label' | 'gender'>): Promise<Team> => {
    const [createdTeam] = await db('teams').insert(team).returning('*');
    return createdTeam;
};
