# olli-core

Layers 0–2 of the Olli architecture: hypergraph data model, predicate evaluation, navigation runtime, and description framework.

## Modules

- **`hypergraph/`** — `Hyperedge<P>`, `Hypergraph<P>`, `buildHypergraph`, traversal utilities, cycle detection
- **`predicate/`** — Vendored `FieldPredicate` types (from vega-lite, no runtime dep), `selectionTest`, logical composition (`and`/`or`/`not`)
- **`runtime/`** — `NavigationRuntime<P>` backed by Solid signals: nav tree synthesis, focus/move, expand/collapse, selection, plugin registries (keybindings, dialogs, predicate providers), virtual parent-context nodes for multi-parent hyperedges
- **`description/`** — Token registry, customization store (role-based recipes with presence/ordering/brevity), reactive `describe(navId)` that composes tokens into screen reader text

## Key types

- `Hypergraph<P>` — the core data model; nodes can have multiple parents
- `NavigationRuntime<P>` — reactive state + actions + plugin registries
- `OlliDomain<Spec, Payload>` — plugin interface for domain modules
- `Selection` — `LogicalComposition<FieldPredicate>` for data filtering
- `DescriptionToken<P>` — named, recomputable piece of description text

## Dependencies

- `solid-js` (signals only, no DOM)
- No workspace dependencies (this is the bottom layer)
