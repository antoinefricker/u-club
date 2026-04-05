import { intro, outro, spinner, log, confirm, isCancel } from '@clack/prompts';
import db from './db.js';

const force = process.argv.includes('--force');

const tables = [
  'team_assignments',
  'members',
  'member_statuses',
  'teams',
  'clubs',
  'login_tokens',
  'revoked_tokens',
  'users',
];

async function clear() {
  intro('CLEAR DATABASE');

  // Check DB connection
  try {
    await db.raw('SELECT 1');
  } catch {
    log.error('Unable to connect to the database. Is Postgres running?');
    outro('Aborted.');
    process.exit(1);
  }

  if (!force) {
    const shouldContinue = await confirm({
      message: 'This will delete ALL data. Continue?',
    });
    if (isCancel(shouldContinue) || !shouldContinue) {
      outro('Aborted.');
      await db.destroy();
      process.exit(0);
    }
  }

  const s = spinner();
  s.start('Deleting all data');

  const results: string[] = [];
  for (const table of tables) {
    const count = await db(table).del();
    if (count > 0) results.push(`${table} (${count} rows)`);
  }

  s.stop('All tables cleared');

  if (results.length > 0) {
    for (const r of results) log.info(r);
  } else {
    log.info('Database was already empty');
  }

  outro('All clean!');
  await db.destroy();
}

clear().catch((err) => {
  log.error(String(err));
  process.exit(1);
});
