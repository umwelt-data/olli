# Installation

## Basic install

```bash
npm install olli
```

This gives you the `olli`, `olliVis`, and `olliDiagram` entry points, along with all TypeScript types.

## With an adapter

Olli converts external visualization specs through adapters. The primary adapter is for Vega-Lite, which needs `vega-lite` as a peer dependency — install it alongside `olli`:

```bash
npm install olli vega-lite
```

Adapters are available from the `olli/adapters` sub-path:

```ts
import { VegaLiteAdapter } from 'olli/adapters';
```

The Vega-Lite adapter only uses `vega-lite` to compile and evaluate the spec — it does not need the `vega` runtime. Install `vega` (or `vega-embed`) separately only if you also want to render the chart visually, as in the [quickstart](/docs/quickstart).

An adapter also exists for Observable Plot, which needs `@observablehq/plot` (`npm install olli @observablehq/plot`). The `VegaAdapter` for raw Vega specs needs no extra peer dependency.

## Importing the stylesheet

Olli ships a single stylesheet for its tree view and dialog components. Import it once at the top of the entry file that mounts Olli:

```js
import 'olli/styles.css';
```

Without this import, the tree renders unstyled — every branch stays visible and the focused node has no highlight. See [Theming](/docs/theming) for how to customize the styles.

## TypeScript

The `olli` package re-exports all public types from the internal packages:

```ts
import type {
  OlliHandle,
  OlliOptions,
  OlliVisSpec,
  DiagramSpec,
  NavNodeId,
  Selection,
  Customization,
  Hypergraph,
  Hyperedge,
  HyperedgeId,
} from 'olli';
```

## Using pnpm or yarn

```bash
pnpm add olli vega-lite vega
# or
yarn add olli vega-lite vega
```

## Next

- [Quickstart](/docs/quickstart) — a complete working example.
- [Entry Points](/docs/entry-points) — which function to call for your use case.
