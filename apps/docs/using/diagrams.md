# Navigating Diagrams

Not every dataset is a chart. A pulley system, a circuit, a family tree, a state machine — these are diagrams, where the structure comes from relationships like containment and connection. This page covers how Olli organizes diagrams into a tree. For the general navigation concepts, see [Understanding the Tree](/using/tree-structure).

## How diagram trees differ from charts

Chart trees have a fixed structure (root, guide, data). Diagram trees are different: the levels come from the diagram's own structure. A pulley system might have an overview level, a subsystem level, a parts level, and an individual element level. The number and meaning of levels depends on the diagram.

The navigation controls are the same — **Down Arrow** to go deeper, **Up Arrow** to go broader, **Left/Right Arrow** to step across siblings.

## Shared elements and groupings

Diagrams often have elements that belong to more than one group. A rope in a pulley system might connect two different subsystems. A wire in a circuit might link two separate modules.

When you reach a shared element, you can switch between its groupings to explore it from different perspectives. Press **Up Arrow** to see the available groupings. You hear something like *"Grouping: System A (current)"* and *"Grouping: System B."* Arrow sideways to pick one, then press **Down Arrow** to continue exploring from that grouping's viewpoint.

This is one of the key features of diagram navigation. These shared elements act as junctions that let you move between different parts of the diagram. See [Understanding the Tree — Groupings](/using/tree-structure#groupings) for more on how this works.

## Example: pulley system

The [gallery](/gallery/) includes a pulley system example. It describes three pulley systems with shared ropes and boxes.

Starting at the root, press **Down Arrow** to enter the first system. Arrow through its parts. When you reach a shared rope, press **Up Arrow** to see groupings for the other systems it connects. Arrow sideways to another system and press **Down Arrow** to explore from there.

The pulley case comes from [Cheng (2004)](https://adrenaline.ucsd.edu/kirsh/fileupload/Diagrams/whay_diagrams_are_worth.pdf) and was used in a user study ([Mei et al. ASSETS '25](https://data-and-design.org/publications/benthic/)) that tested how blind users build a mental model of a structural diagram through this kind of navigation.

## Next

- [Dialogs](/using/dialogs) — tables, filters, and other tools.
- [Customizing Descriptions](/using/descriptions) — changing what you hear at each item.
