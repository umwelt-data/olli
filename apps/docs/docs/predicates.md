# Predicates & Selection

Predicates are filter expressions that describe data subsets. They're used throughout Olli: in structure nodes, hyperedge payloads, the selection state, and the full-predicate computation.

The predicate types come from `@umwelt-data/umwelt-utils` and are structurally compatible with Vega-Lite's `LogicalComposition<FieldPredicate>`.

## Selection

```ts
type Selection = LogicalComposition<FieldPredicate>;
```

A `Selection` is the top-level predicate type. It can be a single `FieldPredicate`, a logical composition of predicates, or a nested combination.

## FieldPredicate

```ts
type FieldPredicate =
  | FieldEqualPredicate
  | FieldLTPredicate
  | FieldGTPredicate
  | FieldLTEPredicate
  | FieldGTEPredicate
  | FieldRangePredicate
  | FieldOneOfPredicate
  | FieldValidPredicate;
```

All variants extend `FieldPredicateBase`:

```ts
interface FieldPredicateBase {
  field: string;
  timeUnit?: string;
}
```

### Comparison predicates

| Type | Property | Example | Matches |
| --- | --- | --- | --- |
| `FieldEqualPredicate` | `equal: FieldValue` | `{ field: 'name', equal: 'Alice' }` | Exact match |
| `FieldLTPredicate` | `lt: FieldValue` | `{ field: 'age', lt: 30 }` | Less than |
| `FieldGTPredicate` | `gt: FieldValue` | `{ field: 'age', gt: 30 }` | Greater than |
| `FieldLTEPredicate` | `lte: FieldValue` | `{ field: 'age', lte: 30 }` | Less than or equal |
| `FieldGTEPredicate` | `gte: FieldValue` | `{ field: 'age', gte: 30 }` | Greater than or equal |

### Range predicate

```ts
interface FieldRangePredicate extends FieldPredicateBase {
  range: [number, number] | [Date, Date];
  inclusiveLeft?: boolean;   // default: true
  inclusiveRight?: boolean;  // default: true
}
```

Matches values within a range. Used by the vis lowerer for binned quantitative and temporal fields.

### Set predicate

```ts
interface FieldOneOfPredicate extends FieldPredicateBase {
  oneOf: FieldValue[];
}
```

Matches any value in the set. Used by the diagram predicate provider for relation members.

### Validity predicate

```ts
interface FieldValidPredicate extends FieldPredicateBase {
  valid: boolean;
}
```

Matches non-null values (when `valid: true`) or null values (when `valid: false`).

## Logical composition

Predicates can be combined with `and`, `or`, and `not`:

```ts
interface LogicalAnd<T> { and: LogicalComposition<T>[]; }
interface LogicalOr<T> { or: LogicalComposition<T>[]; }
interface LogicalNot<T> { not: LogicalComposition<T>; }

type LogicalComposition<T> = T | LogicalAnd<T> | LogicalOr<T> | LogicalNot<T>;
```

Type guards:

```ts
function isLogicalAnd<T>(p: LogicalComposition<T>): p is LogicalAnd<T>
function isLogicalOr<T>(p: LogicalComposition<T>): p is LogicalOr<T>
function isLogicalNot<T>(p: LogicalComposition<T>): p is LogicalNot<T>
function isFieldPredicate(p: unknown): p is FieldPredicate
```

The empty selection is `{ and: [] }`, exported as `EMPTY_AND`. It matches all rows.

## selectionTest

```ts
function selectionTest(data: Datum[], selection: Selection): Datum[]
```

Filters a dataset by a selection, returning matching rows. Re-exported from `olli-core`.

## fullPredicate

The runtime's `fullPredicate(navId)` method composes predicates along the ancestor path:

```ts
function composeAncestorPredicates<P>(
  path: readonly string[],
  edges: ReadonlyMap<string, Hyperedge<P>>,
  providers: readonly PredicateProvider<P>[],
): Selection
```

For each edge in the path, it asks each registered `PredicateProvider` for a predicate. All non-null results are combined into a `LogicalAnd`. This produces the complete filter for a nav node — the intersection of all ancestor predicates.

## PredicateProvider

```ts
type PredicateProvider<P> = (edge: Hyperedge<P>) => FieldPredicate | null;
```

A function that extracts a `FieldPredicate` from a hyperedge. Each domain registers its own provider:

- **Vis domain**: Returns `payload.predicate` if present.
- **Diagram domain**: Returns `{ field: 'id', equal: elementId }` for elements, or `{ field: 'id', oneOf: memberIds }` for relations.

See [Contributing Predicates](/docs/domain-predicates) for how to write a custom provider.

## Next

- [Tokens](/docs/tokens) — how predicates are used in descriptions.
- [Navigation Runtime](/docs/runtime) — where selection state lives.
- [Contributing Predicates](/docs/domain-predicates) — writing custom providers.
