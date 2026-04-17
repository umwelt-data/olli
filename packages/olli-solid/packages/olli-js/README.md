# olli-js

Vanilla-JS consumer wrapper. Exposes an imperative API over the Solid-based internals so downstream users in any framework can use Olli without knowing about Solid.

## Entry points

- **`olli(graph, container, options?)`** — Domain-agnostic: mount a raw `Hypergraph` with generic descriptions
- **`olliVis(spec, container, options?)`** — Visualization domain: mount an `OlliVisSpec` with vis tokens, dialogs, keybindings
- **`olliDiagram(spec, container, options?)`** — Diagram domain: mount a `DiagramSpec`

All return an `OlliHandle` for imperative control.

## OlliHandle

```ts
interface OlliHandle {
  focus(navId): void;
  getFocusedNavId(): NavNodeId;
  setSelection(selection): void;
  getSelection(): Selection;
  getDescription(navId): string;
  setCustomization(role, customization): void;
  applyPreset(name): void;
  onFocusChange(cb): () => void;    // returns unsubscribe
  onSelectionChange(cb): () => void; // returns unsubscribe
  destroy(): void;
}
```

## Re-exports

For convenience, `olli-js` re-exports:
- Adapters: `VegaAdapter`, `VegaLiteAdapter`, `ObservablePlotAdapter`
- Core types: `NavNodeId`, `Selection`, `Customization`, `Hypergraph`, etc.
- Vis spec types: `OlliVisSpec`, `UnitOlliVisSpec`, `OlliFieldDef`, etc.
- Diagram types: `DiagramSpec`, `DiagramPayload`

## Dependencies

- `olli-core`, `olli-render-solid`, `olli-vis`, `olli-diagram`, `olli-adapters`, `solid-js`
- Solid is bundled as a regular dependency (consumers don't need to install it)
