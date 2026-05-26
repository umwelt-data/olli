import { dts } from 'rollup-plugin-dts';

const shared = {
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

export default [
  {
    input: 'dist/index.d.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    ...shared,
  },
  {
    input: 'dist/adapters.d.ts',
    output: { file: 'dist/adapters.d.ts', format: 'es' },
    ...shared,
  },
];
