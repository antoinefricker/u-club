import { seedClear } from './seedClear.js';
import CONFIG from './utils/seedConfiguration.js';
import { insertClub, insertTeamCategory } from './utils/seedUtils.js';
import { Logger } from './utils/logUtils.js';
import type { Club, TeamCategory } from '../types/index.js';
import { emojis } from './utils/emojis.js';

type Seeded = {
  clubs: Club[];
  team_categories: TeamCategory[];
};

async function seedCreate(force: boolean) {
  await seedClear(force);
  Logger.nl(2);

  const seeded: Seeded = {
    clubs: [],
    team_categories: [],
  };

  Logger.title('CLUBS');
  Logger.nl();
  for (const club of CONFIG.clubs) {
    const createdClub = await insertClub(club);
    Logger.info(`${createdClub.name} (${createdClub.code})`, ' ');
    seeded.clubs.push(createdClub);
  }
  Logger.nl();
  Logger.info(`Created ${seeded.clubs.length} clubs`);
  Logger.nl(2);

  Logger.title('TEAM CATEGORIES');
  Logger.nl();
  for (let i = 0; i < CONFIG.clubs.length; i++) {
    const club = CONFIG.clubs[i];
    const createdClub = seeded.clubs[i];
    for (const category of club.categories) {
      const createdCategory = await insertTeamCategory({
        clubId: createdClub.id,
        label: category.name,
      });
      Logger.info([createdCategory.label, createdClub.name], ' ');
      seeded.team_categories.push(createdCategory);
    }
  }
  Logger.nl();
  Logger.info(`Created ${seeded.team_categories.length} team categories`);
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
