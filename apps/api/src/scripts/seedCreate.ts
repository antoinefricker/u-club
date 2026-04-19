import { faker } from '@faker-js/faker/locale/fr';

import { seedClear } from './seedClear.js';
import CONFIG from './utils/seedConfiguration.js';
import {
  insertClub,
  insertMember,
  insertMemberStatus,
  insertTeam,
  insertTeamAssignment,
  insertTeamCategory,
} from './utils/seedUtils.js';
import { Logger } from './utils/logUtils.js';
import type {
  Club,
  Member,
  MemberGender,
  MemberStatus,
  Team,
  TeamAssignment,
  TeamCategory,
  TeamGender,
} from '../types/index.js';
import { emojis } from './utils/emojis.js';

type Seeded = {
  clubs: Club[];
  teamCategories: TeamCategory[];
  teams: Team[];
  members: Member[];
  teamAssignments: TeamAssignment[];
  memberStatuses: MemberStatus[];
};

type TeamInfo = {
  team: Team;
  club: Club;
  ageRange: [number, number];
};

const toDateString = (date: Date): string => date.toISOString().split('T')[0];

async function seedCreate(force: boolean) {
  await seedClear(force);
  Logger.nl(2);

  const seeded: Seeded = {
    clubs: [],
    teamCategories: [],
    teams: [],
    members: [],
    teamAssignments: [],
    memberStatuses: [],
  };

  // -------------------------- clubs
  Logger.title('CLUBS');
  Logger.nl();
  for (const club of CONFIG.clubs) {
    const createdClub = await insertClub({
      name: club.name,
      code: club.code,
      description: null,
    });
    Logger.info(`${createdClub.name} (${createdClub.code})`, ' ');
    seeded.clubs.push(createdClub);
  }
  Logger.nl();
  Logger.info(`Created ${seeded.clubs.length} clubs`);
  Logger.nl(2);

  // -------------------------- team categories
  Logger.title('TEAM CATEGORIES');
  Logger.nl();
  const categoriesByClub: TeamCategory[][] = [];
  for (let i = 0; i < CONFIG.clubs.length; i++) {
    const club = CONFIG.clubs[i];
    const createdClub = seeded.clubs[i];
    const createdCategories: TeamCategory[] = [];
    for (const category of club.categories) {
      const createdCategory = await insertTeamCategory({
        club_id: createdClub.id,
        label: category.name,
      });
      Logger.info([createdCategory.label, createdClub.name], ' ');
      seeded.teamCategories.push(createdCategory);
      createdCategories.push(createdCategory);
    }
    categoriesByClub.push(createdCategories);
  }
  Logger.nl();
  Logger.info(`Created ${seeded.teamCategories.length} team categories`);
  Logger.nl(2);

  // -------------------------- teams
  Logger.title('TEAMS');
  Logger.nl();

  const labelForGender: Record<TeamGender, string> = {
    male: 'M',
    female: 'F',
    mixed: '',
  };

  const teamInfos: TeamInfo[] = [];
  for (let i = 0; i < CONFIG.clubs.length; i++) {
    const club = CONFIG.clubs[i];
    const linkedClub = seeded.clubs[i];
    for (let j = 0; j < club.categories.length; j++) {
      const category = club.categories[j];
      const createdCategory = categoriesByClub[i][j];
      for (const genderConfig of category.genders) {
        for (let n = 0; n < genderConfig.teams; n++) {
          const label =
            genderConfig.teams === 1
              ? `${category.name} ${labelForGender[genderConfig.type]}`
              : `${category.name} ${labelForGender[genderConfig.type]} ${n + 1}`;
          const createdTeam = await insertTeam({
            club_id: linkedClub.id,
            category_id: createdCategory.id,
            label,
            gender: genderConfig.type,
          });
          Logger.info([createdTeam.label, linkedClub.name], ' ');
          seeded.teams.push(createdTeam);
          teamInfos.push({
            team: createdTeam,
            club: linkedClub,
            ageRange: category.ageRange,
          });
        }
      }
    }
  }
  Logger.nl();
  Logger.info(`Created ${seeded.teams.length} teams`);
  Logger.nl(2);

  // -------------------------- member statuses
  Logger.title('MEMBER STATUSES');
  Logger.nl();
  for (const label of CONFIG.memberStatuses) {
    const createdMemberStatus = await insertMemberStatus(label);
    Logger.info(createdMemberStatus.label, ' ');
    seeded.memberStatuses.push(createdMemberStatus);
  }
  Logger.nl();
  Logger.info(`Created ${seeded.memberStatuses.length} statuses`);
  Logger.nl(2);

  // -------------------------- members & team assignments
  Logger.title('MEMBERS');
  Logger.nl();

  const activeStatus =
    seeded.memberStatuses.find((s) => s.label === 'active') ??
    seeded.memberStatuses[0];

  for (const { team, club, ageRange } of teamInfos) {
    const playerCount = faker.number.int({ min: 10, max: 15 });

    for (let p = 0; p < playerCount; p++) {
      const gender: MemberGender =
        team.gender === 'mixed'
          ? faker.helpers.arrayElement<MemberGender>(['male', 'female'])
          : team.gender;
      const player = await insertMember({
        status_id: activeStatus.id,
        first_name: faker.person.firstName(gender),
        last_name: faker.person.lastName(),
        birthdate: toDateString(
          faker.date.birthdate({
            min: ageRange[0],
            max: ageRange[1],
            mode: 'age',
          }),
        ),
        gender,
      });
      seeded.members.push(player);
      const assignment = await insertTeamAssignment({
        team_id: team.id,
        member_id: player.id,
        role: 'player',
      });
      seeded.teamAssignments.push(assignment);
    }

    const coachGender = faker.helpers.arrayElement<MemberGender>([
      'male',
      'female',
    ]);
    const coach = await insertMember({
      status_id: activeStatus.id,
      first_name: faker.person.firstName(coachGender),
      last_name: faker.person.lastName(),
      birthdate: toDateString(
        faker.date.birthdate({ min: 25, max: 55, mode: 'age' }),
      ),
      gender: coachGender,
    });
    seeded.members.push(coach);
    const coachAssignment = await insertTeamAssignment({
      team_id: team.id,
      member_id: coach.id,
      role: 'coach',
    });
    seeded.teamAssignments.push(coachAssignment);

    Logger.info(
      [team.label, club.name, `${playerCount} players + 1 coach`],
      ' ',
    );
  }

  Logger.nl();
  Logger.info(
    `Created ${seeded.members.length} members, ${seeded.teamAssignments.length} team assignments`,
  );
  Logger.nl(2);

  // -------------------------- conclusion
  Logger.nl(1);
  Logger.title(`${emojis.magic} Seeding complete`);
  process.exit(0);
}

// only self-execute when run directly vs imported
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCreate(process.argv.includes('--force')).catch((err) => {
    console.error(String(err));
    process.exit(1);
  });
}
