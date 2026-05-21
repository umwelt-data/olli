# DiagramSpec

`DiagramSpec` describes a diagram as a set of elements and the relations between them. It's the input to `olliDiagram`.

```ts
interface DiagramSpec {
  elements: DiagramElement[];
  relations: DiagramRelation[];
  title?: string;
  description?: string;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `elements` | `DiagramElement[]` | yes | The individual items in the diagram. |
| `relations` | `DiagramRelation[]` | yes | How elements relate to each other. |
| `title` | `string` | no | Display name for the diagram root. |
| `description` | `string` | no | Explanatory text appended after the title in screen reader output. |

## DiagramElement

```ts
interface DiagramElement {
  id: string;
  label: string;
  description?: string;
  kind?: string;
  connector?: boolean;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | yes | Unique identifier. Referenced by relations. |
| `label` | `string` | yes | Short display name — becomes `displayName` on the hyperedge. |
| `description` | `string` | no | Explanatory text appended after the label in screen reader output. |
| `kind` | `string` | no | Element category (e.g., `"component"`, `"adapter"`). Surfaced by the `elementKind` token. |
| `connector` | `boolean` | no | If `true`, the element is treated as a connector (e.g., an arrow or wire) rather than a primary element. Connectors without structural parents are only reachable through referential relations. |

## DiagramPayload

When the lowerer converts elements and relations into hyperedges, each edge carries a `DiagramPayload`:

```ts
interface DiagramPayload {
  sourceRelation?: DiagramRelation;
  sourceElement?: DiagramElement;
}
```

Element edges have `sourceElement` set. Relation edges have `sourceRelation` set. The payload is used by tokens and predicate providers to generate descriptions and selections.

## Example

```ts
import { olliDiagram } from 'olli';

const spec: DiagramSpec = {
  title: 'Pulley system',
  elements: [
    { id: 'rope', label: 'Rope', kind: 'component' },
    { id: 'wheel', label: 'Wheel', kind: 'component' },
    { id: 'axle', label: 'Axle', kind: 'component' },
    { id: 'weight', label: 'Weight', kind: 'component' },
  ],
  relations: [
    { kind: 'containment', id: 'pulley', container: 'wheel', contents: ['axle'], label: 'Pulley' },
    { kind: 'connection', id: 'c1', endpoints: ['rope', 'wheel'], semantic: 'wraps-around' },
    { kind: 'connection', id: 'c2', endpoints: ['rope', 'weight'], semantic: 'attaches-to' },
  ],
};

const handle = olliDiagram(spec, document.getElementById('tree')!);
```

## Next

- [Relations](/docs/diagram-relations) — the five relation types.
- [Diagram Lowering](/docs/diagram-lowering) — how specs become hypergraphs.
