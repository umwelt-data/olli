# olli-diagram

Layer 4: Diagram domain module. Supports direct hyperedge authoring for non-visualization domains (system diagrams, pulley systems, etc.).

**Docs:** [DiagramSpec](https://umwelt-data.github.io/olli/docs/diagram-spec), [Diagram relations](https://umwelt-data.github.io/olli/docs/diagram-relations)

## Features

- **Spec types** — `DiagramSpec` with `DiagramElement` and relation types (`ConnectionRelation`, `ContainmentRelation`, `AlignmentRelation`, `DistributionRelation`, `GroupingRelation`)
- **Lowerer** — `lowerDiagramSpec` converts a `DiagramSpec` into a `Hypergraph<DiagramPayload>`
- **Tokens** — `elementKindToken` plus generic core tokens (name, index, level, parent, children)
- **Predicate provider** — `diagramPredicateProvider`
- **Description Settings** dialog registered

## Dependencies

- `olli-core`, `olli-render-solid`, `solid-js`
