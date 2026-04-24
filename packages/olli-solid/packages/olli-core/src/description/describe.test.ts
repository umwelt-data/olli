import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { buildHypergraph } from '../hypergraph/build.js';
import type { Hyperedge } from '../hypergraph/types.js';
import { createNavigationRuntime } from '../runtime/runtime.js';
import { VIRTUAL_SUFFIX } from '../runtime/navtree.js';

function edge(
  id: string,
  displayName: string,
  children: string[] = [],
  parents: string[] = [],
): Hyperedge {
  return { id, displayName, children, parents };
}

function smallGraph() {
  return buildHypergraph([
    edge('root', 'Diagram', ['a', 'b']),
    edge('a', 'Group A', ['a1'], ['root']),
    edge('a1', 'Leaf A1', [], ['a']),
    edge('b', 'Group B', [], ['root']),
  ]);
}

describe('describe() — default recipe rendering', () => {
  it('produces a non-empty description composed from default tokens', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      const desc = rt.getDescriptionFor('root/a')();
      expect(desc).toContain('Group A');
      expect(desc).toContain('1 of 2');
      expect(desc).toContain('Diagram'); // parent token
      expect(desc).toContain('1 child'); // children token
      dispose();
    });
  });

  it('root node omits tokens that have no value', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      const desc = rt.getDescriptionFor('root')();
      expect(desc).toContain('Diagram');
      // no parent/index should appear
      expect(desc).not.toContain('of');
      dispose();
    });
  });
});

describe('describe() — customization', () => {
  it('changing the recipe (presence) updates output without runtime rebuild', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      const accessor = rt.getDescriptionFor('root/a');
      const before = accessor();
      expect(before).toContain('Group A');

      rt.customization.setFor('', {
        role: '',
        recipe: [{ token: 'name', brevity: 'short' }],
        duration: 'persistent',
      });
      const after = accessor();
      expect(after).toBe('Group A');
      dispose();
    });
  });

  it('changing brevity switches between short and long forms', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(
        buildHypergraph([
          edge('root', 'Diagram'),
        ]).constructor === undefined
          ? smallGraph()
          : smallGraph(),
      );
      const accessor = rt.getDescriptionFor('root/a');
      rt.customization.setFor('', {
        role: '',
        recipe: [{ token: 'children', brevity: 'short' }],
        duration: 'persistent',
      });
      expect(accessor()).toBe('1 child');
      rt.customization.setFor('', {
        role: '',
        recipe: [{ token: 'children', brevity: 'long' }],
        duration: 'persistent',
      });
      expect(accessor()).toBe('1 child: Leaf A1');
      dispose();
    });
  });

  it('reordering tokens reorders output', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      const accessor = rt.getDescriptionFor('root/a');
      rt.customization.setFor('', {
        role: '',
        recipe: [
          { token: 'parent', brevity: 'short' },
          { token: 'name', brevity: 'short' },
        ],
        duration: 'persistent',
      });
      expect(accessor()).toBe('Diagram. Group A');
      rt.customization.setFor('', {
        role: '',
        recipe: [
          { token: 'name', brevity: 'short' },
          { token: 'parent', brevity: 'short' },
        ],
        duration: 'persistent',
      });
      expect(accessor()).toBe('Group A. Diagram');
      dispose();
    });
  });

  it('unknown tokens are skipped silently', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      rt.customization.setFor('', {
        role: '',
        recipe: [
          { token: 'nonexistent', brevity: 'short' },
          { token: 'name', brevity: 'short' },
        ],
        duration: 'persistent',
      });
      expect(rt.getDescriptionFor('root/a')()).toBe('Group A');
      dispose();
    });
  });
});

describe('describe() — presets', () => {
  it('applying a preset updates active customizations for its roles', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      const accessor = rt.getDescriptionFor('root/a');
      rt.customization.registerPreset('minimal', [
        {
          role: '',
          recipe: [{ token: 'name', brevity: 'short' }],
          duration: 'persistent',
        },
      ]);
      rt.customization.applyPreset('minimal');
      expect(accessor()).toBe('Group A');
      expect(rt.customization.activePresetName()).toBe('minimal');
      dispose();
    });
  });
});

describe('describe() — virtual parent-context sibling', () => {
  it('renders the per-option parentContext description', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(
        buildHypergraph([
          edge('root', 'Diagram', ['x', 'hangs']),
          edge('hangs', 'Hangs relation', ['x'], ['root']),
          edge('x', 'Box B1', [], ['root', 'hangs']),
        ]),
      );
      rt.focus('root/hangs/x');
      rt.moveFocus('up');
      const defaultId = rt.focusedNavId();
      expect(defaultId).toBe(`root/hangs/x${VIRTUAL_SUFFIX}0`);
      const defaultDesc = rt.getDescriptionFor(defaultId)();
      expect(defaultDesc).toContain('Parent context for Box B1');
      expect(defaultDesc).toContain('Hangs relation');
      expect(defaultDesc).toContain('(default)');

      rt.moveFocus('right');
      const otherId = rt.focusedNavId();
      expect(otherId).toBe(`root/hangs/x${VIRTUAL_SUFFIX}1`);
      const otherDesc = rt.getDescriptionFor(otherId)();
      expect(otherDesc).toContain('Parent context for Box B1');
      expect(otherDesc).toContain('Diagram');
      expect(otherDesc).not.toContain('(default)');
      dispose();
    });
  });
});

describe('describe() — reactivity', () => {
  it('memo re-reads after setSelection', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      const accessor = rt.getDescriptionFor('root/a');
      const first = accessor();
      rt.setSelection({ and: [{ field: 'q', equal: 1 }] });
      const second = accessor();
      // default recipe doesn't include selection-sensitive tokens, but the memo
      // should not throw and should still produce the same description
      expect(second).toBe(first);
      dispose();
    });
  });

  it('memo picks up hypergraph replacement', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(smallGraph());
      const accessor = rt.getDescriptionFor('root');
      expect(accessor()).toContain('Diagram');
      rt.setHypergraph(
        buildHypergraph([edge('root', 'Other diagram')]),
      );
      expect(accessor()).toContain('Other diagram');
      dispose();
    });
  });
});
