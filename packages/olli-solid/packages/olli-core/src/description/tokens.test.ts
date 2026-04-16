import { createRoot } from 'solid-js';
import { describe as testSuite, expect, it } from 'vitest';
import { buildHypergraph } from '../hypergraph/build.js';
import type { Hyperedge } from '../hypergraph/types.js';
import { createNavigationRuntime } from '../runtime/runtime.js';
import type { TokenContext } from './tokens.js';
import {
  childrenToken,
  indexToken,
  levelToken,
  nameToken,
  parentContextsToken,
  parentToken,
  VIRTUAL_ROLE,
} from './tokens.js';

function edge(
  id: string,
  displayName: string,
  children: string[] = [],
  parents: string[] = [],
  description?: string,
): Hyperedge {
  const e: Hyperedge = { id, displayName, children, parents };
  if (description) e.description = description;
  return e;
}

function smallGraph() {
  return buildHypergraph([
    edge('root', 'Diagram', ['a', 'b'], [], 'Top of tree.'),
    edge('a', 'Group A', ['a1', 'a2'], ['root']),
    edge('a1', 'Leaf A1', [], ['a']),
    edge('a2', 'Leaf A2', [], ['a']),
    edge('b', 'Group B', [], ['root']),
  ]);
}

function buildContext<P>(runtime: ReturnType<typeof createNavigationRuntime<P>>, navId: string): TokenContext<P> {
  const navNode = runtime.getNavNode(navId)!;
  const edge =
    navNode.hyperedgeId ? runtime.getHyperedge(navNode.hyperedgeId) ?? null : null;
  return {
    navNode,
    edge,
    hypergraph: runtime.hypergraph(),
    runtime,
    selection: runtime.selection(),
    fullPredicate: runtime.fullPredicate(navId),
  };
}

testSuite('built-in tokens', () => {
  it('nameToken returns displayName (short) and includes description (long)', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      const ctx = buildContext(rt, 'root');
      const v = nameToken().compute(ctx);
      expect(v.short).toBe('Diagram');
      expect(v.long).toBe('Diagram. Top of tree.');
      dispose();
    });
  });

  it('indexToken reports "n of total"', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      expect(indexToken().compute(buildContext(rt, 'root/a')).short).toBe('1 of 2');
      expect(indexToken().compute(buildContext(rt, 'root/b')).short).toBe('2 of 2');
      expect(indexToken().compute(buildContext(rt, 'root')).short).toBe('');
      dispose();
    });
  });

  it('levelToken reports depth', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      expect(levelToken().compute(buildContext(rt, 'root')).short).toBe('level 1');
      expect(levelToken().compute(buildContext(rt, 'root/a/a1')).short).toBe('level 3');
      dispose();
    });
  });

  it('parentToken names the parent', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      expect(parentToken().compute(buildContext(rt, 'root/a')).short).toBe('Diagram');
      expect(parentToken().compute(buildContext(rt, 'root/a/a1')).short).toBe('Group A');
      expect(parentToken().compute(buildContext(rt, 'root')).short).toBe('');
      dispose();
    });
  });

  it('childrenToken counts and lists children', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      const ctx = buildContext(rt, 'root/a');
      const v = childrenToken().compute(ctx);
      expect(v.short).toBe('2 children');
      expect(v.long).toBe('2 children: Leaf A1, Leaf A2');
      expect(childrenToken().compute(buildContext(rt, 'root/a/a1')).short).toBe('');
      dispose();
    });
  });

  it('parentContextsToken describes a virtual node', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(
        buildHypergraph([
          edge('root', 'Diagram', ['x', 'hangs']),
          edge('hangs', 'Hangs relation', ['x'], ['root']),
          edge('x', 'Box B1', [], ['root', 'hangs']),
        ]),
      );
      rt.focus('root/hangs/x');
      rt.moveFocus('up'); // synthesize virtual
      const virtualNavId = rt.focusedNavId();
      const virtualNode = rt.getNavNode(virtualNavId)!;
      const ctx: TokenContext<unknown> = {
        navNode: virtualNode,
        edge: null,
        hypergraph: rt.hypergraph(),
        runtime: rt,
        selection: rt.selection(),
        fullPredicate: rt.fullPredicate(virtualNavId),
      };
      const v = parentContextsToken().compute(ctx);
      expect(v.short).toContain('Parent contexts for Box B1');
      expect(v.long).toContain('Default: Hangs relation');
      expect(v.long).toContain('Other options: Diagram');
      // check applicableRoles
      expect(parentContextsToken().applicableRoles).toEqual([VIRTUAL_ROLE]);
      dispose();
    });
  });
});
