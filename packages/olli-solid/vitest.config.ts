import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'packages/*/src/**/*.test.tsx'],
    environment: 'node',
    passWithNoTests: true,
    server: {
      deps: {
        inline: [/solid-js/],
      },
    },
  },
});
