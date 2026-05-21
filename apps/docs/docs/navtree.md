# Navigation Tree

The nav tree is a strict tree-shaped projection of the [hypergraph](/docs/hypergraph). Since the hypergraph allows multi-parent edges, the nav tree duplicates shared nodes under each parent they belong to, and provides virtual nodes for switching between groupings.

## NavTree

```ts
interface NavTree {
  roots: readonly NavNodeId[];
  contextRoots: readonly NavNodeId[];
  byNavId: ReadonlyMap<NavNodeId, NavNode>;
  hyperedgeToNavIds: ReadonlyMap<HyperedgeId, readonly NavNodeId[]>;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `roots` | `NavNodeId[]` | yes | Root nav node IDs (from non-context-only hyperedge roots). |
| `contextRoots` | `NavNodeId[]` | yes | Nav node IDs for context-only roots. |
| `byNavId` | `Map<NavNodeId, NavNode>` | yes | All nav nodes, keyed by nav ID. |
| `hyperedgeToNavIds` | `Map<HyperedgeId, NavNodeId[]>` | yes | Reverse index: for each hyperedge, which nav nodes represent it. |

## NavNode

```ts
interface NavNode {
  navId: NavNodeId;
  kind: NavNodeKind;
  hyperedgeId: HyperedgeId | null;
  path: readonly HyperedgeId[];
  parentNavId: NavNodeId | null;
  childNavIds: NavNodeId[];
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `navId` | `string` | yes | Unique identifier. For real nodes, it's the slash-joined path of hyperedge IDs. |
| `kind` | `NavNodeKind` | yes | `'real'` or `'virtualParentContext'`. |
| `hyperedgeId` | `HyperedgeId \| null` | yes | The underlying hyperedge. `null` for virtual nodes. |
| `path` | `HyperedgeId[]` | yes | The sequence of hyperedge IDs from root to this node. |
| `parentNavId` | `NavNodeId \| null` | yes | Parent nav node. `null` for roots. |
| `childNavIds` | `NavNodeId[]` | yes | Child nav nodes. |

## NavNodeKind

```ts
type NavNodeKind = 'real' | 'virtualParentContext';
```

- **`'real'`** — A direct projection of a hyperedge. Has a non-null `hyperedgeId`.
- **`'virtualParentContext'`** — A synthesized node that appears when the user navigates "up" from a multi-parent node. These are not stored in the nav tree's `byNavId` map — they're created on-demand by the runtime.

## buildNavTree

```ts
function buildNavTree<P>(graph: Hypergraph<P>): NavTree
```

Builds a `NavTree` from a hypergraph by walking from roots through children. The algorithm:

1. For each root hyperedge, creates a root nav node.
2. Recursively expands children. Each child's `navId` is the parent's path plus the child's hyperedge ID, joined with `/`.
3. Multi-parent hyperedges appear at each location where they're referenced as a child, creating multiple real nav nodes for the same hyperedge.
4. Context-only roots go into `contextRoots`.

## Nav ID structure

A nav ID encodes the path from root to node:

```
"0"         → root (hyperedge "0")
"0/1"       → child of root (hyperedge "1" under "0")
"0/1/3"     → grandchild (hyperedge "3" under "1" under "0")
"0/1/3/^0"  → virtual parent-context node (option 0 for "0/1/3")
```

The `hyperedgeToNavIds` reverse index maps a single hyperedge ID to all the nav IDs where it appears. This is useful for finding a node in the tree when you know the hyperedge but not the path.

## Virtual parent-context nodes

When a node has multiple parents in the hypergraph, pressing "up" doesn't go to the tree-walk parent — instead it shows a list of groupings. These groupings are virtual nodes:

1. The user presses Up on a multi-parent node.
2. The runtime generates virtual nav IDs: `sourceNavId/^0`, `sourceNavId/^1`, etc.
3. Each virtual node represents a possible parent context. Index 0 is the current (default) parent.
4. Left/Right arrows switch between options. Up commits to the selected grouping (navigates to that parent). Down returns to the source node.

Virtual nodes have `kind: 'virtualParentContext'` and `hyperedgeId: null`. They're synthesized by the runtime, not stored in the nav tree.

## Utility functions

```ts
function isVirtualNavId(navId: NavNodeId): boolean
function sourceNavIdOfVirtual(navId: NavNodeId): NavNodeId
function optionIndexOfVirtual(navId: NavNodeId): number
function virtualNavIdFor(sourceNavId: NavNodeId, index: number): NavNodeId
```

These helpers parse and construct virtual nav IDs.

## Next

- [Navigation Runtime](/docs/runtime) — manages focus, selection, and movement through the nav tree.
- [Hypergraph](/docs/hypergraph) — the multi-parent graph the nav tree is built from.
