import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Required by the task: `npm test` must pass on an empty test set
    // (the very first tooling commit has no tests yet).
    passWithNoTests: true,
  },
});
