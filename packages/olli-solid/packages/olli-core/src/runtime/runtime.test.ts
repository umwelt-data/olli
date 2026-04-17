import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { buildHypergraph } from '../hypergraph/build.js';
import type { Hyperedge } from '../hypergraph/types.js';
import { createNavigationRuntime } from './runtime.js';
import { VIRTUAL_SUFFIX } from './navtree.js';

function edge(id: string, children: string[] = [], parents: string[] = []): Hyperedge {
  return { id, displayName: id, children, parents };
}

function singleParentTree() {
  return buildHypergraph([
    edge('r', ['a', 'b', 'c']),
    edge('a', ['a1'], ['r']),
    edge('b', [], ['r']),
    edge('c', [], ['r']),
    edge('a1', [], ['a']),
  ]);
}

function twoParentGraph() {
  // Pulley-Trace-B shape: leaf 'x' has two parents — root and 'hangs'.
  return buildHypergraph([
    edge('root', ['x', 'hangs']),
    edge('hangs', ['x'], ['root']),
    edge('x', [], ['root', 'hangs']),
  ]);
}

function threeParentGraph() {
  // Pulley-Trace-C "Floor" shape: floor has three parents.
  return buildHypergraph([
    edge('root', ['s', 'u', 'floor']),
    edge('s', ['floor'], ['root']),
    edge('u', ['floor'], ['root']),
    edge('floor', [], ['root', 's', 'u']),
  ]);
}

describe('NavigationRuntime — single-parent navigation', () => {
  it('initial focus is the first root', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(singleParentTree());
      expect(rt.focusedNavId()).toBe('r');
      dispose();
    });
  });

  it('Down descends to first child', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(singleParentTree());
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe('r/a');
      dispose();
    });
  });

  it('Right/Left clamps at boundaries', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(singleParentTree());
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe('r/a');
      rt.moveFocus('right');
      expect(rt.focusedNavId()).toBe('r/b');
      rt.moveFocus('right');
      expect(rt.focusedNavId()).toBe('r/c');
      rt.moveFocus('right');
      expect(rt.focusedNavId()).toBe('r/c');
      rt.moveFocus('left');
      expect(rt.focusedNavId()).toBe('r/b');
      rt.moveFocus('left');
      expect(rt.focusedNavId()).toBe('r/a');
      rt.moveFocus('left');
      expect(rt.focusedNavId()).toBe('r/a');
      dispose();
    });
  });

  it('Up returns directly to parent for single-parent edges', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(singleParentTree());
      rt.focus('r/a/a1');
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('r/a');
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('r');
      dispose();
    });
  });

  it('Up from root is a no-op', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(singleParentTree());
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('r');
      dispose();
    });
  });

  it('Down on a leaf is a no-op', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(singleParentTree());
      rt.focus('r/b');
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe('r/b');
      dispose();
    });
  });
});

describe('NavigationRuntime — multi-parent ascent via virtual parent-context node', () => {
  it('Up from a two-parent leaf synthesizes a virtual node', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(twoParentGraph());
      rt.focus('root/hangs/x');
      rt.moveFocus('up');
      const focused = rt.focusedNavId();
      expect(focused).toBe(`root/hangs/x${VIRTUAL_SUFFIX}`);
      const node = rt.getNavNode(focused)!;
      expect(node.kind).toBe('virtualParentContext');
      // default parent (the descended one) is first
      expect(node.childNavIds[0]).toBe('root/hangs');
      // the other option is the other parent's NavNode
      expect(node.childNavIds).toContain('root');
      dispose();
    });
  });

  it('Up again from the virtual node commits to the default parent', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(twoParentGraph());
      rt.focus('root/hangs/x');
      rt.moveFocus('up');
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('root/hangs');
      dispose();
    });
  });

  it('Right on a virtual node advances cursor; Up commits the new selection', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(twoParentGraph());
      rt.focus('root/hangs/x');
      rt.moveFocus('up');
      const virtualId = rt.focusedNavId();
      expect(rt.virtualCursor(virtualId)).toBe(0);
      rt.moveFocus('right');
      expect(rt.virtualCursor(virtualId)).toBe(1);
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('root');
      dispose();
    });
  });

  it('Down from a virtual node is a no-op', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(twoParentGraph());
      rt.focus('root/hangs/x');
      rt.moveFocus('up');
      const vid = rt.focusedNavId();
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe(vid);
      dispose();
    });
  });

  it('triple-parent case: virtual node lists all three with default first', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(threeParentGraph());
      rt.focus('root/s/floor');
      rt.moveFocus('up');
      const node = rt.getNavNode(rt.focusedNavId())!;
      expect(node.kind).toBe('virtualParentContext');
      expect(node.childNavIds[0]).toBe('root/s');
      expect(node.childNavIds).toHaveLength(3);
      expect(node.childNavIds).toContain('root');
      expect(node.childNavIds).toContain('root/u');
      dispose();
    });
  });
});

describe('NavigationRuntime — reactivity', () => {
  it('focusedNavId accessor reflects focus() calls synchronously', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(singleParentTree());
      expect(rt.focusedNavId()).toBe('r');
      rt.focus('r/b');
      expect(rt.focusedNavId()).toBe('r/b');
      rt.focus('r/c');
      expect(rt.focusedNavId()).toBe('r/c');
      dispose();
    });
  });

  it('navTree memo rebuilds when hypergraph is replaced', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(singleParentTree());
      const before = rt.navTree();
      expect(before.byNavId.has('r/a')).toBe(true);
      rt.setHypergraph(twoParentGraph());
      const after = rt.navTree();
      expect(after).not.toBe(before);
      expect(after.byNavId.has('r/a')).toBe(false);
      expect(after.byNavId.has('root/hangs/x')).toBe(true);
      dispose();
    });
  });

  it('setSelection updates the selection accessor', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(singleParentTree());
      rt.setSelection({ and: [{ field: 'x', equal: 1 }] });
      expect(rt.selection()).toEqual({ and: [{ field: 'x', equal: 1 }] });
      dispose();
    });
  });

  it('expand and collapse update the expanded signal', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(singleParentTree());
      rt.expand('r/a');
      expect(rt.expanded().has('r/a')).toBe(true);
      rt.collapse('r/a');
      expect(rt.expanded().has('r/a')).toBe(false);
      dispose();
    });
  });
});
