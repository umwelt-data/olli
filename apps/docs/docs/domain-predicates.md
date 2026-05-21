# Contributing Predicates

Predicate providers extract `FieldPredicate` values from hyperedges. The runtime composes ancestor predicates to produce the full data selection for each nav node. This powers features like the data table, aggregate descriptions, and two-way highlighting.

## PredicateProvider\<P\>

```ts
type PredicateProvider<P> = (edge: Hyperedge<P>) => FieldPredicate | null;
```

A function that examines a hyperedge and returns a predicate, or `null` if the edge doesn't contribute to selection.

## How providers are used

When the runtime computes `fullPredicate(navId)`:

1. It walks the path from root to the target nav node.
2. For each edge in the path, it calls every registered provider.
3. All non-null results are combined with `{ and: [...] }`.

The result is the intersection of all ancestor predicates — the complete filter that selects only the data rows this nav node represents.

For example, in a chart with x-axis "Category" and y-axis "Revenue":
- At the root, `fullPredicate` returns `{ and: [] }` (all data).
- At the x-axis, it still returns `{ and: [] }` (the axis itself doesn't filter).
- At a specific category "Electronics", it returns `{ and: [{ field: 'Category', equal: 'Electronics' }] }`.

## Writing a predicate provider

```ts
import type { PredicateProvider } from 'olli-core';
import type { MyPayload } from './spec.js';

export function myPredicateProvider(): PredicateProvider<MyPayload> {
  return (edge) => {
    const el = edge.payload?.element;
    if (el) {
      return { field: 'id', equal: el.id };
    }
    return null;
  };
}
```

Return `null` for edges that don't narrow the selection (e.g., group headers, the root). Return a `FieldPredicate` for edges that represent specific data.

## Registering providers

Add to your domain object:

```ts
export const myDomain: OlliDomain<MySpec, MyPayload> = {
  name: 'my-domain',
  toHypergraph: lowerMySpec,
  predicateProviders: [myPredicateProvider()],
};
```

Or register directly:

```ts
runtime.registerPredicateProvider(myPredicateProvider());
```

## PredicateProviderRegistry

```ts
interface PredicateProviderRegistry<P> {
  register(provider: PredicateProvider<P>): void;
  list(): readonly PredicateProvider<P>[];
}
```

## Built-in providers

### Vis predicate provider

Returns `payload.predicate` if present on the edge. This covers groupby children (which have `FieldEqualPredicate` or `FieldRangePredicate` from the lowerer) and predicate nodes.

```ts
function visPredicateProvider(): PredicateProvider<VisPayload> {
  return (edge) => edge.payload?.predicate ?? null;
}
```

### Diagram predicate provider

Returns `{ field: 'id', equal: elementId }` for element edges, and `{ field: 'id', oneOf: memberIds }` for relation edges.

```ts
function diagramPredicateProvider(): PredicateProvider<DiagramPayload> {
  return (edge) => {
    if (edge.payload?.sourceElement) {
      return { field: 'id', equal: edge.payload.sourceElement.id };
    }
    if (edge.payload?.sourceRelation) {
      // returns oneOf with all member IDs
    }
    return null;
  };
}
```

## Using predicates in tokens

Tokens can use `ctx.fullPredicate` with `selectionTest` to compute data-driven values:

```ts
import { selectionTest } from 'olli-core';

const dataCountToken: DescriptionToken<MyPayload> = {
  name: 'dataCount',
  applicableRoles: ['element'],
  compute: (ctx) => {
    const data = myDataSource; // your data
    const matching = selectionTest(data, ctx.fullPredicate);
    const s = `${matching.length} records`;
    return { short: s, long: s };
  },
};
```

## Next

- [Predicates & Selection](/docs/predicates) — the predicate type system.
- [Contributing Tokens](/docs/domain-tokens) — using predicates in descriptions.
- [Domain Architecture](/docs/domains) — the full domain interface.
