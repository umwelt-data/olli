# Domain Architecture

A domain is a self-contained plugin that teaches Olli how to handle a specific kind of data — charts, diagrams, or anything else. Domains provide a lowerer (spec → hypergraph) and optional contributions: tokens, presets, keybindings, dialogs, and predicate providers.

Olli ships two built-in domains:
- **olli-vis** — the visualization domain (charts with tabular data).
- **olli-diagram** — the diagram domain (elements with relations).

You can create custom domains for other data types.

## OlliDomain\<Spec, Payload\>

```ts
interface OlliDomain<Spec, Payload> {
  name: string;
  toHypergraph(spec: Spec): Hypergraph<Payload>;
  tokens?: ReadonlyArray<DescriptionToken<Payload>>;
  presets?: ReadonlyArray<{ name: string; customizations: Customization[] }>;
  defaultPreset?: string;
  keybindings?: ReadonlyArray<KeybindingContribution<Payload>>;
  dialogs?: ReadonlyArray<DialogContribution<Payload>>;
  predicateProviders?: ReadonlyArray<PredicateProvider<Payload>>;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | yes | Identifier for the domain (e.g., `'olli-vis'`). |
| `toHypergraph` | `(spec: Spec) => Hypergraph<Payload>` | yes | Converts the domain-specific spec into a hypergraph. |
| `tokens` | `DescriptionToken<Payload>[]` | no | Description tokens to register. |
| `presets` | `{ name, customizations }[]` | no | Named recipe presets. |
| `defaultPreset` | `string` | no | Preset to apply automatically on registration. |
| `keybindings` | `KeybindingContribution<Payload>[]` | no | Keyboard shortcuts. |
| `dialogs` | `DialogContribution<Payload>[]` | no | Dialog contributions. |
| `predicateProviders` | `PredicateProvider<Payload>[]` | no | Predicate providers for full-predicate composition. |

The two type parameters:
- **Spec** — the input type (e.g., `OlliVisSpec`, `DiagramSpec`).
- **Payload** — the hyperedge payload type (e.g., `VisPayload`, `DiagramPayload`).

## registerDomain

```ts
function registerDomain<Spec, Payload>(
  runtime: NavigationRuntime<Payload>,
  domain: OlliDomain<Spec, Payload>,
): void
```

Registers all of a domain's contributions onto a runtime:

1. Registers each token via `runtime.registerToken`.
2. Registers each keybinding via `runtime.registerKeybinding`.
3. Registers each dialog via `runtime.registerDialog`.
4. Registers each predicate provider via `runtime.registerPredicateProvider`.
5. Registers each preset via `runtime.customization.registerPreset`.
6. If `defaultPreset` is set, applies it via `runtime.customization.applyPreset`.

## Built-in domains

### Visualization domain

```ts
// olli-vis
const visDomain: OlliDomain<OlliVisSpec, VisPayload> = {
  name: 'olli-vis',
  toHypergraph: lowerVisSpec,
  tokens: allVisTokens(),           // 9 tokens
  predicateProviders: [visPredicateProvider()],
  keybindings: visKeybindings(),     // x, y, l jump shortcuts
  presets: visPresets(),             // detailed, standard, minimal
  defaultPreset: 'standard',
  dialogs: [tableDialog(), filterDialog(), targetedNavDialog(), descriptionSettingsDialog()],
};
```

### Diagram domain

```ts
// olli-diagram
const diagramDomain: OlliDomain<DiagramSpec, DiagramPayload> = {
  name: 'diagram',
  toHypergraph: lowerDiagramSpec,
  tokens: [elementKindToken],
  predicateProviders: [diagramPredicateProvider()],
  dialogs: [descriptionSettingsDialog()],
};
```

The diagram domain is simpler — no presets, no keybindings, one token, one dialog.

## How entry points use domains

The `olliVis` and `olliDiagram` entry points handle domain wiring automatically:

1. Call `domain.toHypergraph(spec)` to produce the initial hypergraph.
2. Call `createNavigationRuntime(graph)` to create the runtime.
3. Call `registerDomain(runtime, domain)` to wire up all contributions.
4. Mount the renderer.

When using the low-level `olli` entry point, no domain is registered — you get only generic navigation and built-in tokens.

## Next

- [Creating a Domain](/docs/creating-domain) — step-by-step guide.
- [Contributing Tokens](/docs/domain-tokens) — adding description tokens.
- [Contributing Dialogs](/docs/domain-dialogs) — adding dialogs.
- [Contributing Keybindings](/docs/domain-keybindings) — adding keyboard shortcuts.
- [Contributing Predicates](/docs/domain-predicates) — adding predicate providers.
