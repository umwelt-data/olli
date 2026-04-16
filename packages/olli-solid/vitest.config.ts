import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
    include: [
      'packages/*/src/**/*.test.ts',
      'packages/*/src/**/*.test.tsx',
      'examples/*/src/**/*.test.ts',
      'examples/*/src/**/*.test.tsx',
    ],
    environmentMatchGlobs: [
      ['packages/olli-render-solid/**', 'jsdom'],
      ['examples/**', 'jsdom'],
    ],
    environment: 'node',
    passWithNoTests: true,
    server: {
      deps: {
        inline: [/solid-js/, /@solidjs\/testing-library/],
      },
    },
  },
});
