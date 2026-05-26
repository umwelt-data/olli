# Creating a Domain

This guide walks through building a minimum-viable domain from scratch. By the end you'll have a custom spec type, a payload, a lowerer, and a domain object that can be registered with the runtime.

## Step 1: Define your spec type

A spec describes the input data in your domain's terms. It should be a plain serializable object.

```ts
// my-domain/spec.ts
export interface MyElement {
  id: string;
  label: string;
  category?: string;
}

export interface MySpec {
  title?: string;
  elements: MyElement[];
  groups?: { name: string; members: string[] }[];
}
```

## Step 2: Define your payload type

The payload is attached to every hyperedge your lowerer creates. Tokens and predicate providers use it to generate descriptions and selections.

```ts
// my-domain/spec.ts
export interface MyPayload {
  element?: MyElement;
  groupName?: string;
}
```

Include whatever your tokens need to produce good descriptions. Keep it minimal — you can always add fields later.

## Step 3: Write a lowerer

The lowerer converts your spec into a `Hypergraph<MyPayload>`. Use `buildHypergraph` from `olli-core` to validate and finalize the graph.

```ts
// my-domain/lower.ts
import type { Hyperedge, Hypergraph } from 'olli-core';
import { buildHypergraph } from 'olli-core';
import type { MyPayload, MySpec } from './spec.js';

export function lowerMySpec(spec: MySpec): Hypergraph<MyPayload> {
  const edges: Hyperedge<MyPayload>[] = [];

  const rootChildren: string[] = [];

  // Create group edges
  for (const group of spec.groups ?? []) {
    edges.push({
      id: `group-${group.name}`,
      displayName: group.name,
      role: 'group',
      children: group.members.map((id) => `el-${id}`),
      parents: ['root'],
      payload: { groupName: group.name },
    });
    rootChildren.push(`group-${group.name}`);
  }

  // Create element edges
  const grouped = new Set((spec.groups ?? []).flatMap((g) => g.members));
  for (const el of spec.elements) {
    const parents = grouped.has(el.id)
      ? (spec.groups ?? [])
          .filter((g) => g.members.includes(el.id))
          .map((g) => `group-${g.name}`)
      : ['root'];

    if (!grouped.has(el.id)) rootChildren.push(`el-${el.id}`);

    edges.push({
      id: `el-${el.id}`,
      displayName: el.label,
      role: 'element',
      children: [],
      parents,
      payload: { element: el },
    });
  }

  // Create root
  edges.unshift({
    id: 'root',
    displayName: spec.title ?? 'My Domain',
    role: 'root',
    children: rootChildren,
    parents: [],
  });

  return buildHypergraph(edges);
}
```

Key rules for the lowerer:
- Every edge needs symmetric parent/child links (if A lists B as child, B must list A as parent).
- No cycles.
- No duplicate IDs.
- Set meaningful `role` values — the description system uses them to select tokens and recipes.

## Step 4: Assemble the domain object

```ts
// my-domain/domain.ts
import type { OlliDomain } from 'olli-core';
import type { MyPayload, MySpec } from './spec.js';
import { lowerMySpec } from './lower.js';

export const myDomain: OlliDomain<MySpec, MyPayload> = {
  name: 'my-domain',
  toHypergraph: lowerMySpec,
};
```

This is the minimum viable domain. It works with `olli`'s generic navigation and the six built-in tokens.

## Step 5: Use it

```ts
import { createNavigationRuntime, registerDomain } from 'olli-core';
import { mount, registerDefaultKeybindings } from 'olli-render-solid';
import { myDomain } from './my-domain/domain.js';

const spec: MySpec = {
  title: 'My Data',
  elements: [
    { id: 'a', label: 'Alpha', category: 'vowel' },
    { id: 'b', label: 'Beta', category: 'consonant' },
  ],
  groups: [{ name: 'All Items', members: ['a', 'b'] }],
};

const graph = myDomain.toHypergraph(spec);
const runtime = createNavigationRuntime(graph);
registerDomain(runtime, myDomain);
registerDefaultKeybindings(runtime);
mount(runtime, document.getElementById('tree')!);
```

## Step 6: Add contributions

Once the basic domain works, you can add:

- **[Tokens](/docs/domain-tokens)** — custom description fragments.
- **[Dialogs](/docs/domain-dialogs)** — interactive overlays.
- **[Keybindings](/docs/domain-keybindings)** — keyboard shortcuts.
- **[Predicates](/docs/domain-predicates)** — data selection logic.
- **Presets** — named recipe configurations (see [Presets](/docs/presets)).

Add them to the domain object:

```ts
export const myDomain: OlliDomain<MySpec, MyPayload> = {
  name: 'my-domain',
  toHypergraph: lowerMySpec,
  tokens: [myCategoryToken],
  predicateProviders: [myPredicateProvider()],
  presets: [{ name: 'default', customizations: myCustomizations }],
  defaultPreset: 'default',
};
```

## Next

- [Domain Architecture](/docs/domains) — the `OlliDomain` interface.
- [Contributing Tokens](/docs/domain-tokens) — first contribution to add.
