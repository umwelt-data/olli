# Concepts

Olli organizes data into a tree that a screen reader user navigates with the arrow keys. The same ideas apply whether the underlying data is a visualization or a diagram. This page covers the shared vocabulary. For domain-specific detail, see [Visualizations](/guide/visualizations) and [Diagrams](/guide/diagrams).

## Levels

The tree is organized into **levels**, where each level corresponds to a different slice of detail. A user moves down a level with the down arrow, up a level with the up arrow, and across siblings with left and right.

For a visualization, Olli produces these levels: the whole chart, each view if the chart is a multi-view spec, axes and legends, and intervals or categories within the axes/legends.  See [Visualizations](/guide/visualizations) for the full breakdown.

For a diagram, the levels come from the diagram's own structure. A pulley system might have an overview level, subsystem level, part level, and individual-element level. See [Diagrams](/guide/diagrams) for the hypergraph model behind this.

The level idea comes from [Zong et al. 2022](http://vis.csail.mit.edu/pubs/rich-screen-reader-vis-experiences/), which that screen reader users wanted both the high-level structure a sighted user gets at a glance and the row-level data a table gives.

## Parent-context switching

Not every node has exactly one parent. In a pulley diagram, a single rope can belong to two different pulley systems. Or, in some charts, a single data row can belong to multiple perceptual groupings (e.g. in a stacked bar chart, data can be grouped by bar or by color).

When a node has multiple parents, Olli surfaces the other parents as virtual sibling nodes at the current level. A user arrows sideways to one of those siblings, hears "also part of [other parent]," and presses down to continue exploring from that parent's perspective. This lets a shared node act as a junction between parts of the tree without the user losing track of where they came from.

This is most common in diagrams, where hyperedges make shared membership routine. See [Diagrams](/guide/diagrams#shared-nodes) for how this plays out in a pulley system.

## Tokens

Each node's description is assembled from named **tokens**: `name`, `index`, `parent`, `children`, and so on. The default recipes work for most charts, but a developer can override them per role, and an end user can switch verbosity presets at runtime. See [Entry points](/guide/entry-points#verbosity-presets) for the runtime controls, and [Extending Olli](/guide/extending#tokens) for authoring new tokens.

## Keybindings at a glance

- Up / Down: move between levels
- Left / Right: move within a level
- Home / End: jump to the first or last sibling at the current level
- Enter: expand or collapse the current node
- `o`: jump back into the Olli tree from anywhere else on the page
- `x`, `y`, `l`: jump to the x-axis, y-axis, or legend (visualizations)
- `t`: open a table for the current focus
- `f`: open the filter menu
- `r`: open targeted navigation to jump to a named value

See [Tutorial](/guide/tutorial) for a hands-on walkthrough.

## Next

- [Visualizations](/guide/visualizations) — dive deeper into visualizations.
- [Diagrams](/guide/diagrams) — dive deeper into diagrams.
- [Gallery](/gallery/) — runnable examples across chart and diagram types.