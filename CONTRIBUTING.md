# Contributing to Olli

If you find a bug in the code or a mistake on the [documentation site](https://umwelt-data.github.io/olli/), or if you would like to request a new feature, please [file an issue on GitHub](https://github.com/umwelt-data/olli/issues), or even better, submit a pull request.

For small fixes, please feel free to submit a pull request directly: don't worry about creating an issue first. For major changes, please discuss with us first. To ensure the discussion is visible and open for comments, please submit a new issue that we can tag with the discussion label.

If you would like to make multiple unrelated modifications, please separate them into separate pull requests for independent review and merging. If making significant inter-related modifications, please try to provide a logical sequence of piecewise commits rather than one giant commit spanning many files (as is feasible). Please also include appropriate test cases for ensuring correctness. Feel free to reach out for help or confirmation if you have questions on how to best proceed!

## Website and Documentation

The Olli website and documentation is in the `docs/` folder of this repository. We use Jekyll and Github Pages to publish our documentation.

# Development Setup

To setup a development environment follow the [Development Instructions in README.md](https://github.com/umwelt-data/olli/blob/main/README.md#development-instructions).

For an overview of all packages, see the [`/packages` folder](/packages).

# Creating an Adapter

Olli's adapter pattern allows developers to extend Olli support to additional visualization toolkits while re-using our accessible renderer.

Please refer to `VegaLiteAdapter` in [`adapters/src/VegaLiteAdapter.ts`](https://github.com/umwelt-data/olli/blob/main/packages/adapters/src/VegaLiteAdapter.ts) for a reference implementation.

The `VisAdapter` type is defined in [`core/src/Types.ts`](https://github.com/umwelt-data/olli/blob/main/packages/core/src/Types.ts).

```typescript
export type VisAdapter<T> = (spec: T) => Promise<OlliVisSpec>;
```

`T` is a generic type representing the type of the library's spec. For example, the Vega adapter has the following type signature:

```typescript
import { Spec } from "vega";

// ...

export const VegaAdapter: VisAdapter<Spec> = async (vSpec: Spec): Promise<OlliVisSpec> => {
  // ...
}
```

The purpose of the adapter function is to provide information to Olli as an `OlliVisSpec`, which is also defined in [`core/src/Types.ts`](https://github.com/umwelt-data/olli/blob/main/packages/core/src/Types.ts).

```typescript
 /**
  * Base information that is common to all OlliVisSpecs
  */
 type BaseOlliVisSpec = {
     type: "chart" | "facetedChart",
     data: OlliDataset,
     title? : string
 }

 /**
  * The grammar of graphics information that has to be parsed from a single view visualization.
  */
  export interface Chart extends BaseOlliVisSpec {
     type: "chart",
     axes: Axis[] ,
     legends: Legend[],
     mark?: OlliMark
 }

 /**
  * plots that may have multiple charts contained within a single specification
  */
 export interface FacetedChart extends BaseOlliVisSpec {
     type: "facetedChart",
     charts: Map<string, Chart>, // maps facet value to chart
     facetedField: string,
 }

 export type OlliVisSpec = Chart | FacetedChart;
 ```
 
 The `OlliVisSpec` includes the dataset, and can be either a `Chart` (for a single-view visualization) or a `FacetedChart` (for a faceted chart). (Support for other kinds of multi-view charts is forthcoming.)
 
For each `Chart`, the adapter must provide definitions for `axes` and `legends`. The definition for the `Axis` and `Legend` types are also found in [`core/src/Types.ts`](https://github.com/umwelt-data/olli/blob/main/packages/core/src/Types.ts).


```typescript
/**
 * The {@link Guide} is an the information needed for generating various nodes on the Accessibility Tree where
 *   type: discrete (e.g. for nominal, ordinal data) or continuous (e.g. for quantitative, temporal data)
 *   values: array of values (ex: tick values for a continuous axis, category names for a discrete axis)
 *   field: name of the field encoded by the axis
 *   title: human-readable axis title
 */
export type Guide = {
  type: 'discrete' | 'continuous',
  values: string[] | number[],
  field: string,
  title?: string,
}

/**
* Extending the {@link Guide} interface for visualization axes
*/
export interface Axis extends Guide {
  axisType: 'x' | 'y',
  scaleType?: string // e.g. linear, logarithmic, band
}

/**
* Extending the {@link Guide} interface for visualization legends
*/
export interface Legend extends Guide {
  channel?: string // e.g. color, opacity
}
```

The `values` property for each guide represents e.g. axis ticks or legend categories, and is used to generate the level of the tree that segments the axes/legends into intervals and categories.

In sum, the required information for an adapter mostly consists of the dataset, axis and legend information, and mark information. Many fields in `OlliVisSpec` and associated types are optional. However, they are important to include if possible to improve the quality and readability of the accessible descriptions.
