# Understanding the Tree

Olli organizes data into a tree where each level represents a different slice of detail. You move down to get more specific, up to get a broader view, and sideways to compare items at the same level of detail.

## Levels

The tree starts with a summary at the top and gets more specific as you go deeper. Each time you press the **Down Arrow**, you move to a more detailed level. Each time you press the **Up Arrow**, you move back to a broader level.

What you hear at each level depends on whether you're navigating a chart or a diagram. See [Navigating Charts](/using/charts) for the chart-specific levels and [Navigating Diagrams](/using/diagrams) for diagrams.

The level idea comes from [Zong et al. 2022](http://vis.csail.mit.edu/pubs/rich-screen-reader-vis-experiences/), which found that screen reader users wanted both the high-level structure a sighted user gets at a glance and the row-level data a table gives.

## What the descriptions tell you

At each item, your screen reader announces a description assembled from several pieces of information:

- **Name**: what the item is (e.g., "x-axis titled region" or "category equals North")
- **Position**: where it sits among its siblings (e.g., "1 of 4")
- **Children**: how many items are inside (e.g., "3 children")
- **Parent**: which group this item belongs to

The amount of detail depends on the active verbosity preset. See [Customizing Descriptions](/using/descriptions) to learn how to change it.

## Groupings

Sometimes an item belongs to more than one group. For example, in a stacked bar chart, a data point can belong both to a bar and to a color category. In a diagram, a rope might connect two different pulley systems.

When you reach an item that has multiple groupings, pressing **Up Arrow** shows the available groupings as items you can arrow through. You hear something like *"Grouping: System A (current)"* and *"Grouping: System B."* Press **Left Arrow** or **Right Arrow** to move between them, then press **Down Arrow** to explore the item from that grouping's perspective.

This lets shared items act as junctions between parts of the tree. You can always see where you came from and where else the item belongs.

## Next

- [Navigating Charts](/using/charts) — the specific levels in a chart tree.
- [Navigating Diagrams](/using/diagrams) — how diagram trees are organized.
