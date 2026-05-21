# Adapters

An adapter converts an external visualization specification into an `OlliVisSpec` that `olliVis` can render. All adapters are re-exported from the `olli` package.

```ts
import { VegaLiteAdapter, VegaAdapter, ObservablePlotAdapter } from 'olli';
```

## `VegaLiteAdapter`

```ts
function VegaLiteAdapter(spec: object): Promise<OlliVisSpec>
```

Converts a Vega-Lite specification into an `OlliVisSpec`. Compiles the spec to Vega internally, evaluates the data pipeline, and extracts axes, legends, marks, and data.

```ts
import { olliVis, VegaLiteAdapter } from 'olli';

const olliSpec = await VegaLiteAdapter(vlSpec);
const handle = olliVis(olliSpec, container);
```

**Requires:** `vega-lite` and `vega` as peer dependencies.

### `VegaLiteAdapterSync`

```ts
function VegaLiteAdapterSync(spec: object): OlliVisSpec
```

Synchronous variant. Use when the spec contains inline data (no URL-based data sources that need fetching).

## `VegaAdapter`

```ts
function VegaAdapter(spec: object): Promise<OlliVisSpec>
```

Converts a Vega specification directly. Evaluates the data pipeline and extracts axes, legends, marks, and data.

```ts
import { olliVis, VegaAdapter } from 'olli';

const olliSpec = await VegaAdapter(vegaSpec);
const handle = olliVis(olliSpec, container);
```

**Requires:** `vega` as a peer dependency.

### `VegaAdapterSync`

```ts
function VegaAdapterSync(spec: object): OlliVisSpec
```

Synchronous variant for specs with inline data.

## `ObservablePlotAdapter`

```ts
function ObservablePlotAdapter(spec: object): Promise<OlliVisSpec>
```

Converts an Observable Plot specification. Renders the plot to SVG internally to extract axis structure, then builds an `OlliVisSpec`.

```ts
import { olliVis, ObservablePlotAdapter } from 'olli';

const olliSpec = await ObservablePlotAdapter(plotSpec);
const handle = olliVis(olliSpec, container);
```

**Requires:** `@observablehq/plot` as a peer dependency.

## `BluefishAdapter`

The Bluefish adapter converts Bluefish diagram specifications into `DiagramSpec` for use with `olliDiagram`. It is exported from `olli-adapters`:

```ts
import { BluefishAdapter } from 'olli-adapters';
import type { BluefishKit, OlliCustomData, BluefishSpecFn } from 'olli-adapters';
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
