import type { Hyperedge, HyperedgeId, Hypergraph } from './types.js';

export function descendants<P>(graph: Hypergraph<P>, id: HyperedgeId): HyperedgeId[] {
  const out: HyperedgeId[] = [];
  const seen = new Set<HyperedgeId>();
  const queue: HyperedgeId[] = [id];
  seen.add(id);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const edge = graph.edges.get(current);
    if (!edge) continue;
    for (const childId of edge.children) {
      if (seen.has(childId)) continue;
      seen.add(childId);
      out.push(childId);
      queue.push(childId);
    }
  }
  return out;
}

export function ancestors<P>(graph: Hypergraph<P>, id: HyperedgeId): HyperedgeId[] {
  const out: HyperedgeId[] = [];
  const seen = new Set<HyperedgeId>();
  const queue: HyperedgeId[] = [id];
  seen.add(id);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const edge = graph.edges.get(current);
    if (!edge) continue;
    for (const parentId of edge.parents) {
      if (seen.has(parentId)) continue;
      seen.add(parentId);
      out.push(parentId);
      queue.push(parentId);
    }
  }
  return out;
}

export function neighbors<P>(
  graph: Hypergraph<P>,
  id: HyperedgeId,
  parentId: HyperedgeId,
): HyperedgeId[] {
  const parent = graph.edges.get(parentId);
  if (!parent) return [];
  return parent.children.filter((c) => c !== id);
}

export function isLeaf<P>(edge: Hyperedge<P>): boolean {
  return edge.children.length === 0;
}
