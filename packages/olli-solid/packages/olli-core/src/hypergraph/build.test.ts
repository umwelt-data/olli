import { describe, expect, it } from 'vitest';
import { buildHypergraph, HypergraphValidationError } from './build.js';
import type { Hyperedge } from './types.js';

function edge(
  id: string,
  children: string[] = [],
  parents: string[] = [],
): Hyperedge<unknown> {
  return { id, displayName: id, children, parents };
}

describe('buildHypergraph', () => {
  it('round-trips a valid symmetric graph', () => {
    const g = buildHypergraph([
      edge('a', ['b', 'c']),
      edge('b', [], ['a']),
      edge('c', [], ['a']),
    ]);
    expect(g.edges.size).toBe(3);
    expect(g.roots).toEqual(['a']);
  });

  it('preserves root order from input', () => {
    const g = buildHypergraph([edge('x'), edge('y'), edge('z')]);
    expect(g.roots).toEqual(['x', 'y', 'z']);
  });

  it('rejects duplicate ids', () => {
    expect(() => buildHypergraph([edge('a'), edge('a')])).toThrow(HypergraphValidationError);
  });

  it('rejects dangling child references', () => {
    expect(() => buildHypergraph([edge('a', ['ghost'])])).toThrow(/unknown child/);
  });

  it('rejects dangling parent references', () => {
    expect(() => buildHypergraph([edge('b', [], ['ghost'])])).toThrow(/unknown parent/);
  });

  it('rejects asymmetric child-without-parent-link', () => {
    expect(() => buildHypergraph([edge('a', ['b']), edge('b')])).toThrow(/asymmetric/);
  });

  it('rejects asymmetric parent-without-child-link', () => {
    expect(() => buildHypergraph([edge('a'), edge('b', [], ['a'])])).toThrow(/asymmetric/);
  });

  it('rejects cycles', () => {
    expect(() =>
      buildHypergraph([
        edge('a', ['b'], ['b']),
        edge('b', ['a'], ['a']),
      ]),
    ).toThrow(/cycle/);
  });

  it('accepts a multi-parent DAG (pulley Floor shape)', () => {
    const g = buildHypergraph([
      edge('root', ['a', 'b', 'c', 'floor']),
      edge('a', ['floor'], ['root']),
      edge('b', ['floor'], ['root']),
      edge('c', [], ['root']),
      edge('floor', [], ['root', 'a', 'b']),
    ]);
    const floor = g.edges.get('floor')!;
    expect(floor.parents).toEqual(['root', 'a', 'b']);
    expect(g.roots).toEqual(['root']);
  });
});
