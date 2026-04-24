import path from 'node:path';

const relativeTo = (workspaceDir) => (files) =>
    files.map((f) => path.relative(path.resolve(workspaceDir), f));

export default {
    'apps/api/src/**/*.ts': (files) => {
        const rel = relativeTo('apps/api')(files);
        return [
            `prettier --write ${files.map((f) => `"${f}"`).join(' ')}`,
            `pnpm --filter=@eggplant/api exec eslint --fix ${rel
                .map((f) => `"${f}"`)
                .join(' ')}`,
        ];
    },
    'apps/pwa/src/**/*.{ts,tsx}': (files) => {
        const rel = relativeTo('apps/pwa')(files);
        return [
            `prettier --write ${files.map((f) => `"${f}"`).join(' ')}`,
            `pnpm --filter=@eggplant/pwa exec eslint --fix ${rel
                .map((f) => `"${f}"`)
                .join(' ')}`,
        ];
    },
};
