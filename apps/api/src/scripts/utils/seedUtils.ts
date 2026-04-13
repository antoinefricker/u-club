import db from '../../db.js';
import { hashPassword } from '../../password.js';
import { outro, spinner, log } from '@clack/prompts';

export const hashedPassword = await hashPassword(
  process.env.SEED_PASSWORD || 'password123',
);

export const checkDbConnection = async () => {
  try {
    await db.raw('SELECT 1');
  } catch {
    log.error('Unable to connect to the database. Is Postgres running?');
    outro('Aborted');
    process.exit(1);
  }
};

export const dbClear = async () => {
  const tables = [
    'member_invitations',
    'user_members',
    'team_assignments',
    'members',
    'member_statuses',
    'teams',
    'clubs',
    'auth_tokens',
    'revoked_tokens',
    'users',
  ];

  const s = spinner();
  s.start('Deleting all data');
  const results: string[] = [];
  for (const table of tables) {
    const count = await db(table).del();
    if (count > 0) {
      results.push(`${table} (${count} rows)`);
    }
  }
  s.stop('Deleted all data');

  if (results.length > 0) {
    for (const r of results) {
      log.info(r);
    }
  } else {
    log.info('Database was already empty');
  }

  await db.destroy();
};
