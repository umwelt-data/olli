# Olli

Olli is a library for converting data representations into accessible text structures for screen reader users. It features a hypergraph core that supports both data visualizations and arbitrary diagrams.

**Docs & examples:** https://umwelt-data.github.io/olli/

## Architecture

Five layers, strict bottom-up dependency:

```
L5  olli-adapters     Vega, Vega-Lite, Observable Plot, Bluefish → specs
L4  olli-vis           Visualization domain (tokens, dialogs, keybindings, presets)
    olli-diagram       Diagram domain (generic hypergraph authoring)
L3  olli-render-solid  Accessible ARIA tree view (Solid components)
L2  olli-core          Description framework (token registry, customization, reactive describe)
L1  olli-core          Navigation runtime (nav tree, focus, selection, plugin registries)
L0  olli-core          Hypergraph data model + predicate evaluation
    olli            Vanilla-JS consumer wrapper (imperative API over Solid internals)
```

| Package | Description |
|---------|-------------|
| `olli-core` | Hypergraph, predicates, navigation runtime, description framework |
| `olli-render-solid` | Solid components: TreeView, TreeItem, NodeLabel, Dialog |
| `olli-vis` | Visualization domain: spec types, lowerer, tokens, dialogs, keybindings, presets |
| `olli-diagram` | Diagram domain: direct hyperedge authoring |
| `olli-adapters` | Adapters for Vega, Vega-Lite, Observable Plot, Bluefish |
| `olli` | Vanilla-JS entry point with imperative OlliHandle API |

## Development

### Setup

```bash
pnpm install
```

### Key commands

```bash
pnpm run check          # Full verification: boundaries + build + test (run before pushing)
pnpm run build          # tsc -b across all packages
pnpm test               # vitest (single run)
pnpm test:watch         # vitest in watch mode
pnpm run check:boundaries  # Verify import layer rules
```

### Updating snapshots

Adapter snapshot tests capture the structural skeleton of each adapter's output to guard against silent changes. Snapshots live in `packages/olli-adapters/src/__snapshots__/`. When you intentionally change adapter output:

```bash
pnpm test -- --update
```

Review the diff in the `.snap` file to confirm only expected changes.

### Import boundaries

`check:boundaries` enforces the layer architecture — a package can only import from packages in lower layers. If you add a new import and this check fails, you're violating the dependency direction.

### Running apps locally

```bash
pnpm --filter playground dev    # Interactive dev environment for testing olli
pnpm --filter docs dev          # Docs site at http://localhost:5173/olli/
```

### Adding gallery examples

See [apps/docs/README.md](apps/docs/README.md) for the step-by-step guide.

### Publishing to npm

`olli` is the sole public npm package — it re-exports everything including adapters, so consumers only need `npm install olli`.

```bash
pnpm run check          # Must pass first
cd packages/olli
npm publish
```
