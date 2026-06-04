import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';

const resolve = { conditions: ['development', 'browser'] };

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        plugins: [solidPlugin()],
        resolve,
        test: {
          name: 'node',
          include: ['packages/olli-core/src/**/*.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        plugins: [solidPlugin()],
        resolve,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: [
            'packages/olli/src/**/*.test.{ts,tsx}',
            'packages/olli-vis/src/**/*.test.{ts,tsx}',
            'packages/olli-render-solid/src/**/*.test.{ts,tsx}',
            'packages/olli-diagram/src/**/*.test.{ts,tsx}',
            'packages/olli-adapters/src/**/*.test.{ts,tsx}',
            'examples/*/src/**/*.test.{ts,tsx}',
          ],
          server: { deps: { inline: [/solid-js/, /@solidjs\/testing-library/] } },
        },
      },
    ],
  },
});
