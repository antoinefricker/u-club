import db from './db.js';

async function clear() {
  console.log('Clearing database...');

  // Order matters — delete from tables with FK dependencies first
  await db('team_assignments').del();
  console.log('  team_assignments cleared');

  await db('members').del();
  console.log('  members cleared');

  await db('member_statuses').del();
  console.log('  member_statuses cleared');

  await db('teams').del();
  console.log('  teams cleared');

  await db('clubs').del();
  console.log('  clubs cleared');

  await db('login_tokens').del();
  console.log('  login_tokens cleared');

  await db('revoked_tokens').del();
  console.log('  revoked_tokens cleared');

  await db('users').del();
  console.log('  users cleared');

  console.log('\nDone! All data cleared.');
  await db.destroy();
}

clear().catch((err) => {
  console.error('Clear failed:', err);
  process.exit(1);
});
