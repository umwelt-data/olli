# Vis Lowering

Lowering converts an `OlliVisSpec` into a `Hypergraph<VisPayload>`. This is the bridge between the declarative spec and the navigable tree structure.

## lowerVisSpec

```ts
function lowerVisSpec(spec: OlliVisSpec): Hypergraph<VisPayload>
```

`lowerVisSpec` is the visualization domain's lowerer. It handles both unit and multi-view specs.

### Pipeline

1. **Elaborate** — `elaborateSpec` fills in missing fields, infers types, and generates a default `structure` if none is provided.
2. **Lower** — The elaborated spec is walked to produce hyperedges.
3. **Build** — `buildHypergraph` validates parent/child symmetry, detects cycles, and returns the final `Hypergraph`.

### Unit spec lowering

For a `UnitOlliVisSpec`, the lowerer:

1. Creates a root edge with role `'root'`.
2. Walks each `OlliNode` in `structure`:
   - **OlliGroupNode**: Creates a guide edge (e.g., `xAxis`, `yAxis`, `legend`) with one child edge per distinct value or bin of the `groupby` field.
   - **OlliPredicateNode**: Creates a `filteredData` edge with the predicate in its payload.
   - **OlliAnnotationNode**: Creates an `annotations` edge containing the annotation children.
3. If the structure produces a single non-filteredData child, it's collapsed into the root to avoid unnecessary nesting.

### Multi-view lowering

For a `MultiOlliVisSpec`:

1. Creates a root edge.
2. Creates one `view` edge per unit, with `specIndex` and `viewType` in the payload. The view's display name is the unit's `title`, falling back to `"View N: <chart type>"` (e.g. "View 1: bar chart").
3. Each unit is lowered independently under its view edge.

### Faceting

When `facet` is set and the top-level structure is a single `groupby` on the facet field, the lowerer produces a faceted layout: the root groups by the facet field, and each child becomes a `view` with `viewType: 'facet'`.

## elaborateSpec

```ts
function elaborateSpec(spec: OlliVisSpec): OlliVisSpec
```

Pre-processes the spec before lowering:

1. **Field inference**: If `fields` is empty, creates one `OlliFieldDef` per key in `data[0]`.
2. **Type inference**: For fields without a `type`, examines the data column to determine `quantitative`, `temporal`, or `nominal`.
3. **Structure inference**: If `structure` is missing, builds a tree from axes, legends, and guides — each becomes a `groupby` node.
4. **Annotations**: If the spec has `annotations`, appends an annotations node containing them to the structure.

## How groupby expansion works

Given a `groupby` field, the lowerer calls `fieldToPredicates` to produce one `FieldPredicate` per distinct value or bin:

- **Nominal/ordinal fields**: One `FieldEqualPredicate` per distinct value, in data order.
- **Quantitative fields**: Binned into ranges using axis `ticks` or auto-computed edges. Each bin becomes a `FieldRangePredicate`.
- **Temporal fields**: Similar to quantitative, but with date-aware binning.

Each predicate becomes a child edge with role `filteredData` and the predicate stored in `payload.predicate`.

## Example

Given a simple bar chart spec:

```ts
const spec: UnitOlliVisSpec = {
  data: [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 15 },
  ],
  mark: 'bar',
  axes: [
    { field: 'category', axisType: 'x' },
    { field: 'value', axisType: 'y' },
  ],
};
```

After elaboration and lowering, the hypergraph looks like:

```
root ("bar chart")
├── xAxis ("x-axis titled category")
│   ├── filteredData ("A")
│   ├── filteredData ("B")
│   └── filteredData ("C")
```

The y-axis is quantitative with only three values, so it may also produce a guide node depending on the inferred structure.

## Next

- [OlliVisSpec](/docs/vis-spec) — the spec types.
- [Hypergraph](/docs/hypergraph) — the data model produced by lowering.
- [Structure Nodes](/docs/vis-structure) — customizing the tree structure.
