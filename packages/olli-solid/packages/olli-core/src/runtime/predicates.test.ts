import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { buildHypergraph } from '../hypergraph/build.js';
import type { Hyperedge } from '../hypergraph/types.js';
import type { FieldPredicate } from '../predicate/types.js';
import { createNavigationRuntime } from './runtime.js';

interface Payload {
  predicate?: FieldPredicate;
}

function edge(
  id: string,
  children: string[] = [],
  parents: string[] = [],
  predicate?: FieldPredicate,
): Hyperedge<Payload> {
  const hyperedge: Hyperedge<Payload> = { id, displayName: id, children, parents };
  if (predicate) hyperedge.payload = { predicate };
  return hyperedge;
}

describe('fullPredicate', () => {
  it('ANDs ancestor-contributed predicates along the path', () => {
    createRoot((dispose) => {
      const g = buildHypergraph<Payload>([
        edge('r', ['region-east']),
        edge('region-east', ['year-2021'], ['r'], { field: 'region', equal: 'east' }),
        edge('year-2021', [], ['region-east'], { field: 'year', equal: 2021 }),
      ]);
      const rt = createNavigationRuntime<Payload>(g);
      rt.registerPredicateProvider((e) => e.payload?.predicate ?? null);
      expect(rt.fullPredicate('r/region-east/year-2021')).toEqual({
        and: [
          { field: 'region', equal: 'east' },
          { field: 'year', equal: 2021 },
        ],
      });
      dispose();
    });
  });

  it('returns empty AND when no providers', () => {
    createRoot((dispose) => {
      const g = buildHypergraph<Payload>([edge('r', ['x']), edge('x', [], ['r'])]);
      const rt = createNavigationRuntime<Payload>(g);
      expect(rt.fullPredicate('r/x')).toEqual({ and: [] });
      dispose();
    });
  });

  it('virtual node inherits predicate of its source child', () => {
    createRoot((dispose) => {
      const g = buildHypergraph<Payload>([
        edge('r', ['a', 'hangs']),
        edge('a', ['leaf'], ['r'], { field: 'g', equal: 'a' }),
        edge('hangs', ['leaf'], ['r'], { field: 'g', equal: 'hangs' }),
        edge('leaf', [], ['a', 'hangs'], { field: 'id', equal: 1 }),
      ]);
      const rt = createNavigationRuntime<Payload>(g);
      rt.registerPredicateProvider((e) => e.payload?.predicate ?? null);
      rt.focus('r/hangs/leaf');
      rt.moveFocus('up');
      const virtualId = rt.focusedNavId();
      expect(rt.fullPredicate(virtualId)).toEqual({
        and: [
          { field: 'g', equal: 'hangs' },
          { field: 'id', equal: 1 },
        ],
      });
      dispose();
    });
  });
});
