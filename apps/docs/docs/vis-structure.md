# Structure Nodes

The `structure` property of a `UnitOlliVisSpec` controls how the accessible tree is organized. It's a tree of `OlliNode` values that describe groupby operations, predicate filters, and annotation highlights.

When `structure` is omitted, Olli infers it from the spec's axes, legends, and guides. But you can provide it explicitly to customize the navigation hierarchy.

## OlliNode

```ts
type OlliNode = OlliGroupNode | OlliPredicateNode | OlliAnnotationNode;
```

## OlliGroupNode

Groups the data by a field. Each distinct value (or bin range) of the field becomes a child node.

```ts
interface OlliGroupNode {
  groupby: string | string[];
  children?: OlliNode[];
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `groupby` | `string \| string[]` | yes | The field name (or names) to group by. |
| `children` | `OlliNode[]` | no | Nested structure within each group. |

For example, grouping a bar chart by the x-axis field and then by a color field:

```ts
const structure: OlliNode = {
  groupby: 'category',
  children: [{ groupby: 'color' }]
};
```

The lowerer expands each `OlliGroupNode` into one child hyperedge per distinct value. For quantitative and temporal fields, values are binned using axis ticks or auto-computed bin edges.

## OlliPredicateNode

Filters the data by a predicate expression. Use this for curated data highlights or interesting subsets.

```ts
interface OlliPredicateNode {
  predicate: LogicalComposition<FieldPredicate>;
  name?: string;
  reasoning?: string;
  children?: OlliNode[];
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `predicate` | `LogicalComposition<FieldPredicate>` | yes | A filter expression. See [Predicates & Selection](/docs/predicates). |
| `name` | `string` | no | Display name. If omitted, auto-generated from the predicate. |
| `reasoning` | `string` | no | Why this subset is interesting. Not currently surfaced in descriptions. |
| `children` | `OlliNode[]` | no | Nested structure within the filtered subset. |

```ts
const highlight: OlliPredicateNode = {
  predicate: { field: 'temperature', gte: 100 },
  name: 'Extreme heat days',
};
```

## OlliAnnotationNode

A container for data highlights. Its children are displayed under a "Data highlights" label.

```ts
interface OlliAnnotationNode {
  annotations: OlliNode[];
}
```

Annotation nodes are typically placed at the top level alongside groupby nodes:

```ts
const structure: OlliNode[] = [
  { groupby: 'date' },
  {
    annotations: [
      { predicate: { field: 'price', gte: 200 }, name: 'High prices' },
      { predicate: { field: 'price', lte: 10 }, name: 'Low prices' },
    ],
  },
];
```

As a shorthand, you can set `annotations` directly on the `UnitOlliVisSpec` instead of writing the wrapper node yourself — elaboration appends an annotations node containing them to the structure (whether the structure was provided or inferred):

```ts
const spec: UnitOlliVisSpec = {
  data,
  mark: 'line',
  axes,
  annotations: [
    { predicate: { field: 'price', gte: 200 }, name: 'High prices' },
  ],
};
```

## VisPayload

When the lowerer converts structure nodes into hyperedges, each edge carries a `VisPayload`:

```ts
interface VisPayload {
  nodeType: OlliNodeType;
  predicate?: FieldPredicate;
  groupby?: string;
  specIndex?: number;
  viewType?: 'facet' | 'layer' | 'concat';
  spec: UnitOlliVisSpec;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `nodeType` | `OlliNodeType` | yes | The role of this node — `'root'`, `'view'`, `'xAxis'`, `'yAxis'`, `'legend'`, `'guide'`, `'filteredData'`, `'annotations'`, or `'other'`. |
| `predicate` | `FieldPredicate` | no | The filter predicate for this node, if any. |
| `groupby` | `string` | no | The field being grouped on, if any. |
| `specIndex` | `number` | no | Index into `MultiOlliVisSpec.units` for multi-view charts. |
| `viewType` | `string` | no | For multi-view: `'facet'`, `'layer'`, or `'concat'`. |
| `spec` | `UnitOlliVisSpec` | yes | The unit spec this node belongs to. |

The `VisPayload` is available on every hyperedge via `edge.payload`, and tokens use it to compute descriptions.

## OlliNodeType

```ts
type OlliNodeType =
  | 'root'
  | 'view'
  | 'xAxis'
  | 'yAxis'
  | 'legend'
  | 'guide'
  | 'filteredData'
  | 'annotations'
  | 'other';
```

Node types serve as roles for the description system. Each role can have a different set of tokens and a different recipe. See [Presets](/docs/presets) for the role/token matrix.

## Next

- [Vis Lowering](/docs/vis-lowering) — how structure nodes become hypergraph edges.
- [Predicates & Selection](/docs/predicates) — the predicate expression language.
