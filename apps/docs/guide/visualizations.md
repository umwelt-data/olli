# Visualizations

This page covers how Olli's tree structure applies to data visualizations. For the shared vocabulary behind the tree, see [Concepts](/guide/concepts).

## The four chart levels

For a chart, Olli produces a fixed four-level tree.

**Root.** The top node describes the chart as a whole: "a bar chart of sales by region." Tab into the tree from the rest of the page to land here.

**View.** Charts with multiple views put each view as a child of the root. A layered line-and-point chart has one view per layer; a faceted barley plot has one view per site; a concatenated dashboard has one view per sub-chart. A single-view chart skips this level.

**Guide.** Inside a view, axes and legends appear as guide nodes: "x-axis titled region. 4 values." Pressing `x`, `y`, or `l` from anywhere in the tree jumps straight to the x-axis, y-axis, or legend.

**Data.** Under each guide, the data breaks down into intervals or categories. For example, a quantitative x-axis divides the data into intervals; a nominal x-axis lists each category.

## Axes and legends are both guides

An axis and a legend are the same kind of node at the tree's third level. The difference is what they organize by: an axis groups data by a positional encoding (x, y); a legend groups by a non-positional encoding (color, shape, size). The underlying data is the same; a legend just offers another way of organizing it.

## Multi-view charts

Layered, concatenated, and faceted charts all produce a view level. Each view gets its own subtree with its own guides and data.

## Spec sources

`olliVis` accepts a normalized `OlliVisSpec`. Adapters in `olli-adapters` convert from Vega-Lite, Vega, and Observable Plot. See [Quickstart](/guide/quickstart) for the integration.
