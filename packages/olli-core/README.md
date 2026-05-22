# olli-core

Layers 0–2 of the Olli architecture: hypergraph data model, predicate evaluation, navigation runtime, and description framework.

**Docs:** [Hypergraph](https://umwelt-data.github.io/olli/docs/hypergraph), [Navigation runtime](https://umwelt-data.github.io/olli/docs/runtime), [Nav tree](https://umwelt-data.github.io/olli/docs/navtree), [Predicates](https://umwelt-data.github.io/olli/docs/predicates), [Tokens](https://umwelt-data.github.io/olli/docs/tokens), [Recipes](https://umwelt-data.github.io/olli/docs/recipes)

## Modules

- **`hypergraph/`** — `Hyperedge<P>`, `Hypergraph<P>`, `buildHypergraph`, traversal utilities, cycle detection
- **`predicate/`** — `FieldPredicate` types and `selectionTest` re-exported from `@umwelt-data/umwelt-utils`, logical composition (`and`/`or`/`not`)
- **`runtime/`** — `NavigationRuntime<P>` backed by Solid signals: nav tree synthesis, focus/move, expand/collapse, selection, plugin registries (keybindings, dialogs, predicate providers), virtual parent-context nodes for multi-parent hyperedges
- **`description/`** — Token registry, customization store (role-based recipes with presence/ordering/brevity), reactive `describe(navId)` that composes tokens into screen reader text

## Dependencies

- `solid-js` (signals only, no DOM)
- `@umwelt-data/umwelt-utils` (workspace link — predicate types and evaluation)
- No other workspace dependencies (this is the bottom layer)
