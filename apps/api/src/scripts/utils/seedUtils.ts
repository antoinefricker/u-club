import db from '../../db.js';
import { hashPassword } from '../../password.js';
import type {
  Club,
  Team,
  TeamCategory,
  TeamGender,
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

export const insertMemberStatus = async (label: string) => {
  const [status] = await db('member_statuses')
    .insert({ label })
    .returning('id');
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

export const insertClub = async (club: {
  code: string;
  name: string;
  description?: string;
}): Promise<Club> => {
  const [createdClub] = await db('clubs')
    .insert({
      name: club.name,
      code: club.code,
      description: club.description,
    })
    .returning('*');
  return createdClub;
};

export const insertTeamCategory = async (category: {
  clubId: string;
  label: string;
}): Promise<TeamCategory> => {
  const [createdCategory] = await db('team_categories')
    .insert({
      club_id: category.clubId,
      label: category.label,
    })
    .returning('*');
  return createdCategory;
};

export const insertTeam = async (team: {
  clubId: string;
  label: string;
  gender: TeamGender;
}): Promise<Team> => {
  const [createdTeam] = await db('teams')
    .insert({
      club_id: team.clubId,
      label: team.label,
      gender: team.gender,
    })
    .returning('*');
  return createdTeam;
};
