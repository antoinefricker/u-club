import db from './db.js';

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
  console.log('\n  +--------------------------+');
  console.log('  |   CLEARING DATABASE...   |');
  console.log('  +--------------------------+\n');

  for (const table of tables) {
    const count = await db(table).del();
    console.log(`  - ${table} ${count > 0 ? `(${count} rows)` : '(empty)'}`);
  }

  console.log('\n  All clean! Fresh as a whistle.\n');
  await db.destroy();
}

clear().catch((err) => {
  console.error('Seed clear failed:', err);
  process.exit(1);
});
