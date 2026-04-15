import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Alias `olli` -> core's source so the adapter can resolve without a dist build.
export default defineConfig({
  resolve: {
    alias: {
      olli: path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts'],
    globals: false,
  },
});
