# olli-vis

Layer 4: Visualization domain module. Provides the `OlliVisSpec` authoring surface and registers vis-specific tokens, dialogs, keybindings, and presets with the core runtime.

## Features

- **Spec types** — `UnitOlliVisSpec`, `MultiOlliVisSpec`, `OlliVisSpec` with fields, axes, legends, structure
- **Spec elaboration** — Infers fields, types, and structure from data when not provided
- **Lowerer** — `lowerVisSpec(spec)` converts an `OlliVisSpec` into a `Hypergraph<VisPayload>`
- **Tokens** — `name`, `data`, `aggregate`, `quartile` (vis-aware description fragments)
- **Dialogs** — Table (`t`), Filter (`f`), Targeted Navigation (`r`)
- **Keybindings** — `x` jump to x-axis, `y` jump to y-axis, `l` jump to legend
- **Presets** — `high`, `medium`, `low` verbosity (CHI '24 customization presets)
- **Predicate provider** — Extracts `FieldPredicate` from `VisPayload` for data filtering

## Usage

```ts
import { visDomain } from 'olli-vis';
import { createNavigationRuntime, registerDomain } from 'olli-core';

const graph = visDomain.toHypergraph(spec);
const runtime = createNavigationRuntime(graph);
registerDomain(runtime, visDomain);
```

## Dependencies

- `olli-core`, `olli-render-solid`, `solid-js`
