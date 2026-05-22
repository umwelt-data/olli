# olli-adapters

Layer 5: Adapters that convert visualization library specs into `OlliVisSpec`.

## Adapters

- **`VegaLiteAdapter`** — Compiles a Vega-Lite spec, extracts scenegraph data, produces `OlliVisSpec`. This is the primary adapter.
- **`VegaAdapter`** — Parses a Vega spec, extracts axes/legends/data from the scenegraph.
- **`ObservablePlotAdapter`** — Renders an Observable Plot spec, extracts structure from the SVG.

All adapters are async (they render the spec to extract runtime data).

## Usage

```ts
import { VegaLiteAdapter } from 'olli-adapters';
import { olliVis } from 'olli';

const spec = await VegaLiteAdapter(myVegaLiteSpec);
const handle = olliVis(spec, container);
```

## Testing

```sh
pnpm test              # from repo root (runs all packages)
pnpm test              # from this package directory
```

### Structure regression snapshots

Every Vega-Lite example in `apps/docs/gallery/examples/` has a snapshot test that captures the structural skeleton of the adapter output (mark, fields, axes, legends, facet, and multi-spec operator). This guards against silent changes to the adapter's output shape — for example, a unit spec accidentally becoming a multi-spec.

Snapshots live in `src/__snapshots__/VegaLiteAdapter.test.ts.snap`. When you intentionally change adapter output structure, update them:

```sh
npx vitest run --update
```

Review the diff in the `.snap` file to confirm only expected changes.

## Dependencies

- `olli-vis`
- Peer: `vega` (optional), `vega-lite` (optional)
