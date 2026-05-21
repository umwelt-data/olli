# Installation

## Basic install

```bash
npm install olli
```

This gives you the `olli`, `olliVis`, and `olliDiagram` entry points, along with all TypeScript types.

## With an adapter

Olli converts external visualization specs through adapters. Install the visualization library alongside `olli`:

**Vega-Lite:**
```bash
npm install olli vega-lite vega
```

**Vega:**
```bash
npm install olli vega
```

**Observable Plot:**
```bash
npm install olli @observablehq/plot
```

The adapters (`VegaLiteAdapter`, `VegaAdapter`, `ObservablePlotAdapter`) are re-exported from the `olli` package, so no additional import path is needed.

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
