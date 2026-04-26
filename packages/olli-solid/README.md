# Olli (Solid rewrite)

Olli is a library for converting data representations into accessible text structures for screen reader users. This is the Solid-based rewrite, featuring a hypergraph core that supports both data visualizations and arbitrary diagrams.

## Architecture

Five layers, strict bottom-up dependency:

```
L5  olli-adapters     Vega, Vega-Lite, Observable Plot → OlliVisSpec
L4  olli-vis           Visualization domain (tokens, dialogs, keybindings, presets)
    olli-diagram       Diagram domain (generic hypergraph authoring)
L3  olli-render-solid  Accessible ARIA tree view (Solid components)
L2  olli-core          Description framework (token registry, customization, reactive describe)
L1  olli-core          Navigation runtime (nav tree, focus, selection, plugin registries)
L0  olli-core          Hypergraph data model + predicate evaluation
    olli-js            Vanilla-JS consumer wrapper (imperative API over Solid internals)
```

## Packages

| Package | Description |
|---------|-------------|
| `olli-core` | Hypergraph, predicates, navigation runtime, description framework |
| `olli-render-solid` | Solid components: TreeView, TreeItem, NodeLabel, Dialog |
| `olli-vis` | Visualization domain: spec types, lowerer, tokens, dialogs, keybindings, presets |
| `olli-diagram` | Diagram domain: direct hyperedge authoring |
| `olli-adapters` | Adapters for Vega, Vega-Lite, Observable Plot |
| `olli-js` | Vanilla-JS entry point with imperative OlliHandle API |

## Quick start

### Vanilla JS (via olli-js)

```ts
import { olliVis } from 'olli-js';

const handle = olliVis({
  data: [{ x: 'A', y: 10 }, { x: 'B', y: 20 }],
  mark: 'bar',
  axes: [
    { field: 'x', axisType: 'x', title: 'Category' },
    { field: 'y', axisType: 'y', title: 'Value' },
  ],
}, document.getElementById('chart'));

handle.applyPreset('medium');
handle.onFocusChange(id => console.log('focused:', id));

// later
handle.destroy();
```

### Domain-agnostic (raw hypergraph)

```ts
import { olli } from 'olli-js';
import { buildHypergraph } from 'olli-core';

const graph = buildHypergraph([
  { id: 'root', displayName: 'System', children: ['a', 'b'], parents: [] },
  { id: 'a', displayName: 'Part A', children: [], parents: ['root'] },
  { id: 'b', displayName: 'Part B', children: [], parents: ['root'] },
]);

const handle = olli(graph, document.getElementById('diagram'));
```

### With a Vega-Lite adapter

```ts
import { olliVis, VegaLiteAdapter } from 'olli-js';

const spec = await VegaLiteAdapter(myVegaLiteSpec);
const handle = olliVis(spec, container);
```

### Direct Solid integration

```tsx
import { createNavigationRuntime, registerDomain } from 'olli-core';
import { visDomain, elaborateSpec, lowerVisSpec } from 'olli-vis';
import { TreeView, registerDefaultKeybindings } from 'olli-render-solid';
import { render } from 'solid-js/web';

const graph = lowerVisSpec(elaborateSpec(spec));
const runtime = createNavigationRuntime(graph);
registerDomain(runtime, visDomain);
registerDefaultKeybindings(runtime);

render(() => <TreeView runtime={runtime} />, container);
```

## Examples

- `examples/bar-chart/` — Vanilla JS bar chart via `olli-js` (no Solid imports)
- `examples/solid-app/` — Direct Solid integration bypassing `olli-js`

## Development

```bash
cd packages/olli-solid
pnpm install
pnpm run check        # boundaries + build + test
pnpm test             # vitest
pnpm -r build         # tsc across all packages
pnpm check:boundaries # layer rule enforcement
```

## Design documents

- `plan/01-architecture.md` — Full architecture reference
- `plan/02-implementation-plan.md` — Phased implementation plan
- `plan/03-pulley-acceptance.md` — Pulley system acceptance traces
