# olli-adapters

Layer 5: Adapters that convert visualization and diagram library specs into Olli specs. All adapters are re-exported from the `olli` package — consumers should install `olli` directly.

**Docs:** [Adapters](https://umwelt-data.github.io/olli/docs/adapters)

## Adapters

- **`VegaLiteAdapter`** / **`VegaLiteAdapterSync`** — Compiles a Vega-Lite spec to Vega, evaluates its data pipeline, and extracts axes/legends/marks/data to produce `OlliVisSpec`. This is the primary adapter.
- **`VegaAdapter`** / **`VegaAdapterSync`** — Reads a Vega spec structurally and evaluates its data pipeline to extract axes/legends/data.
- **`ObservablePlotAdapter`** — Renders an Observable Plot spec, extracts structure from the SVG.
- **`BluefishAdapter`** — Converts a Bluefish spec function into a `DiagramSpec`. Types: `BluefishKit`, `BluefishSpecFn`.

## Testing

```sh
pnpm test              # from repo root (runs all packages)
```

### Structure regression snapshots

Every Vega-Lite example in `apps/docs/gallery/examples/` has a snapshot test that captures the structural skeleton of the adapter output (mark, fields, axes, legends, facet, and multi-spec operator). This guards against silent changes to the adapter's output shape.

Snapshots live in `src/__snapshots__/VegaLiteAdapter.test.ts.snap`. When you intentionally change adapter output structure, update them:

```sh
pnpm test -- --update
```

Review the diff in the `.snap` file to confirm only expected changes.

## Dependencies

- `olli-vis`, `olli-diagram`, `@umwelt-data/umwelt-utils`, `vega-expression`
- Peer (optional): `vega-lite`, `@observablehq/plot`
