# olli

Vanilla-JS consumer wrapper — the sole public npm package. Exposes an imperative API over the Solid-based internals so downstream users in any framework can use Olli without knowing about Solid.

All adapters (`VegaLiteAdapter`, `VegaAdapter`, `ObservablePlotAdapter`, `BluefishAdapter`, sync variants) are available from the `olli/adapters` sub-path export. Core types are re-exported from the main `olli` entry. Consumers only need `npm install olli`.

**Docs:** [Quickstart](https://umwelt-data.github.io/olli/docs/quickstart), [Entry points](https://umwelt-data.github.io/olli/docs/entry-points), [OlliHandle](https://umwelt-data.github.io/olli/docs/handle), [Options](https://umwelt-data.github.io/olli/docs/options)

## Entry points

- **`olli(graph, container, options?)`** — Domain-agnostic: mount a raw `Hypergraph`
- **`olliVis(spec, container, options?)`** — Visualization domain: mount an `OlliVisSpec`
- **`olliDiagram(spec, container, options?)`** — Diagram domain: mount a `DiagramSpec`

All return an `OlliHandle` for imperative control. See the [docs](https://umwelt-data.github.io/olli/docs/handle) for the full interface.

## Build pipeline

This package bundles all internal workspace packages into a single publishable output so consumers don't need to install `olli-core`, `olli-vis`, etc. The build has four sequential steps:

```bash
pnpm run build          # runs all steps below in order
```

| Step | Script | Tool | What it does |
|------|--------|------|-------------|
| 1 | `build:deps` | `tsc -b` | Compiles all workspace packages (produces `.js` and `.d.ts` in each package's `dist/`) |
| 2 | `build:bundle` | `tsup` | Bundles JS entry point, inlining all workspace imports into a single `dist/index.js`. Configured in `tsup.config.ts`. |
| 3 | `build:dts` | `rollup -c rollup.dts.config.mjs` | Bundles type declarations, inlining workspace `.d.ts` into a single `dist/index.d.ts`. Uses `rollup-plugin-dts`. |
| 4 | `build:css` | `cat` | Copies `olli-render-solid/src/styles.css` → `dist/styles.css` |

### What gets bundled vs. kept external

**Bundled (inlined into `dist/`):** `olli-core`, `olli-render-solid`, `olli-vis`, `olli-diagram`, `olli-adapters` — these are workspace packages that are never published to npm.

**External (listed as `dependencies` or `peerDependencies`):** `solid-js`, `@umwelt-data/umwelt-utils`, `vega-expression`, `topojson-client`, `papaparse`, `ua-parser-js`, `vega-lite` (optional peer), `@observablehq/plot` (optional peer).

### Verifying the bundle

After building, confirm no internal package references leak into the published output:

```bash
grep 'from.*olli-core\|from.*olli-vis\|from.*olli-diagram\|from.*olli-adapters\|from.*olli-render' dist/index.js dist/index.d.ts dist/adapters.js dist/adapters.d.ts
```

This should produce no output. If it does, the bundle is broken and consumers will get import errors.

## Sub-path exports

The package exposes two entry points:

- **`olli`** — Core runtime, renderer, vis/diagram domain, types. No adapter dependencies.
- **`olli/adapters`** — All adapters (`VegaLiteAdapter`, `VegaAdapter`, `ObservablePlotAdapter`, `BluefishAdapter`, etc.). This entry point pulls in `vega-lite`, `@observablehq/plot`, etc. only when imported.

This split ensures that `import { olliVis } from 'olli'` works even if `vega-lite` is not installed. Consumers only pay for adapter dependencies they actually use.

## Dependencies

**Runtime** (installed by consumers):
- `solid-js` — reactive primitives (signals, effects)
- `@umwelt-data/umwelt-utils` — shared predicate, data, and description utilities
- `vega-expression`, `topojson-client`, `papaparse`, `ua-parser-js`

**Peer** (optional, only needed for specific adapters):
- `vega-lite` — required for `VegaLiteAdapter`
- `@observablehq/plot` — required for `ObservablePlotAdapter`

**Dev** (workspace packages inlined at build time):
- `olli-core`, `olli-render-solid`, `olli-vis`, `olli-diagram`, `olli-adapters`
- `tsup`, `esbuild-plugin-solid`, `rollup`, `rollup-plugin-dts`

## Publishing

See the [root README](../../README.md#publishing-to-npm) for the full pre-publish checklist. The short version:

```bash
pnpm run check            # from repo root — must pass
pnpm --filter olli build  # build the bundle
cd packages/olli
npm publish --access public
```
