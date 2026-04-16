import { describe, expect, it } from 'vitest';
import { buildHypergraph } from './build.js';
import { ancestors, descendants, isLeaf, neighbors } from './traversal.js';
import type { Hyperedge } from './types.js';

function edge(id: string, children: string[] = [], parents: string[] = []): Hyperedge {
  return { id, displayName: id, children, parents };
}

const graph = buildHypergraph([
  edge('root', ['a', 'b']),
  edge('a', ['a1', 'shared'], ['root']),
  edge('b', ['shared'], ['root']),
  edge('a1', [], ['a']),
  edge('shared', [], ['a', 'b']),
]);

describe('traversal', () => {
  it('descendants yields everything under a node', () => {
    expect(descendants(graph, 'root').sort()).toEqual(['a', 'a1', 'b', 'shared']);
  });

  it('descendants handles shared children without duplication', () => {
    expect(descendants(graph, 'a').sort()).toEqual(['a1', 'shared']);
  });

  it('ancestors walks parents', () => {
    expect(ancestors(graph, 'shared').sort()).toEqual(['a', 'b', 'root']);
  });

  it('neighbors returns other children of the given parent', () => {
    expect(neighbors(graph, 'a', 'root')).toEqual(['b']);
    expect(neighbors(graph, 'shared', 'a')).toEqual(['a1']);
  });

  it('isLeaf is true only for childless edges', () => {
    expect(isLeaf(graph.edges.get('a1')!)).toBe(true);
    expect(isLeaf(graph.edges.get('a')!)).toBe(false);
  });
});
