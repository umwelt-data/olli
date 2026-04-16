import type { Hyperedge } from '../hypergraph/types.js';
import type { FieldPredicate, Selection } from '../predicate/types.js';

export type PredicateProvider<P> = (edge: Hyperedge<P>) => FieldPredicate | null;

export interface PredicateProviderRegistry<P> {
  register(provider: PredicateProvider<P>): void;
  list(): readonly PredicateProvider<P>[];
}

export function createPredicateProviderRegistry<P>(): PredicateProviderRegistry<P> {
  const providers: PredicateProvider<P>[] = [];
  return {
    register(p) {
      providers.push(p);
    },
    list() {
      return providers;
    },
  };
}

export function composeAncestorPredicates<P>(
  path: readonly string[],
  edges: ReadonlyMap<string, Hyperedge<P>>,
  providers: readonly PredicateProvider<P>[],
): Selection {
  const parts: FieldPredicate[] = [];
  for (const edgeId of path) {
    const edge = edges.get(edgeId);
    if (!edge) continue;
    for (const provider of providers) {
      const p = provider(edge);
      if (p) parts.push(p);
    }
  }
  return { and: parts };
}
