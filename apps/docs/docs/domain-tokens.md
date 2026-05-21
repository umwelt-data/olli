# Contributing Tokens

A domain can register custom tokens that add domain-specific information to descriptions. For example, the vis domain adds `visType` (chart type), `visData` (data range), and `aggregate` (statistical summary).

## DescriptionToken\<P\>

```ts
interface DescriptionToken<P = unknown> {
  name: TokenName;
  applicableRoles: readonly string[] | '*';
  compute: (ctx: TokenContext<P>) => TokenValue;
}
```

- `name` — Unique identifier. If it matches an existing token name, your token replaces it.
- `applicableRoles` — Which roles this token should be evaluated for. Use `'*'` for all roles, or an array of specific role strings.
- `compute` — Receives a `TokenContext<P>` and returns a `TokenValue` with `short` and `long` text.

## Writing a token

Here's a token that announces the `kind` property of elements in a custom domain:

```ts
import type { DescriptionToken } from 'olli-core';
import type { MyPayload } from './spec.js';

export const categoryToken: DescriptionToken<MyPayload> = {
  name: 'category',
  applicableRoles: ['element'],
  compute: (ctx) => {
    const category = ctx.edge?.payload?.element?.category;
    if (!category) return { short: '', long: '' };
    return {
      short: category,
      long: `category: ${category}`,
      joinHint: 'clause',
    };
  },
};
```

Key points:
- Return empty strings when the token doesn't apply. Empty values are silently skipped during assembly.
- Use `joinHint: 'clause'` to append with a comma instead of starting a new sentence.
- Access the payload via `ctx.edge?.payload`. The type parameter `P` provides type safety.
- Use `ctx.runtime` to look up other nodes, siblings, or ancestor information.
- Use `ctx.fullPredicate` with `selectionTest` to compute data-driven summaries.

## Registering tokens

Add tokens to your domain object:

```ts
export const myDomain: OlliDomain<MySpec, MyPayload> = {
  name: 'my-domain',
  toHypergraph: lowerMySpec,
  tokens: [categoryToken],
};
```

Or register directly on the runtime:

```ts
runtime.registerToken(categoryToken);
```

## Including tokens in recipes

Registering a token makes it available but doesn't automatically include it in descriptions. To use it, include it in a preset:

```ts
export const myDomain: OlliDomain<MySpec, MyPayload> = {
  name: 'my-domain',
  toHypergraph: lowerMySpec,
  tokens: [categoryToken],
  presets: [{
    name: 'default',
    customizations: [
      {
        role: 'element',
        recipe: [
          { token: 'name', brevity: 'long' },
          { token: 'category', brevity: 'short' },
          { token: 'index', brevity: 'short' },
        ],
      },
    ],
  }],
  defaultPreset: 'default',
};
```

Without a preset, only the built-in default recipe is used (`name`, `index`, `parent`, `children`).

## Overriding built-in tokens

Register a token with the same `name` as a built-in to replace it. The vis domain does this for `name`, `children`, and `parent`:

```ts
// This replaces the built-in 'name' token
export function nameToken(): DescriptionToken<VisPayload> {
  return {
    name: 'name',
    applicableRoles: '*',
    compute: (ctx) => {
      // domain-specific name logic
    },
  };
}
```

## Real-world example: elementKind token

The diagram domain's only custom token:

```ts
const elementKindToken: DescriptionToken<DiagramPayload> = {
  name: 'elementKind',
  applicableRoles: ['element'],
  compute: (ctx) => {
    const kind = ctx.edge?.payload?.sourceElement?.kind;
    if (!kind) return { short: '', long: '' };
    return { short: kind, long: kind };
  },
};
```

## Next

- [Tokens](/docs/tokens) — the token system in detail.
- [Contributing Dialogs](/docs/domain-dialogs) — adding interactive overlays.
