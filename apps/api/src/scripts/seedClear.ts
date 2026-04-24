import * as readline from 'node:readline';
import db from '../db.js';
import { Logger } from './utils/logUtils.js';
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
        const shouldContinue = await confirm('This will delete ALL data. Continue?');
        if (!shouldContinue) {
            Logger.info('Aborted.');
            await db.destroy();
            process.exit(0);
        }
    }

    Logger.title('CLEARING DATABASE');
    Logger.nl();
    const results = await dbClear();
    if (results.length > 0) {
        for (const entry of results) {
            Logger.info(entry, ' ');
        }
        Logger.nl();
        Logger.info(`Cleared: ${results.join(', ')}`);
    } else {
        Logger.info('Database was already empty');
    }
    Logger.nl(2);
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
