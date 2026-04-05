import { intro, outro, spinner, log, confirm, isCancel } from '@clack/prompts';
import { faker } from '@faker-js/faker/locale/fr';
import { execSync } from 'node:child_process';
import db from './db.js';
import { hashPassword } from './password.js';

const force = process.argv.includes('--force');

const CATEGORIES = [
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U18',
  'U21',
  'Senior',
  'Leisure',
] as const;
type Category = (typeof CATEGORIES)[number];

const MIXED_CATEGORIES: Category[] = ['U7', 'U9', 'Leisure'];

interface TeamDef {
  label: string;
  category: Category;
  gender: 'male' | 'female' | 'both';
}

function generateTeams(
  categories: readonly Category[],
  count: number,
): TeamDef[] {
  const teams: TeamDef[] = [];

  for (let i = 0; i < count; i++) {
    const category = faker.helpers.arrayElement(categories as Category[]);
    const gender: 'male' | 'female' | 'both' = MIXED_CATEGORIES.includes(
      category,
    )
      ? 'both'
      : faker.helpers.arrayElement(['male', 'female'] as const);

    const sameTeams = teams.filter(
      (t) => t.category === category && t.gender === gender,
    );
    const index = sameTeams.length + 1;
    const genderLabel =
      gender === 'both' ? '' : ` ${gender === 'male' ? 'M' : 'F'}`;

    teams.push({
      category,
      gender,
      label: `${category}${genderLabel} ${index}`,
    });
  }

  return teams;
}

function generateBaskinTeams(): TeamDef[] {
  return [
    { label: 'Lions', category: 'Senior', gender: 'both' },
    { label: 'Tigres', category: 'Senior', gender: 'both' },
    { label: 'Cubs', category: 'Senior', gender: 'both' },
  ];
}

async function seed() {
  intro('SEED DATABASE');

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
      message: 'This will clear and seed the database. Continue?',
    });
    if (isCancel(shouldContinue) || !shouldContinue) {
      outro('Aborted.');
      await db.destroy();
      process.exit(0);
    }
  }

  // Clear first
  log.step('Clearing existing data');
  execSync('pnpm seed:clear -- --force', {
    stdio: 'inherit',
    cwd: new URL('..', import.meta.url).pathname,
  });

  const s = spinner();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@u-club.app';
  const managerEmail = process.env.SEED_MANAGER_EMAIL || 'manager@u-club.app';
  const seedPassword = process.env.SEED_PASSWORD || 'password123';

  s.start('Hashing passwords');
  const hashedPassword = await hashPassword(seedPassword);
  s.stop('Passwords hashed');

  // Users
  s.start('Creating users');
  await db('users').insert({
    display_name: 'Admin',
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
    email_verified_at: new Date(),
  });
  await db('users').insert({
    display_name: 'Manager',
    email: managerEmail,
    password: hashedPassword,
    role: 'manager',
    email_verified_at: new Date(),
  });
  s.stop('Users created');
  log.info(`Admin   : ${adminEmail} / ${seedPassword}`);
  log.info(`Manager : ${managerEmail} / ${seedPassword}`);
  log.info(`Members : password123`);

  // Member statuses
  s.start('Creating member statuses');
  const statusLabels = ['pending validation', 'active', 'inactive'];
  const statusIds: string[] = [];
  for (const label of statusLabels) {
    const [status] = await db('member_statuses')
      .insert({ label })
      .returning('id');
    statusIds.push(status.id);
  }
  s.stop(`${statusLabels.length} statuses created`);

  // Clubs
  const clubDefs = [
    { name: 'CSG', code: 'CSG', teams: generateTeams(CATEGORIES, 24) },
    {
      name: "CSG Baskin'",
      code: 'CSGB',
      teams: generateBaskinTeams(),
    },
  ];

  let totalMembers = 0;
  let totalUsers = 0;
  let totalAssignments = 0;
  const allMembers: { id: string; teamId: string }[] = [];

  for (const clubDef of clubDefs) {
    s.start(`Creating "${clubDef.name}" — ${clubDef.teams.length} teams`);

    const [club] = await db('clubs')
      .insert({ name: clubDef.name, code: clubDef.code })
      .returning('id');

    for (const teamDef of clubDef.teams) {
      const [team] = await db('teams')
        .insert({
          club_id: club.id,
          label: teamDef.label,
          year: 2026,
          gender: teamDef.gender,
          description: `${clubDef.name} - ${teamDef.label}`,
        })
        .returning('id');

      const memberCount = faker.number.int({ min: 18, max: 28 });

      for (let m = 0; m < memberCount; m++) {
        const memberGender = faker.helpers.arrayElement([
          'male',
          'female',
        ] as const);
        const sex = memberGender === 'male' ? 'male' : 'female';
        const firstName = faker.person.firstName(sex);
        const lastName = faker.person.lastName();
        const birthDate = faker.date.birthdate({
          min: 2005,
          max: 2020,
          mode: 'year',
        });

        let userId: string | null = null;
        if (Math.random() < 0.8) {
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${totalMembers}@seed.u-club.app`;
          const [user] = await db('users')
            .insert({
              display_name: `${firstName} ${lastName}`,
              email,
              password: hashedPassword,
              role: 'user',
              email_verified_at: new Date(),
            })
            .returning('id');
          userId = user.id;
          totalUsers++;
        }

        const [member] = await db('members')
          .insert({
            user_id: userId,
            status_id: faker.helpers.arrayElement(statusIds),
            first_name: firstName,
            last_name: lastName,
            birth_date: birthDate.toISOString().split('T')[0],
            gender: memberGender,
            year: 2026,
          })
          .returning('id');
        totalMembers++;

        const role = m < 2 ? 'coach' : m < 4 ? 'assistant' : 'player';
        await db('team_assignments').insert({
          team_id: team.id,
          member_id: member.id,
          role,
        });
        totalAssignments++;

        allMembers.push({ id: member.id, teamId: team.id });
      }
    }

    s.stop(`"${clubDef.name}" — ${clubDef.teams.length} teams created`);
  }

  // Cross-team assignments (20%)
  s.start('Creating cross-team assignments');
  const multiTeamCount = Math.floor(allMembers.length * 0.2);
  const shuffled = [...allMembers].sort(() => Math.random() - 0.5);
  let crossAssigned = 0;

  for (let i = 0; i < multiTeamCount; i++) {
    const member = shuffled[i];
    const other =
      shuffled[(i + Math.floor(allMembers.length / 2)) % allMembers.length];
    if (other.teamId === member.teamId) continue;

    try {
      await db('team_assignments').insert({
        team_id: other.teamId,
        member_id: member.id,
        role: 'player',
      });
      crossAssigned++;
      totalAssignments++;
    } catch {
      // unique constraint — skip
    }
  }
  s.stop(`${crossAssigned} cross-team assignments created`);

  log.success(`${totalMembers} members`);
  log.success(`${totalUsers} linked users`);
  log.success(`${totalAssignments} team assignments`);

  outro('Database seeded!');
  await db.destroy();
}

seed().catch((err) => {
  log.error(String(err));
  process.exit(1);
});
