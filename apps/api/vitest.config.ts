import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/test-utils.ts',
        'src/migrations/**',
        'src/scripts/**',
        'src/types/**',
        'src/index.ts',
        'src/swagger.ts',
      ],
    },
  },
});
