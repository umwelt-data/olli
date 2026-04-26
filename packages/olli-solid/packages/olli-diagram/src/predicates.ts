import type { PredicateProvider } from 'olli-core';
import type { DiagramPayload } from './spec/types.js';

export function diagramPredicateProvider(): PredicateProvider<DiagramPayload> {
  return (edge) => {
    const p = edge.payload;
    if (!p) return null;

    if (p.sourceElement) {
      return { field: 'id', equal: p.sourceElement.id };
    }

    if (p.sourceRelation) {
      const rel = p.sourceRelation;
      let memberIds: string[];
      switch (rel.kind) {
        case 'connection':
          memberIds = [...rel.endpoints];
          break;
        case 'containment':
          memberIds = [rel.container, ...rel.contents];
          break;
        case 'alignment':
        case 'distribution':
        case 'grouping':
          memberIds = [...rel.members];
          break;
      }
      return { field: 'id', oneOf: memberIds };
    }

    return null;
  };
}
