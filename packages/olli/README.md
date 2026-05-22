# olli

Vanilla-JS consumer wrapper — the sole public npm package. Exposes an imperative API over the Solid-based internals so downstream users in any framework can use Olli without knowing about Solid.

Re-exports all adapters (`VegaLiteAdapter`, `VegaAdapter`, `ObservablePlotAdapter`, `BluefishAdapter`, sync variants) and core types so consumers only need `npm install olli`.

**Docs:** [Quickstart](https://umwelt-data.github.io/olli/docs/quickstart), [Entry points](https://umwelt-data.github.io/olli/docs/entry-points), [OlliHandle](https://umwelt-data.github.io/olli/docs/handle), [Options](https://umwelt-data.github.io/olli/docs/options)

## Entry points

- **`olli(graph, container, options?)`** — Domain-agnostic: mount a raw `Hypergraph`
- **`olliVis(spec, container, options?)`** — Visualization domain: mount an `OlliVisSpec`
- **`olliDiagram(spec, container, options?)`** — Diagram domain: mount a `DiagramSpec`

All return an `OlliHandle` for imperative control. See the [docs](https://umwelt-data.github.io/olli/docs/handle) for the full interface.

## Dependencies

- `olli-core`, `olli-render-solid`, `olli-vis`, `olli-diagram`, `olli-adapters`, `solid-js`
- Solid is bundled as a regular dependency (consumers don't need to install it)
