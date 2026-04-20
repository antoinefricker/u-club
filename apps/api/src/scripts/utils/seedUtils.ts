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

export const hashedPassword = await hashPassword(
  process.env.SEED_PASSWORD || 'password123',
);

export const checkDbConnection = async () => {
  try {
    await db.raw('SELECT 1');
  } catch {
    throw new Error('Unable to connect to the database. Is Postgres running?');
  }
};

export const dbClear = async (): Promise<string[]> => {
  const tables = [
    'member_invitations',
    'user_members',
    'team_assignments',
    'members',
    'member_statuses',
    'teams',
    'team_categories',
    'clubs',
    'auth_tokens',
    'revoked_tokens',
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

export const insertMemberStatus = async (
  label: string,
): Promise<MemberStatus> => {
  const [status] = await db('member_statuses').insert({ label }).returning('*');
  return status;
};

export const insertMember = async (
  member: Pick<
    Member,
    'status_id' | 'first_name' | 'last_name' | 'birthdate' | 'gender'
  >,
): Promise<Member> => {
  const [createdMember] = await db('members').insert(member).returning('*');
  return createdMember;
};

export const insertTeamAssignment = async (
  assignment: Pick<TeamAssignment, 'team_id' | 'member_id' | 'role'>,
): Promise<TeamAssignment> => {
  const [createdAssignment] = await db('team_assignments')
    .insert(assignment)
    .returning('*');
  return createdAssignment;
};

export const insertUser = async (
  user: Pick<User, 'email' | 'display_name' | 'role'> &
    Partial<Pick<User, 'email_verified_at'>>,
): Promise<User> => {
  const [createdUser] = await db('users')
    .insert({
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      password: hashedPassword,
      email_verified_at: user.email_verified_at ?? new Date().toISOString(),
    })
    .returning('*');
  return createdUser;
};

export const insertUserMemberLink = async (
  link: Pick<UserMember, 'user_id' | 'member_id' | 'type' | 'description'>,
): Promise<UserMember> => {
  const [createdLink] = await db('user_members').insert(link).returning('*');
  return createdLink;
};

export const insertClub = async (
  club: Pick<Club, 'name' | 'code' | 'description'>,
): Promise<Club> => {
  const [createdClub] = await db('clubs').insert(club).returning('*');
  return createdClub;
};

export const insertTeamCategory = async (
  category: Pick<TeamCategory, 'club_id' | 'label'>,
): Promise<TeamCategory> => {
  const [createdCategory] = await db('team_categories')
    .insert(category)
    .returning('*');
  return createdCategory;
};

export const insertTeam = async (
  team: Pick<Team, 'club_id' | 'category_id' | 'label' | 'gender'>,
): Promise<Team> => {
  const [createdTeam] = await db('teams').insert(team).returning('*');
  return createdTeam;
};
