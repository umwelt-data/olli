# olli-diagram

Layer 4: Diagram domain module. Supports direct hyperedge authoring for non-visualization domains (system diagrams, pulley systems, etc.).

## Usage

```ts
import { diagramDomain, type DiagramSpec } from 'olli-diagram';
import { createNavigationRuntime, registerDomain } from 'olli-core';

const spec: DiagramSpec = {
  edges: [
    { id: 'root', displayName: 'System', children: ['a', 'b'], parents: [] },
    { id: 'a', displayName: 'Part A', children: [], parents: ['root'] },
    { id: 'b', displayName: 'Part B', children: [], parents: ['root'] },
  ],
};

const graph = diagramDomain.toHypergraph(spec);
const runtime = createNavigationRuntime(graph);
registerDomain(runtime, diagramDomain);
```

Relies on generic L2 tokens (name, index, level, parent, children) for descriptions. No domain-specific tokens, dialogs, or keybindings.

## Dependencies

- `olli-core`
