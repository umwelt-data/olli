import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    conditions: ['development', 'browser'],
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, '../docs/gallery/examples'),
        path.resolve(__dirname, '../..'),
      ],
    },
  },
});
