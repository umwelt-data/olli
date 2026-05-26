# Entry Points

Olli exposes three entry points. They all render the same kind of accessible tree and return the same [`OlliHandle`](/docs/handle); they differ in what they accept as input.

## `olliVis`

```ts
function olliVis(spec: OlliVisSpec, container: HTMLElement, options?: OlliOptions): OlliHandle
```

Use `olliVis` when the data is tabular and the rendered view is a chart. It accepts an `OlliVisSpec`, which is Olli's own normalized chart description.

Adapters convert from external formats into `OlliVisSpec`:

```ts
import { olliVis } from 'olli';
import { VegaLiteAdapter } from 'olli/adapters';

const olliSpec = await VegaLiteAdapter(vlSpec);
const handle = olliVis(olliSpec, document.getElementById('tree'));
```

`olliVis` automatically registers the visualization domain, which provides:
- Jump shortcuts: `x` (x-axis), `y` (y-axis), `l` (legend)
- Dialogs: table (`t`), filter (`f`), targeted navigation (`r`)
- Description presets: `detailed`, `standard`, `minimal`
- Visualization-specific description tokens

**Reactive selection.** When the selection changes (via `handle.setSelection` or the filter dialog), `olliVis` re-lowers the spec with the new selection and rebuilds the tree, preserving focus on the equivalent node.

## `olliDiagram`

```ts
function olliDiagram(spec: DiagramSpec, container: HTMLElement, options?: OlliOptions): OlliHandle
```

Use `olliDiagram` when the data is relational — containment, connection, alignment, distribution, or grouping. It accepts a `DiagramSpec`:

```ts
import { olliDiagram } from 'olli';

const handle = olliDiagram(myDiagramSpec, document.getElementById('tree'));
```

`olliDiagram` registers the diagram domain, which provides diagram-specific description tokens and predicate providers.

## `olli`

```ts
function olli<P = unknown>(graph: Hypergraph<P>, container: HTMLElement, options?: OlliOptions): OlliHandle
```

The lowest-level entry point. It accepts a raw `Hypergraph` with no domain, so only the generic tokens and arrow-key navigation are available:

```ts
import { olli } from 'olli';

const handle = olli(myHypergraph, document.getElementById('tree'));
```

Use `olli` when you've already lowered your data into the hypergraph shape yourself, or when you're building a custom domain.

## When to use each

| Entry point | Input | Domain | Use when |
| --- | --- | --- | --- |
| `olliVis` | `OlliVisSpec` | Visualization (axes, legends, data dialogs) | Chart data with tabular structure |
| `olliDiagram` | `DiagramSpec` | Diagram (elements, relations) | Relational data with containment/connection |
| `olli` | `Hypergraph<P>` | None (generic navigation only) | Custom domain or pre-built hypergraph |

## Direct Solid integration

If your app already uses Solid.js, you can skip the vanilla wrapper and use the runtime and renderer directly:

```ts
import { createNavigationRuntime, registerDomain } from 'olli-core';
import { visDomain, lowerVisSpec, elaborateSpec } from 'olli-vis';
import { mount, registerDefaultKeybindings } from 'olli-render-solid';

const spec = elaborateSpec(myVisSpec);
const graph = lowerVisSpec(spec);
const runtime = createNavigationRuntime(graph);

registerDomain(runtime, visDomain);
registerDefaultKeybindings(runtime);
mount(runtime, container);
```

## Next

- [OlliHandle](/docs/handle) — the handle API returned by all entry points.
- [Options & Callbacks](/docs/options) — the optional third argument.
- [Adapters](/docs/adapters) — converting from Vega-Lite and other visualization formats.
