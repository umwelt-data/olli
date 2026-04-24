# What is Olli?

Olli converts a data visualization into an accessible tree that a screen reader user can navigate with the arrow keys. At each node, a screen reader announces a description of what's in focus. The tree is organized into levels that correspond to different levels of detail. A user can start at the overall chart summary, and drill down into axes and legends, intervals and categories, all the way to individual data points.

Olli currently supports visualizations and diagrams. For visualizations, Olli takes a visualization spec (Vega-Lite, Vega, Observable Plot) as input. For diagrams, Olli takes a [hypergraph](/guide/diagrams) describing a diagram. Its output is a `<div>` containing the tree, plus a JS handle for two-way interaction with the chart.

## Pick a path

**I'm a screen reader user and want to know how to use Olli.**
Start with the [tutorial](/guide/tutorial): a hands-on walk through a live example with a screen reader. Once the keyboard feels natural, [concepts](/guide/concepts) covers the vocabulary shared across every Olli tree, and [visualizations](/guide/visualizations) and [diagrams](/guide/diagrams) go deeper on each domain.

**I'm a developer and want to add Olli to my site.**
Start with the [quickstart](/guide/quickstart): install, render a Vega-Lite bar chart, and attach an Olli tree in one HTML file. Then read [entry points](/guide/entry-points) to pick between `olliVis`, `olliDiagram`, and `olli`, and to see the `OlliHandle` and options each accepts. [Extending Olli](/guide/extending) covers how to wire a new data domain onto the same tree-navigation kernel. For an overview of the data models already supported, see [visualizations](/guide/visualizations) and [diagrams](/guide/diagrams).
