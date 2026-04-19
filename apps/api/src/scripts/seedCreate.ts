import { seedClear } from './seedClear.js';
import CONFIG from './utils/seedConfiguration.js';
import {
  insertClub,
  insertMemberStatus,
  insertTeam,
  insertTeamCategory,
} from './utils/seedUtils.js';
import { Logger } from './utils/logUtils.js';
import type {
  Club,
  MemberStatus,
  Team,
  TeamCategory,
  TeamGender,
} from '../types/index.js';
import { emojis } from './utils/emojis.js';

type Seeded = {
  clubs: Club[];
  teamCategories: TeamCategory[];
  teams: Team[];
  memberStatuses: MemberStatus[];
};

async function seedCreate(force: boolean) {
  await seedClear(force);
  Logger.nl(2);

  const seeded: Seeded = {
    clubs: [],
    teamCategories: [],
    teams: [],
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

  for (let i = 0; i < CONFIG.clubs.length; i++) {
    const club = CONFIG.clubs[i];
    const createdClub = seeded.clubs[i];
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
            club_id: createdClub.id,
            category_id: createdCategory.id,
            label,
            gender: genderConfig.type,
          });
          Logger.info([createdTeam.label, createdClub.name], ' ');
          seeded.teams.push(createdTeam);
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
