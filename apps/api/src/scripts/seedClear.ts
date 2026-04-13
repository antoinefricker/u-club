import { intro, outro, log, confirm, isCancel } from '@clack/prompts';
import db from '../db.js';
import { checkDbConnection, dbClear } from './utils/seedUtils.js';

async function seedClear(force: boolean) {
  intro('CLEAR DATABASE');

  await checkDbConnection();

  if (!force) {
    const shouldContinue = await confirm({
      message: 'This will delete ALL data. Continue?',
    });
    if (isCancel(shouldContinue) || !shouldContinue) {
      outro('Aborted');
      await db.destroy();
      process.exit(0);
    }
  }

  await dbClear();
  outro('All clean!');
}

seedClear(process.argv.includes('--force')).catch((err) => {
  log.error(String(err));
  process.exit(1);
});
