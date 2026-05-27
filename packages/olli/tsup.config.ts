import { defineConfig } from 'tsup';
import { solidPlugin } from 'esbuild-plugin-solid';

export default defineConfig({
  entry: ['src/index.ts', 'src/adapters.ts'],
  format: ['esm'],
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: false,
  splitting: false,
  treeshake: true,

  // Inline all workspace packages so consumers don't need them installed
  noExternal: [
    'olli-core',
    'olli-render-solid',
    'olli-vis',
    'olli-diagram',
    'olli-adapters',
  ],

  // Keep real npm dependencies external
  external: [
    'solid-js',
    'solid-js/web',
    '@umwelt-data/umwelt-utils',
    '@umwelt-data/umwelt-utils/predicate',
    '@umwelt-data/umwelt-utils/data',
    '@umwelt-data/umwelt-utils/description',
    '@umwelt-data/umwelt-utils/vega',
    'vega-lite',
    '@observablehq/plot',
    'vega-expression',
    'topojson-client',
    'papaparse',
    'ua-parser-js',
  ],

  esbuildPlugins: [
    solidPlugin({ solid: { generate: 'dom' } }),
  ],
});
