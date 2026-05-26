# olli-vis

Layer 4: Visualization domain module. Provides the `OlliVisSpec` authoring surface and registers vis-specific features with the core runtime.

**Docs:** [OlliVisSpec](https://umwelt-data.github.io/olli/docs/vis-spec), [Vis structure](https://umwelt-data.github.io/olli/docs/vis-structure), [Vis fields](https://umwelt-data.github.io/olli/docs/vis-fields), [Dialogs](https://umwelt-data.github.io/olli/docs/domain-dialogs), [Keybindings](https://umwelt-data.github.io/olli/docs/domain-keybindings), [Presets](https://umwelt-data.github.io/olli/docs/presets)

## Features

- **Spec types** — `UnitOlliVisSpec`, `MultiOlliVisSpec`, `OlliVisSpec`
- **Elaboration** — `elaborateSpec` infers fields, types, and structure from data
- **Lowerer** — `lowerVisSpec` converts an `OlliVisSpec` into a `Hypergraph<VisPayload>`
- **Tokens** — `name`, `visType`, `children`, `visData`, `visSize`, `aggregate`, `quartile`, `parent`, `instructions`
- **Dialogs** — Table (`t`), Filter (`f`), Targeted Navigation (`r`), Description Settings
- **Keybindings** — `x` (x-axis), `y` (y-axis), `l` (legend)
- **Presets** — `detailed`, `standard`, `minimal` verbosity levels
- **Predicate provider** — Extracts `FieldPredicate` from `VisPayload` for data filtering

## Dependencies

- `olli-core`, `olli-render-solid`, `solid-js`
