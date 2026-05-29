# Olli

Olli is an open-source library for converting data visualizations and diagrams into accessible text structures for screen reader users. Starting from a visualization or diagram specification, Olli produces a keyboard-navigable tree view with descriptions at varying levels of detail, allowing users to explore data structures both for an initial overview and in fine-grained detail.

**Docs & examples:** https://umwelt-data.github.io/olli/

## Install

```bash
npm install olli
```

If you're using an adapter that wraps an external library, install its peer dependency too:

```bash
npm install olli vega-lite               # for VegaLiteAdapter
```

## Quick example

```js
import { olliVis } from 'olli';
import { VegaLiteAdapter } from 'olli/adapters';
import 'olli/styles.css';

const vlSpec = {
  data: {
    values: [
      { region: 'North', sales: 120 },
      { region: 'South', sales: 90 },
      { region: 'East', sales: 160 },
      { region: 'West', sales: 45 },
    ],
  },
  mark: 'bar',
  encoding: {
    x: { field: 'region', type: 'nominal' },
    y: { field: 'sales', type: 'quantitative' },
  },
};

const olliSpec = await VegaLiteAdapter(vlSpec);
const handle = olliVis(olliSpec, document.getElementById('tree'));
```

The tree root describes the whole chart. Press the down arrow to enter the first axis, then left and right to navigate categories.

## Entry points

All three entry points mount an accessible tree into a container element and return an [`OlliHandle`](https://umwelt-data.github.io/olli/docs/handle) for imperative control.

| Function | Use case |
|----------|----------|
| `olliVis(spec, container, options?)` | Data visualizations (charts, maps) |
| `olliDiagram(spec, container, options?)` | Diagrams and relational structures |
| `olli(graph, container, options?)` | Custom domains using a raw hypergraph |

See [Entry Points](https://umwelt-data.github.io/olli/docs/entry-points) for details on when to use each.

## Adapters

Adapters convert external visualization specs into the format Olli expects. Import them from `olli/adapters`:

```js
import { VegaLiteAdapter } from 'olli/adapters';
```

| Adapter | Peer dependency |
|---------|-----------------|
| `VegaLiteAdapter` / `VegaLiteAdapterSync` | `vega-lite` |
| `VegaAdapter` / `VegaAdapterSync` | — |
| `ObservablePlotAdapter` | `@observablehq/plot` |
| `BluefishAdapter` | — |

The `olli/adapters` entry point is separate so that adapter dependencies are only loaded when imported. See [Adapters](https://umwelt-data.github.io/olli/docs/adapters) for usage and writing custom adapters.

## Handle API

Every entry point returns an `OlliHandle` with methods for controlling the tree programmatically:

- **Focus:** `focus(navId)`, `getFocusedNavId()`
- **Selection:** `setSelection(selection)`, `getSelection()`, `fullPredicate(navId)`
- **Descriptions:** `getDescription(navId)`
- **Customization:** `setCustomization(role, customization)`, `applyPreset(name)`
- **Events:** `onFocusChange(cb)`, `onSelectionChange(cb)` — both return an unsubscribe function
- **Cleanup:** `destroy()`

See [OlliHandle](https://umwelt-data.github.io/olli/docs/handle) for the full interface.

## Options

All entry points accept an optional `OlliOptions` object:

```js
olliVis(spec, container, {
  initialPreset: 'standard',       // 'detailed' | 'standard' | 'minimal'
  initialSelection: { and: [{ field: 'region', equal: 'North' }] },
  callbacks: {
    onFocus: (navId) => console.log('focus:', navId),
    onSelection: (sel) => console.log('selection:', sel),
  },
});
```

See [Options & Callbacks](https://umwelt-data.github.io/olli/docs/options) for details.

## Theming

Import the stylesheet once in your entry file:

```js
import 'olli/styles.css';
```

Override CSS variables on `.olli-vis` to theme the tree:

| Variable | Default | Purpose |
|----------|---------|---------|
| `--olli-focus-bg` | `#eee` | Focused label background |
| `--olli-hover-bg` | `#ddd` | Hovered label background |
| `--olli-indent` | `1.5em` | Nesting indentation |
| `--olli-virtual-style` | `italic` | Font style for grouping nodes |

See [Theming & CSS](https://umwelt-data.github.io/olli/docs/theming) for class overrides and full control.

## Documentation

- [Quickstart](https://umwelt-data.github.io/olli/docs/quickstart) — full working example
- [Entry Points](https://umwelt-data.github.io/olli/docs/entry-points) — `olliVis`, `olliDiagram`, `olli`
- [Adapters](https://umwelt-data.github.io/olli/docs/adapters) — converting visualization specs
- [OlliHandle](https://umwelt-data.github.io/olli/docs/handle) — imperative API reference
- [Options & Callbacks](https://umwelt-data.github.io/olli/docs/options) — configuration and events
- [Theming & CSS](https://umwelt-data.github.io/olli/docs/theming) — styling the tree
- [Example Gallery](https://umwelt-data.github.io/olli/gallery/) — runnable demos across chart types
- [Screen Reader User Guide](https://umwelt-data.github.io/olli/using/) — navigating Olli trees

## Research

Olli is based on [award-winning research](https://vis.csail.mit.edu/pubs/rich-screen-reader-vis-experiences/) involving participatory co-design with blind and low-vision collaborators. [Learn more about the research behind Olli.](https://data-and-design.org/projects/olli/)

## Feedback

[Open an issue on GitHub](https://github.com/umwelt-data/olli/issues/new?labels=user%20feedback) or fill out the feedback form.
