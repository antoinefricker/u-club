import * as readline from 'node:readline';
import { Listr } from 'listr2';
import db from '../db.js';
import { checkDbConnection, dbClear } from './utils/seedUtils.js';

function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

export async function seedClear(force: boolean) {
  await checkDbConnection();

  if (!force) {
    const shouldContinue = await confirm(
      'This will delete ALL data. Continue?',
    );
    if (!shouldContinue) {
      console.log('Aborted.');
      await db.destroy();
      process.exit(0);
    }
  }

  const tasks = new Listr([
    {
      title: 'Clearing database',
      task: async (_, task) => {
        const results = await dbClear();
        task.title =
          results.length > 0
            ? `Cleared: ${results.join(', ')}`
            : 'Database was already empty';
      },
    },
  ]);

  await tasks.run();
}

// only self-execute when run directly vs imported
if (import.meta.url === `file://${process.argv[1]}`) {
  seedClear(process.argv.includes('--force'))
    .then(() => db.destroy())
    .catch((err) => {
      console.error(String(err));
      process.exit(1);
    });
}
