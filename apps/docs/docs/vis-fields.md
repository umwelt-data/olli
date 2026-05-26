# Fields, Axes & Legends

This page documents the types used to describe data fields and chart guides within an `OlliVisSpec`.

## OlliFieldDef

A field definition describes a column in the dataset.

```ts
interface OlliFieldDef {
  field: string;
  label?: string;
  type?: MeasureType;
  timeUnit?: OlliTimeUnit;
  bin?: boolean;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `field` | `string` | yes | The key in each datum. Must match a property in `OlliDatum`. |
| `label` | `string` | no | Human-readable label. Used in descriptions and dialogs instead of the raw field name. |
| `type` | `MeasureType` | no | The measurement type. Auto-inferred from data if omitted. |
| `timeUnit` | `OlliTimeUnit` | no | Temporal granularity. Affects how date values are formatted. |
| `bin` | `boolean` | no | Whether the field's values represent bin edges. Affects how ranges are displayed. |

## MeasureType

```ts
type MeasureType = 'quantitative' | 'ordinal' | 'nominal' | 'temporal';
```

| Type | Meaning | Sorting | Example |
| --- | --- | --- | --- |
| `quantitative` | Continuous numeric | Numeric | Temperature, price |
| `ordinal` | Ordered categories | By data order | Education level |
| `nominal` | Unordered categories | By data order | Country, color |
| `temporal` | Date/time | Chronological | Date, month |

Type inference examines the data column: if all values are `Date` instances, the type is `temporal`; if all are numbers, `quantitative`; otherwise `nominal`.

## OlliTimeUnit

```ts
type OlliTimeUnit = 'year' | 'month' | 'day' | 'date' | 'hours' | 'minutes' | 'seconds';
```

When set, temporal values are formatted at this granularity. For example, `timeUnit: 'month'` formats dates as month names.

## OlliGuide

The base guide type. All guides associate a field with a visual channel.

```ts
interface OlliGuide {
  field: string;
  title?: string;
  channel?: string;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `field` | `string` | yes | The data field this guide represents. |
| `title` | `string` | no | Display title. Falls back to the field's `label`, then the field name. |
| `channel` | `string` | no | The visual channel (e.g., `'x'`, `'color'`). |

## OlliAxis

An axis guide, extending `OlliGuide`.

```ts
interface OlliAxis extends OlliGuide {
  axisType: 'x' | 'y';
  scaleType?: string;
  ticks?: OlliValue[];
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `axisType` | `'x' \| 'y'` | yes | Which axis this represents. |
| `scaleType` | `string` | no | The scale type (e.g., `'linear'`, `'log'`, `'band'`). |
| `ticks` | `OlliValue[]` | no | Explicit tick values. Used to define bin boundaries for quantitative/temporal fields. |

When `ticks` is provided, the lowerer uses them as bin edges instead of computing bins from the data. This lets adapters pass through the exact tick marks from the rendered chart.

## OlliLegend

A legend guide, extending `OlliGuide`.

```ts
interface OlliLegend extends OlliGuide {
  channel: 'color' | 'opacity' | 'size';
}
```

The `channel` property is required and must be one of `'color'`, `'opacity'`, or `'size'`.

## How guides map to tree nodes

Each guide in `axes`, `legends`, or `guides` becomes a groupby node in the inferred tree structure when `structure` is omitted:

- An `OlliAxis` with `axisType: 'x'` produces a node with role `xAxis`.
- An `OlliAxis` with `axisType: 'y'` produces a node with role `yAxis`.
- An `OlliLegend` produces a node with role `legend`.
- A generic `OlliGuide` produces a node with role `guide`.

The children of each guide node are the distinct values (or bin ranges) of the guide's field.

## Next

- [Structure Nodes](/docs/vis-structure) — defining custom tree structures.
- [OlliVisSpec](/docs/vis-spec) — the top-level spec type.
