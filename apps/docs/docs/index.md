# Overview & Architecture

Olli converts data visualizations and diagrams into accessible, keyboard-navigable tree views for screen reader users. This section covers the architecture and developer API. If you're a screen reader user, see [Using Olli](/using/) instead.

## Data flow

<ArchitectureDiagram />

1. An **adapter** converts an external format (Vega-Lite, Vega, Observable Plot) into Olli's own spec type.
2. A **lowerer** (part of a domain) converts the spec into a **hypergraph** — a directed, multi-parent graph.
3. The **navigation runtime** manages focus, selection, expansion state, and builds a **nav tree** from the hypergraph.
4. The **renderer** produces an accessible ARIA tree view from the nav tree.

## Packages

| Package | Purpose |
| --- | --- |
| `olli` | Vanilla JS entry points (`olliVis`, `olliDiagram`, `olli`) and the `OlliHandle` API |
| `olli-core` | Hypergraph data model, navigation runtime, description framework |
| `olli-vis` | Visualization domain: spec types, lowerer, tokens, dialogs, keybindings, presets |
| `olli-diagram` | Diagram domain: spec types, lowerer, tokens |
| `olli-adapters` | Adapters from Vega-Lite, Vega, Observable Plot, Bluefish |
| `olli-render-solid` | Solid.js ARIA tree renderer, keyboard handling, dialog system |

## Where to go next

- **Integrate Olli into a page:** Start with the [Quickstart](/docs/quickstart), then read [Entry Points](/docs/entry-points) and [OlliHandle](/docs/handle).
- **Customize the look:** See [Theming & CSS](/docs/theming).
- **Understand the spec types:** See [OlliVisSpec](/docs/vis-spec) for charts or [DiagramSpec](/docs/diagram-spec) for diagrams.
- **Learn the internals:** Read [Hypergraph](/docs/hypergraph), [Navigation Tree](/docs/navtree), and [Navigation Runtime](/docs/runtime).
- **Customize descriptions:** See [Tokens](/docs/tokens), [Recipes](/docs/recipes), and [Presets](/docs/presets).
- **Build a new domain:** Start with [Domain Architecture](/docs/domains), then follow [Creating a Domain](/docs/creating-domain).
