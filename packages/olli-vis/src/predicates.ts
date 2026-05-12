import type { PredicateProvider } from 'olli-core';
import type { VisPayload } from './spec/types.js';

export function visPredicateProvider(): PredicateProvider<VisPayload> {
  return (edge) => {
    const p = edge.payload;
    if (!p) return null;
    return p.predicate ?? null;
  };
}
