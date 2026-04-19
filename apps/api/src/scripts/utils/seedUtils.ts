import db from '../../db.js';
import { hashPassword } from '../../password.js';
import type {
  Club,
  MemberStatus,
  Team,
  TeamCategory,
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

export const insertMember = async (member: {
  statusId: string;
  firstName: string;
  lastName: string;
  birthdate: Date;
  gender: 'male' | 'female';
}) => {
  const [memberId] = await db('members').insert(member).returning('id');
  return { ...member, id: memberId };
};

export const insertUser = async ({
  emailVerifiedAt,
  ...user
}: {
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'member';
  emailVerifiedAt?: Date | null;
}) => {
  const [userId] = await db('users')
    .insert({
      ...user,
      password: hashedPassword,
      email_verified_at: emailVerifiedAt || new Date(),
    })
    .returning('id');
  return { ...user, id: userId };
};

export const insertUserMemberLink = async (insertedLink: {
  userId: string;
  memberId: string;
  type: 'self' | 'relative';
  description?: string;
}) => {
  await db('user_members').insert(insertedLink);
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
