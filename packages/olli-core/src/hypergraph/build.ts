import type { Hyperedge, HyperedgeId, Hypergraph } from './types.js';

export class HypergraphValidationError extends Error {
  override name = 'HypergraphValidationError';
}

export function buildHypergraph<P>(edges: readonly Hyperedge<P>[]): Hypergraph<P> {
  const byId = new Map<HyperedgeId, Hyperedge<P>>();

  for (const edge of edges) {
    if (byId.has(edge.id)) {
      throw new HypergraphValidationError(`duplicate hyperedge id: ${edge.id}`);
    }
    byId.set(edge.id, edge);
  }

  for (const edge of edges) {
    for (const childId of edge.children) {
      const child = byId.get(childId);
      if (!child) {
        throw new HypergraphValidationError(
          `hyperedge ${edge.id} references unknown child ${childId}`,
        );
      }
      if (!child.parents.includes(edge.id)) {
        throw new HypergraphValidationError(
          `asymmetric relationship: ${edge.id} lists ${childId} as child, but ${childId} does not list ${edge.id} as parent`,
        );
      }
    }
    for (const parentId of edge.parents) {
      const parent = byId.get(parentId);
      if (!parent) {
        throw new HypergraphValidationError(
          `hyperedge ${edge.id} references unknown parent ${parentId}`,
        );
      }
      if (!parent.children.includes(edge.id)) {
        throw new HypergraphValidationError(
          `asymmetric relationship: ${edge.id} lists ${parentId} as parent, but ${parentId} does not list ${edge.id} as child`,
        );
      }
    }
  }

  detectCycle(edges, byId);

  const roots: HyperedgeId[] = [];
  for (const edge of edges) {
    if (edge.parents.length === 0) roots.push(edge.id);
  }

  return { edges: byId, roots };
}

function detectCycle<P>(
  edges: readonly Hyperedge<P>[],
  byId: ReadonlyMap<HyperedgeId, Hyperedge<P>>,
): void {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<HyperedgeId, 0 | 1 | 2>();
  for (const e of edges) color.set(e.id, WHITE);

  const visit = (id: HyperedgeId, stack: HyperedgeId[]): void => {
    const c = color.get(id);
    if (c === GRAY) {
      const cycle = [...stack.slice(stack.indexOf(id)), id].join(' -> ');
      throw new HypergraphValidationError(`cycle detected: ${cycle}`);
    }
    if (c === BLACK) return;
    color.set(id, GRAY);
    stack.push(id);
    const edge = byId.get(id);
    if (edge) {
      for (const childId of edge.children) visit(childId, stack);
    }
    stack.pop();
    color.set(id, BLACK);
  };

  for (const e of edges) visit(e.id, []);
}
