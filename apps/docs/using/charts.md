# Navigating Charts

This page covers how the tree is organized for data visualizations — bar charts, line charts, scatterplots, and the like. For the general navigation concepts, see [Understanding the Tree](/using/tree-structure).

## The chart levels

A chart tree has three levels of detail.

**Root.** The top item describes the chart as a whole: *"a bar chart of sales by region."* This is where you land when you first navigate to the tree.

**Guide.** Inside a sub-chart (or directly under the root for single-view charts), you find guides: axes and legends. Each guide describes one way the data is organized — *"x-axis titled region. 4 values"* or *"color legend titled category. 3 values."* Press `x`, `y`, or `l` from anywhere in the tree to jump straight to a guide.

**Data.** Under each guide, the data breaks down into intervals or categories. A nominal x-axis lists each category; a quantitative y-axis divides the range into intervals. This is the most detailed level, where you can explore individual data points.

## Axes and legends

An axis and a legend are both guides — they appear at the same level of the tree. The difference is how they organize the data: an axis groups by position (x or y), while a legend groups by a visual property like color, size, or opacity. The underlying data is the same; a legend just offers a different way to slice it.

## Multi-view charts

Some charts contain multiple views. The most common types:

- **Layered**: multiple marks drawn on the same axes (e.g., a line chart with points on top). Each layer is a separate view.
- **Faceted**: the same chart repeated for subsets of the data (e.g., one bar chart per region). Each facet is a separate view.
- **Concatenated**: different charts placed side by side in a dashboard. Each sub-chart is a separate view.

In all cases, each view has its own guides and data underneath it. You arrow sideways between views, then press **Down Arrow** to enter one.

## Try it out

Open any chart in the [gallery](/gallery/) — the [bar chart](/gallery/bar-chart) is a good place to start. Navigate through the levels to see how the descriptions change as you go deeper.

## Next

- [Navigating Diagrams](/using/diagrams) — how diagram trees differ from charts.
- [Dialogs](/using/dialogs) — opening tables, filters, and more.
