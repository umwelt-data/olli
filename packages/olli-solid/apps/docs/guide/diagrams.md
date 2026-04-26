# Diagrams

Not every dataset is a chart. A pulley system, a circuit, a family tree, a state machine: these are diagrams, where the interesting structure comes from relations like containment and connection. Olli handles them through a second entry point, `olliDiagram`. For the shared tree-navigation vocabulary, see [Concepts](/guide/concepts).

## The hypergraph model

A diagram's underlying structure is a **hypergraph**: a set of edges where each edge can have multiple parents and multiple children. A single pulley can belong to its containing system and also sit on a shared rope; a single box can hang from two different pulleys. A regular tree cannot represent that directly; a hypergraph can.

Olli flattens the hypergraph into a navigable tree by exposing every parent path. Levels in the tree correspond to levels of the hypergraph: an overview at the top, then subsystems, parts within each subsystem, down to individual elements.

## Shared nodes

A node with more than one parent appears in more than one subtree. In a pulley spec where one rope connects two systems, System A's subtree and System B's subtree both contain the rope. When a user reaches the rope from System A, Olli surfaces System B as a virtual sibling labeled "also part of System B." Arrowing sideways to that sibling and pressing down enters System B's subtree from the rope.

This is what [parent-context switching](/guide/concepts#parent-context-switching) looks like in practice. It lets shared components act as junctions between parts of the diagram without a user getting lost.

## Example: pulley system

```ts
import { olliDiagram } from 'olli-js';
import { pulleySpec } from 'olli-diagram/examples';

olliDiagram(pulleySpec, document.getElementById('tree'));
```

The `pulleySpec` describes three pulley systems with shared ropes and boxes. A user presses the down arrow at the root to enter the first system, then arrows through its parts. Reaching a shared rope, the user arrows sideways through virtual siblings to switch context into another system's subtree.

The pulley case comes from [Cheng (1999)](https://doi.org/10.1207/s15516709cog2303_2) and was used in the Benthic user study ([Mei et al. ASSETS '25](https://dl.acm.org/doi/10.1145/3663548.3675623)), which tested how blind users build a mental model of a structural diagram through hypergraph navigation.

See the [Gallery](/gallery/) for the live pulley example.
