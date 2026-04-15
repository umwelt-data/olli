# Olli - Screen Reader Accessibility for Data Visualization

Olli is an open-source library for converting data visualizations into accessible text structures for screen reader users. Starting with an existing visualization specification created with a supported toolkit, Olli produces a keyboard-navigable tree view with descriptions at varying levels of detail. Users can explore these structures both to get an initial overview, and to dive into the data in more detail.

For more information about Olli, see the main project repo at https://github.com/umwelt-data/olli.

This is Olli's core package, published on `npm` as `olli`.

## Structure

The `src/Structure` folder constructs a tree structure from a given `OlliVisSpec`. This code also assigns descriptions to each node in the tree.

Like sighted users, research has found that screen reader users also
follow an information seeking strategy of “overview first, zoom and
filter, and details on demand”. Following prior work on design
dimensions for rich screen reader visualization experiences, we
represent accessible visualizations hierarchically, as a tree structure
containing descriptions at varying levels of information granularity.
The root node contains a high-level overview of the visualization.
If the visualization has multiple views, the level below the root
contains a node for each view. The next level contains nodes rep-
resenting guides (axes and legends). Each guide node has children
representing intervals and categories for continuous and discrete
guides, respectively. Finally, the leaves of the tree contains the indi-
vidual data points that correspond to those intervals and categories.
The tree allows users to leverage a visualization’s hierarchical struc-
ture to drill down into data, rather than being restricted to reading
individual data points linearly or in a table.

### AccessibilityTreeNodes

Olli uses an OlliVisSpec returned by an adapter to construct a tree
of `AccessibilityTreeNode`s. Each `AccessibilityTreeNode`
contains a reference to its parent node (null in the case of the root
node), and a list of child nodes. It also contains a information about
what part of the visualization it represents, and a textual description
to be read by a screen reader. For example, a node representing an x-
axis might have a text description reading, “X-Axis for a quantitative
scale with values from 14.43 to 34.7”.

The `AccessibilityTreeNode` type is defined here: https://github.com/umwelt-data/olli/blob/main/packages/core/src/Structure/Types.ts

## Testing

Tests run via [Vitest](https://vitest.dev) under jsdom:

```bash
npm test           # one-shot
npm run test:watch # rerun on change
```

The suite has four tiers:

- `test/util/` — unit tests for individual helpers (e.g. `typeInference`).
- `test/structure/` — hand-written `OlliSpec` inputs feed `olliSpecToTree`; assertions are made against the resulting tree shape.
- `test/render/` — `olli()` is invoked under jsdom and the rendered DOM is checked for ARIA roles, levels, and non-empty labels.
- `test/corpus/` — every committed fixture under `test/fixtures/olli-specs/` is round-tripped through `olliSpecToTree`. Each fixture produces a normalized tree-shape snapshot (under `test/corpus/__snapshots__/`) plus a non-empty-description assertion at every node. Description *wording* is not snapshotted, so copy tweaks don't churn the baseline.

### Fixtures

The corpus fixtures are generated from `examples/vl-specs/*.json` (the canonical Vega-Lite specs at the repo root, which the docs site also reads via `site.data.vl_specs`). Regenerate them when adapter behavior changes intentionally:

```bash
npm run gen-fixtures
```

This compiles each VL spec through `VegaLiteAdapter` and writes the resulting `OlliSpec` JSON to `test/fixtures/olli-specs/`. `TZ=UTC` is pinned so the temporal `Date` values are reproducible across machines. To exclude an example from the corpus (e.g., because Olli doesn't yet support it), add its name to `test/fixtures/excluded.ts`.

The corpus runner enforces coverage: a cross-check fails if any non-excluded VL spec lacks a committed fixture, so new examples can't silently skip testing.

### Determinism

`test/setup.ts` pins a few non-deterministic globals so snapshots are stable:

- `Math.random` is replaced with a seeded LCG (reset in `beforeEach`), so id namespaces in `olliSpecToTree` are reproducible.
- `localStorage` is cleared between tests so the `versioned-storage` settings used by `getCustomizedDescription` start fresh.
- jsdom 24's `innerText` setter is a no-op (it relies on layout), so it's polyfilled to write `textContent`. Without this, `renderTree` produces empty `<span>` labels.
- `HTMLCanvasElement.getContext` is stubbed to silence the jsdom warning emitted when `vega-scenegraph` loads.

## Render

The `src/Render` folder includes screen-reader-friendly renderers for a tree view and a table.

Olli renders an accessible structure by traversing the tree and out-
putting HTML elements and necessary ARIA attributes. To imple-
ment an accessible HTML tree view, we adapted an [example](https://w3c.github.io/aria-practices/examples/treeview/treeview-navigation.html) from
the W3C’s WAI-ARIA Authoring Examples documentation. As
the AccessibilityTreeNode is traversed, tree nodes that have
children are rendered as a nested unordered list with a group role
and aria-expanded attribute. Otherwise, a node is rendered as a
list item with a `treeitem` ARIA role. The addition of the ARIA
roles and extra attributes allow the screen reader to provide a more
specific description of the node’s position of the tree.
