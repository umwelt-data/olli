# Adapters

An adapter converts an external visualization specification into an `OlliVisSpec` that `olliVis` can render. The primary adapter is for Vega-Lite. All adapters are available from the `olli/adapters` sub-path export.

```ts
import { VegaLiteAdapter } from 'olli/adapters';
```

## `VegaLiteAdapter`

```ts
function VegaLiteAdapter(spec: object): Promise<OlliVisSpec>
```

Converts a Vega-Lite specification into an `OlliVisSpec`. Compiles the spec to Vega internally, evaluates the data pipeline, and extracts axes, legends, marks, and data.

```ts
import { olliVis } from 'olli';
import { VegaLiteAdapter } from 'olli/adapters';

const olliSpec = await VegaLiteAdapter(vlSpec);
const handle = olliVis(olliSpec, container);
```

**Requires:** `vega-lite` as a peer dependency. The adapter compiles the spec and evaluates the data pipeline itself, so the `vega` runtime is not needed for the conversion — you only need it (or another renderer) if you also want to draw the chart.

### `VegaLiteAdapterSync`

```ts
function VegaLiteAdapterSync(spec: object): OlliVisSpec
```

Synchronous variant. Use when the spec contains inline data (no URL-based data sources that need fetching).

## Other visualization adapters

Adapters also exist for Vega and Observable Plot. They follow the same pattern as the Vega-Lite adapter.

- **`VegaAdapter(spec: object): Promise<OlliVisSpec>`** — converts a Vega specification. Reads the spec structurally and evaluates its data pipeline, so it has no extra peer dependency. A synchronous variant `VegaAdapterSync` is also available.
- **`ObservablePlotAdapter(spec: object): Promise<OlliVisSpec>`** — converts an Observable Plot specification. Requires `@observablehq/plot` as a peer dependency.

```ts
import { VegaAdapter, ObservablePlotAdapter } from 'olli/adapters';
```

## `BluefishAdapter`

The Bluefish adapter converts Bluefish diagram specifications into `DiagramSpec` for use with `olliDiagram`. It is available from `olli/adapters`:

```ts
import { BluefishAdapter } from 'olli/adapters';
import type { BluefishKit, OlliCustomData, BluefishSpecFn } from 'olli/adapters';
```

## Adapter types

If you're writing your own adapter, implement one of these type signatures:

```ts
type VisAdapter<T> = (spec: T) => OlliVisSpec | Promise<OlliVisSpec>;
type DiagramAdapter<T> = (spec: T) => DiagramSpec;
```

A `VisAdapter` takes your spec format and returns an `OlliVisSpec` (sync or async). A `DiagramAdapter` does the same for `DiagramSpec`.

## Next

- [Entry Points](/docs/entry-points) — passing adapter output to `olliVis` or `olliDiagram`.
- [Quickstart](/docs/quickstart) — a complete Vega-Lite integration example.
