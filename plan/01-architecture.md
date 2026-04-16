# Olli (Solid rewrite) — Architecture

This document is the design reference for the Solid-based rewrite of Olli. It describes the layered architecture, the core data model (a Benthic-style hypergraph), the navigation runtime, the description framework, and how visualization-specific concerns are factored into a domain module so the same core can later support diagrams and maps.

It is paired with two companion documents: a phased implementation plan, and a pulley acceptance spec that exercises the architecture end-to-end on a non-visualization domain.

---

## 1. Goals

1. Generalize Olli's structure beyond visualizations so the same core supports diagrams (and eventually maps) without changes.
2. Adopt a hypergraph as the core data model, allowing nodes to participate in multiple groupings without duplication.
3. Preserve Olli's existing UX as closely as possible — same arrow-key navigation, same tree-view feel, same description-customization affordances.
4. Rewrite in Solid for fine-grained reactivity, eliminating the imperative `init()`-rebuild pattern.
5. Cleanly separate domain-agnostic structural navigation from domain-specific concerns (axes, legends, datasets, etc.).
6. Ship a vanilla-JS consumer wrapper (`olli-js`) that hides the Solid implementation behind an imperative API, so downstream users in any framework (or none) can use Olli without learning Solid. This is a thin wrapper, not a reimplementation — Solid renders to real DOM, so all the wrapper does is bridge accessors-to-getters and signals-to-callbacks.

## 2. Naming and terminology

- "vis" not "viz" everywhere (`olli-vis`, `OlliVisSpec`, etc.).
- **Hyperedge**: the unit of the hypergraph. Carries identity, display name, optional long description, optional opaque payload, and lists of parent and child hyperedge IDs.
- **Hypergraph**: a collection of hyperedges keyed by ID.
- **NavNode**: a node in the *navigation tree*, which is a tree-shaped view derived from the hypergraph. NavNodes have path-based identity, distinct from hyperedge identity.
- **Virtual parent-context node**: a NavNode synthesized by the runtime when a hyperedge has multiple parents and the user is ascending. It presents the parent options as siblings.
- **Role**: a domain-defined string on a hyperedge that tells the description framework which token set applies. (Examples: in `olli-vis`, `xAxis`, `yAxis`, `legend`, `view`, `filteredData`. In `olli-diagram`, `system`, `component`, `relationship`.)
- **Payload**: opaque, domain-defined data attached to a hyperedge. Core never inspects it; domain modules do.
- **Token**: a named, recomputable piece of node description text (e.g., `name`, `index`, `aggregate`).
- **Customization**: a user-controlled recipe — which tokens are present for a given role, in what order, at what brevity, and for how long.
- **Selection**: a logical predicate over the underlying entities, used to filter the dataset and change what is described.

## 3. Layered architecture

Five layers, strict bottom-up dependency: each layer depends only on layers below.

```
┌─────────────────────────────────────────────────────────┐
│  L5  Adapters (Vega, Vega-Lite, Observable Plot)        │  → emit OlliVisSpec
├─────────────────────────────────────────────────────────┤
│  L4  Domain modules (olli-vis, olli-diagram, olli-map)  │  → register tokens,
│                                                          │     dialogs, keybindings;
│                                                          │     lower spec → hypergraph
├─────────────────────────────────────────────────────────┤
│  L3  Renderer (Solid components)                         │  → consumes runtime,
│                                                          │     emits ARIA HTML
├─────────────────────────────────────────────────────────┤
│  L2  Description framework (Solid signals)               │  → token registry,
│                                                          │     customization model,
│                                                          │     reactive describe()
├─────────────────────────────────────────────────────────┤
│  L1  Navigation runtime (Solid signals)                  │  → nav tree synthesis,
│                                                          │     focus, keybindings,
│                                                          │     virtual parent layer
├─────────────────────────────────────────────────────────┤
│  L0  Hypergraph (pure data, no UI)                       │  → types, traversal,
│                                                          │     invariants, IDs
└─────────────────────────────────────────────────────────┘
```

**Invariants enforced across layers:**
- L0 has zero UI dependencies and zero Solid dependencies. It is portable to any future runtime, including the eventual `olli-js` package.
- L1 owns all reactive state. L2 and L3 read from it via Solid signals and call its actions.
- L4 modules never import from L3 directly except through stable plugin interfaces (token registry, dialog registry, keybinding registry).
- L5 adapters depend only on L4 (their domain module), never on L0–L3.

## 4. L0 — Hypergraph

Pure data, no reactivity. This layer is what the eventual `olli-js` package will re-export unchanged.

### 4.1 Types

```ts
type HyperedgeId = string;

interface Hyperedge<P = unknown> {
  id: HyperedgeId;
  displayName: string;        // brief; used in lists and parent-context menus
  description?: string;        // optional long form supplied by domain
  role?: string;               // domain-defined; dispatches token sets and dialogs
  children: HyperedgeId[];     // ordered
  parents: HyperedgeId[];      // ordered; redundant with children but stored for fast lookup
  payload?: P;                 // opaque to core; domains interpret
}

interface Hypergraph<P = unknown> {
  edges: Map<HyperedgeId, Hyperedge<P>>;
  roots: HyperedgeId[];        // hyperedges with no parents; ordered
}
```

### 4.2 Construction and validation

A `buildHypergraph(edges: Hyperedge[])` helper:
- Indexes edges by ID.
- Verifies referential integrity (every child/parent ID exists).
- Verifies the parents/children mutual consistency (if A lists B as a child, B must list A as a parent).
- Computes `roots` as edges with empty `parents`.
- Detects cycles and rejects (Olli requires a DAG; the navigation tree synthesis assumes acyclicity).

### 4.3 Traversal helpers

- `descendants(graph, id): HyperedgeId[]` — all reachable from a hyperedge via children, BFS.
- `ancestors(graph, id): HyperedgeId[]` — all reachable via parents.
- `neighbors(graph, id, parentId): HyperedgeId[]` — siblings under a specific parent context (other children of `parentId`).
- `isLeaf(edge): boolean` — `children.length === 0`.

### 4.4 ID generation

For specs that don't supply IDs, a stable ID generator that produces deterministic IDs from structural position. Domain modules typically call this when lowering their spec into a hypergraph.

## 5. L1 — Navigation runtime

The runtime is responsible for turning the hypergraph into a tree-shaped navigable structure that preserves Olli's UX, plus managing focus and selection reactively.

### 5.1 Navigation tree synthesis

The hypergraph itself is a DAG; the user navigates a derived **navigation tree**. Synthesis rules:

1. Each hyperedge appears in the navigation tree once per ancestor path. A hyperedge with two parents appears twice (once under each parent), each occurrence having a distinct NavNode identity.
2. Children of a NavNode are its hyperedge's children, each materialized as a NavNode whose path extends the parent's path by the hyperedge's ID.
3. **Virtual parent-context node**: when a hyperedge has more than one parent, ascending from one of its NavNode occurrences focuses a synthesized NavNode rather than the parent NavNode directly. The virtual node's children are NavNodes corresponding to the real parent options. The default parent — the one selected by the most recent descent path — is positioned first, and pressing up again ascends through it.
4. Single-parent hyperedges produce no virtual node; ascending goes directly to the parent NavNode, exactly like current Olli.
5. Cycles in the hypergraph are forbidden, so synthesis terminates.

### 5.2 NavNode types

```ts
type NavNodeId = string;  // path-based, e.g., "0/1/3" (slash-joined hyperedge IDs)

interface NavNode {
  navId: NavNodeId;
  kind: 'real' | 'virtualParentContext';
  hyperedgeId: HyperedgeId | null;  // null for virtual nodes
  path: HyperedgeId[];               // ancestor hyperedge IDs from root, inclusive of self for real nodes
  parentNavId: NavNodeId | null;
  childNavIds: NavNodeId[];          // computed lazily or eagerly; see 5.5
}
```

### 5.3 Selection and predicates

Selection uses Vega-Lite-style predicate types, vendored from `vega-lite` to drop the runtime dependency. The predicate language is flat field-value logic (`equal`, `range`, `oneOf`, `lt`, `gt`, etc.) wrapped in `and`/`or`/`not`.

```ts
type Selection = LogicalComposition<FieldPredicate>;
```

For each NavNode, a `fullPredicate` is computed by ANDing predicates contributed by each ancestor hyperedge in its path. Predicates are contributed by domain modules via the payload; the navigation runtime asks the domain `whatPredicate(edge): FieldPredicate | null`. For domains where predicates don't apply (purely structural diagrams), this returns null and `fullPredicate` is the trivial `{and: []}`.

Crucially, because the navigation tree's NavNode identity is path-based, the same hyperedge under two different parent contexts has two distinct `fullPredicate` values. This is the right behavior — it lets a viz element seen "as part of grouping X" describe different filtered data than the same element seen "as part of grouping Y".

### 5.4 Reactive surface

The runtime exposes Solid signals and actions:

```ts
interface NavigationRuntime<P> {
  // Reactive state (Accessors)
  hypergraph: Accessor<Hypergraph<P>>;
  focusedNavId: Accessor<NavNodeId>;
  selection: Accessor<Selection>;
  expanded: Accessor<Set<NavNodeId>>;
  navTree: Accessor<NavTree>;             // derived; recomputed when hypergraph changes

  // Lookup
  getNavNode(navId: NavNodeId): NavNode | undefined;
  getHyperedge(id: HyperedgeId): Hyperedge<P> | undefined;
  fullPredicate(navId: NavNodeId): Selection;

  // Actions
  focus(navId: NavNodeId): void;
  moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void;
  expand(navId: NavNodeId): void;
  collapse(navId: NavNodeId): void;
  setSelection(s: Selection): void;

  // Plugin registries (called by domain modules during initialization)
  registerKeybinding(binding: KeybindingContribution<P>): void;
  registerDialog(dialog: DialogContribution<P>): void;
  registerPredicateProvider(provider: PredicateProvider<P>): void;
}
```

### 5.5 Navigation tree storage

The navigation tree is a derived structure. Two implementation options, equivalent semantically:

- **Eager**: rebuild the full nav tree when the hypergraph changes. Simple, fine for the sizes Olli handles in practice.
- **Lazy**: materialize NavNodes on first focus or first request. More complex but avoids wasted work for unvisited branches.

Recommendation: start eager; switch to lazy only if profiling demands it.

### 5.6 Keybindings

A small core keybinding set (matching Olli today):
- Arrow keys: left/right siblings, up/down hierarchy.
- Enter / Escape: collapse/expand or close dialogs.
- `t`: open table dialog (if registered).
- `f`: open filter dialog (if registered).
- `j`: open targeted-navigation dialog (if registered).

Domain modules add more (`x`/`y` shortcuts in `olli-vis`).

A `KeybindingContribution` is `{key, handler: (runtime, event) => boolean}`. The runtime fires registered handlers in registration order; the first to return `true` consumes the event.

## 6. L2 — Description framework

### 6.1 Token catalog and customization recipe

For each NavNode, two artifacts work together:

- **Token catalog** (per node, reactive): `Map<TokenName, string>` of every token whose `applicableRoles` includes this node's role. Recomputed when the underlying hyperedge, payload, selection, or current node changes.
- **Customization recipe** (per role, user-controlled): an ordered list of `{token: TokenName, brevity: 'short' | 'long'}` plus a duration (`persistent` | `ephemeral`). Determines which tokens from the catalog get spoken, in what order, at what brevity.

Rendering composes them: walk the recipe in order, look up each token in the catalog, format at the requested brevity, join the strings. Presence is set membership in the recipe; ordering is the recipe's sequence; brevity is per-token.

This separation means UI affordances map cleanly to data:
- The settings menu is "edit the recipe per role."
- The command box is "ephemerally override one or more recipe entries."
- A token going missing is invisible (not present in the recipe), not silently empty.

### 6.2 Token registration

```ts
interface DescriptionToken<P> {
  name: TokenName;
  applicableRoles: string[] | '*';
  compute: (ctx: TokenContext<P>) => TokenValue;
}

interface TokenValue {
  short: string;
  long: string;
}

interface TokenContext<P> {
  edge: Hyperedge<P>;
  navNode: NavNode;
  hypergraph: Hypergraph<P>;
  runtime: NavigationRuntime<P>;
  selection: Selection;
  fullPredicate: Selection;
}
```

A token always returns both brevity forms; the recipe decides which is rendered. For tokens where short and long are identical, the implementation just sets both fields the same.

### 6.3 Generic core tokens

These ship in L2 and apply to all domains:
- `name`: hyperedge `displayName` + `description`.
- `index`: position among siblings (e.g., "1 of 5").
- `level`: depth in the navigation tree.
- `parent`: parent NavNode's display name.
- `children`: count and/or names of children.
- `parentContexts`: applies only to virtual parent-context nodes; lists alternate parents.

### 6.4 Customization model

```ts
interface Customization {
  role: string;
  recipe: RecipeEntry[];
  duration: 'persistent' | 'ephemeral';
}

interface RecipeEntry {
  token: TokenName;
  brevity: 'short' | 'long';
}

interface CustomizationStore {
  // per-role active customization
  activeFor(role: string): Accessor<Customization>;
  setFor(role: string, customization: Customization): void;
  resetFor(role: string): void;

  // presets
  registerPreset(name: string, presets: Customization[]): void;
  applyPreset(name: string): void;
}
```

The customization store is reactive; node descriptions automatically reflow when recipes change.

### 6.5 Reactive describe

```ts
function describe(navId: NavNodeId): Accessor<string>;
```

Driven by signals on: the NavNode, the hyperedge, the payload, the selection, the active customization for the node's role. Solid memoization ensures only affected NavNodes recompute.

## 7. L3 — Renderer

A small Solid component library.

### 7.1 Component inventory

- `<Olli runtime={...} />`: top-level mount.
- `<TreeView />`: root container with `role="tree"`.
- `<TreeItem nav={navNode} />`: recursive component for each NavNode; emits `role="treeitem"`, manages `aria-expanded`, `aria-selected`, `tabindex`.
- `<NodeLabel nav={navNode} />`: renders the reactive description string.
- `<Dialog />`: modal primitive (focus trap, escape handling).
- `<SettingsMenu />`: customization editor.
- `<CommandBox />`: ephemeral customization input.

### 7.2 ARIA structure

Identical to current Olli: nested `<ul role="tree">` with `<li role="treeitem">` items, `aria-expanded` on expandable nodes, `aria-level` reflecting nav depth, `aria-setsize` and `aria-posinset` on each item.

The virtual parent-context node renders as a normal tree item with a label like "Parent contexts" — visually and structurally indistinguishable from any other tree node. Its children (the real parents) are tree items.

### 7.3 Dialog registry

Domains register dialogs by ID; the renderer looks up the registered constructor when a keybinding triggers it. Example:

```ts
domain.dialogs = [{
  id: 'table',
  applicableRoles: ['filteredData', 'datapoint'],
  triggerKey: 't',
  render: (runtime, navNode) => /* Solid component */,
}];
```

### 7.4 No imperative DOM

The current `init()` rebuild-on-selection-change is gone. Selection changes update a signal; only the NodeLabel components whose tokens depend on that selection recompute. Focus changes update a signal; only the items losing or gaining focus update their `tabindex` and `aria-selected`.

## 8. L4 — Domain modules

A domain module is a self-contained plugin:

```ts
interface OlliDomain<Spec, Payload> {
  name: string;
  toHypergraph(spec: Spec): Hypergraph<Payload>;
  tokens: DescriptionToken<Payload>[];
  presets?: Customization[];
  keybindings?: KeybindingContribution<Payload>[];
  dialogs?: DialogContribution<Payload>[];
  predicateProviders?: PredicateProvider<Payload>[];
}
```

A domain registers itself with the runtime at construction time. The runtime calls `toHypergraph` to get the structural data and then iterates the contribution arrays to wire everything in.

### 8.1 olli-vis

The visualization domain. Owns:
- `OlliVisSpec` types (the renamed `UnitOlliSpec` / `MultiOlliSpec`).
- `inferStructure` for axes, legends, facets.
- A lowerer that turns `OlliVisSpec` + the user-supplied or inferred `OlliNode[]` declarative tree into a hypergraph. The current `groupby` and `predicate` declarative authoring is preserved as the viz-domain authoring surface.
- Viz-specific tokens: `aggregate`, `quartile`, `data` (data values for a leaf row), and viz-aware overrides of generic tokens (e.g., `parent` knows about axis vs. legend).
- Viz-specific roles: `view`, `xAxis`, `yAxis`, `legend`, `guide`, `filteredData`, `annotations`.
- Dialogs: table view (`t`), filter menu (`f`), targeted navigation (`j`).
- Keybindings: `x`, `y` jump to axes.
- Presets: high / medium / low (per role), tuned per current Olli's CHI '24 designs.
- A `predicateProvider` that reads the payload's predicate field and contributes it to `fullPredicate`.

The viz payload:

```ts
interface VisPayload {
  predicate?: FieldPredicate;
  groupby?: string;
  specIndex?: number;
  // ... other viz-specific metadata
}
```

The lowerer assigns roles to hyperedges based on the `OlliNode` tree position (root → `root`, view → `view`, axis groupby → `xAxis`/`yAxis`/`legend` based on the spec, etc.).

### 8.2 olli-diagram

A minimal domain for the pulley acceptance case. Initially:
- A `DiagramSpec` type that's effectively `{ edges: Hyperedge<DiagramPayload>[] }` — direct authoring.
- A trivial lowerer (just `buildHypergraph`).
- No domain-specific tokens beyond what the generics provide; we'll see during implementation if `relationship` (for hangs/anchored hyperedges) needs its own token.
- No dialogs; no special keybindings; no selection.
- A pulley example file with the medium pulley hypergraph from Benthic.

### 8.3 olli-map (future)

Out of scope for this rewrite, but the architecture must accommodate:
- Geographic features as hyperedges, with payloads carrying coordinates and properties.
- Spatial-structure inference (e.g., bounding-box containment as parent relationship).
- Possibly map-specific dialogs (region selection, zoom to feature).

## 9. L5 — Adapters

`olli-adapters` continues to exist. Each adapter (Vega, Vega-Lite, Observable Plot) consumes a toolkit-specific spec and returns an `OlliVisSpec`. The contract from L4-`olli-vis` to adapters is unchanged conceptually; only the imports and types are renamed.

## 10. Package layout

Within `packages/olli-solid/`:

```
packages/olli-solid/
  package.json                  # workspace root
  pnpm-workspace.yaml
  tsconfig.base.json
  packages/
    olli-core/                  # L0 + L1 + L2
      src/
        hypergraph/
          types.ts
          build.ts
          traversal.ts
          ids.ts
          index.ts
        runtime/
          navtree.ts            # synthesis algorithm
          runtime.ts            # NavigationRuntime implementation (Solid signals)
          keybindings.ts        # registry
          dialogs.ts            # registry
          predicates.ts         # provider registry, fullPredicate computation
          index.ts
        description/
          tokens.ts             # registry, generic tokens
          customization.ts      # store, presets, recipes
          describe.ts           # reactive describe()
          index.ts
        predicate/
          types.ts              # vendored from vega-lite, minimal
          eval.ts               # selectionTest equivalent
          index.ts
        index.ts
      package.json
    olli-render-solid/          # L3
      src/
        TreeView.tsx
        TreeItem.tsx
        NodeLabel.tsx
        Dialog.tsx
        SettingsMenu.tsx
        CommandBox.tsx
        mount.tsx               # mount(domain, spec, container, options)
        styles.css
        index.ts
      package.json
    olli-vis/                   # L4: visualization domain
      src/
        spec/
          types.ts              # OlliVisSpec, OlliNode, OlliFieldDef, etc.
          index.ts
        lower/
          lower.ts              # OlliVisSpec → Hypergraph<VisPayload>
          infer.ts              # default structure from axes/legends
          index.ts
        tokens/
          aggregate.ts
          quartile.ts
          data.ts
          name.ts               # viz-aware override
          parent.ts             # viz-aware override
          index.ts
        dialogs/
          table.tsx
          filter.tsx
          targetedNav.tsx
          index.ts
        keybindings/
          xy.ts
          index.ts
        presets/
          high.ts
          medium.ts
          low.ts
          index.ts
        domain.ts               # OlliDomain<OlliVisSpec, VisPayload>
        index.ts
      package.json
    olli-diagram/               # L4: diagram domain (toy)
      src/
        spec/
          types.ts              # DiagramSpec, DiagramPayload
        lower/
          lower.ts
        examples/
          pulleyMedium.ts       # the Benthic medium pulley
        domain.ts
        index.ts
      package.json
    olli-adapters/              # L5
      src/
        VegaAdapter.ts
        VegaLiteAdapter.ts
        ObservablePlotAdapter.ts
        utils.ts
        index.ts
      package.json
    olli-js/                    # vanilla-JS consumer wrapper (default entry point)
      src/
        handle.ts               # OlliHandle: imperative API surface
        bridge.ts               # Solid signal → callback bridge utilities
        olliVis.ts              # olli() / olliVis() — vis-domain entry
        olliDiagram.ts          # olliDiagram() — diagram-domain entry
        index.ts                # barrel; re-exports adapters and spec types
      package.json
  examples/
    bar-chart/
    pulley-medium/
  apps/
    playground/                 # dev-time test harness for all examples
```

Each package's `package.json` has explicit dependency declarations matching the layer hierarchy. CI enforces that no package imports from a higher layer.

## 11. Key algorithms

### 11.1 Navigation tree synthesis

Input: `Hypergraph<P>`. Output: `NavTree` (a tree of NavNodes).

```
function buildNavTree(graph):
  navNodesByPath := empty map
  rootNavNodes := []

  for each rootEdgeId in graph.roots:
    rootNav := materialize([rootEdgeId], parent = null)
    rootNavNodes.push(rootNav)
    expandChildren(rootNav, graph, navNodesByPath)

  if rootNavNodes.length > 1:
    rootNavNodes := [synthesizeRoot(rootNavNodes)]

  return { roots: rootNavNodes, byNavId: navNodesByPath }

function materialize(path, parent):
  navId := path.join("/")
  edgeId := path[path.length - 1]
  edge := graph.edges.get(edgeId)
  return {
    navId,
    kind: 'real',
    hyperedgeId: edgeId,
    path,
    parentNavId: parent?.navId ?? null,
    childNavIds: [],  # filled in by expandChildren
  }

function expandChildren(parentNav, graph, navNodesByPath):
  edge := graph.edges.get(parentNav.hyperedgeId)
  for each childEdgeId in edge.children:
    childPath := parentNav.path + [childEdgeId]
    child := materialize(childPath, parentNav)
    navNodesByPath.set(child.navId, child)
    parentNav.childNavIds.push(child.navId)
    expandChildren(child, graph, navNodesByPath)
```

### 11.2 Upward navigation with virtual parent contexts

`moveFocus('up')` from a NavNode:
1. If current is a virtual parent-context node, do nothing (or close it; behavior decision).
2. Get the hyperedge of the current real NavNode. Look at `edge.parents`.
3. If there is exactly one parent OR if `parentNavId` is uniquely determined by the path: focus `parentNavId`. (Single-parent case → identical to current Olli.)
4. If multiple parents: synthesize a virtual parent-context NavNode whose:
   - `navId` is `current.navId + "/^"` (sentinel)
   - `kind` is `virtualParentContext`
   - `childNavIds` correspond to NavNodes for each parent. The "default" parent (the one in `current.path[length-2]`) is positioned first.
5. Focus the virtual node.

Pressing up from the virtual node (or pressing enter on a sibling): focus the corresponding real parent NavNode. Arrows left/right cycle alternates.

The virtual node's description uses the `parentContexts` token to announce: "Parent contexts. 3 options: BPL, Arsenal, Title. Default is BPL."

### 11.3 fullPredicate computation

```
function fullPredicate(navId):
  navNode := getNavNode(navId)
  if navNode.kind == 'virtualParentContext':
    return fullPredicate(navNode.parentNavId)  # inherit from real child
  predicates := []
  for each edgeId in navNode.path:
    edge := graph.edges.get(edgeId)
    for each provider in registeredPredicateProviders:
      p := provider(edge)
      if p: predicates.push(p)
  return { and: predicates }
```

Memoized per navId; recomputes when the hypergraph or providers change.

### 11.4 Reactive description pipeline

1. `describe(navId)` returns an `Accessor<string>`.
2. Internally, it depends on:
   - The NavNode (changes if nav tree rebuilds).
   - The hyperedge (changes if hypergraph mutates — rare in current Olli but possible).
   - The customization recipe for this node's role.
   - The token catalog for this NavNode (which transitively depends on selection, fullPredicate, payload).
3. Solid's `createMemo` ensures recomputation only when these change.

## 12. The `olli-js` consumer wrapper

`olli-js` is the default consumer entry point. It is a thin wrapper around the Solid stack that exposes an imperative API to downstream users. Because Solid compiles to standard DOM mutations, vanilla-JS consumers don't actually need Solid runtime concepts (signals, effects, Owner) at all — they just need a way to mount, observe, and command the runtime imperatively. `olli-js` provides that bridge.

It depends on `olli-render-solid`, `olli-vis`, `olli-diagram`, and `olli-adapters`. It bundles `solid-js` as a regular dependency (not peer), so consumers see no Solid in their own dependency graph.

### 12.1 Public API

The wrapper exposes domain-specific entry points (one per domain) plus a shared handle type.

```ts
import { OlliVisSpec, Customization, Selection, NavNodeId } from 'olli-js';

interface OlliOptions {
  initialSelection?: Selection;
  initialCustomization?: Record<string, Customization>;  // role → customization
  initialPreset?: string;
  callbacks?: {
    onFocus?: (navId: NavNodeId) => void;
    onSelection?: (selection: Selection) => void;
  };
}

interface OlliHandle {
  // navigation
  focus(navId: NavNodeId): void;
  getFocusedNavId(): NavNodeId;

  // selection
  setSelection(selection: Selection): void;
  getSelection(): Selection;

  // descriptions
  getDescription(navId: NavNodeId): string;

  // customization
  setCustomization(role: string, customization: Customization): void;
  applyPreset(name: string): void;

  // observers (callback-based, returns an unsubscribe function)
  onFocusChange(cb: (navId: NavNodeId) => void): () => void;
  onSelectionChange(cb: (selection: Selection) => void): () => void;

  // lifecycle
  destroy(): void;
}

// Vis-domain entry (also exported as the default `olli`)
function olliVis(spec: OlliVisSpec, container: HTMLElement, options?: OlliOptions): OlliHandle;
function olli(spec: OlliVisSpec, container: HTMLElement, options?: OlliOptions): OlliHandle;

// Diagram-domain entry
function olliDiagram(spec: DiagramSpec, container: HTMLElement, options?: OlliOptions): OlliHandle;

// Re-exported from olli-adapters for convenience
export { VegaAdapter, VegaLiteAdapter, ObservablePlotAdapter };
// Re-exported spec types
export { OlliVisSpec, OlliNode, DiagramSpec, /* ... */ };
```

Typical consumer usage:

```js
import { olli, VegaLiteAdapter } from 'olli-js';

const visSpec = await VegaLiteAdapter(myVegaLiteSpec);
const handle = olli(visSpec, document.getElementById('chart-tree'));

handle.onFocusChange(id => console.log('focused:', id));
handle.applyPreset('medium');

// later
handle.destroy();
```

### 12.2 Implementation sketch

The wrapper does three things:

1. **Owns a Solid root** (via `createRoot`) for the duration of the handle's lifetime, so the runtime's reactive computations are properly disposed when `destroy()` is called.
2. **Wraps Solid accessors as imperative getters**: `runtime.focusedNavId` (an `Accessor<NavNodeId>`) becomes `handle.getFocusedNavId()` (calls the accessor and returns its current value).
3. **Bridges signals to callbacks**: `handle.onFocusChange(cb)` internally runs `createEffect(() => cb(runtime.focusedNavId()))` inside the Solid root, returning a disposer that the consumer can call to unsubscribe. This lets non-Solid consumers receive notifications without writing reactive code.

Pseudocode:

```ts
function olli(spec, container, options = {}) {
  let dispose: () => void;
  let runtime: NavigationRuntime<VisPayload>;

  createRoot((d) => {
    dispose = d;
    runtime = mount(visDomain, spec, container, options);
  });

  return {
    focus: (id) => runtime.focus(id),
    getFocusedNavId: () => runtime.focusedNavId(),
    setSelection: (s) => runtime.setSelection(s),
    getSelection: () => runtime.selection(),
    getDescription: (id) => runtime.getDescriptionFor(id)(),
    setCustomization: (r, c) => runtime.customization.setFor(r, c),
    applyPreset: (n) => runtime.customization.applyPreset(n),
    onFocusChange: (cb) => bridgeSignal(() => runtime.focusedNavId(), cb),
    onSelectionChange: (cb) => bridgeSignal(() => runtime.selection(), cb),
    destroy: () => dispose(),
  };
}

function bridgeSignal<T>(read: () => T, cb: (value: T) => void): () => void {
  let dispose: () => void;
  createRoot((d) => {
    dispose = d;
    createEffect(() => cb(read()));
  });
  return dispose;
}
```

### 12.3 What `olli-js` is not

- **Not a separate runtime implementation.** L1 and L2 still live in `olli-core` and use Solid signals. The wrapper just hides them.
- **Not a feature-reduced API.** Anything a Solid consumer can do via the underlying packages, a vanilla-JS consumer can do via the handle.
- **Not where domain selection happens.** Each domain has its own entry function (`olli` / `olliVis`, `olliDiagram`) so there's no need to pass a domain parameter or import domain modules from consumer code.

### 12.4 Solid-native consumers

Consumers building Solid apps who want to embed Olli components into their own JSX can bypass `olli-js` and import directly from `olli-render-solid` and `olli-vis` (or `olli-diagram`). The wrapper exists for convenience and framework-agnostic usage; it is not the only way in.

## 13. Decisions log

For traceability, the design decisions made in conversation:

1. Hypergraph is the core data model (Benthic-style).
2. Olli's UX is preserved; multi-parent ascents use a synthesized virtual parent-context node rather than a separate UI mode.
3. Solid for reactivity; Solid-only for now (no React bridge).
4. Predicate model is kept and vendored (forked from vega-lite); domains opt in via predicate providers.
5. Description framework: token catalog (per node) + customization recipe (per role); presence/ordering/brevity are the three knobs.
6. "vis" not "viz" everywhere.
7. No backward compatibility with current Olli APIs; greenfield.
8. Validation domain is a hand-authored pulley diagram (Benthic's medium configuration).
9. `olli-js` is a thin imperative wrapper around the Solid stack — built as part of this rewrite, not deferred. It is the default consumer entry point.
