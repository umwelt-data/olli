# Tokens

Tokens are the building blocks of Olli's description system. Each token computes a fragment of text for a nav node — a name, an index, a data summary, etc. The description system assembles these fragments into the full screen reader announcement.

## DescriptionToken\<P\>

```ts
interface DescriptionToken<P = unknown> {
  name: TokenName;
  applicableRoles: readonly string[] | '*';
  compute: (ctx: TokenContext<P>) => TokenValue;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | Unique identifier (e.g., `'name'`, `'visType'`, `'aggregate'`). |
| `applicableRoles` | `string[] \| '*'` | yes | Which hyperedge roles this token applies to. `'*'` means all roles. |
| `compute` | `(ctx) => TokenValue` | yes | Produces the text for a given nav node context. |

## TokenValue

```ts
interface TokenValue {
  short: string;
  long: string;
  joinHint?: JoinHint;
  nextJoinHint?: JoinHint;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `short` | `string` | yes | Concise form (e.g., `"3 of 10"`). |
| `long` | `string` | yes | Detailed form (e.g., `"item 3 of 10"`). |
| `joinHint` | `'sentence' \| 'clause'` | no | How to join with the previous fragment. `'sentence'` starts a new sentence; `'clause'` appends with a comma. |
| `nextJoinHint` | `JoinHint` | no | Overrides the join hint for the *next* fragment. |

Return empty strings for `short` and `long` when the token doesn't apply to the current node (e.g., a chart-type token on a data point). Empty values are skipped during assembly.

## TokenContext\<P\>

The context object passed to `compute`:

```ts
interface TokenContext<P> {
  navNode: NavNode;
  edge: Hyperedge<P> | null;
  hypergraph: Hypergraph<P>;
  runtime: NavigationRuntime<P>;
  selection: Selection;
  fullPredicate: Selection;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `navNode` | `NavNode` | yes | The nav node being described. |
| `edge` | `Hyperedge<P> \| null` | yes | The underlying hyperedge (null for virtual nodes). |
| `hypergraph` | `Hypergraph<P>` | yes | The current hypergraph. |
| `runtime` | `NavigationRuntime<P>` | yes | The navigation runtime. Access sibling/parent nodes, other edges, etc. |
| `selection` | `Selection` | yes | The current selection (filter state). |
| `fullPredicate` | `Selection` | yes | The composed predicate for this node (intersection of ancestor predicates). |

## Built-in tokens

These are registered automatically by `createNavigationRuntime`:

| Token | Roles | Description |
| --- | --- | --- |
| `name` | `*` | The edge's `displayName` (and `description` in long form). |
| `index` | `*` | Position among siblings: "1 of 4" / "item 1 of 4". |
| `level` | `*` | Tree depth: "level 2" / "depth level 2". |
| `parent` | `*` | Parent edge name. For multi-parent nodes: "grouping: Parent Name". Hidden when no multi-parent edges exist for the role. |
| `children` | `*` | Child count and names: "3 children: A, B, C". |
| `parentContext` | `__virtualParentContext__` | Virtual node description: "Grouping for Item: Parent Name (current)". |

## Vis-domain tokens

Registered by the visualization domain:

| Token | Roles | Description |
| --- | --- | --- |
| `name` | `*` | Overrides built-in. Uses chart title, axis labels, or predicate descriptions. |
| `visType` | root, view, axes, legend, guide | Chart type ("a bar chart", "a scatterplot") or scale type ("for a quantitative scale"). |
| `children` | `*` | Overrides built-in. For root/view nodes, lists axis names instead of child count. |
| `visData` | axes, legend, guide, filteredData, other | Data range ("with values from 0 to 100") or predicate description. |
| `visSize` | root, filteredData, annotations, other | Data count ("5 values") or facet count ("with 3 views for Year"). |
| `aggregate` | axes, legend, filteredData | Statistical summary ("avg Temperature: 72"). For boxplots, reports the five-number summary (median, quartiles, min/max) instead of the mean. |
| `quartile` | filteredData | Relative position ("this section's average Temperature is in the 2nd quartile"). |
| `parent` | `*` | Overrides built-in. Walks up to find facet view name if applicable. |
| `instructions` | root, filteredData, other | Contextual help ("press ? for help", "press t to open table"). |

## TokenRegistry

```ts
interface TokenRegistry<P> {
  register(token: DescriptionToken<P>): void;
  byName(name: TokenName): DescriptionToken<P> | undefined;
  all(): readonly DescriptionToken<P>[];
  applicableTo(role: string): readonly DescriptionToken<P>[];
}
```

When a domain registers a token with the same name as a built-in token, the domain token replaces it. This is how the vis domain overrides `name`, `children`, and `parent`.

## How descriptions are assembled

The `describe` function:

1. Determines the node's **role** from the hyperedge (`edge.role`). Virtual nodes use the special role `__virtualParentContext__`.
2. Gets the **active recipe** for that role from the `CustomizationStore`.
3. For each entry in the recipe, calls `token.compute(context)` and selects `short` or `long` based on the recipe's brevity setting.
4. Non-empty results are joined: `'sentence'` hints start a new sentence (`. `), `'clause'` hints append with `, `.
5. The result is capitalized and terminated with a period.

See [Recipes & Customization](/docs/recipes) for how recipes control which tokens appear and in what form.

## Next

- [Recipes & Customization](/docs/recipes) — controlling which tokens appear per role.
- [Presets](/docs/presets) — pre-built recipe configurations.
- [Contributing Tokens](/docs/domain-tokens) — writing a custom token.
