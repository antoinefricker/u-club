import { emojis } from './emojis.js';
import readline from 'readline';

const TAB_STOPS = [3, 20, 40, 60];
const LINE_LENGTH = TAB_STOPS.reduce((sum, stop) => sum + stop, 0);
const CHAR_LINE = '─';

const SEPARATOR = CHAR_LINE.repeat(LINE_LENGTH);

export const Logger = {
    separator: () => console.log(SEPARATOR),

    title: (message: string) =>
        console.log(
            message + ' ' + CHAR_LINE.repeat(LINE_LENGTH - message.length - 1),
        ),

    nl: (iterations: number = 1) => {
        for (let i = 0; i < iterations; i++) {
            console.log('');
        }
    },

    error: (message: Message, icon?: string) =>
        console.error(formatMessage(message, icon)),

    warn: (message: Message, icon?: string) =>
        console.warn(formatMessage(message, icon)),

    info: (message: Message, icon?: string) =>
        console.log(formatMessage(message, icon)),

    success: (message: Message, icon?: string) =>
        console.log(formatMessage(message, icon)),

    status: (
        status: 'error' | 'warning' | 'success' | boolean,
        message: Message,
    ) => {
        const icon =
            status === 'error' || status === false
                ? emojis.statusRed
                : status === 'warning'
                  ? emojis.statusYellow
                  : emojis.statusGreen;
        console.log(formatMessage(message, icon));
    },

    select: async <T>(
        message: string,
        options: Array<{ value: T; label: string }>,
    ): Promise<T> => {
        const optionsStr = options
            .map((option, i) => `${i + 1}. ${option.label}`)
            .join('\n');
        const fullPrompt = `${message}\n${optionsStr}\n\nEnter the number of your choice: `;
        const retryPrompt = 'Invalid choice, try again: ';

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const ask = (prompt: string): Promise<T> =>
            new Promise((resolve) => {
                rl.question(prompt, (answer) => {
                    const index = parseInt(answer) - 1;
                    if (index >= 0 && index < options.length) {
                        console.log(`You selected: ${options[index].label}`);
                        rl.close();
                        console.log('');
                        resolve(options[index].value);
                    } else {
                        resolve(ask(retryPrompt));
                    }
                });
            });

        return ask(fullPrompt);
    },
};

function formatMessage(message: Message, icon?: string): string {
    if (icon && icon.length > TAB_STOPS[0]) {
        throw new Error(
            `Icon should be a single character, received: '${icon}': ${icon.length}`,
        );
    }

    icon = icon?.length ? icon.padEnd(TAB_STOPS[0], ' ') : '';
    if (Array.isArray(message)) {
        message = message
            .map((part, i) => part.padEnd(TAB_STOPS[i + 1], ' '))
            .join('');
    }
    return icon + String(message);
}

type Message = string | [string, string] | [string, string, string];
