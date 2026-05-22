# OlliVisSpec

`OlliVisSpec` is Olli's normalized description of a data visualization. It comes in two forms: `UnitOlliVisSpec` for a single chart, and `MultiOlliVisSpec` for layered or concatenated views.

You rarely write an `OlliVisSpec` by hand — [adapters](/docs/adapters) generate it from Vega-Lite, Vega, or Observable Plot. But understanding the shape is useful for debugging, writing tests, or building a custom adapter.

## UnitOlliVisSpec

A single chart view.

```ts
interface UnitOlliVisSpec {
  data: OlliDataset;
  fields?: OlliFieldDef[];
  structure?: OlliNode | OlliNode[];
  mark?: OlliMark;
  axes?: OlliAxis[];
  legends?: OlliLegend[];
  guides?: OlliGuide[];
  facet?: string;
  selection?: Selection;
  title?: string;
  description?: string;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `data` | `OlliDatum[]` | yes | The dataset. Each datum is a `Record<string, OlliValue>`. |
| `fields` | `OlliFieldDef[]` | no | Field definitions with types, labels, binning, time units. Auto-inferred if omitted. |
| `structure` | `OlliNode \| OlliNode[]` | no | How the tree is organized — groupby, predicate, and annotation nodes. Auto-inferred from axes/legends if omitted. |
| `mark` | `OlliMark` | no | A mark type string or `OlliMarkDef` object. Used for chart-type descriptions. See [OlliMark](#ollimark). |
| `axes` | `OlliAxis[]` | no | X and Y axis guides with field, title, scale type, and tick values. |
| `legends` | `OlliLegend[]` | no | Color, opacity, or size legend guides. |
| `guides` | `OlliGuide[]` | no | Generic guides that don't fit axis or legend. |
| `facet` | `string` | no | Field name for faceting. The top-level groupby becomes facet views. |
| `selection` | `Selection` | no | Pre-filter applied to the data before lowering. |
| `title` | `string` | no | Chart title. |
| `description` | `string` | no | Longer description, announced at the root node. |

## MultiOlliVisSpec

Multiple views composed together.

```ts
interface MultiOlliVisSpec {
  operator: 'layer' | 'concat';
  units: UnitOlliVisSpec[];
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `operator` | `'layer' \| 'concat'` | yes | `'layer'` overlays views (same axes). `'concat'` places them side by side. |
| `units` | `UnitOlliVisSpec[]` | yes | The individual views. |

## Type guard

```ts
function isMultiSpec(spec: OlliVisSpec): spec is MultiOlliVisSpec
```

## OlliMark

```ts
type OlliMarkType = 'point' | 'bar' | 'line' | 'area' | 'rect' | 'tick' | 'arc';

interface OlliMarkDef {
  type: OlliMarkType;
  innerRadius?: number;
  stack?: 'stacked' | 'grouped';
}

type OlliMark = OlliMarkType | OlliMarkDef;
```

The mark can be a plain type string (`'bar'`) or an object with additional properties (`{ type: 'arc', innerRadius: 50 }`). Mark-level properties like `innerRadius` and `stack` live on the `OlliMarkDef` object rather than the top-level spec.

Use the `getMarkType` helper to extract the type string from either form:

```ts
import { getMarkType } from 'olli-vis';

getMarkType('bar');                          // 'bar'
getMarkType({ type: 'arc', innerRadius: 50 }); // 'arc'
getMarkType(undefined);                      // undefined
```

The mark type drives chart-type inference in description tokens. A `point` mark with two quantitative axes becomes "scatterplot"; a `rect` with a color legend becomes "heatmap"; an `arc` mark becomes "pie chart" or "donut chart" depending on `innerRadius`.

## Value types

```ts
type OlliValue = string | number | Date;
type OlliDatum = Record<string, OlliValue>;
type OlliDataset = OlliDatum[];
```

## Elaboration

When you call `olliVis` or `lowerVisSpec`, the spec is first passed through `elaborateSpec`:

```ts
function elaborateSpec(spec: OlliVisSpec): OlliVisSpec
```

Elaboration fills in defaults:
1. If `fields` is missing, it creates one `OlliFieldDef` per key in `data[0]`.
2. If any field lacks a `type`, it runs type inference on the data column.
3. If `structure` is missing, it infers a tree structure from the axes, legends, and guides.

This means a minimal spec only needs `data`, `mark`, and `axes` — everything else is derived.

## Next

- [Fields, Axes & Legends](/docs/vis-fields) — field definitions and guide types.
- [Structure Nodes](/docs/vis-structure) — how the tree structure is specified.
- [Vis Lowering](/docs/vis-lowering) — how specs become hypergraphs.
