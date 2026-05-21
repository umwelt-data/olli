# Diagram Lowering

Lowering converts a `DiagramSpec` into a `Hypergraph<DiagramPayload>`. Unlike vis lowering, which walks a tree of structure nodes, diagram lowering translates elements and relations directly into hyperedges.

## lowerDiagramSpec

```ts
function lowerDiagramSpec(spec: DiagramSpec): Hypergraph<DiagramPayload>
```

### Algorithm

1. **Classify relations.** Each relation is either structural (`containment`, `grouping`) or referential (`connection`, `alignment`, `distribution`).

2. **Create relation edges.** For each relation, create a hyperedge whose children are the member element IDs. Structural relations have the root as their parent. Referential relations have no parent and are marked `contextOnly: true`.

3. **Create element edges.** For each element:
   - Its parents are all structural relations it belongs to, plus all referential relations it belongs to.
   - If the element has no structural parents and is not a connector, it's an orphan — it gets the root as an additional parent.
   - Connectors without structural parents only appear through their referential relations.

4. **Create the root edge.** Its children are all structural relation edges plus any orphan elements.

5. **Build.** `buildHypergraph` validates symmetry, detects cycles, and finalizes the graph.

### Multi-parent edges

Elements that belong to multiple relations will have multiple parents, making them multi-parent nodes in the hypergraph. This is the mechanism behind the groupings feature: when navigating to a multi-parent element, the user can switch between different parent contexts.

For example, if element "Wheel" belongs to both a "Pulley" containment relation and a "Rope wraps around Wheel" connection, the Wheel edge has two parents. The user can navigate up from Wheel and choose between the "Pulley" and "Rope wraps around Wheel" groupings.

### Context-only edges

Referential relations are marked `contextOnly: true`. This means:
- They appear as roots in `navTree.contextRoots` rather than `navTree.roots`.
- They're reachable through the multi-parent groupings UI but don't appear in the primary tree hierarchy.

## Display name generation

When a relation has no explicit `label`, the lowerer auto-generates a display name:

| Relation kind | Generated name |
| --- | --- |
| `connection` (with `semantic`) | `"A verb-phrase B"` |
| `connection` (directed) | `"A connects to B"` |
| `connection` (undirected) | `"Connection: A and B"` |
| `containment` | `"Container contains N items"` |
| `grouping` | `"Group of N: A, B, C"` |
| `alignment` | `"Aligned axis: A, B, C"` |
| `distribution` | `"Distributed direction: A, B, C"` |

## Example

Given the pulley spec from [DiagramSpec](/docs/diagram-spec), lowering produces:

```
root ("Pulley system")
├── containment ("Pulley")
│   ├── element ("Wheel")      ← also child of connection "wraps-around"
│   └── element ("Axle")
├── element ("Rope")           ← also child of connections
└── element ("Weight")         ← also child of connection "attaches-to"

context roots:
├── connection ("Rope wraps around Wheel")  [contextOnly]
└── connection ("Rope attaches to Weight")  [contextOnly]
```

## Next

- [DiagramSpec](/docs/diagram-spec) — the input spec type.
- [Relations](/docs/diagram-relations) — the five relation types.
- [Hypergraph](/docs/hypergraph) — the data model produced by lowering.
