# Navigation Runtime

The `NavigationRuntime` is the central stateful object that manages focus, selection, expansion state, and all registered contributions (tokens, keybindings, dialogs, predicate providers). It's built on Solid.js reactivity — all state is reactive and drives the renderer automatically.

## NavigationRuntime\<P\>

```ts
interface NavigationRuntime<P> {
  // Reactive state
  hypergraph: Accessor<Hypergraph<P>>;
  navTree: Accessor<NavTree>;
  focusedNavId: Accessor<NavNodeId>;
  selection: Accessor<Selection>;
  expanded: Accessor<ReadonlySet<NavNodeId>>;

  // Lookups
  getNavNode(navId: NavNodeId): NavNode | undefined;
  getHyperedge(id: HyperedgeId): Hyperedge<P> | undefined;
  fullPredicate(navId: NavNodeId): Selection;
  virtualOptionsFor(sourceNavId: NavNodeId): readonly NavNodeId[];
  commitTargetOfVirtual(virtualNavId: NavNodeId): NavNodeId | undefined;
  regroupedSourceOfVirtual(virtualNavId: NavNodeId): NavNodeId | undefined;

  // Actions
  focus(navId: NavNodeId): void;
  moveFocus(direction: MoveDirection): void;
  expand(navId: NavNodeId): void;
  collapse(navId: NavNodeId): void;
  setExpanded(set: ReadonlySet<NavNodeId>): void;
  setSelection(s: Selection): void;
  setHypergraph(g: Hypergraph<P>): void;

  // Registries
  registerKeybinding(binding: KeybindingContribution<P>): void;
  registerDialog(dialog: DialogContribution<P>): void;
  registerPredicateProvider(provider: PredicateProvider<P>): void;
  registerToken(token: DescriptionToken<P>): void;
  keybindings: KeybindingRegistry<P>;
  dialogs: DialogRegistry<P>;
  predicateProviders: PredicateProviderRegistry<P>;
  tokens: TokenRegistry<P>;
  customization: CustomizationStore;

  // Descriptions
  getDescriptionFor(navId: NavNodeId): Accessor<string>;
}
```

## createNavigationRuntime

```ts
function createNavigationRuntime<P>(initialGraph: Hypergraph<P>): NavigationRuntime<P>
```

Creates a new runtime with the given hypergraph. The initial focus is set to the first root node.

The runtime automatically:
- Builds a `NavTree` from the hypergraph (re-derived reactively when the hypergraph changes).
- Registers the six built-in description tokens: `name`, `index`, `level`, `parent`, `children`, `parentContext`.
- Sets up a recipe filter that hides the `parent` token on roles where no multi-parent edges exist.

## Reactive state

All state accessors are Solid.js `Accessor<T>` functions. Call them to read the current value; they track dependencies automatically when called inside reactive contexts (`createMemo`, `createEffect`, etc.).

| Accessor | Type | Description |
| --- | --- | --- |
| `hypergraph()` | `Hypergraph<P>` | The current hypergraph. |
| `navTree()` | `NavTree` | The nav tree derived from the hypergraph. |
| `focusedNavId()` | `NavNodeId` | The currently focused nav node. |
| `selection()` | `Selection` | The current data selection (filter). |
| `expanded()` | `ReadonlySet<NavNodeId>` | Which nav nodes are expanded in the ARIA tree. |

## Lookups

### getNavNode

```ts
getNavNode(navId: NavNodeId): NavNode | undefined
```

Returns the nav node for a given ID. Handles both real nodes (from the nav tree) and virtual parent-context nodes (synthesized on demand).

### getHyperedge

```ts
getHyperedge(id: HyperedgeId): Hyperedge<P> | undefined
```

Returns the hyperedge for a given ID from the current hypergraph.

### fullPredicate

```ts
fullPredicate(navId: NavNodeId): Selection
```

Composes the predicates from all ancestor edges along the path to produce the full selection for a nav node. This is what determines which data rows a node represents.

### virtualOptionsFor / commitTargetOfVirtual / regroupedSourceOfVirtual

These methods handle multi-parent navigation:

- `virtualOptionsFor(sourceNavId)` — Returns the virtual nav IDs for switching between groupings.
- `commitTargetOfVirtual(virtualNavId)` — Given a virtual nav ID, returns the real parent nav ID it would navigate to.
- `regroupedSourceOfVirtual(virtualNavId)` — Given a virtual nav ID, returns the nav ID of the source element as a child of the target parent.

## Actions

### focus / moveFocus

```ts
focus(navId: NavNodeId): void
moveFocus(direction: MoveDirection): void
```

`focus` sets the focused node directly. `moveFocus` moves focus in a direction:

```ts
type MoveDirection = 'up' | 'down' | 'left' | 'right' | 'first' | 'last';
```

Movement semantics:
- **down**: First child (or last-visited child if returning).
- **up**: Parent. If multi-parent, enters the virtual parent-context layer.
- **left/right**: Previous/next sibling.
- **first/last**: First/last sibling.

When on a virtual parent-context node, left/right switch between groupings; up commits to the selected parent; down returns to the source.

### expand / collapse / setExpanded

```ts
expand(navId: NavNodeId): void
collapse(navId: NavNodeId): void
setExpanded(set: ReadonlySet<NavNodeId>): void
```

Manage the ARIA tree expansion state. The renderer uses `expanded` to determine which subtrees are visible.

### setSelection / setHypergraph

```ts
setSelection(s: Selection): void
setHypergraph(g: Hypergraph<P>): void
```

`setSelection` updates the current selection/filter. `setHypergraph` replaces the entire hypergraph, which reactively rebuilds the nav tree.

## Registries

The runtime holds four registries for domain contributions. See:

- [Contributing Tokens](/docs/domain-tokens)
- [Contributing Dialogs](/docs/domain-dialogs)
- [Contributing Keybindings](/docs/domain-keybindings)
- [Contributing Predicates](/docs/domain-predicates)

Plus a `CustomizationStore` for managing description recipes and presets. See [Recipes & Customization](/docs/recipes).

## getDescriptionFor

```ts
getDescriptionFor(navId: NavNodeId): Accessor<string>
```

Returns a reactive accessor that produces the assembled description string for a nav node. The description is computed from the active recipe and registered tokens. See [Tokens](/docs/tokens) for details.

## Next

- [Navigation Tree](/docs/navtree) — the tree structure the runtime navigates.
- [Predicates & Selection](/docs/predicates) — the selection/filter system.
- [Domain Architecture](/docs/domains) — how domains wire into the runtime.
