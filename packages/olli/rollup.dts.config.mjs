import { dts } from 'rollup-plugin-dts';
import path from 'path';

export default {
  input: 'dist/index.d.ts',
  output: { file: 'dist/index.d.ts', format: 'es' },
  plugins: [
    dts({
      tsconfig: 'tsconfig.build.json',
      compilerOptions: {
        paths: {
          'olli-core': ['../olli-core/dist/index.d.ts'],
          'olli-render-solid': ['../olli-render-solid/dist/index.d.ts'],
          'olli-vis': ['../olli-vis/dist/index.d.ts'],
          'olli-diagram': ['../olli-diagram/dist/index.d.ts'],
          'olli-adapters': ['../olli-adapters/dist/index.d.ts'],
        },
      },
    }),
  ],
  external: [
    /^solid-js/,
    /^@umwelt-data\/umwelt-utils/,
    /^vega-lite/,
    /^@observablehq\/plot/,
    /^vega-expression/,
    /^topojson-client/,
    /^papaparse/,
    /^ua-parser-js/,
  ],
};
