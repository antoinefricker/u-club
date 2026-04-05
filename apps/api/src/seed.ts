import { faker } from '@faker-js/faker/locale/fr';
import db from './db.js';
import { hashPassword } from './password.js';

const MEMBER_GENDERS = ['male', 'female'] as const;

interface TeamDef {
  label: string;
  gender: 'male' | 'female' | 'both';
}

function randomItem<T>(arr: readonly T[]): T {
  return faker.helpers.arrayElement(arr as T[]);
}

function generateCSGTeams(): TeamDef[] {
  const mixedCategories = ['U7', 'U9', 'Leisure'];
  const genderedCategories = ['U11', 'U13', 'U15', 'U18', 'U21', 'Senior'];
  const teams: TeamDef[] = [];

  for (const cat of mixedCategories) {
    const count = faker.number.int({ min: 1, max: 2 });
    for (let i = 0; i < count; i++) {
      const suffix = count > 1 ? ` ${i + 1}` : '';
      teams.push({ label: `${cat} Mixed${suffix}`, gender: 'both' });
    }
  }

  for (const cat of genderedCategories) {
    for (const gender of ['male', 'female'] as const) {
      const count = faker.number.int({ min: 1, max: 2 });
      const genderLabel = gender === 'male' ? 'Boys' : 'Girls';
      for (let i = 0; i < count; i++) {
        const suffix = count > 1 ? ` ${i + 1}` : '';
        teams.push({ label: `${cat} ${genderLabel} ${suffix}`, gender });
      }
    }
  }

  return teams;
}

function generateBaskinTeams(): TeamDef[] {
  return [
    { label: 'Baskin Senior', gender: 'both' },
    { label: 'Baskin Senior 2', gender: 'both' },
  ];
}

async function seed() {
  console.log('Seeding database...\n');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@u-club.app';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const managerEmail = process.env.SEED_MANAGER_EMAIL || 'manager@u-club.app';
  const managerPassword = process.env.SEED_MANAGER_PASSWORD || 'manager123';
  const defaultHashedPassword = await hashPassword('password123');

  // Create admin user
  await db('users').insert({
    display_name: 'Admin',
    email: adminEmail,
    password: await hashPassword(adminPassword),
    role: 'admin',
    email_verified_at: new Date(),
  });
  console.log(`  Admin: ${adminEmail}`);

  // Create manager user
  await db('users').insert({
    display_name: 'Manager',
    email: managerEmail,
    password: await hashPassword(managerPassword),
    role: 'manager',
    email_verified_at: new Date(),
  });
  console.log(`  Manager: ${managerEmail}`);

  // Create member statuses
  const statusLabels = ['pending validation', 'active', 'inactive'];
  const statusIds: string[] = [];
  for (const label of statusLabels) {
    const [status] = await db('member_statuses')
      .insert({ label })
      .returning('id');
    statusIds.push(status.id);
  }
  console.log(`  ${statusLabels.length} statuses created`);

  // Club definitions
  const clubs = [
    { name: 'CSG', code: 'CSG', teams: generateCSGTeams() },
    { name: "CSG Baskin'", code: 'CSGB', teams: generateBaskinTeams() },
  ];

  let totalMembers = 0;
  let totalUsers = 0;
  let totalAssignments = 0;
  const allMembers: { id: string; teamId: string }[] = [];

  for (const clubDef of clubs) {
    const [club] = await db('clubs')
      .insert({ name: clubDef.name, code: clubDef.code })
      .returning('id');
    console.log(`\n  Club: ${clubDef.name} (${clubDef.teams.length} teams)`);

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

      // Create 25 members per team
      for (let m = 0; m < 25; m++) {
        const memberGender = randomItem(MEMBER_GENDERS);
        const sex = memberGender === 'male' ? 'male' : 'female';
        const firstName = faker.person.firstName(sex);
        const lastName = faker.person.lastName();
        const birthDate = faker.date.birthdate({
          min: 2005,
          max: 2020,
          mode: 'year',
        });

        // 80% get a linked user
        let userId: string | null = null;
        if (Math.random() < 0.8) {
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${totalMembers}@seed.u-club.app`;
          const [user] = await db('users')
            .insert({
              display_name: `${firstName} ${lastName}`,
              email,
              password: defaultHashedPassword,
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
            status_id: randomItem(statusIds),
            first_name: firstName,
            last_name: lastName,
            birth_date: birthDate.toISOString().split('T')[0],
            gender: memberGender,
            year: 2026,
          })
          .returning('id');
        totalMembers++;

        const role = m < 2 ? 'coach' : m < 3 ? 'assistant' : 'player';
        await db('team_assignments').insert({
          team_id: team.id,
          member_id: member.id,
          role,
        });
        totalAssignments++;

        allMembers.push({ id: member.id, teamId: team.id });
      }
    }
  }

  // 20% of members belong to multiple teams — assign to a random other team
  const multiTeamCount = Math.floor(allMembers.length * 0.2);
  const shuffled = [...allMembers].sort(() => Math.random() - 0.5);
  let crossAssigned = 0;

  for (let i = 0; i < multiTeamCount; i++) {
    const member = shuffled[i];
    // Pick a random different team
    const otherMember =
      shuffled[(i + Math.floor(allMembers.length / 2)) % allMembers.length];
    if (otherMember.teamId === member.teamId) continue;

    try {
      await db('team_assignments').insert({
        team_id: otherMember.teamId,
        member_id: member.id,
        role: 'player',
      });
      crossAssigned++;
      totalAssignments++;
    } catch {
      // Skip if unique constraint violation (already assigned)
    }
  }

  console.log(`\nDone!`);
  console.log(`  ${totalMembers} members`);
  console.log(`  ${totalUsers} linked users`);
  console.log(
    `  ${totalAssignments} team assignments (${crossAssigned} cross-team)`,
  );

  await db.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
