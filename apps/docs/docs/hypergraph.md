# Hypergraph

The hypergraph is Olli's core data model. All domain specs (visualizations, diagrams, or custom) are lowered into a `Hypergraph<P>` before navigation begins.

A hypergraph is a directed graph where edges can have multiple parents, unlike a traditional tree. This enables the "groupings" feature — a single data point can belong to more than one group.

## Hypergraph\<P\>

```ts
interface Hypergraph<P = unknown> {
  edges: ReadonlyMap<HyperedgeId, Hyperedge<P>>;
  roots: readonly HyperedgeId[];
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `edges` | `ReadonlyMap<HyperedgeId, Hyperedge<P>>` | yes | All edges in the graph, keyed by ID. |
| `roots` | `readonly HyperedgeId[]` | yes | IDs of edges with no parents. Typically one root per domain. |

The type parameter `P` is the domain-specific payload type: `VisPayload` for charts, `DiagramPayload` for diagrams, or `unknown` for the generic entry point.

## Hyperedge\<P\>

```ts
interface Hyperedge<P = unknown> {
  id: HyperedgeId;
  displayName: string;
  description?: string;
  role?: string;
  children: HyperedgeId[];
  parents: HyperedgeId[];
  payload?: P;
  contextOnly?: boolean;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | yes | Unique identifier within the graph. |
| `displayName` | `string` | yes | Short label shown to the user (e.g., "x-axis titled Year"). |
| `description` | `string` | no | Longer explanatory text, appended after the display name. |
| `role` | `string` | no | Semantic role (e.g., `'root'`, `'xAxis'`, `'element'`). Used by the description system to select tokens and recipes. |
| `children` | `HyperedgeId[]` | yes | IDs of child edges. |
| `parents` | `HyperedgeId[]` | yes | IDs of parent edges. An edge with multiple parents is multi-parent. |
| `payload` | `P` | no | Domain-specific data. Tokens and predicate providers read this. |
| `contextOnly` | `boolean` | no | If `true`, this edge is a context root — reachable through groupings but not in the primary tree. |

## buildHypergraph

```ts
function buildHypergraph<P>(edges: readonly Hyperedge<P>[]): Hypergraph<P>
```

Constructs a `Hypergraph` from a flat list of edges. Performs three validations:

1. **No duplicate IDs.** Each edge must have a unique `id`.
2. **Symmetric parent/child links.** If edge A lists B as a child, B must list A as a parent, and vice versa.
3. **No cycles.** The graph must be a DAG (directed acyclic graph).

Throws `HypergraphValidationError` on any violation.

Roots are identified automatically: any edge with an empty `parents` array is a root.

## Multi-parent edges

The key difference from a plain tree is that edges can have multiple parents:

```ts
const edges: Hyperedge[] = [
  { id: 'root', displayName: 'Root', children: ['group-a', 'group-b'], parents: [] },
  { id: 'group-a', displayName: 'Group A', children: ['item'], parents: ['root'] },
  { id: 'group-b', displayName: 'Group B', children: ['item'], parents: ['root'] },
  { id: 'item', displayName: 'Shared Item', children: [], parents: ['group-a', 'group-b'] },
];
```

Here, "Shared Item" belongs to both Group A and Group B. When a user navigates to this item, the [nav tree](/docs/navtree) generates virtual parent-context nodes so they can switch between groupings.

## Context-only edges

Edges with `contextOnly: true` appear as alternate groupings but don't form part of the primary tree. They're used by the diagram domain for referential relations like connections and alignments.

Context-only edges still appear in `graph.roots` if they have no parents, but the nav tree separates them into `contextRoots`.

## HyperedgeId

```ts
type HyperedgeId = string;
```

Edge IDs are strings. In the vis domain, they're auto-generated sequential numbers. In the diagram domain, they come from element and relation IDs in the spec.

## Next

- [Navigation Tree](/docs/navtree) — how the hypergraph becomes a navigable tree.
- [Vis Lowering](/docs/vis-lowering) — how visualizations produce hypergraphs.
- [Diagram Lowering](/docs/diagram-lowering) — how diagrams produce hypergraphs.
