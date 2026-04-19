# Extending Olli

Olli is built on a small kernel that knows nothing about charts or diagrams. The kernel navigates a [hypergraph](/guide/concepts#levels), dispatches keys, and reads token-based recipes to produce descriptions. Everything else is contributed by a **domain**. `olli-vis` and `olli-diagram` are both implemented this way; a new domain like maps, code, or music notation would be implemented the same way.

## The domain shape

A domain is a plain object satisfying `OlliDomain<Spec, Payload>`:

```ts
import type { OlliDomain } from 'olli-core';

export const myDomain: OlliDomain<MySpec, MyPayload> = {
  name: 'my-domain',
  toHypergraph: (spec) => lowerMySpec(spec),
  tokens: [...],
  presets: [...],
  keybindings: [...],
  dialogs: [...],
  predicateProviders: [...],
};
```

`name` and `toHypergraph` are required. Everything else is optional. A minimum-viable domain is just a lowerer, as `olli-diagram` shows: its domain contributes only `toHypergraph`, and the generic tokens and arrow-key navigation do the rest.

## Wiring a domain to a runtime

```ts
import { createNavigationRuntime, registerDomain } from 'olli-core';
import { mount, registerDefaultKeybindings } from 'olli-render-solid';

const runtime = createNavigationRuntime<MyPayload>(myDomain.toHypergraph(spec));
registerDomain(runtime, myDomain);
registerDefaultKeybindings(runtime);
mount(runtime, container);
```

`registerDomain` forwards each optional contribution to the corresponding registry on the runtime. If you'd rather register contributions piecemeal, the runtime exposes `registerToken`, `registerKeybinding`, `registerDialog`, and `registerPredicateProvider` directly.

For a one-shot, prefer the `olli` entry point from `olli-js` and pass an already-lowered hypergraph; see [Entry points](/guide/entry-points#olli-for-raw-hypergraphs).

## Lowering a spec

`toHypergraph` maps your domain's spec type to a `Hypergraph<Payload>`:

```ts
import type { Hypergraph, Hyperedge } from 'olli-core';

interface Hyperedge<P> {
  id: HyperedgeId;
  displayName: string;      // what the `name` token reads
  description?: string;     // long-form continuation for `name`
  role?: string;            // used to pick a description recipe and gate tokens
  children: HyperedgeId[];
  parents: HyperedgeId[];   // multi-parent is the point of the hypergraph
  payload?: P;              // domain-specific data, available to tokens and predicates
}

interface Hypergraph<P> {
  edges: ReadonlyMap<HyperedgeId, Hyperedge<P>>;
  roots: readonly HyperedgeId[];
}
```

The `role` is how the description system picks which recipe to use for a given node, and how token contributions declare which nodes they apply to. Pick roles that reflect the conceptual levels of your domain (for example, `overview`, `subsystem`, `element`) so that customization and preset logic can target each level.

The `payload` travels with each edge and is passed through to token computations and predicate providers, so put anything domain-specific there.

## Tokens

A token computes a short and long string for a node. The core ships six generic tokens (`name`, `index`, `level`, `parent`, `children`, `parentContexts`); a domain contributes more when it wants richer descriptions.

```ts
import type { DescriptionToken } from 'olli-core';

const fieldValueToken: DescriptionToken<MyPayload> = {
  name: 'fieldValue',
  applicableRoles: ['datum'],
  compute: ({ edge }) => {
    const value = edge?.payload?.value ?? '';
    return {
      short: String(value),
      long: `value equals ${value}`,
    };
  },
};
```

`applicableRoles` gates which roles the token is considered for; `'*'` means all roles. The `compute` function receives the nav node, its edge, the full hypergraph, the runtime, the current selection, and the composed ancestor predicate.

Once registered, a token can be referenced by name in a recipe. See [Recipes and presets](#recipes-and-presets) below.

## Recipes and presets

A **recipe** is an ordered list of `{ token, brevity }` entries, used to build the description for one role:

```ts
const datumRecipe = {
  role: 'datum',
  recipe: [
    { token: 'name', brevity: 'short' },
    { token: 'index', brevity: 'short' },
    { token: 'fieldValue', brevity: 'long' },
  ],
  duration: 'persistent',
};
```

A **preset** bundles recipes across roles so a user can switch verbosity in one step:

```ts
const myPresets = [
  { name: 'terse',   customizations: [datumRecipeShort, groupRecipeShort, ...] },
  { name: 'verbose', customizations: [datumRecipeLong, groupRecipeLong, ...] },
];
```

Contribute presets via `domain.presets`; apply one with `runtime.customization.applyPreset('terse')` or `handle.applyPreset('terse')`. See the [CHI '24 customization study](http://vis.csail.mit.edu/pubs/customization-accessible-vis/) for the design space behind this, and `olli-vis`'s `high`/`medium`/`low` presets for a worked example.

## Predicate providers

A predicate provider turns a hyperedge into a `FieldPredicate` describing the subset of the data it represents. The runtime uses these to compose ancestor predicates into a full `Selection` (what `handle.fullPredicate(navId)` returns), which is the bridge between tree focus and chart highlighting.

```ts
import type { PredicateProvider } from 'olli-core';

const myPredicateProvider: PredicateProvider<MyPayload> = (edge) => {
  if (!edge.payload?.field) return null;
  return { field: edge.payload.field, equal: edge.payload.value };
};
```

A domain can contribute multiple providers. Each is tried per edge; the first non-null result wins.

## Keybindings

A keybinding contribution declares a key and a handler. The handler returns `true` if it consumed the key, which stops subsequent bindings from running.

```ts
import type { KeybindingContribution } from 'olli-core';

const jumpToOverview: KeybindingContribution<MyPayload> = {
  key: '0',
  handler: (runtime) => {
    const rootId = runtime.hypergraph.roots[0];
    if (rootId) runtime.focus(rootId);
    return true;
  },
};
```

`olli-vis` uses this to register the `x`, `y`, `l` axis-jump keys, and the `t`, `f`, `r` dialog triggers.

## Dialogs

A dialog is a secondary surface: a table, a filter menu, a targeted-navigation prompt. A contribution declares an id, the roles it applies to, an optional trigger key, and a `render` function that returns whatever the host renderer expects (for `olli-render-solid`, a Solid JSX node).

```ts
import type { DialogContribution } from 'olli-core';

const myDialog: DialogContribution<MyPayload> = {
  id: 'my-dialog',
  triggerKey: 'd',
  render: (runtime, navNode) => <MyDialogView runtime={runtime} navNode={navNode} />,
};
```

`olli-vis`'s three dialogs (table, filter, targeted-nav) are registered this way. The core treats `render` as opaque; the renderer package decides how to mount it.

## Publishing a domain

A domain is a regular TypeScript module that exports an `OlliDomain` and, typically, a convenience entry-point function analogous to `olliVis`. See `packages/olli-solid/packages/olli-vis/src/domain.ts` and `packages/olli-solid/packages/olli-js/src/olliVis.ts` for the pattern.
