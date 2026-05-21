# Relations

Diagram relations describe how elements relate to each other. There are five relation types, divided into two categories:

- **Structural** relations (`containment`, `grouping`) define the primary tree hierarchy.
- **Referential** relations (`connection`, `alignment`, `distribution`) create cross-cutting groupings accessible via the groupings UI.

## DiagramRelation

```ts
type DiagramRelation =
  | ConnectionRelation
  | ContainmentRelation
  | AlignmentRelation
  | DistributionRelation
  | GroupingRelation;
```

All relations share `kind`, `id`, and an optional `label`. The `id` must be unique across all relations.

## ConnectionRelation

A pairwise link between two elements.

```ts
interface ConnectionRelation {
  kind: 'connection';
  id: string;
  endpoints: [string, string];
  directed?: boolean;
  label?: string;
  semantic?: string;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoints` | `[string, string]` | yes | The two element IDs. |
| `directed` | `boolean` | no | If `true`, the display name uses "connects to" instead of "Connection:". |
| `semantic` | `string` | no | A verb phrase for the display name (e.g., `'wraps-around'` → "Rope wraps around Wheel"). Hyphens are replaced with spaces. |

Connections are **referential** — they create a `contextOnly` hyperedge that provides an alternate grouping for the connected elements.

## ContainmentRelation

One element contains others.

```ts
interface ContainmentRelation {
  kind: 'containment';
  id: string;
  container: string;
  contents: string[];
  label?: string;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `container` | `string` | yes | The containing element ID. |
| `contents` | `string[]` | yes | The contained element IDs. |

Containment is **structural** — it becomes a primary parent in the tree hierarchy. The container element and its contents are all children of the containment edge.

## AlignmentRelation

Elements sharing a spatial alignment.

```ts
interface AlignmentRelation {
  kind: 'alignment';
  id: string;
  members: string[];
  axis: 'horizontal' | 'vertical' | 'both';
  label?: string;
}
```

Alignment is **referential**. The default display name is "Aligned horizontal: A, B, C".

## DistributionRelation

Elements distributed evenly along an axis.

```ts
interface DistributionRelation {
  kind: 'distribution';
  id: string;
  members: string[];
  direction: 'horizontal' | 'vertical';
  label?: string;
}
```

Distribution is **referential**. The default display name is "Distributed horizontal: A, B, C".

## GroupingRelation

A named group of elements.

```ts
interface GroupingRelation {
  kind: 'grouping';
  id: string;
  members: string[];
  label?: string;
  description?: string;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `members` | `string[]` | yes | Element IDs in the group. |
| `label` | `string` | no | Short display name. Default: "Group of N: A, B, C". |
| `description` | `string` | no | Explanatory text appended after the label. |

Grouping is **structural** — it defines a primary parent in the tree.

## Structural vs referential

The distinction matters for tree construction:

- **Structural** relations (`containment`, `grouping`) are children of the root. Elements that belong to a structural relation have that relation as a parent.
- **Referential** relations (`connection`, `alignment`, `distribution`) are marked `contextOnly: true`. They provide alternate groupings accessible through the groupings feature but don't define the primary tree hierarchy.

An element can belong to multiple relations, creating multi-parent edges in the hypergraph. When a user navigates to such an element, they can switch between groupings to explore different organizational perspectives.

## Next

- [DiagramSpec](/docs/diagram-spec) — the top-level spec type.
- [Diagram Lowering](/docs/diagram-lowering) — how relations become hypergraph edges.
