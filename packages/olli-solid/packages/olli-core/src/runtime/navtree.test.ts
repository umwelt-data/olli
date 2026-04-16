import { describe, expect, it } from 'vitest';
import { buildHypergraph } from '../hypergraph/build.js';
import type { Hyperedge } from '../hypergraph/types.js';
import { buildNavTree } from './navtree.js';

function edge(id: string, children: string[] = [], parents: string[] = []): Hyperedge {
  return { id, displayName: id, children, parents };
}

describe('buildNavTree', () => {
  it('produces a tree isomorphic to a simple single-parent hypergraph', () => {
    const g = buildHypergraph([
      edge('a', ['b', 'c']),
      edge('b', ['d'], ['a']),
      edge('c', [], ['a']),
      edge('d', [], ['b']),
    ]);
    const tree = buildNavTree(g);
    expect(tree.roots).toEqual(['a']);
    expect([...tree.byNavId.keys()].sort()).toEqual(['a', 'a/b', 'a/b/d', 'a/c']);
    expect(tree.byNavId.get('a/b')!.parentNavId).toBe('a');
    expect(tree.byNavId.get('a/b/d')!.path).toEqual(['a', 'b', 'd']);
  });

  it('materializes a multi-parent hyperedge once per parent path', () => {
    const g = buildHypergraph([
      edge('root', ['p', 'q']),
      edge('p', ['shared'], ['root']),
      edge('q', ['shared'], ['root']),
      edge('shared', [], ['p', 'q']),
    ]);
    const tree = buildNavTree(g);
    const ids = [...tree.byNavId.keys()].sort();
    expect(ids).toEqual(['root', 'root/p', 'root/p/shared', 'root/q', 'root/q/shared']);
    const sharedNavs = tree.hyperedgeToNavIds.get('shared');
    expect(sharedNavs).toEqual(['root/p/shared', 'root/q/shared']);
  });

  it('tracks distinct parentNavId for each NavNode occurrence', () => {
    const g = buildHypergraph([
      edge('root', ['p', 'q']),
      edge('p', ['shared'], ['root']),
      edge('q', ['shared'], ['root']),
      edge('shared', [], ['p', 'q']),
    ]);
    const tree = buildNavTree(g);
    expect(tree.byNavId.get('root/p/shared')!.parentNavId).toBe('root/p');
    expect(tree.byNavId.get('root/q/shared')!.parentNavId).toBe('root/q');
  });

  it('multiple roots appear as top-level entries', () => {
    const g = buildHypergraph([edge('a'), edge('b')]);
    const tree = buildNavTree(g);
    expect(tree.roots).toEqual(['a', 'b']);
  });
});
